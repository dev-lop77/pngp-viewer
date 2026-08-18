#!/usr/bin/env node
// One-off fetch of the region the viewer's vector data covers: the Gran
// Paradiso park polygon PLUS the valleys the user asked for on 2026-08-18.
// Writes a static tools/region.geojson so the regular builds
// (build-trails/build-poi/build-hydrology/build-roads) need no network call -
// same reasoning as tools/fetch-park-boundary.mjs, which this does not
// replace: the park polygon alone still decides where the 5 m terrain tier
// covers (tools/build-height-tier.mjs).
//
// WHY THE REGION IS BIGGER THAN THE PARK. Until 2026-08-18 every vector layer
// was clipped to the park itself, and the user kept finding real things
// missing: the trail from Thumel to Rifugio Benevolo (segnavia 13 - 0 of its
// 108 points fall inside the park, closest approach 516 m), Lago Goletta
// (0 of 18 points inside), the waterfall on the Dora di Goletta. The upper Val
// di Rhêmes simply is not in the park - the user confirmed it - yet our
// terrain draws it in full, and a trail that stops at an invisible line in the
// middle of a drawn valley reads as a bug. So the rule is now "the valleys we
// show, whole", expressed as the park plus three comuni.
//
// Why comuni and not a buffer around the park: a buffer would have to be ~1.3
// km to reach Rifugio Benevolo and would still cut the Valgrisenche in half,
// while grabbing an arbitrary rind everywhere else. A comune boundary follows
// the watershed the valley actually is.
//
// Measured cost of the three comuni over the park alone (2026-08-18):
// trails 73 -> 116, lakes/rivers/glaciers 255 -> 339, POI 405 -> 507, plus 722
// forest tracks - about +0.8 MB on a 24.2 MB first load.
//
// Usage: node tools/fetch-region.mjs

import { writeFileSync } from 'node:fs';

const OUT_FILE = 'tools/region.geojson';

// OSM relation ids, resolved once via Overpass by name and pinned here so a
// re-fetch cannot silently pick up a differently-named place. The names below
// are checked against what Nominatim returns.
const PARTS = [
  { osmId: 919270, role: 'park', name: 'Parco Nazionale Gran Paradiso' },
  { osmId: 45153, role: 'valley', name: 'Rhêmes-Notre-Dame' },
  { osmId: 45454, role: 'valley', name: 'Rhêmes-Saint-Georges' },
  { osmId: 45452, role: 'valley', name: 'Valgrisenche' },
];

const url =
  'https://nominatim.openstreetmap.org/lookup' +
  `?osm_ids=${PARTS.map((p) => `R${p.osmId}`).join(',')}` +
  '&format=json&polygon_geojson=1';

const response = await fetch(url, {
  headers: { 'User-Agent': 'pngp-viewer/0.1 (tools/fetch-region.mjs, one-off region lookup)' },
});
if (!response.ok) {
  throw new Error(`Nominatim request failed: ${response.status} ${await response.text()}`);
}
const results = await response.json();

const features = PARTS.map((part) => {
  const match = results.find((r) => Number(r.osm_id) === part.osmId && r.osm_type === 'relation');
  if (!match) throw new Error(`Nominatim returned nothing for relation ${part.osmId} (${part.name})`);
  if (match.name !== part.name) {
    throw new Error(`Relation ${part.osmId} is now named "${match.name}", this file expects "${part.name}"`);
  }
  const rings = match.geojson.type === 'Polygon' ? 1 : match.geojson.coordinates.length;
  const vertices = (match.geojson.type === 'Polygon' ? match.geojson.coordinates : match.geojson.coordinates.flat())
    .reduce((sum, ring) => sum + ring.length, 0);
  console.log(`${part.role.padEnd(6)} ${match.name.padEnd(30)} ${match.geojson.type} (${rings} part(s), ${vertices} vertices)`);
  return {
    type: 'Feature',
    properties: {
      name: match.name,
      role: part.role,
      source: 'OpenStreetMap (ODbL) via Nominatim',
      osmType: 'relation',
      osmId: part.osmId,
    },
    geometry: match.geojson,
  };
});

const output = {
  type: 'FeatureCollection',
  properties: {
    note:
      'The region whose trails, POI, water and forest roads the viewer ships: the park ' +
      'itself plus the valleys drawn by our terrain that the user asked to include ' +
      '(2026-08-18). A feature is kept if any of its points falls inside ANY part - the ' +
      'parts are not unioned geometrically, and they do overlap where a comune reaches ' +
      'into the park.',
    fetchedVia: 'tools/fetch-region.mjs',
    fetchedAt: new Date().toISOString(),
  },
  features,
};

writeFileSync(OUT_FILE, JSON.stringify(output));
console.log(`Wrote ${OUT_FILE}`);
