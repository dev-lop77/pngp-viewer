#!/usr/bin/env bash
# Merges the 4 DEM sources into one calibrated heightmap, priority-ordered
# best-available-per-pixel (docs/PROGRESS.md, docs/ARCHITECTURE.md §3):
#   1. VDA (~/pngp-dtm-work/vda-5m/) - best, but Valle d'Aosta only. NOT the
#      repo's DEM/pngp_heightmap.png, which is this script's own output - see
#      the comment on VDA_PNG below.
#   2. Piemonte WCS (fetch-piemonte-dtm.sh) - fills most of the rest, but
#      doesn't reach the highest glaciated peaks (verified).
#   3. TINITALY (fetch-tinitaly.sh) - national mosaic, fills whatever Italian
#      ground the first two still missed.
#   4. Copernicus GLO-30 (fetch-copernicus-dem.sh) - global, 30 m, and the only
#      one that crosses the frontier. It exists for France and Switzerland,
#      where the first three cannot go by definition, and is drawn faded and
#      kept out of the walker's reach (added 2026-08-18).
# Run fetch-piemonte-dtm.sh, fetch-tinitaly.sh and fetch-copernicus-dem.sh first.
#
# Technique: gdalwarp each source onto the exact same target grid (this
# bbox, EPSG:23032, RES_M m/px) with its own real nodata value normalized to a
# shared sentinel, then gdal_merge.py composites them in priority order -
# GDAL only overwrites with a later input where THAT input has valid
# (non-nodata) data, which is exactly a "best source per pixel" merge, not
# a blunt overwrite.
#
# Usage: bash merge-heightmaps.sh

set -euo pipefail

# --- EDIT THESE ---
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# The VDA-ONLY extraction, which is NOT DEM/pngp_heightmap.png. That file is
# this script's own output from the last run, copied back into the repo, and
# pointing VDA_PNG at it (as this script did until 2026-08-18) makes a re-run
# eat its own tail: the previous mosaic comes back in at priority 1, so
# Piemonte and TINITALY pixels get promoted above the sources that should
# outrank them, and the merged nodata floor is re-imported as if it were real
# Valle d'Aosta elevation. Harmless while the bbox never changed and every
# input was identical; not harmless the moment either is true.
# Told apart at a glance by their elevation ranges: VDA-only is 292.13-4810.96,
# the mosaic 238.51-4809.81.
VDA_PNG="$HOME/pngp-dtm-work/vda-5m/pngp_heightmap.png"
VDA_META="$HOME/pngp-dtm-work/vda-5m/pngp_heightmap_meta.json"
PIEMONTE_TIF="$HOME/pngp-dtm-work/piemonte/piemonte_dtm.tif"
TINITALY_VRT="$HOME/pngp-dtm-work/tinitaly/tinitaly.vrt"
TINITALY_ATTRIBUTION_FILE="$HOME/pngp-dtm-work/tinitaly/ATTRIBUTION.txt"
# Priority 4 (lowest): a global DEM, used ONLY where all three Italian sources
# are absent - i.e. across the French and Swiss border, which no Italian
# product can or should cover. Before this, those 12% of the bbox were nodata
# and the terrain shader drew them at the mosaic's minimum elevation, so the
# frontier crest ended in a 2,600 m cliff down to a flat 238.5 m floor.
COPERNICUS_VRT="$HOME/pngp-dtm-work/copernicus/copernicus.vrt"
COPERNICUS_ATTRIBUTION_FILE="$HOME/pngp-dtm-work/copernicus/ATTRIBUTION.txt"
COPERNICUS_LIABILITY_FILE="$HOME/pngp-dtm-work/copernicus/LIABILITY.txt"
OUT_DIR="$HOME/pngp-dtm-work/merged"

# The target bbox lives in one place now - see the file for why.
source "$(dirname "${BASH_SOURCE[0]}")/bbox.sh"
# Must match the resolution of the VDA_PNG above: this script composites the
# other two sources ONTO that grid, and gdal_merge.py needs all three aligned
# to one geotransform. 5 m since 2026-08-14, for the high-resolution terrain
# tier - at 5 m the Piemonte DTM5 is 1:1 native, so the tier gets real detail
# on the Piemonte side and not just on the Valle d'Aosta one.
RES_M=5
NODATA=-9999
# --------------------

mkdir -p "$OUT_DIR"

for f in "$VDA_PNG" "$VDA_META" "$PIEMONTE_TIF" "$TINITALY_VRT" "$COPERNICUS_VRT"; do
  if [[ ! -f "$f" ]]; then
    echo "Missing input: $f" >&2
    echo "Run fetch-piemonte-dtm.sh, fetch-tinitaly.sh and fetch-copernicus-dem.sh first." >&2
    exit 1
  fi
done

VDA_ELEV_MIN=$(python3 -c "import json; print(json.load(open('$VDA_META'))['elevation_m']['min'])")
VDA_ELEV_MAX=$(python3 -c "import json; print(json.load(open('$VDA_META'))['elevation_m']['max'])")
echo "VDA source elevation range: $VDA_ELEV_MIN - $VDA_ELEV_MAX m"

# The VDA PNG is a bare image: it carries no georeferencing at all, so step 1
# has to ASSERT its corners. Those corners are the source's own, read from its
# sidecar - never the target bbox. They coincided until 2026-08-18 and the
# distinction cost nothing; now that YMIN has moved 9.8 km south, using the
# target bbox here would stretch the whole of Valle d'Aosta over the taller
# rectangle and misregister it by that distance, quietly and without an error.
VDA_BBOX=$(python3 -c "import json; b=json.load(open('$VDA_META'))['bbox_utm32n']; print(b['xmin'], b['ymin'], b['xmax'], b['ymax'])")
read -r VDA_XMIN VDA_YMIN VDA_XMAX VDA_YMAX <<< "$VDA_BBOX"
echo "VDA source bbox: E $VDA_XMIN-$VDA_XMAX N $VDA_YMIN-$VDA_YMAX (target: E $XMIN-$XMAX N $YMIN-$YMAX)"

echo
echo "== Step 1: VDA PNG -> real-elevation GeoTIFF (pixel 0 = nodata, the same"
echo "   undeclared sentinel docs/PROGRESS.md already found - now handled"
echo "   explicitly instead of silently passing through as ~292m) =="
VDA_RAW="$OUT_DIR/vda_raw.tif"
VDA_ELEV="$OUT_DIR/vda_elevation.tif"
gdal_translate -q -a_srs EPSG:23032 -a_ullr "$VDA_XMIN" "$VDA_YMAX" "$VDA_XMAX" "$VDA_YMIN" \
  "$VDA_PNG" "$VDA_RAW"
gdal_calc.py --quiet -A "$VDA_RAW" --outfile="$VDA_ELEV" \
  --calc="where(A==0, $NODATA, A.astype(numpy.float32)*($VDA_ELEV_MAX-$VDA_ELEV_MIN)/65535.0+$VDA_ELEV_MIN)" \
  --NoDataValue=$NODATA --type=Float32 --overwrite

echo
echo "== Step 2: align all 4 sources to the same grid (bbox, EPSG:23032, ${RES_M}m/px) =="
VDA_ALIGNED="$OUT_DIR/vda_aligned.tif"
PIEMONTE_ALIGNED="$OUT_DIR/piemonte_aligned.tif"
TINITALY_ALIGNED="$OUT_DIR/tinitaly_aligned.tif"
COPERNICUS_ALIGNED="$OUT_DIR/copernicus_aligned.tif"

gdalwarp -q -overwrite -t_srs EPSG:23032 -te "$XMIN" "$YMIN" "$XMAX" "$YMAX" -tr "$RES_M" "$RES_M" \
  -r near -srcnodata $NODATA -dstnodata $NODATA "$VDA_ELEV" "$VDA_ALIGNED"
gdalwarp -q -overwrite -t_srs EPSG:23032 -te "$XMIN" "$YMIN" "$XMAX" "$YMAX" -tr "$RES_M" "$RES_M" \
  -r bilinear -srcnodata $NODATA -dstnodata $NODATA "$PIEMONTE_TIF" "$PIEMONTE_ALIGNED"
gdalwarp -q -overwrite -t_srs EPSG:23032 -te "$XMIN" "$YMIN" "$XMAX" "$YMAX" -tr "$RES_M" "$RES_M" \
  -r bilinear -srcnodata $NODATA -dstnodata $NODATA "$TINITALY_VRT" "$TINITALY_ALIGNED"
# Cubic, not bilinear: this one is being blown up 6x (30 m native onto a 5 m
# grid), and bilinear at that ratio leaves the source cells legible as a
# lattice of flat quads. It is the only source that is upsampled rather than
# downsampled, so it is the only one where the resampler shows.
gdalwarp -q -overwrite -t_srs EPSG:23032 -te "$XMIN" "$YMIN" "$XMAX" "$YMAX" -tr "$RES_M" "$RES_M" \
  -r cubic -srcnodata $NODATA -dstnodata $NODATA "$COPERNICUS_VRT" "$COPERNICUS_ALIGNED"

echo
echo "== Step 3: priority composite (copernicus < tinitaly < piemonte < vda, later wins where valid) =="
MERGED="$OUT_DIR/merged.tif"
rm -f "$MERGED"
gdal_merge.py -q -o "$MERGED" -n $NODATA -a_nodata $NODATA -ot Float32 \
  "$COPERNICUS_ALIGNED" "$TINITALY_ALIGNED" "$PIEMONTE_ALIGNED" "$VDA_ALIGNED"

# Which cells ended up on the global fallback - i.e. which ones are the coarse
# outer ring rather than the park. The renderer needs to know: that ring is
# what fades out, and what the avatar is kept out of. Computed here because
# this is the only place that still has the per-source layers; downstream all
# it can see is one number per cell with no provenance.
echo
echo "== Step 3b: outer-ring mask (1 = only the global DEM had data here) =="
OUTER_MASK="$OUT_DIR/outer_ring.tif"
# --hideNoData is load-bearing, not tidiness. Without it gdal_calc PROPAGATES
# each input's nodata: any cell that is nodata in ANY input is written as the
# output's nodata and the expression is never consulted. The cells this mask is
# looking for are, by definition, the ones where three of the four inputs are
# nodata - so the first version of this produced a mask that was empty
# everywhere, and empty is a plausible-looking answer for a mask. Told to ignore
# the declared nodata, the comparisons below do the work themselves.
#
# No --NoDataValue on the output either: 0 here means "local survey data covers
# this", which is the answer for six cells out of seven and is not missing data.
gdal_calc.py --quiet --hideNoData \
  -A "$COPERNICUS_ALIGNED" -B "$TINITALY_ALIGNED" -C "$PIEMONTE_ALIGNED" -D "$VDA_ALIGNED" \
  --outfile="$OUTER_MASK" --overwrite --type=Byte \
  --calc="255*logical_and(A!=$NODATA, logical_and(B==$NODATA, logical_and(C==$NODATA, D==$NODATA)))"

# Straight to the 8-bit PNG the repo-local build reads (tools/build-outer-ring.mjs),
# so the mask arrives in DEM/ next to the heightmap it belongs with rather than
# needing a hand-run gdal_translate that only this session would remember.
gdal_translate -q -of PNG -ot Byte -b 1 -a_nodata none "$OUTER_MASK" "$REPO_DIR/DEM/outer_ring.png"
echo "Wrote $REPO_DIR/DEM/outer_ring.png"

echo
echo "== Step 4: coverage check =="
echo "Whole-bbox stats (informational - the bbox deliberately extends beyond"
echo "the park/Italy toward Mont Blanc/France, §3 - a residual gap out there"
echo "is expected and cannot be fixed with Italian sources):"
# Drop any PAM sidecar first. GDAL caches statistics in <file>.aux.xml and keys
# that cache on the FILE NAME, not on the contents - so a rebuilt merged.tif of
# the same name is handed the previous run's numbers, with no warning and no
# clue in the output that they are months old. On 2026-08-18 that fed step 5 a
# stale range (238.51-4809.81 instead of the real 219.26-4810.96) and clamped
# every cell below the old minimum to 0, which downstream reads as NODATA - so
# the newly added low ground would have arrived as holes. These numbers set the
# scale of the shipped heightmap; they are the last place to accept a cached
# answer.
rm -f "$MERGED.aux.xml"
STATS=$(gdalinfo -stats "$MERGED" | grep -E "STATISTICS_(MINIMUM|MAXIMUM|VALID_PERCENT)")
echo "$STATS"

echo
echo "Real hard gate: coverage inside the actual park boundary" \
  "(tools/park-boundary.geojson), not the oversized bbox -"
node "$(dirname "${BASH_SOURCE[0]}")/check-park-coverage.mjs" "$MERGED" "$XMIN" "$YMIN" "$XMAX" "$YMAX"
PARK_NODATA_PCT=$(python3 -c "import json; print(json.load(open('/tmp/check-park-coverage-result.json'))['pct'])")
if awk -v v="$PARK_NODATA_PCT" 'BEGIN { exit !(v > 0.5) }'; then
  echo
  echo "ERROR: ${PARK_NODATA_PCT}% of the REAL park still has no elevation after" >&2
  echo "merging all 4 sources. Read the breakdown above before assuming which" >&2
  echo "kind of gap it is - they have different fixes:" >&2
  echo "  'no pixel at all'  -> the bbox is too small. Move it in bbox.sh." >&2
  echo "  'nodata'           -> the bbox is right and no source covered it." >&2
  echo "Either way it is the bug class already fixed for lakes (a fake floor" >&2
  echo "masquerading as real elevation), and this time inside the park rather" >&2
  echo "than out in the margin. Inspect $MERGED to find where." >&2
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
# No fallback for these two: the Copernicus licence prescribes their wording,
# so a guessed default would be a licence breach that looks like a credit.
COPERNICUS_ATTRIBUTION=$(cat "$COPERNICUS_ATTRIBUTION_FILE")
COPERNICUS_LIABILITY=$(cat "$COPERNICUS_LIABILITY_FILE")

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
      "coverage": "Valle d'Aosta side of the park - highest quality. The source ASC is 2.0 m/px (DEM/pngp_extraction_report.txt); extract-heightmap.sh resamples it to this grid, so 'native' here means the target resolution, not the source's.",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "licenseVerifiedVia": "https://metadati.partout.it/metadata_documents/CC_BY_DTM_v2.pdf (linked from https://geoportale.regione.vda.it/download/dtm/, which lists this product as 'DTM 2005/2008 aggregato' = DTM0508). Granted under DGR 1620 del 25/11/2016 and DGR 899 del 27/06/2014; sharing and modification allowed 'per qualsiasi fine, anche commerciale'.",
      "attribution": "Dati estratti dal Modello Digitale del Terreno (DTM) della Regione Autonoma Valle d'Aosta.",
      "attributionNote": "That wording is prescribed verbatim by the licence document ('apponendo la seguente dicitura') - do not paraphrase it."
    },
    {
      "name": "RIPRESA AEREA ICE 2009-2011 - DTM 5 (Regione Piemonte)",
      "priority": 2,
      "coverage": "Most of the Piemonte side (lower/mid elevations) - native 5m, does not reach the highest glaciated peaks",
      "fetchedVia": "tools/dtm-source/fetch-piemonte-dtm.sh (WCS)",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/deed.it",
      "licenseVerifiedVia": "https://www.geoportale.piemonte.it/geonetwork/srv/api/records/r_piemon:224de2ac-023e-441c-9ae0-ea493b217a8e - useConstraints = CC BY 4.0 deed.it, access 'no limitations to public access'; lineage records the 2019-02-13 upgrade from CC BY 2.5.",
      "attribution": "Regione Piemonte - RIPRESA AEREA ICE 2009-2011, DTM 5."
    },
    {
      "name": "TINITALY 1.1 (INGV)",
      "priority": 3,
      "coverage": "Whatever the first two sources miss (mainly the highest peaks) - national 10m mosaic, so it is upsampled wherever this grid is finer than 10 m and adds coverage rather than detail",
      "fetchedVia": "tools/dtm-source/fetch-tinitaly.sh",
      "license": "CC BY 4.0",
      "attribution": "$TINITALY_ATTRIBUTION"
    },
    {
      "name": "Copernicus DEM GLO-30 (COP-DEM-GLO-30-F)",
      "priority": 4,
      "coverage": "The French and Swiss margin across the frontier, where no Italian source reaches - never overwrites an Italian pixel. 30 m, and a DSM rather than a DTM.",
      "fetchedVia": "tools/dtm-source/fetch-copernicus-dem.sh",
      "license": "Licence for Copernicus DEM instance COP-DEM-GLO-30-F Global 30m Full, Free & Open - NOT CC BY 4.0, do not group it with the three above",
      "licenseUrl": "https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/DEM/resources/license/License-COPDEM-30.pdf",
      "licenseVerifiedVia": "Licence read in full on 2026-08-18. Article 4 grants reproduction, distribution, communication to the General Public, and adaptation/modification, worldwide and without limitation in time; Article 5 makes it free of charge. Instance confirmed via https://registry.opendata.aws/copernicus-dem/ (bucket copernicus-dem-30m holds GLO-30 Public, mirrored by Sinergise) and https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM",
      "attribution": "$COPERNICUS_ATTRIBUTION",
      "attributionNote": "Verbatim from Article 6(b), the form prescribed for ADAPTED or modified data - which this mosaic is. Not paraphrasable, and not interchangeable with the 6(a) form for unmodified data.",
      "liabilityNotice": "$COPERNICUS_LIABILITY",
      "liabilityNote": "Verbatim from Article 6(c). A second, separate obligation: it must accompany any distribution or communication to the General Public, and it is not an attribution, which is exactly why it is easy to drop."
    }
  ]
}
EOF

echo
echo "Done. Outputs in $OUT_DIR:"
echo "  - merged.tif               Float32 GeoTIFF, real meters, all 4 sources - keep as the master copy"
echo "  - pngp_heightmap.png       16-bit grayscale - copy into the repo's DEM/ folder"
echo "  - pngp_heightmap_meta.json calibration sidecar incl. sources[] - copy alongside the PNG"
