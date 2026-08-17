import * as THREE from 'three';
import { SETS, buildVariant, TREE_COLOR, TREE_RADIUS_RATIO } from './model-candidates.js';

// The bench that draws tools/dev/model-candidates.js side by side. See the HTML
// for why it lives here and not in the app.
//
// Two things it takes from the app deliberately, because a shape judged under the
// wrong light is judged wrongly: the renderer's tone mapping and colour space
// (ACES filmic, sRGB output) and the two light intensities from main.js. It does
// NOT attach the aerial-perspective fog - that shades by distance from the real
// camera in the real scene, and at bench range it would only mute the comparison.
const params = new URLSearchParams(location.search);
const setName = params.get('set') ?? 'ibex';
const set = SETS[setName];
if (!set) throw new Error(`unknown set "${setName}" - have: ${Object.keys(SETS).join(', ')}`);
// Viewing distance in metres. The whole question is what a model looks like at
// the range you actually meet it, so this is a parameter and every screenshot
// says which one it used.
const distM = Number(params.get('dist') ?? (set.heightM > 4 ? 22 : 7));
const showWire = params.get('wire') === '1';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
// The MIDDAY stop from src/lighting.js, not main.js's construction defaults:
// exposure 0.75, sun 1.8 and ambient 0.6, each times the neutral weather
// modifier's `dark: 0.06`. The first pass used the constructor values against a
// near-black bench and every candidate came back muddy - which is not how any of
// them will ever be seen, and a shape judged in the dark is judged wrongly.
renderer.toneMappingExposure = 0.75;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
// Bright, because the park is: an ibex on a sunlit slope is seen against pale
// turf and a bright sky, and its coat is a dark albedo read against those.
scene.background = new THREE.Color(0x9fb2c6);

scene.add(new THREE.AmbientLight(0xffffff, 0.6 * (1 - 0.06 * 0.5)));
const sun = new THREE.DirectionalLight(0xffffff, 1.8 * (1 - 0.06 * 0.85));
// Over the camera's left shoulder, not behind the models: the first pass put the
// sun beyond them and every candidate came back as a silhouette, which compares
// outlines and hides exactly the surface detail being judged. High enough to lift
// the coat, oblique enough that a flat-shaded body's facets still separate.
sun.position.set(-0.5, 0.78, 0.85).normalize().multiplyScalar(100);
scene.add(sun);

// A ground plane, so the models are read standing on something and a hoof that
// hovers is visible as one.
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400),
  new THREE.MeshStandardMaterial({ color: 0x8d9179, roughness: 1, metalness: 0 }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// One material per variant, because `smooth` is per candidate. Same parameters as
// the shipped ones otherwise (src/wildlife.js's coat material and
// src/vegetation.js's canopy material), minus the atmosphere patch.
function materialFor(variant, colored) {
  return new THREE.MeshStandardMaterial({
    ...(colored ? { vertexColors: true } : { color: TREE_COLOR }),
    roughness: colored ? 0.92 : 0.95,
    metalness: 0,
    flatShading: !variant.smooth,
  });
}

const colored = setName !== 'tree';
const built = set.variants.map((v) => ({ variant: v, ...buildVariant(v, { colored }) }));

// Three-quarter front, so a heading is one yaw. Declared before the spacing
// because the spacing depends on how wide the models are AT this angle.
const YAW = 0.62;

// Spacing from the models' MEASURED footprint, not from their height. A fox is
// 1.1 m long and 0.54 m tall, so spacing by height (the first pass) overlapped
// two of them and hid the very brush the candidate was adding. The width that
// matters is the rotated one: a box dx by dz turned by YAW spans
// |dx cos| + |dz sin| across the screen.
const spanM = (() => {
  let widest = 0;
  for (const b of built) {
    b.geometry.computeBoundingBox();
    const bb = b.geometry.boundingBox;
    const s = setName === 'tree' ? TREE_RADIUS_RATIO * set.heightM : 1;
    const dx = (bb.max.x - bb.min.x) * s;
    const dz = (bb.max.z - bb.min.z) * (setName === 'tree' ? s : 1);
    widest = Math.max(widest, Math.abs(dx * Math.cos(YAW)) + Math.abs(dz * Math.sin(YAW)));
  }
  return widest * 1.3;
})();
const startX = -((built.length - 1) / 2) * spanM;

const placed = built.map((b, i) => {
  const mesh = new THREE.Mesh(b.geometry, materialFor(b.variant, colored));
  // The tree geometries are unit-height AND unit-radius, and the shipped shader
  // scales those two by different amounts - so this has to as well. A single
  // setScalar (the first pass) drew a cone as wide as it was tall.
  const scale = setName === 'tree'
    ? new THREE.Vector3(set.heightM * TREE_RADIUS_RATIO, set.heightM, set.heightM * TREE_RADIUS_RATIO)
    : new THREE.Vector3(1, 1, 1);
  mesh.scale.copy(scale);
  mesh.position.set(startX + i * spanM, 0, 0);
  // Three-quarter FRONT. Every model here is built nose-toward +Z and the camera
  // sits on +Z, so 0 is head-on and the first pass's 0.82*PI turned them almost
  // fully away - which judged four rumps. This shows the head, the horn sweep and
  // one flank at once, which is how you actually meet one on a slope.
  mesh.rotation.y = YAW;
  scene.add(mesh);
  if (showWire) {
    const wire = new THREE.Mesh(
      b.geometry,
      new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true, transparent: true, opacity: 0.28 }),
    );
    wire.scale.copy(scale).multiplyScalar(1.001);
    wire.position.copy(mesh.position);
    wire.rotation.copy(mesh.rotation);
    scene.add(wire);
  }
  return { ...b, mesh, scale };
});

// fov 60, because that is main.js's camera. The first pass used 42, which drew
// every candidate about 30% larger than the app ever will - an instrument that
// flatters what it measures, which is the one thing a bench must not do.
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.05, 2000);

function frame() {
  // The row is (n-1) gaps plus one model's own footprint - and spanM already
  // carries that footprint, measured.
  const rowWidth = (built.length - 1) * spanM + spanM / 1.3;
  // Far enough back to hold the whole row, but never nearer than the requested
  // viewing distance - so `dist` is a floor on how close the eye gets, not a
  // promise about framing.
  //
  // Through the HORIZONTAL half-angle, which is what a row of models fills.
  // Multiplying the vertical half-angle by the aspect (the first pass) is not the
  // same thing and it under-shoots on a wide viewport, which is how the models
  // came out small in a mostly empty frame.
  const hHalf = Math.atan(Math.tan((camera.fov * Math.PI) / 360) * camera.aspect);
  const fitDist = rowWidth / 2 / Math.tan(hHalf);
  const d = Math.max(distM, fitDist);
  const eyeY = set.heightM * (set.heightM > 4 ? 0.42 : 0.68);
  camera.position.set(0, eyeY, d);
  camera.lookAt(0, set.heightM * (set.heightM > 4 ? 0.45 : 0.52), 0);
  camera.updateProjectionMatrix();
  return d;
}

const labels = document.getElementById('labels');
const head = document.getElementById('head');

function draw() {
  camera.aspect = window.innerWidth / window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight);
  const d = frame();
  renderer.render(scene, camera);

  // Labels in fixed equal columns along the bottom, in the models' own left-to-
  // right order. Projecting each label from its model's position (the first pass)
  // is exact but useless at range: at 90 m the four models occupy 250 px between
  // them and the four labels overlapped into a sentence belonging to none of them.
  // The camera is centred on a centred row, so column order is model order.
  labels.innerHTML = '';
  const base = placed[0].triangles;
  const colW = window.innerWidth / placed.length;
  const box = rowBox();
  placed.forEach((p, i) => {
    const el = document.createElement('div');
    el.className = 'label';
    el.style.left = `${colW * (i + 0.5)}px`;
    // Directly under the row, not at the page bottom. Pinning them to the bottom
    // meant the crop had to keep every empty pixel between the models' feet and
    // the labels - up to 400 px of bare ground in a shot meant to show a coat.
    el.style.top = `${box.y1 + 14}px`;
    // A tick, so a column is tied to its model even when the row is narrow.
    const world = new THREE.Vector3(p.mesh.position.x, 0, 0).project(camera);
    el.style.setProperty('--tick-dx', `${((world.x + 1) / 2) * window.innerWidth - colW * (i + 0.5)}px`);
    const ratio = p.triangles / base;
    el.innerHTML =
      `<b>${p.variant.label}</b><br>` +
      `<span class="tris">${p.triangles.toLocaleString()} tris` +
      `${p === placed[0] ? '' : ` &middot; ${ratio.toFixed(1)}&times;`}</span>` +
      `<br><span class="note">${p.parts} part${p.parts === 1 ? '' : 's'}` +
      `${p.variant.smooth ? ' &middot; smooth' : ' &middot; flat'}` +
      `${p.variant.note ? `<br>${p.variant.note}` : ''}</span>`;
    labels.appendChild(el);
  });
  // On-screen height in pixels, which is the number that actually decides whether
  // detail pays: a model 40 px tall cannot show a beard however many triangles it
  // has. Reported rather than left to the eye, because the eye reads this bench at
  // whatever size the screenshot is displayed, not at the size the game draws it.
  const pxH = (set.heightM / (2 * d * Math.tan((camera.fov * Math.PI) / 360))) * window.innerHeight;
  head.innerHTML =
    `<b>${set.subject}</b> &nbsp; camera ${d.toFixed(1)} m &nbsp; ` +
    `model height ${set.heightM} m &nbsp; <b>${Math.round(pxH)} px on screen</b>` +
    `${showWire ? ' &nbsp; wireframe' : ''}`;
}

draw();
window.addEventListener('resize', draw);

// Where the row actually sits on screen, in CSS pixels, so the shooter can crop
// the empty sky off without moving the camera. Cropping rather than approaching is
// the point: it magnifies the image while leaving every pixel the one the app would
// have drawn at this distance, so a shape cannot be approved at a size the game
// never shows it.
function rowBox() {
  const box = new THREE.Box3();
  for (const p of placed) {
    p.mesh.updateMatrixWorld();
    box.union(new THREE.Box3().setFromObject(p.mesh));
  }
  const pts = [];
  for (const x of [box.min.x, box.max.x]) {
    for (const y of [box.min.y, box.max.y]) {
      for (const z of [box.min.z, box.max.z]) {
        const v = new THREE.Vector3(x, y, z).project(camera);
        pts.push([((v.x + 1) / 2) * window.innerWidth, ((-v.y + 1) / 2) * window.innerHeight]);
      }
    }
  }
  return {
    x0: Math.min(...pts.map((q) => q[0])),
    y0: Math.min(...pts.map((q) => q[1])),
    x1: Math.max(...pts.map((q) => q[0])),
    y1: Math.max(...pts.map((q) => q[1])),
  };
}

// For tools/dev/shoot-models.mjs: the numbers it reports come from here rather
// than from a second count of the same geometry.
window.__models = {
  set: setName,
  rowBox,
  labelsBottom: () => {
    let bottom = 0;
    for (const el of labels.children) bottom = Math.max(bottom, el.offsetTop + el.offsetHeight);
    return bottom;
  },
  viewport: () => ({ w: window.innerWidth, h: window.innerHeight }),
  variants: placed.map((p) => ({
    label: p.variant.label,
    triangles: p.triangles,
    parts: p.parts,
    smooth: !!p.variant.smooth,
  })),
};
