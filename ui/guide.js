// «Guide» tab: legend of the diagram and explanations of the utilisation,
// the constraints and the controls. The icons use the diagram's own drawing
// functions and CSS classes, so they always look the same.

import { t } from './i18n.js';
import { clock, bufferRow } from './timeline.js';

const icon = (w, h, body) =>
  `<svg class="legend-icon" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

const markers = `<svg width="0" height="0" class="legend-defs"><defs>${['data', 'ack', 'idle'].map(kind =>
  `<marker id="lg-${kind}" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="userSpaceOnUse"
     markerWidth="10" markerHeight="10" orient="auto"><path class="ah-${kind}" d="M0,1.5L10,5L0,8.5z"/></marker>`).join('')}
  </defs></svg>`;

function arrow(kind, lost = false, idle = false) {
  const [x1, y1, x2, y2] = kind === 'ack' ? [70, 6, 6, 20] : [6, 6, 70, 20];
  const [xm, ym] = [(x1 + x2) / 2, (y1 + y2) / 2];
  const end = lost
    ? `<line class="line" x1="${x1}" y1="${y1}" x2="${xm}" y2="${ym}"/><rect class="drop" x="${xm - 5}" y="${ym - 5}" width="10" height="10"/>`
    : `<line class="line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#lg-${idle ? 'idle' : kind})"/>`;
  return icon(76, 26, `<g class="msg ${kind}${idle ? ' idle' : ''}">${end}</g>`);
}

const band = () => icon(76, 34,
  `<polygon class="band" points="6,4 70,16 70,30 6,18"/>
   <g class="msg data"><line class="line" x1="6" y1="4" x2="70" y2="30" marker-end="url(#lg-data)"/></g>`);
const clockIcon = kind => icon(76, 26, clock(38, 13, kind));
const running = () => icon(76, 26, '<line class="timer-line" x1="38" y1="1" x2="38" y2="25"/>');
const restart = () => icon(76, 34, `<line class="timer-line" x1="38" y1="1" x2="38" y2="33"/>${clock(38, 17, 'restart')}`);
const playhead = () => icon(76, 16, '<line class="playhead" x1="2" y1="8" x2="74" y2="8"/>');
const axisBreak = () => icon(76, 30, `<line class="axis" x1="20" y1="0" x2="20" y2="30"/>
  <g class="axis-break" transform="translate(20,15)"><rect x="-9" y="-5" width="18" height="10"/><path d="M-9,-1L9,-6M-9,6L9,1"/></g>
  <text class="gap" x="34" y="19">Δt</text>`);

const sendBuffer = () => icon(84, 26, bufferRow(2, 6, [
  { seq: 3, state: 'acked' }, { seq: 0, state: 'sent' }, { seq: 1, state: 'unsent' }, { seq: 2, state: 'unsent' }, { seq: 3, state: 'unsent' },
], 3));
const recvBuffer = () => icon(148, 24, bufferRow(2, 3, [
  { seq: 1 }, { seq: 2, state: 'ready' }, { seq: 3, state: 'ready' }, { seq: 4, state: 'free' },
  { seq: 5, state: 'held' }, { seq: 6, state: 'free' }, { seq: 7, state: 'free' }, { seq: 0 }, { seq: 1 },
], 4, 3));
const notes = () => ['discarded', 'duplicate', 'buffered', 'accepted']
  .map(key => `<span class="sample-note${key === 'accepted' ? ' bad' : ''}">${t(`note.${key}`)}</span>`).join(' ');

export function renderGuide() {
  const legend = [
    [arrow('data'), 'legend.data'],
    [arrow('ack'), 'legend.ack'],
    [arrow('ack', false, true), 'legend.idle'],
    [arrow('data', true), 'legend.lost'],
    [band(), 'legend.band'],
    [clockIcon('start'), 'legend.start'],
    [running(), 'legend.running'],
    [clockIcon('expire'), 'legend.expire'],
    [clockIcon('cancel'), 'legend.cancel'],
    [restart(), 'legend.restart'],
    [sendBuffer(), 'legend.sendBuffer'],
    [recvBuffer(), 'legend.recvBuffer'],
    [notes(), 'legend.notes'],
    [axisBreak(), 'legend.break'],
    [playhead(), 'legend.playhead'],
  ];
  return `${markers}
    <section>
      <h2>${t('guide.legend')}</h2>
      <dl class="legend">${legend.map(([img, key]) => `<dt>${img}</dt><dd>${t(key)}</dd>`).join('')}</dl>
    </section>
    <section><h2>${t('guide.utilisation')}</h2>${t('guide.utilisation.body')}</section>
    <section><h2>${t('guide.constraints')}</h2>${t('guide.constraints.body')}</section>
    <section><h2>${t('guide.usage')}</h2>${t('guide.usage.body')}</section>`;
}
