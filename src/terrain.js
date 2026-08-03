import * as THREE from 'three';
import { setLocalOrigin } from './geo.js';
import { sampleHeightfield, sampleRenderedHeightfield } from './heightfield.js';
import { attachAtmo } from './atmosphere.js';
import { FOREST_MASK } from './forest.js';

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
// Exported for tools/test-terrain-albedo.mjs, so the test asserts against this
// table rather than a second copy of the numbers that could drift from it.
export { VEGETATION_BANDS, BAND_NOISE_M, ASPECT_SHIFT_M, ROCK_COLOR, SLOPE_ROCK_TO };
export { FOREST_FLOOR_COLOR, FOREST_FLOOR_MIX };

// GLSL needs a decimal point (or an exponent) to read a literal as a float.
function glsl(n) {
  const s = n.toPrecision(12);
  return s.includes('.') || s.includes('e') ? s : `${s}.0`;
}

// Shader literals must be in the linear working space, and THREE.Color already
// puts them there: with ColorManagement enabled (three's default since r152)
// `new Color(hex)` treats the hex as sRGB and converts on assignment. Calling
// convertSRGBToLinear() on top of that darkens everything by a second gamma -
// 0x6d became 0.020 instead of 0.153 - so it is deliberately absent here.
function glslRgb(hex) {
  const c = new THREE.Color(hex);
  return `vec3( ${glsl(c.r)}, ${glsl(c.g)}, ${glsl(c.b)} )`;
}

// A replace() whose marker silently doesn't match is exactly how the RG8
// displacement bug survived from phase 1 unnoticed (see the comment below), so
// every shader edit in this file goes through this instead of String.replace.
function patch(source, marker, replacement) {
  if (!source.includes(marker)) {
    throw new Error(`terrain.js: shader marker not found, three.js internals may have changed: ${marker}`);
  }
  return source.replace(marker, replacement);
}

// Vegetation bands, phase 6. The elevations are the five Alpine zones the
// original UE5 extraction report worked out for this exact DEM
// (docs/ARCHITECTURE.md §5), which had been sitting unused since phase 1 -
// until now the terrain was drawn a flat white, so the only shape cues were
// slope shading and fog. `top` is the elevation where the band gives way to
// the next one; colours are albedo under a real sun (the material is lit, not
// pre-shaded), so they read lighter here than the final image.
// These hexes look washed out as swatches, and that is correct - do not
// "fix" them by darkening. They are ALBEDO, not appearance. three's Lambert
// BRDF divides by PI, so with the midday preset's sun 1.8 + ambient 0.6 and
// exposure 0.75, a plausible-looking #3f5233 forest green renders as very
// nearly black (measured: the whole valley view came out at rgb ~20). Each hex
// below was solved backwards from the colour the band should show on screen -
// see tools/dev/solve-albedo.mjs, which prints the target next to the result.
const VEGETATION_BANDS = [
  { name: 'valley', top: 800, color: 0xa1bb75 }, // pasture/cultivated valley floor
  { name: 'montane', top: 1600, color: 0x739165 }, // larch & fir forest
  { name: 'subalpine', top: 2200, color: 0x8da46c }, // rhododendron/blueberry scrub
  { name: 'meadow', top: 3000, color: 0xb8be89 }, // alpine meadow, drier and yellower
  { name: 'rocky', top: 3800, color: 0xb3aa9f }, // bare rock and scree
  // Snow is the one band whose target is unreachable: even albedo 1.0 only
  // reaches rgb(195) at this exposure, so this is deliberately near-white and
  // simply as bright as the rig allows, with a slight blue cast kept.
  { name: 'nival', top: Infinity, color: 0xf6f9ff }, // permanent snow and ice
];
const BAND_BLEND_M = 150; // vertical softness of a boundary; real treelines are not contour lines
const BAND_NOISE_M = 75; // breaks the remaining contour banding
const ASPECT_SHIFT_M = 50; // north-facing slopes are colder, so their treeline sits lower
const ROCK_COLOR = 0xb3aa9f; // == the rocky band; steep ground is bare regardless of altitude
// Ground inside the OSM canopy mask (src/forest.js). Tinting the terrain as well
// as drawing trees is what makes forest read across the whole park: the trees
// themselves only reach a few hundred metres, so without this the near field
// would be wooded and the same hillside bare a kilometre away. Also solved
// backwards from its intended on-screen colour.
// Distinctly darker than the meadow band it usually borders: a first attempt at
// #516b45 was so close to the subalpine green that dense forest was invisible
// from a distance, which defeats the point of tinting at all.
const FOREST_FLOOR_COLOR = 0x667d5e;
const FOREST_FLOOR_MIX = 0.9;
const SLOPE_ROCK_FROM = 0.87; // cos of slope: ~30 deg, where soil starts failing to hold
const SLOPE_ROCK_TO = 0.6; // ~53 deg, cliff - fully bare

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
    varying float vTerrainElev;
    varying vec3 vTerrainNormal;
    varying vec2 vTerrainXZ;
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
    // Safe to hand the fragment shader as a world-space normal: every tile's
    // modelMatrix is a pure translation (see the geometries[] comment below),
    // so object and world orientation are the same here. Passing it as a
    // varying rather than recomputing per-pixel costs 4 texture taps less, at
    // the price of slope being interpolated across a quad - only visible on
    // distant coarse tiles, which fog washes out anyway.
    vTerrainNormal = objectNormal;
  `;

  // Elevation-banded albedo, computed per pixel. `h` is deliberately the
  // INTERPOLATED elevation, not a fresh texture sample: it then matches the
  // surface actually being drawn, so on a coarse distant tile the colour
  // follows the silhouette instead of disagreeing with it.
  const bandMix = VEGETATION_BANDS.slice(1)
    .map((band, i) => {
      const boundary = VEGETATION_BANDS[i].top;
      return `      albedo = mix( albedo, ${glslRgb(band.color)}, smoothstep( ${glsl(boundary - BAND_BLEND_M)}, ${glsl(boundary + BAND_BLEND_M)}, h ) );`;
    })
    .join('\n');

  const ALBEDO = /* glsl */ `
    varying float vTerrainElev;
    varying vec3 vTerrainNormal;
    varying vec2 vTerrainXZ;
    uniform sampler2D uForestMask;

    float terrainHash( vec2 p ) {
      return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453123 );
    }
    float terrainNoise( vec2 p ) {
      vec2 i = floor( p );
      vec2 f = fract( p );
      vec2 u = f * f * ( 3.0 - 2.0 * f );
      return mix( mix( terrainHash( i ), terrainHash( i + vec2( 1.0, 0.0 ) ), u.x ),
                  mix( terrainHash( i + vec2( 0.0, 1.0 ) ), terrainHash( i + vec2( 1.0, 1.0 ) ), u.x ), u.y );
    }

    vec3 terrainAlbedo() {
      vec3 n = normalize( vTerrainNormal );
      // Two octaves, at valley scale and at stand scale, so band boundaries
      // wander instead of ringing the mountains as contour lines.
      float wobble = ( terrainNoise( vTerrainXZ / 900.0 ) - 0.5 )
                   + ( terrainNoise( vTerrainXZ / 260.0 ) - 0.5 ) * 0.5;
      // +Z is South (§6), so n.z < 0 faces north: colder, vegetation stops
      // lower. Subtracting shifts south-facing ground the other way, which is
      // also right.
      float h = vTerrainElev + wobble * ${glsl(BAND_NOISE_M)} - n.z * ${glsl(ASPECT_SHIFT_M)};

      vec3 albedo = ${glslRgb(VEGETATION_BANDS[0].color)};
${bandMix}

      // Real forest, from OSM. Same UV mapping as terrainUv() - the mask is on
      // the heightfield's own grid, which is the whole point of building it that
      // way. Slope is already baked out of the mask, so this cannot fight the
      // rock term below.
      vec2 fUv = vec2( ( vTerrainXZ.x + ${glsl(worldWidth / 2)} ) / ${glsl(worldWidth)},
                       ( ${glsl(worldDepth / 2)} - vTerrainXZ.y ) / ${glsl(worldDepth)} );
      float wood = texture2D( uForestMask, fUv ).r;
      albedo = mix( albedo, ${glslRgb(FOREST_FLOOR_COLOR)}, wood * ${glsl(FOREST_FLOOR_MIX)} );

      // Steep ground is bare whatever its altitude - nothing roots on a cliff,
      // and snow doesn't sit on one either. Ascending edges only: GLSL leaves
      // smoothstep undefined when edge0 >= edge1, so this can't be written as
      // a descending smoothstep on n.y.
      float bare = 1.0 - smoothstep( ${glsl(SLOPE_ROCK_TO)}, ${glsl(SLOPE_ROCK_FROM)}, n.y );
      return mix( albedo, ${glslRgb(ROCK_COLOR)}, bare * 0.9 );
    }
  `;

  material.onBeforeCompile = (shader) => {
    // Shared holder, not the texture itself: the mask downloads independently of
    // the terrain, and this way neither has to wait for the other.
    shader.uniforms.uForestMask = FOREST_MASK;

    let vs = shader.vertexShader;
    vs = patch(vs, '#include <displacementmap_pars_vertex>', `#include <displacementmap_pars_vertex>\n${HELPERS}`);
    // V increases northward while world Z increases southward (§6), so hN is
    // the +V sample and the z gradient is (hN - hS), matching terrainUv().
    vs = patch(vs, '#include <beginnormal_vertex>', NORMALS);
    // Purely vertical, unlike the stock chunk's displacement along the
    // normal - which now really is the slope normal, so displacing along it
    // would shear the terrain sideways. Keeps each tile's skirt offset
    // (position.y = -SKIRT_DEPTH_M) intact.
    //
    // vTerrainElev takes the sampled height rather than transformed.y so that
    // skirt vertices, which sit SKIRT_DEPTH_M lower, are still coloured like
    // the edge they hang from.
    vs = patch(
      vs,
      '#include <displacementmap_vertex>',
      `float terrainH = terrainElevation( tUv );
      transformed.y += terrainH;
      vTerrainElev = terrainH;
      vTerrainXZ = wTerrainXZ;`,
    );
    shader.vertexShader = vs;

    let fs = shader.fragmentShader;
    fs = patch(fs, '#include <common>', `#include <common>\n${ALBEDO}`);
    // Multiplied, not assigned, so material.color stays a working global tint.
    fs = patch(fs, '#include <map_fragment>', '#include <map_fragment>\n  diffuseColor.rgb *= terrainAlbedo();');
    shader.fragmentShader = fs;
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

  // heightTexture is exported for src/vegetation.js, which displaces trees onto
  // the same surface in its own vertex shader.
  return { object: group, manifest, heights, heightTexture: texture, sampleHeight, sampleRenderedHeight, update, stats };
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
