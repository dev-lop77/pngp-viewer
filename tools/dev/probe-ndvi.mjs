#!/usr/bin/env node
// What the NDVI mosaic actually says, INSIDE the park, by elevation and by
// whether OSM calls it wooded. This is the instrument that chooses
// build-landcover.mjs's two thresholds, so that they come from the distribution
// rather than from a textbook range.
//
// Splitting by the canopy mask is the point: conifer forest and alpine pasture
// both have high NDVI, and the only thing that separates them here is the OSM
// mask. What is left - open ground, above the treeline, not wooded - is exactly
// the population the grass and shrub scatter draws from, and its distribution is
// the one worth reading.
//
// Usage: node tools/dev/probe-ndvi.mjs

import { readFileSync } from 'node:fs';
import proj4 from 'proj4';
import { decodeHeightfield } from '../../src/heightfield.js';
import { rasterisePolygons, readQuantisedMask } from '../lib/mask-raster.mjs';

proj4.defs('EPSG:23032', '+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs');
const D = 'public/data';

const hf = JSON.parse(readFileSync(`${D}/heightfield.json`, 'utf8'));
const forest = JSON.parse(readFileSync(`${D}/forest.json`, 'utf8'));
const ndviMeta = JSON.parse(readFileSync('tools/ndvi-draft.json', 'utf8'));
const boundary = JSON.parse(readFileSync('tools/park-boundary.geojson', 'utf8'));

const { width, height } = hf.dimensions;
const { xmin, ymin, xmax, ymax } = hf.bboxCrsUnits;
const resX = (xmax - xmin) / width;
const resY = (ymax - ymin) / height;
if (ndviMeta.dimensions.width !== width || ndviMeta.dimensions.height !== height) {
  throw new Error('ndvi-draft is not on the heightfield grid');
}

const ndviByte = new Uint8Array(readFileSync('tools/ndvi-draft.bin'));
if (ndviByte.length !== width * height) throw new Error(`ndvi-draft.bin is ${ndviByte.length}, expected ${width * height}`);
const ndviAt = (i) => ndviByte[i] / 127.5 - 1;

const wood = readQuantisedMask(`${D}/${forest.file.name}`).values;
const heights = decodeHeightfield(readFileSync(`${D}/${hf.file.name}`), hf);
const { min: eMin, max: eMax } = hf.elevationRangeM;

// The park itself, rasterised with the same code the masks use.
const rings = boundary.geometry.coordinates.map((r, i) => ({ role: i ? 'inner' : 'outer', points: r }));
const park = new Float32Array(width * height);
const toPixel = ([lon, lat]) => {
  const [e, n] = proj4('WGS84', 'EPSG:23032', [lon, lat]);
  return [(e - xmin) / resX, (ymax - n) / resY];
};
rasterisePolygons({ polygons: [{ rings }], width, height, toPixel, into: park, subRows: 1 });

// Slope, so "open ground gentle enough to scatter on" can be separated from
// cliff - the same 35/52 deg limits build-landcover.mjs bakes in.
const elevAt = (px, py) => {
  const x = Math.min(width - 1, Math.max(0, px));
  const y = Math.min(height - 1, Math.max(0, py));
  return eMin + (heights[y * width + x] / 65535) * (eMax - eMin);
};

const BANDS = [
  [800, 1600],
  [1600, 2200],
  [2200, 2700],
  [2700, 3000],
  [3000, 3800],
];

function quantiles(sorted, qs) {
  return qs.map((q) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] : NaN));
}

const groups = new Map();
for (let py = 0; py < height; py++) {
  for (let px = 0; px < width; px++) {
    const i = py * width + px;
    if (park[i] < 0.5) continue;
    const elev = elevAt(px, py);
    const b = BANDS.findIndex(([a, z]) => elev >= a && elev < z);
    if (b < 0) continue;
    const dzdx = (elevAt(px + 1, py) - elevAt(px - 1, py)) / (2 * resX);
    const dzdy = (elevAt(px, py + 1) - elevAt(px, py - 1)) / (2 * resY);
    const normalY = 1 / Math.sqrt(dzdx * dzdx + dzdy * dzdy + 1);
    const steep = normalY < Math.cos((52 * Math.PI) / 180);
    const wooded = wood[i] > 128;
    const key = `${b}|${wooded ? 'wooded' : steep ? 'cliff' : 'open'}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(ndviAt(i));
  }
}

console.log('NDVI inside the park, by elevation band and cover class');
console.log('("open" = not wooded and gentler than 52 deg: the population grass is scattered on)\n');
const head = ['band', 'class', 'px', 'p05', 'p25', 'p50', 'p75', 'p95'];
const rows = [];
for (let b = 0; b < BANDS.length; b++) {
  for (const cls of ['open', 'wooded', 'cliff']) {
    const arr = groups.get(`${b}|${cls}`);
    if (!arr || arr.length < 50) continue;
    arr.sort((x, y) => x - y);
    const [p05, p25, p50, p75, p95] = quantiles(arr, [0.05, 0.25, 0.5, 0.75, 0.95]);
    rows.push([
      `${BANDS[b][0]}-${BANDS[b][1]} m`,
      cls,
      arr.length.toLocaleString(),
      p05.toFixed(3),
      p25.toFixed(3),
      p50.toFixed(3),
      p75.toFixed(3),
      p95.toFixed(3),
    ]);
  }
}
const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
const line = (r) => r.map((c, i) => String(c).padStart(i < 2 ? 0 : widths[i]).padEnd(widths[i])).join('  ');
console.log(line(head));
console.log(widths.map((w) => '-'.repeat(w)).join('  '));
for (const r of rows) console.log(line(r));

// What a candidate pair of thresholds would keep. The scatter reads
// smoothstep(bare, full, ndvi), so the mean of that over each band's open
// population IS the mean cover the mask will carry there.
const smoothstep = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const CANDIDATES = [
  [0.1, 0.5],
  [0.15, 0.55],
  [0.2, 0.6],
  [0.25, 0.65],
];
console.log('\nMean cover the mask would carry on open ground, per candidate (bare, full):\n');
const chead = ['band', ...CANDIDATES.map(([a, z]) => `${a}/${z}`)];
const crows = [];
for (let b = 0; b < BANDS.length; b++) {
  const arr = groups.get(`${b}|open`);
  if (!arr || arr.length < 50) continue;
  crows.push([
    `${BANDS[b][0]}-${BANDS[b][1]} m`,
    ...CANDIDATES.map(([a, z]) => (arr.reduce((s, v) => s + smoothstep(a, z, v), 0) / arr.length).toFixed(3)),
  ]);
}
const cw = chead.map((h, i) => Math.max(h.length, ...crows.map((r) => String(r[i]).length)));
console.log(chead.map((h, i) => h.padEnd(cw[i])).join('  '));
console.log(cw.map((w) => '-'.repeat(w)).join('  '));
for (const r of crows) console.log(r.map((c, i) => String(c).padEnd(cw[i])).join('  '));

console.log(`\nmosaic: ${(ndviMeta.processing.gapFraction * 100).toFixed(2)}% of the bbox had no valid observation (left at NDVI 0)`);
