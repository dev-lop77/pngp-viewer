// Phase 7, opened 2026-08-10. Two of its items have been carried since
// 2026-08-03 with an explicit "unknown whether it's noticeable in practice"
// against them (docs/PROGRESS.md open questions 3 and 4):
//
//   3. LOD popping is not smoothed - tiles change resolution abruptly.
//   4. Normals are sampled at a fixed one-texel spacing regardless of tile
//      depth, so distant coarse tiles get high-frequency normals. "Fog washes
//      distant terrain out, so this may not matter."
//
// Both are cheap to answer with a number and expensive to fix on spec, so this
// measures them before anything is built. Neither needs a GPU: the drawn surface
// is reconstructed analytically by sampleRenderedHeightfield() (guarded against
// three's own raycaster by tools/test-rendered-height.mjs), the shading follows
// terrain.js's own NORMALS chunk, and the distance a given depth is drawn at
// follows from its split rule.
//
// The unit that decides both questions is what reaches the EYE, not metres and
// not degrees: a 40 m pop 30 km away is invisible, and a normal that is 30 deg
// wrong on ground the fog has already whitened is invisible too. So the geometry
// pop is converted through the real camera (60 deg vertical FOV, reported at
// 900 px tall) and the normal error is converted into the brightness step it
// actually produces, both with the real linear fog applied.
//
// Two traps, both hit on the way to these numbers:
//   - a coarse cell is up to 1.3 km across, so testing the SAMPLE point for the
//     nodata sentinel is not enough - the interpolation reads the cell's corners,
//     which can sit in the gap even when the point does not. Every sample here is
//     rejected unless the corners it actually reads are real ground.
//   - "the normal disagrees with the drawn surface" is not what a viewer sees.
//     What they see is the brightness STEP when a tile subdivides, which needs
//     the normals interpolated across the triangle exactly as the varying is.
//
// Usage: node tools/dev/probe-lod.mjs

import { readFile } from 'node:fs/promises';
import {
  sampleHeightfield, sampleRenderedHeightfield, isNearNoData, decodeHeightfield,
} from '../../src/heightfield.js';

const SAMPLES = 20000;
const VIEWPORT_PX = 900;
const FOV_DEG = 60; // src/main.js
const FOG_NEAR = 20000; // src/main.js, THREE.Fog(0x9fc9e8, 20000, 140000)
const FOG_FAR = 140000;
const SUN_ELEVATION_DEG = 50; // a midday-ish sun, only to turn an angle into a brightness

const manifest = JSON.parse(await readFile('public/data/heightfield.json', 'utf8'));
const heights = decodeHeightfield(await readFile(`public/data/${manifest.file.name}`), manifest);

// Read the LOD settings out of terrain.js rather than restating them, so this
// cannot drift away from the thing it is measuring (same trick as
// tools/test-rendered-height.mjs).
const src = await readFile('src/terrain.js', 'utf8');
const TILE_SEGMENTS = Number(src.match(/TILE_SEGMENTS\s*=\s*(\d+)/)[1]);
const MAX_DEPTH = Number(src.match(/MAX_DEPTH\s*=\s*(\d+)/)[1]);
const SPLIT_FACTOR = Number(src.match(/SPLIT_FACTOR\s*=\s*([\d.]+)/)[1]);

const { xmin, ymin, xmax, ymax } = manifest.bboxCrsUnits;
const worldWidth = xmax - xmin;
const worldDepth = ymax - ymin;
const { x: resX, y: resY } = manifest.resolutionMPerPx;

const segmentsAt = (depth) => TILE_SEGMENTS * 2 ** depth;
// terrain.js: a node splits while the camera is within max(halfW,halfD)*2*SPLIT_FACTOR
// of its bounding box. halfW is the larger axis here, so the distance at which a
// depth-d tile is replaced by its children is worldWidth/2^d * SPLIT_FACTOR.
const splitDistanceM = (depth) => (worldWidth / 2 ** depth) * SPLIT_FACTOR;

const pxPerRadian = VIEWPORT_PX / (2 * Math.tan((FOV_DEG * Math.PI) / 360));
const toPixels = (metres, distanceM) => (metres / distanceM) * pxPerRadian;
// THREE.Fog is linear on distance: 0 = untouched, 1 = entirely fog colour. A
// brightness step survives to the eye in proportion to what is left of the
// terrain's own colour.
const fogAt = (d) => Math.min(1, Math.max(0, (d - FOG_NEAR) / (FOG_FAR - FOG_NEAR)));

const mulberry32 = (a) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const stats = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const at = (q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
  return {
    n: values.length,
    mean: values.reduce((s, v) => s + v, 0) / values.length,
    p50: at(0.5),
    p95: at(0.95),
    p99: at(0.99),
    max: sorted[sorted.length - 1],
  };
};

// ---- the drawn surface, and the shading on it ------------------------------

// The grid cell of a given depth containing (x,z), and the barycentric weights of
// the triangle within it - the same (a,b,d)/(b,c,d) split sampleRenderedHeightfield
// documents, so the three vertices here are the three the GPU interpolates between.
function cellAt(depth, x, z) {
  const segments = segmentsAt(depth);
  const cellW = worldWidth / segments;
  const cellD = worldDepth / segments;
  const gx = (x + worldWidth / 2) / cellW;
  const gz = (z + worldDepth / 2) / cellD;
  const ix = Math.min(Math.max(Math.floor(gx), 0), segments - 1);
  const iz = Math.min(Math.max(Math.floor(gz), 0), segments - 1);
  const u = Math.min(Math.max(gx - ix, 0), 1);
  const v = Math.min(Math.max(gz - iz, 0), 1);
  const x0 = ix * cellW - worldWidth / 2;
  const x1 = x0 + cellW;
  const z0 = iz * cellD - worldDepth / 2;
  const z1 = z0 + cellD;
  const corners = [[x0, z0], [x0, z1], [x1, z1], [x1, z0]];
  const tri = u + v <= 1
    ? [[[x0, z0], 1 - u - v], [[x0, z1], v], [[x1, z0], u]]
    : [[[x1, z1], u + v - 1], [[x0, z1], 1 - u], [[x1, z0], 1 - v]];
  return { corners, tri, cellW, cellD };
}

// terrain.js's NORMALS chunk: a central difference at ONE TEXEL of the height
// texture, whatever the tile's own cell size is.
function texelNormal(x, z) {
  const hW = sampleHeightfield(heights, manifest, x - resX, z);
  const hE = sampleHeightfield(heights, manifest, x + resX, z);
  const hN = sampleHeightfield(heights, manifest, x, z + resY);
  const hS = sampleHeightfield(heights, manifest, x, z - resY);
  const nx = (hW - hE) / (2 * resX);
  const nz = (hN - hS) / (2 * resY);
  const len = Math.hypot(nx, 1, nz);
  return [nx / len, 1 / len, nz / len];
}

// The same central difference at an arbitrary spacing - the counterfactual below
// needs it at the tile's own cell size rather than at one texel.
function normalAt(x, z, sx, sz) {
  const hW = sampleHeightfield(heights, manifest, x - sx, z);
  const hE = sampleHeightfield(heights, manifest, x + sx, z);
  const hN = sampleHeightfield(heights, manifest, x, z + sz);
  const hS = sampleHeightfield(heights, manifest, x, z - sz);
  const nx = (hW - hE) / (2 * sx);
  const nz = (hN - hS) / (2 * sz);
  const len = Math.hypot(nx, 1, nz);
  return [nx / len, 1 / len, nz / len];
}

// What the fragment shader receives: the three vertex normals interpolated across
// the triangle and normalised (terrain.js line ~241, `normalize( vTerrainNormal )`).
// `scaled` is the proposed change - evaluate the difference at the tile's own cell
// size instead of at one texel, so the shading describes the surface being drawn.
function shadedNormal(depth, x, z, scaled = false) {
  const { tri, cellW, cellD } = cellAt(depth, x, z);
  let nx = 0;
  let ny = 0;
  let nz = 0;
  for (const [[vx, vz], w] of tri) {
    const n = scaled
      ? normalAt(vx, vz, Math.max(resX, cellW), Math.max(resY, cellD))
      : texelNormal(vx, vz);
    nx += n[0] * w;
    ny += n[1] * w;
    nz += n[2] * w;
  }
  const len = Math.hypot(nx, ny, nz) || 1;
  return [nx / len, ny / len, nz / len];
}

const SUN = (() => {
  const el = (SUN_ELEVATION_DEG * Math.PI) / 180;
  return [0, Math.sin(el), Math.cos(el)];
})();
const lambert = (n) => Math.max(0, n[0] * SUN[0] + n[1] * SUN[1] + n[2] * SUN[2]);
const angleBetween = (a, b) => {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  return (Math.acos(dot) * 180) / Math.PI;
};

// A sample is only usable if the corners the interpolation actually READS are
// real ground - at depth 1 those are 1.3 km from the point.
const cornersClean = (depth, x, z) =>
  cellAt(depth, x, z).corners.every(([cx, cz]) => !isNearNoData(heights, manifest, cx, cz));

const random = mulberry32(20260810);
const points = [];
while (points.length < SAMPLES) {
  const x = (random() - 0.5) * worldWidth * 0.98;
  const z = (random() - 0.5) * worldDepth * 0.98;
  if (!isNearNoData(heights, manifest, x, z)) points.push([x, z]);
}

console.log(`Terrain: ${(worldWidth / 1000).toFixed(1)} x ${(worldDepth / 1000).toFixed(1)} km`
  + ` · tiles ${TILE_SEGMENTS} quads/edge · depths 0-${MAX_DEPTH} · split factor ${SPLIT_FACTOR}`);
console.log(`Camera: ${FOV_DEG} deg vertical FOV at ${VIEWPORT_PX} px -> ${pxPerRadian.toFixed(0)} px/rad`);
console.log(`Fog: linear ${FOG_NEAR / 1000}-${FOG_FAR / 1000} km · sun at ${SUN_ELEVATION_DEG} deg`);
console.log(`${SAMPLES} sample points on real ground, corner-checked per depth.\n`);

console.log('WHAT A SUBDIVISION DOES TO THE PICTURE');
console.log('  Two things change at once when a tile splits: the surface moves, and the');
console.log('  shading on it steps. Both are read at the distance the swap really happens.\n');
console.log('  swap   cells        distance   fog   surface moves        on screen    brightness step');
console.log('                                       p50      p95   max   p95   max    now      if scaled');

const rows = [];
for (let depth = 1; depth < MAX_DEPTH; depth++) {
  const coarse = segmentsAt(depth);
  const fine = segmentsAt(depth + 1);
  const usable = points.filter(([x, z]) => cornersClean(depth, x, z));
  const pops = [];
  const steps = [];
  const scaledSteps = [];
  for (const [x, z] of usable) {
    pops.push(Math.abs(
      sampleRenderedHeightfield(heights, manifest, coarse, coarse, x, z)
      - sampleRenderedHeightfield(heights, manifest, fine, fine, x, z),
    ));
    steps.push(Math.abs(lambert(shadedNormal(depth, x, z)) - lambert(shadedNormal(depth + 1, x, z))));
    scaledSteps.push(Math.abs(
      lambert(shadedNormal(depth, x, z, true)) - lambert(shadedNormal(depth + 1, x, z, true)),
    ));
  }
  const pop = stats(pops);
  const step = stats(steps);
  const scaled = stats(scaledSteps);
  const d = splitDistanceM(depth);
  const fog = fogAt(d);
  rows.push({ depth, d, pop, step, scaled, fog, px95: toPixels(pop.p95, d), pxMax: toPixels(pop.max, d) });
  console.log(`  ${depth}->${depth + 1}  ${(worldWidth / coarse).toFixed(0).padStart(4)}->`
    + `${(worldWidth / fine).toFixed(0).padStart(4)} m`
    + `  ${(d / 1000).toFixed(1).padStart(5)} km`
    + ` ${(fog * 100).toFixed(0).padStart(3)}%`
    + `  ${pop.p50.toFixed(1).padStart(5)} ${pop.p95.toFixed(1).padStart(6)} ${pop.max.toFixed(0).padStart(5)} m`
    + `  ${toPixels(pop.p95, d).toFixed(1).padStart(4)} ${toPixels(pop.max, d).toFixed(0).padStart(4)} px`
    + `  ${(step.p95 * 100).toFixed(1).padStart(5)}% ->`
    + ` ${(scaled.p95 * 100).toFixed(1).padStart(5)}%  (p95)`);
  if (usable.length < points.length) {
    console.log(`         (${points.length - usable.length} of ${points.length} samples dropped:`
      + ' a cell corner falls in the nodata gap)');
  }
}

const worstPop = rows.reduce((a, b) => (a.px95 > b.px95 ? a : b));
const worstStep = rows.reduce((a, b) => (a.step.p95 * (1 - a.fog) > b.step.p95 * (1 - b.fog) ? a : b));
console.log(`\n  Worst surface pop:  depth ${worstPop.depth}->${worstPop.depth + 1},`
  + ` ${worstPop.px95.toFixed(1)} px at p95 (${worstPop.pxMax.toFixed(0)} px worst point).`);
console.log(`  Worst brightness:   depth ${worstStep.depth}->${worstStep.depth + 1},`
  + ` ${(worstStep.step.p95 * 100).toFixed(1)}% at p95, of which`
  + ` ${(worstStep.step.p95 * (1 - worstStep.fog) * 100).toFixed(1)}% survives the fog.`);

console.log('\nAND WHAT THE SHADING CLAIMS THE SURFACE IS');
console.log('  The normal is a one-texel central difference wherever it is evaluated, so on a');
console.log('  coarse tile it describes a 20 m slope on ground drawn at up to 1.3 km. Angle');
console.log('  between that and the normal of the surface actually drawn at that depth.\n');
console.log('  depth  cell      drawn at    angle p50    p95     max    brightness p95   fog');

for (let depth = 1; depth <= MAX_DEPTH; depth++) {
  const { cellW, cellD } = cellAt(depth, 0, 0);
  const usable = points.filter(([x, z]) => cornersClean(depth, x, z));
  const angles = [];
  const shading = [];
  for (const [x, z] of usable) {
    const drawn = (() => {
      // The normal of the drawn surface: a central difference at the tile's OWN
      // cell size, which is what its triangles are made of.
      const hW = sampleHeightfield(heights, manifest, x - cellW, z);
      const hE = sampleHeightfield(heights, manifest, x + cellW, z);
      const hN = sampleHeightfield(heights, manifest, x, z + cellD);
      const hS = sampleHeightfield(heights, manifest, x, z - cellD);
      const nx = (hW - hE) / (2 * cellW);
      const nz = (hN - hS) / (2 * cellD);
      const len = Math.hypot(nx, 1, nz);
      return [nx / len, 1 / len, nz / len];
    })();
    const shaded = shadedNormal(depth, x, z);
    angles.push(angleBetween(shaded, drawn));
    shading.push(Math.abs(lambert(shaded) - lambert(drawn)));
  }
  const a = stats(angles);
  const sh = stats(shading);
  const drawnAt = splitDistanceM(depth);
  console.log(`  ${String(depth).padStart(5)}  ${cellW.toFixed(0).padStart(4)} m`
    + `  ${(drawnAt / 1000).toFixed(1).padStart(6)} km+`
    + `  ${a.p50.toFixed(1).padStart(6)} ${a.p95.toFixed(1).padStart(7)} ${a.max.toFixed(0).padStart(6)} deg`
    + `  ${(sh.p95 * 100).toFixed(1).padStart(9)}%`
    + `  ${(fogAt(drawnAt) * 100).toFixed(0).padStart(4)}%`);
}
