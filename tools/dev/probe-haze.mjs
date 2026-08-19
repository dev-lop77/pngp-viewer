#!/usr/bin/env node
// Sweeps the distance haze (src/atmosphere.js's `1 - exp(-d * uAtmoHaze)`) in the
// real page and reports what it does to real pixels - the DEPTH half of the
// aerial-perspective request (docs/PROGRESS.md).
//
// What this probe is FOR, and what it is not for. Whether the park has "enough
// air" between its ridges is a looking decision and belongs to the user on real
// hardware, which is why src/main.js also has an 'H' key that sweeps the same
// holder live. Headless is SwiftShader, trustworthy for geometry and layout and
// NOT for overall brightness (docs/ARCHITECTURE.md §13.11) - so the images here
// are the SHAPE of the change and the numbers are ratios between settings taken
// under one renderer, never an absolute verdict on the look.
//
// Four disciplines this project has already paid for, applied here:
//
// 1. The knob is the HOLDER, not the uniform. lighting.js rewrites uAtmoHaze
//    every frame from the time-of-day preset (`s.haze * m.hazeMul * HAZE_SCALE`),
//    so assigning the uniform reads back its own write and changes nothing on
//    screen - the trap already documented for GROUNDCOVER_WIND and SNOW_LEVEL
//    (§13.10). The pin goes through window.__pngp.atmo.hazeScale, and every
//    reading reports the LIVE uniform read after a frame, so a number here is
//    one the shader actually saw.
// 2. ONE session, ONE camera per vantage. Two runs are not the same scene: the
//    animals, the birds and the gust differ (docs/PROGRESS-ARCHIVE.md 2026-08-10).
//    The whole sweep happens without moving the camera between shots.
// 3. Measure the SCREENSHOT, not a canvas readback. There is no
//    preserveDrawingBuffer, so drawImage() after the frame is presented reads an
//    empty buffer and reports 0.000 for everything, silently (2026-08-11).
// 4. The horizon row is PROJECTED through three's own camera matrices in the
//    page, not derived from FOV arithmetic on this side, so the "far" band really
//    is the band just below the skyline at whatever pitch the shot was taken.
//
// Usage: tools/dev/start-dev.sh && node tools/dev/probe-haze.mjs [url] [--time=0.15]
//        [--scales=0.6,1,1.5,2.2] [--only=summit,cogne] [--width=760 --height=480]
//        [--quality=low|full]

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { captureCanvas } from '../lib/canvas-capture.mjs';

const argv = process.argv.slice(2);
const flag = (name, dflt) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit === undefined ? dflt : hit.slice(name.length + 3);
};
const url = argv.find((a) => !a.startsWith('--')) ?? 'http://localhost:5173';
const SCALES = flag('scales', '0.6,1,1.5,2.2').split(',').map(Number);
const TIME = Number(flag('time', '0.15')); // the app's own default: mid-morning, dawn->day at 0.75
const ONLY = flag('only', null)?.split(',').map((k) => k.trim());
const OUT_DIR = 'tools/dev/logs';
// Frame size and scene weight, because SwiftShader's cost here is not a detail: at
// 1100x700 with the shipped quality settings ONE frame of the deep vantage takes
// minutes on a loaded machine, and a sweep that waits for real frames (which it must
// - see the pin comment below) then costs an hour. Both levers are honest for THIS
// question: the haze is a per-pixel mix toward the fog colour and does not care how
// much grass is drawn or how big the frame is. Neither is honest for anything about
// detail or cost, which is what the quality settings exist to judge.
const WIDTH = Number(flag('width', '760'));
const HEIGHT = Number(flag('height', '480'));
const LIGHT_SCENE = flag('quality', 'low') === 'low';

// Real vantages with real sight lines, and each one asks a different question.
// Coordinates are src/geo.js's local metres, taken from public/data/poi.json
// (Gran Paradiso 4049 m at x -6311 z 13865, Colle del Nivolet 2619 m, Cogne
// 1540 m) rather than typed from a map - the one bbox rebuild this project has
// had is why coordinates live in data and not in tools.
const VANTAGES = [
  {
    key: 'summit',
    label: 'Gran Paradiso summit, looking north down the whole map',
    // 90 m above the summit, so the shot cannot be spoiled by the drawn mesh
    // sitting below the real altitude on a sharp peak (§13.9's cousin: a peak's
    // elevationM is not where the triangles are).
    at: { x: -6311, y: 4140, z: 13865 },
    towards: { x: -6311, y: 1200, z: -28000 },
    question: 'the deep view - 42 km of park and the outer ring beyond it',
  },
  {
    key: 'nivolet',
    label: 'Colle del Nivolet, looking at the massif',
    at: { x: -16164, y: 2680, z: 17936 },
    towards: { x: -6311, y: 3600, z: 13865 },
    question: 'the mid view - ridges at 5 to 12 km, the commonest thing on screen',
  },
  {
    key: 'cogne',
    label: 'above Cogne, looking up the Valnontey to the massif',
    at: { x: 833, y: 1620, z: 3910 },
    towards: { x: -6311, y: 3400, z: 13865 },
    question: 'the valley view - layered ridges from 2 to 12 km at eye level',
  },
].filter((v) => !ONLY || ONLY.includes(v.key));

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
// The default is smaller than shoot.mjs's 1400x900 for the reason above: the deep
// vantages draw the whole map, and at 1400x900 a frame of that did not present
// within playwright's 30 s screenshot timeout at all. The bands are measured as
// fractions of the frame, so no number here depends on the size.
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
page.setDefaultTimeout(180000);
const problems = [];
page.on('pageerror', (e) => problems.push(`[pageerror] ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`[console.error] ${m.text()}`); });

await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__pngp?.atmo && window.__pngp.getGroundHeight(), null, { timeout: 180000 });
await page.waitForTimeout(4000); // trails/water/poi loaders, and headless draws at ~1 fps

// Clear skies, so hazeMul is 1 and the sweep is the only thing moving; and the
// app's own time of day, because the preset is what sets the BASE haze and a
// sweep against some other hour would be a sweep of a look nobody sees.
await page.evaluate((t) => {
  const w = document.getElementById('env-weather');
  w.value = '0';
  w.dispatchEvent(new Event('change'));
  const s = document.getElementById('env-time');
  s.value = String(t);
  s.dispatchEvent(new Event('input'));
}, TIME);
// The HUD is DOM over the canvas: it would land inside the measured bands and,
// worse, inside the pictures the whole exercise is about.
await page.addStyleTag({
  content: '#top-left,#nav-hud,#env-controls,#credits-box,#fps,#controls-hint,#dev-note,#poi-info,'
    + '#look-diag,#audio-diag,#compass,#view-actions,#poi-search,.poi-label{display:none!important}',
});
if (LIGHT_SCENE) {
  // Ground cover off, standard models, no height tier: --quality=full keeps the
  // shipped settings for a shot that has to look like the real thing.
  await page.evaluate(() => {
    for (const [id, v] of [['env-groundcover', '0'], ['env-models', '0'], ['env-terrain', '0']]) {
      const el = document.getElementById(id);
      el.value = v;
      el.dispatchEvent(new Event('change'));
    }
  });
  await page.waitForTimeout(3000);
}
const timeLabel = await page.evaluate(() => window.__pngp.lighting.label);
await page.waitForTimeout(2000);


const luma = (r, g, b) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;

// Mean and RMS contrast of one horizontal band of the screenshot, plus the band's
// mean absolute difference from the same band of a reference shot. RMS contrast is
// the number that answers the actual question: haze does not just brighten the far
// ground, it FLATTENS it, and a ridge stops separating from the ridge behind it.
function band(img, y0, y1, ref) {
  const { width, data, channels } = img;
  let sum = 0, sum2 = 0, diff = 0, n = 0;
  for (let y = y0; y < y1; y += 1) {
    for (let x = 0; x < width; x += 2) { // every other column: 315k samples is plenty
      const i = (y * width + x) * channels;
      const L = luma(data[i], data[i + 1], data[i + 2]);
      sum += L; sum2 += L * L; n += 1;
      if (ref) {
        const R = luma(ref.data[i], ref.data[i + 1], ref.data[i + 2]);
        diff += Math.abs(L - R);
      }
    }
  }
  const mean = sum / n;
  return { mean, rms: Math.sqrt(Math.max(sum2 / n - mean * mean, 0)), diff: ref ? diff / n : 0 };
}

const rows = [];
for (const v of VANTAGES) {
  console.log(`\n=== ${v.label}\n    ${v.question}`);
  // Fly mode: walk mode re-clamps to the ground every frame and would throw the
  // altitude away before the first shot.
  await page.evaluate(({ at, towards }) => {
    window.__pngp.controls.mode = 'fly';
    window.__pngp.camera.position.set(at.x, at.y, at.z);
    window.__pngp.camera.lookAt(towards.x, towards.y, towards.z);
    window.__pngp.camera.updateMatrixWorld(true);
  }, v);
  await page.waitForTimeout(6000); // LOD refill + the tile crossfade, at ~1 fps

  // The horizon: the screen row a HORIZONTAL ray leaves at, projected by the page's
  // own camera. Everything from there down to +11% of the frame is "far" ground;
  // the bottom quarter is "near" ground. Both are computed per vantage because the
  // pitch differs between them.
  const geom = await page.evaluate(() => {
    const c = window.__pngp.camera;
    c.updateMatrixWorld(true);
    // The screen row a HORIZONTAL ray leaves at - so the band below it is the most
    // distant ground in frame, and it stays put across the sweep (a skyline found
    // by texture would move with the haze, which is the thing being measured).
    //
    // Pinhole arithmetic on three's own vertical FOV and the camera's own forward
    // vector, NOT a hand-rolled projection: the first version of this probe
    // multiplied the view matrix by hand and put the horizon 80 px BELOW the
    // skyline at a 4140 m vantage, which is geometrically impossible - terrain
    // cannot rise above a horizontal ray from above it. It was the row mirrored
    // about the frame centre, and it was caught by measuring where sky actually
    // ends in the screenshot (row ~315, against the 308 this returns).
    //
    // three's cameras look down -Z, and matrixWorld's third column is the camera's
    // local +Z in world space.
    const e = c.matrixWorld.elements;
    const fwd = [-e[8], -e[9], -e[10]];
    const len = Math.hypot(fwd[0], fwd[1], fwd[2]) || 1;
    const pitch = Math.asin(fwd[1] / len); // negative looking down
    const halfFov = (c.fov * Math.PI) / 360;
    const h = window.innerHeight;
    return {
      horizonY: Math.round(h / 2 - (h / 2) * (Math.tan(-pitch) / Math.tan(halfFov))),
      height: h,
      camY: Math.round(c.position.y),
      pitchDeg: Math.round((pitch * 180) / Math.PI),
      fov: c.fov,
    };
  });
  const hy = Math.max(0, Math.min(geom.height - 2, geom.horizonY));
  const farBand = [Math.min(hy + 2, geom.height - 2), Math.min(hy + Math.round(geom.height * 0.11), geom.height - 1)];
  const nearBand = [Math.round(geom.height * 0.75), geom.height - 1];
  console.log(`    horizon row ${hy} of ${geom.height} (camera ${geom.camY} m, pitch ${geom.pitchDeg} deg) -`
    + ` far band rows ${farBand[0]}-${farBand[1]}, near band ${nearBand[0]}-${nearBand[1]}`);

  // How long a frame of THIS view takes, before the sweep spends fifteen of them.
  // Printed because the first three attempts at this probe were diagnosed as bugs
  // when the real answer was that a deep vantage under SwiftShader can take minutes
  // per frame, and "it produced no output for ten minutes" looks identical to a
  // hang. Two frames, so the reading is an interval and not a first-frame cost.
  const frameMs = await page.evaluate(() => new Promise((r) => {
    const t0 = performance.now();
    requestAnimationFrame(() => requestAnimationFrame(() => r(performance.now() - t0)));
  }));
  console.log(`    ${(frameMs / 2 / 1000).toFixed(1)} s per frame here (SwiftShader, and only good as a ratio)`);

  let ref = null;
  for (const scale of SCALES) {
    // Wait for the RENDER LOOP to have consumed the pin, not for a clock. The first
    // version of this waited 3 s and read the uniform after it, and at the Nivolet -
    // where SwiftShader draws well under one frame per second - it read the PREVIOUS
    // step's value twice: the loop had not run, so the pin had reached the holder and
    // nothing else (docs/ARCHITECTURE.md §13.10 - a readback is not evidence unless
    // you know when it is sampled). Every reading was honest and two of the shots
    // were mislabelled, which is the worse half of that bug.
    const before = await page.evaluate(() => window.__pngp.atmo.haze());
    await page.evaluate((s) => { window.__pngp.atmo.hazeScale.value = s; }, scale);
    const reached = await page
      .waitForFunction(
        (prev) => Math.abs(window.__pngp.atmo.haze() - prev) > 1e-12,
        before,
        { timeout: 240000, polling: 'raf' },
      )
      .then(() => true)
      .catch(() => false);
    if (!reached) {
      console.log(`    x${scale.toFixed(2)}  SKIPPED: no frame consumed the pin in 240 s`
        + ` (uniform still ${(before * 1e5).toFixed(2)}e-5). A shot here would carry the`
        + ' previous step\'s haze under this step\'s name.');
      continue;
    }
    // The uniform is written at the top of a loop iteration and the draw happens
    // inside the same one, so by here the value is at worst one frame from the
    // pixels; ONE more presented frame closes that. Not three: the deep vantages
    // take the better part of a minute per frame under SwiftShader, so each extra
    // frame is a minute of wall clock per step - and the screenshot forces one more
    // on top. Three of them turned a 15-shot sweep into an hour.
    await page.evaluate(() => new Promise((r) => { requestAnimationFrame(() => r()); }));
    const haze = await page.evaluate(() => window.__pngp.atmo.haze());
    const file = `${OUT_DIR}/haze-${v.key}-x${String(scale).replace('.', '_')}.png`;
    const img = await captureCanvas(page, file);
    const far = band(img, farBand[0], farBand[1], ref);
    const near = band(img, nearBand[0], nearBand[1], ref);
    if (scale === 1) ref = img; // the shipped look is the reference every diff is against
    const at = (km) => (1 - Math.exp(-km * 1000 * haze));
    rows.push({
      vantage: v.key, scale, haze,
      f10: at(10), f30: at(30), f60: at(60),
      farMean: far.mean, farRms: far.rms, farDiff: far.diff,
      nearMean: near.mean, nearRms: near.rms, nearDiff: near.diff,
      file,
    });
    console.log(`    x${scale.toFixed(2)}  haze ${(haze * 1e5).toFixed(2)}e-5`
      + `  taken: 10 km ${(at(10) * 100).toFixed(0)}%  30 km ${(at(30) * 100).toFixed(0)}%  60 km ${(at(60) * 100).toFixed(0)}%`
      + `  |  far luma ${far.mean.toFixed(3)} rms ${far.rms.toFixed(3)}`
      + `  near luma ${near.mean.toFixed(3)} rms ${near.rms.toFixed(3)}`
      + `  -> ${file}`);
  }
  // The diffs are against the x1 shot, which is only decoded once the sweep reaches
  // it - so the shots before it have no reference and are re-stated here relative
  // to it rather than quietly reported as 0.
  const base = rows.filter((r) => r.vantage === v.key).find((r) => r.scale === 1);
  if (base) {
    console.log(`    against the shipped look (x1, far rms ${base.farRms.toFixed(3)}):`);
    for (const r of rows.filter((x) => x.vantage === v.key)) {
      const d = ((r.farRms / base.farRms - 1) * 100);
      console.log(`      x${r.scale.toFixed(2)}  far contrast ${d >= 0 ? '+' : ''}${d.toFixed(1)}%`
        + `  far luma ${r.farMean >= base.farMean ? '+' : ''}${((r.farMean - base.farMean) * 100).toFixed(1)} pts`
        + `  near luma ${r.nearMean >= base.nearMean ? '+' : ''}${((r.nearMean - base.nearMean) * 100).toFixed(1)} pts`);
    }
  }
}

writeFileSync(`${OUT_DIR}/haze-sweep.json`, JSON.stringify({ url, time: TIME, timeLabel, rows }, null, 2));
console.log(`\nTime of day: ${timeLabel} (slider ${TIME})`);
console.log(`Wrote ${OUT_DIR}/haze-sweep.json`);
if (problems.length) console.log(`\n${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
await browser.close();
