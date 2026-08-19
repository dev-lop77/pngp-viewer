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

## NEXT SESSION: the summit crosses. The depth and the huts are CLOSED

**State: published, healthy, nothing half-finished.** The working tree is clean, the
fast suite passes, and https://dev-lop77.github.io/pngp-viewer/ serves the whole park
with the credits verified against the CDN. There is no rescue work waiting.

### The DEPTH topic is finished - do not reopen it

**2026-08-19, the user looked and decided: *"No, e' a posto cosi' com'e' ora."*** The
haze stays where it is, at `HAZE_SCALE` 1. And that closes the depth-of-field half
with it, because a DOF pass was always conditional on something still being missing
after the aerial perspective was pushed - nothing is. **There is still no
EffectComposer, and now no reason to add one.**

What shipped anyway, because the decision needed a way to be made and to be remade:

- `HAZE_SCALE` in `src/lighting.js`, a global multiplier on the distance haze, and
  **1.0 is the approved look**. It exists because the uniform cannot be pinned from
  outside (§13.15) - lighting.js rewrites it every frame from the preset.
- `H` in dev (`src/main.js`) sweeps x0.6 / x1 / x1.5 / x2.2 / x3 in place and writes
  the live value and what it takes at 10/30/60 km into the dev note. This is how the
  question got answered in one minute after a morning of headless rendering that could
  not answer it - headless is SwiftShader (§13.11).
- `tools/dev/probe-haze.mjs`, the measured sweep. Its numbers are in
  `tools/dev/logs/haze-sweep.json`.

Three things it measured that are worth not re-deriving:

1. **The `1.8e-5` in src/atmosphere.js is dead** and this file used to quote it as the
   look. The screen runs on the time-of-day preset: 1.22e-5 in the default view.
2. **The haze is invisible from a valley.** At Cogne the ridges are 2-12 km away, so
   even x2.2 moves the far-band contrast by 1.4% and its brightness by 0.6 of a point.
   The whole effect lives in the deep views - from the Gran Paradiso summit x2.2 costs
   15% of the far ground's internal contrast. The fear that more air would turn the
   valleys milky was unfounded, and measuring it is what showed that.
3. **`page.screenshot()` is the wrong way to shoot this app.** It forces a second full
   render pass; three attempts at the probe were killed inside it. `toDataURL('png')`
   is no better - 80-91 s a frame, and just as slow on a frame of pure sky, so it is
   the browser's PNG encoder. `gl.readPixels` inside a frame plus fast-png in node is
   8-10 s. A frame of the deepest vantage itself costs 2.8 s.

### DONE 2026-08-19: the 51 rifugi and bivacchi are buildings

`src/huts.js`, and the whole topic is built, tested and in the working tree - NOT yet
published. What the user decided, and what it cost:

**Their three choices, asked before anything was modelled:**

1. **The building replaces the post, and the label stays.** Since they also chose
   always-drawn buildings, "replaces" had to be given a distance: the post is dropped
   inside `NEAR_M` (800 m), where the building is there to be looked at, and stands
   beyond it, where it is the only thing you can see. `poi.js` collapses that one
   segment to ZERO LENGTH through a `setBuildingProbe()` predicate - the merged
   LineSegments has a fixed slot per POI, so there is nothing to delete.
2. **Always drawn, with a simplified shape at distance.** The far shape's job is the
   SAME OUTLINE, not fewer triangles: 118 -> 30 for the hut and 68 -> 48 for the
   bivouac is nothing next to the glaciers' 563k. What it removes is the 4 cm-proud
   window panels, which on a three-pixel building are pure aliasing.
3. **The bivouac is the orange Apollonio barrel**, for the 21 `shelter:basic_hut` AND
   the 7 `wilderness_hut` (those at 1.3x). So there are TWO models for three tags, by
   their choice, and `KIND_OF`/`KIND_SCALE` keep the tags separate so it can be undone.

**And their two corrections, both from looking at the bench:**

- *"nella versione hi res aggiungi la bandiera italiana"* - `HI_HUT_BUILDERS.bivouac`
  adds the tricolour on a mast by the door, so it appears at Models = High and nowhere
  else. Green, white, red left to right, and `tools/test-huts.mjs` asserts that order
  from the colour attribute rather than trusting the source order.
- *"Il rifugio non e' un gran che'. Sembra che il tetto sia staccato... Farei una cosa
  meno reale ma piu significativa, come un classico mountain hut in legno e pietra.
  Generico ma riconoscibile."* The roof looked detached because roof AND gable ends
  were one six-triangle tent in the ROOF's colour, so the top of the building was a
  dark object sitting on a pale box. `roofSlopes()` and `gableEnds()` are now separate
  and the gable is drawn in the WALL's material, because that is what a gable is. The
  building itself was rebuilt as a generic wood-and-stone hut - stone floor, dark
  timber storey, gallery along the whole facade, steep 36 deg shingle roof - and
  shrunk from 13 x 8.5 m to 9.5 x 7: a refuge that sleeps eighty is a BUILDING, and
  drawing one made every site look like a hamlet.

**What the buildings do that a marker never had to:**

- Seated on the DRAWN surface at all four footprint corners and lifted to the highest
  of them, so nothing is buried, with a foundation box scaled per instance to bridge
  the corner drop - a 9.5 m hut on a 30 deg slope stands on a terrace. Registered with
  `reseatOnDrawnSurface()`, because the height tier moves that surface by up to 44 m
  after the first frame.
- Yaw from the terrain gradient sampled at 12 m, so the door faces the way you walk up.

**Verified without the sampler that did the work** (§13.9), by `tools/test-huts.mjs`
(now in the fast suite) and `tools/dev/probe-huts.mjs`: 51 placed (23 + 28), seated
height minus the BILINEAR height is a median +0.5 m over the 51 (min -0.3, max +4.9),
**zero** stand on air, the post at the building you are standing at measures 0.00 m
while the other 50 stand, no post disagrees with the 800 m rule, and the label is still
in the DOM and on screen. Two of those checks only passed after the TEST was fixed: it
read the post on the same tick it moved the camera (huts.js refills from the render
loop, so it read the previous position), and it checked a label without turning to face
it, which three's CSS2DRenderer sets to `display:none`.

**Open, if the user wants it:** the refuge has no High level of its own - the flag is
the only thing the Models control adds today.

### Start here: summit crosses on the 252 peaks

The trap is measured and known: a peak's `elevationM` is its real altitude and the
drawn mesh sits tens of metres below it on a sharp summit, which is why poi.js plants
markers with `sampleRenderedHeight` rather than the real number. A cross at the true
altitude floats. Two things to settle with the user first: **all 252 or only the ones
that really have one**, and whether the cross replaces that peak's marker post the way
a hut now does (`poi.js`'s `setBuildingProbe` is the mechanism, and it takes any
predicate - it is not hut-specific).

`src/huts.js` is the template for the whole job: procedural parts, two levels, seated
at the corners, re-seated on tier change, and a bench set in
`tools/dev/model-candidates.js` so the SHAPE is agreed before anything is wired in.

### Before touching anything

Read **`docs/ARCHITECTURE.md` §13 - Landmines** first. It is fifteen rules that have
each cost real time, and three of them were broken again *after* being written down:
measuring seated geometry with the sampler that seated it, believing a test log that
only keeps the tail of each run, and reading back a value the render loop had not yet
consumed.

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
