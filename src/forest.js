import * as THREE from 'three';

// The OSM-derived canopy mask (phase 6 vegetation, built by
// tools/fetch-forest.mjs + tools/build-forest.mjs). One 8-bit channel holding
// how much of each pixel is wooded.
//
// It is laid out on EXACTLY the heightfield's grid - same dimensions, bbox and
// row order - so terrain.js and vegetation.js both address it with the terrain's
// own UV mapping and no second projection is needed anywhere.
//
// Two consumers, one texture:
//   - src/vegetation.js decides in the vertex shader whether a given tree slot
//     is wooded, which is why placement costs nothing on the CPU;
//   - src/terrain.js darkens the ground inside the mask, so forest is visible
//     across the whole park rather than only inside the tree draw distance.

// Bound into shaders at compile time and filled in when the download lands.
// A sampler uniform has to exist when the program is linked, so terrain.js
// binds this object and later gets the real texture for free - no recompile,
// and load order between the two modules stops mattering.
export const FOREST_MASK = { value: null };

// 1x1 "nothing is wooded", so the shaders sample something valid before (and if)
// the mask arrives. Deliberately not a null sampler: those warn on some drivers
// and read as undefined data on others.
function emptyMask() {
  const texture = new THREE.DataTexture(new Uint8Array([0]), 1, 1, THREE.RedFormat, THREE.UnsignedByteType);
  texture.needsUpdate = true;
  return texture;
}

FOREST_MASK.value = emptyMask();

// Half the mask's resolution, ~41 m per cell (see createCoverageSampler).
const CPU_DOWNSCALE = 2;

// CPU-side coverage lookup, for the consumers that have to make a habitat
// decision in JavaScript rather than in a shader - src/wildlife.js chooses where
// a herd can stand, and the answer has to come back to the same code that then
// moves the animals.
//
// Decoded at half resolution deliberately. A herd site is picked on a 250-600 m
// lattice and the mask is 20 m data quantised to 16 levels, so finer detail
// would not change a single decision, while decoding all 4096x2355 means a
// 38 MB getImageData allocation and a 9.6 MB array kept for the session. At half
// scale it is 2.4 MB, and drawImage's own filtering averages the discarded
// pixels in rather than dropping them.
//
// Returns (x, z) => 0..1 in local scene meters, matching vegetation.js's vegUv():
// the local origin is the bbox centre, +X east, +Z south, and mask row 0 is the
// north edge.
export function createCoverageSampler({ manifest, texture }) {
  const { width: fullWidth, height: fullHeight } = manifest.dimensions;
  const { xmin, ymin, xmax, ymax } = manifest.bboxCrsUnits;
  const worldWidth = xmax - xmin;
  const worldDepth = ymax - ymin;
  const width = Math.ceil(fullWidth / CPU_DOWNSCALE);
  const height = Math.ceil(fullHeight / CPU_DOWNSCALE);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => 0; // no 2D context: callers degrade to "nothing is wooded"
  ctx.drawImage(texture.image, 0, 0, width, height);
  const rgba = ctx.getImageData(0, 0, width, height).data;
  const coverage = new Uint8Array(width * height);
  for (let i = 0; i < coverage.length; i++) coverage[i] = rgba[i * 4];

  return function coverageAt(x, z) {
    const col = Math.floor(((x + worldWidth / 2) / worldWidth) * width);
    const row = Math.floor(((z + worldDepth / 2) / worldDepth) * height);
    if (col < 0 || col >= width || row < 0 || row >= height) return 0;
    return coverage[row * width + col] / 255;
  };
}

export async function loadForest(dataUrl = `${import.meta.env.BASE_URL}data`) {
  const manifest = await fetch(`${dataUrl}/forest.json`).then((r) => r.json());
  const texture = await new THREE.TextureLoader().loadAsync(`${dataUrl}/${manifest.file.name}`);

  // Coverage is data, not colour: sRGB decoding it would bend the values.
  texture.colorSpace = THREE.NoColorSpace;
  // Image textures default to flipY = true, which is what we want here and
  // matches the flip terrain.js sets by hand on its DataTexture: the manifest's
  // row 0 is the north edge, and terrainUv() puts north at V = 1.
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  // Mipmaps here, unlike the height texture: the terrain tint samples this per
  // pixel out to the horizon, where a 20.5 m mask aliases badly without them.
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  FOREST_MASK.value = texture;
  return { manifest, texture };
}
