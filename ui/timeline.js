// Diagrama espacio-tiempo en SVG a partir de una traza. Dibuja solo lo
// ocurrido hasta el instante `now`; los mensajes en vuelo aparecen a medias.

const PX = 30;            // píxeles por unidad de tiempo
const TOP = 70;
const COL = 20;           // separación entre columnas de temporizadores
const BOX = 16;           // casilla del buffer

const y = t => TOP + t * PX;

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

export function renderTimeline(trace, now, protocol) {
  const { M, window: W } = trace.params;
  const cols = W === 1 ? 1 : M <= 8 ? M : W;
  // Margen izquierdo: etiquetas o buffer (lo más ancho) + temporizadores
  const leftWidth = Math.max(120, protocol.showBuffer ? (M + 1) * BOX : 0);
  const SX = Math.max(300, 30 + leftWidth + 6 + cols * COL + 16);  // eje del emisor
  const RX = SX + 300;                                             // eje del receptor
  const WIDTH = RX + 260;
  const timerX = abs => SX - 16 - (cols - 1 - (abs % cols)) * COL;
  const labelX = SX - 16 - cols * COL - 6;
  const height = y(trace.end) + 50;
  const out = [];

  const marker = kind => `<marker id="ah-${kind}" viewBox="0 0 10 10" refX="10" refY="5"
      markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto">
      <path class="ah-${kind}" d="M0,1.5L10,5L0,8.5z"/></marker>`;
  out.push(`<defs>${marker('data')}${marker('ack')}</defs>`);

  out.push(
    `<text class="head" x="${SX}" y="28" text-anchor="middle">Emisor</text>`,
    `<text class="head" x="${RX}" y="28" text-anchor="middle">Receptor</text>`,
    `<line class="axis" x1="${SX}" y1="${TOP - 24}" x2="${SX}" y2="${height - 10}"/>`,
    `<line class="axis" x1="${RX}" y1="${TOP - 24}" x2="${RX}" y2="${height - 10}"/>`,
  );

  // Temporizadores. Si uno arranca donde otro acaba de cancelarse (parada y
  // espera), se desplaza un poco para que no se superpongan los relojes.
  const ends = new Set(trace.timers.filter(tm => tm.end === 'cancel')
    .map(tm => `${timerX(tm.abs)},${tm.tEnd}`));
  for (const tm of trace.timers) {
    if (tm.tStart > now) continue;
    const x = timerX(tm.abs);
    const y0 = y(tm.tStart) + (ends.has(`${x},${tm.tStart}`) ? 15 : 0);
    const shownEnd = Math.min(now, tm.tEnd ?? trace.end);
    if (shownEnd > tm.tStart)
      out.push(`<line class="timer-line" x1="${x}" y1="${y0}" x2="${x}" y2="${y(shownEnd)}"/>`);
    if (!tm.afterExpire) out.push(clock(x, y0, 'start'));
    if (tm.tEnd != null && tm.tEnd <= now && tm.end !== 'restart')
      out.push(clock(x, y(tm.tEnd), tm.end));
  }

  // Etiquetas del emisor (izquierda) y del receptor (derecha)
  const left = [], right = [];
  for (const tm of trace.timers)
    if (tm.end === 'expire' && cols === 1)
      left.push({ t: tm.tEnd, h: 0, text: 'timeout!', cls: 'note' });
  for (const tx of trace.transmissions) {
    if (tx.kind === 'data') {
      const buffer = protocol.showBuffer && tx.sender;
      left.push({
        t: tx.tDep, key: tx.key,
        text: `${tx.rtx ? '[RTX] ' : ''}mensaje ${tx.seq}`,
        h: buffer ? BOX + 8 : 0,
        extra: buffer && (cy => bufferRow(labelX, cy + 12, buffer, trace.params)),
      });
    } else {
      right.push({ t: tx.tDep, key: tx.key, text: `ack ${tx.seq}` });
    }
  }
  for (const n of trace.notes)
    right.push({ t: n.t, text: n.text, cls: `note ${n.cls}`, before: true });

  // A igual t, la nota del receptor va encima del ack.
  right.sort((a, b) => a.t - b.t || (b.before ? 1 : 0) - (a.before ? 1 : 0));
  left.sort((a, b) => a.t - b.t);
  out.push(...stack(left, labelX, 'end', now), ...stack(right, RX + 30, 'start', now));

  // Mensajes
  for (const tx of trace.transmissions) {
    if (tx.tDep > now) continue;
    const [x1, x2] = tx.kind === 'data' ? [SX, RX] : [RX, SX];
    const y1 = y(tx.tDep), y2 = y(tx.tArr);
    const limit = tx.lost ? 0.5 : 1;
    const f = Math.min(limit, (now - tx.tDep) / (tx.tArr - tx.tDep));
    const at = g => [x1 + (x2 - x1) * g, y1 + (y2 - y1) * g];
    const [xe, ye] = at(f);
    const [xh, yh] = at(limit);
    const arrived = tx.lost && f >= limit;
    out.push(`<g class="msg ${tx.kind}${tx.lost ? ' lost' : ''}" data-key="${tx.key}">`,
      `<line class="hit" x1="${x1}" y1="${y1}" x2="${xh}" y2="${yh}"/>`,
      `<line class="line" x1="${x1}" y1="${y1}" x2="${xe}" y2="${ye}"${arrived ? '' : ` marker-end="url(#ah-${tx.kind})"`}/>`,
      arrived ? `<rect class="drop" x="${xh - 5}" y="${yh - 5}" width="10" height="10"/>` : '',
      `<title>${tx.key}: clic para ${tx.lost ? 'entregar' : 'perder'}</title></g>`);
  }

  // Instante actual
  out.push(`<line class="playhead" x1="0" y1="${y(now)}" x2="${WIDTH}" y2="${y(now)}"/>`,
    `<text class="time" x="${WIDTH - 6}" y="${y(now) - 5}" text-anchor="end">t = ${now.toFixed(1)}</text>`);

  return { svg: out.join('\n'), width: WIDTH, height, playheadY: y(now) };
}

// Coloca las etiquetas en el orden de la lista empujando hacia abajo las que
// se solaparían. La posición no depende de `now`, así no saltan al animar.
function stack(labels, x, anchor, now) {
  const out = [];
  let bottom = -Infinity;
  for (const l of labels) {
    const cy = Math.max(y(l.t), bottom + 17);
    bottom = cy + (l.h ?? 0);
    if (l.t > now) continue;
    out.push(`<text class="label ${l.cls ?? ''}" x="${x}" y="${cy + 5}" text-anchor="${anchor}">${l.text}</text>`);
    if (l.extra) out.push(l.extra(cy));
  }
  return out;
}

// Fila del buffer de envío como en las figuras del libro: M+1 casillas desde
// base-1, enviados sin confirmar en verde y la ventana enmarcada.
function bufferRow(xRight, top, snap, { M, window: W }) {
  const first = snap.base - 1;
  const n = M + 1;
  const x0 = xRight - n * BOX;
  const out = [];
  for (let i = 0; i < n; i++) {
    const abs = first + i;
    const pending = abs >= snap.base && abs < snap.next && !snap.acked.includes(abs);
    const seq = ((abs % M) + M) % M;
    out.push(`<rect class="box${pending ? ' pending' : ''}" x="${x0 + i * BOX}" y="${top}" width="${BOX}" height="${BOX + 2}" rx="3"/>`,
      `<text class="box-n" x="${x0 + i * BOX + BOX / 2}" y="${top + 14}" text-anchor="middle">${seq}</text>`);
  }
  const wx = x0 + BOX;
  out.push(`<rect class="window" x="${wx - 1}" y="${top - 1}" width="${Math.min(W, n - 1) * BOX + 2}" height="${BOX + 4}" rx="4"/>`);
  return out.join('');
}

function clock(x, cy, kind) {
  const extra = {
    cancel: '<path class="slash" d="M-8,8L8,-8"/>',
    expire: '<path class="ring" d="M-6,-9a8,8 0 0 0 -3,4M6,-9a8,8 0 0 1 3,4"/>',
  }[kind] ?? '';
  return `<g class="clock ${kind}" transform="translate(${x},${cy})"><circle r="6.5"/><path class="hand" d="M0,-4V0L3,2"/>${extra}</g>`;
}
