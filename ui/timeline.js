// Space-time diagram in SVG from a trace. It only draws what happened up to
// time `now`; messages in flight appear half-way.
//
// Every label sits at the height of its arrow: on the sender side, one line
// «[buffer] [RTX] data N» per data message; on the receiver side, one line
// «ack N [buffer] note» per ACK.

import { t } from './i18n.js';
import { timeScale, ROW } from './timescale.js';

const TOP = 34;
const SIDE = 24;    // column at each side for the names, written upright
const BOX = 16;      // buffer cell
const GAP = 8;       // between label, buffer and note
const ACK_GAP = 5;   // an ACK leaves this far below the data arrival it
                     // answers and arrives this far above the next departure
const FONT = 15;     // label size (style.css)
const NOTE_FONT = 13;

// Cells in each buffer row: M+1 as in the book's figures or, with many
// sequence numbers, just what is needed around the window. The receive row
// also shows the messages just delivered, up to W of them.
const boxCount = ({ M, window: W }) => (M <= 8 ? M + 1 : Math.min(M, W) + 2);
const recvBoxCount = ({ M, window: W }) => (M <= 8 ? M + 1 : Math.min(M, 2 * W) + 1);

// Text width, measured with a canvas when there is a document.
const canvas = typeof document !== 'undefined' && document.createElement('canvas').getContext('2d');
function textWidth(text, size = FONT, bold = false) {
  if (!canvas) return text.length * size * (bold ? 0.62 : 0.58);
  canvas.font = `${bold ? 700 : 400} ${size}px ${getComputedStyle(document.body).fontFamily}`;
  return canvas.measureText(text).width;
}
const maxWidth = (texts, size, bold) => Math.max(0, ...texts.map(t => textWidth(t, size, bold)));

export function eventTimes(trace) {
  const ts = new Set([0, trace.end]);
  for (const tx of trace.transmissions) {
    ts.add(tx.tDep);
    ts.add(tx.lost ? (tx.tDep + tx.tArr) / 2 : tx.tArr);
  }
  for (const tm of trace.timers) {
    ts.add(tm.tStart);
    if (tm.tEnd != null) ts.add(tm.tEnd);
  }
  return [...ts].sort((a, b) => a - b);
}

// fitWidth: the width available; the axes spread to fill it, so that the
// drawing is not scaled up and takes less height.
export function renderTimeline(trace, now, protocol, fitWidth = 0) {
  const { M, window: W, tTrans } = trace.params;
  const scale = timeScale(trace);
  const y = time => TOP + scale.y(time);
  // Heights where an arrow starts and would end (a lost one stops half-way).
  const rawEnds = tx => [y(tx.tDep), y(tx.tArr)];
  // Vertical offset of both ends of an ACK; split when it is nearly
  // instantaneous, so the arrow never goes up.
  const ackGap = tx => {
    const [y1, y2] = rawEnds(tx);
    return Math.min(ACK_GAP, (y2 - y1) / 2);
  };
  // One timer column per sequence number (or per window slot with many),
  // so different timers never share a column at the same time.
  const cols = M <= 8 ? M : W;
  const COL = Math.min(20, 200 / cols);   // gap between timer columns
  const rowWidth = boxCount(trace.params) * BOX;

  // Sender lines. «timeout!» only in stop-and-wait, as in its figure.
  const expiredAt = new Set(W === 1
    ? trace.timers.filter(tm => tm.end === 'expire').map(tm => tm.tEnd) : []);
  const data = trace.transmissions.filter(tx => tx.kind === 'data').map(tx => ({
    tx,
    text: `${tx.rtx ? '[RTX] ' : ''}data ${tx.seq}`,
    timeout: tx.rtx && expiredAt.has(tx.tDep),
  }));
  const labelWidth = Math.max(0, ...data.map(d =>
    textWidth(d.text) + (d.timeout ? textWidth(`${t('timeout!')} `, NOTE_FONT, true) : 0)));
  // Buffer rows of the sender, each with the messages confirmed since the
  // previous row. When they have already left the row, it grows to the left
  // to show them.
  const rows = senderRows(trace, y);
  const extra = rows.map(r => Math.max(0, r.snap.base - 1 - (r.confirmed[0] ?? Infinity)));
  const sendRow = protocol.showBuffer ? (Math.max(0, ...extra) * BOX) + rowWidth + GAP : 0;
  const SX = Math.max(240, SIDE + 8 + sendRow + labelWidth + 6 + cols * COL + 16);  // sender axis
  const timerX = abs => SX - 16 - (cols - 1 - (abs % cols)) * COL;
  const labelX = SX - 16 - cols * COL - 6;   // right edge of the sender labels
  const sendRowX = labelX - labelWidth - GAP - rowWidth;

  // Receiver lines, right of its axis. A note belongs to the ACK sent at the
  // same instant.
  const acks = trace.transmissions.filter(tx => tx.kind === 'ack');
  const recvRowDX = 16 + maxWidth(acks.map(tx => `ack ${tx.seq}`)) + GAP;
  const noteDX = recvRowDX + (protocol.showReceiverBuffer ? recvBoxCount(trace.params) * BOX + GAP : 0);
  const right = Math.max(140, noteDX + maxWidth(trace.notes.map(n => t(`note.${n.text}`)), NOTE_FONT, true) + 20);
  const RX = SX + Math.max(300, fitWidth - SX - right - SIDE);  // receiver axis
  const ackX = RX + 16;
  const recvRowX = RX + recvRowDX;
  const noteX = RX + noteDX;
  const WIDTH = RX + right + SIDE;
  const END = WIDTH - SIDE;   // right edge of the drawing, before the name
  const height = y(trace.end) + 50;
  const out = [];

  const marker = kind => `<marker id="ah-${kind}" viewBox="0 0 10 10" refX="10" refY="5"
      markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto">
      <path class="ah-${kind}" d="M0,1.5L10,5L0,8.5z"/></marker>`;
  out.push(`<defs>${marker('data')}${marker('ack')}${marker('idle')}
    <clipPath id="past"><rect x="0" y="0" width="${WIDTH}" height="${y(now)}"/></clipPath></defs>`);

  // The names of the sides, upright at the outer edges, from the top of the
  // axes down, so that they take no height. main.js moves the group down as
  // the page scrolls, so that they stay in view.
  const axisTop = TOP - 24;
  out.push(
    `<g class="side-names">`
    + `<text class="head" transform="translate(${SIDE - 7},${axisTop}) rotate(-90)" text-anchor="end">${t('sender')}</text>`
    + `<text class="head" transform="translate(${WIDTH - SIDE + 7},${axisTop}) rotate(90)">${t('receiver')}</text></g>`,
    `<line class="axis" x1="${SX}" y1="${axisTop}" x2="${SX}" y2="${height - 10}"/>`,
    `<line class="axis" x1="${RX}" y1="${axisTop}" x2="${RX}" y2="${height - 10}"/>`,
  );

  // Channel occupancy: each data message is a band between its first bit
  // and its last bit, which leaves Ttrans later; the arrow goes from the
  // first bit leaving to the last bit arriving. The corners are the real
  // instants, so back-to-back messages share an edge and bands never
  // overlap. A lost message's band stops half-way, like its arrow.
  const bands = [];
  // Consecutive bands alternate two greys, so that touching ones can be told apart.
  for (const [i, { tx }] of data.entries()) {
    if (tx.tDep > now) continue;
    const f = tx.lost ? 0.5 : 1;
    const x = SX + (RX - SX) * f;
    const [firstOut, lastIn] = rawEnds(tx);
    const lastOut = y(tx.tDep + tTrans), firstIn = y(tx.tArr - tTrans);
    const top = firstOut + f * (firstIn - firstOut), bottom = lastOut + f * (lastIn - lastOut);
    bands.push(`<polygon class="band${i % 2 ? ' alt' : ''}" points="${SX},${firstOut} ${x},${top} ${x},${bottom} ${SX},${lastOut}"/>`);
  }
  out.push(`<g clip-path="url(#past)">${bands.join('')}</g>`);

  // Compressed idle stretches: a break on each axis and the hidden time.
  for (const b of scale.breaks) {
    const by = TOP + b.y;
    for (const x of [SX, RX])
      out.push(`<g class="axis-break" transform="translate(${x},${by})"><rect x="-9" y="-5" width="18" height="10"/>`
        + '<path d="M-9,-1L9,-6M-9,6L9,1"/></g>');
    out.push(`<text class="gap" x="${(SX + RX) / 2}" y="${by + 4}" text-anchor="middle">`
      + `Δt = ${+(b.t1 - b.t0).toPrecision(4)}<title>${t('gap.title')}</title></text>`);
  }

  // Lines of the arrow under the pointer get a grey band from the outer edge
  // to the axis, and the uncoloured cells of their buffers turn grey: for a
  // data message, the line where it leaves and the one where it arrives; for
  // an ACK, only the one where it arrives. main.js marks them by data-keys,
  // the arrows of each line. Behind timers and labels.
  const arrivals = (kind, t) => trace.transmissions
    .filter(tx => tx.kind === kind && !tx.lost && tx.tArr === t).map(tx => tx.key);
  const sendKeys = new Map();  // time of a sender line → its arrows
  for (const { tx } of data) if (tx.tDep <= now) sendKeys.set(tx.tDep, [tx.key, ...arrivals('ack', tx.tDep)]);
  if (protocol.showBuffer)
    for (const r of rows) if (!r.data && r.t <= now) sendKeys.set(r.t, arrivals('ack', r.t));
  const recvKeys = tx => arrivals('data', tx.tDep);
  // A band from x1 to x2, square on the axis side (at x2 on the sender's,
  // at x1 on the receiver's) and rounded on the outer one.
  const lineBand = (keys, x1, x2, cy, sender) => {
    const top = cy - 14, bottom = top + BOX + 10, r = 3;
    const d = sender
      ? `M${x2},${top}V${bottom}H${x1 + r}a${r},${r} 0 0 1 -${r},-${r}V${top + r}a${r},${r} 0 0 1 ${r},-${r}Z`
      : `M${x1},${top}H${x2 - r}a${r},${r} 0 0 1 ${r},${r}V${bottom - r}a${r},${r} 0 0 1 -${r},${r}H${x1}Z`;
    return `<path class="line-bg" data-keys="${keys.join(' ')}" d="${d}"/>`;
  };
  const sendLeft = (protocol.showBuffer ? sendRowX - Math.max(0, ...extra) * BOX : labelX - labelWidth) - 6;
  const AXIS = 0.75;  // half the axis stroke: the bands stop at its edge
  for (const [time, keys] of sendKeys) out.push(lineBand(keys, sendLeft, SX - AXIS, y(time), true));
  for (const tx of acks)
    if (tx.tDep <= now) out.push(lineBand(recvKeys(tx), RX + AXIS, RX + right - 14, y(tx.tDep) + ackGap(tx)));
  const bufRow = (keys, body) => `<g class="buf-row" data-keys="${keys.join(' ')}">${body}</g>`;

  // Timers. A start clock stays at the height of its message. If a timer is
  // cancelled where another one starts in the same column (messages N and
  // N + 2^k), the cancel clock is shifted up so the clocks do not overlap.
  const starts = new Set(trace.timers.filter(tm => !tm.afterExpire)
    .map(tm => `${timerX(tm.abs)},${tm.tStart}`));
  // Lines first, so that no line crosses a clock.
  const timerLines = [], clocks = [];
  for (const tm of trace.timers) {
    if (tm.tStart > now) continue;
    const x = timerX(tm.abs);
    const y0 = y(tm.tStart);
    const done = tm.tEnd != null && tm.tEnd <= now;
    const yEnd = done && tm.end === 'cancel' && starts.has(`${x},${tm.tEnd}`)
      ? y(tm.tEnd) - 15 : y(Math.min(now, tm.tEnd ?? trace.end));
    if (yEnd > y0)
      timerLines.push(`<line class="timer-line" x1="${x}" y1="${y0}" x2="${x}" y2="${yEnd}"/>`);
    if (!tm.afterExpire) clocks.push(clock(x, y0, tm.restarted ? 'restart' : 'start'));
    if (done && tm.end !== 'restart') clocks.push(clock(x, yEnd, tm.end));
  }
  out.push(...timerLines, ...clocks);

  // Sender labels and buffers
  for (const d of data) {
    if (d.tx.tDep > now) continue;
    const timeout = d.timeout ? `<tspan class="note">${t('timeout!')} </tspan>` : '';
    out.push(`<text class="label" x="${labelX}" y="${y(d.tx.tDep) + 5}" text-anchor="end">${timeout}${d.text}</text>`);
  }
  if (protocol.showBuffer)
    rows.forEach((r, i) => {
      if (r.t > now) return;
      out.push(bufRow(sendKeys.get(r.t) ?? [], senderRow(sendRowX, r.cy - 9, r.snap, r.confirmed, extra[i], trace.params)));
    });
  if (trace.loop && trace.loop.t <= now)
    out.push(`<text class="label note bad" x="${labelX}" y="${y(trace.loop.t) + 5}" text-anchor="end">${t('loop!')}</text>`);

  // Receiver labels, buffers and notes
  const noteAt = new Map(trace.notes.map(n => [n.t, n]));
  for (const tx of acks) {
    if (tx.tDep > now) continue;
    const cy = y(tx.tDep) + ackGap(tx);
    out.push(`<text class="label${tx.noEffect ? ' idle' : ''}" x="${ackX}" y="${cy + 5}">ack ${tx.seq}</text>`);
    if (protocol.showReceiverBuffer)
      out.push(bufRow(recvKeys(tx), receiverRow(recvRowX, cy - 9, tx.receiver, trace.params)));
    const note = noteAt.get(tx.tDep);
    if (note) {
      out.push(noteText(noteX, cy, note));
      noteAt.delete(tx.tDep);
    }
  }
  for (const note of noteAt.values())  // notes without an ACK
    if (note.t <= now) out.push(noteText(noteX, y(note.t) + ACK_GAP, note));

  // Messages
  for (const tx of trace.transmissions) {
    if (tx.tDep > now) continue;
    const ack = tx.kind === 'ack';
    const [x1, x2] = ack ? [RX, SX] : [SX, RX];
    const dy = ack ? ackGap(tx) : 0;
    const limit = tx.lost ? 0.5 : 1;
    const [r1, r2] = rawEnds(tx);
    const y1 = r1 + dy, y2 = r2 - dy;
    // The tip of an arrow in flight is where it crosses the current time.
    const f = Math.min(limit, y2 > y1 ? (y(now) - y1) / (y2 - y1) : 1);
    const at = g => [x1 + (x2 - x1) * g, y1 + (y2 - y1) * g];
    const [xe, ye] = at(f);
    const [xh, yh] = at(limit);
    const arrived = tx.lost && f >= limit;
    // An ACK with no effect on the sender: dashed, with a hollow head.
    const head = tx.noEffect ? 'idle' : tx.kind;
    out.push(`<g class="msg ${tx.kind}${tx.lost ? ' lost' : ''}${tx.noEffect ? ' idle' : ''}" data-key="${tx.key}">`,
      `<line class="hit" x1="${x1}" y1="${y1}" x2="${xh}" y2="${yh}"/>`,
      `<line class="line" x1="${x1}" y1="${y1}" x2="${xe}" y2="${ye}"${arrived ? '' : ` marker-end="url(#ah-${head})"`}/>`,
      arrived ? `<rect class="drop" x="${xh - 5}" y="${yh - 5}" width="10" height="10"/>` : '',
      `<title>${t(tx.lost ? 'click.deliver' : 'click.lose', { key: tx.key })}</title></g>`);
  }

  // Current time
  out.push(`<line class="playhead" x1="${SIDE}" y1="${y(now)}" x2="${END}" y2="${y(now)}"/>`,
    `<text class="time" x="${END - 6}" y="${y(now) - 5}" text-anchor="end">t = ${+now.toFixed(2)}</text>`);

  return { svg: out.join('\n'), width: WIDTH, height, playheadY: y(now) };
}

const noteText = (x, cy, note) =>
  `<text class="label note ${note.cls}" x="${x}" y="${cy + 5}">${t(`note.${note.text}`)}</text>`;

const mod = (n, M) => ((n % M) + M) % M;

// Buffer rows of the sender: one per data message, with its state when it
// leaves, and one when an ACK arrives that confirms something while no
// message leaves (buffer only, at the height of the arrival). Such an ACK row
// is left out if it would be closer than ROW to its neighbours; then the
// next row shows what it confirmed. Every row has the messages confirmed
// since the previous row.
export function senderRows(trace, y) {
  const all = [];
  const departures = new Set();
  for (const tx of trace.transmissions)
    if (tx.kind === 'data') {
      all.push({ t: tx.tDep, cy: y(tx.tDep), snap: tx.sender, data: true });
      departures.add(tx.tDep);
    }
  for (const tx of trace.transmissions)
    if (tx.kind === 'ack' && !tx.lost && tx.sender && !departures.has(tx.tArr))
      all.push({ t: tx.tArr, cy: y(tx.tArr), snap: tx.sender, data: false });
  all.sort((a, b) => a.t - b.t);

  const rows = [];
  all.forEach((row, i) => {
    const prev = rows.at(-1);
    const confirmed = newlyConfirmed(prev?.snap, row.snap);
    if (!row.data) {
      const next = all.slice(i + 1).find(r => r.data);
      if (!confirmed.length
          || (prev && row.cy < prev.cy + ROW - 0.5)
          || (next && row.cy > next.cy - ROW + 0.5)) return;
    }
    rows.push({ ...row, confirmed });
  });
  return rows;
}

// Messages sent and not confirmed at the previous row (prev) that are
// confirmed at this one (snap), in order.
export function newlyConfirmed(prev, snap) {
  if (!prev) return [];
  const out = [];
  for (let abs = prev.base; abs < prev.next; abs++)
    if (!prev.acked.includes(abs) && (abs < snap.base || snap.acked.includes(abs))) out.push(abs);
  return out;
}

// Send buffer: cells from base-1 and the send window framed, always in the
// same column; `extra` more cells to the left when needed to show every
// message confirmed since the previous row (see sendBoxes).
function senderRow(x0, top, snap, confirmed, extra, params) {
  const boxes = sendBoxes(snap, confirmed, extra, params);
  return bufferRow(x0 - extra * BOX, top, boxes, params.window, extra + 1);
}

// Cells of a send buffer row, from base-1-extra. A message not sent yet is
// green also beyond the window: it waits for the window to move.
export function sendBoxes(snap, confirmed, extra, { M, window: W, count }) {
  return Array.from({ length: extra + boxCount({ M, window: W }) }, (_, i) => {
    const abs = snap.base - 1 - extra + i;
    const inWindow = abs >= snap.base && abs < snap.base + W;
    let state = '';
    if (confirmed.includes(abs)) state = 'acked';
    else if (abs >= snap.base && !snap.acked.includes(abs))
      state = abs < snap.next ? 'sent' : abs < count ? 'unsent' : inWindow ? 'free' : '';
    return { seq: mod(abs, M), state };
  });
}

// Receive buffer: the messages this arrival made deliverable (ready for the
// process), then the receive window framed: received but held behind a gap,
// or a free slot.
function receiverRow(x0, top, snap, params) {
  const { M, window: W } = params;
  const k = snap.justDelivered.length;
  const boxes = Array.from({ length: recvBoxCount(params) }, (_, i) => {
    const seq = mod(snap.expected - k - 1 + i, M);
    const d = i - k - 1;  // position in the window
    const state = i >= 1 && d < 0 ? 'ready'
      : d >= 0 && d < W ? (snap.buffered.includes(seq) ? 'held' : 'free') : '';
    return { seq, state };
  });
  return bufferRow(x0, top, boxes, W, k + 1);
}

export function bufferRow(x0, top, boxes, W, start = 1) {
  const out = boxes.map(({ seq, state }, i) =>
    `<rect class="box ${state ?? ''}" x="${x0 + i * BOX}" y="${top}" width="${BOX}" height="${BOX + 2}" rx="3"/>` +
    `<text class="box-n" x="${x0 + i * BOX + BOX / 2}" y="${top + 14}" text-anchor="middle">${seq}</text>`);
  const width = Math.max(0, Math.min(W, boxes.length - start));
  out.push(`<rect class="window" x="${x0 + start * BOX - 1}" y="${top - 1}" width="${width * BOX + 2}" height="${BOX + 4}" rx="4"/>`);
  // A small check on the cells confirmed since the previous row.
  boxes.forEach(({ state }, i) => {
    if (state === 'acked')
      out.push(`<path class="tick" d="M${x0 + i * BOX + 9},${top - 1}l2.5,2.8l5,-6"/>`);
  });
  return out.join('');
}

export function clock(x, cy, kind) {
  const extra = {
    cancel: '<path class="slash" d="M-8,8L8,-8"/>',
    // An open circular arrow around the clock, as in the figures' icon set.
    restart: '<path class="ring" d="M-8.23,4.75A9.5,9.5 0 1 0 4.75,-8.23"/>'
      + '<path class="arrowhead" d="M1.11,-10.33L6.05,-10.48L3.45,-5.98z"/>',
    // Two short arcs on each side: an alarm clock ringing, as in the figures.
    expire: '<path class="ring" d="M-8.46,-3.08A9,9 0 0 1 -3.08,-8.46M-10.81,-3.93A11.5,11.5 0 0 1 -3.93,-10.81'
      + 'M3.08,-8.46A9,9 0 0 1 8.46,-3.08M3.93,-10.81A11.5,11.5 0 0 1 10.81,-3.93"/>',
  }[kind] ?? '';
  return `<g class="clock ${kind}" transform="translate(${x},${cy})"><circle r="6.5"/><path class="hand" d="M0,-4V0L3,2"/>${extra}</g>`;
}
