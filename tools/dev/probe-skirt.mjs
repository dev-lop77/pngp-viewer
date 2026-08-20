#!/usr/bin/env node
// The second open defect: "a terrain tile skirt shows at eye height on the ice", reported
// 2026-08-19 from 45.51249N, 7.01452E (2,918 m) - a hard-edged pale quadrilateral low in
// the frame that survives ground cover off and water hidden, and goes away if the camera
// lifts 25 m.
//
// The report has no heading in it, so this sweeps the compass from ONE page load rather
// than paying the load again per direction, and shoots the same eight headings from eye
// height and from +25 m. If it is the skirt, the pair differs at exactly one heading.
//
// Usage: tools/dev/start-dev.sh && node tools/dev/probe-skirt.mjs [lat] [lon]

import { chromium } from 'playwright';
import { captureCanvas } from '../lib/canvas-capture.mjs';

const lat = Number(process.argv[2] ?? 45.51249);
const lon = Number(process.argv[3] ?? 7.01452);
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

const local = await page.evaluate(({ lat, lon }) => import('/src/geo.js').then((geo) => geo.wgs84ToLocal(lat, lon)), { lat, lon });
console.log(`local ${local.x.toFixed(0)}, ${local.z.toFixed(0)}`);

for (const lift of [0, 25]) {
  for (let heading = 0; heading < 360; heading += 45) {
    const info = await page.evaluate(({ local, heading, lift }) => {
      const cam = window.__pngp.camera;
      window.__pngp.controls.mode = 'fly';
      const ground = window.__pngp.getGroundHeight()(local.x, local.z);
      const y = ground + 1.7 + lift;
      cam.position.set(local.x, y, local.z);
      // Heading 0 = north = -Z, growing clockwise, and pitched down to put the ground low
      // in the frame the way the report describes it.
      const rad = (heading * Math.PI) / 180;
      const pitch = (-25 * Math.PI) / 180;
      cam.lookAt(local.x + Math.sin(rad) * Math.cos(pitch) * 100,
                 y + Math.sin(pitch) * 100,
                 local.z - Math.cos(rad) * Math.cos(pitch) * 100);
      cam.updateMatrixWorld(true);
      return { ground: Math.round(ground), y: Math.round(y) };
    }, { local, heading, lift });
    await page.waitForTimeout(3500);
    const out = `tools/dev/logs/skirt-${String(heading).padStart(3, '0')}-lift${lift}.png`;
    await captureCanvas(page, out);
    if (heading === 0) console.log(`lift ${lift}: ground ${info.ground} m, eye ${info.y} m`);
  }
}
if (problems.length) console.log(problems.join('\n'));
await browser.close();
console.log('shots in tools/dev/logs/skirt-*.png');
