#!/usr/bin/env node
// Which tiles meet under the camera, at what depths, and how big the crack between them
// really is. For the open debt "a terrain tile skirt shows at eye height on the ice"
// (2026-08-19, 45.51249N 7.01452E).
//
// A skirt is only ever seen through the gap it is filling, so a VISIBLE skirt is a big
// gap - and a gap comes from a T-junction, where a tile's edge vertices sit on the real
// surface while its coarser neighbour's edge is a straight line between samples one coarse
// cell apart. This replicates src/terrain.js's walk() exactly (same SPLIT_FACTOR, same
// tier rule) and then measures the sag along every border the camera can touch, from the
// heightfield itself.
//
// Usage: node tools/dev/probe-lod-neighbours.mjs [lat] [lon]

import { readFileSync } from 'node:fs';
import proj4 from 'proj4';

proj4.defs('EPSG:23032', '+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs');
const lat = Number(process.argv[2] ?? 45.51249);
const lon = Number(process.argv[3] ?? 7.01452);

const man = JSON.parse(readFileSync('public/data/heightfield.json', 'utf8'));
const tierMan = JSON.parse(readFileSync('public/data/heighttier.json', 'utf8'));
const { width, height } = man.dimensions;
const { min: elevMin, max: elevMax } = man.elevationRangeM;
const worldWidth = man.bboxCrsUnits.xmax - man.bboxCrsUnits.xmin;
const worldDepth = man.bboxCrsUnits.ymax - man.bboxCrsUnits.ymin;
const originE = man.localOrigin.x;
const originN = man.localOrigin.y;

const raw = readFileSync('public/data/heightfield.1fefad51.bin');
const n = width * height;
const hi = raw.subarray(0, n);
const lo = raw.subarray(n, 2 * n);
const elev = new Float32Array(n);
{
  const scale = (elevMax - elevMin) / 65535;
  for (let row = 0; row < height; row++) {
    let v = 0;
    for (let x = 0; x < width; x++) {
      const i = row * width + x;
      v = (v + ((hi[i] << 8) | lo[i])) & 0xffff;
      elev[i] = elevMin + v * scale;
    }
  }
}
// Bilinear, on the same cell-centre convention terrainElevation() uses.
function heightAt(x, z) {
  const px = ((x + worldWidth / 2) / worldWidth) * width - 0.5;
  const pz = ((z + worldDepth / 2) / worldDepth) * height - 0.5;
  const x0 = Math.max(0, Math.min(width - 2, Math.floor(px)));
  const z0 = Math.max(0, Math.min(height - 2, Math.floor(pz)));
  const fx = Math.max(0, Math.min(1, px - x0));
  const fz = Math.max(0, Math.min(1, pz - z0));
  const h00 = elev[z0 * width + x0]; const h10 = elev[z0 * width + x0 + 1];
  const h01 = elev[(z0 + 1) * width + x0]; const h11 = elev[(z0 + 1) * width + x0 + 1];
  return (h00 * (1 - fx) + h10 * fx) * (1 - fz) + (h01 * (1 - fx) + h11 * fx) * fz;
}

const TILE_SEGMENTS = 32;
const MAX_DEPTH = 7;
const SPLIT_FACTOR = 1.5;
const baseCellM = worldWidth / (TILE_SEGMENTS * 2 ** MAX_DEPTH);
const tierLevel = tierMan.levels[0]; // 10 m, the default quality
const tierExtraDepth = Math.max(0, Math.floor(Math.log2(baseCellM / tierLevel.resolutionMPerPx.x)));
const tb = tierMan.bboxCrsUnits;
const rect = { x: tb.xmin - originE, y: originN - tb.ymax, z: tb.xmax - tb.xmin, w: tb.ymax - tb.ymin };

const [e, nn] = proj4('WGS84', 'EPSG:23032', [lon, lat]);
const camX = e - originE;
const camZ = originN - nn;
console.log(`camera ${camX.toFixed(0)}, ${camZ.toFixed(0)} - ground ${heightAt(camX, camZ).toFixed(1)} m`);
console.log(`tier gives ${tierExtraDepth} extra level(s); base cell ${baseCellM.toFixed(2)} m\n`);

// src/terrain.js's walk(), without the frustum test - every tile, not just the visible ones.
const tiles = [];
function walk(cx, cz, halfW, halfD, depth) {
  const insideTier = cx - halfW >= rect.x && cx + halfW <= rect.x + rect.z
                  && cz - halfD >= rect.y && cz + halfD <= rect.y + rect.w;
  const maxDepthHere = insideTier ? MAX_DEPTH + tierExtraDepth : MAX_DEPTH;
  if (depth < maxDepthHere) {
    const dx = Math.max(0, Math.abs(camX - cx) - halfW);
    const dz = Math.max(0, Math.abs(camZ - cz) - halfD);
    if (Math.hypot(dx, dz) < Math.max(halfW, halfD) * 2 * SPLIT_FACTOR) {
      const qw = halfW / 2; const qd = halfD / 2;
      walk(cx - qw, cz - qd, qw, qd, depth + 1);
      walk(cx + qw, cz - qd, qw, qd, depth + 1);
      walk(cx - qw, cz + qd, qw, qd, depth + 1);
      walk(cx + qw, cz + qd, qw, qd, depth + 1);
      return;
    }
  }
  tiles.push({ cx, cz, halfW, halfD, depth });
}
walk(0, 0, worldWidth / 2, worldDepth / 2, 0);
console.log(`${tiles.length} tiles, deepest ${Math.max(...tiles.map((t) => t.depth))}`);

const under = tiles.find((t) => Math.abs(camX - t.cx) <= t.halfW && Math.abs(camZ - t.cz) <= t.halfD);
console.log(`the camera stands on a depth-${under.depth} tile, ${(under.halfW * 2).toFixed(0)} x ${(under.halfD * 2).toFixed(0)} m, cell ${(under.halfW * 2 / TILE_SEGMENTS).toFixed(2)} m`);

// Every pair of tiles that share a border, within 1 km of the camera, and the worst sag
// along the shared span: the fine edge against the coarse edge's straight line.
const near = tiles.filter((t) => Math.hypot(Math.max(0, Math.abs(camX - t.cx) - t.halfW),
                                            Math.max(0, Math.abs(camZ - t.cz) - t.halfD)) < 1000);
console.log(`${near.length} tiles within 1 km; depths ${[...new Set(near.map((t) => t.depth))].sort().join(', ')}\n`);

let worst = null;
for (const a of near) {
  for (const b of near) {
    if (a === b || a.depth >= b.depth) continue; // a is the COARSER of the pair
    // Do they share a vertical or horizontal border?
    const vertical = Math.abs((a.cx + a.halfW) - (b.cx - b.halfW)) < 0.01
                  || Math.abs((a.cx - a.halfW) - (b.cx + b.halfW)) < 0.01;
    const horizontal = Math.abs((a.cz + a.halfD) - (b.cz - b.halfD)) < 0.01
                    || Math.abs((a.cz - a.halfD) - (b.cz + b.halfD)) < 0.01;
    if (!vertical && !horizontal) continue;
    const overlap = vertical
      ? [Math.max(a.cz - a.halfD, b.cz - b.halfD), Math.min(a.cz + a.halfD, b.cz + b.halfD)]
      : [Math.max(a.cx - a.halfW, b.cx - b.halfW), Math.min(a.cx + a.halfW, b.cx + b.halfW)];
    if (overlap[1] - overlap[0] < 1) continue;
    const border = vertical ? (Math.abs((a.cx + a.halfW) - (b.cx - b.halfW)) < 0.01 ? a.cx + a.halfW : a.cx - a.halfW)
                            : (Math.abs((a.cz + a.halfD) - (b.cz - b.halfD)) < 0.01 ? a.cz + a.halfD : a.cz - a.halfD);
    const coarseCell = (vertical ? a.halfD * 2 : a.halfW * 2) / TILE_SEGMENTS;
    // Walk the shared span at the FINE tile's vertex pitch and compare the real surface to
    // the coarse tile's straight edge between its own vertices.
    const fineCell = (vertical ? b.halfD * 2 : b.halfW * 2) / TILE_SEGMENTS;
    for (let s = overlap[0]; s <= overlap[1]; s += fineCell) {
      const k = Math.floor((s - (vertical ? a.cz - a.halfD : a.cx - a.halfW)) / coarseCell);
      const c0 = (vertical ? a.cz - a.halfD : a.cx - a.halfW) + k * coarseCell;
      const c1 = c0 + coarseCell;
      const t = (s - c0) / coarseCell;
      const at = (u) => (vertical ? heightAt(border, u) : heightAt(u, border));
      const gap = Math.abs(at(s) - (at(c0) * (1 - t) + at(c1) * t));
      const dist = Math.hypot(vertical ? border - camX : s - camX, vertical ? s - camZ : border - camZ);
      if (!worst || gap > worst.gap) worst = { gap, s, border, vertical, dist, aDepth: a.depth, bDepth: b.depth };
    }
  }
}
console.log(worst
  ? `worst T-junction gap within 1 km: ${worst.gap.toFixed(2)} m, between depth ${worst.aDepth} and ${worst.bDepth}, ${worst.dist.toFixed(0)} m from the camera`
  : 'no T-junction within 1 km - every neighbour is the same depth');
