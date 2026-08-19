import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { loadTerrain } from './terrain.js';
import { SNOW_LEVEL } from './snow.js';
import { loadTrails } from './trails.js';
import { loadPOI, poiInfoHTML } from './poi.js';
import { createHuts } from './huts.js';
import { loadWater } from './water.js';
import { loadRoads } from './roads.js';
import { loadForest, createCoverageSampler } from './forest.js';
import { loadBasemap, BASEMAP_MIX, BASEMAP_SCALE, BASEMAP_GAIN, BASEMAP } from './basemap.js';
import { createVegetation } from './vegetation.js';
import { loadLandcover, createLandcoverSampler, LANDCOVER_MASK } from './landcover.js';
import { loadOuterRing, createFadeSampler } from './outerring.js';
import {
  createGroundcover, GROUNDCOVER_DENSITY, GROUNDCOVER_TIME, GROUNDCOVER_WIND,
} from './groundcover.js';
// Published on the dev handle below, not used here: it is the one number that ties
// every scatter to the triangulation the terrain draws, and swapping tier levels
// changes it. A test that cannot read it cannot tell that they still agree.
import { GROUND_SEGMENTS } from './heighttier.js';
import { createEdelweiss, FOUND_RADIUS_M } from './edelweiss.js';
import { createWildlife } from './wildlife.js';
import { setModelDetail } from './modeldetail.js';
import { createBirds } from './birds.js';
import { createAudio } from './audio.js';
import { installAtmosphere, ATMO } from './atmosphere.js';
import {
  installSkyAltitude, updateSkyAltitude, SKY_ALTITUDE_OVERRIDE, SKY_ALTITUDE_STRENGTH,
  skyAltitudeLengths,
} from './sky.js';
import { Lighting, HAZE_SCALE } from './lighting.js';
import { Weather, WEATHER_KEYS } from './weather.js';
import { localToWGS84, wgs84ToLocal } from './geo.js';
import {
  headingDegrees, compassLabel, pitchDegrees, nearestPOI, directionFromHeadingPitch,
} from './nav.js';
import { WalkFlyControls, EYE_HEIGHT_M, isTypingTarget } from './controls.js';
import {
  buildHash, parseHash, load as loadViewState, save as saveViewState,
} from './viewstate.js';

installAtmosphere(); // patch the fog chunks before any material compiles (phase 4, docs/ARCHITECTURE.md §7)
installSkyAltitude(); // before `new Sky()` below - the constructor CLONES the uniforms, so a later addition never reaches the material (src/sky.js)

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

// POI name labels (docs/PROGRESS-ARCHIVE.md 2026-07-31) are real DOM elements
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

// Walk/fly navigation (docs/PROGRESS-ARCHIVE.md 2026-07-31) replaces OrbitControls -
// default is walking at eye height, 'F' toggles a faster free-fly mode, no
// scroll/zoom in either (see src/controls.js).
const controls = new WalkFlyControls(camera, renderer.domElement);

// Procedural ambient audio (phase 6, src/audio.js). Created now but silent: a
// browser will not let an AudioContext start outside a user gesture, so the
// graph is built by the first audio.start() call below. Its inputs (ground
// height, canopy, hydrology) are attached as each loader lands, exactly like the
// forest mask is - so load order does not matter here either.
const audio = createAudio();

// Saved and shared view state (src/viewstate.js, decided with the user
// 2026-08-05). Read now, applied once the terrain is up because a position needs
// a ground height to be seated on. A hash beats the stored state - an explicit
// link must win - and is then stripped from the URL, so a later reload follows
// the autosave again instead of staying pinned to that link forever.
const linkedView = parseHash(window.location.hash);
const storedState = loadViewState();
let pendingView = linkedView ?? storedState;
if (linkedView) history.replaceState(null, '', window.location.pathname + window.location.search);
// Half-extent of the DEM in local metres, filled in when the terrain manifest
// lands. Needed to reject an out-of-map restore: the height sampler CLAMPS to the
// grid edge rather than returning NaN (verified in src/heightfield.js), so a
// hand-edited link pointing at Milan would otherwise "work" and put you on a
// smeared copy of the bbox border.
let worldHalf = null;

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
const CREDIT_ORDER = ['dem', 'demLiability', 'basemap', 'trails', 'osm', 'modified'];
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
let terrainSurface = null; // dev handle only, see the __pngp block at the end
// Also dev-handle only. The real sampler is built inside the terrain/forest promise
// below, which is a different scope from the __pngp block at the end of this file -
// naming it directly there is a ReferenceError, and one that only fires when a probe
// calls it rather than at load, so nothing would report it.
let canopySampler = null;
// Which basemap level the GPU could hold. Dev handle only.
let basemapLevel = null;
const terrainPromise = loadTerrain().then((result) => {
  const { object, manifest, sampleRenderedHeight, update } = result;
  terrainSurface = result;
  scene.add(object);
  terrainUpdate = update;
  terrainUpdate(camera); // pick the first tile set before the opening frame, not after it
  originReady = true;
  // sampleRenderedHeight, not sampleHeight: anything that has to touch the
  // visible surface (standing on it, planting a marker on it, landing a
  // fly-to on it) must use the height the mesh actually draws, or it ends up
  // under the ground or floating above it - see terrain.js for why they differ.
  controls.getGroundHeight = sampleRenderedHeight;
  // Same sampler the walking camera stands on: the wind is driven by the height
  // and the exposure of the ground you are actually on (src/audio.js).
  audio.setSamplers({ sampleGroundHeight: sampleRenderedHeight });
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
    // NOT ALL FOUR SOURCES ARE CC BY 4.0, and until 2026-08-18 this line said they
    // were: it joined every attribution into one string and put a single CC BY 4.0
    // link after it. That was true while the mosaic had three Italian sources and
    // false the moment Copernicus WorldDEM-30 joined, which carries its own licence.
    // Mis-stating someone's licence in a credits panel is worse than omitting them.
    const isCcBy = (s) => /^CC BY 4\.0$/i.test(s.license ?? '');
    const parts = [];
    const ccby = attributed.filter(isCcBy);
    if (ccby.length) {
      parts.push(`${ccby.map(cite).join(' ')} `
        + `<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>`);
    }
    for (const s of attributed.filter((x) => !isCcBy(x))) {
      parts.push(s.licenseUrl
        ? `${cite(s)} (<a href="${s.licenseUrl}" target="_blank" rel="noopener">licence</a>)`
        : cite(s));
    }
    creditLines.dem = parts.join('<br>');

    // A source can oblige us to say something that is NOT an attribution, and the
    // Copernicus DEM licence does: Article 6(c) requires a liability disclaimer to
    // travel with any communication to the general public. It is easy to lose
    // precisely because it reads like boilerplate rather than like a credit, so it
    // is carried in the manifest as its own field and rendered as its own line.
    const liabilities = manifest.source.sources.map((s) => s.liabilityNotice).filter(Boolean);
    if (liabilities.length) creditLines.demLiability = liabilities.join(' ');

    renderCredits();
  }

  const { xmin, ymin, xmax, ymax } = manifest.bboxCrsUnits;
  worldHalf = { x: (xmax - xmin) / 2, z: (ymax - ymin) / 2 };
  weather = new Weather(scene, { worldWidth: xmax - xmin, worldDepth: ymax - ymin });
  lighting.weather = weather;
  return result;
});

// The canopy mask is independent of everything else: terrain.js and
// vegetation.js both bind the shared FOREST_MASK holder at compile time, so this
// can land whenever it lands - the terrain simply starts un-tinted and the trees
// start absent. Its ODbL credit is the shared 'osm' line, already set by the POI
// and water loaders from the same dataset and licence.
const forestPromise = loadForest().catch((err) => {
  // Not fatal: no mask means no trees and no forest tint, which is worse-looking
  // but entirely functional. Losing the whole viewer to it would not be.
  console.warn('Forest mask unavailable - continuing without trees:', err.message);
  return null;
});

// The satellite ground texture, independent of everything else in the same way
// and for the same reason (src/basemap.js binds shared holders at compile time).
// Until it lands - and forever, if it fails - the terrain draws the procedural
// ground it drew through phase 7, so this is the one loader whose failure is
// invisible rather than merely survivable.
// The renderer's own reported limit decides which level of the photograph this machine
// gets - see pickBasemapLevel(). Asked here rather than inside the loader because this
// is where the renderer lives.
loadBasemap(undefined, { maxTextureSize: renderer.capabilities.maxTextureSize })
  .then(({ manifest, level }) => {
    basemapLevel = level; // for the dev handle, so a test can assert which one was used
    // Prescribed verbatim by the EU legal notice on Copernicus Sentinel data for
    // adapted or modified data ("Contains modified Copernicus Sentinel data
    // [Year]"), and the data here IS modified - warped, de-shaded, mosaicked.
    // Same standing as the VDA DTM's own required wording: not paraphrasable.
    creditLines.basemap =
      `${manifest.source.attribution} ` +
      `(<a href="${manifest.source.licenseUrl}" target="_blank" rel="noopener">legal notice</a>)`;
    renderCredits();
  })
  .catch((err) => {
    console.warn('Satellite basemap unavailable - drawing the procedural ground:', err.message);
  });

// The open-vegetation mask, independent of everything else for the third time and
// for the same reason: src/groundcover.js binds the shared LANDCOVER_MASK holder
// at compile time, so this can land whenever it lands and the ground simply starts
// bare. Its credit is Copernicus, already set by the basemap loader from the same
// scenes - and the wording is prescribed, so it must not be duplicated in a
// second, differently-worded line.
const landcoverPromise = loadLandcover().catch((err) => {
  console.warn('Landcover mask unavailable - continuing without grass or shrubs:', err.message);
  return null;
});

// The outer-ring field, bound the same way for the fourth time (src/outerring.js
// holds the sampler that src/terrain.js compiled against). Its failure mode is
// the one worth naming: without it the ground stops fading, so the map ends on
// the straight lines it ended on before 2026-08-18 - unattractive, but it draws
// and it is walkable everywhere. The confinement below therefore also does
// nothing, which is the right way round: a walker allowed too far sees coarse
// ground, while a walker stopped by a boundary computed from a field that never
// arrived would be stopped in the middle of the park.
const outerRingPromise = loadOuterRing().catch((err) => {
  console.warn('Outer-ring field unavailable - no edge fade, no boundary:', err.message);
  return null;
});

// The boundary itself. Attached here rather than inside the loader because
// controls.js owns movement and this file owns what movement is allowed to know -
// the same division as getGroundHeight above.
outerRingPromise.then((ring) => {
  if (ring) controls.getFade = createFadeSampler(ring);
});

let wildlife = null; // animals carry state between frames, so they need the loop
// Module scope because the Models control reaches it from outside the block that
// creates it. It was a block-local const, so the control's applyDetail() call
// referred to nothing at all.
let vegetation = null;
let birds = null; // same, and they need the POI list too (see below)
let groundcover = null; // the density knob has to reach it after the HUD changes
let landcoverCoverAt = null; // dev handle only: the CPU twin of what the shader samples
let edelweiss = null; // patches are decided on the CPU, so the loop drives them

// Trees need the terrain's height texture (they displace onto the same surface)
// but NOT the mask, thanks to the shared holder.
Promise.all([terrainPromise, forestPromise]).then(async ([terrain, forest]) => {
  // ONE coverage sampler for all three consumers. It decodes the mask at half
  // resolution into a 2.4 MB array (src/forest.js), so building a second one for
  // the birds would be pure waste - and they have to agree about where the wood is
  // anyway.
  const canopyAt = forest
    ? createCoverageSampler({ manifest: forest.manifest, texture: forest.texture })
    : () => 0;
  canopySampler = canopyAt; // for the dev handle only - see the declaration above

  if (forest) {
    vegetation = createVegetation({ manifest: terrain.manifest, heightTexture: terrain.heightTexture });
    scene.add(vegetation.object);
    // The Models control is wired up long before the trees exist - it runs at
    // startup, the forest arrives with the terrain - so whatever it chose has to be
    // applied to them once they are here, or High would draw standard trees until
    // the next time the control was touched.
    vegetation.applyDetail();

    // Wildlife needs the same mask on the CPU: it decides where a herd can stand
    // in JavaScript, then keeps moving those animals from frame to frame.
    // sampleRenderedHeight for the same reason the walking camera uses it - an
    // animal has to stand on the surface that is actually drawn.
    wildlife = createWildlife({
      sampleGroundHeight: terrain.sampleRenderedHeight,
      canopyAt,
      // An alarm whistle is the one wildlife sound that carries (src/audio.js):
      // wildlife.js reports the event, audio.js decides which species has a call
      // and whether it is within earshot.
      onAlarm: (event) => audio.call(event),
    });
    scene.add(wildlife.object);
  }

  // Grass, shrubs and the flowers. The mask is awaited HERE rather than in the
  // Promise.all above so that a slow (or failed) landcover download cannot hold up
  // the trees and the animals, which is the same argument the POI list gets below.
  const landcover = await landcoverPromise;
  if (landcover) {
    groundcover = createGroundcover({ manifest: terrain.manifest, heightTexture: terrain.heightTexture });
    scene.add(groundcover.object);
    applyGroundcoverDensity(); // the control may already have been touched, or restored

    // ONE CPU decoder for the mask, exactly as canopyAt is shared above: it costs
    // a 9.6 MB getImageData and keeps 2.4 MB, so a second one would be pure waste.
    const coverAt = createLandcoverSampler({ manifest: landcover.manifest, texture: landcover.texture });
    landcoverCoverAt = coverAt; // dev handle only, see the __pngp block at the end
    // sampleRenderedHeight for the same reason the walking camera and the animals
    // use it: a flower has to sit on the surface that is actually drawn.
    edelweiss = createEdelweiss({ sampleGroundHeight: terrain.sampleRenderedHeight, coverAt });
    scene.add(edelweiss.object);
  }

  // The same canopy sampler drives the leaf-rustle layer - standing in a wood
  // sounds different from standing on the ridge above it.
  audio.setSamplers({ canopyAt });

  // Birds last, and the POI list is awaited HERE rather than in the Promise.all
  // above for a reason worth stating: poiPromise is declared further down this
  // file, and a const is not hoisted, so naming it at module-evaluation time
  // throws "Cannot access 'poiPromise' before initialization" - which it did.
  // Awaiting it inside the callback also means a slow POI load cannot hold up the
  // trees and the animals, and .catch means a failed one cannot cost them at all.
  //
  // Birds do not need the canopy mask (only the nutcracker uses it, and without one
  // it simply finds nowhere to live), so they are created either way.
  const index = await poiPromise.catch(() => null);
  birds = createBirds({
    sampleGroundHeight: terrain.sampleRenderedHeight,
    canopyAt,
    // Choughs live on real passes and huts - the user's decision (2026-08-05).
    pois: index?.manifest.pois ?? [],
    // A chough flock chatters and a nutcracker rattles as it goes. Same split as
    // the mammals: this module knows when, audio.js knows what it sounds like.
    onCall: (event) => audio.call(event),
  });
  scene.add(birds.object);
});

let trailsLayer = null;
const trailsPromise = loadTrails().then((result) => {
  scene.add(result.group);
  trailsLayer = result;
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
// Where a fly-to puts you relative to the POI. Was 2500 m for the old overview camera,
// then 250 m for walking - still too far in practice: after searching for a col the user
// had to walk the remaining distance to reach it (2026-08-03). Then 60 m, to arrive at
// the place while keeping the marker and its surroundings in view.
//
// 15 m since 2026-08-19, at the user's request: "Mi piacerebbe arrivare piu vicino di
// com'e' ora. Da 60m a 15m." It also reads differently now that the 51 rifugi and
// bivacchi are BUILDINGS rather than posts - 15 m from the centre of a 9.5 m hut is
// about 10 m off its facade, which is where you would actually stand to look at it, and
// the camera is still outside every building in the park.
const FLY_TO_STANDOFF_M = 15;
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
let huts = null; // src/huts.js, created once the terrain and the POI are both up
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

// Where the viewer opens on a FIRST visit - the user's call (2026-08-04): Le
// Pont, at the head of Valsavarenche, 1,950 m. It is where the walk to Rifugio
// Vittorio Emanuele II and Gran Paradiso itself actually starts, so the viewer
// opens where a visitor would open the day, at walking scale, instead of on top
// of the mountain looking down at it. Since 2026-08-05 it is also what the
// "back to Le Pont" button does, which is why it is a function - and that button
// doubles as the way out if a restored position ever turns out to be somewhere
// useless.
//
// Falls back through any trailhead, then the peak the park is named for, then
// whatever is first: a missing POI must not leave the camera at the placeholder
// 3,000 m with nothing under it.
function goToDefaultSpawn() {
  const sampleRenderedHeight = controls.getGroundHeight;
  const pois = poiIndex?.manifest.pois;
  if (!sampleRenderedHeight || !pois?.length) return false;

  const spawn = pois.find((p) => p.name === 'Le Pont' && p.category === 'trailhead')
    ?? pois.find((p) => p.category === 'trailhead')
    ?? pois.find((p) => p.name === 'Gran Paradiso')
    ?? pois[0];
  if (!spawn) return false;

  // Face Gran Paradiso, ~5.2 km ESE of Le Pont - the view that gives the place its
  // point - and stand back along that same line so the trailhead's own marker is
  // in front of the camera rather than through it.
  const target = pois.find((p) => p.name === 'Gran Paradiso') ?? spawn;
  const toTarget = new THREE.Vector2(target.local.x - spawn.local.x, target.local.z - spawn.local.z);
  if (toTarget.lengthSq() < 1) toTarget.set(0, 1);
  toTarget.normalize();
  const BACK_OFF_M = 20;
  const sx = spawn.local.x - toTarget.x * BACK_OFF_M;
  const sz = spawn.local.z - toTarget.y * BACK_OFF_M;
  const eyeY = sampleRenderedHeight(sx, sz) + EYE_HEIGHT_M;
  camera.position.set(sx, eyeY, sz);
  // Level with the eye rather than down at the ground: from a valley floor the
  // interesting half of the view is up the valley.
  camera.lookAt(sx + toTarget.x * 400, eyeY, sz + toTarget.y * 400);
  controls.mode = 'walk';
  return true;
}

const lookDir = new THREE.Vector3();

// Everything the viewer restores or shares, read off the live objects. Position
// goes out as real lat/lon rather than local metres - see src/viewstate.js for why
// that choice is about links outliving a data rebuild.
function captureViewState() {
  if (!originReady) return null;
  const { lat, lon } = localToWGS84(camera.position.x, camera.position.z);
  return {
    lat,
    lon,
    alt: camera.position.y,
    heading: headingDegrees(camera),
    pitch: pitchDegrees(camera),
    mode: controls.mode,
    time: lighting.fraction,
    sky: weather ? weather.current : null,
    sound: audio.enabled,
    // Quality preferences. Read off the controls rather than off the holders they
    // drive, because the control is what the user chose - a holder can be mid-ramp
    // (the terrain tier cross-fades over 0.5 s) and would save a value nobody picked.
    terrain: envTerrain ? Number(envTerrain.value) : null,
    models: envModels ? Number(envModels.value) : null,
    cover: envGroundcover ? Number(envGroundcover.value) : null,
  };
}

// Put the camera and the environment back. Returns false if the state cannot be
// honoured, so the caller can fall through to the default spawn rather than
// leaving the camera at the 3,000 m placeholder.
function applyViewState(state) {
  if (!state) return false;
  const sampleRenderedHeight = controls.getGroundHeight;
  if (!sampleRenderedHeight || !worldHalf) return false;

  let local;
  try {
    local = wgs84ToLocal(state.lat, state.lon);
  } catch {
    return false; // origin not set yet, or an unprojectable coordinate
  }
  // The bbox test the height sampler cannot give us (it clamps, see worldHalf).
  if (Math.abs(local.x) > worldHalf.x || Math.abs(local.z) > worldHalf.z) return false;

  const ground = sampleRenderedHeight(local.x, local.z);
  if (!Number.isFinite(ground)) return false;

  controls.mode = state.mode;
  // Walking is ground-clamped anyway, so the stored altitude only matters in fly
  // mode - and even there it is floored to just above the terrain, which is what
  // makes a stale save or a hand-edited link unable to strand the camera inside a
  // mountain.
  const y = state.mode === 'fly'
    ? Math.max(state.alt, ground + 2)
    : ground + EYE_HEIGHT_M;
  camera.position.set(local.x, y, local.z);
  directionFromHeadingPitch(state.heading, state.pitch, lookDir);
  camera.lookAt(camera.position.x + lookDir.x * 100, camera.position.y + lookDir.y * 100, camera.position.z + lookDir.z * 100);

  if (state.time != null) {
    lighting.setTime(state.time);
    envTime.value = String(state.time);
    envTimeLabel.textContent = lighting.label;
  }
  if (state.sky && weather) {
    const index = WEATHER_KEYS.indexOf(state.sky);
    if (index >= 0) {
      weather.set(index);
      envWeather.value = String(index);
    }
  }
  return true;
}

// Autosave. Throttled, and only written when the serialised state actually
// changes - the quantisation in viewstate.js (5 decimals of latitude, whole
// degrees of heading) doubles as the change detector, so standing still writes
// nothing at all no matter how much the camera jitters.
const SAVE_INTERVAL_S = 2;
let saveAccum = 0;
let lastSaved = '';
let spawnSettled = false;

// Put a stored quality choice back on its control, BEFORE that control's own start-up
// code reads it. That ordering is the whole trick: the terrain tier's bootstrap calls
// applyTerrainQuality(), which reads envTerrain.value, so setting the value first makes
// the stored level load instead of the default with no second loading path.
//
// Only from storedState, never from a shared link - see the note in viewstate.js. And
// only if the control still offers that value: option lists change, and a select forced
// to a value it does not have reads back as empty, which would then be saved.
function restoreChoice(el, value) {
  if (!el || value == null) return false;
  const wanted = String(value);
  if (![...el.options].some((o) => o.value === wanted)) return false;
  el.value = wanted;
  return true;
}

function saveNow() {
  // Nothing before the spawn is real: until the restore-or-Le-Pont decision has
  // run, the camera is still at the 3,000 m placeholder, and saving that would
  // overwrite a perfectly good stored position with a fake one if the page were
  // closed while loading.
  if (!spawnSettled) return;
  const state = captureViewState();
  if (!state) return;
  // buildHash() deliberately leaves the preferences out - they are not part of a
  // shareable view - so the signature has to carry them itself or a change of quality
  // would never be detected and never saved.
  const signature = `${buildHash(state)}&s=${state.sound ? 1 : 0}`
    + `&t=${state.terrain}&m=${state.models}&c=${state.cover}`;
  if (signature === lastSaved) return;
  lastSaved = signature;
  saveViewState(state);
}

// Belt and braces on the way out: 'hidden' fires when a tab is switched, closed
// or backgrounded, including on mobile where 'unload' is simply never delivered.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveNow();
});
window.addEventListener('pagehide', saveNow);

// Spawn once both terrain (for ground height) and POI (for a real landmark
// to start near) are ready - avoids an intermediate wrong-looking position.
Promise.all([terrainPromise, poiPromise, trailsPromise]).then(([{ sampleRenderedHeight }, index, trails]) => {
  // Both were built from true heightfield elevations, which is not quite the
  // surface the terrain draws - re-seat them on it (see each module's
  // alignToGround) so markers plant in the ground and trails lie on the path.
  index.alignToGround(sampleRenderedHeight);
  trails.alignToGround(sampleRenderedHeight);

  // The 51 rifugi and bivacchi as buildings (2026-08-19). Built HERE rather than from
  // its own loader because it needs both halves of this promise: the hut POIs, and the
  // drawn surface to stand them on - a building placed at poi.elevationM would be
  // buried or on stilts, which is the same trap poi.js's own comment describes.
  huts = createHuts({
    pois: index.manifest.pois.filter((poi) => poi.category === 'hut'),
    sampleHeight: sampleRenderedHeight,
  });
  scene.add(huts.group);
  huts.update(camera); // materialise them before the next frame, like the wildlife
  registerSeatable({ name: 'huts', alignToGround: huts.alignToGround });
  // And the post that stood for each of them steps aside once its building is there.
  index.setBuildingProbe(huts.hasBuilding);
  applyModelDetail(); // the Models control may already be High from a restored choice
  // And REGISTER them, because seating them once here is not enough: the height tier
  // loads after the first frame and moves the drawn surface under them by up to 44 m.
  // Measured at Le Pont before this was fixed - the dashed trails sat at a constant
  // 1.50 m above the ground with no tier, and at -8.42 to +12.12 m with the 10 m level
  // on. The user reported the river; the trails and the POI markers had it too.
  registerSeatable({ name: 'poi', alignToGround: index.alignToGround });
  registerSeatable({ name: 'trails', alignToGround: trails.alignToGround });
  // And seat whatever else had already registered while the terrain was still
  // loading - the water usually, since its fetch is small and lands first.
  reseatOnDrawnSurface();

  // A shared link first, then where you left off, then Le Pont (src/viewstate.js).
  if (!applyViewState(pendingView)) goToDefaultSpawn();
  pendingView = null;
  spawnSettled = true;
  saveNow(); // baseline, so the first autosave tick has something to compare against
});

let waterUpdate = null;
// Everything whose geometry was built from BAKED elevations and therefore has to be
// re-seated whenever the drawn surface moves. See reseatOnDrawnSurface() below: the
// height tier is what moves it, and these were being seated exactly once.
const seatable = [];
// Registering seats it straight away when the terrain is already up, so a layer that
// arrives late does not wait for a change of tier level to be put on the ground. The
// two loaders race in either order, so both sides handle it: this covers terrain-first,
// and the spawn block below covers water-first.
//
// Without this the water kept its BAKED elevations whenever the tier was off, which
// measured -0.97 to +3.68 m against the drawn ground where it should be a flat 3.00 -
// and the negative end of that is a river running under the ground it belongs to.
function registerSeatable(entry) {
  seatable.push(entry);
  if (terrainSurface) {
    try {
      entry.alignToGround(terrainSurface.sampleRenderedHeight);
    } catch (err) {
      console.error(`Could not seat ${entry.name} on the drawn surface:`, err.message);
    }
  }
}
// The forest roads ride along with the other OSM layers: same licence line,
// same re-seating, and like the trails they are geometry with no update loop.
let roadsLayer = null;
loadRoads().then((result) => {
  const { group, manifest, alignToGround } = result;
  roadsLayer = result; // for the resize handler: a fat line's width is in screen pixels
  scene.add(group);
  registerSeatable({ name: 'roads', alignToGround });
  creditLines.osm =
    `${manifest.source.attribution} ` +
    `<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">${manifest.source.license}</a>`;
  renderCredits();
});

loadWater().then(({ group, manifest, update, alignToGround }) => {
  scene.add(group);
  waterUpdate = update;
  registerSeatable({ name: 'water', alignToGround });
  // Lakes, rivers and waterfalls become audible from the same geometry that
  // draws them - see buildWaterEarshot() in src/audio.js.
  audio.setWater(manifest);
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
  // The gesture the autoplay policy asks for. This click already exists and is
  // already the first thing anyone does (it grabs pointer lock), so the ambience
  // starts with the first look around rather than needing its own "enable sound"
  // step. audio.start() is idempotent.
  if (audio.enabled) audio.start();
});

// Dev-only handle for the test tools. Nothing in the app reads this, and Vite
// strips the branch from a production build. Added 2026-08-03 after repeatedly
// needing to measure camera state from outside (the mouse-look smoothness
// investigation being the case that finally justified it): the alternative is
// re-deriving the whole scene in a test page, which stops testing the real one.
if (import.meta.env.DEV) {
  window.__pngp = {
    camera, controls, scene, renderer, lighting, audio,
    // The drawn surface and the grid it is drawn from. A probe that wants to
    // stand somewhere chosen by terrain (dense canopy, a north face, a given
    // elevation) needs both, and the alternative is a second loadTerrain() that
    // re-decodes 19 MB to answer a question the running page already knows -
    // or, worse, bbox numbers copied into a tool, which is the kind of thing
    // that went stale the one time this bbox was rebuilt.
    //
    // Getters, like the wildlife and the birds below: the terrain arrives from a
    // promise, so there is no `terrain` in scope out here. Naming one directly
    // is a ReferenceError that takes the whole module down with it, and since
    // this block is the last thing main.js runs, the symptom is a page that
    // loads, renders and simply never publishes the handle.
    getGroundHeight: () => terrainSurface?.sampleRenderedHeight,
    // The TRUE bilinear height as well as the drawn one. They differ wherever the
    // tile grid is coarser than the data, and anything placed in a shader samples
    // the former while the eye sees the latter - so a probe needs both to tell
    // "floating" from "correct".
    getBilinearHeight: () => terrainSurface?.sampleHeight,
    getManifest: () => terrainSurface?.manifest,
    // A getter, not the value: this object is built while loadTerrain() is still
    // in flight, so capturing terrainSurface here would publish a frozen null -
    // the same trap the comment above this block describes.
    get terrain() { return terrainSurface; },
    getPoiIndex: () => poiIndex,
    // The buildings, for a probe that needs to ask where one was seated and which
    // level it is drawn at - a getter because they are created after this block runs.
    getHuts: () => huts,
    getWildlife: () => wildlife, // loads late, so a getter rather than the value
    // Same reason, and a probe needs it for a second one: the fine trees' near set is
    // refilled from the render loop, so anything that renders a frame of its own has
    // to drive that itself or it measures a forest with no near trees in it.
    getVegetation: () => vegetation,
    // The canopy mask on the CPU, for the same reason getGroundHeight is here: a probe
    // that wants to stand IN A WOOD has to be able to find one, and the alternative is
    // coordinates copied into a tool - which is exactly what went stale the one time
    // this bbox was rebuilt. Added 2026-08-17, when a screenshot meant to show the
    // fine tree model was taken twice above the treeline.
    getCanopy: () => canopySampler,
    getBasemapLevel: () => basemapLevel,
    getBirds: () => birds,
    // The satellite ground texture, published as the HOLDERS themselves so a probe
    // can A/B the ground colour in ONE session from ONE camera - the only honest
    // way to compare two looks, since two runs differ in animals, birds and gust
    // (docs/PROGRESS-ARCHIVE.md 2026-08-10, "a separate render is not the same scene").
    //
    // Handed over here rather than left to a probe's own `import('/src/basemap.js')`,
    // which is a trap: after any HMR reload the page holds the module as
    // `/src/basemap.js?t=<stamp>` and a bare-path import gets a SECOND instance,
    // with its own untouched holders. Pinning that one changes nothing on screen
    // and reads back exactly the value it just wrote.
    basemap: {
      mix: BASEMAP_MIX,
      scale: BASEMAP_SCALE,
      gain: BASEMAP_GAIN,
      getTexture: () => BASEMAP.value,
    },
    // Published for the same reason, and it closes the same trap: anything pinning
    // the lying-snow level from outside must pin THIS object, not one it imported
    // for itself.
    snowLevel: SNOW_LEVEL,
    // Grass, shrubs and the flowers. The holders themselves, again for the reason
    // spelled out above the basemap block: a probe importing '/src/groundcover.js'
    // by bare path after any HMR reload gets a SECOND module instance whose holders
    // nothing reads. `counts` reads the LIVE instanceCount, which is what tells
    // "the density knob reached the geometry" from "it set a field nobody reads".
    groundcover: {
      density: GROUNDCOVER_DENSITY,
      wind: GROUNDCOVER_WIND,
      time: GROUNDCOVER_TIME,
      groundSegments: GROUND_SEGMENTS,
      apply: () => groundcover?.applyDensity(),
      getStats: () => groundcover?.stats,
      counts: () => groundcover?.layers.map((l) => ({ kind: l.kind, drawn: l.geometry.instanceCount, of: l.count })),
      // The CPU twin of the value the vertex shader samples, so a probe can ask
      // "what does the mask say HERE" instead of inferring it from pixels.
      coverAt: (x, z) => landcoverCoverAt?.(x, z) ?? null,
      getMaskSize: () => {
        const img = LANDCOVER_MASK.value?.image;
        return { width: img?.width ?? 0, height: img?.height ?? 0 };
      },
      mask: LANDCOVER_MASK,
      // The layer meshes themselves, so a probe can A/B ONE layer at a time. The
      // first render measurement of this feature reported 21.9% of pixels changed
      // and was believed - it was entirely the shrubs, and the grass it was
      // supposed to be measuring was drawing nothing at all. One number for two
      // layers is not a measurement of either.
      getLayers: () => groundcover?.layers,
    },
    edelweiss: {
      getDiag: () => edelweiss?.diag,
      // So a probe can walk to a real flower instead of hunting for one: the same
      // patchFor() the renderer uses, not a second guess at it.
      nearest: (x, z, cells) => edelweiss?.findNearestPatch(x, z, cells),
    },
    // Same discipline again, for the sky's altitude (src/sky.js): the holder
    // itself, so a probe can compare two altitudes from ONE camera, plus the model
    // it is driving so a test can bracket a pixel without re-deriving Preetham on
    // its own side. `lengths` reads the LIVE uniforms, which is the only way to
    // tell "the pin reached the shader" from "the pin set a field nobody reads".
    // The distance haze, for the same reason and with the same trap closed: the
    // uniform is rewritten every frame from the time-of-day preset, so the knob a
    // probe (or a console) can actually move is the SCALE holder, and `haze` reads
    // the live uniform so a shot can report the value it was taken at rather than
    // the value someone meant to set.
    atmo: {
      hazeScale: HAZE_SCALE,
      uniforms: ATMO.uniforms,
      haze: () => ATMO.uniforms.uAtmoHaze.value,
    },
    sky: {
      altitude: SKY_ALTITUDE_OVERRIDE,
      strength: SKY_ALTITUDE_STRENGTH,
      lengthsFor: (m) => skyAltitudeLengths(m),
      lengths: () => ({
        rayleighZenithLength: sky.material.uniforms.rayleighZenithLength.value,
        mieZenithLength: sky.material.uniforms.mieZenithLength.value,
      }),
    },
  };

  // 'G' stands next to the nearest animal, cycling species on each press. Purely
  // a testing aid, and only reachable in dev: judging the animals needs a real
  // browser (headless cannot rate how they read or how the fox's approach feels),
  // and without this that means hunting a 25 cm squirrel across the whole park.
  let goSpecies = 0;
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'KeyG' || !wildlife) return;
    if (isTypingTarget(document.activeElement)) return;
    const name = wildlife.species[goSpecies % wildlife.species.length];
    goSpecies += 1;
    const found = wildlife.findNearest(name, camera.position.x, camera.position.z);
    if (!found) {
      devNoteEl.textContent = `no ${name} found within reach`;
      return;
    }
    // 18 m off, which is outside every reaction radius except the fox's curiosity -
    // so the animal is undisturbed when you arrive and you can then walk in.
    const angle = Math.atan2(camera.position.x - found.x, camera.position.z - found.z);
    const cx = found.x + Math.sin(angle) * 18;
    const cz = found.z + Math.cos(angle) * 18;
    const ground = controls.getGroundHeight?.(cx, cz) ?? 0;
    camera.position.set(cx, ground + EYE_HEIGHT_M, cz);
    camera.lookAt(found.x, (controls.getGroundHeight?.(found.x, found.z) ?? ground) + 0.7, found.z);
    wildlife.update(1 / 60, camera); // materialise the herd before the next frame draws
    devNoteEl.textContent = `${name}: 18 m ahead (it was ${(found.distanceM / 1000).toFixed(1)} km away)`;
  });

  // 'B' does the same for the birds, and needs to: the whole point of the raptors
  // is that they are rare, so hunting one on foot to judge how it reads would be
  // absurd. It stands you 70 m to one side and looks up, because straight
  // underneath is the one angle from which a soaring bird is just a dot.
  let birdSpecies = 0;
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'KeyB' || !birds) return;
    if (isTypingTarget(document.activeElement)) return;
    const name = birds.species[birdSpecies % birds.species.length];
    birdSpecies += 1;
    const found = birds.findNearest(name, camera.position.x, camera.position.z);
    if (!found) {
      devNoteEl.textContent = `no ${name} found within reach`;
      return;
    }
    const bearing = Math.atan2(camera.position.x - found.x, camera.position.z - found.z);
    const standX = found.x + Math.sin(bearing) * 70;
    const standZ = found.z + Math.cos(bearing) * 70;
    const ground = controls.getGroundHeight?.(standX, standZ) ?? 0;
    camera.position.set(standX, ground + EYE_HEIGHT_M, standZ);
    camera.lookAt(found.x, found.y, found.z);
    birds.update(1 / 60, camera); // materialise it before the next frame draws
    const agl = Math.round(found.y - ground);
    devNoteEl.textContent = `${name}: 70 m off, ${agl} m up`
      + `${found.site ? ` at ${found.site}` : ''}`
      + ` (it was ${(found.distanceM / 1000).toFixed(1)} km away)`;
  });

  // 'H' sweeps the distance haze in place, because "is there enough air between
  // the ridges" is a looking decision and cannot be taken from a table of
  // exponentials - and because headless is SwiftShader, so a screenshot of it is
  // the shape of the change and not the change (docs/ARCHITECTURE.md §13.11).
  // It moves HAZE_SCALE, the holder lighting.js multiplies in, rather than the
  // uniform: the uniform is rewritten every frame and an assignment to it reads
  // back its own write. The note prints what the sweep has actually reached -
  // the LIVE uniform, and the fraction of the ground colour it has taken at
  // three real distances - so a value the user likes can be read off the screen
  // instead of recomputed afterwards.
  const HAZE_STEPS = [0.6, 1, 1.5, 2.2, 3];
  let hazeStep = 1; // start on the shipped look, so the first press is a change
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'KeyH') return;
    if (isTypingTarget(document.activeElement)) return;
    hazeStep = (hazeStep + 1) % HAZE_STEPS.length;
    HAZE_SCALE.value = HAZE_STEPS[hazeStep];
    // Read the uniform AFTER the next frame writes it, so the note cannot claim a
    // value the shader never saw.
    requestAnimationFrame(() => {
      const h = ATMO.uniforms.uAtmoHaze.value;
      const at = (km) => `${Math.round((1 - Math.exp(-km * 1000 * h)) * 100)}%`;
      devNoteEl.textContent = `haze x${HAZE_SCALE.value} = ${(h * 1e5).toFixed(2)}e-5`
        + ` \u00b7 10 km ${at(10)} \u00b7 30 km ${at(30)} \u00b7 60 km ${at(60)}`;
    });
  });
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  // The fat lines (roads, and the Alta Via casing) measure their width in screen
  // pixels, so they need the new canvas size or they scale with the window.
  roadsLayer?.setResolution(window.innerWidth, window.innerHeight);
  trailsLayer?.setResolution(window.innerWidth, window.innerHeight);
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

// Ground cover density. The knob is free by construction: src/groundcover.js
// shuffles its lattice, so drawing the first N instances of it thins the cover
// evenly everywhere instead of cutting a spatial band out of it. Declared before
// the loaders' callback can call it - applyGroundcoverDensity is hoisted as a
// function declaration, the const `groundcover` it reads is not, which is why it
// tests for null rather than assuming.
// The high-resolution terrain tier. Its data is a separate download, so the control
// has three jobs rather than one: fetch, install, and say so while it is happening -
// 25 MB on a mountain refuge's connection is not instant, and a knob that appears to
// do nothing for ten seconds reads as broken.
//
// The select's value is the tier LEVEL PLUS ONE, so 0 stays "no tier at all" and the
// levels stay in the manifest's own order (coarsest first). Medium is the default by
// the user's decision (2026-08-14) - the first one that costs a download.
const envTerrain = document.getElementById('env-terrain');

// A RAMP, NOT A STEP. Turning the tier on moves the ground by up to 44 m and swapping
// between its levels by about 2 m, and the camera, the markers and every scatter
// stand on that ground. setHeightTierMix() was built to be crossfaded; nothing was
// doing it. Driven from the render loop, which is the only place with a delta.
const TIER_FADE_S = 0.5;
let tierMix = 0;
let tierMixTarget = 0;
let tierMixSettled = null;
function rampTierMix(to) {
  tierMixTarget = to;
  if (tierMix === to) return Promise.resolve();
  const previous = tierMixSettled;
  const p = new Promise((resolve) => { tierMixSettled = resolve; });
  previous?.(); // a new target supersedes an older wait rather than stranding it
  return p;
}
// Re-seat everything built from baked elevations onto the surface as it is drawn NOW.
//
// Called on every frame of the tier's cross-fade rather than only when it settles,
// because the ground is moving throughout those 0.5 s: seating only at the end would
// have a trail slide into place after the hill it lies on had already stopped. About
// 2,200 vertices across trails, POI and the rivers, so it is a few thousand sampler
// calls on the frames of one ramp and nothing at all otherwise.
function reseatOnDrawnSurface() {
  if (!terrainSurface) return;
  const h = terrainSurface.sampleRenderedHeight;
  for (const s of seatable) {
    try {
      s.alignToGround(h);
    } catch (err) {
      // One layer failing to re-seat must not stop the others, and must not take the
      // render loop down with it.
      console.error(`Could not re-seat ${s.name} on the drawn surface:`, err.message);
    }
  }
}

function updateTierMix(dt) {
  if (!terrainSurface || tierMix === tierMixTarget) return;
  const step = dt / TIER_FADE_S;
  const gap = tierMixTarget - tierMix;
  tierMix += Math.sign(gap) * Math.min(step, Math.abs(gap));
  terrainSurface.setHeightTierMix(tierMix);
  reseatOnDrawnSurface();
  if (tierMix === tierMixTarget) {
    tierMixSettled?.();
    tierMixSettled = null;
  }
}

async function applyTerrainQuality() {
  if (!envTerrain) return;
  const want = Number(envTerrain.value);
  if (!want) {
    await rampTierMix(0);
    return;
  }
  const level = want - 1;
  const already = terrainSurface?.heightTierLevel?.() ?? -1;
  envTerrain.disabled = true;
  try {
    // Fade out before swapping one level for another: the 10 m and 5 m surfaces
    // differ by about 2 m, which is a visible bump under a walking camera. Coming
    // from Standard there is nothing on the ground yet, so nothing to fade out.
    if (already >= 0 && already !== level && tierMix > 0) await rampTierMix(0);
    const loaded = await terrainSurface?.loadHeightTier(level);
    if (loaded) await rampTierMix(1);
    else envTerrain.value = '0';
  } catch (err) {
    console.error('The high-resolution terrain failed to load:', err.message);
    envTerrain.value = '0';
  } finally {
    envTerrain.disabled = false;
  }
}

if (envTerrain) {
  envTerrain.addEventListener('change', () => { void applyTerrainQuality(); });
  // WHAT EACH OPTION COSTS COMES FROM THE MANIFEST, because the hand-written "7 MB"
  // in the HTML was still there after the tier became 25 MB - which the user spotted
  // before anything else. A number in two places is a number that disagrees with
  // itself eventually.
  const labelLevels = async () => {
    const baseRes = terrainSurface?.manifest?.resolutionMPerPx?.x;
    const m = await (terrainSurface?.heightTierManifest?.() ?? null);
    for (const option of envTerrain.options) {
      const name = option.dataset.name;
      const index = Number(option.value) - 1;
      if (index < 0) {
        if (baseRes) option.textContent = `${name} · ${baseRes.toFixed(1)} m`;
        continue;
      }
      const level = m?.levels?.[index];
      if (!level) {
        // A level the manifest does not have is a download that cannot happen. Say
        // so, rather than leaving an option that looks available and does nothing.
        option.disabled = true;
        option.textContent = `${name} · unavailable`;
        continue;
      }
      const mb = level.file.gzipBytes / 1048576;
      option.textContent = `${name} · ${level.resolutionMPerPx.x.toFixed(0)} m · `
        + `${mb < 10 ? mb.toFixed(1) : mb.toFixed(0)} MB`;
    }
  };
  // A stored choice beats the Medium default, and it has to be put on the control
  // BEFORE the bootstrap below reads it - which is also what keeps a returning visitor
  // who chose Standard from downloading 6.7 MB they had already turned down.
  restoreChoice(envTerrain, storedState?.terrain);
  // Medium is the default, so its level loads without being asked for - but AFTER the
  // scene is up rather than in front of it. 7 MB ahead of the first frame would trade
  // an instant start for a better ground, and the ground can arrive a moment late.
  terrainPromise.then(() => {
    void labelLevels();
    requestAnimationFrame(() => { void applyTerrainQuality(); });
  });
}

const envGroundcover = document.getElementById('env-groundcover');
function applyGroundcoverDensity() {
  GROUNDCOVER_DENSITY.value = Number(envGroundcover.value);
  groundcover?.applyDensity();
}
envGroundcover.addEventListener('change', applyGroundcoverDensity);
restoreChoice(envGroundcover, storedState?.cover);
GROUNDCOVER_DENSITY.value = Number(envGroundcover.value);

// The high-resolution flora and fauna models. Nothing to load and nothing to
// rebuild: both levels of every model are built at startup and the choice only
// decides which mesh each animal's instance is written into, per frame - so this
// is a flag, not a swap, and it can be flipped mid-stride without a hitch.
const envModels = document.getElementById('env-models');
function applyModelDetail() {
  setModelDetail(Number(envModels.value));
  vegetation?.applyDetail();
  // The huts' High level is the tricolour on the bivouacs (the user's own addition,
  // 2026-08-19). Same reason as vegetation's: without this the change waits for the
  // camera to walk 30 m and the control looks broken.
  huts?.applyDetail();
}
envModels.addEventListener('change', applyModelDetail);
restoreChoice(envModels, storedState?.models);
applyModelDetail();

// Ambient sound: the checkbox and 'M' are two views of the same state, so both
// paths go through here.
const envAudio = document.getElementById('env-audio');
function setAudioEnabled(on) {
  audio.setEnabled(on);
  envAudio.checked = on;
}
envAudio.addEventListener('change', () => {
  setAudioEnabled(envAudio.checked);
  // Same reason the credits toggle blurs itself, and it is NOT the reason this
  // comment used to give ("controls.js ignores the movement keys while a form
  // control has focus"): that was true of every control until 2026-08-11 and is
  // now true of none of them. What is still true is narrower and only applies to
  // a checkbox and a button - Space is a movement key, controls.js cancels it,
  // and Space is also how you toggle a focused checkbox. So this one hands focus
  // back; the weather picker and the time slider deliberately do not, because
  // keeping focus is how their arrow keys work and no movement key collides.
  envAudio.blur();
});
window.addEventListener('keydown', (event) => {
  if (event.code !== 'KeyM') return;
  if (isTypingTarget(document.activeElement)) return;
  setAudioEnabled(!audio.enabled);
});
// The sound setting is a preference, not part of the view: it is restored from
// storage even when a shared link decides everything else, and it deliberately
// never travels in a link (src/viewstate.js).
if (storedState && typeof storedState.sound === 'boolean') setAudioEnabled(storedState.sound);

// Copy a link to exactly this view. It also puts the hash in the address bar, so
// the link is available even if the clipboard is refused (permission, insecure
// context) - which is why the two happen together rather than one or the other.
const copyLinkButton = document.getElementById('copy-link');
copyLinkButton.addEventListener('click', async (event) => {
  event.stopPropagation();
  copyLinkButton.blur();
  const state = captureViewState();
  if (!state) return;
  const hash = buildHash(state);
  history.replaceState(null, '', hash);
  const url = window.location.href;
  let copied = false;
  try {
    await navigator.clipboard.writeText(url);
    copied = true;
  } catch {
    copied = false;
  }
  copyLinkButton.textContent = copied ? 'link copied' : 'link in the address bar';
  setTimeout(() => { copyLinkButton.textContent = 'copy link'; }, 2000);
});

// Back to the default spawn - and the way out if a restored position is ever
// somewhere useless. Saves immediately so the autosave cannot put you straight
// back where you were.
const resetViewButton = document.getElementById('reset-view');
resetViewButton.addEventListener('click', (event) => {
  event.stopPropagation();
  resetViewButton.blur();
  if (!goToDefaultSpawn()) return;
  history.replaceState(null, '', window.location.pathname + window.location.search);
  saveNow();
});

const timer = new THREE.Timer();

const fpsEl = document.getElementById('fps');
let fpsFrames = 0;
let fpsAccum = 0;

// Dev-only readout for the mouse-look jump still open on 2026-08-04. The angle
// maths is already ruled out - tools/dev/probe-pitch-sweep.mjs shows pitch
// advancing uniformly across the entire range, with zero yaw drift and zero
// roll - so a jump at one particular moment has to come from the input side:
// either one oversized delta (the OS/browser warping the locked pointer) or a
// frame long enough to queue several events and then spend them together.
// Those are different fixes, so the peaks are shown side by side and whichever
// spikes when a jump is seen names the cause. Built from JS rather than
// index.html so it cannot reach a production build at all.
let lookDiagEl = null;
let devNoteEl = null; // separate from the peaks line, which is rewritten at 4 Hz
let audioDiagEl = null;
if (import.meta.env.DEV) {
  lookDiagEl = document.createElement('div');
  lookDiagEl.id = 'look-diag';
  lookDiagEl.style.cssText = 'position:fixed;top:30px;right:10px;padding:3px 7px;'
    + 'background:rgba(10,14,20,0.55);border-radius:4px;color:#ffd479;'
    + 'font:11px/1.4 -apple-system,system-ui,sans-serif;pointer-events:none;';
  fpsEl.after(lookDiagEl);

  devNoteEl = document.createElement('div');
  devNoteEl.id = 'dev-note';
  devNoteEl.style.cssText = 'position:fixed;top:52px;right:10px;padding:3px 7px;'
    + 'background:rgba(10,14,20,0.55);border-radius:4px;color:#9fe0a0;'
    + 'font:11px/1.4 -apple-system,system-ui,sans-serif;pointer-events:none;';
  devNoteEl.textContent = 'G: next mammal · B: next bird · H: haze';
  lookDiagEl.after(devNoteEl);

  // What the ambience is currently being driven by. Audio is the one feature so
  // far with no visual at all, so without this there is no way to tell a layer
  // that is correctly silent from one that is broken - and "I can't hear
  // anything" is not a diagnosis (docs/PROGRESS.md's standing rule about
  // measuring instead of trusting).
  audioDiagEl = document.createElement('div');
  audioDiagEl.id = 'audio-diag';
  audioDiagEl.style.cssText = 'position:fixed;top:74px;right:10px;padding:3px 7px;'
    + 'background:rgba(10,14,20,0.55);border-radius:4px;color:#9fd0ff;'
    + 'font:11px/1.4 -apple-system,system-ui,sans-serif;pointer-events:none;'
    + 'text-align:right;white-space:pre;'; // two lines, laid out by hand
  devNoteEl.after(audioDiagEl);
}

// Phase 5 nav HUD (docs/ARCHITECTURE.md §7): heading compass, live lat/lon +
// elevation, nearest named POI. Throttled like the fps counter - a compass/
// position readout doesn't need per-frame precision.
const compassNeedle = document.getElementById('compass-needle');
const navHeadingEl = document.getElementById('nav-heading');
const navPositionEl = document.getElementById('nav-position');
const navNearestEl = document.getElementById('nav-nearest');
const navFlowerEl = document.getElementById('nav-flower');
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
  wildlife?.update(timer.getDelta(), camera);
  // The fine trees' near set follows the camera. It costs nothing until the camera
  // has walked HI_REFILL_M and nothing at all while Models is Standard.
  vegetation?.update(camera);
  birds?.update(timer.getDelta(), camera);
  lighting.applyState(); // re-grades every frame so an in-progress weather transition stays live
  // The sky's own air column, which depends on how high the camera is rather than
  // on the time of day - so it is driven here and not from lighting.applyState().
  // World Y is real elevation in metres (docs/ARCHITECTURE.md §6), so the camera's
  // altitude ASL is just its y. Two uniform writes (src/sky.js).
  updateSkyAltitude(sky, camera.position.y);
  // How much snow has fallen and not yet melted. weather.js has accumulated this
  // since phase 4 and both the haze and the footsteps have always read it; the
  // terrain never did, so it snowed without the ground ever going white (found
  // 2026-08-10 by the user simply watching and waiting). Driven here rather than
  // inside terrain.js so nothing downstream has to know about weather.js: this
  // one holder now feeds the ground, the trees and the footsteps alike
  // (src/snow.js decides which of them is actually snowy, and where).
  SNOW_LEVEL.value = weather?.mod.snow ?? 0;
  // Grass and shrubs bend in the same wind audio.js turns into hiss, so the two
  // cannot disagree about how windy it is. The clock is separate from the water's
  // because this one must keep running while the water is still (src/groundcover.js).
  GROUNDCOVER_TIME.value = timer.getElapsed();
  GROUNDCOVER_WIND.value = weather?.mod.wind ?? 0;
  // The flowers are CPU-placed, so unlike the grass they need the loop. Cheap: 25
  // cached cells and at most a few hundred matrices (src/edelweiss.js).
  edelweiss?.update(camera);
  // 51 buildings, two distance levels: a pass over all of them costs nothing and only
  // runs when the camera has walked far enough to change any of it (src/huts.js).
  huts?.update(camera);
  // The terrain tier's cross-fade. Here because this is the only place with a frame
  // delta, and because the ground has to move over several frames rather than one:
  // everything in the scene is standing on it.
  updateTierMix(timer.getDelta());

  fpsFrames += 1;
  fpsAccum += timer.getDelta();
  if (fpsAccum >= 0.5) {
    fpsEl.textContent = `${Math.round(fpsFrames / fpsAccum)} fps`;
    fpsFrames = 0;
    fpsAccum = 0;
  }

  saveAccum += timer.getDelta();
  if (saveAccum >= SAVE_INTERVAL_S) {
    saveAccum = 0;
    saveNow();
  }

  navAccum += timer.getDelta();
  if (navAccum >= 0.25) {
    navAccum = 0;
    const heading = headingDegrees(camera);
    compassNeedle.style.transform = `translate(-50%, -100%) rotate(${heading}deg)`;
    const pitch = pitchDegrees(camera);
    navHeadingEl.textContent = `${compassLabel(heading)} ${Math.round(heading)}°`
      + ` · pitch ${pitch >= 0 ? '+' : '-'}${Math.abs(pitch).toFixed(0)}°`;

    if (lookDiagEl) {
      const d = controls.lookDiag;
      lookDiagEl.textContent = `look peaks/3s: ${d.eventPx.value.toFixed(0)} px/event`
        + ` · ${d.eventsPerFrame.value.toFixed(0)} ev/frame`
        + ` · ${d.frameMs.value.toFixed(0)} ms/frame`
        + ` · ${d.stepDeg.value.toFixed(2)}°/frame`
        // The warp filter's own report: how many pointer warps it has thrown away
        // and how big the worst recent one was.
        + ` · warps ${controls.spikesRejected} (worst ${d.spikePx.value.toFixed(0)} px)`;
    }

    if (audioDiagEl) {
      const a = audio.diag;
      if (!a.started) {
        audioDiagEl.textContent = `sound: ${a.enabled ? 'click to start' : 'off'}`;
      } else {
        const near = (kind) => {
          const d = a.water?.[kind]?.distanceM;
          return d != null && Number.isFinite(d) ? `${Math.round(d)} m` : '-';
        };
        audioDiagEl.textContent = `wind ${a.strength.toFixed(2)}`
          + ` (alt ${a.altitude.toFixed(2)} exp ${a.exposure.toFixed(2)} gust ${a.gust.toFixed(2)})`
          + ` · canopy ${a.canopy.toFixed(2)}`
          + `\nwater ${a.gains.waterLow?.toFixed(2)}/${a.gains.waterHigh?.toFixed(2)}`
          + ` · fall ${near('waterfall')} river ${near('river')} lake ${near('lake')}`
          + ` · calls ${audio.callsPlayed}`;
      }
    }

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

    // The edelweiss hint. Two states worth distinguishing: close enough that it
    // counts as found, and close enough to be worth walking towards.
    if (navFlowerEl) {
      const d = edelweiss?.diag;
      if (!d || d.nearestM === null) {
        navFlowerEl.textContent = d?.foundCount ? `Edelweiss found: ${d.foundCount}` : '';
      } else if (d.nearestM <= FOUND_RADIUS_M) {
        navFlowerEl.textContent = `Edelweiss, right here (${d.foundCount} found)`;
      } else {
        navFlowerEl.textContent =
          `Edelweiss ${Math.round(d.nearestM)} m away, ${Math.round(d.nearestElevM)} m`
          + (d.foundCount ? ` · ${d.foundCount} found` : '');
      }
    }

    poiIndex?.updateMarkers(camera);
    // Which trail am I on: the label follows the nearest point of each nearby
    // trace, so it belongs on the same 4 Hz tick as the POI markers rather than
    // in the render loop (src/trails.js).
    trailsLayer?.updateLabels(camera);
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
  // After controls: the soundscape is driven by where the camera ended up this
  // frame and how fast it got there. Self-throttling internally (src/audio.js),
  // and a no-op until the first click starts the context. Lighting goes in for
  // its `night` weight alone - the songbirds roost after dusk and the tawny owl
  // takes over, and that weight is the one the lights are themselves using.
  // Controls goes in for its `mode` only: footsteps are the one sound tied to
  // what the user is doing, and walking is the only mode that has them.
  audio.update(timer.getDelta(), camera, weather, lighting, controls);
  // After controls, before render: the tile set must match where the camera
  // actually ended up this frame, or a fast move shows a hole at its edge.
  terrainUpdate?.(camera);
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
});
