import type { FestivalPredictionState, FlowIQState } from '../types/flowiq';
import type { LatLng, RoutePlanResponse } from '../types/routePlanner';

const configuredBase = () => import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

function apiBases(): string[] {
  const configured = configuredBase();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  if (!configured) {
    return origin ? [origin] : [];
  }
  if (!origin || configured === origin) {
    return [configured];
  }
  // Dev: prefer same-origin (Vite /api proxy) first to avoid long stalls on a dead direct API URL.
  if (import.meta.env.DEV) {
    return [origin, configured];
  }
  return [configured, origin];
}

/** Must exceed worst-case server OSRM (alternatives retry + single route) when backend is healthy. */
const ROUTE_PLAN_TIMEOUT_MS = 90_000;
const ROUTE_PLAN_CACHE_TTL_MS = 5 * 60 * 1000;
const routePlanSessionCache = new Map<string, { at: number; data: RoutePlanResponse }>();

function routePlanCacheKey(from: LatLng, to: LatLng) {
  return `${from.lat.toFixed(5)},${from.lng.toFixed(5)}|${to.lat.toFixed(5)},${to.lng.toFixed(5)}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let lastErr: Error | null = null;
  for (const base of apiBases()) {
    try {
      const res = await fetch(`${base}${path}`, init);
      if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
      return res.json() as Promise<T>;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr ?? new Error(`API ${path} failed`);
}

async function requestRaw(path: string, init?: RequestInit): Promise<Response> {
  let lastErr: Error | null = null;
  for (const base of apiBases()) {
    try {
      const res = await fetch(`${base}${path}`, init);
      if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
      return res;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr ?? new Error(`API ${path} failed`);
}

export async function fetchHealth(): Promise<{ status: string; audioModelLoaded: boolean }> {
  return request('/api/health');
}

export async function fetchState(): Promise<FlowIQState> {
  return request('/api/state');
}

export async function fetchFestivalPrediction(params: {
  chennaiJunctionId: string;
  festivalId: string;
  festivalDay: number;
  hour?: number;
}): Promise<FestivalPredictionState> {
  const q = new URLSearchParams({
    chennaiJunctionId: params.chennaiJunctionId,
    festivalId: params.festivalId,
    festivalDay: String(params.festivalDay),
  });
  if (params.hour != null) q.set('hour', String(params.hour));
  return request(`/api/prediction/festival?${q}`);
}

export async function fetchFestivalSurgeMetrics(): Promise<Record<string, unknown>> {
  return request('/api/ml/festival-surge-metrics');
}

export async function fetchFestivalSurgeModelInfo(): Promise<{
  loaded: boolean;
  metricsAvailable: boolean;
  horizon: string;
}> {
  return request('/api/ml/festival-surge-info');
}

export async function fetchSupportedFestivals(): Promise<{
  festivals: { id: string; name: string; days: number }[];
  provenance: string;
}> {
  return request('/api/prediction/festivals');
}

export async function confirmAudioEmergency() {
  return request('/api/emergency/confirm-audio', { method: 'POST' });
}

export async function postDemoEmergency(body?: { type?: string; direction?: string }) {
  return request('/api/emergency/demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
}

export async function postTrafficMode(mode: 'NORMAL' | 'SURGE') {
  return request<FlowIQState>('/api/traffic/mode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  });
}

export async function syncSimulation(payload: {
  traffic?: Partial<FlowIQState['traffic']>;
  signals?: Partial<FlowIQState['signals']>;
  vehicles?: FlowIQState['vehicles'];
}) {
  return request<FlowIQState>('/api/simulation/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function predictAudio(file: Blob) {
  const form = new FormData();
  form.append('audio', file, 'clip.wav');
  const res = await requestRaw('/api/audio/predict', { method: 'POST', body: form });
  return res.json();
}

export async function fetchAudioStatus() {
  return request('/api/audio/status');
}

export async function planRoadRoutes(
  from: LatLng,
  to: LatLng,
  options?: { signal?: AbortSignal },
): Promise<RoutePlanResponse> {
  const cacheKey = routePlanCacheKey(from, to);
  const cached = routePlanSessionCache.get(cacheKey);
  if (cached && Date.now() - cached.at < ROUTE_PLAN_CACHE_TTL_MS) {
    return cached.data;
  }

  const body = JSON.stringify({
    from: { lng: from.lng, lat: from.lat },
    to: { lng: to.lng, lat: to.lat },
  });

  const deadline = Date.now() + ROUTE_PLAN_TIMEOUT_MS;
  let lastErr: Error | null = null;

  for (const base of apiBases()) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;

    const controller = new AbortController();
    const onParentAbort = () => controller.abort();
    options?.signal?.addEventListener('abort', onParentAbort);
    const timer = setTimeout(() => controller.abort(), remaining);

    try {
      const res = await fetch(`${base}/api/routes/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: controller.signal,
      });
      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(errJson.message || `API /api/routes/plan failed: ${res.status}`);
      }
      const data = (await res.json()) as RoutePlanResponse;
      routePlanSessionCache.set(cacheKey, { at: Date.now(), data });
      if (import.meta.env.DEV && data.timings) {
        console.info('[FlowIQ route plan timings]', data.timings);
      }
      return data;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        if (options?.signal?.aborted) {
          throw e;
        }
        lastErr = new Error('ROUTE_PLAN_TIMEOUT');
        break;
      }
      lastErr = e instanceof Error ? e : new Error(String(e));
      if (lastErr.message === 'ROUTE_PLAN_TIMEOUT' || remaining < 4000) {
        break;
      }
    } finally {
      clearTimeout(timer);
      options?.signal?.removeEventListener('abort', onParentAbort);
    }
  }

  if (lastErr?.message === 'ROUTE_PLAN_TIMEOUT') {
    const err = new Error('ROUTE PLANNING TIMED OUT');
    console.error('planRoadRoutes timed out');
    throw err;
  }
  console.error('planRoadRoutes failed:', lastErr);
  throw lastErr ?? new Error('ROUTE PLANNING FAILED');
}
