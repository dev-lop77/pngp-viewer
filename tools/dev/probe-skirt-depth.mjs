#!/usr/bin/env node
// How deep does a tile skirt actually have to be? (open debt: "a terrain tile skirt shows
// at eye height on the ice", 2026-08-19)
//
// SKIRT_DEPTH_M is one number, 150 m, for every level of the quadtree. That is sized for
// the coarse tiles - a level-0 tile's cell is 2.6 km wide and its linear interpolation can
// miss a real ridge by hundreds of metres - and it is enormously over-sized for the fine
// tiles the camera stands among, whose cells are 20.5 m. A curtain hangs 150 m below every
// one of those borders, and standing on a convex break in the ice you look straight down
// the side of it.
//
// What a skirt has to cover is the T-JUNCTION GAP: where a tile meets a coarser neighbour,
// the fine tile's extra edge vertices sit at the true height while the coarse tile's edge
// is the straight line between vertices one coarse cell apart. So the gap at a border of
// cell size c is bounded by the heightfield's own departure from linear over the COARSER
// neighbour's cell - which is a property of the data and can be measured once.
//
// Usage: node tools/dev/probe-skirt-depth.mjs

import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('public/data/heightfield.json', 'utf8'));
const { width, height } = manifest.dimensions;
const { min: elevMin, max: elevMax } = manifest.elevationRangeM;
const raw = readFileSync(`public/data/${manifest.file?.name ?? 'heightfield.1fefad51.bin'}`);

// row-delta-byte-planes, exactly as src/terrain.js decodes it.
const n = width * height;
const hi = raw.subarray(0, n);
const lo = raw.subarray(n, 2 * n);
const elev = new Float32Array(n);
const scale = (elevMax - elevMin) / 65535;
for (let row = 0; row < height; row++) {
  let v = 0;
  const base = row * width;
  for (let x = 0; x < width; x++) {
    const i = base + x;
    v = (v + ((hi[i] << 8) | lo[i])) & 0xffff;
    elev[i] = elevMin + v * scale;
  }
}
console.log(`heightfield ${width}x${height}, ${elevMin.toFixed(0)}-${elevMax.toFixed(0)} m`);

const TILE_SEGMENTS = 32;
const MAX_DEPTH = 7;
const worldWidth = manifest.bboxCrsUnits.xmax - manifest.bboxCrsUnits.xmin;
const cellPx = worldWidth / width; // metres per heightfield sample, ~20.48

// |h(x) - (h(x-k) + h(x+k)) / 2| is the sag of a straight edge of span 2k against the real
// surface at its midpoint - which is exactly the T-junction gap when the coarse cell is 2k.
function maxSag(k) {
  let worst = 0;
  let p99 = null;
  const hist = new Float64Array(2048);
  for (let row = k; row < height - k; row += Math.max(1, Math.floor(k / 2))) {
    const base = row * width;
    for (let x = k; x < width - k; x += Math.max(1, Math.floor(k / 2))) {
      const s = Math.abs(elev[base + x] - (elev[base + x - k] + elev[base + x + k]) / 2);
      if (s > worst) worst = s;
      hist[Math.min(2047, Math.floor(s))]++;
    }
  }
  // Also down-column, since a tile edge runs both ways.
  for (let row = k; row < height - k; row += Math.max(1, Math.floor(k / 2))) {
    for (let x = k; x < width - k; x += Math.max(1, Math.floor(k / 2))) {
      const s = Math.abs(elev[row * width + x] - (elev[(row - k) * width + x] + elev[(row + k) * width + x]) / 2);
      if (s > worst) worst = s;
      hist[Math.min(2047, Math.floor(s))]++;
    }
  }
  let total = 0;
  for (const c of hist) total += c;
  let acc = 0;
  for (let i = 0; i < hist.length; i++) {
    acc += hist[i];
    if (p99 === null && acc >= total * 0.9999) p99 = i + 1;
  }
  return { worst, p9999: p99 };
}

console.log('\ndepth  tile cell   coarse cell   worst sag   99.99th');
const rows = [];
for (let depth = MAX_DEPTH; depth >= 0; depth--) {
  const cell = worldWidth / (TILE_SEGMENTS * 2 ** depth);
  const coarse = cell * 2; // a neighbour one level coarser
  const k = Math.max(1, Math.round(coarse / 2 / cellPx));
  const { worst, p9999 } = maxSag(k);
  rows.push({ depth, cell, coarse, worst });
  console.log(`  ${depth}    ${cell.toFixed(1).padStart(8)} m ${coarse.toFixed(1).padStart(10)} m ${worst.toFixed(1).padStart(9)} m ${String(p9999).padStart(8)} m`);
}
console.log(`\ncurrent SKIRT_DEPTH_M = 150 for every level.`);
const deepest = rows.find((r) => r.depth === MAX_DEPTH);
console.log(`At the deepest level the worst gap in the whole park is ${deepest.worst.toFixed(1)} m,`);
console.log(`so the curtain under the camera is ${(150 / deepest.worst).toFixed(1)}x deeper than anything it could ever have to hide.`);
