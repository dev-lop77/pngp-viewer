import { WEATHER_KEYS } from './weather.js';

// Saving and restoring where you are (decided with the user 2026-08-05, after the
// discussion they asked for). Three things came out of it, and they are
// deliberately three separate mechanisms rather than one:
//
//   1. AUTOSAVE. Reopen the page and you are where you left off, including the
//      time of day, the weather and walk/fly mode. No UI, one slot, localStorage -
//      which matters because the deploy is static hosting only (§9): there is no
//      backend to save to, and none is needed for ~120 bytes.
//   2. A SHAREABLE LINK. The same state in the URL hash, so a link opens that
//      exact view. This is the one that is for other people, and it is why the
//      format below stores real lat/lon rather than local scene metres: local
//      metres are relative to the bbox centre, and that bbox has already been
//      rebuilt once (the DEM mosaic, §3), which would have broken every old link.
//   3. PREFERENCES. Ambient sound on/off. Stored, but never put in a link - a
//      link that switches on a stranger's speakers is hostile. The user asked for
//      the preference to persist; this is where that distinction lives.
//
// Precedence, which has to be decided or the two fight each other on load: a
// hash BEATS the stored state, because an explicit link must always win. The hash
// is then consumed - main.js strips it - so that a later reload goes back to
// following the autosave rather than being pinned to a link forever.
//
// This module owns the format, the validation and the persistence only. Reading
// and applying the live camera/lighting/weather objects is main.js's job, because
// it owns those and the DOM controls that mirror them.

const VERSION = 1;
const STORAGE_KEY = `pngp.viewer.v${VERSION}`;

// 5 decimals of latitude is 1.1 m - finer than the terrain's own 20.5 m cells,
// and short enough for a link people paste into a message.
const COORD_DP = 5;
const MODES = ['walk', 'fly'];

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function wrapDegrees(deg) {
  return ((deg % 360) + 360) % 360;
}

function clamp(value, lo, hi) {
  return Math.min(hi, Math.max(lo, value));
}

// Everything that comes back from storage or from a URL is untrusted: a hand-
// edited link, a format from a future version, or a stored record left over from
// a half-finished write. A bad restore is worse than no restore - it would break
// the app on every single load with no visible way out - so anything that does
// not validate is dropped whole rather than patched up.
//
// Geography is deliberately NOT checked here: only main.js knows the DEM's bbox,
// and it re-seats the position on the drawn terrain anyway.
export function sanitize(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const lat = num(raw.lat);
  const lon = num(raw.lon);
  const alt = num(raw.alt);
  const heading = num(raw.heading);
  const pitch = num(raw.pitch);
  if (lat == null || lon == null || alt == null || heading == null || pitch == null) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  const time = num(raw.time);
  const state = {
    lat,
    lon,
    alt: clamp(alt, -500, 20000), // fly mode has no ceiling of its own; this is just sanity
    heading: wrapDegrees(heading),
    pitch: clamp(pitch, -90, 90),
    mode: MODES.includes(raw.mode) ? raw.mode : 'walk',
    time: time == null ? null : clamp(time, 0, 1),
    sky: WEATHER_KEYS.includes(raw.sky) ? raw.sky : null,
  };
  // A preference, not part of the view - present only in stored state.
  if (typeof raw.sound === 'boolean') state.sound = raw.sound;
  return state;
}

// Key=value rather than a positional list: this string is public and permanent,
// and a named field can be added later without shifting the meaning of the ones
// already out there in links people saved.
export function buildHash(state) {
  const clean = sanitize(state);
  if (!clean) return '';
  const parts = [
    `at=${clean.lat.toFixed(COORD_DP)},${clean.lon.toFixed(COORD_DP)},${Math.round(clean.alt)}`,
    `look=${Math.round(clean.heading)},${Math.round(clean.pitch)}`,
    `mode=${clean.mode}`,
  ];
  if (clean.time != null) parts.push(`time=${clean.time.toFixed(3)}`);
  if (clean.sky) parts.push(`sky=${clean.sky}`);
  // Note: no sound. See the header.
  return `#${parts.join('&')}`;
}

export function parseHash(hash) {
  if (!hash || typeof hash !== 'string') return null;
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const at = (params.get('at') ?? '').split(',');
  const look = (params.get('look') ?? '').split(',');
  if (at.length < 3) return null;
  return sanitize({
    lat: at[0],
    lon: at[1],
    alt: at[2],
    heading: look[0] ?? 0,
    pitch: look[1] ?? 0,
    mode: params.get('mode') ?? 'walk',
    time: params.get('time'),
    sky: params.get('sky'),
  });
}

// All storage access is wrapped: localStorage throws rather than returning null
// when it is disabled or full (Safari private browsing being the classic), and
// losing the viewer to a failed save would be absurd.
export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.v !== VERSION) return null; // a future/older format: ignore, don't guess
    const state = sanitize(parsed.state);
    if (!state) clear(); // poisoned record: get rid of it rather than failing every load
    return state;
  } catch {
    return null;
  }
}

export function save(state) {
  const clean = sanitize(state);
  if (!clean) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: VERSION, state: clean }));
    return true;
  } catch {
    return false;
  }
}

export function clear() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export { STORAGE_KEY };
