import * as THREE from 'three';
import { attachAtmo } from './atmosphere.js';
import { BASEMAP, BASEMAP_MIX, BASEMAP_SCALE, basemapGlsl } from './basemap.js';
import { LANDCOVER_MASK } from './landcover.js';
import { SNOW_LEVEL, snowGlsl, snowColorGlsl } from './snow.js';

// Grass and shrubs (2026-08-12) - the user's own topic, and the thing the ground
// has been missing since the satellite texture landed: at 20.5 m per texel the
// ground within 30 m of a walking camera is one or two texels, so it is a flat
// colour. Correct colour, no substance. This file puts substance in it.
//
// It is src/vegetation.js's sibling and uses the same trick, so read that file
// first: placement happens entirely in the vertex shader against a wrapped
// window, so walking or flying costs nothing on the CPU and every instance lands
// on a fixed world lattice. Three differences that matter:
//
//  1. THE LATTICE IS SHUFFLED. The trees walk their window in row order, so
//     drawing fewer of them would cut a spatial band out of the forest. Here any
//     PREFIX of the shuffled lattice is a spatially uniform random subset, which
//     makes instanceCount an exact density knob costing nothing - no shader
//     branch, no second buffer. That is what the HUD's Ground cover control
//     drives (src/main.js), and it is why the knob is free.
//
//  2. TWO LAYERS FROM ONE MASK. src/landcover.js ships a measurement - how much
//     of a pixel carries vegetation that is not tree canopy - and nothing more.
//     Whether that vegetation is a pasture or a rhododendron heath is a model,
//     and it is here, as SHRUB_SHARE: a function of elevation, which the vertex
//     shader samples anyway. Shipping it as a second texture cost 4.4 MB for a
//     value that was already derivable.
//
//  3. THE COLOUR IS THE GROUND'S OWN. A tuft samples the satellite albedo under
//     it and tints that towards green, rather than carrying an invented palette.
//     The reason is a measurement from the satellite session: open alpine ground
//     reads G/R 1.00 in the imagery, grey-olive, where the old band model painted
//     it green. Bright green tufts on grey-olive ground would fight it. Tinting
//     the photo cannot fight it, by construction - and it means a hillside the
//     photograph knows is drab grows drab grass.

// ---------------------------------------------------------------------------
// Layers
//
// Density and draw distance trade against each other exactly as they do for the
// trees, and the arithmetic here is harsher because a tuft is 0.2 m tall. The
// wrapped window must be more than twice the draw distance (a slot's copy flips
// at half a window, and at that range its scale is already zero), and everything
// inside the window is drawn whether or not it is inside the visible disc - so
// the window's wasted corners are pure cost. That is the reason a tuft carries
// FIVE blades instead of one: the waste is per INSTANCE, so fewer, fatter tufts
// put more grass on screen for the same overdraw.

// Grass, retuned after looking at the first render rather than after doing the
// arithmetic - and the arithmetic is worth writing down because it was wrong in a
// way that is easy to repeat. The slot pitch is NOT the tuft density: only the
// slots the mask keeps become tufts. At the spawn the mask reads 0.60 and the belt
// gives grass 0.52 of it, so 0.5 m slots produced 4 x 0.31 = 1.26 tufts/m2, which
// renders as scattered straws on bare ground. Density has to be budgeted AFTER
// that factor, which is what these numbers do: 9.8 slots/m2 -> ~3 tufts/m2 -> ~21
// blades/m2 at the spawn.
//
// Draw distance paid for it. 34 m rather than 50, because grass at 40 m is a few
// pixels tall and the ground's own colour already carries it, while the window has
// to be more than twice whatever this is - so every metre of range costs area
// quadratically.
const GRASS = {
  windowM: 54, // wrap period; must stay above 2 x visibleM
  spacingM: 0.26, // -> (54/0.26)^2 = 43,264 instances
  jitter: 0.45, // of a cell, so the grid never reads as rows
  visibleM: 25,
  fadeStartM: 15,
  seed: 0x51ed2f7b,
};
// Shrubs, budgeted only AFTER the two layers stopped sharing a shader - every
// number here before that was measured through the grass's own window and spacing,
// so none of it meant anything. The first honest reading was 924 cushions spread
// over a 140 m disc, which is 0.015 per square metre: invisible.
//
// A scatter you actually notice needs about 0.15 per square metre in the belt,
// which is ten times the slot density - so the draw distance pays for it again,
// 60 m instead of 140. Beyond that a knee-high cushion is two pixels and the
// ground's own colour carries the heath.
const SHRUB = {
  windowM: 130,
  spacingM: 1.1, // -> (130/1.1)^2 = 13,924 instances
  jitter: 0.42,
  visibleM: 60,
  fadeStartM: 40,
  seed: 0x2f6ea11d,
};

const BLADES_PER_TUFT = 8;
const SHRUB_TRIANGLES = 8; // an octahedron - see cushionGeometry()
// A blade is one triangle: two base corners and a tip. It is a CLUMP of real
// blades, not one leaf - 9 cm across - and the width is where this design's whole
// argument lives, so it is worth stating plainly.
//
// Turf is continuous cover and geometry cannot be: at any instance count this
// scene can afford, the budget comes out around 30 blades per square metre. Two
// ways to spend that were rendered and looked at. Thin, leaf-width triangles
// (5 cm) read as scattered straws on bare ground however many of them there are,
// because 30 slivers per m2 is what it is. Wide, chunky clumps cover several times
// the area for exactly the same triangle count - width is free, in a way that
// count is not - and they match what this project already does everywhere else:
// cones for spruces, faceted cushions for heath. Chunky won, on looking.
const BLADE_HALF_WIDTH_M = 0.055;
// How far a tip leans out from the tuft's axis, AS A FRACTION OF ITS HEIGHT. It has
// to be a fraction: written as an absolute 0.3 m against blades 0.11-0.34 m tall,
// every tip leaned further sideways than the blade was tall, so a tuft was a
// starfish lying on the ground rather than a spray standing up in it. That is why
// the geometry carries the lean as its own attribute instead of putting it in
// position.xz - the base width is absolute and the lean is not, so they cannot
// share a scale.
const BLADE_SPLAY = 0.45;
const GRASS_MIN_H = 0.1;
const GRASS_MAX_H = 0.28;
// Alpine turf really is shorter than a valley meadow - the growing season is two
// months at 2,600 m - so height falls off with elevation. Free: the elevation is
// already sampled to place the tuft.
const GRASS_TALL_TO_M = 1400; // full height at and below here
const GRASS_SHORT_FROM_M = 2700; // GRASS_SHORT_SCALE at and above here
const GRASS_SHORT_SCALE = 0.55;

// Dwarf shrub, retuned twice by looking rather than by arithmetic, and both wrong
// answers are worth keeping because they were wrong in opposite directions.
//
// First: 0.85 m tall with a radius of 2.2 m, which rendered as faceted green balls
// the size of a car standing in front of the camera. Flattening them made it worse,
// not better - 2.7 m wide and 0.3 m tall, seen at eye level, is a slab, and a
// scatter of slabs at a grazing angle merges into a green pavement covering 68% of
// the frame. Neither reads as a plant.
//
// The overhead view is what settled it, and it also corrected a miscount: from
// above, what looks like 400 bushes in a 26 m disc is about 20 cushions showing ten
// facets each. The density had been right all along; the SHAPE was wrong.
//
// So these are the real proportions of a rhododendron or juniper cushion: knee
// high and roughly as wide as it is tall, times one and a half. What that cannot
// give is a continuous heath carpet - 1 m cushions at one per 40 m2 is a scatter,
// and a carpet would need forty times the instances at twenty triangles each. A
// scatter of dwarf shrubs over turf is what Valsavarenche actually looks like at
// this height, so that is what this is, honestly rather than by accident.
const SHRUB_MIN_H = 0.2;
const SHRUB_MAX_H = 0.55;
const SHRUB_SPREAD_MIN = 1.1; // radius as a multiple of height
const SHRUB_SPREAD_MAX = 1.7;

// Sunk as a FRACTION of its own height, not by an absolute depth - and this is
// the one number in this file that was got badly wrong first, so it is worth the
// paragraph.
//
// Trees sink 1.5 m to absorb the difference between the true bilinear heightfield
// they sample and the triangle-interpolated surface the terrain draws (0.38 m
// mean, 7.73 m worst case: tools/test-rendered-height.mjs). Copying that idea and
// merely scaling it down gave SINK_M = 0.35 m against grass 0.11-0.34 m tall,
// which buried every single tuft in the park - the tip of the tallest blade sat
// 1 cm BELOW the ground. Nothing rendered anywhere, with no console error and no
// warning: the probe measured 0.00% of pixels changed at every vantage, which is
// the only reason it was found.
//
// No absolute depth can work here: enough to hide the worst-case disagreement is
// more than the whole plant. A fraction cannot make that mistake - it always
// leaves most of the tuft above ground - and it is also the right shape for the
// problem, since what needs hiding is the base joint, whose size scales with the
// plant. The residual is that on a coarse distant tile some tufts float or sink a
// little; the cover is only drawn within 50 m, where the LOD is at its finest, so
// that is bounded.
const GRASS_SINK_FRACTION = 0.12;
// Zero, and not for the same reason: a cushion's geometry already extends below
// its own origin (see cushionGeometry), so the ground hides its base by
// construction.
const SHRUB_SINK_FRACTION = 0;

// How much of the open vegetation at a given elevation is dwarf shrub rather than
// grass, as a piecewise-linear profile in metres. This is the model half of the
// data (see the header) and it is the Alpine belt sequence: juniper and alder
// scattered through the valley, rhododendron and blueberry thickening towards the
// treeline (~2,200 m here) and just above it, then giving way to alpine turf,
// then to nothing.
//
// It needs no separate "forest margin" term: the peak already sits AT the
// treeline, which is where scrub grows because it is where trees nearly do.
// Retuned downwards at the low end after standing at the spawn and looking: the
// first curve gave shrub 0.49 of the cover at 1,950 m, i.e. half and half with the
// grass, and Valsavarenche at that height is grazed pasture with scattered alder
// and juniper - not half heath. It also mattered more than it looks, because a
// cushion is 1.9 m across and a tuft is 0.1 m: equal SHARE is nothing like equal
// screen area, so the shrubs dominated a frame they should have been dotted across.
// The peak stays at the treeline, where the heath really is the ground cover.
const SHRUB_SHARE = [
  [1200, 0.06],
  [1800, 0.18],
  [2150, 0.45],
  [2400, 0.45],
  [2650, 0.22],
  [2900, 0.05],
  [3100, 0.0],
];

// Albedo, not appearance - the warning at the top of src/terrain.js applies to
// every colour in this project. These are multipliers ON the satellite albedo
// under the tuft, which is why they sit near 1: they lean the ground's own colour
// towards leaf rather than replacing it. Green up, red and blue down, brightness
// roughly kept.
const GRASS_TINT = [0.88, 1.16, 0.72];
// Dwarf shrub is markedly darker than turf - a rhododendron heath reads almost
// black-green against pasture from a distance, and that contrast is most of what
// makes the belt visible at all.
//
// Darker than the first guess by a measured factor, not by taste. A cushion's
// facets face the sky while the ground around them is a slope tilted away from a
// 25-degree midday sun, so identical albedo renders BRIGHTER on the bush: at
// [0.62, 0.78, 0.62] the shrubs measured luma 0.285 against the ground's 0.259 and
// G/R 1.10 against 0.98, i.e. they read as glowing green slabs. Scaled to land
// about 15% darker than the ground they stand on, which is where a plant belongs.
const SHRUB_TINT = [0.48, 0.6, 0.48];
// Used only until the satellite texture lands (uBasemapMix is 0 until then), so
// this is a fraction of a second in practice and never a design decision. Solved
// the same way as the terrain bands: it looks too light as a swatch.
const FALLBACK_ALBEDO = 0x93a86a;

// Snow. Grass is BURIED rather than whitened: a 0.2 m tuft under settled snow is
// gone, and a white tuft standing on white ground would read as debris. A shrub is
// too tall to vanish, so it is pressed down and flocked instead - which is exactly
// what a rhododendron cushion looks like in November.
const GRASS_BURY = 1.0; // fraction of height removed at full cover
const SHRUB_PRESS = 0.55;
const SHRUB_SNOW_MIX = 0.85;

// Wind. weather.js already drives a wind strength that audio.js turns into hiss;
// this is the same number made visible. The direction is a constant rather than a
// simulated field: what the eye reads in moving grass is the travelling wave, not
// the bearing, and a real direction would have to agree with the cloud drift and
// the rain streaks to be worth having.
const WIND_DIR = [0.83, 0.56]; // unit-ish, x and z
const WIND_WAVE_M = 9; // wavelength of the gust travelling across the field
const WIND_SPEED = 1.7; // wave crests per second
const GRASS_SWAY_M = 0.075; // tip travel at full wind
const SHRUB_SWAY_M = 0.035;

// Shared holders, driven from main.js each frame - the same arrangement as
// snow.js's SNOW_LEVEL, and for the same reason: nothing here has to know that
// weather.js exists.
export const GROUNDCOVER_WIND = { value: 0 };
export const GROUNDCOVER_TIME = { value: 0 };
// The density knob, 0..1, applied by main.js as instanceCount. Exposed as a
// holder so a probe can pin it and so the HUD and the tests read the same number.
export const GROUNDCOVER_DENSITY = { value: 1 };

// Exported for tools/test-groundcover.mjs, so it asserts against these numbers
// rather than a second copy that could drift from them.
export {
  GRASS, SHRUB, SHRUB_SHARE, BLADES_PER_TUFT, SHRUB_TRIANGLES, GRASS_TINT, SHRUB_TINT,
  GRASS_SINK_FRACTION, GRASS_MIN_H, GRASS_MAX_H,
};

function glsl(n) {
  const s = n.toPrecision(12);
  return s.includes('.') || s.includes('e') ? s : `${s}.0`;
}

function patch(source, marker, replacement) {
  if (!source.includes(marker)) {
    throw new Error(`groundcover.js: shader marker not found: ${marker}`);
  }
  return source.replace(marker, replacement);
}

// Deterministic layout, so the cover is identical on every load and between
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

// The window's jittered offsets, SHUFFLED. The shuffle is the whole reason the
// density knob is free: a Fisher-Yates permutation has the property that any
// prefix of it is a uniform random subset of the whole, so drawing the first N
// instances thins the cover evenly everywhere instead of cutting a band out of it.
//
// Asserted by tools/test-groundcover.mjs against the alternative (row order),
// because the failure mode is subtle: at half density an unshuffled lattice looks
// perfectly fine straight ahead and has no grass at all behind you.
export function coverLattice({ windowM, spacingM, jitter, seed }) {
  const perSide = Math.round(windowM / spacingM);
  // The EFFECTIVE pitch, not the requested one. perSide has to be a whole number,
  // so perSide * spacingM is only accidentally equal to windowM - at 54 m and 0.26 m
  // it comes to 54.08, and a lattice whose period is 54.08 m wrapped on 54 m leaves
  // an 8 cm band where slots duplicate on one side and gap on the other. Dividing
  // the window by the count instead makes the lattice tile it exactly, and the
  // shader is given THIS number so its cell indexing agrees. Found by the test that
  // asserts every offset lands inside the window.
  const pitchM = windowM / perSide;
  const count = perSide * perSide;
  const offsets = new Float32Array(count * 2);
  const random = mulberry32(seed);
  for (let iz = 0; iz < perSide; iz++) {
    for (let ix = 0; ix < perSide; ix++) {
      const i = iz * perSide + ix;
      offsets[i * 2] = (ix + 0.5 + (random() - 0.5) * 2 * jitter) * pitchM;
      offsets[i * 2 + 1] = (iz + 0.5 + (random() - 0.5) * 2 * jitter) * pitchM;
    }
  }
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    for (const k of [0, 1]) {
      const tmp = offsets[i * 2 + k];
      offsets[i * 2 + k] = offsets[j * 2 + k];
      offsets[j * 2 + k] = tmp;
    }
  }
  return { offsets, perSide, count, pitchM };
}

// The JS twin of the GLSL below, for tools/test-groundcover.mjs and for anything
// that has to reason about the belt on the CPU. One table, two readers.
export function shrubShareAt(elevM) {
  if (!Number.isFinite(elevM)) return 0;
  if (elevM <= SHRUB_SHARE[0][0]) return SHRUB_SHARE[0][1];
  for (let i = 1; i < SHRUB_SHARE.length; i++) {
    const [z1, v1] = SHRUB_SHARE[i];
    if (elevM <= z1) {
      const [z0, v0] = SHRUB_SHARE[i - 1];
      return v0 + ((v1 - v0) * (elevM - z0)) / (z1 - z0);
    }
  }
  return SHRUB_SHARE[SHRUB_SHARE.length - 1][1];
}

// Piecewise-linear, built the same way terrain.js chains its elevation bands:
// each segment's ramp saturates before the next one starts, so applying them in
// order IS linear interpolation. Generated from the table above so the shader and
// shrubShareAt() cannot drift apart.
function shrubShareGlsl() {
  const lines = [`      float share = ${glsl(SHRUB_SHARE[0][1])};`];
  for (let i = 1; i < SHRUB_SHARE.length; i++) {
    const [z0] = SHRUB_SHARE[i - 1];
    const [z1, v1] = SHRUB_SHARE[i];
    lines.push(
      `      share = mix( share, ${glsl(v1)}, clamp( ( h - ${glsl(z0)} ) / ${glsl(z1 - z0)}, 0.0, 1.0 ) );`,
    );
  }
  return lines.join('\n');
}

// One tuft of BLADES_PER_TUFT triangles, in unit space: y runs 0 at the ground to
// 1 at the tips, x and z are in metres and are NOT scaled by height (a blade does
// not get wider because it is taller).
function tuftGeometry() {
  const verts = new Float32Array(BLADES_PER_TUFT * 3 * 3);
  // (leanX, leanZ, phase). The lean is zero at the base and the blade's outward
  // direction at the tip; the shader multiplies it by the tuft's HEIGHT, which is
  // the whole reason it cannot live in position.xz alongside the absolute base
  // width. Phase is constant per blade, so the blades of one tuft do not all nod
  // together.
  const blade = new Float32Array(BLADES_PER_TUFT * 3 * 3);
  for (let b = 0; b < BLADES_PER_TUFT; b++) {
    // Not 2*PI*b/n: an irrational step spreads the blades without ever letting two
    // tufts line up into the same rosette. 2.39996 rad is the golden angle.
    const yaw = b * 2.39996;
    const dx = Math.cos(yaw);
    const dz = Math.sin(yaw);
    const base = b * 9;
    // Base corners, perpendicular to the blade's lean, in absolute metres.
    verts[base + 0] = -dz * BLADE_HALF_WIDTH_M;
    verts[base + 1] = 0;
    verts[base + 2] = dx * BLADE_HALF_WIDTH_M;
    verts[base + 3] = dz * BLADE_HALF_WIDTH_M;
    verts[base + 4] = 0;
    verts[base + 5] = -dx * BLADE_HALF_WIDTH_M;
    // The tip is a single point on the axis; its lean is applied by the shader.
    verts[base + 6] = 0;
    verts[base + 7] = 1;
    verts[base + 8] = 0;
    for (let v = 0; v < 3; v++) {
      const at = (b * 3 + v) * 3;
      blade[at] = v === 2 ? dx * BLADE_SPLAY : 0;
      blade[at + 1] = v === 2 ? dz * BLADE_SPLAY : 0;
      blade[at + 2] = b * 1.7;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geometry.setAttribute('aBlade', new THREE.BufferAttribute(blade, 3));
  // Normals are never read: flatShading takes them from screen-space derivatives,
  // which is what a non-uniformly scaled blade needs anyway. A dummy attribute is
  // still required because three's shader declares it.
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(verts.length), 3));
  return geometry;
}

// An octahedron: 8 flat facets, of which the top four are visible, which under
// flatShading reads as a lumpy cushion rather than a ball. An icosahedron's 20
// facets were the first choice and are simply not affordable once the count is high
// enough for the scatter to read - 14,000 cushions at 20 triangles is 278k
// triangles for ankle-high plants, against 111k at 8.
//
// Used UNMODIFIED, with its lower half left below the ground where the terrain
// hides it: the obvious saving - folding the bottom vertices up with abs(y) so no
// facet is wasted underfoot - makes the lower facets exactly coincident with the
// upper ones, and two coplanar triangles at the same depth z-fight. Four wasted
// triangles per cushion is the cheaper mistake.
//
// position.y therefore runs -1..1, and the shader scales it by the cushion's
// height, so `height` is what stands above ground and no sink term is needed.
function cushionGeometry() {
  const ico = new THREE.OctahedronGeometry(1, 0);
  const pos = ico.attributes.position;
  const verts = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    verts[i * 3] = pos.getX(i);
    verts[i * 3 + 1] = pos.getY(i);
    verts[i * 3 + 2] = pos.getZ(i);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geometry.setAttribute('aBlade', new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(verts.length), 3));
  ico.dispose();
  return geometry;
}

function createLayer({ kind, layer, manifest, heightTexture }) {
  const { xmin, ymin, xmax, ymax } = manifest.bboxCrsUnits;
  const { min: elevMin, max: elevMax } = manifest.elevationRangeM;
  const { y: resY } = manifest.resolutionMPerPx;
  const worldWidth = xmax - xmin;
  const worldDepth = ymax - ymin;
  const isGrass = kind === 'grass';

  const { offsets, count, pitchM } = coverLattice(layer);
  const source = isGrass ? tuftGeometry() : cushionGeometry();

  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setAttribute('position', source.attributes.position);
  geometry.setAttribute('normal', source.attributes.normal);
  geometry.setAttribute('aBlade', source.attributes.aBlade);
  geometry.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 2));
  geometry.instanceCount = count;

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.94,
    metalness: 0,
    flatShading: true,
    // A single-triangle blade has no back: without this it disappears whenever
    // the camera is on the other side of it, and half a field would blink out as
    // you turned. Free - there is no depth sorting involved, the geometry is
    // opaque.
    side: THREE.DoubleSide,
  });

  const HELPERS = /* glsl */ `
    attribute vec2 aOffset;
    attribute vec3 aBlade; // (leanX, leanZ, phase) - see tuftGeometry()
    uniform sampler2D uHeightMap;
    uniform sampler2D uCoverMask;
    uniform float uWind;
    uniform float uCoverTime;
    varying vec3 vCoverAlbedo;
    varying float vCoverSnow;
${snowGlsl()}
${basemapGlsl()}

    // MUST agree with terrain.js's terrainUv() and vegetation.js's vegUv(). Kept
    // separate rather than shared for the same reason vegetation.js keeps its
    // copy: the three sample different uniforms, and a disagreement here fails a
    // test (tools/test-groundcover.mjs compares a tuft's base against the
    // terrain's own sampler) instead of going unnoticed.
    vec2 coverUv( vec2 wxz ) {
      return vec2( ( wxz.x + ${glsl(worldWidth / 2)} ) / ${glsl(worldWidth)},
                   ( ${glsl(worldDepth / 2)} - wxz.y ) / ${glsl(worldDepth)} );
    }
    float coverElevation( vec2 uv ) {
      vec2 s = texture2D( uHeightMap, uv ).rg;
      return ( ( s.r * 256.0 + s.g ) / 257.0 ) * ${glsl(elevMax - elevMin)} + ${glsl(elevMin)};
    }
    // Hash without sin(): world coordinates reach +/-42 km here, and sin() of a
    // number that large loses enough float precision to produce visible
    // repetition. Same one vegetation.js uses.
    float coverHash( vec2 p ) {
      vec3 p3 = fract( vec3( p.xyx ) * 0.1031 );
      p3 += dot( p3, p3.yzx + 33.33 );
      return fract( ( p3.x + p3.y ) * p3.z );
    }
  `;

  const PLACE = /* glsl */ `
    // Nearest copy of the window to the camera. The shift is an exact multiple of
    // the window, so every instance sits on a fixed world lattice and nothing
    // shimmers or reshuffles as you move.
    vec2 slot = aOffset + floor( ( cameraPosition.xz - aOffset ) / ${glsl(layer.windowM)} + 0.5 ) * ${glsl(layer.windowM)};
    // The cell index, not the position, seeds every per-instance draw: it is
    // stable under the wrap, so a tuft keeps its height and tint forever.
    vec2 coverCell = floor( slot / ${glsl(pitchM)} );
    vec2 uv = coverUv( slot );

    float cover = texture2D( uCoverMask, uv ).r;
    float h = coverElevation( uv );
${shrubShareGlsl()}
    // The one mask feeds both layers; the belt decides how much of it is this one.
    float mine = cover * ${isGrass ? '( 1.0 - share )' : 'share'};

    // Coverage as a probability, exactly as the forest does it: 40% cover keeps
    // 40% of slots, so a margin thins out instead of ending on the mask's own
    // texel grid.
    float exists = step( coverHash( coverCell ), mine );

    float dist = length( cameraPosition.xz - slot );
    float near = 1.0 - smoothstep( ${glsl(layer.fadeStartM)}, ${glsl(layer.visibleM)}, dist );

    // Aspect from two extra taps of the height texture, one texel north and one
    // south - the same two-tap shortcut vegetation.js justifies: leaving the
    // east-west slope out of the normalisation costs a few metres of effective
    // elevation against a term that spans 320 m.
    float dv = ${glsl(resY)} / ${glsl(worldDepth)};
    float gradZ = ( coverElevation( uv + vec2( 0.0, dv ) ) - coverElevation( uv - vec2( 0.0, dv ) ) )
                / ${glsl(2 * resY)};
    float aspectZ = gradZ * inversesqrt( 1.0 + gradZ * gradZ );
    // Slope was baked out of the mask at build time, so there is nothing growing
    // on ground too steep to hold snow either - hence no bare term.
    float snow = snowCover( slot, h, aspectZ, 0.0 );

${
  isGrass
    ? `    float stunt = mix( 1.0, ${glsl(GRASS_SHORT_SCALE)},
                       smoothstep( ${glsl(GRASS_TALL_TO_M)}, ${glsl(GRASS_SHORT_FROM_M)}, h ) );
    float alive = exists * near;
    // Buried, not whitened - see GRASS_BURY.
    float height = mix( ${glsl(GRASS_MIN_H)}, ${glsl(GRASS_MAX_H)}, coverHash( coverCell + 13.1 ) )
                 * stunt * alive * ( 1.0 - snow * ${glsl(GRASS_BURY)} );
    // A blade's width is absolute rather than a fraction of its height - a tall
    // blade is not a wide one - but it MUST still collapse with the tuft. Writing
    // 1.0 here was a real bug and a quiet one: an empty slot kept its full 0.3 m
    // splay at height zero, so all 48,400 of them drew flat triangles 0.35 m under
    // the sampled surface. Buried, on flat ground. On a summit, where the drawn
    // terrain departs from the bilinear height by metres (tools/test-rendered-height.mjs),
    // they punched through and put 8% of the frame's pixels on a glacier where the
    // mask says nothing grows.
    float radius = alive;
    vCoverSnow = 0.0;
    vec3 tint = vec3( ${GRASS_TINT.map(glsl).join(', ')} );
    float sway = ${glsl(GRASS_SWAY_M)};`
    : `    float height = mix( ${glsl(SHRUB_MIN_H)}, ${glsl(SHRUB_MAX_H)}, coverHash( coverCell + 13.1 ) )
                 * exists * near * ( 1.0 - snow * ${glsl(SHRUB_PRESS)} );
    float radius = height * mix( ${glsl(SHRUB_SPREAD_MIN)}, ${glsl(SHRUB_SPREAD_MAX)},
                                 coverHash( coverCell + 29.7 ) );
    vCoverSnow = snow * ${glsl(SHRUB_SNOW_MIX)};
    vec3 tint = vec3( ${SHRUB_TINT.map(glsl).join(', ')} );
    float sway = ${glsl(SHRUB_SWAY_M)};`
}

    // The ground's own colour, leaned towards leaf. basemapAlbedo() is the very
    // same function terrain.js colours the ground with, so a tuft cannot disagree
    // with what it stands on by more than the tint.
    vec3 photo = mix( ${(() => {
      const c = new THREE.Color(FALLBACK_ALBEDO);
      return `vec3( ${glsl(c.r)}, ${glsl(c.g)}, ${glsl(c.b)} )`;
    })()}, basemapAlbedo( uv, 0.0 ), uBasemapMix );
    vCoverAlbedo = photo * tint * mix( 0.82, 1.18, coverHash( coverCell + 7.1 ) );

    // Wind: one travelling wave across the world, plus a per-blade phase, so a
    // gust crosses the field instead of every tuft nodding in unison. Applied to
    // the tips only - position.y is 0 at the ground - which is what bending is.
    float wave = sin( dot( slot, vec2( ${glsl(WIND_DIR[0])}, ${glsl(WIND_DIR[1])} ) ) * ${glsl((2 * Math.PI) / WIND_WAVE_M)}
                    - uCoverTime * ${glsl(WIND_SPEED * 2 * Math.PI)} + aBlade.z );
    vec2 bend = vec2( ${glsl(WIND_DIR[0])}, ${glsl(WIND_DIR[1])} ) * ( wave * 0.5 + 0.6 )
              * uWind * sway * position.y;

    // height = 0 collapses every vertex onto the base point, so a slot that holds
    // nothing draws degenerate triangles and costs no fragments at all.
    // Three separate scales, and keeping them separate is the point: the base
    // width is absolute (a taller blade is not a wider one), the lean is a
    // fraction of the height (a taller blade arcs further), and the sink is a
    // fraction of the height too.
    vec3 transformed = vec3(
      position.x * radius + aBlade.x * height + slot.x + bend.x,
      position.y * height + h - height * ${glsl(isGrass ? GRASS_SINK_FRACTION : SHRUB_SINK_FRACTION)},
      position.z * radius + aBlade.y * height + slot.y + bend.y
    );
  `;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uHeightMap = { value: heightTexture };
    shader.uniforms.uCoverMask = LANDCOVER_MASK; // shared holder - may still be downloading
    shader.uniforms.uSnow = SNOW_LEVEL; // declared by snowGlsl(); the same holder the ground reads
    shader.uniforms.uWind = GROUNDCOVER_WIND;
    shader.uniforms.uCoverTime = GROUNDCOVER_TIME;
    shader.uniforms.uBasemap = BASEMAP; // declared by basemapGlsl()
    shader.uniforms.uBasemapMix = BASEMAP_MIX;
    shader.uniforms.uBasemapScale = BASEMAP_SCALE;

    let vs = shader.vertexShader;
    vs = patch(vs, '#include <common>', `#include <common>\n${HELPERS}`);
    vs = patch(vs, '#include <begin_vertex>', PLACE);
    shader.vertexShader = vs;

    let fs = shader.fragmentShader;
    fs = patch(fs, '#include <common>', '#include <common>\nvarying vec3 vCoverAlbedo;\nvarying float vCoverSnow;');
    fs = patch(
      fs,
      '#include <map_fragment>',
      `#include <map_fragment>
  diffuseColor.rgb *= vCoverAlbedo;
  diffuseColor.rgb = mix( diffuseColor.rgb, ${snowColorGlsl()}, vCoverSnow );`,
    );
    shader.fragmentShader = fs;
  };
  attachAtmo(material); // same aerial-perspective fog as everything else

  // WITHOUT THIS, THE TWO LAYERS SHARE ONE SHADER, and the bug is invisible.
  //
  // three caches compiled programs, and Material.customProgramCacheKey() returns
  // onBeforeCompile.toString() by default. Both layers are built by this same
  // function, so their hooks have byte-identical SOURCE and differ only in the
  // closure - which toString() cannot see. Every other ingredient of the cache key
  // (material type, flatShading, DoubleSide, fog) is identical too, so three
  // reused the grass program for the shrub material and the shrub branch of the
  // shader was never compiled at all.
  //
  // It cost three consecutive retunes that changed nothing. The cushions still
  // drew, because the geometry attributes are per mesh - they were simply being
  // sized and coloured by the grass code, which is why they came out exactly 2 m
  // across (the grass branch sets radius = 1.0 for a live slot) no matter what
  // SHRUB_SPREAD said, and why setting the shrub tint to 0.06 left the pixels
  // byte-identical. A change that does nothing is evidence, not noise.
  material.customProgramCacheKey = () => `pngp-groundcover-${kind}`;

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `groundcover-${kind}`;
  // The geometry's bounds describe a unit tuft at the origin, not where the
  // shader puts these, so three's culling would be nonsense. The window follows
  // the camera and is always partly in front of it, so there is nothing to gain
  // from culling the mesh as a whole either.
  mesh.frustumCulled = false;

  return { kind, mesh, count, geometry, pitchM };
}

export function createGroundcover({ manifest, heightTexture }) {
  const group = new THREE.Group();
  group.name = 'groundcover';

  const layers = [
    createLayer({ kind: 'grass', layer: GRASS, manifest, heightTexture }),
    createLayer({ kind: 'shrub', layer: SHRUB, manifest, heightTexture }),
  ];
  for (const l of layers) group.add(l.mesh);

  // The density knob, applied where it costs nothing: instanceCount on a shuffled
  // lattice. Called from main.js when the control changes, and by the tests.
  function applyDensity() {
    const d = Math.min(1, Math.max(0, GROUNDCOVER_DENSITY.value));
    for (const l of layers) {
      l.geometry.instanceCount = Math.round(l.count * d);
      l.mesh.visible = l.geometry.instanceCount > 0;
    }
  }
  applyDensity();

  return {
    object: group,
    applyDensity,
    layers,
    stats: {
      grass: {
        instances: layers[0].count,
        trianglesPerInstance: BLADES_PER_TUFT,
        windowM: GRASS.windowM,
        spacingM: layers[0].pitchM,
        visibleM: GRASS.visibleM,
      },
      shrub: {
        instances: layers[1].count,
        trianglesPerInstance: SHRUB_TRIANGLES,
        windowM: SHRUB.windowM,
        spacingM: layers[1].pitchM,
        visibleM: SHRUB.visibleM,
      },
      trianglesAtFullDensity: layers[0].count * BLADES_PER_TUFT + layers[1].count * SHRUB_TRIANGLES,
    },
  };
}
