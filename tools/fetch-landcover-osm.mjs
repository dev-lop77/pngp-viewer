#!/usr/bin/env node
// Step 1 of the landcover-mask pipeline (grass and shrubs, 2026-08-12): pull the
// raw open-vegetation polygons covering our bbox from Overpass and cache them on
// disk. tools/build-landcover.mjs turns the cache into the shipped masks; this
// file does no interpretation beyond assigning each polygon a CLASS, which is
// the one thing the rasteriser cannot recover from geometry alone.
//
// Same fetch/build split, same mirror walking and the same gitignored draft as
// tools/fetch-forest.mjs - read that file's header for why. This is deliberately
// its sibling rather than an extension of it: `natural=wood` answers "is there a
// canopy here", and mixing open vegetation into that mask would make one texture
// mean two incompatible things (the note at the top of fetch-forest.mjs's TAGS
// said exactly this and left the door open).
//
// WHY THESE TAGS. Counted on this bbox before choosing them, rather than assumed
// (Overpass `out count`, 2026-08-12), against the 569 `natural=wood` features the
// working forest mask is built from:
//
//   natural=scrub       861   thicket: alder, juniper, willow - the real shrubs
//   natural=heath      1347   dwarf-shrub heath: rhododendron, blueberry
//   landuse=meadow     2679   mown or grazed grass, mostly valley and mid-slope
//   natural=grassland   555   unmanaged grass
//   natural=fell        584   grazed ground above the treeline: alpine turf
//
// So the shrubs are mapped BETTER here than the woods are, which is what made
// the OSM route the honest one rather than a guess dressed up as data.
//
// `natural=fell` is carried as its own class instead of being folded into grass
// because it is not the same thing: it is the thin, discontinuous turf of the
// alpine zone, and the difference between it and a mown valley meadow is most of
// what the eye uses to read altitude on a hillside. build-landcover.mjs weights
// it down; keeping the distinction here means that weight can be retuned without
// another Overpass round trip.
//
// Usage: node tools/fetch-landcover.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import proj4 from 'proj4';

const OUT_FILE = 'tools/landcover-draft.json';
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

// key, value, and the class the rasteriser groups it under.
const TAGS = [
  { key: 'natural', value: 'scrub', class: 'scrub' },
  { key: 'natural', value: 'heath', class: 'heath' },
  { key: 'landuse', value: 'meadow', class: 'meadow' },
  { key: 'natural', value: 'grassland', class: 'grassland' },
  { key: 'natural', value: 'fell', class: 'fell' },
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

const query =
  `[out:json][timeout:900];\n(\n` +
  TAGS.flatMap((t) => [
    `  way["${t.key}"="${t.value}"](${bbox});`,
    `  relation["${t.key}"="${t.value}"](${bbox});`,
  ]).join('\n') +
  `\n);\nout geom;`;

console.log(`Querying Overpass for open vegetation in ${bbox}`);
console.log(`(${TAGS.length} tags, ways and relations, out geom - expect minutes and tens of MB)`);

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
        'User-Agent': 'pngp-viewer/0.1 (tools/fetch-landcover.mjs, landcover mask extraction)',
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

// Which class an element belongs to, from its own tags. A polygon can legally
// carry two of our keys (a grazed heath tagged both natural=heath and
// landuse=meadow); TAGS order decides, shrubs first, because a dwarf-shrub heath
// that somebody also marked as pasture is still visibly a heath.
function classify(el) {
  const tags = el.tags ?? {};
  for (const t of TAGS) if (tags[t.key] === t.value) return t.class;
  return null;
}

const unclassified = [];
function polygonsOf(list, ringsOf) {
  return list
    .map((el) => {
      const cls = classify(el);
      if (!cls) {
        unclassified.push(`${el.type[0]}${el.id}`);
        return null;
      }
      const rings = ringsOf(el);
      return rings.length ? { id: `${el.type[0]}${el.id}`, class: cls, rings } : null;
    })
    .filter(Boolean);
}

const draft = {
  generatedBy: 'tools/fetch-landcover.mjs',
  generatedAt: new Date().toISOString(),
  bboxWgs84: { south, west, north, east },
  source: {
    name: 'OpenStreetMap contributors',
    attribution: '(c) OpenStreetMap contributors',
    license: 'ODbL 1.0',
    licenseUrl: 'https://opendatacommons.org/licenses/odbl/1-0/',
    query: `${TAGS.map((t) => `${t.key}=${t.value}`).join(' + ')}, ways and relations, out geom`,
  },
  counts: { ways: ways.length, relations: relations.length },
  classes: TAGS.map((t) => t.class),
  // Each entry is a list of rings, exactly as tools/forest-draft.json holds
  // them, plus the class. A ring is [[lon, lat], ...]; relation rings carry
  // their role so the rasteriser can honour inner holes under the even-odd rule.
  polygons: [
    ...polygonsOf(
      ways.filter((w) => w.geometry?.filter(Boolean).length >= 3),
      (w) => [{ role: 'outer', points: w.geometry.filter(Boolean).map((p) => [p.lon, p.lat]) }],
    ),
    ...polygonsOf(relations, (r) =>
      (r.members ?? [])
        .filter((mem) => mem.type === 'way' && mem.geometry?.length >= 2)
        .map((mem) => ({
          role: mem.role === 'inner' ? 'inner' : 'outer',
          points: mem.geometry.filter(Boolean).map((p) => [p.lon, p.lat]),
        })),
    ),
  ],
};

// Report anything discarded rather than letting the polygon count quietly differ
// from what Overpass returned - the same rule fetch-forest.mjs learned when its
// count and its geometry disagreed by 127 ways.
const droppedWays = ways.filter((w) => !(w.geometry?.filter(Boolean).length >= 3));
const droppedRelations = relations.filter(
  (r) => !(r.members ?? []).some((mem) => mem.type === 'way' && mem.geometry?.length >= 2),
);
if (droppedWays.length || droppedRelations.length) {
  console.log(
    `\nDropped as unusable: ${droppedWays.length} ways, ${droppedRelations.length} relations ` +
      `(fewer than 3 / 2 usable vertices).`,
  );
}
// A returned element with none of our tags would mean the query and the
// classifier disagree, which is the kind of silent mismatch that ends up as an
// empty class in the mask.
if (unclassified.length) {
  console.log(`\nWARNING: ${unclassified.length} elements matched the query but no class: ` +
    `${unclassified.slice(0, 8).join(', ')}`);
}

const byClass = {};
for (const p of draft.polygons) byClass[p.class] = (byClass[p.class] ?? 0) + 1;
draft.polygonsByClass = byClass;

const points = draft.polygons.reduce((n, p) => n + p.rings.reduce((k, r) => k + r.points.length, 0), 0);
writeFileSync(OUT_FILE, JSON.stringify(draft));
console.log(
  `\n${draft.polygons.length} polygons (${ways.length} ways, ${relations.length} relations), ` +
    `${points.toLocaleString()} vertices -> ${OUT_FILE}`,
);
for (const t of TAGS) console.log(`  ${t.class.padEnd(10)} ${(byClass[t.class] ?? 0).toString().padStart(5)}`);
console.log('\nNext: node tools/build-landcover.mjs');
