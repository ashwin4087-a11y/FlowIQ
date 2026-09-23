export type CongestionLevel = 'low' | 'moderate' | 'high';
export type TrafficDensity = 'LOW' | 'MEDIUM' | 'HIGH';
export type ControlMode = 'HEURISTIC' | 'RL';
export type TrafficMode = 'NORMAL' | 'SURGE';

export type SignalPhase =
  | 'NORTH_SOUTH_GREEN'
  | 'NORTH_SOUTH_YELLOW'
  | 'ALL_RED'
  | 'EAST_WEST_GREEN'
  | 'EAST_WEST_YELLOW';

export type VehicleType =
  | 'CAR'
  | 'MOTORCYCLE'
  | 'BUS'
  | 'TRUCK'
  | 'AMBULANCE'
  | 'FIRE_TRUCK';

export type VehicleMovement = 'STRAIGHT' | 'LEFT' | 'RIGHT';
export type VehicleSimState =
  | 'APPROACHING'
  | 'FOLLOWING'
  | 'QUEUED'
  | 'STOPPED'
  | 'ACCELERATING'
  | 'TURNING'
  | 'CROSSING'
  | 'EXITING';

export interface LaneMetrics {
  id: string;
  direction: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
  vehicleCount: number;
  queueLength: number;
  averageSpeedKmh: number;
  congestionLevel: CongestionLevel;
}

export interface TrafficState {
  timestamp: string;
  junctionId: string;
  lanes: LaneMetrics[];
  vehicleCount: number;
  queueLength: number;
  averageSpeedKmh: number;
  congestionLevel: CongestionLevel;
  source: string;
  simulated: boolean;
}

export interface SignalState {
  junctionId: string;
  phases: Record<SignalPhase, { durationSec: number }>;
  activePhase: SignalPhase;
  remainingSeconds: number;
  mode: ControlMode;
  source: string;
  simulated: boolean;
  lastDecision?: {
    label: string;
    source: string;
    simulated: boolean;
  };
}

export interface PredictionState {
  horizon?: 'short';
  congestionProbability: number | null;
  surgeLevel: 'LOW' | 'MODERATE' | 'HIGH';
  confidence: number | null;
  source: string;
  timestamp: string;
  simulated: boolean;
  note?: string;
  probabilities?: Record<string, number> | null;
}

export interface FestivalPredictionState {
  status: 'ok' | 'loading' | 'error' | 'not_available' | 'model_not_available';
  source: string;
  simulated: boolean;
  dataProvenance?: string;
  chennaiJunctionId?: string;
  junctionName?: string;
  festivalId?: string | null;
  festival?: string | null;
  festivalDay?: number | null;
  predictedLevel?: 'LOW' | 'MODERATE' | 'HIGH' | null;
  confidence: number | null;
  expectedWindow?: { start: string; end: string } | null;
  forecastPeriod?: string | null;
  featureImportance?: Record<string, number> | null;
  timestamp: string;
  note?: string;
}

export type ActiveController = 'RL_MODEL' | 'HEURISTIC_FALLBACK';

export interface BrainState {
  timestamp: string | null;
  activeController?: ActiveController;
  controlMode?: ControlMode;
  signalControllerMode: string;
  recommendation?: {
    label: string;
    kind: string;
    source: string;
    simulated: boolean;
  } | null;
  explanation?: string | null;
  sources?: Record<string, string | null>;
  signalDecision?: {
    mode: string;
    lastDecision?: { label: string; source: string; simulated: boolean };
  };
}

export interface CommuterAlert {
  id: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH';
  source: string;
  simulated: boolean;
  timestamp: string;
  junctionName: string;
  message: string;
  suggestedAction?: string;
}

export interface ScenarioState {
  active: boolean;
  id: string | null;
  label: string | null;
  step: string | null;
  stepIndex?: number;
  simulated: boolean;
}

export interface EmergencyState {
  eventId?: string | null;
  status?: string;
  active: boolean;
  type: string | null;
  source: string | null;
  confidence: number;
  location: string;
  direction: string | null;
  timestamp: string | null;
  simulated: boolean;
  greenWaveActive?: boolean;
  label?: string;
  audioCandidate?: boolean;
  affectedJunctions?: string[];
  affectedSignals?: string[];
  greenWavePlan?: { corridor?: string; junctionId?: string; simulated?: boolean } | null;
  restoredAt?: string | null;
}

export interface VehicleState {
  id: string;
  type: VehicleType;
  lane: string;
  movement: VehicleMovement;
  position: { x: number; y: number; z: number };
  speed: number;
  state: VehicleSimState;
  heading?: number;
}

export interface AudioEvent {
  event: 'SIREN' | 'NON_SIREN' | null;
  probability: number | null;
  source: string;
  demo: boolean;
  timestamp: string;
  status?: string;
}

export interface SystemHealth {
  frontend: string;
  backend: string;
  audioModel: string;
  vision: string;
  rlController: string;
  sumo: string;
  mqtt: string;
  mongodb: string;
  surgeModel?: string;
  cvMode?: string;
  rlPolicyTrained?: boolean;
  cvDisplay?: {
    cvInput: string;
    yoloAdapter: string;
    modelWeights: string;
  };
}

export interface FlowIQState {
  junctionId: string;
  junctionName: string;
  updatedAt: string;
  controlMode: ControlMode;
  trafficMode: TrafficMode;
  scenarioNote?: string | null;
  traffic: TrafficState;
  signals: SignalState;
  prediction: PredictionState;
  festivalPrediction?: FestivalPredictionState;
  brain?: BrainState;
  scenario?: ScenarioState;
  commuterAlerts?: CommuterAlert[];
  emergency: EmergencyState;
  audio: {
    modelLoaded: boolean;
    modelVersion: string | null;
    lastEvent: AudioEvent | null;
    temporal: {
      status: string;
      consecutiveHigh: number;
      recentProbabilities: number[];
    };
  };
  system: SystemHealth;
  vehicles: VehicleState[];
}
