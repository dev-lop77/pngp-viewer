# PNGP Viewer — Architecture Suggestions

This document is an advisory review of [`ARCHITECTURE.md`](ARCHITECTURE.md).
It does not replace the existing plan. Suggestions are ordered by priority and
distinguish confirmed issues from decisions that should be validated during
implementation.

## P0 — Resolve before or during the terrain pipeline

### 1. Define a browser-safe height encoding

The architecture currently proposes a 16-bit grayscale PNG as the GPU
displacement texture. The source PNG is genuinely 16-bit, but browser image
decoding and ordinary Three.js texture-loading paths must not be assumed to
preserve those 16 bits as one lossless height channel.

Before making `public/data/heightmap.png` the runtime contract:

- Prototype the complete browser upload and shader-sampling path and verify
  decoded values against known source pixels.
- Prefer an explicit, documented representation such as tiled `Uint16` binary
  data uploaded to integer textures, with interpolation performed deliberately
  in the shader. A packed two-channel 8-bit representation is another possible
  fallback, but it also needs manual interpolation to avoid errors at byte
  boundaries.
- Derive CPU height queries and GPU displacement from the same calibrated
  values and interpolation rules. Independent conversions could otherwise put
  POIs, trails, water, and camera clamping at slightly different elevations.

The chosen encoding should state its byte order, scale, offset, no-data value,
texture filtering, and interpolation behavior.

### 2. Correct the raster grid metadata contract

There is a small but important inconsistency in the current metadata:

- Bbox size: 83,884 × 48,225 m.
- Declared resolution: 10 × 10 m/px.
- Image size: 8,388 × 4,823 px.
- Image size multiplied by resolution: 83,880 × 48,230 m.

Those values cannot all describe the exact same raster extent. This is likely
rounding or extent adjustment during `gdalwarp`, but treating all three as
exact will produce alignment errors at the edges and makes pixel-to-world
mapping ambiguous.

The regular build pipeline should therefore:

- Read or derive the processed raster's authoritative affine geotransform
  rather than reconstructing it from requested command-line values.
- Define whether the bbox describes outer pixel edges or sample centers.
- Define whether the first stored row is north or south and account for the
  texture-coordinate Y direction explicitly.
- Store the actual output bounds, dimensions, per-axis pixel size, CRS, and
  no-data policy in generated metadata.
- Validate that world-to-pixel and pixel-to-world round trips agree at the
  four corners and several known interior points.

This should be resolved before trails, POIs, or water are draped over the
terrain.

### 3. Treat terrain tiling and LOD as foundational

The source texture is 8,388 pixels wide. A single texture therefore requires a
device whose maximum supported texture dimension is at least 8,388 pixels;
that should not be assumed for every target device. A single 512×512 or
1024×1024 terrain grid also cannot provide consistent near-ground detail
across an approximately 84 × 48 km area.

The terrain pipeline should produce a spatial tile hierarchy from the start,
or phase 1 should at least use a design that can consume one without replacing
the terrain renderer. A quadtree or clipmap approach should provide:

- Screen-space-error or distance-based LOD selection.
- Frustum culling and a bounded in-memory tile cache.
- Crack prevention between adjacent LOD levels, using skirts or edge
  stitching.
- Coarse tiles available first so the whole terrain appears quickly.
- Abortable loading when the camera moves away before a tile finishes.
- Runtime checks for texture-size and related GPU limits.

This also resolves the roadmap tension between section 10, where LOD is a
standing principle, and phase 7, where tiling is still described as optional
polish. Phase 7 can remain the place for tuning; the compatible data and
renderer structure should land in phases 0–1.

## P1 — Establish before multiple map layers are added

### 4. Use a versioned asset manifest

Generated files should be described by one versioned manifest rather than by
implicit agreement between individual scripts and runtime modules. For
terrain, the manifest should include:

- Schema and pipeline version.
- CRS and exact affine geotransform.
- Dimensions, row orientation, and tile hierarchy.
- Elevation encoding, byte order, scale, offset, and no-data value.
- URLs, byte sizes, and content hashes for generated assets.
- Source provenance, processing date, and attribution requirements.

Trails, POIs, hydrology, and later layers should use compatible schema-version
and provenance conventions. Build-time validation should fail on missing
files, unsupported schema versions, inconsistent bounds, invalid coordinates,
or hashes that do not match.

Content-hashed filenames would also allow static hosts to cache immutable data
aggressively without serving stale data after a new build.

### 5. Lock coordinate and axis conventions

Section 6 deliberately leaves the local origin open. Resolve that before
implementing terrain or converting other datasets:

- Put the local origin near the dataset center to keep rendered coordinates
  small.
- Define axes explicitly, for example `+X = east`, `+Y = elevation`, and
  `+Z = north` or south.
- Keep all authoritative geographic conversions in one module rather than
  reproducing formulas in terrain, trails, POIs, and UI code.
- Define the EPSG:23032 to WGS84 transformation explicitly and test it against
  several known control points. Do not rely on a library silently knowing the
  desired datum operation.
- Document vertical units and whether any visual elevation exaggeration is
  applied. Logical elevation queries should always return real meters.

The camera's near/far-plane policy should be decided alongside this coordinate
frame. An 84 km scene can lose depth precision when the near plane is too
small. Camera-relative rendering or origin rebasing can be added if measured
precision artifacts justify it.

### 6. Verify whole-park trail coverage

The selected trail source is published by Regione Autonoma Valle d'Aosta.
Clipping that source to the DEM bbox proves intersection with the viewing area,
but not complete trail coverage for the whole national park.

Before calling it the park-wide trail dataset:

- Compare its geometry with the authoritative park boundary.
- Quantify uncovered areas, particularly any portion outside the source
  region's jurisdiction.
- If another source is required, preserve source and license provenance per
  feature and define deduplication rules where sources overlap.
- If phase 2 intentionally ships partial coverage, label that limitation in
  the UI rather than silently showing an incomplete network.

This is a validation item, not a conclusion that the current dataset is
incomplete.

### 7. Separate runtime responsibilities

The proposed module-per-concern layout is a good starting point, but shared
responsibilities should have explicit boundaries before features multiply:

- An asset/data layer owns fetching, decoding, caching, cancellation, schema
  validation, and failure states.
- A geospatial layer owns coordinate conversion and terrain-height queries.
- Render systems own Three.js objects and expose initialization, update,
  visibility, and disposal lifecycles.
- Application state owns selected POI, active layers, time, and weather.
- DOM UI observes application state rather than reaching directly into scene
  internals.

The main render loop should have a documented update order so camera movement,
tile selection, terrain queries, environment changes, and UI readouts remain
predictable.

Large decoding and geometry preparation tasks should run in Web Workers where
profiling shows that they interrupt navigation.

### 8. Design failure and fallback behavior

A static application still needs explicit runtime failure handling:

- Show a useful loading state while the coarse terrain is unavailable.
- Distinguish required assets from optional layers.
- Retry or report failed tile requests without stopping the render loop.
- Reject incompatible manifest versions with a clear diagnostic.
- Fall back to a lower-detail terrain path when device limits require it.
- Keep the credits/attribution view available whenever licensed data is
  displayed.

Attribution data should travel with each generated dataset or its manifest so
adding a layer cannot accidentally omit its required credit.

## P2 — Make quality and reproducibility measurable

### 9. Set explicit performance budgets

"Smoothness" should become a measurable acceptance criterion. Once the phase-1
prototype exists, record a representative desktop baseline and targets for:

- Time to first coarse terrain and time to an interactive view.
- Frame time during overview, rapid fly-through, and near-ground navigation.
- Peak CPU and GPU memory.
- Draw calls and visible terrain tiles.
- Maximum concurrent requests and tile-cache size.
- Initial and total transferred asset sizes.

Use frame time rather than only average FPS so short loading or decoding
stutters are visible. Mobile targets can be added during the planned mobile
pass without weakening the desktop-first scope.

### 10. Add pipeline and spatial correctness tests

The highest-value automated checks are:

- Pixel ↔ local coordinates ↔ EPSG:23032 round trips, including raster edges.
- EPSG:23032 ↔ WGS84 conversion against known control points.
- CPU and shader-equivalent height decoding and bilinear interpolation.
- Generated-manifest schema, hashes, dimensions, bounds, and tile continuity.
- POI and trail coordinates falling inside expected data coverage.
- A browser smoke test that loads the initial terrain without WebGL errors.
- A repeatable fly-through that records frame-time and memory regressions.

Visual screenshot tests are useful, but they should complement numeric terrain
and coordinate checks rather than serve as the only validation.

### 11. Improve build reproducibility and provenance

The manual external-source workflow is reasonable for large data, but each
checked-in derived artifact should retain enough information to reproduce or
audit it:

- Exact source URL or source-file identity.
- Retrieval date and upstream dataset version where available.
- Source checksum.
- Processing command/tool versions and relevant parameters.
- Output checksum.
- License and required attribution text.

The regular build scripts should be deterministic for identical inputs.
Temporary absolute source paths such as the current `source_file` value should
not become part of public runtime metadata; use a stable source identifier
instead.

## Recommended decision order

1. Resolve the raster affine transform and browser height encoding.
2. Choose the phase-1-compatible terrain tile/LOD contract.
3. Lock local axes, origin, and coordinate conversions.
4. Define and validate the versioned terrain manifest.
5. Scaffold the viewer and measure the first performance baseline.
6. Validate trail coverage before finalizing the phase-2 trail contract.

These decisions preserve the current vanilla Three.js, Vite, static-hosting,
and build-time-data architecture. They refine the data and runtime contracts
around its highest-risk areas without requiring a framework or backend.
