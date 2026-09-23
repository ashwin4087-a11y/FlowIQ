import type {
  SignalPhase,
  TrafficDensity,
  TrafficMode,
  VehicleMovement,
  VehicleSimState,
  VehicleState,
  VehicleType,
} from '../../src/types/flowiq';

export type SimSignalPhase = SignalPhase;

export interface SimVehicle {
  id: string;
  type: VehicleType;
  laneId: string;
  movement: VehicleMovement;
  pathIndex: number;
  pathT: number;
  speed: number;
  maxSpeed: number;
  state: VehicleSimState;
  priority: boolean;
}

export interface LaneSpawnConfig {
  laneId: string;
  direction: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
  movement: VehicleMovement;
}

const PATHS: Record<string, { x: number; z: number }[]> = {
  north_straight: [
    { x: -3.5, z: 28 },
    { x: -3.5, z: 8 },
    { x: -3.5, z: -28 },
  ],
  north_right: [
    { x: -3.5, z: 28 },
    { x: -3.5, z: 6 },
    { x: 8, z: 6 },
    { x: 28, z: 6 },
  ],
  south_straight: [
    { x: 3.5, z: -28 },
    { x: 3.5, z: -8 },
    { x: 3.5, z: 28 },
  ],
  east_straight: [
    { x: 28, z: -3.5 },
    { x: 8, z: -3.5 },
    { x: -28, z: -3.5 },
  ],
  west_straight: [
    { x: -28, z: 3.5 },
    { x: -8, z: 3.5 },
    { x: 28, z: 3.5 },
  ],
  emergency_east: [
    { x: 28, z: -1 },
    { x: 8, z: -1 },
    { x: -20, z: -1 },
  ],
};

const DENSITY_RATES: Record<TrafficDensity, number> = {
  LOW: 0.15,
  MEDIUM: 0.45,
  HIGH: 0.9,
};

const TYPES: VehicleType[] = ['CAR', 'CAR', 'MOTORCYCLE', 'BUS', 'TRUCK', 'CAR'];

function pathKey(laneId: string, movement: VehicleMovement) {
  if (movement === 'STRAIGHT') return `${laneId}_straight`;
  if (movement === 'RIGHT') return `${laneId}_right`;
  return `${laneId}_straight`;
}

function sampleOnPath(path: { x: number; z: number }[], t: number) {
  if (path.length < 2) return { x: 0, z: 0, heading: 0 };
  const seg = Math.min(path.length - 2, Math.floor(t * (path.length - 1)));
  const localT = t * (path.length - 1) - seg;
  const a = path[seg];
  const b = path[seg + 1];
  const x = a.x + (b.x - a.x) * localT;
  const z = a.z + (b.z - a.z) * localT;
  const heading = Math.atan2(b.x - a.x, b.z - a.z);
  return { x, z, heading };
}

function canMoveForPhase(phase: SimSignalPhase, laneId: string): boolean {
  if (phase === 'ALL_RED' || phase.includes('YELLOW')) return false;
  if (phase === 'NORTH_SOUTH_GREEN') return laneId === 'north' || laneId === 'south';
  if (phase === 'EAST_WEST_GREEN') return laneId === 'east' || laneId === 'west';
  return false;
}

export class TrafficSimulation {
  vehicles: SimVehicle[] = [];
  density: TrafficDensity = 'MEDIUM';
  trafficMode: TrafficMode = 'NORMAL';
  signalPhase: SimSignalPhase = 'EAST_WEST_GREEN';
  emergencyActive = false;
  private nextId = 1;
  private spawnCooldown = 0;
  private lanes: LaneSpawnConfig[] = [
    { laneId: 'north', direction: 'NORTH', movement: 'STRAIGHT' },
    { laneId: 'north', direction: 'NORTH', movement: 'RIGHT' },
    { laneId: 'south', direction: 'SOUTH', movement: 'STRAIGHT' },
    { laneId: 'east', direction: 'EAST', movement: 'STRAIGHT' },
    { laneId: 'west', direction: 'WEST', movement: 'STRAIGHT' },
  ];

  setDensity(d: TrafficDensity) {
    this.density = d;
  }

  setTrafficMode(m: TrafficMode) {
    this.trafficMode = m;
  }

  setSignalPhase(phase: SimSignalPhase) {
    this.signalPhase = phase;
  }

  spawnEmergency(type: 'AMBULANCE' | 'FIRE_TRUCK' = 'AMBULANCE') {
    this.emergencyActive = true;
    this.vehicles.push({
      id: `emg-${this.nextId++}`,
      type,
      laneId: 'east',
      movement: 'STRAIGHT',
      pathIndex: 0,
      pathT: 0,
      speed: 0,
      maxSpeed: 16,
      state: 'APPROACHING',
      priority: true,
    });
  }

  clearEmergency() {
    this.emergencyActive = false;
    this.vehicles = this.vehicles.filter((v) => !v.priority);
  }

  private spawnRandom() {
    const lane = this.lanes[Math.floor(Math.random() * this.lanes.length)];
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];
    this.vehicles.push({
      id: `v-${this.nextId++}`,
      type,
      laneId: lane.laneId,
      movement: lane.movement,
      pathIndex: 0,
      pathT: 0,
      speed: 2 + Math.random() * 2,
      maxSpeed: 6 + Math.random() * 4,
      state: 'APPROACHING',
      priority: false,
    });
  }

  tick(dt: number) {
    const rate = DENSITY_RATES[this.density] * (this.trafficMode === 'SURGE' ? 1.8 : 1);
    const cap = this.density === 'HIGH' ? 48 : this.density === 'MEDIUM' ? 28 : 14;
    this.spawnCooldown -= dt;
    if (this.spawnCooldown <= 0 && this.vehicles.length < cap) {
      this.spawnRandom();
      this.spawnCooldown = 1 / rate;
    }

    for (const v of this.vehicles) {
      const pk = v.priority ? 'emergency_east' : pathKey(v.laneId, v.movement);
      const path = PATHS[pk] ?? PATHS.east_straight;
      const stopLineT = 0.35;
      const allowed = v.priority || canMoveForPhase(this.signalPhase, v.laneId);
      const nearStop = v.pathT < stopLineT + 0.05;

      if (!allowed && nearStop && !v.priority) {
        v.speed = Math.max(0, v.speed - 12 * dt);
        v.state = v.speed < 0.2 ? 'STOPPED' : 'QUEUED';
      } else if (v.priority || allowed) {
        v.speed = Math.min(v.maxSpeed, v.speed + 8 * dt);
        v.state = v.pathT > 0.5 ? 'CROSSING' : 'ACCELERATING';
      }

      if (this.emergencyActive && !v.priority && v.pathT > 0.2 && v.pathT < 0.7) {
        v.speed = Math.min(v.speed, 1.5);
        v.state = 'STOPPED';
      }

      const dist = v.speed * dt * 0.04;
      v.pathT += dist;
      if (v.pathT >= 1) v.state = 'EXITING';
    }

    this.vehicles = this.vehicles.filter((v) => v.pathT < 1.05);
  }

  toVehicleStates(): VehicleState[] {
    return this.vehicles.map((v) => {
      const pk = v.priority ? 'emergency_east' : pathKey(v.laneId, v.movement);
      const path = PATHS[pk] ?? PATHS.east_straight;
      const p = sampleOnPath(path, Math.min(v.pathT, 1));
      return {
        id: v.id,
        type: v.type,
        lane: v.laneId,
        movement: v.movement,
        position: { x: p.x, y: 0.35, z: p.z },
        speed: v.speed,
        state: v.state,
        heading: p.heading,
      };
    });
  }

  metrics() {
    const lanes = ['north', 'south', 'east', 'west'] as const;
    const laneMetrics = lanes.map((id) => {
      const vs = this.vehicles.filter((v) => v.laneId === id);
      const queue = vs.filter((v) => v.state === 'STOPPED' || v.state === 'QUEUED').length;
      const avg = vs.length ? vs.reduce((a, b) => a + b.speed, 0) / vs.length : 0;
      const congestion: 'low' | 'moderate' | 'high' =
        queue > 6 ? 'high' : queue > 3 ? 'moderate' : 'low';
      return {
        id,
        direction: id.toUpperCase() as 'NORTH' | 'SOUTH' | 'EAST' | 'WEST',
        vehicleCount: vs.length,
        queueLength: queue,
        averageSpeedKmh: Math.round(avg * 8),
        congestionLevel: congestion,
      };
    });
    const vehicleCount = this.vehicles.length;
    const queueLength = laneMetrics.reduce((a, l) => a + l.queueLength, 0);
    const averageSpeedKmh =
      vehicleCount > 0
        ? Math.round(this.vehicles.reduce((a, v) => a + v.speed, 0) / vehicleCount * 8)
        : 0;
    const congestionLevel =
      queueLength > 12 ? 'high' : queueLength > 6 ? 'moderate' : ('low' as const);
    return {
      lanes: laneMetrics,
      vehicleCount,
      queueLength,
      averageSpeedKmh,
      congestionLevel,
    };
  }
}
