import * as THREE from 'three';

// CAI difficulty scale - see docs/ARCHITECTURE.md §3.
const DIFFICULTY_COLORS = {
  T: 0x4caf50,
  E: 0x2196f3,
  EE: 0xff9800,
  EEA: 0xf44336,
  unknown: 0x999999,
};

// Lifts trail lines slightly above the terrain surface: their elevation
// comes from a CPU-side bilinear sample (src/heightfield.js) of the same
// data the GPU displaces, but tiny floating-point differences between the
// two paths are enough to cause z-fighting/flicker against the terrain
// mesh without a small offset.
const HEIGHT_OFFSET_M = 3;

// Merges all ~1,130 trails into one THREE.LineSegments draw call per
// difficulty class (5 total) instead of one per trail - §10's "instancing
// for repeated geometry" principle applied to lines rather than markers.
export async function loadTrails(dataUrl = `${import.meta.env.BASE_URL}data`) {
  const data = await fetch(`${dataUrl}/trails.json`).then((r) => r.json());

  const positionsByDifficulty = new Map();
  for (const trail of data.trails) {
    const key = DIFFICULTY_COLORS[trail.difficulty] ? trail.difficulty : 'unknown';
    let bucket = positionsByDifficulty.get(key);
    if (!bucket) positionsByDifficulty.set(key, (bucket = []));

    for (const line of trail.lines) {
      for (let i = 1; i < line.length; i++) {
        const [x0, y0, z0] = line[i - 1];
        const [x1, y1, z1] = line[i];
        bucket.push(x0, y0 + HEIGHT_OFFSET_M, z0, x1, y1 + HEIGHT_OFFSET_M, z1);
      }
    }
  }

  const group = new THREE.Group();
  group.name = 'trails';

  for (const [difficulty, positions] of positionsByDifficulty) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({ color: DIFFICULTY_COLORS[difficulty] });
    const segments = new THREE.LineSegments(geometry, material);
    segments.name = `trails-${difficulty}`;
    group.add(segments);
  }

  return { group, manifest: data };
}
