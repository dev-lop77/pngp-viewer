#!/usr/bin/env node
// Filters tools/osm-poi-draft.json (from tools/fetch-osm.mjs) down to the
// region we ship (tools/region.geojson, from tools/fetch-region.mjs) and
// writes public/data/poi.json.
//
// Per the user's explicit choice 2026-07-28: the draft was too large to
// curate by hand, so geographic filtering stands in for manual curation -
// "keep everything that falls within our project" - rather than a hand-picked
// subset. The categories already chosen (peak/hut/pass/waterfall/lake) are
// kept as-is.
//
// The polygon that decides "within our project" was the park alone until
// 2026-08-18; it is now the park plus the valleys our terrain draws, shared
// with build-trails/build-hydrology/build-roads via tools/lib/region.mjs.
//
// Usage: node tools/build-poi.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { setLocalOrigin } from '../src/geo.js';
import { loadRegion } from './lib/region.mjs';

const DRAFT_FILE = 'tools/osm-poi-draft.json';
const HEIGHTFIELD_FILE = 'public/data/heightfield.json';
const OUT_FILE = 'public/data/poi.json';

// Huts are the one category admitted from just outside the boundary (user's
// call, 2026-08-03: "cattura anche i rifugi subito fuori dal perimetro"). 750 m
// came from the real distance distribution against the park polygon rather
// than being picked: the huts just outside sat at 40 m (Sogno di Berdzé), 63 m
// (Ciavanassa) and 573 m (Rifugio Benevolo, the Val di Rhêmes classic), and
// the next one was 1542 m away - a 969 m gap, so the threshold landed in empty
// space instead of cutting through a continuum.
//
// Kept unchanged when the boundary became the region (2026-08-18), though it
// now does far less work: Benevolo and most of its neighbours are simply
// inside. The build prints what the buffer still admits, so the number stays
// answerable to the data rather than to its own history.
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
// A trailhead claims its own node by id (tools/trailheads.json is read before
// any tag), but the SAME hamlet can also carry a second place node a few metres
// away, and then Bruil would be labelled twice - once green as a trailhead and
// once as a village. Matched on name within this distance.
const VILLAGE_DEDUPE_M = 400;

const draft = JSON.parse(readFileSync(DRAFT_FILE, 'utf8'));
const heightfieldManifest = JSON.parse(readFileSync(HEIGHTFIELD_FILE, 'utf8'));
// Curation lives here, not in the fetch: the draft keeps OSM's raw names so
// fetch-osm.mjs can detect upstream renames, and relabelling a place costs a
// rebuild rather than an Overpass round trip.
const trailheadById = new Map(
  JSON.parse(readFileSync('tools/trailheads.json', 'utf8')).trailheads.map((t) => [t.id, t]),
);

setLocalOrigin(heightfieldManifest.localOrigin.x, heightfieldManifest.localOrigin.y);

// Point-in-region and distance-to-region both live in tools/lib/region.mjs
// now, in local scene metres - this file used to carry its own copy of the
// ring conversion and the point-to-edge distance, and having three copies of
// the same idea is how they drifted apart in the first place.
const region = loadRegion();

const kept = [];
const nearMisses = [];
for (const p of draft.pois) {
  // The draft carries unnamed waterfalls on purpose (tools/fetch-osm.mjs, for
  // build-hydrology.mjs' ribbons). A POI here is a name on a marker post, so
  // they have no place in poi.json.
  if (!p.name) continue;
  const insideBoundary = region.contains(p.local.x, p.local.z);
  // Trailheads are already an explicit, hand-curated id allowlist
  // (tools/trailheads.json), so the boundary test has nothing left to decide.
  // Their distance is still recorded for information.
  if (insideBoundary || p.category === 'trailhead') {
    const curated = trailheadById.get(`${p.osmType[0]}${p.osmId}`);
    kept.push({
      ...p,
      displayName: curated?.displayName,
      valley: curated?.valley,
      outsideByM: insideBoundary ? 0 : Math.round(region.metresOutside(p.local.x, p.local.z)),
    });
    continue;
  }
  if (p.category !== 'hut') continue; // villages, peaks, passes: inside or not at all
  const outsideByM = Math.round(region.metresOutside(p.local.x, p.local.z));
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

// A village that is really one of the 25 curated trailheads, wearing a second
// OSM node - see VILLAGE_DEDUPE_M.
const trailheadPoints = inside.filter((p) => p.category === 'trailhead');
const beforeVillageDedupe = inside.length;
for (let i = inside.length - 1; i >= 0; i--) {
  const p = inside[i];
  if (p.category !== 'village') continue;
  const twin = trailheadPoints.find(
    (t) => t.name === p.name && Math.hypot(t.local.x - p.local.x, t.local.z - p.local.z) <= VILLAGE_DEDUPE_M,
  );
  if (twin) inside.splice(i, 1);
}
if (beforeVillageDedupe !== inside.length) {
  console.log(`${beforeVillageDedupe - inside.length} village node(s) dropped as duplicates of a curated trailhead.`);
}

const byCategory = inside.reduce((acc, p) => {
  acc[p.category] = (acc[p.category] ?? 0) + 1;
  return acc;
}, {});
const dropped = kept.length - inside.length;
console.log(`${inside.length} / ${draft.pois.length} kept (${dropped} node/way hut duplicates merged).`);
console.log('By category:', byCategory);

const buffered = inside.filter((p) => p.outsideByM > 0 && p.category === 'hut');
console.log(`Huts admitted from outside the boundary (<= ${HUT_BUFFER_M} m):`);
for (const p of buffered.sort((a, b) => a.outsideByM - b.outsideByM)) {
  console.log(`  ${String(p.outsideByM).padStart(4)} m  ${p.name} [${p.hutKind ?? '?'}]`);
}
const trailheads = inside.filter((p) => p.category === 'trailhead');
console.log(`Trailheads (allowlist, tools/trailheads.json) - ${trailheads.length}:`);
for (const p of trailheads.sort((a, b) => a.outsideByM - b.outsideByM || a.name.localeCompare(b.name))) {
  const where = p.outsideByM ? `${String(p.outsideByM).padStart(4)} m outside` : '      INSIDE   ';
  console.log(`  ${where}  ${(p.displayName ?? p.name).padEnd(30)} ${String(Math.round(p.elevationM)).padStart(4)} m  ${p.valley ?? ''}`);
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
  // displayName only where OSM's own name would make a place unfindable by the
  // name people use - "Eaux Rousses" is mapped as "L'Eau-Rousse".
  name: p.displayName ?? p.name,
  hutKind: p.category === 'hut' ? p.hutKind : undefined,
  placeKind: p.category === 'village' ? p.placeKind : undefined,
  valley: p.valley,
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
  categories: ['peak', 'hut', 'pass', 'waterfall', 'lake', 'trailhead', 'village'],
  count: pois.length,
  boundary: region.describe(
    'a POI is included if it falls inside one of these polygons (point-in-polygon), except ' +
      `huts, which are also kept up to ${HUT_BUFFER_M} m outside - see outsideBoundaryByM on ` +
      'each POI and the rationale in tools/build-poi.mjs',
  ),
  source: {
    dataset: 'OpenStreetMap contributors',
    license: 'ODbL 1.0',
    attribution: '© OpenStreetMap contributors',
    fetchedVia: 'tools/fetch-osm.mjs + tools/fetch-region.mjs',
  },
  generatedBy: 'tools/build-poi.mjs',
  generatedAt: new Date().toISOString(),
  pois,
};

writeFileSync(OUT_FILE, JSON.stringify(output));
console.log(`Wrote ${OUT_FILE} (${pois.length} POIs)`);
