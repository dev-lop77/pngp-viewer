import * as THREE from 'three';

// The glacier mask (built by tools/build-glacier-mask.mjs from the same 80 outlines
// src/water.js used to drape a sheet over), and the holder src/terrain.js samples.
//
// This module is deliberately the twin of src/forest.js, down to the empty-texture
// placeholder and the NoColorSpace flag, because it is the same kind of thing: a coverage
// fraction on the heightfield's own grid, downloaded separately from the terrain, read by
// the terrain shader. What is different is what it replaces - the canopy mask only ever
// tinted ground that was already there, while this one takes over from 563,567 triangles
// of geometry that could sag into the rock. The ice is the ground now.
export const GLACIER_MASK = { value: null };

// A 1x1 black texture until the real mask lands, so the material can compile and draw
// before the download finishes. Not a null sampler: those warn on some drivers and read
// as undefined on others (the same reason forest.js has one).
function emptyMask() {
  const texture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}
GLACIER_MASK.value = emptyMask();

export async function loadGlacierMask(dataUrl = `${import.meta.env.BASE_URL}data`) {
  const manifest = await fetch(`${dataUrl}/glacier.json`).then((r) => r.json());
  const texture = await new THREE.TextureLoader().loadAsync(`${dataUrl}/${manifest.file.name}`);

  // Coverage is data, not colour: sRGB-decoding it would bend the values.
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  // Mipmaps, for the same reason the canopy mask has them: this is sampled per pixel out
  // to the horizon, and a 20.5 m mask aliases badly without them.
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  GLACIER_MASK.value = texture;
  return { manifest, texture };
}
