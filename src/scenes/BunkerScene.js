import * as THREE from 'three';

export class BunkerScene {
  constructor() {
    this.group = new THREE.Group();
    this.monitorMesh = null;
    this.deskChair = null;
    this.breakerPanel = null;
    this.interactiveObjects = [];
    this.mainLight = null;
    this.collisionBoxes = [];
    this._build();
  }

  _addBox(x, y, z, w, h, d, mat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    this.group.add(m);
  }

  _addCollider(x, z, w, d) {
    this.collisionBoxes.push(new THREE.Box3(
      new THREE.Vector3(x - w / 2, 0, z - d / 2),
      new THREE.Vector3(x + w / 2, 3, z + d / 2)
    ));
  }

  _build() {
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.85 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xb8a88a, roughness: 0.9, side: THREE.DoubleSide });
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0xd4c9b0, roughness: 0.95, side: THREE.DoubleSide });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4, metalness: 0.6 });
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3, metalness: 0.7 });

    // Room dimensions: 10w x 10d x 3h, centered, door at z=5

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Walls
    this._addBox(0, 1.5, -5, 10, 3, 0.2, wallMat);
    this._addCollider(0, -5, 10, 0.2);
    this._addBox(-5, 1.5, 0, 0.2, 3, 10, wallMat);
    this._addCollider(-5, 0, 0.2, 10);
    this._addBox(5, 1.5, 0, 0.2, 3, 10, wallMat);
    this._addCollider(5, 0, 0.2, 10);
    // Front wall with door
    this._addBox(-2.75, 1.5, 5, 4.5, 3, 0.2, wallMat);
    this._addCollider(-2.75, 5, 4.5, 0.2);
    this._addBox(2.75, 1.5, 5, 4.5, 3, 0.2, wallMat);
    this._addCollider(2.75, 5, 4.5, 0.2);
    this._addBox(0, 2.6, 5, 1, 0.8, 0.2, wallMat);
    this._addCollider(0, 5, 1, 0.2);

    // Ceiling
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = 3;
    this.group.add(ceil);

    // ── Metal Desk ──
    const desktMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.4, metalness: 0.7 });
    this._addBox(-2.5, 0.85, 1.8, 2.4, 0.06, 1.0, desktMat);
    this._addBox(-2.5, 0.43, 1.8, 0.04, 0.82, 0.04, darkMetal);
    for (const [lx, lz] of [[-1.35, 1.35], [-3.65, 1.35], [-1.35, 2.25], [-3.65, 2.25]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.82, 6), metalMat);
      leg.position.set(lx, 0.41, lz);
      this.group.add(leg);
    }
    this._addCollider(-2.5, 1.8, 2.4, 1.0);

    // ── Monitor (CRT glow) ──
    const crtMat = new THREE.MeshBasicMaterial({ color: 0x003300 });
    this.monitorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.04), crtMat);
    this.monitorMesh.position.set(-2.5, 1.1, 2.15);
    this.group.add(this.monitorMesh);

    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.5 });
    this._addBox(-2.5, 1.1, 2.13, 0.85, 0.6, 0.03, bezelMat);
    this._addBox(-2.5, 0.96, 2.15, 0.15, 0.14, 0.18, darkMetal);

    // ── Keyboard ──
    this._addBox(-2.5, 0.88, 1.45, 0.5, 0.02, 0.25,
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 }));

    // ── Chair ──
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
    this.deskChair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), chairMat);
    this.deskChair.position.set(-2.5, 0.25, 1.7);
    this.deskChair.userData.isChair = true;
    this.deskChair.userData.interactLabel = 'DUDUK [E]';
    this.group.add(this.deskChair);
    this.interactiveObjects.push(this.deskChair);
    this._addCollider(-2.5, 1.7, 0.5, 0.5);

    for (const [kx, kz] of [[-2.7, 1.5], [-2.3, 1.5], [-2.7, 1.9], [-2.3, 1.9]]) {
      const k = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.2, 4), metalMat);
      k.position.set(kx, 0.1, kz);
      this.group.add(k);
    }

    // ── Server Rack ──
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, roughness: 0.4, metalness: 0.3 });
    this._addBox(3.5, 0.9, 2.5, 0.6, 1.8, 0.8, rackMat);
    this._addCollider(3.5, 2.5, 0.6, 0.8);
    // Blinking LEDs
    for (let i = 0; i < 6; i++) {
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.015, 4, 4),
        new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0x00ff00 : 0xff0000 }));
      led.position.set(3.2, 0.3 + i * 0.3, 2.9);
      this.group.add(led);
    }

    // ── Breaker Panel ──
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.3 });
    this.breakerPanel = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.04), panelMat);
    this.breakerPanel.position.set(4.5, 0.8, 4.5);
    this.breakerPanel.userData.isBreaker = true;
    this.breakerPanel.userData.interactLabel = 'RESET SAKELAR [E]';
    this.breakerPanel.userData.isReset = false;
    this.group.add(this.breakerPanel);
    this.interactiveObjects.push(this.breakerPanel);
    this._addCollider(4.5, 4.5, 0.4, 0.04);

    const switchMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    this.breakerSwitch = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.02), switchMat);
    this.breakerSwitch.position.set(4.5, 0.8, 4.48);
    this.group.add(this.breakerSwitch);

    // ── Filing Cabinet ──
    const cabMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.5, metalness: 0.4 });
    this._addBox(-4, 0.6, -3, 0.7, 1.2, 0.5, cabMat);
    this._addCollider(-4, -3, 0.7, 0.5);

    // ── Props ──
    const frameMat = new THREE.MeshBasicMaterial({ color: 0xfffff0 });
    this._addBox(2.5, 2.2, -4.95, 0.3, 0.4, 0.01, frameMat);
    this._addBox(-2, 2.3, -4.95, 0.25, 0.3, 0.01, frameMat);

    // ── Lighting ──
    this.mainLight = new THREE.PointLight(0xffeedd, 3.0, 14, 1.2);
    this.mainLight.position.set(0, 2.8, 0);
    this.mainLight.castShadow = true;
    this.mainLight.shadow.mapSize.set(1024, 1024);
    this.group.add(this.mainLight);

    const deskLamp = new THREE.SpotLight(0xffeedd, 1.2, 6, Math.PI / 5, 0.4, 1.5);
    deskLamp.position.set(-2.5, 1.5, 2.5);
    deskLamp.target.position.set(-2.5, 0.5, 1.8);
    this.group.add(deskLamp);
    this.group.add(deskLamp.target);

    const ambient = new THREE.AmbientLight(0x445566, 0.6);
    this.group.add(ambient);

    // ── CRT burn overlay ──
    const burnMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 });
    this.burnOverlay = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), burnMat);
    this.burnOverlay.position.set(0, 1.5, -4.99);
    this.group.add(this.burnOverlay);
  }

  getCollisionBoxes() { return this.collisionBoxes; }

  setMonitorTexture(texture) {
    if (this.monitorMesh) {
      this.monitorMesh.material = new THREE.MeshBasicMaterial({ map: texture });
    }
  }

  setBreakerReset(reset) {
    if (!this.breakerSwitch) return;
    this.breakerSwitch.position.z = reset ? 4.5 : 4.48;
    this.breakerSwitch.material.color.setHex(reset ? 0x00ff00 : 0xff0000);
    this.breakerPanel.userData.isReset = reset;
  }

  isBreakerReset() { return this.breakerPanel?.userData?.isReset || false; }

  setRoomStatic(intensity) {
    if (this.burnOverlay) this.burnOverlay.material.opacity = intensity * 0.12;
  }
}
