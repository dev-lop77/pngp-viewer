#!/usr/bin/env node
// Pulls candidate hydrology features (lakes, rivers, glaciers) from
// OpenStreetMap/Overpass for the PNGP bbox - a raw draft, mirrors
// tools/fetch-osm.mjs's structure (same bbox derivation, same elevation
// sampling against our own heightfield). Not the final public/data/
// water.json - tools/build-hydrology.mjs applies the real park-boundary
// filter and adds the hand-curated waterfall allowlist (docs/PROGRESS.md:
// Cascate di Lillaz and other named falls sit just outside the strict
// boundary polygon, same precedent as the missing-hut gap).
//
// Deliberately narrower than the full hydrology picture (docs/ARCHITECTURE.md
// §10 performance principle): waterway=river only, not the 8,369-way
// waterway=stream network in this bbox - a logged scope cut, not silent.
// natural=glacier ways only, not the 60 multipolygon relations also
// present - same "prefer the simple case, flag the rest as a known gap"
// choice already made for the park boundary (Nominatim over hand-rolled
// relation assembly).
//
// Usage: node tools/fetch-hydrology.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import proj4 from 'proj4';
import { setLocalOrigin, worldToLocal } from '../src/geo.js';
import { sampleHeightfield, isNearNoData, decodeHeightfield } from '../src/heightfield.js';

const OUT_FILE = 'tools/hydrology-draft.json';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

proj4.defs('EPSG:23032', '+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs');

const heightfieldManifest = JSON.parse(readFileSync('public/data/heightfield.json', 'utf8'));
const heightfieldBuffer = readFileSync(`public/data/${heightfieldManifest.file.name}`);
const heights = decodeHeightfield(heightfieldBuffer, heightfieldManifest);
setLocalOrigin(heightfieldManifest.localOrigin.x, heightfieldManifest.localOrigin.y);

const { xmin, ymin, xmax, ymax } = heightfieldManifest.bboxCrsUnits;
const corners = [
  [xmin, ymin],
  [xmin, ymax],
  [xmax, ymin],
  [xmax, ymax],
].map(([e, n]) => proj4('EPSG:23032', 'WGS84', [e, n]));
const south = Math.min(...corners.map((c) => c[1]));
const north = Math.max(...corners.map((c) => c[1]));
const west = Math.min(...corners.map((c) => c[0]));
const east = Math.max(...corners.map((c) => c[0]));

console.log(`Querying Overpass for bbox ${south.toFixed(4)},${west.toFixed(4)},${north.toFixed(4)},${east.toFixed(4)}...`);

const CATEGORY_QUERIES = [
  { category: 'lake', ql: `way["natural"="water"]` },
  { category: 'lake', ql: `way["natural"="lake"]` },
  { category: 'river', ql: `way["waterway"="river"]` },
  { category: 'glacier', ql: `way["natural"="glacier"]` },
];

const query =
  `[out:json][timeout:120];\n(\n` +
  CATEGORY_QUERIES.map((c) => `  ${c.ql}(${south},${west},${north},${east});`).join('\n') +
  `\n);\nout geom;`;

const response = await fetch(OVERPASS_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
    'User-Agent': 'pngp-viewer/0.1 (tools/fetch-hydrology.mjs, hydrology draft extraction)',
  },
  body: `data=${encodeURIComponent(query)}`,
});
if (!response.ok) {
  throw new Error(`Overpass request failed: ${response.status} ${await response.text()}`);
}
const { elements } = await response.json();
console.log(`Overpass returned ${elements.length} elements.`);

function categoryFor(el) {
  const t = el.tags ?? {};
  if (t.natural === 'water' || t.natural === 'lake') return 'lake';
  if (t.waterway === 'river') return 'river';
  if (t.natural === 'glacier') return 'glacier';
  return 'unknown';
}

// Convert one way's OSM geometry (array of {lat,lon}) to local scene
// coordinates with elevation sampled from our own heightfield - same
// rule as every other layer (docs/ARCHITECTURE.md §4).
function convertRing(geometry) {
  let hasNoData = false;
  const points = geometry.map(({ lat, lon }) => {
    const [e, n] = proj4('WGS84', 'EPSG:23032', [lon, lat]);
    const { x, z } = worldToLocal(e, n);
    if (isNearNoData(heights, heightfieldManifest, x, z)) hasNoData = true;
    const y = Math.round(sampleHeightfield(heights, heightfieldManifest, x, z) * 10) / 10;
    return [Math.round(x * 10) / 10, y, Math.round(z * 10) / 10];
  });
  return { points, hasNoData };
}

const seen = new Set(); // dedup - the union query can return the same way twice if it matches more than one clause
const features = [];
for (const el of elements) {
  if (el.type !== 'way' || !el.geometry?.length) continue;
  const key = `${el.type}${el.id}`;
  if (seen.has(key)) continue;
  seen.add(key);

  const { points, hasNoData } = convertRing(el.geometry);
  features.push({
    osmId: el.id,
    category: categoryFor(el),
    name: el.tags?.name ?? el.tags?.['name:it'] ?? null,
    dataIncomplete: hasNoData,
    line: points, // [x, y, z] in local scene meters
  });
}

const byCategory = features.reduce((acc, f) => {
  acc[f.category] = (acc[f.category] ?? 0) + 1;
  return acc;
}, {});
console.log('By category:', byCategory);

writeFileSync(
  OUT_FILE,
  JSON.stringify(
    {
      note:
        'DRAFT for tools/build-hydrology.mjs, not public/data/water.json - the build step ' +
        'applies the real park-boundary filter. Source: OpenStreetMap (ODbL, attribution ' +
        'required - see docs/ARCHITECTURE.md §9). Deliberately excludes waterway=stream ' +
        '(minor tributaries, ~8,300 ways in this bbox - a logged scope cut, see ' +
        'docs/ARCHITECTURE.md §7) and natural=glacier relations/multipolygons (60 in this ' +
        'bbox, out of scope for v1 - see docs/PROGRESS.md).',
      generatedAt: new Date().toISOString(),
      bboxWgs84: { south, west, north, east },
      count: features.length,
      features,
    },
    null,
    2,
  ),
);
console.log(`Wrote ${OUT_FILE}`);
