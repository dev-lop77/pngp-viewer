import * as THREE from 'three';
import { attachAtmo } from './atmosphere.js';

// CAI difficulty scale (docs/ARCHITECTURE.md §3) shown via line STYLE, not
// color - matches real hiking-map convention (a single trail color, with
// difficulty read off the pattern): T solid, E dashed, EE dotted, EEA a
// solid line with periodic "x" ticks (via ferrata / cavo d'acciaio).
const TRAIL_COLOR = 0xb3261e;
const STYLE_BY_DIFFICULTY = { T: 'solid', E: 'dashed', EE: 'dotted', EEA: 'ferrata' };
const DEFAULT_STYLE = 'solid'; // difficulty null/unrecognized (~7 of 1130 trails)

// Just enough to keep the line off the surface it lies on, no more. This was
// 3 m, chosen when the terrain mesh was ~29 m from the true heightfield
// anyway, so a 3 m lift was invisible; with the LOD terrain accurate to well
// under a metre the user could see trails floating "qualche metro" up
// (2026-08-03). The other half of that fix is alignToGround() below - the
// build-time elevations in trails.json are true heightfield values, which is
// not quite the surface actually drawn.
const HEIGHT_OFFSET_M = 1.5;
const FERRATA_TICK_SPACING_M = 40;
const FERRATA_TICK_HALF_SIZE_M = 7;

function pushSegment(bucket, x0, y0, z0, x1, y1, z1) {
  bucket.push(x0, y0 + HEIGHT_OFFSET_M, z0, x1, y1 + HEIGHT_OFFSET_M, z1);
}

function pushLine(bucket, line) {
  for (let i = 1; i < line.length; i++) {
    const [x0, y0, z0] = line[i - 1];
    const [x1, y1, z1] = line[i];
    pushSegment(bucket, x0, y0, z0, x1, y1, z1);
  }
}

// Emits a small "x" (two crossing diagonal segments, aligned to the local
// path direction) every FERRATA_TICK_SPACING_M along the line - the
// via-ferrata/cavo-d'acciaio map convention the user asked for.
function pushFerrataTicks(bucket, line) {
  let sinceLastTick = 0;
  for (let i = 1; i < line.length; i++) {
    const [x0, y0, z0] = line[i - 1];
    const [x1, y1, z1] = line[i];
    const dx = x1 - x0;
    const dz = z1 - z0;
    const segLen = Math.hypot(dx, dz);
    if (segLen === 0) continue;
    const tx = dx / segLen;
    const tz = dz / segLen;
    const px = -tz; // perpendicular, in the XZ plane
    const pz = tx;

    let dist = FERRATA_TICK_SPACING_M - sinceLastTick;
    while (dist < segLen) {
      const t = dist / segLen;
      const cx = x0 + dx * t;
      const cy = y0 + (y1 - y0) * t;
      const cz = z0 + dz * t;
      const h = FERRATA_TICK_HALF_SIZE_M;
      pushSegment(bucket, cx - (tx + px) * h, cy, cz - (tz + pz) * h, cx + (tx + px) * h, cy, cz + (tz + pz) * h);
      pushSegment(bucket, cx - (tx - px) * h, cy, cz - (tz - pz) * h, cx + (tx - px) * h, cy, cz + (tz - pz) * h);
      dist += FERRATA_TICK_SPACING_M;
    }
    sinceLastTick = (sinceLastTick + segLen) % FERRATA_TICK_SPACING_M;
  }
}

function buildLineSegments(positions, material, name) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const segments = new THREE.LineSegments(geometry, material);
  if (material.isLineDashedMaterial) {
    segments.computeLineDistances();
  }
  segments.name = name;
  return segments;
}

// Merges all ~1,130 trails into one draw call per line style (4, plus a
// 5th for the ferrata tick overlay) instead of one per trail - §10's
// "instancing for repeated geometry" principle applied to lines.
export async function loadTrails(dataUrl = `${import.meta.env.BASE_URL}data`) {
  const data = await fetch(`${dataUrl}/trails.json`).then((r) => r.json());

  const positionsByStyle = { solid: [], dashed: [], dotted: [], ferrata: [] };
  const ferrataTicks = [];

  for (const trail of data.trails) {
    const style = STYLE_BY_DIFFICULTY[trail.difficulty] ?? DEFAULT_STYLE;
    for (const line of trail.lines) {
      pushLine(positionsByStyle[style], line);
      if (style === 'ferrata') pushFerrataTicks(ferrataTicks, line);
    }
  }

  const group = new THREE.Group();
  group.name = 'trails';

  if (positionsByStyle.solid.length) {
    group.add(
      buildLineSegments(positionsByStyle.solid, attachAtmo(new THREE.LineBasicMaterial({ color: TRAIL_COLOR })), 'trails-solid'),
    );
  }
  if (positionsByStyle.dashed.length) {
    const material = attachAtmo(new THREE.LineDashedMaterial({ color: TRAIL_COLOR, dashSize: 30, gapSize: 20 }));
    group.add(buildLineSegments(positionsByStyle.dashed, material, 'trails-dashed'));
  }
  if (positionsByStyle.dotted.length) {
    const material = attachAtmo(new THREE.LineDashedMaterial({ color: TRAIL_COLOR, dashSize: 4, gapSize: 16 }));
    group.add(buildLineSegments(positionsByStyle.dotted, material, 'trails-dotted'));
  }
  if (positionsByStyle.ferrata.length) {
    const material = attachAtmo(new THREE.LineBasicMaterial({ color: TRAIL_COLOR }));
    group.add(buildLineSegments(positionsByStyle.ferrata, material, 'trails-ferrata-line'));
    group.add(buildLineSegments(ferrataTicks, material, 'trails-ferrata-ticks'));
  }

  // Re-seat every trail vertex on the surface the terrain actually draws.
  //
  // trails.json stores true heightfield elevations (sampled at build time by
  // tools/build-trails.mjs), which is not the same as the drawn surface
  // wherever the tile grid is coarser than the 20.5 m data - so a trail could
  // sit visibly off the path it follows. Same treatment as poi.js's markers,
  // and for the same reason. Cheap enough as a one-off pass over the merged
  // buffers, and it keeps the build output independent of the renderer's
  // current LOD settings (§10) rather than baking them into the data.
  //
  // Dashed styles need computeLineDistances() re-run: it measures real 3D
  // segment lengths, so moving vertices changes where the dashes fall.
  function alignToGround(heightAt) {
    for (const child of group.children) {
      const attr = child.geometry.getAttribute('position');
      const a = attr.array;
      for (let i = 0; i < a.length; i += 3) {
        a[i + 1] = heightAt(a[i], a[i + 2]) + HEIGHT_OFFSET_M;
      }
      attr.needsUpdate = true;
      child.geometry.computeBoundingSphere(); // moved vertices would otherwise cull against a stale bound
      if (child.material.isLineDashedMaterial) child.computeLineDistances();
    }
  }

  return { group, manifest: data, alignToGround };
}
