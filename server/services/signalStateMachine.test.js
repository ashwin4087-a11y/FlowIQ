import assert from 'node:assert/strict';
import { SignalStateMachine } from './signalStateMachine.js';

const sm = new SignalStateMachine();
const signals = {
  activePhase: 'EAST_WEST_GREEN',
  remainingSeconds: 1,
  phases: {
    NORTH_SOUTH_GREEN: { durationSec: 45 },
    NORTH_SOUTH_YELLOW: { durationSec: 4 },
    ALL_RED: { durationSec: 2 },
    EAST_WEST_GREEN: { durationSec: 40 },
    EAST_WEST_YELLOW: { durationSec: 4 },
  },
};

sm.tickSecond(signals, { active: false });
assert.equal(signals.remainingSeconds, 0);

sm.tickSecond(signals, { active: false });
assert.equal(signals.activePhase, 'EAST_WEST_YELLOW');

const invalid = sm.validateRlAction('TELEPORT_PHASE');
assert.equal(invalid.ok, false);

console.log('signalStateMachine.test.js: passed');
