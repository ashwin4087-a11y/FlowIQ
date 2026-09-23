import {
  getState,
  patchState,
  setTrafficMode,
  activateDemoEmergency,
  clearEmergency,
  applyFestivalPredictionToState,
  persistBrain,
} from './flowiqState.js';
import { predictFestivalSurge } from './festivalSurgeService.js';
import { predictSurge } from './surgeService.js';
import { applySurgeModelPrediction } from './flowiqState.js';

export const SCENARIOS = {
  festival_surge_day: {
    id: 'festival_surge_day',
    label: 'Festival surge day (simulation)',
    simulated: true,
    steps: ['traffic_surge', 'festival_forecast', 'short_horizon', 'adapt_recommendation'],
  },
  emergency_drill: {
    id: 'emergency_drill',
    label: 'Emergency green wave drill (simulation)',
    simulated: true,
    steps: ['baseline', 'emergency_active', 'clearing', 'restored'],
  },
  flowiq_end_to_end: {
    id: 'flowiq_end_to_end',
    label: 'FlowIQ end-to-end (simulation)',
    simulated: true,
    steps: [
      'baseline',
      'festival_forecast',
      'traffic_surge',
      'adapt_signal',
      'emergency_active',
      'green_wave',
      'restored',
    ],
  },
};

export async function startScenario(scenarioId) {
  const def = SCENARIOS[scenarioId];
  if (!def) return { ok: false, message: 'Unknown scenario' };
  resetScenario();
  patchState({
    scenario: {
      active: true,
      id: def.id,
      label: def.label,
      step: def.steps[0],
      stepIndex: 0,
      simulated: true,
    },
  });
  return advanceScenario(scenarioId);
}

export async function advanceScenario(scenarioId) {
  const def = SCENARIOS[scenarioId];
  if (!def) return { ok: false, message: 'Unknown scenario' };
  const s = getState();
  const idx = s.scenario?.stepIndex ?? 0;
  const step = def.steps[Math.min(idx, def.steps.length - 1)];

  if (step === 'baseline') {
    setTrafficMode('NORMAL');
    clearEmergency();
  }
  if (step === 'traffic_surge') {
    setTrafficMode('SURGE');
  }
  if (step === 'festival_forecast') {
    const fest = await predictFestivalSurge({
      chennaiJunctionId: '1',
      festivalId: 'pongal',
      festivalDay: 1,
      hour: 18,
    });
    applyFestivalPredictionToState(fest);
  }
  if (step === 'short_horizon') {
    const surge = await predictSurge({
      traffic: getState().traffic,
      signals: getState().signals,
      trafficMode: getState().trafficMode,
    });
    applySurgeModelPrediction(surge);
  }
  if (step === 'adapt_signal' || step === 'adapt_recommendation') {
    persistBrain();
  }
  if (step === 'emergency_active' || step === 'green_wave') {
    activateDemoEmergency({ type: 'AMBULANCE', direction: 'EAST' });
  }
  if (step === 'clearing' || step === 'restored') {
    clearEmergency();
  }

  const nextIdx = idx + 1;
  const done = nextIdx >= def.steps.length;
  patchState({
    scenario: {
      active: !done,
      id: done ? null : def.id,
      label: done ? null : def.label,
      step: done ? null : def.steps[nextIdx] ?? null,
      stepIndex: done ? 0 : nextIdx,
      simulated: true,
    },
    scenarioNote: done ? null : `SIMULATION scenario: ${def.label} — step ${step}`,
  });
  persistBrain();
  return { ok: true, scenario: getState().scenario, completedStep: step, done };
}

export function resetScenario() {
  clearEmergency();
  setTrafficMode('NORMAL');
  patchState({
    scenario: { active: false, id: null, label: null, step: null, stepIndex: 0, simulated: true },
    scenarioNote: null,
  });
  persistBrain();
  return { ok: true };
}
