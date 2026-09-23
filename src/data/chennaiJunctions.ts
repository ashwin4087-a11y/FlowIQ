/**
 * Canonical Chennai junction list used across FlowIQ (legacy dashboard map, hardware monitor, digital twin UI).
 * Originally defined in `src/app/App.tsx` — keep IDs and names in sync here.
 *
 * Live 3D digital-twin telemetry is tied to the backend prototype junction in `server/services/flowiqState.js`.
 */

export type JunctionAlgorithm = 'Proportional RL' | 'Priority RL' | 'Hybrid RL';

export type JunctionStatus = 'critical' | 'warning' | 'normal';

export interface ChennaiJunction {
  id: string;
  name: string;
  vehicleCount: number;
  status: JunctionStatus;
  lat: number;
  lng: number;
  algorithm: JunctionAlgorithm;
  cycleDuration: number;
  baseLaneA: number;
  baseLaneB: number;
}

export const CHENNAI_JUNCTIONS: ChennaiJunction[] = [
  {
    id: '1',
    name: 'Anna Nagar Junction',
    vehicleCount: 247,
    status: 'critical',
    lat: 100,
    lng: 280,
    algorithm: 'Priority RL',
    cycleDuration: 140,
    baseLaneA: 32,
    baseLaneB: 18,
  },
  {
    id: '2',
    name: 'Nungambakkam Signal',
    vehicleCount: 189,
    status: 'warning',
    lat: 180,
    lng: 240,
    algorithm: 'Proportional RL',
    cycleDuration: 130,
    baseLaneA: 24,
    baseLaneB: 22,
  },
  {
    id: '3',
    name: 'Kodambakkam Circle',
    vehicleCount: 142,
    status: 'normal',
    lat: 200,
    lng: 160,
    algorithm: 'Hybrid RL',
    cycleDuration: 120,
    baseLaneA: 18,
    baseLaneB: 14,
  },
  {
    id: '4',
    name: 'Vadapalani Junction',
    vehicleCount: 203,
    status: 'warning',
    lat: 150,
    lng: 120,
    algorithm: 'Proportional RL',
    cycleDuration: 135,
    baseLaneA: 28,
    baseLaneB: 20,
  },
  {
    id: '5',
    name: 'Porur Toll Plaza',
    vehicleCount: 221,
    status: 'critical',
    lat: 180,
    lng: 50,
    algorithm: 'Priority RL',
    cycleDuration: 145,
    baseLaneA: 34,
    baseLaneB: 24,
  },
  {
    id: '6',
    name: 'Guindy Circle',
    vehicleCount: 167,
    status: 'normal',
    lat: 280,
    lng: 200,
    algorithm: 'Hybrid RL',
    cycleDuration: 125,
    baseLaneA: 16,
    baseLaneB: 18,
  },
  {
    id: '7',
    name: 'Ashok Nagar Signal',
    vehicleCount: 98,
    status: 'normal',
    lat: 240,
    lng: 180,
    algorithm: 'Proportional RL',
    cycleDuration: 115,
    baseLaneA: 14,
    baseLaneB: 10,
  },
  {
    id: '8',
    name: 'Koyambedu Junction',
    vehicleCount: 195,
    status: 'warning',
    lat: 120,
    lng: 200,
    algorithm: 'Priority RL',
    cycleDuration: 138,
    baseLaneA: 30,
    baseLaneB: 20,
  },
];

/** Matches `JUNCTION_ID` / `JUNCTION_NAME` in `server/services/flowiqState.js`. */
export const FLOWIQ_DIGITAL_TWIN_JUNCTION = {
  junctionId: 'chennai-prototype-1',
  junctionName: 'Anna Nagar Junction',
  chennaiListId: '1',
} as const;

export function getChennaiJunctionById(id: string): ChennaiJunction | undefined {
  return CHENNAI_JUNCTIONS.find((j) => j.id === id);
}

export function resolveChennaiListIdForBackend(backendJunctionId: string): string {
  if (
    backendJunctionId === FLOWIQ_DIGITAL_TWIN_JUNCTION.junctionId ||
    backendJunctionId === 'local'
  ) {
    return FLOWIQ_DIGITAL_TWIN_JUNCTION.chennaiListId;
  }
  return CHENNAI_JUNCTIONS[0]?.id ?? '1';
}

export function junctionReceivesDigitalTwinTelemetry(
  selectedChennaiListId: string,
  backendJunctionId: string,
): boolean {
  return (
    selectedChennaiListId === FLOWIQ_DIGITAL_TWIN_JUNCTION.chennaiListId &&
    (backendJunctionId === FLOWIQ_DIGITAL_TWIN_JUNCTION.junctionId || backendJunctionId === 'local')
  );
}
