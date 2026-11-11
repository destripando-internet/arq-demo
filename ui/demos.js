// Catalogue of the demos listed in README.md: ?demo=ID loads the scenario and
// shows what it demonstrates. Texts are for students: each one stands alone
// (never «the same loss as…», since a demo may be the only one they open)
// and never mentions the book. Numbers use a decimal point, as the rest of
// the UI. README.md repeats the English titles and texts: keep both in sync.

// Sections of the «Demos» tab and of README.md, in order: a demo belongs to
// the one its ID starts with.
export const GROUPS = [
  { id: 'T', title: { en: 'Getting started', es: 'Primeros pasos' } },
  { id: 'S', title: { en: 'Stop-and-wait', es: 'Parada y espera' } },
  {
    id: 'G', title: { en: 'Go-back-N', es: 'Repetición continua' },
    text: {
      en: 'Cumulative ACKs; when a timer expires, that message and every later one already sent are retransmitted (each message has its own timer).',
      es: 'Confirmación acumulativa; cuando expira un temporizador se retransmiten ese mensaje y todos los posteriores ya enviados (cada mensaje tiene su propio temporizador).',
    },
  },
  {
    id: 'R', title: { en: 'Selective repeat', es: 'Repetición selectiva' },
    text: {
      en: 'Individual ACKs by default; cumulative ACKs are an option («ACKs»). When a timer expires, only that message is retransmitted.',
      es: 'Confirmación individual por defecto; la acumulativa es una opción («Confirmación»). Cuando expira un temporizador, solo se retransmite ese mensaje.',
    },
  },
  { id: 'C', title: { en: 'Cumulative ACKs', es: 'Confirmación acumulativa' } },
  { id: 'B', title: { en: 'Bandwidth × delay', es: 'Ancho de banda × retardo' } },
];

export const DEMOS = [
  {
    id: 'T1', query: 'p=saw&n=3&tt=1&d=1&to=5',
    title: { en: 'How to read the diagram', es: 'Cómo leer el diagrama' },
    text: {
      en: 'Stop-and-wait with a = 1 and three messages, none lost. Time runs downwards, with the sender on the left and the receiver on the right. Each «data» arrow is a message and each «ack» arrow comes back to confirm it; the sender waits for it before sending the next one. Press «Play» to play it, or «End» to see the end. Then click an arrow to «lose» that message: its timer expires and the sender retransmits it. The Help explains every symbol.',
      es: 'Parada y espera con a = 1 y tres mensajes, sin pérdidas. El tiempo avanza hacia abajo, con el emisor a la izquierda y el receptor a la derecha. Cada flecha «data» es un mensaje y cada flecha «ack» vuelve para confirmarlo; el emisor la espera antes de enviar el siguiente. Pulsa «Reproducir» para reproducirlo, o «Fin» para ver el final. Después haz clic en una flecha para «perder» ese mensaje: su temporizador expira y el emisor lo retransmite. La Ayuda explica cada símbolo.',
    },
  },
  {
    id: 'S1', query: 'p=saw&n=3&tt=1&d=1&to=5&l=d1.1,a3',
    title: { en: 'Lost message and lost ACK', es: 'Mensaje perdido y ACK perdido' },
    text: {
      en: 'Message 1 is lost: its timer expires and the sender retransmits it. Then the ACK of the second message 0 is lost, so the sender retransmits that one too and the receiver gets a duplicate. It discards it but confirms it anyway; otherwise the sender would retransmit it forever.',
      es: 'Se pierde el mensaje 1: su temporizador expira y el emisor lo retransmite. Después se pierde la confirmación del segundo mensaje 0, así que el emisor también lo retransmite y al receptor le llega un duplicado. Lo descarta, pero lo confirma igualmente; si no fuera así, lo retransmitiría sin fin.',
    },
  },
  {
    id: 'S2', query: 'p=saw&n=3&tt=1&d=1&to=2',
    title: { en: 'Timer shorter than the RTT', es: 'Temporizador menor que el RTT' },
    text: {
      en: 'The timer (2) is shorter than the RTT (3). Nothing is lost, but every message is retransmitted before its ACK can arrive. The receiver discards and confirms the duplicates, and the sender ignores the repeated ACKs (dashed) thanks to their number. It works, with twice as many transmissions.',
      es: 'El temporizador (2) es menor que el RTT (3). No se pierde nada, pero cada mensaje se retransmite antes de que pueda llegar su confirmación. El receptor descarta y confirma los duplicados, y el emisor ignora las confirmaciones repetidas (discontinuas) gracias a su número. Funciona, pero con el doble de envíos.',
    },
  },
  {
    id: 'S3', query: 'p=saw&n=6&tt=1&d=2&to=7',
    title: { en: 'Stop-and-wait utilisation', es: 'Aprovechamiento de parada y espera' },
    text: {
      en: 'With a = t<sub>prop</sub> / t<sub>trans</sub> = 2, the sender spends most of the time waiting for ACKs: U = 1 / (1 + 2a) = 0.2. The channel is busy only a fifth of the time (the grey bands).',
      es: 'Con a = t<sub>prop</sub> / t<sub>trans</sub> = 2, el emisor pasa la mayor parte del tiempo esperando confirmaciones: U = 1 / (1 + 2a) = 0.2. El canal solo está ocupado una quinta parte del tiempo (las franjas grises).',
    },
  },
  {
    id: 'G1', query: 'p=gbn&k=2&w=3&n=4&tt=1&d=1&to=6&l=d1.1',
    title: { en: 'Go-back-N: a lost message', es: 'Repetición continua: un mensaje perdido' },
    text: {
      en: 'Message 1 is lost. The receiver only accepts messages in order, so it discards 2 and 3 and answers with duplicate ACKs 1, which have no effect. When the timer of 1 expires, the sender goes back and retransmits 1, 2 and 3: hence the name of the protocol.',
      es: 'Se pierde el mensaje 1. El receptor solo acepta mensajes en orden, así que descarta el 2 y el 3 y responde con ack 1 duplicados, que no tienen efecto. Cuando expira el temporizador del 1, el emisor retrocede y retransmite el 1, el 2 y el 3: de ahí el nombre del protocolo.',
    },
  },
  {
    id: 'G2', query: 'p=gbn&k=2&w=3&n=4&tt=1&d=1&to=6&l=a1',
    title: { en: 'Go-back-N: a lost ACK', es: 'Repetición continua: un ACK perdido' },
    text: {
      en: 'The ACK of message 0 is lost. Nothing happens: ACKs are cumulative, so ack 2 confirms 0 and 1 at once and nothing is retransmitted.',
      es: 'Se pierde la confirmación del mensaje 0. No pasa nada: la confirmación es acumulativa, así que ack 2 confirma el 0 y el 1 a la vez y no hay ninguna retransmisión.',
    },
  },
  {
    id: 'G3', query: 'p=gbn&k=2&w=3&n=4&tt=1&d=1&to=6&ack=individual&l=a1',
    title: { en: 'Go-back-N without cumulative ACKs', es: 'Repetición continua sin confirmación acumulativa' },
    text: {
      en: 'The ACK of message 0 is lost, and the sender reads each ACK as confirming a single message. The receiver answers the retransmission of 0 with ack 3 (the next one it expects), so 0 is never confirmed and the sender would retransmit it forever. That is why go-back-N needs cumulative ACKs.',
      es: 'Se pierde la confirmación del mensaje 0 y el emisor interpreta cada ACK como confirmación de un único mensaje. El receptor responde a la retransmisión del 0 con ack 3 (el siguiente que espera), así que el 0 nunca queda confirmado y el emisor lo retransmitiría sin fin. Por eso repetición continua necesita confirmación acumulativa.',
    },
  },
  {
    id: 'G6', query: 'p=gbn&k=2&w=4&n=5&tt=1&d=1&to=6&l=a1,a2,a3,a4',
    title: { en: 'Go-back-N: window too large', es: 'Repetición continua: ventana demasiado grande' },
    text: {
      en: 'Ws = 4 = 2^k. The four ACKs are lost and the retransmission of 0 arrives when the receiver expects the next message numbered 0: it takes it as new and delivers it. That is why the window must satisfy Ws ≤ 2^k − 1.',
      es: 'Ws = 4 = 2^k. Se pierden las cuatro confirmaciones y la retransmisión del 0 llega cuando el receptor espera el siguiente mensaje con número 0: la toma por nueva y la entrega. Por eso la ventana debe cumplir Ws ≤ 2^k − 1.',
    },
  },
  {
    id: 'R1', query: 'p=sr&k=3&w=4&n=6&tt=1&d=1&to=7&ack=individual&l=d2.1',
    title: { en: 'Selective repeat: a lost message', es: 'Repetición selectiva: un mensaje perdido' },
    text: {
      en: 'Message 2 is lost. The receiver keeps 3, 4 and 5 (violet) and confirms each one, so the sender cancels their timers. When the timer of 2 expires, only 2 is retransmitted; when it arrives, the receiver delivers 2 to 5.',
      es: 'Se pierde el mensaje 2. El receptor guarda el 3, el 4 y el 5 (violeta) y confirma cada uno, así que el emisor cancela sus temporizadores. Cuando expira el del 2, solo se retransmite el 2; al llegar, el receptor entrega del 2 al 5.',
    },
  },
  {
    id: 'R3', query: 'p=sr&k=3&w=4&n=6&tt=1&d=1&to=7&ack=individual&l=a2',
    title: { en: 'Selective repeat: a lost ACK', es: 'Repetición selectiva: un ACK perdido' },
    text: {
      en: 'The ACK of message 1 is lost. Its timer expires and the sender retransmits it; the receiver had already delivered it, marks it as a duplicate and confirms it again. Without that new ACK, the sender would retransmit it forever.',
      es: 'Se pierde la confirmación del mensaje 1. Expira su temporizador y el emisor lo retransmite; el receptor ya lo había entregado, lo marca como duplicado y lo confirma de nuevo. Sin esa nueva confirmación, el emisor lo retransmitiría sin fin.',
    },
  },
  {
    id: 'R6', query: 'p=sr&k=3&w=5&n=10&tt=1&d=1&to=7&ack=individual&l=a1,a2,a3,a4,a5',
    title: { en: 'Selective repeat: window too large', es: 'Repetición selectiva: ventana demasiado grande' },
    text: {
      en: 'W = 5 > 2^(k−1). After the five ACKs are lost, the retransmission of 0 falls inside the new receive window and is delivered as a new message. That is why selective repeat needs W ≤ 2^(k−1).',
      es: 'W = 5 > 2^(k−1). Tras perderse las cinco confirmaciones, la retransmisión del 0 cae dentro de la nueva ventana de recepción y se entrega como un mensaje nuevo. Por eso repetición selectiva necesita W ≤ 2^(k−1).',
    },
  },
  {
    id: 'C1', query: 'p=sr&k=3&w=4&n=4&tt=1&d=1&to=7&ack=cumulative&l=d2.1',
    title: { en: 'Cumulative ACKs: needless retransmission', es: 'Confirmación acumulativa: retransmisión innecesaria' },
    text: {
      en: 'Selective repeat with cumulative ACKs: four messages are sent and 2 is lost, so the receiver answers ack 1, 2 and 2. After 2 is retransmitted, ack 4 confirms everything, but the timer of 3 had already expired and 3 is retransmitted needlessly: the sender could not know it had arrived.',
      es: 'Repetición selectiva con confirmación acumulativa: se envían cuatro mensajes y se pierde el 2, así que el receptor responde ack 1, 2 y 2. Tras retransmitir el 2, ack 4 lo confirma todo, pero el temporizador del 3 ya había expirado y el 3 se retransmite sin necesidad: el emisor no podía saber que había llegado.',
    },
  },
  {
    id: 'B1', query: 'p=gbn&k=3&w=5&n=20&tt=1&d=2&to=10',
    title: { en: 'Window large enough: full channel', es: 'Ventana suficiente: canal lleno' },
    text: {
      en: 'a = 2 and Ws = 5 = 1 + 2a: the ACKs arrive just in time and the sender never stops. The transmission bands touch each other: theoretical U = 1.',
      es: 'a = 2 y Ws = 5 = 1 + 2a: las confirmaciones llegan justo a tiempo y el emisor nunca se detiene. Las franjas de transmisión se tocan: U teórico = 1.',
    },
  },
  {
    id: 'B2', query: 'p=gbn&k=3&w=3&n=21&tt=1&d=2&to=10',
    title: { en: 'Window too small', es: 'Ventana pequeña' },
    text: {
      en: 'a = 2 and Ws = 3 < 1 + 2a = 5: the sender sends its window and waits for the first ACK. There are gaps between the bands: theoretical U = 3/5 = 0.6.',
      es: 'a = 2 y Ws = 3 < 1 + 2a = 5: el emisor envía su ventana y espera a la primera confirmación. Entre las franjas hay huecos: U teórico = 3/5 = 0.6.',
    },
  },
  {
    id: 'B8', query: 'p=saw&n=2&tt=0.8&d=250&to=600',
    title: { en: 'Satellite, stop-and-wait', es: 'Satélite, parada y espera' },
    text: {
      en: 'Geostationary satellite: a = 312.5 and U = 1/626 ≈ 0.16 %. The sender transmits for 0.8 ms and then waits half a second for each message. Long waits are drawn compressed (Δt).',
      es: 'Satélite geoestacionario: a = 312.5 y U = 1/626 ≈ 0.16 %. El emisor transmite durante 0.8 ms y espera medio segundo por cada mensaje. Las esperas largas se dibujan comprimidas (Δt).',
    },
  },
  {
    id: 'B9', query: 'p=gbn&k=5&w=31&n=40&tt=0.8&d=250&to=600',
    title: { en: 'Satellite, largest window with k = 5', es: 'Satélite, ventana máxima con k = 5' },
    text: {
      en: 'Go-back-N with the largest window k = 5 allows, Ws = 31: still far from 1 + 2a = 626, so U ≈ 5 %. Filling the channel would take 10-bit sequence numbers.',
      es: 'Repetición continua con la mayor ventana que permite k = 5, Ws = 31: sigue muy lejos de 1 + 2a = 626, así que U ≈ 5 %. Para llenar el canal harían falta números de secuencia de 10 bits.',
    },
  },
];

export const demoById = id => DEMOS.find(d => d.id === id) ?? null;
export const demosIn = group => DEMOS.filter(d => d.id.startsWith(group.id));

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
