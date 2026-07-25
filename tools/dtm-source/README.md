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
