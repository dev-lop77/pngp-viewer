#!/usr/bin/env node
// Guards the frame-paced mouse look in src/controls.js, added after the user
// reported (2026-08-03) that moving the view up/down came in jumps rather than
// at a constant rate.
//
// A first probe established that the angle maths was never the problem: twelve
// identical synthetic 5 px events each moved pitch by exactly 0.572958 deg, no
// roll, no yaw cross-talk. The unevenness was that rotation was applied the
// instant an event arrived, so a frame receiving two events turned twice as far
// as one receiving one. This test therefore checks the three properties the fix
// depends on, none of which are about linearity:
//
//   1. a burst of input is SPREAD over frames, not applied in one jump;
//   2. no input is lost or amplified - the view ends up exactly where the total
//      movement asked for;
//   3. pushing hard into the pitch limit does not swing the yaw. Pitch clamped
//      at exactly +/-90 deg lands on the YXZ euler singularity, where roll is
//      forced to zero and yaw is re-derived from another matrix branch, which
//      snaps the view sideways. controls.js clamps just inside for that reason.
//
// Usage: tools/dev/start-dev.sh && node tools/test-mouselook.mjs

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
await page.mouse.click(700, 450); // pointer lock needs a real gesture
await page.waitForTimeout(400);

const result = await page.evaluate(async ({ sensitivity, dt }) => {
  const { camera, controls, renderer } = window.__pngp ?? {};
  if (!camera) return { error: 'window.__pngp missing - run this against a dev server' };
  if (document.pointerLockElement === null) return { error: 'pointer lock was not granted' };

  // Drive controls.update() at a fixed dt instead of relying on real frames.
  // Headless runs on SwiftShader at 1-2 fps, where dt is so large that spending
  // the whole pending movement in one frame is CORRECT - the smoothing is a time
  // constant, not a per-frame fraction. Testing against real frames here would
  // therefore measure the software renderer, not the code.
  renderer.setAnimationLoop(null);

  const THREE = await import('/node_modules/three/build/three.module.js');
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const angles = () => {
    euler.setFromQuaternion(camera.quaternion);
    return { pitch: euler.x, yaw: euler.y, roll: euler.z };
  };
  const frame = () => {
    controls.update(dt);
    return Promise.resolve();
  };
  const settle = async (n) => {
    for (let i = 0; i < n; i++) await frame();
  };
  const move = (dx, dy) => document.dispatchEvent(new MouseEvent('mousemove', { movementX: dx, movementY: dy }));

  // Start level and unrolled, mid-range, so nothing here is confused with the
  // pitch limit.
  euler.setFromQuaternion(camera.quaternion);
  euler.x = 0;
  euler.z = 0;
  camera.quaternion.setFromEuler(euler);
  await settle(3);

  // --- 1 & 2: a burst of 20 px arrives at once; watch it spread over frames.
  const BURST_PX = 20;
  const start = angles();
  move(0, BURST_PX);
  const perFrame = [];
  let prev = start.pitch;
  for (let i = 0; i < 30; i++) {
    await frame();
    const now = angles().pitch;
    perFrame.push(prev - now); // downward movement lowers pitch
    prev = now;
  }
  const totalApplied = start.pitch - prev;
  const expectedTotal = BURST_PX * sensitivity;

  // --- 3: shove into the pitch limit and check the yaw holds still.
  const beforeLimit = angles();
  for (let i = 0; i < 10; i++) move(0, 4000); // far past 90 deg
  await settle(40);
  const atLimit = angles();

  // And back up the other way, same check.
  for (let i = 0; i < 20; i++) move(0, -4000);
  await settle(40);
  const atTopLimit = angles();

  return {
    perFrame,
    totalApplied,
    expectedTotal,
    framesToSpread: perFrame.filter((d) => Math.abs(d) > expectedTotal * 0.01).length,
    largestSingleFrame: Math.max(...perFrame.map(Math.abs)),
    limit: {
      yawDriftDown: atLimit.yaw - beforeLimit.yaw,
      yawDriftUp: atTopLimit.yaw - atLimit.yaw,
      pitchDown: atLimit.pitch,
      pitchUp: atTopLimit.pitch,
      rollDown: atLimit.roll,
      rollUp: atTopLimit.roll,
    },
  };
}, { sensitivity: SENSITIVITY, dt: 1 / 60 });

await browser.close();

if (result.error) {
  console.log(`ERROR: ${result.error}`);
  process.exit(1);
}

const deg = (r) => ((r * 180) / Math.PI).toFixed(4);
let failures = 0;

console.log(`A 20 px burst should turn the view by ${deg(result.expectedTotal)} deg in total.\n`);
console.log(`applied over ${result.framesToSpread} frames`);
console.log(`  total       ${deg(result.totalApplied)} deg (asked ${deg(result.expectedTotal)})`);
console.log(`  largest single frame ${deg(result.largestSingleFrame)} deg`);
console.log(`  first frames: ${result.perFrame.slice(0, 6).map((d) => deg(d)).join(', ')}`);

// 1. Spread, not a jump. Applied instantly, one frame would carry all of it.
if (result.framesToSpread < 3) {
  console.log(`\nFAIL: input was applied in ${result.framesToSpread} frame(s) - not being spread.`);
  failures++;
}
if (result.largestSingleFrame > result.expectedTotal * 0.75) {
  console.log('\nFAIL: one frame carried most of the burst - smoothing is not working.');
  failures++;
}
// 2. Conserved: the camera must land exactly where the input asked.
if (Math.abs(result.totalApplied - result.expectedTotal) > result.expectedTotal * 0.02) {
  console.log('\nFAIL: total rotation does not match the input - movement is being lost or amplified.');
  failures++;
}

const L = result.limit;
console.log(`\npitch limit: down ${deg(L.pitchDown)} deg, up ${deg(L.pitchUp)} deg`);
console.log(`  yaw drift while pushing into it: ${deg(L.yawDriftDown)} deg down, ${deg(L.yawDriftUp)} deg up`);
console.log(`  roll at the limit: ${deg(L.rollDown)} / ${deg(L.rollUp)} deg`);

// 3. No sideways snap at the pole, and the clamp holds just inside 90 deg.
for (const [name, drift] of [['down', L.yawDriftDown], ['up', L.yawDriftUp]]) {
  if (Math.abs(drift) > 1e-4) {
    console.log(`\nFAIL: yaw moved ${deg(drift)} deg while only pitching ${name} - the euler pole is snapping.`);
    failures++;
  }
}
if (Math.abs(L.pitchDown) >= Math.PI / 2 || Math.abs(L.pitchUp) >= Math.PI / 2) {
  console.log('\nFAIL: pitch reached the +/-90 deg singularity instead of stopping inside it.');
  failures++;
}

if (problems.length) console.log(`\nPage problems:\n  ${problems.join('\n  ')}`);
if (failures || problems.length) process.exit(1);
console.log('\nMouse look is frame-paced, loses no input, and holds yaw at the pitch limit.');
