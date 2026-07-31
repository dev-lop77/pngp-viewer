import * as THREE from 'three';
import { attachAtmo } from './atmosphere.js';

const CATEGORY_STYLE = {
  peak: { color: 0xffffff, radius: 180 },
  hut: { color: 0xc17a3f, radius: 220 },
  pass: { color: 0xab47bc, radius: 180 },
  waterfall: { color: 0x29b6f6, radius: 220 },
  lake: { color: 0x1e88e5, radius: 220 },
};

const CATEGORY_LABELS = {
  peak: 'Vetta',
  hut: 'Rifugio',
  pass: 'Passo/Colle',
  waterfall: 'Cascata',
  lake: 'Lago',
};

const HEIGHT_OFFSET_M = 20; // marker sits visibly above the ground

// One THREE.InstancedMesh draw call per category (5 total) instead of one
// mesh per POI - §10's instancing principle, same as trails.js.
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

  const dummy = new THREE.Object3D();
  for (const [category, pois] of byCategory) {
    const style = CATEGORY_STYLE[category] ?? { color: 0xffffff, radius: 180 };
    const geometry = new THREE.SphereGeometry(style.radius, 12, 8);
    const material = attachAtmo(new THREE.MeshBasicMaterial({ color: style.color }));
    const mesh = new THREE.InstancedMesh(geometry, material, pois.length);
    mesh.name = `poi-${category}`;

    pois.forEach((poi, i) => {
      dummy.position.set(poi.local.x, poi.elevationM + HEIGHT_OFFSET_M, poi.local.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;

    group.add(mesh);
    pickables.push({ mesh, pois });
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

  return { group, manifest: data, pick };
}

export function poiInfoHTML(poi) {
  const label = CATEGORY_LABELS[poi.category] ?? poi.category;
  let html = `<div class="name">${poi.name}</div><div>${label} · ${Math.round(poi.elevationM)} m</div>`;
  if (poi.dataIncomplete) {
    html += `<div class="warning">⚠ dati di elevazione incompleti in quest'area (versante piemontese)</div>`;
  }
  return html;
}
