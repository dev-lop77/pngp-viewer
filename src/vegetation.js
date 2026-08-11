import * as THREE from 'three';
import { attachAtmo } from './atmosphere.js';
import { FOREST_MASK } from './forest.js';
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

  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = cone.index;
  geometry.setAttribute('position', cone.attributes.position);
  geometry.setAttribute('normal', cone.attributes.normal);
  geometry.setAttribute('uv', cone.attributes.uv);
  geometry.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 2));
  geometry.instanceCount = count;

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
    float vegElevation( vec2 uv ) {
      vec2 s = texture2D( uHeightMap, uv ).rg;
      return ( ( s.r * 256.0 + s.g ) / 257.0 ) * ${glsl(elevMax - elevMin)} + ${glsl(elevMin)};
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

  const PLACE = /* glsl */ `
    // Nearest copy of the window to the camera. The shift is an exact multiple
    // of WINDOW_M, so every tree sits on a fixed world lattice.
    vec2 slot = aOffset + floor( ( cameraPosition.xz - aOffset ) / ${glsl(WINDOW_M)} + 0.5 ) * ${glsl(WINDOW_M)};
    vec2 vegCell = floor( slot / ${glsl(SPACING_M)} );
    vec2 uv = vegUv( slot );

    float wood = texture2D( uForestMask, uv ).r;
    float draw = vegHash( vegCell );
    // Coverage as a probability: 40% canopy keeps 40% of slots, so margins thin
    // out. A threshold test would give hard edges at the mask's own resolution.
    float exists = step( draw, wood );

    float dist = length( cameraPosition.xz - slot );
    float near = 1.0 - smoothstep( ${glsl(FADE_START_M)}, ${glsl(VISIBLE_M)}, dist );

    float elev = vegElevation( uv );
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
    float gradZ = ( vegElevation( uv + vec2( 0.0, dv ) ) - vegElevation( uv - vec2( 0.0, dv ) ) )
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

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uHeightMap = { value: heightTexture };
    shader.uniforms.uForestMask = FOREST_MASK; // shared holder - the mask may still be downloading
    shader.uniforms.uSnow = SNOW_LEVEL; // declared by snowGlsl(); the same holder the terrain reads

    let vs = shader.vertexShader;
    vs = patch(vs, '#include <common>', `#include <common>\n${HELPERS}`);
    vs = patch(vs, '#include <begin_vertex>', PLACE);
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
  attachAtmo(material); // same aerial-perspective fog as everything else (phase 4)

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'vegetation';
  // The geometry's bounds describe a unit cone at the origin, not where the
  // shader puts these trees, so three's culling would be nonsense. The window
  // follows the camera and is always in front of it in part, so there is nothing
  // to gain from culling the mesh as a whole anyway.
  mesh.frustumCulled = false;

  return {
    object: mesh,
    stats: {
      instances: count,
      trianglesPerTree: CONE_SEGMENTS,
      windowM: WINDOW_M,
      spacingM: SPACING_M,
      visibleM: VISIBLE_M,
    },
  };
}
