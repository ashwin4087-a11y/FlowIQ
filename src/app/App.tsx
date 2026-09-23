import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Smartphone,
  Radio,
  TrendingUp,
  Cpu,
  MapPin,
  Home,
  Route,
  AlertCircle,
  Camera,
  Waves,
  Mic,
  Clock,
  Car,
  BarChart3,
  Settings,
  Siren,
} from 'lucide-react';
import { JunctionCard } from './components/JunctionCard';
import { TrafficLightLogo } from './components/TrafficLightLogo';
import { SignalTimingBar } from './components/SignalTimingBar';
import { SurgeBadge } from './components/SurgeBadge';
import { HardwareSensor } from './components/HardwareSensor';
import { EmergencyButton } from './components/EmergencyButton';
import { CongestionMap } from './components/CongestionMap';
import { CalendarHeatmap } from './components/CalendarHeatmap';
import { TrafficGraph } from './components/TrafficGraph';
import { HardwareMonitor } from './components/HardwareMonitor';
import { AdaptiveSignalVisualizer } from './components/AdaptiveSignalVisualizer';
import { RealTimeJunctionMap } from './components/RealTimeJunctionMap';
import { EfficiencyMeter } from './components/EfficiencyMeter';
import { CHENNAI_JUNCTIONS, type ChennaiJunction } from '../data/chennaiJunctions';

type ViewMode = 'dashboard' | 'mobile';
type DashboardTab = 'overview' | 'signals' | 'alternate' | 'surge' | 'hardware';
type MobileScreen = 'home' | 'junction' | 'emergency';
type RouteView = 'main' | 'alternate1' | 'alternate2';

type JunctionAlgorithm = 'Proportional RL' | 'Priority RL' | 'Hybrid RL';

type JunctionData = ChennaiJunction;

const junctionsData: JunctionData[] = CHENNAI_JUNCTIONS;

const heatmapData = Array.from({ length: 84 }, (_, i) => {
  const specialDays: Record<number, { value: number; event: string }> = {
    14: { value: 85, event: 'Pongal' },
    15: { value: 90, event: 'Pongal' },
    16: { value: 78, event: 'Pongal' },
    35: { value: 72, event: 'Republic Day' },
    56: { value: 88, event: 'Diwali' },
    57: { value: 92, event: 'Diwali' },
  };
  return (
    specialDays[i] || {
      value: Math.random() > 0.7 ? Math.floor(Math.random() * 50) : Math.floor(Math.random() * 30),
      date: `Day ${i}`,
    }
  );
});

type JunctionState = {
  queueLaneA: number;
  queueLaneB: number;
  laneATime: number;
  laneBTime: number;
  algorithmLabel: JunctionAlgorithm;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const calculateSignalTiming = (
  queueA: number,
  queueB: number,
  cycleDuration: number,
  algorithm: JunctionAlgorithm
) => {
  const minGreenTime = 18;
  const totalQueue = Math.max(queueA + queueB, 1);
  const ratio = queueA / totalQueue;

  switch (algorithm) {
    case 'Priority RL': {
      const imbalance = queueA - queueB;
      const base = Math.round(cycleDuration * (0.45 + 0.05 * Math.sign(imbalance)));
      const laneATime = clamp(base + imbalance * 0.8, minGreenTime, cycleDuration - minGreenTime);
      return { laneATime, laneBTime: cycleDuration - laneATime };
    }
    case 'Hybrid RL': {
      const priorityFactor = queueA > queueB ? 0.55 : 0.45;
      let laneATime = Math.round(cycleDuration * (priorityFactor * ratio + 0.5 * (1 - ratio)));
      laneATime = clamp(laneATime, minGreenTime, cycleDuration - minGreenTime);
      return { laneATime, laneBTime: cycleDuration - laneATime };
    }
    default: {
      const laneARatio = queueA / totalQueue;
      let laneATime = clamp(Math.round(cycleDuration * laneARatio), minGreenTime, cycleDuration - minGreenTime);
      return { laneATime, laneBTime: cycleDuration - laneATime };
    }
  }
};

const buildInitialJunctionStates = () => {
  const state: Record<string, JunctionState> = {};
  junctionsData.forEach((junction) => {
    const queueA = clamp(junction.baseLaneA + Math.floor(Math.random() * 7 - 3), 6, 40);
    const queueB = clamp(junction.baseLaneB + Math.floor(Math.random() * 7 - 3), 4, 36);
    const { laneATime, laneBTime } = calculateSignalTiming(queueA, queueB, junction.cycleDuration, junction.algorithm);
    state[junction.id] = {
      queueLaneA: queueA,
      queueLaneB: queueB,
      laneATime,
      laneBTime,
      algorithmLabel: junction.algorithm,
    };
  });
  return state;
};

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('overview');
  const [mobileScreen, setMobileScreen] = useState<MobileScreen>('home');
  const [selectedJunction, setSelectedJunction] = useState(junctionsData[0]);
  const [selectedRouteView, setSelectedRouteView] = useState<RouteView>('main');
  const [junctionStates, setJunctionStates] = useState<Record<string, JunctionState>>(buildInitialJunctionStates);

  const [trafficHistory, setTrafficHistory] = useState<number[]>([1462, 1489, 1523, 1498, 1567, 1612, 1589, 1634, 1678, 1702]);

  const selectedState = junctionStates[selectedJunction.id] || buildInitialJunctionStates()[selectedJunction.id];
  const { queueLaneA, queueLaneB, laneATime, laneBTime, algorithmLabel } = selectedState;

  // Simulate real-time sensor updates
  useEffect(() => {
    const interval = setInterval(() => {
      setJunctionStates((prevStates) => {
        const nextStates: Record<string, JunctionState> = {};

        junctionsData.forEach((junction) => {
          const current = prevStates[junction.id] ?? {
            queueLaneA: junction.baseLaneA,
            queueLaneB: junction.baseLaneB,
            laneATime: 0,
            laneBTime: 0,
            algorithmLabel: junction.algorithm,
          };

          const deltaA = Math.floor(Math.random() * 7 - 3);
          const deltaB = Math.floor(Math.random() * 7 - 3);
          const queueA = clamp(current.queueLaneA + deltaA, 6, 44);
          const queueB = clamp(current.queueLaneB + deltaB, 4, 38);
          const { laneATime, laneBTime } = calculateSignalTiming(queueA, queueB, junction.cycleDuration, junction.algorithm);

          nextStates[junction.id] = {
            queueLaneA: queueA,
            queueLaneB: queueB,
            laneATime,
            laneBTime,
            algorithmLabel: junction.algorithm,
          };
        });

        return nextStates;
      });

      setTrafficHistory((prev) => {
        const total = junctionsData.reduce((sum, j) => sum + j.vehicleCount, 0) + Math.floor(Math.random() * 60 - 30);
        return [...prev.slice(-9), total];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const totalVehicles = junctionsData.reduce((sum, j) => sum + j.vehicleCount, 0);
  const criticalCount = junctionsData.filter((j) => j.status === 'critical').length;
  const warningCount = junctionsData.filter((j) => j.status === 'warning').length;

  return (
    <div className="h-screen bg-[#0F172A] text-white flex flex-col overflow-hidden">
      {/* Top Navigation */}
      <header className="bg-[#1E293B] border-b border-[#334155] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <TrafficLightLogo size={28} />
              <h1 className="text-2xl">FlowIQ</h1>
            </div>
            <div className="h-6 w-px bg-[#334155]" />
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  viewMode === 'dashboard'
                    ? 'bg-[#0EA5E9] text-[#0F172A]'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  viewMode === 'mobile'
                    ? 'bg-[#0EA5E9] text-[#0F172A]'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <Smartphone size={18} />
                Mobile App
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[#94A3B8]">System Online</span>
            </div>
            <div className="text-sm text-[#94A3B8]">Chennai Traffic Control</div>
          </div>
        </div>
      </header>

      {/* Dashboard View */}
      {viewMode === 'dashboard' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 bg-[#1E293B] border-r border-[#334155] p-4 space-y-2">
            <button
              onClick={() => setDashboardTab('overview')}
              className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                dashboardTab === 'overview'
                  ? 'bg-[#0EA5E9]/15 text-[#0EA5E9] border border-[#0EA5E9]/30'
                  : 'text-[#94A3B8] hover:bg-[#0F172A] hover:text-white'
              }`}
            >
              <LayoutDashboard size={20} />
              Overview
            </button>
            <button
              onClick={() => setDashboardTab('signals')}
              className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                dashboardTab === 'signals'
                  ? 'bg-[#0EA5E9]/15 text-[#0EA5E9] border border-[#0EA5E9]/30'
                  : 'text-[#94A3B8] hover:bg-[#0F172A] hover:text-white'
              }`}
            >
              <Radio size={20} />
              Signal Control
            </button>
            <button
              onClick={() => setDashboardTab('surge')}
              className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                dashboardTab === 'surge'
                  ? 'bg-[#0EA5E9]/15 text-[#0EA5E9] border border-[#0EA5E9]/30'
                  : 'text-[#94A3B8] hover:bg-[#0F172A] hover:text-white'
              }`}
            >
              <TrendingUp size={20} />
              Surge Prediction
            </button>
            <button
              onClick={() => setDashboardTab('alternate')}
              className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                dashboardTab === 'alternate'
                  ? 'bg-[#0EA5E9]/15 text-[#0EA5E9] border border-[#0EA5E9]/30'
                  : 'text-[#94A3B8] hover:bg-[#0F172A] hover:text-white'
              }`}
            >
              <Route size={20} />
              Alternate Routes
            </button>
            <button
              onClick={() => setDashboardTab('hardware')}
              className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                dashboardTab === 'hardware'
                  ? 'bg-[#0EA5E9]/15 text-[#0EA5E9] border border-[#0EA5E9]/30'
                  : 'text-[#94A3B8] hover:bg-[#0F172A] hover:text-white'
              }`}
            >
              <Cpu size={20} />
              Hardware Monitor
            </button>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {dashboardTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl mb-2">System Overview</h2>
                  <p className="text-[#94A3B8]">Real-time monitoring of all Chennai junctions</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#94A3B8]">Total Vehicles</span>
                      <Car className="text-[#0EA5E9]" size={20} />
                    </div>
                    <p className="text-3xl">{totalVehicles}</p>
                  </div>
                  <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#94A3B8]">Active Junctions</span>
                      <MapPin className="text-[#10B981]" size={20} />
                    </div>
                    <p className="text-3xl">{junctionsData.length}</p>
                  </div>
                  <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#94A3B8]">Critical</span>
                      <AlertCircle className="text-[#EF4444]" size={20} />
                    </div>
                    <p className="text-3xl">{criticalCount}</p>
                  </div>
                  <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#94A3B8]">Warning</span>
                      <AlertCircle className="text-[#F59E0B]" size={20} />
                    </div>
                    <p className="text-3xl">{warningCount}</p>
                  </div>
                </div>

                {/* Real-time Junction Map */}
                <RealTimeJunctionMap
                  junctions={junctionsData}
                  selectedJunctionId={selectedJunction.id}
                  onJunctionClick={(id) => {
                    setSelectedJunction(junctionsData.find((j) => j.id === id)!);
                    setDashboardTab('signals');
                  }}
                />

                {/* Traffic Graph */}
                <TrafficGraph data={trafficHistory} label="Network-wide Traffic Flow" />

                {/* Junction Grid */}
                <div>
                  <h3 className="text-xl mb-4">Junction Status Grid</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {junctionsData.map((junction) => (
                      <JunctionCard
                        key={junction.id}
                        name={junction.name}
                        vehicleCount={junction.vehicleCount}
                        status={junction.status}
                        onClick={() => {
                          setSelectedJunction(junction);
                          setDashboardTab('signals');
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {dashboardTab === 'signals' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl mb-2">Signal Control Panel</h2>
                  <p className="text-[#94A3B8]">RL agent timing control and manual overrides</p>
                </div>

                {/* Junction Selector */}
                <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
                  <label className="block text-sm text-[#94A3B8] mb-3">Selected Junction</label>
                  <select
                    value={selectedJunction.id}
                    onChange={(e) =>
                      setSelectedJunction(junctionsData.find((j) => j.id === e.target.value)!)
                    }
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#0EA5E9]"
                  >
                    {junctionsData.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Adaptive Signal Algorithm Visualization */}
                <AdaptiveSignalVisualizer
                  queueLaneA={queueLaneA}
                  queueLaneB={queueLaneB}
                  signalLaneA={laneATime}
                  signalLaneB={laneBTime}
                  algorithmLabel={algorithmLabel}
                />

                {/* Current Timing Plan */}
                <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg">Active Signal Schedule</h3>
                      <p className="text-[#94A3B8] text-sm">Auto-adjusted every 3 seconds based on sensor data</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                      <span className="text-sm text-[#10B981]">RL Agent Active</span>
                    </div>
                  </div>
                  <SignalTimingBar
                    laneA={{ name: 'Anna Salai (N-S)', time: laneATime }}
                    laneB={{ name: 'Mount Road (E-W)', time: laneBTime }}
                  />
                </div>

                {/* Live Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Car className="text-[#0EA5E9]" size={18} />
                      <span className="text-[#94A3B8] text-sm">Queue Length (N-S)</span>
                    </div>
                    <p className="text-2xl">{queueLaneA} vehicles</p>
                    <div className="mt-2 h-1.5 bg-[#0F172A] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0EA5E9] transition-all duration-500"
                        style={{ width: `${Math.min((queueLaneA / 50) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Car className="text-[#0EA5E9]" size={18} />
                      <span className="text-[#94A3B8] text-sm">Queue Length (E-W)</span>
                    </div>
                    <p className="text-2xl">{queueLaneB} vehicles</p>
                    <div className="mt-2 h-1.5 bg-[#0F172A] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#F59E0B] transition-all duration-500"
                        style={{ width: `${Math.min((queueLaneB / 50) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="text-[#0EA5E9]" size={18} />
                      <span className="text-[#94A3B8] text-sm">Avg Wait Time</span>
                    </div>
                    <p className="text-2xl">{((queueLaneA + queueLaneB) / 20).toFixed(1)} min</p>
                    <p className="text-xs text-[#94A3B8] mt-1">Calculated from queue</p>
                  </div>
                </div>

                {/* Route Guidance */}
                <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg">Route Guidance</h3>
                      <p className="text-[#94A3B8] text-sm">Best alternate path recommendations for {selectedJunction.name}</p>
                    </div>
                    <span className="text-xs font-semibold bg-[#0F172A] border border-[#334155] px-3 py-1 rounded-full text-[#10B981]">
                      Live routing
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4">
                      <div>
                        <p className="text-[#94A3B8] text-sm">Main route</p>
                        <p className="text-white font-semibold">{selectedJunction.name} Main</p>
                      </div>
                      <span className="text-xs font-semibold text-[#EF4444] bg-[#EF4444]/10 px-2 py-1 rounded-full">Heavy traffic</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 p-4">
                      <div>
                        <p className="text-[#94A3B8] text-sm">Best alternate</p>
                        <p className="text-white font-semibold">{selectedJunction.name} Bypass Route 1</p>
                      </div>
                      <span className="text-xs font-semibold text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded-full">Good</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4">
                      <div>
                        <p className="text-[#94A3B8] text-sm">Moderate alternate</p>
                        <p className="text-white font-semibold">{selectedJunction.name} Bypass Route 2</p>
                      </div>
                      <span className="text-xs font-semibold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-1 rounded-full">Moderate</span>
                    </div>
                  </div>
                </div>

                {/* Efficiency Meter */}
                <EfficiencyMeter
                  queueLaneA={queueLaneA}
                  queueLaneB={queueLaneB}
                  signalLaneA={laneATime}
                  signalLaneB={laneBTime}
                />

                {/* Manual Override */}
                <div className="bg-[#1E293B] border border-[#F59E0B]/30 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg flex items-center gap-2">
                        <Settings size={20} />
                        Manual Override
                      </h3>
                      <p className="text-[#94A3B8] text-sm">
                        Take control from RL agent (use with caution)
                      </p>
                    </div>
                    <button className="px-6 py-2 bg-[#F59E0B]/20 border border-[#F59E0B] text-[#F59E0B] rounded-lg hover:bg-[#F59E0B]/30 transition-colors">
                      Enable Override
                    </button>
                  </div>
                </div>
              </div>
            )}

            {dashboardTab === 'alternate' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl mb-2">Alternate Route Planner</h2>
                  <p className="text-[#94A3B8]">Show alternate route options for the selected signal.</p>
                </div>

                <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg">Selected Signal</h3>
                      <p className="text-[#94A3B8] text-sm">{selectedJunction.name}</p>
                    </div>
                    <select
                      value={selectedJunction.id}
                      onChange={(e) => setSelectedJunction(junctionsData.find((j) => j.id === e.target.value)!)}
                      className="max-w-sm w-full md:w-auto bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#0EA5E9]"
                    >
                      {junctionsData.map((junction) => (
                        <option key={junction.id} value={junction.id}>
                          {junction.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
                    <div className="space-y-4">
                      <div className="bg-[#0F172A] border border-[#334155] rounded-lg overflow-hidden h-[420px]">
                        <RealTimeJunctionMap
                          junctions={junctionsData}
                          selectedJunctionId={selectedJunction.id}
                          selectedRoute={selectedRouteView}
                          onJunctionClick={(id) => setSelectedJunction(junctionsData.find((j) => j.id === id)!)}
                        />
                      </div>

                      <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
                        <h3 className="text-lg mb-4">Selected Route</h3>
                        <div className="flex flex-wrap gap-3 mb-4">
                          {[
                            { value: 'main' as RouteView, label: 'Main route', badge: 'Heavy', color: 'border-[#EF4444] text-[#EF4444] bg-[#EF4444]/10' },
                            { value: 'alternate1' as RouteView, label: 'Best alternate', badge: 'Good', color: 'border-[#10B981] text-[#10B981] bg-[#10B981]/10' },
                            { value: 'alternate2' as RouteView, label: 'Moderate alternate', badge: 'Moderate', color: 'border-[#F59E0B] text-[#F59E0B] bg-[#F59E0B]/10' },
                          ].map((route) => (
                            <button
                              key={route.value}
                              onClick={() => setSelectedRouteView(route.value)}
                              className={`rounded-lg border px-4 py-3 text-left transition-all ${route.value === selectedRouteView ? `${route.color} border-2` : 'border-[#334155] bg-[#0F172A] text-[#94A3B8]'}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-sm text-white">{route.label}</span>
                                <span className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${route.color}`}>{route.badge}</span>
                              </div>
                              <p className="text-sm text-[#94A3B8]">{selectedJunction.name} {route.value === 'main' ? 'main corridor' : route.value === 'alternate1' ? 'bypass route 1' : 'bypass route 2'}</p>
                            </button>
                          ))}
                        </div>
                        <div className="rounded-xl border border-[#334155] bg-[#0F172A]/80 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[#94A3B8] text-sm">Active selected route</span>
                            <span className="text-xs font-semibold text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded-full">Signal-specific</span>
                          </div>
                          <p className="text-white font-semibold text-lg">
                            {selectedJunction.name}{' '}
                            {selectedRouteView === 'main'
                              ? 'main congested path'
                              : selectedRouteView === 'alternate1'
                                ? 'best alternate route'
                                : 'moderate alternate route'}
                          </p>
                          <p className="text-[#94A3B8] mt-2 text-sm">
                            Only the selected signal route is shown on the map, so alternate paths can be suggested one at a time.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
                        <h3 className="text-lg mb-4">AI Suggested Alternate Routes</h3>
                        <div className="space-y-4">
                          <div className="p-4 bg-[#0F172A] border border-[#10B981]/30 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[#10B981] font-semibold">Best Alternative (Bypass 1)</span>
                              <span className="text-xs bg-[#10B981]/10 text-[#10B981] px-2 py-1 rounded-full">-12 mins</span>
                            </div>
                            <p className="text-[#94A3B8] text-sm leading-relaxed mb-3">
                              Take the inner ring road via {selectedJunction.name.split(' ')[0]} tech park. This avoids the current 45-minute congestion entirely.
                            </p>
                            <div className="flex flex-wrap gap-2">
                               <span className="text-xs text-[#94A3B8] border border-[#334155] bg-[#0F172A] px-2 py-1 rounded-md">Moderate Traffic</span>
                               <span className="text-xs text-[#94A3B8] border border-[#334155] bg-[#0F172A] px-2 py-1 rounded-md">Smooth Flow</span>
                            </div>
                          </div>
                          <div className="p-4 bg-[#0F172A] border border-[#F59E0B]/30 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[#F59E0B] font-semibold">Moderate Alternative (Bypass 2)</span>
                              <span className="text-xs bg-[#F59E0B]/10 text-[#F59E0B] px-2 py-1 rounded-full">-5 mins</span>
                            </div>
                            <p className="text-[#94A3B8] text-sm leading-relaxed mb-3">
                              Travel through the residential corridor parallel to {selectedJunction.name}. Beware of potential slow-downs near school zones.
                            </p>
                            <div className="flex flex-wrap gap-2">
                               <span className="text-xs text-[#94A3B8] border border-[#334155] bg-[#0F172A] px-2 py-1 rounded-md">School Zone</span>
                               <span className="text-xs text-[#94A3B8] border border-[#334155] bg-[#0F172A] px-2 py-1 rounded-md">Narrow Roads</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-[#0EA5E9] animate-pulse" />
                          <h3 className="text-lg">Dynamic Routing Algorithm</h3>
                        </div>
                        <p className="text-[#94A3B8] text-sm leading-relaxed">FlowIQ intelligently calculates these paths by combining real-time node congestion data with historical traffic patterns near {selectedJunction.name}.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {dashboardTab === 'surge' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl mb-2">Surge Prediction</h2>
                    <p className="text-[#94A3B8]">Festival and event-based traffic forecasting</p>
                  </div>
                  <SurgeBadge event="Pongal Festival" confidence={87} />
                </div>

                {/* Calendar Heatmap */}
                <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
                  <h3 className="text-lg mb-4">Next 12 Weeks Forecast</h3>
                  <CalendarHeatmap data={heatmapData} />
                </div>

                {/* Upcoming Events */}
                <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
                  <h3 className="text-lg mb-4">Upcoming High-Traffic Events</h3>
                  <div className="space-y-3">
                    {[
                      { date: 'Jan 14-16', event: 'Pongal Festival', confidence: 87, surge: 90 },
                      { date: 'Jan 26', event: 'Republic Day', confidence: 72, surge: 65 },
                      { date: 'Feb 21', event: 'Diwali', confidence: 92, surge: 95 },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 bg-[#0F172A] rounded-lg border border-[#334155]"
                      >
                        <div>
                          <p className="text-white mb-1">{item.event}</p>
                          <p className="text-[#94A3B8] text-sm">{item.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#F59E0B] mb-1">+{item.surge}% surge</p>
                          <p className="text-[#94A3B8] text-sm">{item.confidence}% confidence</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Actions */}
                <div className="bg-[#1E293B] border border-[#0EA5E9]/30 rounded-lg p-6">
                  <h3 className="text-lg mb-4 flex items-center gap-2">
                    <BarChart3 size={20} className="text-[#0EA5E9]" />
                    Recommended Pre-Signal Plans
                  </h3>
                  <ul className="space-y-2 text-[#94A3B8]">
                    <li className="flex items-start gap-2">
                      <span className="text-[#10B981]">•</span>
                      Increase green time on arterial roads by 30% during peak hours
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#10B981]">•</span>
                      Deploy additional traffic personnel at T Nagar and Anna Salai
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#10B981]">•</span>
                      Coordinate with public transport for extended bus frequencies
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {dashboardTab === 'hardware' && (
              <HardwareMonitor junctions={junctionsData} />
            )}
          </main>
        </div>
      )}

      {/* Mobile View */}
      {viewMode === 'mobile' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md h-[800px] bg-[#0F172A] rounded-3xl border-4 border-[#334155] overflow-hidden flex flex-col shadow-2xl">
            {/* Mobile Status Bar */}
            <div className="bg-[#1E293B] px-6 py-3 flex items-center justify-between text-sm">
              <span>9:41</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 border border-white rounded-sm" />
                <div className="w-4 h-4 border border-white rounded-sm" />
                <div className="w-4 h-4 border border-white rounded-sm" />
              </div>
            </div>

            {/* Mobile Content */}
            <div className="flex-1 overflow-y-auto">
              {mobileScreen === 'home' && (
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl mb-1">FlowIQ</h2>
                      <p className="text-[#94A3B8] text-sm">Chennai Traffic Live</p>
                    </div>
                    <div className="flex items-center gap-2 bg-[#1E293B] px-3 py-2 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                      <span className="text-sm text-[#94A3B8]">Live</span>
                    </div>
                  </div>

                  {/* Surge Alert */}
                  <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-[#F59E0B] mt-0.5" size={20} />
                      <div>
                        <p className="text-white mb-1">Festival Surge Alert</p>
                        <p className="text-[#94A3B8] text-sm">
                          Pongal traffic expected. Plan +20 min travel time.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Congestion Map */}
                  <div>
                    <h3 className="mb-3">Live Congestion</h3>
                    <div className="h-80">
                      <CongestionMap
                        junctions={junctionsData}
                        onJunctionClick={(id) => {
                          setSelectedJunction(junctionsData.find((j) => j.id === id)!);
                          setMobileScreen('junction');
                        }}
                      />
                    </div>
                  </div>

                  {/* Nearby Junctions */}
                  <div>
                    <h3 className="mb-3">Nearby Junctions</h3>
                    <div className="space-y-2">
                      {junctionsData.slice(0, 3).map((junction) => (
                        <div
                          key={junction.id}
                          onClick={() => {
                            setSelectedJunction(junction);
                            setMobileScreen('junction');
                          }}
                          className="bg-[#1E293B] border border-[#334155] rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-white">{junction.name}</p>
                            <div
                              className={`w-2 h-2 rounded-full ${
                                junction.status === 'critical'
                                  ? 'bg-[#EF4444]'
                                  : junction.status === 'warning'
                                  ? 'bg-[#F59E0B]'
                                  : 'bg-[#10B981]'
                              }`}
                            />
                          </div>
                          <p className="text-[#94A3B8] text-sm">{junction.vehicleCount} vehicles</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {mobileScreen === 'junction' && (
                <div className="p-4 space-y-4">
                  <button
                    onClick={() => setMobileScreen('home')}
                    className="flex items-center gap-2 text-[#8B949E] mb-4"
                  >
                    <Route size={16} />
                    Back to map
                  </button>

                  <div className="mb-6">
                    <h2 className="text-2xl mb-2">{selectedJunction.name}</h2>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          selectedJunction.status === 'critical'
                            ? 'bg-[#EF4444]'
                            : selectedJunction.status === 'warning'
                            ? 'bg-[#F59E0B]'
                            : 'bg-[#10B981]'
                        }`}
                      />
                      <span className="text-[#94A3B8] capitalize">{selectedJunction.status}</span>
                    </div>
                  </div>

                  {/* Vehicle Count */}
                  <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[#94A3B8]">Total Vehicles</span>
                      <Car className="text-[#0EA5E9]" size={20} />
                    </div>
                    <p className="text-4xl mb-2">{selectedJunction.vehicleCount}</p>
                    <p className="text-[#94A3B8] text-sm">Last updated: just now</p>
                  </div>

                  {/* RL Signal Timings */}
                  <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
                    <h3 className="mb-2">Adaptive Signal Timing</h3>
                    <p className="text-[#94A3B8] text-xs mb-4">Updates every 3s based on ultrasonic sensors</p>
                    <SignalTimingBar
                      laneA={{ name: 'Lane A (N-S)', time: laneATime }}
                      laneB={{ name: 'Lane B (E-W)', time: laneBTime }}
                    />
                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="text-[#94A3B8]">RL Algorithm Active</span>
                      <span className="text-[#10B981]">Auto-adjusting</span>
                    </div>
                  </div>

                  {/* Queue Lengths */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
                      <p className="text-[#94A3B8] text-sm mb-2">Queue (Lane A)</p>
                      <p className="text-2xl">{queueLaneA}</p>
                      <p className="text-[#94A3B8] text-sm">vehicles</p>
                      <div className="mt-2 h-1 bg-[#0F172A] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0EA5E9] transition-all duration-500"
                          style={{ width: `${Math.min((queueLaneA / 50) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
                      <p className="text-[#94A3B8] text-sm mb-2">Queue (Lane B)</p>
                      <p className="text-2xl">{queueLaneB}</p>
                      <p className="text-[#94A3B8] text-sm">vehicles</p>
                      <div className="mt-2 h-1 bg-[#0F172A] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#F59E0B] transition-all duration-500"
                          style={{ width: `${Math.min((queueLaneB / 50) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Alternate Routes */}
                  <div className="bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Route className="text-[#0EA5E9] mt-0.5" size={20} />
                      <div>
                        <p className="text-white mb-1">Alternate Route Available</p>
                        <p className="text-[#94A3B8] text-sm">
                          Use Sardar Patel Rd to save 8 minutes
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {mobileScreen === 'emergency' && (
                <div className="p-4 space-y-6">
                  <div className="text-center mb-8 mt-12">
                    <div className="bg-[#EF4444]/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Siren className="text-[#EF4444]" size={48} />
                    </div>
                    <h2 className="text-2xl mb-2">Emergency Mode</h2>
                    <p className="text-[#94A3B8]">
                      Activate green wave corridor for emergency vehicles
                    </p>
                  </div>

                  {/* Route Info */}
                  <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 space-y-4">
                    <div>
                      <p className="text-[#94A3B8] text-sm mb-1">Current Location</p>
                      <p className="text-white">Anna Salai × Mount Rd</p>
                    </div>
                    <div>
                      <p className="text-[#94A3B8] text-sm mb-1">Green Wave Corridor</p>
                      <p className="text-white">6 junctions on route</p>
                    </div>
                    <div>
                      <p className="text-[#94A3B8] text-sm mb-1">Estimated Clearance</p>
                      <p className="text-[#10B981]">4.2 minutes faster</p>
                    </div>
                  </div>

                  {/* Emergency Button */}
                  <EmergencyButton />

                  <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl p-4">
                    <p className="text-[#F59E0B] text-sm">
                      ⚠️ Only use for genuine emergencies. Misuse will be reported to authorities.
                    </p>
                  </div>

                  {/* Visual Route */}
                  <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
                    <h3 className="mb-4">Green Wave Route</h3>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex-1">
                          <div className="w-full h-2 bg-[#10B981]/20 rounded-full overflow-hidden">
                            <div className="w-full h-full bg-[#10B981] animate-pulse" />
                          </div>
                          <p className="text-[#94A3B8] text-xs text-center mt-1">J{i}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Bottom Nav */}
            <div className="bg-[#1E293B] border-t border-[#334155] px-6 py-4 flex justify-around">
              <button
                onClick={() => setMobileScreen('home')}
                className={`flex flex-col items-center gap-1 ${
                  mobileScreen === 'home' ? 'text-[#10B981]' : 'text-[#94A3B8]'
                }`}
              >
                <Home size={24} />
                <span className="text-xs">Home</span>
              </button>
              <button
                onClick={() => setMobileScreen('junction')}
                className={`flex flex-col items-center gap-1 ${
                  mobileScreen === 'junction' ? 'text-[#10B981]' : 'text-[#94A3B8]'
                }`}
              >
                <MapPin size={24} />
                <span className="text-xs">Junction</span>
              </button>
              <button
                onClick={() => setMobileScreen('emergency')}
                className={`flex flex-col items-center gap-1 ${
                  mobileScreen === 'emergency' ? 'text-[#EF4444]' : 'text-[#94A3B8]'
                }`}
              >
                <Siren size={24} />
                <span className="text-xs">Emergency</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}