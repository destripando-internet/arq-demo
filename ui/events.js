// The diagram in text (§10.6 of the style guide): every message sent up to
// time `now`, in order, with when it arrives or that it is lost, and what it
// caused. Built from the same trace as the drawing.

import { t } from './i18n.js';

export const messageName = tx => (tx.kind === 'ack' ? `ack ${tx.seq}` : `${tx.rtx ? '[RTX] ' : ''}data ${tx.seq}`);

const time = x => String(+x.toFixed(2));

export function describeTrace(trace, now) {
  const sent = trace.transmissions.filter(tx => tx.tDep <= now);
  if (!sent.length) return `<p>${t('events.none')}</p>`;
  const rows = sent.map(tx => {
    const arrives = tx.lost ? t('events.lost') : tx.tArr <= now ? time(tx.tArr) : t('events.flight');
    const notes = tx.kind === 'data' && !tx.lost && tx.tArr <= now
      ? trace.notes.filter(n => n.t === tx.tArr).map(n => t(`note.${n.text}`)) : [];
    if (tx.spurious) notes.push(t('events.spurious'));
    if (tx.noEffect && tx.tArr <= now) notes.push(t('events.idle'));
    return `<tr><td class="num">${time(tx.tDep)}</td><td>${messageName(tx)}</td>`
      + `<td class="num">${arrives}</td><td>${notes.join('; ')}</td></tr>`;
  });
  return `<div class="table-wrap"><table class="table">
    <thead><tr><th scope="col" class="num">${t('events.sent')}</th><th scope="col">${t('events.message')}</th>
      <th scope="col" class="num">${t('events.arrives')}</th><th scope="col">${t('events.what')}</th></tr></thead>
    <tbody>${rows.join('')}</tbody></table></div>`;
}
