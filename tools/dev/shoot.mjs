#!/usr/bin/env node
// Screenshot the viewer standing at a named place, by driving the search box.
//
// Exists because tools/verify.mjs only ever shoots the spawn point (3918 m, up
// in the rock band), which is useless for looking at anything that happens at
// valley or treeline altitude - phase 6's vegetation, most obviously. Give it a
// place name exactly as the search box lists it.
//
// Headless is SwiftShader, so this is reliable for geometry, colour and layout
// but NOT for frame rate or overall brightness (it has misled on those four
// times - docs/PROGRESS.md). Real-browser checks stay the final word.
//
// Usage: tools/dev/start-dev.sh && node tools/dev/shoot.mjs "Cogne" [out.png] [--look=deg] [--pitch=deg]

import { chromium } from 'playwright';

const args = process.argv.slice(2);
const flags = new Map(
  args.filter((a) => a.startsWith('--')).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }),
);
const positional = args.filter((a) => !a.startsWith('--'));
const place = positional[0];
const outFile = positional[1] ?? `tools/dev/logs/shoot-${(place ?? 'spawn').replace(/[^\w]+/g, '-').toLowerCase()}.png`;
const url = flags.get('url') ?? 'http://localhost:5173';

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const problems = [];
page.on('pageerror', (err) => problems.push(`[pageerror] ${err.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') problems.push(`[console.error] ${msg.text()}`);
});

await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(4000); // terrain/poi/trails/water loaders

if (place) {
  // The search box flies on 'input' when the value matches a list label exactly
  // (src/main.js), so fill() is enough - no Enter needed.
  const options = await page.$$eval('#poi-search-list option', (els) => els.map((e) => e.value));
  const match = options.find((o) => o === place) ?? options.find((o) => o.toLowerCase().includes(place.toLowerCase()));
  if (!match) {
    console.error(`No search entry matches "${place}". Close ones: ${options.slice(0, 5).join(' | ')}`);
    await browser.close();
    process.exit(1);
  }
  await page.fill('#poi-search-input', match);
  await page.waitForTimeout(3000); // FLY_TO_DURATION_S plus settle
  console.log(`Flew to: ${match}`);
}

// Optional: rise to an elevated vantage and pitch down, which is the only way
// to judge anything that reads at landscape scale (forest cover, LOD, band
// transitions) rather than from inside a valley. Altitude is polled from the HUD
// rather than timed, since fly speed is controls.js's business, not ours.
const climb = Number(flags.get('climb') ?? NaN);
if (!Number.isNaN(climb)) {
  await page.mouse.click(700, 450); // pointer lock, so the keys reach the controls
  await page.waitForTimeout(200);
  const altOf = async () => {
    const text = (await page.textContent('#nav-position')) ?? '';
    return Number(text.match(/alt (-?\d+) m/)?.[1] ?? NaN);
  };
  const startAlt = await altOf();
  await page.keyboard.press('KeyF'); // walk -> fly
  await page.keyboard.down('Space');
  const deadline = Date.now() + 30000;
  let alt = startAlt;
  while (alt - startAlt < climb && Date.now() < deadline) {
    await page.waitForTimeout(250);
    alt = await altOf();
  }
  await page.keyboard.up('Space');
  console.log(`Climbed ${Math.round(alt - startAlt)} m (alt ${alt} m)`);
  const pitch = Number(flags.get('pitch') ?? 25);
  await page.mouse.move(700, 450 + pitch * 5); // roughly 0.2 deg per px at three's default sensitivity
  await page.waitForTimeout(600);
}

// Optional look direction, same mouse-based turn.
const look = Number(flags.get('look') ?? NaN);
if (!Number.isNaN(look)) {
  if (Number.isNaN(climb)) {
    await page.mouse.click(700, 450);
    await page.waitForTimeout(200);
  }
  await page.mouse.move(700 + look * 5, 450);
  await page.waitForTimeout(500);
}

// Explicit camera placement, for when the shot has to be repeatable to the
// metre - comparing two builds of a shader, most obviously, where "roughly the
// same view" is not good enough because the whole question is a pixel diff.
// The mouse-driven --look/--pitch above cannot do that: they are relative turns
// at a sensitivity that is controls.js's business.
//   --at=x,y,z --towards=x,y,z   (local metres, src/geo.js's frame)
const at = flags.get('at');
if (at) {
  const [ax, ay, az] = at.split(',').map(Number);
  const [tx, ty, tz] = (flags.get('towards') ?? '0,2000,0').split(',').map(Number);
  await page.evaluate(({ ax, ay, az, tx, ty, tz }) => {
    // Fly mode: walk mode re-clamps the camera to the ground every frame, which
    // would throw away the altitude before the shot is taken.
    window.__pngp.controls.mode = 'fly';
    window.__pngp.camera.position.set(ax, ay, az);
    window.__pngp.camera.lookAt(tx, ty, tz);
    window.__pngp.camera.updateMatrixWorld(true);
  }, { ax, ay, az, tx, ty, tz });
  await page.waitForTimeout(4000); // headless renders this scene at ~1 fps
  console.log(`Placed at (${ax}, ${ay}, ${az}) looking at (${tx}, ${ty}, ${tz})`);
}

// --models=0|1 drives the Models control before the shot (added 2026-08-17 for the
// high-detail flora/fauna option). Set BEFORE the wait below, because the near-tree set
// is refilled from the render loop and needs a frame to appear.
// --cover=0|0.2|0.5|1 drives the Ground cover control. Added 2026-08-17 to judge the
// basemap: the grass and scree scatter sits ON the imagery, so a shot at Lush answers
// "does the resolution show in practice" and a shot at Off answers "how much detail is
// in the photograph at all". Those are two different questions and both are wanted.
const cover = flags.get('cover');
if (cover !== undefined) {
  await page.evaluate((v) => {
    const sel = document.getElementById('env-groundcover');
    sel.value = String(v);
    sel.dispatchEvent(new Event('change'));
  }, cover);
  await page.waitForTimeout(2500);
  console.log(`Ground cover: ${cover}`);
}

const models = flags.get('models');
if (models !== undefined) {
  await page.evaluate((v) => {
    const sel = document.getElementById('env-models');
    sel.value = String(v);
    sel.dispatchEvent(new Event('change'));
  }, models);
  await page.waitForTimeout(5000); // headless is ~1 fps, so this is a few real frames
  console.log(`Models: ${models === '1' ? 'High' : 'Standard'}`);
}

const hud = await page.textContent('#nav-text').catch(() => '');
await page.screenshot({ path: outFile });
console.log(`HUD: ${hud.replace(/\s+/g, ' ').trim()}`);
console.log(`Screenshot: ${outFile}`);
if (problems.length) console.log(`\n${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
await browser.close();
