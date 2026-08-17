#!/usr/bin/env python3
"""Builds public/data/basemap.<hash>.webp - the satellite ground texture.

Run manually, not part of `npm run build`: it needs GDAL and the network, and
the product it writes is committed like every other file in public/data. Same
standing as tools/dtm-source/*.sh - heavy external work, small shipped result.

    python3 tools/basemap-source/build-basemap.py

WHAT THIS PRODUCES, and why it is not simply a photo
----------------------------------------------------
src/terrain.js draws a LIT surface: the texture it samples is albedo, and three
multiplies it by a sun that moves with the time-of-day slider. A satellite image
is the opposite - it already contains one particular sun. Draped as-is, a north
face would be shaded twice, and at sunset the shading inside the texture would
still point south-east. So this script divides the acquisition's own
illumination back out (see DE-SHADING below), which turns the image into an
approximate albedo map - the thing the renderer actually wants.

Everything else here is grid discipline: the output is laid out on EXACTLY the
heightfield's grid, read from public/data/heightfield.json rather than repeated
as constants, so src/terrain.js addresses it with the UV mapping it already has
for the canopy mask and nothing needs a second projection.

SOURCE, and the licence that picked it
--------------------------------------
Sentinel-2 L2A (Collection 1) surface reflectance, as Cloud-Optimized GeoTIFFs
on AWS Open Data, found through the Earth Search STAC API - no account, no key.
The EU legal notice on Copernicus Sentinel data grants free, full and open
access including reproduction, distribution and modification, and prescribes
the notice for modified data verbatim: 'Contains modified Copernicus Sentinel
data [Year]'. That string is in the manifest below and must not be paraphrased,
exactly like the VDA DTM's own prescribed wording.

Deliberately NOT EOX's ready-made "Sentinel-2 cloudless" mosaic, which would
have saved this whole script: it is CC BY-NC-SA 4.0 - non-commercial and
share-alike, more restrictive than anything else this project ships (CC BY 4.0,
ODbL).

SCENE CHOICE, measured rather than eyeballed
--------------------------------------------
Cloud was measured INSIDE the real park boundary (tools/park-boundary.geojson),
not on the granule, because a granule-wide figure says nothing about where the
cloud sits. The 2025-08-08 pass reads 0.01% cloud-affected inside the park and
2.11% over the whole bbox - the residue is one patch in the south-east corner,
outside the park. It is also the least snowy of the cloud-free summer passes
(snow/ice class 7.4% of the park, against 15.4% on 2025-07-09, which still
looks like winter up high). Both granules of the pass share one datatake, so
they share one illumination and there is no seam between them.

PATCH_SCENE fills whatever BASE_SCENE cannot: the 2025-07-09 pass is
cloud-free over the entire bbox (0.01%), so the south-east corner comes from
there. Its extra snow is irrelevant, being outside the park.

FOUR THINGS THAT WOULD SILENTLY GO WRONG
----------------------------------------
1. Collection-1 L2A reflectance is NOT DN/10000. Since processing baseline
   04.00 there is a BOA_ADD_OFFSET, and these assets declare it: scale 1e-4,
   offset -0.1. Ignoring it adds 0.1 reflectance to every pixel - a washed-out
   image that still looks plausible. Read from the STAC asset, not assumed.
2. The bands, not the TCI preview. TCI is already clipped (bright screes and
   every glacier saturate at 255), and de-shading a clipped value amplifies the
   clip. B04/B03/B02 cost three warps instead of one and keep the headroom.
3. The DEM is ED50 UTM32N (EPSG:23032) and Sentinel-2 is WGS84 UTM32N
   (EPSG:32632) - about 100 m apart on the ground. Both warps are given their
   real CRS and land on the same grid; skipping that would offset every hillside
   from its own shading by five pixels.
4. Cast shadows are NOT corrected. The de-shading knows the angle between the
   sun and the surface, so it fixes self-shading; a face hidden behind a ridge
   is dark for a reason no per-pixel formula can see. C_CORRECTION below is what
   keeps those pixels from being amplified into noise rather than pretending
   they can be recovered.
"""

import hashlib
import json
import math
import os
import shutil
import sys
import tempfile
import urllib.request

import numpy as np
from osgeo import gdal, osr

gdal.UseExceptions()

STAC = 'https://earth-search.aws.element84.com/v1/search'
COLLECTION = 'sentinel-2-c1-l2a'

# Priority order: the first scene that has a usable pixel wins it.
BASE_SCENE = ['S2A_T32TLR_20250808T103728_L2A', 'S2A_T32TMR_20250808T103728_L2A']
PATCH_SCENE = ['S2A_T32TLR_20250709T103044_L2A', 'S2A_T32TMR_20250709T103044_L2A']
SCENES = [('base 2025-08-08', BASE_SCENE), ('patch 2025-07-09', PATCH_SCENE)]

# L2A Scene Classification classes that must not reach the texture. 8/9/10 are
# cloud at medium and high probability and thin cirrus, 3 is cloud shadow, 1 is
# saturated or defective. 11 (snow/ice) is deliberately KEPT - a glacier is real
# ground here, and the park has 47 of them.
SCL_REJECT = (1, 3, 8, 9, 10)
CLOUD_GROW_PX = 3  # ~60 m, see the dilation comment in granule()
MATCH_PERCENTILES = (10, 90)  # the pair a patch scene's levels are fitted on, see match_levels()
SNOW_EXCLUDE_RHO = 0.30  # reflectance above which a pixel is treated as snow and left out of that fit

# De-shading. rho_flat = rho * (cos(sun_zenith) + C) / (cos(incidence) + C), the
# C-correction of Teillet et al: with C = 0 this is the plain cosine correction,
# which divides by a number approaching zero on a slope facing away from the sun
# and blows those pixels out (measured: 8.95% of the map clipped to white). C
# damps exactly that, at the cost of leaving dim slopes slightly dim - which is
# the honest trade, since some of them are in cast shadow and are not
# recoverable at all.
C_CORRECTION = 0.30
MAX_GAIN = 2.5  # a hard ceiling on top of C, for the few pixels C cannot tame

# Byte encoding. Reflectance runs 0..1 in principle but Alpine ground lives
# between 0.02 (shaded conifer) and 0.45 (bright scree); snow and ice go past
# 0.7. FULL_SCALE is where the byte range ends, so anything brighter clips to
# white - which for snow is not a loss, since src/terrain.js's own nival colour
# cannot reach white either at this exposure.
FULL_SCALE = 0.55
# Saturation, applied in linear reflectance around the luma. Sentinel-2 true
# colour is honest and looks drab: a narrow-band linear reflectance has none of
# the perceptual processing consumer imagery gets, and at 10-20 m every meadow
# pixel is grass mixed with soil and rock. Measured on this mosaic, the Cogne
# pastures come out at G/R 1.23 and the Valsavarenche valley floor at 1.03 - i.e.
# olive rather than the green the eye remembers from standing there. This is the
# same argument the rest of the project's colours are chosen by (see the "albedo
# is not appearance" warning in src/terrain.js): what matters is the intended
# look, and the reflectance is the starting point rather than the answer.
# 1.0 leaves the data exactly as measured.
SATURATION = 1.0
# Stored sRGB-encoded, and src/basemap.js tags the texture SRGBColorSpace so
# three converts it back. Storing linear values instead would band visibly in
# the darks at 8 bits and compress worse, since both WebP and JPEG assume a
# perceptual encoding.
WEBP_QUALITY = 80

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(REPO, 'public', 'data')
DEM_PNG = os.path.join(REPO, 'DEM', 'pngp_heightmap.png')
DEM_META = os.path.join(REPO, 'DEM', 'pngp_heightmap_meta.json')


def log(*a):
    print(*a, flush=True)


def stac_items(ids):
    """The STAC items for these granule ids, in the order asked for.

    The per-item GET endpoint 404s for these ids; item search by id is what
    works. Sun angles come from here rather than being written down, because
    they are per granule (the two halves of one pass differ by 2 degrees) and
    getting them wrong is invisible - the image just looks slightly wrong.
    """
    body = json.dumps({'collections': [COLLECTION], 'ids': ids, 'limit': len(ids)}).encode()
    req = urllib.request.Request(STAC, data=body, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=60) as r:
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
        dstNodata=nodata,
        multithread=True,
    )
    a = out.GetRasterBand(1).ReadAsArray()
    out = None
    return a


def dem_on_grid(grid):
    """The project's own heightmap, in metres, on the target grid.

    The PNG carries no georeference (it is a plain 16-bit image plus a sidecar),
    so the CRS, corner coordinates and the linear elevation mapping are all
    asserted here from DEM/pngp_heightmap_meta.json - the same numbers
    tools/process-heightmap.mjs uses.
    """
    meta = json.load(open(DEM_META))
    b = meta['bbox_utm32n']
    lo = meta['elevation_m']['min']
    hi = meta['elevation_m']['max']
    vrt = gdal.Translate(
        '',
        DEM_PNG,
        format='VRT',
        outputSRS=meta['crs'],
        outputBounds=(b['xmin'], b['ymax'], b['xmax'], b['ymin']),
        # noData=None matters: the PNG declares 0 as nodata, but 0 is a real
        # elevation here (the mosaic's floor, 238.5 m) and masking it would
        # punch holes in the shading.
        noData='none',
    )
    scaled = gdal.Translate(
        '', vrt, format='MEM', outputType=gdal.GDT_Float32, scaleParams=[[0, 65535, lo, hi]]
    )
    dem = warp(scaled, grid, 'cubic', gdal.GDT_Float32)
    vrt = scaled = None
    return dem


def cos_incidence(dem_ds, sun_azimuth_deg, sun_elevation_deg):
    """cos of the angle between the sun and the surface, per pixel.

    Computed from slope and aspect rather than from gdaldem's hillshade, which
    quantises the same quantity to a byte - and this value is a divisor, so its
    precision ends up in every pixel of the result.
    """
    slope = gdal.DEMProcessing('', dem_ds, 'slope', format='MEM', computeEdges=True)
    aspect = gdal.DEMProcessing('', dem_ds, 'aspect', format='MEM', computeEdges=True)
    s = np.radians(slope.GetRasterBand(1).ReadAsArray())
    # gdaldem reports aspect clockwise from north, and -9999 for flat ground,
    # where aspect is undefined and the cos term below must vanish anyway.
    a_raw = aspect.GetRasterBand(1).ReadAsArray()
    a = np.radians(np.where(a_raw < 0, 0.0, a_raw))
    slope = aspect = None
    zenith = math.radians(90.0 - sun_elevation_deg)
    az = math.radians(sun_azimuth_deg)
    return np.cos(s) * math.cos(zenith) + np.sin(s) * math.sin(zenith) * np.cos(az - a)


def granule(item, grid, dem_ds):
    """De-shaded reflectance and a validity mask for one Sentinel-2 granule."""
    assets = item['assets']
    band = assets['red']['raster:bands'][0]
    scale, offset = band['scale'], band['offset']

    rgb = np.zeros((grid['height'], grid['width'], 3), np.float32)
    valid = np.ones((grid['height'], grid['width']), bool)
    for i, key in enumerate(('red', 'green', 'blue')):
        dn = warp('/vsicurl/' + assets[key]['href'], grid, 'cubic', gdal.GDT_Float32, nodata=0)
        valid &= dn > 0  # 0 is the granule's declared nodata, i.e. outside the swath
        rgb[..., i] = dn * scale + offset

    valid = erode(valid)
    scl = warp('/vsicurl/' + assets['scl']['href'], grid, 'near', gdal.GDT_Byte)
    cloudy = np.isin(scl, SCL_REJECT)
    # Grown, not taken as given: a cloud has a soft edge and SCL draws a hard
    # one, so the halo just outside a flagged cloud is still brightened haze.
    # Eroding the complement is the same operation as dilating the cloud.
    valid &= erode(~cloudy, CLOUD_GROW_PX)

    p = item['properties']
    cosi = cos_incidence(dem_ds, p['view:sun_azimuth'], p['view:sun_elevation'])
    zenith = math.radians(90.0 - p['view:sun_elevation'])
    gain = np.minimum((math.cos(zenith) + C_CORRECTION) / (cosi + C_CORRECTION), MAX_GAIN)
    gain = np.maximum(gain, 0.0)  # cos i < 0 is ground facing away from the sun entirely
    before = float(np.mean(rgb[valid])) if valid.any() else 0.0
    rgb *= gain[..., None]
    np.clip(rgb, 0.0, None, out=rgb)

    log(
        f'   {item["id"]}: usable {100 * valid.mean():5.1f}% of the grid  cloud-rejected '
        f'{100 * cloudy.mean():4.2f}%  '
        f'sun az {p["view:sun_azimuth"]:.1f} alt {p["view:sun_elevation"]:.1f}  '
        f'mean rho {before:.4f} -> {float(np.mean(rgb[valid])) if valid.any() else 0:.4f}  '
        f'gain mean {float(gain.mean()):.3f} max {float(gain.max()):.3f}'
    )
    return rgb, valid


def erode(mask, radius=2):
    """Shrink a validity mask, so a swath edge cannot bleed into the image.

    The nodata test happens after a CUBIC warp, and cubic resampling next to
    nodata mixes the 0 in: pixels a step or two inside the granule's edge come
    out valid (dn > 0) but darkened, which drew hairline dark seams across the
    Mont Blanc corner where two granules meet. Out-of-array is treated as valid
    so the bbox's own border is not eaten.
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


def match_levels(rgb, valid, composite, filled):
    """Fit one scene's levels to the scene already in the composite.

    A later pass fills what the first could not, and two passes a month apart
    differ in atmosphere and in how green the pastures are - so without this the
    patched south-east corner reads as a differently-toned block with a straight
    edge. A per-channel least-squares gain and offset over the pixels both cover
    puts them on the same level; it cannot fix a different snow line, which is
    why the patch is only ever used outside the park.
    """
    # Snow is excluded from the estimator on both sides. The two passes overlap
    # over the whole bbox, glaciers included, and a month of melt moves the snow
    # line hundreds of metres - so ice in the sample makes the fit describe the
    # difference in snow rather than the difference in level. What the patch is
    # actually used for is low ground in the south-east corner, where there is
    # none.
    both = valid & filled & (rgb[..., 1] < SNOW_EXCLUDE_RHO) & (composite[..., 1] < SNOW_EXCLUDE_RHO)
    n = int(both.sum())
    if n < 10000:
        log(f'   levels: only {n} overlapping pixels, left unmatched')
        return rgb
    parts = []
    for i in range(3):
        x = np.percentile(rgb[..., i][both], MATCH_PERCENTILES)
        y = np.percentile(composite[..., i][both], MATCH_PERCENTILES)
        # Percentiles, not a least-squares line: the two passes overlap over the
        # whole bbox including every glacier, and snow is bright enough to own a
        # regression - fitted that way the gain came out 0.54, i.e. the dark end
        # of the image was being squashed to make the ice agree.
        a = (y[1] - y[0]) / max(x[1] - x[0], 1e-6)
        b = y[0] - a * x[0]
        rgb[..., i] = rgb[..., i] * a + b
        parts.append(f'{"RGB"[i]} x{a:.3f}{b:+.4f}')
    log(f'   levels matched over {n} overlapping pixels: ' + ', '.join(parts))
    np.clip(rgb, 0.0, None, out=rgb)
    return rgb


def srgb_encode(x):
    """Linear 0..1 -> sRGB 0..1 (IEC 61966-2-1), the transfer three undoes."""
    return np.where(x <= 0.0031308, x * 12.92, 1.055 * np.power(np.maximum(x, 0), 1 / 2.4) - 0.055)


def main():
    global SATURATION, FULL_SCALE, WEBP_QUALITY
    max_dim = None
    for arg in sys.argv[1:]:
        if arg.startswith('--saturation='):
            SATURATION = float(arg.split('=', 1)[1])
        elif arg.startswith('--full-scale='):
            FULL_SCALE = float(arg.split('=', 1)[1])
        elif arg.startswith('--quality='):
            WEBP_QUALITY = int(arg.split('=', 1)[1])
        elif arg.startswith('--max-dim='):
            max_dim = int(arg.split('=', 1)[1])
        elif arg not in ('--use-cache',):
            raise SystemExit(f'unknown argument: {arg}')

    manifest_path = os.path.join(DATA_DIR, 'heightfield.json')
    hf = json.load(open(manifest_path))
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
    # --max-dim scales the OUTPUT grid while leaving the bbox exactly as it is, the same
    # convention (and the same flag name) as tools/process-heightmap.mjs.
    #
    # Keeping the bbox identical is the whole reason this is safe: the terrain samples
    # the basemap with its own normalised UVs, so a finer photograph changes the texel
    # count and nothing else - no second projection comes into existence. It is the same
    # property the height tier relies on ("Resolution is a separate question from grid
    # alignment, because UVs are normalised").
    #
    # Sentinel-2's visible bands are 10 m native, and this grid has been 20.48 m since
    # the start - half the resolution the source already provides, for free. 8192 is the
    # useful ceiling rather than the native 8388: plenty of GPUs cap MAX_TEXTURE_SIZE at
    # 8192, and 8192 costs 10.24 m/px, 2.4% coarser than native, for a texture far more
    # hardware can actually hold.
    if max_dim:
        longest = max(grid['width'], grid['height'])
        if max_dim < longest:
            log(f'== --max-dim={max_dim} is below the base grid\'s {longest}; refusing to'
                ' build a basemap coarser than the one that ships')
            raise SystemExit(2)
        scale = max_dim / longest
        grid['width'] = round(grid['width'] * scale)
        grid['height'] = round(grid['height'] * scale)
        res = (grid['xmax'] - grid['xmin']) / grid['width']
        log(f'== --max-dim={max_dim}: grid scaled x{scale:.4f} -> {grid["width"]}x{grid["height"]}'
            f' = {res:.2f} m/px (Sentinel-2 visible is 10 m native)')
    log(f'== Grid: {grid["width"]}x{grid["height"]} {grid["crs"]}'
        f'  (bbox from public/data/heightfield.json, unchanged)')

    log('== Elevation on the same grid (for the de-shading)')
    dem = dem_on_grid(grid)
    dem_ds = gdal.GetDriverByName('MEM').Create('', grid['width'], grid['height'], 1, gdal.GDT_Float32)
    dem_ds.SetProjection(_grid_wkt(grid))
    dem_ds.SetGeoTransform(_grid_transform(grid))
    dem_ds.GetRasterBand(1).WriteArray(dem)
    log(f'   elevation {dem.min():.1f} .. {dem.max():.1f} m')

    # Tuning the encode (saturation, scale, quality) does not depend on anything
    # above this point, and re-downloading four granules to try another number is
    # two minutes each time. --use-cache reads back the last composite instead.
    cache = os.path.join(os.path.expanduser('~'), 'pngp-basemap-work', 'composite.npz')
    if '--use-cache' in sys.argv and os.path.exists(cache):
        z = np.load(cache, allow_pickle=True)
        composite = z['composite']
        used = json.loads(str(z['used']))
        log(f'== Reusing the cached composite from {cache} (no download)')
        if composite.shape != (grid['height'], grid['width'], 3):
            raise SystemExit('cached composite does not match the current grid - delete it and rebuild')
        return finish(composite, grid, hf, used)

    composite = np.zeros((grid['height'], grid['width'], 3), np.float32)
    filled = np.zeros((grid['height'], grid['width']), bool)
    used = []
    for scene_index, (name, ids) in enumerate(SCENES):
        if filled.all():
            log(f'== {name}: not needed, every pixel already filled')
            continue
        log(f'== {name}')
        for item in stac_items(ids):
            rgb, valid = granule(item, grid, dem_ds)
            if scene_index > 0:
                rgb = match_levels(rgb, valid, composite, filled)
            take = valid & ~filled
            composite[take] = rgb[take]
            filled |= take
            used.append({'id': item['id'], 'datetime': item['properties']['datetime'],
                         'pixelsContributed': int(take.sum())})
        log(f'   filled {100 * filled.mean():.3f}% of the grid')

    if not filled.all():
        # Nothing sensible to invent here, and a black hole in the ground would
        # be very visible - so the nearest valid neighbour, reported honestly.
        holes = int((~filled).sum())
        log(f'!! {holes} pixels ({100 * (~filled).mean():.4f}%) had no usable pixel in any scene')
        for axis in (0, 1):
            for shift in (1, -1):
                gap = ~filled
                if not gap.any():
                    break
                src = np.roll(composite, shift, axis=axis)
                ok = np.roll(filled, shift, axis=axis) & gap
                composite[ok] = src[ok]
                filled |= ok

    # Cached BEFORE the encode, so what is stored is the measured reflectance and
    # every knob below can be tried against it without another download.
    os.makedirs(os.path.dirname(cache), exist_ok=True)
    np.savez_compressed(cache, composite=composite, used=json.dumps(used))

    return finish(composite, grid, hf, used)


def finish(composite, grid, hf, used):
    """Everything from the composited reflectance to the shipped files."""
    if SATURATION != 1.0:
        luma = (composite * np.array([0.2126, 0.7152, 0.0722], np.float32)).sum(axis=2, keepdims=True)
        composite = np.clip(luma + (composite - luma) * SATURATION, 0.0, None)

    lin = np.clip(composite / FULL_SCALE, 0.0, 1.0)
    pct = np.percentile(composite.reshape(-1, 3), [2, 50, 98], axis=0)
    log('== Reflectance after de-shading, per channel')
    for i, ch in enumerate('RGB'):
        log(f'   {ch}: p2 {pct[0][i]:.3f}  median {pct[1][i]:.3f}  p98 {pct[2][i]:.3f}')
    log(f'   clipped at FULL_SCALE={FULL_SCALE}: {100 * (lin >= 1.0).mean():.2f}% of samples')

    byte = np.clip(np.round(srgb_encode(lin) * 255.0), 0, 255).astype(np.uint8)

    work = tempfile.mkdtemp(prefix='pngp-basemap-')
    try:
        tif = os.path.join(work, 'basemap.tif')
        ds = gdal.GetDriverByName('GTiff').Create(tif, grid['width'], grid['height'], 3, gdal.GDT_Byte)
        ds.SetProjection(_grid_wkt(grid))
        ds.SetGeoTransform(_grid_transform(grid))
        for i in range(3):
            ds.GetRasterBand(i + 1).WriteArray(byte[..., i])
        ds = None
        webp = os.path.join(work, 'basemap.webp')
        gdal.Translate(webp, tif, format='WEBP', creationOptions=[f'QUALITY={WEBP_QUALITY}'])

        raw = open(webp, 'rb').read()
        digest = hashlib.sha256(raw).hexdigest()[:8]
        name = f'basemap.{digest}.webp'
        shutil.copyfile(webp, os.path.join(DATA_DIR, name))
    finally:
        shutil.rmtree(work, ignore_errors=True)

    # The level this run produced. RESOLUTION IS COMPUTED FROM THE GRID, not copied from
    # heightfield.json as it used to be: that copy was harmless only while the two grids
    # were the same size, and --max-dim made it a manifest that lied about its own image.
    level = {
        'resolutionMPerPx': {
            'x': (grid['xmax'] - grid['xmin']) / grid['width'],
            'y': (grid['ymax'] - grid['ymin']) / grid['height'],
        },
        'dimensions': {'width': grid['width'], 'height': grid['height']},
        'file': {'name': name, 'bytes': len(raw), 'sha256Prefix': digest},
    }

    # LEVELS, coarsest first, exactly as heighttier.json orders its own - but chosen by
    # the GPU rather than by a control: src/basemap.js takes the finest level that
    # MAX_TEXTURE_SIZE can actually hold. 8192 is more than plenty of hardware allows,
    # and unlike the terrain tier this is the DEFAULT, so there is no opting out of a
    # texture that will not upload. A visitor whose GPU caps at 4096 gets the 4096 level
    # and the same park.
    #
    # Merged with whatever is already on disk, because one run builds ONE level: the
    # composite is warped at the target grid, so two resolutions mean two runs
    # (--max-dim=8192 and then no flag, or the reverse). This is deliberately not
    # disguised as a single command.
    levels = []
    existing_path = os.path.join(DATA_DIR, 'basemap.json')
    if os.path.exists(existing_path):
        try:
            levels = json.load(open(existing_path)).get('levels', [])
        except (ValueError, OSError):
            levels = []
    levels = [lv for lv in levels
              if lv.get('dimensions', {}).get('width') != grid['width']]
    levels.append(level)
    levels.sort(key=lambda lv: lv['dimensions']['width'])

    # Only now, and only files no surviving level points at: the previous version deleted
    # every basemap webp but the one it had just written, which with two levels would
    # have removed the other level's image on every run.
    keep = {lv['file']['name'] for lv in levels}
    for old in os.listdir(DATA_DIR):
        if old.startswith('basemap.') and old.endswith('.webp') and old not in keep:
            os.remove(os.path.join(DATA_DIR, old))
            log(f'   removed {old}, which no level references any more')

    manifest = {
        'schemaVersion': 2,
        'grid': 'the same bbox, crs and row order as heightfield.json. NOT the same pixel '
                'dimensions any more: the terrain samples this with normalised UVs, so a '
                'finer photograph changes texel count and nothing else.',
        'crs': grid['crs'],
        'bboxCrsUnits': {k: grid[k] for k in ('xmin', 'ymin', 'xmax', 'ymax')},
        'levels': levels,
        'rowOrientation': hf['rowOrientation'],
        'encoding': {
            'channels': 3,
            'transfer': 'sRGB (IEC 61966-2-1). src/basemap.js tags the texture SRGBColorSpace, '
                        'so a shader samples LINEAR values in 0..1.',
            'valueToReflectance': f'surface reflectance = linear_sample * {FULL_SCALE}',
            'fullScale': FULL_SCALE,
            'quality': f'WebP, quality {WEBP_QUALITY}',
        },
        'processing': {
            'deShaded': True,
            'method': 'C-correction (Teillet et al): rho_flat = rho * (cos(sun_zenith) + C) / '
                      '(cos(incidence) + C), incidence from this project own DEM at the '
                      'granule own sun angles',
            'cCorrection': C_CORRECTION,
            'maxGain': MAX_GAIN,
            'castShadows': 'not corrected - ground hidden behind a ridge stays dark',
            'cloudRejectedSclClasses': list(SCL_REJECT),
            'snowKept': 'SCL class 11 (snow/ice) is kept: the park has 47 real glaciers',
        },
        # No top-level 'file' any more: levels[] is the only place an image is named.
        # Two names for one thing is how they come to disagree, and a reader that took
        # the top-level one would silently ignore the GPU's limit.
        'source': {
            'name': 'Copernicus Sentinel-2 L2A (Collection 1), surface reflectance bands B04/B03/B02',
            # Prescribed verbatim by the EU legal notice on Copernicus Sentinel
            # data for adapted or modified data. Do not paraphrase.
            'attribution': 'Contains modified Copernicus Sentinel data 2025',
            'license': 'Copernicus Sentinel Data Legal Notice (free, full and open access)',
            'licenseUrl': 'https://sentinels.copernicus.eu/documents/247904/690755/Sentinel_Data_Legal_Notice',
            'licenseVerifiedVia': 'The European Commission legal notice itself, read 2026-08-11: '
                                  'reproduction, distribution, communication to the public and '
                                  'modification are all granted, with the notice above required '
                                  'for modified data.',
            'access': 'AWS Open Data Cloud-Optimized GeoTIFFs, discovered through the Earth Search '
                      'STAC API (https://earth-search.aws.element84.com/v1) - no account needed',
            'modifications': 'Derived product, not the original data: warped from EPSG:32632 to '
                             'EPSG:23032 on the heightfield grid, illumination of the acquisition '
                             'divided back out, cloudy pixels replaced from a second pass, and '
                             'quantised to 8 bits per channel.',
            'scenes': used,
        },
        'generatedBy': 'tools/basemap-source/build-basemap.py',
    }
    with open(os.path.join(DATA_DIR, 'basemap.json'), 'w') as f:
        json.dump(manifest, f, indent=2)
        f.write('\n')

    log(f'== Wrote public/data/{name} ({len(raw) / 1e6:.2f} MB) and basemap.json')


def _grid_wkt(grid):
    srs = osr.SpatialReference()
    srs.SetFromUserInput(grid['crs'])
    return srs.ExportToWkt()


def _grid_transform(grid):
    return (
        grid['xmin'],
        (grid['xmax'] - grid['xmin']) / grid['width'],
        0.0,
        grid['ymax'],
        0.0,
        -(grid['ymax'] - grid['ymin']) / grid['height'],
    )


if __name__ == '__main__':
    sys.exit(main())
