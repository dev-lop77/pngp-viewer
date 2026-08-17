#!/usr/bin/env node
// Does the water follow the drawn terrain when the height tier is on? (2026-08-17)
//
// The user's report: at Le Pont a stream is not anchored to the ground with Terrain on
// Medium or High. Every other layer either reads the tier in its own shader (terrain,
// vegetation, groundcover) or re-seats itself on the live sampler (trails, POI,
// wildlife, edelweiss). water.js does neither: its geometry is built once from the
// elevations tools/build-hydrology.mjs baked into water.json.
//
// This measures the error rather than assuming it: for water vertices near Le Pont, the
// vertex's own Y against the surface the terrain actually draws under it, at each tier
// level. Reported per feature KIND, because they should not all be treated the same - a
// river follows the ground, a lake surface is level.
//
// Usage: tools/dev/start-dev.sh && node tools/dev/probe-water-tier.mjs
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:5173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 700 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__pngp?.getGroundHeight?.(), { timeout: 120000 });

// Le Pont is the spawn, so the camera is already there.
const here = await page.evaluate(() => ({
  x: window.__pngp.camera.position.x, z: window.__pngp.camera.position.z,
}));

async function measure(tierLevel) {
  await page.evaluate(async (lv) => {
    const sel = document.getElementById('env-terrain');
    sel.value = String(lv);
    sel.dispatchEvent(new Event('change'));
  }, tierLevel);
  // The tier downloads and then cross-fades over 0.5 s; wait for the mix to settle
  // rather than sleeping a guessed amount.
  await page.waitForFunction((lv) => {
    const t = window.__pngp.terrain;
    if (!t) return false;
    // The tier's own reported mix, the same field tools/test-height-tier.mjs waits
    // on - not a guessed sleep, because the level downloads and then ramps over 0.5 s.
    const mix = t.heightTier?.mix ?? 0;
    return lv === 0 ? mix === 0 : mix >= 1;
  }, tierLevel, { timeout: 180000 }).catch(() => {});
  return page.evaluate(({ here }) => {
    const p = window.__pngp;
    const h = p.getGroundHeight();
    // Not just the water. alignToGround() runs ONCE at spawn for trails and POI, and
    // the default tier level loads AFTER the first frame - so they are seated against a
    // surface that then moves under them, exactly as the water is. Measured rather than
    // assumed, since the user only reported the stream.
    const out = {};
    const meshes = [];
    for (const name of ['water', 'trails', 'poi']) {
      const g = p.scene.getObjectByName(name);
      if (g) meshes.push(...g.children.map((m) => ({ m, group: name })));
    }
    for (const { m: mesh, group: gname } of meshes) {
      const pos = mesh.geometry?.getAttribute('position');
      if (!pos) continue;
      const errs = [];
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i); const y = pos.getY(i); const z = pos.getZ(i);
        if (Math.hypot(x - here.x, z - here.z) > 1500) continue; // near Le Pont only
        const ground = h(x, z);
        if (!Number.isFinite(ground)) continue;
        errs.push(y - ground);
      }
      if (!errs.length) continue;
      errs.sort((a, b) => a - b);
      out[`${gname}/${mesh.name}`] = {
        n: errs.length,
        min: +errs[0].toFixed(2),
        median: +errs[Math.floor(errs.length / 2)].toFixed(2),
        max: +errs[errs.length - 1].toFixed(2),
        worstAbs: +Math.max(Math.abs(errs[0]), Math.abs(errs[errs.length - 1])).toFixed(2),
      };
    }
    return { out, mix: p.terrain?.heightTier?.mix ?? null, level: p.terrain?.heightTierLevel?.() ?? null };
  }, { here });
}

console.log(`\nWater, trail and POI vertices within 1500 m of Le Pont (${here.x.toFixed(0)}, ${here.z.toFixed(0)}).`);
console.log('Numbers are (vertex Y - drawn ground) in metres: + floats above, - sinks below.\n');
for (const [name, lv] of [['Standard (no tier)', 0], ['Medium, 10 m', 1], ['High, 5 m', 2]]) {
  const r = await measure(lv);
  console.log(`${name}  (tier level ${r.level}, mix ${r.mix}):`);
  if (r.failed) { console.log(`  ${r.failed}`); continue; }
  for (const [mesh, s] of Object.entries(r.out)) {
    console.log(`  ${mesh.padEnd(16)} ${String(s.n).padStart(5)} verts  ` +
      `min ${String(s.min).padStart(8)}  median ${String(s.median).padStart(7)}  ` +
      `max ${String(s.max).padStart(8)}  worst |${s.worstAbs}|`);
  }
  console.log('');
}

await browser.close();
if (errors.length) { console.log(`page errors: ${errors.slice(0, 5).join(' | ')}`); process.exit(1); }
console.log('No page errors.');
