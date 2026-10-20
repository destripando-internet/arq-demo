# arq-demo — work plan

Static web application that shows how the ARQ protocols described in the
chapter «Confiabilidad y control de flujo» (`reliability.tex`) of the book
work. It is deployed on GitHub Pages with no build step.

## Goals

- Show in a space-time diagram (sender ↔ receiver) how stop-and-wait,
  go-back-N and selective repeat behave when data messages and ACKs are
  lost.
- Reproduce the scenarios of the book's figures (`stop-and-wait`,
  `go-back-n`, `selective-repeat`) exactly, or show why they cannot be.
- Allow experimenting: change `k`, the window size, the timer, the delays and
  the loss probability, or «lose» a specific message with a click.
- Check the chapter's constraints and formulas against the simulation.
- Adding a protocol or a variant should mean writing a single file.

Out of scope (for now): real TCP (congestion control, adaptive RTO),
full-duplex communication and piggybacking, bit corruption and checksums (a
corrupted message is modelled as a lost one: the receiver discards it), NACK.

## Technology

- HTML + CSS + JavaScript with ES modules (`<script type="module">`).
- SVG generated from JS.
- No framework, no bundler, no `npm` dependencies. The controls use the CSS
  of Bootstrap 5.3 and Bootstrap Icons 1.11 from jsDelivr (pinned versions);
  no JavaScript library.
- **Node.js is not required.** The app runs in any browser served by any
  static server; the tests run in the browser too (`test-web/`). Node is
  only an alternative way to run the same tests (`node --test`).
- Deployment: GitHub Pages from the `master` branch, root folder.

If the interface grows a lot (many panels, lots of form state), Svelte + Vite
could be reconsidered; the engine and the protocols would not change.

## Languages

The user interface is in English and Spanish (`ui/i18n.js`, ES/EN switch in
the header; by default `?lang=`, the last choice or the browser's
language). The simulation only produces keys (receiver notes), translated
by the UI. Code, comments, tests and documentation are in English.

## Architecture

```
arq-demo/
├── index.html
├── style.css
├── main.js              # startup: reads controls, runs the simulation, wires the UI
├── sim/
│   ├── engine.js        # discrete-event simulator
│   ├── simulation.js    # channel, timers and trace
│   ├── analysis.js      # chapter constraints and utilisation
│   ├── links.js         # link presets (figures, LAN, fibre, satellite)
│   └── rng.js           # deterministic randomness per (seed, key)
├── protocols/
│   ├── arq.js           # sliding-window sender and receiver shared by all
│   ├── stop-and-wait.js
│   ├── go-back-n.js
│   └── selective-repeat.js
├── ui/
│   ├── timeline.js      # space-time diagram in SVG
│   ├── state.js         # buffers, constraints and utilisation panel
│   ├── guide.js         # «Guide» tab: legend and explanations
│   └── i18n.js          # English and Spanish texts
├── test/
│   └── *.test.js        # node --test, or test-web/ in the browser
└── test-web/            # browser runner for the same tests
```

### Key principle: the engine does not draw

`sim/` and `protocols/` never touch the DOM. `simulate()` runs a whole
scenario and returns a trace; the UI only draws the trace up to time `now`.
So:

- the protocols can be tested without a browser (or in one, without a UI);
- the UI can rewind: since the simulation is deterministic (seed + forced
  losses), it is enough to run it again and redraw.

### Engine (`sim/engine.js`)

- Virtual clock in abstract units.
- Event queue ordered by time; ties keep insertion order.
- API: `schedule(t, fn)`, `cancel(ev)`, `now()`, `run(until)`.

### Channel and timers (`sim/simulation.js`)

- Data channel (sender → receiver) and ACK channel (receiver → sender).
- Parameters: `tTrans` (transmission delay of a data message; ACKs have
  none), `tProp` (propagation delay), `lossRate`.
- Forced losses: «lose the 1st transmission of message 1», «lose the 2nd
  ACK»… Used by the book scenarios, the URL and clicks on the diagram.
- FIFO channel (no reordering).

### Protocol interface

A protocol is an object with `id`, `name`, `defaults`, `maxWindow(k)`,
`receiverWindow(Ws)`, `ackModes`, `requiredAck`, `createSender(ctx, params)`,
`createReceiver(ctx, params)` and the `book` scenario. Senders implement
`start()`, `onAck(n)`, `onTimeout(abs)` and `state()`; receivers implement
`onData({ seq, abs })` and `state()`. The three protocols share the sender
and receiver in `protocols/arq.js`.

## Semantics

It follows the general theory (Tanenbaum; Kurose and Ross) where the book is
not specific or contradicts itself; see «Protocol decisions» in
[docs/animation.md](docs/animation.md) and the numbered list of issues in
[docs/book-issues.md](docs/book-issues.md).

- **ACK numbering** (the book's convention): an ACK carries the number of the
  confirmed message + 1. With cumulative ACKs it is the next expected one.
- **One timer per message** in every protocol.
- **Stop-and-wait**: `k = 1`, `Ws = Wr = 1`. The receiver discards
  duplicates but confirms them.
- **Go-back-N**: `Ws ≤ 2^k − 1`, `Wr = 1`, **cumulative** ACKs. The receiver
  discards anything but the expected message and answers with the next
  expected number (duplicate ACKs). When a timer expires, that message and
  every later one already sent are retransmitted. Individual ACKs can be
  selected to show that the protocol then fails.
- **Selective repeat**: `Ws = Wr ≤ 2^(k−1)`. The receiver buffers the
  messages in its window and delivers all the contiguous ones once the gap
  is filled. **Individual** ACKs by default (also for duplicates already
  delivered), cumulative as an option. When a timer expires, only that
  message is retransmitted.
- **NACK**: postponed.
- **Endless loops** are detected: when a timer expires again with nothing in
  flight, no loss and the same sender and receiver state as at its previous
  expiry, the simulation stops and says so.
- The UI warns (does not forbid) when `Ws + Wr ≤ 2^k`, cumulative ACKs in
  go-back-N, `Ws ≥ 1 + 2a` or `timeout > RTT` do not hold, and flags the
  failure when the receiver accepts a retransmission as a new message or the
  transfer never ends.

## Visualisation

- **Space-time diagram**: two vertical axes (sender and receiver), time
  going down and slanted arrows for messages, in the style of the book's
  figures: different colours for data and ACKs; a lost message ends
  half-way with a square; timers with a green clock when started, crossed
  out when cancelled and red when they expire; «[RTX]» on retransmissions.
- **Buffers**: rows of cells with the sequence numbers, the window framed in
  orange and the unconfirmed (sender) or buffered (receiver) messages in
  green, as in the figures.
- **Channel occupancy**: each data message is a band that lasts Ttrans.
- **Controls**, in two groups: *Algorithm* (protocol, k, Ws, ACK mode,
  timer) and *Scenario* (link, Ttrans, Tprop, messages, random loss,
  playback speed, initial scenario, clear losses); a playback bar (start,
  previous event, play/pause, next event, end); clicks on the arrows to lose
  or deliver them.
- **Tabs**: *Demos* (the list of demos, where the app opens), *Simulation*
  and *Guide* (legend, utilisation, constraints and how to use the demo).
- **Panel**: constraints, theoretical and measured utilisation, number of
  retransmissions.

## Phases

- **Phase 0 — Skeleton.** Layout and colour tokens (light/dark). Done.
- **Phase 1 — Engine + stop-and-wait.** Done.
- **Phase 2 — Sliding window.** Go-back-N and selective repeat, send and
  receive buffers, parameter controls. Done.
- **Phase 3 — Interaction.** Click to lose, rewind, URL state. Done, except
  a textual event log synchronised with the diagram.
- **Phase 4 — Variants and metrics.** Cumulative ACKs as a selective repeat
  option, window-too-large failure, utilisation panel. Done; pending: NACK
  and presets with the fibre and satellite links of table `tab:bdp-k`.
- **Phase 5 — Polish.** English/Spanish UI and guide tab done. Pending:
  accessibility (keyboard, contrast, `prefers-reduced-motion`).

## Running locally

ES modules do not load from `file://`, so any static server will do:

```
python3 -m http.server 8765
```

Tests: <http://localhost:8765/test-web/>, or `node --test` if Node is
installed.

## Status

- v0 (2026-10-18): engine, stop-and-wait and go-back-N, SVG diagram with
  timers and send buffer, state panel, click to lose/deliver, book scenario
  and URL state.
- v1 (2026-10-18): ARQ semantics decided by checking the book against the
  simulation and the theory; selective repeat (individual or cumulative
  ACKs, receive buffer in the diagram); configurable Ttrans and Tprop, with
  the channel occupancy drawn as bands; constraints and utilisation panel
  (theoretical and measured); go-back-N with individual ACKs as a
  counter-example; tests runnable in the browser; a link per case, now in
  the [README](README.md#demos).
- v2 (2026-10-18): English/Spanish UI; Bootstrap controls in two groups
  (algorithm and scenario); link presets (book figures, LAN, fibre,
  satellite) with «custom» when edited; endless-loop detection; labels on
  one line with their buffer and at the height of their arrow; guide tab
  with the legend and the explanations.
- v3 (2026-10-18): time scale per Ttrans with compressed idle stretches;
  new buffer colours (send: sent, not sent; receive: ready, held; free
  slots without colour); ACK ends offset from the data arrows; a and 1 + 2a computed next to
  the delays; speed next to the playback buttons; shorter guide; no
  mention of the book in the UI; the per-instant buffer line was removed
  (the diagram already shows it).
- v4 (2026-10-19): schematic time axis, arrows with the same angle on every
  link (steeper only when several messages leave during one propagation);
  playback at constant speed over the drawing; times with two decimals.

## Open decisions

- **Repository and link from the book**: final GitHub Pages URL, and whether
  to link with `\url{}`, a QR code or both.
