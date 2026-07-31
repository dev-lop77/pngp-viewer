#!/usr/bin/env bash
# Fetches real elevation data for the Piemonte side of the PNGP bbox from
# Regione Piemonte's own WCS (verified live 2026-07-30 - DescribeCoverage,
# not assumed from docs): "RIPRESA AEREA ICE 2009-2011 - DTM 5", 5m native
# resolution, nodata -99, natively serves EPSG:23032 output (no separate
# reprojection needed). Fills part of the known DEM gap (docs/PROGRESS.md,
# ~25% of the bbox has no real elevation - the VDA-only source doesn't
# cover Piemonte) - does NOT reach the highest glaciated peaks (confirmed
# by test query, 0% valid near Ghiacciaio del Tzasset); tools/dtm-source/
# merge-heightmaps.sh falls back to TINITALY for whatever this misses.
#
# Unlike extract-heightmap.sh (needs the 10GB VDA source file on a specific
# machine), this needs only network + GDAL - runs anywhere.
#
# The server enforces MAXSIZE=2048 px per request (confirmed by triggering
# the actual error) - a single request for the whole bbox at 5m/px is
# ~16,777 x 9,645 px, way over. This tiles the bbox into ~9km chunks
# (1800px at 5m/px, safe margin under 2048) and mosaics them.
#
# Usage: bash fetch-piemonte-dtm.sh

set -euo pipefail

# --- EDIT THESE (defaults match the bbox already calibrated for the VDA
# extraction, DEM/pngp_heightmap_meta.json) ---
OUT_DIR="$HOME/pngp-dtm-work/piemonte"
XMIN=329116
YMIN=5036775
XMAX=413000
YMAX=5085000
RES_M=5
TILE_M=9000
WCS_URL="https://geomap.reteunitaria.piemonte.it/ws/taims/rp-01/taimsdtmwcs/wcs_ice_2009_2011_dtm"
COVERAGE="DTM"
SRC_NODATA=-99
DST_NODATA=-9999
# --------------------

mkdir -p "$OUT_DIR/tiles"

if ! command -v gdalwarp >/dev/null 2>&1; then
  echo "GDAL not found — installing (requires root)..." >&2
  apt-get update && apt-get install -y gdal-bin
fi

# WCS driver descriptor (GDAL talks to the service as a raster source) -
# GDAL rewrites this in place with a cached DescribeCoverage response on
# first use, that's expected.
WCS_XML="$OUT_DIR/wcs_piemonte.xml"
cat > "$WCS_XML" <<EOF
<WCS_GDAL>
  <ServiceURL>${WCS_URL}?</ServiceURL>
  <CoverageName>${COVERAGE}</CoverageName>
  <Version>1.0.0</Version>
</WCS_GDAL>
EOF

echo "Tiling bbox ($XMIN,$YMIN)-($XMAX,$YMAX) at ${TILE_M}m/tile, ${RES_M}m/px..."
TILE_LIST="$OUT_DIR/tiles.txt"
: > "$TILE_LIST"

x=$XMIN
tile_n=0
while (( x < XMAX )); do
  x_end=$(( x + TILE_M > XMAX ? XMAX : x + TILE_M ))

  y=$YMIN
  while (( y < YMAX )); do
    y_end=$(( y + TILE_M > YMAX ? YMAX : y + TILE_M ))

    tile_n=$((tile_n + 1))
    TILE_TIF="$OUT_DIR/tiles/tile_${tile_n}.tif"
    echo "  tile $tile_n: ($x,$y)-($x_end,$y_end)"
    if gdalwarp -q -overwrite -t_srs EPSG:23032 \
      -te "$x" "$y" "$x_end" "$y_end" -tr "$RES_M" "$RES_M" -r bilinear \
      -srcnodata "$SRC_NODATA" -dstnodata "$DST_NODATA" \
      "$WCS_XML" "$TILE_TIF" 2>"$OUT_DIR/tiles/tile_${tile_n}.err"; then
      echo "$TILE_TIF" >> "$TILE_LIST"
    else
      echo "    WARNING: tile $tile_n failed, skipping (see tile_${tile_n}.err)" >&2
    fi

    y=$y_end
  done
  x=$x_end
done

echo
echo "== Mosaicking $(wc -l < "$TILE_LIST") tiles =="
VRT_OUT="$OUT_DIR/piemonte_dtm.vrt"
gdalbuildvrt -input_file_list "$TILE_LIST" "$VRT_OUT"

TIF_OUT="$OUT_DIR/piemonte_dtm.tif"
gdal_translate -co COMPRESS=DEFLATE -co PREDICTOR=3 -co TILED=YES "$VRT_OUT" "$TIF_OUT"

echo
echo "== Coverage check =="
gdalinfo -stats "$TIF_OUT" | grep -E "STATISTICS_(MINIMUM|MAXIMUM|VALID_PERCENT)|NoData"

echo
echo "Done. $TIF_OUT is ready for tools/dtm-source/merge-heightmaps.sh."
