#!/usr/bin/env node
// What do the SOURCE sheets look like, with no shader, no lighting and no colour grade?
//
// The A/B probe proves where a colour comes from - photograph or us - and stops there. It
// cannot say WHAT the colour is, and the difference matters for blue: an alpine shadow is lit
// by the sky, so rock in shade is genuinely blue in the source, while our own pipeline can
// also tint a neutral dark pixel blue through the ambient term. Reading "lake" off a rendered
// frame is an interpretation, and this project has already paid for three of those.
//
// So: stitch the nine sheets of one atlas block straight from disk, downsample, and write a
// plan view that owes nothing to the renderer. Also count how blue the source is, and how
// much of that blue is DARK (shadow) rather than mid-toned (water catching the sky).
//
// Usage: node tools/dev/probe-ortho-source.mjs [i0] [j0]   (defaults to the 0,0 block)

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decode, encode } from 'fast-png';

const I0 = Number(process.argv[2] ?? 0);
const J0 = Number(process.argv[3] ?? 0);
const OUT_PX = 1200;

const manifest = JSON.parse(readFileSync('public/data/ortho.json', 'utf8'));
const byCell = new Map(manifest.sheets.map((s) => [s.cell.join(','), s]));
const sheetPx = Math.round(manifest.grid.sheetM / manifest.resolutionMPerPx.x);
const stepPx = Math.round(manifest.grid.stepM / manifest.resolutionMPerPx.x);
const canvasPx = stepPx * 2 + sheetPx; // same geometry as the atlas: 3 cells, sheets overlapping

const work = mkdtempSync(join(tmpdir(), 'ortho-src-'));
const big = new Uint8Array(canvasPx * canvasPx * 3);
let placed = 0;
for (let dj = -1; dj <= 1; dj++) {
  for (let di = -1; di <= 1; di++) {
    const sh = byCell.get(`${I0 + di},${J0 + dj}`);
    if (!sh) continue;
    const png = join(work, `${sh.tavola}.png`);
    execFileSync('gdal_translate', ['-q', '-of', 'PNG', `public/data/ortho/${sh.file.name}`, png]);
    const img = decode(readFileSync(png));
    if (img.depth !== 8) throw new Error(`sheet ${sh.tavola} decoded at depth ${img.depth}`);
    const ch = img.channels;
    const ox = (di + 1) * stepPx;
    const oy = (dj + 1) * stepPx;
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const s = (y * img.width + x) * ch;
        const d = ((oy + y) * canvasPx + (ox + x)) * 3;
        big[d] = img.data[s]; big[d + 1] = img.data[s + 1]; big[d + 2] = img.data[s + 2];
      }
    }
    placed += 1;
  }
}
rmSync(work, { recursive: true, force: true });
console.log(`block (${I0},${J0}): ${placed}/9 sheets, stitched at ${canvasPx} px = ${canvasPx * manifest.resolutionMPerPx.x} m`);

// Box-downsample to something viewable. Averaging, not sampling: a nearest-neighbour shrink
// of a 2 m photograph throws away exactly the texture the question is about.
const scale = Math.floor(canvasPx / OUT_PX);
const outW = Math.floor(canvasPx / scale);
const out = new Uint8Array(outW * outW * 3);
for (let y = 0; y < outW; y++) {
  for (let x = 0; x < outW; x++) {
    let r = 0, g = 0, b = 0;
    for (let sy = 0; sy < scale; sy++) {
      for (let sx = 0; sx < scale; sx++) {
        const s = ((y * scale + sy) * canvasPx + (x * scale + sx)) * 3;
        r += big[s]; g += big[s + 1]; b += big[s + 2];
      }
    }
    const n = scale * scale;
    const d = (y * outW + x) * 3;
    out[d] = r / n; out[d + 1] = g / n; out[d + 2] = b / n;
  }
}
const path = `tools/dev/logs/ortho-source-${I0}_${J0}.png`;
writeFileSync(path, encode({ width: outW, height: outW, data: out, channels: 3, depth: 8 }));
console.log(`wrote ${path} (${outW} px, ${(canvasPx * manifest.resolutionMPerPx.x / outW).toFixed(1)} m per pixel)`);

// How blue is the source, and is that blue dark or mid-toned? Shadowed rock is blue AND dark;
// water catching the sky is blue and usually not the darkest thing in the frame. This does not
// settle it on its own - the picture above is what settles it - but it says whether the
// renderer is inventing blue or reporting it.
const isBlue = (r, g, b) => b > r + 25 && b > g + 15;
let blue = 0, blueDark = 0, dark = 0, total = 0, sumL = 0;
const hist = new Array(8).fill(0); // blue pixels by luminance octile
for (let k = 0; k < big.length; k += 3) {
  const [r, g, b] = [big[k], big[k + 1], big[k + 2]];
  if (r === 0 && g === 0 && b === 0) continue; // the 40 m of overlap never written, and nodata
  total += 1;
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  sumL += L;
  if (L < 64) dark += 1;
  if (!isBlue(r, g, b)) continue;
  blue += 1;
  hist[Math.min(7, Math.floor(L / 32))] += 1;
  if (L < 64) blueDark += 1;
}
const pc = (n) => `${((n / total) * 100).toFixed(2)}%`;
console.log(`source pixels ${total}, mean luminance ${(sumL / total).toFixed(0)}/255`);
// THE SHADOWS IN THE PHOTOGRAPH ARE BAKED IN at the sun angle of the flight, while the scene
// has its own time of day. This number is how much of the ground carries one.
console.log(`in shadow (L<64): ${pc(dark)} of the ground`);
console.log(`blue in the SOURCE: ${pc(blue)}, of which dark (L<64): ${((blueDark / Math.max(1, blue)) * 100).toFixed(0)}%`);
console.log(`blue by luminance octile 0-255: ${hist.map((n, i) => `${i * 32}-${i * 32 + 31}:${((n / Math.max(1, blue)) * 100).toFixed(0)}%`).join('  ')}`);
