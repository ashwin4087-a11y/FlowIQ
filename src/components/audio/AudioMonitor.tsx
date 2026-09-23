import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';
import type { FlowIQState } from '../../types/flowiq';

export function AudioMonitor({
  backendOnline,
  audio,
  onUpload,
}: {
  backendOnline: boolean;
  audio: FlowIQState['audio'];
  onUpload: (file: File) => void;
}) {
  const probs = audio.temporal.recentProbabilities.map((p, i) => ({ t: i, p }));
  const modelStatus = audio.modelLoaded ? 'READY' : 'NOT LOADED';

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Audio Intelligence</h3>
        <span className="text-xs text-[#94A3B8]">MODEL: {modelStatus}</span>
      </div>
      <div className="text-xs text-[#94A3B8]">
        Microphone: {backendOnline ? 'API connected (upload clip to test)' : 'BACKEND OFFLINE'}
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-[#94A3B8] text-xs">Classification</p>
          <p className="text-white font-mono">{audio.lastEvent?.event ?? '—'}</p>
        </div>
        <div>
          <p className="text-[#94A3B8] text-xs">Siren probability</p>
          <p className="text-white font-mono">
            {audio.lastEvent?.probability != null ? `${Math.round(audio.lastEvent.probability * 100)}%` : '—'}
          </p>
        </div>
      </div>
      <p className="text-xs">
        Status:{' '}
        <span className="text-[#10B981] font-semibold">{audio.temporal.status}</span>
        <span className="text-[#64748b] ml-2">(temporal smoothing)</span>
      </p>
      {probs.length > 0 && (
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={probs}>
              <YAxis domain={[0, 1]} hide />
              <Line type="monotone" dataKey="p" stroke="#ef4444" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <label className="block text-xs text-[#94A3B8]">
        Upload WAV (3s+) for inference
        <input
          type="file"
          accept="audio/*"
          className="mt-1 block w-full text-xs"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
          }}
        />
      </label>
    </div>
  );
}
