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
import proj4 from 'proj4';
import { setLocalOrigin, worldToLocal } from '../src/geo.js';

const DRAFT_FILE = 'tools/osm-poi-draft.json';
const BOUNDARY_FILE = 'tools/park-boundary.geojson';
const HEIGHTFIELD_FILE = 'public/data/heightfield.json';
const OUT_FILE = 'public/data/poi.json';

// Huts are the one category admitted from just outside the boundary (user's
// call, 2026-08-03: "cattura anche i rifugi subito fuori dal perimetro"). 750 m
// is taken from the real distance distribution rather than picked: the huts
// just outside sit at 40 m (Sogno di Berdzé), 63 m (Ciavanassa) and 573 m
// (Rifugio Benevolo, the Val di Rhêmes classic), and the next one is 1542 m
// away - a 969 m gap, so the threshold lands in empty space instead of cutting
// through a continuum. Same escape hatch as the hand-picked waterfalls, but
// derived from the data instead of a name list.
//
// Deliberately NOT extended to other categories: peaks and passes have no such
// gap, and settlements/trailheads are worse still - no buffer separates the
// wanted valley bases from ~100+ alpine-pasture toponyms, which is why those
// remain an open question rather than being solved with a number here.
const HUT_BUFFER_M = 750;
// The same hut often exists twice in OSM: once as a node, once as the
// building's way. Matched on name so genuinely distinct neighbours survive -
// Rifugio Vittorio Emanuele II's "Nuovo" and "Vecchio" are adjacent but are
// two real, separately interesting buildings.
const HUT_DEDUPE_M = 150;

const draft = JSON.parse(readFileSync(DRAFT_FILE, 'utf8'));
const boundary = JSON.parse(readFileSync(BOUNDARY_FILE, 'utf8'));
const heightfieldManifest = JSON.parse(readFileSync(HEIGHTFIELD_FILE, 'utf8'));

const geom = boundary.geometry;
const boundaryPoly =
  geom.type === 'Polygon' ? polygon(geom.coordinates) : multiPolygon(geom.coordinates);

// Boundary rings in local scene metres, so "how far outside" is a real metre
// distance. Converting the ring once is far cheaper than converting every
// POI to WGS84 and doing spherical maths - same approach as build-trails.mjs.
proj4.defs('EPSG:23032', '+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs');
setLocalOrigin(heightfieldManifest.localOrigin.x, heightfieldManifest.localOrigin.y);
const rings = (geom.type === 'Polygon' ? geom.coordinates : geom.coordinates.flat()).map((ring) =>
  ring.map(([lon, lat]) => {
    const [e, n] = proj4('WGS84', 'EPSG:23032', [lon, lat]);
    const { x, z } = worldToLocal(e, n);
    return [x, z];
  }),
);

// Distance to the nearest boundary EDGE, not the nearest vertex: with 7,857
// vertices around a park this size, vertex-only distance would overstate by
// tens of metres on a long straight stretch.
function metresFromBoundary(px, pz) {
  let best = Infinity;
  for (const ring of rings) {
    for (let i = 1; i < ring.length; i++) {
      const [ax, az] = ring[i - 1];
      const [bx, bz] = ring[i];
      const dx = bx - ax;
      const dz = bz - az;
      const lenSq = dx * dx + dz * dz;
      const t = lenSq > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / lenSq)) : 0;
      const cx = ax + t * dx;
      const cz = az + t * dz;
      const d = Math.hypot(px - cx, pz - cz);
      if (d < best) best = d;
    }
  }
  return best;
}

const kept = [];
const nearMisses = [];
for (const p of draft.pois) {
  if (booleanPointInPolygon(point([p.lon, p.lat]), boundaryPoly)) {
    kept.push({ ...p, outsideByM: 0 });
    continue;
  }
  if (p.category !== 'hut') continue;
  const outsideByM = Math.round(metresFromBoundary(p.local.x, p.local.z));
  if (outsideByM <= HUT_BUFFER_M) kept.push({ ...p, outsideByM });
  else if (outsideByM <= 3000) nearMisses.push({ ...p, outsideByM });
}

// Drop node/way duplicates of the same hut, keeping whichever carries an OSM
// `ele` tag (a cross-check against our own heightfield sampling) if only one does.
const inside = [];
for (const p of kept) {
  const twin =
    p.category === 'hut' &&
    inside.find(
      (q) =>
        q.category === 'hut' &&
        q.name === p.name &&
        Math.hypot(q.local.x - p.local.x, q.local.z - p.local.z) <= HUT_DEDUPE_M,
    );
  if (!twin) {
    inside.push(p);
  } else if (p.ele != null && twin.ele == null) {
    inside[inside.indexOf(twin)] = p;
  }
}

const byCategory = inside.reduce((acc, p) => {
  acc[p.category] = (acc[p.category] ?? 0) + 1;
  return acc;
}, {});
const dropped = kept.length - inside.length;
console.log(`${inside.length} / ${draft.pois.length} kept (${dropped} node/way hut duplicates merged).`);
console.log('By category:', byCategory);

const buffered = inside.filter((p) => p.outsideByM > 0);
console.log(`Huts admitted from outside the boundary (<= ${HUT_BUFFER_M} m):`);
for (const p of buffered.sort((a, b) => a.outsideByM - b.outsideByM)) {
  console.log(`  ${String(p.outsideByM).padStart(4)} m  ${p.name} [${p.hutKind ?? '?'}]`);
}
console.log(`Nearest huts still excluded (the gap that justifies ${HUT_BUFFER_M} m):`);
for (const p of nearMisses.sort((a, b) => a.outsideByM - b.outsideByM).slice(0, 3)) {
  console.log(`  ${String(p.outsideByM).padStart(4)} m  ${p.name} [${p.hutKind ?? '?'}]`);
}
const incomplete = inside.filter((p) => p.dataIncomplete);
console.log(`In a DEM nodata area (fake elevation): ${incomplete.length}` +
  (incomplete.length ? ` -> ${incomplete.map((p) => p.name).join(', ')}` : ''));

const pois = inside.map((p) => ({
  id: `${p.osmType[0]}${p.osmId}`,
  category: p.category,
  name: p.name,
  hutKind: p.category === 'hut' ? p.hutKind : undefined,
  elevationM: p.elevationM,
  osmElevationM: p.ele,
  dataIncomplete: p.dataIncomplete,
  outsideBoundaryByM: p.outsideByM || undefined,
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
    filter:
      'a POI is included if it falls inside this polygon (point-in-polygon), except huts, ' +
      `which are also kept up to ${HUT_BUFFER_M} m outside it - see outsideBoundaryByM on ` +
      'each POI and the rationale in tools/build-poi.mjs',
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
