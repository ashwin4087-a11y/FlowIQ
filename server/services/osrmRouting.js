/**
 * Real road routing via OSRM (OpenStreetMap road network).
 * Map tiles/geocoding use MapTiler; routing geometry comes from OSRM.
 */

const DEFAULT_OSRM = 'https://router.project-osrm.org';
const DEFAULT_TIMEOUT_MS = Number(process.env.ROUTING_OSRM_TIMEOUT_MS) || 45_000;

export function getRoutingEngineBaseUrl() {
  const base = (process.env.ROUTING_OSRM_URL || DEFAULT_OSRM).replace(/\/$/, '');
  return base;
}

function isPublicOsrmRouter() {
  return getRoutingEngineBaseUrl().includes('project-osrm.org');
}

/** Public demo router: alternatives=true is often 30–90s+; default to a single real route unless opted in. */
function shouldRequestAlternatives(from, to) {
  if (process.env.ROUTING_OSRM_ALLOW_ALTERNATIVES === '1') {
    return haversineMeters(from, to) <= ALTERNATIVES_MAX_HAVERSINE_M;
  }
  if (isPublicOsrmRouter()) {
    return false;
  }
  return haversineMeters(from, to) <= ALTERNATIVES_MAX_HAVERSINE_M;
}

/**
 * @param {string} url
 * @param {RequestInit} init
 * @param {number} timeoutMs
 */
async function fetchWithTimeout(url, init, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error(`Routing engine timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function summarizeOsrmLegSteps(legs) {
  const names = [];
  for (const leg of legs || []) {
    for (const step of leg.steps || []) {
      const name =
        (typeof step.name === 'string' && step.name.trim()) ||
        (typeof step.ref === 'string' && step.ref.trim()) ||
        '';
      if (name) names.push(name);
    }
  }
  const deduped = [];
  for (const n of names) {
    if (deduped[deduped.length - 1] !== n) deduped.push(n);
  }
  return deduped;
}

/** Long trips: skip OSRM alternatives (much faster on public router); FlowIQ still scores the primary route. */
const ALTERNATIVES_MAX_HAVERSINE_M =
  Number(process.env.ROUTING_OSRM_ALTERNATIVES_MAX_METERS) || 22_000;

/** Public OSRM often stalls on alternatives=true; cap wait then fall back to a single route. */
const ALTERNATIVES_TIMEOUT_MS =
  Number(process.env.ROUTING_OSRM_ALTERNATIVES_TIMEOUT_MS) || 20_000;

const SINGLE_ROUTE_TIMEOUT_MS =
  Number(process.env.ROUTING_OSRM_SINGLE_TIMEOUT_MS) || 38_000;

/**
 * @param {boolean} alternatives
 * @param {number} timeoutMs
 * @returns {Promise<{ routes: Array<{ id: string, durationSeconds: number, distanceMeters: number, geometry: object, coordinateCount: number, directionSteps: string[] }> }>}
 */
async function fetchOsrmDrivingOnce(from, to, alternatives, timeoutMs) {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const params = new URLSearchParams({
    alternatives: alternatives ? 'true' : 'false',
    steps: 'true',
    overview: 'full',
    geometries: 'geojson',
  });
  const url = `${getRoutingEngineBaseUrl()}/route/v1/driving/${coords}?${params}`;
  const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, timeoutMs);
  if (!res.ok) {
    throw new Error(`Routing engine HTTP ${res.status}`);
  }
  const data = await res.json();
  if (data.code !== 'Ok' || !Array.isArray(data.routes) || data.routes.length === 0) {
    throw new Error(data.message || data.code || 'No route found');
  }
  const routes = data.routes.map((route, index) => ({
    id: `route-${index}`,
    durationSeconds: route.duration,
    distanceMeters: route.distance,
    geometry: route.geometry,
    coordinateCount: route.geometry?.coordinates?.length ?? 0,
    directionSteps: summarizeOsrmLegSteps(route.legs),
  }));
  return { routes };
}

/**
 * @returns {Promise<{ routes: Array<{ id: string, durationSeconds: number, distanceMeters: number, geometry: object, coordinateCount: number }>, osrmMs: number, alternativesRequested: boolean }>}
 */
export async function fetchDrivingRoutes(from, to) {
  const osrmStart = performance.now();
  const wantAlternatives = shouldRequestAlternatives(from, to);
  const singleTimeout = Math.min(SINGLE_ROUTE_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);

  if (wantAlternatives) {
    try {
      const { routes } = await fetchOsrmDrivingOnce(from, to, true, ALTERNATIVES_TIMEOUT_MS);
      return {
        routes,
        osrmMs: performance.now() - osrmStart,
        alternativesRequested: true,
      };
    } catch (err) {
      console.warn(
        '[OSRM] alternatives request failed, retrying without alternatives:',
        err instanceof Error ? err.message : err,
      );
    }
  }

  const { routes } = await fetchOsrmDrivingOnce(from, to, false, singleTimeout);
  return {
    routes,
    osrmMs: performance.now() - osrmStart,
    alternativesRequested: false,
  };
}
