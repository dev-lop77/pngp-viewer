#!/usr/bin/env node
// The 51 rifugi and bivacchi as buildings (src/huts.js, 2026-08-19), in two halves.
//
// HALF ONE is pure Node over the builders themselves, and it is the half that catches
// the mistakes that are cheap to make here: a hutKind the data has and the code does
// not, a part hanging below the floor (which becomes a building sunk into the rock), a
// distance shape that is not the same building as the near one, and a geometry that
// cannot be merged. mergeGeometries refuses a mix of indexed and non-indexed inputs and
// that is exactly what a new part written by hand will be, so it is asserted rather
// than left to fail in the browser as a blank scene.
//
// HALF TWO drives the real page, because the two things the user actually sees cannot
// be read off a builder: that every building is planted on the DRAWN surface, and that
// the marker post steps aside for it while the label stays.
//
// The seating is NOT checked with sampleRenderedHeight, which is what seated it - that
// could only prove the assignment ran (docs/ARCHITECTURE.md §13.9). It is checked
// against the bilinear height, a different function over different data, and against
// the foundation's own reach.
//
// Usage: node tools/test-huts.mjs [url]

import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import {
  HUT_BUILDERS, HI_HUT_BUILDERS, HUT_FAR_BUILDERS, KIND_OF, KIND_SCALE, NEAR_M,
} from '../src/huts.js';

const url = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'http://localhost:5173';
const failures = [];
const check = (ok, message) => {
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${message}`);
  if (!ok) failures.push(message);
};

// ---- 1. every kind in the shipped data has a model ----
const poi = JSON.parse(readFileSync('public/data/poi.json', 'utf8'));
const huts = poi.pois.filter((p) => p.category === 'hut');
const kinds = [...new Set(huts.map((p) => p.hutKind))];
check(huts.length === 51, `poi.json ships ${huts.length} huts (51 when this was written)`);
for (const kind of kinds) {
  check(KIND_OF[kind] !== undefined && KIND_SCALE[kind] !== undefined,
    `hutKind "${kind}" (${huts.filter((p) => p.hutKind === kind).length} of them) maps to a model and a scale`);
}

// ---- 2. the geometry itself ----
const bounds = (parts) => {
  const b = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity };
  let tris = 0;
  for (const g of parts) {
    const pos = g.attributes.position;
    tris += pos.count / 3;
    for (let i = 0; i < pos.count; i += 1) {
      b.minX = Math.min(b.minX, pos.getX(i)); b.maxX = Math.max(b.maxX, pos.getX(i));
      b.minY = Math.min(b.minY, pos.getY(i)); b.maxY = Math.max(b.maxY, pos.getY(i));
      b.minZ = Math.min(b.minZ, pos.getZ(i)); b.maxZ = Math.max(b.maxZ, pos.getZ(i));
    }
  }
  return { ...b, tris };
};

for (const [kind, build] of Object.entries(HUT_BUILDERS)) {
  const parts = build();
  const b = bounds(parts);
  // Nothing below the floor: the building is seated with its origin ON the ground, so a
  // part at negative Y is a part inside the rock - and on a slope it is the whole
  // reason a model looks sunk rather than placed.
  check(b.minY >= -0.001, `${kind}: nothing hangs below the floor (min Y ${b.minY.toFixed(3)} m)`);
  check(b.maxY > 1.5 && b.maxY < 12, `${kind}: is a building, not a marker or a tower (${b.maxY.toFixed(1)} m tall)`);
  // Mergeable: three's mergeGeometries needs one consistent attribute set and one
  // consistent index state across every part.
  const attrs = parts.map((g) => Object.keys(g.attributes).sort().join(','));
  check(new Set(attrs).size === 1, `${kind}: every part carries the same attributes (${attrs[0]})`);
  check(parts.every((g) => g.index === null), `${kind}: every part is non-indexed, so the merge cannot refuse it`);
  check(parts.every((g) => g.attributes.color), `${kind}: every part carries its colour`);
  check(b.tris < 400, `${kind}: ${b.tris} triangles, under the 400 this scene budgets for a building`);

  // The distance shape has to be the SAME BUILDING: same footprint and same height to
  // within a tolerance, and fewer triangles. A silhouette that does not match is a
  // building that changes shape as you walk up to it, which is worse than no LOD.
  const far = bounds(HUT_FAR_BUILDERS[kind]());
  check(far.tris < b.tris, `${kind}: distance shape is cheaper (${far.tris} vs ${b.tris} triangles)`);
  // 0.6 m of tolerance, and the reason is a real one rather than a fudge: the hut's
  // near model carries a chimney standing 0.4 m above its ridge and the distance shape
  // deliberately does not, because a chimney at 900 m is less than a pixel. What must
  // match is the ROOF, and 0.6 m is tight enough that a wrong ridge height still fails.
  check(Math.abs(far.maxY - b.maxY) < 0.6,
    `${kind}: distance shape is the same height (${far.maxY.toFixed(2)} vs ${b.maxY.toFixed(2)} m)`);
  check(Math.abs((far.maxX - far.minX) - (b.maxX - b.minX)) < 1.2,
    `${kind}: distance shape has the same width (${(far.maxX - far.minX).toFixed(2)} vs ${(b.maxX - b.minX).toFixed(2)} m)`);
}

// ---- 3. the High level adds the flag, and adds it in the right order ----
const std = bounds(HUT_BUILDERS.bivouac());
const hi = bounds(HI_HUT_BUILDERS.bivouac());
check(hi.tris > std.tris, `bivouac High is the standard model plus something (${hi.tris} vs ${std.tris} triangles)`);
const flagParts = HI_HUT_BUILDERS.bivouac().slice(HUT_BUILDERS.bivouac().length);
// Green, white, red left to right, which is the flag. Read from the colour attribute
// and the X of each band, not from the source order - the order in the file is not
// what anyone sees.
const bands = flagParts
  .filter((g) => g.attributes.position.count === 6) // the three quads, not the mast
  .map((g) => {
    const c = g.attributes.color;
    let x = 0;
    for (let i = 0; i < g.attributes.position.count; i += 1) x += g.attributes.position.getX(i);
    return { x: x / g.attributes.position.count, r: c.getX(0), g: c.getY(0), b: c.getZ(0) };
  })
  .sort((a, b) => a.x - b.x);
check(bands.length === 3, `the flag has three bands (${bands.length})`);
if (bands.length === 3) {
  check(bands[0].g > bands[0].r && bands[0].g > bands[0].b, 'leftmost band is green');
  check(bands[1].r > 0.5 && bands[1].g > 0.5 && bands[1].b > 0.5, 'middle band is white');
  check(bands[2].r > bands[2].g && bands[2].r > bands[2].b, 'rightmost band is red');
}

// ---- 4. the real page ----
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
const problems = [];
page.on('pageerror', (e) => problems.push(`[pageerror] ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`[console.error] ${m.text()}`); });
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__pngp?.getHuts?.(), null, { timeout: 180000 });

const placed = await page.evaluate(() => {
  const h = window.__pngp.getHuts();
  const bilinear = window.__pngp.getBilinearHeight();
  return h.placements.map((p) => ({
    name: p.poi.name, id: p.poi.id, kind: p.kind, x: p.x, z: p.z, y: p.y, drop: p.drop,
    yaw: p.yaw, bilinear: bilinear(p.x, p.z),
  }));
});
check(placed.length === 51, `the page placed ${placed.length} buildings`);
const onAir = placed.filter((p) => p.y - p.drop > p.bilinear + 0.01);
check(onAir.length === 0,
  `no building stands on air - its foundation reaches below the data surface (${onAir.length} do not)`);
const buried = placed.filter((p) => p.y < p.bilinear - 8);
check(buried.length === 0, `no building is buried more than 8 m below the data surface (${buried.length} are)`);
check(placed.every((p) => p.drop >= 0.5 && p.drop < 60),
  'every foundation has a sane depth (0.5 m to 60 m)');

// Stand next to one and read the DRAWN post, not the predicate that decides it.
const near = placed.find((p) => p.kind === 'bivouac');
// WAIT FOR THE HEIGHT TIER FIRST. This test failed twice inside the suite while passing
// on its own, and the flake was real rather than mysterious: the label is hidden when
// terrain stands in front of it (src/labels.js marches a ray over the DRAWN surface),
// the default Medium tier is an 8.78 MB download that lands after the first frame, and
// it moves that surface by up to 44 m. So the same camera is occluded or not depending
// on whether the tier had arrived - and a check that depends on a download is not a
// check. Waits the way shoot.mjs does, on the tier's own crossfade.
await page
  .waitForFunction(() => (window.__pngp.terrain?.heightTier?.mix ?? 0) >= 1, null, { timeout: 300000 })
  .catch(() => console.log('  note  the height tier never settled - continuing'));

// Then move, then let the app's own loop run before reading anything. The first version
// of this test moved the camera and read the post in the same evaluate, and the post was
// still the one from the previous position - huts.js refills its near/far split from the
// render loop, so nothing had recomputed yet. It is the same class of mistake as
// §13.15's stale uniform: a value the loop owns cannot be read on the tick you asked for
// it to change.
//
// The vantage is the DOOR side, 25 m out, which is downhill by construction (huts.js
// yaws every building to face down the slope). Standing anywhere else can put a rock lip
// between the camera and the label, and then this measures the occlusion ray rather than
// the decision under test.
await page.evaluate((p) => {
  const cam = window.__pngp.camera;
  window.__pngp.controls.mode = 'fly';
  const x = p.x + Math.sin(p.yaw) * 25;
  const z = p.z + Math.cos(p.yaw) * 25;
  const ground = window.__pngp.getGroundHeight()(x, z);
  cam.position.set(x, ground + 1.7, z); // eye height, standing on the ground
  // And LOOK at it. A CSS2DObject behind the camera is display:none by three's own
  // renderer, so a label test that does not turn to face the building measures the
  // frustum and not the decision.
  cam.lookAt(p.x, p.y + 2, p.z);
  cam.updateMatrixWorld(true);
}, near);
await page.evaluate(() => new Promise((r) => {
  requestAnimationFrame(() => requestAnimationFrame(() => r()));
}));

// THE LABEL IS READ BY WAITING FOR IT, not by looking once. A CSS2DObject's element is
// put into the DOM by the renderer when it RENDERS it, and the app's marker pass is
// throttled to the HUD tick - so a read taken on the tick that moved the camera finds
// three labels in the whole document and none of them this one, while the object itself
// reports visible:true. That is what made this check fail inside the suite and pass on
// its own, and both readings were honest: the DOM simply had not caught up.
const labelAppeared = await page
  .waitForFunction(
    (name) => [...document.querySelectorAll('.poi-label')]
      .some((e) => e.textContent.includes(name) && e.offsetParent !== null),
    near.name,
    { timeout: 60000 },
  )
  .then(() => true)
  .catch(() => false);

const post = await page.evaluate(({ p, NEAR_M }) => {
  const cam = window.__pngp.camera;
  const index = window.__pngp.getPoiIndex();
  index.updateMarkers(cam);
  const line = window.__pngp.scene.getObjectByName('poi-hut');
  const pos = line.geometry.getAttribute('position').array;
  const pois = index.manifest.pois.filter((q) => q.category === 'hut');
  const rows = pois.map((q, i) => ({
    id: q.id,
    len: pos[i * 6 + 4] - pos[i * 6 + 1],
    dist: Math.hypot(q.local.x - cam.position.x, q.local.z - cam.position.z),
  }));
  return {
    mine: rows.find((r) => r.id === p.id),
    wrong: rows.filter((r) => (r.dist <= NEAR_M) !== (r.len <= 0.01)).length,
  };
}, { p: near, NEAR_M });
check(post.mine.len <= 0.01, `the post of the building you are standing at is collapsed (${post.mine.len.toFixed(2)} m)`);
check(post.wrong === 0, `every post agrees with the ${NEAR_M} m rule (${post.wrong} do not)`);
check(labelAppeared, 'the label survives the post - the other half of the decision');

check(problems.length === 0, `no page errors (${problems.length})`);
if (problems.length) console.log(`    ${problems.join('\n    ')}`);
await browser.close();

console.log(failures.length ? `\n${failures.length} FAILED` : '\nAll checks passed');
process.exit(failures.length ? 1 : 0);
