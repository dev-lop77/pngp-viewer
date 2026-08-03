#!/usr/bin/env node
// Given what a band should LOOK like on screen, work out the albedo hex to put
// in src/terrain.js's band table.
//
// Needed because albedo and on-screen colour are far apart here. three's
// Lambert BRDF divides by PI, the midday preset lights with sun 1.8 + ambient
// 0.6 (src/lighting.js), exposure is 0.75 (which ACES then divides by 0.6), and
// ACES compresses what survives. A "forest green" #3f5233 straight into the
// table therefore renders as near-black - which is physically honest (real
// canopy reflectance is 5-10%) but wrong for this viewer, whose whole lighting
// rig was tuned in phase 4 against a white terrain and approved that way.
//
// Rather than nudge hexes and re-screenshot, this inverts the pipeline: give it
// the target appearance, it solves for the albedo by iterating the forward
// model per channel.
//
// Usage: node tools/dev/solve-albedo.mjs

const SUN = 1.8; // src/lighting.js midday preset
const AMBIENT = 0.6;
const DOT_NL = 0.8; // a typical sun-facing slope, not a perfect facing normal
const EXPOSURE = 0.75;

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linearToSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
const hexToLinear = (hex) =>
  [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255].map((v) => srgbToLinear(v / 255));
const linearToHex = (rgb) =>
  rgb
    .map((c) => Math.max(0, Math.min(255, Math.round(linearToSrgb(c) * 255))))
    .reduce((acc, v) => acc * 256 + v, 0);

// three's ACESFilmicToneMapping, verbatim (mat3 columns transposed to rows).
const mul = (m, v) => [
  m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
  m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
  m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
];
const IN_MAT = [
  [0.59719, 0.35458, 0.04823],
  [0.076, 0.90834, 0.01566],
  [0.0284, 0.13383, 0.83777],
];
const OUT_MAT = [
  [1.60475, -0.53108, -0.07367],
  [-0.10208, 1.10813, -0.00605],
  [-0.00327, -0.07276, 1.07602],
];
const fit = (v) =>
  v.map((c) => {
    const a = c * (c + 0.0245786) - 0.000090537;
    const b = c * (0.983729 * c + 0.432951) + 0.238081;
    return a / b;
  });
const aces = (color) => {
  const scaled = color.map((c) => (c * EXPOSURE) / 0.6); // three divides exposure by 0.6
  return mul(OUT_MAT, fit(mul(IN_MAT, scaled))).map((c) => Math.max(0, Math.min(1, c)));
};

// albedo (linear) -> what the framebuffer shows (linear, pre-sRGB-encode)
const forward = (albedo) => aces(albedo.map((c) => (c / Math.PI) * (SUN * DOT_NL + AMBIENT)));

function solve(targetHex) {
  const target = hexToLinear(targetHex);
  let albedo = [...target];
  for (let i = 0; i < 80; i++) {
    const got = forward(albedo);
    albedo = albedo.map((c, k) => Math.min(4, c * (target[k] + 1e-5) / (got[k] + 1e-5)));
  }
  return albedo;
}

// What each band should look like on screen at midday, on a sun-facing slope.
const TARGETS = [
  ['valley', 0x7f9457],
  ['montane', 0x4e6b41],
  ['subalpine', 0x6a7f4b],
  ['meadow', 0x93976a],
  ['rocky', 0x8d867c],
  ['nival', 0xf4f8fd],
];

console.log('band        want on screen  ->  albedo hex   (linear albedo)        clipped?');
for (const [name, want] of TARGETS) {
  const albedo = solve(want);
  const clipped = albedo.some((c) => c > 1.0);
  const hex = linearToHex(albedo);
  const check = forward(hexToLinear(hex)).map((c) => Math.round(linearToSrgb(c) * 255));
  console.log(
    `${name.padEnd(11)} #${want.toString(16).padStart(6, '0')}         ->  0x${hex
      .toString(16)
      .padStart(6, '0')}     [${albedo.map((c) => c.toFixed(3)).join(', ')}]  ` +
      `${clipped ? 'YES - unreachable' : 'no'}   verify: rgb(${check.join(',')})`,
  );
}
