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
// The near distance per species is NOT the same number, because the animals are
// not the same size: it is chosen to put each one at a comparable ~150 px, which is
// the only fair way to compare treatments across a 1.4 m ibex and a 0.2 m squirrel.
// The header of every shot prints the pixel height, so the choice is visible rather
// than hidden in this table.
const SHOTS = {
  ibex: [
    { dist: 5, why: 'close - the range the detail is for' },
    { dist: 22, why: 'the range you usually first see one' },
  ],
  chamois: [{ dist: 4, why: 'walked down - it flees at 2.08 m/s against your 4' }],
  fox: [{ dist: 2.5, why: 'a curious fox comes to you' }],
  marmot: [{ dist: 1.6, why: 'as close as 62 px at 4 m is worth showing' }],
  squirrel: [{ dist: 1.1, why: 'the smallest animal in the park, at 38 px in play' }],
  tree: [
    { dist: 24, why: 'standing under it' },
    { dist: 90, why: 'across a valley shoulder' },
  ],
  // The huts (2026-08-19). Two ranges each, and the far one is deliberately PAST the
  // 800 m where src/huts.js swaps in the distance shape - the question there is not
  // "is the detail worth it" but "is it still the same building", which is the only
  // way a walk toward a refuge does not look like one model being replaced by another.
  rifugio: [
    { dist: 35, why: 'arriving in the yard' },
    { dist: 900, why: 'past the LOD switch, where only the distance shape is drawn' },
  ],
  // The summit pieces, at the two ranges that matter: standing on the top beside it, and
  // the last stretch of the ridge where you first make it out.
  summit: [
    { dist: 6, why: 'standing on the summit beside it' },
    { dist: 60, why: 'the last stretch of ridge, where you first make it out' },
  ],
  bivouac: [
    { dist: 9, why: 'at the door' },
    { dist: 900, why: 'past the LOD switch - a bivouac is two pixels of orange here' },
  ],
};

mkdirSync(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
// The app's own viewport, so the models are the size the app draws them. The frame
// gets CROPPED to the row afterwards rather than the camera moved in - see rowBox()
// in model-preview.js.
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

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
    // Crop the empty sky above the row and nothing else: full width (the labels are
    // in fixed columns across it) and from a little above the tallest model down to
    // the bottom of the page.
    const box = await page.evaluate(() => window.__models.rowBox());
    const vp = await page.evaluate(() => window.__models.viewport());
    const labelsBottom = await page.evaluate(() => window.__models.labelsBottom());
    const top = Math.max(0, Math.floor(box.y0) - 48);
    const bottom = Math.min(vp.h, Math.ceil(labelsBottom) + 14);
    await page.screenshot({
      path: `${OUT_DIR}/${name}`,
      clip: { x: 0, y: top, width: vp.w, height: Math.max(80, bottom - top) },
    });
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
