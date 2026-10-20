// Panel with the sender and receiver state at the current time, the chapter's
// constraints and the channel utilisation.

import { t } from './i18n.js';

export function renderState(trace, an) {
  return `
    ${alerts(an, trace.params.M)}
    <div class="panels">
      <section>
        <h2>${t('constraints')}</h2>
        <ul class="checks">${checks(an).map(([level, html]) =>
          `<li class="${level}"><span class="icon">${ICON[level]}</span><span>${html}</span></li>`).join('')}</ul>
      </section>
      <section>
        <h2>${t('utilisation')}</h2>
        ${metrics(an, trace.params)}
      </section>
    </div>`;
}

const ICON = { ok: '✓', warn: '⚠', error: '✗' };

function alerts(an, M) {
  const out = [];
  if (an.failure) out.push(t('alert.failure', { t: num(an.failure.t) }));
  if (an.loop) out.push(t('alert.loop', { t: num(an.loop.t), seq: an.loop.abs % M }));
  if (an.unfinished) out.push(t('alert.unfinished', { t: num(an.tMax) }));
  return out.map(text => `<p class="fail-banner"><span class="icon">✗</span> ${text}</p>`).join('');
}

// [level, html] for each constraint of the chapter.
function checks(an) {
  const args = {
    Ws: an.Ws, Wr: an.Wr, M: an.M, max: an.maxWindow,
    min: +(1 + 2 * an.a).toPrecision(4), timeout: num(an.timeout), rtt: num(an.rtt),
  };
  const check = (key, ok, bad) => [ok ? 'ok' : bad, t(`check.${key}.${ok ? 'ok' : bad}`, args)];
  return [
    check('window', an.windowOk, 'error'),
    ...(an.requiredAck ? [check('ack', an.ackOk, 'error')] : []),
    !an.efficient && an.fixedWindow ? ['warn', t('check.efficient.saw', args)] : check('efficient', an.efficient, 'warn'),
    check('timeout', an.timeoutOk, 'warn'),
  ];
}

function metrics(an, { count, tTrans }) {
  const measured = an.uMeasured === null ? '—'
    : `${count}·${num(tTrans)} / ${num(an.duration)} = ${num(an.uMeasured)} (${pct(an.uMeasured)})`;
  return `
    <dl class="metrics">
      <dt>${t('u.theory')}</dt><dd>${num(an.uTheory)} (${pct(an.uTheory)})</dd>
      <dt>${t('u.measured')}</dt><dd>${measured}</dd>
      <dt>${t('retransmissions')}</dt><dd>${an.retransmissions}</dd>
    </dl>
    <p class="hint">${t('u.hint')}</p>`;
}

// Two decimals, or two significant digits for tiny values (a LAN's a).
export const num = x => String(Math.abs(x) >= 0.01 || x === 0 ? +x.toFixed(2) : +x.toPrecision(2));
const pct = x => `${x >= 0.01 || x === 0 ? Math.round(x * 100) : +(x * 100).toPrecision(2)} %`;
