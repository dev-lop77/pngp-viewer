#!/usr/bin/env node
// Why are there conifers standing on the Gliairetta's firn? (open debt, 2026-08-19)
//
// The report is three trees at 45.52233N, 7.05259E, 3,315 m, where the canopy mask reads
// zero over a 3.2 km square. This replicates src/vegetation.js's PLACEMENT on the CPU -
// the same lattice, the same wrap, the same hash, the same mask lookup - so the question
// splits in two before a browser is opened:
//
//   - if the replication ALSO puts trees there, the fault is in the placement LOGIC and
//     the GPU is innocent;
//   - if it puts none there, the logic is right and the fault is in how the GPU SAMPLES
//     the mask - the mip-bleed theory - which then has to be A/B'd on the real thing.
//
// It is not evidence about the screen either way (docs/ARCHITECTURE.md §13.9): float32 on
// the GPU and float64 here will not agree tree for tree. It is evidence about the rule.
//
// Usage: node tools/dev/probe-treeline.mjs [lat] [lon]

import { readFileSync } from 'node:fs';
import { decode } from 'fast-png';
import proj4 from 'proj4';

proj4.defs('EPSG:23032', '+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs');

const lat = Number(process.argv[2] ?? 45.52233);
const lon = Number(process.argv[3] ?? 7.05259);

// The numbers vegetation.js is built from. Copied, and that is a risk this file has to
// carry: it cannot import the module (three, DOM), so a change there must be echoed here.
const WINDOW_M = 1000;
const SPACING_M = 6;
const JITTER = 0.45;
const VISIBLE_M = 440;

const manifest = JSON.parse(readFileSync('public/data/forest.json', 'utf8'));
const { xmin, ymin, xmax, ymax } = manifest.bboxCrsUnits;
const worldWidth = xmax - xmin;
const worldDepth = ymax - ymin;
const originE = (xmin + xmax) / 2;
const originN = (ymin + ymax) / 2;

const png = decode(readFileSync(`public/data/${manifest.file.name}`));
// PNG SAMPLE DEPTH 4, AND fast-png DOES NOT UNPACK IT. It hands back 5,799,936 bytes for
// 11,599,872 pixels - two samples to a byte, high nibble first - so indexing it as one
// byte per pixel reads the wrong half of the wrong pixel past the first row, and off the
// end of the array (undefined -> NaN) for most of the image. The first run of this probe
// did exactly that and reported "0 trees drawn", which is the answer it was looking for:
// NaN fails every comparison, so a decoding mistake and a clean glacier look identical.
const maxSample = (1 << png.depth) - 1;
const { width, height, channels, data } = png;
if (png.depth !== 4 || channels !== 1) throw new Error(`unexpected mask format: depth ${png.depth}, ${channels} channels`);
if (data.length * 2 !== width * height) throw new Error(`mask is not two samples to a byte: ${data.length} for ${width * height}`);
console.log(`mask ${width}x${height}, depth ${png.depth}, ${channels} channel(s), ${data.length} bytes`);

const texel = (col, row) => {
  const c = Math.min(width - 1, Math.max(0, col));
  const r = Math.min(height - 1, Math.max(0, row));
  const i = r * width + c;
  const byte = data[i >> 1];
  return ((i & 1) ? (byte & 0x0f) : (byte >> 4)) / maxSample;
};
// LOD 0 bilinear, which is what a vertex-shader texture2D() gets: derivatives are zero
// there, so the sampler never leaves the base level.
function woodAt(u, v) {
  const x = u * width - 0.5;
  const y = (1 - v) * height - 0.5; // flipY: v = 1 is mask row 0, the north edge
  const x0 = Math.floor(x); const y0 = Math.floor(y);
  const fx = x - x0; const fy = y - y0;
  return (texel(x0, y0) * (1 - fx) + texel(x0 + 1, y0) * fx) * (1 - fy)
       + (texel(x0, y0 + 1) * (1 - fx) + texel(x0 + 1, y0 + 1) * fx) * fy;
}
const vegUv = (x, z) => [(x + worldWidth / 2) / worldWidth, (worldDepth / 2 - z) / worldDepth];

// src/vegetation.js's mulberry32 and its lattice, verbatim.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const perSide = Math.round(WINDOW_M / SPACING_M);
const offsets = new Float32Array(perSide * perSide * 2);
{
  const random = mulberry32(0x9e3779b9);
  for (let iz = 0; iz < perSide; iz++) {
    for (let ix = 0; ix < perSide; ix++) {
      const i = iz * perSide + ix;
      offsets[i * 2] = (ix + 0.5 + (random() - 0.5) * 2 * JITTER) * SPACING_M;
      offsets[i * 2 + 1] = (iz + 0.5 + (random() - 0.5) * 2 * JITTER) * SPACING_M;
    }
  }
}
// The shader's hash, in float32 throughout - fround at every step, because this is the
// one number where double precision would quietly disagree with the GPU.
const f = Math.fround;
function vegHash(px, py) {
  const fr = (n) => f(n - Math.floor(n));
  let x = fr(f(px * 0.1031)); let y = fr(f(py * 0.1031)); let z = fr(f(px * 0.1031));
  const d = f(f(x * f(y + 33.33)) + f(f(y * f(z + 33.33)) + f(z * f(x + 33.33))));
  x = f(x + d); y = f(y + d); z = f(z + d);
  return fr(f(f(x + y) * z));
}

const [e, n] = proj4('WGS84', 'EPSG:23032', [lon, lat]);
const camX = e - originE;
const camZ = originN - n;
console.log(`camera ${lat}N ${lon}E -> local ${camX.toFixed(0)}, ${camZ.toFixed(0)}`);

let drawn = 0;
const found = [];
for (let i = 0; i < perSide * perSide; i++) {
  const ox = offsets[i * 2]; const oz = offsets[i * 2 + 1];
  const sx = ox + Math.floor((camX - ox) / WINDOW_M + 0.5) * WINDOW_M;
  const sz = oz + Math.floor((camZ - oz) / WINDOW_M + 0.5) * WINDOW_M;
  const dist = Math.hypot(camX - sx, camZ - sz);
  if (dist >= VISIBLE_M) continue;
  const [u, v] = vegUv(sx, sz);
  const wood = woodAt(u, v);
  const draw = vegHash(Math.floor(sx / SPACING_M), Math.floor(sz / SPACING_M));
  if (draw <= wood) { // step(draw, wood)
    drawn++;
    if (found.length < 12) found.push({ sx, sz, dist, wood, draw });
  }
}
const inRange = [];
for (let i = 0; i < perSide * perSide; i++) {
  const ox = offsets[i * 2]; const oz = offsets[i * 2 + 1];
  const sx = ox + Math.floor((camX - ox) / WINDOW_M + 0.5) * WINDOW_M;
  const sz = oz + Math.floor((camZ - oz) / WINDOW_M + 0.5) * WINDOW_M;
  if (Math.hypot(camX - sx, camZ - sz) < VISIBLE_M) inRange.push([sx, sz]);
}
console.log(`${inRange.length} slots inside the ${VISIBLE_M} m draw radius, ${drawn} of them DRAWN`);
for (const t of found) {
  console.log(`  tree at ${t.sx.toFixed(1)}, ${t.sz.toFixed(1)}  ${t.dist.toFixed(0)} m away  wood ${t.wood.toFixed(4)}  draw ${t.draw.toFixed(4)}`);
}
// WHY a slot with no wood under it draws a tree at all, which is the whole answer: the
// rule is step(draw, wood), and step(e, x) is 1.0 when x >= e - so wood 0.0 against a
// draw of EXACTLY 0.0 is a tree. That is not a freak: vegHash loses most of its range to
// float32 at these world coordinates, so exact zero comes up often enough to be visible.
{
  const seen = new Set();
  let zeros = 0;
  let n = 0;
  for (let i = 0; i < perSide * perSide; i++) {
    const ox = offsets[i * 2]; const oz = offsets[i * 2 + 1];
    const sx = ox + Math.floor((camX - ox) / WINDOW_M + 0.5) * WINDOW_M;
    const sz = oz + Math.floor((camZ - oz) / WINDOW_M + 0.5) * WINDOW_M;
    if (Math.hypot(camX - sx, camZ - sz) >= VISIBLE_M) continue;
    const d = vegHash(Math.floor(sx / SPACING_M), Math.floor(sz / SPACING_M));
    seen.add(d); if (d === 0) zeros++; n++;
  }
  console.log(`vegHash over those ${n} slots: ${seen.size} distinct values, ${zeros} of them exactly 0`);
  console.log(`  (a float32 hash with full range would give ~${n} distinct and ~0 zeros)`);
}
// The one-character fix, checked before it is written: strictly greater, so 0 > 0 is false.
{
  let strict = 0;
  for (let i = 0; i < perSide * perSide; i++) {
    const ox = offsets[i * 2]; const oz = offsets[i * 2 + 1];
    const sx = ox + Math.floor((camX - ox) / WINDOW_M + 0.5) * WINDOW_M;
    const sz = oz + Math.floor((camZ - oz) / WINDOW_M + 0.5) * WINDOW_M;
    if (Math.hypot(camX - sx, camZ - sz) >= VISIBLE_M) continue;
    const [u, v] = vegUv(sx, sz);
    if (vegHash(Math.floor(sx / SPACING_M), Math.floor(sz / SPACING_M)) < woodAt(u, v)) strict++;
  }
  console.log(`with "wood > draw" instead of "wood >= draw": ${strict} drawn`);
}
// What the mask holds around here at all, at its own resolution.
let maxWood = 0; let sum = 0; let cells = 0;
for (let dz = -1600; dz <= 1600; dz += 20) {
  for (let dx = -1600; dx <= 1600; dx += 20) {
    const [u, v] = vegUv(camX + dx, camZ + dz);
    const w = woodAt(u, v);
    maxWood = Math.max(maxWood, w); sum += w; cells++;
  }
}
console.log(`mask over a 3.2 km square: max ${maxWood.toFixed(4)}, mean ${(sum / cells).toFixed(5)} over ${cells} samples`);
// And the nearest wood of any kind, so "a wood a kilometre away" is a number.
let best = Infinity; let bestAt = null;
for (let r = 40; r <= 6000; r += 40) {
  for (let a = 0; a < 360; a += 5) {
    const dx = r * Math.cos((a * Math.PI) / 180); const dz = r * Math.sin((a * Math.PI) / 180);
    const [u, v] = vegUv(camX + dx, camZ + dz);
    if (woodAt(u, v) > 0.02 && r < best) { best = r; bestAt = [camX + dx, camZ + dz]; }
  }
  if (best < Infinity) break;
}
console.log(best < Infinity
  ? `nearest wood: ${best} m away, at ${bestAt[0].toFixed(0)}, ${bestAt[1].toFixed(0)}`
  : 'no wood within 6 km');
