// Runs a whole protocol over a channel with delays and losses, and returns a
// trace of everything that happened. The UI only reads the trace.
//
// Loss keys:
//   d<abs>.<attempt>  data message number abs (not modulo), n-th attempt
//   a<n>              n-th ACK sent by the receiver

import { Engine } from './engine.js';
import { chance } from './rng.js';

export const DEFAULTS = {
  k: 1,            // sequence number bits
  window: 1,       // send window (Ws)
  count: 3,        // messages to send
  tTrans: 1,       // transmission delay of a data message
  tProp: 1,        // propagation delay
  timeout: 9,      // retransmission timer
  ack: null,       // ACK mode; null: the protocol's first one
  lossRate: 0,     // random loss probability
  seed: 1,
  forcedLosses: [],
  tMax: null,      // end of the simulation; null: proportional to the parameters
};

export function simulate(protocol, opts = {}) {
  const p = { ...DEFAULTS, ...protocol.defaults, ...opts };
  if (!protocol.ackModes.includes(p.ack)) p.ack = protocol.ackModes[0];
  p.tMax ??= Math.max(100, 10 * (p.count * (p.tTrans + 2 * p.tProp) + p.timeout));
  const M = 2 ** p.k;
  const forced = toLossMap(p.forcedLosses);
  const engine = new Engine();

  const trace = {
    params: { ...p, M },
    transmissions: [],
    timers: [],
    notes: [],
    deliveries: [],
    snapshots: [],
    done: null,  // time at which the sender has everything confirmed
    loop: null,  // { t, abs } if an endless retransmission loop was detected
    end: 0,
  };

  const attempts = new Map();
  const timers = new Map();
  const lastTimer = new Map();
  let linkFree = 0;
  let ackCount = 0;
  let inFlight = 0;            // transmissions that will still arrive
  let lossCount = 0;
  const expiries = new Map();  // abs → { state, lossCount } at its last expiry
  let sender, receiver;

  const isLost = key =>
    forced.has(key) ? forced.get(key) : chance(p.seed, key) < p.lossRate;

  const snap = () => {
    const s = sender.state();
    if (trace.done === null && s.base >= p.count) trace.done = engine.now();
    trace.snapshots.push({
      t: engine.now(),
      ...s,
      ...receiver.state(),
      delivered: trace.deliveries.length,
    });
  };

  // Schedules the arrival of a transmission, unless it is lost.
  const arrive = (tx, onArrival) => {
    if (tx.lost) {
      lossCount++;
      return;
    }
    inFlight++;
    engine.schedule(tx.tArr, () => {
      inFlight--;
      onArrival();
      snap();
    });
  };

  // A timer that expires again with nothing in flight, no loss and the same
  // sender and receiver state as at its previous expiry will keep doing so:
  // the sender would retransmit forever.
  const isLoop = abs => {
    // justDelivered only describes the last arrival, not the protocol state.
    const { justDelivered, ...rcv } = receiver.state();
    const state = JSON.stringify([sender.state(), rcv]);
    const prev = expiries.get(abs);
    expiries.set(abs, { state, lossCount });
    return inFlight === 0 && prev?.state === state && prev.lossCount === lossCount;
  };

  const stopTimer = (abs, how) => {
    const timer = timers.get(abs);
    if (!timer) return;
    engine.cancel(timer.ev);
    timer.rec.tEnd = Math.max(engine.now(), timer.rec.tStart);
    timer.rec.end = how;
    timers.delete(abs);
  };

  const senderCtx = {
    now: () => engine.now(),

    // Puts message abs on the channel; returns its departure time (the link
    // may still be busy sending the previous one).
    sendData(abs) {
      const attempt = (attempts.get(abs) ?? 0) + 1;
      attempts.set(abs, attempt);
      const tDep = Math.max(engine.now(), linkFree);
      linkFree = tDep + p.tTrans;
      const key = `d${abs}.${attempt}`;
      const tx = {
        key, kind: 'data', seq: abs % M, abs, rtx: attempt > 1,
        tDep, tArr: tDep + p.tTrans + p.tProp,
        lost: isLost(key), forced: forced.has(key),
        sender: sender.state(),  // sender state when sending
      };
      trace.transmissions.push(tx);
      arrive(tx, () => receiver.onData({ seq: tx.seq, abs }));
      return tDep;
    },

    startTimer(abs, from) {
      // On restart, the old timer's line reaches the new start.
      const running = timers.get(abs);
      stopTimer(abs, 'restart');
      if (running) running.rec.tEnd = from;
      const prev = lastTimer.get(abs);
      const rec = {
        abs, tStart: from, tEnd: null, end: null,
        restarted: !!running,  // it replaces a timer that was still running
        // continuation of a timer that has just expired
        afterExpire: prev?.end === 'expire' && prev.tEnd === engine.now(),
      };
      lastTimer.set(abs, rec);
      trace.timers.push(rec);
      const ev = engine.schedule(from + p.timeout, () => {
        rec.tEnd = engine.now();
        rec.end = 'expire';
        timers.delete(abs);
        if (isLoop(abs)) {
          trace.loop = { t: engine.now(), abs };
          engine.stop();
          return;
        }
        sender.onTimeout(abs);
        snap();
      });
      timers.set(abs, { ev, rec });
    },

    cancelTimer(abs) {
      stopTimer(abs, 'cancel');
    },
  };

  const receiverCtx = {
    now: () => engine.now(),

    sendAck(seq) {
      ackCount++;
      const key = `a${ackCount}`;
      const tx = {
        key, kind: 'ack', seq,
        tDep: engine.now(), tArr: engine.now() + p.tProp,
        lost: isLost(key), forced: forced.has(key),
        receiver: receiver.state(),  // receiver state when confirming
      };
      trace.transmissions.push(tx);
      arrive(tx, () => sender.onAck(seq));
    },

    deliver(abs) {
      trace.deliveries.push({ t: engine.now(), abs });
    },

    note(text, cls = '') {
      trace.notes.push({ t: engine.now(), text, cls });
    },
  };

  sender = protocol.createSender(senderCtx, { ...p, M });
  receiver = protocol.createReceiver(receiverCtx, { ...p, M });

  sender.start();
  snap();
  engine.run(p.tMax);

  trace.end = Math.max(
    0, trace.done ?? 0,
    ...trace.transmissions.map(tx => tx.lost ? (tx.tDep + tx.tArr) / 2 : tx.tArr),
    ...trace.timers.map(tm => tm.tEnd ?? tm.tStart),
  );
  return trace;
}

// Accepts a Map key→bool or a list of keys (all lost).
function toLossMap(losses) {
  if (losses instanceof Map) return losses;
  return new Map([...losses].map(key => [key, true]));
}
