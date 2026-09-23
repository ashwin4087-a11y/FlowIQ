import { fetchDrivingRoutes, getRoutingEngineBaseUrl } from './osrmRouting.js';
import { evaluateRoutes } from './routeEvaluationService.js';
import { getState } from './flowiqState.js';
import { getCachedOsrmRoutes, setCachedOsrmRoutes } from './routePlanCache.js';

export async function planRoadRoutes({ from, to }) {
  const totalStart = performance.now();
  let osrmMs = 0;
  let osrmCacheHit = false;
  let alternativesRequested = true;

  const cached = getCachedOsrmRoutes(from, to);
  let routes;
  if (cached) {
    routes = cached.routes;
    osrmMs = 0;
    osrmCacheHit = true;
  } else {
    const osrmResult = await fetchDrivingRoutes(from, to);
    routes = osrmResult.routes;
    osrmMs = osrmResult.osrmMs;
    alternativesRequested = osrmResult.alternativesRequested;
    setCachedOsrmRoutes(from, to, routes);
  }

  const evalStart = performance.now();
  const evaluation = evaluateRoutes(routes, getState());
  const evaluationMs = performance.now() - evalStart;
  const totalMs = performance.now() - totalStart;

  return {
    routingProvider: 'osrm',
    routingEngine: 'OSRM / OpenStreetMap road network',
    routingEngineUrl: getRoutingEngineBaseUrl(),
    mapProvider: 'maptiler',
    geocodingProvider: 'maptiler',
    from,
    to,
    ...evaluation,
    geometryProof: routes.map((r) => ({
      id: r.id,
      coordinateCount: r.coordinateCount,
      firstCoordinate: r.geometry?.coordinates?.[0] ?? null,
      lastCoordinate: r.geometry?.coordinates?.[r.coordinateCount - 1] ?? null,
    })),
    timings: {
      osrmMs: Math.round(osrmMs),
      evaluationMs: Math.round(evaluationMs),
      totalMs: Math.round(totalMs),
      osrmCacheHit,
      alternativesRequested,
    },
    timestamp: new Date().toISOString(),
  };
}
