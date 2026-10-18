# arq-demo

Demostración interactiva de los protocolos ARQ (parada y espera, repetición
continua) del capítulo «Confiabilidad y control de flujo».

HTML + JavaScript (módulos ES) + SVG, sin compilación ni dependencias. Se
publica tal cual en GitHub Pages.

## Ejecutar en local

Los módulos ES no cargan desde `file://`, hace falta un servidor estático:

    python3 -m http.server

y abrir <http://localhost:8000>.

## Tests

    node --test

## Enlazar un escenario

El estado se guarda en la URL. Por ejemplo, la figura de repetición continua
del libro, mostrada completa:

    ?p=gbn&k=2&w=3&n=4&d=1&to=6&l=d1.1&t=end

`l` es la lista de pérdidas forzadas: `d<n>.<intento>` para el mensaje de
datos n (sin módulo) y `a<n>` para la n-ésima confirmación; con `-` delante,
se fuerza la entrega.

Ver [PLAN.md](PLAN.md) para el diseño y las fases, y
[docs/animacion.md](docs/animacion.md) para los detalles de la animación y
las cuestiones de protocolo pendientes.
