import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { loadTerrain } from './terrain.js';
import { loadTrails } from './trails.js';
import { loadPOI, poiInfoHTML, LINE_RAYCAST_THRESHOLD_M } from './poi.js';
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
labelRenderer.domElement.style.pointerEvents = 'none'; // selection is via the reticle+click, not the labels themselves
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

const creditLines = {};
function renderCredits() {
  document.getElementById('credits').innerHTML = Object.values(creditLines).join('<br>');
}

let originReady = false; // geo.js's setLocalOrigin() runs inside loadTerrain() - localToWGS84() throws before that
const terrainPromise = loadTerrain().then((result) => {
  const { mesh, manifest, sampleHeight } = result;
  scene.add(mesh);
  originReady = true;
  controls.getGroundHeight = sampleHeight;
  // DEM is a multi-source mosaic (docs/ARCHITECTURE.md §3) - only show
  // credits for sources with a confirmed attribution (VDA/Piemonte's own
  // licenses are still an unverified TODO, see docs/PROGRESS.md; showing
  // that literal placeholder text to real users would be worse than
  // omitting it for now).
  const attributed = manifest.source.sources.filter((s) => s.attribution);
  if (attributed.length) {
    creditLines.dem = attributed.map((s) => s.attribution).join(' · ');
    renderCredits();
  }

  const { xmin, ymin, xmax, ymax } = manifest.bboxCrsUnits;
  weather = new Weather(scene, { worldWidth: xmax - xmin, worldDepth: ymax - ymin });
  lighting.weather = weather;
  return result;
});

loadTrails().then(({ group, manifest }) => {
  scene.add(group);
  // CC BY 4.0 requires this attribution wherever the data (or a render of
  // it) is shown - docs/ARCHITECTURE.md §9, tools/trails-source/README.md.
  creditLines.trails =
    `${manifest.source.attribution} ` +
    `<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">${manifest.source.license}</a>`;
  renderCredits();
});

// Select a POI: show its info panel and fly the camera toward it - shared
// by both selection paths below (label click, and reticle+click while
// walking/flying).
const FLY_TO_STANDOFF_M = 250; // walking-scale viewing distance, not the old overview-scale 2500m
let flying = null;

function flyTo(poi) {
  const target = new THREE.Vector3(poi.local.x, poi.elevationM, poi.local.z);
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
  // at this scale, ~370 entries). Labels include the category since plain
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
Promise.all([terrainPromise, poiPromise]).then(([{ sampleHeight }, index]) => {
  const pois = index.manifest.pois;
  const landmark = pois.find((p) => p.name === 'Gran Paradiso') ?? pois.find((p) => p.category === 'peak') ?? pois[0];
  if (!landmark) return;
  const standoffM = 400;
  const sx = landmark.local.x;
  const sz = landmark.local.z + standoffM; // stand south of it (docs/ARCHITECTURE.md §6: +Z = South)
  camera.position.set(sx, sampleHeight(sx, sz) + EYE_HEIGHT_M, sz);
  camera.lookAt(landmark.local.x, landmark.elevationM, landmark.local.z);
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

// Aim-select a POI: the very first click on the canvas only engages
// pointer lock (see controls.js) - there's no visible cursor to click a
// specific point at while the mouse is captured for looking around, so
// once locked, clicks aim from screen center (a HUD reticle marks this,
// index.html) instead of the actual mouse position.
const raycaster = new THREE.Raycaster();
raycaster.params.Line.threshold = LINE_RAYCAST_THRESHOLD_M; // poi.js's marker lines are thin - need real tolerance to aim at
const SCREEN_CENTER = new THREE.Vector2(0, 0);

renderer.domElement.addEventListener('click', () => {
  if (!poiIndex || !controls.locked) return;
  raycaster.setFromCamera(SCREEN_CENTER, camera);

  const poi = poiIndex.pick(raycaster);
  if (poi) {
    selectPoi(poi);
  } else {
    document.getElementById('poi-info').style.display = 'none';
  }
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
    navNearestEl.textContent = nearest ? `Near ${nearest.poi.name} (${(nearest.distanceM / 1000).toFixed(1)} km)` : '';

    poiIndex?.updateLabelVisibility(camera);
  }

  if (flying) {
    flying.t = Math.min(1, flying.t + 0.02);
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
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
});
