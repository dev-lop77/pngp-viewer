import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { attachAtmo } from './atmosphere.js';
import { MODEL_DETAIL } from './modeldetail.js';
import { wgs84ToLocal } from './geo.js';

// What people have carried up these mountains and left on top: a summit cross, and the
// Madonna on the Gran Paradiso. Named, hand-placed objects - not a category applied to
// all 252 peaks.
//
// THE USER'S SCOPE, 2026-08-19: ***"per il momento ne mettiamo solo una, sulla cima
// della Granta Parei. Poi se si riesce la madonnina sulla cima del Gran Paradiso"***,
// and ***"Aggiungile solo se Models e' High"***. So the list below is a list, not a
// rule, and everything in it is drawn only at Models = High. That second condition is
// the reason this is not part of src/poi.js: a marker is information and is always
// there, while these are ornament, and the user has put them behind the same switch as
// the high-detail flora and fauna.
//
// WHY THEY STAND ON THE DRAWN SURFACE AND NOT AT THEIR REAL ALTITUDE. A peak's
// elevationM is its true height and the drawn mesh sits below it on a sharp summit - by
// 7 m on the Granta Parey and 25 m at the Madonna. A cross planted at the true number
// hangs in the air (docs/ARCHITECTURE.md §13.9 and §12). So each one is seated with
// sampleRenderedHeight, like the markers and the huts, and re-seated whenever the height
// tier moves that surface.

// Solved with tools/dev/solve-albedo.mjs from the appearance wanted on screen, like
// every other colour in this project (§13.2):
//   iron    #3b3a38 -> 0x636260      bronze  #b9a888 -> 0xedd2a6
//   wood    #6b5a44 -> 0x928069      stone   pale, so pure white
const C = {
  iron: 0x636260,
  wood: 0x928069,
  bronze: 0xedd2a6,
  stone: 0xffffff, // a dressed pedestal, which really is pale
  rock: 0xaaa296, // the mountain's own stone (#857e73 on screen), for the bridging base
};

function part(geom, color) {
  geom.deleteAttribute('uv');
  const geometry = geom.index ? geom.toNonIndexed() : geom;
  const n = geometry.attributes.position.count;
  const colors = new Float32Array(n * 3);
  const c = new THREE.Color(color); // ONE sRGB->linear conversion (§13.3)
  for (let i = 0; i < n; i += 1) {
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function box(w, h, d, x, y, z) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
}

// A summit cross: 3.2 m of iron on a cairn, the arm at two thirds height, with the four
// stay bars that every one of these actually has - they are what stops it reading as a
// plus sign drawn on the sky.
export function summitCross() {
  const H = 3.2;
  const post = 0.14;
  const parts = [
    // The stones piled round its foot - a cross on a summit stands in a collar of them,
    // because there is no soil up there. Low and level: the BRIDGING base underneath it
    // (createSummitMonuments) is what deals with a slope.
    part(box(1.45, 0.34, 1.45, 0, 0.17, 0), C.stone),
    part(box(post, H, post, 0, H / 2 + 0.35, 0), C.iron),
    part(box(1.55, post, post * 0.9, 0, H * 0.72 + 0.35, 0), C.iron),
  ];
  // Diagonal stays between arm and post, one in each quarter.
  for (const sx of [-1, 1]) {
    const stay = new THREE.BoxGeometry(0.5, 0.07, 0.07);
    stay.rotateZ(sx * Math.PI / 4);
    stay.translate(sx * 0.28, H * 0.72 + 0.35 - 0.2, 0);
    parts.push(part(stay, C.iron));
  }
  return parts;
}

// The Madonna: a robed figure on a pedestal, 2.6 m to the crown. Not a portrait - a
// SILHOUETTE, and the silhouette that reads is robe plus MANTLE OVER THE HEAD. The first
// version modelled arms instead, as two tapered limbs held out and down; at six metres
// they read as sticks laid across the robe and the whole thing read as a chess piece.
// Arms are below the size this scene resolves, and the veil is what the eye actually uses
// to tell a Madonna from a bell.
export function madonna() {
  const parts = [
    // The pedestal, in two stages. Most of what makes a statue read as a statue: a
    // figure standing straight on the rock reads as a person, and a person on a summit
    // is a walker.
    part(box(1.15, 0.62, 1.15, 0, 0.31, 0), C.stone),
    part(box(0.8, 0.26, 0.8, 0, 0.75, 0), C.stone),
    // The robe, hem to shoulders: eight sides, wider at the hem.
    part(new THREE.CylinderGeometry(0.21, 0.40, 1.18, 8).translate(0, 1.47, 0), C.bronze),
    // The mantle over head and shoulders, and the head emerging from it. The mantle is
    // WIDER than the robe's top, which is the line that says "veiled" rather than
    // "tapered".
    part(new THREE.CylinderGeometry(0.155, 0.30, 0.46, 8).translate(0, 2.19, 0), C.bronze),
    part(new THREE.SphereGeometry(0.135, 8, 6).translate(0, 2.47, 0), C.bronze),
    // Hands joined in front at waist height - one small sphere, and it is the only
    // gesture worth a primitive at this size.
    part(new THREE.SphereGeometry(0.1, 6, 5).translate(0, 1.62, 0.26), C.bronze),
  ];
  return parts;
}

export const SUMMIT_BUILDERS = { cross: summitCross, madonna };

// What each one stands on, and how far its own base reaches. A monument is placed on a
// SLOPE more often than on a flat top - the user's second cross is explicitly "non
// proprio in vetta" - and a level block on a slope has one corner in the air and the
// opposite one buried. So each gets a base scaled to bridge its own corner drop, exactly
// as src/huts.js does for a building's terrace.
const FOOTPRINT = {
  cross: { w: 1.7, d: 1.7 },
  madonna: { w: 1.3, d: 1.3 },
};

// The list. Two ways to say where, and the order of preference matters:
//
//   poiId  - the POI it stands ON. Preferred, because an id survives a rebuild of the
//            bbox while a pair of local metres does not, and this project has rebuilt
//            that bbox once already.
//   lat/lon - WGS84, for a place that is not a POI at all. Converted through src/geo.js,
//            which is the one place that conversion lives (§6) - never by hand.
//
// Everything here is named by the user, one at a time, and drawn only at Models = High.
export const MONUMENTS = [
  { poiId: 'n1562997760', poiName: 'Granta Parey', kind: 'cross' },
  { poiId: 'n1707240539', poiName: 'Madonna', kind: 'madonna' },
  // The user's second cross, 2026-08-19, and deliberately NOT on a summit: they gave it
  // as a point on the map ("una seconda croce non proprio in vetta") and then as
  // 45.5246603N, 7.1890672E when the share link they sent could not be resolved - a
  // mapy.com short code is expanded by the browser, so a fetch of it returns 404.
  { lat: 45.5246603, lon: 7.1890672, poiName: 'Croce (45.5247N, 7.1891E)', kind: 'cross' },
];

// crestSearchM: put it on the HIGHEST DRAWN GROUND within this radius instead of exactly
// on its own coordinate. Set for the Madonna on 2026-08-19, when the user found her below
// the skyline - "Sposta la Madonna del Gran Paradiso 6 metri piu in alto, almeno che stia
// in cresta" - and asked for six metres.
//
// Six metres of LIFT would not have done it, and this is why the mechanism is a search
// rather than an offset. Measured on the drawn surface around her: she stood at 4033.7 m
// and the crest within 16 m is 4045.1 m, which is 11.4 m above her and 14 m to the SOUTH.
// A fixed +6 m would have left her hanging six metres over the flank with a six-metre
// plinth underneath, which is the same defect as the pale 2.8 m plinth the seating rule
// already had to fix once. Moving her onto the crest is what "che stia in cresta" asks
// for, and it also follows the rule the whole project runs on: a summit's DRAWN mesh is
// not where its data says it is (this one is 24 m below her real 4,058 m), so anything
// that has to look right on a summit follows the drawn surface, not the number.
//
// Searched again on every re-seat, because the tier that changes the drawn surface also
// moves the crest.
// 7 m, and the radius is the whole decision. At 20 m the search found the true top of the
// dome, 19.7 m away and 11.2 m up, and put her BEHIND the crest - invisible from the
// viewpoint the user was standing at when they asked. At 7 m she rises about 8 m and moves
// about 6, which is both what they asked for ("6 metri piu in alto") and what they meant
// ("almeno che stia in cresta"): on the crest line, in the same place to the eye.
const CREST_SEARCH_M = { Madonna: 7 };

// pois: every POI from public/data/poi.json.
// sampleHeight: terrain.sampleRenderedHeight - the DRAWN surface, never elevationM.
export function createSummitMonuments({ pois, sampleHeight }) {
  const group = new THREE.Group();
  group.name = 'summit-monuments';

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.8,
    metalness: 0,
    flatShading: true, // same as the huts and the animals: real edges, no smoothed corners
  });
  attachAtmo(material);

  const byId = new Map(pois.map((p) => [p.id, p]));
  const placed = [];
  const missing = [];
  for (const m of MONUMENTS) {
    // A POI entry carries its own local metres; a lat/lon entry is converted here and
    // given the same shape, so nothing downstream has to know which kind it was.
    let poi = null;
    if (m.poiId) {
      poi = byId.get(m.poiId);
      if (!poi) {
        // Named rather than silently skipped: a monument that vanished because its POI id
        // changed is exactly the kind of thing that would never be noticed otherwise.
        missing.push(`${m.poiName} (${m.poiId})`);
        continue;
      }
    } else {
      const { x, z } = wgs84ToLocal(m.lat, m.lon);
      poi = { id: `${m.lat},${m.lon}`, name: m.poiName, local: { x, z }, elevationM: null };
    }
    const merged = BufferGeometryUtils.mergeGeometries(SUMMIT_BUILDERS[m.kind]());
    const mesh = new THREE.Mesh(merged, material);
    mesh.name = `monument-${m.kind}-${m.poiId}`;
    // A Mesh each, not an InstancedMesh: there are two of them, they are different
    // models, and each has its own place. Instancing would be a structure with nothing
    // to hold.
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    group.add(mesh);
    // Its own base, a unit box hanging below the origin so a Y scale makes it deeper
    // without moving its top - the same trick as the huts' foundation.
    const base = new THREE.Mesh(
      part(new THREE.BoxGeometry(1, 1, 1).translate(0, -0.5, 0), C.rock),
      material,
    );
    base.name = `monument-base-${m.poiId ?? m.poiName}`;
    group.add(base);
    placed.push({ ...m, poi, mesh, base });
  }
  if (missing.length) console.warn(`Summit monuments with no POI: ${missing.join(', ')}`);

  // The four corners of the base, so the monument is lifted to the HIGHEST of them and
  // its base reaches below the lowest. Same reasoning, same shape, as huts.js's seat().
  function corners(heightAt, x, z, w, d, yaw) {
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    let lo = Infinity;
    let hi = -Infinity;
    for (const [ox, oz] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) {
      const h = heightAt(x + ox * cos + oz * sin, z - ox * sin + oz * cos);
      if (!Number.isFinite(h)) continue;
      lo = Math.min(lo, h);
      hi = Math.max(hi, h);
    }
    if (!Number.isFinite(hi)) return null;
    // A THIRD of the way up the corner spread, not the highest corner. This is the
    // opposite of the rule huts.js uses, and deliberately: a building cannot be buried,
    // because a sunken door or a window at ankle height is visible and wrong, while a
    // cairn CAN be - half-buried is what a real one looks like, and the terrain hides
    // whatever is under it for free. Seating a small monument on its highest corner
    // instead put a 2.8 m pale plinth under a 3 m cross on the user's own slope, taller
    // than it was wide, and that read far worse than anything it was fixing.
    const y = lo + (hi - lo) * 0.35;
    return { y, drop: (y - lo) + 0.8 };
  }

  // The highest drawn ground within `radius`, on a 2 m grid. 2 m because the crest of a
  // summit is a line and a coarser step walks over it; 21x21 samples is nothing next to
  // the terrain it is asking.
  function crest(heightAt, x0, z0, radius) {
    let best = { x: x0, z: z0, h: heightAt(x0, z0) ?? -Infinity };
    for (let dz = -radius; dz <= radius; dz += 2) {
      for (let dx = -radius; dx <= radius; dx += 2) {
        if (dx * dx + dz * dz > radius * radius) continue; // a circle, not a square
        const h = heightAt(x0 + dx, z0 + dz);
        if (Number.isFinite(h) && h > best.h) best = { x: x0 + dx, z: z0 + dz, h };
      }
    }
    return best;
  }

  function seat(heightAt) {
    for (const p of placed) {
      let { x, z } = p.poi.local;
      const radius = CREST_SEARCH_M[p.poiName];
      if (radius) {
        const top = crest(heightAt, x, z, radius);
        p.movedM = Math.hypot(top.x - x, top.z - z);
        p.raisedM = top.h - (heightAt(x, z) ?? top.h);
        x = top.x;
        z = top.z;
      }
      const y = heightAt(x, z);
      // No fallback to elevationM for a lat/lon entry, which has none: if the sampler
      // cannot answer, the monument keeps the height it already had rather than jumping
      // to NaN and disappearing from the scene entirely.
      if (Number.isFinite(y)) p.mesh.position.set(x, y, z);
      else if (Number.isFinite(p.poi.elevationM)) p.mesh.position.set(x, p.poi.elevationM, z);
      else p.mesh.position.set(x, p.mesh.position.y, z);
      // A cross faces the valley: its arm across the slope, so you see the whole cross
      // rather than an edge-on post. Sampled at 30 m, which is the scale of a summit
      // rather than of the mesh's own noise.
      const R = 30;
      const hx = (heightAt(x + R, z) ?? 0) - (heightAt(x - R, z) ?? 0);
      const hz = (heightAt(x, z + R) ?? 0) - (heightAt(x, z - R) ?? 0);
      p.mesh.rotation.y = Math.abs(hx) < 1e-3 && Math.abs(hz) < 1e-3
        ? 0
        : Math.atan2(-hx, -hz);
      // The corner pass runs AFTER the yaw, because the corners it samples are the
      // rotated ones - a base turned 40 degrees stands on different ground.
      const foot = FOOTPRINT[p.kind];
      const seated = corners(heightAt, x, z, foot.w, foot.d, p.mesh.rotation.y);
      if (seated) {
        p.mesh.position.y = seated.y;
        p.base.position.set(x, seated.y, z);
        p.base.rotation.y = p.mesh.rotation.y;
        p.base.scale.set(foot.w, seated.drop, foot.d);
        p.drop = seated.drop;
      }
      p.y = p.mesh.position.y;
    }
  }
  seat(sampleHeight);

  // Models = High and nothing else, per the user. Visibility on the GROUP, so the two
  // meshes cannot disagree, and applied now in case the control was already High from a
  // restored choice.
  function applyDetail() {
    group.visible = MODEL_DETAIL.value === 1;
  }
  applyDetail();

  return {
    group,
    applyDetail,
    // Registered with main.js's reseatOnDrawnSurface(): the height tier lands after the
    // first frame and moves the drawn surface by up to 44 m, and a cross left behind by
    // that is either buried in the summit or standing above it in the air.
    alignToGround: seat,
    monuments: placed,
    missing,
    triangles: Object.fromEntries(
      placed.map((p) => [p.poiName, p.mesh.geometry.attributes.position.count / 3]),
    ),
  };
}
