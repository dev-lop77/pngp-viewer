// High-resolution flora and fauna models: the CANDIDATES, for the user to accept
// or reject before any of this goes near src/ (2026-08-17).
//
// The user's framing from 2026-08-13 stands: "modelli ad alta risoluzione come
// opzione da alzare, non come nuovo default". So everything here is a second,
// finer model of something that already exists - never a replacement for it.
//
// WHY THE CANDIDATES ARE SPLIT ALONG TWO AXES rather than offered as three
// progressively-bigger models. The current animals are merged primitives with
// `flatShading: true`, so they are faceted BY MATERIAL as much as by triangle
// count: doubling the segments of a flat-shaded capsule buys smaller facets, not
// a smooth one. That means "higher resolution" is two separate questions, and
// which one the user is actually reacting to is worth learning before spending
// triangles on the wrong one:
//
//   ANATOMY   - parts the model does not have at all: an ibex with no ears, no
//               beard, no tail, no hooves, and smooth horns where the real animal
//               has a row of big transverse knobs. Costs few triangles.
//   ROUNDNESS - segment counts up AND smooth normals, no new parts. Costs
//               triangles and one material flag.
//
// So: current, +anatomy, +roundness, both. If they pick "anatomy" the cheap fix
// is the whole job; if they pick "roundness" the fix is a material flag and a
// vertex-normal rotation in the leg shader, which is nearly free at 248 animals.
//
// THE TREE IS A DIFFERENT PROBLEM AND IS TREATED AS ONE. There are at most 248
// animals on screen and 27,700 tree slots, so the tree is the only one of the two
// where triangles are scarce. Its candidates are therefore about silhouette per
// triangle, and the near/far split matters more than the model does.
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { MODEL_BUILDERS, part, capsuleZ, legs, chain, COAT } from '../../src/wildlife.js';
import { CONE_SEGMENTS, CANOPY_COLOR, RADIUS_MIN, RADIUS_MAX } from '../../src/vegetation.js';

// A tree's radius is a FRACTION OF ITS HEIGHT, and the shipped shader applies the
// two separately: `position.x * treeR` against `position.y * treeH`, with treeR =
// treeH * this ratio. Every tree geometry here is therefore unit-height AND
// unit-radius, and the preview must scale it non-uniformly. Scaling it evenly (the
// first pass) drew 24 m-wide cones and compared four blobs filling the frame.
export const TREE_RADIUS_RATIO = (RADIUS_MIN + RADIUS_MAX) / 2;

// ---------------------------------------------------------------- fauna: ibex

// The ibex frame, copied from buildIbex so a candidate stands on the same legs at
// the same height. Not imported because it is a local inside that function; if a
// candidate is accepted this stops being a copy and becomes the shared one.
const IBEX_FRAME = { legR: 0.055, legLen: 0.55, spreadX: 0.17, spreadZ: 0.3, hipY: 0.6 };

// A thigh: a short, much thicker cylinder over the top of the shipped leg, so the
// limb leaves the body as a haunch instead of as a stick pushed into it. The
// shipped legs are one tapered cylinder each from hip to ground, which is the
// thing that reads worst at close range once the horns are fixed.
//
// It carries the SAME aLeg swing as its leg. That is not a detail: aLeg.x is the
// swing sign and aLeg.y the pivot height, so a thigh given the wrong pair would
// stay put while the leg under it rotated away.
function thighs(frame, color) {
  const { legR, legLen, spreadX, spreadZ, hipY } = frame;
  const layout = [
    [+spreadX, +spreadZ, +1],
    [-spreadX, -spreadZ, +1],
    [-spreadX, +spreadZ, -1],
    [+spreadX, -spreadZ, -1],
  ];
  return layout.map(([x, z, sign]) => {
    // Wide at the hip, tapering to the knee. The first pass had these two
    // radii the other way round and the "thighs" came out as flaps splayed
    // below the belly - an upside-down haunch, which the render named at once.
    const g = new THREE.CylinderGeometry(legR * 2.1, legR * 1.15, legLen * 0.46, 6, 1);
    g.scale(0.85, 1, 1); // a haunch is flatter across than along
    g.translate(x, hipY - legLen * 0.2, z);
    return part(g, color, { swing: sign, pivotY: hipY });
  });
}

// A hoof: a stubby dark cylinder at the bottom of a leg, carrying the same
// aLeg swing as the leg it belongs to so it moves with it instead of hovering.
function hooves(frame, color) {
  const { legR, legLen, spreadX, spreadZ, hipY } = frame;
  const layout = [
    [+spreadX, +spreadZ, +1],
    [-spreadX, -spreadZ, +1],
    [-spreadX, +spreadZ, -1],
    [+spreadX, -spreadZ, -1],
  ];
  return layout.map(([x, z, sign]) => {
    const g = new THREE.CylinderGeometry(legR * 0.62, legR * 0.78, 0.07, 6, 1);
    g.translate(x, hipY - legLen - 0.02, z);
    return part(g, color, { swing: sign, pivotY: hipY });
  });
}

// An ear: a flattened cone angled out and back. Scaled on X rather than built
// from an ellipse because a cone is one primitive and the flattening is free.
function ear(side, y, z, len, color, { tilt = 0.5, sweep = 0.7 } = {}) {
  const g = new THREE.ConeGeometry(len * 0.42, len, 5, 1);
  g.scale(1, 1, 0.45); // a leaf, not a spike
  g.rotateX(sweep);
  g.rotateZ(side > 0 ? -tilt : tilt);
  g.translate(side, y, z);
  return part(g, color);
}

// The horns are the point of an ibex, and the ribs are the point of the horns:
// an adult male carries 20-30 prominent transverse knobs up the front face, and
// they are what the eye reads as "ibex" rather than "goat" at any range where the
// horn is more than a silhouette. Modelled as a torus per knob, which is one
// primitive each and follows the sweep for free because each is placed on the
// same walked curve the horn segments use.
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
      // Along the segment, skipping the very base so knobs do not pile into the
      // joint with the previous one.
      const t = (k + 0.6) / (n + 0.2);
      const r = s.r0 + (s.r1 - s.r0) * t; // the shaft's own radius here
      const knob = new THREE.TorusGeometry(r * 0.94, r * 0.3, 4, 8);
      knob.rotateX(Math.PI / 2 + a); // lie across the shaft, following its lean
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

// Anatomy only: every part the current model lacks, at the current model's own
// segment counts. Deliberately NOT rounder - that is the other axis.
function ibexAnatomy({ radial = {} } = {}) {
  const rb = radial.body ?? 7;
  const rh = radial.head ?? 6;
  const body = capsuleZ(0.27, 0.9, rb);
  // PROPORTION, and it belongs on the anatomy axis because it costs no triangles
  // at all: the shipped body is a capsule, so its cross-section is a circle and
  // the animal reads as a barrel on sticks. A real ibex is deep through the chest
  // and narrow across it. One scale on X is the whole fix, and at this range it
  // changes the silhouette more than any of the added parts do.
  body.scale(0.76, 1, 1);
  body.translate(0, 0.62, 0);
  // A brisket: the chest carries low and forward between the front legs, which is
  // what stops a flattened body from reading as a plank.
  const brisket = capsuleZ(0.15, 0.34, rb);
  brisket.scale(0.8, 1, 1);
  brisket.translate(0, 0.5, 0.3);
  const neck = new THREE.CapsuleGeometry(0.13, 0.3, 2, rh);
  neck.rotateX(-0.8);
  neck.translate(0, 0.82, 0.34);
  const head = capsuleZ(0.1, 0.2, rh);
  head.translate(0, 1.02, 0.55);
  // A muzzle, so the head ends in a nose instead of a capsule cap.
  const muzzle = new THREE.CylinderGeometry(0.055, 0.082, 0.12, rh, 1);
  muzzle.rotateX(Math.PI / 2);
  muzzle.translate(0, 1.0, 0.68);

  const parts = [
    part(body, COAT.ibex),
    part(brisket, COAT.ibex),
    part(neck, COAT.ibex),
    part(head, COAT.ibex),
    part(muzzle, COAT.ibex),
    ...legs(IBEX_FRAME, COAT.ibex),
    ...thighs(IBEX_FRAME, COAT.ibex),
    ...hooves(IBEX_FRAME, COAT.horn),
    ear(0.075, 1.06, 0.44, 0.13, COAT.ibex),
    ear(-0.075, 1.06, 0.44, 0.13, COAT.ibex),
  ];
  // The beard: adult males carry a dark tuft under the chin, and it hangs, so it
  // reads even in silhouette.
  parts.push(...chain(0, 0.96, 0.6, [{ len: 0.13, angle: 172, r0: 0.035, r1: 0.02 }], COAT.horn));
  // The tail: short, dark, held down. Two segments so it bends rather than
  // sticking out straight.
  parts.push(...chain(0, 0.66, -0.44, [
    { len: 0.1, angle: 120, r0: 0.035, r1: 0.028 },
    { len: 0.07, angle: 165, r0: 0.028, r1: 0.015 },
  ], COAT.horn));
  // Ribbed horns instead of smooth ones.
  const knobs = [4, 4, 3];
  parts.push(...ribbedHorn(0.06, 1.12, 0.48, IBEX_HORN, COAT.horn, knobs));
  parts.push(...ribbedHorn(-0.06, 1.12, 0.48, IBEX_HORN, COAT.horn, knobs));
  return parts;
}

// Roundness only: the CURRENT parts, nothing added, at high segment counts. Read
// together with `smooth: true` on the preview material - flat shading would waste
// most of these triangles.
function ibexRound() {
  const body = capsuleZ(0.27, 0.9, 16);
  body.translate(0, 0.62, 0);
  const neck = new THREE.CapsuleGeometry(0.13, 0.3, 4, 12);
  neck.rotateX(-0.8);
  neck.translate(0, 0.82, 0.34);
  const head = capsuleZ(0.1, 0.2, 12);
  head.translate(0, 1.02, 0.55);
  const parts = [
    part(body, COAT.ibex),
    part(neck, COAT.ibex),
    part(head, COAT.ibex),
    ...legs(IBEX_FRAME, COAT.ibex),
  ];
  parts.push(...chain(0.06, 1.12, 0.48, IBEX_HORN, COAT.horn));
  parts.push(...chain(-0.06, 1.12, 0.48, IBEX_HORN, COAT.horn));
  return parts;
}

// Both axes.
function ibexFull() {
  return ibexAnatomy({ radial: { body: 16, head: 12 } });
}

// ------------------------------------------- fauna: the other four, 2026-08-17
//
// The user accepted the ibex `+ anatomy` axis, so these apply the same treatment.
// HOW MUCH of it each one gets was decided by measurement rather than evenly,
// because the animals are not seen at comparable sizes and `alertM` turned out not
// to be the floor it looks like: the player walks at 4 m/s (controls.js) and every
// one of these flees slower, so you can walk any of them down. At 4 m, in the app's
// own fov-60 camera on a 900 px viewport:
//
//   ibex     269 px      chamois  209 px      fox   104 px
//   marmot    62 px      squirrel  38 px
//
// So chamois and fox get the full pass, and marmot and squirrel get only the parts
// that survive 38-62 px - a muzzle and ears change a silhouette at that size; a
// ribbed horn or a hoof does not exist at it. Spending equally would have put most
// of the work where nobody can see it.

function chamoisAnatomy() {
  const frame = { legR: 0.045, legLen: 0.46, spreadX: 0.13, spreadZ: 0.24, hipY: 0.48 };
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
    // Long and pointed, unlike an ibex's - a chamois carries them almost as tall
    // as its horns are short.
    ear(0.062, 0.89, 0.34, 0.15, COAT.chamois, { sweep: 0.45 }),
    ear(-0.062, 0.89, 0.34, 0.15, COAT.chamois, { sweep: 0.45 }),
  ];
  // THE FACE MASK, and it is the reason a chamois is worth its own pass: a dark
  // band from the eye down to the muzzle across a pale face is what names the
  // species at any range where the head is more than a blob, far more reliably
  // than the horns are - they are short, and at 200 px the mask is a bolder mark
  // than they are.
  for (const side of [0.055, -0.055]) {
    const mask = new THREE.BoxGeometry(0.022, 0.075, 0.16);
    mask.translate(side, 0.865, 0.47);
    parts.push(part(mask, COAT.stocking));
  }
  // Short, dark, held down against the rump.
  parts.push(...chain(0, 0.56, -0.34, [{ len: 0.09, angle: 140, r0: 0.03, r1: 0.018 }], COAT.stocking));
  // The shipped hook, with the RINGS a chamois horn carries at its base and not
  // along its length - the opposite distribution to an ibex's, which is itself
  // part of telling the two apart.
  const horn = [
    { len: 0.15, angle: 8, r0: 0.022, r1: 0.018 },
    { len: 0.09, angle: 80, r0: 0.018, r1: 0.009 },
  ];
  parts.push(...ribbedHorn(0.045, 0.92, 0.38, horn, COAT.horn, [3, 0]));
  parts.push(...ribbedHorn(-0.045, 0.92, 0.38, horn, COAT.horn, [3, 0]));
  return parts;
}

function foxAnatomy() {
  const frame = { legR: 0.035, legLen: 0.34, spreadX: 0.09, spreadZ: 0.16, hipY: 0.36 };
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
  // The cheek ruff: a fox's head is wider at the jaw than at the skull, and the
  // ruff is most of why the face reads as a wedge rather than a cone.
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
    ...thighs(frame, COAT.fox), // russet above, black below - the stocking starts at the knee
    ...hooves(frame, COAT.stocking),
  ];
  // Bigger ears than the shipped 4-sided cones, with dark tips: a red fox's ears
  // are large, and their black backs are one of its two field marks.
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
  // The brush, in three segments instead of two so it curves rather than kinks.
  // Held OUT behind, barely dropping: the angles are degrees from vertical, and a
  // first pass at 95/108/122 curled it into the ground, where a fox's tail never
  // is - it is carried level or slightly down, and it is the other field mark.
  parts.push(...chain(0, 0.37, -0.22, [
    { len: 0.18, angle: 92, r0: 0.078, r1: 0.078 },
    { len: 0.15, angle: 99, r0: 0.078, r1: 0.062 },
    { len: 0.12, angle: 106, r0: 0.062, r1: 0.044 },
  ], COAT.fox));
  parts.push(...chain(0, 0.3, -0.66, [{ len: 0.08, angle: 108, r0: 0.044, r1: 0.024 }], COAT.bib));
  return parts;
}

// Marmot and squirrel: the LIGHT pass. 62 px and 38 px at 4 m, so only what
// changes an outline at that size - and nothing that does not.
function marmotAnatomy() {
  const frame = { legR: 0.035, legLen: 0.16, spreadX: 0.1, spreadZ: 0.11, hipY: 0.18 };
  const body = capsuleZ(0.13, 0.24, 6);
  body.translate(0, 0.2, 0);
  const head = capsuleZ(0.09, 0.08, 6);
  head.translate(0, 0.26, 0.22);
  // A blunt muzzle, because a marmot's head is not a capsule end - and at 62 px
  // the nose is the difference between an animal and a lozenge. Set INSIDE the
  // head's own front face (the head is at z 0.22 with radius 0.09, so its cap
  // reaches about 0.31): the first pass put it at 0.30 and it read as a shelf
  // bolted on past the face rather than as a snout growing out of it.
  const muzzle = new THREE.CylinderGeometry(0.042, 0.07, 0.06, 6, 1);
  muzzle.rotateX(Math.PI / 2);
  muzzle.translate(0, 0.242, 0.265);
  const parts = [
    part(body, COAT.marmot),
    part(head, COAT.marmot),
    part(muzzle, COAT.marmot),
    ...legs(frame, COAT.marmot),
    ...thighs(frame, COAT.marmot),
    // Small and round, set low and wide - not the upright tufts a squirrel has.
    ear(0.07, 0.31, 0.19, 0.055, COAT.marmot, { tilt: 0.9, sweep: 0.2 }),
    ear(-0.07, 0.31, 0.19, 0.055, COAT.marmot, { tilt: 0.9, sweep: 0.2 }),
  ];
  // The shipped tail leaves the rump at 115 degrees from vertical, which draws it
  // as a horizontal rod - the single most visible thing wrong with the marmot at
  // this range, and it is one number. A marmot's tail is short and carried low and
  // back, so it droops, and two segments let it bend instead of pointing.
  parts.push(...chain(0, 0.21, -0.19, [
    { len: 0.12, angle: 128, r0: 0.045, r1: 0.036 },
    { len: 0.09, angle: 152, r0: 0.036, r1: 0.022 },
  ], COAT.marmot));
  return parts;
}

function squirrelAnatomy() {
  const frame = { legR: 0.016, legLen: 0.07, spreadX: 0.04, spreadZ: 0.05, hipY: 0.09 };
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
  // spends anything: four segments instead of three and thicker through the
  // middle, so it arcs over the back as a plume rather than as a bent rod.
  parts.push(...chain(0, 0.11, -0.07, [
    { len: 0.07, angle: 100, r0: 0.032, r1: 0.042 },
    { len: 0.07, angle: 62, r0: 0.042, r1: 0.046 },
    { len: 0.06, angle: 28, r0: 0.046, r1: 0.04 },
    { len: 0.05, angle: 5, r0: 0.04, r1: 0.022 },
  ], COAT.squirrel));
  return parts;
}

// ---------------------------------------------------------------- flora: tree

// The current tree, from vegetation.js's own constant: one open cone, 7
// triangles, no trunk. Everything below is measured against this.
function treeCurrent() {
  const cone = new THREE.ConeGeometry(1, 1, CONE_SEGMENTS, 1, true);
  cone.translate(0, 0.5, 0);
  return [cone];
}

// A spruce as stacked tiers on a visible trunk. Unit height like the current
// cone, so the shader's `position.y * treeH` scaling still works unchanged and
// the crown-snow gradient keeps meaning what it means.
function treeTiers(tierCount, radial, { droop = 0, trunkR = 0.035 } = {}) {
  const parts = [];
  const trunk = new THREE.CylinderGeometry(trunkR * 0.8, trunkR * 1.5, 1, radial >= 8 ? 6 : 5, 1);
  trunk.translate(0, 0.5, 0);
  parts.push(trunk);
  // Tiers get shorter and narrower going up, and overlap so no gap shows between
  // them. The lowest starts above the ground because a spruce is bare at the
  // bottom of its trunk far more often than it is skirted to the floor.
  const base = 0.12;
  for (let i = 0; i < tierCount; i++) {
    const t = i / tierCount;
    const y0 = base + (1 - base) * t;
    const h = ((1 - base) / tierCount) * 1.85; // >1 so consecutive tiers overlap
    const r = (1 - t) * 0.98 + 0.06;
    const cone = new THREE.ConeGeometry(r, h, radial, 1, true);
    cone.translate(0, y0 + h / 2, 0);
    parts.push(cone);
    if (droop > 0 && i < tierCount - 1) {
      // A drooping skirt at each tier's base: an inverted shallow cone, which is
      // what makes a spruce read as a spruce rather than as a stack of pine
      // cones. One primitive, and it hides the seam between tiers.
      const skirt = new THREE.ConeGeometry(r * 1.04, h * droop, radial, 1, true);
      skirt.rotateX(Math.PI); // apex down
      skirt.translate(0, y0 + (h * droop) / 2, 0);
      parts.push(skirt);
    }
  }
  return parts;
}

// ------------------------------------------------------------------ the sets

// Each entry: what to draw, how many triangles it costs, and whether it wants
// smooth normals. `smooth` is a property of the CANDIDATE, not of the preview,
// because it is half of what "higher resolution" means here.
export const SETS = {
  ibex: {
    subject: 'Ibex',
    // Metres, roughly the height of the model, for the preview's camera framing.
    heightM: 1.3,
    variants: [
      { label: 'current (shipped)', build: () => MODEL_BUILDERS.ibex(), smooth: false },
      { label: '+ anatomy', build: ibexAnatomy, smooth: false,
        note: 'narrower chest, thighs, hooves, ears, muzzle, beard, tail, ribbed horns' },
      { label: '+ roundness', build: ibexRound, smooth: true,
        note: 'no new parts: segments up, smooth normals' },
      { label: 'both', build: ibexFull, smooth: true },
    ],
  },
  // The other four, each as current-vs-accepted-treatment. Two models per set
  // rather than four, because a squirrel and a chamois in one row would be framed
  // for whichever of them the camera favoured.
  chamois: {
    subject: 'Chamois',
    heightM: 1.07,
    variants: [
      { label: 'current (shipped)', build: () => MODEL_BUILDERS.chamois(), smooth: false },
      { label: '+ anatomy', build: chamoisAnatomy, smooth: false,
        note: 'dark face mask, long ears, muzzle, thighs, hooves, tail, ringed horn base' },
    ],
  },
  fox: {
    subject: 'Fox',
    heightM: 0.54,
    variants: [
      { label: 'current (shipped)', build: () => MODEL_BUILDERS.fox(), smooth: false },
      { label: '+ anatomy', build: foxAnatomy, smooth: false,
        note: 'bigger black-tipped ears, cheek ruff, thighs, paws, three-part brush' },
    ],
  },
  marmot: {
    subject: 'Marmot',
    heightM: 0.32,
    variants: [
      { label: 'current (shipped)', build: () => MODEL_BUILDERS.marmot(), smooth: false },
      { label: '+ anatomy (light)', build: marmotAnatomy, smooth: false,
        note: 'muzzle, small round ears, thighs - 62 px at 4 m, so nothing finer' },
    ],
  },
  squirrel: {
    subject: 'Squirrel',
    heightM: 0.2,
    variants: [
      { label: 'current (shipped)', build: () => MODEL_BUILDERS.squirrel(), smooth: false },
      { label: '+ anatomy (light)', build: squirrelAnatomy, smooth: false,
        note: 'muzzle, taller tufts, four-segment plume tail - 38 px at 4 m' },
    ],
  },
  tree: {
    subject: 'Spruce',
    heightM: 11, // the mean of the shipped TREE_MIN_H..TREE_MAX_H range
    variants: [
      { label: 'current (shipped)', build: treeCurrent, smooth: false,
        note: 'one open cone, no trunk' },
      { label: '3 tiers + trunk', build: () => treeTiers(3, 7), smooth: false },
      { label: '5 tiers + droop', build: () => treeTiers(5, 9, { droop: 0.42 }), smooth: false },
      { label: 'smooth cone', build: () => [new THREE.ConeGeometry(1, 1, 16, 1, true)
        .translate(0, 0.5, 0)], smooth: true,
        note: 'the cheap option: same shape, 16 sides, smooth' },
    ],
  },
};

// Merge one variant's parts into the single geometry it would actually be drawn
// as, and report what it costs. The tree parts carry no colour attribute (the
// shipped tree is one uniform material colour), so they are merged separately
// from the animals, which do.
export function buildVariant(variant, { colored }) {
  const parts = variant.build();
  const merged = BufferGeometryUtils.mergeGeometries(parts);
  if (!merged) throw new Error(`could not merge parts for "${variant.label}"`);
  if (variant.smooth) {
    // Smooth normals have to be COMPUTED, not just switched on: three's
    // primitives already carry per-face normals where they meet, and merging
    // them keeps those. This is what the material flag alone cannot do.
    merged.deleteAttribute('normal');
    merged.computeVertexNormals();
  }
  return {
    geometry: merged,
    triangles: merged.index ? merged.index.count / 3 : merged.attributes.position.count / 3,
    parts: parts.length,
    colored,
  };
}

export const TREE_COLOR = CANOPY_COLOR;
