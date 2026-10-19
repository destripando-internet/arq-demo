# Issues in reliability.tex

Issues found by checking the chapter «Confiabilidad y control de flujo»
against the simulation and the general theory (Tanenbaum, protocols 4–6;
Kurose and Ross, rdt, GBN and SR).

Numbers are stable so they can be cited: fixed issues stay in the list,
marked as fixed, and new ones are appended. Line numbers refer to
`book/reliability.tex` after the fixes of 2026-10-18 and may drift. Case IDs
(S1, G2…) refer to the [demos](../README.md#demos).

| Issue | Status |
|---|---|
| E1–E4, E6, E7, E9–E13, E16–E18 | fixed |
| E5 | reopened: the original figure was right, revert pending decision |
| E8 | proposal, pending decision |
| E14, E15 | postponed |
| E19, E20 | pending |

## Stop-and-wait

**E1 · line 86 · fixed.** The text said the receiver discards a duplicate,
but not that it must confirm it. If it does not, the duplicate caused by a
lost ACK is never confirmed and the sender retransmits it forever (in the
scenario of the figure, 18 retransmissions until the simulation stops).
Case S1.

**E2 · line 88 · fixed.** It was not explained why the ACK carries a
sequence number. Added after the numbering convention: with a premature
timer, a late second ACK of an already confirmed message can arrive; since
it says which message the receiver expects next, the sender knows it does
not refer to the message just sent and drops it; without the number it would
take it as that message's ACK even if that message was lost. Case S2.

## Go-back-N

**E3 · line 119 · fixed.** The section did not say that ACKs are cumulative;
it was only said later, in «Confirmación acumulativa». Added, with the
reason: the receiver only confirms the last in-order message, so with
individual ACKs losing one ACK makes the sender retransmit forever. Cases
G2 and G3.

**E4 · lines 121 and 148 · fixed.** It was not said what is retransmitted
when a timer expires. Added after the receiver paragraph: each message has
its own timer; when one expires, the sender retransmits that message and
every later one already sent (the receiver discarded them), and since every
transmission restarts the timer of its message, the timers of the later ones
restart instead of expiring (Tanenbaum, protocol 5). The example of the
figure (line 148) now says so too.

**E5 · figure go-back-n · reopened (2026-10-19).** The timers of messages 2
and 3 were drawn expiring (red clocks), and E5 replaced them with the
restart icon of the book's icon set (`0-styles.svg`). That was wrong: 2 and
3 were sent back to back after 1, so each timer is due exactly when its
retransmission leaves (2 at t = 8, 3 at t = 9). That is a timeout, and the
original red clocks were right. The figure should be reverted. The text of
E4 (line 121: «los temporizadores de esos mensajes posteriores se
reinician en lugar de expirar») is right in general but not for this
figure; it may need «si no han vencido ya». Case G1.

**E6 · line 144 · fixed.** «utiliza una ventana de $k=2 bits$»: k = 2 is the
size of the sequence number, not of the window. Now «utiliza números de
secuencia de $k=2$~bits y una ventana de emisión $W_s=3$». Also fixed: «La
ejemplo», «envia».

**E7 · line 146 · fixed.** «ventaja de emisión» → «ventana de emisión».

## Selective repeat

**E8 · lines 176 and 193 · proposal.** «repite confirmaciones cuando llegan
mensajes fuera de secuencia» and «confirmaciones duplicadas ack 2» describe
cumulative ACKs. They contradict line 360 («cada confirmación se refiere a
un único mensaje») and the goal in line 178 (not retransmitting messages
that arrived): with cumulative ACKs the sender cannot know which messages
were buffered and retransmits them. Case R1; for the drawback of
cumulative ACKs, case C1.

Proposed structure:

1. Go-back-N, which already introduces cumulative ACKs (E3).
2. A short «Confirmación acumulativa» section right after go-back-N, before
   selective repeat: the general concept, its advantages (a lost ACK is
   covered by the next one, delayed ACKs, TCP) and its drawback (duplicate
   ACKs: the sender cannot know what arrived after a gap). The forward
   reference of E3 becomes a backward one.
3. Selective repeat with individual ACKs: only the lost message is
   retransmitted (figure R1).
4. Selective repeat with cumulative ACKs, as a variant at the end of its
   section: the receiver buffers but the sender retransmits what it
   buffered (figure C1, which matches the current text of line 370).
5. NACK, which fixes that drawback.

The standalone section would not disappear: it moves before selective
repeat, and its example (line 370) moves into the selective repeat section.

**E9 · figure selective-repeat · fixed.** Redrawn with individual ACKs (R1):
ack 4, 5 and 6 for messages 3, 4 and 5, which cancel their timers; only 2 is
retransmitted and confirmed with ack 3. The text of lines 178 and 195–197
was updated accordingly (individual ACKs, one timer per message, only the
expired message is retransmitted). The study that led to it follows.

As it was drawn: data 0 1
2✗ 3 4 5, then RTX 2, 3 and 4; ACKs 1 2 2 2 2, then 3 and 4; timers drawn
for 2, 3 and 4 (each expires, then 2 and 3 are cancelled and 4 keeps
running), none for 5; the receive buffer shows the absolute numbers 0–7, all
received messages in green, with no window. It is not consistent with either
semantics:

- The ACKs for 3, 4 and 5 (ack 2) are cumulative; the ACK after RTX 2
  (ack 3) and after RTX 3 (ack 4) are individual. With cumulative ACKs both
  would be ack 6 (2–5 complete); with individual ACKs, 3, 4 and 5 would have
  been confirmed by acks 4, 5 and 6.
- With individual ACKs, the timers of 3, 4 and 5 are cancelled by acks 4, 5
  and 6, so 3 and 4 are never retransmitted.
- The receive buffer keeps delivered messages in green; the FIXME at line
  197 already asks to mark them differently. The demo draws the receive
  window instead (orange frame) and only the buffered messages in green.

Consistent versions, with Ttrans = Tprop = 1 and a timer of 7:

- **Individual ACKs** (R1). Data 0–5 leave at t = 0…5 (2 is lost); ACKs 1,
  2, 4, 5, 6 leave at t = 2, 3, 5, 6, 7; timers 0, 1, 3, 4, 5 are cancelled
  by them. Timer 2 expires at t = 9 and only 2 is retransmitted; it arrives
  at t = 11, the receiver delivers 2–5 and answers ack 3.
- **Cumulative ACKs** (R1 with «ACKs» set to cumulative). ACKs 1, 2, 2, 2, 2. Timers 2, 3 and 4 expire at
  t = 9, 10 and 11 and those messages are retransmitted; RTX 2 arrives at
  t = 11, the receiver delivers 2–5 and answers ack 6, which reaches the
  sender at t = 12 and cancels every timer; RTX 3 and 4 are duplicates and
  get ack 6 too. Timer 5 would expire at t = 12, the same instant ack 6
  arrives; an arrival goes before an expiry, so 5 is not retransmitted, as
  in the figure.

**E10 · line 195 · fixed with E9.** «se retransmiten los mensajes [2--5] y el
receptor los confirma uno a uno» matches neither the figure (it retransmits
2–4) nor any consistent version: with individual ACKs only 2 is retransmitted
and confirmed with ack 3 (R1); with cumulative ACKs 2, 3, 4 (and maybe 5)
are retransmitted and all of them get ack 6, not one by one (R1 with
cumulative ACKs).

**E11 · line 180 · fixed.** The commented-out sentence (the receiver
confirms again a message it already had) is needed: with individual ACKs,
losing an ACK leads to a retransmission that must be confirmed again.
Uncommented. Case R3.

## Cumulative ACKs

**E12 · line 357 · fixed.** The first paragraph was cut off («De este modo,
no es necesario») and lacked an «a» («aplicarse a un único mensaje»). The
dangling fragment was removed; its idea is developed later in the section
(«no es necesario enviar una confirmación para cada mensaje de datos»).

**E13 · line 370 · fixed.** New figure `selective-repeat-cumulative.svg`
(label `fig:selective-repeat-cumulative`) with the 4-message scenario of the
text (C1), derived from the original figure; the text was kept.
 The example narrates messages [0–3] with 2
lost: ACKs 1 and 2, ack 2 again when 3 is buffered, retransmission of 2,
ack 4, an unnecessary retransmission of 3 and ack 4 cancelling the timers of
2 and 3. The simulation reproduces it exactly (C1: data 0 1 2✗ 3, RTX 2 at
t = 9 and RTX 3 at t = 10; ACKs 1 2 2 4 4; ack 4 reaches the sender at
t = 12). But the figure it cites has 6 messages, and its timers and ACKs
are those of E9. Options: draw a 4-message figure for this example (C1) and
keep the text, or reuse a corrected 6-message figure (R1 with cumulative
ACKs) and rewrite the
text with ack 6. With the structure proposed in E8, the first option keeps
both texts as they are.

## NACK

**E14 · line 380 · postponed.** «que se cancela tan pronto como llega el
NACK»: the timer of the retransmitted message must restart, not be
cancelled; otherwise, if that retransmission is lost too, nothing recovers
it. (The «ventana de 3 bits» in the same line was fixed with E18.)

## Other sections

**E15 · line 28 · postponed.** PPP is given as an example of link-layer
reliability, but PPP does not provide it by default (RFC 1661/1662 use
unnumbered frames; the numbered mode of RFC 1663 is optional and rarely
used).

**E16 · line 48 · fixed.** «polinomio de redundancia cíclica (CRC)» → «una
comprobación de redundancia cíclica (CRC)»: CRC stands for cyclic redundancy
check; the polynomial is the generator it uses.

**E17 · line 222 · fixed.** The table had two labels; the unreferenced
`tab:arq-ventanas` was removed.

**E18 · several lines · fixed.** Other evident typos: a missing comma
before «lo que también conlleva» (line 54) and around «como resultado»
(line 86); a missing full stop in the ambiguity example list (line 125);
«de ahí el nombre al protocolo» → «del protocolo» and «dónde guarda» →
«donde guarda» (line 178); «\ac{ARQ}'s» in a section title (line 206);
ranges written with a hyphen («[0-3]», «[2-3]») instead of an en dash like
the rest; «ventana de 3 bits» → «números de secuencia de 3 bits» in the NACK
example (line 380), the same mistake as E6.

## Pending

**E19 · other diagrams · pending.** E4 describes how go-back-N timers behave
(the later timers restart, or expire if they were due at that instant). Any other diagram of the
book or of the course slides that shows go-back-N timers should be reviewed.

**E20 · colours of the buffers · pending decision.** The demo now uses its
own colours: send buffer, sent and not confirmed in light red, not sent in
green, free slot without colour; receive buffer, ready for the process in
green, held behind a gap in violet. The book's figures keep green for sent and not
confirmed (sender) and for received (receiver). Decide whether the figures
should follow the demo.
