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
import { overpass } from './lib/overpass.mjs';

const OUT_FILE = 'tools/osm-poi-draft.json';

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

// THE VILLAGES, added 2026-08-18: "in generale, i nomi dei paesi all'interno
// delle valli siano di aiuto" - the user, after walking the Valgrisenche and
// finding it unlabelled. This is the `place=*` filter the trailhead allowlist's
// own header rejected, and it is admissible now for one reason: the region
// (tools/region.geojson) is what it is measured against instead of the whole DEM
// bbox. Measured: 620 place nodes in the region's bbox, 235 of them inside the
// region itself - 6 villages, 160 hamlets and 69 isolated dwellings.
//
// village + hamlet + town + city, NOT isolated_dwelling: a single farm building
// or an alpine hut group is not a place you walk through, and 69 of them would
// be 69 more names competing with the peaks and the passes for the same screen.
// `locality` stays out for the same reason it always was - 381 mostly meaningless
// toponyms.
const PLACE_QL = `node["place"~"^(city|town|village|hamlet)$"]`;

const CATEGORY_QUERIES = [
  { category: 'peak', ql: `node["natural"="peak"]`, bbox: 'dem' },
  ...HUT_QL.map((ql) => ({ category: 'hut', ql, bbox: 'dem' })),
  { category: 'pass', ql: `node["mountain_pass"="yes"]`, bbox: 'dem' },
  { category: 'pass', ql: `node["natural"="saddle"]`, bbox: 'dem' },
  { category: 'waterfall', ql: `node["waterway"="waterfall"]`, bbox: 'dem' },
  { category: 'lake', ql: `way["natural"="water"]`, bbox: 'dem' },
  { category: 'lake', ql: `way["natural"="lake"]`, bbox: 'dem' },
  // The region's bbox, like the forest roads and the streams: over the DEM bbox
  // this same query returns ~5,500 toponyms from valleys we do not draw.
  { category: 'village', ql: PLACE_QL, bbox: 'region' },
];

// Region bbox, from the polygons' own lon/lat - no projection needed for a box.
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
const BBOXES = {
  dem: `${south},${west},${north},${east}`,
  region: `${rSouth},${rWest},${rNorth},${rEast}`,
};
console.log(`Places only over the region bbox ${BBOXES.region}.`);

// Valley bases / trailheads come from an explicit id allowlist rather than a
// tag query - see tools/trailheads.json for why a `place=*` filter or a
// boundary buffer can't do this job. Fetching the ids directly also keeps
// ~5,500 irrelevant toponyms out of the draft.
const trailheads = JSON.parse(readFileSync('tools/trailheads.json', 'utf8')).trailheads;
const trailheadById = new Map(trailheads.map((t) => [t.id, t]));

const elements = await overpass(
  [
    ...CATEGORY_QUERIES.map((c) => `${c.ql}(${BBOXES[c.bbox]});`),
    `node(id:${trailheads.map((t) => t.id.slice(1)).join(',')});`,
  ],
  {
    what: 'POI draft',
    timeoutS: 180,
    // `center`, not `geom`: a hut mapped as a building way and a lake mapped as
    // an area each want one representative point, which is what this file's
    // lat/lon handling below expects.
    out: 'center',
    userAgent: 'pngp-viewer/0.1 (tools/fetch-osm.mjs, POI draft extraction)',
  },
);

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
  if (t.place === 'city' || t.place === 'town' || t.place === 'village' || t.place === 'hamlet') return 'village';
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
    // village vs hamlet: the same category on screen, but the info panel should
    // not call a five-house hamlet a village.
    placeKind: el.tags?.place ?? null,
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
