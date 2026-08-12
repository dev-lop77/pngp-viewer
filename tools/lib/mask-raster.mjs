// The polygon rasteriser and the mask writer, shared by the two mask pipelines
// (tools/build-forest.mjs and tools/build-landcover.mjs).
//
// Extracted from build-forest.mjs on 2026-08-12 when the landcover masks needed
// exactly the same three things - even-odd scanline fill with sub-row
// supersampling, quantisation to a few levels, and a 4-bit PNG - and having two
// copies would have meant fixing any hole-handling or edge-coverage bug twice.
// The extraction was verified rather than assumed: build-forest.mjs re-run
// against the same tools/forest-draft.json produced a byte-identical
// forest.<hash>.png, i.e. the same content hash it already shipped.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { encode, decode } from 'fast-png';

// Even-odd scanline fill with vertical supersampling and exact horizontal span
// coverage, accumulating into `into` (a Float32Array of width*height).
//
// Holes: a relation's `inner` rings are rasterised together with its outer ones
// under the even-odd rule, which cancels them out automatically. That also means
// relation member ways need no stitching into closed rings - parity over the
// whole segment soup of one polygon gives the same answer, provided the rings
// close overall, which a valid multipolygon's do.
//
// Coverage, not a bit: each pixel accumulates how much of it the polygon covers,
// so edges come out soft and a scatter can thin out towards a margin instead of
// stopping on a visible straight line. Callers clamp to 1 themselves, because
// overlapping polygons must not add past full.
//
//   polygons  [{ rings: [{ points: [[lon, lat], ...] }] }]
//   toPixel   ([lon, lat]) => [x, y] in continuous pixel coordinates
//   weightOf  (polygon) => 0..1, how much this polygon's cover counts
export function rasterisePolygons({ polygons, width, height, toPixel, into, subRows = 4, weightOf = () => 1 }) {
  let skipped = 0;
  const xs = [];

  for (const polygon of polygons) {
    const weight = weightOf(polygon);
    if (!(weight > 0)) continue;

    // All rings of one polygon share an edge list: even-odd then subtracts inners.
    const edges = [];
    let minY = Infinity;
    let maxY = -Infinity;
    for (const ring of polygon.rings) {
      const pts = ring.points.map(toPixel);
      if (pts.length < 2) continue;
      // Close the ring if the source didn't (relation members legitimately don't).
      const closed = pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1];
      const seq = closed ? pts : [...pts, pts[0]];
      for (let i = 0; i < seq.length - 1; i++) {
        const [x0, y0] = seq[i];
        const [x1, y1] = seq[i + 1];
        if (y0 === y1) continue; // horizontal edges never cross a scanline
        edges.push([x0, y0, x1, y1]);
        minY = Math.min(minY, y0, y1);
        maxY = Math.max(maxY, y0, y1);
      }
    }
    if (!edges.length) {
      skipped++;
      continue;
    }

    const rowStart = Math.max(0, Math.floor(minY));
    const rowEnd = Math.min(height - 1, Math.ceil(maxY));

    for (let py = rowStart; py <= rowEnd; py++) {
      for (let s = 0; s < subRows; s++) {
        const yc = py + (s + 0.5) / subRows;
        xs.length = 0;
        for (const [x0, y0, x1, y1] of edges) {
          if (y0 <= yc === y1 <= yc) continue;
          xs.push(x0 + ((yc - y0) * (x1 - x0)) / (y1 - y0));
        }
        if (xs.length < 2) continue;
        xs.sort((a, b) => a - b);
        const row = py * width;
        for (let k = 0; k + 1 < xs.length; k += 2) {
          let xa = xs[k];
          let xb = xs[k + 1];
          if (xb <= 0 || xa >= width) continue;
          xa = Math.max(xa, 0);
          xb = Math.min(xb, width);
          const first = Math.floor(xa);
          const last = Math.min(width - 1, Math.ceil(xb) - 1);
          for (let px = first; px <= last; px++) {
            // Exact horizontal overlap of the span with this pixel.
            const overlap = Math.min(xb, px + 1) - Math.max(xa, px);
            if (overlap > 0) into[row + px] += (overlap / subRows) * weight;
          }
        }
      }
    }
  }

  return { skipped };
}

// Quantise 0..1 coverage to `levels` and write it as a content-hashed 4-bit
// grayscale PNG, deleting any stale hash of the same prefix.
//
// Written at PNG's own 4-bit sample depth rather than as 8-bit bytes. A mask has
// only `levels` values, so four bits hold it exactly when levels <= 16, and the
// decoder - fast-png here, the browser in the viewer - performs the standard
// sample-depth scaling on the way out, which for 4->8 bits is exactly x17. Since
// every value written is a multiple of 17, what comes back is byte-identical to
// an 8-bit file: verified in the real browser for the forest mask by rendering
// the same forest edge before and after and diffing every pixel, not just by
// round-tripping it here. It cost the forest mask 1.13 -> 0.96 MB and not one
// line of the loader - three's TextureLoader never sees the difference.
export function writeQuantisedMask({ dir, prefix, width, height, values, levels = 16 }) {
  if (levels > 16) throw new Error(`writeQuantisedMask: ${levels} levels do not fit in 4 bits`);
  const step = 255 / (levels - 1);
  const rowBytes = Math.ceil(width / 2);
  const nibbles = new Uint8Array(rowBytes * height); // PNG starts each row on a byte
  let full = 0;
  let partial = 0;

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const c = Math.min(1, Math.max(0, values[py * width + px]));
      const byte = Math.round(Math.round((c * 255) / step) * step);
      const level = Math.round(byte / 17); // 0..15
      const at = py * rowBytes + (px >> 1);
      nibbles[at] |= px & 1 ? level : level << 4;
      if (c > 0.5) full++;
      else if (c > 0) partial++;
    }
  }

  const png = encode({ width, height, data: nibbles, channels: 1, depth: 4 });
  const hash = createHash('sha256').update(png).digest('hex').slice(0, 8);
  const fileName = `${prefix}.${hash}.png`;

  const stale = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.[0-9a-f]{8}\\.png$`);
  for (const f of readdirSync(dir)) {
    if (stale.test(f) && f !== fileName) {
      unlinkSync(`${dir}/${f}`);
      console.log(`Removed stale ${f}`);
    }
  }
  writeFileSync(`${dir}/${fileName}`, png);

  return { fileName, bytes: png.byteLength, hash, fullPixels: full, partialPixels: partial };
}

// The exact inverse of writeQuantisedMask, for the Node-side tools that have to
// read a shipped mask back (tools/dev/probe-landcover.mjs,
// tools/test-groundcover.mjs). It lives next to the writer so the two cannot
// drift apart.
//
// It exists because fast-png does NOT expand a 4-bit image: for depth 4 it hands
// back the raw packed rows, so `data.length` is rowBytes * height, i.e. half of
// width * height, and reading it as one sample per byte silently returns the top
// half of the image with two pixels fused into each value. That mistake reported
// "no forest anywhere" on a mask that is 16.6% wooded - a whole-file zero, which
// is the signature worth remembering. The browser is unaffected: it applies the
// standard PNG sample scaling (x17 for 4->8 bits), which is what the writer's
// values are multiples of.
export function readQuantisedMask(path) {
  const png = decode(readFileSync(path));
  const { width, height, data, depth, channels } = png;
  if (channels !== 1) throw new Error(`${path}: expected 1 channel, got ${channels}`);
  const values = new Uint8Array(width * height);
  if (depth === 8) {
    if (data.length !== values.length) throw new Error(`${path}: 8-bit data is ${data.length}, expected ${values.length}`);
    values.set(data.subarray(0, values.length));
    return { values, width, height };
  }
  if (depth !== 4) throw new Error(`${path}: unsupported bit depth ${depth}`);
  const rowBytes = Math.ceil(width / 2);
  if (data.length !== rowBytes * height) {
    throw new Error(`${path}: 4-bit data is ${data.length}, expected ${rowBytes * height} packed bytes`);
  }
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const byte = data[py * rowBytes + (px >> 1)];
      const level = px & 1 ? byte & 0x0f : byte >> 4;
      values[py * width + px] = level * 17; // the PNG 4->8 bit sample scaling
    }
  }
  return { values, width, height };
}

// Bilinear-free box downsample of a coverage field by an integer factor. Used
// when a mask is finer than anything that reads it can use: averaging is the
// right reduction for a coverage fraction (it stays a coverage fraction), and
// dropping pixels would not be.
export function downsampleCoverage({ values, width, height, factor }) {
  if (factor === 1) return { values, width, height };
  const w = Math.ceil(width / factor);
  const h = Math.ceil(height / factor);
  const out = new Float32Array(w * h);
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      let sum = 0;
      let n = 0;
      for (let sy = py * factor; sy < Math.min(height, (py + 1) * factor); sy++) {
        for (let sx = px * factor; sx < Math.min(width, (px + 1) * factor); sx++) {
          sum += values[sy * width + sx];
          n++;
        }
      }
      out[py * w + px] = n ? sum / n : 0;
    }
  }
  return { values: out, width: w, height: h };
}
