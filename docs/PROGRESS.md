# Progress log

Read this first at the start of each session. Update it before ending one.

## Status as of 2026-08-10

**The footsteps were judged by ear, three real faults came back with the verdict,
and after the fixes the user listened again and accepted: "ascoltato, ora è ok".**
The rest of the mix - the surfaces, the level, the cadence - was accepted on the
first listen: "il resto mi pare a posto". Rainstorm is quiet and they explicitly
let it stand. **Nothing about the audio is open**, and with it phase 6 is finished
for good: everything in it has now been judged by ear or by eye and approved.

Their words, and what each turned out to be:

1. *"il rumore dei passi continua un po' dopo che mi sono fermato"*
2. *"quando spingo G sento il rumore di passi anche se non mi muovo e dopo il
   richiamo animale"*

### One cause, and it is the one this project keeps rediscovering

Both were the same mistake: **`audio.js` was working out whether you are walking
from the camera's own displacement**, smoothed over 0.3 s. That is an inference,
and it is wrong in both directions.

- **On a stop** it lags. 4 m/s decaying with a 0.3 s time constant takes
  `0.3 * ln(4 / 0.4) = 0.69 s` to fall under `STEP_MIN_MPS`, and the scheduler
  looks 0.2 s ahead, so a stop kept sounding for about **0.9 s - very nearly two
  more steps** - while the camera itself had stopped dead in the same frame the
  key came up.
- **On a teleport it is not lag but fiction.** The dev 'G' key is
  `camera.position.set()` to 18 m from an animal that was a kilometre away; one
  frame of that is a four-figure speed, and smoothed it decays back through the
  walking gate over about **two seconds of footsteps standing still**. Same for a
  POI fly-to and for a restored view. And the user heard it *after the animal
  called*, which is exactly the order: 'G' teleports, the marmot whistles at the
  arrival, and then the phantom walking runs on underneath it.

This is the **third** time the same shape of bug has been written here - the
stale-camera alarm on 2026-08-05, `sampleRenderedHeightfield()` clamping instead
of reporting off-map, and now this. **A camera position is a position. It is not
a distance, not a speed, and not an intention.**

### The fix: ask the thing that knows

`src/controls.js` now measures **what its own movement code actually moved the
camera by** this frame and publishes it as `controls.travelMps` - read back off
the camera around the movement block, horizontally only (in walk mode the y is a
clamp to the terrain, so a 3D measure would report the hill rather than the
walking). It is zero on any frame this class did not move on, including one where
a flyTo has the camera instead. `audio.js`'s gate is now
`controls.mode === 'walk' && controls.travelMps > STEP_MIN_MPS` and reads the
camera for nothing at all.

Two more pieces, because the gate alone does not close either hole completely:

- **Booked steps are cancelled.** A footfall is scheduled up to
  `STEP_LOOKAHEAD_S` (0.2 s) before it is due, so releasing W can leave one on the
  books. `cancelPendingSteps()` stops any source whose start time is still in the
  future - it therefore never plays at all, so there is no click - and decrements
  `stepsPlayed`, which now means *steps that sounded*. Steps already sounding are
  left alone. A last stride would be defensible if the camera decelerated; it does
  not, so silence is the honest match.
- **Airspeed rejects teleports.** `speedMps` still comes from the camera (nothing
  else knows how fast a flyTo is going), but a value above `TELEPORT_MPS` = 200
  m/s now **resets it to zero** instead of being smoothed in. Fly mode boosted is
  60 x 2.5 = 150 m/s, so there is a third of headroom, and this is a speed rather
  than a distance - a slow frame cannot trigger it, only a discontinuity can.
  Without this, arriving somewhere swelled the wind for ~2 s. Nobody reported that
  one; it was next door to the reported bug and would have outlived it.

### Measured

Two new offline cases in `tools/test-audio.mjs`, plus one live. Each runs a single
continuous scene and splits it at a moment, because the whole question is what
happens *after* one:

- **letting go of W**: 24 steps walking, **0** after, and the footstep band in the
  tail is **x0.036** of the same buffer's walking half;
- **a 1.2 km teleport standing still**: **0** steps, airspeed **0.0 m/s**, soft
  band **x0.98** of standing still - i.e. nothing happened at all;
- **in the running viewer**: five 'G' presses, each over a kilometre, with nothing
  held down - **0** footsteps across all five, while the marmot and chamois
  whistles still fire.

85 checks pass, and `test-wildlife`, `test-birds` and `test-viewstate` still do.
The bundle is **793.34 kB raw / 222.29 kB gzipped**, which is **+0.48 kB** for
everything today - measured against a build of HEAD, not against the 774 kB figure
in the 2026-08-07 section, which had already gone stale for reasons unrelated to
any of this. Worth remembering before quoting a bundle number: rebuild the
baseline.

### Two method notes, and both are the measurement being wrong first, again

**A counter sampled at the split counted a step that never sounded.** `before` was
read at the moment of the stop, when `stepsPlayed` still included the booked
footfall that the very next tick cancels - so "steps after the stop" came out as
**-1**. It is sampled after that tick now, which is exactly "steps that sounded up
to the split".

**A separate standing-still render is not the same scene.** The stop's tail
measured **x1.20** the rms of a standing render and the check failed - but the
gust is a random walk, so a run that scheduled two dozen footsteps has consumed a
different stretch of the RNG, and two wind beds with nobody walking in either sit
20% apart on their own. Against **the walking half of its own buffer** - same
gust, same stream, the only difference being the feet - the tail reads **x0.036**.
The 2026-08-07 note said a reference has to be the same scene; this says the same
scene includes the same draw of the random numbers.

### And then a third, from the same listen: everything was a second late

*"Il rumore dei passi parte con 5 secondi di ritardo."* This one was **not** in
the footsteps, and **not** caused by the fix above - `git show` confirms the
commit never touched a line of the clock. It was in `songNow()`, and it applied
to **every sound in the viewer at once**:

```js
if (songT0 == null) songT0 = ctx.currentTime;      // captured at the FIRST call
return Math.max(ctx.currentTime, songT0 + songClock);
```

`songT0` is captured at the first call, but `songClock` has already been
accumulating - the seeded first tick, plus however long the frame that started
the audio took. That head start then became **permanent**, because `max()` can
only ever push the clock further ahead, never pull it back. Every sound was
scheduled that far after the thing that caused it.

Measured **1.12 s headless, dead constant over a whole session**, and the user
heard about five seconds on real hardware - their first frame after the click,
with the terrain still loading, is where the difference lives.

The fix is to stop pretending one clock serves both contexts. An
`OfflineAudioContext` - the only kind with `startRendering` - leaves
`currentTime` at 0 for the whole driving phase, so accumulated dt is the only
clock it has, and that path is unchanged. A **live** context has a real clock,
and it is the one the hardware will play against, so it is now simply returned.
Skew measured **0.0000 s** afterwards.

**Why nothing caught it**: no count, level, band ratio or cadence in
`tools/test-audio.mjs` changes if you schedule the whole soundscape a second
late. It is only audible as *latency*, and only against an action - which is why
it surfaced the day footsteps did, and why the wind, the water and the birds have
been a second late since 2026-08-05 with nobody the wiser. `diag.clockSkew` now
reports it, the live suite asserts it is under 50 ms, and
`tools/dev/probe-step-delay.mjs` is the instrument that found it.

**One more measurement note, and it is the same lesson as yesterday's:** the
probe first reported the first step scheduled 690 ms after W, from a poll loop in
node - most of which was the CDP round trip **measuring itself**. Moved inside the
page it reads 1,141 ms, which sounds worse until you also measure the frame rate:
headless renders this scene at **1.2 fps**, so that is **1.4 frames**, and the
audio tick is gated on frames. The floor is one frame plus up to 185 ms; at 30 fps
that is about a fifth of a second. Measure the clock you are quoting, and quote a
latency in frames when a frame is what gates it. (The same 1.2 fps is why the
cadence reads ~1 Hz in this harness rather than 2: a tick that arrives after the
next step was due re-arms instead of firing a burst of the ones it missed. Also
not a fault.)

### Next steps
1. ~~Ask the user to listen to the footsteps~~ - **CLOSED 2026-08-10.** Accepted
   apart from three faults; all three fixed and then **confirmed by ear the same
   day: "ascoltato, ora è ok"**. Nothing about the audio is owed to anyone.
2. **Phase 7 polish** is the only phase left: LOD popping/geomorphing, one-texel
   normals at any depth, the bundle (793 kB / 222 kB gzipped), and the mobile pass
   - pointer lock + WASD has no touch equivalent, and neither does a keyboard mute.
3. **Republish** - the live site is several commits behind, since 2026-08-05.
   `tools/dev/deploy.sh` does the whole thing.
4. **A new topic the user asked to record, theirs to open: "la neve che si
   deposita"** - snow that settles. Nothing was decided and nothing should be
   built on it unprompted. Context for when it is opened: `weather.js`'s snowfall
   is *falling* snow plus a `mod.snow` weight that other modules read (the terrain
   whitens, the footsteps crunch, the master lowpass muffles), but there is no
   accumulation anywhere - nothing settles, deepens, lies in the lee of a rock,
   melts, or stays on north faces after the sky clears. The footstep surface is
   the one place it already half-exists: `SURFACES` picks snow from `mod.snow` or
   from being above the nival line, which is a state, not a history.
5. Deferred by the user, do not re-raise unprompted: the satellite/orthophoto
   basemap.

### Republished, and verified as the real thing

The user ran `tools/dev/deploy.sh` themselves at the close of 2026-08-10, so the
live site is level with `243484f` - eight commits' worth, from the songbirds
through today's three fixes. **Verified rather than assumed**: the served
`index.html` was polled until it referenced the bundle that had just been built
(`index-CNs4x57J.js`) rather than merely returning 200 - it was still serving the
old one on the first attempt and took **16 s** to turn over - and then
`node tools/verify.mjs https://dev-lop77.github.io/pngp-viewer/` was run against
the public URL: WebGL2, context not lost, **no console or page errors**, and the
screenshot shows the Le Pont spawn with terrain, trees, the Savara and the full
HUD. (`tools/test-viewstate.mjs` and anything else reading `window.__pngp` still
cannot be pointed at the live site - Vite strips that handle from a production
build.)

### The UI was part Italian, and it was not one line

The screenshot caught `Cerca un luogo...` in the search box, which I reported as
"the only Italian string, one line". **That was wrong, and wrong in the way worth
recording: it was the only Italian string _in that screenshot_.** Asked to fix it,
grepping for Italian function words across `src/` and `index.html` found the rest
immediately - so the report cost nothing to check and should have been checked
before it was made. What there actually was:

- `index.html:245` - the search placeholder, now `Search for a place…`;
- `src/poi.js` - **every POI category label**, shipped since phase 2: Vetta,
  Rifugio, Passo/Colle, Cascata, Lago, Partenza sentieri, Bivacco. Now Peak,
  Mountain hut, Pass, Waterfall, Lake, Trailhead, Bivouac hut. The
  staffed-vs-unstaffed distinction the old code was careful about is kept.
- `src/poi.js` - the incomplete-elevation warning in the info panel.

**Place names stay exactly as OSM has them** - the search list reads "Bivacco
Mario Balzola · Bivouac hut" and "Rifugio Vittorio Sella · Mountain hut", which is
right: the name is a name, the category beside it is UI. `src/main.js:138` also
keeps its Italian, and must: it is a comment quoting the VDA licence clause
verbatim, and that wording is prescribed.

**The warning also changed meaning, not just language.** It said "(versante
piemontese)", which was true when written and is not now - the Piemonte gap was
closed on 2026-07-30. Exactly **1 POI of 426** still trips `dataIncomplete`: Roc
de Bassagne, which sits **460 m from the southern edge of the DEM bbox**
(45.4709N, 7.0888E) and reads 1,604 m against OSM's 3,222. So the cause is where
the extraction stops, not a source's coverage. Rather than swap one geographic
claim for another, it now says only what is certain: `⚠ incomplete elevation data
in this area`. **A stale claim survives translation** - check what a string
asserts before carrying it into another language.

**Republished straight after** (`0c8cc6a`), and verified the same way: the served
`index.html` named the new bundle within **8 s** this time and carries
`placeholder="Search for a place…"` in the markup, `tools/verify.mjs` against the
public URL reports WebGL2 and **no console or page errors**, and the screenshot
shows the English placeholder in the running site. **The live site is level with
`main`.**

Verified on the running page rather than in the source: all seven categories
render in English, the placeholder does, and the warning was read out of the info
panel by actually selecting the one POI that shows it. `test-viewstate` passes and
`tools/verify.mjs` reports no console or page errors. Bundle **793.31 kB /
222.25 kB gzipped**.

### Phase 7 opened by measuring, and the first item turned out to be the wrong one

`tools/dev/probe-lod.mjs` (new) answers the two terrain items that had been
carried since 2026-08-03 with an explicit **"unknown whether it's noticeable in
practice"** against them. Neither needs a GPU: the drawn surface is what
`sampleRenderedHeightfield()` reconstructs, the shading is what terrain.js's own
NORMALS chunk computes, and the distance a depth is drawn at follows from the
split rule. 20,000 sample points on real ground.

The unit is deliberately **what reaches the eye** - pixels for the geometry, a
brightness step for the shading, both after the real linear fog. Metres and
degrees cannot answer either question: a 40 m pop at 30 km is nothing.

```
 swap   cells        distance  fog   surface moves       on screen   brightness step
                                     p50    p95    max   p95   max    now    if scaled
 1->2  1311-> 655 m  62.9 km  36%   39.0  186.3   730 m  2.3    9 px  35.1% ->  18.3%
 2->3   655-> 328 m  31.5 km  10%   17.8   91.6   798 m  2.3   20 px  31.1% ->  17.4%
 3->4   328-> 164 m  15.7 km   0%    7.7   41.5  1162 m  2.1   58 px  24.4% ->  15.8%
 4->5   164->  82 m   7.9 km   0%    3.3   18.7   156 m  1.9   15 px  17.2% ->  13.8%
 5->6    82->  41 m   3.9 km   0%    1.2    7.9   235 m  1.6   46 px   9.6% ->  10.8%
 6->7    41->  20 m   2.0 km   0%    0.4    2.8   206 m  1.1   82 px   4.1% ->   5.1%
```

**The geometry pop is 1.1-2.3 px at p95, at every depth.** That is not a
coincidence: the split rule is scale-invariant, so pop-over-distance is very
nearly constant down the whole tree. **Geomorphing - the thing the roadmap names -
would smooth something worth two pixels.** The long tail is real (the worst single
point jumps 82 px, a cliff face where a 41 m grid and a 20 m grid disagree by
206 m) but it is 1 sample in 20,000.

**What actually changes when a tile subdivides is its brightness, by 24-35% at
p95 on the far transitions**, of which 28% survives the fog at 31 km and *all* of
it at 15.7 km, where there is no fog at all. That is the other item - normals
sampled at one texel regardless of tile depth - and it is not a separate
refinement: it *is* the visible half of "LOD popping". The comment in `terrain.js`
saying distant coarse tiles are "washed out by fog anyway" is wrong, and measurably
so: fog does not start until 20 km, and depths 3-5 are drawn from 3.9 km outward.

**The counterfactual is measured, not assumed**: evaluating the normal at the
tile's own cell size instead of one texel roughly **halves** the far steps
(35.1 -> 18.3, 31.1 -> 17.4, 24.4 -> 15.8) and slightly *worsens* the near ones
(9.6 -> 10.8, 4.1 -> 5.1). It cannot reach zero, and that is not a flaw in the fix:
the 655 m surface and the 328 m surface genuinely have different slopes, so their
honest normals differ. Killing the rest needs the normals *blended* across the
transition - a geomorph on the shading rather than on the vertices, which is the
opposite of what the roadmap assumed.

Two measurement traps on the way, both caught before the numbers were reported:

1. **A coarse cell is up to 1.3 km across**, so testing the sample point for the
   nodata sentinel is not enough - the interpolation reads the cell's *corners*,
   which can sit in the gap when the point does not. Corner-checking dropped up to
   435 of 20,000 samples and cut the worst pop from 2,292 m to 730 m. The first
   run's max column was measuring the data gap, not the LOD.
2. **"The normal disagrees with the drawn surface" is not what anyone sees.** The
   first version compared normals at a point; what a viewer sees is the brightness
   step when a tile subdivides, which needs the vertex normals interpolated across
   the triangle exactly as the varying is.

### Then rendered it, because 24% of a diffuse term is not yet a thing anyone sees

The user's call was to confirm visually before writing a fix.
`tools/dev/probe-lod-visible.mjs` places the camera **exactly** at the distance
where one chosen tile subdivides - the split rule is explicit, so the position is
computed rather than hunted for - and takes three frames: the same position twice
for a noise floor, and one **40 m** across the boundary, which at 15.7 km is
0.15 px of parallax. The diff is taken only inside the screen rectangle the tile
projects to, and the scene is read back to confirm the tile really is depth 3 in
one frame and depth 4 in the other.

| luminance diff, 0-255 | mean | p95 | p99 | max | pixels >2 / >8 / >20 |
|---|---|---|---|---|---|
| same position twice (noise) | 0.02 | 0.0 | 0.7 | 19 | 0.1% / 0.0% / 0.0% |
| across the LOD boundary | **2.10** | **8.6** | **18.9** | **74** | **27.6% / 5.6% / 0.9%** |

**So it shows.** A quarter of the tile's pixels move perceptibly against a noise
floor of nothing - signal/noise x121 on the mean.

The first version of that probe read the tile set in the *same* evaluate that
moved the camera, which reports the previous position's answer, because
`terrainUpdate()` runs in the render loop. The pixel numbers were right and the
confirmation was nonsense.

### Done: the normal is measured over the tile's own cell (`src/terrain.js`)

`aCellM`, a vec2 attribute constant per geometry - an attribute rather than a
uniform because all eight depths share one material, so a uniform could not
differ between them. The normal's central difference now spans
`max(one texel, this tile's cell)` instead of one texel always. **The same four
texture taps at a different spacing: no cost.** The geometry is untouched, so
`sampleRenderedHeightfield()` and everything standing on it are unaffected - and
the finest depth is unchanged too, since its cell already *is* about one texel.

Measured in rendered pixels, same probe, same camera:

| | mean | p95 | p99 | >2 levels | >8 levels |
|---|---|---|---|---|---|
| before | 2.10 | 8.6 | 18.9 | 27.6% | 5.6% |
| after | **1.60** | **6.2** | **14.8** | **21.5%** | **3.1%** |

**Down about a quarter to a third - not the halving the analytic number
predicted.** Worth knowing why: the analytic figure was the Lambert term alone,
while a pixel also carries the albedo, which changes with LOD too (the slope→rock
mix reads `n.y`, and the elevation banding reads the interpolated height). The
irreducible part is real: the 328 m surface and the 164 m surface genuinely have
different slopes, so their honest normals differ. Killing the rest needs the
normals **blended** across the transition - a geomorph on the shading rather than
on the vertices.

**And it costs something, measured rather than guessed.** A before/after pair from
the Gran Paradiso summit looking north (`tools/dev/shoot.mjs` gained `--at`/
`--towards` for exactly this - a repeatable camera, since the mouse-driven
`--look`/`--pitch` cannot express "stand here and look at that"), scored by mean
|Laplacian| per band:

- far ridges **-31.2%** fine detail, mid ground **-26.0%**, near ground **-4.8%**.

That is the trade in one line: **the distance where the flash lives is the same
distance that loses its texture, and the ground you actually walk on does not
change.** Whether the distant ranges now read as cleaner or as flatter is a taste
question, and it is the user's.

Bundle 793.31 -> **794.31 kB** raw, 222.71 kB gzipped (+1.0 kB, the attribute and
the shader lines). `test-rendered-height`, `test-wildlife`, `test-birds` and
`test-viewstate` all pass; `tools/verify.mjs` reports no console errors, which for
a shader edit means the program compiled.

### Done: the first load is 40% smaller, and not one pixel changed

The user asked what the LOD fix bought in performance. **Nothing, by
construction** - the same four texture taps at a different spacing. Measured
rather than asserted: `aCellM` costs **57.2 kB** of GPU memory in total (shared
between the eight geometries; 1.1 MB if each tile had its own copy) plus one
`max()` per vertex, and the frame is otherwise untouched - **135 draw calls /
478,303 triangles** walking at Le Pont, **145 / 507,591** from the Gran Paradiso
summit, 35 geometries, 4 textures, 15 programs.

So the load item was next, and it starts with what is actually sent rather than
what is on disk:

| asset | transferred | note |
|---|---|---|
| `heightfield.bin` | **16.36 MB** | gzip already applied, from 18.4 MB raw |
| `forest.png` | 1.19 MB | PNG, correctly not re-compressed |
| `index.js` | 0.22 MB | gzip |
| `trails.json` | 0.19 MB | gzip |

**The heightfield is 91% of the first load, and the JS bundle - the thing the
roadmap names - is 1.2%.**

Why gzip barely touched it is the whole answer: the **low byte of a 16-bit
elevation is very nearly noise** (0.069 m per step, far below what the source DTM
knows), and interleaving it with the high byte, which compresses better than 4:1
on its own, poisons the entire stream. Measured on the real file:

```
  as shipped, gzip -9          15.72 MB
  high-byte plane alone         2.43 MB   (of 9.20 raw)
  low-byte plane alone          8.11 MB   (of 9.20 raw)
  the two planes                10.53 MB
  row-delta then planes          9.18 MB   <- adopted
  16-bit grayscale PNG          15.19 MB
  brotli of the raw file        12.69 MB   (Pages serves gzip, so unavailable)
```

So the binary is now a **horizontal delta per row, split into two byte planes**.
Same size on disk, **9.18 MB over the wire instead of 15.72**, and *exactly*
lossless - the delta is mod 2^16 and the reconstruction is the same sum mod 2^16.
Decode is one pass, **50 ms for 9.6M samples**, against a download that is
several seconds. Two 8-bit PNGs were the alternative (browser-native decode, no
custom code) and were measured too: **10.63 MB**, worse, and they would need a
canvas readback of 9.6M pixels twice.

Both halves of the codec live in `src/heightfield.js` so they cannot drift apart,
and every reader goes through it - `terrain.js` plus the six build/fetch tools and
the probes, which all had their own `new Uint16Array(...)`.
`process-heightmap.mjs` **round-trips its own output over all 9.6M samples and
throws** if a single one differs, and `decodeHeightfield()` **throws on a layout
it does not recognise rather than reinterpreting the bytes** - a wrong codec here
does not fail, it makes a mountain range out of noise, and this project has
already shipped one silent misreading of this exact file.

First load goes from about **18.1 MB to 10.9 MB, -40%**. Expect nearer 9.5 than
9.18 live: Pages' gzip ran about 4% behind local `gzip -9` on the old file.

`schemaVersion` is 2. All seven suites pass (`rendered-height`, `wildlife`,
`birds`, `viewstate`, `audio`, `terrain-albedo`, `vegetation`) and `verify.mjs` is
clean. **Not yet republished.**

### The forest mask: the free 15%, and the 74% that costs the picture

Second asset by weight, 1.13 MB. It is 4096x2355 at one byte a pixel but holds
only **16 distinct values** (`COVERAGE_LEVELS`), 78.6% of them zero - a 4-bit mask
being shipped as 8-bit. Two levers, and they are not close in character.

**Taken: PNG sample depth 4.** The file is now written at PNG's own 4-bit depth.
Decoders - fast-png here, the browser in the viewer - apply the standard
sample-depth scaling on the way out, which for 4→8 bits is exactly x17, and every
value written was already a multiple of 17. So the bytes that reach the texture
are identical. **1.13 -> 0.96 MB for a build-script change and not one line of the
loader**: three's `TextureLoader` never sees the difference.

Proved in the real browser rather than by round-tripping it in node, and with the
control the earlier work taught: the same forest edge rendered with each mask, and
**a third render with the same mask for a noise floor**, because this scene has
birds and animals moving between shots.

| at a forest edge, trees in shot | subpixels differing | largest |
|---|---|---|
| same mask, two runs (noise floor) | 19,787 (0.52%) | 167 |
| 8-bit mask vs 4-bit mask | **18,452 (0.49%)** | 167 |
| 8-bit mask vs half resolution | 1,150,789 (30.44%) | 231 |

The 4-bit mask lands **below the noise floor** - it is not "close", it is
indistinguishable.

**Rejected: halving the resolution**, which was the big number - 1.13 -> 0.29 MB,
8% off the whole load. At 41 m/px the wood stops being where the wood is: the band
of trees along the ridge frays and spills downhill, and **30.4% of the frame
changes, 58x the noise floor**. That is *more* than the LOD artefact this session
just spent its effort removing (27.6% of a tile's pixels). Measured at two
vantages, because one would have been misleading in the other direction: from a
valley overlook the same change moves only 4.0% of pixels, and stopping there
would have made it look free. It is free only where there are no trees in shot.

**A mistake worth recording**: the heightfield commit before this one left
`tools/build-forest.mjs` **broken** - the bulk edit replaced its
`new Uint16Array(...)` without adding the import, and it was committed that way.
No test caught it, and none could: **the build tools are not run by any suite**,
they are run by hand when data is rebuilt. It surfaced within the hour only
because this item happened to rebuild that file. Worth remembering before the next
edit that sweeps across `tools/`.

**First load now**: heightfield 9.18 + forest 0.96 + JS 0.22 + trails 0.18 + water
0.13 + poi 0.01 = **about 10.7 MB, from 18.1** - a 41% cut across the two items,
with nothing visibly changed. Seven suites pass and `verify.mjs` is clean.

### Republished, and the saving confirmed on the wire

Every asset asked for from the live site with `Accept-Encoding: gzip, deflate, br`,
which is the only number that counts - everything before this was a local `gzip -9`:

| asset | transferred | encoding |
|---|---|---|
| `heightfield.3e0525a4.bin` | 9.38 MB | gzip |
| `forest.c7b76145.png` | 0.96 MB | none (already compressed) |
| `index.js` | 0.21 MB | gzip |
| `trails.json` | 0.18 MB | gzip |
| `water.json` | 0.13 MB | gzip |
| everything else | 0.02 MB | gzip |
| **total first load** | **10.88 MB** | was **18.10** |

**-40% on the wire.** The heightfield came in at 9.38 against 9.18 locally, the
~2% behind that was predicted for Pages' gzip. New bundle live in **8 s**;
`verify.mjs` against the public URL reports WebGL2 and no console or page errors,
and the screenshot is the Le Pont spawn with its trees, river and HUD intact.

### Mobile is dropped, and with it the roadmap is finished

**"Ho deciso che il mobile non è un'opzione che voglio seguire al momento."** A
scope decision, not a deferral to schedule around: **do not re-raise it
unprompted**, the same standing as the satellite/orthophoto basemap.

That closes phase 7, and with it **every phase in `docs/ARCHITECTURE.md` §7**.
Worth recording how it closed, because two of its four items were answered by
measuring rather than by building:

| item | outcome |
|---|---|
| LOD popping / geomorphing | **Not built, deliberately** - the geometry pop is 1-2 px at p95 at every depth |
| one-texel normals | **Fixed** - and it turned out to be the visible half of "LOD popping" |
| the bundle | **Reframed and fixed** - the JS was 1.2% of the load; the real target was the data, 18.10 -> 10.88 MB on the wire |
| mobile pass | **Dropped by the user** |

### The snow topic opened with a bug, and the user found it by watching

The discussion about *snow that settles* got one question in before the user
stopped it: **"io non vedo sbiancare il terreno anche aspettando un po'."** They
were right, and the framing in this file - and in what I had just told them - was
wrong: **the ground never whitened at all.**

Measured before touching anything, because "it doesn't look snowy" is not a
finding: switching to Snowfall took a patch of valley ground from luma **84.1 to
71.3 - darker**, that being the overcast preset dimming the sun - and then flat
for another **75 seconds**. Waiting did nothing because there was nothing to wait
for.

The cause is one missing consumer, and everything else was already there.
`weather.js` has computed `mod.snow` since phase 4 and even **ramps it with a 6 s
time constant**, its own comment saying "snow blankets the ground (and melts)
slower than the flakes fall". `lighting.js` reads it for the haze; `audio.js`
reads it for the crunch underfoot and the muffled master. **`terrain.js` never
did.** So it snowed, it sounded like snow, the air went white - and the ground it
was supposedly lying on kept its summer colour.

**Fixed** with the pattern `forest.js` already uses: a shared uniform holder
(`TERRAIN_SNOW`) driven by `main.js` each frame, so `terrain.js` still knows
nothing about `weather.js`. The mix goes on last, over rock and forest floor
alike, gated by the **same slope term the rock already uses** - what is too steep
for soil is too steep for snow, which is what the existing comment there had
always said. No new constants and no elevation term: the permanent white of the
nival band is the elevation-dependent one, and this is weather on top of it.

Measured after, on the same patch of ground:

| | clear | +3 s | +8 s | settled | clearing +5 s | +20 s | +50 s |
|---|---|---|---|---|---|---|---|
| ground luma | 84.1 | 107.7 | 113.5 | **114.2** | 93.1 | 84.3 | **84.1** |

It arrives over about 18 s, it melts back over the same, and it returns to exactly
where it started. All seven suites pass; with no weather `uSnow` is 0, so nothing
outside a snowstorm changed. Bundle +0.6 kB.

**Still open and still theirs**: the original topic, snow that *accumulates* -
lying deeper in a lee, lasting on north faces after the sky clears, and whether it
should raise the surface underfoot rather than only colour it. What landed today
is the state, not the history. **Trees also stay green in a snowstorm**, which is
the next most obvious gap if they want one.

### The LOD residual: both fixes tried, both worse, and my claim was wrong

The user asked to go ahead with the normal blend, which I had described as "the
only way to reach zero". **That was wrong, and the measurement says so.** What is
shipped is already the best of the three:

| shading normal | mean | p95 | pixels >2 levels |
|---|---|---|---|
| one texel always (before 2026-08-10) | 2.10 | 8.6 | 27.6% |
| **the tile's own cell (shipped)** | **1.60** | **6.2** | **21.5%** |
| cell, geomorphed across the transition | 1.69 | 6.8 | 22.4% |
| per pixel, at the pixel's footprint | 2.55 | 11.1 | 29.3% |

**Why blending cannot work**: two mesh resolutions sample the terrain at different
*positions*, not just at different spacings. The coarse tile has half the vertices
and interpolates linearly between them; a blend that ends on the child's spacing
still evaluates it at the parent's vertices, so the two never meet. Blending the
spacing and blending two whole normals land on the same value at the boundary,
which is why the cheap version was the right one to test - it costs four taps
where two normals cost eight, and it settles both.

**Why per-pixel is worse, which was the surprise**: at 15.7 km a pixel covers
about 20 m of ground, which is one texel - so a footprint-scaled normal *is* the
one-texel normal, i.e. exactly the behaviour that measured 2.10 before this
session. Worse still, finer shading detail amplifies the geometry pop: the same
1-2 px of surface movement now drags a high-frequency pattern with it. The
committed fix works precisely because its spacing is *coarser* than a texel - it
describes the surface being drawn rather than the terrain's true slope.

So the residual is structural: the 328 m surface and the 164 m surface genuinely
differ, and honest shading of each must differ too. **The only levers left are
`TILE_SEGMENTS` and `SPLIT_FACTOR`** - finer tiles, or subdividing further out -
and both are frame-rate trades (32 -> 64 segments would take the terrain from
~478k triangles to ~1.9M), which cannot be judged here: headless is 1.2 fps.
Nothing was changed; `src/terrain.js` is untouched by this round.

And one thing only they can measure: **frame rate on real hardware**. Headless is
1.2 fps with SwiftShader and has been wrong on this four times. The scene draws
135-145 calls and ~500k triangles; the last real reading was ~30 fps at the end of
July, before vegetation, wildlife, birds and audio all landed.

### How to resume
**Session closed 2026-08-10 with a clean working tree, everything committed
through `82272a6`, and all seven suites passing.** The audio suite needs a **dev**
server (`tools/dev/start-dev.sh`) as before.

**Every phase of the roadmap is closed** - phase 7 included, the mobile pass
having been dropped by the user. What follows is not roadmap, it is whatever they
want next.

**Open the session with the one thing owed: a real-browser look at the snow.**
Weather to Snowfall, then wait - it arrives over about 18 s and melts back over
the same. Headless says luma 84.1 -> 114.2 -> 84.1 and the slope gate keeps cliffs
bare, but how it *looks* is exactly the class of question headless has been wrong
about five times now. The dev 'G' key and the time slider are the fast ways around
the scene; there is no need to walk anywhere.

Then, in the order they choose:

1. **Republish** - the site is **three commits behind** (`91fd9b6` is live): phase
   7's closure, the LOD negative result, and the snow. `tools/dev/deploy.sh`, then
   poll the served `index.html` until it names the new bundle and run
   `node tools/verify.mjs <public URL>` - "returns 200" proves nothing.
2. **Snow that accumulates**, their original topic, still undecided and still a
   discussion first. Today's fix is the *state*; the topic is the *history*. The
   three questions already put to them, unanswered: what decides where snow lies
   (altitude alone, or altitude + slope + aspect - a north face holds it for
   weeks); whether it has memory (a real accumulator to save in the viewstate, or
   a deterministic map from the terrain); and whether it has depth underfoot or
   only colour. My recommendation stands: altitude + aspect + slope,
   deterministic, colour only.
3. **Trees stay green in a snowstorm** - the most obvious gap left after today.
4. **The LOD residual is structural** and needs no more shader work: both fixes
   were tried and measured worse (see above). The only levers are `TILE_SEGMENTS`
   and `SPLIT_FACTOR`, and both are frame-rate trades.
5. **A frame-rate reading only they can take.** Headless is 1.2 fps with
   SwiftShader. The scene draws 135-145 calls and ~500k triangles; the last real
   number is ~30 fps from late July, before vegetation, wildlife, birds and audio.

Deferred by the user, **do not re-raise unprompted**: the mobile pass and the
satellite/orthophoto basemap.

## Status as of 2026-08-07

**Both of the topics the user left open are now closed: ambient animal audio
(accepted the same day - "mi piace così com'è") and footsteps.** Each was opened
by the user and discussed before anything was written - which is how they asked
for these to go - and in both cases the discussion changed the answer, which is
the part worth recording.

They also confirmed on the way in that they had already listened to the marmot's
whistle series and it is fine, which closes the last thing hanging over the audio
from 2026-08-05. The closing doc edits from that session were committed first
(`7cda371`), so the working tree started clean.

**And then the second one, the same day: footstep sound while walking is built
too.** So **nothing the user has ever deferred is outstanding**, and phase 7 is
all that is left. Footsteps are the one thing not yet judged by ear.

### The discussion, and the thing it changed

The proposal that went to the user was not the obvious one. "Ambient animal
audio" reads like "give the silent animals a voice", and that is what the
2026-08-05 note listed as the first decision - but working out what those animals
actually sound like turned it around:

- a marmot's whistle **is** its alarm. It has no idle call at all, so a resting
  marmot voice would be invented;
- ibex and chamois are near silent by nature - a snort that does not carry;
- a fox barks, but at night and in January.

So the honest ambient animal sound of these mountains is **birdsong**, and that is
a gap rather than a revision: a wood at 1,600 m sounded like leaves and nothing
alive. Birdsong had been deliberately left out of the phase-6 audio round for a
reason that no longer applies - the birds were still an unopened topic then, and
pre-empting them with sound would have been the wrong order.

The user chose, out of the options put to them:

1. **birdsong**, not voices for the silent mammals;
2. **a simple day/night gate** rather than a full dawn-chorus curve: the day birds
   go quiet in the dark and an owl takes over;
3. **discreet** density - "si nota se ascolti" - rather than rare-like-the-raptors
   or a full spring wood.

### Done: songbirds (`src/audio.js`)

Five voices, each keyed to habitat the terrain already knows about (§5's altitude
bands and the OSM canopy mask):

| where | who | what it is |
|---|---|---|
| montane/subalpine wood, 700-2,100 m | chaffinch | a descending accelerating run and a terminal flourish - the commonest song in an Alpine forest, so the one that had to be right |
| conifer belt, canopy >= 0.35 | coal tit | a two-note couplet, repeated a random 3-6 times |
| forest edge, 800-1,900 m | cuckoo | two notes a major third apart, a hollow sine rather than the triangle the alarms use |
| above the treeline, 1,900-2,900 m | water pipit | thin high chips over open ground, and quiet - a small bird in a lot of wind |
| wooded valley, **at night** | tawny owl | a long hoot, a pause, then the stuttered phrase, with a shallow tremolo |

A **singer** is a position, a species and a clock. It has no visual counterpart
and no simulation state, which is why it lives in `audio.js` rather than in a
module of its own beside `wildlife.js` and `birds.js`: nothing about it is
stepped while the sound is off. Placement is the same deterministic hash lattice
as `wildlife.js`'s herds, and for the same reason - the bird that answers from
the same tree each time is what makes somewhere read as inhabited, where a call
arriving from a fresh random bearing reads as a sound effect.

Everything else it reacts to was already being computed for the wind bed:

- **wind takes the level down** (it masks song) and **rain stops the singing**
  (birds shelter and shut up). Each does the one thing it really does - and the
  rain version is the only one a listener could tell apart from the weather
  simply getting louder;
- **day and night gate whether a bird sings, not how loudly**: a bird that has
  gone to roost is silent, not quiet. The gate is probabilistic, so dusk thins the
  chorus rather than switching it off between two frames;
- the **`night` weight comes from `lighting.js`**, which now exposes the weight of
  its own night preset. That is deliberately not a second set of time thresholds
  in `audio.js` - the one in `lighting.js` is the number the lights are already
  blending with, so the ear and the eye cannot drift apart.

Three phrase-level details, because "a series of the same note" was not enough
for a song: a phrase declares its **pitch shape** (`[pitch multiplier, note
length, time to the next note]`), `whistle()` gained a per-note duration, and the
rattle gained a **depth** so a tawny owl's tremolo and a nutcracker's harsh
rattle can be the same mechanism at different strengths.

### Measured

`tools/test-audio.mjs` grew a songbird section, and its numbers are the ones to
argue with, not the intentions:

- a wood sings **8.0 times a minute**, alpine grassland **3.3**, a glacier at
  3,600 m **never**; at night the wood drops to **1.0** (all of it owl) and dusk
  is a genuine crossover, **4.5** with both the last chaffinch and the first owl;
- heavy rain takes the wood from 8.0 to **0.3**;
- the forest birds never sing above the treeline and the pipit never sings inside
  the wood - asserted per species, because a total would hide exactly that;
- cost **0.10 ms per 8 Hz tick**, one lattice rescan every 2 s;
- bundle 767 -> **772 kB** raw, still **213 kB gzipped**; `audio.js` minifies to
  11.5 kB, up from 7.3.

58 checks pass, and `test-birds`, `test-wildlife` and `test-viewstate` still do.

### Two method notes, both from the test being wrong before the code was

Worth keeping, because both are the shape of mistake this project keeps making.

**A stationary camera measured nothing.** The first run reported zero cuckoos,
zero pipits and zero owls from habitat that has all three. The lattice is
deterministic, so whether a low-density species happens to have anyone within
earshot of one fixed point is a coin flip fixed by the hash - the test was
measuring "does the origin sing", not "does a wood sing". It also meant
`rescanSingers()` never found anything, so half the code under test never ran.
The camera now **walks** through every case. (The run did expose one real fault
behind it: a cuckoo and a tawny owl carry for more than a kilometre, and both had
an earshot narrower than their own lattice spacing, so on average there was
nobody in range to hear.)

**The mean was the wrong statistic, and p95 was too.** A chaffinch sings for 1.5 s
out of every 90, so a 90-second mean band power moved by **x1.5** for a wood
demonstrably full of birds, and p95 by **x1.1** - because even the top 5% of the
time is mostly faint song at 150 m over leaf rustle. The **maximum** across Welch
segments answers the question actually being asked - does this band light up when
the nearest bird sings - and reads **x45** in the song band by day, **x10** in the
owl's band by night. The instrument was wrong, not the mix; the temptation was to
lower the threshold, and that would have shipped a measurement that proved
nothing.

One assertion was also simply wrong about the design: it demanded that no forest
bird be audible at Le Pont, which is open valley floor. But habitat is tested at
the **singer's** position, not the listener's - and that is the right way round,
because Valsavarenche has larch on both valley sides and standing on open ground
near a wood you hear the wood.

### Judged by ear, and accepted the same day

**"mi piace così com'è."** First listen, no changes asked for - so the density
(8 songs a minute in a wood, 3.3 above the treeline), the levels against wind and
water, and all five voices stand as they are. **Nothing about the songbirds is
open.**

Every tunable is a named constant in `SONGBIRDS` at the top of `src/audio.js` -
`gain`, `earshotM`, `everyS` (how often one bird sings) and `presence`/`cellM`
(how many birds there are) - plus `SONG_WIND_DUCK` and `SONG_RAIN_SILENCE`. If
they are ever revisited, the density knob is `everyS`/`presence`, not `gain`:
raising `gain` makes the near birds louder without adding any.

Worth recording for any future listening test, because it is what made this one
quick: the spawn at Le Pont is open valley floor, so the forest birds are only
heard at a distance from there. Pressing the dev **'G'** key until the note reads
`squirrel` lands you 18 m from an animal that only lives in canopy >= 0.9 - i.e.
inside a closed wood, which is where the chaffinch and coal tit actually are. The
time slider on Night is the owl.

Worth knowing before tuning: the density knob the user's answer maps to is
`everyS` and `presence`, not `gain`. Raising `gain` makes the near birds louder
without adding any; raising `presence` puts more of them in earshot.

### Done: footsteps (`src/audio.js`) - and the discussion turned on a number

The second deferred topic, opened the same day. The note left on 2026-08-05 said
the crux was that footsteps are the first sound tied to the user's own action
rather than to the scene, and that a loop is the easy way to make a quiet viewer
tiring. True, but the discussion turned on something more concrete:

**`src/controls.js` walks at 4 m/s. That is 14.4 km/h - a 4:10/km running pace -
and Shift takes it to 36 km/h, faster than a sprinter.** A cadence derived
honestly from that is 2.7 footfalls a second at a "walk" and a buzz under Shift.
So there is no setting in which this viewer sounds like a stroll, unless the
cadence stops being derived from the speed.

Given that, the user chose **a fixed ~2 Hz cadence regardless of speed** and **one
switch** (no separate mute). The fixed cadence is deliberately a lie - at 4 m/s it
implies a 2 m stride - and the lie is the choice: calm over consistent. `STEP_HZ`
is one constant if it ever reads wrong against the ground going past. They were
also offered slowing the walk speed itself, which would have made the footsteps
honest, and did not take it - the 4 m/s is there to cover an 84x48 km park.

Five surfaces, from signals the scene already computes - **no new data at all**:
snow (`weather.mod.snow`, or above the nival line at 3,800 m) beats wet
(`weather.mod.wet`) beats forest floor (the OSM canopy mask) beats scree (the
rocky band above 3,000 m, or any slope over 30 deg) beats grass. What has fallen
on the ground beats what grows on it beats what it is made of. Each is a burst of
the shared pink-noise buffer through one filter with a fast envelope; scree and
forest add `grains`, the little scattered arrivals after the footfall, which is
what loose stone actually sounds like. Feet alternate slightly left and right,
which is the one thing that makes a sequence of identical events read as a gait.

Silent in fly mode - `controls.mode` is now passed to `audio.update()` for that
alone, because the camera cannot tell you: walk mode is ground-clamped and fly
mode can sit on the ground too.

**A landmine worth the name, and it was mine**: a noise-buffer source and an
oscillator are **not on the same scale**. `makeNoise()` writes the shared buffer
at about +-0.1, while an oscillator runs at +-1.0 - so the first `STEP_GAIN` of
0.14, a value that would be loud for a whistle, measured **1.3x the wind bed**,
which is inaudible. It is now 0.7 against a +-0.1 source, measured at **x1.98 on
the whole-scene RMS** between walking and standing in the same place.

Measured, all of it in scenes chosen so that nothing sings (a songbird phrase
would land in the same envelope):

- cadence **2.00 Hz**, 40 steps in 20 s; **zero** standing still, **zero** in fly
  mode, and zero in the 1.5 s after letting go of W in the live viewer;
- every surface is selected correctly, and each lifts its own band clear of the
  same scene walked silently: grass **x68** in 600-1200 Hz, scree **x113** in
  1.6-2.8 kHz, snow **x334** in 2.6-4.2 kHz, wet **x46** in 250-600 Hz;
- 64 footsteps over 45 s of walking in the running viewer, on real terrain.

77 checks pass. Bundle 772 -> **774 kB** raw, **214 kB** gzipped; `audio.js`
minifies to 13.6 kB.

**Not judged by ear.** `STEP_GAIN` (level), `STEP_HZ` (cadence) and the `SURFACES`
table are the knobs.

### Two method notes from this one too

**An onset count cannot find a quiet event.** `noteOnsets()` thresholds at a
fraction of the loudest thing in the buffer, so with nothing loud in it, it counts
the noise bed - it reported **87 onsets for the standing case, which has zero
footfalls**. The controlled comparison is the same scene walked silently, and that
is what every footstep assertion now reads against.

**A reference has to be the same scene.** The first per-surface table read the
forest row against open ground at 1,700 m, and reported the forest footstep as the
brightest of the lot (x72 in the crunch band) - which was the wood's own leaf
rustle, not the step. Against a wood standing still it reads x1.9 there and x5.6
low down, which is what a footfall on needles should be.

### Next steps
1. ~~Ask the user to listen to the songbirds~~ - **CLOSED the same day**: "mi
   piace così com'è", first listen, no changes.
2. **Ask the user to listen to the footsteps** - the one thing left on them.
   Walking on open ground at the spawn is grass; the dev 'G' key to `squirrel`
   is the forest floor; Weather to Snowfall and then a few seconds for it to
   settle is the crunch; Rainstorm is the squelch. 'F' must be silent.
3. **Phase 7 polish** is still the only phase left: LOD popping/geomorphing,
   one-texel normals at any depth, the bundle (774 kB / 214 kB gzipped), and the
   mobile pass - pointer lock + WASD has no touch equivalent, and neither does a
   keyboard mute.
4. **Republish** once the footsteps are approved - the live site is several
   commits behind. `tools/dev/deploy.sh` does the whole thing.
5. Deferred by the user, do not re-raise unprompted: the satellite/orthophoto
   basemap.

**Nothing the user has ever deferred is outstanding any more.**

### How to resume

**Session closed 2026-08-07 with a clean working tree**, everything committed
through `e452e0e`, and all four test tools passing. **Open the next session by
asking the user to listen to the footsteps** - it is the only thing left on them,
and the site has not been republished since 2026-08-05, so it is several commits
behind whenever they want that done.

Run the tests - they need a **dev** server (`tools/dev/start-dev.sh`):

- `node tools/test-audio.mjs` after touching `src/audio.js`, `src/lighting.js`'s
  time cycle, `src/controls.js`'s speeds or mode, the hydrology manifest's shape,
  or `wildlife.js`'s alarm event. It is much the slowest it has been (77 checks,
  and it walks the live viewer for 45 s); its songbird cases catch a habitat or a
  day/night mistake and its footstep cases catch a surface or a gating one.
- the rest of the list in the 2026-08-05 section below is unchanged, and
  `test-birds`, `test-wildlife` and `test-viewstate` were all passing at the close.

The landmines in the sections below all still apply. Three from this session, and
all three are about the MEASUREMENT rather than the code - which is the pattern
worth carrying, since in each case the tempting fix was to relax the assertion:

1. **A deterministic lattice sampled from one fixed point is not a measurement of
   the lattice** - it is one draw of it. Three species reported zero from habitat
   that has them, and the rescan never ran at all. Walk the camera.
2. **A mean cannot see a brief event, and nor can p95.** A chaffinch sings 1.5 s
   in every 90: mean x1.5, p95 x1.1, max **x45**. Pick the statistic that matches
   the shape of the thing.
3. **A reference has to be the same scene.** Reading a forest footstep against
   open ground made it the brightest of the five surfaces - that was the wood's
   own leaf rustle. And relatedly, `noteOnsets()` thresholds against the loudest
   thing in its buffer, so it counts the noise bed when nothing is loud: 87
   "onsets" for a case with zero footfalls.

Plus one about the code, in the same family as the shader landmines: **a
noise-buffer source and an oscillator are not on the same scale** (`+-0.1` against
`+-1.0`), so gains are not comparable between them.

## Status as of 2026-08-05

**Phase 6 is closed, both deferred topics are closed, and the site is republished.**
The user picked ambient audio out of the four things left open at the last session's
end; audio was the last item phase 6 needed, so `docs/ARCHITECTURE.md` §7 now has
phases 0-6 complete. They then opened both of the topics they had deferred on
2026-08-04 - saving/autosaving the position, and birds - discussed each, decided
each, and both are built and accepted. **Phase 7 is the only phase left**, and two
new discussion topics were recorded at the user's request on the way out: ambient
animal audio, and footstep sound while walking (see the section on them below).

**Working tree at the close**: everything up to and including the birds is
committed (`f295f30`). The user asked to hold off on further commits, so this
section's last two additions - the birds being accepted and the two new topics -
may still be sitting uncommitted; commit them whenever the next session starts.

Order of the day, all of it committed: the audio (`c72c071`), the whistle the user
could not hear (`e5c2b08`), the whistle as a series (`715c0de`), saving and sharing
the view (`b2043fd`), the README and the deploy-guard fix (`4190e2b`, `b84140c`,
and the site republished), then the birds.

**Not yet judged by the user.** Everything below is measured, but how a mix
*sounds* is exactly the class of question headless has been wrong about four
times (brightness, frame rate, input feel - now loudness and balance). The
numbers say each layer responds to the right thing by the right amount; they
cannot say whether the wind is too loud at 3,000 m or the river too quiet at the
trailhead. That is the first thing to ask next session.

### Done: procedural ambient audio (`src/audio.js`)
No audio files at all - one shared pink-noise buffer read at six different rates
through six filter/gain chains, plus oscillators for the alarm calls. Procedural
was the right call for two reasons beyond neatness: a field recording is one more
licence to read before shipping (and this project has spent days on exactly that,
see the DTM licences), and ambience loops long enough not to *read* as loops are
megabytes on a deploy whose bundle size is already a phase-7 item. The whole
feature is one 430-line module and zero bytes of asset.

The design principle is the one the visuals already follow: **every gain is
driven by something real in the scene**, never by a timer. That is what stops
ambience sounding like a loop - it changes because you walked somewhere.

| layer | is | driven by |
|---|---|---|
| windLow | the body of the wind | altitude + ridge exposure, rain, canopy shelter |
| windHigh | its hiss over rock and grass | the same, plus fly-mode airspeed |
| rustle | leaves and needles | canopy x wind |
| waterLow | the roar of moving water | distance to the nearest lake/river/waterfall |
| waterHigh | its splash and hiss | the same, absorbed faster with distance |
| rain | precipitation | `weather.mod.rain` |
| calls | marmot and chamois alarm whistles | `wildlife.js`'s new `onAlarm` event |

Four choices worth recording, because each of them is a place the obvious version
would have been worse:

1. **Exposure, not just altitude.** The same 2,800 m is a sheltered basin or a
   col, and only the ground *around* you says which: four height samples 90 m out
   compared against the ground under the camera. It uses `sampleRenderedHeight`,
   the drawn surface, like everything else that has to agree with what the user
   sees.
2. **A wood is a windbreak.** Canopy raises the rustle and *lowers* the wind body
   in the same move, which is why walking into a forest sounds like walking into
   a forest instead of like adding a layer.
3. **Water is indexed by earshot, from the same manifest `water.js` draws.**
   Rivers and lake shores are resampled to 40 m *before* indexing: OSM river
   vertices here are a median 19 m apart but reach **242 m**, so nearest-vertex
   would have reported a stream 120 m away while you stood on its bank. A
   waterfall's loudness comes from its own `dropM` (Entrelor's 78 m against
   Lillaz's 12 m), which the manifest already carried.
4. **An alarm call is an event, not a state.** `wildlife.js` now reports the
   moment a fleeing animal takes fright (`onAlarm`) and re-arms only once it has
   been left alone; `audio.js` decides which species has a call (marmots and
   chamois - a marmot's whistle is *the* sound of these meadows), whether it is
   within earshot, and which side it came from. Ibex, foxes and squirrels stay
   silent on purpose: a curious fox arriving in silence is the point of it.

Also: snow muffles everything through a master lowpass, which is the single most
recognisable thing about falling snow, and lakes get a slow lapping swell that
torrents deliberately do not.

**Deliberately not built**: birdsong (the user has an unopened topic about birds -
pre-empting it with sound would be the wrong order) and footsteps (not ambience,
and a walking sound is a much bigger commitment than it looks).

### How it was verified, and why this method was available at all
`tools/test-audio.mjs` renders the **real graph** into an `OfflineAudioContext` -
same nodes, same driving code, no audio device and no real-time dependency - and
measures the power spectrum of the result with a Welch periodogram (a small FFT
written into the test). So every assertion is about energy in a frequency band,
which is as close to "what you would hear" as a test can get, and none of it
depends on frame timing. `createAudio()` takes its own `random`, so the noise
buffer, the gusts and the whistle repeats are seeded and identical run to run.
18 checks, all passing. The measurements:

- **wind**: an exposed 3,200 m summit against a sheltered 1,400 m valley floor -
  **x37 in the 80-250 Hz band, x78 in 600-1600 Hz**.
- **canopy**: same ground, same weather - **rustle x12** with full canopy, and the
  wind body **x0.21**, i.e. the windbreak is real and measured.
- **water**: standing 25 m from a 60 m waterfall against 5 km away - **x62 in the
  low band**, and the gains are *exactly* 0 at 5 km rather than merely small.
- **weather**: rain **x81** in its own band; falling snow cuts 6-10 kHz to **43%**.
- **calls**: a marmot at 30 m is **x59** in the 2.6-3.8 kHz band; an ibex at 30 m
  plays nothing (no call for the species); a marmot at 900 m plays nothing (out of
  earshot); a call from the right lands **118:1** right-to-left and from the left
  **1:100**; four animals bolting on the same frame play **one** call, not a chord.
- **mute** is silence, not "quiet": rms 0.0.
- **cost**: the earshot query, the only new per-tick data structure, is
  **0.0026 ms** and runs 8 times a second. The five height samples are the same
  call `wildlife.js` already makes dozens of times per frame.

Then the same test drives **the real page with a real `AudioContext`**, because
the offline render deliberately bypasses the two things only a live context has -
the autoplay policy and `main.js`'s wiring. It confirms: no context exists before
the first click; after it the graph is running at 44.1 kHz; at the Le Pont spawn
the viewer is driving wind 0.29 and water 0.113/0.148 from **the Savara 96 m
away**; walking three seconds moves that to 83 m and changes the water gains; and
'M' mutes with the checkbox following.

That last one is the nicest thing about where the spawn ended up: the trailhead
the viewer opens at is 80 m from a torrent, so the first thing you hear is the
Savara.

### The user's first verdict, and the one real fault in it
Same shape as every round on this project: build, measure, hand it over, fix what
they find. Their verdict: **"acceso di default è ok"**, **"il vento e l'acqua mi
paiono ok"**, and **"non sento il fischio della marmotta usando il comando di DEV
'G'"**. Two approvals and one genuine bug - the whistle never played at all, and
the cause is worth reading because the code looked right.

`alarm()` measured the distance to the animal from the camera position **the last
audio tick had seen**. That is fine while walking - one frame of a 4 m/s walk is
7 cm - and completely wrong for an instant camera move. The dev 'G' key teleports
the camera 18 m from an animal and then steps the wildlife *in the same handler*,
so every animal that suddenly finds the camera 18 m away raises its alarm before
`audio.update()` has seen the move at all.

Reproduced first, then diagnosed, then fixed - and the reproduction is now part of
`tools/test-audio.mjs`, which presses 'G' through all five species on the real
page: **0 calls out of 5 presses** before, marmot included. Wrapping `alarm()` in
the page showed why: **12 of 12 events, real distances 5-43 m, every one rejected
as out of earshot** against a remembered position 0.6-1.9 km away. (It also showed
something the design had not made obvious: a whole herd raises its alarms inside
that one synchronous update, which is exactly what `CALL_MIN_GAP_S` is for.)

The fix is to stop remembering: `audio.js` holds the camera reference and reads
its position *and* its look direction at the moment of the call. The remembered
position now serves airspeed only, which is the one thing it is correct for. After
it: the chamois press plays one call, the marmot press plays one, and ibex, fox
and squirrel stay silent as designed. 22 checks passing.

### Second verdict: the whistle is a series now
Once they could hear it: **"il fischio della marmotta può essere anche un po' più
lungo e ripetuto più volte (random), volume ed intensità paiono ok."** So volume
and pitch are settled, and the shape changed.

This is also the more accurate animal, which is worth knowing before tuning it
again: a marmot's *single* sharp whistle is its aerial-predator alarm, and what it
gives a walker is a **series**. Now: a random 2-5 notes (chamois 1-3, kept shorter
and sharper - it is not a colony), each note 0.3 s against the 0.16 s they first
heard, spaced a random 0.45-0.85 s, and deliberately not a metronome - each note
varies in pitch, loudness and spacing, because a fixed interval is exactly what
makes a repeat sound like a repeated sample. The note is also *held* rather than
just decaying longer, which is the difference between a longer whistle and a
smeared one.

Measured on the rendered audio rather than on the intention, by counting envelope
onsets - six seeds gave **4, 5, 3, 2, 2, 3 notes**, rendered count matching
scheduled count every time, first note 0.21 s sustained, series spanning
0.67-2.26 s. `alarm()` now returns the number of notes rather than a boolean,
which is what let the test compare "scheduled" against "came out of the render".
27 checks passing.

One thing the test caught and is worth remembering as a method note: the first
attempt asserted a note length of 0.2 s and measured 0.17 s, because the metric
was "time above 35% of peak" (the sustained part) while the constant was the whole
note including its decay. The answer was to make the note genuinely longer, not to
lower the threshold - but only after working out which quantity the number was.

Note the call fires **once, on arrival** - after that everything nearby is already
alarmed and fleeing, and the flag only re-arms past 1.4x the alert radius, so
hearing it again means walking ~40 m off and back.

**Confirmed by the user on 2026-08-07**: they had already listened to the series
and it is fine as it stands. Nothing about the alarm calls is open any more.

### A landmine, of a shape this project has hit before
**An `AudioParam`'s `.value` ignores scheduled events until they are processed.**
The first version of the diagnostics read the gains back off the params, and in
an offline render - where nothing has been processed yet - they all read **0.00**
for a graph that then rendered water perfectly audibly. The rendered audio was
right and the number was wrong, which is the same failure mode as the
`onBeforeCompile` shader patch that reported nothing amiss for five phases. Fixed
by recording the gains we *asked for*. The general lesson is the one already in
this file: a readback is not evidence unless you know when it is sampled.

### What the user gets in the UI
"Ambient sound (M)" sits with Time of day and Weather in `#env-controls`, because
like them it changes what the park is like rather than how the app is used. It is
**on by default** but silent until the first click anywhere - the browser will not
allow otherwise, and that click already exists to grab pointer lock, so the
ambience starts with the first look around instead of needing its own "enable
sound" step. `M` toggles it, and the checkbox blurs itself on change for the same
reason the credits button does: `controls.js` ignores movement keys while a form
control has focus, so a focused checkbox would silently stop W/S working.

There is a dev-only third HUD line showing what the ambience is being driven by
(wind strength and its inputs, canopy, water gains, distances, call count).
Audio is the first feature here with no visual at all, so without it there is no
way to tell a layer that is correctly silent from one that is broken.

### Done: saving, restoring and sharing the view (`src/viewstate.js`)
The user then opened the first of their two deferred topics - and it was a
discussion first, as they had asked. What came out of it, with their choices in
bold:

- **autosave/restore** and **a shareable link**, not named bookmarks (they took
  the two recommended ones and dropped the third as too much UI for the value);
- **the ambient-sound setting persists too** - their own addition to the list;
- on return, **restore silently plus a "back to Le Pont" button**, rather than
  asking every time or expiring old saves;
- the save carries **everything**: position, look direction, walk/fly mode, time of
  day and weather.

Four things I decided and put to them rather than asked, all standing:

1. **A hash beats the stored state, and is then consumed.** An explicit link has to
   win, or sharing is unreliable; but it is stripped from the URL after being
   applied, so a later reload follows the autosave again instead of being pinned to
   a link forever. Without that, moving and reloading would silently drop you back
   at the old link's spot.
2. **The sound setting never travels in a link.** A link that switches on a
   stranger's speakers is hostile. It is a preference, so it is restored from
   storage even when a link decides everything else.
3. **Real lat/lon in the link, not local scene metres.** Local metres are relative
   to the bbox centre and that bbox has already been rebuilt once (the DEM mosaic),
   which would have broken every link ever shared. `#at=45.60523,7.24285,3135&look=121,-2&mode=fly&time=0.620&sky=storm`
   is also readable, and key=value means a field can be added later without
   changing what today's links mean.
4. **Autosave on a 2 s tick plus `visibilitychange: hidden`**, not `unload` (never
   delivered on mobile). The write only happens when the serialised state actually
   changes, and the quantisation *is* the change detector - standing still writes
   nothing however much the camera jitters.

**One assumption worth having checked rather than trusted**: I was going to detect
an out-of-map restore by testing the sampled ground height for NaN.
`sampleRenderedHeightfield()` **clamps to the grid edge** instead (read, not
guessed), so a hand-edited link pointing at Milan would have "worked" and put the
camera on a smeared copy of the bbox border. It needs an explicit bbox test, which
is what it now has - and the test proves it with a stored record at Milan's real
coordinates.

`tools/test-viewstate.mjs` tests the contract end to end rather than the
serialisation, and measured:

- move somewhere, change every field, reload: back within **0.00 m**, altitude,
  heading, mode, time, weather and sound all restored, and **9.2 km** from the
  default spawn (i.e. it really did not just fall back);
- a copied link opens a fresh tab **0.03 m** from where it was made - that is the
  5-decimal quantisation, and it is sub-metre as designed - while the stored
  position was 15.6 km away, so the link genuinely won;
- the hash is empty after being applied (consumed);
- no sound field in the link, and the fresh tab still honours the stored sound
  preference;
- a corrupt record and a well-formed off-map record both land at Le Pont, with no
  page errors;
- "back to Le Pont" goes back, in walk mode, and **survives a reload** - the
  autosave does not drag you back to where you were.

Note the storage keeps full precision while only the link quantises, which is why
the reload round-trip is exact and the link is ~1 m.

Two test bugs worth recording, because both looked like product bugs for a minute:
the first version flew to a fixed 2,600 m at a spot where the ground is 2,835 m and
read the restore's "never strand the camera inside a mountain" floor as a failure
to restore altitude; and it reloaded the page after clicking "copy link", so the
hash was still in the address bar and the *link* path answered a question about the
*storage* path. Both are now explicit in the test.

### Done: the birds (`src/birds.js`) - the last deferred topic
The user opened their second deferred topic, and it was a discussion first again.
Their choices: **all four species** (golden eagle, alpine chough, bearded vulture,
nutcracker - I had expected them to drop the nutcracker as the most work for the
least visibility), **rare, like a sighting**, and **chough flocks on the real
passes and huts** rather than on a blind lattice. 151 POI qualify (passes and huts
above 1,900 m).

**The design decision was where to put it, and the note left for this session was
wrong.** It said the `SPECIES` table "should extend to birds; the ground clamp will
not". Reading `wildlife.js` again with that in mind, the clamp is not a line to
skip - it is the spine: `rescan()`'s habitat test, the orientation basis built from
the surface normal, `stepAnimal()`'s two-dimensional targets and the leg-swing
shader all assume something standing on the drawn surface. A `flight` flag would
have put a branch in every one of them. So: a separate module, the same *shape* as
its sibling (one InstancedMesh per species, one per-instance animation float,
deterministic hash lattice, distance fade, the audio event hook), and things that
walk stay separate from things that fly.

What replaces the ground clamp is still terrain-derived, and different per species:

- **Raptors circle a thermal**, sited on a ridge by the same four-sample exposure
  test `audio.js` uses to decide how windy it is where you stand. They climb at
  2 m/s to a ceiling, then trade the height for distance on a glide. The roll is a
  **real coordinated turn**, `atan(v^2 / (r g))` - about 24 degrees for an eagle in
  a 45 m thermal - which means it is checkable rather than tuned: measured against
  the formula to **0.0002 degrees**.
- **A chough flock is anchored on a named place**, orbits it, and closes to ~15 m
  when you arrive, because that is exactly what choughs do at a col. Nothing else
  in this project puts life on a named POI.
- **A nutcracker undulates over the canopy**, with one phase driving both its
  height and its wingbeat - that is the actual mechanism of undulating flight, not
  two effects that happen to look related.

The raptors are **silent on purpose**, which is the one piece of restraint in here:
a golden eagle is very nearly silent, and the screaming eagle everyone can hear in
their head is a red-tailed hawk. The chough and the nutcracker do have calls - and
the nutcracker needed a new timbre in `audio.js`, because a rattle is amplitude
modulation (a sawtooth chopped at 30 Hz), not a pitch you can choose.

Three bugs, all found by running the thing rather than by reading it:

1. **`Cannot access 'poiPromise' before initialization`.** The birds need the POI
   list, so I added `poiPromise` to a `Promise.all` written *above* where that const
   is declared - and a const is not hoisted. Now awaited inside the callback, which
   also means a slow POI load cannot hold up the trees and the animals.
2. **`mergeGeometries()` refuses a mix of indexed and non-indexed geometry.** The
   wings and tails were four raw triangles; the capsules and cones are indexed. Not
   a single bird was built. The panels are indexed now.
3. **Raptors were not rare, they were absent**: 0 of 40 viewpoints across the park
   had one within draw distance. The ridge and elevation tests throw away far more
   cells than a presence figure suggests, so presence had to go from 0.22 to 0.6 to
   land at the intended few-tenths-of-a-bird. Now **3/40 viewpoints, mean 0.07 in
   range, never more than 1 at once** - which is the "rare, like a sighting" the
   user asked for, and it is a measured number rather than a hope.

And two measurements that were the *test's* fault, worth recording because both
looked like product bugs:

- the eagle's bank appeared to miss the formula by 0.13 deg, because the test
  predicted from the 3-D airspeed while the code uses the horizontal speed - a
  climb plays no part in balancing a turn. The snapshot now reports both.
- the thermal's ridge exposure "did not survive re-derivation" (0.67 against 0.92),
  because `findNearest` returns the *bird*, which is up to 115 m from the ridge it
  is circling. The snapshot now reports the site's own position.

Also tuned on evidence rather than taste: the first soaring numbers (1.1 m/s to a
620 m ceiling) took **eight minutes** to complete one climb-and-glide cycle, so the
glide - half of what soaring looks like - was never seen. 2 m/s to 450 m gives a
four-minute cycle and is still inside what real birds do.

`tools/test-birds.mjs` measures all of it, plus the cost: **93 birds at 0.292
ms/frame**. That number is also why sites beyond 2.5x the draw distance are now
evicted - before that, one test sweep across the park had accumulated **799 birds
and ~1 ms/frame**, because every site ever passed was still being simulated. The
sites are deterministic, so coming back rebuilds exactly the same ones.

There is a dev-only **'B' key**, the sibling of 'G': it stands you 70 m from the
nearest bird of the next species and looks up at it. The raptors are rare by
design, so hunting one on foot to judge how it reads would be absurd.

**Accepted by the user the same day**: "ho guardato, mi piacciono, sono
sufficientemente realistici." Nothing about the birds is left open. Worth keeping in
mind if they are ever revisited: at their honest distances the raptors are only a
handful of pixels (measured ~7 px for an eagle 270 m off), so what carries them is
the motion, and the levers are `aglMin`/`aglMax` and the scale range at the top of
`src/birds.js` - not a change anyone should make without being asked.

### Two new topics the user asked to record for next time
Their words: "segnati per la prossima volta che parliamo anche di audio animale
ambientale e rumore durante il camminamento." Both are **discussions to open, not
tasks** - the same shape as the two topics that were deferred on 2026-08-04, and
both of those went well precisely because the context was written down first. So:

**1. Ambient animal audio.** What exists today is strictly *event*-driven: `CALLS` in
`src/audio.js` fires a one-shot burst when something happens - a marmot or chamois
takes fright (`wildlife.js`'s `onAlarm`), a chough flock chatters or a nutcracker
rattles as it goes (`birds.js`'s `onCall`). What does **not** exist is animal sound
as part of the *bed*: the idle noise a place makes because animals live there. The
questions that are actually decisions:
  - which of the silent species get a voice at all. Ibex, foxes and squirrels are
    silent **on purpose** today (an ibex snort does not carry, and a fox arriving in
    silence is the point of it) - so this would be revisiting a deliberate choice,
    not filling a gap;
  - whether it is per-animal (a timer per individual within earshot, which is what
    the chough flock already does and is cheap) or a per-region bed keyed to
    habitat, which is a different mechanism;
  - whether it should react to time of day, which is real - marmots are diurnal and
    silent at night, and `lighting.fraction` is right there.
  The plumbing is all in place: an event hook per module, one `CALLS` table, a
  rate limit, distance attenuation and stereo panning from the live camera.

**2. Footstep sound while walking.** Deliberately left out of the audio round, and
the reason is worth stating because it is the crux of the discussion: **it is the
first sound in this project tied to the user's own action rather than to the
scene**, which is a different category from ambience - and a footstep loop is the
single easiest way to make a viewer tiring to use. What is already available to
build it well, if they want it:
  - cadence from the real speed in `src/controls.js` (4 m/s walking, x2.5 with
    Shift), and it must be silent in fly mode - `controls.mode` says which;
  - the surface from signals the terrain already computes: the altitude band and
    slope say rock or scree or grass, the OSM canopy mask says forest floor, and
    `weather.mod.snow`/`wet` say snow or mud. So "what am I walking on" needs no new
    data at all;
  - the same synthesis approach as everything else in `audio.js`: a filtered noise
    burst with a fast envelope per step, no assets.
  The real questions: does the user want it at all, should it be defeatable
  separately from the ambience, and how loud relative to a scene whose whole point
  is that it is quiet.

### Published, and the deploy guard had rotted
The user asked for a README and then for a republish - the live site was still the
2026-08-03 build, eight commits behind.

Their warning was the right one to give ("il repository non contiene tutti i
sorgenti per il momento"), and it is worth spelling out because it is not obvious:
GitHub has **only** `gh-pages`, an orphan branch holding the built site, so it is
also the repository's **default branch** - which means the README that GitHub shows
on the repository page has to be the one *in the site payload*. A README on `main`
would be invisible to everyone. Their call: **ship the README with the site**, with
a narrow exception in the deploy guard, rather than reopening the "sources stay
local" decision.

Testing that guard before trusting it found a latent bug that had nothing to do
with the README: it refused every `*.png`, and `data/forest.<hash>.png` - the OSM
canopy mask - is a legitimate data asset. **From the moment the vegetation landed
on 2026-08-03, every deploy would have been refused.** Insurance that fails closed
on legitimate content is the wrong failure direction, so it is now:

- a **whitelist** of what the build produces (`index.html`, `assets`, `data`,
  `.nojekyll`, `README.md`), which cannot rot as `dist/` grows and still catches a
  stray `src/`, `tools/` or `docs/` copy - the actual risk;
- plus a scripts-anywhere refusal that now also covers **`*.map`**: a sourcemap
  publishes the sources it maps back to, so switching on `build.sourcemap` would
  quietly undo the whole decision.

Published, Pages rebuilt, and then verified rather than trusted - `built` is not
evidence:

- `node tools/verify.mjs https://dev-lop77.github.io/pngp-viewer/`: WebGL2 alive, no
  console or page errors;
- the canopy mask and the README both serve 200 from the live site, and GitHub
  reports `README.md` as the repository's README;
- the two features from today, driven **through the UI only** because
  `window.__pngp` does not exist in a production build: opened at Le Pont, flew for
  6 s with the real controls, reloaded and came back to the same coordinates;
  *copy link* produced `#at=45.52674,7.20721,2106&look=103,0&mode=fly&time=0.150&sky=clear`,
  which a **separate browser context** (no shared storage) opened at the same spot,
  with the hash consumed afterwards; *back to Le Pont* returned and survived a
  reload. No errors anywhere.

One thing that reads oddly in that log and is correct: flying forward from the
valley put the camera 149 m *below* the ground - fly mode passes through terrain by
design - and the restore lifted it to ground + 2 m. The floor is deliberate: a
saved position may not strand you inside a mountain.

### Next steps
1. ~~Ask the user to listen~~ - **CLOSED 2026-08-05, fully signed off 2026-08-07**:
   default-on approved, wind and water approved, whistle volume and pitch approved,
   and the two changes they asked for (audible at all, then a longer random series)
   are both in and both listened to. Every
   number worth tuning is a named constant at the top of `src/audio.js`
   (`WATER_KINDS`, `CALLS`, `MASTER_GAIN`) or one of the six gain expressions in
   `tick()`.
2. ~~Discuss save/autosave, then birds~~ - **BOTH CLOSED 2026-08-05**: discussed,
   decided, built and accepted ("mi piacciono, sono sufficientemente realistici").
   **Two new topics took their place, both the user's to open**: ambient animal
   audio, and footstep sound while walking - the context worth having before either
   conversation is written up in the section above.
3. **Phase 7 polish** is now the only phase left: LOD popping/geomorphing,
   one-texel normals at any depth, the >500 kB bundle (now 767 kB / 213 kB
   gzipped; `audio.js` minifies to 7.3 kB of that, measured with esbuild), and the
   mobile pass - pointer lock + WASD has no touch equivalent, and neither does a
   keyboard mute.
4. ~~Republish~~ - **DONE 2026-08-05**: the live site is now the current build,
   including the audio and the saved/shared view, and it carries the README.
   `tools/dev/deploy.sh` does the whole thing; re-run it after any change worth
   showing.
5. Deferred by the user, do not re-raise unprompted: the satellite/orthophoto
   basemap.

Possible follow-ups nobody has asked for, listed so they are not mistaken for
gaps: cowbells and church bells in the inhabited valleys, wind direction from the
camera's heading rather than an ambient bed, and katabatic valley wind at night
(real, but probably too subtle to hear).

### How to resume
Everything from 2026-08-05 is committed on `main`. Run the tests - they are quick,
and `test-audio` needs a **dev** server like the others (`tools/dev/start-dev.sh`):

- `node tools/test-audio.mjs` after touching `src/audio.js`, the hydrology
  manifest's shape, or `wildlife.js`'s alarm event.
- `node tools/test-birds.mjs` after touching `src/birds.js`, the POI categories the
  choughs are placed on, or anything about the terrain samplers. It drives the
  simulation with a fixed step rather than waiting on frames, so it is fast and
  exactly reproducible.
- `node tools/test-viewstate.mjs` after touching `src/viewstate.js`, the spawn, the
  environment controls, or anything about the camera's heading/pitch conversions.
  It is the slowest of the tools - it loads the viewer six times - but it is the
  only one that covers a reload at all.
- `node tools/test-wildlife.mjs` after touching the animals - it also now reports
  `alarmed` per animal in `snapshot()`.
- the rest of the list in the 2026-08-04 section below is unchanged.

The three landmines listed at the end of that section (`onBeforeCompile` gets
unresolved includes, albedo is not appearance, headless is SwiftShader) all still
apply, and the `AudioParam.value` one above joins them.

## Status as of 2026-08-04

**Session ended with a clean working tree and every test passing. "Next steps" and
"How to resume" near the end of this section were current as of that close - they
are superseded by the 2026-08-05 section above, except where it says otherwise
(the deferred save/autosave and birds notes below are still the live version).
Everything between here and them is that day in order.**

Headline: **the mouse-look jump is fixed and confirmed**, and **phase 6's wildlife
is done and accepted** - five species, not three, because the user asked for foxes
and squirrels once the first three were up. Phase 6 now needs only ambient audio.
The viewer also opens at the Le Pont trailhead instead of on the Gran Paradiso
summit. Two things the user wants to discuss next session are recorded below:
**saving/auto-saving the position**, and **birds**.

The day opened by asking the two questions the previous session closed on. Their
answers: **the mouse-look jump is still there** - "mentre sposto il mouse verso
l'alto, anche molto lentamente, ad un certo punto ho un salto", plus a request for
the view angle in the HUD, which they had no way to quote a number from - and
**wildlife** is the piece of phase 6 to build next.

Both then came back a second time with a real-browser verdict that found genuine
faults, which is the shape the whole day took: build, measure, hand it over, fix
what they see.

### The jump is not in our angle maths, and now that is measured across the whole range
"At a certain point" describes a discontinuity at one particular angle, which is a
different symptom from the per-event stepping fixed in `964d0b4`. The existing
`tools/test-mouselook.mjs` could not see one: it only exercises mid-range pitch
plus the two limits.

New `tools/dev/probe-pitch-sweep.mjs` drives a steady 1 px per frame from just
inside the bottom limit to the top - 1,537 frames, -85.9 deg to +89.9 deg - and
checks the per-frame pitch step against the sensitivity everywhere in between.
Result: **worst deviation 0.0000 deg, yaw drift 0.0000 deg, roll 0.0000 deg**.
Pitch advances perfectly uniformly across the entire range. (The probe first
reported a 0.0425 deg failure at 89.885 deg, which was the probe's own bug: the
step that *first meets* the clamp is legitimately a partial one. Fixed to judge
the frame before it.)

So the cause is on the input side, and there are exactly two candidates left,
each with a different fix:
- **one oversized delta** - the OS or browser warping the locked pointer and
  reporting the warp as movement. Not fixable by smoothing; needs the spike
  rejected. Note `requestPointerLock({ unadjustedMovement: true })`, the proper
  answer to this, is already known not to work on Linux (see 2026-08-03).
- **a long frame** - one that queues several mousemove events and then spends
  them together. `THREE.Timer` (r185) does **not** clamp its delta, verified in
  `node_modules/three/src/core/Timer.js`, so a 200 ms hitch makes
  `k = 1 - exp(-dt/0.045)` ≈ 0.99 and the whole queue lands in that one frame.
  The fix there is to cap the dt the smoothing sees, or to remove the hitch.

### Instrumented rather than guessed
Two readouts, and the user's next report picks the cause:
- **`pitch +NN°` in the nav HUD**, next to the compass heading - permanent, and
  what they asked for. `pitchDegrees()` in `src/nav.js` takes it from the camera's
  world direction, not a YXZ euler's x, because that decomposition is degenerate
  at the poles.
- **a dev-only `#look-diag` line** under the fps counter showing four peaks over
  the last 3 s: biggest single mousemove delta, events queued into one frame,
  longest frame, and biggest pitch change applied in one frame. `PeakWindow` in
  `src/controls.js` keeps two buckets so a peak can't blink away between the
  HUD's 4 Hz refreshes. Built from JS under `import.meta.env.DEV`, so it cannot
  reach a production build.

Verified headlessly, which is legitimate here because this is text and geometry,
not brightness or feel: after a slow drag the HUD read `N 0° · pitch +18°`, and a
synthetic 900 px event moved it to `+90°` (the clamp) while the diag line reported
`900 px/event` and `72.13°/frame`. The instrument demonstrably catches the
symptom. `test-mouselook.mjs` and the sweep both still pass with it in place.

### The user's reading, and the fix that followed from it
They looked up slowly until the jump happened and read off:

    230 px/event · 34 ms/frame · 20.40 deg/frame, at pitch +55 deg

That settles it. **230 px in a single mousemove event**, where slow movement is
1-5 - and a queue of small events cannot produce that, because each event carries
its own delta. So it is the platform reporting a pointer warp as movement: under
pointer lock the physical pointer still travels, and when it reaches the edge of
the screen the compositor recentres it and the jump arrives as one enormous delta.
230 px x 0.002 rad/px = 26 deg, which is the 20.40 deg that landed in one frame.
It happens at whatever pitch the pointer happens to hit the edge at, which is
exactly why it read as "at a certain point" rather than at a fixed angle.

The same reading **rules the other candidate out**: 34 ms was the worst frame in
three seconds, so nothing hitched and no queue built up. No dt cap was added -
there was no evidence for one.

**The filter.** A warp carries no real movement, so it is dropped rather than
clamped (clamping would still turn the view by the cap). The threshold is two
sided, because magnitude alone does not separate a warp from a fast flick - a warp
is one isolated huge event, a flick is a *run* of large ones:
`reject if magnitude > max(120 px, 8 x recent typical magnitude)`. The 120 px floor
keeps slow movement safe (120 px is 13.7 deg in one event, far more than a hand
produces between two polls); the adaptive term keeps fast movement safe, since by
the time a flick is under way its own typical magnitude has risen. The typical
magnitude decays with a 0.5 s time constant, so a warp arriving just after a flick
is not measured against the flick.

`controls.spikesRejected` counts them and the dev HUD shows
`warps N (worst NNN px)`, so the fix can be watched working rather than trusted.

**Tested in both directions**, which caught a real regression: the 230 px warp now
turns the view **0.0000 deg** and is rejected exactly once, while a run of eight
60 px events applies 54.995 of the 55.004 deg asked with **0 rejected**. And the
filter silently broke the existing pitch-limit check, which drove the clamp with a
single 4000 px event - now discarded as a warp, so that check was reading 54.77 deg
instead of the clamp and passing anyway. It drives 100 px per frame instead and is
back to measuring +/-89.8854 deg.

### The dev-only 'G' key, added because the test was impractical otherwise
The user asked how to actually run these tests, and for the animals the honest
answer was "hunt a 25 cm squirrel across 84 x 48 km", since herds only materialise
within draw distance. So `wildlife.findNearest(species, x, z)` spirals outward over
that species' own cell lattice, reusing `makeHerd()` so the answer respects
presence, the hash and the habitat rules exactly, and **'G' (dev only) stands the
camera 18 m from the nearest animal, cycling species on each press.** 18 m is
outside every reaction radius except the fox's curiosity, so the animal is
undisturbed when you arrive and you can then walk in and watch it react.

Measured worst case, from the Gran Paradiso summit - the least hospitable place
for a squirrel, so the deepest scan: **3.4 ms, 29 rings, 4.6 km**. The other four
are under 1 ms. Verified all five species are reachable, each landing 14-21 m from
an animal, and confirmed the whole thing (peaks line, note line, key handler) is
absent from a production build.

### Done: wildlife (`src/wildlife.js`)
Ibex, chamois and marmots. The park was created in 1922 to save the last few
hundred ibex in the Alps, so that is the species this had to get right.

**Placement is CPU-side, and deliberately not vegetation.js's trick.** Trees can
be placed entirely in the vertex shader because a tree never moves: its position
is a pure function of its lattice slot. An animal's position depends on where it
was last frame, which is state, and state lives on the CPU. So each species is
one `InstancedMesh` whose matrices are rewritten every frame - affordable because
the population is bounded by draw distance rather than by map size: **~50 animals
typical, 184 worst case, against 27,889 trees.** Measured cost of moving the whole
population: **0.026 ms per frame**, about 1.5% of a 60 fps budget.

What *is* borrowed from the trees is the deterministic lattice. Herds sit on a
per-species grid (ibex 600 m, chamois 500 m, marmots 240 m) and a cell's contents
come from a hash of its integer coordinates, so the same hillside always holds the
same herd and walking away and back does not reshuffle the park. A cell that fails
the habitat test is remembered as a miss, so it is never re-tested.

**Habitat comes from three real signals, which is the whole point:**
- elevation and slope from the terrain's own `sampleRenderedHeight` - the DRAWN
  surface, so animals stand on the ground the user sees;
- canopy from the OSM forest mask, via a new CPU-side `createCoverageSampler()` in
  `src/forest.js`. Decoded at half resolution (~41 m, 2.4 MB): herd sites are
  chosen on a 240-600 m lattice and the mask is 20 m data quantised to 16 levels,
  so full resolution would change no decision while costing a 38 MB
  `getImageData` spike and a 9.6 MB array.

Which puts ibex on open rock 2,000-3,400 m at 18-58 deg of slope, chamois at the
treeline (1,100-2,700 m, canopy 0.02-0.7 - the one species that uses the forest
itself), and marmots in gentle open meadow 1,500-2,900 m under 26 deg, because a
burrow needs diggable ground. Verified by the numbers: the chamois photographed
below was at 2,053 m on a 44 deg slope under 0.19 canopy, the marmot at 2,571 m on
7 deg with none.

Deliberately **not** scoped to the park boundary, unlike POI and trails: ibex have
recolonised most of the western Alps from this population, so a herd just outside
the line is accurate rather than a bug.

**Behaviour.** Each animal grazes, then walks to a new spot near its own patch,
and turns to face where it is going at a capped rate. All three flee an
approaching camera - ibex at 45 m, chamois at 55 m (the most easily spooked),
marmots only at 25 m and then they bolt at 3.2x. Watching a herd break and move
off is most of the reward for having found one.

**The gait is in the vertex shader, but the timing is not.** Legs swing about
their hip, and each vertex carries `aLeg = (swing sign, pivot height)`: the sign
puts diagonal legs in antiphase, which is the trot all three animals use, and the
pivot is read rather than assumed so the same code serves a 0.6 m ibex hip and a
0.18 m marmot one. Body vertices carry sign 0, so the same line reduces to the
stock transform with no branch. The swing itself is one per-instance float set by
the CPU from **distance travelled, not time**, so a fleeing animal takes faster
strides rather than longer ones and the legs cannot skate. Flat shading means the
rotated legs get correct normals from screen-space derivatives for free.

Coats were solved backwards from their intended on-screen colour with
`tools/dev/solve-albedo.mjs`, like every other colour in this project.

### How the wildlife was verified
`tools/test-wildlife.mjs` visits eight mid-altitude sites taken from the shipped
POI data (a hand-typed coordinate would be one more thing to keep true if the
local frame moved) and pins five properties: animals appear at all and all three
species do; every animal sits inside its species' elevation/slope/canopy envelope;
their feet are on the drawn surface to within 5 cm; leaving for 4 km and coming
back finds the same animals in the same places; and the leg swing actually
changes. Habitat is a **rate**, not a ban - habitat is tested at the herd site and
animals then wander up to 30 m, so some drift onto ground that would not have been
chosen. Currently 1.8% do, all chamois, against a 25% limit.

New `tools/dev/shoot-wildlife.mjs` photographs a herd. It has to chase: every
species flees, so a camera aimed once and screenshotted a second later
photographs empty hillside. Shots of all three are in `tools/dev/logs/`.

**On brightness in those shots: they look very dark, and that was checked rather
than assumed.** `tools/dev/logs/trees-cretaz-ground.png` from 2026-08-03 - the
same lighting, which the user confirmed as good in Firefox - is just as dark, and
`test-terrain-albedo.mjs` still passes to within 0.002. So this is the known
SwiftShader behaviour and not a regression. It is exactly the trap documented
below: never retune lighting against a headless screenshot.

### Then the user asked for two more, and they are the interesting ones
"Alle faune aggiungerei le volpi, ogni tanto si avvicinano loro alle persone. E
gli scoiattoli che si nascondono dietro agli alberi." Both are about *behaviour*,
not about another model, and between them they turned the flee code into one of
three reactions declared per species:

- **`'curious'` - the fox comes to YOU.** Bold ones notice the camera at 130 m,
  walk in at 1.7x speed, stop at 7 m and turn to face it; get closer than 3.5 m
  and even a bold one gives ground. Whether a given fox is bold comes from the
  herd's own generator (55%), so it is a property of that place rather than of
  the session - which is what makes it "ogni tanto" instead of always. Shy ones
  fall through to `'flee'`. Solitary and territorial, so the coarsest lattice
  here: 900 m cells, one or two animals.
- **`'hide'` - the squirrel puts a trunk between you and it**, and keeps
  shuffling round the trunk as the camera moves.

**The squirrel needed a real tree, and that was the one hard part.** Trees are
placed entirely in the vertex shader, so the CPU has no idea where they are.
Rather than re-deriving the lattice (which would drift), `src/vegetation.js` now
exports `nearestTree(x, z, camX, camZ)`, built on the very same offsets buffer the
shader reads and applying the shader's own wrap
`o + floor((camera - o)/WINDOW_M + 0.5) * WINDOW_M`. O(9), because the lattice is
regular with at most 0.45 of a cell of jitter, so only the 3x3 of grid indices
around the point can win. The camera is a parameter because the window follows it,
which also means the answer is only meaningful near the camera - fine for 130 m
squirrels.

**Measured against the GPU's own buffer, not assumed:** the test brute-forces all
27,889 instances of the real `aOffset` attribute and compares. Agreement is
**0.000000 m and the same instance index** at all four probes. That check is the
reason to trust a squirrel is behind something.

What is *not* reproduced on the CPU is the tree's existence test
(`step(hash(cell), coverage)`): that hash is chaotic by design, and GLSL float32
against JS float64 would give a different answer for the same cell. So instead
squirrels are restricted to **canopy >= 0.9**, where nearly every slot is a tree
anyway - a documented ~5% chance the specific trunk is missing, inside solid
forest where the neighbour is 6 m away. Deliberate, and cheaper than a fragile
hash port.

**Observation from the screenshots, worth a decision:** dense wood is exactly
where the trees are widest (a cone's base radius runs to ~3.6 m at that altitude),
so standing 2.5 m from a squirrel fills the frame with canopy - the shot came back
almost black. From 11 m it reads as real forest. So squirrels are well hidden in
the strict sense, possibly *too* well. `habitat.canopyMin` for squirrel in
`src/wildlife.js` is the lever if they should also appear at forest margins, but
lowering it below ~0.9 is what the existence caveat above pays for, so it is the
user's call rather than a free tweak.

### The user's real-browser verdict on the animals, and three fixes
The warp filter is confirmed good ("direi che ora è a posto"). On the wildlife they
found three things, and all three were real:

**1. "Gli animali sono in una posizione/inclinazione non coerente con il terreno."**
The worst of the three and structurally my fault: the first version pitched the body
along its heading only, over a 1 m baseline, and applied **no roll at all**. Across a
side-slope that floats the downhill legs and buries the uphill ones. Fixed by
orienting to the surface **normal**: central differences over the animal's own
footprint (`orientBaseM`, 0.4-1.5 m per species) give the facet gradient - the drawn
surface is piecewise planar over 20.5 m cells, so a baseline of a metre or two
recovers it exactly - and the body is then built as a basis from that normal plus the
heading tilted into the tangent plane. Smoothed with a 0.2 s time constant, because
the gradient steps as an animal crosses a cell boundary and applying that instantly
reads as a twitch. Measured over 45 drawn animals: **mean 0.25 deg between body-up
and terrain normal, worst 4.92 deg** (an ibex walking across 54 deg ground, i.e. the
smoothing lag), and 35 of them on ground steeper than 20 deg, so roll is genuinely
exercised rather than incidentally zero.

**2. "La volpe, se mi avvicino fino a toccarla, dovrebbe allontanarsi. Curiosa.. ma
non stupida."** Correct, and the cause was arithmetic: it backed off at
1.1 x 1.7 = 1.87 m/s against `controls.js`'s 4 m/s walk, so it simply lost the race.
The curious reaction now *maintains* a distance rather than merely arriving at one -
approach above 8.05 m, hold between, retreat below 5.95 m - and retreating has its own
`escapeMul` of 4.5 (4.95 m/s; a real fox does 50 km/h, so this is still modest).
Measured: walking straight at a bold fox for 15 s at 4 m/s, **it never let the camera
closer than 5.95 m**, which is exactly the equilibrium the band predicts.

**3. "Lo scoiattolo è giusto che sparisca dietro un albero, poi però dovrebbe
continuare a scappare se mi avvicino a quell'albero."** It used to shuffle round the
same trunk forever. Now, once the camera is within 6 m of the *trunk*, it abandons it
for one about 14 m further off, chosen from a fan of five directions away from the
camera and required to still have real canopy - so a bolting squirrel retreats deeper
into the wood rather than out into the open. Measured: **it moved to a trunk 19.3 m
away and was still shielded by the new one.**

Animals also carry a stable `id` now, so a test can follow one individual through an
interaction instead of watching "the nearest", which is a much sharper instrument -
that is what makes the squirrel bail-out assertion meaningful at all.

### The animals are accepted, and the viewer now opens at a trailhead
"ok gli animali ora" - the wildlife round is closed. With it, the user's call on
where the viewer should start: **Le Pont, the Valsavarenche trailhead at 1,950 m**,
instead of 400 m south of the Gran Paradiso summit at 3,916 m.

It is the better opening for a real reason, not just a preference: Le Pont is where
the walk to Rifugio Vittorio Emanuele II and to Gran Paradiso itself actually
starts, so the viewer now opens where a visitor opens their day, at walking scale,
rather than on top of the mountain looking down at it. `src/main.js` stands the
camera 20 m back along the line to Gran Paradiso (~5.2 km ESE) so the trailhead's
own marker is in front of the camera rather than through it, and looks level with
the eye rather than down at the ground - from a valley floor the interesting half
of the view is up the valley. It falls back through any trailhead, then Gran
Paradiso, then the first POI, because a missing name must not leave the camera at
the 3,000 m placeholder with no ground under it.

Verified: HUD reads `45.5275°N, 7.2021°E · alt 1955 m · ground 1953 m`,
`E 103° · pitch +0°`, `Near Le Pont (20 m)`, and the opening frame is the green
valley with larch stands on the slopes and the Savara running up it. Incidentally
that shot is much brighter than the wildlife ones, which is one more confirmation
that those were dark because of sun angle and aspect rather than the lighting rig.

`tools/dev/README.md` said `verify.mjs` "only ever shoots the 3918 m spawn point,
up in the rock band" - true until today, so it was corrected rather than left to
mislead.

### Two things the user wants to talk about next session, noted here so they are not lost
1. **Saving and auto-saving the position.** Explicitly a discussion first, not a
   task: "parleremo di save e autosave della posizione." Worth knowing before it
   starts - the state that would need saving is small and already all in one place
   (camera position and orientation, walk/fly mode, time of day, weather), and
   `localStorage` needs no backend, which matters given §9's static-hosting-only
   deploy. The questions that are actually decisions: autosave on a timer or on
   unload; one slot or several named ones; whether a shared/linkable URL hash is
   wanted (that one changes the design, since a hash is a save format too); and
   what should happen on a first visit versus a return visit, which is exactly the
   Le Pont default above and therefore interacts with it.
2. **Birds.** "Vorrei aggiungere qualche volatile." Nothing built. Worth knowing
   before starting: the species that belong here are the golden eagle (the park's
   emblem alongside the ibex), the bearded vulture - reintroduced in the Alps and a
   real conservation story - the alpine chough in noisy flocks around the high
   cols, and the nutcracker in the conifers. And unlike everything in
   `src/wildlife.js` so far, a bird is not ground-clamped: its position is free in
   Y, so the habitat signals that drive the five current species (elevation, slope,
   canopy) do not transfer directly. A soaring eagle wants a ridge and a thermal,
   which is terrain-derived but a different derivation. The `SPECIES` table and the
   reaction dispatch should extend to them; `sampleGroundHeight` as the Y source is
   the part that will not.

### Next steps
1. ~~Confirm the warp filter~~ - **CLOSED 2026-08-04**: "direi che ora è a posto."
2. ~~Re-check the animals after the three fixes~~ - **CLOSED 2026-08-04**: "ok gli
   animali ora." Left unjudged, and not worth chasing unprompted: whether squirrels
   are findable at all in dense wood (the observation above). Every number worth
   tuning is a named constant in the `SPECIES` table at the top of
   `src/wildlife.js`.
3. **Discuss save/autosave of the position**, then **birds** - the two items above.
   Both are the user's to open.
4. **Ambient audio** closes phase 6. Procedural, no asset licensing to resolve,
   and it needs a user gesture to start - the click that grabs pointer lock is
   already there.
5. **Phase 7 polish**: LOD popping/geomorphing, one-texel normals at any depth,
   the >500 kB bundle, and the mobile pass (pointer lock + WASD has no touch
   equivalent at all).
6. **Republish when wanted** - the live site is now several commits behind `main`.
   `tools/dev/deploy.sh` does the whole thing.
7. Deferred by the user, do not re-raise unprompted: the satellite/orthophoto
   basemap.

### How to resume
Everything from 2026-08-04 is committed on `main`. This session's commits, in order:
`2cf1f59` (view pitch in the HUD + the look instrumentation), `c2bb7de` (wildlife:
ibex, chamois, marmots), `0e3a29b` (foxes and squirrels, plus `nearestTree()` in
vegetation.js), `e1886c8` (the dev-only 'G' key), `0514e1a` (the pointer-warp
filter), `66d040c` (terrain-aligned bodies, the fox standoff, the squirrel
bail-out), and the spawn/notes commit that closed the session.

The test tools cover the fragile parts - they are quick, run them:
- `node tools/test-rendered-height.mjs` after any change to terrain geometry or
  height sampling. Five features now depend on the analytic model matching the
  drawn surface - the animals are the fifth.
- `node tools/test-terrain-albedo.mjs` after touching terrain colours or the mask.
- `node tools/test-vegetation.mjs` after touching trees or the mask.
- `node tools/test-wildlife.mjs` after touching the animals, their habitat rules,
  or `createCoverageSampler()`.
- `node tools/test-mouselook.mjs` and `node tools/dev/probe-pitch-sweep.mjs` after
  touching `src/controls.js`.
- All of them except `test-rendered-height` need a **dev** server
  (`tools/dev/start-dev.sh`), not preview: they import `/src/*.js` and read
  `window.__pngp`, which only exists under `import.meta.env.DEV`.

**Three landmines that have each cost real time - read before editing:**
1. **`onBeforeCompile` gets unresolved `#include` directives.** Patch the
   directive, never the inlined chunk body, and never trust a replacement that
   produces no error. `patch()` in `terrain.js`/`vegetation.js`/`wildlife.js`
   throws on an unmatched marker, which is the guard that was missing when the RG8
   bug survived from phase 1.
2. **Albedo is not appearance.** Lambert divides by PI, so a natural-looking
   colour renders near-black under this lighting. Solve it backwards with
   `tools/dev/solve-albedo.mjs`; the washed-out hexes in the code are correct. And
   `new THREE.Color(hex)` **already** converts sRGB to linear - never also call
   `convertSRGBToLinear()`. Note colour *attributes* (wildlife.js) are read as
   working space, so the constructor is the one and only conversion there too.
3. **Headless is SwiftShader.** Trust it for geometry, placement, layout and
   console errors; never for brightness, frame rate or input feel. When a shot
   looks wrong, compare it against an older shot the user already approved before
   changing anything - that is what settled the dark wildlife screenshots.

## Status as of 2026-08-03

**Session ended with a clean working tree and every test passing. Start at
"Next steps" and "How to resume" near the end of this section** - those two are
current as of the close of the day, whereas everything between here and them is
chronological narrative.

Headline: phases 0-5 are done and deployed, and **phase 6 is now underway**,
opened with the vegetation at the user's choice. The terrain is no longer white
(§5's altitude bands finally drive its colour) and trees come from a real OSM
canopy mask; both were confirmed good in the user's Firefox, brightness and frame
rate included. Phase 6 still needs wildlife and ambient audio. The
satellite/orthophoto question was explicitly deferred.

The rest of this section is the day in order, and it was a long one.

**It began with the walk/fly follow-up fixes finally being re-tested by the user
in a real browser (Firefox), and that test cascaded into the biggest single piece
of work on the project so far: the terrain gained quadtree LOD, plus two
significant bugs dating back to phase 1 were found and fixed along the way.**

### The user's real-browser results (2026-08-03, Firefox)
Point by point, against the checklist they were given:
1. **Terrain is not flat** - confirms the RG8 packing works in Firefox, which
   had never been explicitly verified there (the `EXT_texture_norm16` gap that
   forced the packing is Firefox-specific).
2. **See-through terrain still happened**, but no longer while walking - only
   sometimes while moving the view with the mouse.
3. **POI marker lines ended well above the terrain.**
4. Label click OK. Reticle+click worked but aimed at the ground point, not the
   label - "poco intuitivo e forse non utile". Search box OK, but flying to
   e.g. Rifugio Chabod could land somewhere with "visibilità trasparente".
5. Dual alt/ground readout OK.
6. **Keyboard navigation didn't work with the mouse released.**
7. FPS good across weather modes and times of day.
Plus a feature request: map all the *rifugi* and the main trailhead areas
(Thumel, Pont, etc.).
Later, while testing more: **A/D strafed when turning would be more natural
while walking.**

### Root cause: 2, 3 and 4's transparency were all one bug
There were two different notions of "where the ground is". `sampleHeight()`
returned the true bilinear value of the 20.5 m heightfield, but the mesh drew
328 m triangles, which cut below ridges and bridged above hollows. Measured
consequences: the drawn surface sat a **mean 29.2 m** from the true
heightfield, and at **44.5% of sampled points** a 1.7 m eye placed at the
bilinear height ended up *under* the drawn surface. Concave ground → camera
underground → see-through (and it depended on view direction, hence "only with
the mouse"); convex ground → marker lines drawn at `elevationM` left hanging.
- Fix: `sampleRenderedHeightfield()` in `src/heightfield.js` reconstructs the
  drawn surface analytically (locate the quad, pick the triangle, interpolate
  its three corners), following three's own PlaneGeometry vertex layout and
  `(a,b,d)/(b,c,d)` triangulation. Now used by the camera clamp, the POI
  marker bases, the fly-to landing and the label occlusion test.
  `elevationM` remains the POI's real altitude and is still what the info
  panel reports - deliberately not what the geometry uses.
- **Verified independently, not just "it renders"**: `tools/test-rendered-height.mjs`
  (new, permanent) builds the real geometry, displaces it on the CPU the way
  the vertex shader does, and queries it with three's own `Raycaster` - a
  genuinely separate path. Agreement to **0.0001 m**. Raycasting is valid
  *there* only because that script displaces the CPU geometry itself; against
  the live app it would read the undisplaced grid, which is the whole reason
  the app needs an analytic query.
- POI markers now sink `BASE_SINK_M` (2 m) below the ground so no viewing
  angle shows a hairline gap.

### Keyboard, selection and camera changes
- **Movement no longer gated on pointer lock** (`src/controls.js`): only
  mouse-look needs the lock. The old `if (!this.enabled || !this.locked)`
  meant pressing Esc to click a label also froze movement. Proven headlessly:
  11.1 m travelled with pointer lock never engaged. Added `preventDefault()`
  on the movement keys, since Space scrolls the page once the lock isn't
  absorbing it.
- **Reticle + raycast selection removed entirely** (user's call), along with
  `poi.js`'s `pick()` and `LINE_RAYCAST_THRESHOLD_M` and the `#reticle`
  element. Selection is now label click or the search box; a canvas click just
  dismisses the info panel. This is only reasonable *because* of the change
  above - releasing the lock no longer costs you movement.
- **A/D turn instead of strafing** (user's request while walking for real).
  Yaw about the world up axis so pitch doesn't roll the horizon; strafing moved
  to Q/E rather than dropped. Verified headlessly: D turns right (heading
  0°→127°), A turns left, and position changes by 0.0 m. This also completes
  keyboard-only navigation, which the pointer-lock change made possible.
- **`flyTo()` is time-based now**, not `t += 0.02` per frame - that made the
  same flight take ~1 s at 50 fps and ~10 s at 5 fps. Found because a test
  measured the camera mid-flight.

### Label occlusion (user confirmed the see-through labels were annoying)
Labels are `CSS2DObject` DOM elements, so unlike the WebGL marker lines they
are not depth-tested and showed straight through mountains. `poi.js`'s
`isHiddenByTerrain()` walks the line of sight sampling the drawn surface. A
`Raycaster` cannot do this (it sees the undisplaced grid) and a depth-buffer
readback would stall the pipeline every frame - the analytic height function is
what makes it possible. Distance filtering runs first so the ray march only
touches the handful of candidate labels, not all ~370 (§10).

### Terrain LOD - decided mid-session, on evidence
The user first chose "exact fix now, LOD later", reasonably, since faceting
looked cosmetic. Then the occlusion work produced hard numbers that changed the
picture, and they chose to pull LOD forward:
- With a 2 m tolerance the occlusion test hid **15 of 15** labels near the
  spawn, including the summit the camera was pointed at. Not a logic bug -
  the geometry really did block those sight lines.
- **The 328 m mesh drew Gran Paradiso's summit at 3917 m against a real
  4047 m - it cut 130 m off.** The interpolated terrain around a summit came
  out higher than the flattened summit itself, so the peak was occluded from
  *every* distance tested between 400 m and 6 km.
- The tolerance could not be tuned around it: at 50 m enough labels came back
  but they also started showing through real mountains again.

`src/terrain.js` was rewritten around a quadtree: `TILE_SEGMENTS = 32`,
`MAX_DEPTH = 7`, `SPLIT_FACTOR = 1.5`, giving ~300 visible tiles / ~409k
vertices and **20.5 m cells under the camera** (the heightfield's own
resolution) against 328 m before.
- **Nothing streams.** The height texture is already fully resident (4096×2355
  RG8, ~19 MB), so only geometry is subdivided - a large simplification over a
  typical tiled terrain.
- Tiles derive their texture coordinates from world position in the vertex
  shader, so every tile at every level shares **one material**.
- **One geometry per depth, sized in real metres** - deliberately not one unit
  geometry scaled per tile. Tiles are not square (the bbox is 83884×48225 m)
  and a non-uniform scale would pass through three's `normalMatrix` and shear
  the world-space normals.
- Differing-depth neighbours leave T-junction cracks; a 150 m downward skirt on
  every tile border hides them. Winding was derived per edge so the skirts face
  outward instead of being backface-culled.
- Tiles are frustum-culled by the traversal against the real elevation range,
  with `mesh.frustumCulled = false`, because GPU displacement makes the
  geometry's own bounds meaningless.
- The traversal measures distance to the tile rather than its centre, so the
  tile under the camera always refines to `MAX_DEPTH` - which
  `sampleRenderedHeight()` relies on.

### Two phase-1 bugs found while doing it
1. **The RG8 reconstruction had never actually run.** `onBeforeCompile`
   receives the shader with `#include` directives *unresolved* -
   `WebGLRenderer` calls it at the getProgram stage and `resolveIncludes()`
   happens later inside `WebGLProgram` - so the old code's replacement of the
   inlined displacement line matched nothing, silently. three's stock chunk ran
   instead, reading only `.x`: **the packed high byte alone**. Rendered
   elevation was off by `(high - low)/65535` of the range, i.e. up to
   **±17.6 m of pseudo-random per-texel noise**, and it looked fine only
   because the high byte carries most of the signal. This contributed to the
   see-through problem. **Injection must target the `#include` directive, not
   the chunk body** - true for any future shader patching in this project.
   Note this invalidates the confident "exact, not an approximation" wording
   the docs and memory carried about this fix: the maths was right, the patch
   never applied.
2. **The terrain had no slope shading at all.** three does not derive normals
   from a `displacementMap`, so every normal pointed +Y and the only depth cue
   was aerial-perspective fog. Normals are now computed on the GPU from the
   height texture at its native resolution. Without this, finer geometry would
   have shown almost no visible improvement.

### Measured before/after
| | 328 m single mesh | LOD terrain |
|---|---|---|
| Gran Paradiso summit drawn | 3917 m (−130 m) | **4045.6 m** (−1.8 m of 4047.4) |
| Drawn surface vs true heightfield | mean 29.2 m, max 3104.9 m | **mean 0.38 m, max 7.73 m** |
| Points that would sink a 1.7 m eye | 44.5% | **0.7%** |
| Analytic model vs three's Raycaster | 0.0175 m | **0.0001 m** |
| Label occlusion tolerance needed | 30 m of slack | **10 m**, from the measured max |

Spawn standoff went 400 m → 1200 m → back to 400 m: it was only moved out to
work around the broken mesh (from 400 m the old geometry hid the summit and all
15 labels), and from 400 m the LOD terrain shows the summit rising a real 130 m
at 18° with a clear sight line.

### Rifugi / trailheads investigation (done, decision pending)
Ran live Overpass queries rather than trusting docs, per the standing rule.
- **Only 4 huts existed because of the query, not the boundary (~89% query).**
  `tools/fetch-osm.mjs:52` asks for `node["tourism"="alpine_hut"]` - nodes
  only, one tag. There are 460 hut-ish elements in the bbox and **35 strictly
  inside** the park boundary, of which the current query can see 4. Missing:
  **9 `way` `tourism=alpine_hut`** (including **Rifugio Vittorio Emanuele II**,
  Città di Chivasso, Savoia, Pontese), 4 `wilderness_hut`, and **19
  `amenity=shelter`** - which is how every *bivacco* is tagged. Fixing the
  query alone takes huts 4 → 35, with **0** `isNearNoData` hits.
- **`docs/ARCHITECTURE.md` §4's "Known OSM data gap" note is factually wrong**
  (it claims Vittorio Emanuele II doesn't turn up under `tourism=alpine_hut`
  nor in Nominatim). Correct it.
- **Pont is *inside* the boundary** (6967 m inside - the Valsavarenche valley
  floor is included), **Thumel is outside** by 791 m. OSM names them "Le Pont"
  and "Le Thumel", and a *different* hamlet actually named "Pont" exists in Val
  di Rhêmes - so any allowlist must key on OSM id, not name.
- **Ceresole Reale, Noasca, Locana, Rosone and Talosio are outside the DEM
  bbox** (0.87-4.9 km below `ymin`). They have no terrain under them and cannot
  become POI without re-extracting the heightmap - a §3 decision, not §4.
- Recommendation put to the user: for huts, fix the query + keep the strict
  boundary + a 750 m buffer (a real 969 m gap follows it, and it catches
  Rifugio Benevolo); for trailheads, a hand-curated 21-row allowlist, because
  no buffer separates the 14 wanted ones from ~100-190 alpine-pasture toponyms,
  and the tightest buffer that catches all 14 (1250 m) also starts shipping
  fake 238.5 m elevations.

### Third real-browser pass (same day, after the LOD landed)
Frame rate confirmed OK, and three more things came back - two of them
*caused* by the terrain finally being accurate, which is worth noting as a
pattern: constants tuned against the old 29 m-inaccurate mesh became visible
once the ground was right.
- **Turn speed 90 → 60 deg/s**, and Shift no longer accelerates turning (a
  predictable rate is easier to aim with; the mouse is still there for a fast
  look-around).
- **Searching a POI landed too far from it.** `FLY_TO_STANDOFF_M` 250 → 60 m -
  the user searched "Col Entrelor" and still had to walk the rest. Verified by
  driving the real search box: the HUD reads "Near Col Entrelor (60 m)" with
  `alt - ground` = 2 m, i.e. standing on the ground at the col.
- **Trails were drawn a few metres above the ground.** Two causes: a fixed 3 m
  lift (`HEIGHT_OFFSET_M`, harmless when the mesh was 29 m off anyway) and
  build-time elevations being true heightfield values rather than the drawn
  surface. Measured over all 26,133 trail vertices: build-time vs drawn is
  mean 0.37 m / max 8.90 m, so the old float was ~3.4 m typical and up to
  ~12 m. Now the lift is 1.5 m and `trails.js` has an `alignToGround()` like
  `poi.js`'s, so it is 1.5 m by construction. Some lift is unavoidable
  (z-fighting), and it is still visible where a trail crosses a skyline edge.
  Note `alignToGround()` must re-run `computeLineDistances()` for the dashed
  styles - it measures real 3D segment lengths, so moving vertices moves the
  dashes.
- **Labels now descend toward the ground as the camera approaches** (user
  request): the offset scales with distance between `LABEL_MIN_OFFSET_M`
  (1.5 m, roughly signpost height) and `LABEL_MAX_OFFSET_M` (12 m, reached at
  600 m). The marker line's top follows it, so the marker stays a post instead
  of detaching from its label. This drove a small restructure of `poi.js`: a
  flat `markers` array replaces the separate `segments`/`labels` lists, so one
  pass per HUD tick does visibility, label height and the line's top vertex -
  they all follow from the same camera distance. `updateLabelVisibility()` is
  now `updateMarkers()`.
- Also: the nav HUD's nearest-POI distance shows metres below 1 km. At walking
  scale a one-decimal km reading was useless - everything under 150 m read
  "0.1 km", and standing 40 m from a col read "0.0 km".

### Rifugi and bivacchi: 4 → 38 (implemented, same day)
The user pointed out the finding had been written up but never acted on
("mancano ancora tutti i rifugi ed i bivacchi nuovi, come minimo nella
ricerca"), then asked to include the ones just outside the perimeter.
- `tools/fetch-osm.mjs` now queries `node|way` × `alpine_hut` /
  `wilderness_hut` / `shelter[shelter_type=basic_hut]`. Hut-ish elements found
  in the bbox went 40 → 197. Other `shelter_type` values were checked and
  deliberately excluded: `public_transport` is bus stops,
  `picnic_shelter`/`gazebo`/`rock_shelter` are not places you can stay.
- `tools/build-poi.mjs` keeps huts up to **750 m outside** the boundary. The
  number is derived, not chosen: the qualifying huts sit at 40 m (Sogno di
  Berdzé), 63 m (Ciavanassa) and 573 m (Rifugio Benevolo), and the next is
  1542 m out - the run confirms that 969 m gap empirically, so the threshold
  sits in empty space. Not extended to other categories: settlements have no
  such gap, which is why trailheads remain undecided.
- Distance is to the nearest boundary **edge**, not vertex - with 7,857
  vertices, vertex-only distance overstates on long straight stretches. Done
  in local scene metres by converting the ring once, the same trick
  `build-trails.mjs` uses.
- Node-vs-way duplicates of the same hut are merged within 150 m, matched on
  **name**. A pure distance rule would have been wrong: flying to Rifugio
  Vittorio Emanuele II Nuovo shows the nearest POI as its "Vecchio" **27 m**
  away, and those are two real separate buildings.
- Result: **370 → 404 POIs, huts 4 → 38**, of which **18 are bivacchi** - a
  class the old query could not see at all. Peaks/passes/lakes/waterfalls
  unchanged (205/116/44/1), confirming nothing else moved. Zero in a DEM
  nodata area. `src/poi.js` labels `shelter_type=basic_hut` as "Bivacco"
  rather than "Rifugio", since 18 of 38 would otherwise be mislabelled.
- **OSM `ele` cross-check**: agrees with our heightfield sampling to ~20 m
  except **Rifugio Noaschetta** (OSM 1520 m vs our 1905 m). One of the two is
  wrong; not chased.
- Verified in the browser, not just in the data: 404 search entries, both
  Vittorio Emanuele II buildings findable, selecting one flies there.

### Trailhead localities: the 22-row allowlist (same day)
User approved the allowlist approach, excluding the places that would need a
new heightmap extraction, and added one from memory: **Eaux Rousses**.
- Looking it up live paid off immediately: there is **no `place=*` node named
  "Eaux Rousses"**. The hamlet is mapped as **"L'Eau-Rousse"** (singular,
  hyphenated, `n1349527920`); the plural spelling belongs to a bus stop. It is
  genuinely inside the boundary, as the user remembered - 1662 m elevation.
- That makes three OSM names that differ from common usage ("Le Pont", "Le
  Thumel", "L'Eau-Rousse"), plus a *different* hamlet actually called "Pont" in
  Val di Rhêmes. Hence `tools/trailheads.json` is keyed on OSM **id**, with an
  optional `displayName` used only where OSM's name would make a place
  unfindable - "Eaux Rousses (L'Eau-Rousse)" contains both spellings, so either
  one matches in the search box. Confirmed: searching "Pont ·" now returns both
  Le Pont and Pont as separate entries.
- **Where curation lives, corrected mid-implementation**: `displayName`/`valley`
  were first applied in `fetch-osm.mjs`, which was wrong twice over - it put
  edited names in what is supposed to be the raw draft, and it made relabelling
  a place cost an Overpass round trip. Moved to `build-poi.mjs`. The draft now
  keeps OSM's raw names, which is also what lets the drift check work.
- **Drift detection**: an id allowlist rots silently when OSM deletes or renames
  a node, so `fetch-osm.mjs` warns on both. It fired once immediately, on Crétaz
  - OSM spells it "Cretaz". Resolved the right way round: the allowlist's `name`
  now matches OSM (so the check stays quiet and therefore meaningful) and
  `displayName` carries the accented spelling.
- New `trailhead` category (green, `Partenza sentieri`) in `src/poi.js`, and
  these bypass the boundary test entirely - an explicit allowlist leaves a
  geographic filter nothing to decide. 8 of the 22 are inside anyway (Le Pont is
  6967 m inside); 14 are deliberately outside, from 100 m (Piamprato) to 1210 m
  (Gimillan).
- **370 → 426 POIs.** Verified in the browser: 426 search entries, 22 labelled
  Partenza sentieri, flying to Eaux Rousses lands at 45.5664°N 7.2084°E /
  1661 m, matching the OSM node.

### DEM licences verified — the deploy blocker is cleared
The user created a GitHub repo for deployment
(github.com/dev-lop77/pngp-viewer), which made the long-standing
"VDA/Piemonte DTM licences unverified" TODO actually blocking: the shipped
site is 21 MB of which 19 MB *is* the DEM, so publishing it redistributes
that data whether or not the sources are published.

**Both are CC BY 4.0**, read from primary documents rather than search
summaries (which is not pedantry here - the VDA region uses CC0, CC BY 4.0
**and CC BY-NC 4.0** for different products, so a portal-level answer would
have been worthless):
- **VDA**: `CC_BY_DTM_v2.pdf`, linked from the geoportal's DTM download page -
  which also confirmed our file is that product, listing "DTM 2005/2008
  aggregato" (= `DTM0508`, the 2005+2008 LIDAR flights). Granted under DGR
  1620/2016 and DGR 899/2014, "anche commerciale". It **prescribes the credit
  wording verbatim**: *"Dati estratti dal Modello Digitale del Terreno (DTM)
  della Regione Autonoma Valle d'Aosta."*
- **Piemonte**: the geonetwork metadata record - `useConstraints` = CC BY 4.0
  deed.it, access "no limitations to public access", lineage documenting the
  2019 upgrade from CC BY 2.5.

Also caught while reading the licences: **CC BY 4.0 requires stating that
changes were made**, not only attribution - and all four CC BY datasets here
(both DTMs, TINITALY, VDA trails) are used heavily modified. That clause had
been quietly missed. `main.js` now shows a static line saying so, and
`heightfield.json` carries a `source.modifications` field.

Updated in three places so a future re-run doesn't reintroduce the TODO:
`tools/dtm-source/merge-heightmaps.sh` (the generator),
`DEM/pngp_heightmap_meta.json` and `public/data/heightfield.json`, each now
also recording `licenseVerifiedVia` with the URL the answer came from. Credits
render in a fixed order now, too - the keys were filled in by whichever fetch
finished first, so the overlay used to reshuffle between loads.

### Phase 1's deploy is DONE — the viewer is live
**https://dev-lop77.github.io/pngp-viewer/** — the last numbered-phase item that
had never been started.

Shape, per the user's decision: **only the built site is published.** A
`gh-pages` orphan branch holds `dist/` plus `.nojekyll` (8 files, 21 MB);
sources, docs, tools and the 43.5 MB intermediate heightmap stay local. The
branch is deliberately orphan - the main history is 123 MB and a static host
needs none of it. `.nojekyll` matters: without it Pages runs the output through
Jekyll, which skips files and directories beginning with an underscore.

`vite.config.js`'s `base: './'` paid off exactly as intended - `index.html`
references `./assets/…` and the sub-path deploy worked with no changes, which
is the payoff for the local sub-path test done back in phase 1.

Three things worth knowing for the next deploy:
- **Redeploying is a small loop**: `npm run build`, copy `dist/.` into the
  worktree, commit, push. The JS hash only changes when the JS does, so a
  CSS/HTML-only change ships as one small file.
- Adding the remote set `origin` on the main repo too. `main` has no upstream,
  so a bare `git push` from it won't publish sources by accident, but be aware
  the remote is now reachable from the source branch.
- The repo's **default branch is `gh-pages`** (GitHub set it when that was the
  first branch pushed to an empty repo), so the repo landing page shows the
  built site. Worth changing if sources are ever published to `main`.

**Verified live, not just "Pages says built"**: fetched the real URL, confirmed
every asset is served with the right content type, then ran the app against the
public site headlessly - HUD reads a real position (45.5142°N 7.2673°E, alt
3918 / ground 3916), 426 search entries, WebGL2 context healthy, **zero failed
requests and zero console errors**. The screenshot then caught a defect the
licensing work had introduced: the credits block had grown to four lines and
was running through the centred controls hint. Fixed and redeployed.

Two access hurdles worth recording, both about the token rather than the code:
`gh` had a stale token for a *different* account (`lop-smart`, not
`dev-lop77`), and the fine-grained PAT initially lacked `Contents: write`,
which fails as a 403 `Write access to repository not granted` at push time.
Misleading detail: `GET /repos/…` reports `"push": true, "admin": true` even
then, because that field describes the *account's* role, not the token's
granted permissions. Enabling Pages via the API also 403s without
`Pages: write` - but it turned out not to matter, since GitHub auto-enables
Pages when it receives a branch named `gh-pages`.

### Credits collapsed behind a toggle (user request)
Four lines of attribution across the bottom of the view was too much furniture,
so `#credits` now opens from a small always-visible "credits…" button.
Compatible with the licences: CC BY 4.0 and ODbL ask for attribution
"reasonable to the medium", not permanently expanded, and a labelled visible
control is what Leaflet/Mapbox do. The affordance stays on screen deliberately -
collapsing is fine, burying it in a menu would not be.
Two interactions this app made non-obvious, both handled: the toggle must
`stopPropagation` so it doesn't reach the canvas' pointer-lock handler, and it
must `blur()` itself afterwards, because `controls.js` preventDefaults the
movement keys on `window` and Space would otherwise activate the focused button
instead of flying upward. Verified: collapsed by default, opens to 4 lines,
Escape closes, pointer lock not grabbed, and WASD still moves after clicking it.

**Note the live site is one commit behind `main` from here on** - the user
considers the deploy test finished for now and will revisit it when the project
is further along. `tools/dev/deploy.sh` republishes whenever wanted.

## Phase 6 started: vegetation

The user chose to open phase 6 with the vegetation, deferring the
satellite/orthophoto question (still open question #1 in
`docs/ARCHITECTURE.md` §12 - never scheduled into any phase, and the roadmap
table never listed it).

### Step 1, done: the terrain is no longer white
`docs/ARCHITECTURE.md` §5's five Alpine altitude bands had been sitting unused
since phase 1 - the terrain material was literally `color: 0xffffff`, so the
only shape cues were slope shading and fog. They now drive a per-pixel albedo in
`src/terrain.js`, computed from three things:

- the **band table** (`VEGETATION_BANDS`), soft-blended over `BAND_BLEND_M` 150 m;
- **slope**, which overrides everything: `bare` mixes 90% toward rock between
  ~30 deg and ~53 deg, because nothing roots on a cliff and snow doesn't sit on
  one either. Written as an ascending `smoothstep` on `n.y` - GLSL leaves
  `smoothstep` **undefined when edge0 >= edge1**, so the descending form would
  have been a portability bug rather than a style choice;
- two octaves of value noise (`BAND_NOISE_M` 75 m) plus a `ASPECT_SHIFT_M` 50 m
  north/south term, so treelines wander and sit lower on cold north faces
  instead of ringing the mountains as contour lines.

### Two traps, both measured rather than guessed
**Colour management double-conversion.** `new THREE.Color(hex)` *already*
converts sRGB to the linear working space (ColorManagement has been on by
default since r152), so the `convertSRGBToLinear()` I first added on top of it
darkened every band by a second gamma - 0x6d became 0.020 instead of 0.153.
There is now a comment in `glslRgb()` saying so.

**Albedo is not appearance, and the gap is enormous.** three's Lambert BRDF
divides by PI; the midday preset lights with sun 1.8 + ambient 0.6 and exposure
0.75. A perfectly sensible-looking `#3f5233` forest green therefore rendered as
very nearly black - the whole Valprato Soana valley came out at about rgb(20).
The fix was not to touch the lighting (phase 4's rig was tuned against a white
terrain and the user approved that look) but to solve the albedo backwards from
the intended on-screen colour: `tools/dev/solve-albedo.mjs` inverts
BRDF -> lights -> exposure -> ACES per channel. **The band hexes consequently
look washed out as swatches and must not be "corrected" by darkening them.**
One band is unreachable: snow wants `#f4f8fd` but even albedo 1.0 only reaches
rgb(195) at this exposure, so `nival` is simply as bright as the rig allows.

### How it was verified
`tools/test-terrain-albedo.mjs` (new, permanent) renders known ground in each
band and compares the pixel to the table numerically. It gets an exact
comparison by lighting the scene with a single `AmbientLight` of intensity PI
and disabling tone mapping: Lambert is `albedo/PI * irradiance` and an ambient
light's irradiance is `colour*intensity`, so the rendered pixel *is* the albedo -
no lighting constant to calibrate, and slope stops affecting shading, which
isolates the band function from the sun. Reading back from a `WebGLRenderTarget`
keeps the values linear. All 7 cases (6 bands + a steep montane point checking
the rock override) match within 0.002, i.e. 8-bit quantisation.

This mattered: "no console errors" has been worthless on this project before,
and a shader that compiles tells you nothing about what it computes.

`patch()` now wraps every shader `replace()` in `terrain.js` and **throws** when
a marker doesn't match, which is precisely how the RG8 displacement bug survived
three phases unnoticed.

`tools/dev/shoot.mjs` (new) screenshots the viewer at a named place by driving
the search box - `tools/verify.mjs` only ever shoots the 3918 m spawn point, up
in the rock band, which is useless for looking at anything that happens at
treeline altitude.

### Brightness: was the open question, now CLOSED
The Cogne view read correctly as a forested valley with bare rock on the steep
faces and lighter rocky summits behind, but headless is SwiftShader and has been
wrong or useless on brightness four times, so it needed a real-browser look.
**The user confirmed it in Firefox: brightness is good.** The solve-backwards
approach to albedo therefore lands where intended - see the verdict section
below, which closes frame rate with it.

### Step 2, done: trees from a real OSM canopy mask
The user chose the OSM mask over a procedural altitude/slope rule, having been
shown that OSM's forest coverage here is genuinely mapped (a count query
returned 3,650 ways + 641 relations) so the runtime cost is one texture tap
either way and the difference is build-time work.

**That choice immediately paid for itself.** Valprato Soana has **0% canopy
within 300 m** - it is a cleared valley-floor village, and the first screenshot
taken there showed no trees, correctly. A procedural elevation+slope rule would
have planted forest right on top of the village. Canopy within 300 m of the
named places, for reference: Pellaud 47%, Crétaz 39%, Le Thumel 31%, Pont 31%,
Eaux Rousses 20%.

Pipeline: `tools/fetch-forest.mjs` -> `tools/build-forest.mjs` ->
`public/data/forest.json` + `forest.6b4f80e1.png` (1158 kB, 16.6% of the bbox
wooded). The draft is 30 MB and gitignored. Decisions worth knowing:

- **The mask sits on exactly the heightfield's grid** (4096x2355, 20.5 m/px,
  same bbox and row order). It therefore needs no projection maths of its own
  and reuses `terrainUv()` unchanged in both shaders that read it.
- **Multipolygon holes come free from the even-odd rule**, which also means
  relation member ways need no stitching into closed rings - parity over one
  polygon's whole segment soup gives the same answer.
- **Coverage, not a bit** (4 sub-rows, exact horizontal spans), so margins are
  soft and the scatter thins out instead of ending on a straight line.
- **Slope is baked in at build time** (full canopy to 30 deg, nothing past 45),
  which is why the runtime never samples the terrain gradient: four extra
  height taps per vertex per instance per frame, for something that never
  changes.
- **Quantised to 16 levels purely for file size.** Measured on this dataset:
  256 levels = 1756 kB, 32 = 1307, 16 = 1158, 8 = 935, 4 = 674. The mask is
  bilinear-filtered and drives a probability, so it needs nothing like 256
  levels, but 4 would make margins visibly steppy across a 20 m pixel.

### The trees: placement is entirely in the vertex shader
`src/vegetation.js` has no CPU-side scatter at all, so walking or flying costs
nothing and there is no hitch when the camera crosses a cell boundary. Each
instance owns a fixed jittered offset inside a `WINDOW_M` square; the shader
moves it to whichever copy of that square is nearest the camera. Because the
shift is always an exact multiple of `WINDOW_M`, every tree lands on a fixed
world lattice - position, height and tint are stable as you move, so nothing
shimmers or reshuffles. A slot holds a tree when the mask coverage beats the
slot's own hash.

**Low-poly opaque cones, deliberately, not billboards**: no alpha sorting, no
texture asset to ship, and correct from above - which matters because you can
fly here. `flatShading: true` also means normals come from screen-space
derivatives, which stays correct through the shader's per-instance non-uniform
scaling for free, instead of needing an inverse-transpose fix per tree.

Density needed one correction: 10 m spacing over a 520 m radius drew isolated
trees rather than forest (one per ~210 m² where real stands run one per
10-20 m²). Now 6 m spacing over 440 m - **27,889 instances, 7 triangles each,
~195k triangles** - with the radius pulled in to pay for the density, since
trees past ~400 m are a few pixels tall and the terrain's own tint carries the
look outward from there. `SPACING_M` and `VISIBLE_M` at the top of the file are
the two performance levers, and they trade against each other.

Trees are also stunted approaching the treeline (scaled to 0.55 between 1600
and 2200 m), which is both true and free - the elevation is already sampled.

### The terrain is tinted too, and that is what makes forest read at distance
`FOREST_FLOOR_COLOR` darkens the ground inside the mask. Without it the near
field would be wooded and the same hillside bare a kilometre away. A first
attempt at `#516b45` was so close to the subalpine green that dense forest was
invisible from the air, which defeats the point - it is now distinctly darker.
Verified from 580 m up over Crétaz: the dark forest swathes follow the valley
flanks with pale meadow above and rocky summits behind.

### How the trees were verified
`tools/test-vegetation.mjs` (new). Since there is no CPU list of tree positions
to inspect, it renders each view twice - vegetation mesh added and removed - and
counts changed pixels: **36.7% of the frame at a dense-forest point, 0.0% above
the treeline.**

`tools/test-terrain-albedo.mjs` gained a wooded case, which is what pins the
mask's *geographic* alignment: it reads the mask back on the CPU and asserts the
rendered pixel equals `mix(band, forestFloor, wood * 0.9)` exactly. A flipped or
offset V would fail this, where "it looks plausible from the air" would not have
noticed. It requires the neighbouring mask pixels to match too - the GPU
bilinear-filters the mask, and a saturated point next to a lighter texel
measured 0.0067 off, close enough to tolerance to flake later.

### The user's real-browser verdict on the vegetation (Firefox)
**Brightness and frame rate are both good** - so the ~195k extra triangles and
27,889 instances are affordable at the shipped settings, and the solved-backwards
albedo lands where it should. Both open questions from this round are closed.
`SPACING_M` / `VISIBLE_M` in `src/vegetation.js` remain the levers if a later
phase eats the headroom.

Still open: trees stay green under the snow weather state. Noted, not addressed.

### Mouse look was jumpy vertically - fixed, and the cause was not the maths
The user reported that moving the view up or down came in jumps rather than at a
constant rate. **The first thing measured was the angle code, and it was
blameless**: twelve identical synthetic 5 px events each moved pitch by exactly
0.572958 deg, with zero roll and no yaw cross-talk, vertical identical to
horizontal. Worth recording, because "the pitch maths is wrong" was the obvious
guess and it would have been wasted work.

Three real causes on the input side, two of them ours:

1. **Rotation was applied the instant a mousemove arrived** (inside
   `PointerLockControls`), so a frame that happened to receive two events turned
   twice as far as one that received one - visible stepping from a perfectly
   steady hand, and worse the further frame rate and mouse polling rate drift
   apart. `src/controls.js` now accumulates deltas and spends them in
   `update(dt)` with a 45 ms **time constant** (`LOOK_SMOOTHING_S`), so the
   behaviour is identical at any frame rate. `plc.pointerSpeed = 0` neutralises
   the addon's own rotation while keeping its lock tracking and movement helpers.
2. **Pitch was clamped at exactly +/-90 deg, which is the YXZ euler
   singularity** - at the pole, roll is forced to zero and yaw is re-derived from
   a different matrix branch, so pushing into the limit snapped the view
   sideways. Now clamped just inside (`MAX_PITCH_RAD`).
3. **OS pointer acceleration, which cannot be fixed from the page on Linux.**
   `requestPointerLock({ unadjustedMovement: true })` is the proper answer and it
   was tried and **backed out**: on Linux it rejects with `NotSupportedError:
   The options asked for in this request are not supported on this platform` and
   the whole request fails, so the lock never engages until a fallback retries -
   and that retry fires `pointerlockerror`, which `PointerLockControls` logs as a
   console error on *every click*. Verified directly against Chromium here. So
   raw mouse input is simply unavailable to a web page on this platform; if the
   response still feels non-constant, the remaining variable is the user's own
   system mouse-acceleration setting.

`tools/test-mouselook.mjs` (new) guards all of it: a 20 px burst spreads over 10
frames with the largest single frame carrying 0.71 deg instead of the full 2.29,
the total lands within 0.02% of what the input asked for (nothing lost or
amplified), and pushing hard into the pitch limit in both directions produces
**0.0000 deg of yaw drift and zero roll**. It drives `controls.update()` at a
fixed 1/60 s rather than real frames, because at SwiftShader's 1-2 fps spending
the whole pending movement in one frame is the *correct* behaviour for a time
constant - testing against real frames would have measured the software renderer
instead of the code, and did exactly that on the first run.

`src/main.js` now exposes `window.__pngp` **under `import.meta.env.DEV` only**
(camera/controls/scene/renderer/lighting), which is what made this measurable
from outside; Vite strips it from a production build. The alternative was
rebuilding the scene inside the test, which stops testing the real one.

### Open questions
0. **Whether the 45 ms mouse-look smoothing feels laggy** - the one thing from
   the mouse-look fix that only the user can judge. `LOOK_SMOOTHING_S` at the top
   of `src/controls.js` is the dial; `0` restores raw per-event behaviour. Also
   still unconfirmed by them: whether the jumps are actually gone, or whether a
   residue remains (which would be OS pointer acceleration, cause 3, and not
   fixable from the page).
1. ~~Frame rate with LOD unmeasured~~ - **CLOSED 2026-08-03: the user
   confirmed frame rate is OK in their real browser** with the LOD terrain
   live, so the ~300 extra draw calls are affordable at the shipped settings
   (`TILE_SEGMENTS` 32 / `MAX_DEPTH` 7 / `SPLIT_FACTOR` 1.5). Headless had
   reported 2 fps on SwiftShader - meaningless, as expected; that makes four
   times headless has been wrong or useless on a visual/perf question here.
   Those three constants at the top of `src/terrain.js` remain the tuning
   levers if a future phase's geometry eats the headroom.
   Also settled by the same test: turn speed went 90 → 60 deg/s (90 read as
   slightly too fast), and Shift no longer accelerates turning.
2. ~~Rifugi/trailhead policy~~ - **DONE 2026-08-03**, both halves (see the two
   sections above). What is left is not a policy question: **Ceresole Reale,
   Noasca, Locana, Rosone and Talosio sit 0.87-4.9 km south of the DEM bbox**,
   with no terrain under them. They need a new heightmap extraction - a
   decision about the bbox (`docs/ARCHITECTURE.md` §3 and
   `tools/dtm-source/*`), not about POI filtering, and it would mean
   re-running the whole 3-source mosaic. Worth asking whether the user wants
   the bbox extended south before the public deploy, since it also affects how
   much of the Piemonte side of the park is visible at all.
3. **LOD popping is not smoothed.** Tiles change resolution abruptly; no
   geomorphing. Unknown whether it's noticeable in practice.
4. Normals are sampled at a fixed one-texel spacing regardless of tile depth,
   so distant coarse tiles get high-frequency normals. Fog washes distant
   terrain out, so this may not matter - worth a look if distant slopes
   shimmer.
5. Previously-open items still stand: "nearest place name" covers POI
   categories only; pointer lock + WASD has no mobile equivalent;
   basemap/orthophoto source;
   `waterway=stream` and glacier relations not fetched; waterfall ribbons are a
   visual approximation.
6. Water/trail/POI data were all built against the true heightfield, so they
   should now sit *better* on the drawn terrain than before (the old mesh was
   29 m off on average) - but this hasn't been checked deliberately.

### Next steps (session ended here, 2026-08-03)
Nothing is half-finished: the working tree is clean and every test passes. Pick
up with whichever of these the user wants.

1. **Confirm the mouse-look fix in a real browser** (open question 0). One
   question only: do the vertical jumps still happen, and does the 45 ms
   smoothing feel laggy? This is the only outstanding item from work already
   done, so it belongs first - but it needs the user, not more code.
2. **Finish phase 6.** Two pieces left, both unstarted:
   - **Wildlife** - Alpine ibex above all, the species the park exists for, plus
     chamois and marmots. `src/wildlife.js` is the slot reserved in
     `docs/ARCHITECTURE.md` §8. Worth knowing before starting: the canopy mask
     (`src/forest.js`) is already loaded and is exactly the signal needed to keep
     animals plausible - ibex above the treeline, chamois at its edge, marmots in
     the open meadow - so habitat comes almost free. The vertex-shader placement
     pattern in `src/vegetation.js` does **not** transfer, though: animals move
     independently and need real per-instance state.
   - **Ambient audio** - procedural, no asset licensing to resolve. Note it needs
     a user gesture to start (browser autoplay policy), and the viewer already
     has a natural one: the click that grabs pointer lock.
3. **Phase 7 polish**, when phase 6 is done: LOD popping/geomorphing (open
   question 3), one-texel normals at any depth (4), the >500 kB bundle, and the
   mobile pass - pointer lock + WASD has no touch equivalent at all.
4. **Republish when wanted** - the live site is now four commits behind `main`.
   `tools/dev/deploy.sh` does the whole thing; the user considers the deploy test
   finished for now, so this is not urgent.
5. Deferred by the user, do not re-raise unprompted: the satellite/orthophoto
   basemap. It has never been scheduled into a phase. §5's altitude bands were
   the deliberate alternative and they are now implemented.

### How to resume
Everything from 2026-08-03 is committed on `main`. This session's own commits, in
order: `dbfcd5a` (credits toggle), `ca5b836` (vegetation bands),
`ecfdf54` (trees from the OSM canopy mask), `964d0b4` (frame-paced mouse look).
Earlier the same day: `f9ae25e`, `5189fd4`, `fb9cb47` and the deploy work.

`tools/dev/start-preview.sh` + port-forwarding is the standing way to look at it
in a real browser (`tools/dev/README.md`), and `tools/dev/shoot.mjs "<place>"
[--climb=m]` is the fast way to see a specific place headlessly without hunting
for it by hand.

**The test tools now cover the fragile parts - run them, they are quick:**
- `node tools/test-rendered-height.mjs` after any change to terrain geometry or
  height sampling. Four separate features depend on the analytic model matching
  the drawn surface.
- `node tools/test-terrain-albedo.mjs` after touching terrain colours or the
  canopy mask. It pins the band colours numerically *and* the mask's geographic
  alignment.
- `node tools/test-vegetation.mjs` after touching trees or the mask.
- `node tools/test-mouselook.mjs` after touching `src/controls.js`.
- The last three need a **dev** server (`start-dev.sh`), not preview: they import
  `/src/*.js` directly and read `window.__pngp`, which only exists under
  `import.meta.env.DEV`.

**Three landmines that have each cost real time - read before editing:**
1. **`onBeforeCompile` gets unresolved `#include` directives.** Patch the
   directive, never the inlined chunk body, and never trust a replacement that
   produces no error. `patch()` in `terrain.js`/`vegetation.js` now throws on an
   unmatched marker, which is the guard that was missing when the RG8 bug
   survived from phase 1.
2. **Albedo is not appearance.** Lambert divides by PI, so a natural-looking
   colour renders near-black under this lighting. Solve it backwards with
   `tools/dev/solve-albedo.mjs`; the washed-out hexes in the code are correct.
   And `new THREE.Color(hex)` **already** converts sRGB to linear - never also
   call `convertSRGBToLinear()`.
3. **Headless is SwiftShader.** Trust it for geometry, colour, layout and
   console errors; never for brightness, frame rate or input feel. It has been
   wrong or useless on those five times now, and it also made
   `test-mouselook.mjs` report a false failure until the test stopped depending
   on real frame timing.

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

**Same day, phase 5 (navigation aids) built right after.** Compass HUD +
live lat/lon/elevation + nearest-named-place readout, all in a new
`#nav-hud` panel (top-center, `index.html`).

### Done: phase 5 (navigation aids)
- **Confirmed via `AskUserQuestion` before building**: "nearest place name"
  reuses the existing 370-POI dataset (`public/data/poi.json` - peaks,
  huts, passes, lakes, waterfalls) rather than fetching real settlement
  names (villages/hamlets) from OSM - the user's call, zero new data
  pipeline needed. Real town/hamlet names (e.g. "Cogne") are NOT covered
  by this - tracked below as a possible future OSM fetch, not a bug.
- **`proj4` promoted from a devDependency to a real one** - anticipated
  back in phase 2 (docs/ARCHITECTURE.md §3/§12) for exactly this moment.
  Same `EPSG:23032` definition as `tools/fetch-osm.mjs` (already verified
  twice against the Mont Blanc summit control point), now also in
  `src/geo.js` as `localToWGS84()`. Real, noticeable bundle-size cost:
  client JS grew from 605 KB to 736 KB (gzip 155 KB -> 199 KB) - accepted,
  a live lat/lon readout can't work without some real-world-CRS math
  client-side and proj4 is the same well-tested library already trusted
  for this exact conversion, not a new risk.
- **New `src/nav.js`** (pure logic, no DOM - same split as poi.js/
  lighting.js): `headingDegrees(camera)` (bearing 0-360 from the camera's
  view direction, using the already-established axis convention +X=East/
  +Z=South from `docs/ARCHITECTURE.md` §6 - North is -Z), `compassLabel()`
  (8-point N/NE/E/.../NW), `nearestPOI(x, z, pois)` (linear scan over
  ~370 points, cheap enough to call every HUD tick, no spatial index
  needed at this N per §10).
- **One real bug caught immediately by `tools/verify.mjs`**: the HUD's
  0.25s-throttled update tick called `localToWGS84()` (needs
  `geo.js`'s local origin) before `loadTerrain()` had resolved and set it -
  a real `pageerror` (`setLocalOrigin() must be called before
  localToWorld()`) on the very first frames. Fixed with an `originReady`
  flag set once `loadTerrain()` resolves, same pattern already used for
  `poiIndex`/`weather` being null until their own async loads finish.
- **Verified the compass math two ways, not just "it renders"**: cross-
  checked the on-screen "NW 323°" reading against manual vector math from
  the actual initial camera position/target (camera->target direction has
  negative X and negative Z components, landing in the 270-360° NW
  quadrant, and the exact number - atan2(-0.6, 0.8) -> 323.13° - matched
  the rendered HUD precisely) - not just eyeballing that a needle moved.
- Verified with `tools/verify.mjs` (zero console/page errors after the fix
  above) and a screenshot showing sane output: a real Alpine lat/lon
  (45.33°N, 7.74°E, within the project's bbox), the camera's actual
  altitude, and a plausible nearest POI with distance.

**Same day, right after: walk/fly navigation replaces OrbitControls.**
Testing phase 5 in a real browser, the user said the elevation readout
was confusing (camera altitude while orbiting an overview doesn't mean
much) and asked for full keyboard navigation - a proper walk/fly control
scheme, defaulting to walking at eye height, with the existing click-a-
POI-to-fly-there behavior kept as an event on top rather than the primary
way to move.

### Done: walk/fly navigation
- **Scoped via `AskUserQuestion` before building** (a real architecture
  change, same bar as other foundational decisions on this project): (1)
  walking is now the *default* mode, not a toggle off of an orbit-overview
  - the user's answer directly replaced OrbitControls rather than adding
  walking alongside it; (2) 'F' toggles a faster fly mode for covering the
  ~84x48km park; (3) no scroll/zoom at all in either mode; (4) mouse-look
  via pointer lock, captured by default (first click locks) rather than a
  reference-style "click to start" overlay.
- **New `src/controls.js`** (`WalkFlyControls`), built on three's own
  `PointerLockControls` addon rather than hand-rolled mouselook - same
  "prefer a well-tested library" instinct as OrbitControls/proj4/turf/Sky
  elsewhere in this project. Confirmed by reading its source (not assumed)
  that it re-derives yaw/pitch from the camera's *current* quaternion on
  every mousemove rather than caching stale state - the same insight
  already on file for `OrbitControls.update()` from phase 2 - so
  `main.js`'s `flyTo()` animation (still triggered by clicking a POI) can
  freely move the camera and hand control back with no manual resync.
  Walk mode: `moveForward()`/`moveRight()` (XZ-plane only) + ground
  clamping via `terrain.js`'s `sampleHeight()` + 1.7m eye height. Fly mode:
  moves along the full 3D look direction (so looking up flies you upward),
  Space/C for pure vertical, no ground clamp. Shift boosts speed in both.
- **A real bug this surfaced, not a new one**: at the chosen spawn point
  (400m from the Gran Paradiso summit, oriented to look at it), the whole
  screen filled with a flat magenta triangle - initially suspected a
  terrain-mesh-resolution problem (the phase-1 terrain mesh is only 256
  segments across the whole bbox, ~328m/quad, an open item in
  `docs/ARCHITECTURE.md` §12 since phase 1) or another SwiftShader
  artifact. Diagnosed properly instead of guessing: repositioned the
  camera to a flatter area via a temporary debug hook - terrain rendered
  fine there, ruling out a general mesh/renderer bug - then checked the
  actual POI data near the spawn point and found a `pass` POI ("Finestra
  del Roc") only 190m away with a 180m-radius sphere marker (purple, this
  category's color matches the artifact exactly) - at walking scale the
  camera was standing almost inside it. This is exactly the "disturbing
  balloons" the user flagged when asking for keyboard navigation, just
  proven to be an active, screen-filling bug rather than only an
  aesthetic complaint.
- **Reworked `src/poi.js` POI markers**: shrank the pickable sphere
  markers from 180-220m radius down to a uniform 4m dot (invisible from a
  26km overview, confirmed by screenshot - no more balloons cluttering the
  wide view either), and added a `CSS2DObject` text label per POI (real
  DOM text over the WebGL canvas, not a WebGL sprite - crisp at any zoom,
  no per-name texture to generate). Labels are hidden beyond 1500m from
  the camera - real decluttering now that walking puts the camera at
  ground level among ~370 POIs, computed in the same throttled tick as
  the nav HUD's nearest-POI lookup (`nav.js`'s scan is reused, not
  duplicated).
- **Picking moved from mouse position to screen center**: pointer lock
  hides the cursor, so there's no mouse position to raycast from once
  locked - `main.js`'s click handler now raycasts from a fixed
  screen-center point (a small HUD reticle marks this, `index.html`) and
  only acts once `controls.locked` is true, which also naturally
  distinguishes "this click just engaged pointer lock" (first click,
  `locked` is still false at click time) from "this click should try to
  select whatever's under the reticle" (any click after) - no extra
  bookkeeping needed.
- **Spawn point**: waits for both terrain (for ground height) and POI
  data (for a real landmark) via `Promise.all()` before positioning the
  camera, avoiding a visible intermediate wrong spot. Looks for a POI
  named exactly "Gran Paradiso" (falls back to any peak, then the first
  POI) and stands 400m south of it at eye height, facing it.
- Added a small always-visible controls hint (`index.html`) - "click to
  look around · WASD move · Shift run · F toggle walk/fly · Space/C
  up/down while flying" - since this is a big, easily-missed behavior
  change from the old orbit-drag navigation.
- Verified with `tools/verify.mjs` (zero console/page errors) and
  screenshots at multiple camera positions (the Gran Paradiso spawn,
  after the marker fix; a flat area at eye level; the old 26km overview
  angle) - **not yet tested for real**: pointer lock, WASD movement feel,
  and mouse sensitivity fundamentally need a real human at the keyboard,
  headless Playwright can't meaningfully evaluate "does this feel good to
  walk around in."
- Also relabeled the phase 5 nav HUD's elevation reading from a bare
  number to `alt NNNN m` while here, addressing the "I don't understand
  what this refers to" confusion directly (it'll read naturally as "your
  elevation" now that walking puts the camera at real ground+eye height).

**Same day, after the user's first real-browser pass on walk/fly.**
Mouse-look and click-to-lock worked; five concrete fixes came back.

### Done: walk/fly follow-up fixes
- **Camera near-clip plane was 10m** - fine for the old 26km overview
  camera, but clipped away anything closer than 10m once walking put the
  camera at 1.7m eye height, which the user correctly read as "floating"/
  see-through geometry. Reduced to 0.1m; `logarithmicDepthBuffer: true`
  (already on since phase 1, for the scene's huge dynamic range) holds
  precision fine at this near/far ratio, confirmed by testing, not just
  assumed.
- **POI markers reworked again**: even after phase-5-follow-up's first
  fix (180-220m spheres -> small 4m dots), the user found the dots
  visibly floated above/sank below the real ground - `elevationM`
  (computed at data-build time from the heightfield) doesn't perfectly
  match what the coarse 256-segment terrain mesh actually renders at
  that exact point (the same discrepancy behind Open question #4 below).
  Replaced the dots with a thin vertical line from the ground up to each
  label (merged per-category `LineSegments`, same §10 instancing
  principle as the dots/trails.js) - the user's own suggested fix, and a
  better one: a line reads as a marker post regardless of a small height
  mismatch, instead of a glaringly "wrong" detached ball.
  `Raycaster.params.Line.threshold` (5m) gives the reticle real tolerance
  to aim at a thin line; hit-index/2 maps back to the right POI (verified
  against three.js's own `Line.raycast()` source, not assumed).
- **Two new POI selection paths added**: (1) click a label directly -
  each label div gets its own click listener (`poi.js`'s new `onSelect`
  callback), meaningful once pointer lock is released (Esc) and the
  cursor is visible again; (2) a searchable `<input list=datalist>` (370
  entries, native browser autocomplete - no custom dropdown code needed
  at this scale) in a new top-left `#poi-search` box, labeled "Name ·
  Category" since plain names aren't guaranteed unique across ~370 POIs.
  Focusing the search box releases pointer lock first (typing shouldn't
  also spin the camera around). Both paths call the same `selectPoi()`
  main.js already had for the reticle path - no duplicated fly-to/panel
  logic. Verified end-to-end headlessly: selecting a far-away peak by
  name actually moved the camera there (checked the nearest-POI readout
  changed to a different, correct nearby POI, not just that the panel
  text updated).
- **Nav HUD now shows ground elevation below the camera, not just the
  camera's own altitude** - the user specifically asked for this (matches
  something considered and dropped for simplicity while first building
  phase 5); most useful in fly mode, where altitude alone doesn't say how
  high above the terrain you actually are. Both numbers together also
  make a good sanity check in walk mode (should always sit ~1.7m apart).

### Open questions (non-blocking)
1. **Midday preset's sky brightness - RESOLVED 2026-07-31**, confirmed
   correct (blue sky) in the user's real browser - see above, was a
   headless/SwiftShader-only artifact.
2. **"Nearest place name" only covers POI categories, not real
   settlements** (see phase 5 Done above) - a deliberate scope choice, not
   a bug; revisit with a new OSM `place=*` fetch if real town/hamlet names
   (e.g. "Cogne", "Valnontey") are wanted later.
3. **Walk/fly navigation - fixes applied but not yet re-confirmed on real
   hardware** (near-clip plane, marker lines, label click, POI search,
   dual elevation readout - see Done above) - all verified headlessly
   only; ask the user to re-test before considering this done.
4. **The 256-segment terrain mesh (~328m/quad) is coarse for close-up
   walking** - confirmed by screenshot that walking right next to a steep
   slope shows large flat facets, not smooth terrain. Not fixed now (out
   of scope for this round) - a real candidate for phase 7 polish
   (`docs/ARCHITECTURE.md` §12's tile/LOD item), now with a concrete
   walking-context reason to prioritize it sooner if ground-level
   exploration becomes a bigger focus. Likely also the deeper cause of
   the POI-marker floating problem (elevationM vs. the coarse mesh's
   actual rendered surface) - fixed there via the connector-line
   workaround rather than by addressing the mesh resolution itself.
5. **Pointer lock + WASD has no mobile equivalent** - touch devices can't
   do either. Not a new conflict (`docs/ARCHITECTURE.md` §11 already
   scopes mobile to "phase 7 at earliest, desktop-first"), but a mobile
   pass will now need a real alternative control scheme (virtual
   joystick + drag-to-look, most likely), not just responsive layout.
6. Previously-open items (Piemonte DTM/VDA license verification, basemap/
   orthophoto source, `waterway=stream`/glacier relations not fetched,
   waterfall ribbons being a visual approximation) all still stand
   unchanged - see the 2026-07-30 section below.

### Next steps (not yet started)
1. **Get the user's real-browser read on the walk/fly follow-up fixes**
   (Open questions #3) - ground-clamping feel, whether the connector
   lines read well, label-click + search usability, the dual
   altitude/ground readout.
2. Finishing phase 1's deploy (GitHub Pages or self-managed Apache,
   `docs/ARCHITECTURE.md` §9) - the only phase left not started. Phase 6
   (wildlife/audio/OSM huts/vegetation) and phase 7 (polish, incl. the
   terrain-LOD item above) are the stretch/refinement goals beyond that,
   per the roadmap.

### How to resume
Everything in this file is committed (`0dad93e` is HEAD as of this
writing - `git log --oneline -8` shows the full run of today's commits,
02d707a through 0dad93e). `npm run dev`/`tools/dev/start-preview.sh` +
port-forwarding is the standing way to check it in a real browser
(`tools/dev/README.md`). **Do not assume the walk/fly follow-up fixes
above actually work** - they're verified headlessly only (screenshots,
`tools/verify.mjs`, simulated search/label-click via Playwright); the
user said "ricontrollo al prossimo giro" (2026-07-31) and hasn't
re-tested in a real browser yet. Start the next session by asking for
that read before building anything further on top of walk/fly - if
something's still off, it's likely one of: the near-clip fix not being
enough, the connector-line/label-click/search interactions feeling
wrong in practice, or the coarse terrain mesh (Open question #4) making
itself known in some new way now that the camera is at ground level.

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
