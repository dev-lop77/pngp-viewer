# The project's target bbox, in one place. `source` this; do not re-type it.
#
# It used to be four literals copy-pasted into fetch-piemonte-dtm.sh,
# fetch-tinitaly.sh, merge-heightmaps.sh, extract-heightmap.sh and
# trails-source/fetch-trails.sh. That is survivable while the number never
# changes, and it stopped being survivable on 2026-08-18, when it changed: a
# bbox that is right in five files and stale in the sixth produces a mosaic
# that is silently misregistered rather than one that fails.
#
# EPSG:23032 (ED50 / UTM 32N) - the datum was verified against Mont Blanc's
# published summit, see docs/ARCHITECTURE.md §3.
XMIN=329116
YMIN=5027000
XMAX=413000
YMAX=5085000

# 2026-08-18: YMIN moved down 9,775 m, from 5036775. The old south edge was
# inherited from the VDA source file's own southern edge - Valle d'Aosta's
# regional border, which up here IS the watershed crest - so the map ended by
# slicing the summit ridge, and 129.3 km2 of the national park (18.2% of its
# 710 km2: Valle dell'Orco toward Ceresole and Noasca, part of Val Soana) had
# no terrain at all. tools/dtm-source/check-park-coverage.mjs never caught it
# because it iterates the raster's own cells and skips the ones outside the
# park polygon - it asks "are the pixels I have valid" (99.999%, correctly),
# never "do I have all the park's pixels".
#
# The park's southern tip is at N 5029103. The extra 2.1 km below it is not
# slack: it is where the terrain is allowed to fade out, and a fade band that
# started inside the boundary would dissolve the park itself.
#
# The VDA source has nothing down there - its own file ends at the old YMIN -
# so the new strip comes entirely from Piemonte DTM5 and TINITALY, both of
# which already reach it.
#
# NOTE for anything that consumes a SOURCE raster: a source has its own bbox,
# which is not this one. merge-heightmaps.sh georeferences the VDA PNG by
# assigning corner coordinates to a plain image file, so handing it the target
# bbox instead of the source's own would stretch Valle d'Aosta 9.8 km
# southward without a single warning. It reads the source's sidecar instead.
