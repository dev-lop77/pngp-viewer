// The one place world (EPSG:23032) <-> local scene-meter conversion lives
// (docs/ARCHITECTURE.md §6) - every module that needs it (terrain, trails,
// POI, UI) should import from here rather than reimplementing the formula.
// Axes: +X = East, +Y = Up (elevation), +Z = South.

import proj4 from 'proj4';

// Same definition as tools/fetch-osm.mjs (verified there against the Mont
// Blanc summit control point, ~20m off, consistent across two independent
// checks - see docs/PROGRESS.md). proj4 was build-time-only (a
// devDependency) until phase 5's live lat/lon readout needed it client-side
// too - now a real dependency (docs/ARCHITECTURE.md §3/§12).
proj4.defs('EPSG:23032', '+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs');

let origin = null;

export function setLocalOrigin(originE, originN) {
  origin = { e: originE, n: originN };
}

export function worldToLocal(e, n) {
  if (!origin) throw new Error('setLocalOrigin() must be called before worldToLocal()');
  return { x: e - origin.e, z: origin.n - n };
}

export function localToWorld(x, z) {
  if (!origin) throw new Error('setLocalOrigin() must be called before localToWorld()');
  return { e: x + origin.e, n: origin.n - z };
}

// Local scene meters -> WGS84 {lon, lat} - for the phase 5 live position
// readout (docs/ARCHITECTURE.md §7). Not used per-frame-critical-path
// elsewhere yet, so no caching - proj4's UTM inverse is cheap regardless.
export function localToWGS84(x, z) {
  const { e, n } = localToWorld(x, z);
  const [lon, lat] = proj4('EPSG:23032', 'WGS84', [e, n]);
  return { lon, lat };
}
