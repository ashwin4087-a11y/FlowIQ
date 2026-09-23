import { Zap, TrendingUp } from 'lucide-react';

interface EfficiencyMeterProps {
  queueLaneA: number;
  queueLaneB: number;
  signalLaneA: number;
  signalLaneB: number;
}

export function EfficiencyMeter({ queueLaneA, queueLaneB, signalLaneA, signalLaneB }: EfficiencyMeterProps) {
  // Calculate efficiency based on how well signal time matches queue proportion
  const totalQueue = queueLaneA + queueLaneB;
  const idealLaneARatio = totalQueue > 0 ? queueLaneA / totalQueue : 0.5;
  const actualLaneARatio = signalLaneA / (signalLaneA + signalLaneB);
  const efficiency = Math.max(0, Math.min(100, 100 - Math.abs(idealLaneARatio - actualLaneARatio) * 200));

  const getEfficiencyColor = () => {
    if (efficiency >= 80) return '#39D5B0';
    if (efficiency >= 60) return '#58A6FF';
    if (efficiency >= 40) return '#E3A000';
    return '#F85149';
  };

  const getEfficiencyLabel = () => {
    if (efficiency >= 80) return 'Excellent';
    if (efficiency >= 60) return 'Good';
    if (efficiency >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="text-[#39D5B0]" size={20} />
          <h3 className="text-lg">System Efficiency</h3>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <TrendingUp size={14} className="text-[#39D5B0]" />
          <span className="text-[#8B949E]">Real-time</span>
        </div>
      </div>

      {/* Circular Progress */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-48 h-48">
          <svg className="transform -rotate-90 w-48 h-48">
            {/* Background circle */}
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="#0D1117"
              strokeWidth="12"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke={getEfficiencyColor()}
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - efficiency / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-5xl mb-2" style={{ color: getEfficiencyColor() }}>
              {Math.round(efficiency)}%
            </p>
            <p className="text-sm text-[#8B949E]">{getEfficiencyLabel()}</p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0D1117] rounded-lg p-4 border border-[#30363D]">
          <p className="text-xs text-[#8B949E] mb-1">Queue Balance</p>
          <p className="text-lg">{Math.round((1 - Math.abs(queueLaneA - queueLaneB) / Math.max(queueLaneA, queueLaneB, 1)) * 100)}%</p>
        </div>
        <div className="bg-[#0D1117] rounded-lg p-4 border border-[#30363D]">
          <p className="text-xs text-[#8B949E] mb-1">Signal Optimization</p>
          <p className="text-lg">{Math.round(efficiency)}%</p>
        </div>
      </div>

      <div className="mt-4 bg-[#0D1117] rounded-lg p-3 border border-[#30363D]">
        <p className="text-xs text-[#8B949E]">
          The RL agent is allocating green time proportionally to queue length, minimizing overall wait time across both lanes.
        </p>
      </div>
    </div>
  );
}
