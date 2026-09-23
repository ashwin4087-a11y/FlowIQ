interface Lane {
  name: string;
  time: number;
}

interface SignalTimingBarProps {
  laneA: Lane;
  laneB: Lane;
}

export function SignalTimingBar({ laneA, laneB }: SignalTimingBarProps) {
  const totalTime = laneA.time + laneB.time;
  const laneAPercent = (laneA.time / totalTime) * 100;
  const laneBPercent = (laneB.time / totalTime) * 100;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[#94A3B8]">{laneA.name}</span>
          <span className="text-sm font-mono text-white">{laneA.time}s</span>
        </div>
        <div className="h-3 bg-[#0F172A] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#10B981] rounded-full transition-all duration-500"
            style={{ width: `${laneAPercent}%` }}
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[#94A3B8]">{laneB.name}</span>
          <span className="text-sm font-mono text-white">{laneB.time}s</span>
        </div>
        <div className="h-3 bg-[#0F172A] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0EA5E9] rounded-full transition-all duration-500"
            style={{ width: `${laneBPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
