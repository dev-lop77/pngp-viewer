# Trail source extraction (external, not part of the build)

Not part of the repo's regular asset pipeline (`tools/build-trails.mjs`,
once written). Downloads the official Regione Valle d'Aosta "Rete
Sentieristica" dataset and clips it to our PNGP bbox, meant to be run
manually whenever we want to (re-)pull the trail network.

Unlike `tools/dtm-source/`, this doesn't need a special machine, root, or a
huge source file — it's a small, direct, unauthenticated HTTPS download.
Output lands in an external work directory (`$HOME/pngp-trails-work` by
default), never in this repo. Copy the clipped GeoJSON in by hand once
`tools/build-trails.mjs` exists to consume it.

## Why not OSM?

`docs/ARCHITECTURE.md` §7 originally scoped "trails/huts from OSM" as a
phase-6 stretch goal. This regional dataset is better for a hiking-focused
viewer: it has the real trail numbering as signed on the ground (segnavia,
e.g. "25A") and CAI difficulty grading (T/E/EE/EEA), which OSM doesn't
reliably carry for this area. OSM may still be worth keeping for things
this dataset doesn't cover (park boundary, hydrology, rifugi as POIs).

## Requirements

`gdal-bin` (for `ogr2ogr` — already needed for `tools/dtm-source/`, see
that folder's README if not installed).

## Usage

`fetch-trails.sh` — downloads `sentieri.zip`, extracts it, and clips two
layers to the PNGP bbox (same bbox as `tools/dtm-source/extract-heightmap.sh`
— the dataset's native CRS, EPSG:23032, already matches our DEM exactly, no
reprojection needed):

- `pngp_sentieri.geojson` — ~1,130 numbered/named itineraries as signed on
  the ground: `nuovo_segn` (segnavia number), `sen_diffic` (difficulty,
  often null at this aggregate level), `sen_nome_s` (name), start/end
  place names, elevation, and length.
- `pngp_tratte.geojson` — finer-grained elementary segments, with
  `difficolta` more reliably populated than `sentieri`'s `sen_diffic`.

Edit `XMIN`/`YMIN`/`XMAX`/`YMAX` at the top for a different area of
interest; defaults match the bbox already used for the DEM.

## License — read before shipping

CC BY 4.0 (Creative Commons Attribution), granted by Regione Autonoma
Valle d'Aosta under DGR 899/2014 and DGR 1620/2016. Free to use, modify,
and redistribute (including commercially), on the condition that any
public-facing use of this data (or a map/render derived from it) carries
this exact attribution:

> Dati forniti dalla Struttura Forestazione e Sentieristica della Regione
> Autonoma Valle d'Aosta.

plus a link to the license and a note that the data was modified (we clip
it to our bbox). The ZIP's own `licenza.pdf` has the full text. This needs
to show up somewhere in the shipped app (e.g. an "about/credits" panel)
once trail data is actually rendered — tracked in `docs/PROGRESS.md`.

There's also a standard liability disclaimer from the region (trails can
be damaged/dangerous, use at your own risk) — that's not a license
restriction, just something worth surfacing to end users of the viewer
too.
