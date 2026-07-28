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
