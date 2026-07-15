import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class PlayerController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.controls = new PointerLockControls(camera, domElement);
    this.moveSpeed = 3.0;
    this.playerRadius = 0.3;
    this.playerHeight = 1.8;
    this.eyeHeight = 1.5;
    this.isLocked = false;
    this.isInCctvMode = false;
    this.isJumpscared = false;
    this.raycaster = new THREE.Raycaster();
    this.interactiveObjects = [];
    this.collisionBoxes = [];
    this.onInteract = null;
    this.onFirstClick = null;
    this.keys = { forward: false, backward: false, left: false, right: false };
    this._hasLockedOnce = false;

    this._box = new THREE.Box3();
    this._tempBox = new THREE.Box3();
    this._playerVec = new THREE.Vector3();

    this._setupListeners();
  }

  _setupListeners() {
    this.controls.addEventListener('lock', () => { this.isLocked = true; this._hasLockedOnce = true; });
    this.controls.addEventListener('unlock', () => { this.isLocked = false; });

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.isInCctvMode) {
        e.preventDefault();
        if (this.onInteract) this.onInteract('exitCctv', null);
        return;
      }
      if (this.isJumpscared) return;
      switch (e.code) {
        case 'KeyW': this.keys.forward = true; break;
        case 'KeyS': this.keys.backward = true; break;
        case 'KeyA': this.keys.left = true; break;
        case 'KeyD': this.keys.right = true; break;
      }
    });

    document.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': this.keys.forward = false; break;
        case 'KeyS': this.keys.backward = false; break;
        case 'KeyA': this.keys.left = false; break;
        case 'KeyD': this.keys.right = false; break;
      }
    });

    this.domElement.addEventListener('click', () => this._handleClick());
  }

  _handleClick() {
    if (this.isInCctvMode || this.isJumpscared) return;

    if (!this._hasLockedOnce) {
      this.controls.lock();
      if (this.onFirstClick) this.onFirstClick();
      return;
    }

    if (!this.isLocked) {
      this.controls.lock();
      return;
    }

    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const hits = this.raycaster.intersectObjects(this.interactiveObjects, false);
    if (hits.length > 0) {
      const obj = hits[0].object;
      if (obj.userData.isChair && this.onInteract) this.onInteract('chair', obj);
      else if (obj.userData.isBreaker && this.onInteract) this.onInteract('breaker', obj);
    }
  }

  getInteractionLabel() {
    if (this.isInCctvMode || !this.isLocked || this.isJumpscared) return null;
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const hits = this.raycaster.intersectObjects(this.interactiveObjects, false);
    if (hits.length > 0) return hits[0].object.userData.interactLabel || null;
    return null;
  }

  lock() { this.controls.lock(); }

  enterCctvMode() {
    this.isInCctvMode = true;
    this.controls.unlock();
    if (document.pointerLockElement) document.exitPointerLock();
  }

  exitCctvMode() {
    this.isInCctvMode = false;
    this.camera.position.set(-2.5, this.eyeHeight, 1.0);
    this.camera.lookAt(-2.5, 1.1, 2.15);
    this.controls.lock();
  }

  setCollisionBoxes(boxes) { this.collisionBoxes = boxes; }

  checkCollision(box, dx, dz) {
    this._tempBox.copy(box);
    this._tempBox.min.x += dx;
    this._tempBox.max.x += dx;
    this._tempBox.min.z += dz;
    this._tempBox.max.z += dz;

    for (const other of this.collisionBoxes) {
      if (this._tempBox.intersectsBox(other)) return true;
    }
    return false;
  }

  update(delta) {
    if (this.isInCctvMode || !this.isLocked || this.isJumpscared) return;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    right.normalize();

    let dx = 0, dz = 0;
    if (this.keys.forward) { dx += forward.x; dz += forward.z; }
    if (this.keys.backward) { dx -= forward.x; dz -= forward.z; }
    if (this.keys.left) { dx -= right.x; dz -= right.z; }
    if (this.keys.right) { dx += right.x; dz += right.z; }

    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.001) return;

    dx = (dx / len) * this.moveSpeed * delta;
    dz = (dz / len) * this.moveSpeed * delta;

    const px = this.camera.position.x;
    const pz = this.camera.position.z;

    this._box.min.set(px - this.playerRadius, 0, pz - this.playerRadius);
    this._box.max.set(px + this.playerRadius, this.playerHeight, pz + this.playerRadius);

    // Slide along X then Z
    if (!this.checkCollision(this._box, dx, 0)) {
      this.camera.position.x += dx;
    }
    if (!this.checkCollision(this._box, 0, dz)) {
      this.camera.position.z += dz;
    }

    this.camera.position.y = this.eyeHeight;
  }

  forceLookAt(targetPos, duration) {
    this.isJumpscared = true;
    this.controls.unlock();
    if (document.pointerLockElement) document.exitPointerLock();

    const startQuat = this.camera.quaternion.clone();
    const dir = new THREE.Vector3().subVectors(targetPos, this.camera.position).normalize();
    const targetQuat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, -1), dir
    );
    const startTime = performance.now();

    const animate = () => {
      const t = Math.min((performance.now() - startTime) / duration, 1);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      this.camera.quaternion.copy(startQuat).slerp(targetQuat, eased);
      if (t < 1) requestAnimationFrame(animate);
    };
    animate();
  }

  setInteractiveObjects(objects) { this.interactiveObjects = objects; }

  dispose() { this.controls.disconnect(); }
}
