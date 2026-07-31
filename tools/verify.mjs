#!/usr/bin/env node
// Playwright screenshot/console-error check against a running dev/preview
// server - the slot docs/ARCHITECTURE.md §4 already reserved for this
// ("verify.mjs (optional)"). Promoted from an ad-hoc debugging session
// (2026-07-30, phase 3) that found two real, silent WebGL failures no
// amount of reading the code would have caught: a custom ShaderMaterial
// missing the logarithmic-depth-buffer chunks (renders as nothing, zero
// console output) and a missing `#include <common>` (a real GLSL compile
// error, but only visible in the browser console, not `npm run build`).
//
// Requires a server already running (tools/dev/start-dev.sh or
// start-preview.sh) - this script doesn't start/stop one, same "do one
// thing" split as those scripts.
//
// Usage: node tools/verify.mjs [url]  (default http://localhost:5173)

import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:5173';
const SCREENSHOT_FILE = 'tools/verify-screenshot.png';

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

const problems = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') problems.push(`[console.error] ${msg.text()}`);
});
page.on('pageerror', (err) => problems.push(`[pageerror] ${err.message}`));

try {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
} catch (e) {
  console.error(`Could not reach ${url} - is a dev/preview server running? (tools/dev/start-dev.sh)`);
  console.error(e.message);
  process.exit(1);
}
await page.waitForTimeout(4000); // let async loaders (terrain/trails/poi/water) settle and render a few frames

const glInfo = await page.evaluate(() => {
  const canvas = document.querySelector('canvas');
  if (!canvas) return { error: 'no canvas found' };
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) return { error: 'no webgl context' };
  return { contextType: canvas.getContext('webgl2') ? 'webgl2' : 'webgl', isContextLost: gl.isContextLost() };
});

await page.screenshot({ path: SCREENSHOT_FILE });
await browser.close();

console.log(`WebGL: ${JSON.stringify(glInfo)}`);
console.log(`Screenshot: ${SCREENSHOT_FILE}`);
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log(p);
  process.exit(1);
} else {
  console.log('No console errors or page errors.');
}
