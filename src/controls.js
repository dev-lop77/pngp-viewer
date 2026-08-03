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
    this._keys = new Set();
    this._dir = new THREE.Vector3();

    domElement.addEventListener('click', () => {
      if (document.pointerLockElement !== domElement) domElement.requestPointerLock();
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
  }

  update(dt) {
    // Deliberately NOT gated on this.locked: keyboard movement works with or
    // without pointer lock, only mouse-look needs the lock. Requiring it
    // meant pressing Esc to click a POI label also froze movement, which the
    // user reported as broken navigation (docs/PROGRESS.md 2026-08-03) - and
    // with the screen-centre reticle removed, releasing the lock to click a
    // label or the search box is now the normal way to select a POI.
    if (!this.enabled) return;

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
