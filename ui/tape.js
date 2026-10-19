// «Tape» of the sender, above the diagram: every message in order, labelled
// with its sequence number, evenly spaced, and the send window as an orange
// frame that
// slides over them as ACKs arrive. It follows the playback: a cell turns red
// when its message leaves, flashes blue when an ACK confirms it and then
// stays without colour; the frame glides to its new place.

import { t } from './i18n.js';

export const CELL = 30;  // px per message: a 22 px cell and an 8 px gap
const BOX = 22;
const PAD = 5;           // from the cells to the inner edge of the frame

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
  let trace = null, cells = [], frame = null, x = null;
  let prevNow = null, prevStates = [], prevBase = null;

  return {
    // New simulation: rebuild the strip.
    load(newTrace) {
      trace = newTrace;
      const { count, M, window: W } = trace.params;
      x = abs => abs * CELL;
      // Empty slots after the last message, so the window always fits.
      const slots = count + W;
      strip.style.width = `${x(slots - 1) + BOX + 2 * PAD}px`;
      strip.innerHTML = Array.from({ length: slots }, (_, abs) =>
        `<span class="tcell${abs >= count ? ' none' : ''}" style="left:${x(abs) + PAD}px">${abs % M}</span>`).join('')
        + '<div class="tape-window"></div>';
      cells = [...strip.querySelectorAll('.tcell')];
      frame = strip.querySelector('.tape-window');
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
        frame.style.left = `${x(base)}px`;
        frame.style.width = `${(W - 1) * CELL + BOX + 2 * PAD}px`;
        // Keep the window in view, a quarter from the left edge.
        const left = x(base), right = x(base + W - 1) + BOX + 2 * PAD;
        if (left < scroller.scrollLeft || right > scroller.scrollLeft + scroller.clientWidth)
          scroller.scrollTo({ left: Math.max(0, left - scroller.clientWidth / 4), behavior: forward ? 'smooth' : 'auto' });
      }
      prevNow = now;
      prevStates = states;
      prevBase = base;
    },
  };
}
