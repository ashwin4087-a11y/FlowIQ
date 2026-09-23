interface HeatmapData {
  value: number;
  event?: string;
  date?: string;
}

interface CalendarHeatmapProps {
  data: HeatmapData[];
}

export function CalendarHeatmap({ data }: CalendarHeatmapProps) {
  const getColor = (value: number) => {
    if (value >= 80) return '#F85149';
    if (value >= 60) return '#E3A000';
    if (value >= 40) return '#58A6FF';
    if (value >= 20) return '#39D5B0';
    return '#30363D';
  };

  const weeks = 12;
  const daysPerWeek = 7;

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-1">
        {Array.from({ length: weeks }, (_, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {Array.from({ length: daysPerWeek }, (_, dayIndex) => {
              const dataIndex = weekIndex * daysPerWeek + dayIndex;
              const cellData = data[dataIndex] || { value: 0 };
              return (
                <div
                  key={dayIndex}
                  className="w-3 h-3 rounded-sm transition-all hover:ring-2 hover:ring-[#39D5B0] cursor-pointer relative group"
                  style={{ backgroundColor: getColor(cellData.value) }}
                  title={cellData.event || `Day ${dataIndex + 1}: ${cellData.value}%`}
                >
                  {cellData.event && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-[#0D1117] border border-[#30363D] rounded px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {cellData.event}: {cellData.value}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-4 text-xs text-[#8B949E]">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#30363D' }} />
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#39D5B0' }} />
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#58A6FF' }} />
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#E3A000' }} />
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#F85149' }} />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
