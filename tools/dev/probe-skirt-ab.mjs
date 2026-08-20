#!/usr/bin/env node
// Is the pale quadrilateral at eye height on the ice actually a tile SKIRT?
//
// The 2026-08-19 report attributed it to SKIRT_DEPTH_M from its behaviour (hard-edged,
// survives ground cover off and water hidden, gone if the camera lifts 25 m). That is a
// theory, and tools/dev/probe-lod-neighbours.mjs has since made it doubtful: every tile
// within a kilometre of that camera is the same depth, so there is no T-junction there and
// nothing for a skirt to fill.
//
// So switch the skirts off and measure the same pixels twice, which is the only reading
// that isolates a term (docs/ARCHITECTURE.md §13). No reload and no rebuild: every tile
// geometry lists its 6,144 surface indices FIRST and its 768 skirt indices after them, so
// a draw range of 6,144 is the same scene with the curtains gone.
//
// Usage: tools/dev/start-dev.sh && node tools/dev/probe-skirt-ab.mjs [lat] [lon] [heading]

import { chromium } from 'playwright';
import { captureCanvas } from '../lib/canvas-capture.mjs';

const lat = Number(process.argv[2] ?? 45.51249);
const lon = Number(process.argv[3] ?? 7.01452);
const heading = Number(process.argv[4] ?? 90);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 900, height: 560 } });
const problems = [];
page.on('pageerror', (e) => problems.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
await page.goto('http://localhost:5173', { waitUntil: 'load' });
await page.waitForFunction(() => window.__pngp?.getGroundHeight?.(), null, { timeout: 180000 });
await page.waitForFunction(() => (window.__pngp.terrain?.heightTier?.mix ?? 0) >= 1, null, { timeout: 300000 }).catch(() => {});
await page.addStyleTag({ content: '#top-left,#nav-hud,#env-controls,#credits-box,#fps,#controls-hint,#dev-note,#poi-info,#look-diag,#audio-diag,#compass,#view-actions,#poi-search,.poi-label{display:none!important}' });
await page.waitForTimeout(3000);

const info = await page.evaluate(({ lat, lon, heading }) => import('/src/geo.js').then((geo) => {
  const local = geo.wgs84ToLocal(lat, lon);
  const cam = window.__pngp.camera;
  window.__pngp.controls.mode = 'fly';
  const ground = window.__pngp.getGroundHeight()(local.x, local.z);
  const y = ground + 1.7;
  const rad = (heading * Math.PI) / 180;
  const pitch = (-25 * Math.PI) / 180;
  cam.position.set(local.x, y, local.z);
  cam.lookAt(local.x + Math.sin(rad) * Math.cos(pitch) * 100,
             y + Math.sin(pitch) * 100,
             local.z - Math.cos(rad) * Math.cos(pitch) * 100);
  cam.updateMatrixWorld(true);
  return { x: Math.round(local.x), z: Math.round(local.z), ground: Math.round(ground) };
}), { lat, lon, heading });
console.log(`at ${info.x}, ${info.z} - ground ${info.ground} m, heading ${heading}`);
await page.waitForTimeout(4000);
await captureCanvas(page, 'tools/dev/logs/skirt-ab-on.png');

const counts = await page.evaluate(() => {
  const seen = new Set();
  let changed = 0;
  for (const m of window.__pngp.scene.getObjectByName('terrain').children) {
    if (!m.visible || seen.has(m.geometry)) continue;
    seen.add(m.geometry);
    // 32x32 quads of surface, then the four skirt strips.
    m.geometry.setDrawRange(0, 32 * 32 * 6);
    changed++;
  }
  return { geometries: changed, total: window.__pngp.scene.getObjectByName('terrain').children.filter((m) => m.visible).length };
});
console.log(`skirts off on ${counts.geometries} distinct geometries across ${counts.total} visible tiles`);
await page.waitForTimeout(4000);
await captureCanvas(page, 'tools/dev/logs/skirt-ab-off.png');
if (problems.length) console.log(problems.join('\n'));
await browser.close();
console.log('-> tools/dev/logs/skirt-ab-on.png, tools/dev/logs/skirt-ab-off.png');
