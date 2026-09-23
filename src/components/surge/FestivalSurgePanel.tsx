import { useCallback, useEffect, useMemo, useState } from 'react';
import { CHENNAI_JUNCTIONS } from '../../data/chennaiJunctions';
import {
  fetchFestivalPrediction,
  fetchFestivalSurgeMetrics,
  fetchFestivalSurgeModelInfo,
  fetchSupportedFestivals,
} from '../../lib/api';
import { surgeSeverityStyles } from '../../lib/surgeSeverity';
import type { BrainState, FestivalPredictionState, FlowIQState } from '../../types/flowiq';
import { ForecastTimeline } from './ForecastTimeline';
import { ModelMetricsDrawer } from './ModelMetricsDrawer';
import { PredictAdaptConnector } from './PredictAdaptConnector';

function isDevTrainingNote(note?: string | null) {
  if (!note) return false;
  return /train\.py|generate_dataset|ml\/festival_surge\/src/i.test(note);
}

function userFacingNote(note?: string | null) {
  if (!note || isDevTrainingNote(note)) return null;
  return note;
}

export function FestivalSurgePanel({
  backendOnline,
  festivalPrediction,
  shortHorizon,
  brain,
  onRefresh,
  layout = 'card',
}: {
  backendOnline: boolean;
  festivalPrediction?: FestivalPredictionState;
  shortHorizon: FlowIQState['prediction'];
  brain?: BrainState;
  onRefresh: () => void;
  layout?: 'card' | 'page';
}) {
  const [junctionId, setJunctionId] = useState('1');
  const [festivalId, setFestivalId] = useState('republic_day');
  const [festivalDay, setFestivalDay] = useState(1);
  const [festivals, setFestivals] = useState<{ id: string; name: string; days: number }[]>([]);
  const [modelReady, setModelReady] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsUnavailable, setMetricsUnavailable] = useState(false);
  const [evaluationStatus, setEvaluationStatus] = useState<'unknown' | 'available' | 'unavailable'>('unknown');

  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!backendOnline) {
      setModelReady(false);
      setEvaluationStatus('unavailable');
      return;
    }
    fetchSupportedFestivals()
      .then((r) => setFestivals(r.festivals))
      .catch(() =>
        setFestivals([
          { id: 'pongal', name: 'Pongal', days: 3 },
          { id: 'diwali', name: 'Diwali', days: 2 },
          { id: 'republic_day', name: 'Republic Day', days: 1 },
        ]),
      );
    fetchFestivalSurgeModelInfo()
      .then((i) => {
        setModelReady(i.loaded);
        setEvaluationStatus(i.metricsAvailable ? 'available' : 'unavailable');
      })
      .catch(() => {
        setModelReady(false);
        setEvaluationStatus('unavailable');
      });
  }, [backendOnline]);

  const festMeta =
    festivals.find((f) => f.id === festivalId) ?? festivals[0] ?? { id: 'republic_day', name: 'Republic Day', days: 1 };
  const junction = CHENNAI_JUNCTIONS.find((j) => j.id === junctionId) ?? CHENNAI_JUNCTIONS[0];

  const loadForecast = useCallback(async () => {
    if (!backendOnline) return;
    setPredictionLoading(true);
    setPredictionError(null);
    try {
      await fetchFestivalPrediction({
        chennaiJunctionId: junctionId,
        festivalId,
        festivalDay,
      });
      onRefresh();
    } catch (e) {
      setPredictionError(e instanceof Error ? e.message : 'Forecast failed');
    } finally {
      setPredictionLoading(false);
    }
  }, [backendOnline, junctionId, festivalId, festivalDay, onRefresh]);

  useEffect(() => {
    if (backendOnline) loadForecast();
  }, [backendOnline, junctionId, festivalId, festivalDay, loadForecast]);

  const fp = festivalPrediction;
  const predictionStatus = useMemo(() => {
    if (!backendOnline) return 'OFFLINE';
    if (predictionLoading) return 'LOADING';
    if (predictionError) return 'ERROR';
    if (fp?.status === 'ok') return 'READY';
    if (fp?.status === 'model_not_available') return 'MODEL NOT AVAILABLE';
    return 'PENDING';
  }, [backendOnline, predictionLoading, predictionError, fp?.status]);

  const evaluationLabel =
    evaluationStatus === 'available' ? 'AVAILABLE' : evaluationStatus === 'unavailable' ? 'UNAVAILABLE' : 'UNKNOWN';

  const sev = surgeSeverityStyles(fp?.predictedLevel);
  const shortSev = surgeSeverityStyles(shortHorizon.surgeLevel);

  const shellClass =
    layout === 'page'
      ? 'flex flex-col h-full min-h-0 gap-2 overflow-hidden'
      : 'bg-[#1E293B] border border-[#334155] rounded-lg p-4 space-y-4';

  const openMetrics = async () => {
    setMetricsOpen(true);
    setMetricsLoading(true);
    setMetricsUnavailable(false);
    try {
      const m = await fetchFestivalSurgeMetrics();
      setMetrics(m);
      setEvaluationStatus('available');
    } catch (e) {
      console.error('Festival surge metrics load failed:', e);
      setMetrics(null);
      setMetricsUnavailable(true);
      setEvaluationStatus('unavailable');
    } finally {
      setMetricsLoading(false);
    }
  };

  const junctionDisplayName = fp?.junctionName ?? junction.name;

  return (
    <div className={shellClass}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#334155] pb-2 shrink-0">
        <div>
          {layout === 'page' ? (
            <h2 className="text-xs font-semibold tracking-wide text-[#94A3B8] uppercase">Festival surge prediction</h2>
          ) : (
            <>
              <h3 className="text-sm font-semibold tracking-wide">PREDICT</h3>
              <p className="text-[10px] text-[#64748b]">Festival surge · BRAIN layer</p>
            </>
          )}
        </div>
        <div className="text-right text-[10px] space-y-0.5">
          <p className="flex items-center justify-end gap-1.5">
            <span className={`w-2 h-2 rounded-full ${modelReady ? 'bg-[#10B981]' : 'bg-[#64748b]'}`} aria-hidden />
            {modelReady ? 'MODEL READY' : 'MODEL NOT LOADED'}
          </p>
          <p className="text-[#64748b]">
            PREDICTION: <span className="text-[#CBD5E1]">{predictionStatus}</span>
          </p>
          <p className="text-[#64748b]">
            EVALUATION: <span className="text-[#CBD5E1]">{evaluationLabel}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 shrink-0">
        <label className="text-[10px] text-[#94A3B8]">
          Festival
          <select
            className="mt-1 w-full bg-[#0F172A] border border-[#334155] rounded px-2 py-1.5 text-xs"
            value={festivalId}
            onChange={(e) => {
              setFestivalId(e.target.value);
              setFestivalDay(1);
            }}
          >
            {festivals.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </label>
        <label className="text-[10px] text-[#94A3B8]">
          Junction
          <select
            className="mt-1 w-full bg-[#0F172A] border border-[#334155] rounded px-2 py-1.5 text-xs"
            value={junctionId}
            onChange={(e) => setJunctionId(e.target.value)}
          >
            {CHENNAI_JUNCTIONS.map((j) => (
              <option key={j.id} value={j.id}>{j.name}</option>
            ))}
          </select>
        </label>
        <label className="text-[10px] text-[#94A3B8]">
          Festival day
          <select
            className="mt-1 w-full bg-[#0F172A] border border-[#334155] rounded px-2 py-1.5 text-xs"
            value={festivalDay}
            onChange={(e) => setFestivalDay(Number(e.target.value))}
          >
            {Array.from({ length: festMeta.days }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>Day {d}</option>
            ))}
          </select>
        </label>
      </div>

      {predictionError && (
        <p className="text-xs text-[#EF4444] shrink-0" role="alert">{predictionError}</p>
      )}

      <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-y-auto">
        <div className="rounded-lg border border-[#334155] bg-[#0F172A]/60 p-3 shrink-0">
          {fp?.status === 'ok' ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(200px,38%)] gap-3 items-start">
              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded border border-[#F59E0B]/40 text-[#F59E0B] font-semibold">
                    SIMULATION DATA
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded border border-[#0EA5E9]/40 text-[#0EA5E9]">
                    MODEL FORECAST
                  </span>
                </div>
                <p className="text-[10px] uppercase tracking-widest text-[#64748b]">Festival surge forecast</p>
                <p className="text-base font-semibold text-[#F8FAFC]">
                  {fp.festival} · Day {fp.festivalDay}
                </p>
                <div className="flex flex-wrap gap-3 items-start">
                  <div className={`inline-flex flex-col rounded-lg border px-3 py-2 min-w-[120px] ${sev.border} ${sev.bg}`}>
                    <span className="text-[10px] text-[#94A3B8]">FORECAST</span>
                    <span className={`text-lg font-bold leading-tight ${sev.text}`}>{fp.predictedLevel}</span>
                    <span className="text-[10px] text-[#CBD5E1]">CONGESTION</span>
                    <span className="text-[9px] text-[#64748b] mt-0.5">Model prediction</span>
                  </div>
                  <div className="text-sm space-y-1 min-w-0">
                    {fp.expectedWindow && (
                      <p className="text-[#CBD5E1]">
                        Expected {fp.expectedWindow.start} — {fp.expectedWindow.end}
                      </p>
                    )}
                    <div className="rounded border border-[#334155] bg-[#0B1220]/50 px-2 py-1.5">
                      <p className="text-[9px] uppercase tracking-wide text-[#64748b]">Forecast location</p>
                      <p className="text-sm text-[#E2E8F0] font-medium">{junctionDisplayName}</p>
                      <p className="text-[10px] text-[#94A3B8]">Chennai</p>
                    </div>
                  </div>
                </div>
              </div>
              <ForecastTimeline forecast={fp} reducedMotion={reducedMotion} compact />
            </div>
          ) : (
            <p className="text-sm text-[#94A3B8]">
              {backendOnline
                ? userFacingNote(fp?.note) ?? 'Select festival, junction, and day to load forecast.'
                : 'Connect backend to run festival surge model.'}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 shrink-0">
          <div className="text-[10px] border border-[#334155] rounded-lg px-3 py-2 bg-[#0F172A]/40 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[#64748b] font-semibold uppercase tracking-wide">Short-horizon signal</p>
              <p className="text-[#94A3B8]">t+50 queue model · separate from festival forecast</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-[#64748b] uppercase">Level</p>
              <p className={`text-sm font-bold ${shortSev.text}`}>{shortHorizon.surgeLevel}</p>
              <p className="text-[9px] text-[#64748b]">Operational simulator signal</p>
            </div>
          </div>
          <PredictAdaptConnector festivalLevel={fp?.predictedLevel} recommendation={brain?.recommendation} />
        </div>

        <p className="text-[9px] text-[#64748b] shrink-0">
          Model trained/evaluated on simulation-derived data. Not measured real-world festival traffic.
        </p>

        <button
          type="button"
          className="text-xs w-full py-2 rounded border border-[#334155] text-[#0EA5E9] hover:bg-[#0EA5E9]/10 shrink-0"
          onClick={() => openMetrics()}
        >
          View full evaluation
        </button>
      </div>

      <ModelMetricsDrawer
        open={metricsOpen}
        onClose={() => setMetricsOpen(false)}
        metrics={metrics}
        unavailable={metricsUnavailable}
        loading={metricsLoading}
      />
    </div>
  );
}
