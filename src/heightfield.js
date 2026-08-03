// Pure heightfield sampling - no THREE, no fetch, no DOM. Shared by the
// browser runtime (src/terrain.js) and build-time Node scripts
// (tools/build-trails.mjs) so there's exactly one implementation of "how
// do we turn a raw Uint16 sample into real elevation at a given
// scene-local (x,z)" (docs/ARCHITECTURE.md §4/§10 - GPU displacement and
// every CPU-side consumer must agree, and now the build pipeline too).

export function valueToElevation(v, elevMin, elevMax) {
  return elevMin + (v / 65535) * (elevMax - elevMin);
}

// Bilinear sample, in scene-local (x,z) meters - matches the GPU
// texture's pixel-is-area convention (manifest.pixelConvention) exactly.
export function sampleHeightfield(heights, manifest, x, z) {
  const { width, height } = manifest.dimensions;
  const { min: elevMin, max: elevMax } = manifest.elevationRangeM;
  const { x: resX, y: resY } = manifest.resolutionMPerPx;
  const { xmin, ymin, xmax, ymax } = manifest.bboxCrsUnits;
  const worldWidth = xmax - xmin;
  const worldDepth = ymax - ymin;

  const colF = (x + worldWidth / 2) / resX - 0.5;
  const rowF = (z + worldDepth / 2) / resY - 0.5;

  const col0 = Math.min(Math.max(Math.floor(colF), 0), width - 1);
  const col1 = Math.min(col0 + 1, width - 1);
  const row0 = Math.min(Math.max(Math.floor(rowF), 0), height - 1);
  const row1 = Math.min(row0 + 1, height - 1);
  const fx = Math.min(Math.max(colF - col0, 0), 1);
  const fz = Math.min(Math.max(rowF - row0, 0), 1);

  const v00 = heights[row0 * width + col0];
  const v10 = heights[row0 * width + col1];
  const v01 = heights[row1 * width + col0];
  const v11 = heights[row1 * width + col1];
  const top = v00 + (v10 - v00) * fx;
  const bottom = v01 + (v11 - v01) * fx;
  return valueToElevation(top + (bottom - top) * fz, elevMin, elevMax);
}

// Height of the surface the terrain mesh actually DRAWS, which is not
// sampleHeightfield(): the heightfield is ~20.5 m/px but the mesh is only
// segmentsX x segmentsZ quads (~328 m/quad at the phase-1 default of 256), so
// the drawn surface is a coarse triangulation that cuts below ridges and
// bridges above hollows - by tens of metres on steep ground, far more than a
// 1.7 m eye height. Using the bilinear value to place the camera therefore
// put it *under* the drawn surface in concave spots (see-through terrain when
// looking around) and left POI marker lines hanging in mid-air on convex
// ones - both reported from a real-browser test, docs/PROGRESS.md 2026-08-03.
//
// This reproduces the drawn geometry exactly rather than approximating it:
// the mesh's corner heights come from this same heightfield, and the vertex
// shader displaces purely vertically (objectNormal is +Y for the rotated
// plane), so the drawn height at any (x,z) is the plain linear interpolation
// of the enclosing triangle's three corners.
//
// Vertex layout and triangulation both follow three's own PlaneGeometry
// (verified against its source, and against a Raycaster on the real
// displaced geometry - see tools/test-rendered-height.mjs - not assumed):
// after rotateX(-PI/2), grid vertex (ix,iz) sits at world
// x = ix*cellW - worldWidth/2, z = iz*cellD - worldDepth/2, and each quad is
// split (a,b,d)/(b,c,d) with a=(0,0) b=(0,1) c=(1,1) d=(1,0) in cell-local
// (u,v) - so u+v <= 1 selects the first triangle.
//
// Independent of mesh resolution, so it stays correct if the tile/LOD work
// (docs/ARCHITECTURE.md §12) later refines the mesh.
export function sampleRenderedHeightfield(heights, manifest, segmentsX, segmentsZ, x, z) {
  const { xmin, ymin, xmax, ymax } = manifest.bboxCrsUnits;
  const worldWidth = xmax - xmin;
  const worldDepth = ymax - ymin;
  const cellW = worldWidth / segmentsX;
  const cellD = worldDepth / segmentsZ;

  const gx = (x + worldWidth / 2) / cellW;
  const gz = (z + worldDepth / 2) / cellD;
  const ix = Math.min(Math.max(Math.floor(gx), 0), segmentsX - 1);
  const iz = Math.min(Math.max(Math.floor(gz), 0), segmentsZ - 1);
  const u = Math.min(Math.max(gx - ix, 0), 1);
  const v = Math.min(Math.max(gz - iz, 0), 1);

  const x0 = ix * cellW - worldWidth / 2;
  const x1 = x0 + cellW;
  const z0 = iz * cellD - worldDepth / 2;
  const z1 = z0 + cellD;

  const at = (px, pz) => sampleHeightfield(heights, manifest, px, pz);

  if (u + v <= 1) {
    const ha = at(x0, z0);
    return ha + u * (at(x1, z0) - ha) + v * (at(x0, z1) - ha);
  }
  const hc = at(x1, z1);
  return hc + (1 - u) * (at(x0, z1) - hc) + (1 - v) * (at(x1, z0) - hc);
}

// Raw pixel value 0 is a nodata sentinel that was never explicitly
// declared anywhere in the pipeline, not a real elevation (found
// 2026-07-28: 24.8% of DEM/pngp_heightmap.png is exactly 0, in a
// contiguous region matching Valle d'Aosta's real administrative
// boundary - the source DTM doesn't cover the Piemonte side of the park,
// see docs/PROGRESS.md). Anything sampling near one of these pixels
// should be flagged as unreliable rather than silently treated as a real,
// very-low elevation.
export function isNearNoData(heights, manifest, x, z) {
  const { width, height } = manifest.dimensions;
  const { x: resX, y: resY } = manifest.resolutionMPerPx;
  const { xmin, ymin, xmax, ymax } = manifest.bboxCrsUnits;
  const worldWidth = xmax - xmin;
  const worldDepth = ymax - ymin;

  const colF = (x + worldWidth / 2) / resX - 0.5;
  const rowF = (z + worldDepth / 2) / resY - 0.5;
  const col0 = Math.min(Math.max(Math.floor(colF), 0), width - 1);
  const col1 = Math.min(col0 + 1, width - 1);
  const row0 = Math.min(Math.max(Math.floor(rowF), 0), height - 1);
  const row1 = Math.min(row0 + 1, height - 1);

  return (
    heights[row0 * width + col0] === 0 ||
    heights[row0 * width + col1] === 0 ||
    heights[row1 * width + col0] === 0 ||
    heights[row1 * width + col1] === 0
  );
}
