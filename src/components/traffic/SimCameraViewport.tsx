import { useEffect, useMemo, useState } from 'react';
import {
  CHENNAI_JUNCTIONS,
  junctionReceivesDigitalTwinTelemetry,
  resolveChennaiListIdForBackend,
} from '../../data/chennaiJunctions';
import { formatCameraInputStatus } from '../../lib/cvCameraInputStatus';
import type { FlowIQState, SignalPhase } from '../../types/flowiq';
import { TrafficDigitalTwin } from './TrafficDigitalTwin';
import { SIMULATION_CAMERA_MODE_LABEL, type SimulationCameraMode } from './cameraViews';
import { approachForChennaiJunction } from './junctionLayout';

export function SimCameraViewport({
  vehicles,
  signalPhase,
  flowState,
}: {
  vehicles: FlowIQState['vehicles'];
  signalPhase: SignalPhase;
  flowState: FlowIQState;
}) {
  const [junctionListId, setJunctionListId] = useState(() =>
    resolveChennaiListIdForBackend(flowState.junctionId),
  );
  const [cameraMode, setCameraMode] = useState<SimulationCameraMode>('cctv');
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    setJunctionListId(resolveChennaiListIdForBackend(flowState.junctionId));
  }, [flowState.junctionId]);

  const junction = useMemo(
    () => CHENNAI_JUNCTIONS.find((j) => j.id === junctionListId) ?? CHENNAI_JUNCTIONS[0],
    [junctionListId],
  );

  const approach = useMemo(() => {
    return approachForChennaiJunction(junction.lat, junction.lng);
  }, [junction.lat, junction.lng]);

  useEffect(() => {
    setCameraError(null);
  }, [junctionListId, cameraMode]);

  const hasTwinTelemetry = junctionReceivesDigitalTwinTelemetry(junctionListId, flowState.junctionId);
  const phaseLabel = flowState.signals.activePhase.replace(/_/g, ' ');
  const modeLabel = SIMULATION_CAMERA_MODE_LABEL[cameraMode];
  const cameraInput = formatCameraInputStatus(
    flowState.system.cvDisplay,
    flowState.system.cvMode,
    flowState.traffic.source,
  );

  return (
    <div className="relative flex flex-col gap-2 min-h-[420px]">
      <div className="absolute top-2 left-2 right-2 z-10 flex flex-wrap items-start justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex flex-wrap gap-2 max-w-full">
          <label className="text-[10px] text-[#94A3B8] flex flex-col gap-0.5 min-w-[140px]">
            <span className="uppercase tracking-wide">Signal / Junction</span>
            <select
              className="bg-[#0F172A]/95 border border-[#334155] rounded px-2 py-1.5 text-xs text-[#E2E8F0]"
              value={junctionListId}
              onChange={(e) => setJunctionListId(e.target.value)}
            >
              {CHENNAI_JUNCTIONS.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            <label className="text-[10px] text-[#94A3B8] flex flex-col gap-0.5 min-w-[120px]">
              <span className="uppercase tracking-wide">Twin view</span>
              <select
                className="bg-[#0F172A]/95 border border-[#334155] rounded px-2 py-1.5 text-xs text-[#E2E8F0]"
                value={cameraMode}
                onChange={(e) => setCameraMode(e.target.value as SimulationCameraMode)}
              >
                <option value="cctv">CCTV</option>
                <option value="intersection">INTERSECTION</option>
                <option value="top-down">TOP DOWN</option>
              </select>
            </label>
            <div className="text-[10px] text-[#94A3B8] flex flex-col gap-0.5 min-w-[140px] bg-[#0F172A]/95 border border-[#334155] rounded px-2 py-1.5">
              <span className="uppercase tracking-wide">Camera input</span>
              <span className="text-[11px] font-semibold text-[#E2E8F0]">YOLOv8 · lane camera</span>
              <span className="flex items-center gap-1.5 text-[10px] text-[#CBD5E1]">
                <span className={`w-1.5 h-1.5 rounded-full ${cameraInput.dotClass}`} aria-hidden />
                {cameraInput.status}
              </span>
            </div>
          </div>
        </div>
        <div className="pointer-events-none text-right text-[10px] text-[#94A3B8] bg-[#0F172A]/80 border border-[#334155]/80 rounded px-2 py-1">
          <p className="text-[#10B981] font-semibold flex items-center justify-end gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" aria-hidden />
            LIVE SIMULATION
          </p>
          <p className="text-[#64748b]">DIGITAL TWIN · {modeLabel} VIEW</p>
          <p className="text-[#94A3B8] mt-0.5">{junction.name}</p>
        </div>
      </div>

      {cameraError && (
        <p className="absolute top-[4.5rem] left-2 z-10 text-[10px] text-[#F59E0B] bg-[#0F172A]/90 px-2 py-1 rounded border border-[#F59E0B]/30 pointer-events-none">
          {cameraError}
        </p>
      )}

      <TrafficDigitalTwin
        vehicles={vehicles}
        signalPhase={signalPhase}
        cameraApproach={approach}
        cameraMode={cameraMode}
        highlightedApproach={approach}
      />

      <div
        className="absolute bottom-2 left-2 right-2 z-10 pointer-events-none rounded border border-[#334155]/80 bg-[#0F172A]/88 px-3 py-2 text-[10px] text-[#94A3B8] font-mono leading-relaxed"
        aria-live="polite"
      >
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>
            <span className="text-[#64748b]">TWIN VIEW:</span> {modeLabel}
          </span>
          <span>
            <span className="text-[#64748b]">CAMERA INPUT:</span> {cameraInput.status}
          </span>
          <span>
            <span className="text-[#64748b]">SIGNAL:</span> {junction.name}
          </span>
          {hasTwinTelemetry && (
            <>
              <span>
                <span className="text-[#64748b]">VEHICLES:</span> {vehicles.length}
              </span>
              {typeof flowState.traffic.queueLength === 'number' && (
                <span>
                  <span className="text-[#64748b]">QUEUE:</span> {flowState.traffic.queueLength}
                </span>
              )}
              <span>
                <span className="text-[#64748b]">PHASE:</span> {phaseLabel}
              </span>
              {typeof flowState.signals.remainingSeconds === 'number' && (
                <span>
                  <span className="text-[#64748b]">PHASE REMAINING:</span> {flowState.signals.remainingSeconds}s
                </span>
              )}
            </>
          )}
        </div>
        {!hasTwinTelemetry && (
          <p className="text-[#64748b] mt-1 normal-case font-sans text-[10px]">
            Observation framing uses FlowIQ map geometry. Twin telemetry is linked to{' '}
            {flowState.junctionName || 'the active digital twin junction'}.
          </p>
        )}
        <p className="text-[#475569] mt-1 normal-case font-sans text-[9px]">
          Twin view is a 3D visualization mode · YOLOv8 lane camera is the CV input pipeline
        </p>
      </div>
    </div>
  );
}
