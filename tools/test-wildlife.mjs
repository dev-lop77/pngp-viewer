#!/usr/bin/env node
// Guards src/wildlife.js (phase 6). Run after touching the animals, their
// habitat rules, or the canopy sampler in src/forest.js.
//
// What is worth pinning here is not how an animal looks - that needs a real
// browser and a human - but whether it is standing somewhere its species would
// actually be, and whether it is standing ON the drawn terrain. Both are
// numbers, which is exactly the kind of question headless SwiftShader can be
// trusted with (docs/PROGRESS.md: brightness, frame rate and input feel are the
// things it cannot judge).
//
// The properties, in the order they are reported:
//   1. animals appear at all, at mid-altitude sites where they should, and all five
//      species do;
//   2. every animal satisfies its own species' elevation/slope/canopy envelope -
//      the whole point of driving placement from the OSM canopy mask and the
//      terrain rather than scattering at random;
//   3. their feet are on the drawn surface, not the true heightfield (they differ
//      by ~0.4 m, and it is the drawn one the user sees);
//   4. herds are deterministic: leaving and coming back finds the same animals in
//      the same places, so the park does not reshuffle as you walk;
//   5. the legs move - the vertex-shader gait actually receives a changing swing,
//      and no instance exceeds its species' capacity;
//   6/7. the reactions, asserted in OPPOSITE directions: a bold fox closes the gap
//      to a still camera while an ibex opens it, and squirrels end up with a trunk
//      between themselves and the camera;
//   8. vegetation.js's CPU nearestTree() returns the trunk the GPU actually draws,
//      brute-forced against the mesh's own aOffset buffer. Nothing else would catch
//      a squirrel hiding behind a tree that is not there;
//   9. each body's up axis matches the terrain normal - pitch AND roll, which is
//      what "standing on the slope rather than through it" means;
//   10. a bold fox cannot be walked into at the controls' real 4 m/s;
//   11. a squirrel abandons its trunk once the camera reaches that trunk.
//
// 9, 10 and 11 were all added on 2026-08-04 from the user's real-browser report,
// and each of them is a thing headless CAN measure that had simply never been
// asked.
//
// Usage: tools/dev/start-dev.sh && node tools/test-wildlife.mjs

import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:5173';

// Real places in the park at ibex/chamois/marmot altitude, straight out of the
// shipped POI data - a hand-typed coordinate would be one more thing to keep
// true if the local frame ever moved.
const poi = JSON.parse(readFileSync(new URL('../public/data/poi.json', import.meta.url), 'utf8'));
const SITES = [
  ...poi.pois
    .filter((p) => p.elevationM > 2200 && p.elevationM < 2750)
    .slice(0, 8)
    .map((p) => ({ name: p.name, x: p.local.x, z: p.local.z })),
  // Squirrels need solid canopy below 2,200 m, which no high col has. These four
  // are pixels of value 255 in the shipped forest mask at 1,000-1,900 m, each
  // inside the real park boundary and >5 km apart, found by scanning
  // public/data/forest.*.png against the heightfield rather than guessed.
  { name: 'dense wood 1036 m', x: -8530, z: 2990 },
  { name: 'dense wood 1826 m', x: -14121, z: 4997 },
  { name: 'dense wood 1895 m', x: -4229, z: 5570 },
  { name: 'dense wood 1732 m', x: 358, z: 7863 },
];

const HABITAT = {
  ibex: { elevMin: 2000, elevMax: 3400, slopeMin: 18, slopeMax: 58, canopyMax: 0.18 },
  chamois: { elevMin: 1100, elevMax: 2700, slopeMin: 12, slopeMax: 48, canopyMin: 0.02, canopyMax: 0.7 },
  marmot: { elevMin: 1500, elevMax: 2900, slopeMin: 0, slopeMax: 26, canopyMax: 0.28 },
  fox: { elevMin: 700, elevMax: 2800, slopeMin: 0, slopeMax: 45, canopyMax: 0.9 },
  squirrel: { elevMin: 600, elevMax: 2200, slopeMin: 0, slopeMax: 45, canopyMin: 0.9 },
};

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const problems = [];
page.on('pageerror', (err) => problems.push(err.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') problems.push(msg.text());
});
await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(5000);

const result = await page.evaluate(async ({ sites, dt }) => {
  const { camera, scene, renderer } = window.__pngp ?? {};
  if (!camera) return { error: 'window.__pngp missing - run this against a dev server' };
  const wildlife = window.__pngp.getWildlife?.();
  if (!wildlife) return { error: 'wildlife never loaded - the canopy mask or the terrain failed' };

  // Drive the loop by hand at a fixed dt: SwiftShader runs at 1-2 fps, so real
  // frames would move every animal metres at a time and measure the software
  // renderer rather than the code.
  renderer.setAnimationLoop(null);

  const THREE = await import('/node_modules/three/build/three.module.js');
  const matrix = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const meshes = scene.getObjectByName('wildlife').children;

  const visit = (site, frames) => {
    camera.position.set(site.x, 0, site.z);
    for (let i = 0; i < frames; i++) wildlife.update(dt, camera);
    return wildlife.snapshot();
  };

  const seen = [];
  const drawn = [];
  for (const site of sites) {
    const animals = visit(site, 30);
    seen.push({ site: site.name, animals });
    // Where the instances were actually written, which is what the GPU draws.
    for (const mesh of meshes) {
      for (let i = 0; i < mesh.count; i++) {
        mesh.getMatrixAt(i, matrix);
        pos.setFromMatrixPosition(matrix);
        drawn.push({ species: mesh.name.replace('wildlife-', ''), x: pos.x, y: pos.y, z: pos.z });
      }
    }
  }

  // 4: leave for a kilometre, come back, and compare.
  const site = sites[0];
  const before = visit(site, 30).map((a) => `${a.species}@${a.x.toFixed(2)},${a.z.toFixed(2)}`);
  visit({ x: site.x + 4000, z: site.z + 4000 }, 5);
  const after = visit(site, 30).map((a) => `${a.species}@${a.x.toFixed(2)},${a.z.toFixed(2)}`);

  // 5: swing must change over a few frames for something that is walking, and
  // the ground height each animal was placed at must match the sampler.
  const swingTrack = [];
  const busiest = sites.reduce((best, s) => (visit(s, 20).length > (best.n ?? 0)
    ? { site: s, n: wildlife.snapshot().length } : best), {});
  if (busiest.site) {
    camera.position.set(busiest.site.x, 0, busiest.site.z);
    for (let f = 0; f < 12; f++) {
      wildlife.update(dt, camera);
      swingTrack.push(wildlife.snapshot().map((a) => a.swing));
    }
  }

  // 6 & 7: the reactions. These need the camera to actually walk up to an animal -
  // every reaction has a radius (45 m for ibex, 130 for a fox, 35 for a squirrel),
  // so measuring from wherever the herd happened to be tests nothing.
  const nearestOf = (name, bold = false) => wildlife.snapshot()
    .filter((a) => a.species === name && (!bold || a.bold))
    .sort((p, q) => p.camDistM - q.camDistM)[0];

  const stalk = (name, standM, seconds, bold = false) => {
    for (const site of sites) {
      visit(site, 10);
      const subject = nearestOf(name, bold);
      if (!subject) continue;
      // Stand standM to the east of it and then hold still.
      camera.position.set(subject.x + standM, 0, subject.z);
      wildlife.update(dt, camera);
      const startDist = nearestOf(name, bold).camDistM;
      for (let i = 0; i < seconds * 60; i++) wildlife.update(dt, camera);
      const end = nearestOf(name, bold);
      return { site: site.name, standM, startDist, endDist: end?.camDistM ?? null };
    }
    return null;
  };

  const approach = {
    fox: stalk('fox', 60, 8, true), // inside curiousM (130) but well outside standoff
    ibex: stalk('ibex', 20, 8), // inside alertM (45), so the herd should break
  };

  // Squirrels: stand 15 m off, inside their 35 m alert radius, and see where they
  // put themselves relative to their trunk.
  const hiding = [];
  for (const site of sites) {
    visit(site, 10);
    const subject = nearestOf('squirrel');
    if (!subject) continue;
    camera.position.set(subject.x + 15, 0, subject.z);
    for (let i = 0; i < 240; i++) wildlife.update(dt, camera); // 4 s to reach cover
    hiding.push(...wildlife.snapshot().filter((a) => a.species === 'squirrel' && a.camDistM < 40));
    if (hiding.length >= 4) break;
  }

  // 9. Standing ON the slope, not through it. The user reported the first version
  // as "posizione/inclinazione non coerente con il terreno": it pitched along the
  // heading only and never rolled, so on a side-slope one pair of legs floated.
  // The body's own up axis is compared against the terrain normal - that is the
  // property, and it covers pitch and roll at once.
  const tilt = [];
  for (const site of sites) {
    visit(site, 40);
    for (const mesh of meshes) {
      for (let i = 0; i < mesh.count; i++) {
        mesh.getMatrixAt(i, matrix);
        pos.setFromMatrixPosition(matrix);
        // Column 1 of the instance matrix is the model's +Y, rotated into world
        // space. Normalised because the matrix also carries the animal's scale.
        const bodyUp = new THREE.Vector3(matrix.elements[4], matrix.elements[5], matrix.elements[6]).normalize();
        const h = window.__pngp.controls.getGroundHeight;
        const b = 0.5; // any baseline inside one 20.5 m facet gives the same gradient
        const normal = new THREE.Vector3(
          -(h(pos.x + b, pos.z) - h(pos.x - b, pos.z)) / (2 * b),
          1,
          -(h(pos.x, pos.z + b) - h(pos.x, pos.z - b)) / (2 * b),
        ).normalize();
        tilt.push({
          species: mesh.name.replace('wildlife-', ''),
          offAxisDeg: (Math.acos(Math.min(1, Math.max(-1, bodyUp.dot(normal)))) * 180) / Math.PI,
          groundSlopeDeg: (Math.acos(Math.min(1, normal.y)) * 180) / Math.PI,
          footErrorM: pos.y - h(pos.x, pos.z),
        });
      }
    }
    if (tilt.length > 40) break;
  }

  // 10. A bold fox must not be touchable - "curiosa.. ma non stupida". Walk at the
  // 4 m/s WalkFlyControls actually uses and see how close it lets us get.
  let foxChase = null;
  for (const site of sites) {
    visit(site, 10);
    const start = nearestOf('fox', true);
    if (!start) continue;
    camera.position.set(start.x + 40, 0, start.z);
    wildlife.update(dt, camera);
    let minDist = Infinity;
    for (let i = 0; i < 900; i++) { // 15 s of walking straight at it
      const cur = nearestOf('fox', true);
      if (!cur) break;
      const dx = cur.x - camera.position.x;
      const dz = cur.z - camera.position.z;
      const d = Math.hypot(dx, dz) || 1;
      camera.position.x += (dx / d) * 4 * dt;
      camera.position.z += (dz / d) * 4 * dt;
      wildlife.update(dt, camera);
      minDist = Math.min(minDist, nearestOf('fox', true)?.camDistM ?? Infinity);
    }
    foxChase = { site: site.name, minDist };
    break;
  }

  // 11. A squirrel's cover must not be permanent: walk to the trunk it chose and
  // it should abandon it for one further away.
  let bailout = null;
  for (const site of sites) {
    visit(site, 10);
    const first = nearestOf('squirrel');
    if (!first) continue;
    camera.position.set(first.x + 15, 0, first.z);
    for (let i = 0; i < 240; i++) wildlife.update(dt, camera); // let it get behind a tree
    const follow = (id) => wildlife.snapshot().find((a) => a.id === id);
    const hidden = follow(first.id);
    if (!hidden?.treeX) continue;
    const firstTree = { x: hidden.treeX, z: hidden.treeZ };
    // Now walk right up to that trunk.
    for (let i = 0; i < 600; i++) {
      const dx = firstTree.x - camera.position.x;
      const dz = firstTree.z - camera.position.z;
      const d = Math.hypot(dx, dz);
      if (d > 1.5) {
        camera.position.x += (dx / d) * 4 * dt;
        camera.position.z += (dz / d) * 4 * dt;
      }
      wildlife.update(dt, camera);
    }
    const after = follow(first.id);
    bailout = {
      site: site.name,
      id: first.id,
      treeMovedM: after ? Math.hypot(after.treeX - firstTree.x, after.treeZ - firstTree.z) : null,
      awayFromOldTreeM: after ? Math.hypot(after.x - firstTree.x, after.z - firstTree.z) : null,
      stillShielded: after?.shielded ?? null,
      camDistM: after?.camDistM ?? null,
    };
    break;
  }

  // 8. The one that could silently break the squirrels: vegetation.js's CPU
  // nearestTree() must return the same trunk the GPU draws. Brute-forced here
  // against the mesh's REAL aOffset attribute - the exact buffer the shader
  // reads - with the wrap formula copied from the shader source, so a drift in
  // either the offsets or the wrap shows up as a mismatch in metres.
  const veg = await import('/src/vegetation.js');
  const vegMesh = scene.getObjectByName('vegetation');
  const aOffset = vegMesh.geometry.getAttribute('aOffset');
  const WINDOW = 1000; // must match vegetation.js's WINDOW_M
  const latticeCheck = [];
  for (const probe of [[0, 0], [123.4, -456.7], [-8530, 2990], [40000, -20000]]) {
    const [px, pz] = probe;
    const camX = px + 17; // a camera near but not on the probe, as in real use
    const camZ = pz - 23;
    let bestDist = Infinity;
    let best = null;
    for (let i = 0; i < aOffset.count; i++) {
      const ox = aOffset.getX(i);
      const oz = aOffset.getY(i);
      const sx = ox + Math.floor((camX - ox) / WINDOW + 0.5) * WINDOW;
      const sz = oz + Math.floor((camZ - oz) / WINDOW + 0.5) * WINDOW;
      const d = Math.hypot(sx - px, sz - pz);
      if (d < bestDist) { bestDist = d; best = { x: sx, z: sz, index: i }; }
    }
    const got = veg.nearestTree(px, pz, camX, camZ);
    latticeCheck.push({
      probe,
      bruteDist: bestDist,
      gotDist: got.distanceM,
      offsetM: Math.hypot(got.x - best.x, got.z - best.z),
      sameIndex: got.index === best.index,
    });
  }

  return {
    seen,
    drawn,
    latticeCheck,
    tilt,
    foxChase,
    bailout,
    capacities: meshes.map((m) => ({ species: m.name, count: m.count, capacity: m.instanceMatrix.count })),
    determinism: { before, after },
    swingTrack,
    approach,
    hiding,
    groundCheck: drawn.slice(0, 40).map((d) => ({
      species: d.species,
      y: d.y,
      ground: window.__pngp.controls.getGroundHeight(d.x, d.z),
    })),
  };
}, { sites: SITES, dt: 1 / 60 });

await browser.close();

if (result.error) {
  console.log(`ERROR: ${result.error}`);
  process.exit(1);
}

let failures = 0;
const all = result.seen.flatMap((s) => s.animals);
const byName = (name) => all.filter((a) => a.species === name);

console.log(`Visited ${result.seen.length} mid-altitude sites from the shipped POI data.\n`);
for (const { site, animals } of result.seen) {
  const counts = Object.keys(HABITAT)
    .map((n) => `${animals.filter((a) => a.species === n).length} ${n}`)
    .join(', ');
  console.log(`  ${site.padEnd(20)} ${counts}`);
}
console.log(`\ntotal simulated ${all.length}, drawn instances ${result.drawn.length}`);
console.log(`  ${result.capacities.map((c) => `${c.species} ${c.count}/${c.capacity}`).join(' · ')}`);

// 1. Something has to live up there.
if (all.length === 0) {
  console.log('\nFAIL: no animals at any mid-altitude site - placement or the habitat rules reject everything.');
  failures++;
}
for (const species of Object.keys(HABITAT)) {
  if (byName(species).length === 0) {
    console.log(`\nFAIL: no ${species} anywhere across ${result.seen.length} sites.`);
    failures++;
  }
}

// 2. Every animal inside its own envelope. This is the real assertion.
const violations = [];
for (const a of all) {
  const h = HABITAT[a.species];
  if (a.elevationM < h.elevMin || a.elevationM > h.elevMax) violations.push(`${a.species} at ${Math.round(a.elevationM)} m`);
  if (a.canopy > h.canopyMax) violations.push(`${a.species} under ${a.canopy.toFixed(2)} canopy`);
  if (h.canopyMin != null && a.canopy < h.canopyMin) violations.push(`${a.species} at ${a.canopy.toFixed(2)} canopy`);
}
// Habitat is tested at the herd SITE, and animals then wander up to spreadM +
// wanderM away, so a few can drift onto ground that would not have been chosen.
// That is intended - a herd is not a fence - so this is a rate, not a ban.
const rate = all.length ? violations.length / all.length : 0;
console.log(`\nhabitat: ${violations.length}/${all.length} animals outside their envelope (${(rate * 100).toFixed(1)}%)`);
if (violations.length) console.log(`  e.g. ${[...new Set(violations)].slice(0, 4).join('; ')}`);
if (rate > 0.25) {
  console.log('\nFAIL: too many animals outside their habitat - placement is not really using the mask/terrain.');
  failures++;
}

// 3. Feet on the drawn surface.
const offGround = result.groundCheck.filter((g) => Math.abs(g.y - g.ground) > 0.05);
console.log(`\nfeet on the drawn surface: ${result.groundCheck.length - offGround.length}/${result.groundCheck.length} exact`);
if (offGround.length) {
  console.log(`\nFAIL: ${offGround.length} animals not standing on sampleRenderedHeight - e.g. ${offGround[0].species} y=${offGround[0].y.toFixed(2)} vs ground ${offGround[0].ground.toFixed(2)}.`);
  failures++;
}

// 4. Same place, same herd.
const { before, after } = result.determinism;
const same = before.length === after.length && before.every((v, i) => v === after[i]);
console.log(`\ndeterminism: ${before.length} animals before leaving, ${after.length} after returning, identical: ${same}`);
if (!same) {
  console.log('\nFAIL: the herd changed after walking away and back - the lattice is not deterministic.');
  failures++;
}

// 5. Legs moving, and nothing over capacity.
const moved = result.swingTrack.length > 1
  && result.swingTrack.some((frame, i) => i > 0 && frame.some((s, j) => s !== result.swingTrack[i - 1][j]));
console.log(`swing changes across ${result.swingTrack.length} frames: ${moved}`);
if (!moved) {
  console.log('\nFAIL: no animal ever changed its leg swing - the gait is not being driven.');
  failures++;
}
for (const c of result.capacities) {
  if (c.count > c.capacity) {
    console.log(`\nFAIL: ${c.species} wrote ${c.count} instances into ${c.capacity} slots.`);
    failures++;
  }
}

// 6. A bold fox comes to you; an ibex does the opposite. Asserting both ways
// round matters - "the distance changed" would pass for either behaviour.
console.log('\nreaction to a camera walking up and then standing still for 8 s:');
for (const [name, run] of Object.entries(result.approach)) {
  if (!run) {
    console.log(`  ${name}: no candidate within 120 m at any site - inconclusive`);
    continue;
  }
  const delta = run.endDist - run.startDist;
  console.log(`  ${name}: approached to ${run.standM} m, then ${run.startDist.toFixed(1)} m -> ${run.endDist?.toFixed(1)} m (${delta > 0 ? '+' : ''}${delta.toFixed(1)} m) near ${run.site}`);
  if (name === 'fox' && delta > -1) {
    console.log('\nFAIL: a bold fox did not approach the camera - the curious reaction is not working.');
    failures++;
  }
  if (name === 'ibex' && delta < 1) {
    console.log('\nFAIL: an ibex did not open the distance - the flee reaction regressed.');
    failures++;
  }
}

// 7. Squirrels behind trunks.
const shielded = result.hiding.filter((s) => s.shielded).length;
const closeToTree = result.hiding.filter((s) => s.treeDistM <= s.treeSpacingM).length;
console.log(`\nsquirrels within 40 m after 4 s of being watched from 15 m: ${result.hiding.length}`);
if (result.hiding.length) {
  console.log(`  ${shielded} have the trunk between them and the camera, ${closeToTree} are within one tree spacing of it`);
  console.log(`  trunk distances: ${result.hiding.slice(0, 6).map((s) => `${s.treeDistM.toFixed(2)} m`).join(', ')}`);
  if (shielded / result.hiding.length < 0.7) {
    console.log('\nFAIL: most squirrels are not hiding behind their tree.');
    failures++;
  }
  if (closeToTree / result.hiding.length < 0.7) {
    console.log('\nFAIL: squirrels are not reaching their trunk at all - the lattice lookup is probably wrong.');
    failures++;
  }
} else {
  console.log('  none found close enough to judge - inconclusive, not a failure');
}

// 9. Bodies aligned to the ground they stand on.
const worst = result.tilt.reduce((a, b) => (b.offAxisDeg > a.offAxisDeg ? b : a), { offAxisDeg: 0 });
const steep = result.tilt.filter((t) => t.groundSlopeDeg > 20);
const meanOff = result.tilt.reduce((n, t) => n + t.offAxisDeg, 0) / (result.tilt.length || 1);
const footWorst = result.tilt.reduce((a, t) => Math.max(a, Math.abs(t.footErrorM)), 0);
console.log(`\nbody up axis vs terrain normal, over ${result.tilt.length} drawn animals:`);
console.log(`  mean ${meanOff.toFixed(2)} deg, worst ${worst.offAxisDeg.toFixed(2)} deg (${worst.species}, on ${worst.groundSlopeDeg?.toFixed(0)} deg ground)`);
console.log(`  ${steep.length} of them on ground steeper than 20 deg, where a missing roll would show`);
console.log(`  worst foot height error ${footWorst.toFixed(3)} m`);
if (worst.offAxisDeg > 6) {
  console.log('\nFAIL: an animal is not aligned to the surface it stands on.');
  failures++;
}
if (!steep.length) {
  console.log('\nWARNING: no animal was on steep ground, so roll was not really exercised.');
}
if (footWorst > 0.2) {
  console.log('\nFAIL: an animal is floating above or sunk into the ground.');
  failures++;
}

// 10. The fox keeps its distance even from a walking camera.
console.log('\nwalking straight at a bold fox for 15 s at 4 m/s:');
if (!result.foxChase) {
  console.log('  no bold fox found - inconclusive');
} else {
  console.log(`  it never let the camera closer than ${result.foxChase.minDist.toFixed(2)} m (${result.foxChase.site})`);
  if (result.foxChase.minDist < 3) {
    console.log('\nFAIL: the fox was walked into - curious but not stupid, and this is stupid.');
    failures++;
  }
}

// 11. The squirrel gives up a trunk once the camera reaches it.
console.log('\nwalking up to the trunk a squirrel hid behind:');
if (!result.bailout) {
  console.log('  no squirrel got behind a tree - inconclusive');
} else {
  const b = result.bailout;
  console.log(`  ${b.id} moved to a trunk ${b.treeMovedM?.toFixed(1)} m away, ending ${b.awayFromOldTreeM?.toFixed(1)} m from the old one`);
  console.log(`  still shielded by its new tree: ${b.stillShielded}, camera ${b.camDistM?.toFixed(1)} m off`);
  if (!(b.treeMovedM > 4)) {
    console.log('\nFAIL: the squirrel stayed at the same trunk with the camera on top of it.');
    failures++;
  }
  if (b.stillShielded === false) {
    console.log('\nFAIL: the squirrel bailed out but ended up in the open.');
    failures++;
  }
}

// 8. CPU tree lattice == the trees the GPU is given.
console.log('\nnearestTree() vs the vegetation mesh\'s own aOffset buffer:');
for (const c of result.latticeCheck) {
  console.log(`  probe (${c.probe.join(', ')}): brute force ${c.bruteDist.toFixed(3)} m, module ${c.gotDist.toFixed(3)} m, apart by ${c.offsetM.toFixed(6)} m, same instance: ${c.sameIndex}`);
  if (c.offsetM > 1e-6 || !c.sameIndex) {
    console.log('\nFAIL: the CPU lattice does not agree with the trees the shader draws - squirrels would hide behind nothing.');
    failures++;
  }
}

if (problems.length) console.log(`\nPage problems:\n  ${problems.join('\n  ')}`);
if (failures || problems.length) process.exit(1);
console.log('\nWildlife is placed by real habitat, stands on the drawn terrain, is deterministic, walks,'
  + '\nand reacts in character: ibex retreat, bold foxes approach, squirrels get behind a real trunk.');
