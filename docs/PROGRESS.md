# Progress log

Read this first at the start of each session. Update it before ending one.

## Status as of 2026-07-25

**Phase: 0 — Setup.** Architecture doc written and repo skeleton created.
No application code yet.

### Done
- Inspected `DEM/heightmap_pngp_4033.png`: 4033×4033 px, 16-bit grayscale,
  pixel values 0–65493 (normalized, not raw meters), no embedded geo
  metadata in the PNG itself.
- Found and read `DEM/pngp_extraction_report.txt` (appeared mid-session) —
  this resolved the DEM calibration question:
  - Source: `DTM0508_002_UNICO.ASC`, native res 2.0 m/px.
  - Bbox: UTM32N (EPSG:32632) E 329116–413000, N 5036775–5085000
    (83,884 × 48,225 m). Includes Gran Paradiso summit.
  - Elevation: linear, `292.0 + (pixel/65535) * 4519.7` m (min 292.0,
    max 4811.7, mean 2057.1) — verified against the report's own
    vegetation-band thresholds, matches to within 1 m.
  - Also gave us 5 ready-made altitude-based vegetation bands (montane
    forest / subalpine / alpine meadow / rocky / nival) usable directly for
    height-driven terrain texturing.
- Caught a non-obvious issue by inspecting pixel data directly: the source
  rectangle isn't square (83.9 × 48.2 km) but the PNG is a square 4033×4033
  canvas (a UE5 Landscape sizing constraint) — border pixels carry real data,
  not padding, so it was resampled non-uniformly to fit the square. Fix
  identified (use two different m/px values per axis, not the UE5 project's
  uniform one) — needs no new data, but flagged for the user to confirm
  against the original extraction script if they still have it. Full
  writeup in `docs/ARCHITECTURE.md` §3.
- Reviewed the reference project (github.com/shlokkhemani/ode-to-yosemite):
  vanilla Three.js + Vite, `three`/`vite`/`sharp`/`playwright` only, one
  module per concern (`terrain.js`, `lighting.js`, `atmosphere.js`,
  `weather.js`, `waterfalls.js`, `trees.js`, `village.js`, `wildlife.js`,
  `audio.js`, `controls.js`), data prebuilt via `tools/*.mjs` scripts into
  static assets, no backend.
- Decided project direction with the user (see decisions below).
- Wrote `docs/ARCHITECTURE.md`.
- Initialized git repo (`main` branch), created folder skeleton
  (`docs/`, `tools/`, `src/`, `public/data/`).

### Decisions made
- **Tech stack**: vanilla Three.js + Vite, DOM overlay for HUD/UI. No React.
  User deferred this choice; rationale in ARCHITECTURE.md §2.
- **Deployment**: public, online (Vercel/Netlify/GitHub Pages) — not just
  local dev. Implies we should mind asset size/licensing from early on
  (ARCHITECTURE.md §9), not retrofit later.
- **Language**: English for code, docs, UI copy, and POI names.
- **Georeferencing**: resolved — see Done above and ARCHITECTURE.md §3.
  Original DEM was produced for a UE5 project, not built for this web
  project from scratch.

### Open questions (non-blocking)
1. **Non-square resample confirmation** — we have a working fix (per-axis
   m/px instead of the UE5 project's uniform scale) that needs no new data,
   but it's an inference from image statistics, not a documented fact.
   Worth a quick confirmation from whoever ran the original extraction, or
   re-deriving from `DTM0508_002_UNICO.ASC` directly if still reachable
   (report path suggests a WSL machine: `/mnt/c/LoP/UE5/PNGP Trekking/...`).
   Doesn't block phase 1 or the pipeline — we can proceed with the fix as
   designed.
2. **Basemap/orthophoto source** for later imagery draping (phase 6/7) —
   not needed until then.

### Next steps (not yet started)
1. Scaffold the actual Vite + Three.js project (`package.json`,
   `vite.config.js`, `index.html`, minimal `src/main.js`) — waiting on
   architecture doc sign-off before doing this, to avoid rework.
2. Write `tools/process-heightmap.mjs`: DEM PNG → `public/data/heightmap.png`
   (GPU displacement texture) + `public/data/heights.bin` + JSON sidecar,
   using the real bbox/elevation calibration and per-axis m/px values now
   in ARCHITECTURE.md §3 (no placeholders needed).
3. Phase 1 MVP: GPU-displaced terrain mesh + fly/orbit camera + basic
   sky/fog, first deploy to Vercel to prove the static-hosting pipeline.

### How to resume
Read `docs/ARCHITECTURE.md` for the full plan and rationale, then this file
for exact status. Calibration is resolved and nothing currently blocks
starting phase 1 — just pick up at "Next steps" above. If the user has since
confirmed or corrected the non-square resample handling (open question #1),
update that section and ARCHITECTURE.md §3 accordingly before writing
`process-heightmap.mjs`.
