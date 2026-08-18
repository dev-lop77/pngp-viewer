#!/usr/bin/env node
// Measures what the altitude-aware sky (src/sky.js) actually does to rendered
// pixels, as a profile from the zenith down to the horizon at several altitudes.
//
// Two disciplines this project has paid for, both applied here:
//
// 1. ONE camera, ONE session, ONE position. The altitude is pinned through
//    window.__pngp.sky.altitude - the page's own holder - instead of by flying
//    the camera up, so nothing else in the frame differs between two readings.
//    Flying would change the terrain in shot, the fog path length and the tile
//    set at the same time, and then the numbers would be about all of those
//    (docs/PROGRESS-ARCHIVE.md 2026-08-10, "a separate render is not the same scene";
//    2026-08-11, the Vite module-instance trap that makes a test-side import of
//    the holder read back its own writes).
//
// 2. Measure the SCREENSHOT, not a canvas readback. The context has no
//    preserveDrawingBuffer, so drawImage() after the frame is presented reads an
//    empty buffer and reports 0.000 for everything without complaining
//    (docs/PROGRESS-ARCHIVE.md 2026-08-11). The screenshot goes through the compositor,
//    which is what the user's eye gets - and for the sky that also means the
//    reading includes ACES and toneMappingExposure, which is most of what
//    decides the colour. A linear render target would measure a different sky.
//
// The pixel for a given elevation angle is computed by projecting a real world
// direction through three's own camera matrices in the page, not from FOV
// arithmetic on this side - so the sample really is the sky at that angle.
//
// Usage: tools/dev/start-dev.sh && node tools/dev/probe-sky.mjs [url]

import { chromium } from 'playwright';
import { decode } from 'fast-png';

const url = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'http://localhost:5173';

// Real places, so the numbers mean something to read: the DEM floor, the Le Pont
// spawn (which is src/sky.js's reference altitude), the Nivolet, and the summit.
const ALTITUDES = [
  { m: 400, name: 'DEM floor' },
  { m: 1200, name: 'low valley' },
  { m: 1950, name: 'Le Pont spawn = ref' },
  { m: 2612, name: 'Colle del Nivolet' },
  { m: 3200, name: 'high pass' },
  { m: 4061, name: 'Gran Paradiso summit' },
];

// Elevation angles to read, in degrees above the horizontal. 90 is the zenith.
const ANGLES = [90, 60, 40, 25, 12, 5];

// The camera sits high and looks up; the altitude it REPORTS to the sky is the
// pinned one, so this position only has to keep the sky unobstructed.
const CAM = { x: 0, y: 6000, z: 0 };

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__pngp?.sky && window.__pngp.camera.position.y !== 3000,
  null, { timeout: 180000 });

// The HUD is DOM drawn over the canvas, and the nav panel sits dead centre at the
// TOP of the frame - exactly where the zenith sample lands. A screenshot would
// read the panel's grey instead of the sky and the whole profile would be quietly
// wrong at its most important angle.
await page.addStyleTag({
  content: '#top-left,#nav-hud,#env-controls,#credits-box,#fps,#controls-hint,#dev-note{display:none!important}',
});

// Pin Midday, which is where "deep blue" is a question at all, and where
// lighting.js's own comment records the sun-elevation sensitivity worth watching.
// PRESETS has 5 entries, so fraction 1/5 lands exactly on the day preset.
await page.evaluate(() => window.__pngp.lighting.setTime(0.2));

// Two orientations cover 90 deg down to 5 deg without a wide-angle distortion:
// the camera's vertical FOV is 60 deg (main.js), so each shot spans pitch +/-30.
const ORIENTATIONS = [
  { pitch: 65, covers: [40, 95] },
  { pitch: 20, covers: [-5, 50] },
];

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

// Where does elevation angle `deg` land on screen, for the camera as it stands?
// Done with the camera's own matrices so it cannot drift from what was drawn.
// Takes the page explicitly: each mode below drives its own browser, and the first
// version closed over the first one - which had already been closed by the time a
// mode ran.
const pixelForOn = (pg, deg) => pg.evaluate((d) => {
  const { camera, renderer } = window.__pngp;
  // Vector3 without importing three on this side: the camera's own position is
  // one, and .clone() keeps the class.
  const V = () => camera.position.clone();
  // Keep the azimuth the camera is already looking along and change only the
  // elevation, so every sample sits on one vertical great circle through the view
  // centre and the sun's relative bearing stays fixed across angles.
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
  return {
    px: Math.round(((v.x + 1) / 2) * size.x),
    py: Math.round(((1 - v.y) / 2) * size.y),
    w: size.x,
    h: size.y,
  };
}, deg);

const pixelFor = (deg) => pixelForOn(page, deg);

// A mode flag means "only that", so a focused question does not pay for the full
// profile first (it is ~2 minutes at this frame rate).
const MODES_ONLY = process.argv.some((a) => a === '--sweep' || a === '--rayleigh');

const rows = [];
for (const alt of (MODES_ONLY ? [] : ALTITUDES)) {
  const reached = await page.evaluate((m) => {
    window.__pngp.sky.altitude.value = m;
    return window.__pngp.sky.lengthsFor(m);
  }, alt.m);

  const byAngle = {};
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

    const shot = await page.screenshot();
    const img = decode(shot);
    // Confirm the pin reached the shader for THIS frame, not just the JS holder -
    // the failure this project keeps meeting is a pin that sets a field nobody
    // reads while every derived number still looks plausible.
    const live = await page.evaluate(() => window.__pngp.sky.lengths());

    for (const deg of ANGLES) {
      if (deg < o.covers[0] || deg > o.covers[1]) continue;
      const at = await pixelFor(deg);
      if (at.px < 4 || at.py < 4 || at.px > at.w - 5 || at.py > at.h - 5) continue;
      const rgb = sample(img, at.px, at.py);
      if (rgb) byAngle[deg] = { rgb, live };
    }
  }
  rows.push({ ...alt, reached, byAngle });
}

await browser.close();

const luma = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

if (!MODES_ONLY) {
console.log('\nPinned altitude -> the two zenith optical lengths the shader was given:\n');
console.log('  altitude                     rayleigh m    mie m    live rayleigh / mie');
for (const r of rows) {
  const any = Object.values(r.byAngle)[0];
  console.log(
    `  ${String(r.m).padStart(5)} m ${r.name.padEnd(22)}`
    + `${r.reached.rayleighZenithLength.toFixed(0).padStart(7)}`
    + `${r.reached.mieZenithLength.toFixed(0).padStart(9)}`
    + `      ${any ? `${any.live.rayleighZenithLength.toFixed(0)} / ${any.live.mieZenithLength.toFixed(0)}` : '-'}`,
  );
}

for (const metric of ['luma', 'B/R', 'rgb']) {
  console.log(`\n${metric === 'rgb' ? 'rendered rgb' : metric} by elevation angle:\n`);
  console.log(`  altitude        ${ANGLES.map((a) => `${a}°`.padStart(metric === 'rgb' ? 20 : 8)).join('')}`);
  for (const r of rows) {
    const cells = ANGLES.map((a) => {
      const s = r.byAngle[a];
      if (!s) return '-'.padStart(metric === 'rgb' ? 20 : 8);
      if (metric === 'luma') return luma(s.rgb).toFixed(3).padStart(8);
      if (metric === 'B/R') return (s.rgb[2] / Math.max(s.rgb[0], 1e-4)).toFixed(2).padStart(8);
      return s.rgb.map((c) => c.toFixed(2)).join('/').padStart(20);
    });
    console.log(`  ${String(r.m).padStart(5)} m        ${cells.join('')}`);
  }
}

// The claim the whole "dome only" scope rests on: the zenith moves a lot with
// altitude and the horizon barely does, which is why the per-preset fog colour
// (tuned against the horizon sky) stays valid untouched. Stated as a number here
// rather than asserted - this is the instrument, tools/test-sky.mjs is the test.
const ref = rows.find((r) => r.m === 1950);
const top = rows[rows.length - 1];
if (ref && top) {
  console.log('\nspawn -> summit, as a ratio of the reference reading:\n');
  for (const a of ANGLES) {
    const x = ref.byAngle[a]; const y = top.byAngle[a];
    if (!x || !y) continue;
    console.log(`  ${String(a).padStart(3)}°  luma x${(luma(y.rgb) / luma(x.rgb)).toFixed(3)}`
      + `   B/R ${(x.rgb[2] / x.rgb[0]).toFixed(2)} -> ${(y.rgb[2] / y.rgb[0]).toFixed(2)}`);
  }
}
} // end !MODES_ONLY

// ---- what a stronger-than-physical exponent would buy --------------------
// Only reachable with --sweep, and deliberately separate from everything above:
// the numbers above are the physics, these are a lie with a dial on it. The point
// is to let the choice be made on measured readings from one camera rather than on
// imagination, which is how BASEMAP_GAIN was settled.
if (process.argv.includes('--sweep')) {
  const b2 = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const p2 = await b2.newPage({ viewport: { width: 900, height: 600 } });
  await p2.goto(url, { waitUntil: 'load' });
  await p2.waitForFunction(() => window.__pngp?.sky && window.__pngp.camera.position.y !== 3000,
    null, { timeout: 180000 });
  await p2.addStyleTag({
    content: '#top-left,#nav-hud,#env-controls,#credits-box,#fps,#controls-hint,#dev-note{display:none!important}',
  });
  await p2.evaluate(() => window.__pngp.lighting.setTime(0.2));
  await p2.evaluate(({ cam }) => {
    const { camera, controls } = window.__pngp;
    controls.mode = 'fly';
    camera.position.set(cam.x, cam.y, cam.z);
    camera.lookAt(cam.x, cam.y + Math.sin((65 * Math.PI) / 180) * 1000, cam.z + Math.cos((65 * Math.PI) / 180) * 1000);
    camera.updateMatrixWorld(true);
  }, { cam: CAM });

  const zenithPixel = () => p2.evaluate(() => {
    const { camera, renderer } = window.__pngp;
    const V = () => camera.position.clone();
    const v = V().set(camera.position.x, camera.position.y + 1e5, camera.position.z);
    v.project(camera);
    const size = renderer.getSize(V());
    return { px: Math.round(((v.x + 1) / 2) * size.x), py: Math.round(((1 - v.y) / 2) * size.y) };
  });

  // BOTH ends, because the exponent is symmetric: whatever it does to the summit
  // it also does, inverted, to the valley. A knob that deepens the high sky by
  // wrecking the low one is not a knob anybody can actually turn, and the only way
  // to know which it is, is to read the low end too.
  console.log('\nzenith as the strength exponent is pushed past 1 - at the summit AND in the valley:\n');
  console.log('  strength   4061 m: rgb            luma   B/R      1200 m: rgb            luma   B/R');
  for (const s of [1, 1.5, 2, 3, 4, 6]) {
    const cells = [];
    for (const m of [4061, 1200]) {
      await p2.evaluate(({ v, h }) => {
        window.__pngp.sky.strength.value = v;
        window.__pngp.sky.altitude.value = h;
      }, { v: s, h: m });
      await p2.waitForTimeout(3500);
      const rgb = sample(decode(await p2.screenshot()), ...Object.values(await zenithPixel()));
      cells.push(`${rgb.map((c) => c.toFixed(3)).join('/')}   ${luma(rgb).toFixed(3)}  ${(rgb[2] / rgb[0]).toFixed(2)}`);
    }
    console.log(`  ${String(s).padStart(5)}      ${cells.join('      ')}`);
  }
  await b2.close();
}

// ---- deepening the BASELINE blue, and proving it reaches nothing else ----
// The user's choice 2026-08-12: the sky should be deeper at every altitude, not
// only high up. The lever is the Midday preset's `rayleigh`, which is a uniform of
// the Sky dome and of nothing else - there is no PMREMGenerator, no
// scene.environment, no envMap and no CubeCamera anywhere in src/, so the dome is
// drawn and never read back. The terrain, trees and water are lit by a real
// DirectionalLight + AmbientLight whose colours come from separate preset fields.
//
// That is an argument from reading the code, so this mode MEASURES it instead: the
// ground is sampled at every step and has to come back identical. It also watches
// the horizon against the fog colour, because deepening the whole dome (unlike the
// altitude term) does move the horizon, and the horizon is where the untouched
// per-preset fog colour has to keep matching.
//
// lighting.applyState() re-reads lighting.state every frame and does not recompute
// it, so writing state.rayleigh directly holds until the next setTime() - no code
// change needed to sweep it.
if (process.argv.includes('--rayleigh')) {
  const b3 = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const p3 = await b3.newPage({ viewport: { width: 900, height: 600 } });
  await p3.goto(url, { waitUntil: 'load' });
  await p3.waitForFunction(() => window.__pngp?.sky && window.__pngp.camera.position.y !== 3000,
    null, { timeout: 180000 });
  await p3.addStyleTag({
    content: '#top-left,#nav-hud,#env-controls,#credits-box,#fps,#controls-hint,#dev-note{display:none!important}',
  });
  await p3.evaluate(() => window.__pngp.lighting.setTime(0.2));

  const place = (pitch) => p3.evaluate(({ cam, d }) => {
    const { camera, controls } = window.__pngp;
    controls.mode = 'fly';
    camera.position.set(cam.x, cam.y, cam.z);
    const r = (d * Math.PI) / 180;
    camera.lookAt(cam.x, cam.y + Math.sin(r) * 1000, cam.z + Math.cos(r) * 1000);
    camera.updateMatrixWorld(true);
  }, { cam: CAM, d: pitch });

  // A vantage low enough that the frame's lower half is real ground, for the
  // invariance check. Same place every time, so any difference is the grade.
  const GROUND_CAM = { x: 2000, y: 2600, z: 6000 };
  const placeGround = () => p3.evaluate(({ cam }) => {
    const { camera, controls } = window.__pngp;
    controls.mode = 'fly';
    camera.position.set(cam.x, cam.y, cam.z);
    camera.lookAt(cam.x, cam.y - 900, cam.z - 6000);
    camera.updateMatrixWorld(true);
  }, { cam: GROUND_CAM });

  console.log('\nMidday rayleigh swept. Zenith read at three altitudes, plus the horizon,');
  console.log('plus the GROUND from a fixed vantage that must not move at all.\n');
  console.log('  rayleigh   1950 m zenith        2612 m zenith        4061 m zenith        horiz  ground rgb          fog rgb');
  for (const ray of [2.5, 2.0, 1.6, 1.3, 1.0]) {
    const cells = [];
    for (const m of [1950, 2612, 4061]) {
      await p3.evaluate(({ r, h }) => {
        window.__pngp.lighting.state.rayleigh = r;
        window.__pngp.sky.altitude.value = h;
      }, { r: ray, h: m });
      await place(65);
      await p3.waitForTimeout(3500);
      const rgb = sample(decode(await p3.screenshot()), ...Object.values(await pixelForOn(p3, 90)));
      cells.push(`${rgb.map((c) => c.toFixed(3)).join('/')} ${(rgb[2] / rgb[0]).toFixed(2)}`);
    }
    // Horizon, and the fog colour it has to keep agreeing with.
    await p3.evaluate((h) => { window.__pngp.sky.altitude.value = h; }, 1950);
    await place(20);
    await p3.waitForTimeout(3500);
    const hz = sample(decode(await p3.screenshot()), ...Object.values(await pixelForOn(p3, 5)));
    const fog = await p3.evaluate(() => {
      const c = window.__pngp.scene.fog.color;
      return [c.r, c.g, c.b];
    });
    // The ground, which is the whole point of this mode.
    await placeGround();
    await p3.waitForTimeout(3500);
    const gimg = decode(await p3.screenshot());
    const gnd = sample(gimg, 450, 480, 40);
    console.log(`  ${String(ray).padStart(5)}      ${cells.join('   ')}   ${luma(hz).toFixed(3)}`
      + `  ${gnd.map((c) => c.toFixed(3)).join('/')}   ${fog.map((c) => c.toFixed(2)).join('/')}`);
  }
  await b3.close();
}

if (errors.length) console.log(`\n${errors.length} console/page error(s):\n  ${errors.slice(0, 5).join('\n  ')}`);
