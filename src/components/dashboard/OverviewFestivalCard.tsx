import type { FestivalPredictionState } from '../../types/flowiq';

export function OverviewFestivalCard({
  festivalPrediction,
  onOpenSurge,
}: {
  festivalPrediction?: FestivalPredictionState;
  onOpenSurge: () => void;
}) {
  const level = festivalPrediction?.predictedLevel;
  const label =
    festivalPrediction?.status === 'ok' && level
      ? level
      : festivalPrediction?.status === 'model_not_available'
        ? 'MODEL NOT LOADED'
        : '—';

  return (
    <div className="rounded-lg bg-[#0F172A]/80 p-4 space-y-3">
      <div>
        <h3 className="text-xs font-semibold tracking-wide text-[#94A3B8]">FESTIVAL FORECAST</h3>
        <p className="text-lg font-semibold text-[#F8FAFC] mt-1">Current: {label}</p>
        {festivalPrediction?.status === 'ok' && (
          <p className="text-[10px] text-[#64748b] mt-1">
            {festivalPrediction.junctionName ?? 'Chennai junction'} · SIMULATION DATA
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onOpenSurge}
        className="text-xs w-full py-2 rounded border border-[#0EA5E9]/50 text-[#0EA5E9] hover:bg-[#0EA5E9]/10 font-semibold"
      >
        OPEN SURGE PREDICTION →
      </button>
    </div>
  );
}
