// Constraints from the chapter «Confiabilidad y control de flujo» and channel
// utilisation, computed from a trace.
//
// - Window (correctness):    Ws + Wr ≤ 2^k
// - ACK mode (correctness):  go-back-N needs cumulative ACKs
// - Window (efficiency):     Ws ≥ 1 + 2a, with a = Tprop / Ttrans
// - Timer:                   timeout > RTT = Ttrans + 2·Tprop
//                            (ACKs have no transmission delay)
// - Theoretical utilisation: U = min(1, Ws / (1 + 2a)), without errors
// - Measured utilisation:    N·Ttrans / duration of the transfer
//                            (until the sender has everything confirmed)

export function analyze(trace, protocol) {
  const { k, M, window: Ws, count, tTrans, tProp, timeout, ack } = trace.params;
  const Wr = protocol.receiverWindow(Ws);
  const a = tProp / tTrans;
  const rtt = tTrans + 2 * tProp;
  const data = trace.transmissions.filter(tx => tx.kind === 'data');
  const failure = trace.notes.find(n => n.cls === 'bad');

  return {
    k, M, Ws, Wr, a, rtt, timeout, ack,
    maxWindow: protocol.maxWindow(k),
    windowOk: Ws + Wr <= M,
    requiredAck: protocol.requiredAck,
    ackOk: !protocol.requiredAck || ack === protocol.requiredAck,
    efficient: Ws >= 1 + 2 * a,
    fixedWindow: !!protocol.fixed,  // stop-and-wait: Ws = 1 cannot grow
    timeoutOk: timeout > rtt,
    uTheory: Math.min(1, Ws / (1 + 2 * a)),
    uMeasured: trace.done ? count * tTrans / trace.done : null,
    duration: trace.done,
    retransmissions: data.filter(tx => tx.rtx).length,
    failure: failure ? { t: failure.t } : null,
    loop: trace.loop,
    unfinished: trace.done === null && !trace.loop,
    tMax: trace.params.tMax,
  };
}
