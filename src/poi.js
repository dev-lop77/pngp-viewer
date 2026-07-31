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
// marker (fine seen from a 26km-high overview, but enormous at walking
// scale - once walking is the default, see docs/PROGRESS.md 2026-07-31).
// First fix (shrinking to a small dot) revealed a second problem: the dot
// itself visibly floated above/sank below the real ground (elevationM,
// computed at data-build time, doesn't perfectly match what the coarse
// terrain mesh renders at that exact point - docs/ARCHITECTURE.md §12's
// tile/LOD item). A thin vertical line from the ground up to the label
// reads as a marker post/flagpole regardless of that small mismatch,
// instead of a glaringly "wrong" detached ball - the user's own fix idea.
const LABEL_HEIGHT_OFFSET_M = 12; // label floats this far above elevationM
const LABEL_MAX_DIST_M = 1500; // beyond this, hidden - decluttering at ground level (§10)
const LINE_RAYCAST_THRESHOLD_M = 5; // Raycaster.params.Line.threshold, set once by main.js

// One merged LineSegments draw call per category (5 total) instead of one
// line per POI - §10's instancing principle, same as trails.js/the old
// per-category InstancedMesh. One CSS2DObject label per POI (nothing to
// instance - each is separate DOM), with its own click handler so a POI
// can be selected either by aiming the reticle at its line (main.js, while
// walking/flying) or by clicking its label directly (only meaningful once
// pointer lock is released and the cursor is visible again).
export async function loadPOI(dataUrl = `${import.meta.env.BASE_URL}data`, { onSelect } = {}) {
  const data = await fetch(`${dataUrl}/poi.json`).then((r) => r.json());

  const byCategory = new Map();
  for (const poi of data.pois) {
    let bucket = byCategory.get(poi.category);
    if (!bucket) byCategory.set(poi.category, (bucket = []));
    bucket.push(poi);
  }

  const group = new THREE.Group();
  group.name = 'poi';
  const pickables = []; // { line, pois } - intersection.index / 2 indexes into pois
  const labels = []; // { object, position } - for distance culling

  for (const [category, pois] of byCategory) {
    const style = CATEGORY_STYLE[category] ?? { color: 0xffffff };

    const positions = new Float32Array(pois.length * 6); // 2 points * 3 comps
    pois.forEach((poi, i) => {
      positions.set([poi.local.x, poi.elevationM, poi.local.z, poi.local.x, poi.elevationM + LABEL_HEIGHT_OFFSET_M, poi.local.z], i * 6);
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = attachAtmo(new THREE.LineBasicMaterial({ color: style.color, transparent: true, opacity: 0.75 }));
    const line = new THREE.LineSegments(geometry, material);
    line.name = `poi-${category}`;
    group.add(line);
    pickables.push({ line, pois });

    for (const poi of pois) {
      const el = document.createElement('div');
      el.className = 'poi-label';
      el.style.setProperty('--poi-color', `#${style.color.toString(16).padStart(6, '0')}`);
      el.textContent = poi.name;
      el.addEventListener('click', (e) => {
        e.stopPropagation(); // don't let it bubble to the canvas' relock-pointer-lock handler
        onSelect?.(poi);
      });
      const object = new CSS2DObject(el);
      object.center.set(0.5, 1); // anchor at the label's bottom-center, floating above the line
      object.position.set(poi.local.x, poi.elevationM + LABEL_HEIGHT_OFFSET_M, poi.local.z);
      group.add(object);
      labels.push({ object, position: object.position });
    }
  }

  // Hide labels beyond LABEL_MAX_DIST_M from the camera - real decluttering
  // now that walking puts the camera at ground level (a handful of nearby
  // labels read fine; all ~370 shown at once from up close would be the
  // same "disturbing" clutter the balloon markers were).
  function updateLabelVisibility(camera) {
    for (const { object, position } of labels) {
      object.visible = position.distanceTo(camera.position) <= LABEL_MAX_DIST_M;
    }
  }

  // Returns the POI under the ray, or null - picks the closest hit across
  // all category lines, not just the first one that happens to hit.
  // Caller must set raycaster.params.Line.threshold (main.js does this
  // once, LINE_RAYCAST_THRESHOLD_M below) - a thin line needs a real
  // tolerance to be aimable at all.
  function pick(raycaster) {
    let closest = null;
    for (const { line, pois } of pickables) {
      const hits = raycaster.intersectObject(line);
      if (hits.length && (!closest || hits[0].distance < closest.distance)) {
        closest = { distance: hits[0].distance, poi: pois[Math.floor(hits[0].index / 2)] };
      }
    }
    return closest?.poi ?? null;
  }

  // For the searchable POI list (index.html's #poi-search): "Name ·
  // Category" as a display label unique enough to disambiguate POIs that
  // share a plain name (plausible among ~370 named features).
  const searchEntries = data.pois.map((poi) => ({
    label: `${poi.name} · ${CATEGORY_LABELS[poi.category] ?? poi.category}`,
    poi,
  }));

  return { group, manifest: data, pick, updateLabelVisibility, searchEntries };
}

export { LINE_RAYCAST_THRESHOLD_M };

export function poiInfoHTML(poi) {
  const label = CATEGORY_LABELS[poi.category] ?? poi.category;
  let html = `<div class="name">${poi.name}</div><div>${label} · ${Math.round(poi.elevationM)} m</div>`;
  if (poi.dataIncomplete) {
    html += `<div class="warning">⚠ dati di elevazione incompleti in quest'area (versante piemontese)</div>`;
  }
  return html;
}
