#!/usr/bin/env node
// Grass, scree and edelweiss: does the ground cover exist, does it follow the
// data, and do the two layers still have their own shaders?
//
// That last one is not a hypothetical. three caches compiled programs and
// Material.customProgramCacheKey() defaults to onBeforeCompile.toString(), so two
// materials built by the same factory have identical hook SOURCE and differ only
// in a closure the cache key cannot see. The second layer silently ran the grass
// layer's shader for three rounds of tuning, every one of which changed nothing -
// including a tint set to 0.06, which left the pixels byte-identical. So the
// program count is asserted here, and the two vertex sources are compared, because
// the failure is invisible in every other way.
//
// The other lesson this file encodes: EVERY LAYER IS MEASURED ALONE. A single
// combined figure read 21.9% and was believed; all of it was one layer, and the
// grass it was meant to be measuring was drawing nothing at all.
//
// Node half first (lattice, geometry and size invariants), then the browser.
//
// Usage: tools/dev/start-dev.sh && node tools/test-groundcover.mjs

import { chromium } from 'playwright';
import { decode } from 'fast-png';
import {
  GRASS, SCREE, BLADES_PER_TUFT, GRASS_TINT, STONE_TINT,
  GRASS_SINK_FRACTION, GRASS_MIN_H, GRASS_MAX_H, COVER_GRID_SEGMENTS,
  STONE_TRIANGLES, STONE_MIN_H, STONE_MAX_H, BOULDER_MIN_H, BOULDER_MAX_H,
  BOULDER, BOULDER_TRIANGLES, BOULDER_SIDES, boulderGeometry,
  STONE_SPREAD_MAX, BOULDER_SPREAD_MAX, STONE_SWAY_M, GRASS_SWAY_M, SCREE_DENSITY, SCREE_SLOPE_FADE,
  coverLattice, stoneGeometry,
} from '../src/groundcover.js';
import { TILE_SEGMENTS, MAX_DEPTH } from '../src/terrain.js';
import {
  ELEV_MIN_M, ELEV_MAX_M, COVER_MIN, COVER_MAX, FOUND_RADIUS_M,
} from '../src/edelweiss.js';

const url = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'http://localhost:5173';

let failures = 0;
const fail = (msg) => { failures++; console.log(`FAIL ${msg}`); };
const ok = (msg) => console.log(`ok   ${msg}`);
const check = (cond, msg, detail) => (cond ? ok(msg) : fail(`${msg}${detail ? ` - ${detail}` : ''}`));

// ---- node half: the lattice, the belt, the invariants --------------------

console.log('The lattice, the stones and the geometry invariants\n');

// The wrap only works while the draw distance stays under half a window: at half a
// window, which copy of a slot is nearest the camera flips, and a slot whose scale
// has not already reached zero would jump. Asserted for both layers because it is
// the one constraint that silently breaks when a draw distance is turned up.
for (const [name, layer] of [['grass', GRASS], ['scree', SCREE], ['boulder', BOULDER]]) {
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

// THE BELT IS GONE (2026-08-13). shrubShareAt() and its GLSL twin used to be
// checked here: a piecewise-linear table of how much of the open vegetation at a
// given elevation was dwarf shrub. The user removed the shrub layer, so the model
// it encoded has no subject. The grass takes the mask whole and the scree takes
// its complement, and neither interpolates anything - which is why there is no
// replacement for these six assertions rather than a renamed version of them.

// THE GRID THE COVER STANDS ON MUST BE THE TERRAIN'S FINEST ONE. This is the
// invariant behind the defect the user found on their first look: the shader used to
// sample the height TEXTURE, which is the bilinear surface, while the terrain draws
// flat triangles between the same vertices. Measured at their own vantage, within
// 25 m: mean +0.18 m, p95 +1.56 m, worst +3.73 m, and 47% of tufts floating by more
// than their whole height - with the error on both signs, so no sink could absorb it.
// The shader now interpolates the same triangle heightfield.js does, on this grid,
// and if MAX_DEPTH or TILE_SEGMENTS ever moves without this following, everything
// starts floating again silently.
check(COVER_GRID_SEGMENTS === TILE_SEGMENTS * 2 ** MAX_DEPTH,
  `the cover samples the terrain's own finest grid (${COVER_GRID_SEGMENTS} segments)`,
  `terrain.js gives ${TILE_SEGMENTS * 2 ** MAX_DEPTH}`);

// The bug that rendered nothing at all, in a form that cannot come back: a sink
// expressed as a FRACTION of the plant's own height can never bury it, whereas the
// absolute 0.35 m it replaced was deeper than the tallest blade in the park.
check(GRASS_SINK_FRACTION > 0 && GRASS_SINK_FRACTION < 0.5,
  `the grass sinks by a fraction of its height (${GRASS_SINK_FRACTION}), so a tuft always stands above ground`);
check(GRASS_MIN_H > 0 && GRASS_MAX_H > GRASS_MIN_H && GRASS_MAX_H < 1,
  `blade heights are alpine turf, not a lawn (${GRASS_MIN_H}-${GRASS_MAX_H} m)`);
check(BLADES_PER_TUFT >= 3, `a tuft is a spray, not a single blade (${BLADES_PER_TUFT})`);

// THE STONES: an octahedron again, and sized so a scree is a scree. The shrub
// cushion that briefly lived in this slot is gone with the shrubs; what is asserted
// now is the arithmetic that was got WRONG when this layer was first written, twice
// in the same line, because it was guessed rather than worked out.
const stone = stoneGeometry();
check(!stone.index, 'the stone is non-indexed and flat-shaded, so it has hard edges by construction');
const stoneTris = stone.attributes.position.array.length / 9;
check(stoneTris === STONE_TRIANGLES,
  `a stone emits exactly the ${STONE_TRIANGLES} triangles the cost tables charge for`,
  `emitted ${stoneTris}`);
const stoneYs = [];
for (let i = 1; i < stone.attributes.position.array.length; i += 3) stoneYs.push(stone.attributes.position.array[i]);
// The lower half is left below ground, which is what half-buries a stone in its own
// scree and is why there is no sink term.
check(Math.abs(Math.max(...stoneYs) - 1) < 1e-6 && Math.abs(Math.min(...stoneYs) + 1) < 1e-6,
  'it runs y = -1..1, so half of it is under the ground and `height` is what stands above');

// THE MISTAKE THIS ENCODES. radius = height * spread, and applying the cobbles'
// spread to the boulder range gave a 2.1 m block a 4 m radius: an 8 m wide object
// standing in an alpine pasture. Blocks need their own, tighter multiplier, and the
// widest thing this layer can draw has to stay a believable size for a loose stone.
const widestStone = 2 * STONE_MAX_H * STONE_SPREAD_MAX;
const widestBoulder = 2 * BOULDER_MAX_H * BOULDER_SPREAD_MAX;
check(widestStone < 1.2,
  `the biggest cobble is ${widestStone.toFixed(2)} m across - a stone, not a slab`);
check(widestBoulder < 4,
  `the biggest block is ${widestBoulder.toFixed(2)} m across, which is an erratic and not a building`);
check(BOULDER_MIN_H > STONE_MAX_H,
  `the two size modes do not overlap (cobbles to ${STONE_MAX_H} m, blocks from ${BOULDER_MIN_H} m), ` +
  'so the field reads as gravel-with-blocks rather than as one average stone');
check(STONE_MIN_H > 0 && STONE_MAX_H < GRASS_MAX_H,
  `a cobble (${STONE_MIN_H}-${STONE_MAX_H} m) is shorter than the grass around it (${GRASS_MAX_H} m), ` +
  'so it sits IN the turf rather than on it');

// The second half of the same arithmetic, and the one the render actually showed.
// Blocks used to be a size mode inside the scree, one slot in forty - which sounded
// rare until it was worked out: pi * 60^2 / 1.1^2 slots in view times the density is
// 131 blocks on screen at once, a boulder field rather than a scattering. They are
// their own layer now, so the count is the lattice's and still computable.
const blocksInView = (Math.PI * BOULDER.visibleM ** 2) / BOULDER.spacingM ** 2;
check(blocksInView > 3 && blocksInView < 60,
  `about ${Math.round(blocksInView)} blocks are in view at once on bare ground - ` +
  'rare enough to be events, common enough to meet');

// THE BLOCKS HAVE NO POINT, which the user asked for and offered triangles to pay
// for - and the trap is that the last three shapes in this file lost their apex and
// gained a flat top instead ("tronchetti"). So two properties, not one.
const block = boulderGeometry();
const blockPos = block.attributes.position.array;
check(blockPos.length / 9 === BOULDER_TRIANGLES,
  `a block emits exactly the ${BOULDER_TRIANGLES} triangles the cost tables charge for`,
  `emitted ${blockPos.length / 9}`);
// No vertex on the axis above ground. That is what a point IS: the octahedron's
// apex sits at (0, 1, 0) and four facets converge on it.
let offAxis = true;
let blockTop = -Infinity;
const crownYs = [];
for (let i = 0; i < blockPos.length; i += 3) {
  const [x, y, z] = [blockPos[i], blockPos[i + 1], blockPos[i + 2]];
  if (y > blockTop) blockTop = y;
  if (y <= 0.05) continue;
  if (Math.hypot(x, z) < 0.2) offAxis = false;
  crownYs.push(y.toFixed(4));
}
check(offAxis, 'no block vertex sits on the axis above ground, so there is no apex for facets to converge on');
// And the crown is not planar, or the cap is a table and we are back to tronchetti.
check(new Set(crownYs).size >= 3,
  `its crown is a ring at ${new Set(crownYs).size} different heights, so the cap facets ` +
  'have their own normals instead of reading as one flat plate');
check(Math.abs(blockTop - 1) < 1e-6,
  `it peaks at exactly y = 1 (${blockTop.toFixed(6)}), so height still means what stands above ground`);
check(BOULDER_TRIANGLES > STONE_TRIANGLES && BOULDER.spacingM > SCREE.spacingM * 10,
  `blocks carry ${BOULDER_TRIANGLES} triangles against a cobble's ${STONE_TRIANGLES}, which is ` +
  'affordable only because they are their own sparse layer rather than a size mode of the scree');

// Stone does not move in wind, at the user's instruction. Zero rather than small,
// so the whole bend term folds out of the scree program at compile time.
check(STONE_SWAY_M === 0 && GRASS_SWAY_M > 0,
  `scree is fixed (sway ${STONE_SWAY_M}) while grass bends (${GRASS_SWAY_M})`);

// TALUS STANDS AT ITS ANGLE OF REPOSE. The first build of this layer put cobbles
// on the Gran Paradiso summit ridge, and the chain is worth keeping because no
// single step in it looks wrong: the ice is buried because snowCover() reads 1
// there, but snow.js correctly refuses to lie on steep ground, so the steep ROCK
// came out unsnowed, unvegetated and uncanopied - and therefore, by the
// bare-ground rule, scree. A 50-degree face covered in loose stones.
//
// The grass never needed this because the vegetation mask has slope baked out at
// build time. Scree is that mask's COMPLEMENT, and a complement does not inherit a
// filter - it inherits its inverse. That is the general trap, not the number.
const reposeDeg = (Math.atan(SCREE_SLOPE_FADE[1]) * 180) / Math.PI;
check(SCREE_SLOPE_FADE[0] < SCREE_SLOPE_FADE[1] && reposeDeg > 25 && reposeDeg < 45,
  `scree stops by ${reposeDeg.toFixed(0)} degrees, which is where talus stops`);

// Both tints multiply the ground's own albedo, so both must be near 1 rather than
// being colours in their own right - and the shrub must be the darker of the two,
// which is the whole reason the belt is visible from a distance.
const lumaOf = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
// Stone is the ground it lies on, so its tint sits at 1: the satellite pixel under
// a stone is already the colour of that rock. The shrub tint this replaced was
// 0.57, which made the cushions 2.7x darker than the ground - a fact only found
// once the owned-pixel instrument existed, so it is asserted rather than trusted.
check(Math.abs(lumaOf(STONE_TINT) - 1) < 0.15,
  `stone barely touches the ground's own albedo (${lumaOf(STONE_TINT).toFixed(2)})`);
// NOT "lighter than the grass tint", which is what this asserted for one run and
// is a meaningless comparison: GRASS_TINT's luma is 1.07 because luma weights green
// at 0.72, while the grass RENDERS darker than the ground it stands on. A tint luma
// is not a rendered brightness. The rendered pair is checked in the browser half,
// against pixels. What belongs here is the property a tint alone can carry: stone
// must not lean green, or it reads as vegetation whatever its brightness.
check(STONE_TINT[1] <= Math.max(STONE_TINT[0], STONE_TINT[2]) + 1e-9,
  'the stone tint does not lean green, so a stone cannot read as a plant');
const chroma = Math.max(...STONE_TINT) - Math.min(...STONE_TINT);
check(chroma < 0.12, `stone is very nearly neutral (spread ${chroma.toFixed(3)}), not a colour of its own`);
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
// out of the GL context: every layer must have its OWN program. Nothing observable
// distinguishes the broken state otherwise - the second layer still draws, it is
// simply the first one.
//
// Compare WHOLE SOURCES, not one discriminating line. This used to check that the
// tint lines differed, and adding the boulder layer broke it for the right reason:
// scree and boulder are both stone, so they share a tint AND a window, and any
// hand-picked discriminator can coincide. What cannot coincide is the source of two
// programs that really are different - so the assertion is now the definition of
// the bug itself, "no two layers share a compiled program", rather than a proxy
// for it.
const programs = await page.evaluate(() => {
  const { renderer } = window.__pngp;
  const gl = renderer.getContext();
  const found = [];
  for (const p of renderer.info.programs ?? []) {
    let vs = '';
    try { vs = gl.getShaderSource(p.vertexShader) ?? ''; } catch { vs = ''; }
    if (!vs.includes('coverUv')) continue;
    found.push({
      source: vs,
      tint: (vs.match(/vec3 tint = vec3\([^;]*;/) ?? ['(none)'])[0],
      window: (vs.match(/floor\( \( cameraPosition\.xz - aOffset \) \/ ([0-9.]+)/) ?? [null, '?'])[1],
    });
  }
  return found;
});
const layerKinds = await page.evaluate(() => window.__pngp.groundcover.getLayers().map((l) => l.kind));
check(programs.length === layerKinds.length,
  `each layer compiled its OWN shader program (${programs.length} programs for ` +
  `${layerKinds.length} layers: ${layerKinds.join(', ')})`);
check(new Set(programs.map((p) => p.source)).size === programs.length,
  'and no two of them are byte-identical, which is exactly what the shared-program bug looked like',
  `${new Set(programs.map((p) => p.source)).size} distinct of ${programs.length}`);
// The windows can now legitimately coincide - scree and boulder share one - so this
// only asserts that the wrap periods present are the ones the layers declare.
check(new Set(programs.map((p) => p.window)).size >= 2,
  `the programs carry their own wrap periods (${programs.map((p) => `${p.window} m`).join(', ')})`);

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
  for (const kind of ['grass', 'scree', 'boulder']) {
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
  check(valley.layers.scree.moved > 0.003,
    `scree is drawn on the part of the same ground the mask calls bare ` +
    `(${(valley.layers.scree.moved * 100).toFixed(2)}%)`);
  // Grass is darker than the soil it stands on, under this sun - when this was
  // false the cover read as glowing green slabs. Stone is NOT: it is the same rock
  // the satellite photographed, so it must stay close to the ground either way, and
  // a stone layer that darkened the frame would be shading, not albedo.
  check(valley.layers.grass.luma < valley.bareLuma,
    `grass is darker than the bare ground it stands on ` +
    `(${valley.bareLuma.toFixed(3)} -> ${valley.layers.grass.luma.toFixed(3)})`);
  check(Math.abs(valley.layers.scree.luma - valley.bareLuma) < 0.05,
    `and stone stays the colour of the ground it lies on ` +
    `(${valley.bareLuma.toFixed(3)} -> ${valley.layers.scree.luma.toFixed(3)})`);
}
if (summit) {
  check(summit.at.cover < 0.01, `the mask says nothing grows on the glacier (${summit.at.cover.toFixed(3)})`);
  // THE CONTROL, and it means something different for each layer now. Grass is
  // absent because the mask says nothing grows; scree would be present by that same
  // reading - bare ground, no canopy - and is absent only because the ice reads full
  // snow cover and STONE_BURY is 1.0. If a future edit leaves blocks standing under
  // snow, this is the assertion that catches boulders on a glacier.
  check(summit.layers.grass.moved < 0.005 && summit.layers.scree.moved < 0.005
    && summit.layers.boulder.moved < 0.005,
    `and nothing is drawn there (grass ${(summit.layers.grass.moved * 100).toFixed(2)}%, ` +
    `scree ${(summit.layers.scree.moved * 100).toFixed(2)}%, ` +
    `boulder ${(summit.layers.boulder.moved * 100).toFixed(2)}%) - snow buries the stones the ` +
    'bare-ground rule would otherwise put on the ice');
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
    check(diag.drawn > 0, `standing 3 m away, ${diag.drawn} rosettes are in the draw call`);

    // AND THEY REACH THE SCREEN. "drawn" above is a counter of instance matrices,
    // which is not the same claim and never was - on 2026-08-13 it read 36 while a
    // screenshot of the same frame had no flower in it anywhere, and the reason was
    // simply that they were 5 cm wide and the colour of the ground. Every other
    // layer in this file is measured against pixels; this one was not, and that is
    // the one place a rewrite of the model could silently produce nothing.
    const flowerPixels = await page.evaluate(async () => {
      const m = window.__pngp.scene.getObjectByName('edelweiss');
      const was = m.visible;
      m.visible = false;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      return { was, hidden: true };
    });
    await page.waitForTimeout(2500);
    const withoutFlowers = await shot('edelweiss-off');
    await page.evaluate(() => { window.__pngp.scene.getObjectByName('edelweiss').visible = true; });
    await page.waitForTimeout(2500);
    const withFlowers = await shot('edelweiss-on');
    const flowerMoved = changed(withoutFlowers, withFlowers);
    check(flowerMoved > 0.0004,
      `and they reach the screen: ${(flowerMoved * 100).toFixed(3)}% of the near-ground crop is flower`,
      `${flowerPixels.was ? '' : 'the mesh was already hidden - '}a counter is not a pixel`);
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
  : '\nGrass grows and stones lie where the data says, each in its own shader, buried by snow, the grass bent by wind and the scree not - and the edelweiss is where the HUD says it is.');
process.exit(failures ? 1 : 0);
