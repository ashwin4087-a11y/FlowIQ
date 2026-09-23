import { Waves, ArrowRight } from 'lucide-react';

interface AdaptiveSignalVisualizerProps {
  queueLaneA: number;
  queueLaneB: number;
  signalLaneA: number;
  signalLaneB: number;
  algorithmLabel: string;
}

export function AdaptiveSignalVisualizer({
  queueLaneA,
  queueLaneB,
  signalLaneA,
  signalLaneB,
  algorithmLabel,
}: AdaptiveSignalVisualizerProps) {
  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg">Adaptive Signal Algorithm</h3>
          <p className="text-[#94A3B8] text-sm">Real-time ultrasonic sensor → RL agent → signal timing</p>
        </div>
        <div className="flex items-center gap-2 bg-[#0F172A] px-3 py-2 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-sm text-[#10B981] font-mono">UPDATING</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Lane A */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#0F172A] px-3 py-2 rounded-lg min-w-[140px]">
              <Waves className="text-[#0EA5E9]" size={16} />
              <span className="text-sm text-[#94A3B8]">Lane A</span>
            </div>
            <ArrowRight className="text-[#94A3B8]" size={16} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#94A3B8]">Queue detected</span>
                <span className="text-sm font-mono text-white">{queueLaneA} vehicles</span>
              </div>
              <div className="h-2 bg-[#0F172A] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0EA5E9] transition-all duration-500"
                  style={{ width: `${Math.min((queueLaneA / 50) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pl-[152px]">
            <ArrowRight className="text-[#94A3B8]" size={16} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#94A3B8]">Green signal allocated</span>
                <span className="text-sm font-mono text-[#10B981]">{signalLaneA}s</span>
              </div>
              <div className="h-3 bg-[#0F172A] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#10B981] transition-all duration-500"
                  style={{ width: `${(signalLaneA / 130) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#334155]" />

        {/* Lane B */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#0F172A] px-3 py-2 rounded-lg min-w-[140px]">
              <Waves className="text-[#F59E0B]" size={16} />
              <span className="text-sm text-[#94A3B8]">Lane B</span>
            </div>
            <ArrowRight className="text-[#94A3B8]" size={16} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#94A3B8]">Queue detected</span>
                <span className="text-sm font-mono text-white">{queueLaneB} vehicles</span>
              </div>
              <div className="h-2 bg-[#0F172A] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#F59E0B] transition-all duration-500"
                  style={{ width: `${Math.min((queueLaneB / 50) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pl-[152px]">
            <ArrowRight className="text-[#94A3B8]" size={16} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#94A3B8]">Green signal allocated</span>
                <span className="text-sm font-mono text-[#10B981]">{signalLaneB}s</span>
              </div>
              <div className="h-3 bg-[#0F172A] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#10B981] transition-all duration-500"
                  style={{ width: `${(signalLaneB / 130) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-[#0F172A] border border-[#334155] rounded-lg p-4">
        <p className="text-xs text-[#94A3B8] mb-2">Algorithm</p>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-white">{algorithmLabel}</span>
          <code className="text-xs text-[#10B981] font-mono">
            {algorithmLabel === 'Priority RL'
              ? 'green_time = clamp(18s, cycle*0.45 + imbalance*0.8, cycle-18s)'
              : algorithmLabel === 'Hybrid RL'
              ? 'green_time = clamp(18s, cycle*(0.5 + 0.05*queue_ratio), cycle-18s)'
              : 'green_time = clamp(18s, cycle*(queueA/(queueA+queueB)), cycle-18s)'}
          </code>
        </div>
      </div>
    </div>
  );
}
