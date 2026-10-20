import { test } from 'node:test';
import assert from 'node:assert/strict';

import { simulate } from '../sim/simulation.js';
import { analyze } from '../sim/analysis.js';
import { stopAndWait } from '../protocols/stop-and-wait.js';
import { goBackN } from '../protocols/go-back-n.js';
import { selectiveRepeat } from '../protocols/selective-repeat.js';

const analysis = (proto, opts) => analyze(simulate(proto, opts), proto);

test('window constraint Ws + Wr ≤ 2^k', () => {
  assert.ok(analysis(stopAndWait, {}).windowOk);
  assert.ok(analysis(goBackN, { k: 2, window: 3 }).windowOk);
  assert.ok(!analysis(goBackN, { k: 2, window: 4 }).windowOk);
  assert.ok(analysis(selectiveRepeat, { k: 3, window: 4 }).windowOk);
  assert.ok(!analysis(selectiveRepeat, { k: 3, window: 5 }).windowOk);
});

test('go-back-N requires cumulative ACKs; selective repeat accepts both', () => {
  assert.ok(analysis(goBackN, {}).ackOk);
  assert.ok(analysis(goBackN, { ack: 'cumulative' }).ackOk);
  assert.ok(!analysis(goBackN, { ack: 'individual' }).ackOk);
  for (const ack of selectiveRepeat.ackModes)
    assert.ok(analysis(selectiveRepeat, { ack }).ackOk, ack);
  assert.ok(analysis(stopAndWait, { ack: 'individual' }).ackOk);
});

test('minimum window to keep sending: Ws ≥ 1 + 2a', () => {
  assert.ok(analysis(goBackN, { window: 3, tTrans: 1, tProp: 1 }).efficient);
  assert.ok(!analysis(goBackN, { window: 3, tTrans: 1, tProp: 2 }).efficient);
  assert.ok(analysis(goBackN, { k: 3, window: 5, tTrans: 1, tProp: 2 }).efficient);
  assert.ok(!analysis(stopAndWait, {}).efficient);
  assert.ok(analysis(stopAndWait, {}).fixedWindow && !analysis(goBackN, {}).fixedWindow);
});

test('timer longer than RTT = Ttrans + 2·Tprop', () => {
  assert.ok(!analysis(stopAndWait, { timeout: 3 }).timeoutOk);
  assert.ok(analysis(stopAndWait, { timeout: 3.5 }).timeoutOk);
  assert.equal(analysis(stopAndWait, { tTrans: 0.5, tProp: 2 }).rtt, 4.5);
});

test('measured utilisation tends to min(1, Ws / (1 + 2a))', () => {
  for (const [window, tProp] of [[1, 0.5], [1, 2], [3, 1], [3, 2.5], [4, 2.5], [7, 4]]) {
    const an = analysis(goBackN, { k: 3, window, count: 200, tTrans: 1, tProp, timeout: 100 });
    assert.ok(Math.abs(an.uMeasured - an.uTheory) < 0.03,
      `Ws=${window} Tprop=${tProp}: measured ${an.uMeasured}, theoretical ${an.uTheory}`);
  }
});

test('utilisation depends on a = Tprop / Ttrans, not on each delay', () => {
  const u = tTrans => analysis(goBackN, { k: 3, window: 2, count: 100, tTrans, tProp: 2 * tTrans, timeout: 100 });
  assert.equal(u(1).uTheory, u(0.5).uTheory);
  assert.ok(Math.abs(u(1).uMeasured - u(0.5).uMeasured) < 1e-9);
});

test('a transfer that never ends has no measured utilisation', () => {
  const an = analysis(stopAndWait, { lossRate: 1, tMax: 50 });
  assert.ok(an.unfinished);
  assert.equal(an.uMeasured, null);
});
