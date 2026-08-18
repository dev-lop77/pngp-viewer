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
// Narrower than the full hydrology picture (docs/ARCHITECTURE.md §10
// performance principle), but less so since 2026-08-18: STREAMS are fetched
// too, over the REGION's bounding box rather than the whole DEM bbox. The user
// looked at the two lakes at the head of the Val di Rhemes and said the obvious
// thing - "non si vedono i torrenti in uscita dai due laghi" - and they were
// right: the Dora di Goletta, which drains Lago di Golette past the waterfall
// they had just asked about, is a waterway=stream and so was never fetched.
//
// Why the region's bbox and not the DEM's: 8,369 streams in the DEM bbox
// against 3,284 in the region's, and the build only keeps what falls inside the
// region anyway. Same reasoning, same consequence as tools/fetch-roads.mjs -
// growing the region needs a re-fetch, not just a rebuild.
//
// Still natural=glacier ways only, not the 60 multipolygon relations also
// present - same "prefer the simple case, flag the rest as a known gap"
// choice already made for the park boundary (Nominatim over hand-rolled
// relation assembly).
//
// Usage: node tools/fetch-hydrology.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import proj4 from 'proj4';
import { setLocalOrigin, worldToLocal } from '../src/geo.js';
import { sampleHeightfield, isNearNoData, decodeHeightfield } from '../src/heightfield.js';
import { overpass } from './lib/overpass.mjs';

const OUT_FILE = 'tools/hydrology-draft.json';

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

// Region bbox for the streams, straight from the polygons in the lon/lat they
// are stored in - no projection needed for a bounding box, and it follows the
// region automatically if that changes.
const region = JSON.parse(readFileSync('tools/region.geojson', 'utf8'));
let rSouth = Infinity;
let rNorth = -Infinity;
let rWest = Infinity;
let rEast = -Infinity;
for (const feature of region.features) {
  const g = feature.geometry;
  for (const ring of g.type === 'Polygon' ? g.coordinates : g.coordinates.flat()) {
    for (const [lon, lat] of ring) {
      if (lat < rSouth) rSouth = lat;
      if (lat > rNorth) rNorth = lat;
      if (lon < rWest) rWest = lon;
      if (lon > rEast) rEast = lon;
    }
  }
}
console.log(`Streams only over the region bbox ${rSouth.toFixed(4)},${rWest.toFixed(4)},${rNorth.toFixed(4)},${rEast.toFixed(4)}.`);

const DEM_BBOX = `${south},${west},${north},${east}`;
const REGION_BBOX = `${rSouth},${rWest},${rNorth},${rEast}`;

// TWO requests, not one union, and the streams are why: asking for lakes +
// rivers + glaciers over the DEM bbox AND 3,284 stream geometries in a single
// query got a 429 from Overpass rather than data. The retrying transport lives
// in tools/lib/overpass.mjs.
const REQUESTS = [
  { what: 'lakes, rivers, glaciers (DEM bbox)', ql: [
    `way["natural"="water"](${DEM_BBOX});`,
    `way["natural"="lake"](${DEM_BBOX});`,
    `way["waterway"="river"](${DEM_BBOX});`,
    `way["natural"="glacier"](${DEM_BBOX});`,
  ] },
  { what: 'streams (region bbox)', ql: [`way["waterway"="stream"](${REGION_BBOX});`] },
];

const elements = [];
for (const request of REQUESTS) {
  elements.push(...(await overpass(request.ql, {
    what: request.what,
    timeoutS: 300,
    userAgent: 'pngp-viewer/0.1 (tools/fetch-hydrology.mjs, hydrology draft extraction)',
  })));
}
console.log(`Overpass returned ${elements.length} elements in total.`);

function categoryFor(el) {
  const t = el.tags ?? {};
  if (t.natural === 'water' || t.natural === 'lake') return 'lake';
  if (t.waterway === 'river') return 'river';
  if (t.waterway === 'stream') return 'stream';
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
        'applies the region filter (tools/region.geojson). Source: OpenStreetMap (ODbL, ' +
        'attribution required - see docs/ARCHITECTURE.md §9). Lakes, rivers and glaciers ' +
        "cover the whole DEM bbox; STREAMS cover only the region's bbox (3,284 ways against " +
        '8,369, and the build keeps only what is inside the region anyway - see the header ' +
        'of tools/fetch-hydrology.mjs). Still excludes natural=glacier ' +
        'relations/multipolygons (60 in this bbox, out of scope for v1 - see ' +
        'docs/PROGRESS.md).',
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
