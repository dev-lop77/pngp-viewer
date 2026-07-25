"""
DTM Valle d'Aosta → UE5 Heightmap Converter
=============================================
Processa i file DTM ASC della Regione Valle d'Aosta
e genera heightmap PNG 16-bit per Unreal Engine 5.

Funzionalità:
  - Legge singolo file ASC o mosaica una cartella di tile ASC
  - Gestisce il formato italiano (virgola decimale)
  - Riproietta da UTM32/EUR_M a coordinate metriche UE5
  - Ritaglia l'area del PNGP (opzionale)
  - Output: PNG 16-bit + report con parametri per UE5

Requisiti:
    pip install numpy pillow pyproj

Uso:
    # File singolo:
    python vda_dtm_to_ue5.py --input DTM0508_002_000586.ASC

    # Cartella con tutti i tile:
    python vda_dtm_to_ue5.py --folder /percorso/cartella/dtm/

    # Con ritaglio PNGP:
    python vda_dtm_to_ue5.py --folder /percorso/dtm/ --clip-pngp

    # Dimensione output personalizzata:
    python vda_dtm_to_ue5.py --folder /percorso/dtm/ --size 4033
"""

import argparse
import sys
import os
import glob
from pathlib import Path

# ── Dipendenze ────────────────────────────────────────────────────────────────
try:
    import numpy as np
except ImportError:
    print("ERRORE: numpy non installato. Esegui: pip install numpy")
    sys.exit(1)

try:
    from PIL import Image
except ImportError:
    print("ERRORE: Pillow non installata. Esegui: pip install pillow")
    sys.exit(1)

try:
    from pyproj import Transformer
    HAS_PYPROJ = True
except ImportError:
    print("AVVISO: pyproj non installato. La riproiezione sarà disabilitata.")
    print("        Installa con: pip install pyproj")
    HAS_PYPROJ = False

# ── Bounding Box PNGP (WGS84) ─────────────────────────────────────────────────
# Parco Nazionale Gran Paradiso
PNGP_BOUNDS_WGS84 = {
    "lon_min": 6.90,
    "lon_max": 7.55,
    "lat_min": 45.40,
    "lat_max": 45.70,
}

# Dimensioni valide UE5 Landscape
UE5_VALID_SIZES = [127, 253, 505, 1009, 2017, 4033, 8129]

# ── Parsing argomenti ─────────────────────────────────────────────────────────
parser = argparse.ArgumentParser(
    description="Converte DTM VdA ASC in heightmap PNG 16-bit per UE5",
    formatter_class=argparse.RawDescriptionHelpFormatter,
    epilog=__doc__
)
group = parser.add_mutually_exclusive_group(required=True)
group.add_argument("--input",  metavar="FILE",   help="Singolo file ASC")
group.add_argument("--folder", metavar="DIR",    help="Cartella con tutti i tile ASC")

parser.add_argument("--output",    default="heightmap_ue5.png",
                    help="File PNG di output (default: heightmap_ue5.png)")
parser.add_argument("--size",      type=int, default=2017,
                    help=f"Dimensione output UE5: {UE5_VALID_SIZES} (default: 2017)")
parser.add_argument("--clip-pngp", action="store_true",
                    help="Ritaglia l'area del Parco Nazionale Gran Paradiso")
parser.add_argument("--preview",   action="store_true",
                    help="Genera anteprima colorata ipsometrica")
parser.add_argument("--info",      action="store_true",
                    help="Mostra solo info sul file senza convertire")
args = parser.parse_args()

if args.size not in UE5_VALID_SIZES:
    print(f"ERRORE: --size deve essere uno tra {UE5_VALID_SIZES}")
    sys.exit(1)

# ══════════════════════════════════════════════════════════════════════════════
# FUNZIONI
# ══════════════════════════════════════════════════════════════════════════════

def read_asc_header(filepath):
    """
    Legge l'header di un file ASC e restituisce un dizionario con i parametri.
    Gestisce sia il punto che la virgola come separatore decimale.
    """
    header = {}
    keys_needed = {"ncols", "nrows", "xllcorner", "yllcorner",
                   "xllcenter", "yllcenter", "cellsize", "nodata_value"}

    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            parts = line.strip().split()
            if not parts:
                continue
            key = parts[0].lower()
            if key in keys_needed:
                val = parts[1].replace(",", ".")
                header[key] = float(val) if "." in val else int(val)
            elif key not in {"ncols", "nrows"} and len(parts) > 1:
                # Fine header: prima riga di dati
                try:
                    float(parts[0].replace(",", "."))
                    break
                except ValueError:
                    continue

    # Normalizza xllcenter → xllcorner
    if "xllcenter" in header and "xllcorner" not in header:
        cs = header.get("cellsize", 0)
        header["xllcorner"] = header["xllcenter"] - cs / 2
        header["yllcorner"] = header["yllcenter"] - cs / 2

    return header


def read_asc_data(filepath, header):
    """
    Legge i dati del DTM da file ASC.
    Gestisce la virgola decimale italiana.
    """
    nodata = header.get("nodata_value", -9999)
    nrows = int(header["nrows"])
    ncols = int(header["ncols"])

    data = []
    header_lines = len([k for k in ("ncols", "nrows", "xllcorner", "yllcorner",
                                     "xllcenter", "yllcenter", "cellsize",
                                     "nodata_value") if k in header])
    header_lines = max(header_lines, 5)  # minimo 5 righe header

    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        # Salta header
        for _ in range(header_lines + 1):  # +1 per sicurezza
            pos = f.tell()
            line = f.readline()
            try:
                float(line.strip().split()[0].replace(",", "."))
                f.seek(pos)
                break
            except (ValueError, IndexError):
                continue

        for line in f:
            line = line.strip()
            if not line:
                continue
            # Converti virgola → punto e parsa
            row = [float(v.replace(",", ".")) for v in line.split()]
            data.extend(row)

    arr = np.array(data, dtype=np.float32)

    # Gestisci dimensioni
    expected = nrows * ncols
    if len(arr) < expected:
        # Padding con nodata se incompleto
        arr = np.pad(arr, (0, expected - len(arr)), constant_values=nodata)
    elif len(arr) > expected:
        arr = arr[:expected]

    arr = arr.reshape(nrows, ncols)
    return arr


def asc_to_utm_bounds(header):
    """Calcola i bounds UTM del tile dall'header ASC."""
    x_min = header["xllcorner"]
    y_min = header["yllcorner"]
    cs    = header["cellsize"]
    ncols = int(header["ncols"])
    nrows = int(header["nrows"])
    x_max = x_min + cs * ncols
    y_max = y_min + cs * nrows
    return x_min, y_min, x_max, y_max


def utm32_to_wgs84_bounds(x_min, y_min, x_max, y_max):
    """Converte bounds UTM32/EUR_M → WGS84."""
    if not HAS_PYPROJ:
        return None
    # EUR_M (EPSG approssimativo per vecchio datum italiano)
    # Usiamo EPSG:23032 (ED50 UTM zone 32N) che è il più comune per VdA
    try:
        transformer = Transformer.from_crs("EPSG:23032", "EPSG:4326", always_xy=True)
        lon_min, lat_min = transformer.transform(x_min, y_min)
        lon_max, lat_max = transformer.transform(x_max, y_max)
        return lon_min, lat_min, lon_max, lat_max
    except Exception as e:
        print(f"  AVVISO riproiezione: {e}")
        return None


def is_in_pngp(lon_min, lon_max, lat_min, lat_max):
    """Verifica se un tile interseca il PNGP."""
    p = PNGP_BOUNDS_WGS84
    return (lon_max > p["lon_min"] and lon_min < p["lon_max"] and
            lat_max > p["lat_min"] and lat_min < p["lat_max"])


def dem_to_heightmap_16bit(dem_array, nodata_val=-9999):
    """Normalizza DEM in heightmap 16-bit per UE5."""
    # Maschera NoData
    mask = (dem_array == nodata_val) | np.isnan(dem_array)
    valid = dem_array[~mask]

    if len(valid) == 0:
        print("ERRORE: nessun dato valido nel DEM")
        return None, None, None

    alt_min = float(valid.min())
    alt_max = float(valid.max())

    # Riempi NoData con quota minima
    dem_clean = dem_array.copy()
    dem_clean[mask] = alt_min

    # Normalizza 0→1
    dem_norm = (dem_clean - alt_min) / (alt_max - alt_min + 1e-8)
    # Converti 16-bit
    dem_16 = (dem_norm * 65535).astype(np.uint16)

    return dem_16, alt_min, alt_max


def resize_for_ue5(arr, target_size):
    """Ridimensiona array a dimensione UE5 usando PIL."""
    pil_img = Image.fromarray(arr.astype(np.float32))
    pil_res = pil_img.resize((target_size, target_size), Image.BILINEAR)
    return np.array(pil_res, dtype=np.float32)


def save_heightmap(dem_16, output_path):
    """Salva heightmap PNG 16-bit."""
    img = Image.fromarray(dem_16, mode="I;16")
    img.save(output_path)


def save_preview(dem_norm, output_path):
    """Salva anteprima colorata ipsometrica."""
    n = dem_norm
    r = np.clip(n * 2.0 - 0.2, 0, 1)
    g = np.clip(1.0 - abs(n - 0.45) * 2.5, 0.15, 1)
    b = np.clip(1.2 - n * 2.0, 0, 1)

    # Aggiungi neve alle vette (>85% del range)
    snow = n > 0.82
    r[snow] = 0.95
    g[snow] = 0.97
    b[snow] = 1.0

    rgb = np.stack([
        (r * 255).astype(np.uint8),
        (g * 255).astype(np.uint8),
        (b * 255).astype(np.uint8)
    ], axis=-1)
    Image.fromarray(rgb, "RGB").save(output_path)


def print_ue5_instructions(output_path, alt_min, alt_max, target_size):
    """Stampa le istruzioni per importare in UE5."""
    dislivello = alt_max - alt_min
    # Scale Z UE5: il range completo 0-65535 mappa su [-256, 255.99] * ScaleZ unità
    # Con ScaleZ=100 → 512m di range. Adattiamo al nostro dislivello.
    scale_z = round(dislivello / 512 * 100, 0)

    print(f"""
{'═' * 60}
  FILE PRONTO PER UE5
{'═' * 60}
  File:         {os.path.abspath(output_path)}
  Dimensione:   {target_size} × {target_size} px
  Quota min:    {alt_min:.1f} m
  Quota max:    {alt_max:.1f} m
  Dislivello:   {dislivello:.1f} m

  IMPORTAZIONE IN UE5:
  ─────────────────────────────────────────────
  1. Crea nuovo progetto → template "Open World"
  2. Shift+3 → Landscape Mode → scheda "Import"
  3. Heightmap File → seleziona il file PNG sopra
  4. Impostazioni consigliate:
       Section Size:          63 quads
       Sections/Component:    2×2
       Number of Components:  automatico
       Location Z:            {alt_min * 100:.0f}  ← in cm (UE usa cm)
       Scale Z:               {scale_z}
  5. Clicca "Import"

  SCALA WORLD PARTITION (se usi Open World):
  ─────────────────────────────────────────────
  Con risoluzione 2m/px originale e {target_size}px di output:
  La heightmap copre ~{target_size * 2 / 1000:.1f} km × {target_size * 2 / 1000:.1f} km di terreno reale.
  Imposta Scale X/Y = 200 (= 2 metri per unità UE5).

  PROSSIMI PASSI:
  ─────────────────────────────────────────────
  • Landscape Material con layer per quota
    (erba 800-1600m, rododendri 1600-2200m,
     roccia 2200-3000m, neve >3000m)
  • Importa sentieri GPX come Spline Components
  • PCG per distribuzione flora automatica
{'═' * 60}
""")


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════

print("═" * 60)
print("  VdA DTM → UE5 Heightmap Converter  (risoluzione 2m)")
print("═" * 60)

# ── Raccolta file di input ────────────────────────────────────────────────────
asc_files = []

if args.input:
    if not os.path.exists(args.input):
        print(f"ERRORE: file non trovato → {args.input}")
        sys.exit(1)
    asc_files = [args.input]

elif args.folder:
    if not os.path.isdir(args.folder):
        print(f"ERRORE: cartella non trovata → {args.folder}")
        sys.exit(1)
    asc_files = sorted(glob.glob(os.path.join(args.folder, "*.ASC")) +
                       glob.glob(os.path.join(args.folder, "*.asc")))
    if not asc_files:
        print(f"ERRORE: nessun file ASC trovato in → {args.folder}")
        sys.exit(1)
    print(f"\nTrovati {len(asc_files)} file ASC nella cartella")

# ── Analisi tile ──────────────────────────────────────────────────────────────
print(f"\n[1/{3 if not args.info else 1}] Analisi file ASC...")

tile_info = []
for f in asc_files:
    try:
        header = read_asc_header(f)
        x_min, y_min, x_max, y_max = asc_to_utm_bounds(header)
        wgs84 = utm32_to_wgs84_bounds(x_min, y_min, x_max, y_max)

        info = {
            "path": f,
            "header": header,
            "utm": (x_min, y_min, x_max, y_max),
            "wgs84": wgs84,
            "in_pngp": is_in_pngp(*wgs84[:2], *wgs84[2:]) if wgs84 else True,
        }
        tile_info.append(info)

        if args.info:
            cs = header.get("cellsize", "?")
            nc = int(header.get("ncols", 0))
            nr = int(header.get("nrows", 0))
            area_km2 = (cs * nc / 1000) * (cs * nr / 1000) if isinstance(cs, (int, float)) else "?"
            print(f"\n  {os.path.basename(f)}")
            print(f"    Dimensione:   {nc} × {nr} px")
            print(f"    Cellsize:     {cs} m/px")
            print(f"    Area coperta: ~{area_km2:.2f} km²")
            print(f"    UTM32:        E{x_min:.0f}–{x_max:.0f}, N{y_min:.0f}–{y_max:.0f}")
            if wgs84:
                print(f"    WGS84:        Lon {wgs84[0]:.4f}°–{wgs84[2]:.4f}°")
                print(f"                  Lat {wgs84[1]:.4f}°–{wgs84[3]:.4f}°")
                print(f"    Nel PNGP:     {'SÌ ✓' if info['in_pngp'] else 'NO'}")

    except Exception as e:
        print(f"  AVVISO: errore leggendo {os.path.basename(f)}: {e}")

if args.info:
    print(f"\nTotale tile analizzati: {len(tile_info)}")
    if args.clip_pngp:
        in_pngp = sum(1 for t in tile_info if t["in_pngp"])
        print(f"Tile nel PNGP:         {in_pngp}")
    sys.exit(0)

# ── Filtro PNGP ───────────────────────────────────────────────────────────────
if args.clip_pngp and HAS_PYPROJ:
    filtered = [t for t in tile_info if t["in_pngp"]]
    if not filtered:
        print("AVVISO: nessun tile interseca il PNGP con i bounds definiti.")
        print("        Procedo con tutti i tile.")
    else:
        print(f"  Tile nel PNGP: {len(filtered)}/{len(tile_info)}")
        tile_info = filtered

# ── Lettura dati ──────────────────────────────────────────────────────────────
print(f"\n[2/3] Lettura dati DEM ({len(tile_info)} tile)...")

if len(tile_info) == 1:
    # Singolo tile
    t = tile_info[0]
    print(f"  Lettura: {os.path.basename(t['path'])}")
    dem = read_asc_data(t["path"], t["header"])
    print(f"  Dimensione: {dem.shape[1]} × {dem.shape[0]} px")
    nodata_val = t["header"].get("nodata_value", -9999)

else:
    # Mosaico di tile
    # Trova bbox globale UTM
    all_x_min = min(t["utm"][0] for t in tile_info)
    all_y_min = min(t["utm"][1] for t in tile_info)
    all_x_max = max(t["utm"][2] for t in tile_info)
    all_y_max = max(t["utm"][3] for t in tile_info)

    # Assumi cellsize uniforme (primo tile)
    cs        = tile_info[0]["header"]["cellsize"]
    nodata_val = tile_info[0]["header"].get("nodata_value", -9999)

    total_cols = int(round((all_x_max - all_x_min) / cs))
    total_rows = int(round((all_y_max - all_y_min) / cs))

    print(f"  Mosaic bounds: {total_cols} × {total_rows} px "
          f"= {total_cols * cs / 1000:.1f} × {total_rows * cs / 1000:.1f} km")

    # Inizializza canvas con nodata
    dem = np.full((total_rows, total_cols), nodata_val, dtype=np.float32)

    for i, t in enumerate(tile_info):
        print(f"  [{i+1}/{len(tile_info)}] {os.path.basename(t['path'])}", end="\r")
        tile_data = read_asc_data(t["path"], t["header"])

        # Posizione nel mosaic
        col_off = int(round((t["utm"][0] - all_x_min) / cs))
        # ASC ha y crescente dal basso, array NumPy dall'alto → inverti y
        row_off = int(round((all_y_max - t["utm"][3]) / cs))

        nr, nc = tile_data.shape
        # Inserisci tile (con clip per sicurezza)
        r_end = min(row_off + nr, total_rows)
        c_end = min(col_off + nc, total_cols)
        dem[row_off:r_end, col_off:c_end] = tile_data[:r_end - row_off, :c_end - col_off]

    print()  # newline dopo i progress

# ── Statistiche altimetriche ──────────────────────────────────────────────────
nodata_val_f = float(nodata_val) if nodata_val is not None else -9999.0
valid_mask = dem != nodata_val_f
valid_data = dem[valid_mask]
alt_min = float(valid_data.min())
alt_max = float(valid_data.max())
alt_med = float(valid_data.mean())
coverage = valid_mask.sum() / valid_mask.size * 100

print(f"\n  Quota minima:   {alt_min:.1f} m")
print(f"  Quota media:    {alt_med:.1f} m")
print(f"  Quota massima:  {alt_max:.1f} m")
print(f"  Copertura dati: {coverage:.1f}%")

if alt_max > 3500:
    print(f"  → Probabilmente inclusa la vetta Gran Paradiso (4061m)")

# ── Conversione e output ──────────────────────────────────────────────────────
print(f"\n[3/3] Conversione e salvataggio...")

# Ridimensiona
print(f"  Ridimensionamento a {args.size}×{args.size} px...")
dem_resized = resize_for_ue5(dem, args.size)

# Converti 16-bit
dem_16, alt_min_r, alt_max_r = dem_to_heightmap_16bit(dem_resized, nodata_val_f)
if dem_16 is None:
    sys.exit(1)

# Salva heightmap
print(f"  Salvataggio: {args.output}")
save_heightmap(dem_16, args.output)
size_mb = os.path.getsize(args.output) / (1024 * 1024)
print(f"  File: {size_mb:.1f} MB")

# Anteprima
if args.preview:
    preview_path = args.output.replace(".png", "_preview.png")
    valid_r = dem_resized != nodata_val_f
    dem_clean_r = dem_resized.copy()
    dem_clean_r[~valid_r] = alt_min_r
    norm = (dem_clean_r - alt_min_r) / (alt_max_r - alt_min_r + 1e-8)
    save_preview(norm, preview_path)
    print(f"  Anteprima: {preview_path}")

# ── Istruzioni UE5 ────────────────────────────────────────────────────────────
print_ue5_instructions(args.output, alt_min_r, alt_max_r, args.size)
