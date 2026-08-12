#!/usr/bin/env node
// Proves that tools/lib/mask-raster.mjs is a faithful extraction of the
// rasteriser that was inline in tools/build-forest.mjs: it rebuilds the forest
// mask through the shared code and compares the result to the PNG that is
// actually shipped, byte for byte.
//
// Written because "I only moved the code" is exactly the claim that is easy to
// believe and cheap to check. Run it after touching the shared rasteriser.
//
// Usage: node tools/dev/verify-mask-raster.mjs

import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import proj4 from 'proj4';
import { decodeHeightfield } from '../../src/heightfield.js';
import { rasterisePolygons, writeQuantisedMask } from '../lib/mask-raster.mjs';

const SHIPPED = JSON.parse(readFileSync('public/data/forest.json', 'utf8'));
const draft = JSON.parse(readFileSync('tools/forest-draft.json', 'utf8'));
const manifest = JSON.parse(readFileSync('public/data/heightfield.json', 'utf8'));

// The constants build-forest.mjs used for the shipped file.
const SUB_ROWS = 4;
const COVERAGE_LEVELS = 16;
const SLOPE_FULL_DEG = 30;
const SLOPE_NONE_DEG = 45;

proj4.defs('EPSG:23032', '+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs');

const { width, height } = manifest.dimensions;
const { xmin, ymax } = manifest.bboxCrsUnits;
const resX = (manifest.bboxCrsUnits.xmax - xmin) / width;
const resY = (ymax - manifest.bboxCrsUnits.ymin) / height;
const toPixel = ([lon, lat]) => {
  const [e, n] = proj4('WGS84', 'EPSG:23032', [lon, lat]);
  return [(e - xmin) / resX, (ymax - n) / resY];
};

const coverage = new Float32Array(width * height);
rasterisePolygons({ polygons: draft.polygons, width, height, toPixel, into: coverage, subRows: SUB_ROWS });

const heights = decodeHeightfield(readFileSync(`public/data/${manifest.file.name}`), manifest);
const { min: elevMin, max: elevMax } = manifest.elevationRangeM;
const elevAt = (px, py) => {
  const x = Math.min(width - 1, Math.max(0, px));
  const y = Math.min(height - 1, Math.max(0, py));
  return elevMin + (heights[y * width + x] / 65535) * (elevMax - elevMin);
};
const cosFull = Math.cos((SLOPE_FULL_DEG * Math.PI) / 180);
const cosNone = Math.cos((SLOPE_NONE_DEG * Math.PI) / 180);
for (let py = 0; py < height; py++) {
  for (let px = 0; px < width; px++) {
    const i = py * width + px;
    const c = Math.min(1, coverage[i]);
    if (c <= 0) {
      coverage[i] = 0;
      continue;
    }
    const dzdx = (elevAt(px + 1, py) - elevAt(px - 1, py)) / (2 * resX);
    const dzdy = (elevAt(px, py + 1) - elevAt(px, py - 1)) / (2 * resY);
    const normalY = 1 / Math.sqrt(dzdx * dzdx + dzdy * dzdy + 1);
    coverage[i] = c * Math.min(1, Math.max(0, (normalY - cosNone) / (cosFull - cosNone)));
  }
}

// Into a scratch directory, so this can never delete or replace the shipped mask.
const dir = mkdtempSync(`${tmpdir()}/pngp-mask-`);
try {
  const written = writeQuantisedMask({
    dir,
    prefix: 'forest',
    width,
    height,
    values: coverage,
    levels: COVERAGE_LEVELS,
  });
  const rebuilt = readFileSync(`${dir}/${written.fileName}`);
  const shipped = readFileSync(`public/data/${SHIPPED.file.name}`);
  const rebuiltHash = createHash('sha256').update(rebuilt).digest('hex');
  const shippedHash = createHash('sha256').update(shipped).digest('hex');

  console.log(`shipped  ${SHIPPED.file.name}  ${shipped.byteLength.toLocaleString()} bytes  ${shippedHash.slice(0, 16)}`);
  console.log(`rebuilt  ${written.fileName}  ${rebuilt.byteLength.toLocaleString()} bytes  ${rebuiltHash.slice(0, 16)}`);
  console.log(`covered pixels: manifest ${SHIPPED.coverage.woodedPixels.toLocaleString()}, rebuilt ${written.fullPixels.toLocaleString()}`);

  if (rebuiltHash !== shippedHash) {
    console.error('\nFAIL: the shared rasteriser does not reproduce the shipped forest mask.');
    process.exit(1);
  }
  console.log('\nPASS: byte-identical - tools/lib/mask-raster.mjs reproduces the shipped forest mask exactly.');
} finally {
  rmSync(dir, { recursive: true, force: true });
}
