import * as THREE from 'three';

// The satellite ground texture (2026-08-11, the first of three optional extras
// the user opened after the roadmap closed). Built by
// tools/basemap-source/build-basemap.py from Copernicus Sentinel-2 L2A - read
// that script's header for the source, the licence and the scene choice.
//
// It is laid out on EXACTLY the heightfield's grid, like the canopy mask, so
// src/terrain.js samples it with the UV mapping it already has and no second
// projection exists anywhere in the runtime.
//
// WHAT THIS TEXTURE IS, and what it is not: it is an approximate ALBEDO map, not
// a picture. The illumination of the acquisition (8 August 2025, sun at azimuth
// 152.7 and elevation 58.0) has been divided back out at build time using this
// project's own DEM. That step is what makes it usable at all here, because
// terrain.js draws a lit surface whose sun moves with the time-of-day slider: a
// photograph draped on it would shade every north face twice, and at sunset the
// shadows inside the texture would still lie towards the south-east.
//
// The elevation bands, the OSM forest tint and the nival white that the ground
// used before this are NOT deleted - terrain.js keeps them and cross-fades on
// uBasemapMix, so a browser that never gets this file (or a run with the mix
// turned down) draws exactly what it drew before.

// Shared holders, bound into the terrain shader at compile time and filled in
// when the download lands - the same arrangement as forest.js's FOREST_MASK and
// snow.js's SNOW_LEVEL. A sampler uniform has to exist when the program links,
// so terrain.js can bind these without waiting for anything.
export const BASEMAP = { value: null };
// 0 = the procedural ground this project shipped through phase 7; 1 = the
// satellite albedo. Driven from main.js on load, and exposed on the dev handle so
// a probe can pin it (tools/test-basemap.mjs) and a look can be A/B'd.
export const BASEMAP_MIX = { value: 0 };
// Multiplies the sampled texel to reach albedo. It is FULL_SCALE from the
// manifest (the reflectance the byte range ends at) times BASEMAP_GAIN below.
export const BASEMAP_SCALE = { value: 0 };

// The calibration, and the reason it is a single measured number rather than a
// table: "albedo is not appearance" (see the warning in terrain.js). Physical
// surface reflectance is NOT what the colour literals in this project are - those
// were each solved backwards through three's Lambert BRDF, the lighting rig and
// the ACES curve so that the ground reaches an intended brightness on screen, and
// the user approved that brightness. Sentinel-2 hands us real reflectance
// instead, which is a different scale entirely: shipped raw it renders as a dark
// grey park.
//
// So the photo is brought onto the project's own scale by one gain, measured in
// the renderer rather than derived on paper: tools/dev/probe-basemap.mjs pins the
// mix at 0 and at 1 from the same camera in the same session and sweeps this
// number until the ground's mean luma agrees.
//
// It cannot agree everywhere, and the spread is the finding rather than an error
// in it. Per vantage the matching gain came out: valley floor at Le Pont 3.86,
// treeline at Rifugio Vittorio Emanuele 3.39, high meadow at the Nivolet ~4.6,
// and the two wide landscape views ~2.6. A photograph simply has more contrast
// between land covers than a function of altitude does - real conifer forest
// reflects 5-8% of the light and bright scree 35% - so no single number can put
// both ends where the band model had them. 3.4 is the mean of the five, which
// keeps the park's overall brightness where the user approved it and favours the
// near and middle ground, where the eye spends its time.
//
// The cost, measured: 9.1% of the park's pixels come out above albedo 1.0 and
// saturate. Almost all of it is glacier, which the nival band was already pushing
// as bright as this rig can reach (rgb 195 at albedo 1.0), so the loss is
// contrast within ice rather than anywhere with detail worth keeping.
const BASEMAP_GAIN = 3.4;
export { BASEMAP_GAIN };

// How much of the terrain's existing two-octave noise still modulates the
// ground once the photo is carrying the colour. Not zero, because at 20.5 m per
// texel the near field is a handful of texels wide and would otherwise be a flat
// wash; not large, because the photo's own structure is the point. It is a
// mean-1 multiplier, so it moves brightness around without changing the level.
const BASEMAP_DETAIL = 0.10;
export { BASEMAP_DETAIL };

// GLSL needs a decimal point (or an exponent) to read a literal as a float.
function glsl(n) {
  const s = n.toPrecision(12);
  return s.includes('.') || s.includes('e') ? s : `${s}.0`;
}

// Declares the uniforms and the sampler helper, injected into the terrain's
// fragment shader. A caller must bind uBasemap/uBasemapMix/uBasemapScale to the
// holders above and must not declare them again.
export function basemapGlsl() {
  return /* glsl */ `
    uniform sampler2D uBasemap;
    uniform float uBasemapMix;
    uniform float uBasemapScale;

    // Linear albedo from the satellite texture. The texture is tagged
    // SRGBColorSpace, so three has already undone the sRGB transfer the build
    // script applied and this sample is linear 0..1 of FULL_SCALE.
    //   uv      the terrain's own UV, identical to the canopy mask's
    //   detail  a mean-0 wobble, kept so the near field is not a flat wash
    vec3 basemapAlbedo( vec2 uv, float detail ) {
      vec3 photo = texture2D( uBasemap, uv ).rgb * uBasemapScale;
      return photo * ( 1.0 + detail * ${glsl(BASEMAP_DETAIL)} );
    }
  `;
}

// 1x1 mid-grey, so the sampler reads something valid before (and if) the real
// texture arrives. Deliberately not a null sampler: those warn on some drivers
// and read as undefined data on others. It is never actually visible, because
// uBasemapMix stays 0 until the load succeeds.
function placeholder() {
  const texture = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1);
  texture.needsUpdate = true;
  return texture;
}

BASEMAP.value = placeholder();

// Which level of the ground photograph this GPU can actually hold (schema 2, 2026-08-17).
//
// The imagery ships at two resolutions and the FINER one is the default, so unlike the
// terrain tier there is no control to turn it off - which means a texture the hardware
// cannot upload has no escape route. WebGL2 guarantees remarkably little here (the spec
// floor is 2048), desktop GPUs typically report 16384, and plenty of mobile hardware
// caps at 4096 or 8192. The 10.24 m level is 8192 wide: fine on this machine, which
// reports exactly 8192, and impossible on half the phones in the world.
//
// So the choice is the hardware's, made from its own reported limit. Coarsest-first
// order is the manifest's (the same convention heighttier.json uses), so walking it
// forwards and keeping the last level that fits lands on the finest affordable one.
//
// `renderer` is passed in rather than reached for: this module has no business knowing
// where the renderer lives, and a probe or a test may want to ask with a limit of its
// own.
export function pickBasemapLevel(manifest, maxTextureSize) {
  const levels = manifest.levels ?? [];
  if (!levels.length) throw new Error('basemap.json has no levels');
  let chosen = levels[0];
  for (const level of levels) {
    const { width, height } = level.dimensions;
    if (width <= maxTextureSize && height <= maxTextureSize) chosen = level;
  }
  return chosen;
}

export async function loadBasemap(
  dataUrl = `${import.meta.env.BASE_URL}data`,
  { maxTextureSize = 4096 } = {},
) {
  const manifest = await fetch(`${dataUrl}/basemap.json`).then((r) => r.json());
  // A conservative DEFAULT of 4096 on purpose: if a caller forgets to pass the real
  // limit, the failure is a coarser photograph rather than a texture that will not
  // upload on the visitor's machine.
  const level = pickBasemapLevel(manifest, maxTextureSize);
  const texture = await new THREE.TextureLoader().loadAsync(`${dataUrl}/${level.file.name}`);

  // Colour, unlike the canopy mask: the build script stored it sRGB-encoded on
  // purpose (8-bit linear bands visibly in the darks, and both WebP and JPEG
  // assume a perceptual encoding), and this is what tells three to decode it.
  texture.colorSpace = THREE.SRGBColorSpace;
  // Image textures default to flipY = true, which is what the manifest's row
  // order needs: row 0 is the north edge and terrainUv() puts north at V = 1.
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  // Mipmaps, for the same reason the canopy mask has them: this is sampled per
  // pixel out to a 40 km horizon, where one texel covers far less than one pixel
  // and unmipped 20 m data crawls with aliasing.
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  // Sharp at grazing angles, which is most of the ground in a walking view -
  // without it the middle distance smears into a band. Capped by the hardware.
  texture.anisotropy = 4;
  texture.needsUpdate = true;

  BASEMAP.value = texture;
  BASEMAP_SCALE.value = manifest.encoding.fullScale * BASEMAP_GAIN;
  BASEMAP_MIX.value = 1;
  // `level` is reported so a probe or a test can assert which one this machine got -
  // otherwise "the basemap loaded" says nothing about whether the fine one was used.
  return { manifest, texture, level };
}
