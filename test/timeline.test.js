import { test } from 'node:test';
import assert from 'node:assert/strict';

import { simulate } from '../sim/simulation.js';
import { goBackN } from '../protocols/go-back-n.js';
import { selectiveRepeat } from '../protocols/selective-repeat.js';
import { senderRows, sendBoxes } from '../ui/timeline.js';
import { timeScale } from '../ui/timescale.js';

// Sender buffer rows as «D@t[confirmed]» (data leaving) or «A@t[confirmed]»
// (ACK arriving while no message leaves).
const rows = trace => senderRows(trace, timeScale(trace).y)
  .map(r => `${r.data ? 'D' : 'A'}@${r.t}[${r.confirmed}]`).join(' ');

test('send buffer rows: the last ACKs, with no message leaving, get their own rows', () => {
  const trace = simulate(goBackN, { ...goBackN.book.params, forcedLosses: ['d1.1'] });
  assert.equal(rows(trace), 'D@0[] D@1[] D@2[] D@3[0] D@7[] D@8[] D@9[] A@10[1] A@11[2] A@12[3]');
});

test('send buffer rows: a cumulative ACK after a lost one confirms two messages', () => {
  const trace = simulate(goBackN, { count: 6, forcedLosses: ['a1'] });
  assert.equal(rows(trace), 'D@0[] D@1[] D@2[] D@4[0,1] D@5[2] D@6[] A@7[3] A@8[4] A@9[5]');
});

test('send buffer rows: individual ACKs confirm messages inside the window', () => {
  const trace = simulate(selectiveRepeat, { forcedLosses: ['d2.1'] });
  assert.equal(rows(trace), 'D@0[] D@1[] D@2[] D@3[0] D@4[1] D@5[] A@6[3] A@7[4] A@8[5] D@9[] A@12[2]');
});

test('send buffer rows: an ACK row too close to a data row is left out', () => {
  // On a LAN each ACK arrives 0.001 after the next message leaves; the last
  // row shows what the skipped one confirmed.
  const trace = simulate(goBackN, { count: 5, tTrans: 0.8, tProp: 0.0005, timeout: 1 });
  assert.equal(rows(trace), 'D@0[] D@0.8[] D@1.6[0] D@2.4[1] D@3.2[2] A@4.001[3,4]');
});

test('send buffer cells: messages not sent yet are green beyond the window too', () => {
  // k = 2, Ws = 3, 4 messages: «3 [0 1 2] 3» when 0 leaves.
  const trace = simulate(goBackN, { count: 4 });
  const first = trace.transmissions.find(tx => tx.kind === 'data').sender;
  const cells = sendBoxes(first, [], 0, trace.params).map(c => `${c.seq}:${c.state || '-'}`);
  assert.deepEqual(cells, ['3:-', '0:sent', '1:unsent', '2:unsent', '3:unsent']);
  // With 3 messages there is nothing beyond the window.
  const short = simulate(goBackN, { count: 3 });
  const cells3 = sendBoxes(short.transmissions[0].sender, [], 0, short.params).map(c => c.state || '-');
  assert.deepEqual(cells3, ['-', 'sent', 'unsent', 'unsent', '-']);
});
