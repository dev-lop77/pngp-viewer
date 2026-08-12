#!/usr/bin/env node
// RETIRED, AND KEPT AS THE PROOF OF WHY. This pipeline works - it rasterises
// OSM's open-vegetation polygons into two clean masks - and its output is
// deliberately NOT shipped. It writes into tools/landcover-unshipped/ so it
// cannot reach a build by accident.
//
// What it measured, on 2026-08-12, INSIDE the park boundary (mean cover per
// pixel; reproduce with tools/dev/probe-landcover.mjs):
//
//     band          grass   shrub   wood
//     800-1600 m    0.011   0.008   0.217
//     1600-2200 m   0.011   0.004   0.208
//     2200-2700 m   0.006   0.003   0.007
//     2700-3000 m   0.003   0.000   0.000
//
// Overpass returned 6024 polygons for the bbox and nearly all of them lie
// OUTSIDE the park, in the inhabited valley floors where meadows and pastures
// get tagged. Above the treeline, inside the park, OSM says nothing - so grass
// scattered from this mask would be absent everywhere a visitor actually walks.
// The mistake that led here is worth naming: the feature COUNT in the bbox
// (4044 km2) was read as evidence about COVER in the park (582 km2). The counts
// were real; the inference was not.
//
// What replaced it: Sentinel-2 NDVI, which measures vegetation per pixel over
// the whole park rather than relying on a mapper having been there. See
// tools/basemap-source/build-ndvi.py and tools/build-landcover.mjs. The forest
// mask stays on OSM, because at 0.21 cover that IS well mapped.
//
// Everything below is unchanged and still runs.
//
// Step 2 of the landcover-mask pipeline: turn tools/landcover-osm-draft.json into
// two masks - shrub cover and grass cover.
//
// Two masks, not one texture with two channels. PNG's low bit depths are only
// legal for grayscale and palette images, so a 2-channel mask would have to be
// 8-bit (bigger), or grayscale+alpha with the data in alpha (a known trap: alpha
// is the one channel a browser may premultiply), or nibble-packed into one
// channel (which bilinear filtering destroys - and soft, filtered margins are
// the entire reason the forest mask reads as forest rather than as blocks). Two
// files of the proven 4-bit encoding cost one extra HTTP request and nothing else.
//
// Laid out on the heightfield's bbox and row order, so the runtime samples them
// with the terrain's own UVs and no second projection exists anywhere - the same
// property the forest mask has. Resolution is a separate question from grid
// alignment, because UVs are normalised: --downscale=2 keeps every UV identical
// and only makes the texels coarser. See RESOLUTION below.
//
// Usage: node tools/build-landcover-osm.mjs [--downscale=N]
//        (after tools/fetch-landcover-osm.mjs)

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import proj4 from 'proj4';
import { decodeHeightfield } from '../src/heightfield.js';
import { rasterisePolygons, writeQuantisedMask, downsampleCoverage } from './lib/mask-raster.mjs';

const DRAFT = 'tools/landcover-osm-draft.json';
// NOT public/data. See the retirement notice at the top of this file: the masks
// are real and unshipped, and this is what guarantees they stay that way.
const OUT_DIR = 'tools/landcover-unshipped';
const HEIGHTFIELD_DIR = 'public/data';
const SUB_ROWS = 4; // vertical supersampling
// Same 16 levels as the forest mask, for the same reason: these are
// bilinear-filtered and only drive a scatter probability, so they need nothing
// like 256 levels, but 4 would make margins visibly steppy across a 20 m pixel.
const COVERAGE_LEVELS = 16;

// RESOLUTION. The forest mask is at the heightfield's full 20.5 m/px because
// terrain.js samples it PER PIXEL out to a 40 km horizon for the canopy tint.
// These masks are read once per scattered instance instead, and the things they
// scatter are visible over tens of metres, not tens of kilometres - so the
// question is honestly open, and it is answered by measurement below rather than
// by copying the forest mask's answer. Overridable from the command line so the
// comparison costs nothing to repeat.
const DOWNSCALE = Number((process.argv.find((a) => a.startsWith('--downscale=')) ?? '=1').split('=')[1]) || 1;

// The two masks, and which OSM classes feed each with how much weight.
//
// `fell` is weighted down rather than counted as full grass: OSM's own
// definition is grazed ground above the treeline, which is discontinuous alpine
// turf between stones, not a meadow. Anything reading the mask as a scatter
// probability then thins the tufts there automatically, which is the honest
// difference between 2,600 m and a mown valley floor - and it comes from the
// data's own class rather than from a runtime guess about altitude.
const MASKS = [
  { name: 'shrub', prefix: 'landcover-shrub', weights: { scrub: 1, heath: 1 } },
  { name: 'grass', prefix: 'landcover-grass', weights: { meadow: 1, grassland: 1, fell: 0.45 } },
];

// Slope, baked in here rather than tested at runtime - the same trade the forest
// mask makes, and for the same reason: it never changes, and the alternative is
// extra height-texture taps per instance per frame.
//
// Steeper than the trees' 30/45, because turf and dwarf shrub genuinely hold
// where a spruce cannot root. The upper limit is chosen to agree with the
// terrain shader instead of being invented: terrain.js turns ground to bare rock
// between cos 0.87 (~30 deg) and 0.6 (~53 deg), so anything scattered past ~52
// deg would be standing on ground the renderer is already drawing as cliff.
const SLOPE_FULL_DEG = 35;
const SLOPE_NONE_DEG = 52;

proj4.defs('EPSG:23032', '+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs');

const draft = JSON.parse(readFileSync(DRAFT, 'utf8'));
const manifest = JSON.parse(readFileSync(`${HEIGHTFIELD_DIR}/heightfield.json`, 'utf8'));
mkdirSync(OUT_DIR, { recursive: true });
const { width, height } = manifest.dimensions;
const { xmin, ymin, xmax, ymax } = manifest.bboxCrsUnits;
const resX = (xmax - xmin) / width;
const resY = (ymax - ymin) / height;

console.log(
  `Rasterising ${draft.polygons.length} polygons into ${width}x${height} (${resX.toFixed(1)} m/px)` +
    (DOWNSCALE > 1 ? `, then downsampling by ${DOWNSCALE}` : ''),
);

// lon/lat -> continuous pixel coordinates. Row 0 is the north edge, matching the
// heightfield's rowOrientation, so y grows southward.
function toPixel([lon, lat]) {
  const [e, n] = proj4('WGS84', 'EPSG:23032', [lon, lat]);
  return [(e - xmin) / resX, (ymax - n) / resY];
}

// Slope attenuation on the heightfield's own grid, computed once and shared by
// both masks - it is a property of the ground, not of what grows on it.
const heightBuf = readFileSync(`${HEIGHTFIELD_DIR}/${manifest.file.name}`);
const heights = decodeHeightfield(heightBuf, manifest);
const { min: elevMin, max: elevMax } = manifest.elevationRangeM;
const elevAt = (px, py) => {
  const x = Math.min(width - 1, Math.max(0, px));
  const y = Math.min(height - 1, Math.max(0, py));
  return elevMin + (heights[y * width + x] / 65535) * (elevMax - elevMin);
};
const cosFull = Math.cos((SLOPE_FULL_DEG * Math.PI) / 180);
const cosNone = Math.cos((SLOPE_NONE_DEG * Math.PI) / 180);
const keepForSlope = new Float32Array(width * height);
for (let py = 0; py < height; py++) {
  for (let px = 0; px < width; px++) {
    const dzdx = (elevAt(px + 1, py) - elevAt(px - 1, py)) / (2 * resX);
    const dzdy = (elevAt(px, py + 1) - elevAt(px, py - 1)) / (2 * resY);
    const normalY = 1 / Math.sqrt(dzdx * dzdx + dzdy * dzdy + 1);
    // Ascending clamp, mirroring the terrain shader's `bare` term.
    keepForSlope[py * width + px] = Math.min(1, Math.max(0, (normalY - cosNone) / (cosFull - cosNone)));
  }
}

const results = [];
let totalBytes = 0;

for (const mask of MASKS) {
  const classes = Object.keys(mask.weights);
  const polygons = draft.polygons.filter((p) => classes.includes(p.class));
  const coverage = new Float32Array(width * height);
  const { skipped } = rasterisePolygons({
    polygons,
    width,
    height,
    toPixel,
    into: coverage,
    subRows: SUB_ROWS,
    weightOf: (p) => mask.weights[p.class] ?? 0,
  });

  // Clamp before the slope term, not after: overlapping polygons of the same
  // class must not add past full cover, and the slope factor then attenuates a
  // real fraction rather than an inflated one.
  let slopeRemoved = 0;
  for (let i = 0; i < coverage.length; i++) {
    const c = Math.min(1, coverage[i]);
    if (c > 0) {
      const keep = keepForSlope[i];
      if (keep < 1) slopeRemoved += c * (1 - keep);
      coverage[i] = c * keep;
    } else {
      coverage[i] = 0;
    }
  }

  const reduced = downsampleCoverage({ values: coverage, width, height, factor: DOWNSCALE });
  const written = writeQuantisedMask({
    dir: OUT_DIR,
    prefix: mask.prefix,
    width: reduced.width,
    height: reduced.height,
    values: reduced.values,
    levels: COVERAGE_LEVELS,
  });
  totalBytes += written.bytes;

  results.push({
    name: mask.name,
    classes,
    polygons: polygons.length,
    skipped,
    slopeRemoved: Math.round(slopeRemoved),
    dimensions: { width: reduced.width, height: reduced.height },
    ...written,
  });
  console.log(
    `  ${mask.name.padEnd(6)} ${polygons.length.toString().padStart(4)} polygons -> ` +
      `${written.fileName}  ${(written.bytes / 1024).toFixed(0)} kB, ` +
      `covered ${((written.fullPixels / (reduced.width * reduced.height)) * 100).toFixed(1)}%`,
  );
}

const landcoverManifest = {
  schemaVersion: 1,
  grid:
    DOWNSCALE > 1
      ? `heightfield.json's bboxCrsUnits and row order at 1/${DOWNSCALE} of its resolution - ` +
        'UVs are normalised, so the terrain\'s own UV mapping addresses these unchanged'
      : 'identical to heightfield.json: same dimensions, bboxCrsUnits, resolution and row order',
  crs: manifest.crs,
  bboxCrsUnits: manifest.bboxCrsUnits,
  dimensions: results[0].dimensions,
  resolutionMPerPx: {
    x: Number((resX * DOWNSCALE).toFixed(6)),
    y: Number((resY * DOWNSCALE).toFixed(6)),
  },
  downscaleFromHeightfield: DOWNSCALE,
  rowOrientation: manifest.rowOrientation,
  encoding: {
    channels: 1,
    depth: 8,
    meaning: 'fraction of the pixel covered by this class, 0 = none, 255 = full',
    quantisedTo: `${COVERAGE_LEVELS} levels, stored at PNG sample depth 4 and scaled x17 on decode`,
  },
  masks: Object.fromEntries(
    results.map((r) => [
      r.name,
      {
        file: { name: r.fileName, bytes: r.bytes, sha256Prefix: r.hash },
        osmClasses: r.classes,
        weights: MASKS.find((m) => m.name === r.name).weights,
        polygons: r.polygons,
        coveredPixels: r.fullPixels,
        partialPixels: r.partialPixels,
        coveredFraction: Number((r.fullPixels / (r.dimensions.width * r.dimensions.height)).toFixed(4)),
        pixelsLostToSlope: r.slopeRemoved,
      },
    ]),
  ),
  slopeLimit: `cover attenuated from ${SLOPE_FULL_DEG} deg to zero at ${SLOPE_NONE_DEG} deg, baked in`,
  source: {
    name: draft.source.name,
    attribution: draft.source.attribution,
    license: draft.source.license,
    licenseUrl: draft.source.licenseUrl,
    query: draft.source.query,
    modifications:
      'Derived product, not the original data: polygons were reprojected to EPSG:23032, ' +
      'rasterised to the heightfield grid under the even-odd rule (multipolygon holes removed), ' +
      'grouped into two classes with per-tag weights, attenuated by terrain slope' +
      (DOWNSCALE > 1 ? `, and box-averaged down by ${DOWNSCALE}` : '') +
      ', and stored as per-pixel cover fraction.',
    fetchedAt: draft.generatedAt,
    polygonsByClass: draft.polygonsByClass,
  },
  generatedBy: 'tools/build-landcover.mjs',
  generatedAt: new Date().toISOString(),
};
writeFileSync(`${OUT_DIR}/landcover.json`, `${JSON.stringify(landcoverManifest, null, 2)}\n`);

console.log(`\ntotal ${(totalBytes / 1024).toFixed(0)} kB across ${results.length} masks`);
for (const r of results) {
  console.log(
    `${r.name}: covered ${r.fullPixels.toLocaleString()} px, edges ${r.partialPixels.toLocaleString()}, ` +
      `lost to slope ${r.slopeRemoved.toLocaleString()} px` +
      (r.skipped ? `, skipped ${r.skipped} polygons with no usable rings` : ''),
  );
}
