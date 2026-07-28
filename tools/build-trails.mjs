#!/usr/bin/env node
// Turns the VDA trail GeoJSON (tools/trails-source/fetch-trails.sh output)
// into public/data/trails.json: local scene coordinates (matching the
// terrain's origin/axes, docs/ARCHITECTURE.md §6), difficulty, and real
// cumulative elevation gain/loss computed by sampling our own calibrated
// heightfield - not the source dataset's own dislivello-adjacent fields,
// which are ambiguous (see docs/PROGRESS.md for why).
//
// Usage: node tools/build-trails.mjs [path to pngp_sentieri.geojson]

import { readFileSync, writeFileSync } from 'node:fs';
import { setLocalOrigin, worldToLocal } from '../src/geo.js';
import { sampleHeightfield, isNearNoData } from '../src/heightfield.js';

const SRC_GEOJSON = process.argv[2] ?? `${process.env.HOME}/pngp-trails-work/pngp_sentieri.geojson`;
const HEIGHTFIELD_DIR = 'public/data';
const OUT_FILE = 'public/data/trails.json';

const CC_BY_ATTRIBUTION =
  "Dati forniti dalla Struttura Forestazione e Sentieristica della Regione Autonoma Valle d'Aosta.";

const heightfieldManifest = JSON.parse(readFileSync(`${HEIGHTFIELD_DIR}/heightfield.json`, 'utf8'));
const heightfieldBuffer = readFileSync(`${HEIGHTFIELD_DIR}/${heightfieldManifest.file.name}`);
const heights = new Uint16Array(
  heightfieldBuffer.buffer,
  heightfieldBuffer.byteOffset,
  heightfieldBuffer.byteLength / 2,
);
setLocalOrigin(heightfieldManifest.localOrigin.x, heightfieldManifest.localOrigin.y);

const round1 = (n) => Math.round(n * 10) / 10;

// Convert one GeoJSON ring ([E,N] pairs) to local [x,y,z] points, sampling
// our own heightfield for y - the same rules as the GPU terrain (§4/§10).
// Also reports whether any point falls near the known VDA/Piemonte nodata
// gap (docs/PROGRESS.md) - such points' elevation is not reliable.
function convertRing(ring) {
  let hasNoData = false;
  const points = ring.map(([e, n]) => {
    const { x, z } = worldToLocal(e, n);
    if (isNearNoData(heights, heightfieldManifest, x, z)) hasNoData = true;
    const y = sampleHeightfield(heights, heightfieldManifest, x, z);
    return [round1(x), round1(y), round1(z)];
  });
  return { points, hasNoData };
}

function convertGeometry(geometry) {
  const rings =
    geometry.type === 'LineString'
      ? [geometry.coordinates]
      : geometry.type === 'MultiLineString'
        ? geometry.coordinates
        : (() => {
            throw new Error(`Unsupported geometry type: ${geometry.type}`);
          })();

  const converted = rings.map(convertRing);
  return {
    lines: converted.map((c) => c.points),
    hasNoData: converted.some((c) => c.hasNoData),
  };
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

function reverseLines(lines) {
  return lines
    .slice()
    .reverse()
    .map((line) => line.slice().reverse());
}

const geojson = JSON.parse(readFileSync(SRC_GEOJSON, 'utf8'));

const trails = [];
let checkedCount = 0;
let reversedCount = 0;
let noDataCount = 0;
let unexplainedBad = 0; // large mismatch on a trail that ISN'T flagged as nodata-affected
let maxUnexplainedDiff = 0;

for (const feature of geojson.features) {
  const p = feature.properties;
  const converted = convertGeometry(feature.geometry);
  let { lines } = converted;
  const { hasNoData } = converted;
  if (hasNoData) noDataCount++;

  // The source stores each geometry's own natural direction, which is NOT
  // guaranteed to run from the labeled start (sen_locali/sen_quota_) to the
  // labeled end (sen_loca_1/sen_quota1) - found by cross-checking against
  // our own heightfield: for some trails the *first* point's elevation
  // matches sen_quota1 (end) far better than sen_quota_ (start). Detect
  // and normalize so `lines` always runs start -> end, and elevGain/Loss
  // mean what their names say.
  if (typeof p.sen_quota_ === 'number' && typeof p.sen_quota1 === 'number') {
    const firstY = lines[0][0][1];
    const lastLine = lines[lines.length - 1];
    const lastY = lastLine[lastLine.length - 1][1];
    const diffNormal = Math.abs(firstY - p.sen_quota_) + Math.abs(lastY - p.sen_quota1);
    const diffReversed = Math.abs(firstY - p.sen_quota1) + Math.abs(lastY - p.sen_quota_);

    if (diffReversed < diffNormal) {
      lines = reverseLines(lines);
      reversedCount++;
    }
    const bestDiff = Math.min(diffNormal, diffReversed) / 2; // per-endpoint average
    // A large mismatch is expected (and not a bug) when the trail crosses
    // the known VDA/Piemonte nodata gap (docs/PROGRESS.md) - only flag
    // mismatches on trails that AREN'T already explained by that.
    if (bestDiff > 100 && !hasNoData) {
      unexplainedBad++;
      maxUnexplainedDiff = Math.max(maxUnexplainedDiff, bestDiff);
    }
    checkedCount++;
  }

  const { gain, loss } = elevationGainLoss(lines);

  trails.push({
    id: p.sen_codice ?? p.CodSen,
    segnavia: p.nuovo_segn ?? null,
    name: p.sen_nome_s ?? null,
    difficulty: p.sen_diffic ?? null,
    lengthM: round1(p.shape_Leng),
    startPlace: p.sen_locali ?? null,
    endPlace: p.sen_loca_1 ?? null,
    months: p.sen_period ?? null,
    elevGainM: gain,
    elevLossM: loss,
    // true if any point crosses the known VDA-only DTM coverage gap
    // (docs/PROGRESS.md) - elevGainM/elevLossM and the affected part of
    // `lines` are not reliable for this trail.
    dataIncomplete: hasNoData,
    lines,
  });
}

// Sanity check (docs/ARCHITECTURE_SUGGESTIONS.md #10 spirit): our
// independently-computed terrain elevation at each trail's endpoints
// should closely match the VDA dataset's own start/end elevation fields,
// after picking whichever line direction fits best (see above) and
// excluding trails already flagged via the nodata-touching check.
//
// A residual ~5% (spot-checked, not all individually confirmed) are cross-
// border trails (e.g. toward Switzerland via Grand-Saint-Bernard/Teodulo,
// or toward Piemonte via Fontainemore) where the VDA source's geometry
// stops at the region boundary but sen_quota1/sen_nome_s still describe
// the true destination beyond it - the same root cause as the nodata gap
// (VDA-only coverage), just not touching a literal nodata pixel. Not worth
// chasing further given the underlying cause is already understood and
// accepted (see docs/PROGRESS.md) - this is a data characteristic, not a
// bug in the conversion above (verified on several individual cases).
console.log(
  `Cross-check vs source start/end elevation (${checkedCount} trails, ` +
    `${reversedCount} direction-corrected, ${noDataCount} cross the known VDA/Piemonte nodata ` +
    `gap): ${unexplainedBad} additional mismatch(es) over 100 m, likely cross-border trails ` +
    `truncated at the VDA boundary` +
    (unexplainedBad ? ` (max ${maxUnexplainedDiff.toFixed(1)} m)` : '') +
    '.',
);

const output = {
  schemaVersion: 1,
  crs: heightfieldManifest.crs,
  localOrigin: heightfieldManifest.localOrigin,
  axes: heightfieldManifest.axes,
  coordUnits: 'local scene meters [x, y, z], see localOrigin/axes above - same frame as the terrain',
  difficultyScale: 'CAI: T (turistico) / E (escursionistico) / EE (escursionisti esperti) / EEA (con attrezzatura)',
  count: trails.length,
  knownLimitations: [
    "The DEM only has real data for Valle d'Aosta - it does not cover the " +
      'Piemonte side of the Gran Paradiso massif (~25% of the bbox). Trails ' +
      'with dataIncomplete: true cross that gap; their elevGainM/elevLossM ' +
      'and the affected part of their line are not reliable. See docs/PROGRESS.md.',
  ],
  source: {
    dataset: "Rete Sentieristica, Regione Autonoma Valle d'Aosta (Geoportale SCT)",
    layer: 'sentieri',
    fetchedVia: 'tools/trails-source/fetch-trails.sh',
    license: 'CC BY 4.0',
    attribution: CC_BY_ATTRIBUTION,
  },
  generatedBy: 'tools/build-trails.mjs',
  generatedAt: new Date().toISOString(),
  trails,
};

writeFileSync(OUT_FILE, JSON.stringify(output));
console.log(`Wrote ${OUT_FILE} (${trails.length} trails)`);
