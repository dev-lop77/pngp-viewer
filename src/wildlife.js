import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { attachAtmo } from './atmosphere.js';
import { nearestTree, TREE_SPACING_M } from './vegetation.js';
import { MODEL_DETAIL } from './modeldetail.js';

// Wildlife (phase 6, docs/ARCHITECTURE.md §8): Alpine ibex above all - the park
// was created in 1922 to save the last few hundred of them, and they are the
// reason it exists - plus chamois and marmots.
//
// This does NOT use vegetation.js's trick of placing everything in the vertex
// shader. That works for trees because a tree never moves: its position is a
// pure function of its lattice slot, so the shader can derive it from scratch
// every frame. An animal's position depends on where it was last frame, which is
// state, and state lives on the CPU. So each species is one InstancedMesh whose
// matrices are rewritten per frame - affordable because the population is
// bounded by draw distance, not by map size (~110 animals typically, 184 worst
// case, against 27,889 trees).
//
// What is shared with the trees is the idea of a deterministic lattice. Herds sit
// on a per-species grid of cells; a cell's contents come from a hash of its
// integer coordinates, so the same hillside always holds the same herd of the
// same size, and walking away and back does not reshuffle the park. Habitat is
// then tested at the site itself against three real signals:
//
//   - elevation, from the terrain's own sampleRenderedHeight (the DRAWN surface,
//     so animals stand on the ground the user sees, not on the true heightfield);
//   - slope, from that same sampler - ibex want rock faces, marmots want ground
//     gentle enough to dig a burrow in;
//   - canopy, from the OSM forest mask (src/forest.js, CPU side) - the signal
//     that separates "above the treeline", "at its edge" and "open meadow".
//
// Deliberately NOT scoped to the park boundary, unlike POI and trails: ibex have
// recolonised most of the western Alps from this population, so a herd on a ridge
// just outside the line is accurate rather than a bug.
//
// Each species also has a REACTION to being approached, which is the part that
// makes an animal read as that animal (added 2026-08-04 at the user's request for
// foxes and squirrels, and it turned the existing flee code into one of three
// cases):
//   'flee'    - ibex, chamois, marmots: keep their distance.
//   'curious' - foxes: they come to YOU. The user's point exactly - habituated
//               foxes approach walkers near trails and huts. Only some of them
//               do, decided per animal from the lattice hash, so it stays an
//               event rather than a rule.
//   'hide'    - squirrels: put a trunk between themselves and you, using the real
//               tree positions from vegetation.js.
const TAU = Math.PI * 2;

// Coats solved backwards from their intended on-screen colour with
// tools/dev/solve-albedo.mjs, exactly like the terrain bands and the canopy.
// These are albedo: they look too light as swatches and must NOT be darkened to
// taste - see the warning at the top of terrain.js.
const COAT = {
  ibex: 0x94897a, // wants rgb(110,100,85) on screen - grey-brown winter coat
  horn: 0x726a5f, // wants rgb(74,66,56) - keratin, darker than the coat
  chamois: 0xa1805d, // wants rgb(122,90,58) - reddish summer coat
  marmot: 0xb49e7e, // wants rgb(141,122,92) - sandy grey-brown
  fox: 0xd08447, // wants rgb(164,96,42) - russet
  squirrel: 0xb57f5a, // wants rgb(140,90,56) - red squirrel, dark Alpine form
  stocking: 0x635b52, // wants rgb(58,51,43) - a fox's black legs and ear tips
  // The pale chest/bib/tail-tip. Its target is out of reach at this exposure, so
  // like the nival band this is simply as bright as the rig allows - which is the
  // right answer for it, since it only has to read as "much lighter than the coat".
  bib: 0xfffce0,
};

// A herd is re-chosen when the camera has moved far enough for the cell window to
// have shifted, not every frame: the habitat tests cost height samples, and the
// answer cannot change while the camera stands still.
const RESCAN_MOVE_M = 50;
const RESCAN_S = 1.5;
// Legs swing about the hip through this angle at full stride.
const SWING_RAD = 0.42;
// How fast an animal's body settles onto a new surface normal. The facet gradient
// steps as it crosses a terrain cell boundary, and applying that instantly reads
// as a twitch.
const ORIENT_SMOOTH_S = 0.2;
// Feet a few centimetres into the ground: the body is oriented to the facet under
// its centre, so a foot reaching over a cell edge can otherwise show daylight.
const FOOT_SINK_M = 0.04;

const SPECIES = [
  {
    name: 'ibex',
    // Baseline for the surface-normal estimate: about the animal's own length, so
    // one standing across a terrain cell edge averages both facets instead of
    // snapping between them.
    orientBaseM: 1.5,
    reaction: 'flee',
    salt: 0x1b1,
    // ~4,000 ibex over ~700 km2 of park is 5-6 per km2. A herd every other
    // 600 m cell, 4-9 animals each, lands at ~6/km2 of suitable ground.
    cellM: 600,
    presence: 0.5,
    herdMin: 4,
    herdMax: 9,
    spreadM: 22, // how far apart the animals of one herd settle
    wanderM: 14, // how far from its own spot an animal grazes
    speedMps: 0.65,
    fleeMul: 2.2,
    alertM: 45, // ibex are wary but not panicky
    grazeS: 9,
    strideM: 0.9, // metres of travel per full leg cycle
    turnRate: 1.6,
    visibleM: 480,
    fadeStartM: 380,
    scaleMin: 0.9,
    scaleMax: 1.15,
    capacity: 64,
    habitat: { elevMin: 2000, elevMax: 3400, slopeMin: 18, slopeMax: 58, canopyMax: 0.18 },
  },
  {
    name: 'chamois',
    orientBaseM: 1.2,
    reaction: 'flee',
    salt: 0x2c2,
    cellM: 500,
    presence: 0.45,
    herdMin: 3,
    herdMax: 7,
    spreadM: 18,
    wanderM: 12,
    speedMps: 0.8,
    fleeMul: 2.6,
    alertM: 55, // the most easily spooked of the three
    grazeS: 7,
    strideM: 0.75,
    turnRate: 1.9,
    visibleM: 430,
    fadeStartM: 330,
    scaleMin: 0.85,
    scaleMax: 1.05,
    capacity: 56,
    // Lower and less vertical than ibex, and the one species that uses the
    // forest itself - hence a canopy window rather than a ceiling.
    habitat: { elevMin: 1100, elevMax: 2700, slopeMin: 12, slopeMax: 48, canopyMin: 0.02, canopyMax: 0.7 },
  },
  {
    name: 'marmot',
    orientBaseM: 0.6,
    reaction: 'flee',
    salt: 0x3d3,
    // Family groups at a burrow, so a much finer lattice and tighter spread.
    cellM: 240,
    presence: 0.5,
    herdMin: 2,
    herdMax: 5,
    spreadM: 9,
    wanderM: 7,
    speedMps: 1.1, // they scurry rather than walk
    fleeMul: 3.2, // and bolt for the burrow
    alertM: 25, // they let you get closer first
    grazeS: 5,
    strideM: 0.32,
    turnRate: 3.2,
    visibleM: 230, // 50 cm of animal - past this it is one pixel
    fadeStartM: 170,
    scaleMin: 0.85,
    scaleMax: 1.1,
    capacity: 64,
    // Burrows need diggable, gentle, open ground - which is exactly why marmots
    // are a meadow animal and not a cliff one.
    habitat: { elevMin: 1500, elevMax: 2900, slopeMin: 0, slopeMax: 26, canopyMax: 0.28 },
  },
  {
    name: 'fox',
    orientBaseM: 1.0,
    salt: 0x4e4,
    reaction: 'curious',
    // Solitary and territorial - a red fox holds a few km2 - so much the coarsest
    // lattice here and rarely more than a pair.
    cellM: 900,
    presence: 0.35,
    herdMin: 1,
    herdMax: 2,
    spreadM: 30,
    wanderM: 26, // they cover ground constantly rather than grazing a patch
    speedMps: 1.1,
    grazeS: 5,
    strideM: 0.7,
    turnRate: 2.4,
    visibleM: 380,
    fadeStartM: 300,
    scaleMin: 0.9,
    scaleMax: 1.1,
    capacity: 24,
    // How this species reacts, instead of the flee radius the others use.
    curiousM: 130, // notices you from here and starts coming over
    standoffM: 7, // ...and stops about this far off, watching
    boldChance: 0.55, // the rest keep their distance like everything else
    approachMul: 1.7,
    // Retreating is much faster than approaching, and deliberately faster than the
    // 4 m/s walk in controls.js: at 1.7x it simply lost the race and could be
    // walked into. A real fox does 50 km/h, so 1.1 x 4.5 = 5 m/s is still modest.
    escapeMul: 4.5,
    fleeMul: 2.2, // used by the shy ones
    alertM: 40,
    // The least fussy animal in the park: valley floor to well above the
    // treeline, forest or open, as long as it is not a cliff.
    habitat: { elevMin: 700, elevMax: 2800, slopeMin: 0, slopeMax: 45, canopyMax: 0.9 },
  },
  {
    name: 'squirrel',
    orientBaseM: 0.4,
    salt: 0x5f5,
    reaction: 'hide',
    // Dense in woodland, and solitary: a fine lattice with one or two animals.
    cellM: 120,
    presence: 0.45,
    herdMin: 1,
    herdMax: 2,
    spreadM: 6,
    wanderM: 5, // never far from its own tree
    speedMps: 1.6, // darting, not walking
    grazeS: 3.5,
    strideM: 0.2,
    turnRate: 6,
    visibleM: 130, // 25 cm of animal - past this it is one pixel
    fadeStartM: 95,
    scaleMin: 0.85,
    scaleMax: 1.05,
    capacity: 40,
    alertM: 35,
    fleeMul: 2.5, // the dash for cover
    hideR: 1.2, // how far round the far side of the trunk it settles
    // Cover stops being cover when the camera reaches the tree itself: inside this
    // distance from the TRUNK, the squirrel gives it up and dashes to another one
    // about bailoutHopM further into the wood.
    bailoutM: 6,
    bailoutHopM: 14,
    // Real canopy, not a margin: a squirrel needs a tree to hide behind, and only
    // a solid mask cell guarantees the shader actually put one there (see
    // hideBehindTree). 2,200 m is about where this forest stops.
    habitat: { elevMin: 600, elevMax: 2200, slopeMin: 0, slopeMax: 45, canopyMin: 0.9 },
  },
];

function glsl(n) {
  const s = n.toPrecision(12);
  return s.includes('.') || s.includes('e') ? s : `${s}.0`;
}

function patch(source, marker, replacement) {
  if (!source.includes(marker)) {
    throw new Error(`wildlife.js: shader marker not found: ${marker}`);
  }
  return source.replace(marker, replacement);
}

// Same generator as vegetation.js, for the same reason: a herd must be identical
// on every load and on every machine.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Cell coordinates are signed and unbounded, so they are mixed into a seed rather
// than used as one.
function cellRandom(ix, iz, salt) {
  let h = Math.imul(ix | 0, 0x27d4eb2d) ^ Math.imul(iz | 0, 0x165667b1) ^ Math.imul(salt, 0x9e3779b9);
  h = Math.imul(h ^ (h >>> 15), 0x2545f491);
  return mulberry32(h ^ (h >>> 13));
}

// Tag one primitive with its colour and, if it is a leg, what it swings about.
// aLeg = (swing sign, pivot height): the sign puts diagonal legs in antiphase,
// which is the trot every one of these three animals actually uses.
function part(geometry, color, { swing = 0, pivotY = 0 } = {}) {
  // No texture on any of this, and mergeGeometries needs every part to carry the
  // same attributes - dropping uv keeps that consistent and saves the buffer.
  geometry.deleteAttribute('uv');
  const n = geometry.attributes.position.count;
  const colors = new Float32Array(n * 3);
  const leg = new Float32Array(n * 2);
  // ONE sRGB->linear conversion: three's ColorManagement does it inside the
  // Color constructor, and colour ATTRIBUTES are read as working space already.
  // Never also call convertSRGBToLinear() - that double gamma is a documented
  // trap in this project (docs/PROGRESS-ARCHIVE.md 2026-08-03).
  const c = new THREE.Color(color);
  for (let i = 0; i < n; i++) {
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    leg[i * 2] = swing;
    leg[i * 2 + 1] = pivotY;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aLeg', new THREE.BufferAttribute(leg, 2));
  return geometry;
}

// Bodies and necks are capsules along Z, because every animal here is modelled
// nose-toward +Z: a heading then becomes a single yaw about Y.
function capsuleZ(radius, length, radial = 7) {
  const g = new THREE.CapsuleGeometry(radius, length, 2, radial);
  g.rotateX(Math.PI / 2);
  return g;
}

// Which corner each leg stands at, and which diagonal pair it swings with. Shared,
// because the high-detail models add a thigh and a hoof PER LEG and each of those
// has to land on the same corner and inherit the same swing sign as the leg it
// belongs to - two copies of this table would let a hoof trot out of phase with
// its own foot.
const LEG_LAYOUT = (spreadX, spreadZ) => [
  [+spreadX, +spreadZ, +1], // front left  \ diagonal pair, same phase
  [-spreadX, -spreadZ, +1], // rear right   /
  [-spreadX, +spreadZ, -1], // front right \ the other diagonal, antiphase
  [+spreadX, -spreadZ, -1], // rear left    /
];

// One frame per species, at module scope so the standard and the high-detail model
// of the same animal stand on identical legs at identical hip heights. As locals
// they were two copies a divergence could hide in.
const IBEX_FRAME = { legR: 0.055, legLen: 0.55, spreadX: 0.17, spreadZ: 0.3, hipY: 0.6 };
const CHAMOIS_FRAME = { legR: 0.045, legLen: 0.46, spreadX: 0.13, spreadZ: 0.24, hipY: 0.48 };
const MARMOT_FRAME = { legR: 0.035, legLen: 0.16, spreadX: 0.1, spreadZ: 0.11, hipY: 0.18 };
const FOX_FRAME = { legR: 0.035, legLen: 0.34, spreadX: 0.09, spreadZ: 0.16, hipY: 0.36 };
const SQUIRREL_FRAME = { legR: 0.016, legLen: 0.07, spreadX: 0.04, spreadZ: 0.05, hipY: 0.09 };

function legs({ legR, legLen, spreadX, spreadZ, hipY }, color) {
  return LEG_LAYOUT(spreadX, spreadZ).map(([x, z, sign]) => {
    const g = new THREE.CylinderGeometry(legR, legR * 0.6, legLen, 5, 1);
    g.translate(x, hipY - legLen / 2, z);
    return part(g, color, { swing: sign, pivotY: hipY });
  });
}

// A horn (or a tail) as a short chain of tapering cylinders walked along a
// curve. Cheaper to reason about than a rotated torus arc, and it gives real
// control over the profile: an ibex horn rises, then sweeps back and over.
// Angles are degrees from vertical, positive leaning toward -Z (backward).
function chain(x, y0, z0, segments, color) {
  const parts = [];
  let y = y0;
  let z = z0;
  for (const s of segments) {
    const a = (-s.angle * Math.PI) / 180;
    const dy = Math.cos(a);
    const dz = Math.sin(a);
    const g = new THREE.CylinderGeometry(s.r1, s.r0, s.len, 5, 1);
    g.rotateX(a);
    g.translate(x, y + (dy * s.len) / 2, z + (dz * s.len) / 2);
    parts.push(part(g, color));
    y += dy * s.len;
    z += dz * s.len;
  }
  return parts;
}

function buildIbex() {
  const frame = IBEX_FRAME;
  const body = capsuleZ(0.27, 0.9);
  body.translate(0, 0.62, 0);
  const neck = new THREE.CapsuleGeometry(0.13, 0.3, 2, 6);
  neck.rotateX(-0.8); // leaning forward out of the shoulders
  neck.translate(0, 0.82, 0.34);
  const head = capsuleZ(0.1, 0.2, 6);
  head.translate(0, 1.02, 0.55);
  const parts = [
    part(body, COAT.ibex),
    part(neck, COAT.ibex),
    part(head, COAT.ibex),
    ...legs(frame, COAT.ibex),
  ];
  // The defining feature: a metre of ribbed horn sweeping back over the
  // shoulders. Worth its own triangles - it is what makes the animal readable
  // as an ibex rather than a generic goat.
  const horn = [
    { len: 0.2, angle: 25, r0: 0.042, r1: 0.036 },
    { len: 0.2, angle: 60, r0: 0.036, r1: 0.028 },
    { len: 0.18, angle: 100, r0: 0.028, r1: 0.015 },
  ];
  parts.push(...chain(0.06, 1.12, 0.48, horn, COAT.horn));
  parts.push(...chain(-0.06, 1.12, 0.48, horn, COAT.horn));
  return parts;
}

function buildChamois() {
  const frame = CHAMOIS_FRAME;
  const body = capsuleZ(0.21, 0.7);
  body.translate(0, 0.5, 0);
  const neck = new THREE.CapsuleGeometry(0.1, 0.26, 2, 6);
  neck.rotateX(-0.6);
  neck.translate(0, 0.66, 0.26);
  const head = capsuleZ(0.085, 0.18, 6);
  head.translate(0, 0.85, 0.42);
  const parts = [
    part(body, COAT.chamois),
    part(neck, COAT.chamois),
    part(head, COAT.chamois),
    ...legs(frame, COAT.chamois),
  ];
  // Short, near-vertical, hooked hard at the tip - the way to tell a chamois
  // from an ibex at any distance where the horns are visible at all.
  const horn = [
    { len: 0.15, angle: 8, r0: 0.022, r1: 0.018 },
    { len: 0.09, angle: 80, r0: 0.018, r1: 0.009 },
  ];
  parts.push(...chain(0.045, 0.92, 0.38, horn, COAT.horn));
  parts.push(...chain(-0.045, 0.92, 0.38, horn, COAT.horn));
  return parts;
}

function buildMarmot() {
  const frame = MARMOT_FRAME;
  const body = capsuleZ(0.13, 0.24, 6);
  body.translate(0, 0.2, 0);
  const head = capsuleZ(0.09, 0.08, 6);
  head.translate(0, 0.26, 0.22);
  return [
    part(body, COAT.marmot),
    part(head, COAT.marmot),
    ...legs(frame, COAT.marmot),
    // Short furry tail, drooping back and down.
    ...chain(0, 0.21, -0.19, [{ len: 0.2, angle: 115, r0: 0.045, r1: 0.03 }], COAT.marmot),
  ];
}

function buildFox() {
  // Long and low, unlike the three ungulates: 70 cm of body at 40 cm of shoulder,
  // and a tail nearly as long as the body. Legs and ear tips are the dark
  // "stockings" a red fox actually has, which is most of what makes the silhouette
  // read as a fox rather than a small dog.
  const frame = FOX_FRAME;
  const body = capsuleZ(0.14, 0.42);
  body.translate(0, 0.38, 0);
  const neck = new THREE.CapsuleGeometry(0.1, 0.14, 2, 6);
  neck.rotateX(-1.05); // low and forward - a fox carries its head level, not up
  neck.translate(0, 0.4, 0.24);
  const head = capsuleZ(0.075, 0.08, 6);
  head.translate(0, 0.44, 0.34);
  const muzzle = new THREE.CylinderGeometry(0.018, 0.055, 0.12, 5, 1);
  muzzle.rotateX(Math.PI / 2);
  muzzle.translate(0, 0.42, 0.45);
  const bib = capsuleZ(0.06, 0.1, 6);
  bib.translate(0, 0.34, 0.26);
  const parts = [
    part(body, COAT.fox),
    part(neck, COAT.fox),
    part(head, COAT.fox),
    part(muzzle, COAT.fox),
    part(bib, COAT.bib),
    ...legs(frame, COAT.stocking),
  ];
  for (const side of [0.055, -0.055]) {
    const ear = new THREE.ConeGeometry(0.035, 0.09, 4, 1);
    ear.translate(side, 0.51, 0.32);
    parts.push(part(ear, COAT.stocking));
  }
  // Held out behind and slightly down, with the white tag on the tip.
  parts.push(...chain(0, 0.36, -0.22, [
    { len: 0.22, angle: 95, r0: 0.075, r1: 0.07 },
    { len: 0.18, angle: 110, r0: 0.07, r1: 0.05 },
  ], COAT.fox));
  parts.push(...chain(0, 0.28, -0.6, [{ len: 0.08, angle: 110, r0: 0.05, r1: 0.03 }], COAT.bib));
  return parts;
}

function buildSquirrel() {
  // 25 cm of animal, and the tail is the whole silhouette: it arcs up behind the
  // back rather than trailing, which is what tells a squirrel apart from anything
  // else at this size.
  const frame = SQUIRREL_FRAME;
  const body = capsuleZ(0.055, 0.11, 6);
  body.translate(0, 0.1, 0);
  const head = capsuleZ(0.045, 0.03, 6);
  head.translate(0, 0.145, 0.09);
  const parts = [
    part(body, COAT.squirrel),
    part(head, COAT.squirrel),
    ...legs(frame, COAT.squirrel),
  ];
  for (const side of [0.025, -0.025]) {
    // The ear tufts - a red squirrel's, not a grey's.
    const ear = new THREE.ConeGeometry(0.012, 0.045, 4, 1);
    ear.translate(side, 0.185, 0.075);
    parts.push(part(ear, COAT.squirrel));
  }
  parts.push(...chain(0, 0.11, -0.07, [
    { len: 0.08, angle: 100, r0: 0.03, r1: 0.035 },
    { len: 0.08, angle: 55, r0: 0.035, r1: 0.035 },
    { len: 0.07, angle: 12, r0: 0.035, r1: 0.022 },
  ], COAT.squirrel));
  return parts;
}

const BUILDERS = {
  ibex: buildIbex,
  chamois: buildChamois,
  marmot: buildMarmot,
  fox: buildFox,
  squirrel: buildSquirrel,
};

// ---------------------------------------------------------------------------
// The HIGH-DETAIL models (accepted by the user 2026-08-17, after seeing them on
// tools/dev/model-preview.html). An OPTION to turn up, never a new default -
// their framing from 2026-08-13: "modelli ad alta risoluzione come opzione da
// alzare, non come nuovo default".
//
// The axis they chose is ANATOMY, not roundness. That matters and it was not
// obvious: these are flat-shaded merged primitives, so smooth normals on a
// higher-segment capsule read as an inflated loaf rather than as a finer animal,
// and the candidate that did that came back visibly worse than what ships. So
// every part below is a shape the model did not have - and the single most
// effective one costs no triangles at all: scaling the body on X, because a
// capsule's cross-section is a circle and a real ungulate is deep through the
// chest and narrow across it.
//
// How much each species got was decided by measurement, not evenly. `alertM` looks
// like a floor on how close you get and is not one - the player walks at 4 m/s
// (controls.js) and every one of these flees slower - so at 4 m they stand 269,
// 209, 104, 62 and 38 px tall in the app's own camera. Chamois and fox therefore
// got the full pass and marmot and squirrel only what survives 38-62 px.

// A thigh: the shipped legs are one tapered cylinder each from hip to ground, so a
// limb leaves the body as a stick pushed into it. Wide at the hip, tapering to the
// knee - the reverse reads as a flap splayed under the belly.
//
// It carries its leg's OWN aLeg pair. Not a detail: aLeg.x is the swing sign and
// aLeg.y the pivot height, so a thigh given the wrong pair stays put while the leg
// under it rotates away.
function thighs(frame, color) {
  const { legR, legLen, spreadX, spreadZ, hipY } = frame;
  return LEG_LAYOUT(spreadX, spreadZ).map(([x, z, sign]) => {
    const g = new THREE.CylinderGeometry(legR * 2.1, legR * 1.15, legLen * 0.46, 6, 1);
    g.scale(0.85, 1, 1); // a haunch is flatter across than along
    g.translate(x, hipY - legLen * 0.2, z);
    return part(g, color, { swing: sign, pivotY: hipY });
  });
}

// A hoof or paw at the foot of each leg, on the same swing as the leg.
function hooves(frame, color) {
  const { legR, legLen, spreadX, spreadZ, hipY } = frame;
  return LEG_LAYOUT(spreadX, spreadZ).map(([x, z, sign]) => {
    const g = new THREE.CylinderGeometry(legR * 0.62, legR * 0.78, 0.07, 6, 1);
    g.translate(x, hipY - legLen - 0.02, z);
    return part(g, color, { swing: sign, pivotY: hipY });
  });
}

// A flattened cone for an ear: a leaf, not a spike.
function ear(side, y, z, len, color, { tilt = 0.5, sweep = 0.7 } = {}) {
  const g = new THREE.ConeGeometry(len * 0.42, len, 5, 1);
  g.scale(1, 1, 0.45);
  g.rotateX(sweep);
  g.rotateZ(side > 0 ? -tilt : tilt);
  g.translate(side, y, z);
  return part(g, color);
}

// A horn with transverse KNOBS, which is the point of an ibex: an adult male
// carries 20-30 of them up the front face and they are what the eye reads as ibex
// rather than goat. One torus each, placed on the same walked curve chain() uses,
// so they follow the sweep for free.
function ribbedHorn(x, y0, z0, segments, color, knobsPerSegment) {
  const parts = chain(x, y0, z0, segments, color);
  let y = y0;
  let z = z0;
  segments.forEach((s, si) => {
    const a = (-s.angle * Math.PI) / 180;
    const dy = Math.cos(a);
    const dz = Math.sin(a);
    const n = knobsPerSegment[si] ?? 0;
    for (let k = 0; k < n; k++) {
      const t = (k + 0.6) / (n + 0.2); // skip the very base, so knobs miss the joint
      const r = s.r0 + (s.r1 - s.r0) * t;
      const knob = new THREE.TorusGeometry(r * 0.94, r * 0.3, 4, 8);
      knob.rotateX(Math.PI / 2 + a); // across the shaft, following its lean
      knob.translate(x, y + dy * s.len * t, z + dz * s.len * t);
      parts.push(part(knob, color));
    }
    y += dy * s.len;
    z += dz * s.len;
  });
  return parts;
}

const IBEX_HORN = [
  { len: 0.2, angle: 25, r0: 0.042, r1: 0.036 },
  { len: 0.2, angle: 60, r0: 0.036, r1: 0.028 },
  { len: 0.18, angle: 100, r0: 0.028, r1: 0.015 },
];

function buildIbexHi() {
  const frame = IBEX_FRAME;
  const body = capsuleZ(0.27, 0.9);
  body.scale(0.76, 1, 1); // the free fix, and the biggest one
  body.translate(0, 0.62, 0);
  const brisket = capsuleZ(0.15, 0.34, 7);
  brisket.scale(0.8, 1, 1);
  brisket.translate(0, 0.5, 0.3);
  const neck = new THREE.CapsuleGeometry(0.13, 0.3, 2, 6);
  neck.rotateX(-0.8);
  neck.translate(0, 0.82, 0.34);
  const head = capsuleZ(0.1, 0.2, 6);
  head.translate(0, 1.02, 0.55);
  const muzzle = new THREE.CylinderGeometry(0.055, 0.082, 0.12, 6, 1);
  muzzle.rotateX(Math.PI / 2);
  muzzle.translate(0, 1.0, 0.68);
  const parts = [
    part(body, COAT.ibex),
    part(brisket, COAT.ibex),
    part(neck, COAT.ibex),
    part(head, COAT.ibex),
    part(muzzle, COAT.ibex),
    ...legs(frame, COAT.ibex),
    ...thighs(frame, COAT.ibex),
    ...hooves(frame, COAT.horn),
    ear(0.075, 1.06, 0.44, 0.13, COAT.ibex),
    ear(-0.075, 1.06, 0.44, 0.13, COAT.ibex),
  ];
  // The beard an adult male carries, which hangs and so reads in silhouette.
  parts.push(...chain(0, 0.96, 0.6, [{ len: 0.13, angle: 172, r0: 0.035, r1: 0.02 }], COAT.horn));
  parts.push(...chain(0, 0.66, -0.44, [
    { len: 0.1, angle: 120, r0: 0.035, r1: 0.028 },
    { len: 0.07, angle: 165, r0: 0.028, r1: 0.015 },
  ], COAT.horn));
  const knobs = [4, 4, 3];
  parts.push(...ribbedHorn(0.06, 1.12, 0.48, IBEX_HORN, COAT.horn, knobs));
  parts.push(...ribbedHorn(-0.06, 1.12, 0.48, IBEX_HORN, COAT.horn, knobs));
  return parts;
}

function buildChamoisHi() {
  const frame = CHAMOIS_FRAME;
  const body = capsuleZ(0.21, 0.7);
  body.scale(0.78, 1, 1);
  body.translate(0, 0.5, 0);
  const brisket = capsuleZ(0.12, 0.26, 7);
  brisket.scale(0.82, 1, 1);
  brisket.translate(0, 0.4, 0.24);
  const neck = new THREE.CapsuleGeometry(0.1, 0.26, 2, 6);
  neck.rotateX(-0.6);
  neck.translate(0, 0.66, 0.26);
  const head = capsuleZ(0.085, 0.18, 6);
  head.translate(0, 0.85, 0.42);
  const muzzle = new THREE.CylinderGeometry(0.042, 0.062, 0.1, 6, 1);
  muzzle.rotateX(Math.PI / 2);
  muzzle.translate(0, 0.83, 0.54);
  const parts = [
    part(body, COAT.chamois),
    part(brisket, COAT.chamois),
    part(neck, COAT.chamois),
    part(head, COAT.chamois),
    part(muzzle, COAT.chamois),
    ...legs(frame, COAT.chamois),
    ...thighs(frame, COAT.chamois),
    ...hooves(frame, COAT.horn),
    // Long and pointed, unlike an ibex's.
    ear(0.062, 0.89, 0.34, 0.15, COAT.chamois, { sweep: 0.45 }),
    ear(-0.062, 0.89, 0.34, 0.15, COAT.chamois, { sweep: 0.45 }),
  ];
  // THE FACE MASK, and the reason a chamois earns its own pass: a dark band from
  // the eye to the muzzle across a pale face names the species more reliably than
  // its horns do, because they are short - at 200 px the mask is the bolder mark.
  for (const side of [0.055, -0.055]) {
    const mask = new THREE.BoxGeometry(0.022, 0.075, 0.16);
    mask.translate(side, 0.865, 0.47);
    parts.push(part(mask, COAT.stocking));
  }
  parts.push(...chain(0, 0.56, -0.34, [{ len: 0.09, angle: 140, r0: 0.03, r1: 0.018 }], COAT.stocking));
  // Rings at the BASE, not along the length - the opposite distribution to an
  // ibex's knobs, and itself part of telling the two apart.
  const horn = [
    { len: 0.15, angle: 8, r0: 0.022, r1: 0.018 },
    { len: 0.09, angle: 80, r0: 0.018, r1: 0.009 },
  ];
  parts.push(...ribbedHorn(0.045, 0.92, 0.38, horn, COAT.horn, [3, 0]));
  parts.push(...ribbedHorn(-0.045, 0.92, 0.38, horn, COAT.horn, [3, 0]));
  return parts;
}

function buildFoxHi() {
  const frame = FOX_FRAME;
  const body = capsuleZ(0.14, 0.42);
  body.scale(0.86, 1, 1);
  body.translate(0, 0.38, 0);
  const neck = new THREE.CapsuleGeometry(0.1, 0.14, 2, 6);
  neck.rotateX(-1.05);
  neck.translate(0, 0.4, 0.24);
  const head = capsuleZ(0.075, 0.08, 6);
  head.translate(0, 0.44, 0.34);
  const muzzle = new THREE.CylinderGeometry(0.018, 0.055, 0.12, 5, 1);
  muzzle.rotateX(Math.PI / 2);
  muzzle.translate(0, 0.42, 0.45);
  const bib = capsuleZ(0.06, 0.1, 6);
  bib.translate(0, 0.34, 0.26);
  // The cheek ruff: a fox's head is wider at the jaw than at the skull, and that
  // is why the face reads as a wedge rather than as a cone.
  const ruff = capsuleZ(0.085, 0.05, 7);
  ruff.scale(1.15, 0.9, 1);
  ruff.translate(0, 0.43, 0.3);
  const parts = [
    part(body, COAT.fox),
    part(neck, COAT.fox),
    part(ruff, COAT.fox),
    part(head, COAT.fox),
    part(muzzle, COAT.fox),
    part(bib, COAT.bib),
    ...legs(frame, COAT.stocking),
    ...thighs(frame, COAT.fox), // russet above, black below: the stocking starts at the knee
    ...hooves(frame, COAT.stocking),
  ];
  // Large ears with black backs - one of a red fox's two field marks.
  for (const side of [0.052, -0.052]) {
    const e = new THREE.ConeGeometry(0.042, 0.105, 5, 1);
    e.scale(1, 1, 0.5);
    e.rotateX(0.22);
    e.rotateZ(side > 0 ? -0.3 : 0.3);
    e.translate(side, 0.52, 0.31);
    parts.push(part(e, COAT.fox));
    const tip = new THREE.ConeGeometry(0.022, 0.04, 5, 1);
    tip.scale(1, 1, 0.5);
    tip.rotateX(0.22);
    tip.rotateZ(side > 0 ? -0.3 : 0.3);
    tip.translate(side, 0.575, 0.315);
    parts.push(part(tip, COAT.stocking));
  }
  // The brush, the other field mark. Held OUT behind and barely dropping: angles
  // are degrees from vertical, and a first pass at 95/108/122 curled it into the
  // ground, where a fox's tail never is.
  parts.push(...chain(0, 0.37, -0.22, [
    { len: 0.18, angle: 92, r0: 0.078, r1: 0.078 },
    { len: 0.15, angle: 99, r0: 0.078, r1: 0.062 },
    { len: 0.12, angle: 106, r0: 0.062, r1: 0.044 },
  ], COAT.fox));
  parts.push(...chain(0, 0.3, -0.66, [{ len: 0.08, angle: 108, r0: 0.044, r1: 0.024 }], COAT.bib));
  return parts;
}

// Marmot and squirrel: the LIGHT pass. 62 px and 38 px at 4 m, so only what
// changes an outline at that size, and nothing that does not.
function buildMarmotHi() {
  const frame = MARMOT_FRAME;
  const body = capsuleZ(0.13, 0.24, 6);
  body.translate(0, 0.2, 0);
  const head = capsuleZ(0.09, 0.08, 6);
  head.translate(0, 0.26, 0.22);
  // Set INSIDE the head's own front cap (head at z 0.22, radius 0.09, so the cap
  // reaches about 0.31). Further out it reads as a shelf bolted past the face.
  const muzzle = new THREE.CylinderGeometry(0.042, 0.07, 0.06, 6, 1);
  muzzle.rotateX(Math.PI / 2);
  muzzle.translate(0, 0.242, 0.265);
  const parts = [
    part(body, COAT.marmot),
    part(head, COAT.marmot),
    part(muzzle, COAT.marmot),
    ...legs(frame, COAT.marmot),
    ...thighs(frame, COAT.marmot),
    // Small and round, set low and wide - not a squirrel's upright tufts.
    ear(0.07, 0.31, 0.19, 0.055, COAT.marmot, { tilt: 0.9, sweep: 0.2 }),
    ear(-0.07, 0.31, 0.19, 0.055, COAT.marmot, { tilt: 0.9, sweep: 0.2 }),
  ];
  // The shipped tail leaves the rump at 115 degrees from vertical, which draws it
  // as a horizontal rod - the most visible thing wrong with the marmot at this
  // range, and it is one number. Short, low, and bent rather than pointing.
  parts.push(...chain(0, 0.21, -0.19, [
    { len: 0.12, angle: 128, r0: 0.045, r1: 0.036 },
    { len: 0.09, angle: 152, r0: 0.036, r1: 0.022 },
  ], COAT.marmot));
  return parts;
}

function buildSquirrelHi() {
  const frame = SQUIRREL_FRAME;
  const body = capsuleZ(0.055, 0.11, 6);
  body.translate(0, 0.1, 0);
  const head = capsuleZ(0.045, 0.03, 6);
  head.translate(0, 0.145, 0.09);
  const muzzle = new THREE.CylinderGeometry(0.022, 0.036, 0.035, 5, 1);
  muzzle.rotateX(Math.PI / 2);
  muzzle.translate(0, 0.138, 0.125);
  const parts = [
    part(body, COAT.squirrel),
    part(head, COAT.squirrel),
    part(muzzle, COAT.squirrel),
    ...legs(frame, COAT.squirrel),
  ];
  for (const side of [0.025, -0.025]) {
    const e = new THREE.ConeGeometry(0.012, 0.05, 4, 1);
    e.translate(side, 0.187, 0.075);
    parts.push(part(e, COAT.squirrel));
  }
  // The tail IS the squirrel at 38 px, so it is the only place the light pass
  // spends anything: four segments and thicker through the middle, so it arcs over
  // the back as a plume rather than as a bent rod.
  parts.push(...chain(0, 0.11, -0.07, [
    { len: 0.07, angle: 100, r0: 0.032, r1: 0.042 },
    { len: 0.07, angle: 62, r0: 0.042, r1: 0.046 },
    { len: 0.06, angle: 28, r0: 0.046, r1: 0.04 },
    { len: 0.05, angle: 5, r0: 0.04, r1: 0.022 },
  ], COAT.squirrel));
  return parts;
}

const HI_BUILDERS = {
  ibex: buildIbexHi,
  chamois: buildChamoisHi,
  marmot: buildMarmotHi,
  fox: buildFoxHi,
  squirrel: buildSquirrelHi,
};

// Exported for tools/dev/model-preview.html, the bench the user judges shapes on.
// It compares against THESE builders rather than re-declaring its own copy of the
// current animals, which is the same trap the shared treeLattice() avoids.
export { BUILDERS as MODEL_BUILDERS, HI_BUILDERS, part, capsuleZ, legs, chain, COAT, SPECIES as MODEL_SPECIES };

// When the high model stops being worth drawing, expressed in PIXELS of on-screen
// height rather than in metres of distance. Metres would be the wrong unit: the
// same 20 m makes an ibex 24 px tall and a squirrel 3, so one distance threshold
// would either waste the detail on animals too small to show it or drop it off an
// ibex still filling a fifth of the screen.
//
// 48 px is chosen as the point below which the added parts stop existing: an ear,
// a hoof or a horn knob is a few pixels of a model that tall. Everything past it
// draws the standard model, which is what shipped before this option and is
// correct at that size.
const HI_MIN_PX = 48;

function speciesMesh(spec, { hi = false } = {}) {
  const merged = BufferGeometryUtils.mergeGeometries((hi ? HI_BUILDERS : BUILDERS)[spec.name]());
  // Per instance, not per vertex: the current leg swing, computed on the CPU
  // where the walking state already lives. One float beats a time uniform plus
  // a phase attribute, and keeps every decision about gait in one place.
  merged.setAttribute('aSwing', new THREE.InstancedBufferAttribute(new Float32Array(spec.capacity), 1));

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true, // coat and horn in one draw call
    roughness: 0.92,
    metalness: 0,
    // Same reason as the trees: the shader swings legs about their hip, and flat
    // shading takes its normals from screen-space derivatives, so they stay
    // correct through that with no inverse-transpose work per instance.
    flatShading: true,
  });

  material.onBeforeCompile = (shader) => {
    let vs = shader.vertexShader;
    vs = patch(vs, '#include <common>', '#include <common>\n  attribute vec2 aLeg;\n  attribute float aSwing;');
    // Rotate leg vertices about their hip in the YZ plane. Body vertices carry
    // aLeg.x = 0, so the angle is zero and this reduces to the stock line
    // without needing a branch. The pivot offset is taken from aLeg.y rather
    // than assumed, so the same code serves a 0.6 m ibex hip and a 0.18 m
    // marmot one.
    vs = patch(vs, '#include <begin_vertex>', /* glsl */ `
      float legAngle = aLeg.x * aSwing * ${glsl(SWING_RAD)};
      float legDy = position.y - aLeg.y;
      vec3 transformed = vec3(
        position.x,
        aLeg.y + legDy * cos( legAngle ),
        position.z + legDy * sin( legAngle )
      );
    `);
    shader.vertexShader = vs;
  };
  attachAtmo(material); // the phase-4 aerial perspective, same as everything else

  const mesh = new THREE.InstancedMesh(merged, material, spec.capacity);
  mesh.name = `wildlife-${spec.name}`;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.count = 0;
  // The geometry's bounds describe one animal at the origin, so three's culling
  // would test the wrong volume entirely. At this instance count there is
  // nothing to win by fixing it up per frame - same call as vegetation.js.
  mesh.frustumCulled = false;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

// onAlarm is optional: src/audio.js turns a flee reaction into an actual alarm
// whistle. It is reported here rather than played here because only this module
// knows the moment an animal takes fright, and only audio.js knows which species
// has a call and whether it is within earshot.
export function createWildlife({ sampleGroundHeight, canopyAt, onAlarm = null }) {
  const group = new THREE.Group();
  group.name = 'wildlife';

  const state = SPECIES.map((spec) => {
    const mesh = speciesMesh(spec);
    const meshHi = speciesMesh(spec, { hi: true });
    // The model's own height, MEASURED off the geometry rather than listed, so the
    // pixel threshold below cannot drift from the shape it is thresholding.
    meshHi.geometry.computeBoundingBox();
    const bb = meshHi.geometry.boundingBox;
    return {
      spec,
      mesh,
      meshHi,
      heightM: bb.max.y - bb.min.y,
      herds: new Map(), // "ix:iz" -> herd, or null for "tested, nothing lives here"
    };
  });
  // Both meshes carry the SAME name. Deliberate: they are two levels of detail of
  // one animal, not two animals, and everything that walks this group - the
  // wildlife test included - reads the species off mesh.name and counts instances
  // across every child. Naming the fine one "wildlife-ibex-hi" would have made it
  // a sixth species to every such reader.
  for (const s of state) {
    group.add(s.mesh);
    group.add(s.meshHi);
  }

  const matrix = new THREE.Matrix4();
  const basis = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scaleVec = new THREE.Vector3();
  const up = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();

  // Rise over run across 2x SLOPE_PROBE_M, in degrees. Sampled from the drawn
  // surface, so it is the slope the user can see rather than the true one.
  const SLOPE_PROBE_M = 12;
  function slopeDegrees(x, z) {
    const hx = sampleGroundHeight(x + SLOPE_PROBE_M, z) - sampleGroundHeight(x - SLOPE_PROBE_M, z);
    const hz = sampleGroundHeight(x, z + SLOPE_PROBE_M) - sampleGroundHeight(x, z - SLOPE_PROBE_M);
    const grade = Math.hypot(hx, hz) / (2 * SLOPE_PROBE_M);
    return (Math.atan(grade) * 180) / Math.PI;
  }

  function suitable(spec, x, z) {
    const h = spec.habitat;
    const elev = sampleGroundHeight(x, z);
    if (!Number.isFinite(elev) || elev < h.elevMin || elev > h.elevMax) return false;
    const canopy = canopyAt(x, z);
    // Both bounds optional: a squirrel has only a floor (it needs a tree), most of
    // the others only a ceiling.
    if (h.canopyMax != null && canopy > h.canopyMax) return false;
    if (h.canopyMin != null && canopy < h.canopyMin) return false;
    const slope = slopeDegrees(x, z);
    return slope >= h.slopeMin && slope <= h.slopeMax;
  }

  function makeHerd(spec, ix, iz) {
    const rnd = cellRandom(ix, iz, spec.salt);
    if (rnd() > spec.presence) return null;
    const siteX = (ix + rnd()) * spec.cellM;
    const siteZ = (iz + rnd()) * spec.cellM;
    if (!suitable(spec, siteX, siteZ)) return null;

    const size = spec.herdMin + Math.floor(rnd() * (spec.herdMax - spec.herdMin + 1));
    const animals = [];
    for (let i = 0; i < size; i++) {
      // sqrt keeps them evenly spread over the disc instead of clumped at the
      // centre, which is what a uniform radius would do.
      const angle = rnd() * TAU;
      const radius = Math.sqrt(rnd()) * spec.spreadM;
      const x = siteX + Math.cos(angle) * radius;
      const z = siteZ + Math.sin(angle) * radius;
      animals.push({
        // Stable identity: a test that follows one individual through an
        // interaction is a much sharper instrument than one watching "the nearest".
        id: `${spec.name}:${ix}:${iz}:${i}`,
        x,
        z,
        homeX: x,
        homeZ: z,
        heading: rnd() * TAU,
        targetX: x,
        targetZ: z,
        walking: false,
        timer: rnd() * spec.grazeS, // so a herd doesn't move off in lockstep
        phase: rnd() * TAU,
        swing: 0,
        gradX: 0,
        gradZ: 0,
        oriented: false, // first frame takes the terrain normal as-is, then smooths
        // Only some foxes will come to you - "ogni tanto si avvicinano", as the
        // user put it. Drawn from the herd's own generator, so which fox is bold
        // is a property of that place and not of this session.
        bold: spec.boldChance != null && rnd() < spec.boldChance,
        watching: false,
        scale: spec.scaleMin + rnd() * (spec.scaleMax - spec.scaleMin),
      });
    }
    // The herd keeps its generator: wandering stays deterministic for a given
    // frame sequence, which is what lets a test assert on it.
    return { animals, rnd, siteX, siteZ };
  }

  // Shortest way round from a to b, capped at maxStep.
  function turnToward(from, to, maxStep) {
    let d = ((to - from + Math.PI) % TAU + TAU) % TAU - Math.PI;
    if (d > maxStep) d = maxStep;
    else if (d < -maxStep) d = -maxStep;
    return from + d;
  }

  // A trunk further from the camera than this one, for a squirrel giving up on its
  // cover. Tries a fan of directions away from the camera rather than one, because
  // a single ray can land on a trunk that is no better placed or outside the wood;
  // and it insists on real canopy at the destination, so a bolting squirrel retreats
  // deeper into the forest instead of out into the open.
  function furtherTree(from, camX, camZ, spec) {
    const awayAngle = Math.atan2(from.x - camX, from.z - camZ);
    const currentDist = Math.hypot(from.x - camX, from.z - camZ);
    let best = null;
    for (const spread of [0, 0.5, -0.5, 1.0, -1.0]) {
      const angle = awayAngle + spread;
      const probeX = from.x + Math.sin(angle) * spec.bailoutHopM;
      const probeZ = from.z + Math.cos(angle) * spec.bailoutHopM;
      if (canopyAt(probeX, probeZ) < spec.habitat.canopyMin) continue;
      const candidate = nearestTree(probeX, probeZ, camX, camZ);
      const gain = Math.hypot(candidate.x - camX, candidate.z - camZ) - currentDist;
      // Meaningfully further, or it is not worth breaking cover for.
      if (gain > spec.bailoutHopM * 0.4 && (!best || gain > best.gain)) {
        best = { ...candidate, gain };
      }
    }
    return best;
  }

  // Being approached overrides whatever the animal was doing, and what it does
  // instead is the species' whole character. Returns the speed multiplier, and
  // sets a.watching when the animal should hold still and face the camera.
  function react(spec, a, camX, camZ, camDist) {
    const fromCamX = a.x - camX;
    const fromCamZ = a.z - camZ;
    const unit = camDist > 1e-3 ? 1 / camDist : 0;
    a.watching = false;

    // Taking fright is an EVENT, not a state: an alarm call happens once, at the
    // moment the animal bolts, and re-arms only after it has been left alone.
    // Reported for every fleeing species; audio.js gives marmots and chamois a
    // whistle and lets the rest flee in silence.
    if (spec.reaction === 'flee') {
      if (!a.alarmed && camDist < spec.alertM) {
        a.alarmed = true;
        onAlarm?.({ species: spec.name, x: a.x, z: a.z, distanceM: camDist });
      } else if (a.alarmed && camDist > spec.alertM * 1.4) {
        a.alarmed = false;
      }
    }

    // Foxes: the bold ones close the distance instead of opening it - but they
    // MAINTAIN a distance rather than merely arriving at one. The user's verdict on
    // the first version (2026-08-04) was exact: "se mi avvicino fino a toccarla,
    // dovrebbe allontanarsi e non farsi toccare. curiosa.. ma non stupida." It
    // backed off at 1.87 m/s against a 4 m/s walk, so it simply lost the race.
    // Now the retreat has its own, much higher multiplier.
    if (spec.reaction === 'curious' && a.bold && camDist < spec.curiousM) {
      if (camDist < spec.standoffM * 0.85) {
        // Too close. Back off past the standoff, and fast enough to keep it.
        a.targetX = camX + fromCamX * unit * spec.standoffM * 1.3;
        a.targetZ = camZ + fromCamZ * unit * spec.standoffM * 1.3;
        a.walking = true;
        return spec.escapeMul;
      }
      if (camDist > spec.standoffM * 1.15) {
        a.targetX = camX + fromCamX * unit * spec.standoffM;
        a.targetZ = camZ + fromCamZ * unit * spec.standoffM;
        a.walking = true;
        return spec.approachMul;
      }
      // Inside the band it is happy: stop, and watch.
      a.walking = false;
      a.swing = 0;
      a.watching = true;
      return 1;
    }

    // Squirrels: put a trunk between us. The tree comes from vegetation.js's own
    // lattice, so this is the trunk that is actually drawn - and the animal keeps
    // shuffling round it as the camera moves, which is the whole charm.
    if (spec.reaction === 'hide' && camDist < spec.alertM) {
      let tree = nearestTree(a.homeX, a.homeZ, camX, camZ);
      // ...but a trunk is only cover until the camera reaches the trunk. The user
      // again: "lo scoiattolo è giusto che sparisca dietro un albero, poi però
      // dovrebbe continuare a scappare se mi avvicino a quell'albero." So once the
      // camera closes on the tree itself, it abandons it and dashes to a further
      // one, deeper into the wood.
      if (Math.hypot(tree.x - camX, tree.z - camZ) < spec.bailoutM) {
        const nextTree = furtherTree(tree, camX, camZ, spec);
        if (nextTree) {
          a.homeX = nextTree.x;
          a.homeZ = nextTree.z;
          tree = nextTree;
        }
      }
      const treeDist = Math.hypot(tree.x - camX, tree.z - camZ) || 1;
      a.targetX = tree.x + ((tree.x - camX) / treeDist) * spec.hideR;
      a.targetZ = tree.z + ((tree.z - camZ) / treeDist) * spec.hideR;
      a.walking = true;
      return spec.fleeMul;
    }

    if (camDist < spec.alertM) {
      a.targetX = camX + fromCamX * unit * (spec.alertM * 1.8);
      a.targetZ = camZ + fromCamZ * unit * (spec.alertM * 1.8);
      a.walking = true;
      return spec.fleeMul;
    }
    return 1;
  }

  function stepAnimal(spec, herd, a, dt, camX, camZ) {
    const camDist = Math.hypot(a.x - camX, a.z - camZ);
    const speedMul = react(spec, a, camX, camZ, camDist);

    if (!a.walking) {
      a.timer -= dt;
      a.swing = 0;
      // A watching fox turns to face you rather than standing side-on.
      if (a.watching) {
        a.heading = turnToward(a.heading, Math.atan2(camX - a.x, camZ - a.z), spec.turnRate * dt);
        return;
      }
      if (a.timer <= 0) {
        const angle = herd.rnd() * TAU;
        const radius = spec.wanderM * (0.3 + 0.7 * herd.rnd());
        a.targetX = a.homeX + Math.cos(angle) * radius;
        a.targetZ = a.homeZ + Math.sin(angle) * radius;
        a.walking = true;
      }
      return;
    }

    const dx = a.targetX - a.x;
    const dz = a.targetZ - a.z;
    const dist = Math.hypot(dx, dz);
    // A squirrel settling behind a trunk needs a finer arrival radius than a
    // 0.4 m one: the whole hiding spot is only 1.2 m from the trunk.
    if (dist < Math.min(0.4, spec.hideR ? spec.hideR * 0.25 : 0.4)) {
      a.walking = false;
      a.swing = 0;
      a.timer = spec.grazeS * (0.5 + herd.rnd());
      return;
    }
    const speed = spec.speedMps * speedMul;
    const travel = Math.min(dist, speed * dt);
    a.x += (dx / dist) * travel;
    a.z += (dz / dist) * travel;
    // Models face +Z, so atan2(x, z) is the yaw that aims one down a heading.
    a.heading = turnToward(a.heading, Math.atan2(dx, dz), spec.turnRate * dt);
    // Phase advances with DISTANCE, not time, so the legs cannot skate: a
    // fleeing animal takes faster strides, not longer ones.
    a.phase += (travel / spec.strideM) * TAU;
    a.swing = Math.sin(a.phase);
  }

  function rescan(camera) {
    for (const s of state) {
      const { spec, herds } = s;
      const reach = spec.visibleM + spec.cellM;
      const span = Math.ceil(reach / spec.cellM);
      const cx = Math.floor(camera.position.x / spec.cellM);
      const cz = Math.floor(camera.position.z / spec.cellM);
      const keep = new Set();
      for (let iz = cz - span; iz <= cz + span; iz++) {
        for (let ix = cx - span; ix <= cx + span; ix++) {
          // Cheap reject on the cell centre before any height sampling.
          const dx = (ix + 0.5) * spec.cellM - camera.position.x;
          const dz = (iz + 0.5) * spec.cellM - camera.position.z;
          if (Math.hypot(dx, dz) > reach) continue;
          const key = `${ix}:${iz}`;
          keep.add(key);
          // A null entry is a remembered miss - habitat cannot change, so it is
          // never worth testing the same empty cell twice.
          if (!herds.has(key)) herds.set(key, makeHerd(spec, ix, iz));
        }
      }
      for (const key of herds.keys()) if (!keep.has(key)) herds.delete(key);
    }
  }

  let sinceRescan = RESCAN_S;
  let lastScanX = Infinity;
  let lastScanZ = Infinity;
  // Where the camera was on the last update, so snapshot() can report distances
  // and the squirrels' hiding geometry without being handed the camera again.
  let lastCamX = 0;
  let lastCamZ = 0;

  function update(dt, camera) {
    const camX = camera.position.x;
    const camZ = camera.position.z;
    lastCamX = camX;
    lastCamZ = camZ;
    sinceRescan += dt;
    if (sinceRescan >= RESCAN_S || Math.hypot(camX - lastScanX, camZ - lastScanZ) > RESCAN_MOVE_M) {
      rescan(camera);
      sinceRescan = 0;
      lastScanX = camX;
      lastScanZ = camZ;
    }

    // How many pixels tall a 1 m object is at 1 m, in this frame's camera. The
    // high-detail switch is a pixel threshold (see HI_MIN_PX), so it needs the
    // camera's actual fov and the actual viewport - a fixed metre distance would
    // mean something different on every window and at every fov.
    const vpH = typeof window === 'undefined' ? 900 : window.innerHeight;
    const pxPerMAt1M = vpH / (2 * Math.tan((camera.fov * Math.PI) / 360));

    for (const { spec, mesh, meshHi, heightM, herds } of state) {
      const swings = mesh.geometry.getAttribute('aSwing');
      const swingsHi = meshHi.geometry.getAttribute('aSwing');
      // Beyond this the fine model is too small to show what it added. Zero when
      // the option is off, which routes every animal to the standard mesh and
      // leaves the fine one drawing nothing at all.
      const hiDistM = MODEL_DETAIL.value ? (heightM * pxPerMAt1M) / HI_MIN_PX : 0;
      let drawn = 0;
      let drawnHi = 0;
      for (const herd of herds.values()) {
        if (!herd) continue;
        for (const a of herd.animals) {
          stepAnimal(spec, herd, a, dt, camX, camZ);
          const dist = Math.hypot(a.x - camX, a.z - camZ);
          // Which of the two meshes this animal goes into, decided per animal and
          // per frame. Capacity is checked against the chosen one: a herd close
          // enough to fill the fine mesh must not silently stop being drawn.
          const useHi = dist <= hiDistM;
          if ((useHi ? drawnHi : drawn) >= spec.capacity) continue; // keep simulating, stop drawing
          const fade = 1 - smoothstep(spec.fadeStartM, spec.visibleM, dist);
          if (fade <= 0) continue;

          const ground = sampleGroundHeight(a.x, a.z);
          if (!Number.isFinite(ground)) continue;

          // Stand the animal ON the slope: orient it to the surface NORMAL, which
          // gives roll as well as pitch. The first version pitched along the
          // heading only, over a 1 m baseline, and the user reported exactly what
          // that produces (2026-08-04): "posizione/inclinazione non coerente con
          // il terreno" - across a side-slope the downhill legs float while the
          // uphill ones sink into the hill, because nothing was rolling the body.
          //
          // Central differences over the animal's own footprint. The drawn surface
          // is piecewise planar over 20.5 m cells at best, so any baseline of a
          // metre or two recovers the exact facet gradient - and a baseline as long
          // as the body is the right average for one straddling a cell edge.
          const base = spec.orientBaseM;
          const gradX = (sampleGroundHeight(a.x + base, a.z) - sampleGroundHeight(a.x - base, a.z)) / (2 * base);
          const gradZ = (sampleGroundHeight(a.x, a.z + base) - sampleGroundHeight(a.x, a.z - base)) / (2 * base);
          // Normal of the height field y = h(x, z).
          if (a.oriented) {
            // Smoothed in time, because the facet gradient steps as an animal
            // crosses a cell boundary and an instant change reads as a twitch.
            const k = 1 - Math.exp(-dt / ORIENT_SMOOTH_S);
            a.gradX += (gradX - a.gradX) * k;
            a.gradZ += (gradZ - a.gradZ) * k;
          } else {
            a.gradX = gradX;
            a.gradZ = gradZ;
            a.oriented = true;
          }

          up.set(-a.gradX, 1, -a.gradZ).normalize();
          forward.set(Math.sin(a.heading), 0, Math.cos(a.heading));
          // The heading is a compass bearing, so tilt it into the tangent plane
          // rather than using it raw - otherwise the body is not square to the
          // ground it is standing on.
          forward.addScaledVector(up, -forward.dot(up));
          if (forward.lengthSq() < 1e-8) forward.set(0, 0, 1); // degenerate only on a vertical face
          forward.normalize();
          right.crossVectors(up, forward);
          basis.makeBasis(right, up, forward);

          position.set(a.x, ground - FOOT_SINK_M, a.z);
          quaternion.setFromRotationMatrix(basis);
          scaleVec.setScalar(a.scale * fade);
          matrix.compose(position, quaternion, scaleVec);
          if (useHi) {
            meshHi.setMatrixAt(drawnHi, matrix);
            swingsHi.setX(drawnHi, a.swing);
            drawnHi++;
          } else {
            mesh.setMatrixAt(drawn, matrix);
            swings.setX(drawn, a.swing);
            drawn++;
          }
        }
      }
      mesh.count = drawn;
      mesh.instanceMatrix.needsUpdate = true;
      swings.needsUpdate = true;
      meshHi.count = drawnHi;
      meshHi.instanceMatrix.needsUpdate = true;
      swingsHi.needsUpdate = true;
    }
  }

  // What a test needs to assert on: not pixels, but whether each animal is
  // standing somewhere its species would actually be. Read via window.__pngp.
  function snapshot() {
    return state.flatMap(({ spec, mesh, meshHi, herds }) => {
      const out = [];
      for (const herd of herds.values()) {
        if (!herd) continue;
        for (const a of herd.animals) {
          const row = {
            id: a.id,
            species: spec.name,
            x: a.x,
            z: a.z,
            elevationM: sampleGroundHeight(a.x, a.z),
            slopeDeg: slopeDegrees(a.x, a.z),
            canopy: canopyAt(a.x, a.z),
            camDistM: Math.hypot(a.x - lastCamX, a.z - lastCamZ),
            walking: a.walking,
            swing: a.swing,
            bold: a.bold,
            watching: a.watching,
            alarmed: !!a.alarmed,
            // Across BOTH levels of detail, because an animal drawn by the fine
            // mesh is still drawn. Reporting only the standard mesh would make a
            // close herd look undrawn to every test that reads this.
            drawn: mesh.count + meshHi.count,
            drawnHi: meshHi.count,
          };
          if (spec.reaction === 'hide') {
            // Enough to check the hiding actually works: how far the animal is
            // from its trunk, and whether that trunk is between it and the camera
            // (a positive dot product of the two directions out of the tree means
            // the same side, so shielded is the negative case).
            const tree = nearestTree(a.homeX, a.homeZ, lastCamX, lastCamZ);
            const toAnimal = [a.x - tree.x, a.z - tree.z];
            const toCam = [lastCamX - tree.x, lastCamZ - tree.z];
            const lenA = Math.hypot(...toAnimal) || 1;
            const lenC = Math.hypot(...toCam) || 1;
            row.treeX = tree.x;
            row.treeZ = tree.z;
            row.treeDistM = lenA;
            row.treeSpacingM = TREE_SPACING_M;
            row.shielded = (toAnimal[0] * toCam[0] + toAnimal[1] * toCam[1]) / (lenA * lenC) < 0;
          }
          out.push(row);
        }
      }
      return out;
    });
  }

  // Dev aid: where is the nearest animal of a species? Herds only materialise
  // within draw distance, so without this, testing means hunting across 84 x 48 km
  // for something 25 cm tall - and a squirrel's habitat (solid canopy under
  // 2,200 m) can genuinely be kilometres from wherever the camera happens to be.
  //
  // Spirals outward over that species' own cell lattice and reuses makeHerd(), so
  // the answer respects presence, the hash and the habitat rules exactly as the
  // real thing does. Costs a few height samples per cell tested, and is called on
  // a keypress rather than per frame.
  function findNearest(name, fromX, fromZ, maxRings = 90) {
    const s = state.find((entry) => entry.spec.name === name);
    if (!s) return null;
    const { spec } = s;
    const cx = Math.floor(fromX / spec.cellM);
    const cz = Math.floor(fromZ / spec.cellM);
    for (let ring = 0; ring <= maxRings; ring++) {
      const found = [];
      for (let iz = cz - ring; iz <= cz + ring; iz++) {
        for (let ix = cx - ring; ix <= cx + ring; ix++) {
          // Only the new perimeter each ring, so a cell is never tested twice.
          if (ring > 0 && Math.abs(ix - cx) !== ring && Math.abs(iz - cz) !== ring) continue;
          const herd = makeHerd(spec, ix, iz);
          if (herd) found.push(herd);
        }
      }
      if (found.length) {
        // Nearest of the ring, so the result does not jump to a far corner of it.
        found.sort((p, q) => Math.hypot(p.siteX - fromX, p.siteZ - fromZ)
          - Math.hypot(q.siteX - fromX, q.siteZ - fromZ));
        const herd = found[0];
        const a = herd.animals[0];
        return { species: name, x: a.x, z: a.z, ring, distanceM: Math.hypot(a.x - fromX, a.z - fromZ) };
      }
    }
    return null;
  }

  return {
    object: group,
    update,
    snapshot,
    findNearest,
    species: SPECIES.map((s) => s.name),
    stats: {
      capacity: SPECIES.reduce((n, s) => n + s.capacity, 0),
      trianglesPerAnimal: Object.fromEntries(
        state.map(({ spec, mesh }) => [spec.name, mesh.geometry.index
          ? mesh.geometry.index.count / 3
          : mesh.geometry.attributes.position.count / 3]),
      ),
    },
  };
}

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
