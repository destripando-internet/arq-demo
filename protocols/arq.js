// Sliding-window sender and receiver shared by the three ARQ protocols. Each
// protocol configures them with:
//
//   ack        'cumulative': ACK n confirms every message before n.
//              'individual': ACK n confirms message n-1 only.
//   onTimeout  'go-back': when a timer expires, that message and every later
//              one already sent are retransmitted.
//              'selective': only that message is retransmitted.
//              Retransmissions go one by one, as the link becomes free, and
//              before any new message; one confirmed meanwhile is skipped.
//   buffer     false: the receiver discards out-of-order messages (Wr = 1)
//              and always confirms the last in-order one; `ack` only changes
//              how the sender reads that confirmation.
//              true: the receiver keeps them in its buffer (Wr = Ws).
//
// Every message has its own timer. An ACK carries the number of the confirmed
// message + 1 (with cumulative ACKs, the next expected one).

export class Sender {
  constructor(ctx, { M, window, count }, opts) {
    this.ctx = ctx;
    this.M = M;
    this.W = window;
    this.count = count;
    this.opts = opts;
    this.base = 0;          // first unconfirmed message (absolute number)
    this.next = 0;          // next new message to send
    this.acked = new Set(); // confirmed messages above base
    this.resend = [];       // waiting to be retransmitted
  }

  start() {
    this.fill();
  }

  fill() {
    if (this.resend.length) return;  // retransmissions go first
    while (this.next < this.count && this.next < this.base + this.W)
      this.send(this.next++);
  }

  send(abs) {
    this.ctx.startTimer(abs, this.ctx.sendData(abs));
  }

  // Pending message with sequence number seq. With a valid window there is at
  // most one.
  pending(seq) {
    for (let abs = this.base; abs < this.next; abs++)
      if (abs % this.M === seq && !this.acked.has(abs)) return abs;
    return null;
  }

  onAck(ack) {
    const abs = this.pending((ack - 1 + this.M) % this.M);
    if (abs === null) return;  // duplicate, or for an already confirmed message
    const from = this.opts.ack === 'cumulative' ? this.base : abs;
    for (let a = from; a <= abs; a++) {
      if (this.acked.has(a)) continue;
      this.acked.add(a);
      this.ctx.cancelTimer(a);
    }
    while (this.acked.delete(this.base)) this.base++;
    this.fill();
  }

  onTimeout(abs) {
    const last = this.opts.onTimeout === 'go-back' ? this.next - 1 : abs;
    const idle = this.resend.length === 0;
    for (let a = abs; a <= last; a++)
      if (!this.acked.has(a) && !this.resend.includes(a)) this.resend.push(a);
    this.resend.sort((x, y) => x - y);
    if (idle) this.ctx.whenLinkFree(() => this.retransmit());
  }

  // Retransmits the next pending message, if still unconfirmed, and waits
  // for the link to be free again; then new messages may go.
  retransmit() {
    while (this.resend.length) {
      const abs = this.resend.shift();
      if (abs < this.base || this.acked.has(abs)) continue;
      this.send(abs);
      this.ctx.whenLinkFree(() => this.retransmit());
      return;
    }
    this.fill();
  }

  state() {
    return { base: this.base, next: this.next, acked: [...this.acked] };
  }
}

export class Receiver {
  constructor(ctx, { M, window }, opts) {
    this.ctx = ctx;
    this.M = M;
    this.W = window;
    this.Wr = opts.buffer ? window : 1;
    this.opts = opts;
    this.expected = 0;
    this.buffer = new Map(); // seq → abs of the buffered messages
    this.justDelivered = []; // seqs delivered by the last arrival
    this.expectedAbs = 0;    // only to annotate the diagram; the protocol never sees it
  }

  onData({ seq, abs }) {
    this.justDelivered = [];
    const ahead = (seq - this.expected + this.M) % this.M;
    const behind = (this.expected - seq + this.M) % this.M;
    const inWindow = ahead < this.Wr;
    if (inWindow) {
      if (abs !== this.expectedAbs + ahead)
        this.ctx.note('accepted', 'bad');  // a duplicate taken as new
      else if (this.buffer.has(seq)) this.ctx.note('duplicate');
      else if (ahead > 0) this.ctx.note('buffered');
      if (!this.buffer.has(seq)) this.buffer.set(seq, abs);
      this.deliverContiguous();
    } else {
      this.ctx.note(abs < this.expectedAbs ? 'duplicate' : 'discarded');
    }

    if (this.opts.ack === 'cumulative' || !this.opts.buffer)
      this.ctx.sendAck(this.expected);
    else if (inWindow || (behind >= 1 && behind <= this.W))
      this.ctx.sendAck((seq + 1) % this.M);  // duplicates too
  }

  deliverContiguous() {
    while (this.buffer.has(this.expected)) {
      this.ctx.deliver(this.buffer.get(this.expected));
      this.justDelivered.push(this.expected);
      this.buffer.delete(this.expected);
      this.expected = (this.expected + 1) % this.M;
      this.expectedAbs++;
    }
  }

  state() {
    return {
      expected: this.expected,
      buffered: [...this.buffer.keys()],
      justDelivered: [...this.justDelivered],
    };
  }
}
