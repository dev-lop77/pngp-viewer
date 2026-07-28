import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { loadTerrain } from './terrain.js';
import { loadTrails } from './trails.js';

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

const creditLines = [];
loadTrails().then(({ group, manifest }) => {
  scene.add(group);
  // CC BY 4.0 requires this attribution wherever the data (or a render of
  // it) is shown - docs/ARCHITECTURE.md §9, tools/trails-source/README.md.
  creditLines.push(
    `${manifest.source.attribution} ` +
      `<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">${manifest.source.license}</a>`,
  );
  document.getElementById('credits').innerHTML = creditLines.join('<br>');
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
