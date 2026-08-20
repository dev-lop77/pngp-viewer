#!/usr/bin/env node
// Can the ground be re-skinned with STREAMED high-resolution orthophoto tiles, near the
// avatar only, with nothing added to the download? (The user's topic, 2026-08-20:
// "il caricamento, opzionale e solo sul terreno a breve distanza dall'avatar, dei til da
// sovrapporre al terreno gia' caricato ... vanno prese in streaming".)
//
// This answers the four questions that decide it, and it answers them by asking the real
// services rather than by reading their documentation:
//
//   1. Does a service exist that covers this park, and does it send CORS? Without
//      Access-Control-Allow-Origin a cross-origin image loads but CANNOT become a WebGL
//      texture - the canvas is tainted and the upload throws. That single header is the
//      whole feasibility question, and it is not in any of the documentation.
//   2. Does it cover BOTH halves of the park? Gran Paradiso straddles Valle d'Aosta and
//      Piemonte, which is already why the DEM resolution is asymmetric (§3), and a regional
//      service stops at the regional border - as a blank tile, not as a 404.
//   3. What does the projection cost? This project is EPSG:23032 (ED50), every tile service
//      is WGS84 or Web Mercator, and the two datums are 215 m apart here.
//   4. What does a ring around the avatar cost in requests, megabytes and video memory?
//
// Usage: node tools/dev/probe-orthophoto.mjs [--no-net]

import proj4 from 'proj4';

const net = !process.argv.includes('--no-net');
const ORIGIN = 'https://dev-lop77.github.io'; // the published site, so CORS is asked the real question

proj4.defs('EPSG:23032', '+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs');
proj4.defs('EPSG:32632', '+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs');

// public/data/heightfield.json's localOrigin - the bbox centre.
const originE = 371058;
const originN = 5056000;
const to = (crs, x, z) => proj4('EPSG:23032', crs, [x + originE, originN - z]);

// Two points well inside the park, one on each side of the regional border.
const VDA = { name: 'VdA (Cogne)', lat: 45.6080, lon: 7.3560 };
const PIEMONTE = { name: 'Piemonte (Orco)', lat: 45.4300, lon: 7.2400 };

async function head(url) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { headers: { Origin: ORIGIN } });
    const buf = Buffer.from(await r.arrayBuffer());
    return {
      status: r.status,
      cors: r.headers.get('access-control-allow-origin') ?? 'NONE',
      type: r.headers.get('content-type') ?? '?',
      bytes: buf.length,
      ms: Date.now() - t0,
    };
  } catch (e) {
    return { status: 'ERR', cors: '-', type: String(e.message).slice(0, 40), bytes: 0, ms: Date.now() - t0 };
  }
}

// --- 1 and 2: the services -------------------------------------------------------------
// Ortofoto AGEA 2024, Regione Piemonte, served by a MapProxy at CSI Piemonte. WMTS grid
// grid_32632_19: 256 px tiles, 19 levels, level 18 is 0.322 m/px.
const AGEA = 'https://opengis.csi.it/mp/regp_agea_2024/wmts/regp_agea_2024/grid_32632_19';
function ageaTile(lat, lon, z) {
  // The grid's own origin, read from its WMTSCapabilities: level 0 is one 256 px tile of
  // 84,328 m/px, so the resolution halves each level from there.
  const res = 84328.169 / 2 ** z;
  const [E, N] = proj4('WGS84', 'EPSG:32632', [lon, lat]);
  const TL = [-10198294.6545, 15991090.6634]; // TopLeftCorner of grid_32632_19, from its capabilities
  return `${AGEA}/${z}/${Math.floor((E - TL[0]) / (res * 256))}/${Math.floor((TL[1] - N) / (res * 256))}.png`;
}
// Esri World Imagery, Web Mercator XYZ - the only source found that covers both halves.
function esriTile(lat, lon, z) {
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * n);
  return `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
}

if (net) {
  console.log('=== services, asked from the published origin ===');
  console.log('service            where              status  CORS  bytes    ms   verdict');
  for (const [label, url, where] of [
    ['AGEA 2024 z18', ageaTile(PIEMONTE.lat, PIEMONTE.lon, 18), PIEMONTE.name],
    ['AGEA 2024 z18', ageaTile(VDA.lat, VDA.lon, 18), VDA.name],
    ['Esri World z18', esriTile(PIEMONTE.lat, PIEMONTE.lon, 18), PIEMONTE.name],
    ['Esri World z18', esriTile(VDA.lat, VDA.lon, 18), VDA.name],
  ]) {
    const r = await head(url);
    // A regional service answers 200 with a ~850-byte blank PNG outside its region, which is
    // the trap: the status code says yes and the picture is empty.
    const verdict = r.status !== 200 ? 'FAILED' : r.bytes < 2000 ? 'BLANK - outside coverage' : 'real imagery';
    console.log(`${label.padEnd(18)} ${where.padEnd(18)} ${String(r.status).padEnd(7)} ${r.cors.padEnd(5)} ${String(r.bytes).padStart(7)} ${String(r.ms).padStart(5)}  ${verdict}`);
  }
  console.log();
}

// --- 3: the projection -----------------------------------------------------------------
console.log('=== projection ===');
const shift = (() => {
  const a = to('EPSG:32632', -1000, 0);
  return Math.hypot(a[0] - (originE - 1000), a[1] - originN);
})();
console.log(`ED50 (this project) against WGS84 (every tile service): ${shift.toFixed(1)} m apart in the park.`);
console.log('Same UTM zone number, different datum - so the two look interchangeable and are not.\n');
console.log('Is the mapping affine? (fit from three corners, worst error over an 9x9 grid)');
for (const side of [82, 1000, 4000]) {
  for (const crs of ['EPSG:32632', 'EPSG:3857']) {
    const x0 = -1000;
    const z0 = 0;
    const p00 = to(crs, x0, z0);
    const p10 = to(crs, x0 + side, z0);
    const p01 = to(crs, x0, z0 + side);
    const ax = [(p10[0] - p00[0]) / side, (p01[0] - p00[0]) / side, p00[0]];
    const ay = [(p10[1] - p00[1]) / side, (p01[1] - p00[1]) / side, p00[1]];
    let worst = 0;
    for (let i = 0; i <= 8; i++) {
      for (let j = 0; j <= 8; j++) {
        const dx = (i / 8) * side;
        const dz = (j / 8) * side;
        const exact = to(crs, x0 + dx, z0 + dz);
        worst = Math.max(worst, Math.hypot(exact[0] - (ax[0] * dx + ax[1] * dz + ax[2]),
                                           exact[1] - (ay[0] * dx + ay[1] * dz + ay[2])));
      }
    }
    console.log(`  ${String(side).padStart(5)} m patch, ${crs}: ${(worst * 100).toFixed(2)} cm`);
  }
}
console.log('  -> UTM32/WGS84 is EXACTLY affine against UTM32/ED50 at every scale that matters,');
console.log('     so one constant transform maps those tiles onto this terrain. Web Mercator is not.\n');

// --- 4: the budget ---------------------------------------------------------------------
console.log('=== what a ring around the avatar costs (256 px tiles) ===');
console.log('radius   m/px   tiles  download  VRAM as RGBA');
const bytesAt = { 0.322: 48000, 0.643: 40000, 1.287: 35000, 2.573: 30000 };
for (const radius of [250, 500, 1000, 2000]) {
  for (const res of [0.322, 0.643, 1.287, 2.573]) {
    const across = Math.ceil((2 * radius) / (res * 256)) + 1;
    const n = across * across;
    console.log(`${String(radius).padStart(5)} m  ${res.toFixed(3)}  ${String(n).padStart(6)}  ${((n * bytesAt[res]) / 1e6).toFixed(1).padStart(6)} MB  ${((n * 256 * 256 * 4) / 1e6).toFixed(0).padStart(6)} MB`);
  }
}
console.log('\n=== the same as ONE moving atlas centred on the avatar ===');
console.log('atlas   m/px   covers    VRAM    tiles to fill');
for (const px of [1024, 2048, 4096]) {
  for (const res of [0.322, 0.643, 1.287]) {
    console.log(`${String(px).padStart(5)}  ${res.toFixed(3)}  ${((px * res) / 1000).toFixed(2)} km  ${((px * px * 4) / 1e6).toFixed(0).padStart(5)} MB  ${(px / 256) ** 2}`);
  }
}
