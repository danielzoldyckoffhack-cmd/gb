export const PHASES = {
  PHASE_1: { id: 1, name: 'THE SUBTLE BLEED', start: 0, end: 90 },
  PHASE_2: { id: 2, name: 'THE MANIFESTATION', start: 90, end: 180 },
  PHASE_3: { id: 3, name: 'THE PHYSICAL BREACH', start: 180, end: 270 },
  PHASE_4: { id: 4, name: 'CONVERGENCE', start: 270, end: 360 },
};

export class TimeManager {
  constructor() {
    this.totalSeconds = 0;
    this.phase = PHASES.PHASE_1;
    this.speedMultiplier = 1;
    this.onPhaseChange = null;
    this.isPaused = false;
  }

  get gameHours() { return this.totalSeconds / 3600; }
  get gameMinutes() { return (this.totalSeconds / 60) % 60; }
  get formattedTime() {
    const h = Math.floor(this.gameHours) % 12 || 12;
    const m = Math.floor(this.gameMinutes);
    const ampm = Math.floor(this.gameHours) % 24 < 12 ? 'AM' : 'PM';
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  }
  get phaseProgress() {
    const p = this.phase;
    return (this.totalSeconds - p.start) / (p.end - p.start);
  }

  tick(deltaSeconds) {
    if (this.isPaused) return;

    this.totalSeconds += deltaSeconds * this.speedMultiplier;

    if (this.totalSeconds >= 360) {
      this.totalSeconds = 360;
      return;
    }

    const nextPhase = Object.values(PHASES).find(p =>
      this.totalSeconds >= p.start && this.totalSeconds < p.end
    );
    if (nextPhase && nextPhase.id !== this.phase.id) {
      this.phase = nextPhase;
      if (this.onPhaseChange) this.onPhaseChange(this.phase);
    }
  }

  getPhaseForTime(seconds) {
    return Object.values(PHASES).find(p =>
      seconds >= p.start && seconds < p.end
    ) || PHASES.PHASE_1;
  }
}
