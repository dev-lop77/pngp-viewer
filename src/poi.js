import * as THREE from 'three';
import { attachAtmo } from './atmosphere.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { isHiddenByTerrain } from './labels.js';

const CATEGORY_STYLE = {
  peak: { color: 0xffffff },
  hut: { color: 0xc17a3f },
  pass: { color: 0xab47bc },
  waterfall: { color: 0x29b6f6 },
  lake: { color: 0x1e88e5 },
  trailhead: { color: 0x66bb6a }, // valley bases - green, the only category down among the trees
  // The villages and hamlets, added 2026-08-18 at the user's request ("i nomi dei
  // paesi all'interno delle valli siano di aiuto"). Pale sand: they share the
  // valley floor with the green trailheads and had to be told apart from them at
  // a glance, since a trailhead is a place a walk starts and a hamlet is just
  // where you are.
  village: { color: 0xe0d3b8 },
};

// English, like the rest of the UI - these had been Italian since phase 2 and
// were shipped that way, which nobody noticed because the only place they appear
// is beside a place name that IS Italian. The names themselves stay exactly as
// OSM has them: "Gran Paradiso" is not a thing to translate, the category beside
// it is.
const CATEGORY_LABELS = {
  peak: 'Peak',
  hut: 'Mountain hut',
  pass: 'Pass',
  waterfall: 'Waterfall',
  lake: 'Lake',
  trailhead: 'Trailhead',
  village: 'Village',
};

// The hut category covers both staffed rifugi and unstaffed bivacchi, and
// calling the latter a mountain hut in the search list would be wrong - 18 of
// the 38 are bivacchi (tools/build-poi.mjs keeps OSM's tag as hutKind).
function categoryLabel(poi) {
  if (poi.category === 'hut' && poi.hutKind === 'shelter:basic_hut') return 'Bivouac hut';
  // 153 of the places are villages by category and hamlets in fact - 160 of the
  // 166 place nodes inside the region are `place=hamlet`, so calling them all
  // villages would be wrong for nearly all of them.
  if (poi.category === 'village' && poi.placeKind === 'hamlet') return 'Hamlet';
  return CATEGORY_LABELS[poi.category] ?? poi.category;
}

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
// The label's float above the ground scales with camera distance instead of
// being fixed at 12 m: far away it needs the height to clear the terrain, up
// close a name hovering 12 m overhead reads as detached from the place it
// names (user request, 2026-08-03). Reaches the maximum at 600 m.
const LABEL_MAX_OFFSET_M = 12;
const LABEL_MIN_OFFSET_M = 1.5; // roughly eye height - the name lands where you'd read a signpost
const LABEL_OFFSET_PER_M = 0.02;
const LABEL_MAX_DIST_M = 1500; // beyond this, hidden - decluttering at ground level (§10)

// Labels are DOM (CSS2DObject) and therefore not depth-tested: whether the
// terrain hides one is decided by src/labels.js, shared with the trail labels.
// Sink each marker line's base slightly below the ground so it reads as
// planted in the surface - a line ending exactly at the drawn height can
// still show a hairline gap depending on the viewing angle.
const BASE_SINK_M = 2;

// One merged LineSegments draw call per category (5 total) instead of one
// line per POI - §10's instancing principle, same as trails.js/the old
// per-category InstancedMesh. One CSS2DObject label per POI (nothing to
// instance - each is separate DOM), with its own click handler: clicking a
// label (or using index.html's search box) is now the only way to select a
// POI, after the screen-centre reticle+raycast path was removed - it aimed
// at the marker line's foot rather than the name you were reading, which
// the user found unintuitive and redundant once releasing pointer lock
// stopped freezing movement (docs/PROGRESS.md 2026-08-03).
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
  const geometries = []; // per category, flagged dirty together after a marker update
  // One flat list so a single pass per tick can do visibility, label height and
  // the line's own top vertex - they all depend on the same camera distance.
  const markers = []; // { poi, object, attr, index, groundY }

  for (const [category, pois] of byCategory) {
    const style = CATEGORY_STYLE[category] ?? { color: 0xffffff };

    const positions = new Float32Array(pois.length * 6); // 2 points * 3 comps
    pois.forEach((poi, i) => writeMarker(positions, i, poi.local.x, poi.local.z, poi.elevationM, LABEL_MAX_OFFSET_M));
    const geometry = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(positions, 3);
    geometry.setAttribute('position', attr);
    const material = attachAtmo(new THREE.LineBasicMaterial({ color: style.color, transparent: true, opacity: 0.75 }));
    const line = new THREE.LineSegments(geometry, material);
    line.name = `poi-${category}`;
    group.add(line);
    geometries.push(geometry);

    pois.forEach((poi, i) => {
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
      object.position.set(poi.local.x, poi.elevationM + LABEL_MAX_OFFSET_M, poi.local.z);
      group.add(object);
      markers.push({ poi, object, attr, index: i, groundY: poi.elevationM });
    });
  }

  // Re-seat every marker on the surface the terrain mesh actually draws.
  //
  // Markers are first built at poi.elevationM (the build-time heightfield
  // value) because POI data loads in parallel with the terrain - keeping
  // that parallelism matters for startup (§10), so the fix is a cheap
  // rewrite afterwards rather than serializing the two fetches. ~400 POIs x
  // 6 floats is nothing.
  //
  // elevationM is the POI's real altitude and stays what the info panel
  // reports; it is deliberately NOT what the geometry uses, because the
  // coarse mesh draws its surface tens of metres away from it on steep
  // ground (see terrain.js's sampleRenderedHeight).
  let groundHeightAt = null; // set by alignToGround(); until then occlusion is skipped, not guessed

  function alignToGround(heightAt) {
    groundHeightAt = heightAt;
    for (const marker of markers) {
      marker.groundY = heightAt(marker.poi.local.x, marker.poi.local.z);
    }
    updateMarkers(null); // seat geometry now; the per-tick pass then tracks camera distance
  }

  // One pass per HUD tick over every marker: how high its label floats, where
  // its line's top vertex goes, and whether the label is shown at all - all
  // three follow from the same camera distance.
  //
  // The label descends toward the ground as you approach (user request,
  // 2026-08-03): a fixed 12 m float reads fine from a distance, where it lifts
  // the name clear of the terrain, but standing next to a col it left the name
  // hovering well overhead. The line's top follows it, so the marker stays a
  // post rather than detaching from its label.
  //
  // Visibility: beyond LABEL_MAX_DIST_M labels are hidden outright - real
  // decluttering now that walking puts the camera at ground level (all ~400 at
  // once from up close would be the same "disturbing" clutter the old balloon
  // markers were) - and nearer ones are hidden when terrain stands in front of
  // them (isHiddenByTerrain). Distance is tested first, so the ray march only
  // runs for the handful of candidates rather than all ~400 (§10).
  function updateMarkers(camera) {
    for (const marker of markers) {
      const { poi, object, attr, index, groundY } = marker;
      const dist = camera
        ? Math.hypot(poi.local.x - camera.position.x, groundY - camera.position.y, poi.local.z - camera.position.z)
        : Infinity;
      const offset = Math.min(LABEL_MAX_OFFSET_M, Math.max(LABEL_MIN_OFFSET_M, dist * LABEL_OFFSET_PER_M));

      writeMarker(attr.array, index, poi.local.x, poi.local.z, groundY, offset);
      object.position.set(poi.local.x, groundY + offset, poi.local.z);
      object.visible = camera
        ? dist <= LABEL_MAX_DIST_M && !isHiddenByTerrain(groundHeightAt, camera, object.position)
        : false;
    }
    for (const geometry of geometries) {
      geometry.getAttribute('position').needsUpdate = true;
      geometry.computeBoundingSphere(); // moved vertices would otherwise cull against a stale bound
    }
  }

  // For the searchable POI list (index.html's #poi-search): "Name ·
  // Category" as a display label unique enough to disambiguate POIs that
  // share a plain name (plausible among ~400 named features).
  const searchEntries = data.pois.map((poi) => ({
    label: `${poi.name} · ${categoryLabel(poi)}`,
    poi,
  }));

  return { group, manifest: data, alignToGround, updateMarkers, searchEntries };
}

// One marker = one line segment, from just below the ground up to its label.
function writeMarker(positions, i, x, z, groundY, offset) {
  positions[i * 6] = x;
  positions[i * 6 + 1] = groundY - BASE_SINK_M;
  positions[i * 6 + 2] = z;
  positions[i * 6 + 3] = x;
  positions[i * 6 + 4] = groundY + offset;
  positions[i * 6 + 5] = z;
}

export function poiInfoHTML(poi) {
  const label = categoryLabel(poi);
  let html = `<div class="name">${poi.name}</div><div>${label} · ${Math.round(poi.elevationM)} m</div>`;
  if (poi.dataIncomplete) {
    // The attribution this carried - "versante piemontese" - was true when it was
    // written and is not any more: the Piemonte gap was closed on 2026-07-30 by
    // the three-source mosaic. Exactly one POI of 426 still trips the flag, Roc
    // de Bassagne, and it sits 460 m from the SOUTHERN EDGE of the DEM bbox
    // (45.4709N, 7.0888E) reading 1,604 m against OSM's 3,222. So the cause is
    // the edge of what was extracted, not a source's coverage - and rather than
    // swap one geographic claim for another, this now says only what is certain.
    html += '<div class="warning">⚠ incomplete elevation data in this area</div>';
  }
  return html;
}
