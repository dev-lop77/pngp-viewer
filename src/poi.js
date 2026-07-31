import * as THREE from 'three';
import { attachAtmo } from './atmosphere.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const CATEGORY_STYLE = {
  peak: { color: 0xffffff },
  hut: { color: 0xc17a3f },
  pass: { color: 0xab47bc },
  waterfall: { color: 0x29b6f6 },
  lake: { color: 0x1e88e5 },
};

const CATEGORY_LABELS = {
  peak: 'Vetta',
  hut: 'Rifugio',
  pass: 'Passo/Colle',
  waterfall: 'Cascata',
  lake: 'Lago',
};

// A human-scale walker used to stand right next to a real 180-220m sphere
// marker (the old size, fine seen from a 26km-high overview but enormous -
// and, right at a POI cluster, effectively inside one - once walking is the
// default navigation, see docs/PROGRESS.md 2026-07-31). Small marker dot
// (kept for raycasting/picking) + a CSS2D text label carry the name instead.
const MARKER_RADIUS_M = 4;
const HEIGHT_OFFSET_M = 1.5; // marker sits visibly above the ground
const LABEL_HEIGHT_OFFSET_M = 12; // label floats above the marker dot
const LABEL_MAX_DIST_M = 1500; // beyond this, hidden - decluttering at ground level (§10)

// One THREE.InstancedMesh draw call per category (5 total) instead of one
// mesh per POI - §10's instancing principle, same as trails.js. One
// CSS2DObject label per POI (nothing to instance - each is separate DOM).
export async function loadPOI(dataUrl = `${import.meta.env.BASE_URL}data`) {
  const data = await fetch(`${dataUrl}/poi.json`).then((r) => r.json());

  const byCategory = new Map();
  for (const poi of data.pois) {
    let bucket = byCategory.get(poi.category);
    if (!bucket) byCategory.set(poi.category, (bucket = []));
    bucket.push(poi);
  }

  const group = new THREE.Group();
  group.name = 'poi';
  const pickables = []; // { mesh, pois } - instanceId indexes into pois
  const labels = []; // { object, positionM: Vector3 } - for distance culling

  const dummy = new THREE.Object3D();
  for (const [category, pois] of byCategory) {
    const style = CATEGORY_STYLE[category] ?? { color: 0xffffff };
    const geometry = new THREE.SphereGeometry(MARKER_RADIUS_M, 10, 6);
    const material = attachAtmo(new THREE.MeshBasicMaterial({ color: style.color }));
    const mesh = new THREE.InstancedMesh(geometry, material, pois.length);
    mesh.name = `poi-${category}`;

    pois.forEach((poi, i) => {
      const pos = new THREE.Vector3(poi.local.x, poi.elevationM + HEIGHT_OFFSET_M, poi.local.z);
      dummy.position.copy(pos);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const el = document.createElement('div');
      el.className = 'poi-label';
      el.style.setProperty('--poi-color', `#${style.color.toString(16).padStart(6, '0')}`);
      el.textContent = poi.name;
      const object = new CSS2DObject(el);
      object.center.set(0.5, 1); // anchor at the label's bottom-center, floating above the point
      object.position.set(poi.local.x, poi.elevationM + LABEL_HEIGHT_OFFSET_M, poi.local.z);
      group.add(object);
      labels.push({ object, position: object.position });
    });
    mesh.instanceMatrix.needsUpdate = true;

    group.add(mesh);
    pickables.push({ mesh, pois });
  }

  // Hide labels beyond LABEL_MAX_DIST_M from the camera - real decluttering
  // now that walking puts the camera at ground level (a handful of nearby
  // labels read fine; all ~370 shown at once from up close would be the
  // same "disturbing" clutter the spheres were, just made of text).
  function updateLabelVisibility(camera) {
    for (const { object, position } of labels) {
      object.visible = position.distanceTo(camera.position) <= LABEL_MAX_DIST_M;
    }
  }

  // Returns the POI under the ray, or null - picks the closest hit across
  // all category meshes, not just the first mesh that happens to hit.
  function pick(raycaster) {
    let closest = null;
    for (const { mesh, pois } of pickables) {
      const hits = raycaster.intersectObject(mesh);
      if (hits.length && (!closest || hits[0].distance < closest.distance)) {
        closest = { distance: hits[0].distance, poi: pois[hits[0].instanceId] };
      }
    }
    return closest?.poi ?? null;
  }

  return { group, manifest: data, pick, updateLabelVisibility };
}

export function poiInfoHTML(poi) {
  const label = CATEGORY_LABELS[poi.category] ?? poi.category;
  let html = `<div class="name">${poi.name}</div><div>${label} · ${Math.round(poi.elevationM)} m</div>`;
  if (poi.dataIncomplete) {
    html += `<div class="warning">⚠ dati di elevazione incompleti in quest'area (versante piemontese)</div>`;
  }
  return html;
}
