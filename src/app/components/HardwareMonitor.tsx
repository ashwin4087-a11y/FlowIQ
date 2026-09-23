import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Car,
  Truck,
  Bike,
  Cpu,
  Camera,
  Waves,
  CheckCircle2,
  XCircle,
  ArrowDown,
  ArrowUp,
  Circle,
} from 'lucide-react';
import { HardwareSensor } from './HardwareSensor';
import { LiveCameraFeed } from './LiveCameraFeed';
import { VehicleDetection } from './VehicleDetection';

type VehicleType = 'car' | 'truck' | 'bike';

type SignalStatus = 'normal' | 'warning' | 'critical';

interface JunctionInfo {
  id: string;
  name: string;
  status: SignalStatus;
}

interface LaneVehicle {
  id: number;
  type: VehicleType;
  confidence: number;
  lane: 'A' | 'B';
}

interface SignalState extends JunctionInfo {
  laneA: LaneVehicle[];
  laneB: LaneVehicle[];
  lastDetections: LaneVehicle[];
  activeGreen: 'A' | 'B';
}

const vehicleTypes: VehicleType[] = ['car', 'car', 'car', 'truck', 'bike'];

const typeTitle: Record<VehicleType, string> = {
  car: 'Car',
  truck: 'Truck',
  bike: 'Bike',
};

const statusColors: Record<SignalStatus, string> = {
  normal: 'border-[#10B981] text-[#10B981]',
  warning: 'border-[#F59E0B] text-[#F59E0B]',
  critical: 'border-[#EF4444] text-[#EF4444]',
};

const getVehicleIcon = (type: VehicleType) => {
  if (type === 'truck') return Truck;
  if (type === 'bike') return Bike;
  return Car;
};

const makeVehicle = (id: number, lane: 'A' | 'B'): LaneVehicle => {
  const type = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
  const confidence = Number((0.70 + Math.random() * 0.28).toFixed(2));
  return { id, type, confidence, lane };
};

const buildInitialSignal = (junction: JunctionInfo, idCounter: { current: number }): SignalState => {
  const aCount = 3 + Math.floor(Math.random() * 4);
  const bCount = 2 + Math.floor(Math.random() * 5);

  return {
    ...junction,
    laneA: Array.from({ length: aCount }, () => makeVehicle(idCounter.current++, 'A')),
    laneB: Array.from({ length: bCount }, () => makeVehicle(idCounter.current++, 'B')),
    lastDetections: [],
    activeGreen: Math.random() > 0.5 ? 'A' : 'B',
  };
};

const buildSignals = (junctions: JunctionInfo[]): SignalState[] => {
  const idCounter = { current: 1 };
  return junctions.map((junction) => buildInitialSignal(junction, idCounter));
};

export function HardwareMonitor({ junctions }: { junctions: JunctionInfo[] }) {
  const [signals, setSignals] = useState<SignalState[]>(() => buildSignals(junctions));
  const [activeSignalId, setActiveSignalId] = useState(junctions[0]?.id ?? '');
  const vehicleId = useRef(1000);

  useEffect(() => {
    setSignals(buildSignals(junctions));
    setActiveSignalId(junctions[0]?.id ?? '');
  }, [junctions]);

  useEffect(() => {
    const signalTimings: Record<string, { interval: number; lastSwitch: number }> = {};

    const interval = setInterval(() => {
      setSignals((prev) =>
        prev.map((signal) => {
          const laneA = [...signal.laneA];
          const laneB = [...signal.laneB];

          // Remove exiting vehicles (on green)
          if (signal.activeGreen === 'A' && laneA.length > 1 && Math.random() > 0.6) laneA.shift();
          if (signal.activeGreen === 'B' && laneB.length > 1 && Math.random() > 0.6) laneB.shift();

          // Add new vehicles
          if (laneA.length < 8 && Math.random() > 0.3) laneA.push(makeVehicle(vehicleId.current++, 'A'));
          if (laneB.length < 7 && Math.random() > 0.3) laneB.push(makeVehicle(vehicleId.current++, 'B'));

          const newDetections = [
            ...laneA.slice(-2),
            ...laneB.slice(-2),
            ...signal.lastDetections,
          ]
            .map((vehicle) => vehicle)
            .filter((value, index, self) => self.findIndex((v) => v.id === value.id) === index)
            .slice(0, 8);

          // Realistic signal timing: 38 seconds green, then switch
          if (!signalTimings[signal.id]) {
            signalTimings[signal.id] = { interval: 0, lastSwitch: Date.now() };
          }

          const timeSinceSwitch = Date.now() - signalTimings[signal.id].lastSwitch;
          let activeGreen = signal.activeGreen;

          if (timeSinceSwitch > 38000) {
            // Switch lane every 38 seconds
            activeGreen = signal.activeGreen === 'A' ? 'B' : 'A';
            signalTimings[signal.id].lastSwitch = Date.now();
          }

          return {
            ...signal,
            laneA,
            laneB,
            lastDetections: newDetections,
            activeGreen,
          };
        })
      );
    }, 1000); // Update every 1 second to check timing

    return () => clearInterval(interval);
  }, []);

  const selectedSignal = useMemo(
    () => signals.find((signal) => signal.id === activeSignalId) || signals[0],
    [signals, activeSignalId]
  );

  if (!selectedSignal) {
    return null;
  }

  const totalVehicles = selectedSignal.laneA.length + selectedSignal.laneB.length;
  const laneAColor = selectedSignal.laneA.length > 6 ? '#EF4444' : selectedSignal.laneA.length > 4 ? '#F59E0B' : '#10B981';
  const laneBColor = selectedSignal.laneB.length > 6 ? '#EF4444' : selectedSignal.laneB.length > 4 ? '#F59E0B' : '#10B981';
  const laneABar = Math.min((selectedSignal.laneA.length / 8) * 100, 100);
  const laneBBar = Math.min((selectedSignal.laneB.length / 7) * 100, 100);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1.1fr_1fr]">
        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[#94A3B8] text-sm">Selected Signal</p>
              <h3 className="text-xl">{selectedSignal.name}</h3>
            </div>
            <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusColors[selectedSignal.status]}`}>
              {selectedSignal.status.toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-4">
              <p className="text-[#94A3B8] text-sm">Lane A Queue</p>
              <p className="text-3xl font-semibold">{selectedSignal.laneA.length}</p>
              <div className="mt-3 h-2 bg-[#0F172A] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${laneABar}%`, backgroundColor: laneAColor }} />
              </div>
            </div>
            <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-4">
              <p className="text-[#94A3B8] text-sm">Lane B Queue</p>
              <p className="text-3xl font-semibold">{selectedSignal.laneB.length}</p>
              <div className="mt-3 h-2 bg-[#0F172A] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${laneBBar}%`, backgroundColor: laneBColor }} />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-3 text-center">
              <p className="text-[#94A3B8] text-xs">Total Vehicles</p>
              <p className="text-xl font-semibold">{totalVehicles}</p>
            </div>
            <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-3 text-center">
              <p className="text-[#94A3B8] text-xs">Active Green</p>
              <p className="text-xl font-semibold">Lane {selectedSignal.activeGreen}</p>
            </div>
            <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-3 text-center">
              <p className="text-[#94A3B8] text-xs">Detection Loop</p>
              <p className="text-xl font-semibold">{selectedSignal.lastDetections[0]?.type.toUpperCase() || '—'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[#94A3B8] text-sm">Signal Access</p>
                <h3 className="text-xl">Choose a Signal</h3>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
                <Circle className="text-[#10B981]" size={12} /> Online
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {signals.map((signal) => (
                <button
                  key={signal.id}
                  onClick={() => setActiveSignalId(signal.id)}
                  className={`rounded-full px-4 py-2 border text-sm transition ${
                    signal.id === activeSignalId
                      ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
                      : 'border-[#334155] text-[#94A3B8] hover:border-[#10B981] hover:text-white'
                  }`}
                >
                  {signal.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <HardwareSensor icon={Cpu} label="ESP32 Controller" value="192.168.1.24" status="online" />
            <HardwareSensor icon={Camera} label="Camera Feed" value="1920×1080 @ 30fps" status="online" />
            <HardwareSensor icon={Waves} label="Ultrasonic Lane A" value={`${selectedSignal.laneA.length} vehicles`} status="online" />
            <HardwareSensor icon={Waves} label="Ultrasonic Lane B" value={`${selectedSignal.laneB.length} vehicles`} status="online" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg">Live Lane Visualization</h3>
              <p className="text-[#94A3B8] text-sm">Real-time lane motion and detection flow</p>
            </div>
            <div className="rounded-full bg-[#0F172A] px-3 py-1 text-xs text-[#10B981]">Live</div>
          </div>
          <LiveCameraFeed signalId={selectedSignal.id} activeGreenLane={selectedSignal.activeGreen} />
        </div>

        <VehicleDetection />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg">Lane A - Southbound</h3>
                <p className="text-[#94A3B8] text-sm">Vehicles arrive one after another in real-time</p>
              </div>
              <div className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: selectedSignal.activeGreen === 'A' ? '#10B981' : '#0F172A' }}>
                {selectedSignal.activeGreen === 'A' ? 'Green' : 'Red'}
              </div>
            </div>
            <div className="grid gap-3">
              {selectedSignal.laneA.slice(0, 6).map((vehicle, index) => {
                const Icon = getVehicleIcon(vehicle.type);
                const conf = Math.round(vehicle.confidence * 100);
                return (
                  <div key={vehicle.id} className="flex items-center justify-between gap-3 bg-[#0F172A] border border-[#334155] rounded-lg p-3 hover:border-l-2 hover:border-l-[#0EA5E9] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-[#0F172A] p-2 border border-[#334155]">
                        <Icon size={18} className={vehicle.type === 'truck' ? 'text-[#60A5FA]' : vehicle.type === 'bike' ? 'text-[#FBBF24]' : 'text-[#0EA5E9]'} />
                      </div>
                      <div>
                        <p className="text-sm">{typeTitle[vehicle.type]}</p>
                        <p className="text-xs text-[#94A3B8]">Detection {index + 1}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-mono ${ conf >= 80 ? 'text-[#10B981]' : conf >= 60 ? 'text-[#F59E0B]' : 'text-[#94A3B8]'}`}>{conf}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg">Lane B - Northbound</h3>
                <p className="text-[#94A3B8] text-sm">Distinct arrival pattern, separate queue</p>
              </div>
              <div className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: selectedSignal.activeGreen === 'B' ? '#10B981' : '#0F172A' }}>
                {selectedSignal.activeGreen === 'B' ? 'Green' : 'Red'}
              </div>
            </div>
            <div className="grid gap-3">
              {selectedSignal.laneB.slice(0, 6).map((vehicle, index) => {
                const Icon = getVehicleIcon(vehicle.type);
                const conf = Math.round(vehicle.confidence * 100);
                return (
                  <div key={vehicle.id} className="flex items-center justify-between gap-3 bg-[#0F172A] border border-[#334155] rounded-lg p-3 hover:border-l-2 hover:border-l-[#0EA5E9] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-[#0F172A] p-2 border border-[#334155]">
                        <Icon size={18} className={vehicle.type === 'truck' ? 'text-[#60A5FA]' : vehicle.type === 'bike' ? 'text-[#FBBF24]' : 'text-[#0EA5E9]'} />
                      </div>
                      <div>
                        <p className="text-sm">{typeTitle[vehicle.type]}</p>
                        <p className="text-xs text-[#94A3B8]">Detection {index + 1}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-mono ${ conf >= 80 ? 'text-[#10B981]' : conf >= 60 ? 'text-[#F59E0B]' : 'text-[#94A3B8]'}`}>{conf}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg">Vehicle Detection Loop</h3>
                <p className="text-[#94A3B8] text-sm">Latest detected vehicles for this signal</p>
              </div>
              <div className="rounded-full bg-[#0F172A] px-3 py-1 text-xs text-[#10B981]">Live</div>
            </div>
            <div className="space-y-3">
              {selectedSignal.lastDetections.map((vehicle) => {
                const Icon = getVehicleIcon(vehicle.type);
                const conf = Math.round(vehicle.confidence * 100);
                return (
                  <div key={vehicle.id} className="flex items-center justify-between gap-3 bg-[#0F172A] border border-[#334155] rounded-lg p-3 hover:border-l-2 hover:border-l-[#0EA5E9] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-[#0F172A] p-2 border border-[#334155]">
                        <Icon size={18} className={vehicle.type === 'truck' ? 'text-[#60A5FA]' : vehicle.type === 'bike' ? 'text-[#FBBF24]' : 'text-[#0EA5E9]'} />
                      </div>
                      <div>
                        <p className="text-sm">{typeTitle[vehicle.type]}</p>
                        <p className="text-xs text-[#94A3B8]">Lane {vehicle.lane} · <span className={conf >= 80 ? 'text-[#10B981]' : conf >= 60 ? 'text-[#F59E0B]' : 'text-[#94A3B8]'}>{conf}% confidence</span></p>
                      </div>
                    </div>
                    <span className="text-xs text-[#94A3B8]">#{vehicle.id}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
            <h3 className="text-lg mb-4">Detection summary</h3>
            <div className="space-y-3">
              {(['car', 'truck', 'bike'] as VehicleType[]).map((type) => {
                const count = selectedSignal.laneA.filter((v) => v.type === type).length + selectedSignal.laneB.filter((v) => v.type === type).length;
                const Icon = getVehicleIcon(type);
                return (
                  <div key={type} className="flex items-center justify-between gap-3 bg-[#0F172A] border border-[#334155] rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-[#0F172A] p-2 border border-[#334155]">
                        <Icon size={18} className={type === 'truck' ? 'text-[#60A5FA]' : type === 'bike' ? 'text-[#FBBF24]' : 'text-[#0EA5E9]'} />
                      </div>
                      <div>
                        <p className="text-sm">{typeTitle[type]}s</p>
                        <p className="text-xs text-[#94A3B8]">Detected in active queue</p>
                      </div>
                    </div>
                    <p className="text-xl font-semibold">{count}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
