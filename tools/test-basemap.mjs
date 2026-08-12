#!/usr/bin/env node
// Checks the satellite ground texture (src/basemap.js, 2026-08-11): that the
// photo the terrain draws is the photo the build produced, at the right place on
// the ground, at the right level, and that the two things which still have to
// work over it - rock on cliffs and lying snow - still do.
//
// The rig is test-terrain-albedo.mjs's and test-snow.mjs's: one AmbientLight of
// intensity PI and no tone mapping makes the rendered pixel EXACTLY the albedo
// (three's Lambert BRDF is albedo/PI * irradiance), read back from a
// WebGLRenderTarget so it stays linear. So the measurement can be compared
// directly against the texel the shader was given, with no lighting constant to
// calibrate and no ACES curve in the way.
//
// The comparison is per point against the texture's OWN value at that point,
// which is what makes this a georeferencing test as well as a calibration one. A
// flipped V, a half-pixel convention slip or a bbox typo would put a glacier's
// texel on a valley floor, and every point would miss at once - where a check
// that only compared overall brightness would pass happily.
//
// It is a BRACKET rather than an equality, for the reason test-snow.mjs is:
// terrain.js modulates the photo by its own two-octave value noise
// (BASEMAP_DETAIL), and a chaotic hash cannot be reproduced across GLSL float32
// and JS float64. The noise is bounded to +/-0.75, so evaluating both extremes
// gives a strict interval the measurement must fall inside.
//
// One trap this suite fell into first, and the reason it now asserts that the mix
// does anything at all: a test must NOT pin a shared uniform holder through its
// own `import('/src/basemap.js')`. Vite rewrites the imports INSIDE a module it
// serves, so after any edit this session the terrain built here reaches
// `/src/basemap.js?t=<stamp>` - the page's instance - while a bare-path import
// hands the test a second one. The first version pinned that second copy: the mix
// never moved off the 1 that main.js's own loader had set, the "procedural" and
// "photo" readings came out identical to the byte, and every bracket still passed.
// The holders come from window.__pngp now, which is the page's instance by
// construction. (It also means this suite needs a DEV server - a production build
// strips that handle.)
//
// Usage: tools/dev/start-dev.sh && node tools/test-basemap.mjs

import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:5173';
// Readback is 8-bit and averaged over 4x4 pixels; the surface under those pixels
// spans a fraction of a texel but not exactly one, so a little slack on top of
// the noise bracket.
const ABS_TOL = 0.02;

// The grid the texture MUST be on. Compared field by field against the
// heightfield's own manifest rather than against numbers written down here: the
// two are addressed by one UV mapping in the shader, so any disagreement is a
// silent offset of the whole park.
const GRID_FIELDS = ['crs', 'rowOrientation'];

const heightfield = await (await fetch(`${url}/data/heightfield.json`)).json();
const basemap = await (await fetch(`${url}/data/basemap.json`)).json();

let failures = 0;
const fail = (msg) => {
  failures++;
  console.log(`FAIL ${msg}`);
};
const pass = (msg) => console.log(`ok   ${msg}`);

console.log(`Basemap ${basemap.file.name} (${(basemap.file.bytes / 1e6).toFixed(2)} MB), `
  + `scenes: ${basemap.source.scenes.map((s) => `${s.id.slice(-19, -9)}`).join(', ')}\n`);

// ---- part 1: the grid, before anything renders --------------------------
for (const f of GRID_FIELDS) {
  if (basemap[f] === heightfield[f]) pass(`grid ${f} matches the heightfield`);
  else fail(`grid ${f}: basemap "${basemap[f]}" vs heightfield "${heightfield[f]}"`);
}
for (const k of ['width', 'height']) {
  if (basemap.dimensions[k] === heightfield.dimensions[k]) pass(`grid ${k} ${basemap.dimensions[k]}`);
  else fail(`grid ${k}: ${basemap.dimensions[k]} vs heightfield ${heightfield.dimensions[k]}`);
}
for (const k of ['xmin', 'ymin', 'xmax', 'ymax']) {
  if (basemap.bboxCrsUnits[k] === heightfield.bboxCrsUnits[k]) pass(`grid ${k} ${basemap.bboxCrsUnits[k]}`);
  else fail(`grid ${k}: ${basemap.bboxCrsUnits[k]} vs heightfield ${heightfield.bboxCrsUnits[k]}`);
}
// The prescribed Copernicus wording, verbatim. It is a licence condition, not a
// caption, so it is asserted rather than trusted to survive an edit.
const YEAR = basemap.source.scenes[0].datetime.slice(0, 4);
const required = `Contains modified Copernicus Sentinel data ${YEAR}`;
if (basemap.source.attribution === required) pass(`attribution is the prescribed "${required}"`);
else fail(`attribution is "${basemap.source.attribution}", must be "${required}"`);

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
  const {
    loadTerrain, SLOPE_ROCK_TO, SLOPE_ROCK_FROM, ROCK_COLOR,
  } = await import('/src/terrain.js');
  const { loadForest } = await import('/src/forest.js');
  const { loadBasemap, BASEMAP_GAIN, BASEMAP_DETAIL } = await import('/src/basemap.js');
  const { SNOW_COLOR } = await import('/src/snow.js');
  // The holders the running page's shaders are actually bound to. Constants
  // (BASEMAP_GAIN, BASEMAP_DETAIL, SNOW_COLOR) are safe to import - they are
  // numbers read out of the same file text either way - but anything MUTATED has
  // to be this object. See the note at the top.
  const { basemap: pageBasemap, snowLevel: SNOW_LEVEL } = window.__pngp;
  const BASEMAP_MIX = pageBasemap.mix;
  const BASEMAP_SCALE = pageBasemap.scale;

  const terrain = await loadTerrain();
  const forest = await loadForest(); // before anything renders, or a wooded point measures the 1x1 placeholder
  const loaded = await loadBasemap();

  const scene = new THREE.Scene();
  scene.add(terrain.object);
  scene.add(new THREE.AmbientLight(0xffffff, Math.PI)); // rendered pixel == albedo

  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.toneMapping = THREE.NoToneMapping;
  const SIZE = 64;
  renderer.setSize(SIZE, SIZE);
  const target = new THREE.WebGLRenderTarget(SIZE, SIZE);
  const pixels = new Uint8Array(SIZE * SIZE * 4);
  const camera = new THREE.PerspectiveCamera(1, 1, 1, 20000);
  camera.up.set(0, 0, -1); // looking straight down, as in the sibling suites

  // The texture on the CPU, sampled the way the GPU samples it. Two details
  // matter and both would show up as a constant bias if got wrong: the image is
  // sRGB-encoded and hardware filtering happens AFTER the decode, so the
  // interpolation is done here in linear space; and the texture has flipY = true
  // (three's default for an image), so V = 1 is file row 0, which is the north
  // edge - the same convention terrainUv() uses.
  const img = pageBasemap.getTexture().image;
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, img.width, img.height).data;
  const toLinear = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const lut = Array.from({ length: 256 }, (_, i) => toLinear(i / 255));
  const texel = (px, py, ch) => {
    const x = Math.min(img.width - 1, Math.max(0, px));
    const y = Math.min(img.height - 1, Math.max(0, py));
    return lut[data[(y * img.width + x) * 4 + ch]];
  };
  const { xmin, ymin, xmax, ymax } = terrain.manifest.bboxCrsUnits;
  const worldWidth = xmax - xmin;
  const worldDepth = ymax - ymin;
  function sampleBasemap(x, z) {
    const u = (x + worldWidth / 2) / worldWidth;
    const v = (worldDepth / 2 - z) / worldDepth;
    const fx = u * img.width - 0.5;
    const fy = (1 - v) * img.height - 0.5;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = fx - x0;
    const ty = fy - y0;
    const out = [];
    for (let ch = 0; ch < 3; ch++) {
      const a = texel(x0, y0, ch) * (1 - tx) + texel(x0 + 1, y0, ch) * tx;
      const b = texel(x0, y0 + 1, ch) * (1 - tx) + texel(x0 + 1, y0 + 1, ch) * tx;
      out.push(a * (1 - ty) + b * ty);
    }
    return out;
  }

  // Canopy coverage on the CPU, off the same mask the shader reads. Needed because
  // "low ground" is not "forest": the first flat point between 900 and 1400 m in a
  // deterministic scan landed on bright bare valley floor (albedo 0.99), which
  // says nothing about whether the photo carries the colour of a wood.
  const mc = document.createElement('canvas');
  mc.width = forest.texture.image.width;
  mc.height = forest.texture.image.height;
  const mctx = mc.getContext('2d', { willReadFrequently: true });
  mctx.drawImage(forest.texture.image, 0, 0);
  const mask = mctx.getImageData(0, 0, mc.width, mc.height).data;
  const canopyAt = (x, z) => {
    const px = Math.floor(((x + worldWidth / 2) / worldWidth) * mc.width);
    const py = Math.floor(((worldDepth / 2 + z) / worldDepth) * mc.height);
    if (px < 0 || py < 0 || px >= mc.width || py >= mc.height) return 0;
    return mask[(py * mc.width + px) * 4] / 255;
  };

  const STEP = 20.5; // one heightfield cell, which is the shader's own normal spacing up close
  function normalAt(x, z) {
    const hW = terrain.sampleRenderedHeight(x - STEP, z);
    const hE = terrain.sampleRenderedHeight(x + STEP, z);
    const hN = terrain.sampleRenderedHeight(x, z - STEP);
    const hS = terrain.sampleRenderedHeight(x, z + STEP);
    return new THREE.Vector3((hW - hE) / (2 * STEP), 1, (hN - hS) / (2 * STEP)).normalize();
  }

  // Deterministic scan (never Math.random) so a failure is reproducible.
  function scan(test) {
    for (let x = -30000; x <= 30000; x += 137) {
      for (let z = -16000; z <= 16000; z += 149) {
        const h = terrain.sampleRenderedHeight(x, z);
        const n = normalAt(x, z);
        if (test(h, n, x, z)) return { x, z, h, ny: n.y, nz: n.z };
      }
    }
    return null;
  }
  // Flat enough that the slope-rock term is exactly zero (its ramp ends at
  // SLOPE_ROCK_FROM = 0.87), which is what keeps the prediction below clean -
  // and loose enough that a scan for flat ground above 3,600 m finds any.
  const flat = (n) => n.y > 0.93;
  // Points chosen so that between them the photo has to say four different
  // things: dark forest, olive open ground, pale high rock and bright ice. If the
  // texture were misplaced they would not merely be wrong, they would be wrong in
  // four different directions.
  const wanted = {
    'dense forest': scan((h, n, x, z) => h > 1000 && h < 2000 && flat(n) && canopyAt(x, z) > 0.9),
    'valley floor': scan((h, n) => h > 900 && h < 1400 && flat(n)),
    'open ground': scan((h, n) => h > 1900 && h < 2400 && flat(n)),
    'high rock': scan((h, n) => h > 3000 && h < 3400 && flat(n)),
    'ice': scan((h, n) => h > 3500 && flat(n)),
    'cliff': scan((h, n) => h > 1500 && h < 3000 && n.y < SLOPE_ROCK_TO - 0.05),
  };

  const shoot = (spot) => {
    camera.position.set(spot.x, spot.h + 400, spot.z);
    camera.lookAt(spot.x, spot.h, spot.z);
    camera.updateMatrixWorld();
    terrain.update(camera);
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.readRenderTargetPixels(target, 30, 30, 4, 4, pixels);
    const rgb = [0, 0, 0];
    for (let p = 0; p < 16; p++) for (let ch = 0; ch < 3; ch++) rgb[ch] += pixels[p * 4 + ch] / 255 / 16;
    return rgb;
  };

  const points = {};
  for (const [name, spot] of Object.entries(wanted)) {
    if (!spot) {
      points[name] = null;
      continue;
    }
    BASEMAP_MIX.value = 1;
    const photo = shoot(spot);
    BASEMAP_MIX.value = 0;
    const procedural = shoot(spot);
    BASEMAP_MIX.value = 1;
    points[name] = { ...spot, photo, procedural, texel: sampleBasemap(spot.x, spot.z) };
  }

  // The mix has to MOVE the ground, or everything above could be measuring one
  // look twice. Taken at the point where the two disagree most, so a real change
  // cannot hide inside readback noise.
  let mixProof = null;
  for (const [name, p] of Object.entries(points)) {
    if (!p) continue;
    const d = Math.abs(p.photo[0] - p.procedural[0]) + Math.abs(p.photo[1] - p.procedural[1])
      + Math.abs(p.photo[2] - p.procedural[2]);
    if (!mixProof || d > mixProof.delta) mixProof = { name, delta: d, photo: p.photo, procedural: p.procedural };
  }

  // Snow still goes on top of the photo. One point is enough here - test-snow.mjs
  // owns WHERE snow lies; what this proves is only that the new mix did not
  // swallow it.
  // NOT the high-rock point: at this gain bright rock already renders at 1.000 and
  // snow (luma 0.946) would read as a DARKENING there. Open ground at 2,000 m is
  // dark enough to show the change and high enough to be under the snowline at
  // level 1.
  const snowSpot = wanted['open ground'] ?? wanted['dense forest'];
  let snow = null;
  if (snowSpot) {
    SNOW_LEVEL.value = 1;
    const covered = shoot(snowSpot);
    SNOW_LEVEL.value = 0;
    snow = { covered, bare: points['open ground']?.photo ?? points['dense forest'].photo };
  }

  const col = (hex) => {
    const t = new THREE.Color(hex);
    return [t.r, t.g, t.b];
  };
  return {
    points,
    mixProof,
    snow,
    snowColor: col(SNOW_COLOR),
    rockColor: col(ROCK_COLOR),
    slope: { rockTo: SLOPE_ROCK_TO, rockFrom: SLOPE_ROCK_FROM },
    detail: BASEMAP_DETAIL,
    gain: BASEMAP_GAIN,
    scale: BASEMAP_SCALE.value,
    fullScale: loaded.manifest.encoding.fullScale,
    textureSize: [img.width, img.height],
    tiles: terrain.stats.tiles,
  };
});

await browser.close();

const luma = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

// ---- part 2: what the shader was given ---------------------------------
if (result.textureSize[0] === basemap.dimensions.width && result.textureSize[1] === basemap.dimensions.height) {
  pass(`the loaded texture is ${result.textureSize.join('x')}, as the manifest says`);
} else {
  fail(`the loaded texture is ${result.textureSize.join('x')}, manifest says `
    + `${basemap.dimensions.width}x${basemap.dimensions.height}`);
}
const expectedScale = result.fullScale * result.gain;
if (Math.abs(result.scale - expectedScale) < 1e-6) {
  pass(`uBasemapScale is fullScale ${result.fullScale} x gain ${result.gain} = ${expectedScale.toFixed(3)}`);
} else {
  fail(`uBasemapScale is ${result.scale}, expected ${expectedScale}`);
}

// ---- part 3: the ground, point by point --------------------------------
// terrain.js: photo = texel * uBasemapScale * (1 + wobble * BASEMAP_DETAIL), then
// mix(photo, ROCK, bare * 0.9). wobble is two octaves of value noise in
// [-0.75, 0.75], so the two extremes bracket it.
const WOBBLE = 0.75;
const bareOf = (ny) => {
  const t = Math.min(1, Math.max(0, (ny - result.slope.rockTo) / (result.slope.rockFrom - result.slope.rockTo)));
  return 1 - t * t * (3 - 2 * t);
};

console.log(`\nTerrain drew ${result.tiles} tiles. Photo albedo = texel x ${expectedScale.toFixed(3)}`
  + ` x (1 +/- ${(WOBBLE * result.detail).toFixed(3)}).\n`);
console.log('point            elev     measured rgb           expected bracket        photo/procedural');

for (const [name, p] of Object.entries(result.points)) {
  if (!p) {
    fail(`${name}: the scan found no qualifying point`);
    continue;
  }
  const bare = bareOf(p.ny);
  const bracket = [-1, 1].map((sign) =>
    p.texel.map((t, ch) => {
      const photo = t * result.scale * (1 + sign * WOBBLE * result.detail);
      return photo * (1 - bare * 0.9) + result.rockColor[ch] * (bare * 0.9);
    }));
  // Clamped into 0..1 before comparing: the readback is an 8-bit framebuffer, so
  // an albedo the photo really does push past 1.0 (bright ice at this gain does)
  // can only ever come back as 1.000, and asserting 1.65 against it would be
  // asserting against the buffer rather than against the shader.
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const lo = bracket[0].map((v, ch) => clamp(Math.min(v, bracket[1][ch])) - ABS_TOL);
  const hi = bracket[0].map((v, ch) => clamp(Math.max(v, bracket[1][ch])) + ABS_TOL);
  const inside = p.photo.every((v, ch) => v >= lo[ch] && v <= hi[ch]);
  const fmt = (a) => a.map((v) => v.toFixed(3)).join('/');
  console.log(
    `${name.padEnd(14)} ${String(Math.round(p.h)).padStart(5)} m  ${fmt(p.photo)}  `
    + `  ${fmt(lo)} .. ${fmt(hi)}   procedural ${fmt(p.procedural)}`
    + `  x${(luma(p.photo) / luma(p.procedural)).toFixed(2)}`
    + `${bare > 0.01 ? `  (bare ${bare.toFixed(2)})` : ''}`,
  );
  if (!inside) fail(`${name} at ${Math.round(p.h)} m: ${fmt(p.photo)} is outside ${fmt(lo)} .. ${fmt(hi)}`);
}
if (!failures) pass('every point renders the texel the build put at its own coordinates');

// The four land covers have to differ, or the test above could be passing on a
// uniform grey texture that happens to sit inside every bracket.
const spread = ['dense forest', 'open ground', 'high rock', 'ice']
  .map((k) => result.points[k])
  .filter(Boolean)
  .map((p) => luma(p.photo));
if (spread.length >= 3) {
  const range = Math.max(...spread) - Math.min(...spread);
  if (range > 0.15) pass(`the four land covers span ${range.toFixed(3)} of albedo, so the texture is not flat`);
  else fail(`the land covers span only ${range.toFixed(3)} of albedo - is the texture uniform?`);
}

// Forest is the one cover whose HUE the photo should carry, and a misplaced
// texture is the thing this catches: dense canopy reads green (G > R) while high
// rock and ice read neutral.
const forest = result.points['dense forest'];
const rock = result.points['high rock'];
if (forest && rock) {
  const gr = (p) => p.photo[1] / p.photo[0];
  if (gr(forest) > gr(rock)) {
    pass(`dense forest reads greener than high rock (G/R ${gr(forest).toFixed(2)} vs ${gr(rock).toFixed(2)})`);
  } else {
    fail(`dense forest is not greener than high rock (G/R ${gr(forest).toFixed(2)} vs ${gr(rock).toFixed(2)})`);
  }
}

const mp = result.mixProof;
if (mp) {
  if (mp.delta > 0.05) {
    pass(`the mix reaches the shader: at ${mp.name} the ground moves `
      + `${mp.procedural.map((v) => v.toFixed(3)).join('/')} -> ${mp.photo.map((v) => v.toFixed(3)).join('/')}`);
  } else {
    fail(`switching uBasemapMix changed the ground by ${mp.delta.toFixed(4)} in total - `
      + 'the pinned holder is probably not the one the shader is bound to');
  }
}

// ---- part 4: what still has to work over the photo ---------------------
const cliff = result.points.cliff;
if (cliff) {
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const raw = cliff.texel.map((t) => t * result.scale);
  if (dist(cliff.photo, result.rockColor) < dist(raw, result.rockColor)) {
    pass('a cliff still reads as rock rather than as whatever the photo draped on it');
  } else {
    fail('the slope-rock term is not reaching the ground under the photo');
  }
}
if (result.snow) {
  const gain = luma(result.snow.covered) - luma(result.snow.bare);
  const toSnow = Math.abs(luma(result.snow.covered) - luma(result.snowColor));
  if (gain > 0.1 && toSnow < 0.1) {
    pass(`lying snow still covers the photo (luma ${luma(result.snow.bare).toFixed(3)} -> `
      + `${luma(result.snow.covered).toFixed(3)}, snow colour ${luma(result.snowColor).toFixed(3)})`);
  } else {
    fail(`lying snow over the photo: luma ${luma(result.snow.bare).toFixed(3)} -> `
      + `${luma(result.snow.covered).toFixed(3)}, snow colour is ${luma(result.snowColor).toFixed(3)}`);
  }
}

if (problems.length) console.log(`\nPage problems:\n  ${problems.join('\n  ')}`);
if (failures || problems.length) {
  console.log(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\nThe satellite ground is the built texture, in the right place, at the right level.');
