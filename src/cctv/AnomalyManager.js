export class AnomalyManager {
  constructor(facilityScene) {
    this.facility = facilityScene;
    this.anomalies = null;
    this.activeAnomaly = null;
    this.responseTimer = 0;
    this.responseDuration = 30;
    this.onResolved = null;
    this.onFailed = null;
    this.glitches = 0;
    this.powerOut = false;
    this._initPool();
  }

  _initPool() {
    this.anomalies = [
      {
        type: 'displacement',
        label: 'PERGESERAN RUANG',
        desc: 'Koordinat spasial tidak cocok',
        camIdx: 0,
        severity: 1,
        cctvOnly: false,
        resolveCondition: () => true,
        activate: () => this.facility.applyAnomaly('displacement', 0, true),
        deactivate: () => this.facility.applyAnomaly('displacement', 0, false),
      },
      {
        type: 'mannequin',
        label: 'FIGUR BERDIRI',
        desc: 'Sesuatu berdiri di dalam bayangan',
        camIdx: 3,
        severity: 2,
        cctvOnly: true,
        resolveCondition: () => true,
        activate: () => this.facility.applyAnomaly('mannequin', 3, true),
        deactivate: () => this.facility.applyAnomaly('mannequin', 3, false),
      },
      {
        type: 'mold',
        label: 'JAMUR KELAM',
        desc: 'Spora gelap menyebar di ventilasi',
        camIdx: 1,
        severity: 3,
        cctvOnly: false,
        resolveCondition: () => true,
        activate: () => this.facility.applyAnomaly('mold', 1, true),
        deactivate: () => this.facility.applyAnomaly('mold', 1, false),
      },
      {
        type: 'intruder',
        label: 'PENYUSUP TAK TAMPAK',
        desc: 'Suhu turun drastis — sesuatu masuk',
        camIdx: 2,
        severity: 4,
        cctvOnly: false,
        resolveCondition: () => true,
        activate: () => this.facility.applyAnomaly('intruder', 2, true),
        deactivate: () => this.facility.applyAnomaly('intruder', 2, false),
      },
      {
        type: 'powerLeak',
        label: 'KEBOCORAN ENERGI',
        desc: 'Fluktuasi daya tidak stabil',
        camIdx: 1,
        severity: 5,
        cctvOnly: false,
        resolveCondition: () => true,
        activate: () => {
          this.facility.applyAnomaly('powerLeak', 1, true);
          this.powerOut = true;
        },
        deactivate: () => {
          this.facility.applyAnomaly('powerLeak', 1, false);
          this.powerOut = false;
        },
      },
    ];
  }

  triggerAnomaly(phase) {
    const available = this.anomalies.filter(a => a.severity <= phase + 1 && a.type !== this.activeAnomaly?.type);
    if (available.length === 0) return;
    const picked = available[Math.floor(Math.random() * available.length)];
    this.activeAnomaly = picked;
    this.responseTimer = this.responseDuration;
    picked.activate();
  }

  update(delta, isWatchingCctv) {
    if (!this.activeAnomaly) return;
    this.responseTimer -= delta;

    if (this.responseTimer <= 0) {
      this._resolve(false);
      return;
    }

    // Auto-resolve if player watches the correct camera
    if (isWatchingCctv && this.activeAnomaly.cctvOnly) {
      this._resolve(true);
    }
  }

  _resolve(success) {
    if (!this.activeAnomaly) return;
    if (success) {
      this.activeAnomaly.deactivate();
      if (this.onResolved) this.onResolved(this.activeAnomaly);
    } else {
      this.glitches++;
      this.activeAnomaly.deactivate();
      if (this.activeAnomaly.severity >= 4) {
        this.powerOut = true;
      }
      if (this.onFailed) this.onFailed(this.activeAnomaly);
    }
    this.activeAnomaly = null;
    this.responseTimer = 0;
  }

  getActiveLabel() {
    if (!this.activeAnomaly) return null;
    return `${this.activeAnomaly.label}: ${this.activeAnomaly.desc}`;
  }

  getActiveTimer() {
    if (!this.activeAnomaly) return null;
    return Math.ceil(this.responseTimer);
  }

  isPowerOut() { return this.powerOut; }

  resetPower() {
    this.powerOut = false;
    this.facility.applyAnomaly('powerLeak', 1, false);
  }

  generateReport(totalTime) {
    return {
      totalTime,
      glitches: this.glitches,
      verdict: this.glitches <= 3 ? '✅ SHIFT COMPLETE' : '⚠️  SITE COMPROMISED',
    };
  }
}
