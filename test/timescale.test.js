import { test } from 'node:test';
import assert from 'node:assert/strict';

import { simulate } from '../sim/simulation.js';
import { goBackN } from '../protocols/go-back-n.js';
import { stopAndWait } from '../protocols/stop-and-wait.js';
import { selectiveRepeat } from '../protocols/selective-repeat.js';
import { timeScale, UNIT, DATA_DROP, MAX_HEIGHT } from '../ui/timescale.js';

const LINKS = {
  lan: { tTrans: 0.8, tProp: 0.0005, timeout: 1 },
  unit: { tTrans: 1, tProp: 1, timeout: 5 },
  fibre: { tTrans: 0.8, tProp: 5, timeout: 15 },
  satellite: { tTrans: 0.8, tProp: 250, timeout: 600 },
};

// Distinct drops (rounded) of the arrows of a kind; lost ones count whole.
const drops = (trace, scale, kind) => new Set(trace.transmissions
  .filter(tx => tx.kind === kind)
  .map(tx => Math.round((scale.y(tx.tArr) - scale.y(tx.tDep)) * 10) / 10));

test('timescale: with a = 1 the diagram is to scale and a Ttrans takes UNIT px', () => {
  const trace = simulate(goBackN, { ...goBackN.book.params, forcedLosses: goBackN.book.losses });
  const scale = timeScale(trace);
  assert.equal(scale.breaks.length, 0);
  assert.equal(scale.y(5) - scale.y(4), UNIT);
});

test('timescale: data arrows keep the a = 1 angle on every link when there is room', () => {
  for (const [name, link] of Object.entries(LINKS)) {
    const trace = simulate(stopAndWait, { ...link, count: 3, forcedLosses: ['d1.1'] });
    assert.deepEqual([...drops(trace, timeScale(trace), 'data')], [DATA_DROP], name);
  }
});

test('timescale: within a diagram, arrows of a kind are parallel (lost ones too)', () => {
  const cases = [
    [goBackN, { ...LINKS.fibre, k: 4, window: 14, count: 12, timeout: 11, lossRate: 0.25 }],
    [goBackN, { ...LINKS.satellite, k: 3, window: 7, count: 10 }],
    [selectiveRepeat, { ...LINKS.satellite, k: 4, window: 8, count: 12, lossRate: 0.25 }],
    [selectiveRepeat, { ...LINKS.fibre, k: 5, window: 14, count: 30, forcedLosses: ['a1'] }],
    [stopAndWait, { ...LINKS.lan, count: 6, lossRate: 0.3 }],
  ];
  for (const [proto, opts] of cases) {
    const trace = simulate(proto, opts);
    const scale = timeScale(trace);
    for (const kind of ['data', 'ack'])
      assert.equal(drops(trace, scale, kind).size, 1, `${proto.id} ${kind} ${JSON.stringify(opts)}`);
  }
});

test('timescale: the same a looks the same whatever Ttrans', () => {
  const ys = tTrans => {
    const trace = simulate(stopAndWait, { tTrans, tProp: 2 * tTrans, timeout: 6 * tTrans, count: 3 });
    const scale = timeScale(trace);
    return [1, 2.5, 7, 12].map(k => scale.y(k * tTrans));
  };
  const [a, b] = [ys(1), ys(0.25)];
  a.forEach((y, i) => assert.ok(Math.abs(y - b[i]) < 1e-9, `${y} ≠ ${b[i]}`));
});

test('timescale: invertible, and long links stay a usable height', () => {
  const trace = simulate(goBackN, { ...LINKS.satellite, k: 5, window: 31, count: 40 });
  const scale = timeScale(trace);
  for (const time of [0, 100, 250.8, 400, trace.end])
    assert.ok(Math.abs(scale.time(scale.y(time)) - time) < 1e-6, `${time}`);
  assert.ok(scale.y(trace.end) < MAX_HEIGHT);
});
