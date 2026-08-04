import * as THREE from 'three';

const COMPASS_POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

const _dir = new THREE.Vector3();

// Compass bearing (0..360, 0 = North, clockwise) of the camera's current
// view direction, projected onto the ground plane. Axes are +X = East,
// +Z = South (docs/ARCHITECTURE.md §6), so North is -Z and East is +X.
export function headingDegrees(camera) {
  camera.getWorldDirection(_dir);
  const deg = (Math.atan2(_dir.x, -_dir.z) * 180) / Math.PI;
  return (deg + 360) % 360;
}

export function compassLabel(deg) {
  return COMPASS_POINTS[Math.round(deg / 45) % 8];
}

// Vertical view angle in degrees, positive looking up, 0 at the horizon - the
// user asked for it in the HUD (2026-08-04) while reporting that mouse look
// still jumps somewhere, and with no readout there was no way to say where.
// Taken from the camera's world direction rather than a YXZ euler's x: the euler
// decomposition goes degenerate at the poles, and this is the angle actually
// read off the horizon regardless of any roll.
export function pitchDegrees(camera) {
  camera.getWorldDirection(_dir);
  return (Math.asin(THREE.MathUtils.clamp(_dir.y, -1, 1)) * 180) / Math.PI;
}

// Closest POI to a local (x, z) position, horizontal distance only (real
// "nearest place" is a ground-distance notion, not line-of-sight through a
// mountain) - linear scan over ~400 POIs, cheap enough to call every HUD
// tick (docs/ARCHITECTURE.md §10 - not the kind of per-frame cost that
// needs a spatial index at this N).
export function nearestPOI(x, z, pois) {
  let best = null;
  let bestDistSq = Infinity;
  for (const poi of pois) {
    const dx = poi.local.x - x;
    const dz = poi.local.z - z;
    const distSq = dx * dx + dz * dz;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      best = poi;
    }
  }
  return best ? { poi: best, distanceM: Math.sqrt(bestDistSq) } : null;
}
