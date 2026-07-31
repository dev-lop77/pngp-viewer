#!/usr/bin/env bash
# Merges the 3 DEM sources into one calibrated heightmap, priority-ordered
# best-available-per-pixel (docs/PROGRESS.md, docs/ARCHITECTURE.md §3):
#   1. VDA (DEM/pngp_heightmap.png) - best, but Valle d'Aosta only.
#   2. Piemonte WCS (fetch-piemonte-dtm.sh) - fills most of the rest, but
#      doesn't reach the highest glaciated peaks (verified).
#   3. TINITALY (fetch-tinitaly.sh) - national mosaic, fills whatever's
#      still missing.
# Run fetch-piemonte-dtm.sh and fetch-tinitaly.sh first.
#
# Technique: gdalwarp each source onto the exact same target grid (this
# bbox, EPSG:23032, 10m/px) with its own real nodata value normalized to a
# shared sentinel, then gdal_merge.py composites them in priority order -
# GDAL only overwrites with a later input where THAT input has valid
# (non-nodata) data, which is exactly a "best source per pixel" merge, not
# a blunt overwrite.
#
# Usage: bash merge-heightmaps.sh

set -euo pipefail

# --- EDIT THESE ---
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VDA_PNG="$REPO_DIR/DEM/pngp_heightmap.png"
VDA_META="$REPO_DIR/DEM/pngp_heightmap_meta.json"
PIEMONTE_TIF="$HOME/pngp-dtm-work/piemonte/piemonte_dtm.tif"
TINITALY_VRT="$HOME/pngp-dtm-work/tinitaly/tinitaly.vrt"
TINITALY_ATTRIBUTION_FILE="$HOME/pngp-dtm-work/tinitaly/ATTRIBUTION.txt"
OUT_DIR="$HOME/pngp-dtm-work/merged"

XMIN=329116
YMIN=5036775
XMAX=413000
YMAX=5085000
RES_M=10
NODATA=-9999
# --------------------

mkdir -p "$OUT_DIR"

for f in "$VDA_PNG" "$VDA_META" "$PIEMONTE_TIF" "$TINITALY_VRT"; do
  if [[ ! -f "$f" ]]; then
    echo "Missing input: $f" >&2
    echo "Run fetch-piemonte-dtm.sh and fetch-tinitaly.sh first." >&2
    exit 1
  fi
done

VDA_ELEV_MIN=$(python3 -c "import json; print(json.load(open('$VDA_META'))['elevation_m']['min'])")
VDA_ELEV_MAX=$(python3 -c "import json; print(json.load(open('$VDA_META'))['elevation_m']['max'])")
echo "VDA source elevation range: $VDA_ELEV_MIN - $VDA_ELEV_MAX m"

echo
echo "== Step 1: VDA PNG -> real-elevation GeoTIFF (pixel 0 = nodata, the same"
echo "   undeclared sentinel docs/PROGRESS.md already found - now handled"
echo "   explicitly instead of silently passing through as ~292m) =="
VDA_RAW="$OUT_DIR/vda_raw.tif"
VDA_ELEV="$OUT_DIR/vda_elevation.tif"
gdal_translate -q -a_srs EPSG:23032 -a_ullr "$XMIN" "$YMAX" "$XMAX" "$YMIN" \
  "$VDA_PNG" "$VDA_RAW"
gdal_calc.py --quiet -A "$VDA_RAW" --outfile="$VDA_ELEV" \
  --calc="where(A==0, $NODATA, A.astype(numpy.float32)*($VDA_ELEV_MAX-$VDA_ELEV_MIN)/65535.0+$VDA_ELEV_MIN)" \
  --NoDataValue=$NODATA --type=Float32 --overwrite

echo
echo "== Step 2: align all 3 sources to the same grid (bbox, EPSG:23032, ${RES_M}m/px) =="
VDA_ALIGNED="$OUT_DIR/vda_aligned.tif"
PIEMONTE_ALIGNED="$OUT_DIR/piemonte_aligned.tif"
TINITALY_ALIGNED="$OUT_DIR/tinitaly_aligned.tif"

gdalwarp -q -overwrite -t_srs EPSG:23032 -te "$XMIN" "$YMIN" "$XMAX" "$YMAX" -tr "$RES_M" "$RES_M" \
  -r near -srcnodata $NODATA -dstnodata $NODATA "$VDA_ELEV" "$VDA_ALIGNED"
gdalwarp -q -overwrite -t_srs EPSG:23032 -te "$XMIN" "$YMIN" "$XMAX" "$YMAX" -tr "$RES_M" "$RES_M" \
  -r bilinear -srcnodata $NODATA -dstnodata $NODATA "$PIEMONTE_TIF" "$PIEMONTE_ALIGNED"
gdalwarp -q -overwrite -t_srs EPSG:23032 -te "$XMIN" "$YMIN" "$XMAX" "$YMAX" -tr "$RES_M" "$RES_M" \
  -r bilinear -srcnodata $NODATA -dstnodata $NODATA "$TINITALY_VRT" "$TINITALY_ALIGNED"

echo
echo "== Step 3: priority composite (tinitaly < piemonte < vda, later wins where valid) =="
MERGED="$OUT_DIR/merged.tif"
rm -f "$MERGED"
gdal_merge.py -q -o "$MERGED" -n $NODATA -a_nodata $NODATA -ot Float32 \
  "$TINITALY_ALIGNED" "$PIEMONTE_ALIGNED" "$VDA_ALIGNED"

echo
echo "== Step 4: coverage check =="
echo "Whole-bbox stats (informational - the bbox deliberately extends beyond"
echo "the park/Italy toward Mont Blanc/France, §3 - a residual gap out there"
echo "is expected and cannot be fixed with Italian sources):"
STATS=$(gdalinfo -stats "$MERGED" | grep -E "STATISTICS_(MINIMUM|MAXIMUM|VALID_PERCENT)")
echo "$STATS"

echo
echo "Real hard gate: coverage inside the actual park boundary" \
  "(tools/park-boundary.geojson), not the oversized bbox -"
node "$(dirname "${BASH_SOURCE[0]}")/check-park-coverage.mjs" "$MERGED" "$XMIN" "$YMIN" "$XMAX" "$YMAX"
PARK_NODATA_PCT=$(python3 -c "import json; print(json.load(open('/tmp/check-park-coverage-result.json'))['pct'])")
if awk -v v="$PARK_NODATA_PCT" 'BEGIN { exit !(v > 0.5) }'; then
  echo
  echo "ERROR: ${PARK_NODATA_PCT}% of the REAL park still has no real elevation" >&2
  echo "data after merging all 3 sources - that's the bug class just fixed for" >&2
  echo "lakes (a fake floor masquerading as real elevation), and this time it's" >&2
  echo "inside the park, not just the oversized margin. Investigate before" >&2
  echo "proceeding - inspect $MERGED to find where." >&2
  exit 1
fi

ELEV_MIN=$(echo "$STATS" | grep MINIMUM | grep -oE '[-0-9.]+$')
ELEV_MAX=$(echo "$STATS" | grep MAXIMUM | grep -oE '[-0-9.]+$')

echo
echo "== Step 5: normalize to 16-bit PNG (0-65535 across ${ELEV_MIN}-${ELEV_MAX} m) =="
PNG_OUT="$OUT_DIR/pngp_heightmap.png"
gdal_translate -q -ot UInt16 -scale "$ELEV_MIN" "$ELEV_MAX" 0 65535 -of PNG "$MERGED" "$PNG_OUT"

SIZE_INFO=$(gdalinfo "$MERGED" | grep "Size is")
WIDTH=$(echo "$SIZE_INFO" | sed -E 's/Size is ([0-9]+), ([0-9]+)/\1/')
HEIGHT=$(echo "$SIZE_INFO" | sed -E 's/Size is ([0-9]+), ([0-9]+)/\2/')

TINITALY_ATTRIBUTION=$(cat "$TINITALY_ATTRIBUTION_FILE" 2>/dev/null || echo "TINITALY, INGV - CC BY 4.0")

META_OUT="$OUT_DIR/pngp_heightmap_meta.json"
cat > "$META_OUT" <<EOF
{
  "crs": "EPSG:23032",
  "bbox_utm32n": { "xmin": $XMIN, "ymin": $YMIN, "xmax": $XMAX, "ymax": $YMAX },
  "resolution_m_per_px": { "x": $RES_M, "y": $RES_M },
  "image_size_px": { "width": $WIDTH, "height": $HEIGHT },
  "elevation_m": { "min": $ELEV_MIN, "max": $ELEV_MAX },
  "note": "Priority mosaic of 3 sources (best real value per pixel, not a single dataset) - closes the Piemonte-side nodata gap present in the VDA-only heightmap. See docs/ARCHITECTURE.md §3.",
  "sources": [
    {
      "name": "DTM0508_002_UNICO (Regione Autonoma Valle d'Aosta)",
      "priority": 1,
      "coverage": "Valle d'Aosta side of the park - highest quality, native ~10m",
      "license": "not yet verified for the DTM itself - TODO, see docs/PROGRESS.md"
    },
    {
      "name": "RIPRESA AEREA ICE 2009-2011 - DTM 5 (Regione Piemonte)",
      "priority": 2,
      "coverage": "Most of the Piemonte side (lower/mid elevations) - native 5m, does not reach the highest glaciated peaks",
      "fetchedVia": "tools/dtm-source/fetch-piemonte-dtm.sh (WCS)",
      "license": "open data, fees NONE / accessConstraints NONE per WCS capabilities - exact attribution string TODO, verify via the geoportale.piemonte.it metadata record before shipping publicly"
    },
    {
      "name": "TINITALY 1.1 (INGV)",
      "priority": 3,
      "coverage": "Whatever the first two sources miss (mainly the highest peaks) - national 10m mosaic",
      "fetchedVia": "tools/dtm-source/fetch-tinitaly.sh",
      "license": "CC BY 4.0",
      "attribution": "$TINITALY_ATTRIBUTION"
    }
  ]
}
EOF

echo
echo "Done. Outputs in $OUT_DIR:"
echo "  - merged.tif               Float32 GeoTIFF, real meters, all 3 sources - keep as the master copy"
echo "  - pngp_heightmap.png       16-bit grayscale - copy into the repo's DEM/ folder"
echo "  - pngp_heightmap_meta.json calibration sidecar incl. sources[] - copy alongside the PNG"
