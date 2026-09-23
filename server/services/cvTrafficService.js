/**
 * Computer vision traffic pipeline.
 * - Model path: CV_MODEL_PATH + ml/cv/infer.py (YOLO via ultralytics when installed)
 * - Fallback: simulation adapter (mirrors canonical state, does not fabricate detections)
 */

import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { updateTrafficFromSimulation } from './flowiqState.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const MODEL_PATH = process.env.CV_MODEL_PATH || '';
const PYTHON_BIN = process.env.PYTHON_BIN || 'python';
const INFER_SCRIPT = path.join(ROOT, 'ml/cv/infer.py');
let ultralyticsInstalledCache = null;

function isUltralyticsInstalled() {
  if (ultralyticsInstalledCache !== null) return ultralyticsInstalledCache;
  if (process.env.CV_ULTRALYTICS_INSTALLED === '1') {
    ultralyticsInstalledCache = true;
    return true;
  }
  if (process.env.CV_SKIP_ULTRALYTICS_PROBE === '1') {
    ultralyticsInstalledCache = false;
    return false;
  }
  const ul = spawnSync(PYTHON_BIN, ['-c', 'import ultralytics'], {
    encoding: 'utf-8',
    timeout: 3000,
  });
  ultralyticsInstalledCache = ul.status === 0;
  return ultralyticsInstalledCache;
}

export function getCvPipelineInfo() {
  const hasWeights = Boolean(MODEL_PATH && fs.existsSync(MODEL_PATH));
  const ultralytics = hasWeights ? isUltralyticsInstalled() : isUltralyticsInstalled();
  const inferenceReady = hasWeights && ultralytics;
  const yoloAdapterLabel = ultralytics ? 'READY' : 'NOT INSTALLED';
  return {
    mode: inferenceReady ? 'cv_model' : 'simulation_adapter',
    modelLoaded: inferenceReady,
    modelPath: hasWeights ? MODEL_PATH : null,
    ultralyticsInstalled: ultralytics,
    display: {
      cvInput: inferenceReady ? 'CV MODEL' : 'SIMULATION INPUT',
      yoloAdapter: yoloAdapterLabel,
      modelWeights: hasWeights ? 'CONFIGURED' : 'NOT CONFIGURED',
    },
    note: inferenceReady
      ? 'YOLO inference enabled for image upload'
      : 'CV — SIMULATION INPUT · YOLO adapter ready when ultralytics installed · weights need CV_MODEL_PATH',
  };
}

export function trafficStateToCvObservation(state) {
  const traffic = state.traffic ?? {};
  const lanes = traffic.lanes ?? [];
  const info = getCvPipelineInfo();
  return {
    timestamp: traffic.timestamp || new Date().toISOString(),
    source: traffic.source === 'cv_model' ? 'cv_model' : info.mode,
    simulated: traffic.source !== 'cv_model',
    junctionId: traffic.junctionId,
    vehicleCount: traffic.vehicleCount ?? 0,
    queueLength: traffic.queueLength ?? 0,
    laneCounts: lanes.map((l) => ({
      id: l.id,
      direction: l.direction,
      vehicleCount: l.vehicleCount ?? 0,
      queueLength: l.queueLength ?? 0,
    })),
    confidence: null,
  };
}

/** Apply CV observation dict into canonical traffic state. */
export function applyCvObservationToTraffic(obs, junctionId) {
  if (!obs || obs.status !== 'ok') return { ok: false, reason: obs?.status ?? 'invalid' };
  const lanes = (obs.lanes || obs.laneCounts || []).map((l) => ({
    id: l.id,
    direction: (l.direction || l.id || 'NORTH').toUpperCase(),
    vehicleCount: l.vehicleCount ?? 0,
    queueLength: l.queueLength ?? 0,
    averageSpeedKmh: 20,
    congestionLevel: 'moderate',
  }));
  updateTrafficFromSimulation({
    junctionId: junctionId || obs.junctionId,
    lanes,
    vehicleCount: obs.vehicleCount ?? 0,
    queueLength: obs.queueLength ?? 0,
    averageSpeedKmh: obs.averageSpeedKmh ?? 20,
    congestionLevel: 'moderate',
    source: 'cv_model',
    simulated: false,
  });
  return { ok: true };
}

export function inferCvFromImage(imagePath) {
  return new Promise((resolve) => {
    const args = [INFER_SCRIPT, '--image', imagePath];
    if (MODEL_PATH) args.push('--model', MODEL_PATH);
    const proc = spawn(PYTHON_BIN, args, { cwd: ROOT });
    let out = '';
    let err = '';
    proc.stdout.on('data', (d) => {
      out += d.toString();
    });
    proc.stderr.on('data', (d) => {
      err += d.toString();
    });
    proc.on('close', (code) => {
      if (code !== 0) {
        resolve({ status: 'error', message: err || 'cv infer failed' });
        return;
      }
      try {
        resolve(JSON.parse(out.trim()));
      } catch (e) {
        resolve({ status: 'error', message: e.message });
      }
    });
  });
}

/** Bridge digital-twin sync into CV-labelled canonical state (honest simulation path). */
export function ingestSimulationAsCvBridge(state) {
  const obs = trafficStateToCvObservation(state);
  updateTrafficFromSimulation({
    ...state.traffic,
    source: 'simulation_adapter',
    simulated: true,
    timestamp: new Date().toISOString(),
  });
  return obs;
}
