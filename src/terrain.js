import * as THREE from 'three';
import { setLocalOrigin } from './geo.js';
import { sampleHeightfield, sampleRenderedHeightfield } from './heightfield.js';
import { attachAtmo } from './atmosphere.js';

// Quadtree-LOD terrain (docs/ARCHITECTURE.md §12's tile/LOD item, pulled
// forward from phase 7 on 2026-08-03). It replaced a single 256x147 mesh
// spanning the whole 84x48 km bbox - ~328 m per quad, which was not merely
// coarse-looking: it drew Gran Paradiso's summit 130 m below its real 4047 m,
// left every peak unviewable from any distance, and made the new label
// occlusion test unable to tell a real mountain from an interpolation
// artefact. See docs/PROGRESS.md 2026-08-03.
//
// The height data is one texture that is already fully resident (4096x2355
// RG8, ~19 MB), so unlike a typical tiled terrain there is NOTHING to stream -
// only the geometry is subdivided. Tiles derive their texture coordinates from
// their world position in the vertex shader, so every tile at every level
// shares one material and one geometry per level.
const TILE_SEGMENTS = 32; // quads per tile edge
const MAX_DEPTH = 7; // 84 km / (2^7 * 32) -> 20.5 m cells, i.e. the heightfield's own resolution
const SPLIT_FACTOR = 1.5; // subdivide while the camera is within tileSize * this
// Tiles of differing depth meet with a T-junction, so the finer tile's extra
// edge vertices leave a crack. A downward skirt on every tile border hides
// them - far simpler than matching edge vertices to the coarser neighbour, and
// invisible because it only ever shows through a gap it is filling.
const SKIRT_DEPTH_M = 150;

export { TILE_SEGMENTS, MAX_DEPTH };

// GLSL needs a decimal point (or an exponent) to read a literal as a float.
function glsl(n) {
  const s = n.toPrecision(12);
  return s.includes('.') || s.includes('e') ? s : `${s}.0`;
}

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
  // fallback, it's a hard WebGL error). RG8 is core WebGL2, always
  // filterable, and the reconstruction below is exact because linear
  // interpolation distributes over the R*256+G split - hardware
  // bilinear-filters R and G independently, and (r*256+g)/257 recovers the
  // same result as filtering the true 16-bit value.
  const packed = new Uint8Array(heights.length * 2);
  for (let i = 0; i < heights.length; i++) {
    const v = heights[i];
    packed[i * 2] = v >> 8;
    packed[i * 2 + 1] = v & 0xff;
  }

  const texture = new THREE.DataTexture(packed, width, height, THREE.RGFormat, THREE.UnsignedByteType);
  // manifest: row 0 = north edge. terrainUv() below maps north (-Z, since
  // §6 fixes +Z = South) to V=1; DataTexture defaults flipY=false (row 0 ->
  // V=0), which would put north data at the south edge. flipY=true corrects
  // this (verified against the known Mont Blanc NW-corner peak).
  texture.flipY = true;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    displacementMap: texture, // makes three declare displacementMap/Scale/Bias; the sampling itself is ours
    displacementScale: elevMax - elevMin,
    displacementBias: elevMin,
    metalness: 0,
    roughness: 1,
  });

  // Everything below is injected at the #include DIRECTIVES, not at the
  // resolved GLSL. onBeforeCompile runs before three resolves includes
  // (WebGLRenderer calls it at the getProgram stage; resolveIncludes happens
  // later inside WebGLProgram), so replacing an inlined chunk body silently
  // matches nothing. That is exactly what the previous version of this file
  // did: its replacement of the displacement line never applied, so the
  // terrain had always been drawn by three's stock chunk, which reads only
  // `.x` - the packed HIGH byte alone. Rendered elevation was therefore off
  // by (high - low)/65535 of the range, i.e. up to +/-17.6 m of pseudo-random
  // per-texel noise, and the RG8 reconstruction this file documents had never
  // actually run. Found 2026-08-03 while adding LOD; see docs/PROGRESS.md.
  const HELPERS = /* glsl */ `
    vec2 terrainUv( vec2 wxz ) {
      return vec2( ( wxz.x + ${glsl(worldWidth / 2)} ) / ${glsl(worldWidth)},
                   ( ${glsl(worldDepth / 2)} - wxz.y ) / ${glsl(worldDepth)} );
    }
    float terrainElevation( vec2 uv ) {
      vec2 s = texture2D( displacementMap, uv ).rg;
      return ( ( s.r * 256.0 + s.g ) / 257.0 ) * displacementScale + displacementBias;
    }
  `;

  // Real per-vertex normals, computed from the height texture at its own
  // resolution. Three does not derive normals from a displacementMap, so the
  // old terrain was lit with every normal pointing straight up: no slope
  // shading at all, and the only depth cue was aerial-perspective fog. Finer
  // geometry alone would not have fixed that.
  const NORMALS = /* glsl */ `
    vec2 wTerrainXZ = ( modelMatrix * vec4( position, 1.0 ) ).xz;
    vec2 tUv = terrainUv( wTerrainXZ );
    float hW = terrainElevation( tUv - vec2( ${glsl(1 / width)}, 0.0 ) );
    float hE = terrainElevation( tUv + vec2( ${glsl(1 / width)}, 0.0 ) );
    float hN = terrainElevation( tUv + vec2( 0.0, ${glsl(1 / height)} ) );
    float hS = terrainElevation( tUv - vec2( 0.0, ${glsl(1 / height)} ) );
    vec3 objectNormal = normalize( vec3(
      ( hW - hE ) / ${glsl(2 * resX)},
      1.0,
      ( hN - hS ) / ${glsl(2 * resY)}
    ) );
  `;

  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <displacementmap_pars_vertex>', `#include <displacementmap_pars_vertex>\n${HELPERS}`)
      // V increases northward while world Z increases southward (§6), so hN is
      // the +V sample and the z gradient is (hN - hS), matching terrainUv().
      .replace('#include <beginnormal_vertex>', NORMALS)
      // Purely vertical, unlike the stock chunk's displacement along the
      // normal - which now really is the slope normal, so displacing along it
      // would shear the terrain sideways. Keeps each tile's skirt offset
      // (position.y = -SKIRT_DEPTH_M) intact.
      .replace('#include <displacementmap_vertex>', 'transformed.y += terrainElevation( tUv );');
  };
  attachAtmo(material); // phase 4: aerial-perspective fog (docs/ARCHITECTURE.md §7)

  // One geometry per depth, sized in real metres, so tile meshes need only a
  // translation. Deliberately NOT one unit geometry scaled per tile: tiles are
  // not square (the bbox is 83884 x 48225 m), and a non-uniform scale would go
  // through three's normalMatrix and shear the world-space normals computed
  // above.
  const geometries = [];
  for (let depth = 0; depth <= MAX_DEPTH; depth++) {
    geometries.push(buildTileGeometry(TILE_SEGMENTS, worldWidth / 2 ** depth, worldDepth / 2 ** depth));
  }

  const group = new THREE.Group();
  group.name = 'terrain';
  const pool = [];
  const stats = { tiles: 0, deepest: 0 };

  const frustum = new THREE.Frustum();
  const projScreen = new THREE.Matrix4();
  const nodeBox = new THREE.Box3();

  function update(camera) {
    camera.updateMatrixWorld();
    projScreen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreen);

    let used = 0;
    let deepest = 0;

    const place = (cx, cz, depth) => {
      let mesh = pool[used];
      if (!mesh) {
        mesh = new THREE.Mesh(geometries[depth], material);
        mesh.frustumCulled = false; // culled by the traversal below, against the real elevation range
        pool.push(mesh);
        group.add(mesh);
      } else if (mesh.geometry !== geometries[depth]) {
        mesh.geometry = geometries[depth];
      }
      mesh.position.set(cx, 0, cz);
      mesh.visible = true;
      used++;
      if (depth > deepest) deepest = depth;
    };

    const walk = (cx, cz, halfW, halfD, depth) => {
      // Frustum test against the tile's full vertical extent - the geometry's
      // own bounds are meaningless here, since displacement happens on the GPU.
      nodeBox.min.set(cx - halfW, elevMin - SKIRT_DEPTH_M, cz - halfD);
      nodeBox.max.set(cx + halfW, elevMax, cz + halfD);
      if (!frustum.intersectsBox(nodeBox)) return;

      if (depth < MAX_DEPTH) {
        // Distance to the tile, not to its centre, so a large tile the camera
        // stands on always refines (and the tile under the camera therefore
        // always reaches MAX_DEPTH - which sampleRenderedHeight() relies on).
        const dx = Math.max(0, Math.abs(camera.position.x - cx) - halfW);
        const dz = Math.max(0, Math.abs(camera.position.z - cz) - halfD);
        if (Math.hypot(dx, dz) < Math.max(halfW, halfD) * 2 * SPLIT_FACTOR) {
          const qw = halfW / 2;
          const qd = halfD / 2;
          walk(cx - qw, cz - qd, qw, qd, depth + 1);
          walk(cx + qw, cz - qd, qw, qd, depth + 1);
          walk(cx - qw, cz + qd, qw, qd, depth + 1);
          walk(cx + qw, cz + qd, qw, qd, depth + 1);
          return;
        }
      }
      place(cx, cz, depth);
    };

    walk(0, 0, worldWidth / 2, worldDepth / 2, 0);

    for (let i = used; i < pool.length; i++) pool[i].visible = false;
    stats.tiles = used;
    stats.deepest = deepest;
  }

  // CPU-side height query in scene-local (x,z) metres - the true bilinear
  // heightfield value, shared with the build pipeline via src/heightfield.js.
  function sampleHeight(x, z) {
    return sampleHeightfield(heights, manifest, x, z);
  }

  // Height of the surface actually DRAWN, which is what anything touching the
  // visible ground must use (standing on it, planting a marker on it, landing
  // a fly-to on it, testing whether it hides a label). Modelled at MAX_DEPTH
  // because the tile containing the camera always refines that far - and at
  // 20.5 m cells this is now within a metre or two of sampleHeight() anyway,
  // where the old 328 m mesh differed from it by 29 m on average.
  const finestSegments = TILE_SEGMENTS * 2 ** MAX_DEPTH;
  function sampleRenderedHeight(x, z) {
    return sampleRenderedHeightfield(heights, manifest, finestSegments, finestSegments, x, z);
  }

  return { object: group, manifest, heights, sampleHeight, sampleRenderedHeight, update, stats };
}

// A flat grid in XZ (displaced on the GPU) plus a skirt hanging off all four
// borders. Winding for each skirt face was derived per edge so they face
// outward rather than being backface-culled away.
function buildTileGeometry(segments, sizeX, sizeZ) {
  const n = segments + 1;
  const gridCount = n * n;
  const total = gridCount + 4 * n;
  const positions = new Float32Array(total * 3);
  const normals = new Float32Array(total * 3);
  const uvs = new Float32Array(total * 2);
  const idx = (ix, iz) => iz * n + ix;

  const put = (i, x, y, z, u, v) => {
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    normals[i * 3 + 1] = 1; // overwritten in the vertex shader; three still needs the attribute
    uvs[i * 2] = u;
    uvs[i * 2 + 1] = v;
  };

  for (let iz = 0; iz <= segments; iz++) {
    for (let ix = 0; ix <= segments; ix++) {
      const u = ix / segments;
      const v = iz / segments;
      put(idx(ix, iz), (u - 0.5) * sizeX, 0, (v - 0.5) * sizeZ, u, v);
    }
  }

  // Skirt duplicates of each border vertex, one block per edge.
  const MIN_Z = gridCount;
  const MAX_Z = gridCount + n;
  const MIN_X = gridCount + 2 * n;
  const MAX_X = gridCount + 3 * n;
  for (let k = 0; k <= segments; k++) {
    const t = k / segments;
    put(MIN_Z + k, (t - 0.5) * sizeX, -SKIRT_DEPTH_M, -0.5 * sizeZ, t, 0);
    put(MAX_Z + k, (t - 0.5) * sizeX, -SKIRT_DEPTH_M, 0.5 * sizeZ, t, 1);
    put(MIN_X + k, -0.5 * sizeX, -SKIRT_DEPTH_M, (t - 0.5) * sizeZ, 0, t);
    put(MAX_X + k, 0.5 * sizeX, -SKIRT_DEPTH_M, (t - 0.5) * sizeZ, 1, t);
  }

  const indices = [];
  for (let iz = 0; iz < segments; iz++) {
    for (let ix = 0; ix < segments; ix++) {
      const a = idx(ix, iz);
      const b = idx(ix, iz + 1);
      const c = idx(ix + 1, iz + 1);
      const d = idx(ix + 1, iz);
      indices.push(a, b, d, b, c, d); // same winding three's PlaneGeometry uses
    }
  }
  // quad(g0, g1, s0, s1) with g0->g1 chosen per edge so the face points outward
  const quad = (g0, g1, s0, s1) => indices.push(g0, g1, s0, g1, s1, s0);
  for (let k = 0; k < segments; k++) {
    quad(idx(k, 0), idx(k + 1, 0), MIN_Z + k, MIN_Z + k + 1); // -Z
    quad(idx(k + 1, segments), idx(k, segments), MAX_Z + k + 1, MAX_Z + k); // +Z
    quad(idx(0, k + 1), idx(0, k), MIN_X + k + 1, MIN_X + k); // -X
    quad(idx(segments, k), idx(segments, k + 1), MAX_X + k, MAX_X + k + 1); // +X
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}
