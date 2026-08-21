#!/usr/bin/env node
// How much of the WHOLE RENDERED WORLD can the Valle d'Aosta Ortofoto 2024 cover - not just
// the park? (The user, 2026-08-21: "visto che abbiamo risparmiato tanto spazio, direi di
// estendere le ortofoto a tutta la superficie al momento gestita, anche se e' fuori dal
// parco, come l'alta val di Rhemes e la Valgrisenche.")
//
// The park list was built by walking a 100 m point grid inside the park boundary and asking
// the QDU WMS what sheet each cell was. Two things make that the wrong tool here:
//
//   1. THE SHEET CODE IS A PURE FUNCTION OF THE CELL, and that is now proved rather than
//      assumed - all 129 built sheets satisfy tavola = (59 + 2i)(43 - 2j), two digits each,
//      against cells computed from the rasters' own corners. So the WMS is not needed at all:
//      one HEAD per candidate answers "does this exist", which is the only open question.
//   2. The park walk indexed cells on a 2,040 m grid while the sheets are 2,000 m apart. The
//      two drift by 40 m a cell, so about one sheet in fifty contains no cell centre and is
//      never asked about. Over the park's 21-cell span that is at most a hole or two; over a
//      42-cell world it is systematic. Here the grid is the real one.
//
// Requests are sequential and spaced: this is somebody else's public service.
//
// --buffer=N narrows the answer to sheets within N cells (N x 2 km) of one already in
// public/data/ortho.json - "the park and a margin around it" rather than everything the
// region has. It is a property of the SELECTION, not of the survey, so it lives here with the
// grid rather than in a one-off script nobody can find again. With --from-cache it re-reads
// the survey off disk and touches no network at all, which is how a different margin gets
// costed without asking the region 1,080 more questions.
//
// Usage: node tools/dev/probe-ortho-extent.mjs [--out=FILE] [--buffer=N] [--from-cache]

import { readFileSync, writeFileSync } from 'node:fs';

const STEP_M = 2000;
const SHEET_M = 2040;
const GRID_E = 357980.311943102395162;
const GRID_N = 5044019.371613291092217;
const ZIP = (t) => `https://geoprodotti.regione.vda.it/download/ORTO2024_ED50_005/ORTO2024_ED50_005_${t}.zip`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const outFlag = process.argv.find((a) => a.startsWith('--out='));
const OUT = outFlag ? outFlag.slice(6) : 'tools/dev/logs/ortho-sheets-world.json';
const bufFlag = process.argv.find((a) => a.startsWith('--buffer='));
const BUFFER = bufFlag ? Number(bufFlag.slice(9)) : null;
const FROM_CACHE = process.argv.includes('--from-cache');

// The world the viewer actually draws is the heightfield's bbox - terrain.js builds its
// quadtree root from exactly this, so "the surface currently managed" is this rectangle.
const hf = JSON.parse(readFileSync('public/data/heightfield.json', 'utf8'));
const { xmin, ymin, xmax, ymax } = hf.bboxCrsUnits;
console.log(`rendered world: ${((xmax - xmin) / 1000).toFixed(1)} x ${((ymax - ymin) / 1000).toFixed(1)} km`
  + ` = ${(((xmax - xmin) * (ymax - ymin)) / 1e6).toFixed(0)} km2, EPSG:23032`);

const tavolaOf = (i, j) => {
  const a = 59 + 2 * i;
  const b = 43 - 2 * j;
  // Outside two digits the code is not in this scheme, which means outside the region's grid.
  return a >= 1 && a <= 99 && b >= 1 && b <= 99 ? `${String(a).padStart(2, '0')}${String(b).padStart(2, '0')}` : null;
};

const candidates = [];
for (let i = Math.floor((xmin - SHEET_M - GRID_E) / STEP_M); i <= Math.ceil((xmax - GRID_E) / STEP_M); i++) {
  for (let j = Math.floor((GRID_N - ymax - SHEET_M) / STEP_M); j <= Math.ceil((GRID_N - ymin) / STEP_M); j++) {
    const e0 = GRID_E + i * STEP_M;
    const n0 = GRID_N - j * STEP_M;
    if (e0 + SHEET_M <= xmin || e0 >= xmax || n0 <= ymin || n0 - SHEET_M >= ymax) continue;
    const t = tavolaOf(i, j);
    if (t) candidates.push({ tavola: t, cell: [i, j] });
  }
}
const offGrid = ((Math.ceil((xmax - GRID_E) / STEP_M) - Math.floor((xmin - SHEET_M - GRID_E) / STEP_M) + 1)
  * (Math.ceil((GRID_N - ymin) / STEP_M) - Math.floor((GRID_N - ymax - SHEET_M) / STEP_M) + 1)) - candidates.length;
console.log(`${candidates.length} candidate sheets overlap it (${offGrid} more fall outside the region's numbering)`);

// What is already on disk, so the report can say what the EXTENSION costs rather than the
// whole thing again.
const built = new Set(JSON.parse(readFileSync('public/data/ortho.json', 'utf8')).sheets.map((s) => s.tavola));

const cellOfTavola = (t) => [(Number(t.slice(0, 2)) - 59) / 2, (43 - Number(t.slice(2))) / 2];

let found = [];
if (FROM_CACHE) {
  found = JSON.parse(readFileSync(OUT, 'utf8')).sheets.map((s) => ({ ...s, cell: cellOfTavola(s.tavola) }));
  console.log(`re-read ${found.length} surveyed sheets from ${OUT}, no requests made`);
} else {
  let checked = 0;
  for (const c of candidates) {
    const head = await fetch(ZIP(c.tavola), { method: 'HEAD' }).catch(() => null);
    if (head?.ok) found.push({ ...c, bytes: Number(head.headers.get('content-length') ?? 0) });
    checked += 1;
    if (checked % 25 === 0) process.stderr.write(`  ${checked}/${candidates.length}, ${found.length} exist\r`);
    await sleep(120);
  }
  process.stderr.write('\n');
}

const fresh = found.filter((f) => !built.has(f.tavola));
const bytes = found.reduce((a, f) => a + f.bytes, 0);
const freshBytes = fresh.reduce((a, f) => a + f.bytes, 0);
const MEAN_SHIP_KB = 172; // measured over the 129 sheets already built at 2 m/px, WebP q75
console.log(`\n${found.length} sheets exist, of which ${fresh.length} are NEW (${built.size} already built)`);
console.log(`covers ${((found.length * STEP_M * STEP_M) / 1e6).toFixed(0)} km2 of the`
  + ` ${(((xmax - xmin) * (ymax - ymin)) / 1e6).toFixed(0)} km2 world`
  + ` = ${((100 * found.length * STEP_M * STEP_M) / ((xmax - xmin) * (ymax - ymin))).toFixed(1)}%`);
console.log(`to FETCH for the extension: ${(freshBytes / 1e9).toFixed(1)} GB`
  + ` (the whole set would be ${(bytes / 1e9).toFixed(1)} GB)`);
console.log(`at the measured 8.76 MB/s that is about ${(freshBytes / 8.76e6 / 3600).toFixed(1)} h of downloading`);
console.log(`to SHIP: ${((found.length * MEAN_SHIP_KB) / 1000).toFixed(0)} MB total,`
  + ` ${((fresh.length * MEAN_SHIP_KB) / 1000).toFixed(0)} MB of it new`);

if (!FROM_CACHE) {
  writeFileSync(OUT, `${JSON.stringify({
    note: 'Every sheet of the Valle d\'Aosta Ortofoto 2024 that overlaps the rendered world, park or not.',
    world: hf.bboxCrsUnits,
    sheets: found.map((f) => ({ tavola: f.tavola, bytes: f.bytes })),
  }, null, 1)}\n`);
  console.log(`sheet list -> ${OUT}`);
}

if (BUFFER !== null) {
  // Chebyshev distance in cells, so "within N" is a square margin - which is what a sheet grid
  // can actually express, and the honest thing to call it.
  const parkCells = [...built].map(cellOfTavola);
  const near = found.filter(({ cell: [i, j] }) =>
    parkCells.some(([pi, pj]) => Math.max(Math.abs(i - pi), Math.abs(j - pj)) <= BUFFER));
  const nearNew = near.filter((f) => !built.has(f.tavola));
  const nearBytes = nearNew.reduce((a, f) => a + f.bytes, 0);
  const path = OUT.replace(/\.json$/, `-${BUFFER * 2}km.json`);
  writeFileSync(path, `${JSON.stringify({
    note: `Sheets within ${BUFFER * 2} km of the park's own coverage - the park and a margin.`,
    bufferCells: BUFFER,
    sheets: near.map((f) => ({ tavola: f.tavola, bytes: f.bytes })),
  }, null, 1)}\n`);
  console.log(`\nwithin ${BUFFER * 2} km of the park: ${near.length} sheets, ${nearNew.length} new,`
    + ` ${(nearBytes / 1e9).toFixed(1)} GB to fetch, ${((near.length * MEAN_SHIP_KB) / 1000).toFixed(0)} MB shipped`);
  console.log(`selection -> ${path}`);
}
