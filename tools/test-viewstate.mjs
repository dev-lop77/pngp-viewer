#!/usr/bin/env node
// Checks saving, restoring and sharing the view (src/viewstate.js, 2026-08-05).
//
// This is deliberately an end-to-end test rather than a serialisation one. The
// format round-tripping is the easy half; what actually has to hold is the
// contract the user agreed to:
//
//   - reload and you are where you left off, with the time, weather and mode
//     you left - and NOT at the default spawn;
//   - a link beats the stored position, and is then consumed, so a later reload
//     follows the autosave again instead of being pinned to that link;
//   - the sound setting persists as a preference and never travels in a link;
//   - a corrupt or out-of-map stored record cannot break the viewer - it falls
//     back to Le Pont, which is the difference between a bad restore and an app
//     that is broken on every single load;
//   - "back to Le Pont" really goes back, and the autosave does not immediately
//     drag you where you were.
//
// Precision is measured rather than assumed: 5 decimals of latitude is ~1.1 m,
// so the test reports the actual metres of round-trip error.
//
// Usage: tools/dev/start-dev.sh && node tools/test-viewstate.mjs
//
// A DEV server, not preview and not the live site: this reads window.__pngp, which
// only exists under import.meta.env.DEV, so pointing it at the deployed viewer
// fails with "Cannot read properties of undefined". To check the deployed site,
// drive the UI instead - the HUD position readout, the copy-link and back-to-Le-Pont
// buttons and a reload are enough to cover the whole contract without the handle.

import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:5173';

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: 640, height: 400 } });
const page = await context.newPage();
const problems = [];
page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') problems.push(`console: ${msg.text()}`);
});

// The viewer is up once the spawn has replaced the 3,000 m placeholder.
//
// TEN MINUTES, and the number is measured rather than padded. This test opens a SECOND page
// in the same context to follow a shared link, and two WebGL contexts on one software
// rasteriser do not share it evenly: measured 2026-08-20, the first page spawns in 13 s and
// the second in 528 - forty times slower, with the first still alive and drawing. The old
// 120 s was fine when this test was written and had quietly stopped being fine; the test had
// not run in long enough for anyone to notice, which is its own lesson about a slow list.
//
// bringToFront() on the second page does NOT help - it was tried, and timed out at 240 s - so
// this is contention for the rasteriser and not tab priority. It is the §13.11 case: headless
// is SwiftShader, and nothing here says anything about two tabs on a real GPU.
async function waitForSpawn(target = page) {
  await target.waitForFunction(() => {
    const text = document.getElementById('nav-position')?.textContent ?? '';
    return /alt \d+ m/.test(text) && !text.includes('alt 3000 m');
  }, null, { timeout: 600000 });
  // One more frame so the HUD and the autosave baseline have both run.
  await target.waitForTimeout(300);
}

function readView(target = page) {
  return target.evaluate(() => {
    const p = window.__pngp;
    return {
      x: p.camera.position.x,
      y: p.camera.position.y,
      z: p.camera.position.z,
      heading: Number(document.getElementById('nav-heading').textContent.match(/(\d+)°/)?.[1] ?? -1),
      mode: p.controls.mode,
      time: p.lighting.fraction,
      timeSlider: Number(document.getElementById('env-time').value),
      sky: window.__pngp.scene ? document.getElementById('env-weather').value : null,
      sound: p.audio.enabled,
      soundBox: document.getElementById('env-audio').checked,
      hash: window.location.hash,
      stored: (() => {
        try {
          return JSON.parse(localStorage.getItem('pngp.viewer.v1'));
        } catch {
          return null;
        }
      })(),
    };
  });
}

const results = {};

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
await waitForSpawn();
results.firstVisit = await readView();

// Move somewhere else entirely, in fly mode, at a different time of day, in a
// storm, with the sound off - i.e. change every field the state carries.
// The altitude is sampled from the terrain rather than hardcoded: the first
// version of this test flew to a fixed 2,600 m at a spot where the ground is
// 2,835 m, and the restore correctly lifted the camera clear of the rock - which
// looked like a failure to restore the altitude and was in fact the floor doing
// its job.
await page.evaluate(() => {
  const p = window.__pngp;
  p.controls.mode = 'fly';
  const ground = p.controls.getGroundHeight(-8000, 9000);
  p.camera.position.set(-8000, ground + 300, 9000);
  p.camera.lookAt(-7000, ground + 250, 9600);
  document.getElementById('env-time').value = '0.62';
  document.getElementById('env-time').dispatchEvent(new Event('input'));
  document.getElementById('env-weather').value = '2';
  document.getElementById('env-weather').dispatchEvent(new Event('change'));
  document.getElementById('env-audio').checked = false;
  document.getElementById('env-audio').dispatchEvent(new Event('change'));
});
// Past the 2 s autosave interval.
await page.waitForTimeout(2600);
results.moved = await readView();

// Reload: this is the whole point of the feature.
await page.reload({ waitUntil: 'domcontentloaded' });
await waitForSpawn();
results.restored = await readView();

// Copy link, then check the hash it produced and that it wins over the stored
// state in a FRESH tab (same storage, different position stored).
const shared = await page.evaluate(() => {
  document.getElementById('copy-link').click();
  return new Promise((resolve) => setTimeout(() => resolve(window.location.hash), 200));
});
// Walk away from the shared spot and let the autosave overwrite the stored one,
// so "the link wins" is a real test rather than both agreeing.
await page.evaluate(() => {
  window.__pngp.camera.position.set(2000, 2200, -3000);
  window.__pngp.camera.lookAt(2600, 2100, -2400);
});
await page.waitForTimeout(2600);
results.afterMovingAgain = await readView();

const linkPage = await context.newPage();
linkPage.on('pageerror', (err) => problems.push(`pageerror(link): ${err.message}`));
await linkPage.goto(`${url}${shared}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await waitForSpawn(linkPage);
results.fromLink = await readView(linkPage);
await linkPage.close();

// A poisoned record must not break the viewer. Note the explicit goto rather than
// a reload: after "copy link" the address bar still holds that hash, and a reload
// would honour it - which is correct behaviour, and was the first version of this
// test measuring the link path while believing it measured the storage path.
await page.evaluate(() => {
  localStorage.setItem('pngp.viewer.v1', '{"v":1,"state":{"lat":"nonsense","lon":null,"alt":"x"}}');
});
await page.goto(url, { waitUntil: 'domcontentloaded' });
await waitForSpawn();
results.afterPoison = await readView();

// A record that is well-formed but points outside the DEM (Milan) - the height
// sampler clamps rather than failing, so only an explicit bbox test catches this.
await page.evaluate(() => {
  localStorage.setItem('pngp.viewer.v1', JSON.stringify({
    v: 1,
    state: { lat: 45.4642, lon: 9.19, alt: 120, heading: 0, pitch: 0, mode: 'walk', time: 0.2, sky: 'clear' },
  }));
});
await page.goto(url, { waitUntil: 'domcontentloaded' });
await waitForSpawn();
results.afterOffMap = await readView();

// "Back to Le Pont", and it must stick rather than being undone by the autosave.
await page.evaluate(() => {
  window.__pngp.camera.position.set(-8000, 2600, 9000);
});
await page.waitForTimeout(2600);
await page.evaluate(() => document.getElementById('reset-view').click());
await page.waitForTimeout(2600);
results.afterReset = await readView();
await page.goto(url, { waitUntil: 'domcontentloaded' });
await waitForSpawn();
results.afterResetReload = await readView();

// THE QUALITY CHOICES ARE PREFERENCES AND HAVE TO SURVIVE A RELOAD (2026-08-17).
// The user's report: "la scelta del livello di Terrain e Models non viene salvata nel
// browser." They were absent from the sanitiser, so they were dropped on the way to
// localStorage no matter what the page did with them.
//
// Terrain is deliberately set to Standard rather than to a finer level: it is the one
// value whose restore is observable without waiting on a download, and picking it also
// checks the case that matters most - a visitor who turned the tier OFF must not have
// 6.7 MB fetched for them again on the next visit.
const pickQuality = async (terrain, models, cover) => {
  await page.evaluate(({ terrain, models, cover }) => {
    for (const [id, v] of [['env-terrain', terrain], ['env-models', models], ['env-groundcover', cover]]) {
      const el = document.getElementById(id);
      el.value = String(v);
      el.dispatchEvent(new Event('change'));
    }
  }, { terrain, models, cover });
  await page.waitForTimeout(2600); // one autosave interval plus slack
};
const readQuality = () => page.evaluate(() => ({
  terrain: document.getElementById('env-terrain').value,
  models: document.getElementById('env-models').value,
  cover: document.getElementById('env-groundcover').value,
  stored: JSON.parse(localStorage.getItem('pngp.viewer.v1') ?? 'null')?.state ?? null,
}));

await pickQuality(0, 1, 0.2);
results.qualityPicked = await readQuality();
await page.goto(url, { waitUntil: 'domcontentloaded' });
await waitForSpawn();
results.qualityReloaded = await readQuality();

await browser.close();

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const distXZ = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

console.log('First visit (no stored state):');
console.log(`  at (${results.firstVisit.x.toFixed(0)}, ${results.firstVisit.z.toFixed(0)}),`
  + ` ${results.firstVisit.mode}, time ${results.firstVisit.time.toFixed(2)},`
  + ` sky ${results.firstVisit.sky}, sound ${results.firstVisit.sound}`);

console.log('\nMoved, then reloaded:');
console.log(`  moved to    (${results.moved.x.toFixed(0)}, ${results.moved.y.toFixed(0)}, ${results.moved.z.toFixed(0)})`
  + ` ${results.moved.mode}, heading ${results.moved.heading}°, time ${results.moved.time.toFixed(2)},`
  + ` sky ${results.moved.sky}, sound ${results.moved.sound}`);
console.log(`  came back at (${results.restored.x.toFixed(0)}, ${results.restored.y.toFixed(0)}, ${results.restored.z.toFixed(0)})`
  + ` ${results.restored.mode}, heading ${results.restored.heading}°, time ${results.restored.time.toFixed(2)},`
  + ` sky ${results.restored.sky}, sound ${results.restored.sound}`);
console.log(`  round trip: ${dist(results.moved, results.restored).toFixed(2)} m off`
  + ` (horizontally ${distXZ(results.moved, results.restored).toFixed(2)} m, 5 decimals of latitude is ~1.1 m)`);
console.log(`  and ${distXZ(results.restored, results.firstVisit).toFixed(0)} m from the default spawn`);

console.log('\nShared link:');
console.log(`  ${shared}`);
console.log(`  a fresh tab opened at (${results.fromLink.x.toFixed(0)}, ${results.fromLink.z.toFixed(0)}),`
  + ` ${distXZ(results.fromLink, results.restored).toFixed(2)} m from the shared spot,`
  + ` while the stored position was ${distXZ(results.afterMovingAgain, results.restored).toFixed(0)} m away`);
console.log(`  hash after load: "${results.fromLink.hash}" (consumed, so a reload follows the autosave again)`);
console.log(`  sound in the link: ${shared.includes('sound') || shared.includes('&s=') ? 'PRESENT' : 'absent'}`
  + `, and the fresh tab's sound is ${results.fromLink.sound} (the stored preference)`);

console.log('\nBad stored state:');
console.log(`  corrupt record  -> (${results.afterPoison.x.toFixed(0)}, ${results.afterPoison.z.toFixed(0)}),`
  + ` ${distXZ(results.afterPoison, results.firstVisit).toFixed(1)} m from the default spawn`);
console.log(`  off-map (Milan) -> (${results.afterOffMap.x.toFixed(0)}, ${results.afterOffMap.z.toFixed(0)}),`
  + ` ${distXZ(results.afterOffMap, results.firstVisit).toFixed(1)} m from the default spawn`);

console.log('\nBack to Le Pont:');
console.log(`  after the click : ${distXZ(results.afterReset, results.firstVisit).toFixed(1)} m from the default spawn, ${results.afterReset.mode}`);
console.log(`  after a reload  : ${distXZ(results.afterResetReload, results.firstVisit).toFixed(1)} m from the default spawn`);

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

// FROM poi.json, NOT FROM A NUMBER TYPED HERE. This read `{ x: -11370, z: 17570 }` until
// 2026-08-20 and had been wrong by 4.9 km since the bbox moved south on 2026-08-18: local
// metres are relative to the bbox centre, so every hardcoded pair in the tree went stale that
// day and this one was not caught because the test is slow and slow tests stop being run.
// The viewer spawns at this POI, so this is the same source it uses.
const lePont = (() => {
  const poi = JSON.parse(readFileSync('public/data/poi.json', 'utf8'));
  const found = [];
  (function walk(node) {
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (!node || typeof node !== 'object') return;
    if (node.name === 'Le Pont' && node.local) found.push(node);
    Object.values(node).forEach(walk);
  }(poi));
  if (!found.length) throw new Error('poi.json no longer has a POI called "Le Pont"');
  return found[0].local;
})();
check(distXZ(results.firstVisit, lePont) < 200,
  `the first visit no longer opens at the Le Pont trailhead`
  + ` (it is ${distXZ(results.firstVisit, lePont).toFixed(0)} m away)`);
check(distXZ(results.moved, results.restored) < 3,
  'the position was not restored to within the format\'s own precision');
check(Math.abs(results.restored.y - results.moved.y) < 3,
  'the altitude was not restored (fly mode has no ground clamp to fall back on)');
check(results.restored.mode === 'fly', 'walk/fly mode was not restored');
check(Math.abs(results.restored.time - results.moved.time) < 0.002, 'the time of day was not restored');
check(results.restored.timeSlider === results.moved.timeSlider, 'the time slider does not show the restored time');
check(results.restored.sky === results.moved.sky, 'the weather was not restored, or the select is out of step');
check(results.restored.sound === false && results.restored.soundBox === false,
  'the sound preference did not persist');
check(Math.abs(results.restored.heading - results.moved.heading) <= 1, 'the view direction was not restored');
check(distXZ(results.restored, results.firstVisit) > 1000,
  'the restore silently landed back at the default spawn');
check(/^#at=/.test(shared), 'copy link did not produce a hash in the documented format');
check(!/s(ound)?=/.test(shared.replace(/^#at=/, '')), 'the sound setting travelled in a shared link');
check(distXZ(results.fromLink, results.restored) < 3, 'a shared link did not open where it was made');
check(distXZ(results.fromLink, results.afterMovingAgain) > 1000,
  'the shared link lost to the stored position - an explicit link must win');
check(results.fromLink.hash === '', 'the hash was not consumed after being applied');
check(distXZ(results.afterPoison, results.firstVisit) < 5,
  'a corrupt stored record did not fall back to the default spawn');
check(distXZ(results.afterOffMap, results.firstVisit) < 5,
  'a stored position outside the DEM was restored anyway (the sampler clamps, so this needs a real bbox test)');
check(distXZ(results.afterReset, results.firstVisit) < 5, "'back to Le Pont' did not go back");
check(results.afterReset.mode === 'walk', "'back to Le Pont' left the camera in fly mode");
check(distXZ(results.afterResetReload, results.firstVisit) < 5,
  "the autosave undid 'back to Le Pont' - the reset must be what gets saved");

console.log('\nQuality choices across a reload:');
console.log(`  picked      terrain ${results.qualityPicked.terrain}, models ${results.qualityPicked.models},`
  + ` cover ${results.qualityPicked.cover}`);
console.log(`  stored      terrain ${results.qualityPicked.stored?.terrain}, models ${results.qualityPicked.stored?.models},`
  + ` cover ${results.qualityPicked.stored?.cover}`);
console.log(`  after load  terrain ${results.qualityReloaded.terrain}, models ${results.qualityReloaded.models},`
  + ` cover ${results.qualityReloaded.cover}`);
check(results.qualityPicked.stored?.terrain === 0 && results.qualityPicked.stored?.models === 1
  && results.qualityPicked.stored?.cover === 0.2,
  'the quality choices reach localStorage at all - they used to be dropped by the sanitiser');
check(results.qualityReloaded.terrain === '0' && results.qualityReloaded.models === '1'
  && results.qualityReloaded.cover === '0.2',
  'and every one of them is back on its control after a reload');

if (problems.length) console.log(`\nPage problems:\n  ${problems.join('\n  ')}`);
if (failures.length) {
  console.log(`\n${failures.length} FAILURE(S):`);
  for (const f of failures) console.log(`  - ${f}`);
}
if (failures.length || problems.length) process.exit(1);
console.log('\nThe viewer reopens where you left it, a link opens where it was made and wins once,'
  + ' the sound setting is a preference, and nothing a bad record can hold breaks the first load.');
