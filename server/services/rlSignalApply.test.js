import assert from 'node:assert/strict';
import { applyRlSignalAction } from './rlSignalApply.js';

const signals = { activePhase: 'NORTH_SOUTH_GREEN', remainingSeconds: 10 };
const r = applyRlSignalAction(signals, 'EXTEND_NS_GREEN');
assert.equal(r.applied, true);
assert.equal(signals.remainingSeconds, 16);

const signals2 = { activePhase: 'NORTH_SOUTH_GREEN', remainingSeconds: 10 };
const r2 = applyRlSignalAction(signals2, 'EXTEND_EW_GREEN');
assert.equal(r2.applied, false);

console.log('rlSignalApply.test.js: passed');
