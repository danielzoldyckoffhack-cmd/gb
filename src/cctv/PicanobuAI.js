const CCTV_NODES = [
  { id: 1, name: 'CAM-01', label: 'CAM-01: LORONG UTAMA' },
  { id: 2, name: 'CAM-02', label: 'CAM-02: KORIDOR B' },
  { id: 3, name: 'CAM-03', label: 'CAM-03: SERVER HUB' },
  { id: 4, name: 'CAM-04', label: 'CAM-04: DRAINASE' },
];

export class PicanobuAI {
  constructor() {
    this.nodes = CCTV_NODES;
    this.currentNodeIndex = 0;
    this.glitchIntensity = 0;
    this.aggression = 1.0;
    this.isJumpscareActive = false;
    this.isPowerOut = false;
    this.isGameOver = false;
    this.targetGlitchIntensity = 0;
    this._moveTimer = 0;
    this._baseMoveInterval = 8000;
    this._glitchDecayTimer = 0;

    this.onNodeAdvance = null;
    this.onJumpscare = null;
    this.onGlitchChange = null;
    this.onPowerOut = null;

    this._scheduleNextMove();
  }

  _scheduleNextMove() {
    const jitter = Math.random() * 0.4 + 0.8;
    this._moveTimer = performance.now() + (this._baseMoveInterval / this.aggression) * jitter;
  }

  update(time, deltaMs) {
    if (this.isJumpscareActive || this.isGameOver) return;

    // Advance along CCTV nodes
    if (time >= this._moveTimer && !this.isPowerOut) {
      if (this.currentNodeIndex < this.nodes.length - 1) {
        this.currentNodeIndex++;
        this.aggression = Math.min(this.aggression + 0.12, 3.5);
        this._updateGlitchIntensity();
        if (this.onNodeAdvance) {
          this.onNodeAdvance(this.nodes[this.currentNodeIndex]);
        }
      } else {
        this.isJumpscareActive = true;
        this.targetGlitchIntensity = 1.0;
        if (this.onJumpscare) this.onJumpscare();
        return;
      }
      this._scheduleNextMove();
    }

    // Glitch intensity decay (when no anomaly active)
    this._glitchDecayTimer += deltaMs;
    if (this._glitchDecayTimer > 2000 && this.targetGlitchIntensity > 0.2) {
      this.targetGlitchIntensity = Math.max(0.15, this.targetGlitchIntensity - 0.01);
    }

    // Smooth glitch interpolation
    this.glitchIntensity += (this.targetGlitchIntensity - this.glitchIntensity) * 0.05;
    if (Math.abs(this.glitchIntensity - this.targetGlitchIntensity) < 0.01) {
      this.glitchIntensity = this.targetGlitchIntensity;
    }
  }

  _updateGlitchIntensity() {
    const progress = this.currentNodeIndex / (this.nodes.length - 1);
    this.targetGlitchIntensity = 0.15 + progress * 0.85;
    this._glitchDecayTimer = 0;
  }

  triggerGlobalGlitch(intensity, durationMs) {
    this.targetGlitchIntensity = Math.min(1, this.glitchIntensity + intensity);
    this._glitchDecayTimer = -durationMs;
  }

  retreat() {
    if (this.isJumpscareActive || this.isPowerOut) return false;
    this.currentNodeIndex = Math.max(0, this.currentNodeIndex - 1);
    this.aggression = Math.max(1.0, this.aggression - 0.25);
    this._updateGlitchIntensity();
    this._scheduleNextMove();
    this._glitchDecayTimer = -4000;
    if (this.onNodeAdvance) {
      this.onNodeAdvance(this.nodes[this.currentNodeIndex]);
    }
    return true;
  }

  triggerPowerOut() {
    this.isPowerOut = true;
    this.targetGlitchIntensity = 1.0;
    if (this.onPowerOut) this.onPowerOut();
  }

  restorePower() {
    this.isPowerOut = false;
    this.targetGlitchIntensity = 0.15 + (this.currentNodeIndex / (this.nodes.length - 1)) * 0.35;
  }

  triggerJumpscare() {
    this.isJumpscareActive = true;
    this.isGameOver = true;
    this.targetGlitchIntensity = 1.0;
    if (this.onJumpscare) this.onJumpscare();
  }

  get currentNode() { return this.nodes[this.currentNodeIndex]; }
  get currentCameraId() { return this.nodes[this.currentNodeIndex].id; }
  get progression() { return this.currentNodeIndex / (this.nodes.length - 1); }
}
