/**
 * Signal controller state machine (software prototype).
 * Modes: NORMAL | ADAPTIVE | EMERGENCY | CLEARING | RESTORING
 */

const PHASE_ORDER = [
  'NORTH_SOUTH_GREEN',
  'NORTH_SOUTH_YELLOW',
  'ALL_RED',
  'EAST_WEST_GREEN',
  'EAST_WEST_YELLOW',
  'ALL_RED',
];

const MIN_GREEN_SEC = 8;
const MAX_GREEN_SEC = 90;

export class SignalStateMachine {
  constructor() {
    this.controllerMode = 'NORMAL';
    this.emergencyHoldSec = 0;
  }

  setMode(mode) {
    const allowed = ['NORMAL', 'ADAPTIVE', 'EMERGENCY', 'CLEARING', 'RESTORING'];
    if (!allowed.includes(mode)) return false;
    this.controllerMode = mode;
    return true;
  }

  /**
   * @param {object} signals
   * @param {{ active?: boolean, greenWaveActive?: boolean }} emergency
   */
  tickSecond(signals, emergency) {
    if (emergency?.active && emergency?.greenWaveActive) {
      this.controllerMode = 'EMERGENCY';
      return { changed: false, mode: this.controllerMode };
    }

    if (this.controllerMode === 'EMERGENCY' && !emergency?.active) {
      this.controllerMode = 'CLEARING';
      this.emergencyHoldSec = 3;
    }

    if (this.controllerMode === 'CLEARING') {
      this.emergencyHoldSec -= 1;
      if (signals.activePhase !== 'ALL_RED') {
        signals.activePhase = 'ALL_RED';
        signals.remainingSeconds = Math.max(signals.remainingSeconds, 2);
      }
      if (this.emergencyHoldSec <= 0) {
        this.controllerMode = 'RESTORING';
      }
      return { changed: true, mode: this.controllerMode };
    }

    if (this.controllerMode === 'RESTORING') {
      this.controllerMode = 'NORMAL';
      return { changed: true, mode: this.controllerMode };
    }

    if (this.controllerMode === 'NORMAL' || this.controllerMode === 'ADAPTIVE') {
      if (signals.remainingSeconds > 0) {
        signals.remainingSeconds -= 1;
      } else {
        const idx = PHASE_ORDER.indexOf(signals.activePhase);
        const next = PHASE_ORDER[(idx + 1) % PHASE_ORDER.length];
        signals.activePhase = next;
        const base = signals.phases[next]?.durationSec ?? 30;
        signals.remainingSeconds = this.clampGreen(next, base);
      }
      return { changed: true, mode: this.controllerMode };
    }

    return { changed: false, mode: this.controllerMode };
  }

  clampGreen(phase, durationSec) {
    const isGreen = phase === 'NORTH_SOUTH_GREEN' || phase === 'EAST_WEST_GREEN';
    if (!isGreen) return durationSec;
    return Math.min(MAX_GREEN_SEC, Math.max(MIN_GREEN_SEC, durationSec));
  }

  /**
   * Reject invalid RL actions; return safe fallback phase adjustment label only.
   */
  validateRlAction(action) {
    const allowed = ['EXTEND_NS_GREEN', 'EXTEND_EW_GREEN', 'HOLD', 'NEXT_PHASE'];
    if (!allowed.includes(action)) {
      return { ok: false, reason: 'invalid_rl_action', fallback: 'HOLD' };
    }
    return { ok: true, action };
  }
}

export const signalStateMachine = new SignalStateMachine();
