#!/usr/bin/env node
// Filters tools/osm-poi-draft.json (from tools/fetch-osm.mjs) down to the
// real Gran Paradiso National Park boundary (tools/park-boundary.geojson,
// from tools/fetch-park-boundary.mjs) and writes public/data/poi.json.
//
// Per the user's explicit choice 2026-07-28: the draft was too large to
// curate by hand, so geographic filtering against the real park boundary
// stands in for manual curation - "keep everything that falls within our
// project" - rather than a hand-picked subset. The categories already
// chosen (peak/hut/pass/waterfall/lake) are kept as-is.
//
// Usage: node tools/build-poi.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point, polygon, multiPolygon } from '@turf/helpers';

const DRAFT_FILE = 'tools/osm-poi-draft.json';
const BOUNDARY_FILE = 'tools/park-boundary.geojson';
const HEIGHTFIELD_FILE = 'public/data/heightfield.json';
const OUT_FILE = 'public/data/poi.json';

const draft = JSON.parse(readFileSync(DRAFT_FILE, 'utf8'));
const boundary = JSON.parse(readFileSync(BOUNDARY_FILE, 'utf8'));
const heightfieldManifest = JSON.parse(readFileSync(HEIGHTFIELD_FILE, 'utf8'));

const geom = boundary.geometry;
const boundaryPoly =
  geom.type === 'Polygon' ? polygon(geom.coordinates) : multiPolygon(geom.coordinates);

const inside = draft.pois.filter((p) => booleanPointInPolygon(point([p.lon, p.lat]), boundaryPoly));

const byCategory = inside.reduce((acc, p) => {
  acc[p.category] = (acc[p.category] ?? 0) + 1;
  return acc;
}, {});
console.log(`${inside.length} / ${draft.pois.length} fall within the park boundary.`);
console.log('By category:', byCategory);

const pois = inside.map((p) => ({
  id: `${p.osmType[0]}${p.osmId}`,
  category: p.category,
  name: p.name,
  elevationM: p.elevationM,
  osmElevationM: p.ele,
  dataIncomplete: p.dataIncomplete,
  local: p.local,
}));

const output = {
  schemaVersion: 1,
  crs: heightfieldManifest.crs,
  localOrigin: heightfieldManifest.localOrigin,
  axes: heightfieldManifest.axes,
  coordUnits: 'local scene meters {x, z} at ground level - see localOrigin/axes above, same frame as the terrain',
  categories: ['peak', 'hut', 'pass', 'waterfall', 'lake'],
  count: pois.length,
  boundary: {
    name: boundary.properties.name,
    source: boundary.properties.source,
    filter: 'a POI is included only if it falls inside this polygon (point-in-polygon)',
  },
  source: {
    dataset: 'OpenStreetMap contributors',
    license: 'ODbL 1.0',
    attribution: '© OpenStreetMap contributors',
    fetchedVia: 'tools/fetch-osm.mjs + tools/fetch-park-boundary.mjs',
  },
  generatedBy: 'tools/build-poi.mjs',
  generatedAt: new Date().toISOString(),
  pois,
};

writeFileSync(OUT_FILE, JSON.stringify(output));
console.log(`Wrote ${OUT_FILE} (${pois.length} POIs)`);
