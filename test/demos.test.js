import { test } from 'node:test';
import assert from 'node:assert/strict';

import { simulate } from '../sim/simulation.js';
import { analyze } from '../sim/analysis.js';
import { byId } from '../protocols/index.js';
import { DEMOS, GROUPS, demoById, demoOptions, demosIn } from '../ui/demos.js';

const run = (id, extra = {}) => {
  const { protocol, opts } = demoOptions(demoById(id));
  const proto = byId(protocol);
  const trace = simulate(proto, { ...opts, ...extra });
  return { trace, an: analyze(trace, proto) };
};
const rtx = trace => trace.transmissions.filter(tx => tx.rtx).map(tx => tx.abs);
const idle = trace => trace.transmissions.filter(tx => tx.noEffect).length;

test('demos: unique ids, a known protocol and texts in both languages', () => {
  assert.equal(new Set(DEMOS.map(d => d.id)).size, DEMOS.length);
  for (const d of DEMOS) {
    assert.equal(byId(demoOptions(d).protocol).id, demoOptions(d).protocol, d.id);
    for (const lang of ['en', 'es']) assert.ok(d.title[lang] && d.text[lang], `${d.id} ${lang}`);
  }
});

test('demos: every demo in one section, listed in the order of the sections', () => {
  assert.deepEqual(GROUPS.flatMap(demosIn), DEMOS);
  for (const g of GROUPS) {
    assert.ok(demosIn(g).length, g.id);
    for (const lang of ['en', 'es']) assert.ok(g.title[lang] && (!g.text || g.text[lang]), `${g.id} ${lang}`);
  }
});

test('demos: what the tutorial says', () => {
  const { trace, an } = run('T1');
  assert.equal(an.a, 1);
  assert.equal(trace.transmissions.filter(tx => tx.kind === 'data').length, 3);
  assert.ok(trace.transmissions.every(tx => !tx.lost));
  assert.deepEqual(rtx(trace), []);
  assert.deepEqual(rtx(run('T1', { forcedLosses: ['d1.1'] }).trace), [1]);
  assert.deepEqual(rtx(run('T1', { forcedLosses: ['a2'] }).trace), [1]);
});

test('demos: what the texts say about stop-and-wait and go-back-N', () => {
  assert.ok(run('S1').trace.notes.some(n => n.text === 'duplicate'));
  assert.equal(run('S2').trace.transmissions.filter(tx => tx.kind === 'data').length, 6);
  assert.ok(idle(run('S2').trace) > 0);
  assert.ok(Math.abs(run('S3').an.uTheory - 0.2) < 1e-9);
  assert.deepEqual(rtx(run('G1').trace), [1, 2, 3]);
  assert.equal(idle(run('G1').trace), 2);
  assert.deepEqual(rtx(run('G2').trace), []);
  assert.ok(run('G3').an.loop);
  assert.ok(!run('G4').an.failure && !run('G4').an.unfinished);
  assert.deepEqual(rtx(run('G4').trace), [0, 1, 2]);
  assert.deepEqual(run('G4').trace.notes.map(n => n.text), ['duplicate', 'duplicate', 'duplicate']);
  assert.ok(run('G6').an.failure);
});

test('demos: what the texts say about selective repeat and cumulative ACKs', () => {
  assert.deepEqual(rtx(run('R1').trace), [2]);
  assert.deepEqual(rtx(run('R3').trace), [1]);
  assert.deepEqual(rtx(run('R4').trace), []);
  assert.ok(!run('R5').an.failure);
  assert.ok(run('R6').an.failure);
  assert.deepEqual(rtx(run('C1').trace), [2, 3]);
});

test('demos: what the texts say about bandwidth × delay', () => {
  assert.equal(run('B1').an.uTheory, 1);
  assert.ok(Math.abs(run('B2').an.uTheory - 0.6) < 1e-9);
  assert.equal(run('B3').an.a, 12.5);
  assert.ok(run('B3').an.efficient && run('B3').an.windowOk && run('B3').an.uTheory === 1);
  assert.equal(run('B4').an.uTheory, 1);
  assert.ok(run('B5').an.failure);
  assert.ok(!run('B6').an.failure && run('B6').an.windowOk);
  assert.ok(run('B6').trace.notes.some(n => n.text === 'duplicate'));
  assert.ok(run('B7').an.uTheory > 0.99);
  assert.ok(Math.abs(run('B8').an.uTheory - 1 / 626) < 1e-9);
  assert.ok(Math.abs(run('B9').an.uTheory - 31 / 626) < 1e-9);
});
