#!/usr/bin/env node
// Stand next to a herd and photograph it. tools/dev/shoot.mjs aims at a named
// place, which is no use for an animal that placed itself and then walked off,
// so this asks the module where its animals are and keeps the camera on one.
//
// The tracking matters more than it sounds: every species flees an approaching
// camera (src/wildlife.js), so a camera aimed once and screenshotted a second
// later photographs empty hillside. A per-frame chase cam holds the portrait
// distance instead, which is also the only way to see the gait at all.
//
// Usage: tools/dev/start-dev.sh && node tools/dev/shoot-wildlife.mjs [species] [distM] [bearingDeg]
import { chromium } from 'playwright';

const species = process.argv[2] ?? 'ibex';
const distM = Number(process.argv[3] ?? 9);
// Which side to stand on. An argument rather than a random draw, so re-running
// after a tweak photographs the same thing from the same place.
const bearingDeg = Number(process.argv[4] ?? 135);

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
page.on('console', (m) => { if (m.type() === 'error') console.log('console error:', m.text()); });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(5000);

const found = await page.evaluate(async ({ species, distM, bearingDeg }) => {
  const { camera, controls, lighting } = window.__pngp;
  const wildlife = window.__pngp.getWildlife?.();
  if (!wildlife) return { error: 'wildlife not loaded' };
  lighting.setTime(0.5); // midday, so the coat is judged under the tuned rig
  controls.enabled = false; // no stray mouse look, and no ground clamp fighting the chase cam

  // Start where tools/test-wildlife.mjs found that species. Chamois need a
  // different site from the other two: their habitat window asks for at least a
  // little canopy, so the bare 2,619 m of Colle del Nivolet has none of them.
  const SITES = {
    ibex: [-16164, 22824], // Colle del Nivolet, 2619 m
    marmot: [-16164, 22824],
    chamois: [-12595, 4501], // Mont Paillasse, 2412 m, with woodland below
  };
  const [siteX, siteZ] = SITES[species] ?? SITES.ibex;
  camera.position.set(siteX, 3000, siteZ);
  for (let i = 0; i < 60; i++) wildlife.update(1 / 60, camera);
  const mine = () => wildlife.snapshot().filter((a) => a.species === species);
  if (!mine().length) return { error: `no ${species} near ${siteX},${siteZ}` };

  // JS-only cost of moving the whole population. This is CPU work, so unlike
  // frame rate it does mean something under SwiftShader.
  const t0 = performance.now();
  for (let i = 0; i < 300; i++) wildlife.update(1 / 60, camera);
  const msPerUpdate = (performance.now() - t0) / 300;

  const bearing = (bearingDeg * Math.PI) / 180;
  const subject = { x: siteX, z: siteZ };
  const chase = () => {
    const near = mine().sort(
      (p, q) => Math.hypot(p.x - subject.x, p.z - subject.z) - Math.hypot(q.x - subject.x, q.z - subject.z),
    )[0];
    if (near) {
      subject.x = near.x;
      subject.z = near.z;
      const cx = near.x + Math.cos(bearing) * distM;
      const cz = near.z + Math.sin(bearing) * distM;
      camera.position.set(cx, controls.getGroundHeight(cx, cz) + 1.7, cz);
      camera.lookAt(near.x, near.elevationM + 0.7, near.z);
      window.__shotSubject = near;
    }
    requestAnimationFrame(chase);
  };
  requestAnimationFrame(chase);
  return { msPerUpdate, simulated: wildlife.snapshot().length, near: mine().length };
}, { species, distM, bearingDeg });

if (found.error) {
  console.log(`ERROR: ${found.error}`);
  await browser.close();
  process.exit(1);
}
await page.waitForTimeout(3000); // let the chase cam settle onto a moving animal
const subject = await page.evaluate(() => window.__shotSubject);
console.log(JSON.stringify({ species, ...found, subject }, null, 2));
await page.screenshot({ path: `tools/dev/logs/wildlife-${species}.png` });
console.log(`-> tools/dev/logs/wildlife-${species}.png`);
await browser.close();
