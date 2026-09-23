import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const MODEL_PATH = process.env.SURGE_MODEL_PATH || path.join(ROOT, 'ml/surge/models/surge_rf.joblib');
const PYTHON_BIN = process.env.PYTHON_BIN || 'python';
const INFER_SCRIPT = path.join(ROOT, 'ml/surge/src/infer.py');
const METRICS_PATH = path.join(ROOT, 'ml/surge/reports/metrics.json');

export function getSurgeModelInfo() {
  const loaded = fs.existsSync(MODEL_PATH);
  const metricsAvailable = fs.existsSync(METRICS_PATH);
  return { loaded, path: MODEL_PATH, metricsAvailable, inferScript: INFER_SCRIPT };
}

export function predictSurge({ traffic, signals, trafficMode }) {
  const info = getSurgeModelInfo();
  if (!info.loaded) {
    return Promise.resolve({
      status: 'model_not_loaded',
      source: 'unavailable',
      simulated: false,
      note: 'Train surge model: ml/surge/src/generate_dataset.py && train.py',
    });
  }

  const payload = JSON.stringify({ traffic, signals, trafficMode });
  return new Promise((resolve) => {
    const proc = spawn(PYTHON_BIN, [INFER_SCRIPT, '--model', MODEL_PATH], { cwd: ROOT });
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
        resolve({ status: 'error', message: err || 'surge inference failed' });
        return;
      }
      try {
        const parsed = JSON.parse(out.trim());
        resolve(parsed);
      } catch (e) {
        resolve({ status: 'error', message: e.message, raw: out });
      }
    });
    proc.stdin.write(payload);
    proc.stdin.end();
  });
}
