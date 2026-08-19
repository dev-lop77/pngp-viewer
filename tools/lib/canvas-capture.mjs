// Take a picture of the running viewer, the only affordable way.
//
// Shared by tools/dev/probe-haze.mjs and tools/dev/probe-huts.mjs, and extracted on
// 2026-08-19 because the cost difference is large enough that anyone writing the next
// probe must not have to rediscover it. Measured at 760x480 under SwiftShader, on this
// machine, on the deepest vantage in the park:
//
//   page.screenshot()          minutes - it forces a second full render pass; three
//                              attempts at probe-haze.mjs were killed inside it
//   canvas.toDataURL('png')    80-91 s, and just as slow on a frame containing nothing
//                              but sky - so it is the browser's PNG encoder
//   canvas.toDataURL('jpeg')   10.5 s
//   gl.readPixels              8-10 s, and it hands back the pixels themselves
//
// A frame of that same vantage costs 2.8 s to draw, so everything above it is capture
// overhead rather than rendering.
//
// The rule it has to respect is the one probe-snow.mjs learned the hard way: this
// context has no preserveDrawingBuffer, so reading the canvas AFTER the frame is
// presented returns an empty buffer, silently - it reported 0.000 luma for every shot.
// So the read happens INSIDE a frame, after two nested requestAnimationFrames: the app
// re-arms its loop from within its own callback, so a callback registered from inside
// one of ours is queued behind the app's next one, and by then it has drawn.
// getContext() on a canvas that already has one returns THAT context, so this reads the
// app's own drawing buffer and not a second one.
//
// What it loses is everything the DOM draws over the canvas - the HUD and the CSS2D
// labels. Hide them with addStyleTag if their absence matters; measure them from the
// DOM if what you want is what they say.

import { writeFileSync } from 'node:fs';
import { encode } from 'fast-png';

export async function captureCanvas(page, file) {
  const shot = await page.evaluate(() => new Promise((resolve, reject) => {
    const c = document.querySelector('canvas');
    if (!c) { reject(new Error('no canvas')); return; }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          const gl = c.getContext('webgl2');
          const w = c.width;
          const h = c.height;
          const buf = new Uint8Array(w * h * 4);
          gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
          // btoa needs a string and String.fromCharCode has an argument limit, so it
          // goes over in chunks. JSON would be ~10x the bytes over the wire.
          let str = '';
          const CHUNK = 0x8000;
          for (let i = 0; i < buf.length; i += CHUNK) {
            str += String.fromCharCode.apply(null, buf.subarray(i, i + CHUNK));
          }
          resolve({ w, h, b64: btoa(str) });
        } catch (e) { reject(e); }
      });
    });
  }));
  const raw = Buffer.from(shot.b64, 'base64');
  // WebGL's origin is bottom-left and a PNG's is top-left, so the rows come back
  // upside down. Flipping here means the saved file and any measurement of the same
  // buffer agree about which row is which.
  const data = new Uint8Array(raw.length);
  const stride = shot.w * 4;
  for (let y = 0; y < shot.h; y += 1) {
    data.set(raw.subarray((shot.h - 1 - y) * stride, (shot.h - y) * stride), y * stride);
  }
  const img = { width: shot.w, height: shot.h, data, channels: 4, depth: 8 };
  if (file) writeFileSync(file, encode(img));
  return img;
}
