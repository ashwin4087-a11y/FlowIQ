import type { Feature, LineString } from 'geojson';

export interface LatLng {
  lng: number;
  lat: number;
  label?: string;
}

export interface PlannedRoute {
  id: string;
  durationSeconds: number;
  distanceMeters: number;
  geometry: Feature<LineString> | LineString;
  coordinateCount: number;
  flowiqSimulatedCongestion: 'LOW' | 'MODERATE' | 'HIGH';
  flowiqCongestionScore: number;
  flowiqAdjustedDurationSec: number;
  isFlowiqRecommended: boolean;
  isFastest: boolean;
  displayLabel: string;
  reason?: string;
  directionSteps?: string[];
}

export interface RoutePlanResponse {
  status: 'ok' | 'error';
  routingProvider: string;
  routingEngine: string;
  routingEngineUrl: string;
  mapProvider: string;
  geocodingProvider: string;
  from: LatLng;
  to: LatLng;
  routes: PlannedRoute[];
  recommendedRouteId: string;
  fastestRouteId: string;
  alternativesAvailable: boolean;
  surgeLevel: string | null;
  surgeSource: string;
  festivalSurgeLevel?: string | null;
  festivalForecastWarning?: string | null;
  simulatedTraffic: boolean;
  scoringFormula: string;
  geometryProof?: Array<{
    id: string;
    coordinateCount: number;
    firstCoordinate: [number, number] | null;
    lastCoordinate: [number, number] | null;
  }>;
  message?: string;
  timings?: {
    osrmMs: number;
    evaluationMs: number;
    totalMs: number;
    osrmCacheHit?: boolean;
  };
}
