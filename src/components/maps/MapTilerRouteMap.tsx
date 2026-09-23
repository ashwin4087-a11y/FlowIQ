import { useEffect, useRef, useState } from 'react';
import {
  applyMapTilerApiKey,
  ensureMapTilerConfigured,
  verifyMapTilerMapAccess,
} from '../../lib/maptiler/config';
import { shortPlaceLabel } from '../../lib/routeDirections';
import type { PlannedRoute } from '../../types/routePlanner';

const BASE_COLOR = '#64748B';
const FLOWIQ_COLOR = '#00AEEF';

function asLineFeature(route: PlannedRoute) {
  const geom = route.geometry;
  if (geom && typeof geom === 'object' && 'type' in geom && geom.type === 'Feature') return geom;
  return {
    type: 'Feature' as const,
    properties: { routeId: route.id },
    geometry: geom,
  };
}

type SdkMap = {
  getLayer: (id: string) => unknown;
  removeLayer: (id: string) => void;
  getSource: (id: string) => unknown;
  removeSource: (id: string) => void;
  addSource: (id: string, source: unknown) => void;
  addLayer: (layer: unknown) => void;
  fitBounds: (bounds: unknown, options: unknown) => void;
  resize: () => void;
  remove: () => void;
  on: (event: string, handler: (ev?: unknown) => void) => void;
  off: (event: string, handler: (ev?: unknown) => void) => void;
  isStyleLoaded: () => boolean;
};

type MarkerApi = {
  setLngLat: (lngLat: [number, number]) => MarkerApi;
  addTo: (map: unknown) => MarkerApi;
  remove: () => void;
};

function lineCoordinates(feature: ReturnType<typeof asLineFeature>) {
  const g = feature.geometry as { coordinates?: unknown[] };
  return g?.coordinates ?? [];
}

function waitForContainerSize(el: HTMLElement, attempts = 30): Promise<void> {
  return new Promise((resolve, reject) => {
    let n = 0;
    const tick = () => {
      if (el.offsetWidth > 0 && el.offsetHeight > 0) {
        resolve();
        return;
      }
      n += 1;
      if (n >= attempts) {
        reject(new Error('Map container has zero width or height — cannot initialize MapLibre.'));
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

function makeMarkerEl(kind: 'from' | 'to', label: string) {
  const el = document.createElement('div');
  el.className = 'flowiq-route-marker';
  const short = shortPlaceLabel(label);
  if (kind === 'from') {
    el.innerHTML = `<div style="font:600 9px/1.2 system-ui;color:#e2e8f0;text-align:left;margin-bottom:2px">FROM<br/><span style="font-weight:500;color:#94a3b8">${short}</span></div><div style="width:12px;height:12px;border-radius:50%;background:#0ea5e9;border:2px solid #f8fafc;box-shadow:0 0 0 2px rgba(14,165,233,0.35)"></div>`;
  } else {
    el.innerHTML = `<div style="width:12px;height:12px;border-radius:50%;background:#00AEEF;border:2px solid #fff;box-shadow:0 0 0 2px rgba(0,174,239,0.4)"></div><div style="font:600 9px/1.2 system-ui;color:#e2e8f0;text-align:left;margin-top:2px">TO<br/><span style="font-weight:500;color:#94a3b8">${short}</span></div>`;
  }
  return el;
}

export function MapTilerRouteMap({
  routes,
  fastestRouteId,
  recommendedRouteId,
  markers,
  className = '',
}: {
  routes: PlannedRoute[];
  fastestRouteId: string | null;
  recommendedRouteId: string | null;
  markers: {
    from?: { lng: number; lat: number; label?: string };
    to?: { lng: number; lat: number; label?: string };
  };
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<SdkMap | null>(null);
  const lngLatBoundsRef = useRef<typeof import('@maptiler/sdk').LngLatBounds | null>(null);
  const markerRef = useRef<{ from?: MarkerApi; to?: MarkerApi }>({});
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapStatus, setMapStatus] = useState<'idle' | 'loading' | 'ready'>('idle');

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    if (!ensureMapTilerConfigured()) {
      setMapError('MapTiler API key required (VITE_MAPTILER_API_KEY).');
      return;
    }

    let cancelled = false;
    let map: SdkMap | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const onMapError = (ev?: unknown) => {
      const msg =
        ev && typeof ev === 'object' && 'error' in ev && ev.error instanceof Error
          ? ev.error.message
          : 'MapTiler style or tile request failed (check API key and network).';
      console.error('MapTiler map error:', ev);
      if (!cancelled) setMapError(msg);
    };

    const safeResize = () => {
      if (map && !cancelled) {
        try {
          map.resize();
        } catch {
          /* ignore */
        }
      }
    };

    (async () => {
      try {
        setMapStatus('loading');
        const ready = await applyMapTilerApiKey();
        if (!ready) {
          setMapError('MapTiler API key required (VITE_MAPTILER_API_KEY).');
          return;
        }
        const access = await verifyMapTilerMapAccess();
        if (!access.ok) {
          setMapError(access.message);
          return;
        }
        await import('@maptiler/sdk/dist/maptiler-sdk.css');
        const sdk = await import('@maptiler/sdk');
        if (cancelled || !containerRef.current) return;

        await waitForContainerSize(containerRef.current);

        lngLatBoundsRef.current = sdk.LngLatBounds;
        map = new sdk.Map({
          container: containerRef.current,
          style: sdk.MapStyle.STREETS.DEFAULT,
          center: [80.27, 13.08],
          zoom: 11,
        }) as SdkMap;

        const markReady = () => {
          if (cancelled) return;
          setMapStatus('ready');
          setMapError(null);
          safeResize();
        };

        map.on('error', onMapError);
        map.on('load', markReady);
        map.on('idle', markReady);

        map.addControl(new sdk.NavigationControl(), 'top-right');
        mapRef.current = map;

        resizeObserver = new ResizeObserver(() => safeResize());
        resizeObserver.observe(containerRef.current);

        requestAnimationFrame(() => {
          safeResize();
          markReady();
        });
        window.setTimeout(safeResize, 50);
        window.setTimeout(safeResize, 250);
        window.setTimeout(markReady, 3000);
      } catch (err) {
        console.error('MapTiler map init failed:', err);
        if (!cancelled) {
          setMapError(err instanceof Error ? err.message : 'MapTiler map failed to initialize');
        }
      }
    })();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      markerRef.current.from?.remove();
      markerRef.current.to?.remove();
      markerRef.current = {};
      if (map) {
        map.off('error', onMapError);
        map.remove();
      }
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const LngLatBounds = lngLatBoundsRef.current;
    if (!map || !LngLatBounds) return;

    try {
      const layerIds = ['flowiq-route-base', 'flowiq-route-flowiq', 'flowiq-route-other'];
      for (const id of layerIds) {
        if (map.getLayer(id)) map.removeLayer(id);
      }
      if (map.getSource('flowiq-routes')) map.removeSource('flowiq-routes');

      markerRef.current.from?.remove();
      markerRef.current.to?.remove();
      markerRef.current = {};

      if (markers.from) {
        import('@maptiler/sdk').then((sdk) => {
          const el = makeMarkerEl('from', markers.from!.label ?? '');
          markerRef.current.from = new sdk.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([markers.from!.lng, markers.from!.lat])
            .addTo(map) as MarkerApi;
        });
      }
      if (markers.to) {
        import('@maptiler/sdk').then((sdk) => {
          const el = makeMarkerEl('to', markers.to!.label ?? '');
          markerRef.current.to = new sdk.Marker({ element: el, anchor: 'top' })
            .setLngLat([markers.to!.lng, markers.to!.lat])
            .addTo(map) as MarkerApi;
        });
      }

      if (routes.length === 0) return;

      const features = routes.map((r) => {
        const isRecommended = r.id === recommendedRouteId;
        const isBase = r.id === fastestRouteId || (!fastestRouteId && r.id === routes[0]?.id);
        return {
          ...asLineFeature(r),
          properties: {
            routeId: r.id,
            isRecommended,
            isBase,
          },
        };
      });

      const addLayers = () => {
        map.addSource('flowiq-routes', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features },
        });

        map.addLayer({
          id: 'flowiq-route-other',
          type: 'line',
          source: 'flowiq-routes',
          filter: [
            'all',
            ['==', ['get', 'isRecommended'], false],
            ['==', ['get', 'isBase'], false],
          ],
          paint: {
            'line-color': BASE_COLOR,
            'line-width': 3,
            'line-opacity': 0.35,
          },
        });

        map.addLayer({
          id: 'flowiq-route-base',
          type: 'line',
          source: 'flowiq-routes',
          filter: ['==', ['get', 'isBase'], true],
          paint: {
            'line-color': BASE_COLOR,
            'line-width': 4,
            'line-opacity': 0.55,
          },
        });

        map.addLayer({
          id: 'flowiq-route-flowiq',
          type: 'line',
          source: 'flowiq-routes',
          filter: ['==', ['get', 'isRecommended'], true],
          paint: {
            'line-color': FLOWIQ_COLOR,
            'line-width': 6,
            'line-opacity': 0.92,
          },
        });

        const bounds = new LngLatBounds();
        for (const f of features) {
          for (const c of lineCoordinates(f)) {
            bounds.extend(c as [number, number]);
          }
        }
        if (markers.from) bounds.extend([markers.from.lng, markers.from.lat]);
        if (markers.to) bounds.extend([markers.to.lng, markers.to.lat]);
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 56, duration: 700, maxZoom: 14 });
        }
        map.resize();
      };

      if (map.isStyleLoaded()) {
        addLayers();
      } else {
        const onLoad = () => {
          map.off('load', onLoad);
          addLayers();
        };
        map.on('load', onLoad);
      }
    } catch (err) {
      console.error('MapTiler route layer update failed:', err);
    }
  }, [routes, fastestRouteId, recommendedRouteId, markers.from, markers.to]);

  if (mapError) {
    return (
      <div
        className={`rounded-lg border border-[#334155] flex items-center justify-center p-6 text-center text-[#EF4444] text-sm ${className}`}
      >
        {mapError}
      </div>
    );
  }

  return (
    <div className={`relative w-full min-h-0 rounded-lg overflow-hidden border border-[#334155] bg-[#0f172a] ${className}`}>
      {mapStatus === 'loading' && (
        <div className="absolute inset-0 z-[1] flex items-center justify-center text-[#64748b] text-sm pointer-events-none bg-[#0f172a]/80">
          Loading map…
        </div>
      )}
      <div
        className="absolute bottom-3 left-3 z-[2] rounded-md border border-[#334155]/90 bg-[#0F172A]/92 px-2.5 py-1.5 text-[9px] text-[#CBD5E1] space-y-1 pointer-events-none"
        aria-hidden
      >
        <p className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 rounded" style={{ background: BASE_COLOR }} />
          BASE ROUTE
        </p>
        <p className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-1 rounded" style={{ background: FLOWIQ_COLOR }} />
          FLOWIQ RECOMMENDED
        </p>
      </div>
      <div
        ref={containerRef}
        className="maplibregl-map-host absolute inset-0 w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
