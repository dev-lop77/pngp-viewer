#!/usr/bin/env node
// Checks that the trees (src/vegetation.js, phase 6) actually appear where the
// OSM canopy mask says there is forest, and nowhere else.
//
// Placement happens entirely in the vertex shader, so there is no CPU-side list
// of tree positions to inspect - the only honest way to test it is to render and
// look at pixels. Each case renders the same view twice, with the vegetation
// mesh added and removed, and counts how many pixels changed.
//
// Usage: tools/dev/start-dev.sh && node tools/test-vegetation.mjs

import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:5173';

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
  const { loadTerrain } = await import('/src/terrain.js');
  const { loadForest, FOREST_MASK } = await import('/src/forest.js');
  const { createVegetation } = await import('/src/vegetation.js');

  const terrain = await loadTerrain();
  const forest = await loadForest();
  const vegetation = createVegetation({ manifest: terrain.manifest, heightTexture: terrain.heightTexture });

  // Read the mask back on the CPU so the test can pick its own test points
  // instead of trusting hardcoded coordinates that could go stale.
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
  const mw = img.width;
  const mh = img.height;
  // Same mapping as terrainUv()/vegUv(): +X east, +Z south, row 0 = north.
  const maskAt = (x, z) => {
    const px = Math.floor(((x + worldWidth / 2) / worldWidth) * mw);
    const py = Math.floor(((z + worldDepth / 2) / worldDepth) * mh);
    if (px < 0 || py < 0 || px >= mw || py >= mh) return 0;
    return mask[(py * mw + px) * 4] / 255;
  };

  let maskMax = 0;
  let maskSum = 0;
  for (let i = 0; i < mask.length; i += 4) {
    maskSum += mask[i];
    if (mask[i] > maskMax) maskMax = mask[i];
  }

  const scene = new THREE.Scene();
  scene.add(terrain.object);
  scene.add(new THREE.AmbientLight(0xffffff, Math.PI * 0.7));
  const sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(1, 2, 1);
  scene.add(sun);

  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.toneMapping = THREE.NoToneMapping;
  const SIZE = 200;
  renderer.setSize(SIZE, SIZE);
  const target = new THREE.WebGLRenderTarget(SIZE, SIZE);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.5, 20000);

  const buf = new Uint8Array(SIZE * SIZE * 4);
  function shoot() {
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.readRenderTargetPixels(target, 0, 0, SIZE, SIZE, buf);
    return Uint8Array.from(buf);
  }

  // Find dense forest, and separately somewhere with no canopy at all, by
  // scanning deterministically so a failure is reproducible. Bounds are the
  // inner bbox rather than the whole thing: scanning from the corner picked the
  // Po plain at 239 m, which is outside the park and not what this should be
  // testing.
  function scan(predicate) {
    for (let x = -26000; x < 26000; x += 211) {
      for (let z = -14000; z < 14000; z += 197) {
        if (predicate(x, z)) return { x, z };
      }
    }
    return null;
  }

  const wooded = scan((x, z) => maskAt(x, z) > 0.9);
  const bare = scan((x, z) => maskAt(x, z) === 0 && terrain.sampleRenderedHeight(x, z) > 3000);

  const cases = [];
  for (const [name, spot] of [
    ['wooded', wooded],
    ['above treeline', bare],
  ]) {
    if (!spot) {
      cases.push({ name, error: 'no such point found' });
      continue;
    }
    const ground = terrain.sampleRenderedHeight(spot.x, spot.z);
    // Stand back and slightly above, looking at the spot, so a stand of trees
    // occupies a good part of the frame instead of one trunk filling it.
    camera.position.set(spot.x, ground + 40, spot.z + 150);
    camera.lookAt(spot.x, ground + 8, spot.z);
    camera.updateMatrixWorld();
    terrain.update(camera);

    scene.remove(vegetation.object);
    const without = shoot();
    scene.add(vegetation.object);
    const with_ = shoot();

    let changed = 0;
    for (let i = 0; i < without.length; i += 4) {
      if (
        Math.abs(without[i] - with_[i]) > 6 ||
        Math.abs(without[i + 1] - with_[i + 1]) > 6 ||
        Math.abs(without[i + 2] - with_[i + 2]) > 6
      ) {
        changed++;
      }
    }
    cases.push({
      name,
      at: [Math.round(spot.x), Math.round(spot.z)],
      groundM: Math.round(ground),
      maskValue: Number(maskAt(spot.x, spot.z).toFixed(2)),
      changedPct: Number(((changed / (SIZE * SIZE)) * 100).toFixed(1)),
    });
  }

  return {
    maskSize: `${img.width}x${img.height}`,
    maskMax,
    maskMean: Number((maskSum / (mask.length / 4)).toFixed(1)),
    instances: vegetation.stats.instances,
    stats: vegetation.stats,
    cases,
  };
});

await browser.close();

console.log(`Mask ${result.maskSize}, max ${result.maskMax}, mean ${result.maskMean}`);
console.log(`Vegetation: ${result.instances} instances, ${JSON.stringify(result.stats)}\n`);
for (const c of result.cases) {
  if (c.error) {
    console.log(`FAIL ${c.name}: ${c.error}`);
    continue;
  }
  console.log(
    `${c.name}: at (${c.at.join(', ')}), ground ${c.groundM} m, mask ${c.maskValue} -> ` +
      `${c.changedPct}% of the frame changed when trees were added`,
  );
}
if (problems.length) console.log(`\nPage problems:\n  ${problems.join('\n  ')}`);

const wooded = result.cases.find((c) => c.name === 'wooded');
const bare = result.cases.find((c) => c.name === 'above treeline');
let failures = 0;
// Thresholds are loose on purpose: this asserts "trees are there / not there",
// not how many pixels a particular stand happens to cover.
if (!wooded || wooded.changedPct < 5) {
  console.log('\nFAIL: dense forest drew (almost) nothing.');
  failures++;
}
if (!bare || bare.changedPct > 0.5) {
  console.log('\nFAIL: trees appeared above the treeline, where the mask is empty.');
  failures++;
}
if (failures || problems.length) process.exit(1);
console.log('\nTrees appear in the forest and nowhere else.');
