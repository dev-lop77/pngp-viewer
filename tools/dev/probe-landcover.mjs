#!/usr/bin/env node
// Reads the built landcover masks and asks the only question that decides
// whether grass and shrubs will be visible at all: does the data say "grass"
// where a visitor actually stands?
//
// Runs on the shipped PNGs rather than on the draft, so it measures what the
// browser will download. No browser needed - this is a data probe, not a render
// probe (tools/test-groundcover.mjs is the render side).
//
// Two manifest shapes are accepted on purpose. The shipped one carries a single
// `mask` - the NDVI measurement of how much open vegetation there is. The retired
// OSM pipeline carries `masks.grass` and `masks.shrub`, and this probe still reads
// it (`--dir=tools/landcover-unshipped`) because that is how the table in
// tools/build-landcover-osm.mjs's header is reproduced rather than trusted.
//
// Usage: node tools/dev/probe-landcover.mjs [--radius=50] [--dir=public/data]

import { readFileSync } from 'node:fs';
import { readQuantisedMask } from '../lib/mask-raster.mjs';

const OUT_DIR = (process.argv.find((a) => a.startsWith('--dir=')) ?? '=public/data').split('=')[1] || 'public/data';
const RADIUS_M = Number((process.argv.find((a) => a.startsWith('--radius=')) ?? '=0').split('=')[1]) || 0;

const landcover = JSON.parse(readFileSync(`${OUT_DIR}/landcover.json`, 'utf8'));
const forest = JSON.parse(readFileSync(`${OUT_DIR}/forest.json`, 'utf8'));
const poi = JSON.parse(readFileSync(`${OUT_DIR}/poi.json`, 'utf8'));

const { width, height } = landcover.dimensions;
const { xmin, ymin, xmax, ymax } = landcover.bboxCrsUnits;
const worldWidth = xmax - xmin;
const worldDepth = ymax - ymin;

const loadMask = (fileName) => readQuantisedMask(`${OUT_DIR}/${fileName}`);

const masks = { wood: loadMask(forest.file.name) };
if (landcover.mask) {
  masks.cover = loadMask(landcover.mask.file.name);
} else {
  masks.grass = loadMask(landcover.masks.grass.file.name);
  masks.shrub = loadMask(landcover.masks.shrub.file.name);
}
const classes = Object.keys(masks).filter((k) => k !== 'wood');

// Local scene metres -> mask pixel. Matches vegUv()/terrainUv(): local origin is
// the bbox centre, +X east, +Z south, and row 0 is the north edge.
function sampleAt(mask, x, z) {
  const col = Math.floor(((x + worldWidth / 2) / worldWidth) * mask.width);
  const row = Math.floor(((z + worldDepth / 2) / worldDepth) * mask.height);
  if (col < 0 || col >= mask.width || row < 0 || row >= mask.height) return 0;
  return mask.values[row * mask.width + col] / 255;
}

// The mean over a disc, which is what a scatter over a draw radius actually
// experiences - one texel can lie while the neighbourhood tells the truth.
function meanAround(mask, x, z, radiusM) {
  if (!radiusM) return sampleAt(mask, x, z);
  const stepM = (worldWidth / mask.width) / 2;
  let sum = 0;
  let n = 0;
  for (let dz = -radiusM; dz <= radiusM; dz += stepM) {
    for (let dx = -radiusM; dx <= radiusM; dx += stepM) {
      if (dx * dx + dz * dz > radiusM * radiusM) continue;
      sum += sampleAt(mask, x + dx, z + dz);
      n++;
    }
  }
  return n ? sum / n : 0;
}

const WANTED = [
  ['Le Pont', 'trailhead'], // the default spawn
  ['Pont', null],
  ['Colle del Nivolet', null],
  ['Valnontey', null],
  ['Cogne', null],
  ['Rifugio Vittorio Emanuele II Nuovo', null],
  ['Gran Paradiso', 'peak'],
  ['Ceresole Reale', null],
  ['Degioz', null],
  ['Eaux Rousses', null],
];

const rows = [];
for (const [name, category] of WANTED) {
  const p = poi.pois.find((q) => q.name === name && (!category || q.category === category))
    ?? poi.pois.find((q) => q.name === name);
  if (!p) {
    rows.push([name, '-', ...classes.map(() => '-'), '-', 'not in poi.json']);
    continue;
  }
  const { x, z } = p.local;
  rows.push([
    name,
    `${Math.round(p.elevationM)} m`,
    ...classes.map((k) => meanAround(masks[k], x, z, RADIUS_M).toFixed(3)),
    meanAround(masks.wood, x, z, RADIUS_M).toFixed(3),
    p.category,
  ]);
}

const head = ['place', 'elev', ...classes, 'wood', 'category'];
const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i]).length)));
const line = (r) => r.map((c, i) => String(c).padEnd(widths[i])).join('  ');
console.log(RADIUS_M ? `Mask cover, mean over a ${RADIUS_M} m disc:\n` : 'Mask cover at the exact point:\n');
console.log(line(head));
console.log(widths.map((w) => '-'.repeat(w)).join('  '));
for (const r of rows) console.log(line(r));

// Park-wide totals, as a sanity floor: the bbox is deliberately much larger than
// the park, so a small percentage of the bbox is expected and is not a fault.
const bboxLine = landcover.mask
  ? `cover mean ${landcover.mask.meanCover}`
  : `grass ${(landcover.masks.grass.coveredFraction * 100).toFixed(1)}%, shrub ${(landcover.masks.shrub.coveredFraction * 100).toFixed(1)}%`;
console.log(`\nbbox: ${bboxLine}, wood ${(forest.coverage.woodedFraction * 100).toFixed(1)}%`);
