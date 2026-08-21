#!/usr/bin/env node
// WHAT SUN IS BAKED INTO THE ORTHOPHOTO?
//
// The delivery does not say. There is no acquisition time in the TIF, the TFW or the zip -
// only the campaign, 21/08 to 02/11/2024, which at this latitude spans a solar noon from
// about 57 degrees down to 26. That range matters: docs/ARCHITECTURE.md §5 records why the
// Sentinel basemap is de-shaded ("without it every north face would be dark twice and every
// sunset would have the shadows pointing south-east"), and the orthophoto is NOT de-shaded -
// build-ortho.mjs never touches the DEM. So before deciding whether that debt is worth
// paying, measure how big it is.
//
// The method is the one the basemap build uses in reverse: instead of dividing out a KNOWN
// illumination, search for the illumination that best explains the picture. cos of incidence
// from this project's own DEM, swept over azimuth and elevation, correlated against the
// sheet's luminance. Bright snow and black shadow are excluded - both saturate, and a
// saturated pixel carries no shading information at all.
//
// Usage: node tools/dev/probe-ortho-sun.mjs [tavola ...]     (defaults to a spread of five)

import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decode } from 'fast-png';
import { decodeHeightfield, sampleHeightfield } from '../../src/heightfield.js';

const hfManifest = JSON.parse(readFileSync('public/data/heightfield.json', 'utf8'));
const heights = decodeHeightfield(readFileSync(`public/data/${hfManifest.file.name}`), hfManifest);
const origin = hfManifest.localOrigin;
const orthoManifest = JSON.parse(readFileSync('public/data/ortho.json', 'utf8'));
const byTavola = new Map(orthoManifest.sheets.map((s) => [s.tavola, s]));

const args = process.argv.slice(2);
// An unconstrained sweep finds azimuth 63 and elevation 1 on sheets with little relief, which
// is not a sun, it is a fit with nothing to hold on to. The campaign flew near solar noon -
// every aerial survey does, to keep shadows short - so --az=150-200 asks the narrower and
// answerable question: given that the sun was in the south, how high was it?
const azFlag = args.find((a) => a.startsWith('--az='));
const [AZ_MIN, AZ_MAX] = azFlag ? azFlag.slice(5).split('-').map(Number) : [0, 355];
const wanted = args.filter((a) => !a.startsWith('--'));
const sheets = wanted.length ? wanted : ['5943', '5137', '6543', '4939', '6941'];

const STEP_M = 20; // the DEM's own resolution: finer would invent detail the DEM does not have
const DEG = Math.PI / 180;

function shadingSamples(sh, work) {
  const png = join(work, `${sh.tavola}.png`);
  execFileSync('gdal_translate', ['-q', '-of', 'PNG', `public/data/ortho/${sh.file.name}`, png]);
  const img = decode(readFileSync(png));
  const ch = img.channels;
  const bb = sh.bboxCrsUnits;
  const mPerPx = orthoManifest.resolutionMPerPx.x;
  const cell = Math.round(STEP_M / mPerPx); // photo pixels per DEM cell

  const rows = [];
  for (let py = 0; py + cell <= img.height; py += cell) {
    for (let px = 0; px + cell <= img.width; px += cell) {
      // Average the photo over the cell, so one bright roof cannot stand for 20 m of ground.
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = 0; y < cell; y++) {
        for (let x = 0; x < cell; x++) {
          const s = ((py + y) * img.width + (px + x)) * ch;
          r += img.data[s]; g += img.data[s + 1]; b += img.data[s + 2]; n += 1;
        }
      }
      const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / n;
      // Saturated either way carries no shading: snow clips high, deep shadow clips low.
      if (L > 200 || L < 20) continue;

      const E = bb.xmin + (px + cell / 2) * mPerPx;
      const N = bb.ymax - (py + cell / 2) * mPerPx;
      const lx = E - origin.x;
      const lz = origin.y - N;
      const h = sampleHeightfield(heights, hfManifest, lx, lz);
      const hE = sampleHeightfield(heights, hfManifest, lx + STEP_M, lz);
      const hW = sampleHeightfield(heights, hfManifest, lx - STEP_M, lz);
      const hS = sampleHeightfield(heights, hfManifest, lx, lz + STEP_M);
      const hN = sampleHeightfield(heights, hfManifest, lx, lz - STEP_M);
      if (![h, hE, hW, hS, hN].every(Number.isFinite)) continue;
      // dz/dE and dz/dN. Local +Z is SOUTH, so northward gradient is (hN - hS) over -2*STEP.
      const dzdE = (hE - hW) / (2 * STEP_M);
      const dzdN = (hN - hS) / (2 * STEP_M) * -1;
      const slope = Math.atan(Math.hypot(dzdE, dzdN));
      if (slope < 3 * DEG) continue; // flat ground says nothing about where the sun is
      const aspect = Math.atan2(dzdE, dzdN); // radians clockwise from north, downhill direction
      rows.push({ L, slope, aspect });
    }
  }
  return rows;
}

function correlate(rows, azDeg, elDeg) {
  const az = azDeg * DEG, el = elDeg * DEG;
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
  for (const { L, slope, aspect } of rows) {
    const ci = Math.cos(slope) * Math.sin(el) + Math.sin(slope) * Math.cos(el) * Math.cos(az - aspect);
    sx += ci; sy += L; sxx += ci * ci; syy += L * L; sxy += ci * L;
  }
  const n = rows.length;
  const num = n * sxy - sx * sy;
  const den = Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
  return den === 0 ? 0 : num / den;
}

const work = mkdtempSync(join(tmpdir(), 'ortho-sun-'));
console.log('tavola   samples   best sun            r     (r at el=90, a flat sky)');
const found = [];
for (const t of sheets) {
  const sh = byTavola.get(t);
  if (!sh) { console.log(`${t}: not in the manifest`); continue; }
  const rows = shadingSamples(sh, work);
  let best = { r: -2 };
  for (let az = AZ_MIN; az <= AZ_MAX; az += 5) {
    for (let el = 5; el <= 80; el += 5) {
      const r = correlate(rows, az, el);
      if (r > best.r) best = { r, az, el };
    }
  }
  // Refine on a degree grid around the coarse winner.
  const coarse = { ...best };
  for (let az = Math.max(AZ_MIN, coarse.az - 5); az <= Math.min(AZ_MAX, coarse.az + 5); az += 1) {
    for (let el = Math.max(1, coarse.el - 5); el <= coarse.el + 5; el += 1) {
      const r = correlate(rows, (az + 360) % 360, el);
      if (r > best.r) best = { r, az: (az + 360) % 360, el };
    }
  }
  found.push({ t, ...best });
  console.log(`${t}   ${String(rows.length).padStart(6)}   az ${String(best.az).padStart(3)}deg`
    + ` el ${String(best.el).padStart(2)}deg   ${best.r.toFixed(3)}   ${correlate(rows, best.az, 90).toFixed(3)}`);
}
rmSync(work, { recursive: true, force: true });

if (found.length > 1) {
  const az = found.map((f) => f.az), el = found.map((f) => f.el);
  console.log(`\nacross ${found.length} sheets: azimuth ${Math.min(...az)}-${Math.max(...az)} deg,`
    + ` elevation ${Math.min(...el)}-${Math.max(...el)} deg`);
  console.log('A spread here is not noise: the campaign ran 21/08 to 02/11/2024, so different'
    + ' sheets were flown on different days and carry different suns.');
}
