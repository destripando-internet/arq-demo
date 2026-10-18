// Discrete-event simulator: virtual clock and ordered event queue.

export class Engine {
  constructor() {
    this.t = 0;
    this.queue = [];
  }

  now() {
    return this.t;
  }

  // Schedules fn at absolute time t. Ties keep insertion order.
  schedule(t, fn) {
    const ev = { t, fn, cancelled: false };
    let i = this.queue.length;
    while (i > 0 && this.queue[i - 1].t > t) i--;
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
