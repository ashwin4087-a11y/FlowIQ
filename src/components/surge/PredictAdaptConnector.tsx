import type { BrainState } from '../../types/flowiq';
import { surgeSeverityStyles } from '../../lib/surgeSeverity';

export function PredictAdaptConnector({
  festivalLevel,
  recommendation,
}: {
  festivalLevel?: string | null;
  recommendation?: BrainState['recommendation'];
}) {
  const levelStyles = surgeSeverityStyles(festivalLevel);
  const hasLevel = Boolean(festivalLevel && festivalLevel !== '—');

  return (
    <div className="border border-[#334155] rounded-lg px-3 py-2 text-[10px] text-[#94A3B8]" aria-label="Predict to adapt flow">
      <div className="flex items-stretch gap-2">
        <div className="flex-1 text-center">
          <p className="font-semibold text-[#CBD5E1]">PREDICT</p>
          <p className="text-[9px] mt-0.5 normal-case">Festival surge forecast</p>
        </div>
        <div className="flex flex-col items-center justify-center w-8 gap-0.5 shrink-0" aria-hidden>
          <span className="text-[#475569]">↓</span>
          {hasLevel && (
            <span className={`text-[8px] font-semibold text-center leading-tight ${levelStyles.text}`}>
              {festivalLevel} SURGE
            </span>
          )}
          <span className="text-[#475569]">↓</span>
        </div>
        <div className="flex-1 text-center">
          <p className="font-semibold text-[#CBD5E1]">ADAPT</p>
          {recommendation ? (
            <p className="text-[9px] text-[#F59E0B] mt-0.5 normal-case">{recommendation.label}</p>
          ) : (
            <p className="text-[9px] text-[#64748b] mt-0.5 normal-case">Brain / signal layer</p>
          )}
        </div>
      </div>
    </div>
  );
}
