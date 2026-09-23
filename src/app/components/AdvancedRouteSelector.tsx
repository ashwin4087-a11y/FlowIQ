import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Navigate2, Zap, Clock, Map as MapIcon, TrendingDown } from 'lucide-react';

interface AlternateRoute {
  id: string;
  name: string;
  type: 'Fastest' | 'Balanced' | 'Scenic' | 'Express';
  distance: number;
  time: number;
  timeSaved: number;
  surge: 'Low' | 'Very Low' | 'Minimal' | 'Medium';
  color: string;
  via: string;
  tags: string[];
  characteristics: string[];
}

interface RouteZone {
  id: string;
  name: string;
  coords: [number, number];
  characteristics: string[];
}

const ROUTE_ZONES: Record<string, RouteZone> = {
  'ashok-nagar': {
    id: 'ashok-nagar',
    name: 'Ashok Nagar',
    coords: [13.0468, 80.2152],
    characteristics: ['Urban Corridor', 'Signal-heavy', 'Peak-time congestion'],
  },
  'guindy': {
    id: 'guindy',
    name: 'Guindy',
    coords: [13.0067, 80.2206],
    characteristics: ['Eastern Bypass', 'Park Route', 'Low surge'],
  },
  'kodambakkam': {
    id: 'kodambakkam',
    name: 'Kodambakkam',
    coords: [13.0501, 80.2123],
    characteristics: ['Central Junction', 'Mixed Traffic', 'Industrial'],
  },
  'nungambakkam': {
    id: 'nungambakkam',
    name: 'Nungambakkam',
    coords: [13.0569, 80.2425],
    characteristics: ['Northern Corridor', 'High Volume', 'Multiple exits'],
  },
  'vadapalani': {
    id: 'vadapalani',
    name: 'Vadapalani',
    coords: [13.0501, 80.2123],
    characteristics: ['Western Bypass', 'Residential', 'Free-flow'],
  },
  'anna-nagar': {
    id: 'anna-nagar',
    name: 'Anna Nagar',
    coords: [13.0850, 80.2101],
    characteristics: ['Northern Zone', 'Main Roads', 'Moderate'],
  },
  'koyambedu': {
    id: 'koyambedu',
    name: 'Koyambedu',
    coords: [13.0694, 80.1946],
    characteristics: ['Western Junction', 'Market Area', 'Peak surge'],
  },
  'ambattur': {
    id: 'ambattur',
    name: 'Ambattur',
    coords: [13.1143, 80.1548],
    characteristics: ['Industrial Zone', 'Truck route', 'Less congested'],
  },
};

const ALTERNATE_ROUTES: AlternateRoute[] = [
  {
    id: 'primary',
    name: 'Primary Route (Recommended)',
    type: 'Fastest',
    distance: 12.5,
    time: 24,
    timeSaved: 8,
    surge: 'Low',
    color: '#00ff88',
    via: 'Main arterial, bypass enabled',
    tags: ['Surge-free', 'Fast-track', 'Recommended'],
    characteristics: ['Signal-free', 'Highway access', 'Real-time AI optimization'],
  },
  {
    id: 'alt1',
    name: 'Alternate Route A',
    type: 'Balanced',
    distance: 13.2,
    time: 26,
    timeSaved: 6,
    surge: 'Very Low',
    color: '#00e5ff',
    via: 'Residential corridor',
    tags: ['Smooth', 'Scenic', 'Signal-free'],
    characteristics: ['Smooth flow', 'Scenic path', 'Low congestion'],
  },
  {
    id: 'alt2',
    name: 'Alternate Route B',
    type: 'Scenic',
    distance: 14.1,
    time: 28,
    timeSaved: 4,
    surge: 'Minimal',
    color: '#fbbf24',
    via: 'Park route, no trucks',
    tags: ['Quieter', 'Less traffic', 'Green zone'],
    characteristics: ['Green corridor', 'Minimal emissions', 'Pedestrian-friendly'],
  },
  {
    id: 'alt3',
    name: 'Alternate Route C',
    type: 'Express',
    distance: 11.8,
    time: 20,
    timeSaved: 12,
    surge: 'Medium',
    color: '#f97316',
    via: 'Highway express',
    tags: ['Highway', 'Fastest', 'Premium'],
    characteristics: ['Express lane', 'Toll route', 'Maximum speed'],
  },
];

export function AdvancedRouteSelector() {
  const [selectedZone, setSelectedZone] = useState('ashok-nagar');
  const [selectedRoute, setSelectedRoute] = useState(ALTERNATE_ROUTES[0]);
  const [origin, setOrigin] = useState('Chennai Central');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<AlternateRoute[]>(ALTERNATE_ROUTES);

  const zone = ROUTE_ZONES[selectedZone];
  const bestRoute = useMemo(() => routes[0], [routes]);

  const handleFindRoutes = async () => {
    if (!destination) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setRoutes(ALTERNATE_ROUTES);
    setSelectedRoute(ALTERNATE_ROUTES[0]);
    setLoading(false);
  };

  const getSurgeColor = (surge: string) => {
    if (surge === 'Low' || surge === 'Very Low' || surge === 'Minimal') return 'text-[#10B981]';
    return 'text-[#F59E0B]';
  };

  return (
    <div className="space-y-6">
      {/* Zone Selection */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
        <h3 className="text-lg mb-4">Select Route Zone</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.values(ROUTE_ZONES).map((z) => (
            <button
              key={z.id}
              onClick={() => setSelectedZone(z.id)}
              className={`p-3 rounded-lg border transition-all text-sm font-medium ${
                selectedZone === z.id
                  ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
                  : 'border-[#334155] text-[#94A3B8] hover:border-[#10B981]'
              }`}
            >
              {z.name}
            </button>
          ))}
        </div>
      </div>

      {/* Route Input */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
        <h3 className="text-lg mb-4">Route Details</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-[#94A3B8] mb-2 block">From</label>
            <div className="flex items-center gap-3 bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2">
              <MapPin size={16} className="text-[#39D5B0]" />
              <input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="bg-transparent flex-1 outline-none text-[#e8edf5]"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-[#94A3B8] mb-2 block">To</label>
            <div className="flex items-center gap-3 bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2">
              <Navigate2 size={16} className="text-[#0EA5E9]" />
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Enter destination…"
                onKeyDown={(e) => e.key === 'Enter' && handleFindRoutes()}
                className="bg-transparent flex-1 outline-none text-[#e8edf5] placeholder-[#6b7a99]"
              />
            </div>
          </div>
          <button
            onClick={handleFindRoutes}
            disabled={loading || !destination}
            className="w-full py-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-lg font-semibold transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Computing Routes…' : 'Find Optimal Routes'}
          </button>
        </div>
      </div>

      {/* Routes Display */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold px-2">Available Routes</h3>
        {routes.map((route, idx) => (
          <button
            key={route.id}
            onClick={() => setSelectedRoute(route)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selectedRoute.id === route.id
                ? `border-[${route.color}] bg-opacity-20`
                : 'border-[#334155] hover:border-[#39D5B0]'
            } bg-[#1E293B]`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="inline-block px-2 py-1 rounded text-xs font-bold mb-2 bg-[#0EA5E9]/20 text-[#0EA5E9]">
                  {route.type}
                </div>
                <h4 className="text-base font-bold">{route.name}</h4>
              </div>
              {idx === 0 && (
                <div className="px-2 py-1 rounded-full text-xs font-bold bg-[#10B981]/20 text-[#10B981]">
                  RECOMMENDED
                </div>
              )}
            </div>

            <p className="text-sm text-[#94A3B8] mb-3">{route.via}</p>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-[#0F172A] rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-[#10B981] font-bold">
                  <Clock size={14} /> {route.time}
                </div>
                <div className="text-xs text-[#94A3B8]">minutes</div>
              </div>
              <div className="bg-[#0F172A] rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-[#0EA5E9] font-bold">
                  <MapIcon size={14} /> {route.distance}
                </div>
                <div className="text-xs text-[#94A3B8]">km</div>
              </div>
              <div className="bg-[#0F172A] rounded-lg p-2 text-center">
                <div className={`flex items-center justify-center gap-1 ${getSurgeColor(route.surge)} font-bold`}>
                  <Zap size={14} /> -{route.timeSaved}
                </div>
                <div className="text-xs text-[#94A3B8]">saved</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {route.tags.map((tag) => (
                <span
                  key={tag}
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    tag.includes('Surge') || tag.includes('Recommended') || tag.includes('Fastest')
                      ? 'bg-[#10B981]/20 text-[#10B981]'
                      : 'bg-[#0EA5E9]/20 text-[#0EA5E9]'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Route Details */}
      {selectedRoute && (
        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
          <h3 className="text-lg mb-4">Route Characteristics</h3>
          <div className="space-y-3">
            {selectedRoute.characteristics.map((char) => (
              <div key={char} className="flex items-center gap-3 p-3 bg-[#0F172A] rounded-lg">
                <TrendingDown size={16} className="text-[#39D5B0]" />
                <span className="text-sm">{char}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-gradient-to-r from-[#10B981]/10 to-[#059669]/10 border border-[#10B981]/30 rounded-lg">
            <p className="text-xs text-[#94A3B8] mb-1">SURGE ANALYSIS</p>
            <p className={`text-sm font-bold ${getSurgeColor(selectedRoute.surge)}`}>
              {selectedRoute.surge} surge risk on this route
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
