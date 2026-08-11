#!/usr/bin/env node
// Watch snow settle and melt in the real page, at real elapsed times.
//
// The suite (tools/test-snow.mjs) proves WHERE snow lies, per point, against
// src/snow.js's own CPU twin. This is the other half: what the whole thing looks
// like while it happens, from a vantage that spans valley to summit - and it runs
// against the actual page, so the lighting rig, the exposure and ACES are all in
// play, which the suite's ambient-PI rig deliberately removes.
//
// Timing is honest even at SwiftShader's ~1 fps: the accumulator in weather.js is
// x += (target - x) * (1 - exp(-dt/tau)), which is EXACT for any step size, so the
// level at a given wall-clock time does not depend on the frame rate. What is
// left to the real browser is only how it LOOKS, which is what headless has been
// wrong about five times.
//
// Two frames of the same scene are shot first as a noise floor: birds, animals
// and the cloud deck all move between shots, so a percentage of changed pixels
// means nothing without it.
//
// Usage: tools/dev/start-dev.sh && node tools/dev/probe-snow.mjs ["Place"] [--climb=m] [--back=m]

import { chromium } from 'playwright';
import { decode } from 'fast-png';

const args = process.argv.slice(2);
const flags = new Map(
  args.filter((a) => a.startsWith('--')).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }),
);
const place = args.filter((a) => !a.startsWith('--'))[0] ?? 'Gran Paradiso';
const url = flags.get('url') ?? 'http://localhost:5173';
const climb = Number(flags.get('climb') ?? 900); // metres above the place
const back = Number(flags.get('back') ?? 3200); // metres to the south of it
// --wooded=1800 stands in the densest canopy the mask has near that elevation
// instead of at a named place. Trees only draw within 440 m of the camera, so a
// landscape vantage cannot show them at all and a POI is rarely in a wood.
const wooded = flags.has('wooded') ? Number(flags.get('wooded')) : null;
const tag = wooded !== null ? `wooded-${wooded}` : place.replace(/[^\w]+/g, '-').toLowerCase();
// Ground snow with the sky held still, which is the only way to see what the snow
// itself does: switching the weather to Snowfall also drops a cloud deck, doubles
// the haze and fills the frame with falling particles, and the first run of this
// probe could not tell any of that from snow on the ground. Pinned by replacing
// the uniform holder's `value` with a getter - three reads it at upload time, so
// the render loop's own assignment each frame becomes a no-op with no test-only
// code in src/main.js.
const PINNED_LEVELS = [0, 0.3, 0.5, 0.7, 1];

// Wall-clock seconds after the weather is switched. Build tau is 6 s, melt 12 s
// (weather.js), so these bracket both ramps rather than sampling one twice.
const BUILD_AT_S = [0, 3, 6, 12, 25];
const MELT_AT_S = [4, 12, 30];

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
const problems = [];
page.on('pageerror', (err) => problems.push(`[pageerror] ${err.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') problems.push(`[console.error] ${msg.text()}`);
});

await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
// The dev handle is published at the END of main.js's async init, after the
// terrain, POI, trails and water have all loaded, so waiting for it is waiting
// for the scene. A fixed 4 s sleep was enough for the loaders and not for this.
await page.waitForFunction(() => window.__pngp !== undefined, null, { timeout: 60000 });
await page.waitForTimeout(2000);

let match = place;
if (wooded === null) {
  const options = await page.$$eval('#poi-search-list option', (els) => els.map((e) => e.value));
  match = options.find((o) => o === place) ?? options.find((o) => o.toLowerCase().includes(place.toLowerCase()));
  if (!match) {
    console.error(`No search entry matches "${place}".`);
    await browser.close();
    process.exit(1);
  }
  await page.fill('#poi-search-input', match);
  await page.waitForTimeout(3000);
} else {
  // Densest canopy nearest the wanted elevation, scanned off the real mask the
  // same way tools/test-snow.mjs does, then put the camera there.
  match = await page.evaluate(async (wantElev) => {
    const { FOREST_MASK } = await import('/src/forest.js');
    const { camera, controls } = window.__pngp;
    const sample = window.__pngp.getGroundHeight();
    const manifest = window.__pngp.getManifest();
    const img = FOREST_MASK.value.image;
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const mask = ctx.getImageData(0, 0, img.width, img.height).data;
    const { xmin, ymin, xmax, ymax } = manifest.bboxCrsUnits;
    const worldWidth = xmax - xmin;
    const worldDepth = ymax - ymin;
    let best = null;
    for (let x = -26000; x <= 26000; x += 211) {
      for (let z = -14000; z <= 14000; z += 197) {
        const px = Math.floor(((x + worldWidth / 2) / worldWidth) * img.width);
        const py = Math.floor(((z + worldDepth / 2) / worldDepth) * img.height);
        if (px < 0 || py < 0 || px >= img.width || py >= img.height) continue;
        if (mask[(py * img.width + px) * 4] / 255 < 0.95) continue;
        const h = sample(x, z);
        if (!Number.isFinite(h)) continue;
        if (!best || Math.abs(h - wantElev) < Math.abs(best.h - wantElev)) best = { x, z, h };
      }
    }
    if (!best) return null;
    controls.mode = 'fly';
    camera.position.set(best.x, best.h + 26, best.z + 130);
    camera.lookAt(best.x, best.h + 9, best.z);
    camera.updateMatrixWorld(true);
    return `dense canopy at ${Math.round(best.h)} m (${Math.round(best.x)}, ${Math.round(best.z)})`;
  }, wooded);
  if (!match) {
    console.error('No dense canopy found.');
    await browser.close();
    process.exit(1);
  }
  await page.waitForTimeout(4000);
}

// Stand off to the south and above, looking back at the place: +Z is South (§6),
// so a positive z offset is towards the viewer's side of it. Set explicitly
// rather than flown, so every shot in the series is from the identical camera and
// a difference between two of them is the snow and nothing else. Skipped for
// --wooded, which has already placed itself among the trees.
const view = wooded !== null
  ? { from: ['as placed'], target: ['the wood'] }
  : await page.evaluate(({ climb, back }) => {
    const { camera, controls } = window.__pngp;
    const tx = camera.position.x;
    const ty = camera.position.y;
    const tz = camera.position.z;
    controls.mode = 'fly'; // walk mode would re-clamp to the ground and throw the altitude away
    camera.position.set(tx, ty + climb, tz + back);
    camera.lookAt(tx, ty, tz);
    camera.updateMatrixWorld(true);
    return {
      target: [Math.round(tx), Math.round(ty), Math.round(tz)],
      from: [Math.round(tx), Math.round(ty + climb), Math.round(tz + back)],
    };
  }, { climb, back });
await page.waitForTimeout(4000);

// Pin (or release) the lying-snow level, sky untouched. See PINNED_LEVELS.
const pin = (level) =>
  page.evaluate(async (l) => {
    const { SNOW_LEVEL } = await import('/src/snow.js');
    if (l === null) {
      delete SNOW_LEVEL.value;
      SNOW_LEVEL.value = 0;
      return;
    }
    Object.defineProperty(SNOW_LEVEL, 'value', { get: () => l, set: () => {}, configurable: true });
  }, level);

// Measured from the SCREENSHOT, not from the canvas. Reading a WebGL canvas back
// with drawImage() after the frame has been presented returns an empty buffer -
// the context has no preserveDrawingBuffer - and it does it silently: the first
// version of this probe reported a confident 0.000 luma for every shot, snow and
// all. page.screenshot() goes through the compositor instead and sees what the
// user sees.
//
// Mean luma and the fraction that is nearly white, split top half against bottom
// half: pitched down over a valley, the top of the frame is the high distant
// ground and the bottom the near valley floor, so the two halves are the altitude
// ordering as the eye actually reads it. The HUD overlay is in both halves and in
// every shot alike, so it shifts the absolute numbers a little and the
// differences not at all.
const shot = async (name) => {
  const path = `tools/dev/logs/snow-${tag}-${name}.png`;
  // The level the shader is actually being given, read from the holder itself
  // rather than inferred from the pixels. Inferring it is how the first version of
  // this probe "discovered" a melt three times faster than weather.js's own time
  // constant - the pixels were being dimmed by the overcast preset, not cleared of
  // snow. Ask the thing that knows.
  const level = await page.evaluate(async () => (await import('/src/snow.js')).SNOW_LEVEL.value);
  const png = decode(await page.screenshot({ path }));
  const { width: w, height: h, channels } = png;
  const acc = { top: { sum: 0, white: 0, n: 0 }, bottom: { sum: 0, white: 0, n: 0 } };
  for (let y = 0; y < h; y++) {
    const half = y < h / 2 ? acc.top : acc.bottom;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * channels;
      const luma = (0.2126 * png.data[i] + 0.7152 * png.data[i + 1] + 0.0722 * png.data[i + 2]) / 255;
      half.sum += luma;
      if (luma > 0.62) half.white++;
      half.n++;
    }
  }
  return {
    name,
    path,
    level,
    topLuma: acc.top.sum / acc.top.n,
    bottomLuma: acc.bottom.sum / acc.bottom.n,
    topWhite: acc.top.white / acc.top.n,
    bottomWhite: acc.bottom.white / acc.bottom.n,
  };
};

const rows = [];
// Noise floor: the same scene twice, nothing changed in between.
rows.push(await shot('floor-a'));
await page.waitForTimeout(2500);
rows.push(await shot('floor-b'));

// Part 1: the snow alone, under a clear sky.
for (const level of PINNED_LEVELS) {
  await pin(level);
  await page.waitForTimeout(2500);
  rows.push(await shot(`lying-${level.toFixed(2).replace('.', '')}`));
}
await pin(null);
await page.waitForTimeout(2500);

// Part 2: the real thing, over real time - snow, cloud deck, haze and falling
// particles together, which is what the user will actually see.
await page.selectOption('#env-weather', '3'); // MODES index, see index.html
const t0 = Date.now();
for (const at of BUILD_AT_S) {
  const wait = t0 + at * 1000 - Date.now();
  if (wait > 0) await page.waitForTimeout(wait);
  rows.push(await shot(`build-${String(at).padStart(2, '0')}s`));
}
await page.selectOption('#env-weather', '0');
const t1 = Date.now();
for (const at of MELT_AT_S) {
  const wait = t1 + at * 1000 - Date.now();
  if (wait > 0) await page.waitForTimeout(wait);
  rows.push(await shot(`melt-${String(at).padStart(2, '0')}s`));
}

await browser.close();

console.log(`Looking at ${match} from ${view.from.join(', ')} towards ${view.target.join(', ')}`);
console.log(`(top half of the frame is the high distant ground, bottom half the near valley)\n`);
console.log('shot          level  top luma  bot luma   top white  bot white');
for (const r of rows) {
  console.log(
    `${r.name.padEnd(12)}  ${r.level.toFixed(2)}  ${r.topLuma.toFixed(3).padStart(8)}` +
      `  ${r.bottomLuma.toFixed(3).padStart(8)}` +
      `  ${(r.topWhite * 100).toFixed(1).padStart(8)}%  ${(r.bottomWhite * 100).toFixed(1).padStart(8)}%`,
  );
}
const a = rows[0];
const b = rows[1];
console.log(
  `\nNoise floor (two shots, nothing changed): ${Math.abs(a.topLuma - b.topLuma).toFixed(4)} luma top,` +
    ` ${Math.abs(a.bottomLuma - b.bottomLuma).toFixed(4)} bottom.`,
);
console.log(
  'The lying-* rows are the snow ALONE (clear sky, level pinned); the build-*/melt-* rows are what\n' +
    'the weather mode actually does, which includes a cloud deck, 2.4x haze and falling particles.',
);
console.log(`Screenshots: tools/dev/logs/snow-${tag}-*.png`);
if (problems.length) console.log(`\n${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
