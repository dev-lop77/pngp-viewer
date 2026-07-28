#!/usr/bin/env node
// One-off fetch of the real Gran Paradiso National Park boundary from OSM
// (via Nominatim, which does the multipolygon ring-assembly server-side -
// simpler and more reliable than reassembling it ourselves from raw
// Overpass relation members). Saves a static tools/park-boundary.geojson
// so the regular build pipeline (tools/build-poi.mjs) doesn't need a
// network call - the park boundary doesn't change often, unlike the
// trail/POI datasets that benefit from re-fetching.
//
// Also resolves docs/ARCHITECTURE_SUGGESTIONS.md #6 (verify trail/POI
// coverage against the real park boundary, not just our bbox).
//
// Usage: node tools/fetch-park-boundary.mjs

import { writeFileSync } from 'node:fs';

const OUT_FILE = 'tools/park-boundary.geojson';

const url =
  'https://nominatim.openstreetmap.org/search' +
  '?q=Parco+Nazionale+Gran+Paradiso&format=json&polygon_geojson=1&limit=1';

const response = await fetch(url, {
  headers: { 'User-Agent': 'pngp-viewer/0.1 (tools/fetch-park-boundary.mjs, one-off boundary lookup)' },
});
if (!response.ok) {
  throw new Error(`Nominatim request failed: ${response.status} ${await response.text()}`);
}
const results = await response.json();
const match = results[0];
if (!match || match.osm_type !== 'relation' || match.class !== 'boundary') {
  throw new Error(`Unexpected Nominatim result: ${JSON.stringify(match)}`);
}

console.log(`Matched: "${match.display_name}" (osm relation ${match.osm_id})`);
console.log(`Geometry type: ${match.geojson.type}`);

const output = {
  type: 'Feature',
  properties: {
    name: match.name,
    source: 'OpenStreetMap (ODbL) via Nominatim',
    osmType: match.osm_type,
    osmId: match.osm_id,
    fetchedVia: 'tools/fetch-park-boundary.mjs',
    fetchedAt: new Date().toISOString(),
  },
  geometry: match.geojson,
};

writeFileSync(OUT_FILE, JSON.stringify(output));
console.log(`Wrote ${OUT_FILE}`);
