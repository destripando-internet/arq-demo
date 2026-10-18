// Vertical scale of the diagram: linear within each diagram, so that every
// data arrow has the same angle, and so does every ACK.
//
// - Pixels per time unit: a data arrow drops DATA_DROP pixels (as with
//   a = 1), unless labels on the same side would then be closer than ROW
//   pixels; then the scale grows just enough.
// - Idle stretches (no event at all) longer than MAX_GAP pixels that no
//   arrow crosses are drawn as MAX_GAP pixels, with a break mark. Only if
//   the diagram would still be taller than MAX_HEIGHT (long links with a
//   large window) are stretches crossed by arrows compressed too, each one
//   just enough for all the arrows of a kind to keep the same length.

export const UNIT = 30;
export const DATA_DROP = 2 * UNIT;
export const ROW = 30;
export const MAX_GAP = 4 * UNIT;
export const MAX_HEIGHT = 6000;

// Every instant the diagram draws something at, including where the arrow
// of a lost message would have arrived and the corners of the bands.
export function breakpoints(trace) {
  const { tTrans } = trace.params;
  const ts = new Set([0, trace.end]);
  for (const tx of trace.transmissions) {
    ts.add(tx.tDep);
    ts.add(tx.tArr);
    if (tx.kind === 'data') {
      ts.add(tx.tDep + tTrans);
      ts.add(tx.tArr - tTrans);
    }
  }
  for (const tm of trace.timers) {
    ts.add(tm.tStart);
    if (tm.tEnd != null) ts.add(tm.tEnd);
  }
  if (trace.loop) ts.add(trace.loop.t);
  return [...ts].sort((a, b) => a - b);
}

// Smallest positive distance between consecutive instants.
function minGap(times) {
  const sorted = [...new Set(times)].sort((a, b) => a - b);
  let gap = Infinity;
  for (let i = 1; i < sorted.length; i++) gap = Math.min(gap, sorted[i] - sorted[i - 1]);
  return gap;
}

export function timeScale(trace) {
  const { tTrans, tProp } = trace.params;
  const departures = kind => trace.transmissions.filter(tx => tx.kind === kind).map(tx => tx.tDep);
  const px = Math.max(  // per time unit
    DATA_DROP / (tTrans + tProp),
    ROW / minGap(departures('data')),
    ROW / minGap(departures('ack')),
  );

  const ts = breakpoints(trace);
  const natural = i => (ts[i] - ts[i - 1]) * px;  // stretch i: ts[i-1]..ts[i]
  const at = new Map(ts.map((t, i) => [t, i]));
  const spans = trace.transmissions.map(tx => ({ kind: tx.kind, from: at.get(tx.tDep), to: at.get(tx.tArr) }));
  const crossed = ts.map((_, i) => spans.some(s => s.from < i && s.to >= i));

  // Visual length of every stretch, compressing the long ones in `squeezed`.
  const layout = squeezed => {
    const len = ts.map((_, i) => (i === 0 ? 0 : squeezed[i] ? MAX_GAP : natural(i)));
    // Lengthen compressed stretches so arrows of a kind keep a common length.
    const arrows = spans.map(s => {
      const gaps = [];
      let rest = 0;
      for (let i = s.from + 1; i <= s.to; i++) squeezed[i] ? gaps.push(i) : rest += natural(i);
      return { ...s, gaps, rest };
    }).filter(a => a.gaps.length);
    const target = {};
    for (const a of arrows) target[a.kind] = Math.max(target[a.kind] ?? 0, a.rest + a.gaps.length * MAX_GAP);
    for (const a of arrows) {
      const each = (target[a.kind] - a.rest) / a.gaps.length;
      for (const g of a.gaps) len[g] = Math.max(len[g], each);
    }
    const ys = [0], breaks = [];
    for (let i = 1; i < ts.length; i++) {
      ys.push(ys[i - 1] + len[i]);
      if (squeezed[i]) breaks.push({ t0: ts[i - 1], t1: ts[i], y: (ys[i - 1] + ys[i]) / 2 });
    }
    return { ys, breaks };
  };
  const long = ts.map((_, i) => i > 0 && natural(i) > MAX_GAP);
  let { ys, breaks } = layout(long.map((l, i) => l && !crossed[i]));
  if (ys.at(-1) > MAX_HEIGHT) ({ ys, breaks } = layout(long));

  // Index of the last element of arr ≤ v.
  const index = (arr, v) => {
    let lo = 0, hi = arr.length - 1;
    if (v >= arr[hi]) return hi;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (arr[mid] <= v) lo = mid;
      else hi = mid;
    }
    return lo;
  };
  const lerp = (xs, vs, v, slope) => {
    const i = index(xs, v);
    if (i === xs.length - 1) return vs[i] + (v - xs[i]) * slope;
    return vs[i] + (v - xs[i]) / (xs[i + 1] - xs[i]) * (vs[i + 1] - vs[i]);
  };

  const y = time => lerp(ts, ys, time, px);
  const time = py => lerp(ys, ts, py, 1 / px);  // inverse, for the playback
  return { y, time, breaks, px };
}
