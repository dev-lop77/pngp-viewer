import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { attachAtmo } from './atmosphere.js';
import { MODEL_DETAIL } from './modeldetail.js';

// The 51 rifugi and bivacchi as actual buildings, replacing the marker post that
// stood for them (src/poi.js). Procedural geometry authored here in JS, like every
// other model in this project (src/wildlife.js's MODEL_BUILDERS, vegetation.js's
// tieredTreeParts) - and, like those, judged at tools/dev/model-preview.html, which
// imports these builders rather than copying them.
//
// THE DATA SAYS THREE KINDS AND THE USER CHOSE TWO MODELS (2026-08-19). OSM's tag
// survives as `hutKind` on each POI: 23 `alpine_hut`, 21 `shelter:basic_hut`, 7
// `wilderness_hut`. A staffed rifugio is a building; both of the others are, on these
// mountains, the barrel-vaulted metal box - so they share the bivouac model and the
// wilderness huts differ only by being bigger. The kinds stay separate in the code
// (KIND_OF, KIND_SCALE) so that decision can be taken back without unpicking anything.
//
// Their other two decisions, same day:
//   - always drawn, with a simplified shape at distance. 51 buildings at a few
//     hundred triangles is nothing next to the glaciers' 563k, and a bivouac on a
//     far ridge is a real landmark.
//   - the building REPLACES the post, and the label stays. Since the buildings are
//     now always drawn, "replaces" has to mean "once it reads as a building", which
//     is NEAR_M below - beyond that the post is still the only thing you can see,
//     which is what the post is for.

// ---------------------------------------------------------------- the palette
//
// SOLVED, NOT PICKED (docs/ARCHITECTURE.md §13.2): three's Lambert BRDF divides by
// pi and ACES compresses what survives, so a plausible-looking hex renders nearly
// black under this rig. Every colour here came out of tools/dev/solve-albedo.mjs
// from the appearance wanted on screen, and the washed-out values are correct:
//
//   stone   #9b968e -> 0xc2bcb2      wood    #7a5a3f -> 0xa18063
//   slate   #4a4f55 -> 0x71767c      orange  #c25a1e -> 0xf67b34
//   render  #b9b3a8 -> 0xede2d0      dark    #2f3338 -> 0x575b61
const C = {
  stone: 0xc2bcb2,
  render: 0xede2d0, // the plastered upper floor
  slate: 0x71767c,
  wood: 0xa18063,
  // Added 2026-08-19 for the wood-and-stone hut and the bivouac's flag, same tool:
  //   dark board  #5a4231 -> 0x836a57     flag green  #0f8a45 -> 0x269649
  //   shingle     #47433f -> 0x6f6b67     flag white  unreachable, so pure white,
  //   pale timber #8c7a63 -> 0xb29e85     which lands at rgb(195,195,195) on screen
  //                                       flag red    #c4222c -> 0xf9544c
  board: 0x836a57,
  // A second stone, darker than the bivouac's pad: the pale one read as whitewash on a
  // 9.5 m wall (#857e73 -> 0xaaa296, solved the same way).
  wallStone: 0xaaa296,
  shingle: 0x6f6b67,
  timber: 0xb29e85,
  flagGreen: 0x269649,
  flagWhite: 0xffffff,
  flagRed: 0xf9544c,
  orange: 0xf67b34, // the bivouac's sheet metal - Apollonio orange, and the one
  // colour in this park that occurs nowhere in nature, which is the point of it
  dark: 0x575b61, // window openings and the barrel's end walls
};

// One primitive tagged with its colour, so a whole building is one draw call.
// Deliberately NOT src/wildlife.js's part(): that one also writes an `aLeg`
// attribute for the leg-swing shader, and a building does not walk. Sharing it
// would put two triangles' worth of dead attribute on every vertex here and tie
// this module to a gait.
function part(geom, color) {
  geom.deleteAttribute('uv');
  // NON-INDEXED, always. mergeGeometries refuses a mix of indexed and non-indexed
  // inputs, and roofSlopes()/gableEnds() below are non-indexed by construction (their
  // triangles are written out vertex by vertex) while every three primitive is indexed.
  // Expanding here rather than indexing those also suits the flat shading asked for:
  // each face owns its own vertices, so no normal is shared across an edge.
  const geometry = geom.index ? geom.toNonIndexed() : geom;
  const n = geometry.attributes.position.count;
  const colors = new Float32Array(n * 3);
  // ONE sRGB->linear conversion: three's ColorManagement does it in the Color
  // constructor and colour ATTRIBUTES are read as working space. Calling
  // convertSRGBToLinear() on top is the documented double-gamma trap (§13.3).
  const c = new THREE.Color(color);
  for (let i = 0; i < n; i += 1) {
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function box(w, h, d, x, y, z) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
}

// A gabled roof as two SOLID slabs, ridge along X, oversailing the walls on all four
// sides. Solid, and that is the fix for the defect the user reported twice:
//
//   "il tetto e' ancora staccato dalla struttura"
//
// The first version drew each slope as a zero-thickness plane. The material is
// FrontSide, so the underside of the overhang was not drawn AT ALL - standing below the
// eaves you looked straight through the roof, and the dark band that left between wall
// top and roof line is exactly what reads as a lid hovering over the building. A slab
// has an underside and a visible edge, which is what makes a roof look carried.
//
// 24 triangles for the pair, against 4. On a building of 118 that is worth it, and it
// is also the only part of this model the user has objected to twice.
function roofSlopes(w, d, eaveY, ridgeY, overhang = 0, thickness = 0.24) {
  const hw = w / 2 + overhang;
  const hd = d / 2 + overhang;
  const rise = ridgeY - eaveY;
  const run = hd;
  const slope = Math.hypot(run, rise);
  const angle = Math.atan2(rise, run);
  const parts = [];
  for (const sign of [1, -1]) {
    // A little longer than the slope so the two slabs meet through each other at the
    // ridge instead of leaving a V of daylight along the top of the building.
    const g = new THREE.BoxGeometry(hw * 2, thickness, slope + thickness);
    // THE SIGN HERE IS WORTH THE ARITHMETIC, because getting it wrong does not look
    // like a small error - the first version wrote rotateX(-angle) and the roof flew up
    // and away from the building like a wing.
    //
    // three's R_x(t) maps +Z to (0, -sin t, cos t). The box's long axis is +Z and it has
    // to lie along the RIDGE-to-EAVES direction, which on the +Z side is
    // (0, -rise, +run)/L - so cos t = run/L and sin t = rise/L, i.e. t = +angle. The
    // other slope is that same slab turned 180 deg about Y (the box is symmetric in X,
    // so nothing else changes).
    g.rotateX(angle);
    if (sign === -1) g.rotateY(Math.PI);
    // Centre it on the middle of the slope line, then push it out along that plane's own
    // outward normal - (0, cos angle, sin angle) - by half a thickness, so the slab sits
    // ON the eaves line instead of straddling it.
    const midZ = sign * run / 2;
    const midY = eaveY + rise / 2;
    g.translate(
      0,
      midY + Math.cos(angle) * thickness / 2,
      midZ + sign * Math.sin(angle) * thickness / 2,
    );
    parts.push(g);
  }
  return parts;
}

// The two triangles that close the ends, flush with the walls rather than out at the
// overhang - so they are the wall, and the roof oversails them.
function gableEnds(w, d, eaveY, ridgeY) {
  const hw = w / 2;
  const hd = d / 2;
  const v = [];
  const push = (...pts) => pts.forEach((pt) => v.push(...pt));
  push([-hw, eaveY, hd], [-hw, ridgeY, 0], [-hw, eaveY, -hd]);
  push([hw, eaveY, hd], [hw, eaveY, -hd], [hw, ridgeY, 0]);
  return fromVertices(v);
}

function fromVertices(v) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(v), 3));
  g.computeVertexNormals();
  return g;
}

// A window, a shutter pair or a door: a flat quad standing 4 cm off the wall it is
// on. Off the wall rather than inset, because an inset needs the wall to have a
// hole in it and a hole is either a lot of triangles or a texture - and this scene
// has no textures on any model. 4 cm is enough that no viewing angle z-fights.
function panel(w, h, x, y, z, faceZ = 1) {
  const g = new THREE.PlaneGeometry(w, h);
  if (faceZ === -1) g.rotateY(Math.PI);
  g.translate(x, y, z + 0.04 * faceZ);
  return g;
}

// The same thing on a wall that faces along X - the gable ends. It exists because the
// first gable window was written with panel() and therefore landed on the FACADE plane
// at a height where the facade has already stopped, so it hung in the air in front of
// the roof. The user found it from 15 m away: "una finestra e' posizionata nel nulla".
function panelX(w, h, x, y, z, faceX = 1) {
  const g = new THREE.PlaneGeometry(w, h);
  g.rotateY(faceX * Math.PI / 2);
  g.translate(x + 0.04 * faceX, y, z);
  return g;
}

// --------------------------------------------------------------- the buildings
//
// Every model is authored facing +Z, and +Z is planted DOWNHILL when it is placed
// (createHuts below), because that is where the door of a real refuge is: on the
// side you walk up from. So "the facade" and "the front" mean +Z throughout.

// A generic mountain hut in wood and stone, at the user's direction (2026-08-19):
// ***"Farei una cosa meno reale ma piu significativa, come un classico mountain hut
// in legno e pietra. Generico ma riconoscibile."*** So this is deliberately NOT a
// portrait of any of the 23 refuges it stands for - it is the shape everyone reads as
// a mountain hut: a stone ground floor, a dark timber storey above it, a steep gabled
// roof that oversails the walls, a gallery along the facade and a stone chimney.
//
// Smaller than the first attempt as well: 9.5 x 7 m rather than 13 x 8.5. A refuge
// that sleeps eighty is a BUILDING, and drawing one made every site look like a
// hamlet; a hut is a hut.
const RIFUGIO = { w: 9.5, d: 7, base: 2.7, upper: 2.5, rise: 3.4 };

function rifugio() {
  const { w, d, base, upper, rise } = RIFUGIO;
  const eave = base + upper;
  const ridge = eave + rise; // ~36 degrees, which is the pitch that reads as alpine
  const parts = [
    part(box(w, base, d, 0, base / 2, 0), C.wallStone),
    // The timber storey, inset by 5 cm so the stone below it reads as a plinth the
    // wood sits on rather than as the same box in two colours.
    part(box(w - 0.1, upper, d - 0.1, 0, base + upper / 2, 0), C.board),
    // Wall first, roof second: the gable is the wall carrying on up.
    part(gableEnds(w - 0.1, d - 0.1, eave, ridge), C.board),
    // THE WALL PLATE, and it is here because the user said "il tetto e' staccato" twice.
    // A beam running right round the building at the eaves line, in a paler timber than
    // the wall: it is what a roof actually lands ON, and it gives the eye the join. The
    // overhang came down to 0.28 m at the same time - from below, half a metre of
    // unlit soffit reads as a gap no matter how solid the slab above it is.
    part(box(w + 0.16, 0.26, d + 0.16, 0, eave - 0.13, 0), C.timber),
    ...roofSlopes(w, d, eave, ridge, 0.28).map((g) => part(g, C.shingle)),
    // And a fascia board along each eave, closing the slab's edge with something that
    // reads as a board rather than as a dark line.
    part(box(w + 0.56, 0.2, 0.12, 0, eave + 0.02, d / 2 + 0.28), C.timber),
    part(box(w + 0.56, 0.2, 0.12, 0, eave + 0.02, -(d / 2 + 0.28)), C.timber),
    // The chimney, on the ridge and off-centre: a hut has one flue, and it is where
    // the stove is, which is never the middle of the building.
    part(box(0.7, 1.8, 0.7, w * 0.3, ridge - 0.5, 0), C.stone),
    // The gallery under the eaves along the whole facade - the single most
    // recognisable thing about an alpine hut, and the reason the timber storey is
    // dark: a pale balcony against dark boards is what you actually see from below.
    part(box(w + 0.5, 0.18, 1.3, 0, base + 0.1, d / 2 + 0.5), C.timber),
    part(box(w + 0.5, 0.85, 0.14, 0, base + 0.62, d / 2 + 1.1), C.timber),
    // Two posts carrying the gallery, and the door under it.
    part(box(0.16, base, 0.16, -(w / 2 - 0.3), base / 2, d / 2 + 1.0), C.timber),
    part(box(0.16, base, 0.16, w / 2 - 0.3, base / 2, d / 2 + 1.0), C.timber),
    part(panel(1.05, 2.1, 0, 1.05, d / 2), C.dark),
  ];
  // Windows: one pair either side of the door on the stone floor, two above in the
  // timber, each of those with a shutter pair - the shutters are what make a small
  // dark opening read as a window rather than as a hole.
  for (const x of [-3.1, 3.1]) {
    parts.push(part(panel(0.8, 1.05, x, 1.5, d / 2), C.dark));
    parts.push(part(panel(0.8, 1.05, x, 1.5, -d / 2, -1), C.dark));
  }
  for (const x of [-2.4, 2.4]) {
    parts.push(part(panel(0.9, 1.0, x, base + 1.5, d / 2), C.dark));
    parts.push(part(panel(0.3, 1.0, x - 0.62, base + 1.5, d / 2 + 0.01), C.timber));
    parts.push(part(panel(0.3, 1.0, x + 0.62, base + 1.5, d / 2 + 0.01), C.timber));
    parts.push(part(panel(0.9, 1.0, x, base + 1.5, -d / 2, -1), C.dark));
  }
  // One window in each GABLE - on the gable's own wall, which faces along X, and low
  // enough in the triangle that the wall is still wider than the window there.
  for (const sign of [1, -1]) {
    parts.push(part(panelX(0.7, 0.8, sign * (w - 0.1) / 2, eave + 0.85, 0, sign), C.dark));
  }
  return parts;
}

// The distance shape: stone, timber, gable and roof - four primitives, twelve
// triangles, and the SAME silhouette, which is what matters when the swap happens
// 800 m away and the walker keeps approaching.
function rifugioFar() {
  const { w, d, base, upper, rise } = RIFUGIO;
  const eave = base + upper;
  const ridge = eave + rise;
  return [
    part(box(w, base, d, 0, base / 2, 0), C.wallStone),
    part(box(w - 0.1, upper, d - 0.1, 0, base + upper / 2, 0), C.board),
    part(gableEnds(w - 0.1, d - 0.1, eave, ridge), C.board),
    part(box(w + 0.16, 0.26, d + 0.16, 0, eave - 0.13, 0), C.timber),
    ...roofSlopes(w, d, eave, ridge, 0.28).map((g) => part(g, C.shingle)),
  ];
}

// The barrel-vaulted metal bivouac - the Apollonio type, which is what almost every
// one of these actually is. And it is NOT a half cylinder lying on the ground, which
// is what the first version of this drew and what made it read as a Nissen hut: the
// real thing is a small box with vertical sides and a vaulted roof over them, about
// 2 m to the crown, so a person can stand under the middle of it. The proportions
// here are that: 3.6 m along the axis, 2.6 m across, 0.75 m of wall, a 1.3 m radius
// vault on top.
const BIVOUAC = { len: 3.6, w: 2.6, wall: 0.75, r: 1.3, plinth: 0.22 };

function bivouac() {
  const { len, w, wall, r, plinth } = BIVOUAC;
  const springY = plinth + wall; // where the vault springs from the wall
  const vault = new THREE.CylinderGeometry(r, r, len, 10, 1, true, 0, Math.PI);
  // three's cylinder puts theta 0..PI on the +X side with the axis along Y, so:
  //   rotateZ(90 deg)  the half-shell becomes the UPPER half (open side down), axis -> X
  //   rotateY(90 deg)  the axis swings from X to Z, the direction you walk up from
  // Rotating about X for the second step (the first version here) swings the open
  // side sideways instead and leaves the axis on X.
  vault.rotateZ(Math.PI / 2);
  vault.rotateY(Math.PI / 2);
  vault.translate(0, springY, 0);
  const parts = [
    part(box(w + 0.2, plinth, len + 0.2, 0, plinth / 2, 0), C.stone), // the pad it is bolted to
    part(box(w, wall, len, 0, plinth + wall / 2, 0), C.orange),
    part(vault, C.orange),
  ];
  // The two tympana that close the vault, as half discs. ORANGE, not dark: they are
  // the same sheet as the rest of the shell, and drawing them dark made the whole
  // front of the hut read as a cave mouth when the camera stood at the door - which
  // is the one place a walker actually meets one of these.
  for (const [z, sign] of [[len / 2, 1], [-len / 2, -1]]) {
    // A CircleGeometry with thetaLength PI is already the UPPER half disc, in the XY
    // plane facing +Z - exactly the shape of the vault's end. Only the back one turns.
    const cap = new THREE.CircleGeometry(r, 10, 0, Math.PI);
    if (sign === -1) cap.rotateY(Math.PI);
    cap.translate(0, springY, z);
    parts.push(part(cap, C.orange));
  }
  // The door, on the downhill end, tall enough to cross the wall and reach into the
  // vault above it - which is how these are built, because the wall alone is 0.75 m.
  // Beside it the plate: every one of these huts carries the name of the person it
  // commemorates on exactly such a plate, and it is the one light detail on an
  // otherwise single-coloured object.
  parts.push(part(panel(0.7, 1.55, 0, plinth + 0.8, len / 2), C.dark));
  parts.push(part(panel(0.34, 0.22, 0.62, plinth + 1.25, len / 2), C.render));
  return parts;
}

// At distance: the pad, the box, the vault at six facets, and the tympana kept so the
// silhouette stays closed. The ribs, the door and the plate go - not because of their
// triangles, which are nothing, but because a 4 cm-proud panel on a building 3 pixels
// wide is z-fighting and aliasing, and that is what the LOD is really for here.
function bivouacFar() {
  const { len, w, wall, r, plinth } = BIVOUAC;
  const springY = plinth + wall;
  const vault = new THREE.CylinderGeometry(r, r, len, 6, 1, true, 0, Math.PI);
  vault.rotateZ(Math.PI / 2);
  vault.rotateY(Math.PI / 2);
  vault.translate(0, springY, 0);
  const parts = [
    part(box(w + 0.2, plinth, len + 0.2, 0, plinth / 2, 0), C.stone),
    part(box(w, wall, len, 0, plinth + wall / 2, 0), C.orange),
    part(vault, C.orange),
  ];
  for (const [z, sign] of [[len / 2, 1], [-len / 2, -1]]) {
    const cap = new THREE.CircleGeometry(r, 6, 0, Math.PI);
    if (sign === -1) cap.rotateY(Math.PI);
    cap.translate(0, springY, z);
    parts.push(part(cap, C.orange));
  }
  return parts;
}

// The high-detail bivouac, drawn when the Models control is High. The user's own
// addition, 2026-08-19: ***"nella versione hi res aggiungi la bandiera italiana."***
//
// A mast beside the door rather than a tricolour painted on the shell, for two
// reasons: painted bands on a curved orange vault read as stripes of rust at any
// distance, and a flag on a pole is the thing you actually see from below when one of
// these appears on a col. Green-white-red left to right seen from the front, which is
// the side the door and the path are on.
function bivouacHi() {
  const { len, w, plinth } = BIVOUAC;
  const parts = bivouac();
  const mastX = w / 2 + 0.45;
  const topY = 2.75;
  parts.push(part(box(0.09, topY - plinth, 0.09, mastX, plinth + (topY - plinth) / 2, len / 2 - 0.3), C.timber));
  const bands = [C.flagGreen, C.flagWhite, C.flagRed];
  bands.forEach((colour, i) => {
    parts.push(part(
      panel(0.36, 0.72, mastX + 0.18 + i * 0.36, topY - 0.42, len / 2 - 0.3),
      colour,
    ));
  });
  return parts;
}

export const HUT_BUILDERS = { rifugio, bivouac };
// Models: High. Only the bivouac differs today - the flag is the whole difference, and
// the refuge is a shape decision rather than a detail one, so it gets no second tier
// until there is something worth adding to it.
export const HI_HUT_BUILDERS = { rifugio, bivouac: bivouacHi };
export const HUT_FAR_BUILDERS = { rifugio: rifugioFar, bivouac: bivouacFar };

// OSM's tag -> which of the two models, and how big. wilderness_hut takes the same
// barrel at 1.3x: unstaffed but real huts, and bigger than a two-bunk bivouac.
// The plan each kind's TERRACE covers, which is not the building's own footprint: the
// hut's gallery projects 1.3 m downhill on posts, and those posts have to land on
// something. The first version sized the terrace on the walls alone, so on any slope the
// gallery hung over the drop - the user saw it immediately: "i pali frontali non
// arrivano a terra". The drop is measured over THIS plan too, or the terrace would
// reach the ground under the walls and stop short under the posts.
export const FOOTPRINT = {
  rifugio: { w: 10.2, d: 10.2 },
  bivouac: { w: 3.1, d: 4.1 },
};

export const KIND_OF = {
  alpine_hut: 'rifugio',
  wilderness_hut: 'bivouac',
  'shelter:basic_hut': 'bivouac',
};
export const KIND_SCALE = { alpine_hut: 1, wilderness_hut: 1.3, 'shelter:basic_hut': 1 };

// Within this distance the full model is drawn and poi.js drops the marker post.
// Outside it, the eight-triangle silhouette and the post both stand.
export const NEAR_M = 800;
// How far the camera may move before the near/far split is recomputed. 51 buildings
// is a trivial pass, so this is not a saving worth much - it is here so the pass
// happens on a movement threshold like vegetation.js's near-tree refill rather than
// on every frame, and so the number is written down instead of implied.
const REFILL_M = 30;

// The footprint corners are sampled to decide TWO things a single centre height
// cannot: how much the building has to be lifted so no corner sinks into the rock,
// and how deep the foundation under it has to be so the downhill side is not left
// standing in the air. Real refuges are built on exactly such a terrace.
function seat(sampleHeight, x, z, w, d, yaw) {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  let lo = Infinity;
  let hi = -Infinity;
  for (const [ox, oz] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) {
    const h = sampleHeight(x + ox * cos + oz * sin, z - ox * sin + oz * cos);
    if (!Number.isFinite(h)) continue;
    lo = Math.min(lo, h);
    hi = Math.max(hi, h);
  }
  if (!Number.isFinite(lo)) {
    const h = sampleHeight(x, z) ?? 0;
    return { y: h, drop: 0.5 };
  }
  // Seat on the HIGHEST corner, so nothing is buried, and bridge the drop plus half
  // a metre so the foundation is planted rather than resting exactly on the surface.
  return { y: hi, drop: hi - lo + 0.5 };
}

// Which way is downhill, so the door faces the way you arrive. Sampled at 12 m,
// which is the building's own scale: at 2 m it reads the local noise of the mesh
// and at 100 m it reads the valley instead of the site.
function downhillYaw(sampleHeight, x, z) {
  const R = 12;
  const hx = (sampleHeight(x + R, z) ?? 0) - (sampleHeight(x - R, z) ?? 0);
  const hz = (sampleHeight(x, z + R) ?? 0) - (sampleHeight(x, z - R) ?? 0);
  if (Math.abs(hx) < 1e-3 && Math.abs(hz) < 1e-3) return 0; // flat: leave it square to the world
  // atan2 of the DOWNHILL direction (-gradient), and the model faces +Z.
  return Math.atan2(-hx, -hz);
}

// pois: the hut entries from public/data/poi.json (category === 'hut').
// sampleHeight: terrain.sampleRenderedHeight - the DRAWN surface, never elevationM,
// which is the POI's real altitude and sits tens of metres off the mesh on steep
// ground (§13.9 and poi.js's own comment).
export function createHuts({ pois, sampleHeight }) {
  const group = new THREE.Group();
  group.name = 'huts';

  const placements = pois.map((poi) => {
    const kind = KIND_OF[poi.hutKind] ?? 'bivouac';
    const scale = KIND_SCALE[poi.hutKind] ?? 1;
    const { x, z } = poi.local;
    const yaw = downhillYaw(sampleHeight, x, z);
    const foot = FOOTPRINT[kind];
    const { y, drop } = seat(sampleHeight, x, z, foot.w * scale, foot.d * scale, yaw);
    return { poi, kind, scale, x, z, y, yaw, drop };
  });

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    metalness: 0,
    // Flat shading, like the trees and the animals: every part here is a primitive
    // with real edges, and a smoothed normal across a wall/roof corner reads as a
    // dent. It also keeps the barrel's ten facets visible as facets, which is what
    // corrugated sheet actually looks like.
    flatShading: true,
  });
  attachAtmo(material); // the phase-4 aerial perspective, same as every other model

  function meshFor(name, builders, kind, capacity) {
    const merged = BufferGeometryUtils.mergeGeometries(builders[kind]());
    const mesh = new THREE.InstancedMesh(merged, material, Math.max(capacity, 1));
    mesh.name = `huts-${name}`;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.count = 0;
    // The geometry's bounds describe one building at the origin, so three would
    // cull against the wrong volume entirely - same call, same reason, as
    // wildlife.js and vegetation.js.
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    group.add(mesh);
    return mesh;
  }

  const counts = { rifugio: 0, bivouac: 0 };
  for (const p of placements) counts[p.kind] += 1;
  // Three meshes per kind, and the high one only where the builder actually differs:
  // today that is the bivouac's flag alone, so the refuge would otherwise carry a
  // second identical copy of itself for nothing. Built at startup like wildlife.js's
  // two levels, so the Models control is a choice of WHICH MESH an instance is written
  // into rather than a rebuild - it can be flipped without a hitch.
  const meshes = {};
  for (const kind of ['rifugio', 'bivouac']) {
    meshes[kind] = {
      near: meshFor(kind, HUT_BUILDERS, kind, counts[kind]),
      nearHi: HI_HUT_BUILDERS[kind] === HUT_BUILDERS[kind]
        ? null
        : meshFor(`${kind}-hi`, HI_HUT_BUILDERS, kind, counts[kind]),
      far: meshFor(`${kind}-far`, HUT_FAR_BUILDERS, kind, counts[kind]),
    };
  }

  // The terrace under the buildings: one box per building, scaled in Y per instance
  // to bridge its own corner drop. Its own mesh because that scale is per instance
  // and the building above it must NOT stretch with it.
  const foundation = new THREE.InstancedMesh(
    part(new THREE.BoxGeometry(1, 1, 1).translate(0, -0.5, 0), C.stone),
    material,
    placements.length,
  );
  foundation.name = 'huts-foundation';
  foundation.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  foundation.count = 0;
  foundation.frustumCulled = false;
  group.add(foundation);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const near = new Set(); // poi ids whose full model is drawn - poi.js reads this
  let lastX = Infinity;
  let lastZ = Infinity;

  const LEVELS = ['near', 'nearHi', 'far'];
  function refill(camera) {
    const idx = {
      rifugio: { near: 0, nearHi: 0, far: 0 },
      bivouac: { near: 0, nearHi: 0, far: 0 },
    };
    let nFound = 0;
    near.clear();
    // Which near mesh the Models control is asking for. Read here, once per refill,
    // rather than per placement: MODEL_DETAIL is a holder another module writes
    // (src/modeldetail.js) and a refill has to be internally consistent or one hut
    // would end up written into both meshes.
    const hi = MODEL_DETAIL.value === 1;
    for (const p of placements) {
      const dist = Math.hypot(p.x - camera.position.x, p.z - camera.position.z);
      const wantHi = hi && meshes[p.kind].nearHi !== null;
      const level = dist > NEAR_M ? 'far' : (wantHi ? 'nearHi' : 'near');
      q.setFromAxisAngle(up, p.yaw);
      pos.set(p.x, p.y, p.z);
      scl.setScalar(p.scale);
      m.compose(pos, q, scl);
      const mesh = meshes[p.kind][level];
      mesh.setMatrixAt(idx[p.kind][level], m);
      idx[p.kind][level] += 1;
      if (level !== 'far') {
        near.add(p.poi.id);
        // The terrace, only where the full model is: at 800 m it is a strip of
        // stone under a building eight triangles wide and worth nothing.
        // The terrace is exactly the plan in FOOTPRINT - no ad-hoc padding. It was
        // 1.2 m wider than the walls once, and under a bivouac that pale block was
        // bigger than the hut and read as the thing you had come to see.
        const foot = FOOTPRINT[p.kind];
        scl.set(foot.w * p.scale, p.drop, foot.d * p.scale);
        m.compose(pos, q, scl);
        foundation.setMatrixAt(nFound, m);
        nFound += 1;
      }
    }
    for (const kind of ['rifugio', 'bivouac']) {
      for (const level of LEVELS) {
        const mesh = meshes[kind][level];
        if (!mesh) continue;
        mesh.count = idx[kind][level];
        mesh.instanceMatrix.needsUpdate = true;
      }
    }
    foundation.count = nFound;
    foundation.instanceMatrix.needsUpdate = true;
  }

  let lastCamera = null;
  function update(camera) {
    lastCamera = camera;
    const moved = Math.hypot(camera.position.x - lastX, camera.position.z - lastZ);
    if (moved < REFILL_M) return;
    lastX = camera.position.x;
    lastZ = camera.position.z;
    refill(camera);
  }

  // The Models control flipped. Without this the change would wait for the camera to
  // walk REFILL_M, which reads as a control that does nothing - the same trap
  // vegetation.js's applyDetail() exists for.
  function applyDetail() {
    if (lastCamera) refill(lastCamera);
  }

  // Seat everything again on the surface as it is drawn NOW. Registered with main.js's
  // reseatOnDrawnSurface(), and not optional: the height tier arrives after the first
  // frame and moves the drawn surface by up to 44 m (measured at Le Pont, and the
  // trails and POI markers were left floating by exactly this before it was fixed).
  // A building is worse than a floating marker - it would be buried or on stilts.
  //
  // The yaw is recomputed too, because the gradient of the finer surface is not the
  // gradient of the coarse one, and the door of a hut facing across a slope instead of
  // down it is visible from a long way off.
  function alignToGround(heightAt) {
    for (const p of placements) {
      p.yaw = downhillYaw(heightAt, p.x, p.z);
      const foot = FOOTPRINT[p.kind];
      const seated = seat(heightAt, p.x, p.z, foot.w * p.scale, foot.d * p.scale, p.yaw);
      p.y = seated.y;
      p.drop = seated.drop;
    }
    if (lastCamera) refill(lastCamera);
  }

  return {
    group,
    update,
    applyDetail,
    alignToGround,
    // For poi.js: is this hut standing in front of you as a building? Its post is
    // dropped when it is, and kept when it is not.
    hasBuilding: (poi) => near.has(poi.id),
    placements,
    // Every geometry here is non-indexed (see part()), so this is the real triangle
    // count and not an index-count guess.
    triangles: Object.fromEntries(
      [['rifugio', meshes.rifugio.near], ['rifugioFar', meshes.rifugio.far],
        ['bivouac', meshes.bivouac.near], ['bivouacHi', meshes.bivouac.nearHi],
        ['bivouacFar', meshes.bivouac.far], ['foundation', foundation]]
        .filter(([, mesh]) => mesh)
        .map(([k, mesh]) => [k, mesh.geometry.attributes.position.count / 3]),
    ),
  };
}
