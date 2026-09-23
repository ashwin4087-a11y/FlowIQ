import { MapPin, TrendingUp, TrendingDown, Navigation2 } from 'lucide-react';
import chennaiMapImage from '../../imports/image.png';

interface Junction {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'normal' | 'warning' | 'critical';
  vehicleCount: number;
}

interface RealTimeJunctionMapProps {
  junctions: Junction[];
  onJunctionClick?: (id: string) => void;
  selectedJunctionId?: string;
  selectedRoute?: 'main' | 'alternate1' | 'alternate2';
}

const routeConfigs: Record<string, { main: string; alternate1: string; alternate2: string }> = {
  '4': {
    // Vadapalani Junction
    main: '150,80 160,100 165,120 160,140',
    alternate1: '150,80 140,100 135,120 140,140',
    alternate2: '150,80 155,95 165,110 155,130'
  },
  '5': {
    // Porur Toll Plaza
    main: '180,30 175,50 170,80 175,120',
    alternate1: '180,30 195,50 200,80 195,120',
    alternate2: '180,30 185,60 190,95 185,125'
  }
};

export function RealTimeJunctionMap({ junctions, onJunctionClick, selectedJunctionId }: RealTimeJunctionMapProps) {
  const statusColors = {
    normal: '#10B981',
    warning: '#F59E0B',
    critical: '#EF4444',
  };

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg">Live Junction Map</h3>
          <div className="text-xs text-[#94A3B8] bg-[#0F172A] px-2 py-1 rounded border border-[#334155]">
            Chennai Metropolitan Area
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
          <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          Live
        </div>
      </div>

      <div className="relative w-full h-96 bg-[#0F172A] rounded-lg border border-[#334155] overflow-hidden">
        {/* Real Chennai Map as Background */}
        <div className="absolute inset-0">
          <img
            src={chennaiMapImage}
            alt="Chennai Map"
            className="w-full h-full object-cover opacity-60"
          />
          {/* Dark overlay for better contrast with markers */}
          <div className="absolute inset-0 bg-[#0F172A]/50" />
          {/* Gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/30 via-transparent to-[#0F172A]/30" />
        </div>

        {/* Traffic flow lines - animated */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {junctions.map((junction, i) => {
            const connectedJunctions = junctions.filter((_, idx) => idx !== i && Math.random() > 0.6).slice(0, 2);
            return connectedJunctions.map((connected, idx) => (
              <g key={`${junction.id}-${connected.id}-${idx}`}>
                <line
                  x1={`${(junction.lng / 400) * 100}%`}
                  y1={`${(junction.lat / 400) * 100}%`}
                  x2={`${(connected.lng / 400) * 100}%`}
                  y2={`${(connected.lat / 400) * 100}%`}
                  stroke={junction.status === 'critical' ? '#EF4444' : junction.status === 'warning' ? '#F59E0B' : '#10B981'}
                  strokeWidth="2"
                  opacity="0.15"
                  strokeDasharray="5,5"
                  className="animate-pulse"
                />
              </g>
            ));
          })}

          {/* Demo route overlay for selected junction or Anna Nagar by default */}
          {selectedJunctionId && routeConfigs[selectedJunctionId] ? (
            (() => {
              const selected = selectedRoute || 'main';
              const route = routeConfigs[selectedJunctionId][selected];
              const routeColors: Record<'main' | 'alternate1' | 'alternate2', string> = {
                main: '#EF4444',
                alternate1: '#10B981',
                alternate2: '#F59E0B',
              };
              const routeDash: Record<'main' | 'alternate1' | 'alternate2', string | undefined> = {
                main: undefined,
                alternate1: undefined,
                alternate2: '10,6',
              };
              const points = route.split(' ');
              const [firstPoint] = points;
              const [cx, cy] = firstPoint.split(',');

              return (
                <>
                  <polyline
                    points={route}
                    fill="none"
                    stroke={routeColors[selected]}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.95"
                    strokeDasharray={routeDash[selected]}
                  />
                  <circle cx={cx} cy={cy} r="6" fill={routeColors[selected]} />
                </>
              );
            })()
          ) : (
            <>
              <polyline
                points="70%,25% 63%,22% 55%,18%"
                fill="none"
                stroke="#EF4444"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
              <polyline
                points="73%,28% 80%,32% 86%,30%"
                fill="none"
                stroke="#10B981"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.85"
              />
              <polyline
                points="68%,30% 60%,35% 52%,38%"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.85"
                strokeDasharray="8,6"
              />
            </>
          )}
        </svg>

        {/* Junction markers - map style */}
        {junctions.map((junction, index) => {
          const trend = Math.random() > 0.5 ? 'up' : 'down';
          const change = Math.floor(Math.random() * 15) + 5;

          return (
            <button
              key={junction.id}
              onClick={() => onJunctionClick?.(junction.id)}
              className="absolute group transition-all duration-300 hover:scale-110"
              style={{
                left: `${(junction.lng / 400) * 100}%`,
                top: `${(junction.lat / 400) * 100}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 10 + index,
              }}
            >
              {/* Pulse effect for critical */}
              {junction.status === 'critical' && (
                <div className="absolute inset-0 -m-6">
                  <div className="w-16 h-16 rounded-full bg-[#EF4444]/10 animate-ping" />
                </div>
              )}

              {/* Traffic density heatmap circle */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-500 blur-sm"
                style={{
                  left: '50%',
                  top: '50%',
                  backgroundColor: `${statusColors[junction.status]}`,
                  opacity: junction.status === 'critical' ? 0.3 : junction.status === 'warning' ? 0.2 : 0.15,
                  width: `${28 + (junction.vehicleCount / 250) * 24}px`,
                  height: `${28 + (junction.vehicleCount / 250) * 24}px`,
                }}
              />

              {/* Main junction marker - traffic light style */}
              <div
                className="relative w-7 h-7 rounded-full border-3 shadow-lg flex items-center justify-center transition-all"
                style={{
                  backgroundColor: statusColors[junction.status],
                  borderColor: '#0F172A',
                  borderWidth: '3px',
                  boxShadow: `0 0 12px ${statusColors[junction.status]}60`,
                }}
              >
                <div className="w-2 h-2 rounded-full bg-white/90" />
              </div>

              {/* Hover card - map tooltip style */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all pointer-events-none scale-90 group-hover:scale-100">
                <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: statusColors[junction.status] }}
                    />
                    <p className="text-gray-900 font-semibold text-sm">{junction.name}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span>{junction.vehicleCount} vehicles</span>
                    <div className={`flex items-center gap-1 ${trend === 'up' ? 'text-red-600' : 'text-green-600'}`}>
                      {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {change}%
                    </div>
                  </div>
                </div>
                {/* Arrow */}
                <div className="w-2.5 h-2.5 bg-white/95 border-b border-r border-gray-200 transform rotate-45 mx-auto -mt-1.5" />
              </div>

              {/* Vehicle count badge - minimalist */}
              <div
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-bold"
                style={{
                  backgroundColor: '#0F172A',
                  color: statusColors[junction.status],
                  border: `1px solid ${statusColors[junction.status]}60`,
                }}
              >
                {junction.vehicleCount}
              </div>
            </button>
          );
        })}

        {/* Compass rose - authentic map style */}
        <div className="absolute top-4 left-4 w-16 h-16">
          <div className="relative w-full h-full bg-white/10 backdrop-blur-sm rounded-full border border-white/20 flex items-center justify-center shadow-lg">
            <Navigation2 className="text-[#0EA5E9] absolute" size={20} />
            <div className="absolute -top-1 text-xs font-bold text-white">N</div>
            <div className="absolute -bottom-1 text-xs font-light text-gray-400">S</div>
            <div className="absolute -left-1 text-xs font-light text-gray-400">W</div>
            <div className="absolute -right-1 text-xs font-light text-gray-400">E</div>
          </div>
        </div>

        {/* Scale indicator */}
        <div className="absolute bottom-4 left-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded px-3 py-2">
          <div className="flex items-end gap-1 mb-1">
            <div className="h-2 w-8 bg-white border-l-2 border-r-2 border-b-2 border-white" />
            <div className="h-3 w-8 bg-white/50 border-r-2 border-b-2 border-white" />
          </div>
          <div className="text-[10px] text-white font-medium">0 ━━━ 2 km</div>
        </div>

        {/* Legend - map style */}
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg text-xs">
          <p className="text-gray-700 font-semibold mb-2">Route Guide</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-6 rounded-full bg-[#EF4444]" />
              <span className="text-gray-700">Main congested route</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-6 rounded-full bg-[#10B981]" />
              <span className="text-gray-700">Best alternate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-6 rounded-full bg-[#F59E0B]" />
              <span className="text-gray-700">Moderate alternate</span>
            </div>
          </div>
        </div>

        {/* Map attribution */}
        <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-gray-300">
          FlowIQ Map Data © 2026
        </div>
      </div>
    </div>
  );
}
