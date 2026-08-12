#!/usr/bin/env python3
"""NDVI on the heightfield's grid, from the same Sentinel-2 scenes as the basemap.

WHY THIS EXISTS. src/groundcover.js needs to know where open vegetation actually
is - grass and dwarf shrub - and the obvious source was wrong. OSM was measured
first, because it is what the forest mask is built from and it is well mapped
there: `natural=wood` covers 21% of the park's pixels. Open vegetation is not.
Counted on 2026-08-12, INSIDE the park boundary, mean cover per pixel:

    band          grass   shrub   wood
    800-1600 m    0.011   0.008   0.217
    1600-2200 m   0.011   0.004   0.208
    2200-2700 m   0.006   0.003   0.007
    2700-3000 m   0.003   0.000   0.000

6024 polygons came back from Overpass and nearly all of them are OUTSIDE the
park, in the inhabited valley floors where meadows and pastures get tagged. Above
the treeline, inside the park, OSM says nothing at all - so a scatter driven by
it would put grass nowhere a visitor walks. The count of features in the bbox
(4044 km2) had been taken as evidence about cover in the park (582 km2), which it
is not. tools/dev/probe-landcover.mjs reproduces the whole table.

NDVI answers the same question from a measurement instead. It is the standard
index for exactly this - (NIR - red) / (NIR + red) - and in the Alps in August it
separates the classes with room to spare: bare rock and scree sit near 0.1,
sparse alpine turf around 0.25, good pasture 0.5-0.7, conifer canopy 0.6-0.85,
snow and ice go negative. The visible bands cannot do this, and the basemap
session measured why without knowing it: open alpine ground reads G/R 1.00 in
true colour, indistinguishable from grey rock. In the near infrared the same
grass is several times brighter than the rock. That is the whole point of NIR.

WHAT THIS SCRIPT DOES NOT NEED, unlike build-basemap.py:

  - No DEM, and no de-shading. NDVI is a RATIO, and the C-correction gain is a
    per-pixel geometric factor applied identically to every band, so it cancels
    exactly. The additive atmospheric term does not cancel in general, but L2A is
    already atmospherically corrected, which is what makes this legitimate.
  - No level matching between scenes. Two dates can differ in brightness and
    still agree on NDVI, which is the other half of the same property.

It DOES keep the cloud rejection and the swath-edge erosion, because a cloud has
a high NDVI-ish signature of its own and a warp next to nodata mixes zeros in.

Output is an intermediate, not a shipped asset: tools/ndvi-draft.bin (one byte
per pixel, row 0 = north, NDVI mapped linearly from -1..1) plus a JSON sidecar
with the provenance. tools/build-groundcover.mjs turns it into the shipped masks.
Raw NDVI is stored rather than a vegetation fraction so the thresholds can be
retuned without re-warping 4 granules over the network.

LICENCE. Copernicus Sentinel data, same as the basemap: free to use including
commercially, on the condition that a modification notice is carried. The viewer
already shows "Contains modified Copernicus Sentinel data 2025" in its credits
(src/main.js, asserted by tools/test-basemap.mjs), and that wording covers this
product too - it is the same source, further modified.

Usage: python3 tools/basemap-source/build-ndvi.py
"""

import hashlib
import json
import math
import os
import urllib.request

import numpy as np
from osgeo import gdal, osr

gdal.UseExceptions()

STAC = 'https://earth-search.aws.element84.com/v1/search'
COLLECTION = 'sentinel-2-c1-l2a'

# The same granules the shipped basemap is built from, in the same priority
# order: the first scene with a usable pixel wins it. Sharing the scenes is not
# just convenience - it means the vegetation mask and the ground photograph
# describe the same day, so a meadow the photo shows green is a meadow this mask
# says is vegetated.
BASE_SCENE = ['S2A_T32TLR_20250808T103728_L2A', 'S2A_T32TMR_20250808T103728_L2A']
PATCH_SCENE = ['S2A_T32TLR_20250709T103044_L2A', 'S2A_T32TMR_20250709T103044_L2A']
SCENES = [('base 2025-08-08', BASE_SCENE), ('patch 2025-07-09', PATCH_SCENE)]

# L2A Scene Classification classes that must not reach the index. Same list as
# the basemap's, with one difference: 11 (snow/ice) is REJECTED here, where the
# basemap keeps it. A glacier is real ground to photograph, but it is not a
# vegetation measurement - fresh snow has a strongly negative NDVI and would be
# indistinguishable from "measured, and bare".
SCL_REJECT = (1, 3, 8, 9, 10, 11)
CLOUD_GROW_PX = 3  # ~60 m, see build-basemap.py's dilation comment

# Below this summed reflectance the pixel is in deep cast shadow and the ratio is
# noise, not a measurement. Treated as no observation rather than as bare ground,
# so a north gully does not come out permanently sterile.
MIN_SUM_RHO = 0.02

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(REPO, 'public', 'data')
OUT_BIN = os.path.join(REPO, 'tools', 'ndvi-draft.bin')
OUT_JSON = os.path.join(REPO, 'tools', 'ndvi-draft.json')


def log(*a):
    print(*a, flush=True)


def stac_items(ids):
    """The STAC items for these granule ids, in the order asked for."""
    body = json.dumps({'collections': [COLLECTION], 'ids': ids, 'limit': len(ids)}).encode()
    req = urllib.request.Request(STAC, data=body, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=180) as r:
        found = {f['id']: f for f in json.load(r)['features']}
    missing = [i for i in ids if i not in found]
    if missing:
        raise SystemExit(f'STAC did not return: {missing}')
    return [found[i] for i in ids]


def warp(src, grid, resample, dtype, nodata=None):
    """Warp one raster onto the heightfield's grid. Returns a numpy array."""
    out = gdal.Warp(
        '',
        src,
        format='MEM',
        dstSRS=grid['crs'],
        outputBounds=(grid['xmin'], grid['ymin'], grid['xmax'], grid['ymax']),
        width=grid['width'],
        height=grid['height'],
        resampleAlg=resample,
        outputType=dtype,
        srcNodata=nodata,
    )
    a = out.GetRasterBand(1).ReadAsArray()
    out = None
    return a


def erode(mask, radius=2):
    """Shrink a validity mask, so a swath edge cannot bleed into the index.

    Identical to build-basemap.py's, and for the same reason: the nodata test
    happens after resampling, and resampling next to nodata mixes the 0 in.
    Out-of-array is treated as valid so the bbox's own border is not eaten.
    """
    out = mask.copy()
    for axis in (0, 1):
        for shift in range(1, radius + 1):
            for s in (shift, -shift):
                shifted = np.roll(mask, s, axis=axis)
                edge = (slice(0, s), slice(None)) if s > 0 else (slice(s, None), slice(None))
                if axis == 1:
                    edge = (slice(None), edge[0])
                shifted[edge] = True  # rolled-in wrap: outside the array, not a real neighbour
                out &= shifted
    return out


def granule(item, grid):
    """NDVI and a validity mask for one granule."""
    assets = item['assets']
    meta = assets['red']['raster:bands'][0]
    scale, offset = meta['scale'], meta['offset']

    # CUBIC for the same reason the basemap uses it: both bands are 10 m native
    # and the target grid is 20.5 m, so this is a downsample and a box-ish filter
    # beats nearest. The ratio is taken AFTER resampling, which is the correct
    # order for a downsample - averaging reflectance then dividing is what a
    # coarser sensor would have measured, whereas averaging ratios is not.
    red = warp('/vsicurl/' + assets['red']['href'], grid, 'cubic', gdal.GDT_Float32, nodata=0)
    nir = warp('/vsicurl/' + assets['nir']['href'], grid, 'cubic', gdal.GDT_Float32, nodata=0)
    valid = (red > 0) & (nir > 0)
    red = red * scale + offset
    nir = nir * scale + offset

    valid = erode(valid)
    scl = warp('/vsicurl/' + assets['scl']['href'], grid, 'near', gdal.GDT_Byte)
    cloudy = np.isin(scl, SCL_REJECT)
    valid &= erode(~cloudy, CLOUD_GROW_PX)

    total = nir + red
    valid &= total > MIN_SUM_RHO

    ndvi = np.zeros_like(red)
    np.divide(nir - red, total, out=ndvi, where=valid)
    np.clip(ndvi, -1.0, 1.0, out=ndvi)

    p = item['properties']
    log(
        f'   {item["id"]}: usable {100 * valid.mean():5.1f}% of the grid  '
        f'SCL-rejected {100 * cloudy.mean():4.2f}%  '
        f'sun alt {p["view:sun_elevation"]:.1f}  '
        f'mean NDVI where valid {float(ndvi[valid].mean()) if valid.any() else 0:.3f}'
    )
    return ndvi, valid


def main():
    hf = json.load(open(os.path.join(DATA_DIR, 'heightfield.json')))
    b = hf['bboxCrsUnits']
    grid = {
        'crs': hf['crs'],
        'xmin': b['xmin'],
        'ymin': b['ymin'],
        'xmax': b['xmax'],
        'ymax': b['ymax'],
        'width': hf['dimensions']['width'],
        'height': hf['dimensions']['height'],
    }
    log(f'== Grid, from public/data/heightfield.json: {grid["width"]}x{grid["height"]} {grid["crs"]}')

    mosaic = np.zeros((grid['height'], grid['width']), np.float32)
    filled = np.zeros((grid['height'], grid['width']), bool)
    used = []

    for name, ids in SCENES:
        if filled.all():
            log(f'== {name}: skipped, the grid is already complete')
            break
        log(f'== {name}')
        for item in stac_items(ids):
            ndvi, valid = granule(item, grid)
            take = valid & ~filled
            mosaic[take] = ndvi[take]
            filled |= take
            used.append({
                'id': item['id'],
                'datetime': item['properties']['datetime'],
                'scene': name,
                'pixelsContributed': int(take.sum()),
            })
        log(f'   grid now {100 * filled.mean():.2f}% complete')

    gaps = int((~filled).sum())
    if gaps:
        # Left at NDVI 0 rather than guessed. 0 reads as "no vegetation" to
        # everything downstream, which is the conservative direction: a gap
        # produces bare ground, never phantom grass.
        log(f'== {gaps:,} pixels ({100 * gaps / filled.size:.3f}%) had no valid observation - left at NDVI 0')

    # NDVI -1..1 -> 0..255. The step is 1/127.5 = 0.0078, far finer than any
    # threshold this drives, and it keeps the intermediate one byte per pixel.
    byte = np.clip(np.round((mosaic + 1.0) * 127.5), 0, 255).astype(np.uint8)
    byte.tofile(OUT_BIN)

    inside = mosaic[filled]
    percentiles = [1, 5, 10, 25, 50, 75, 90, 95, 99]
    stats = {f'p{p}': round(float(np.percentile(inside, p)), 4) for p in percentiles} if filled.any() else {}

    sidecar = {
        'generatedBy': 'tools/basemap-source/build-ndvi.py',
        'grid': 'identical to heightfield.json: same dimensions, bboxCrsUnits, resolution and row order',
        'crs': grid['crs'],
        'bboxCrsUnits': {k: grid[k] for k in ('xmin', 'ymin', 'xmax', 'ymax')},
        'dimensions': {'width': grid['width'], 'height': grid['height']},
        'resolutionMPerPx': hf['resolutionMPerPx'],
        'rowOrientation': hf['rowOrientation'],
        'encoding': {
            'file': os.path.relpath(OUT_BIN, REPO),
            'bytes': int(byte.size),
            'sha256Prefix': hashlib.sha256(byte.tobytes()).hexdigest()[:8],
            'channels': 1,
            'depth': 8,
            'meaning': 'NDVI mapped linearly: byte = round((ndvi + 1) * 127.5), so 0 = -1, 128 ~ 0, 255 = +1',
            'gapValue': 'byte 128 (NDVI 0) where no scene had a valid observation',
        },
        'processing': {
            'index': '(nir - red) / (nir + red), from Sentinel-2 L2A B08 and B04',
            'deShaded': False,
            'deShadedWhyNot': 'NDVI is a ratio and the C-correction gain is band-independent, so it cancels exactly',
            'sclRejected': list(SCL_REJECT),
            'sclNote': 'snow/ice (11) is rejected here, unlike the basemap, because snow is not a vegetation measurement',
            'cloudGrowPx': CLOUD_GROW_PX,
            'minSumReflectance': MIN_SUM_RHO,
            'gapPixels': gaps,
            'gapFraction': round(gaps / float(byte.size), 6),
        },
        'ndviPercentiles': stats,
        'scenesUsed': used,
        'source': {
            'name': 'Copernicus Sentinel-2 L2A (Collection 1), surface reflectance bands B08/B04',
            'via': 'AWS Open Data via the Earth Search STAC API (https://earth-search.aws.element84.com/v1)',
            'attribution': 'Contains modified Copernicus Sentinel data 2025',
            'license': 'Copernicus Sentinel Data Legal Notice',
            'licenseUrl': 'https://sentinels.copernicus.eu/documents/247904/690755/Sentinel_Data_Legal_Notice',
        },
    }
    json.dump(sidecar, open(OUT_JSON, 'w'), indent=2)

    log('')
    log(f'{os.path.relpath(OUT_BIN, REPO)}: {byte.size / 1e6:.1f} MB, {100 * filled.mean():.2f}% observed')
    if stats:
        log('NDVI percentiles: ' + '  '.join(f'{k} {v:+.3f}' for k, v in stats.items()))
    log('')
    log('Next: node tools/build-groundcover.mjs')


if __name__ == '__main__':
    main()
