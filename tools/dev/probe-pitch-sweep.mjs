#!/usr/bin/env node
// Probe for a discontinuity in mouse-look pitch across the WHOLE range.
//
// The user reported (2026-08-04) that moving the mouse up slowly still produces
// a jump "at a certain point" - a single-angle discontinuity, not the per-event
// stepping already fixed in 964d0b4. tools/test-mouselook.mjs only ever exercises
// mid-range pitch plus the two limits, so it cannot see one.
//
// This drives a steady 1 px per frame from the bottom limit to the top and looks
// at the per-frame pitch step: with input conserved, steady state must be exactly
// SENSITIVITY rad per frame everywhere except the initial smoothing ramp and the
// final clamp. Any other deviation is ours to fix. It also watches yaw and roll,
// since a euler-pole problem shows up as a sideways snap rather than a pitch one.
//
// Usage: tools/dev/start-dev.sh && node tools/dev/probe-pitch-sweep.mjs

import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:5173';
const SENSITIVITY = 0.002; // must match src/controls.js

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const problems = [];
page.on('pageerror', (err) => problems.push(err.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') problems.push(msg.text());
});
await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(4000);
await page.mouse.click(700, 450);
await page.waitForTimeout(400);

const result = await page.evaluate(async ({ dt }) => {
  const { camera, controls, renderer } = window.__pngp ?? {};
  if (!camera) return { error: 'window.__pngp missing - run this against a dev server' };
  if (document.pointerLockElement === null) return { error: 'pointer lock was not granted' };

  // Fixed dt, not real frames: headless runs on SwiftShader at 1-2 fps, where
  // the whole pending movement lands in one frame and the smoothing would be
  // measuring the software renderer (docs/PROGRESS.md 2026-08-03).
  renderer.setAnimationLoop(null);

  const THREE = await import('/node_modules/three/build/three.module.js');
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');

  // Start just inside the bottom limit, level in yaw, unrolled.
  euler.setFromQuaternion(camera.quaternion);
  euler.x = -1.5;
  euler.y = 0;
  euler.z = 0;
  camera.quaternion.setFromEuler(euler);
  for (let i = 0; i < 5; i++) controls.update(dt);

  // Steady 1 px up per frame, all the way to the top limit.
  const samples = [];
  let prev = -1.5;
  for (let i = 0; i < 2000; i++) {
    document.dispatchEvent(new MouseEvent('mousemove', { movementX: 0, movementY: -1 }));
    controls.update(dt);
    euler.setFromQuaternion(camera.quaternion);
    samples.push({ pitch: euler.x, step: euler.x - prev, yaw: euler.y, roll: euler.z });
    prev = euler.x;
  }
  return { samples };
}, { dt: 1 / 60 });

await browser.close();

if (result.error) {
  console.log(`ERROR: ${result.error}`);
  process.exit(1);
}

const deg = (r) => ((r * 180) / Math.PI).toFixed(4);
const { samples } = result;

// The smoothing needs a few frames to reach steady state, and the clamp ends the
// sweep; judge uniformity strictly between those.
// The step that first meets the clamp is legitimately a partial one - whatever
// was left between the previous pitch and the limit - so the last judged frame
// is the one before it, not the clamp frame itself.
const RAMP = 40;
const clampedAt = samples.findIndex((s, i) => i > RAMP && Math.abs(s.step) < SENSITIVITY * 0.5);
const end = clampedAt === -1 ? samples.length : clampedAt - 1;
const body = samples.slice(RAMP, end);

let worst = { dev: 0 };
for (const [i, s] of body.entries()) {
  const dev = Math.abs(s.step - SENSITIVITY);
  if (dev > worst.dev) worst = { dev, i: i + RAMP, ...s };
}
const yaws = body.map((s) => s.yaw);
const rolls = body.map((s) => s.roll);
const yawDrift = Math.max(...yaws) - Math.min(...yaws);
const maxRoll = Math.max(...rolls.map(Math.abs));

console.log(`Swept pitch ${deg(samples[0].pitch)} -> ${deg(samples[end - 1].pitch)} deg at a steady 1 px/frame.`);
console.log(`  steady state should step ${deg(SENSITIVITY)} deg per frame`);
console.log(`  frames judged: ${body.length} (ramp ${RAMP} skipped, clamp hit at frame ${clampedAt === -1 ? 'never' : clampedAt})`);
console.log(`  worst deviation ${deg(worst.dev)} deg at frame ${worst.i}, pitch ${deg(worst.pitch ?? 0)} deg`);
console.log(`  yaw drift across the whole sweep ${deg(yawDrift)} deg, max roll ${deg(maxRoll)} deg`);

let failures = 0;
// 1% of a single px of movement - well below anything visible, and far above
// float noise in a quaternion round-trip.
if (worst.dev > SENSITIVITY * 0.01) {
  console.log(`\nFAIL: pitch does not advance uniformly - a ${deg(worst.dev)} deg discontinuity at pitch ${deg(worst.pitch)} deg.`);
  failures++;
}
if (yawDrift > 1e-4) {
  console.log(`\nFAIL: yaw drifted ${deg(yawDrift)} deg during a pure pitch sweep.`);
  failures++;
}
if (maxRoll > 1e-4) {
  console.log(`\nFAIL: roll reached ${deg(maxRoll)} deg during a pure pitch sweep.`);
  failures++;
}

if (problems.length) console.log(`\nPage problems:\n  ${problems.join('\n  ')}`);
if (failures || problems.length) process.exit(1);
console.log('\nPitch advances uniformly across the entire range - no discontinuity in our own maths.');
