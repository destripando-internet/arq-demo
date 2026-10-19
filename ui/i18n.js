// UI texts in English and Spanish. An entry is a string or a function of an
// object of parameters. The simulation never produces text, only keys (the
// receiver notes), which are translated here.

const TEXTS = {
  en: {
    'title': 'ARQ protocols',
    'language': 'Language',
    'tab.sim': 'Simulation',
    'tab.guide': 'Guide',
    'algorithm': 'Algorithm',
    'scenario': 'Scenario',
    'protocol': 'Protocol',
    'k.title': 'Sequence number bits',
    'w.title': 'Send window',
    'ack': 'ACKs',
    'timeout': 'Timeout',
    'timeout.title': 'Retransmission timer',
    'link': 'Link',
    'link.title': 'Real links: L = 1000 bytes and R = 10 Mb/s, so Ttrans = 0.8 ms; times in ms. Choosing one also sets a timer slightly longer than the RTT.',
    'tt.title': 'Transmission delay of a data message (L/R)',
    'd.title': 'Propagation delay (d/v)',
    'calc.title': 'Computed from Ttrans and Tprop',
    'messages': 'Messages',
    'loss': 'Random loss',
    'speed': 'Speed',
    'book': 'Initial scenario',
    'book.title': 'Load the initial scenario of this protocol, with its losses',
    'clear': 'Clear losses',
    'clear.title': 'Remove the forced losses (those of the initial scenario or the URL and those added by clicking). Random losses stay.',
    'reset': 'Start',
    'prev': 'Previous event',
    'play': 'Play',
    'pause': 'Pause',
    'step': 'Next event',
    'end': 'End',
    'hint.arrows': 'Hint: click the arrows.',
    'progress': ({ time, confirmed, delivered, count }) =>
      `t = ${time} · confirmed ${confirmed}/${count} · delivered ${delivered}/${count}`,
    'wrong': ({ n }) => `(${n} wrong)`,

    'proto.saw': 'Stop-and-wait',
    'proto.gbn': 'Go-back-N',
    'proto.sr': 'Selective repeat',
    'ack.cumulative': 'cumulative',
    'ack.individual': 'individual',
    'link.figures': 'a = 1 (Ttrans = Tprop)',
    'link.lan': 'LAN, 100 m copper',
    'link.fibre': 'Fibre, 1000 km',
    'link.satellite': 'Geostationary satellite',
    'link.custom': 'Custom',

    'sender': 'Sender',
    'receiver': 'Receiver',
    'timeout!': 'timeout!',
    'loop!': 'endless loop',
    'note.duplicate': 'duplicate!',
    'note.discarded': 'discarded',
    'note.buffered': 'buffered',
    'note.accepted': 'duplicate accepted as new!',
    'click.lose': ({ key }) => `${key}: click to lose`,
    'click.deliver': ({ key }) => `${key}: click to deliver`,
    'gap.title': 'Compressed stretch: nothing happens during this time',

    'constraints': 'Constraints',
    'utilisation': 'Utilisation',
    'alert.failure': ({ t }) =>
      `Protocol failure: at t = ${t} the receiver takes a retransmission for a new message.`,
    'alert.loop': ({ t, seq }) =>
      `Endless loop: at t = ${t} the timer of data ${seq} expires again with nothing in flight and nothing changed since its previous expiry, so the sender would retransmit it forever. Simulation stopped.`,
    'alert.unfinished': ({ t }) =>
      `The transfer does not finish: the sender never gets every message confirmed (simulation stopped at t = ${t}).`,
    'check.window.ok': ({ Ws, Wr, M }) =>
      `Correct window size: W<sub>s</sub> + W<sub>r</sub> = ${Ws} + ${Wr} ≤ 2<sup>k</sup> = ${M}`,
    'check.window.error': ({ Ws, Wr, M, max }) =>
      `Incorrect window size: W<sub>s</sub> + W<sub>r</sub> = ${Ws} + ${Wr} &gt; 2<sup>k</sup> = ${M} (maximum W<sub>s</sub> = ${max}). The receiver may take a retransmission for a new message.`,
    'check.ack.ok':
      'Cumulative ACKs: the receiver only confirms the last in-order message, and that ACK also confirms every earlier one.',
    'check.ack.error':
      'Individual ACKs: the receiver only confirms the last in-order message. If an ACK is lost, the message it confirmed is never confirmed and the sender retransmits it forever.',
    'check.efficient.ok': ({ Ws, min }) =>
      `Efficient window: W<sub>s</sub> = ${Ws} ≥ 1 + 2a = ${min}; the sender never stops.`,
    'check.efficient.warn': ({ Ws, min }) =>
      `Inefficient window: W<sub>s</sub> = ${Ws} &lt; 1 + 2a = ${min}; the sender stops to wait for ACKs.`,
    'check.timeout.ok': ({ timeout, rtt }) =>
      `Timer: ${timeout} &gt; RTT = T<sub>trans</sub> + 2·T<sub>prop</sub> = ${rtt}`,
    'check.timeout.warn': ({ timeout, rtt }) =>
      `Short timer: ${timeout} ≤ RTT = T<sub>trans</sub> + 2·T<sub>prop</sub> = ${rtt}; there will be premature retransmissions and duplicates.`,
    'u.theory': 'Theoretical U = min(1, W<sub>s</sub> / (1 + 2a))',
    'u.measured': 'Measured U = N·T<sub>trans</sub> / T',
    'retransmissions': 'Retransmissions',
    'u.hint': 'T: until every message is confirmed. The measured U is lower: it includes the start, the last RTT and the retransmissions.',

    'guide.legend': 'Legend',
    'legend.data': '«data N»: data message with sequence number N; «[RTX]»: retransmission.',
    'legend.ack': '«ack N»: confirms message N−1 (cumulative: every message before N).',
    'legend.idle': 'ACK with no effect: it confirms nothing new (a duplicate), so the sender ignores it. What the sender does next is not due to it.',
    'legend.lost': 'Lost. Click an arrow to lose it or deliver it.',
    'legend.band': 'Transmission of a data message: T<sub>trans</sub> tall. Touching bands: the channel is always busy.',
    'legend.start': 'Timer started (one per message).',
    'legend.running': 'Timer running.',
    'legend.expire': 'Timer expired: retransmission.',
    'legend.cancel': 'Timer cancelled: message confirmed.',
    'legend.restart': 'Timer restarted by a retransmission.',
    'legend.sendBuffer': 'Send buffer, window framed in orange: sent and not confirmed (red), not sent yet (green), free slot (no colour). Blue with ✓: confirmed by the ACKs that arrived since the previous row. A row without a label: an ACK arrived and confirmed something while no message left.',
    'legend.recvBuffer': 'Receive buffer: received, ready for the process (green); then the window, framed in orange: received but held behind a gap (violet), free slot (no colour).',
    'legend.notes': 'Receiver notes; failures in red.',
    'legend.break': 'Compressed idle stretch, with its real duration.',
    'legend.playhead': 'Current time.',
    'guide.utilisation': 'Utilisation',
    'guide.utilisation.body': `
      <p>With a = T<sub>prop</sub> / T<sub>trans</sub>, the first ACK arrives an RTT =
        T<sub>trans</sub> + 2·T<sub>prop</sub> after the first message starts leaving, and meanwhile
        the sender can send its W<sub>s</sub> messages. So the fraction of time it transmits is</p>
      <p class="formula">U = min(1, W<sub>s</sub> / (1 + 2a))</p>
      <p>The measured U = N·T<sub>trans</sub> / T, with T the time until every message is confirmed,
        is lower: it includes the start, the last RTT and the retransmissions.</p>`,
    'guide.constraints': 'Constraints',
    'guide.constraints.body': `
      <ul>
        <li>Window size: W<sub>s</sub> + W<sub>r</sub> ≤ 2<sup>k</sup>. Stop-and-wait: 1 + 1.
          Go-back-N: W<sub>r</sub> = 1. Selective repeat: W<sub>s</sub> = W<sub>r</sub>.</li>
        <li>Go-back-N needs cumulative ACKs.</li>
        <li>Efficiency: W<sub>s</sub> ≥ 1 + 2a.</li>
        <li>Timer longer than the RTT.</li>
      </ul>
      <p>Red: the protocol may fail. Yellow: it works, but worse. If the same retransmission would
        repeat forever, the simulation stops.</p>`,
    'guide.usage': 'Controls',
    'guide.usage.body': `
      <ul>
        <li><b>Algorithm</b>: protocol, k, W<sub>s</sub>, ACKs and timer. <b>Scenario</b>: link,
          delays, messages and losses. Editing the delays turns the link into «Custom».</li>
        <li><b>Initial scenario</b>: a typical case for the protocol. <b>Clear losses</b>: removes
          the forced ones (initial scenario, URL or clicks).</li>
        <li>The diagram is not to scale: all data arrows are parallel, and so are all ACKs; when
          there is room, data arrows keep the same angle on every link. Long idle stretches are
          compressed (Δt). The times shown (t = …) are the real ones.</li>
        <li>The address keeps the state: copy it to share a scenario.</li>
      </ul>`,
  },

  es: {
    'title': 'Protocolos ARQ',
    'language': 'Idioma',
    'tab.sim': 'Simulación',
    'tab.guide': 'Guía',
    'algorithm': 'Algoritmo',
    'scenario': 'Escenario',
    'protocol': 'Protocolo',
    'k.title': 'Bits del número de secuencia',
    'w.title': 'Ventana de emisión',
    'ack': 'Confirmación',
    'timeout': 'Temporizador',
    'timeout.title': 'Temporizador de retransmisión',
    'link': 'Enlace',
    'link.title': 'Enlaces reales: L = 1000 bytes y R = 10 Mb/s, así que Ttrans = 0.8 ms; tiempos en ms. Al elegir uno también se fija un temporizador algo mayor que el RTT.',
    'tt.title': 'Retardo de transmisión de un mensaje de datos (L/R)',
    'd.title': 'Retardo de propagación (d/v)',
    'calc.title': 'Calculado a partir de Ttrans y Tprop',
    'messages': 'Mensajes',
    'loss': 'Pérdida aleatoria',
    'speed': 'Velocidad',
    'book': 'Escenario inicial',
    'book.title': 'Carga el escenario inicial de este protocolo, con sus pérdidas',
    'clear': 'Quitar pérdidas',
    'clear.title': 'Quita las pérdidas forzadas (las del escenario inicial o de la URL y las añadidas con clic). Las aleatorias se mantienen.',
    'reset': 'Inicio',
    'prev': 'Evento anterior',
    'play': 'Reproducir',
    'pause': 'Pausa',
    'step': 'Siguiente evento',
    'end': 'Final',
    'hint.arrows': 'Pista: haz clic en las flechas.',
    'progress': ({ time, confirmed, delivered, count }) =>
      `t = ${time} · confirmados ${confirmed}/${count} · entregados ${delivered}/${count}`,
    'wrong': ({ n }) => `(${n} ${n === 1 ? 'erróneo' : 'erróneos'})`,

    'proto.saw': 'Parada y espera',
    'proto.gbn': 'Repetición continua',
    'proto.sr': 'Repetición selectiva',
    'ack.cumulative': 'acumulativa',
    'ack.individual': 'individual',
    'link.figures': 'a = 1 (Ttrans = Tprop)',
    'link.lan': 'LAN, 100 m de cobre',
    'link.fibre': 'Fibra, 1000 km',
    'link.satellite': 'Satélite geoestacionario',
    'link.custom': 'Personalizado',

    'sender': 'Emisor',
    'receiver': 'Receptor',
    'timeout!': 'timeout!',
    'loop!': 'bucle sin fin',
    'note.duplicate': 'duplicado!',
    'note.discarded': 'descartado',
    'note.buffered': 'guardado',
    'note.accepted': '¡duplicado aceptado como nuevo!',
    'click.lose': ({ key }) => `${key}: clic para perder`,
    'click.deliver': ({ key }) => `${key}: clic para entregar`,
    'gap.title': 'Tramo comprimido: no ocurre nada durante este tiempo',

    'constraints': 'Restricciones',
    'utilisation': 'Aprovechamiento',
    'alert.failure': ({ t }) =>
      `El protocolo falla: en t = ${t} el receptor toma una retransmisión por un mensaje nuevo.`,
    'alert.loop': ({ t, seq }) =>
      `Bucle sin fin: en t = ${t} el temporizador de data ${seq} vuelve a expirar sin nada en vuelo y sin ningún cambio desde su expiración anterior, así que el emisor lo retransmitiría indefinidamente. Simulación detenida.`,
    'alert.unfinished': ({ t }) =>
      `La transferencia no termina: el emisor nunca recibe la confirmación de todos los mensajes (simulación detenida en t = ${t}).`,
    'check.window.ok': ({ Ws, Wr, M }) =>
      `Tamaño de ventana correcto: W<sub>s</sub> + W<sub>r</sub> = ${Ws} + ${Wr} ≤ 2<sup>k</sup> = ${M}`,
    'check.window.error': ({ Ws, Wr, M, max }) =>
      `Tamaño de ventana incorrecto: W<sub>s</sub> + W<sub>r</sub> = ${Ws} + ${Wr} &gt; 2<sup>k</sup> = ${M} (máximo W<sub>s</sub> = ${max}). El receptor puede confundir una retransmisión con un mensaje nuevo.`,
    'check.ack.ok':
      'Confirmación acumulativa: el receptor solo confirma el último mensaje en orden y ese ACK confirma también todos los anteriores.',
    'check.ack.error':
      'Confirmación individual: el receptor solo confirma el último mensaje en orden. Si se pierde un ACK, el mensaje que confirmaba no se confirmará nunca y el emisor lo retransmitirá indefinidamente.',
    'check.efficient.ok': ({ Ws, min }) =>
      `Ventana eficiente: W<sub>s</sub> = ${Ws} ≥ 1 + 2a = ${min}; el emisor no se detiene.`,
    'check.efficient.warn': ({ Ws, min }) =>
      `Ventana ineficiente: W<sub>s</sub> = ${Ws} &lt; 1 + 2a = ${min}; el emisor se detiene a esperar confirmaciones.`,
    'check.timeout.ok': ({ timeout, rtt }) =>
      `Temporizador: ${timeout} &gt; RTT = T<sub>trans</sub> + 2·T<sub>prop</sub> = ${rtt}`,
    'check.timeout.warn': ({ timeout, rtt }) =>
      `Temporizador corto: ${timeout} ≤ RTT = T<sub>trans</sub> + 2·T<sub>prop</sub> = ${rtt}; habrá retransmisiones prematuras y duplicados.`,
    'u.theory': 'U teórico = min(1, W<sub>s</sub> / (1 + 2a))',
    'u.measured': 'U medido = N·T<sub>trans</sub> / T',
    'retransmissions': 'Retransmisiones',
    'u.hint': 'T: hasta que todo está confirmado. El U medido es menor: incluye el arranque, el último RTT y las retransmisiones.',

    'guide.legend': 'Leyenda',
    'legend.data': '«data N»: mensaje de datos con número de secuencia N; «[RTX]»: retransmisión.',
    'legend.ack': '«ack N»: confirma el mensaje N−1 (en acumulativa, todos los anteriores a N).',
    'legend.idle': 'ACK sin efecto: no confirma nada nuevo (es un duplicado), así que el emisor lo ignora. Lo que haga después el emisor no se debe a él.',
    'legend.lost': 'Perdido. Haz clic en una flecha para perderla o entregarla.',
    'legend.band': 'Transmisión de un mensaje de datos: mide T<sub>trans</sub>. Si las franjas se tocan, el canal está siempre ocupado.',
    'legend.start': 'Temporizador iniciado (uno por mensaje).',
    'legend.running': 'Temporizador en marcha.',
    'legend.expire': 'Temporizador expirado: retransmisión.',
    'legend.cancel': 'Temporizador cancelado: mensaje confirmado.',
    'legend.restart': 'Temporizador reiniciado por una retransmisión.',
    'legend.sendBuffer': 'Buffer de envío, ventana con marco naranja: enviado sin confirmar (rojo), aún no enviado (verde), hueco libre (sin color). Azul con ✓: confirmado por los ACK llegados desde la fila anterior. Una fila sin etiqueta: llegó un ACK que confirmó algo y no salió ningún mensaje.',
    'legend.recvBuffer': 'Buffer de recepción: recibido, listo para entregar al proceso (verde); después la ventana, con marco naranja: recibido pero retenido por un hueco (violeta), hueco libre (sin color).',
    'legend.notes': 'Notas del receptor; fallos en rojo.',
    'legend.break': 'Tramo sin eventos comprimido, con su duración real.',
    'legend.playhead': 'Instante actual.',
    'guide.utilisation': 'Aprovechamiento',
    'guide.utilisation.body': `
      <p>Con a = T<sub>prop</sub> / T<sub>trans</sub>, la primera confirmación llega un RTT =
        T<sub>trans</sub> + 2·T<sub>prop</sub> después de que empiece a salir el primer mensaje, y
        mientras tanto el emisor puede enviar sus W<sub>s</sub> mensajes. Así que la fracción del
        tiempo en que transmite es</p>
      <p class="formula">U = min(1, W<sub>s</sub> / (1 + 2a))</p>
      <p>El U medido = N·T<sub>trans</sub> / T, con T el tiempo hasta que todo está confirmado, es
        menor: incluye el arranque, el último RTT y las retransmisiones.</p>`,
    'guide.constraints': 'Restricciones',
    'guide.constraints.body': `
      <ul>
        <li>Tamaño de ventana: W<sub>s</sub> + W<sub>r</sub> ≤ 2<sup>k</sup>. Parada y espera: 1 + 1.
          Repetición continua: W<sub>r</sub> = 1. Repetición selectiva: W<sub>s</sub> = W<sub>r</sub>.</li>
        <li>Repetición continua necesita confirmación acumulativa.</li>
        <li>Eficiencia: W<sub>s</sub> ≥ 1 + 2a.</li>
        <li>Temporizador mayor que el RTT.</li>
      </ul>
      <p>Rojo: el protocolo puede fallar. Amarillo: funciona, pero peor. Si la misma retransmisión
        se fuera a repetir para siempre, la simulación se detiene.</p>`,
    'guide.usage': 'Controles',
    'guide.usage.body': `
      <ul>
        <li><b>Algoritmo</b>: protocolo, k, W<sub>s</sub>, confirmación y temporizador.
          <b>Escenario</b>: enlace, retardos, mensajes y pérdidas. Si se editan los
          retardos, el enlace pasa a «Personalizado».</li>
        <li><b>Escenario inicial</b>: un caso típico del protocolo. <b>Quitar pérdidas</b>: quita las
          forzadas (escenario inicial, URL o clics).</li>
        <li>El diagrama no está a escala: todas las flechas de datos son paralelas, igual que las de
          los ACK, y si hay sitio las de datos tienen el mismo ángulo en cualquier enlace. Las esperas
          largas se comprimen (Δt). Los tiempos que se muestran (t = …) son los reales.</li>
        <li>La dirección guarda el estado: cópiala para compartir un escenario.</li>
      </ul>`,
  },
};

export const LANGS = Object.keys(TEXTS);
let current = 'en';

export const lang = () => current;

export function setLang(code) {
  current = TEXTS[code] ? code : 'en';
}

export function t(key, args = {}) {
  const entry = TEXTS[current][key] ?? TEXTS.en[key] ?? key;
  return typeof entry === 'function' ? entry(args) : entry;
}
