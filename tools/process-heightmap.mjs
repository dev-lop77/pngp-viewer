#!/usr/bin/env node
// Turns DEM/pngp_heightmap.png into the web-ready heightfield asset:
// a single raw Uint16 binary + a JSON manifest, used both as the GPU
// displacement source (THREE.DataTexture, RedFormat/UnsignedShortType -
// normalized R16 under WebGL2, hardware bilinear filtering, no shader-side
// unpacking) and for CPU-side height queries. One shared array for both
// means they can never silently disagree - see docs/ARCHITECTURE.md §3/§10
// and docs/ARCHITECTURE_SUGGESTIONS.md #1.
//
// Deliberately NOT using `sharp` here: it was tried first (see git history/
// PROGRESS.md) and silently truncates this file's 16-bit grayscale data to
// 8 bits on raw extraction - confirmed against gdalinfo/PIL ground truth.
// `fast-png` decodes it correctly (verified: full 0-65535 range, matches
// gdalinfo -stats exactly). Deliberately not shelling out to GDAL either:
// unlike tools/dtm-source and tools/trails-source (external, occasional,
// fine to require gdal-bin), this is the regular repo-local build pipeline
// and should run on a fresh clone with nothing beyond `npm install`.
//
// Usage: node tools/process-heightmap.mjs [--max-dim=4096]

import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { decode } from 'fast-png';
import { encodeHeightfield, decodeHeightfield } from '../src/heightfield.js';

const SRC_PNG = 'DEM/pngp_heightmap.png';
const SRC_META = 'DEM/pngp_heightmap_meta.json';
const OUT_DIR = 'public/data';

const maxDimArg = process.argv.find((a) => a.startsWith('--max-dim='));
const MAX_DIM = maxDimArg ? Number(maxDimArg.split('=')[1]) : 4096;

// Pixel-is-area convention (matches GDAL's -te/-tr semantics, which is how
// the source PNG itself was produced): pixel (i,j)'s value represents the
// CENTER of a bboxWidth/W x bboxHeight/H cell, not a point sample exactly
// at the grid corner. Resampling must line up cell centers, not array
// indices, or the output silently drifts by up to half an output pixel -
// exactly the corner/edge ambiguity flagged in
// docs/ARCHITECTURE_SUGGESTIONS.md #2.
function resampleBilinear(src, srcW, srcH, dstW, dstH) {
  const dst = new Uint16Array(dstW * dstH);
  const xScale = srcW / dstW;
  const yScale = srcH / dstH;

  for (let dy = 0; dy < dstH; dy++) {
    const sy = (dy + 0.5) * yScale - 0.5;
    const y0 = Math.floor(sy);
    const fy = sy - y0;
    const y0c = Math.min(Math.max(y0, 0), srcH - 1);
    const y1c = Math.min(Math.max(y0 + 1, 0), srcH - 1);

    for (let dx = 0; dx < dstW; dx++) {
      const sx = (dx + 0.5) * xScale - 0.5;
      const x0 = Math.floor(sx);
      const fx = sx - x0;
      const x0c = Math.min(Math.max(x0, 0), srcW - 1);
      const x1c = Math.min(Math.max(x0 + 1, 0), srcW - 1);

      const v00 = src[y0c * srcW + x0c];
      const v10 = src[y0c * srcW + x1c];
      const v01 = src[y1c * srcW + x0c];
      const v11 = src[y1c * srcW + x1c];
      const top = v00 + (v10 - v00) * fx;
      const bottom = v01 + (v11 - v01) * fx;
      dst[dy * dstW + dx] = Math.round(top + (bottom - top) * fy);
    }
  }
  return dst;
}

const meta = JSON.parse(readFileSync(SRC_META, 'utf8'));
const { xmin, ymin, xmax, ymax } = meta.bbox_utm32n;
const bboxWidthM = xmax - xmin;
const bboxHeightM = ymax - ymin;

const png = decode(readFileSync(SRC_PNG));
if (png.channels !== 1 || png.depth !== 16) {
  throw new Error(
    `Expected 1-channel 16-bit grayscale, got channels=${png.channels} depth=${png.depth}`,
  );
}
const srcW = png.width;
const srcH = png.height;
const srcPixels = png.data; // Uint16Array, row 0 = north edge (ymax), matches GDAL's north-up convention

const nativeResM = { x: bboxWidthM / srcW, y: bboxHeightM / srcH };

const scale = Math.min(1, MAX_DIM / Math.max(srcW, srcH));
const dstW = Math.max(1, Math.round(srcW * scale));
const dstH = Math.max(1, Math.round(srcH * scale));
const outPixels =
  dstW === srcW && dstH === srcH
    ? srcPixels
    : resampleBilinear(srcPixels, srcW, srcH, dstW, dstH);

const outResM = { x: bboxWidthM / dstW, y: bboxHeightM / dstH };

// Round-trip sanity check (docs/ARCHITECTURE_SUGGESTIONS.md #2/#10): each
// pixel's cell center, in world coordinates, should stay within the bbox
// and land half a cell in from the true edge (pixel-is-area convention).
const corners = {
  topLeft: [0, 0],
  topRight: [dstW - 1, 0],
  bottomLeft: [0, dstH - 1],
  bottomRight: [dstW - 1, dstH - 1],
};
for (const [name, [px, py]] of Object.entries(corners)) {
  const worldE = xmin + (px + 0.5) * outResM.x;
  const worldN = ymax - (py + 0.5) * outResM.y; // row 0 = north
  console.log(`  corner ${name}: pixel(${px},${py}) center -> E ${worldE.toFixed(1)}, N ${worldN.toFixed(1)}`);
}

// Not the raw Uint16 stream any more: a horizontal delta per row split into two
// byte planes. Identical size on disk and exactly lossless, but 9.2 MB over the
// wire instead of 15.7, because the low byte of an elevation is nearly noise and
// interleaving it with the smooth high byte was poisoning gzip for the whole
// file - and this file is 91% of the viewer's first load. See
// src/heightfield.js, which owns both halves of the codec.
const dims = { width: dstW, height: dstH };
const encoded = encodeHeightfield(outPixels, { dimensions: dims });
const buffer = Buffer.from(encoded.buffer, encoded.byteOffset, encoded.byteLength);
// Round-tripped here rather than trusted: a wrong codec does not fail, it makes
// a mountain range out of noise.
const roundTrip = decodeHeightfield(encoded, { dimensions: dims, encoding: { layout: 'row-delta-byte-planes' } });
for (let i = 0; i < outPixels.length; i++) {
  if (roundTrip[i] !== outPixels[i]) {
    throw new Error(`heightfield codec is not lossless: sample ${i} is ${roundTrip[i]}, expected ${outPixels[i]}`);
  }
}
console.log(`Encoded as row-delta byte planes, round-trip verified over ${outPixels.length.toLocaleString()} samples`);
const sha256 = createHash('sha256').update(buffer).digest('hex').slice(0, 8);
const fileName = `heightfield.${sha256}.bin`;

// Clean up previous content-hashed binaries so stale ones don't accumulate.
try {
  for (const f of readdirSync(OUT_DIR)) {
    if (/^heightfield\.[0-9a-f]{8}\.bin$/.test(f) && f !== fileName) {
      unlinkSync(`${OUT_DIR}/${f}`);
    }
  }
} catch {
  // OUT_DIR doesn't exist yet - nothing to clean.
}

writeFileSync(`${OUT_DIR}/${fileName}`, buffer);

const manifest = {
  schemaVersion: 2, // 2: the binary is delta+plane encoded (see encoding.layout)
  crs: meta.crs,
  bboxCrsUnits: { xmin, ymin, xmax, ymax },
  localOrigin: {
    crs: meta.crs,
    x: (xmin + xmax) / 2,
    y: (ymin + ymax) / 2,
    note:
      'bbox center. World (E,N) -> local scene meters: X = E - originX, Z = originY - N, Y = elevationM (see docs/ARCHITECTURE.md §6).',
  },
  axes:
    '+X = East, +Y = Up (elevation, meters), +Z = South - right-handed, matches Three.js Y-up (East x Up = South in real-world ENU).',
  dimensions: { width: dstW, height: dstH },
  resolutionMPerPx: outResM,
  pixelConvention:
    'area (cell-center), not point-sample: pixel (i,j) center = (xmin + (i+0.5)*resX, ymax - (j+0.5)*resY). Matches GDAL -te/-tr semantics used to produce the source PNG.',
  rowOrientation: 'row 0 = north edge (ymax); row N-1 = south edge (ymin)',
  elevationRangeM: {
    min: meta.elevation_m.min,
    max: meta.elevation_m.max,
    units: 'meters',
  },
  encoding: {
    dtype: 'uint16',
    // Read by src/heightfield.js's decodeHeightfield(), which throws on anything
    // it does not recognise rather than reinterpreting the bytes.
    layout: 'row-delta-byte-planes',
    layoutNote:
      'bytes [0, n) are the high byte of a per-row horizontal delta, bytes [n, 2n) the low byte; '
      + 'value[x] = (value[x-1] + delta) mod 65536, with value[-1] = 0 at the start of each row',
    byteOrder: 'little-endian',
    channels: 1,
    valueToElevationM: 'elevation = min + (value / 65535) * (max - min)',
    noData: null,
  },
  file: { name: fileName, bytes: buffer.byteLength, sha256Prefix: sha256 },
  // meta.sources (docs/ARCHITECTURE.md §3, "Closing the Piemonte gap"):
  // a 4-source priority mosaic (VDA/Piemonte WCS/TINITALY/Copernicus GLO-30),
  // not a single dataset - written by tools/dtm-source/merge-heightmaps.sh.
  // Copied through WHOLE rather than field by field, which is what lets a source
  // carry obligations this file has never heard of (licenseUrl, liabilityNotice)
  // all the way to the credits panel. Falls back
  // to the old single-source shape if meta predates that (shouldn't
  // happen on a fresh extraction, but avoids a hard crash on stale data).
  source: {
    sources: meta.sources ?? [
      {
        name: "DTM0508_002_UNICO (Regione Autonoma Valle d'Aosta digital terrain model)",
        fetchedVia: 'tools/dtm-source/extract-heightmap.sh',
        license: 'not yet verified for the DTM itself - TODO, see docs/PROGRESS.md',
      },
    ],
    nativeHeightmap: SRC_PNG,
    nativeDimensions: { width: srcW, height: srcH },
    nativeResolutionMPerPx: nativeResM,
  },
  generatedBy: 'tools/process-heightmap.mjs',
  generatedAt: new Date().toISOString(),
};

writeFileSync(`${OUT_DIR}/heightfield.json`, JSON.stringify(manifest, null, 2));

console.log(`\nWrote ${OUT_DIR}/${fileName} (${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB)`);
console.log(`Wrote ${OUT_DIR}/heightfield.json`);
console.log(
  `${srcW}x${srcH} (native, ${nativeResM.x.toFixed(4)}x${nativeResM.y.toFixed(4)} m/px) -> ` +
    `${dstW}x${dstH} (${outResM.x.toFixed(4)}x${outResM.y.toFixed(4)} m/px)`,
);
