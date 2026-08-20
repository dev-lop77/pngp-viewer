#!/usr/bin/env node
// How much of the Gran Paradiso can the Valle d'Aosta Ortofoto 2024 actually cover, and what
// would it cost to fetch and to ship? (The user, 2026-08-20, having chosen 2 m/px: "Proviamo
// ad stenderlo su tutto il parco? Ce la facciamo con github? Che valga la pena usare solo
// questa sorgente fin dove e' possibile?")
//
// The park straddles two regions and this product stops at the regional border, so "the whole
// park" is a claim that has to be measured rather than assumed - and measured against the
// FILES, not against a coverage statement. Two stages, both against the live services:
//
//   1. Which 1:5.000 sheets does the park touch? Geometry only, no network: the sheet grid is
//      2,040 m and aligned to the one sheet already downloaded.
//   2. For each of those, does a 2024 sheet EXIST, and how big is it? One GetFeatureInfo to
//      turn the cell into a sheet code, then one HEAD for the zip. That is the difference
//      between "the region says it covers its territory" and "these bytes are there".
//
// Requests are sequential and spaced on purpose: this is somebody else's public service.
//
// Usage: node tools/dev/probe-ortho-coverage.mjs [--sheets-only]

import { readFileSync, writeFileSync } from 'node:fs';
import proj4 from 'proj4';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';

proj4.defs('EPSG:23032', '+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs');
const toWgs = (e, n) => proj4('EPSG:23032', 'WGS84', [e, n]);

// The sheet grid, taken from the one sheet already in hand (ORTO2024_ED50_005_5943):
// upper-left corner and side, both exact.
const SHEET_M = 2040;
const GRID_E = 357980.311943102395162;
const GRID_N = 5044019.371613291092217;
const cellOf = (e, n) => [Math.floor((e - GRID_E) / SHEET_M), Math.floor((GRID_N - n) / SHEET_M)];
const cellOrigin = (ci, cj) => [GRID_E + ci * SHEET_M, GRID_N - cj * SHEET_M];

const park = JSON.parse(readFileSync('tools/park-boundary.geojson', 'utf8'));

// A fine grid over the park, so area is counted rather than estimated. 100 m cells: 1 ha each,
// which is fine detail against a 71,000 ha park and cheap enough to run in a second.
const STEP = 100;
const bbox = (() => {
  let e0 = Infinity; let n0 = Infinity; let e1 = -Infinity; let n1 = -Infinity;
  const flat = (c) => (typeof c[0] === 'number' ? [c] : c.flatMap(flat));
  for (const [lon, lat] of flat(park.geometry.coordinates)) {
    const [e, n] = proj4('WGS84', 'EPSG:23032', [lon, lat]);
    e0 = Math.min(e0, e); e1 = Math.max(e1, e); n0 = Math.min(n0, n); n1 = Math.max(n1, n);
  }
  return { e0, e1, n0, n1 };
})();
console.log(`park bbox in EPSG:23032: ${((bbox.e1 - bbox.e0) / 1000).toFixed(1)} x ${((bbox.n1 - bbox.n0) / 1000).toFixed(1)} km`);

const cells = new Map(); // "ci,cj" -> hectares of park inside it
let parkHa = 0;
for (let n = bbox.n0; n <= bbox.n1; n += STEP) {
  for (let e = bbox.e0; e <= bbox.e1; e += STEP) {
    const [lon, lat] = toWgs(e, n);
    if (!booleanPointInPolygon(point([lon, lat]), park)) continue;
    parkHa += 1; // one 100 x 100 m cell
    const key = cellOf(e, n).join(',');
    cells.set(key, (cells.get(key) ?? 0) + 1);
  }
}
console.log(`park area by point count: ${(parkHa / 100).toFixed(1)} km2 (official figure is ~710 km2)`);
console.log(`it touches ${cells.size} sheets of ${SHEET_M} m\n`);

if (process.argv.includes('--sheets-only')) process.exit(0);

// --- stage 2: does each sheet exist, and how big is it? --------------------------------
const QDU = 'https://servizisct.regione.vda.it/ows/public/QDU';
const LAYER = 'Quadri_dUnione__Ortofoto_2012_scala_5000';
const ZIP = (t) => `https://geoprodotti.regione.vda.it/download/ORTO2024_ED50_005/ORTO2024_ED50_005_${t}.zip`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tavolaAt(e, n) {
  const b = [e - 250, n - 250, e + 250, n + 250].join(',');
  const url = `${QDU}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&LAYERS=${LAYER}`
    + `&QUERY_LAYERS=${LAYER}&SRS=EPSG:23032&BBOX=${b}&WIDTH=101&HEIGHT=101&X=50&Y=50`
    + '&INFO_FORMAT=text/plain&FEATURE_COUNT=1';
  const text = await fetch(url).then((r) => (r.ok ? r.text() : '')).catch(() => '');
  return text.match(/tavola = '(\d+)'/)?.[1] ?? null;
}

const found = new Map(); // tavola -> bytes
const missing = [];
let done = 0;
const keys = [...cells.keys()];
for (const key of keys) {
  const [ci, cj] = key.split(',').map(Number);
  const [e0, n0] = cellOrigin(ci, cj);
  const t = await tavolaAt(e0 + SHEET_M / 2, n0 - SHEET_M / 2);
  if (!t) {
    missing.push({ key, ha: cells.get(key) });
  } else if (!found.has(t)) {
    const head = await fetch(ZIP(t), { method: 'HEAD' }).catch(() => null);
    found.set(t, head?.ok ? Number(head.headers.get('content-length') ?? 0) : 0);
    if (!head?.ok) missing.push({ key, ha: cells.get(key), tavola: t, why: 'no 2024 zip' });
    await sleep(120);
  }
  cells.set(key, { ha: cells.get(key), tavola: t });
  done += 1;
  if (done % 20 === 0) process.stderr.write(`  ${done}/${keys.length}\r`);
  await sleep(120);
}

const coveredHa = [...cells.values()].filter((v) => v.tavola && found.get(v.tavola)).reduce((a, v) => a + v.ha, 0);
const bytes = [...found.values()].reduce((a, b) => a + b, 0);
const sheets = [...found.entries()].filter(([, b]) => b > 0);

console.log(`\n${sheets.length} sheets exist and answer 200`);
console.log(`covered: ${(coveredHa / 100).toFixed(1)} km2 of ${(parkHa / 100).toFixed(1)} km2`
  + ` = ${((100 * coveredHa) / parkHa).toFixed(1)}% of the park`);
console.log(`NOT covered: ${((parkHa - coveredHa) / 100).toFixed(1)} km2 - the Piemonte side\n`);
console.log(`to FETCH: ${(bytes / 1e9).toFixed(1)} GB of zipped sheets`
  + ` (mean ${(bytes / sheets.length / 1e6).toFixed(0)} MB each)`);
// 0.232 bytes/px measured at 2 m/px on this imagery (tools/dev/probe-orthophoto.mjs).
const shipMB = ((coveredHa * 1e4) / 4) * 0.232 / 1e6;
console.log(`to SHIP at 2 m/px: ${shipMB.toFixed(0)} MB over ${sheets.length} files of ~${(shipMB / sheets.length * 1000).toFixed(0)} kB`);
writeFileSync('tools/dev/logs/ortho-sheets.json',
  JSON.stringify({ sheets: sheets.map(([t, b]) => ({ tavola: t, bytes: b })), coveredKm2: coveredHa / 100, parkKm2: parkHa / 100 }, null, 1));
console.log('sheet list -> tools/dev/logs/ortho-sheets.json');
