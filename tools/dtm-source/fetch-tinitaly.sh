#!/usr/bin/env bash
# Downloads the TINITALY 1.1 (INGV) tiles covering the PNGP bbox - the
# final fallback layer in the 3-source DEM merge (docs/PROGRESS.md):
# whole-of-Italy 10m mosaic, no documented coverage holes, used only
# where neither the VDA source nor Piemonte's WCS (fetch-piemonte-dtm.sh)
# has real data (mainly the highest glaciated peaks - confirmed by testing
# that Piemonte's own survey doesn't reach them).
#
# Despite the download page being a browser tile-picker with no
# advertised API, the tiles turn out to be plain, unauthenticated,
# directly-curlable files at a predictable URL - verified 2026-07-30 by
# fetching the tile index image (immagini/Imm_TINITALY_DOWNLOAD_03.jpg,
# which has real UTM32N gridlines drawn on it) and reading tile names
# directly off the image rather than guessing a naming scheme. Naming:
# w{row}{col}_s10, where row = floor(northing/10000) and
# col = floor(easting/10000), both rounded down to a multiple of 5 (each
# tile is 50km square, EPSG:32632). CC BY 4.0 - attribution below.
#
# Usage: bash fetch-tinitaly.sh

set -euo pipefail

# --- EDIT THESE (defaults match the bbox already calibrated for the VDA
# extraction, DEM/pngp_heightmap_meta.json - EPSG:23032, but close enough
# to EPSG:32632 that the tile grid selection below doesn't need its own
# reprojection: a systematic ~100-200m ED50/WGS84 offset can't move us
# into a different 50km tile here) ---
OUT_DIR="$HOME/pngp-dtm-work/tinitaly"
XMIN=329116
YMIN=5036775
XMAX=413000
YMAX=5085000

ATTRIBUTION="Tarquini S., I. Isola, M. Favalli, A. Battistini, G. Dotta, (2023). TINITALY, a digital elevation model of Italy with a 10 meters cell size (Version 1.1). Istituto Nazionale di Geofisica e Vulcanologia (INGV). https://doi.org/10.13127/tinitaly/1.1 - CC BY 4.0"
# --------------------

mkdir -p "$OUT_DIR"
echo "$ATTRIBUTION" > "$OUT_DIR/ATTRIBUTION.txt"

row_start=$(( (YMIN / 10000 / 5) * 5 ))
row_end=$(( (YMAX / 10000 / 5) * 5 ))
col_start=$(( (XMIN / 10000 / 5) * 5 ))
col_end=$(( (XMAX / 10000 / 5) * 5 ))

TILE_LIST="$OUT_DIR/tiles.txt"
: > "$TILE_LIST"

for row in $(seq "$row_start" 5 "$row_end"); do
  for col in $(seq "$col_start" 5 "$col_end"); do
    name=$(printf "w%03d%02d_s10" "$row" "$col")
    zip_url="https://tinitaly.pi.ingv.it/data_1.1/${name}/${name}.zip"
    zip_out="$OUT_DIR/${name}.zip"
    tif_out="$OUT_DIR/${name}.tif"

    if [[ -f "$tif_out" ]]; then
      echo "$name: already have it, skipping."
    else
      echo "$name: downloading..."
      if curl -sL -f -o "$zip_out" "$zip_url"; then
        unzip -o -j "$zip_out" "${name}/${name}.tif" -d "$OUT_DIR" >/dev/null
        rm -f "$zip_out"
      else
        echo "  WARNING: $name not found/failed to download, skipping." >&2
        continue
      fi
    fi
    echo "$tif_out" >> "$TILE_LIST"
  done
done

echo
echo "== Mosaicking $(wc -l < "$TILE_LIST") tiles =="
VRT_OUT="$OUT_DIR/tinitaly.vrt"
gdalbuildvrt -input_file_list "$TILE_LIST" "$VRT_OUT"

echo
echo "== Coverage check over our bbox =="
gdalwarp -q -overwrite -te "$XMIN" "$YMIN" "$XMAX" "$YMAX" -tr 10 10 "$VRT_OUT" "$OUT_DIR/tinitaly_crop_check.tif"
gdalinfo -stats "$OUT_DIR/tinitaly_crop_check.tif" | grep -E "STATISTICS_(MINIMUM|MAXIMUM|VALID_PERCENT)|NoData"

echo
echo "Done. $VRT_OUT (source.crs=EPSG:32632) is ready for tools/dtm-source/merge-heightmaps.sh."
echo "Attribution required (CC BY 4.0): see $OUT_DIR/ATTRIBUTION.txt"
