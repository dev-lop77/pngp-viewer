import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { loadTerrain } from './terrain.js';
import { loadTrails } from './trails.js';
import { loadPOI, poiInfoHTML } from './poi.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fc9e8);
scene.fog = new THREE.Fog(0x9fc9e8, 20000, 140000);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  10,
  200000,
);
camera.position.set(30000, 26000, 40000);

const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2200, 0);
controls.enableDamping = true;
controls.minDistance = 500;
controls.maxDistance = 120000;

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(-30000, 40000, 20000);
scene.add(sun);

loadTerrain().then(({ mesh }) => {
  scene.add(mesh);
});

const creditLines = {};
function renderCredits() {
  document.getElementById('credits').innerHTML = Object.values(creditLines).join('<br>');
}

loadTrails().then(({ group, manifest }) => {
  scene.add(group);
  // CC BY 4.0 requires this attribution wherever the data (or a render of
  // it) is shown - docs/ARCHITECTURE.md §9, tools/trails-source/README.md.
  creditLines.trails =
    `${manifest.source.attribution} ` +
    `<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">${manifest.source.license}</a>`;
  renderCredits();
});

let poiIndex = null;
loadPOI().then((index) => {
  poiIndex = index;
  scene.add(index.group);
  // ODbL requires attribution wherever OSM data is shown - docs/ARCHITECTURE.md §9.
  creditLines.poi =
    `${index.manifest.source.attribution} ` +
    `<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">${index.manifest.source.license}</a>`;
  renderCredits();
});

// Click a POI marker: show its info panel and fly the camera toward it.
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let flying = null;

function flyTo(poi) {
  const endTarget = new THREE.Vector3(poi.local.x, poi.elevationM + 50, poi.local.z);
  const viewDir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
  const endPos = endTarget.clone().addScaledVector(viewDir, 2500);
  flying = {
    startPos: camera.position.clone(),
    endPos,
    startTarget: controls.target.clone(),
    endTarget,
    t: 0,
  };
}

renderer.domElement.addEventListener('click', (event) => {
  if (!poiIndex) return;
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const poi = poiIndex.pick(raycaster);
  const panel = document.getElementById('poi-info');
  if (poi) {
    panel.innerHTML = poiInfoHTML(poi);
    panel.style.display = 'block';
    flyTo(poi);
  } else {
    panel.style.display = 'none';
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setAnimationLoop(() => {
  if (flying) {
    flying.t = Math.min(1, flying.t + 0.02);
    const e = 1 - (1 - flying.t) ** 3; // ease-out cubic
    camera.position.lerpVectors(flying.startPos, flying.endPos, e);
    controls.target.lerpVectors(flying.startTarget, flying.endTarget, e);
    if (flying.t >= 1) flying = null;
  }
  controls.update();
  renderer.render(scene, camera);
});
