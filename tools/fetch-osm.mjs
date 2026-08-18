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
import { sampleHeightfield, isNearNoData, decodeHeightfield } from '../src/heightfield.js';

const OUT_FILE = 'tools/osm-poi-draft.json';
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

// The hut queries were `node["tourism"="alpine_hut"]` alone until 2026-08-03,
// which found 4 in-park huts where there are 35 - it missed ~89% of them, and
// the shortfall had been wrongly blamed on OSM tagging completeness
// (docs/ARCHITECTURE.md §4). Two independent causes, both fixed here:
//
//  - nodes only. Many huts are mapped as a building `way`, including Rifugio
//    Vittorio Emanuele II - the park's most famous - plus Città di Chivasso,
//    Savoia and Pontese. `out center;` below already gives ways a
//    representative point, so this costs nothing.
//  - one tag out of three. `tourism=wilderness_hut` covers unstaffed huts, and
//    `amenity=shelter` + `shelter_type=basic_hut` is how essentially every
//    *bivacco* in the park is tagged. Other `shelter_type` values are checked
//    and deliberately not included: `public_transport` is bus stops, and
//    `picnic_shelter`/`gazebo`/`rock_shelter` are not places you can stay.
const HUT_QL = [
  `["tourism"="alpine_hut"]`,
  `["tourism"="wilderness_hut"]`,
  `["amenity"="shelter"]["shelter_type"="basic_hut"]`,
].flatMap((tags) => [`node${tags}`, `way${tags}`]);

const CATEGORY_QUERIES = [
  { category: 'peak', ql: `node["natural"="peak"]` },
  ...HUT_QL.map((ql) => ({ category: 'hut', ql })),
  { category: 'pass', ql: `node["mountain_pass"="yes"]` },
  { category: 'pass', ql: `node["natural"="saddle"]` },
  { category: 'waterfall', ql: `node["waterway"="waterfall"]` },
  { category: 'lake', ql: `way["natural"="water"]` },
  { category: 'lake', ql: `way["natural"="lake"]` },
];

// Valley bases / trailheads come from an explicit id allowlist rather than a
// tag query - see tools/trailheads.json for why a `place=*` filter or a
// boundary buffer can't do this job. Fetching the ids directly also keeps
// ~5,500 irrelevant toponyms out of the draft.
const trailheads = JSON.parse(readFileSync('tools/trailheads.json', 'utf8')).trailheads;
const trailheadById = new Map(trailheads.map((t) => [t.id, t]));

const query =
  `[out:json][timeout:90];\n(\n` +
  CATEGORY_QUERIES.map((c) => `  ${c.ql}(${south},${west},${north},${east});`).join('\n') +
  `\n  node(id:${trailheads.map((t) => t.id.slice(1)).join(',')});` +
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
  // Before the tag checks: a trailhead is defined by being on the allowlist,
  // not by its tags (they range over hamlet/village/locality/farm).
  if (trailheadById.has(`${el.type[0]}${el.id}`)) return 'trailhead';
  if (t.natural === 'peak') return 'peak';
  if (t.tourism === 'alpine_hut' || t.tourism === 'wilderness_hut') return 'hut';
  if (t.amenity === 'shelter' && t.shelter_type === 'basic_hut') return 'hut';
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
    // Kept so build-poi.mjs can tell a staffed rifugio from a bivacco, and so
    // a future re-read can see which of the three hut tags matched.
    hutKind: el.tags?.tourism ?? (el.tags?.shelter_type ? `shelter:${el.tags.shelter_type}` : null),
    // Raw OSM name on purpose. The allowlist's displayName/valley are applied
    // by build-poi.mjs, not here: this draft is the unedited fetch, and keeping
    // curation out of it means relabelling a place doesn't cost an Overpass
    // round trip - only the build re-runs.
    name: el.tags?.name ?? el.tags?.['name:it'] ?? null,
    ele: el.tags?.ele ? Number(el.tags.ele) : null,
    elevationM,
    dataIncomplete,
    lat,
    lon,
    local: { x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10 },
  });
}

// An id allowlist is only safe if upstream changes are noticed: OSM nodes do
// get deleted, retagged or renamed, and a silently missing trailhead would
// just look like the allowlist was never applied.
const returnedById = new Map(elements.map((el) => [`${el.type[0]}${el.id}`, el]));
for (const t of trailheads) {
  const el = returnedById.get(t.id);
  if (!el) {
    console.warn(`  ! trailhead ${t.id} (${t.name}) no longer exists in OSM - check it`);
  } else if (el.tags?.name !== t.name) {
    console.warn(`  ! trailhead ${t.id} is now named "${el.tags?.name}", allowlist expects "${t.name}"`);
  }
}

const byCategory = pois.reduce((acc, p) => {
  acc[p.category] = (acc[p.category] ?? 0) + 1;
  return acc;
}, {});
// A POI can't be shown without a label, so unnamed ones go - with one
// exception since 2026-08-18: WATERFALLS. A fall is not a name on a marker
// post, it is a ribbon that build-hydrology.mjs marches down the terrain from
// the brink point, and that file gives each one a name of its own from a
// small hand-curated allowlist. Dropping unnamed waterfalls here is exactly
// why the fall on the Dora di Goletta - which the user stood in front of and
// asked about - could never reach the pipeline: it has no name in OSM.
// build-poi.mjs still ships only named POIs, so nothing gains a blank label.
const keptUnnamed = (p) => !p.name && p.category === 'waterfall';
const named = pois.filter((p) => p.name || keptUnnamed(p));
const unnamedWaterfalls = named.filter(keptUnnamed).length;
console.log('Raw, by category:', byCategory);
console.log(
  `Dropping ${pois.length - named.length} unnamed (can't show a POI with no label) -> ` +
    `${named.length} left, including ${unnamedWaterfalls} unnamed waterfalls kept for ` +
    'tools/build-hydrology.mjs.',
);

writeFileSync(
  OUT_FILE,
  JSON.stringify(
    {
      note:
        'DRAFT for review, not public/data/poi.json - curate this (remove junk, fix names, ' +
        'add missing places), then it feeds tools/build-poi.mjs. Source: OpenStreetMap ' +
        '(ODbL, attribution required if these ship as-is - see docs/ARCHITECTURE.md §9). ' +
        `Unnamed elements already dropped (${pois.length - named.length} of ${pois.length}) - ` +
        "can't show a POI with no label anyway - except unnamed waterfalls " +
        `(${unnamedWaterfalls} kept), which build-hydrology.mjs names itself.`,
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
