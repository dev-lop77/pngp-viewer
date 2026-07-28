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

**Primary heightmap (as of 2026-07-28): `DEM/pngp_heightmap.png` +
`DEM/pngp_heightmap_meta.json`.** Produced by running
`tools/dtm-source/extract-heightmap.sh` against the real 10 GB source
(`DTM0508_002_UNICO.ASC`) on the machine holding it, then copying the two
outputs into this repo's `DEM/` folder. This supersedes the UE5-derived
`DEM/heightmap_pngp_4033.png` below (kept for history/reference, not used
going forward) — it has no square-canvas distortion and its calibration is
written out directly by GDAL rather than inferred from image statistics.

- 8388 × 4823 px, 16-bit grayscale, uniform **10 m/px on both axes** (the
  true bbox aspect ratio, 83884:48225 ≈ 1.739, matches 8388:4823 exactly —
  no per-axis correction needed).
- CRS: **ED50 UTM32N (EPSG:23032)**, forced explicitly by the script (see
  below for why, not auto-detected).
- Bbox: same as the legacy extraction, **E 329116–413000, N
  5036775–5085000**.
- Elevation, linear across the full pixel range:
  `real_elevation_m = 292.2356262207 + (pixel_value / 65535) * 4517.5773620605`
  (min 292.2356262207 m, max 4809.8129882812 m — matches the independent
  Mont Blanc cross-check below to within 2 m of the previous estimate).

**Legacy heightmap — removed from the repo as of 2026-07-28** (was
`DEM/heightmap_pngp_4033.png`, still recoverable from git history if ever
needed). It was a 4033×4033 px square canvas — a UE5 Landscape sizing
constraint (`32 components × 63 quads + 1 = 4033`) — produced by
non-uniformly resampling the true (non-square) bbox rectangle to fit that
square, which gave it different real-world pixel spacing per axis (≈ 20.8
m/px E-W, ≈ 11.96 m/px N-S). The primary heightmap above has no such
distortion (uniform 10 m/px both axes), so this no longer matters for
`tools/process-heightmap.mjs`.

The one thing worth preserving from that file's investigation: the
**independent EPSG:23032 (ED50) verification**. The extraction script that
produced it flagged its own datum choice as approximate ("EPSG:23032... il
più comune per VdA"), and its sidecar `.prj` used old ESRI keywords (`Datum
EUR_M, Spheroid INT1909`) that GDAL can't map to a specific EPSG code. We
confirmed EPSG:23032 independently by back-projecting the legacy
heightmap's max-elevation pixel: it lands within ~15 m of Mont Blanc's
published summit (45.8325°N, 6.8650°E) under EPSG:23032, vs. ~200 m off
under the more common modern EPSG:32632/25832 — enough to matter for the
compass/position feature (§7) even though it's irrelevant to terrain shape.
This is why `tools/dtm-source/*.sh` forces `-a_srs EPSG:23032` explicitly
rather than trusting `.prj` auto-detection, and why the primary heightmap's
elevation max (4809.8 m) exceeds the Gran Paradiso summit (4061 m) — the
bbox's northwest corner also catches the southern flank of Mont Blanc.

### Trails — Regione Valle d'Aosta "Rete Sentieristica" (replaces OSM)

As of 2026-07-28, the trail source is the official regional dataset
(Geoportale SCT), not OSM — verified directly rather than assumed, see
`tools/trails-source/README.md` for the full writeup:

- Three related layers: `tratte` (~11,000 elementary segments: code,
  length, percorribilità, difficoltà), `sentieri` (~1,200 named/numbered
  itineraries: name, segnavia number e.g. "25A", length, dislivello,
  difficulty — often null at this aggregate level, use `tratte` for
  reliable per-segment difficulty), `poderali` (dirt/service roads, not
  currently planned for use).
- Difficulty is the standard CAI scale: **T / E / EE / EEA** — confirmed
  by inspecting real attribute values, not just the docs.
- CRS: **EPSG:23032**, confirmed by inspecting the shapefile's own `.prj`
  — matches our DEM exactly, no reprojection needed anywhere in the
  pipeline.
- License: **CC BY 4.0** (DGR 899/2014, DGR 1620/2016) — free reuse
  including commercial and modification, on condition of a specific
  attribution string (see the README) shown wherever the data or a
  derived render is displayed. This needs a credits/about panel in the
  shipped app eventually (tracked in `docs/PROGRESS.md`).
- `tools/trails-source/fetch-trails.sh` downloads + clips it to our bbox;
  unlike the DTM source this needs no special machine, just a small direct
  download, but the raw whole-region shapefile still stays external/
  gitignored rather than committed — only a future build script's output
  (`public/data/trails.json`, once written) would be small enough and
  project-specific enough to check in.

This changes the roadmap: trails/huts were scoped as an OSM-based phase-6
stretch goal (§7) when we only had OSM as the option. Worth revisiting
that phasing now that we have a real, numbered, difficulty-graded dataset
— not decided yet, flagged in `docs/PROGRESS.md`. OSM likely still has a
role for what this dataset doesn't cover (park boundary, hydrology,
rifugi as standalone POIs).

## 4. Data pipeline

Build-time only, static output — no backend/server, everything is prebuilt
and shipped as static assets (matches the reference project's
`npm run fetch-terrain` step, adapted since our DEM is already local rather
than tiled from a remote source).

There are two stages, kept deliberately separate:

- **`tools/dtm-source/*.sh`** and **`tools/trails-source/*.sh`** —
  external, manual, run outside this repo and outside the normal build
  (see §3). Turn the 10 GB native DTM and the whole-region trail dataset
  respectively into small, PNGP-clipped extracts. Occasional/one-off, not
  run on every build; the DTM script also isn't something a fresh clone of
  this repo can run on its own (needs the 10 GB source file, not checked
  in) — the trails script can, it just needs `gdal-bin` and network access.
- **`tools/*.mjs`** below — the regular, repo-local build pipeline. Takes
  whatever raw extracts currently sit in `DEM/` / wherever the trail
  extract lands, and turns them into the web-ready assets under
  `public/data/`.

```
tools/
  process-heightmap.mjs   PNG DEM -> calibrated height data:
                             - public/data/heightmap.png   (GPU displacement texture,
                               resampled/mipmapped as needed)
                             - public/data/heights.bin      (flat Uint16 array + a small
                               JSON sidecar with bbox, real min/max elevation, meters/px —
                               used for CPU-side height queries: POI placement, waterfall
                               brink height, camera/terrain clamping)
  build-trails.mjs        Regione VDA GeoJSON (from tools/trails-source/fetch-trails.sh)
                             -> public/data/trails.json (segnavia number, name, difficulty
                             T/E/EE/EEA, length, dislivello) — see §3. Requires the CC BY 4.0
                             attribution to be surfaced wherever this renders (§9).
  fetch-osm.mjs           Pulls mountain huts (rifugi), hydrology, and the park boundary
                             from OpenStreetMap/Overpass for the PNGP bbox (attribution
                             required, ODbL). No longer used for trails — see §3.
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
and WGS84 lat/lon — straightforward now that we have the real bbox (§3):
project local meters back to **ED50 UTM32N (EPSG:23032)** using the origin
offset, then EPSG:23032 → WGS84 (EPSG:4326) with a small conversion (e.g.
`proj4`, which ships this datum transform). Using EPSG:32632 here instead
would be a plausible-looking but wrong default — worth a code comment when
this gets implemented, since it's the kind of mistake that silently produces
a position readout ~100-200 m off rather than an obvious error. No longer
blocked on missing data; roadmap phase 5, "Navigation aids" (§7), just needs
this implemented.

## 7. Feature roadmap

Phased so each step is independently shippable/demoable. Order follows the
user's stated priorities; can reshuffle as we learn more.

| Phase | Scope |
|---|---|
| 0 — Setup | This doc, repo scaffold (Vite + Three.js), DEM calibration resolved, heightmap pipeline producing calibrated `heights.bin` + displacement texture |
| 1 — MVP terrain | GPU-displaced terrain mesh, fly/orbit camera, static sun + simple sky/fog. First deploy to Vercel to validate the static-hosting pipeline end to end |
| 2 — Points of interest | Curated POI dataset (peaks, rifugi, lakes, valleys), map markers + info panel, fly-to-POI navigation. **Candidate to also bring in numbered/graded trails here** (§3) — was OSM-only phase-6 scope, revisit now that we have the VDA dataset; not decided yet |
| 3 — Water & animation | Rivers/lakes, waterfalls (e.g. Cascate di Lillaz) with shader animation + mist, glaciers as a distinct surface |
| 4 — Environment | Time-of-day slider driving sun position/sky/fog/exposure; weather states (clear → clouds → rain → snow) |
| 5 — Navigation aids | Compass HUD, live position readout (lat/lon, elevation, nearest place name) |
| 6 — Life & atmosphere (stretch) | Wildlife (Alpine ibex, chamois, marmots — the park's founding species), procedural ambient audio, huts/hydrology from OSM, treeline vegetation |
| 7 — Polish | LOD/tiling if draw distance needs it, mobile pass, optional automated screenshot QA |

## 8. Module layout

```
pngp-viewer/
├── DEM/                    raw source heightmap + original UE5 extraction scripts (already present)
├── docs/
│   ├── ARCHITECTURE.md     this document
│   └── PROGRESS.md         running status/decision log — read this first each session
├── tools/
│   ├── dtm-source/         external/manual GDAL scripts, run outside the repo (see §3-4)
│   ├── trails-source/      external/manual trail dataset fetch+clip, run outside the repo (see §3-4)
│   └── *.mjs               regular build-time node scripts (see §4)
├── public/
│   └── data/               generated static assets (heights.bin, heightmap.png, poi.json, trails.json, ...)
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
  of derived renders is fine). The Regione Valle d'Aosta trail dataset (§3)
  is CC BY 4.0 — commercial use and modification both fine, but requires a
  specific attribution string shown wherever the data (or a render of it)
  appears; needs an actual credits/about panel in the UI once trails ship,
  not just a code comment. Any satellite/orthophoto basemap needs its
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

1. Exact basemap/orthophoto source for later imagery draping, once we get to
   phase 6/7 polish (§9).
2. Whether to move numbered/graded trails from phase 6 (OSM-based stretch
   goal) up to phase 2 alongside POI, now that we have the official VDA
   dataset instead of just OSM (§3, §7) — not decided with the user yet.
