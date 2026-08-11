import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// Walk/fly navigation (phase 5 follow-up, docs/PROGRESS.md 2026-07-31):
// replaces OrbitControls as the primary way to move through the scene, per
// the user's explicit request after testing phase 5 - default is walking
// at human eye-height, ground-clamped via the terrain's own sampleHeight();
// 'F' toggles a faster free-fly mode for covering the whole ~84x48km park.
// No scroll/zoom at all in either mode (the user asked to drop it) -
// distance is covered by moving, not zooming.
//
// Built on three's own PointerLockControls addon rather than hand-rolled
// mouselook (same "prefer a well-tested library" instinct as OrbitControls/
// proj4/turf/Sky elsewhere in this project) - it re-derives the camera's
// yaw/pitch from its *current* quaternion on every mousemove rather than
// caching stale state, so an external camera move (main.js's flyTo()
// animation) is picked up automatically on the next mouse move, no manual
// resync needed - confirmed by reading its source, same insight as the
// OrbitControls.update() finding from phase 2.
const EYE_HEIGHT_M = 1.7;
const WALK_SPEED_MPS = 4;
const FLY_SPEED_MPS = 60;
const BOOST_MULTIPLIER = 2.5;
// A/D turn rather than strafe - the user's call while walking around for real
// (2026-08-03): sidestepping is not what you do on a mountain path, and since
// movement now works without pointer lock, turning on the keyboard is the only
// way to change direction with the mouse released. Strafing moved to Q/E
// rather than being dropped.
// 60 deg/s - 90 read as slightly too fast in real use (2026-08-03). Shift
// deliberately does NOT speed this up the way it does travel: a predictable
// turn rate is easier to aim with, and the mouse is still there for a fast
// look-around.
const TURN_SPEED_RAD = Math.PI / 3;

// Mouse look is applied here rather than inside PointerLockControls, which
// rotates the camera immediately in its own mousemove handler. The user reported
// (2026-08-03) that moving the view up or down came in jumps instead of at a
// constant rate. A probe (tools/dev/probe-mouselook.mjs) ruled our maths out:
// twelve identical synthetic 5 px events each moved pitch by exactly 0.572958
// deg, with zero roll and no yaw cross-talk. So the unevenness is on the input
// side, and there were three real causes, none of them the angle code:
//
//  1. mousemove and frames are independent. Applying rotation the instant an
//     event arrives means a frame that happened to receive two events rotates
//     twice as far as one that received one - visible stepping from perfectly
//     steady hand movement, and worse the further frame rate and mouse polling
//     rate drift apart. Accumulating deltas and spending them per frame with a
//     short time constant evens that out.
//  2. we never asked for unadjusted movement, so the OS acceleration curve was
//     being applied to the deltas (see the pointer-lock request below).
//  3. PointerLockControls clamps pitch to exactly +/-90 deg, which is precisely
//     where YXZ euler extraction goes degenerate: at the pole, roll is forced to
//     0 and yaw is re-derived from a different matrix branch, so pushing into the
//     limit snaps the view sideways. Clamping just inside avoids that entirely.
const MOUSE_SENSITIVITY = 0.002; // rad/px, three's own value - keeps the established feel
// Time constant, not a per-frame fraction, so behaviour is identical at any
// frame rate. ~45 ms is enough to bridge a gap between a 60 Hz mouse and a
// faster display without the lag being perceptible; set to 0 to apply raw.
const LOOK_SMOOTHING_S = 0.045;
const MAX_PITCH_RAD = Math.PI / 2 - 0.002; // just inside the pole - see cause 3 above

// Cause 2, finally measured (2026-08-04). With the instrumentation in place the
// user looked up slowly until the jump happened and read off:
//
//     230 px/event · 34 ms/frame · 20.40 deg/frame, at pitch +55 deg
//
// 230 px in ONE mousemove event, where slow movement is 1-5. A queue of small
// events cannot produce that - each event carries its own delta - so this is the
// platform reporting a pointer warp as movement: under pointer lock the physical
// pointer still travels, and when it reaches the edge of the screen the compositor
// recentres it and the jump comes through as one enormous delta. 230 px x 0.002
// rad/px = 26 deg, which is the 20.40 deg that landed in a single frame. It
// happens at whatever pitch the pointer happens to hit the edge at, which is why
// it read as "at a certain point" rather than at a fixed angle.
//
// The same reading rules the other candidate OUT: 34 ms was the worst frame in
// three seconds, so nothing hitched and no queue built up. No dt cap is needed.
//
// A warp carries no real movement, so it is dropped rather than clamped -
// clamping would still turn the view by the cap. The test is deliberately two
// sided, because the difference between a warp and a fast flick is not magnitude
// alone: a warp is one isolated huge event, a flick is a RUN of large ones.
//  - the floor keeps slow movement safe: 120 px is 13.7 deg in a single event,
//    far more than a hand produces between two polls;
//  - the adaptive term keeps fast movement safe: once a flick is under way the
//    typical magnitude has risen, so its own events stay well under the bar.
const SPIKE_FLOOR_PX = 120;
const SPIKE_FACTOR = 8;
// How fast the "typical" magnitude forgets. Without decay, a warp arriving just
// after a fast flick would be measured against the flick and let through.
const TYPICAL_DECAY_S = 0.5;

// Highest value seen in roughly the last few seconds. Two buckets rather than
// one so a readout doesn't blink back to zero the instant a window rolls over -
// which would make a peak easy to miss at the 4 Hz the HUD refreshes at.
class PeakWindow {
  constructor(windowS = 3) {
    this._windowS = windowS;
    this._current = 0;
    this._previous = 0;
    this._age = 0;
  }

  add(value) {
    if (value > this._current) this._current = value;
  }

  tick(dt) {
    this._age += dt;
    if (this._age >= this._windowS) {
      this._age = 0;
      this._previous = this._current;
      this._current = 0;
    }
  }

  get value() {
    return Math.max(this._current, this._previous);
  }
}

const MOVE_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'Space', 'KeyC', 'ShiftLeft', 'ShiftRight',
]);
const WORLD_UP = new THREE.Vector3(0, 1, 0);

export { EYE_HEIGHT_M };

export class WalkFlyControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.mode = 'walk'; // 'walk' | 'fly'
    this._enabled = true;
    this.getGroundHeight = null; // (x, z) => elevation meters, set once terrain loads
    // How fast the ground is going past, in m/s, measured from what update()
    // itself moved this frame. Deliberately NOT derivable from the camera
    // position by whoever wants it: the camera is also placed outright - by the
    // dev 'G' key, by a POI fly-to, by a restored view - and a placement is not
    // travel. src/audio.js's footsteps read this and nothing else.
    this.travelMps = 0;

    this.plc = new PointerLockControls(camera, domElement);
    // Still used for its lock-state tracking and its movement helpers
    // (getDirection/moveForward/moveRight), but NOT for looking: zero
    // pointerSpeed neutralises its mousemove rotation so update() can apply a
    // frame-paced version instead. Its handler then only round-trips the
    // quaternion through an euler, which is harmless.
    this.plc.pointerSpeed = 0;
    this._keys = new Set();
    this._dir = new THREE.Vector3();
    this._euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this._pendingYaw = 0;
    this._pendingPitch = 0;
    // Live instrumentation for the jump the user still reported on 2026-08-04
    // (docs/PROGRESS.md). main.js shows these in a dev-only HUD line; the cost
    // is a handful of comparisons a frame, so they are always collected and can
    // be read off window.__pngp.controls on any build that exposes it.
    this.lookDiag = {
      eventPx: new PeakWindow(),      // biggest single mousemove delta - a warp spike
      eventsPerFrame: new PeakWindow(), // events queued into one frame - a hitch
      frameMs: new PeakWindow(),      // longest frame - the hitch itself
      stepDeg: new PeakWindow(),      // biggest pitch change applied in one frame
      spikePx: new PeakWindow(),      // biggest delta the warp filter threw away
    };
    this._eventsSinceFrame = 0;
    // Rolling magnitude of accepted movement, and how many warps have been
    // rejected in total - exposed so the fix can be seen working rather than
    // taken on trust.
    this._typicalPx = 0;
    this._spikesRejected = 0;

    domElement.addEventListener('click', () => {
      if (document.pointerLockElement !== domElement) domElement.requestPointerLock();
    });
    // Deliberately a plain request. requestPointerLock({ unadjustedMovement:
    // true }) asks for raw deltas with no OS pointer acceleration, which would
    // be the proper fix for cause 2 above - but it was tried and backed out
    // (2026-08-03): on Linux it rejects with "NotSupportedError: The options
    // asked for in this request are not supported on this platform", and the
    // whole request fails, so the lock never engages until a fallback retries.
    // That retry path also fires pointerlockerror, which PointerLockControls
    // logs as a console error on every single click. So on this platform the OS
    // acceleration curve cannot be bypassed from the page at all, and the
    // frame-pacing in _applyLook() is the part that is actually ours to fix.

    // Accumulate only; update() spends it. Guarded on lock and enabled for the
    // same reason PointerLockControls guards its own handler: stray movement
    // must not fight main.js's flyTo() animation.
    domElement.ownerDocument.addEventListener('mousemove', (e) => {
      if (!this._enabled || !this.plc.isLocked) return;
      const magnitude = Math.hypot(e.movementX, e.movementY);
      this.lookDiag.eventPx.add(magnitude);
      this._eventsSinceFrame += 1;

      // A pointer warp, not a hand: drop it and leave the view where it was.
      if (magnitude > Math.max(SPIKE_FLOOR_PX, SPIKE_FACTOR * this._typicalPx)) {
        this._spikesRejected += 1;
        this.lookDiag.spikePx.add(magnitude);
        return;
      }
      this._typicalPx += (magnitude - this._typicalPx) * 0.25;

      this._pendingYaw -= e.movementX * MOUSE_SENSITIVITY;
      this._pendingPitch -= e.movementY * MOUSE_SENSITIVITY;
    });

    window.addEventListener('keydown', (e) => {
      if (isTypingTarget(document.activeElement)) return;
      if (e.code === 'KeyF') {
        // Cancelled for the same reason the movement keys below are: a focused
        // <select> would otherwise take it as type-ahead as well as us taking it
        // as a mode toggle.
        e.preventDefault();
        this.mode = this.mode === 'walk' ? 'fly' : 'walk';
        return;
      }
      if (MOVE_KEYS.has(e.code)) {
        // Space scrolls the page by default, and movement now works without
        // pointer lock (see update()), so the browser's own handling is no
        // longer suppressed for us by the lock.
        e.preventDefault();
        this._keys.add(e.code);
      }
    });
    window.addEventListener('keyup', (e) => this._keys.delete(e.code));
  }

  get locked() {
    return this.plc.isLocked;
  }

  // Total pointer warps discarded since load - a lifetime count, not a window, so
  // the readout can be checked after the fact rather than caught in the act.
  get spikesRejected() {
    return this._spikesRejected;
  }

  // Also gates PointerLockControls' own mouse-look listener, not just this
  // class's WASD handling in update() - needed so main.js's flyTo()
  // animation isn't fought by stray mouse movement mid-flight.
  get enabled() {
    return this._enabled;
  }

  set enabled(value) {
    this._enabled = value;
    this.plc.enabled = value;
    // Drop anything unspent, or a flyTo would end with the camera jerking
    // through mouse movement made before it started.
    this._pendingYaw = 0;
    this._pendingPitch = 0;
  }

  // Spend the accumulated mouse movement. Derived from the camera's CURRENT
  // quaternion every time, exactly as PointerLockControls does, so an external
  // camera move (main.js's flyTo() calls lookAt) is picked up with no resync.
  _applyLook(dt) {
    if (this._pendingYaw === 0 && this._pendingPitch === 0) return;
    const k = LOOK_SMOOTHING_S > 0 ? 1 - Math.exp(-dt / LOOK_SMOOTHING_S) : 1;
    const yaw = this._pendingYaw * k;
    const pitch = this._pendingPitch * k;
    this._pendingYaw -= yaw;
    this._pendingPitch -= pitch;

    this._euler.setFromQuaternion(this.camera.quaternion);
    const pitchBefore = this._euler.x;
    this._euler.y += yaw;
    this._euler.x = Math.max(-MAX_PITCH_RAD, Math.min(MAX_PITCH_RAD, this._euler.x + pitch));
    this.camera.quaternion.setFromEuler(this._euler);
    this.lookDiag.stepDeg.add((Math.abs(this._euler.x - pitchBefore) * 180) / Math.PI);

    // Below a fraction of a pixel's worth of angle the remainder is invisible;
    // zero it so the smoothing can't leave the camera creeping forever.
    if (Math.abs(this._pendingYaw) < 1e-5) this._pendingYaw = 0;
    if (Math.abs(this._pendingPitch) < 1e-5) this._pendingPitch = 0;
  }

  update(dt) {
    // Zeroed here rather than after the movement below, so a frame this class
    // does not move on - disabled, or a flyTo driving the camera instead -
    // reports standing still rather than the last frame it did move.
    this.travelMps = 0;
    // Ahead of the enabled check, so the windows keep rolling (and decaying)
    // even while a flyTo has control of the camera.
    this.lookDiag.frameMs.add(dt * 1000);
    this.lookDiag.eventsPerFrame.add(this._eventsSinceFrame);
    this._eventsSinceFrame = 0;
    for (const peak of Object.values(this.lookDiag)) peak.tick(dt);
    // Forget the recent magnitude when the hand stops, so the spike floor governs
    // again rather than a stale flick's threshold.
    this._typicalPx *= Math.exp(-dt / TYPICAL_DECAY_S);

    // Deliberately NOT gated on this.locked: keyboard movement works with or
    // without pointer lock, only mouse-look needs the lock. Requiring it
    // meant pressing Esc to click a POI label also froze movement, which the
    // user reported as broken navigation (docs/PROGRESS.md 2026-08-03) - and
    // with the screen-centre reticle removed, releasing the lock to click a
    // label or the search box is now the normal way to select a POI.
    if (!this.enabled) return;

    // Before movement, so travelling this frame uses the direction just aimed.
    this._applyLook(dt);

    const boost = this._keys.has('ShiftLeft') || this._keys.has('ShiftRight') ? BOOST_MULTIPLIER : 1;
    const speed = (this.mode === 'walk' ? WALK_SPEED_MPS : FLY_SPEED_MPS) * boost;
    const move = speed * dt;

    // Yaw about the WORLD up axis, so looking up or down doesn't roll the
    // horizon. Rotating the camera directly is safe: PointerLockControls
    // re-derives yaw/pitch from the camera's current quaternion on every
    // mousemove rather than caching them (confirmed by reading its source).
    const turn = (this._keys.has('KeyA') ? 1 : 0) - (this._keys.has('KeyD') ? 1 : 0);
    if (turn !== 0) this.camera.rotateOnWorldAxis(WORLD_UP, turn * TURN_SPEED_RAD * dt);

    let dx = (this._keys.has('KeyE') ? 1 : 0) - (this._keys.has('KeyQ') ? 1 : 0);
    let dz = (this._keys.has('KeyW') ? 1 : 0) - (this._keys.has('KeyS') ? 1 : 0);
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;

    const fromX = this.camera.position.x;
    const fromZ = this.camera.position.z;

    if (this.mode === 'fly') {
      this.plc.getDirection(this._dir); // full 3D look direction, incl. pitch
      this.camera.position.addScaledVector(this._dir, dz * move);
      this.plc.moveRight(dx * move);
      if (this._keys.has('Space')) this.camera.position.y += move;
      if (this._keys.has('KeyC')) this.camera.position.y -= move;
    } else {
      this.plc.moveForward(dz * move); // XZ-plane only - looking up/down doesn't tilt walking
      this.plc.moveRight(dx * move);
      const ground = this.getGroundHeight?.(this.camera.position.x, this.camera.position.z);
      if (ground != null) this.camera.position.y = ground + EYE_HEIGHT_M;
    }

    // Read back off the camera rather than taken from `move`, so anything that
    // ever stops the movement short (a collision, a boundary) is travel this
    // frame did not do. Horizontal only: in walk mode the y above is a clamp to
    // the terrain, so a 3D measure would report the hill, not the walking.
    if (dt > 1e-4) {
      this.travelMps = Math.hypot(this.camera.position.x - fromX, this.camera.position.z - fromZ) / dt;
    }
  }
}

// Input types that swallow characters, because somebody is writing words into
// them: the POI search box is the one this exists for - typing "Cogne" must not
// walk the camera across the park.
const TEXT_INPUT_TYPES = new Set([
  'text', 'search', 'url', 'email', 'tel', 'password', 'number',
  'date', 'time', 'datetime-local', 'month', 'week',
]);

// Whether keystrokes belong to the page rather than to the camera. Exported so
// main.js's own key handlers (F/G/B/M) share this one definition instead of
// keeping copies of it - there were three, and they would have had to be fixed
// three times.
//
// This used to be `INPUT || SELECT || TEXTAREA`, which is wrong twice over and
// the user found it on 2026-08-11: the time-of-day slider is an
// `<input type="range">` and the weather picker is a `<select>`, so touching
// either one silently killed W/A/S/D until something else took the focus - and
// clicking the scene is what took it, which is why "click the screen and they
// come back" was the symptom. Neither control has anything to do with typing.
//
// A form control keeping focus is fine now, and better than blurring it: arrow
// keys still adjust the slider and still cycle the weather, which is how a
// keyboard user drives them. The letter keys cannot reach a focused <select> as
// type-ahead because the movement handler preventDefault()s the ones it consumes
// - checked, not assumed: with the weather picker focused, 'S' would otherwise
// match "Snowfall" and walking backwards would change the weather
// (tools/test-controls-focus.mjs asserts it does not).
export function isTypingTarget(el) {
  if (!el) return false;
  if (el.isContentEditable) return true;
  if (el.tagName === 'TEXTAREA') return true;
  if (el.tagName !== 'INPUT') return false;
  return TEXT_INPUT_TYPES.has(el.type);
}
