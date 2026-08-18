import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { attachAtmo, attachAtmoFatLine } from './atmosphere.js';
import { isHiddenByTerrain } from './labels.js';
import { densify } from './polyline.js';

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
//
// 1.5 -> 0.5 m on 2026-08-18, when the user reported the traces floating again
// and "molto nella versione High Res". 1.5 m is chest height on a path you are
// standing on, and it was only that high to paper over the real cause: the
// straight chord between vertices 29 m apart, which leaves the drawn ground by
// metres on its own (see src/polyline.js). With the chord fixed, the lift can be
// what it was always meant to be - enough to keep the line out of the surface,
// not enough to read as a separate object.
const HEIGHT_OFFSET_M = 0.5;
// No segment longer than this reaches the GPU. Measured against the alternative
// rather than picked: at the dataset's own 29 m spacing the chord leaves the
// drawn surface by up to 3.3 m (p99 2.1 m); the deviation falls with the square
// of the segment, so 8 m brings that to centimetres, and it multiplies the
// trails' vertex count by about 3.5 - some 80,000 points across 648 km, which is
// nothing on the GPU and a few milliseconds at load.
const MAX_SEGMENT_M = 8;
// The cable ticks, sized on the user's verdict of the first version: "Le croci
// sono enormi e creano solo del caos. La linea dovrebbe essere composta da
// piccole crocette che seguono la linea."
//
// They were 14 m across every 40 m - a fourteen-metre X drawn on a mountainside,
// which is the size of a house, so from any distance it read as scattered
// wreckage rather than as a line. 2.4 m every 6 m is the map convention it was
// always meant to be: close enough together that the ticks ARE the line, small
// enough that they merge into one from across the valley instead of shouting.
const FERRATA_TICK_SPACING_M = 6;
const FERRATA_TICK_HALF_SIZE_M = 1.2;

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

// THE ALTA VIA, the user's addition on their second look: mark the trails that
// are part of one "con il tipico simbolo del triangolo con il numero dentro.
// Visibile da molto più lontano rispetto ai numeri dei sentieri. Ingrossando
// leggermente la linea."
//
// So two things, and they answer the same want from two distances. Up close the
// trace itself is heavier: a soft yellow casing drawn UNDER the red trail line,
// slightly wider, which leaves the CAI dash pattern legible on top instead of
// filling in its gaps (a thicker red line would have hidden the difficulty the
// pattern exists to show). From far away the waymark does the work: a yellow
// triangle with the route number in it, the real thing painted on the rocks,
// readable long after a 1 px dashed line has faded into the slope.
//
// Yellow because that is the colour of the waymark itself, and reusing it for
// the casing ties the two together - the line and the triangle say the same
// thing in the same colour.
const ALTA_VIA_COLOR = 0xf2c200;
const ALTA_VIA_WIDTH_PX = 3;
// EXACTLY the trail line's own height, since 2026-08-18. It was 0.3 m lower, on
// the theory that the red would then always win the depth test - and that 0.3 m
// is what the user saw as "le due tracce, rossa e gialla non sono vicine fra
// loro": standing 30 m away at eye height, 0.3 m of vertical separation is 0.57
// degrees, which is nine pixels of daylight between two lines that are supposed
// to be one. The casing simply does not write depth instead, so the red draws
// over it without needing to be above it.
const ALTA_VIA_HEIGHT_OFFSET_M = HEIGHT_OFFSET_M;
// One waymark every 2 km of route, which on the 116 km of Alta Via 2 inside the
// region comes to a few dozen - enough that one is in sight along a valley,
// few enough that a ridge crest does not turn into a row of triangles. The
// route's own stretches overlap in the source (the numbered trails and the
// TAPPA stages are separate features over the same ground), so a badge is
// dropped when another is already within MIN_GAP.
const AV_BADGE_SPACING_M = 2000;
const AV_BADGE_MIN_GAP_M = 400;
// 6 km, i.e. "molto più lontano" than the 400 m trail labels - the length of a
// valley rather than the ground under your feet.
const AV_BADGE_MAX_DIST_M = 6000;
// Sitting close to the trace, on the user's second note: "Puoi avvicinarlo alla
// linea dell'alta via così camminandoci vicino si vede e non galleggia troppo in
// aria." It used to lift 3 m at the nearest and up to 40 m, which read as a
// balloon over the path rather than a waymark beside it. Now it starts at eye
// height and climbs slowly - 1.5 m as you walk past, 2.9 m at 400 m, the 18 m cap
// only at 3 km, where 18 m is 0.6% of the distance and does nothing but keep the
// triangle clear of the ground in front of it.
const AV_BADGE_MAX_OFFSET_M = 18;
const AV_BADGE_MIN_OFFSET_M = 1.5;
const AV_BADGE_OFFSET_PER_M = 0.006;

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

// The waymark itself, as an SVG rather than a CSS clip-path: the user asked for
// its corners to be rounded ("i vertici del triangolo vanno arrotondati") and
// clip-path cannot round anything - it cuts. Stroking the same triangle in its own
// colour with a round line join does, and costs one attribute.
const SVG_NS = 'http://www.w3.org/2000/svg';
function altaViaTriangle(number) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 22');
  svg.setAttribute('aria-hidden', 'true');
  // Inset by half the stroke width on every side, so the stroked shape lands
  // inside the viewBox instead of being clipped at the corners.
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'M12 3 L21.5 19 L2.5 19 Z');
  svg.append(path);
  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('x', '12');
  text.setAttribute('y', '17.4'); // low in the triangle, where it is widest
  text.textContent = String(number);
  svg.append(text);
  return svg;
}

function labelTextFor(trail) {
  const parts = [trail.segnavia, trail.name].filter((p) => p && String(p).trim());
  // A via ferrata has no trail number, and what a walker wants in its place is
  // how hard the cable is: OSM's via_ferrata_scale, 1 to 5.
  if (trail.ferrataScale) parts.push(`ferrata ${trail.ferrataScale}`);
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

// Walks a line and returns a point every `spacing` metres of real ground
// distance - where the Alta Via waymarks go. Distance is measured in XZ, like
// every other length in this file.
function pointsAlong(line, spacing, firstAt) {
  const out = [];
  let since = firstAt;
  for (let i = 1; i < line.length; i++) {
    const [x0, y0, z0] = line[i - 1];
    const [x1, y1, z1] = line[i];
    const segLen = Math.hypot(x1 - x0, z1 - z0);
    if (segLen === 0) continue;
    let at = spacing - since;
    while (at < segLen) {
      const t = at / segLen;
      out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t]);
      at += spacing;
    }
    since = (since + segLen) % spacing;
  }
  return out;
}

// Merges all ~1,130 trails into one draw call per line style (4, plus a
// 5th for the ferrata tick overlay) instead of one per trail - §10's
// "instancing for repeated geometry" principle applied to lines.
export async function loadTrails(dataUrl = `${import.meta.env.BASE_URL}data`) {
  // THE VIA FERRATAS ride in the same list, and that is the whole trick: they are
  // built (tools/build-ferrata.mjs) with a trail's own record shape, so the EEA
  // line style with its cable ticks, the moving label, the seating on the drawn
  // ground and the bounds test below all work on them without a second code path.
  // They come from OSM rather than the VDA dataset - the user asked for the two
  // they knew (Valgrisenche and Chanavey, 2026-08-18) and the regional trail
  // dataset simply does not carry them.
  //
  // Failure here is survivable and must be: an older deploy has no ferrata.json,
  // and the trails matter more than the three routes.
  const [data, ferrata] = await Promise.all([
    fetch(`${dataUrl}/trails.json`).then((r) => r.json()),
    fetch(`${dataUrl}/ferrata.json`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ]);
  const trails = ferrata?.ferrata?.length ? [...data.trails, ...ferrata.ferrata] : data.trails;

  const positionsByStyle = { solid: [], dashed: [], dotted: [], ferrata: [] };
  const ferrataTicks = [];
  const altaViaPoints = []; // the casing, one flat [x,y,z,x,y,z,...] segment list

  for (const trail of trails) {
    const style = STYLE_BY_DIFFICULTY[trail.difficulty] ?? DEFAULT_STYLE;
    for (const source of trail.lines) {
      // Cut to MAX_SEGMENT_M first: everything below seats vertices on the drawn
      // ground, and a vertex is the only place a line can follow it.
      const line = densify(source, MAX_SEGMENT_M);
      pushLine(positionsByStyle[style], line);
      // The ferrata ticks keep the ORIGINAL line: they are spaced along it in
      // metres already, and densifying only adds points for them to skip.
      if (style === 'ferrata') pushFerrataTicks(ferrataTicks, source);
      if (trail.altaVia) {
        for (let i = 1; i < line.length; i++) {
          const [x0, y0, z0] = line[i - 1];
          const [x1, y1, z1] = line[i];
          altaViaPoints.push(
            x0, y0 + ALTA_VIA_HEIGHT_OFFSET_M, z0,
            x1, y1 + ALTA_VIA_HEIGHT_OFFSET_M, z1,
          );
        }
      }
    }
  }

  const group = new THREE.Group();
  group.name = 'trails';
  const thinLines = []; // the LineSegments children, kept out of group.children walks

  // The Alta Via casing goes in FIRST so it is drawn before the red trail line
  // on top of it - belt and braces with its lower height offset.
  let altaViaCasing = null;
  let altaViaPositions = null;
  let altaViaMaterial = null;
  if (altaViaPoints.length) {
    altaViaPositions = new Float32Array(altaViaPoints);
    const geometry = new LineSegmentsGeometry();
    geometry.setPositions(altaViaPositions);
    altaViaMaterial = attachAtmoFatLine(
      new LineMaterial({
        color: ALTA_VIA_COLOR,
        linewidth: ALTA_VIA_WIDTH_PX,
        transparent: true,
        opacity: 0.85,
        // Tested against the terrain like everything else, but never written:
        // the casing and the red trail line now sit at the SAME height, and the
        // red is drawn second, so the one that must win is the one that comes
        // last rather than the one that is higher.
        depthWrite: false,
        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
      }),
    );
    altaViaCasing = new LineSegments2(geometry, altaViaMaterial);
    altaViaCasing.name = 'trails-alta-via-casing';
    altaViaCasing.renderOrder = -1;
    group.add(altaViaCasing);
  }

  // One label per trail, parked at its first point until the first update pass
  // moves it to whichever point you are nearest. Hidden to begin with: a label
  // is only ever shown by updateLabels(), which needs a camera.
  const labels = [];
  for (const trail of trails) {
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

  // The waymarks: a yellow triangle with the route number, spaced along the
  // route and thinned where the source's overlapping features would stack them.
  const badges = [];
  for (const trail of trails) {
    if (!trail.altaVia) continue;
    for (const line of trail.lines) {
      // Starting half a spacing in, not a full one: several of the source's Alta
      // Via features are shorter than 2 km on their own, and from the start they
      // would have carried no waymark at all.
      for (const [x, y, z] of pointsAlong(line, AV_BADGE_SPACING_M, AV_BADGE_SPACING_M / 2)) {
        if (badges.some((b) => Math.hypot(b.x - x, b.z - z) < AV_BADGE_MIN_GAP_M)) continue;
        const el = document.createElement('div');
        el.className = 'av-badge';
        el.title = `Alta Via ${trail.altaVia}`;
        el.append(altaViaTriangle(trail.altaVia));
        const object = new CSS2DObject(el);
        object.center.set(0.5, 1);
        object.visible = false;
        object.position.set(x, y + AV_BADGE_MAX_OFFSET_M, z);
        group.add(object);
        badges.push({ object, x, z, groundY: y });
      }
    }
  }

  if (positionsByStyle.solid.length) {
    thinLines.push(
      buildLineSegments(positionsByStyle.solid, attachAtmo(new THREE.LineBasicMaterial({ color: TRAIL_COLOR })), 'trails-solid'),
    );
  }
  if (positionsByStyle.dashed.length) {
    const material = attachAtmo(new THREE.LineDashedMaterial({ color: TRAIL_COLOR, dashSize: 30, gapSize: 20 }));
    thinLines.push(buildLineSegments(positionsByStyle.dashed, material, 'trails-dashed'));
  }
  if (positionsByStyle.dotted.length) {
    const material = attachAtmo(new THREE.LineDashedMaterial({ color: TRAIL_COLOR, dashSize: 4, gapSize: 16 }));
    thinLines.push(buildLineSegments(positionsByStyle.dotted, material, 'trails-dotted'));
  }
  if (positionsByStyle.ferrata.length) {
    const material = attachAtmo(new THREE.LineBasicMaterial({ color: TRAIL_COLOR }));
    thinLines.push(buildLineSegments(positionsByStyle.ferrata, material, 'trails-ferrata-line'));
    thinLines.push(buildLineSegments(ferrataTicks, material, 'trails-ferrata-ticks'));
  }
  for (const child of thinLines) group.add(child);

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
  //
  // The casing and the badges are re-seated here too, and NOT by walking
  // group.children: that group also holds the DOM labels and a LineSegments2,
  // whose geometry carries a `position` attribute of its own - the 8-vertex
  // quad template every segment is instanced from. Writing ground heights into
  // that would deform the quad rather than move the line.
  function alignToGround(heightAt) {
    groundHeightAt = heightAt;
    for (const child of thinLines) {
      const attr = child.geometry.getAttribute('position');
      const a = attr.array;
      for (let i = 0; i < a.length; i += 3) {
        a[i + 1] = heightAt(a[i], a[i + 2]) + HEIGHT_OFFSET_M;
      }
      attr.needsUpdate = true;
      child.geometry.computeBoundingSphere(); // moved vertices would otherwise cull against a stale bound
      if (child.material.isLineDashedMaterial) child.computeLineDistances();
    }
    if (altaViaCasing) {
      for (let i = 0; i < altaViaPositions.length; i += 3) {
        altaViaPositions[i + 1] = heightAt(altaViaPositions[i], altaViaPositions[i + 2]) + ALTA_VIA_HEIGHT_OFFSET_M;
      }
      altaViaCasing.geometry.attributes.instanceStart.data.needsUpdate = true;
      altaViaCasing.geometry.computeBoundingSphere();
    }
    for (const badge of badges) {
      badge.groundY = heightAt(badge.x, badge.z);
    }
  }

  // One pass per HUD tick (4 Hz, same as the POI markers): for each trail near
  // enough to matter, move its label to the nearest point on the trace and
  // decide whether it is shown. Distance is tested against the trail's bounding
  // rectangle first, so the per-point scan only runs for trails already known
  // to be close, and the terrain occlusion march only for those that survive
  // that. The Alta Via badges are handled in the same pass - they are fixed in
  // place, so all they need is the distance and the occlusion test.
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

    for (const badge of badges) {
      const dist = Math.hypot(badge.x - cx, badge.groundY - cy, badge.z - cz);
      if (dist > AV_BADGE_MAX_DIST_M) {
        badge.object.visible = false;
        continue;
      }
      const offset = Math.min(
        AV_BADGE_MAX_OFFSET_M,
        Math.max(AV_BADGE_MIN_OFFSET_M, dist * AV_BADGE_OFFSET_PER_M),
      );
      badge.object.position.set(badge.x, badge.groundY + offset, badge.z);
      badge.object.visible = !isHiddenByTerrain(groundHeightAt, camera, badge.object.position);
    }
  }

  // A fat line's width is in screen pixels, so it has to be told the canvas size.
  function setResolution(width, height) {
    altaViaMaterial?.resolution.set(width, height);
  }

  return { group, manifest: data, ferrataManifest: ferrata, alignToGround, updateLabels, setResolution };
}
