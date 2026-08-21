#!/usr/bin/env node
// Does the atlas's sheet cache stay bounded when you actually walk across the park?
//
// The 3x3 proof could not ask this. Nine sheets is 37 MB of decoded photograph and no
// eviction policy is visibly wrong at 37 MB. The park's Valle d'Aosta side is 129 sheets,
// each 1020 x 1020 x 4 bytes once the browser has unpacked the 200 KB WebP, so an unbounded
// cache ends a long walk holding 537 MB - not a crash, just a viewer that has quietly become
// the heaviest tab in the browser. SHEET_CACHE_MAX exists for that; this is what proves it
// works rather than merely being written down.
//
// Two things have to hold at once, and they pull against each other:
//   - the cache never exceeds its cap, or the walk still costs 537 MB;
//   - stepping BACK over a boundary re-fetches nothing, or the cap is so tight that pacing
//     back and forth across one sheet edge re-downloads the ground every few seconds.
// So this counts network requests, not just the cache's own self-report.
//
// The walk follows the manifest's most-covered ROW rather than a compass direction: coverage
// stops at the regional border, and a probe that wanders off it would measure an atlas with
// nothing in it and call that a pass.
//
// Usage: tools/dev/start-dev.sh && node tools/dev/probe-ortho-cache.mjs [maxSteps]

import { chromium } from 'playwright';

const MAX_STEPS = Number(process.argv[2] ?? 14);
const CAP = 16; // SHEET_CACHE_MAX in src/orthotier.js - repeated here so a change trips this.

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
const problems = [];
page.on('pageerror', (e) => problems.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });

// Every sheet the page asks the network for, duplicates kept: a second request for a name
// already seen is exactly the failure a too-tight cap would cause.
const fetches = [];
page.on('request', (r) => {
  const m = /\/data\/ortho\/(o[\w.-]+\.webp)(\?|$)/.exec(r.url());
  if (m) fetches.push(m[1]);
});

await page.goto('http://localhost:5173', { waitUntil: 'load' });
await page.waitForFunction(() => window.__pngp?.getGroundHeight?.(), null, { timeout: 180000 });
await page.waitForTimeout(2000);
await page.keyboard.press('o');
await page.waitForFunction(() => (window.__pngp.ortho?.stats?.sheets ?? 0) > 0
  && window.__pngp.ortho.stats.cell, null, { timeout: 120000 });

// Where the atlas is standing now, in cells and in local metres, so cell -> local is one
// subtraction rather than a second copy of the grid arithmetic.
const anchor = await page.evaluate(() => {
  const r = window.__pngp.ortho.rect.value;
  return { cell: [...window.__pngp.ortho.stats.cell], cx: r.x + r.z / 2, cz: r.y + r.w / 2 };
});

const plan = await page.evaluate(async () => {
  const m = await (await fetch(new URL('data/ortho.json', document.baseURI))).json();
  const rows = new Map();
  for (const sh of m.sheets) {
    const [i, j] = sh.cell;
    if (!rows.has(j)) rows.set(j, []);
    rows.get(j).push(i);
  }
  let best = null;
  for (const [j, is] of rows) if (!best || is.length > best.is.length) best = { j, is: is.sort((a, b) => a - b) };
  return { j: best.j, is: best.is, step: m.grid.stepM, total: m.sheets.length };
});

const walk = plan.is.slice(0, MAX_STEPS + 1);
console.log(`manifest: ${plan.total} sheets. Densest row j=${plan.j} has ${plan.is.length} cells;`
  + ` walking i=${walk[0]}..${walk[walk.length - 1]} (${walk.length} stops, cap ${CAP}).`);

async function standOnCell(i, j) {
  const x = anchor.cx + (i - anchor.cell[0]) * plan.step;
  const z = anchor.cz + (j - anchor.cell[1]) * plan.step;
  await page.evaluate(async ({ x, z }) => {
    const y = window.__pngp.getGroundHeight()(x, z);
    window.__pngp.camera.position.set(x, Number.isFinite(y) ? y + 2 : 2500, z);
    await window.__pngp.ortho.update(x, z);
  }, { x, z });
  return page.evaluate(() => ({ ...window.__pngp.ortho.stats }));
}

let worstCached = 0;
for (const i of walk) {
  const s = await standOnCell(i, plan.j);
  worstCached = Math.max(worstCached, s.cached);
  const onCell = s.cell[0] === i && s.cell[1] === plan.j;
  console.log(`  cell ${String(i).padStart(3)},${plan.j}  atlas ${onCell ? 'on ' : `OFF (${s.cell})`}`
    + `  cells ${s.cells}/9  cached ${String(s.cached).padStart(2)}  requests ${fetches.length}`);
  if (!onCell) problems.push(`atlas landed on ${s.cell} when standing on ${[i, plan.j]}`);
}

// The other half: step back over the two boundaries just crossed. A cache big enough to be
// useful answers both from memory.
const beforeBack = fetches.length;
if (walk.length >= 3) {
  await standOnCell(walk[walk.length - 2], plan.j);
  await standOnCell(walk[walk.length - 3], plan.j);
}
const refetched = fetches.length - beforeBack;

// PHASE 2: cross several cells at flying speed WITHOUT awaiting anything, and let the render
// loop drive the refills. This is the case the 3x3 proof could not reach: nine cached sheets
// resolve before the camera can move, so an overlapping refill never happened there. Here the
// camera leaves each cell while its sheets are still in the air, which is where a refill that
// only records its position AFTER the await restarts itself once per frame - and where a cache
// of elements rather than promises downloads the same file several times over.
const beforeFly = fetches.length;
const flyCells = plan.is.slice(0, Math.min(8, plan.is.length));
await page.evaluate(async ({ cells, j, anchor, step }) => {
  const frame = () => new Promise((r) => requestAnimationFrame(r));
  for (const i of cells) {
    const x = anchor.cx + (i - anchor.cell[0]) * step;
    const z = anchor.cz + (j - anchor.cell[1]) * step;
    const y = window.__pngp.getGroundHeight()(x, z);
    window.__pngp.camera.position.set(x, Number.isFinite(y) ? y + 2 : 2500, z);
    await frame(); await frame(); // two frames per cell: the render loop calls update, we do not
  }
}, { cells: flyCells, j: plan.j, anchor, step: plan.step });
await page.waitForTimeout(4000); // let the last refill land

const flyFetches = fetches.slice(beforeFly);
const flyDup = flyFetches.length - new Set(flyFetches).size;
const settled = await page.evaluate(() => ({ ...window.__pngp.ortho.stats }));
const lastCell = flyCells[flyCells.length - 1];
console.log(`
fast crossing of ${flyCells.length} cells: ${flyFetches.length} request(s),`
  + ` ${flyDup} of them repeats; atlas settled on ${settled.cell} (expected ${[lastCell, plan.j]}),`
  + ` cells ${settled.cells}/9, cached ${settled.cached}`);

const distinct = new Set(fetches).size;
console.log(`\nrequests: ${fetches.length} total, ${distinct} distinct, ${fetches.length - distinct} repeat`);
console.log(`peak cached: ${worstCached} (cap ${CAP})`);
console.log(`stepping back two cells cost ${refetched} request(s)`);

// A cap is only proved by a walk long enough to hit it. On a nine-sheet clip everything fits
// and the pass means nothing, so say which of the two happened rather than printing PASS and
// letting a reader assume the stronger one.
const evicted = distinct > CAP;
console.log(evicted
  ? `eviction exercised: ${distinct} distinct sheets passed through a cache of ${CAP}`
  : `eviction NOT exercised: only ${distinct} distinct sheets, all of which fit - this run does`
    + ' not test the cap, it only shows the walk is honest');

const fail = [];
if (worstCached > CAP) fail.push(`cache exceeded its cap: ${worstCached} > ${CAP}`);
if (evicted && worstCached !== CAP) fail.push(`${distinct} sheets passed through a cache capped at ${CAP}, yet it peaked at ${worstCached} - the cap is not the thing bounding it`);
if (worstCached < 9) fail.push(`cache never held a full block (${worstCached}) - the walk found no coverage`);
if (refetched > 0) fail.push(`stepping back re-fetched ${refetched} sheet(s) - the cap is too tight`);
if (flyDup > 0) fail.push(`the fast crossing downloaded ${flyDup} sheet(s) twice - refills are not sharing their downloads`);
if (settled.cell[0] !== lastCell || settled.cell[1] !== plan.j) fail.push(`the atlas settled on ${settled.cell}, not on ${[lastCell, plan.j]} where the camera stopped`);
if (settled.cached > CAP) fail.push(`the fast crossing left ${settled.cached} sheets cached, over the cap of ${CAP}`);
if (problems.length) fail.push(`page problems: ${problems.slice(0, 3).join(' | ')}`);
console.log(fail.length ? `\nFAIL\n  ${fail.join('\n  ')}` : '\nPASS');
await browser.close();
process.exit(fail.length ? 1 : 0);
