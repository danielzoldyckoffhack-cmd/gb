export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ambientNode = null;
    this.ambientGain = null;
    this.isInitialized = false;
    this.isMuted = false;
    this._noiseBuffer = null;
  }

  init() {
    if (this.isInitialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);
      this._generateNoiseBuffer();
      this.isInitialized = true;
      console.log('PICANOBU AUDIO: Initialized');
    } catch (err) {
      console.warn('PICANOBU AUDIO: Failed to initialize', err);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  _generateNoiseBuffer() {
    const sr = this.ctx.sampleRate;
    const length = sr * 2;
    this._noiseBuffer = this.ctx.createBuffer(1, length, sr);
    const data = this._noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  startAmbient() {
    if (!this.isInitialized || this.ambientNode) return;
    this.resume();

    // Low hum at ~60Hz with slight FM
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 58;

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 62;

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.3;

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 4;
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);

    const humGain = this.ctx.createGain();
    humGain.gain.value = 0.06;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 150;
    filter.Q.value = 1;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(humGain);
    humGain.connect(this.masterGain);

    // Subtle noise floor
    const noiseSrc = this.ctx.createBufferSource();
    noiseSrc.buffer = this._noiseBuffer;
    noiseSrc.loop = true;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value = 0.015;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 2000;

    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    osc1.start();
    osc2.start();
    lfo.start();
    noiseSrc.start();

    this.ambientNode = { osc1, osc2, lfo, lfoGain, humGain, noiseSrc, noiseGain, filter };
  }

  stopAmbient() {
    if (!this.ambientNode) return;
    try {
      this.ambientNode.osc1.stop();
      this.ambientNode.osc2.stop();
      this.ambientNode.lfo.stop();
      this.ambientNode.noiseSrc.stop();
    } catch (_) {}
    this.ambientNode = null;
  }

  setAmbientIntensity(intensity) {
    if (this.ambientNode) {
      const g = 0.03 + intensity * 0.12;
      this.ambientNode.humGain.gain.linearRampToValueAtTime(
        g, this.ctx.currentTime + 0.5
      );
      this.ambientNode.noiseGain.gain.linearRampToValueAtTime(
        0.01 + intensity * 0.06, this.ctx.currentTime + 0.5
      );
    }
  }

  playStaticBurst(duration = 0.15, intensity = 0.3) {
    if (!this.isInitialized) return;
    this.resume();

    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(intensity * 0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000 + Math.random() * 3000;
    filter.Q.value = 0.5;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start();
    src.stop(this.ctx.currentTime + duration + 0.05);
  }

  playGlitchBurst() {
    if (!this.isInitialized) return;
    this.resume();

    const duration = 0.08 + Math.random() * 0.12;
    // Layer 1: noise
    const src1 = this.ctx.createBufferSource();
    src1.buffer = this._noiseBuffer;
    const g1 = this.ctx.createGain();
    g1.gain.setValueAtTime(0.4, this.ctx.currentTime);
    g1.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    const f1 = this.ctx.createBiquadFilter();
    f1.type = 'highpass';
    f1.frequency.value = 3000;
    src1.connect(f1);
    f1.connect(g1);
    g1.connect(this.masterGain);
    src1.start();
    src1.stop(this.ctx.currentTime + duration + 0.05);

    // Layer 2: tone sweep
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200 + Math.random() * 400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      50 + Math.random() * 100, this.ctx.currentTime + duration
    );
    const g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(0.15, this.ctx.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(g2);
    g2.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration + 0.05);
  }

  playJumpscare() {
    if (!this.isInitialized) return;
    this.resume();

    // Massive noise burst
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.0);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(8000, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 1.5);

    const distortion = this.ctx.createWaveShaper();
    distortion.curve = this._makeDistortionCurve(400);

    src.connect(filter);
    filter.connect(distortion);
    distortion.connect(gain);
    gain.connect(this.masterGain);
    src.start();
    src.stop(this.ctx.currentTime + 2.1);

    // Low rumble
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 1.5);
    const gOsc = this.ctx.createGain();
    gOsc.gain.setValueAtTime(0.6, this.ctx.currentTime);
    gOsc.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.8);
    osc.connect(gOsc);
    gOsc.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 2.0);

    // Stinger — short high-pitched sweep
    const stinger = this.ctx.createOscillator();
    stinger.type = 'sawtooth';
    stinger.frequency.setValueAtTime(3000, this.ctx.currentTime);
    stinger.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.6);
    const gStinger = this.ctx.createGain();
    gStinger.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gStinger.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
    stinger.connect(gStinger);
    gStinger.connect(this.masterGain);
    stinger.start();
    stinger.stop(this.ctx.currentTime + 0.9);
  }

  playAnomalyAlert() {
    if (!this.isInitialized) return;
    this.resume();

    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = 880 + i * 120;

      const g = this.ctx.createGain();
      const startTime = this.ctx.currentTime + i * 0.15;
      g.gain.setValueAtTime(0, startTime);
      g.gain.linearRampToValueAtTime(0.08, startTime + 0.02);
      g.gain.linearRampToValueAtTime(0, startTime + 0.12);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2000;
      filter.Q.value = 5;

      osc.connect(filter);
      filter.connect(g);
      g.connect(this.masterGain);
      osc.start(startTime);
      osc.stop(startTime + 0.15);
    }
  }

  playCameraSwitch() {
    if (!this.isInitialized) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.06);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.04, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playUITick() {
    if (!this.isInitialized) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 600;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.02, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playPowerOut() {
    if (!this.isInitialized) return;
    this.resume();

    // Descending tone
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 1.5);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.3, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.5);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.0);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 1.5);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 2.1);
  }

  playScream() {
    if (!this.isInitialized) return;
    this.resume();

    // Procedural human-like scream using formant sweeps
    const duration = 1.8;
    const t0 = this.ctx.currentTime;

    // Base shriek — gliding oscillator with vibrato
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1800, t0);
    osc.frequency.exponentialRampToValueAtTime(400, t0 + duration * 0.4);
    osc.frequency.setValueAtTime(400, t0 + duration * 0.4);
    osc.frequency.exponentialRampToValueAtTime(80, t0 + duration);

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 25;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 80;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const gOsc = this.ctx.createGain();
    gOsc.gain.setValueAtTime(0.45, t0);
    gOsc.gain.linearRampToValueAtTime(0.3, t0 + 0.3);
    gOsc.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t0);
    filter.frequency.exponentialRampToValueAtTime(400, t0 + duration);
    filter.Q.value = 4;

    osc.connect(filter);
    filter.connect(gOsc);
    gOsc.connect(this.masterGain);
    osc.start(t0);
    lfo.start(t0);
    osc.stop(t0 + duration + 0.1);
    lfo.stop(t0 + duration + 0.1);

    // Sub rumble (chest resonance)
    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(120, t0);
    sub.frequency.exponentialRampToValueAtTime(30, t0 + duration);
    const gSub = this.ctx.createGain();
    gSub.gain.setValueAtTime(0.5, t0);
    gSub.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    sub.connect(gSub);
    gSub.connect(this.masterGain);
    sub.start(t0);
    sub.stop(t0 + duration + 0.1);

    // White noise burst (breath)
    const noiseSrc = this.ctx.createBufferSource();
    noiseSrc.buffer = this._noiseBuffer;
    const gNoise = this.ctx.createGain();
    gNoise.gain.setValueAtTime(0.35, t0);
    gNoise.gain.linearRampToValueAtTime(0.15, t0 + 0.2);
    gNoise.gain.exponentialRampToValueAtTime(0.001, t0 + duration * 0.6);
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 2000;
    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(gNoise);
    gNoise.connect(this.masterGain);
    noiseSrc.start(t0);
    noiseSrc.stop(t0 + duration + 0.1);
  }

  _makeDistortionCurve(amount) {
    const samples = 256;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = (Math.PI + amount) * x / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  setMasterVolume(v) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, v));
    }
  }

  mute() {
    this.isMuted = true;
    this.setMasterVolume(0);
  }

  unmute() {
    this.isMuted = false;
    this.setMasterVolume(0.5);
  }

  dispose() {
    this.stopAmbient();
    if (this.ctx) {
      this.ctx.close();
    }
    this.isInitialized = false;
  }
}
