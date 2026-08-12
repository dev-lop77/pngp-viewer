#!/usr/bin/env node
// Checks the altitude-aware sky (src/sky.js, 2026-08-12): that the shader patch is
// really in place, that it FAILS LOUDLY when it cannot be, that the approved look
// is preserved exactly at the reference altitude, and that climbing darkens and
// deepens the zenith while leaving the horizon alone.
//
// Two halves, because two different things can break:
//
//   node half    - the patch and the model. Runs without a browser: three's Sky
//                  addon is pure JS at import time, so the string surgery and the
//                  guards can be exercised directly, including the cases that are
//                  supposed to throw. This is the half that protects against the
//                  worst outcome, which is not a crash but SILENCE - a patch that
//                  misses leaves the sky at its sea-level column forever and looks
//                  exactly like "the effect is too weak to notice".
//
//   browser half - the pixels. Measures the SCREENSHOT, never a canvas readback:
//                  the context has no preserveDrawingBuffer, so a drawImage()
//                  readback after the frame is presented returns an empty buffer
//                  and reports 0.000 for everything without complaining
//                  (docs/PROGRESS.md 2026-08-11). The screenshot also carries ACES
//                  and toneMappingExposure, which for the sky is most of what
//                  decides the colour - a linear render target would be measuring
//                  a different sky than the one anybody sees.
//
// The altitude is pinned through window.__pngp.sky.altitude - the page's own
// holder - so all readings come from ONE camera in ONE session with nothing else
// in the frame differing. And the suite asserts that the pin MOVED THE SKY, not
// merely that it set a field: the basemap suite passed for free once by pinning a
// second module instance that Vite had handed it, with "photo" and "procedural"
// identical to the byte (docs/PROGRESS.md 2026-08-11). A test that pins a shared
// holder must prove the pin did something.
//
// Usage: tools/dev/start-dev.sh && node tools/test-sky.mjs

import { chromium } from 'playwright';
import { decode } from 'fast-png';
import { Sky } from 'three/addons/objects/Sky.js';

const url = process.argv[2] ?? 'http://localhost:5173';

let failures = 0;
const fail = (msg) => { failures++; console.log(`FAIL ${msg}`); };
const ok = (msg) => console.log(`ok   ${msg}`);
const check = (cond, msg, detail) => (cond ? ok(msg) : fail(`${msg}${detail ? ` - ${detail}` : ''}`));

// ---- node half: the patch, the guards, the model ------------------------

const pristineFragment = Sky.SkyShader.fragmentShader;
const pristineUniforms = { ...Sky.SkyShader.uniforms };
const restore = () => {
  Sky.SkyShader.fragmentShader = pristineFragment;
  Sky.SkyShader.uniforms = { ...pristineUniforms };
};

// A fresh module instance per case: `installed` is module-level state, so a
// cache-busting query is the only way to run the installer more than once.
let bust = 0;
const freshSky = () => import(`../src/sky.js?case=${bust++}`);

{
  const sky = await freshSky();
  const base = sky.installSkyAltitude();
  check(base.rayleighZenithLength === 8400 && base.mieZenithLength === 1250,
    'the two zenith lengths are read out of the addon itself (8400 m air, 1250 m aerosol)',
    JSON.stringify(base));
  check(!/const\s+float\s+rayleighZenithLength/.test(Sky.SkyShader.fragmentShader)
    && /uniform\s+float\s+rayleighZenithLength;/.test(Sky.SkyShader.fragmentShader),
    'the constants are gone from the shader and uniforms stand in their place');
  check(Sky.SkyShader.uniforms.rayleighZenithLength?.value === 8400
    && Sky.SkyShader.uniforms.mieZenithLength?.value === 1250,
    'the uniforms are registered on the shader BEFORE any new Sky() clones them');

  // The whole point of a reference altitude: at the spawn, the model must hand the
  // shader the addon's own numbers, so every time-of-day preset keeps meaning what
  // the user approved it to mean.
  const atRef = sky.skyAltitudeLengths(sky.SKY_REF_ALTITUDE_M);
  check(Math.abs(atRef.rayleighZenithLength - 8400) < 1e-9
    && Math.abs(atRef.mieZenithLength - 1250) < 1e-9,
    `at the reference altitude (${sky.SKY_REF_ALTITUDE_M} m) the sky is bit-for-bit the unpatched one`,
    JSON.stringify(atRef));

  // The exponential law itself, checked HALF a scale height up rather than a whole
  // one: a full 8400 m above the 1950 m reference is 10,350 m, which is past
  // SKY_ALT_MAX_M and therefore clamped. (That is the clamp working, and the first
  // version of this check walked straight into it.)
  const up = sky.skyAltitudeLengths(sky.SKY_REF_ALTITUDE_M + 4200);
  check(Math.abs(up.rayleighZenithLength - 8400 * Math.exp(-0.5)) < 1e-6,
    'half an air scale height up, the air column is exp(-0.5) of itself',
    `${up.rayleighZenithLength.toFixed(3)} vs ${(8400 * Math.exp(-0.5)).toFixed(3)}`);
  const mieUp = sky.skyAltitudeLengths(sky.SKY_REF_ALTITUDE_M + 1250);
  check(Math.abs(mieUp.mieZenithLength - 1250 / Math.E) < 1e-6,
    'one AEROSOL scale height up, the aerosol column is 1/e - each term on its own H');
  check(sky.skyAltitudeLengths(3000).mieZenithLength < sky.skyAltitudeLengths(2000).mieZenithLength
    && sky.skyAltitudeLengths(1000).mieZenithLength > sky.skyAltitudeLengths(2000).mieZenithLength,
    'both columns shrink going up and grow going down');

  // The strength knob must dial the CLIMB ONLY. It is symmetric by nature, and left
  // symmetric it whitens the valleys as hard as it deepens the summits (measured:
  // at strength 3 the 1200 m zenith goes luma 0.769 -> 0.821, B/R 1.47 -> 1.32).
  // That asymmetry is easy to "simplify" away by someone reading the formula alone,
  // so it is asserted here.
  const beforeUp = sky.skyAltitudeLengths(3500);
  const beforeDown = sky.skyAltitudeLengths(1000);
  sky.SKY_ALTITUDE_STRENGTH.value = 3;
  const afterUp = sky.skyAltitudeLengths(3500);
  const afterDown = sky.skyAltitudeLengths(1000);
  sky.SKY_ALTITUDE_STRENGTH.value = 1;
  check(afterUp.rayleighZenithLength < beforeUp.rayleighZenithLength * 0.9,
    'raising the strength thins the air above the reference');
  check(afterDown.rayleighZenithLength === beforeDown.rayleighZenithLength,
    'raising the strength leaves the sky BELOW the reference exactly alone',
    `${beforeDown.rayleighZenithLength.toFixed(1)} -> ${afterDown.rayleighZenithLength.toFixed(1)}`);

  // The clamp is a guard against fly mode, which has no altitude cap at all.
  const far = sky.skyAltitudeLengths(50000);
  const cap = sky.skyAltitudeLengths(sky.SKY_ALT_MAX_M);
  check(far.rayleighZenithLength === cap.rayleighZenithLength,
    `absurd altitudes clamp to SKY_ALT_MAX_M (${sky.SKY_ALT_MAX_M} m) instead of extrapolating`);
}

// The three ways the patch can fail, each of which must throw rather than leave a
// silently sea-level sky behind.
for (const [name, mangle, expect] of [
  ['the declaration is gone (a three.js upgrade renamed or inlined it)',
    (s) => s.replace(/const\s+float\s+rayleighZenithLength\s*=\s*[^;]+;/, ''), /could not find/],
  ['the declaration is unparseable',
    (s) => s.replace(/const\s+float\s+mieZenithLength\s*=\s*[^;]+;/, 'const float mieZenithLength = someOther;'), /not a usable length/],
  ['the constant was retuned, so it may no longer BE the scale height',
    (s) => s.replace(/const\s+float\s+mieZenithLength\s*=\s*[^;]+;/, 'const float mieZenithLength = 4.0E3;'), /scale height/],
]) {
  restore();
  Sky.SkyShader.fragmentShader = mangle(Sky.SkyShader.fragmentShader);
  const sky = await freshSky();
  let threw = null;
  try { sky.installSkyAltitude(); } catch (e) { threw = e; }
  check(threw && expect.test(threw.message),
    `throws when ${name}`, threw ? threw.message.slice(0, 90) : 'it did not throw at all');
}
restore();

// ---- browser half: the pixels -------------------------------------------

const ALTITUDES = [1200, 1950, 2612, 4061];
const ZENITH = 90;
const HORIZON = 5;
const ORIENTATIONS = [{ pitch: 65, angles: [ZENITH] }, { pitch: 20, angles: [HORIZON] }];
const CAM = { x: 0, y: 6000, z: 0 }; // high enough that no ridge is in the way at either angle

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text()); });

await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__pngp?.sky && window.__pngp.camera.position.y !== 3000,
  null, { timeout: 180000 });

// The nav HUD is DOM over the canvas and sits dead centre at the TOP of the frame,
// which is exactly where the zenith sample lands. Left visible, this suite would
// be measuring a grey panel at its single most important angle and would report
// "the zenith does not move" no matter what the shader did.
await page.addStyleTag({
  content: '#top-left,#nav-hud,#env-controls,#credits-box,#fps,#controls-hint,#dev-note{display:none!important}',
});
await page.evaluate(() => window.__pngp.lighting.setTime(0.2)); // exactly the Midday preset (5 presets, so 1/5)

const sample = (img, px, py, half = 3) => {
  let r = 0; let g = 0; let b = 0; let n = 0;
  for (let y = py - half; y <= py + half; y++) {
    for (let x = px - half; x <= px + half; x++) {
      if (x < 0 || y < 0 || x >= img.width || y >= img.height) continue;
      const i = (y * img.width + x) * img.channels;
      r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; n++;
    }
  }
  return n ? [r / n / 255, g / n / 255, b / n / 255] : null;
};

const pixelFor = (deg) => page.evaluate((d) => {
  const { camera, renderer } = window.__pngp;
  const V = () => camera.position.clone();
  const f = camera.getWorldDirection(V());
  const az = Math.atan2(f.x, f.z);
  const r = (d * Math.PI) / 180;
  const v = V().set(
    camera.position.x + Math.sin(az) * Math.cos(r) * 1e5,
    camera.position.y + Math.sin(r) * 1e5,
    camera.position.z + Math.cos(az) * Math.cos(r) * 1e5,
  );
  v.project(camera);
  const size = renderer.getSize(V());
  return { px: Math.round(((v.x + 1) / 2) * size.x), py: Math.round(((1 - v.y) / 2) * size.y) };
}, deg);

const readings = {};
for (const m of ALTITUDES) {
  const predicted = await page.evaluate((h) => {
    window.__pngp.sky.altitude.value = h;
    return window.__pngp.sky.lengthsFor(h);
  }, m);

  readings[m] = { predicted };
  for (const o of ORIENTATIONS) {
    await page.evaluate(({ cam, pitch }) => {
      const { camera, controls } = window.__pngp;
      controls.mode = 'fly'; // walk mode re-clamps y to the ground every frame
      camera.position.set(cam.x, cam.y, cam.z);
      const r = (pitch * Math.PI) / 180;
      camera.lookAt(cam.x, cam.y + Math.sin(r) * 1000, cam.z + Math.cos(r) * 1000);
      camera.updateMatrixWorld(true);
    }, { cam: CAM, pitch: o.pitch });
    await page.waitForTimeout(3500); // headless renders this scene at ~1 fps

    const img = decode(await page.screenshot());
    readings[m].live = await page.evaluate(() => window.__pngp.sky.lengths());
    for (const deg of o.angles) {
      const at = await pixelFor(deg);
      readings[m][deg] = sample(img, at.px, at.py);
    }
  }
}
await browser.close();

const luma = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const blueness = ([r, , b]) => b / Math.max(r, 1e-4);

console.log('\n  altitude      zenith rgb          luma    B/R      horizon luma');
for (const m of ALTITUDES) {
  const s = readings[m];
  console.log(`  ${String(m).padStart(5)} m   ${s[ZENITH].map((c) => c.toFixed(3)).join('/')}`
    + `   ${luma(s[ZENITH]).toFixed(3)}   ${blueness(s[ZENITH]).toFixed(2)}`
    + `       ${luma(s[HORIZON]).toFixed(3)}`);
}
console.log();

// The pin has to reach the shader, not just the JS holder. This is the assertion
// the basemap suite learned to make the hard way.
for (const m of ALTITUDES) {
  const { predicted, live } = readings[m];
  const near = (a, b) => Math.abs(a - b) < Math.max(1e-6, Math.abs(b) * 1e-6);
  if (!near(live.rayleighZenithLength, predicted.rayleighZenithLength)
    || !near(live.mieZenithLength, predicted.mieZenithLength)) {
    fail(`at ${m} m the shader holds ${live.rayleighZenithLength.toFixed(1)}/${live.mieZenithLength.toFixed(1)}`
      + ` but the model says ${predicted.rayleighZenithLength.toFixed(1)}/${predicted.mieZenithLength.toFixed(1)}`);
  }
}
ok('at every altitude the uniforms the shader holds are the ones the model computed');

// ...and the pin has to MOVE THE SKY. Without this the whole suite could pass on a
// sky that never changed: every bracket below is relative.
const lo = readings[ALTITUDES[0]][ZENITH];
const hi = readings[ALTITUDES[ALTITUDES.length - 1]][ZENITH];
check(Math.abs(luma(lo) - luma(hi)) > 0.02,
  'pinning the altitude actually moves the rendered zenith',
  `${luma(lo).toFixed(4)} vs ${luma(hi).toFixed(4)} - identical readings mean the pin reached nothing`);

// Monotonic in altitude, in both of the things the user asked for: darker, bluer.
let monoDark = true; let monoBlue = true;
for (let i = 1; i < ALTITUDES.length; i++) {
  const a = readings[ALTITUDES[i - 1]][ZENITH];
  const b = readings[ALTITUDES[i]][ZENITH];
  if (luma(b) >= luma(a)) monoDark = false;
  if (blueness(b) <= blueness(a)) monoBlue = false;
}
check(monoDark, 'the zenith darkens at every step up, with no reversal');
check(monoBlue, 'the zenith gets bluer (B/R up) at every step up, with no reversal');

// The claim the dome-only scope rests on, and therefore the one that has to hold:
// the horizon is where the per-preset fog colour was tuned, and it must not move
// materially, or the untouched fog would start disagreeing with the sky behind it.
const zenithMove = Math.abs(1 - luma(readings[4061][ZENITH]) / luma(readings[1950][ZENITH]));
const horizonMove = Math.abs(1 - luma(readings[4061][HORIZON]) / luma(readings[1950][HORIZON]));
check(horizonMove < 0.03,
  `spawn -> summit, the horizon sky moves under 3% (${(horizonMove * 100).toFixed(1)}%), so the untouched fog colour still matches it`);
check(zenithMove > horizonMove * 3,
  'the effect is concentrated at the zenith, not spread over the whole dome',
  `zenith ${(zenithMove * 100).toFixed(1)}% vs horizon ${(horizonMove * 100).toFixed(1)}%`);

if (pageErrors.length) fail(`${pageErrors.length} console/page error(s): ${pageErrors.slice(0, 3).join(' | ')}`);

console.log(failures
  ? `\n${failures} check(s) failed.`
  : '\nThe sky thins with altitude: deeper at the zenith, unchanged at the horizon, exact at the spawn.');
process.exit(failures ? 1 : 0);
