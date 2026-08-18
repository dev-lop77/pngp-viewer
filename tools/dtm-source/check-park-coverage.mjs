#!/usr/bin/env node
// Checks what fraction of the REAL park boundary (not the oversized DEM
// bbox, which deliberately extends toward Mont Blanc/France - a UE5-era
// artifact, see docs/ARCHITECTURE.md §3) still has no real elevation data
// in a merged heightmap GeoTIFF. Used by merge-heightmaps.sh as the real
// hard gate - checking the whole bbox's nodata percentage instead would
// always show a residual gap on the France side that no Italian DEM
// source can fill and that doesn't matter (it's outside the park, mostly
// outside Italy), so failing on that would block forever on an
// unfixable, irrelevant number.
//
// TWO WAYS FOR THE PARK TO HAVE NO ELEVATION, and until 2026-08-18 this only
// looked for one of them. It sampled `for (x = XMIN; x < XMAX)` - the RASTER's
// extent - and asked of each cell whether it was nodata. So the question it
// answered was "are the pixels I have valid", and it answered it correctly:
// 0.007%. The question it could not ask, because the loop never visited a
// point the raster did not contain, was "do I have all the park's pixels" -
// and the honest answer that day was no. 129.3 km2, 18.2% of the park's 710,
// lay south of YMIN and had no pixel at all: the whole Valle dell'Orco toward
// Ceresole and Noasca, part of Val Soana. A check whose sampling grid is the
// thing being checked cannot report that the thing is too small.
//
// So the grid is the PARK's extent now, and a sample that lands outside the
// raster is counted - separately, because "no data at this pixel" and "no
// pixel here at all" have different causes and different fixes. Both fail the
// gate.
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

// The park's own extent, in the raster's CRS - the sampling grid, and
// deliberately not the raster's. Derived from the polygon rather than written
// down, so it follows the boundary file if that is ever re-fetched.
let parkXMin = Infinity; let parkYMin = Infinity;
let parkXMax = -Infinity; let parkYMax = -Infinity;
(function scan(node) {
  if (Array.isArray(node)) {
    if (node.length === 2 && typeof node[0] === 'number' && typeof node[1] === 'number') {
      const [e, n] = proj4('WGS84', 'EPSG:23032', node);
      parkXMin = Math.min(parkXMin, e); parkXMax = Math.max(parkXMax, e);
      parkYMin = Math.min(parkYMin, n); parkYMax = Math.max(parkYMax, n);
      return;
    }
    node.forEach(scan);
    return;
  }
  if (node && typeof node === 'object') Object.values(node).forEach(scan);
}(boundary));
console.log(`park extent E ${parkXMin.toFixed(0)}-${parkXMax.toFixed(0)} `
  + `N ${parkYMin.toFixed(0)}-${parkYMax.toFixed(0)}; raster E ${XMIN}-${XMAX} N ${YMIN}-${YMAX}`);

let totalInPark = 0;
let nodataInPark = 0;
let outsideRaster = 0;
for (let x = parkXMin; x < parkXMax; x += STEP) {
  for (let y = parkYMin; y < parkYMax; y += STEP) {
    const [lon, lat] = proj4('EPSG:23032', 'WGS84', [x, y]);
    if (!booleanPointInPolygon(point([lon, lat]), boundary)) continue;
    totalInPark++;
    // Not "nodata": no cell exists here to hold data. Counted apart, because the
    // fix is to move the bbox, not to find another elevation source.
    if (x < XMIN || x >= XMAX || y < YMIN || y >= YMAX) { outsideRaster++; continue; }
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

const nodataPct = (100 * nodataInPark) / totalInPark;
const outsidePct = (100 * outsideRaster) / totalInPark;
// One number for the gate, because either way the park has no elevation there.
const pct = nodataPct + outsidePct;
const km2 = (n) => ((n * STEP * STEP) / 1e6).toFixed(1);
console.log(`Sampled ${totalInPark} points inside the real park boundary (${km2(totalInPark)} km2).`);
console.log(`  no pixel at all (park is outside the raster): ${outsideRaster} (${outsidePct.toFixed(3)}%, ${km2(outsideRaster)} km2)`);
console.log(`  pixel exists but is nodata after merge:       ${nodataInPark} (${nodataPct.toFixed(3)}%, ${km2(nodataInPark)} km2)`);
console.log(`  uncovered park, total:                        ${pct.toFixed(3)}%`);
writeFileSync('/tmp/check-park-coverage-result.json', JSON.stringify({
  totalInPark, nodataInPark, outsideRaster, nodataPct, outsidePct, pct,
}));
