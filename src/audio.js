import * as THREE from 'three';

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

const _dir = new THREE.Vector3();

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
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
  // The live camera, kept so alarm() can read where it is NOW - see the comment
  // there for why a remembered position was not good enough.
  let cameraRef = null;

  const diag = {
    started: false, enabled, strength: 0, altitude: 0, exposure: 0, canopy: 0,
    gust: 0, rain: 0, snow: 0, speedMps: 0, water: null, gains: {},
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

  function tick(dt, camera, weather) {
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
    });
  }

  function update(dt, camera, weather = null) {
    if (!layers || !camera) return;
    cameraRef = camera;

    const x = camera.position.x;
    const y = camera.position.y;
    const z = camera.position.z;
    if (lastX != null && dt > 1e-4) {
      const instant = Math.hypot(x - lastX, y - lastY, z - lastZ) / dt;
      // Smoothed, or one long frame reads as a gust of airspeed.
      speedMps += (instant - speedMps) * (1 - Math.exp(-dt / 0.3));
    }
    lastX = x;
    lastY = y;
    lastZ = z;

    tickAccum += dt;
    if (tickAccum < 1 / UPDATE_HZ) return;
    const tickDt = tickAccum;
    tickAccum = 0;
    tick(tickDt, camera, weather);
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

    // Which side it came from. The camera's right is (-fz, fx), with +X east and
    // +Z south (docs/ARCHITECTURE.md §6) - and taken from the live look
    // direction, for the same reason as the position above.
    let fwdX = 0;
    let fwdZ = -1;
    if (cameraRef.getWorldDirection) {
      cameraRef.getWorldDirection(_dir);
      const len = Math.hypot(_dir.x, _dir.z) || 1;
      fwdX = _dir.x / len;
      fwdZ = _dir.z / len;
    }
    const d = Math.max(distanceM, 1e-3);
    const pan = clamp(((x - camX) / d) * -fwdZ + ((z - camZ) / d) * fwdX, -1, 1);
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

  function whistle(cfg, peak, pan, at, detune = 1) {
    const f0 = cfg.f0 * detune;
    const f1 = cfg.f1 * detune;
    const osc = ctx.createOscillator();
    // Triangle by default - more edge than a sine, which is what makes a whistle
    // carry. A species can ask for something richer (the nutcracker's sawtooth).
    osc.type = cfg.wave ?? 'triangle';
    osc.frequency.setValueAtTime(f0, at);
    osc.frequency.exponentialRampToValueAtTime(f1, at + cfg.durS);
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = (f0 + f1) / 2;
    band.Q.value = cfg.bandQ;

    // A rattle is amplitude, not pitch: chopping the tone at a few dozen Hz is
    // what makes a corvid's call harsh rather than musical. The base gain stays
    // above zero so it reads as a rattle and not as a stutter.
    const extras = [];
    let chain = band;
    if (cfg.rattleHz) {
      const chop = ctx.createGain();
      chop.gain.value = 0.45;
      const lfo = ctx.createOscillator();
      lfo.type = 'square';
      lfo.frequency.value = cfg.rattleHz;
      const depth = ctx.createGain();
      depth.gain.value = 0.55;
      lfo.connect(depth).connect(chop.gain);
      lfo.start(at);
      lfo.stop(at + cfg.durS + 0.02);
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
    gain.gain.exponentialRampToValueAtTime(top * 0.8, at + cfg.durS * 0.7);
    gain.gain.exponentialRampToValueAtTime(1e-4, at + cfg.durS);
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    osc.connect(band);
    chain.connect(gain).connect(panner).connect(muffle);
    osc.start(at);
    osc.stop(at + cfg.durS + 0.02);
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
    },
    setWater(manifest) {
      earshot = manifest ? buildWaterEarshot(manifest) : null;
      return earshot;
    },
    update,
    call,
    get diag() { return diag; },
    get callsPlayed() { return callsPlayed; },
    get context() { return ctx; },
  };
}
