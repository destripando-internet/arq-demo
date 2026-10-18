// Simulador de eventos discretos: reloj virtual y cola de eventos ordenada.

export class Engine {
  constructor() {
    this.t = 0;
    this.queue = [];
  }

  now() {
    return this.t;
  }

  // Programa fn en el instante absoluto t. En empate, se respeta el orden de
  // inserción.
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

  run(until = Infinity) {
    while (this.queue.length && this.queue[0].t <= until) {
      const ev = this.queue.shift();
      if (ev.cancelled) continue;
      this.t = ev.t;
      ev.fn();
    }
  }
}
