#!/usr/bin/env node
// Look at grass, scree and edelweiss in the real page, and measure them.
//
// What it answers, in order of how much it matters:
//   1. Is anything actually drawn? A/B the density knob from ONE camera in ONE
//      session and count the pixels that changed. "No console errors" says
//      nothing about this - a mask that never arrived, a shader whose height came
//      out zero, and a working field all produce a clean console.
//   2. Does the cover follow the data? The same A/B at four elevations, against
//      the mask value the build tool reports for each.
//   3. Does it move in the wind, and is the movement the weather's?
//   4. What does it cost? Frame time at each density setting - see the warning
//      about what that does and does not mean, below.
//
// THE CAMERA POINTS DOWN. A previous session learned this the expensive way with
// the sky: the first A/B was shot looking horizontally, which is the one part of
// the frame the effect barely touches, and it reported almost nothing. Grass lives
// in the near ground, so every shot here is pitched down 22 degrees from eye
// height, and the measured crop is the lower middle of the frame.
//
// WHAT THE COST NUMBER IS. This runs under SwiftShader, a CPU rasteriser at
// roughly 1 fps: its frame time is NOT the user's frame rate and must never be
// reported as one. What it does measure honestly is the RATIO between settings on
// identical geometry, i.e. how much rasterisation work each step adds. The
// person's own fps counter is the only instrument for the absolute number.
//
// Usage: tools/dev/start-dev.sh && node tools/dev/probe-groundcover.mjs

import { chromium } from 'playwright';
import { decode } from 'fast-png';

const flags = new Map(
  process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }),
);
const url = flags.get('url') ?? 'http://localhost:5173';

// Vantages spanning the gradient the mask measures: a valley floor where cover is
// near 0.7, somewhere around the treeline (found by elevation from the POI
// list rather than named, so it stays right if anything is retuned), high pasture
// at the Nivolet, and a glaciated summit where there must be exactly nothing. The
// last is the control: if anything grows there, the mask is not being read.
const VIEWS = [
  { place: 'Le Pont', note: 'valley floor' },
  { belt: [2150, 2400], note: 'treeline, where turf gives way to stones' },
  { place: 'Colle del Nivolet', note: 'high pasture' },
  { place: 'Gran Paradiso', note: 'glaciated summit - the control' },
];

// A PASS IS THE WORST PLACE TO STAND to look at the ground, and the first run of
// this probe picked one: on a saddle the ground ahead falls away, so a camera
// pitched down 22 degrees is looking at a valley 400 m off rather than at grass
// 3 m off, and the layer reports 0.00% while working perfectly. Belt vantages
// therefore exclude passes and peaks, and every row prints how far the ground
// actually is at the centre of the frame so a bad vantage is visible rather than
// mistaken for a bad feature.
const BAD_VANTAGE_CATEGORIES = ['pass', 'peak'];

// EVERY LAYER IS MEASURED ALONE. One number for both layers together was the
// most expensive mistake of the session it was written in: it read 21.9% and was
// believed, and all of it was one layer while the grass drew nothing at all. A
// combined figure cannot fail this way loudly, so it is not used.
const LAYERS = ['grass', 'scree', 'boulder'];

const PITCH_DEG = -22;
const CHANGE_THRESHOLD = 6; // per channel, comfortably above screenshot noise
const COST_FRAMES = 12;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
const problems = [];
page.on('pageerror', (err) => problems.push(`[pageerror] ${err.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') problems.push(`[console.error] ${msg.text()}`);
});

await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForFunction(() => window.__pngp?.groundcover !== undefined, null, { timeout: 90000 });
// The HUD's nav panel sits bottom-left and the env controls bottom-right, both
// inside the crop that matters here. Removing the overlay entirely is the only
// way to be sure a measured change is the scene's.
await page.addStyleTag({ content: '#hud, #env-controls, #credits, #hint { display: none !important; }' });
await page.waitForTimeout(2500);

const ready = await page.evaluate(() => {
  const g = window.__pngp.groundcover;
  return { stats: g.getStats() ?? null, counts: g.counts() ?? null };
});
if (!ready.stats) {
  console.error('Groundcover is not built - the landcover mask probably failed to load.');
  await browser.close();
  process.exit(1);
}
console.log(
  `grass ${ready.stats.grass.instances.toLocaleString()} instances x ${ready.stats.grass.trianglesPerInstance} tri ` +
    `(window ${ready.stats.grass.windowM} m, spacing ${ready.stats.grass.spacingM} m, visible ${ready.stats.grass.visibleM} m)\n` +
    `scree ${ready.stats.scree.instances.toLocaleString()} instances x ${ready.stats.scree.trianglesPerInstance} tri ` +
    `(window ${ready.stats.scree.windowM} m, spacing ${ready.stats.scree.spacingM} m, visible ${ready.stats.scree.visibleM} m)\n` +
    `boulder ${ready.stats.boulder.instances.toLocaleString()} instances x ${ready.stats.boulder.trianglesPerInstance} tri ` +
    `(window ${ready.stats.boulder.windowM} m, spacing ${ready.stats.boulder.spacingM} m, visible ${ready.stats.boulder.visibleM} m)\n` +
    `${ready.stats.trianglesAtFullDensity.toLocaleString()} triangles at full density\n`,
);

// The lower middle of the frame: near ground, away from every HUD corner even
// though the HUD is hidden, and away from the sky.
const CLIP = { x: 170, y: 300, width: 560, height: 260 };

const setDensity = (d) =>
  page.evaluate((d) => {
    window.__pngp.groundcover.density.value = d;
    window.__pngp.groundcover.apply();
  }, d);

// Show exactly one layer, or none.
const only = (kind) =>
  page.evaluate((kind) => {
    for (const l of window.__pngp.groundcover.getLayers()) l.mesh.visible = l.kind === kind;
  }, kind);

async function shot(name) {
  const png = decode(await page.screenshot({ path: `tools/dev/logs/gc-${name}.png`, clip: CLIP, timeout: 120000 }));
  const { width: w, height: h, channels, data } = png;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  for (let i = 0; i < w * h; i++) {
    const p = i * channels;
    sumR += data[p];
    sumG += data[p + 1];
    sumB += data[p + 2];
  }
  const n = w * h * 255;
  return {
    r: sumR / n,
    g: sumG / n,
    b: sumB / n,
    luma: (0.2126 * sumR + 0.7152 * sumG + 0.0722 * sumB) / n,
    png,
  };
}

// The fraction of pixels that differ by more than the threshold on any channel.
// Mean luma alone is a bad instrument for grass: tufts that are the same
// brightness as the ground they stand on would move it by nothing at all while
// covering a third of the frame.
//
// It also returns the luma of ONLY THE PIXELS THE LAYER OWNS, and of the bare
// ground underneath exactly those pixels - which is the pair of numbers a
// whole-frame mean cannot give, and the reason this exists. On 2026-08-13 the
// rounder shrub cushion (since removed) made the frame 9.4% darker and doubled its near-black
// pixels, which read as a lighting regression; measured this way the plants were
// the SAME brightness (0.1216 -> 0.1223) and simply covered 46% more ground.
// A frame mean is two questions added together: how much, and how dark.
function changed(a, b) {
  const n = a.width * a.height;
  let moved = 0;
  let sumAbs = 0;
  let sumOwn = 0;
  let sumHidden = 0;
  const luma = (img, i) => (0.2126 * img.data[i] + 0.7152 * img.data[i + 1] + 0.0722 * img.data[i + 2]) / 255;
  for (let i = 0; i < n; i++) {
    const p = i * a.channels;
    const q = i * b.channels;
    const d = Math.max(
      Math.abs(a.data[p] - b.data[q]),
      Math.abs(a.data[p + 1] - b.data[q + 1]),
      Math.abs(a.data[p + 2] - b.data[q + 2]),
    );
    sumAbs += d;
    if (d > CHANGE_THRESHOLD) {
      moved++;
      sumOwn += luma(b, q);
      sumHidden += luma(a, p);
    }
  }
  return {
    fraction: moved / n,
    meanAbs: sumAbs / n,
    ownLuma: moved ? sumOwn / moved : null,
    hiddenLuma: moved ? sumHidden / moved : null,
  };
}

// Median frame time with exactly these layers visible. Read against the cover-off
// frame it is a RATIO, which is the only thing SwiftShader can honestly give -
// see the header. Timed inside the page with rAF deltas rather than read off the
// HUD, whose figure is smoothed and would bleed one configuration into the next.
const timeCover = (kinds, frames) => page.evaluate(async ({ kinds, frames }) => {
  const P = window.__pngp;
  for (const l of P.groundcover.getLayers()) l.mesh.visible = kinds.includes(l.kind);
  // The animals and the birds move by themselves, so they would add their own
  // work to every configuration unequally.
  for (const g of [P.getWildlife?.(), P.getBirds?.()]) if (g?.object) g.object.visible = false;
  const tick = () => new Promise((r) => requestAnimationFrame(() => r(performance.now())));
  await tick(); await tick(); await tick(); // let the new configuration settle
  const dt = [];
  let prev = await tick();
  for (let i = 0; i < frames; i++) { const now = await tick(); dt.push(now - prev); prev = now; }
  dt.sort((x, y) => x - y);
  return dt[dt.length >> 1];
}, { kinds, frames });

async function stand(view) {
  let place = view.place;
  if (!place && view.belt) {
    // Named by elevation, not by name: the point is to stand in the belt, and
    // which hut or pass happens to sit in it is not the probe's business.
    place = await page.evaluate(({ belt, bad }) => {
      const pois = window.__pngp.getPoiIndex()?.manifest.pois ?? [];
      const sample = window.__pngp.getGroundHeight();
      // Gentle ground as well as the right elevation: measured from the drawn
      // surface, the same way the camera will stand on it.
      const gentle = (p) => {
        if (!sample || !p.local) return false;
        const h = sample(p.local.x, p.local.z);
        const dx = sample(p.local.x + 20, p.local.z) - sample(p.local.x - 20, p.local.z);
        const dz = sample(p.local.x, p.local.z + 20) - sample(p.local.x, p.local.z - 20);
        return Number.isFinite(h) && Math.hypot(dx, dz) / 40 < 0.45; // under ~24 deg
      };
      const hit = pois.find(
        (p) => p.name && p.elevationM >= belt[0] && p.elevationM <= belt[1]
          && !bad.includes(p.category) && gentle(p),
      );
      return hit?.name ?? null;
    }, { belt: view.belt, bad: BAD_VANTAGE_CATEGORIES });
    if (!place) return null;
  }
  const match = await page.$$eval('#poi-search-list option', (els, want) => {
    const opts = els.map((e) => e.value);
    return opts.find((o) => o === want) ?? opts.find((o) => o.toLowerCase().includes(want.toLowerCase()));
  }, place);
  if (!match) return null;
  await page.fill('#poi-search-input', match);
  await page.waitForTimeout(3000);
  view.resolved = place;
  // Placed by hand rather than flown, so every shot at this vantage comes from
  // the identical camera and the only difference between them is the cover. Fly
  // mode, because walk mode re-clamps y every frame and would fight this.
  // Both arguments must be destructured. They were not: `radius` was passed and
  // read but never unpacked, so this threw a ReferenceError on the FIRST vantage
  // and the probe had not been run since the disc-mean fix that introduced it.
  // A tool the docs point at as the way to reproduce a number has to be run.
  return page.evaluate(({ pitch, radius }) => {
    const { camera, controls, getGroundHeight } = window.__pngp;
    controls.mode = 'fly';
    const sample = getGroundHeight();
    const ground = sample ? sample(camera.position.x, camera.position.z) : null;
    if (Number.isFinite(ground)) camera.position.y = ground + 1.7; // eye height, as if standing
    const r = (pitch * Math.PI) / 180;
    camera.lookAt(
      camera.position.x + Math.cos(r) * 1000,
      camera.position.y + Math.sin(r) * 1000,
      camera.position.z,
    );
    camera.updateMatrixWorld(true);
    return {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
      ground,
      // The mask as the SCATTER experiences it: the mean over the disc it draws
      // in, not a single 41 m texel. A point sample reported 0.000 at the Nivolet
      // while the grass around it was plainly drawn - comparing a point against
      // an area is not a comparison.
      cover: (() => {
        const at = window.__pngp.groundcover.coverAt;
        let sum = 0;
        let n = 0;
        for (let dz = -radius; dz <= radius; dz += radius / 4) {
          for (let dx = -radius; dx <= radius; dx += radius / 4) {
            if (dx * dx + dz * dz > radius * radius) continue;
            sum += at(camera.position.x + dx, camera.position.z + dz) ?? 0;
            n++;
          }
        }
        return n ? sum / n : null;
      })(),
      // How far the ground is at the centre of the frame: the sanity check on the
      // vantage itself. Anything past the draw distance means the camera is
      // looking at a view, not at the ground under it.
      groundAheadM: (() => {
        const sample = window.__pngp.getGroundHeight();
        if (!sample) return null;
        const r = (pitch * Math.PI) / 180;
        for (let d = 1; d < 400; d += 1) {
          const y = camera.position.y + Math.sin(r) * d;
          const g = sample(camera.position.x + Math.cos(r) * d, camera.position.z);
          if (Number.isFinite(g) && y <= g) return d;
        }
        return null;
      })(),
    };
  }, { pitch: PITCH_DEG, radius: 25 });
}

const rows = [];
for (const view of VIEWS) {
  const at = await stand(view);
  if (!at) {
    console.log(`! no vantage for ${JSON.stringify(view)}, skipped`);
    continue;
  }
  await page.waitForTimeout(3500);

  await only('none');
  await page.waitForTimeout(2000);
  const bare = await shot(`${slug(view.resolved)}-off`);
  // The noise floor from the SAME state: a difference below this means nothing,
  // and without it a small number cannot be told from zero.
  await page.waitForTimeout(1500);
  const bareAgain = await shot(`${slug(view.resolved)}-off-b`);

  const perLayer = {};
  for (const kind of LAYERS) {
    await only(kind);
    await page.waitForTimeout(2500);
    const shotOne = await shot(`${slug(view.resolved)}-${kind}`);
    await page.screenshot({ path: `tools/dev/logs/gc-${slug(view.resolved)}-${kind}-full.png`, timeout: 120000 });
    perLayer[kind] = { ...changed(bare.png, shotOne.png), colour: shotOne };
  }

  rows.push({ view, at, floor: changed(bare.png, bareAgain.png), perLayer, bare });
}

console.log('Is anything drawn? Pixels that changed with ONE layer switched on');
console.log('(same camera, same session; "floor" is two shots of the identical state)\n');
const head = ['place', 'alt', 'mask 25m', 'ground', 'floor', 'grass', 'scree', 'block', 'luma bare/grass/scree'];
const body = rows.map((r) => [
  r.view.resolved,
  `${Math.round(r.at.y)} m`,
  r.at.cover === null ? '-' : r.at.cover.toFixed(3),
  r.at.groundAheadM === null ? '-' : `${r.at.groundAheadM} m`,
  `${(r.floor.fraction * 100).toFixed(2)}%`,
  `${(r.perLayer.grass.fraction * 100).toFixed(2)}%`,
  `${(r.perLayer.scree.fraction * 100).toFixed(2)}%`,
  `${(r.perLayer.boulder.fraction * 100).toFixed(2)}%`,
  `${r.bare.luma.toFixed(3)} / ${r.perLayer.grass.colour.luma.toFixed(3)} / ${r.perLayer.scree.colour.luma.toFixed(3)}`,
]);
const w = head.map((h, i) => Math.max(h.length, ...body.map((b) => b[i].length)));
console.log(head.map((h, i) => h.padEnd(w[i])).join('  '));
console.log(w.map((n) => '-'.repeat(n)).join('  '));
for (const b of body) console.log(b.map((c, i) => c.padEnd(w[i])).join('  '));
for (const r of rows) console.log(`  ${r.view.resolved}: ${r.view.note}`);

// The luma of ONLY the pixels each layer owns, against the bare ground under
// exactly those pixels. The whole-frame luma in the table above cannot separate
// "the plants got darker" from "there is more plant" - see changed(). A layer's
// own luma below its own hidden ground is what "a plant is darker than what it
// stands on" actually means.
const dash = (v) => (v === null || v === undefined ? '  -   ' : v.toFixed(4));
console.log('\nOnly the pixels each layer owns (own luma vs the ground it hides):\n');
for (const r of rows) {
  const cell = (k) => `${k} ${dash(r.perLayer[k].ownLuma)} under ${dash(r.perLayer[k].hiddenLuma)}`;
  console.log(`  ${r.view.resolved.padEnd(30)} ${cell('grass')}  ${cell('scree')}  ${cell('boulder')}`);
}

// ---------------------------------------------------------------------------
// Wind: does it move, and is the movement the weather's?
console.log('\nWind. Two shots a second apart, with the weather\'s wind pinned.');
console.log('(the animals and birds are hidden first - they move by themselves and drown this)\n');
await stand({ place: 'Le Pont' });
await page.waitForTimeout(3000);
await setDensity(1);
await only('grass'); // the wind is the grass's, so measure the grass
const windRows = [];
// An accessor, not an assignment: main.js writes GROUNDCOVER_WIND every frame from
// the weather, so `holder.value = x` survives one frame. The first version of this
// section reported 2.64% against 8.41% and both were really the weather's own 0.3
// plus whatever else in the scene was moving.
await page.evaluate(() => {
  const w = window.__pngp.getWildlife();
  const b = window.__pngp.getBirds();
  if (w?.object) w.object.visible = false;
  if (b?.object) b.object.visible = false;
});
for (const wind of [0, 1]) {
  await page.evaluate((wind) => {
    Object.defineProperty(window.__pngp.groundcover.wind, 'value',
      { get: () => wind, set: () => {}, configurable: true });
  }, wind);
  await page.waitForTimeout(1200);
  const a = await shot(`wind-${wind}-a`);
  // The shader's clock is driven from main.js's timer, which keeps running, so
  // simply waiting advances the wave. Pinning the wind is what isolates it.
  await page.waitForTimeout(1600);
  const b = await shot(`wind-${wind}-b`);
  windRows.push({ wind, ...changed(a.png, b.png) });
}
for (const r of windRows) {
  console.log(`  wind ${r.wind}: ${(r.fraction * 100).toFixed(2)}% of pixels moved between two shots`);
}

// ---------------------------------------------------------------------------
// Cost. Read the warning in this file's header before quoting any of it.
console.log('\nFrame time under SwiftShader - a RATIO between settings, not anybody\'s fps:\n');
const costs = [];
await page.evaluate(() => {
  for (const l of window.__pngp.groundcover.getLayers()) l.mesh.visible = true;
});
for (const d of [0, 0.2, 0.5, 1]) {
  await setDensity(d);
  await page.waitForTimeout(1500);
  const ms = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const times = [];
        let last = performance.now();
        let n = 0;
        const tick = () => {
          const now = performance.now();
          times.push(now - last);
          last = now;
          if (++n < 12) requestAnimationFrame(tick);
          else {
            times.sort((a, b) => a - b);
            resolve(times[Math.floor(times.length / 2)]); // median, so one hitch cannot carry it
          }
        };
        requestAnimationFrame(tick);
      }),
  );
  costs.push({ d, ms });
}
const base = costs.find((c) => c.d === 0)?.ms ?? 1;
for (const c of costs) {
  console.log(`  density ${c.d.toFixed(1)}: ${c.ms.toFixed(0)} ms/frame  (x${(c.ms / base).toFixed(2)} of off)`);
}

// PER LAYER, AND IN THE BELT. The density knob above moves both layers together,
// which cannot answer "what did changing one layer's geometry cost" - and it is
// measured at Le Pont, in the valley. This block stands at the treeline instead,
// where the two layers actually trade against each other. It is what the
// 2026-08-13 changes were weighed on: compare a build against a build, at one
// vantage, and quote the ratio and never the milliseconds.
await setDensity(1);
const beltAt = await stand({ belt: [2150, 2400] });
if (beltAt) {
  await page.waitForTimeout(3000);
  const off = await timeCover([], COST_FRAMES);
  const each = {};
  for (const kind of LAYERS) each[kind] = await timeCover([kind], COST_FRAMES);
  const both = await timeCover(LAYERS, COST_FRAMES);
  console.log(`\n  per layer, standing in the belt at ${Math.round(beltAt.y)} m (mask ${beltAt.cover?.toFixed(3)}):`);
  console.log(`    cover off:  ${off.toFixed(0)} ms/frame`);
  for (const kind of LAYERS) {
    console.log(`    ${kind.padEnd(10)}  ${each[kind].toFixed(0)} ms  (x${(each[kind] / off).toFixed(3)} of off, ` +
      `its own share ${(each[kind] - off).toFixed(0)} ms)`);
  }
  console.log(`    both        ${both.toFixed(0)} ms  (x${(both / off).toFixed(3)} of off)`);
} else {
  console.log('\n  ! no belt vantage found, per-layer cost skipped');
}

// ---------------------------------------------------------------------------
// Edelweiss: find one the way the renderer does, stand next to it, and read the
// HUD back rather than trusting that the flowers are there.
console.log('\nEdelweiss:\n');
const flower = await page.evaluate(() => {
  const { edelweiss, camera } = window.__pngp;
  return edelweiss.nearest(camera.position.x, camera.position.z, 20);
});
if (!flower) {
  console.log('  no patch within 20 cells of Le Pont');
} else {
  console.log(
    `  nearest patch: ${flower.flowers.length} flowers at ${Math.round(flower.elevM)} m, ` +
      `${Math.round(flower.distanceM)} m away (cell ${flower.key})`,
  );
  const seen = await page.evaluate(({ x, z }) => {
    const { camera, controls, getGroundHeight } = window.__pngp;
    controls.mode = 'fly';
    const sample = getGroundHeight();
    // Three metres back and a little above, looking down at the patch: a rosette
    // is 6 cm across, so this is the range at which one is a flower rather than a
    // white speck.
    camera.position.set(x - 3, (sample ? sample(x - 3, z) : 0) + 1.6, z);
    camera.lookAt(x, sample ? sample(x, z) : 0, z);
    camera.updateMatrixWorld(true);
    return true;
  }, flower);
  if (seen) {
    await page.waitForTimeout(3000);
    // The style tag hid the HUD, so read the diag rather than the DOM here.
    const diag = await page.evaluate(() => window.__pngp.edelweiss.getDiag());
    await page.screenshot({ path: 'tools/dev/logs/gc-edelweiss.png', timeout: 120000 });
    console.log(
      `  standing 3 m away: ${diag.drawn} rosettes drawn, nearest ${diag.nearestM?.toFixed(1)} m, ` +
        `found ${diag.foundCount}, cells tested ${diag.cellsTested}`,
    );
  }
}

await browser.close();
if (problems.length) {
  console.log(`\n${problems.length} console/page problems:`);
  for (const p of problems.slice(0, 10)) console.log(`  ${p}`);
} else {
  console.log('\nNo console or page errors.');
}
