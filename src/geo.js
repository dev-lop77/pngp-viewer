// The one place world (EPSG:23032) <-> local scene-meter conversion lives
// (docs/ARCHITECTURE.md §6) - every module that needs it (terrain, trails,
// POI, UI) should import from here rather than reimplementing the formula.
// Axes: +X = East, +Y = Up (elevation), +Z = South.

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
