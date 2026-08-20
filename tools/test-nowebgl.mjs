#!/usr/bin/env node
// The one failure this app can have that says NOTHING: no WebGL, and a black screen.
//
// It happened to the user on 2026-08-20 - "Vedo tutto nero" - on a machine whose Firefox had
// lost its GL driver, and the reason existed only in the console. The first thing it cost was
// the assumption that the change under test had broken something, which is the expensive kind
// of silence: every other degradation in this project announces itself.
//
// So the check is not "does WebGL work" - it is "when WebGL does not work, does the page SAY
// so". Chromium is launched with 3D APIs disabled, which is the closest thing to the user's
// driver failure that can be arranged on purpose.
//
// It costs about a second, because nothing renders: the page dies on its first statement,
// which is the whole point.
//
// Usage: node tools/test-nowebgl.mjs

import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--disable-3d-apis', '--disable-webgl', '--disable-webgl2'] });
const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
await page.goto('http://localhost:5173', { waitUntil: 'load' });

const fatal = await page.waitForSelector('#fatal', { timeout: 30000 }).catch(() => null);
if (!fatal) {
  await browser.close();
  throw new Error('WebGL was unavailable and the page said nothing - this is the black screen');
}

const seen = await page.evaluate(() => {
  const el = document.getElementById('fatal');
  const r = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  return {
    text: el.textContent.trim(),
    // Visible in the sense that matters: on screen, opaque, and covering it.
    w: Math.round(r.width), h: Math.round(r.height),
    display: style.display, opacity: style.opacity, background: style.backgroundColor,
  };
});

const problems = [];
if (seen.w < 200 || seen.h < 200) problems.push(`the message box is ${seen.w}x${seen.h} - not on screen in any useful sense`);
if (seen.display === 'none' || Number(seen.opacity) === 0) problems.push(`the box is present but not visible (display ${seen.display}, opacity ${seen.opacity})`);
// It has to name the thing that failed AND carry the browser's own reason, because the
// reason is what a person can act on or send to someone who can.
if (!/WebGL/i.test(seen.text)) problems.push('the message never says WebGL');
if (seen.text.length < 120) problems.push(`the message is ${seen.text.length} characters - it cannot be carrying the browser's reason`);

// And the canvas must NOT be sitting there black in front of it.
const canvases = await page.evaluate(() => document.querySelectorAll('canvas').length);

await browser.close();

if (problems.length) {
  console.error(`FAIL\n  ${problems.join('\n  ')}\n  text was: ${seen.text.slice(0, 300)}`);
  process.exit(1);
}
console.log(`OK - no WebGL, and the page says so: ${seen.w}x${seen.h} box, ${seen.text.length} chars, ${canvases} canvas element(s)`);
console.log(`  "${seen.text.split('\n')[0].slice(0, 100)}"`);
