/**
 * Emergency event lifecycle (software prototype — simulation only).
 * Status: idle | candidate | active | clearing | restored
 */

let eventSeq = 1;

export function createEmergencyEventId() {
  const id = `EMG-SIM-${String(eventSeq).padStart(4, '0')}`;
  eventSeq += 1;
  return id;
}

export function baseEmergencyFields() {
  return {
    eventId: null,
    status: 'idle',
    affectedJunctions: ['chennai-prototype-1'],
    affectedSignals: ['signal-ns-nw', 'signal-ew-ne'],
    greenWavePlan: null,
    restoredAt: null,
  };
}
