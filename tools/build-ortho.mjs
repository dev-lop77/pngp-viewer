#!/usr/bin/env node
// Build the orthophoto mosaic: fetch 1:5.000 sheets from the Valle d'Aosta SCT download
// service, resample each to the shipping resolution, and DELETE the source before fetching
// the next one.
//
// The delete is not tidiness, it is the only way this runs at all: the 129 sheets that cover
// the park's VdA side are 42.7 GB of zips and this machine has 35 GB free
// (tools/dev/probe-ortho-coverage.mjs). One sheet at a time peaks at about 860 MB.
//
// WHERE THE SHEETS COME FROM, both endpoints public and neither needing a token:
//   code:  the QDU WMS, GetFeatureInfo on Quadri_dUnione__Ortofoto_2012_scala_5000 - the 2012
//          index, because the 2024 flight has none published yet and the 1:5.000 cut is the
//          same one. Verified sheet by sheet against the 2024 zip's own HTTP status.
//   file:  geoprodotti.regione.vda.it/download/ORTO2024_ED50_005/ORTO2024_ED50_005_<code>.zip
//
// EVERY LEVEL IS RESAMPLED FROM THE 20 cm ORIGINAL, never from a coarser level, so no output
// carries another output's blur.
//
// Licence: CC BY 4.0, "Ortofoto 2024 (c) Regione Autonoma Valle d'Aosta". The PDF travels
// inside each sheet's own zip and is copied out once, to public/data/.
//
// Usage:
//   node tools/build-ortho.mjs --at=45.52746,7.20238 --rings=1        # a 3x3 block
//   node tools/build-ortho.mjs --sheets=tools/dev/logs/ortho-sheets.json   # the whole list
//   node tools/build-ortho.mjs --at=... --rings=1 --res=2 --quality=75

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync, statSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import proj4 from 'proj4';

proj4.defs('EPSG:23032', '+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs');

const flags = new Map(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
  const body = a.slice(2);
  const eq = body.indexOf('=');
  return eq === -1 ? [body, 'true'] : [body.slice(0, eq), body.slice(eq + 1)];
}));
const RES = Number(flags.get('res') ?? 2);
const QUALITY = Number(flags.get('quality') ?? 75);
const WORK = 'tools/ortho-source';
const OUT = 'public/data/ortho';

// THE SHEETS ARE 2,040 m WIDE AND 2,000 m APART. They overlap by 20 m on every side, which
// is ordinary in an orthophoto delivery and was not ordinary in my first assumption: taking
// the spacing to be the width put several sheets in the same cell and the atlas found four
// of nine. Both numbers are measured from the rasters' own corners - nine sheets' xmin came
// back 355980.3, 357980.3, 359980.3, exactly 2,000 apart, each raster 10,200 px at 20 cm.
//
// So STEP_M indexes the grid and SHEET_M is how much ground a file covers. The overlap is not
// a problem to solve: the two copies of those 20 m are the same ground, so drawing sheets at
// STEP_M spacing and letting them overlap by 20 m is correct without any blending.
const STEP_M = 2000;
const SHEET_M = 2040;
const GRID_E = 357980.311943102395162;
const GRID_N = 5044019.371613291092217;
// TWO DIFFERENT QUESTIONS, and answering them with one function is a bug I wrote once already.
// cellOf indexes a SHEET by its upper-left corner, where the offset is an exact multiple of
// STEP_M. cellAtPoint asks which sheet a POINT is most inside, which is measured from sheet
// CENTRES - and the two differ by half a sheet, enough to put Le Pont in the sheet next door
// and build the whole block 2 km east of the camera.
const cellOf = (e, n) => [Math.round((e - GRID_E) / STEP_M), Math.round((GRID_N - n) / STEP_M)];
const cellAtPoint = (e, n) => [
  Math.round((e - GRID_E - SHEET_M / 2) / STEP_M),
  Math.round((GRID_N - SHEET_M / 2 - n) / STEP_M),
];
const cellUL = (ci, cj) => [GRID_E + ci * STEP_M, GRID_N - cj * STEP_M];

const QDU = 'https://servizisct.regione.vda.it/ows/public/QDU';
const LAYER = 'Quadri_dUnione__Ortofoto_2012_scala_5000';
const zipUrl = (t) => `https://geoprodotti.regione.vda.it/download/ORTO2024_ED50_005/ORTO2024_ED50_005_${t}.zip`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tavolaAt(e, n) {
  const b = [e - 250, n - 250, e + 250, n + 250].join(',');
  const url = `${QDU}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&LAYERS=${LAYER}`
    + `&QUERY_LAYERS=${LAYER}&SRS=EPSG:23032&BBOX=${b}&WIDTH=101&HEIGHT=101&X=50&Y=50`
    + '&INFO_FORMAT=text/plain&FEATURE_COUNT=1';
  const text = await fetch(url).then((r) => (r.ok ? r.text() : '')).catch(() => '');
  return text.match(/tavola = '(\d+)'/)?.[1] ?? null;
}

// Which sheets to build.
let wanted = [];
if (flags.has('sheets')) {
  const list = JSON.parse(readFileSync(flags.get('sheets'), 'utf8'));
  wanted = list.sheets.map((s) => s.tavola);
} else {
  const [lat, lon] = (flags.get('at') ?? '45.52746,7.20238').split(',').map(Number);
  const rings = Number(flags.get('rings') ?? 1);
  const [e, n] = proj4('WGS84', 'EPSG:23032', [lon, lat]);
  const [ci0, cj0] = cellAtPoint(e, n);
  for (let dj = -rings; dj <= rings; dj++) {
    for (let di = -rings; di <= rings; di++) {
      const [ue, un] = cellUL(ci0 + di, cj0 + dj);
      const t = await tavolaAt(ue + SHEET_M / 2, un - SHEET_M / 2); // the cell's own centre
      if (t) wanted.push(t);
      else console.log(`  cell ${ci0 + di},${cj0 + dj}: no sheet (outside Valle d'Aosta)`);
      await sleep(120);
    }
  }
}
wanted = [...new Set(wanted)];
console.log(`${wanted.length} sheet(s) to build at ${RES} m/px, WebP q${QUALITY}\n`);

mkdirSync(WORK, { recursive: true });
mkdirSync(OUT, { recursive: true });

const built = [];
let fetched = 0;
for (const t of wanted) {
  const zip = `${WORK}/ORTO2024_ED50_005_${t}.zip`;
  const tif = `${WORK}/ORTO2024_ED50_005_${t}.TIF`;
  const tfw = `${WORK}/ORTO2024_ED50_005_${t}.TFW`;
  const outTif = `${WORK}/o-${t}-${RES}m.tif`;
  const stamp = `${OUT}/.done-${t}-${RES}`;
  if (existsSync(stamp)) {
    built.push(JSON.parse(readFileSync(stamp, 'utf8')));
    console.log(`${t}: already built`);
    continue;
  }
  // Fetch, unless a previous run left the TIF behind.
  if (!existsSync(tif)) {
    process.stdout.write(`${t}: fetching... `);
    const res = await fetch(zipUrl(t));
    if (!res.ok) { console.log(`HTTP ${res.status} - skipped`); continue; }
    writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
    fetched += statSync(zip).size;
    process.stdout.write(`${(statSync(zip).size / 1e6).toFixed(0)} MB, unzipping... `);
    execFileSync('unzip', ['-o', '-q', zip, '-d', WORK]);
    // The licence travels inside every zip; keep exactly one copy beside the data it covers.
    const pdf = `${WORK}/CC_BY_Ortofoto_2024.pdf`;
    if (existsSync(pdf) && !existsSync(`${OUT}/CC_BY_Ortofoto_2024.pdf`)) copyFileSync(pdf, `${OUT}/CC_BY_Ortofoto_2024.pdf`);
    rmSync(zip); // 400 MB back before the next one
  } else {
    process.stdout.write(`${t}: source already here, `);
  }

  // The world rectangle, read from the raster rather than computed from the grid - a sheet
  // that is not where the grid says it is has to fail loudly, not be drawn 2 km away.
  const info = JSON.parse(execFileSync('gdalinfo', ['-json', tif], { maxBuffer: 1 << 28 }).toString());
  const [ulE, ulN] = info.cornerCoordinates.upperLeft;
  const [lrE, lrN] = info.cornerCoordinates.lowerRight;

  execFileSync('gdal_translate', ['-q', '-b', '1', '-b', '2', '-b', '3',
    '-tr', String(RES), String(RES), '-r', 'average',
    '-co', 'COMPRESS=DEFLATE', '-co', 'TILED=YES', tif, outTif]);
  const px = JSON.parse(execFileSync('gdalinfo', ['-json', outTif]).toString()).size;
  const tmpWebp = `${WORK}/o-${t}-${RES}m.webp`;
  execFileSync('gdal_translate', ['-q', '-of', 'WEBP', '-co', `QUALITY=${QUALITY}`, outTif, tmpWebp]);
  const bytes = readFileSync(tmpWebp);
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 8);
  const name = `o${t}-${String(RES).replace('.', '')}.${hash}.webp`;
  writeFileSync(`${OUT}/${name}`, bytes);
  rmSync(tif); rmSync(tfw, { force: true }); rmSync(outTif); rmSync(tmpWebp);

  const record = {
    tavola: t,
    bboxCrsUnits: { xmin: ulE, ymin: lrN, xmax: lrE, ymax: ulN },
    dimensions: { width: px[0], height: px[1] },
    file: { name, bytes: bytes.length, sha256Prefix: hash },
  };
  writeFileSync(stamp, JSON.stringify(record));
  built.push(record);
  console.log(`-> ${name} (${(bytes.length / 1e3).toFixed(0)} kB)`);
}

// The manifest. Sheets are a GRID, so the viewer needs the grid's own geometry to know which
// file covers where without reading 129 rectangles every frame.
const manifest = {
  schemaVersion: 3,
  purpose: 'OPTIONAL high-resolution ground photograph, a grid of 1:5.000 sheets drawn only near'
    + ' the camera. Not part of the first load: nothing fetches any of it until the viewer asks.',
  crs: 'EPSG:23032',
  note: 'Same CRS as heightfield.json, because the source is published in it - so there is no'
    + ' reprojection anywhere in this path and none of the 215 m ED50/WGS84 datum shift.',
  grid: {
    originE: GRID_E, originN: GRID_N, stepM: STEP_M, sheetM: SHEET_M,
    note: 'sheet (i, j) has its upper-left corner at E = originE + i*stepM, N = originN - j*stepM,'
      + ' and covers sheetM metres each way - so neighbours OVERLAP by sheetM - stepM = 40 m,'
      + ' 20 m a side. The overlap is the same ground twice and needs no blending.',
  },
  resolutionMPerPx: { x: RES, y: RES },
  // The cell comes from the sheet's OWN corner, rounded onto the grid - so the source's
  // sub-metre georeferencing jitter (the nine sheets' ymax vary by 0.1 m) cannot move a
  // sheet a whole cell. Asserted below rather than trusted.
  sheets: built.map((b) => ({ ...b, cell: cellOf(b.bboxCrsUnits.xmin, b.bboxCrsUnits.ymax) })),
  source: {
    name: "Regione Autonoma Valle d'Aosta - Ortofoto 2024",
    attribution: "Ortofoto 2024 (c) Regione Autonoma Valle d'Aosta",
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    licenseFile: 'data/ortho/CC_BY_Ortofoto_2024.pdf',
    sheetSpec: '1:5.000 elements, 2.04 x 2.04 km, GSD 20 cm, RGBI, Leica DMC4, flown 21/08-02/11/2024',
    modifications: `Derived product: resampled from the 20 cm original to ${RES} m by averaging,`
      + ` alpha band dropped, encoded WebP q${QUALITY}.`,
  },
  generatedBy: 'tools/build-ortho.mjs',
};
// Every sheet must sit on the grid to within a metre. If the assumption above is ever wrong
// again, this is where it stops - not in a shader that draws the ground 2 km from where it is.
for (const sh of manifest.sheets) {
  const [i, j] = sh.cell;
  const dE = Math.abs(sh.bboxCrsUnits.xmin - (GRID_E + i * STEP_M));
  const dN = Math.abs(sh.bboxCrsUnits.ymax - (GRID_N - j * STEP_M));
  if (dE > 1 || dN > 1) {
    throw new Error(`sheet ${sh.tavola} is ${dE.toFixed(1)} m E and ${dN.toFixed(1)} m N off the`
      + ` ${STEP_M} m grid - the grid assumption is wrong, not the sheet`);
  }
}
writeFileSync('public/data/ortho.json', `${JSON.stringify(manifest, null, 2)}\n`);
// PRUNE what the manifest no longer names. Everything in public/ is copied into dist/ and
// published, so an orphan from an earlier run is not just clutter on this disk - it is a file
// on the site that nothing fetches. Three of them survived a grid fix here; at 129 sheets a
// habit of leaving them would be a habit of publishing megabytes of nothing.
{
  const keep = new Set(built.map((b) => b.file.name));
  keep.add('CC_BY_Ortofoto_2024.pdf');
  let pruned = 0;
  for (const f of readdirSync(OUT)) {
    if (f.startsWith('.done-') || keep.has(f)) continue;
    rmSync(`${OUT}/${f}`);
    pruned += 1;
  }
  if (pruned) console.log(`pruned ${pruned} file(s) the manifest no longer names`);
}
const shipped = built.reduce((a, b) => a + b.file.bytes, 0);
console.log(`\n${built.length} sheets, ${(shipped / 1e6).toFixed(2)} MB shipped`
  + `, ${(fetched / 1e9).toFixed(1)} GB fetched and deleted`);
console.log('manifest -> public/data/ortho.json');
