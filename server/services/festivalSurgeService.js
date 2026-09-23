import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const MODEL_PATH =
  process.env.FESTIVAL_SURGE_MODEL_PATH ||
  path.join(ROOT, 'ml/festival_surge/models/festival_surge_rf.joblib');
const PYTHON_BIN = process.env.PYTHON_BIN || 'python';
const INFER_SCRIPT = path.join(ROOT, 'ml/festival_surge/src/infer.py');
const METRICS_PATH = path.join(ROOT, 'ml/festival_surge/reports/metrics.json');
const CATALOG_PATH = path.join(ROOT, 'ml/festival_surge/data/festivals.json');

export function getFestivalSurgeMetrics() {
  if (!fs.existsSync(METRICS_PATH)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(METRICS_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

export function getFestivalSurgeModelInfo() {
  const loaded = fs.existsSync(MODEL_PATH);
  const metricsAvailable = fs.existsSync(METRICS_PATH);
  const catalogAvailable = fs.existsSync(CATALOG_PATH);
  return {
    loaded,
    path: MODEL_PATH,
    metricsAvailable,
    catalogAvailable,
    inferScript: INFER_SCRIPT,
    modelName: 'Festival Surge RF',
    dataset: 'SIMULATION',
  };
}

export function getFestivalCatalog() {
  if (!fs.existsSync(CATALOG_PATH)) {
    return { status: 'not_available', festivals: [], message: 'festivals.json missing' };
  }
  const raw = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
  return {
    status: 'ok',
    source: raw.provenance,
    note: raw.note,
    festivals: raw.festivals ?? [],
  };
}

export function predictFestivalSurge({
  festivalId,
  chennaiJunctionId,
  junctionListId,
  festivalDay = 1,
  hour,
}) {
  const info = getFestivalSurgeModelInfo();
  if (!info.loaded) {
    return Promise.resolve({
      status: 'model_not_loaded',
      source: 'unavailable',
      note: 'Train festival model: python ml/festival_surge/src/generate_dataset.py && python ml/festival_surge/src/train.py',
    });
  }

  const payload = JSON.stringify({
    festivalId,
    chennaiJunctionId: chennaiJunctionId || junctionListId || '1',
    festivalDay,
    hour,
  });
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
        resolve({ status: 'error', message: err || 'festival surge inference failed' });
        return;
      }
      try {
        resolve(JSON.parse(out.trim()));
      } catch (e) {
        resolve({ status: 'error', message: e.message, raw: out });
      }
    });
    proc.stdin.write(payload);
    proc.stdin.end();
  });
}
