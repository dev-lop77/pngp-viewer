#!/usr/bin/env node
// Checks that the terrain's vegetation-band albedo (src/terrain.js, phase 6)
// actually reaches the framebuffer with the colours the band table specifies.
//
// Why this exists rather than just eyeballing a screenshot: "no console
// errors" has repeatedly been worthless on this project - the RG8 displacement
// patch produced no errors for three phases while never running at all. A
// shader that compiles tells you nothing about what it computes. So this
// renders known points and compares pixels to the table numerically.
//
// The trick that makes it exact: light the scene with a single AmbientLight of
// intensity PI and disable tone mapping. three's Lambert BRDF is
// albedo/PI * irradiance, and an ambient light's irradiance is colour*intensity,
// so the rendered pixel is *exactly* the albedo - no lighting constant to
// calibrate, and slope no longer affects shading, which isolates the band
// function from the sun. Reading back from a WebGLRenderTarget keeps the values
// linear (the sRGB encode only happens when drawing to the canvas).
//
// Runs against a dev server (Vite serves src/ as ES modules, so the page can
// import terrain.js directly and no test-only code has to live in main.js).
//
// Usage: tools/dev/start-dev.sh && node tools/test-terrain-albedo.mjs

import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:5173';
const TOLERANCE = 2 / 255; // linear units; anything real fails by far more than one 8-bit step

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 320, height: 240 } });
const pageProblems = [];
page.on('pageerror', (err) => pageProblems.push(err.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') pageProblems.push(msg.text());
});

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

// The satellite ground OFF, and PINNED off (2026-08-11). This suite's subject is
// the procedural band mapping, but the page it runs inside loads the satellite
// texture and switches the shared mix to 1 - so left alone, every band here would
// be asserted against a photograph and all seven would "fail". Two details:
//   - it goes through window.__pngp, because that is the holder instance the
//     terrain shader is bound to (a test-side `import('/src/basemap.js')` can be a
//     second copy - see the note at the top of tools/test-basemap.mjs);
//   - it is a getter, not an assignment, because main.js's own loader resolves
//     later and would otherwise switch it back on mid-suite.
await page.waitForFunction(() => window.__pngp !== undefined, null, { timeout: 60000 });
await page.evaluate(() => {
  const mix = window.__pngp.basemap.mix;
  Object.defineProperty(mix, 'value', { get: () => 0, set: () => {}, configurable: true });
});

const result = await page.evaluate(async () => {
  const THREE = await import('/node_modules/three/build/three.module.js');
  const {
    loadTerrain,
    VEGETATION_BANDS,
    BAND_NOISE_M,
    ASPECT_SHIFT_M,
    ROCK_COLOR,
    SLOPE_ROCK_TO,
    FOREST_FLOOR_COLOR,
    FOREST_FLOOR_MIX,
  } = await import('/src/terrain.js');
  const { loadForest, FOREST_MASK } = await import('/src/forest.js');

  const terrain = await loadTerrain();
  // The mask has to be loaded before anything is rendered, or the wooded case
  // would silently measure the 1x1 "nothing is wooded" placeholder.
  await loadForest();
  const { min: elevMin, max: elevMax } = terrain.manifest.elevationRangeM;

  const scene = new THREE.Scene();
  scene.add(terrain.object);
  // intensity = PI makes rendered pixel == albedo exactly (see header).
  scene.add(new THREE.AmbientLight(0xffffff, Math.PI));

  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setSize(64, 64);
  const target = new THREE.WebGLRenderTarget(64, 64); // linear, no sRGB encode on readback

  const camera = new THREE.PerspectiveCamera(1, 1, 1, 20000); // near-telephoto: the centre pixel is the point below
  camera.up.set(0, 0, -1); // looking straight down, so "up" cannot be +Y

  // Candidate points: gentle ground well inside each band, plus steep ground in
  // the montane band to exercise the slope override. Slope comes from the same
  // rendered-surface sampler the shader effectively draws.
  const halfW = 40000;
  const halfD = 22000;
  const STEP = 20.5; // one heightfield cell
  function normalYAt(x, z) {
    const hW = terrain.sampleRenderedHeight(x - STEP, z);
    const hE = terrain.sampleRenderedHeight(x + STEP, z);
    const hN = terrain.sampleRenderedHeight(x, z - STEP);
    const hS = terrain.sampleRenderedHeight(x, z + STEP);
    const n = new THREE.Vector3((hW - hE) / (2 * STEP), 1, (hS - hN) / (2 * STEP)).normalize();
    return { y: n.y, z: n.z };
  }

  // Enough margin that neither the noise wobble nor the aspect shift can move a
  // sample into the neighbouring band.
  const MARGIN = BAND_NOISE_M * 0.75 + ASPECT_SHIFT_M + 120;

  // Read the canopy mask back on the CPU. This is the reference the forest case
  // is measured against, which is what pins the mask's geographic alignment on
  // the terrain: a flipped or offset V would put the tint somewhere else and the
  // comparison would fail, where "it looks plausible" would not have noticed.
  const maskImg = FOREST_MASK.value.image;
  const canvas = document.createElement('canvas');
  canvas.width = maskImg.width;
  canvas.height = maskImg.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(maskImg, 0, 0);
  const maskData = ctx.getImageData(0, 0, maskImg.width, maskImg.height).data;
  const { xmin, ymin, xmax, ymax } = terrain.manifest.bboxCrsUnits;
  const worldWidth = xmax - xmin;
  const worldDepth = ymax - ymin;
  const maskAt = (x, z) => {
    const px = Math.floor(((x + worldWidth / 2) / worldWidth) * maskImg.width);
    const py = Math.floor(((z + worldDepth / 2) / worldDepth) * maskImg.height);
    if (px < 0 || py < 0 || px >= maskImg.width || py >= maskImg.height) return 0;
    return maskData[(py * maskImg.width + px) * 4] / 255;
  };

  const wanted = [];
  for (let i = 0; i < VEGETATION_BANDS.length; i++) {
    const lo = i === 0 ? elevMin : VEGETATION_BANDS[i - 1].top;
    const hi = VEGETATION_BANDS[i].top === Infinity ? elevMax : VEGETATION_BANDS[i].top;
    if (hi - lo < 2 * MARGIN) continue;
    // Bands are checked on unwooded ground so the band colour is what's measured;
    // the forest tint gets its own case below.
    wanted.push({ band: VEGETATION_BANDS[i].name, lo: lo + MARGIN, hi: hi - MARGIN, steep: false, wooded: false });
  }
  wanted.push({ band: 'montane', lo: 900 + MARGIN, hi: 1600 - MARGIN, steep: true, wooded: false });
  wanted.push({ band: 'montane', lo: 900 + MARGIN, hi: 1600 - MARGIN, steep: false, wooded: true });

  const found = [];
  for (const w of wanted) {
    let hit = null;
    // Deterministic scan (no Math.random) so a failure is reproducible.
    for (let gx = -halfW; gx <= halfW && !hit; gx += 137) {
      for (let gz = -halfD; gz <= halfD && !hit; gz += 149) {
        const h = terrain.sampleRenderedHeight(gx, gz);
        if (!(h > w.lo && h < w.hi)) continue;
        // Fully wooded or not at all, and the same across the neighbouring mask
        // pixels too: the GPU bilinear-filters the mask, so a point that is
        // saturated but sits next to a lighter texel measures somewhere in
        // between and the expected value would be wrong by a hair.
        const wood = maskAt(gx, gz);
        const NB = 21; // slightly over one 20.5 m mask pixel
        const uniform = [
          [NB, 0],
          [-NB, 0],
          [0, NB],
          [0, -NB],
        ].every(([dx, dz]) => maskAt(gx + dx, gz + dz) === wood);
        if (!uniform) continue;
        if (w.wooded ? wood < 1 : wood > 0) continue;
        const n = normalYAt(gx, gz);
        if (w.steep ? n.y < SLOPE_ROCK_TO - 0.05 : n.y > 0.985) hit = { x: gx, z: gz, h, ny: n.y, nz: n.z, wood };
      }
    }
    if (hit) found.push({ ...w, ...hit });
  }

  const pixels = new Uint8Array(64 * 64 * 4);
  const samples = [];
  for (const f of found) {
    camera.position.set(f.x, f.h + 400, f.z);
    camera.lookAt(f.x, f.h, f.z);
    camera.updateMatrixWorld();
    terrain.update(camera);
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.readRenderTargetPixels(target, 30, 30, 4, 4, pixels);
    let r = 0;
    let g = 0;
    let b = 0;
    for (let p = 0; p < 16; p++) {
      r += pixels[p * 4] / 255;
      g += pixels[p * 4 + 1] / 255;
      b += pixels[p * 4 + 2] / 255;
    }
    samples.push({ ...f, rgb: [r / 16, g / 16, b / 16] });
  }

  const bandColor = (name) => {
    const c = new THREE.Color(VEGETATION_BANDS.find((v) => v.name === name).color);
    return [c.r, c.g, c.b];
  };
  const rock = new THREE.Color(ROCK_COLOR);
  const floor = new THREE.Color(FOREST_FLOOR_COLOR);

  return {
    tiles: terrain.stats.tiles,
    samples: samples.map((s) => {
      let base = bandColor(s.band);
      // Same order as the shader: forest tint first, then rock overrides it.
      if (s.wooded) {
        base = base.map((c, i) => c + ([floor.r, floor.g, floor.b][i] - c) * s.wood * FOREST_FLOOR_MIX);
      }
      // The shader mixes 90% of the way to rock at full steepness.
      const expected = s.steep ? base.map((c, i) => c + ([rock.r, rock.g, rock.b][i] - c) * 0.9) : base;
      return {
        band: s.band,
        steep: s.steep,
        wooded: s.wooded,
        wood: Number(s.wood.toFixed(2)),
        at: [Math.round(s.x), Math.round(s.z)],
        elev: Math.round(s.h),
        normalY: Number(s.ny.toFixed(3)),
        rgb: s.rgb.map((c) => Number(c.toFixed(4))),
        expected: expected.map((c) => Number(c.toFixed(4))),
        maxErr: Math.max(...s.rgb.map((c, i) => Math.abs(c - expected[i]))),
      };
    }),
  };
});

if (pageProblems.length) {
  console.log(`Page problems:\n  ${pageProblems.join('\n  ')}`);
}

console.log(`Terrain drew ${result.tiles} tiles.\n`);
let failures = 0;
for (const s of result.samples) {
  // The steep case can't be exact: the sample sits on a slope, so the pixel is
  // an interpolated normal's worth away from the ideal. Checked as "much closer
  // to rock than to its band" instead of a tight numeric match.
  const limit = s.steep ? 0.05 : TOLERANCE;
  const ok = s.maxErr <= limit;
  if (!ok) failures++;
  console.log(
    `${ok ? 'PASS' : 'FAIL'} ${s.band}${s.steep ? ' (steep)' : ''}${s.wooded ? ` (wooded ${s.wood})` : ''}` +
      ` @ ${s.elev} m, n.y=${s.normalY}\n` +
      `       got      ${s.rgb.join(', ')}\n` +
      `       expected ${s.expected.join(', ')}   maxErr ${s.maxErr.toFixed(4)} (limit ${limit})`,
  );
}

await browser.close();

if (result.samples.length < 5) {
  console.log(`\nOnly ${result.samples.length} bands sampled - the scan found no qualifying ground for the rest.`);
  process.exit(1);
}
if (failures || pageProblems.length) {
  console.log(`\n${failures} band(s) wrong.`);
  process.exit(1);
}
console.log('\nAll bands render the albedo the table specifies.');
