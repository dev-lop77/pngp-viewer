# Progress log

Read this first at the start of each session. Update it before ending one.

## Status as of 2026-07-31

**Frame rate check done, confirmed good.** The one open item left from
2026-07-30 (phase 3 + Piemonte DEM gap work was fully done but never
committed - fixed first: commit `02d707a`). Added a small permanent `#fps`
overlay (`index.html` + `src/main.js`, rolling 0.5s average via
`THREE.Timer.getDelta()`) rather than relying on a headless measurement -
headless Playwright runs on SwiftShader (software GL), which showed ~5
fps and would have been a meaningless number for a real-hardware question.
User tested for real: production preview build, port-forwarded to their
own browser, flew across the whole map with all water features (~250:
lakes/rivers/glaciers/waterfalls) live - **sustained ~30 fps during
navigation**, confirmed good by the user. Satisfies §10's fluidity bar for
phase 3; closes 2026-07-30's "Next steps" item #1. The `#fps` overlay
stays in the app going forward as a standing, zero-cost way to spot-check
this again at each future phase, per §10's "not just phase 7" principle.

**Later the same day: phase 4 (environment) built end to end.** User chose
to go with a full port of the reference project's lighting/atmosphere/
weather sophistication (Sky addon + 5 time-of-day presets with crossfade,
aerial-perspective fog replacing plain linear fog, procedural cloud deck,
GPU rain/snow particles) rather than a simplified version, after being
shown what the reference's actual code does (fetched and read
`lighting.js`/`atmosphere.js`/`weather.js`/`main.js` from
github.com/shlokkhemani/ode-to-yosemite directly, same "verify the real
code before adapting" instinct as phase 3's waterfalls). Confirmed via
`AskUserQuestion` before building given the real complexity/risk trade-off
(this patches three.js's global fog shader chunks, the same class of
shader-integration risk as phase 3's logarithmicDepthBuffer landmine).

### Done: phase 4 (environment)
- **New modules**: `src/atmosphere.js` (shared `ATMO` uniforms + global
  `THREE.ShaderChunk.fog_*` patch + `attachAtmo()` for built-ins +
  `ATMO_FOG_PARS`/`atmoApply()` exported for manual use), `src/lighting.js`
  (5 presets: dawn/day/golden/dusk/night), `src/weather.js` (4 modes:
  clear/clouds/storm/snow). `docs/ARCHITECTURE.md` §8 has the full
  per-module writeup.
- **Real diverges from the reference on purpose, not by accident**: the
  reference's terrain is unlit (sun shading baked into satellite imagery),
  so its lighting.js multiplies a manual "tint" onto materials and computes
  its own slope-relighting hack. Ours uses a real `MeshStandardMaterial`
  (terrain.js, water.js's glaciers) lit by a real `THREE.DirectionalLight`
  + `THREE.AmbientLight` (main.js) - so `lighting.js` just moves/recolors
  those two real lights per preset and gets correct shading for free, no
  tint hack or relight term needed. Two direction vectors per preset,
  same as the reference: `sun` (the Sky dome's literal sun position, can
  dip below the horizon at night) vs `light` (defaults to `sun` but
  substitutes a moon-like elevated angle at night, used for both the real
  DirectionalLight's direction and the glow/inscatter term) - kept for the
  same reason the reference has it: a real light shining from below the
  horizon at night would be physically wrong and leave the terrain black.
- **Continuous slider, not discrete keyboard cycling**: the reference cycles
  presets with a keypress (`L`) since it's a pointer-lock walking-sim demo;
  this project's stack decision is a DOM-overlay HUD (no React, no
  pointer-lock), so `lighting.setTime(fraction)` instead interpolates
  directly between whichever two presets a 0..1 slider position falls
  between (wrapping night->dawn for a full day cycle) - instant, not
  animated, since dragging the slider already supplies the "animation."
  Weather stays discrete (`set()`/`cycle()`, ~4s crossfade) since "weather
  states" is the roadmap's own wording and a `<select>` fits better than a
  second slider.
- **`attachAtmo()` wired into every built-in material**: terrain.js,
  trails.js (all 4 line-style materials), poi.js (per-category
  InstancedMesh), water.js's glaciers - each module attaches its own
  atmosphere integration rather than main.js reaching into other modules'
  materials, matching the existing module-ownership style.
- **water.js's lakes/rivers/waterfall-ribbon custom `ShaderMaterial`s
  needed manual integration**, not `attachAtmo()` - same "hand-written
  shaders don't get automatic treatment" lesson as phase 3's
  `logarithmicDepthBuffer` chunks, just for fog this time. Added
  `ATMO_FOG_PARS` + a manual `atmoApply()` call in each fragment shader.
- **Two real bugs caught by testing immediately, both loud/visible this
  time (not silent like phase 3's landmine)**:
  1. `ATMO_FOG_PARS` doesn't declare `uAtmoFogColor` (that uniform is only
     auto-wired for built-in materials via three's own `fogColor`); a
     custom shader must declare it itself. Missed on the first pass in
     water.js, caught immediately by `tools/verify.mjs` as a real GLSL
     compile error (`'uAtmoFogColor' : undeclared identifier`) - fixed by
     adding the declaration explicitly, same as weather.js's cloud deck
     already did correctly.
  2. `SpriteMaterial`'s stock shader includes the `fog_vertex` chunk but
     has no `transformed` variable (a different vertex construction than a
     Mesh) - would have been a GLSL compile error for the waterfall mist
     sprites. Caught by reading three.js's own `sprite.glsl.js` source
     *before* running anything (the reference project's own code comments
     flag this exact gotcha for Sprite/Points materials) - fixed
     preemptively by setting `fog: false` on the mist `SpriteMaterial`,
     same opt-out the reference uses.
- **A third, much harder bug: the 'day' (midday) preset's sky rendered as
  flat clipped white**, no blue at all, while dawn/golden/dusk/night all
  looked right immediately. Not a wiring mistake - confirmed by sampling
  actual rendered pixel colors (via `fast-png`-decoded screenshots, not
  just eyeballing) that even the *reference project's own exact* midday
  numbers (`sunElev 38, turbidity 6, rayleigh 1.8, exposure 0.62`) clip to
  white in our setup. Root cause not fully pinned down: three.js's Sky
  addon (Preetham model) turns out extremely sensitive to sun elevation
  once the sun gets high (its `vSunE` term is exponential in elevation),
  and neither lowering exposure (tried down to 0.1), lowering turbidity,
  nor raising rayleigh reliably pulled it back below clipping in a way
  that stayed visually distinct from "golden hour." Settled for a lower
  midday sun elevation (25° instead of a realistic ~40°+) that stays in a
  well-behaved range. **Confirmed 2026-07-31 in the user's real browser:
  midday sky reads as blue, correctly** - the flat-white result really was
  a SwiftShader (headless/software GL) precision artifact in a shader this
  full of `exp()`/`pow()` chains, not a true rendering result. Worth
  remembering for any future shader-heavy work in this project: headless
  Playwright/SwiftShader has now been wrong twice (this, and phase 3's
  ~5fps-vs-real-30fps frame rate number) - trust it for console-error/
  crash detection, not for judging actual visual brightness or performance.
- Added a small DOM control panel (`#env-controls`, bottom-left of
  `index.html`): a range slider (`#env-time`) for time-of-day, a `<select>`
  (`#env-weather`) for weather mode. Wired in `main.js`.
- Verified with `tools/verify.mjs` (zero console/page errors after the two
  fixes above) plus manual screenshot inspection at all 5 presets and all
  4 weather modes (cloud deck visibly drifts/shadows the terrain, rain
  reads as streaks, snow as flakes, storm/snow visibly greys out the whole
  scene) - real memory of this: screenshots were taken by scripting the
  DOM slider/select via Playwright's `page.evaluate()` + dispatching
  `input`/`change` events, not by adding anything permanent to the app.

### Open questions (non-blocking)
1. **Midday preset's sky brightness - RESOLVED 2026-07-31**, confirmed
   correct (blue sky) in the user's real browser - see above, was a
   headless/SwiftShader-only artifact.
2. Previously-open items (Piemonte DTM/VDA license verification, basemap/
   orthophoto source, `waterway=stream`/glacier relations not fetched,
   waterfall ribbons being a visual approximation) all still stand
   unchanged - see the 2026-07-30 section below.

### Next steps (not yet started)
1. Phase 5 (navigation aids: compass HUD, live position readout) or
   finishing phase 1's deploy - neither started, whichever the user wants
   next.

## Status as of 2026-07-30 (historical)

**Phase 3 (water & animation) done, confirmed in a real browser.** Lakes
(198, ≥20m across), rivers (10 segments, main watercourses only), glaciers
(47 footprints), and 3 hand-curated waterfalls (Cascate di Lillaz, Cascata
Entrelor, Cascata Biolet) render over the terrain with shader-animated
ripple/flow and breathing mist sprites - all scoped to the real park
boundary except waterfalls (see below). Getting here took three real,
silent bugs found only via an actual browser (a user screenshot, then
Playwright once installed) - `npm run build` and Node-side testing caught
none of them. See "the three real bugs" below before trusting a green
build on any *future* WebGL/shader work in this project either.

**Later the same day: the long-standing Piemonte DEM gap is closed.** The
user asked to fix it right after phase 3 shipped (building water made the
cost of deferring it concrete - 131/198 lakes had corrupted water levels
from it). Real before/after: trails 6→0/73 `dataIncomplete`, POI 197→1/370,
lakes 131→0/198 (water levels now real, e.g. Lago Serrù 292.2m→2331.8m),
rivers 4→0/10, glaciers 22→3/47. See "Closing the Piemonte gap" below and
`docs/ARCHITECTURE.md` §3 for the full story (3-source priority mosaic,
not a single replacement dataset).

### Done since 2026-07-28
- **Sized the real data before building anything**: live Overpass queries
  against our actual bbox, cross-checked against the real park boundary
  (`tools/park-boundary.geojson`) - lakes 1517 region-wide -> 211 in-park
  (198 after dropping sub-20m ponds), rivers 125 -> 10 segments (7 named:
  Savara, Grand Eyvia, Valnontey, Forzo, Urtier, Soana, Valleile),
  glaciers 216 -> ~47, `waterway=stream` 8,369 region-wide (excluded, see
  scope-cut below).
- **Found a real gap, same shape as the missing-Rifugio-Vittorio-Emanuele-II
  precedent**: only 1 waterfall node falls inside the *strict* park
  boundary polygon (`Cascatone dell'Umbrias`), and it sits in the known
  DEM nodata gap (fake ~292m elevation) - so the strict point-in-polygon
  rule used for POI/trails would leave phase 3 with zero usable
  waterfalls. **Cascate di Lillaz** - the one waterfall
  `docs/ARCHITECTURE.md` names explicitly - sits just 36m outside the
  boundary; checked every other named, non-nodata candidate in
  `tools/osm-poi-draft.json` and found a clean cutoff: Cascata Entrelor
  (50m) and Cascata Biolet (180m) are the same real cluster near
  Cogne/Valnontey, everything else is 3.2km+ away (Pila, Rutor, Mascognaz
  - different valleys/massifs entirely). **User's decision**: hand-curated
  allowlist of those 3, bypassing the strict boundary test for waterfalls
  only - confirmed via `AskUserQuestion` before building, along with two
  other scope decisions (see below).
- **User's other two decisions** (also confirmed before building): fetch/
  render `waterway=river` only, not the 8,369-way `waterway=stream`
  network (performance/clutter, §10 - revisit later if more hydrographic
  detail is wanted); custom lightweight water shader (transparent +
  time-scrolled noise ripple + fresnel), not three.js's `Water` addon
  (real render-to-texture reflection - a real per-instance GPU cost that
  risks §10's fluidity principle with up to ~200 lakes potentially visible
  at once).
- Wrote `tools/fetch-hydrology.mjs` (Overpass -> `tools/hydrology-draft.json`,
  same shape as `fetch-osm.mjs`) and `tools/build-hydrology.mjs`
  (boundary filter + elevation + waterfall-ribbon marching ->
  `public/data/water.json`) - see `docs/ARCHITECTURE.md` §4 for the full
  pipeline description.
- **Waterfall ribbon algorithm needed a real fix mid-build**: the first
  version stopped marching downhill on "slope flattens for N steps," which
  doesn't distinguish reaching the valley floor from just climbing back
  out the other side of the gorge - caught by inspecting Cascate di
  Lillaz's actual output (a nonsensical -4.8m net "drop"). Fixed by
  tracking the running minimum height and trimming the ribbon to that
  point (stop once we've climbed `WF_CLIMB_MARGIN_M` above the lowest
  point seen, then cut any climbing tail) - now gives real, monotonic-ish
  drops (Lillaz 15.5m, Entrelor 83.1m, Biolet 52.1m).
- Wrote `src/water.js`: one merged draw call each for lakes/rivers/
  glaciers (§10 instancing principle, same as `trails.js`), bespoke
  per-waterfall ribbon + mist sprite for the small hand-curated list
  (adapted from reference project ode-to-yosemite's waterfall technique -
  fetched and read its actual `waterfalls.js` via GitHub's raw content API
  to confirm the approach before adapting it). All animated materials
  share one `{ value: 0 }` time uniform object, updated once per frame
  from a new `THREE.Clock` in `main.js` - no per-object clocks.
- Wired into `src/main.js`: `loadWater()` alongside `loadTrails()`/
  `loadPOI()`, `update(t)` called in the render loop. Also fixed a latent
  small credits-overlay duplication: POI and water are both OSM/ODbL, so
  both now write to the same `creditLines.osm` key instead of showing the
  same attribution line twice.
- **The three real bugs** (all invisible to `npm run build`/Node-side
  testing - every one only surfaced via an actual browser):
  1. **Custom `ShaderMaterial` + `logarithmicDepthBuffer: true` (main.js's
     renderer) is silently invisible, with zero console output.**
     Three.js's built-in materials (terrain/trails/POI all use those) get
     the logarithmic-depth GLSL chunks injected automatically; a
     hand-written `ShaderMaterial` doesn't, so it writes ordinary linear
     depth into a buffer everything else reads as logarithmic - it
     depth-tests as "behind" the opaque terrain almost everywhere. No
     shader compile error, no warning, nothing - the lake/river/waterfall
     meshes were being added to the scene and built correctly (verified in
     a Node simulation of `src/water.js`'s own logic) and just never drew
     a pixel. Only found because the user sent an actual screenshot
     showing terrain/trails/POI but no new water features. Fix: add
     `#include <logdepthbuf_pars_vertex>`/`<logdepthbuf_vertex>` and the
     `_fragment` pair to any future hand-written `ShaderMaterial` in this
     project too, not just built-in materials.
  2. **That fix's own `#include <logdepthbuf_vertex>` chunk calls
     `isPerspectiveMatrix()`, which lives in the `common` chunk** - not
     included automatically for a custom `ShaderMaterial`. This *did*
     throw a real, visible error (`THREE.WebGLProgram: Shader Error ...
     'isPerspectiveMatrix' : no matching overloaded function found`), but
     only in the browser console - installed Playwright specifically to
     see it (`npm install -D playwright`, chromium via
     `npx playwright install chromium`, no `--with-deps` - that needs
     sudo/a password prompt and wasn't necessary here). Fix: add
     `#include <common>` alongside the logdepthbuf chunks.
  3. **Lake water level (`waterLevelM` = min of sampled shoreline
     elevation) was getting corrupted by the known DEM nodata gap** (§3 -
     the Piemonte side has no real elevation, sampled as a fake ~292m
     floor): a single shoreline vertex touching that gap would win the
     `Math.min()` and sink the *entire* lake to 292m, even lakes mostly on
     the real (VDA-side) data. Found by inspecting actual output, not by
     inspection of the code - 131 of 198 lakes (66%!) had `waterLevelM`
     exactly 292.2, including real named lakes (Lago Serrù, Teleccio,
     Nero, Valsoera...). These specific lakes turned out to be genuinely
     *entirely* within the Piemonte gap (Val Orco/Ceresole Reale, a real
     place, just outside VDA) so no fix restores them - they're correctly
     `dataIncomplete: true` and this is the same already-accepted
     limitation as trails/POI, not new. But `tools/build-hydrology.mjs`'s
     `waterLevelFor()` now computes the min over only the non-nodata
     vertices first, falling back to the full (unreliable) min only if a
     lake never leaves the gap at all - so lakes that merely *touch* the
     gap edge on one side no longer get sunk to a fake floor.
  - **Playwright is now a permanent tool, not just an ad-hoc debug aid**:
    promoted the ad-hoc scripts into `tools/verify.mjs` - the slot
    `docs/ARCHITECTURE.md` §4 already reserved for this
    ("verify.mjs (optional)"). Loads a running dev/preview server,
    reports console errors/page errors, saves a screenshot
    (`tools/verify-screenshot.png`, gitignored). Confirmed all 4 water
    feature types render correctly and in the right place by flying the
    camera to specific known features (Lago Djouan, a river segment, one
    of the 3 waterfalls incl. its mist sprite, Ghiacciaio del Tzasset) via
    a temporary `window.__debug` hook in `main.js`, since removed.

### Done: closing the Piemonte DEM gap
- **Researched real, live sources rather than assuming** - see
  `docs/ARCHITECTURE.md` §3 for the full writeup. Confirmed via
  `AskUserQuestion` before building: try Regione Piemonte's own 5m LiDAR
  DTM (WCS) first, fall back to TINITALY where it doesn't reach (the
  highest glaciated peaks - verified by a live test query returning 0%
  valid there); and increase the shipped heightmap's resolution rather
  than keep today's, since the user explicitly accepts the two sides
  ending up at different quality.
- **A resolution reality check changed the plan mid-flight**: the
  *shipped* heightfield was already only ~41 m/px (`MAX_DIM=2048`
  discarding 4× of the VDA source's own real 10m/px detail) - my first
  instinct ("~5m combined") would have meant a ~650 MB binary against a
  ~76 MB total-asset reference point (§9). Landed on `MAX_DIM=4096`
  (~20m/px, ~18.4 MB) instead - a real 2× improvement, sane budget.
- Wrote 3 new scripts in `tools/dtm-source/`: `fetch-piemonte-dtm.sh`
  (automated WCS fetch, tiled to respect the server's `MAXSIZE=2048`),
  `fetch-tinitaly.sh` (also fully automated in the end - the download page
  looks like a manual browser tile-picker, but its tiles turned out to be
  plain unauthenticated files at a predictable URL, found by reading the
  tile-index image's real UTM32N gridlines rather than guessing a naming
  scheme), and `merge-heightmaps.sh` (priority-composites all 3 sources
  with `gdal_merge.py`, VDA > Piemonte > TINITALY, best real value per
  pixel).
- **Two real bugs caught mid-build, neither from just re-reading the
  script**:
  1. Used the wrong `-srcnodata` (`-99`, the WCS's raw sentinel) when
     realigning the Piemonte GeoTIFF - it had already been normalized to
     `-9999` by the fetch step, so bilinear resampling blended real
     elevations with the *unrecognized* `-9999` literal near coverage
     edges, producing nonsense like -9838m. Caught by inspecting output
     stats (`STATISTICS_MINIMUM=-9808`), not by re-reading the script.
  2. The merge's own safety check (fail if real nodata remains) fired at
     "only 87.83% valid" - looked like a failure, but investigating *where*
     (a small Node script sampling the raster against the real park
     boundary polygon, not the oversized bbox) found only **0.007%** of
     the actual park still gap-affected; the rest is the bbox's western
     margin toward France, which no Italian source can or should fill.
     Promoted that investigation into `tools/dtm-source/
     check-park-coverage.mjs` - it's now the merge script's real hard
     gate, replacing a naive whole-bbox percentage check that would have
     failed forever on an unfixable, irrelevant number.
- **Re-running the downstream pipeline needed more than the obvious
  step**: `tools/build-poi.mjs` alone left POI's `dataIncomplete` count
  completely unchanged (still 197/370) after the heightfield swap -
  because it only filters an already-computed draft; the actual elevation
  sampling happens in `tools/fetch-osm.mjs` (same split for
  `tools/fetch-hydrology.mjs`/`build-hydrology.mjs`). Re-ran both fetch
  scripts first, *then* the build scripts - real before/after counts in
  the top summary above.
- Verified visually too (`tools/verify.mjs` + the `window.__debug`
  fly-to technique, same as phase 3): Lago Serrù now renders as a real,
  correctly-shaped lake at a real elevation (was flat fake plain);
  Ghiacciaio del Tzasset's real terrain relief is visible behind it.
- Wired the one source with a confirmed attribution (TINITALY, CC BY 4.0)
  into the `#credits` overlay (`src/main.js`) - VDA's and Piemonte's exact
  license strings are still unverified TODOs (see Open questions), so
  showing a placeholder to real users would be worse than omitting them
  for now; `loadTerrain()`'s credits logic filters on `source.attribution`
  being present, so this fills in automatically once verified.

### Open questions (non-blocking)
1. **Basemap/orthophoto source** for later imagery draping (phase 6/7) —
   not needed until then.
2. **DEM coverage gap for the Piemonte side - RESOLVED 2026-07-30**, see
   "Done: closing the Piemonte DEM gap" above and `docs/ARCHITECTURE.md`
   §3. A tiny residual (0.007% of the real park, 3/47 glaciers still
   `dataIncomplete`) remains at the very highest peaks where even
   TINITALY has no data - not worth chasing further absent a 4th source.
2b. **VDA's and Piemonte's exact DTM licenses are still unverified TODOs**
   (TINITALY's is confirmed, CC BY 4.0, already in the credits overlay).
   Piemonte's WCS capabilities say "fees NONE / accessConstraints NONE"
   but the precise required attribution string needs checking against the
   geoportale.piemonte.it metadata record before shipping publicly - check
   before deploy (§9's "TODO" list already flagged this for VDA).
3. **`waterway=stream` and `natural=glacier` multipolygon relations are
   not fetched at all** (phase 3 scope cut, see Done above) - revisit if
   more hydrographic/glacier detail is wanted later. Not a bug, a
   deliberate v1 boundary.
4. **Waterfall ribbons are a build-time visual approximation** (terrain-
   driven marching from the brink point via `tools/build-hydrology.mjs`),
   not a hydrological simulation - fine for this project's goals, but
   don't mistake `dropM`/the ribbon shape for surveyed waterfall data.
5. Deferred `docs/ARCHITECTURE_SUGGESTIONS.md` items - see the
   2026-07-28 section below, still applies unchanged.

### Next steps (not yet started)
1. **Frame rate while flying across the whole map with water added**
   (§10's real bar) - rendering correctness is confirmed (see Done
   above), but nobody has specifically watched frame rate with all ~250
   new water features live at once yet.
2. Phase 4 (environment: time-of-day slider, weather states) per
   `docs/ARCHITECTURE.md` §7, or finishing phase 1's actual deploy -
   neither started, pick whichever the user wants next.

### How to resume
Read `docs/ARCHITECTURE.md` for the full plan and rationale, then this
file for exact status. `npm run dev` renders terrain + trails + POI (see
the 2026-07-28 section below) plus the new water layer (`src/water.js`):
lakes/rivers/glaciers/waterfalls with shader-animated ripple/flow/mist -
confirmed rendering correctly in a real browser (see "the three real
bugs" above). `node tools/verify.mjs` (needs a running dev/preview
server) is now a standing way to catch console errors and grab a
screenshot without a manual round-trip through the user.

## Status as of 2026-07-28 (historical)

**Phase: 2 — fully complete (trails + POI, both scoped to the real park
boundary).** Real GPU-displaced terrain (phase 1) renders correctly; an
actual deploy (GitHub Pages or self-managed Apache, §9) is the only
phase-1 item left, not blocking. 73 numbered/graded trails (down from
1130 - only ones actually inside the park, per user request) render over
the terrain, difficulty shown via line style (solid/dashed/dotted/
ferrata-ticks, not color - user request), with real computed elevation
and a working CC BY 4.0 credits overlay. 370 POI (peaks/huts/passes/
waterfalls/lakes) from OSM, also filtered to the real park boundary (not
the oversized DEM bbox) since the full 2,421-candidate draft was too
large to hand-curate - click a marker for an info panel + fly-to camera.
**Found a significant DEM data gap while building trails (see
below)**: ~25% of the map (the Piemonte side of the park) has no real
elevation data - accepted as a known limitation for now, per the user.
Next: phase 3 (water) or the phase-1 deploy, neither started yet.

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
  bbox ÷ image dimensions gives **10.0005 m/px (E-W) and 9.9990 m/px (N-S)**
  (corrected 2026-07-28 — an earlier note here had the E-W figure wrong,
  9.9995; `tools/process-heightmap.mjs` computes this directly now instead
  of relying on hand arithmetic), not the uniform 10 m/px declared in
  `DEM/pngp_heightmap_meta.json` (artifact of how `gdalwarp -te`+`-tr`
  rounds pixel counts). Also spotted
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
- **Wrote `tools/process-heightmap.mjs`**, resolving most of open question
  #3's deferred items now that they were actually needed:
  - **Height encoding (#1)** — asked the user directly since this had real
    trade-offs; confirmed: one raw Uint16 binary (`public/data/
    heightfield.<hash>.bin`), used both to build the GPU displacement
    `THREE.DataTexture` and for CPU height queries, instead of a PNG.
    Reason: browsers always decode PNGs at 8 bits/channel through the
    canvas pipeline regardless of source depth — `TextureLoader` on a
    16-bit PNG would've silently quantized to 256 levels. Documented in
    `docs/ARCHITECTURE.md` §4.
  - **Found a real bug while implementing this**: `sharp` (tried first)
    silently truncates this exact file's 16-bit grayscale data to 8 bits
    on raw extraction — caught by cross-checking against `gdalinfo -stats`
    and Python/PIL (both correctly show the full 0–65535 range). Switched
    to `fast-png`, which decodes it correctly (verified byte-for-byte
    range match). Worth remembering if any future script reaches for
    `sharp` on this or similar 16-bit single-channel PNGs.
  - **Resolution precision (#2)** — the script now computes real per-axis
    resolution directly from bbox ÷ dimensions rather than trusting a
    nominal value (see the corrected note above).
  - **Local origin/axes (#5)** — decided and documented in
    `docs/ARCHITECTURE.md` §6: origin = bbox center (EPSG:23032), axes
    `+X=East, +Y=Up, +Z=South` (the right-handed mapping consistent with
    real-world ENU under Three.js's Y-up convention — not arbitrary).
  - **Manifest convention (#4) + provenance (#11)** — `heightfield.json`
    carries schema version, CRS, bbox, local origin, axes, real
    resolution, **pixel convention** (see next bullet), row orientation,
    elevation scale formula, encoding, a content hash (`heightfield.
    <hash>.bin` — re-running with unchanged input reproduces the same
    hash byte-for-byte, confirmed by running it twice; stale hashed files
    get cleaned up automatically), and source provenance. DEM license
    itself is still unverified (flagged as a TODO in the manifest — don't
    assume it's CC BY 4.0 like the trail dataset without checking).
  - **Caught and fixed my own bug while writing the corner round-trip
    check** (the exact kind of validation `docs/ARCHITECTURE_SUGGESTIONS.md`
    #2/#10 asked for): the resampler initially used align-corners index
    mapping, but the source data is pixel-is-**area** (GDAL `-te`/`-tr`
    convention — pixel centers, not point samples at grid corners).
    Fixed to a half-pixel-center bilinear resample and added a
    `pixelConvention` field to the manifest documenting this explicitly,
    so it doesn't have to be reverse-engineered later.
  - Downsamples the native 8388×4823 heightmap to a configurable max
    dimension (default 2048, `--max-dim` flag) — full native resolution
    is ~81 MB raw, both too large for the asset budget (§9) and for
    typical GPU max-texture-size limits (`docs/ARCHITECTURE_SUGGESTIONS.md`
    #3); real tiling/LOD is still deferred to the phase-1 terrain
    renderer decision, this is just a workable single-texture MVP size.
  - Ran it: outputs `public/data/heightfield.7ac118fb.bin` (4.60 MB) +
    `heightfield.json`. Verified independently (not just trusting the
    script's own printout): file size matches width×height×2 exactly,
    reconstructed elevation range ≈ 292–4805 m (consistent with the source's
    292.2–4809.8 m — the couple-meter difference is expected, downsampling
    smooths the single most extreme peak/valley pixel).
- **Wrote `src/geo.js` and `src/terrain.js`, replacing `main.js`'s
  placeholder cube with the real GPU-displaced terrain.**
  - `geo.js`: the shared world↔local conversion module decided in §6
    (bbox-center origin, `+X=East/+Y=Up/+Z=South`), so this math has
    exactly one home going forward.
  - **Hit the exact risk flagged when choosing the height encoding, and
    caught it immediately rather than shipping it**: a single-channel 16-bit
    `THREE.DataTexture` (`RedFormat`/`UnsignedShortType`) needs the
    `EXT_texture_norm16` WebGL extension, which **Firefox doesn't support at
    all** (checked via caniuse — not a Safari-only gap as I might have
    assumed). Reproduced the failure directly rather than trusting the
    caniuse table alone: real `texStorage2D`/`texSubImage2D` WebGL errors
    and a completely flat, un-displaced terrain when tested against a
    WebGL2 context lacking the extension (this project's headless test
    browser, SwiftShader, happens to lack it too — useful, since it forced
    the issue immediately instead of only surfacing on a future user's
    Firefox). Switched to packing each 16-bit height sample across two
    8-bit channels (R=high byte, G=low byte) in an `RGFormat`/
    `UnsignedByteType` texture (`RG8` - core WebGL2, always filterable,
    no extension), with the vertex shader patched via
    `MeshStandardMaterial.onBeforeCompile` to reconstruct
    `(r*256+g)/257` from the two channels. This is exact (not an
    approximation) because linear interpolation distributes over that
    split - hardware bilinear-filtering R and G independently and
    recombining afterward gives the same result as filtering the true
    16-bit value would. Updated `docs/ARCHITECTURE.md` §4 with the
    corrected approach and the reasoning above.
  - **Found and fixed a second bug via the same instinct**: my first
    orientation attempt assumed `DataTexture`'s default `flipY=false` was
    fine; a raycaster-based verification attempt (against the *displaced*
    mesh) returned all zeros first - turned out GPU vertex-shader
    displacement never touches the CPU-side geometry Three.js's `Raycaster`
    reads, so that approach couldn't have worked regardless of
    orientation (a real limitation of "GPU-displaced, not a literal CPU
    mesh," §4 - worth remembering before reaching for raycasting against
    this terrain again; `sampleHeight()` in `terrain.js` is the correct
    way to query height, always). Verified properly instead: rendered the
    reconstructed height as an unlit top-down grayscale image and compared
    it directly against the source heightmap PNG - initially confirmed the
    *shape* matched, then specifically checked orientation by placing
    colored markers at known compass directions and at the real Mont Blanc
    coordinates (computed independently in Node from the manifest, not
    from the render) — all landed exactly where real-world geography says
    they should (Mont Blanc in the NW, matching docs/ARCHITECTURE.md §3).
    This confirmed `texture.flipY` needed to be explicitly set `true`
    (overriding `DataTexture`'s default) since row 0 = north in the data
    but V=0 = south on the rotated plane geometry - documented in
    `terrain.js` directly so this doesn't have to be re-derived later.
  - Renderer: added `logarithmicDepthBuffer: true` (the scene spans tens
    of km, §6 flagged plain depth-buffer precision as a risk at this
    scale) and basic `THREE.Fog` for depth cueing (satisfies phase 1's
    "simple sky/fog", §7).
  - Mesh resolution for now: 256×~147 segments (aspect-matched to the
    heightfield) - a single tile, not yet quadtree/LOD (open question
    below still tracks that decision for later, once profiling data
    exists).
- **Simulated static hosting locally** (user asked specifically, ahead of
  an actual Vercel deploy): `npm run build` + `vite preview` serves the
  real production bundle, not the dev server - verified headlessly
  (screenshot + console/network check), identical render to dev.
  - **Also tested serving the build from a sub-path** (`/pngp-viewer/`
    via a plain `python3 -m http.server`, simulating GitHub Pages'
    `user.github.io/repo/` layout) since `vite.config.js`'s `base: './'`
    was specifically chosen for that case (§9) - this caught a real bug:
    `terrain.js` fetched `/data/heightfield.json` (root-absolute), which
    404s under a sub-path. `base: './'` only rewrites Vite-injected asset
    URLs (the script tag), not manual `fetch()` calls. Fixed by resolving
    against `import.meta.env.BASE_URL` instead (Vite's own mechanism for
    exactly this), re-verified under the same sub-path setup - no more
    404s, terrain renders correctly. Worth remembering: any future
    `fetch()`/`new URL()` against `public/data/*` must go through
    `BASE_URL`, a root-absolute path will quietly break under any
    non-root deploy.
- **Started phase 2: trails.** Ran `tools/trails-source/fetch-trails.sh`
  for real (previously only written/tested conceptually) - 1130
  `sentieri` features within our bbox, 309,294 total coordinate points.
  - Refactored `terrain.js`'s CPU height-sampling into standalone
    `src/heightfield.js` (pure functions, no THREE/fetch/DOM) so it can be
    imported from both the browser runtime and `tools/build-trails.mjs`
    (Node) - one implementation of "raw sample -> real elevation", not two
    that could drift apart.
  - Wrote `tools/build-trails.mjs`: converts each trail's coordinates to
    local scene meters (via `src/geo.js`) and computes real elevation by
    sampling our own heightfield - deliberately not the source's own
    dislivello-adjacent fields (`sen_tota_1..6`), which are ambiguous,
    undocumented in the metadata PDF, and risky to guess at (e.g. one
    plausibly reads as a time-in-minutes field, not a distance).
  - **Found and fixed a real bug via a cross-check against the source's
    own start/end elevation fields** (`sen_quota_`/`sen_quota1`): about
    45% of trails (514/1130) have their geometry stored in the *opposite*
    direction from their labeled start/end - confirmed on a specific case
    ("Chanté - Mont Saron") where the geometry's first point matched the
    *end* label almost exactly (diff ~11m) and the last point matched the
    *start* label (diff ~4m). Fixed by detecting whichever direction fits
    best against the labels and reversing when needed, so `lines` always
    runs start→end and `elevGainM`/`elevLossM` mean what their names say.
  - **This cross-check then surfaced a much bigger finding**: a cluster of
    trails were "falling" to ~292m (our heightfield's minimum) at high-
    mountain locations (e.g. "Col Rosset", real elevation ~3025m). Traced
    to the actual pixel data: **24.8% of all pixels in
    `DEM/pngp_heightmap.png` are exactly value `0`** - a nodata sentinel
    never explicitly declared anywhere in the pipeline (confirmed already
    present in the native-resolution source, not introduced by our own
    downsampling). Masked and visualized `value == 0` across the whole
    image - the resulting shape is a near-exact match for Valle d'Aosta's
    real administrative boundary. The source DTM (`DTM0508_002_UNICO`, a
    *Regione Autonoma Valle d'Aosta* dataset) simply has no data outside
    VDA - and **Gran Paradiso National Park straddles VDA and Piemonte**,
    so the Piemonte side of the park (~25% of our bbox) has been rendering
    as a flat fake plain since phase 1, not real mountains. This also means
    the documented `elevMin` (292.2356m) is very likely the nodata floor,
    not a real valley elevation.
  - **Surfaced this to the user before continuing** (this affects
    already-shipped terrain, not just the new trails work) with the
    masked-region image as evidence. **User's decision: accept the
    limitation for now, don't block on it** - continue with trails/POI
    using the data as-is, rather than sourcing additional DTM coverage
    first. Documented as a known, tracked limitation in
    `docs/ARCHITECTURE.md` §3/§12, not silently absorbed.
  - Added `isNearNoData()` to `src/heightfield.js` and used it in
    `build-trails.mjs` to flag affected trails (`dataIncomplete: true`,
    39 of 1130) rather than silently shipping wrong elevation figures for
    them. A further ~63 trails show large start/end mismatches not caught
    by that flag - spot-checked several (e.g. "Col du Grand-Saint-Bernard
    - Col Fenetre Durand", "Fontainemore - Mont Mars") and they're
    cross-border routes where VDA's own geometry stops at the region
    boundary while the label still names the true destination beyond it -
    same root cause, different symptom. Not chased further individually
    given the underlying cause is already understood and accepted.
  - Output: `public/data/trails.json` (7.8 MB, 1130 trails, single file -
    not content-hashed like the heightfield, a deliberate simplification
    for now since it's self-describing JSON rather than raw bytes needing
    external metadata). No line simplification needed - 309K points at
    ~20m average spacing turned out to be a reasonable size as-is once
    excess property fields and coordinate precision were trimmed (16MB
    source GeoJSON -> 7.8MB), so `docs/ARCHITECTURE.md` §10's anticipated
    "spatial chunking + line simplification" wasn't needed for phase 2.
  - Wrote `src/trails.js`: loads `trails.json`, merges all 1130 trails
    into one `THREE.LineSegments` draw call per line **style** (not 1130
    draws) - directly applying §10's instancing principle to line
    geometry. Lifted 3m above the terrain surface to avoid z-fighting
    against the GPU-displaced mesh (the CPU-sampled trail elevation and
    the GPU-displaced terrain elevation come from the same data but
    different code paths, close enough to z-fight without the offset).
  - **Revised same day, per user request**: difficulty shown via line
    style instead of color (matches real hiking-map convention - a single
    trail color, difficulty read off the pattern). T = solid
    (`LineBasicMaterial`), E = dashed, EE = dotted (both
    `LineDashedMaterial`, different dashSize/gapSize ratios - confirmed
    `LineSegments.computeLineDistances()` treats a merged multi-trail
    buffer as one cumulative path rather than resetting per trail, which
    only shifts each trail's dash *phase* and is visually inconsequential
    for a repeating pattern, so merging for the single draw call was still
    safe). EEA = a solid base line plus small "x" tick marks every 40m
    (two crossing segments aligned to the local path direction) for the
    via-ferrata/cavo-d'acciaio convention - low-volume enough (10 of 1130
    trails) that per-trail overhead here doesn't matter. Verified with
    close-up screenshots (not just the overview shot) since dash/dot
    patterns are invisible at whole-map zoom: all four styles read
    correctly, ferrata ticks form a clear repeated "x x x x" pattern along
    the path.
  - Added a small always-visible `#credits` overlay (`index.html` +
    `main.js`, populated from `trails.json`'s own `source.attribution`
    field) satisfying the CC BY 4.0 requirement that's been flagged as
    pending since the trail-source decision - done now, not deferred
    further.
  - Verified: build succeeds, headless render shows trail lines following
    plausible valley/ridge patterns across the terrain in the expected
    colors, credits text renders correctly, zero console errors, no failed
    network requests.
- **Started POI (phase 2, part 2)**: asked the user how to source POI
  content rather than inventing a list unilaterally (hand-curated by
  design, `docs/ARCHITECTURE.md` §4). Chose: OSM as the starting draft,
  not just a cross-check as originally scoped.
  - Installed `proj4`, defined `EPSG:23032` explicitly
    (`+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0`), and
    **verified it against the known Mont Blanc summit control point again**
    (same one used to originally confirm the datum, §3): back-projecting
    our heightfield's actual max-elevation pixel lands 20.4 m from the
    published summit coordinates - consistent with the ~15-20 m GDAL-based
    check from the original investigation. This resolves the EPSG:23032↔
    WGS84 half of open question #3's #5 (see below) earlier than
    originally scoped, since OSM data needed it now.
  - Wrote `tools/fetch-osm.mjs`: converts our EPSG:23032 bbox to WGS84 to
    query Overpass, pulls `natural=peak`, `tourism=alpine_hut`,
    `mountain_pass=yes`/`natural=saddle`, `waterway=waterfall`, and
    `natural=water`/`natural=lake` (way/relation centroids via `out
    center`) within it, converts each result back to local scene
    coordinates and samples our own heightfield for elevation - same
    approach as `build-trails.mjs`, same shared `src/geo.js`/
    `src/heightfield.js` modules.
  - **Extra validation for free**: OSM's own `ele` tag for "Gran Paradiso"
    (the peak) is 4061 m; our independently-computed elevation at that
    exact point is 4038.4 m - only 22.6 m off, another data point
    corroborating the whole pipeline (calibration, WGS84 transform, local
    coordinate math) beyond the Mont Blanc check.
  - First Overpass query hit a 406 (wrong headers - fixed: needs a real
    `User-Agent` and form-encoded body, not raw `text/plain`) then a
    transient 504 (server load, succeeded on retry) - both worth knowing
    about if this script needs re-running and seems to fail.
  - Raw result: 3,746 elements (1357 peaks, 40 huts, 724 passes, 108
    waterfalls, 1517 lakes) across the whole bbox - which extends well
    beyond the park into neighboring France/Switzerland border areas
    (e.g. "Lac du Chevril", "Lac de Tignes" showed up - literally in
    France). Dropped 1,325 unnamed elements (can't show a POI with no
    label) -> **2,421 named candidates**, written to
    `tools/osm-poi-draft.json` (772 KB, committed - a working artifact the
    user needs to open and edit, not a disposable build byproduct). 857 of
    2,421 (35%) are flagged `dataIncomplete: true`
    (fall in the DEM nodata gap above) - worth knowing when reviewing,
    though not excluded from the draft.
- **Finished POI**: user said the draft was too large to curate by hand -
  "keep everything that falls within our project" (i.e. the real park,
  not our oversized DEM bbox) instead, categories already chosen were
  fine.
  - Wrote `tools/fetch-park-boundary.mjs`: one-off fetch of the actual
    Gran Paradiso NP boundary from OSM via **Nominatim** (not raw
    Overpass) - Nominatim assembles multipolygon relations into proper
    GeoJSON server-side, sidestepping having to reassemble ways into
    closed rings ourselves (a real, easy-to-get-subtly-wrong geometry
    problem - used the well-tested existing tool instead of reinventing
    it, same instinct as choosing `fast-png`/`proj4` earlier). Result: a
    single clean `Polygon`, 7,857 points, no holes. Saved as a static,
    committed `tools/park-boundary.geojson` (165 KB) - no network call
    needed by the regular build, unlike the trail/POI datasets that
    benefit from re-fetching. This also resolves
    `docs/ARCHITECTURE_SUGGESTIONS.md` #6 (verify against the real park
    boundary) - see open questions below for what that turned up.
  - Installed `@turf/boolean-point-in-polygon` + `@turf/helpers` (chose an
    established geometry library over hand-rolling point-in-polygon, same
    reasoning as above).
  - Wrote `tools/build-poi.mjs`: filters `tools/osm-poi-draft.json` to
    points falling inside `tools/park-boundary.geojson` -> `public/data/
    poi.json`. **Verified the filter itself against two independent
    control points** before trusting it on real data: the Gran Paradiso
    peak (the park's own namesake) lands inside, Mont Blanc's summit
    (correctly, a different massif) lands outside. Result: 2,421 -> 370
    POIs (205 peaks, 116 passes, 44 lakes, 4 huts, 1 waterfall).
  - **Noted a real OSM data-completeness gap while reviewing hut results**:
    only 4 huts fell inside the park, and Rifugio Vittorio Emanuele II -
    arguably the park's most famous rifugio - doesn't show up under
    `tourism=alpine_hut` or in a direct Nominatim name search at all. Not
    chased further (the user's instruction was to stop hand-curating, not
    to start manually patching OSM gaps) but flagged in
    `docs/ARCHITECTURE.md` §4 in case it matters later.
  - Wrote `src/poi.js`: one `THREE.InstancedMesh` draw call per category
    (5 total, colored spheres) - same instancing principle as trails.
    Click handling in `main.js`: raycasts against all category meshes,
    picks the closest hit across all of them (not just the first mesh
    that happens to intersect - an easy mistake with multiple pickable
    meshes), shows a name/category/elevation info panel (`#poi-info` in
    `index.html`, warns if `dataIncomplete`), and flies the camera toward
    the clicked POI via a simple eased lerp of both `camera.position` and
    `controls.target` each frame.
  - **Bug avoided by checking OrbitControls' source before assuming**: was
    about to skip calling `controls.update()` during the fly-to animation
    (based on an earlier, different debug-camera episode where manual
    position changes seemed to need that). Actually reading
    `OrbitControls.js` showed `update()` re-derives its internal spherical
    state from the camera's *current* position every call rather than
    caching stale state - so driving `camera.position`/`controls.target`
    directly each frame and still calling `controls.update()` normally
    works fine, no special-casing needed. Simpler code as a result.
  - Added the ODbL attribution (`© OpenStreetMap contributors`, required
    for OSM data, docs/ARCHITECTURE.md §9) to the same `#credits` overlay
    used for the trails' CC BY 4.0 line - `main.js` now tracks credit
    lines in a small keyed object so multiple sources can each contribute
    a line without overwriting one another.
  - Verified end-to-end with a real (simulated) click: projected a known
    POI's world position to screen space, clicked there, confirmed the
    info panel populated with the correct name/category/elevation and the
    camera actually moved (position changed, screenshot shows a
    significantly closer view of the marker cluster afterward) - not just
    "no console errors."
- **Scoped trails to the real park boundary too**, per explicit user
  request (same treatment as POI). Updated `tools/build-trails.mjs`:
  converts `tools/park-boundary.geojson`'s ring to local scene coordinates
  once (cheaper than converting every trail point to WGS84 - same
  `@turf/boolean-point-in-polygon` approach as `build-poi.mjs`, just done
  in local-coordinate space instead of lat/lon space), then keeps a trail
  (whole, not clipped to the boundary) if any of its points fall inside.
  1130 -> **73 trails**, matching the 7.1%-inside figure already found
  while resolving `docs/ARCHITECTURE_SUGGESTIONS.md` #6 - so this wasn't a
  new computation, just applying that same filter as the actual output
  now. `public/data/trails.json` shrank from 7.8 MB to 654 KB. Verified
  visually: rendered trail lines are now clustered in the park area,
  matching where the POI markers already cluster, instead of spread across
  the whole DEM bbox. This closes the open question from last session
  about whether to do this.

### Open questions (non-blocking)
1. **Basemap/orthophoto source** for later imagery draping (phase 6/7) —
   not needed until then.
2. **DEM coverage gap - Piemonte side of the park has no real elevation
   data** (~25% of the bbox, see Done above and `docs/ARCHITECTURE.md`
   §3/§12). Accepted as a known limitation 2026-07-28, not blocking -
   revisit by sourcing a Piemonte-side or national DTM (TINITALY/
   Geoportale Nazionale) to merge in, whenever a priority. Until then:
   `elevMin` (292.2356m) in `heightfield.json` is very likely the nodata
   floor, not a real elevation - don't treat it as one in future work
   (e.g. don't use it as "lowest point in the park" for anything).
3. **Deferred items from `docs/ARCHITECTURE_SUGGESTIONS.md`** still
   pending (don't assume still unresolved without checking the doc first —
   #1, #2, #4, #5's origin/axes half, and #11 were resolved 2026-07-28
   while writing `tools/process-heightmap.mjs`, see Done above):
   - #5's "where the local-coords module lives" is resolved: `src/geo.js`.
   - #3 (tile/LOD contract) is **partially resolved**: `src/terrain.js`
     currently builds a single mesh/single-texture tile (256×~147
     segments, matching the heightfield's aspect ratio) - workable for
     phase 1's whole-map overview, but not yet a quadtree/multi-tile
     system. Revisit before phase 7 if draw-distance/detail needs force
     the issue sooner (§7's wording tension here is now fixed).
   - The other half of #5, EPSG:23032↔WGS84, is **now implemented and
     verified** (`proj4`, `+towgs84=-87,-98,-121,0,0,0,0` — confirmed
     against the Mont Blanc summit control point again: 20.4 m off,
     consistent with the earlier ~15-20 m GDAL-based check) - used in
     `tools/fetch-osm.mjs` to convert OSM's WGS84 to our bbox. Still not
     wired into the runtime app for a compass/position HUD (phase 5) -
     `proj4` is currently a devDependency (build-time only); promote it to
     a regular dependency (or inline just the needed math) when phase 5
     actually needs it client-side.
   - **#6 resolved, 2026-07-28**, now that `tools/park-boundary.geojson`
     exists (fetched for POI filtering, see Done below): checked how much
     of the VDA trail dataset actually falls within the real park boundary
     - only **73 of 1130 trails** (7.1% of all trail points) do. This isn't
     a coverage *gap* exactly - it's that the VDA "Rete Sentieristica" is a
     whole-region network, and Gran Paradiso NP is a relatively small part
     of Valle d'Aosta, so the vast majority of rendered trails are outside
     the park (regionally relevant approach routes, not "missing park
     trails"). Not acted on further: the user asked to scope *POI* to the
     real park boundary but hasn't been asked about scoping *trails* the
     same way - a real, undecided question, not a bug. Flagged as open
     question below.
   - #9 performance budgets and #10 automated pipeline/correctness tests
     were gated on "a running prototype exists" - that's now true (terrain
     renders), so these are available to pick up whenever useful, just not
     done yet (nobody's asked for them specifically).
   - Good practice to keep in mind, no dedicated decision needed: #7 module/
     layer boundaries, #8 runtime failure/fallback behavior.
4. The DEM's own license/attribution (distinct from the trail dataset's
   confirmed CC BY 4.0) is unverified — flagged as a TODO directly in
   `public/data/heightfield.json`'s `source.license` field. Check before
   shipping publicly (§9).

### Next steps (not yet started)
1. Finish phase 1: an actual deploy to whichever the user picks — GitHub
   Pages or self-managed Apache, not Vercel/Netlify (decided 2026-07-28,
   §9). Terrain mesh + camera + fog are done; local static-hosting
   simulation, incl. sub-path serving, is done too (see Done above), so
   what's left is mostly host-specific mechanics (GitHub Pages' build
   action, or Apache vhost/mod_deflate config, §9) rather than app-level
   risk. Real-browser check: done 2026-07-28 - user confirmed the terrain
   renders correctly via `tools/dev/start-dev.sh` + VS Code port
   forwarding, in their own actual browser (not recorded which one - worth
   specifically confirming Firefox if not already, given the encoding fix
   above was about a Firefox-specific gap).
2. **Phase 2 is now fully complete** (trails + POI both done and both
   scoped to the real park boundary, see Done above).
3. Not started: phase 3 (water & animation - rivers/lakes, waterfalls e.g.
   Cascate di Lillaz, glaciers), per `docs/ARCHITECTURE.md` §7. Note
   `tools/fetch-osm.mjs` already has the `waterway=waterfall` category
   fetched (1 fell within the park boundary in `poi.json`, but the raw
   draft has more outside it, and OSM hydrology/rivers/lake polygons
   aren't fetched at all yet - see §4's fetch-osm.mjs entry).

### How to resume
Read `docs/ARCHITECTURE.md` for the full plan and rationale, then this file
for exact status. `npm run dev` renders real GPU-displaced terrain
(`src/terrain.js` + `src/geo.js`) plus numbered/graded trails with
difficulty shown via line style (`src/trails.js`), both verified correct
(not just error-free) -
see Done above before assuming anything about the rendering pipeline needs
re-deriving. POI markers (`src/poi.js`) render too, with click -> info
panel + fly-to-camera; both trails and POI are now scoped to the real
park boundary (`tools/park-boundary.geojson`) - phase 2 is fully complete.
**Important caveat to internalize before touching elevation data**: ~25%
of the DEM (Piemonte side of the park) is a nodata gap masquerading as
real elevation - see open question #2 before trusting `elevMin`/any
"lowest point" claim, or before being surprised that some POIs/trails
there look wrong. Check open question #3 before
terrain-renderer/phase-5/phase-2-trail-contract milestones, there are
specific `docs/ARCHITECTURE_SUGGESTIONS.md` items to revisit at each. Next
up: phase 3 (water/waterfalls) per `docs/ARCHITECTURE.md` §7, or finishing
phase 1's actual deploy - neither started, pick whichever the user wants.

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
