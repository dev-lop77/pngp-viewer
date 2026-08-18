#!/usr/bin/env node
// Turns tools/roads-draft.json (from tools/fetch-roads.mjs) into
// public/data/roads.json: the forest roads inside the shipped region, in local
// scene coordinates, ready for src/roads.js to draw as one white line.
//
// Same region rule as trails, POI and water (tools/lib/region.mjs): a road is
// kept WHOLE if any of its points falls inside the region, never clipped to the
// edge. The region bbox the draft was fetched over is deliberately larger than
// the region itself, so this step does real work - 1,098 of the draft's 1,820
// tracks belong to neighbouring valleys and are dropped here.
//
// Usage: node tools/build-roads.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { setLocalOrigin } from '../src/geo.js';
import { loadRegion } from './lib/region.mjs';

const DRAFT_FILE = 'tools/roads-draft.json';
const HEIGHTFIELD_FILE = 'public/data/heightfield.json';
const OUT_FILE = 'public/data/roads.json';

// A track mapped as a handful of short stubs is noise at this scale. Measured
// on the draft before picking the number: median track 102 m, first quartile
// 36 m, and the 568 tracks under 50 m are 12.5 km of road between them - i.e.
// a third of the ways carrying a sixteenth of the distance, mostly field
// entrances and driveway spurs cut off at a property line.
const MIN_LENGTH_M = 50;

const draft = JSON.parse(readFileSync(DRAFT_FILE, 'utf8'));
const heightfieldManifest = JSON.parse(readFileSync(HEIGHTFIELD_FILE, 'utf8'));
setLocalOrigin(heightfieldManifest.localOrigin.x, heightfieldManifest.localOrigin.y);
const region = loadRegion();

const round1 = (n) => Math.round(n * 10) / 10;

function lengthM(line) {
  let total = 0;
  for (let i = 1; i < line.length; i++) {
    total += Math.hypot(line[i][0] - line[i - 1][0], line[i][2] - line[i - 1][2]);
  }
  return total;
}

let outsideRegion = 0;
let tooShort = 0;
const roads = [];
for (const f of draft.features) {
  if (!region.containsAnyPoint(f.line)) {
    outsideRegion++;
    continue;
  }
  const len = lengthM(f.line);
  if (len < MIN_LENGTH_M) {
    tooShort++;
    continue;
  }
  roads.push({
    osmId: f.osmId,
    name: f.name,
    tracktype: f.tracktype,
    surface: f.surface,
    lengthM: round1(len),
    dataIncomplete: f.dataIncomplete,
    line: f.line.map(([x, y, z]) => [round1(x), round1(y), round1(z)]),
  });
}

const vertices = roads.reduce((sum, r) => sum + r.line.length, 0);
const totalKm = roads.reduce((sum, r) => sum + r.lengthM, 0) / 1000;
console.log(
  `${roads.length} forest roads kept of ${draft.features.length} in the draft ` +
    `(${outsideRegion} outside the region, ${tooShort} shorter than ${MIN_LENGTH_M} m) - ` +
    `${totalKm.toFixed(0)} km, ${vertices} vertices.`,
);

const output = {
  schemaVersion: 1,
  crs: heightfieldManifest.crs,
  localOrigin: heightfieldManifest.localOrigin,
  axes: heightfieldManifest.axes,
  coordUnits: 'local scene meters [x, y, z], see localOrigin/axes above - same frame as the terrain',
  count: roads.length,
  boundary: region.describe(
    'a road is included only if at least one point falls inside one of these polygons (not clipped to it)',
  ),
  knownLimitations: [
    'highway=track only: footpaths come from the VDA trail dataset (trails.json) and paved ' +
      'valley roads are deliberately not drawn - see tools/fetch-roads.mjs.',
    'The draft is fetched over the bounding box of the region, so growing the region needs a ' +
      're-fetch, not just a rebuild.',
  ],
  source: {
    dataset: 'OpenStreetMap contributors',
    license: 'ODbL 1.0',
    attribution: '© OpenStreetMap contributors',
    fetchedVia: 'tools/fetch-roads.mjs',
  },
  generatedBy: 'tools/build-roads.mjs',
  generatedAt: new Date().toISOString(),
  roads,
};

writeFileSync(OUT_FILE, JSON.stringify(output));
console.log(`Wrote ${OUT_FILE} (${roads.length} roads)`);
