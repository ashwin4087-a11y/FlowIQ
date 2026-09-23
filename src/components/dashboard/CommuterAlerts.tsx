import type { CommuterAlert } from '../../types/flowiq';

export function CommuterAlerts({ alerts }: { alerts?: CommuterAlert[] }) {
  if (!alerts?.length) {
    return (
      <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3 text-[10px] text-[#64748b]">
        Commuter alerts — no active warnings (forecast-driven only).
      </div>
    );
  }
  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3 space-y-2">
      <h3 className="text-xs font-semibold">VOICE — Commuter alerts</h3>
      {alerts.map((a) => (
        <div key={a.id} className="text-xs border border-[#334155] rounded p-2 bg-[#0F172A]/50">
          <p className="text-[#F59E0B] font-semibold">{a.severity} · {a.simulated ? 'SIMULATION' : 'MODEL'}</p>
          <p className="text-[#E2E8F0] mt-1">{a.message}</p>
          {a.suggestedAction && <p className="text-[#94A3B8] mt-1">{a.suggestedAction}</p>}
        </div>
      ))}
    </div>
  );
}
