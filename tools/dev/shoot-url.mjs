#!/usr/bin/env node
// Shoot the viewer AT A SHARE LINK - the exact view someone sends you.
//
// Written 2026-08-19, when the user reported three defects on the refuge and gave the
// viewpoint as a URL: "vedi da questa angolazione http://localhost:5173/#at=45.51569,
// 7.08455,2288&look=274,19&mode=walk&time=0.150&sky=clear". shoot.mjs cannot do that -
// it drives the search box and then flies, so it lands at a place, not at a camera. The
// hash IS the camera (src/viewstate.js), so the whole job here is to open it and wait
// for the scene to be up before taking the picture.
//
// The picture comes from tools/lib/canvas-capture.mjs, so it is seconds rather than the
// minutes page.screenshot() costs on this scene. That also means it contains no DOM: no
// HUD, no labels. It prints the HUD's own text instead, which is the part of it worth
// having in a log.
//
// Usage: tools/dev/start-dev.sh && node tools/dev/shoot-url.mjs "<url with #hash>" [out.png]

import { chromium } from 'playwright';
import { captureCanvas } from '../lib/canvas-capture.mjs';

const url = process.argv[2];
if (!url) {
  console.error('usage: node tools/dev/shoot-url.mjs "<url>" [out.png]');
  process.exit(2);
}
const out = process.argv[3] ?? 'tools/dev/logs/shoot-url.png';

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1000, height: 620 } });
const problems = [];
page.on('pageerror', (e) => problems.push(`[pageerror] ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`[console.error] ${m.text()}`); });

await page.goto(url, { waitUntil: 'load' });
// WAIT ON THE HUD, NOT ON THE DEV HANDLE. window.__pngp only exists in a dev build -
// Vite strips the branch from a production one - so waiting for it timed out against
// the published site, which is the one case this tool exists for: a share link comes
// from the live viewer. The HUD's position line gets its "alt ... m" the moment the
// terrain can answer a height query, which is the same moment the view in the link
// becomes the view, and it is there in both builds.
await page.waitForFunction(
  () => /alt\s+-?\d+\s*m/.test(document.getElementById('nav-position')?.textContent ?? ''),
  null,
  { timeout: 180000 },
);
await page.waitForTimeout(6000); // trails, water, huts, and a few real frames at ~1 fps

const hud = await page.evaluate(() => ({
  position: document.getElementById('nav-position')?.textContent?.trim(),
  nearest: document.getElementById('nav-nearest')?.textContent?.trim(),
  // Dev only, and optional for the same reason as the wait above.
  camera: window.__pngp ? [...window.__pngp.camera.position].map((v) => Math.round(v)) : null,
}));
console.log(`${hud.position}\n${hud.nearest}`
  + (hud.camera ? `\nlocal metres: ${hud.camera.join(', ')}` : '\n(production build: no dev handle)'));
await captureCanvas(page, out);
console.log(`-> ${out}`);
if (problems.length) console.log(`\n${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
await browser.close();
