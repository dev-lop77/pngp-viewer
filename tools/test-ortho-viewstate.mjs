#!/usr/bin/env node
// The orthophoto's switch has FOUR ways in - the checkbox, the 'O' key, a shared link and the
// browser's stored state - and the user asked for the last two by name (2026-08-20). Four
// entry points to one piece of state is where things quietly disagree, so this holds them
// together.
//
// It is a state test, not a rendering one: nothing here judges how the photograph looks. It
// costs about twenty seconds because it reloads the page twice, which is the only honest way
// to test "and it is still on when you come back".
//
// Usage: node tools/test-ortho-viewstate.mjs

import { chromium } from 'playwright';

const URL = 'http://localhost:5173';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
// One context throughout: localStorage is the thing under test in half of this.
const context = await browser.newContext({ viewport: { width: 800, height: 500 } });
const page = await context.newPage();
// This page loads 31 MB and a software rasteriser draws it at about 1 fps, so the default
// 30 s navigation timeout is not a failure signal here - it is just the default.
page.setDefaultNavigationTimeout(180000);
const problems = [];
page.on('pageerror', (e) => problems.push(`[pageerror] ${e.message}`));

const ready = async () => {
  await page.waitForFunction(() => window.__pngp?.getGroundHeight?.(), null, { timeout: 180000 });
  await page.waitForTimeout(1500);
};
const state = () => page.evaluate(() => ({
  checked: document.getElementById('env-ortho').checked,
  mix: window.__pngp.ortho.mix.value,
  cells: window.__pngp.ortho.stats.cells,
}));

// 1. Off by default, and NOTHING fetched. The second half is the whole proposition.
await page.goto(URL, { waitUntil: 'load' });
const fetched = [];
page.on('request', (r) => { if (/\/data\/ortho/.test(r.url())) fetched.push(r.url()); });
await ready();
let s = await state();
if (s.checked || s.mix !== 0) problems.push(`default is not off: ${JSON.stringify(s)}`);
if (fetched.length) problems.push(`${fetched.length} orthophoto request(s) before anything asked: ${fetched[0]}`);

// 2. The checkbox turns it on, and the atlas actually fills.
await page.click('#env-ortho');
await page.waitForFunction(() => window.__pngp.ortho.mix.value === 1, null, { timeout: 120000 }).catch(() => {});
s = await state();
if (!s.checked || s.mix !== 1) problems.push(`the checkbox did not switch it on: ${JSON.stringify(s)}`);
if (s.cells < 1) problems.push('switched on but the atlas holds no sheets');
if (!fetched.length) problems.push('switched on and nothing was fetched');

// 3. The key is a shortcut for the control, not a second opinion.
await page.keyboard.press('o');
await page.waitForTimeout(500);
s = await state();
if (s.checked || s.mix !== 0) problems.push(`'O' did not turn it off through the control: ${JSON.stringify(s)}`);
await page.keyboard.press('o');
await page.waitForFunction(() => window.__pngp.ortho.mix.value === 1, null, { timeout: 60000 }).catch(() => {});
s = await state();
if (!s.checked) problems.push("'O' did not turn it back on");

// 4. It is in the shared link.
const hash = await page.evaluate(() => window.__pngp.buildHash(window.__pngp.captureViewState()));
if (!/ortho=1/.test(hash)) problems.push(`the link does not carry it: ${hash}`);

// A REAL reload. page.goto() to a URL that differs only in its hash is a same-document
// navigation - nothing re-runs, window.__pngp survives, and the checkbox is still whatever
// the last step left it. The first version of this test did exactly that and step 5 passed
// while measuring the previous page.
const reload = async (url) => {
  await page.goto('about:blank');
  await page.goto(url, { waitUntil: 'load' });
  await ready();
};

// 5. And it comes back from the browser's own storage, with no hash at all.
await reload(URL);
await page.waitForFunction(() => document.getElementById('env-ortho').checked, null, { timeout: 120000 }).catch(() => {});
s = await state();
if (!s.checked || s.mix !== 1) problems.push(`not restored from storage: ${JSON.stringify(s)}`);

// 6. A link that says OFF wins over a storage that says on - the link describes the view.
await reload(`${URL}/#at=45.52746,7.20238,1991&look=262,-45&mode=fly&ortho=0`);
await page.waitForTimeout(2000);
s = await state();
if (s.checked || s.mix !== 0) problems.push(`a link saying ortho=0 did not win over storage: ${JSON.stringify(s)}`);

await browser.close();
if (problems.length) {
  console.error(`FAIL\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`OK - off by default and nothing fetched, the checkbox and 'O' agree,`
  + ` ortho=1 rides in the link, and it survives a reload from storage`);
