#!/usr/bin/env node
// Checks what fraction of the REAL park boundary (not the oversized DEM
// bbox, which deliberately extends toward Mont Blanc/France - a UE5-era
// artifact, see docs/ARCHITECTURE.md §3) still has no real elevation data
// in a merged heightmap GeoTIFF. Used by merge-heightmaps.sh as the real
// hard gate - checking the whole bbox's nodata percentage instead would
// always show a residual ~12% gap on the France side that no Italian DEM
// source can fill and that doesn't matter (it's outside the park, mostly
// outside Italy), so failing on that would block forever on an
// unfixable, irrelevant number.
//
// Usage: node check-park-coverage.mjs <merged.tif> <xmin> <ymin> <xmax> <ymax>

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import proj4 from 'proj4';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';

const [, , TIF, xminArg, yminArg, xmaxArg, ymaxArg] = process.argv;
const XMIN = Number(xminArg);
const YMIN = Number(yminArg);
const XMAX = Number(xmaxArg);
const YMAX = Number(ymaxArg);
const RES = 10; // must match merge-heightmaps.sh's RES_M
const STEP = 200; // sampling grid, meters - fine enough for a % estimate

proj4.defs('EPSG:23032', '+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs');
const boundary = JSON.parse(readFileSync('tools/park-boundary.geojson', 'utf8'));

const W = Math.round((XMAX - XMIN) / RES);
const H = Math.round((YMAX - YMIN) / RES);

const RAW = '/tmp/check-park-coverage-raw.bin';
execSync(`gdal_translate -q -ot Float32 -of ENVI "${TIF}" "${RAW}"`);
const buf = readFileSync(RAW);
const arr = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);

let totalInPark = 0;
let nodataInPark = 0;
for (let x = XMIN; x < XMAX; x += STEP) {
  for (let y = YMIN; y < YMAX; y += STEP) {
    const [lon, lat] = proj4('EPSG:23032', 'WGS84', [x, y]);
    if (!booleanPointInPolygon(point([lon, lat]), boundary)) continue;
    totalInPark++;
    const col = Math.floor((x - XMIN) / RES);
    const row = Math.floor((YMAX - y) / RES);
    if (col < 0 || col >= W || row < 0 || row >= H || arr[row * W + col] === -9999) nodataInPark++;
  }
}

const pct = (100 * nodataInPark) / totalInPark;
console.log(`Sampled ${totalInPark} points inside the real park boundary.`);
console.log(`Still nodata after merge: ${nodataInPark} (${pct.toFixed(3)}%)`);
writeFileSync('/tmp/check-park-coverage-result.json', JSON.stringify({ totalInPark, nodataInPark, pct }));
