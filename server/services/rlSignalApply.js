/** Apply validated RL actions to in-memory signal state (prototype junction). */

const MAX_GREEN = 90;

export function applyRlSignalAction(signals, action) {
  if (!signals || !action) return { applied: false };
  const phase = signals.activePhase;
  switch (action) {
    case 'HOLD':
      return { applied: true, label: 'RL: hold current phase' };
    case 'EXTEND_NS_GREEN':
      if (phase === 'NORTH_SOUTH_GREEN') {
        signals.remainingSeconds = Math.min(MAX_GREEN, (signals.remainingSeconds ?? 0) + 6);
        return { applied: true, label: 'RL: extended NORTH/SOUTH green' };
      }
      return { applied: false, label: 'RL: extend NS rejected (wrong phase)' };
    case 'EXTEND_EW_GREEN':
      if (phase === 'EAST_WEST_GREEN') {
        signals.remainingSeconds = Math.min(MAX_GREEN, (signals.remainingSeconds ?? 0) + 6);
        return { applied: true, label: 'RL: extended EAST/WEST green' };
      }
      return { applied: false, label: 'RL: extend EW rejected (wrong phase)' };
    case 'NEXT_PHASE':
      signals.remainingSeconds = 0;
      return { applied: true, label: 'RL: request phase advance' };
    default:
      return { applied: false };
  }
}
