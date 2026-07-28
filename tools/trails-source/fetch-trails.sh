#!/usr/bin/env bash
# Downloads and clips the official Valle d'Aosta regional trail dataset
# ("Rete Sentieristica", published on Geoportale SCT / Sistema delle
# Conoscenze Territoriali) for the pngp-viewer project. This replaces OSM
# as the trail source: it has real trail numbering (segnavia) and CAI
# difficulty grading (T/E/EE/EEA), which OSM doesn't reliably have for this
# area. See docs/ARCHITECTURE.md §3.
#
# Unlike tools/dtm-source/*.sh, this needs no special machine or root - it's
# a small (~22 MB) direct HTTPS download, no auth, source:
# https://geoportale.regione.vda.it/download/rete-sentieristica/
#
# Data license: CC BY 4.0 (DGR 899/2014, DGR 1620/2016). Any use of this
# data, or a render/map derived from it, MUST carry this attribution:
#
#   Dati forniti dalla Struttura Forestazione e Sentieristica della
#   Regione Autonoma Valle d'Aosta.
#
# ...plus a link to the license and a note if the data was modified (we do
# clip it, so: modified). Full license text in the ZIP itself (licenza.pdf).
#
# Run this OUTSIDE the git repo - the raw, whole-region shapefiles should
# never land in version control (redundant, and most of it is outside our
# area of interest). Only a PNGP-clipped extract should ever be copied into
# the repo, once tools/build-trails.mjs exists (phase 2, POI) to turn it
# into public/data/trails.json.
#
# Usage: bash fetch-trails.sh

set -euo pipefail

OUT_DIR="$HOME/pngp-trails-work"
ZIP_URL="https://geoprodotti.regione.vda.it/download/SENTIERI/sentieri.zip"

# Same bbox as tools/dtm-source/extract-heightmap.sh. The dataset's native
# CRS (EPSG:23032, ED50 UTM32N) already matches our DEM exactly - no
# reprojection needed.
XMIN=329116
YMIN=5036775
XMAX=413000
YMAX=5085000

mkdir -p "$OUT_DIR"
cd "$OUT_DIR"

if ! command -v ogr2ogr >/dev/null 2>&1; then
  echo "GDAL (ogr2ogr) not found - install it first (e.g. apt-get install gdal-bin)." >&2
  exit 1
fi

echo "== Downloading $ZIP_URL =="
curl -sL -o sentieri.zip "$ZIP_URL"

echo "== Extracting =="
rm -rf raw
mkdir -p raw
unzip -o -q sentieri.zip -d raw

SRC_DIR="raw/shape"
if [[ ! -f "$SRC_DIR/sentieri.shp" ]]; then
  echo "Expected $SRC_DIR/sentieri.shp not found - the zip layout may have changed." >&2
  exit 1
fi

echo "== Clipping to the PNGP bbox + converting to GeoJSON =="
for layer in sentieri tratte; do
  ogr2ogr -f GeoJSON \
    -spat "$XMIN" "$YMIN" "$XMAX" "$YMAX" \
    -clipsrc "$XMIN" "$YMIN" "$XMAX" "$YMAX" \
    "pngp_${layer}.geojson" "$SRC_DIR/${layer}.shp"
done

echo
echo "Done. Outputs in $OUT_DIR:"
echo "  - pngp_sentieri.geojson   numbered/named itineraries: nuovo_segn (segnavia"
echo "                            number), sen_diffic (T/E/EE/EEA, often null at"
echo "                            this level), sen_nome_s, dislivello, quote."
echo "  - pngp_tratte.geojson     elementary segments: difficolta (T/E/EE/EEA,"
echo "                            more reliably populated), percorribilita."
echo
echo "Next: once tools/build-trails.mjs exists, point it at these two files to"
echo "produce public/data/trails.json. Remember the CC BY 4.0 attribution"
echo "requirement above wherever this data (or a render of it) is shown."
