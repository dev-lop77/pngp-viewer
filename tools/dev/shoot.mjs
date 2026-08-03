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

// Optional look direction: A/D turn, so hold them for a computed time rather
// than moving the mouse (pointer lock isn't engaged here).
const look = Number(flags.get('look') ?? NaN);
if (!Number.isNaN(look)) {
  await page.mouse.click(700, 450); // engage pointer lock for mouselook
  await page.waitForTimeout(200);
  await page.mouse.move(700 + look * 5, 450); // roughly 0.2 deg per px at three's default sensitivity
  await page.waitForTimeout(500);
}

const hud = await page.textContent('#nav-text').catch(() => '');
await page.screenshot({ path: outFile });
console.log(`HUD: ${hud.replace(/\s+/g, ' ').trim()}`);
console.log(`Screenshot: ${outFile}`);
if (problems.length) console.log(`\n${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
await browser.close();
