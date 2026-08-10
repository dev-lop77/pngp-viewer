// How long after pressing W does a footstep actually get scheduled, and how far
// ahead of the audio context's own clock is it scheduled?
//
// Written 2026-08-10 for the user's "il rumore dei passi parte con 5 secondi di
// ritardo". The delay was not in the footsteps at all: songNow() captured its
// origin at its first call and then ran on accumulated dt, so whatever time had
// already piled up by then became a permanent head start that max() could only
// ever widen. Every sound in the viewer was scheduled that far late.
//
// The measurement has to happen INSIDE the page: a poll from node round-trips
// over CDP and reports its own latency, which here was 0.6 s of the 0.7 s it
// claimed to be measuring.
//
// Usage: tools/dev/start-dev.sh, then `node tools/dev/probe-step-delay.mjs`.
import { chromium } from 'playwright';

const URL = process.env.URL ?? 'http://127.0.0.1:5173/';
const IDLE_S = Number(process.env.IDLE_S ?? 8);

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__pngp?.audio, null, { timeout: 60000 });
await page.mouse.click(400, 300); // the gesture the autoplay policy requires
await page.waitForTimeout(500);

const skew = () => page.evaluate(() => window.__pngp.audio.diag.clockSkew);

console.log('Clock skew (songNow() ahead of the context, seconds - 0 is healthy):');
for (let i = 0; i < 3; i++) {
  console.log(`  ${(await skew()).toFixed(4)}`);
  await page.waitForTimeout(1000);
}

// Standing still first: the skew used to be fixed at whatever had accumulated
// before the first schedule, so a long idle is the case that would expose it
// growing with the session.
console.log(`\nStanding still for ${IDLE_S}s, then walking...`);
await page.waitForTimeout(IDLE_S * 1000);

// Armed in-page, so the only clock involved is the audio context's own.
await page.evaluate(() => {
  const a = window.__pngp.audio;
  window.__probe = { t0: a.context.currentTime, from: a.stepsPlayed, at: null };
  const poll = () => {
    if (window.__probe.at == null && a.stepsPlayed > window.__probe.from) {
      window.__probe.at = a.context.currentTime;
      window.__probe.skew = a.diag.clockSkew;
      return;
    }
    requestAnimationFrame(poll);
  };
  requestAnimationFrame(poll);
});
await page.keyboard.down('KeyW');
await page.waitForTimeout(3000);
await page.keyboard.up('KeyW');

const probe = await page.evaluate(() => window.__probe);
const latency = probe.at == null ? null : probe.at - probe.t0;

// The audio tick is gated on frames, so a latency in seconds means nothing until
// you know what a frame costs here. Headless/SwiftShader runs this scene at about
// 1 fps, which is also why the cadence reads ~1 Hz rather than 2 in this harness:
// a tick that arrives later than the next step is due re-arms rather than firing
// a burst of the ones it missed. Neither is a fault of the footsteps.
const fps = await page.evaluate(() => new Promise((resolve) => {
  let frames = 0;
  const t0 = performance.now();
  const tick = () => {
    frames++;
    if (performance.now() - t0 >= 2000) resolve((frames * 1000) / (performance.now() - t0));
    else requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}));

console.log(`  first step scheduled ${latency == null ? 'NEVER' : `${(latency * 1000).toFixed(0)} ms`}`
  + ` after W went down, at a skew of ${probe.skew?.toFixed(4) ?? '-'} s`);
console.log(`  this page renders at ${fps.toFixed(1)} fps, i.e. ${(1000 / fps).toFixed(0)} ms a frame`
  + ` -> that is ${latency == null ? '-' : (latency / (1 / fps)).toFixed(1)} frames`);
console.log('  (a tick is 125 ms and a step is booked 60 ms ahead of itself, so the floor is'
  + ' one frame + up to 185 ms)');

await browser.close();
