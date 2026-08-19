#!/usr/bin/env node
// The glaciers, from three fixed vantages, with and without the ice - the "before and after"
// bench for the change that turned them from a sheet of geometry into a mask (2026-08-19).
//
// FIXED VANTAGES ON PURPOSE. The whole question about a glacier is whether the ice follows
// the ground, and that can only be judged by comparing the same camera to itself: the shots
// are named with a tag (`node tools/dev/probe-glaciers.mjs before`) so two runs of different
// code end up side by side in tools/dev/logs. The three are the biggest glacier in the park
// from above its tongue, the same one at walking height ON it, and the Sengie ice on the east
// side - the one whose outline has 308 points, so a rasterising mistake shows there first.
//
// It also prints whether the old sheet is in the scene at all, and reads its triangle count
// the INDEX-AWARE way: that geometry is indexed, so position.count is a vertex count and
// dividing it by three gives 96,988 - a number that is not a triangle count of anything. The
// real figure is 563,567.
//
// Pictures come from tools/lib/canvas-capture.mjs, so they cost seconds rather than the
// minutes page.screenshot() costs on this scene - and they contain no DOM, which is why the
// HUD is hidden rather than merely ignored.
//
// Usage: tools/dev/start-dev.sh && node tools/dev/probe-glaciers.mjs [tag]

import { chromium } from 'playwright';
import { captureCanvas } from '../lib/canvas-capture.mjs';
const tag = process.argv[2] ?? 'before';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 620 } });
const problems = [];
page.on('pageerror', (e) => problems.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
await page.goto('http://localhost:5173', { waitUntil: 'load' });
await page.waitForFunction(() => window.__pngp?.getGroundHeight?.(), null, { timeout: 180000 });
await page.waitForFunction(() => (window.__pngp.terrain?.heightTier?.mix ?? 0) >= 1, null, { timeout: 300000 }).catch(() => {});
await page.addStyleTag({ content: '#top-left,#nav-hud,#env-controls,#credits-box,#fps,#controls-hint,#dev-note,#poi-info,#look-diag,#audio-diag,#compass,#view-actions,#poi-search,.poi-label{display:none!important}' });
await page.waitForTimeout(3000);
// Three vantages over the ice, chosen from water.json's own polygons: the biggest
// glacier from above its tongue, the same one at walking height on its edge, and the
// Sengie ice on the east side, which is the one with 308 outline points.
const shots = [
  { file: 'gliairetta-air', at: [-25454, 4000, 16400], look: [-25454, 3050, 14843] },
  { file: 'gliairetta-foot', at: [-25100, 0, 15500], look: [-25454, 3000, 14500], onGround: true },
  { file: 'sengie-air', at: [2562, 3850, 15000], look: [2562, 3050, 13305] },
];
for (const s of shots) {
  const info = await page.evaluate((s) => {
    const cam = window.__pngp.camera;
    window.__pngp.controls.mode = 'fly';
    const y = s.onGround ? window.__pngp.getGroundHeight()(s.at[0], s.at[2]) + 1.7 : s.at[1];
    cam.position.set(s.at[0], y, s.at[2]);
    cam.lookAt(...s.look);
    cam.updateMatrixWorld(true);
    const glaciers = window.__pngp.scene.getObjectByName('water-glaciers');
    return {
      camY: Math.round(y),
      // Index-aware: this geometry IS indexed, so position.count is vertices and
      // dividing it by three gives a number that is not a triangle count at all.
      glacierTris: glaciers
        ? (glaciers.geometry.index ? glaciers.geometry.index.count : glaciers.geometry.attributes.position.count) / 3
        : 0,
      glacierInScene: Boolean(glaciers),
    };
  }, s);
  await page.waitForTimeout(4500);
  await captureCanvas(page, `tools/dev/logs/glacier-${s.file}-${tag}.png`);
  console.log(`${s.file}: cam y ${info.camY}, glacier mesh ${info.glacierInScene ? `${info.glacierTris} triangles` : 'ABSENT'}`);
}
if (problems.length) console.log(problems.join('\n'));
await browser.close();
