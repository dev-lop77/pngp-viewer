// One retrying Overpass request, shared by every fetcher in tools/.
//
// Written on 2026-08-18 after the public endpoint refused three different
// queries in one afternoon - a 429 for asking for lakes, rivers, glaciers and
// 3,285 stream geometries at once, and twice a 504 "the server is probably too
// busy" for queries that had worked minutes earlier. None of that is a bug in
// the query, and losing a whole draft to it (and then a rebuilt data file to the
// missing draft) is a worse failure than waiting half a minute.
//
// It deliberately does NOT hide the failure: after the last attempt it throws
// with the status and the start of the body, because a draft silently missing a
// category would be far harder to notice than a build that stops.
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// `out` is the caller's, not this file's default-by-accident: fetch-osm.mjs
// needs `out center` (a hut mapped as a building way, a lake as an area - it
// wants one representative point each), while the line layers need `out geom`.
// Getting this wrong is silent: `out geom` gives a way no `center`, so every
// way would be skipped for want of coordinates.
export async function overpass(ql, { what = 'query', timeoutS = 180, userAgent = 'pngp-viewer/0.1', attempts = 4, out = 'geom' } = {}) {
  const clauses = Array.isArray(ql) ? ql : [ql];
  const query = `[out:json][timeout:${timeoutS}];\n(\n  ${clauses.join('\n  ')}\n);\nout ${out};`;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'User-Agent': userAgent,
      },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (response.ok) {
      const { elements } = await response.json();
      console.log(`  ${what}: ${elements.length} elements.`);
      return elements;
    }
    const body = await response.text();
    if (attempt === attempts) {
      throw new Error(`Overpass request failed for ${what}: ${response.status} ${body.slice(0, 200)}`);
    }
    const waitS = attempt * 30;
    console.log(`  ${what}: ${response.status}, waiting ${waitS}s and retrying (${attempt}/${attempts - 1})...`);
    await new Promise((resolve) => setTimeout(resolve, waitS * 1000));
  }
  return [];
}
