import * as THREE from 'three';
import { ATMO, ATMO_FOG_PARS, attachAtmo } from './atmosphere.js';
import { densify } from './polyline.js';

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

// The torrents (waterway=stream), shipped since 2026-08-18 - the user looked
// down on the two lakes at the head of the Val di Rhemes and said the plain
// truth: "non si vedono i torrenti in uscita dai due laghi". 1,506 of them,
// 1,226 km, same water shader as the rivers.
//
// Narrower and lower than a river, because that is what they are: 3 m against
// 8 m, and 1.5 m of clearance against 3 m. The clearance matters more than it
// sounds - a torrent runs in a gully the 10-20 m terrain grid rounds off, so
// lifting it 3 m like a valley river would leave it visibly floating over its
// own bed on the steep ground where most of these are.
const STREAM_WIDTH_M = 3;
// 1.5 -> 0.8 m on 2026-08-18, once the ribbon stopped flying over the dips
// between its vertices (FLOW_MAX_SEGMENT_M below): with the chord following the
// ground, the clearance is all that is left between the water and its bed, and
// 1.5 m of it reads as a torrent hovering. Measured after the change, on the
// ribbon the GPU actually draws: 0.82 m over the drawn surface at the median,
// 1.61 m at p99, 2.28 m at worst, and where it cuts into the bank instead it
// goes 1.24 m in - which is the right way round for water, since a stream
// disappearing slightly into its bed reads as the bed.
const STREAM_HEIGHT_OFFSET_M = 0.8;

// THE FALL ITSELF, rebuilt 2026-08-18: "Non è bellissima, penso si possa
// migliorare, anche usando più poligoni."
//
// It was a two-vertex-wide strip lying flat on the hillside - one quad per
// centerline step, no geometry across the width at all, so nothing could catch
// the light differently from one side of the water to the other and the sheet
// read as a painted stripe. Now it is a real sheet: COLUMNS quads across, and
// where the ground under it is steep the middle of the sheet stands proud of the
// slope, which is the one thing the terrain cannot give us. The DEM is 10-20 m
// per pixel, so the lip a fall pours over is rounded away before we ever see it;
// bowing the curtain outward puts back the shape the data lost, without
// pretending to know where the real cliff face is.
const WF_COLUMNS = 8;
const WF_LIFT_MAX_M = 4;
const WF_LIFT_PER_GRADE_M = 5; // a 0.8 grade lifts the middle by the full 4 m
// Streak length along the fall, in real metres - the flow attribute below counts
// metres so a 12 m fall and a 140 m one get the same size of streak rather than
// the same NUMBER of them.
const WF_STREAK_M = 6;
// THE GLACIERS ARE NOT DRAWN HERE ANY MORE (2026-08-19). They used to be a sheet: the
// outlines triangulated, every vertex seated on the terrain, refined to a 25 m maximum edge
// to make 563,567 triangles, and lifted 1 m off the rock to stay out of a z-fight.
//
// That construction was squeezed between two numbers and could not satisfy both. The lift
// had to stay UNDER the walker's 1.7 m eye height, or standing on a glacier put your head
// beneath a DoubleSide sheet - it did, at 2 m, and the user reported it. And it had to
// outrun the SAG, because a triangle's corners can be seated on the ground while its flat
// interior dips below it: median 0, worst 5% 0.30 m, worst 1% 0.80 m, one triangle 9.32 m.
// At 1 m of lift, 1.25% of the ice still showed rock through it, measured after the fact.
//
// The way out was the one written down as the open debt: draw the ice the way src/forest.js
// draws canopy - as a mask the terrain shader reads, so the ice IS the ground. No geometry,
// no sag, nothing to walk under, no offset to balance, and 563,567 triangles gone. See
// tools/build-glacier-mask.mjs, src/glaciermask.js and GLACIER_COLOR in src/terrain.js.
//
// What still comes from water.json here is the glacier NAMES and the manifest's credit; the
// outlines themselves are read by the build tool.

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
      attribute float aFlow;
      varying vec2 vUv;
      varying float vFlow;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vFlow = aFlow;
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        #include <logdepthbuf_vertex>
      }
    `,
    // The sheet is drawn with THREE things the flat strip could not have, all of
    // them from the geometry rewrite above (2026-08-18):
    //   - streaks spaced in real METRES (aFlow), so a 13 m fall and a 141 m one
    //     get streaks of the same size instead of the same count. The old shader
    //     divided the fall into six bands however long it was.
    //   - variation ACROSS the water, which needs the columns to exist: each
    //     one runs at its own phase, so the sheet breaks up into strands.
    //   - white water at the bottom and softer edges, which is where a real fall
    //     stops being water and starts being spray.
    fragmentShader: `
      #include <logdepthbuf_pars_fragment>
      uniform float uTime;
      uniform vec3 uColor;
      varying vec2 vUv;
      varying float vFlow;
      varying vec3 vWorldPos;
      ${NOISE_GLSL}
      ${ATMO_FOG_PARS}
      uniform vec3 uAtmoFogColor;
      void main() {
        float strand = noise(vec2(vUv.x * 14.0, vFlow * 0.06));
        float flow = fract(vFlow / ${WF_STREAK_M}.0 - uTime * 1.1 + strand * 0.55);
        float streak = smoothstep(0.0, 0.18, flow) * smoothstep(0.45, 0.18, flow);
        // Spray at the foot, and the thinning that makes the edges read as spray
        // rather than as a cut sheet of plastic.
        float foam = smoothstep(0.72, 1.0, vUv.y);
        float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
        float brightness = 0.72 + streak * 0.4 + foam * 0.3 + (1.0 - vUv.y) * 0.1;
        vec3 color = atmoApply(uColor * brightness, uAtmoFogColor, vWorldPos, cameraPosition);
        // Opaque down the strands, thinner between them and at the edges: the
        // old sheet was a flat 0.8 everywhere, which is why it read as one solid
        // object rather than as falling water.
        float alpha = clamp(0.5 + streak * 0.35 + foam * 0.25, 0.0, 1.0) * (0.3 + 0.7 * edge);
        gl_FragColor = vec4(color, alpha);
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
// The 25 m edge refinement that used to live here went with the glacier sheet on
// 2026-08-19 - it existed only to subdivide a glacier outline's kilometre-wide triangles,
// and nothing else in this file needs it: a lake surface is flat by nature, and the rivers
// and waterfalls are ribbons built from centrelines. Recover it from the history if a
// future draped surface ever needs adaptive subdivision; the reasoning is in the commit
// that removed it.

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

// Between two vertices a ribbon is flat, and a torrent's vertices are 41 m apart
// on average - so the water flew over every dip between them. Measured near
// Rifugio Benevolo before this was added: the chord left the drawn ground by up
// to 10.4 m in the air and 17.8 m under it (p99 5.0 m). Same defect the trails
// had, worse, because a stream runs in exactly the gully a straight line cuts
// across. See src/polyline.js.
const FLOW_MAX_SEGMENT_M = 10;

// One merged ribbon mesh for a whole set of flowing lines - the 21 rivers in one
// draw call, the 1,506 streams in another. Split by width rather than merged
// into a single mesh so each keeps its own ribbon width, and so alignToGround()
// below can give each its own clearance.
function buildFlowMesh(features, { widthM, heightOffsetM, name }) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const vertOffset = { value: 0 };
  for (const feature of features ?? []) {
    appendRibbon(densify(feature.line, FLOW_MAX_SEGMENT_M), () => widthM, heightOffsetM, positions, uvs, indices, vertOffset);
  }
  if (!positions.length) return null;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, buildWaterMaterial({ deep: RIVER_COLOR_DEEP, shallow: RIVER_COLOR_SHALLOW, flowing: true }));
  mesh.name = name;
  return mesh;
}

// One waterfall's sheet: WF_COLUMNS quads across the width, bowed away from the
// slope in proportion to how steep the ground under it is.
//
// Three attributes come out of this: position, uv (u across the sheet 0..1, v
// along it 0..1) and aFlow, the distance in real metres from the brink, which is
// what the shader scrolls its streaks along.
function appendWaterfallSheet(centerline, widthTopM, widthBottomM, positions, uvs, flows, indices, vertOffsetRef) {
  const n = centerline.length;
  if (n < 2) return;

  // Cumulative horizontal distance, so both the width taper and the streaks are
  // spaced by real metres rather than by however many samples the march took.
  const along = [0];
  for (let i = 1; i < n; i++) {
    const [x0, , z0] = centerline[i - 1];
    const [x1, , z1] = centerline[i];
    along.push(along[i - 1] + Math.hypot(x1 - x0, z1 - z0));
  }
  const total = along[n - 1] || 1;

  const base = vertOffsetRef.value;
  for (let i = 0; i < n; i++) {
    const [x, y, z] = centerline[i];
    const prev = centerline[Math.max(0, i - 1)];
    const next = centerline[Math.min(n - 1, i + 1)];
    const dx = next[0] - prev[0];
    const dz = next[2] - prev[2];
    const runXZ = Math.hypot(dx, dz) || 1;
    const px = -dz / runXZ; // perpendicular, in the XZ plane
    const pz = dx / runXZ;
    // How steeply the ground falls here, which is how far the sheet stands off it.
    const grade = Math.max(0, (prev[1] - next[1]) / runXZ);
    const lift = Math.min(WF_LIFT_MAX_M, grade * WF_LIFT_PER_GRADE_M);

    const t = along[i] / total;
    const half = (widthTopM + (widthBottomM - widthTopM) * t) / 2;
    for (let c = 0; c <= WF_COLUMNS; c++) {
      const u = c / WF_COLUMNS; // 0..1 across the sheet
      const side = u * 2 - 1; // -1..1
      // A curtain hangs furthest from the rock in the middle and touches it at
      // the edges - which is also what keeps the sheet from cutting into the
      // slope on either side.
      const bow = 1 - side * side;
      positions.push(x + px * side * half, y + lift * bow, z + pz * side * half);
      uvs.push(u, t);
      flows.push(along[i]);
    }
  }

  const stride = WF_COLUMNS + 1;
  for (let i = 0; i < n - 1; i++) {
    for (let c = 0; c < WF_COLUMNS; c++) {
      const a = base + i * stride + c;
      const b = a + 1;
      const d = a + stride;
      const e = d + 1;
      indices.push(a, d, b, b, d, e);
    }
  }
  vertOffsetRef.value += n * stride;
}

// Small N (hand-curated allowlist, tools/build-hydrology.mjs) - one merged
// sheet mesh for the falling water, plus one breathing mist sprite per
// waterfall, adapting the reference project ode-to-yosemite's approach
// (docs/PROGRESS.md).
function buildWaterfalls(waterfalls) {
  const positions = [];
  const uvs = [];
  const flows = [];
  const indices = [];
  const vertOffset = { value: 0 };
  const mistSprites = [];

  const mistTexture = buildMistTexture();

  for (const wf of waterfalls) {
    appendWaterfallSheet(wf.centerline, wf.widthTopM, wf.widthBottomM, positions, uvs, flows, indices, vertOffset);

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
    geometry.setAttribute('aFlow', new THREE.Float32BufferAttribute(flows, 1));
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

  const riversMesh = buildFlowMesh(manifest.rivers, {
    widthM: RIVER_WIDTH_M,
    heightOffsetM: RIVER_HEIGHT_OFFSET_M,
    name: 'water-rivers',
  });
  if (riversMesh) group.add(riversMesh);

  const streamsMesh = buildFlowMesh(manifest.streams, {
    widthM: STREAM_WIDTH_M,
    heightOffsetM: STREAM_HEIGHT_OFFSET_M,
    name: 'water-streams',
  });
  if (streamsMesh) group.add(streamsMesh);


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
      const offsetM = child.name === 'water-rivers' ? RIVER_HEIGHT_OFFSET_M
        : child.name === 'water-streams' ? STREAM_HEIGHT_OFFSET_M
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
