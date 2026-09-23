import { getState } from './flowiqState.js';
import { getAudioModelInfo } from './audioService.js';
import { getFestivalSurgeModelInfo } from './festivalSurgeService.js';
import { getCvPipelineInfo } from './cvTrafficService.js';
import { getRlModelInfo } from './rlService.js';

export function buildFlowIQSystemStatus(state = getState()) {
  const audio = getAudioModelInfo();
  const festival = getFestivalSurgeModelInfo();
  const cv = getCvPipelineInfo();
  const rl = getRlModelInfo();
  const trafficSource = state.traffic?.source ?? 'unknown';
  const activeAdapt =
    state.brain?.activeController === 'RL_MODEL' ? 'RL_MODEL' : 'HEURISTIC_FALLBACK';
  const eyes = cv.modelLoaded ? 'CV_MODEL' : 'SIMULATION_INPUT';

  return {
    timestamp: new Date().toISOString(),
    predict: {
      label: 'Festival Surge Model',
      status: festival.loaded ? 'ready' : 'not_loaded',
      modelLoaded: festival.loaded,
      lastForecastStatus: state.festivalPrediction?.status ?? 'not_available',
      simulated: Boolean(state.festivalPrediction?.simulated),
    },
    eyes: {
      label: cv.display?.cvInput ?? (eyes === 'CV_MODEL' ? 'CV MODEL' : 'SIMULATION INPUT'),
      yoloAdapter: cv.display?.yoloAdapter ?? 'UNKNOWN',
      modelWeights: cv.display?.modelWeights ?? 'NOT CONFIGURED',
      mode: eyes,
      cvPipeline: cv.mode,
      trafficSource,
    },
    adapt: {
      label: activeAdapt === 'RL_MODEL' ? 'RL MODEL' : 'HEURISTIC FALLBACK',
      activeController: activeAdapt,
      rlModelLoaded: rl.loaded,
      rlPolicyTrained: rl.policyTrained,
      signalFsmMode: state.brain?.signalControllerMode ?? 'NORMAL',
    },
    act: {
      label: 'Signal FSM',
      phase: state.signals?.activePhase,
      connected: true,
    },
    emergency: {
      label: audio.loaded ? 'Audio Model / Confirmation' : 'Confirmation (audio model not loaded)',
      audioModelLoaded: audio.loaded,
      active: Boolean(state.emergency?.active),
      simulated: Boolean(state.emergency?.simulated),
    },
    route: {
      label: 'MapTiler + OSRM',
      operational: true,
      note: 'Requires VITE_MAPTILER_KEY for geocoding in browser',
    },
    digitalTwin: {
      label: 'Connected',
      operational: true,
      signalPhase: state.signals?.activePhase,
    },
    backend: {
      label: 'Connected',
      operational: state.system?.backend === 'online',
    },
    rlEvaluation: rl.compareAvailable ? rl.compare : null,
    cvStatus: cv,
  };
}
