import type { FestivalPredictionState } from '../../types/flowiq';
import { surgeSeverityStyles } from '../../lib/surgeSeverity';

export function ForecastTimeline({
  forecast,
  reducedMotion,
  compact = false,
}: {
  forecast?: FestivalPredictionState;
  reducedMotion: boolean;
  compact?: boolean;
}) {
  if (!forecast?.expectedWindow || forecast.status !== 'ok') {
    return (
      <p className="text-[10px] text-[#64748b]">Forecast horizon available when a festival forecast is loaded.</p>
    );
  }

  const startH = parseInt(forecast.expectedWindow.start.split(':')[0], 10) || 0;
  const endH = parseInt(forecast.expectedWindow.end.split(':')[0], 10) || 24;
  const now = new Date().getHours();
  const sev = surgeSeverityStyles(forecast.predictedLevel);

  if (compact) {
    return (
      <div className="space-y-1.5 min-w-0" aria-label="Forecast horizon">
        <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">Forecast horizon</p>
        <div className={`rounded-lg border px-2 py-2 ${sev.border} ${sev.bg}`}>
          <p className={`text-xs font-semibold ${sev.text}`}>
            {forecast.predictedLevel} · {forecast.expectedWindow.start}–{forecast.expectedWindow.end}
          </p>
        </div>
        <div className="relative h-10 rounded bg-[#0B1220]/50 border border-[#334155] overflow-hidden">
          <span
            className="absolute left-1 top-1 text-[8px] text-[#64748b]"
          >
            NOW
          </span>
          <div
            className={`absolute top-1 bottom-1 rounded ${sev.bg} border ${sev.border}`}
            style={{
              left: `${(startH / 24) * 100}%`,
              width: `${Math.max(8, ((endH - startH) / 24) * 100)}%`,
            }}
          >
            <span className={`sr-only`}>{forecast.predictedLevel} window</span>
          </div>
          <div
            className={`absolute w-1.5 h-1.5 rounded-full bg-[#0EA5E9] top-1/2 -translate-y-1/2 ${reducedMotion ? '' : 'animate-pulse'}`}
            style={{ left: `${(now / 24) * 100}%` }}
            title={`Current hour ~${now}:00`}
          />
        </div>
      </div>
    );
  }

  const markers = [0, 6, 12, 18, 24];

  return (
    <div className="space-y-2" aria-label="Forecast timeline">
      <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">Forecast horizon (local)</p>
      <div className="relative h-24 border-l border-[#334155] ml-3 pl-4">
        {markers.map((h) => (
          <div
            key={h}
            className="absolute left-0 text-[9px] text-[#64748b]"
            style={{ top: `${(h / 24) * 100}%`, transform: 'translateY(-50%)' }}
          >
            <span className="inline-block w-2 h-px bg-[#475569] -ml-4 align-middle" />
            {h === 0 ? 'NOW' : `${h}h`}
          </div>
        ))}
        <div
          className={`absolute left-1 w-1 rounded-full bg-[#0EA5E9] ${reducedMotion ? '' : 'animate-pulse motion-reduce:animate-none'}`}
          style={{ top: `${(now / 24) * 100}%`, height: '8px', transform: 'translateY(-50%)' }}
          title={`Current hour ~${now}:00`}
        />
        <div
          className={`absolute left-3 right-0 rounded border ${sev.border} ${sev.bg}`}
          style={{
            top: `${(startH / 24) * 100}%`,
            height: `${Math.max(4, ((endH - startH) / 24) * 100)}%`,
          }}
        >
          <span className={`text-[9px] px-1 ${sev.text}`}>
            {forecast.predictedLevel} · {forecast.expectedWindow.start}–{forecast.expectedWindow.end}
          </span>
        </div>
      </div>
    </div>
  );
}
