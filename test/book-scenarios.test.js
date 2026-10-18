import { test } from 'node:test';
import assert from 'node:assert/strict';

import { simulate } from '../sim/simulation.js';
import { stopAndWait } from '../protocols/stop-and-wait.js';
import { goBackN } from '../protocols/go-back-n.js';

const run = proto => simulate(proto, { ...proto.book.params, forcedLosses: proto.book.losses });
const seqs = (trace, kind) => trace.transmissions.filter(tx => tx.kind === kind).map(tx => tx.seq);

test('parada y espera reproduce la figura stop-and-wait', () => {
  const trace = run(stopAndWait);
  assert.deepEqual(seqs(trace, 'data'), [0, 1, 1, 0, 0]);
  assert.deepEqual(seqs(trace, 'ack'), [1, 0, 1, 1]);
  assert.deepEqual(trace.notes.map(n => n.text), ['duplicado!']);
  assert.deepEqual(trace.deliveries.map(d => d.abs), [0, 1, 2]);
  assert.equal(trace.timers.filter(tm => tm.end === 'expire').length, 2);
});

test('repetición continua reproduce la figura go-back-n', () => {
  const trace = run(goBackN);
  assert.deepEqual(seqs(trace, 'data'), [0, 1, 2, 3, 1, 2, 3]);
  assert.deepEqual(seqs(trace, 'ack'), [1, 1, 1, 2, 3, 0]);
  assert.deepEqual(trace.notes.map(n => n.text), ['descartado', 'descartado']);
  assert.deepEqual(trace.deliveries.map(d => d.abs), [0, 1, 2, 3]);
  assert.deepEqual(
    trace.timers.filter(tm => tm.end === 'expire').map(tm => tm.abs), [1, 2, 3]);
});

test('sin pérdidas no hay retransmisiones', () => {
  const trace = simulate(goBackN, { count: 6 });
  assert.ok(trace.transmissions.every(tx => !tx.rtx));
  assert.equal(trace.deliveries.length, 6);
});
