#!/usr/bin/env node
// The optional 0.5 m orthophoto over Le Pont, on and off, from the same camera.
//
// Two vantages, because they answer different questions: standing at the trailhead at eye
// height, which is where 10 m ground texels look worst and this is meant to help; and 250 m
// above it, where the near-only fade becomes a visible ring on the ground and has to be
// judged as a thing you can see rather than as a number in a uniform.
//
// It presses 'O' rather than writing ORTHO_MIX, so the download path the viewer would really
// take is the one under test - including the fact that nothing is fetched until asked.
//
// Usage: tools/dev/start-dev.sh && node tools/dev/probe-ortho.mjs [tag]

import { chromium } from 'playwright';
import { captureCanvas } from '../lib/canvas-capture.mjs';

const tag = process.argv[2] ?? 'lepont';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 620 } });
const problems = [];
page.on('pageerror', (e) => problems.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
await page.goto('http://localhost:5173', { waitUntil: 'load' });
await page.waitForFunction(() => window.__pngp?.getGroundHeight?.(), null, { timeout: 180000 });
await page.waitForFunction(() => (window.__pngp.terrain?.heightTier?.mix ?? 0) >= 1, null, { timeout: 300000 }).catch(() => {});
await page.waitForTimeout(3000);

// Le Pont, from the project's own poi.json - trailhead, Valsavarenche, 1,949.6 m.
const LE_PONT = { x: -11349.9, z: 12682.6 };
const shots = [
  { file: 'foot', lift: 1.7, heading: 262, pitch: -6 },
  { file: 'air', lift: 250, heading: 262, pitch: -32 },
];
async function place(s) {
  return page.evaluate(({ LE_PONT, s }) => {
    const cam = window.__pngp.camera;
    window.__pngp.controls.mode = 'fly';
    const ground = window.__pngp.getGroundHeight()(LE_PONT.x, LE_PONT.z);
    const y = ground + s.lift;
    const rad = (s.heading * Math.PI) / 180;
    const pitch = (s.pitch * Math.PI) / 180;
    cam.position.set(LE_PONT.x, y, LE_PONT.z);
    cam.lookAt(LE_PONT.x + Math.sin(rad) * Math.cos(pitch) * 100,
               y + Math.sin(pitch) * 100,
               LE_PONT.z - Math.cos(rad) * Math.cos(pitch) * 100);
    cam.updateMatrixWorld(true);
    return { ground: Math.round(ground), y: Math.round(y) };
  }, { LE_PONT, s });
}

await page.addStyleTag({ content: '#top-left,#nav-hud,#env-controls,#credits-box,#fps,#controls-hint,#poi-info,#look-diag,#audio-diag,#compass,#view-actions,#poi-search,.poi-label{display:none!important}' });

for (const s of shots) {
  const info = await place(s);
  await page.waitForTimeout(4000);
  await captureCanvas(page, `tools/dev/logs/ortho-${s.file}-off-${tag}.png`);
  console.log(`${s.file}: ground ${info.ground} m, eye ${info.y} m - shot WITHOUT`);
}

// First press downloads and switches it on. The dev note is the receipt.
await page.keyboard.press('o');
await page.waitForFunction(() => /orthophoto x1/.test(document.getElementById('dev-note')?.textContent ?? ''), null, { timeout: 120000 });
console.log('note:', await page.evaluate(() => document.getElementById('dev-note')?.textContent));
await page.addStyleTag({ content: '#dev-note{display:none!important}' });

for (const s of shots) {
  await place(s);
  await page.waitForTimeout(4000);
  await captureCanvas(page, `tools/dev/logs/ortho-${s.file}-on-${tag}.png`);
  console.log(`${s.file}: shot WITH`);
}
if (problems.length) console.log(`\n${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
await browser.close();
