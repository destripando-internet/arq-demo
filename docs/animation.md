# Notes on the animation

What was learnt while building the demo (2026-10-18): how the diagram is
generated, which visual conventions come from the book's figures, which
problems came up and what was decided about the protocols. The issues found
in `reliability.tex` are listed, numbered, in [book-issues.md](book-issues.md).

## Model: full trace, drawn per instant

- `simulate()` runs the whole scenario at once and returns a trace:
  transmissions, timers, receiver notes, deliveries and state snapshots. The
  UI does not run the protocol; it only draws the trace up to time `now`.
- Since the simulation is deterministic (forced losses + seeded
  randomness), rewinding, jumping to an instant or changing a loss means
  running it again and redrawing. There is no incremental state to undo.
- The whole SVG is regenerated on every frame (`innerHTML`). With k=3 and 8
  messages it is smooth; performance does not call for another technology.
- `sim/` and `protocols/` never touch the DOM.

## Visual conventions (taken from the book's figures)

References: the book's `figures/stop-and-wait.svg`, `figures/go-back-n.svg`
and `figures/selective-repeat.svg`. The PNG `go-back-n.png` was out of date
with respect to the SVG: always compare with the SVG, rendered with
Inkscape:

    inkscape go-back-n.svg --export-type=png --export-width=1300 \
      --export-background=white --export-filename=/tmp/gbn.png

- Vertical axes (Sender, Receiver), time going down and slanted arrows from
  departure (sender) to arrival (receiver). Texts follow the UI language.
- One line per data message, at the height where its arrow leaves:
  `[buffer] [RTX] data N` (shorter than the book's «mensaje N»; the buffer
  goes on the outer side of the label). One line per ACK: `ack N [buffer]
  note`. An ACK leaves 5 px below the data arrival it answers and its tip
  arrives 5 px above the departure it triggers, so the arrows never meet
  (both offsets shrink when the ACK is nearly instantaneous, as on a LAN).
- The app never mentions the book: the presets and the initial scenarios
  have neutral names.
- Receiver notes in bold at the end of the ACK line (discarded, duplicate!,
  buffered); failures in red.
- `timeout!` in bold before the retransmission label, only in
  stop-and-wait, as in its figure. In go-back-N the
  red clock is enough, as in the figure.
- «endless loop» in red at the sender, when the simulation stops on a
  loop.
- Loss: the arrow stops half-way and ends in a filled square. It is the first
  half of the arrow it would have been, so it always has the same angle as
  the arrows around it.
- Timers: green clock when started, dashed line while running, red clock
  with «bells» when it expires and white crossed-out clock when cancelled.
  After expiring and retransmitting, the line goes on **without** a new
  green clock (as in the go-back-n figure). When a message is retransmitted
  while going back N, its timer restarts; if that happens exactly when the
  timer was due (messages sent back to back, as in the go-back-n figure),
  it is a timeout and is drawn as one: red clock, and the line goes on.
  Only a timer retransmitted before it was due shows the restart icon: a
  white clock with a circular arrow, as in the book's icon set
  (`figures/0-styles.svg`).
  Clocks are drawn after all the lines, so no line crosses them.
- Send buffer (only with a window > 1): left of each `data N`, M+1 cells
  starting at `base − 1`, the window framed in orange. In the window: sent
  and not confirmed (light red), not sent yet (green), free slot (no colour).
  These colours differ from the book's figures (green for sent and not
  confirmed). Messages confirmed by the ACKs that arrived since the previous
  row are light blue with a small ✓; when they have already left the row
  (a cumulative ACK confirming several), the row grows to the left to show
  them, keeping the window in the same column.
- When an ACK arrives, confirms something and no message leaves at that
  instant, a buffer row without label is drawn at the height of its
  arrival (as the last row of the book's go-back-n figure). It is left out
  if it would be closer than 30 px to the previous or the next data row;
  then the next row shows what it confirmed. In a continuous flow (Ws ≥
  1 + 2a) the next message leaves a moment later, so its row is enough.
- Receive buffer (selective repeat): right of each `ack N`. First the
  messages this arrival made deliverable, ready for the process (green);
  then the receive window, framed: received but held behind a gap (violet)
  or free (no colour).
- With M > 8 (k ≥ 4) the buffer rows only show the window and one cell on
  each side; with M+1 cells the diagram does not fit.
- Channel occupancy: each data message is a grey band between its first bit
  (leaves at `tDep`) and its last bit (`tDep + Ttrans`). The arrow goes from
  the first bit leaving to the last bit arriving. With Ws ≥ 1 + 2a the bands
  touch each other.
- Figure colours: clock green `#71c837`, red `#ff8080`, buffer green
  `#aade87`. In the demo ACKs are blue to tell them from data messages (in
  the book both are black); still to be confirmed.

## Geometry and layout (`ui/timeline.js`, `ui/timescale.js`)

- The time axis (`ui/timescale.js`) is linear within each diagram, so all
  data arrows are parallel and so are all ACKs. Its scale makes a data
  arrow drop 60 px (as with a = 1) unless labels on the same side would be
  closer than 30 px; then it grows just enough. So the angle of data arrows
  does not depend on the link when there is room; ACKs only have propagation,
  so their angle depends on a (flat on a LAN). A first, non-linear attempt
  kept the a = 1 angle for every arrow but made arrows of a kind differ
  within a diagram, which looked wrong (e.g. lost messages).
- Idle stretches longer than 120 px that no arrow crosses are compressed to
  120 px, with a break mark and their real duration (Δt). If the diagram
  would still be taller than 6000 px (long links with a large window),
  stretches crossed by arrows are compressed too, each one just enough for
  all the arrows of a kind to keep the same length.
- Bands have their corners at the real instants of the first and last bit
  at each end, mapped by the time scale: back-to-back messages share an
  edge, so bands never overlap or leave gaps (drawing them parallel to
  their own arrow did, where arrows have different angles). They fill the
  whole arrow on a LAN and are a hairline on a satellite link.
- Idle stretches longer than 4 units are drawn as 4 units, with a break mark
  and their real duration (Δt). Bending the paths at the breaks was tried
  before: on a satellite link the arrows were almost vertical and then
  crossed in a jump, unreadable.
- Playback runs at a constant speed over the drawing (pixels per second),
  slower for larger a so that a long propagation feels longer, though far
  from to scale: at 1× an RTT takes about 1.2 s on a LAN, 1.5 s with a = 1,
  2 s on the fibre link and 3.7 s on the satellite one.
- With many timer columns their spacing shrinks (at most 200 px in all).
- Label widths are measured with a canvas (`measureText`) to align the
  buffer column.
- Timer columns next to the sender axis: M if M ≤ 8 (each sequence number
  in its own column, as in the go-back-n figure), W otherwise. Stop-and-wait
  has two columns, for 0 and 1: its figure uses one, but then the timer of
  the next message starts where the previous one is cancelled and one of
  the clocks had to move away from its message.
- The left margin depends on whichever is wider (label or buffer row) plus
  the timer columns. With a fixed margin, the k=3 buffer went off the left
  edge.
- A start clock always stays at the height of its message. In the rare
  case that a timer is cancelled where another one starts in the same column
  (messages N and N + 2^k with a large window), the cancel clock is shifted
  15 px up.

## Timings that reproduce the figures

- `tTrans = 1` (data messages occupy the link: consecutive messages leave 1
  unit apart), `tProp = 1`, ACKs with no transmission delay: the «Book
  figures (a = 1)» link preset. The real presets (LAN, fibre, satellite) use
  the book's example message, Ttrans = 0.8 ms, and set a timer slightly
  longer than the RTT.
- Playback speed is relative to the RTT: at 1× an RTT takes 1.5 s, so long
  links do not take minutes.
- Timer 5 in stop-and-wait, 6 in go-back-N and 7 in selective repeat.
- The sequence of messages and ACKs matches the stop-and-wait and go-back-n
  figures (checked by the tests), but not the exact positions: e.g. in
  go-back-n the buffer of `[RTX] mensaje 2` shows `0 [1 2 3] 0` and the
  figure `1 [2 3 0] 1`, because there ack 2 arrives before that
  retransmission. The timers of 2 and 3 expire just as they are
  retransmitted, as in the figure.
- The selective-repeat figure cannot be reproduced (book issue E9).

## Order of simultaneous events

- At the same instant: arrivals first (an ACK arriving just in time cancels
  the timer), then retransmissions, then timer expiries. Before this order
  was fixed, a timer could expire and be cancelled at the same instant, and
  the crossed-out clock was drawn over the red one.
- Every instant is rounded to 1e-9 (`instant()` in `sim/engine.js`).
  Otherwise 1.6 + 11 and 11 + 0.8 + 0.8 differ by 1e-15, a timer expires
  just before the retransmission that should restart it, and both clocks
  are drawn on top of each other.
- Retransmissions go one by one as the link becomes free, before any new
  message, and one confirmed meanwhile is skipped. Before, all of them were
  queued at once when the timer expired, so a message confirmed while
  waiting was sent anyway, and its restarted timer was cancelled at the
  same instant.

## Loss keys and URL

- `d<abs>.<attempt>`: data message number abs (not modulo), n-th attempt.
  `a<n>`: n-th ACK sent.
- They stay the same when the simulation is run again as long as nothing
  before them changes, so they work for clicks, the book scenarios and the
  URL.
- Forced losses: a `Map` key → `true` (lose) / `false` (deliver). Clicking a
  forced one removes it; clicking any other forces the opposite of what
  happened, so a randomly lost message can be «saved».
- Random loss: a hash of (seed, key), not a sequential generator; otherwise
  forcing a loss would change every later random loss.

## Problems found

- **SVG markers**: the arrowhead `<marker>` does not inherit the classes of
  the arrow's group, so `.msg.ack .ah` does not apply. There is one marker
  per kind (`#ah-data`, `#ah-ack`). `context-stroke` is not reliable.
- **NaN when stacking**: a label without height (`h` undefined) left `NaN`
  in the following positions and every receiver label but the first one
  disappeared.
- **Buffer snapshot**: taking it at the end of the event made the buffer of
  `mensaje 0` already show 0, 1 and 2 in green (all three are handed to the
  link in the same event). Taking it when `sendData` is called was not
  right either: a message handed to a busy link leaves later, and its row
  showed the state of an earlier instant, so the marks of confirmed
  messages fell on the wrong rows. Now every row takes the state at its
  own instant (when the message leaves, after any ACK arriving then), and
  messages handed to the link that have not left yet do not count as
  sent.
- **ES modules**: they do not load from `file://`; a static server is
  needed.
- **CSS order**: `input.invalid` has the same specificity as
  `input[type=number]`, so it must come after it or the highlighting is
  lost. With Bootstrap, `.form-control.invalid` (two classes) beats
  `.form-control`.
- **Bootstrap clashes**: its `.alert` class restyled the failure banner
  (now `.fail-banner`), its `.row` is a grid with negative margins (not
  used), its reboot makes `dt` bold and `h2` medium weight, and its
  `legend` floats (the groups use a non-floating legend on the fieldset
  border). Its form controls follow `data-bs-theme`, set from
  `prefers-color-scheme` before the CSS loads.
- **Hidden SVG markers**: the guide's icons have their own arrowhead markers;
  markers inside a `display: none` subtree may not render.

## Visual check

Screenshots without a window, with the server running (`python3 -m
http.server 8765`):

    chromium --headless=new --disable-gpu --hide-scrollbars \
      --window-size=1000,1100 --virtual-time-budget=2000 \
      --screenshot=/tmp/gbn.png \
      "http://localhost:8765/?p=gbn&l=d1.1&t=end"

`t=end` shows the whole scenario; `t=8.4` stops it half-way, with messages
in flight. `--dump-dom` instead of `--screenshot` gives the HTML, which is
how the links in DEMOS.md and the browser tests can be checked from a
script.

## Protocol decisions

The book's text was checked against the simulation and the general theory
(Tanenbaum, protocols 5 and 6; Kurose and Ross, GBN and SR). The cases are
in [DEMOS.md](../DEMOS.md).

1. **Go-back-N: cumulative ACKs.** The receiver only confirms the last
   in-order message. If the sender reads that ACK as confirming a single
   message, losing one ACK blocks it: every retransmission is answered with
   the next expected number and the message whose ACK was lost is never
   confirmed. With cumulative ACKs the receiver does not need to tell
   duplicates from out-of-order messages, and the Ws ≤ 2^k − 1 limit
   behaves as the book says. The book itself says so in the cumulative ACK
   section. Individual ACKs can still be selected, flagged as an error, to
   show the failure.
2. **One timer per message.** In go-back-N, when one expires, that message
   and every later one already sent are retransmitted (hence the name).
   Every transmission starts the timer of its message, so the timers of the
   later ones restart: the expiry does not touch other timers directly.
   When the later messages were sent back to back, their timers are due
   exactly when their retransmissions leave, so they are drawn as expired;
   only one retransmitted before it was due shows the restart icon. This
   is Tanenbaum's protocol 5 (one logical timer per frame; on a timeout all
   outstanding frames are sent again, each with `start_timer`); Kurose and
   Ross use a single timer for the oldest unconfirmed packet, restarted on
   every timeout, with the same effect. In the scenario of the figure, the
   sequence of messages is the same as retransmitting only the message
   whose timer expires; only the clocks differ.
3. **Selective repeat: individual ACKs by default**, cumulative as an
   option. With individual ACKs the protocol achieves its goal (in the
   figure only 2 is retransmitted); with cumulative ones the sender does not
   know which messages the receiver buffered and retransmits them.
4. **Duplicates** are always confirmed (stop-and-wait, and selective repeat
   with individual ACKs); otherwise the sender retransmits forever.
5. **NACK**: postponed.
6. **Endless loops.** A timer that expires again with nothing in flight, no
   loss in between and the same sender and receiver state as at its previous
   expiry will keep doing so: the simulation stops and reports it. Requiring
   nothing in flight avoids false alarms with premature timers or with
   retransmissions still on their way.
