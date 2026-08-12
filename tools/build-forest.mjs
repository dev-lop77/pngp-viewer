#!/usr/bin/env node
// Step 2 of the forest-mask pipeline: turn tools/forest-draft.json into the
// shipped mask (phase 6 vegetation).
//
// The mask is deliberately laid out on EXACTLY the heightfield's grid - same
// dimensions, same bbox, same row order - so it needs no projection maths of its
// own at runtime and reuses terrainUv() unchanged in the shader. At 20.5 m per
// pixel it is also already finer than the tree spacing it drives.
//
// Holes: a relation's `inner` rings are rasterised together with its outer ones
// under the even-odd rule, which cancels them out automatically. That also means
// relation member ways need no stitching into closed rings - parity over the
// whole segment soup of one polygon gives the same answer, provided the rings
// close overall, which a valid multipolygon's do.
//
// Coverage, not a bit: each pixel stores how much of it is wooded, sampled at 4
// sub-rows with exact horizontal span coverage. Forest edges then come out soft,
// which lets the scatter thin out towards a margin instead of stopping at a
// visible straight line.
//
// Usage: node tools/build-forest.mjs   (after tools/fetch-forest.mjs)

import { readFileSync, writeFileSync } from 'node:fs';
import proj4 from 'proj4';
import { decodeHeightfield } from '../src/heightfield.js';
import { rasterisePolygons, writeQuantisedMask } from './lib/mask-raster.mjs';

const DRAFT = 'tools/forest-draft.json';
const OUT_DIR = 'public/data';
const SUB_ROWS = 4; // vertical supersampling
// Coverage is quantised before encoding purely to shrink the file: the soft
// edges are ~500k noisy 8-bit pixels that PNG cannot predict well. Measured on
// this dataset: 256 levels = 1756 kB, 32 = 1307, 16 = 1158, 8 = 935, 4 = 674.
// 16 is the chosen balance - the mask is bilinear-filtered and only drives a
// scatter probability, so it needs nothing like 256 levels, but 4 would make
// margins visibly steppy across a 20 m pixel.
const COVERAGE_LEVELS = 16;

proj4.defs('EPSG:23032', '+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs');

const draft = JSON.parse(readFileSync(DRAFT, 'utf8'));
const manifest = JSON.parse(readFileSync(`${OUT_DIR}/heightfield.json`, 'utf8'));
const { width, height } = manifest.dimensions;
const { xmin, ymin, xmax, ymax } = manifest.bboxCrsUnits;
const resX = (xmax - xmin) / width;
const resY = (ymax - ymin) / height;

console.log(`Rasterising ${draft.polygons.length} polygons into ${width}x${height} (${resX.toFixed(1)} m/px)`);

// lon/lat -> continuous pixel coordinates. Row 0 is the north edge, matching the
// heightfield's rowOrientation, so y grows southward.
function toPixel([lon, lat]) {
  const [e, n] = proj4('WGS84', 'EPSG:23032', [lon, lat]);
  return [(e - xmin) / resX, (ymax - n) / resY];
}

const coverage = new Float32Array(width * height);
// The scanline fill, the quantisation and the 4-bit PNG writer live in
// tools/lib/mask-raster.mjs since 2026-08-12, when tools/build-landcover.mjs needed
// exactly the same three things. The extraction was verified rather than assumed:
// tools/dev/verify-mask-raster.mjs rebuilds this mask through the shared code and
// compares it to the shipped PNG byte for byte.
const { skipped } = rasterisePolygons({ polygons: draft.polygons, width, height, toPixel, into: coverage, subRows: SUB_ROWS });

// Slope is baked in here rather than tested at runtime. Trees stop around
// 35-40 deg, and the alternative - four extra height-texture taps per vertex,
// times every instance, every frame - would pay repeatedly for something that
// never changes. It also keeps the mask consistent with the terrain shader,
// which independently turns steep ground to bare rock.
const SLOPE_FULL_DEG = 30; // full canopy up to here
const SLOPE_NONE_DEG = 45; // nothing above here
const heightBuf = readFileSync(`${OUT_DIR}/${manifest.file.name}`);
const heights = decodeHeightfield(heightBuf, manifest);
const { min: elevMin, max: elevMax } = manifest.elevationRangeM;
const elevAt = (px, py) => {
  const x = Math.min(width - 1, Math.max(0, px));
  const y = Math.min(height - 1, Math.max(0, py));
  return elevMin + (heights[y * width + x] / 65535) * (elevMax - elevMin);
};
const cosFull = Math.cos((SLOPE_FULL_DEG * Math.PI) / 180);
const cosNone = Math.cos((SLOPE_NONE_DEG * Math.PI) / 180);

let slopeRemoved = 0;
for (let py = 0; py < height; py++) {
  for (let px = 0; px < width; px++) {
    const i = py * width + px;
    const c = Math.min(1, coverage[i]); // polygons overlap; coverage is not additive beyond full
    if (c <= 0) {
      coverage[i] = 0;
      continue;
    }
    const dzdx = (elevAt(px + 1, py) - elevAt(px - 1, py)) / (2 * resX);
    const dzdy = (elevAt(px, py + 1) - elevAt(px, py - 1)) / (2 * resY);
    const normalY = 1 / Math.sqrt(dzdx * dzdx + dzdy * dzdy + 1);
    // Ascending clamp, mirroring the terrain shader's `bare` term.
    const keep = Math.min(1, Math.max(0, (normalY - cosNone) / (cosFull - cosNone)));
    if (keep < 1) slopeRemoved += c * (1 - keep);
    coverage[i] = c * keep;
  }
}

const written = writeQuantisedMask({
  dir: OUT_DIR,
  prefix: 'forest',
  width,
  height,
  values: coverage,
  levels: COVERAGE_LEVELS,
});
const { fileName, bytes: pngBytes, hash, fullPixels: wooded, partialPixels: partial } = written;

const forestManifest = {
  schemaVersion: 1,
  // Intentionally the heightfield's own grid - see the header. Anything reading
  // this mask can use the terrain's UVs directly.
  grid: 'identical to heightfield.json: same dimensions, bboxCrsUnits, resolution and row order',
  crs: manifest.crs,
  bboxCrsUnits: manifest.bboxCrsUnits,
  dimensions: manifest.dimensions,
  resolutionMPerPx: manifest.resolutionMPerPx,
  rowOrientation: manifest.rowOrientation,
  encoding: {
    channels: 1,
    depth: 8,
    meaning: 'fraction of the pixel covered by tree canopy, 0 = none, 255 = full',
    quantisedTo: `${COVERAGE_LEVELS} levels, stored at PNG sample depth 4 and scaled x17 on decode`,
  },
  coverage: {
    woodedPixels: wooded,
    partialPixels: partial,
    woodedFraction: Number((wooded / (width * height)).toFixed(4)),
    slopeLimit: `canopy attenuated from ${SLOPE_FULL_DEG} deg to zero at ${SLOPE_NONE_DEG} deg, baked in`,
    pixelsLostToSlope: Math.round(slopeRemoved),
  },
  file: { name: fileName, bytes: pngBytes, sha256Prefix: hash },
  source: {
    name: draft.source.name,
    attribution: draft.source.attribution,
    license: draft.source.license,
    licenseUrl: draft.source.licenseUrl,
    query: draft.source.query,
    modifications:
      'Derived product, not the original data: polygons were reprojected to EPSG:23032, ' +
      'rasterised to the heightfield grid under the even-odd rule (multipolygon holes removed), ' +
      'and stored as per-pixel canopy coverage.',
    fetchedAt: draft.generatedAt,
  },
  generatedBy: 'tools/build-forest.mjs',
  generatedAt: new Date().toISOString(),
};
writeFileSync(`${OUT_DIR}/forest.json`, `${JSON.stringify(forestManifest, null, 2)}\n`);

console.log(
  `\n${fileName}: ${(pngBytes / 1024).toFixed(0)} kB\n` +
    `wooded (>50%): ${wooded.toLocaleString()} px = ${((wooded / (width * height)) * 100).toFixed(1)}% of the bbox\n` +
    `edge pixels:   ${partial.toLocaleString()}\n` +
    `lost to slope: ${Math.round(slopeRemoved).toLocaleString()} px worth of canopy above ${SLOPE_FULL_DEG} deg\n` +
    (skipped ? `skipped ${skipped} polygons with no usable rings\n` : ''),
);
