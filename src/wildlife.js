import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { attachAtmo } from './atmosphere.js';
import { nearestTree, TREE_SPACING_M } from './vegetation.js';

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

const SPECIES = [
  {
    name: 'ibex',
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
    pushbackM: 3.5, // closer than this and even a bold one gives ground
    boldChance: 0.55, // the rest keep their distance like everything else
    approachMul: 1.7,
    fleeMul: 2.2, // used by the shy ones
    alertM: 40,
    // The least fussy animal in the park: valley floor to well above the
    // treeline, forest or open, as long as it is not a cliff.
    habitat: { elevMin: 700, elevMax: 2800, slopeMin: 0, slopeMax: 45, canopyMax: 0.9 },
  },
  {
    name: 'squirrel',
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
  // trap in this project (docs/PROGRESS.md 2026-08-03).
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

function legs({ legR, legLen, spreadX, spreadZ, hipY }, color) {
  const layout = [
    [+spreadX, +spreadZ, +1], // front left  \ diagonal pair, same phase
    [-spreadX, -spreadZ, +1], // rear right   /
    [-spreadX, +spreadZ, -1], // front right \ the other diagonal, antiphase
    [+spreadX, -spreadZ, -1], // rear left    /
  ];
  return layout.map(([x, z, sign]) => {
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
  const frame = { legR: 0.055, legLen: 0.55, spreadX: 0.17, spreadZ: 0.3, hipY: 0.6 };
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
  const frame = { legR: 0.045, legLen: 0.46, spreadX: 0.13, spreadZ: 0.24, hipY: 0.48 };
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
  const frame = { legR: 0.035, legLen: 0.16, spreadX: 0.1, spreadZ: 0.11, hipY: 0.18 };
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
  const frame = { legR: 0.035, legLen: 0.34, spreadX: 0.09, spreadZ: 0.16, hipY: 0.36 };
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
  const frame = { legR: 0.016, legLen: 0.07, spreadX: 0.04, spreadZ: 0.05, hipY: 0.09 };
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

function speciesMesh(spec) {
  const merged = BufferGeometryUtils.mergeGeometries(BUILDERS[spec.name]());
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

export function createWildlife({ sampleGroundHeight, canopyAt }) {
  const group = new THREE.Group();
  group.name = 'wildlife';

  const state = SPECIES.map((spec) => ({
    spec,
    mesh: speciesMesh(spec),
    herds: new Map(), // "ix:iz" -> herd, or null for "tested, nothing lives here"
  }));
  for (const s of state) group.add(s.mesh);

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scaleVec = new THREE.Vector3();
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');

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

  // Being approached overrides whatever the animal was doing, and what it does
  // instead is the species' whole character. Returns the speed multiplier, and
  // sets a.watching when the animal should hold still and face the camera.
  function react(spec, a, camX, camZ, camDist) {
    const fromCamX = a.x - camX;
    const fromCamZ = a.z - camZ;
    const unit = camDist > 1e-3 ? 1 / camDist : 0;
    a.watching = false;

    // Foxes: the bold ones close the distance instead of opening it. This is the
    // behaviour the user asked for, and the shy ones fall through to 'flee'.
    if (spec.reaction === 'curious' && a.bold && camDist < spec.curiousM) {
      if (camDist < spec.pushbackM) {
        a.targetX = camX + fromCamX * unit * spec.standoffM;
        a.targetZ = camZ + fromCamZ * unit * spec.standoffM;
        a.walking = true;
        return spec.approachMul;
      }
      if (camDist > spec.standoffM * 1.15) {
        a.targetX = camX + fromCamX * unit * spec.standoffM;
        a.targetZ = camZ + fromCamZ * unit * spec.standoffM;
        a.walking = true;
        return spec.approachMul;
      }
      // Arrived at its standoff distance: stop, and watch.
      a.walking = false;
      a.swing = 0;
      a.watching = true;
      return 1;
    }

    // Squirrels: put a trunk between us. The tree comes from vegetation.js's own
    // lattice, so this is the trunk that is actually drawn - and the animal keeps
    // shuffling round it as the camera moves, which is the whole charm.
    if (spec.reaction === 'hide' && camDist < spec.alertM) {
      const tree = nearestTree(a.homeX, a.homeZ, camX, camZ);
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

    for (const { spec, mesh, herds } of state) {
      const swings = mesh.geometry.getAttribute('aSwing');
      let drawn = 0;
      for (const herd of herds.values()) {
        if (!herd) continue;
        for (const a of herd.animals) {
          stepAnimal(spec, herd, a, dt, camX, camZ);
          if (drawn >= spec.capacity) continue; // keep simulating, stop drawing
          const dist = Math.hypot(a.x - camX, a.z - camZ);
          const fade = 1 - smoothstep(spec.fadeStartM, spec.visibleM, dist);
          if (fade <= 0) continue;

          const ground = sampleGroundHeight(a.x, a.z);
          if (!Number.isFinite(ground)) continue;
          // Pitch along the heading, so an ibex on a 40 deg face stands on it
          // rather than through it. Two extra samples per drawn animal.
          const ahead = 0.5 * a.scale;
          const sinH = Math.sin(a.heading);
          const cosH = Math.cos(a.heading);
          const front = sampleGroundHeight(a.x + sinH * ahead, a.z + cosH * ahead);
          const back = sampleGroundHeight(a.x - sinH * ahead, a.z - cosH * ahead);
          euler.set(Math.atan2(front - back, 2 * ahead), a.heading, 0);

          position.set(a.x, ground, a.z);
          quaternion.setFromEuler(euler);
          scaleVec.setScalar(a.scale * fade);
          matrix.compose(position, quaternion, scaleVec);
          mesh.setMatrixAt(drawn, matrix);
          swings.setX(drawn, a.swing);
          drawn++;
        }
      }
      mesh.count = drawn;
      mesh.instanceMatrix.needsUpdate = true;
      swings.needsUpdate = true;
    }
  }

  // What a test needs to assert on: not pixels, but whether each animal is
  // standing somewhere its species would actually be. Read via window.__pngp.
  function snapshot() {
    return state.flatMap(({ spec, mesh, herds }) => {
      const out = [];
      for (const herd of herds.values()) {
        if (!herd) continue;
        for (const a of herd.animals) {
          const row = {
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
            drawn: mesh.count,
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
