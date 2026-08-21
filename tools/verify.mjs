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
// It also drives the ORTHOPHOTO switch, because the test that covers it is 207 s and sits in
// the slow list, so a publish check had stopped covering it. Here it is one click. And it
// reads the CREDITS panel, because attribution is a licence obligation and the orthophoto
// went live without its line.
//
// Usage: node tools/verify.mjs [url]  (default http://localhost:5173)

import { readFileSync } from 'node:fs';
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

// The orthophoto sheets the page asks for, with their status. Nothing here should fetch one
// unless the switch is used, and every one that is fetched must arrive.
const sheetResponses = [];
page.on('response', (r) => {
  const m = /\/data\/ortho\/(o[\w.-]+\.webp)$/.exec(r.url());
  if (m) sheetResponses.push({ name: m[1], status: r.status() });
});

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

// THE VERSION IN THE HUD MUST BE THE VERSION IN package.json. The build injects it, so they
// can only diverge if a stale bundle is being served - which is exactly the case that is hard
// to see by looking, and which cost a wrong diagnosis on 2026-08-21 when a CDN served the
// previous build and its missing credit line read as a code bug.
const expectedVersion = JSON.parse(readFileSync('package.json', 'utf8')).version;
const shownVersion = (await page.textContent('#app-version').catch(() => null))?.replace(/^v/, '');
if (shownVersion !== expectedVersion) {
  problems.push(`[version] the page shows ${shownVersion ?? 'nothing'}, package.json says ${expectedVersion}`);
}

// THE CREDITS, checked because attribution is a LICENCE OBLIGATION and not a courtesy. Four
// of this project's sources require specific wording, one of them requires a liability
// disclaimer to travel with any public communication, and every one of them is used modified.
// A layer that ships without its line is a licence breach that nothing else would notice: the
// orthophoto shipped that way on 2026-08-21 and it took the user asking to find it.
const REQUIRED_CREDITS = [
  'Regione Autonoma Valle d\'Aosta',            // the DTM and the trails, wording prescribed
  'Regione Piemonte',
  'TINITALY',
  'Copernicus WorldDEM-30',
  'do not incur any liability',                 // COP-DEM licence, Article 6(c)
  'Contains modified Copernicus Sentinel data', // prescribed verbatim by the EU legal notice
  'Orthophoto 2024',
  'OpenStreetMap',
];
let credits = 'no #credits-toggle on the page';
if (await page.locator('#credits-toggle').count()) {
  await page.click('#credits-toggle', { timeout: 120000 });
  await page.waitForTimeout(500);
  const text = (await page.textContent('#credits')) ?? '';
  const absent = REQUIRED_CREDITS.filter((r) => !text.includes(r));
  credits = `${REQUIRED_CREDITS.length - absent.length}/${REQUIRED_CREDITS.length} required attributions present`;
  for (const a of absent) problems.push(`[credits] missing required attribution: "${a}"`);
  await page.click('#credits-toggle', { timeout: 120000 }); // close it again, so the shot is the scene
  await page.waitForTimeout(300);
}

// THE ORTHOPHOTO SWITCH, driven the way a visitor drives it. This lives here rather than in
// the suite because the test that covers it, test-ortho-viewstate, is 207 s and had to go in
// the slow list - which left the switch uncovered at exactly the moment that matters, the
// publish. Here it costs one click against the site that is actually serving.
//
// Two things are being asserted at once, and the first is the whole premise of the feature:
// nothing is fetched until someone asks. Then, that asking works - 129 sheets on the site are
// worth nothing if the nine under the camera 404.
const orthoBeforeClick = sheetResponses.length;
let ortho = 'no #env-ortho control on the page';
if (await page.locator('#env-ortho').count()) {
  // A real click, not el.click(): it proves the control is reachable and not covered by
  // something. The long timeout is SwiftShader, which renders this viewport at about a
  // frame a second, so Playwright waits a long while for the element to look 'stable'.
  await page.click('#env-ortho', { timeout: 120000 });
  await page.waitForTimeout(25000); // the manifest, then nine sheets, over a real network
  const checked = await page.evaluate(() => document.getElementById('env-ortho').checked);
  const failed = sheetResponses.filter((r) => r.status !== 200);
  ortho = `switch ${checked ? 'on' : 'OFF'}, ${sheetResponses.length} sheet(s) fetched,`
    + ` ${failed.length} not 200`;
  if (orthoBeforeClick !== 0) problems.push(`[ortho] ${orthoBeforeClick} sheet(s) were fetched BEFORE the switch was touched - it is meant to be opt-in`);
  if (!checked) problems.push('[ortho] the switch did not stay on after a click');
  if (!sheetResponses.length) problems.push('[ortho] the switch is on and no sheet was fetched at all');
  for (const f of failed) problems.push(`[ortho] ${f.name} came back ${f.status}`);
}

await page.screenshot({ path: SCREENSHOT_FILE });
await browser.close();

console.log(`WebGL: ${JSON.stringify(glInfo)}`);
console.log(`Version: ${shownVersion ?? 'not shown'} (package.json: ${expectedVersion})`);
console.log(`Credits: ${credits}`);
console.log(`Orthophoto: ${ortho}`);
console.log(`Screenshot: ${SCREENSHOT_FILE}`);
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log(p);
  process.exit(1);
} else {
  console.log('No console errors or page errors.');
}
