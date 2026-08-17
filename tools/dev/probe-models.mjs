#!/usr/bin/env node
// What the high-detail flora/fauna option costs, and whether it actually draws
// anything - measured off the running page rather than reasoned about (2026-08-17).
//
// It does NOT report fps, deliberately: this browser is SwiftShader at about 1 frame
// per second, so any frame time here measures the software rasteriser and not the
// user's GPU. The same limit is why the terrain tier was decided by the user's own
// eyes ("selezionando Terrain: High l'fps sta sopra il 25", 2026-08-14).
//
// It measures two different things, because this feature has already proved that one
// of them alone lies:
//
//   TRIANGLES, attributed to the meshes this option governs. Not differenced from
//   renderer.info's whole-scene total: the terrain quadtree keeps refining for
//   seconds after the camera moves, and two identical Standard frames differed by
//   44,384 triangles - more than half of what was being attributed to the option.
//
//   PIXELS, of each tree mesh alone. A collapsed instance still counts its
//   triangles, so when the two tree materials shared one compiled program and the
//   fine mesh drew nothing at all, the triangle count reported it as working. The
//   user found that by looking. A counter is not a pixel.
//
// Both pixel traps this went through are worth not repeating:
//   - page.screenshot() captures the whole PAGE, so the HUD's bright DOM text lands
//     in the count over a cleared canvas. Five wildly different isolations all came
//     back at exactly 2.09% of the frame, because the count WAS the HUD. Shoot the
//     canvas element instead.
//   - gl.readPixels() on the default framebuffer returns nothing here (antialias is
//     on, so it is multisampled and not directly readable), which reads as "no trees"
//     for every case - including the one known to work.
//
// Usage: tools/dev/start-dev.sh && node tools/dev/probe-models.mjs [url]
import { chromium } from 'playwright';
import { decode } from 'fast-png';

const url = process.argv[2] ?? 'http://localhost:5173';
const OUT_DIR = 'tools/dev/logs';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});

await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(
  () => window.__pngp?.getWildlife?.() && window.__pngp.getVegetation?.(),
  { timeout: 120000 },
);

// Two sites, chosen from the page's own data rather than typed in here, because the
// two halves of this option are visible in different places. Measuring the trees at
// the animal site was the first mistake: chamois live above the treeline, so not one
// of the 2,174 near tree slots held a tree and the frame barely changed.
const sites = await page.evaluate(() => {
  const snap = window.__pngp.getWildlife().snapshot();
  const animal = snap.filter((a) => a.species === 'ibex' || a.species === 'chamois')
    .sort((a, b) => a.camDistM - b.camDistM)[0];
  // Squirrels are placed by a canopy MINIMUM, so the densest canopy the page knows
  // about is under one of them.
  const wood = [...snap].sort((a, b) => b.canopy - a.canopy)[0];
  return {
    animal: animal ? { x: animal.x, z: animal.z, species: animal.species } : null,
    wood: wood ? { x: wood.x, z: wood.z, canopy: wood.canopy } : null,
  };
});

async function stand(at, backOff) {
  return page.evaluate(({ at, backOff }) => {
    const p = window.__pngp;
    if (!at) return { failed: 'no site' };
    // CALLED, not referenced: the handle is `() => terrainSurface?.sampleRenderedHeight`,
    // so it returns the sampler rather than a height.
    const h = p.getGroundHeight();
    const g = h(at.x + backOff, at.z + backOff);
    if (!Number.isFinite(g)) return { failed: `ground sampler gave ${g}` };
    p.camera.position.set(at.x + backOff, g + 1.7, at.z + backOff);
    p.getWildlife().update(1 / 60, p.camera);
    p.getVegetation().update(p.camera);
    return { ok: true, groundM: g };
  }, { at, backOff });
}

async function setLevel(level) {
  await page.evaluate((lv) => {
    const sel = document.getElementById('env-models');
    sel.value = String(lv);
    sel.dispatchEvent(new Event('change'));
    const p = window.__pngp;
    p.getWildlife().update(1 / 60, p.camera);
    p.getVegetation().update(p.camera);
  }, level);
}

// The triangles of the meshes this option governs, from their own instance counts.
async function triangles() {
  return page.evaluate(() => {
    const p = window.__pngp;
    p.renderer.render(p.scene, p.camera);
    const veg = p.scene.getObjectByName('vegetation-lod').children.map((m) => ({
      name: m.name,
      visible: m.visible,
      tris: m.geometry.index.count / 3,
      n: m.geometry.instanceCount,
    }));
    const wild = p.scene.getObjectByName('wildlife').children
      .map((m) => ({ name: m.name, visible: true, tris: m.geometry.index.count / 3, n: m.count }))
      .filter((r) => r.n > 0);
    const rows = [...veg.map((v) => ({ ...v, n: v.visible ? v.n : 0 })), ...wild];
    return {
      rows,
      total: rows.reduce((t, r) => t + r.n * r.tris, 0),
      scene: p.renderer.info.render.triangles,
      calls: p.renderer.info.render.calls,
      near: p.getVegetation().nearInfo(),
    };
  });
}

// One tree mesh's own pixels. `which` is 'both', 'vegetation' (the coarse one) or
// 'vegetation-high'. Isolation is what makes this decisive: the far trees dominate any
// whole-forest count and are drawn by the coarse mesh either way, so two whole-forest
// frames match whether the fine mesh works or not.
async function treePixels(which, name) {
  await page.evaluate((w) => {
    const p = window.__pngp;
    window.__restore = [];
    // HIDE THE HUD, not just the other 3D objects. Playwright's element screenshot is
    // a page screenshot clipped to the element's box, not an isolated render of it -
    // so the HUD's DOM text, which sits over the canvas, lands in the count exactly as
    // it did with a full-page shot. That is the invariant that made five different
    // isolations all read 2.09% of the frame. The canvas is cleared to OPAQUE black
    // below, so with its siblings gone the shot is the scene and nothing else.
    window.__hudRestore = [];
    for (const el of document.body.children) {
      if (el === p.renderer.domElement) continue;
      window.__hudRestore.push([el, el.style.display]);
      el.style.display = 'none';
    }
    for (const c of p.scene.children) {
      window.__restore.push([c, c.visible]);
      if (c.name !== 'vegetation-lod') c.visible = false;
    }
    for (const m of p.scene.getObjectByName('vegetation-lod').children) {
      window.__restore.push([m, m.visible]);
      // Only ever NARROW what is shown - never switch on a mesh this level of detail
      // had switched off, or the measurement is of a mesh the option is not asking for.
      if (w !== 'both' && m.name !== w) m.visible = false;
    }
    p.renderer.setClearColor(0x000000, 1);
    p.renderer.render(p.scene, p.camera);
  }, which);
  // The CANVAS element, not the page: the HUD is not the scene.
  const img = decode(await page.locator('canvas').first()
    .screenshot({ path: `${OUT_DIR}/${name}.png`, timeout: 120000 }));
  await page.evaluate(() => {
    for (const [o, v] of window.__restore) o.visible = v;
    for (const [el, d] of window.__hudRestore) el.style.display = d;
  });
  let lit = 0;
  const n = img.width * img.height;
  for (let i = 0; i < n; i++) {
    const q = i * img.channels;
    if (img.data[q] + img.data[q + 1] + img.data[q + 2] > 45) lit++;
  }
  return { lit, total: n, pct: (lit / n) * 100 };
}

// ---- triangles, at the animal site -----------------------------------------
console.log(`\nAnimals, standing 21 m from the nearest ${sites.animal?.species ?? '(none found)'}`);
const placedA = await stand(sites.animal, 21);
if (placedA.failed) console.log(`  could not stand there: ${placedA.failed}`);
await setLevel(0);
const triStd = await triangles();
await setLevel(1);
const triHigh = await triangles();

for (const [label, t] of [['Standard', triStd], ['High', triHigh]]) {
  console.log(`  ${label}: ${t.total.toLocaleString()} triangles across trees+animals` +
    `  (whole scene ${t.scene.toLocaleString()}, ${t.calls} calls)`);
  for (const r of t.rows) {
    console.log(`    ${r.name.padEnd(20)} ${String(r.n).padStart(6)} x ${String(r.tris).padStart(5)} tris` +
      `${r.visible === false ? '  (hidden)' : ''}`);
  }
  console.log(`    near tree set ${t.near.count} of ${t.near.capacity}` +
    `${t.near.overflowed ? '  OVERFLOWED' : ''}`);
}
console.log(`  => High costs +${(triHigh.total - triStd.total).toLocaleString()} triangles` +
  ` (${(triHigh.total / triStd.total).toFixed(2)}x on those meshes)`);

// ---- pixels, in a wood -----------------------------------------------------
console.log(`\nTrees, standing IN A WOOD` +
  `${sites.wood ? ` (canopy ${sites.wood.canopy.toFixed(2)})` : ' (none found)'}`);
const placedW = await stand(sites.wood, 0);
if (placedW.failed) console.log(`  could not stand there: ${placedW.failed}`);

await setLevel(0);
const pxStd = await treePixels('both', 'models-trees-standard');
await setLevel(1);
const pxHiBoth = await treePixels('both', 'models-trees-high');
const pxHiCoarse = await treePixels('vegetation', 'models-trees-high-coarse');
const pxHiFine = await treePixels('vegetation-high', 'models-trees-high-fine');

const px = (m) => `${String(m.lit).padStart(7)} px  ${m.pct.toFixed(2)}% of the canvas`;
console.log(`  Standard, both meshes       ${px(pxStd)}`);
console.log(`  High, both meshes           ${px(pxHiBoth)}`);
console.log(`  High, coarse mesh alone     ${px(pxHiCoarse)}`);
console.log(`  High, FINE mesh alone       ${px(pxHiFine)}`);

const problems = [];
if (pxStd.lit === 0) {
  problems.push('Standard draws no trees either - the INSTRUMENT is wrong, not the feature.'
    + ' Do not read anything else here as a result.');
} else {
  if (pxHiFine.lit === 0) problems.push('the fine mesh draws NOTHING - the near trees are missing');
  if (pxHiBoth.lit < pxStd.lit * 0.6) problems.push('High draws far fewer tree pixels than Standard');
  if (pxHiCoarse.lit >= pxStd.lit) {
    problems.push('the near hole never opens - the coarse mesh still draws its near trees under High,'
      + ' so those trees are being drawn twice');
  }
}
console.log('');
if (problems.length) for (const t of problems) console.log(`  FAIL: ${t}`);
else console.log('  The fine mesh draws, the hole opens, and no tree is drawn twice.');
console.log('\nfps is NOT measured here - see the header. That number is the user\'s to give.');

await browser.close();
if (errors.length) {
  console.log(`\n${errors.length} page error(s):`);
  for (const e of errors.slice(0, 8)) console.log(`  ${e}`);
  process.exit(1);
}
console.log('No page errors.');
