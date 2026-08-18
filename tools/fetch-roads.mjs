#!/usr/bin/env node
// Pulls the forest roads (OSM highway=track) of the shipped region from
// Overpass into tools/roads-draft.json - a raw draft, mirroring
// tools/fetch-hydrology.mjs's structure (same elevation sampling against our
// own heightfield, same "draft now, filter at build time" split).
//
// WHY THIS LAYER EXISTS. The user asked for the forest roads on 2026-08-18,
// with the Thumel -> Rifugio Benevolo road as the example: in the real valley
// you reach the refuge along a jeep track, and a viewer that draws only the
// footpath is missing the way most people actually walk up. That road is OSM
// way 112844128 - it passes 155 m from Le Thumel and 10 m from the refuge.
//
// SCOPE, deliberately narrow (docs/ARCHITECTURE.md §10):
//   - highway=track only. Not `path`/`footway` (that is what the VDA trail
//     dataset already draws, far better attributed), and not the paved
//     `unclassified`/`service` valley roads, which are streets rather than
//     something you set out to walk.
//   - The REGION's bounding box, not the terrain's. Every other fetcher asks
//     for the whole DEM bbox, but tracks are dense where people live: the
//     whole-bbox query is ~10x larger and Overpass refused it outright. If
//     tools/region.geojson ever grows, re-run this.
//
// Usage: node tools/fetch-roads.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import proj4 from 'proj4';
import { setLocalOrigin, worldToLocal } from '../src/geo.js';
import { sampleHeightfield, isNearNoData, decodeHeightfield } from '../src/heightfield.js';

const REGION_FILE = 'tools/region.geojson';
const OUT_FILE = 'tools/roads-draft.json';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

proj4.defs('EPSG:23032', '+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs');

const heightfieldManifest = JSON.parse(readFileSync('public/data/heightfield.json', 'utf8'));
const heightfieldBuffer = readFileSync(`public/data/${heightfieldManifest.file.name}`);
const heights = decodeHeightfield(heightfieldBuffer, heightfieldManifest);
setLocalOrigin(heightfieldManifest.localOrigin.x, heightfieldManifest.localOrigin.y);

// Region bbox straight from the polygons, in the lon/lat they are stored in -
// no projection needed for a bounding box, and it stays right automatically if
// the region changes.
const region = JSON.parse(readFileSync(REGION_FILE, 'utf8'));
let south = Infinity;
let north = -Infinity;
let west = Infinity;
let east = -Infinity;
for (const feature of region.features) {
  const g = feature.geometry;
  for (const ring of g.type === 'Polygon' ? g.coordinates : g.coordinates.flat()) {
    for (const [lon, lat] of ring) {
      if (lat < south) south = lat;
      if (lat > north) north = lat;
      if (lon < west) west = lon;
      if (lon > east) east = lon;
    }
  }
}

console.log(`Querying Overpass for region bbox ${south.toFixed(4)},${west.toFixed(4)},${north.toFixed(4)},${east.toFixed(4)}...`);

const query = `[out:json][timeout:180];\n(\n  way["highway"="track"](${south},${west},${north},${east});\n);\nout geom;`;

const response = await fetch(OVERPASS_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
    'User-Agent': 'pngp-viewer/0.1 (tools/fetch-roads.mjs, forest road draft extraction)',
  },
  body: `data=${encodeURIComponent(query)}`,
});
if (!response.ok) {
  throw new Error(`Overpass request failed: ${response.status} ${await response.text()}`);
}
const { elements } = await response.json();
console.log(`Overpass returned ${elements.length} elements.`);

function convertLine(geometry) {
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

const seen = new Set();
const features = [];
for (const el of elements) {
  if (el.type !== 'way' || !el.geometry?.length) continue;
  const key = `${el.type}${el.id}`;
  if (seen.has(key)) continue;
  seen.add(key);

  const { points, hasNoData } = convertLine(el.geometry);
  features.push({
    osmId: el.id,
    // Most of these have no name at all (a forest road is rarely named), which
    // is fine: unlike a POI, a line does not need a label to be worth drawing.
    name: el.tags?.name ?? el.tags?.['name:it'] ?? null,
    // Kept for a possible later distinction between a graded gravel road and a
    // grassy double track. Nothing reads them yet - the user asked for a single
    // white line for all of them (2026-08-18).
    tracktype: el.tags?.tracktype ?? null,
    surface: el.tags?.surface ?? null,
    dataIncomplete: hasNoData,
    line: points,
  });
}

const named = features.filter((f) => f.name).length;
const vertices = features.reduce((sum, f) => sum + f.line.length, 0);
console.log(`${features.length} tracks (${named} named), ${vertices} vertices.`);

writeFileSync(
  OUT_FILE,
  JSON.stringify(
    {
      note:
        'DRAFT for tools/build-roads.mjs, not public/data/roads.json - the build step applies ' +
        'the region filter (tools/region.geojson). Source: OpenStreetMap (ODbL, attribution ' +
        'required - see docs/ARCHITECTURE.md §9). highway=track only, fetched over the ' +
        "region's bounding box rather than the whole DEM bbox - see the header of " +
        'tools/fetch-roads.mjs for both scope cuts.',
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
