import * as THREE from 'three';
import { VhsShader } from '../shaders/VhsShader.js';

export class CctvSystem {
  constructor(facilityScene) {
    this.facilityScene = facilityScene;
    this.cameras = [];
    this.activeCameraIndex = 0;
    this.renderTarget = null;
    this.vhsMaterial = null;
    this._setupCameras();
  }

  _setupCameras() {
    this.cameraGroup = new THREE.Group();

    for (let i = 0; i < 4; i++) {
      const cam = new THREE.PerspectiveCamera(65, 1, 0.1, 30);
      const cfg = this.facilityScene.getCameraConfig(i);
      cam.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      cam.lookAt(cfg.target[0], cfg.target[1], cfg.target[2]);
      cam.updateMatrixWorld(true);
      this.cameras.push(cam);
    }
  }

  createRenderTarget(width, height) {
    this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: true,
    });

    this.renderTarget.texture.generateMipmaps = false;

    this.vhsMaterial = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(VhsShader.uniforms),
      vertexShader: VhsShader.vertexShader,
      fragmentShader: VhsShader.fragmentShader,
      depthWrite: false,
    });

    this.vhsMaterial.uniforms.tDiffuse.value = this.renderTarget.texture;
    this.vhsMaterial.uniforms.uResolution.value.set(width, height);

    return this.vhsMaterial;
  }

  switchCamera(index) {
    this.activeCameraIndex = Math.max(0, Math.min(index, this.cameras.length - 1));
  }

  getActiveCamera() {
    return this.cameras[this.activeCameraIndex];
  }

  getActiveCameraIndex() {
    return this.activeCameraIndex;
  }

  setGlitchIntensity(value) {
    if (this.vhsMaterial) {
      this.vhsMaterial.uniforms.uGlitchIntensity.value = value;
    }
  }

  setTime(value) {
    if (this.vhsMaterial) {
      this.vhsMaterial.uniforms.uTime.value = value;
    }
  }

  render(renderer) {
    if (!this.renderTarget) return;

    const camera = this.getActiveCamera();
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this.facilityScene.scene, camera);
    renderer.setRenderTarget(null);
  }

  resize(width, height) {
    if (this.renderTarget) {
      this.renderTarget.setSize(width, height);
    }
    if (this.vhsMaterial) {
      this.vhsMaterial.uniforms.uResolution.value.set(width, height);
    }
  }

  dispose() {
    if (this.renderTarget) this.renderTarget.dispose();
    if (this.vhsMaterial) this.vhsMaterial.dispose();
  }
}
