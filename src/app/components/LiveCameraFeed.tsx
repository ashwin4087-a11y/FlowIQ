import { useEffect, useMemo, useRef, useState } from 'react';
import { Car, Truck, Bike } from 'lucide-react';

interface Vehicle {
  id: number;
  type: 'car' | 'truck' | 'bike';
  lane: 'A' | 'B';
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  direction: 'forward' | 'backward';
}

const vehicleTypes: Array<'car' | 'truck' | 'bike'> = ['car', 'car', 'car', 'truck', 'bike'];

const laneBounds = {
  A: { minX: 12, maxX: 32 },
  B: { minX: 58, maxX: 78 },
};

const typeStyles: Record<Vehicle['type'], string> = {
  car: 'bg-[#111827]',
  truck: 'bg-[#111827]',
  bike: 'bg-[#111827]',
};

const vehicleSprites: Record<Vehicle['type'], string> = {
  car: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 48'><defs><linearGradient id='carGrad' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%230EA5E9'/><stop offset='100%' stop-color='%230284C7'/></linearGradient><linearGradient id='carGlass' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%23ffffff' stop-opacity='0.8'/><stop offset='100%' stop-color='%23000000' stop-opacity='0.1'/></linearGradient></defs><g filter='url(%23shadow)'><rect x='10' y='18' width='100' height='16' rx='6' ry='6' fill='url(%23carGrad)'/><path d='M26 18 Q38 10 56 12 Q74 14 84 18' fill='url(%23carGrad)'/><rect x='30' y='16' width='30' height='12' rx='4' ry='4' fill='url(%23carGlass)'/><rect x='60' y='16' width='18' height='10' rx='3' ry='3' fill='url(%23carGlass)'/><circle cx='30' cy='38' r='6' fill='%23000000'/><circle cx='90' cy='38' r='6' fill='%23000000'/><circle cx='30' cy='38' r='3' fill='%23ffffff'/><circle cx='90' cy='38' r='3' fill='%23ffffff'/><path d='M10 24 H20' stroke='%23000000' stroke-width='2' opacity='0.35'/><path d='M100 24 H110' stroke='%23000000' stroke-width='2' opacity='0.35'/></g></svg>",
  truck: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 50'><defs><linearGradient id='truckCab' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%2360A5FA'/><stop offset='100%' stop-color='%230284C7'/></linearGradient><linearGradient id='truckBody' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%2360A5FA'/><stop offset='100%' stop-color='%230284C7'/></linearGradient><linearGradient id='truckGlass' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%23ffffff' stop-opacity='0.8'/><stop offset='100%' stop-color='%23000000' stop-opacity='0.1'/></linearGradient></defs><g><rect x='10' y='22' width='90' height='18' rx='5' ry='5' fill='url(%23truckBody)'/><rect x='102' y='14' width='28' height='18' rx='4' ry='4' fill='url(%23truckCab)'/><path d='M10 22 L20 14 H40 L50 22' fill='url(%23truckCab)'/><rect x='108' y='16' width='18' height='10' rx='2' ry='2' fill='url(%23truckGlass)'/><circle cx='28' cy='44' r='6' fill='%23000000'/><circle cx='62' cy='44' r='6' fill='%23000000'/><circle cx='102' cy='44' r='6' fill='%23000000'/><circle cx='28' cy='44' r='3' fill='%23ffffff'/><circle cx='62' cy='44' r='3' fill='%23ffffff'/><circle cx='102' cy='44' r='3' fill='%23ffffff'/></g></svg>",
  bike: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 48'><defs><linearGradient id='bikeGrad' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%23FBBF24'/><stop offset='100%' stop-color='%23D97706'/></linearGradient><linearGradient id='bikeMetal' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%23ffffff' stop-opacity='0.9'/><stop offset='100%' stop-color='%23000000' stop-opacity='0.25'/></linearGradient></defs><g><circle cx='18' cy='34' r='10' fill='%23000000'/><circle cx='18' cy='34' r='4' fill='%23ffffff'/><circle cx='62' cy='34' r='10' fill='%23000000'/><circle cx='62' cy='34' r='4' fill='%23ffffff'/><path d='M18 34 L32 22 L44 24 L62 34' stroke='url(%23bikeMetal)' stroke-width='4' fill='none'/><path d='M32 22 L35 12 L42 14' stroke='url(%23bikeMetal)' stroke-width='4' fill='none'/><path d='M44 24 L50 18' stroke='url(%23bikeMetal)' stroke-width='4' fill='none'/><circle cx='52' cy='16' r='4' fill='%23FBBF24'/><path d='M20 26 L28 22' stroke='%23FBBF24' stroke-width='3'/></g></svg>"
};

const getVehicleTypesForSignal = (signalId: string): Array<'car' | 'truck' | 'bike'> => {
  const hash = signalId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const seed = hash % 3;
  if (seed === 0) return ['car', 'car', 'car', 'truck', 'bike'];
  if (seed === 1) return ['truck', 'car', 'car', 'bike', 'bike'];
  return ['bike', 'car', 'truck', 'car', 'car'];
};

const laneStopLine = {
  A: 72,
  B: 22,
};

const laneQueueGap = 10;

const createVehicle = (id: number, lane: 'A' | 'B', signalId: string): Vehicle => {
  const types = getVehicleTypesForSignal(signalId);
  const type = types[Math.floor(Math.random() * types.length)];
  const { minX, maxX } = laneBounds[lane];

  return {
    id,
    type,
    lane,
    x: minX + Math.random() * (maxX - minX),
    y: lane === 'A' ? -14 - Math.random() * 20 : 110 + Math.random() * 20,
    width: type === 'truck' ? 12 : type === 'car' ? 10 : 8,
    height: type === 'truck' ? 8 : type === 'car' ? 6 : 5,
    speed: 20 + (signalId.charCodeAt(0) % 10) + Math.floor(Math.random() * 16),
    direction: lane === 'A' ? 'forward' : 'backward',
  };
};

export function LiveCameraFeed({ signalId, activeGreenLane }: { signalId: string; activeGreenLane: 'A' | 'B' }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [timestamp, setTimestamp] = useState(new Date());
  const nextVehicleId = useRef(1);

  useEffect(() => {
    // Reset vehicles for new signal
    nextVehicleId.current = 1;
    const initial: Vehicle[] = [];
    for (let i = 0; i < 4; i += 1) {
      initial.push({ ...createVehicle(nextVehicleId.current++, 'A', signalId), y: -22 + i * 22 });
    }
    for (let i = 0; i < 4; i += 1) {
      initial.push({ ...createVehicle(nextVehicleId.current++, 'B', signalId), y: 120 - i * 22 });
    }
    setVehicles(initial);

    const timestampInterval = setInterval(() => {
      setTimestamp(new Date());
    }, 1000);

    const animationInterval = setInterval(() => {
      setVehicles((prevVehicles) => {
        const laneAVehicles = prevVehicles
          .filter((vehicle) => vehicle.lane === 'A')
          .sort((a, b) => b.y - a.y);
        const laneBVehicles = prevVehicles
          .filter((vehicle) => vehicle.lane === 'B')
          .sort((a, b) => a.y - b.y);

        const updateLane = (vehicles: Vehicle[], lane: 'A' | 'B') => {
          const isGreen = activeGreenLane === lane;
          const stopY = laneStopLine[lane];
          return vehicles.map((vehicle, index) => {
            const previous = vehicles[index - 1];
            const maxMovement = vehicle.speed / 60;
            const isForward = lane === 'A';
            const nextY = isForward ? vehicle.y + maxMovement : vehicle.y - maxMovement;

            if (isGreen) {
              const desiredY = nextY;
              if (!previous) {
                return {
                  ...vehicle,
                  y: desiredY,
                };
              }
              const gapY = isForward ? previous.y - laneQueueGap : previous.y + laneQueueGap;
              if (isForward && desiredY + vehicle.height >= gapY) {
                return { ...vehicle, y: Math.min(gapY - vehicle.height, desiredY) };
              }
              if (!isForward && desiredY <= gapY) {
                return { ...vehicle, y: Math.max(gapY + vehicle.height, desiredY) };
              }
              return { ...vehicle, y: desiredY };
            }

            const queueY = isForward ? stopY - index * laneQueueGap : stopY + index * laneQueueGap;
            if (isForward) {
              return { ...vehicle, y: Math.min(nextY, queueY) };
            }
            return { ...vehicle, y: Math.max(nextY, queueY) };
          });
        };

        const updatedA = updateLane(laneAVehicles, 'A');
        const updatedB = updateLane(laneBVehicles, 'B');

        return [...updatedA, ...updatedB].filter((vehicle) => (vehicle.direction === 'forward' ? vehicle.y < 115 : vehicle.y > -18));
      });
    }, 60);

    const spawnIntervalTime = 1500 + (signalId.charCodeAt(0) % 5) * 200; // Vary between 1500-2500ms

    const spawnInterval = setInterval(() => {
      setVehicles((prevVehicles) => {
        if (prevVehicles.length >= 16) return prevVehicles;

        const laneACount = prevVehicles.filter((v) => v.lane === 'A').length;
        const laneBCount = prevVehicles.filter((v) => v.lane === 'B').length;
        const selectedLane: 'A' | 'B' = laneACount > laneBCount ? 'B' : 'A';
        const entryY = selectedLane === 'A' ? -14 : 110;

        const hasSpace = !prevVehicles.some(
          (v) => v.lane === selectedLane && Math.abs(v.y - entryY) < 16
        );
        if (!hasSpace) return prevVehicles;

        return [...prevVehicles, createVehicle(nextVehicleId.current++, selectedLane, signalId)];
      });
    }, spawnIntervalTime);

    return () => {
      clearInterval(timestampInterval);
      clearInterval(animationInterval);
      clearInterval(spawnInterval);
    };
  }, [signalId, activeGreenLane]);

  const vehicleCounts = useMemo(
    () => ({
      car: vehicles.filter((v) => v.type === 'car').length,
      truck: vehicles.filter((v) => v.type === 'truck').length,
      bike: vehicles.filter((v) => v.type === 'bike').length,
      laneA: vehicles.filter((v) => v.lane === 'A').length,
      laneB: vehicles.filter((v) => v.lane === 'B').length,
    }),
    [vehicles]
  );

  const avgSpeed = useMemo(
    () =>
      vehicles.length > 0
        ? Math.round(vehicles.reduce((sum, v) => sum + v.speed, 0) / vehicles.length)
        : 0,
    [vehicles]
  );

  const laneAIsGreen = activeGreenLane === 'A';
  const laneBIsGreen = activeGreenLane === 'B';

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg">Live Camera Feed</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
          <span className="text-sm text-[#94A3B8] font-mono">
            {timestamp.toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>
      </div>

      <div className="relative aspect-video bg-[#0F172A] rounded-lg overflow-hidden border border-[#334155]">
        <div className="absolute inset-0 bg-[#111827]" />
        <div className="absolute inset-y-0 left-[18%] w-px bg-white/10" />
        <div className="absolute inset-y-0 left-[42%] w-px bg-white/10" />
        <div className="absolute inset-y-0 left-[58%] w-px bg-white/10" />
        <div className="absolute inset-y-0 left-[82%] w-px bg-white/10" />

        <div className="absolute inset-x-0 top-4 flex justify-between px-4 text-xs text-[#CBD5E1]">
          <span className="bg-[#0F172A]/90 px-3 py-1 rounded-full border border-[#334155]">Lane A ↓ Southbound</span>
          <span className="bg-[#0F172A]/90 px-3 py-1 rounded-full border border-[#334155]">Lane B ↑ Northbound</span>
        </div>

        <div className={`absolute left-[10%] top-[78%] w-[20%] h-0.5 border-t border-white/10 ${laneAIsGreen ? 'bg-[#10B981]/80' : 'bg-[#EF4444]/80'}`} />
        <div className={`absolute left-[56%] top-[22%] w-[20%] h-0.5 border-t border-white/10 ${laneBIsGreen ? 'bg-[#10B981]/80' : 'bg-[#EF4444]/80'}`} />
        <div className={`absolute left-[10%] top-[80%] w-[20%] h-8 rounded-full bg-[#0F172A]/90 border flex items-center justify-center text-[10px] uppercase tracking-[0.12em] ${laneAIsGreen ? 'border-[#10B981] text-[#10B981]' : 'border-[#EF4444] text-[#EF4444]'}`}>
          {laneAIsGreen ? 'GREEN' : 'RED'}
        </div>
        <div className={`absolute left-[56%] top-[12%] w-[20%] h-8 rounded-full bg-[#0F172A]/90 border flex items-center justify-center text-[10px] uppercase tracking-[0.12em] ${laneBIsGreen ? 'border-[#10B981] text-[#10B981]' : 'border-[#EF4444] text-[#EF4444]'}`}>
          {laneBIsGreen ? 'GREEN' : 'RED'}
        </div>

        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="absolute transition-all duration-75 ease-linear"
            style={{
              left: `${vehicle.x}%`,
              top: `${vehicle.y}%`,
              width: `${vehicle.width}%`,
              height: `${vehicle.height}%`,
              transform: vehicle.direction === 'backward' ? 'rotate(180deg)' : 'none',
            }}
          >
            <img
              src={vehicleSprites[vehicle.type]}
              alt={vehicle.type}
              className="w-full h-full object-contain"
            />
          </div>
        ))}

        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex gap-3">
            <div className="bg-[#0F172A]/90 border border-[#0EA5E9]/50 px-3 py-1.5 rounded flex items-center gap-2">
              <Car size={14} className="text-[#0EA5E9]" />
              <span className="text-sm font-mono">{vehicleCounts.car}</span>
            </div>
            <div className="bg-[#0F172A]/90 border border-[#60A5FA]/50 px-3 py-1.5 rounded flex items-center gap-2">
              <Truck size={14} className="text-[#60A5FA]" />
              <span className="text-sm font-mono">{vehicleCounts.truck}</span>
            </div>
            <div className="bg-[#0F172A]/90 border border-[#FBBF24]/50 px-3 py-1.5 rounded flex items-center gap-2">
              <Bike size={14} className="text-[#FBBF24]" />
              <span className="text-sm font-mono">{vehicleCounts.bike}</span>
            </div>
          </div>

          <div className="bg-[#0F172A]/90 border border-[#334155] px-3 py-1.5 rounded">
            <span className="text-xs text-[#94A3B8]">Avg Speed: </span>
            <span className="text-sm font-mono text-white">{avgSpeed} km/h</span>
          </div>
        </div>

        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#0F172A]/90 border border-[#10B981]/50 px-3 py-1 rounded-full flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-xs font-mono text-[#10B981]">AI DETECTION ACTIVE</span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-1">
            <span>Lane A Occupancy</span>
            <span className="font-mono">{vehicleCounts.laneA} vehicles</span>
          </div>
          <div className="h-2 bg-[#0F172A] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                vehicleCounts.laneA > 6
                  ? 'bg-[#EF4444]'
                  : vehicleCounts.laneA > 4
                  ? 'bg-[#F59E0B]'
                  : 'bg-[#10B981]'
              }`}
              style={{ width: `${Math.min(vehicleCounts.laneA * 10, 100)}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-1">
            <span>Lane B Occupancy</span>
            <span className="font-mono">{vehicleCounts.laneB} vehicles</span>
          </div>
          <div className="h-2 bg-[#0F172A] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                vehicleCounts.laneB > 6
                  ? 'bg-[#EF4444]'
                  : vehicleCounts.laneB > 4
                  ? 'bg-[#F59E0B]'
                  : 'bg-[#10B981]'
              }`}
              style={{ width: `${Math.min(vehicleCounts.laneB * 10, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
