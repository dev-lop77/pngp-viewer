#!/usr/bin/env node
// Pulls the via ferratas of the shipped region from OpenStreetMap into
// tools/ferrata-draft.json - same shape as tools/fetch-roads.mjs (region bbox,
// elevation sampled from our own heightfield, region filter left to the build).
//
// WHY A SEPARATE SOURCE. The user asked for two by name on 2026-08-18: "Ci
// dovrebbero essere almeno due vie ferrate, una in Valgrisenche, partenza vicino
// al capoluogo, ed una in Val di Rhemes, a Chanavey." Both exist, and neither is
// in the VDA trail dataset that feeds trails.json - that dataset has 10 EEA
// (attrezzato) trails in the whole region and none of them is a ferrata proper.
// OSM has them as `highway=via_ferrata`, with the cable scale on most:
//   - Via Ferrata Bethaz Bovard, Valgrisenche, right by the capoluogo (three
//     ways, scale 3, plus a marked escape route)
//   - Via Ferrata di Casimiro, above Chanavey in the Val di Rhemes (scale on the
//     way, with a four-cable suspension bridge as its own way)
// and it turns up a third inside the park that they did not ask for: "La Voie du
// Paradis" in Valsavarenche, operated by the comune.
//
// SCOPE: `highway=via_ferrata` only - the cabled sections. The approach and
// return paths OSM names "Partenza/Rientro Via Ferrata di ..." are ordinary
// footpaths and belong with the trails, not here.
//
// Usage: node tools/fetch-ferrata.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import proj4 from 'proj4';
import { setLocalOrigin, worldToLocal } from '../src/geo.js';
import { sampleHeightfield, isNearNoData, decodeHeightfield } from '../src/heightfield.js';
import { overpass } from './lib/overpass.mjs';

const REGION_FILE = 'tools/region.geojson';
const OUT_FILE = 'tools/ferrata-draft.json';

proj4.defs('EPSG:23032', '+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs');

const heightfieldManifest = JSON.parse(readFileSync('public/data/heightfield.json', 'utf8'));
const heightfieldBuffer = readFileSync(`public/data/${heightfieldManifest.file.name}`);
const heights = decodeHeightfield(heightfieldBuffer, heightfieldManifest);
setLocalOrigin(heightfieldManifest.localOrigin.x, heightfieldManifest.localOrigin.y);

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
console.log(`Querying Overpass for via ferratas in ${south.toFixed(4)},${west.toFixed(4)},${north.toFixed(4)},${east.toFixed(4)}...`);

const elements = await overpass(`way["highway"="via_ferrata"](${south},${west},${north},${east});`, {
  what: 'via ferratas',
  timeoutS: 180,
  userAgent: 'pngp-viewer/0.1 (tools/fetch-ferrata.mjs, via ferrata draft extraction)',
});

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
    name: el.tags?.name ?? el.tags?.['name:it'] ?? null,
    // The cable scale, 1-5, where OSM has it - kept because it is the one number
    // that says what a ferrata asks of you, and it is not in the CAI letter grade.
    ferrataScale: el.tags?.via_ferrata_scale ? Number(el.tags.via_ferrata_scale) : null,
    bridge: el.tags?.bridge === 'yes',
    dataIncomplete: hasNoData,
    line: points,
  });
}

const named = features.filter((f) => f.name);
console.log(`${features.length} via ferrata ways (${named.length} named):`);
for (const f of named) {
  console.log(`  ${f.name}${f.ferrataScale ? ` (scale ${f.ferrataScale})` : ''}${f.bridge ? ' [bridge]' : ''}`);
}

writeFileSync(
  OUT_FILE,
  JSON.stringify(
    {
      note:
        'DRAFT for tools/build-ferrata.mjs, not public/data/ferrata.json - the build step ' +
        'applies the region filter (tools/region.geojson) and joins the pieces of each route. ' +
        'Source: OpenStreetMap (ODbL, attribution required - see docs/ARCHITECTURE.md §9). ' +
        'highway=via_ferrata only: the approach and return footpaths OSM names after each ' +
        'ferrata belong with the trails.',
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
