#!/usr/bin/env node
// Checks the birds (src/birds.js, 2026-08-05): that each species is where its
// species would be, at a height that makes sense, moving the way it should, and
// rare where the user asked for rare.
//
// The interesting assertions are the ones a screenshot could never make:
//
//   - a soaring raptor's bank angle against the coordinated-turn formula
//     atan(v^2 / (r g)). That is not a look, it is the physics of a turn, and it
//     is a number, so it can be checked rather than admired.
//   - that circling actually gains height, and gliding actually loses it.
//   - that a thermal is over a RIDGE: the site's own exposure measure, plus a
//     re-derivation from the terrain sampler here, so the test does not simply
//     believe the module.
//   - that chough flocks sit on real passes and huts, by name.
//   - that the sky is mostly empty, sampled over the whole park.
//
// Usage: tools/dev/start-dev.sh && node tools/test-birds.mjs

import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:5173';

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 480, height: 320 } });
const problems = [];
page.on('pageerror', (err) => problems.push(err.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') problems.push(msg.text());
});
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForFunction(() => {
  const text = document.getElementById('nav-position')?.textContent ?? '';
  return /alt \d+ m/.test(text) && !text.includes('alt 3000 m') && window.__pngp?.getBirds?.();
}, null, { timeout: 120000 });

const result = await page.evaluate(async () => {
  const p = window.__pngp;
  const birds = p.getBirds();
  const ground = p.controls.getGroundHeight;
  const poi = p.getPoiIndex().manifest.pois;

  // Drive the simulation from here rather than waiting on real frames: headless
  // frame timing has been wrong about this project four times, and a fixed step is
  // both faster and exactly reproducible.
  const STEP = 1 / 30;
  function run(seconds, camera = p.camera) {
    const frames = Math.round(seconds / STEP);
    for (let i = 0; i < frames; i++) birds.update(STEP, camera);
  }

  function standAt(x, z, agl = 1.7) {
    const g = ground(x, z);
    p.camera.position.set(x, g + agl, z);
    p.camera.updateMatrixWorld();
    return g;
  }

  // Same four-sample ridge measure the module uses, re-derived here so the test is
  // not simply trusting the number the module handed it.
  function exposureAt(x, z) {
    const g = ground(x, z);
    const R = 140;
    let sum = 0;
    for (const [dx, dz] of [[R, 0], [-R, 0], [0, R], [0, -R]]) sum += ground(x + dx, z + dz);
    const rel = g - sum / 4;
    const t = Math.min(1, Math.max(0, rel / 60));
    return t * t * (3 - 2 * t);
  }

  const out = { stats: birds.stats, species: birds.species };

  // --- 1. Go and find one of each, using the same helper the dev key uses ----
  out.found = {};
  for (const name of birds.species) {
    const found = birds.findNearest(name, p.camera.position.x, p.camera.position.z);
    out.found[name] = found
      ? { distanceKm: found.distanceM / 1000, site: found.site ?? null }
      : null;
  }

  // --- 2. A soaring eagle: bank, climb, and the ridge under the thermal -----
  const eagleSite = birds.findNearest('eagle', p.camera.position.x, p.camera.position.z);
  out.eagle = null;
  if (eagleSite) {
    standAt(eagleSite.x + 200, eagleSite.z + 200);
    run(4);
    let rows = birds.snapshot().filter((r) => r.species === 'eagle');
    const first = rows[0];
    if (first) {
      const startY = first.y;
      const startMode = first.mode;
      // Watch one individual for a while: it must climb while circling, and at
      // some point top out and leave on a glide.
      let sawCircle = false;
      let sawGlide = false;
      let maxAgl = -Infinity;
      let minAgl = Infinity;
      const banks = [];
      const predicted = [];
      for (let i = 0; i < 420; i++) {
        run(1);
        const r = birds.snapshot().find((row) => row.id === first.id);
        if (!r) break;
        if (r.mode === 'circle') {
          sawCircle = true;
          banks.push(Math.abs(r.bankDeg));
          // atan(v^2 / (r g)), in degrees, from the numbers the snapshot reports.
          // From the GROUND speed: the climb component plays no part in balancing a
          // turn, and using the 3-D airspeed left a 0.13 deg discrepancy that was
          // the test's error rather than the code's.
          predicted.push(Math.atan((r.groundSpeedMps * r.groundSpeedMps) / (r.radiusM * 9.81)) * 180 / Math.PI);
        }
        if (r.mode === 'glide') sawGlide = true;
        maxAgl = Math.max(maxAgl, r.aglM);
        minAgl = Math.min(minAgl, r.aglM);
      }
      const now = birds.snapshot().find((row) => row.id === first.id);
      out.eagle = {
        id: first.id,
        startMode,
        startY,
        sawCircle,
        sawGlide,
        maxAglM: maxAgl,
        minAglM: minAgl,
        meanBankDeg: banks.reduce((a, b) => a + b, 0) / Math.max(1, banks.length),
        meanPredictedBankDeg: predicted.reduce((a, b) => a + b, 0) / Math.max(1, predicted.length),
        worstBankErrorDeg: Math.max(...banks.map((b, i) => Math.abs(b - predicted[i]))),
        siteExposureReported: first.exposure,
        siteExposureRederived: exposureAt(first.siteX, first.siteZ),
        groundM: now?.groundM ?? null,
        speedMps: now?.speedMps ?? null,
      };
    }
  }

  // --- 3. Chough flocks live on named places, and are bold ------------------
  const flockSite = birds.findNearest('chough', p.camera.position.x, p.camera.position.z);
  out.chough = null;
  if (flockSite) {
    // Stand well back first: undisturbed, the flock should be orbiting its col.
    standAt(flockSite.x + 260, flockSite.z + 260);
    run(6);
    const far = birds.snapshot().find((r) => r.species === 'chough' && r.site === flockSite.site);
    // Then walk up to it.
    standAt(flockSite.x + 25, flockSite.z + 25);
    run(12);
    const near = birds.snapshot().find((r) => r.species === 'chough' && r.site === flockSite.site);
    // Is the anchor a real POI of the right kind, by name?
    const named = poi.find((q) => q.name === flockSite.site);
    out.chough = {
      site: flockSite.site,
      category: named?.category ?? null,
      poiElevationM: named?.elevationM ?? null,
      anchorOffsetM: named
        ? Math.hypot(named.local.x - flockSite.x, named.local.z - flockSite.z)
        : null,
      members: far?.members ?? null,
      farAglM: far?.aglM ?? null,
      farInspecting: far?.inspecting ?? null,
      nearInspecting: near?.inspecting ?? null,
      nearCamDistM: near?.camDistM ?? null,
      nearAglM: near?.aglM ?? null,
      drawn: near?.drawn ?? 0,
    };
    // Every flock in the snapshot must be anchored on a pass or a hut.
    const allFlocks = birds.snapshot().filter((r) => r.species === 'chough');
    out.chough.allOnNamedPlaces = allFlocks.every((r) => ['pass', 'hut'].includes(r.category));
    out.chough.lowestSiteM = Math.min(...allFlocks.map((r) => r.siteElevationM ?? Infinity));
  }

  // --- 4. Nutcracker: over the wood, undulating, and it leaves when disturbed
  const nutSite = birds.findNearest('nutcracker', p.camera.position.x, p.camera.position.z);
  out.nutcracker = null;
  if (nutSite) {
    standAt(nutSite.x + 120, nutSite.z + 120);
    run(5);
    let row = birds.snapshot().find((r) => r.species === 'nutcracker');
    if (row) {
      const ys = [];
      const canopies = [];
      const agls = [];
      for (let i = 0; i < 90; i++) {
        run(0.4);
        const r = birds.snapshot().find((x) => x.id === row.id);
        if (!r) break;
        ys.push(r.y);
        agls.push(r.aglM);
        canopies.push(r.canopy);
      }
      // Now walk right up to it and see whether it leaves.
      const before = birds.snapshot().find((r) => r.id === row.id);
      standAt(before.x + 12, before.z + 12);
      const startDist = Math.hypot(before.x - p.camera.position.x, before.z - p.camera.position.z);
      run(6);
      const after = birds.snapshot().find((r) => r.id === row.id);
      out.nutcracker = {
        id: row.id,
        meanAglM: agls.reduce((a, b) => a + b, 0) / agls.length,
        minAglM: Math.min(...agls),
        // The undulation is in the height ABOVE GROUND. Measured against absolute y
        // it read 38 m, which was the hillside it was crossing, not the bird.
        undulationM: Math.max(...agls) - Math.min(...agls),
        absoluteYSpreadM: Math.max(...ys) - Math.min(...ys),
        meanCanopy: canopies.reduce((a, b) => a + b, 0) / canopies.length,
        minCanopy: Math.min(...canopies),
        flushStartM: startDist,
        flushEndM: after ? Math.hypot(after.x - p.camera.position.x, after.z - p.camera.position.z) : null,
      };
    }
  }

  // --- 5. Rarity: how much is in the sky, sampled across the whole park -----
  const samples = [];
  let raptorFrames = 0;
  let raptorTotal = 0;
  for (let i = 0; i < 40; i++) {
    // A deterministic sweep of the inner bbox rather than random points.
    const x = -30000 + (60000 * i) / 39;
    const z = -12000 + 24000 * ((i * 7) % 40) / 39;
    const g = ground(x, z);
    if (!Number.isFinite(g)) continue;
    standAt(x, z);
    run(2.5);
    const rows = birds.snapshot();
    const raptors = rows.filter((r) => (r.species === 'eagle' || r.species === 'vulture')
      && r.camDistM < 1900);
    raptorTotal += raptors.length;
    if (raptors.length) raptorFrames++;
    samples.push({ groundM: Math.round(g), raptors: raptors.length });
  }
  out.rarity = {
    positions: samples.length,
    withARaptorInRange: raptorFrames,
    meanRaptorsInRange: raptorTotal / Math.max(1, samples.length),
    maxRaptorsAtOnce: Math.max(...samples.map((s) => s.raptors)),
  };

  // --- 6. Cost: the whole population, stepped and drawn --------------------
  standAt(0, 0);
  run(3);
  const t0 = performance.now();
  const FRAMES = 240;
  for (let i = 0; i < FRAMES; i++) birds.update(STEP, p.camera);
  out.msPerFrame = (performance.now() - t0) / FRAMES;
  out.population = birds.snapshot().length;

  return out;
});

await browser.close();

const {
  stats, species, found, eagle, chough, nutcracker, rarity, msPerFrame, population,
} = result;

console.log(`Species: ${species.join(', ')}`);
console.log(`Triangles per bird: ${JSON.stringify(stats.trianglesPerBird)}`);
console.log(`Chough sites available (passes + huts above 1900 m): ${stats.flockSites}\n`);

console.log('Nearest of each, from the spawn:');
for (const [name, f] of Object.entries(found)) {
  console.log(`  ${name.padEnd(11)}: ${f ? `${f.distanceKm.toFixed(1)} km away${f.site ? ` (${f.site})` : ''}` : 'none found'}`);
}

if (eagle) {
  console.log('\nA golden eagle, watched for 420 s:');
  console.log(`  circled: ${eagle.sawCircle} · glided: ${eagle.sawGlide}`);
  console.log(`  height above ground ranged ${eagle.minAglM.toFixed(0)}-${eagle.maxAglM.toFixed(0)} m`
    + ` at ${eagle.speedMps?.toFixed(1)} m/s`);
  console.log(`  bank while circling: measured ${eagle.meanBankDeg.toFixed(2)}°,`
    + ` coordinated-turn prediction ${eagle.meanPredictedBankDeg.toFixed(2)}°,`
    + ` worst error ${eagle.worstBankErrorDeg.toFixed(4)}°`);
  console.log(`  the thermal's ridge: module says exposure ${eagle.siteExposureReported?.toFixed(2)},`
    + ` re-derived here ${eagle.siteExposureRederived.toFixed(2)}`);
}

if (chough) {
  console.log('\nA chough flock:');
  console.log(`  anchored on "${chough.site}" (${chough.category}, ${Math.round(chough.poiElevationM)} m),`
    + ` ${chough.anchorOffsetM?.toFixed(1)} m from the POI itself`);
  console.log(`  ${chough.members} birds, centre ${chough.farAglM?.toFixed(0)} m above the col when left alone`);
  console.log(`  approached: inspecting ${chough.farInspecting} -> ${chough.nearInspecting},`
    + ` centre now ${chough.nearCamDistM?.toFixed(1)} m from the camera, ${chough.nearAglM?.toFixed(0)} m up`);
  console.log(`  every flock on a pass or a hut: ${chough.allOnNamedPlaces},`
    + ` lowest site ${Math.round(chough.lowestSiteM)} m`);
}

if (nutcracker) {
  console.log('\nA nutcracker:');
  console.log(`  ${nutcracker.meanAglM.toFixed(1)} m above the ground on average`
    + ` (never below ${nutcracker.minAglM.toFixed(1)} m, the tallest tree is 16 m)`);
  console.log(`  undulated over ${nutcracker.undulationM.toFixed(1)} m of height above ground`
    + ` (absolute y moved ${nutcracker.absoluteYSpreadM.toFixed(0)} m - that is the hillside, not the bird)`);
  console.log(`  canopy underneath: mean ${nutcracker.meanCanopy.toFixed(2)}, lowest ${nutcracker.minCanopy.toFixed(2)}`);
  console.log(`  walked up to at ${nutcracker.flushStartM.toFixed(1)} m -> it moved to`
    + ` ${nutcracker.flushEndM?.toFixed(1)} m`);
}

console.log('\nRarity, over a sweep of the park:');
console.log(`  ${rarity.withARaptorInRange}/${rarity.positions} viewpoints had a raptor within draw distance`);
console.log(`  mean ${rarity.meanRaptorsInRange.toFixed(2)} raptors in range, most at once ${rarity.maxRaptorsAtOnce}`);

console.log(`\nCost: ${population} birds simulated, ${msPerFrame.toFixed(3)} ms/frame`);

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

check(!!eagle, 'no golden eagle could be found anywhere in reach');
if (eagle) {
  check(eagle.sawCircle && eagle.sawGlide, 'the eagle never both circled and glided - the soaring model is not cycling');
  check(eagle.maxAglM > eagle.minAglM + 100, 'the eagle never gained meaningful height on a thermal');
  check(eagle.minAglM > 0, 'the eagle went underground');
  check(eagle.worstBankErrorDeg < 0.02, 'the bank angle does not match a coordinated turn');
  check(eagle.meanBankDeg > 10 && eagle.meanBankDeg < 40, 'the circling bank is not in the range a soaring bird uses');
  check(Math.abs(eagle.siteExposureReported - eagle.siteExposureRederived) < 0.05,
    'the thermal site\'s ridge exposure does not survive re-derivation from the terrain');
  check(eagle.siteExposureReported >= 0.35, 'the thermal is not over a ridge at all');
}

check(!!chough, 'no chough flock could be found');
if (chough) {
  check(['pass', 'hut'].includes(chough.category), 'the flock is not on a pass or a hut');
  check(chough.anchorOffsetM < 1, 'the flock is not anchored on its POI');
  check(chough.allOnNamedPlaces, 'some flock is somewhere other than a pass or a hut');
  check(chough.lowestSiteM >= 1900, 'a flock is below the elevation choughs actually use');
  check(chough.farInspecting === false && chough.nearInspecting === true,
    'the flock does not notice a walker, or notices one 260 m away');
  check(chough.nearCamDistM > 8 && chough.nearCamDistM < 30,
    'the flock did not hold a plausible standoff distance from the camera');
  check(chough.drawn > 0, 'no chough was drawn while standing next to the flock');
}

check(!!nutcracker, 'no nutcracker could be found');
if (nutcracker) {
  check(nutcracker.minAglM > 16, 'the nutcracker flew lower than the tallest tree');
  check(nutcracker.undulationM > 4 && nutcracker.undulationM < 10,
    'the undulating flight is missing, or is not the amplitude the table asks for');
  // The mean, not the minimum: crossing a clearing is what a nutcracker does, so
  // insisting every metre of the path is wooded tests the wrong thing.
  check(nutcracker.meanCanopy > 0.3, 'the nutcracker is not living over the wood');
  check(nutcracker.flushEndM > nutcracker.flushStartM + 10, 'the nutcracker did not move off when approached');
}

// The user asked for "rare, like a sighting", and this is the number that says
// whether that is what they got.
check(rarity.meanRaptorsInRange < 1.5, 'raptors are not rare - the sky is busy');
check(rarity.withARaptorInRange > 0, 'no raptor was visible from anywhere in the park - too rare to exist');
check(msPerFrame < 1.5, 'the birds cost more than a millisecond a frame');

if (problems.length) console.log(`\nPage problems:\n  ${problems.join('\n  ')}`);
if (failures.length) {
  console.log(`\n${failures.length} FAILURE(S):`);
  for (const f of failures) console.log(`  - ${f}`);
}
if (failures.length || problems.length) process.exit(1);
console.log('\nRaptors soar on real ridges and bank the way a turn requires, choughs live on named cols'
  + ' and come to look at you, the nutcracker undulates over the canopy, and the sky stays empty.');
