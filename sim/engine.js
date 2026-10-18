// Discrete-event simulator: virtual clock and ordered event queue.

// Times are rounded to 1e-9 so that sums like 1.6 + 11 and 11 + 0.8 + 0.8
// give the same instant and simultaneous events keep their order.
export const instant = t => Math.round(t * 1e9) / 1e9;

export class Engine {
  constructor() {
    this.t = 0;
    this.queue = [];
  }

  now() {
    return this.t;
  }

  // Schedules fn at absolute time t. At the same t, events run by rank and
  // then in insertion order.
  schedule(t, fn, rank = 0) {
    t = instant(t);
    const ev = { t, rank, fn, cancelled: false };
    let i = this.queue.length;
    while (i > 0 && (this.queue[i - 1].t > t || (this.queue[i - 1].t === t && this.queue[i - 1].rank > rank))) i--;
    this.queue.splice(i, 0, ev);
    return ev;
  }

  cancel(ev) {
    if (ev) ev.cancelled = true;
  }

  // Drops every pending event: run() returns.
  stop() {
    this.queue.length = 0;
  }

  run(until = Infinity) {
    while (this.queue.length && this.queue[0].t <= until) {
      const ev = this.queue.shift();
      if (ev.cancelled) continue;
      this.t = ev.t;
      ev.fn();
    }
  }
}
