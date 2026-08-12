import * as THREE from 'three';

// The open-vegetation mask (grass and shrubs, 2026-08-12). Built by
// tools/basemap-source/build-ndvi.py + tools/build-landcover.mjs - read those
// headers for the source, the licence and the measurement that chose them.
//
// This is forest.js's sibling and deliberately looks like it: one 8-bit
// single-channel mask laid out on the heightfield's bbox and row order, so
// src/groundcover.js addresses it with the terrain's own UV mapping and no second
// projection exists anywhere in the runtime. It is at half the heightfield's
// resolution (41 m/px), which changes nothing about the UVs - they are normalised
// - and is measured rather than assumed; see the size table in the build tool.
//
// ONE number per pixel: how much of it carries vegetation that is not tree
// canopy. That is all the data says, and it is a measurement - Sentinel-2 NDVI.
// Whether that vegetation is a pasture or a rhododendron heath is a MODEL, and it
// lives in groundcover.js as a function of elevation, because the vertex shader
// already samples elevation for every instance it places. Shipping it as a second
// texture cost 4.4 MB for a value that was already derivable.
//
// WHY NOT OSM, which is where the canopy mask comes from. Because it was measured
// and it is not there: inside the park boundary, OSM's grass and scrub classes
// cover 0.011 of a pixel on average below 2,200 m and 0.003 above 2,700 m.
// Meadows get tagged near villages; nobody tags an alpine pasture. The forest mask
// stays on OSM because at 0.21 cover that IS a real survey. See
// tools/build-landcover-osm.mjs, which is kept, runs, and ships nothing.

// Bound into shaders at compile time and filled in when the download lands - the
// same arrangement as forest.js's FOREST_MASK. A sampler uniform has to exist
// when the program is linked, so groundcover.js binds this and later gets the
// real texture for free: no recompile, and load order stops mattering.
export const LANDCOVER_MASK = { value: null };

// 1x1 "nothing grows here", so the shaders sample something valid before (and if)
// the mask arrives. Deliberately not a null sampler: those warn on some drivers
// and read as undefined data on others.
function emptyMask() {
  const texture = new THREE.DataTexture(new Uint8Array([0]), 1, 1, THREE.RedFormat, THREE.UnsignedByteType);
  texture.needsUpdate = true;
  return texture;
}

LANDCOVER_MASK.value = emptyMask();

// The CPU copy is at the mask's own resolution, not halved again. forest.js
// halves its 20.5 m mask because a herd site is chosen on a 250-600 m lattice;
// this one is already 41 m and its CPU consumer (src/edelweiss.js) tests
// individual patch sites, so there is nothing left to throw away. 2048x1178 is a
// 9.6 MB getImageData and a 2.4 MB array kept for the session.
export function createLandcoverSampler({ manifest, texture }) {
  const { width, height } = manifest.dimensions;
  const { xmin, ymin, xmax, ymax } = manifest.bboxCrsUnits;
  const worldWidth = xmax - xmin;
  const worldDepth = ymax - ymin;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => 0; // no 2D context: callers degrade to "nothing grows"
  ctx.drawImage(texture.image, 0, 0, width, height);
  const rgba = ctx.getImageData(0, 0, width, height).data;
  const cover = new Uint8Array(width * height);
  for (let i = 0; i < cover.length; i++) cover[i] = rgba[i * 4];

  // (x, z) => 0..1 in local scene metres, matching groundcover.js's coverUv():
  // the local origin is the bbox centre, +X east, +Z south, and row 0 is north.
  return function coverAt(x, z) {
    const col = Math.floor(((x + worldWidth / 2) / worldWidth) * width);
    const row = Math.floor(((z + worldDepth / 2) / worldDepth) * height);
    if (col < 0 || col >= width || row < 0 || row >= height) return 0;
    return cover[row * width + col] / 255;
  };
}

export async function loadLandcover(dataUrl = `${import.meta.env.BASE_URL}data`) {
  const manifest = await fetch(`${dataUrl}/landcover.json`).then((r) => r.json());
  const texture = await new THREE.TextureLoader().loadAsync(`${dataUrl}/${manifest.mask.file.name}`);

  // Cover is data, not colour: sRGB decoding it would bend the values.
  texture.colorSpace = THREE.NoColorSpace;
  // Image textures default to flipY = true, which is what we want and matches the
  // flip terrain.js sets by hand: the manifest's row 0 is the north edge, and
  // terrainUv() puts north at V = 1.
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  // No mipmaps, unlike the canopy mask. That one is sampled per PIXEL out to a
  // 40 km horizon by the terrain tint and aliases badly without them; this one is
  // sampled once per scattered instance and every instance is within a couple of
  // hundred metres, so there is no minification to filter. Mipmaps would only
  // cost memory and blur the margins.
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  LANDCOVER_MASK.value = texture;
  return { manifest, texture };
}
