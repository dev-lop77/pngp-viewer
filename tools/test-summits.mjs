#!/usr/bin/env node
// The summit monuments (src/summits.js): the cross on the Granta Parey, the Madonna on
// the Gran Paradiso, and the user's second cross at 45.5247N 7.1891E.
//
// Three named objects rather than a category, so what this test is really guarding is
// that they are STILL THERE and still where they were put. The ways they can silently
// disappear are specific: a POI id that changes when poi.json is rebuilt, a lat/lon that
// falls outside the bbox, a monument left at the surface the terrain drew before the
// height tier arrived, or the Models switch drawing them when it should not.
//
// The seating is checked against the BILINEAR height, not against sampleRenderedHeight -
// that is what seated them, and asking it can only prove the assignment ran (§13.9).
//
// Usage: node tools/test-summits.mjs [url]

import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { SUMMIT_BUILDERS, MONUMENTS } from '../src/summits.js';

const url = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'http://localhost:5173';
const failures = [];
const check = (ok, message) => {
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${message}`);
  if (!ok) failures.push(message);
};

// ---- 1. every monument has a place that still exists ----
const poi = JSON.parse(readFileSync('public/data/poi.json', 'utf8'));
const byId = new Map(poi.pois.map((p) => [p.id, p]));
const { xmin, ymin, xmax, ymax } = JSON.parse(readFileSync('public/data/heightfield.json', 'utf8')).bboxCrsUnits;
check(MONUMENTS.length === 3, `three monuments are declared (${MONUMENTS.length})`);
for (const m of MONUMENTS) {
  check(SUMMIT_BUILDERS[m.kind] !== undefined, `${m.poiName}: kind "${m.kind}" has a builder`);
  if (m.poiId) {
    const p = byId.get(m.poiId);
    check(Boolean(p), `${m.poiName}: POI ${m.poiId} is still in poi.json`);
    if (p) check(p.name === m.poiName || m.poiName.includes(p.name),
      `${m.poiId} is still called "${p.name}" (declared "${m.poiName}")`);
  } else {
    // A lat/lon entry has to be inside the DEM, or it is drawn on the outer ring where
    // there is no real terrain under it. Checked here in WGS84 the crude way - the exact
    // conversion is src/geo.js's job and the page checks below stand on that.
    check(m.lat > 45.1 && m.lat < 45.9 && m.lon > 6.7 && m.lon < 7.9,
      `${m.poiName}: ${m.lat}N ${m.lon}E is in the park's latitude/longitude window`);
  }
}
check(Number.isFinite(xmin) && Number.isFinite(ymax), 'the heightfield manifest still declares a bbox');

// ---- 2. the shapes ----
for (const [kind, build] of Object.entries(SUMMIT_BUILDERS)) {
  const parts = build();
  let minY = Infinity;
  let maxY = -Infinity;
  let tris = 0;
  for (const g of parts) {
    const pos = g.attributes.position;
    tris += pos.count / 3;
    for (let i = 0; i < pos.count; i += 1) {
      minY = Math.min(minY, pos.getY(i));
      maxY = Math.max(maxY, pos.getY(i));
    }
  }
  // Nothing below the ground plane: these are seated with their origin ON the surface,
  // and the bridging base below them is a separate mesh scaled per site.
  check(minY >= -0.001, `${kind}: nothing hangs below the ground plane (min Y ${minY.toFixed(3)})`);
  check(maxY > 2 && maxY < 4.2, `${kind}: is human-scale, ${maxY.toFixed(2)} m tall`);
  const attrs = parts.map((g) => Object.keys(g.attributes).sort().join(','));
  check(new Set(attrs).size === 1, `${kind}: every part carries the same attributes (${attrs[0]})`);
  check(parts.every((g) => g.index === null), `${kind}: every part is non-indexed, so the merge cannot refuse it`);
  check(tris < 400, `${kind}: ${tris} triangles`);
}

// ---- 3. the real page ----
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
const problems = [];
page.on('pageerror', (e) => problems.push(`[pageerror] ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`[console.error] ${m.text()}`); });
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__pngp?.getMonuments?.(), null, { timeout: 180000 });

// Standard first: they must NOT be drawn. This is the user's own condition ("Aggiungile
// solo se Models e' High"), so it is a requirement and not a detail.
const standard = await page.evaluate(() => {
  const s = document.getElementById('env-models');
  s.value = '0';
  s.dispatchEvent(new Event('change'));
  return { visible: window.__pngp.getMonuments().group.visible };
});
check(standard.visible === false, 'at Models = Standard the monuments are not drawn');

await page.evaluate(() => {
  const s = document.getElementById('env-models');
  s.value = '1';
  s.dispatchEvent(new Event('change'));
});
// The height tier moves the drawn surface by up to 44 m after the first frame, and these
// are re-seated when it does. Waiting for it means the numbers below are the final ones.
await page
  .waitForFunction(() => (window.__pngp.terrain?.heightTier?.mix ?? 0) >= 1, null, { timeout: 300000 })
  .catch(() => console.log('  note  the height tier never settled - continuing'));
await page.waitForTimeout(1500);

const placed = await page.evaluate(() => {
  const m = window.__pngp.getMonuments();
  const bilinear = window.__pngp.getBilinearHeight();
  return {
    visible: m.group.visible,
    missing: m.missing,
    rows: m.monuments.map((p) => ({
      name: p.poiName,
      kind: p.kind,
      y: p.mesh.position.y,
      baseBottom: p.base.position.y - p.base.scale.y,
      bilinear: bilinear(p.mesh.position.x, p.mesh.position.z),
      inScene: Boolean(p.mesh.parent) && Boolean(p.base.parent),
    })),
  };
});
check(placed.visible === true, 'at Models = High they are drawn');
check(placed.missing.length === 0, `no monument lost its place (${placed.missing.join(', ') || 'none'})`);
check(placed.rows.length === 3, `all three are in the scene (${placed.rows.length})`);
for (const r of placed.rows) {
  check(r.inScene, `${r.name}: both its model and its base are in the scene graph`);
  // Against the bilinear height, which is a different function over different data. The
  // window is generous on purpose: on a sharp summit the drawn mesh and the height data
  // genuinely disagree by metres, and that disagreement is the reason these are seated on
  // the drawn surface in the first place. What it catches is a monument left tens of
  // metres out - the failure that actually happens.
  check(Math.abs(r.y - r.bilinear) < 30,
    `${r.name}: sits within 30 m of the height data (${(r.y - r.bilinear).toFixed(1)} m)`);
  check(r.baseBottom < r.bilinear,
    `${r.name}: its base reaches below the surface rather than resting on air`
    + ` (${(r.bilinear - r.baseBottom).toFixed(2)} m under)`);
}

check(problems.length === 0, `no page errors (${problems.length})`);
if (problems.length) console.log(`    ${problems.join('\n    ')}`);
await browser.close();

console.log(failures.length ? `\n${failures.length} FAILED` : '\nAll checks passed');
process.exit(failures.length ? 1 : 0);
