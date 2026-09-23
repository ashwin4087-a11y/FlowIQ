/**
 * Signal controller abstraction.
 * HeuristicSignalController is the only active implementation.
 * RLSignalController is a stub for future SUMO / Stable-Baselines3 integration.
 */

export class HeuristicSignalController {
  constructor() {
    this.mode = 'HEURISTIC';
  }

  /**
   * @param {{ lanes: Array<{ direction: string, queueLength: number }> }} traffic
   */
  decide(traffic) {
    const lanes = traffic?.lanes ?? [];
    const ns = lanes.filter((l) => l.direction === 'NORTH' || l.direction === 'SOUTH');
    const ew = lanes.filter((l) => l.direction === 'EAST' || l.direction === 'WEST');
    const nsQueue = ns.reduce((a, l) => a + (l.queueLength ?? 0), 0);
    const ewQueue = ew.reduce((a, l) => a + (l.queueLength ?? 0), 0);

    let label = 'Balanced phase timing';
    if (ewQueue > nsQueue + 5) {
      label = 'Extended EAST/WEST green (queue imbalance)';
    } else if (nsQueue > ewQueue + 5) {
      label = 'Extended NORTH/SOUTH green (queue imbalance)';
    }

    return {
      mode: this.mode,
      lastDecision: {
        label,
        source: 'heuristic_controller',
        simulated: true,
        nsQueue,
        ewQueue,
      },
    };
  }
}

export class RLSignalController {
  constructor() {
    this.mode = 'RL';
  }

  decide() {
    throw new Error('RL signal controller not connected (SUMO agent not deployed)');
  }
}

export const heuristicController = new HeuristicSignalController();
