import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { recordAudioEvent, setAudioModelStatus } from './flowiqState.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const MODEL_PATH = process.env.MODEL_PATH || path.join(ROOT, 'ml/audio/models/siren_cnn.pt');
const PYTHON_BIN = process.env.PYTHON_BIN || 'python';
const INFER_SCRIPT = path.join(ROOT, 'ml/audio/src/infer.py');

let modelChecked = false;

export function getAudioModelInfo() {
  const exists = fs.existsSync(MODEL_PATH);
  if (!modelChecked) {
    setAudioModelStatus({ loaded: exists, version: exists ? path.basename(MODEL_PATH) : null });
    modelChecked = true;
  }
  return {
    loaded: exists,
    path: MODEL_PATH,
    version: exists ? path.basename(MODEL_PATH) : null,
    inferScript: INFER_SCRIPT,
  };
}

export function predictFromFile(filePath) {
  const info = getAudioModelInfo();
  if (!info.loaded) {
    return Promise.resolve({
      status: 'model_not_loaded',
      event: null,
      probability: null,
      source: 'audio_model',
      demo: false,
      timestamp: new Date().toISOString(),
      message: 'Train model locally (ml/audio) and set MODEL_PATH',
    });
  }

  if (!fs.existsSync(INFER_SCRIPT)) {
    return Promise.resolve({
      status: 'error',
      message: 'infer.py missing',
      timestamp: new Date().toISOString(),
    });
  }

  return new Promise((resolve) => {
    const proc = spawn(PYTHON_BIN, [INFER_SCRIPT, '--file', filePath, '--model', MODEL_PATH], {
      cwd: ROOT,
    });
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
        resolve({
          status: 'error',
          message: err || 'inference failed',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      try {
        const parsed = JSON.parse(out.trim());
        const event = parsed.event;
        const probability = parsed.probability;
        recordAudioEvent({
          event,
          probability,
          source: 'audio_model',
          demo: false,
          timestamp: new Date().toISOString(),
        });
        resolve({
          status: 'ok',
          event,
          probability,
          emergency: event === 'SIREN' && probability >= 0.65,
          source: 'audio_model',
          demo: false,
          timestamp: new Date().toISOString(),
          model_version: info.version,
        });
      } catch (e) {
        resolve({
          status: 'error',
          message: e.message,
          raw: out,
          timestamp: new Date().toISOString(),
        });
      }
    });
  });
}
