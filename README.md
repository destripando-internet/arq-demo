# arq-demo

Interactive demo of the ARQ protocols (stop-and-wait, go-back-N and
selective repeat) of the chapter «Confiabilidad y control de flujo» of the
book.

**Open it:** <https://destripando-internet.github.io/arq-demo/>, or start
from one of the [demos](#demos).

## What it shows

- The time diagram of the sender and the receiver, drawn as in the book's
  figures. It plays back at 0.5× to 4× or goes event by event, forwards and
  backwards.
- Clicking an arrow loses it, or delivers it if it was lost. Random losses
  are set with a slider.
- Above the diagram, the sender's messages in order, with the send window
  as a frame that slides over them as ACKs arrive.
- The chapter's constraints, marked ✓, ⚠ or ✗ and highlighted on the
  controls: the largest window for k bits, a window of at least 1 + 2a to
  fill the channel, a timer longer than the RTT and cumulative ACKs in
  go-back-N. A banner warns when the receiver delivers a duplicate as a new
  message or the sender would retransmit forever.
- The theoretical and measured utilisation and the number of
  retransmissions.
- Link presets: the book's figures (a = 1), a 100 m LAN, 1000 km of fibre
  and a geostationary satellite (times in ms). Long waits are drawn
  compressed.
- «Initial scenario» loads the example of each protocol, with its losses.
- The «Guide» tab explains the legend, the constraints and the utilisation.

## Demos

Each link loads a scenario and shows the whole diagram, with a box that
explains what it demonstrates. [DEMOS.md](DEMOS.md) has the same links
with that explanation.

### Stop-and-wait

- [S1 · Lost message and lost ACK](https://destripando-internet.github.io/arq-demo/?demo=S1)
- [S2 · Timer shorter than the RTT](https://destripando-internet.github.io/arq-demo/?demo=S2)
- [S3 · Stop-and-wait utilisation](https://destripando-internet.github.io/arq-demo/?demo=S3)

### Go-back-N

- [G1 · Go-back-N: a lost message](https://destripando-internet.github.io/arq-demo/?demo=G1)
- [G2 · Go-back-N: a lost ACK](https://destripando-internet.github.io/arq-demo/?demo=G2)
- [G3 · Go-back-N without cumulative ACKs](https://destripando-internet.github.io/arq-demo/?demo=G3)
- [G4 · Largest window: no ambiguity](https://destripando-internet.github.io/arq-demo/?demo=G4)
- [G6 · Go-back-N: window too large](https://destripando-internet.github.io/arq-demo/?demo=G6)

### Selective repeat

- [R1 · Selective repeat: a lost message](https://destripando-internet.github.io/arq-demo/?demo=R1)
- [R3 · Selective repeat: a lost ACK](https://destripando-internet.github.io/arq-demo/?demo=R3)
- [R4 · Selective repeat: a lost cumulative ACK](https://destripando-internet.github.io/arq-demo/?demo=R4)
- [R5 · Selective repeat: largest window](https://destripando-internet.github.io/arq-demo/?demo=R5)
- [R6 · Selective repeat: window too large](https://destripando-internet.github.io/arq-demo/?demo=R6)

### Cumulative ACKs

- [C1 · Cumulative ACKs: needless retransmission](https://destripando-internet.github.io/arq-demo/?demo=C1)

### Bandwidth × delay

- [B1 · Window large enough: full channel](https://destripando-internet.github.io/arq-demo/?demo=B1)
- [B2 · Window too small](https://destripando-internet.github.io/arq-demo/?demo=B2)
- [B3 · Message size does not change the bandwidth × delay product](https://destripando-internet.github.io/arq-demo/?demo=B3)
- [B4 · Fibre link, go-back-N](https://destripando-internet.github.io/arq-demo/?demo=B4)
- [B5 · Fibre link, selective repeat with k = 4](https://destripando-internet.github.io/arq-demo/?demo=B5)
- [B6 · Fibre link, selective repeat with k = 5](https://destripando-internet.github.io/arq-demo/?demo=B6)
- [B7 · LAN, stop-and-wait](https://destripando-internet.github.io/arq-demo/?demo=B7)
- [B8 · Satellite, stop-and-wait](https://destripando-internet.github.io/arq-demo/?demo=B8)
- [B9 · Satellite, largest window with k = 5](https://destripando-internet.github.io/arq-demo/?demo=B9)

## Technology

HTML + JavaScript (ES modules) + SVG, with no build step. Bootstrap 5 and
Bootstrap Icons (CSS only) are loaded from the jsDelivr CDN; there are no
other dependencies. It is published as is on GitHub Pages, from the
`master` branch, root folder (`.nojekyll` makes Pages serve the files
without processing them). The user interface is in English and Spanish
(ES/EN switch); code, comments and documentation are in English.

## Running locally

**Node.js is not needed**, neither for the app nor for the tests. ES modules
do not load from `file://`, so any static server will do:

    python3 -m http.server 8765

and open <http://localhost:8765>. A demo is then at
<http://localhost:8765/?demo=G1>.

## Tests

In the browser: <http://localhost:8765/test-web/>, or the published copy at
<https://destripando-internet.github.io/arq-demo/test-web/>. Optionally,
with Node: `node --test`. Both run the same files (`test/*.test.js`); the
browser page replaces `node:test` and `node:assert` with an import map.
`test/demos.test.js` checks that every demo does what its text says.

## Linking a scenario

The state is kept in the URL. For example, the book's go-back-N figure,
shown complete:

    ?p=gbn&k=2&w=3&n=4&tt=1&d=1&to=6&l=d1.1&t=end

| Parameter | Meaning |
|---|---|
| `demo` | a [demo](#demos) (`G1`…): loads its scenario and shows what it demonstrates; explicit parameters override it |
| `p` | protocol: `saw`, `gbn` or `sr` |
| `k` | sequence number bits |
| `w` | send window Ws |
| `n` | number of messages |
| `tt`, `d` | Ttrans and Tprop |
| `to` | retransmission timer |
| `r` | random loss probability (%) |
| `ack` | `cumulative` or `individual` (go-back-N and selective repeat) |
| `l` | forced losses: `d<n>.<attempt>` for data message n (not modulo) and `a<n>` for the n-th ACK; a leading `-` forces delivery |
| `t` | instant shown; `end` for the end |
| `lang` | `en` or `es`; by default, the last choice or the browser's language |

`#guide` at the end opens the «Guide» tab (legend and explanations).

## Documentation

- [DEMOS.md](DEMOS.md): the demos, with what each one shows.
- [PLAN.md](PLAN.md): goals, design and phases.
- [docs/animation.md](docs/animation.md): how the diagram is drawn, problems
  found and protocol decisions.
- [docs/book-issues.md](docs/book-issues.md): numbered issues found in
  `reliability.tex`.

## Adding a demo

Add it to [ui/demos.js](ui/demos.js) (scenario, titles and texts in both
languages), check what its text claims in `test/demos.test.js`, and copy its
English title and text to [DEMOS.md](DEMOS.md) and its title to the list
above.
