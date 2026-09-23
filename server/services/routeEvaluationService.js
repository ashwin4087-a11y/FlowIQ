/**
 * FlowIQ route scoring on top of real routing-engine geometry (no fake paths).
 */

import { getState } from './flowiqState.js';

const SURGE_DURATION_PENALTY = {
  HIGH: 0.22,
  MODERATE: 0.12,
  LOW: 0,
};

/**
 * Deterministic simulated congestion from route geometry (prototype only).
 * @param {import('geojson').LineString} geometry
 */
export function simulatedCongestionFromGeometry(geometry, routeIndex = 0) {
  const coords = geometry?.coordinates ?? [];
  if (coords.length < 2) {
    return { level: 'LOW', score: 10 + routeIndex * 3 };
  }
  let h = 17 + routeIndex * 13;
  const step = Math.max(1, Math.floor(coords.length / 24));
  for (let i = 0; i < coords.length; i += step) {
    const [lng, lat] = coords[i];
    h = (h * 31 + Math.round(lng * 1e5) + Math.round(lat * 1e5)) | 0;
  }
  const bucket = Math.abs(h) % 100;
  let level = 'LOW';
  if (bucket > 66) level = 'HIGH';
  else if (bucket > 33) level = 'MODERATE';
  return { level, score: bucket };
}

/**
 * flowiqAdjustedDuration = baseDuration * (1 + surgePenalty + junctionLoad*0.08) * (1 + simScore/400)
 */
export function evaluateRoutes(routes, state = getState()) {
  const surge = state.prediction ?? {};
  const fest = state.festivalPrediction ?? {};
  const festLevel =
    fest.status === 'ok' && fest.predictedLevel ? fest.predictedLevel : null;
  const shortPenalty = SURGE_DURATION_PENALTY[surge.surgeLevel] ?? 0;
  const festPenalty = festLevel ? SURGE_DURATION_PENALTY[festLevel] ?? 0 : 0;
  const surgePenalty = Math.max(shortPenalty, festPenalty);
  const junctionLoad = Math.min(1, (state.traffic?.queueLength ?? 0) / 40);

  const evaluated = routes.map((route, idx) => {
    const sim = simulatedCongestionFromGeometry(route.geometry, idx);
    const flowiqAdjustedDurationSec =
      route.durationSeconds *
      (1 + surgePenalty + junctionLoad * 0.08) *
      (1 + sim.score / 400);

    return {
      id: route.id,
      durationSeconds: route.durationSeconds,
      distanceMeters: route.distanceMeters,
      geometry: route.geometry,
      coordinateCount: route.coordinateCount,
      directionSteps: route.directionSteps ?? [],
      flowiqSimulatedCongestion: sim.level,
      flowiqCongestionScore: sim.score,
      flowiqAdjustedDurationSec: Math.round(flowiqAdjustedDurationSec),
    };
  });

  const fastest = evaluated.reduce((a, b) =>
    a.durationSeconds <= b.durationSeconds ? a : b
  );
  const recommended = evaluated.reduce((a, b) =>
    a.flowiqAdjustedDurationSec <= b.flowiqAdjustedDurationSec ? a : b
  );

  const withLabels = evaluated.map((r) => {
    let displayLabel = 'ALTERNATIVE';
    if (r.id === recommended.id) displayLabel = 'FLOWIQ_RECOMMENDED';
    else if (r.id === fastest.id) displayLabel = 'FASTEST';
    return {
      ...r,
      isFlowiqRecommended: r.id === recommended.id,
      isFastest: r.id === fastest.id,
      displayLabel,
      reason:
        r.id === recommended.id
          ? buildRecommendationReason(r, fastest, surge)
          : undefined,
    };
  });

  let festivalForecastWarning = null;
  if (fest.status === 'ok' && fest.predictedLevel === 'HIGH' && fest.junctionName) {
    const win = fest.expectedWindow
      ? `${fest.expectedWindow.start}–${fest.expectedWindow.end}`
      : fest.forecastPeriod;
    festivalForecastWarning = `FlowIQ festival forecast indicates elevated congestion risk near ${fest.junctionName}${win ? ` (${win})` : ''}. Scoring uses max(short-horizon, festival) surge penalty.`;
  }

  return {
    routes: withLabels,
    recommendedRouteId: recommended.id,
    fastestRouteId: fastest.id,
    alternativesAvailable: evaluated.length > 1,
    surgeLevel: surge.surgeLevel ?? null,
    surgeSource: surge.source ?? 'unavailable',
    festivalSurgeLevel: fest.status === 'ok' ? fest.predictedLevel : null,
    festivalForecastWarning,
    simulatedTraffic: true,
    scoringFormula:
      'flowiqAdjustedDuration = routingDuration × (1 + surgePenalty + junctionLoad×0.08) × (1 + simCongestionScore/400); surge from junction prediction; sim congestion is geometry-hash (labeled SIMULATED)',
    junctionQueueLength: state.traffic?.queueLength ?? 0,
  };
}

function buildRecommendationReason(route, fastest, surge) {
  if (route.id === fastest.id) {
    return 'Lowest FlowIQ-adjusted time under current simulated traffic and surge forecast.';
  }
  const parts = ['Lower predicted simulated congestion than the fastest road route.'];
  if (surge.source === 'surge_model' && surge.surgeLevel && surge.surgeLevel !== 'LOW') {
    parts.push(`Surge forecast ${surge.surgeLevel} applied in scoring (simulator-derived model).`);
  }
  return parts.join(' ');
}
