#!/usr/bin/env node
// Checks that the ambient audio (src/audio.js, phase 6) actually produces the
// sound the scene calls for - not merely that it runs without errors.
//
// The method matters here more than usual. Audio is the first feature in this
// project with no visual at all, so "I loaded it and heard something" is even
// weaker evidence than the screenshots that have already been wrong four times
// (docs/PROGRESS.md). Instead each case renders the real graph into an
// OfflineAudioContext - same nodes, same driving code, no audio device and no
// real-time dependency at all - and measures the power spectrum of the result
// with a Welch periodogram. So the assertions are about energy in a frequency
// band, which is as close to "what you would hear" as a test can get.
//
// Everything random is seeded (createAudio takes its own `random`), so the noise
// buffer, the gusts and the whistle repeats are identical run to run.
//
// Usage: tools/dev/start-dev.sh && node tools/test-audio.mjs

import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:5173';

// The offline cases below need no GPU, but the page itself is the real viewer:
// the last case drives it live, so it needs WebGL to get as far as spawning.
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
const problems = [];
page.on('pageerror', (err) => problems.push(err.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') problems.push(msg.text());
});
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

const result = await page.evaluate(async () => {
  const { createAudio, buildWaterEarshot } = await import('/src/audio.js');
  const base = document.querySelector('base')?.href ?? '/';
  const water = await fetch(`${base}data/water.json`).then((r) => r.json());
  const poi = await fetch(`${base}data/poi.json`).then((r) => r.json());

  const SR = 44100;
  const DUR_S = 2;

  function mulberry32(seed) {
    let a = seed;
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---- spectrum measurement ------------------------------------------------
  // In-place iterative radix-2 FFT. Written out rather than pulled in because
  // the whole analysis is 30 lines and a dependency for a test tool would ship
  // nothing to users but still need reviewing.
  function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        [re[i], re[j]] = [re[j], re[i]];
        [im[i], im[j]] = [im[j], im[i]];
      }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = (-2 * Math.PI) / len;
      const wr = Math.cos(ang);
      const wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cr = 1;
        let ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const ur = re[i + k];
          const ui = im[i + k];
          const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
          const vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
          re[i + k] = ur + vr;
          im[i + k] = ui + vi;
          re[i + k + len / 2] = ur - vr;
          im[i + k + len / 2] = ui - vi;
          const nr = cr * wr - ci * wi;
          ci = cr * wi + ci * wr;
          cr = nr;
        }
      }
    }
  }

  const N = 4096;
  const window = new Float64Array(N);
  for (let i = 0; i < N; i++) window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N);

  // Power in [loHz, hiHz] for every overlapping Hann-windowed segment (Welch).
  // The mean is what a steady bed needs - it gives a stable number rather than
  // one segment's luck. A BRIEF event needs the other end of the distribution,
  // and by more than seemed likely: a chaffinch sings for 1.5 s out of every 90,
  // so a loud phrase barely moves the mean - measured x1.5 for a wood that is
  // demonstrably full of birds. p95 was not enough either (x1.1), because a wood
  // has one or two singers near enough to carry and the rest at 100-200 m, so
  // even the top 5% of ninety seconds is mostly faint song over leaf rustle. The
  // max is the statistic that answers the question actually being asked - does
  // this band light up when the nearest bird sings - and it reads x45.
  function bandProfile(samples, loHz, hiHz) {
    const k0 = Math.max(1, Math.floor((loHz * N) / SR));
    const k1 = Math.min(N / 2 - 1, Math.ceil((hiHz * N) / SR));
    const vals = [];
    for (let start = 0; start + N <= samples.length; start += N / 2) {
      const re = new Float64Array(N);
      const im = new Float64Array(N);
      for (let i = 0; i < N; i++) re[i] = samples[start + i] * window[i];
      fft(re, im);
      let p = 0;
      for (let k = k0; k <= k1; k++) p += re[k] * re[k] + im[k] * im[k];
      vals.push(p / (N * N));
    }
    if (!vals.length) return { mean: 0, p95: 0, max: 0 };
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sorted = [...vals].sort((a, b) => a - b);
    return {
      mean,
      p95: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))],
      max: sorted[sorted.length - 1],
    };
  }

  function bandPower(samples, loHz, hiHz) {
    return bandProfile(samples, loHz, hiHz).mean;
  }

  // Counts the notes actually rendered, from the amplitude envelope: the whistles
  // peak near 0.45 while the noise bed sits below 0.1, so a threshold on the
  // envelope separates them cleanly. This measures the audio, not the intention -
  // the alarm() return value says what was scheduled, this says what came out.
  function noteOnsets(samples, thresholdFrac = 0.35) {
    const W = Math.floor(SR * 0.01); // 10 ms
    const env = [];
    for (let i = 0; i + W <= samples.length; i += W) {
      let peak = 0;
      for (let j = i; j < i + W; j++) {
        const v = Math.abs(samples[j]);
        if (v > peak) peak = v;
      }
      env.push(peak);
    }
    let max = 0;
    for (const v of env) if (v > max) max = v;
    const threshold = max * thresholdFrac;
    const onsets = [];
    const durations = [];
    let above = false;
    let runStart = 0;
    for (let k = 0; k < env.length; k++) {
      if (!above && env[k] > threshold) {
        above = true;
        runStart = k;
        // Notes are 0.45 s apart at the closest, so 0.2 s of separation cannot
        // merge two of them - but it does stop one note's envelope dipping mid-way
        // from being counted twice.
        if (!onsets.length || k * 0.01 - onsets[onsets.length - 1] > 0.2) onsets.push(k * 0.01);
      } else if (above && env[k] <= threshold) {
        above = false;
        durations.push((k - runStart) * 0.01);
      }
    }
    return {
      count: onsets.length,
      firstDurationS: durations[0] ?? 0,
      spanS: onsets.length > 1 ? onsets[onsets.length - 1] - onsets[0] : 0,
      peak: max,
    };
  }

  function rms(samples) {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
    return Math.sqrt(sum / Math.max(1, samples.length));
  }

  // ---- terrain stand-ins ---------------------------------------------------
  // Synthetic, not the real heightfield: the point of these cases is that a
  // given shape of ground produces a given sound, and a stub says exactly what
  // shape was tested. (The real sampler is exercised in the last case, and by
  // every other test tool.)
  const GROUND = {
    // 1,400 m valley floor with the ground rising away in every direction.
    valley: (x, z) => 1400 + (Math.abs(x) + Math.abs(z)) * 0.3,
    // 3,200 m summit, ground falling away in every direction.
    ridge: (x, z) => 3200 - (Math.abs(x) + Math.abs(z)) * 0.4,
    flat: () => 2000,
  };

  function makeCamera({ x = 0, y = null, z = 0, ground = GROUND.flat, facing = [0, -1] }) {
    return {
      position: { x, y: y ?? ground(x, z) + 1.7, z },
      getWorldDirection(v) {
        v.x = facing[0];
        v.y = 0;
        v.z = facing[1];
        return v;
      },
    };
  }

  async function render({
    ground = GROUND.flat, canopy = 0, weather = null, waterManifest = null,
    at = { x: 0, z: 0 }, facing = [0, -1], enabled = true, alarms = [], seed = 12345,
    // Alarm cases need a longer render than the steady-state ones: a marmot's
    // series can run to five notes ~0.65 s apart.
    renderS = DUR_S,
  }) {
    const ctx = new OfflineAudioContext(2, Math.floor(SR * renderS), SR);
    const audio = createAudio({
      context: ctx,
      immediate: true, // no time constants: the whole render is the steady state
      random: mulberry32(seed),
      canopyAt: () => canopy,
      sampleGroundHeight: ground,
      water: waterManifest,
    });
    audio.start();
    if (!enabled) audio.setEnabled(false);
    const camera = makeCamera({ ...at, ground, facing });
    audio.update(1 / 8, camera, weather);
    const fired = alarms.map((a) => audio.call(a));
    const diag = JSON.parse(JSON.stringify(audio.diag));
    const buffer = await ctx.startRendering();
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    // Steady-state window: past the filters' warm-up, and past the alarm calls
    // so a whistle cannot inflate a wind measurement.
    const steady = left.subarray(Math.floor(SR * 1.0));
    return {
      diag,
      fired,
      rms: rms(steady),
      rmsFull: rms(left),
      bands: {
        low: bandPower(steady, 80, 250), // windLow / the body of moving water
        mid: bandPower(steady, 600, 1600), // windHigh
        rain: bandPower(steady, 1400, 2600), // rain, and water's splash
        high: bandPower(steady, 2400, 4200), // rustle, and the alarm whistles
        veryHigh: bandPower(steady, 6000, 10000), // what the snow muffle removes
        lowMid: bandPower(left, 700, 1200), // where a corvid's rattle sits
      },
      // Whole-buffer, for the calls. bandPower is a mean over segments, so a
      // longer render is directly comparable with a shorter one.
      callBand: bandPower(left, 2600, 3800),
      callBandRight: bandPower(right, 2600, 3800),
      callBandLeft: bandPower(left, 2600, 3800),
      notes: noteOnsets(left),
      callsPlayed: audio.callsPlayed,
    };
  }

  const cases = {};

  // 1. Muted really is silent.
  cases.on = await render({ ground: GROUND.ridge });
  cases.muted = await render({ ground: GROUND.ridge, enabled: false });

  // 2. Wind: a summit against a sheltered valley floor.
  cases.valley = await render({ ground: GROUND.valley });
  cases.ridge = cases.on;

  // 3. Canopy: the leaves are audible, and the wood shelters what is behind them.
  cases.bare = await render({ ground: GROUND.flat, canopy: 0 });
  cases.wooded = await render({ ground: GROUND.flat, canopy: 1 });

  // 4. Water: the same waterfall 25 m away and 5 km away.
  const oneFall = {
    lakes: [], rivers: [],
    waterfalls: [{ name: 'test', dropM: 60, centerline: [[0, 1800, -40], [0, 1740, 0]] }],
  };
  cases.byTheFall = await render({ ground: GROUND.flat, waterManifest: oneFall, at: { x: 25, z: 0 } });
  cases.awayFromFall = await render({ ground: GROUND.flat, waterManifest: oneFall, at: { x: 5000, z: 0 } });

  // 5. Rain, and snow muffling everything.
  cases.dry = await render({ ground: GROUND.flat, canopy: 0.5 });
  cases.rainy = await render({ ground: GROUND.flat, canopy: 0.5, weather: { mod: { rain: 1 } } });
  cases.snowy = await render({ ground: GROUND.flat, canopy: 0.5, weather: { mod: { snow: 1 } } });

  // 6. Alarm calls: only the species that have one, only within earshot, and on
  //    the side they came from.
  const CALL_RENDER_S = 5;
  cases.noCall = await render({ ground: GROUND.flat, renderS: CALL_RENDER_S });
  cases.marmotCall = await render({
    ground: GROUND.flat, renderS: CALL_RENDER_S, alarms: [{ species: 'marmot', x: 0, z: -30 }],
  });
  cases.chamoisCall = await render({
    ground: GROUND.flat, renderS: CALL_RENDER_S, alarms: [{ species: 'chamois', x: 0, z: -30 }],
  });
  cases.ibexCall = await render({ ground: GROUND.flat, alarms: [{ species: 'ibex', x: 0, z: -30 }] });
  cases.farCall = await render({ ground: GROUND.flat, alarms: [{ species: 'marmot', x: 0, z: -900 }] });

  // The series has to be a random LENGTH, not a fixed repeat - which means
  // measuring several seeds and seeing different answers come out.
  const series = [];
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const shot = await render({
      ground: GROUND.flat, renderS: CALL_RENDER_S, seed,
      alarms: [{ species: 'marmot', x: 0, z: -30 }],
    });
    series.push({
      seed,
      scheduled: shot.fired[0],
      rendered: shot.notes.count,
      firstNoteS: Number(shot.notes.firstDurationS.toFixed(2)),
      spanS: Number(shot.notes.spanS.toFixed(2)),
    });
  }
  // Facing north (0, -1): +X is the camera's right.
  cases.callRight = await render({ ground: GROUND.flat, alarms: [{ species: 'marmot', x: 30, z: 0 }] });
  cases.callLeft = await render({ ground: GROUND.flat, alarms: [{ species: 'marmot', x: -30, z: 0 }] });
  // Two animals bolting on the same frame must not become a chord.
  cases.herdCall = await render({
    ground: GROUND.flat,
    alarms: [
      { species: 'marmot', x: 0, z: -30 }, { species: 'marmot', x: 4, z: -31 },
      { species: 'marmot', x: -6, z: -28 }, { species: 'chamois', x: 8, z: -35 },
    ],
  });

  // 6b. The bird calls (2026-08-05, src/birds.js). Two things worth measuring: a
  //     chough answers itself, so it must be a series; and a nutcracker is a RATTLE,
  //     which means its energy has to sit low and broad rather than in a narrow
  //     whistle band - a rattle is amplitude modulation, not a pitch choice.
  //     Both on flat ground, and compared against cases.noCall on the same ground.
  //     The first version put them on a RIDGE, where the wind is at full strength -
  //     which broke both measurements at once: the noise bed crossed the envelope
  //     threshold 22 times (counting gusts as notes) and windHigh sits at 700-1600
  //     Hz, exactly the band a corvid rattle occupies. The reference has to be quiet
  //     in the band under test.
  cases.choughCall = await render({
    ground: GROUND.flat, renderS: CALL_RENDER_S, alarms: [{ species: 'chough', x: 0, z: -40 }],
  });
  cases.nutcrackerCall = await render({
    ground: GROUND.flat, renderS: CALL_RENDER_S, alarms: [{ species: 'nutcracker', x: 0, z: -30 }],
  });

  // 6c. Songbirds (2026-08-07). These need TIME, not one tick: a singer's clock
  //     runs in tens of seconds, so the only honest measurement is to drive the
  //     real update loop at the real tick rate for minutes of simulated time and
  //     count what came out. Nothing is rendered for the rate cases - "how often
  //     does a wood sing" is a count, and a 4-minute buffer to answer it would be
  //     40 MB of silence with a dozen notes in it.
  const SONG_GROUND = {
    forest: () => 1500, // montane wood: chaffinch, coal tit, cuckoo, and the owl at night
    alpine: () => 2400, // above the treeline: the pipit's ground and nobody else's
    glacier: () => 3600, // above everything that sings
  };

  // The camera WALKS through every one of these. Two reasons, and the first is a
  // fault the standing-still version had: the lattice is deterministic, so
  // whether a low-density species happens to have anyone within earshot of one
  // fixed point is a coin flip fixed by the hash - the first run measured "does
  // the origin sing", not "does a wood sing", and reported zero cuckoos from a
  // wood that has them. The second is that a static camera never makes
  // rescanSingers() find anything, so half the code under test never ran.
  const WALK_MPS = 4; // src/controls.js's real walking speed

  function songRun({
    ground, canopy, minutes = 4, weather = null, night = 0, seed = 4242, at = { x: 0, z: 0 },
  }) {
    // A short context: it is never rendered, and scheduling a note past the end
    // of an OfflineAudioContext is legal and simply never sounds.
    const ctx = new OfflineAudioContext(2, Math.floor(SR * 0.2), SR);
    const audio = createAudio({
      context: ctx, immediate: true, random: mulberry32(seed),
      canopyAt: () => canopy, sampleGroundHeight: ground,
    });
    audio.start();
    const camera = makeCamera({ ...at, ground });
    const dt = 1 / 8; // the audio tick rate itself, so every update() is a tick
    const steps = Math.round((minutes * 60) / dt);
    const t = performance.now();
    for (let i = 0; i < steps; i++) {
      camera.position.x = at.x + i * dt * WALK_MPS;
      audio.update(dt, camera, weather, { night });
    }
    const msPerTick = (performance.now() - t) / steps;
    return {
      minutes,
      songs: audio.songsPlayed,
      perMinute: audio.songsPlayed / minutes,
      by: audio.songsBySpecies,
      singers: audio.diag.singers,
      night: audio.diag.night,
      msPerTick,
    };
  }

  const song = {
    forest: songRun({ ground: SONG_GROUND.forest, canopy: 0.7 }),
    alpine: songRun({ ground: SONG_GROUND.alpine, canopy: 0 }),
    glacier: songRun({ ground: SONG_GROUND.glacier, canopy: 0 }),
    forestNight: songRun({ ground: SONG_GROUND.forest, canopy: 0.7, night: 1 }),
    forestDusk: songRun({ ground: SONG_GROUND.forest, canopy: 0.7, night: 0.45 }),
    forestRain: songRun({ ground: SONG_GROUND.forest, canopy: 0.7, weather: { mod: { rain: 1 } } }),
  };

  // And then the sound itself. Day and night in the SAME wood is the controlled
  // comparison: identical canopy, identical wind bed, and the only difference is
  // who is awake - so the song band has to rise by day and the owl's band by
  // night. Comparing a wood against a glacier would confound the birds with the
  // leaf rustle that only one of them has.
  //
  // Closed canopy (0.9), deliberately: it is past the cuckoo's canopyMax, and a
  // cuckoo's lower note is 581 Hz through a Q of 2.2, which spills straight into
  // the window the owl is measured in. So the day render is chaffinch and coal
  // tit only, and the night render is owl only, with nothing shared between the
  // two bands under test.
  const RENDER_CANOPY = 0.9;
  async function songRender({ ground, canopy, night, seconds = 90, seed = 4242 }) {
    const ctx = new OfflineAudioContext(2, Math.floor(SR * seconds), SR);
    const audio = createAudio({
      context: ctx, immediate: true, random: mulberry32(seed),
      canopyAt: () => canopy, sampleGroundHeight: ground,
    });
    audio.start();
    const camera = makeCamera({ x: 0, z: 0, ground });
    const dt = 1 / 8;
    for (let i = 0; i < Math.round(seconds / dt); i++) {
      camera.position.x = i * dt * WALK_MPS;
      audio.update(dt, camera, null, { night });
    }
    const buffer = await ctx.startRendering();
    const left = buffer.getChannelData(0);
    return {
      songs: audio.songsPlayed,
      by: audio.songsBySpecies,
      // 2.4-5.5k is where the chaffinch and the coal tit live; 400-540 is the
      // owl's hoot, more than two octaves below anything else in this scene.
      songBand: bandProfile(left, 2400, 5500),
      owlBand: bandProfile(left, 400, 540),
      notes: noteOnsets(left, 0.45),
      rms: rms(left),
    };
  }
  const songDay = await songRender({ ground: SONG_GROUND.forest, canopy: RENDER_CANOPY, night: 0 });
  const songNight = await songRender({ ground: SONG_GROUND.forest, canopy: RENDER_CANOPY, night: 1 });

  // 6d. Footsteps (2026-08-07). Every scene below is chosen so that NOTHING
  //     SINGS in it - a songbird phrase would land in the same envelope the step
  //     onsets are counted from. 1,700 m with no canopy is under the pipit's
  //     floor and over nothing else's; 2,500 m with canopy is over every forest
  //     bird's ceiling; 3,600 m is above everything.
  //
  //     Grass and scree share a ground HEIGHT (1,700 m) and differ only in
  //     slope, so the wind bed behind them is identical and the only thing that
  //     changed is what is underfoot. Putting scree on a 3,600 m summit instead
  //     would have compared two surfaces through two completely different winds.
  const STEP_GROUND = {
    flat: () => 1700,
    // A constant 35-degree fall line along z, so walking along +x stays at
    // 1,700 m the whole way while standing on ground steep enough to be scree.
    steep: (x, z) => 1700 + z * 0.7,
    high: () => 3600,
    wooded: () => 2500,
  };

  async function stepRender({
    ground, canopy = 0, weather = null, mode = 'walk', moving = true,
    seconds = 20, seed = 7331,
  }) {
    const ctx = new OfflineAudioContext(2, Math.floor(SR * seconds), SR);
    const audio = createAudio({
      context: ctx, immediate: true, random: mulberry32(seed),
      canopyAt: () => canopy, sampleGroundHeight: ground,
    });
    audio.start();
    const camera = makeCamera({ x: 0, z: 0, ground });
    const dt = 1 / 8;
    const mps = mode === 'walk' ? WALK_MPS : 60;
    for (let i = 0; i < Math.round(seconds / dt); i++) {
      if (moving) camera.position.x = i * dt * mps;
      audio.update(dt, camera, weather, null, { mode });
    }
    const buffer = await ctx.startRendering();
    const left = buffer.getChannelData(0);
    return {
      steps: audio.stepsPlayed,
      surface: audio.surface,
      cadenceHz: audio.stepsPlayed / seconds,
      onsets: noteOnsets(left, 0.45),
      bands: {
        wet: bandProfile(left, 250, 600), // where a squelch sits
        soft: bandProfile(left, 600, 1200), // turf and forest floor
        stone: bandProfile(left, 1600, 2800), // loose rock
        crunch: bandProfile(left, 2600, 4200), // snow
      },
      rms: rms(left),
    };
  }

  const step = {
    grass: await stepRender({ ground: STEP_GROUND.flat }),
    standing: await stepRender({ ground: STEP_GROUND.flat, moving: false }),
    flying: await stepRender({ ground: STEP_GROUND.flat, mode: 'fly' }),
    scree: await stepRender({ ground: STEP_GROUND.steep }),
    screeHigh: await stepRender({ ground: STEP_GROUND.high }),
    forest: await stepRender({ ground: STEP_GROUND.wooded, canopy: 0.6 }),
    // Its own silent-footed reference: a wood at 2,500 m is a different bed from
    // open ground at 1,700 m (canopy shelters the wind and adds rustle), so
    // reading the forest row against the flat one would compare two scenes and
    // call the difference footsteps.
    standingForest: await stepRender({ ground: STEP_GROUND.wooded, canopy: 0.6, moving: false }),
    snow: await stepRender({ ground: STEP_GROUND.flat, weather: { mod: { snow: 1 } } }),
    wet: await stepRender({ ground: STEP_GROUND.flat, weather: { mod: { wet: 1 } } }),
  };

  // 7. The real hydrology, at the real spawn point: is the Savara audible from
  //    the Le Pont trailhead the viewer opens at?
  const earshot = buildWaterEarshot(water);
  const lePont = poi.pois.find((p) => p.name === 'Le Pont' && p.category === 'trailhead');
  const atSpawn = earshot.query(lePont.local.x, lePont.local.z);
  cases.atSpawn = await render({
    ground: GROUND.valley, canopy: 0.3, waterManifest: water,
    at: { x: lePont.local.x, z: lePont.local.z },
  });

  // Index cost: this is the only new per-tick data structure, and §10 says to
  // check that before shipping it, not after.
  const t0 = performance.now();
  const QUERIES = 2000;
  for (let i = 0; i < QUERIES; i++) earshot.query(lePont.local.x + i * 3, lePont.local.z + i);
  const perQueryMs = (performance.now() - t0) / QUERIES;

  return {
    cases,
    series,
    song,
    songDay,
    songNight,
    step,
    earshot: { points: earshot.count, cells: earshot.cells, perQueryMs },
    spawn: {
      x: Math.round(lePont.local.x), z: Math.round(lePont.local.z),
      river: Math.round(atSpawn.river.distanceM),
      lake: Number.isFinite(atSpawn.lake.distanceM) ? Math.round(atSpawn.lake.distanceM) : null,
      waterfall: Number.isFinite(atSpawn.waterfall.distanceM) ? Math.round(atSpawn.waterfall.distanceM) : null,
    },
  };
});

// ---- the real page, with a real AudioContext -------------------------------
// Everything above renders offline, which proves the graph and the mapping from
// scene to sound but deliberately bypasses the two things only a live context
// has: the autoplay policy, and main.js's wiring. So: wait for the viewer to
// spawn at Le Pont, click (the gesture), and read what the running app is
// actually driving. Headless has no audio device, so context.state is reported
// rather than asserted - the assertions are on our own code.
await page.waitForFunction(() => {
  const text = document.getElementById('nav-position')?.textContent ?? '';
  return /alt \d+ m/.test(text) && !text.includes('alt 3000 m');
}, null, { timeout: 120000 });

const beforeClick = await page.evaluate(() => ({
  started: window.__pngp.audio.diag.started,
  context: !!window.__pngp.audio.context,
}));
await page.mouse.click(320, 200);
await page.waitForTimeout(1500);
const live = await page.evaluate(() => {
  const audio = window.__pngp.audio;
  const d = audio.diag;
  return {
    started: d.started,
    state: audio.context?.state ?? null,
    sampleRate: audio.context?.sampleRate ?? null,
    strength: d.strength,
    canopy: d.canopy,
    altitude: d.altitude,
    exposure: d.exposure,
    gains: d.gains,
    riverM: d.water?.river?.distanceM ?? null,
    hud: document.getElementById('audio-diag')?.textContent ?? null,
  };
});

// Walking has to change what you hear - that is the whole premise.
const beforeWalk = live.gains;
await page.keyboard.down('KeyW');
await page.waitForTimeout(3000);
await page.keyboard.up('KeyW');
const walked = await page.evaluate(() => {
  const d = window.__pngp.audio.diag;
  return { gains: d.gains, riverM: d.water?.river?.distanceM ?? null };
});

// Songbirds against the REAL heightfield and the REAL canopy mask, which is the
// one thing the offline cases cannot cover - every one of them samples a stub.
// Placed HERE, before the 'G' sweep: after five teleports the camera is 18 m
// from a squirrel, which lives in canopy >= 0.9, so measuring afterwards would
// be measuring a wood and calling it Le Pont. Walking throughout, both because
// that is how anyone uses the viewer and because a stationary camera only ever
// samples one draw of a deterministic lattice.
// Le Pont is 1,950 m of open valley floor (canopy 0.00 in the readout above), so
// it is pipit ground - but a chaffinch is expected too, and the first version of
// this asserted it must not be. Habitat is tested at the SINGER's position, not
// the listener's, which is the right way round: Valsavarenche has larch on both
// valley sides, and standing on open ground a couple of hundred metres from a
// wood you hear the wood. What can be asserted from the shift alone is that
// nothing NOCTURNAL sings in the daylight the viewer opens in.
await page.keyboard.down('KeyW');
const liveSong = await page.evaluate(async () => {
  const audio = window.__pngp.audio;
  await new Promise((r) => setTimeout(r, 45000));
  return {
    singers: audio.diag.singers,
    songs: audio.songsPlayed,
    by: audio.songsBySpecies,
    // The 45 s of held 'W' above is also the only real-terrain test the
    // footsteps get: real ground, real slope, the real canopy mask.
    steps: audio.stepsPlayed,
    surface: audio.surface,
  };
});
await page.keyboard.up('KeyW');
// And they must stop when the walking does.
await page.waitForTimeout(1200);
const liveStopped = await page.evaluate(() => ({
  steps: window.__pngp.audio.stepsPlayed,
  surface: window.__pngp.audio.surface,
}));
await page.waitForTimeout(1500);
const liveStillStopped = await page.evaluate(() => window.__pngp.audio.stepsPlayed);

// Time of day reaches the audio at all: the slider moves the same `night` weight
// the lights use, and audio.js reads it from lighting rather than re-deriving it.
const liveNight = await page.evaluate(() => {
  const el = document.getElementById('env-time');
  el.value = '0.8'; // the night preset itself
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return new Promise((r) => setTimeout(() => r({
    night: window.__pngp.audio.diag.night,
    label: document.getElementById('env-time-label')?.textContent ?? '',
  }), 400));
});
// Put it back, so the 'G' sweep below runs in the daylight it was written for.
await page.evaluate(() => {
  const el = document.getElementById('env-time');
  el.value = '0.15';
  el.dispatchEvent(new Event('input', { bubbles: true }));
});

// The dev 'G' key, which is how the animals are actually inspected: it teleports
// the camera 18 m from the nearest animal of the next species and steps the
// wildlife in the same handler. That is inside the alert radius of every fleeing
// species, so the marmot and chamois presses must produce a whistle - the user
// reported on 2026-08-05 that they never did, and this is the reproduction.
const gPresses = [];
for (let i = 0; i < 5; i++) {
  await page.keyboard.press('KeyG');
  await page.waitForTimeout(600);
  gPresses.push(await page.evaluate(() => ({
    note: document.getElementById('dev-note')?.textContent ?? '',
    calls: window.__pngp.audio.callsPlayed,
  })));
}

// 'M' and the checkbox are two views of one state.
await page.keyboard.press('KeyM');
await page.waitForTimeout(200);
const afterM = await page.evaluate(() => ({
  enabled: window.__pngp.audio.enabled,
  checkbox: document.getElementById('env-audio').checked,
}));

await browser.close();

const { cases, series, song, songDay, songNight, step, earshot, spawn } = result;
const e = (v) => v.toExponential(2);
const ratio = (a, b) => (b > 0 ? a / b : Infinity);

console.log(`Earshot index: ${earshot.points} points in ${earshot.cells} cells, `
  + `${earshot.perQueryMs.toFixed(4)} ms per query (once per audio tick, 8 Hz)\n`);

console.log('Wind:');
console.log(`  valley 1400 m, sheltered : strength ${cases.valley.diag.strength.toFixed(2)}`
  + ` (alt ${cases.valley.diag.altitude.toFixed(2)}, exposure ${cases.valley.diag.exposure.toFixed(2)})`
  + ` · low ${e(cases.valley.bands.low)} · mid ${e(cases.valley.bands.mid)}`);
console.log(`  summit 3200 m, exposed   : strength ${cases.ridge.diag.strength.toFixed(2)}`
  + ` (alt ${cases.ridge.diag.altitude.toFixed(2)}, exposure ${cases.ridge.diag.exposure.toFixed(2)})`
  + ` · low ${e(cases.ridge.bands.low)} · mid ${e(cases.ridge.bands.mid)}`);
console.log(`  ridge/valley             : low x${ratio(cases.ridge.bands.low, cases.valley.bands.low).toFixed(1)}`
  + `, mid x${ratio(cases.ridge.bands.mid, cases.valley.bands.mid).toFixed(1)}`);

console.log('\nCanopy (same ground, same weather):');
console.log(`  bare   : rustle band ${e(cases.bare.bands.high)} · wind body ${e(cases.bare.bands.low)}`);
console.log(`  wooded : rustle band ${e(cases.wooded.bands.high)} · wind body ${e(cases.wooded.bands.low)}`);
console.log(`  wooded/bare : rustle x${ratio(cases.wooded.bands.high, cases.bare.bands.high).toFixed(1)}`
  + `, wind body x${ratio(cases.wooded.bands.low, cases.bare.bands.low).toFixed(2)} (a wood is a windbreak)`);

console.log('\nWater (a 60 m waterfall):');
console.log(`  at 25 m  : rms ${cases.byTheFall.rms.toFixed(4)} · low ${e(cases.byTheFall.bands.low)}`
  + ` · gains ${cases.byTheFall.diag.gains.waterLow.toFixed(2)}/${cases.byTheFall.diag.gains.waterHigh.toFixed(2)}`);
console.log(`  at 5 km  : rms ${cases.awayFromFall.rms.toFixed(4)} · low ${e(cases.awayFromFall.bands.low)}`
  + ` · gains ${cases.awayFromFall.diag.gains.waterLow.toFixed(2)}/${cases.awayFromFall.diag.gains.waterHigh.toFixed(2)}`);

console.log('\nWeather:');
console.log(`  dry   : rain band ${e(cases.dry.bands.rain)} · 6-10k ${e(cases.dry.bands.veryHigh)}`);
console.log(`  rain  : rain band ${e(cases.rainy.bands.rain)} (x${ratio(cases.rainy.bands.rain, cases.dry.bands.rain).toFixed(1)})`);
console.log(`  snow  : 6-10k ${e(cases.snowy.bands.veryHigh)}`
  + ` (x${ratio(cases.snowy.bands.veryHigh, cases.dry.bands.veryHigh).toFixed(2)} - muffled)`);

console.log('\nAlarm calls:');
console.log(`  quiet scene      : 2.6-3.8k ${e(cases.noCall.callBand)}`);
console.log(`  marmot at 30 m   : 2.6-3.8k ${e(cases.marmotCall.callBand)}`
  + ` (x${ratio(cases.marmotCall.callBand, cases.noCall.callBand).toFixed(0)}), notes=${cases.marmotCall.fired}`);
console.log(`  chamois at 30 m  : 2.6-3.8k ${e(cases.chamoisCall.callBand)}, notes=${cases.chamoisCall.fired}`);
console.log(`  ibex at 30 m     : notes=${cases.ibexCall.fired} (no call for this species)`);
console.log(`  marmot at 900 m  : notes=${cases.farCall.fired} (out of earshot)`);
console.log(`  from the right   : R/L ${ratio(cases.callRight.callBandRight, cases.callRight.callBandLeft).toFixed(1)}`);
console.log(`  from the left    : R/L ${ratio(cases.callLeft.callBandRight, cases.callLeft.callBandLeft).toFixed(2)}`);
console.log(`  4 bolting at once: ${cases.herdCall.callsPlayed} call(s) played`);
console.log('  the marmot series, one row per seed (scheduled / rendered / first note / span):');
for (const s of series) {
  console.log(`    seed ${s.seed}: ${s.scheduled} notes scheduled, ${s.rendered} rendered,`
    + ` first ${s.firstNoteS.toFixed(2)} s, span ${s.spanS.toFixed(2)} s`);
}

console.log('\nBird calls:');
console.log(`  chough at 40 m   : ${cases.choughCall.fired} notes scheduled,`
  + ` ${cases.choughCall.notes.count} rendered, span ${cases.choughCall.notes.spanS.toFixed(2)} s`);
console.log(`  nutcracker 30 m  : ${cases.nutcrackerCall.fired} notes,`
  + ` 0.7-1.2k ${e(cases.nutcrackerCall.bands.lowMid)} (x${ratio(cases.nutcrackerCall.bands.lowMid, cases.noCall.bands.lowMid).toFixed(0)} over the same scene silent),`
  + ` and ${(cases.nutcrackerCall.bands.lowMid / Math.max(cases.nutcrackerCall.bands.high, 1e-12)).toFixed(1)}x more energy low than at 2.4-4.2k`);

console.log('\nSongbirds (4 simulated minutes each, driven at the real 8 Hz tick):');
const who = (r) => Object.entries(r.by).filter(([, n]) => n > 0)
  .map(([k, n]) => `${k} ${n}`).join(', ') || 'nobody';
for (const [name, r] of Object.entries(song)) {
  console.log(`  ${name.padEnd(12)}: ${r.perMinute.toFixed(1)} songs/min`
    + ` · ${r.singers} singers in earshot · ${who(r)}`);
}
console.log(`  cost         : ${song.forest.msPerTick.toFixed(4)} ms per audio tick (8 Hz), forest`);

console.log('\nThe same closed wood, 90 s rendered, walking, by day and by night');
console.log('(max across Welch segments - see the comment on bandProfile for why not the mean):');
const band3 = (b) => `mean ${e(b.mean)} p95 ${e(b.p95)} max ${e(b.max)}`;
console.log(`  day   : ${songDay.songs} songs (${who(songDay)}) · ${songDay.notes.count} onsets`);
console.log(`          2.4-5.5k ${band3(songDay.songBand)} · 400-540 ${band3(songDay.owlBand)}`);
console.log(`  night : ${songNight.songs} songs (${who(songNight)}) · ${songNight.notes.count} onsets`);
console.log(`          2.4-5.5k ${band3(songNight.songBand)} · 400-540 ${band3(songNight.owlBand)}`);
console.log(`  day/night : song band max x${ratio(songDay.songBand.max, songNight.songBand.max).toFixed(1)},`
  + ` owl band max x${ratio(songNight.owlBand.max, songDay.owlBand.max).toFixed(1)} the other way`);

console.log('\nFootsteps (20 s each, walking at the real 4 m/s, in scenes where nothing sings):');
for (const [name, r] of Object.entries(step)) {
  console.log(`  ${name.padEnd(10)}: ${String(r.steps).padStart(3)} steps`
    + ` · ${r.cadenceHz.toFixed(2)} Hz · surface ${r.surface ?? '-'}`
    + ` · ${r.onsets.count} onsets`);
}
// Every row is read against `standing`, which is the same scene with the same
// wind and no footfalls - so the numbers are what the steps ADDED, not what the
// bed happens to have in that band.
console.log('  loudest segment per band, as a multiple of the same scene standing still:');
const quietRef = (name) => (name === 'forest' ? step.standingForest : step.standing);
const vsStanding = (name) => ['wet', 'soft', 'stone', 'crunch']
  .map((b) => `${b} x${ratio(step[name].bands[b].max, quietRef(name).bands[b].max).toFixed(1)}`).join(' · ');
for (const name of ['grass', 'forest', 'scree', 'snow', 'wet']) {
  console.log(`    ${name.padEnd(7)}: ${vsStanding(name)}`);
}
console.log(`  rms walking/standing on grass: x${ratio(step.grass.rms, step.standing.rms).toFixed(2)}`);

console.log('\nAt the Le Pont spawn, with the real hydrology:');
console.log(`  (${spawn.x}, ${spawn.z}) · nearest river ${spawn.river} m`
  + ` · lake ${spawn.lake ?? '-'} m · waterfall ${spawn.waterfall ?? '-'} m`);
console.log(`  water gains ${cases.atSpawn.diag.gains.waterLow.toFixed(3)}/${cases.atSpawn.diag.gains.waterHigh.toFixed(3)}`
  + ` · rms ${cases.atSpawn.rms.toFixed(4)}`);

console.log(`\nMute: rms ${cases.muted.rms.toExponential(2)} against ${cases.on.rms.toFixed(4)} unmuted`);

console.log('\nThe running viewer, live context:');
console.log(`  before the first click : started=${beforeClick.started}, context=${beforeClick.context}`);
console.log(`  after it              : started=${live.started}, state=${live.state}, ${live.sampleRate} Hz`);
console.log(`  driven at the spawn   : wind ${live.strength?.toFixed(2)}`
  + ` (alt ${live.altitude?.toFixed(2)}, exp ${live.exposure?.toFixed(2)}), canopy ${live.canopy?.toFixed(2)}`
  + `, river ${live.riverM != null && Number.isFinite(live.riverM) ? `${Math.round(live.riverM)} m` : '-'}`);
console.log(`  gains                 : ${Object.entries(live.gains ?? {}).map(([k, v]) => `${k} ${v.toFixed(3)}`).join(', ')}`);
console.log(`  after walking 3 s     : river ${walked.riverM != null && Number.isFinite(walked.riverM) ? `${Math.round(walked.riverM)} m` : '-'}`
  + `, water ${walked.gains.waterLow.toFixed(3)}/${walked.gains.waterHigh.toFixed(3)}`);
console.log('  dev \'G\' walk-up:');
for (const [i, g] of gPresses.entries()) {
  console.log(`    ${i + 1}. ${g.note || '(no note)'} -> ${g.calls} call(s) played so far`);
}
console.log('  songbirds, 45 s walking from Le Pont (real terrain + real canopy mask):');
console.log(`    ${liveSong.singers} singers tracked (some out of earshot, some nocturnal),`
  + ` ${liveSong.songs} songs`
  + ` (${Object.entries(liveSong.by).filter(([, n]) => n > 0).map(([k, n]) => `${k} ${n}`).join(', ') || 'nobody'})`);
console.log(`    ${liveSong.steps} footsteps over the same 45 s, on ${liveSong.surface ?? '-'};`
  + ` ${liveStillStopped - liveStopped.steps} more in the 1.5 s after letting go of W`);
console.log(`  time slider to night  : audio night ${liveNight.night.toFixed(2)}, label "${liveNight.label}"`);
console.log(`  'M'                   : enabled=${afterM.enabled}, checkbox=${afterM.checkbox}`);

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

// Thresholds are ratios, deliberately far from the measured values: this asserts
// the direction and rough size of each effect, not a particular mix.
check(cases.muted.rms < cases.on.rms * 0.01, 'muting did not silence the graph');
check(cases.on.rms > 0.005, 'the unmuted graph is producing (almost) nothing');
check(ratio(cases.ridge.bands.low, cases.valley.bands.low) > 1.5,
  'an exposed summit is not windier than a sheltered valley (low band)');
check(ratio(cases.ridge.bands.mid, cases.valley.bands.mid) > 1.5,
  'an exposed summit is not windier than a sheltered valley (mid band)');
check(ratio(cases.wooded.bands.high, cases.bare.bands.high) > 1.5,
  'canopy did not add leaf rustle');
check(cases.wooded.bands.low < cases.bare.bands.low,
  'a wood did not shelter the wind behind it');
check(ratio(cases.byTheFall.bands.low, cases.awayFromFall.bands.low) > 3,
  'standing by a waterfall does not sound different from 5 km away');
check(cases.awayFromFall.diag.gains.waterLow < 1e-6,
  'water is audible 5 km from the only water in the scene');
check(ratio(cases.rainy.bands.rain, cases.dry.bands.rain) > 2, 'rain is inaudible');
check(cases.snowy.bands.veryHigh < cases.dry.bands.veryHigh * 0.5,
  'falling snow did not muffle the high end');
check(cases.marmotCall.fired[0] > 0 && ratio(cases.marmotCall.callBand, cases.noCall.callBand) > 5,
  'a marmot alarm whistle was not audible');
check(cases.ibexCall.fired[0] === 0, 'an ibex produced a call it does not have');
check(cases.farCall.fired[0] === 0, 'a marmot 900 m away was still audible');
// The user's request (2026-08-05): longer, and repeated a random number of times.
check(series.every((s) => s.rendered >= 2),
  'a marmot alarm was a single note somewhere - it should always be a series');
check(series.every((s) => s.rendered === s.scheduled),
  'the notes that came out of the render do not match the notes scheduled');
check(new Set(series.map((s) => s.rendered)).size >= 2,
  'every seed produced the same number of notes - the series length is not random');
// firstNoteS is the SUSTAINED part of a note - the time its envelope stays above
// 35% of peak, so ~0.21 s of a 0.3 s whistle, against ~0.05 s of the 0.16 s
// version the user asked to lengthen.
check(series.every((s) => s.firstNoteS >= 0.18),
  'the notes are still as short as the version the user asked to lengthen');
check(series.every((s) => s.spanS > 0.4),
  'the notes are not spread out in time - a series has to read as separate whistles');
check(cases.chamoisCall.fired[0] > 0 && cases.chamoisCall.notes.firstDurationS < 0.2,
  'the chamois call is missing, or no longer shorter than the marmot series');
check(ratio(cases.callRight.callBandRight, cases.callRight.callBandLeft) > 2,
  'a call from the right did not come from the right');
check(ratio(cases.callLeft.callBandRight, cases.callLeft.callBandLeft) < 0.5,
  'a call from the left did not come from the left');
check(cases.herdCall.callsPlayed === 1, 'a whole herd bolting played more than one call at once');
check(cases.choughCall.fired[0] >= 2 && cases.choughCall.notes.count === cases.choughCall.fired[0],
  'a chough call is not the series it should be - a flock answers itself');
check(cases.nutcrackerCall.fired[0] > 0,
  'the nutcracker call did not play');
check(ratio(cases.nutcrackerCall.bands.lowMid, cases.noCall.bands.lowMid) > 20,
  'the nutcracker rattle is inaudible in its own band');
check(cases.nutcrackerCall.bands.lowMid > cases.nutcrackerCall.bands.high,
  'the nutcracker call is not a low harsh rattle - it has more energy up where the whistles live');
// Songbirds. Habitat first: each of these is a species that must NOT be there,
// which is the assertion a total song count would hide.
check(song.forest.by.chaffinch > 0 && song.forest.by.coaltit > 0,
  'a montane wood at 1,500 m produced no chaffinch or no coal tit');
check(song.forest.by.pipit === 0, 'a water pipit sang inside a closed wood at 1,500 m');
check(song.alpine.by.pipit > 0, 'alpine grassland at 2,400 m produced no pipit');
check(song.alpine.by.chaffinch === 0 && song.alpine.by.coaltit === 0,
  'a forest bird sang above the treeline');
check(song.glacier.songs === 0, 'something sang at 3,600 m, above everything that sings');
// Day and night. The gate is on whether a bird sings at all, not on how loud.
check(song.forestNight.by.chaffinch === 0 && song.forestNight.by.coaltit === 0
  && song.forestNight.by.cuckoo === 0,
  'the day birds were still singing at night');
check(song.forestNight.by.tawnyowl > 0, 'the night wood is silent - no tawny owl');
check(song.forest.by.tawnyowl === 0, 'a tawny owl hooted at midday');
check(song.forestDusk.songs > 0 && song.forestDusk.by.tawnyowl > 0,
  'dusk is not a crossover - it should have both the last song and the first owl');
// The user asked for "discreto - si nota se ascolti". A wood that sings less
// than once a minute is indistinguishable from the silence this replaced; one
// that sings every few seconds is the soundtrack they did not ask for.
check(song.forest.perMinute >= 1.5 && song.forest.perMinute <= 20,
  `a wood sings ${song.forest.perMinute.toFixed(1)} times a minute - not the "discreet" density asked for`);
check(song.alpine.perMinute >= 1 && song.alpine.perMinute <= 20,
  `alpine grassland sings ${song.alpine.perMinute.toFixed(1)} times a minute`);
// Rain does not stop the clocks, it drops the level - so the far singers fall
// under the audibility floor and fewer songs are actually played.
check(song.forestRain.songs < song.forest.songs,
  'heavy rain did not quieten the wood at all');
// And the sound itself, in the one controlled comparison available: the same
// wood, same canopy, same wind bed, different hour.
// Asserted on the loudest segment, not the mean or even p95. A wood has one or
// two singers close enough to carry and the rest at 100-200 m, so 5% of ninety
// seconds is still mostly faint song plus leaf rustle. The question worth
// asking is whether the band lights up when the NEAREST bird sings, and that is
// the maximum. Measured 45x and 10x against thresholds of 3 - this asserts the
// effect exists, not the mix.
check(ratio(songDay.songBand.max, songNight.songBand.max) > 3,
  'the wood does not sound different at 2.4-5.5 kHz by day than by night');
check(ratio(songNight.owlBand.max, songDay.owlBand.max) > 3,
  'the owl is not audible in its own band at night');
check(songDay.notes.count >= songDay.songs,
  'fewer note onsets rendered than songs scheduled - the phrases are not coming out');
check(song.forest.msPerTick < 0.5,
  'the songbird lattice is too slow to run on the audio tick');
// Footsteps. The gate first: they are the one sound tied to the user's action.
check(step.grass.steps > 0, 'walking on open ground produced no footsteps at all');
check(step.standing.steps === 0, 'standing still produced footsteps');
check(step.flying.steps === 0, 'fly mode produced footsteps - flying is not walking');
// The user chose a fixed cadence near a walking pace over one derived from the
// real 4 m/s (which would be 2.7 a second, a run). So this asserts the LIE, on
// purpose - it is the decision, and a drift back towards honesty is a bug here.
check(step.grass.cadenceHz > 1.7 && step.grass.cadenceHz < 2.3,
  `the cadence is ${step.grass.cadenceHz.toFixed(2)} Hz, not the ~2 Hz walking pace chosen`);
// Deliberately NOT an onset count. noteOnsets() thresholds against the loudest
// thing in the buffer, so with no loud events it counts the noise bed instead -
// it reported 87 onsets for the standing case, which has zero footfalls. The
// controlled comparison is `standing`: the same scene, the same wind, no steps.
check(ratio(step.grass.rms, step.standing.rms) > 1.15,
  'walking sounds the same as standing still - the footsteps are inaudible');
// Surface selection, from signals the scene already has.
check(step.grass.surface === 'grass', `flat open ground at 1,700 m read as ${step.grass.surface}`);
check(step.scree.surface === 'scree', `a 35-degree slope read as ${step.scree.surface}`);
check(step.screeHigh.surface === 'scree', `3,600 m of rocky band read as ${step.screeHigh.surface}`);
check(step.forest.surface === 'forest', `canopy 0.6 read as ${step.forest.surface}`);
check(step.snow.surface === 'snow', `lying snow read as ${step.snow.surface}`);
check(step.wet.surface === 'wet', `wet ground read as ${step.wet.surface}`);
// And that the surfaces actually sound different. Grass and scree share a ground
// height and differ only in slope, so the wind behind them is identical.
// Each surface has to lift its OWN band clear of the silent-footed reference.
for (const [name, band] of [['grass', 'soft'], ['forest', 'soft'], ['scree', 'stone'],
  ['snow', 'crunch'], ['wet', 'wet']]) {
  check(ratio(step[name].bands[band].max, quietRef(name).bands[band].max) > 2,
    `walking on ${name} barely moves the ${band} band over standing still`);
}
// And they have to differ from each other, not just from silence. Grass and
// scree share a ground height, so only the footing changed.
check(ratio(step.scree.bands.stone.max, step.grass.bands.stone.max) > 1.5,
  'loose stone does not sound any brighter than turf');
check(ratio(step.snow.bands.crunch.max, step.grass.bands.crunch.max) > 1.5,
  'snow does not crunch - no more high end than walking on grass');
check(ratio(step.wet.bands.wet.max, step.wet.bands.stone.max)
  > ratio(step.scree.bands.wet.max, step.scree.bands.stone.max),
  'a squelch is not lower-pitched than loose stone');
check(spawn.river < 250, 'the Savara is no longer within earshot of the spawn point');
check(cases.atSpawn.diag.gains.waterLow > 0.01,
  'the river at the spawn point is not audible');
check(earshot.perQueryMs < 0.5, 'the earshot query is too slow to run per tick');
// The live page. Nothing here depends on an audio device existing.
check(beforeClick.started === false, 'a context was created before any user gesture');
check(live.started === true, 'the first click did not start the audio graph');
check(live.strength > 0, 'the running viewer is not driving the wind at all');
check(live.gains && Object.values(live.gains).some((v) => v > 0.001),
  'every layer is silent in the running viewer');
check(Number.isFinite(live.riverM) && live.riverM < 250,
  'the running viewer does not see the river it spawns beside');
check(walked.riverM !== live.riverM || walked.gains.waterLow !== beforeWalk.waterLow,
  'walking for three seconds changed nothing about the soundscape');
check(afterM.enabled === false && afterM.checkbox === false,
  "'M' did not mute, or left the checkbox out of step");
// The real heightfield and the real canopy mask, which no offline case touches.
check(liveSong.singers > 0,
  'the running viewer has no singers anywhere near it - the lattice found nothing on the real terrain');
check(liveSong.songs > 0, 'nothing sang in 45 seconds of walking in the running viewer');
check(liveSong.by.tawnyowl === 0,
  'a tawny owl hooted in the running viewer, which opens in daylight');
check(liveNight.night > 0.9,
  'moving the time slider to the night preset did not reach the audio');
check(liveSong.steps > 0, 'walking for 45 s in the running viewer produced no footsteps');
check(liveSong.surface != null,
  'the running viewer never worked out what it was walking on');
check(liveStillStopped === liveStopped.steps,
  'footsteps kept playing after the user stopped walking');
check(liveStopped.surface === null,
  'the surface readout did not clear when the walking stopped');
// Standing 18 m from a marmot or a chamois has to whistle. Asserted over the
// whole G sweep rather than one press, because which species is reachable from
// wherever the walk ended is not the point being tested.
const gReached = gPresses.filter((g) => /^(marmot|chamois):/.test(g.note));
check(gReached.length > 0, "the dev 'G' key never reached a species that has a call");
check(gPresses[gPresses.length - 1].calls > 0,
  "walking up to a marmot with 'G' played no alarm whistle at all");

if (problems.length) console.log(`\nPage problems:\n  ${problems.join('\n  ')}`);
if (failures.length) {
  console.log(`\n${failures.length} FAILURE(S):`);
  for (const f of failures) console.log(`  - ${f}`);
}
if (failures.length || problems.length) process.exit(1);
console.log('\nThe soundscape follows the scene: wind with height and exposure, leaves with canopy,'
  + ' water with distance, rain and snow with the weather, and alarm calls from the right side.');
