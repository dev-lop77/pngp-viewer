import * as THREE from 'three';
import { ATMO } from './atmosphere.js';

// Time-of-day, adapted from ode-to-yosemite's lighting.js (docs/PROGRESS.md).
// The reference's terrain is unlit (sun shading baked into satellite
// imagery), so its preset applies a multiplicative "tint" hack and a
// separate slope-relighting term. Ours doesn't need either: terrain.js /
// water.js's glaciers use a real MeshStandardMaterial lit by a real
// THREE.DirectionalLight + AmbientLight (main.js), so moving/recoloring
// those two lights per preset gives correct real shading for free. What we
// DO keep from the reference: the Sky addon, exposure/tone-mapping, stars,
// and the ATMO (haze/valley-fog/glow) uniforms driving the aerial-
// perspective fog patch (atmosphere.js).
//
// Two direction vectors per preset, same reason as the reference:
//   sun   - the Sky dome's actual sun position; can dip below the horizon
//           at night (Sky renders that as dark sky, correct).
//   light - direction for our real DirectionalLight + the glow/inscatter
//           term; defaults to `sun` whenever it's above the horizon, but
//           substitutes a moon-like elevated angle at night so the terrain
//           still gets real directional shading instead of light from
//           below the ground.
const PRESETS = [
  {
    key: 'dawn', label: 'Dawn',
    sunElev: 6, sunAzim: 95, turbidity: 7, rayleigh: 2.6, mieC: 0.006, mieG: 0.86,
    exposure: 0.95, fog: 0xe3c4a8, stars: 0.25,
    haze: 1.6e-5, valleyFog: 0.85, fogTop: 1100, glow: 0.5, glowColor: 0xffb678,
    sunColor: 0xffdfc4, sunIntensity: 1.0, ambientColor: 0x8fa0c9, ambientIntensity: 0.35,
  },
  {
    key: 'day', label: 'Midday',
    // rayleigh 2.5 -> 1.6 on 2026-08-12, at the user's choice from a measured sweep
    // (tools/dev/probe-sky.mjs --rayleigh, and the four sky-ray*.png frames they
    // picked from). Two things it buys, and one it costs:
    //
    //   the zenith stops being white-blue      B/R 1.52 -> 2.19
    //   the altitude term becomes visible      spawn->Nivolet B/R +0.08 -> +0.19
    //   the sky/haze step at the far skyline   0.11 -> 0.21 of red
    //
    // The second is the real reason. The sky is over-exposed at exposure 0.75 - in
    // linear light the zenith is 0.200/0.647/1.679, so the blue channel sits deep in
    // ACES's compression shoulder where everything desaturates toward white, and a
    // 27% linear change arrives as 12% on screen. Lowering rayleigh moves the sky
    // down the curve, and the SAME physics in src/sky.js then has room to show.
    //
    // The cost is real and was measured rather than waved away: unlike sky.js's
    // altitude term (which is zenith-weighted, horizon x0.992) this deepens the
    // WHOLE dome, so the horizon sky pulls away from the fog colour - which is a
    // separate preset field, deliberately left as approved. The step was already
    // there and this doubles it; it lives in a thin band past ~20 km, where the haze
    // is strong enough to matter.
    //
    // Only this preset moved. Dawn, Golden hour and Dusk are meant to be warm and
    // hazy, and a deep blue is a high-sun phenomenon.
    sunElev: 25, sunAzim: 155, turbidity: 4, rayleigh: 1.6, mieC: 0.004, mieG: 0.85,
    // The Sky addon's Preetham model turns out to be extremely sensitive to
    // sun elevation in this three.js version - even the reference project's
    // own exact midday numbers (sunElev 38, turbidity 6, exposure .62)
    // clipped to flat white here (verified by sampling actual rendered
    // pixel colors, not just eyeballing screenshots - see docs/PROGRESS.md).
    // Settled for a lower elevation that stays in a well-behaved range
    // instead of chasing exposure/turbidity values that couldn't
    // compensate. Flagged for a real-browser look, since this could
    // plausibly also be a SwiftShader (headless/software GL) precision
    // artifact in a shader this full of exp()/pow() - not yet confirmed
    // either way on real hardware.
    exposure: 0.75, fog: 0xcfdcec, stars: 0,
    haze: 1.1e-5, valleyFog: 0, fogTop: 1100, glow: 0.08, glowColor: 0xfff0d8,
    sunColor: 0xffffff, sunIntensity: 1.8, ambientColor: 0xffffff, ambientIntensity: 0.6,
  },
  {
    key: 'golden', label: 'Golden hour',
    sunElev: 11, sunAzim: 262, turbidity: 4.5, rayleigh: 3.2, mieC: 0.006, mieG: 0.88,
    exposure: 0.95, fog: 0xeccfa6, stars: 0,
    haze: 1.5e-5, valleyFog: 0.12, fogTop: 1100, glow: 0.7, glowColor: 0xffa057,
    sunColor: 0xffb877, sunIntensity: 1.1, ambientColor: 0xffceac, ambientIntensity: 0.4,
  },
  {
    key: 'dusk', label: 'Dusk',
    sunElev: 1.5, sunAzim: 285, turbidity: 5, rayleigh: 3.8, mieC: 0.009, mieG: 0.9,
    exposure: 0.75, fog: 0x9088a8, stars: 0.55,
    haze: 1.4e-5, valleyFog: 0.2, fogTop: 1100, glow: 0.3, glowColor: 0xde8660,
    sunColor: 0x9a8fc9, sunIntensity: 0.45, ambientColor: 0x5a6a99, ambientIntensity: 0.3,
  },
  {
    key: 'night', label: 'Night',
    sunElev: -10, sunAzim: 0, turbidity: 2, rayleigh: 0.6, mieC: 0.002, mieG: 0.8,
    exposure: 0.55, fog: 0x0e131f, stars: 1,
    haze: 0.8e-5, valleyFog: 0.12, fogTop: 1100, glow: 0.05, glowColor: 0x9db4dd,
    sunColor: 0x8fa4dd, sunIntensity: 0.18, ambientColor: 0x33406b, ambientIntensity: 0.15,
    lightElev: 38, lightAzim: 215, // moonlight
  },
];

const NUMERIC_KEYS = ['turbidity', 'rayleigh', 'mieC', 'mieG', 'exposure', 'stars',
  'haze', 'valleyFog', 'fogTop', 'glow', 'sunIntensity', 'ambientIntensity'];

const SUN_DISTANCE = 50000; // arbitrary - only direction from target (origin) matters for a DirectionalLight

const NEUTRAL_MOD = { cover: 0.12, dark: 0.06, hazeMul: 1, vfAdd: 0, exposureMul: 1, grey: 0, glowMul: 1, starsMul: 1 };

// A global multiplier on the distance haze, for judging "how much air" the view
// has - the DEPTH half of the aerial-perspective request (docs/PROGRESS.md).
// It exists as a holder rather than as a number to edit because uAtmoHaze is
// REWRITTEN EVERY FRAME from the time-of-day preset below (`s.haze * m.hazeMul`),
// so pinning the uniform from outside reads back exactly the value it just wrote
// and changes nothing on screen - the same trap as GROUNDCOVER_WIND and
// SNOW_LEVEL (docs/ARCHITECTURE.md §13.10, tools/dev/probe-groundcover.mjs).
// Published on window.__pngp.atmo.hazeScale, and 1.0 is the shipped look.
export const HAZE_SCALE = { value: 1 };

function dir(elev, azim) {
  return new THREE.Vector3().setFromSphericalCoords(
    1, THREE.MathUtils.degToRad(90 - elev), THREE.MathUtils.degToRad(azim),
  );
}

function paramsFor(p) {
  return {
    sun: dir(p.sunElev, p.sunAzim),
    light: dir(p.lightElev ?? Math.max(p.sunElev, 4), p.lightAzim ?? p.sunAzim),
    fogColor: new THREE.Color(p.fog),
    glowColor: new THREE.Color(p.glowColor),
    sunColor: new THREE.Color(p.sunColor),
    ambientColor: new THREE.Color(p.ambientColor),
    turbidity: p.turbidity, rayleigh: p.rayleigh, mieC: p.mieC, mieG: p.mieG,
    exposure: p.exposure, stars: p.stars, haze: p.haze, valleyFog: p.valleyFog,
    fogTop: p.fogTop, glow: p.glow, sunIntensity: p.sunIntensity, ambientIntensity: p.ambientIntensity,
  };
}

function lerpState(a, b, f, out) {
  out.sun.copy(a.sun).lerp(b.sun, f).normalize();
  out.light.copy(a.light).lerp(b.light, f).normalize();
  out.fogColor.copy(a.fogColor).lerp(b.fogColor, f);
  out.glowColor.copy(a.glowColor).lerp(b.glowColor, f);
  out.sunColor.copy(a.sunColor).lerp(b.sunColor, f);
  out.ambientColor.copy(a.ambientColor).lerp(b.ambientColor, f);
  for (const k of NUMERIC_KEYS) out[k] = a[k] + (b[k] - a[k]) * f;
}

export class Lighting {
  constructor({ renderer, scene, sky, sunLight, ambientLight }) {
    this.renderer = renderer;
    this.scene = scene;
    this.sky = sky;
    this.sunLight = sunLight;
    this.ambientLight = ambientLight;
    this.weather = null; // wired up by main.js after Weather is created

    this.stars = makeStars();
    scene.add(this.stars);

    this._effFog = new THREE.Color();
    this._grey = new THREE.Color();
    this.fraction = 0.15; // initial position on the dawn->...->night cycle - mid-morning
    this.state = paramsFor(PRESETS[0]);
    this._a = paramsFor(PRESETS[0]);
    this._b = paramsFor(PRESETS[1]);
    this.setTime(this.fraction);
  }

  // fraction in [0, 1): position on the dawn -> day -> golden -> dusk ->
  // night -> (back to dawn) cycle. Instant, not animated - the slider drag
  // itself supplies the "animation".
  setTime(fraction) {
    this.fraction = ((fraction % 1) + 1) % 1;
    const n = PRESETS.length;
    const scaled = this.fraction * n;
    const i0 = Math.floor(scaled) % n;
    const i1 = (i0 + 1) % n;
    const f = scaled - Math.floor(scaled);
    Object.assign(this._a, paramsFor(PRESETS[i0]));
    Object.assign(this._b, paramsFor(PRESETS[i1]));
    lerpState(this._a, this._b, f, this.state);
    this.label = f < 0.5 ? PRESETS[i0].label : PRESETS[i1].label;
    // How much of the night preset is in the current blend - 1 at the night
    // preset itself, 0 at dusk and again at dawn, and whatever the lights are
    // actually mixing in between. src/audio.js's songbirds need "is it dark",
    // and the honest answer is the weight the lights themselves are using: a
    // second set of thresholds here would drift away from what is on screen.
    const nightIndex = PRESETS.findIndex((p) => p.key === 'night');
    this.night = (i0 === nightIndex ? 1 - f : 0) + (i1 === nightIndex ? f : 0);
    this.applyState();
  }

  // Re-applies the current lighting state, re-reading the latest weather
  // grading - called every frame so weather transitions (independent of the
  // time-of-day slider) keep grading smoothly even when fraction is static.
  applyState() {
    const s = this.state;
    const m = this.weather?.mod ?? NEUTRAL_MOD;

    const u = this.sky.material.uniforms;
    u.sunPosition.value.copy(s.sun);
    u.turbidity.value = s.turbidity;
    u.rayleigh.value = s.rayleigh;
    u.mieCoefficient.value = s.mieC;
    u.mieDirectionalG.value = s.mieG;
    u.cloudCoverage.value = m.cover;
    u.cloudDensity.value = 0.5;

    this.renderer.toneMappingExposure = s.exposure * m.exposureMul;

    const luma = (c) => c.r * 0.299 + c.g * 0.587 + c.b * 0.114;
    this._effFog.copy(s.fogColor).lerp(this._grey.setScalar(luma(s.fogColor) * 0.97), m.grey);
    this.scene.fog.color.copy(this._effFog);

    this.sunLight.position.copy(s.light).multiplyScalar(SUN_DISTANCE);
    this.sunLight.color.copy(s.sunColor);
    this.sunLight.intensity = s.sunIntensity * (1 - m.dark * 0.85);
    this.ambientLight.color.copy(s.ambientColor);
    this.ambientLight.intensity = s.ambientIntensity * (1 - m.dark * 0.5);

    const A = ATMO.uniforms;
    A.uAtmoSunDir.value.copy(s.light);
    A.uAtmoGlowColor.value.copy(s.glowColor);
    A.uAtmoGlow.value = s.glow * m.glowMul;
    A.uAtmoHaze.value = s.haze * m.hazeMul * HAZE_SCALE.value;
    A.uAtmoValleyFog.value = s.valleyFog * 3.2e-4 + m.vfAdd;
    A.uAtmoFogTop.value = s.fogTop;
    A.uAtmoSnow.value = m.snow ?? 0;
    A.uAtmoWet.value = m.wet ?? 0;
    A.uAtmoFogColor.value.copy(this._effFog);

    this.stars.material.opacity = s.stars * m.starsMul;
    this.stars.visible = this.stars.material.opacity > 0.01;

    this.weather?.applyLight(this._effFog);
  }
}

// Star dome with a faint Milky Way band, drawn additively beyond the fog -
// ported as-is from the reference, no dependency on our terrain/material setup.
function makeStars() {
  const R = 160000;
  const N = 3200;
  const positions = new Float32Array(N * 3);
  const colors = new Float32Array(N * 3);
  let i3 = 0;
  for (let i = 0; i < N; i++) {
    let v;
    if (i < N * 0.45) {
      const a = Math.random() * Math.PI * 2;
      const spread = (Math.random() - 0.5) * 0.5 * (Math.random() < 0.7 ? 1 : 2.5);
      v = new THREE.Vector3(Math.cos(a), spread, Math.sin(a)).normalize();
      v.applyAxisAngle(new THREE.Vector3(1, 0, 0), 1.0);
    } else {
      v = new THREE.Vector3(Math.random() * 2 - 1, Math.random(), Math.random() * 2 - 1).normalize();
    }
    if (v.y < 0.02) v.y = 0.02 + Math.random() * 0.1;
    v.normalize();
    positions[i3] = v.x * R;
    positions[i3 + 1] = v.y * R;
    positions[i3 + 2] = v.z * R;
    const m = 0.4 + Math.random() ** 3 * 0.6;
    const warm = Math.random();
    colors[i3] = m * (warm > 0.8 ? 1 : 0.85 + warm * 0.15);
    colors[i3 + 1] = m * 0.92;
    colors[i3 + 2] = m * (warm < 0.2 ? 1 : 0.9);
    i3 += 3;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 2.2,
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
    blending: THREE.AdditiveBlending,
  });
  mat.toneMapped = false;
  const stars = new THREE.Points(geo, mat);
  stars.visible = false;
  stars.frustumCulled = false;
  return stars;
}
