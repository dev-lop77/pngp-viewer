#!/usr/bin/env bash
# Extracts a calibrated, correctly-proportioned heightmap crop from the
# full-resolution PNGP DTM source, for the pngp-viewer web project.
#
# Unlike the heightmap currently in the repo (DEM/heightmap_pngp_4033.png,
# originally produced for a UE5 project), this does NOT force a square
# canvas — output pixel dimensions follow the real bbox aspect ratio
# exactly, so there's no anisotropic-scale correction to carry around
# downstream. See docs/ARCHITECTURE.md §3 in the pngp-viewer repo.
#
# Run this OUTSIDE the git repo, on the machine holding the 10GB .ASC file
# (Ubuntu/WSL, root access assumed for installing GDAL if missing). It
# never modifies the source file in place, and writes its own (much
# smaller) output to OUT_DIR below. Copy the resulting PNG + JSON sidecar
# into the repo's DEM/ folder afterwards.
#
# Usage: edit the variables below, then: sudo bash extract-heightmap.sh

set -euo pipefail

# --- EDIT THESE ---
SRC_ASC="/path/to/DTM0508_002_UNICO.ASC"
ASSUMED_EPSG="EPSG:23032"          # ED50 UTM32N — confirmed via Mont Blanc summit cross-check, see docs/ARCHITECTURE.md §3
OUT_DIR="$HOME/pngp-dtm-work"      # output location — outside the repo

# Crop extent, UTM32N meters. Defaults match the area already calibrated
# in the repo (docs/pngp_extraction_report.txt) — adjust if you want a
# different/tighter area of interest.
XMIN=329116
YMIN=5036775
XMAX=413000
YMAX=5085000

# Output resolution, meters/pixel. 10 m/px keeps this large an area a
# manageable size while preserving plenty of terrain detail; the repo's
# own tools/process-heightmap.mjs (Node/Vite side) can downsample further
# for the final GPU displacement texture size.
RES_M=10
# --------------------

mkdir -p "$OUT_DIR"

if ! command -v gdalinfo >/dev/null 2>&1; then
  echo "GDAL not found — installing (requires root)..."
  apt-get update && apt-get install -y gdal-bin
fi

if [[ ! -f "$SRC_ASC" ]]; then
  echo "File not found: $SRC_ASC" >&2
  echo "Edit SRC_ASC at the top of this script." >&2
  exit 1
fi

PRJ_FILE="${SRC_ASC%.*}.prj"
if [[ -f "$PRJ_FILE" ]]; then
  echo "Sidecar .prj found (for reference — NOT used to set the CRS, see below):"
  cat "$PRJ_FILE"
fi
# The sidecar .prj (if present) uses old ESRI-style keywords ("Datum EUR_M",
# "Spheroid INT1909") that GDAL can't map to a specific registered EPSG code
# — it parses them as an "unspecified datum on the International 1924
# ellipsoid", which is consistent with ED50 but has no defined WGS84
# transform, so trusting it silently could give a lat/lon conversion with
# an unknown, unchecked error. We force ASSUMED_EPSG explicitly instead,
# which we verified independently (see docs/ARCHITECTURE.md §3): the
# heightmap's max-elevation pixel back-projects to within ~15m of Mont
# Blanc's known summit under EPSG:23032, vs ~200m off under
# EPSG:32632/25832.
echo "Forcing CRS to $ASSUMED_EPSG (verified, not auto-detected)."
VRT="$OUT_DIR/source.vrt"
gdal_translate -of VRT -a_srs "$ASSUMED_EPSG" "$SRC_ASC" "$VRT"

CROP_TIF="$OUT_DIR/pngp_dtm_crop.tif"
echo
echo "== Cropping + resampling to ${RES_M} m/px (this reads through the full 10GB source once) =="
gdalwarp -overwrite \
  -te "$XMIN" "$YMIN" "$XMAX" "$YMAX" \
  -tr "$RES_M" "$RES_M" \
  -r bilinear \
  -co COMPRESS=DEFLATE -co PREDICTOR=3 -co TILED=YES -co BIGTIFF=IF_SAFER \
  "$VRT" "$CROP_TIF"

echo
echo "== Real elevation stats of the crop (defines the PNG normalization range) =="
STATS=$(gdalinfo -stats "$CROP_TIF" | grep -E "STATISTICS_(MINIMUM|MAXIMUM|MEAN)")
echo "$STATS"

ELEV_MIN=$(echo "$STATS" | grep MINIMUM | grep -oE '[-0-9.]+$')
ELEV_MAX=$(echo "$STATS" | grep MAXIMUM | grep -oE '[-0-9.]+$')

if awk -v v="$ELEV_MIN" 'BEGIN { exit !(v < -100) }'; then
  echo
  echo "WARNING: minimum elevation ($ELEV_MIN m) looks like a NODATA sentinel," >&2
  echo "not real terrain. Your crop (XMIN/YMIN/XMAX/YMAX) likely extends" >&2
  echo "beyond the source data's actual coverage — narrow the bbox and rerun." >&2
fi

PNG_OUT="$OUT_DIR/pngp_heightmap.png"
echo
echo "== Normalizing to 16-bit PNG (0-65535 across ${ELEV_MIN}-${ELEV_MAX} m) =="
gdal_translate -ot UInt16 -scale "$ELEV_MIN" "$ELEV_MAX" 0 65535 -of PNG "$CROP_TIF" "$PNG_OUT"

SIZE_INFO=$(gdalinfo "$CROP_TIF" | grep "Size is")
WIDTH=$(echo "$SIZE_INFO" | sed -E 's/Size is ([0-9]+), ([0-9]+)/\1/')
HEIGHT=$(echo "$SIZE_INFO" | sed -E 's/Size is ([0-9]+), ([0-9]+)/\2/')

META_OUT="$OUT_DIR/pngp_heightmap_meta.json"
cat > "$META_OUT" <<EOF
{
  "source_file": "$SRC_ASC",
  "crs": "$ASSUMED_EPSG",
  "bbox_utm32n": { "xmin": $XMIN, "ymin": $YMIN, "xmax": $XMAX, "ymax": $YMAX },
  "resolution_m_per_px": { "x": $RES_M, "y": $RES_M },
  "image_size_px": { "width": $WIDTH, "height": $HEIGHT },
  "elevation_m": { "min": $ELEV_MIN, "max": $ELEV_MAX },
  "note": "Aspect ratio matches the real bbox exactly - no square-canvas resampling, unlike the original UE5 export (DEM/heightmap_pngp_4033.png)."
}
EOF

echo
echo "Done. Outputs in $OUT_DIR:"
echo "  - pngp_dtm_crop.tif        Float32 GeoTIFF, real meters — keep as the master copy"
echo "  - pngp_heightmap.png       16-bit grayscale — drop into the repo's DEM/ folder"
echo "  - pngp_heightmap_meta.json calibration sidecar — copy alongside the PNG"
echo
echo "Next: copy pngp_heightmap.png + pngp_heightmap_meta.json into the"
echo "pngp-viewer repo's DEM/ folder (they can replace/supplement the current,"
echo "aspect-distorted heightmap_pngp_4033.png)."
