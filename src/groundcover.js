import * as THREE from 'three';
import { attachAtmo } from './atmosphere.js';
import { BASEMAP, BASEMAP_MIX, BASEMAP_SCALE, basemapGlsl } from './basemap.js';
import { LANDCOVER_MASK } from './landcover.js';
import { FOREST_MASK } from './forest.js';
import { TILE_SEGMENTS, MAX_DEPTH } from './terrain.js';
import { SNOW_LEVEL, snowGlsl, snowColorGlsl } from './snow.js';
import {
  HEIGHT_TIER, HEIGHT_TIER_RECT, HEIGHT_TIER_MIX, GROUND_SEGMENTS, heightTierGlsl,
} from './heighttier.js';

// Grass and scree (2026-08-12, remade 2026-08-13) - the user's own topic, and the
// thing the ground
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
//  2. TWO LAYERS PARTITION ONE MASK. src/landcover.js ships a measurement - how
//     much of a pixel carries vegetation that is not tree canopy - and nothing
//     more. Grass takes that; SCREE takes its complement, minus the canopy. The
//     second subtraction is not optional: under a wood the mask reads ~0 because a
//     canopy is not open vegetation, so 1 - cover alone would cobble every forest
//     floor in the park.
//
//     This slot held DWARF SHRUBS for one day and the user removed them - the
//     cushions never stopped reading as manufactured objects, through three
//     shapes. What went with them was the only MODEL in a file that otherwise just
//     reads measurements: SHRUB_SHARE, a piecewise-linear guess at the Alpine belt
//     sequence. Nothing interpolates a belt now.
//
//  3. THE COLOUR IS THE GROUND'S OWN. A tuft samples the satellite albedo under
//     it and tints that towards green, rather than carrying an invented palette;
//     a stone barely tints it at all, because the pixel under a stone is already
//     the colour of that rock - the rock is what the satellite saw.
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
// Scree - stones, not plants (2026-08-13). This slot was a dwarf-shrub layer for a
// day and the user removed it: the cushions never stopped reading as built objects
// rather than vegetation. *"Ora sembrano dei tronchetti. Stonano moltissimo con il
// prato."* Their call was to drop the shrubs entirely, keep the grass, and reuse the
// original octahedron - the shape whose crime was looking like a mineral object -
// for the thing it was accidentally good at. So this layer is now a stone field.
//
// The lattice is inherited unchanged, deliberately: 13,924 instances at 1.1 m over
// a 130 m window, 60 m of draw distance. Keeping it identical is what makes the
// cost of THIS change attributable - the grass's own share of the mask changed at
// the same time (see below), and two moving numbers cannot be told apart.
const SCREE = {
  windowM: 130,
  spacingM: 1.1, // -> (130/1.1)^2 = 13,924 instances
  jitter: 0.42,
  visibleM: 60,
  fadeStartM: 40,
  seed: 0x2f6ea11d,
};

// Blocks, as their OWN layer rather than as a size mode of the scree - which is
// the whole reason this exists, so it is worth being plain about (2026-08-13). The
// user asked for the boulders' point to be taken off and offered triangles to pay
// for it. But a layer draws ONE geometry for every instance, so spending them
// inside the scree would have spent them on all 13,924 cobbles as well: 22
// triangles each is 306k rather than 111k, against a frame rate of 25-45. Blocks
// are rare, so a layer of their own costs almost nothing and can be as detailed as
// it likes.
//
// The lattice is sized to land at the same rarity the size-mode version produced,
// about two dozen in view at once: 20 m slots over the same 130 m window is 36
// instances, and pi * 60^2 / 21.7^2 of them are inside the draw distance.
const BOULDER = {
  windowM: 130,
  spacingM: 20, // -> (130/20)^2 = 36 instances, ~24 within the 60 m draw distance
  jitter: 0.45,
  visibleM: 60,
  fadeStartM: 45,
  seed: 0x7a31c05f,
};

const BLADES_PER_TUFT = 8;
// An octahedron - see stoneGeometry(). This is the shape the shrubs started as, and
// the whole reason it is back is that the objection to it was never that it was
// angular: it was that an angular faceted lump is not a plant. It is exactly a
// stone.
const STONE_TRIANGLES = 8;
// A block: a crown ring and an equator, capped by a fan above and a fan down to a
// buried point below. Derived from the ring size so the stats cannot drift from
// what boulderGeometry() emits.
const BOULDER_SIDES = 6;
const BOULDER_TRIANGLES = BOULDER_SIDES - 2 + BOULDER_SIDES * 2 + BOULDER_SIDES; // 22
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

// Stone sizes, and they are BIMODAL on purpose - "ovviamente piu' piccoli a parte
// alcuni massi piu' grandi". A scree slope is overwhelmingly gravel and cobbles
// with the occasional block that fell whole, and a single continuous size range
// cannot produce that: it gives one average stone everywhere, which reads as
// gravel-textured ground rather than as a stone field. So most instances draw from
// the small range and a measured few draw from the boulder range instead.
//
// The small range tops out below the grass's own 0.28 m, which is the point: a
// cobble sitting in turf is half-hidden by it, and that is what makes it read as
// lying ON the ground rather than placed on it.
const STONE_MIN_H = 0.05;
const STONE_MAX_H = 0.26;
const BOULDER_MIN_H = 0.55;
const BOULDER_MAX_H = 1.6;
// Radius as a multiple of height, and the two modes need DIFFERENT multipliers -
// which is the second half of the same mistake. Cobbles are flattish, wider than
// they are tall, because a stone that has come to rest has done so on its broad
// face. Blocks are not: applying the cobbles' 1.9 to a 2.1 m boulder produced a
// 4 m radius, i.e. an 8 m wide object standing in an alpine pasture. A block is
// roughly as wide as it is tall.
const STONE_SPREAD_MIN = 0.8;
const STONE_SPREAD_MAX = 1.9;
const BOULDER_SPREAD_MIN = 0.6;
const BOULDER_SPREAD_MAX = 1.05;
// Each stone is turned by its own angle. The cheapest thing in the file, and the
// one that stops 13,924 identically-oriented octahedra from lining their facet
// edges up across a hillside - which is exactly how the shrubs read as a field of
// tents. Costs a hash, a sin and a cos in the vertex shader, and not one triangle.
const STONE_YAW_SEED = 53.9;

// THE SURFACE THE TERRAIN ACTUALLY DRAWS, which is not the one the height texture
// holds - and getting this wrong is what made the user's first look report grass and
// shrubs "galleggiano in aria".
//
// terrain.js draws a quadtree of tiles whose VERTICES sit at bilinear heightfield
// values, and whose surface between them is a flat triangle. A shader sampling the
// texture gets the bilinear value instead, which is a curved surface through those
// same vertices - so on a convex cell it sits ABOVE the drawn triangle and on a
// concave one below. Measured at the user's own vantage, over 784 points within 25 m:
// mean +0.18 m, p95 +1.56 m, worst +3.73 m, and -0.64 m at p05. Against blades
// 0.1-0.28 m tall, 47% of them floated by more than their whole height, and because
// the error has BOTH signs no constant sink can absorb it.
//
// So the placement samples the drawn surface instead: quantise to the terrain's
// finest tile grid, take its four corner heights, and interpolate the same triangle
// heightfield.js's sampleRenderedHeightfield() does - the function the walking
// camera, the POI markers and the flowers already stand on, which
// tools/test-rendered-height.mjs measures as within 0.05 m of the drawn geometry.
//
// It costs FOUR taps of the height texture where the old version used three (one
// for the height, two for the aspect), because the same four corners give both
// gradients - so the aspect comes out exact rather than as the z-only
// approximation vegetation.js documents.
//
// The grid must be the terrain's own finest one, which is asserted rather than
// copied: tools/test-groundcover.mjs fails if MAX_DEPTH or TILE_SEGMENTS moves.
const COVER_GRID_SEGMENTS = TILE_SEGMENTS * 2 ** MAX_DEPTH;

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
// A stone's geometry already extends a full radius below its own origin (an
// octahedron used unmodified - see stoneGeometry), so the ground hides its base by
// construction and buries roughly the lower half of it. Which is also what a stone
// lying in scree looks like.
const STONE_SINK_FRACTION = 0;

// WHERE THE STONES ARE, and the pleasing part of this change is that it needs no
// model at all - which the dwarf-shrub belt it replaces very much did.
//
// The shipped mask measures one thing: how much of a pixel carries vegetation that
// is not tree canopy. The grass takes that. Scree is its complement - ground the
// satellite says nothing grows on - so the two layers now partition the same
// measurement between them instead of splitting one half of it by a
// piecewise-linear guess about the Alpine belt sequence. Above the treeline that is
// exactly the boundary a walker sees: turf, then turf-and-stones, then stones.
//
// TWO TERMS HAVE TO BE SUBTRACTED, NOT ONE, and forgetting the second would have
// cobbled every forest floor in the park. "Not vegetation" is not "bare": under a
// wood the open-vegetation mask reads ~0 because the canopy is not open vegetation,
// so 1 - cover is ~1 there. The canopy has its own mask (src/forest.js, the one
// vegetation.js plants trees from), and the scree layer samples it too - one extra
// texture fetch per vertex, paid only by this layer.
const SCREE_FROM_BARE = 1.0; // of the ground the mask says carries no open vegetation
// Even bare ground is not wall-to-wall stone, and at 1.0 a scree slope came out as
// a paved surface rather than a slope with stones on it. This is the one number
// here that is taste rather than measurement, and it is the one to turn if the
// user finds the field too busy or too thin.
const SCREE_DENSITY = 0.62;
// THE ANGLE OF REPOSE, and it is not decoration - it is what stops loose stones
// from being drawn on a cliff. The first build put cobbles all over the Gran
// Paradiso summit ridge, and the reason is a chain worth writing down: the ice is
// buried by STONE_BURY because snowCover() reads 1 there, but snow.js correctly
// refuses to lie on steep ground, so the STEEP rock came out unsnowed, unvegetated,
// uncanopied - and therefore, by the rule above, scree. A 50-degree face covered in
// loose stones.
//
// Talus stands at its angle of repose and no steeper; past about 35 degrees the
// stones have already gone downhill and what is left is rock. Faded rather than
// cut, so a slope does not end on a hard line. Free: drawnElevation() already hands
// back both gradients, so the slope is a length() of something already fetched -
// which is the same argument that made the aspect free for the snow.
//
// The vegetation mask has slope baked out of it at build time, so the grass never
// needed this. Scree is derived from the mask's COMPLEMENT, and a complement does
// not inherit a filter - it inherits its inverse.
const SCREE_SLOPE_FADE = [0.55, 0.78]; // tan(slope): ~29 deg full, ~38 deg none

// Albedo, not appearance - the warning at the top of src/terrain.js applies to
// every colour in this project. These are multipliers ON the satellite albedo
// under the tuft, which is why they sit near 1: they lean the ground's own colour
// towards leaf rather than replacing it. Green up, red and blue down, brightness
// roughly kept.
const GRASS_TINT = [0.88, 1.16, 0.72];
// Stone. Near 1 and very nearly neutral, and both of those are the point: a stone
// in a scree IS the ground it lies on, geologically and photographically - the
// satellite pixel under it is already the colour of that rock, because the rock is
// what the satellite saw. So this barely touches the albedo. It lifts it a little,
// because a fresh broken face is lighter than the weathered surface averaged into a
// 20 m texel, and pulls the tiniest amount of green out so a stone in a meadow does
// not inherit the grass next to it.
//
// The shrub tint this replaces was [0.48, 0.6, 0.48], i.e. a 0.57-luma multiplier
// that made the cushions 2.7x darker than the ground - measured only after the
// owned-pixel instrument existed. Nothing here should repeat that: the test asserts
// stone is LIGHTER than turf and close to neutral.
const STONE_TINT = [1.02, 1.0, 0.97];
// Used only until the satellite texture lands (uBasemapMix is 0 until then), so
// this is a fraction of a second in practice and never a design decision. Solved
// the same way as the terrain bands: it looks too light as a swatch.
const FALLBACK_ALBEDO = 0x93a86a;

// Snow. Grass is BURIED rather than whitened: a 0.2 m tuft under settled snow is
// gone, and a white tuft standing on white ground would read as debris.
//
// Stones are buried the same way and just as completely, which is a decision worth
// stating because the tempting alternative is wrong. Leaving blocks standing under
// full cover sounds more realistic - a 1.6 m erratic does poke through real snow -
// but snowCover() returns how much of the ground is UNDER snow, not how deep it is,
// so 1.0 means the surface is gone. A glaciated summit reads 1.0, and the control
// this project has relied on since the grass shipped is that nothing at all is
// drawn on the Gran Paradiso ice. Stones sitting on a glacier would break it, and
// break it invisibly.
const GRASS_BURY = 1.0; // fraction of height removed at full cover
const STONE_BURY = 1.0;
const STONE_SNOW_MIX = 0.9;

// Wind. weather.js already drives a wind strength that audio.js turns into hiss;
// this is the same number made visible. The direction is a constant rather than a
// simulated field: what the eye reads in moving grass is the travelling wave, not
// the bearing, and a real direction would have to agree with the cloud drift and
// the rain streaks to be worth having.
const WIND_DIR = [0.83, 0.56]; // unit-ish, x and z
const WIND_WAVE_M = 9; // wavelength of the gust travelling across the field
const WIND_SPEED = 1.7; // wave crests per second
const GRASS_SWAY_M = 0.075; // tip travel at full wind
// Stone does not move in wind, at the user's explicit instruction and because it
// is a stone. Zero rather than a small number: written as a compile-time 0.0 the
// whole bend term folds away in the scree program, so the sin() and the dot() that
// drive the travelling wave cost nothing there rather than being computed and
// multiplied out.
const STONE_SWAY_M = 0;

// A GRASS FIELD IS NOT A CHOREOGRAPHY, which one travelling wave plus a per-blade
// phase very nearly is: every tuft on a wavefront reaches its extreme in the same
// instant, and the eye picks that up as a sweep rather than as air moving. The
// user asked for "un moto leggermente piu' randomico" and these are the three
// cheap ways to give it one, all per-TUFT (from the cell hash, so a tuft keeps its
// character forever) rather than per-frame.
//
// Deliberately small. The wave has to survive: it is what makes a gust read as
// crossing the field rather than as every blade twitching on its own, and that was
// the reason it was written that way. These break the lockstep, they do not
// replace it.
const GRASS_PHASE_JITTER = 2.2; // radians of the wave a tuft can lag or lead by
const GRASS_GUST_MIN = 0.55; // per-tuft amplitude, so some tufts are stiffer
const GRASS_GUST_MAX = 1.45;
// A second, slower wave crossing at an angle to the first, which is what stops the
// combination from ever repeating exactly: two incommensurable periods beat against
// each other instead of looping. Costs one more sin().
const GRASS_CROSS_DIR = [-0.55, 0.84];
const GRASS_CROSS_WAVE_M = 23;
const GRASS_CROSS_SPEED = 0.61;
const GRASS_CROSS_MIX = 0.45; // of the main wave's amplitude

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
  GRASS, SCREE, BLADES_PER_TUFT, STONE_TRIANGLES, GRASS_TINT, STONE_TINT,
  GRASS_SINK_FRACTION, GRASS_MIN_H, GRASS_MAX_H, COVER_GRID_SEGMENTS,
  STONE_MIN_H, STONE_MAX_H, BOULDER, BOULDER_TRIANGLES, BOULDER_SIDES,
  BOULDER_MIN_H, BOULDER_MAX_H,
  STONE_SWAY_M, GRASS_SWAY_M, SCREE_DENSITY, SCREE_SLOPE_FADE,
  STONE_SPREAD_MAX, BOULDER_SPREAD_MAX, stoneGeometry, boulderGeometry,
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

// GONE WITH THE SHRUBS (2026-08-13): shrubShareAt() and its GLSL twin, a
// piecewise-linear table of how much of the open vegetation at a given elevation
// was dwarf shrub rather than grass. It was the one MODEL in a file that otherwise
// only reads measurements, and removing the shrub layer removed the thing it was
// modelling. The grass now takes the mask whole and the scree takes its complement,
// so nothing interpolates a belt any more. Kept in the git history rather than
// here; docs/PROGRESS.md records why it was tuned the way it was.

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

// A stone: an OctahedronGeometry(1, 0), used exactly as three hands it over. This
// is the shape the dwarf shrubs were made of, and it came back on 2026-08-13 for
// the reason it failed there. Every attempt to make it read as a plant failed -
// pyramid, then trapezium, then "tronchetti" - because a hard-edged faceted lump
// is not a plant. It is a stone, and as a stone it needs no work at all.
//
// Used UNMODIFIED, with its lower half left below the ground where the terrain
// hides it. The obvious saving - folding the bottom vertices up with abs(y) so no
// facet is wasted underfoot - makes the lower facets exactly coincident with the
// upper ones, and two coplanar triangles at the same depth z-fight. Four wasted
// triangles per stone is the cheaper mistake, and here it is barely a waste: a
// stone half-buried in its own scree is what a stone in scree is, so the sunk half
// is doing the job that SHRUB_SINK_FRACTION used to have to fake.
//
// FLAT-SHADED, and the normals are never read - flatShading takes them from
// screen-space derivatives. The 16-triangle cushion that briefly lived here needed
// indexed geometry and hand-authored dome normals to shade as curved; a stone
// wants the opposite, so all of that is gone and the dummy attribute is back. It
// is still required, because three's shader declares it.
//
// position.y runs -1..1 and the shader scales it by the stone's height, so
// `height` is what stands above ground.
function stoneGeometry() {
  const octa = new THREE.OctahedronGeometry(1, 0);
  const pos = octa.attributes.position;
  const verts = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    verts[i * 3] = pos.getX(i);
    verts[i * 3 + 1] = pos.getY(i);
    verts[i * 3 + 2] = pos.getZ(i);
  }
  if (pos.count !== STONE_TRIANGLES * 3) {
    throw new Error(`stoneGeometry: ${pos.count / 3} triangles, STONE_TRIANGLES says ${STONE_TRIANGLES}`);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geometry.setAttribute('aBlade', new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(verts.length), 3));
  octa.dispose();
  return geometry;
}

// A block, with its point taken off - the user's own instruction, and they offered
// triangles to pay for it. 22 of them, against the stone's 8, on a layer of only 36
// instances: under 800 triangles in the whole scene.
//
// THE POINT IS NOT REPLACED BY A FLAT TOP, and that is the entire design. The last
// three times a shape in this file lost its apex it gained a horizontal plate
// instead, and the user's words for the results were "piramidi", then "piramidi"
// again, then "tronchetti... stonano moltissimo con il prato". A truncation is a
// frustum, and a frustum reads as manufactured.
//
// So the crown is a RING OF SIX AT SIX DIFFERENT HEIGHTS, capped by a fan of four.
// Because the ring is not planar, those four cap facets have four different normals
// under flat shading: a broken crown rather than a table. Every vertex of both rings
// is jittered in height, radius and azimuth from a seeded generator, so the block is
// irregular the way a broken rock is and identical on every load and every machine
// (Math.random() would reshuffle the park on reload - see mulberry32 above).
//
// Below the equator it keeps the octahedron's answer: a fan down to a single buried
// point. That half is underground, so it is the one place detail would be wasted,
// and it has to reach a full radius down because a 1.6 m block on a slope shows its
// uphill side otherwise.
function boulderGeometry() {
  const n = BOULDER_SIDES;
  const rnd = mulberry32(0x5b09d13f);
  const jitter = (amount) => 1 + (rnd() - 0.5) * 2 * amount;
  const crown = [];
  const equator = [];
  for (let i = 0; i < n; i++) {
    const a = ((i + (rnd() - 0.5) * 0.55) / n) * Math.PI * 2;
    const cr = 0.46 * jitter(0.3);
    // The six crown heights are the thing that stops this being a flat top, so the
    // spread is deliberately wide - 0.5 to 1.0 of the block's height.
    crown.push([Math.cos(a) * cr, 0.5 + rnd() * 0.5, Math.sin(a) * cr]);
    const b = ((i + 0.5 + (rnd() - 0.5) * 0.55) / n) * Math.PI * 2;
    const er = jitter(0.22);
    equator.push([Math.cos(b) * er, (rnd() - 0.5) * 0.3, Math.sin(b) * er]);
  }
  // Normalised so the tallest crown vertex is exactly 1: `height` has to keep
  // meaning what stands above ground, as it does for every other shape here.
  const top = Math.max(...crown.map((p) => p[1]));
  for (const p of crown) p[1] /= top;

  const tris = [];
  for (let i = 1; i < n - 1; i++) tris.push(crown[0], crown[i], crown[i + 1]);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    tris.push(crown[i], crown[j], equator[i]);
    tris.push(equator[i], equator[j], crown[j]);
  }
  const foot = [0, -1, 0];
  for (let i = 0; i < n; i++) tris.push(equator[i], equator[(i + 1) % n], foot);

  if (tris.length !== BOULDER_TRIANGLES * 3) {
    throw new Error(`boulderGeometry: ${tris.length / 3} triangles, BOULDER_TRIANGLES says ${BOULDER_TRIANGLES}`);
  }
  const verts = new Float32Array(tris.length * 3);
  for (let i = 0; i < tris.length; i++) {
    verts[i * 3] = tris[i][0];
    verts[i * 3 + 1] = tris[i][1];
    verts[i * 3 + 2] = tris[i][2];
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geometry.setAttribute('aBlade', new THREE.BufferAttribute(new Float32Array(tris.length * 3), 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(verts.length), 3));
  return geometry;
}

function createLayer({ kind, layer, manifest, heightTexture }) {
  const { xmin, ymin, xmax, ymax } = manifest.bboxCrsUnits;
  const { min: elevMin, max: elevMax } = manifest.elevationRangeM;
  const worldWidth = xmax - xmin;
  const worldDepth = ymax - ymin;
  const isGrass = kind === 'grass';
  const isBoulder = kind === 'boulder';

  const { offsets, count, pitchM } = coverLattice(layer);
  // eslint-disable-next-line no-nested-ternary
  const source = isGrass ? tuftGeometry() : (isBoulder ? boulderGeometry() : stoneGeometry());

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
    // Flat for both layers, and for the same reason each: a blade is a single
    // triangle with no curvature to interpolate, and a stone is meant to have hard
    // edges. The 16-triangle cushion that briefly lived in the second slot needed
    // indexed geometry and hand-authored dome normals to shade as curved; none of
    // that survived the shrubs being removed, and both layers are back to reading
    // their normals from screen-space derivatives.
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
${isGrass ? '' : '    uniform sampler2D uForestMask; // scree only - see SCREE_FROM_BARE\n'}    uniform float uGroundSegments;
${heightTierGlsl()}
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
    // The height of the surface the terrain DRAWS at a world point, plus its two
    // gradients, from four taps of the corner heights of the terrain's finest tile
    // cell. A transcription of heightfield.js's sampleRenderedHeightfield(),
    // including its choice of diagonal - f.x + f.y <= 1 - which is the one that
    // matches three's PlaneGeometry triangulation.
    //
    // grad.x is dh/dx. grad.y is (north - south) / cell, i.e. -dh/dz: +Z is South
    // (docs/ARCHITECTURE.md section 6), so the smaller-z corners are the northern
    // pair, and this is the sign convention snow.js's aspect term expects.
    // The ground at a point: the shipped grid plus the optional tier's correction.
    // One function, so no caller can take the base and forget the tier.
    float coverGround( vec2 wxz ) {
      return coverElevation( coverUv( wxz ) ) + heightTierM( wxz );
    }
    // THE CELL SIZE IS A UNIFORM, NOT A CONSTANT, because the tier raises the
    // terrain's finest LOD by one level inside its rectangle. Baking 4096 in here
    // would leave every tuft and stone reproducing a triangulation the terrain
    // stopped drawing, which puts them above the surface on convex cells - the
    // 2026-08-12 defect, re-earned.
    float drawnElevation( vec2 wxz, out vec2 grad ) {
      vec2 cell = vec2( ${glsl(worldWidth)}, ${glsl(worldDepth)} ) / uGroundSegments;
      vec2 g = ( wxz + vec2( ${glsl(worldWidth / 2)}, ${glsl(worldDepth / 2)} ) ) / cell;
      vec2 i = floor( g );
      vec2 f = g - i;
      vec2 c0 = i * cell - vec2( ${glsl(worldWidth / 2)}, ${glsl(worldDepth / 2)} );
      float h00 = coverGround( c0 );
      float h10 = coverGround( c0 + vec2( cell.x, 0.0 ) );
      float h01 = coverGround( c0 + vec2( 0.0, cell.y ) );
      float h11 = coverGround( c0 + cell );
      grad = vec2( ( ( h10 + h11 ) - ( h00 + h01 ) ) / ( 2.0 * cell.x ),
                   ( ( h00 + h10 ) - ( h01 + h11 ) ) / ( 2.0 * cell.y ) );
      float lower = h00 + f.x * ( h10 - h00 ) + f.y * ( h01 - h00 );
      float upper = h11 + ( 1.0 - f.x ) * ( h01 - h11 ) + ( 1.0 - f.y ) * ( h10 - h11 );
      return f.x + f.y <= 1.0 ? lower : upper;
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
    // The DRAWN height, not the texture's own: see drawnElevation() above. The four
    // corner taps also hand back both gradients, so the aspect below is free.
    vec2 coverGrad;
    float h = drawnElevation( slot, coverGrad );
    // THE TWO LAYERS PARTITION THE MASK rather than splitting half of it by a
    // model. Grass takes the vegetated fraction, whole - it used to get only
    // 1 - SHRUB_SHARE of it, and the dwarf shrub that had the rest was removed by
    // the user on 2026-08-13. Scree takes the complement, MINUS the canopy: "not
    // open vegetation" is not "bare", because under a wood the mask reads ~0 and
    // 1 - cover would cobble every forest floor in the park.
${
  isGrass
    ? '    float mine = cover;'
    : `    float wood = texture2D( uForestMask, uv ).r;
    // Not steeper than talus stands - see SCREE_SLOPE_FADE. coverGrad is already
    // in hand from drawnElevation(), so this is a length() and a smoothstep().
    float repose = 1.0 - smoothstep( ${glsl(SCREE_SLOPE_FADE[0])}, ${glsl(SCREE_SLOPE_FADE[1])},
                                     length( coverGrad ) );
    float mine = ( 1.0 - cover ) * ( 1.0 - wood ) * repose
               * ${glsl(SCREE_FROM_BARE * SCREE_DENSITY)};`
}

    // Coverage as a probability, exactly as the forest does it: 40% cover keeps
    // 40% of slots, so a margin thins out instead of ending on the mask's own
    // texel grid.
    float exists = step( coverHash( coverCell ), mine );

    float dist = length( cameraPosition.xz - slot );
    float near = 1.0 - smoothstep( ${glsl(layer.fadeStartM)}, ${glsl(layer.visibleM)}, dist );

    // The ground normal's z, exactly - not vegetation.js's z-only approximation,
    // because drawnElevation() already had to fetch the corners that give both
    // gradients. Negative faces north (snow.js's SNOW_ASPECT_M).
    float aspectZ = coverGrad.y * inversesqrt( 1.0 + dot( coverGrad, coverGrad ) );
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
    // A tuft already carries its own azimuth per blade (tuftGeometry's irrational
    // step), so there is nothing left to turn.
    mat2 yawM = mat2( 1.0, 0.0, 0.0, 1.0 );
    vCoverSnow = 0.0;
    vec3 tint = vec3( ${GRASS_TINT.map(glsl).join(', ')} );
    float sway = ${glsl(GRASS_SWAY_M)};`
    : `    // The two mineral layers run the same code on different constants: cobbles
    // are the scree, blocks are their own layer because they carry a richer
    // geometry and a layer draws one geometry for all of its instances.
    float height = mix( ${glsl(isBoulder ? BOULDER_MIN_H : STONE_MIN_H)}, ${glsl(isBoulder ? BOULDER_MAX_H : STONE_MAX_H)},
                        coverHash( coverCell + 13.1 ) )
                 * exists * near * ( 1.0 - snow * ${glsl(STONE_BURY)} );
    // Cobbles are flattish - a stone that has come to rest has done so on its broad
    // face - and blocks are roughly as wide as they are tall. Applying the cobbles'
    // multiplier to the boulder range once gave a 2.1 m block a 4 m radius.
    float radius = height * mix( ${glsl(isBoulder ? BOULDER_SPREAD_MIN : STONE_SPREAD_MIN)}, ${glsl(isBoulder ? BOULDER_SPREAD_MAX : STONE_SPREAD_MAX)},
                                 coverHash( coverCell + 29.7 ) );
    // Its own yaw - see STONE_YAW_SEED. Without this all 13,924 octahedra line
    // their facet edges up across the hillside, which is exactly how this shape
    // read as a field of identical tents when it was a shrub.
    float yaw = coverHash( coverCell + ${glsl(STONE_YAW_SEED)} ) * ${glsl(Math.PI * 2)};
    float cy = cos( yaw ), sy = sin( yaw );
    mat2 yawM = mat2( cy, sy, -sy, cy );
    vCoverSnow = snow * ${glsl(STONE_SNOW_MIX)};
    vec3 tint = vec3( ${STONE_TINT.map(glsl).join(', ')} );
    float sway = ${glsl(STONE_SWAY_M)};`
}

    // The ground's own colour, leaned towards leaf. basemapAlbedo() is the very
    // same function terrain.js colours the ground with, so a tuft cannot disagree
    // with what it stands on by more than the tint.
    vec3 photo = mix( ${(() => {
      const c = new THREE.Color(FALLBACK_ALBEDO);
      return `vec3( ${glsl(c.r)}, ${glsl(c.g)}, ${glsl(c.b)} )`;
    })()}, basemapAlbedo( uv, 0.0 ), uBasemapMix );
    vCoverAlbedo = photo * tint * mix( 0.82, 1.18, coverHash( coverCell + 7.1 ) );

    // Wind: a travelling wave across the world, so a gust CROSSES the field
    // instead of every tuft nodding in unison. Applied to the tips only -
    // position.y is 0 at the ground - which is what bending is.
${
  isGrass
    ? `    // Three per-tuft randomisations on top of it (2026-08-13, the user asked for
    // "un moto leggermente piu' randomico"), all seeded from the CELL so a tuft
    // keeps its character forever rather than shimmering frame to frame:
    //
    //   - a phase lag, so tufts on one wavefront no longer reach their extreme in
    //     the same instant. This is the one that removes the choreography.
    //   - a stiffness, so some tufts barely move in the same gust that lays
    //     others over.
    //   - a second, slower wave crossing at an angle. Its period is
    //     incommensurable with the first, so the sum never repeats exactly.
    //
    // Kept small on purpose. The travelling wave is what makes wind read as
    // weather rather than as jitter, and these break its lockstep without
    // replacing it.
    float lag = ( coverHash( coverCell + 3.3 ) - 0.5 ) * ${glsl(GRASS_PHASE_JITTER)};
    float gust = mix( ${glsl(GRASS_GUST_MIN)}, ${glsl(GRASS_GUST_MAX)}, coverHash( coverCell + 47.9 ) );
    float wave = sin( dot( slot, vec2( ${glsl(WIND_DIR[0])}, ${glsl(WIND_DIR[1])} ) ) * ${glsl((2 * Math.PI) / WIND_WAVE_M)}
                    - uCoverTime * ${glsl(WIND_SPEED * 2 * Math.PI)} + aBlade.z + lag );
    float cross = sin( dot( slot, vec2( ${glsl(GRASS_CROSS_DIR[0])}, ${glsl(GRASS_CROSS_DIR[1])} ) ) * ${glsl((2 * Math.PI) / GRASS_CROSS_WAVE_M)}
                     - uCoverTime * ${glsl(GRASS_CROSS_SPEED * 2 * Math.PI)} + lag );
    vec2 bend = ( vec2( ${glsl(WIND_DIR[0])}, ${glsl(WIND_DIR[1])} ) * ( wave * 0.5 + 0.6 )
                + vec2( ${glsl(GRASS_CROSS_DIR[0])}, ${glsl(GRASS_CROSS_DIR[1])} ) * cross * ${glsl(GRASS_CROSS_MIX)} )
              * gust * uWind * sway * position.y;`
    : `    // Stone does not move: STONE_SWAY_M is a compile-time 0.0, so the whole term
    // folds away here and the scree program pays for none of it.
    float wave = sin( dot( slot, vec2( ${glsl(WIND_DIR[0])}, ${glsl(WIND_DIR[1])} ) ) * ${glsl((2 * Math.PI) / WIND_WAVE_M)}
                    - uCoverTime * ${glsl(WIND_SPEED * 2 * Math.PI)} + aBlade.z );
    vec2 bend = vec2( ${glsl(WIND_DIR[0])}, ${glsl(WIND_DIR[1])} ) * ( wave * 0.5 + 0.6 )
              * uWind * sway * position.y;`
}

    // position.xz scaled by the radius and, for a stone, turned by the instance's
    // own yaw. The bend is NOT folded in here: the wind blows in a world direction
    // and does not care which way a tuft happens to face.
    vec2 local = yawM * position.xz * radius;

    // NO NORMAL IS COMPUTED HERE, and it used to be. Both layers are flat-shaded
    // again, so three takes the normal from screen-space derivatives and the
    // attribute is never read - which is also why the placement is back to a
    // single injection at begin_vertex rather than being split across
    // beginnormal_vertex to get radius and yaw defined early enough.
    //
    // What was here was an inverse-transpose correction for the non-uniform
    // diag(radius, height, radius) scale, needed by the 16-triangle smooth-shaded
    // cushion. Worth remembering if anything in this file is ever smooth-shaded
    // again: rotating a normal with its vertex under a non-uniform scale tilts it,
    // and for a diagonal scale the correction is just the reciprocals.

    // height = 0 collapses every vertex onto the base point, so a slot that holds
    // nothing draws degenerate triangles and costs no fragments at all.
    // Three separate scales, and keeping them separate is the point: the base
    // width is absolute (a taller blade is not a wider one), the lean is a
    // fraction of the height (a taller blade arcs further), and the sink is a
    // fraction of the height too.
    vec3 transformed = vec3(
      local.x + aBlade.x * height + slot.x + bend.x,
      position.y * height + h - height * ${glsl(isGrass ? GRASS_SINK_FRACTION : STONE_SINK_FRACTION)},
      local.y + aBlade.y * height + slot.y + bend.y
    );
  `;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uHeightMap = { value: heightTexture };
    shader.uniforms.uCoverMask = LANDCOVER_MASK; // shared holder - may still be downloading
    // The canopy mask, bound for the scree layer only, and for a reason worth the
    // line: "not open vegetation" is not "bare ground". Under a wood the landcover
    // mask reads ~0, so scree taken as 1 - cover would have put boulders on every
    // forest floor in the park. Same shared-holder arrangement as vegetation.js.
    if (!isGrass) shader.uniforms.uForestMask = FOREST_MASK;
    shader.uniforms.uGroundSegments = GROUND_SEGMENTS;
    shader.uniforms.uHeightTier = HEIGHT_TIER;
    shader.uniforms.uHeightTierRect = HEIGHT_TIER_RECT;
    shader.uniforms.uHeightTierMix = HEIGHT_TIER_MIX;
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
    createLayer({ kind: 'scree', layer: SCREE, manifest, heightTexture }),
    createLayer({ kind: 'boulder', layer: BOULDER, manifest, heightTexture }),
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
      scree: {
        instances: layers[1].count,
        trianglesPerInstance: STONE_TRIANGLES,
        windowM: SCREE.windowM,
        spacingM: layers[1].pitchM,
        visibleM: SCREE.visibleM,
      },
      boulder: {
        instances: layers[2].count,
        trianglesPerInstance: BOULDER_TRIANGLES,
        windowM: BOULDER.windowM,
        spacingM: layers[2].pitchM,
        visibleM: BOULDER.visibleM,
      },
      trianglesAtFullDensity: layers[0].count * BLADES_PER_TUFT
        + layers[1].count * STONE_TRIANGLES
        + layers[2].count * BOULDER_TRIANGLES,
    },
  };
}
