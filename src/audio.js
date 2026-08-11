import * as THREE from 'three';
import { snowCoverAt } from './snow.js';

// Ambient audio - the last piece of phase 6 (docs/ARCHITECTURE.md §7).
//
// Entirely procedural: filtered noise plus a couple of oscillators, no audio
// files at all. Two reasons that is the right answer here and not just a clever
// one:
//   - licensing. Every dataset in this project had its licence read before it
//     shipped (§9, and the DTM licences that blocked the deploy for days). A
//     field recording would be one more of those, for a much smaller payoff.
//   - size. The published site is ~21 MB (docs/PROGRESS.md 2026-08-03) and the
//     bundle is already an open phase-7 item. Ambience loops long enough not to
//     read as loops would be megabytes each; this is one file and zero bytes of
//     asset.
//
// The design principle is the same one the visuals follow: every gain here is
// driven by something real in the scene, not by a timer. What you hear is
// altitude, exposure, canopy, the weather mode, and how far away the nearest
// water is - so the soundscape changes because you walked somewhere, which is
// the only way ambience stops sounding like a loop.
//
//   layer      what it is                        driven by
//   ---------- --------------------------------- --------------------------------
//   windLow    the body of the wind              altitude, ridge exposure, rain
//   windHigh   its hiss over rock and grass      the same, plus fly-mode airspeed
//   rustle     leaves and needles                canopy x wind
//   waterLow   the roar/body of moving water     distance to lake/river/waterfall
//   waterHigh  its splash and hiss               the same, but absorbed faster
//   rain       precipitation                     weather.mod.rain
//   (calls)    marmot and chamois alarm whistles wildlife.js's onAlarm events
//
// Cost: the mixing is entirely native nodes on the browser's audio thread. Our
// main-thread work is one tick at UPDATE_HZ - a canopy lookup, five height
// samples and a 3x3 spatial-hash query - which is why this can be driven from
// the render loop without touching the frame budget (§10).
//
// Autoplay policy: a context may only start from a user gesture, so nothing is
// created until start() is called. main.js calls it from the click that grabs
// pointer lock, which is already the first thing anyone does.

const MASTER_GAIN = 0.35;
const UPDATE_HZ = 8; // the scene cannot change audibly faster than this
const NOISE_S = 6;
// Time constant for every driven parameter. Long enough that walking past a
// stream is a fade rather than a step, short enough not to lag behind the view.
const PARAM_TAU = 0.25;
const MUTE_TAU = 0.08;

// How far each kind of water carries, and how its energy splits between the two
// water layers. An Alpine torrent really is audible a couple of hundred metres
// off, and a 78 m waterfall (Entrelor) from much further; a small tarn is nearly
// silent from anywhere you can stand.
const WATER_KINDS = {
  waterfall: { radiusM: 600, gain: 0.85, low: 1.0, high: 0.9 },
  river: { radiusM: 250, gain: 0.6, low: 0.45, high: 0.75 },
  lake: { radiusM: 110, gain: 0.22, low: 0.55, high: 0.3 },
};
// Cell size for the earshot index. Must be >= the largest radius above, so a
// query only ever has to look at the 3x3 neighbourhood around the camera.
const EARSHOT_CELL_M = 640;
// Water geometry is resampled to this spacing before indexing. Rivers arrive
// from OSM with a median vertex gap of 19 m but a maximum of 242 m (measured),
// so nearest-*vertex* would report a stream 120 m away while you stand on its
// bank. Resampling along the line fixes that for the cost of ~7k points total.
const WATER_STEP_M = 40;

// Alarm calls. A marmot's whistle is the sound of these meadows - one piercing
// note, and every marmot in sight drops into its burrow. Chamois give a shorter,
// lower version of the same thing. Ibex, foxes and squirrels stay silent: an ibex
// snorts too quietly to carry, and a curious fox approaching in silence is the
// point of it (src/wildlife.js).
// A marmot facing a walker gives a SERIES of whistles, not one note - the single
// sharp whistle is its aerial-predator alarm - and the user asked for exactly
// that after hearing the first version (2026-08-05): "può essere anche un po' più
// lungo e ripetuto più volte (random)". Volume and pitch they approved, so those
// are unchanged.
const CALLS = {
  marmot: {
    // 0.3 s against the 0.16 s the user heard first, of which ~0.21 s is the
    // sustained part - a real marmot whistle runs 0.1-0.3 s, so this is at the
    // long end of honest rather than past it.
    f0: 3500, f1: 2750, durS: 0.3, gain: 0.5, bandQ: 5, earshotM: 240,
    notesMin: 2, notesMax: 5, gapS: [0.45, 0.85],
  },
  chamois: {
    // Kept shorter and sharper than the marmot, which is what a chamois sounds
    // like - one or two notes rather than a colony's chorus.
    f0: 2200, f1: 1900, durS: 0.14, gain: 0.3, bandQ: 7, earshotM: 180,
    notesMin: 1, notesMax: 3, gapS: [0.5, 0.9],
  },
  // Birds (2026-08-05, src/birds.js). Note the raptors are absent on purpose: a
  // golden eagle is very nearly silent, and the screaming eagle is the single most
  // common mistake made about this bird - the sound in everyone's head is a
  // red-tailed hawk. Silence is the accurate choice here, not a missing feature.
  //
  // An alpine chough is the sound of a high col: a rippling, slightly descending
  // whistle, and never once - a flock answers itself, which is what the short gaps
  // and the note count are for. Audible a long way, because a flock is loud.
  chough: {
    f0: 2600, f1: 1850, durS: 0.2, gain: 0.32, bandQ: 4, earshotM: 380,
    notesMin: 2, notesMax: 4, gapS: [0.22, 0.5],
  },
  // A nutcracker does not whistle at all: it is a dry, harsh rattle. A sawtooth
  // through a wide filter with its amplitude chopped at 30 Hz is what "harsh"
  // actually is - a pure tone cannot be made to sound like this by choosing a
  // frequency.
  nutcracker: {
    // Louder than a chamois and not far off a marmot: a nutcracker is a genuinely
    // noisy bird and its rattle carries across a whole stand of pines.
    f0: 950, f1: 780, durS: 0.34, gain: 0.38, bandQ: 1.6, earshotM: 240,
    notesMin: 1, notesMax: 3, gapS: [0.3, 0.62], wave: 'sawtooth', rattleHz: 30,
  },
};
const CALL_ATTACK_S = 0.012; // near-instant, which is what makes a whistle carry
// One animal taking fright usually means several: without a floor the whole herd
// would call on the same frame and read as a chord rather than an alarm.
const CALL_MIN_GAP_S = 0.35;

// ---------------------------------------------------------------------------
// Songbirds - ambient animal sound (2026-08-07, the user's topic)
// ---------------------------------------------------------------------------
//
// Everything above is EVENT-driven: something happens, something calls. What was
// missing is the idle noise a place makes because animals live in it - and the
// shape of the answer was the real decision, so it is worth writing down.
//
// The honest ambient animal sound of these mountains is BIRDSONG, not more
// mammal voices. A marmot's whistle IS its alarm; it has no resting call. Ibex
// and chamois are near-silent by nature and a fox barks in January, at night.
// Giving any of them an idle voice would be inventing biology, which is the
// mistake birds.js deliberately avoided with the screaming eagle. What was
// genuinely missing is that a wood at 1,600 m sounded like leaves and nothing
// alive.
//
// A singer is a position, a species and a clock. It has NO visual counterpart
// and no simulation state, which is why it lives in this file rather than in a
// module of its own like wildlife.js and birds.js: nothing here is stepped at
// all while the sound is off. Placement is the same deterministic hash lattice
// as wildlife.js's herds, and for the same reason - the bird that answers from
// the same tree each time is what makes somewhere read as inhabited, whereas a
// call arriving from a fresh random bearing reads as a sound effect.
//
// Density is the user's call: "discreto - si nota se ascolti". The numbers below
// are set for a few songs a minute in good habitat, measured rather than
// intended (tools/test-audio.mjs reports songs/minute per habitat).

// A phrase is a SHAPE, not a repeated note - the difference between a cuckoo and
// a chaffinch is which pitches follow which. Each entry is
// [pitch multiplier, note length in seconds, seconds to the NEXT note's start].
// The multiplier scales the species' own f0->f1 sweep, so every note keeps its
// character and only its pitch moves. The LAST entry's third number is how long
// the phrase runs on past that note before a repeat may follow, so it is
// normally just that note's own length.
function run(n, hiMul, loMul, durS, gapFirst, gapLast) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 0;
    out.push([hiMul + (loMul - hiMul) * t, durS, gapFirst + (gapLast - gapFirst) * t]);
  }
  return out;
}

const SONGBIRDS = [
  {
    name: 'chaffinch',
    salt: 0x5a1,
    // Montane and subalpine woodland. By a distance the commonest song in an
    // Alpine forest, so it is the one that has to be right.
    habitat: { elevMin: 700, elevMax: 2100, canopyMin: 0.22 },
    cellM: 140,
    presence: 0.42,
    earshotM: 200,
    everyS: [26, 58],
    gain: 0.19,
    voice: { f0: 4100, f1: 3750, bandQ: 6 },
    // A descending accelerating run, then the terminal flourish that is the
    // actual signature of this song - without it the run is just a trill.
    phrase: [...run(9, 1.0, 0.62, 0.075, 0.155, 0.095), [0.68, 0.11, 0.14], [0.86, 0.2, 0.2]],
  },
  {
    name: 'coaltit',
    salt: 0x5b2,
    // A conifer specialist, hence a canopy floor and the larch/spruce belt.
    habitat: { elevMin: 900, elevMax: 2200, canopyMin: 0.35 },
    cellM: 160,
    presence: 0.35,
    earshotM: 160,
    everyS: [18, 42],
    gain: 0.13,
    voice: { f0: 4900, f1: 4700, bandQ: 8 },
    // "wee-tsu, wee-tsu, wee-tsu" - a couplet, repeated a random number of
    // times for the same reason the marmot's whistle is a random series.
    phrase: [[1.0, 0.09, 0.135], [0.8, 0.09, 0.3]],
    repeat: [3, 6],
  },
  {
    name: 'cuckoo',
    salt: 0x5c3,
    // Forest edge rather than deep wood - hence a canopy window - and it carries
    // for a kilometre. So the largest earshot here and the lowest density: one
    // cuckoo per valley is already the right number of cuckoos.
    habitat: { elevMin: 800, elevMax: 1900, canopyMin: 0.08, canopyMax: 0.75 },
    cellM: 500,
    presence: 0.25,
    earshotM: 750,
    everyS: [80, 180],
    gain: 0.22,
    // Very nearly a pure tone, and hollow: a sine through a gentle band, not the
    // triangle that makes an alarm whistle cut.
    voice: { f0: 735, f1: 722, bandQ: 2.2, wave: 'sine' },
    phrase: [[1.0, 0.17, 0.3], [0.79, 0.24, 0.24]],
    repeat: [3, 8],
    repeatGapS: [0.9, 1.4],
  },
  {
    name: 'pipit',
    salt: 0x5d4,
    // Above the treeline: the bird of alpine grassland. It song-flights over open
    // ground, so a canopy ceiling rather than a floor.
    habitat: { elevMin: 1900, elevMax: 2900, canopyMax: 0.12 },
    cellM: 130,
    presence: 0.4,
    earshotM: 210,
    everyS: [26, 55],
    gain: 0.12,
    // Thin and high, which is what carries over open ground - and quiet, because
    // this is a very small bird in a great deal of wind.
    voice: { f0: 5200, f1: 5050, bandQ: 9 },
    phrase: run(11, 1.0, 0.88, 0.05, 0.105, 0.075),
  },
  {
    name: 'tawnyowl',
    salt: 0x5e5,
    // The one nocturnal voice, and the reason the night stops being silent. Same
    // wooded habitat as the chaffinch, lower down - an owl needs trees to sit in.
    nocturnal: true,
    habitat: { elevMin: 700, elevMax: 1900, canopyMin: 0.25 },
    cellM: 500,
    presence: 0.35,
    earshotM: 800,
    everyS: [40, 110],
    gain: 0.2,
    // Low, hollow, breathy, with the tremolo that is the whole character of it -
    // a shallow amplitude chop, where the nutcracker's rattle is a violent one.
    // That is what rattleDepth is for.
    voice: { f0: 470, f1: 452, bandQ: 3, wave: 'sine', rattleHz: 13, rattleDepth: 0.2 },
    // "HOOO ... (a long pause) ... ho, hu-hooooooo". The pause is the half of it
    // that people actually remember.
    phrase: [[1.0, 0.5, 2.6], [1.0, 0.08, 0.24], [0.97, 0.1, 0.16], [0.94, 0.8, 0.8]],
    repeat: [1, 2],
    repeatGapS: [6, 11],
  },
];

// How often the lattice around the camera is re-tested. Habitat cannot change,
// so this only has to keep up with walking, not with the frame rate.
const SINGER_RESCAN_S = 2;
// Wind and rain, both already computed for the wind bed, and each doing the one
// thing it really does. Wind MASKS song, so it takes the level down. Rain does
// not make a bird quieter, it makes it shut up and sit under something - so it
// gates whether the bird sings at all, which is also the only version of it a
// listener could tell apart from the weather getting louder.
const SONG_WIND_DUCK = 0.65;
const SONG_RAIN_SILENCE = 0.85;

// ---------------------------------------------------------------------------
// Footsteps (2026-08-07, the user's second deferred topic)
// ---------------------------------------------------------------------------
//
// The first sound in this project tied to the user's own action rather than to
// the scene, which is why it was held back from the phase-6 round and discussed
// on its own. The discussion turned on a number rather than on taste:
// src/controls.js walks at 4 m/s, which is 14.4 km/h - a 4:10/km running pace,
// not a walk - and Shift takes it to 36 km/h, which is faster than a sprinter.
// A cadence derived honestly from that is 2.7 steps a second at a walk and a
// buzz under Shift.
//
// The user's call: a FIXED cadence, near a real walking pace, regardless of
// speed. That is deliberately a lie - at 4 m/s it implies a 2 m stride - and the
// lie is the point: they chose calm over consistent, because the alternative is
// eighty running footfalls in half a minute. It is one constant to change if it
// ever reads wrong against the ground going past.
const STEP_HZ = 2;
// A gait is not a metronome, and a fixed interval is exactly what makes a
// repeated sample sound repeated - the same lesson the marmot's series taught.
const STEP_JITTER = 0.09;
// Below this there is no walking to hear. Well under 4 m/s, so it only catches
// standing still, not a slow approach.
const STEP_MIN_MPS = 0.4;
// Above this, the camera did not travel - it was placed. Fly mode boosted is
// 60 x 2.5 = 150 m/s, the fastest the controls can ever legitimately produce, so
// there is a third of a headroom before this bites; a POI fly-to crosses tens of
// km in 1.2 s and lands far above it. Only airspeed uses it - the footsteps stopped
// reading the camera at all on 2026-08-10.
const TELEPORT_MPS = 200;
// NOT on the same scale as the alarm whistles, and the first value here was
// wrong for exactly that reason. A whistle is an oscillator, so its peak gain is
// a peak amplitude; a footstep is the shared pink-noise buffer, which makeNoise()
// writes at about +-0.1. So a gain that would be loud for an oscillator comes out
// forty times quieter here - 0.14 measured as 1.3x the wind bed, which is
// inaudible. This is a level against a +-0.1 source: it puts a footfall about
// six times the bed, clearly present and well under a marmot beside you.
const STEP_GAIN = 0.7;
// Scheduling look-ahead: one audio tick is 125 ms and a step falls between
// ticks, so steps due in the next window are scheduled at their exact time
// rather than quantised onto the tick grid.
const STEP_LOOKAHEAD_S = 0.2;
// Slightly left, slightly right. Free, and it is the one thing that makes a
// footstep sequence read as a gait rather than as a repeating sound.
const STEP_PAN = 0.12;

// What you are walking on, from signals the scene already computes: no new data
// at all. Each is a burst of the shared pink noise through one filter with a
// fast envelope - a footstep is noise, which is why none of this can go through
// whistle(). `grains` are the little scattered arrivals after the footfall,
// which is what loose stone actually sounds like.
const SURFACES = {
  grass: { type: 'lowpass', freq: 850, Q: 0.9, durS: 0.11, attackS: 0.006, gain: 0.8 },
  // Needles and leaf litter: softer and duller than turf, with a little crackle.
  forest: { type: 'lowpass', freq: 620, Q: 0.8, durS: 0.14, attackS: 0.008, gain: 0.75, grains: 2, grainGain: 0.35 },
  // Loose stone. Brighter, sharper, and the stones keep moving after the foot has.
  scree: { type: 'bandpass', freq: 2100, Q: 0.7, durS: 0.09, attackS: 0.003, gain: 1, grains: 4, grainGain: 0.5 },
  // The crunch is high and tight, and the squeak is the tail of it.
  snow: { type: 'bandpass', freq: 3200, Q: 1.4, durS: 0.16, attackS: 0.004, gain: 0.85 },
  // Wet ground is the opposite: low, thick and short - a squelch is a damped
  // thing, and the water takes the top off it.
  wet: { type: 'lowpass', freq: 420, Q: 1.2, durS: 0.13, attackS: 0.01, gain: 0.9 },
};
// Where each surface takes over. Elevations follow docs/ARCHITECTURE.md §5's
// bands (rocky above 3,000 m, nival above 3,800 m) so the ear and the terrain
// colour agree about what the ground is.
const SNOW_COVER = 0.45;
const WET_COVER = 0.5;
const FOREST_CANOPY = 0.35;
const NIVAL_M = 3800;
const ROCKY_M = 3000;
const SCREE_SLOPE_DEG = 30;
const STEP_SLOPE_PROBE_M = 12;

const _dir = new THREE.Vector3();

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

// Same generator as vegetation.js and wildlife.js, written out again for the
// same reason they write it out: a singer must land in the same tree on every
// load and on every machine, and that is worth more than sharing four lines.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Cell coordinates are signed and unbounded, so they are mixed into a seed
// rather than used as one.
function cellRandom(ix, iz, salt) {
  let h = Math.imul(ix | 0, 0x27d4eb2d) ^ Math.imul(iz | 0, 0x165667b1) ^ Math.imul(salt, 0x9e3779b9);
  h = Math.imul(h ^ (h >>> 15), 0x2545f491);
  return mulberry32(h ^ (h >>> 13));
}

function pick(rnd, range) {
  return range[0] + (range[1] - range[0]) * rnd();
}

// Pink noise (Paul Kellet's filter), not white. Wind and running water both have
// far more energy low down, and starting from a -3 dB/octave source means the
// per-layer bandpasses only have to carve out a region rather than also fix the
// spectrum. White noise through the same filters sounds like tape hiss.
function makeNoise(ctx, seconds, random) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  for (let i = 0; i < length; i++) {
    const white = random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

// Walks a polyline (or ring) emitting a point every stepM, interpolating along
// long segments - see WATER_STEP_M for why nearest-vertex is not good enough.
function resampleLine(points, stepM, emit) {
  if (!points.length) return;
  emit(points[0][0], points[0][1]);
  let carry = 0;
  for (let i = 1; i < points.length; i++) {
    const [x0, z0] = points[i - 1];
    const [x1, z1] = points[i];
    const segment = Math.hypot(x1 - x0, z1 - z0);
    if (segment <= 1e-6) continue;
    let travelled = stepM - carry;
    while (travelled <= segment) {
      const t = travelled / segment;
      emit(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t);
      travelled += stepM;
    }
    carry = (carry + segment) % stepM;
  }
}

// Spatial hash of every audible water point, built once from the hydrology
// manifest src/water.js already loads. Query returns, per kind, the distance to
// the nearest point and that point's own strength - so a big waterfall is louder
// than a small one at the same distance, which is a real difference and free to
// carry here.
export function buildWaterEarshot(manifest) {
  const cells = new Map();
  let count = 0;

  const key = (x, z) => `${Math.floor(x / EARSHOT_CELL_M)},${Math.floor(z / EARSHOT_CELL_M)}`;
  const add = (kind, strength) => (x, z) => {
    const k = key(x, z);
    let bucket = cells.get(k);
    if (!bucket) cells.set(k, (bucket = []));
    bucket.push({ x, z, kind, strength });
    count++;
  };

  for (const lake of manifest.lakes ?? []) {
    const ring = lake.ring ?? [];
    // Ring vertices rather than a centroid: the shore is where a lake is
    // audible, and a centroid would put a 600 m lake's sound 300 m from
    // anywhere you can stand on it.
    let perimeter = 0;
    for (let i = 1; i < ring.length; i++) perimeter += Math.hypot(ring[i][0] - ring[i - 1][0], ring[i][1] - ring[i - 1][1]);
    // A tarn laps; a big lake has real wave noise.
    const strength = clamp(perimeter / 900, 0.35, 1);
    resampleLine(ring, WATER_STEP_M, add('lake', strength));
  }
  for (const river of manifest.rivers ?? []) {
    const line = (river.line ?? []).map(([x, , z]) => [x, z]);
    resampleLine(line, WATER_STEP_M, add('river', 1));
  }
  for (const wf of manifest.waterfalls ?? []) {
    const base = wf.centerline?.[wf.centerline.length - 1];
    if (!base) continue;
    // Drop is the one number that says how loud a waterfall is, and the manifest
    // already carries it: Entrelor's 78 m against Lillaz's 12 m.
    add('waterfall', clamp(0.45 + (wf.dropM ?? 0) / 90, 0.5, 1.35))(base[0], base[2]);
  }

  function query(x, z) {
    const cx = Math.floor(x / EARSHOT_CELL_M);
    const cz = Math.floor(z / EARSHOT_CELL_M);
    const out = {};
    for (const kind of Object.keys(WATER_KINDS)) out[kind] = { distanceM: Infinity, strength: 0 };
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const bucket = cells.get(`${cx + dx},${cz + dz}`);
        if (!bucket) continue;
        for (const p of bucket) {
          const d = Math.hypot(p.x - x, p.z - z);
          const slot = out[p.kind];
          if (d < slot.distanceM) {
            slot.distanceM = d;
            slot.strength = p.strength;
          }
        }
      }
    }
    return out;
  }

  return { query, count, cells: cells.size };
}

export function createAudio({
  context = null,
  canopyAt = null,
  sampleGroundHeight = null,
  water = null,
  random = Math.random,
  // Tests render into an OfflineAudioContext, where a time constant would mean
  // waiting for convergence inside the measured window - see tools/test-audio.mjs.
  immediate = false,
} = {}) {
  let ctx = context;
  let master = null;
  let muffle = null;
  let layers = null;
  let samplers = { canopyAt, sampleGroundHeight };
  let earshot = water ? buildWaterEarshot(water) : null;
  let enabled = true;

  let gust = 0.5;
  let gustTarget = 0.5;
  let gustTimer = 0;
  let lapPhase = 0;
  let tickAccum = 1 / UPDATE_HZ; // so the first update() applies a real state, not silence
  let speedMps = 0;
  // Previous camera position, for airspeed only - never for judging a distance to
  // something, see alarm().
  let lastX = null;
  let lastY = 0;
  let lastZ = 0;
  let lastCallAt = -Infinity;
  let callsPlayed = 0;
  // Songbirds: one Map of singers per species, keyed by lattice cell. A null
  // entry is a remembered miss - habitat cannot change, so an empty cell is
  // never worth testing twice (the same trick as wildlife.js's herds).
  const singers = SONGBIRDS.map(() => new Map());
  let sinceRescan = SINGER_RESCAN_S; // so the first tick populates the lattice
  let songClock = 0;
  let songT0 = null;
  let songsPlayed = 0;
  // Per species too, because "which bird sang" is the whole habitat assertion:
  // a chaffinch above the treeline is a bug a total would hide.
  const songsBySpecies = Object.fromEntries(SONGBIRDS.map((s) => [s.name, 0]));
  let nightness = 0;
  // Footsteps.
  let noiseBuffer = null;
  let stepNextAt = 0;
  let stepFoot = 0;
  let stepsPlayed = 0;
  let lastSurface = null;
  // The live camera, kept so alarm() can read where it is NOW - see the comment
  // there for why a remembered position was not good enough.
  let cameraRef = null;

  const diag = {
    started: false, enabled, strength: 0, altitude: 0, exposure: 0, canopy: 0,
    gust: 0, rain: 0, snow: 0, speedMps: 0, water: null, gains: {},
    night: 0, singers: 0, songs: 0, surface: null, steps: 0,
  };

  function set(param, value) {
    const v = Number.isFinite(value) ? value : 0;
    if (immediate) param.setValueAtTime(v, ctx.currentTime);
    else param.setTargetAtTime(v, ctx.currentTime, PARAM_TAU);
  }

  function makeLayer(buffer, { type, freq, Q, rate }) {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    // Each layer reads the one shared buffer at its own rate and from its own
    // offset, so the loop points never line up and nothing pulses at NOISE_S.
    source.playbackRate.value = rate;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = Q;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(filter).connect(gain).connect(muffle);
    source.start(0, random() * NOISE_S);
    return { source, filter, gain };
  }

  function build() {
    master = ctx.createGain();
    master.gain.value = enabled ? MASTER_GAIN : 0;
    master.connect(ctx.destination);
    // Everything passes through one lowpass so falling snow can muffle the whole
    // scene, which is the single most recognisable thing about it.
    muffle = ctx.createBiquadFilter();
    muffle.type = 'lowpass';
    muffle.frequency.value = 18000;
    muffle.Q.value = 0.7;
    muffle.connect(master);

    const buffer = makeNoise(ctx, NOISE_S, random);
    noiseBuffer = buffer; // footsteps read the same one, at their own offsets
    layers = {
      windLow: makeLayer(buffer, { type: 'bandpass', freq: 130, Q: 0.8, rate: 0.83 }),
      windHigh: makeLayer(buffer, { type: 'bandpass', freq: 900, Q: 0.55, rate: 1.0 }),
      rustle: makeLayer(buffer, { type: 'bandpass', freq: 3000, Q: 0.5, rate: 1.19 }),
      waterLow: makeLayer(buffer, { type: 'lowpass', freq: 420, Q: 0.9, rate: 0.91 }),
      waterHigh: makeLayer(buffer, { type: 'bandpass', freq: 2400, Q: 0.45, rate: 1.07 }),
      rain: makeLayer(buffer, { type: 'bandpass', freq: 1800, Q: 0.4, rate: 1.13 }),
    };
    diag.started = true;
  }

  // ---- footsteps ----------------------------------------------------------

  // Rise over run across 2x the probe, in degrees, from the DRAWN surface - the
  // slope the user can see rather than the true one. Same idea, and the same
  // probe length, as wildlife.js uses to decide where an ibex can stand.
  function slopeDegrees(x, z) {
    const sample = samplers.sampleGroundHeight;
    if (!sample) return 0;
    const R = STEP_SLOPE_PROBE_M;
    const hx = sample(x + R, z) - sample(x - R, z);
    const hz = sample(x, z + R) - sample(x, z - R);
    if (!Number.isFinite(hx) || !Number.isFinite(hz)) return 0;
    return (Math.atan(Math.hypot(hx, hz) / (2 * R)) * 180) / Math.PI;
  }

  // How much snow is lying HERE, not how much has fallen on the park. Since
  // 2026-08-11 snow lies by altitude, aspect and slope (src/snow.js), so the
  // global weather level is the wrong question: in a storm that has whitened the
  // ridge above, the valley floor is still bare, and crunching across it would
  // contradict what the user can see. Same rule as the birdsong reading
  // lighting.js's own `night` - one source, so the ear and the eye cannot drift.
  //
  // Aspect from two taps of the drawn surface, as the trees do. The slope term is
  // left at 0 deliberately: 'snow' already wins over 'scree' in the priority
  // order below, so passing it could only change the answer on ground steeper
  // than 30 deg, where it would have said scree anyway.
  function snowUnderfoot(x, z, groundY, level) {
    const sample = samplers.sampleGroundHeight;
    if (!(level > 0)) return 0;
    let aspectZ = 0;
    if (sample) {
      const R = STEP_SLOPE_PROBE_M;
      const grad = (sample(x, z - R) - sample(x, z + R)) / (2 * R); // -Z is north (§6)
      if (Number.isFinite(grad)) aspectZ = grad / Math.hypot(1, grad);
    }
    return snowCoverAt({ elevM: groundY, aspectZ, level });
  }

  // What is underfoot, in priority order: what has fallen on the ground beats
  // what grows on it, and what grows on it beats what it is made of.
  function surfaceAt(x, z, groundY, canopy, snow, wet) {
    if (snowUnderfoot(x, z, groundY, snow) > SNOW_COVER || groundY > NIVAL_M) return 'snow';
    if (wet > WET_COVER) return 'wet';
    if (canopy > FOREST_CANOPY) return 'forest';
    if (groundY > ROCKY_M || slopeDegrees(x, z) > SCREE_SLOPE_DEG) return 'scree';
    return 'grass';
  }

  function burst(cfg, peak, pan, at, { freqMul = 1, durMul = 1, rate = 1 } = {}) {
    const durS = cfg.durS * durMul;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.playbackRate.value = rate;
    const filter = ctx.createBiquadFilter();
    filter.type = cfg.type;
    filter.frequency.value = cfg.freq * freqMul;
    filter.Q.value = cfg.Q;
    const gain = ctx.createGain();
    const top = Math.max(peak, 1e-4);
    gain.gain.setValueAtTime(1e-4, at);
    gain.gain.exponentialRampToValueAtTime(top, at + cfg.attackS);
    gain.gain.exponentialRampToValueAtTime(1e-4, at + durS);
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    src.connect(filter).connect(gain).connect(panner).connect(muffle);
    // A random offset into the shared buffer, so no two footfalls are the same
    // stretch of noise - the same trick the six bed layers use against each
    // other, here used against the step before.
    src.start(at, random() * Math.max(0.1, NOISE_S - durS - 0.1), durS + 0.02);
    src.onended = () => {
      src.disconnect();
      filter.disconnect();
      gain.disconnect();
      panner.disconnect();
    };
    return src;
  }

  // Footfalls booked but not yet sounded. A step is scheduled up to
  // STEP_LOOKAHEAD_S before it is due, so letting go of W can leave one already
  // on the books - and the camera stops dead, with no deceleration to justify a
  // last stride. Cancelled rather than left to sound; see stepWalking().
  let pendingSteps = [];

  function cancelPendingSteps(now) {
    for (const step of pendingSteps) {
      if (step.at <= now) continue; // already sounding: cutting it would click
      for (const src of step.srcs) {
        src.stop(now); // before its start time, so it never plays at all
        // A source stopped before it started may never fire 'ended', so free the
        // chain here instead of waiting for it. disconnect() is safe twice.
        src.onended?.();
        src.onended = null;
      }
      stepsPlayed--; // it never sounds, so it was never a step
    }
    pendingSteps.length = 0;
  }

  function footstep(surface, at) {
    const cfg = SURFACES[surface];
    if (!cfg || !noiseBuffer) return;
    // Alternating feet. Nothing else here makes a sequence of identical events
    // read as a gait rather than as a repeat.
    stepFoot ^= 1;
    const pan = stepFoot ? STEP_PAN : -STEP_PAN;
    const peak = STEP_GAIN * cfg.gain * (0.85 + 0.3 * random());
    const srcs = [burst(cfg, peak, pan, at, {
      freqMul: 0.9 + 0.2 * random(),
      durMul: 0.9 + 0.2 * random(),
      rate: 0.9 + 0.25 * random(),
    })];
    // Loose ground keeps arriving after the foot has left it.
    for (let g = 0; g < (cfg.grains ?? 0); g++) {
      srcs.push(burst(cfg, peak * cfg.grainGain * (0.4 + 0.6 * random()), pan + (random() - 0.5) * 0.3,
        at + 0.02 + random() * 0.09,
        { freqMul: 1.1 + 0.5 * random(), durMul: 0.35, rate: 1 + 0.5 * random() }));
    }
    pendingSteps.push({ at, srcs });
    stepsPlayed++;
  }

  function stepWalking(x, z, groundY, canopy, snow, wet, walking) {
    const now = songNow();
    if (!walking) {
      // Anything booked for after this moment is un-booked: standing still has to
      // be silent from the tick it starts, not from the end of the look-ahead.
      cancelPendingSteps(now);
      // Re-armed just ahead of the clock, so the first stride after a stop lands
      // promptly instead of a burst of the steps that were "missed" standing still.
      stepNextAt = now + 0.06;
      lastSurface = null;
      return null;
    }
    // Sounded steps stop being cancellable, and stop being kept: a long walk
    // would otherwise accumulate an entry per footfall.
    if (pendingSteps.length) pendingSteps = pendingSteps.filter((s) => s.at > now);
    const surface = surfaceAt(x, z, groundY, canopy, snow, wet);
    lastSurface = surface;
    if (stepNextAt < now) stepNextAt = now + 0.06;
    while (stepNextAt < now + STEP_LOOKAHEAD_S) {
      footstep(surface, stepNextAt);
      stepNextAt += (1 / STEP_HZ) * (1 + (random() - 0.5) * 2 * STEP_JITTER);
    }
    return surface;
  }

  // Must be called from a user gesture the first time (browser autoplay policy).
  // Idempotent, so main.js can call it on every click without tracking state.
  function start() {
    if (!ctx) {
      const Ctor = window.AudioContext ?? window.webkitAudioContext;
      if (!Ctor) return false; // no Web Audio: everything below no-ops, viewer unaffected
      ctx = new Ctor();
    }
    if (!layers) build();
    // Not on an OfflineAudioContext (the only kind with startRendering): there,
    // 'suspended' means "has not been rendered yet" and resume() before
    // startRendering() throws. tools/test-audio.mjs renders offline.
    if (!ctx.startRendering && ctx.state === 'suspended') ctx.resume();
    return true;
  }

  function setEnabled(value) {
    enabled = !!value;
    diag.enabled = enabled;
    if (enabled) start();
    if (!master) return;
    // A ramp, not an assignment: cutting a running noise bed dead clicks.
    master.gain.setTargetAtTime(enabled ? MASTER_GAIN : 0, ctx.currentTime, MUTE_TAU);
  }

  // Wind strength, and the two terrain signals behind it. Exposure is the honest
  // one: the same 2,800 m can be a sheltered basin or a col, and the difference
  // is whether the ground around you is lower than you are.
  function windTerrain(x, z, groundY) {
    const altitude = smoothstep(1300, 3300, groundY);
    let exposure = 0;
    const sample = samplers.sampleGroundHeight;
    if (sample) {
      const R = 90;
      let sum = 0;
      let n = 0;
      for (const [dx, dz] of [[R, 0], [-R, 0], [0, R], [0, -R]]) {
        const h = sample(x + dx, z + dz);
        if (Number.isFinite(h)) {
          sum += h;
          n++;
        }
      }
      if (n) exposure = smoothstep(0, 35, groundY - sum / n);
    }
    return { altitude, exposure };
  }

  // ---- songbirds ----------------------------------------------------------

  // The clock everything is scheduled against, and there is exactly one right
  // answer per kind of context.
  //
  // An OfflineAudioContext - the only kind with startRendering - leaves
  // currentTime at 0 for the whole driving phase, so accumulated dt is the only
  // clock it has; without it a test that steps a minute of song would pile every
  // note onto the first sample.
  //
  // A live context has a real clock, and it is the one the hardware will play
  // against, so it is the answer. This used to be `max(currentTime, t0 +
  // accumulated)` for both, which looks harmless and is not: t0 is captured at
  // the first call, so whatever dt had already accumulated by then - the seeded
  // first tick, plus however long the frame that started the audio took - became
  // a PERMANENT head start, and max() can only ever push it further ahead, never
  // pull it back. Measured at 1.12 s headless and reported as about five seconds
  // on real hardware (2026-08-10): every sound scheduled that far after the thing
  // that caused it. Nothing else made it visible - the wind and the birds do not
  // care when they start, and it is silent in every reading except diag.clockSkew,
  // which exists because of this.
  function songNow() {
    if (typeof ctx.startRendering === 'function') {
      if (songT0 == null) songT0 = ctx.currentTime;
      return songT0 + songClock;
    }
    return ctx.currentTime;
  }

  function makeSinger(spec, ix, iz) {
    const rnd = cellRandom(ix, iz, spec.salt);
    if (rnd() > spec.presence) return null;
    const x = (ix + rnd()) * spec.cellM;
    const z = (iz + rnd()) * spec.cellM;
    const sample = samplers.sampleGroundHeight;
    if (!sample) return null;
    const elev = sample(x, z);
    const h = spec.habitat;
    if (!Number.isFinite(elev) || elev < h.elevMin || elev > h.elevMax) return null;
    // No canopy sampler yet (main.js sets it once the forest mask has loaded)
    // reads as bare ground, which keeps the forest birds quiet rather than
    // putting a chaffinch on a glacier.
    const canopy = clamp(samplers.canopyAt?.(x, z) ?? 0, 0, 1);
    if (h.canopyMin != null && canopy < h.canopyMin) return null;
    if (h.canopyMax != null && canopy > h.canopyMax) return null;
    // Spread over the whole interval rather than starting at its floor: a bird
    // that has just been discovered should sometimes be about to sing, or every
    // arrival somewhere is met with half a minute of silence.
    return { x, z, rnd, nextIn: rnd() * spec.everyS[1] };
  }

  function rescanSingers(x, z) {
    if (!samplers.sampleGroundHeight) return;
    for (let s = 0; s < SONGBIRDS.length; s++) {
      const spec = SONGBIRDS[s];
      const map = singers[s];
      // Kept a cell beyond earshot, so a singer at the edge is not created and
      // destroyed - resetting its clock each time - as you step back and forth.
      const reach = spec.earshotM + spec.cellM;
      const span = Math.ceil(reach / spec.cellM);
      const cx = Math.floor(x / spec.cellM);
      const cz = Math.floor(z / spec.cellM);
      const keep = new Set();
      for (let iz = cz - span; iz <= cz + span; iz++) {
        for (let ix = cx - span; ix <= cx + span; ix++) {
          const dx = (ix + 0.5) * spec.cellM - x;
          const dz = (iz + 0.5) * spec.cellM - z;
          if (Math.hypot(dx, dz) > reach) continue;
          const key = `${ix}:${iz}`;
          keep.add(key);
          if (!map.has(key)) map.set(key, makeSinger(spec, ix, iz));
        }
      }
      for (const key of map.keys()) if (!keep.has(key)) map.delete(key);
    }
  }

  function sing(spec, singer, distanceM, duck) {
    const pan = panFrom(singer.x, singer.z, distanceM);
    const peak = spec.gain * duck * (1 - distanceM / spec.earshotM) ** 1.5;
    // Not a cap on how many birds sing - a level floor. Below this the phrase
    // would be further under the wind bed than the quantisation of the bed
    // itself, so it is nodes built to be inaudible.
    if (peak < 1e-3) return false;
    const rnd = singer.rnd;
    const repeats = spec.repeat
      ? spec.repeat[0] + Math.floor(rnd() * (spec.repeat[1] - spec.repeat[0] + 1))
      : 1;
    // Jittered inside the tick rather than landing on its boundary: UPDATE_HZ is
    // 8, and every song in the wood starting on a 125 ms grid is audible as one.
    let when = songNow() + 0.01 + rnd() / UPDATE_HZ;
    for (let r = 0; r < repeats; r++) {
      for (const [mul, durS, toNextS] of spec.phrase) {
        // Loudness and pitch vary note to note for the same reason the marmot's
        // series does: an exactly repeated note is what betrays a sample.
        whistle(spec.voice, peak * (0.86 + 0.14 * rnd()), pan, when, mul * (0.995 + 0.01 * rnd()), durS);
        when += toNextS;
      }
      if (spec.repeatGapS) when += pick(rnd, spec.repeatGapS);
    }
    songsPlayed++;
    songsBySpecies[spec.name]++;
    return true;
  }

  function stepSingers(dt, x, z, wind, rain) {
    const duck = clamp(1 - SONG_WIND_DUCK * wind, 0.1, 1);
    // Shaped rather than linear: at the night preset itself the wood has to be
    // properly silent and the owl properly present, with the crossover happening
    // across dusk instead of smeared over the whole evening.
    const dark = smoothstep(0.25, 0.7, nightness);
    const dry = 1 - SONG_RAIN_SILENCE * rain;
    let live = 0;
    for (let s = 0; s < SONGBIRDS.length; s++) {
      const spec = SONGBIRDS[s];
      const active = (spec.nocturnal ? dark : 1 - dark) * dry;
      for (const singer of singers[s].values()) {
        if (!singer) continue;
        live++;
        singer.nextIn -= dt;
        if (singer.nextIn > 0) continue;
        singer.nextIn = pick(singer.rnd, spec.everyS);
        // Day and night gate WHETHER it sings, not how loudly: a bird that has
        // gone to roost is silent, not quiet. Probabilistic, so dusk thins the
        // chorus out rather than switching it off between two frames.
        if (singer.rnd() > active) continue;
        const distanceM = Math.hypot(singer.x - x, singer.z - z);
        if (distanceM > spec.earshotM) continue;
        sing(spec, singer, distanceM, duck);
      }
    }
    return live;
  }

  function tick(dt, camera, weather, controls) {
    const x = camera.position.x;
    const y = camera.position.y;
    const z = camera.position.z;

    gustTimer -= dt;
    if (gustTimer <= 0) {
      // A gust is a random walk towards a new target, not an LFO: a periodic
      // swell is the most artificial-sounding thing an ambience can do.
      gustTarget = 0.15 + 0.85 * random();
      gustTimer = 1.5 + 3.5 * random();
    }
    gust += (gustTarget - gust) * (1 - Math.exp(-dt / 1.2));
    lapPhase = (lapPhase + dt * 0.9) % (Math.PI * 2);

    const sampled = samplers.sampleGroundHeight?.(x, z);
    const groundY = Number.isFinite(sampled) ? sampled : y;
    const canopy = clamp(samplers.canopyAt?.(x, z) ?? 0, 0, 1);
    const mod = weather?.mod ?? {};
    const rain = clamp(mod.rain ?? 0, 0, 1);
    const snow = clamp(mod.snow ?? 0, 0, 1);

    const { altitude, exposure } = windTerrain(x, z, groundY);
    // Airspeed, not travel: walking is 4 m/s and silent, fly mode is 60-150 and
    // should sound like it.
    const airborne = smoothstep(2, 60, Math.max(0, y - groundY));
    const rush = smoothstep(6, 70, speedMps) * (0.3 + 0.45 * airborne);
    // A wood is a windbreak - standing in one is quieter than the ridge above it
    // even in the same weather.
    const shelter = 1 - 0.55 * canopy;
    const strength = clamp((0.16 + 0.52 * altitude + 0.32 * exposure) * shelter + 0.55 * rain + rush, 0, 1.25);

    // Songbirds and footsteps. Skipped entirely while the sound is off - both
    // exist only to be heard, so there is nothing to keep simulating for a muted
    // listener.
    let live = 0;
    let surface = null;
    if (enabled) {
      songClock += dt;
      sinceRescan += dt;
      if (sinceRescan >= SINGER_RESCAN_S) {
        sinceRescan = 0;
        rescanSingers(x, z);
      }
      live = stepSingers(dt, x, z, clamp(strength, 0, 1), rain);
      // Only on foot, and only while actually walking - both facts come from
      // controls, neither from the camera. 'F' is the only thing that knows
      // which mode you are in (walk mode is ground-clamped and fly mode can sit
      // on the ground too), and controls.travelMps is the only thing that knows
      // you are travelling rather than having been PUT somewhere. The camera's
      // own displacement answers neither: smoothed it lags a stop by ~0.7 s, and
      // a teleport (the dev 'G' key) reads as several seconds of sprinting.
      // Both were real, both reported by ear on 2026-08-10.
      const walking = controls?.mode === 'walk' && (controls.travelMps ?? 0) > STEP_MIN_MPS;
      surface = stepWalking(x, z, groundY, canopy, snow, mod.wet ?? 0, walking);
    }

    let waterLow = 0;
    let waterHigh = 0;
    const near = earshot?.query(x, z) ?? null;
    if (near) {
      for (const [kind, cfg] of Object.entries(WATER_KINDS)) {
        const { distanceM, strength: source } = near[kind];
        if (!(distanceM < cfg.radiusM)) continue;
        const t = distanceM / cfg.radiusM;
        const att = (1 - t) ** 1.8 * source * cfg.gain;
        // Air absorbs the highs faster than the body, which is why distant water
        // is a rumble and close water is a hiss.
        const highAtt = att * (1 - 0.55 * t);
        // Only the lake share breathes: that slow swell is lapping, and applying
        // it to a torrent would be wrong.
        const lap = kind === 'lake' ? 0.75 + 0.35 * Math.sin(lapPhase) : 1;
        waterLow += cfg.low * att * lap;
        waterHigh += cfg.high * highAtt * lap;
      }
    }

    const gains = {
      windLow: 0.5 * strength * (0.55 + 0.55 * gust),
      windHigh: 0.3 * strength ** 1.25 * (0.35 + 0.85 * gust),
      rustle: 0.5 * canopy * (0.2 + 0.9 * strength) * (0.3 + 0.9 * gust),
      waterLow: clamp(waterLow, 0, 1),
      waterHigh: clamp(waterHigh, 0, 1),
      // Rain on leaves is louder than rain on rock.
      rain: 0.55 * rain * (1 + 0.5 * canopy),
    };
    for (const [name, value] of Object.entries(gains)) set(layers[name].gain.gain, value);
    set(layers.windLow.filter.frequency, 110 + 60 * gust);
    set(layers.windHigh.filter.frequency, 700 + 900 * gust);
    set(muffle.frequency, 18000 - 12500 * snow);

    // The gains we ASKED for, not what the params read back: an AudioParam's
    // .value ignores scheduled events until they are processed, so reading it
    // reports 0 for a graph that is in fact about to make a sound - which is
    // exactly how this went wrong first time round, in an offline render where
    // nothing had been processed yet (tools/test-audio.mjs).
    Object.assign(diag, {
      strength, altitude, exposure, canopy, gust, rain, snow, speedMps,
      water: near,
      gains,
      night: nightness,
      singers: live,
      songs: songsPlayed,
      surface,
      steps: stepsPlayed,
      // How far ahead of the context's own clock everything is being scheduled.
      // Zero on a healthy live context; anything else is a delay between doing
      // something and hearing it, and songNow()'s max() means it can only ever
      // run one way. Cheap, and it is the only window onto a fault that is
      // completely silent in every other reading (2026-08-10).
      clockSkew: songNow() - ctx.currentTime,
    });
  }

  function update(dt, camera, weather = null, lighting = null, controls = null) {
    if (!layers || !camera) return;
    cameraRef = camera;
    // Whether it is dark, taken from the weight the lights are themselves using
    // (src/lighting.js) rather than from a second set of thresholds here.
    nightness = clamp(lighting?.night ?? 0, 0, 1);

    const x = camera.position.x;
    const y = camera.position.y;
    const z = camera.position.z;
    if (lastX != null && dt > 1e-4) {
      const instant = Math.hypot(x - lastX, y - lastY, z - lastZ) / dt;
      if (instant > TELEPORT_MPS) {
        // The camera was PLACED, not flown: the dev 'G' key, a POI fly-to, a
        // restored view. This is a speed, not a distance, so a slow frame cannot
        // trigger it - only a discontinuity can. Smoothing one in leaves a
        // phantom airspeed decaying for ~2 s, i.e. a wind swell for arriving
        // somewhere. Start again from standing still instead.
        speedMps = 0;
      } else {
        // Smoothed, or one long frame reads as a gust of airspeed.
        speedMps += (instant - speedMps) * (1 - Math.exp(-dt / 0.3));
      }
    }
    lastX = x;
    lastY = y;
    lastZ = z;

    tickAccum += dt;
    if (tickAccum < 1 / UPDATE_HZ) return;
    const tickDt = tickAccum;
    tickAccum = 0;
    tick(tickDt, camera, weather, controls);
  }

  // One vocalisation, from src/wildlife.js's onAlarm (an animal taking fright) or
  // src/birds.js's onCall (a chough flock chattering, a nutcracker rattling as it
  // goes). Returns how many notes were scheduled - 0 when nothing was played,
  // which is what a test can assert on.
  function call({ species, x, z } = {}) {
    if (!layers || !enabled || !cameraRef) return 0;
    const cfg = CALLS[species];
    if (!cfg) return 0; // this species has no call, and that is deliberate

    // Read the camera NOW, not the position the last tick happened to see. This
    // is not a micro-optimisation, it is the whole bug the first version had
    // (found 2026-08-05, reported by the user as "I never hear the marmot"): the
    // dev 'G' key teleports the camera and then steps the wildlife in the SAME
    // handler, so every animal that suddenly finds the camera 18 m away raises
    // its alarm before audio.update() has seen the move. Measured: 12 of 12
    // events, real distances 5-43 m, all rejected as out of earshot against a
    // remembered position 0.6-1.9 km away. Any instant camera move has the same
    // shape, so the fix is to stop remembering.
    const camX = cameraRef.position.x;
    const camZ = cameraRef.position.z;
    const distanceM = Math.hypot(x - camX, z - camZ);
    if (distanceM > cfg.earshotM) return 0;
    if (ctx.currentTime - lastCallAt < CALL_MIN_GAP_S) return 0;
    lastCallAt = ctx.currentTime;
    callsPlayed++;

    const pan = panFrom(x, z, distanceM);
    const peak = cfg.gain * (1 - distanceM / cfg.earshotM) ** 1.5;
    // A random-length series, and deliberately not a metronome: each note varies
    // in pitch, loudness and spacing, because a fixed interval is what makes a
    // repeated sample sound like a repeated sample.
    const notes = cfg.notesMin + Math.floor(random() * (cfg.notesMax - cfg.notesMin + 1));
    let when = ctx.currentTime + 0.01;
    for (let i = 0; i < notes; i++) {
      whistle(cfg, peak * (i === 0 ? 1 : 0.7 + 0.3 * random()), pan, when, 0.97 + 0.06 * random());
      when += cfg.gapS[0] + (cfg.gapS[1] - cfg.gapS[0]) * random();
    }
    return notes;
  }

  // Which side a sound came from. The camera's right is (-fz, fx), with +X east
  // and +Z south (docs/ARCHITECTURE.md §6) - and taken from the live look
  // direction, for the same reason call() reads the live position.
  function panFrom(x, z, distanceM) {
    if (!cameraRef) return 0;
    let fwdX = 0;
    let fwdZ = -1;
    if (cameraRef.getWorldDirection) {
      cameraRef.getWorldDirection(_dir);
      const len = Math.hypot(_dir.x, _dir.z) || 1;
      fwdX = _dir.x / len;
      fwdZ = _dir.z / len;
    }
    const camX = cameraRef.position.x;
    const camZ = cameraRef.position.z;
    const d = Math.max(distanceM, 1e-3);
    return clamp(((x - camX) / d) * -fwdZ + ((z - camZ) / d) * fwdX, -1, 1);
  }

  // One note. `detune` scales both ends of the sweep, so a songbird's phrase can
  // move the pitch without changing the note's character; `durOverride` lets a
  // phrase set each note's length, where an alarm series uses one length for all.
  function whistle(cfg, peak, pan, at, detune = 1, durOverride = null) {
    const durS = durOverride ?? cfg.durS;
    const f0 = cfg.f0 * detune;
    const f1 = cfg.f1 * detune;
    const osc = ctx.createOscillator();
    // Triangle by default - more edge than a sine, which is what makes a whistle
    // carry. A species can ask for something richer (the nutcracker's sawtooth).
    osc.type = cfg.wave ?? 'triangle';
    osc.frequency.setValueAtTime(f0, at);
    osc.frequency.exponentialRampToValueAtTime(f1, at + durS);
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = (f0 + f1) / 2;
    band.Q.value = cfg.bandQ;

    // A rattle is amplitude, not pitch: chopping the tone at a few dozen Hz is
    // what makes a corvid's call harsh rather than musical. The base gain stays
    // above zero so it reads as a rattle and not as a stutter. Depth is what
    // separates a rattle from a tremolo - the nutcracker chops hard, a tawny
    // owl's hoot only wavers - so a voice can ask for a shallower one.
    const extras = [];
    let chain = band;
    if (cfg.rattleHz) {
      const rattleDepth = cfg.rattleDepth ?? 0.55;
      const chop = ctx.createGain();
      chop.gain.value = 1 - rattleDepth;
      const lfo = ctx.createOscillator();
      lfo.type = 'square';
      lfo.frequency.value = cfg.rattleHz;
      const depth = ctx.createGain();
      depth.gain.value = rattleDepth;
      lfo.connect(depth).connect(chop.gain);
      lfo.start(at);
      lfo.stop(at + durS + 0.02);
      band.connect(chop);
      chain = chop;
      extras.push(chop, lfo, depth);
    }

    const gain = ctx.createGain();
    const top = Math.max(peak, 2e-4);
    gain.gain.setValueAtTime(1e-4, at);
    gain.gain.exponentialRampToValueAtTime(top, at + CALL_ATTACK_S);
    // Held most of the way through, then let go. The extra length the user asked
    // for has to be a sustained note - a longer decay alone just sounds smeared.
    gain.gain.exponentialRampToValueAtTime(top * 0.8, at + durS * 0.7);
    gain.gain.exponentialRampToValueAtTime(1e-4, at + durS);
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    osc.connect(band);
    chain.connect(gain).connect(panner).connect(muffle);
    osc.start(at);
    osc.stop(at + durS + 0.02);
    osc.onended = () => {
      osc.disconnect();
      band.disconnect();
      gain.disconnect();
      panner.disconnect();
      for (const node of extras) node.disconnect();
    };
  }

  return {
    start,
    setEnabled,
    get enabled() { return enabled; },
    toggle() {
      setEnabled(!enabled);
      return enabled;
    },
    setSamplers(next) {
      samplers = { ...samplers, ...next };
      // The habitat tests above cached a "nothing lives here" for every cell
      // they saw, and main.js sets canopyAt only once the forest mask has
      // loaded - so those misses were decided without it. Drop them, and rescan
      // on the next tick rather than waiting out the interval.
      for (const map of singers) map.clear();
      sinceRescan = SINGER_RESCAN_S;
    },
    setWater(manifest) {
      earshot = manifest ? buildWaterEarshot(manifest) : null;
      return earshot;
    },
    update,
    call,
    get diag() { return diag; },
    get callsPlayed() { return callsPlayed; },
    get songsPlayed() { return songsPlayed; },
    get stepsPlayed() { return stepsPlayed; },
    get surface() { return lastSurface; },
    get surfaces() { return Object.keys(SURFACES); },
    get songsBySpecies() { return { ...songsBySpecies }; },
    get songbirds() { return SONGBIRDS.map((s) => s.name); },
    get context() { return ctx; },
  };
}
