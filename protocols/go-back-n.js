// Repetición continua (go back N).
//
// - El emisor envía hasta Ws mensajes sin confirmar, con un temporizador por
//   mensaje. Al expirar uno, retransmite ese mensaje.
// - El receptor solo acepta el mensaje esperado; descarta el resto y vuelve
//   a confirmar el último contiguo (confirmaciones duplicadas).
// - La confirmación lleva el número del siguiente mensaje esperado: ACK 1
//   confirma el mensaje 0. No es acumulativa: ACK n confirma solo el n-1.

class Sender {
  constructor(ctx, { M, window, count }) {
    this.ctx = ctx;
    this.M = M;
    this.W = window;
    this.count = count;
    this.base = 0;          // primer mensaje sin confirmar (número absoluto)
    this.next = 0;          // siguiente mensaje nuevo a enviar
    this.acked = new Set(); // confirmados por encima de base
  }

  start() {
    this.fill();
  }

  fill() {
    while (this.next < this.count && this.next < this.base + this.W) {
      const abs = this.next++;
      const tDep = this.ctx.sendData(abs);
      this.ctx.startTimer(abs, tDep);
    }
  }

  onAck(ack) {
    const seq = (ack - 1 + this.M) % this.M;
    let abs = this.base;
    while (abs < this.next && (abs % this.M !== seq || this.acked.has(abs))) abs++;
    if (abs === this.next) return;  // no corresponde a ningún mensaje pendiente
    this.acked.add(abs);
    this.ctx.cancelTimer(abs);
    while (this.acked.delete(this.base)) this.base++;
    this.fill();
  }

  onTimeout(abs) {
    const tDep = this.ctx.sendData(abs);
    this.ctx.startTimer(abs, tDep);
  }

  state() {
    return { base: this.base, next: this.next, acked: [...this.acked] };
  }
}

class Receiver {
  constructor(ctx, { M }) {
    this.ctx = ctx;
    this.M = M;
    this.expected = 0;
    this.expectedAbs = 0;  // solo para anotar el diagrama; el protocolo no lo ve
  }

  onData({ seq, abs }) {
    if (seq === this.expected) {
      if (abs !== this.expectedAbs)
        this.ctx.note('¡duplicado aceptado como nuevo!', 'bad');
      this.ctx.deliver(abs);
      this.expected = (this.expected + 1) % this.M;
      this.expectedAbs++;
    } else {
      this.ctx.note(abs < this.expectedAbs ? 'duplicado!' : 'descartado');
    }
    this.ctx.sendAck(this.expected);
  }

  state() {
    return { expected: this.expected };
  }
}

export const goBackN = {
  id: 'gbn',
  name: 'Repetición continua',
  showBuffer: true,
  defaults: { k: 2, window: 3, count: 4, tProp: 1, timeout: 6 },
  maxWindow: k => 2 ** k - 1,
  createSender: (ctx, p) => new Sender(ctx, p),
  createReceiver: (ctx, p) => new Receiver(ctx, p),
  // Figura go-back-n del libro: k = 2, se pierde el mensaje 1.
  book: { params: { k: 2, window: 3, count: 4, tProp: 1, timeout: 6 }, losses: ['d1.1'] },
};
