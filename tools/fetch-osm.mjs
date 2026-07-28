#!/usr/bin/env node
// Pulls candidate POIs (peaks, huts/rifugi, passes, waterfalls, lakes) from
// OpenStreetMap/Overpass for the PNGP bbox - a raw draft for the user to
// review and curate, not the final public/data/poi.json (docs/ARCHITECTURE.md
// §4: "hand-authored, cross-checked against OSM output" - this flips that
// around, OSM as the starting point instead of just a cross-check, per the
// user's explicit choice 2026-07-28).
//
// Converts OSM's native WGS84 lat/lon to our EPSG:23032 bbox (via proj4,
// verified against the known Mont Blanc summit control point - see
// docs/PROGRESS.md) and on to local scene coordinates (src/geo.js) with
// elevation sampled from our own heightfield (src/heightfield.js) - same
// rules as terrain/trails.
//
// Usage: node tools/fetch-osm.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import proj4 from 'proj4';
import { setLocalOrigin, worldToLocal } from '../src/geo.js';
import { sampleHeightfield, isNearNoData } from '../src/heightfield.js';

const OUT_FILE = 'tools/osm-poi-draft.json';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

proj4.defs('EPSG:23032', '+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs');

const heightfieldManifest = JSON.parse(readFileSync('public/data/heightfield.json', 'utf8'));
const heightfieldBuffer = readFileSync(`public/data/${heightfieldManifest.file.name}`);
const heights = new Uint16Array(
  heightfieldBuffer.buffer,
  heightfieldBuffer.byteOffset,
  heightfieldBuffer.byteLength / 2,
);
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
  { category: 'peak', ql: `node["natural"="peak"]` },
  { category: 'hut', ql: `node["tourism"="alpine_hut"]` },
  { category: 'pass', ql: `node["mountain_pass"="yes"]` },
  { category: 'pass', ql: `node["natural"="saddle"]` },
  { category: 'waterfall', ql: `node["waterway"="waterfall"]` },
  { category: 'lake', ql: `way["natural"="water"]` },
  { category: 'lake', ql: `way["natural"="lake"]` },
];

const query =
  `[out:json][timeout:90];\n(\n` +
  CATEGORY_QUERIES.map((c) => `  ${c.ql}(${south},${west},${north},${east});`).join('\n') +
  `\n);\nout center;`;

const response = await fetch(OVERPASS_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
    'User-Agent': 'pngp-viewer/0.1 (tools/fetch-osm.mjs, POI draft extraction)',
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
  if (t.natural === 'peak') return 'peak';
  if (t.tourism === 'alpine_hut') return 'hut';
  if (t.mountain_pass === 'yes' || t.natural === 'saddle') return 'pass';
  if (t.waterway === 'waterfall') return 'waterfall';
  if (t.natural === 'water' || t.natural === 'lake') return 'lake';
  return 'unknown';
}

const pois = [];
for (const el of elements) {
  const lat = el.type === 'node' ? el.lat : el.center?.lat;
  const lon = el.type === 'node' ? el.lon : el.center?.lon;
  if (lat == null || lon == null) continue;

  const [e, n] = proj4('WGS84', 'EPSG:23032', [lon, lat]);
  const { x, z } = worldToLocal(e, n);
  const elevationM = Math.round(sampleHeightfield(heights, heightfieldManifest, x, z) * 10) / 10;
  const dataIncomplete = isNearNoData(heights, heightfieldManifest, x, z);

  pois.push({
    osmType: el.type,
    osmId: el.id,
    category: categoryFor(el),
    name: el.tags?.name ?? el.tags?.['name:it'] ?? null,
    ele: el.tags?.ele ? Number(el.tags.ele) : null,
    elevationM,
    dataIncomplete,
    lat,
    lon,
    local: { x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10 },
  });
}

const byCategory = pois.reduce((acc, p) => {
  acc[p.category] = (acc[p.category] ?? 0) + 1;
  return acc;
}, {});
const named = pois.filter((p) => p.name);
console.log('Raw, by category:', byCategory);
console.log(`Dropping ${pois.length - named.length} unnamed (can't show a POI with no label) -> ${named.length} left.`);

writeFileSync(
  OUT_FILE,
  JSON.stringify(
    {
      note:
        'DRAFT for review, not public/data/poi.json - curate this (remove junk, fix names, ' +
        'add missing places), then it feeds tools/build-poi.mjs. Source: OpenStreetMap ' +
        '(ODbL, attribution required if these ship as-is - see docs/ARCHITECTURE.md §9). ' +
        `Unnamed elements already dropped (${pois.length - named.length} of ${pois.length}) - ` +
        "can't show a POI with no label anyway.",
      generatedAt: new Date().toISOString(),
      bboxWgs84: { south, west, north, east },
      count: named.length,
      pois: named,
    },
    null,
    2,
  ),
);
console.log(`Wrote ${OUT_FILE}`);
