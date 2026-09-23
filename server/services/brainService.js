/**
 * FlowIQ Brain — traffic, surge, emergency, RL/heuristic signal decisions.
 */

import { heuristicController } from './signalController.js';
import { signalStateMachine } from './signalStateMachine.js';
import { inferRlPolicySync } from './rlService.js';
import { applyRlSignalAction } from './rlSignalApply.js';

export function runBrainCycle(state, controllerMeta = {}) {
  const traffic = state.traffic ?? {};
  const emergency = state.emergency ?? {};
  const festival = state.festivalPrediction ?? {};
  const shortHorizon = state.prediction ?? {};

  const activeController = controllerMeta.activeController ?? 'HEURISTIC_FALLBACK';
  const heuristic = heuristicController.decide(traffic);

  let signalDecision = { ...heuristic, controllerMode: signalStateMachine.controllerMode };
  if (activeController === 'RL_MODEL' && controllerMeta.rlLabel) {
    signalDecision = {
      mode: 'RL',
      lastDecision: {
        label: controllerMeta.rlLabel,
        source: 'rl_policy',
        simulated: true,
      },
      controllerMode: signalStateMachine.controllerMode,
    };
  }

  let recommendation = null;
  if (festival.status === 'ok' && festival.predictedLevel === 'HIGH') {
    recommendation = {
      label: 'Signal plan preparation recommended',
      kind: 'RECOMMENDATION',
      source: 'festival_surge_forecast',
      simulated: Boolean(festival.simulated),
    };
  } else if (shortHorizon.source === 'surge_model' && shortHorizon.surgeLevel === 'HIGH') {
    recommendation = {
      label: 'Elevated short-horizon queue risk — review adaptive timing',
      kind: 'RECOMMENDATION',
      source: 'short_horizon_surge_model',
      simulated: false,
    };
  }

  if (emergency.active && emergency.greenWaveActive) {
    signalStateMachine.setMode('EMERGENCY');
  }

  return {
    timestamp: new Date().toISOString(),
    activeController,
    signalControllerMode: signalStateMachine.controllerMode,
    controlMode: activeController === 'RL_MODEL' ? 'RL' : 'HEURISTIC',
    signalDecision,
    recommendation,
    rlAction: controllerMeta.rlAction ?? null,
    sources: {
      traffic: traffic.source ?? 'unknown',
      cv: traffic.source === 'cv_model' ? 'cv_model' : traffic.simulated ? 'simulation_adapter' : 'unknown',
      shortHorizonPrediction: shortHorizon.source ?? 'unavailable',
      festivalPrediction: festival.source ?? 'unavailable',
      emergency: emergency.source ?? null,
      rl: activeController === 'RL_MODEL' ? 'rl_model' : 'heuristic_fallback',
    },
    explanation:
      'Brain aggregates CV/traffic, surge models, emergency, then RL or heuristic signal action into the FSM.',
  };
}

function applyHeuristicSignalAction(signals, traffic) {
  const lanes = traffic?.lanes ?? [];
  const ns = lanes.filter((l) => l.direction === 'NORTH' || l.direction === 'SOUTH');
  const ew = lanes.filter((l) => l.direction === 'EAST' || l.direction === 'WEST');
  const nsQueue = ns.reduce((a, l) => a + (l.queueLength ?? 0), 0);
  const ewQueue = ew.reduce((a, l) => a + (l.queueLength ?? 0), 0);
  const phase = signals.activePhase;
  if (ewQueue > nsQueue + 5) {
    if (phase === 'EAST_WEST_GREEN') return applyRlSignalAction(signals, 'EXTEND_EW_GREEN');
    if (phase === 'NORTH_SOUTH_GREEN') return applyRlSignalAction(signals, 'NEXT_PHASE');
  } else if (nsQueue > ewQueue + 5) {
    if (phase === 'NORTH_SOUTH_GREEN') return applyRlSignalAction(signals, 'EXTEND_NS_GREEN');
    if (phase === 'EAST_WEST_GREEN') return applyRlSignalAction(signals, 'NEXT_PHASE');
  }
  return { applied: true, label: heuristicController.decide(traffic).lastDecision.label };
}

export function executeBrainSignalStep(state) {
  if (state.emergency?.active && state.emergency?.greenWaveActive) {
    return runBrainCycle(state, { activeController: 'HEURISTIC_FALLBACK' });
  }

  const rl = inferRlPolicySync({
    traffic: state.traffic,
    signals: state.signals,
    trafficMode: state.trafficMode,
  });

  let activeController = 'HEURISTIC_FALLBACK';
  let rlLabel = null;
  let rlAction = null;

  if (rl.status === 'ok' && rl.action) {
    const validated = signalStateMachine.validateRlAction(rl.action);
    if (validated.ok) {
      const applied = applyRlSignalAction(state.signals, validated.action);
      if (applied.applied) {
        activeController = 'RL_MODEL';
        rlLabel = applied.label;
        rlAction = validated.action;
        signalStateMachine.setMode('ADAPTIVE');
      }
    }
  }

  if (activeController !== 'RL_MODEL') {
    const h = applyHeuristicSignalAction(state.signals, state.traffic);
    if (h.applied && h.label) {
      signalStateMachine.setMode('ADAPTIVE');
      return runBrainCycle(state, {
        activeController: 'HEURISTIC_FALLBACK',
        rlLabel: h.label,
      });
    }
  }

  return runBrainCycle(state, { activeController, rlLabel, rlAction });
}
