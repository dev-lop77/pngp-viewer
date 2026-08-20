#!/usr/bin/env node
// The moving atlas: does it land where it says, and does it hide its own seams?
//
// A mosaic can fail in three ways that a single clip cannot, and all three are invisible in a
// screenshot taken from the wrong place:
//   - the atlas placed one sheet out, which on this terrain still looks like a photograph;
//   - a seam at a sheet boundary, where two 20 cm flights were radiometrically matched but a
//     UV mistake would show as a hard line;
//   - a cell with no coverage painting grey or black instead of nothing.
//
// So: a plan view of the WHOLE atlas with the distance fade switched off (which is the atlas
// itself, drawn on the terrain, comparable against the source sheets), and an eye-height frame
// standing ON a sheet boundary.
//
// Usage: tools/dev/start-dev.sh && node tools/dev/probe-ortho-atlas.mjs [tag]

import { chromium } from 'playwright';
import { captureCanvas } from '../lib/canvas-capture.mjs';

const tag = process.argv[2] ?? 'lepont';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 900, height: 560 } });
const problems = [];
page.on('pageerror', (e) => problems.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
await page.goto('http://localhost:5173', { waitUntil: 'load' });
await page.waitForFunction(() => window.__pngp?.getGroundHeight?.(), null, { timeout: 180000 });
await page.waitForFunction(() => (window.__pngp.terrain?.heightTier?.mix ?? 0) >= 1, null, { timeout: 300000 }).catch(() => {});
await page.waitForTimeout(3000);
await page.keyboard.press('o');
await page.waitForFunction(() => /sheets/.test(document.getElementById('dev-note')?.textContent ?? ''), null, { timeout: 120000 });
console.log(await page.evaluate(() => document.getElementById('dev-note').textContent));
await page.addStyleTag({ content: '#top-left,#nav-hud,#env-controls,#credits-box,#fps,#controls-hint,#dev-note,#poi-info,#look-diag,#audio-diag,#compass,#view-actions,#poi-search,.poi-label{display:none!important}' });

const rect = await page.evaluate(() => {
  const r = window.__pngp.ortho.rect.value;
  return { x: r.x, z: r.y, w: r.z, h: r.w };
});
console.log(`atlas rect: local x ${rect.x.toFixed(0)}..${(rect.x + rect.w).toFixed(0)},`
  + ` z ${rect.z.toFixed(0)}..${(rect.z + rect.h).toFixed(0)} (${rect.w} m square)`);
console.log('stats:', JSON.stringify(await page.evaluate(() => ({ ...window.__pngp.ortho.stats }))));

// 1. The whole atlas, from straight above, with no distance fade.
await page.evaluate(({ rect }) => {
  window.__pngp.ortho.nearM.value = 1e6;
  window.__pngp.ortho.farM.value = 2e6;
  const cam = window.__pngp.camera;
  window.__pngp.controls.mode = 'fly';
  const cx = rect.x + rect.w / 2;
  const cz = rect.z + rect.h / 2;
  cam.position.set(cx, 9000, cz);
  cam.lookAt(cx, 0, cz + 0.001);
  cam.updateMatrixWorld(true);
}, { rect });
await page.waitForTimeout(5000);
await captureCanvas(page, `tools/dev/logs/atlas-plan-${tag}.png`);
console.log('plan view shot');

// 2. Standing ON a sheet boundary, which is where a UV mistake shows.
await page.evaluate(({ rect }) => {
  window.__pngp.ortho.nearM.value = 300;
  window.__pngp.ortho.farM.value = 650;
  const cam = window.__pngp.camera;
  // The boundary between the middle and the eastern column of the 3x3.
  const bx = rect.x + (rect.w * 2) / 3;
  const bz = rect.z + rect.h / 2;
  const g = window.__pngp.getGroundHeight()(bx, bz);
  const y = g + 60;
  cam.position.set(bx, y, bz);
  cam.lookAt(bx, y - 60, bz - 120);
  cam.updateMatrixWorld(true);
}, { rect });
await page.waitForTimeout(4500);
await captureCanvas(page, `tools/dev/logs/atlas-seam-${tag}.png`);
console.log('seam view shot');

// 3. Walk across a boundary and confirm the atlas refills rather than running out.
const before = await page.evaluate(() => ({ ...window.__pngp.ortho.stats }));
await page.evaluate(async ({ rect }) => {
  const cam = window.__pngp.camera;
  // Two sheets west, which must cross at least one boundary.
  cam.position.set(rect.x + rect.w / 6, cam.position.y, rect.z + rect.h / 2);
  await window.__pngp.ortho.update(cam.position.x, cam.position.z);
}, { rect });
const after = await page.evaluate(() => ({ ...window.__pngp.ortho.stats }));
console.log(`refills ${before.refills} -> ${after.refills}, last took ${after.lastRefillMs.toFixed(0)} ms,`
  + ` atlas now holds ${after.cells} cells (${after.empty} empty)`);
if (problems.length) console.log(`\n${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
await browser.close();
