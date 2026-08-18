#!/usr/bin/env node
// Turns tools/ferrata-draft.json (from tools/fetch-ferrata.mjs) into
// public/data/ferrata.json: the via ferratas inside the region, in the SAME
// record shape as a trail in trails.json, so src/trails.js can merge the two
// lists and everything downstream - the EEA line style with its cable ticks, the
// nearest-point label, the re-seating on the drawn ground - works unchanged.
//
// Two jobs beyond the usual region filter:
//
//   JOINING. OSM splits a route wherever a tag changes, so the Bethaz Bovard
//   arrives as "Via Ferrata Bethaz Bovard", "- Primo troncone" and "- Secundo
//   troncone", and the Voie du Paradis as "1/2" and "2/2" over six ways (two of
//   them suspension bridges). Drawn as separate features they would also be
//   LABELLED separately, three times over the same rock face. The pieces are
//   grouped by their route name with those suffixes stripped.
//
//   DIFFICULTY. Every one of these is EEA on the CAI scale - that is what a via
//   ferrata is - so the letter is set here rather than looked for in OSM, which
//   has no CAI field. OSM's own `via_ferrata_scale` (1-5) is carried through
//   separately: it says how hard the cable is, which the CAI letter does not.
//
// Usage: node tools/build-ferrata.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { setLocalOrigin } from '../src/geo.js';
import { loadRegion } from './lib/region.mjs';

const DRAFT_FILE = 'tools/ferrata-draft.json';
const HEIGHTFIELD_FILE = 'public/data/heightfield.json';
const OUT_FILE = 'public/data/ferrata.json';

const draft = JSON.parse(readFileSync(DRAFT_FILE, 'utf8'));
const heightfieldManifest = JSON.parse(readFileSync(HEIGHTFIELD_FILE, 'utf8'));
setLocalOrigin(heightfieldManifest.localOrigin.x, heightfieldManifest.localOrigin.y);
const region = loadRegion();

const round1 = (n) => Math.round(n * 10) / 10;

// A route mapped as a fragment is not a route. Measured on this very draft: the
// three real ferratas are 1,459 m, 660 m and 609 m long, and the other two
// "routes" inside the region are a 7 m and a 22 m stub of ways whose rest is not
// mapped - specks on the mountainside, and one of them (Punta Besei) carries an
// OSM note saying it is an alpine climb rather than a ferrata at all.
const MIN_LENGTH_M = 50;

// "Via Ferrata Bethaz Bovard - Primo troncone" -> "Via Ferrata Bethaz Bovard",
// 'Via Ferrata "La Voie du Paradis" 2/2' -> 'Via Ferrata "La Voie du Paradis"'.
// Nothing else is touched: a name that does not carry a piece marker IS the
// route's name.
function routeNameOf(name) {
  if (!name) return null;
  return name
    .replace(/\s*-\s*(primo|secundo|secondo|terzo|quarto)\s+troncone\s*$/i, '')
    .replace(/\s+\d\s*\/\s*\d\s*$/, '')
    .trim();
}

function lengthOf(line) {
  let total = 0;
  for (let i = 1; i < line.length; i++) {
    total += Math.hypot(line[i][0] - line[i - 1][0], line[i][2] - line[i - 1][2]);
  }
  return total;
}

function elevationGainLoss(lines) {
  let gain = 0;
  let loss = 0;
  for (const line of lines) {
    for (let i = 1; i < line.length; i++) {
      const delta = line[i][1] - line[i - 1][1];
      if (delta > 0) gain += delta;
      else loss += -delta;
    }
  }
  return { gain: round1(gain), loss: round1(loss) };
}

const routes = new Map();
let outsideRegion = 0;
for (const f of draft.features) {
  if (!region.containsAnyPoint(f.line)) {
    outsideRegion++;
    continue;
  }
  // An unnamed cabled way is its own route - there is nothing to group it with.
  const key = routeNameOf(f.name) ?? `osm-way-${f.osmId}`;
  let route = routes.get(key);
  if (!route) {
    routes.set(key, (route = { name: routeNameOf(f.name), osmIds: [], lines: [], scales: [], bridges: 0, dataIncomplete: false }));
  }
  route.osmIds.push(f.osmId);
  route.lines.push(f.line.map(([x, y, z]) => [round1(x), round1(y), round1(z)]));
  if (f.ferrataScale) route.scales.push(f.ferrataScale);
  if (f.bridge) route.bridges++;
  if (f.dataIncomplete) route.dataIncomplete = true;
}

const ferrata = [...routes.values()].map((route) => {
  const { gain, loss } = elevationGainLoss(route.lines);
  return {
    id: `ferrata-${route.osmIds.join('-')}`,
    osmIds: route.osmIds,
    segnavia: null, // a ferrata has a name, not a trail number
    name: route.name,
    // Every via ferrata is EEA - "con attrezzatura" is the definition, not a
    // judgement - which is also what gives it the cable-tick line style.
    difficulty: 'EEA',
    // The hardest cable scale among the route's pieces, where OSM has any.
    ferrataScale: route.scales.length ? Math.max(...route.scales) : null,
    bridges: route.bridges,
    lengthM: round1(route.lines.reduce((sum, line) => sum + lengthOf(line), 0)),
    elevGainM: gain,
    elevLossM: loss,
    dataIncomplete: route.dataIncomplete,
    lines: route.lines,
  };
});
const tooShort = ferrata.filter((f) => f.lengthM < MIN_LENGTH_M);
const kept = ferrata.filter((f) => f.lengthM >= MIN_LENGTH_M);
kept.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
for (const f of tooShort) {
  console.log(`  dropped, under ${MIN_LENGTH_M} m: ${f.name ?? '(unnamed)'} (${Math.round(f.lengthM)} m)`);
}

console.log(`${kept.length} via ferrata routes from ${draft.features.length - outsideRegion} ways inside the region (${outsideRegion} outside):`);
for (const f of kept) {
  console.log(
    `  ${(f.name ?? '(unnamed)').padEnd(38)} ${String(Math.round(f.lengthM)).padStart(5)} m, +${Math.round(f.elevGainM)} m` +
      `${f.ferrataScale ? `, scale ${f.ferrataScale}` : ''}${f.bridges ? `, ${f.bridges} bridge(s)` : ''}` +
      `, ${f.lines.length} piece(s)`,
  );
}

const output = {
  schemaVersion: 1,
  crs: heightfieldManifest.crs,
  localOrigin: heightfieldManifest.localOrigin,
  axes: heightfieldManifest.axes,
  coordUnits: 'local scene meters [x, y, z], see localOrigin/axes above - same frame as the terrain',
  count: kept.length,
  recordShape:
    'the same fields as a trail in trails.json (id, name, difficulty, lengthM, elevGainM, lines), ' +
    'so src/trails.js merges the two lists and draws them with one code path - plus ferrataScale ' +
    'and bridges, which a trail does not have',
  boundary: region.describe(
    'a via ferrata is included only if at least one point falls inside one of these polygons',
  ),
  source: {
    dataset: 'OpenStreetMap contributors',
    license: 'ODbL 1.0',
    attribution: '© OpenStreetMap contributors',
    fetchedVia: 'tools/fetch-ferrata.mjs',
  },
  generatedBy: 'tools/build-ferrata.mjs',
  generatedAt: new Date().toISOString(),
  ferrata: kept,
};

writeFileSync(OUT_FILE, JSON.stringify(output));
console.log(`Wrote ${OUT_FILE} (${kept.length} routes)`);
