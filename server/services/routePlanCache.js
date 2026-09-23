/**
 * Session-scoped OSRM geometry cache (in-memory). FlowIQ scoring is recomputed on each hit.
 */

const TTL_MS = Number(process.env.ROUTE_PLAN_CACHE_TTL_MS) || 5 * 60 * 1000;
const cache = new Map();

function coordKey(from, to) {
  const f = `${from.lng.toFixed(5)},${from.lat.toFixed(5)}`;
  const t = `${to.lng.toFixed(5)},${to.lat.toFixed(5)}`;
  return `${f}|${t}`;
}

export function getCachedOsrmRoutes(from, to) {
  const entry = cache.get(coordKey(from, to));
  if (!entry) return null;
  if (Date.now() - entry.at > TTL_MS) {
    cache.delete(coordKey(from, to));
    return null;
  }
  return { routes: entry.routes, osrmMs: 0, cacheHit: true };
}

export function setCachedOsrmRoutes(from, to, routes) {
  cache.set(coordKey(from, to), { routes, at: Date.now() });
}
