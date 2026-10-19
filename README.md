# arq-demo

Interactive demo of the ARQ protocols (stop-and-wait, go-back-N and
selective repeat) of the chapter «Confiabilidad y control de flujo» of the
book.

HTML + JavaScript (ES modules) + SVG, with no build step. Bootstrap 5 and
Bootstrap Icons (CSS only) are loaded from the jsDelivr CDN; there are no
other dependencies. It is published as is on GitHub Pages. The user
interface is in English and Spanish (ES/EN switch); code, comments and
documentation are in English.

## Running locally

**Node.js is not needed**, neither for the app nor for the tests. ES modules
do not load from `file://`, so any static server will do:

    python3 -m http.server 8765

and open <http://localhost:8765>.

## Tests

In the browser: <http://localhost:8765/test-web/>. Optionally, with Node:
`node --test`. Both run the same files (`test/*.test.js`); the browser page
replaces `node:test` and `node:assert` with an import map.

## Linking a scenario

The state is kept in the URL. For example, the book's go-back-N figure,
shown complete:

    ?p=gbn&k=2&w=3&n=4&tt=1&d=1&to=6&l=d1.1&t=end

| Parameter | Meaning |
|---|---|
| `demo` | a demo of [DEMOS.md](DEMOS.md) (`G1`…): loads its scenario and shows what it demonstrates; explicit parameters override it |
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

[DEMOS.md](DEMOS.md) has a link for each case of the chapter.

## Documentation

- [PLAN.md](PLAN.md): goals, design and phases.
- [docs/animation.md](docs/animation.md): how the diagram is drawn, problems
  found and protocol decisions.
- [docs/book-issues.md](docs/book-issues.md): numbered issues found in
  `reliability.tex`.
