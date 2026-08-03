// Correctness test for src/heightfield.js's sampleRenderedHeightfield().
//
// That function claims to reproduce, analytically, the exact surface the
// terrain draws - which the camera clamp, the POI marker lines, the fly-to
// landing and the label occlusion test all depend on (docs/PROGRESS.md
// 2026-08-03). It encodes two assumptions about three's PlaneGeometry-style
// grid that are worth testing rather than trusting: the world position of grid
// vertex (ix,iz), and the (a,b,d)/(b,c,d) quad triangulation.
//
// So this checks it against a genuinely independent path: build the real
// geometry of a max-depth LOD tile, displace its vertices on the CPU exactly
// as the vertex shader does, and let three's own Raycaster report the surface
// height. Agreement means the analytic version is right; it is not a
// reimplementation of itself.
//
// (Raycasting is only valid here because this script displaces the CPU
// geometry itself. Against the live app it would read the *undisplaced*
// grid - see docs/PROGRESS.md - which is exactly why the app needs an
// analytic height query in the first place.)
//
// Usage: node tools/test-rendered-height.mjs

import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { sampleHeightfield, sampleRenderedHeightfield } from '../src/heightfield.js';

const SAMPLES = 4000;
const EYE_HEIGHT_M = 1.7; // must match src/controls.js
const TOLERANCE_M = 0.05; // float32 vertex storage + raycast arithmetic, not algorithmic slack

const manifest = JSON.parse(await readFile('public/data/heightfield.json', 'utf8'));
const heights = new Uint16Array((await readFile(`public/data/${manifest.file.name}`)).buffer);

// Read the LOD settings out of terrain.js's source rather than hardcoding
// them, so this test can't silently drift away from the app it's testing.
const terrainSrc = await readFile('src/terrain.js', 'utf8');
const tileSegments = Number(terrainSrc.match(/TILE_SEGMENTS\s*=\s*(\d+)/)[1]);
const maxDepth = Number(terrainSrc.match(/MAX_DEPTH\s*=\s*(\d+)/)[1]);
const finestSegments = tileSegments * 2 ** maxDepth;

const { xmin, ymin, xmax, ymax } = manifest.bboxCrsUnits;
const worldWidth = xmax - xmin;
const worldDepth = ymax - ymin;
const cellW = worldWidth / finestSegments;
const cellD = worldDepth / finestSegments;

console.log(`heightfield ${manifest.dimensions.width}x${manifest.dimensions.height} @ ` +
  `${manifest.resolutionMPerPx.x.toFixed(2)} m/px`);
console.log(`LOD: ${tileSegments} segments/tile, max depth ${maxDepth} -> finest cell ` +
  `${cellW.toFixed(2)}x${cellD.toFixed(2)} m`);

// One max-depth tile, positioned over real terrain (the Gran Paradiso area).
// Its grid aligns with the global finest grid by construction: a tile spans
// exactly tileSegments cells of it.
const tileW = worldWidth / 2 ** maxDepth;
const tileD = worldDepth / 2 ** maxDepth;
const tileIx = Math.floor((finestSegments / 2 - 20) / tileSegments); // just west of centre
const tileIz = Math.floor((finestSegments / 2 + 30) / tileSegments);
const tileCx = (tileIx + 0.5) * tileW - worldWidth / 2;
const tileCz = (tileIz + 0.5) * tileD - worldDepth / 2;
console.log(`test tile ${tileW.toFixed(0)}x${tileD.toFixed(0)} m centred at ` +
  `(${tileCx.toFixed(0)}, ${tileCz.toFixed(0)})`);

const geometry = new THREE.PlaneGeometry(tileW, tileD, tileSegments, tileSegments);
geometry.rotateX(-Math.PI / 2);
geometry.translate(tileCx, 0, tileCz);
const position = geometry.getAttribute('position');
for (let i = 0; i < position.count; i++) {
  position.setY(i, sampleHeightfield(heights, manifest, position.getX(i), position.getZ(i)));
}
position.needsUpdate = true;
geometry.computeBoundingSphere();

const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
mesh.updateMatrixWorld();

const raycaster = new THREE.Raycaster();
const down = new THREE.Vector3(0, -1, 0);
const origin = new THREE.Vector3();

// Seeded LCG - a failure should be reproducible, not a different random set.
let seed = 20260803;
const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

let maxErr = 0, sumErr = 0, checked = 0, missed = 0, worst = null;
let maxGap = 0, sumGap = 0, cameraWouldSink = 0;

for (let s = 0; s < SAMPLES; s++) {
  // Inset by one cell: outside the last row/column there is no quad to
  // interpolate, and both the mesh and the sampler clamp there.
  const x = tileCx + (rand() - 0.5) * (tileW - 2 * cellW);
  const z = tileCz + (rand() - 0.5) * (tileD - 2 * cellD);

  origin.set(x, 20000, z); // above the 4811.7 m max elevation
  raycaster.set(origin, down);
  const hit = raycaster.intersectObject(mesh, false)[0];
  if (!hit) { missed++; continue; }

  const analytic = sampleRenderedHeightfield(heights, manifest, finestSegments, finestSegments, x, z);
  const err = Math.abs(hit.point.y - analytic);
  checked++;
  sumErr += err;
  if (err > maxErr) { maxErr = err; worst = { x, z, raycast: hit.point.y, analytic }; }

  const bilinear = sampleHeightfield(heights, manifest, x, z);
  const gap = Math.abs(analytic - bilinear);
  sumGap += gap;
  if (gap > maxGap) maxGap = gap;
  if (bilinear + EYE_HEIGHT_M < analytic) cameraWouldSink++;
}

console.log(`\nchecked ${checked}/${SAMPLES} points (${missed} rays missed)`);
console.log(`analytic vs three's Raycaster: mean |err| ${(sumErr / checked).toFixed(4)} m, ` +
  `max ${maxErr.toFixed(4)} m`);
if (worst) {
  console.log(`  worst at (${worst.x.toFixed(1)}, ${worst.z.toFixed(1)}): ` +
    `raycast ${worst.raycast.toFixed(3)} m vs analytic ${worst.analytic.toFixed(3)} m`);
}

console.log(`\ndrawn surface vs true bilinear heightfield (was mean 29.2 m / max 3104.9 m at 328 m quads):`);
console.log(`  mean ${(sumGap / checked).toFixed(2)} m, max ${maxGap.toFixed(2)} m`);
console.log(`  ${cameraWouldSink} of ${checked} points (${(100 * cameraWouldSink / checked).toFixed(1)}%) ` +
  `would put a ${EYE_HEIGHT_M} m eye below the drawn surface`);

if (missed > 0 || maxErr > TOLERANCE_M) {
  console.error(`\nFAIL: max error ${maxErr.toFixed(4)} m exceeds ${TOLERANCE_M} m tolerance` +
    (missed ? ` (and ${missed} rays missed the mesh)` : ''));
  process.exit(1);
}
console.log(`\nPASS: analytic height matches the drawn geometry within ${TOLERANCE_M} m`);
