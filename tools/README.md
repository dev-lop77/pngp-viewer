# The asset pipeline, and how a clone gets its data

Everything under `public/data/` is **derived**. Nothing in there was authored by
hand, and each file has exactly one script that makes it. This page is the index of
which script, from what input, and — for the inputs that are deliberately **not** in
the repository — where to get them.

That last part became load-bearing on **2026-08-17**, when the binary heightfields
were taken out of git and out of its history (the user's instruction: *"rimuovendo da
git i file bin pesanti, anche dallo storico"*). Before that, a clone had the data
because git carried it. Now it does not, and this file is the difference between a
reproducible project and one that only builds on one laptop.

## What is not in the repository

| not tracked | size | how to get it back |
|---|---|---|
| `public/data/heightfield.<hash>.bin` | 18.4 MB | `node tools/process-heightmap.mjs` — **but read the trap below about which mosaic** |
| `public/data/heighttier.<hash>.bin` ×2 | 9.5 + 38.1 MB | `node tools/build-height-tier.mjs`, after the base bin exists |
| `DEM/pngp_heightmap.png` + `_meta.json` | 145.9 MB | `~/pngp-dtm-work/`, see `tools/dtm-source/README.md` |
| `tools/hydrology-draft.json` | 6.3 MB | `node tools/fetch-hydrology.mjs` (network: Overpass) |
| `tools/forest-draft.json` | — | `node tools/fetch-forest.mjs` (network: Overpass) |
| `tools/ndvi-draft.bin` + `.json` | — | `python3 tools/basemap-source/build-ndvi.py` (needs the Sentinel-2 scenes) |
| `tools/landcover-osm-draft.json` | 11.6 MB | `node tools/fetch-landcover-osm.mjs` — but that pipeline is retired, read its header first |

The *manifests* (`heightfield.json`, `heighttier.json`, …) **are** tracked. They are a
few KB, they carry the calibration and the verified licence text, and they name the
`.bin` their reader must fetch — so they are the one part that must not be
regenerated casually.

## The trap: the two mosaics are not interchangeable

`DEM/pngp_heightmap.png` currently holds the **5 m** three-source mosaic. The shipped
base heightfield was **not** built from it — it came from the **10 m** mosaic in
`~/pngp-dtm-work/merged-10m/`, which `heightfield.json` records in its own `source`
block (8388 × 4823 at 10 m/px). Running `process-heightmap.mjs` against the 5 m
mosaic as `DEM/` stands today produces a *different* surface, and every baked
elevation downstream — POI, hydrology, and the tier's own residual with them — would
silently disagree with it.

So, in order:

1. **Base heightfield** — put `~/pngp-dtm-work/merged-10m/pngp_heightmap.png` and its
   `_meta.json` in `DEM/`, run `node tools/process-heightmap.mjs`. Keep the tracked
   `heightfield.json`: `merged-10m`'s sidecar predates the licence verification and
   still says *"TODO"* where the repo's manifest carries the CC BY attributions. The
   `.bin` is unaffected — licence text does not enter the elevation maths.
2. **Height tier** — restore the 5 m mosaic to `DEM/` (`~/pngp-dtm-work/merged/`), then
   `node tools/build-height-tier.mjs`. It reads the base `.bin` from step 1 as its
   subtrahend, so the order is not optional.

`process-heightmap.mjs` also deletes stale `heightfield.*.bin` from `public/data/`
as it writes, and `build-height-tier.mjs` does the same for `heighttier.*.bin`. On a
machine that has the shipped copies and not the mosaics, that is a way to lose them.

### This was measured, not assumed (2026-08-17)

The reproduction above was run end to end in a scratch copy of the repo and compared
byte for byte. All three `.bin` files came back **byte-identical**, filenames and
content hashes included — `heightfield.3e0525a4.bin`, `heighttier.c4305763.bin`,
`heighttier.6a73fcb8.bin`. Both manifests matched too, apart from `generatedAt`.

That is the whole justification for untracking them: they are a pure function of
inputs that still exist. It is worth re-checking after any change to
`src/heightfield.js`, `src/heighttier.js`, or either build script, because the moment
the output stops being reproducible the history no longer has a copy to fall back on.

## Where the surviving copies are

- **The base `.bin` has an off-machine copy**: it is published, so
  `git show gh-pages:data/heightfield.3e0525a4.bin` is a real remote-backed source,
  and it is bit-identical to `public/data/`.
- **The two tier levels do not.** They were never published, so after the history
  rewrite their only copies are this working tree and the mosaic they derive from —
  both on this one disk. Publishing the tier would give them the same safety net the
  base has.
- `~/pngp-dtm-work/{merged,merged-10m,vda-5m}/` **must not be deleted** —
  `tools/dtm-source/README.md` says which is which and why each one matters.

## Every file the viewer downloads

| `public/data/` | tracked | built by | from |
|---|---|---|---|
| `heightfield.json` | yes | `process-heightmap.mjs` | 10 m mosaic in `DEM/` |
| `heightfield.<hash>.bin` | **no** | same | same |
| `heighttier.json` | yes | `build-height-tier.mjs` | 5 m mosaic + base `.bin` + `park-boundary.geojson` |
| `heighttier.<hash>.bin` ×2 | **no** | same | same |
| `trails.json` | yes | `build-trails.mjs` | `~/pngp-trails-work/pngp_sentieri.geojson` (`trails-source/README.md`) |
| `poi.json` | yes | `build-poi.mjs` | `osm-poi-draft.json` (tracked) + `heightfield.json` |
| `water.json` | yes | `build-hydrology.mjs` | `hydrology-draft.json` (**untracked**) + `osm-poi-draft.json` |
| — includes the streams | | | fetched over the *region's* bbox, not the DEM's — see below |
| `roads.json` | yes | `build-roads.mjs` | `roads-draft.json` (**untracked**) |
| `forest.json` + `forest.<hash>.png` | yes | `build-forest.mjs` | `forest-draft.json` (untracked) |
| `landcover.json` + `landcover.<hash>.png` | yes | `build-landcover.mjs` | `ndvi-draft.bin/.json` (untracked) |
| `basemap.json` + `basemap.<hash>.webp` | yes | `basemap-source/build-basemap.py` | Sentinel-2 L2A scenes |

Everything in that table except the terrain is cut to the same shape: `region.geojson`
(tracked, from `fetch-region.mjs`), read through `lib/region.mjs`. It is the park plus
the Rhêmes and Valgrisenche comuni since 2026-08-18 — not the park alone — so a feature
in a valley we draw but the park excludes still ships. The park polygon
(`park-boundary.geojson`) is still its own thing and still decides only one question:
where the 5 m terrain tier covers.

Three layers are fetched over the **region's** bounding box rather than the DEM's,
because over the whole bbox they are an order of magnitude larger and the build would
throw the difference away anyway: the forest roads (1,820 tracks against ~10,000),
the streams (3,285 against 8,369) and the village names (620 place nodes against
~5,500 toponyms). The consequence is worth remembering: **growing the region needs a
re-fetch, not just a rebuild.** Every Overpass call goes through `lib/overpass.mjs`,
which retries — the public endpoint refused three separate queries on 2026-08-18.

`fetch-*.mjs` and `build-*.mjs` come in pairs and the split is deliberate: the
`fetch` half talks to the network and bakes elevation into a draft, the `build` half
is offline and shapes the draft into what ships. **A new heightmap invalidates the
drafts too** — re-run the `fetch` half, not just the `build` half, or POI and water
keep the old surface's elevations. `tools/dtm-source/README.md` says the same thing
at more length.

## One consequence for deploying

`tools/dev/deploy.sh` publishes from the local `public/`, not from anything git
holds. It therefore still works exactly as before **on this machine**, and on a fresh
clone it would publish a site whose terrain is missing until the two steps above have
been run. That is a property of the machine now, not of the repository.
