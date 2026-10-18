# arq-demo — plan de trabajo

Aplicación web estática para demostrar el funcionamiento de los protocolos
ARQ descritos en el capítulo «Confiabilidad y control de flujo»
(`reliability.tex`) del libro. Se despliega en GitHub Pages sin paso de
compilación.

## Objetivos

- Mostrar en un diagrama espacio-tiempo (emisor ↔ receptor) cómo se
  comportan parada y espera, repetición continua y repetición selectiva ante
  pérdidas de datos y de confirmaciones.
- Poder reproducir exactamente los escenarios de las figuras del libro
  (`stop-and-wait`, `go-back-n`, `selective-repeat`).
- Permitir experimentar: cambiar `k`, el tamaño de ventana, el timeout, el
  retardo y la probabilidad de pérdida, o «perder» un mensaje concreto con
  un clic.
- Que añadir un protocolo o una variante nueva suponga escribir un único
  fichero.

Fuera de alcance (por ahora): TCP real (control de congestión, RTO
adaptativo), comunicación dúplex/piggybacking, corrupción de bits/checksum
(una corrupción se modela igual que una pérdida: el receptor descarta).

## Tecnología

- HTML + CSS + JavaScript con módulos ES (`<script type="module">`).
- Visualización en SVG generado desde JS.
- Sin framework, sin bundler, sin dependencias de `npm` en tiempo de
  ejecución.
- Tests con el runner integrado de Node (`node --test`), sin dependencias.
- Despliegue: GitHub Pages desde la rama `master`, carpeta raíz.

Si la interfaz crece mucho (varios paneles, mucho estado de formularios), se
puede reconsiderar Svelte + Vite; el motor y los protocolos no cambiarían.

## Arquitectura

```
arq-demo/
├── index.html
├── style.css
├── main.js              # arranque: lee controles, crea simulación, conecta UI
├── sim/
│   ├── engine.js        # simulador de eventos discretos
│   ├── channel.js       # canal unidireccional: retardo, pérdida
│   ├── rng.js           # PRNG con semilla (p.ej. mulberry32)
│   └── seq.js           # aritmética modular de números de secuencia
├── protocols/
│   ├── base.js          # interfaz común Sender / Receiver
│   ├── stop-and-wait.js
│   ├── go-back-n.js
│   └── selective-repeat.js
├── scenarios/
│   └── book.js          # escenarios de las figuras del libro
├── ui/
│   ├── timeline.js      # diagrama espacio-tiempo en SVG
│   ├── buffers.js       # buffer de envío/recepción y ventana
│   ├── controls.js      # play/pausa/paso, parámetros, selector de escenario
│   └── log.js           # registro textual de eventos
└── test/
    └── *.test.js
```

### Principio clave: el motor no dibuja

`sim/` y `protocols/` no tocan el DOM. El motor emite eventos y la UI se
suscribe a ellos. Así:

- los protocolos se prueban con `node --test` sin navegador;
- la UI puede rebobinar: como la simulación es determinista (semilla +
  pérdidas forzadas), basta con volver a ejecutarla hasta el instante `t`.

### Motor (`sim/engine.js`)

- Reloj virtual en unidades abstractas (no ms reales).
- Cola de eventos ordenada por tiempo; en empate, por orden de inserción.
- API mínima: `schedule(t, fn)`, `cancel(id)`, `now()`, `run(until)`,
  `step()`.
- Emite eventos hacia la UI:
  `send`, `deliver`, `lost`, `discard`, `buffer`, `ack-send`,
  `timer-start`, `timer-cancel`, `timer-expire`, `retransmit`,
  `deliver-up` (entrega a la capa superior), `window-change`.

### Canal (`sim/channel.js`)

- Dos instancias independientes: datos (emisor→receptor) y confirmaciones
  (receptor→emisor).
- Parámetros: `tTrans` (retardo de transmisión), `tProp` (propagación),
  `pLoss` (probabilidad de pérdida).
- Lista de pérdidas forzadas: «perder la 1.ª transmisión del mensaje 1»,
  «perder el 2.º ACK»… Es lo que usan los escenarios del libro y el clic
  sobre un mensaje en vuelo.
- Primera versión: canal FIFO (sin reordenación). La reordenación queda como
  extensión.

### Interfaz de protocolo (`protocols/base.js`)

```js
class Sender {
  constructor({ k, window, timeout, sim, channel }) {}
  start() {}            // empieza a enviar mientras la ventana lo permita
  onAck(ack) {}         // llega una confirmación (o NACK)
  onTimeout(seq) {}     // expira el temporizador de un mensaje
  state() {}            // { base, next, inFlight[], window } para la UI
}

class Receiver {
  constructor({ k, window, sim, channel }) {}
  onData(msg) {}        // llega un mensaje de datos
  state() {}            // { expected, buffered[] } para la UI
}
```

Cada protocolo exporta `{ name, Sender, Receiver, maxWindow(k) }`.

## Semántica a respetar (según el libro)

- **Convenio de ACK**: la confirmación lleva el número de secuencia del
  **siguiente** mensaje esperado. ACK 1 confirma el mensaje 0.
- **Sin confirmación acumulativa por defecto** en ningún protocolo: ACK n
  confirma solo el mensaje n−1. La confirmación acumulativa será una opción
  activable (pendiente).
- **Parada y espera**: `k = 1`, `Ws = Wr = 1`. El receptor descarta los
  duplicados pero los confirma igualmente.
- **Repetición continua**: `Ws ≤ 2^k − 1`, `Wr = 1`. El receptor descarta los
  mensajes fuera de secuencia y, por cada uno, reenvía la confirmación del
  último mensaje contiguo (confirmaciones duplicadas). Un temporizador por
  mensaje; al expirar, se retransmite solo ese mensaje (así aparece en la
  figura `go-back-n`).
- **Repetición selectiva**: `Ws = Wr ≤ 2^(k−1)`. El receptor guarda en su
  buffer los mensajes fuera de secuencia y, al rellenar el hueco, entrega
  todos los contiguos a la capa superior.
- **Confirmación acumulativa** (opción, desactivada por defecto): un ACK n
  confirma todos los mensajes anteriores a n.
- **NACK** (variante de repetición selectiva): al detectar un hueco, el
  receptor envía un NACK con el número que falta; el emisor retransmite de
  inmediato y cancela ese temporizador.
- La UI debe avisar (no prohibir) cuando la ventana supera el máximo del
  protocolo, y poder mostrar el fallo por ambigüedad del ejemplo del libro
  (k = 2, se envían los 4 mensajes, se pierden todos los ACK).

## Visualización

- **Diagrama espacio-tiempo**: dos ejes verticales (emisor y receptor), el
  tiempo hacia abajo y flechas inclinadas para los mensajes. Hay que mantener
  el estilo de las figuras del libro:
  - datos y ACK con colores distintos;
  - pérdida: la flecha termina a medio camino con una ✕;
  - temporizador: reloj verde al arrancar, tachado al cancelarse, rojo al
    expirar;
  - etiqueta «RTX» en las retransmisiones;
  - mensajes descartados, guardados en buffer y entregados, diferenciados
    (el FIXME de la figura `selective-repeat` pide marcar los entregados en
    otro color: la demo puede hacerlo).
- **Buffers**: fila de casillas con los números de secuencia (módulo 2^k),
  con la ventana de emisión como marco naranja y los enviados sin confirmar
  en verde, como en las figuras. Lo mismo para el buffer de recepción en
  repetición selectiva.
- **Controles**: play/pausa, paso a paso (evento a evento), velocidad,
  reinicio y selector de escenario.
- **Métricas** (fase posterior): aprovechamiento del canal `U` medido frente
  al teórico `Ws / (1 + 2a)`, número de retransmisiones y duplicados.

## Fases

### Fase 0 — Esqueleto
- `index.html` con el layout, `style.css` con tokens de color (claro/oscuro).
- Activar GitHub Pages y comprobar que se sirve.

### Fase 1 — Motor + parada y espera
- `engine.js`, `channel.js`, `rng.js`, `seq.js` con tests.
- `stop-and-wait.js` con tests que reproducen los tres casos de la figura
  `stop-and-wait` (sin pérdida, pérdida de datos, pérdida del ACK →
  duplicado).
- `timeline.js` mínimo: ejes, flechas, pérdidas y temporizadores.
- Controles básicos: play/pausa/paso.

**Hito**: el escenario de la figura `stop-and-wait` se ve animado.

### Fase 2 — Ventana deslizante
- `go-back-n.js` y `selective-repeat.js` con tests contra los escenarios de
  las figuras `go-back-n` (k = 2, se pierde el 1) y `selective-repeat`
  (k = 3, se pierde el 2).
- `buffers.js`: buffer de envío, ventana y buffer de recepción.
- Selector de protocolo y de parámetros (`k`, `W`, timeout, `tProp`, `pLoss`,
  semilla).

**Hito**: los tres protocolos reproducen sus figuras del libro.

### Fase 3 — Interacción
- Clic sobre un mensaje o ACK en vuelo para perderlo.
- Rebobinar / ir a un instante (reejecutar de forma determinista).
- Registro textual de eventos sincronizado con el diagrama.
- Enlace compartible: parámetros y pérdidas codificados en la URL
  (`?p=gbn&k=2&loss=d1.1`), para enlazar escenarios concretos desde el libro.

### Fase 4 — Variantes y métricas
- Confirmación acumulativa y NACK como opciones de repetición selectiva.
- Demostración del fallo por ventana demasiado grande.
- Panel de aprovechamiento del canal (`U`, `a`, `1 + 2a`), con los ejemplos
  de fibra y satélite de la tabla `tab:bdp-k` como presets.

### Fase 5 — Pulido
- Accesibilidad (teclado, contraste, `prefers-reduced-motion`).
- Textos de la UI en español; posible i18n más adelante.
- README con instrucciones para ejecutar en local y para añadir un protocolo.

## Cómo ejecutar en local

Los módulos ES no funcionan con `file://`, así que hace falta un servidor
estático cualquiera:

```
python3 -m http.server
```

Tests:

```
node --test
```

## Estado

- v0 (2026-10-18): motor, parada y espera y repetición continua, diagrama
  SVG con temporizadores y buffer de envío, panel de estado, clic para
  perder/entregar, escenario del libro y estado en la URL. Pendiente decidir
  si el nivel de interactividad aconseja cambiar de tecnología.
- **En pausa** hasta concretar el funcionamiento exacto de los ARQ (ver
  «Cuestiones de protocolo pendientes» en [docs/animacion.md](docs/animacion.md),
  donde también está lo aprendido sobre la animación).

## Decisiones abiertas

- **Semántica de ACK en repetición selectiva**: el texto del libro dice que
  cada confirmación se refiere a un único mensaje, pero la figura usa el
  número del siguiente contiguo esperado (ACK 2 duplicados). Hay que decidir
  qué hace por defecto la demo (¿ACK individual con opción «acumulativa»?) y
  que coincida con lo que finalmente diga el libro.
- **Unidades de tiempo**: abstractas (`tTrans = 1`) o derivadas de `L`, `R`,
  `d` y `v` como en la sección de BDP. Propuesta: abstractas en el diagrama,
  físicas solo en el panel de métricas.
- **Repositorio y enlace desde el libro**: URL definitiva de GitHub Pages, y
  si se enlaza con `\url{}`, con QR o con ambos.
