import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { TrafficLightLogo } from './components/TrafficLightLogo';

const SimCameraViewport = lazy(() =>
  import('../components/traffic/SimCameraViewport').then((m) => ({ default: m.SimCameraViewport })),
);
import { AudioMonitor } from '../components/audio/AudioMonitor';
import { SystemHealthCard } from '../components/dashboard/SystemHealthCard';
import { OverviewFestivalCard } from '../components/dashboard/OverviewFestivalCard';
import { ScenarioRunner } from '../components/dashboard/ScenarioRunner';
import { confirmAudioEmergency } from '../lib/api';
import { TrafficSimulation } from '../../simulation/digital-twin/trafficSimulation';
import type { FlowIQRuntime } from '../hooks/useFlowIQRuntime';
import type { TrafficDensity, TrafficMode } from '../types/flowiq';
import {
  fetchState,
  postDemoEmergency,
  postTrafficMode,
  predictAudio,
  syncSimulation,
} from '../lib/api';

export default function FlowIQDashboard({
  shell = 'full',
  runtime,
  onOpenSurge,
}: {
  shell?: 'full' | 'content';
  runtime: FlowIQRuntime;
  onOpenSurge?: () => void;
}) {
  const { state, setState, backendOnline, socketConnected, refreshState } = runtime;
  const simRef = useRef(new TrafficSimulation());
  const [density, setDensity] = useState<TrafficDensity>('MEDIUM');
  const [vehicles, setVehicles] = useState(state.vehicles);
  const syncCounter = useRef(0);
  const handledEmergencyTs = useRef<string | null>(null);

  useEffect(() => {
    simRef.current.setSignalPhase(state.signals.activePhase);
    if (state.trafficMode) simRef.current.setTrafficMode(state.trafficMode);
  }, [state.signals.activePhase, state.trafficMode]);

  useEffect(() => {
    const em = state.emergency;
    if (!em.active || !em.greenWaveActive || !em.timestamp) return;
    if (handledEmergencyTs.current === em.timestamp) return;
    handledEmergencyTs.current = em.timestamp;
    const vtype = em.type === 'FIRE_TRUCK' ? 'FIRE_TRUCK' : 'AMBULANCE';
    simRef.current.spawnEmergency(vtype);
    simRef.current.setSignalPhase(state.signals.activePhase);
  }, [state.emergency, state.signals.activePhase]);

  useEffect(() => {
    simRef.current.setDensity(density);
  }, [density]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const sim = simRef.current;
      sim.setSignalPhase(state.signals.activePhase);
      sim.tick(dt);
      const v = sim.toVehicleStates();
      setVehicles(v);
      syncCounter.current += dt;
      if (backendOnline && syncCounter.current > 2) {
        syncCounter.current = 0;
        const m = sim.metrics();
        syncSimulation({
          traffic: {
            ...m,
            timestamp: new Date().toISOString(),
            junctionId: state.junctionId,
            source: 'simulation',
            simulated: true,
          },
          vehicles: v,
        }).catch(() => {});
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [backendOnline, state.signals.activePhase, state.junctionId]);

  const onSurgeToggle = async (mode: TrafficMode) => {
    simRef.current.setTrafficMode(mode);
    if (backendOnline) {
      const s = await postTrafficMode(mode);
      setState(s);
    } else {
      setState((prev) => ({
        ...prev,
        trafficMode: mode,
        scenarioNote:
          mode === 'SURGE' ? 'SIMULATION: festival surge traffic influx' : null,
      }));
    }
  };

  const onDemoEmergency = async () => {
    if (backendOnline) {
      await postDemoEmergency({ type: 'AMBULANCE', direction: 'EAST' });
      const s = await fetchState();
      setState(s);
    } else {
      simRef.current.spawnEmergency('AMBULANCE');
      simRef.current.setSignalPhase('EAST_WEST_GREEN');
    }
  };

  const onAudioUpload = useCallback(
    async (file: File) => {
      if (!backendOnline) return;
      const res = await predictAudio(file);
      if (res.status === 'ok' || res.status === 'model_not_loaded') {
        await refreshState();
      }
    },
    [backendOnline, refreshState],
  );

  const phaseLabel = state.signals.activePhase.replace(/_/g, ' ');
  const vehicleCount = state.traffic.vehicleCount || vehicles.length;
  const adaptController =
    state.brain?.activeController === 'RL_MODEL' ? 'PPO' : 'HEURISTIC FALLBACK';

  const statusBar = (
    <div className="flex items-center gap-3 text-xs flex-wrap px-4 pt-3">
      <span
        className={`px-2 py-1 rounded font-semibold ${
          backendOnline ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#EF4444]/20 text-[#EF4444]'
        }`}
      >
        {backendOnline ? 'BACKEND ONLINE' : 'BACKEND OFFLINE — LOCAL SIMULATION'}
      </span>
      <span className="px-2 py-1 rounded bg-[#0F172A] text-[#94A3B8]">
        ADAPT: {adaptController}
      </span>
      <span className="px-2 py-1 rounded bg-[#0F172A] text-[#F8FAFC] font-medium">
        {state.junctionName}
      </span>
    </div>
  );

  return (
    <div className={shell === 'full' ? 'min-h-screen bg-[#0B1220] text-white' : 'text-white'}>
      {shell === 'full' && (
        <header className="border-b border-[#334155] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TrafficLightLogo />
            <div>
              <h1 className="text-xl font-semibold">FlowIQ</h1>
              <p className="text-xs text-[#94A3B8]">Adaptive Urban Traffic Intelligence</p>
            </div>
          </div>
          {statusBar}
        </header>
      )}
      {shell === 'content' && statusBar}

      <div className="p-4 grid grid-cols-12 gap-4 min-h-[calc(100vh-88px)]">
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <SystemHealthCard
            backendOnline={backendOnline}
            socketConnected={socketConnected}
            system={state.system}
            brain={state.brain}
            trafficSource={state.traffic.source}
            cvDisplay={state.system.cvDisplay}
          />
          <ScenarioRunner
            backendOnline={backendOnline}
            scenario={state.scenario}
            adaptController={state.brain?.activeController}
            cvMode={state.system.cvMode}
            rlLoaded={state.system.rlController === 'ready'}
            onState={() => refreshState()}
          />
          <AudioMonitor backendOnline={backendOnline} audio={state.audio} onUpload={onAudioUpload} />
        </aside>

        <main className="col-span-12 lg:col-span-6 flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2 px-1">
            <h2 className="text-sm font-semibold tracking-wide text-[#F8FAFC] uppercase">
              {state.junctionName}
            </h2>
            <span className="text-[10px] text-[#64748b]">LIVE SIMULATION</span>
          </div>
          <Suspense
            fallback={
              <div className="min-h-[min(58vh,520px)] rounded-xl bg-[#0f172a] flex items-center justify-center text-[#94A3B8] text-sm">
                Loading digital twin…
              </div>
            }
          >
            <SimCameraViewport
              vehicles={vehicles}
              signalPhase={state.signals.activePhase}
              flowState={state}
            />
          </Suspense>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono rounded-lg bg-[#0F172A]/60 px-3 py-2">
            <div>
              <span className="text-[#64748b] block">Queue</span>
              <span>{state.traffic.queueLength}</span>
            </div>
            <div>
              <span className="text-[#64748b] block">Density</span>
              <span>{density}</span>
            </div>
            <div>
              <span className="text-[#64748b] block">Phase</span>
              <span className="truncate">{phaseLabel}</span>
            </div>
            <div>
              <span className="text-[#64748b] block">Remaining</span>
              <span>{state.signals.remainingSeconds}s</span>
            </div>
          </div>
          <p className="text-[10px] text-[#64748b] text-center">
            Digital twin · simulation only · not connected to physical infrastructure
          </p>
        </main>

        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <section className="rounded-lg bg-[#1E293B]/60 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-[#94A3B8] tracking-wide">TRAFFIC</h3>
            <p className="text-2xl font-mono text-[#F8FAFC]">{vehicleCount} vehicles</p>
            <p className="text-sm text-[#94A3B8]">Queue {state.traffic.queueLength}</p>
            <p className="text-sm text-[#94A3B8]">Avg speed {state.traffic.averageSpeedKmh} km/h</p>
            <label className="text-xs text-[#64748b] block">Density</label>
            <select
              className="w-full bg-[#0F172A] border border-[#334155] rounded px-2 py-1.5 text-sm"
              value={density}
              onChange={(e) => setDensity(e.target.value as TrafficDensity)}
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                className="text-[10px] flex-1 py-1.5 rounded bg-[#0F172A] border border-[#334155]"
                onClick={() => onSurgeToggle('NORMAL')}
              >
                NORMAL
              </button>
              <button
                type="button"
                className="text-[10px] flex-1 py-1.5 rounded border border-[#F59E0B]/40 text-[#F59E0B] bg-[#F59E0B]/10"
                onClick={() => onSurgeToggle('SURGE')}
              >
                Festival influx (SIM)
              </button>
            </div>
          </section>

          <section className="rounded-lg bg-[#1E293B]/60 p-4 space-y-2">
            <h3 className="text-xs font-semibold text-[#94A3B8] tracking-wide">ADAPTATION</h3>
            <p className="text-sm">
              Controller: <span className="font-semibold">{adaptController}</span>
            </p>
            <p className="text-sm text-[#94A3B8]">FSM {state.brain?.signalControllerMode ?? '—'}</p>
            <p className="text-sm">{phaseLabel}</p>
            <p className="text-xs text-[#64748b]">{state.signals.lastDecision?.label}</p>
            {state.brain?.recommendation && (
              <p className="text-[10px] text-[#F59E0B] border border-[#F59E0B]/30 rounded px-2 py-1">
                {state.brain.recommendation.label}
              </p>
            )}
          </section>

          {onOpenSurge && (
            <OverviewFestivalCard
              festivalPrediction={state.festivalPrediction}
              onOpenSurge={onOpenSurge}
            />
          )}

          {state.commuterAlerts && state.commuterAlerts.length > 0 && (
            <div className="rounded-lg bg-[#1E293B]/60 p-3 space-y-2">
              <h3 className="text-xs font-semibold text-[#94A3B8]">COMMUTER ALERTS</h3>
              {state.commuterAlerts.map((a) => (
                <p key={a.id} className="text-[11px] text-[#E2E8F0]">{a.message}</p>
              ))}
            </div>
          )}

          <section className="rounded-lg bg-[#1E293B]/60 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-[#94A3B8] tracking-wide">EMERGENCY</h3>
            {state.emergency.audioCandidate && !state.emergency.active && (
              <div className="rounded border border-[#F59E0B]/50 bg-[#F59E0B]/10 p-2 text-xs">
                <p className="text-[#F59E0B] font-semibold">Audio candidate</p>
                <button
                  type="button"
                  className="mt-2 w-full py-2 rounded bg-[#F59E0B] text-[#0F172A] font-semibold"
                  onClick={() =>
                    backendOnline &&
                    confirmAudioEmergency().then(() => refreshState())
                  }
                >
                  Confirm → green wave (sim)
                </button>
              </div>
            )}
            {state.emergency.active && (
              <p className="text-xs text-[#EF4444] font-semibold">
                {state.emergency.label ?? 'EMERGENCY — SIMULATION'}
              </p>
            )}
            <button
              type="button"
              onClick={onDemoEmergency}
              className="w-full py-2.5 rounded-lg bg-[#EF4444] hover:bg-[#dc2626] text-sm font-semibold"
            >
              Demo emergency (simulation)
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
