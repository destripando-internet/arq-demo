import { test } from 'node:test';
import assert from 'node:assert/strict';

import { simulate } from '../sim/simulation.js';
import { PROTOCOLS } from '../protocols/index.js';
import { stopAndWait } from '../protocols/stop-and-wait.js';
import { goBackN } from '../protocols/go-back-n.js';
import { selectiveRepeat } from '../protocols/selective-repeat.js';

const run = (proto, opts = {}) =>
  simulate(proto, { ...proto.book.params, forcedLosses: proto.book.losses, ...opts });
const seqs = (trace, kind) => trace.transmissions.filter(tx => tx.kind === kind).map(tx => tx.seq);
const delivered = trace => trace.deliveries.map(d => d.abs);
const expired = trace => trace.timers.filter(tm => tm.end === 'expire').map(tm => tm.abs);
const failed = trace => trace.notes.some(n => n.cls === 'bad');
const lostAcks = n => Array.from({ length: n }, (_, i) => `a${i + 1}`);

test('stop-and-wait reproduces the stop-and-wait figure', () => {
  const trace = run(stopAndWait);
  assert.deepEqual(seqs(trace, 'data'), [0, 1, 1, 0, 0]);
  assert.deepEqual(seqs(trace, 'ack'), [1, 0, 1, 1]);
  assert.deepEqual(trace.notes.map(n => n.text), ['duplicate']);
  assert.deepEqual(delivered(trace), [0, 1, 2]);
  assert.equal(expired(trace).length, 2);
});

test('stop-and-wait: a timer shorter than the RTT causes duplicates but no failure', () => {
  const trace = run(stopAndWait, { timeout: 2, forcedLosses: [] });
  assert.ok(trace.notes.some(n => n.text === 'duplicate'));
  assert.ok(!failed(trace));
  assert.deepEqual(delivered(trace), [0, 1, 2]);
});

test('go-back-N reproduces the go-back-n figure', () => {
  const trace = run(goBackN);
  assert.deepEqual(seqs(trace, 'data'), [0, 1, 2, 3, 1, 2, 3]);
  assert.deepEqual(seqs(trace, 'ack'), [1, 1, 1, 2, 3, 0]);
  assert.deepEqual(trace.notes.map(n => n.text), ['discarded', 'discarded']);
  assert.deepEqual(delivered(trace), [0, 1, 2, 3]);
  // When timer 1 expires, 2 and 3 are retransmitted too. They were sent
  // back to back, so their timers expire just as they are retransmitted, as
  // the figure draws them.
  assert.deepEqual(expired(trace), [1, 2, 3]);
  assert.ok(trace.timers.every(tm => !tm.restarted));
});

test('go-back-N: a timer retransmitted before it is due restarts', () => {
  // Window 2: message 2 leaves at t = 3, when the ACK of 0 arrives. Timer 1
  // expires at 7 and 2 is retransmitted at 8, before its timer is due (9).
  const trace = simulate(goBackN, { k: 2, window: 2, count: 3, timeout: 6, forcedLosses: ['d1.1'] });
  assert.deepEqual(expired(trace), [1]);
  assert.deepEqual(trace.timers.filter(tm => tm.restarted).map(tm => [tm.abs, tm.tStart]), [[2, 8]]);
});

test('go-back-N: losing an ACK causes no retransmission', () => {
  const trace = run(goBackN, { forcedLosses: ['a1'] });
  assert.ok(trace.transmissions.every(tx => !tx.rtx));
  assert.deepEqual(delivered(trace), [0, 1, 2, 3]);
});

test('go-back-N with individual ACKs: losing an ACK leads to an endless loop', () => {
  const trace = run(goBackN, { ack: 'individual', forcedLosses: ['a1'] });
  assert.equal(trace.done, null);
  assert.deepEqual(trace.loop, { t: 12, abs: 0 });
  // Detected at the second expiry: a single useless retransmission.
  assert.equal(trace.transmissions.filter(tx => tx.rtx).length, 1);
});

test('no false loops: premature timers, lost retransmissions, random losses', () => {
  assert.equal(run(stopAndWait, { timeout: 0.5, forcedLosses: [] }).loop, null);
  const lost2 = ['d2.1', 'd2.2', 'd2.3'];
  const sr = run(selectiveRepeat, { ack: 'cumulative', forcedLosses: lost2 });
  assert.equal(sr.loop, null);
  assert.notEqual(sr.done, null);
  for (const proto of PROTOCOLS)
    for (const seed of [1, 2, 3, 4, 5]) {
      const trace = simulate(proto, { count: 10, lossRate: 0.3, seed });
      assert.equal(trace.loop, null, `${proto.id} seed ${seed}`);
      assert.notEqual(trace.done, null, `${proto.id} seed ${seed}`);
    }
});

test('go-back-N with individual ACKs works while no ACK is lost', () => {
  const trace = run(goBackN, { ack: 'individual' });
  assert.deepEqual(seqs(trace, 'data'), [0, 1, 2, 3, 1, 2, 3]);
  assert.notEqual(trace.done, null);
});

test('go-back-N: with Ws = 2^k − 1 it survives losing every ACK', () => {
  const trace = run(goBackN, { forcedLosses: lostAcks(3) });
  assert.ok(!failed(trace));
  assert.deepEqual(delivered(trace), [0, 1, 2, 3]);
});

test('go-back-N: with Ws = 2^k the receiver accepts a duplicate (book example)', () => {
  const trace = run(goBackN, { window: 4, count: 5, forcedLosses: lostAcks(4) });
  assert.ok(failed(trace));
});

test('selective repeat with individual ACKs: only the lost message is retransmitted', () => {
  const trace = run(selectiveRepeat, { ack: 'individual' });
  assert.deepEqual(seqs(trace, 'data'), [0, 1, 2, 3, 4, 5, 2]);
  assert.deepEqual(seqs(trace, 'ack'), [1, 2, 4, 5, 6, 3]);
  assert.deepEqual(delivered(trace), [0, 1, 2, 3, 4, 5]);
});

test('selective repeat with cumulative ACKs: buffered messages are retransmitted too', () => {
  const trace = run(selectiveRepeat, { ack: 'cumulative' });
  // Ack 6 arrives just when the timer of 5 would expire: it wins.
  assert.deepEqual(seqs(trace, 'data'), [0, 1, 2, 3, 4, 5, 2, 3, 4]);
  assert.deepEqual(seqs(trace, 'ack'), [1, 2, 2, 2, 2, 6, 6, 6]);
  assert.deepEqual(delivered(trace), [0, 1, 2, 3, 4, 5]);
});

test('cumulative ACKs: the example in the text, messages [0-3]', () => {
  const trace = run(selectiveRepeat, { ack: 'cumulative', count: 4 });
  assert.deepEqual(seqs(trace, 'data'), [0, 1, 2, 3, 2, 3]);
  assert.deepEqual(seqs(trace, 'ack'), [1, 2, 2, 4, 4]);
  assert.deepEqual(expired(trace), [2, 3]);
});

test('selective repeat: a duplicate that was already delivered is confirmed again', () => {
  const trace = run(selectiveRepeat, { ack: 'individual', forcedLosses: ['a2'] });
  assert.deepEqual(seqs(trace, 'data'), [0, 1, 2, 3, 4, 1, 5]);
  assert.deepEqual(seqs(trace, 'ack'), [1, 2, 3, 4, 5, 2, 6]);
  assert.deepEqual(trace.notes.map(n => n.text), ['duplicate']);
});

test('selective repeat: W = 2^(k−1) works and W = 2^(k−1) + 1 fails', () => {
  for (const ack of selectiveRepeat.ackModes) {
    assert.ok(!failed(run(selectiveRepeat, { ack, count: 8, forcedLosses: lostAcks(4) })), ack);
    assert.ok(failed(run(selectiveRepeat, { ack, window: 5, count: 10, forcedLosses: lostAcks(5) })), ack);
  }
});

test('no losses, no retransmissions', () => {
  for (const proto of PROTOCOLS) {
    const trace = simulate(proto, { count: 6 });
    assert.ok(trace.transmissions.every(tx => !tx.rtx), proto.id);
    assert.equal(trace.deliveries.length, 6, proto.id);
  }
});

test('go-back-N: each later timer expires as its retransmission leaves, also with decimal delays', () => {
  // With Ttrans = 0.8, floating point used to put the expiry a moment
  // before the retransmission, and both were drawn.
  const trace = simulate(goBackN, { k: 4, window: 14, count: 12, tTrans: 0.8, tProp: 5, timeout: 11, forcedLosses: ['d0.1'] });
  const rtx = new Map(trace.transmissions.filter(tx => tx.rtx).map(tx => [tx.abs, tx.tDep]));
  const expiries = trace.timers.filter(tm => tm.end === 'expire');
  assert.deepEqual(expiries.map(tm => tm.abs), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.ok(expiries.every(tm => tm.tEnd === rtx.get(tm.abs)));
  assert.ok(trace.timers.every(tm => !tm.restarted));
});
