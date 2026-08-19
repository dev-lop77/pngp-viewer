#!/usr/bin/env node
// Turn the 80 shipped glacier outlines into a MASK on the heightfield's own grid, so
// src/terrain.js can paint ice on the ground it already draws instead of src/water.js
// draping a sheet over it.
//
// WHY THE SHEET HAD TO GO, in one paragraph, because this file is the answer to it. A
// glacier arrives from OSM as an outline and nothing else. Triangulating that outline and
// seating its vertices on the terrain gives a surface whose CORNERS are on the ground and
// whose interior is flat, so it sags into the rock between them - and the offset that
// lifts it clear of the rock is squeezed between the eye height of a walker above and
// that sag below. Refining every edge to 25 m took the shipped set from 9,939 triangles
// to 563,567 and got the worst of it, and 1.25% of the ice still dipped under the rock
// (docs/PROGRESS.md's open debt). A mask has no interior to sag: the ice is the ground.
//
// SOURCE IS public/data/water.json, NOT tools/hydrology-draft.json, and that is
// deliberate. The draft holds 262 glacier polygons; water.json ships the 80 that survive
// the region filter (tools/lib/region.mjs), and those 80 are exactly what is drawn today.
// Rasterising the same 80 makes this a replacement rather than a new claim about where the
// ice is, and it lets tools/test-glaciers.mjs check the mask against the very rings the
// old mesh was built from.
//
// The scanline fill, the quantisation and the 4-bit PNG all come from
// tools/lib/mask-raster.mjs, the same code behind the canopy and landcover masks -
// verified byte for byte by tools/dev/verify-mask-raster.mjs.
//
// Usage: node tools/build-glacier-mask.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { rasterisePolygons, writeQuantisedMask } from './lib/mask-raster.mjs';

const OUT_DIR = 'public/data';
// 16 levels, like the canopy mask: the boundary of a glacier is soft at 20 m per pixel
// (an edge pixel is part ice, part moraine) and this is a coverage fraction, not a colour.
const COVERAGE_LEVELS = 16;
// Sub-scanlines per pixel row. Four is what the other two masks use, and at 20 m per pixel
// it is what keeps a tongue's edge from stepping.
const SUB_ROWS = 4;

const manifest = JSON.parse(readFileSync(`${OUT_DIR}/heightfield.json`, 'utf8'));
const water = JSON.parse(readFileSync(`${OUT_DIR}/water.json`, 'utf8'));
const { width, height } = manifest.dimensions;
const { xmin, ymin, xmax, ymax } = manifest.bboxCrsUnits;
const resX = (xmax - xmin) / width;
const resY = (ymax - ymin) / height;
const originX = manifest.localOrigin.x;
const originY = manifest.localOrigin.y;

const glaciers = water.glaciers ?? [];
console.log(`Rasterising ${glaciers.length} glacier outlines into ${width}x${height} (${resX.toFixed(1)} m/px)`);

// water.json's rings are LOCAL SCENE METRES [x, y, z] (docs/ARCHITECTURE.md §6): X east
// from the bbox centre, Z south from it, Y the baked elevation, which a mask does not use.
// Converting through the same origin the viewer does keeps the mask registered to the
// terrain it will be sampled with - the alternative, asserting a bbox by hand, is where
// this project's one 9.8 km misregistration came from (§13.8).
function toPixel([x, , z]) {
  const e = x + originX;
  const n = originY - z;
  return [(e - xmin) / resX, (ymax - n) / resY];
}

const coverage = new Float32Array(width * height);
const polygons = glaciers.map((g) => ({ rings: [{ points: g.ring }] }));
const { skipped } = rasterisePolygons({ polygons, width, height, toPixel, into: coverage, subRows: SUB_ROWS });
if (skipped) console.warn(`  ! ${skipped} outline(s) produced no edges and were skipped`);

// NO SLOPE ATTENUATION HERE, unlike the canopy mask. Trees stop at 35-40 degrees and that
// is a fact about trees, so build-forest.mjs bakes it in. Ice does not stop: an icefall is
// steep by definition, and OSM's outline already says where the glacier ends. What the
// terrain shader still does on a cliff INSIDE the outline is its own business, and it
// keeps its rock term there - see uGlacierMask in src/terrain.js.
let full = 0;
let partial = 0;
for (let i = 0; i < coverage.length; i += 1) {
  const c = Math.min(1, coverage[i]); // outlines overlap; coverage is not additive
  coverage[i] = c;
  if (c >= 0.999) full += 1;
  else if (c > 0) partial += 1;
}

const written = writeQuantisedMask({
  dir: OUT_DIR,
  prefix: 'glacier',
  width,
  height,
  values: coverage,
  levels: COVERAGE_LEVELS,
});

const cellAreaKm2 = (resX * resY) / 1e6;
const iceKm2 = (full + partial * 0.5) * cellAreaKm2;
const glacierManifest = {
  schemaVersion: 1,
  grid: 'identical to heightfield.json: same dimensions, bboxCrsUnits, resolution and row order',
  crs: manifest.crs,
  bboxCrsUnits: manifest.bboxCrsUnits,
  dimensions: manifest.dimensions,
  resolutionMPerPx: manifest.resolutionMPerPx,
  rowOrientation: manifest.rowOrientation,
  encoding: {
    channels: 1,
    depth: 8,
    meaning: 'fraction of the pixel covered by glacier ice, 0 = none, 255 = full',
    quantisedTo: `${COVERAGE_LEVELS} levels, stored at PNG sample depth 4 and scaled x17 on decode`,
  },
  coverage: {
    outlines: glaciers.length,
    fullPixels: written.fullPixels,
    partialPixels: written.partialPixels,
    approxAreaKm2: Number(iceKm2.toFixed(2)),
    note: 'No slope attenuation is baked in - an icefall is steep by definition. The terrain shader keeps its own rock term for cliffs inside an outline.',
  },
  file: { name: written.fileName, bytes: written.bytes, sha256Prefix: written.hash },
  source: {
    ...water.source,
    modifications: 'Derived product, not the original data: the glacier outlines shipped in water.json were rasterised to the heightfield grid under the even-odd rule and stored as per-pixel ice coverage.',
  },
  generatedBy: 'tools/build-glacier-mask.mjs',
  generatedAt: new Date().toISOString(),
};
writeFileSync(`${OUT_DIR}/glacier.json`, `${JSON.stringify(glacierManifest, null, 2)}\n`);

console.log(`  ${written.fullPixels} full pixels, ${written.partialPixels} partial - about ${iceKm2.toFixed(1)} km2 of ice`);
console.log(`  ${written.fileName}, ${(written.bytes / 1024).toFixed(0)} kB`);
console.log('Wrote public/data/glacier.json');
