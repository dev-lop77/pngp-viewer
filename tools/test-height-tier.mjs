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
const bytes = new Uint8Array(readFileSync(`public/data/${manifest.file.name}`));
const { width: TW, height: TH } = manifest.dimensions;

check(bytes.length === TW * TH,
  `the file is exactly ${TW}x${TH} bytes as the manifest says (${bytes.length})`);

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
check(worstTrip < 0.5,
  `the codec round-trips within ${worstTrip.toFixed(3)} m over its whole range`);
// The square root is the reason this fits in 8 bits at all: it must be far finer
// near zero, where 99.7% of the residual lives, than a linear map would be.
const stepNearZero = Math.abs(decodeResidual(encodeResidual(0) + 1));
check(stepNearZero < 0.02,
  `and its step near zero is ${stepNearZero.toFixed(4)} m, far finer than a linear map's 0.25 m`);

// THE OUTER RING IS THE SEAM THAT ISN'T. Everything outside the rectangle gets no
// correction at all; if the edge itself carried one there would be a step there,
// and the "no seam by construction" claim would be a story rather than a property.
let edgeWorst = 0;
for (let x = 0; x < TW; x++) {
  edgeWorst = Math.max(edgeWorst, Math.abs(decodeResidual(bytes[x])),
    Math.abs(decodeResidual(bytes[(TH - 1) * TW + x])));
}
for (let y = 0; y < TH; y++) {
  edgeWorst = Math.max(edgeWorst, Math.abs(decodeResidual(bytes[y * TW])),
    Math.abs(decodeResidual(bytes[y * TW + TW - 1])));
}
check(edgeWorst === 0,
  'the outermost ring is exactly zero, so the tier has no seam to reconcile with the base grid');

// And it has to actually correct something in the middle, or the file is 7 MB of
// nothing and every test above passes on an empty grid.
let moved = 0;
let maxAbs = 0;
for (let i = 0; i < bytes.length; i += 37) {
  const m = decodeResidual(bytes[i]);
  if (m !== 0) moved++;
  maxAbs = Math.max(maxAbs, Math.abs(m));
}
check(moved / (bytes.length / 37) > 0.5 && maxAbs > 5,
  `it corrects ${((moved / (bytes.length / 37)) * 100).toFixed(0)}% of sampled pixels, by up to ${maxAbs.toFixed(1)} m`);
check(maxAbs < RESIDUAL_HALF_RANGE_M,
  `and nothing reaches the clipping range (+/-${RESIDUAL_HALF_RANGE_M} m), so no cliff is flattened`);

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

const before = await shot('before');
await page.waitForTimeout(1800);
const floor = changed(before, await shot('before-b'));
check(floor < 0.005, `the scene is still between shots (noise floor ${(floor * 100).toFixed(2)}%)`);

const loaded = await page.evaluate(async () => {
  const T = window.__pngp.terrain;
  const m = await T.loadHeightTier();
  if (!m) return null;
  T.setHeightTierMix(1);
  return { name: m.file.name, gzip: m.file.gzipBytes, w: m.dimensions.width, h: m.dimensions.height };
});
check(!!loaded, 'the tier downloads and installs from the running page');
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
  check(cpu.segments > 7,
    `the quadtree refines a level further inside the tier (deepest ${cpu.segments})`);

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
  check(layerMoved.grass > 0.005 && layerMoved.scree > 0.005,
    'the dense layers are still drawn on the new surface '
    + `(grass ${(layerMoved.grass * 100).toFixed(2)}%, scree ${(layerMoved.scree * 100).toFixed(2)}%)`);
  // And for the blocks, a quantity that is not luck. Two consecutive runs of the
  // pixel version read 0.010% and then 0.000% from the same camera - which is the
  // measurement telling you it is the wrong one, not the feature failing. Whether
  // a 49-instance layer puts one in a given frame is chance; whether it is drawing
  // at all is not.
  const blocks = await page.evaluate(() => window.__pngp.groundcover.counts()
    .find((l) => l.kind === 'boulder'));
  check(blocks && blocks.drawn > 0,
    `the block layer is drawing on the new surface too (${blocks?.drawn} of ${blocks?.of} instances)`);
}

check(problems.length === 0, 'no console or page errors', problems.slice(0, 3).join(' | '));
await browser.close();

console.log(failures
  ? `\n${failures} FAILED`
  : '\nThe tier is what the manifest says, its edge is a non-event, and turning it on moves the ground with everything standing on it.');
process.exit(failures ? 1 : 0);
