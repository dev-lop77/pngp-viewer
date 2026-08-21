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

## EXTENDED 2026-08-21 (second run of the day): 416 sheets, the park plus a 12 km margin.

The user, after the first mosaic went live: *"visto che abbiamo risparmiato tanto spazio,
direi di estendere le ortofoto a tutta la superficie al momento gestita, anche se e' fuori dal
parco, come l'alta val di Rhemes e la Valgrisenche."* Two things had to be measured before
answering, and one of them changed the question:

- **Alta Val di Rhemes was already covered.** Rhemes-Notre-Dame and the Rifugio Benevolo are
  inside the original 129. Valgrisenche was not, and needed a 6 km margin for the village and
  the Lago di Beauregard, 4 km for the Rifugio Bezzi.
- **The whole rendered world is 4,865 km2 and the region can cover 58.6% of it** - 713 sheets,
  223 GB to fetch, ~10.7 h, 123 MB shipped. The user chose the **12 km margin** instead: 416
  sheets, 287 new, 111 GB, and it took about 2h20 at 14 MB/s (faster than the 8.76 measured
  the day before).

**Result: 416 sheets, 83.85 MB shipped, 1,664 km2, 19 rows, the widest 30 cells = 60 km.**
Mean sheet 202 kB rather than the park's 172 - valley floors carry more detail and compress
worse, which is why the estimate said 72 MB and the answer was 84. Manifest and directory
reconcile exactly; `tools/dev/logs/valgrisenche-ortho.png` is the new ground at midday.

**Verified on the bigger mosaic:** `probe-ortho-cache.mjs` over a 26-stop walk - **89 distinct
sheets through a cache of 16**, peak 16, 9/9 cells the whole way (the coverage is contiguous),
0 requests to step back two cells, 0 repeats on a fast crossing. Fast suite 14/14, 688 s.

**PUBLISHED and checked against the site, not the build:** all **416 sheets return 200** (the
sweep retries once, because a burst of 416 requests earns a 503 from Pages that is rate
limiting and not a missing file - that happened on the 129-sheet sweep and would read as a
hole), the manifest is 181 kB, and `tools/verify.mjs` drives the switch on the published page:
switch on, nine sheets fetched, none of them not-200, nothing fetched before the click.

**The run died once, and the fix matters more than the run.** `ECONNRESET` on sheet 9745 came
out of `res.arrayBuffer()` AFTER the fetch had resolved 200, so it was not a request failure
and a guard on the request would not have seen it. Node exited; the manifest was never
written; the 277 sheets already converted survived only because the stamps are per sheet. And
the shell reported exit 0, because the command was piped through `tee` - so a crashed six-hour
run looked like a finished one, and what caught it was counting the manifest against the
directory. `build-ortho.mjs` now retries both the request and the body read with backoff and
skips a sheet that will not come. See ARCHITECTURE §13.22 and §13.23.

## PUBLISHED 2026-08-21: the 2 m orthophoto mosaic, 129 sheets over the park's VdA side.

`node tools/build-ortho.mjs --sheets=tools/dev/logs/ortho-sheets.json --res=2` ran on
2026-08-21: **129 sheets, 22.16 MB shipped, 38.1 GB fetched and deleted, no sheet skipped**,
about 1h50. Mean sheet 172 kB, so a full 3x3 block costs ~1.55 MB - downloaded only when
someone presses O. The first load is untouched.

Verified, not assumed:
- fast suite **14/14 PASS, 704 s** (2026-08-21).
- `tools/dev/probe-ortho-cache.mjs`: **55 distinct sheets through a cache of 16**, peak 16,
  stepping back over two boundaries costs 0 requests, a fast crossing of 8 cells makes 18
  requests with 0 repeats.
- `tools/dev/probe-ortho-atlas.mjs`: 9/9 cells at the spawn, refill 16-33 ms, no seam.
- `tools/dev/probe-ortho-ab.mjs`: the photograph changes **34.9%** of a plan-view frame,
  mean delta 29/765. **The blue is the photograph's own** - 1.4% of pixels are blue only
  with it on, 0.0% blue survives turning it off. Glacial lakes, not our ice. (Asked with a
  measurement because the same question got three wrong answers by reasoning on 2026-08-20.)

**Three defects were found and fixed on the way, all of them invisible at 9 sheets** - see
ARCHITECTURE §13.20 and §13.21 for the full statement:
1. the sheet cache never evicted (129 decoded sheets = 537 MB; now capped at 16 = 67 MB);
2. `updateOrtho()` recorded its cell after the await, so flying restarted the refill once per
   frame, and an Image cache rather than a Promise cache re-downloaded the same files;
3. `build-ortho.mjs` trusted a "done" marker whose output the prune step had deleted - three
   sheets were in the manifest and not on disk, which would have been three 404s on the site.

**Both open questions were decided by the user on 2026-08-21, so do not reopen either:**
**publish as it is, with the shadow debt on the record**, and **the 22 MB stays gitignored**
(the gh-pages branch now holds all 129 sheets, which is the off-machine copy).

**It is live.** Checked against the site itself, not the build: all 129 sheets return 200
(one 503 on the first sweep was rate limiting from 129 requests in a burst, and answered 200
on retry), the licence PDF is served, and no build marker is - `.done-5943-2` is a 404, which
is the right answer. Clicking the HUD switch on the published page turns the photograph on
and fetches exactly the nine sheets of the block, all 200, with nothing fetched before the
click. `tools/dev/logs/published-ortho-midday.png` is what it looks like at Le Pont at
midday - and the dark band across the valley floor there is the flight's own shadow, drawn at
noon. That is the debt, in one frame.

**The publish check covers the switch again.** `tools/verify.mjs` now clicks `#env-ortho` and
asserts three things: nothing fetched before the click (the whole premise is that it is
opt-in), the switch stays on, and every sheet comes back 200. That closes the gap left when
`test-ortho-viewstate` had to go in the slow list - the suite still has the deeper test, but
a publish no longer goes out with the switch unexercised.

Both viewstate tests were put on the record on 2026-08-21: `test-viewstate` PASS 357 s (slow
because a mosaic build was running against it; the 167 s reference still stands) and
`test-ortho-viewstate` PASS 201 s. The standing note about a stale FAIL in `test-times.tsv`
is retired.

**The 22 MB stays gitignored** (decided 2026-08-21). `.gitignore` used to say the clips were
ignored because they were "a TRIAL" and that the line was due for deletion once a clip was
settled and shipped. It is settled and shipping, and the answer is still to keep it ignored:
the deployed gh-pages branch holds all 129 sheets, so an off-machine copy exists without
putting permanent weight in the history - and the .bin purge of 2026-08-17 is what undoing
that costs. Rebuilding from scratch is 38 GB of the Region's bandwidth and ~1h50.

**THE FINDING THAT MATTERS MOST, and it came from the user's own remark** (2026-08-21,
*"alcune parti blu a volte potrebbe essere il terreno roccioso in ombra, esaltato dalle
correzioni colore"*): **the orthophoto is NOT de-shaded, and the shader feeds it into the
albedo slot anyway.** `build-ortho.mjs` goes fetch -> resample -> WebP and never touches the
DEM. ARCHITECTURE §5 already records what that costs, for the Sentinel basemap: "without it
every north face would be dark twice and every sunset would have the shadows pointing
south-east". The basemap is de-shaded; the photograph that overlays it is not, so the ground
changes contract across the 900-1,700 m fade.

**The user's decision (2026-08-21): ship it as it is and keep the debt on the record.** The
brightness had already been approved while looking at these very sheets, and the two ways
forward both cost more than they are worth right now - a render-side heuristic (lean back on
the de-shaded basemap wherever the photograph is much darker than it) is cheap but not
physically true, and a real de-shading needs a sun estimate this data will not reliably give.

Measured, not argued (`tools/dev/probe-ortho-source.mjs`, `probe-ortho-sun.mjs`):
- **13.79%** of one block's ground is in shadow (L<64) in the source itself.
- The blue the plan view shows is **shadow, not lakes** - shaded snow and rock, blue because
  an alpine shadow is lit by the sky and because the aerial product's own colour balance
  leans that way. The real lakes are the few teal specks. An earlier note in this file called
  them lakes on the strength of a rendered frame; that was an interpretation, and the source
  stitched straight from disk (`tools/dev/logs/ortho-source-0_0.png`) corrects it.
- Sheet 5943's baked sun fits at **azimuth 173 deg, elevation 32 deg, r = 0.838** - and with
  a zenith sun, meaning no directional shading at all, r collapses to **0.078**. The
  photograph is mostly shading, not albedo. That is the whole argument in two numbers.
- **A per-sheet fit is NOT reliable enough to de-shade with.** Across 12 sheets r runs 0.84
  down to 0.06 and elevation 1 to 74 deg, several pinned to the edge of the azimuth
  constraint. Sheets with strong relief and mixed cover answer confidently; snowfields,
  forest and gentle ground do not. The spread is also partly REAL - the campaign ran 21/08 to
  02/11/2024, whose solar noon falls from about 57 deg to 26 - so one global sun would
  over-correct as many sheets as it fixed.
- De-shading would NOT need the 38 GB again: it is a per-pixel colour operation and the 2 m
  sheets are on disk. The obstacle is the sun estimate, not the pixels.

**Decided, so do not reopen:** 2 m/px; brightness `ORTHO_SCALE` 1.54; **the photograph wins
over the OSM outline** where the two disagree about where the ice ends (`ICE_PHOTO_MIX` 1, so
within 1,700 m the firn line, the live-ice grey and the moraine do not show - the photograph
has all three); the switch lives in the HUD, in `localStorage` AND in shared links.

**Open, and worth raising before publishing:**
- **No NEAR fade.** At eye height the 2 m photograph is magnified far past use and the
  procedural ground would do better for the last few tens of metres. The seam shot
  (`tools/dev/logs/atlas-seam-full.png`) shows exactly this in its bottom-right corner.
- **The far edge is capped by the atlas, not by taste.** 1,700 m is all a 3x3 block can
  promise. A 5x5 is ~100 MB of video memory; a second coarser level for the far field is the
  usual answer and is not built.
- **Coverage ends in a hard line** at the regional border. The rectangle fade does not help
  there, because that edge is inside the atlas rather than at its rim. The mosaic is 13 rows
  deep, the widest 19 cells (38 km) and contiguous, so the line is long.
- **A cell crossing uploads a 3,020 px canvas** - about 36 MB of texture - and that cost is
  paid every 2 km now that there is somewhere to walk to. Not measured in fps yet.

## The previous session's opening note, kept because its numbers are still the ones that matter

## NEXT SESSION: the user has asked for HIGH-RESOLUTION ORTHOPHOTOS. Start there.

***"Segnati che dopo parliamo delle ortofoto ad alta risoluzione"*** (2026-08-20). It is a
TOPIC THEY RAISED, not a decision they took, so the session opens by asking what they want
from it rather than by fetching anything. What is worth having in hand before that
conversation, because it is what shapes every answer:

- The ground today is **Sentinel-2 at 8192 px over the whole 84 x 48 km bbox** - about
  10 m per pixel, de-shaded to albedo (the `extra` row in the phase table). It is
  **7.07 MB of the 31.27 MB first load**, the third largest asset.
- A real orthophoto for this area is **0.2-0.5 m**. At 0.5 m the same bbox is **167,768 px
  wide - 20.5x the width and 420x the pixels** of what ships now; at 0.2 m it is 419,420 px,
  51x the width and 2,621x the pixels. Either way it cannot be one texture and cannot be a
  single download: it is a tiling and streaming question first and a picture question
  second, which is a different shape of work from anything here so far - every asset today
  is fetched once, whole, up front. (For scale, the basemap is 7.07 MB at 8192 px, so 420x
  the pixels is measured in gigabytes before anyone argues about compression.)
- The licensing has to be settled before the pixels: the project is published publicly and
  asset licence is decided up front rather than retrofitted (one of the four standing
  decisions). Valle d'Aosta and Piemonte both publish regional orthophotos, and the two
  halves of the park are in different regions - which is already why the DEM resolution is
  asymmetric.

**2026-08-20, they said what they mean by it:** *"il caricamento, opzionale e solo sul terreno a
breve distanza dall'avatar, dei til da sovrapporre al terreno gia' caricato. non ho intenzione
di aggiungere peso locale con altre foto, quindi vanno prese in streaming."* So it is NOT a new
asset - it is an optional overlay of streamed tiles around the walker, and the first load must
not grow by a byte. That reframes it entirely, and a reconnaissance was done:
`tools/dev/probe-orthophoto.mjs`, which asks the real services rather than their documentation.

**What it found, and every line of it is measured:**

| | covers | resolution | CORS | licence |
|---|---|---|---|---|
| **Ortofoto AGEA 2024**, MapProxy/WMTS at CSI Piemonte | **Piemonte only** | **0.322 m/px** (19 levels, 256 px PNG) | `*` | **ambiguous - the blocker** |
| **Esri World Imagery**, XYZ | **both halves** | ~0.42 m/px | `*` | **not clearly permitted here** |
| Valle d'Aosta SCT | - | - | - | no public tile or WMS service exists |
| Geoportale Nazionale (PCN/MASE) | - | - | - | redirects to plain HTTP: dead for an HTTPS page |

1. **CORS is the whole feasibility question and it passes.** Without
   `Access-Control-Allow-Origin` a cross-origin image loads and then cannot become a WebGL
   texture. Both live services send `*`, asked from the published origin.
2. **A regional service does not 404 outside its region - it returns 200 and an 854-byte
   blank PNG.** That is the trap this would have fallen into: the status code says yes and
   the picture is empty. AGEA is real imagery over the Orco and blank over Cogne.
3. **No public VdA orthophoto service.** Their 2024 flight covers the whole region and is
   published as a DOWNLOAD, natively in **EPSG:23032** - this project's own CRS - under the
   CC family (CC0 / CC-BY / CC-BY-NC per product). But the SCT catalogue's imagery category
   holds five services and none of them is a photo. So the two halves of the park cannot be
   covered by one open regional service today.
4. **ED50 against WGS84 is 215 m in this park.** Same UTM zone number, different datum, so
   the coordinates look interchangeable and are not - the §13.8 class of mistake, and it
   would put every photo 215 m from its own mountain.
5. **UTM32/WGS84 is EXACTLY affine against UTM32/ED50** - worst error 0.00 cm over an 82 m
   tile and over a 4 km patch alike - so the AGEA tiles need ONE constant transform and no
   per-fragment reprojection. **Web Mercator is not**: 23 cm over 1 km, 3.7 m over 4 km, so
   the Esri route needs either small patches or the mercator formula in the shader.
6. **The budget, as a moving atlas centred on the avatar** (which beats a set of loose tiles
   because it is one texture and one uniform): **2048 px at 0.643 m/px covers 1.32 km for
   17 MB of video memory and 64 tiles, about 2.6 MB of traffic per refill.** At 0.322 m/px
   the same atlas covers 660 m. A 500 m ring of loose tiles at full resolution is 196 tiles
   and 9.4 MB, which is where this stops being free.

**Two problems nobody has solved yet, both worth raising before any code:**

- **An orthophoto is already lit.** Every shadow of every boulder and larch is baked into it
  at 0.3 m, and this renderer lights the ground itself - so the ground would carry two suns,
  one of them frozen at the hour of the flight. The Sentinel-2 basemap only works because it
  was **de-shaded to albedo offline** (`tools/dev/solve-albedo.mjs`, the `extra` phase row).
  De-shading a tile that arrives at runtime is a different and unsolved problem.
- **Politeness.** This would point a public site at a regional service that never agreed to
  serve it. Caching, a hard cap on concurrent requests and an off-by-default switch are the
  minimum, and the service can still say no by blocking us.

**Where it would attach:** `terrain.js` already carries `BASEMAP_MIX` / `BASEMAP_SCALE` /
`BASEMAP_GAIN` as live holders, and `terrainAlbedo()` already blends a ground texture. An
overlay is a second sampler blended by distance from the camera, which is the same shape as
what is there - not a new subsystem.

**2026-08-20, BUILT AND LOOKED AT: 0.5 m/px over Le Pont.** *"Mi piacerebbe vedere la
risoluzione 0,5m/px in una porzione non grande come ad esempio i dintorni di Le Pont."* It is
in the tree, off by default, and **not published**.

- **The clip.** Sheet `ORTO2024_ED50_005_5943` - Le Pont's own 1:5.000 element - is
  **10,200 x 10,201 px at 20 cm, 2.04 x 2.04 km, RGB + alpha, EPSG:23032**, 419 MB of TIF
  inside a 407 MB zip, with `CC_BY_Ortofoto_2024.pdf` shipped in the same zip. Averaged down
  to 0.5 m (4,080 x 4,080), alpha dropped, WebP q75: **2.92 MB, 0.175 bytes/px** - which
  makes the whole park at 0.5 m about **500 MB**, against the 602 MB the earlier JPEG-based
  estimate gave.
- **`src/orthotier.js`**, deliberately shaped like `heighttier.js`: holders bound at compile
  time, a rectangle in local metres, and **nothing fetched until something asks**. `terrain.js`
  applies it one line after the satellite mix, faded out by distance from the camera
  (`ORTHO_NEAR_M` 300, `ORTHO_FAR_M` 650) and by a margin fade so the rectangle's own edge is
  not a straight line on the hillside. Dev key **'O'** downloads it on first press and then
  cycles the mix.
- **Registration is right, and that is the thing that could most easily have been silently
  wrong.** From 250 m the photographed hairpins of the Valsavarenche road sit under the road
  vectors drawn from OSM (`ortho-air-on-lepont.png`). No reprojection was needed anywhere:
  the source is published in EPSG:23032.
- **The gain is measured, not chosen.** Over this clip's own rectangle the basemap means
  rgb(118.2, 118.5, 95.3) and the photograph rgb(129.4, 123.9, 106.2), so `ORTHO_SCALE` is
  1.87 / 1.22 = **1.54**. It still comes out brighter in practice - the lower half of the
  frame gains **23.7 levels of luma** at eye height - so this wants the user's eye on it.

**What it is worth, measured on the same camera with the term on and off:** the ground's
contrast in the lower half of the frame goes from **13.1 to 23.4** standing at the trailhead
and from **23.5 to 37.2** from 250 m up, and 60-67% of the frame's pixels change.

**Where it pays and where it does not, which is the real finding.** At 40 m up looking down
45 degrees Le Pont is *readable* - road, roofs, car park, the bridge over the torrent,
individual larches, the long shadows of the buildings (`osweep-40m-45.png`). **At 1.7 m eye
height it is a smooth blur**, and that is arithmetic rather than a defect: a screen pixel
subtends about 0.00087 rad here, so it covers 0.5 m of ground - one texel - only at **574 m**.
At 3 m it covers 2.6 mm, so the photograph is magnified about 190x and you are looking at two
texels blended across the whole lower frame. The grazing angle then finishes the job.

So the overlay wants a NEAR fade as well as a far one - off where its own texels are magnified
past use, letting the procedural ground and the grass keep the last few metres - and that knob
does not exist yet.

**And the double shading is real and visible.** The flight ran 21 August to 2 November 2024, so
the sun was low: a third of this clip is in a hard shadow that is baked into the photograph and
then lit again by the app's own sun. It is obvious in the plan view (`oiso-plan.png`). Nothing
has been done about it yet; `tools/dev/solve-albedo.mjs` is the tool that de-shaded the
Sentinel-2 basemap and the same treatment is what this needs.

**2026-08-20, the switch reaches the HUD, the link and the browser - and two OLD failures fell
out of a slow test.** The user: *"vince la foto, e' piu' recente. Puoi anche aggiungere
l'abilitazione comando 'O' all'HUD e salvarla nei dati del browser e nel link generato."*

- **`ICE_PHOTO_MIX` is 1.** The photograph takes the ice inside the outline too, not only the
  ground outside it. Within 1,700 m the firn line, the live-ice grey and the moraine do not
  show; beyond the fade they return; 0 restores exactly what shipped.
- **`Orthophoto (O)` is in the env controls**, off by default, and the key is now a shortcut
  FOR THE CHECKBOX rather than a second way in - four entry points, one piece of state.
- **It travels in the link**, which puts it on the other side of a line this project drew
  deliberately: Terrain, Models and ground cover are saved but never shared, because they
  describe the sender's machine. This one describes what the ground IS, like time of day and
  weather, and those already travel. Written into `viewstate.js` so the distinction survives.
- **`tools/test-ortho-viewstate.mjs`** holds the four entry points together and checks the
  part that matters most for an optional download: **off by default with ZERO network
  requests** until it is asked for. 207 s, so it went straight into the slow list by the
  runner's own rule - and the cost of that is stated there rather than discovered later.

**Its first version passed by accident.** `page.goto()` to a URL that differs only in its hash
is a same-document navigation: nothing re-runs, `window.__pngp` survives, and the two reload
checks were measuring the previous page. One of them then failed for the right reason and I
spent time hunting an app bug that was a test bug.

**Then `test-viewstate` failed, and it was not today's work.** Proved rather than assumed:
`git stash`, run at the previous commit, identical failure. Two things were wrong with it, both
the same shape - **a slow test that is never asked for is a test that has stopped running**:

1. **A 120 s timeout that had quietly become impossible.** It opens a SECOND page to follow a
   shared link, and two WebGL contexts on one software rasteriser do not share it: measured,
   the first page spawns in **13 s and the second in 528**. `bringToFront()` does not help
   (240 s, still timed out), so it is contention and not tab priority - the §13.11 case, and it
   says nothing about two tabs on a real GPU.
2. **A hardcoded local coordinate 4.9 km stale.** It expected the first visit within 200 m of
   `z = 17570`; Le Pont is at `z = 12682`. Local metres are relative to the bbox centre, and
   the bbox moved south on 2026-08-18 - so that pair went stale that day and nobody knew. It
   now reads the trailhead from `poi.json`, the same source the viewer spawns from.

**2026-08-20, the overlay reaches further, and THREE WRONG DIAGNOSES about a blue glacier.**
The user asked for two things: mix our ice with the photograph, and let the photograph start
further out. The second is done. The first turned out to be aimed at something that was not
happening, and the finding underneath it is more interesting than the request.

**The reach: 300/650 m becomes 900/1,700 m.** The ceiling is not taste, it is the atlas - a 3x3
block guarantees the camera only ONE ring of margin, 2,000 m, so a fade finishing beyond that
would show the atlas's own edge. Going further wants a 5x5 block (5,020 px, ~100 MB of video
memory) or a second coarser level for the far field, which is the usual answer and is not
built. Resolution is NOT the limit: a 2 m texel shrinks to one screen pixel only at ~2,300 m,
and the 10.24 m satellite it replaces not until 11,800 m.

**`orthoSample()` replaces `orthoAlbedo()` + `orthoAmount()`** - they were two functions
fetching the same texel, which is pure waste on every ground fragment.

**Now the three wrong diagnoses, in order, because the sequence is the lesson.**

1. *"The photograph repaints the glaciers."* **False, and structurally impossible**: the ice is
   applied AFTER the overlay in `terrain.js` and wins outright. The screenshot that prompted it
   came from the atlas while it was still mis-centred by 2 km - the right photograph on the
   wrong ground. Said before reading the order of operations.
2. *"It leaks through the ice's slope fade."* Plausible - `iceHere` carries `iceSlope`, which
   holds back to `ICE_ON_CLIFF` on steep ground - and wrong. Gating the photograph by
   `1 - iceHere` changed nothing visible.
3. *"Then gate on the mask instead of on `iceHere`."* Also nothing. What that DID produce is a
   number worth keeping: over the ground the camera sees on that glacier, **only 42% of the icy
   cells read 1.0** - 627 at full coverage against 709 spread from 0.05 to 0.95. The mask is
   20.5 m and stores COVERAGE, so most of a ragged glacier is partial, and any gate weighted by
   the mask's value lets most of the photograph in anyway.

**What settled it was a marker, not another theory.** Painting the ground magenta wherever
`icePresence > 0.5` showed the ice mask covering only the LEFT of the frame while the blue sat
in the CENTRE. **The blue is not on our glacier at all**: it is the 2024 photograph showing ice
and firn where the OSM outline says there is none. The outline and the photograph disagree
about where the ice ends, and the photograph is fifteen years newer.

So `ICE_PHOTO_MIX` exists, works, and has one door - `terrain.js` holds the photograph out
wherever the outline claims ice at all (`icePresence`, a smoothstep so the moraine band is not
special-cased) and lets it back in at the knob, with **0 restoring exactly what ships today**.
It just does not address what the user was looking at. That question is open: accept the
photograph as the more current claim, hold the outline and suppress the photograph beyond it
too, or leave both and only damp the colour - the cyan is partly `ORTHO_SCALE` 1.54
multiplying an already-bright subject.

Fast suite 14/14.

**2026-08-20, THE ATLAS IS BUILT AND PROVEN on a 3x3 block around Le Pont** - the user's own
order, atlas before data: *"Prima l'atlante, poi i dati"*, so that 42.7 GB is not spent on a
mosaic that turns out not to work. It works. `tools/build-ortho.mjs` and the rewritten
`src/orthotier.js`, fast suite **14/14**, still off by default and still not published.

- **The pipeline fetches, resamples and DELETES, one sheet at a time.** Nine sheets: 4.2 GB
  fetched across two runs, **2.04 MB shipped**, and the disk ended exactly where it started.
  That is not tidiness, it is the only way this can run at all - 42.7 GB against 35 GB free.
- **The atlas is a 3x3 block of sheets around whichever sheet the camera stands on**: 6,040 m
  square, 3,020 px at 2 m/px, ~36 MB of video memory, **redrawn in 29 ms** and only when the
  camera crosses a sheet boundary - about every 2 km of walking. The shader did not change:
  `uOrthoRect` stopped meaning "the clip" and started meaning "the atlas".
- **Missing coverage costs nothing and needs no second mask.** A cell with no sheet is left
  TRANSPARENT when the atlas is drawn, and `orthoAmount()` multiplies by that alpha. Walking
  west off the built block took the atlas from 9 cells to 6 with 3 empty, and the ground
  simply went back to the satellite.
- **No seams.** A 900 m view spanning several sheets shows the torrent, the trail and the road
  hairpins sitting on their photographed counterparts with no line anywhere
  (`atlas-multisheet.png`).

**TWO BUGS FOUND BY MEASURING, both the same mistake in different clothes.**

1. **The sheets are 2,040 m wide and 2,000 m APART** - they overlap by 20 m a side, which is
   ordinary in an orthophoto delivery and was not in my assumption. Taking the spacing to be
   the width put several sheets in one cell and the atlas found **four of nine**. The overlap
   itself needs no blending: those 20 m are the same ground twice, so sheets are laid at
   `stepM` and drawn at `sheetM`, one over another.
2. **A sheet's index and a point's index are DIFFERENT QUESTIONS.** A sheet is indexed by its
   upper-left corner, where the offset is an exact multiple of `stepM`; a point belongs to the
   nearest sheet CENTRE, which is half a sheet away. One function answered both, and 0.864
   rounded to 1: Le Pont was assigned to the sheet next door and the whole block was built
   2 km east of the camera. **It still looked like a photograph**, which is why it needed a
   number - the camera now sits 62% across its own atlas instead of 29%.

`build-ortho.mjs` asserts every sheet onto the grid to within a metre, so if that assumption
is ever wrong again it stops there rather than in a shader drawing ground 2 km from where it
is. And it PRUNES files the manifest no longer names: three orphans survived the grid fix, and
everything under `public/` is published, so an orphan is not clutter on a disk - it is a file
on the site that nothing fetches.

**One thing the photograph does that nobody asked it to: it repaints the glaciers.** At 20 cm
the real ice is vivid blue, and the overlay replaces the ground colour outright - so where it
covers a glacier it overrides the **neutral white the user chose from four renders** on
2026-08-19. Visible in `atlas-seam-lepont.png`. Nothing has been decided about it.

**2026-08-20, 2 m/px CHOSEN, and the park measured against the actual files.** *"Penso che i
2m/px siano piu' adatti e ci fanno risparmiare un sacco di spazio. Proviamo ad stenderlo su
tutto il parco? Ce la facciamo con github?"* `tools/dev/probe-ortho-coverage.mjs` answers it
against the live services rather than against a coverage statement - one GetFeatureInfo per
sheet cell to get its code, then one HEAD on the 2024 zip, because "the region says it covers
its territory" and "these bytes are there" are different claims.

**The method validates itself first:** counting the park on a 100 m grid inside
`tools/park-boundary.geojson` gives **710.5 km2** against the official ~710.

| | |
|---|---|
| sheets the park touches | 210 |
| sheets that exist and answer 200 | **129** |
| park covered | **449.4 km2 = 63.3%** |
| NOT covered | 261.1 km2, the Piemonte side, in one contiguous block |
| to FETCH | **42.7 GB** of zips, mean 331 MB, biggest 426 MB |
| to SHIP at 2 m/px | **26 MB** over 129 files of ~202 kB |
| measured throughput | 8.76 MB/s -> about **1h20 of downloading**, ~2h end to end |
| free disk | 35 GB, so 42.7 GB does NOT fit - fetch, resample, DELETE, one sheet at a time |

**So GitHub is the easy part and was never the constraint.** 26 MB takes the published site
from 31.27 MB to about 57 MB against a 1 GB Pages limit, and 129 files of 202 kB is nothing.
The constraints are somebody else's bandwidth, this machine's disk, and the code.

**The code is the real work, and the current module cannot do it.** `orthotier.js` holds ONE
rectangle and ONE texture. 129 sheets over 449 km2 need a moving ATLAS: one 2048 px texture at
2 m/px covers 4.1 km for 17 MB of video memory, refilled from the nearby sheets as the walker
moves - which is ample, since the overlay only shows within ~650 m of the camera anyway. A
single texture for the whole covered area is not an option: at 2 m/px it would be 19,950 x
15,700 px against a 16,384 limit, and 800 MB of video memory if it fitted.

**And the missing 37% is a straight line through the middle of a national park**, because that
is where the regional border runs. Two things make it liveable rather than fatal: the fade the
module already applies at a rectangle's edge, and the standing decision that **asymmetric
resolution between the two sides of this park is accepted rather than levelled down** - the DEM
has done exactly that since phase 0. The Piemonte side has a 2024 AGEA orthophoto at 0.32 m on
a CORS-open WMTS; only its licence is unresolved, and that is a letter, not a technical problem.

**2026-08-20, THREE RESOLUTIONS, and the brightness is approved.** *"La luminosita' mi sembra
ok. Pero' vorrei vedere anche una prova con una risoluzione minore, sia a 1m/px che a
2m/px."* So `ORTHO_SCALE` stays at the measured 1.54, and `ortho.json` is now a **levels[]**
manifest - coarsest first, the same convention `basemap.json` and `heighttier.json` use. Each
level is resampled **from the 20 cm original**, not from the level above it, so none of them
carries another level's blur.

| m/px | pixels | this clip | whole park (710 km2) | one valley (100 km2) |
|---|---|---|---|---|
| 2 | 1,020 | **0.24 MB** | 41 MB | 6 MB |
| 1 | 2,040 | **0.89 MB** | 151 MB | 21 MB |
| 0.5 | 4,080 | **2.92 MB** | 498 MB | 70 MB |

Bytes per pixel RISES as the resolution coarsens - 0.175, 0.213, 0.232 - because averaging
concentrates detail and leaves the encoder less redundancy to find. The total still falls
fourfold per halving, which is what matters.

**'O' now steps through them at one camera**: 0.5, then 1, then 2, then off, and back. One
session and one scene, because two renders of "the same" view differ in the light, the animals
and the gust as well (PROGRESS-ARCHIVE 2026-08-10). Each level downloads once and is kept - the
height tier's own lesson, that a knob costing a download every time it is touched is a knob
nobody touches.

**What each level actually buys, measured** at 40 m over Le Pont as the mean absolute Laplacian
of the frame - detail, as something countable, which unlike contrast is not moved by exposure:

| level | detail | gain over the satellite | contrast |
|---|---|---|---|
| off, the 10.24 m satellite | 2.20 | - | 15.3 |
| 2 m/px | 3.06 | **+0.86 (51% of the total)** | 26.2 |
| 1 m/px | 3.36 | +1.16 (69%) | 29.6 |
| 0.5 m/px | 3.88 | +1.68 (100%) | 31.5 |

So **the first step is the one that pays**: 2 m/px buys half the improvement for **8% of the
bytes**, and 0.5 m costs 12x more than 2 m for twice the gain. Read those ratios as a floor
rather than the truth, though: the ground cover's sprites contribute the same high-frequency
energy to all four frames, so the photograph's own share is larger than the numbers show.

**2026-08-20, they chose the route: HOST A CLIP OURSELVES**, as an optional on-demand tier
rather than weight in the first load - the same arrangement the 5 m terrain tier already has.
It is the only route with a clean licence AND the native CRS, and the reconnaissance was
carried to the point where the acquisition is proved scriptable:

- **Valle d'Aosta Ortofoto 2024.** GSD **20 cm**, 4 bands RGBI (Leica DMC4, CGR for RAVdA
  under the AGEA framework), flown 21/08-02/11/2024, **whole region**, TIF on the 1:5.000
  cut, and republished by SCT in **EPSG:23032 - this project's own CRS**, so there is no
  reprojection and none of the 215 m datum shift at all. Licence **CC-BY**
  (`CC_BY_Ortofoto_2024.pdf`), which is the same footing as the DTM this project already
  ships (ARCHITECTURE §3).
- **Two public endpoints, no token, and the second one was the open question.** The sheet
  code comes from the QDU WMS by GetFeatureInfo on
  `Quadri_dUnione__Ortofoto_2012_scala_5000` - the 2012 index, because 2024 has none
  published yet and the 1:5.000 cut is the same - and the file is at
  `geoprodotti.regione.vda.it/download/ORTO2024_ED50_005/ORTO2024_ED50_005_<tavola>.zip`.
  Verified end to end: Cogne is sheet **7153**, and that URL answers **200 with
  397,640,763 bytes**. A 1:5.000 element is 3 x 2 km, so the source runs **~66 MB/km2** -
  the VdA side of the park is tens of gigabytes to fetch ONCE, and none of it ships.
- **What would ship, at 0.212 bytes/px** (measured on six real orthophoto tiles of mixed
  terrain re-encoded at JPEG q80; range 0.10-0.30, and WebP would be smaller):

  | | 2 m/px | 1 m/px | 0.5 m/px | 0.2 m/px |
  |---|---|---|---|---|
  | whole park, 710 km2 | 38 MB | **151 MB** | 602 MB | 3.8 GB |
  | VdA half, 350 km2 | 19 MB | **74 MB** | 297 MB | 1.9 GB |
  | one valley, 100 km2 | 5 MB | 21 MB | **85 MB** | 530 MB |

  GitHub Pages publishes at most 1 GB and `deploy.sh` rewrites the whole site on every push,
  so the FILE COUNT matters as much as the total: **1024 px tiles are 16x fewer files than
  256 px ones** at the same coverage and still only ~222 kB each.

**The one thing self-hosting fixes for free**: the double-shading problem above. A streamed
tile arrives lit and there is nothing to be done about it at runtime, but a clip we process
ourselves can be de-shaded to albedo offline - which is exactly what was done to the
Sentinel-2 basemap, with a tool that already exists (`tools/dev/solve-albedo.mjs`).

**The one thing it does not fix: the Piemonte half of the park.** The VdA product stops at
the regional border, and the only Piemonte source found is AGEA with its ambiguous licence.
So a decision is still owed on whether the ground changes resolution at the watershed - which
would not be a first here, since the DEM already does.

Everything else below was the state before that request, and none of it has been asked for:

- **In the ice:** crevasses - noise bands running across the slope, and the term that pays
  up close, where the firn/live-ice split pays from a distance. A bergschrund shadow at the
  headwall. Putting any of it where the real ones are needs data this project does not have.
- **The two defects the white ice exposed**, both in the open debts at the end of this file,
  both older than the ice and neither touched: the LOD trees standing where there is no wood,
  and a terrain tile skirt visible at eye height. These are DEFECTS, not topics - they are
  the honest answer to "what should we do next" if the user has no preference.
- **The refuge has no High level of its own.** The tricolour on the bivouac is the only thing
  the Models control adds today.

Run the FAST suite before any publish - the user's standing rule - and expect 14 tests, about
11 minutes.

### DONE 2026-08-20: a black screen that said nothing

The user opened the viewer, saw black, and sent the console: Firefox had lost its GL driver
(`FEATURE_FAILURE_EGL_NO_CONFIG`, "Exhausted GL driver options"). Restarting the browser fixed
it - but the first thing the silence cost was the assumption that the change under test had
broken something, and the second was my own time proving it had not.

**A black screen is the one failure this app could have that said nothing at all.** Everything
else degrades and announces it: no tier, no satellite, no orthophoto, no audio. So
`new THREE.WebGLRenderer()` is now wrapped, and a failure paints a message over the page:
what is needed (WebGL 2), what usually causes it, that restarting the browser fixes it more
often than anything else, and the reason in a box you can copy.

**Getting the REASON took a second look.** three throws `Error creating WebGL context.` and
stops there - the useful text is on a `webglcontextcreationerror` event that nobody listens
for. So `webglFailureReason()` asks for a context on a canvas of its own purely to catch that
string. With a plain WebGL2 context obtainable it says so instead, because then the failure is
in what the renderer asked for ON TOP (antialias, logarithmic depth buffer) and that is a
different hunt.

`tools/test-nowebgl.mjs` is in the fast suite and costs **1 second**, because nothing renders:
Chromium is launched with the 3D APIs disabled and the test asserts the page SAYS so - a box
really on screen, opaque, naming WebGL, and carrying the browser's own reason. The message is
styled inline on purpose; a stylesheet is one more thing that can be missing on the day
something has already gone wrong.

### DONE 2026-08-20: the two defects the white ice exposed, and neither was what it said

Both were pre-existing and both were mis-attributed in the 2026-08-19 note that listed them.
Recorded here because the *diagnoses* are the reusable part - the fixes are one line each.

**1. Trees standing where there is no wood. The mask was innocent; `step()` was not.**

The note guessed a coarse mip bleeding a wood across a boundary. It is not: the rule was

    float exists = step( draw, wood );

and `step(edge, x)` is **`x >= edge`**, so a slot whose own random draw is EXACTLY 0.0 grows
a tree where the canopy mask reads 0.0 - which is anywhere. And exact zero is not rare here.
`vegHash` was written to avoid `sin()` because world coordinates reach +/-42 km (the comment
above it says so), but it still loses most of its range to float32 at that scale:
`tools/dev/probe-treeline.mjs` measures **5,220 distinct values over the 16,997 slots inside
the draw radius above the Gliairetta, nine of them exactly zero**, with the nearest wood
**3.08 km** away. Nine conifers on a glacier, of which the user saw three.

The fix is the exclusive form, `1.0 - step( wood, draw )`. On screen, the two conifers in the
frame go and nothing else in it moves (`treeline-before.png` / `treeline-after.png`).

**The same defect was in `src/groundcover.js`**, `step( coverHash( coverCell ), mine )`, and
worse: `mine` carries the `(1.0 - onIce)` factor, so a zero hash puts a blade of grass or a
scree cone ON THE GLACIER. That is the same class the ice was cleared of on 2026-08-19 by
making the shader ask the ice mask - this was the leak that survived it, because it never
consulted the mask at all.

**Two false starts worth not repeating.** The CPU replication that found it first reported
**zero trees drawn**, which is precisely what a clean glacier would report: `fast-png` does
not unpack a depth-4 PNG (5,799,936 bytes for 11,599,872 pixels, two samples to a byte), so
every sample past the first row was `undefined`, and NaN fails every comparison. And the
comment written to explain the fix contained a BACKTICK, inside a GLSL block that is a JS
template literal - the page died with `Unexpected identifier 'wood'`, which reads like a
shader error and is not one. Both are now landmines (ARCHITECTURE §13.18, §13.19).

**2. The tile skirt at eye height. It IS the skirt, and it was filling nothing.**

The note called it "`SKIRT_DEPTH_M`'s curtain seen edge-on at a tile boundary", which is the
right object and the wrong mechanism, and the difference is the whole fix.

- `tools/dev/probe-skirt-ab.mjs` draws the same frame twice, with and without the skirt
  INDICES - every tile geometry lists its 6,144 surface indices before its 768 skirt ones, so
  a draw range is a free A/B with no reload and no rebuild. The pale quadrilateral goes, and
  **the surface behind it is continuous**: there was no gap there.
- A gap needs a T-junction, and a T-junction needs neighbours of different depths.
  `tools/dev/probe-lod-neighbours.mjs` replays the quadtree at that camera: **268 tiles, 21
  within a kilometre, every one of them depth 7.**

So the comment on `SKIRT_DEPTH_M` was wrong where it mattered: *"invisible because it only
ever shows through a gap it is filling."* A skirt is a vertical curtain hanging in open air
under a sheet with nothing behind it. Wherever the line of sight passes below the surface at
a border - across any hollow, which on a glacier is most of the way you walk - its face is in
view, 150 m of it.

**Shrinking it was measured and rejected before it was written.**
`tools/dev/probe-skirt-depth.mjs` computes the sag a straight coarse edge leaves against the
real surface, per level, over the whole heightfield:

| depth | tile cell | worst sag | 99.99th |
|---|---|---|---|
| 7 | 20.5 m | 171.7 m | 47 m |
| 5 | 81.9 m | 299.5 m | 128 m |
| 3 | 327.7 m | 579.2 m | 372 m |
| 0 | 2,621 m | 1,603.4 m | 1,604 m |

150 m is not over-sized at the fine end - it is slightly SHORT - and it is short by an order
of magnitude at the coarse end. So the answer is not a smaller curtain, it is **fewer of
them**: a skirt is only ever needed where the depths differ.

`splits()` is now one function shared by the descent and by a new `leafDepthAt()`, which
walks the same rule down to a neighbour it never visits - so the two cannot drift apart. A
tile whose four neighbours are all its own depth gets `SKIRT_MIN_M`, a 1 m hem (not zero: the
shared edge is reached by two different arithmetic paths and float32 need not agree to the
last bit). Measured: **the full curtain still goes on 56% of drawn tiles at eye height on the
ice, 62% from 4,000 m and 74% from 8,000 m** - so the test is doing real work rather than
switching everything off - and the three standing glacier vantages come back **identical to
the pixel** against the 2026-08-19 build (mean |dR| 0.00, 0.03, 0.02).

Fast suite 13/13, and `test-groundcover` and `test-height-tier` were run out of the fast set
on purpose: this touched what both of them cover, which is the "esigenza di (pre) debug" case
in the standing rule.

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

## PUBLISHED (2026-08-20, second push): both defect fixes

The user ran `tools/dev/deploy.sh` themselves after the fast suite went 13/13 and
`test-groundcover` / `test-height-tier` passed out of the fast set. The push was the JS
bundle and `index.html` again - `index-CoTSuToM.js -> index-B2lVGrR9.js` - and **first load
is still 31.27 MB over 21 requests**, unchanged for the third build running.

Verified against the CDN:

- `tools/verify.mjs`: WebGL2, no console or page errors.
- **Both new rules are in the published bundle** and neither old one survives: one occurrence
  each of `1.0 - step( wood, draw )` and `1.0 - step( mine, ...`, and the single remaining
  `step( draw, wood )` in the file is inside the comment that explains why it went. Grepping
  the bundle is the check that a screenshot cannot do (§13.17).
- **The two defect cameras, on the live site.** `live-treeline.png` at 45.52233N 7.05259E:
  no conifers on the firn. `live-skirt.png` at 45.51249N 7.01452E looking east at eye height:
  no pale quadrilateral, and the ice reads as one continuous surface - so removing the
  curtain did not open a crack in its place, which was the only real risk in that change.

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
- ~~**Distant trees stand where there is no wood.**~~ **DONE 2026-08-20**, and it was
  not the LOD mip the entry below guessed - it was `step()`'s inclusive comparison against a
  float32 hash that is sometimes exactly zero. See the 2026-08-20 entry at the top. The
  original report, kept because its measurements were right even where its diagnosis was not:
  **Distant trees stand where there is no wood, and the ice made it obvious.** Measured
  2026-08-19 from the firn basin above the Gliairetta (45.52233N, 7.05259E, 3,315 m): three
  conifers on the ice. They vanish when `vegetation-lod` alone is hidden, so they are the
  DISTANT tree layer; the canopy mask reads **zero over a 3.2 km square** around that camera
  and `vegetation.nearInfo()` reports an empty near set. So the fine layer is right and the
  LOD layer is placing trees off the mask - most likely sampling it at a coarse mip, which
  bleeds a wood a kilometre away across a boundary. Pre-existing, and invisible until the ice
  became a white surface to stand them on.
- ~~**A terrain tile skirt shows at eye height on the ice.**~~ **DONE 2026-08-20** - the
  skirt was real and it was filling nothing; skirts are now drawn only where a neighbour's
  depth differs. The original report:
  **A terrain tile skirt shows at eye height on the ice.** Same session, standing at
  45.51249N, 7.01452E (2,918 m): a hard-edged pale quadrilateral in the lower frame that
  survives ground cover off and water hidden, and **disappears when the camera lifts 25 m** -
  which is the signature of `SKIRT_DEPTH_M`'s curtain seen edge-on at a tile boundary. Also
  pre-existing: the old glacier sheet was drawn 1 m above the ground and hid it.
- **The 5 m tier is 51.03 MB** and the push warns about it. GitHub recommends under
  50, its hard limit is 100. Not a wall today; the next time that file grows it is.
