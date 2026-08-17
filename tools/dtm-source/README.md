# DTM source extraction (external, not part of the build)

These scripts are **not** part of the repo's regular asset pipeline
(`npm run ...` / `tools/process-heightmap.mjs`, once written). They operate
on the full-resolution 10 GB source (`DTM0508_002_UNICO.ASC`) that
`DEM/heightmap_pngp_4033.png` was originally cropped from for a UE5 project,
and are meant to be run manually, on the machine that actually holds that
file (Ubuntu on WSL, root access), whenever we want to (re-)derive a
heightmap crop directly from the authoritative source instead of reusing
the UE5 export.

They never touch the source file in place, and never write into this repo
— outputs land in an external work directory (`$HOME/pngp-dtm-work` by
default). Copy the results into `DEM/` by hand afterwards.

## Why bother, if `DEM/heightmap_pngp_4033.png` already works?

The current PNG was resampled to a **square** canvas to satisfy a UE5
Landscape sizing constraint, even though the real extracted area is a
83.9 × 48.2 km rectangle — see `docs/ARCHITECTURE.md` §3 for the full
writeup. That's fixable downstream (different m/px per axis), but it's a
workaround. Re-deriving directly from the ASC source with
`extract-heightmap.sh` produces a heightmap whose pixel dimensions already
match the true aspect ratio — no correction needed, and the calibration
(bbox, resolution, real min/max elevation) is written out alongside it
instead of inferred after the fact.

## Requirements

`gdal-bin` (the scripts will `apt-get install` it themselves if missing and
you have root). Needs enough free disk/RAM headroom to stream through the
10 GB source once per run — output is much smaller (tens to ~150 MB
depending on `RES_M`).

## Usage

1. `inspect-dtm.sh` — read-only. Edit `SRC_ASC` at the top to the real path,
   then run it to confirm the source header/extent/CRS before committing to
   a full extraction.
2. `extract-heightmap.sh` — edit `SRC_ASC`, and optionally the crop bbox /
   `RES_M` / `OUT_DIR`, then run it. Produces, in `OUT_DIR`:
   - `pngp_dtm_crop.tif` — Float32 GeoTIFF, real elevation in meters, correct
     aspect ratio. Keep this as the reusable master; re-run the PNG/JSON
     step from it directly if you ever want a different resolution without
     re-reading the 10 GB source.
   - `pngp_heightmap.png` — 16-bit grayscale, linearly normalized across the
     crop's real min/max elevation. Drop into the repo's `DEM/` folder.
   - `pngp_heightmap_meta.json` — calibration sidecar (bbox, m/px, real
     min/max elevation, source path). Copy alongside the PNG.

Both scripts default to the same bounding box already calibrated in the
repo (`DEM/pngp_extraction_report.txt`), so running with defaults reproduces
an equivalent-but-undistorted version of the current heightmap. Adjust
`XMIN`/`YMIN`/`XMAX`/`YMAX` in `extract-heightmap.sh` for a different area
of interest.

## Closing the Piemonte-side gap (added 2026-07-30)

The VDA source above only covers Valle d'Aosta - Gran Paradiso NP also has
a Piemonte side, which rendered as a flat fake plain until this was added.
See `docs/ARCHITECTURE.md` §3 ("Closing the Piemonte gap") for the full
story. Three more scripts, run in order:

3. `fetch-piemonte-dtm.sh` — automated (network + GDAL only, no source file
   needed, unlike the VDA script). Pulls Regione Piemonte's own 5m LiDAR
   DTM via their live WCS, tiled to respect the server's `MAXSIZE=2048`
   limit. Outputs `piemonte_dtm.tif` in `$HOME/pngp-dtm-work/piemonte/`.
4. `fetch-tinitaly.sh` — also automated. Downloads the INGV TINITALY tiles
   covering the bbox directly (plain unauthenticated files, no API needed
   despite the download page being a browser tile-picker). Outputs
   `tinitaly.vrt` in `$HOME/pngp-dtm-work/tinitaly/`.
5. `merge-heightmaps.sh` — run after both of the above (and after the VDA
   `pngp_heightmap.png`/`_meta.json` are already in `DEM/`, as produced by
   `extract-heightmap.sh` or already present). Priority-composites all 3
   sources (VDA > Piemonte > TINITALY, best real value per pixel) and
   writes fresh `pngp_heightmap.png`/`_meta.json` to
   `$HOME/pngp-dtm-work/merged/` - copy those into `DEM/` same as before.
   Hard-fails if real elevation data is still missing *inside the actual
   park boundary* (checked via `check-park-coverage.mjs`, not the
   oversized bbox - a residual gap on the France side is expected and
   fine, see §3).

**After copying a new heightmap into `DEM/`**, re-run the full downstream
pipeline, not just `tools/process-heightmap.mjs`: `tools/fetch-osm.mjs` and
`tools/fetch-hydrology.mjs` bake elevation into their own draft JSON and
need to be re-run too (not just their `build-*.mjs` counterparts), or
POI/water will silently keep stale elevations from the old heightfield.

## 5 m, and where the copies live (2026-08-14)

`DEM/pngp_heightmap.png` is now the **5 m** three-source mosaic, 145.9 MB, and it is
**untracked** — `.gitignore` keeps it out of the history, which the DEM PNGs had
grown to 97 MB of. `RES_M` is 5 in both `extract-heightmap.sh`'s successor run and
in `merge-heightmaps.sh`; the two must agree, since the merge composites the other
sources onto the VDA PNG's own grid.

Because the mosaic is no longer versioned, three copies outside the repo are what
keep it reproducible. **Do not delete them without reading this:**

- `~/pngp-dtm-work/merged/` — the current 5 m run. `merged.tif` is the Float32
  master in real metres; the PNG and sidecar there are what `DEM/` holds.
- `~/pngp-dtm-work/merged-10m/` — the **10 m** mosaic and its `merged.tif`. This is
  the input the SHIPPED `heightfield.<hash>.bin` was derived from, and it is
  bit-identical to what was in git. Without it the base heightfield everything in
  the scene stands on cannot be regenerated, and regenerating it from the 5 m mosaic
  would produce a different surface and invalidate every baked elevation downstream
  (POI, hydrology, and the height tier's residual with them).
- `~/pngp-dtm-work/vda-5m/` — the VDA-only 5 m extraction, i.e. the merge's own
  priority-1 input. Keeping it means a re-merge does not have to read the 10 GB ASC
  again.

`tinitaly/` and `piemonte/` are the other two sources and are re-fetchable by
script; these three are not.

**And since 2026-08-17 the derived heightfields are untracked too**, not just the
mosaic: `public/data/*.bin` is in `.gitignore` and gone from the history. `tools/README.md`
is now the per-asset index — which script rebuilds what, in which order, and the fact
that the base heightfield needs `merged-10m/` while the tier needs `merged/`. Getting
that pair the wrong way round produces a plausible surface that disagrees with every
baked elevation in the project.
