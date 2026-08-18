// The one inclusion rule every vector build shares: is this point inside the
// region we ship (tools/region.geojson - the park plus the valleys our terrain
// draws, see tools/fetch-region.mjs for why)?
//
// Extracted on 2026-08-18, when the region replaced the park polygon in
// build-trails/build-poi/build-hydrology and gained a fourth caller in
// build-roads. Before that each build carried its own copy of the same
// lon/lat -> local ring conversion, and they had quietly drifted apart: trails
// and lakes tested strictly inside, huts allowed 750 m outside, waterfalls used
// a hand-written name list. That disagreement - not the data - is why the user
// could see Rifugio Benevolo but neither the trail that reaches it nor the lake
// above it (docs/PROGRESS.md 2026-08-17).
//
// Everything here works in LOCAL SCENE METRES, like the data the builds handle,
// so "how far outside" is a real distance rather than degrees. Call
// setLocalOrigin() (src/geo.js) before loadRegion().

import { readFileSync } from 'node:fs';
import proj4 from 'proj4';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point, polygon } from '@turf/helpers';
import { worldToLocal } from '../../src/geo.js';

const REGION_FILE = 'tools/region.geojson';

proj4.defs('EPSG:23032', '+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs');

function ringsOf(geometry) {
  return geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat();
}

function bboxOf(rings) {
  let x0 = Infinity;
  let x1 = -Infinity;
  let z0 = Infinity;
  let z1 = -Infinity;
  for (const ring of rings) {
    for (const [x, z] of ring) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (z < z0) z0 = z;
      if (z > z1) z1 = z;
    }
  }
  return { x0, x1, z0, z1 };
}

export function loadRegion(file = REGION_FILE) {
  const geojson = JSON.parse(readFileSync(file, 'utf8'));
  const parts = geojson.features.map((feature) => {
    const localRings = ringsOf(feature.geometry).map((ring) =>
      ring.map(([lon, lat]) => {
        const [e, n] = proj4('WGS84', 'EPSG:23032', [lon, lat]);
        const { x, z } = worldToLocal(e, n);
        return [x, z];
      }),
    );
    return {
      name: feature.properties.name,
      role: feature.properties.role,
      source: feature.properties.source,
      rings: localRings,
      // Each ring is its own polygon for the point test: the parts overlap
      // (three comuni reach into the park), so a union would be wrong here -
      // "inside any" is exactly the rule we want.
      polys: localRings.map((ring) => polygon([ring])),
      bbox: bboxOf(localRings),
    };
  });

  // A bbox reject before the real point-in-polygon test: the park alone is
  // 7,857 vertices and the builds ask this question 300,000+ times.
  function contains(x, z) {
    for (const part of parts) {
      const b = part.bbox;
      if (x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1) continue;
      for (const poly of part.polys) {
        if (booleanPointInPolygon(point([x, z]), poly)) return true;
      }
    }
    return false;
  }

  // `line` is a list of [x, y, z] - the shape trails/lakes/rivers/roads use.
  // A feature is kept WHOLE if any of its points is inside, never clipped to
  // the edge: half a lake or a trail sliced mid-slope looks broken.
  function containsAnyPoint(line) {
    return line.some(([x, , z]) => contains(x, z));
  }

  function containsAnyPointOfLines(lines) {
    return lines.some((line) => containsAnyPoint(line));
  }

  // Distance to the nearest region EDGE, 0 when inside. Edge, not vertex:
  // vertex-only distance overstates by tens of metres along a long straight
  // stretch of boundary.
  function metresOutside(px, pz) {
    if (contains(px, pz)) return 0;
    let best = Infinity;
    for (const part of parts) {
      for (const ring of part.rings) {
        for (let i = 1; i < ring.length; i++) {
          const [ax, az] = ring[i - 1];
          const [bx, bz] = ring[i];
          const dx = bx - ax;
          const dz = bz - az;
          const lenSq = dx * dx + dz * dz;
          const t = lenSq > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / lenSq)) : 0;
          const d = Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
          if (d < best) best = d;
        }
      }
    }
    return best;
  }

  // What every build writes into its output manifest, so a reader of
  // trails.json or water.json can see which polygons decided its contents.
  function describe(filter) {
    return {
      name: 'Gran Paradiso park + the valleys our terrain draws',
      parts: parts.map((p) => `${p.name} (${p.role})`),
      source: parts[0].source,
      definedBy: 'tools/region.geojson, fetched by tools/fetch-region.mjs',
      filter,
    };
  }

  return { parts, contains, containsAnyPoint, containsAnyPointOfLines, metresOutside, describe };
}
