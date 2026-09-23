import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  getState,
  patchState,
  setTrafficMode,
  activateDemoEmergency,
  clearEmergency,
  updateTrafficFromSimulation,
  updateSignals,
} from '../services/flowiqState.js';
import { heuristicController } from '../services/signalController.js';
import { getAudioModelInfo, predictFromFile } from '../services/audioService.js';
import { confirmAudioEmergency, applySurgeModelPrediction } from '../services/flowiqState.js';
import { getSurgeModelInfo, predictSurge } from '../services/surgeService.js';
import { planRoadRoutes } from '../services/routePlannerService.js';
import { getChennaiJunctions, getChennaiJunctionById } from '../services/chennaiJunctions.js';
import {
  predictFestivalSurge,
  getFestivalSurgeModelInfo,
  getFestivalSurgeMetrics,
} from '../services/festivalSurgeService.js';
import {
  applyFestivalPredictionToState,
  persistBrain,
  refreshSystemFields,
} from '../services/flowiqState.js';
import { startScenario, resetScenario, advanceScenario, SCENARIOS } from '../services/scenarioService.js';
import {
  getCvPipelineInfo,
  trafficStateToCvObservation,
  inferCvFromImage,
  applyCvObservationToTraffic,
} from '../services/cvTrafficService.js';
import { getRlModelInfo } from '../services/rlService.js';
import { buildFlowIQSystemStatus } from '../services/systemStatusService.js';

const router = Router();
const METRICS_PATH = path.resolve(process.cwd(), '..', 'ml', 'audio', 'reports', 'metrics.json');
const SURGE_METRICS_PATH = path.resolve(process.cwd(), '..', 'ml', 'surge', 'reports', 'metrics.json');
const upload = multer({ dest: path.join(os.tmpdir(), 'flowiq-audio') });
const cvUpload = multer({ dest: path.join(os.tmpdir(), 'flowiq-cv') });

router.get('/health', (_req, res) => {
  const audio = getAudioModelInfo();
  res.json({
    status: 'ok',
    service: 'flowiq-api',
    timestamp: new Date().toISOString(),
    audioModelLoaded: audio.loaded,
  });
});

router.get('/state', (_req, res) => {
  res.json(getState());
});

router.get('/traffic', (_req, res) => {
  const s = getState();
  res.json(s.traffic);
});

router.get('/signals', (_req, res) => {
  const s = getState();
  res.json(s.signals);
});

router.post('/routes/plan', async (req, res) => {
  const { from, to } = req.body ?? {};
  const valid =
    from &&
    to &&
    Number.isFinite(from.lng) &&
    Number.isFinite(from.lat) &&
    Number.isFinite(to.lng) &&
    Number.isFinite(to.lat);
  if (!valid) {
    return res.status(400).json({
      status: 'error',
      message: 'Body must include from/to with numeric lng and lat',
    });
  }
  try {
    const plan = await planRoadRoutes({ from, to });
    res.json({ status: 'ok', ...plan });
  } catch (err) {
    res.status(502).json({
      status: 'error',
      message: err.message || 'Routing failed',
      routingProvider: 'osrm',
    });
  }
});

router.get('/prediction', (_req, res) => {
  const s = getState();
  res.json({
    ...s.prediction,
    trafficMode: s.trafficMode,
    scenarioNote: s.scenarioNote ?? null,
    label: 'short_horizon_t50',
  });
});

router.get('/prediction/festivals', (_req, res) => {
  const festPath = path.resolve(process.cwd(), '..', 'ml', 'festival_surge', 'data', 'festivals.json');
  if (!fs.existsSync(festPath)) {
    return res.status(404).json({ status: 'not_available', message: 'festivals.json missing' });
  }
  const raw = JSON.parse(fs.readFileSync(festPath, 'utf-8'));
  res.json({
    provenance: raw.provenance,
    festivals: (raw.festivals ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      days: f.days,
    })),
  });
});

router.get('/prediction/festival', async (req, res) => {
  const chennaiJunctionId = String(req.query.chennaiJunctionId || req.query.junctionId || '1');
  const junction = getChennaiJunctionById(chennaiJunctionId);
  if (!junction) {
    return res.status(400).json({ status: 'error', message: 'Unknown Chennai junction id' });
  }
  const festivalId = String(req.query.festivalId || req.query.festival || 'pongal');
  const festivalDay = Number(req.query.festivalDay || 1);
  const hour = req.query.hour != null ? Number(req.query.hour) : undefined;
  const result = await predictFestivalSurge({
    chennaiJunctionId,
    festivalId,
    festivalDay,
    hour,
  });
  if (result.status === 'ok') {
    result.junctionName = junction.name;
  }
  applyFestivalPredictionToState(result);
  persistBrain({ skipRl: true });
  res.json(getState().festivalPrediction);
});

router.get('/junctions/chennai', (_req, res) => {
  res.json({ junctions: getChennaiJunctions() });
});

router.get('/brain', (_req, res) => {
  const s = getState();
  res.json(s.brain ?? { status: 'unavailable' });
});

router.get('/cv/status', (_req, res) => {
  res.json(getCvPipelineInfo());
});

router.get('/cv/observation', (_req, res) => {
  res.json(trafficStateToCvObservation(getState()));
});

router.post('/cv/analyze', cvUpload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'Missing image (field: image)' });
  }
  const info = getCvPipelineInfo();
  if (!info.modelLoaded) {
    fs.unlink(req.file.path, () => {});
    return res.status(503).json({
      status: 'simulation_fallback',
      message: info.note,
      pipeline: info,
    });
  }
  const obs = await inferCvFromImage(req.file.path);
  fs.unlink(req.file.path, () => {});
  if (obs.status !== 'ok') {
    return res.status(500).json(obs);
  }
  const applied = applyCvObservationToTraffic(obs, getState().junctionId);
  persistBrain();
  res.json({ observation: obs, applied, state: getState() });
});

router.get('/system/status', (_req, res) => {
  refreshSystemFields();
  res.json(buildFlowIQSystemStatus(getState()));
});

router.get('/ml/rl-status', (_req, res) => {
  res.json(getRlModelInfo());
});

router.get('/simulation/scenarios', (_req, res) => {
  res.json({ scenarios: Object.values(SCENARIOS) });
});

router.post('/simulation/scenario/start', async (req, res) => {
  const { scenarioId } = req.body ?? {};
  const result = await startScenario(scenarioId);
  if (!result.ok) return res.status(400).json(result);
  persistBrain();
  res.json(getState());
});

router.post('/simulation/scenario/reset', (_req, res) => {
  resetScenario();
  persistBrain();
  res.json(getState());
});

router.post('/simulation/scenario/advance', async (req, res) => {
  const { scenarioId } = req.body ?? {};
  const active = getState().scenario?.id ?? scenarioId;
  if (!active) {
    return res.status(400).json({ ok: false, message: 'No active scenario — start one first' });
  }
  const result = await advanceScenario(active);
  if (!result.ok) return res.status(400).json(result);
  res.json({ ...result, state: getState() });
});

router.get('/ml/festival-surge-metrics', (_req, res) => {
  const metrics = getFestivalSurgeMetrics();
  if (!metrics) {
    return res.status(404).json({
      status: 'not_available',
      message: 'Evaluation metrics file is not present on the server.',
    });
  }
  res.json(metrics);
});

router.get('/ml/festival-surge-info', (_req, res) => {
  res.json(getFestivalSurgeModelInfo());
});

router.post('/prediction/refresh', async (_req, res) => {
  const s = getState();
  const result = await predictSurge({
    traffic: s.traffic,
    signals: s.signals,
    trafficMode: s.trafficMode,
  });
  applySurgeModelPrediction(result);
  persistBrain();
  res.json(getState().prediction);
});

router.get('/ml/surge-metrics', (_req, res) => {
  if (!fs.existsSync(SURGE_METRICS_PATH)) {
    return res.status(404).json({
      status: 'not_available',
      message: 'Run ml/surge training pipeline to generate reports/metrics.json',
    });
  }
  res.json(JSON.parse(fs.readFileSync(SURGE_METRICS_PATH, 'utf-8')));
});

router.get('/emergency', (_req, res) => {
  const s = getState();
  res.json(s.emergency);
});

router.post('/emergency/demo', (req, res) => {
  const { type, direction } = req.body ?? {};
  const next = activateDemoEmergency({ type, direction });
  res.json({ ok: true, emergency: next.emergency, simulated: true });
});

router.post('/emergency/clear', (_req, res) => {
  clearEmergency();
  res.json({ ok: true });
});

router.post('/traffic/mode', (req, res) => {
  const { mode } = req.body ?? {};
  if (mode === 'NORMAL' || mode === 'SURGE') {
    setTrafficMode(mode);
  }
  res.json(getState());
});

router.post('/simulation/sync', async (req, res) => {
  const { traffic, signals, vehicles } = req.body ?? {};
  if (traffic) updateTrafficFromSimulation({ ...traffic, vehicles });
  if (signals) updateSignals(signals);
  const s = getState();
  const decision = heuristicController.decide(s.traffic);
  updateSignals({ lastDecision: decision.lastDecision, mode: decision.mode });
  const surgeResult = await predictSurge({
    traffic: getState().traffic,
    signals: getState().signals,
    trafficMode: getState().trafficMode,
  });
  applySurgeModelPrediction(surgeResult);
  persistBrain();
  res.json(getState());
});

router.get('/audio/status', (_req, res) => {
  const s = getState();
  const info = getAudioModelInfo();
  res.json({
    model: info,
    temporal: s.audio.temporal,
    lastEvent: s.audio.lastEvent,
  });
});

router.get('/audio/model-info', (_req, res) => {
  res.json(getAudioModelInfo());
});

router.get('/ml/audio-metrics', (_req, res) => {
  if (!fs.existsSync(METRICS_PATH)) {
    return res.status(404).json({
      status: 'not_available',
      message: 'Run ml/audio/src/train.py locally to generate reports/metrics.json',
    });
  }
  res.json(JSON.parse(fs.readFileSync(METRICS_PATH, 'utf-8')));
});

router.post('/emergency/confirm-audio', (_req, res) => {
  const result = confirmAudioEmergency();
  if (!result.ok) return res.status(400).json(result);
  res.json({ ...result, simulated: true });
});

router.post('/audio/predict', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'Missing audio file (field: audio)' });
  }
  const result = await predictFromFile(req.file.path);
  fs.unlink(req.file.path, () => {});
  res.json(result);
});

export default router;
