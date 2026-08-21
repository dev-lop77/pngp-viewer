# PNGP Viewer

A navigable 3D viewer for the **Parco Nazionale del Gran Paradiso**, the oldest
national park in Italy — created in 1922 to save the last few hundred Alpine
ibex, which are still its emblem. It runs in a browser and is built from real
elevation, trail and OpenStreetMap data rather than modelled by hand.

**→ [Open the live viewer](https://dev-lop77.github.io/pngp-viewer/)**

Inspired by [ode-to-yosemite](https://github.com/shlokkhemani/ode-to-yosemite).

## What is in it

- **Terrain** from a digital terrain model: 4096 × 2832 samples over roughly
  84 × 58 km, from 219 m in the valleys to 4,811 m on the Mont Blanc flank at the
  edge of the box, drawn with quadtree level-of-detail and coloured by five Alpine
  altitude bands. A *Terrain* control trades download for detail — 20 m, 10 m by
  default, or 5 m.
- **An optional 2 m aerial photograph** of the ground near you, 416 sheets of the
  Valle d'Aosta *Ortofoto 2024* covering 1,664 km² — the park and about 12 km
  around it, so Valgrisenche and the whole of Rhêmes are in it as well. Press `O`
  or tick *Orthophoto*. **Nothing is downloaded until you ask**, and then only the
  nine sheets around you, about 1.5 MB, following you as you walk. Beyond that
  edge — the Piemonte side of the park, and everything outside the region — the
  ground stays the 10 m satellite image.
- **116 numbered trails** with their real *segnavia* and CAI grades (T, E, EE, EEA),
  3 via ferrata, 478 roads and tracks, and **708 places** — peaks, cols, huts,
  bivouacs, lakes, trailheads — searchable by name and clickable in the view.
- **Water**: 263 lakes, 23 rivers, 1,506 streams, 5 waterfalls, with animated flow,
  ripple and mist.
- **80 glaciers**, drawn as the three things a glacier actually is rather than one
  white sheet: firn above the snow line, bare live ice below it, and the moraine
  it carries. Ice takes the sun differently from rock, so it keeps a little light
  after the slope around it has gone into shadow.
- **Sky and weather**: a time-of-day cycle from dawn to night, plus clear skies,
  drifting clouds, rainstorm and snowfall. The sky deepens as you climb, because
  the air column above you really does thin — the same reason the zenith goes dark
  blue on a high col and stays milky in the valley.
- **Life**: trees placed from a real canopy mask rather than an altitude guess, so
  the wood stops where the wood stops; ibex, chamois, marmots, foxes and squirrels
  that live where their species actually would — elevation, slope and tree cover
  decide — and react to you when you come close, each in its own way; and eagles,
  vultures, choughs and nutcrackers overhead. A *Models* control makes the animals
  and the near trees finer if your machine can afford it.
- **Grass and scree** under your feet, growing where a satellite measurement says
  vegetation actually grows rather than where an altitude band guesses it might:
  meadow in the valleys, thin alpine turf towards the treeline, bare stone above
  it, nothing on the glaciers. It bends in the wind and is buried by snow. How much
  is drawn is a control, because it is the most expensive thing in the scene.
- **Edelweiss**, rare and deterministic, on open stony slopes between 1,850 and
  2,980 m. Walk near one and the viewer says so — a shared link leads to the same
  flower.
- **Sound**, entirely procedural, no audio files: wind that follows the altitude and
  the exposure of the ground you are standing on, leaves when you are under trees,
  running water audible from the bank, rain, and marmot alarm whistles.
- The viewer **reopens where you left off**, and *copy link* shares the exact view
  you are looking at — including the time of day, the weather and whether the
  photograph is on.

It opens at the Le Pont trailhead in Valsavarenche, 1,950 m, where the walk to
Rifugio Vittorio Emanuele II and to Gran Paradiso itself begins.

## Getting around

Click to look around, `Esc` to release the mouse. `W`/`S` walk, `A`/`D` turn,
`Q`/`E` sidestep, `Shift` runs. `F` switches between walking and flying, and while
flying `Space`/`C` gain and lose height. `M` toggles the sound, `O` the aerial
photograph. Click a place name, or search one, to travel to it.

## Data

Every layer comes from an official or open dataset, and all of them are used
**modified** — cropped to the park area, resampled, and in the case of the
elevation merged from four sources:

- Elevation, three of them under
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): *Dati estratti dal
  Modello Digitale del Terreno (DTM) della Regione Autonoma Valle d'Aosta.* ·
  *Regione Piemonte - RIPRESA AEREA ICE 2009-2011, DTM 5.* · Tarquini S.,
  I. Isola, M. Favalli, A. Battistini, G. Dotta (2023), *TINITALY, a digital
  elevation model of Italy with a 10 meters cell size* (Version 1.1), Istituto
  Nazionale di Geofisica e Vulcanologia (INGV),
  [doi:10.13127/tinitaly/1.1](https://doi.org/10.13127/tinitaly/1.1).
- Elevation, the fourth, under its **own** licence and not CC BY: *produced using
  Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH
  2014-2018 provided under COPERNICUS by the European Union and ESA; all rights
  reserved*
  ([licence](https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/DEM/resources/license/License-COPDEM-30.pdf)).
  Its Article 6(c) obliges us to carry this with any public communication: *the
  organisations in charge of the Copernicus programme by law or by delegation do
  not incur any liability for any use of the Copernicus WorldDEM-30.*
- Aerial photograph: *Ortofoto 2024 © Regione Autonoma Valle d'Aosta* —
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), the licence document
  travelling with the data itself. Resampled from the 20 cm original to 2 m and
  re-encoded; it covers the region only, which is why it stops at the regional
  border.
- Ground imagery and vegetation cover: *Contains modified Copernicus Sentinel data
  2025* — Sentinel-2 L2A, 8 August and 9 July 2025, under the
  [Copernicus Sentinel Data Legal Notice](https://sentinels.copernicus.eu/documents/247904/690755/Sentinel_Data_Legal_Notice).
  The illumination of the acquisition has been divided back out using the
  elevation above, so the viewer can light the ground with its own moving sun. The
  same two scenes give the NDVI that decides where grass grows.
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
