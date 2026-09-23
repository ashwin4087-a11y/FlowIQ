import { useEffect, useState } from 'react';

type SplitMetrics = {
  n_samples?: number;
  class_support?: { NON_SIREN: number; SIREN: number };
  report: Record<string, { precision?: number; recall?: number; 'f1-score'?: number } | number>;
  confusion_matrix: number[][];
  roc_auc: number | null;
};

type MetricsFile = {
  test: SplitMetrics;
  dataset_note?: {
    test_total: number;
    test_esc50: number;
    test_sound: number;
    labels: string[];
    mapping_tentative: string;
  };
};

type RlCompare = {
  experiment?: string;
  label?: string;
  sumo?: string;
  evaluation_status?: string;
  rl_policy_trained?: boolean;
  fixed_time_controller?: { mean_queue_per_step?: number; throughput_per_step?: string };
  ppo_controller?: { mean_queue_per_step?: number; throughput_per_step?: string };
  error?: string;
  note?: string;
};

type CvStatus = {
  mode: string;
  modelLoaded: boolean;
  display?: { cvInput: string; yoloAdapter: string; modelWeights: string };
  note?: string;
};

const base = () => import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

export function MLMetricsPanel({ backendOnline }: { backendOnline: boolean }) {
  const [audio, setAudio] = useState<MetricsFile | null>(null);
  const [audioMissing, setAudioMissing] = useState<string | null>(null);
  const [rl, setRl] = useState<RlCompare | null>(null);
  const [cv, setCv] = useState<CvStatus | null>(null);

  useEffect(() => {
    if (!backendOnline) return;
    fetch(`${base()}/api/ml/audio-metrics`)
      .then(async (r) => {
        if (r.status === 404) {
          const body = await r.json();
          setAudioMissing(body.message ?? 'metrics.json not found');
          setAudio(null);
          return;
        }
        if (!r.ok) throw new Error(String(r.status));
        setAudioMissing(null);
        return r.json();
      })
      .then((json) => {
        if (json && json.test) setAudio(json as MetricsFile);
      })
      .catch(() => setAudioMissing('Could not load metrics'));

    fetch(`${base()}/api/ml/rl-status`)
      .then((r) => r.json())
      .then((j) => setRl(j.compare ?? { rl_policy_trained: j.policyTrained, error: j.loaded ? undefined : 'Model file missing' }))
      .catch(() => setRl(null));

    fetch(`${base()}/api/cv/status`)
      .then((r) => r.json())
      .then((j) => setCv(j as CvStatus))
      .catch(() => setCv(null));
  }, [backendOnline]);

  if (!backendOnline) {
    return (
      <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4 text-xs text-[#94A3B8]">
        Evaluation metrics require backend.
      </div>
    );
  }

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4 space-y-4">
      <h3 className="text-sm font-semibold">Evaluation (measured only)</h3>

      <section className="space-y-1 border-t border-[#334155] pt-2">
        <h4 className="text-xs font-semibold text-[#94A3B8]">RL — simulator baseline</h4>
        {!rl ? (
          <p className="text-[10px] text-[#64748b]">RL status unavailable</p>
        ) : (
          <>
            <p className="text-[10px] text-[#64748b]">
              {rl.experiment ?? 'Fixed-Time vs PPO'} · {rl.label ?? 'SIMULATION_DATA'} · SUMO:{' '}
              {rl.sumo ?? 'NOT USED'}
            </p>
            <p className="text-[10px] text-[#64748b]">
              Evaluation: {rl.evaluation_status ?? (rl.rl_policy_trained ? 'unknown' : 'not executed')}
            </p>
            {rl.fixed_time_controller?.mean_queue_per_step != null && (
              <p className="text-xs font-mono">
                Fixed-time mean queue/step: {rl.fixed_time_controller.mean_queue_per_step.toFixed(3)}
              </p>
            )}
            {rl.ppo_controller?.mean_queue_per_step != null && (
              <p className="text-xs font-mono">
                PPO mean queue/step: {rl.ppo_controller.mean_queue_per_step.toFixed(3)}
              </p>
            )}
            {rl.fixed_time_controller?.throughput_per_step && (
              <p className="text-[10px] text-[#64748b]">
                Throughput: {rl.fixed_time_controller.throughput_per_step}
              </p>
            )}
            {rl.note && <p className="text-[9px] text-[#64748b]">{rl.note}</p>}
            {rl.error && <p className="text-[10px] text-[#F59E0B]">{rl.error}</p>}
          </>
        )}
      </section>

      <section className="space-y-1 border-t border-[#334155] pt-2">
        <h4 className="text-xs font-semibold text-[#94A3B8]">CV pipeline</h4>
        {cv ? (
          <>
            <p className="text-xs">
              {cv.display?.cvInput ?? 'SIMULATION INPUT'} · YOLO adapter{' '}
              {cv.display?.yoloAdapter ?? '—'} · Weights {cv.display?.modelWeights ?? 'NOT CONFIGURED'}
            </p>
            <p className="text-[10px] text-[#64748b]">{cv.note}</p>
          </>
        ) : (
          <p className="text-[10px] text-[#64748b]">CV status unavailable</p>
        )}
      </section>

      <section className="space-y-1 border-t border-[#334155] pt-2">
        <h4 className="text-xs font-semibold text-[#94A3B8]">Audio — test split</h4>
        {!audio ? (
          <p className="text-xs text-[#94A3B8]">
            {audioMissing ?? 'Waiting for ml/audio/reports/metrics.json'}
          </p>
        ) : (
          <>
            <p className="text-[10px] text-[#64748b]">From metrics.json only</p>
            <p className="text-xs text-[#94A3B8]">Test samples: {audio.test.n_samples ?? '—'}</p>
            {(audio.test.report?.SIREN as { 'f1-score'?: number })?.['f1-score'] != null && (
              <p className="text-xs font-mono">
                SIREN F1: {(audio.test.report.SIREN as { 'f1-score': number })['f1-score'].toFixed(3)}
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
