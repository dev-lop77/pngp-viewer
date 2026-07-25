# PNGP Viewer — Architecture

## 1. Vision

A navigable 3D web viewer for the Gran Paradiso National Park (Parco Nazionale
Gran Paradiso, PNGP), built around a real digital elevation model (DEM) of the
park. Starting point: a static terrain you can fly around. From there we layer
on points of interest, animated water (rivers, waterfalls, glaciers), a
day/night and weather cycle, a compass/position HUD, and — longer term —
wildlife (the park exists because of the Alpine ibex), trails/huts, and
ambient audio.

Direct inspiration: [ode-to-yosemite](https://github.com/shlokkhemani/ode-to-yosemite)
— a Three.js + Vite valley viewer built from Terrarium heightmap tiles, with
instanced trees, shader-based waterfalls, a 5-stage day cycle, a
clear→clouds→rain→snow weather cycle, OSM-derived buildings/roads, and
procedural wildlife/audio. We borrow its overall shape (vanilla Three.js,
prebuilt static data, one module per concern) rather than its code directly —
our terrain is a high-alpine national park, not a valley floor, so vegetation
line, water features, and points of interest differ a lot.

## 2. Tech stack decision

**Vanilla Three.js + Vite.** No React/Three-Fiber.

Rationale:
- The reference project proves this stack handles exactly this class of
  app (large heightmap terrain, instanced vegetation, custom shaders, HUD
  overlays) with a tiny dependency footprint (`three`, `vite`, plus `sharp`
  and `playwright` as dev-only data/QA tools).
- Most of the complexity here is WebGL/shader work (terrain displacement,
  water, sky, weather), not UI state management. A component framework would
  add an abstraction layer without solving our actual hard problems.
- HUD/UI elements (compass, elevation readout, POI info panel, time/weather
  controls) are simple enough to build as plain DOM overlays positioned over
  the canvas, styled with plain CSS. If UI complexity grows a lot later, we
  can introduce a UI-only framework for the overlay layer without touching
  the Three.js scene code — the two are naturally decoupled (canvas vs. DOM
  layer).

This is a decision we can revisit, but there's no reason to pay React's
overhead before we hit a UI problem that actually needs it.

## 3. Source data

`DEM/heightmap_pngp_4033.png`, calibrated against `DEM/pngp_extraction_report.txt`:

- 4033 × 4033 px, 16-bit grayscale PNG, non-interlaced.
- Source: `DTM0508_002_UNICO.ASC`, native resolution 2.0 m/px.
- Bounding box: UTM32N (EPSG:32632) **E 329116–413000, N 5036775–5085000**
  — a 83,884 m × 48,225 m rectangle. Includes the Gran Paradiso summit.
- Elevation calibration is **linear across the full pixel range**:
  `real_elevation_m = 292.0 + (pixel_value / 65535) * 4519.7`
  (min 292.0 m, max 4811.7 m, mean 2057.1 m). Verified against the report's
  own vegetation-band thresholds (§5) — the formula reproduces all five
  band boundaries to within 1 m, so this mapping is solid.

**Open item — non-square resample.** The source rectangle is not square
(83.9 km E-W × 48.2 km N-S) but the PNG is a square 4033×4033 canvas (a UE5
Landscape constraint: `32 components × 63 quads + 1 = 4033` — this heightmap
was originally produced for a UE5 project, per the report's "IMPOSTAZIONI
UE5 LANDSCAPE" section). Pixel inspection confirms real elevation data runs
to all four edges with no zero/nodata border — i.e. it's **not
letterboxed/padded**, so the rectangle was resampled (non-uniformly) to fit
the square. Net effect: **X and Y have different real-world pixel spacing**
(≈ 20.8 m/px E-W, ≈ 11.96 m/px N-S) — not the uniform 20.8 m/px the report's
own UE5 notes assume (`Scale X/Y: 200` applied to both axes). If we reused
that uniform scale as-is, the terrain would be visibly stretched ~1.74×
along N-S (wrong slopes, wrong distances, wrong waterfall drop heights).

Fix: our own `tools/process-heightmap.mjs` will use the *two different*
per-axis meters/pixel values derived directly from the bbox above
(83884/4033 and 48225/4033) rather than a single uniform scale, so the
terrain reconstructs at correct real-world proportions regardless of what
the square canvas was optimized for. This only requires the bbox numbers we
already have — **no new data needed** — but it's worth confirming with
whoever ran the original extraction (or re-deriving straight from
`DTM0508_002_UNICO.ASC` if still available) since it's an inference from
image statistics, not a documented fact. Tracked in
[docs/PROGRESS.md](PROGRESS.md).

## 4. Data pipeline

Build-time only, static output — no backend/server, everything is prebuilt
and shipped as static assets (matches the reference project's
`npm run fetch-terrain` step, adapted since our DEM is already local rather
than tiled from a remote source).

```
tools/
  process-heightmap.mjs   PNG DEM -> calibrated height data:
                             - public/data/heightmap.png   (GPU displacement texture,
                               resampled/mipmapped as needed)
                             - public/data/heights.bin      (flat Uint16 array + a small
                               JSON sidecar with bbox, real min/max elevation, meters/px —
                               used for CPU-side height queries: POI placement, waterfall
                               brink height, camera/terrain clamping)
  fetch-osm.mjs           Pulls trails, mountain huts (rifugi), hydrology, and the park
                             boundary from OpenStreetMap/Overpass for the PNGP bbox
                             (attribution required, ODbL).
  build-poi.mjs           Curated points of interest -> public/data/poi.json
                             (peaks, rifugi, lakes, valleys, passes — hand-authored,
                             cross-checked against OSM output).
  verify.mjs (optional)   Playwright screenshot/QA pass, same idea as the reference
                             project's shoot/verify scripts — nice-to-have, not MVP.
```

Design choice: terrain is **GPU-displaced**, not a literal CPU mesh at DEM
resolution. A 4033×4033 heightmap is ~16.3M samples — far too many to hand
Three.js as literal vertices. Instead we render a modest-resolution grid
(e.g. 512×512 or 1024×1024, revisit once we can profile) and displace it in
the vertex shader by sampling the heightmap texture (bilinear-filtered), so
visual fidelity comes from the texture resolution, not CPU vertex count. This
also makes future LOD/tiling straightforward: it's the same shader sampling a
different mip level or a different texture tile.

## 5. Terrain texturing — altitude bands

The extraction report already works out five altitude bands for UE5
Landscape material layers, matching real Alpine vegetation zones. These
thresholds are pixel-value ranges (0–65535 domain) and translate directly to
a height-driven splatmap/material-blend approach for `terrain.js` — no
satellite imagery needed to get a plausible, park-accurate look for phase 1:

| Band | Real elevation | Pixel value (WorldHeight) |
|---|---|---|
| Montane forest (larch/fir) | 800–1600 m | < 18965 |
| Subalpine (rhododendron/blueberry scrub) | 1600–2200 m | 18965–27665 |
| Alpine meadow | 2200–3000 m | 27665–39265 |
| Rocky | 3000–3800 m | 39265–50865 |
| Nival (glaciers/snow) | > 3800 m | > 50865 |

Worth carrying forward as-is into our own height-based terrain shader;
revisit only if/when we add real satellite/orthophoto draping (§9).

## 6. Coordinate system & real-world scale

Local metric frame, same principle as the reference project: 1 unit = 1
meter, origin at a fixed reference point inside the bbox (e.g. the DEM's
southwest corner or park centroid — TBD once we scaffold the pipeline).
Compass and position features need a fixed mapping between this local frame
and WGS84 lat/lon — straightforward now that we have the real UTM32N bbox
(§3): project local meters back to UTM32N using the origin offset, then
UTM32N → WGS84 with a small conversion (e.g. `proj4`). No longer blocked on
missing data; roadmap phase 5, "Navigation aids" (§7), just needs this
implemented.

## 7. Feature roadmap

Phased so each step is independently shippable/demoable. Order follows the
user's stated priorities; can reshuffle as we learn more.

| Phase | Scope |
|---|---|
| 0 — Setup | This doc, repo scaffold (Vite + Three.js), DEM calibration resolved, heightmap pipeline producing calibrated `heights.bin` + displacement texture |
| 1 — MVP terrain | GPU-displaced terrain mesh, fly/orbit camera, static sun + simple sky/fog. First deploy to Vercel to validate the static-hosting pipeline end to end |
| 2 — Points of interest | Curated POI dataset (peaks, rifugi, lakes, valleys), map markers + info panel, fly-to-POI navigation |
| 3 — Water & animation | Rivers/lakes, waterfalls (e.g. Cascate di Lillaz) with shader animation + mist, glaciers as a distinct surface |
| 4 — Environment | Time-of-day slider driving sun position/sky/fog/exposure; weather states (clear → clouds → rain → snow) |
| 5 — Navigation aids | Compass HUD, live position readout (lat/lon, elevation, nearest place name) |
| 6 — Life & atmosphere (stretch) | Wildlife (Alpine ibex, chamois, marmots — the park's founding species), procedural ambient audio, trails/huts from OSM, treeline vegetation |
| 7 — Polish | LOD/tiling if draw distance needs it, mobile pass, optional automated screenshot QA |

## 8. Module layout

```
pngp-viewer/
├── DEM/                    raw source heightmap (already present)
├── docs/
│   ├── ARCHITECTURE.md     this document
│   └── PROGRESS.md         running status/decision log — read this first each session
├── tools/                  build-time node scripts (see §4)
├── public/
│   └── data/               generated static assets (heights.bin, heightmap.png, poi.json, ...)
├── src/
│   ├── main.js             entry point, scene setup, render loop
│   ├── terrain.js          heightmap-driven terrain mesh + displacement shader
│   ├── lighting.js         sun position, day/night cycle
│   ├── atmosphere.js       sky, fog, aerial perspective
│   ├── weather.js          clear/clouds/rain/snow state machine
│   ├── water.js            rivers, lakes, waterfalls
│   ├── poi.js              point-of-interest markers + fly-to
│   ├── controls.js         camera navigation
│   ├── wildlife.js         (phase 6) ibex/chamois/marmots
│   └── ui/                 DOM HUD: compass, position readout, POI panel, time/weather controls
├── index.html
├── package.json
├── vite.config.js
└── .gitignore
```

## 9. Deployment target

Static hosting (Vercel, Netlify, or GitHub Pages), no backend. Since this is
meant to go online, a few things to keep in mind from the start rather than
retrofit later:

- **Asset budget**: reference project ships ~76 MB of prebuilt data. Worth
  tracking our own total and deciding a target ceiling once phase 1 data is
  in; heightmap texture + height binary + POI/OSM json should be well under
  that on their own.
- **Large binary assets in git**: if generated data grows past a few tens of
  MB, plain git (and especially GitHub Pages' repo-size expectations) starts
  to strain. Options to revisit when it matters: Git LFS, or excluding
  `public/data/*` from git and publishing it as a build artifact / from
  object storage instead. Not a blocker now — flagging so it's a deliberate
  choice later, not an accident.
- **Data licensing**: OSM data is ODbL (attribution required, redistribution
  of derived renders is fine). Any satellite/orthophoto basemap needs its
  license checked before going public — Italy's Geoportale Nazionale/PCN
  orthophotos are a good candidate (open), ESRI World Imagery has usage
  restrictions worth reading closely before shipping publicly. Decide when
  we get to imagery draping, not blocking now.

## 10. Non-goals (for now)

Not pursuing unless priorities change: multiplayer/shared sessions, a
native/VR client, a CMS/backend for editing POIs (hand-authored JSON is
plenty at this scale), mobile-first design (desktop-first, mobile pass is
phase 7 at earliest).

## 11. Open questions

Tracked with current status in [docs/PROGRESS.md](PROGRESS.md) — check there
before assuming anything below is still unresolved.

1. Confirmation of the non-square resample handling (§3) — we have a fix
   that needs no new data, just worth double-checking against the original
   extraction script/`DTM0508_002_UNICO.ASC` if still available.
2. Exact basemap/orthophoto source for later imagery draping, once we get to
   phase 6/7 polish (§9).
