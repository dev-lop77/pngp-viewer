import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { attachAtmoFatLine } from './atmosphere.js';

// The forest roads (OSM highway=track, public/data/roads.json), asked for by
// the user on 2026-08-18 with the Thumel -> Rifugio Benevolo road as the case
// in point: in the real valley you walk up a jeep track, and drawing only the
// footpath left the way most people actually take invisible.
//
// One unbroken white line for all of them, their choice: "va bene se viene
// disegnata come linea continua bianca". That reads correctly against the
// trails without competing with them - the trails are red and carry the CAI
// difficulty in their line STYLE (solid/dashed/dotted/ferrata, src/trails.js),
// so leaving every road solid and giving it the one colour no trail uses keeps
// the two vocabularies from overlapping. The draft carries `tracktype` and
// `surface` per road (a graded gravel road is not a grassy double track) if a
// finer distinction is ever wanted; nothing reads them yet.
const ROAD_COLOR = 0xffffff;

// TWICE AS THICK, on the user's second look: "fai la strada spessa il doppio".
// Which is why this is a LineSegments2 (three's addons fat lines) and not the
// plain LineSegments it was for its first hour of life - WebGL ignores
// LineBasicMaterial.linewidth entirely (ANGLE clamps it to 1), so a thicker
// line is not a parameter, it is a different mechanism: each segment becomes a
// screen-space-extruded quad.
//
// PIXELS, not metres, and deliberately: a real 5 m road drawn to scale is
// sub-pixel from across the valley, where it would flicker and then vanish -
// and seeing where the roads go from a distance is most of why they are here.
// So the width is 2 px at every distance, exactly twice the 1 px the trails
// draw at.
const ROAD_WIDTH_PX = 2;

// Same clearance as trails.js, for the same reason: just enough to keep the
// line off the surface it lies on, with alignToGround() below doing the real
// work of putting it on the surface the terrain actually draws.
const HEIGHT_OFFSET_M = 1.5;

// All 478 roads merge into ONE draw call - §10's instancing principle, exactly
// as trails.js does for its ~116 trails. There is no per-road styling to split
// them by, so this is the whole layer.
export async function loadRoads(dataUrl = `${import.meta.env.BASE_URL}data`) {
  const data = await fetch(`${dataUrl}/roads.json`).then((r) => r.json());

  const points = [];
  for (const road of data.roads) {
    for (let i = 1; i < road.line.length; i++) {
      const [x0, y0, z0] = road.line[i - 1];
      const [x1, y1, z1] = road.line[i];
      points.push(x0, y0 + HEIGHT_OFFSET_M, z0, x1, y1 + HEIGHT_OFFSET_M, z1);
    }
  }
  // Kept as our own Float32Array: LineSegmentsGeometry wraps this exact buffer,
  // so alignToGround() below can re-seat the road by writing into it instead of
  // rebuilding the interleaved attributes.
  const positions = new Float32Array(points);

  const geometry = new LineSegmentsGeometry();
  geometry.setPositions(positions);
  const material = attachAtmoFatLine(
    new LineMaterial({
      color: ROAD_COLOR,
      linewidth: ROAD_WIDTH_PX,
      // A screen-space width has to know the screen: main.js keeps this in step
      // with the canvas through setResolution() below.
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
    }),
  );
  const segments = new LineSegments2(geometry, material);
  segments.name = 'roads-track';

  const group = new THREE.Group();
  group.name = 'roads';
  group.add(segments);

  // Re-seat every vertex on the surface the terrain actually draws - same
  // treatment, and the same reason, as trails.js and poi.js: roads.json stores
  // true heightfield elevations, which is not the surface drawn wherever the
  // tile grid is coarser than the 20.5 m data or the height tier is on.
  function alignToGround(heightAt) {
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] = heightAt(positions[i], positions[i + 2]) + HEIGHT_OFFSET_M;
    }
    // The interleaved buffer is a view onto `positions`, so flagging it is
    // enough - and the bounding sphere has to be redone or the moved geometry
    // culls against a stale bound.
    geometry.attributes.instanceStart.data.needsUpdate = true;
    geometry.computeBoundingSphere();
  }

  function setResolution(width, height) {
    material.resolution.set(width, height);
  }

  return { group, manifest: data, alignToGround, setResolution };
}
