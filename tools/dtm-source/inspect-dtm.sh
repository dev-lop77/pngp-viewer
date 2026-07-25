#!/usr/bin/env bash
# Read-only inspection of the full-resolution PNGP DTM source (the 10GB
# DTM0508_002_UNICO.ASC that the repo's DEM/heightmap_pngp_4033.png was
# originally extracted from for a UE5 project).
#
# Run this on the machine that actually holds the .ASC file (Ubuntu/WSL,
# root access assumed for installing GDAL if missing). It never modifies
# the source file. Safe to run any time you want to double-check the
# source header/extent/CRS before running extract-heightmap.sh.
#
# Usage: edit SRC_ASC below, then: sudo bash inspect-dtm.sh

set -euo pipefail

# --- EDIT THIS ---
SRC_ASC="/path/to/DTM0508_002_UNICO.ASC"
# Used only if no .prj sidecar is found next to the .asc. ED50 / UTM zone
# 32N — confirmed (not just assumed) by matching the heightmap's
# max-elevation pixel against Mont Blanc's known summit coordinates to
# within ~15m under this CRS, vs. ~200m off under WGS84/ETRS89 UTM32N
# (EPSG:32632/25832). See docs/ARCHITECTURE.md §3 in the pngp-viewer repo.
ASSUMED_EPSG="EPSG:23032"
# ------------------

if ! command -v gdalinfo >/dev/null 2>&1; then
  echo "gdalinfo not found — installing GDAL (requires root)..."
  apt-get update && apt-get install -y gdal-bin
fi

if [[ ! -f "$SRC_ASC" ]]; then
  echo "File not found: $SRC_ASC" >&2
  echo "Edit SRC_ASC at the top of this script to point at the real file." >&2
  exit 1
fi

echo "== Raw ASC header (first 6 lines) =="
head -n 6 "$SRC_ASC"
echo

PRJ_FILE="${SRC_ASC%.*}.prj"
SRC_SRS_ARGS=()
if [[ -f "$PRJ_FILE" ]]; then
  echo "== Found sidecar .prj: $PRJ_FILE =="
  cat "$PRJ_FILE"
  echo
else
  echo "No .prj sidecar found next to the .asc — assuming $ASSUMED_EPSG."
  echo
  SRC_SRS_ARGS=(-a_srs "$ASSUMED_EPSG")
fi

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT
VRT="$WORK_DIR/source.vrt"

# A VRT is a tiny XML wrapper — this does NOT copy or touch the 10GB source.
gdal_translate -of VRT "${SRC_SRS_ARGS[@]}" "$SRC_ASC" "$VRT"

echo "== gdalinfo: extent, resolution, CRS =="
gdalinfo "$VRT"

echo
echo "Full min/max/mean over the whole grid is NOT computed here (would mean"
echo "scanning all 10GB — slow). extract-heightmap.sh computes stats on the"
echo "much smaller cropped area instead, which is all we actually need."
