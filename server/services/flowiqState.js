/**
 * In-memory FlowIQ prototype state (single junction).
 * Demo/simulated fields are labeled via `source` / `simulated`.
 */

import { signalStateMachine } from './signalStateMachine.js';
import { executeBrainSignalStep, runBrainCycle } from './brainService.js';
import { getCvPipelineInfo } from './cvTrafficService.js';
import { getRlModelInfo } from './rlService.js';
import { getFestivalSurgeModelInfo } from './festivalSurgeService.js';
import { getAudioModelInfo } from './audioService.js';
import { getChennaiJunctionById } from './chennaiJunctions.js';
import { baseEmergencyFields, createEmergencyEventId } from './emergencyEvents.js';

const JUNCTION_ID = 'chennai-prototype-1';
const JUNCTION_NAME = 'Anna Nagar Junction';

const initialSignalPhases = () => ({
  NORTH_SOUTH_GREEN: { durationSec: 45 },
  NORTH_SOUTH_YELLOW: { durationSec: 4 },
  ALL_RED: { durationSec: 2 },
  EAST_WEST_GREEN: { durationSec: 40 },
  EAST_WEST_YELLOW: { durationSec: 4 },
});

let state = {
  junctionId: JUNCTION_ID,
  junctionName: JUNCTION_NAME,
  updatedAt: new Date().toISOString(),
  controlMode: 'HEURISTIC', // HEURISTIC | RL (future)
  trafficMode: 'NORMAL', // NORMAL | SURGE
  traffic: {
    timestamp: new Date().toISOString(),
    junctionId: JUNCTION_ID,
    lanes: [
      { id: 'north', direction: 'NORTH', vehicleCount: 12, queueLength: 4, averageSpeedKmh: 22, congestionLevel: 'moderate' },
      { id: 'south', direction: 'SOUTH', vehicleCount: 10, queueLength: 3, averageSpeedKmh: 24, congestionLevel: 'low' },
      { id: 'east', direction: 'EAST', vehicleCount: 18, queueLength: 8, averageSpeedKmh: 14, congestionLevel: 'high' },
      { id: 'west', direction: 'WEST', vehicleCount: 9, queueLength: 2, averageSpeedKmh: 26, congestionLevel: 'low' },
    ],
    vehicleCount: 49,
    queueLength: 17,
    averageSpeedKmh: 21,
    congestionLevel: 'moderate',
    source: 'simulation',
    simulated: true,
  },
  signals: {
    junctionId: JUNCTION_ID,
    phases: initialSignalPhases(),
    activePhase: 'EAST_WEST_GREEN',
    remainingSeconds: 28,
    mode: 'HEURISTIC',
    source: 'simulation',
    simulated: true,
    lastDecision: {
      label: 'Extended EAST/WEST green (queue imbalance)',
      source: 'heuristic_controller',
      simulated: true,
    },
  },
  prediction: {
    horizon: 'short',
    congestionProbability: null,
    surgeLevel: 'LOW',
    confidence: null,
    source: 'unavailable',
    timestamp: new Date().toISOString(),
    simulated: false,
    note: 'Short-horizon (t+50) surge model — not festival forecast',
    probabilities: null,
  },
  festivalPrediction: {
    status: 'not_available',
    source: 'unavailable',
    simulated: true,
    dataProvenance: 'SIMULATION_DATA',
    chennaiJunctionId: '1',
    junctionName: 'Anna Nagar Junction',
    festivalId: null,
    festival: null,
    festivalDay: null,
    predictedLevel: null,
    confidence: null,
    expectedWindow: null,
    forecastPeriod: null,
    featureImportance: null,
    timestamp: new Date().toISOString(),
    note: 'Train festival model: ml/festival_surge/src/generate_dataset.py && train.py',
  },
  brain: {
    timestamp: null,
    signalControllerMode: 'NORMAL',
    recommendation: null,
    explanation: null,
    sources: {},
  },
  scenario: {
    active: false,
    id: null,
    label: null,
    step: null,
    simulated: true,
  },
  commuterAlerts: [],
  emergency: {
    ...baseEmergencyFields(),
    active: false,
    type: null,
    source: null,
    confidence: 0,
    location: JUNCTION_NAME,
    direction: null,
    timestamp: null,
    simulated: false,
    greenWaveActive: false,
  },
  audio: {
    modelLoaded: false,
    modelVersion: null,
    lastEvent: null,
    temporal: {
      status: 'NORMAL',
      consecutiveHigh: 0,
      recentProbabilities: [],
    },
  },
  system: {
    frontend: 'unknown',
    backend: 'online',
    audioModel: 'not_loaded',
    vision: 'demo',
    rlController: 'not_connected',
    sumo: 'not_connected',
    mqtt: 'not_connected',
    mongodb: 'optional_offline',
    surgeModel: 'not_loaded',
  },
  scenarioNote: null,
  vehicles: [],
};

export function getState() {
  return JSON.parse(JSON.stringify(state));
}

export function patchState(partial) {
  state = {
    ...state,
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  return getState();
}

export function setTrafficMode(mode) {
  state.trafficMode = mode;
  state.scenarioNote =
    mode === 'SURGE'
      ? 'SIMULATION: festival surge traffic influx (does not replace model forecast)'
      : null;
  state.updatedAt = new Date().toISOString();
}

function rebuildCommuterAlerts() {
  const alerts = [];
  const fest = state.festivalPrediction;
  if (fest?.status === 'ok' && fest.predictedLevel === 'HIGH' && fest.junctionName && fest.expectedWindow) {
    alerts.push({
      id: 'fest-surge',
      severity: 'HIGH',
      source: fest.source,
      simulated: Boolean(fest.simulated),
      timestamp: fest.timestamp,
      junctionName: fest.junctionName,
      message: `High congestion is forecast around ${fest.junctionName} during ${fest.expectedWindow.start}–${fest.expectedWindow.end} (${fest.festival || 'festival'}).`,
      suggestedAction: 'Consider alternate routes or travel outside the forecast window.',
    });
  }
  state.commuterAlerts = alerts;
}

export function applyFestivalPredictionToState(result) {
  const ts = new Date().toISOString();
  if (result.status === 'model_not_loaded') {
    state.festivalPrediction = {
      ...state.festivalPrediction,
      status: 'model_not_available',
      source: 'unavailable',
      note: result.note || result.message,
      timestamp: ts,
    };
    rebuildCommuterAlerts();
    state.updatedAt = ts;
    return;
  }
  if (result.status === 'error') {
    state.festivalPrediction = {
      ...state.festivalPrediction,
      status: 'error',
      note: result.message,
      timestamp: ts,
    };
    rebuildCommuterAlerts();
    state.updatedAt = ts;
    return;
  }
  if (result.status !== 'ok') return;

  const junctionFromRegistry = result.chennaiJunctionId
    ? getChennaiJunctionById(String(result.chennaiJunctionId))?.name
    : null;
  const junctionName =
    result.junctionName || junctionFromRegistry || state.festivalPrediction.junctionName;

  state.festivalPrediction = {
    status: 'ok',
    source: result.source,
    simulated: Boolean(result.simulated),
    dataProvenance: result.dataProvenance || 'SIMULATION_DATA',
    chennaiJunctionId: result.chennaiJunctionId,
    junctionName,
    festivalId: result.festivalId,
    festival: result.festival,
    festivalDay: result.festivalDay,
    predictedLevel: result.predictedLevel,
    confidence: result.confidence ?? null,
    expectedWindow: result.expectedWindow,
    forecastPeriod: result.forecastPeriod,
    featureImportance: result.featureImportance,
    timestamp: ts,
    note: 'Festival long-horizon forecast (simulation-trained prototype)',
  };
  rebuildCommuterAlerts();
  state.updatedAt = ts;
}

export function applySurgeModelPrediction(result) {
  if (result.status === 'model_not_loaded' || result.status === 'unavailable') {
    state.prediction = {
      congestionProbability: null,
      surgeLevel: 'LOW',
      confidence: null,
      source: 'unavailable',
      timestamp: new Date().toISOString(),
      simulated: false,
      note: result.note || result.message || 'Surge model not loaded',
      probabilities: null,
    };
    state.system.surgeModel = 'not_loaded';
    return;
  }
  if (result.status !== 'ok') {
    state.prediction = {
      ...state.prediction,
      source: 'error',
      note: result.message || 'Surge inference error',
      timestamp: new Date().toISOString(),
    };
    return;
  }
  state.prediction = {
    horizon: 'short',
    congestionProbability: result.congestionProbability ?? null,
    surgeLevel: result.surgeLevel,
    confidence: result.confidence ?? null,
    probabilities: result.probabilities ?? null,
    source: 'surge_model',
    timestamp: new Date().toISOString(),
    simulated: false,
    note: 'Short-horizon (t+50) forecast from simulator-trained RF — not festival surge',
  };
  state.system.surgeModel = 'ready';
}

export function updateTrafficFromSimulation(metrics) {
  state.traffic = {
    ...state.traffic,
    ...metrics,
    timestamp: new Date().toISOString(),
    source: 'simulation',
    simulated: true,
  };
  state.vehicles = metrics.vehicles ?? state.vehicles;
  state.updatedAt = new Date().toISOString();
}

export function updateSignals(signalPatch) {
  state.signals = { ...state.signals, ...signalPatch, simulated: true, source: 'simulation' };
  state.updatedAt = new Date().toISOString();
}

export function activateDemoEmergency({ type = 'AMBULANCE', direction = 'EAST' } = {}) {
  const eventId = createEmergencyEventId();
  state.emergency = {
    ...baseEmergencyFields(),
    eventId,
    status: 'active',
    active: true,
    type,
    source: 'demo_button',
    confidence: 1,
    location: JUNCTION_NAME,
    direction,
    timestamp: new Date().toISOString(),
    simulated: true,
    greenWaveActive: true,
    label: 'EMERGENCY MODE — SIMULATION (demo button)',
    greenWavePlan: {
      corridor: direction,
      junctionId: JUNCTION_ID,
      simulated: true,
    },
    affectedJunctions: [JUNCTION_ID],
    affectedSignals: direction === 'EAST' || direction === 'WEST' ? ['signal-ew-ne', 'signal-ew-sw'] : ['signal-ns-nw', 'signal-ns-se'],
  };
  state.signals.activePhase = 'EAST_WEST_GREEN';
  state.signals.remainingSeconds = 45;
  state.signals.lastDecision = {
    label: 'Green wave simulation: EAST corridor (demo)',
    source: 'emergency_decision_layer',
    simulated: true,
  };
  state.updatedAt = new Date().toISOString();
  return getState();
}

export function clearEmergency() {
  const prev = state.emergency;
  state.emergency = {
    ...baseEmergencyFields(),
    active: false,
    type: null,
    source: null,
    confidence: 0,
    location: JUNCTION_NAME,
    direction: null,
    timestamp: null,
    simulated: false,
    greenWaveActive: false,
    status: prev?.eventId ? 'restored' : 'idle',
    restoredAt: prev?.eventId ? new Date().toISOString() : null,
  };
  state.updatedAt = new Date().toISOString();
}

export function setAudioModelStatus({ loaded, version }) {
  state.audio.modelLoaded = loaded;
  state.audio.modelVersion = version ?? null;
  state.system.audioModel = loaded ? 'ready' : 'not_loaded';
}

const SIREN_THRESHOLD = Number(process.env.SIREN_THRESHOLD ?? 0.65);
const CONSECUTIVE_DETECTIONS = Number(process.env.CONSECUTIVE_DETECTIONS ?? 2);

export function recordAudioEvent(event) {
  state.audio.lastEvent = event;
  const temporal = state.audio.temporal;
  const prob = event.probability ?? 0;
  const probs = [...temporal.recentProbabilities, prob].slice(-20);
  let status = 'NORMAL';
  let consecutiveHigh = prob >= SIREN_THRESHOLD ? temporal.consecutiveHigh + 1 : 0;
  if (prob >= SIREN_THRESHOLD && consecutiveHigh < CONSECUTIVE_DETECTIONS) status = 'VERIFYING';
  if (consecutiveHigh >= CONSECUTIVE_DETECTIONS && event.event === 'SIREN') {
    status = 'EMERGENCY_CANDIDATE';
    setAudioEmergencyCandidate(event);
  } else if (prob < SIREN_THRESHOLD) {
    clearAudioEmergencyCandidate();
  }
  state.audio.temporal = { status, consecutiveHigh, recentProbabilities: probs };
  state.updatedAt = new Date().toISOString();
}

/** Model output only — does not actuate signals or green wave. */
export function setAudioEmergencyCandidate(event) {
  state.emergency = {
    ...state.emergency,
    active: false,
    greenWaveActive: false,
    audioCandidate: true,
    type: 'SIREN',
    source: 'audio_model',
    confidence: event.probability ?? 0,
    timestamp: new Date().toISOString(),
    simulated: false,
    label: 'AUDIO CANDIDATE — OPERATOR CONFIRMATION REQUIRED',
  };
}

export function clearAudioEmergencyCandidate() {
  if (!state.emergency.audioCandidate) return;
  state.emergency.audioCandidate = false;
  if (state.emergency.source === 'audio_model' && !state.emergency.active) {
    state.emergency.source = null;
    state.emergency.confidence = 0;
    state.emergency.label = undefined;
  }
}

/** Operator confirms audio candidate → simulation green wave only. */
export function confirmAudioEmergency() {
  if (!state.emergency.audioCandidate) {
    return { ok: false, message: 'No audio emergency candidate' };
  }
  state.emergency = {
    ...state.emergency,
    active: true,
    greenWaveActive: true,
    type: 'AMBULANCE',
    direction: 'EAST',
    source: 'audio_confirmed',
    simulated: true,
    label: 'AI-assisted detection + operator-confirmed simulated response',
    timestamp: new Date().toISOString(),
    audioCandidate: false,
  };
  state.signals.activePhase = 'EAST_WEST_GREEN';
  state.signals.remainingSeconds = 45;
  state.signals.lastDecision = {
    label: 'Green wave simulation: EAST corridor (audio confirmed)',
    source: 'emergency_decision_layer',
    simulated: true,
  };
  state.updatedAt = new Date().toISOString();
  return { ok: true, emergency: state.emergency };
}

export function tickSignalCountdown() {
  signalStateMachine.tickSecond(state.signals, state.emergency);
  state.updatedAt = new Date().toISOString();
}

export function refreshSystemFields() {
  const cv = getCvPipelineInfo();
  const rl = getRlModelInfo();
  state.system.vision = cv.modelLoaded ? 'ready' : 'simulation_adapter';
  state.system.rlController = rl.loaded ? 'ready' : 'not_loaded';
  state.system.cvMode = cv.mode;
  state.system.cvDisplay = cv.display;
  state.system.rlPolicyTrained = rl.policyTrained;
  const fest = getFestivalSurgeModelInfo();
  state.system.surgeModel = fest.loaded ? 'ready' : 'not_loaded';
  const audio = getAudioModelInfo();
  state.system.audioModel = audio.loaded ? 'ready' : 'not_loaded';
}

/** @param {{ skipRl?: boolean }} [options] */
export function persistBrain(options = {}) {
  if (options.skipRl) {
    const prev = state.brain ?? {};
    state.brain = runBrainCycle(state, {
      activeController: prev.activeController ?? 'HEURISTIC_FALLBACK',
      rlLabel: prev.signalDecision?.lastDecision?.label ?? state.signals.lastDecision?.label,
      rlAction: prev.rlAction ?? null,
    });
  } else {
    state.brain = executeBrainSignalStep(state);
    if (state.brain?.signalDecision?.lastDecision) {
      state.signals.lastDecision = state.brain.signalDecision.lastDecision;
    }
    state.signals.mode = state.brain.activeController === 'RL_MODEL' ? 'RL' : 'HEURISTIC';
    state.controlMode = state.signals.mode;
  }
  refreshSystemFields();
  state.updatedAt = new Date().toISOString();
}

export { JUNCTION_ID, JUNCTION_NAME };
