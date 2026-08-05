# PNGP Viewer

A navigable 3D viewer for the **Parco Nazionale del Gran Paradiso**, the oldest
national park in Italy — created in 1922 to save the last few hundred Alpine
ibex, which are still its emblem. It runs in a browser and is built from real
elevation, trail and OpenStreetMap data rather than modelled by hand.

**→ [Open the live viewer](https://dev-lop77.github.io/pngp-viewer/)**

Inspired by [ode-to-yosemite](https://github.com/shlokkhemani/ode-to-yosemite).

## What is in it

- **Terrain** from a 20 m digital terrain model: 4096 × 2355 samples over roughly
  84 × 48 km, from 239 m in the valleys to 4,810 m on the Mont Blanc flank at the
  edge of the box, drawn with quadtree level-of-detail and coloured by five Alpine
  altitude bands.
- **73 numbered trails** with their real *segnavia* and CAI grades (T, E, EE, EEA),
  and **426 places** — peaks, cols, huts, bivouacs, lakes, trailheads — searchable
  by name and clickable in the view.
- **Water**: 198 lakes, 10 rivers, 47 glaciers and 3 waterfalls, with animated flow,
  ripple and mist.
- **Sky and weather**: a time-of-day cycle from dawn to night, plus clear skies,
  drifting clouds, rainstorm and snowfall.
- **Life**: about 28,000 trees placed from a real canopy mask, and ibex, chamois,
  marmots, foxes and squirrels that live where their species actually would —
  elevation, slope and tree cover decide where — and react to you when you come
  close, each in its own way.
- **Sound**, entirely procedural, no audio files: wind that follows the altitude and
  the exposure of the ground you are standing on, leaves when you are under trees,
  running water audible from the bank, rain, and marmot alarm whistles.
- The viewer **reopens where you left off**, and *copy link* shares the exact view
  you are looking at.

It opens at the Le Pont trailhead in Valsavarenche, 1,950 m, where the walk to
Rifugio Vittorio Emanuele II and to Gran Paradiso itself begins.

## Getting around

Click to look around, `Esc` to release the mouse. `W`/`S` walk, `A`/`D` turn,
`Q`/`E` sidestep, `Shift` runs. `F` switches between walking and flying, and while
flying `Space`/`C` gain and lose height. `M` toggles the sound. Click a place name,
or search one, to travel to it.

## Data

Every layer comes from an official or open dataset, and all of them are used
**modified** — cropped to the park area, resampled, and in the case of the
elevation merged from three sources:

- Elevation: *Dati estratti dal Modello Digitale del Terreno (DTM) della Regione
  Autonoma Valle d'Aosta.* · *Regione Piemonte - RIPRESA AEREA ICE 2009-2011,
  DTM 5.* · Tarquini S., I. Isola, M. Favalli, A. Battistini, G. Dotta (2023),
  *TINITALY, a digital elevation model of Italy with a 10 meters cell size*
  (Version 1.1), Istituto Nazionale di Geofisica e Vulcanologia (INGV),
  [doi:10.13127/tinitaly/1.1](https://doi.org/10.13127/tinitaly/1.1) — all three
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Trails: *Dati forniti dalla Struttura Forestazione e Sentieristica della Regione
  Autonoma Valle d'Aosta.* — [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Places, water and tree cover: © OpenStreetMap contributors —
  [ODbL 1.0](https://www.openstreetmap.org/copyright).

The same attributions are shown in the viewer itself, behind the *credits* button.

## Built with

Vanilla [Three.js](https://threejs.org) and [Vite](https://vite.dev) — no
framework, no backend, no tile server. The published site is plain static files.

Only the built site is published for now; the sources and the design documents
(`docs/ARCHITECTURE.md` for the design, `docs/PROGRESS.md` for the running status)
are kept outside it.
