// «Tape» of the sender, above the diagram: every message in order, labelled
// with its sequence number, and the send window as an orange frame that
// slides over them as ACKs arrive. It follows the playback: a cell turns red
// when its message leaves, flashes blue when an ACK confirms it and then
// stays without colour; the frame glides to its new place. When every
// message is confirmed, the frame and the empty slots after the last
// message fade out.
//
// It is drawn as the buffer rows of the diagram (ui/timeline.js), in its
// units: cells 16 apart that share their borders, and the frame 2.5 wide
// around them. The diagram is scaled to the width of its column, and --u is
// one of its units on screen (see scale()).

import { t } from './i18n.js';

const BOX = 16;  // from one cell to the next
const OFF = 2;   // room left of the first cell for the frame
const u = n => `calc(${n} * var(--u))`;
export const cellStyle = abs => `left:${u(abs * BOX + OFF)}`;
export const frameStyle = (base, W) => `left:${u(base * BOX + OFF - 1.75)};width:${u(W * BOX + 4.5)}`;

// Sender state at time `now`: base and confirmed messages from the last
// message leaving or ACK arriving (at the same instant, the departure, whose
// state already includes the ACK), and the messages that have left.
export function senderAt(trace, now) {
  let snap = null, best = [-Infinity, -1];
  const sent = new Set();
  const take = (time, rank, state) => {
    if (time > best[0] || (time === best[0] && rank >= best[1])) {
      snap = state;
      best = [time, rank];
    }
  };
  for (const tx of trace.transmissions) {
    if (tx.kind === 'data' && tx.tDep <= now) {
      sent.add(tx.abs);
      take(tx.tDep, 1, tx.sender);
    } else if (tx.kind === 'ack' && !tx.lost && tx.sender && tx.tArr <= now) {
      take(tx.tArr, 0, tx.sender);
    }
  }
  return { base: snap?.base ?? 0, acked: new Set(snap?.acked ?? []), sent };
}

// State of every message at time `now`: 'done' (confirmed), 'sent' (sent and
// not confirmed) or 'unsent'.
export function tapeCells(trace, now) {
  const s = senderAt(trace, now);
  return Array.from({ length: trace.params.count }, (_, abs) =>
    abs < s.base || s.acked.has(abs) ? 'done' : s.sent.has(abs) ? 'sent' : 'unsent');
}

export function createTape(root) {
  root.innerHTML = `<span class="tape-title"></span>
    <div class="tape-scroll"><div class="tape-strip"></div></div>`;
  const title = root.querySelector('.tape-title');
  const scroller = root.querySelector('.tape-scroll');
  const strip = root.querySelector('.tape-strip');
  let trace = null, cells = [], frame = null, unit = 1;
  let prevNow = null, prevStates = [], prevBase = null;
  root.style.setProperty('--u', '1px');

  return {
    // Size on screen of one unit of the diagram, in px.
    scale(px) {
      if (!(px > 0) || px === unit) return;
      unit = px;
      root.style.setProperty('--u', `${px}px`);
    },

    // New simulation: rebuild the strip.
    load(newTrace) {
      trace = newTrace;
      const { count, M, window: W } = trace.params;
      // Empty slots after the last message, so the window always fits.
      const slots = count + W;
      strip.style.width = u(slots * BOX + 1 + 2 * OFF);
      strip.innerHTML = Array.from({ length: slots }, (_, abs) =>
        `<span class="tcell${abs >= count ? ' none' : ''}" style="${cellStyle(abs)}">${abs % M}</span>`).join('')
        + '<div class="tape-window"></div>';
      cells = [...strip.querySelectorAll('.tcell')];
      frame = strip.querySelector('.tape-window');
      strip.classList.remove('finished', 'tape-fade');
      prevNow = null;
      prevStates = [];
      prevBase = null;
    },

    // Shows the state at time `now`, animating only when moving forward.
    update(now) {
      title.textContent = t('tape.title');
      if (!trace) return;
      const forward = prevNow !== null && now > prevNow;
      const states = tapeCells(trace, now);
      states.forEach((state, abs) => {
        if (state === prevStates[abs]) return;
        const cell = cells[abs];
        cell.classList.remove('done', 'sent', 'unsent', 'pulse');
        cell.classList.add(state);
        if (forward && state === 'done' && prevStates[abs] !== undefined) {
          void cell.offsetWidth;  // restart the animation
          cell.classList.add('pulse');
        }
      });

      const { base } = senderAt(trace, now);
      const W = trace.params.window;
      if (base !== prevBase) {
        frame.classList.toggle('instant', !forward);
        frame.style.cssText = frameStyle(base, W);
        // Keep the window in view, a quarter from the left edge.
        const left = base * BOX * unit, right = ((base + W) * BOX + 2 * OFF) * unit;
        if (left < scroller.scrollLeft || right > scroller.scrollLeft + scroller.clientWidth)
          scroller.scrollTo({ left: Math.max(0, left - scroller.clientWidth / 4), behavior: forward ? 'smooth' : 'auto' });
      }
      // Everything confirmed: the frame and the empty slots go, fading only
      // when playing forward.
      const finished = base >= trace.params.count;
      if (finished !== strip.classList.contains('finished')) {
        strip.classList.toggle('tape-fade', forward);  // not «fade»: Bootstrap hides it
        strip.classList.toggle('finished', finished);
      }
      prevNow = now;
      prevStates = states;
      prevBase = base;
    },
  };
}
