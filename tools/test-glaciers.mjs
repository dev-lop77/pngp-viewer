#!/usr/bin/env node
// The glaciers, after they stopped being geometry (2026-08-19).
//
// The sheet they used to be had a defect that could only be measured: its triangles' corners
// were seated on the terrain and their flat interiors sagged below it, so 1.25% of the ice
// showed rock through it, and the 1 m lift that hid most of that had to stay under a
// walker's 1.7 m eye height or you stood with your head inside the ice. A mask cannot have
// that defect - there is no interior to sag - so this test does not measure sag. It measures
// the two things that CAN now go wrong instead:
//
//   1. The mask is not the outlines. It is built from water.json's own 80 rings
//      (tools/build-glacier-mask.mjs), so it can be checked against them directly, by
//      point-in-polygon, without a browser: ice inside, none outside.
//   2. The geometry comes back, or the mask never reaches the shader. Both are silent -
//      the scene looks plausible either way - so the page is asked directly.
//
// Usage: node tools/test-glaciers.mjs [url]

import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { readQuantisedMask } from './lib/mask-raster.mjs';

const url = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'http://localhost:5173';
const failures = [];
const check = (ok, message) => {
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${message}`);
  if (!ok) failures.push(message);
};

const DIR = 'public/data';
const manifest = JSON.parse(readFileSync(`${DIR}/glacier.json`, 'utf8'));
const water = JSON.parse(readFileSync(`${DIR}/water.json`, 'utf8'));
const height = JSON.parse(readFileSync(`${DIR}/heightfield.json`, 'utf8'));

// ---- 1. the mask is on the terrain's own grid ----
check(manifest.dimensions.width === height.dimensions.width
  && manifest.dimensions.height === height.dimensions.height,
  `the mask is on the heightfield's grid (${manifest.dimensions.width}x${manifest.dimensions.height})`);
check(JSON.stringify(manifest.bboxCrsUnits) === JSON.stringify(height.bboxCrsUnits),
  'and on the same bbox, so the terrain UVs address it directly');
check(manifest.coverage.outlines === water.glaciers.length,
  `it was built from all ${water.glaciers.length} shipped outlines (${manifest.coverage.outlines})`);

const { values, width, height: mh } = readQuantisedMask(`${DIR}/${manifest.file.name}`);
check(width === manifest.dimensions.width && mh === manifest.dimensions.height,
  'the PNG decodes to the dimensions the manifest declares');

// ---- 2. the mask agrees with the outlines, by point-in-polygon ----
//
// Local scene metres -> pixel, the same conversion the build tool does, written out here
// rather than imported so that a change to one of them cannot quietly agree with itself.
const { xmin, ymax } = height.bboxCrsUnits;
const resX = (height.bboxCrsUnits.xmax - xmin) / width;
const resY = (ymax - height.bboxCrsUnits.ymin) / mh;
const originX = height.localOrigin.x;
const originY = height.localOrigin.y;
const toPixel = (x, z) => [((x + originX) - xmin) / resX, (ymax - (originY - z)) / resY];
const maskAt = (x, z) => {
  const [px, py] = toPixel(x, z);
  const col = Math.floor(px);
  const row = Math.floor(py);
  if (col < 0 || col >= width || row < 0 || row >= mh) return 0;
  return values[row * width + col] / 255;
};

// Even-odd, on the ring's own local x/z.
function inRing(ring, x, z) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, , zi] = ring[i];
    const [xj, , zj] = ring[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

// A deterministic sample inside each glacier: its ring's own centroid when that falls inside
// (a glacier tongue is usually convex enough), and otherwise the midpoint of the two ring
// points furthest apart, walked inward. No randomness - a test that samples differently on
// every run reports differently on every run.
let insideHits = 0;
let insideMisses = 0;
const misses = [];
for (const g of water.glaciers) {
  const cx = g.ring.reduce((a, p) => a + p[0], 0) / g.ring.length;
  const cz = g.ring.reduce((a, p) => a + p[2], 0) / g.ring.length;
  let probe = inRing(g.ring, cx, cz) ? [cx, cz] : null;
  if (!probe) {
    // Walk from the centroid toward each ring vertex and take the first point that is
    // genuinely inside. A concave tongue always has one.
    for (const [rx, , rz] of g.ring) {
      const mx = cx + (rx - cx) * 0.5;
      const mz = cz + (rz - cz) * 0.5;
      if (inRing(g.ring, mx, mz)) { probe = [mx, mz]; break; }
    }
  }
  if (!probe) continue; // a degenerate ring: the mask cannot be blamed for it
  if (maskAt(probe[0], probe[1]) > 0.3) insideHits += 1;
  else {
    insideMisses += 1;
    misses.push(`${g.name ?? g.osmId} at ${probe[0].toFixed(0)},${probe[1].toFixed(0)} reads ${maskAt(probe[0], probe[1]).toFixed(2)}`);
  }
}
check(insideMisses === 0,
  `every glacier has ice at a point inside its own outline (${insideHits} hit, ${insideMisses} missed)`
  + (misses.length ? `: ${misses.slice(0, 3).join('; ')}` : ''));

// And the other way: points well outside every outline must be bare. Sampled on a coarse
// lattice over the whole bbox, so this is about the mask as a whole rather than one place.
let outsideChecked = 0;
let outsideWrong = 0;
const worldW = (height.bboxCrsUnits.xmax - xmin);
const worldD = (ymax - height.bboxCrsUnits.ymin);
for (let z = -worldD / 2 + 500; z < worldD / 2; z += 1000) {
  for (let x = -worldW / 2 + 500; x < worldW / 2; x += 1000) {
    if (water.glaciers.some((g) => inRing(g.ring, x, z))) continue;
    // Skip anything within 60 m of an outline: an edge pixel is legitimately part ice.
    const nearEdge = water.glaciers.some((g) => g.ring.some(([rx, , rz]) => Math.hypot(rx - x, rz - z) < 60));
    if (nearEdge) continue;
    outsideChecked += 1;
    if (maskAt(x, z) > 0.05) outsideWrong += 1;
  }
}
check(outsideWrong === 0, `no ice outside the outlines (${outsideChecked} points sampled, ${outsideWrong} wrong)`);

// ---- 3. the page: no geometry, and the mask reached the shader ----
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
const problems = [];
page.on('pageerror', (e) => problems.push(`[pageerror] ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`[console.error] ${m.text()}`); });
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__pngp?.getGroundHeight?.(), null, { timeout: 180000 });
// The mask is its own 30 kB download; wait for it rather than for a clock.
await page
  .waitForFunction(() => (window.__pngp.glacierMix?.value ?? 0) > 0
    && (window.__pngp.terrain?.material?.userData ?? true), null, { timeout: 60000 })
  .catch(() => {});
await page.waitForTimeout(3000);

const scene = await page.evaluate(() => {
  let sheet = null;
  const names = [];
  window.__pngp.scene.traverse((o) => {
    if (o.name) names.push(o.name);
    if (o.name === 'water-glaciers') sheet = o;
  });
  return {
    hasSheet: Boolean(sheet),
    waterChildren: window.__pngp.scene.getObjectByName('water')?.children.map((c) => c.name) ?? [],
    glacierMix: window.__pngp.glacierMix?.value ?? null,
  };
});
check(scene.hasSheet === false, 'the glacier SHEET is gone from the scene');
check(scene.waterChildren.length > 0,
  `and the rest of the water layer is still there (${scene.waterChildren.join(', ')})`);
check(scene.glacierMix === 1, `the ice is painted at full strength (uGlacierMix ${scene.glacierMix})`);

// Does the mask actually reach the ground? Read the terrain material's own uniform, and then
// prove it visually: the same pixel with the ice on and with it off must differ. Reading the
// uniform alone would only prove the binding, not that anything is drawn (§13.1's silent
// shader patch is the same shape of lie).
const paint = await page.evaluate(async () => {
  const { camera, controls, scene: sc, glacierMix } = window.__pngp;
  // Stand above the biggest glacier - Gliairetta, from water.json - and look down at it.
  controls.mode = 'fly';
  camera.position.set(-25454, 4000, 16400);
  camera.lookAt(-25454, 3050, 14843);
  camera.updateMatrixWorld(true);
  const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  const read = async () => {
    await frame();
    const c = document.querySelector('canvas');
    const gl = c.getContext('webgl2');
    const buf = new Uint8Array(c.width * c.height * 4);
    gl.readPixels(0, 0, c.width, c.height, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    let sum = 0;
    let blue = 0;
    for (let i = 0; i < buf.length; i += 4) {
      sum += (buf[i] + buf[i + 1] + buf[i + 2]) / 3;
      blue += buf[i + 2] - buf[i];
    }
    const n = buf.length / 4;
    return { luma: sum / n, blueBias: blue / n };
  };
  const on = await read();
  glacierMix.value = 0;
  const off = await read();
  glacierMix.value = 1;
  return { on, off };
});
// WHAT THE ICE CHANGES IS BRIGHTNESS, and the history of this check is worth keeping because
// it was wrong twice in opposite directions.
//
// It first asserted "brighter" against an ice colour of 0xc3defb - the brightest ice that
// keeps its blue without clipping - and failed: the frame came out 3.6 levels DARKER, because
// the satellite photo already shows the Gliairetta at about rgb(190) and this renderer's
// ceiling is rgb(195). That failure is what corrected the colour. It was then relaxed to
// "changes, and changes toward blue", which fitted the cyan-white that replaced it. The user
// then chose NEUTRAL WHITE from four renders ("mi piace neutral"), and a neutral ice moves
// hue almost not at all - so the blue assertion had to go the way the brightness one had.
//
// What is asserted now is what the shipped ice actually does: the frame gets BRIGHTER, and
// very slightly less warm, because white ice replaces a warm-tinted photograph. Measured 3.1
// and 1.5 levels; the thresholds sit below that with margin. Both are switched-on-minus-off on
// one camera, so nothing here is a per-run number.
const lumaShift = paint.on.luma - paint.off.luma;
const blueShift = paint.on.blueBias - paint.off.blueBias;
check(lumaShift > 1.5,
  `the ice really is painted: the frame is ${lumaShift.toFixed(1)} levels brighter with the`
  + ' mask on than with it off');
check(blueShift > 0.5,
  `and slightly less warm (${paint.on.blueBias.toFixed(1)} vs ${paint.off.blueBias.toFixed(1)}),`
  + ' which is white ice over a warm photograph');

check(problems.length === 0, `no page errors (${problems.length})`);
if (problems.length) console.log(`    ${problems.join('\n    ')}`);
await browser.close();

console.log(failures.length ? `\n${failures.length} FAILED` : '\nAll checks passed');
process.exit(failures.length ? 1 : 0);
