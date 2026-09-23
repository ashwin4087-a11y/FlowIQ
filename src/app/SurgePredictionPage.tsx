import { FestivalSurgePanel } from '../components/surge/FestivalSurgePanel';
import type { FlowIQRuntime } from '../hooks/useFlowIQRuntime';

export function SurgePredictionPage({ runtime }: { runtime: FlowIQRuntime }) {
  const { state, backendOnline, refreshState } = runtime;

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] overflow-hidden max-w-6xl mx-auto px-4 py-3">
      <header className="shrink-0 space-y-0.5 border-b border-[#334155] pb-2 mb-2">
        <h2 className="text-lg font-semibold tracking-tight">Surge prediction</h2>
        <p className="text-xs text-[#94A3B8]">Predict congestion before it happens · PREDICT layer</p>
      </header>
      <div className="flex-1 min-h-0">
        <FestivalSurgePanel
          backendOnline={backendOnline}
          festivalPrediction={state.festivalPrediction}
          shortHorizon={state.prediction}
          brain={state.brain}
          onRefresh={refreshState}
          layout="page"
        />
      </div>
    </div>
  );
}
