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

  // Mean power in [loHz, hiHz], averaged over overlapping Hann-windowed
  // segments (Welch) so a noise bed gives a stable number rather than one
  // segment's luck.
  function bandPower(samples, loHz, hiHz) {
    const k0 = Math.max(1, Math.floor((loHz * N) / SR));
    const k1 = Math.min(N / 2 - 1, Math.ceil((hiHz * N) / SR));
    let acc = 0;
    let frames = 0;
    for (let start = 0; start + N <= samples.length; start += N / 2) {
      const re = new Float64Array(N);
      const im = new Float64Array(N);
      for (let i = 0; i < N; i++) re[i] = samples[start + i] * window[i];
      fft(re, im);
      let p = 0;
      for (let k = k0; k <= k1; k++) p += re[k] * re[k] + im[k] * im[k];
      acc += p / (N * N);
      frames++;
    }
    return frames ? acc / frames : 0;
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

const { cases, series, earshot, spawn } = result;
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
