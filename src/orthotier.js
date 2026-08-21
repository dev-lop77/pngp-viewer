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
// 900 and 1,700, raised from 300/650 on 2026-08-20 at the user's own reading - "E' carino che
// si comincia a vedere da piu' lontano". The ceiling is not taste, it is the atlas: with a 3x3
// block the camera is guaranteed only ONE ring of margin, 2,000 m, so a fade that finished
// beyond that would show the atlas's own edge. Going further needs a 5x5 block, which at
// 2 m/px is 5,020 px and about 100 MB of video memory - or a second, coarser level for the far
// field, which is the usual answer and is not built.
//
// It is not the resolution that stops us either: a 2 m texel only shrinks to one screen pixel
// at about 2,300 m here, and the satellite it replaces does not until 11,800 m.
export const ORTHO_NEAR_M = { value: 900 };
export const ORTHO_FAR_M = { value: 1700 };

// How much of the photograph shows through on a GLACIER, where this project draws its own ice.
//
// 1.0 - THE PHOTOGRAPH WINS, decided by the user on 2026-08-20 ("vince la foto, e' piu'
// recente") after the marker test showed the 2024 flight and the OSM outline disagreeing about
// where the ice ends. The photograph is fifteen years the newer claim, so it takes the ice too
// and not merely the ground outside the outline.
//
// The consequence is worth stating rather than discovering later: within the overlay's reach
// the firn line, the live-ice grey and the moraine band do not show, because the photograph
// has all three from the day it was flown. Beyond the fade they come back. Setting this to 0
// restores exactly what shipped before the photograph existed, which is what makes it a knob
// rather than a rewrite.
export const ICE_PHOTO_MIX = { value: 1 };

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

    // ONE FETCH, both answers: rgb is the photograph's albedo, a is how much of the ground it
    // should carry here. They were two functions and therefore two texture fetches of the same
    // texel, which is pure waste in a shader that runs on every ground fragment.
    //
    // The amount is: inside the atlas, away from its edge, covered, and near the camera.
    //   - COVERAGE IS THE ALPHA. A cell of the atlas with no sheet behind it - across the
    //     regional border, or off the flown area - is left transparent when the atlas is
    //     drawn, so that one multiply is the whole missing-data mask and there is no second
    //     texture to keep in step with the first.
    //   - 1.0 - uv.y, and it is not decoration: the rectangle's z grows SOUTHWARD (§6) while
    //     the image's row 0 is its north edge and three flips loaded images on upload, so
    //     v = 0 is the south edge. Sampling with uv.y would mirror the valley about its own
    //     middle - which on this terrain looks almost right, and is the reason to say so.
    vec4 orthoSample( vec2 wxz ) {
      vec2 uv = orthoUv( wxz );
      float inside = step( 0.0, uv.x ) * step( uv.x, 1.0 )
                   * step( 0.0, uv.y ) * step( uv.y, 1.0 )
                   * step( 1.0, uOrthoRect.z );
      float edge = min( min( uv.x, 1.0 - uv.x ), min( uv.y, 1.0 - uv.y ) );
      inside *= smoothstep( 0.0, ${EDGE_FADE.toPrecision(4)}, edge );
      vec4 texel = texture2D( uOrtho, vec2( uv.x, 1.0 - uv.y ) );
      float d = distance( cameraPosition.xz, wxz );
      float amount = inside * texel.a * uOrthoMix
                   * ( 1.0 - smoothstep( uOrthoNearM, uOrthoFarM, d ) );
      // The texture is tagged SRGBColorSpace, so rgb is already linear here.
      return vec4( texel.rgb * uOrthoScale, amount );
    }
  `;
}

// ---- the moving atlas ------------------------------------------------------------------
//
// One rectangle was enough for one clip. The park's Valle d'Aosta side is 129 sheets over
// 449 km2 (tools/dev/probe-ortho-coverage.mjs), and it cannot be one texture: at 2 m/px the
// covered bbox is 19,950 x 15,700 px against a 16,384 limit, and 800 MB of video memory if
// it fitted.
//
// So the atlas is a 3x3 block of sheets around whichever sheet the camera is standing on -
// 6.04 km square at 2 m/px, 3,020 px, about 36 MB - redrawn only when the camera CROSSES a
// sheet boundary. (6.04 rather than 6.12 because the sheets OVERLAP: 2,040 m of ground each,
// 2,000 m apart. The overlap is the same ground twice, so they are simply drawn over one
// another and nothing has to blend.) Three reasons that shape is right rather than merely convenient:
//
//   - the overlay is only ever drawn within a few hundred metres of the camera, so a 3x3
//     block leaves at least one full sheet of margin in every direction and there is never a
//     visible edge caused by the atlas itself;
//   - a refill therefore happens every ~2 km of walking, not per frame;
//   - the shader does not change at all. uOrthoRect stops meaning "the clip" and starts
//     meaning "the atlas", and everything downstream of it already worked.
//
// Cells with no sheet - across the regional border, or off the flown area - are left
// TRANSPARENT, and orthoSample()'s alpha carries that through. So missing coverage costs nothing
// and needs no second mask. Its edge is currently hard; feathering it is the obvious next
// refinement and is not done.
const RINGS = 1; // 1 -> 3x3. The margin argument above is what makes 1 enough.

// A DECODED SHEET IS 1020 x 1020 x 4 BYTES - 4.2 MB, whatever the 200 KB WebP on disk says.
// At the nine sheets of the proof that was 37 MB and invisible. The park's Valle d'Aosta side
// is 129, and nothing here evicted anything, so a walk from one end to the other ended up
// holding 537 MB of decoded photograph. 16 is the 3x3 block the atlas is drawing plus the
// seven cells of the block next door, so crossing a sheet boundary and stepping back does not
// re-fetch. A Map iterates in insertion order and a hit re-inserts, so the nine sheets in the
// atlas right now are always the nine most recent and eviction can never take one of them.
const SHEET_CACHE_MAX = 16;
const imageCache = new Map(); // file name -> HTMLImageElement, least recently used first
let manifestPromise = null;
let manifest = null;
let origin = null; // the scene's local origin, needed to place the atlas
let canvas = null;
let ctx = null;
let atlasTexture = null;
let atlasCell = null; // [i, j] of the centre sheet currently DRAWN
// [i, j] a refill is currently fetching for. Separate from atlasCell because a refill
// awaits nine downloads, and until this existed the render loop saw the OLD atlasCell on
// every frame in between and started the whole refill again - once per frame, for as long
// as the network took. Nine already-cached sheets resolved too fast for that to show.
let pendingCell = null;
let sheetPx = 0;
let stepPx = 0;
let byCell = null; // "i,j" -> sheet record

// What the atlas last cost, so a probe can ask instead of guessing: how many sheets it holds,
// how many of its cells are empty, how many decoded sheets are cached, and how long the last
// refill took.
// `cell` is the grid index the atlas is centred on. It is here because the one time this
// went wrong the atlas was a whole cell east and still looked like a photograph: without
// a number to compare against the manifest, there was nothing to notice.
export const ORTHO_STATS = { sheets: 0, cells: 0, empty: 0, cached: 0, cell: null, lastRefillMs: 0, refills: 0 };

function evictSheets() {
  while (imageCache.size > SHEET_CACHE_MAX) imageCache.delete(imageCache.keys().next().value);
  ORTHO_STATS.cached = imageCache.size;
}

// THE CACHE HOLDS PROMISES, NOT IMAGES, and that is the whole point of it. Nine sheets that
// all resolve before the camera can move made an element cache look sufficient; at 129 the
// camera crosses cells while a refill is still in the air, and an element cache is empty
// until onload - so every caller in between started its own download of the same file.
function loadImage(dataUrl, name) {
  const cached = imageCache.get(name);
  if (cached) {
    imageCache.delete(name); // re-insert, so a hit counts as recent
    imageCache.set(name, cached);
    return cached;
  }
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    // The atlas is drawn into a canvas and read back as a texture, so the image has to be
    // same-origin or CORS-clean or the canvas is tainted and the upload throws. Ours is
    // same-origin; this is here so a future remote tile fails loudly instead of oddly.
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`orthophoto sheet failed to load: ${name}`));
    img.src = `${dataUrl}/ortho/${name}`;
  });
  // A failure must not be remembered: a cached rejection would make one dropped connection
  // permanent for the rest of the session.
  p.catch(() => imageCache.delete(name));
  imageCache.set(name, p);
  evictSheets();
  return p;
}

// Which sheet cell a local (x, z) falls in. The grid is declared in the manifest rather than
// derived here, because it is a property of the source's cartographic cut and not of ours.
// Which sheet is the camera most inside? THE INDEX IS MEASURED FROM SHEET CENTRES, not from
// their corners, and that distinction is a real bug I wrote first: the manifest indexes a
// sheet by its upper-left CORNER (i = (xmin - originE) / stepM, exact), while this asks a
// different question about a point, and rounding the corner-relative offset put Le Pont in
// the sheet next door - 0.864 rounds to 1, but the nearest sheet centre is 0. The atlas was
// then built one sheet east of the camera, which still looks like a photograph and is still
// wrong.
//
// The sheets overlap - sheetM wide, stepM apart, so 20 m a side belongs to two files - and
// nearest-centre is exactly the right tie-break for a point in that strip.
function cellAt(x, z) {
  const g = manifest.grid;
  const e = x + origin.x;
  const n = origin.y - z;
  const half = g.sheetM / 2;
  return [
    Math.round((e - g.originE - half) / g.stepM),
    Math.round((g.originN - half - n) / g.stepM),
  ];
}

// Fetch the manifest once. Returns it, or null if there is nothing published - a viewer
// without a mosaic must keep working, since this is the optional half of the ground.
export async function loadOrtho(dataUrl = `${import.meta.env.BASE_URL}data`, localOrigin) {
  manifestPromise = manifestPromise ?? fetch(`${dataUrl}/ortho.json`).then((r) => (r.ok ? r.json() : null));
  manifest = await manifestPromise;
  if (!manifest?.sheets?.length) return null;
  origin = localOrigin;
  byCell = new Map(manifest.sheets.map((sh) => [sh.cell.join(','), sh]));
  sheetPx = Math.round(manifest.grid.sheetM / manifest.resolutionMPerPx.x);
  stepPx = Math.round(manifest.grid.stepM / manifest.resolutionMPerPx.x);
  if (!canvas) {
    canvas = document.createElement('canvas');
    // Sheets are laid at stepPx and drawn at sheetPx, so the block is one step-grid wide plus
    // the last sheet's overhang: 3 x 1000 + 20 = 3,020 px at 2 m/px, which is 6,040 m.
    canvas.width = stepPx * 2 * RINGS + sheetPx;
    canvas.height = stepPx * 2 * RINGS + sheetPx;
    ctx = canvas.getContext('2d', { willReadFrequently: false });
    atlasTexture = new THREE.CanvasTexture(canvas);
    atlasTexture.colorSpace = THREE.SRGBColorSpace;
    atlasTexture.wrapS = THREE.ClampToEdgeWrapping;
    atlasTexture.wrapT = THREE.ClampToEdgeWrapping;
    atlasTexture.minFilter = THREE.LinearMipmapLinearFilter;
    atlasTexture.magFilter = THREE.LinearFilter;
    atlasTexture.generateMipmaps = true;
    atlasTexture.anisotropy = 8; // the ground is seen at a grazing angle almost everywhere
    ORTHO.value = atlasTexture;
  }
  ORTHO_STATS.sheets = manifest.sheets.length;
  return manifest;
}

// Move the atlas to wherever the camera is, if it needs moving. Returns true if it refilled.
// Call it from the render loop: it costs one comparison until the camera crosses a boundary.
export async function updateOrtho(camX, camZ, dataUrl = `${import.meta.env.BASE_URL}data`) {
  if (!manifest || !ctx) return false;
  const [ci, cj] = cellAt(camX, camZ);
  if (atlasCell && atlasCell[0] === ci && atlasCell[1] === cj) return false;
  if (pendingCell && pendingCell[0] === ci && pendingCell[1] === cj) return false;
  pendingCell = [ci, cj];
  const t0 = performance.now();

  const wanted = [];
  for (let dj = -RINGS; dj <= RINGS; dj++) {
    for (let di = -RINGS; di <= RINGS; di++) {
      const sh = byCell.get(`${ci + di},${cj + dj}`);
      if (sh) wanted.push({ sh, dx: (di + RINGS) * stepPx, dy: (dj + RINGS) * stepPx });
    }
  }
  // Nothing here at all - leave the atlas where it was rather than blanking the ground.
  if (!wanted.length) {
    atlasCell = [ci, cj];
    ORTHO_STATS.cell = [ci, cj];
    ORTHO_STATS.cells = 0;
    ORTHO_STATS.empty = (2 * RINGS + 1) ** 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    atlasTexture.needsUpdate = true;
    placeAtlas(ci, cj);
    return true;
  }
  const images = await Promise.all(wanted.map((w) => loadImage(dataUrl, w.sh.file.name).catch(() => null)));
  // A newer refill overtook this one while its sheets were in the air. Drawing now would put
  // the atlas where the camera USED to be, which is the failure that looks like a photograph.
  if (pendingCell[0] !== ci || pendingCell[1] !== cj) return false;

  // Transparent first, so a cell with no sheet stays transparent and orthoSample() reads 0
  // there. clearRect, not fillRect: an opaque fill would paint grey ground.
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let drawn = 0;
  images.forEach((img, k) => {
    if (!img) return;
    ctx.drawImage(img, wanted[k].dx, wanted[k].dy, sheetPx, sheetPx);
    drawn += 1;
  });
  atlasTexture.needsUpdate = true;
  atlasCell = [ci, cj];
  placeAtlas(ci, cj);
  ORTHO_STATS.cell = [ci, cj];
  ORTHO_STATS.cells = drawn;
  ORTHO_STATS.empty = (2 * RINGS + 1) ** 2 - drawn;
  ORTHO_STATS.lastRefillMs = performance.now() - t0;
  ORTHO_STATS.refills += 1;
  return true;
}

// The atlas's world rectangle, in local scene metres. World (EPSG:23032) -> local is the one
// conversion in ARCHITECTURE §6: X = E - originX, Z = originY - N, so the rectangle's local
// zMin comes from its NORTH edge - which is the cell with the SMALLEST j.
function placeAtlas(ci, cj) {
  const g = manifest.grid;
  // Same shape as the canvas: the step grid, plus the last sheet's overhang.
  const side = g.stepM * 2 * RINGS + g.sheetM;
  const xmin = g.originE + (ci - RINGS) * g.stepM - origin.x;
  // The atlas's NORTH edge is the row with the smallest j, and local z grows southward.
  const northN = g.originN - (cj - RINGS) * g.stepM;
  ORTHO_RECT.value.set(xmin, origin.y - northN, side, side);
}
