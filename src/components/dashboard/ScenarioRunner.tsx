import { useEffect, useState } from 'react';
import { fetchState } from '../../lib/api';

const baseUrl = () => import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

export function ScenarioRunner({
  backendOnline,
  scenario,
  onState,
  adaptController,
  cvMode,
  rlLoaded,
}: {
  backendOnline: boolean;
  scenario?: { active?: boolean; label?: string | null; step?: string | null; id?: string | null };
  onState: () => void;
  adaptController?: string;
  cvMode?: string;
  rlLoaded?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    if (!backendOnline) return;
    fetch(`${baseUrl()}/api/simulation/scenarios`)
      .then((r) => r.json())
      .then((j) => setScenarios(j.scenarios ?? []))
      .catch(() => {});
  }, [backendOnline]);

  const post = async (path: string, body?: object) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${baseUrl()}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error(`Scenario API ${res.status}`);
      await fetchState();
      onState();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scenario failed');
    } finally {
      setLoading(false);
    }
  };

  if (!backendOnline) {
    return (
      <p className="text-[10px] text-[#64748b]">Connect backend to run FlowIQ scenarios.</p>
    );
  }

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3 space-y-2">
      <h3 className="text-xs font-semibold text-[#94A3B8]">RUN FLOWIQ SCENARIO</h3>
      <p className="text-[9px] text-[#64748b]">
        SIMULATION — PREDICT → traffic state → ADAPT (RL or heuristic) → FSM → twin → emergency
      </p>
      {backendOnline && (
        <p className="text-[9px] text-[#94A3B8] font-mono">
          ADAPT: {adaptController === 'RL_MODEL' ? 'RL MODEL' : 'HEURISTIC FALLBACK'}
          {rlLoaded === false ? ' (no RL checkpoint)' : ''} · EYES:{' '}
          {cvMode === 'cv_model' ? 'CV MODEL' : 'SIMULATION INPUT'}
        </p>
      )}
      {scenario?.active && (
        <p className="text-[10px] text-[#F59E0B]">
          Active: {scenario.label} · step {scenario.step ?? '—'}
        </p>
      )}
      <div className="flex flex-wrap gap-1">
        {scenarios.length === 0 && (
          <>
            <button
              type="button"
              disabled={loading}
              className="text-[10px] px-2 py-1 rounded border border-[#334155]"
              onClick={() => post('/api/simulation/scenario/start', { scenarioId: 'flowiq_end_to_end' })}
            >
              Start end-to-end
            </button>
            <button
              type="button"
              disabled={loading}
              className="text-[10px] px-2 py-1 rounded border border-[#334155]"
              onClick={() => post('/api/simulation/scenario/start', { scenarioId: 'festival_surge_day' })}
            >
              Festival surge
            </button>
          </>
        )}
        {scenarios.map((s) => (
          <button
            key={s.id}
            type="button"
            disabled={loading}
            className="text-[10px] px-2 py-1 rounded border border-[#334155] hover:border-[#0EA5E9]"
            onClick={() => post('/api/simulation/scenario/start', { scenarioId: s.id })}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={loading || !scenario?.active}
          className="text-[10px] flex-1 py-1 rounded bg-[#0EA5E9]/20 border border-[#0EA5E9]/40 text-[#0EA5E9] disabled:opacity-40"
          onClick={() => post('/api/simulation/scenario/advance', { scenarioId: scenario?.id })}
        >
          Advance step
        </button>
        <button
          type="button"
          disabled={loading}
          className="text-[10px] px-2 py-1 rounded border border-[#334155]"
          onClick={() => post('/api/simulation/scenario/reset')}
        >
          Reset
        </button>
      </div>
      {error && <p className="text-[10px] text-[#EF4444]">{error}</p>}
    </div>
  );
}
