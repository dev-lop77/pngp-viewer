#!/usr/bin/env node
// Grass, shrubs and edelweiss: does the ground cover exist, does it follow the
// data, and do the two layers still have their own shaders?
//
// That last one is not a hypothetical. three caches compiled programs and
// Material.customProgramCacheKey() defaults to onBeforeCompile.toString(), so two
// materials built by the same factory have identical hook SOURCE and differ only
// in a closure the cache key cannot see. The shrub layer silently ran the grass
// layer's shader for three rounds of tuning, every one of which changed nothing -
// including a tint set to 0.06, which left the pixels byte-identical. So the
// program count is asserted here, and the two vertex sources are compared, because
// the failure is invisible in every other way.
//
// The other lesson this file encodes: EVERY LAYER IS MEASURED ALONE. A single
// combined figure read 21.9% and was believed; all of it was the shrubs, and the
// grass it was meant to be measuring was drawing nothing at all.
//
// Node half first (lattice, belt, geometry invariants), then the browser.
//
// Usage: tools/dev/start-dev.sh && node tools/test-groundcover.mjs

import { chromium } from 'playwright';
import { decode } from 'fast-png';
import {
  GRASS, SHRUB, SHRUB_SHARE, BLADES_PER_TUFT, GRASS_TINT, SHRUB_TINT,
  GRASS_SINK_FRACTION, GRASS_MIN_H, GRASS_MAX_H, coverLattice, shrubShareAt,
} from '../src/groundcover.js';
import {
  ELEV_MIN_M, ELEV_MAX_M, COVER_MIN, COVER_MAX, FOUND_RADIUS_M,
} from '../src/edelweiss.js';

const url = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'http://localhost:5173';

let failures = 0;
const fail = (msg) => { failures++; console.log(`FAIL ${msg}`); };
const ok = (msg) => console.log(`ok   ${msg}`);
const check = (cond, msg, detail) => (cond ? ok(msg) : fail(`${msg}${detail ? ` - ${detail}` : ''}`));

// ---- node half: the lattice, the belt, the invariants --------------------

console.log('The lattice, the belt and the geometry invariants\n');

// The wrap only works while the draw distance stays under half a window: at half a
// window, which copy of a slot is nearest the camera flips, and a slot whose scale
// has not already reached zero would jump. Asserted for both layers because it is
// the one constraint that silently breaks when a draw distance is turned up.
for (const [name, layer] of [['grass', GRASS], ['shrub', SHRUB]]) {
  check(layer.visibleM < layer.windowM / 2,
    `${name}: the draw distance stays inside half a window (${layer.visibleM} m of ${layer.windowM / 2} m)`);
  check(layer.fadeStartM < layer.visibleM, `${name}: the fade starts before the cutoff`);
}

// The shuffle is what makes the density knob free, and the failure it prevents is
// spatial: an unshuffled lattice walks its window in row order, so drawing the
// first quarter of it puts every instance in the northern quarter of the window -
// perfect grass in front of you and none at all behind. Binning is the only way to
// see the difference; a count would look identical.
function binOccupancy(offsets, count, windowM, bins = 4) {
  const cells = new Array(bins * bins).fill(0);
  for (let i = 0; i < count; i++) {
    const bx = Math.min(bins - 1, Math.floor((offsets[i * 2] / windowM) * bins));
    const bz = Math.min(bins - 1, Math.floor((offsets[i * 2 + 1] / windowM) * bins));
    cells[bz * bins + bx]++;
  }
  return cells;
}
const lattice = coverLattice(GRASS);
const quarter = Math.round(lattice.count * 0.25);
const shuffledBins = binOccupancy(lattice.offsets, quarter, GRASS.windowM);
const expected = quarter / 16;
const worstShuffled = Math.max(...shuffledBins.map((c) => Math.abs(c - expected) / expected));
check(worstShuffled < 0.15,
  `a quarter of the shuffled lattice fills all 16 bins evenly (worst bin off by ${(worstShuffled * 100).toFixed(1)}%)`);

// The same test on the row order the trees use, to show the assertion above has
// teeth rather than passing by luck.
const rowOrder = new Float32Array(lattice.offsets.length);
const pairs = [];
for (let i = 0; i < lattice.count; i++) pairs.push([lattice.offsets[i * 2], lattice.offsets[i * 2 + 1]]);
pairs.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
pairs.forEach(([x, z], i) => { rowOrder[i * 2] = x; rowOrder[i * 2 + 1] = z; });
const rowBins = binOccupancy(rowOrder, quarter, GRASS.windowM);
const emptyRowBins = rowBins.filter((c) => c === 0).length;
check(emptyRowBins >= 8,
  `in row order the same prefix leaves ${emptyRowBins} of 16 bins completely empty - which is what the shuffle exists to avoid`);

// Every offset must land inside the window, or the wrap arithmetic is off by a cell.
let inWindow = true;
for (let i = 0; i < lattice.count * 2; i++) {
  if (lattice.offsets[i] < 0 || lattice.offsets[i] > GRASS.windowM) inWindow = false;
}
check(inWindow, 'every jittered offset lands inside the window');

// The belt: the CPU twin has to reproduce the table it is generated from, because
// the shader's version is generated from the same array and a disagreement here
// would mean the two have drifted.
let tableExact = true;
for (const [elev, share] of SHRUB_SHARE) {
  if (Math.abs(shrubShareAt(elev) - share) > 1e-9) tableExact = false;
}
check(tableExact, 'shrubShareAt() returns the table exactly at every node');
const mid = (SHRUB_SHARE[1][0] + SHRUB_SHARE[2][0]) / 2;
const midExpected = (SHRUB_SHARE[1][1] + SHRUB_SHARE[2][1]) / 2;
check(Math.abs(shrubShareAt(mid) - midExpected) < 1e-9,
  `it interpolates linearly between nodes (${mid} m -> ${shrubShareAt(mid).toFixed(3)})`);
check(shrubShareAt(200) === SHRUB_SHARE[0][1] && shrubShareAt(9000) === 0,
  'below the first node it holds, above the last it is zero - so nothing is dwarf shrub on a summit');
check(Math.max(...SHRUB_SHARE.map(([, v]) => v)) < 1,
  'the belt never claims ALL the cover is shrub, so grass exists at every elevation it does');

// The bug that rendered nothing at all, in a form that cannot come back: a sink
// expressed as a FRACTION of the plant's own height can never bury it, whereas the
// absolute 0.35 m it replaced was deeper than the tallest blade in the park.
check(GRASS_SINK_FRACTION > 0 && GRASS_SINK_FRACTION < 0.5,
  `the grass sinks by a fraction of its height (${GRASS_SINK_FRACTION}), so a tuft always stands above ground`);
check(GRASS_MIN_H > 0 && GRASS_MAX_H > GRASS_MIN_H && GRASS_MAX_H < 1,
  `blade heights are alpine turf, not a lawn (${GRASS_MIN_H}-${GRASS_MAX_H} m)`);
check(BLADES_PER_TUFT >= 3, `a tuft is a spray, not a single blade (${BLADES_PER_TUFT})`);

// Both tints multiply the ground's own albedo, so both must be near 1 rather than
// being colours in their own right - and the shrub must be the darker of the two,
// which is the whole reason the belt is visible from a distance.
const lumaOf = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
check(lumaOf(SHRUB_TINT) < lumaOf(GRASS_TINT),
  `dwarf shrub is darker than turf (${lumaOf(SHRUB_TINT).toFixed(2)} vs ${lumaOf(GRASS_TINT).toFixed(2)})`);
check(GRASS_TINT[1] > GRASS_TINT[0] && GRASS_TINT[1] > GRASS_TINT[2],
  'the grass tint leans green rather than merely darkening');

// ---- browser half: is it drawn, does it follow the data ------------------

console.log('\nIn the running page\n');

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
const pageErrors = [];
page.on('pageerror', (err) => pageErrors.push(err.message));
page.on('console', (msg) => { if (msg.type() === 'error') pageErrors.push(msg.text()); });

await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForFunction(() => window.__pngp?.groundcover?.getLayers?.() !== undefined, null, { timeout: 90000 });
await page.waitForTimeout(2500);

const loaded = await page.evaluate(() => window.__pngp.groundcover.getMaskSize());
check(loaded.width > 1000,
  `the landcover mask is loaded (${loaded.width}x${loaded.height}), so nothing below is measuring the 1x1 placeholder`);

// THE REGRESSION TEST FOR THE SHARED-SHADER BUG. Read the real compiled sources
// out of the GL context: two programs must contain the placement code, and their
// tint lines must differ. Nothing observable distinguishes the broken state
// otherwise - the shrubs still draw, they are simply the grass.
const programs = await page.evaluate(() => {
  const { renderer } = window.__pngp;
  const gl = renderer.getContext();
  const found = [];
  for (const p of renderer.info.programs ?? []) {
    let vs = '';
    try { vs = gl.getShaderSource(p.vertexShader) ?? ''; } catch { vs = ''; }
    if (!vs.includes('coverUv')) continue;
    found.push({
      tint: (vs.match(/vec3 tint = vec3\([^;]*;/) ?? ['(none)'])[0],
      window: (vs.match(/floor\( \( cameraPosition\.xz - aOffset \) \/ ([0-9.]+)/) ?? [null, '?'])[1],
    });
  }
  return found;
});
check(programs.length === 2,
  `each layer compiled its OWN shader program (${programs.length} programs carry the placement code)`);
check(programs.length === 2 && programs[0].tint !== programs[1].tint,
  'the two programs carry different tints - i.e. neither layer is running the other\'s shader',
  programs.map((p) => p.tint).join(' | '));
check(new Set(programs.map((p) => p.window)).size === programs.length,
  `each program wraps on its own window (${programs.map((p) => `${p.window} m`).join(', ')})`);

const CLIP = { x: 170, y: 300, width: 560, height: 260 };
// The nav panel and the env controls sit inside the measured crop; the search box
// and the POI card are top-left, outside it, and the search box has to stay usable
// because that is how a vantage is chosen. Hiding it was why every vantage in the
// first run silently measured the spawn.
await page.addStyleTag({ content: '#nav, #env-controls, #credits, #hint, #look-diag, #audio-diag { display: none !important; }' });


// Pinning a holder that main.js drives EVERY FRAME needs an accessor, not an
// assignment. The per-frame writes are `SNOW_LEVEL.value = weather.mod.snow` and
// `GROUNDCOVER_WIND.value = weather.mod.wind`, so `holder.value = x` survives for
// one frame and is then overwritten - which reported the grass moving MORE in calm
// than in wind, because both cases were really running at the weather's own 0.3.
// Holders that nothing drives per frame (density, the basemap mix, the sky
// altitude override) can be assigned normally.
async function pinValue(page, path, value) {
  await page.evaluate(({ path, value }) => {
    const holder = path.split('.').reduce((o, k) => o[k], window.__pngp);
    Object.defineProperty(holder, 'value', { get: () => value, set: () => {}, configurable: true });
  }, { path, value });
}
async function unpinValue(page, path, value = 0) {
  await page.evaluate(({ path, value }) => {
    const holder = path.split('.').reduce((o, k) => o[k], window.__pngp);
    Object.defineProperty(holder, 'value', { value, writable: true, configurable: true });
  }, { path, value });
}

const only = (kind) => page.evaluate((k) => {
  for (const l of window.__pngp.groundcover.getLayers()) l.mesh.visible = l.kind === k;
}, kind);

async function shot(name) {
  return decode(await page.screenshot({ path: `tools/dev/logs/test-gc-${name}.png`, clip: CLIP, timeout: 120000 }));
}
function changed(a, b) {
  const n = a.width * a.height;
  let moved = 0;
  for (let i = 0; i < n; i++) {
    const p = i * a.channels;
    const q = i * b.channels;
    const d = Math.max(
      Math.abs(a.data[p] - b.data[q]),
      Math.abs(a.data[p + 1] - b.data[q + 1]),
      Math.abs(a.data[p + 2] - b.data[q + 2]),
    );
    if (d > 2) moved++;
  }
  return moved / n;
}
function meanLuma(a) {
  const n = a.width * a.height;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const p = i * a.channels;
    sum += 0.2126 * a.data[p] + 0.7152 * a.data[p + 1] + 0.0722 * a.data[p + 2];
  }
  return sum / (n * 255);
}

// Placed by hand rather than flown, so every shot at a vantage comes from the
// identical camera and the only difference between them is the cover. Fly mode,
// because walk mode re-clamps y every frame and would fight this. Pitched down,
// because the near ground is where the cover lives - measured horizontally it
// would report almost nothing, which is how the sky work learned this.
async function stand(place) {
  const match = await page.$$eval('#poi-search-list option', (els, want) => {
    const opts = els.map((e) => e.value);
    return opts.find((o) => o.toLowerCase().includes(want.toLowerCase()));
  }, place);
  if (!match) return null;
  // page.fill, not a hand-dispatched 'change': the search listens for input, and a
  // synthetic 'change' alone left the camera where it was - so both vantages
  // measured the spawn and the glacier control "failed" while the code was right.
  await page.fill('#poi-search-input', match);
  await page.waitForTimeout(3000);
  const at = await page.evaluate(() => {
    const { camera, controls, getGroundHeight, groundcover } = window.__pngp;
    controls.mode = 'fly';
    const sample = getGroundHeight();
    const ground = sample ? sample(camera.position.x, camera.position.z) : null;
    if (Number.isFinite(ground)) camera.position.y = ground + 1.7;
    const r = (-22 * Math.PI) / 180;
    camera.lookAt(
      camera.position.x + Math.cos(r) * 1000,
      camera.position.y + Math.sin(r) * 1000,
      camera.position.z,
    );
    camera.updateMatrixWorld(true);
    return { y: camera.position.y, cover: groundcover.coverAt(camera.position.x, camera.position.z) };
  });
  await page.waitForTimeout(3000);
  return at;
}

const VANTAGES = [
  { place: 'Le Pont', expectCover: true },
  { place: 'Gran Paradiso', expectCover: false }, // glaciated summit: the control
];
const readings = {};
for (const v of VANTAGES) {
  const at = await stand(v.place);
  if (!at) { fail(`no POI matches "${v.place}"`); continue; }
  await only('none');
  await page.waitForTimeout(2000);
  const bare = await shot(`${v.place.slice(0, 4)}-none`);
  await page.waitForTimeout(1500);
  const floor = changed(bare, await shot(`${v.place.slice(0, 4)}-none-b`));
  const layers = {};
  for (const kind of ['grass', 'shrub']) {
    await only(kind);
    await page.waitForTimeout(2500);
    const img = await shot(`${v.place.slice(0, 4)}-${kind}`);
    layers[kind] = { moved: changed(bare, img), luma: meanLuma(img) };
  }
  readings[v.place] = { at, floor, layers, bareLuma: meanLuma(bare) };
}

const valley = readings['Le Pont'];
const summit = readings['Gran Paradiso'];
if (valley) {
  check(valley.floor < 0.005,
    `the scene is still between shots (noise floor ${(valley.floor * 100).toFixed(2)}%), so a difference means the cover`);
  check(valley.layers.grass.moved > 0.02,
    `grass is drawn where the mask says ${valley.at.cover.toFixed(2)} of the pixel is vegetated ` +
    `(${(valley.layers.grass.moved * 100).toFixed(2)}% of the near ground changed)`);
  check(valley.layers.shrub.moved > 0.003,
    `dwarf shrub is drawn there too (${(valley.layers.shrub.moved * 100).toFixed(2)}%)`);
  // Plants are darker than the soil and stone they stand on, under this sun. When
  // this was false, the shrubs read as glowing green slabs.
  check(valley.layers.grass.luma < valley.bareLuma && valley.layers.shrub.luma < valley.bareLuma,
    `both layers are darker than the bare ground they stand on ` +
    `(${valley.bareLuma.toFixed(3)} -> grass ${valley.layers.grass.luma.toFixed(3)}, shrub ${valley.layers.shrub.luma.toFixed(3)})`);
}
if (summit) {
  check(summit.at.cover < 0.01, `the mask says nothing grows on the glacier (${summit.at.cover.toFixed(3)})`);
  check(summit.layers.grass.moved < 0.005 && summit.layers.shrub.moved < 0.005,
    `and nothing is drawn there (grass ${(summit.layers.grass.moved * 100).toFixed(2)}%, ` +
    `shrub ${(summit.layers.shrub.moved * 100).toFixed(2)}%) - the mask is really being read`);
}

// The density knob: it must move the instance count AND the pixels, in the same
// direction, or it is a control over nothing.
await stand('Le Pont');
await page.evaluate(() => { for (const l of window.__pngp.groundcover.getLayers()) l.mesh.visible = true; });
const steps = [];
for (const d of [0, 0.5, 1]) {
  await page.evaluate((d) => {
    window.__pngp.groundcover.density.value = d;
    window.__pngp.groundcover.apply();
  }, d);
  await page.waitForTimeout(2200);
  const counts = await page.evaluate(() => window.__pngp.groundcover.counts());
  steps.push({ d, counts, img: await shot(`density-${d}`) });
}
check(steps[0].counts.every((c) => c.drawn === 0) && steps[2].counts.every((c) => c.drawn === c.of),
  'the knob reaches the geometry: 0 draws nothing, 1 draws every instance');
const half = steps[1].counts[0];
check(Math.abs(half.drawn / half.of - 0.5) < 0.02,
  `halfway draws about half the instances (${half.drawn.toLocaleString()} of ${half.of.toLocaleString()})`);
const movedHalf = changed(steps[0].img, steps[1].img);
const movedFull = changed(steps[0].img, steps[2].img);
check(movedFull > movedHalf && movedHalf > 0.005,
  `and it reaches the screen, monotonically (${(movedHalf * 100).toFixed(2)}% -> ${(movedFull * 100).toFixed(2)}%)`);

// Snow buries the grass. The point is that it uses snow.js's own snowCover(), so
// the tufts vanish under exactly the snow the ground is drawn with.
//
// The level is pinned by REPLACING the holder's accessor, not by assigning to it:
// main.js writes SNOW_LEVEL.value = weather.mod.snow every single frame, so a plain
// assignment survives for one frame and is then overwritten. That is why the first
// run of this check measured a 3.47% flicker and an unchanged luma.
await only('grass');
await page.waitForTimeout(2000);
const snowFree = await shot('snow-0');
await pinValue(page, 'snowLevel', 1);
await page.waitForTimeout(2500);
const snowDeep = await shot('snow-1');
await unpinValue(page, 'snowLevel', 0);
const buried = changed(snowFree, snowDeep);
check(buried > 0.05, `settled snow changes the ground cover (${(buried * 100).toFixed(2)}% of pixels)`);
check(meanLuma(snowDeep) > meanLuma(snowFree),
  `and it is snow doing it, not darkness (luma ${meanLuma(snowFree).toFixed(3)} -> ${meanLuma(snowDeep).toFixed(3)})`);

// Wind. The travelling wave is driven by the weather's own wind value, so calm must
// stop the motion and a gale must increase it.
//
// The animals and the birds are hidden first: they are the other things in this
// frame that move by themselves, and at 10-14% of the crop they drown the signal
// completely.
await page.evaluate(() => {
  const w = window.__pngp.getWildlife();
  const b = window.__pngp.getBirds();
  if (w?.object) w.object.visible = false;
  if (b?.object) b.object.visible = false;
});
await page.waitForTimeout(1500);
const windMoves = {};
for (const w of [0, 1]) {
  await pinValue(page, 'groundcover.wind', w);
  await page.waitForTimeout(1200);
  const a = await shot(`wind-${w}-a`);
  await page.waitForTimeout(1600);
  windMoves[w] = changed(a, await shot(`wind-${w}-b`));
}
await unpinValue(page, 'groundcover.wind', 0);
check(windMoves[0] < 0.01,
  `with the wind pinned to calm the grass is still (${(windMoves[0] * 100).toFixed(2)}% of pixels moved)`);
check(windMoves[1] > windMoves[0] * 3,
  `and it bends in a gale (${(windMoves[0] * 100).toFixed(2)}% -> ${(windMoves[1] * 100).toFixed(2)}%)`);

// Edelweiss. The claim being tested is the one the design rests on: the HUD and
// the geometry agree about one specific flower, because one piece of code decides
// where it is.
const flower = await page.evaluate(() => {
  const { edelweiss, camera } = window.__pngp;
  const a = edelweiss.nearest(camera.position.x, camera.position.z, 20);
  const b = edelweiss.nearest(camera.position.x, camera.position.z, 20);
  return a && b ? { a, same: a.key === b.key && a.x === b.x && a.z === b.z } : null;
});
if (!flower) {
  fail('no edelweiss patch within 20 cells of the spawn - the habitat test may be too narrow');
} else {
  check(flower.same, 'a patch is deterministic: asked twice, the same cell and the same position');
  check(flower.a.elevM >= ELEV_MIN_M && flower.a.elevM <= ELEV_MAX_M,
    `it grows inside the habitat window (${Math.round(flower.a.elevM)} m, allowed ${ELEV_MIN_M}-${ELEV_MAX_M})`);
  check(flower.a.flowers.length >= 3, `a patch is a patch, not one flower (${flower.a.flowers.length})`);

  const seen = await page.evaluate(({ x, z }) => {
    const { camera, controls, getGroundHeight } = window.__pngp;
    controls.mode = 'fly';
    const sample = getGroundHeight();
    camera.position.set(x - 3, (sample ? sample(x - 3, z) : 0) + 1.6, z);
    camera.lookAt(x, sample ? sample(x, z) : 0, z);
    camera.updateMatrixWorld(true);
    return true;
  }, flower.a);
  if (seen) {
    await page.waitForTimeout(3000);
    const diag = await page.evaluate(() => window.__pngp.edelweiss.getDiag());
    check(diag.drawn > 0, `standing 3 m away, ${diag.drawn} rosettes are actually drawn`);
    check(diag.nearestM !== null && diag.nearestM < 5,
      `the readout agrees with where the geometry was put (${diag.nearestM?.toFixed(1)} m)`);
    check(diag.foundCount >= 1 && diag.nearestM <= FOUND_RADIUS_M,
      `and coming within ${FOUND_RADIUS_M} m counts as found (${diag.foundCount})`);
    // The habitat test has to reject as well as accept, or it is not a test.
    const rejected = await page.evaluate(() => {
      const { edelweiss, getGroundHeight } = window.__pngp;
      const sample = getGroundHeight();
      let tested = 0;
      let held = 0;
      for (let ix = -60; ix < 60; ix += 3) {
        for (let iz = -60; iz < 60; iz += 3) {
          tested++;
          if (edelweiss.nearest(ix * 320, iz * 320, 0)) held++;
        }
      }
      return { tested, held, hasSampler: !!sample };
    });
    check(rejected.held < rejected.tested * 0.35,
      `most cells hold nothing (${rejected.held} of ${rejected.tested}) - a rarity, not a lawn of edelweiss`);
    check(rejected.held > 0, 'but some do, so the habitat test is not rejecting everything');
  }
}

await browser.close();
if (pageErrors.length) fail(`${pageErrors.length} console/page error(s): ${pageErrors.slice(0, 3).join(' | ')}`);

console.log(failures
  ? `\n${failures} check(s) failed.`
  : '\nGrass and shrubs grow where the data says, each in its own shader, buried by snow and bent by wind - and the edelweiss is where the HUD says it is.');
process.exit(failures ? 1 : 0);
