import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { MapTilerRouteMap } from '../components/maps/MapTilerRouteMap';

import { PlaceAutocomplete } from '../components/route-planner/PlaceAutocomplete';

import { getMapTilerApiKey } from '../lib/maptiler/config';

import { planRoadRoutes } from '../lib/api';

import { routeDirectionLines, shortPlaceLabel } from '../lib/routeDirections';

import type { LatLng, PlannedRoute, RoutePlanResponse } from '../types/routePlanner';



function formatDuration(sec: number) {

  const m = Math.round(sec / 60);

  return `${m} min`;

}



function formatDistance(m: number) {

  return `${(m / 1000).toFixed(1)} km`;

}



function isValidCoord(p: LatLng | null): boolean {

  if (!p) return false;

  return Number.isFinite(p.lat) && Number.isFinite(p.lng);

}



function samePlace(a: LatLng, b: LatLng): boolean {

  return Math.abs(a.lat - b.lat) < 1e-6 && Math.abs(a.lng - b.lng) < 1e-6;

}



function RouteDirectionsBlock({

  title,

  lines,

}: {

  title: string;

  lines: string[];

}) {

  if (lines.length < 2) return null;

  return (

    <div className="text-[10px]">

      <p className="font-semibold text-[#94A3B8] mb-1">{title}</p>

      <div className="font-mono text-[#CBD5E1] space-y-0.5">

        {lines.map((line, i) => (

          <div key={`${line}-${i}`} className="flex flex-col items-start">

            <span>{line}</span>

            {i < lines.length - 1 && <span className="text-[#475569] pl-1">↓</span>}

          </div>

        ))}

      </div>

    </div>

  );

}



export function RoutePlannerPage() {

  const mapKeyOk = Boolean(getMapTilerApiKey());

  const [from, setFrom] = useState<LatLng | null>(null);

  const [to, setTo] = useState<LatLng | null>(null);

  const [plan, setPlan] = useState<RoutePlanResponse | null>(null);

  const [loading, setLoading] = useState(false);

  const [planStage, setPlanStage] = useState<'connecting' | 'routing' | 'evaluating'>('connecting');

  const [error, setError] = useState<string | null>(null);

  const planGenerationRef = useRef(0);

  const planAbortRef = useRef<AbortController | null>(null);



  useEffect(() => {

    planAbortRef.current?.abort();

    planGenerationRef.current += 1;

    setLoading(false);

    setPlan(null);

  }, [from?.lat, from?.lng, to?.lat, to?.lng]);



  const routes = plan?.status === 'ok' ? plan.routes : [];

  const baseRoute =

    routes.find((r) => r.id === plan?.fastestRouteId) ?? routes[0] ?? null;

  const flowiqRoute =

    routes.find((r) => r.id === plan?.recommendedRouteId) ?? baseRoute;



  useEffect(() => {

    if (!loading) return;

    setPlanStage('connecting');

    const t1 = window.setTimeout(() => setPlanStage('routing'), 350);

    const t2 = window.setTimeout(() => setPlanStage('evaluating'), 2500);

    return () => {

      window.clearTimeout(t1);

      window.clearTimeout(t2);

    };

  }, [loading]);



  const runPlan = useCallback(async () => {

    setError(null);

    if (!isValidCoord(from) || !isValidCoord(to)) {

      setError('Confirm origin and destination from the suggestion list so coordinates are locked.');

      return;

    }

    if (samePlace(from!, to!)) {

      setError('Origin and destination must be different locations.');

      return;

    }



    planAbortRef.current?.abort();

    const controller = new AbortController();

    planAbortRef.current = controller;

    const requestId = ++planGenerationRef.current;



    setLoading(true);

    setPlan(null);

    try {

      const result = await planRoadRoutes(from!, to!, { signal: controller.signal });

      if (requestId !== planGenerationRef.current) return;

      if (result.status !== 'ok') {

        setError('ROUTE PLANNING FAILED — Unable to calculate the route right now.');

        return;

      }

      setPlan(result);

    } catch (e) {

      if (requestId !== planGenerationRef.current) return;

      if (e instanceof DOMException && e.name === 'AbortError') return;

      console.error('Route planning failed:', e);

      const msg = e instanceof Error ? e.message : String(e);

      if (msg.includes('TIMED OUT')) {

        const destHint =
          to?.label && /reserve forest|wildlife|sanctuary/i.test(to.label)
            ? ' For local trips, pick the town or junction from the list (not a reserve/forest name).'
            : '';
        setError(
          `ROUTE PLANNING TIMED OUT — The routing service may be busy, or the FlowIQ backend on port 5000 may be stuck. Restart the backend, then RETRY.${destHint}`,
        );

      } else if (msg.toLowerCase().includes('routing engine') || msg.toLowerCase().includes('osrm')) {

        setError('ROUTING SERVICE UNAVAILABLE — Please try again later.');

      } else {

        setError('ROUTE PLANNING FAILED — Unable to calculate the route right now.');

      }

    } finally {

      if (requestId === planGenerationRef.current) {

        setLoading(false);

        planAbortRef.current = null;

      }

    }

  }, [from, to]);



  const fromLabel = from?.label ?? '';

  const toLabel = to?.label ?? '';



  const baseDirections = useMemo(() => {

    if (!baseRoute) return [];

    return routeDirectionLines(fromLabel, toLabel, baseRoute);

  }, [baseRoute, fromLabel, toLabel]);



  const flowiqDirections = useMemo(() => {

    if (!flowiqRoute || flowiqRoute.id === baseRoute?.id) return [];

    return routeDirectionLines(fromLabel, toLabel, flowiqRoute);

  }, [flowiqRoute, baseRoute, fromLabel, toLabel]);



  return (

    <div className="h-[calc(100vh-5.5rem)] overflow-hidden px-3 py-2 flex flex-col gap-2">

      <p className="text-[9px] text-[#64748b] tracking-wide shrink-0">

        MAPTILER · OSRM · FLOWIQ SIMULATION

      </p>



      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[34%_1fr] gap-3">

        <aside className="min-h-0 overflow-y-auto space-y-2 pr-0.5">

          <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3 space-y-2">

            <h2 className="text-sm font-semibold">Route Planner</h2>



            {!mapKeyOk && (

              <p className="text-xs text-[#EF4444]">Missing VITE_MAPTILER_API_KEY in `.env`.</p>

            )}



            <PlaceAutocomplete

              label="From"

              placeholder="Search location…"

              selected={from}

              onSelectedChange={setFrom}

              disabled={!mapKeyOk}

            />

            <PlaceAutocomplete

              label="To"

              placeholder="Search destination…"

              selected={to}

              onSelectedChange={setTo}

              disabled={!mapKeyOk}

            />



            <button

              type="button"

              className="w-full py-2 rounded bg-[#0EA5E9] text-[#0F172A] font-semibold text-sm disabled:opacity-50"

              disabled={loading || !mapKeyOk}

              onClick={runPlan}

            >

              {loading ? 'PLANNING ROUTE…' : 'PLAN ROUTE'}

            </button>



            {loading && (

              <p className="text-[10px] text-[#94A3B8]" aria-live="polite">

                PLANNING ROUTE…{' '}

                {planStage === 'connecting' && '· Connecting to FlowIQ backend'}

                {planStage === 'routing' && '· Calculating road route (OSRM)'}

                {planStage === 'evaluating' && '· Evaluating FlowIQ conditions (simulated)'}

              </p>

            )}



            {error && (

              <div className="text-xs space-y-1">

                <p className="text-[#EF4444] font-semibold">ROUTE PLANNING FAILED</p>

                <p className="text-[#94A3B8]">{error.replace(/^ROUTE PLANNING FAILED[ —-]*/i, '')}</p>

                <button type="button" className="text-[#0EA5E9] underline" onClick={() => runPlan()}>

                  RETRY

                </button>

              </div>

            )}



            {plan?.status === 'ok' && baseRoute && (

              <div className="rounded border border-[#334155] bg-[#0F172A]/50 p-2.5 space-y-1.5 text-xs">

                <p className="font-semibold text-[#10B981]">ROUTE FOUND</p>

                <p className="text-[#E2E8F0]">

                  {shortPlaceLabel(fromLabel)} → {shortPlaceLabel(toLabel)}

                </p>

                <p className="text-[#94A3B8]">

                  <span className="text-[#64748b]">BASE ROUTE</span>

                  <br />

                  {formatDistance(baseRoute.distanceMeters)} · {formatDuration(baseRoute.durationSeconds)}

                </p>

                <p className="text-[#94A3B8]">

                  <span className="text-[#00AEEF]">FLOWIQ ADJUSTED</span>

                  <br />

                  {formatDuration(flowiqRoute!.flowiqAdjustedDurationSec)} ·{' '}

                  {flowiqRoute!.flowiqSimulatedCongestion} simulated congestion

                </p>

                {!plan.alternativesAvailable && (

                  <p className="text-[10px] text-[#64748b]">

                    OSRM returned one route for this query.

                  </p>

                )}

              </div>

            )}



            {plan?.status === 'ok' && plan.festivalForecastWarning && (

              <p className="text-[10px] text-[#F59E0B] border border-[#F59E0B]/30 rounded px-2 py-1">

                {plan.festivalForecastWarning}

              </p>

            )}

          </div>



          {routes.length > 0 && (

            <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3 space-y-2">

              <h3 className="text-xs font-semibold">Routes</h3>

              {routes.map((r: PlannedRoute) => {

                const title =

                  r.isFlowiqRecommended

                    ? 'FLOWIQ RECOMMENDED'

                    : r.isFastest

                      ? 'BASE ROUTE'

                      : 'ALTERNATIVE';

                return (

                  <div key={r.id} className="rounded border border-[#334155] p-2 text-[10px]">

                    <p className="font-semibold text-[#E2E8F0]">{title}</p>

                    <p className="font-mono text-[#CBD5E1]">

                      {formatDistance(r.distanceMeters)} · {formatDuration(r.durationSeconds)}

                    </p>

                    <p className="text-[#64748b]">

                      FlowIQ adj. {formatDuration(r.flowiqAdjustedDurationSec)}

                    </p>

                  </div>

                );

              })}

            </div>

          )}



          {plan?.status === 'ok' && baseRoute && (

            <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3 space-y-2">

              <h3 className="text-xs font-semibold">ROUTE DIRECTIONS</h3>

              <RouteDirectionsBlock title="BASE ROUTE" lines={baseDirections} />

              {flowiqDirections.length > 0 && (

                <RouteDirectionsBlock title="FLOWIQ RECOMMENDED" lines={flowiqDirections} />

              )}

              {baseDirections.length <= 2 && (

                <p className="text-[10px] text-[#64748b]">

                  Turn-by-turn detail is limited for this OSRM response.

                </p>

              )}

            </div>

          )}

        </aside>



        <div className="min-h-[280px] lg:min-h-0 flex flex-col min-w-0">

          {!mapKeyOk ? (

            <div className="flex-1 rounded-lg border border-[#334155] flex items-center justify-center text-[#94A3B8] text-sm">

              Configure VITE_MAPTILER_API_KEY to load the street map.

            </div>

          ) : (

            <MapTilerRouteMap

              className="flex-1 h-full min-h-[280px]"

              routes={routes}

              fastestRouteId={plan?.fastestRouteId ?? null}

              recommendedRouteId={plan?.recommendedRouteId ?? null}

              markers={{

                from: from ? { ...from, label: from.label } : undefined,

                to: to ? { ...to, label: to.label } : undefined,

              }}

            />

          )}

          <p className="text-[9px] text-[#64748b] text-center shrink-0 pt-1">

            Routes are GeoJSON LineStrings from OSRM and follow real streets on the MapTiler basemap.

          </p>

        </div>

      </div>

    </div>

  );

}


