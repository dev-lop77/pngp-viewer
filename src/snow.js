// Where snow lies (2026-08-11). The user's own topic, "la neve che si deposita",
// and their answer to the three questions it was put to them with: what decides
// where snow lies (altitude + aspect + slope), whether it has memory
// (deterministic - no accumulator, no history buffer), and whether it has depth
// underfoot (colour only).
//
// The distinction that made this a topic at all: weather.js's `mod.snow` is a
// STATE - how much snow has fallen and not yet melted, one number for the whole
// park. Until today that number was the whole story, so the ground either was
// snowy everywhere or nowhere, and a 300 m valley floor whitened at the same
// instant as a 4,000 m summit. What lands here is not history either; it is the
// other half of the state: given how much has fallen, WHICH ground is holding
// it. That is a pure function of the terrain, which is why nothing needs saving
// in the viewstate and why every reader can agree without being told.
//
// Three readers now, and they must not drift apart - the same lesson as
// lighting.js exposing `night` so the birdsong and the sky could not disagree:
//   - src/terrain.js  the ground colour (fragment shader)
//   - src/vegetation.js  snow-laden trees (vertex shader)
//   - src/audio.js  whether a footstep crunches (CPU)
// so the rule is that the maths lives here once, as one GLSL snippet both
// shaders inject and one JS twin for the ear.

import * as THREE from 'three';

// How much snow has fallen and not yet melted, 0..1: weather.js's `mod.snow`,
// driven in from main.js each frame. A shared holder rather than the value, the
// same way forest.js hands over its canopy mask - it keeps terrain.js and
// vegetation.js knowing nothing about weather.js, and it means both shaders read
// the same number by construction instead of by two assignments that could get
// out of step.
export const SNOW_LEVEL = { value: 0 };

// The same near-white as terrain.js's nival band, and for the same reason: it is
// the brightest this lighting rig can reach (even albedo 1.0 only renders at
// rgb(195) at the midday preset's exposure), so there is nothing to gain by
// inventing a second white. See the albedo warning in terrain.js.
export const SNOW_COLOR = 0xf6f9ff;

// A snowline that descends as snow keeps falling, and rises again as it melts.
// This is the one piece of Alpine weather everybody recognises on sight, and it
// is what makes the altitude term visible rather than merely present: at the
// first flakes only the summits go white, and the line comes down the mountain
// from there.
//
// TOP is where the first settled snow appears and BOTTOM where the line reaches
// in a full storm. BOTTOM is deliberately NOT the DEM's floor (292 m, which is
// the Po plain edge, outside the park): a January storm routinely leaves the
// lowest valleys bare, and a line that always reached the bottom would be the
// uniform whitening this file exists to replace.
const SNOW_LINE_TOP_M = 3200;
const SNOW_LINE_BOTTOM_M = 900;
// Half-width of the margin, in metres of elevation. Wide on purpose: at the
// steepest part of the ramp the line crosses a given contour in about a second,
// so a narrow margin would read as a wipe passing over the landscape rather than
// as snow settling. 300 m of blend puts a broad, patchy transition zone on the
// hillside at any instant, which is what a real snowline looks like.
const SNOW_LINE_BLEND_M = 300;
// Nothing has settled anywhere below this level, which is what keeps a
// completely snow-free scene snow-free: without it the top of the line's travel
// would sit inside the terrain and leave permanent weather-snow on the high rock
// at level 0. It also cross-fades the summit cap in over its first ~2 s instead
// of popping it.
const SNOW_ONSET = 0.3;
// +Z is South (docs/ARCHITECTURE.md §6), so a normal with z < 0 faces north:
// colder, and it holds snow far longer - a north face keeps it for weeks after
// the south side of the same ridge is bare. Applied as an offset to the ground's
// effective elevation, so a north slope behaves as if it were this much higher.
// Six times the treeline's own aspect shift (ASPECT_SHIFT_M = 50 m) because the
// effect really is that much stronger for lying snow than for what grows.
// Multiplying by the normal's z, not its sign, scales it by steepness for free:
// flat ground has no aspect and gets no shift.
const SNOW_ASPECT_M = 320;
// Patchiness, so the margin is not a contour line. Two things break it up: this,
// and the aspect term above, which already varies strongly across every ridge
// and gully.
const SNOW_NOISE_M = 100;
const SNOW_NOISE_SCALE_M = 700;

// Exported for tools/test-terrain-albedo.mjs and tools/test-vegetation.mjs, so
// the tests asserts against these numbers rather than a second copy that could
// drift from them.
export {
  SNOW_LINE_TOP_M,
  SNOW_LINE_BOTTOM_M,
  SNOW_LINE_BLEND_M,
  SNOW_ONSET,
  SNOW_ASPECT_M,
  SNOW_NOISE_M,
  SNOW_NOISE_SCALE_M,
};

// GLSL needs a decimal point (or an exponent) to read a literal as a float.
function glsl(n) {
  const s = n.toPrecision(12);
  return s.includes('.') || s.includes('e') ? s : `${s}.0`;
}

export function snowColorGlsl() {
  const c = new THREE.Color(SNOW_COLOR);
  // Already linear: THREE.Color converts on assignment (ColorManagement, three
  // r152+). Never .convertSRGBToLinear() on top - see terrain.js.
  return `vec3( ${glsl(c.r)}, ${glsl(c.g)}, ${glsl(c.b)} )`;
}

// The shared definition, injected verbatim into both shaders. It declares uSnow,
// so a caller must bind `shader.uniforms.uSnow = SNOW_LEVEL` and must not
// declare it again.
export function snowGlsl() {
  return /* glsl */ `
    uniform float uSnow;

    float snowHash( vec2 p ) {
      return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453123 );
    }
    float snowNoise( vec2 p ) {
      vec2 i = floor( p );
      vec2 f = fract( p );
      vec2 u = f * f * ( 3.0 - 2.0 * f );
      return mix( mix( snowHash( i ), snowHash( i + vec2( 1.0, 0.0 ) ), u.x ),
                  mix( snowHash( i + vec2( 0.0, 1.0 ) ), snowHash( i + vec2( 1.0, 1.0 ) ), u.x ), u.y );
    }

    // How much lying snow is on the ground at one point, 0..1.
    //   wxz     world position in metres (x = east, y of the vec2 = z = south)
    //   elev    ground elevation there, in metres
    //   aspectZ the ground normal's z; negative faces north (see SNOW_ASPECT_M)
    //   bare    1 where the ground is too steep to hold anything at all
    float snowCover( vec2 wxz, float elev, float aspectZ, float bare ) {
      float wobble = ( snowNoise( wxz / ${glsl(SNOW_NOISE_SCALE_M)} ) - 0.5 ) * 2.0;
      float hEff = elev + wobble * ${glsl(SNOW_NOISE_M)} - aspectZ * ${glsl(SNOW_ASPECT_M)};
      float line = mix( ${glsl(SNOW_LINE_TOP_M)}, ${glsl(SNOW_LINE_BOTTOM_M)}, uSnow );
      float reach = smoothstep( 0.0, ${glsl(SNOW_ONSET)}, uSnow );
      return smoothstep( line - ${glsl(SNOW_LINE_BLEND_M)}, line + ${glsl(SNOW_LINE_BLEND_M)}, hEff )
             * reach * ( 1.0 - bare );
    }
  `;
}

function smoothstep(e0, e1, x) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

// The CPU twin of snowCover(), for src/audio.js: a footstep has to crunch on the
// ground the eye is being shown as snowy, not on the global weather state.
//
// `wobbleM` defaults to 0, i.e. this is the un-wobbled snowline, and that is
// deliberate rather than lazy: a chaotic hash cannot be reproduced across GLSL
// float32 and JS float64 (the same reason wildlife.js does not port the tree
// existence hash), so reimplementing snowNoise() here would agree with the
// shader nowhere in particular. The cost is bounded and known - the ear can
// disagree with the eye by up to SNOW_NOISE_M of effective elevation, a third of
// the margin's own width, and only within that margin. Callers with a real
// wobble value in hand may pass it.
export function snowCoverAt({ elevM, aspectZ = 0, bare = 0, level, wobbleM = 0 }) {
  if (!(level > 0) || !Number.isFinite(elevM)) return 0;
  const hEff = elevM + wobbleM - aspectZ * SNOW_ASPECT_M;
  const line = SNOW_LINE_TOP_M + (SNOW_LINE_BOTTOM_M - SNOW_LINE_TOP_M) * level;
  const reach = smoothstep(0, SNOW_ONSET, level);
  const lie = smoothstep(line - SNOW_LINE_BLEND_M, line + SNOW_LINE_BLEND_M, hEff);
  return lie * reach * (1 - bare);
}
