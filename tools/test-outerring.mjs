#!/usr/bin/env node
// The outer ring, checked against the two things it must never get wrong.
//
// It is not a rendering test - what the fade LOOKS like is a browser question
// and a taste question. It is a containment test, and the asymmetry is the
// point: fading too little leaves an ugly edge, while fading too much, or
// putting the walker's boundary in the wrong place, takes away part of the
// national park. One of those is a look, the other is a loss.
//
// So:
//   1. Nowhere a visitor can legitimately stand is faded, and nothing inside
//      the park boundary is behind the wall. Checked against every POI this
//      project ships and against the park polygon itself.
//   2. The ring really does dissolve, and the bbox edge really does too -
//      otherwise the whole change is inert and the test would still pass.
//
// Usage: node tools/test-outerring.mjs

import { readFileSync } from 'node:fs';
import proj4 from 'proj4';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import { readQuantisedMask } from './lib/mask-raster.mjs';
import { makeFadeAt, OUTER_RING_FADE_M, EDGE_FADE_M } from '../src/outerring.js';

const CRS = 'EPSG:23032';
proj4.defs(CRS, '+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs');

// Must match src/controls.js's BOUNDARY_FADE. Repeated rather than imported
// because controls.js pulls in three.js and a PointerLockControls addon, which
// a Node test has no business loading - so the one thing this duplicates is a
// single number, and this comment is what keeps them together.
const BOUNDARY_FADE = 0.5;

const manifest = JSON.parse(readFileSync('public/data/outerring.json', 'utf8'));
const { values: field, width, height } = readQuantisedMask(`public/data/${manifest.file.name}`);
if (width !== manifest.dimensions.width || height !== manifest.dimensions.height) {
  throw new Error(`decoded ${width}x${height}, manifest says ${manifest.dimensions.width}x${manifest.dimensions.height}`);
}
const { xmin, ymin, xmax, ymax } = manifest.bboxCrsUnits;
const worldWidth = xmax - xmin;
const worldDepth = ymax - ymin;
const fadeAt = makeFadeAt({
  field, width, height, worldWidth, worldDepth, maxDistanceM: manifest.encoding.maxDistanceM,
});

const originX = (xmin + xmax) / 2;
const originY = (ymin + ymax) / 2;
const toLocal = (lon, lat) => {
  const [e, n] = proj4('EPSG:4326', CRS, [lon, lat]);
  return { x: e - originX, z: originY - n };
};

const failures = [];
const check = (ok, message) => {
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${message}`);
  if (!ok) failures.push(message);
};

// ---- 1. nothing the project ships is behind the wall ----
const poi = JSON.parse(readFileSync('public/data/poi.json', 'utf8'));
const dz = poi.localOrigin.y - originY; // poi.json may still be in the old frame
let worstPoi = null;
let faded = 0;
for (const p of poi.pois) {
  const f = fadeAt(p.local.x, p.local.z - dz);
  if (f > 0) faded++;
  if (!worstPoi || f > worstPoi.f) worstPoi = { f, name: p.name, category: p.category };
}
console.log(`\n${poi.pois.length} POI, local origin offset ${dz} m in Z`);
check(worstPoi.f <= BOUNDARY_FADE,
  `no POI is behind the boundary (worst: ${worstPoi.name} [${worstPoi.category}] at fade ${worstPoi.f.toFixed(3)})`);
check(faded === 0, `no POI is faded at all (${faded} are)`);

// ---- 2. no part of the park is behind the wall ----
const park = JSON.parse(readFileSync('tools/park-boundary.geojson', 'utf8'));
let inPark = 0;
let parkFaded = 0;
let parkWalled = 0;
let worstPark = { f: 0, lon: 0, lat: 0 };
const STEP = 250; // metres
for (let e = xmin; e < xmax; e += STEP) {
  for (let n = ymin; n < ymax; n += STEP) {
    const [lon, lat] = proj4(CRS, 'EPSG:4326', [e, n]);
    if (!booleanPointInPolygon(point([lon, lat]), park)) continue;
    inPark++;
    const f = fadeAt(e - originX, originY - n);
    if (f > 0) parkFaded++;
    if (f > BOUNDARY_FADE) parkWalled++;
    if (f > worstPark.f) worstPark = { f, lon, lat };
  }
}
console.log(`\n${inPark} points sampled inside the park boundary at ${STEP} m`);
check(parkWalled === 0,
  `no park ground is behind the boundary (${parkWalled} points, worst fade ${worstPark.f.toFixed(3)} at ${worstPark.lat.toFixed(4)}, ${worstPark.lon.toFixed(4)})`);
check(parkFaded === 0, `no park ground is faded at all (${parkFaded} points)`);

// ---- 3. the fade is not inert ----
// Deep in the ring: well across the French frontier, west of Valgrisenche.
const france = toLocal(6.90, 45.55);
check(fadeAt(france.x, france.z) > 0.99,
  `ground across the frontier is fully dissolved (fade ${fadeAt(france.x, france.z).toFixed(3)})`);

// Each bbox edge, one metre inside it.
for (const [name, x, z] of [
  ['north', 0, -worldDepth / 2 + 1],
  ['south', 0, worldDepth / 2 - 1],
  ['east', worldWidth / 2 - 1, 0],
  ['west', -worldWidth / 2 + 1, 0],
]) {
  check(fadeAt(x, z) > 0.99, `the ${name} bbox edge is fully dissolved (fade ${fadeAt(x, z).toFixed(3)})`);
}

// And the fade has to be a ramp, not a step - that is the whole reason the
// field stores a distance rather than a flag. Walking north from the south edge
// the value must fall through the middle rather than jump.
const ramp = [];
for (let d = 0; d <= EDGE_FADE_M.value; d += EDGE_FADE_M.value / 8) {
  ramp.push(fadeAt(0, worldDepth / 2 - d));
}
const monotonic = ramp.every((v, i) => i === 0 || v <= ramp[i - 1] + 1e-9);
const intermediate = ramp.filter((v) => v > 0.05 && v < 0.95).length;
check(monotonic, `the south-edge fade falls monotonically inward (${ramp.map((v) => v.toFixed(2)).join(' ')})`);
check(intermediate >= 3, `the south-edge fade is a ramp, not a step (${intermediate} intermediate samples of ${ramp.length})`);

console.log(`\nring fade width ${OUTER_RING_FADE_M.value} m, edge fade width ${EDGE_FADE_M.value} m`);
if (failures.length) {
  console.error(`\n${failures.length} failed.`);
  process.exit(1);
}
console.log('\nAll outer-ring checks passed.');
