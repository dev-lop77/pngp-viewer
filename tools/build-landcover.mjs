#!/usr/bin/env node
// The shipped open-vegetation mask: how much of each pixel carries vegetation
// that is not tree canopy, on the heightfield's own grid.
//
// ONE mask, and the reason is worth stating because the first version shipped
// two. Grass and dwarf shrub were derived here into separate textures, which cost
// 4,409 kB - and the split between them is a pure function of ELEVATION, which
// the vertex shader already samples for every instance it places. So the second
// texture was a derived value being shipped as though it were data. The belt
// model moved to src/groundcover.js, where retuning it costs a shader constant
// instead of a rebuild and a download.
//
// Inputs, and which part of the answer each one is responsible for:
//
//   tools/ndvi-draft.bin        HOW MUCH vegetation - a measurement, per pixel,
//                               from Sentinel-2 (build-ndvi.py)
//   public/data/forest.<h>.png  whether it is CANOPY - OSM, which is well
//                               surveyed for woods (21% of the park's pixels)
//   the heightfield             elevation and slope, which decide WHICH KIND of
//                               open vegetation and whether anything holds at all
//
// The honest division of labour, and the manifest repeats it: this file ships a
// MEASUREMENT of how much vegetation there is. Which kind it is - pasture or
// rhododendron heath - is a model, because no index separates them: both are
// green in every band. That model lives in src/groundcover.js.
//
// THRESHOLDS, read off the distribution rather than a textbook range
// (tools/dev/probe-ndvi.mjs, measured inside the park boundary on 2026-08-12):
//
//   band          open-ground NDVI  p05 / p50 / p95
//   800-1600 m         0.404 / 0.827 / 0.914    valley meadow and pasture
//   1600-2200 m        0.224 / 0.663 / 0.867    subalpine, mixed
//   2200-2700 m        0.020 / 0.396 / 0.718    alpine turf, patchy
//   2700-3000 m       -0.004 / 0.075 / 0.459    mostly stone
//   3000-3800 m       -0.004 / 0.004 / 0.137    rock and ice
//
// NDVI_BARE = 0.15 is where rock sits: in the 3000-3800 m band even the 95th
// percentile is 0.137, so almost all bare ground falls below it. NDVI_FULL = 0.55
// is the 75th percentile of open ground at 2200-2700 m, i.e. where alpine turf
// stops being patches and becomes cover. The resulting mean cover per band is
// 0.96 / 0.89 / 0.56 / 0.13 / 0.006 - which is the gradient you walk through.
//
// Usage: node tools/build-landcover.mjs
//        (after python3 tools/basemap-source/build-ndvi.py)

import { readFileSync, writeFileSync } from 'node:fs';
import { decodeHeightfield } from '../src/heightfield.js';
import { downsampleCoverage, readQuantisedMask, writeQuantisedMask } from './lib/mask-raster.mjs';

const OUT_DIR = 'public/data';
const NDVI_BIN = 'tools/ndvi-draft.bin';
const NDVI_JSON = 'tools/ndvi-draft.json';
// SIZE, measured rather than assumed. The NDVI field is smooth and covers the
// whole bbox, which PNG predicts far worse than the forest mask's sparse
// polygons, so the first build came out at 2,648 kB - 21% on top of a 12.6 MB
// first load, for a scatter probability. Measured across both knobs (kB):
//
//                 full 20.5 m   half 41 m
//   16 levels        2648          786
//    8 levels        2053          605
//    4 levels        1434          419
//
// 8 levels at half resolution. The mean cover is preserved to four decimals by
// every one of those cells, so neither knob biases the field - what they cost is
// spatial sharpness and quantisation of the density. Half resolution is defensible
// because this is read once per scattered instance and nothing is scattered past
// ~200 m: within a walking view the mask spans two or three texels either way, so
// a boundary is soft at 20.5 m too. 8 levels rather than 4 because bilinear
// filtering interpolates between texel CENTRES, so coarse values terrace the
// density over ~41 m instead of ramping it.
//
// Overridable so the comparison costs nothing to repeat.
const COVERAGE_LEVELS = Number((process.argv.find((a) => a.startsWith('--levels=')) ?? '=8').split('=')[1]) || 8;
const DOWNSCALE = Number((process.argv.find((a) => a.startsWith('--downscale=')) ?? '=2').split('=')[1]) || 2;

// See the header: both edges are percentiles of the measured distribution.
const NDVI_BARE = 0.15;
const NDVI_FULL = 0.55;

// Slope, baked in rather than tested at runtime - the same trade the forest mask
// makes: it never changes, and the alternative is extra height-texture taps per
// instance per frame.
//
// Steeper than the trees' 30/45, because turf and dwarf shrub genuinely hold
// where a spruce cannot root. The upper limit agrees with the terrain shader
// instead of being invented: terrain.js turns ground to bare rock between cos
// 0.87 (~30 deg) and 0.6 (~53 deg), so anything scattered past ~52 deg would be
// standing on ground the renderer is already drawing as cliff.
const SLOPE_FULL_DEG = 35;
const SLOPE_NONE_DEG = 52;

// Canopy suppresses open vegetation completely rather than partially. A real
// forest floor does carry some grass, but the trees drawn on top of it are opaque
// cones and the ground beneath them is the darkest part of the scene, so tufts
// there would cost instances and show almost nothing. Noted as a possible
// refinement rather than left as an accident.
const CANOPY_SUPPRESSES = 1.0;

const smoothstep = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

const hf = JSON.parse(readFileSync(`${OUT_DIR}/heightfield.json`, 'utf8'));
const forestManifest = JSON.parse(readFileSync(`${OUT_DIR}/forest.json`, 'utf8'));
const ndviMeta = JSON.parse(readFileSync(NDVI_JSON, 'utf8'));

const { width, height } = hf.dimensions;
const { xmin, ymin, xmax, ymax } = hf.bboxCrsUnits;
const resX = (xmax - xmin) / width;
const resY = (ymax - ymin) / height;

// Every input must be on the same grid. This is asserted rather than trusted,
// because a silent half-grid offset would look like slightly wrong vegetation
// instead of like a bug.
if (ndviMeta.dimensions.width !== width || ndviMeta.dimensions.height !== height) {
  throw new Error(`ndvi-draft is ${ndviMeta.dimensions.width}x${ndviMeta.dimensions.height}, heightfield is ${width}x${height}`);
}
if (forestManifest.dimensions.width !== width || forestManifest.dimensions.height !== height) {
  throw new Error('forest.json is not on the heightfield grid');
}

const ndviByte = new Uint8Array(readFileSync(NDVI_BIN));
if (ndviByte.length !== width * height) {
  throw new Error(`${NDVI_BIN} is ${ndviByte.length} bytes, expected ${width * height}`);
}
const wood = readQuantisedMask(`${OUT_DIR}/${forestManifest.file.name}`).values;
const heights = decodeHeightfield(readFileSync(`${OUT_DIR}/${hf.file.name}`), hf);
const { min: elevMin, max: elevMax } = hf.elevationRangeM;

console.log(`Deriving landcover on ${width}x${height} (${resX.toFixed(1)} m/px)`);
console.log(`  NDVI from ${NDVI_BIN}, ${(ndviMeta.processing.gapFraction * 100).toFixed(2)}% unobserved`);
console.log(`  canopy from ${forestManifest.file.name}`);

const elevAt = (px, py) => {
  const x = Math.min(width - 1, Math.max(0, px));
  const y = Math.min(height - 1, Math.max(0, py));
  return elevMin + (heights[y * width + x] / 65535) * (elevMax - elevMin);
};
const cosFull = Math.cos((SLOPE_FULL_DEG * Math.PI) / 180);
const cosNone = Math.cos((SLOPE_NONE_DEG * Math.PI) / 180);

const cover = new Float32Array(width * height);
let vegSum = 0;
let slopeRemoved = 0;
let canopyRemoved = 0;

for (let py = 0; py < height; py++) {
  for (let px = 0; px < width; px++) {
    const i = py * width + px;
    const ndvi = ndviByte[i] / 127.5 - 1;
    const veg = smoothstep(NDVI_BARE, NDVI_FULL, ndvi);
    if (veg <= 0) continue;
    vegSum += veg;

    const canopy = (wood[i] / 255) * CANOPY_SUPPRESSES;
    const open = veg * (1 - Math.min(1, canopy));
    canopyRemoved += veg - open;
    if (open <= 0) continue;

    const dzdx = (elevAt(px + 1, py) - elevAt(px - 1, py)) / (2 * resX);
    const dzdy = (elevAt(px, py + 1) - elevAt(px, py - 1)) / (2 * resY);
    const normalY = 1 / Math.sqrt(dzdx * dzdx + dzdy * dzdy + 1);
    // Ascending clamp, mirroring the terrain shader's `bare` term.
    const keep = Math.min(1, Math.max(0, (normalY - cosNone) / (cosFull - cosNone)));
    slopeRemoved += open * (1 - keep);
    cover[i] = open * keep;
  }
}

const meanFull = cover.reduce((s, v) => s + v, 0) / cover.length;
const reduced = downsampleCoverage({ values: cover, width, height, factor: DOWNSCALE });
const written = writeQuantisedMask({
  dir: OUT_DIR,
  prefix: 'landcover',
  width: reduced.width,
  height: reduced.height,
  values: reduced.values,
  levels: COVERAGE_LEVELS,
});
const meanQuantised = reduced.values.reduce((s, v) => s + v, 0) / reduced.values.length;
console.log(
  `  ${reduced.width}x${reduced.height}, ${COVERAGE_LEVELS} levels -> ${written.fileName}  ` +
    `${(written.bytes / 1024).toFixed(0)} kB, mean cover ${meanQuantised.toFixed(4)} ` +
    `(full grid ${meanFull.toFixed(4)}), over half ${((written.fullPixels / (reduced.width * reduced.height)) * 100).toFixed(1)}% of the bbox`,
);

const manifest = {
  schemaVersion: 1,
  grid:
    DOWNSCALE > 1
      ? `heightfield.json's bboxCrsUnits and row order at 1/${DOWNSCALE} of its resolution - UVs are ` +
        'normalised, so the terrain\'s own UV mapping addresses this unchanged'
      : 'identical to heightfield.json: same dimensions, bboxCrsUnits, resolution and row order',
  crs: hf.crs,
  bboxCrsUnits: hf.bboxCrsUnits,
  dimensions: { width: reduced.width, height: reduced.height },
  resolutionMPerPx: {
    x: Number((resX * DOWNSCALE).toFixed(6)),
    y: Number((resY * DOWNSCALE).toFixed(6)),
  },
  downscaleFromHeightfield: DOWNSCALE,
  rowOrientation: hf.rowOrientation,
  encoding: {
    channels: 1,
    depth: 8,
    meaning: 'fraction of the pixel covered by this class, 0 = none, 255 = full',
    quantisedTo: `${COVERAGE_LEVELS} levels, stored at PNG sample depth 4 and scaled x17 on decode`,
    levels: COVERAGE_LEVELS,
  },
  mask: {
    file: { name: written.fileName, bytes: written.bytes, sha256Prefix: written.hash },
    meaning: 'fraction of the pixel carrying open vegetation - not tree canopy, not cliff',
    coveredPixels: written.fullPixels,
    partialPixels: written.partialPixels,
    meanCover: Number(meanQuantised.toFixed(4)),
  },
  derivation: {
    // Stated in the manifest, not only in this file's header: anyone reading the
    // data should know which half of it is a measurement.
    measured: 'how much vegetation, from Sentinel-2 NDVI per pixel',
    modelledElsewhere:
      'whether that vegetation is grass or dwarf shrub - an elevation belt in src/groundcover.js, ' +
      'deliberately NOT shipped as a second texture because it is a function of a value the shader already has',
    vegetationFraction: `smoothstep(${NDVI_BARE}, ${NDVI_FULL}, ndvi)`,
    ndviThresholdsChosenBy:
      'tools/dev/probe-ndvi.mjs - NDVI_BARE is above the 95th percentile of bare rock above 3000 m, ' +
      'NDVI_FULL is the 75th percentile of open ground at 2200-2700 m',
    canopy: `open vegetation suppressed by the OSM canopy mask at ${CANOPY_SUPPRESSES}`,
    slopeLimit: `cover attenuated from ${SLOPE_FULL_DEG} deg to zero at ${SLOPE_NONE_DEG} deg`,
    rejectedAlternative:
      'OSM natural=scrub/heath/grassland + landuse=meadow. Built and measured (tools/build-landcover-osm.mjs): ' +
      'inside the park it covers 0.011 of a pixel below 2200 m and 0.003 above 2700 m, because open vegetation ' +
      'is not surveyed there. Not shipped.',
  },
  source: {
    ndvi: ndviMeta.source,
    canopy: {
      name: forestManifest.source.name,
      attribution: forestManifest.source.attribution,
      license: forestManifest.source.license,
      licenseUrl: forestManifest.source.licenseUrl,
    },
    scenesUsed: ndviMeta.scenesUsed,
  },
  generatedBy: 'tools/build-landcover.mjs',
  generatedAt: new Date().toISOString(),
};
writeFileSync(`${OUT_DIR}/landcover.json`, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
  `\ntotal ${(written.bytes / 1024).toFixed(0)} kB\n` +
    `vegetated (NDVI): ${(vegSum / (width * height)).toFixed(4)} mean over the bbox\n` +
    `removed as canopy: ${Math.round(canopyRemoved).toLocaleString()} px worth\n` +
    `removed as too steep: ${Math.round(slopeRemoved).toLocaleString()} px worth`,
);
