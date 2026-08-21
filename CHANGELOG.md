# Changelog

Notable changes to the PNGP Viewer, newest first. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the version numbers follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html), read for a viewer rather than a
library: **major** for a change to what the thing *is*, **minor** for a new layer, control or
data source, **patch** for fixes and data corrections that change nothing about how it is used.

The single source of truth for the number is `version` in `package.json`. The build injects it
into the HUD, and `tools/verify.mjs` refuses a publish where the two disagree.

Development before 1.0.0 is not itemised here — it is in `docs/PROGRESS-ARCHIVE.md`, which is
a working log rather than a release history.

## [1.0.0] — 2026-08-21

First public release.

### The park, as it is drawn

- **Terrain** from a merged digital terrain model, 4096 × 2832 samples over roughly
  84 × 58 km, 219 m to 4,811 m, with quadtree level-of-detail and five Alpine altitude bands.
  A *Terrain* control chooses 20 m, 10 m (default) or 5 m sampling.
- **Ground imagery** from Sentinel-2, de-shaded against the elevation model so the viewer can
  light it with its own moving sun.
- **An optional 2 m aerial photograph**, 416 sheets of the Valle d'Aosta *Ortofoto 2024* over
  1,664 km² — the park and about 12 km around it. Nothing is fetched until the viewer asks
  (`O`, or the *Orthophoto* tick); then only the nine sheets around the camera, ~1.5 MB,
  following it as a moving atlas.
- **80 glaciers** drawn as firn, bare live ice and moraine rather than one white sheet, with
  ice holding the light a little after the rock around it has gone into shadow.
- **Water**: 263 lakes, 23 rivers, 1,506 streams and 5 waterfalls, with flow, ripple and mist.
- **116 numbered trails** with their *segnavia* and CAI grades, 3 via ferrata, 478 roads and
  tracks, and 708 named places, searchable and clickable.
- **Life**: trees from a real canopy mask; ibex, chamois, marmots, foxes and squirrels placed
  by elevation, slope and tree cover, each reacting to the walker in its own way; eagles,
  vultures, choughs and nutcrackers overhead. A *Models* control raises the detail of the
  animals and the near trees.
- **Grass and scree** from a satellite vegetation measurement, bending in the wind and buried
  by snow, with a density control because it is the most expensive thing in the scene.
- **Edelweiss**, rare and deterministic, on open stony slopes between 1,850 and 2,980 m.
- **Sky and weather**: dawn to night, clear skies, drifting clouds, rainstorm, snowfall, and a
  sky that deepens with altitude.
- **Sound**, entirely procedural: wind that follows the ground you stand on, leaves under
  trees, water from the bank, rain, marmot alarms.

### How it behaves

- Walking and flying, a compass and live position, and a search box that flies you to a place.
- The viewer reopens where you left off, and *copy link* carries the exact view — position,
  heading, time of day, weather and whether the photograph is on.
- Every data source is attributed in the viewer itself, behind *credits*.
- The name and version sit above the search box, injected from `package.json` at build time so
  the number the viewer shows cannot drift from the number the project declares.

### Known limitations, stated rather than hidden

- **The aerial photograph is not de-shaded.** It carries the shadows of the flight
  (21/08–02/11/2024), so a north face is dark twice and at low sun the shadows point the wrong
  way. Measured: one sheet's baked sun fits at azimuth 173°, elevation 32° with r = 0.838,
  against r = 0.078 for no directional sun at all. Removing it needs a per-sheet sun estimate
  that this data does not reliably give.
- **The photograph has no near fade**, so at eye height it is magnified past usefulness and
  the procedural ground would do better for the last few tens of metres.
- **Photographic coverage ends in a straight line** at the regional border. Valle d'Aosta
  publishes this imagery; the Piemonte side of the park has no equivalent open source.
- The photograph reaches 1,700 m from the camera, which is what a 3 × 3 atlas can promise
  rather than a considered distance.
