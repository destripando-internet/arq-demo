// Ejecuta un protocolo completo sobre un canal con retardo y pérdidas, y
// devuelve una traza con todo lo ocurrido. La UI solo lee la traza.
//
// Claves de pérdida:
//   d<abs>.<intento>  mensaje de datos número abs (sin módulo), intento n
//   a<n>              n-ésima confirmación enviada por el receptor

import { Engine } from './engine.js';
import { chance } from './rng.js';

export const DEFAULTS = {
  k: 1,            // bits del número de secuencia
  window: 1,       // ventana de emisión (Ws)
  count: 3,        // mensajes a enviar
  tTrans: 1,       // retardo de transmisión de un mensaje de datos
  tProp: 1,        // retardo de propagación
  timeout: 9,      // temporizador de retransmisión
  lossRate: 0,     // probabilidad de pérdida aleatoria
  seed: 1,
  forcedLosses: [],
  tMax: 300,
};

export function simulate(protocol, opts = {}) {
  const p = { ...DEFAULTS, ...protocol.defaults, ...opts };
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
    end: 0,
  };

  const attempts = new Map();
  const timers = new Map();
  const lastTimer = new Map();
  let linkFree = 0;
  let ackCount = 0;
  let sender, receiver;

  const isLost = key =>
    forced.has(key) ? forced.get(key) : chance(p.seed, key) < p.lossRate;

  const snap = () => trace.snapshots.push({
    t: engine.now(),
    ...sender.state(),
    ...receiver.state(),
    delivered: trace.deliveries.length,
  });

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

    // Pone en el canal el mensaje abs; devuelve el instante de salida (el
    // enlace puede estar ocupado transmitiendo el anterior).
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
        sender: sender.state(),  // estado del emisor al enviar
      };
      trace.transmissions.push(tx);
      if (!tx.lost)
        engine.schedule(tx.tArr, () => {
          receiver.onData({ seq: tx.seq, abs });
          snap();
        });
      return tDep;
    },

    startTimer(abs, from) {
      stopTimer(abs, 'restart');
      const prev = lastTimer.get(abs);
      const rec = {
        abs, tStart: from, tEnd: null, end: null,
        // continuación de un temporizador que acaba de expirar
        afterExpire: prev?.end === 'expire' && prev.tEnd === engine.now(),
      };
      lastTimer.set(abs, rec);
      trace.timers.push(rec);
      const ev = engine.schedule(from + p.timeout, () => {
        rec.tEnd = engine.now();
        rec.end = 'expire';
        timers.delete(abs);
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
      };
      trace.transmissions.push(tx);
      if (!tx.lost)
        engine.schedule(tx.tArr, () => {
          sender.onAck(seq);
          snap();
        });
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
    0,
    ...trace.transmissions.map(tx => tx.lost ? (tx.tDep + tx.tArr) / 2 : tx.tArr),
    ...trace.timers.map(tm => tm.tEnd ?? tm.tStart),
  );
  return trace;
}

// Admite un Map clave→bool o una lista de claves (todas perdidas).
function toLossMap(losses) {
  if (losses instanceof Map) return losses;
  return new Map([...losses].map(key => [key, true]));
}
