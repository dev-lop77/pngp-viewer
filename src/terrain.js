import * as THREE from 'three';
import { setLocalOrigin } from './geo.js';
import { sampleHeightfield } from './heightfield.js';

const MESH_SEGMENTS_X = 256;

// GPU displacement + CPU height queries both read the exact same
// heightfield.json / heightfield.<hash>.bin pair (docs/ARCHITECTURE.md §4)
// so they can never silently disagree.
//
// dataUrl must be resolved against import.meta.env.BASE_URL, not a
// root-absolute path - vite.config.js sets base: './' so the build works
// unmodified under a sub-path deployment (GitHub Pages: user.github.io/repo/),
// but that only rewrites Vite-injected asset URLs (script/css tags), not
// fetch() calls we write ourselves. Confirmed by actually serving a build
// from a sub-path and watching a root-absolute '/data/...' fetch 404.
export async function loadTerrain(dataUrl = `${import.meta.env.BASE_URL}data`) {
  const manifest = await fetch(`${dataUrl}/heightfield.json`).then((r) => r.json());
  const buffer = await fetch(`${dataUrl}/${manifest.file.name}`).then((r) => r.arrayBuffer());
  const heights = new Uint16Array(buffer);

  const { width, height } = manifest.dimensions;
  const { xmin, ymin, xmax, ymax } = manifest.bboxCrsUnits;
  const { min: elevMin, max: elevMax } = manifest.elevationRangeM;
  const { x: resX, y: resY } = manifest.resolutionMPerPx;
  const worldWidth = xmax - xmin;
  const worldDepth = ymax - ymin;

  setLocalOrigin(manifest.localOrigin.x, manifest.localOrigin.y);

  // GPU-safe encoding: pack each 16-bit sample across two 8-bit channels
  // (R = high byte, G = low byte) instead of uploading a single-channel
  // 16-bit texture. A true normalized R16 texture needs EXT_texture_norm16,
  // which Firefox never supports (confirmed via caniuse - not a graceful
  // fallback, it's a hard WebGL error, verified directly: texStorage2D/
  // texSubImage2D failures on a SwiftShader context lacking the extension,
  // see docs/PROGRESS.md). RG8 is core WebGL2, always filterable, and the
  // reconstruction math is exact because linear interpolation distributes
  // over the R*256+G split - hardware bilinear-filters R and G
  // independently, and (rf*256+gf)/257 in the shader below reconstructs
  // the same result as filtering the true 16-bit value directly.
  const packed = new Uint8Array(heights.length * 2);
  for (let i = 0; i < heights.length; i++) {
    const v = heights[i];
    packed[i * 2] = v >> 8;
    packed[i * 2 + 1] = v & 0xff;
  }

  const texture = new THREE.DataTexture(packed, width, height, THREE.RGFormat, THREE.UnsignedByteType);
  // manifest: row 0 = north edge. PlaneGeometry (rotated flat below) maps
  // V=1 -> north, V=0 -> south; DataTexture defaults flipY=false (row 0 ->
  // V=0), which would put north data at the south edge. flipY=true corrects
  // this (verified against the known Mont Blanc NW-corner peak, see
  // docs/PROGRESS.md).
  texture.flipY = true;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  const segmentsX = MESH_SEGMENTS_X;
  const segmentsZ = Math.max(1, Math.round(segmentsX * (worldDepth / worldWidth)));

  const geometry = new THREE.PlaneGeometry(worldWidth, worldDepth, segmentsX, segmentsZ);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    displacementMap: texture,
    displacementScale: elevMax - elevMin,
    displacementBias: elevMin,
    metalness: 0,
    roughness: 1,
  });
  // Three.js's built-in displacementmap_vertex chunk reads a single-channel
  // .x sample - swap in the R/G reconstruction instead (see texture setup
  // above for why the data is packed this way).
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      'transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );',
      `
      vec2 heightSample = texture2D( displacementMap, vDisplacementMapUv ).rg;
      float packedHeight = ( heightSample.r * 256.0 + heightSample.g ) / 257.0;
      transformed += normalize( objectNormal ) * ( packedHeight * displacementScale + displacementBias );
      `,
    );
  };

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'terrain';

  // CPU-side height query, in scene-local (x,z) meters - shared with the
  // build pipeline via src/heightfield.js, so this and the GPU texture
  // above can never disagree.
  function sampleHeight(x, z) {
    return sampleHeightfield(heights, manifest, x, z);
  }

  return { mesh, manifest, heights, sampleHeight };
}
