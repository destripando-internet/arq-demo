# Notas sobre la animación

Lo aprendido al construir la v0 (2026-10-18): cómo se genera el diagrama,
qué convenciones visuales se han tomado de las figuras del libro y qué
problemas han aparecido. La semántica de los protocolos **no está cerrada**:
ver «Cuestiones de protocolo pendientes» al final.

## Modelo: traza completa y dibujo por instante

- `simulate()` ejecuta el escenario entero de una vez y devuelve una traza:
  transmisiones, temporizadores, notas del receptor, entregas y fotos del
  estado. La UI no ejecuta el protocolo, solo dibuja la traza hasta el
  instante `now`.
- Como la simulación es determinista (pérdidas forzadas + aleatorio con
  semilla), rebobinar, ir a un instante o cambiar una pérdida consiste en
  reejecutar y redibujar. No hay estado incremental que deshacer.
- Se regenera el SVG completo en cada fotograma (`innerHTML`). Con k=3 y 8
  mensajes va fluido; el rendimiento no obliga a cambiar de tecnología.
- `sim/` y `protocols/` no tocan el DOM. Se prueban con `node --test`.

## Convenciones visuales (tomadas de las figuras del libro)

Referencias: `figures/stop-and-wait.svg` y `figures/go-back-n.svg` del libro.
La PNG `go-back-n.png` estuvo desactualizada respecto al SVG: comparar
siempre con el SVG, renderizado con Inkscape:

    inkscape go-back-n.svg --export-type=png --export-width=1300 \
      --export-background=white --export-filename=/tmp/gbn.png

- Ejes verticales «Emisor» y «Receptor», con el tiempo hacia abajo y
  flechas inclinadas desde la salida (emisor) hasta la llegada (receptor).
- Etiquetas: `mensaje N` a la izquierda del emisor; `[RTX] mensaje N` en las
  retransmisiones (formato de la figura go-back-n); `ack N` a la derecha del
  receptor.
- Notas del receptor en negrita y **encima** del ack que generan
  («descartado», «duplicado!»).
- `timeout!` en negrita junto al reloj rojo, solo cuando hay una única
  columna de temporizadores (parada y espera, como en su figura). En
  repetición continua basta con el reloj rojo, como en la figura.
- Pérdida: la flecha se corta a mitad de trayecto y termina en un cuadrado
  relleno.
- Temporizadores: reloj verde al arrancar, línea discontinua mientras está
  activo, reloj rojo con «campanas» al expirar y reloj blanco tachado al
  cancelarse. Tras expirar y retransmitir, la línea continúa **sin** un nuevo
  reloj verde (como en la figura go-back-n).
- Buffer de envío (solo con ventana > 1): bajo cada `mensaje N`, M+1 casillas
  empezando en `base − 1`; los enviados sin confirmar en verde (`#aade87`) y
  la ventana enmarcada en naranja.
- Colores de las figuras: verde de reloj `#71c837`, rojo `#ff8080`, verde
  de buffer `#aade87`. En la demo los ACK van en azul para distinguirlos de
  los datos (en el libro ambos son negros); pendiente de confirmar si
  gusta.

## Geometría y maquetación (`ui/timeline.js`)

- 30 px por unidad de tiempo.
- Columnas de temporizadores junto al eje del emisor: 1 si W = 1; M si
  M ≤ 8 (cada número de secuencia en su columna, como en la figura); W en
  otro caso.
- El margen izquierdo se calcula según lo que ocupe más (etiqueta o buffer
  de M+1 casillas) más las columnas de temporizadores. Con un margen fijo,
  el buffer de k=3 se salía por la izquierda.
- Etiquetas apiladas: si dos caen en el mismo sitio, la segunda se empuja
  hacia abajo. La posición se calcula con **todas** las etiquetas, no solo
  con las visibles, para que no salten durante la animación.
- En parada y espera, la cancelación de un temporizador y el arranque del
  siguiente ocurren en el mismo instante y columna: el reloj verde se
  desplaza 15 px hacia abajo para que no se superpongan.

## Tiempos que reproducen las figuras

- `tTrans = 1` (los datos ocupan el enlace: los envíos consecutivos salen
  separados 1 unidad), `tProp = 1`, ACK con `tTrans = 0`.
- Timeout 5 en parada y espera y 6 en repetición continua.
- La secuencia de mensajes y ACK coincide con las figuras (lo comprueban
  los tests), pero no la posición exacta: p.ej. en go-back-n el buffer de
  `[RTX] mensaje 2` muestra `0 [1 2 3] 0` y en la figura `1 [2 3 0] 1`,
  porque allí el ack 2 llega antes de esa retransmisión.

## Claves de pérdida y URL

- `d<abs>.<intento>`: mensaje de datos número abs (sin módulo), n-ésimo
  intento. `a<n>`: n-ésima confirmación enviada.
- Son estables al reejecutar mientras no cambie lo anterior, así que sirven
  para el clic, los escenarios del libro y la URL.
- Pérdidas forzadas: `Map` clave → `true` (perder) / `false` (entregar). Un
  clic sobre una forzada la quita; sobre una no forzada fuerza lo contrario
  de lo que pasó. Así se puede «salvar» un mensaje perdido al azar.
- Pérdida aleatoria: hash de (semilla, clave), no un generador secuencial;
  si no, forzar una pérdida cambiaría todas las aleatorias posteriores.

## Problemas encontrados

- **Marcadores SVG**: el `<marker>` de la punta de flecha no hereda las
  clases del grupo de la flecha, así que `.msg.ack .ah` no aplica. Se usa un
  marcador por tipo (`#ah-data`, `#ah-ack`). `context-stroke` no es fiable.
- **NaN en el apilado**: una etiqueta sin altura (`h` indefinido) dejaba
  `NaN` en las posiciones siguientes y desaparecían todas las etiquetas del
  receptor menos la primera.
- **Foto del buffer**: tomarla al final del evento hacía que el buffer de
  `mensaje 0` ya mostrara 0, 1 y 2 en verde (los tres salen en el mismo
  evento). Ahora el emisor incrementa `next` **antes** de llamar a
  `sendData` y la simulación guarda `sender.state()` en cada transmisión.
- **Módulos ES**: no cargan desde `file://`; hace falta un servidor
  estático.

## Comprobación visual

Capturas sin navegador, con el servidor en marcha (`python3 -m http.server
8765`):

    chromium --headless=new --disable-gpu --hide-scrollbars \
      --window-size=1000,1100 --virtual-time-budget=2000 \
      --screenshot=/tmp/gbn.png \
      "http://localhost:8765/?p=gbn&l=d1.1&t=end"

`t=end` muestra el escenario completo; `t=8.4` lo para a mitad, con
mensajes en vuelo.

## Cuestiones de protocolo pendientes

Hay que concretarlas (en el libro y aquí) antes de seguir con los
protocolos.

1. **ACK individual frente a acumulativo.** Decidido: por defecto, ACK
   individual en todos los ARQ (ACK n confirma solo el n−1); la acumulativa
   será una opción. La frase de `reliability.tex` sobre la confirmación
   acumulativa «implícita» en repetición continua se refiere solo a esa
   modalidad.

2. **Receptor de repetición continua ante un duplicado.** Hoy confirma el
   último contiguo (p.ej. esperando el 3 recibe un duplicado del 0 y
   responde «ack 3»). Con ACK individual eso no confirma el 0 y el emisor lo
   retransmite indefinidamente. Se reproduce perdiendo el primer ACK:

       ?p=gbn&l=a1&t=end

   Lo correcto sería confirmar el duplicado con su número + 1 («ack 1»),
   como en parada y espera.

3. **Ambigüedad duplicado / fuera de secuencia.** Para hacer lo del punto 2
   el receptor debe distinguir, solo con el número módulo 2^k:
   - duplicado: uno de los Ws anteriores al esperado → descartar y
     confirmarlo;
   - fuera de secuencia: uno de los Ws−1 siguientes → descartar y confirmar
     el último contiguo («descartado → ack 1» de la figura).

   Los rangos solo son disjuntos si Ws ≤ 2^(k−1). Con k=2 y Ws=3 (la figura)
   se solapan: esperando el 1, el 2 puede ser cualquiera de los dos casos.
   Opciones:
   - exigir Ws ≤ 2^(k−1) con ACK individual (la figura pasaría a Ws=2 o k=3);
   - mantener Ws ≤ 2^k−1, priorizar «fuera de secuencia» y mostrar el
     atasco como limitación;
   - usar el número absoluto que conoce la simulación (desaconsejado: no lo
     puede implementar un protocolo real).

4. **Temporizadores de repetición continua.** Implementado como en la
   figura: uno por mensaje y, al expirar, se retransmite solo ese mensaje.
   La versión clásica retransmite todos los pendientes desde el que expira.
   Confirmar cuál describe el libro.

5. **Semántica de ACK en repetición selectiva** (ver PLAN.md): el texto dice
   que cada confirmación se refiere a un único mensaje, pero la figura usa
   el siguiente contiguo esperado (ack 2 duplicados).
