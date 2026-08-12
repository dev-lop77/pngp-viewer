import * as THREE from 'three';
import { ATMO, ATMO_FOG_PARS } from './atmosphere.js';

// Weather, layered on top of lighting.js's time-of-day state - adapted from
// ode-to-yosemite's weather.js (docs/PROGRESS.md). A mode is a set of
// grading numbers (cloud cover, haze multiplier, grey-out, exposure...)
// lighting.js composes with the active preset every frame, plus
// precipitation. Procedural: an FBM cloud deck on one big plane sized to
// our terrain's real bbox (not Yosemite's - see loadWeather below), and one
// GPU-wrapped particle cloud that serves as rain or snow (positions live
// entirely in the vertex shader - zero per-frame CPU work).
const MODES = [
  {
    key: 'clear', label: 'Clear skies',
    cover: 0.12, dark: 0.06, hazeMul: 1, vfAdd: 0, exposureMul: 1, grey: 0,
    glowMul: 1, starsMul: 1, snow: 0, wet: 0, rain: 0, wind: 0.3,
  },
  {
    key: 'clouds', label: 'Drifting clouds',
    cover: 0.52, dark: 0.26, hazeMul: 1.35, vfAdd: 0, exposureMul: 0.95, grey: 0.22,
    glowMul: 0.6, starsMul: 0.3, snow: 0, wet: 0, rain: 0, wind: 0.55,
  },
  {
    key: 'storm', label: 'Rainstorm',
    cover: 1.0, dark: 0.62, hazeMul: 3.2, vfAdd: 1.0e-4, exposureMul: 0.76, grey: 0.78,
    glowMul: 0, starsMul: 0, snow: 0, wet: 1, rain: 1, wind: 1.0,
  },
  {
    key: 'snow', label: 'Snowfall',
    cover: 0.95, dark: 0.3, hazeMul: 2.4, vfAdd: 0.7e-4, exposureMul: 0.9, grey: 0.6,
    glowMul: 0.05, starsMul: 0, snow: 1, wet: 0, rain: 0, wind: 0.7,
  },
];

// Exported for src/viewstate.js: a saved state and a shareable link store the
// weather by KEY, not by index - an index would silently mean something else if
// MODES were ever reordered, and a link is meant to outlive that.
export const WEATHER_KEYS = MODES.map((m) => m.key);

// `wind` joined this list on 2026-08-12, when src/groundcover.js needed something
// to bend the grass with and found that the weather had no wind at all: audio.js
// had been deriving its own from altitude, exposure and a private gust walk, which
// is fine for a hiss but is not a number anything else can read - and reading it
// would have tied the visuals to whether the sound is switched on. So the state
// lives here now, with the rest of the weather, and it is 0..1: how hard it is
// blowing before altitude and exposure scale it.
const LERP_KEYS = ['cover', 'dark', 'hazeMul', 'vfAdd', 'exposureMul', 'grey', 'glowMul', 'starsMul', 'wet', 'rain', 'wind'];
// Time constants of the lying-snow accumulator, seconds. See update().
const SNOW_BUILD_TAU_S = 6;
const SNOW_MELT_TAU_S = 12;
const WHITE = new THREE.Color(1, 1, 1);

export class Weather {
  constructor(scene, { worldWidth, worldDepth }) {
    this.index = 0;
    this.mod = { ...MODES[0], snow: 0, snowFall: 0 };
    this.from = { ...this.mod };
    this.to = MODES[0];
    this.t = 1;
    this.time = { value: 0 };
    this._snowAccum = 0;

    this.clouds = makeCloudDeck(this.time, worldWidth, worldDepth);
    scene.add(this.clouds);
    this.precip = makePrecip(this.time);
    scene.add(this.precip);
  }

  get current() { return MODES[this.index].key; }
  get label() { return MODES[this.index].label; }

  set(index) {
    this.index = ((index % MODES.length) + MODES.length) % MODES.length;
    this.from = { ...this.mod };
    this.to = MODES[this.index];
    this.t = 0;
    return MODES[this.index].label;
  }

  cycle() { return this.set(this.index + 1); }

  update(dt, camera) {
    this.time.value += dt;
    if (this.t < 1) {
      this.t = Math.min(1, this.t + dt / 4);
      const f = this.t * this.t * (3 - 2 * this.t); // smoothstep
      for (const k of LERP_KEYS) this.mod[k] = this.from[k] + (this.to[k] - this.from[k]) * f;
      this.mod.snowFall = this.from.snowFall + (this.to.snow - this.from.snowFall) * f;
    }
    // Snow blankets the ground slower than the flakes fall, and melts slower
    // still - asymmetric on purpose (2026-08-11, with src/snow.js). Snow arrives
    // in hours and goes in days, and the two constants are what make that
    // readable at this timescale: it settles over ~18 s and takes ~36 s to go.
    // Since where it lies is now altitude- and aspect-dependent, the melt is not
    // a uniform fade any more but a snowline RISING back up the mountain, so the
    // valley clears in about 10 s while the high north faces are still white half
    // a minute later - which is the phenomenon the user asked for.
    const tau = this.to.snow > this._snowAccum ? SNOW_BUILD_TAU_S : SNOW_MELT_TAU_S;
    this._snowAccum += (this.to.snow - this._snowAccum) * (1 - Math.exp(-dt / tau));
    this.mod.snow = this._snowAccum;

    const cu = this.clouds.material.uniforms;
    cu.uCover.value = this.mod.cover;
    cu.uDark.value = this.mod.dark;

    const pu = this.precip.material.uniforms;
    const intensity = Math.max(this.mod.rain, this.mod.snowFall);
    pu.uIntensity.value = intensity;
    pu.uSnowMix.value = this.mod.snowFall / Math.max(this.mod.rain + this.mod.snowFall, 1e-4);
    this.precip.visible = intensity > 0.02;
    if (camera) this.precip.position.copy(camera.position); // particles wrap in a box around the camera
  }

  // called by lighting.applyState with the weather-graded fog color
  applyLight(fogColor) {
    const cu = this.clouds.material.uniforms;
    cu.uLight.value.copy(fogColor).lerp(WHITE, 0.55).multiplyScalar(1 - this.mod.dark * 0.2);
    cu.uShade.value.copy(fogColor).multiplyScalar(0.52 - this.mod.dark * 0.22);
    this.precip.material.uniforms.uColor.value.copy(fogColor).lerp(WHITE, 0.45);
  }
}

// One big plane roughly matching the terrain's real bbox, at ~4600m ASL -
// near/above most peaks but not all (Gran Paradiso 4061m, Mont Blanc's
// flank at the bbox edge reaches ~4810m) - clouds occasionally piercing the
// very highest summits is a real, intentional Alpine look, not a bug (the
// reference project made the same call for Yosemite's peaks). FBM noise
// gives cumulus blobs at partial cover and a solid grey ceiling at full
// cover. Distant clouds melt into the haze via the shared atmosphere model.
function makeCloudDeck(time, worldWidth, worldDepth) {
  const halfW = worldWidth / 2;
  const halfD = worldDepth / 2;
  const geo = new THREE.PlaneGeometry(worldWidth * 1.3, worldDepth * 1.3);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: time,
      uCover: { value: 0.12 },
      uDark: { value: 0.06 },
      uLight: { value: new THREE.Color(1, 1, 1) },
      uShade: { value: new THREE.Color(0.6, 0.62, 0.66) },
      uHalfExtent: { value: new THREE.Vector2(halfW, halfD) },
      ...ATMO.uniforms,
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime, uCover, uDark;
      uniform vec3 uLight, uShade, uAtmoFogColor;
      uniform vec2 uHalfExtent;
      varying vec3 vWorld;
      ${ATMO_FOG_PARS}

      float chash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float cnoise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(chash(i), chash(i + vec2(1, 0)), f.x),
                   mix(chash(i + vec2(0, 1)), chash(i + vec2(1, 1)), f.x), f.y);
      }
      float fbm(vec2 p) {
        float v = 0.0, a = 0.5, s = 0.0;
        for (int i = 0; i < 6; i++) {
          v += a * cnoise(p);
          s += a;
          p = p * 2.02 + 19.1;
          a *= 0.55;
        }
        return v / s;
      }

      void main() {
        vec2 q = vWorld.xz * 1.05e-4 + vec2(uTime * 0.0021, uTime * 0.0012);
        vec2 warp = vec2(cnoise(q * 2.6 + 4.7), cnoise(q * 2.2 + 9.3)) - 0.5;
        float n = fbm(q + warp * 0.45);
        float th = mix(0.74, 0.07, uCover);
        float body = smoothstep(th, th + 0.18, n);
        float wisp = smoothstep(th - 0.12, th + 0.3, n) * 0.35;
        float a = max(body, wisp);
        if (a < 0.01) discard;
        float depth = smoothstep(th, th + 0.45, n);
        vec3 col = mix(uLight, uShade, depth * (0.5 + uDark * 0.5));
        col = atmoApply(col, uAtmoFogColor, vWorld, cameraPosition);
        vec2 e = abs(vWorld.xz) / (uHalfExtent * 0.94);
        float edge = 1.0 - smoothstep(0.72, 1.0, max(e.x, e.y));
        gl_FragColor = vec4(col, min(a, 0.96) * edge);
      }
    `,
  });
  mat.toneMapped = false;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 4600;
  mesh.renderOrder = 1;
  mesh.frustumCulled = false;
  return mesh;
}

// 6000 particles wrapped in a 120 m box around the camera. The same cloud is
// rain (fast, streak sprite) or snow (slow, fluttering disc) via uSnowMix.
function makePrecip(time) {
  const N = 6000;
  const rand = new Float32Array(N * 4);
  for (let i = 0; i < rand.length; i++) rand[i] = Math.random();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3)); // unused, required
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: time,
      uSnowMix: { value: 0 },
      uIntensity: { value: 0 },
      uColor: { value: new THREE.Color(0.8, 0.85, 0.9) },
      uTexRain: { value: makeStreakTexture() },
      uTexSnow: { value: makeFlakeTexture() },
    },
    vertexShader: /* glsl */ `
      attribute vec4 aRand;
      uniform float uTime, uSnowMix, uIntensity;
      varying float vFade;
      void main() {
        vec3 box = vec3(120.0, 80.0, 120.0);
        float fall = mix(14.0, 1.7, uSnowMix);
        vec3 off = vec3(
          uTime * 1.3 + uSnowMix * sin(uTime * 0.8 + aRand.w * 6.283) * 5.0,
          -fall * uTime * (0.8 + 0.4 * aRand.w),
          uTime * 0.6 + uSnowMix * cos(uTime * 0.66 + aRand.w * 6.283) * 5.0
        );
        vec3 local = mod(aRand.xyz * box + off, box) - 0.5 * box;
        vec4 mv = viewMatrix * vec4(cameraPosition + local, 1.0);
        gl_Position = projectionMatrix * mv;
        float d = max(-mv.z, 3.0);
        gl_PointSize = clamp(mix(0.55, 0.12, uSnowMix) * (1.0 + aRand.w * 0.6) * 640.0 / d, 1.0, 42.0);
        vFade = (1.0 - smoothstep(0.7, 1.0, length(local.xz) / 60.0)) * uIntensity * smoothstep(2.0, 7.0, d);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uSnowMix;
      uniform vec3 uColor;
      uniform sampler2D uTexRain, uTexSnow;
      varying float vFade;
      void main() {
        vec4 t = mix(texture2D(uTexRain, gl_PointCoord), texture2D(uTexSnow, gl_PointCoord), uSnowMix);
        float a = t.a * vFade * mix(0.34, 0.85, uSnowMix);
        if (a < 0.01) discard;
        gl_FragColor = vec4(uColor, a);
      }
    `,
  });
  mat.toneMapped = false;
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = 4;
  points.visible = false;
  return points;
}

function makeStreakTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 32);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.9)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(13, 0, 6, 32);
  return new THREE.CanvasTexture(c);
}

function makeFlakeTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 15);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.7)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}
