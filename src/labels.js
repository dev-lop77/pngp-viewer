// Is the drawn terrain between the camera and a label?
//
// DOM labels (CSS2DObject) are not depth-tested, so without this a name shows
// straight through a mountain - which the user confirmed reads as annoying
// (docs/PROGRESS-ARCHIVE.md 2026-08-03). Walking the line of sight and asking whether
// the drawn surface rises above it is only possible because terrain.js'
// sampleRenderedHeight() reconstructs that surface analytically: a Raycaster
// sees the undisplaced CPU plane, and a depth-buffer readback would stall the
// pipeline every frame.
//
// Lived in poi.js until 2026-08-18, when the trail labels needed exactly the
// same test - and the same numbers, which are derived rather than picked.
const OCCLUSION_MARGIN_M = 10;
const OCCLUSION_STEP_M = 40; // ~1/8 of a 328 m terrain quad - fine enough to catch a ridge crest
const OCCLUSION_MAX_STEPS = 40;

// The margin is sized to the drawn surface's own worst-case error, not picked
// by eye: with the LOD terrain it deviates from the true heightfield by a
// measured max of 7.73 m (mean 0.38 m - tools/test-rendered-height.mjs), so
// 10 m is just past where a deviation can be geometry error rather than a real
// ridge. It was briefly 30 m, when the old 328 m mesh was 29.2 m off on
// average and drew summits 130 m low; the LOD work removed the need for that
// slack.
//
// `groundHeightAt` is null until the caller has been given the drawn surface,
// and then the honest answer is "not hidden" rather than a guess.
// Only the XZ path is stepped - the sight line's own height is interpolated
// linearly, which is exact for a straight ray.
export function isHiddenByTerrain(groundHeightAt, camera, target) {
  if (!groundHeightAt) return false;
  const { x: cx, y: cy, z: cz } = camera.position;
  const dx = target.x - cx;
  const dy = target.y - cy;
  const dz = target.z - cz;
  const steps = Math.min(OCCLUSION_MAX_STEPS, Math.max(4, Math.round(Math.hypot(dx, dz) / OCCLUSION_STEP_M)));
  // Skips t=0 and t=1: at the camera end the ground is right under our feet
  // and at the label end it sits above the ground by construction, so both
  // ends would only ever produce false positives.
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (groundHeightAt(cx + dx * t, cz + dz * t) > cy + dy * t + OCCLUSION_MARGIN_M) return true;
  }
  return false;
}
