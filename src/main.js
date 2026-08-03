import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { loadTerrain } from './terrain.js';
import { loadTrails } from './trails.js';
import { loadPOI, poiInfoHTML } from './poi.js';
import { loadWater } from './water.js';
import { installAtmosphere } from './atmosphere.js';
import { Lighting } from './lighting.js';
import { Weather } from './weather.js';
import { localToWGS84 } from './geo.js';
import { headingDegrees, compassLabel, nearestPOI } from './nav.js';
import { WalkFlyControls, EYE_HEIGHT_M } from './controls.js';

installAtmosphere(); // patch the fog chunks before any material compiles (phase 4, docs/ARCHITECTURE.md §7)

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x9fc9e8, 20000, 140000);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1, // was 10 - fine for the old 26km overview camera, but clipped away anything
  // closer than 10m once walking put the camera at 1.7m eye height (the "floating"/
  // see-through feel reported after testing - logarithmicDepthBuffer is already on,
  // so precision holds fine at this near/far ratio)
  200000,
);
camera.position.set(0, 3000, 0); // placeholder - real spawn set once terrain+POI load, below

const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

// POI name labels (docs/PROGRESS.md 2026-07-31) are real DOM elements
// (CSS2DObject) layered over the WebGL canvas, not WebGL geometry -
// crisp text at any zoom, no per-name texture to generate/manage.
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
// none on the container, auto on each label (index.html) - so clicks reach
// the canvas everywhere except an actual label, which is now the primary way
// to select a POI (the reticle path was removed, see below).
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

// Walk/fly navigation (docs/PROGRESS.md 2026-07-31) replaces OrbitControls -
// default is walking at eye height, 'F' toggles a faster free-fly mode, no
// scroll/zoom in either (see src/controls.js).
const controls = new WalkFlyControls(camera, renderer.domElement);

// Real lights, moved/recolored per time-of-day preset by lighting.js below -
// unlike the reference project's unlit/baked-tint terrain, ours uses a real
// MeshStandardMaterial (terrain.js/water.js's glaciers), so a real light
// gives correct shading for free instead of needing a manual tint hack.
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
scene.add(sunLight);

const sky = new Sky();
sky.scale.setScalar(400000); // comfortably beyond fly mode's reach + the terrain bbox
scene.add(sky);

const lighting = new Lighting({ renderer, scene, sky, sunLight, ambientLight });
let weather = null; // created once loadTerrain() gives us the real bbox to size the cloud deck (below)

// Attribution lives behind a toggle (index.html explains why that's compatible
// with CC BY / ODbL). The panel is built the same way either way - collapsing
// is purely presentational, so nothing here depends on it being open.
const creditsToggle = document.getElementById('credits-toggle');
const creditsPanel = document.getElementById('credits');
function setCreditsOpen(open) {
  creditsPanel.hidden = !open;
  creditsToggle.setAttribute('aria-expanded', String(open));
}
creditsToggle.addEventListener('click', (event) => {
  event.stopPropagation(); // don't let it reach the canvas' re-lock/dismiss handler
  setCreditsOpen(creditsPanel.hidden);
  // Give focus back: controls.js preventDefaults the movement keys on window,
  // so Space would be swallowed by a still-focused button instead of flying up.
  creditsToggle.blur();
});
document.addEventListener('click', (event) => {
  if (!creditsPanel.hidden && !event.target.closest('#credits-box')) setCreditsOpen(false);
});
window.addEventListener('keydown', (event) => {
  if (event.code === 'Escape') setCreditsOpen(false);
});

const creditLines = {};
// Fixed order rather than Object.values(): the keys are filled in by whichever
// fetch finishes first, so the overlay used to reshuffle between loads.
const CREDIT_ORDER = ['dem', 'trails', 'osm', 'modified'];
function renderCredits() {
  document.getElementById('credits').innerHTML = CREDIT_ORDER.filter((k) => creditLines[k])
    .map((k) => creditLines[k])
    .join('<br>');
}

// CC BY 4.0 obliges us to state that the data was modified, not just to
// attribute it ("indicare se sono state effettuate delle modifiche" - the VDA
// DTM licence, and the same clause in the Piemonte DTM, TINITALY and VDA trail
// licences). Every one of those datasets is used modified here, so this line is
// static and always shown rather than assembled per source.
creditLines.modified =
  'Elevation and trail data adapted from the sources above: cropped to the park area, ' +
  'resampled, and merged from multiple datasets.';

let originReady = false; // geo.js's setLocalOrigin() runs inside loadTerrain() - localToWGS84() throws before that
let terrainUpdate = null; // quadtree LOD needs the camera every frame (src/terrain.js)
const terrainPromise = loadTerrain().then((result) => {
  const { object, manifest, sampleRenderedHeight, update } = result;
  scene.add(object);
  terrainUpdate = update;
  terrainUpdate(camera); // pick the first tile set before the opening frame, not after it
  originReady = true;
  // sampleRenderedHeight, not sampleHeight: anything that has to touch the
  // visible surface (standing on it, planting a marker on it, landing a
  // fly-to on it) must use the height the mesh actually draws, or it ends up
  // under the ground or floating above it - see terrain.js for why they differ.
  controls.getGroundHeight = sampleRenderedHeight;
  // DEM is a multi-source mosaic (docs/ARCHITECTURE.md §3). All three sources
  // are CC BY 4.0 and all three attributions now ship - the VDA and Piemonte
  // licences were verified from their own licence documents on 2026-08-03,
  // which is what unblocked publishing this at all. The VDA string in
  // particular is prescribed verbatim by its licence and must not be
  // paraphrased.
  const attributed = manifest.source.sources.filter((s) => s.attribution);
  if (attributed.length) {
    // TINITALY's requested citation already ends in "- CC BY 4.0"; strip that so
    // the single licence link below doesn't read as "CC BY 4.0 CC BY 4.0".
    const cite = (s) => s.attribution.replace(/\s*[-–]\s*CC BY 4\.0\.?$/i, '');
    creditLines.dem =
      `${attributed.map(cite).join(' ')} ` +
      `<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>`;
    renderCredits();
  }

  const { xmin, ymin, xmax, ymax } = manifest.bboxCrsUnits;
  weather = new Weather(scene, { worldWidth: xmax - xmin, worldDepth: ymax - ymin });
  lighting.weather = weather;
  return result;
});

const trailsPromise = loadTrails().then((result) => {
  scene.add(result.group);
  // CC BY 4.0 requires this attribution wherever the data (or a render of
  // it) is shown - docs/ARCHITECTURE.md §9, tools/trails-source/README.md.
  creditLines.trails =
    `${result.manifest.source.attribution} ` +
    `<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">${result.manifest.source.license}</a>`;
  renderCredits();
  return result;
});

// Select a POI: show its info panel and fly the camera toward it - shared by
// both selection paths (clicking a label, and the search box).
//
// Where a fly-to puts you relative to the POI. Was 2500 m for the old
// overview camera, then 250 m for walking - still too far in practice: after
// searching for a col the user had to walk the remaining distance to reach it
// (2026-08-03). 60 m arrives at the place while keeping the marker and its
// surroundings in view.
const FLY_TO_STANDOFF_M = 60;
const FLY_TO_DURATION_S = 1.2;
let flying = null;

function flyTo(poi) {
  // Aim at the marker's own base height, not poi.elevationM - on a summit the
  // drawn mesh can sit tens of metres below the real altitude, and looking at
  // the real one would point the camera above the marker you just picked.
  const targetY = controls.getGroundHeight?.(poi.local.x, poi.local.z) ?? poi.elevationM;
  const target = new THREE.Vector3(poi.local.x, targetY, poi.local.z);
  const away = camera.position.clone().sub(target);
  away.y = 0;
  if (away.lengthSq() < 1) away.set(0, 0, 1); // camera directly above target - pick an arbitrary side
  away.normalize();
  const endPos = target.clone().addScaledVector(away, FLY_TO_STANDOFF_M);
  const ground = controls.getGroundHeight?.(endPos.x, endPos.z);
  endPos.y = (ground ?? target.y) + EYE_HEIGHT_M;
  flying = { startPos: camera.position.clone(), endPos, lookAt: target.clone(), t: 0 };
  controls.enabled = false; // paused until the animation finishes, below
}

function selectPoi(poi) {
  document.getElementById('poi-info').innerHTML = poiInfoHTML(poi);
  document.getElementById('poi-info').style.display = 'block';
  flyTo(poi);
}

let poiIndex = null;
const poiPromise = loadPOI(undefined, { onSelect: selectPoi }).then((index) => {
  poiIndex = index;
  scene.add(index.group);
  // ODbL requires attribution wherever OSM data is shown - docs/ARCHITECTURE.md §9.
  // Shared 'osm' key with loadWater() below (same dataset/license) so the
  // credits overlay doesn't show the same ODbL line twice.
  creditLines.osm =
    `${index.manifest.source.attribution} ` +
    `<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">${index.manifest.source.license}</a>`;
  renderCredits();

  // Searchable POI list (native <datalist> - no custom dropdown code needed
  // at this scale, ~400 entries). Labels include the category since plain
  // names aren't guaranteed unique across that many POIs.
  const searchByLabel = new Map(index.searchEntries.map((e) => [e.label, e.poi]));
  const datalist = document.getElementById('poi-search-list');
  for (const { label } of index.searchEntries) {
    const option = document.createElement('option');
    option.value = label;
    datalist.appendChild(option);
  }
  const searchInput = document.getElementById('poi-search-input');
  searchInput.addEventListener('focus', () => {
    if (document.pointerLockElement) document.exitPointerLock(); // typing shouldn't also spin the camera
  });
  searchInput.addEventListener('input', () => {
    const poi = searchByLabel.get(searchInput.value);
    if (poi) {
      selectPoi(poi);
      searchInput.value = '';
      searchInput.blur();
    }
  });

  return index;
});

// Spawn once both terrain (for ground height) and POI (for a real landmark
// to start near) are ready - avoids an intermediate wrong-looking position.
// Gran Paradiso itself if present, else any peak, else just the first POI.
Promise.all([terrainPromise, poiPromise, trailsPromise]).then(([{ sampleRenderedHeight }, index, trails]) => {
  // Both were built from true heightfield elevations, which is not quite the
  // surface the terrain draws - re-seat them on it (see each module's
  // alignToGround) so markers plant in the ground and trails lie on the path.
  index.alignToGround(sampleRenderedHeight);
  trails.alignToGround(sampleRenderedHeight);

  const pois = index.manifest.pois;
  const landmark = pois.find((p) => p.name === 'Gran Paradiso') ?? pois.find((p) => p.category === 'peak') ?? pois[0];
  if (!landmark) return;
  // Measured against the LOD terrain: from here the ground is 3916 m and the
  // summit rises a real 130 m at 18 deg with a clear line of sight. (Briefly
  // moved out to 1200 m while the old 328 m mesh drew this summit 130 m too
  // low and blocked every sight line from any distance - not needed now that
  // the drawn summit is within 2 m of the data.)
  const standoffM = 400;
  const sx = landmark.local.x;
  const sz = landmark.local.z + standoffM; // stand south of it (docs/ARCHITECTURE.md §6: +Z = South)
  camera.position.set(sx, sampleRenderedHeight(sx, sz) + EYE_HEIGHT_M, sz);
  camera.lookAt(landmark.local.x, sampleRenderedHeight(landmark.local.x, landmark.local.z), landmark.local.z);
});

let waterUpdate = null;
loadWater().then(({ group, manifest, update }) => {
  scene.add(group);
  waterUpdate = update;
  creditLines.osm =
    `${manifest.source.attribution} ` +
    `<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">${manifest.source.license}</a>`;
  renderCredits();
});

// POI selection is by label click or the search box - there is deliberately
// no screen-centre reticle+raycast path any more. It aimed at the foot of a
// marker line rather than the name being read, which the user found
// unintuitive and, once Esc stopped freezing movement (controls.js), also
// redundant. Clicking the canvas just dismisses the info panel, on the way to
// re-engaging pointer lock.
renderer.domElement.addEventListener('click', () => {
  document.getElementById('poi-info').style.display = 'none';
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

const envTime = document.getElementById('env-time');
const envTimeLabel = document.getElementById('env-time-label');
envTime.addEventListener('input', () => {
  lighting.setTime(Number(envTime.value));
  envTimeLabel.textContent = lighting.label;
});
envTimeLabel.textContent = lighting.label;

const envWeather = document.getElementById('env-weather');
envWeather.addEventListener('change', () => {
  weather?.set(Number(envWeather.value)); // no-op if terrain (and so weather's cloud deck sizing) hasn't loaded yet
});

const timer = new THREE.Timer();

const fpsEl = document.getElementById('fps');
let fpsFrames = 0;
let fpsAccum = 0;

// Phase 5 nav HUD (docs/ARCHITECTURE.md §7): heading compass, live lat/lon +
// elevation, nearest named POI. Throttled like the fps counter - a compass/
// position readout doesn't need per-frame precision.
const compassNeedle = document.getElementById('compass-needle');
const navHeadingEl = document.getElementById('nav-heading');
const navPositionEl = document.getElementById('nav-position');
const navNearestEl = document.getElementById('nav-nearest');
let navAccum = 0;

function formatLatLon(lat, lon) {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${ns}, ${Math.abs(lon).toFixed(4)}°${ew}`;
}

renderer.setAnimationLoop(() => {
  timer.update();
  waterUpdate?.(timer.getElapsed());
  weather?.update(timer.getDelta(), camera);
  lighting.applyState(); // re-grades every frame so an in-progress weather transition stays live

  fpsFrames += 1;
  fpsAccum += timer.getDelta();
  if (fpsAccum >= 0.5) {
    fpsEl.textContent = `${Math.round(fpsFrames / fpsAccum)} fps`;
    fpsFrames = 0;
    fpsAccum = 0;
  }

  navAccum += timer.getDelta();
  if (navAccum >= 0.25) {
    navAccum = 0;
    const heading = headingDegrees(camera);
    compassNeedle.style.transform = `translate(-50%, -100%) rotate(${heading}deg)`;
    navHeadingEl.textContent = `${compassLabel(heading)} ${Math.round(heading)}°`;

    if (originReady) {
      const { lat, lon } = localToWGS84(camera.position.x, camera.position.z);
      const ground = controls.getGroundHeight?.(camera.position.x, camera.position.z);
      // Ground elevation below, not just the camera's own altitude - matters
      // most in fly mode, where alt alone doesn't say how high above the
      // terrain you actually are (user asked for this explicitly).
      const groundText = ground != null ? ` · ground ${Math.round(ground)} m` : '';
      navPositionEl.textContent = `${formatLatLon(lat, lon)} · alt ${Math.round(camera.position.y)} m${groundText}`;
    }

    const nearest = poiIndex && nearestPOI(camera.position.x, camera.position.z, poiIndex.manifest.pois);
    // Metres below 1 km: at walking scale a one-decimal km reading has useless
    // resolution - everything under 150 m showed as "0.1 km" and standing 40 m
    // from a col read "0.0 km".
    const nearDist = nearest && (nearest.distanceM < 1000
      ? `${Math.round(nearest.distanceM)} m`
      : `${(nearest.distanceM / 1000).toFixed(1)} km`);
    navNearestEl.textContent = nearest ? `Near ${nearest.poi.name} (${nearDist})` : '';

    poiIndex?.updateMarkers(camera);
  }

  if (flying) {
    // Time-based, not a fixed increment per frame: at a fixed 0.02/frame the
    // same flight took ~1s at 50fps but ~10s on a slow machine (measured
    // headlessly at 5fps), which is a real difference in how the app feels,
    // not just a test artifact.
    flying.t = Math.min(1, flying.t + timer.getDelta() / FLY_TO_DURATION_S);
    const e = 1 - (1 - flying.t) ** 3; // ease-out cubic
    camera.position.lerpVectors(flying.startPos, flying.endPos, e);
    camera.lookAt(flying.lookAt);
    if (flying.t >= 1) {
      flying = null;
      controls.enabled = true; // PointerLockControls re-derives yaw/pitch from the
      // camera's current quaternion on the next mousemove, no resync needed (src/controls.js)
    }
  }
  controls.update(timer.getDelta());
  // After controls, before render: the tile set must match where the camera
  // actually ended up this frame, or a fast move shows a hole at its edge.
  terrainUpdate?.(camera);
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
});
