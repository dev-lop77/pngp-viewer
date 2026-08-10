#!/usr/bin/env node
// Turns tools/hydrology-draft.json (from tools/fetch-hydrology.mjs) plus a
// small hand-curated waterfall allowlist into public/data/water.json.
//
// Boundary filter: same rule as trails/POI (docs/ARCHITECTURE.md §4) - a
// lake/river/glacier is kept whole if any of its points fall inside the
// real park boundary, not clipped to it.
//
// Waterfalls are the one exception, by explicit user decision: only one
// waterfall node falls inside the *strict* boundary polygon
// (Cascatone dell'Umbrias), and it sits in the known DEM nodata gap (fake
// ~292m elevation, docs/PROGRESS.md). Cascate di Lillaz - the one
// ARCHITECTURE.md names by name - sits just 36m outside the boundary;
// Cascata Entrelor (50m) and Cascata Biolet (180m) are in the same real
// cluster near Cogne/Valnontey. Every other non-nodata-flagged candidate
// in tools/osm-poi-draft.json is 3.2km+ away (Pila, Rutor, Mascognaz -
// different valleys entirely) - a clean, non-arbitrary cutoff. Same
// precedent as the already-logged missing-Rifugio-Vittorio-Emanuele-II
// gap: hand-curated inclusion for named features the strict polygon test
// misses by a small margin.
//
// Usage: node tools/build-hydrology.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import proj4 from 'proj4';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point, polygon } from '@turf/helpers';
import { setLocalOrigin, worldToLocal } from '../src/geo.js';
import { sampleHeightfield, isNearNoData, decodeHeightfield } from '../src/heightfield.js';

const DRAFT_FILE = 'tools/hydrology-draft.json';
const POI_DRAFT_FILE = 'tools/osm-poi-draft.json';
const BOUNDARY_FILE = 'tools/park-boundary.geojson';
const HEIGHTFIELD_DIR = 'public/data';
const OUT_FILE = 'public/data/water.json';

// Distance-to-boundary computed and reviewed with the user before picking
// this list (see header comment) - not a guess from names.
const WATERFALL_ALLOWLIST = [
  { osmId: 843888598, name: 'Cascate di Lillaz' },
  { osmId: 7968946886, name: 'Cascata Entrelor' },
  { osmId: 1035891741, name: 'Cascata Biolet' },
];

// Waterfall ribbon shape (visual approximation, not a hydrological
// simulation - see buildWaterfallRibbon below).
const WF_STEP_M = 4; // horizontal marching step along the descent direction
const WF_MAX_STEPS = 50; // safety cap (200m horizontal march)
const WF_CLEARANCE_M = 1.5; // ribbon stays at least this far above sampled terrain
const WF_CLIMB_MARGIN_M = 3; // stop once we've climbed this far above the lowest point seen
const WF_WIDTH_TOP_M = 6;
const WF_WIDTH_BOTTOM_M = 14;

proj4.defs('EPSG:23032', '+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs');

const draft = JSON.parse(readFileSync(DRAFT_FILE, 'utf8'));
const poiDraft = JSON.parse(readFileSync(POI_DRAFT_FILE, 'utf8'));
const boundaryGeoJSON = JSON.parse(readFileSync(BOUNDARY_FILE, 'utf8'));
const heightfieldManifest = JSON.parse(readFileSync(`${HEIGHTFIELD_DIR}/heightfield.json`, 'utf8'));
const heightfieldBuffer = readFileSync(`${HEIGHTFIELD_DIR}/${heightfieldManifest.file.name}`);
const heights = decodeHeightfield(heightfieldBuffer, heightfieldManifest);
setLocalOrigin(heightfieldManifest.localOrigin.x, heightfieldManifest.localOrigin.y);

function sampleHeight(x, z) {
  return sampleHeightfield(heights, heightfieldManifest, x, z);
}

// Park boundary, converted to local scene coordinates once - same
// approach as tools/build-trails.mjs.
const boundaryLocalRing = boundaryGeoJSON.geometry.coordinates[0].map(([lon, lat]) => {
  const [e, n] = proj4('WGS84', 'EPSG:23032', [lon, lat]);
  const { x, z } = worldToLocal(e, n);
  return [x, z];
});
const boundaryPoly = polygon([boundaryLocalRing]);

function anyPointInBoundary(line) {
  return line.some(([x, , z]) => booleanPointInPolygon(point([x, z]), boundaryPoly));
}

const round1 = (n) => Math.round(n * 10) / 10;

function closeRing(line) {
  const [x0, y0, z0] = line[0];
  const [xn, , zn] = line[line.length - 1];
  if (x0 === xn && z0 === zn) return line;
  return [...line, [x0, y0, z0]];
}

// --- Lakes: flat water level = minimum sampled elevation around the
// shoreline, so the flat plane never pokes above the surrounding terrain.
// Also drops ponds under MIN_LAKE_SPAN_M across (real OSM data - mostly
// unnamed alpine tarns, see docs/PROGRESS.md - but many are a few meters
// wide, invisible at this scene's scale and not worth the triangulation
// cost).
const MIN_LAKE_SPAN_M = 20;
function ringSpan(line) {
  const xs = line.map(([x]) => x);
  const zs = line.map(([, , z]) => z);
  return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs));
}
const lakeFeatures = draft.features.filter(
  (f) => f.category === 'lake' && anyPointInBoundary(f.line) && ringSpan(f.line) >= MIN_LAKE_SPAN_M,
);
// A single shoreline vertex touching the known DEM nodata gap (§3, ~292m
// fake floor) would otherwise win the min() below and sink the whole lake
// to that fake elevation - found by inspecting real output (Lago Serrù,
// Teleccio, Nero, Valsoera... all real Piemonte-side lakes, 131/198 total)
// rather than assuming the naive min was safe. Prefer the min of only the
// non-nodata vertices; only fall back to the full (unreliable) min if a
// lake's shoreline never leaves the gap at all.
function waterLevelFor(ring) {
  const validYs = ring.filter(([x, , z]) => !isNearNoData(heights, heightfieldManifest, x, z)).map(([, y]) => y);
  return round1(Math.min(...(validYs.length ? validYs : ring.map(([, y]) => y))));
}

const lakes = lakeFeatures.map((f) => {
  const ring = closeRing(f.line);
  const waterLevelM = waterLevelFor(ring);
  return {
    osmId: f.osmId,
    name: f.name,
    dataIncomplete: f.dataIncomplete,
    waterLevelM,
    ring: ring.map(([x, , z]) => [round1(x), round1(z)]),
  };
});

// --- Rivers: kept whole (not clipped), per-vertex elevation as already
// sampled in the draft.
const riverFeatures = draft.features.filter((f) => f.category === 'river' && anyPointInBoundary(f.line));
const rivers = riverFeatures.map((f) => ({
  osmId: f.osmId,
  name: f.name,
  dataIncomplete: f.dataIncomplete,
  line: f.line.map(([x, y, z]) => [round1(x), round1(y), round1(z)]),
}));

// --- Glaciers: kept whole, per-vertex elevation so the footprint drapes
// over the real terrain shape (not flattened like lakes).
const glacierFeatures = draft.features.filter((f) => f.category === 'glacier' && anyPointInBoundary(f.line));
const glaciers = glacierFeatures.map((f) => {
  const ring = closeRing(f.line);
  return {
    osmId: f.osmId,
    name: f.name,
    dataIncomplete: f.dataIncomplete,
    ring: ring.map(([x, y, z]) => [round1(x), round1(y), round1(z)]),
  };
});

// --- Waterfalls: hand-curated allowlist (see header), ribbon marched
// downhill from the brink until the terrain clearly flattens out.
//
// This is a visual approximation of "the water hugs the cliff face and
// lands in the valley below," not a hydrological simulation: at each step
// we push outward along the initial steepest-descent direction until the
// ribbon is safely above the (smoothed, low-poly) GPU terrain, and we stop
// once several consecutive steps come back close to level - that's where
// the fall has visually "landed."
function steepestDescentDir(x, z) {
  const r = 15;
  let best = null;
  let bestY = sampleHeight(x, z);
  for (let a = 0; a < 16; a++) {
    const angle = (a / 16) * Math.PI * 2;
    const dx = Math.cos(angle);
    const dz = Math.sin(angle);
    const y = sampleHeight(x + dx * r, z + dz * r);
    if (y < bestY) {
      bestY = y;
      best = [dx, dz];
    }
  }
  return best ?? [0, 1];
}

function buildWaterfallRibbon(x0, z0) {
  const y0 = sampleHeight(x0, z0);
  const [ddx, ddz] = steepestDescentDir(x0, z0);

  const centerline = [[round1(x0), round1(y0), round1(z0)]];
  let outward = 0;
  let minY = y0;
  let minIdx = 0;

  for (let step = 1; step <= WF_MAX_STEPS; step++) {
    outward += WF_STEP_M;
    const x = x0 + ddx * outward;
    const z = z0 + ddz * outward;
    const terrainY = sampleHeight(x, z);
    const y = terrainY + WF_CLEARANCE_M;
    centerline.push([round1(x), round1(y), round1(z)]);

    if (y < minY) {
      minY = y;
      minIdx = centerline.length - 1;
    } else if (y > minY + WF_CLIMB_MARGIN_M) {
      break; // climbing back out of the gorge - the fall has landed before this
    }
  }
  // Real terrain isn't monotonic (ledges, boulders) - trim any climbing
  // tail so the ribbon always ends at its lowest point, never higher than
  // where it started.
  return centerline.slice(0, minIdx + 1);
}

const waterfalls = WATERFALL_ALLOWLIST.map(({ osmId, name }) => {
  const src = poiDraft.pois.find((p) => p.category === 'waterfall' && p.osmId === osmId);
  if (!src) throw new Error(`Waterfall allowlist entry not found in ${POI_DRAFT_FILE}: ${name} (${osmId})`);

  const centerline = buildWaterfallRibbon(src.local.x, src.local.z);
  const dropM = round1(centerline[0][1] - centerline[centerline.length - 1][1]);
  return {
    osmId,
    name,
    dataIncomplete: src.dataIncomplete,
    dropM,
    widthTopM: WF_WIDTH_TOP_M,
    widthBottomM: WF_WIDTH_BOTTOM_M,
    centerline,
  };
});

console.log(
  `Lakes: ${lakes.length}/${draft.features.filter((f) => f.category === 'lake').length}, ` +
    `Rivers: ${rivers.length}/${draft.features.filter((f) => f.category === 'river').length}, ` +
    `Glaciers: ${glaciers.length}/${draft.features.filter((f) => f.category === 'glacier').length} ` +
    'fall within the park boundary.',
);
console.log(`Waterfalls: ${waterfalls.length} (hand-curated allowlist, drops: ${waterfalls.map((w) => w.dropM + 'm').join(', ')})`);

const output = {
  schemaVersion: 1,
  crs: heightfieldManifest.crs,
  localOrigin: heightfieldManifest.localOrigin,
  axes: heightfieldManifest.axes,
  coordUnits: 'local scene meters, see localOrigin/axes above - same frame as the terrain',
  boundary: {
    name: boundaryGeoJSON.properties.name,
    source: boundaryGeoJSON.properties.source,
    filter:
      'lakes/rivers/glaciers: included only if at least one point falls inside this polygon. ' +
      'Waterfalls: hand-curated allowlist instead (see tools/build-hydrology.mjs header) - the ' +
      "park's named falls sit just outside the strict boundary.",
  },
  knownLimitations: [
    'waterway=stream (minor tributaries) and natural=glacier multipolygon relations are not ' +
      'fetched at all - a deliberate v1 scope cut, see docs/ARCHITECTURE.md §7.',
    'Waterfall ribbons are a build-time visual approximation (terrain-driven marching from the ' +
      'brink point), not a hydrological simulation.',
  ],
  source: {
    dataset: 'OpenStreetMap contributors',
    license: 'ODbL 1.0',
    attribution: '© OpenStreetMap contributors',
    fetchedVia: 'tools/fetch-hydrology.mjs + tools/fetch-osm.mjs (waterfalls)',
  },
  generatedBy: 'tools/build-hydrology.mjs',
  generatedAt: new Date().toISOString(),
  counts: { lakes: lakes.length, rivers: rivers.length, glaciers: glaciers.length, waterfalls: waterfalls.length },
  lakes,
  rivers,
  glaciers,
  waterfalls,
};

writeFileSync(OUT_FILE, JSON.stringify(output));
console.log(`Wrote ${OUT_FILE}`);
