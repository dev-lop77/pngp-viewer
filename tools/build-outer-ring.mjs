#!/usr/bin/env node
// The outer-ring field: how far each cell lies BEYOND the edge of the park's
// own survey data, in metres.
//
// WHY IT HAS TO BE SHIPPED AND CANNOT BE DERIVED. Everything else about a cell
// is legible from the heightfield - slope, altitude, aspect - but not where its
// number came from, and provenance is exactly the question here. Only
// tools/dtm-source/merge-heightmaps.sh still knows: it is holding four aligned
// layers when it composites them, and the answer is which of the four won. One
// step later there is a single elevation per cell and no way back.
//
// WHY A DISTANCE AND NOT A FLAG, which is what this shipped first. A flag is a
// step function: the frontier is one cell wide, so fading on it would replace a
// hard edge at the bbox with a hard edge at the border - the same defect moved
// 20 km west. What the fade needs is room, and room is a distance. Measured
// outward from the last cell that has local data, so the shader can dissolve
// the ground over kilometres and the crest can sink into haze the way a real
// one does.
//
// WHAT READS IT. src/terrain.js fades the ground out across this band instead
// of ending it on a straight line at the bbox, and src/controls.js keeps the
// walker inside the part of the map that is real. Both want the same field, so
// it ships once.
//
// Deliberately COARSER than the heightfield, by DOWNSCALE below. The value
// drives a smooth fade over kilometres and a soft boundary the walker meets
// head-on; neither can resolve 20 m, and it is sampled with bilinear filtering
// like every other mask here, so the reduction shows up as a slightly softer
// frontier and nowhere else.
//
// Usage: node tools/build-outer-ring.mjs
//   Input:  DEM/outer_ring.png  (8-bit, native merge grid, 255 = global-only)
//           written by tools/dtm-source/merge-heightmaps.sh
//   Output: public/data/outerring.<hash>.png + outerring.json

import { readFileSync, writeFileSync } from 'node:fs';
import { decode } from 'fast-png';
import { writeQuantisedMask } from './lib/mask-raster.mjs';

const SRC_PNG = 'DEM/outer_ring.png';
const HEIGHTFIELD_MANIFEST = 'public/data/heightfield.json';
const OUT_DIR = 'public/data';
const DOWNSCALE = 2; // relative to the heightfield grid
// Where the stored distance saturates. Past this the ground is fully dissolved,
// so measuring further would spend the field's 16 levels on cells that all look
// the same. 8 km is comfortably more than the widest fade src/terrain.js is
// likely to want, and leaves ~530 m per level - which bilinear filtering
// between 41 m cells turns into a ramp with no visible step.
const MAX_DISTANCE_M = 8000;

const hf = JSON.parse(readFileSync(HEIGHTFIELD_MANIFEST, 'utf8'));
const dstW = Math.round(hf.dimensions.width / DOWNSCALE);
const dstH = Math.round(hf.dimensions.height / DOWNSCALE);
const { xmin, ymin, xmax, ymax } = hf.bboxCrsUnits;
const resX = (xmax - xmin) / dstW;
const resY = (ymax - ymin) / dstH;

const src = decode(readFileSync(SRC_PNG));
if (src.channels !== 1) throw new Error(`${SRC_PNG}: expected 1 channel, got ${src.channels}`);
if (src.depth !== 8) throw new Error(`${SRC_PNG}: expected 8-bit, got depth ${src.depth}`);
console.log(`source ${src.width} x ${src.height} -> ${dstW} x ${dstH} (${resX.toFixed(1)} x ${resY.toFixed(1)} m/px)`);

// Area average at an arbitrary ratio - the one thing lib/mask-raster.mjs does
// not already have, because its downsampleCoverage() takes an integer factor
// and 16777/2048 is not one. Averaging is the correct reduction for a coverage
// fraction; picking a representative pixel would make the frontier stepped.
// Kept here rather than pushed into the shared module until something else
// needs it, which is how mask-raster.mjs itself came to exist.
function areaAverage(values, srcW, srcH, outW, outH) {
  const out = new Float32Array(outW * outH);
  const xScale = srcW / outW;
  const yScale = srcH / outH;
  for (let dy = 0; dy < outH; dy++) {
    const y0 = Math.floor(dy * yScale);
    const y1 = Math.min(srcH, Math.max(y0 + 1, Math.floor((dy + 1) * yScale)));
    for (let dx = 0; dx < outW; dx++) {
      const x0 = Math.floor(dx * xScale);
      const x1 = Math.min(srcW, Math.max(x0 + 1, Math.floor((dx + 1) * xScale)));
      let sum = 0;
      let n = 0;
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) { sum += values[sy * srcW + sx]; n++; }
      }
      out[dy * outW + dx] = n ? sum / (n * 255) : 0;
    }
  }
  return out;
}

// Two-pass chamfer distance transform, in metres, from every ring cell to the
// nearest local-data cell. Chamfer rather than an exact Euclidean transform
// because the error is a couple of per cent on the diagonals and this drives a
// haze ramp: 2% of a fade is not a thing anyone can see, and the exact
// algorithm is several times the code. The cell is not square (resX != resY),
// so the step costs are real distances rather than 1 and sqrt(2).
function distanceFromLocalData(ring, w, h) {
  const INF = 1e9;
  const dist = new Float32Array(w * h);
  for (let i = 0; i < dist.length; i++) dist[i] = ring[i] > 0.5 ? INF : 0;

  const dx = resX;
  const dy = resY;
  const dd = Math.hypot(resX, resY);
  const relax = (i, from, cost) => {
    const v = dist[from] + cost;
    if (v < dist[i]) dist[i] = v;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (dist[i] === 0) continue;
      if (x > 0) relax(i, i - 1, dx);
      if (y > 0) relax(i, i - w, dy);
      if (x > 0 && y > 0) relax(i, i - w - 1, dd);
      if (x < w - 1 && y > 0) relax(i, i - w + 1, dd);
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      if (dist[i] === 0) continue;
      if (x < w - 1) relax(i, i + 1, dx);
      if (y < h - 1) relax(i, i + w, dy);
      if (x < w - 1 && y < h - 1) relax(i, i + w + 1, dd);
      if (x > 0 && y < h - 1) relax(i, i + w - 1, dd);
    }
  }
  return dist;
}

const ring = areaAverage(src.data, src.width, src.height, dstW, dstH);
const dist = distanceFromLocalData(ring, dstW, dstH);

// Stored as 0..1 of MAX_DISTANCE_M, which is what writeQuantisedMask takes.
const values = new Float32Array(dist.length);
let ringCells = 0;
let maxSeen = 0;
for (let i = 0; i < dist.length; i++) {
  if (dist[i] > 0) ringCells++;
  if (dist[i] < 1e8 && dist[i] > maxSeen) maxSeen = dist[i];
  values[i] = Math.min(1, dist[i] / MAX_DISTANCE_M);
}

const written = writeQuantisedMask({
  dir: OUT_DIR, prefix: 'outerring', width: dstW, height: dstH, values,
});

const manifest = {
  schemaVersion: 1,
  grid: 'the heightfield grid divided by downscale - same bbox, same row order, coarser cells',
  crs: hf.crs,
  bboxCrsUnits: hf.bboxCrsUnits,
  dimensions: { width: dstW, height: dstH },
  downscaleFromHeightfield: DOWNSCALE,
  resolutionMPerPx: { x: resX, y: resY },
  rowOrientation: hf.rowOrientation,
  encoding: {
    channels: 1,
    depth: 8,
    meaning: 'distance beyond the edge of local survey data, as a fraction of maxDistanceM. '
      + '0 = inside the ground the park is actually surveyed on; 255 = maxDistanceM or more '
      + 'out into the coarse global fallback across the French and Swiss frontier',
    maxDistanceM: MAX_DISTANCE_M,
    quantisedTo: '16 levels, stored at PNG sample depth 4 and scaled x17 on decode',
  },
  coverage: {
    ringCells,
    ringFraction: Number((ringCells / dist.length).toFixed(4)),
    deepestRingM: Math.round(maxSeen),
  },
  file: { name: written.fileName, bytes: written.bytes, sha256Prefix: written.hash },
  generatedBy: 'tools/build-outer-ring.mjs',
  generatedAt: new Date().toISOString(),
};
writeFileSync(`${OUT_DIR}/outerring.json`, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`${written.fileName}: ${(written.bytes / 1024).toFixed(1)} kB, `
  + `${(100 * ringCells / dist.length).toFixed(2)}% of the grid is outer ring, `
  + `deepest ${Math.round(maxSeen)} m beyond local data`);
