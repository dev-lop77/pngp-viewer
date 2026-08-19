# Dev workflow scripts

A small, growing library of scripts for command sequences that come up
often enough during development to be worth not retyping - starting with
starting/stopping the local test server. Add to this folder (with a short
README update) whenever a multi-step command sequence gets used more than
a couple of times, rather than re-deriving it each session.

## Testing in a real browser (VS Code port forwarding)

The usual flow when asked to check something in an actual browser rather
than headlessly:

1. `tools/dev/start-dev.sh` (fast iteration, HMR) or
   `tools/dev/start-preview.sh` (closer to real static hosting - builds
   first, then serves the production bundle; use this one when the thing
   being checked is specifically about the deployed build, e.g.
   `docs/ARCHITECTURE.md` §9's GitHub Pages/Apache targets).
2. Forward the printed port with VS Code (`Ports` panel -> Forward a Port,
   or it may auto-detect once something's listening) and open it in a
   real, local browser.
3. `tools/dev/stop.sh` when done (stops both default ports; pass explicit
   port numbers to stop only specific ones).

Both start scripts:
- kill anything already on the target port first (avoids `EADDRINUSE` on
  a re-run),
- run the server in the background and poll until it actually responds
  rather than a blind `sleep`,
- log to `tools/dev/logs/` (gitignored via the repo's `*.log` rule) so a
  failed start can be diagnosed without re-running blind.

## Scripts

- `start-dev.sh [port]` — `vite` dev server, default port 5173.
- `start-preview.sh [port]` — `npm run build` + `vite preview`, default
  port 4173. Slower to start (rebuilds every time) but is the accurate
  simulation of real static hosting — this is what caught the
  `import.meta.env.BASE_URL` sub-path bug, see `docs/PROGRESS.md`.
- `stop.sh [port ...]` — stops whatever's listening on the given ports
  (default: 5173 and 4173, i.e. both of the above).
- `deploy.sh` — builds and publishes to GitHub Pages
  (<https://dev-lop77.github.io/pngp-viewer/>).
- `shoot.mjs "<place>" [out.png] [--climb=m] [--pitch=deg] [--look=deg]` —
  screenshots the viewer standing at a named place, by driving the search
  box. `tools/verify.mjs` only ever shoots the default spawn — since
  2026-08-04 the Le Pont trailhead at 1,950 m, which is at least in the
  right band, but still one fixed valley. `--climb` rises in fly mode
  (polling the HUD altitude, since
  fly speed is `controls.js`'s business) and pitches down, which is the
  only way to judge what reads at landscape scale — forest cover, LOD,
  band transitions.
- `shoot-url.mjs "<url with #hash>" [out.png]` — shoots the viewer at a SHARE LINK, i.e.
  the exact view someone sends you. `shoot.mjs` cannot: it drives the search box and
  flies to a *place*, while the hash is a *camera* (`src/viewstate.js`). Added 2026-08-19
  when the user reported three defects on the refuge and gave the angle as a URL - which
  is the fastest possible bug report and deserved a tool. No DOM in the picture (see
  `../lib/canvas-capture.mjs`); it prints the HUD text instead.
- `probe-snow.mjs ["Place"] [--wooded=elevM] [--climb=m] [--back=m]` — watches
  lying snow settle and melt in the real page. Shoots two series: `lying-*`
  pins the snow level under a **clear sky**, which is the only way to see what
  the snow itself does (switching the weather to Snowfall also drops a cloud
  deck, doubles the haze and fills the frame with falling particles — the first
  version of this probe could not tell any of that from snow on the ground), and
  `build-*`/`melt-*` shoot the real weather over real wall-clock time. Level is
  read from `snow.js`'s own holder per shot, never inferred from the pixels.
  `--wooded=1800` stands in the densest canopy near that elevation instead of at
  a named place, which is the only way to see the trees at all — they draw within
  440 m of the camera. Two things it learned the hard way: reading a WebGL canvas
  back with `drawImage()` after the frame is presented returns an empty buffer
  *silently* (it reported 0.000 luma for every shot, snow and all — measure the
  screenshot instead), and at ~1 fps the level read just before a shot is up to
  one frame ahead of the pixels, so only the pinned rows are exact.
- `probe-groundcover.mjs` — grass, shrubs and edelweiss in the real page, and the
  one place the cost of them is written down. **Every layer is measured alone**: a
  single combined figure read 21.9% once and was believed, and all of it was the
  shrubs while the grass drew nothing. Four vantages spanning the mask's own
  gradient, including a glaciated summit as the control — anything drawn there means
  the mask is not being read. Three things it learned the hard way: a **pass is the
  worst place to stand** to look at the ground (on a saddle a camera pitched down is
  looking at a valley 400 m off, and the layer reports 0.00% while working), a
  **point sample of the mask is not comparable to an area effect** (one 41 m texel
  read 0.000 where the grass around it was plainly drawn), and a holder main.js
  drives per frame — `GROUNDCOVER_WIND`, `SNOW_LEVEL` — **cannot be pinned by
  assignment**, only by redefining its accessor. The frame times it prints are
  SwiftShader's and are only good as ratios between settings.
- `probe-glaciers.mjs [tag]` — the glaciers from three fixed vantages, tagged so two runs
  of different code sit side by side in `logs/`. Written for the 2026-08-19 change from a
  draped sheet to a terrain mask, and the fixed cameras are the point: whether ice follows
  the ground can only be judged by comparing one camera to itself. It also reports whether
  the old `water-glaciers` sheet is in the scene, counting its triangles index-aware - that
  geometry is indexed, so `position.count / 3` yields 96,988, which is a triangle count of
  nothing. The real figure was 563,567.
- `probe-haze.mjs [url] [--scales=..] [--time=0.15] [--only=summit|nivolet|cogne]` —
  sweeps the distance haze in the real page from three vantages that ask three
  different questions (42 km from the Gran Paradiso summit, 5-12 km from the
  Nivolet, 2-12 km at Cogne's valley altitude), one session and one camera per
  vantage. It reports the LIVE uniform per shot, not the value asked for: the knob
  is `HAZE_SCALE`, the holder `lighting.js` multiplies in, because the uniform
  itself is rewritten every frame and an assignment to it reads back its own write.
  The images are the SHAPE of the change and the numbers are ratios under one
  renderer — the verdict is the user's, at `H` in a real browser, because headless
  is SwiftShader. Two mistakes it made first: POI labels left inside the measured
  band (white boxes, so the contrast reading was partly the HUD), and a hand-rolled
  projection that put the horizon 80 px below the skyline — caught by measuring
  where the sky actually ends in the shot, not by re-reading the algebra.
- `probe-huts.mjs [url] [--models=0|1]` — the 51 buildings (`src/huts.js`): how many
  were placed, of which kind, how many triangles, whether any of them stands on air,
  and whether the marker post really stepped aside. Three deliberate refusals in it:
  it does NOT check the seating with `sampleRenderedHeight`, the sampler that did the
  seating (§13.9) - it compares against the BILINEAR height, a different function over
  different data, and takes a picture; it does NOT ask `huts.hasBuilding()` whether a
  post is hidden but measures the drawn `LineSegments` attribute; and it does not use
  `page.screenshot()`. The label has to be read from the DOM, because a CSS2DObject is
  drawn over the canvas and `readPixels` never sees it.
- `probe-landcover.mjs [--radius=m] [--dir=]` — reads the shipped masks and asks
  whether the data says "grass" where a visitor actually stands. No browser. This is
  what caught the OSM route being empty inside the park; `--dir=tools/landcover-unshipped`
  reproduces that table from the retired pipeline rather than trusting the note.
- `probe-ndvi.mjs` — the NDVI distribution inside the park by elevation and by
  whether OSM calls it wooded. It chooses `build-landcover.mjs`'s two thresholds, so
  they come from the measured distribution rather than a textbook range.
- `verify-mask-raster.mjs` — rebuilds the forest mask through the shared rasteriser
  in `tools/lib/mask-raster.mjs` and compares it to the shipped PNG byte for byte.
  Run it after touching that file: "I only moved the code" is exactly the claim that
  is easy to believe and cheap to check.
- `../lib/canvas-capture.mjs` — not a script: the shared "take a picture of the running
  viewer" helper, used by `probe-haze.mjs` and `probe-huts.mjs`. It reads the canvas with
  `gl.readPixels` inside a frame and encodes the PNG in node, because on this scene
  `page.screenshot()` costs minutes (it forces a second render pass) and
  `canvas.toDataURL('image/png')` costs 80-91 s even on a frame of pure sky. Measured
  2026-08-19; the file carries the table.
- `solve-albedo.mjs [hex ...]` — inverts BRDF → lights → exposure → ACES
  to turn "what this should look like on screen" into the albedo hex to
  put in the code. Needed because the two are far apart here: Lambert
  divides by π, so a natural-looking forest green renders nearly black.
  See `docs/ARCHITECTURE.md` §5.

## Deploying

`tools/dev/deploy.sh` is the whole thing: build, sync `dist/` into an orphan
`gh-pages` worktree, commit, push. Safe to re-run — it reuses a stale
worktree, and says "nothing changed" instead of pushing an empty commit.

Only the built site is published (decided 2026-08-03): no sources, no design
docs, no tools, and none of the main history. **The one exception, added
2026-08-05 at the user's request: `README.md` ships with the site.** `gh-pages` is
the repository's default branch, so the README in the payload is what GitHub shows
on the repository page — a README on `main` would be invisible, since `main` has
never been pushed.

The script *refuses to push* anything else, so that decision can't be undone by
accident: the site root must contain only what the build produces
(`index.html`, `assets`, `data`, `.nojekyll`, `README.md`), and no `.mjs`, `.sh` or
`.map` may appear anywhere inside it — a sourcemap would publish the sources it
maps back to.

That guard used to be an extension blacklist including `*.png`, and it had
silently rotted: `data/forest.<hash>.png` (the OSM canopy mask) is a legitimate
data asset, so from the vegetation landing on 2026-08-03 until 2026-08-05 it would
have refused every deploy. Prefer a whitelist of what the build produces when
adding to this — insurance that fails closed on legitimate content is worse than
none, because it gets disabled in a hurry.

Pages needs no setup — GitHub enables it automatically for a branch named
`gh-pages`. Two things that cost time the first time round:

- A **fine-grained** PAT needs `Contents: Read and write`, or the push fails
  with `403 Write access to repository not granted`. Confusingly,
  `GET /repos/…` still reports `"push": true` — that field is the *account's*
  role, not the token's permissions. Changing a fine-grained token's
  permissions takes effect immediately, with no need to re-run `gh auth login`.
- Pages on a **private** repo needs a paid plan; this repo is public.

After deploying, don't stop at Pages reporting `built` — check the live site:
`node tools/verify.mjs https://dev-lop77.github.io/pngp-viewer/`.
