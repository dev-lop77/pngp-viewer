#!/usr/bin/env node
// Step 1 of the forest-mask pipeline (phase 6 vegetation): pull the raw
// `natural=wood` / `landuse=forest` polygons covering our bbox from Overpass
// and cache them on disk. tools/build-forest.mjs turns the cache into the
// shipped mask; this file does no interpretation, same fetch/build split as
// fetch-osm.mjs + build-poi.mjs (which exists because curating inside the fetch
// forced an Overpass round trip for every relabel).
//
// Two departures from the other fetch tools, both deliberate:
//
//  - `out geom` not `out center`: we need the actual outlines, not a point.
//  - the draft is **gitignored**, unlike tools/osm-poi-draft.json. There are
//    ~4,300 polygons here and the response runs to tens of MB, which is not
//    something to carry in git when it regenerates with one command. The
//    shipped artefact (a small mask) is what gets committed.
//
// Usage: node tools/fetch-forest.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import proj4 from 'proj4';

const OUT_FILE = 'tools/forest-draft.json';
// The main instance 504'd on a plain count query while this was being written,
// so mirrors are walked rather than failing the run.
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

proj4.defs('EPSG:23032', '+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs');

const manifest = JSON.parse(readFileSync('public/data/heightfield.json', 'utf8'));
const { xmin, ymin, xmax, ymax } = manifest.bboxCrsUnits;
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
const bbox = `${south},${west},${north},${east}`;

// Only tree cover. `natural=scrub` would suit the subalpine band's rhododendron
// but it isn't trees, and mixing it in here would make the mask mean two things.
const TAGS = [`["natural"="wood"]`, `["landuse"="forest"]`];
const query =
  `[out:json][timeout:600];\n(\n` +
  TAGS.flatMap((t) => [`  way${t}(${bbox});`, `  relation${t}(${bbox});`]).join('\n') +
  `\n);\nout geom;`;

console.log(`Querying Overpass for forest cover in ${bbox}`);
console.log('(this is a large geometry request - expect minutes, not seconds)');

let payload = null;
for (const url of ENDPOINTS) {
  const started = Date.now();
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'User-Agent': 'pngp-viewer/0.1 (tools/fetch-forest.mjs, forest mask extraction)',
      },
      body: `data=${encodeURIComponent(query)}`,
    });
  } catch (err) {
    console.warn(`  ${url} -> ${err.message}`);
    continue;
  }
  if (!res.ok) {
    console.warn(`  ${url} -> HTTP ${res.status}`);
    continue;
  }
  const text = await res.text();
  console.log(`  ${url} -> ${(text.length / 1e6).toFixed(1)} MB in ${((Date.now() - started) / 1000).toFixed(0)}s`);
  payload = JSON.parse(text);
  break;
}
if (!payload) throw new Error('every Overpass endpoint failed');

const elements = payload.elements ?? [];
const ways = elements.filter((e) => e.type === 'way');
const relations = elements.filter((e) => e.type === 'relation');

// Keep only what the rasteriser needs. The full response carries per-node ids
// and tag dictionaries we will never look at, and dropping them here is the
// difference between a ~10 MB cache and a ~100 MB one.
const draft = {
  generatedBy: 'tools/fetch-forest.mjs',
  generatedAt: new Date().toISOString(),
  bboxWgs84: { south, west, north, east },
  source: {
    name: 'OpenStreetMap contributors',
    attribution: '(c) OpenStreetMap contributors',
    license: 'ODbL 1.0',
    licenseUrl: 'https://opendatacommons.org/licenses/odbl/1-0/',
    query: `natural=wood + landuse=forest, ways and relations, out geom`,
  },
  counts: { ways: ways.length, relations: relations.length },
  // Each entry is a list of rings; a ring is [[lon, lat], ...]. Relation rings
  // carry their role so build-forest.mjs can honour inner holes.
  polygons: [
    ...ways
      .filter((w) => w.geometry?.length >= 3)
      .map((w) => ({
        id: `w${w.id}`,
        rings: [{ role: 'outer', points: w.geometry.filter(Boolean).map((p) => [p.lon, p.lat]) }],
      })),
    ...relations.map((r) => ({
      id: `r${r.id}`,
      rings: (r.members ?? [])
        .filter((mem) => mem.type === 'way' && mem.geometry?.length >= 2)
        .map((mem) => ({
          role: mem.role === 'inner' ? 'inner' : 'outer',
          points: mem.geometry.filter(Boolean).map((p) => [p.lon, p.lat]),
        })),
    })),
  ].filter((p) => p.rings.length > 0),
};

// Report anything discarded rather than letting the polygon count quietly differ
// from what Overpass returned. A first run mismatched an earlier `out count` by 127
// ways, and the endpoints differed (the count came from overpass-api.de after
// this request 504'd there and fell through to a mirror), so replication lag
// between instances is the likely explanation - but silence would have hidden a
// real geometry problem just as well.
const droppedWays = ways.filter((w) => !(w.geometry?.filter(Boolean).length >= 3));
const droppedRelations = relations.filter(
  (r) => !(r.members ?? []).some((mem) => mem.type === 'way' && mem.geometry?.length >= 2),
);
if (droppedWays.length || droppedRelations.length) {
  console.log(
    `\nDropped as unusable: ${droppedWays.length} ways, ${droppedRelations.length} relations ` +
      `(fewer than 3 / 2 usable vertices).`,
  );
  if (droppedWays.length) console.log(`  e.g. ways ${droppedWays.slice(0, 5).map((w) => w.id).join(', ')}`);
}

const points = draft.polygons.reduce((n, p) => n + p.rings.reduce((k, r) => k + r.points.length, 0), 0);
writeFileSync(OUT_FILE, JSON.stringify(draft));
console.log(
  `\n${draft.polygons.length} polygons (${ways.length} ways, ${relations.length} relations), ` +
    `${points.toLocaleString()} vertices -> ${OUT_FILE}`,
);
console.log('Next: node tools/build-forest.mjs');
