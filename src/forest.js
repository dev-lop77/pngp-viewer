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
