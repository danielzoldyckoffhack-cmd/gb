import * as THREE from 'three';

function wallBox(x, z, w, d, label) {
  const b = new THREE.Box3(
    new THREE.Vector3(x - w / 2, 0, z - d / 2),
    new THREE.Vector3(x + w / 2, 3, z + d / 2)
  );
  b.userData = { label };
  return b;
}

export class FacilityScene {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);
    this.scene.fog = new THREE.FogExp2(0x050505, 0.018);
    this.collisionBoxes = [];
    this.picanobu = null;
    this.picanobuLight = null;
    this.picanobuVisible = false;
    this.anomalyFlags = { displacement: false, mannequin: false, mold: false, intruder: false, powerLeak: false };
    this._build();
  }

  _addBox(x, y, z, w, h, d, mat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    this.scene.add(m);
  }

  _addCollider(x, z, w, d, label) {
    this.collisionBoxes.push(wallBox(x, z, w, d, label));
  }

  _build() {
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.95, side: THREE.DoubleSide });
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1, side: THREE.DoubleSide });

    // ─── ROOM A: Corridor Entrance (z -4 to 0) ───
    for (let z = -4; z < 0; z += 5) {
      const f = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), floorMat);
      f.rotation.x = -Math.PI / 2;
      f.position.set(5, 0, z + 2.5);
      this.scene.add(f);
      const c = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), ceilMat);
      c.rotation.x = Math.PI / 2;
      c.position.set(5, 3, z + 2.5);
      this.scene.add(c);
    }

    // ─── CORRIDOR B: z 0 to 14 ───
    for (let z = 0; z < 14; z += 7) {
      const f = new THREE.Mesh(new THREE.PlaneGeometry(6, 7), floorMat);
      f.rotation.x = -Math.PI / 2;
      f.position.set(5, 0, z + 3.5);
      this.scene.add(f);
      const c = new THREE.Mesh(new THREE.PlaneGeometry(6, 7), ceilMat);
      c.rotation.x = Math.PI / 2;
      c.position.set(5, 3, z + 3.5);
      this.scene.add(c);
    }

    // ─── ROOM C: Server Hub (x 8 to 14, z 4 to 12) ───
    for (let x = 8; x < 14; x += 7) {
      for (let z = 4; z < 12; z += 9) {
        const f = new THREE.Mesh(new THREE.PlaneGeometry(7, 9), floorMat);
        f.rotation.x = -Math.PI / 2;
        f.position.set(x + 3.5, 0, z + 4.5);
        this.scene.add(f);
        const c = new THREE.Mesh(new THREE.PlaneGeometry(7, 9), ceilMat);
        c.rotation.x = Math.PI / 2;
        c.position.set(x + 3.5, 3, z + 4.5);
        this.scene.add(c);
      }
    }

    // ─── ROOM D: Drainage (x -2 to 2, z 12 to 17) ───
    const f = new THREE.Mesh(new THREE.PlaneGeometry(4, 5), floorMat);
    f.rotation.x = -Math.PI / 2;
    f.position.set(0, 0, 14.5);
    this.scene.add(f);
    const c = new THREE.Mesh(new THREE.PlaneGeometry(4, 5), ceilMat);
    c.rotation.x = Math.PI / 2;
    c.position.set(0, 3, 14.5);
    this.scene.add(c);

    // ─── WALLS with COLLISION ───

    // Corridor B walls (x 2 to 8, z 0 to 14)
    this._addBox(2, 1.5, 7, 0.15, 3, 14, wallMat);
    this._addCollider(2, 7, 0.15, 14, 'corridor_left');
    this._addBox(8, 1.5, 7, 0.15, 3, 14, wallMat);
    this._addCollider(8, 7, 0.15, 14, 'corridor_right');

    // Corridor entrance walls (x 2 to 8, z -4 to 0)
    this._addBox(2, 1.5, -2, 0.15, 3, 4, wallMat);
    this._addCollider(2, -2, 0.15, 4, 'entrance_left');
    this._addBox(8, 1.5, -2, 0.15, 3, 4, wallMat);
    this._addCollider(8, -2, 0.15, 4, 'entrance_right');

    // Back wall corridor (z = -4)
    this._addBox(5, 1.5, -4, 6, 3, 0.15, wallMat);
    this._addCollider(5, -4, 6, 0.15, 'corridor_back');

    // End wall corridor (z = 14) with door
    this._addBox(3.5, 1.5, 14, 3, 3, 0.15, wallMat);
    this._addCollider(3.5, 14, 3, 0.15, 'end_left');
    this._addBox(6.5, 1.5, 14, 3, 3, 0.15, wallMat);
    this._addCollider(6.5, 14, 3, 0.15, 'end_right');

    // Room C walls (Server Hub, x 8 to 14, z 4 to 12) — with door at z=12, x=10
    this._addBox(8, 1.5, 8, 0.15, 3, 8, wallMat);
    this._addCollider(8, 8, 0.15, 8, 'server_left');
    this._addBox(14, 1.5, 8, 0.15, 3, 8, wallMat);
    this._addCollider(14, 8, 0.15, 8, 'server_right');
    this._addBox(11, 1.5, 4, 6, 3, 0.15, wallMat);
    this._addCollider(11, 4, 6, 0.15, 'server_front_left');
    this._addBox(11, 1.5, 12, 6, 3, 0.15, wallMat);
    this._addCollider(11, 12, 6, 0.15, 'server_back');

    // Room D walls (Drainage, x 0 to 4, z 12 to 17)
    this._addBox(0, 1.5, 14.5, 4, 3, 5, wallMat); // just a box room
    this._addCollider(0, 14.5, 4, 5, 'drainage');

    // ─── PILLARS in Corridor B ───
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
    for (const [px, pz] of [[3.5, 2], [6.5, 2], [3.5, 6], [6.5, 6], [3.5, 10], [6.5, 10]]) {
      this._addBox(px, 1.5, pz, 0.4, 3, 0.4, pillarMat);
      this._addCollider(px, pz, 0.4, 0.4, 'pillar');
    }

    // ─── METAL CRATES ───
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x4a4a2a, roughness: 0.7 });
    for (const [cx, cz] of [[3, 4], [7, 5], [4, 8], [6, 9]]) {
      this._addBox(cx, 0.4, cz, 0.8, 0.8, 0.8, crateMat);
      this._addCollider(cx, cz, 0.8, 0.8, 'crate');
    }

    // ─── SERVERS in Room C ───
    const serverMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, roughness: 0.4, metalness: 0.3 });
    for (let sx = 9; sx < 13.5; sx += 1.2) {
      for (let sz = 5.5; sz < 11; sz += 1.5) {
        this._addBox(sx, 0.9, sz, 0.4, 1.8, 0.6, serverMat);
        this._addCollider(sx, sz, 0.4, 0.6, 'server');
      }
    }

    // ─── CENTRAL CORE in Room C ───
    const coreMat = new THREE.MeshStandardMaterial({ color: 0x0a0a2a, roughness: 0.3, metalness: 0.6, emissive: 0x000066, emissiveIntensity: 0.2 });
    this._addBox(11, 1.2, 8, 1.2, 2.4, 1.2, coreMat);
    this._addCollider(11, 8, 1.2, 1.2, 'core');

    // ─── PIPES in Room D ───
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.4, roughness: 0.5 });
    for (let z = 12.5; z < 17; z += 0.5) {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4, 6), pipeMat);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(2, 2.6, z);
      this.scene.add(pipe);
    }

    // ─── PICANOBU 3D MESH ───
    this.picanobu = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9, emissive: 0x220000, emissiveIntensity: 0.1 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.8, transparent: true, opacity: 0.15 });

    // Torso — elongated, emaciated
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.2, 6), skinMat);
    torso.position.y = 1.1;
    this.picanobu.add(torso);

    // Head — distorted sphere
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), skinMat);
    head.position.y = 1.85;
    head.scale.set(1, 1.5, 0.85);
    head.position.z = -0.02;
    this.picanobu.add(head);

    // White dress/shroud (kuntilanak style)
    const dress = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.8, 0.7, 6), whiteMat);
    dress.position.y = 0.6;
    this.picanobu.add(dress);

    // Arms — long, asymmetrical
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 1.0, 4), skinMat);
      arm.position.set(side * 0.38, 1.1, 0);
      arm.rotation.z = side * 0.5;
      arm.rotation.x = 0.5;
      this.picanobu.add(arm);
    }

    // Legs
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.5, 4), skinMat);
      leg.position.set(side * 0.12, 0.25, 0);
      this.picanobu.add(leg);
    }

    // Face — generated canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('☠', 64, 70);
    ctx.fillStyle = '#ff0000';
    ctx.font = '12px monospace';
    ctx.fillText('PICANOBU', 64, 110);
    const faceTex = new THREE.CanvasTexture(canvas);
    faceTex.minFilter = THREE.NearestFilter;
    faceTex.magFilter = THREE.NearestFilter;

    const faceMat = new THREE.MeshBasicMaterial({ map: faceTex, transparent: true, opacity: 0.6 });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.15), faceMat);
    face.position.set(0, 1.9, -0.1);
    this.picanobu.add(face);

    // Hair strands
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 1 });
    for (let i = 0; i < 7; i++) {
      const strand = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.001, 0.4, 3), hairMat);
      strand.position.set(-0.08 + i * 0.025, 1.6, -0.03);
      strand.rotation.x = 0.3;
      this.picanobu.add(strand);
    }

    // Red eye glow
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 4), eyeMat);
      eye.position.set(side * 0.06, 1.9, -0.08);
      this.picanobu.add(eye);
    }

    // Point light attached to Picanobu
    this.picanobuLight = new THREE.PointLight(0xff0000, 0.12, 4, 2);
    this.picanobuLight.position.set(0, 1.2, 0);
    this.picanobu.add(this.picanobuLight);

    this.picanobu.position.set(5, 0, -2);
    this.picanobu.visible = false;
    this.scene.add(this.picanobu);

    // ─── LIGHTING ───
    this.roomLights = [];
    for (const [lx, lz] of [[3.5, 1], [6.5, 1], [3.5, 5], [6.5, 5], [3.5, 9], [6.5, 9], [3.5, 13], [5, 13]]) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffeedd }));
      bulb.position.set(lx, 2.9, lz);
      this.scene.add(bulb);
      const pl = new THREE.PointLight(0xffeedd, 0.6, 8, 1.8);
      pl.position.set(lx, 2.8, lz);
      this.scene.add(pl);
      this.roomLights.push({ bulb, light: pl, baseIntensity: 0.6, pos: new THREE.Vector3(lx, 2.8, lz) });
    }

    // Server room lights
    for (const [lx, lz] of [[9.5, 6], [12.5, 6], [9.5, 10], [12.5, 10]]) {
      const pl = new THREE.PointLight(0x4488ff, 0.3, 6, 2);
      pl.position.set(lx, 2.8, lz);
      this.scene.add(pl);
      this.roomLights.push({ bulb: null, light: pl, baseIntensity: 0.3, pos: new THREE.Vector3(lx, 2.8, lz) });
    }

    this.ambient = new THREE.AmbientLight(0x112233, 0.25);
    this.scene.add(this.ambient);
  }

  getCollisionBoxes() { return this.collisionBoxes; }

  getCameraConfig(index) {
    const cfgs = [
      { pos: [2.5, 1.6, -0.5], target: [5, 0.8, 3], label: 'CAM-01: LORONG UTAMA' },
      { pos: [7.5, 1.6, 2.5], target: [4, 0.8, 6], label: 'CAM-02: KORIDOR B' },
      { pos: [9.5, 1.6, 5.5], target: [11, 0.8, 8], label: 'CAM-03: SERVER HUB' },
      { pos: [1.5, 1.6, 13.5], target: [0, 0.8, 15], label: 'CAM-04: DRAINASE' },
    ];
    return cfgs[index] || cfgs[0];
  }

  setPicanobuVisible(visible) {
    this.picanobuVisible = visible;
    if (this.picanobu) this.picanobu.visible = visible;
  }

  applyAnomaly(type, camIdx, active) {
    this.anomalyFlags[type] = active;

    switch (type) {
      case 'displacement':
        // Visual: crate rotated
        break;
      case 'mannequin':
        if (camIdx === 3) this.setPicanobuVisible(active);
        break;
      case 'mold':
        this.scene.fog.color.setHex(active ? 0x112211 : 0x050505);
        this.scene.background.setHex(active ? 0x112211 : 0x050505);
        break;
      case 'intruder':
        this.scene.background.setHex(active ? 0x220000 : 0x050505);
        break;
      case 'powerLeak':
        // Kill room lights
        for (const rl of this.roomLights) {
          rl.light.intensity = active ? 0.02 : rl.baseIntensity;
        }
        break;
    }
  }

  update(time) {
    // Flicker lights
    for (const rl of this.roomLights) {
      const f = Math.sin(time * 0.003 + rl.pos.x * 0.5) > 0.94
        ? 0.08 + Math.random() * 0.1
        : rl.baseIntensity;
      rl.light.intensity = f;
    }

    // Animate Picanobu
    if (this.picanobu && this.picanobu.visible) {
      this.picanobu.position.y = Math.sin(time * 0.0008) * 0.03;
      this.picanobu.rotation.y = Math.sin(time * 0.0004) * 0.15;
      this.picanobu.rotation.z = Math.sin(time * 0.0012) * 0.02;
      this.picanobuLight.intensity = 0.08 + Math.sin(time * 0.005) * 0.06;
    }
  }
}
