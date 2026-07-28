# Progress log

Read this first at the start of each session. Update it before ending one.

## Status as of 2026-07-28

**Phase: 0 — Setup, wrapping up.** The real, correctly-proportioned
heightmap is now in the repo. No application code yet.

### Done since 2026-07-25
- Ran `tools/dtm-source/extract-heightmap.sh` on the processing machine
  against the real 10 GB source and copied the two outputs into `DEM/`:
  `pngp_heightmap.png` (8388×4823px, 16-bit, uniform 10 m/px both axes) and
  `pngp_heightmap_meta.json` (calibration sidecar). Verified: image
  dimensions match the bbox aspect ratio exactly (1.739), elevation range
  292.2356262207–4809.8129882812 m (within 2m of the earlier UE5-derived
  estimate), CRS EPSG:23032 as expected.
- This resolves open question #1 from the previous status (non-square
  resample correction) — it's now moot, since the new heightmap has no
  distortion to correct for. Updated `docs/ARCHITECTURE.md` §3 to make
  `DEM/pngp_heightmap.png` the primary/authoritative heightmap and
  demoted `DEM/heightmap_pngp_4033.png` to legacy/reference-only.
- Noted: `DEM/DTM0508_002_UNICO.PRJ` (untracked, appeared in the repo) is
  just a stray copy of the old source sidecar `.prj` — not one of the
  extraction outputs, not needed, user confirmed it's an old file.

### Open questions (non-blocking)
1. **Basemap/orthophoto source** for later imagery draping (phase 6/7) —
   not needed until then. (Only remaining open question — the DTM
   re-extraction question from 2026-07-25 is resolved, see Done above.)
2. Whether to commit the new `DEM/pngp_heightmap.png` (~39 MB) +
   `pngp_heightmap_meta.json` to git, and whether to remove the now-legacy
   `DEM/heightmap_pngp_4033.png` (~16 MB, already committed) or keep it
   for reference — not yet decided with the user.

### Next steps (not yet started)
1. Scaffold the actual Vite + Three.js project (`package.json`,
   `vite.config.js`, `index.html`, minimal `src/main.js`).
2. Write `tools/process-heightmap.mjs`: DEM PNG → `public/data/heightmap.png`
   (GPU displacement texture) + `public/data/heights.bin` + JSON sidecar,
   using the calibration in `DEM/pngp_heightmap_meta.json` / ARCHITECTURE.md
   §3 (uniform 10 m/px, no per-axis correction needed).
3. Phase 1 MVP: GPU-displaced terrain mesh + fly/orbit camera + basic
   sky/fog, first deploy to Vercel to prove the static-hosting pipeline.

### How to resume
Read `docs/ARCHITECTURE.md` for the full plan and rationale, then this file
for exact status. The real heightmap is in place and calibrated — nothing
blocks starting phase 1, just pick up at "Next steps" above (git
commit/cleanup of DEM files is a small open item to sort out first, see
open question #2).

## Status as of 2026-07-25 (historical)

**Phase: 0 — Setup.** Architecture doc written and repo skeleton created.
No application code yet.

### Done
- Inspected `DEM/heightmap_pngp_4033.png`: 4033×4033 px, 16-bit grayscale,
  pixel values 0–65493 (normalized, not raw meters), no embedded geo
  metadata in the PNG itself.
- Found and read `DEM/pngp_extraction_report.txt` (appeared mid-session) —
  this resolved the DEM calibration question:
  - Source: `DTM0508_002_UNICO.ASC`, native res 2.0 m/px.
  - Bbox: E 329116–413000, N 5036775–5085000 (83,884 × 48,225 m),
    CRS later corrected to EPSG:23032 (see below). Includes both the Gran
    Paradiso summit and the southern flank of the Mont Blanc massif.
  - Elevation: linear, `292.0 + (pixel/65535) * 4519.7` m (min 292.0,
    max 4811.7, mean 2057.1) — verified against the report's own
    vegetation-band thresholds, matches to within 1 m.
  - Also gave us 5 ready-made altitude-based vegetation bands (montane
    forest / subalpine / alpine meadow / rocky / nival) usable directly for
    height-driven terrain texturing.
- Caught a non-obvious issue by inspecting pixel data directly: the source
  rectangle isn't square (83.9 × 48.2 km) but the PNG is a square 4033×4033
  canvas (a UE5 Landscape sizing constraint) — border pixels carry real data,
  not padding, so it was resampled non-uniformly to fit the square. Fallback
  fix identified (use two different m/px values per axis) if we ever only
  have this PNG to work with. Full writeup in `docs/ARCHITECTURE.md` §3.
- User has the actual 10 GB source (`DTM0508_002_UNICO.ASC`, on their Ubuntu
  WSL machine, root access), separate from this repo. Wrote
  `tools/dtm-source/inspect-dtm.sh` (read-only header/CRS/extent check) and
  `tools/dtm-source/extract-heightmap.sh` (GDAL crop+resample+normalize,
  writes to an external work dir, outputs a heightmap PNG + JSON calibration
  sidecar with the TRUE non-square aspect ratio preserved — no per-axis
  correction needed once this is run). Both default to the same bbox
  already in `pngp_extraction_report.txt`. See `tools/dtm-source/README.md`.
- Two more files appeared mid-session: `DEM/scripts/extract_pngp_from_vda.py`
  (the actual script that produced the current heightmap) and
  `DEM/scripts/vda_dtm_to_ue5.py`. Reading the real code: (a) confirmed the
  square-canvas distortion as fact, not inference — it does a plain
  `.resize((size, size))` on a non-square array; (b) revealed the script
  assumed **EPSG:23032 (ED50 UTM32N)**, not EPSG:32632/25832 (WGS84/ETRS89
  UTM32N) as this doc previously said — and flagged that assumption itself
  as approximate ("il più comune per VdA").
- **Independently verified the datum**: found the max-elevation pixel
  (65493, ~4809m) in the heightmap, back-projected its approximate source
  coordinates, and transformed under both candidate CRSes. EPSG:23032 lands
  within ~15m of Mont Blanc's published summit (45.8325°N, 6.8650°E);
  EPSG:32632/25832 is ~200m off. Also explains why the reported max
  elevation (4811.7m) exceeds Gran Paradiso's 4061m — the bbox's northwest
  corner catches Mont Blanc's southern flank, and the report's "Gran
  Paradiso incluso" check only tests `alt_max > 4000`, not which peak.
  **Corrected ARCHITECTURE.md §3 and §6 to EPSG:23032 and fixed the same
  default in both `tools/dtm-source/*.sh` scripts.**
- User ran `tools/dtm-source/inspect-dtm.sh` (output: `inspect-dtm.log`,
  gitignored, not committed). Confirmed: full source file is 44174×28557 px
  at 2 m/px, origin E 329116.00/N 5036775.00 — our crop's west/south edges
  exactly match the source file's own edges. Also confirmed a sidecar
  `DTM0508_002_UNICO.prj` exists: `Datum EUR_M, Spheroid INT1909`
  (International 1924 ellipsoid) — consistent with ED50, corroborating the
  Mont Blanc cross-check, but GDAL can't map the ESRI `EUR_M` keyword to a
  specific EPSG code on its own, so both scripts were updated to force
  `-a_srs EPSG:23032` explicitly rather than trust that auto-detection.
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

(Open questions / next steps from this date are superseded — see the
2026-07-28 status above for the current list.)
