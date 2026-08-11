#!/usr/bin/env node
// Guards which keystrokes reach the camera and which belong to the page
// (src/controls.js's isTypingTarget), after the user reported on 2026-08-11 that
// changing the time of day or the weather killed W/A/S/D until they clicked the
// scene again.
//
// The cause was one predicate treating every `INPUT` and `SELECT` as "somebody is
// typing": the time slider is an `<input type="range">` and the weather picker is
// a `<select>`, so touching either one silently swallowed the movement keys, and
// clicking the scene is what moved the focus and appeared to fix it. Two controls
// (the credits button, the sound checkbox) had already been patched one at a time
// with a blur() and the other two were missed - which is exactly why this is now
// asserted rather than patched a third time.
//
// Every case here drives the REAL page: the movement keys work without pointer
// lock, so nothing may click the canvas - that would move the focus and destroy
// the very condition under test. Each case therefore asserts the focus it
// believes it has set, because a test that reproduces nothing passes for free.
//
// Usage: tools/dev/start-dev.sh && node tools/test-controls-focus.mjs

import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:5173';
const MOVED_M = 1; // a second of walking is ~4 m; this only has to beat nothing

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
const problems = [];
page.on('pageerror', (err) => problems.push(err.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') problems.push(msg.text());
});

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForFunction(() => window.__pngp !== undefined, null, { timeout: 60000 });
await page.waitForTimeout(1500);

const state = () =>
  page.evaluate(() => ({
    x: window.__pngp.camera.position.x,
    z: window.__pngp.camera.position.z,
    mode: window.__pngp.controls.mode,
    focus: document.activeElement?.id || document.activeElement?.tagName || null,
    weather: document.getElementById('env-weather').value,
    search: document.getElementById('poi-search-input').value,
  }));

// Hold a key for long enough that the animation loop - 1 fps under SwiftShader -
// gets several frames to move the camera in.
async function hold(code, ms = 1600) {
  await page.keyboard.down(code);
  await page.waitForTimeout(ms);
  await page.keyboard.up(code);
  await page.waitForTimeout(300);
}

const cases = [];
async function walked(name, setup, { expectMove = true, expectFocus = null } = {}) {
  await setup();
  const before = await state();
  await hold('KeyW');
  const after = await state();
  const distance = Math.hypot(after.x - before.x, after.z - before.z);
  cases.push({
    name,
    focus: before.focus,
    expectFocus,
    focusOk: expectFocus === null || before.focus === expectFocus,
    distance,
    expectMove,
    ok: (distance > MOVED_M) === expectMove && (expectFocus === null || before.focus === expectFocus),
    weatherBefore: before.weather,
    weatherAfter: after.weather,
    search: after.search,
  });
}

// 1. Baseline: nothing focused. If this fails, nothing below means anything.
await walked('nothing focused', async () => {
  await page.evaluate(() => document.activeElement?.blur?.());
});

// 2. The reported bug: pick a weather, then walk. Playwright's selectOption
//    does NOT leave the element focused (checked - the first version of this test
//    reported focus BODY and so reproduced nothing at all), while a real click on
//    a native <select> does. Focus is therefore set explicitly, and asserted: the
//    condition under test is "the picker has focus", not how it got it.
await walked('after changing the weather', async () => {
  await page.selectOption('#env-weather', '1'); // Drifting clouds
  await page.focus('#env-weather');
}, { expectFocus: 'env-weather' });

// 3. The other half of it: the time-of-day slider.
await walked('after moving the time slider', async () => {
  await page.focus('#env-time');
  await page.evaluate(() => {
    const el = document.getElementById('env-time');
    el.value = '0.35';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}, { expectFocus: 'env-time' });

// 4. The sound checkbox, which blurs itself on purpose (Space is a movement key
//    and also toggles a focused checkbox), so the walk must work after it too.
await walked('after toggling the sound checkbox', async () => {
  await page.click('#env-audio');
});

// 5. What the guard is FOR: typing a place name must not walk the park. This is
//    the case that must keep failing to move, and the one a careless widening of
//    the predicate would break.
await walked('while typing in the search box', async () => {
  await page.focus('#poi-search-input');
  await page.evaluate(() => { document.getElementById('poi-search-input').value = ''; });
  await page.keyboard.type('Cogn');
}, { expectMove: false, expectFocus: 'poi-search-input' });
// The held W landed in the box as a character, which is the positive half of the
// same claim: the key was not eaten, it went where the typing was going.
const typedWhileWalking = (await state()).search;

// 6. Type-ahead: with the weather picker focused, 'S' matches "Snowfall". The
//    movement handler cancels the key, so walking backwards must NOT change the
//    weather - the assumption the fix rests on, checked rather than assumed.
await page.evaluate(() => document.getElementById('poi-search-input').blur());
await page.selectOption('#env-weather', '0');
await page.focus('#env-weather');
const beforeTypeAhead = await state();
await hold('KeyS');
const afterTypeAhead = await state();
const typeAhead = {
  focus: beforeTypeAhead.focus,
  weatherBefore: beforeTypeAhead.weather,
  weatherAfter: afterTypeAhead.weather,
  distance: Math.hypot(afterTypeAhead.x - beforeTypeAhead.x, afterTypeAhead.z - beforeTypeAhead.z),
};
typeAhead.ok =
  beforeTypeAhead.focus === 'env-weather' &&
  typeAhead.weatherAfter === typeAhead.weatherBefore &&
  typeAhead.distance > MOVED_M;

await browser.close();

let failures = 0;
console.log('Which keystrokes reach the camera:\n');
for (const c of cases) {
  if (!c.ok) failures++;
  const want = c.expectMove ? 'should walk' : 'should NOT walk';
  console.log(
    `${c.ok ? 'PASS' : 'FAIL'} ${c.name.padEnd(34)} focus ${String(c.focus).padEnd(18)}` +
      ` moved ${c.distance.toFixed(1).padStart(6)} m  (${want})`,
  );
  if (!c.focusOk) {
    console.log(`       ^ the case did not reproduce: focus was ${c.focus}, expected ${c.expectFocus}`);
  }
}
console.log(
  `\n${typeAhead.ok ? 'PASS' : 'FAIL'} 'S' with the weather picker focused: walked` +
    ` ${typeAhead.distance.toFixed(1)} m and left the weather on "${typeAhead.weatherAfter}"` +
    ` (was "${typeAhead.weatherBefore}", focus ${typeAhead.focus})`,
);
if (!typeAhead.ok) failures++;
const typedOk = typedWhileWalking.startsWith('Cogn') && typedWhileWalking.includes('w');
console.log(
  `${typedOk ? 'PASS' : 'FAIL'} the search box got the characters instead of the camera: ` +
    `"${typedWhileWalking}" (the trailing w is the held movement key, and belongs there)`,
);
if (!typedOk) failures++;

if (problems.length) console.log(`\nPage problems:\n  ${problems.join('\n  ')}`);
if (failures || problems.length) {
  console.log(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\nThe movement keys survive every control except the one somebody is typing into.');
