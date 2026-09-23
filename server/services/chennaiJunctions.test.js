import assert from 'node:assert/strict';
import { getChennaiJunctionById, getChennaiJunctions } from './chennaiJunctions.js';

const list = getChennaiJunctions();
assert.equal(list.length, 8);
assert.ok(getChennaiJunctionById('1')?.name.includes('Anna Nagar'));
assert.equal(getChennaiJunctionById('999'), undefined);
console.log('chennaiJunctions.test.js: passed');
