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
      this._pendingYaw -= e.movementX * MOUSE_SENSITIVITY;
      this._pendingPitch -= e.movementY * MOUSE_SENSITIVITY;
    });

    window.addEventListener('keydown', (e) => {
      if (isTypingTarget(document.activeElement)) return;
      if (e.code === 'KeyF') { this.mode = this.mode === 'walk' ? 'fly' : 'walk'; return; }
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
    this._euler.y += yaw;
    this._euler.x = Math.max(-MAX_PITCH_RAD, Math.min(MAX_PITCH_RAD, this._euler.x + pitch));
    this.camera.quaternion.setFromEuler(this._euler);

    // Below a fraction of a pixel's worth of angle the remainder is invisible;
    // zero it so the smoothing can't leave the camera creeping forever.
    if (Math.abs(this._pendingYaw) < 1e-5) this._pendingYaw = 0;
    if (Math.abs(this._pendingPitch) < 1e-5) this._pendingPitch = 0;
  }

  update(dt) {
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
  }
}

function isTypingTarget(el) {
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA');
}
