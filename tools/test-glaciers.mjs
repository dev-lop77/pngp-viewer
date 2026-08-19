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
//
// Each outline gets a bounding box first. Without it this sweep tests 4,834 lattice points
// against 80 rings of up to 308 points twice over - once for containment and once for the
// edge margin - and that arithmetic was a third of this test's runtime, which matters because
// tools/dev/run-tests.sh drops a test out of the pre-publish set once it passes ~2 minutes.
const boxes = water.glaciers.map((g) => {
  const xs = g.ring.map((pt) => pt[0]);
  const zs = g.ring.map((pt) => pt[2]);
  return { g, x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
});
const near = (b, x, z, pad) => x >= b.x0 - pad && x <= b.x1 + pad && z >= b.z0 - pad && z <= b.z1 + pad;
let outsideChecked = 0;
let outsideWrong = 0;
const worldW = (height.bboxCrsUnits.xmax - xmin);
const worldD = (ymax - height.bboxCrsUnits.ymin);
for (let z = -worldD / 2 + 500; z < worldD / 2; z += 1000) {
  for (let x = -worldW / 2 + 500; x < worldW / 2; x += 1000) {
    const candidates = boxes.filter((b) => near(b, x, z, 60));
    if (candidates.some((b) => inRing(b.g.ring, x, z))) continue;
    // Skip anything within 60 m of an outline: an edge pixel is legitimately part ice.
    const nearEdge = candidates.some((b) => b.g.ring.some(([rx, , rz]) => Math.hypot(rx - x, rz - z) < 60));
    if (nearEdge) continue;
    outsideChecked += 1;
    if (maskAt(x, z) > 0.05) outsideWrong += 1;
  }
}
check(outsideWrong === 0, `no ice outside the outlines (${outsideChecked} points sampled, ${outsideWrong} wrong)`);

// ---- the margin pixel, chosen from the FULL-RESOLUTION mask ----
//
// This is where the shader's own partial coverage is, and picking it here rather than hunting
// for it in the page is what makes the debris measurable at all. Two earlier attempts failed
// for the same underlying reason: window.__pngp.iceAt is the mask DOWNSCALED BY TWO for the CPU
// (41 m cells) while the shader samples the 20.5 m original, so a point that is half-covered to
// one is fully covered or bare to the other. The first attempt asked iceAt for a half-covered
// point and measured no debris; the second walked outward in 20 m steps and never left the ice;
// the third walked to the edge and found the warm ROCK outside it, passing while proving
// nothing. The mask itself has no such ambiguity: `values` above IS what the shader reads.
//
// Wanted: a pixel that is genuinely partial AND has a fully covered neighbour, so it is a margin
// rather than an isolated speck of ice on a ridge.
const pixelToLocal = (px, py) => ({
  x: (xmin + (px + 0.5) * resX) - originX,
  z: originY - (ymax - (py + 0.5) * resY),
});
let marginPixel = null;
let bodyPixel = null;
for (let py = 1; py < mh - 1 && !(marginPixel && bodyPixel); py += 1) {
  for (let px = 1; px < width - 1; px += 1) {
    const v = values[py * width + px] / 255;
    if (!marginPixel && v > 0.3 && v < 0.7) {
      const neighbours = [
        values[py * width + px - 1], values[py * width + px + 1],
        values[(py - 1) * width + px], values[(py + 1) * width + px],
      ].map((n) => n / 255);
      if (neighbours.some((n) => n > 0.95)) marginPixel = { ...pixelToLocal(px, py), mask: v };
    }
    if (!bodyPixel && v > 0.99) {
      const neighbours = [
        values[py * width + px - 1], values[py * width + px + 1],
        values[(py - 1) * width + px], values[(py + 1) * width + px],
      ].map((n) => n / 255);
      if (neighbours.every((n) => n > 0.99)) bodyPixel = { ...pixelToLocal(px, py), mask: v };
    }
    if (marginPixel && bodyPixel) break;
  }
}
check(Boolean(marginPixel) && Boolean(bodyPixel),
  'the mask has a partially covered pixel next to a fully covered one, and a pixel deep inside'
  + (marginPixel ? ` (margin ${marginPixel.mask.toFixed(2)} at ${marginPixel.x.toFixed(0)},${marginPixel.z.toFixed(0)})` : ''));

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
// The mask is its own 30 kB download, so wait for THE MASK - at a point the mask itself says is
// deep inside a glacier. The wait that used to be here tested `glacierMix.value > 0`, which is a
// constant holder set to 1 before anything loads, and then a truthy expression: it waited for
// nothing at all and was followed by a 3 s sleep doing the actual work. This reads the CPU twin
// of the texture the shader samples, so when it answers, the download has landed and decoded.
await page.waitForFunction(
  (p) => (window.__pngp.iceAt?.(p.x, p.z) ?? 0) > 0.9,
  { x: bodyPixel.x, z: bodyPixel.z },
  { timeout: 120000 },
);

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

// A WHOLE-FRAME "with the ice on and off" measurement used to live here, over the Gliairetta
// from 4,000 m. It is gone, and the trade is worth stating: it rendered the most expensive view
// in the park twice and cost about 30 s of a test that has to stay under the ~2 minute line
// tools/dev/run-tests.sh uses to decide what still runs before a publish - and what it proved,
// that the mask reaches the shader, is now proved three more ways that cost almost nothing: the
// firn/live-ice pair, the MORAINE_MIX pair, and the point-in-polygon sweep against the outlines
// above. Its one unique claim was that the effect is visible in a WIDE view; the day that is in
// doubt, tools/dev/probe-glaciers.mjs takes the picture.

// ---- 4. a glacier is not one surface: firn above, live ice below, moraine at the margin ----
//
// Added 2026-08-19 with those three terms. Each is asserted as a RELATION between two points
// the page finds for itself - lower ice darker than upper firn, margin warmer than the middle -
// rather than against the constants in src/terrain.js. Comparing to the constants would only
// prove the file was read; comparing two rendered points proves the ground looks different in
// the two places, which is the whole claim.
//
// The points come from window.__pngp.iceAt, the CPU twin of the mask the shader samples, so the
// test stands on a real glacier instead of on coordinates typed into a tool.
const gliairetta = boxes.find((b) => b.g.name === 'Ghiacciaio di Gliairetta');
const surfaces = await page.evaluate(async ({ box }) => {
  const { camera, controls, iceAt, getGroundHeight } = window.__pngp;
  const ground = getGroundHeight();
  controls.mode = 'fly';

  // The Gliairetta spans 2,534-3,656 m, which is the only glacier in the park that straddles a
  // plausible firn line with room on both sides. Its bbox comes in from water.json rather than
  // being typed here, and the step is 80 m: the ice is 3 km across, so a finer sweep only spends
  // sampleRenderedHeight calls - the expensive part - to find the same two points.
  const found = { low: null, high: null };
  for (let z = box.z0; z < box.z1 && !(found.low && found.high); z += 80) {
    for (let x = box.x0; x < box.x1; x += 80) {
      const ice = iceAt(x, z);
      if (ice < 0.95) continue; // cheap test first: the height sampler is the costly one
      const h = ground(x, z);
      if (!Number.isFinite(h)) continue;
      if (h < 2900 && !found.low) found.low = { x, z, h };
      if (h > 3350 && !found.high) found.high = { x, z, h };
    }
  }

  // Straight down from 300 m, reading the middle of the frame - the same shape of measurement
  // tools/test-basemap.mjs uses for its land covers, and it keeps the sun angle and the haze
  // out of the comparison because every point is shot the same way.
  const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  const sample = async (p) => {
    if (!p) return null;
    camera.position.set(p.x, p.h + 300, p.z);
    camera.lookAt(p.x, p.h, p.z);
    camera.updateMatrixWorld(true);
    await frame();
    const c = document.querySelector('canvas');
    const gl = c.getContext('webgl2');
    const w = 16;
    const buf = new Uint8Array(w * w * 4);
    gl.readPixels((c.width - w) / 2, (c.height - w) / 2, w, w, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    let r = 0;
    let g = 0;
    let b = 0;
    for (let i = 0; i < buf.length; i += 4) { r += buf[i]; g += buf[i + 1]; b += buf[i + 2]; }
    const n = buf.length / 4;
    return { ...p, r: r / n, g: g / n, b: b / n, luma: (r * 0.299 + g * 0.587 + b * 0.114) / n };
  };

  return {
    low: await sample(found.low),
    high: await sample(found.high),
  };
}, { box: { x0: gliairetta.x0, x1: gliairetta.x1, z0: gliairetta.z0, z1: gliairetta.z1 } });

check(Boolean(surfaces.low && surfaces.high),
  'the page found ice both below 2,900 m and above 3,350 m on one glacier'
  + (surfaces.low && surfaces.high ? ` (${surfaces.low.h.toFixed(0)} m and ${surfaces.high.h.toFixed(0)} m)` : ''));
if (surfaces.low && surfaces.high) {
  check(surfaces.high.luma - surfaces.low.luma > 6,
    `the firn above is brighter than the live ice below: luma ${surfaces.high.luma.toFixed(1)}`
    + ` at ${surfaces.high.h.toFixed(0)} m against ${surfaces.low.luma.toFixed(1)} at ${surfaces.low.h.toFixed(0)} m`);
}
// THE DEBRIS IS ISOLATED, NOT LOOKED FOR. Rock is warm and moraine is warm, so the warmest
// sample near a tongue's edge is the rock OUTSIDE the ice - an earlier version of this check
// reported exactly that and passed while proving nothing. The only reading that isolates the
// term is the same pixel with it on and off, which is why src/terrain.js carries MORAINE_MIX
// beside GLACIER_MIX. The two points come from the full-resolution mask above, so one really is
// a margin texel and the other really is deep inside.
const debris = await page.evaluate(async ({ margin, body }) => {
  const { camera, controls, moraineMix, getGroundHeight } = window.__pngp;
  const ground = getGroundHeight();
  controls.mode = 'fly';
  const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  const warmthAt = async (p) => {
    const h = ground(p.x, p.z);
    camera.position.set(p.x, h + 300, p.z);
    camera.lookAt(p.x, h, p.z);
    camera.updateMatrixWorld(true);
    await frame();
    const c = document.querySelector('canvas');
    const gl = c.getContext('webgl2');
    const w = 16;
    const buf = new Uint8Array(w * w * 4);
    gl.readPixels((c.width - w) / 2, (c.height - w) / 2, w, w, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    let r = 0;
    let b = 0;
    for (let i = 0; i < buf.length; i += 4) { r += buf[i]; b += buf[i + 2]; }
    const n = buf.length / 4;
    return (r - b) / n; // warmth: red over blue, which is what rock and moraine have
  };
  const pair = async (p) => {
    moraineMix.value = 1;
    const on = await warmthAt(p);
    moraineMix.value = 0;
    const off = await warmthAt(p);
    moraineMix.value = 1;
    return { on, off, delta: on - off };
  };
  return { margin: await pair(margin), body: await pair(body) };
}, { margin: marginPixel, body: bodyPixel });

check(debris.margin.delta > 3,
  'the debris band is the moraine term and not the rock beside it: switching MORAINE_MIX off'
  + ` cools the margin texel by ${debris.margin.delta.toFixed(1)} of R-B`);
check(Math.abs(debris.body.delta) < 1.5,
  `and it leaves the body of the glacier alone (${debris.body.delta.toFixed(2)} of R-B there)`);

// ---- 5. the sunlit ice follows the sun ----
//
// The user's complaint, 2026-08-19: "Nonostante sia Midday il ghiaccio e' un po' troppo grigio,
// dovrebbe riflettere di piu' la luce del sole pieno." The albedo could not answer it - it is
// already 1.0 and this rig's white ceiling is rgb(195) - so the extra light is emissive
// radiance, added after the lighting and scaled by dot(N, sun) and by the SQUARE of
// src/lighting.js's SUN_POWER.
//
// That square is the part worth a test. Linear, the night preset still put a tenth of the gain
// on the ice, and a night frame is dark enough that this made the glaciers the brightest thing
// in the park at midnight: the brightest sixth of the frame went from 42.9 to 74.4. So what is
// asserted is not just "the ice is brighter" but "the ice is brighter WHEN THE SUN IS UP" -
// measured at the default hour and again at dusk, on one camera, with the term switched off
// each time to isolate it.
const sunlit = await page.evaluate(async ({ p }) => {
  const { camera, controls, iceSunMix, getGroundHeight } = window.__pngp;
  const ground = getGroundHeight();
  controls.mode = 'fly';
  const h = ground(p.x, p.z);
  camera.position.set(p.x, h + 300, p.z);
  camera.lookAt(p.x, h, p.z);
  camera.updateMatrixWorld(true);
  const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  const luma = async () => {
    await frame();
    const c = document.querySelector('canvas');
    const gl = c.getContext('webgl2');
    const w = 16;
    const buf = new Uint8Array(w * w * 4);
    gl.readPixels((c.width - w) / 2, (c.height - w) / 2, w, w, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i += 4) sum += 0.299 * buf[i] + 0.587 * buf[i + 1] + 0.114 * buf[i + 2];
    return sum / (buf.length / 4);
  };
  const atTime = async (t) => {
    const slider = document.getElementById('env-time');
    slider.value = String(t);
    slider.dispatchEvent(new Event('input'));
    await frame();
    iceSunMix.value = 1;
    const on = await luma();
    iceSunMix.value = 0;
    const off = await luma();
    iceSunMix.value = 1;
    return { on, off, delta: on - off, sunPower: window.__pngp.sunPower.value };
  };
  const day = await atTime(0.15);
  const dusk = await atTime(0.68);
  const slider = document.getElementById('env-time');
  slider.value = '0.15';
  slider.dispatchEvent(new Event('input'));
  return { day, dusk };
}, { p: { x: bodyPixel.x, z: bodyPixel.z } });

check(sunlit.day.delta > 4,
  `sunlit ice: at the default hour (sun power ${sunlit.day.sunPower.toFixed(2)}) the term adds`
  + ` ${sunlit.day.delta.toFixed(1)} levels of luma to the ice`);
check(sunlit.dusk.delta < sunlit.day.delta / 3,
  `and it follows the sun down: at dusk (sun power ${sunlit.dusk.sunPower.toFixed(2)}) it adds`
  + ` only ${sunlit.dusk.delta.toFixed(1)}`);

check(problems.length === 0, `no page errors (${problems.length})`);
if (problems.length) console.log(`    ${problems.join('\n    ')}`);
await browser.close();

console.log(failures.length ? `\n${failures.length} FAILED` : '\nAll checks passed');
process.exit(failures.length ? 1 : 0);
