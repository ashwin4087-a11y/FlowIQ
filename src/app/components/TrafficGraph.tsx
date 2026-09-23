interface TrafficGraphProps {
  data: number[];
  label: string;
}

export function TrafficGraph({ data, label }: TrafficGraphProps) {
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);

  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg">{label}</h3>
        <div className="text-sm text-[#8B949E]">
          <span className="text-[#39D5B0]">Live</span> • Last 30 seconds
        </div>
      </div>

      {/* Graph */}
      <div className="relative h-48">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-[#8B949E] pr-2">
          <span>{maxValue}</span>
          <span>{Math.round((maxValue + minValue) / 2)}</span>
          <span>{minValue}</span>
        </div>

        {/* Graph area */}
        <div className="ml-12 h-full relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="border-t border-[#30363D]" />
            ))}
          </div>

          {/* Line graph */}
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="graphGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#39D5B0" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#39D5B0" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Area fill */}
            <path
              d={`M 0 ${((maxValue - data[0]) / (maxValue - minValue)) * 192} ${data
                .map(
                  (value, index) =>
                    `L ${(index / (data.length - 1)) * 100}% ${((maxValue - value) / (maxValue - minValue)) * 192}`
                )
                .join(' ')} L 100% 192 L 0 192 Z`}
              fill="url(#graphGradient)"
            />

            {/* Line */}
            <path
              d={`M 0 ${((maxValue - data[0]) / (maxValue - minValue)) * 192} ${data
                .map(
                  (value, index) =>
                    `L ${(index / (data.length - 1)) * 100}% ${((maxValue - value) / (maxValue - minValue)) * 192}`
                )
                .join(' ')}`}
              fill="none"
              stroke="#39D5B0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {data.map((value, index) => (
              <circle
                key={index}
                cx={`${(index / (data.length - 1)) * 100}%`}
                cy={((maxValue - value) / (maxValue - minValue)) * 192}
                r="3"
                fill="#39D5B0"
                className="transition-all duration-300"
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Current value */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[#8B949E] text-sm">Current</span>
        <span className="text-2xl text-[#39D5B0]">{data[data.length - 1]} vehicles</span>
      </div>
    </div>
  );
}
