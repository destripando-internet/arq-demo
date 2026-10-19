// Catalogue of the demos listed in DEMOS.md: ?demo=ID loads the scenario and
// shows what it demonstrates. Texts are for students: each one stands alone
// (never «the same loss as…», since a demo may be the only one they open)
// and never mentions the book. Numbers use a decimal point, as the rest of
// the UI. DEMOS.md repeats the English titles and texts: keep both in sync.

export const DEMOS = [
  {
    id: 'S1', query: 'p=saw&n=3&tt=1&d=1&to=5&l=d1.1,a3&t=end',
    title: { en: 'Lost message and lost ACK', es: 'Mensaje perdido y ACK perdido' },
    text: {
      en: 'Message 1 is lost: its timer expires and the sender retransmits it. Then the ACK of the second message 0 is lost, so the sender retransmits that one too and the receiver gets a duplicate. It discards it but confirms it anyway; otherwise the sender would retransmit it forever.',
      es: 'Se pierde el mensaje 1: su temporizador expira y el emisor lo retransmite. Después se pierde la confirmación del segundo mensaje 0, así que el emisor también lo retransmite y al receptor le llega un duplicado. Lo descarta, pero lo confirma igualmente; si no, el emisor lo retransmitiría sin fin.',
    },
  },
  {
    id: 'S2', query: 'p=saw&n=3&tt=1&d=1&to=2&t=end',
    title: { en: 'Timer shorter than the RTT', es: 'Temporizador menor que el RTT' },
    text: {
      en: 'The timer (2) is shorter than the RTT (3). Nothing is lost, but every message is retransmitted before its ACK can arrive. The receiver discards and confirms the duplicates, and the sender ignores the repeated ACKs (dashed) thanks to their number. It works, with twice as many transmissions.',
      es: 'El temporizador (2) es menor que el RTT (3). No se pierde nada, pero cada mensaje se retransmite antes de que pueda llegar su confirmación. El receptor descarta y confirma los duplicados, y el emisor ignora las confirmaciones repetidas (discontinuas) gracias a su número. Funciona, pero con el doble de envíos.',
    },
  },
  {
    id: 'S3', query: 'p=saw&n=6&tt=1&d=2&to=7&t=end',
    title: { en: 'Stop-and-wait utilisation', es: 'Aprovechamiento de parada y espera' },
    text: {
      en: 'With a = Tprop / Ttrans = 2, the sender spends most of the time waiting for ACKs: U = 1 / (1 + 2a) = 0.2. The channel is busy only a fifth of the time (the grey bands).',
      es: 'Con a = Tprop / Ttrans = 2, el emisor pasa la mayor parte del tiempo esperando confirmaciones: U = 1 / (1 + 2a) = 0.2. El canal solo está ocupado una quinta parte del tiempo (las franjas grises).',
    },
  },
  {
    id: 'G1', query: 'p=gbn&k=2&w=3&n=4&tt=1&d=1&to=6&l=d1.1&t=end',
    title: { en: 'Go-back-N: a lost message', es: 'Repetición continua: un mensaje perdido' },
    text: {
      en: 'Message 1 is lost. The receiver only accepts messages in order, so it discards 2 and 3 and answers with duplicate ACKs 1, which have no effect. When the timer of 1 expires, the sender goes back and retransmits 1, 2 and 3: hence the name of the protocol.',
      es: 'Se pierde el mensaje 1. El receptor solo acepta mensajes en orden, así que descarta el 2 y el 3 y responde con ack 1 duplicados, que no tienen efecto. Cuando expira el temporizador del 1, el emisor retrocede y retransmite el 1, el 2 y el 3: de ahí el nombre del protocolo.',
    },
  },
  {
    id: 'G2', query: 'p=gbn&k=2&w=3&n=4&tt=1&d=1&to=6&l=a1&t=end',
    title: { en: 'Go-back-N: a lost ACK', es: 'Repetición continua: un ACK perdido' },
    text: {
      en: 'The ACK of message 0 is lost. Nothing happens: ACKs are cumulative, so ack 2 confirms 0 and 1 at once and nothing is retransmitted.',
      es: 'Se pierde la confirmación del mensaje 0. No pasa nada: la confirmación es acumulativa, así que ack 2 confirma el 0 y el 1 a la vez y no hay ninguna retransmisión.',
    },
  },
  {
    id: 'G3', query: 'p=gbn&k=2&w=3&n=4&tt=1&d=1&to=6&ack=individual&l=a1&t=end',
    title: { en: 'Go-back-N without cumulative ACKs', es: 'Repetición continua sin confirmación acumulativa' },
    text: {
      en: 'The ACK of message 0 is lost, and the sender reads each ACK as confirming a single message. The receiver answers the retransmission of 0 with ack 3 (the next one it expects), so 0 is never confirmed and the sender would retransmit it forever. That is why go-back-N needs cumulative ACKs.',
      es: 'Se pierde la confirmación del mensaje 0 y el emisor interpreta cada ACK como confirmación de un único mensaje. El receptor responde a la retransmisión del 0 con ack 3 (el siguiente que espera), así que el 0 nunca queda confirmado y el emisor lo retransmitiría sin fin. Por eso repetición continua necesita confirmación acumulativa.',
    },
  },
  {
    id: 'G4', query: 'p=gbn&k=2&w=3&n=4&tt=1&d=1&to=6&l=a1,a2,a3&t=end',
    title: { en: 'Largest window: no ambiguity', es: 'Ventana máxima: sin ambigüedad' },
    text: {
      en: 'Ws = 3 = 2^k − 1 and the first three ACKs are lost, so the sender retransmits 0, 1 and 2. The receiver, which expects 3, correctly recognises the retransmissions as duplicates: with this window none of them can have the number of the next message it expects. It discards them and answers ack 3, which confirms everything.',
      es: 'Ws = 3 = 2^k − 1 y se pierden las tres primeras confirmaciones, así que el emisor retransmite el 0, el 1 y el 2. El receptor, que espera el 3, reconoce correctamente las retransmisiones como duplicados: con esta ventana ninguna puede tener el número del siguiente mensaje que espera. Las descarta y responde ack 3, que lo confirma todo.',
    },
  },
  {
    id: 'G6', query: 'p=gbn&k=2&w=4&n=5&tt=1&d=1&to=6&l=a1,a2,a3,a4&t=end',
    title: { en: 'Go-back-N: window too large', es: 'Repetición continua: ventana demasiado grande' },
    text: {
      en: 'Ws = 4 = 2^k. The four ACKs are lost and the retransmission of 0 arrives when the receiver expects the next message numbered 0: it takes it as new and delivers it. That is why the window must satisfy Ws ≤ 2^k − 1.',
      es: 'Ws = 4 = 2^k. Se pierden las cuatro confirmaciones y la retransmisión del 0 llega cuando el receptor espera el siguiente mensaje con número 0: la toma por nueva y la entrega. Por eso la ventana debe cumplir Ws ≤ 2^k − 1.',
    },
  },
  {
    id: 'R1', query: 'p=sr&k=3&w=4&n=6&tt=1&d=1&to=7&ack=individual&l=d2.1&t=end',
    title: { en: 'Selective repeat: a lost message', es: 'Repetición selectiva: un mensaje perdido' },
    text: {
      en: 'Message 2 is lost. The receiver keeps 3, 4 and 5 (violet) and confirms each one, so the sender cancels their timers. When the timer of 2 expires, only 2 is retransmitted; when it arrives, the receiver delivers 2 to 5.',
      es: 'Se pierde el mensaje 2. El receptor guarda el 3, el 4 y el 5 (violeta) y confirma cada uno, así que el emisor cancela sus temporizadores. Cuando expira el del 2, solo se retransmite el 2; al llegar, el receptor entrega del 2 al 5.',
    },
  },
  {
    id: 'R3', query: 'p=sr&k=3&w=4&n=6&tt=1&d=1&to=7&ack=individual&l=a2&t=end',
    title: { en: 'Selective repeat: a lost ACK', es: 'Repetición selectiva: un ACK perdido' },
    text: {
      en: 'The ACK of message 1 is lost. Its timer expires and the sender retransmits it; the receiver had already delivered it, marks it as a duplicate and confirms it again. Without that new ACK, the sender would retransmit it forever.',
      es: 'Se pierde la confirmación del mensaje 1. Expira su temporizador y el emisor lo retransmite; el receptor ya lo había entregado, lo marca como duplicado y lo confirma de nuevo. Sin esa nueva confirmación, el emisor lo retransmitiría sin fin.',
    },
  },
  {
    id: 'R4', query: 'p=sr&k=3&w=4&n=6&tt=1&d=1&to=7&ack=cumulative&l=a2&t=end',
    title: { en: 'Selective repeat: a lost cumulative ACK', es: 'Repetición selectiva: un ACK acumulativo perdido' },
    text: {
      en: 'The ACK of message 1 is lost, but ACKs are cumulative: the next one, ack 3, also confirms 1, so nothing is retransmitted.',
      es: 'Se pierde la confirmación del mensaje 1, pero la confirmación es acumulativa: la siguiente, ack 3, también confirma el 1, así que no hay ninguna retransmisión.',
    },
  },
  {
    id: 'R5', query: 'p=sr&k=3&w=4&n=8&tt=1&d=1&to=7&ack=individual&l=a1,a2,a3,a4&t=end',
    title: { en: 'Selective repeat: largest window', es: 'Repetición selectiva: ventana máxima' },
    text: {
      en: 'W = 2^(k−1) = 4 and the first four ACKs are lost. The retransmissions fall outside the new receive window, so the receiver recognises them as duplicates and confirms them.',
      es: 'W = 2^(k−1) = 4 y se pierden las cuatro primeras confirmaciones. Las retransmisiones caen fuera de la nueva ventana de recepción, así que el receptor las reconoce como duplicados y las confirma.',
    },
  },
  {
    id: 'R6', query: 'p=sr&k=3&w=5&n=10&tt=1&d=1&to=7&ack=individual&l=a1,a2,a3,a4,a5&t=end',
    title: { en: 'Selective repeat: window too large', es: 'Repetición selectiva: ventana demasiado grande' },
    text: {
      en: 'W = 5 > 2^(k−1). After the five ACKs are lost, the retransmission of 0 falls inside the new receive window and is delivered as a new message. That is why selective repeat needs W ≤ 2^(k−1).',
      es: 'W = 5 > 2^(k−1). Tras perderse las cinco confirmaciones, la retransmisión del 0 cae dentro de la nueva ventana de recepción y se entrega como un mensaje nuevo. Por eso repetición selectiva necesita W ≤ 2^(k−1).',
    },
  },
  {
    id: 'C1', query: 'p=sr&k=3&w=4&n=4&tt=1&d=1&to=7&ack=cumulative&l=d2.1&t=end',
    title: { en: 'Cumulative ACKs: needless retransmission', es: 'Confirmación acumulativa: retransmisión innecesaria' },
    text: {
      en: 'Selective repeat with cumulative ACKs: four messages are sent and 2 is lost, so the receiver answers ack 1, 2 and 2. After 2 is retransmitted, ack 4 confirms everything, but the timer of 3 had already expired and 3 is retransmitted needlessly: the sender could not know it had arrived.',
      es: 'Repetición selectiva con confirmación acumulativa: se envían cuatro mensajes y se pierde el 2, así que el receptor responde ack 1, 2 y 2. Tras retransmitir el 2, ack 4 lo confirma todo, pero el temporizador del 3 ya había expirado y el 3 se retransmite sin necesidad: el emisor no podía saber que había llegado.',
    },
  },
  {
    id: 'B1', query: 'p=gbn&k=3&w=5&n=20&tt=1&d=2&to=10&t=end',
    title: { en: 'Window large enough: full channel', es: 'Ventana suficiente: canal lleno' },
    text: {
      en: 'a = 2 and Ws = 5 = 1 + 2a: the ACKs arrive just in time and the sender never stops. The transmission bands touch each other: theoretical U = 1.',
      es: 'a = 2 y Ws = 5 = 1 + 2a: las confirmaciones llegan justo a tiempo y el emisor nunca se detiene. Las franjas de transmisión se tocan: U teórico = 1.',
    },
  },
  {
    id: 'B2', query: 'p=gbn&k=3&w=3&n=21&tt=1&d=2&to=10&t=end',
    title: { en: 'Window too small', es: 'Ventana pequeña' },
    text: {
      en: 'a = 2 and Ws = 3 < 1 + 2a = 5: the sender sends its window and waits for the first ACK. There are gaps between the bands: theoretical U = 3/5 = 0.6.',
      es: 'a = 2 y Ws = 3 < 1 + 2a = 5: el emisor envía su ventana y espera a la primera confirmación. Entre las franjas hay huecos: U teórico = 3/5 = 0.6.',
    },
  },
  {
    id: 'B3', query: 'p=gbn&k=5&w=26&n=40&tt=0.4&d=5&to=15&t=end',
    title: { en: 'Message size does not change the bandwidth × delay product', es: 'El tamaño del mensaje no cambia el producto ancho de banda × retardo' },
    text: {
      en: 'Fibre, 1000 km, at R = 10 Mb/s with 500-byte messages (times in ms): Ttrans = 0.4 and Tprop = 5, so a = 12.5 and the window must hold 1 + 2a = 26 messages; with Ws = 26 the channel is full. With 1000-byte messages, a would be 6.25 and 14 messages would do. The data in flight is the same: BDP = R · 2·Tprop = 100 kbit = 12.5 KB, that is 25 messages of 500 bytes or 12.5 of 1000. It depends on the rate and the delay, not on the message size.',
      es: 'Fibra de 1000 km a R = 10 Mb/s con mensajes de 500 bytes (tiempos en ms): Ttrans = 0.4 y Tprop = 5, así que a = 12.5 y en la ventana deben caber 1 + 2a = 26 mensajes; con Ws = 26 el canal se llena. Con mensajes de 1000 bytes, a sería 6.25 y bastarían 14. Los datos en vuelo son los mismos: BDP = R · 2·Tprop = 100 kbit = 12.5 KB, es decir, 25 mensajes de 500 bytes o 12.5 de 1000. Depende de la velocidad y del retardo, no del tamaño del mensaje.',
    },
  },
  {
    id: 'B4', query: 'p=gbn&k=4&w=14&n=30&tt=0.8&d=5&to=15&t=end',
    title: { en: 'Fibre link, go-back-N', es: 'Enlace de fibra, repetición continua' },
    text: {
      en: 'Fibre, 1000 km (times in ms): a = 6.25 and 1 + 2a = 13.5. With k = 4, go-back-N allows Ws = 14 ≤ 15 and the channel is fully used.',
      es: 'Fibra de 1000 km (tiempos en ms): a = 6.25 y 1 + 2a = 13.5. Con k = 4, repetición continua admite Ws = 14 ≤ 15 y el canal se aprovecha por completo.',
    },
  },
  {
    id: 'B5', query: 'p=sr&k=4&w=14&n=30&tt=0.8&d=5&to=15&ack=individual&l=a1&t=end',
    title: { en: 'Fibre link, selective repeat with k = 4', es: 'Enlace de fibra, repetición selectiva con k = 4' },
    text: {
      en: 'Fibre, 1000 km (times in ms), selective repeat with k = 4 and Ws = 14: the largest window is 2^(k−1) = 8, so Ws = 14 is not valid. Losing the first ACK is enough for the retransmission of 0 to be delivered as a new message.',
      es: 'Fibra de 1000 km (tiempos en ms), repetición selectiva con k = 4 y Ws = 14: la ventana máxima es 2^(k−1) = 8, así que Ws = 14 no es válida. Basta con perder la primera confirmación para que la retransmisión del 0 se entregue como un mensaje nuevo.',
    },
  },
  {
    id: 'B6', query: 'p=sr&k=5&w=14&n=30&tt=0.8&d=5&to=15&ack=individual&l=a1&t=end',
    title: { en: 'Fibre link, selective repeat with k = 5', es: 'Enlace de fibra, repetición selectiva con k = 5' },
    text: {
      en: 'Fibre, 1000 km (times in ms), selective repeat with k = 5 and Ws = 14 ≤ 2^(k−1) = 16: the window is valid. The first ACK is lost and 0 is retransmitted; the receiver correctly recognises the retransmission as a duplicate. For the same window, selective repeat needs one more bit than go-back-N.',
      es: 'Fibra de 1000 km (tiempos en ms), repetición selectiva con k = 5 y Ws = 14 ≤ 2^(k−1) = 16: la ventana es válida. Se pierde la primera confirmación y el 0 se retransmite; el receptor reconoce correctamente la retransmisión como duplicado. Para la misma ventana, repetición selectiva necesita un bit más que repetición continua.',
    },
  },
  {
    id: 'B7', query: 'p=saw&n=6&tt=0.8&d=0.0005&to=1&t=end',
    title: { en: 'LAN, stop-and-wait', es: 'LAN, parada y espera' },
    text: {
      en: 'A 100 m LAN: a ≈ 0.0006, so U = 1 / (1 + 2a) ≈ 1. On a LAN stop-and-wait is enough; the window only matters when a is large.',
      es: 'LAN de 100 m: a ≈ 0.0006, así que U = 1 / (1 + 2a) ≈ 1. En una LAN basta con parada y espera; la ventana solo importa cuando a es grande.',
    },
  },
  {
    id: 'B8', query: 'p=saw&n=2&tt=0.8&d=250&to=600&t=end',
    title: { en: 'Satellite, stop-and-wait', es: 'Satélite, parada y espera' },
    text: {
      en: 'Geostationary satellite: a = 312.5 and U = 1/626 ≈ 0.16 %. The sender transmits for 0.8 ms and then waits half a second for each message. Long waits are drawn compressed (Δt).',
      es: 'Satélite geoestacionario: a = 312.5 y U = 1/626 ≈ 0.16 %. El emisor transmite durante 0.8 ms y espera medio segundo por cada mensaje. Las esperas largas se dibujan comprimidas (Δt).',
    },
  },
  {
    id: 'B9', query: 'p=gbn&k=5&w=31&n=40&tt=0.8&d=250&to=600&t=end',
    title: { en: 'Satellite, largest window with k = 5', es: 'Satélite, ventana máxima con k = 5' },
    text: {
      en: 'Go-back-N with the largest window k = 5 allows, Ws = 31: still far from 1 + 2a = 626, so U ≈ 5 %. Filling the channel would take 10-bit sequence numbers.',
      es: 'Repetición continua con la mayor ventana que permite k = 5, Ws = 31: sigue muy lejos de 1 + 2a = 626, así que U ≈ 5 %. Para llenar el canal harían falta números de secuencia de 10 bits.',
    },
  },
];

export const demoById = id => DEMOS.find(d => d.id === id) ?? null;

// Simulation options of a demo, as the URL would set them (for the tests).
export function demoOptions(demo) {
  const q = new URLSearchParams(demo.query);
  const num = name => (q.has(name) ? +q.get(name) : undefined);
  const opts = {
    k: num('k'), window: num('w'), count: num('n'), tTrans: num('tt'), tProp: num('d'),
    timeout: num('to'), ack: q.get('ack') ?? undefined,
    forcedLosses: (q.get('l') ?? '').split(',').filter(Boolean),
  };
  for (const key of Object.keys(opts)) if (opts[key] === undefined) delete opts[key];
  return { protocol: q.get('p'), opts };
}
