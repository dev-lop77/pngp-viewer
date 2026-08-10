// Does the LOD swap actually show? (Phase 7, 2026-08-10.)
//
// tools/dev/probe-lod.mjs says the geometry pop is worth 1-2 px and the shading
// steps by 24-35% at p95 on the far transitions. Those are analytic numbers about
// the surface and the normals; this one renders the real thing and diffs pixels,
// because "24% of the diffuse term at p95" is not yet a statement about what a
// viewer sees.
//
// The experiment is a controlled pair. The camera is placed exactly at the
// distance where one chosen tile subdivides (terrain.js's split rule is explicit,
// so this is computed, not hunted for), and three frames are taken:
//
//   A, B  the same position twice  -> the noise floor. NOT zero: the water
//         shaders animate, birds fly, and headless renders at ~1 fps, so two
//         frames of the same view already differ.
//   C     a few metres across the boundary -> the same view with that tile at
//         one depth finer. Parallax at 15.7 km is 0.15 px, i.e. nothing.
//
// So the question is simply whether C-A stands out of B-A, measured inside the
// screen rectangle the tile itself projects to.
//
// Usage: tools/dev/start-dev.sh, then `node tools/dev/probe-lod-visible.mjs`
//        DEPTH=3 selects which transition to test (depth -> depth+1).

import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { decode } from 'fast-png';

const URL = process.env.URL ?? 'http://127.0.0.1:5173/';
const DEPTH = Number(process.env.DEPTH ?? 3); // 3->4 falls at 15.7 km, where there is no fog at all
const NUDGE_M = 40; // enough to cross the boundary, small enough to be no parallax at 15 km
const CAMERA_ALT_M = 3400; // above the ridges, so nothing near the camera is in shot
const SETTLE_MS = 4000; // headless renders this scene at ~1 fps

const manifest = JSON.parse(await readFile('public/data/heightfield.json', 'utf8'));
const src = await readFile('src/terrain.js', 'utf8');
const TILE_SEGMENTS = Number(src.match(/TILE_SEGMENTS\s*=\s*(\d+)/)[1]);
const SPLIT_FACTOR = Number(src.match(/SPLIT_FACTOR\s*=\s*([\d.]+)/)[1]);

const { xmin, ymin, xmax, ymax } = manifest.bboxCrsUnits;
const worldWidth = xmax - xmin;
const worldDepth = ymax - ymin;
const halfW = worldWidth / 2 ** (DEPTH + 1);
const halfD = worldDepth / 2 ** (DEPTH + 1);
const splitDistance = (worldWidth / 2 ** DEPTH) * SPLIT_FACTOR;

// A tile far enough east that the camera, standing splitDistance to its west,
// still sits inside the map.
const tiles = [];
for (let i = 0; i < 2 ** DEPTH; i++) {
  const cx = (i + 0.5) * 2 * halfW - worldWidth / 2;
  if (cx - halfW - splitDistance > -worldWidth / 2 + 500) tiles.push(cx);
}
const tileX = tiles[0];
const tileZ = 0; // the middle band of the map, which is real mountain rather than edge
const camX = tileX - halfW - splitDistance;

console.log(`Transition ${DEPTH}->${DEPTH + 1}: a tile of ${(2 * halfW / 1000).toFixed(1)}`
  + ` x ${(2 * halfD / 1000).toFixed(1)} km subdivides at ${(splitDistance / 1000).toFixed(2)} km.`);
console.log(`Tile centre (${tileX.toFixed(0)}, ${tileZ}), camera at x=${camX.toFixed(0)},`
  + ` ${CAMERA_ALT_M} m up, looking east at it.\n`);

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__pngp?.scene?.getObjectByName('terrain')?.children.length > 0,
  null, { timeout: 90000 });

// Fly mode: walk mode ground-clamps the camera every frame, which would undo the
// altitude. Nothing moves the camera in fly mode unless a key is held.
await page.evaluate(() => { window.__pngp.controls.mode = 'fly'; });

async function place(x, y, z, lookAtX, lookAtZ) {
  await page.evaluate(({ x, y, z, lookAtX, lookAtZ }) => {
    const { camera } = window.__pngp;
    camera.position.set(x, y, z);
    camera.lookAt(lookAtX, 2200, lookAtZ);
    camera.updateMatrixWorld(true);
  }, { x, y, z, lookAtX, lookAtZ });
}

// Which depth is drawn over a given world point, read off the scene itself.
// Deliberately a SEPARATE call from place(): the tile set is chosen by
// terrainUpdate() inside the render loop, so reading it in the same evaluate that
// moves the camera reports the previous position's answer - which is exactly what
// the first version of this probe did, and it made the counts nonsense.
async function depthOver(x, z) {
  return page.evaluate(({ x, z }) => {
    const group = window.__pngp.scene.getObjectByName('terrain');
    const sizes = {};
    let hit = null;
    for (const mesh of group.children) {
      if (!mesh.visible) continue;
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      const bb = mesh.geometry.boundingBox;
      const sx = bb.max.x - bb.min.x;
      const sz = bb.max.z - bb.min.z;
      sizes[sx.toFixed(0)] = (sizes[sx.toFixed(0)] ?? 0) + 1;
      if (Math.abs(x - mesh.position.x) <= sx / 2 && Math.abs(z - mesh.position.z) <= sz / 2) {
        hit = { sizeX: sx, centreX: mesh.position.x, centreZ: mesh.position.z };
      }
    }
    return { hit, sizes, tiles: group.children.filter((m) => m.visible).length };
  }, { x, z });
}

// The screen rectangle the tile projects to - the only place its own change can
// appear. Measuring the whole frame would dilute it with sky.
async function tileRect(cx, cz, hw, hd) {
  const r = await page.evaluate(({ cx, cz, hw, hd }) => {
    const { camera, renderer } = window.__pngp;
    // The THREE namespace itself is not on the dev handle, but any Vector3 will
    // clone into a fresh one.
    const v3 = () => camera.position.clone();
    const w = renderer.domElement.width / window.devicePixelRatio;
    const h = renderer.domElement.height / window.devicePixelRatio;
    let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
    for (const dx of [-hw, hw]) {
      for (const dz of [-hd, hd]) {
        for (const y of [500, 4000]) {
          const v = v3().set(cx + dx, y, cz + dz).project(camera);
          minX = Math.min(minX, ((v.x + 1) / 2) * w);
          maxX = Math.max(maxX, ((v.x + 1) / 2) * w);
          minY = Math.min(minY, ((1 - v.y) / 2) * h);
          maxY = Math.max(maxY, ((1 - v.y) / 2) * h);
        }
      }
    }
    return {
      x: Math.max(0, Math.floor(minX)),
      y: Math.max(0, Math.floor(minY)),
      width: Math.min(w, Math.ceil(maxX)) - Math.max(0, Math.floor(minX)),
      height: Math.min(h, Math.ceil(maxY)) - Math.max(0, Math.floor(minY)),
    };
  }, { cx, cz, hw, hd });
  return r;
}

const sizeToDepth = (sizeX) => Math.round(Math.log2(worldWidth / sizeX));

await place(camX - NUDGE_M, CAMERA_ALT_M, tileZ, tileX, tileZ);
await page.waitForTimeout(SETTLE_MS);
const roi = await tileRect(tileX, tileZ, halfW, halfD);
const coarse = await depthOver(tileX, tileZ);
console.log(`Region of interest: ${roi.width} x ${roi.height} px at (${roi.x}, ${roi.y})`);
console.log(`Coarse side: the tile over the target is depth ${sizeToDepth(coarse.hit.sizeX)}`
  + ` (${(coarse.hit.sizeX / 1000).toFixed(1)} km wide), ${coarse.tiles} tiles drawn`);

const shotA = decode(await page.screenshot({ clip: roi }));
await page.waitForTimeout(SETTLE_MS);
const shotB = decode(await page.screenshot({ clip: roi }));

await place(camX + NUDGE_M, CAMERA_ALT_M, tileZ, tileX, tileZ);
await page.waitForTimeout(SETTLE_MS);
const fine = await depthOver(tileX, tileZ);
const shotC = decode(await page.screenshot({ clip: roi }));
console.log(`Fine side  : the tile over the target is depth ${sizeToDepth(fine.hit.sizeX)}`
  + ` (${(fine.hit.sizeX / 1000).toFixed(1)} km wide), ${fine.tiles} tiles drawn`);

await browser.close();

if (sizeToDepth(fine.hit.sizeX) !== sizeToDepth(coarse.hit.sizeX) + 1) {
  console.log('\n!! The tile did not subdivide between the two frames - the numbers below');
  console.log('   are measuring something else. Check NUDGE_M and the split rule.');
}

const luma = (img) => {
  const { data, channels } = img;
  const n = img.width * img.height;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = i * channels;
    out[i] = 0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2];
  }
  return out;
};

const diff = (p, q) => {
  const a = luma(p);
  const b = luma(q);
  const d = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) d[i] = Math.abs(a[i] - b[i]);
  const sorted = [...d].sort((x, y) => x - y);
  const at = (f) => sorted[Math.min(sorted.length - 1, Math.floor(f * sorted.length))];
  const over = (t) => (d.filter((v) => v > t).length / d.length) * 100;
  return {
    mean: d.reduce((s, v) => s + v, 0) / d.length,
    p95: at(0.95),
    p99: at(0.99),
    max: sorted[sorted.length - 1],
    over2: over(2),
    over8: over(8),
    over20: over(20),
  };
};

const noise = diff(shotA, shotB);
const signal = diff(shotA, shotC);
const fmt = (d) => `mean ${d.mean.toFixed(2)} · p95 ${d.p95.toFixed(1)} · p99 ${d.p99.toFixed(1)}`
  + ` · max ${d.max.toFixed(0)} · pixels over 2/8/20: ${d.over2.toFixed(1)}% / ${d.over8.toFixed(1)}%`
  + ` / ${d.over20.toFixed(1)}%`;

console.log('\nLuminance difference inside the tile, 0-255:');
console.log(`  same position twice (noise floor): ${fmt(noise)}`);
console.log(`  across the LOD boundary          : ${fmt(signal)}`);
console.log(`\n  signal/noise on the mean: x${(signal.mean / (noise.mean || 1e-9)).toFixed(1)}`
  + `, on the 1% worst pixels: x${(signal.p99 / (noise.p99 || 1e-9)).toFixed(1)}`);
