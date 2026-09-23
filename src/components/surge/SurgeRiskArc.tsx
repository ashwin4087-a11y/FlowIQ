const LEVEL_ARC: Record<string, number> = {
  LOW: 0.33,
  MODERATE: 0.66,
  HIGH: 1,
};

export function SurgeRiskArc({
  level,
  animate,
}: {
  level?: 'LOW' | 'MODERATE' | 'HIGH' | null;
  animate?: boolean;
}) {
  if (!level) return null;
  const fraction = LEVEL_ARC[level] ?? 0.33;
  const stroke =
    level === 'HIGH' ? '#EF4444' : level === 'MODERATE' ? '#F59E0B' : '#10B981';
  const r = 44;
  const c = 2 * Math.PI * r;
  const dash = c * fraction;

  return (
    <div className="flex flex-col items-center py-2" aria-label={`Surge level ${level}`}>
      <svg width="120" height="120" viewBox="0 0 120 120" className="overflow-visible">
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="#334155"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform="rotate(-90 60 60)"
          className={animate ? 'transition-all duration-700 ease-out' : ''}
        />
        <text x="60" y="54" textAnchor="middle" className="fill-[#F1F5F9] text-sm font-semibold">
          {level}
        </text>
        <text x="60" y="72" textAnchor="middle" className="fill-[#94A3B8] text-[9px]">
          Model prediction
        </text>
      </svg>
      <p className="text-[10px] text-[#64748b] mt-1">Not a calibrated probability</p>
    </div>
  );
}
