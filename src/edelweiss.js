import * as THREE from 'three';
import { attachAtmo } from './atmosphere.js';
import { SNOW_LEVEL, snowCoverAt } from './snow.js';

// Edelweiss (2026-08-12) - the user's own ask, and their choice of how it should
// behave: "da trovare", something to find rather than only something to render.
//
// So this file is deliberately NOT built like src/groundcover.js. Grass is placed
// in the vertex shader because nothing needs to know where any single tuft is.
// A flower you can be told you are near is the opposite: the HUD and the geometry
// must agree about one specific position, and the only way to guarantee that is
// for ONE piece of code to decide it. That code is here, on the CPU, and both the
// instanced matrices and the distance readout are read from the same array.
//
// The alternative - a rarity hash in the shader plus a JS reimplementation for the
// HUD - is exactly the mistake src/snow.js documents and refuses: a chaotic hash
// cannot be reproduced across GLSL float32 and JS float64, so the two would agree
// nowhere in particular. src/wildlife.js already makes this choice for herds; this
// follows it.
//
// Deterministic, so a shared link really does lead to the same flower: the patch
// for a cell is a pure function of that cell's integer coordinates, computed the
// same way on every machine and every reload.
//
// HABITAT. Leontopodium nivale grows on open, stony, sunny alpine grassland,
// roughly 1,800-3,000 m. Every test below is against something this project
// already measures rather than something invented for the occasion: the elevation
// and slope come from the drawn terrain, the openness from the NDVI-derived cover
// mask (src/landcover.js) - low but not zero is exactly "stony grassland" - and
// the aspect from the same +Z-is-south convention the snowline uses.
//
// One honest limit, worth writing down rather than implying otherwise: in this
// park edelweiss is most at home on the calcschists of the Cogne and Valnontey
// side, and the Gran Paradiso massif itself is crystalline. Substrate is not in
// any dataset the viewer ships, so it is not in the habitat test. What is here is
// altitude, openness, slope and sun.

const CELL_M = 320; // candidate patch sites sit one per cell of this lattice
const SEARCH_CELLS = 2; // so a 5x5 neighbourhood of cells is considered
const PATCH_CHANCE = 0.17; // of cells that PASS the habitat test, this many hold a patch
// TIGHT, at the user's instruction - "i gruppi che siano formati da fiori molto
// vicini fra loro". It was 2.6 m, which is not a clump but a scattering you have to
// walk through: at 8 flowers over a 5 m disc the nearest neighbour is a metre away
// and nothing reads as a group. 0.3 m makes a cushion 30-60 cm across, which is
// what an edelweiss colony on a ledge actually looks like, and it means the whole
// patch is inside one glance instead of one walk.
const PATCH_RADIUS_M = 0.3;
const FLOWERS_MIN = 4;
const FLOWERS_MAX = 11;
const MAX_FLOWERS = 260; // the instanced buffer's ceiling; 25 cells cannot fill it

const ELEV_MIN_M = 1850;
const ELEV_MAX_M = 2980;
const COVER_MIN = 0.04; // some vegetation: bare scree grows nothing
const COVER_MAX = 0.62; // but not a closed pasture - this one likes stones between the turf
const SLOPE_MIN_DEG = 6; // flat valley bottoms are grazed and mown
const SLOPE_MAX_DEG = 44;
const ASPECT_MIN = -0.35; // ground normal z; +Z is South, so this rejects deep north faces only

// How close you have to come for a patch to count as found. Six metres is about
// where the rosettes stop being white specks and read as flowers.
const FOUND_RADIUS_M = 6;
// Beyond this the HUD says nothing at all. Deliberately larger than the patches
// are visible from: being told there is one 40 m away is the invitation to look.
const HINT_RADIUS_M = 90;

// Buried under settled snow. Uses snow.js's own CPU twin, so the flowers vanish
// under exactly the snow the ground is being drawn with.
const SNOW_HIDE = 0.45;

const ROSETTE_MIN_M = 0.026; // radius, so a flower is 5-8 cm across - life size
const ROSETTE_MAX_M = 0.041;
// The stem is a fixed multiple of the rosette rather than an independent draw, and
// that is a modelling decision as much as a technical one. Technically: the model
// is now one geometry carrying stem AND flower, and an InstancedMesh gives it a
// single uniform scale, so the two cannot vary independently without a second mesh
// or a custom attribute. Biologically: a bigger edelweiss IS a taller one, so the
// correlation is the truth rather than a compromise. 2.6 keeps the stem inside the
// 5-13 cm the two independent draws used to produce.
const STEM_PER_ROSETTE = 2.6;
// Albedo again, not appearance (see the warning in src/terrain.js). Edelweiss
// bracts are matte white and woolly, which is as bright as this rig can render -
// the same ceiling snow.js hits - and the disc florets are a dull yellow.
const BRACT_COLOR = 0xf7f4ea;
const DISC_COLOR = 0xd8c25c;

export { CELL_M, PATCH_CHANCE, ELEV_MIN_M, ELEV_MAX_M, COVER_MIN, COVER_MAX, FOUND_RADIUS_M, HINT_RADIUS_M };

// Deterministic per-cell randomness. Two integer cell indices in, a stream of
// draws out, identical on every machine - no float hashing, no sin().
function cellRandom(ix, iz) {
  let a = (Math.imul(ix | 0, 0x27d4eb2d) ^ Math.imul(iz | 0, 0x165667b1) ^ 0x9e3779b9) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A WHOLE PLANT, not a star (2026-08-13). The user looked at the eight-triangle
// rosette this replaces and said *"non va proprio bene... visto che sono poche
// devono essere dei bei modelli 3d senza preoccuparci dei poligoni. Che diano
// soddisfazione."*
//
// And they are right that the budget argument never applied here. Everything else
// in this project is shaped by a triangle count because it is scattered by the
// tens of thousands; an edelweiss is a RARITY - MAX_FLOWERS is 260 and a typical
// frame draws about 36. At ~220 triangles each that is 8k triangles on screen,
// against 458k for the grass and stones. The old shape was cheap for no reason.
//
// It was also, literally, a flower with no plant: the instance was placed at
// f.y + f.stem and the geometry was the rosette alone, so the stem existed as a
// number and was never drawn. The rosette floated at stem height. Now the origin
// is the FOOT, on the ground, and the model grows upward from it - which also puts
// the per-flower lean about the base, where a plant leans from, instead of about a
// point in mid-air.
//
// Leontopodium alpinum, built from what the plant actually is:
//
//   - a woolly stem, six-sided and tapering, with a slight lean built in so a
//     patch is not a set of parallel posts;
//   - narrow grey-green stem leaves, angled out and up;
//   - the star: BRACTS lanceolate bracts, widest a third of the way out, arching
//     up and then drooping past the horizontal at the tip. Not flat - a flat star
//     disappears edge-on, which is the one thing a flower you are hunting must
//     not do;
//   - and in the centre the thing the old shape had no room for at all: a CLUSTER
//     of separate capitula, the little yellow flower heads. That cluster is what
//     the eye reads as "edelweiss" at arm's length, and it is why the bracts start
//     at BRACT_INNER rather than at the axis.
//
// Unit space: the FOOT is the origin, +y is up, and one unit is the rosette's
// radius. The instance carries a single uniform scale, so the stem's length is a
// fixed multiple of the rosette (STEM_PER_ROSETTE) rather than an independent
// draw - which is also true of the plant: a bigger edelweiss is a taller one.
const BRACTS = 9;
const BRACT_INNER = 0.17; // where a bract starts, just outside the capitula
const CAPITULA = 7;
const STEM_SIDES = 6;
const STEM_LEAVES = 5;
// Grey-green, and woolly rather than glossy - the stem and leaves of an edelweiss
// are felted white-green, much paler than alpine turf.
const STEM_COLOR = 0x8d9270;
// The bract's base is greener and its blade whiter, which is the gradient that
// makes the star read as felt rather than as paper.
const BRACT_BASE_COLOR = 0xcfc9a8;

function edelweissGeometry() {
  const positions = [];
  const colors = [];
  const bract = new THREE.Color(BRACT_COLOR);
  const bractBase = new THREE.Color(BRACT_BASE_COLOR);
  const disc = new THREE.Color(DISC_COLOR);
  const stemCol = new THREE.Color(STEM_COLOR);
  const tri = (a, b, c, ca, cb, cc) => {
    positions.push(...a, ...b, ...c);
    colors.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b, cc.r, cc.g, cc.b);
  };
  // A quad as two triangles, corners in order.
  const quad = (a, b, c, d, ca, cb, cc, cd) => {
    tri(a, b, c, ca, cb, cc);
    tri(a, c, d, ca, cc, cd);
  };

  // The stem: three rings up to the head, leaning slightly along +x so a clump is
  // not a set of parallel posts. The lean is in the GEOMETRY rather than the
  // instance's tilt because the instance's yaw then points it somewhere different
  // for every flower, for free.
  const stemRing = (t) => {
    const y = t * STEM_PER_ROSETTE;
    const r = 0.085 * (1 - 0.45 * t);
    const lean = 0.16 * t * t; // curved, not slanted: it bends out as it rises
    return { y, r, lean };
  };
  const ringVerts = (t) => {
    const { y, r, lean } = stemRing(t);
    const out = [];
    for (let i = 0; i < STEM_SIDES; i++) {
      const a = (i / STEM_SIDES) * Math.PI * 2;
      out.push([Math.cos(a) * r + lean, y, Math.sin(a) * r]);
    }
    return out;
  };
  const rings = [ringVerts(0), ringVerts(0.5), ringVerts(1)];
  for (let s = 0; s < rings.length - 1; s++) {
    for (let i = 0; i < STEM_SIDES; i++) {
      const j = (i + 1) % STEM_SIDES;
      quad(rings[s][i], rings[s][j], rings[s + 1][j], rings[s + 1][i],
        stemCol, stemCol, stemCol, stemCol);
    }
  }
  const head = stemRing(1);

  // Stem leaves: narrow blades, out and up, spiralling by an irrational step so
  // they never line up with the bracts above them.
  for (let i = 0; i < STEM_LEAVES; i++) {
    const a = i * 2.39996; // golden angle
    const t = 0.18 + (i / STEM_LEAVES) * 0.55;
    const { y, lean } = stemRing(t);
    const dx = Math.cos(a);
    const dz = Math.sin(a);
    const len = 0.55 - t * 0.18;
    const base = [dx * 0.06 + lean, y, dz * 0.06];
    const wid = 0.055;
    const px = -dz * wid;
    const pz = dx * wid;
    const mid = [dx * len * 0.55 + lean, y + len * 0.35, dz * len * 0.55];
    const tip = [dx * len + lean, y + len * 0.30, dz * len];
    quad([base[0] + px, base[1], base[2] + pz], [base[0] - px, base[1], base[2] - pz],
      [mid[0] - px * 0.8, mid[1], mid[2] - pz * 0.8], [mid[0] + px * 0.8, mid[1], mid[2] + pz * 0.8],
      stemCol, stemCol, stemCol, stemCol);
    tri([mid[0] + px * 0.8, mid[1], mid[2] + pz * 0.8], [mid[0] - px * 0.8, mid[1], mid[2] - pz * 0.8], tip,
      stemCol, stemCol, stemCol);
  }

  // THE STAR. Each bract is a strip of three segments: widest a third out, arching
  // up and then drooping past the horizontal at the tip, so the star has relief
  // from every angle instead of vanishing edge-on.
  const T = [0, 0.35, 0.72, 1];
  const HALF = [0.11, 0.17, 0.11, 0];
  const RISE = [0.05, 0.11, 0.06, -0.07];
  for (let b = 0; b < BRACTS; b++) {
    // Not a clean 1/BRACTS step: a small alternating offset stops the star from
    // reading as a machined rosette.
    const a = ((b + (b % 2) * 0.12) / BRACTS) * Math.PI * 2;
    const dx = Math.cos(a);
    const dz = Math.sin(a);
    const px = -dz;
    const pz = dx;
    const at = (k) => {
      const r = BRACT_INNER + T[k] * (1 - BRACT_INNER);
      return { cx: dx * r + head.lean, cy: head.y + RISE[k], cz: dz * r, w: HALF[k] };
    };
    const side = (k, sgn) => {
      const p = at(k);
      return [p.cx + px * p.w * sgn, p.cy, p.cz + pz * p.w * sgn];
    };
    const colAt = (k) => (k === 0 ? bractBase : bract);
    for (let k = 0; k < 2; k++) {
      quad(side(k, 1), side(k, -1), side(k + 1, -1), side(k + 1, 1),
        colAt(k), colAt(k), colAt(k + 1), colAt(k + 1));
    }
    const p3 = at(3);
    tri(side(2, 1), side(2, -1), [p3.cx, p3.cy, p3.cz], bract, bract, bract);
  }

  // The capitula: separate little heads, one central and the rest ringed round it.
  // Icosahedra, because this is the one part of the plant that is genuinely round
  // and it is what the eye lands on first.
  const blob = new THREE.IcosahedronGeometry(1, 0);
  const blobPos = blob.attributes.position;
  for (let c = 0; c < CAPITULA; c++) {
    const central = c === 0;
    const a = ((c - 1) / (CAPITULA - 1)) * Math.PI * 2 + 0.4;
    const cr = central ? 0 : 0.135;
    const rad = central ? 0.085 : 0.07;
    const cx = Math.cos(a) * cr + head.lean;
    const cz = Math.sin(a) * cr;
    const cy = head.y + (central ? 0.115 : 0.095);
    for (let i = 0; i < blobPos.count; i += 3) {
      const v = (k) => [
        blobPos.getX(i + k) * rad + cx,
        blobPos.getY(i + k) * rad * 0.85 + cy,
        blobPos.getZ(i + k) * rad + cz,
      ];
      tri(v(0), v(1), v(2), disc, disc, disc);
    }
  }
  blob.dispose();

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createEdelweiss({ sampleGroundHeight, coverAt, iceAt = () => 0 }) {
  const geometry = edelweissGeometry();
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    metalness: 0,
    flatShading: true,
    // A rosette is a flat star: from below or edge-on it would otherwise be gone,
    // and "gone" is the one thing a flower you are hunting must not be.
    side: THREE.DoubleSide,
  });
  attachAtmo(material); // the same aerial-perspective fog as everything else

  const mesh = new THREE.InstancedMesh(geometry, material, MAX_FLOWERS);
  mesh.name = 'edelweiss';
  mesh.count = 0;
  mesh.frustumCulled = false; // the instances move with the camera's neighbourhood
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const patches = new Map(); // "ix:iz" -> patch, or null for "tested, nothing grows here"
  const found = new Set();
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scaleVec = new THREE.Vector3();
  const position = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  const SLOPE_PROBE_M = 8;
  function groundAt(x, z) {
    const h = sampleGroundHeight(x, z);
    if (!Number.isFinite(h)) return null;
    const hx = sampleGroundHeight(x + SLOPE_PROBE_M, z) - sampleGroundHeight(x - SLOPE_PROBE_M, z);
    const hz = sampleGroundHeight(x, z + SLOPE_PROBE_M) - sampleGroundHeight(x, z - SLOPE_PROBE_M);
    const dzdx = hx / (2 * SLOPE_PROBE_M);
    const dzdz = hz / (2 * SLOPE_PROBE_M);
    const grade = Math.hypot(dzdx, dzdz);
    // The ground normal, in the same convention snow.js uses: +Z is South, so a
    // normal with z < 0 faces north.
    const invLen = 1 / Math.sqrt(grade * grade + 1);
    return {
      elevM: h,
      slopeDeg: (Math.atan(grade) * 180) / Math.PI,
      normalZ: -dzdz * invLen,
    };
  }

  // The patch a cell holds, or null. Pure function of the cell indices, cached
  // because the habitat test costs five height samples.
  function patchFor(ix, iz) {
    const key = `${ix}:${iz}`;
    if (patches.has(key)) return patches.get(key);

    const random = cellRandom(ix, iz);
    // The rarity draw happens FIRST and unconditionally, so it consumes the same
    // number of draws whether or not the habitat passes - otherwise the stream
    // would shift and a cell's flowers would move when a neighbour's did.
    const chance = random();
    const ox = (ix + random()) * CELL_M;
    const oz = (iz + random()) * CELL_M;
    const spread = random();
    const howMany = FLOWERS_MIN + Math.floor(random() * (FLOWERS_MAX - FLOWERS_MIN + 1));

    let patch = null;
    if (chance < PATCH_CHANCE) {
      const g = groundAt(ox, oz);
      const cover = coverAt(ox, oz);
      // A glacier grows nothing, and the landcover mask does not say so: it is derived from
      // imagery that reads a bright bare surface on ice, which lands inside this layer's own
      // COVER_MIN..COVER_MAX window. 40 of the 80 glaciers reach into 1,850-2,980 m, so the
      // ice has to be asked directly (src/glaciermask.js, added 2026-08-19).
      const ice = iceAt(ox, oz);
      const ok =
        g !== null &&
        g.elevM >= ELEV_MIN_M &&
        g.elevM <= ELEV_MAX_M &&
        ice < 0.15 &&
        cover >= COVER_MIN &&
        cover <= COVER_MAX &&
        g.slopeDeg >= SLOPE_MIN_DEG &&
        g.slopeDeg <= SLOPE_MAX_DEG &&
        g.normalZ >= ASPECT_MIN;
      if (ok) {
        const flowers = [];
        for (let i = 0; i < howMany; i++) {
          const angle = random() * Math.PI * 2;
          const r = Math.sqrt(random()) * PATCH_RADIUS_M * (0.5 + spread * 0.5);
          const fx = ox + Math.cos(angle) * r;
          const fz = oz + Math.sin(angle) * r;
          const fy = sampleGroundHeight(fx, fz);
          if (!Number.isFinite(fy)) continue;
          const rosette = ROSETTE_MIN_M + random() * (ROSETTE_MAX_M - ROSETTE_MIN_M);
          flowers.push({
            x: fx,
            y: fy,
            z: fz,
            rosette,
            // Kept as a field because the HUD, the probe and the tests all read it,
            // but it is derived now - see STEM_PER_ROSETTE.
            stem: rosette * STEM_PER_ROSETTE,
            yaw: random() * Math.PI * 2,
            // A rosette faces the sky but not perfectly - a few degrees of lean
            // is what keeps a patch from looking stamped out.
            tiltX: (random() - 0.5) * 0.5,
            tiltZ: (random() - 0.5) * 0.5,
          });
        }
        if (flowers.length) {
          patch = { key, x: ox, z: oz, elevM: g.elevM, normalZ: g.normalZ, flowers };
        }
      }
    }
    patches.set(key, patch);
    return patch;
  }

  const diag = {
    /** Metres to the nearest patch within HINT_RADIUS_M, else null. */
    nearestM: null,
    /** Elevation of that patch, for the HUD. */
    nearestElevM: null,
    /** How many distinct patches have been come within FOUND_RADIUS_M of. */
    foundCount: 0,
    /** True on the frame a patch is first found, so main.js can react once. */
    justFound: false,
    /** Flowers currently drawn - the instanced draw count. */
    drawn: 0,
    /** Cells tested so far, i.e. how much of the cache is warm. */
    cellsTested: 0,
  };

  function update(camera) {
    const cx = camera.position.x;
    const cz = camera.position.z;
    const baseIx = Math.floor(cx / CELL_M);
    const baseIz = Math.floor(cz / CELL_M);

    let drawn = 0;
    let nearestSq = Infinity;
    let nearest = null;
    diag.justFound = false;

    for (let dz = -SEARCH_CELLS; dz <= SEARCH_CELLS; dz++) {
      for (let dx = -SEARCH_CELLS; dx <= SEARCH_CELLS; dx++) {
        const patch = patchFor(baseIx + dx, baseIz + dz);
        if (!patch) continue;

        // Under settled snow there is nothing to find. snowCoverAt() is snow.js's
        // own CPU twin of the shader, so this agrees with the white ground the
        // patch would otherwise be standing on.
        const buried = snowCoverAt({
          elevM: patch.elevM,
          aspectZ: patch.normalZ,
          level: SNOW_LEVEL.value,
        });
        if (buried > SNOW_HIDE) continue;

        const distSq = (patch.x - cx) ** 2 + (patch.z - cz) ** 2;
        if (distSq < nearestSq) {
          nearestSq = distSq;
          nearest = patch;
        }
        if (distSq < FOUND_RADIUS_M * FOUND_RADIUS_M && !found.has(patch.key)) {
          found.add(patch.key);
          diag.foundCount = found.size;
          diag.justFound = true;
        }

        for (const f of patch.flowers) {
          if (drawn >= MAX_FLOWERS) break;
          // THE FOOT, on the ground - not the rosette in mid-air, which is where
          // this used to place the instance because the stem was a number that
          // nothing drew. It also puts the lean below about the base, which is
          // where a plant leans from.
          position.set(f.x, f.y, f.z);
          // Yaw about up, then a small lean - built as a quaternion product
          // rather than Euler angles so the order is explicit.
          quaternion.setFromAxisAngle(up, f.yaw);
          const lean = new THREE.Quaternion().setFromEuler(new THREE.Euler(f.tiltX, 0, f.tiltZ));
          quaternion.multiply(lean);
          scaleVec.set(f.rosette, f.rosette, f.rosette);
          matrix.compose(position, quaternion, scaleVec);
          mesh.setMatrixAt(drawn, matrix);
          drawn++;
        }
      }
    }

    mesh.count = drawn;
    if (drawn) mesh.instanceMatrix.needsUpdate = true;
    diag.drawn = drawn;
    diag.cellsTested = patches.size;
    const nearestM = nearest ? Math.sqrt(nearestSq) : null;
    diag.nearestM = nearestM !== null && nearestM <= HINT_RADIUS_M ? nearestM : null;
    diag.nearestElevM = diag.nearestM !== null ? nearest.elevM : null;
  }

  return {
    object: mesh,
    update,
    diag,
    /** Exposed for tools/test-groundcover.mjs: the patch a cell holds, or null. */
    patchFor,
    /** Exposed for the dev handle, so a probe can walk to the nearest flower. */
    findNearestPatch(x, z, searchCells = 12) {
      let best = null;
      let bestSq = Infinity;
      const baseIx = Math.floor(x / CELL_M);
      const baseIz = Math.floor(z / CELL_M);
      for (let dz = -searchCells; dz <= searchCells; dz++) {
        for (let dx = -searchCells; dx <= searchCells; dx++) {
          const patch = patchFor(baseIx + dx, baseIz + dz);
          if (!patch) continue;
          const distSq = (patch.x - x) ** 2 + (patch.z - z) ** 2;
          if (distSq < bestSq) {
            bestSq = distSq;
            best = patch;
          }
        }
      }
      return best ? { ...best, distanceM: Math.sqrt(bestSq) } : null;
    },
  };
}
