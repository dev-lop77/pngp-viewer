#!/usr/bin/env node
// Screenshot the high-resolution model candidates so the user can accept or
// reject a SHAPE before any of it is wired into the app (2026-08-17).
//
// Deliberately a shot of a bench and not of the park: the question in front of
// the user is "is this ibex worth its triangles", and putting it in the scene
// first would answer it in a frame that also contains grass, weather, distance
// haze and an fps number. Those come after the shape is agreed.
//
// Usage: tools/dev/start-dev.sh && node tools/dev/shoot-models.mjs [set] [--dist=8] [--wire]
//        set defaults to every set in tools/dev/model-candidates.js
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const a = args.find((s) => s.startsWith(`--${name}=`));
  return a ? a.split('=')[1] : fallback;
};
const only = args.find((s) => !s.startsWith('--'));
const wire = args.includes('--wire');
const base = flag('url', 'http://localhost:5173');
const OUT_DIR = 'tools/dev/logs/models';

// Each set is shot at two ranges: the one where the detail is supposed to pay for
// itself, and one where it plausibly stops paying. A single distance would let a
// candidate win on a range nobody meets it at.
const SHOTS = {
  ibex: [
    { dist: 5, why: 'close - the range the detail is for' },
    { dist: 22, why: 'the range you usually first see one' },
  ],
  tree: [
    { dist: 24, why: 'standing under it' },
    { dist: 90, why: 'across a valley shoulder' },
  ],
};

mkdirSync(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 640 } });

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});

const sets = only ? [only] : Object.keys(SHOTS);
for (const set of sets) {
  for (const shot of SHOTS[set] ?? [{ dist: Number(flag('dist', 8)), why: 'requested' }]) {
    const url = `${base}/tools/dev/model-preview.html?set=${set}&dist=${shot.dist}${wire ? '&wire=1' : ''}`;
    await page.goto(url, { waitUntil: 'load' });
    // The bench draws once on load; wait for the handle rather than for a timeout.
    await page.waitForFunction(() => window.__models?.variants?.length > 0, { timeout: 20000 });
    const info = await page.evaluate(() => window.__models);
    const name = `${set}-${shot.dist}m${wire ? '-wire' : ''}.png`;
    await page.screenshot({ path: `${OUT_DIR}/${name}` });
    console.log(`\n${set} @ ${shot.dist} m (${shot.why}) -> ${OUT_DIR}/${name}`);
    const baseTris = info.variants[0].triangles;
    for (const v of info.variants) {
      const ratio = v.triangles === baseTris ? '' : ` (${(v.triangles / baseTris).toFixed(1)}x)`;
      console.log(
        `  ${v.label.padEnd(20)} ${String(v.triangles).padStart(6)} tris${ratio.padEnd(8)}` +
          ` ${v.parts} parts, ${v.smooth ? 'smooth' : 'flat'}`,
      );
    }
  }
}

await browser.close();
if (errors.length) {
  console.log(`\n${errors.length} page error(s):`);
  for (const e of errors.slice(0, 10)) console.log(`  ${e}`);
  process.exit(1);
}
console.log('\nNo page errors.');
