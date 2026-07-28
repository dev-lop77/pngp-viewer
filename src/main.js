import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070a);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  10000,
);
camera.position.set(30, 30, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(50, 80, 30);
scene.add(sun);

scene.add(new THREE.GridHelper(100, 20));

// Placeholder standing in for the terrain mesh (docs/ARCHITECTURE.md §4/§8)
// - confirms the render pipeline end to end before real DEM data lands.
const placeholder = new THREE.Mesh(
  new THREE.BoxGeometry(4, 4, 4),
  new THREE.MeshStandardMaterial({ color: 0x3a7d5c }),
);
placeholder.position.y = 2;
scene.add(placeholder);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
