import * as THREE from 'three';

// The optional high-resolution terrain tier (2026-08-13) - the user's topic 2 of
// the four extras, "modelli ad alta risoluzione come opzione da alzare, non come
// nuovo default".
//
// The park's own 10 m elevation, which is the native resolution of the sources
// this project already mosaics (Valle d'Aosta DTM ~10 m, Piemonte DTM5, TINITALY
// 10 m). The shipped heightfield throws half of it away to make a 12.6 MB first
// load; this puts it back, for the 40 x 31 km people actually walk in, and only
// when asked.
//
// IT IS A RESIDUAL, NOT A SECOND HEIGHTFIELD, and that is the decision the whole
// design rests on. The elevation is read by seven modules in three different ways
// - the CPU bilinear array, the drawn-triangle surface, and the GPU texture - by
// the camera, the POI markers, the trees, the grass, the stones, the flowers and
// the terrain itself. Two absolute grids would put a seam between them that all
// seven have to agree about, on CPU and on GPU, and disagreeing about which
// surface is the ground is precisely the defect the user found by looking on
// 2026-08-12 ("erba e cespugli galleggiano in aria"). A correction that is zero
// outside its rectangle cannot create that class of bug: outside, every reader
// gets exactly the number it gets today, bit for bit.
//
// The build tool fades the correction to exactly zero over the tier's outermost
// 32 pixels, so there is no step at the boundary either - only a gradual return to
// the coarser surface, 320 m beyond anything the scene draws detail at.
//
// This module is forest.js's and landcover.js's sibling: a shared holder that the
// shaders bind at compile time and that gets its real data later, plus the one
// copy of the maths that both the CPU and the GLSL side use.

// Half-range of the signed-square-root mapping, in metres. Measured, not chosen:
// over the park's 12.5 Mpx the residual runs -39 to +53 m, so 56 clears the
// extremes with nothing to clip, while the square root keeps the steps at 0.003 m
// near zero where 99.7% of the values are. A linear map over +/-32 m would have
// been 2.6 MB smaller and quantised everything at 0.251 m, which is coarser than
// the base grid's own 0.07 m - and would still have clipped 41 pixels by ~21 m.
export const RESIDUAL_HALF_RANGE_M = 56;

// ZERO HAS TO BE EXACTLY REPRESENTABLE, and the obvious mapping cannot do it: the
// centre of 255 steps is 127.5, so code 128 decodes to 0.00086 m rather than to
// nothing. That sounds like rounding noise until you remember what this file is -
// a correction that must vanish outside the park and across the fade band. A
// millimetre of residual over 10 million pixels is a surface that no longer equals
// the one every other reader is using, which is the whole reason the design is a
// residual. So 128 is the zero and the two sides span 127 steps each; the build
// tool asserts the outer ring decodes to exactly 0.
const ZERO_CODE = 128;
const CODE_SPAN = 127;

/** Metres of correction -> the byte that ships. Inverse of decodeResidual(). */
export function encodeResidual(metres) {
  const s = Math.sign(metres) * Math.sqrt(Math.min(1, Math.abs(metres) / RESIDUAL_HALF_RANGE_M));
  return Math.max(0, Math.min(255, Math.round(s * CODE_SPAN) + ZERO_CODE));
}

/** The byte that ships -> metres of correction. Inverse of encodeResidual(). */
export function decodeResidual(code) {
  const s = (code - ZERO_CODE) / CODE_SPAN;
  return Math.sign(s) * s * s * RESIDUAL_HALF_RANGE_M;
}

// The shared sampler holder, bound into every shader that reads the ground at
// compile time so that turning the tier on later costs no recompile - exactly the
// arrangement forest.js's FOREST_MASK and landcover.js's LANDCOVER_MASK use, and
// for the same reason: a sampler uniform has to exist when the program is linked.
export const HEIGHT_TIER = { value: null };
// (offsetX, offsetZ, scaleX, scaleZ) mapping scene-local x,z into the tier's 0..1
// UV. All zero means "no tier", which the GLSL below tests without branching.
export const HEIGHT_TIER_RECT = { value: new THREE.Vector4(0, 0, 0, 0) };
// Multiplied into the decoded correction, so the knob can cross-fade the tier in
// rather than snapping the ground under the camera's feet.
export const HEIGHT_TIER_MIX = { value: 0 };

// HOW FINE THE DRAWN SURFACE IS, in segments across the whole bbox - and it is a
// holder rather than a constant because the tier moves it. Anything that has to
// stand ON the terrain reproduces the triangulation the terrain draws, and the
// tier raises the finest LOD by one level inside its rectangle; a scatter still
// modelling the coarser triangulation would sit above it on every convex cell,
// which is exactly the defect the user reported on 2026-08-12. terrain.js owns
// the value, groundcover.js reads it, and tools/test-height-tier.mjs asserts the
// two agree with what is actually drawn.
export const GROUND_SEGMENTS = { value: 0 };

/** A 1x1 "no correction", so a shader samples something valid before the tier
 *  arrives - and if it never does. Deliberately not a null sampler: those warn on
 *  some drivers and read as undefined data on others. 128 is the code for zero. */
export function emptyTier() {
  const texture = new THREE.DataTexture(new Uint8Array([ZERO_CODE]), 1, 1, THREE.RedFormat, THREE.UnsignedByteType);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Build the GPU texture and the rect uniform for a downloaded tier.
 * @param {Uint8Array} bytes the raw file
 * @param {object} manifest heighttier.json
 * @param {object} baseManifest heightfield.json, for the scene-local frame
 */
export function createTierTexture(bytes, manifest, baseManifest) {
  const { width, height } = manifest.dimensions;
  if (bytes.length !== width * height) {
    throw new Error(`height tier: ${bytes.length} bytes for a ${width}x${height} grid`);
  }
  const texture = new THREE.DataTexture(bytes, width, height, THREE.RedFormat, THREE.UnsignedByteType);
  // Linear, because the correction is a continuous surface and nearest sampling
  // would terrace it into 10 m squares - which is the exact artefact the tier
  // exists to remove.
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  // The tier's rectangle in the scene's local metres. +Z is South, and row 0 is
  // the north edge, so the V axis runs the same way the base heightfield's does.
  const b = baseManifest.bboxCrsUnits;
  const t = manifest.bboxCrsUnits;
  const originX = (b.xmin + b.xmax) / 2;
  const originY = (b.ymin + b.ymax) / 2;
  const localXMin = t.xmin - originX;
  const localZMin = originY - t.ymax; // north edge -> smallest z
  const rect = new THREE.Vector4(localXMin, localZMin, t.xmax - t.xmin, t.ymax - t.ymin);
  return { texture, rect };
}

/**
 * The correction in metres at a scene-local point, on the CPU. The twin of
 * heightTierGlsl(); tools/test-height-tier.mjs asserts the two agree, because a
 * disagreement between them is what puts the camera under the ground.
 */
export function sampleTier(tier, x, z) {
  if (!tier || !tier.bytes || tier.mix <= 0) return 0;
  const { width, height } = tier.manifest.dimensions;
  const r = tier.rect; // (localXMin, localZMin, sizeX, sizeZ)
  const u = (x - r.x) / r.z;
  const v = (z - r.y) / r.w;
  if (u < 0 || u > 1 || v < 0 || v > 1) return 0;
  // Pixel-is-area, identical to sampleHeightfield()'s convention.
  const colF = u * width - 0.5;
  const rowF = v * height - 0.5;
  const c0 = Math.min(Math.max(Math.floor(colF), 0), width - 1);
  const c1 = Math.min(c0 + 1, width - 1);
  const r0 = Math.min(Math.max(Math.floor(rowF), 0), height - 1);
  const r1 = Math.min(r0 + 1, height - 1);
  const fx = Math.min(Math.max(colF - c0, 0), 1);
  const fz = Math.min(Math.max(rowF - r0, 0), 1);
  // DECODED FIRST, THEN INTERPOLATED - which is the order the GPU cannot use, and
  // the reason the two are only equal to within the tolerance the test asserts.
  // Doing it the other way (interpolate codes, then decode) would be wrong by the
  // curvature of the square root, which is largest exactly where the residual is
  // smallest, i.e. everywhere that matters.
  const d = (rr, cc) => decodeResidual(tier.bytes[rr * width + cc]);
  const top = d(r0, c0) + (d(r0, c1) - d(r0, c0)) * fx;
  const bottom = d(r1, c0) + (d(r1, c1) - d(r1, c0)) * fx;
  return (top + (bottom - top) * fz) * tier.mix;
}

/**
 * The GLSL twin. Declares the uniforms and a coverTierM(vec2 wxz) that returns
 * the correction in metres - zero outside the rect, and zero when no tier is
 * loaded, both without a branch.
 *
 * Injected identically into terrain.js, vegetation.js and groundcover.js, from
 * this one place. The three keep their own copies of terrainUv() deliberately, so
 * a disagreement fails a test - but this is the opposite case: there is nothing to
 * gain from three chances to get a decode wrong.
 */
export function heightTierGlsl() {
  return /* glsl */ `
    uniform sampler2D uHeightTier;
    uniform vec4 uHeightTierRect; // (localXMin, localZMin, sizeX, sizeZ)
    uniform float uHeightTierMix;

    float heightTierM( vec2 wxz ) {
      vec2 uv = ( wxz - uHeightTierRect.xy ) / max( uHeightTierRect.zw, vec2( 1e-6 ) );
      // Outside the rect, and when no tier is loaded (size 0 -> uv explodes), this
      // multiplies out to zero without a branch.
      float inside = step( 0.0, uv.x ) * step( uv.x, 1.0 ) * step( 0.0, uv.y ) * step( uv.y, 1.0 )
                   * step( 1.0, uHeightTierRect.z );
      // The twin of decodeResidual(). 128 is the zero, 127 steps each side.
      float s = ( texture2D( uHeightTier, uv ).r * 255.0 - ${ZERO_CODE}.0 ) / ${CODE_SPAN}.0;
      return sign( s ) * s * s * ${RESIDUAL_HALF_RANGE_M}.0 * inside * uHeightTierMix;
    }
  `;
}
