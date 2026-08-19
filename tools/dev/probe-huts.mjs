#!/usr/bin/env node
// The 51 rifugi and bivacchi as buildings (src/huts.js, 2026-08-19): are they there,
// are they PLANTED, and did the marker post step aside for them?
//
// Three things it deliberately does not do:
//
// 1. It does not verify the seating with the sampler that did the seating.
//    createHuts() seats each building on sampleRenderedHeight at its four corners, so
//    asking that same function whether the answer is right can only prove the
//    assignment ran (docs/ARCHITECTURE.md §13.9, written down after exactly this
//    mistake and then made again the same day). Two independent readings instead:
//    the BILINEAR height, which is a different function over different data, and a
//    picture, which is what the user actually judges.
// 2. It does not ask huts.hasBuilding() whether the post is hidden. It reads the POST
//    ITSELF - the merged LineSegments' position attribute in poi.js - because the
//    question is whether the drawn geometry changed, not whether a predicate agrees
//    with itself.
// 3. It does not use page.screenshot(). See tools/lib/canvas-capture.mjs: on this
//    scene that call is minutes and readPixels is seconds.
//
// Usage: tools/dev/start-dev.sh && node tools/dev/probe-huts.mjs [url] [--models=0|1]

import { chromium } from 'playwright';
import { captureCanvas } from '../lib/canvas-capture.mjs';

const argv = process.argv.slice(2);
const flag = (name, dflt) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit === undefined ? dflt : hit.slice(name.length + 3);
};
const url = argv.find((a) => !a.startsWith('--')) ?? 'http://localhost:5173';
const MODELS = flag('models', '1'); // High by default: it is the level with the flag
const OUT_DIR = 'tools/dev/logs';

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 900, height: 560 } });
page.setDefaultTimeout(180000);
const problems = [];
page.on('pageerror', (e) => problems.push(`[pageerror] ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`[console.error] ${m.text()}`); });

await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__pngp?.getHuts?.(), null, { timeout: 180000 });
await page.evaluate((v) => {
  const sel = document.getElementById('env-models');
  sel.value = String(v);
  sel.dispatchEvent(new Event('change'));
}, MODELS);
await page.waitForTimeout(2500);

// ---------------------------------------------------------------- what was built
const built = await page.evaluate(() => {
  const huts = window.__pngp.getHuts();
  const byKind = {};
  for (const p of huts.placements) byKind[p.kind] = (byKind[p.kind] ?? 0) + 1;
  return { count: huts.placements.length, byKind, triangles: huts.triangles };
});
console.log(`Placed ${built.count} buildings: ${Object.entries(built.byKind).map(([k, n]) => `${n} ${k}`).join(', ')}`);
console.log(`Triangles: ${Object.entries(built.triangles).map(([k, n]) => `${k} ${n}`).join(', ')}`);
console.log(`Models control: ${MODELS === '1' ? 'High' : 'Standard'}`);

// ------------------------------------------------- planted, by an independent reading
//
// For every building: the seated height against the BILINEAR height of the same point
// (src/terrain.js's other sampler, over the height data rather than over the drawn
// mesh), and the foundation's reach. A building is wrong if it stands well above the
// surface with nothing under it, or if its own floor is below it.
const seating = await page.evaluate(() => {
  const huts = window.__pngp.getHuts();
  const bilinear = window.__pngp.getBilinearHeight();
  const rows = huts.placements.map((p) => {
    const b = bilinear(p.x, p.z);
    return {
      name: p.poi.name, kind: p.kind, y: p.y, bilinear: b, drop: p.drop,
      gap: p.y - b, // + means the building floor is above the data surface
      floor: p.y - p.drop, // where the foundation ends
    };
  });
  return rows;
});
const gaps = seating.map((r) => r.gap).sort((a, b) => a - b);
const q = (f) => gaps[Math.min(gaps.length - 1, Math.floor(f * gaps.length))];
console.log(`\nSeated height minus BILINEAR height, over all ${gaps.length}:`);
console.log(`  min ${gaps[0].toFixed(1)} m   10% ${q(0.1).toFixed(1)}   median ${q(0.5).toFixed(1)}`
  + `   90% ${q(0.9).toFixed(1)}   max ${gaps[gaps.length - 1].toFixed(1)} m`);
const suspect = seating.filter((r) => r.gap > 12 || r.floor > r.bilinear);
console.log(`  buildings whose floor is ABOVE the data surface (would stand on air): `
  + `${seating.filter((r) => r.floor > r.bilinear).length}`);
if (suspect.length) {
  console.log('  worst offenders:');
  for (const r of suspect.sort((a, b) => b.gap - a.gap).slice(0, 6)) {
    console.log(`    ${r.name.slice(0, 34).padEnd(34)} gap ${r.gap.toFixed(1)} m, foundation ${r.drop.toFixed(1)} m deep`);
  }
}

// --------------------------------------------------------- the post, read from the line
async function postLengthsAt(x, z, y) {
  return page.evaluate(({ x, z, y }) => {
    const cam = window.__pngp.camera;
    window.__pngp.controls.mode = 'fly';
    cam.position.set(x, y, z);
    cam.updateMatrixWorld(true);
    const index = window.__pngp.getPoiIndex();
    index.updateMarkers(cam);
    // The hut category's own merged LineSegments, straight out of the scene: two
    // vertices per POI, so a post's length is the difference of their Y.
    const line = window.__pngp.scene.getObjectByName('poi-hut');
    const pos = line.geometry.getAttribute('position').array;
    const huts = window.__pngp.getHuts();
    const pois = index.manifest.pois.filter((p) => p.category === 'hut');
    let standing = 0;
    let collapsed = 0;
    const rows = [];
    pois.forEach((poi, i) => {
      const len = pos[i * 6 + 4] - pos[i * 6 + 1];
      const dist = Math.hypot(poi.local.x - x, poi.local.z - z);
      if (len > 0.01) standing += 1; else collapsed += 1; // zero-length is the hidden state
      rows.push({ name: poi.name, dist, len, building: huts.hasBuilding(poi) });
    });
    return { standing, collapsed, rows };
  }, { x, z, y });
}

// ------------------------------------------------------------------------ the pictures
//
// One rifugio and one bivouac, each from 25 m and from the side the door is on, which
// is the downhill side - so the shot is the arrival, which is the only view of these
// buildings anyone gets on foot.
const targets = await page.evaluate(() => {
  const huts = window.__pngp.getHuts();
  const pick = (kind, i = 0) => huts.placements.filter((p) => p.kind === kind)[i];
  return ['rifugio', 'bivouac'].map((kind) => {
    const p = pick(kind);
    // 25 m out along the way the door faces (+Z of the model, rotated by its yaw).
    const dx = Math.sin(p.yaw) * 25;
    const dz = Math.cos(p.yaw) * 25;
    return { kind, name: p.poi.name, x: p.x, z: p.z, y: p.y, camX: p.x + dx, camZ: p.z + dz, drop: p.drop };
  });
});

for (const t of targets) {
  await page.evaluate((t) => {
    const cam = window.__pngp.camera;
    window.__pngp.controls.mode = 'fly';
    const ground = window.__pngp.getGroundHeight()(t.camX, t.camZ);
    cam.position.set(t.camX, ground + 1.7, t.camZ); // eye height, standing
    cam.lookAt(t.x, t.y + 2, t.z);
    cam.updateMatrixWorld(true);
  }, t);
  await page.waitForTimeout(4000);
  const file = `${OUT_DIR}/huts-${t.kind}.png`;
  await captureCanvas(page, file);
  console.log(`\n${t.kind}: ${t.name} - standing 25 m out on the door side, foundation ${t.drop.toFixed(1)} m -> ${file}`);
  const near = await postLengthsAt(t.camX, t.camZ, (await page.evaluate(() => window.__pngp.camera.position.y)));
  const mine = near.rows.find((r) => r.name === t.name);
  console.log(`  posts: ${near.collapsed} collapsed, ${near.standing} standing of ${near.rows.length}`);
  console.log(`  this one: ${mine.dist.toFixed(0)} m away, post ${mine.len.toFixed(2)} m, building drawn ${mine.building}`);
  const wrong = near.rows.filter((r) => (r.building && r.len > 0.01) || (!r.building && r.len <= 0.01));
  console.log(`  disagreements between the drawn post and the building: ${wrong.length}`
    + (wrong.length ? ` (${wrong.slice(0, 3).map((r) => `${r.name} ${r.dist.toFixed(0)}m len ${r.len.toFixed(2)}`).join('; ')})` : ''));
  // The LABEL has to survive, which is the other half of the user's decision - and the
  // canvas capture above cannot show it, because a CSS2DObject is DOM drawn OVER the
  // canvas and readPixels never sees it. So it is read from the DOM instead.
  const label = await page.evaluate((name) => {
    const el = [...document.querySelectorAll('.poi-label')].find((e) => e.textContent.includes(name));
    if (!el) return { found: false };
    const r = el.getBoundingClientRect();
    return {
      found: true,
      text: el.textContent.trim(),
      onScreen: r.width > 0 && r.height > 0 && r.top < window.innerHeight && r.bottom > 0,
      visible: el.offsetParent !== null,
    };
  }, t.name);
  console.log(`  label: ${label.found ? `"${label.text}" visible ${label.visible}, on screen ${label.onScreen}` : 'NOT IN THE DOM'}`);
}

if (problems.length) console.log(`\n${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
else console.log('\nNo page errors.');
await browser.close();
