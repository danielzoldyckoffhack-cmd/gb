import * as THREE from 'three';
import { PlayerController } from '../player/PlayerController.js';
import { CctvSystem } from '../cctv/CctvSystem.js';
import { PicanobuAI } from '../cctv/PicanobuAI.js';
import { AnomalyManager } from '../cctv/AnomalyManager.js';
import { BunkerScene } from '../scenes/BunkerScene.js';
import { FacilityScene } from '../scenes/FacilityScene.js';
import { TimeManager } from './TimeManager.js';
import { StoryDirector } from './StoryDirector.js';
import { UI } from '../ui/UI.js';
import { AudioManager } from '../sound/AudioManager.js';

export class Game {
  constructor(container) {
    this.container = container;
    this.isRunning = false;
    this.isCctvMode = false;
    this._lastFrameTime = 0;
    this._elapsed = 0;
    this.battery = 100;
    this.isGameOver = false;

    this._initRenderer();
    this._initScenes();
    this._initSystems();
    this._initUI();
    this._wireCallbacks();
    console.log('PICANOBU: Game ready');
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x080808);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.5;
    this.container.prepend(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 30);
    this.camera.position.set(-2.5, 1.5, 1.0);
    this.camera.lookAt(-2.5, 1.1, 2.15);
  }

  _initScenes() {
    this.bunkerScene = new BunkerScene();
    this.facilityScene = new FacilityScene();
  }

  _initSystems() {
    this.time = new TimeManager();
    this.ai = new PicanobuAI();
    this.anomalyManager = new AnomalyManager(this.facilityScene);
    this.story = new StoryDirector(this.time, this.anomalyManager, this.ai);
    this.cctvSystem = new CctvSystem(this.facilityScene);
    this.player = new PlayerController(this.camera, this.renderer.domElement);
    this.audio = new AudioManager();

    this.player.setInteractiveObjects(this.bunkerScene.interactiveObjects);
    this.player.setCollisionBoxes(this.bunkerScene.getCollisionBoxes());

    const vhsMat = this.cctvSystem.createRenderTarget(640, 480);
    this.bunkerScene.setMonitorTexture(vhsMat);
  }

  _initUI() {
    this.ui = new UI();
    this.ui.setObjective('Awasi sistem CCTV — lapor anomali');
    this.ui.setBattery(1);
    this._addStartOverlay();
  }

  _addStartOverlay() {
    const o = document.createElement('div');
    o.id = 'start-overlay';
    o.innerHTML = `
<div class="start-glitch" data-text="PICANOBU">PICANOBU</div>
<div class="start-sub">SEKTOR 7 — SISTEM CCTV</div>
<div class="start-year">1996</div>
<div class="start-prompt">[ KLIK UNTUK MULAI ]</div>
<div class="start-warn">SESUATU BERADA DI DALAM KABEL</div>`;
    document.body.appendChild(o);
    this.startOverlay = o;
  }

  _removeStartOverlay() {
    if (!this.startOverlay) return;
    const o = this.startOverlay;
    o.style.transition = 'opacity 0.8s';
    o.style.opacity = '0';
    setTimeout(() => { if (o.parentNode) o.remove(); }, 900);
    this.startOverlay = null;
  }

  _wireCallbacks() {
    this.player.onFirstClick = () => {
      this._removeStartOverlay();
      this.audio.init();
      this.audio.startAmbient();
    };

    this.player.onInteract = (action, obj) => {
      if (action === 'exitCctv') { this._exitCctvMode(); return; }
      if (action === 'chair') { this._enterCctvMode(); this.audio.playCameraSwitch(); }
      else if (action === 'breaker') {
        if (this.anomalyManager.isPowerOut()) {
          this.bunkerScene.setBreakerReset(true);
          this.anomalyManager.resetPower();
          this.ai.restorePower();
          this.ui.setObjective('Awasi CCTV — anomali terdeteksi');
          this.ui.showMessage('LISTRIK PULIH', 2000);
          this.audio.playUITick();
        }
      }
    };

    this.ai.onNodeAdvance = (node) => {
      this.cctvSystem.switchCamera(node.id - 1);
      this.audio.playGlitchBurst();
      this.anomalyManager.triggerAnomaly(this.time.phase.id);
    };

    this.ai.onJumpscare = () => {
      this._triggerJumpscare();
    };

    this.ai.onPowerOut = () => {
      this.ui.setObjective('⚠ RESET SAKELAR LISTRIK');
      this.ui.showMessage('LISTRIK PADAM — RESET SAKELAR DI BELAKANG', 4000);
      this.audio.playPowerOut();
      if (this.isCctvMode) this._exitCctvMode();
    };

    this.time.onPhaseChange = (phase) => {
      this.audio.playStaticBurst(0.4, 0.4);
    };

    this.anomalyManager.onResolved = (anomaly) => {
      this.audio.playUITick();
      const msgs = {
        displacement: 'KOORDINAT STABIL',
        mannequin: 'FIGUR MENGHILANG',
        mold: 'SPORA TERNETRALISIR',
        intruder: 'PENYUSUP TAK TERDETEKSI',
        powerLeak: 'DAYA STABIL',
      };
      this.ui.showMessage(msgs[anomaly.type] || 'ANOMALI TERPURGE', 3000);
      this.ui.setObjective('Awasi CCTV — anomali terdeteksi');
    };

    this.anomalyManager.onFailed = (anomaly) => {
      this.ui.showMessage(`⚠ ANOMALI: ${anomaly.label} TIDAK TERTANGANI`, 3000);
      this.audio.playStaticBurst(0.5, 0.6);
      this.ui.setObjective('⚠ Anomali tidak tertangani — tingkatkan kewaspadaan');
    };

    this.story.onNarrativeEvent = (ev) => {
      if (ev.text) this.ui.showMessage(ev.text, ev.critical ? 5000 : 3000);
      if (ev.glitch) this.audio.playGlitchBurst();
    };

    window.addEventListener('resize', () => this._resize());
  }

  _enterCctvMode() {
    this.isCctvMode = true;
    this.player.enterCctvMode();
    this.cctvSystem.switchCamera(0);
    this.ui.setCameraLabel(this.facilityScene.getCameraConfig(0).label);
    this.ui.setObjective('Awasi CCTV — pantau setiap sudut');
  }

_exitCctvMode() {
    this.isCctvMode = false;
    this.player.exitCctvMode();
    this.ui.setCameraLabel(null);
    this.ui.setObjective('Awasi CCTV — anomali terdeteksi');
    this.camera.position.set(-2.5, 1.5, 1.0);
    this.camera.lookAt(-2.5, 1.1, 2.15);
  }

  _triggerJumpscare() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.isRunning = false;

    const targetPos = new THREE.Vector3(-2.5, 1.2, 1.5);
    this.player.forceLookAt(targetPos, 600);

    setTimeout(() => {
      this.ui.showJumpscare(2000, () => {
        this.audio.playScream();
        this._showReport();
      });
    }, 500);
  }

  _showReport() {
    const report = this.anomalyManager.generateReport(this._elapsed);
    this.ui.showReport(report);

    const handleRestart = (e) => {
      if (e.code === 'Space') {
        window.removeEventListener('keydown', handleRestart);
        location.reload();
      }
    };
    window.addEventListener('keydown', handleRestart);
  }

  _resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.cctvSystem.resize(640, 480);
  }

  start() {
    this.isRunning = true;
    this._lastFrameTime = performance.now();
    this._loop(performance.now());
  }

  _loop(time) {
    if (this.isGameOver) return;

    requestAnimationFrame((t) => this._loop(t));

    const dt = Math.min(time - this._lastFrameTime, 50);
    const dts = dt / 1000;
    this._lastFrameTime = time;
    this._elapsed += dts;

    // Update systems
    this.time.tick(dts);
    this.player.update(dts);
    this.anomalyManager.update(dts, this.isCctvMode);
    this.ai.update(time, dt);
    this.story.update(this.time.totalSeconds);

    // Battery drain
    this.battery = Math.max(0, this.battery - dts * 0.4 * (1 + this.ai.glitchIntensity * 0.5));
    this.ui.setBattery(this.battery / 100);
    if (this.battery <= 0 && !this.isGameOver) {
      this.ai.triggerJumpscare();
      return;
    }

    // VHS effects
    const ts = time / 1000;
    this.cctvSystem.setTime(ts);
    this.cctvSystem.setGlitchIntensity(this.ai.glitchIntensity);

    // Audio ambience
    this.audio.setAmbientIntensity(this.ai.glitchIntensity);
    if (this.ai.glitchIntensity > 0.3 && Math.random() < this.ai.glitchIntensity * 0.002) {
      this.audio.playStaticBurst(0.06, this.ai.glitchIntensity * 0.2);
    }

    // Animate scenes
    this.facilityScene.update(time);
    this._animateBunker(time);

    // Render
    this.cctvSystem.render(this.renderer);
    this.renderer.render(this.bunkerScene.group, this.camera);

    // UI updates
    if (this.isCctvMode) {
      const activeCfg = this.facilityScene.getCameraConfig(this.cctvSystem.getActiveCameraIndex());
      this.ui.setCameraLabel(activeCfg.label);
    }

    const anomalyLabel = this.anomalyManager.getActiveLabel();
    if (anomalyLabel) {
      const timer = this.anomalyManager.getActiveTimer();
      this.ui.setObjective(`${anomalyLabel} [${timer}s]`);
    }

    // Interaction prompt
    if (!this.isCctvMode && this.player.isLocked && !this.isGameOver) {
      const label = this.player.getInteractionLabel();
      this.ui.setInteraction(label);
    } else {
      this.ui.setInteraction(null);
    }
  }

  _animateBunker(time) {
    const flick = Math.sin(time * 0.003 + Math.random() * 0.5);
    const intensity = flick > 0.9 ? 0.2 + Math.random() * 0.5 : 1.0;
    const baseIntensity = 3.0 * (0.5 + (this.battery / 100) * 0.5);
    if (this.bunkerScene.mainLight) {
      this.bunkerScene.mainLight.intensity = intensity * baseIntensity;
    }
    this.bunkerScene.setRoomStatic(this.ai.glitchIntensity * 0.15);
  }

  dispose() {
    this.isRunning = false;
    if (this.audio) this.audio.dispose();
    if (this.player) this.player.dispose();
    if (this.cctvSystem) this.cctvSystem.dispose();
    if (this.renderer) this.renderer.dispose();
    if (this.ui) this.ui.dispose();
  }
}
