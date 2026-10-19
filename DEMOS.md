# Cases to study with the demo

One link per case, grouped by topic. IDs are stable so they can be cited: new cases are appended to their section.

Each link (`?demo=ID`) loads the scenario and shows the whole diagram; above it, a box explains what the demo shows with the text below, in English or Spanish as the UI. ⏮ and ▶ play it, and clicking an arrow loses or delivers it. The scenarios and texts are in [ui/demos.js](ui/demos.js); `test/demos.test.js` checks that every demo does what its text says. The links point to the app published at <https://destripando-internet.github.io/arq-demo/>. To try local changes, serve the repository (`python3 -m http.server 8765`) and use <http://localhost:8765/?demo=ID> instead.

Tests run in the browser at <https://destripando-internet.github.io/arq-demo/test-web/> (locally, <http://localhost:8765/test-web/>).

Conventions: an ACK carries the number of the confirmed message + 1 (with cumulative ACKs, the next expected one). ACKs have no transmission delay. Times are abstract units, except with the real link presets (ms). The «Guide» tab explains the legend, the constraints and the utilisation.

## Stop-and-wait

- **S1** [Lost message and lost ACK](https://destripando-internet.github.io/arq-demo/?demo=S1). Message 1 is lost: its timer expires and the sender retransmits it. Then the ACK of the second message 0 is lost, so the sender retransmits that one too and the receiver gets a duplicate. It discards it but confirms it anyway; otherwise the sender would retransmit it forever.
- **S2** [Timer shorter than the RTT](https://destripando-internet.github.io/arq-demo/?demo=S2). The timer (2) is shorter than the RTT (3). Nothing is lost, but every message is retransmitted before its ACK can arrive. The receiver discards and confirms the duplicates, and the sender ignores the repeated ACKs (dashed) thanks to their number. It works, with twice as many transmissions.
- **S3** [Stop-and-wait utilisation](https://destripando-internet.github.io/arq-demo/?demo=S3). With a = Tprop / Ttrans = 2, the sender spends most of the time waiting for ACKs: U = 1 / (1 + 2a) = 0.2. The channel is busy only a fifth of the time (the grey bands).

## Go-back-N

Cumulative ACKs; when a timer expires, that message and every later one already sent are retransmitted (each message has its own timer).

- **G1** [Go-back-N: a lost message](https://destripando-internet.github.io/arq-demo/?demo=G1). Message 1 is lost. The receiver only accepts messages in order, so it discards 2 and 3 and answers with duplicate ACKs 1, which have no effect. When the timer of 1 expires, the sender goes back and retransmits 1, 2 and 3: hence the name of the protocol.
- **G2** [Go-back-N: a lost ACK](https://destripando-internet.github.io/arq-demo/?demo=G2). The ACK of message 0 is lost. Nothing happens: ACKs are cumulative, so ack 2 confirms 0 and 1 at once and nothing is retransmitted.
- **G3** [Go-back-N without cumulative ACKs](https://destripando-internet.github.io/arq-demo/?demo=G3). The ACK of message 0 is lost, and the sender reads each ACK as confirming a single message. The receiver answers the retransmission of 0 with ack 3 (the next one it expects), so 0 is never confirmed and the sender would retransmit it forever. That is why go-back-N needs cumulative ACKs.
- **G4** [Largest window: no ambiguity](https://destripando-internet.github.io/arq-demo/?demo=G4). Ws = 3 = 2^k − 1 and the first three ACKs are lost, so the sender retransmits 0, 1 and 2. The receiver, which expects 3, correctly recognises the retransmissions as duplicates: with this window none of them can have the number of the next message it expects. It discards them and answers ack 3, which confirms everything.
- **G6** [Go-back-N: window too large](https://destripando-internet.github.io/arq-demo/?demo=G6). Ws = 4 = 2^k. The four ACKs are lost and the retransmission of 0 arrives when the receiver expects the next message numbered 0: it takes it as new and delivers it. That is why the window must satisfy Ws ≤ 2^k − 1.

## Selective repeat

Individual ACKs by default; cumulative ACKs are an option («ACKs»). When a timer expires, only that message is retransmitted.

- **R1** [Selective repeat: a lost message](https://destripando-internet.github.io/arq-demo/?demo=R1). Message 2 is lost. The receiver keeps 3, 4 and 5 (violet) and confirms each one, so the sender cancels their timers. When the timer of 2 expires, only 2 is retransmitted; when it arrives, the receiver delivers 2 to 5.
- **R3** [Selective repeat: a lost ACK](https://destripando-internet.github.io/arq-demo/?demo=R3). The ACK of message 1 is lost. Its timer expires and the sender retransmits it; the receiver had already delivered it, marks it as a duplicate and confirms it again. Without that new ACK, the sender would retransmit it forever.
- **R4** [Selective repeat: a lost cumulative ACK](https://destripando-internet.github.io/arq-demo/?demo=R4). The ACK of message 1 is lost, but ACKs are cumulative: the next one, ack 3, also confirms 1, so nothing is retransmitted.
- **R5** [Selective repeat: largest window](https://destripando-internet.github.io/arq-demo/?demo=R5). W = 2^(k−1) = 4 and the first four ACKs are lost. The retransmissions fall outside the new receive window, so the receiver recognises them as duplicates and confirms them.
- **R6** [Selective repeat: window too large](https://destripando-internet.github.io/arq-demo/?demo=R6). W = 5 > 2^(k−1). After the five ACKs are lost, the retransmission of 0 falls inside the new receive window and is delivered as a new message. That is why selective repeat needs W ≤ 2^(k−1).

## Cumulative ACKs

- **C1** [Cumulative ACKs: needless retransmission](https://destripando-internet.github.io/arq-demo/?demo=C1). Selective repeat with cumulative ACKs: four messages are sent and 2 is lost, so the receiver answers ack 1, 2 and 2. After 2 is retransmitted, ack 4 confirms everything, but the timer of 3 had already expired and 3 is retransmitted needlessly: the sender could not know it had arrived.

## Bandwidth × delay

- **B1** [Window large enough: full channel](https://destripando-internet.github.io/arq-demo/?demo=B1). a = 2 and Ws = 5 = 1 + 2a: the ACKs arrive just in time and the sender never stops. The transmission bands touch each other: theoretical U = 1.
- **B2** [Window too small](https://destripando-internet.github.io/arq-demo/?demo=B2). a = 2 and Ws = 3 < 1 + 2a = 5: the sender sends its window and waits for the first ACK. There are gaps between the bands: theoretical U = 3/5 = 0.6.
- **B3** [Message size does not change the bandwidth × delay product](https://destripando-internet.github.io/arq-demo/?demo=B3). Fibre, 1000 km, at R = 10 Mb/s with 500-byte messages (times in ms): Ttrans = 0.4 and Tprop = 5, so a = 12.5 and the window must hold 1 + 2a = 26 messages; with Ws = 26 the channel is full. With 1000-byte messages, a would be 6.25 and 14 messages would do. The data in flight is the same: BDP = R · 2·Tprop = 100 kbit = 12.5 KB, that is 25 messages of 500 bytes or 12.5 of 1000. It depends on the rate and the delay, not on the message size.
- **B4** [Fibre link, go-back-N](https://destripando-internet.github.io/arq-demo/?demo=B4). Fibre, 1000 km (times in ms): a = 6.25 and 1 + 2a = 13.5. With k = 4, go-back-N allows Ws = 14 ≤ 15 and the channel is fully used.
- **B5** [Fibre link, selective repeat with k = 4](https://destripando-internet.github.io/arq-demo/?demo=B5). Fibre, 1000 km (times in ms), selective repeat with k = 4 and Ws = 14: the largest window is 2^(k−1) = 8, so Ws = 14 is not valid. Losing the first ACK is enough for the retransmission of 0 to be delivered as a new message.
- **B6** [Fibre link, selective repeat with k = 5](https://destripando-internet.github.io/arq-demo/?demo=B6). Fibre, 1000 km (times in ms), selective repeat with k = 5 and Ws = 14 ≤ 2^(k−1) = 16: the window is valid. The first ACK is lost and 0 is retransmitted; the receiver correctly recognises the retransmission as a duplicate. For the same window, selective repeat needs one more bit than go-back-N.
- **B7** [LAN, stop-and-wait](https://destripando-internet.github.io/arq-demo/?demo=B7). A 100 m LAN: a ≈ 0.0006, so U = 1 / (1 + 2a) ≈ 1. On a LAN stop-and-wait is enough; the window only matters when a is large.
- **B8** [Satellite, stop-and-wait](https://destripando-internet.github.io/arq-demo/?demo=B8). Geostationary satellite: a = 312.5 and U = 1/626 ≈ 0.16 %. The sender transmits for 0.8 ms and then waits half a second for each message. Long waits are drawn compressed (Δt).
- **B9** [Satellite, largest window with k = 5](https://destripando-internet.github.io/arq-demo/?demo=B9). Go-back-N with the largest window k = 5 allows, Ws = 31: still far from 1 + 2a = 626, so U ≈ 5 %. Filling the channel would take 10-bit sequence numbers.
