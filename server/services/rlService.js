import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const MODEL_PATH = process.env.RL_MODEL_PATH || path.join(ROOT, 'ml/rl/models/junction_ppo.zip');
const PYTHON_BIN = process.env.PYTHON_BIN || 'python';
const INFER_SCRIPT = path.join(ROOT, 'ml/rl/infer.py');
const COMPARE_PATH = path.join(ROOT, 'ml/rl/reports/compare.json');
const RL_CACHE_MS = 900;
let rlInferCache = { at: 0, key: '', result: null };

export function getRlModelInfo() {
  const loaded = fs.existsSync(MODEL_PATH);
  let compare = null;
  if (fs.existsSync(COMPARE_PATH)) {
    try {
      compare = JSON.parse(fs.readFileSync(COMPARE_PATH, 'utf-8'));
    } catch {
      compare = null;
    }
  }
  return {
    loaded,
    path: MODEL_PATH,
    sumoConnected: false,
    policyTrained: Boolean(compare?.rl_policy_trained ?? compare?.ppo_checkpoint),
    compareAvailable: Boolean(compare),
    compare,
    inferScript: INFER_SCRIPT,
  };
}

export function inferRlPolicySync(statePayload) {
  const info = getRlModelInfo();
  if (!info.loaded) {
    return {
      status: 'model_not_loaded',
      source: 'heuristic_fallback',
      note: 'Train: python ml/rl/train_policy.py',
    };
  }
  const key = JSON.stringify({
    phase: statePayload?.signals?.activePhase,
    rem: statePayload?.signals?.remainingSeconds,
    q: statePayload?.traffic?.queueLength,
    mode: statePayload?.trafficMode,
  });
  const now = Date.now();
  if (rlInferCache.result && rlInferCache.key === key && now - rlInferCache.at < RL_CACHE_MS) {
    return rlInferCache.result;
  }
  const r = spawnSync(PYTHON_BIN, [INFER_SCRIPT, '--model', MODEL_PATH], {
    cwd: ROOT,
    input: JSON.stringify(statePayload),
    encoding: 'utf-8',
    timeout: 8000,
  });
  if (r.status !== 0) {
    return { status: 'error', message: r.stderr || 'rl inference failed' };
  }
  try {
    const parsed = JSON.parse(r.stdout.trim());
    rlInferCache = { at: now, key, result: parsed };
    return parsed;
  } catch (e) {
    return { status: 'error', message: e.message };
  }
}

export function inferRlPolicy(statePayload) {
  const info = getRlModelInfo();
  if (!info.loaded) {
    return Promise.resolve({
      status: 'model_not_loaded',
      source: 'heuristic_fallback',
      note: 'Train: python ml/rl/train_policy.py',
    });
  }
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
        resolve({ status: 'error', message: err || 'rl inference failed' });
        return;
      }
      try {
        resolve(JSON.parse(out.trim()));
      } catch (e) {
        resolve({ status: 'error', message: e.message });
      }
    });
    proc.stdin.write(JSON.stringify(statePayload));
    proc.stdin.end();
  });
}
