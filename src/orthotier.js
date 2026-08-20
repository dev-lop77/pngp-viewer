import * as THREE from 'three';

// The optional high-resolution ground photograph, drawn only near the camera.
//
// The user's own framing, 2026-08-20: "il caricamento, opzionale e solo sul terreno a breve
// distanza dall'avatar, dei til da sovrapporre al terreno gia' caricato". So this is not a
// second basemap - the basemap is one photograph of the whole 84 x 58 km bbox at 10.24 m and
// it carries the colour of everything you can see. This is a small rectangle at 0.5 m that
// takes over the last few hundred metres, where 10 m ground texels are the thing that most
// obviously says "this is a model".
//
// NOTHING HERE IS IN THE FIRST LOAD. The manifest and the image are fetched by loadOrtho(),
// which nothing calls until the viewer asks - the same arrangement as the 5 m terrain tier,
// and the reason the published site is still 31.27 MB with this in the tree.
//
// WHY THERE IS NO REPROJECTION ANYWHERE IN THIS FILE. The Valle d'Aosta Ortofoto 2024 is
// republished by SCT in EPSG:23032, which is this project's own CRS (docs/ARCHITECTURE.md
// §6), so the image's world rectangle drops straight into local scene metres. Every other
// candidate source is WGS84 or Web Mercator, and ED50 against WGS84 is 215 m in this park -
// the same numbers, a different datum, and a photograph 215 m from its own mountain
// (tools/dev/probe-orthophoto.mjs measures it).

// Bound into the terrain shader at compile time and filled in when the download lands, for
// the same reason FOREST_MASK is: a sampler uniform has to exist when the program links.
export const ORTHO = { value: null };
// (localXMin, localZMin, sizeX, sizeZ) in scene metres. Zero size reads as "nothing loaded"
// in the shader without a branch.
export const ORTHO_RECT = { value: new THREE.Vector4(0, 0, 0, 0) };
// 0 until the image is both loaded AND switched on. This is the optional part.
export const ORTHO_MIX = { value: 0 };

// How near "a breve distanza dall'avatar" is. Full strength inside NEAR, gone by FAR, and the
// band between them is what keeps the changeover from being a circle drawn on the ground.
// Holders rather than constants so they can be swept live - a looking decision, like the haze
// and the ice before it (docs/PROGRESS.md).
export const ORTHO_NEAR_M = { value: 300 };
export const ORTHO_FAR_M = { value: 650 };

// Multiplies the sampled texel to reach albedo, exactly as BASEMAP_SCALE does - and it has to
// exist for the same reason: "albedo is not appearance" (the warning in terrain.js, §13.2).
//
// 1.54 is MEASURED, not chosen. Over this clip's own rectangle the basemap's mean is
// rgb(118.2, 118.5, 95.3) and the orthophoto's is rgb(129.4, 123.9, 106.2); in linear space
// that makes the photograph 1.22x brighter, so matching the basemap's rendered brightness
// takes 1.87 / 1.22 = 1.54, where 1.87 is BASEMAP_SCALE (fullScale 0.55 x gain 3.4).
//
// Matching the MEAN is the right first move and not the last word: the basemap was de-shaded
// to albedo offline and this photograph was not, so the two agree on average and disagree
// wherever the flight had a shadow.
export const ORTHO_SCALE = { value: 1.54 };

// A 1x1 mid-grey, so the sampler reads something valid before (and if) the image arrives.
// Deliberately not a null sampler: those warn on some drivers and read as undefined data on
// others. Never visible, because ORTHO_MIX stays 0 until the load succeeds.
function placeholder() {
  const texture = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1);
  texture.needsUpdate = true;
  return texture;
}
ORTHO.value = placeholder();

// How much of the rectangle's own edge is spent fading out, as a fraction of its half-width.
// Without it the clip ends on a straight line across the hillside, which reads as a defect
// even when the photograph is better than what it replaces.
const EDGE_FADE = 0.06;

export function orthoGlsl() {
  return /* glsl */ `
    uniform sampler2D uOrtho;
    uniform vec4 uOrthoRect;   // (localXMin, localZMin, sizeX, sizeZ)
    uniform float uOrthoMix;
    uniform float uOrthoNearM;
    uniform float uOrthoFarM;
    uniform float uOrthoScale;

    vec2 orthoUv( vec2 wxz ) {
      return ( wxz - uOrthoRect.xy ) / max( uOrthoRect.zw, vec2( 1e-6 ) );
    }

    // How much of the ground this photograph should carry here: inside the rectangle, away
    // from its edge, and near the camera. Zero everywhere else, and zero with nothing
    // loaded (size 0 -> the step below fails), all without a branch.
    float orthoAmount( vec2 wxz ) {
      vec2 uv = orthoUv( wxz );
      float inside = step( 0.0, uv.x ) * step( uv.x, 1.0 )
                   * step( 0.0, uv.y ) * step( uv.y, 1.0 )
                   * step( 1.0, uOrthoRect.z );
      float edge = min( min( uv.x, 1.0 - uv.x ), min( uv.y, 1.0 - uv.y ) );
      inside *= smoothstep( 0.0, ${EDGE_FADE.toPrecision(4)}, edge );
      float d = distance( cameraPosition.xz, wxz );
      return inside * uOrthoMix * ( 1.0 - smoothstep( uOrthoNearM, uOrthoFarM, d ) );
    }

    // The texture is tagged SRGBColorSpace, so this sample is already linear.
    //
    // 1.0 - uv.y, and it is not decoration: the rectangle's z grows SOUTHWARD (§6) while the
    // image's row 0 is its north edge and three flips loaded images on upload, so v = 0 is
    // the south edge. Sampling with uv.y would mirror the valley about its own middle -
    // which on this terrain looks almost right, and is the reason to say so here.
    vec3 orthoAlbedo( vec2 wxz ) {
      vec2 uv = orthoUv( wxz );
      return texture2D( uOrtho, vec2( uv.x, 1.0 - uv.y ) ).rgb * uOrthoScale;
    }
  `;
}

// Fetch the manifest and the image, and place the rectangle in local scene metres. Returns
// the manifest, or null if there is nothing published - a viewer without a clip must keep
// working, since this is the optional half of the ground.
export async function loadOrtho(dataUrl = `${import.meta.env.BASE_URL}data`, localOrigin) {
  const manifest = await fetch(`${dataUrl}/ortho.json`).then((r) => (r.ok ? r.json() : null));
  if (!manifest) return null;
  const texture = await new THREE.TextureLoader().loadAsync(`${dataUrl}/${manifest.file.name}`);
  // A photograph, so sRGB - three undoes the transfer and the shader samples linear.
  texture.colorSpace = THREE.SRGBColorSpace;
  // ClampToEdge, because orthoAmount() has already faded to nothing before the border: any
  // wrapping here would be a bug that only shows at one pixel of one edge.
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 8; // the ground is seen at a grazing angle almost everywhere
  texture.needsUpdate = true;
  ORTHO.value = texture;

  // World (EPSG:23032) -> local scene metres, the one conversion in §6: X = E - originX,
  // Z = originY - N. So the rectangle's local zMin comes from its NORTH edge.
  const b = manifest.bboxCrsUnits;
  ORTHO_RECT.value.set(
    b.xmin - localOrigin.x,
    localOrigin.y - b.ymax,
    b.xmax - b.xmin,
    b.ymax - b.ymin,
  );
  return manifest;
}
