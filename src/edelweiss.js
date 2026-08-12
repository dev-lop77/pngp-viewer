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
const PATCH_RADIUS_M = 2.6;
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

const STEM_MIN_M = 0.05;
const STEM_MAX_M = 0.13;
const ROSETTE_MIN_M = 0.026; // radius, so a flower is 5-8 cm across - life size
const ROSETTE_MAX_M = 0.041;
const RAYS = 8;
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

// One rosette: RAYS bracts radiating from a raised centre, drooping at the tips,
// plus the disc as the centre vertex's own colour. Flat-shaded, vertex-coloured,
// eight triangles - small enough that a few hundred of them cost nothing, and
// three-dimensional enough that the star does not vanish edge-on.
function rosetteGeometry() {
  const positions = [];
  const colors = [];
  const bract = new THREE.Color(BRACT_COLOR);
  const disc = new THREE.Color(DISC_COLOR);
  for (let i = 0; i < RAYS; i++) {
    const a0 = (i / RAYS) * Math.PI * 2;
    const a1 = ((i + 0.55) / RAYS) * Math.PI * 2; // < one full step: bracts do not touch
    // Centre, raised; two tips, drooping outwards.
    positions.push(0, 0.012, 0);
    positions.push(Math.cos(a0), 0, Math.sin(a0));
    positions.push(Math.cos(a1), 0, Math.sin(a1));
    colors.push(disc.r, disc.g, disc.b);
    colors.push(bract.r, bract.g, bract.b);
    colors.push(bract.r, bract.g, bract.b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createEdelweiss({ sampleGroundHeight, coverAt }) {
  const geometry = rosetteGeometry();
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
      const ok =
        g !== null &&
        g.elevM >= ELEV_MIN_M &&
        g.elevM <= ELEV_MAX_M &&
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
          flowers.push({
            x: fx,
            y: fy,
            z: fz,
            stem: STEM_MIN_M + random() * (STEM_MAX_M - STEM_MIN_M),
            rosette: ROSETTE_MIN_M + random() * (ROSETTE_MAX_M - ROSETTE_MIN_M),
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
          position.set(f.x, f.y + f.stem, f.z);
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
