import * as THREE from 'three';

// The outer ring: the band of ground that is NOT the park's own survey data,
// and how far into it any point lies. Built by tools/build-outer-ring.mjs -
// read that file's header for where the provenance comes from and why it has
// to be shipped rather than derived.
//
// WHAT IT IS FOR. Until 2026-08-18 the terrain ended twice over, and both ends
// were visible from inside the map. It ended at the DEM bbox, on a straight
// line 84 km long. And it ended at the Italian frontier, where the three
// national sources stop and 12% of the grid had no data at all - drawn, because
// nodata is not nothing, at the mosaic's minimum elevation, so the border crest
// broke off into a 2,600 m cliff down to a flat floor at 238.5 m. This module
// carries the field that lets both of those dissolve instead: the frontier
// crest now descends into France on Copernicus GLO-30 and fades into haze on
// the way, and the walker never reaches the part of the map that is guesswork.
//
// TWO FADES, ONE FUNCTION, and they are separate for a reason. The ring fade
// asks "how far past real data am I", which needs this texture. The edge fade
// asks "how close to the bbox am I", which is arithmetic on world position and
// needs nothing. The south edge is the case that proves they are different: it
// is Italian ground all the way to the boundary, so the ring field is zero
// there and only the edge fade saves it.

// Bound into the terrain shader at compile time and filled in when the download
// lands - the same arrangement as forest.js's FOREST_MASK. A sampler uniform
// has to exist when the program links, so terrain.js can bind this without
// waiting for anything, and load order between the two stops mattering.
export const OUTER_RING = { value: null };

// Metres of ring the ground takes to dissolve completely, and metres of bbox
// margin over which it does the same. Both are uniforms rather than shader
// constants so a probe can sweep them in a live session without a rebuild.
//
// 4000 m for the ring: the frontier crest has to read as a ridge with real
// country behind it before the haze takes over, and a fade shorter than the
// spacing between two ridgelines dissolves the first one on its own.
export const OUTER_RING_FADE_M = { value: 4000 };
// 1500 m for the bbox edge, and this one is CONSTRAINED, not chosen. The south
// edge sits 2,103 m below the park's southernmost tip, and a fade wider than
// that margin reaches inside the boundary and dissolves the park itself - which
// is what 3000 did: 17 sampled points of the park came out faded, worst 0.156,
// at 45.4008, 7.1988. Anything here must stay under that margin with room to
// spare; tools/test-outerring.mjs asserts no park ground is faded at all, so
// this cannot drift back without failing.
//
// 1.5 km is narrower than the ring's fade, which is right for a different
// reason: the bbox edge is looked at from tens of kilometres away, where the
// aerial perspective has already taken 30-50% of the ground, so the fade only
// has to finish a job that is mostly done. The ring's edge is looked at from
// the frontier crest itself.
export const EDGE_FADE_M = { value: 1500 };
// The field's own saturation distance, from the manifest. Read rather than
// repeated: build-outer-ring.mjs owns that number and the shader must use the
// one that was actually baked in, or every distance it computes is wrong by a
// constant factor and the fade silently changes width.
export const OUTER_RING_MAX_M = { value: 8000 };

// 1x1 "everything is local data", so the shader samples something valid before
// (and if) the field arrives - a viewer that never gets this file draws exactly
// what it drew before, with no fade and the old hard edges. Deliberately not a
// null sampler: those warn on some drivers and read as undefined on others.
function emptyField() {
  const texture = new THREE.DataTexture(new Uint8Array([0]), 1, 1, THREE.RedFormat, THREE.UnsignedByteType);
  texture.needsUpdate = true;
  return texture;
}

OUTER_RING.value = emptyField();

// The fade, as one number in 0..1: 0 = solid ground, 1 = fully dissolved into
// haze. Takes world XZ only and derives its own UV - the terrain's terrainUv()
// is injected into the VERTEX shader and does not exist on the fragment side,
// so asking for a UV here would mean a second, hand-copied mapping in the one
// place it must not drift.
//
// max(), not a sum: at the south-west corner the ring band and the bbox margin
// overlap, and adding them would saturate the fade a kilometre early - a
// visibly brighter wedge in the corner than along either edge that meets there.
// The stronger reason wins instead.
export function outerRingGlsl({ worldWidth, worldDepth }) {
  const glsl = (n) => {
    const s = n.toPrecision(12);
    return s.includes('.') || s.includes('e') ? s : `${s}.0`;
  };
  return /* glsl */ `
    uniform sampler2D uOuterRing;
    uniform float uOuterRingFadeM;
    uniform float uOuterRingMaxM;
    uniform float uEdgeFadeM;

    float outerRingFade( vec2 wxz ) {
      // Same mapping as terrainUv() in src/terrain.js: +Z is South (§6), and
      // the field's row 0 is the north edge, which the loader's flipY handles.
      vec2 uv = vec2( ( wxz.x + ${glsl(worldWidth / 2)} ) / ${glsl(worldWidth)},
                      ( ${glsl(worldDepth / 2)} - wxz.y ) / ${glsl(worldDepth)} );

      // How far beyond the last cell of real local data.
      float beyond = texture2D( uOuterRing, uv ).r * uOuterRingMaxM;
      float ring = smoothstep( 0.0, uOuterRingFadeM, beyond );

      // How close to the bbox, in metres, on whichever side is nearest.
      vec2 toEdge = vec2( ${glsl(worldWidth / 2)}, ${glsl(worldDepth / 2)} ) - abs( wxz );
      float edge = 1.0 - smoothstep( 0.0, uEdgeFadeM, min( toEdge.x, toEdge.y ) );

      return clamp( max( ring, edge ), 0.0, 1.0 );
    }
  `;
}

// GLSL's smoothstep, so the two sides of this really do agree.
function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// The fade, over a decoded field. Split out from createFadeSampler because the
// browser and Node cannot decode a PNG the same way - the viewer goes through a
// canvas, tools/test-outerring.mjs through readQuantisedMask - and if the test
// carried its own copy of the arithmetic it would be checking a second
// implementation rather than this one.
export function makeFadeAt({ field, width, height, worldWidth, worldDepth, maxDistanceM }) {
  return function fadeAt(x, z) {
    const col = Math.floor(((x + worldWidth / 2) / worldWidth) * width);
    const row = Math.floor(((z + worldDepth / 2) / worldDepth) * height);
    // Off the grid entirely is as far out as it gets.
    const beyond = (col < 0 || col >= width || row < 0 || row >= height)
      ? maxDistanceM
      : (field[row * width + col] / 255) * maxDistanceM;
    const ring = smoothstep(0, OUTER_RING_FADE_M.value, beyond);

    const toEdgeX = worldWidth / 2 - Math.abs(x);
    const toEdgeZ = worldDepth / 2 - Math.abs(z);
    const edge = 1 - smoothstep(0, EDGE_FADE_M.value, Math.min(toEdgeX, toEdgeZ));

    return Math.min(1, Math.max(0, Math.max(ring, edge)));
  };
}

// CPU-side lookup, for the one consumer that has to answer in JavaScript:
// src/controls.js, which stops the walker before the ground stops being real.
// Same reduction and the same reasoning as forest.js's createCoverageSampler -
// a movement decision cannot resolve 41 m either, and this field is already
// coarse.
//
// It returns THE SAME NUMBER THE SHADER COMPUTES - the fade, not the raw
// distance - and that is the point of putting both terms here rather than
// letting controls.js add the bbox margin itself. The boundary the walker feels
// and the dissolve the walker sees are then one function evaluated twice, so
// they cannot end up in different places; two implementations of "how far out
// is this" would be a drift waiting to happen, and the symptom would be an
// invisible wall in clear ground, or solid-looking ground you fall out of.
//
// Returns (x, z) => 0..1 in local scene metres, matching terrainUv(): the local
// origin is the bbox centre, +X east, +Z south, and row 0 is the north edge.
export function createFadeSampler({ manifest, texture }) {
  const { width, height } = manifest.dimensions;
  const { xmin, ymin, xmax, ymax } = manifest.bboxCrsUnits;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  // No 2D context: the walker is not confined rather than confined wrongly.
  // A boundary in the wrong place is worse than no boundary.
  if (!ctx) return () => 0;
  ctx.drawImage(texture.image, 0, 0, width, height);
  const rgba = ctx.getImageData(0, 0, width, height).data;
  const field = new Uint8Array(width * height);
  for (let i = 0; i < field.length; i++) field[i] = rgba[i * 4];

  return makeFadeAt({
    field,
    width,
    height,
    worldWidth: xmax - xmin,
    worldDepth: ymax - ymin,
    maxDistanceM: manifest.encoding.maxDistanceM,
  });
}

export async function loadOuterRing(dataUrl = `${import.meta.env.BASE_URL}data`) {
  const manifest = await fetch(`${dataUrl}/outerring.json`).then((r) => r.json());
  const texture = await new THREE.TextureLoader().loadAsync(`${dataUrl}/${manifest.file.name}`);

  // A distance is data, not colour: sRGB decoding it would bend the ramp.
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  // No mipmaps, unlike the canopy mask. This field is smooth by construction -
  // it is a distance transform - so there is nothing here to alias, and a
  // mipmapped fade would soften the frontier differently at different ranges.
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  OUTER_RING.value = texture;
  OUTER_RING_MAX_M.value = manifest.encoding.maxDistanceM;
  return { manifest, texture };
}
