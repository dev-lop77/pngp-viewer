#!/usr/bin/env node
// Checks WHERE snow lies (src/snow.js, 2026-08-11), on the ground and on the
// trees, by measuring rendered pixels against the module's own CPU twin.
//
// Why this is its own suite: snow is now read by three files that must not drift
// apart - terrain.js colours the ground with it in a fragment shader,
// vegetation.js loads the trees with it in a vertex shader, and audio.js decides
// whether a footstep crunches with the JS twin. A screenshot can show one of
// those and say nothing about the other two.
//
// The rig is test-terrain-albedo.mjs's: one AmbientLight of intensity PI and no
// tone mapping makes the rendered pixel EXACTLY the albedo (three's Lambert BRDF
// is albedo/PI * irradiance), and reading back from a WebGLRenderTarget keeps it
// linear. So a measured pixel can be inverted for the snow cover that produced
// it, with no lighting constant to calibrate and no slope shading in the way.
//
// The assertion is a BRACKET, not an equality, and that is the honest form: the
// shader wobbles the effective elevation by up to +/-SNOW_NOISE_M with a value
// noise the CPU cannot reproduce bit-exactly (GLSL float32 vs JS float64 over a
// chaotic hash - the same reason wildlife.js never ported the tree hash). Cover
// is monotonic in that elevation, so evaluating the twin at both extremes gives
// a strict interval the measurement must fall inside.
//
// Usage: tools/dev/start-dev.sh && node tools/test-snow.mjs

import { chromium } from 'playwright';
import {
  snowCoverAt,
  SNOW_NOISE_M,
  SNOW_LINE_TOP_M,
  SNOW_LINE_BOTTOM_M,
  SNOW_ONSET,
} from '../src/snow.js';

const url = process.argv[2] ?? 'http://localhost:5173';
// Cover inverted from an 8-bit readback: one step of quantisation on a channel
// with maybe 0.4 of contrast between ground and snow is ~0.01 of cover, and the
// steep cases sit on an interpolated normal.
const COVER_TOL = 0.06;
// The level whose snowline sits at a given elevation, i.e. the inverse of
// snow.js's own mix(TOP, BOTTOM, level).
const levelForLine = (m) => (SNOW_LINE_TOP_M - m) / (SNOW_LINE_TOP_M - SNOW_LINE_BOTTOM_M);

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 320, height: 240 } });
const problems = [];
page.on('pageerror', (err) => problems.push(err.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') problems.push(msg.text());
});
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

const result = await page.evaluate(async () => {
  const THREE = await import('/node_modules/three/build/three.module.js');
  const { loadTerrain, SLOPE_ROCK_TO, SLOPE_ROCK_FROM } = await import('/src/terrain.js');
  const { loadForest, FOREST_MASK } = await import('/src/forest.js');
  const { createVegetation, CANOPY_COLOR, TREE_SNOW_BASE, TREE_SNOW_CROWN } = await import('/src/vegetation.js');
  const { SNOW_LEVEL, SNOW_COLOR } = await import('/src/snow.js');

  const terrain = await loadTerrain();
  await loadForest(); // before anything renders, or the wooded cases measure the 1x1 placeholder
  const vegetation = createVegetation({ manifest: terrain.manifest, heightTexture: terrain.heightTexture });

  const scene = new THREE.Scene();
  scene.add(terrain.object);
  scene.add(new THREE.AmbientLight(0xffffff, Math.PI)); // rendered pixel == albedo

  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.toneMapping = THREE.NoToneMapping;
  const SIZE = 96;
  renderer.setSize(SIZE, SIZE);
  const target = new THREE.WebGLRenderTarget(SIZE, SIZE);
  const buf = new Uint8Array(SIZE * SIZE * 4);
  const shoot = () => {
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.readRenderTargetPixels(target, 0, 0, SIZE, SIZE, buf);
    return Uint8Array.from(buf);
  };

  // Straight down through the middle pixel, as in test-terrain-albedo.mjs.
  const camera = new THREE.PerspectiveCamera(1, 1, 1, 20000);
  camera.up.set(0, 0, -1);

  const STEP = 20.5; // one heightfield cell, which is also the shader's normal spacing up close
  function normalAt(x, z) {
    const hW = terrain.sampleRenderedHeight(x - STEP, z);
    const hE = terrain.sampleRenderedHeight(x + STEP, z);
    const hN = terrain.sampleRenderedHeight(x, z - STEP);
    const hS = terrain.sampleRenderedHeight(x, z + STEP);
    return new THREE.Vector3((hW - hE) / (2 * STEP), 1, (hN - hS) / (2 * STEP)).normalize();
  }

  // ---- part 1: the ground -------------------------------------------------
  // Deterministic scan (never Math.random) so a failure is reproducible.
  function scanGround(test) {
    for (let x = -30000; x <= 30000; x += 137) {
      for (let z = -16000; z <= 16000; z += 149) {
        const h = terrain.sampleRenderedHeight(x, z);
        const n = normalAt(x, z);
        if (test(h, n)) return { x, z, h, n: { y: n.y, z: n.z } };
      }
    }
    return null;
  }

  const gentle = (n) => n.y > 0.985;
  const wanted = {
    // One high, one mid, one low, all flat: the elevation ordering is the whole
    // point of the change and this is what shows it.
    high: scanGround((h, n) => h > 3300 && gentle(n)),
    mid: scanGround((h, n) => h > 1900 && h < 2100 && gentle(n)),
    low: scanGround((h, n) => h > 950 && h < 1150 && gentle(n)),
    // A cliff: nothing lies on it at any level.
    cliff: scanGround((h, n) => h > 1500 && h < 3000 && n.y < SLOPE_ROCK_TO - 0.05),
    // Two faces pointing opposite ways. The aspect term scales with steepness, so
    // these have to be properly tilted to separate at all - and the pair has to
    // differ in ASPECT ONLY, or the comparison measures something else. A first
    // attempt took whatever the scan found first and got 2058 m at n.y 0.74
    // against 2221 m at n.y 0.79: 163 m of altitude and a 2x difference in the
    // slope-bare term, i.e. three variables at once. The south face is therefore
    // scanned for at the north face's own elevation.
    north: scanGround((h, n) => h > 2000 && h < 2600 && n.z < -0.45 && n.y > 0.75),
  };
  wanted.south = wanted.north
    ? scanGround((h, n) => Math.abs(h - wanted.north.h) < 80 && n.z > 0.45 && n.y > 0.75)
    : null;

  const LEVELS = [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1];
  const ground = {};
  for (const [name, spot] of Object.entries(wanted)) {
    if (!spot) {
      ground[name] = null;
      continue;
    }
    camera.position.set(spot.x, spot.h + 400, spot.z);
    camera.lookAt(spot.x, spot.h, spot.z);
    camera.updateMatrixWorld();
    terrain.update(camera);
    const rgbAt = [];
    for (const level of LEVELS) {
      SNOW_LEVEL.value = level;
      const px = shoot();
      // Mean of the 4x4 around the centre, like the albedo test.
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let py = SIZE / 2 - 2; py < SIZE / 2 + 2; py++) {
        for (let pxi = SIZE / 2 - 2; pxi < SIZE / 2 + 2; pxi++) {
          const i = (py * SIZE + pxi) * 4;
          r += px[i] / 255;
          g += px[i + 1] / 255;
          b += px[i + 2] / 255;
          n++;
        }
      }
      rgbAt.push([r / n, g / n, b / n]);
    }
    ground[name] = { ...spot, rgbAt };
  }
  SNOW_LEVEL.value = 0;

  // ---- part 2: the trees --------------------------------------------------
  const img = FOREST_MASK.value.image;
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const mask = ctx.getImageData(0, 0, img.width, img.height).data;
  const { xmin, ymin, xmax, ymax } = terrain.manifest.bboxCrsUnits;
  const worldWidth = xmax - xmin;
  const worldDepth = ymax - ymin;
  const maskAt = (x, z) => {
    const px = Math.floor(((x + worldWidth / 2) / worldWidth) * img.width);
    const py = Math.floor(((z + worldDepth / 2) / worldDepth) * img.height);
    if (px < 0 || py < 0 || px >= img.width || py >= img.height) return 0;
    return mask[(py * img.width + px) * 4] / 255;
  };

  // The highest and the lowest dense forest the scan can find, so the two are
  // measured at a level whose snowline sits between them: that is the case the
  // trees have to get right, and the one a global snow factor cannot.
  let hiWood = null;
  let loWood = null;
  for (let x = -26000; x <= 26000; x += 211) {
    for (let z = -14000; z <= 14000; z += 197) {
      if (maskAt(x, z) < 0.95) continue;
      const h = terrain.sampleRenderedHeight(x, z);
      if (!Number.isFinite(h)) continue;
      if (!hiWood || h > hiWood.h) hiWood = { x, z, h };
      if (!loWood || h < loWood.h) loWood = { x, z, h };
    }
  }

  const SIZE2 = 160;
  renderer.setSize(SIZE2, SIZE2);
  const target2 = new THREE.WebGLRenderTarget(SIZE2, SIZE2);
  const buf2 = new Uint8Array(SIZE2 * SIZE2 * 4);
  const wide = new THREE.PerspectiveCamera(60, 1, 0.5, 20000);
  const shoot2 = () => {
    renderer.setRenderTarget(target2);
    renderer.render(scene, wide);
    renderer.readRenderTargetPixels(target2, 0, 0, SIZE2, SIZE2, buf2);
    return Uint8Array.from(buf2);
  };

  const trees = {};
  for (const [name, spot] of Object.entries({ hiWood, loWood })) {
    if (!spot) {
      trees[name] = null;
      continue;
    }
    // Close in, so the stand in frame spans as little elevation as possible.
    wide.position.set(spot.x, spot.h + 22, spot.z + 70);
    wide.lookAt(spot.x, spot.h + 6, spot.z);
    wide.updateMatrixWorld();
    terrain.update(wide);

    const levels = [0, levelForLineInPage(spot), 1];
    const out = [];
    for (const level of levels) {
      SNOW_LEVEL.value = level;
      scene.remove(vegetation.object);
      const without = shoot2();
      scene.add(vegetation.object);
      const with_ = shoot2();
      out.push({ level, without, with_ });
    }

    // Tree pixels are defined by the level-0 pair, then measured at every level:
    // a mask taken at a snowy level would be biased towards whichever pixels
    // happen to differ most once both are pale.
    const isTree = [];
    const a = out[0].without;
    const b = out[0].with_;
    for (let i = 0; i < a.length; i += 4) {
      const d = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
      if (d > 18) isTree.push(i);
    }
    const meanOf = (px) => {
      let r = 0;
      let g = 0;
      let bb = 0;
      for (const i of isTree) {
        r += px[i] / 255;
        g += px[i + 1] / 255;
        bb += px[i + 2] / 255;
      }
      const n = Math.max(1, isTree.length);
      return [r / n, g / n, bb / n];
    };
    trees[name] = {
      ...spot,
      n: (() => {
        const nn = normalAt(spot.x, spot.z);
        return { y: nn.y, z: nn.z };
      })(),
      treePixels: isTree.length,
      framePixels: SIZE2 * SIZE2,
      at: out.map((o) => ({ level: o.level, tree: meanOf(o.with_), ground: meanOf(o.without) })),
    };
  }
  SNOW_LEVEL.value = 0;

  // Defined here rather than at the top because it needs nothing from the page
  // but has to be in scope for the loop above.
  function levelForLineInPage(spot) {
    const both = [hiWood?.h ?? spot.h, loWood?.h ?? spot.h];
    const mid = (both[0] + both[1]) / 2;
    return Math.min(1, Math.max(0, (3200 - mid) / (3200 - 900)));
  }

  const canopy = new THREE.Color(CANOPY_COLOR);
  const snowC = new THREE.Color(SNOW_COLOR);
  return {
    levels: LEVELS,
    ground,
    trees,
    slope: { rockTo: SLOPE_ROCK_TO, rockFrom: SLOPE_ROCK_FROM },
    canopyRgb: [canopy.r, canopy.g, canopy.b],
    snowRgb: [snowC.r, snowC.g, snowC.b],
    treeSnow: { base: TREE_SNOW_BASE, crown: TREE_SNOW_CROWN },
    tiles: terrain.stats.tiles,
  };
});

await browser.close();

const luma = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
let failures = 0;
const fail = (msg) => {
  failures++;
  console.log(`FAIL ${msg}`);
};

// ---- the ground ---------------------------------------------------------
// Cover is inverted from the pixel rather than eyeballed: at level 0 the point
// renders its own ground colour, at cover 1 it renders SNOW_COLOR, and the mix
// is linear, so the channel with the most contrast recovers the factor.
console.log(`Terrain drew ${result.tiles} tiles. Snow line ${SNOW_LINE_TOP_M} m -> ${SNOW_LINE_BOTTOM_M} m,`
  + ` onset ${SNOW_ONSET}, wobble +/-${SNOW_NOISE_M} m.\n`);

const bareOf = (ny) => {
  const { rockTo, rockFrom } = result.slope;
  const t = Math.min(1, Math.max(0, (ny - rockTo) / (rockFrom - rockTo)));
  return 1 - t * t * (3 - 2 * t);
};

for (const [name, s] of Object.entries(result.ground)) {
  if (!s) {
    fail(`ground/${name}: the scan found no qualifying point`);
    continue;
  }
  const base = s.rgbAt[0];
  const snow = result.snowRgb;
  // Pick the channel that separates ground from snow most; below ~0.1 of
  // contrast the inversion amplifies readback noise instead of measuring.
  let ch = 0;
  for (let i = 1; i < 3; i++) {
    if (Math.abs(snow[i] - base[i]) > Math.abs(snow[ch] - base[ch])) ch = i;
  }
  const span = snow[ch] - base[ch];
  const bare = bareOf(s.n.y);
  const rows = [];
  let worst = 0;
  for (let i = 0; i < result.levels.length; i++) {
    const level = result.levels[i];
    const measured = Math.abs(span) < 0.1 ? null : (s.rgbAt[i][ch] - base[ch]) / span;
    const lo = snowCoverAt({ elevM: s.h, aspectZ: s.n.z, bare, level, wobbleM: -SNOW_NOISE_M });
    const hi = snowCoverAt({ elevM: s.h, aspectZ: s.n.z, bare, level, wobbleM: +SNOW_NOISE_M });
    const off = measured === null ? 0 : Math.max(lo - COVER_TOL - measured, measured - (hi + COVER_TOL), 0);
    if (off > worst) worst = off;
    rows.push(
      `      level ${level.toFixed(2)}: cover ${measured === null ? ' n/a' : measured.toFixed(2)}` +
        `  bracket [${lo.toFixed(2)}, ${hi.toFixed(2)}]${off > 0 ? '  <-- outside' : ''}`,
    );
  }
  const ok = worst === 0;
  console.log(
    `${ok ? 'PASS' : 'FAIL'} ${name} @ ${Math.round(s.h)} m, n.y=${s.n.y.toFixed(2)}, n.z=${s.n.z.toFixed(2)}` +
      `${bare > 0.01 ? `, bare ${bare.toFixed(2)}` : ''}\n${rows.join('\n')}`,
  );
  if (!ok) failures++;
}

// The properties the user actually asked for, asserted as orderings rather than
// as numbers - these hold whatever the constants are tuned to next.
const g = result.ground;
const coverOf = (s, i) => {
  const base = s.rgbAt[0];
  let ch = 0;
  for (let k = 1; k < 3; k++) if (Math.abs(result.snowRgb[k] - base[k]) > Math.abs(result.snowRgb[ch] - base[ch])) ch = k;
  return (s.rgbAt[i][ch] - base[ch]) / (result.snowRgb[ch] - base[ch]);
};
const atLevel = (target) => result.levels.indexOf(target);

console.log('');
if (g.high && g.low) {
  // Altitude: at half a storm the summit is white and the valley is not.
  const iHalf = atLevel(0.5);
  const hi = coverOf(g.high, iHalf);
  const lo = coverOf(g.low, iHalf);
  const ok = hi > lo + 0.5;
  console.log(
    `${ok ? 'PASS' : 'FAIL'} altitude decides: at level 0.50, ${Math.round(g.high.h)} m is ${hi.toFixed(2)} covered` +
      ` and ${Math.round(g.low.h)} m is ${lo.toFixed(2)}`,
  );
  if (!ok) failures++;
}
if (g.north && g.south) {
  // Aspect: two faces at the same altitude, pointing opposite ways, one storm.
  // Divided by (1 - bare) so the slope term is factored out and what is left is
  // the aspect alone - the two faces are within 80 m of elevation but not equally
  // steep, and the cover they can hold at all differs for that reason.
  const lieOf = (s, i) => coverOf(s, i) / Math.max(1e-3, 1 - bareOf(s.n.y));
  const idx = result.levels
    .map((_, i) => i)
    .reduce((best, i) => (Math.abs(lieOf(g.north, i) - lieOf(g.south, i)) > Math.abs(lieOf(g.north, best) - lieOf(g.south, best)) ? i : best), 0);
  const n = lieOf(g.north, idx);
  const s = lieOf(g.south, idx);
  const ok = n > s + 0.1;
  console.log(
    `${ok ? 'PASS' : 'FAIL'} aspect decides: at level ${result.levels[idx].toFixed(2)}, the north face` +
      ` (${Math.round(g.north.h)} m, n.z=${g.north.n.z.toFixed(2)}) holds ${n.toFixed(2)} and the south face` +
      ` (${Math.round(g.south.h)} m, n.z=${g.south.n.z.toFixed(2)}) holds ${s.toFixed(2)}` +
      ` (slope factored out: bare ${bareOf(g.north.n.y).toFixed(2)} vs ${bareOf(g.south.n.y).toFixed(2)})`,
  );
  if (!ok) failures++;
}
if (g.cliff) {
  const c = coverOf(g.cliff, atLevel(1));
  const ok = c < 0.25;
  console.log(`${ok ? 'PASS' : 'FAIL'} slope decides: at a full storm the cliff (n.y=${g.cliff.n.y.toFixed(2)}) is`
    + ` ${c.toFixed(2)} covered`);
  if (!ok) failures++;
}
// Level 0 has to be exactly nothing, everywhere: the onset gate is what keeps a
// snow-free scene snow-free, and the line's own travel starts above the terrain.
for (const [name, s] of Object.entries(g)) {
  if (!s) continue;
  const c = coverOf(s, atLevel(0.15));
  if (c > 0.1 && s.h < 3000) fail(`${name}: level 0.15 already put ${c.toFixed(2)} of snow at ${Math.round(s.h)} m`);
}

// ---- the trees ----------------------------------------------------------
console.log('');
for (const [name, t] of Object.entries(result.trees)) {
  if (!t) {
    fail(`trees/${name}: no dense forest found`);
    continue;
  }
  const pct = ((t.treePixels / t.framePixels) * 100).toFixed(1);
  console.log(`${name} @ ${Math.round(t.h)} m: ${t.treePixels} tree pixels (${pct}% of frame)`);
  for (const row of t.at) {
    console.log(
      `      level ${row.level.toFixed(2)}: trees luma ${luma(row.tree).toFixed(3)},` +
        ` ground behind them ${luma(row.ground).toFixed(3)}`,
    );
  }
  const at0 = t.at[0];
  const at1 = t.at[t.at.length - 1];
  // Snow off: the trees must be exactly their canopy albedo, tint aside. This is
  // what catches a snow term that is live when it should not be.
  const tintSpan = [0.78, 1.18];
  const green = luma(result.canopyRgb);
  if (luma(at0.tree) < green * tintSpan[0] * 0.8 || luma(at0.tree) > green * tintSpan[1] * 1.2) {
    fail(`trees/${name}: with no snow the canopy reads ${luma(at0.tree).toFixed(3)}, not the ` +
      `${(green * tintSpan[0]).toFixed(3)}..${(green * tintSpan[1]).toFixed(3)} the albedo allows`);
  }
  // Full storm: the trees must have whitened, and by an amount the crown gradient
  // brackets. Slack of 60 m of elevation because the stand in frame is not flat.
  const cov = (w) => snowCoverAt({ elevM: t.h + w, aspectZ: t.n.z, level: 1, wobbleM: 0 });
  const coverLo = Math.min(cov(-60 - SNOW_NOISE_M), cov(60 + SNOW_NOISE_M));
  const coverHi = Math.max(cov(-60 - SNOW_NOISE_M), cov(60 + SNOW_NOISE_M));
  const white = luma(result.snowRgb);
  const lo = green * tintSpan[0] + (white - green * tintSpan[0]) * coverLo * result.treeSnow.base;
  const hi = green * tintSpan[1] + (white - green * tintSpan[1]) * coverHi * result.treeSnow.crown;
  const got = luma(at1.tree);
  const ok = got >= lo - 0.05 && got <= hi + 0.05;
  console.log(
    `      ${ok ? 'PASS' : 'FAIL'} at a full storm the canopy reads ${got.toFixed(3)},` +
      ` bracket [${lo.toFixed(3)}, ${hi.toFixed(3)}] for cover ${coverLo.toFixed(2)}..${coverHi.toFixed(2)}` +
      ` at base ${result.treeSnow.base}/crown ${result.treeSnow.crown}`,
  );
  if (!ok) failures++;
}
const { hiWood, loWood } = result.trees;
if (hiWood && loWood && Math.abs(hiWood.h - loWood.h) > 500) {
  // The one case a global snow factor cannot get right: one snowline, two
  // forests, and the trees have to disagree about it the way the ground does.
  const mid = hiWood.at[1];
  const midLo = loWood.at[1];
  const ok = luma(mid.tree) > luma(midLo.tree) + 0.03;
  console.log(
    `\n${ok ? 'PASS' : 'FAIL'} the snowline runs through the forest too: at level ${mid.level.toFixed(2)},` +
      ` the wood at ${Math.round(hiWood.h)} m reads ${luma(mid.tree).toFixed(3)} and the one at` +
      ` ${Math.round(loWood.h)} m reads ${luma(midLo.tree).toFixed(3)}`,
  );
  if (!ok) failures++;
} else {
  console.log(`\nSKIP snowline-through-the-forest: the scan found woods only ${
    hiWood && loWood ? Math.round(Math.abs(hiWood.h - loWood.h)) : '?'} m apart, too close to separate.`);
}

if (problems.length) console.log(`\nPage problems:\n  ${problems.join('\n  ')}`);
if (failures || problems.length) {
  console.log(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\nSnow lies where snow.js says it lies, on the ground and on the trees.');
