// UI texts in English and Spanish. An entry is a string or a function of an
// object of parameters. The simulation never produces text, only keys (the
// receiver notes), which are translated here.

const TEXTS = {
  en: {
    'title': 'ARQ protocols',
    'language': 'Language',
    'skip': 'Skip to content',
    'nav': 'Views',
    'view.demos': 'Demos',
    'view.sim': 'Simulation',
    'help': 'Help',
    'theme': 'Theme',
    'theme.system': 'Theme: system',
    'theme.light': 'Theme: light',
    'theme.dark': 'Theme: dark',
    'version': ({ v }) => `Version ${v}`,
    'demos.intro': 'Each demo loads a scenario ready to play from the start. Choose one:',
    'algorithm': 'Algorithm',
    'scenario': 'Scenario',
    'protocol': 'Protocol',
    'k.hint': 'Sequence number bits',
    'k.hint.fixed': 'Sequence number bits. Stop-and-wait does not allow other values.',
    'w.hint': 'Send window',
    'w.hint.fixed': 'Send window. Stop-and-wait does not allow other values.',
    'ack': 'ACKs',
    'ack.hint': 'Kind of ACKs',
    'ack.hint.fixed': 'Kind of ACKs. Stop-and-wait always uses cumulative ACKs.',
    'timeout': 'Timeout',
    'timeout.hint': 'Retransmission timer',
    'link': 'Link',
    'link.hint': 'Real links: L = 1000 bytes and R = 10 Mb/s, so tₜᵣₐₙₛ = 0.8 ms; times in ms. Choosing one also sets a timer slightly longer than the RTT.',
    'tt.hint': 'Transmission delay of a data message (L/R)',
    'd.hint': 'Propagation delay (d/v)',
    'messages': 'Messages',
    'loss': 'Losses (%)',
    'speed': 'Speed',
    'player': 'Playback of the simulation',
    'reset': 'Start',
    'prev': 'Previous step',
    'play': 'Play',
    'pause': 'Pause',
    'step': 'Next step',
    'end': 'End',
    'key.space': 'Space',
    'key.reset': 'Home',
    'key.prev': '←',
    'key.step': '→',
    'key.end': 'End',
    'at.start': 'Already at the start',
    'at.end': 'Already at the end',
    'step.counter': ({ k, n }) => `Step ${k} of ${n}`,
    'timeline.range': 'Time',
    'tape.title': 'Send window',
    'split.name': 'Controls',
    'split.title': 'Drag, or use ← and →, to change the width of the columns; double-click to restore it',
    'demo.modified': 'You have changed the scenario of this demo.',
    'demo.restore': 'Restore',
    'demo.close': 'Hide the explanation of the demo',
    'demo.open': 'Show the explanation of the demo',
    'no.data': 'No data',

    'proto.saw': 'Stop-and-wait',
    'proto.gbn': 'Go-back-N',
    'proto.sr': 'Selective repeat',
    'ack.cumulative': 'cumulative',
    'ack.individual': 'individual',
    'link.figures': 'a = 1 (tₜᵣₐₙₛ = tₚᵣₒₚ)',
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
    'click.lose': ({ name }) => `${name}: lose it (click or Enter)`,
    'click.deliver': ({ name }) => `${name}: deliver it (click or Enter)`,
    'diagram.name': ({ n, rtx }) =>
      `Space-time diagram: ${n} ${n === 1 ? 'message' : 'messages'}, ${rtx} ${rtx === 1 ? 'retransmission' : 'retransmissions'}. Below it, the same as a table.`,
    'events.title': 'The diagram as a table',
    'events.none': 'Nothing has been sent yet.',
    'events.sent': 'Leaves (t)',
    'events.message': 'Message',
    'events.arrives': 'Arrives (t)',
    'events.what': 'What happens',
    'events.lost': 'lost',
    'events.flight': 'in flight',
    'events.spurious': 'spurious retransmission',
    'events.idle': 'no effect on the sender',
    'gap.title': 'Compressed stretch: nothing happens during this time',

    'constraints': 'Constraints',
    'utilisation': 'Utilisation (U)',
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
      'Individual ACKs: if the ACK of a message is lost, the receiver answers its retransmission with the number of the next message it expects, which does not confirm it. The message is never confirmed and the sender retransmits it forever.',
    'check.efficient.ok': ({ Ws, min }) =>
      `Efficient window: W<sub>s</sub> = ${Ws} ≥ 1 + 2a = ${min}; the sender never stops.`,
    'check.efficient.warn': ({ Ws, min }) =>
      `Inefficient window: W<sub>s</sub> = ${Ws} &lt; 1 + 2a = ${min}; the sender stops to wait for ACKs.`,
    'check.efficient.saw': ({ min }) =>
      `Inefficient window, inherent to stop-and-wait: W<sub>s</sub> = 1 &lt; 1 + 2a = ${min}; the sender stops to wait for every ACK.`,
    'check.timeout.ok': ({ timeout, rtt }) =>
      `Timer: ${timeout} &gt; RTT = t<sub>trans</sub> + 2·t<sub>prop</sub> = ${rtt}`,
    'check.timeout.warn': ({ timeout, rtt }) =>
      `Short timer: ${timeout} ≤ RTT = t<sub>trans</sub> + 2·t<sub>prop</sub> = ${rtt}; there will be premature retransmissions and duplicates.`,
    'u.theory': 'Theoretical U = min(1, W<sub>s</sub> / (1 + 2a))',
    'u.measured': 'Measured U = N·t<sub>trans</sub> / T',
    'retransmissions': 'Retransmissions',
    'spurious.count': ({ n }) => `${n} spurious`,
    'spurious.title': 'Spurious retransmission: an earlier copy had already reached the receiver.',
    'u.hint': 'T: until every message is confirmed. The measured U is lower: it includes the start, the last RTT and the retransmissions.',

    'guide.legend': 'Legend',
    'legend.data': '«data N»: data message with sequence number N; «[RTX]»: retransmission.',
    'legend.spurious': 'Spurious retransmission: not needed, because an earlier copy had already reached the receiver (its ACK was lost, or the timer expired too early).',
    'legend.ack': '«ack N»: confirms message N−1 (cumulative: every message before N).',
    'legend.tape': 'Send window, above the diagram: every message in order. The window slides when an ACK confirms something; the messages it confirms flash blue with ✓ and then have no colour.',
    'legend.idle': 'ACK with no effect: it confirms nothing new (a duplicate), so the sender ignores it. What the sender does next is not due to it.',
    'legend.lost': 'Lost. Click an arrow to lose it or deliver it.',
    'legend.band': 'Transmission of a data message: t<sub>trans</sub> tall. Touching bands: the channel is always busy.',
    'legend.start': 'Timer started (one per message).',
    'legend.running': 'Timer running.',
    'legend.expire': 'Timer expired: retransmission.',
    'legend.cancel': 'Timer cancelled: message confirmed.',
    'legend.restart': 'Timer restarted by a retransmission.',
    'legend.sendBuffer': 'Send buffer, window framed in orange: sent and not confirmed (red), not sent yet (green, also beyond the window, waiting for it to move), free slot (no colour). Blue with ✓: confirmed by the ACKs that arrived since the previous row. A row without a label: an ACK arrived and confirmed something while no message left.',
    'legend.recvBuffer': 'Receive buffer: received, ready for the process (green); then the window, framed in orange: received but held behind a gap (violet), free slot (no colour).',
    'legend.notes': 'Receiver notes; failures in red.',
    'legend.break': 'Compressed idle stretch, with its real duration.',
    'legend.playhead': 'Current time.',
    'guide.utilisation': 'Utilisation',
    'guide.utilisation.body': `
      <p>With a = t<sub>prop</sub> / t<sub>trans</sub>, the first ACK arrives an RTT =
        t<sub>trans</sub> + 2·t<sub>prop</sub> after the first message starts leaving, and meanwhile
        the sender can send its W<sub>s</sub> messages. So the fraction of time it transmits is</p>
      <p class="formula">U = min(1, W<sub>s</sub> / (1 + 2a))</p>
      <p>The measured U = N·t<sub>trans</sub> / T, with T the time until every message is confirmed,
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
    'guide.keys': 'Keyboard',
    'guide.keys.body': `
      <p>With the focus on the player or on the diagram:</p>
      <dl class="keys">
        <dt><kbd>Space</kbd></dt><dd>Play or pause (on a button, it presses it).</dd>
        <dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>Previous or next step.</dd>
        <dt><kbd>Home</kbd> <kbd>End</kbd></dt><dd>Start or end.</dd>
      </dl>
      <p>On the diagram, the arrows are a single stop of <kbd>Tab</kbd>:</p>
      <dl class="keys">
        <dt><kbd>↑</kbd> <kbd>↓</kbd></dt><dd>Previous or next arrow, in the order they leave.</dd>
        <dt><kbd>Enter</kbd> <kbd>Space</kbd></dt><dd>Lose the arrow, or deliver it if it was lost.</dd>
      </dl>
      <p>On the column splitter, <kbd>←</kbd> and <kbd>→</kbd> change the width of the columns, and
        <kbd>Home</kbd> and <kbd>End</kbd> take it to its limits.</p>`,
    'guide.usage': 'Controls',
    'guide.usage.body': `
      <ul>
        <li><b>Algorithm</b>: protocol, k, W<sub>s</sub>, ACKs and timer. <b>Scenario</b>: link,
          delays, messages and losses. Editing the delays turns the link into «Custom».</li>
        <li>The diagram is not to scale: all data arrows are parallel, and so are all ACKs; when
          there is room, data arrows keep the same angle on every link. Long idle stretches are
          compressed (Δt). The times shown (t = …) are the real ones.</li>
        <li>The address keeps the state: copy it to share a scenario.</li>
      </ul>`,
  },

  es: {
    'title': 'Protocolos ARQ',
    'language': 'Idioma',
    'skip': 'Saltar al contenido',
    'nav': 'Vistas',
    'view.demos': 'Demos',
    'view.sim': 'Simulación',
    'help': 'Ayuda',
    'theme': 'Tema',
    'theme.system': 'Tema: sistema',
    'theme.light': 'Tema: claro',
    'theme.dark': 'Tema: oscuro',
    'version': ({ v }) => `Versión ${v}`,
    'demos.intro': 'Cada demo carga un escenario listo para reproducir desde el principio. Elige una:',
    'algorithm': 'Algoritmo',
    'scenario': 'Escenario',
    'protocol': 'Protocolo',
    'k.hint': 'Bits del número de secuencia',
    'k.hint.fixed': 'Bits del número de secuencia. Parada y espera no permite otros valores.',
    'w.hint': 'Ventana de emisión',
    'w.hint.fixed': 'Ventana de emisión. Parada y espera no permite otros valores.',
    'ack': 'Confirmación',
    'ack.hint': 'Tipo de confirmación',
    'ack.hint.fixed': 'Tipo de confirmación. Parada y espera usa siempre confirmación acumulativa.',
    'timeout': 'Temporizador',
    'timeout.hint': 'Temporizador de retransmisión',
    'link': 'Enlace',
    'link.hint': 'Enlaces reales: L = 1000 bytes y R = 10 Mb/s, así que tₜᵣₐₙₛ = 0.8 ms; tiempos en ms. Al elegir uno también se fija un temporizador algo mayor que el RTT.',
    'tt.hint': 'Retardo de transmisión de un mensaje de datos (L/R)',
    'd.hint': 'Retardo de propagación (d/v)',
    'messages': 'Mensajes',
    'loss': 'Pérdidas (%)',
    'speed': 'Velocidad',
    'player': 'Reproducción de la simulación',
    'reset': 'Inicio',
    'prev': 'Paso anterior',
    'play': 'Reproducir',
    'pause': 'Pausar',
    'step': 'Paso siguiente',
    'end': 'Fin',
    'key.space': 'Espacio',
    'key.reset': 'Inicio',
    'key.prev': '←',
    'key.step': '→',
    'key.end': 'Fin',
    'at.start': 'Ya estás en el principio',
    'at.end': 'Ya estás en el final',
    'step.counter': ({ k, n }) => `Paso ${k} de ${n}`,
    'timeline.range': 'Tiempo',
    'tape.title': 'Ventana de emisión',
    'split.name': 'Controles',
    'split.title': 'Arrastra, o usa ← y →, para cambiar el ancho de las columnas; doble clic para restablecerlo',
    'demo.modified': 'Has cambiado el escenario de esta demo.',
    'demo.restore': 'Restablecer',
    'demo.close': 'Ocultar la explicación de la demo',
    'demo.open': 'Mostrar la explicación de la demo',
    'no.data': 'Sin dato',

    'proto.saw': 'Parada y espera',
    'proto.gbn': 'Repetición continua',
    'proto.sr': 'Repetición selectiva',
    'ack.cumulative': 'acumulativa',
    'ack.individual': 'individual',
    'link.figures': 'a = 1 (tₜᵣₐₙₛ = tₚᵣₒₚ)',
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
    'click.lose': ({ name }) => `${name}: perderlo (clic o Intro)`,
    'click.deliver': ({ name }) => `${name}: entregarlo (clic o Intro)`,
    'diagram.name': ({ n, rtx }) =>
      `Diagrama espacio-tiempo: ${n} ${n === 1 ? 'mensaje' : 'mensajes'}, ${rtx} ${rtx === 1 ? 'retransmisión' : 'retransmisiones'}. Debajo, lo mismo como tabla.`,
    'events.title': 'El diagrama como tabla',
    'events.none': 'Todavía no se ha enviado nada.',
    'events.sent': 'Sale (t)',
    'events.message': 'Mensaje',
    'events.arrives': 'Llega (t)',
    'events.what': 'Qué ocurre',
    'events.lost': 'perdido',
    'events.flight': 'en vuelo',
    'events.spurious': 'retransmisión espuria',
    'events.idle': 'sin efecto en el emisor',
    'gap.title': 'Tramo comprimido: no ocurre nada durante este tiempo',

    'constraints': 'Restricciones',
    'utilisation': 'Aprovechamiento (U)',
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
      'Confirmación individual: si se pierde el ACK de un mensaje, el receptor responde a su retransmisión con el número del siguiente mensaje que espera, que no lo confirma. El mensaje nunca queda confirmado y el emisor lo retransmite sin fin.',
    'check.efficient.ok': ({ Ws, min }) =>
      `Ventana eficiente: W<sub>s</sub> = ${Ws} ≥ 1 + 2a = ${min}; el emisor no se detiene.`,
    'check.efficient.warn': ({ Ws, min }) =>
      `Ventana ineficiente: W<sub>s</sub> = ${Ws} &lt; 1 + 2a = ${min}; el emisor se detiene a esperar confirmaciones.`,
    'check.efficient.saw': ({ min }) =>
      `Ventana ineficiente, inherente a parada y espera: W<sub>s</sub> = 1 &lt; 1 + 2a = ${min}; el emisor se detiene a esperar cada confirmación.`,
    'check.timeout.ok': ({ timeout, rtt }) =>
      `Temporizador: ${timeout} &gt; RTT = t<sub>trans</sub> + 2·t<sub>prop</sub> = ${rtt}`,
    'check.timeout.warn': ({ timeout, rtt }) =>
      `Temporizador corto: ${timeout} ≤ RTT = t<sub>trans</sub> + 2·t<sub>prop</sub> = ${rtt}; habrá retransmisiones prematuras y duplicados.`,
    'u.theory': 'U teórico = min(1, W<sub>s</sub> / (1 + 2a))',
    'u.measured': 'U medido = N·t<sub>trans</sub> / T',
    'retransmissions': 'Retransmisiones',
    'spurious.count': ({ n }) => `${n} ${n === 1 ? 'espuria' : 'espurias'}`,
    'spurious.title': 'Retransmisión espuria: una copia anterior ya había llegado al receptor.',
    'u.hint': 'T: hasta que todo está confirmado. El U medido es menor: incluye el arranque, el último RTT y las retransmisiones.',

    'guide.legend': 'Leyenda',
    'legend.data': '«data N»: mensaje de datos con número de secuencia N; «[RTX]»: retransmisión.',
    'legend.spurious': 'Retransmisión espuria: no hacía falta, porque una copia anterior ya había llegado al receptor (se perdió su ACK o el temporizador expiró antes de tiempo).',
    'legend.ack': '«ack N»: confirma el mensaje N−1 (en acumulativa, todos los anteriores a N).',
    'legend.tape': 'Ventana de emisión, encima del diagrama: todos los mensajes en orden. La ventana se desliza cuando un ACK confirma algo; los mensajes que confirma parpadean en azul con ✓ y luego quedan sin color.',
    'legend.idle': 'ACK sin efecto: no confirma nada nuevo (es un duplicado), así que el emisor lo ignora. Lo que haga después el emisor no se debe a él.',
    'legend.lost': 'Perdido. Haz clic en una flecha para perderla o entregarla.',
    'legend.band': 'Transmisión de un mensaje de datos: mide t<sub>trans</sub>. Si las franjas se tocan, el canal está siempre ocupado.',
    'legend.start': 'Temporizador iniciado (uno por mensaje).',
    'legend.running': 'Temporizador en marcha.',
    'legend.expire': 'Temporizador expirado: retransmisión.',
    'legend.cancel': 'Temporizador cancelado: mensaje confirmado.',
    'legend.restart': 'Temporizador reiniciado por una retransmisión.',
    'legend.sendBuffer': 'Buffer de envío, ventana con marco naranja: enviado sin confirmar (rojo), aún no enviado (verde, también fuera de la ventana, esperando a que avance), hueco libre (sin color). Azul con ✓: confirmado por los ACK llegados desde la fila anterior. Una fila sin etiqueta: llegó un ACK que confirmó algo y no salió ningún mensaje.',
    'legend.recvBuffer': 'Buffer de recepción: recibido, listo para entregar al proceso (verde); después la ventana, con marco naranja: recibido pero retenido por un hueco (violeta), hueco libre (sin color).',
    'legend.notes': 'Notas del receptor; fallos en rojo.',
    'legend.break': 'Tramo sin eventos comprimido, con su duración real.',
    'legend.playhead': 'Instante actual.',
    'guide.utilisation': 'Aprovechamiento',
    'guide.utilisation.body': `
      <p>Con a = t<sub>prop</sub> / t<sub>trans</sub>, la primera confirmación llega un RTT =
        t<sub>trans</sub> + 2·t<sub>prop</sub> después de que empiece a salir el primer mensaje, y
        mientras tanto el emisor puede enviar sus W<sub>s</sub> mensajes. Así que la fracción del
        tiempo en que transmite es</p>
      <p class="formula">U = min(1, W<sub>s</sub> / (1 + 2a))</p>
      <p>El U medido = N·t<sub>trans</sub> / T, con T el tiempo hasta que todo está confirmado, es
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
    'guide.keys': 'Teclado',
    'guide.keys.body': `
      <p>Con el foco en el reproductor o en el diagrama:</p>
      <dl class="keys">
        <dt><kbd>Espacio</kbd></dt><dd>Reproducir o pausar (sobre un botón, lo pulsa).</dd>
        <dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>Paso anterior o siguiente.</dd>
        <dt><kbd>Inicio</kbd> <kbd>Fin</kbd></dt><dd>Principio o final.</dd>
      </dl>
      <p>En el diagrama, las flechas son una sola parada de <kbd>Tab</kbd>:</p>
      <dl class="keys">
        <dt><kbd>↑</kbd> <kbd>↓</kbd></dt><dd>Flecha anterior o siguiente, en el orden en que salen.</dd>
        <dt><kbd>Intro</kbd> <kbd>Espacio</kbd></dt><dd>Perder la flecha, o entregarla si estaba perdida.</dd>
      </dl>
      <p>En el divisor de las columnas, <kbd>←</kbd> y <kbd>→</kbd> cambian su ancho, e
        <kbd>Inicio</kbd> y <kbd>Fin</kbd> lo llevan a sus límites.</p>`,
    'guide.usage': 'Controles',
    'guide.usage.body': `
      <ul>
        <li><b>Algoritmo</b>: protocolo, k, W<sub>s</sub>, confirmación y temporizador.
          <b>Escenario</b>: enlace, retardos, mensajes y pérdidas. Si se editan los
          retardos, el enlace pasa a «Personalizado».</li>
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
