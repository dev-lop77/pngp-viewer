"""
Estrattore PNGP dal DTM Unico Valle d'Aosta (9.2 GB)
=====================================================
Legge il file ASC in streaming senza mai caricarlo in RAM,
estrae solo le righe/colonne del PNGP, e genera:
  1. heightmap_pngp_XXXX.png  → PNG 16-bit per UE5
  2. heightmap_pngp_preview.png → anteprima colorata
  3. pngp_extraction_report.txt → report con parametri UE5

Requisiti: pip install numpy pillow pyproj
RAM necessaria: ~3 GB (solo la porzione PNGP)

Uso:
    python extract_pngp_from_vda.py --input DTM0508_002_UNICO.ASC
    python extract_pngp_from_vda.py --input DTM0508_002_UNICO.ASC --size 4033
    python extract_pngp_from_vda.py --input DTM0508_002_UNICO.ASC --dry-run
"""

import argparse
import sys
import os
import time

try:
    import numpy as np
    from PIL import Image
except ImportError:
    print("ERRORE: pip install numpy pillow")
    sys.exit(1)

try:
    from pyproj import Transformer
    HAS_PYPROJ = True
except ImportError:
    HAS_PYPROJ = False

# ── Configurazione ────────────────────────────────────────────────────────────

# Bounding Box PNGP + Valgrisanche in UTM32 (ED50)
# Include: Parco Nazionale Gran Paradiso + Valgrisanche + Testa del Rutor
# Confine ovest = bordo del file DTM VdA (329116), include Testa del Rutor (E=343493)
# Confine nord allargato a 5085000 per includere testata Valgrisanche e Colle del Mont
PNGP_UTM32 = {
    "e_min": 329116,   # Ovest – bordo file, include Valgrisanche e Testa del Rutor
    "e_max": 413000,   # Est   – confine orientale PNGP
    "n_min": 5023000,  # Sud   – (clampato al bordo file 5036775 se necessario)
    "n_max": 5085000,  # Nord  – include testata Valgrisanche e Colle del Mont
}

UE5_VALID_SIZES = [127, 253, 505, 1009, 2017, 4033, 8129]

# ── Args ──────────────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser(description="Estrae area PNGP dal DTM unico VdA")
parser.add_argument("--input",   required=True,       help="DTM0508_002_UNICO.ASC")
parser.add_argument("--output",  default="heightmap_pngp_{size}.png")
parser.add_argument("--size",    type=int, default=4033,
                    help=f"Dimensione output UE5 (default: 4033)")
parser.add_argument("--dry-run", action="store_true",
                    help="Legge solo header e stima, senza estrarre")
parser.add_argument("--e-min",   type=float, help="Override E minimo UTM32")
parser.add_argument("--e-max",   type=float, help="Override E massimo UTM32")
parser.add_argument("--n-min",   type=float, help="Override N minimo UTM32")
parser.add_argument("--n-max",   type=float, help="Override N massimo UTM32")
args = parser.parse_args()

# Override bounds se specificati
if args.e_min: PNGP_UTM32["e_min"] = args.e_min
if args.e_max: PNGP_UTM32["e_max"] = args.e_max
if args.n_min: PNGP_UTM32["n_min"] = args.n_min
if args.n_max: PNGP_UTM32["n_max"] = args.n_max

if args.size not in UE5_VALID_SIZES:
    print(f"ERRORE: --size deve essere uno tra {UE5_VALID_SIZES}")
    sys.exit(1)

if not os.path.exists(args.input):
    print(f"ERRORE: file non trovato → {args.input}")
    sys.exit(1)

output_png = args.output.replace("{size}", str(args.size))

# ══════════════════════════════════════════════════════════════════════════════
print("═" * 62)
print("  Estrattore PNGP – DTM Valle d'Aosta 2m")
print("═" * 62)

# ── Step 1: Leggi header ──────────────────────────────────────────────────────
print("\n[1/4] Lettura header...")

header = {}
header_end_byte = 0

# Usa readline() invece di "for line in f" per mantenere f.tell() funzionante
with open(args.input, "r", encoding="utf-8", errors="ignore") as f:
    while True:
        pos = f.tell()
        line = f.readline()
        if not line:
            break
        stripped = line.strip()
        parts = stripped.split()
        if not parts:
            header_end_byte = f.tell()
            continue
        key = parts[0].lower()
        if key in {"ncols","nrows","xllcorner","yllcorner",
                   "xllcenter","yllcenter","cellsize","nodata_value"}:
            val = parts[1].replace(",", ".")
            header[key] = float(val)
            header_end_byte = f.tell()
        else:
            # Prima riga di dati: torna indietro all'inizio di questa riga
            try:
                float(parts[0].replace(",", "."))
                header_end_byte = pos
                break
            except ValueError:
                header_end_byte = f.tell()

# Normalizza
if "xllcenter" in header:
    cs = header["cellsize"]
    header["xllcorner"] = header["xllcenter"] - cs / 2
    header["yllcorner"] = header["yllcenter"] - cs / 2

ncols     = int(header["ncols"])
nrows     = int(header["nrows"])
cellsize  = header["cellsize"]
nodata    = header.get("nodata_value", -9999)
x_origin  = header["xllcorner"]   # UTM32 E del bordo sinistro
y_origin  = header["yllcorner"]   # UTM32 N del bordo inferiore

x_max_file = x_origin + cellsize * ncols
y_max_file = y_origin + cellsize * nrows

print(f"  Dimensione file:  {ncols:,} × {nrows:,} px")
print(f"  Cellsize:         {cellsize} m")
print(f"  Area totale:      {ncols*cellsize/1000:.1f} × {nrows*cellsize/1000:.1f} km")
print(f"  UTM32 E:          {x_origin:.0f} – {x_max_file:.0f}")
print(f"  UTM32 N:          {y_origin:.0f} – {y_max_file:.0f}")
print(f"  Header termina:   byte {header_end_byte:,}")

# Converti bounds file in WGS84
if HAS_PYPROJ:
    tr = Transformer.from_crs("EPSG:23032", "EPSG:4326", always_xy=True)
    lon_min, lat_min = tr.transform(x_origin, y_origin)
    lon_max, lat_max = tr.transform(x_max_file, y_max_file)
    print(f"  WGS84:            Lon {lon_min:.3f}°–{lon_max:.3f}°")
    print(f"                    Lat {lat_min:.3f}°–{lat_max:.3f}°")

# ── Step 2: Calcola area da estrarre ─────────────────────────────────────────
print("\n[2/4] Calcolo area PNGP...")

# Clamp bounds al file
e_min = max(PNGP_UTM32["e_min"], x_origin)
e_max = min(PNGP_UTM32["e_max"], x_max_file)
n_min = max(PNGP_UTM32["n_min"], y_origin)
n_max = min(PNGP_UTM32["n_max"], y_max_file)

# Pixel range
# ASC: riga 0 = nord, riga nrows-1 = sud
col_start = int((e_min - x_origin) / cellsize)
col_end   = int((e_max - x_origin) / cellsize)
# Righe: y_max_file - n_max dà l'offset dal nord
row_start = int((y_max_file - n_max) / cellsize)
row_end   = int((y_max_file - n_min) / cellsize)

# Clamp
col_start = max(0, col_start)
col_end   = min(ncols, col_end)
row_start = max(0, row_start)
row_end   = min(nrows, row_end)

extract_cols = col_end - col_start
extract_rows = row_end - row_start
ram_gb = extract_cols * extract_rows * 4 / 1024**3

print(f"  Area PNGP:        {e_min:.0f}–{e_max:.0f} E, {n_min:.0f}–{n_max:.0f} N")
print(f"  Dimensione:       {extract_cols:,} × {extract_rows:,} px")
print(f"  Copertura:        {extract_cols*cellsize/1000:.1f} × {extract_rows*cellsize/1000:.1f} km")
print(f"  RAM richiesta:    ~{ram_gb:.1f} GB")

if HAS_PYPROJ:
    lon_p_min, lat_p_min = tr.transform(e_min, n_min)
    lon_p_max, lat_p_max = tr.transform(e_max, n_max)
    print(f"  WGS84:            Lon {lon_p_min:.3f}°–{lon_p_max:.3f}°")
    print(f"                    Lat {lat_p_min:.3f}°–{lat_p_max:.3f}°")

if args.dry_run:
    print("\n  DRY RUN completato. Aggiungi --size e rimuovi --dry-run per estrarre.")
    print(f"\n  Comando suggerito:")
    print(f"  python {sys.argv[0]} --input {args.input} --size {args.size}")
    sys.exit(0)

if ram_gb > 12:
    print(f"\nATTENZIONE: servono ~{ram_gb:.0f} GB RAM. Considera di ridurre il bbox.")
    print("Usa --e-min, --e-max, --n-min, --n-max per restringere l'area.")
    sys.exit(1)

# ── Step 3: Estrazione streaming ──────────────────────────────────────────────
print(f"\n[3/4] Estrazione streaming (righe {row_start:,}–{row_end:,})...")
print(f"  Questo può richiedere 10–30 minuti per un file da 9.2 GB.")
print(f"  Progresso:", end="", flush=True)

dem = np.full((extract_rows, extract_cols), nodata, dtype=np.float32)

t_start = time.time()
current_row = 0
extracted_rows = 0
last_pct = -1

with open(args.input, "r", encoding="utf-8", errors="ignore", buffering=8*1024*1024) as f:
    # Salta header
    f.seek(header_end_byte)

    for line in f:
        # Salta righe vuote
        stripped = line.strip()
        if not stripped:
            continue

        # Dentro la finestra da estrarre?
        if current_row >= row_start and current_row < row_end:
            # Parsa solo la riga corrente
            values = stripped.split()
            row_arr = np.array(
                [float(v.replace(",", ".")) for v in values[col_start:col_end]],
                dtype=np.float32
            )
            # Gestisci righe più corte del previsto
            actual_len = min(len(row_arr), extract_cols)
            dem[extracted_rows, :actual_len] = row_arr[:actual_len]
            extracted_rows += 1

            # Progress ogni 5%
            pct = int(extracted_rows / extract_rows * 100)
            if pct // 5 > last_pct // 5:
                elapsed = time.time() - t_start
                if extracted_rows > 0:
                    eta = elapsed / extracted_rows * (extract_rows - extracted_rows)
                    print(f" {pct}%(ETA:{eta/60:.0f}min)", end="", flush=True)
                last_pct = pct

        current_row += 1

        # Oltre la finestra → ferma
        if current_row >= row_end:
            break

elapsed_total = time.time() - t_start
print(f"\n  Completato in {elapsed_total/60:.1f} minuti")
print(f"  Righe estratte: {extracted_rows:,} / {extract_rows:,}")

# ── Step 4: Heightmap UE5 ────────────────────────────────────────────────────
print(f"\n[4/4] Generazione heightmap UE5 ({args.size}×{args.size})...")

# Statistiche (escludi nodata)
valid = dem[dem != nodata]
alt_min = float(valid.min())
alt_max = float(valid.max())
alt_med = float(valid.mean())
coverage = len(valid) / dem.size * 100

print(f"  Quota minima:   {alt_min:.1f} m")
print(f"  Quota media:    {alt_med:.1f} m")
print(f"  Quota massima:  {alt_max:.1f} m")
print(f"  Copertura:      {coverage:.1f}%")

if alt_max > 4000:
    print(f"  ★ Vetta Gran Paradiso (4061m) inclusa!")

# Riempi nodata con minimo
dem_clean = dem.copy()
dem_clean[dem == nodata] = alt_min

# Ridimensiona
print(f"  Ridimensionamento a {args.size}×{args.size}...")
pil = Image.fromarray(dem_clean).resize((args.size, args.size), Image.BILINEAR)
dem_r = np.array(pil, dtype=np.float32)

# Normalizza 16-bit
dem_norm = (dem_r - alt_min) / (alt_max - alt_min)
dem_16   = (dem_norm * 65535).astype(np.uint16)

# Salva heightmap
print(f"  Salvataggio: {output_png}")
Image.fromarray(dem_16, mode="I;16").save(output_png)
size_mb = os.path.getsize(output_png) / (1024**2)
print(f"  Dimensione: {size_mb:.1f} MB")

# Anteprima colorata
preview_path = output_png.replace(".png", "_preview.png")
n = dem_norm
snow  = n > 0.78
rock  = (n > 0.55) & ~snow
alp   = (n > 0.35) & ~rock & ~snow
sub   = (n > 0.18) & ~alp & ~rock & ~snow
mont  = ~sub & ~alp & ~rock & ~snow

r_ch = np.where(snow, 240, np.where(rock, 140, np.where(alp, 100, np.where(sub, 60, 40)))).astype(np.uint8)
g_ch = np.where(snow, 248, np.where(rock, 120, np.where(alp, 160, np.where(sub, 130, 90)))).astype(np.uint8)
b_ch = np.where(snow, 255, np.where(rock, 100, np.where(alp, 60,  np.where(sub, 50,  30)))).astype(np.uint8)

Image.fromarray(np.stack([r_ch, g_ch, b_ch], axis=-1), "RGB").save(preview_path)
print(f"  Anteprima:  {preview_path}")

# ── Report UE5 ────────────────────────────────────────────────────────────────
dislivello = alt_max - alt_min
scale_z    = round(dislivello / 512 * 100)
loc_z_cm   = int(alt_min * 100)

report = f"""PNGP DTM Extraction Report
==========================
Data sorgente : {args.input}
Risoluzione   : {cellsize}m/px
Area estratta : {extract_cols*cellsize/1000:.1f} × {extract_rows*cellsize/1000:.1f} km
                E {e_min:.0f}–{e_max:.0f}, N {n_min:.0f}–{n_max:.0f} (UTM32)

ALTIMETRIA
----------
Quota minima  : {alt_min:.1f} m
Quota media   : {alt_med:.1f} m
Quota massima : {alt_max:.1f} m
Dislivello    : {dislivello:.0f} m
Gran Paradiso : {"INCLUSO ★" if alt_max > 4000 else f"max {alt_max:.0f}m (espandi bbox)"}

FILE OUTPUT
-----------
Heightmap PNG : {os.path.abspath(output_png)}
Dimensione    : {args.size} × {args.size} px
File size     : {size_mb:.1f} MB

IMPOSTAZIONI UE5 LANDSCAPE
----------------------------
Section Size           : 63 quads
Sections/Component     : 2×2
Heightmap File         : {os.path.abspath(output_png)}

Scale X/Y              : 200
  (1 pixel = {cellsize}m reali; con resize {args.size}px su {extract_cols}px
   la risoluzione effettiva = {extract_cols*cellsize/args.size:.1f} m/px)

Scale Z                : {scale_z}
  (calibrato su range altimetrico {alt_min:.0f}–{alt_max:.0f}m = {dislivello:.0f}m)

Location Z             : {loc_z_cm}
  (quota minima in cm, UE5 usa centimetri)

LANDSCAPE MATERIAL – Layer per altitudine
------------------------------------------
Fascia montana     (foresta larici/abeti) :  800 – 1600m
  WorldHeight < {(1600-alt_min)/(alt_max-alt_min)*65535:.0f}  (valore heightmap)

Fascia subalpina   (rododendri/mirtilli)  : 1600 – 2200m
  WorldHeight {(1600-alt_min)/(alt_max-alt_min)*65535:.0f} – {(2200-alt_min)/(alt_max-alt_min)*65535:.0f}

Fascia alpina      (prato alpino)         : 2200 – 3000m
  WorldHeight {(2200-alt_min)/(alt_max-alt_min)*65535:.0f} – {(3000-alt_min)/(alt_max-alt_min)*65535:.0f}

Fascia rocciosa                           : 3000 – 3800m
  WorldHeight {(3000-alt_min)/(alt_max-alt_min)*65535:.0f} – {(3800-alt_min)/(alt_max-alt_min)*65535:.0f}

Fascia nivale      (ghiacciai/neve)       : > 3800m
  WorldHeight > {(3800-alt_min)/(alt_max-alt_min)*65535:.0f}

WORLD PARTITION (Open World template)
---------------------------------------
Suggerimento: usa 4 streaming layers
  Layer 0 (sempre caricato): area 2×2 km intorno al player
  Layer 1: raggio 4 km
  Layer 2: raggio 8 km
  Layer 3: raggio 16 km
"""

report_path = "pngp_extraction_report.txt"
with open(report_path, "w") as f:
    f.write(report)
print(f"  Report:     {report_path}")

print(report)
