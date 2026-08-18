import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { attachAtmo } from './atmosphere.js';
import { isHiddenByTerrain } from './labels.js';

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

// WHICH TRAIL AM I ON? Asked for by the user on 2026-08-18, in these words:
// "Visibile da vicino con una etichetta vicina con numero e nome solo se
// disponibile." So: a label that appears when you are near the trail, sits
// beside it rather than somewhere off in the scene, and reads
// "13 · Thumel - Rifugio Benevolo" - the number first, because that is what is
// painted on the rocks, and the name only when the data has one (115 of the
// 116 shipped trails carry a segnavia, all 116 a name).
//
// Not a fixed label per trail: one label per trail that MOVES to the point of
// that trail nearest the camera. A fixed one placed at, say, the midpoint
// would be behind a shoulder as often as not, and a label every N metres would
// mean hundreds of DOM nodes to say the same thing.
//
// 400 m rather than the POI layer's 1500 m. A POI is a destination you want to
// see named from across a valley; a trail number is a thing you read off the
// ground you are standing on, and at 1500 m every trail in a valley would
// answer at once.
const LABEL_MAX_DIST_M = 400;
// The label floats a little above the trace, further off as you get further
// away, exactly like poi.js's markers and for the same reason: close up a name
// hovering overhead reads as detached from the path it names.
const LABEL_MAX_OFFSET_M = 6;
const LABEL_MIN_OFFSET_M = 1.5;
const LABEL_OFFSET_PER_M = 0.02;

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

function labelTextFor(trail) {
  const parts = [trail.segnavia, trail.name].filter((p) => p && String(p).trim());
  return parts.join(' · ');
}

// The rectangle a trail occupies, so the per-tick pass can reject the far ones
// without touching their vertices: with 116 trails and ~38,000 points between
// them, scanning every point four times a second would be the most expensive
// thing on the CPU for the sake of two or three visible labels (§10).
function boundsOf(lines) {
  let x0 = Infinity;
  let x1 = -Infinity;
  let z0 = Infinity;
  let z1 = -Infinity;
  for (const line of lines) {
    for (const [x, , z] of line) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (z < z0) z0 = z;
      if (z > z1) z1 = z;
    }
  }
  return { x0, x1, z0, z1 };
}

function distanceToBounds(b, x, z) {
  const dx = Math.max(b.x0 - x, 0, x - b.x1);
  const dz = Math.max(b.z0 - z, 0, z - b.z1);
  return Math.hypot(dx, dz);
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

  // One label per trail, parked at its first point until the first update pass
  // moves it to whichever point you are nearest. Hidden to begin with: a label
  // is only ever shown by updateLabels(), which needs a camera.
  const labels = [];
  for (const trail of data.trails) {
    const text = labelTextFor(trail);
    if (!text) continue;
    const el = document.createElement('div');
    el.className = 'trail-label';
    el.textContent = text;
    const object = new CSS2DObject(el);
    object.center.set(0.5, 1); // anchored at the label's bottom-centre, floating above the trace
    object.visible = false;
    const [x, y, z] = trail.lines[0][0];
    object.position.set(x, y + LABEL_MAX_OFFSET_M, z);
    group.add(object);
    labels.push({ object, lines: trail.lines, bounds: boundsOf(trail.lines) });
  }

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

  let groundHeightAt = null; // set by alignToGround(); until then the labels skip the occlusion test

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
    groundHeightAt = heightAt;
    for (const child of group.children) {
      if (!child.geometry) continue; // the CSS2D labels ride in the same group
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

  // One pass per HUD tick (4 Hz, same as the POI markers): for each trail near
  // enough to matter, move its label to the nearest point on the trace and
  // decide whether it is shown. Distance is tested against the trail's bounding
  // rectangle first, so the per-point scan only runs for trails already known
  // to be close, and the terrain occlusion march only for those that survive
  // that.
  function updateLabels(camera) {
    const { x: cx, y: cy, z: cz } = camera.position;
    for (const label of labels) {
      if (distanceToBounds(label.bounds, cx, cz) > LABEL_MAX_DIST_M) {
        label.object.visible = false;
        continue;
      }
      let bestX = 0;
      let bestY = 0;
      let bestZ = 0;
      let bestSq = Infinity;
      for (const line of label.lines) {
        for (const [x, y, z] of line) {
          const dSq = (x - cx) * (x - cx) + (z - cz) * (z - cz);
          if (dSq < bestSq) {
            bestSq = dSq;
            bestX = x;
            bestY = y;
            bestZ = z;
          }
        }
      }
      // The trail's own vertices are already seated on the drawn surface by
      // alignToGround(), but only in the merged buffers - trail.lines still
      // holds the build-time elevation, so ask the surface directly when it is
      // available.
      const groundY = groundHeightAt ? groundHeightAt(bestX, bestZ) : bestY;
      const dist = Math.hypot(bestX - cx, groundY - cy, bestZ - cz);
      if (dist > LABEL_MAX_DIST_M) {
        label.object.visible = false;
        continue;
      }
      const offset = Math.min(LABEL_MAX_OFFSET_M, Math.max(LABEL_MIN_OFFSET_M, dist * LABEL_OFFSET_PER_M));
      label.object.position.set(bestX, groundY + offset, bestZ);
      label.object.visible = !isHiddenByTerrain(groundHeightAt, camera, label.object.position);
    }
  }

  return { group, manifest: data, alignToGround, updateLabels };
}
