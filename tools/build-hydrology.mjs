#!/usr/bin/env node
// Turns tools/hydrology-draft.json (from tools/fetch-hydrology.mjs) plus a
// small hand-curated waterfall allowlist into public/data/water.json.
//
// Region filter: same rule as trails/POI (docs/ARCHITECTURE.md §4), and
// since 2026-08-18 literally the same code - tools/lib/region.mjs. A
// lake/river/glacier is kept whole if any of its points fall inside the
// region (park + the valleys our terrain draws), not clipped to it.
//
// Waterfalls are the one exception, by explicit user decision: they stay a
// hand-curated allowlist. A waterfall is not just a point on a map here, it
// is a rendered ribbon marched down the terrain (buildWaterfallRibbon
// below), so it has to be a fall we have actually looked at - and OSM's
// waterfall nodes in this region are half unnamed and sometimes duplicated
// on the same spot. The list is small enough to keep honest by hand.
//
// Usage: node tools/build-hydrology.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { setLocalOrigin } from '../src/geo.js';
import { sampleHeightfield, isNearNoData, decodeHeightfield } from '../src/heightfield.js';
import { loadRegion } from './lib/region.mjs';

const DRAFT_FILE = 'tools/hydrology-draft.json';
const POI_DRAFT_FILE = 'tools/osm-poi-draft.json';
const HEIGHTFIELD_DIR = 'public/data';
const OUT_FILE = 'public/data/water.json';

// Distance-to-boundary computed and reviewed with the user before picking
// the first three (see header comment) - not a guess from names.
//
// The fourth was pointed at directly: the user stood at 45.52285, 7.08510
// looking west-north-west and asked why the fall in front of them was not
// there (2026-08-18). It is OSM node 4397259567, 252 m away on that bearing,
// with the `Dora di Goletta` running within 120 m of it - the Goletta fall
// below Lago Goletta, above Rifugio Benevolo. Two things had hidden it: it is
// outside the park (fixed by the region rule), and it is UNNAMED in OSM, so
// tools/fetch-osm.mjs used to drop it before this file ever saw it. The name
// below is ours, from the stream it falls from; OSM also carries a duplicate
// node (9836453182) on the exact same coordinates, which we simply do not
// list.
// The fifth came the same way as the fourth, on the same day: "Anche in uscita
// dal Tsanteleina c'è una famosa cascata". Node 1281730839 sits at 2,541.7 m -
// 156 m below Lago Tsanteleina (2,697.9 m) - and lies EXACTLY on stream
// 112844050, the torrent that drains it (measured: 0 m from the line). Unnamed
// in OSM like the Goletta one, so the name below is again ours, from the lake it
// falls from.
const WATERFALL_ALLOWLIST = [
  { osmId: 843888598, name: 'Cascate di Lillaz' },
  { osmId: 7968946886, name: 'Cascata Entrelor' },
  { osmId: 1035891741, name: 'Cascata Biolet' },
  { osmId: 4397259567, name: 'Cascata di Goletta' },
  { osmId: 1281730839, name: 'Cascata di Tsanteleina' },
];

// Waterfall ribbon shape (visual approximation, not a hydrological
// simulation - see buildWaterfallRibbon below).
//
// REBUILT 2026-08-18 on the user's verdict of the first one they saw: "La
// cascata si vede. Non è bellissima, penso si possa migliorare, anche usando
// più poligoni." Three things were wrong with it, and only the third is about
// polygon count:
//
//  1. It marched in ONE direction, fixed at the brink. A real fall follows the
//     gully it cut; ours ran dead straight across whatever the slope did, which
//     on a 137 m drop meant leaving the watercourse entirely. The direction is
//     now re-derived at every step and blended with the previous one, so the
//     line curves instead of either running straight or zig-zagging between
//     adjacent samples.
//  2. It stopped by CLIMBING or by running out of steps - and the Goletta fall
//     hit the step cap, i.e. it did not end where the water lands, it ended
//     where the loop gave up. It now also stops when the ground goes flat, which
//     is what "landed" actually means, and the cap is far enough away to be a
//     safety net rather than the usual exit.
//  3. Four-metre steps over a 10 m terrain grid gave a coarse, faceted strip.
//     2.5 m steps put several samples inside every terrain cell.
const WF_STEP_M = 2.5; // horizontal marching step along the descent direction
const WF_MAX_STEPS = 160; // safety cap (400 m horizontal march)
const WF_CLEARANCE_M = 1.2; // ribbon stays at least this far above sampled terrain
const WF_CLIMB_MARGIN_M = 3; // stop once we've climbed this far above the lowest point seen
// The fall has landed when the ground under it stops falling away. Measured over
// a WINDOW rather than a single step, because a single 2.5 m step on a 10 m
// terrain grid is mostly interpolation noise: 15% over 12.5 m of run is under
// two metres of drop, far less than any real fall and far more than a runout.
const WF_FLAT_GRADE = 0.15;
const WF_FLAT_WINDOW = 5;
// ...but not before the fall has begun. The DEM rounds off the very lip a fall
// pours over - at 10-20 m per pixel it cannot do otherwise - so the first steps
// out of the brink can be gentle enough to read as "landed" before any water has
// gone anywhere. Cascata di Tsanteleina proved it: with the landing test armed
// from the first step it measured a 1 m drop, and with this grace period it
// finds the 33 m the ground really loses below it.
const WF_START_RUN_M = 20;
const WF_START_DROP_M = 8;
// A backstop on the length of the whole thing. Without it the march simply
// becomes the stream: Cascata Entrelor ran 386 m and stopped only because it hit
// the step cap, which is the loop giving up rather than the water landing.
const WF_MAX_RUN_M = 240;
// How much of the new steepest-descent direction to take at each step. All of it
// zig-zags between adjacent 10 m terrain samples; none of it is the straight
// line this used to be.
const WF_TURN_BLEND = 0.35;
// ...and steepest descent is only the FALLBACK. A waterfall is a point on a
// watercourse, and since 2026-08-18 we have the watercourses (streams, above),
// so the march follows the mapped torrent whenever one runs within this distance
// and only guesses from the terrain when none does. It shows: marched off the
// terrain alone, the Goletta fall came down beside its own stream rather than
// on it, which is exactly the sort of thing that makes a fall look wrong without
// being obviously wrong.
const WF_STREAM_SNAP_M = 30;
const WF_WIDTH_TOP_M = 5;
const WF_WIDTH_BOTTOM_M = 16;

const draft = JSON.parse(readFileSync(DRAFT_FILE, 'utf8'));
const poiDraft = JSON.parse(readFileSync(POI_DRAFT_FILE, 'utf8'));
const heightfieldManifest = JSON.parse(readFileSync(`${HEIGHTFIELD_DIR}/heightfield.json`, 'utf8'));
const heightfieldBuffer = readFileSync(`${HEIGHTFIELD_DIR}/${heightfieldManifest.file.name}`);
const heights = decodeHeightfield(heightfieldBuffer, heightfieldManifest);
setLocalOrigin(heightfieldManifest.localOrigin.x, heightfieldManifest.localOrigin.y);

function sampleHeight(x, z) {
  return sampleHeightfield(heights, heightfieldManifest, x, z);
}

// The shipped region, shared with build-trails.mjs and build-poi.mjs.
const region = loadRegion();
const anyPointInBoundary = region.containsAnyPoint;

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

// --- Streams: the torrents. Fetched and shipped since 2026-08-18, when the user
// stood above the two lakes at the head of the Val di Rhemes and pointed out
// what was missing - "non si vedono i torrenti in uscita dai due laghi". They
// were the deliberate v1 scope cut (docs/ARCHITECTURE.md §7), and the cut was
// wrong once the region shrank the problem: 1,967 of the 3,285 fetched streams
// fall inside the region, 1,260 km of them.
//
// The 150 m floor is measured rather than picked: it drops 577 stub ways -
// culvert ends, a few vertices where a torrent crosses a road - for 50 km of the
// 1,260, and each of those would still cost a full ribbon in the mesh.
const MIN_STREAM_LENGTH_M = 150;
// And simplified, which is where the real saving is. A stream ships as a 3 m
// ribbon over a 10-20 m terrain grid, so a vertex that moves the line sideways
// by less than its own width changes nothing on screen. Measured on this very
// data (median vertex gap 17.9 m): 1 m tolerance drops 26% of the vertices, 3 m
// drops 51%, 5 m drops 64%. 3 m is taken - one ribbon width, so the worst a
// dropped vertex can do is shift the line within its own footprint - and it
// halves the whole layer.
const STREAM_SIMPLIFY_M = 3;
// Ramer-Douglas-Peucker on the XZ plane, keeping each retained point's own
// sampled elevation.
function simplifyLine(points, epsilon) {
  if (points.length < 3) return points;
  const [ax, , az] = points[0];
  const [bx, , bz] = points[points.length - 1];
  const dx = bx - ax;
  const dz = bz - az;
  const chord = Math.hypot(dx, dz);
  let worst = -1;
  let worstIdx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, , pz] = points[i];
    const d = chord === 0
      ? Math.hypot(px - ax, pz - az)
      : Math.abs(dx * (pz - az) - dz * (px - ax)) / chord;
    if (d > worst) {
      worst = d;
      worstIdx = i;
    }
  }
  if (worst <= epsilon) return [points[0], points[points.length - 1]];
  return [
    ...simplifyLine(points.slice(0, worstIdx + 1), epsilon).slice(0, -1),
    ...simplifyLine(points.slice(worstIdx), epsilon),
  ];
}
function lineLengthM(line) {
  let total = 0;
  for (let i = 1; i < line.length; i++) {
    total += Math.hypot(line[i][0] - line[i - 1][0], line[i][2] - line[i - 1][2]);
  }
  return total;
}
const streamFeatures = draft.features.filter(
  (f) => f.category === 'stream' && anyPointInBoundary(f.line) && lineLengthM(f.line) >= MIN_STREAM_LENGTH_M,
);
let streamVerticesBefore = 0;
const streams = streamFeatures.map((f) => {
  streamVerticesBefore += f.line.length;
  return {
    osmId: f.osmId,
    name: f.name,
    dataIncomplete: f.dataIncomplete,
    line: simplifyLine(f.line, STREAM_SIMPLIFY_M).map(([x, y, z]) => [round1(x), round1(y), round1(z)]),
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
// The downhill direction at a point, sampled on a ring around it. The radius is
// the terrain's own cell size rather than a smaller step: asking closer in just
// reads the bilinear interpolation between the same two samples.
function steepestDescentDir(x, z, radius = 12) {
  let best = null;
  let bestY = sampleHeight(x, z);
  for (let a = 0; a < 32; a++) {
    const angle = (a / 32) * Math.PI * 2;
    const dx = Math.cos(angle);
    const dz = Math.sin(angle);
    const y = sampleHeight(x + dx * radius, z + dz * radius);
    if (y < bestY) {
      bestY = y;
      best = [dx, dz];
    }
  }
  return best;
}

// A coarse grid over every stream vertex, so asking "is there a watercourse
// here?" at each of a few hundred march steps does not scan 58,000 points.
const STREAM_CELL_M = 200;
const streamIndex = new Map();
for (const f of draft.features) {
  if (f.category !== 'stream') continue;
  for (let i = 0; i < f.line.length - 1; i++) {
    const [x, , z] = f.line[i];
    const key = `${Math.floor(x / STREAM_CELL_M)},${Math.floor(z / STREAM_CELL_M)}`;
    let bucket = streamIndex.get(key);
    if (!bucket) streamIndex.set(key, (bucket = []));
    bucket.push({ line: f.line, i });
  }
}

// The downhill direction of the nearest mapped watercourse, or null if none is
// close enough. The segment's own direction is used, flipped if the stream was
// drawn uphill - OSM way direction is not guaranteed to follow the flow.
function streamDirAt(x, z) {
  const cx = Math.floor(x / STREAM_CELL_M);
  const cz = Math.floor(z / STREAM_CELL_M);
  let best = null;
  let bestDist = WF_STREAM_SNAP_M;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const bucket = streamIndex.get(`${cx + dx},${cz + dz}`);
      if (!bucket) continue;
      for (const { line, i } of bucket) {
        const d = Math.hypot(line[i][0] - x, line[i][2] - z);
        if (d < bestDist) {
          bestDist = d;
          best = { line, i };
        }
      }
    }
  }
  if (!best) return null;
  const a = best.line[best.i];
  const b = best.line[best.i + 1];
  const sign = b[1] <= a[1] ? 1 : -1; // follow the water, not the way's drawing order
  const dx = (b[0] - a[0]) * sign;
  const dz = (b[2] - a[2]) * sign;
  const len = Math.hypot(dx, dz);
  return len > 0 ? [dx / len, dz / len] : null;
}

function buildWaterfallRibbon(x0, z0) {
  const y0 = sampleHeight(x0, z0);
  let [dx, dz] = streamDirAt(x0, z0) ?? steepestDescentDir(x0, z0) ?? [0, 1];

  const centerline = [[round1(x0), round1(y0), round1(z0)]];
  let x = x0;
  let z = z0;
  let minY = y0;
  let minIdx = 0;
  let run = 0;

  for (let step = 1; step <= WF_MAX_STEPS; step++) {
    // Turn toward the mapped torrent if there is one here, and toward the local
    // downhill if there is not - so the fall follows the water rather than the
    // direction it happened to start in.
    const turn = streamDirAt(x, z) ?? steepestDescentDir(x, z);
    if (turn) {
      dx += (turn[0] - dx) * WF_TURN_BLEND;
      dz += (turn[1] - dz) * WF_TURN_BLEND;
      const len = Math.hypot(dx, dz) || 1;
      dx /= len;
      dz /= len;
    }
    x += dx * WF_STEP_M;
    z += dz * WF_STEP_M;
    const y = sampleHeight(x, z) + WF_CLEARANCE_M;
    centerline.push([round1(x), round1(y), round1(z)]);

    run += WF_STEP_M;
    if (y < minY) {
      minY = y;
      minIdx = centerline.length - 1;
    } else if (y > minY + WF_CLIMB_MARGIN_M) {
      break; // climbing back out of the gorge - the fall has landed before this
    }
    if (run >= WF_MAX_RUN_M) break;
    // Landed: the ground under the water has stopped falling away, measured over
    // the last WF_FLAT_WINDOW steps - and only once the fall has actually
    // started (see WF_START_RUN_M).
    const started = run >= WF_START_RUN_M && y0 - y >= WF_START_DROP_M;
    if (started && centerline.length > WF_FLAT_WINDOW) {
      const back = centerline[centerline.length - 1 - WF_FLAT_WINDOW];
      const windowGrade = (back[1] - y) / (WF_FLAT_WINDOW * WF_STEP_M);
      if (windowGrade < WF_FLAT_GRADE) break;
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

const streamKm = streams.reduce((sum, s) => sum + lineLengthM(s.line), 0) / 1000;
const streamVertices = streams.reduce((sum, s) => sum + s.line.length, 0);
console.log(
  `Streams: ${streams.length}/${draft.features.filter((f) => f.category === 'stream').length} ` +
    `(${streamKm.toFixed(0)} km, at least ${MIN_STREAM_LENGTH_M} m each), simplified at ` +
    `${STREAM_SIMPLIFY_M} m: ${streamVerticesBefore} -> ${streamVertices} vertices.`,
);
console.log(
  `Lakes: ${lakes.length}/${draft.features.filter((f) => f.category === 'lake').length}, ` +
    `Rivers: ${rivers.length}/${draft.features.filter((f) => f.category === 'river').length}, ` +
    `Glaciers: ${glaciers.length}/${draft.features.filter((f) => f.category === 'glacier').length} ` +
    `fall within the region (${region.parts.map((p) => p.name).join(' + ')}).`,
);
console.log(`Waterfalls: ${waterfalls.length} (hand-curated allowlist, drops: ${waterfalls.map((w) => w.dropM + 'm').join(', ')})`);

const output = {
  schemaVersion: 1,
  crs: heightfieldManifest.crs,
  localOrigin: heightfieldManifest.localOrigin,
  axes: heightfieldManifest.axes,
  coordUnits: 'local scene meters, see localOrigin/axes above - same frame as the terrain',
  boundary: region.describe(
    'lakes/rivers/glaciers: included only if at least one point falls inside one of these ' +
      'polygons. Waterfalls: hand-curated allowlist instead (see tools/build-hydrology.mjs ' +
      'header) - a fall is a rendered ribbon, so each one is looked at by hand.',
  ),
  knownLimitations: [
    'natural=glacier multipolygon relations are not fetched at all - a deliberate v1 scope ' +
      'cut, see docs/ARCHITECTURE.md §7. waterway=stream WAS the other half of that cut ' +
      'until 2026-08-18; streams now ship, but only inside the region and only from a fetch ' +
      "over the region's bbox, so growing the region needs a re-fetch.",
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
  counts: {
    lakes: lakes.length,
    rivers: rivers.length,
    streams: streams.length,
    glaciers: glaciers.length,
    waterfalls: waterfalls.length,
  },
  lakes,
  rivers,
  streams,
  glaciers,
  waterfalls,
};

writeFileSync(OUT_FILE, JSON.stringify(output));
console.log(`Wrote ${OUT_FILE}`);
