export function SurgeRiskIndicator({
  level,
  animate,
}: {
  level?: 'LOW' | 'MODERATE' | 'HIGH' | null;
  animate?: boolean;
}) {
  if (!level) return null;
  const pct = level === 'HIGH' ? 82 : level === 'MODERATE' ? 55 : 28;
  const color = level === 'HIGH' ? '#EF4444' : level === 'MODERATE' ? '#F59E0B' : '#10B981';
  return (
    <div className="space-y-1" aria-label={`Surge risk ${level}`}>
      <div className="h-2 bg-[#334155] rounded overflow-hidden">
        <div
          className={`h-full ${animate ? 'transition-all duration-700' : ''}`}
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-[10px] text-[#94A3B8]">SURGE RISK · {level} (model class, not calibrated probability)</p>
    </div>
  );
}
