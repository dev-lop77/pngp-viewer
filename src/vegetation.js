import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { attachAtmo } from './atmosphere.js';
import { MODEL_DETAIL } from './modeldetail.js';
import { FOREST_MASK } from './forest.js';
import { HEIGHT_TIER, HEIGHT_TIER_RECT, HEIGHT_TIER_MIX, heightTierGlsl } from './heighttier.js';
import { SNOW_LEVEL, snowGlsl, snowColorGlsl } from './snow.js';

// Trees (phase 6). Placement happens entirely in the vertex shader, so walking
// or flying costs nothing on the CPU - there is no per-frame scatter, no
// rebuild, and therefore no hitch when the camera crosses a cell boundary.
//
// The trick is a wrapped window. Each instance owns a fixed jittered offset
// inside a WINDOW_M square; the shader moves it to whichever copy of that square
// is nearest the camera. Because the shift is always an exact multiple of
// WINDOW_M, every tree lands on a fixed world lattice: its position, height and
// tint are stable as you move, so nothing shimmers or reshuffles.
//
// Whether a slot actually holds a tree comes from the OSM canopy mask
// (src/forest.js) compared against the slot's own random draw, so a forest
// margin thins out gradually instead of ending on a straight line. Slope was
// already baked into the mask at build time (tools/build-forest.mjs), which is
// why nothing here samples the terrain gradient.
// Density and draw distance are the two performance levers in this file, and
// they trade against each other. A first pass at 10 m spacing over a 520 m
// radius drew isolated trees rather than forest - one tree per ~210 m2 where
// real stands run one per 10-20 m2 - so the pitch came down and the radius with
// it, since trees past ~400 m are only a few pixels tall and the terrain's own
// canopy tint carries the look from there outward.
const WINDOW_M = 1000; // wrap period: the window is 1000 x 1000 m centred on the camera
const SPACING_M = 6; // nominal grid pitch -> (1000/6)^2 = ~27,700 instances
const JITTER = 0.45; // of a cell, so the grid never reads as rows
const VISIBLE_M = 440; // beyond this, scale is zero (must stay under WINDOW_M/2)
const FADE_START_M = 300; // trees grow in from zero between here and VISIBLE_M
const TREE_MIN_H = 5;
const TREE_MAX_H = 16;
// Trees really are stunted approaching the treeline, so height scales down over
// the subalpine band. Costs nothing - the elevation is already sampled.
const STUNT_FROM_M = 1600;
const STUNT_TO_M = 2200;
const STUNT_SCALE = 0.55;
const RADIUS_MIN = 0.16; // as a fraction of height - conifer proportions
const RADIUS_MAX = 0.26;
// Trees read the true bilinear heightfield while the terrain draws a
// triangle-interpolated version of it; they differ by 0.38 m on average
// (tools/test-rendered-height.mjs). Sinking the base absorbs that without a
// visible gap. The places where the two diverge worst are steep, and steep
// ground was already removed from the mask, so this is a small residual.
const SINK_M = 1.5;
const CONE_SEGMENTS = 7; // odd, so a stand doesn't line up into obvious symmetry
// Solved backwards from the intended on-screen colour, exactly like the terrain
// bands - see tools/dev/solve-albedo.mjs and the warning in terrain.js. This is
// albedo: it looks too light as a swatch and must not be "corrected".
const CANOPY_COLOR = 0x6c8761;
// Snow-laden trees (2026-08-11). Until then the ground went white in a snowstorm
// and the forest on it stayed summer green, which was the most obvious thing left
// wrong after the ground snow landed - and the user said so first.
//
// How much of the way to white a fully snowed tree goes, at its base and at its
// crown. Not uniform, because a conifer is not: the exposed crown carries a real
// load while the lower branches are sheltered by the ones above them, and the
// gradient is most of what makes a flocked tree read as flocked rather than as a
// white cone. Neither end reaches 1.0 - even under snow a spruce keeps dark green
// showing through, and the shaded undersides of the tiers are why.
const TREE_SNOW_BASE = 0.3;
const TREE_SNOW_CROWN = 0.85;

function glsl(n) {
  const s = n.toPrecision(12);
  return s.includes('.') || s.includes('e') ? s : `${s}.0`;
}

function patch(source, marker, replacement) {
  if (!source.includes(marker)) {
    throw new Error(`vegetation.js: shader marker not found: ${marker}`);
  }
  return source.replace(marker, replacement);
}

// Deterministic layout, so the forest is identical on every load and between
// machines. Math.random() would reshuffle every reload.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The window's jittered offsets, built once and shared. src/wildlife.js needs the
// same tree positions on the CPU (a squirrel hides behind a specific trunk), and
// the only safe way to agree with the shader is to read the very same numbers
// rather than to re-derive them.
let latticeCache = null;

function treeLattice() {
  if (latticeCache) return latticeCache;
  const perSide = Math.round(WINDOW_M / SPACING_M);
  const offsets = new Float32Array(perSide * perSide * 2);
  const random = mulberry32(0x9e3779b9);
  for (let iz = 0; iz < perSide; iz++) {
    for (let ix = 0; ix < perSide; ix++) {
      const i = iz * perSide + ix;
      offsets[i * 2] = (ix + 0.5 + (random() - 0.5) * 2 * JITTER) * SPACING_M;
      offsets[i * 2 + 1] = (iz + 0.5 + (random() - 0.5) * 2 * JITTER) * SPACING_M;
    }
  }
  latticeCache = { offsets, perSide };
  return latticeCache;
}

export { SPACING_M as TREE_SPACING_M };
// Exported for tools/test-snow.mjs, so it asserts against these numbers rather
// than a second copy that could drift from them.
export { CANOPY_COLOR, TREE_SNOW_BASE, TREE_SNOW_CROWN };
// Same reason as wildlife.js's MODEL_BUILDERS export: the high-resolution model
// preview (tools/dev/model-candidates.js) must draw the CURRENT tree from the
// shipped numbers, not from a second copy of them.
export { CONE_SEGMENTS, TREE_MIN_H, TREE_MAX_H, RADIUS_MIN, RADIUS_MAX };
// And the fine tree itself, so the bench draws the model that SHIPS rather than a
// second copy of it - the copy is how the two quietly stop being the same tree.
export { tieredTreeParts };

// Where the tree nearest (x, z) actually stands, applying the same wrap the
// vertex shader does, from the same offsets - so this is the trunk the user can
// see, not an approximation of it.
//
// The camera is a parameter because the shader's window follows it: a slot's
// world position is o + floor((camera - o)/WINDOW_M + 0.5) * WINDOW_M. That means
// the answer is only meaningful for points NEAR the camera. At half a window
// (500 m) out, which copy is in play flips, and a tree there is beyond the tree
// draw distance anyway - so callers must stay well inside that, as wildlife.js's
// 130 m squirrels do.
//
// O(9): the lattice is regular with at most JITTER of a cell of jitter, so the
// nearest instance can only be in the 3x3 of grid indices around the point.
export function nearestTree(x, z, camX, camZ) {
  const { offsets, perSide } = treeLattice();
  const fold = (v) => ((v % WINDOW_M) + WINDOW_M) % WINDOW_M;
  const gx = Math.floor(fold(x) / SPACING_M);
  const gz = Math.floor(fold(z) / SPACING_M);

  let best = null;
  let bestDistSq = Infinity;
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      // Wrapping the index as well as the coordinate: the window tiles, so grid
      // column -1 is column perSide-1 of the copy next door.
      const ix = ((gx + dx) % perSide + perSide) % perSide;
      const iz = ((gz + dz) % perSide + perSide) % perSide;
      const i = iz * perSide + ix;
      const ox = offsets[i * 2];
      const oz = offsets[i * 2 + 1];
      const sx = ox + Math.floor((camX - ox) / WINDOW_M + 0.5) * WINDOW_M;
      const sz = oz + Math.floor((camZ - oz) / WINDOW_M + 0.5) * WINDOW_M;
      const distSq = (sx - x) ** 2 + (sz - z) ** 2;
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        best = { x: sx, z: sz, index: i };
      }
    }
  }
  return { ...best, distanceM: Math.sqrt(bestDistSq) };
}

// The optional high-detail tree (accepted by the user 2026-08-17 as "3 tiers +
// trunk", chosen on tools/dev/model-preview.html against a 5-tier version they
// found too much - "vira su pagoda" - and a smooth 16-sided cone).
//
// 41 triangles against the cone's 7. Unit height AND unit radius like the cone,
// because the vertex shader scales those two by different amounts
// (`position.x * treeR` against `position.y * treeH`) and a geometry that was not
// would be drawn as wide as it is tall. position.y still runs 0 at the ground to 1
// at the tip, which is what the snow-load gradient reads, so that keeps working
// unchanged.
const HI_TIERS = 3;
const HI_RADIAL = 7;
// How far out the fine tree is drawn, and it is the whole reason this option is
// affordable. MEASURED first (tools/dev/probe-models.mjs, 2026-08-17): giving the
// 41-triangle model to all 27,889 slots asked the renderer for +993,344 triangles,
// 2.11x the whole scene - and of that, +734 were the animals. Trees out at 440 m are
// a few pixels tall and were being drawn at full detail.
//
// Inside this radius the fine mesh draws and the standard one holds a hole; outside,
// the reverse. The swap is HARD rather than cross-faded: a fade would have both
// models at half height at the midpoint, which is two half trees in one spot, while
// a hard swap changes only the silhouette and leaves the size alone.
//
// 150 m puts an 11 m tree at about 57 px, where the notches between tiers are a few
// pixels of one tree among a wood. That is the number to raise if the handover ever
// shows - the cost grows with its square, so 150 -> 250 m is 2.8x the instances.
const HI_NEAR_M = 150;
// Refill the near set only after the camera has moved this far, exactly as
// wildlife.js's rescan does. Without it this would be 27,889 distance tests every
// frame, in a module whose header promises that walking costs nothing on the CPU.
const HI_REFILL_M = 8;
// Sized from the geometry rather than picked: every lattice slot inside the fill
// radius must fit, or a tree would be dropped for a further one. Density is one slot
// per SPACING_M^2, and the 1.2 is headroom for the lattice's jitter.
const HI_CAPACITY = Math.ceil((Math.PI * (HI_NEAR_M + HI_REFILL_M) ** 2 / SPACING_M ** 2) * 1.2);
function tieredTreeParts() {
  const parts = [];
  // A visible trunk, which the cone has no notion of - it is what stops the model
  // reading as a cone in the first place.
  const trunk = new THREE.CylinderGeometry(0.028, 0.052, 1, 5, 1);
  trunk.translate(0, 0.5, 0);
  parts.push(trunk);
  // Tiers shorter and narrower going up, overlapping so no gap shows between them,
  // and starting above the ground because a spruce is bare at the foot of its trunk
  // far more often than it is skirted to the floor.
  const base = 0.12;
  for (let i = 0; i < HI_TIERS; i++) {
    const t = i / HI_TIERS;
    const y0 = base + (1 - base) * t;
    const h = ((1 - base) / HI_TIERS) * 1.85; // >1 tier-height, so consecutive tiers overlap
    const r = (1 - t) * 0.98 + 0.06;
    const cone = new THREE.ConeGeometry(r, h, HI_RADIAL, 1, true);
    cone.translate(0, y0 + h / 2, 0);
    parts.push(cone);
  }
  return parts;
}

export function createVegetation({ manifest, heightTexture }) {
  const { xmin, ymin, xmax, ymax } = manifest.bboxCrsUnits;
  const { min: elevMin, max: elevMax } = manifest.elevationRangeM;
  const { y: resY } = manifest.resolutionMPerPx; // north-south metres per height texel
  const worldWidth = xmax - xmin;
  const worldDepth = ymax - ymin;

  const { offsets, perSide } = treeLattice();
  const count = perSide * perSide;

  // Open-ended: the base disc is never visible (it sits in the ground) and
  // skipping it saves a third of the triangles.
  const cone = new THREE.ConeGeometry(1, 1, CONE_SEGMENTS, 1, true);
  cone.translate(0, 0.5, 0); // base at y=0, apex at y=1, so scaling by height just works

  // ONE offsets attribute for both levels of detail. Shared rather than copied so
  // the two models cannot describe two different forests: every tree stands in the
  // same place whichever mesh draws it, and switching cannot move one.
  const offsetAttr = new THREE.InstancedBufferAttribute(offsets, 2);

  function instanced(source, offsets2, instanceCount) {
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = source.index;
    geometry.setAttribute('position', source.attributes.position);
    geometry.setAttribute('normal', source.attributes.normal);
    geometry.setAttribute('uv', source.attributes.uv);
    geometry.setAttribute('aOffset', offsets2);
    geometry.instanceCount = instanceCount;
    return geometry;
  }

  // The standard mesh keeps the whole lattice and places it in the shader, as it
  // always has. The fine mesh gets a SHORT buffer the CPU refills with the world
  // positions of the slots near the camera - so its instance count is about 2,000
  // rather than 27,889, and that is the difference between this option costing
  // 2.11x the scene's triangles and costing a twentieth of that.
  const nearOffsets = new THREE.InstancedBufferAttribute(new Float32Array(HI_CAPACITY * 2), 2);
  nearOffsets.setUsage(THREE.DynamicDrawUsage);

  const geometry = instanced(cone, offsetAttr, count);
  const geometryHi = instanced(
    BufferGeometryUtils.mergeGeometries(tieredTreeParts()), nearOffsets, 0,
  );

  const material = new THREE.MeshStandardMaterial({
    color: CANOPY_COLOR,
    roughness: 0.95,
    metalness: 0,
    // Normals come from screen-space derivatives instead of the normal
    // attribute, which is what we want: the shader scales each cone
    // non-uniformly, and flat shading stays correct through that for free
    // rather than needing an inverse-transpose fix per instance.
    flatShading: true,
  });

  const HELPERS = /* glsl */ `
    attribute vec2 aOffset;
    uniform sampler2D uHeightMap;
${heightTierGlsl()}
    uniform sampler2D uForestMask;
    varying float vTreeTint;
    varying float vTreeSnow;
${snowGlsl()}

    // MUST agree with terrain.js's terrainUv()/terrainElevation(). Kept separate
    // rather than shared because the two sample different uniforms; the tree
    // bases in tools/test-vegetation.mjs are compared against the terrain's own
    // sampler, so a disagreement here fails a test instead of going unnoticed.
    vec2 vegUv( vec2 wxz ) {
      return vec2( ( wxz.x + ${glsl(worldWidth / 2)} ) / ${glsl(worldWidth)},
                   ( ${glsl(worldDepth / 2)} - wxz.y ) / ${glsl(worldDepth)} );
    }
    // Takes UV for the texture and WORLD METRES for the tier, because the two are
    // addressed differently and passing only one of them is how a tree ends up
    // standing on a surface the terrain no longer draws.
    float vegElevation( vec2 uv, vec2 wxz ) {
      vec2 s = texture2D( uHeightMap, uv ).rg;
      return ( ( s.r * 256.0 + s.g ) / 257.0 ) * ${glsl(elevMax - elevMin)} + ${glsl(elevMin)}
           + heightTierM( wxz );
    }
    // Hash without sin(): world coordinates reach +/-42 km here, and sin() of a
    // number that large loses enough float precision to produce visible
    // repetition. This one is stable over the whole bbox.
    float vegHash( vec2 p ) {
      vec3 p3 = fract( vec3( p.xyx ) * 0.1031 );
      p3 += dot( p3, p3.yzx + 33.33 );
      return fract( ( p3.x + p3.y ) * p3.z );
    }
  `;

  // `wrapped` is what separates the two levels of detail. The standard mesh owns the
  // whole lattice and derives each slot's world position by wrapping, as it always
  // has. The fine mesh is handed positions the CPU has ALREADY placed, so wrapping
  // them again would move every near tree by a kilometre.
  //
  // Everything after the position is identical on purpose, and vegCell is why: the
  // cell index comes from the world position, so both meshes hash the same tree to
  // the same height, radius and tint. If they did not, swapping level of detail
  // would change a tree's size, and a hard swap could then never be invisible.
  const placeGlsl = ({ wrapped }) => /* glsl */ `
    ${wrapped
    ? `// Nearest copy of the window to the camera. The shift is an exact multiple
    // of WINDOW_M, so every tree sits on a fixed world lattice.
    vec2 slot = aOffset + floor( ( cameraPosition.xz - aOffset ) / ${glsl(WINDOW_M)} + 0.5 ) * ${glsl(WINDOW_M)};`
    : `vec2 slot = aOffset; // already the world position, written per refill by the CPU`}
    vec2 vegCell = floor( slot / ${glsl(SPACING_M)} );
    vec2 uv = vegUv( slot );

    float wood = texture2D( uForestMask, uv ).r;
    float draw = vegHash( vegCell );
    // Coverage as a probability: 40% canopy keeps 40% of slots, so margins thin
    // out. A threshold test would give hard edges at the mask's own resolution.
    //
    // STRICTLY GREATER, and the strictness is the whole point. This was
    // step( draw, wood ), which is wood >= draw - so a slot whose draw is
    // EXACTLY 0.0 grew a tree on ground with no canopy at all, anywhere in the
    // park. That is not a freak value: vegHash loses most of its range to float32
    // at world coordinates of tens of kilometres, and over the 16,997 slots inside
    // the draw radius above the Gliairetta it takes only 5,220 distinct values,
    // NINE of them exactly zero (tools/dev/probe-treeline.mjs). Nine conifers on a
    // glacier, which is how the user found it. Reversing the test costs nothing and
    // makes "no wood here" mean it: 0.0 > 0.0 is false.
    float exists = 1.0 - step( wood, draw );

    float dist = length( cameraPosition.xz - slot );
    float near = 1.0 - smoothstep( ${glsl(FADE_START_M)}, ${glsl(VISIBLE_M)}, dist );
    ${wrapped
    ? `// The hole the fine mesh fills. uNearHole is 0 unless the high-detail option
    // is on, so with it off this multiplies by one and the standard mesh behaves
    // exactly as it did before the option existed. step(), not smoothstep():
    // whichever mesh owns a tree owns it completely, so no tree is ever drawn twice
    // and none is drawn at half height.
    near *= step( uNearHole, dist );`
    : `// Beyond the handover this mesh's trees belong to the standard one. The two
    // tests are exact complements of each other, so every tree is drawn once.
    near *= 1.0 - step( ${glsl(HI_NEAR_M)}, dist );`}

    float elev = vegElevation( uv, slot );
    float stunt = mix( 1.0, ${glsl(STUNT_SCALE)},
                       smoothstep( ${glsl(STUNT_FROM_M)}, ${glsl(STUNT_TO_M)}, elev ) );
    float treeH = mix( ${glsl(TREE_MIN_H)}, ${glsl(TREE_MAX_H)}, vegHash( vegCell + 19.7 ) )
                * stunt * exists * near;
    float treeR = treeH * mix( ${glsl(RADIUS_MIN)}, ${glsl(RADIUS_MAX)}, vegHash( vegCell + 41.3 ) );
    vTreeTint = mix( 0.78, 1.18, vegHash( vegCell + 7.1 ) );

    // Snow load, from the very same snowCover() the ground under this tree uses
    // (src/snow.js). Sharing it is the whole point: a tree that decided for
    // itself would stand green on white ground somewhere along the snowline,
    // which is the fault this fixes, just moved.
    //
    // Aspect comes from two extra taps of the height texture, one texel north and
    // one south. Two, not four: the exact normal's z divides by the full gradient
    // length, and leaving the east-west slope out of that normalisation costs at
    // most ~5 m of effective elevation on ground gentle enough to grow trees (the
    // mask holds nothing above 45 deg) against a term that spans 320 m.
    float dv = ${glsl(resY)} / ${glsl(worldDepth)};
    float gradZ = ( vegElevation( uv + vec2( 0.0, dv ), slot - vec2( 0.0, ${glsl(resY)} ) )
                  - vegElevation( uv - vec2( 0.0, dv ), slot + vec2( 0.0, ${glsl(resY)} ) ) )
                / ${glsl(2 * resY)};
    float aspectZ = gradZ * inversesqrt( 1.0 + gradZ * gradZ );
    // No bare term: slope was baked out of the mask at build time, so there are
    // no trees on ground too steep to hold snow to begin with.
    // position.y runs 0 at the base to 1 at the apex (the cone is translated so
    // it does), which is the crown gradient for free.
    vTreeSnow = snowCover( slot, elev, aspectZ, 0.0 )
              * mix( ${glsl(TREE_SNOW_BASE)}, ${glsl(TREE_SNOW_CROWN)}, position.y );

    // treeH = 0 collapses every vertex onto the base point, so a slot that has
    // no tree draws degenerate triangles and costs no fragments.
    vec3 transformed = vec3(
      position.x * treeR + slot.x,
      position.y * treeH + elev - ${glsl(SINK_M)},
      position.z * treeR + slot.y
    );
  `;

  // The near-hole uniform lives on a holder shared with applyDetail(), for the same
  // reason every other cross-module value in this project does: assigning to
  // shader.uniforms after compilation reaches only whichever material instance
  // happened to compile, and Vite's HMR can give you two.
  const NEAR_HOLE = { value: 0 };

  function compile(wrapped) {
    return (shader) => {
      shader.uniforms.uHeightMap = { value: heightTexture };
      // The optional high-resolution tier: bound whether or not it is ever loaded,
      // so a tree stands on whatever surface the terrain is drawing.
      shader.uniforms.uHeightTier = HEIGHT_TIER;
      shader.uniforms.uHeightTierRect = HEIGHT_TIER_RECT;
      shader.uniforms.uHeightTierMix = HEIGHT_TIER_MIX;
      shader.uniforms.uForestMask = FOREST_MASK; // shared holder - the mask may still be downloading
      shader.uniforms.uSnow = SNOW_LEVEL; // declared by snowGlsl(); the same holder the terrain reads
      if (wrapped) shader.uniforms.uNearHole = NEAR_HOLE;

      let vs = shader.vertexShader;
      vs = patch(vs, '#include <common>',
        `#include <common>\n${wrapped ? 'uniform float uNearHole;\n' : ''}${HELPERS}`);
      vs = patch(vs, '#include <begin_vertex>', placeGlsl({ wrapped }));
      shader.vertexShader = vs;

      let fs = shader.fragmentShader;
      fs = patch(fs, '#include <common>', '#include <common>\nvarying float vTreeTint;\nvarying float vTreeSnow;');
      // Snow goes on AFTER the per-tree tint, so a tree's own lighter-or-darker
      // draw shows in its green and not in its snow.
      fs = patch(
        fs,
        '#include <map_fragment>',
        `#include <map_fragment>
  diffuseColor.rgb *= vTreeTint;
  diffuseColor.rgb = mix( diffuseColor.rgb, ${snowColorGlsl()}, vTreeSnow );`,
      );
      shader.fragmentShader = fs;
    };
  }

  // Two materials, because their vertex code genuinely differs: one wraps its
  // offset into the window nearest the camera, the other is handed world positions
  // already placed.
  //
  // customProgramCacheKey IS NOT OPTIONAL HERE, and the comment this replaces was
  // wrong in a way that cost a working feature. three's default cache key is
  // `onBeforeCompile.toString()`, and I reasoned that two different closures would
  // therefore give two keys. They do not: attachAtmo() WRAPS onBeforeCompile in a
  // fresh arrow function of its own, so after it runs both materials' hooks
  // stringify to the atmosphere wrapper's source - identical text, one key, one
  // compiled program serving both meshes. Measured: sameKey true, sameProgram true.
  //
  // Whichever mesh compiled first then imposed its shader on the other, and with the
  // wrapped one winning, the fine mesh inherited the standard mesh's near-hole test
  // and collapsed every tree inside 150 m - which is the user's report, "quando
  // seleziono high models, gli alberi spariscono", exactly.
  //
  // The triangle count could not see it: a collapsed tree still counts its
  // triangles, so probe-models.mjs reported the trees as drawn while the screen had
  // none. A counter is not a pixel - this project's own lesson, re-learned.
  material.onBeforeCompile = compile(true);
  material.customProgramCacheKey = () => 'pngp-veg-wrapped';
  attachAtmo(material); // same aerial-perspective fog as everything else (phase 4)

  const materialHi = material.clone();
  materialHi.onBeforeCompile = compile(false);
  materialHi.customProgramCacheKey = () => 'pngp-veg-nearwindow';
  attachAtmo(materialHi);

  // Two meshes, ONE material. Sharing the material is not just economy: three's
  // customProgramCacheKey() returns onBeforeCompile.toString(), so two materials
  // built by this same factory would compile to one program anyway - a fact this
  // project has already been bitten by (docs/PROGRESS.md, the shrub layer running
  // the grass shader). One material makes that explicit instead of incidental, and
  // it means the two levels of detail cannot drift apart in their shading.
  const group = new THREE.Group();
  group.name = 'vegetation-lod';
  const mesh = new THREE.Mesh(geometry, material);
  // The STANDARD mesh keeps the name 'vegetation'. tools/test-wildlife.mjs looks it
  // up and reads .geometry off it to check the squirrels hide behind the trunks the
  // shader actually draws; naming the group that instead would have handed it a
  // Group with no geometry. Both levels share the one aOffset buffer, so the check
  // is equally valid against either.
  mesh.name = 'vegetation';
  const meshHi = new THREE.Mesh(geometryHi, materialHi);
  meshHi.name = 'vegetation-high';
  for (const m of [mesh, meshHi]) {
    // The geometry's bounds describe a unit cone at the origin, not where the
    // shader puts these trees, so three's culling would be nonsense. The window
    // follows the camera and is always in front of it in part, so there is nothing
    // to gain from culling the mesh as a whole anyway.
    m.frustumCulled = false;
    group.add(m);
  }
  meshHi.visible = false;

  const hiTriangles = geometryHi.index.count / 3;

  // Which lattice slots are near enough for the fine model, written as WORLD
  // positions so the fine shader can use them without wrapping.
  //
  // It tests all 27,889 slots rather than inverting the wrap to find the nearby
  // ones. Deliberate: WINDOW_M is 1000 while the lattice is 167 x 6 = 1002 m wide, so
  // the pattern is not exactly periodic in cell indices and an inverted lookup would
  // be subtly wrong at the seam - the kind of half-pixel error nobody finds. A full
  // pass is 27,889 cheap tests and it runs once per HI_REFILL_M of walking, not once
  // per frame.
  let lastFillX = Infinity;
  let lastFillZ = Infinity;
  let nearCount = 0;
  let overflowed = false;
  function refillNear(camX, camZ, force) {
    if (!Number.isFinite(camX) || !Number.isFinite(camZ)) return;
    if (!force && Math.hypot(camX - lastFillX, camZ - lastFillZ) < HI_REFILL_M) return;
    lastFillX = camX;
    lastFillZ = camZ;
    // Filled out to the handover PLUS the refill step, so a tree that walks into
    // range is already in the buffer (collapsed by the shader's own distance test)
    // and appears without waiting for the next refill.
    const fillR = HI_NEAR_M + HI_REFILL_M;
    const fillRSq = fillR * fillR;
    const dst = nearOffsets.array;
    let n = 0;
    for (let i = 0; i < count; i++) {
      const ox = offsets[i * 2];
      const oz = offsets[i * 2 + 1];
      // The very same wrap the standard mesh's shader applies, so these positions
      // are the ones it would have drawn - not an approximation of them.
      const sx = ox + Math.floor((camX - ox) / WINDOW_M + 0.5) * WINDOW_M;
      const sz = oz + Math.floor((camZ - oz) / WINDOW_M + 0.5) * WINDOW_M;
      const dx = sx - camX;
      const dz = sz - camZ;
      if (dx * dx + dz * dz > fillRSq) continue;
      if (n >= HI_CAPACITY) { overflowed = true; break; }
      dst[n * 2] = sx;
      dst[n * 2 + 1] = sz;
      n++;
    }
    nearCount = n;
    nearOffsets.needsUpdate = true;
    geometryHi.instanceCount = n;
  }

  return {
    object: group,
    // Which level is drawn is a VISIBILITY flip plus one uniform, not a rebuild and
    // not a download: both geometries exist from startup, so this can be changed
    // mid-stride and the hidden mesh costs nothing.
    //
    // Note that BOTH meshes are visible under High - the fine one near, the standard
    // one beyond the handover, each holding the complement of the other's trees.
    // Under Standard the fine mesh is hidden and the hole closes, which returns the
    // standard mesh to exactly what it drew before this option existed.
    applyDetail() {
      const high = MODEL_DETAIL.value === 1;
      NEAR_HOLE.value = high ? HI_NEAR_M : 0;
      meshHi.visible = high;
      mesh.visible = true;
      // INVALIDATE rather than refill here: this runs on a change event, which has
      // no camera, and the coordinates of the last fill may be from anywhere. The
      // render loop calls update() before it draws, so the set is rebuilt before the
      // next frame either way and there is no gap to see.
      lastFillX = Infinity;
      lastFillZ = Infinity;
    },
    // Called from the render loop. Refilling only after the camera has moved
    // HI_REFILL_M keeps the promise in this file's header - that walking costs
    // nothing on the CPU - while still being 27,889 distance tests when it does run,
    // which is why it does not run per frame.
    update(camera) {
      if (MODEL_DETAIL.value !== 1) return;
      refillNear(camera.position.x, camera.position.z, false);
    },
    stats: {
      instances: count,
      trianglesPerTree: CONE_SEGMENTS,
      trianglesPerTreeHi: hiTriangles,
      windowM: WINDOW_M,
      spacingM: SPACING_M,
      visibleM: VISIBLE_M,
      hiNearM: HI_NEAR_M,
      hiCapacity: HI_CAPACITY,
    },
    // Read by tools/dev/probe-models.mjs and tools/test-vegetation.mjs: how many
    // slots the near set actually holds, and whether it ever ran out of room. An
    // overflow would silently drop a near tree in favour of nothing, so it is
    // reported rather than left to be inferred from a gap in the wood.
    nearInfo: () => ({ count: nearCount, capacity: HI_CAPACITY, overflowed }),
  };
}
