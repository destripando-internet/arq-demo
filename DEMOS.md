# Cases to study with the demo

One link per case, grouped by section of the chapter «Confiabilidad y
control de flujo» (`reliability.tex`). IDs are stable so they can be cited:
new cases are appended to their section. Book issues (E1, E2…) are listed in
[docs/book-issues.md](docs/book-issues.md).

Every link opens the whole diagram (`t=end`); ⏮ and ▶ play it. Clicking an
arrow loses or delivers it. The links point to a local server on port 8765:

    python3 -m http.server 8765

Tests run in the browser at <http://localhost:8765/test-web/>.

Conventions: an ACK carries the number of the confirmed message + 1 (with
cumulative ACKs, the next expected one). ACKs have no transmission delay.
Times are abstract units, except with the real link presets (ms). The UI is
in English or Spanish (ES/EN switch, or `&lang=es` / `&lang=en` in the
link); the «Guide» tab explains the legend, the constraints and the
utilisation.

## Stop-and-wait

- **S1** [Figure `stop-and-wait`](http://localhost:8765/?p=saw&n=3&tt=1&d=1&to=5&l=d1.1,a3&t=end).
  Message 1 is lost (its timer expires and it is retransmitted), then the
  ack 1 of the second message 0: the receiver gets a duplicate, discards it
  and **confirms** it. Matches the figure (E1).
- **S2** [Timer shorter than the RTT](http://localhost:8765/?p=saw&n=3&tt=1&d=1&to=2&t=end).
  ⚠ on the timer. Nothing is lost, but every message is retransmitted
  before its ACK arrives; the receiver discards and confirms the duplicates
  and the sender ignores repeated ACKs because they carry a number (E2). It
  finishes, with twice as many transmissions.
- **S3** [Stop-and-wait utilisation](http://localhost:8765/?p=saw&n=6&tt=1&d=2&to=7&t=end).
  a = 2, U = 1 / (1 + 2a) = 0.2: the channel is busy a fifth of the time.

## Go-back-N

Cumulative ACKs; when a timer expires, that message and every later one
already sent are retransmitted (each message has its own timer).

- **G1** [Figure `go-back-n`](http://localhost:8765/?p=gbn&k=2&w=3&n=4&tt=1&d=1&to=6&l=d1.1&t=end).
  Same messages and ACKs as the figure. When the timer of 1 expires, 1, 2
  and 3 are retransmitted, so the timers of 2 and 3 restart (green clock),
  as in the corrected figure (E4, E5).
- **G2** [An ACK is lost](http://localhost:8765/?p=gbn&k=2&w=3&n=4&tt=1&d=1&to=6&l=a1&t=end).
  Ack 2 confirms 0 and 1: no retransmission at all.
- **G3** [An ACK is lost, individual ACKs](http://localhost:8765/?p=gbn&k=2&w=3&n=4&tt=1&d=1&to=6&ack=individual&l=a1&t=end).
  ✗ on «ACKs». Same scenario as G2, but the sender reads ack n as confirming
  only n−1. The receiver answers the retransmission of 0 with ack 3 (the
  next expected one), so 0 is never confirmed and 3 is never sent. When the
  timer of 0 expires again with nothing in flight and nothing changed, the
  demo reports an endless loop and stops (E3).
- **G4** [Ambiguity example with Ws = 2^k − 1](http://localhost:8765/?p=gbn&k=2&w=3&n=4&tt=1&d=1&to=6&l=a1,a2,a3&t=end).
  Every ACK is lost. The receiver recognises the retransmissions as
  duplicates, answers ack 3 and that confirms everything.
- **G5** [Ambiguity example with Ws = 2^k − 1, individual ACKs](http://localhost:8765/?p=gbn&k=2&w=3&n=4&tt=1&d=1&to=6&ack=individual&l=a1,a2,a3&t=end).
  ✗ on «ACKs». Ack 3 only confirms 2; 0 and 1 would be retransmitted
  forever even though the window is valid: endless loop (E3).
- **G6** [Ambiguity example with Ws = 2^k](http://localhost:8765/?p=gbn&k=2&w=4&n=5&tt=1&d=1&to=6&l=a1,a2,a3,a4&t=end).
  ✗ Window too large. The book's example: the retransmission of 0 is
  delivered as a new message.

## Selective repeat

Individual ACKs by default; cumulative ACKs are an option («ACKs»).
When a timer expires, only that message is retransmitted.

- **R1** [Figure `selective-repeat` with individual ACKs](http://localhost:8765/?p=sr&k=3&w=4&n=6&tt=1&d=1&to=7&ack=individual&l=d2.1&t=end).
  ACKs 1 2 4 5 6 3 and only 2 is retransmitted, as in the corrected figure
  (E9, E10).
- **R2** [Figure `selective-repeat` with cumulative ACKs](http://localhost:8765/?p=sr&k=3&w=4&n=6&tt=1&d=1&to=7&ack=cumulative&l=d2.1&t=end).
  ACKs 1 2 2 2 2 6 6 6 6 and 2, 3, 4 and 5 are retransmitted, although 3,
  4 and 5 were already in the receiver's buffer: the drawback of cumulative
  ACKs.
- **R3** [An ACK is lost, individual ACKs](http://localhost:8765/?p=sr&k=3&w=4&n=6&tt=1&d=1&to=7&ack=individual&l=a2&t=end).
  The timer of 1 expires and 1 is retransmitted; the receiver had already
  delivered it, marks it as a duplicate and **confirms it again** (E11).
- **R4** [An ACK is lost, cumulative ACKs](http://localhost:8765/?p=sr&k=3&w=4&n=6&tt=1&d=1&to=7&ack=cumulative&l=a2&t=end).
  Ack 3 covers 1: no retransmission.
- **R5** [Maximum window W = 2^(k−1), every ACK lost](http://localhost:8765/?p=sr&k=3&w=4&n=8&tt=1&d=1&to=7&ack=individual&l=a1,a2,a3,a4&t=end).
  The retransmissions fall outside the receive window: duplicates.
- **R6** [Window W = 2^(k−1) + 1, every ACK lost](http://localhost:8765/?p=sr&k=3&w=5&n=10&tt=1&d=1&to=7&ack=individual&l=a1,a2,a3,a4,a5&t=end).
  ✗ Window too large: the retransmission of 0 falls inside the new receive
  window and is delivered as a new message.

## Cumulative ACKs

- **C1** [Example in the text: messages 0–3, 2 is lost](http://localhost:8765/?p=sr&k=3&w=4&n=4&tt=1&d=1&to=7&ack=cumulative&l=d2.1&t=end).
  ACKs 1 2 2 4 4: after 2 is retransmitted, ack 4 confirms everything, but
  the timer of 3 had already expired and 3 is retransmitted needlessly. This
  is what the text narrates and what its new figure shows (E13).

## ARQ and bandwidth × delay

- **B1** [Ws ≥ 1 + 2a: full channel](http://localhost:8765/?p=gbn&k=3&w=5&n=20&tt=1&d=2&to=10&t=end).
  a = 2, 1 + 2a = 5 = Ws: theoretical U = 1. The transmission bands touch
  each other, with no gaps.
- **B2** [Ws < 1 + 2a](http://localhost:8765/?p=gbn&k=3&w=3&n=21&tt=1&d=2&to=10&t=end).
  ⚠ Small window. Theoretical U = 3/5 = 0.6: the sender sends its window and
  waits.
- **B3** [Same a with other delays](http://localhost:8765/?p=gbn&k=3&w=3&n=21&tt=0.5&d=1&to=5&t=end).
  Ttrans and Tprop halved: same U, because it only depends on a.
- **B4** [Fibre example, go-back-N](http://localhost:8765/?p=gbn&k=4&w=14&n=30&tt=0.8&d=5&to=15&t=end).
  Link «Fibre, 1000 km», in ms: Ttrans = 0.8, Tprop = 5, a = 6.25,
  1 + 2a = 13.5 (shown next to the delays). With k = 4 and Ws = 14 ≤ 15,
  U = 1 (table `tab:bdp-k`).
- **B5** [Fibre example, selective repeat with k = 4](http://localhost:8765/?p=sr&k=4&w=14&n=30&tt=0.8&d=5&to=15&ack=individual&l=a1&t=end).
  ✗ Window too large (maximum 8): k = 4 is not enough. Losing the first ACK
  is enough for the retransmission of 0 to be delivered as a new message.
- **B6** [Fibre example, selective repeat with k = 5](http://localhost:8765/?p=sr&k=5&w=14&n=30&tt=0.8&d=5&to=15&ack=individual&l=a1&t=end).
  Ws = 14 ≤ 16, as the table says: the same loss is solved with one
  retransmission that the receiver recognises as a duplicate.
- **B7** [LAN, stop-and-wait](http://localhost:8765/?p=saw&n=6&tt=0.8&d=0.0005&to=1&t=end).
  Link «LAN, 100 m copper»: a ≈ 0.0006, so U = 1 / (1 + 2a) ≈ 1. On a LAN
  stop-and-wait is enough; the window only matters when a is large.
- **B8** [Satellite, stop-and-wait](http://localhost:8765/?p=saw&n=2&tt=0.8&d=250&to=600&t=end).
  Link «Geostationary satellite»: a = 312.5, U = 1/626 ≈ 0.16 %. The
  diagram is not to scale: the arrows keep the angle they have with a = 1
  and the bands are hairlines, since transmitting takes almost no time.
- **B9** [Satellite, go-back-N with the largest window of k = 5](http://localhost:8765/?p=gbn&k=5&w=31&n=40&tt=0.8&d=250&to=600&t=end).
  Ws = 31 is far from 1 + 2a = 626 (k = 10 in table `tab:bdp-k`): U ≈ 5 %.
