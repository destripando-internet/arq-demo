import { test } from 'node:test';
import assert from 'node:assert/strict';

import { simulate } from '../sim/simulation.js';
import { goBackN } from '../protocols/go-back-n.js';
import { selectiveRepeat } from '../protocols/selective-repeat.js';
import { senderAt, tapeCells } from '../ui/tape.js';

test('tape: messages leave, get confirmed and the window slides', () => {
  // Go-back-N, k = 2, Ws = 3, 4 messages, 1 lost.
  const trace = simulate(goBackN, { ...goBackN.book.params, forcedLosses: ['d1.1'] });
  assert.deepEqual(tapeCells(trace, -1e-6), ['unsent', 'unsent', 'unsent', 'unsent']);
  assert.deepEqual(tapeCells(trace, 2.5), ['sent', 'sent', 'sent', 'unsent']);
  // At t = 3 ack 1 arrives and 3 leaves at once.
  assert.deepEqual(tapeCells(trace, 3), ['done', 'sent', 'sent', 'sent']);
  assert.equal(senderAt(trace, 3).base, 1);
  // The duplicate ACKs 1 do not move the window; ack 2 does, at t = 10.
  assert.equal(senderAt(trace, 9.9).base, 1);
  assert.equal(senderAt(trace, 10).base, 2);
  assert.deepEqual(tapeCells(trace, trace.end), ['done', 'done', 'done', 'done']);
});

test('tape: with selective repeat, confirmed messages inside the window', () => {
  const trace = simulate(selectiveRepeat, { forcedLosses: ['d2.1'] });
  // After the ACKs of 3, 4 and 5 arrive the window is still held by 2.
  assert.deepEqual(tapeCells(trace, 8.5), ['done', 'done', 'sent', 'done', 'done', 'done']);
  assert.equal(senderAt(trace, 8.5).base, 2);
});
