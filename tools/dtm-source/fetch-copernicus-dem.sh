#!/usr/bin/env bash
# Copernicus DEM GLO-30 (30 m global) for the bbox, added 2026-08-18.
#
# WHAT IT IS FOR, AND WHAT IT IS NOT FOR. The three Italian sources
# (VDA / Piemonte DTM5 / TINITALY) cover Italy and stop at the frontier, which
# up here runs along the watershed crest. That left 12.15% of the bbox - the
# French and Swiss margin - as nodata, and nodata is not nothing: the terrain
# shader drew those cells at the mosaic's minimum elevation, so standing on the
# border ridge you looked over a 2,600 m cliff onto a flat 238.5 m floor with
# streams and a lake apparently hanging above it. This source exists to give
# that margin real ground that DESCENDS into the French and Swiss valleys the
# way the real crest does. It is deliberately the LOWEST priority in
# merge-heightmaps.sh: it never overwrites an Italian pixel, only fills where
# there was none.
#
# It is a DSM, not a DTM - it includes canopy and buildings. At 30 m, on the
# far side of a frontier ridge, seen through the aerial-perspective haze and
# faded before the bbox edge, that is not a distinction anything can render.
# It would be the wrong source for anything the walker can reach, which is why
# nothing the walker can reach is drawn from it.
#
# Heights are orthometric (EGM2008), same convention as the Italian sources, so
# the two meet at the frontier without a step. That is an assumption worth
# re-checking if a visible seam ever shows up along the border.
#
# Access: the AWS Open Data mirror, plain unauthenticated HTTPS, one COG per
# 1x1 degree tile. No account, no credentials, no S3 client.
#
# LICENCE - READ AND VERIFIED 2026-08-18, and it permits everything this project
# does. The instance is COP-DEM-GLO-30-F, "Global 30m Full, Free & Open": the AWS
# Open Data bucket below is the GLO-30 Public mirror run by Sinergise, and GLO-30
# Public is that instance. Licence text:
# https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/DEM/resources/license/License-COPDEM-30.pdf
#
# Article 4 grants, non-exclusively, worldwide and without limitation in time:
# (a) reproduction, (b) distribution, (c) communication to the General Public,
# (d) adaptation, modification and combination with other data. Article 5 makes
# it free of charge. There is no non-commercial clause and no share-alike, so it
# is more permissive than the ODbL this project already ships under - but it is
# NOT CC BY 4.0, and must not be credited as though it were.
#
# THREE OBLIGATIONS, and the wording of the first two is prescribed, so it is
# reproduced verbatim below and must not be paraphrased:
#   Art. 6(b) - this project's use is ADAPTED (warped, mosaicked, resampled,
#               quantised), so the "produced using" form is the one that applies,
#               not the plain notice in 6(a).
#   Art. 6(c) - a liability disclaimer that has to travel with any distribution or
#               communication to the General Public. It is easy to miss because it
#               is not an attribution, and it is just as compulsory.
#   Art. 6(d) - nothing may suggest the Provider or the Copernicus programme
#               endorses this project.
#
# Article 9 keeps the IPR with Airbus Defence and Space; this licence conveys use
# rights only, and grants no right to their trademarks or logos.
#
# Usage: bash fetch-copernicus-dem.sh

set -euo pipefail

# --- EDIT THESE ---
OUT_DIR="$HOME/pngp-dtm-work/copernicus"
BUCKET_URL="https://copernicus-dem-30m.s3.eu-central-1.amazonaws.com"

# Verbatim from Article 6(b) - the form for adapted or modified data. Do not
# reword, do not drop the copyright symbols, do not "tidy" the date ranges.
ATTRIBUTION="produced using Copernicus WorldDEM-30 \u00a9 DLR e.V. 2010-2014 and \u00a9 Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved"
# Verbatim from Article 6(c). A separate obligation from the attribution, and it
# has to reach the same audience.
LIABILITY="The organisations in charge of the Copernicus programme by law or by delegation do not incur any liability for any use of the Copernicus WorldDEM-30"
# --------------------

# The target bbox lives in one place now - see the file for why.
source "$(dirname "${BASH_SOURCE[0]}")/bbox.sh"

mkdir -p "$OUT_DIR"
printf '%b\n' "$ATTRIBUTION" > "$OUT_DIR/ATTRIBUTION.txt"
printf '%s\n' "$LIABILITY" > "$OUT_DIR/LIABILITY.txt"

# Which 1-degree tiles the bbox touches. The tile grid is in WGS84 while the
# bbox is EPSG:23032, so this transforms the four corners rather than assuming
# the ~100-200 m ED50 offset is too small to matter - near a whole-degree line
# it is exactly big enough to drop a tile, and a missing tile here reads as a
# straight-edged void, not as an error.
read -r LON_MIN LON_MAX LAT_MIN LAT_MAX <<< "$(python3 - "$XMIN" "$YMIN" "$XMAX" "$YMAX" <<'PY'
import sys
from osgeo import osr
xmin, ymin, xmax, ymax = map(float, sys.argv[1:5])
src = osr.SpatialReference(); src.ImportFromEPSG(23032)
dst = osr.SpatialReference(); dst.ImportFromEPSG(4326)
src.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
dst.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
tr = osr.CoordinateTransformation(src, dst)
pts = [tr.TransformPoint(x, y)[:2] for x in (xmin, xmax) for y in (ymin, ymax)]
lons = [p[0] for p in pts]; lats = [p[1] for p in pts]
print(min(lons), max(lons), min(lats), max(lats))
PY
)"
echo "Bbox in WGS84: lon $LON_MIN..$LON_MAX, lat $LAT_MIN..$LAT_MAX"

lon_start=$(python3 -c "import math; print(math.floor($LON_MIN))")
lon_end=$(python3 -c "import math; print(math.floor($LON_MAX))")
lat_start=$(python3 -c "import math; print(math.floor($LAT_MIN))")
lat_end=$(python3 -c "import math; print(math.floor($LAT_MAX))")

TILE_LIST="$OUT_DIR/tiles.txt"
: > "$TILE_LIST"

for lat in $(seq "$lat_start" "$lat_end"); do
  for lon in $(seq "$lon_start" "$lon_end"); do
    name=$(printf "Copernicus_DSM_COG_10_N%02d_00_E%03d_00_DEM" "$lat" "$lon")
    tif_out="$OUT_DIR/${name}.tif"

    if [[ -f "$tif_out" ]]; then
      echo "$name: already have it, skipping."
    else
      echo "$name: downloading..."
      if ! curl -sL -f -o "$tif_out" "$BUCKET_URL/${name}/${name}.tif"; then
        # A missing tile is normal over open sea, and impossible here - every
        # tile this loop asks for is over the Alps. Say so rather than leaving
        # a hole for the merge to turn into a cliff.
        rm -f "$tif_out"
        echo "  WARNING: $name not available - the outer ring will have a gap there." >&2
        continue
      fi
    fi
    echo "$tif_out" >> "$TILE_LIST"
  done
done

echo
echo "== Mosaicking $(wc -l < "$TILE_LIST") tiles =="
VRT_OUT="$OUT_DIR/copernicus.vrt"
gdalbuildvrt -q -input_file_list "$TILE_LIST" "$VRT_OUT"

gdalinfo "$VRT_OUT" | grep -E "Size is|Upper Left|Lower Right|Pixel Size"

echo
echo "Done: $VRT_OUT"
echo "Attribution recorded in $OUT_DIR/ATTRIBUTION.txt and the Article 6(c)"
echo "liability notice in $OUT_DIR/LIABILITY.txt. BOTH must reach the site's"
echo "credits panel - the second one is not an attribution and is just as"
echo "compulsory. merge-heightmaps.sh carries them into the heightmap sidecar,"
echo "which is where src/main.js builds the credits from."
