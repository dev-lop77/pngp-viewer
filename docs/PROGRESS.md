# Progress log

Read this first at the start of each session. Update it before ending one.

## Status as of 2026-07-28

**Phase: 0 — Setup, complete.** Vite + Three.js scaffold is in place and
verified rendering. Next work starts phase 1 (real terrain).

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
  extraction outputs, not needed, user confirmed it's an old file. Left
  untracked, not committed.
- Committed the new heightmap + meta.json and removed
  `DEM/heightmap_pngp_4033.png` from the repo (still recoverable from git
  history) — user's call, to keep a single authoritative heightmap.
  `.git` is now ~54 MB (was ~17 MB).
- **Found and verified an official trail data source**: user asked about
  alternatives to OSM for trails (wanted numbering + difficulty grading).
  Researched and directly inspected (downloaded the actual dataset, ran
  `ogrinfo`, read the license PDFs — not just read the marketing page) the
  Regione Valle d'Aosta "Rete Sentieristica" dataset (Geoportale SCT):
  ~1,200 numbered itineraries + ~11,000 elementary segments, real CAI
  difficulty (T/E/EE/EEA confirmed from actual attribute values), CRS
  EPSG:23032 (matches our DEM exactly), **CC BY 4.0** license (confirmed
  from the actual license PDF — free incl. commercial use, needs a specific
  attribution string wherever shown). Full detail in `docs/ARCHITECTURE.md`
  §3. User decided: this **replaces OSM as the trail source** (OSM may
  still cover rifugi/hydrology/park boundary), and the raw dataset is
  handled as an **external download+script**, same pattern as
  `tools/dtm-source/` — not committed to the repo. Wrote
  `tools/trails-source/fetch-trails.sh` (downloads + clips to our bbox,
  outputs GeoJSON to `$HOME/pngp-trails-work`) and its README. Updated
  `docs/ARCHITECTURE.md` §3, §4, §7, §9, §11 accordingly.
- **Decided: trails move to phase 2**, alongside POI (was phase-6/OSM-only
  scope) — user confirmed, now that we have the numbered/graded VDA
  dataset there's no reason to treat trails as late-stage stretch content.
  Updated `docs/ARCHITECTURE.md` §7 roadmap table and §3 accordingly.
- **New standing principle: performance/fluidity/navigability is a
  first-class concern in every implementation choice**, not a phase-7
  retrofit — user asked explicitly for this (LOD/level-of-detail,
  lazy-loading of data, not depth-of-field — confirmed that's what they
  meant when the phrase was ambiguous). Wrote up concretely in new
  `docs/ARCHITECTURE.md` §10 ("Performance & fluidity principles"): LOD
  applied as each phase's geometry grows (not deferred to phase 7),
  lazy/progressive data loading (esp. relevant for the ~1,200-itinerary
  trail dataset — don't render it all eagerly at full detail), frustum
  culling + instancing for repeated markers, and frame-rate/navigation
  smoothness treated as part of each phase's "done" check.
- Reviewed `docs/ARCHITECTURE_SUGGESTIONS.md`, an external architecture
  review (11 points, P0–P2). Triaged for phase-0 relevance and verified
  the concrete claims rather than taking them on faith — found the
  reviewer was right about a real, small rounding inconsistency: our own
  bbox ÷ image dimensions gives **9.9995 m/px (E-W) and 9.999 m/px (N-S)**,
  not the uniform 10 m/px declared in `DEM/pngp_heightmap_meta.json`
  (artifact of how `gdalwarp -te`+`-tr` rounds pixel counts). Also spotted
  a real wording tension between §10 ("LOD always") and §7 phase 7 ("LOD/
  tiling if draw distance needs it", reading as optional). **User's call:
  don't act on any of this now** — tracked below, revisit at the specific
  milestone each point is tied to, not before.
- **Scaffolded the Vite + Three.js project**: `package.json` (`type:
  module`, `dev`/`build`/`preview` scripts), `vite.config.js` (`base:
  './'` so the build works unmodified on Vercel/Netlify/GitHub Pages —
  deployment target still undecided, §9), `index.html`, `src/main.js`
  (scene/camera/renderer, `OrbitControls`, basic lighting, a grid helper +
  placeholder cube standing in for real terrain). Dependencies: `three@^0.185.1`,
  `vite@^8.1.5` (current at install time — versions drift, check
  `package.json` rather than trusting this note later). Verified with a
  real headless-browser run (not just `vite build`): dev server up, page
  renders the expected scene, zero console/page errors (only an
  expected headless-GPU driver perf warning and Vite HMR debug lines).
  **Note**: this bare scaffold didn't actually need open question #3's
  "before scaffolding" item (local origin/axis lock) — that only matters
  once real-world coordinates enter the picture, i.e. `process-heightmap.mjs`
  and `terrain.js`. Moved that item down to the process-heightmap.mjs
  milestone below rather than block on it here.

### Open questions (non-blocking)
1. **Basemap/orthophoto source** for later imagery draping (phase 6/7) —
   not needed until then.
2. The CC BY 4.0 attribution string for the trail data needs to actually
   show up in the shipped UI (credits/about panel) once trails render —
   not urgent until that phase, but don't forget it (§9).
3. **Deferred items from `docs/ARCHITECTURE_SUGGESTIONS.md`** (not acted on
   per user's explicit choice 2026-07-28 — revisit at the milestone noted,
   don't assume still unresolved without checking the doc first):
   - Before writing `tools/process-heightmap.mjs` / `src/terrain.js`
     (Next steps #1): #1 browser-safe height encoding (PNG vs tiled Uint16
     binary vs packed 8-bit), #2 the rounding inconsistency above (store
     the real per-axis resolution / affine transform, not a nominal "10"),
     #4 a versioned manifest convention, #5 lock local origin/axis
     convention and where the EPSG:23032↔WGS84 conversion lives (unblocks
     ARCHITECTURE.md §6, currently "TBD"), #11 provenance metadata (stable
     source id instead of a local path, checksums, tool versions).
   - Before/during the phase 1 terrain renderer: #3 decide the tile/LOD
     contract as part of the terrain design itself (not bolted on later),
     and fix the §7/§10 wording tension found above.
   - Before finalizing the phase 2 trail contract: #6 verify the VDA trail
     dataset actually covers the whole park (not just intersects our bbox)
     against the real park boundary, once we have one.
   - Not meaningful before a running prototype exists (§7 phase 1 done):
     #9 performance budgets, #10 automated pipeline/correctness tests.
   - Good practice to keep in mind, no dedicated decision needed: #7 module/
     layer boundaries, #8 runtime failure/fallback behavior.

### Next steps (not yet started)
1. Write `tools/process-heightmap.mjs`: DEM PNG → `public/data/heightmap.png`
   (GPU displacement texture) + `public/data/heights.bin` + JSON sidecar,
   using the calibration in `DEM/pngp_heightmap_meta.json` / ARCHITECTURE.md
   §3. Revisit open question #3's "before process-heightmap.mjs" items
   first (height encoding, resolution precision, origin/axes, manifest,
   provenance) — several are genuine decisions, not just cleanup.
2. Phase 1 MVP: GPU-displaced terrain mesh + fly/orbit camera + basic
   sky/fog (replacing `src/main.js`'s placeholder cube), first deploy to
   Vercel to prove the static-hosting pipeline. Keep §10 in mind even here:
   sanity-check frame rate while flying across the whole map, not just at a
   fixed viewpoint. Decide the tile/LOD contract as part of this, not after
   (open question #3).
3. Phase 2, when it starts: run `tools/trails-source/fetch-trails.sh`, then
   write `tools/build-trails.mjs` to turn its output into
   `public/data/trails.json` alongside `build-poi.mjs`. Apply §10 here in
   particular — ~1,200 itineraries/~11,000 segments is enough data to need
   spatial chunking + lazy loading + distance-based line simplification
   from the start, not as an afterthought. Verify park-wide trail coverage
   first (open question #3).

### How to resume
Read `docs/ARCHITECTURE.md` for the full plan and rationale, then this file
for exact status. The Vite + Three.js scaffold runs and renders (verified
headlessly, see Done above) — `npm run dev` should just work. Pick up at
"Next steps" above; check open question #3 before each one, there are
specific `docs/ARCHITECTURE_SUGGESTIONS.md` items to revisit at each
milestone.

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
