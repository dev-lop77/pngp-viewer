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
const STEP = 200; // sampling grid, meters - fine enough for a % estimate

proj4.defs('EPSG:23032', '+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs');
const boundary = JSON.parse(readFileSync('tools/park-boundary.geojson', 'utf8'));

// The raster's own dimensions, read from the file instead of derived from a
// resolution constant that "must match merge-heightmaps.sh's RES_M". That
// coupling rots silently the moment the mosaic is rebuilt at another
// resolution: the indices below would address the wrong pixels and this gate
// would report a confident percentage about nothing. Derived, it cannot
// disagree with the file it is checking.
const info = JSON.parse(execSync(`gdalinfo -json "${TIF}"`, { encoding: 'utf8', maxBuffer: 1 << 26 }));
const [W, H] = info.size;
// Per axis, because they are not the same number: the bbox is 83884 x 48225 m
// and the raster is a whole number of pixels, so at 5 m/px the x resolution is
// 4.99994 and the y resolution is exactly 5. Using the x one for row indices
// was harmless at 10 m and is not at 5 m.
const RESX = (XMAX - XMIN) / W;
const RESY = (YMAX - YMIN) / H;
console.log(`raster ${W} x ${H} px, ${RESX.toFixed(5)} x ${RESY.toFixed(5)} m/px`);

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
    // The loop samples the CLOSED south and west edges (y starts at YMIN), and a
    // point exactly on the south edge belongs to the last row, not to a row past
    // it. Without the clamp, floor((YMAX-YMIN)/RESY) === H whenever the bbox
    // height is a whole number of pixels: at 10 m that is 4822.5 -> 4822, in
    // range and invisible, and at 5 m it is exactly 9645 -> out of range. That
    // one off-by-one reported 163 sample points along the park's southern edge
    // as having no elevation data - 1.1% of the park, all of it data that is
    // there - and it failed the merge. An index out of range is not evidence of
    // missing data, so it is no longer counted as such.
    const col = Math.min(W - 1, Math.floor((x - XMIN) / RESX));
    const row = Math.min(H - 1, Math.floor((YMAX - y) / RESY));
    if (col < 0 || row < 0) throw new Error(`sample (${x}, ${y}) is outside the raster - wrong bbox arguments?`);
    if (arr[row * W + col] === -9999) nodataInPark++;
  }
}

const pct = (100 * nodataInPark) / totalInPark;
console.log(`Sampled ${totalInPark} points inside the real park boundary.`);
console.log(`Still nodata after merge: ${nodataInPark} (${pct.toFixed(3)}%)`);
writeFileSync('/tmp/check-park-coverage-result.json', JSON.stringify({ totalInPark, nodataInPark, pct }));
