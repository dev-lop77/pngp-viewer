#!/usr/bin/env node
// Is the blue in the plan view coming from the photograph or from us?
//
// The last time this question came up it was answered three times by reasoning and three
// times wrongly (docs/PROGRESS-ARCHIVE.md, 2026-08-20). So: the same camera, the same frame,
// the photograph off and then on, and a count of the pixels that actually changed. A colour
// that survives ORTHO_MIX = 0 is ours, whatever it looks like.
//
// Usage: tools/dev/start-dev.sh && node tools/dev/probe-ortho-ab.mjs [altitude]

import { chromium } from 'playwright';
import { captureCanvas } from '../lib/canvas-capture.mjs';
import { readFileSync } from 'node:fs';
import { decode } from 'fast-png';

const ALT = Number(process.argv[2] ?? 9000);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 900, height: 560 } });
await page.goto('http://localhost:5173', { waitUntil: 'load' });
await page.waitForFunction(() => window.__pngp?.getGroundHeight?.(), null, { timeout: 180000 });
await page.waitForTimeout(3000);
await page.keyboard.press('o');
await page.waitForFunction(() => (window.__pngp.ortho?.stats?.sheets ?? 0) > 0
  && window.__pngp.ortho.stats.cell, null, { timeout: 120000 });
await page.addStyleTag({ content: '#top-left,#nav-hud,#env-controls,#credits-box,#fps,#controls-hint,#dev-note,#poi-info,#look-diag,#audio-diag,#compass,#view-actions,#poi-search,.poi-label{display:none!important}' });

// One camera, fixed for both frames, over the middle of the atlas with the distance fade off.
await page.evaluate((alt) => {
  const r = window.__pngp.ortho.rect.value;
  window.__pngp.ortho.nearM.value = 1e6;
  window.__pngp.ortho.farM.value = 2e6;
  const cam = window.__pngp.camera;
  window.__pngp.controls.mode = 'fly';
  cam.position.set(r.x + r.z / 2, alt, r.y + r.w / 2);
  cam.lookAt(r.x + r.z / 2, 0, r.y + r.w / 2 + 0.001);
  cam.updateMatrixWorld(true);
}, ALT);
await page.waitForTimeout(5000);

async function shot(mix, name) {
  await page.evaluate((m) => { window.__pngp.ortho.mix.value = m; }, mix);
  await page.waitForTimeout(3500);
  const path = `tools/dev/logs/ortho-ab-${name}.png`;
  await captureCanvas(page, path);
  const img = decode(readFileSync(path));
  // captureCanvas writes 8-bit RGBA. Assert it rather than assume it: a depth surprise here
  // is landmine 18 all over again, and it would silently compare the wrong bytes.
  if (img.depth !== 8 || img.channels !== 4) throw new Error(`expected 8-bit RGBA, got depth ${img.depth} channels ${img.channels}`);
  return img;
}
const off = await shot(0, 'off');
const on = await shot(1, 'on');
await browser.close();

// "Blue" here means what the eye called blue in the plan view: a clear blue cast, not a grey.
const isBlue = (r, g, b) => b > r + 25 && b > g + 15;
let bothBlue = 0, onlyOff = 0, onlyOn = 0, changed = 0, total = 0, sumDelta = 0;
for (let k = 0; k < off.data.length; k += 4) {
  const [r0, g0, b0] = [off.data[k], off.data[k + 1], off.data[k + 2]];
  const [r1, g1, b1] = [on.data[k], on.data[k + 1], on.data[k + 2]];
  const d = Math.abs(r1 - r0) + Math.abs(g1 - g0) + Math.abs(b1 - b0);
  total += 1; sumDelta += d;
  if (d > 12) changed += 1;
  const a = isBlue(r0, g0, b0), b = isBlue(r1, g1, b1);
  if (a && b) bothBlue += 1; else if (a) onlyOff += 1; else if (b) onlyOn += 1;
}
const pc = (n) => `${((n / total) * 100).toFixed(1)}%`;
console.log(`frame ${off.width}x${off.height}, ${total} pixels`);
console.log(`the photograph changed ${pc(changed)} of them, mean delta ${(sumDelta / total).toFixed(1)}/765`);
console.log(`blue with the photo OFF and ON:  ${pc(bothBlue)}  <- ours: the photograph did not touch it`);
console.log(`blue only with the photo OFF:    ${pc(onlyOff)}  <- ours, and the photograph covered it`);
console.log(`blue only with the photo ON:     ${pc(onlyOn)}  <- the photograph's own blue`);
