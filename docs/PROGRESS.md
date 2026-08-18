# Progress log

**Read this first at the start of each session. Update it before ending one.**

Three documents, and they answer three different questions:

| | question | when |
|---|---|---|
| **this file** | where is the project, and what do I do next | every session start |
| `docs/ARCHITECTURE.md` | how does it work, and what will bite me | before editing - **§13 is the landmines** |
| `docs/PROGRESS-ARCHIVE.md` | why is it like that, and did we try this already | when you need history, by grepping it |

This file was 6,543 lines on 2026-08-18, which is not a thing anyone reads at the
start of a session. The chronology moved to the archive intact; the landmines
scattered through it were promoted into ARCHITECTURE §13 first, so that the one
part of the log you needed *before* making a mistake is no longer in a file you
open *after*.

## NEXT SESSION: start with the depth, and it needs them at a screen

**State: published, healthy, nothing half-finished.** The working tree is clean, the
fast suite is 10/10, and https://dev-lop77.github.io/pngp-viewer/ serves the whole
park with the credits verified against the CDN. There is no rescue work waiting.

### Start here: the DEPTH half of their own request, which is still untouched

Of the three topics they named, the first one was **two** requests and only one has
been built. Their words when asked which they meant: ***"entrambe, ma nell'ordine"***
- push the aerial perspective first, and judge a depth-of-field pass only if
something is still missing afterwards. The EDGES are done. The DEPTH is not, and
`uAtmoHaze` is exactly where it has always been.

It is first because it is theirs, it is cheap, and **it cannot be decided from a
desk** - it is a looking decision. Open by putting them in front of it, not by
proposing a number.

Facts to start the conversation from, so it does not begin with a measurement:

- The haze is `1 - exp(-d * uAtmoHaze)` with `uAtmoHaze = 1.8e-5` (src/atmosphere.js).
  At 2 km it has taken 4% of the ground, at 10 km 16%, at 30 km 42%, at 60 km 66%,
  and at the map's 102 km diagonal 84%. Whether that is "enough air" is a taste
  question and the whole point of asking them.
- `scene.fog`'s near/far in main.js are DEAD numbers - installAtmosphere() replaces
  the fragment chunk, so only its COLOUR survives. Touching them does nothing, and
  it is a good half-hour to not lose.
- **There is still no post-processing stack**: no EffectComposer, rendered straight
  to screen. A real depth-of-field means introducing one and paying a full-screen
  pass - which is why they were right to want it second.
- Since this morning there are two live knobs worth sweeping in front of them,
  exposed as uniforms precisely so a probe can move them without a rebuild:
  `OUTER_RING_FADE_M` (4000) and `EDGE_FADE_M` (1500) in src/outerring.js. EDGE_FADE_M
  is CONSTRAINED, not free - over ~2.1 km it starts dissolving the park's southern
  tip, and tools/test-outerring.mjs fails if it does.
- Frame rate on real hardware is **no longer an unknown**: they measured it after the
  terrain grew 20% and the glaciers gained half a million triangles, and it is
  unchanged. So a cheap haze change costs nothing to try, and a DOF pass is the only
  thing in this topic with a real price.

### Then, in this order

**3D models for the 45 rifugi and bivacchi.** Long, self-contained, and independent
of everything above. `hutKind` already separates three genuinely different buildings
(`alpine_hut`, `wilderness_hut`, `shelter:basic_hut`) and they must not collapse into
one model. Everything else in this project is procedural geometry authored in JS
(`buildIbex()` and friends), and tools/dev/model-preview.html is the bench for judging
shapes side by side under the app's own light. The open question is what replaces the
marker post and the label once a building stands there.

**Summit crosses on the 252 peaks.** The trap is measured and known: a peak's
`elevationM` is its real altitude and the drawn mesh sits tens of metres below it on a
sharp summit, which is why poi.js plants markers with `sampleRenderedHeight` rather
than the real number. A cross at the true altitude floats. Also worth asking before
building: all 252, or only the ones that really have one?

### Before touching anything

Read **`docs/ARCHITECTURE.md` §13 — Landmines** first. It is fourteen rules that
have each cost real time, and two of them were broken again on 2026-08-18 *after*
being written down: measuring seated geometry with the sampler that seated it, and
believing a test log that only keeps the tail of each run.

Open debts are at the end of this file.

## PUBLISHED (2026-08-18, second publish of the day)

Live at https://dev-lop77.github.io/pngp-viewer/ after the user's "committa e
pubblica questa versione". Pages reported `built` after **224 s** - four times the
usual, because the 5 m tier is now 51.03 MB and the push warns about it (GitHub
recommends under 50 MB; the hard limit is 100, so it is a warning and not a wall,
but it is one to watch).

**Verified against the CDN, not the build.** `heightfield.json` comes back with
`ymin 5027000`, **four sources**, and `liabilityNotice` present - which is the whole
point of the licence work, since that array is what the credits panel is built from.
The credits panel on the LIVE site opens to **7 lines** with the Copernicus notice on
its own, its own licence link (the COP-DEM-30 PDF, not CC BY 4.0), and the Article
6(c) liability sentence beneath it. `node tools/verify.mjs <site>`: WebGL2 context,
no console or page errors. A screenshot from the exact viewpoint the user reported
the grey wall from now shows the valley (`tools/dev/logs/live-nevaio.png`).

**First load, measured on the wire** by summing content-length over the initial load
including the default Medium tier: **31.60 MB**, against 25.97 before today - so
**+5.63 MB** for a map that is 20% taller and finally contains the whole park. The
local estimate had been 31.23 MB; the gap is Pages' gzip level against node's.

| | MB on the wire |
|---|---|
| heightfield.bin | 12.78 |
| heighttier 10 m (the default) | 8.78 |
| basemap 8192 | 7.07 |
| canopy + landcover masks | 1.84 |
| water.json | 0.46 |
| trails.json | 0.26 |
| bundle | 0.24 |
| roads.json | 0.12 |
| **outerring.png** | **0.02** |
| poi + ferrata + manifests | 0.03 |

The outer-ring field is 0.02 MB of that, and it is what makes the map stop having
edges.

## Where the project got to, by phase

One line each, and the archive has the day it happened. Everything below is DONE
and published unless it says otherwise.

| phase | what landed | when |
|---|---|---|
| 0 | Repo, architecture, DEM datum verified against Mont Blanc's summit (EPSG:23032, not 32632) | 25 Jul |
| 1 | Terrain from the real heightfield, walk/fly controls, HUD | 28-30 Jul |
| 2 | Trails from the VDA regional dataset, POI, labels | 30-31 Jul |
| 3 | Water: lakes, rivers, waterfalls, glaciers | 31 Jul - 3 Aug |
| 4 | Aerial-perspective atmosphere, lighting, time of day, weather | 3-4 Aug |
| 5 | Position readout, search, shareable links, autosave | 4-5 Aug |
| 6 | Vegetation from an OSM canopy mask, wildlife, ambient audio | 3-7 Aug |
| 7 | Quadtree-LOD terrain, performance, deploy to GitHub Pages | 3-10 Aug |
| extra | Satellite ground (Sentinel-2, de-shaded to albedo) | 11-12 Aug |
| extra | Sky that thins with altitude | 12 Aug |
| extra | Ground cover: grass, scree, edelweiss | 12-13 Aug |
| extra | High-resolution terrain tier, 10 m default and 5 m optional | 13-14 Aug |
| - | The heavy .bin purged from git history | 17 Aug |
| - | Region replaced the park boundary; roads, streams, villages, via ferratas | 18 Aug |
| - | **The bbox moved south: 18.2% of the park had no terrain at all** | 18 Aug |
| - | Outer ring, edge fade, walker boundary; glaciers fixed | 18 Aug |

**The four decisions still in force**, because they shape everything and are not
re-litigated: vanilla Three.js and Vite with a DOM overlay (no React); English for
code, docs and UI; published publicly, so asset size and licensing are decided up
front rather than retrofitted; and asymmetric DEM resolution between the two sides
of the park is accepted rather than levelled down.

## Open debts

- **Piemonte DTM5 spikes are in the shipped DEM**, not only in the tier: 1,245
  cells over 96 m out of the 44.1 M it shares with TINITALY. Invisible in
  practice. A de-spike pass over the mosaic is a real option nobody has taken.
- **Glaciers should be a terrain mask, not a sheet.** 1.25% of the ice still dips
  under the rock because a triangle's interior is flat, and the offset is squeezed
  between eye height above and sag below, so it cannot cover the tail. Drawing them
  the way `src/forest.js` draws canopy removes the class - and 563,567 triangles.
- **The 5 m tier is 51.03 MB** and the push warns about it. GitHub recommends under
  50, its hard limit is 100. Not a wall today; the next time that file grows it is.
