import * as THREE from 'three';

// Aerial-perspective fog model, adapted from ode-to-yosemite's atmosphere.js
// (docs/PROGRESS.md - same "read the reference's real code" approach used
// for water.js's waterfall ribbons). Replaces three.js's flat linear fog
// with:
//   - exponential distance haze (cliffs/ridges recede in layers)
//   - a grounded valley-fog slab, integrated along the view ray, so it pools
//     on the valley floor and thins with altitude (world Y is real elevation
//     in meters here, per docs/ARCHITECTURE.md §6, so "ASL height" is just Y)
//   - sun-direction inscatter, so haze glows warm near the sun at golden hour
//
// lighting.js/weather.js write ATMO.uniforms once per frame; every patched
// material picks them up automatically via the global ShaderChunk override
// below. fogColor itself stays renderer-managed via scene.fog.color.
//
// Custom ShaderMaterials (src/water.js) are NOT reached by the ShaderChunk
// patch - three.js only auto-assembles built-in materials from these chunks.
// They need ATMO_FOG_PARS + atmoApply() included by hand, same as water.js
// already does for logarithmicDepthBuffer's chunks.
export const ATMO = {
  uniforms: {
    uAtmoSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uAtmoGlowColor: { value: new THREE.Color(0xffd9b0) },
    uAtmoGlow: { value: 0.15 },
    uAtmoHaze: { value: 0.000018 }, // our bbox is ~84x48km, ~2x ode-to-yosemite's scale - halved
    uAtmoValleyFog: { value: 0.0 },
    uAtmoFogTop: { value: 1400.0 }, // ASL - roughly the VDA valley-floor elevation band
    uAtmoRelight: { value: 0.0 }, // unused here - our terrain is real-lit (MeshStandardMaterial + a real sun light), not baked/tinted like the reference's satellite imagery
    uAtmoSnow: { value: 0.0 },
    uAtmoWet: { value: 0.0 },
    uAtmoFogColor: { value: new THREE.Color(0x9fc9e8) },
  },
};

export const ATMO_FOG_PARS = /* glsl */ `
  uniform vec3 uAtmoSunDir;
  uniform vec3 uAtmoGlowColor;
  uniform float uAtmoGlow;
  uniform float uAtmoHaze;
  uniform float uAtmoValleyFog;
  uniform float uAtmoFogTop;
  vec3 atmoApply(vec3 color, vec3 fogCol, vec3 worldPos, vec3 camPos) {
    vec3 v = worldPos - camPos;
    float dist = length(v);
    vec3 dir = v / max(dist, 1.0);
    float f = 1.0 - exp(-dist * uAtmoHaze);
    if (uAtmoValleyFog > 1e-7) {
      float k = 0.016;
      float dy = abs(dir.y) < 0.01 ? (dir.y < 0.0 ? -0.01 : 0.01) : dir.y;
      float od = uAtmoValleyFog * exp(-(camPos.y - uAtmoFogTop) * k)
               * (1.0 - exp(-dist * dy * k)) / (dy * k);
      f = 1.0 - (1.0 - f) * exp(-clamp(od, 0.0, 6.0));
    }
    float sunAmt = pow(clamp(dot(dir, uAtmoSunDir), 0.0, 1.0), 10.0);
    vec3 haze = fogCol + uAtmoGlowColor * (sunAmt * uAtmoGlow);
    return mix(color, haze, clamp(f, 0.0, 1.0));
  }
`;

let installed = false;
// Must run before any material compiles its shader program (main.js calls
// this first, mirroring the reference).
export function installAtmosphere() {
  if (installed) return;
  installed = true;

  THREE.ShaderChunk.fog_pars_vertex = /* glsl */ `
    #ifdef USE_FOG
      varying vec3 vAtmoPos;
    #endif
  `;
  // 'transformed' exists in every Mesh vertex shader (begin_vertex) and in
  // three's line shaders (ShaderLib.linebasic/linedashed also run
  // begin_vertex) - verified by building and checking for GLSL compile
  // errors, since a missing 'transformed' would be a loud, visible error
  // here (unlike the silent logarithmicDepthBuffer failure in water.js).
  THREE.ShaderChunk.fog_vertex = /* glsl */ `
    #ifdef USE_FOG
      #ifdef USE_INSTANCING
        vAtmoPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
      #else
        vAtmoPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
      #endif
    #endif
  `;
  THREE.ShaderChunk.fog_pars_fragment = /* glsl */ `
    #ifdef USE_FOG
      uniform vec3 fogColor;
      varying vec3 vAtmoPos;
      ${ATMO_FOG_PARS}
    #endif
  `;
  THREE.ShaderChunk.fog_fragment = /* glsl */ `
    #ifdef USE_FOG
      gl_FragColor.rgb = atmoApply(gl_FragColor.rgb, fogColor, vAtmoPos, cameraPosition);
    #endif
  `;
}

// Attach the shared ATMO uniforms to a built-in material (preserving any
// existing onBeforeCompile hook, e.g. terrain.js's displacement patch).
export function attachAtmo(material) {
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    prev?.(shader, renderer);
    Object.assign(shader.uniforms, ATMO.uniforms);
  };
  return material;
}
