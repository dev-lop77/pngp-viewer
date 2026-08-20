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

## NEXT SESSION: everything the user has named is DONE and PUBLIC. So ask.

The ice was published on 2026-08-20 and there is nothing queued behind it. What is left,
none of it requested:

- **In the ice:** crevasses - noise bands running across the slope, and the term that pays
  up close, where the firn/live-ice split pays from a distance. A bergschrund shadow at the
  headwall. Putting any of it where the real ones are needs data this project does not have.
- **The two defects the white ice exposed**, both in the open debts at the end of this file,
  both older than the ice and neither touched: the LOD trees standing where there is no wood,
  and a terrain tile skirt visible at eye height. These are DEFECTS, not topics - they are
  the honest answer to "what should we do next" if the user has no preference.
- **The refuge has no High level of its own.** The tricolour on the bivouac is the only thing
  the Models control adds today.

Run the FAST suite before any publish - the user's standing rule - and expect 13 tests, about
11 minutes.

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

### DONE 2026-08-19: three monuments, and the 252 crosses are NOT happening

The user cut the topic down to a list before it started: ***"per il momento ne mettiamo
solo una, sulla cima della Granta Parei. Poi se si riesce la madonnina sulla cima del
Gran Paradiso"***, plus a second cross ***"non proprio in vetta"***, and
***"Aggiungile solo se Models e' High"***. So `src/summits.js` holds THREE named
objects, not a category:

| | where | how it is anchored |
|---|---|---|
| summit cross | Granta Parey, 3,387 m | POI `n1562997760` |
| Madonna | Gran Paradiso, 4,058 m | POI `n1707240539` - OSM already had the statue as its own point, 3 m below the summit |
| second cross | 45.5246603N, 7.1890672E, ~2,306 m, 817 m from Aouille | lat/lon through `geo.js` |

Two mechanics worth keeping in mind before adding a fourth:

- **They are drawn only at Models = High**, on the group's visibility, and
  `main.js`'s `applyModelDetail()` drives it. That is why they are not in `poi.js`: a
  marker is information, these are ornament.
- **Seated a THIRD of the way up the footprint's corner spread**, which is the
  OPPOSITE of `huts.js`'s "highest corner". A building cannot be buried - a sunken door
  is visible and wrong - while a cairn can be, and half-buried is what a real one looks
  like. Seating the cross on its highest corner put a 2.8 m pale plinth under a 3 m
  cross on the user's own slope, taller than it was wide, which read worse than the
  floating corner it fixed.

**The Madonna was moved onto the crest** the same day, after the user sent a viewpoint:
*"Sposta la Madonna del Gran Paradiso 6 metri piu in alto, almeno che stia in cresta."*
Measured before moving anything: she stood at 4,033.7 m on the flank, and the drawn crest
within 16 m is 4,045.1 - **11.4 m above her and 14 m to the south**. So a literal +6 m
would have left her hanging over the flank with a 6 m plinth, which is the defect the
seating rule already had to fix once. `CREST_SEARCH_M` puts her on the highest DRAWN
ground within a radius instead, re-searched on every re-seat because the tier moves the
crest too.

**The radius is the whole decision, and 20 m was wrong.** At 20 m the search found the
true top of the dome, 19.7 m away and 11.2 m up, and put her BEHIND the crest - invisible
from the very viewpoint the user was standing at. At 7 m she rises 8.2 m and moves 5.8,
which is both what they asked for and what they meant: on the crest line, in the same
place to the eye. `tools/test-summits.mjs` asserts that she moved and moved up, so the
search cannot silently stop working and leave her back on the flank.

The Madonna took a second pass: the first had modelled arms, and at six metres they read
as sticks laid across the robe while the whole thing read as a chess piece. Arms are
below the size this scene resolves. Robe plus MANTLE OVER THE HEAD is the silhouette that
says Madonna, and that is what ships.

`tools/test-summits.mjs` is in the fast suite: the POI ids still resolve, the lat/lon is
inside the park, both shapes are mergeable and human-scale, Standard draws nothing, High
draws all three, and each one's base reaches BELOW the surface rather than resting on air
- measured against the bilinear height, not the sampler that seated them (§13.9).

**A share link is not a coordinate.** The second cross arrived as a mapy.com short link
and it cannot be resolved from a script: the code is expanded by the browser, so
`mapy.com/s/<code>` answers 404 to curl and to WebFetch. Asking for the numbers took one
message; guessing would have put a cross somewhere plausible and wrong.

### DONE 2026-08-19: the glaciers are a mask, not a sheet

The open debt, taken at the user's word - *"Proseguiamo con la gestione dei ghiacciai"* -
and closed. The ice is a **30 kB mask** on the heightfield's own grid, read by
`src/terrain.js`, so the ice IS the ground: `tools/build-glacier-mask.mjs`,
`src/glaciermask.js`, `GLACIER_COLOR` and `GLACIER_MIX` in terrain.js. **563,567 triangles
gone**, and with them the whole squeeze the sheet lived in - a lift that had to stay under
the walker's 1.7 m eye height while outrunning a sag of up to 9.32 m.

Three things it found that were not in the plan:

1. **The satellite photo already shows the ice, brighter than my ice.** The first colour,
   0xc3defb, was the brightest ice that does not clip - and the frame over the Gliairetta
   came out **3.6 levels darker** with the ice painted than without it, because the photo
   shows that glacier at about rgb(190) and this renderer's ceiling is rgb(195). Ice darker
   than a photo of ice is the wrong way round. The measurement came from the test, not from
   looking. **The user then picked the colour from four renders of one camera: neutral
   white** - *"mi piace neutral"* - over the cyan-white 0xe9ffff and the blue 0xc3defb. It
   is the right answer for this rig rather than for a glacier: real ice takes its blue from
   depth and from a sky filling half of what it reflects, and this renderer has neither an
   aperture nor an environment map, so white against warm rock is what reads as ice. The
   ice's signature in `tools/test-glaciers.mjs` is therefore BRIGHTNESS, not hue - which
   that check has now been wrong about in both directions, once per colour.
2. **The scree was standing on the glacier.** What had kept stones off the ice was
   `snowCover()` reading 1.0 on a glaciated summit - true on the Gran Paradiso, false on
   the Gliairetta tongue at 3,100 m under a clear sky, and a foot-level shot showed cones
   sitting on the ice. The landcover mask cannot help: it is derived from imagery that
   reads a glacier as bright bare ground. Both the shader-side cover and the CPU-placed
   edelweiss now ask the ice mask directly (40 of the 80 glaciers reach into the flowers'
   1,850-2,980 m window).
3. **`refineToMaxEdge()` was glacier-only** and went with it: a lake surface is flat by
   nature and the rivers are ribbons. 70 lines, recoverable from the history.

`tools/test-glaciers.mjs` is in the fast suite. It does NOT measure sag - a mask has no
interior to sag - it measures what can now break instead: the mask against water.json's own
80 rings by point-in-polygon (ice inside all 80, none at 4,834 sampled points outside), the
sheet's absence from the scene, and that the mask really reaches the shader, by switching
`GLACIER_MIX` off and measuring the frame. Reading the uniform alone would only prove the
binding - §13.1's silent shader patch is the same shape of lie.

**Still open here:** the ice is one flat colour with no crevasses, no séracs and no
blue-ice/firn distinction, and it does not brighten with the weather snow (`snowCover()`
goes on top of it). Nobody has asked for any of that.

### DONE 2026-08-19: what the mask made possible - firn, live ice and moraine

The user's *"facciamo una prova con cosa si puo' fare con il nuovo ghiaccio"*, and then
*"accetto la tua proposta"* - which was the two terms that change the read from a distance,
leaving crevasses for later. Both are colour and noise inside the existing ice branch of
`src/terrain.js`: no geometry, no download, no second texture.

- **Firn above, live ice below.** The accumulation zone stays white; below the firn line the
  exposed ice is grey and visibly darker, which is the cue that separates a glacier from a
  snowfield. `FIRN_LINE_M` is 3,150 with a 220 m blend, on the same wobbled height the
  vegetation bands use so it is not a contour line. **It is modelled, not measured** - in
  these mountains it sits around 3,100-3,300 m and moves every year, and nothing in this
  project's data says where it is.
- **Moraine at the margin.** A partly covered mask pixel IS the edge of the outline, so the
  debris band is read off the mask's own value: highest in the middle of the ramp, zero at
  both ends. Debris on the rim, clean ice in the body.

**Three false measurements on the way, and the third is the one worth remembering.** The
frame-level "the ice makes it brighter" assertion had to go: with a dark half the sign
depends on which zone fills the frame. Then the debris check asked `iceAt` for a
half-covered point and found nothing - `iceAt` is the mask **downscaled by two** for the CPU
(41 m cells) while the shader reads the 20.5 m original, so a point that is half-covered to
one is fully covered or bare to the other. Then it walked outward to the tongue's edge and
took the warmest sample - **and passed, at mask 0.00, measuring the rock outside the ice**.
Rock is warm and so is moraine. The only reading that isolates a term is the same pixel with
it on and off, so `MORAINE_MIX` exists beside `GLACIER_MIX`, and the margin texel is now
chosen in Node from the FULL-RESOLUTION mask the test has already decoded.

What it measures now: firn luma 139.1 at 3,358 m against 125.3 at 2,581 m on one glacier;
switching `MORAINE_MIX` off cools the margin texel by 6.7 of R-B and the body by 0.00.

**And the test got three times faster while gaining those checks** - 219 s to 68. Most of it
was a wait that waited for nothing: `glacierMix.value > 0` is a constant holder set before
anything loads, followed by a 3 s sleep doing the real work. It now waits for `iceAt` to
answer at a pixel the mask says is deep inside a glacier, which is what "the download landed"
actually means. The rest was a bbox pre-filter on the containment sweep, a coarser scan that
tests the cheap sampler before the costly one, and dropping a whole-frame render whose one
claim is covered three other ways.

**Then the ice got the sun**, at the user's own observation - *"Nonostante sia Midday il
ghiaccio e' un po' troppo grigio, dovrebbe riflettere di piu' la luce del sole pieno"* - and
this one could not be answered with a colour. **The albedo was already 1.0**, and a white
Lambert surface under this rig comes out at rgb(195,195,195): the BRDF divides by pi, midday
lights with sun 1.8 plus ambient 0.6, exposure is 0.75 and ACES compresses what is left. The
old sheet hit the same ceiling from the other side.

So the extra light is added where the pipeline has room: as **emissive radiance**, which three
adds after the lighting and therefore after the division, scaled by `dot(N, sun)` and by the
SQUARE of `SUN_POWER` (a new holder in lighting.js, written from the same number the sun light
gets). Measured on one ice pixel: **+33.1 levels of luma at the default hour** (sun power 0.84)
and **+2.1 at dusk** (0.18).

**The square is a measurement, not a taste.** Linear in the sun's power, the night preset still
put a tenth of the gain on the ice, and a night frame is dark enough that this took the
brightest sixth from 42.9 to **74.4** - the glaciers became the brightest thing in the park at
midnight. Squared, night is +5.7 and dusk +0.4. The first version of the term was worse still:
it read `uAtmoSunDir`, which is the LIGHT direction, and lighting.js substitutes a moon-like
angle at night - so the ice would have blazed under moonlight at full gain.

**Still open:** crevasses (noise bands along the slope, which is the term that pays up close),
a bergschrund shadow at the headwall, and any of it being where the real ones are - which
needs data this project does not have.

### Before touching anything

Read **`docs/ARCHITECTURE.md` §13 - Landmines** first. It is fifteen rules that have
each cost real time, and three of them were broken again *after* being written down:
measuring seated geometry with the sampler that seated it, believing a test log that
only keeps the tail of each run, and reading back a value the render loop had not yet
consumed.

Open debts are at the end of this file.

## PUBLISHED (2026-08-20): firn, live ice, moraine and the sunlit ice

Fast suite **13/13 in 677 s**, then `tools/dev/deploy.sh`. The push carried **the JS bundle and
nothing else** - `assets/index-Bi7qX3KI.js -> index-CoTSuToM.js` plus `index.html`. That is the
whole diff, and it is the right one: all three terms are colour and noise inside the existing
ice branch of the shader, so there was no new data to ship. **First load 31.27 MB over 21
requests, unchanged to the hundredth from the 2026-08-19 build.**

**Verified against the CDN four ways**, because "Pages says built" is not one of them:

1. `node tools/verify.mjs <site>` - WebGL2 context, no console or page errors.
2. **The published bundle really contains the new shader.** `uMoraineMix`, `uIceSunMix`,
   `uIceSunPower` and `terrainIceNormal` are all in `index-CoTSuToM.js`, and so is the
   constant-folded `3370` - `FIRN_LINE_M + FIRN_BLEND_M`, the top of the firn blend. A deploy
   that pushed a stale build would be invisible in a screenshot and obvious here.
3. **A shot of the LIVE site over the Gliairetta**, `tools/dev/logs/live-glacier-firn.png`:
   white firn in the upper basin, grey live ice down the tongue, and the warm debris band
   along the margin.
4. **The frame measured against yesterday's**, which is the part a picture cannot do. Same
   camera, same hour, one box over the ice: **R-B falls from 5.1 on the old published build to
   2.8 on this one**, landing on the dev bench's 2.9 - the grey of live ice replacing flat
   white. Luma 118.4 against 116.5. The old build and the old bench agree with each other
   (5.1 / 5.2) and the new build and the new bench agree with each other, which is what makes
   this a measurement of the deploy rather than of the weather.

**Two things about share links, both learned here and neither obvious:**

- **The time-of-day slot in a hash is a fraction of the five-preset cycle, not a clock.** The
  presets are dawn, Midday, golden, dusk, night, so `time=0.200` is midday and `time=0.500` is
  the dark side of golden hour. The app's own default is **0.150** - mid-morning, between dawn
  and Midday - and that is the number to use when comparing a live shot to a dev bench, because
  `tools/dev/probe-glaciers.mjs` leaves the default alone.
- **A hash with no `time=` is NOT the default hour**, it is dawn. The first live shot of the day
  came back at luma 53 against the bench's 117, which looks exactly like a regression and is
  not one.

Not re-fetched today, because the push did not touch them: `data/glacier.json` (80 outlines,
69,008 full pixels, 29.07 km2, ODbL) and the 30,729-byte mask.

## PUBLISHED (2026-08-19)

Live at https://dev-lop77.github.io/pngp-viewer/ after *"puoi pubblicare dopo aver settato
1"*. Pages reported `built`; the push carried the JS bundle, `glacier.d60915e3.png` and
`glacier.json` and nothing else - everything else today was code, not data.

**Verified against the CDN, not the build**, which is the habit this project earned the hard
way. `data/glacier.json` comes back with **80 outlines, 69,008 full pixels, 29.07 km2** and
the ODbL line; the mask itself is 200/30,729 bytes of `image/png`. `node tools/verify.mjs
<site>`: WebGL2 context, no console or page errors. And a shot of the LIVE site over the
Gliairetta (`tools/dev/logs/live-glacier.png`) shows the neutral white ice following the
relief - the sheet is gone from the published build too, not just from the dev server.

**First load: 31.27 MB**, against 31.23 for the previous build measured the same way, so
**+0.04 MB** - the glacier mask, and nothing else. (The 31.60 MB in the 2026-08-18 entry was
summed from content-length on the wire; this figure is node's own gzip of `dist/`, which is
the like-for-like comparison. Pages compresses slightly harder.)

| | MB, node's gzip |
|---|---|
| heightfield.bin | 12.66 |
| heighttier 10 m (the default) | 8.54 |
| basemap 8192 | 7.07 |
| forest mask | 1.12 |
| landcover mask | 0.72 |
| water.json | 0.45 |
| trails.json | 0.26 |
| bundle | 0.24 |
| roads.json | 0.12 |
| **glacier mask** | **0.03** |
| outerring.png | 0.02 |
| poi + manifests | 0.03 |

**Two tools were wrong about the published site and are fixed**, both silently:
`tools/dev/shoot-url.mjs` waited for `window.__pngp`, which Vite strips from a production
build - so it timed out on the one URL it exists for, a share link from the live viewer. It
waits for the HUD's own altitude line now, which is in both builds. And
`tools/dev/measure-load.mjs` sizes each response by reading the file back out of `dist/`,
which cannot work for a URL carrying the Pages sub-path: it reported **0.00 MB over 0
requests** rather than failing. It strips one leading segment and retries.

What is live now, that was not this morning: the 51 rifugi and bivacchi as buildings, the
three summit monuments, the 15 m fly-to standoff, and the glaciers as a mask.

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
- ~~**Glaciers should be a terrain mask, not a sheet.**~~ **DONE 2026-08-19.** The ice
  is a 30 kB mask the terrain shader reads (`tools/build-glacier-mask.mjs`,
  `src/glaciermask.js`, `GLACIER_COLOR` in `src/terrain.js`), so the ice IS the ground:
  no interior to sag, nothing to walk under, no offset squeezed between eye height and
  sag, and **563,567 triangles gone**. It also closed a defect nobody had listed: the
  scree was standing on the Gliairetta tongue, because what had kept stones off the ice
  was `snowCover()` reading 1.0 on a glaciated summit - true on the Gran Paradiso, false
  at 3,100 m under a clear sky. Both the shader-side cover and the CPU-placed edelweiss
  now ask the ice directly.
- **Distant trees stand where there is no wood, and the ice made it obvious.** Measured
  2026-08-19 from the firn basin above the Gliairetta (45.52233N, 7.05259E, 3,315 m): three
  conifers on the ice. They vanish when `vegetation-lod` alone is hidden, so they are the
  DISTANT tree layer; the canopy mask reads **zero over a 3.2 km square** around that camera
  and `vegetation.nearInfo()` reports an empty near set. So the fine layer is right and the
  LOD layer is placing trees off the mask - most likely sampling it at a coarse mip, which
  bleeds a wood a kilometre away across a boundary. Pre-existing, and invisible until the ice
  became a white surface to stand them on.
- **A terrain tile skirt shows at eye height on the ice.** Same session, standing at
  45.51249N, 7.01452E (2,918 m): a hard-edged pale quadrilateral in the lower frame that
  survives ground cover off and water hidden, and **disappears when the camera lifts 25 m** -
  which is the signature of `SKIRT_DEPTH_M`'s curtain seen edge-on at a tile boundary. Also
  pre-existing: the old glacier sheet was drawn 1 m above the ground and hid it.
- **The 5 m tier is 51.03 MB** and the push warns about it. GitHub recommends under
  50, its hard limit is 100. Not a wall today; the next time that file grows it is.
