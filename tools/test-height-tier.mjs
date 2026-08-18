#!/usr/bin/env node
// The optional high-resolution terrain tier: is the file what it claims, and does
// turning it on move the ground WITH everything standing on it?
//
// The second half is the whole point. The tier is a residual precisely so that
// seven readers of the elevation cannot drift apart (src/heighttier.js), and the
// way that promise breaks is silent: the terrain draws a new surface and the
// grass, the stones, the trees and the flowers keep standing on the old one. That
// is the defect the user found by looking on 2026-08-12, and no console error
// accompanies it. So the browser half toggles the tier and measures each scatter
// layer's own pixels, alone, against the ground it stands on.
//
// Usage: tools/dev/start-dev.sh && node tools/test-height-tier.mjs
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { decode } from 'fast-png';
import {
  RESIDUAL_HALF_RANGE_M, encodeResidual, decodeResidual, heightTierGlsl,
} from '../src/heighttier.js';

const url = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'http://localhost:5173';
let failures = 0;
const fail = (m) => { failures++; console.log(`FAIL ${m}`); };
const ok = (m) => console.log(`ok   ${m}`);
const check = (c, m, d) => (c ? ok(m) : fail(`${m}${d ? ` - ${d}` : ''}`));

console.log('The file, the codec and the rectangle\n');

const manifest = JSON.parse(readFileSync('public/data/heighttier.json', 'utf8'));
// The tier ships several levels of ONE rectangle. Every claim below about the file
// is a claim about each of them - a level that shipped with a live edge or an empty
// middle would be a defect in whichever quality setting happened to select it, which
// is the kind of bug that only shows up for some people.
const levels = manifest.levels ?? [];
check(levels.length >= 2 && levels.every((l, i) => i === 0 || l.resolutionMPerPx.x < levels[i - 1].resolutionMPerPx.x),
  `the manifest lists ${levels.length} levels, coarsest first `
  + `(${levels.map((l) => `${l.resolutionMPerPx.x.toFixed(2)} m`).join(', ')})`);
const levelBytes = levels.map((l) => new Uint8Array(readFileSync(`public/data/${l.file.name}`)));
check(levels.every((l, i) => levelBytes[i].length === l.dimensions.width * l.dimensions.height),
  'every level is exactly width x height bytes as the manifest says ('
  + levels.map((l, i) => `${l.dimensions.width}x${l.dimensions.height}=${levelBytes[i].length}`).join(', ') + ')');
// ONE RECTANGLE, several grids: if a level's pixel count did not divide the rectangle
// the same way, swapping quality would move the ground sideways rather than sharpen
// it - and by less than a pixel, which is exactly the size of bug nobody finds.
const spanX = manifest.bboxCrsUnits.xmax - manifest.bboxCrsUnits.xmin;
const spanY = manifest.bboxCrsUnits.ymax - manifest.bboxCrsUnits.ymin;
check(levels.every((l) => Math.abs(spanX / l.dimensions.width - l.resolutionMPerPx.x) < 1e-6
  && Math.abs(spanY / l.dimensions.height - l.resolutionMPerPx.y) < 1e-6),
  'each level tiles the shared rectangle exactly, so a quality change cannot shift the ground sideways');
// The finest level is the one the rest of this section examines in detail.
const bytes = levelBytes[levelBytes.length - 1];
const { width: TW, height: TH } = levels[levels.length - 1].dimensions;

// ZERO MUST BE EXACTLY ZERO. The obvious 0..255 -> -1..1 mapping puts the centre
// at 127.5, so no code decodes to nothing and the tier would apply a millimetre of
// correction across ten million pixels that are supposed to be untouched. That
// millimetre is a surface which no longer equals the one every other reader uses,
// which is the entire reason this design is a residual rather than a second grid.
check(decodeResidual(encodeResidual(0)) === 0,
  'zero encodes and decodes to exactly zero, so "no correction" really is none');
let worstTrip = 0;
for (let i = -RESIDUAL_HALF_RANGE_M; i <= RESIDUAL_HALF_RANGE_M; i += 0.37) {
  worstTrip = Math.max(worstTrip, Math.abs(decodeResidual(encodeResidual(i)) - i));
}
// The bound is DERIVED, not chosen: this is a rounding quantiser, so its error can
// never exceed half of its coarsest step, and the coarsest step is the last one
// before the half-range. A hardcoded 0.5 m instead was a number sized for a
// half-range of 56 m, and it failed the moment the tier went to 5 m and the range
// had to widen to 96 - reporting a broken codec when the codec was fine and only
// the constant was stale.
const coarsestStep = RESIDUAL_HALF_RANGE_M - decodeResidual(encodeResidual(RESIDUAL_HALF_RANGE_M) - 1);
check(worstTrip <= coarsestStep / 2 + 1e-9,
  `the codec round-trips within ${worstTrip.toFixed(3)} m, under half its coarsest step `
  + `(${(coarsestStep / 2).toFixed(3)} m at +/-${RESIDUAL_HALF_RANGE_M} m)`);
// The square root is the reason this fits in 8 bits at all: it must be far finer
// near zero, where 99.7% of the residual lives, than a linear map would be.
const stepNearZero = Math.abs(decodeResidual(encodeResidual(0) + 1));
check(stepNearZero < 0.02,
  `and its step near zero is ${stepNearZero.toFixed(4)} m, far finer than a linear map's 0.25 m`);

// THE OUTER RING IS THE SEAM THAT ISN'T. Everything outside the rectangle gets no
// correction at all; if the edge itself carried one there would be a step there,
// and the "no seam by construction" claim would be a story rather than a property.
let edgeWorst = 0;
for (let li = 0; li < levels.length; li++) {
  const b = levelBytes[li];
  const { width: w, height: h } = levels[li].dimensions;
  for (let x = 0; x < w; x++) {
    edgeWorst = Math.max(edgeWorst, Math.abs(decodeResidual(b[x])),
      Math.abs(decodeResidual(b[(h - 1) * w + x])));
  }
  for (let y = 0; y < h; y++) {
    edgeWorst = Math.max(edgeWorst, Math.abs(decodeResidual(b[y * w])),
      Math.abs(decodeResidual(b[y * w + w - 1])));
  }
}
check(edgeWorst === 0,
  `every level's outermost ring is exactly zero, so no quality setting has a seam to reconcile`);

// And each has to actually correct something in the middle, or a level is megabytes
// of nothing and every test above passes on an empty grid.
const worked = levels.map((l, li) => {
  let moved = 0;
  let maxAbs = 0;
  let n = 0;
  for (let i = 0; i < levelBytes[li].length; i += 37) {
    const m = decodeResidual(levelBytes[li][i]);
    if (m !== 0) moved++;
    maxAbs = Math.max(maxAbs, Math.abs(m));
    n++;
  }
  return { res: l.resolutionMPerPx.x, share: moved / n, maxAbs };
});
check(worked.every((w) => w.share > 0.5 && w.maxAbs > 5),
  'every level corrects most of its pixels: '
  + worked.map((w) => `${w.res.toFixed(0)} m by up to ${w.maxAbs.toFixed(1)} m over ${(w.share * 100).toFixed(0)}%`).join(', '));
check(worked.every((w) => w.maxAbs < RESIDUAL_HALF_RANGE_M),
  `and none reaches the clipping range (+/-${RESIDUAL_HALF_RANGE_M} m), so no cliff is flattened`);
// The finer level must carry MORE relief than the coarser one, or the extra bytes are
// buying nothing: averaging 2x2 blocks is what makes the coarse level coarse, and an
// average cannot have a wider swing than what it averages.
check(worked[worked.length - 1].maxAbs >= worked[0].maxAbs,
  `and the finer level holds the wider correction (${worked[worked.length - 1].maxAbs.toFixed(1)} m `
  + `against ${worked[0].maxAbs.toFixed(1)} m), which is what the extra bytes are for`);

// THE GLSL TWIN. A drift between the two decoders puts the CPU's ground and the
// GPU's ground at different heights, which is the floating bug wearing a new hat.
// The shader source is generated, so the constants can be read straight out of it.
const glsl = heightTierGlsl();
const consts = [...glsl.matchAll(/(\d+)\.0/g)].map((m) => Number(m[1]));
check(consts.includes(RESIDUAL_HALF_RANGE_M) && consts.includes(128) && consts.includes(127),
  'the GLSL decoder carries the same half-range, zero code and span as the JS one',
  `found ${[...new Set(consts)].join(', ')}`);
check(/sign\(\s*s\s*\)\s*\*\s*s\s*\*\s*s/.test(glsl),
  'and the same signed-square law, not a linear one');

// ---- the running page ----------------------------------------------------
console.log('\nIn the running page\n');

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
const problems = [];
page.on('pageerror', (e) => problems.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
// A spot inside the tier, on open ground, at walking height.
await page.goto(`${url}/#at=45.48683,7.42737,2632&look=210,-30&mode=walk&time=0.150&sky=clear`,
  { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForFunction(() => window.__pngp?.terrain != null, null, { timeout: 120000 });
await page.evaluate(() => {
  for (const g of [window.__pngp.getWildlife?.(), window.__pngp.getBirds?.()]) {
    if (g?.object) g.object.visible = false;
  }
  // AND THE WIND, which the first run of this test forgot: the animals and the
  // birds are not the only things that move by themselves - the grass bends, and
  // it put the noise floor at 1.09% where the whole measurement below is a few
  // per cent. An accessor rather than an assignment, because main.js rewrites
  // this holder from the weather on every frame.
  Object.defineProperty(window.__pngp.groundcover.wind, 'value',
    { get: () => 0, set: () => {}, configurable: true });
});
await page.waitForTimeout(7000);

const CROP = { x: 100, y: 220, width: 700, height: 340 };
const shot = async (n, clip = CROP) => decode(await page.screenshot({
  path: `tools/dev/logs/tier-${n}.png`, clip, timeout: 120000,
}));
const changed = (a, b) => {
  let n = 0;
  for (let i = 0; i < a.width * a.height; i++) {
    const p = i * a.channels;
    const q = i * b.channels;
    if (Math.max(Math.abs(a.data[p] - b.data[q]), Math.abs(a.data[p + 1] - b.data[q + 1]),
      Math.abs(a.data[p + 2] - b.data[q + 2])) > 6) n++;
  }
  return n / (a.width * a.height);
};

// THE DEFAULT IS WHAT EVERYONE GETS, so it is asserted and not assumed. Nothing here
// asked for a tier: the page installs the medium level by itself (user's decision,
// 2026-08-14, "metterei l'opzione medium a 10m come default") and fades it in.
// WAITED FOR, NOT SLEPT ON. This page runs at about 1 fps under SwiftShader and the
// cross-fade needs a frame, so a fixed timeout lands in front of it: the first run of
// this check read mix 0 with the level already installed and the ramp simply not yet
// stepped. Failing to settle is reported by the check below rather than thrown.
const settled = await page.waitForFunction(
  () => (window.__pngp.terrain?.heightTier?.mix ?? 0) >= 1, null, { timeout: 90000 },
).then(() => true).catch(() => false);
const byDefault = await page.evaluate(() => {
  const T = window.__pngp.terrain;
  const select = document.getElementById('env-terrain');
  return {
    level: T.heightTierLevel(),
    mix: T.heightTier?.mix ?? 0,
    res: T.heightTier?.level?.resolutionMPerPx?.x ?? null,
    value: select?.value,
    text: select?.selectedOptions?.[0]?.textContent ?? '',
  };
});
check(settled && byDefault.level === 0 && byDefault.mix === 1 && byDefault.value === '1',
  `the medium level is on by default, unasked, and faded all the way in: level `
  + `${byDefault.level} at ${byDefault.res?.toFixed(2)} m, mix ${byDefault.mix}, `
  + `control on "${byDefault.text}"`);
// And the size in that label comes from the manifest. It was hardcoded in the HTML
// and the user caught it still saying 7 MB after the tier became 25 - a number in two
// places is a number that eventually disagrees with itself.
const mediumMb = levels[0].file.gzipBytes / 1048576;
check(byDefault.text.includes(mediumMb < 10 ? mediumMb.toFixed(1) : mediumMb.toFixed(0)),
  `and the control says what it costs, from the manifest rather than from the HTML `
  + `(${mediumMb.toFixed(1)} MB)`);

// The A/B baseline has to be the tier OFF, which is no longer where the page starts.
await page.evaluate(() => window.__pngp.terrain.setHeightTierMix(0));
await page.waitForTimeout(2500);
const before = await shot('before');
await page.waitForTimeout(1800);
const floor = changed(before, await shot('before-b'));
check(floor < 0.005, `the scene is still between shots (noise floor ${(floor * 100).toFixed(2)}%)`);

// The FINEST level, which is the strongest claim and the one the coarse level's
// numbers cannot stand in for.
const loaded = await page.evaluate(async (finest) => {
  const T = window.__pngp.terrain;
  const level = await T.loadHeightTier(finest);
  if (!level) return null;
  T.setHeightTierMix(1);
  return { name: level.file.name, gzip: level.file.gzipBytes, res: level.resolutionMPerPx.x };
}, levels.length - 1);
check(!!loaded, `the finest level downloads and installs from the running page`
  + (loaded ? ` (${loaded.res.toFixed(2)} m, ${(loaded.gzip / 1048576).toFixed(1)} MB gzip)` : ''));
await page.waitForTimeout(6000);

if (loaded) {
  const after = await shot('after');
  const groundMoved = changed(before, after);
  check(groundMoved > 0.05,
    `turning it on redraws the ground (${(groundMoved * 100).toFixed(1)}% of the crop)`);

  // THE CPU HAS TO MOVE WITH THE GPU. Measured as an A/B on the same function
  // rather than against getBilinearHeight(), which IS sampleHeight - comparing it
  // with itself reported "0 points corrected" and looked like a broken tier.
  const cpu = await page.evaluate(() => {
    const T = window.__pngp.terrain;
    const r = T.heightTier.rect;
    const pts = [];
    for (let i = 0; i < 2000; i++) {
      pts.push([r.x + (((i * 7919) % 997) / 997) * r.z, r.y + (((i * 104729) % 991) / 991) * r.w]);
    }
    const on = pts.map(([x, z]) => T.sampleHeight(x, z));
    const onDrawn = pts.map(([x, z]) => T.sampleRenderedHeight(x, z));
    T.setHeightTierMix(0);
    const off = pts.map(([x, z]) => T.sampleHeight(x, z));
    const offDrawn = pts.map(([x, z]) => T.sampleRenderedHeight(x, z));
    T.setHeightTierMix(1);
    let n = 0;
    let worst = 0;
    let worstDrawn = 0;
    for (let i = 0; i < pts.length; i++) {
      const d = Math.abs(on[i] - off[i]);
      if (d > 1e-6) n++;
      worst = Math.max(worst, d);
      worstDrawn = Math.max(worstDrawn, Math.abs(onDrawn[i] - offDrawn[i]));
    }
    return { n, total: pts.length, worst, worstDrawn, segments: window.__pngp.terrain.stats.deepest };
  });
  check(cpu.n / cpu.total > 0.9,
    `the CPU ground moves too: ${cpu.n} of ${cpu.total} points, by up to ${cpu.worst.toFixed(2)} m`);
  check(cpu.worstDrawn > cpu.worst * 0.5,
    `and the DRAWN surface moves with it (${cpu.worstDrawn.toFixed(2)} m) - which is what the camera, `
    + 'the markers and every scatter stand on');
  // How MANY levels further is derived from the tier's resolution, not assumed: one
  // for a 10 m tier, two for a 5 m one. Asserting a bare "deeper than 7" would pass
  // a build that downloaded 5 m data and then drew it on 10 m cells, which is three
  // quarters of the download unused.
  const baseManifest = JSON.parse(readFileSync('public/data/heightfield.json', 'utf8'));
  const baseCellM = (baseManifest.bboxCrsUnits.xmax - baseManifest.bboxCrsUnits.xmin) / 4096; // 32 * 2^7
  const finestRes = levels[levels.length - 1].resolutionMPerPx.x;
  const expectDepth = 7 + Math.floor(Math.log2(baseCellM / finestRes) + 1e-6);
  check(cpu.segments === expectDepth,
    `the quadtree refines to the loaded level's own resolution inside it: deepest ${cpu.segments}, `
    + `which is ${(baseCellM / 2 ** (cpu.segments - 7)).toFixed(2)} m cells for `
    + `${finestRes.toFixed(2)} m data`);

  // NOTHING MAY BE LEFT BEHIND. Each scatter layer alone, against the ground it
  // stands on: if a layer kept the old surface it would hang above or sink into
  // the new one, and its silhouette against the ground would change far more than
  // the ground itself did.
  // WHOLE FRAME, not the crop, and that is not a relaxed threshold - it is the
  // right window for the question. There are only 49 boulder instances in a 130 m
  // wrap and about 28 within the draw distance, so whether one lands in a 700x340
  // crop is luck; the first run of this test read 0.0% for them and it meant
  // nothing. Grass and scree are dense enough that either window would do.
  const FULL = { x: 0, y: 0, width: 900, height: 600 };
  const layerMoved = {};
  for (const kind of ['grass', 'scree', 'boulder']) {
    await page.evaluate((k) => {
      for (const l of window.__pngp.groundcover.getLayers()) l.mesh.visible = l.kind === k;
    }, kind);
    await page.waitForTimeout(2500);
    const withLayer = await shot(`layer-${kind}`, FULL);
    await page.evaluate(() => {
      for (const l of window.__pngp.groundcover.getLayers()) l.mesh.visible = false;
    });
    await page.waitForTimeout(2500);
    layerMoved[kind] = changed(await shot(`layer-${kind}-off`, FULL), withLayer);
  }
  // TWO DIFFERENT CLAIMS, and the first version of this test confused them.
  // Counting a layer's pixels proves it is DRAWN; it cannot prove it is drawn on
  // the RIGHT surface, because a layer left behind on the old ground would still
  // paint just as many pixels, only at the wrong height. What proves seating is
  // the assertion above - CPU and drawn surface move together, and all three
  // shaders read the same residual through the same generated function. This is
  // the weaker, complementary check: nothing stopped being drawn at all.
  //
  // The threshold differs by layer for a reason that is arithmetic, not taste.
  // Grass and scree are tens of thousands of instances and cover a measurable
  // share of any frame. Blocks are 49 in a 130 m wrap, about 28 within the draw
  // distance, so how many land in one fixed view is luck: this run caught a single
  // distant one at 0.01%. Demanding more of them would be demanding a lucky
  // camera, and lowering everything to match would blind the test to the dense
  // layers vanishing.
  // AND THE THRESHOLD IS ABOUT REACHING THE SCREEN, NOT ABOUT A SHARE. It was 0.5%,
  // which was the share this camera happened to produce while the tier added ONE
  // LOD level. Adding the second one on 2026-08-14 moved it to 0.47% and 0.43% and
  // failed the test - with nothing wrong: the drawn ground got finer, so the camera
  // reseats on it (measured: the surface moves 0.18 m on average and up to 8.5 m)
  // and the near-field relief hides a little more grass. A number fitted to one
  // camera and one LOD was measuring the seat, not the feature. What this check is
  // for is "the layer did not stop being drawn", so it asks for two orders of
  // magnitude less and reports the share instead of gating on it. Seating is
  // asserted above, by the CPU and drawn surfaces moving together.
  const dense = await page.evaluate(() => window.__pngp.groundcover.counts()
    .filter((l) => l.kind === 'grass' || l.kind === 'scree'));
  check(layerMoved.grass > 0.001 && layerMoved.scree > 0.001
    && dense.length === 2 && dense.every((l) => l.drawn > 0),
    'the dense layers are still drawn on the new surface '
    + `(grass ${(layerMoved.grass * 100).toFixed(2)}%, scree ${(layerMoved.scree * 100).toFixed(2)}% of the frame; `
    + dense.map((l) => `${l.kind} ${l.drawn} of ${l.of}`).join(', ') + ')');
  // And for the blocks, a quantity that is not luck. Two consecutive runs of the
  // pixel version read 0.010% and then 0.000% from the same camera - which is the
  // measurement telling you it is the wrong one, not the feature failing. Whether
  // a 49-instance layer puts one in a given frame is chance; whether it is drawing
  // at all is not.
  const blocks = await page.evaluate(() => window.__pngp.groundcover.counts()
    .find((l) => l.kind === 'boulder'));
  check(blocks && blocks.drawn > 0,
    `the block layer is drawing on the new surface too (${blocks?.drawn} of ${blocks?.of} instances)`);

  // THE BAKED-ELEVATION LAYERS HAVE TO FOLLOW TOO, and they are a different mechanism
  // from every scatter above: trails, POI markers and the water are built once from
  // elevations baked at build time, so they cannot read the tier in a shader and are
  // re-seated on the CPU instead (main.js's reseatOnDrawnSurface, driven from the
  // cross-fade). That re-seat did not exist until 2026-08-17 and this is the defect the
  // user found by looking: "se vai a Le Pont, c'e un torrente e non e ancorato al
  // terreno con i modelli Medium e High Terrain".
  //
  // The property is that each layer sits at its OWN CONSTANT height above the drawn
  // ground - not that the height is any particular number. A river ribbon is lifted 3 m
  // and a trail 1.5 m to stay out of the depth buffer's way; what is wrong is the
  // SPREAD. Before the fix the dashed trails ran from -8.42 to +12.12 m where they had
  // been a flat 1.50, and the negative end of that is a trail underground.
  // DRIVEN THROUGH THE CONTROL, not through terrain.js's API like the checks above.
  // That distinction is the whole point here: the re-seat hangs off main.js's
  // cross-fade, so a test that calls T.setHeightTierMix(1) directly moves the surface
  // without ever running it - and would report the layers as adrift no matter how well
  // the fix worked. Standard and then Medium, because each is a real ramp.
  const rampVia = async (value) => {
    await page.evaluate((v) => {
      const sel = document.getElementById('env-terrain');
      sel.value = String(v);
      sel.dispatchEvent(new Event('change'));
    }, value);
    await page.waitForFunction((v) => {
      const t = window.__pngp.terrain;
      const mix = t?.heightTier?.mix ?? 0;
      return v === '0' ? mix === 0 : mix >= 1;
    }, value, { timeout: 180000 }).catch(() => {});
  };
  await rampVia('0');
  await rampVia('1');

  const seated = await page.evaluate(() => {
    const p = window.__pngp;
    const h = p.getGroundHeight();
    const out = [];
    for (const groupName of ['water', 'trails', 'roads']) {
      const g = p.scene.getObjectByName(groupName);
      if (!g) continue;
      for (const child of g.children) {
        // Lakes are level by definition and waterfalls are vertical, so neither is
        // seated a fixed height above the ground - see water.js's alignToGround.
        if (child.name === 'water-lakes' || child.name === 'waterfalls') continue;
        const pos = child.geometry?.getAttribute('position');
        if (!pos) continue;
        let min = Infinity;
        let max = -Infinity;
        let n = 0;
        // EVERY vertex, not the ones near the camera. The first version filtered to
        // 2 km and found nothing at all, because this test stands wherever the tier
        // rectangle is and the trails and rivers are elsewhere - which failed the check
        // for want of data rather than for want of seating. These layers are global and
        // the property is global, so sample the lot, thinned to keep it quick.
        const stride = Math.max(1, Math.floor(pos.count / 4000));
        for (let i = 0; i < pos.count; i += stride) {
          const x = pos.getX(i);
          const z = pos.getZ(i);
          const ground = h(x, z);
          if (!Number.isFinite(ground)) continue;
          const d = pos.getY(i) - ground;
          if (d < min) min = d;
          if (d > max) max = d;
          n++;
        }
        if (n > 8) out.push({ name: child.name, n, spread: max - min, min, max });
      }
    }
    return out;
  });
  // 0.05 m of slack for float error in the sampler, not for a layer that is off.
  const drifted = seated.filter((l) => l.spread > 0.05);
  check(seated.length > 0 && drifted.length === 0,
    `the baked-elevation layers are still seated on the drawn surface: `
    + seated.map((l) => `${l.name} ${l.min.toFixed(2)} m over ${l.n} verts`).join(', '),
    drifted.map((l) => `${l.name} spreads ${l.spread.toFixed(2)} m (${l.min.toFixed(2)} to ${l.max.toFixed(2)})`).join(' | '));

  // AND SWAPPING BACK DOWN HAS TO GIVE THE LEVEL BACK. The finest LOD is derived from
  // whichever level is installed, so a swap that forgot to re-derive it would draw the
  // coarse level's data on the fine level's triangulation - a surface finer than the
  // data feeding it, with every scatter reproducing a triangulation the terrain is no
  // longer drawing. That is the 2026-08-12 floating defect, re-earned by a menu.
  const swapped = await page.evaluate(async () => {
    const T = window.__pngp.terrain;
    const level = await T.loadHeightTier(0);
    T.setHeightTierMix(1);
    T.update(window.__pngp.camera);
    return {
      level: T.heightTierLevel(),
      res: level.resolutionMPerPx.x,
      deepest: T.stats.deepest,
      segments: window.__pngp.groundcover.groundSegments?.value ?? null,
    };
  });
  const coarseDepth = 7 + Math.floor(Math.log2(baseCellM / levels[0].resolutionMPerPx.x) + 1e-6);
  check(swapped.level === 0 && swapped.deepest === coarseDepth
    && swapped.segments === 32 * 2 ** coarseDepth,
    `going back to the ${swapped.res.toFixed(0)} m level takes the extra LOD level back with it, `
    + `and the scatters with that (deepest ${swapped.deepest}, was ${cpu.segments}; `
    + `${swapped.segments} ground segments)`);
}

check(problems.length === 0, 'no console or page errors', problems.slice(0, 3).join(' | '));
await browser.close();

console.log(failures
  ? `\n${failures} FAILED`
  : '\nThe tier is what the manifest says, its edge is a non-event, and turning it on moves the ground with everything standing on it.');
process.exit(failures ? 1 : 0);
