interface Junction {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'normal' | 'warning' | 'critical';
  vehicleCount: number;
}

interface CongestionMapProps {
  junctions: Junction[];
  onJunctionClick?: (id: string) => void;
}

export function CongestionMap({ junctions, onJunctionClick }: CongestionMapProps) {
  const statusColors = {
    normal: '#39D5B0',
    warning: '#E3A000',
    critical: '#F85149',
  };

  return (
    <div className="relative w-full h-full bg-[#161B22] rounded-lg border border-[#30363D] overflow-hidden">
      {/* Map grid background */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#30363D" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Road lines */}
      <svg className="absolute inset-0 w-full h-full opacity-30">
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#8B949E" strokeWidth="2" />
        <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#8B949E" strokeWidth="2" />
        <line x1="20%" y1="20%" x2="80%" y2="80%" stroke="#8B949E" strokeWidth="2" />
      </svg>

      {/* Junction markers */}
      {junctions.map((junction) => (
        <button
          key={junction.id}
          onClick={() => onJunctionClick?.(junction.id)}
          className="absolute group transition-transform hover:scale-125"
          style={{
            left: `${(junction.lng / 400) * 100}%`,
            top: `${(junction.lat / 400) * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Pulsing ring for critical junctions */}
          {junction.status === 'critical' && (
            <div className="absolute inset-0 -m-2">
              <div className="w-8 h-8 rounded-full bg-[#F85149]/20 animate-ping" />
            </div>
          )}
          
          {/* Junction pin */}
          <div
            className="relative w-6 h-6 rounded-full border-2 border-[#0D1117] shadow-lg transition-all"
            style={{ backgroundColor: statusColors[junction.status] }}
          >
            {/* Inner dot */}
            <div className="absolute inset-0 m-1 bg-white rounded-full animate-pulse" />
          </div>

          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-[#0D1117] border border-[#30363D] rounded px-3 py-2 whitespace-nowrap shadow-xl">
              <p className="text-white text-sm mb-1">{junction.name}</p>
              <p className="text-[#8B949E] text-xs">{junction.vehicleCount} vehicles</p>
              <p className="text-xs capitalize mt-1" style={{ color: statusColors[junction.status] }}>
                {junction.status}
              </p>
            </div>
          </div>
        </button>
      ))}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-[#0D1117]/90 border border-[#30363D] rounded-lg p-3 text-xs">
        <p className="text-[#8B949E] mb-2">Status</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#39D5B0]" />
            <span className="text-white">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#E3A000]" />
            <span className="text-white">Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#F85149]" />
            <span className="text-white">Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
}
