#!/usr/bin/env node
// The high-resolution terrain tier (2026-08-13, rebuilt at 5 m on 2026-08-14): the
// park's own elevation at the resolution its sources actually hold, shipped as an
// 8-bit RESIDUAL over the 20.5 m heightfield rather than as a second height. It is
// the user's optional "alta risoluzione", topic 2 of the four extras they opened on
// 2026-08-11, and it is downloaded only when the knob asks for it.
//
// NOTHING HERE IS WRITTEN FOR A PARTICULAR RESOLUTION, and that took work: the
// native/base ratio went from x2 to x4 and three constants had been sized by hand
// for x2 - the nodata dilation, the residual's half-range, and a test's round-trip
// tolerance. Two of them would have failed silently. They are derived now.
//
// WHY A RESIDUAL, AND NOT A SECOND HEIGHTFIELD. The heightfield is read by seven
// modules in three different ways - the CPU bilinear array, the drawn-triangle
// surface, and the GPU texture - by the camera, the POI markers, the trees, the
// grass, the stones, the flowers and the terrain itself. Two absolute grids would
// mean a seam that all seven have to agree about on both CPU and GPU, which is the
// "erba e cespugli galleggiano in aria" class of defect multiplied by seven. A
// residual is zero outside its rectangle BY CONSTRUCTION, so everything outside
// behaves exactly as it does today, and the edge is faded to zero at build time so
// there is no seam to agree about at all.
//
// WHY 8 BITS, AND WHY A SIGNED SQUARE ROOT. Measured on the real data over the
// park's 12.5 Mpx, gzipped:
//
//   absolute 16-bit, the shipped row-delta codec   12.5 MB
//   residual 16-bit, same codec                    16.7 MB   <- worse, see below
//   residual 8-bit, linear +/-32 m                  6.1 MB   <- 41 px clip by ~21 m
//   residual 8-bit, signed sqrt +/-56 m             8.7 MB   <- nothing clips
//
// The same encoding at 5 m, over 39.9 Mpx: 38.1 MB raw, 25.0 MB gzip, half-range
// 96 m. The choice above still holds, but note what did not scale linearly - four
// times the pixels cost 3.6 times the bytes, because a finer residual is
// higher-frequency and gzip finds less to say about it.
//
// The residual compresses WORSE than absolute heights under the row-delta codec,
// which is worth knowing: that codec works because elevations are smooth along a
// row, and a residual is by definition the part that is not. At 8 bits it wins
// anyway. The signed square root spends its precision where the data is - 0.003 m
// steps near zero, where 99.7% of the residual lives, against 0.251 m for a linear
// map - and its coarse end lands on cliffs at +/-56 m where a 0.36 m error is
// invisible. Nothing clips, which the linear version could not say.
//
// Usage: node tools/build-height-tier.mjs
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { decode } from 'fast-png';
import proj4 from 'proj4';
import { RESIDUAL_HALF_RANGE_M, encodeResidual, decodeResidual } from '../src/heighttier.js';

const SRC_PNG = 'DEM/pngp_heightmap.png';
const SRC_META = 'DEM/pngp_heightmap_meta.json';
const BASE_JSON = 'public/data/heightfield.json';
const BASE_BIN_DIR = 'public/data';
const BOUNDARY = 'tools/park-boundary.geojson';
const OUT_DIR = 'public/data';
const OUT_JSON = `${OUT_DIR}/heighttier.json`;

// How far in from the tier's edge the residual is faded out, IN METRES. The fade is
// what makes the seam a non-event: the outermost band returns smoothly to the
// shipped 20.5 m surface, so the boundary is a loss of detail rather than a step.
// It was 32 tier pixels, which is a metre count wearing a pixel count's clothes -
// the same 32 meant 320 m at 10 m/px and 160 m at 5, and now that two levels ship
// side by side it would have meant two different bands in one rectangle. Both are
// far beyond any draw distance, so nothing standing on the ground can straddle it.
const FADE_M = 320;
// Margin added around the park's own bounding box, so the fade band sits OUTSIDE
// the park rather than eating into it.
const MARGIN_M = 600;
// THE TIER SHIPS AS SEVERAL LEVELS OF ONE RECTANGLE (user's decision, 2026-08-14:
// "metterei l'opzione medium a 10m come default"). Each stride is a whole number of
// native pixels per tier pixel, coarsest first, so 2 is a 10 m level over a 5 m
// mosaic and 1 is the mosaic itself. They share the rectangle, the codec and the
// half-range - only the grid differs - which is what lets the viewer swap between
// them without anything downstream noticing more than a resolution.
const LEVEL_STRIDES = [2, 1];

const CRS = 'EPSG:23032';
proj4.defs(CRS, '+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs');

const base = JSON.parse(readFileSync(BASE_JSON, 'utf8'));
const { xmin, ymin, xmax, ymax } = base.bboxCrsUnits;
const bboxW = xmax - xmin;
const bboxH = ymax - ymin;
const { min: elevMin, max: elevMax } = base.elevationRangeM;
const SPAN = elevMax - elevMin;

// THE NATIVE MOSAIC HAS ITS OWN 16-BIT RANGE AND IT IS NOT THE BASE'S. Both are
// linear maps of counts to metres, and they are equal today only because
// process-heightmap.mjs derived the base from this very file. Every re-extraction
// recomputes min/max from its own crop, so the two are free to drift apart, and
// decoding one grid with the other's range is a pure affine error that no guard
// below would name: on the 5 m VDA extraction of 2026-08-14 the ranges differed
// by 53.6 m at the bottom and 1.1 m at the top, which decoded the whole tier
// 10 to 49 m low. Small enough to look like terrain, large enough to be the
// entire signal this file measures. So each grid is decoded with its own range.
const meta = JSON.parse(readFileSync(SRC_META, 'utf8'));
const nElevMin = meta.elevation_m.min;
const nElevMax = meta.elevation_m.max;
const N_SPAN = nElevMax - nElevMin;
const nativeToM = (counts) => nElevMin + (counts / 65535) * N_SPAN;
const baseToM = (counts) => elevMin + (counts / 65535) * SPAN;
console.log(`native range ${nElevMin.toFixed(2)}..${nElevMax.toFixed(2)} m`
  + `   base range ${elevMin.toFixed(2)}..${elevMax.toFixed(2)} m`
  + (nElevMin === elevMin && nElevMax === elevMax ? '  (identical)' : '  (DIFFERENT - decoded separately)'));

// ---- the park's bounding box, from the boundary this project already ships ----
const gj = JSON.parse(readFileSync(BOUNDARY, 'utf8'));
let pxmin = Infinity;
let pymin = Infinity;
let pxmax = -Infinity;
let pymax = -Infinity;
const walkCoords = (c) => {
  if (typeof c[0] === 'number') {
    const [e, n] = proj4('EPSG:4326', CRS, [c[0], c[1]]);
    pxmin = Math.min(pxmin, e);
    pxmax = Math.max(pxmax, e);
    pymin = Math.min(pymin, n);
    pymax = Math.max(pymax, n);
    return;
  }
  c.forEach(walkCoords);
};
for (const f of gj.features ?? [gj]) walkCoords(f.geometry.coordinates);
console.log(`park bbox: ${((pxmax - pxmin) / 1000).toFixed(1)} x ${((pymax - pymin) / 1000).toFixed(1)} km`
  + `  E ${pxmin.toFixed(0)}..${pxmax.toFixed(0)}  N ${pymin.toFixed(0)}..${pymax.toFixed(0)}`);
console.log(`base bbox:  E ${xmin}..${xmax}  N ${ymin}..${ymax}`);

// ---- the native 10 m mosaic ----
const png = decode(readFileSync(SRC_PNG));
if (png.channels !== 1 || png.depth !== 16) {
  throw new Error(`Expected 1-channel 16-bit grayscale, got channels=${png.channels} depth=${png.depth}`);
}
const NW = png.width;
const NH = png.height;
const native = png.data;
// Every world coordinate below comes from the BASE's bbox divided by the NATIVE's
// pixel count, which is only meaningful if the two rectangles are the same one.
// They are, today, because the same crop produced both - and that is exactly the
// kind of coincidence that stops holding without saying so, at which point the
// whole tier would be placed on the wrong ground.
const mb = meta.bbox_utm32n;
if (mb.xmin !== xmin || mb.ymin !== ymin || mb.xmax !== xmax || mb.ymax !== ymax) {
  throw new Error(`${SRC_META} covers E ${mb.xmin}..${mb.xmax} N ${mb.ymin}..${mb.ymax}, `
    + `but the base covers E ${xmin}..${xmax} N ${ymin}..${ymax} - the tier would be placed on the wrong ground`);
}
const nativeResX = bboxW / NW;
const nativeResY = bboxH / NH;
console.log(`native ${NW} x ${NH} at ${nativeResX.toFixed(3)} x ${nativeResY.toFixed(3)} m`);

// Snap the tier to WHOLE NATIVE PIXELS, so the finest level IS the source data
// rather than a resampling of it. Anything else would blur the very detail this
// ships for. And snap it to a whole number of COARSEST-LEVEL blocks as well, so
// every level tiles the same rectangle exactly - otherwise the levels would each
// describe a slightly different one and swapping between them would move the ground
// sideways by a fraction of a pixel.
const BLOCK = Math.max(...LEVEL_STRIDES);
const clampCol = (v) => Math.max(0, Math.min(NW, v));
const clampRow = (v) => Math.max(0, Math.min(NH, v));
const floorTo = (v) => v - (v % BLOCK);
const col0 = floorTo(clampCol(Math.floor((pxmin - MARGIN_M - xmin) / nativeResX)));
const col1 = floorTo(clampCol(Math.ceil((pxmax + MARGIN_M - xmin) / nativeResX)));
const row0 = floorTo(clampRow(Math.floor((ymax - (pymax + MARGIN_M)) / nativeResY)));
const row1 = floorTo(clampRow(Math.ceil((ymax - (pymin - MARGIN_M)) / nativeResY)));
const TW = col1 - col0;
const TH = row1 - row0;
console.log(`tier ${TW} x ${TH} native px = ${((TW * TH) / 1e6).toFixed(1)} Mpx`
  + `, a whole number of ${BLOCK}x${BLOCK} blocks`);
// The park is not necessarily inside the heightfield's own bbox - the bbox was cut
// for the DEM, not for the boundary - and a tier silently clipped to less than the
// park would be a hole in the feature nobody would notice. Reported, loudly.
const covN = Math.min(pymax, ymax) - Math.max(pymin, ymin);
const covE = Math.min(pxmax, xmax) - Math.max(pxmin, xmin);
const covered = (covE / (pxmax - pxmin)) * (covN / (pymax - pymin));
console.log(`the tier covers ${(covered * 100).toFixed(1)}% of the park's bounding box`
  + (covered < 0.999 ? ` - the rest lies OUTSIDE the heightfield's own bbox, so no source covers it either` : ''));

// ---- the base grid, rebuilt exactly as process-heightmap.mjs produced it ----
// Rebuilt rather than decoded from the shipped .bin for one reason: this tool has
// to subtract the surface the RUNTIME will add the residual to, and the runtime
// reads the shipped grid bilinearly. Decoding the .bin would give the same values,
// so this is checked against it below rather than assumed.
const { width: BW, height: BH } = base.dimensions;
const baseGrid = new Float64Array(BW * BH);
for (let y = 0; y < BH; y++) {
  const sy = ((y + 0.5) * NH) / BH - 0.5;
  const y0 = Math.max(0, Math.min(NH - 1, Math.floor(sy)));
  const y1 = Math.min(NH - 1, y0 + 1);
  const fy = sy - y0;
  for (let x = 0; x < BW; x++) {
    const sx = ((x + 0.5) * NW) / BW - 0.5;
    const x0 = Math.max(0, Math.min(NW - 1, Math.floor(sx)));
    const x1 = Math.min(NW - 1, x0 + 1);
    const fx = sx - x0;
    const a = native[y0 * NW + x0];
    const b = native[y0 * NW + x1];
    const c = native[y1 * NW + x0];
    const d = native[y1 * NW + x1];
    const t = a + (b - a) * fx;
    const u = c + (d - c) * fx;
    baseGrid[y * BW + x] = t + (u - t) * fy;
  }
}

// THE SHIPPED FILE IS THE TRUTH, not this reconstruction. If the two disagree the
// residual would be measured against a surface nobody draws, which is silent and
// fatal - so it is checked rather than trusted.
const baseBinName = base.file.name;
const baseBytes = readFileSync(`${BASE_BIN_DIR}/${baseBinName}`);
const shipped = (() => {
  const n = BW * BH;
  const out = new Uint16Array(n);
  for (let y = 0; y < BH; y++) {
    let acc = 0;
    for (let x = 0; x < BW; x++) {
      const i = y * BW + x;
      const delta = (baseBytes[i] << 8) | baseBytes[n + i];
      acc = (acc + delta) & 0xffff;
      out[i] = acc;
    }
  }
  return out;
})();
// WHAT THIS CAN ASSERT, AND WHAT IT NO LONGER CAN. While the native grid was 10 m
// the base was a bilinear resample of it, so the reconstruction was exact and the
// test could be "worst sampled pixel under 1.5 counts". At 5 m it cannot: the
// shipped base resamples the 10 m mosaic and this reconstruction resamples the 5 m
// one, so the two legitimately differ - measured 2026-08-14, |diff| median 1.18 m,
// p95 4.78 m. And the worst pixel is not a usable test at any resolution: it comes
// out at 3316 m, because beside a nodata hole each grid blends real elevation with
// the 238.5 m sentinel in its own proportion. That is guard 2's lesson arriving
// from the other side, and a threshold set on it would be a threshold on an
// artefact.
//
// So this asserts the weaker thing that is still worth asserting, on robust
// statistics instead of extremes: the same terrain (median |diff| small) at the
// same placement, scale and elevation range (median signed difference ~ 0). Both
// catch what this check exists for - decoding the mosaic with the wrong range
// shifts the median by tens of metres (the 5 m VDA extraction of this morning:
// -29 m), and a wrong bbox or an unrelated file moves it by hundreds.
const BASE_BIAS_MAX_M = 2;
const BASE_SPREAD_MAX_M = 5;
const diffs = [];
for (let i = 0; i < BW * BH; i += 7) {
  if (shipped[i] === 0 || baseGrid[i] === 0) continue; // nodata on either side
  diffs.push(nativeToM(baseGrid[i]) - baseToM(shipped[i]));
}
diffs.sort((a, b) => a - b);
const medianDiff = diffs[diffs.length >> 1];
const absDiffs = diffs.map(Math.abs).sort((a, b) => a - b);
const medianAbs = absDiffs[absDiffs.length >> 1];
console.log(`base grid vs ${baseBinName} over ${(diffs.length / 1e6).toFixed(2)} M sampled pixels:`
  + ` median ${medianDiff >= 0 ? '+' : ''}${medianDiff.toFixed(3)} m, median |diff| ${medianAbs.toFixed(3)} m`
  + `, p95 ${absDiffs[Math.floor(absDiffs.length * 0.95)].toFixed(2)} m`);
if (Math.abs(medianDiff) > BASE_BIAS_MAX_M || medianAbs > BASE_SPREAD_MAX_M) {
  throw new Error(`the rebuilt base grid disagrees with ${baseBinName}: median `
    + `${medianDiff.toFixed(2)} m (limit +/-${BASE_BIAS_MAX_M}), median |diff| ${medianAbs.toFixed(2)} m `
    + `(limit ${BASE_SPREAD_MAX_M}) - the residual would be measured against the wrong surface`);
}

// Bilinear read of the base grid, in the same pixel-is-area convention the runtime
// uses, at a native pixel's centre.
const baseAtNative = (nx, ny) => {
  const gx = ((nx + 0.5) * BW) / NW - 0.5;
  const gy = ((ny + 0.5) * BH) / NH - 0.5;
  const x0 = Math.max(0, Math.min(BW - 1, Math.floor(gx)));
  const x1 = Math.min(BW - 1, x0 + 1);
  const y0 = Math.max(0, Math.min(BH - 1, Math.floor(gy)));
  const y1 = Math.min(BH - 1, y0 + 1);
  const fx = gx - x0;
  const fy = gy - y0;
  const a = shipped[y0 * BW + x0];
  const b = shipped[y0 * BW + x1];
  const c = shipped[y1 * BW + x0];
  const d = shipped[y1 * BW + x1];
  const t = a + (b - a) * fx;
  const u = c + (d - c) * fx;
  return t + (u - t) * fy;
};

// ---- the residual, faded to nothing at the edge ----
//
// NODATA IS A SENTINEL AND IT IS NOT DECLARED ANYWHERE IN THE PIPELINE. Raw value
// 0 means "no source covered this pixel" - 12.2% of the native mosaic - and reading
// it as an elevation gives 238 m. The first build of this tool did exactly that and
// produced a correction of -1990 m: it was faithfully "fixing" the terrain down to
// the bottom of the elevation range wherever the DTM had a hole. The guard below
// caught it, which is the only reason it is not in the file.
//
// Where the source says nothing, the tier must say nothing either: residual 0, and
// the viewer keeps drawing the surface it draws today. Both sides are tested - the
// native pixel AND the four base taps that feed the value being corrected, because
// a base tap sitting on a hole makes the base itself wrong in a way the tier would
// then try to "correct" by tens of metres.
// AND TESTING THE BASE FOR EXACTLY ZERO IS NOT ENOUGH, which the second run of
// this tool proved: it cut the worst correction from -1990 m to -1656 m and still
// left 343 pixels off the scale. A base pixel is a bilinear average of native
// ones, so next to a hole it is a BLEND of real elevation and the 238 m sentinel -
// a plausible-looking number that is badly wrong and is never exactly zero. The
// only way to catch those is to dilate the hole mask on the native grid by
// everything that can reach into a base pixel: the 2x2 native footprint that made
// it, plus the 2 base pixels a bilinear read touches, plus a pixel of slack.
const NODATA = 0;
// In NATIVE pixels, and it cannot be a constant: it has to cover everything that
// can reach into one base pixel - the footprint that made it, which is the
// native/base ratio wide, plus the two base pixels a bilinear read touches - so
// it scales with that ratio. 6 was sized by hand for the 10 m mosaic's x2.048 and
// would be less than half of what the 5 m mosaic's x4.096 needs, which would not
// fail loudly: it would quietly bring back the blend-next-to-a-hole corrections
// that guard 2 was written for. Derived, with a pixel of slack.
const NATIVE_PER_BASE = NW / BW;
const DILATE_PX = Math.ceil(3 * NATIVE_PER_BASE) + 1;
console.log(`native/base ratio ${NATIVE_PER_BASE.toFixed(3)} -> dilating the hole mask by ${DILATE_PX} native px`);
const MW = TW + 2 * DILATE_PX;
const MH = TH + 2 * DILATE_PX;
const holeMask = new Uint8Array(MW * MH);
for (let y = 0; y < MH; y++) {
  const ny = row0 - DILATE_PX + y;
  if (ny < 0 || ny >= NH) { holeMask.fill(1, y * MW, (y + 1) * MW); continue; }
  for (let x = 0; x < MW; x++) {
    const nx = col0 - DILATE_PX + x;
    holeMask[y * MW + x] = (nx < 0 || nx >= NW || native[ny * NW + nx] === NODATA) ? 1 : 0;
  }
}
// Separable max filter, so the dilation is O(n) rather than O(n * r^2).
const dilate = (src, w, h, r) => {
  const tmp = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let k = -r; k <= r && !v; k++) {
        const xx = x + k;
        if (xx >= 0 && xx < w && src[y * w + xx]) v = 1;
      }
      tmp[y * w + x] = v;
    }
  }
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let k = -r; k <= r && !v; k++) {
        const yy = y + k;
        if (yy >= 0 && yy < h && tmp[yy * w + x]) v = 1;
      }
      out[y * w + x] = v;
    }
  }
  return out;
};
const dilated = dilate(holeMask, MW, MH, DILATE_PX);
const isHole = (tx, ty) => dilated[(ty + DILATE_PX) * MW + (tx + DILATE_PX)] === 1;

// One level per stride. A level pixel covers a stride x stride block of native
// pixels, and its truth is the MEAN of that block rather than one sample of it:
// picking a representative pixel would alias, and a height field's honest
// coarsening is its average. A block is a hole if ANY native pixel in it is one -
// the same conservative direction the dilation already takes, since half a hole is
// still a sentinel mixed into a number.
const levels = [];
for (const stride of LEVEL_STRIDES) {
  const LW = TW / stride;
  const LH = TH / stride;
  if (!Number.isInteger(LW) || !Number.isInteger(LH)) {
    throw new Error(`stride ${stride} does not divide the ${TW}x${TH} tier - the levels would not share the rectangle`);
  }
  const levelResX = nativeResX * stride;
  const levelResY = nativeResY * stride;
  // In LEVEL pixels, from a width in metres, so every level fades over the same
  // band of ground.
  const fadePx = Math.max(1, Math.round(FADE_M / levelResX));
  const bytes = new Uint8Array(LW * LH);
  let worstErr = 0;
  let clipped = 0;
  let maxAbs = 0;
  let loSigned = Infinity;
  let hiSigned = -Infinity;
  let holes = 0;
  for (let y = 0; y < LH; y++) {
    const fadeY = Math.min(1, Math.min(y, LH - 1 - y) / fadePx);
    for (let x = 0; x < LW; x++) {
      const fadeX = Math.min(1, Math.min(x, LW - 1 - x) / fadePx);
      // smoothstep on the smaller of the two, so corners fade like edges do.
      const t = Math.min(fadeX, fadeY);
      const fade = t * t * (3 - 2 * t);
      let sum = 0;
      let hole = false;
      for (let by = 0; by < stride && !hole; by++) {
        for (let bx = 0; bx < stride; bx++) {
          const tx = x * stride + bx;
          const ty = y * stride + by;
          if (isHole(tx, ty)) { hole = true; break; }
          sum += nativeToM(native[(row0 + ty) * NW + (col0 + tx)]);
        }
      }
      if (hole) {
        holes++;
        bytes[y * LW + x] = encodeResidual(0);
        continue;
      }
      const truth = sum / (stride * stride);
      // The base is read at the BLOCK's centre, which is where the level pixel is.
      const under = baseToM(baseAtNative(col0 + x * stride + (stride - 1) / 2,
        row0 + y * stride + (stride - 1) / 2));
      const residual = (truth - under) * fade;
      maxAbs = Math.max(maxAbs, Math.abs(residual));
      loSigned = Math.min(loSigned, residual);
      hiSigned = Math.max(hiSigned, residual);
      if (Math.abs(residual) > RESIDUAL_HALF_RANGE_M) clipped++;
      const code = encodeResidual(residual);
      bytes[y * LW + x] = code;
      worstErr = Math.max(worstErr, Math.abs(decodeResidual(code) - residual));
    }
  }
  console.log(`\nlevel ${levelResX.toFixed(2)} m: ${LW} x ${LH} px, fade ${fadePx} px = ${(fadePx * levelResX).toFixed(0)} m`);
  console.log(`  residual ${loSigned.toFixed(2)} .. ${hiSigned >= 0 ? '+' : ''}${hiSigned.toFixed(2)} m`
    + ` (widest |value| ${maxAbs.toFixed(2)} of ${RESIDUAL_HALF_RANGE_M})`
    + `, worst round-trip ${worstErr.toFixed(3)} m, clipped ${clipped} px`);
  console.log(`  nodata left flat: ${holes} px (${((holes / (LW * LH)) * 100).toFixed(2)}%)`);
  if (clipped) throw new Error(`${clipped} residual pixels of the ${levelResX.toFixed(2)} m level exceed `
    + `+/-${RESIDUAL_HALF_RANGE_M} m - re-measure RESIDUAL_HALF_RANGE_M, do not simply raise it`);

  // The edge must be exactly zero on EVERY level, or the "no seam by construction"
  // claim is a story - and it is one claim per level, since each is drawn alone.
  let edgeMax = 0;
  for (let x = 0; x < LW; x++) {
    edgeMax = Math.max(edgeMax, Math.abs(decodeResidual(bytes[x])), Math.abs(decodeResidual(bytes[(LH - 1) * LW + x])));
  }
  for (let y = 0; y < LH; y++) {
    edgeMax = Math.max(edgeMax, Math.abs(decodeResidual(bytes[y * LW])), Math.abs(decodeResidual(bytes[y * LW + LW - 1])));
  }
  if (edgeMax > 1e-6) throw new Error(`the ${levelResX.toFixed(2)} m level's outer ring is not zero (${edgeMax} m) - the fade is wrong`);

  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 8);
  const outName = `heighttier.${hash}.bin`;
  writeFileSync(`${OUT_DIR}/${outName}`, Buffer.from(bytes));
  const gzipBytes = gzipSync(Buffer.from(bytes), { level: 9 }).length;
  console.log(`  wrote ${outName}  ${(bytes.length / 1048576).toFixed(1)} MB raw, ${(gzipBytes / 1048576).toFixed(1)} MB gzip`);
  levels.push({
    resolutionMPerPx: { x: levelResX, y: levelResY },
    nativePxPerPx: stride,
    dimensions: { width: LW, height: LH },
    fadePx,
    file: { name: outName, bytes: bytes.length, gzipBytes, sha256Prefix: hash },
  });
}

// Only now, so a level that threw does not leave the shipped set half-deleted.
const keep = new Set(levels.map((l) => l.file.name));
for (const f of readdirSync(OUT_DIR)) {
  if (/^heighttier\.[0-9a-f]{8}\.bin$/.test(f) && !keep.has(f)) unlinkSync(`${OUT_DIR}/${f}`);
}

const manifest = {
  schemaVersion: 2,
  purpose: `Optional high-resolution terrain: the park as a residual over heightfield.json's ${(bboxW / BW).toFixed(2)} m grid, at ${levels.map((l) => `${l.resolutionMPerPx.x.toFixed(2)} m`).join(' and ')}. One rectangle, one codec, one level downloaded at a time - whichever the quality control asks for.`,
  crs: CRS,
  // The rectangle, in the same CRS and convention as the base grid. ALL levels share
  // it: that is why the strides have to divide the native window exactly.
  bboxCrsUnits: {
    xmin: xmin + col0 * nativeResX,
    ymin: ymax - row1 * nativeResY,
    xmax: xmin + col1 * nativeResX,
    ymax: ymax - row0 * nativeResY,
  },
  rowOrientation: 'row 0 = north edge (ymax); row N-1 = south edge (ymin)',
  pixelConvention: 'area (cell-center), identical to heightfield.json',
  encoding: {
    dtype: 'uint8',
    meaning: 'a signed elevation CORRECTION in metres, to be ADDED to the bilinear value of heightfield.json at the same world point',
    mapping: `s = code/255*2 - 1; metres = sign(s) * s^2 * ${RESIDUAL_HALF_RANGE_M}`,
    halfRangeM: RESIDUAL_HALF_RANGE_M,
    zeroOutsideBbox: 'The correction is zero everywhere outside bboxCrsUnits, and is faded to exactly zero over each level\'s outermost pixels, so the tier adds detail without moving the surface at its edge.',
    fadeM: FADE_M,
    sharedAcrossLevels: 'One half-range for every level, because the GLSL decoder is generated once from the constant in src/heighttier.js and cannot switch mappings per level. The coarser level spends a little precision it does not need; its steps stay far finer than the base grid\'s own 0.07 m.',
  },
  // Coarsest first, so an index is a quality setting: 0 is the cheapest tier.
  levels,
  source: base.source,
  generatedBy: 'tools/build-height-tier.mjs',
  generatedAt: new Date().toISOString(),
};
writeFileSync(OUT_JSON, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`\nwrote ${OUT_JSON} with ${levels.length} levels`);
