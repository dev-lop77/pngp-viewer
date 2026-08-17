import * as THREE from 'three';
import { ATMO, ATMO_FOG_PARS, attachAtmo } from './atmosphere.js';

// Lightweight custom shaders, not three.js's Water addon (real
// render-to-texture reflection) - with up to ~200 lakes potentially
// visible at once, a per-instance reflection pass risks the standing
// fluidity principle (docs/ARCHITECTURE.md §10). One shared uTime
// uniform object drives every animated material - update() below just
// sets its .value once per frame, no per-object clocks.
const time = { value: 0 };

const LAKE_COLOR_DEEP = new THREE.Color(0x0d3b57);
const LAKE_COLOR_SHALLOW = new THREE.Color(0x4fa8c9);
const RIVER_COLOR_DEEP = new THREE.Color(0x1c5b78);
const RIVER_COLOR_SHALLOW = new THREE.Color(0x8fd3e8);
const WATERFALL_COLOR = new THREE.Color(0xdff4fb);

const RIVER_WIDTH_M = 8;
const RIVER_HEIGHT_OFFSET_M = 3; // avoid z-fighting with terrain, like trails.js's HEIGHT_OFFSET_M
const GLACIER_HEIGHT_OFFSET_M = 2;
const GLACIER_COLOR = 0xe8f3fb;

const NOISE_GLSL = `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
`;

// Still-ish water (lakes) and flowing water (rivers) share the same
// fresnel + noise-ripple look; rivers add a directional UV-driven scroll
// on top so flow reads as moving downstream, not just shimmering in place.
// main.js's renderer uses logarithmicDepthBuffer: true. Three.js's built-in
// materials (terrain/trails/POI all use those) get the logdepthbuf GLSL
// chunks injected automatically; a fully custom ShaderMaterial does not -
// without them it writes ordinary linear depth into a buffer everything
// else reads as logarithmic, so it depth-tests as "behind" the terrain
// almost everywhere and renders as silently invisible (no console error at
// all - caught by an actual real-browser screenshot showing nothing,
// docs/PROGRESS.md). `#include <logdepthbuf_*>` are the standard chunks for
// making a hand-written ShaderMaterial cooperate with that mode.
//
// Phase 4 (docs/ARCHITECTURE.md §7): same lesson applies to atmosphere.js's
// fog patch - it only auto-instruments built-in materials (terrain/trails/
// POI/glaciers, see attachAtmo() calls in their own modules), not a
// hand-written one. ATMO_FOG_PARS + atmoApply() are included by hand below.
function buildWaterMaterial({ deep, shallow, flowing }) {
  return new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide, // ring winding from OSM data isn't guaranteed consistent
    uniforms: {
      uTime: time,
      uColorDeep: { value: deep },
      uColorShallow: { value: shallow },
      ...ATMO.uniforms,
    },
    vertexShader: `
      #include <common>
      #include <logdepthbuf_pars_vertex>
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying vec2 vUv;
      void main() {
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        #include <logdepthbuf_vertex>
      }
    `,
    fragmentShader: `
      #include <logdepthbuf_pars_fragment>
      uniform float uTime;
      uniform vec3 uColorDeep;
      uniform vec3 uColorShallow;
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying vec2 vUv;
      ${NOISE_GLSL}
      ${ATMO_FOG_PARS}
      uniform vec3 uAtmoFogColor; // not declared by ATMO_FOG_PARS itself - that's the built-in materials' job via three's own 'fogColor'; custom shaders declare it themselves (same as weather.js's cloud deck)
      void main() {
        ${
          flowing
            ? 'vec2 p = vec2(vUv.x * 8.0 - uTime * 1.6, vUv.y * 3.0);'
            : 'vec2 p = vWorldPos.xz * 0.02 + vec2(uTime * 0.05, uTime * 0.03);'
        }
        float ripple = noise(p) * 0.5 + noise(p * 2.3 + 7.0) * 0.5;
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(viewDir, normalize(vNormal)), 0.0), 3.0);
        vec3 color = mix(uColorDeep, uColorShallow, clamp(ripple * 0.5 + fresnel * 0.6, 0.0, 1.0));
        color = atmoApply(color, uAtmoFogColor, vWorldPos, cameraPosition);
        gl_FragColor = vec4(color, 0.72 + fresnel * 0.22);
        #include <logdepthbuf_fragment>
      }
    `,
  });
}

function waterfallMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: { uTime: time, uColor: { value: WATERFALL_COLOR }, ...ATMO.uniforms },
    vertexShader: `
      #include <common>
      #include <logdepthbuf_pars_vertex>
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        #include <logdepthbuf_vertex>
      }
    `,
    fragmentShader: `
      #include <logdepthbuf_pars_fragment>
      uniform float uTime;
      uniform vec3 uColor;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      ${NOISE_GLSL}
      ${ATMO_FOG_PARS}
      uniform vec3 uAtmoFogColor;
      void main() {
        float flow = fract(vUv.y * 6.0 - uTime * 1.4 + noise(vec2(vUv.x * 10.0, vUv.y * 2.0)) * 0.3);
        float streak = smoothstep(0.0, 0.15, flow) * smoothstep(0.4, 0.15, flow);
        float brightness = 0.75 + streak * 0.35 + (1.0 - vUv.y) * 0.15;
        vec3 color = atmoApply(uColor * brightness, uAtmoFogColor, vWorldPos, cameraPosition);
        gl_FragColor = vec4(color, 0.8);
        #include <logdepthbuf_fragment>
      }
    `,
  });
}

// [x, z] ring (closed - first === last) -> triangle indices via earcut,
// skipping malformed/self-intersecting OSM polygons rather than throwing
// (same "surface data-quality issues instead of crashing" instinct as
// build-trails.mjs's direction correction).
function triangulateRing(ring) {
  const pts = ring.slice(0, -1).map(([x, z]) => new THREE.Vector2(x, z));
  if (pts.length < 3) return null;
  try {
    const tris = THREE.ShapeUtils.triangulateShape(pts, []);
    if (!tris.length) return null;
    return { pts, tris };
  } catch {
    return null;
  }
}

// Merges all lakes into one draw call (§10 instancing principle) - each
// lake is flat at its own precomputed water level (tools/build-hydrology.mjs).
function buildLakesMesh(lakes) {
  const positions = [];
  const indices = [];
  let offset = 0;
  let skipped = 0;

  for (const lake of lakes) {
    const tri = triangulateRing(lake.ring);
    if (!tri) {
      skipped++;
      continue;
    }
    for (const p of tri.pts) positions.push(p.x, lake.waterLevelM, p.y);
    for (const [a, b, c] of tri.tris) indices.push(offset + a, offset + b, offset + c);
    offset += tri.pts.length;
  }
  if (skipped) console.warn(`water.js: skipped ${skipped}/${lakes.length} lake polygon(s) that failed to triangulate.`);
  if (!positions.length) return null;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, buildWaterMaterial({ deep: LAKE_COLOR_DEEP, shallow: LAKE_COLOR_SHALLOW, flowing: false }));
  mesh.name = 'water-lakes';
  return mesh;
}

// Merges all glacier footprints into one draw call, draped at their own
// per-vertex terrain height (offset up slightly to avoid z-fighting) -
// static, no animation, distinct icy material from the terrain itself.
function buildGlaciersMesh(glaciers) {
  const positions = [];
  const indices = [];
  let offset = 0;
  let skipped = 0;

  for (const glacier of glaciers) {
    const ring2D = glacier.ring.map(([x, , z]) => [x, z]);
    const tri = triangulateRing(ring2D);
    if (!tri) {
      skipped++;
      continue;
    }
    // tri.pts index order matches glacier.ring (minus the closing dup) 1:1
    for (let i = 0; i < tri.pts.length; i++) {
      const y = glacier.ring[i][1];
      positions.push(tri.pts[i].x, y + GLACIER_HEIGHT_OFFSET_M, tri.pts[i].y);
    }
    for (const [a, b, c] of tri.tris) indices.push(offset + a, offset + b, offset + c);
    offset += tri.pts.length;
  }
  if (skipped) console.warn(`water.js: skipped ${skipped}/${glaciers.length} glacier polygon(s) that failed to triangulate.`);
  if (!positions.length) return null;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = attachAtmo(new THREE.MeshStandardMaterial({ color: GLACIER_COLOR, roughness: 0.85, metalness: 0, side: THREE.DoubleSide }));
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'water-glaciers';
  return mesh;
}

// Builds one ribbon strip per line (river or waterfall centerline) and
// appends it into shared position/uv/index arrays - merges into a single
// draw call across all rivers, same instancing principle as trails.js.
// `widthAt(t)` lets waterfalls taper (narrow at the brink, wide at the base).
function appendRibbon(line, widthAt, heightOffsetM, positions, uvs, indices, vertOffsetRef) {
  const n = line.length;
  if (n < 2) return;
  let cumulative = 0;
  const base = vertOffsetRef.value;

  for (let i = 0; i < n; i++) {
    const [x, y, z] = line[i];
    const prev = line[Math.max(0, i - 1)];
    const next = line[Math.min(n - 1, i + 1)];
    const dx = next[0] - prev[0];
    const dz = next[2] - prev[2];
    const len = Math.hypot(dx, dz) || 1;
    const px = -dz / len; // perpendicular, in the XZ plane
    const pz = dx / len;
    const half = widthAt(i / (n - 1)) / 2;

    positions.push(x + px * half, y + heightOffsetM, z + pz * half);
    positions.push(x - px * half, y + heightOffsetM, z - pz * half);
    const t = i / (n - 1);
    uvs.push(t, 0, t, 1);

    if (i > 0) cumulative += Math.hypot(x - line[i - 1][0], z - line[i - 1][2]);
    if (i < n - 1) {
      const a = base + i * 2;
      const b = a + 1;
      const c = base + (i + 1) * 2;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  vertOffsetRef.value += n * 2;
}

function buildRiversMesh(rivers) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const vertOffset = { value: 0 };
  for (const river of rivers) {
    appendRibbon(river.line, () => RIVER_WIDTH_M, RIVER_HEIGHT_OFFSET_M, positions, uvs, indices, vertOffset);
  }
  if (!positions.length) return null;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, buildWaterMaterial({ deep: RIVER_COLOR_DEEP, shallow: RIVER_COLOR_SHALLOW, flowing: true }));
  mesh.name = 'water-rivers';
  return mesh;
}

// Small N (hand-curated allowlist, tools/build-hydrology.mjs) - one merged
// ribbon mesh for the flowing water, plus one breathing mist sprite per
// waterfall, adapting the reference project ode-to-yosemite's approach
// (docs/PROGRESS.md).
function buildWaterfalls(waterfalls) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const vertOffset = { value: 0 };
  const mistSprites = [];

  const mistTexture = buildMistTexture();

  for (const wf of waterfalls) {
    const widthAt = (t) => wf.widthTopM + (wf.widthBottomM - wf.widthTopM) * t;
    appendRibbon(wf.centerline, widthAt, 0, positions, uvs, indices, vertOffset);

    const base = wf.centerline[wf.centerline.length - 1];
    const spriteMaterial = new THREE.SpriteMaterial({
      map: mistTexture,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      // SpriteMaterial's stock shader includes fog_vertex but has no
      // 'transformed' variable (different vertex construction than a Mesh) -
      // atmosphere.js's patched chunk assumes it exists, so this would be a
      // real GLSL compile error otherwise. Same opt-out the reference
      // project uses for its own Sprite/Points materials.
      fog: false,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(base[0], base[1] + 8, base[2]);
    const baseScale = 20 + Math.min(60, wf.dropM) * 0.6;
    sprite.scale.set(baseScale, baseScale, 1);
    sprite.name = `mist-${wf.name}`;
    mistSprites.push({ sprite, baseScale, phase: Math.random() * Math.PI * 2 });
  }

  const group = new THREE.Group();
  group.name = 'waterfalls';

  if (positions.length) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, waterfallMaterial());
    mesh.name = 'waterfall-ribbons';
    group.add(mesh);
  }
  for (const { sprite } of mistSprites) group.add(sprite);

  return { group, mistSprites };
}

// Small radial-gradient canvas texture, reused for every waterfall's mist
// sprite - no need to fetch/ship an image asset for this.
function buildMistTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export async function loadWater(dataUrl = `${import.meta.env.BASE_URL}data`) {
  const manifest = await fetch(`${dataUrl}/water.json`).then((r) => r.json());

  const group = new THREE.Group();
  group.name = 'water';

  const lakesMesh = buildLakesMesh(manifest.lakes);
  if (lakesMesh) group.add(lakesMesh);

  const riversMesh = buildRiversMesh(manifest.rivers);
  if (riversMesh) group.add(riversMesh);

  const glaciersMesh = buildGlaciersMesh(manifest.glaciers);
  if (glaciersMesh) group.add(glaciersMesh);

  const { group: waterfallsGroup, mistSprites } = buildWaterfalls(manifest.waterfalls);
  group.add(waterfallsGroup);

  function update(elapsedSeconds) {
    time.value = elapsedSeconds;
    for (const { sprite, baseScale, phase } of mistSprites) {
      const s = baseScale * (1 + 0.12 * Math.sin(elapsedSeconds * 0.7 + phase));
      sprite.scale.set(s, s, 1);
    }
  }

  // Re-seat the water on the surface the terrain actually DRAWS, the same treatment
  // trails.js and poi.js give their own geometry and for the same reason:
  // tools/build-hydrology.mjs baked true heightfield elevations into water.json, and
  // that is not the surface on screen.
  //
  // It exists because of a bug the user found (2026-08-17): "se vai a Le Pont, c'è un
  // torrente e non è ancorato al terreno con i modelli Medium e High Terrain". The
  // height tier moves the drawn surface by up to 44 m, and this module had no idea -
  // measured at Le Pont, a river ribbon that sits within 3.7 m of the ground without
  // the tier floated up to 11.9 m above it with the 10 m level on.
  //
  // NOT every child, and the exclusions are the substance of this function:
  //
  //   LAKES are left alone. A lake surface is LEVEL - that is what makes it a lake -
  //   so following the bed would tilt it into a ramp. That leaves a real open question
  //   the tier creates and this cannot answer: if the finer ground rises inside a
  //   basin, the lake at its fixed waterLevelM is buried by it. Wrong in a different
  //   way than a tilted lake would be, and the choice belongs to whoever owns the
  //   hydrology data, not to a re-seating pass.
  //
  //   WATERFALLS are left alone because they are vertical: seating every vertex a
  //   fixed height above the ground under it would flatten the fall into a puddle.
  //   Their top and bottom would each need to follow their own end of the drop, which
  //   is a change to how they are built rather than a pass over the buffer.
  function alignToGround(heightAt) {
    for (const child of group.children) {
      const offsetM = child.name === 'water-glaciers' ? GLACIER_HEIGHT_OFFSET_M
        : child.name === 'water-rivers' ? RIVER_HEIGHT_OFFSET_M
          : null;
      if (offsetM === null) continue; // lakes and the waterfall group - see above
      const attr = child.geometry?.getAttribute('position');
      if (!attr) continue;
      const a = attr.array;
      for (let i = 0; i < a.length; i += 3) {
        const y = heightAt(a[i], a[i + 2]);
        if (Number.isFinite(y)) a[i + 1] = y + offsetM;
      }
      attr.needsUpdate = true;
      // Moved vertices would otherwise be culled against a stale bound, exactly as in
      // trails.js's alignToGround.
      child.geometry.computeBoundingSphere();
    }
  }

  return { group, manifest, update, alignToGround };
}
