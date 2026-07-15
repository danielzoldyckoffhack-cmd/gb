export class StoryDirector {
  constructor(timeManager, anomalyManager, picanobuAI) {
    this.time = timeManager;
    this.anomalyManager = anomalyManager;
    this.ai = picanobuAI;
    this.narrativeEvents = [];
    this.currentEventIndex = 0;
    this.onNarrativeEvent = null;

    this._buildSchedule();
  }

  _buildSchedule() {
    this.narrativeEvents = [
      // Phase 1: Subtle Bleed
      { time: 10,  phase: 1, text: 'RECEIVING SIGNAL... ALL FEEDS NOMINAL.', critical: false },
      { time: 30,  phase: 1, text: 'ARCHIVAL LOG 1128-A: ROUTINE MAINTENANCE SHIFT.', critical: false },
      { time: 60,  phase: 1, text: 'CAM-02: OBJECT MISALIGNMENT DETECTED IN SECTOR B.', critical: true, anomalyType: 'displacement', cameraId: 2 },
      { time: 80,  phase: 1, text: 'FACILITY IS QUIET. TOO QUIET.', critical: false },

      // Phase 2: Manifestation
      { time: 100, phase: 2, text: 'WE ARE IN THE WIRE.', critical: false, glitch: true },
      { time: 125, phase: 2, text: 'CAM-04: UNIDENTIFIED FIGURE IN SUB-LEVEL 3.', critical: true, anomalyType: 'mannequin', cameraId: 4 },
      { time: 145, phase: 2, text: 'THE SIGNAL CARRIES MEMORIES. WHOSE?', critical: false, glitch: true },
      { time: 160, phase: 2, text: 'AUDIO BLEED ON ALL CHANNELS. CORRUPTED WAVEFORM.', critical: true, anomalyType: 'audioBleed', cameraId: 1 },

      // Phase 3: Physical Breach
      { time: 190, phase: 3, text: '⚠ POWER GRID FAILURE IMMINENT. BACKUP GENERATORS OFFLINE.', critical: false },
      { time: 195, phase: 3, text: 'MAIN POWER OUT. MANUAL BREAKER RESET REQUIRED IN HALLWAY B.', critical: true, powerOut: true },
      { time: 210, phase: 3, text: 'DARKNESS IN THE HALLS. THE THING MOVES IN THE DARK.', critical: false },
      { time: 240, phase: 3, text: 'CAM-03: ENVIRONMENTAL CORRUPTION — STATIC MOLD SPREADING.', critical: true, anomalyType: 'mold', cameraId: 3 },
      { time: 255, phase: 3, text: 'BREATHING. COMING FROM THE MONITOR. FROM BEHIND YOU.', critical: false },

      // Phase 4: Convergence
      { time: 285, phase: 4, text: 'IT IS EVERYWHERE. CAMERAS. WALLS. YOUR MIND.', critical: false, glitch: true },
      { time: 310, phase: 4, text: 'CAM-01: INTRUDER ON THE LENS. IT SEES YOU SEEING IT.', critical: true, anomalyType: 'intruder', cameraId: 1 },
      { time: 335, phase: 4, text: 'THE WIRES HUMM. PICANOBU IS INSIDE THE BUILDING.', critical: false },
      { time: 350, phase: 4, text: 'CONVERGENCE COMPLETE. THERE IS NO ESCAPE.', critical: false, final: true },
    ];
  }

  update(totalSeconds) {
    const nextEvent = this.narrativeEvents[this.currentEventIndex];
    if (!nextEvent) return;

    if (this.currentEventIndex < this.narrativeEvents.length &&
        totalSeconds >= nextEvent.time) {
      this.currentEventIndex++;

      if (nextEvent.anomalyType && nextEvent.cameraId) {
        this.anomalyManager.spawnAnomaly(nextEvent.anomalyType, nextEvent.cameraId);
      }

      if (nextEvent.powerOut) {
        this._onPowerOut();
      }

      if (nextEvent.glitch) {
        this.ai.triggerGlobalGlitch(1.0, 3000);
      }

      if (nextEvent.final) {
        this._onFinale();
      }

      if (this.onNarrativeEvent) {
        this.onNarrativeEvent(nextEvent);
      }
    }
  }

  _onPowerOut() {
    this.ai.triggerPowerOut();
    this.time.speedMultiplier = 3;
    setTimeout(() => {
      this.time.speedMultiplier = 1;
    }, 12000);
  }

  _onFinale() {
    this.ai.triggerJumpscare();
  }
}
