#!/usr/bin/env node
// Calibrate and inspect the satellite ground texture in the real page.
//
// What it answers: BASEMAP_GAIN in src/basemap.js. Sentinel-2 gives physical
// surface reflectance; the colour literals in this project are not physical
// anything - each was solved backwards through three's BRDF, the lighting rig and
// ACES so the ground reaches a brightness the user approved (see the "albedo is
// not appearance" warning in src/terrain.js). So the photo has to be brought onto
// that scale by one number, and the only honest way to find it is to render both
// and compare.
//
// Method, and every part of it is a lesson this project already paid for:
//   - ONE session, ONE camera, the mix pinned to 0 then to 1. Two runs would
//     differ in animals, birds and gust as well as in ground (docs/PROGRESS.md
//     2026-08-10, "a separate standing-still render is not the same scene").
//   - measured from page.screenshot(), never from the canvas: a WebGL canvas
//     read back after its frame is presented is EMPTY and says nothing about it.
//   - a CLIP away from the HUD, because the overlay is identical in both shots
//     and would pull every ratio towards 1.
//   - the gain is swept, not solved: ACES is not linear, so the luma ratio at one
//     gain does not give the gain that would match. Several are rendered and the
//     match is interpolated between the two that straddle it.
//
// One landmine found by this probe rather than by the viewer, and it is silent:
// a probe must NOT reach the shared holders through `import('/src/basemap.js')`.
// After any HMR reload the page holds that module as `/src/basemap.js?t=<stamp>`,
// so a bare-path import is served as a SECOND instance with its own holders -
// pinning it changes nothing on screen, and reading it back returns exactly what
// was just written. It cost a run that reported the texture "not loaded" while the
// page was drawing it. Everything below goes through window.__pngp.basemap.
//
// Usage: tools/dev/start-dev.sh && node tools/dev/probe-basemap.mjs [--gains=1.6,2,2.4]

import { chromium } from 'playwright';
import { decode } from 'fast-png';

const flags = new Map(
  process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }),
);
const url = flags.get('url') ?? 'http://localhost:5173';
const GAINS = (flags.get('gains') ?? '1.4,1.8,2.2,2.6,3.0').split(',').map(Number);

// Five vantages, chosen to span what the ground can be: a valley floor in
// forest, a treeline, open alpine meadow, a glaciated summit, and one wide
// landscape view where most of the frame is distant ground. A single vantage
// would calibrate the gain to one land cover.
const VIEWS = [
  { place: 'Le Pont', climb: 40, back: 260, note: 'valley floor, 1,950 m' },
  { place: 'Rifugio Vittorio Emanuele II', climb: 220, back: 700, note: 'treeline/moraine' },
  { place: 'Gran Paradiso', climb: 900, back: 3200, note: 'glaciated summit, wide' },
  { place: 'Colle del Nivolet', climb: 300, back: 1400, note: 'high open meadow' },
  { place: 'Cogne', climb: 1500, back: 6000, note: 'landscape, whole valley' },
];

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
const problems = [];
page.on('pageerror', (err) => problems.push(`[pageerror] ${err.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') problems.push(`[console.error] ${msg.text()}`);
});

await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForFunction(() => window.__pngp !== undefined, null, { timeout: 60000 });
await page.waitForTimeout(2500);

// The texture has to have arrived, or every "photo" shot below would silently be
// the 1x1 placeholder and the gain would come out as whatever matched grey.
const loaded = await page.evaluate(() => {
  const b = window.__pngp.basemap;
  const img = b.getTexture()?.image;
  return {
    width: img?.width ?? 0,
    height: img?.height ?? 0,
    scale: b.scale.value,
    mix: b.mix.value,
    gain: b.gain,
  };
});
if (loaded.width < 1000) {
  console.error(`The basemap texture is not loaded (image ${loaded.width}x${loaded.height}).`);
  await browser.close();
  process.exit(1);
}
const fullScale = loaded.scale / loaded.gain;
console.log(
  `basemap ${loaded.width}x${loaded.height}, fullScale ${fullScale.toFixed(3)}, ` +
    `BASEMAP_GAIN in src ${loaded.gain}\n`,
);

// Away from every HUD corner: search box and info top-left, fps top-right,
// compass and nav text bottom-left, env controls bottom-right, hint along the
// bottom, credits bottom-centre.
const CLIP = { x: 240, y: 90, width: 620, height: 400 };

const setMix = (mix, gain) =>
  page.evaluate(({ mix, gain, fullScale }) => {
    const b = window.__pngp.basemap;
    b.mix.value = mix;
    if (gain !== null) b.scale.value = fullScale * gain;
  }, { mix, gain, fullScale });

const shot = async (name) => {
  const png = decode(await page.screenshot({ path: `tools/dev/logs/basemap-${name}.png`, clip: CLIP }));
  const { width: w, height: h, channels } = png;
  let sum = 0;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  for (let i = 0; i < w * h; i++) {
    const p = i * channels;
    sumR += png.data[p];
    sumG += png.data[p + 1];
    sumB += png.data[p + 2];
    sum += 0.2126 * png.data[p] + 0.7152 * png.data[p + 1] + 0.0722 * png.data[p + 2];
  }
  const n = w * h * 255;
  return { luma: sum / n, r: sumR / n, g: sumG / n, b: sumB / n };
};

const rows = [];
for (const view of VIEWS) {
  const match = await page.$$eval('#poi-search-list option', (els, want) => {
    const opts = els.map((e) => e.value);
    return opts.find((o) => o === want) ?? opts.find((o) => o.toLowerCase().includes(want.toLowerCase()));
  }, view.place);
  if (!match) {
    console.log(`! no POI matches "${view.place}", skipped`);
    continue;
  }
  await page.fill('#poi-search-input', match);
  await page.waitForTimeout(3000);
  // Placed explicitly rather than flown, so both shots come from the identical
  // camera and the only difference between them is the ground colour.
  await page.evaluate(({ climb, back }) => {
    const { camera, controls } = window.__pngp;
    const { x, y, z } = camera.position;
    controls.mode = 'fly'; // walk mode would re-clamp to the ground and lose the height
    camera.position.set(x, y + climb, z + back);
    camera.lookAt(x, y, z);
    camera.updateMatrixWorld(true);
  }, view);
  await page.waitForTimeout(3500);

  await setMix(0, null);
  await page.waitForTimeout(2000);
  const procedural = await shot(`${slug(view.place)}-procedural`);
  // The whole frame as well as the measured crop: the numbers say whether the two
  // looks are the same brightness, and only a picture says whether the new one is
  // any good. Same camera, so the pair is a straight A/B.
  await page.screenshot({ path: `tools/dev/logs/basemap-${slug(view.place)}-full-procedural.png` });
  // Noise floor from the same state, so a difference below it means nothing.
  await page.waitForTimeout(1500);
  const floor = await shot(`${slug(view.place)}-procedural-b`);

  const photo = [];
  for (const gain of GAINS) {
    await setMix(1, gain);
    await page.waitForTimeout(2000);
    photo.push({ gain, ...(await shot(`${slug(view.place)}-photo-g${String(gain).replace('.', '')}`)) });
    if (gain === GAINS[GAINS.length - 1]) {
      await page.screenshot({ path: `tools/dev/logs/basemap-${slug(view.place)}-full-photo.png` });
    }
  }
  rows.push({ view, match, procedural, floor, photo });
}

await browser.close();

console.log('Ground brightness, procedural vs satellite, same camera in the same session');
console.log('(luma of a 620x400 crop clear of the HUD; "match" is the gain interpolated to equal luma)\n');
let matches = [];
for (const r of rows) {
  console.log(`${r.match} - ${r.view.note}`);
  console.log(
    `   procedural  luma ${r.procedural.luma.toFixed(4)}  ` +
      `rgb ${r.procedural.r.toFixed(3)}/${r.procedural.g.toFixed(3)}/${r.procedural.b.toFixed(3)}` +
      `   (noise floor ${Math.abs(r.procedural.luma - r.floor.luma).toFixed(4)})`,
  );
  for (const p of r.photo) {
    console.log(
      `   gain ${p.gain.toFixed(2)}   luma ${p.luma.toFixed(4)}  ` +
        `rgb ${p.r.toFixed(3)}/${p.g.toFixed(3)}/${p.b.toFixed(3)}   ` +
        `x${(p.luma / r.procedural.luma).toFixed(3)} of procedural`,
    );
  }
  const m = interpolateGain(r.photo, r.procedural.luma);
  matches.push(m);
  console.log(`   -> matches procedural at gain ${m === null ? 'outside the swept range' : m.toFixed(2)}\n`);
}
const usable = matches.filter((m) => m !== null);
if (usable.length) {
  const mean = usable.reduce((a, b) => a + b, 0) / usable.length;
  console.log(
    `Gain matching the approved ground brightness: ${mean.toFixed(2)} ` +
      `(per vantage ${usable.map((m) => m.toFixed(2)).join(', ')})`,
  );
}
console.log('Screenshots: tools/dev/logs/basemap-*.png');
if (problems.length) console.log(`\n${problems.length} problem(s):\n  ${problems.join('\n  ')}`);

// Linear interpolation between the two swept gains that straddle the target
// luma. Null if the whole sweep sits on one side of it, which is the honest
// answer - extrapolating an ACES-compressed curve past its samples is not.
function interpolateGain(photo, target) {
  const sorted = [...photo].sort((a, b) => a.gain - b.gain);
  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i - 1];
    const b = sorted[i];
    if ((a.luma - target) * (b.luma - target) <= 0 && a.luma !== b.luma) {
      return a.gain + ((target - a.luma) / (b.luma - a.luma)) * (b.gain - a.gain);
    }
  }
  return null;
}

function slug(s) {
  return s.replace(/[^\w]+/g, '-').toLowerCase();
}
