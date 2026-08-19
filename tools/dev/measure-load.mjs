#!/usr/bin/env node
// What a first visit actually costs, measured off the wire rather than added up
// from file sizes on disk.
//
// The difference is not pedantry. Every raster here is served compressed, the
// JSON heavily so, and `ls` reports neither - the last time this number was
// wanted (docs/PROGRESS-ARCHIVE.md, 2026-08-18) it was assembled by hand from HTTP
// content-lengths against the live site, which is right but is not something
// anyone will redo casually. This does the same thing against any URL, so a
// change that quietly adds four megabytes to the front page can be caught the
// day it lands instead of after a deploy.
//
// It reports what the browser DOWNLOADS, in the order it asks: the terrain tier
// is whichever level the quality control defaults to, and the basemap level is
// whichever one this GPU's MAX_TEXTURE_SIZE allows - headless SwiftShader may
// not pick the same one a real machine does, which is noted in the output
// rather than hidden.
//
// Usage:
//   npx vite build && npx vite preview --port 4173
//   node tools/dev/measure-load.mjs [--url=http://localhost:4173] [--wait=25000]

import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const flags = new Map(process.argv.slice(2)
  .filter((a) => a.startsWith('--'))
  .map((a) => {
    const body = a.replace(/^--/, '');
    const eq = body.indexOf('=');
    return eq === -1 ? [body, 'true'] : [body.slice(0, eq), body.slice(eq + 1)];
  }));
const url = flags.get('url') ?? 'http://localhost:4173';
const waitMs = Number(flags.get('wait') ?? 25000);

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

const seen = new Map(); // url -> bytes on the wire
const problems = [];
page.on('pageerror', (err) => problems.push(`[pageerror] ${err.message}`));
page.on('console', (msg) => { if (msg.type() === 'error') problems.push(`[console.error] ${msg.text()}`); });

// WHAT IS MEASURED, AND WHY IT IS NOT THE CONTENT-LENGTH. `vite preview` serves
// these files uncompressed, so its content-length for heightfield.bin is the raw
// 23 MB - while GitHub Pages sends the same file gzipped at less than half that.
// Reporting the local number would overstate the front page by more than ten
// megabytes and, worse, would move if the local server ever changed its mind.
//
// So the browser is used for the only thing it is authoritative about - WHICH
// files a first visit fetches, in what order, and which optional level it picks
// - and the size of each is taken from gzipping it here. That matches what a
// static host sends for anything compressible, and for the already-compressed
// formats (webp, png) gzip is a no-op, which is also what the host does.
page.on('response', (res) => {
  const u = res.url();
  if (!seen.has(u) && res.status() === 200) seen.set(u, res.request().method());
});

await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(waitMs); // the loaders fire after first paint

const detail = await page.evaluate(() => ({
  maxTexture: (() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    return gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : null;
  })(),
}));

await browser.close();

const ALREADY_COMPRESSED = /\.(webp|png|jpg|jpeg|avif|woff2?)$/i;
const rows = [];
for (const u of seen.keys()) {
  let name = u.replace(/^https?:\/\/[^/]+\//, '').replace(/\?.*$/, '') || 'index.html';
  // A PUBLISHED URL CARRIES THE PAGES SUB-PATH and the local dist/ does not, so
  // 'pngp-viewer/data/x.png' has to become 'data/x.png' or nothing matches and the whole
  // measurement reports 0.00 MB over 0 requests - which is what it did the first time it
  // was pointed at the live site (2026-08-19), silently, because every row was skipped by
  // the existsSync below. Strip one leading segment and try again; a local run is
  // unaffected because its first attempt already resolves.
  let onDisk = join('dist', name);
  if (!existsSync(onDisk) && name.includes('/')) {
    const stripped = name.slice(name.indexOf('/') + 1) || 'index.html';
    if (existsSync(join('dist', stripped))) {
      name = stripped;
      onDisk = join('dist', stripped);
    }
  }
  if (!existsSync(onDisk)) continue; // the document itself under a base path, etc.
  const raw = readFileSync(onDisk);
  const bytes = ALREADY_COMPRESSED.test(name) ? raw.byteLength : gzipSync(raw).byteLength;
  rows.push({ name, bytes, raw: raw.byteLength });
}
rows.sort((a, b) => b.bytes - a.bytes);

const total = rows.reduce((s, r) => s + r.bytes, 0);
const mb = (b) => (b / 1048576).toFixed(2);

console.log(`\nFirst load of ${url}`);
console.log(`GPU MAX_TEXTURE_SIZE reported: ${detail.maxTexture} (headless SwiftShader - a real GPU may pick a different basemap level)`);
console.log(`\n${'asset'.padEnd(40)}     MB   (raw)`);
for (const r of rows) {
  if (r.bytes < 2048) continue; // manifests and the favicon, listed in the total
  console.log(`${r.name.slice(0, 40).padEnd(40)} ${mb(r.bytes).padStart(6)}  ${mb(r.raw).padStart(6)}`);
}
const smallBytes = rows.filter((r) => r.bytes < 2048).reduce((s, r) => s + r.bytes, 0);
console.log(`${`(${rows.filter((r) => r.bytes < 2048).length} manifests and small files)`.padEnd(46)} ${mb(smallBytes).padStart(6)}`);
console.log(`${'TOTAL'.padEnd(46)} ${mb(total).padStart(6)}  over ${rows.length} requests`);

if (problems.length) {
  console.log(`\n${problems.length} console/page problems:`);
  for (const p of problems.slice(0, 10)) console.log(`  ${p}`);
  process.exit(1);
}
console.log('\nNo console or page errors.');
