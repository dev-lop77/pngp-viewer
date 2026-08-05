import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { attachAtmo } from './atmosphere.js';

// Birds (2026-08-05) - the second of the two topics the user deferred on
// 2026-08-04, and the last thing on their list. All four species they picked:
// golden eagle, alpine chough, bearded vulture, nutcracker.
//
// A SEPARATE MODULE from wildlife.js, and that is the one real design decision
// here. The note left for this session said the SPECIES table "should extend to
// birds; the ground clamp will not" - and having read that code again, the clamp
// is not a line to skip, it is the spine: rescan()'s habitat test, the orientation
// basis built from the surface normal, stepAnimal()'s two-dimensional targets and
// the leg-swing shader all assume something standing on the drawn surface. A
// `flight` flag would put a branch in every one of them. Things that walk and
// things that fly are two readable modules; one module with two kinds is how a
// file rots.
//
// What does carry over is reused rather than reinvented: one InstancedMesh per
// species with a single per-instance animation float and a distance fade, a
// deterministic hash lattice so the same ridge holds the same eagle on every load,
// habitat from the same terrain samplers, and the event hook into src/audio.js.
//
// What replaces the ground clamp is different per species, and in every case it is
// still derived from the terrain:
//
//   - a raptor's height comes from a THERMAL, and a thermal is derivable from what
//     is already sampled here: a ridge. The four-sample exposure test is the same
//     one src/audio.js uses to decide how windy it is where you are standing.
//   - a chough flock's height is "just above the col it lives on", and WHICH col is
//     real data - the user's choice: the 116 passes and 38 huts already in
//     public/data/poi.json are exactly where you meet them, mobbing walkers for
//     food. Nothing else in this project puts life on a named place.
//   - a nutcracker flies over the canopy, so its height comes from the same OSM
//     canopy mask the trees are placed from.
//
// Rarity is deliberate, and also the user's choice ("rari, come un avvistamento"):
// at most one or two raptors in view, and only over high ground. The sky is empty
// most of the time, which is exactly what makes an eagle worth looking up at.

const TAU = Math.PI * 2;
const GRAVITY = 9.81;

// Solved backwards from the intended on-screen colour with tools/dev/solve-albedo.mjs,
// exactly like the terrain bands, the canopy and the mammal coats. These are
// ALBEDO: they look too light as swatches and must not be darkened to taste - see
// the warning at the top of terrain.js.
const PLUMAGE = {
  eagle: 0x6f6252, // wants rgb(70,58,44) - dark brown
  eagleNape: 0xbe9d6a, // wants rgb(150,121,74) - the golden nape it is named for
  vultureBody: 0xd69166, // wants rgb(170,110,70) - rusty, from the iron-rich mud they bathe in
  vultureWing: 0x686873, // wants rgb(64,64,74) - slate
  chough: 0x4a4a4e, // wants rgb(35,35,38) - glossy black
  bill: 0xffff00, // the chough's yellow bill; out of reach at this exposure, so as bright as the rig allows
  nutcracker: 0x7e6961, // wants rgb(85,65,58) - dark brown, spotted white
  white: 0xffffff, // tail tips and vent - unreachable like snow, and only has to read as "much lighter"
};

// How far a wing swings at full flap, and how fast the shape settles.
const FLAP_RAD = 0.85;
// Herds are re-chosen on the same cadence as wildlife.js, for the same reason: the
// habitat tests cost height samples and the answer cannot change while you stand
// still.
const RESCAN_MOVE_M = 60;
const RESCAN_S = 2;
// Baseline for the ridge test. Wider than audio.js's 90 m because a thermal forms
// over a whole shoulder, not over the bump you happen to be standing on.
const RIDGE_PROBE_M = 140;

const SPECIES = [
  {
    name: 'eagle',
    kind: 'soar',
    salt: 0x7a11,
    // The park holds some 20-25 pairs over ~700 km2, i.e. about 0.07 birds/km2,
    // and the draw distance below covers an 11 km2 disc - so "correct" is a few
    // tenths of a bird in view at any moment. The first numbers here (22% presence,
    // exposure >= 0.35) produced ZERO raptors at 40 viewpoints across the whole
    // park, which is not rare, it is absent: the ridge and elevation tests throw
    // away far more cells than the presence figure suggests, so the presence has to
    // be generous to survive them. Measured after: see tools/test-birds.mjs.
    cellM: 2600,
    presence: 0.6,
    minPerSite: 1,
    maxPerSite: 2, // a pair, sometimes
    speedMps: 14,
    // 2 m/s to a 450 m ceiling gives a cycle of about four minutes: climb, top out,
    // glide away. The first numbers (1.1 m/s, 620 m) were a defensible lazy-day
    // thermal and took EIGHT minutes to complete one - so in practice the glide,
    // which is half of what soaring looks like, was never seen at all. Real birds
    // climb at 1-3 m/s, so this is inside honest and much better to watch.
    climbMps: 2,
    sinkMps: 0.7, // and what the glide costs
    radiusMin: 45,
    radiusMax: 95,
    aglMin: 60, // never closer to the ground than this while soaring
    aglMax: 450, // ...nor further above it
    glideMaxM: 2600, // how far it will leave on one glide before looking for lift
    flapAmp: 0, // it SOARS: the wings are held, which is the whole silhouette
    visibleM: 1900,
    fadeStartM: 1500,
    scaleMin: 0.95,
    scaleMax: 1.1,
    capacity: 8,
    habitat: { elevMin: 2000, exposureMin: 0.22 },
  },
  {
    name: 'vulture',
    kind: 'soar',
    salt: 0x7b22,
    // Rarer still, and it ranges further: reintroduced in the Alps from 1986 and
    // there are only a handful of territories anywhere near here.
    cellM: 4200,
    presence: 0.32,
    minPerSite: 1,
    maxPerSite: 1,
    speedMps: 15,
    climbMps: 2.2,
    sinkMps: 0.6, // 2.8 m of wing sinks very slowly
    radiusMin: 70,
    radiusMax: 140,
    aglMin: 120,
    aglMax: 700,
    glideMaxM: 4200,
    flapAmp: 0,
    visibleM: 2300,
    fadeStartM: 1800,
    scaleMin: 1.0,
    scaleMax: 1.15,
    capacity: 6,
    habitat: { elevMin: 2200, exposureMin: 0.2 },
  },
  {
    name: 'chough',
    kind: 'flock',
    salt: 0x7c33,
    // Placed on real passes and huts rather than on a lattice (the user's call), so
    // this table carries no cellM at all.
    siteCategories: ['pass', 'hut'],
    siteElevMin: 1900,
    sitePresence: 0.55,
    flockMin: 8,
    flockMax: 22,
    orbitRadiusM: 45, // how far the flock's centre wanders around its col
    orbitSpeedMps: 3.5,
    centreAglMin: 14,
    centreAglMax: 38,
    memberRadiusM: 13, // how far the birds spread around the centre
    memberSpeedMps: 6,
    flapAmp: 1,
    flapHz: 3.4,
    // They are famously bold around anyone eating a sandwich at a col.
    curiousM: 110,
    standoffM: 15,
    callEveryS: [2.5, 7],
    callEarshotM: 320,
    visibleM: 700,
    fadeStartM: 520,
    scaleMin: 0.9,
    scaleMax: 1.1,
    capacity: 110,
  },
  {
    name: 'nutcracker',
    kind: 'canopy',
    salt: 0x7d44,
    cellM: 430,
    presence: 0.32,
    minPerSite: 1,
    maxPerSite: 2,
    speedMps: 7.5,
    // Undulating flight is the field mark: it beats its way up, then closes its
    // wings and falls. One phase drives both the height and the flapping, which is
    // what the real mechanism is.
    undulateM: 26, // wavelength along the path
    undulateAmpM: 3.2,
    cruiseAglM: 21, // above the tallest tree in vegetation.js (16 m) with room to spare
    hopMinM: 45,
    hopMaxM: 95,
    flapAmp: 1,
    alertM: 45,
    visibleM: 220,
    fadeStartM: 160,
    scaleMin: 0.9,
    scaleMax: 1.05,
    capacity: 28,
    habitat: { elevMin: 900, elevMax: 2300, canopyMin: 0.35 },
  },
];

function glsl(n) {
  const s = n.toPrecision(12);
  return s.includes('.') || s.includes('e') ? s : `${s}.0`;
}

function patch(source, marker, replacement) {
  if (!source.includes(marker)) {
    throw new Error(`birds.js: shader marker not found: ${marker}`);
  }
  return source.replace(marker, replacement);
}

// Same generator as vegetation.js and wildlife.js, duplicated for the same reason
// they duplicate it from each other: eight lines, and a shared home for it would
// be a module that exists only to hold eight lines.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cellRandom(ix, iz, salt) {
  let h = Math.imul(ix | 0, 0x27d4eb2d) ^ Math.imul(iz | 0, 0x165667b1) ^ Math.imul(salt, 0x9e3779b9);
  h = Math.imul(h ^ (h >>> 15), 0x2545f491);
  return mulberry32(h ^ (h >>> 13));
}

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Tag one primitive with its colour, and with whether it is a wing (in which case
// the shader rotates it about the body axis to flap).
function part(geometry, color, { wing = 0 } = {}) {
  geometry.deleteAttribute('uv');
  const n = geometry.attributes.position.count;
  const colors = new Float32Array(n * 3);
  const wings = new Float32Array(n);
  // ONE sRGB->linear conversion: three's ColorManagement does it inside the Color
  // constructor and colour ATTRIBUTES are read as working space already. Never
  // also call convertSRGBToLinear() - the double gamma is a documented trap here.
  const c = new THREE.Color(color);
  for (let i = 0; i < n; i++) {
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    wings[i] = wing;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aWing', new THREE.BufferAttribute(wings, 1));
  return geometry;
}

// Bodies are capsules along Z, nose toward +Z, exactly like the mammals - so an
// orientation is a basis with forward on +Z. Unlike the mammals, a bird is modelled
// around its own centre rather than with its feet at y = 0: it is placed in the air
// and rolled about its own axis, and both of those want the origin at the body.
function capsuleZ(radius, length, radial = 6) {
  const g = new THREE.CapsuleGeometry(radius, length, 2, radial);
  g.rotateX(Math.PI / 2);
  return g;
}

// A wing, a tail or any other flat surface: two triangles, drawn double-sided. A
// silhouette is what a bird at any distance actually is, and a flat quad gives a
// clean one for four vertices - a solid wing would cost geometry to look worse.
function panel({ x0, x1, zRoot, zTip, chordRoot, chordTip, rise = 0, y = 0 }) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array([
    x0, y, zRoot + chordRoot / 2, // 0 root leading
    x0, y, zRoot - chordRoot / 2, // 1 root trailing
    x1, y + rise, zTip + chordTip / 2, // 2 tip leading
    x1, y + rise, zTip - chordTip / 2, // 3 tip trailing
  ]);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  // Indexed, and that is not a detail: mergeGeometries() refuses a mix of indexed
  // and non-indexed inputs ("make sure index attribute exists among all geometries,
  // or in none of them"), and the capsules and cones this is merged with are
  // indexed. The first version of this file was four raw vertices per triangle and
  // failed to build a single bird.
  geometry.setIndex([0, 1, 2, 1, 3, 2]);
  geometry.computeVertexNormals();
  return geometry;
}

function buildEagle() {
  const body = capsuleZ(0.085, 0.36);
  const head = capsuleZ(0.062, 0.05);
  head.translate(0, 0.015, 0.25);
  const nape = capsuleZ(0.055, 0.06);
  nape.translate(0, 0.03, 0.16);
  const beak = new THREE.ConeGeometry(0.028, 0.07, 5);
  beak.rotateX(Math.PI / 2);
  beak.translate(0, 0.005, 0.32);
  const parts = [
    part(body, PLUMAGE.eagle),
    part(head, PLUMAGE.eagle),
    // The golden nape is the field mark the bird is named for, and it is the one
    // patch of colour that reads from below against a bright sky.
    part(nape, PLUMAGE.eagleNape),
    part(beak, PLUMAGE.eagleNape),
    // Tail: broad and square, held closed in a glide.
    part(panel({ x0: -0.15, x1: 0.15, zRoot: -0.3, zTip: -0.3, chordRoot: 0.34, chordTip: 0.34 }), PLUMAGE.eagle),
  ];
  // 2.2 m of wingspan, held in the shallow V that makes a golden eagle
  // recognisable at a kilometre.
  for (const side of [1, -1]) {
    parts.push(part(panel({
      x0: side * 0.07, x1: side * 1.08, zRoot: 0.06, zTip: -0.1,
      chordRoot: 0.34, chordTip: 0.17, rise: 0.075,
    }), PLUMAGE.eagle, { wing: 1 }));
  }
  return parts;
}

function buildVulture() {
  const body = capsuleZ(0.1, 0.42);
  const head = capsuleZ(0.06, 0.05);
  head.translate(0, 0.02, 0.29);
  const beak = new THREE.ConeGeometry(0.03, 0.08, 5);
  beak.rotateX(Math.PI / 2);
  beak.translate(0, 0.01, 0.37);
  const parts = [
    // Rusty underneath, slate above: the bearded vulture stains itself in
    // iron-rich mud, which is a real and slightly absurd piece of natural history.
    part(body, PLUMAGE.vultureBody),
    part(head, PLUMAGE.vultureBody),
    part(beak, PLUMAGE.vultureWing),
    // The wedge tail IS the identification, more than the size is.
    part(panel({ x0: -0.13, x1: 0.13, zRoot: -0.34, zTip: -0.34, chordRoot: 0.16, chordTip: 0.16 }), PLUMAGE.vultureWing),
    part(panel({ x0: -0.09, x1: 0.09, zRoot: -0.52, zTip: -0.52, chordRoot: 0.42, chordTip: 0.42 }), PLUMAGE.vultureWing),
  ];
  // 2.8 m, long and narrow rather than broad - it is built for distance.
  for (const side of [1, -1]) {
    parts.push(part(panel({
      x0: side * 0.08, x1: side * 1.4, zRoot: 0.04, zTip: -0.16,
      chordRoot: 0.33, chordTip: 0.13, rise: 0.03,
    }), PLUMAGE.vultureWing, { wing: 1 }));
  }
  return parts;
}

function buildChough() {
  const body = capsuleZ(0.042, 0.13);
  const head = capsuleZ(0.033, 0.02);
  head.translate(0, 0.012, 0.095);
  // The yellow bill is the whole difference between a chough and a jackdaw, and it
  // is visible precisely because they come close enough to see it.
  const bill = new THREE.ConeGeometry(0.011, 0.045, 4);
  bill.rotateX(Math.PI / 2);
  bill.translate(0, 0.008, 0.135);
  const parts = [
    part(body, PLUMAGE.chough),
    part(head, PLUMAGE.chough),
    part(bill, PLUMAGE.bill),
    part(panel({ x0: -0.045, x1: 0.045, zRoot: -0.13, zTip: -0.13, chordRoot: 0.14, chordTip: 0.14 }), PLUMAGE.chough),
  ];
  for (const side of [1, -1]) {
    parts.push(part(panel({
      x0: side * 0.035, x1: side * 0.37, zRoot: 0.02, zTip: -0.05,
      chordRoot: 0.13, chordTip: 0.06, rise: 0.01,
    }), PLUMAGE.chough, { wing: 1 }));
  }
  return parts;
}

function buildNutcracker() {
  const body = capsuleZ(0.04, 0.11);
  const head = capsuleZ(0.032, 0.02);
  head.translate(0, 0.01, 0.085);
  const bill = new THREE.ConeGeometry(0.012, 0.05, 4);
  bill.rotateX(Math.PI / 2);
  bill.translate(0, 0.004, 0.125);
  const parts = [
    part(body, PLUMAGE.nutcracker),
    part(head, PLUMAGE.nutcracker),
    part(bill, PLUMAGE.nutcracker),
    // White tail corners, the mark you actually see as it crosses a clearing.
    part(panel({ x0: -0.04, x1: 0.04, zRoot: -0.1, zTip: -0.1, chordRoot: 0.09, chordTip: 0.09 }), PLUMAGE.nutcracker),
    part(panel({ x0: -0.04, x1: 0.04, zRoot: -0.15, zTip: -0.15, chordRoot: 0.03, chordTip: 0.03 }), PLUMAGE.white),
  ];
  for (const side of [1, -1]) {
    parts.push(part(panel({
      x0: side * 0.032, x1: side * 0.26, zRoot: 0.015, zTip: -0.03,
      chordRoot: 0.12, chordTip: 0.07, rise: 0.008,
    }), PLUMAGE.nutcracker, { wing: 1 }));
  }
  return parts;
}

const BUILDERS = {
  eagle: buildEagle,
  vulture: buildVulture,
  chough: buildChough,
  nutcracker: buildNutcracker,
};

function speciesMesh(spec) {
  const merged = BufferGeometryUtils.mergeGeometries(BUILDERS[spec.name]());
  // One float per instance, exactly like wildlife.js's aSwing: the flap angle,
  // computed on the CPU where the flight state already lives. A soaring raptor
  // simply passes 0 and its wings are held - which is why the same attribute
  // serves a bird that never flaps and one that never stops.
  merged.setAttribute('aFlap', new THREE.InstancedBufferAttribute(new Float32Array(spec.capacity), 1));

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.9,
    metalness: 0,
    // Wings and tail are single-sided quads, and a bird is seen from below at
    // least as often as from above.
    side: THREE.DoubleSide,
    // Same reason as the trees and the mammals: the shader rotates wing vertices,
    // and flat shading takes its normals from screen-space derivatives, so they
    // stay correct through that with no per-instance inverse-transpose work.
    flatShading: true,
  });

  material.onBeforeCompile = (shader) => {
    let vs = shader.vertexShader;
    vs = patch(vs, '#include <common>', '#include <common>\n  attribute float aWing;\n  attribute float aFlap;');
    // Rotate wing vertices about the body's own Z axis. The sign comes from the
    // vertex's own x, so both wings rise together, and body vertices carry
    // aWing = 0, which makes the angle zero and reduces this to the stock line
    // with no branch - the same shape as wildlife.js's leg swing.
    vs = patch(vs, '#include <begin_vertex>', /* glsl */ `
      float wingAngle = aWing * aFlap * ${glsl(FLAP_RAD)} * sign( position.x );
      float wc = cos( wingAngle );
      float ws = sin( wingAngle );
      vec3 transformed = vec3(
        position.x * wc - position.y * ws,
        position.x * ws + position.y * wc,
        position.z
      );
    `);
    shader.vertexShader = vs;
  };
  attachAtmo(material); // the phase-4 aerial perspective, like everything else

  const mesh = new THREE.InstancedMesh(merged, material, spec.capacity);
  mesh.name = `birds-${spec.name}`;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.count = 0;
  mesh.frustumCulled = false; // the geometry's bounds describe one bird at the origin
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

// onCall is optional and works exactly like wildlife.js's onAlarm: this module
// knows when a bird calls, src/audio.js knows what that species sounds like and
// whether it is within earshot. Raptors never call - a golden eagle is almost
// silent, and faking a scream would be the single most common mistake made about
// this bird.
export function createBirds({ sampleGroundHeight, canopyAt, pois = [], onCall = null }) {
  const group = new THREE.Group();
  group.name = 'birds';

  const state = SPECIES.map((spec) => ({
    spec,
    mesh: speciesMesh(spec),
    sites: new Map(), // "ix:iz" or a POI key -> site, or null for "tested, nothing here"
  }));
  for (const s of state) group.add(s.mesh);

  const matrix = new THREE.Matrix4();
  const basis = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scaleVec = new THREE.Vector3();
  const fwd = new THREE.Vector3();
  const up = new THREE.Vector3();
  const right = new THREE.Vector3();
  const WORLD_UP = new THREE.Vector3(0, 1, 0);

  let elapsed = 0;
  let nextId = 1;

  // How much higher the ground is here than it is around here: 1 on a ridge or a
  // col, 0 in a basin. The same idea as src/audio.js's wind exposure, over a wider
  // baseline - a thermal forms over a whole shoulder.
  function ridgeExposure(x, z, ground) {
    let sum = 0;
    let n = 0;
    for (const [dx, dz] of [[RIDGE_PROBE_M, 0], [-RIDGE_PROBE_M, 0], [0, RIDGE_PROBE_M], [0, -RIDGE_PROBE_M]]) {
      const h = sampleGroundHeight(x + dx, z + dz);
      if (Number.isFinite(h)) {
        sum += h;
        n++;
      }
    }
    if (!n) return 0;
    return smoothstep(0, 60, ground - sum / n);
  }

  function makeSoarSite(spec, ix, iz) {
    const rnd = cellRandom(ix, iz, spec.salt);
    if (rnd() > spec.presence) return null;
    const x = (ix + 0.5) * spec.cellM + (rnd() - 0.5) * spec.cellM * 0.6;
    const z = (iz + 0.5) * spec.cellM + (rnd() - 0.5) * spec.cellM * 0.6;
    const ground = sampleGroundHeight(x, z);
    if (!Number.isFinite(ground) || ground < spec.habitat.elevMin) return null;
    const exposure = ridgeExposure(x, z, ground);
    if (exposure < spec.habitat.exposureMin) return null;

    const count = spec.minPerSite + Math.floor(rnd() * (spec.maxPerSite - spec.minPerSite + 1));
    const birds = [];
    for (let i = 0; i < count; i++) {
      const radius = lerp(spec.radiusMin, spec.radiusMax, rnd());
      birds.push({
        id: `${spec.name}:${ix}:${iz}:${i}`,
        numericId: nextId++,
        mode: 'circle',
        cx: x + (rnd() - 0.5) * 40,
        cz: z + (rnd() - 0.5) * 40,
        radius,
        dir: rnd() < 0.5 ? 1 : -1,
        phase: rnd() * TAU,
        x, y: ground + lerp(spec.aglMin, spec.aglMax * 0.5, rnd()), z,
        vx: 0, vy: 0, vz: 0,
        bank: 0,
        flap: 0,
        glideX: 0,
        glideZ: 1,
        glideLeft: 0,
        scale: lerp(spec.scaleMin, spec.scaleMax, rnd()),
        exposure,
      });
    }
    return { x, z, ground, exposure, birds, rnd };
  }

  // Choughs live on named places, not on a lattice - the user's decision, and the
  // one that makes the encounter recognisable: you meet them AT the col, which is
  // exactly where a visitor is heading anyway.
  function makeFlockSite(spec, poi, index) {
    const rnd = mulberry32(Math.imul(index + 1, 0x9e3779b9) ^ spec.salt);
    if (rnd() > spec.sitePresence) return null;
    const ground = sampleGroundHeight(poi.local.x, poi.local.z);
    if (!Number.isFinite(ground)) return null;

    const size = spec.flockMin + Math.floor(rnd() * (spec.flockMax - spec.flockMin + 1));
    const members = [];
    for (let i = 0; i < size; i++) {
      members.push({
        radius: lerp(3, spec.memberRadiusM, rnd() ** 0.6),
        phase: rnd() * TAU,
        rate: lerp(0.6, 1.5, rnd()), // each bird takes its own line round the flock
        dy: (rnd() - 0.5) * 9,
        bobPhase: rnd() * TAU,
        flapPhase: rnd() * TAU,
        scale: lerp(spec.scaleMin, spec.scaleMax, rnd()),
      });
    }
    return {
      name: poi.name,
      x: poi.local.x,
      z: poi.local.z,
      ground,
      elevationM: poi.elevationM,
      category: poi.category,
      // The flock's centre, which is what moves; the members orbit it.
      cx: poi.local.x,
      cy: ground + lerp(spec.centreAglMin, spec.centreAglMax, rnd()),
      cz: poi.local.z,
      orbitPhase: rnd() * TAU,
      orbitDir: rnd() < 0.5 ? 1 : -1,
      inspecting: false,
      callIn: lerp(spec.callEveryS[0], spec.callEveryS[1], rnd()),
      members,
      rnd,
    };
  }

  function makeCanopySite(spec, ix, iz) {
    const rnd = cellRandom(ix, iz, spec.salt);
    if (rnd() > spec.presence) return null;
    const x = (ix + 0.5) * spec.cellM + (rnd() - 0.5) * spec.cellM * 0.7;
    const z = (iz + 0.5) * spec.cellM + (rnd() - 0.5) * spec.cellM * 0.7;
    const ground = sampleGroundHeight(x, z);
    if (!Number.isFinite(ground)) return null;
    if (ground < spec.habitat.elevMin || ground > spec.habitat.elevMax) return null;
    if (canopyAt(x, z) < spec.habitat.canopyMin) return null;

    const count = spec.minPerSite + Math.floor(rnd() * (spec.maxPerSite - spec.minPerSite + 1));
    const birds = [];
    for (let i = 0; i < count; i++) {
      const angle = rnd() * TAU;
      birds.push({
        id: `${spec.name}:${ix}:${iz}:${i}`,
        numericId: nextId++,
        x: x + Math.cos(angle) * 12,
        z: z + Math.sin(angle) * 12,
        y: ground + spec.cruiseAglM,
        homeX: x,
        homeZ: z,
        targetX: x,
        targetZ: z,
        travelled: 0,
        heading: angle,
        bank: 0,
        flap: 0,
        alarmed: false,
        scale: lerp(spec.scaleMin, spec.scaleMax, rnd()),
        rnd,
      });
    }
    return { x, z, ground, birds, rnd };
  }

  function rescan(camera) {
    const camX = camera.position.x;
    const camZ = camera.position.z;
    for (const entry of state) {
      const { spec, sites } = entry;
      if (spec.kind === 'flock') {
        // A short list of real places: just test the ones in range.
        for (let i = 0; i < flockPois.length; i++) {
          const poi = flockPois[i];
          if (Math.hypot(poi.local.x - camX, poi.local.z - camZ) > spec.visibleM * 1.2) continue;
          const key = `poi:${i}`;
          if (sites.has(key)) continue;
          sites.set(key, makeFlockSite(spec, poi, i));
        }
        continue;
      }
      // Forget what is far behind. Without this, a flight across the park
      // accumulates every site it ever passed and keeps simulating all of them -
      // measured at 799 birds and ~1 ms/frame after one test sweep. The sites are
      // deterministic, so coming back rebuilds exactly the same ones.
      const forgetBeyond = spec.visibleM * 2.5;
      for (const [key, site] of sites) {
        const sx = site ? site.x : (Number(key.split(':')[0]) + 0.5) * spec.cellM;
        const sz = site ? site.z : (Number(key.split(':')[1]) + 0.5) * spec.cellM;
        if (Math.hypot(sx - camX, sz - camZ) > forgetBeyond) sites.delete(key);
      }
      const reach = Math.ceil(spec.visibleM / spec.cellM) + 1;
      const cx = Math.floor(camX / spec.cellM);
      const cz = Math.floor(camZ / spec.cellM);
      for (let iz = cz - reach; iz <= cz + reach; iz++) {
        for (let ix = cx - reach; ix <= cx + reach; ix++) {
          const key = `${ix}:${iz}`;
          if (sites.has(key)) continue;
          sites.set(key, spec.kind === 'soar' ? makeSoarSite(spec, ix, iz) : makeCanopySite(spec, ix, iz));
        }
      }
    }
  }

  // --- flight models -------------------------------------------------------

  // A thermal is lift over a ridge, so a soaring bird spends its day doing two
  // things: circling to gain height, then trading it for distance. Nothing here
  // reacts to the camera, and that is deliberate: the bird is hundreds of metres
  // up, it has not noticed you, and making it flee would be a lie.
  function stepSoarer(spec, site, bird, dt) {
    const ground = sampleGroundHeight(bird.x, bird.z);
    const groundY = Number.isFinite(ground) ? ground : site.ground;

    if (bird.mode === 'circle') {
      const omega = (spec.speedMps / bird.radius) * bird.dir;
      bird.phase += omega * dt;
      const nx = bird.cx + Math.cos(bird.phase) * bird.radius;
      const nz = bird.cz + Math.sin(bird.phase) * bird.radius;
      bird.y += spec.climbMps * dt;
      // A coordinated turn: the bank angle is not a look, it is what balances
      // centripetal acceleration against gravity. atan(v^2 / (r g)) - about 25
      // degrees for an eagle circling at 14 m/s in a 45 m thermal.
      bird.bank = Math.atan((spec.speedMps * spec.speedMps) / (bird.radius * GRAVITY)) * -bird.dir;
      bird.vx = (nx - bird.x) / dt;
      bird.vz = (nz - bird.z) / dt;
      bird.vy = spec.climbMps;
      bird.x = nx;
      bird.z = nz;
      if (bird.y - groundY > spec.aglMax) {
        // Topped out: leave on a glide, in a direction that is at least plausibly
        // towards more high ground.
        bird.mode = 'glide';
        const angle = site.rnd() * TAU;
        bird.glideX = Math.sin(angle);
        bird.glideZ = Math.cos(angle);
        bird.glideLeft = lerp(spec.glideMaxM * 0.35, spec.glideMaxM, site.rnd());
      }
      return;
    }

    // Gliding: straight, wings held, losing height slowly.
    const step = spec.speedMps * 1.25 * dt; // a glide is faster than a circle
    bird.x += bird.glideX * step;
    bird.z += bird.glideZ * step;
    bird.y -= spec.sinkMps * dt;
    bird.glideLeft -= step;
    bird.vx = bird.glideX * spec.speedMps * 1.25;
    bird.vz = bird.glideZ * spec.speedMps * 1.25;
    bird.vy = -spec.sinkMps;
    bird.bank += (0 - bird.bank) * (1 - Math.exp(-dt / 1.2)); // level out
    if (bird.glideLeft <= 0 || bird.y - groundY < spec.aglMin) {
      // Find lift again: circle where it is, over whatever it has reached.
      bird.mode = 'circle';
      bird.cx = bird.x - Math.cos(bird.phase) * bird.radius;
      bird.cz = bird.z - Math.sin(bird.phase) * bird.radius;
      bird.dir = site.rnd() < 0.5 ? 1 : -1;
      bird.y = Math.max(bird.y, groundY + spec.aglMin);
    }
  }

  // A flock has one moving centre and members that orbit it. The centre is CPU
  // work - it has to react to the camera - but there is only one of it per col,
  // and the members are a fixed offset plus a phase. Placing the members in the
  // vertex shader (the trick vegetation.js uses for trees) would need the centre
  // as a per-instance attribute rewritten every frame anyway, so it would buy
  // nothing at this population.
  function stepFlock(spec, site, dt, camera) {
    const camX = camera.position.x;
    const camY = camera.position.y;
    const camZ = camera.position.z;
    const distToAnchor = Math.hypot(site.x - camX, site.z - camZ);

    site.orbitPhase += (spec.orbitSpeedMps / spec.orbitRadiusM) * site.orbitDir * dt;
    let targetX = site.x + Math.cos(site.orbitPhase) * spec.orbitRadiusM;
    let targetZ = site.z + Math.sin(site.orbitPhase) * spec.orbitRadiusM;
    let targetY = site.cy;

    // Bold at close range, which is the whole character of the species: they come
    // to look at you, hold a distance, and back off if you close on them.
    site.inspecting = distToAnchor < spec.curiousM;
    if (site.inspecting) {
      const away = Math.hypot(site.cx - camX, site.cz - camZ) || 1;
      const hold = Math.max(spec.standoffM, 8);
      targetX = camX + ((site.cx - camX) / away) * hold;
      targetZ = camZ + ((site.cz - camZ) / away) * hold;
      targetY = camY + 7;
    }

    // Eased rather than snapped: a flock drifts, it does not jump.
    const k = 1 - Math.exp(-dt / (site.inspecting ? 1.6 : 3.5));
    site.cx += (targetX - site.cx) * k;
    site.cy += (targetY - site.cy) * k;
    site.cz += (targetZ - site.cz) * k;

    // Never below the ground, whatever the camera does.
    const ground = sampleGroundHeight(site.cx, site.cz);
    if (Number.isFinite(ground)) site.cy = Math.max(site.cy, ground + 4);

    if (onCall) {
      site.callIn -= dt;
      if (site.callIn <= 0) {
        site.callIn = lerp(spec.callEveryS[0], spec.callEveryS[1], site.rnd());
        if (Math.hypot(site.cx - camX, site.cz - camZ) < spec.callEarshotM) {
          onCall({ species: spec.name, x: site.cx, z: site.cz, distanceM: distToAnchor });
        }
      }
    }
  }

  // Undulating flight: it beats its way up, then closes its wings and falls. One
  // phase drives the height AND the flapping, because that is the actual mechanism
  // rather than two effects that happen to look related.
  function stepCanopyBird(spec, site, bird, dt, camera) {
    const camX = camera.position.x;
    const camZ = camera.position.z;
    const camDist = Math.hypot(bird.x - camX, bird.z - camZ);

    let dx = bird.targetX - bird.x;
    let dz = bird.targetZ - bird.z;
    let dist = Math.hypot(dx, dz);

    // Disturbed: pick the next perch away from the camera, and say so once.
    if (camDist < spec.alertM && !bird.alarmed) {
      bird.alarmed = true;
      const away = Math.atan2(bird.x - camX, bird.z - camZ);
      pickHop(spec, bird, away + (bird.rnd() - 0.5) * 0.8);
      dx = bird.targetX - bird.x;
      dz = bird.targetZ - bird.z;
      dist = Math.hypot(dx, dz);
      onCall?.({ species: spec.name, x: bird.x, z: bird.z, distanceM: camDist });
    } else if (bird.alarmed && camDist > spec.alertM * 1.5) {
      bird.alarmed = false;
    }

    if (dist < 2) {
      pickHop(spec, bird, bird.rnd() * TAU);
      return;
    }

    const step = spec.speedMps * dt;
    bird.x += (dx / dist) * step;
    bird.z += (dz / dist) * step;
    bird.travelled += step;
    bird.heading = Math.atan2(dx, dz);

    const ground = sampleGroundHeight(bird.x, bird.z);
    const groundY = Number.isFinite(ground) ? ground : site.ground;
    const wave = Math.sin((bird.travelled / spec.undulateM) * TAU);
    bird.y = groundY + spec.cruiseAglM + wave * spec.undulateAmpM;
    // Wings beat on the way up and are closed on the way down - the flap follows
    // the same wave, rectified.
    bird.flap = Math.max(0, Math.cos((bird.travelled / spec.undulateM) * TAU));
    bird.vx = (dx / dist) * spec.speedMps;
    bird.vz = (dz / dist) * spec.speedMps;
    bird.vy = wave * 0.6;
    bird.bank = 0;
  }

  function pickHop(spec, bird, preferredAngle) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const angle = preferredAngle + (attempt === 0 ? 0 : (bird.rnd() - 0.5) * 2.2);
      const reach = lerp(spec.hopMinM, spec.hopMaxM, bird.rnd());
      const tx = bird.x + Math.sin(angle) * reach;
      const tz = bird.z + Math.cos(angle) * reach;
      if (canopyAt(tx, tz) >= spec.habitat.canopyMin * 0.7) {
        bird.targetX = tx;
        bird.targetZ = tz;
        bird.travelled = 0;
        return;
      }
    }
    // Nowhere wooded in reach: go back to where it came from rather than out into
    // the open.
    bird.targetX = bird.homeX;
    bird.targetZ = bird.homeZ;
    bird.travelled = 0;
  }

  // --- drawing -------------------------------------------------------------

  // Orientation from a velocity plus a bank angle. The roll is applied about the
  // flight direction, which is what a bird actually does - it does not slide
  // sideways through a turn.
  function orient(vx, vy, vz, bank) {
    fwd.set(vx, vy, vz);
    if (fwd.lengthSq() < 1e-8) fwd.set(0, 0, 1);
    fwd.normalize();
    right.crossVectors(WORLD_UP, fwd);
    if (right.lengthSq() < 1e-8) right.set(1, 0, 0); // straight up or down
    right.normalize();
    up.crossVectors(fwd, right);
    if (bank !== 0) {
      const c = Math.cos(bank);
      const s = Math.sin(bank);
      const rx = right.x * c + up.x * s;
      const ry = right.y * c + up.y * s;
      const rz = right.z * c + up.z * s;
      up.set(up.x * c - right.x * s, up.y * c - right.y * s, up.z * c - right.z * s);
      right.set(rx, ry, rz);
    }
    basis.makeBasis(right, up, fwd);
    quaternion.setFromRotationMatrix(basis);
  }

  function draw(entry, camera) {
    const { spec, mesh, sites } = entry;
    const flaps = mesh.geometry.getAttribute('aFlap');
    const camX = camera.position.x;
    const camY = camera.position.y;
    const camZ = camera.position.z;
    let drawn = 0;

    for (const site of sites.values()) {
      if (!site) continue;
      if (spec.kind === 'flock') {
        for (const member of site.members) {
          if (drawn >= spec.capacity) break;
          const angle = member.phase + (elapsed * spec.memberSpeedMps * member.rate) / Math.max(member.radius, 1);
          const mx = site.cx + Math.cos(angle) * member.radius;
          const mz = site.cz + Math.sin(angle) * member.radius;
          const my = site.cy + member.dy + Math.sin(elapsed * 0.9 + member.bobPhase) * 1.6;
          const dist = Math.hypot(mx - camX, my - camY, mz - camZ);
          const fade = 1 - smoothstep(spec.fadeStartM, spec.visibleM, dist);
          if (fade <= 0) continue;
          // Tangent of its own orbit, plus the bank that turn implies.
          const tangential = (spec.memberSpeedMps * member.rate);
          orient(-Math.sin(angle) * tangential, 0, Math.cos(angle) * tangential,
            Math.atan((tangential * tangential) / (Math.max(member.radius, 1) * GRAVITY)) * -1);
          position.set(mx, my, mz);
          scaleVec.setScalar(member.scale * fade);
          matrix.compose(position, quaternion, scaleVec);
          mesh.setMatrixAt(drawn, matrix);
          flaps.setX(drawn, Math.sin(elapsed * spec.flapHz * TAU + member.flapPhase) * spec.flapAmp);
          drawn++;
        }
        continue;
      }

      for (const bird of site.birds) {
        if (drawn >= spec.capacity) break;
        const dist = Math.hypot(bird.x - camX, bird.y - camY, bird.z - camZ);
        const fade = 1 - smoothstep(spec.fadeStartM, spec.visibleM, dist);
        if (fade <= 0) continue;
        orient(bird.vx, bird.vy, bird.vz, bird.bank);
        position.set(bird.x, bird.y, bird.z);
        scaleVec.setScalar(bird.scale * fade);
        matrix.compose(position, quaternion, scaleVec);
        mesh.setMatrixAt(drawn, matrix);
        flaps.setX(drawn, bird.flap * spec.flapAmp);
        drawn++;
      }
    }

    mesh.count = drawn;
    mesh.instanceMatrix.needsUpdate = true;
    flaps.needsUpdate = true;
  }

  // Only the places choughs actually use, resolved once: passes and huts high
  // enough to be their ground.
  const choughSpec = SPECIES.find((s) => s.name === 'chough');
  const flockPois = pois.filter((p) => choughSpec.siteCategories.includes(p.category)
    && (p.elevationM ?? 0) >= choughSpec.siteElevMin);

  let sinceRescan = RESCAN_S;
  let lastScanX = Infinity;
  let lastScanZ = Infinity;
  let lastCamX = 0;
  let lastCamZ = 0;

  function update(dt, camera) {
    elapsed += dt;
    lastCamX = camera.position.x;
    lastCamZ = camera.position.z;
    sinceRescan += dt;
    if (sinceRescan >= RESCAN_S
      || Math.hypot(lastCamX - lastScanX, lastCamZ - lastScanZ) > RESCAN_MOVE_M) {
      rescan(camera);
      sinceRescan = 0;
      lastScanX = lastCamX;
      lastScanZ = lastCamZ;
    }

    for (const entry of state) {
      const { spec, sites } = entry;
      for (const site of sites.values()) {
        if (!site) continue;
        if (spec.kind === 'flock') {
          stepFlock(spec, site, dt, camera);
          continue;
        }
        for (const bird of site.birds) {
          if (spec.kind === 'soar') stepSoarer(spec, site, bird, dt);
          else stepCanopyBird(spec, site, bird, dt, camera);
        }
      }
      draw(entry, camera);
    }
  }

  // What a test needs: not pixels, but whether each bird is where its species
  // would be, at a height that makes sense, banking the way physics says.
  function snapshot() {
    const rows = [];
    for (const { spec, mesh, sites } of state) {
      for (const site of sites.values()) {
        if (!site) continue;
        if (spec.kind === 'flock') {
          const ground = sampleGroundHeight(site.cx, site.cz);
          rows.push({
            species: spec.name,
            site: site.name,
            category: site.category,
            siteElevationM: site.elevationM,
            x: site.cx,
            y: site.cy,
            z: site.cz,
            aglM: site.cy - (Number.isFinite(ground) ? ground : site.ground),
            members: site.members.length,
            inspecting: site.inspecting,
            camDistM: Math.hypot(site.cx - lastCamX, site.cz - lastCamZ),
            anchorDistM: Math.hypot(site.x - lastCamX, site.z - lastCamZ),
            drawn: mesh.count,
          });
          continue;
        }
        for (const bird of site.birds) {
          const ground = sampleGroundHeight(bird.x, bird.z);
          rows.push({
            species: spec.name,
            id: bird.id,
            x: bird.x,
            y: bird.y,
            z: bird.z,
            groundM: ground,
            aglM: bird.y - ground,
            mode: bird.mode ?? 'cruise',
            bankDeg: (bird.bank * 180) / Math.PI,
            speedMps: Math.hypot(bird.vx ?? 0, bird.vy ?? 0, bird.vz ?? 0),
            // A climbing turn is banked by its HORIZONTAL speed, not its airspeed:
            // reported separately so a test can predict the bank angle from the same
            // quantity the code uses rather than from one that includes the climb.
            groundSpeedMps: Math.hypot(bird.vx ?? 0, bird.vz ?? 0),
            radiusM: bird.radius ?? null,
            // The site, not the bird: a bird circling a 95 m thermal is far enough
            // from the ridge it is using that measuring the exposure under the BIRD
            // answers a different question (which is what the first version of
            // tools/test-birds.mjs accidentally did).
            siteX: site.x,
            siteZ: site.z,
            exposure: site.exposure ?? null,
            canopy: canopyAt(bird.x, bird.z),
            flap: bird.flap,
            camDistM: Math.hypot(bird.x - lastCamX, bird.z - lastCamZ),
            drawn: mesh.count,
          });
        }
      }
    }
    return rows;
  }

  // Dev aid, same purpose as wildlife.js's findNearest: a soaring eagle can be
  // kilometres away, and judging how it reads is something only a real browser can
  // do. Returns a point to stand at, not the bird itself - you want to be under it,
  // looking up.
  function findNearest(name, fromX, fromZ) {
    const entry = state.find((s) => s.spec.name === name);
    if (!entry) return null;
    const { spec } = entry;
    // Materialise sites out to a fixed 25 km before looking, not a multiple of the
    // draw distance: the whole point of a rare species is that the nearest one is
    // far, and searching 3x the draw distance found no bearded vulture at all. This
    // runs on a keypress in a dev build, so a few hundred cell tests are free.
    const reach = spec.kind === 'flock' ? null : Math.ceil(25000 / spec.cellM);
    if (reach != null) {
      const cx = Math.floor(fromX / spec.cellM);
      const cz = Math.floor(fromZ / spec.cellM);
      for (let iz = cz - reach; iz <= cz + reach; iz++) {
        for (let ix = cx - reach; ix <= cx + reach; ix++) {
          const key = `${ix}:${iz}`;
          if (!entry.sites.has(key)) {
            entry.sites.set(key, spec.kind === 'soar' ? makeSoarSite(spec, ix, iz) : makeCanopySite(spec, ix, iz));
          }
        }
      }
    } else {
      for (let i = 0; i < flockPois.length; i++) {
        const key = `poi:${i}`;
        if (!entry.sites.has(key)) entry.sites.set(key, makeFlockSite(spec, flockPois[i], i));
      }
    }

    let best = null;
    for (const site of entry.sites.values()) {
      if (!site) continue;
      const sx = spec.kind === 'flock' ? site.x : site.birds[0]?.x;
      const sz = spec.kind === 'flock' ? site.z : site.birds[0]?.z;
      if (sx == null) continue;
      const d = Math.hypot(sx - fromX, sz - fromZ);
      if (!best || d < best.distanceM) {
        best = {
          species: name,
          x: sx,
          z: sz,
          y: spec.kind === 'flock' ? site.cy : site.birds[0].y,
          distanceM: d,
          site: site.name ?? null,
        };
      }
    }
    return best;
  }

  return {
    object: group,
    update,
    snapshot,
    findNearest,
    species: SPECIES.map((s) => s.name),
    stats: {
      flockSites: flockPois.length,
      capacity: SPECIES.reduce((n, s) => n + s.capacity, 0),
      trianglesPerBird: Object.fromEntries(
        state.map(({ spec, mesh }) => [spec.name, mesh.geometry.index
          ? mesh.geometry.index.count / 3
          : mesh.geometry.attributes.position.count / 3]),
      ),
    },
  };
}
