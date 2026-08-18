import * as THREE from 'three';
import { attachAtmo } from './atmosphere.js';

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

// Same clearance as trails.js, for the same reason: just enough to keep the
// line off the surface it lies on, with alignToGround() below doing the real
// work of putting it on the surface the terrain actually draws.
const HEIGHT_OFFSET_M = 1.5;

// All 478 roads merge into ONE draw call - §10's instancing principle, exactly
// as trails.js does for its ~116 trails. There is no per-road styling to split
// them by, so this is the whole layer.
export async function loadRoads(dataUrl = `${import.meta.env.BASE_URL}data`) {
  const data = await fetch(`${dataUrl}/roads.json`).then((r) => r.json());

  const positions = [];
  for (const road of data.roads) {
    for (let i = 1; i < road.line.length; i++) {
      const [x0, y0, z0] = road.line[i - 1];
      const [x1, y1, z1] = road.line[i];
      positions.push(x0, y0 + HEIGHT_OFFSET_M, z0, x1, y1 + HEIGHT_OFFSET_M, z1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const segments = new THREE.LineSegments(
    geometry,
    attachAtmo(new THREE.LineBasicMaterial({ color: ROAD_COLOR })),
  );
  segments.name = 'roads-track';

  const group = new THREE.Group();
  group.name = 'roads';
  group.add(segments);

  // Re-seat every vertex on the surface the terrain actually draws - same
  // treatment, and the same reason, as trails.js and poi.js: roads.json stores
  // true heightfield elevations, which is not the surface drawn wherever the
  // tile grid is coarser than the 20.5 m data or the height tier is on.
  function alignToGround(heightAt) {
    const attr = geometry.getAttribute('position');
    const a = attr.array;
    for (let i = 0; i < a.length; i += 3) {
      a[i + 1] = heightAt(a[i], a[i + 2]) + HEIGHT_OFFSET_M;
    }
    attr.needsUpdate = true;
    geometry.computeBoundingSphere(); // moved vertices would otherwise cull against a stale bound
  }

  return { group, manifest: data, alignToGround };
}
