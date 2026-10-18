// Panel con el estado del emisor y del receptor en el instante actual.

export function renderState(trace, now, protocol) {
  const { M, window: W, count, k } = trace.params;
  let snap = trace.snapshots[0];
  for (const s of trace.snapshots) if (s.t <= now) snap = s;

  const senderBoxes = [];
  for (let i = 0; i < M; i++) {
    const inWindow = Array.from({ length: W }, (_, j) => snap.base + j).some(a => a % M === i);
    const pending = range(snap.base, snap.next).some(a => a % M === i && !snap.acked.includes(a));
    senderBoxes.push(`<span class="box${pending ? ' pending' : ''}${inWindow ? ' in-window' : ''}">${i}</span>`);
  }
  const receiverBoxes = [];
  for (let i = 0; i < M; i++)
    receiverBoxes.push(`<span class="box${i === snap.expected ? ' in-window' : ''}">${i}</span>`);

  const max = protocol.maxWindow(k);
  const warning = W > max
    ? `<p class="warning">W<sub>s</sub> = ${W} supera el máximo para k = ${k} (${max}): el protocolo puede fallar.</p>`
    : '';

  return `
    <div class="side">
      <h2>Emisor</h2>
      <div class="buf">${senderBoxes.join('')}</div>
      <p>confirmados ${snap.base}/${count}</p>
    </div>
    <div class="side">
      <h2>Receptor</h2>
      <div class="buf">${receiverBoxes.join('')}</div>
      <p>entregados ${snap.delivered}/${count}</p>
    </div>
    ${warning}`;
}

const range = (a, b) => Array.from({ length: Math.max(0, b - a) }, (_, i) => a + i);
