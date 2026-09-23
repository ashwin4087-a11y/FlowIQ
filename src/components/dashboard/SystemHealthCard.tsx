import type { BrainState, SystemHealth } from '../../types/flowiq';

type CvDisplay = {
  cvInput?: string;
  yoloAdapter?: string;
  modelWeights?: string;
};

function dot(ok: boolean | 'warn' | 'off') {
  if (ok === true) return 'bg-[#10B981]';
  if (ok === 'warn') return 'bg-[#F59E0B]';
  return 'bg-[#64748b]';
}

export function SystemHealthCard({
  backendOnline,
  socketConnected,
  system,
  brain,
  cvDisplay,
}: {
  backendOnline: boolean;
  socketConnected: boolean;
  system: SystemHealth;
  brain?: BrainState;
  trafficSource?: string;
  cvDisplay?: CvDisplay;
}) {
  const adaptStatus =
    brain?.activeController === 'RL_MODEL' ? 'RL MODEL' : 'HEURISTIC FALLBACK';

  const eyesStatus = cvDisplay?.cvInput ?? 'SIMULATION INPUT';

  const predictionStatus =
    system.surgeModel === 'ready' ? 'MODEL READY' : 'NOT LOADED';

  const fsmStatus = backendOnline
    ? (brain?.signalControllerMode ?? 'ACTIVE').replace(/_/g, ' ')
    : 'LOCAL';

  const emergencyStatus = !backendOnline
    ? 'OFFLINE'
    : system.audioModel === 'ready'
      ? 'READY'
      : 'READY (CONFIRMATION)';

  const twinStatus = backendOnline ? 'CONNECTED' : 'LOCAL SIM';

  const routeStatus = backendOnline ? 'ONLINE' : 'OFFLINE';

  const backendStatus = backendOnline ? 'ONLINE' : 'OFFLINE';
  const socketStatus =
    !backendOnline ? 'DISCONNECTED' : socketConnected ? 'CONNECTED' : 'DISCONNECTED';

  const rows: { label: string; status: string; ok: boolean | 'warn' | 'off' }[] = [
    {
      label: 'BACKEND',
      status: backendStatus,
      ok: backendOnline ? true : 'off',
    },
    {
      label: 'SOCKET',
      status: socketStatus,
      ok: backendOnline ? (socketConnected ? true : 'warn') : 'off',
    },
    {
      label: 'PREDICTION',
      status: predictionStatus,
      ok: system.surgeModel === 'ready' ? true : 'warn',
    },
    {
      label: 'ADAPT',
      status: adaptStatus,
      ok: brain?.activeController === 'RL_MODEL' ? true : 'warn',
    },
    {
      label: 'EYES',
      status: eyesStatus,
      ok: eyesStatus === 'CV MODEL' ? true : 'warn',
    },
    {
      label: 'SIGNAL FSM',
      status: backendOnline ? 'ACTIVE' : fsmStatus,
      ok: backendOnline ? true : 'off',
    },
    {
      label: 'EMERGENCY',
      status: emergencyStatus,
      ok: backendOnline ? (system.audioModel === 'ready' ? true : 'warn') : 'off',
    },
    {
      label: 'DIGITAL TWIN',
      status: twinStatus,
      ok: backendOnline ? true : 'warn',
    },
    {
      label: 'ROUTE',
      status: routeStatus,
      ok: backendOnline ? true : 'off',
    },
  ];

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
      <h3 className="text-sm font-semibold tracking-wide mb-4">FLOWIQ SYSTEM</h3>
      <ul className="space-y-2.5 font-mono text-[11px]">
        {rows.map((r) => (
          <li key={r.label} className="grid grid-cols-[1fr_auto] items-center gap-3">
            <span className="flex items-center gap-2 text-[#94A3B8] uppercase tracking-wide">
              <span className={`w-2 h-2 rounded-full shrink-0 ${dot(r.ok)}`} aria-hidden />
              {r.label}
            </span>
            <span className="text-[#F8FAFC] text-right uppercase">{r.status}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 pt-3 border-t border-[#334155] text-[10px] text-[#64748b] leading-relaxed">
        Simulation environment · Not connected to physical traffic infrastructure
      </p>
    </div>
  );
}
