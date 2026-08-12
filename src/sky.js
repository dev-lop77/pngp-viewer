import { Sky } from 'three/addons/objects/Sky.js';

// The air column above the camera, as a function of how high the camera is.
//
// WHAT THIS IS NOT: src/atmosphere.js owns the air BETWEEN the camera and the
// terrain - distance haze, the valley-fog slab, sun inscatter. This file owns the
// air ABOVE the camera, which is what colours the sky dome. Same physics, two
// different integrals, and they are separate modules for the same reason snow.js
// is separate from weather.js: one of them answers "how far can I see", the other
// answers "what colour is up".
//
// The three.js Sky addon is the Preetham analytic daylight model, and it already
// contains the whole mechanism - including, as plain constants, the two numbers
// this needs:
//
//   const float rayleighZenithLength = 8.4E3;   // Sky.js, fragment shader
//   const float mieZenithLength      = 1.25E3;
//
// Those are the optical path lengths at the zenith. For an atmosphere whose
// density falls off exponentially, the zenith column integral is exactly
// (sea-level coefficient) x (scale height), so those two lengths ARE the scale
// heights: 8.4 km for air, 1.25 km for aerosol. Standing at height h the column
// left above you is the same thing times exp(-h/H) - and H is the constant
// itself. So nothing has to be invented or tuned to make the sky altitude-aware:
//
//   L(h) = L0 * exp(-(h - ref) / L0)
//
// The two terms fall off at very different rates: from the Le Pont spawn to the
// summit of Gran Paradiso the air column drops 22% while the aerosol column drops
// to 18% of itself.
//
// WHICH OF THE TWO ACTUALLY SHOWS IS NOT THE ONE YOU WOULD EXPECT, AND IT WAS
// MEASURED RATHER THAN ASSUMED (tools/dev/probe-sky.mjs). The reasoning that
// leads here is that high skies are deep because the whitening aerosol has gone,
// so the Mie collapse should be the dramatic half. In THIS project's presets it is
// very nearly irrelevant, because the aerosol load is already tiny: at the Midday
// preset (turbidity 4, mieCoefficient 0.004) the Mie term is 1.1% of the blue
// channel's zenith optical depth and 2.6% of the red's, against Rayleigh's 0.635
// and 0.122. Removing 88% of ~1% buys nothing. Altitude also does not enter the
// in-scattering ratio at all - (betaRTheta + betaMTheta) / (betaR + betaM) has no
// path length in it - so Fex is the only door, and Rayleigh owns it.
//
// So the effect here is a Rayleigh effect: a darker, more saturated zenith. If the
// "haze burns off as you climb" reading is ever wanted too, the lever is not this
// file - it is a HIGHER turbidity low down in lighting.js's presets, which is a
// palette decision.
//
// The effect is naturally strongest at the ZENITH and near-nil at the HORIZON,
// because a horizon ray's slant path stays long whatever height you start from
// (the shader's own `inverse` air-mass term). Measured, spawn -> summit: zenith
// luma x0.884, horizon (5 deg) x0.992. That is why this can touch only the dome
// and still be self-consistent - the per-preset fog colour was tuned against the
// HORIZON sky, and the horizon sky is what does not move.
//
// One more thing the measurement settled, and it caps how much of this can ever
// show: the sky is graded by ACES plus toneMappingExposure, and ACES desaturates
// hard. In LINEAR light the zenith at the spawn is 0.200/0.647/1.679 - a properly
// deep blue, B/R 8.4. What reaches the screen is B/R 1.56. A 27% linear drop
// arrives as 12% on screen. The altitude term is therefore working against the
// grade, and the grade wins most of it.

// Measured, not chosen: window.__pngp.camera.position.y at the default Le Pont
// spawn is 1954.6 m. It is the reference because it is where every time-of-day
// preset (lighting.js PRESETS) was judged by eye and approved. Applying the
// physics in absolute terms instead would darken the sky AT THE SPAWN TOO and
// reopen five presets that are closed; this way the approved look holds exactly
// where it was approved, and only the departure from it shows.
export const SKY_REF_ALTITUDE_M = 1950;

// A guard, not a taste knob. Fly mode has no altitude cap at all (controls.js
// only adds/subtracts on Space/C), and Preetham is a fit for a GROUND observer -
// scaling its zenith lengths is the standard cheap way to fake altitude and is
// only approximately right. Past a few km above the highest summit we are well
// outside the model's domain, so the extrapolation is stopped rather than
// followed into a black daytime sky.
export const SKY_ALT_MIN_M = 0;
export const SKY_ALT_MAX_M = 9000;

// 1 = the physics exactly. It multiplies the exponent, so 2 means "behave as if
// the atmosphere thinned twice as fast per metre climbed", which is a deliberate
// lie and should stay a deliberate one.
//
// A holder rather than a plain number for the same reason BASEMAP_GAIN is one: the
// only honest way to choose it is to sweep it from ONE camera in ONE session and
// look at the results side by side, and that needs something a probe can drive
// (tools/dev/probe-sky.mjs --sweep). Published on window.__pngp.sky.strength.
//
// IT APPLIES ONLY ABOVE THE REFERENCE, and that asymmetry was measured into
// existence rather than chosen. The exponent is symmetric by nature, so any
// exaggeration of the climb is an equal exaggeration of the descent - and the
// descent is where it does damage. Rendered zenith, strength 1 -> 3:
//
//   summit  4061 m   luma 0.654 -> 0.461,  B/R 1.87 -> 3.17   (the wanted effect)
//   valley  1200 m   luma 0.769 -> 0.821,  B/R 1.47 -> 1.32   (a whiter, flatter sky)
//
// At strength 6 the valley reads luma 0.902 / B/R 1.14, i.e. very nearly white.
// Below the reference the physics is honest and mild on its own and needs no help,
// so it keeps strength 1 and only the climb is dialled.
export const SKY_ALTITUDE_STRENGTH = { value: 1 };

// Lets a probe or a test pin the altitude independently of where the camera
// actually is, so two altitudes can be compared from ONE camera in ONE session -
// the only honest A/B here, since two runs differ in animals, birds and gust
// (docs/PROGRESS.md 2026-08-10). Published on window.__pngp.sky as this very
// object: anything pinning it must pin THIS holder, never one it imported for
// itself, or Vite's HMR hands it a second module instance and the pin does
// nothing while reading back the value it just wrote (docs/PROGRESS.md
// 2026-08-11). null = follow the camera.
export const SKY_ALTITUDE_OVERRIDE = { value: null };

// Filled in by installSkyAltitude() FROM THE SHADER, so there is one source of
// truth for each scale height instead of the same number written down twice and
// free to drift apart.
let baseLengths = null;
// The same thing as an array of [uniformName, L0], built once so the per-frame
// update can iterate it without allocating.
let writePlan = null;

const PATCHES = [
  { name: 'rayleighZenithLength', expect: 8400, tol: 0.2 },
  { name: 'mieZenithLength', expect: 1250, tol: 0.2 },
];

let installed = false;

// Turns the two zenith-length constants into uniforms. MUST be called before any
// `new Sky()`, because the constructor clones Sky.SkyShader.uniforms - a uniform
// added afterwards would never reach the material.
//
// Throws on anything unexpected, and that is the point. A silent no-match here
// would leave the sky permanently at its sea-level column and look exactly like
// "the altitude effect is too weak to see" - the same shape of failure as
// onBeforeCompile running on a material that was never used, or
// logarithmicDepthBuffer's chunks quietly missing from a ShaderMaterial. This
// project has already shipped one silent misreading of a data file; a shader
// patch that misses is the same class of bug, so it fails loudly instead.
export function installSkyAltitude() {
  if (installed) return baseLengths;
  const shader = Sky.SkyShader;
  const found = {};

  for (const { name, expect, tol } of PATCHES) {
    const re = new RegExp(`const\\s+float\\s+${name}\\s*=\\s*([^;]+);`);
    const m = shader.fragmentShader.match(re);
    if (!m) {
      throw new Error(
        `src/sky.js: could not find "const float ${name}" in three's Sky shader. `
        + `The addon has been reformatted or renamed by a three.js upgrade, and the `
        + `altitude patch would silently do nothing - which looks identical to a `
        + `weak effect. Re-read node_modules/three/examples/jsm/objects/Sky.js.`,
      );
    }
    const value = Number.parseFloat(m[1]);
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`src/sky.js: ${name} parsed as ${m[1]}, which is not a usable length.`);
    }
    // This module's whole argument is that the constant IS the scale height (see
    // the header). If a three.js upgrade retunes it, the identification may no
    // longer hold and the exponent would be wrong in a way nothing else would
    // report - so the assumption is asserted rather than trusted.
    if (Math.abs(value - expect) > expect * tol) {
      throw new Error(
        `src/sky.js: ${name} is ${value} m, but this module assumes ~${expect} m `
        + `(the atmospheric scale height it stands for). Re-derive the exponent before `
        + `changing this check - see the header.`,
      );
    }
    found[name] = value;
    shader.fragmentShader = shader.fragmentShader.replace(re, `uniform float ${name};`);
    shader.uniforms[name] = { value };
  }

  installed = true;
  baseLengths = found;
  writePlan = Object.entries(found);
  return baseLengths;
}

// Height above the reference, clamped, with the strength applied to the climb
// only. The one place the model lives, so the per-frame path and the test path
// cannot drift.
function effectiveRise(altitudeM) {
  const h = Math.min(SKY_ALT_MAX_M, Math.max(SKY_ALT_MIN_M, altitudeM)) - SKY_REF_ALTITUDE_M;
  // Only the climb is exaggerated - see SKY_ALTITUDE_STRENGTH for the readings that
  // forced this. Descending stays at the honest exponent.
  return h * (h > 0 ? SKY_ALTITUDE_STRENGTH.value : 1);
}

// The two zenith lengths for an observer at altitudeM, as a fresh object. Exported
// so a test can bracket a rendered pixel against the same numbers the shader was
// given, without re-deriving the model on the test side. Allocates, so it is NOT
// what the render loop calls - see updateSkyAltitude.
export function skyAltitudeLengths(altitudeM) {
  if (!baseLengths) throw new Error('src/sky.js: installSkyAltitude() has not run yet.');
  const rise = effectiveRise(altitudeM);
  const out = {};
  for (const [name, L0] of Object.entries(baseLengths)) {
    out[name] = L0 * Math.exp(-rise / L0);
  }
  return out;
}

// Called once per frame from main.js's loop, so it allocates nothing: it walks a
// list built once at install time and writes the uniforms in place, instead of
// building an object and iterating its entries. Staying generic over `baseLengths`
// rather than naming the two uniforms here means adding a third term is one entry
// in PATCHES and nothing else. The shader cost is nil either way - it multiplies by
// a uniform where it used to multiply by a constant.
export function updateSkyAltitude(sky, cameraAltitudeM) {
  if (!writePlan) throw new Error('src/sky.js: installSkyAltitude() has not run yet.');
  const rise = effectiveRise(SKY_ALTITUDE_OVERRIDE.value ?? cameraAltitudeM);
  const u = sky.material.uniforms;
  for (let i = 0; i < writePlan.length; i++) {
    const [name, L0] = writePlan[i];
    u[name].value = L0 * Math.exp(-rise / L0);
  }
}
