import { simulate } from './sim/simulation.js';
import { analyze } from './sim/analysis.js';
import { LINKS, linkFor } from './sim/links.js';
import { PROTOCOLS, byId } from './protocols/index.js';
import { renderTimeline, eventTimes } from './ui/timeline.js';
import { timeScale } from './ui/timescale.js';
import { renderState, num } from './ui/state.js';
import { renderGuide } from './ui/guide.js';
import { LANGS, lang, setLang, t } from './ui/i18n.js';
import { GROUPS, demoById, demosIn } from './ui/demos.js';
import { createTape } from './ui/tape.js';
import { icon } from './ui/icons.js';
import { describeTrace } from './ui/events.js';
import { VERSION } from './version.js';

// Playback at 1×, in pixels of the diagram per second: an RTT takes 1.5 s
// with a = 1. Slower for larger a, so a long propagation feels longer,
// though far from to scale (about 3.7 s per RTT on a satellite link).
const PX_PER_SECOND = 75;
const playbackRate = ({ tTrans, tProp }) => PX_PER_SECOND / (1 + 0.25 * Math.log2(1 + tProp / tTrans));
// With reduced motion, playing goes from step to step with this pause (§10.10).
const STEP_PAUSE = 700;
const FIELDS = ['k', 'w', 'n', 'tt', 'd', 'to', 'r', 'ack'];
const LANG_KEY = 'arq-demo.lang';
const SETTINGS_KEY = 'arq-demo.settings';  // preferences of the view: column width, speed (§7.5)
const VIEWS = ['demos', 'sim', 'help'];

const $ = id => document.getElementById(id);
const form = $('controls');
const f = form.elements;
const svg = $('timeline');
const panel = $('state');
const wrap = $('timeline-wrap');
const player = $('player');
const speed = $('speed');
const range = $('timeline-range');
const counter = $('counter');
const playerStatus = $('player-status');
const marks = $('marks');
const playBtn = player.querySelector('[data-act=play]');
const langSelect = $('lang');
const guide = $('guide');
const demoBox = $('demo');
const demoList = $('demo-list');
const simView = $('view-sim');
const side = $('sim-side');
const splitter = $('sim-split');
const simHead = simView.querySelector('.sim-head');
const statusBar = document.querySelector('.status-bar');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const tape = createTape($('tape'));
// The tape takes the scale of the diagram, which follows the width of its column.
new ResizeObserver(() => tape.scale(svg.clientWidth / +svg.getAttribute('width'))).observe(svg);

let protocol, trace, times, analysis, scale;
let losses = new Map();  // key → true (lose) / false (deliver)
let demo = null;         // demo loaded with ?demo=ID
let demoOpen = true;     // its explanation shown; folded, a line with its name
let demoKey = '';        // its scenario, to tell whether it was changed
let demoValues = {};     // its value of each field, to mark the ones changed
// At rest, before anything happens: t = 0 already shows data 0 leaving.
const START = -1e-6;
let now = START;
let playing = false;
let lastFrame = 0;
let view = 'demos';

// Preferences of the view, in one key; without storage, the initial values.
function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) ?? {}; } catch { return {}; }
}
function saveSetting(name, value) {
  const s = loadSettings();
  if (value === undefined) delete s[name]; else s[name] = value;
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
}

// Numeric value of a field, clamped to its min/max.
function value(input) {
  const v = +input.value;
  const min = +input.min, max = +input.max;
  return Number.isFinite(v) && input.value !== '' ? Math.min(max, Math.max(min, v)) : min;
}

function readParams() {
  return {
    k: value(f.k), window: value(f.w), count: value(f.n),
    tTrans: value(f.tt), tProp: value(f.d), timeout: value(f.to),
    lossRate: value(f.r) / 100, ack: f.ack.value,
  };
}

// Options of a select from [value, text] pairs, keeping the selected value.
function fillSelect(select, options, selected = select.value) {
  select.replaceChildren(...options.map(([v, text]) => new Option(text, v)));
  select.value = selected;
  if (select.selectedIndex < 0) select.selectedIndex = 0;
}

// Fields whose value the protocol fixes: k and Ws are read-only, and the ACK
// select has its only option. They do not go in the URL.
const fixedAck = () => byId(f.p.value).ackModes.length === 1;
const isFixed = name => (name === 'ack' ? fixedAck() : !!f[name]?.readOnly);

// Help of a field, in its tooltip (it shows with the focus too), saying why
// when the protocol fixes its value; it keeps the right text after a change
// of language.
function setHint(name, fixed) {
  f[name].dataset.textTooltip = `${name}.hint${fixed ? '.fixed' : ''}`;
  f[name].dataset.tooltip = t(f[name].dataset.textTooltip);
}

function fillAckModes(proto, selected) {
  fillSelect(f.ack, proto.ackModes.map(m => [m, t(`ack.${m}`)]), selected);
  setHint('ack', proto.ackModes.length === 1);
}

// The link select shows the preset matching Ttrans and Tprop, or «custom».
function showLink() {
  f.link.value = linkFor(value(f.tt), value(f.d))?.id ?? 'custom';
}

function loadParams(proto, params = {}) {
  const p = { ...proto.defaults, ...params };
  f.p.value = proto.id;
  f.k.value = p.k;
  f.w.value = p.window;
  f.n.value = p.count;
  f.tt.value = p.tTrans;
  f.d.value = p.tProp;
  f.to.value = p.timeout;
  f.k.readOnly = f.w.readOnly = !!proto.fixed;
  setHint('k', !!proto.fixed);
  setHint('w', !!proto.fixed);
  fillAckModes(proto, p.ack);
  showLink();
}

// Highlights the fields that break one of the chapter's constraints.
function markInputs(an) {
  for (const input of [f.k, f.w, f.to, f.ack]) input.classList.remove('invalid', 'warn');
  if (!an.windowOk) f.k.classList.add('invalid'), f.w.classList.add('invalid');
  else if (!an.efficient && !f.w.readOnly) f.w.classList.add('warn');
  if (!an.ackOk) f.ack.classList.add('invalid');
  if (!an.timeoutOk) f.to.classList.add('warn');
  wrap.classList.toggle('failed', !!(an.failure || an.loop || an.unfinished));
}

// With a demo loaded, the fields whose value differs from the demo's (as
// numbers: «1» and «1.0» are the same) get a soft background.
function markChanged() {
  const same = (a, b) => a === b || (a !== '' && b !== '' && +a === +b);
  for (const name of ['p', ...FIELDS])
    f[name].classList.toggle('changed', !!demo && !same(f[name].value, demoValues[name]));
}

function rerun() {
  protocol = byId(f.p.value);
  trace = simulate(protocol, { ...readParams(), forcedLosses: losses });
  analysis = analyze(trace, protocol);
  scale = timeScale(trace);
  times = eventTimes(trace);
  tape.load(trace);
  $('calc-a').value = num(analysis.a);
  $('calc-2a').value = +(1 + 2 * analysis.a).toPrecision(4);
  markInputs(analysis);
  markChanged();
  now = Math.min(now, trace.end);
  writeUrl();
  renderDemo();
  scheduleNotice();
  drawMarks();
  draw();
}

// Box with what the loaded demo shows, and a way back if it was changed. The
// notice of a change comes (or goes) 2 s after the last edit, so that the box
// does not grow and move the fields while one is being edited or wheeled.
let demoNotice = false;
let noticeTimer = 0;

function scheduleNotice() {
  clearTimeout(noticeTimer);
  if (!demo) return;
  noticeTimer = setTimeout(() => {
    demoNotice = !!demo && stateKey() !== demoKey;
    renderDemo();
  }, 2000);
}

// Closing the explanation folds it into a line with the demo's name, which
// opens it again (a disclosure button); the demo stays loaded.
function renderDemo(focus = null) {
  demoBox.hidden = !demo;
  if (!demo) return;
  focus ??= demoBox.contains(document.activeElement) ? document.activeElement.dataset.demo : null;
  const name = `${demo.id} · ${demo.title[lang()]}`;
  const restore = `<button type="button" class="btn btn-sm" data-demo="restore">${icon('undo')} ${t('demo.restore')}</button>`;
  demoBox.classList.toggle('alert', demoOpen);
  demoBox.classList.toggle('folded', !demoOpen);
  demoBox.innerHTML = demoOpen ? `${icon('info')}
    <div class="alert-body">
      <div class="demo-head">
        <h2>${name}</h2>
        <button type="button" class="btn btn-icon btn-text" data-demo="close" aria-expanded="true"
          aria-label="${t('demo.close')}" data-tooltip="${t('demo.close')}">${icon('close')}</button>
      </div>
      <p>${demo.text[lang()]}</p>
      ${demoNotice ? `<p class="demo-changed">${t('demo.modified')} ${restore}</p>` : ''}
    </div>` : `
    <button type="button" class="btn btn-text btn-sm demo-line" data-demo="open" aria-expanded="false"
      data-tooltip="${t('demo.open')}">${icon('info')}<span>${name}</span></button>
    ${demoNotice ? restore : ''}`;
  if (focus) demoBox.querySelector(`[data-demo=${focus}]`)?.focus();
}

demoBox.addEventListener('click', e => {
  const act = e.target.closest('[data-demo]')?.dataset.demo;
  if (!act) return;
  if (act === 'close' || act === 'open') {
    demoOpen = act === 'open';
    renderDemo(demoOpen ? 'close' : 'open');  // the focus stays on the button that took its place
    return;
  }
  if (act === 'restore') {
    setPlaying(false);
    loadDemo(demo);
    scrollTo({ top: 0, behavior: 'instant' });
  }
  rerun();
});

// «Demos» view: every demo by section, the loaded one marked as current.
function renderDemoList() {
  demoList.innerHTML = `<p>${t('demos.intro')}</p>` + GROUPS.map(g => `
    <section aria-labelledby="group-${g.id}">
      <h2 id="group-${g.id}">${g.title[lang()]}</h2>
      ${g.text ? `<p>${g.text[lang()]}</p>` : ''}
      <ul class="demo-list">${demosIn(g).map(d => `
        <li class="demo-item${d === demo ? ' current' : ''}">
          <h3><a href="?demo=${d.id}#sim" data-demo-id="${d.id}"${d === demo ? ' aria-current="true"' : ''}>
            <span class="demo-id">${d.id}</span>${d.title[lang()]}</a></h3>
          <p>${d.text[lang()]}</p>
        </li>`).join('')}</ul>
    </section>`).join('');
}

// A plain click loads the demo here; with a modifier, the link opens a new tab.
demoList.addEventListener('click', e => {
  const id = e.target.closest('[data-demo-id]')?.dataset.demoId;
  if (!id || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  setPlaying(false);
  loadDemo(demoById(id));
  rerun();
  goTo('sim');
  scrollTo({ top: 0, behavior: 'instant' });
});

function draw() {
  const r = renderTimeline(trace, now, protocol);
  const hadFocus = svg.contains(document.activeElement);
  svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
  svg.setAttribute('width', r.width);
  svg.setAttribute('height', r.height);
  svg.innerHTML = r.svg;
  svg.ariaLabel = t('diagram.name', {
    n: trace.transmissions.filter(tx => tx.kind === 'data' && !tx.rtx).length, rtx: analysis.retransmissions,
  });
  rovingFocus(hadFocus);
  if (events.open) eventsTable.innerHTML = describeTrace(trace, now);
  tape.scale(svg.clientWidth / r.width);
  markHover();
  panel.innerHTML = renderState(trace, analysis);
  tape.update(now);
  showPosition();
  follow(r.playheadY * svg.clientWidth / r.width);
  placeNames();
}

// When the time moves (playing, stepping, going to the start or the end),
// the page scrolls with the playhead (y, in px from the top of the diagram)
// and keeps 40% of the diagram's visible height, between the fixed header and
// the status bar, ahead of it; going back, a little above it. Otherwise it
// stays where the viewer left it, unless a playback button is pressed.
let followedNow = null;
function follow(y) {
  if (now === followedNow || view !== 'sim') return;
  followedNow = now;
  const top = simHead.getBoundingClientRect().bottom;  // visible part of the diagram: top to bottom
  const bottom = statusBar.getBoundingClientRect().top;
  const h = bottom - top;
  const at = svg.getBoundingClientRect().top + y;      // playhead, in the viewport
  if (at > top + 0.6 * h) scrollBy({ top: at - (top + 0.6 * h), behavior: 'instant' });
  else if (at < top + 0.15 * h) scrollBy({ top: at - (top + 0.15 * h), behavior: 'instant' });
}

// The left column stays at the top while the page scrolls; if it is taller
// than the window, only once its end is in view (above the status bar).
const pinSide = () => {
  const room = statusBar.getBoundingClientRect().top;
  side.style.top = `${Math.min(8, room - side.offsetHeight - 8)}px`;
};
new ResizeObserver(pinSide).observe(side);
addEventListener('resize', pinSide);

// The names «Sender» and «Receiver» go down with the page, at the top of the
// visible part of the diagram (below the fixed header), never past its end.
function placeNames() {
  const names = svg.querySelector('.side-names');
  if (!names || !svg.clientWidth) return;  // hidden view: nothing to place
  const scale = svg.clientWidth / +svg.getAttribute('width');
  const hidden = (simHead.getBoundingClientRect().bottom - svg.getBoundingClientRect().top) / scale;
  const dy = Math.max(0, Math.min(hidden, +svg.getAttribute('height') - 120));
  names.setAttribute('transform', `translate(0,${dy})`);
}
addEventListener('scroll', placeNames, { passive: true });
addEventListener('resize', placeNames);

// ---------- Playback (§10.10) ----------
// A step is each instant at which something changes: «Step k of N» counts the
// event times reached; 0 is the start, before anything happens.
const stepIndex = () => times.filter(x => x <= now + 1e-9).length;

function tick(ts) {
  if (!playing) return;
  const dt = lastFrame ? (ts - lastFrame) / 1000 : 0;
  lastFrame = ts;
  const py = scale.y(now) + dt * playbackRate(trace.params) * +speed.value;
  now = Math.min(trace.end, scale.time(py));
  draw();
  if (now >= trace.end) setPlaying(false);
  else requestAnimationFrame(tick);
}

// Reduced motion: from step to step, without the positions in between.
let stepTimer = 0;
function stepPlay() {
  if (!playing) return;
  now = times.find(x => x > now + 1e-9) ?? trace.end;
  draw();
  if (now >= trace.end) setPlaying(false);
  else stepTimer = setTimeout(stepPlay, STEP_PAUSE / +speed.value);
}

function showPlayButton() {
  const label = t(playing ? 'pause' : 'play');
  playBtn.innerHTML = icon(playing ? 'pause' : 'play-arrow');
  playBtn.ariaLabel = label;
  playBtn.dataset.tooltip = `${label} (${t('key.space')})`;
}

function setPlaying(on) {
  const was = playing;
  playing = on;
  clearTimeout(stepTimer);
  showPlayButton();
  // Stopped: the step where it stopped is announced (not while playing).
  if (was && !on) announcePosition();
  if (!on) return;
  if (now >= trace.end) {
    now = START;
    scrollTo({ top: 0, behavior: 'instant' });
  }
  playerStatus.textContent = '';
  lastFrame = 0;
  if (reducedMotion.matches) stepTimer = setTimeout(stepPlay, 0);
  else requestAnimationFrame(tick);
}

const actions = {
  play: () => setPlaying(!playing),
  reset() {
    setPlaying(false);
    now = START;
    scrollTo({ top: 0, behavior: 'instant' });
    draw();
  },
  prev() {
    setPlaying(false);
    now = times.findLast(x => x < now - 1e-9) ?? START;
    draw();
  },
  step() {
    setPlaying(false);
    now = times.find(x => x > now + 1e-9) ?? trace.end;
    draw();
  },
  end() {
    setPlaying(false);
    now = trace.end;
    draw();
  },
};

// The buttons that would do nothing at the start or at the end stay in place,
// marked as not available, with the reason in their tooltip (D6-C).
const AT_START = ['reset', 'prev'];
const AT_END = ['step', 'end'];
function showPosition() {
  const k = stepIndex(), n = times.length;
  const atStart = now <= START, atEnd = now >= trace.end;
  for (const b of player.querySelectorAll('[data-act]:not([data-act=play])')) {
    const act = b.dataset.act;
    const off = (atStart && AT_START.includes(act)) || (atEnd && AT_END.includes(act));
    const text = `${t(act)} (${t(`key.${act}`)})`;
    b.ariaLabel = t(act);
    b.dataset.tooltip = off ? `${text}. ${t(atStart ? 'at.start' : 'at.end')}` : text;
    if (off) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled');
  }
  counter.textContent = t('step.counter', { k, n });
  range.max = scale.y(trace.end);
  range.value = Math.max(0, scale.y(now));
  range.setAttribute('aria-valuetext', t('step.counter', { k, n }));
}

// Announced when the user moves the time, not while it plays.
function announcePosition() {
  playerStatus.textContent = '';
  playerStatus.textContent = t('step.counter', { k: stepIndex(), n: times.length });
}

// A mark under the slider at each step.
function drawMarks() {
  const end = scale.y(trace.end) || 1;
  marks.innerHTML = times.map(x => `<span style="left:${(100 * scale.y(x) / end).toFixed(2)}%"></span>`).join('');
}

function act(name) {
  if (!actions[name]) return;
  const b = player.querySelector(`[data-act=${name}]`);
  if (b?.getAttribute('aria-disabled') === 'true') return;
  followedNow = null;  // a button always brings the playhead into view
  actions[name]();
  if (name !== 'play') announcePosition();
}

player.addEventListener('click', e => {
  const name = e.target.closest('[data-act]')?.dataset.act;
  if (name) act(name);
});

// The slider shows any instant, also between two steps; its keys go from step
// to step.
range.addEventListener('input', () => {
  setPlaying(false);
  followedNow = null;
  now = Math.min(trace.end, Math.max(START, scale.time(+range.value)));
  if (+range.value <= 0) now = START;
  draw();
});
range.addEventListener('change', announcePosition);

// Keys of the player, with the focus in it or in the diagram (§10.10, §11.1).
// On a button, Space presses it, as always.
const KEYS = { ' ': 'play', ArrowLeft: 'prev', ArrowRight: 'step', Home: 'reset', End: 'end' };
function playerKeys(e) {
  const name = KEYS[e.key];
  if (!name || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === ' ' && e.target.closest('button, select')) return;
  if (e.target.matches('select')) return;
  e.preventDefault();
  act(name);
}
player.addEventListener('keydown', playerKeys);
wrap.addEventListener('keydown', playerKeys);

speed.addEventListener('change', () => saveSetting('speed', speed.value));
reducedMotion.addEventListener('change', () => playing && setPlaying(true));

// ---------- Fields ----------
form.addEventListener('input', e => {
  if (e.target === f.p) {
    loadParams(byId(f.p.value));
    losses.clear();
    now = START;
  } else if (e.target === f.link) {
    const link = LINKS.find(l => l.id === f.link.value);
    if (!link) return;  // «custom» changes nothing
    f.tt.value = link.tTrans;
    f.d.value = link.tProp;
    f.to.value = link.timeout ?? byId(f.p.value).defaults.timeout;
  } else if (e.target === f.tt || e.target === f.d) {
    showLink();
  }
  rerun();
});

// The mouse wheel over a number field steps its value, as an edit would: by 1
// in the integer fields; in the decimal ones (step="any") by the order of
// magnitude of the value, so that 0.8 goes to 0.9 and 1, 9 to 10 and 20.
function stepped(input, up) {
  const v = +input.value || 0;
  const ref = up ? v : v * 0.999;  // going down from 1 steps by 0.1
  const step = input.step !== 'any' ? 1 : ref > 0 ? 10 ** Math.floor(Math.log10(ref)) : 1;
  const next = +(v + (up ? step : -step)).toPrecision(12);
  return Math.min(+input.max, Math.max(+input.min, next));
}

let wheelDelta = 0;  // trackpads send many small deltas: step every 40px
form.addEventListener('wheel', e => {
  const input = e.target.closest('input[type=number]');
  if (!input || input.readOnly) return;
  e.preventDefault();
  wheelDelta += e.deltaMode ? e.deltaY * 40 : e.deltaY;
  if (Math.abs(wheelDelta) < 40) return;
  input.value = stepped(input, wheelDelta < 0);
  wheelDelta = 0;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}, { passive: false });

// ---------- Diagram ----------
// Pointer on an arrow: the lines where it leaves and where it arrives get a
// grey background, also across the redraws while playing.
let hoverKey = null;
function markHover() {
  for (const el of svg.querySelectorAll('[data-keys]'))
    el.classList.toggle('hl', !!hoverKey && el.dataset.keys.split(' ').includes(hoverKey));
}
svg.addEventListener('pointerover', e => {
  hoverKey = e.target.closest('.msg')?.dataset.key ?? null;
  markHover();
});
svg.addEventListener('pointerleave', () => {
  hoverKey = null;
  markHover();
});

// Losing or delivering an arrow: a click, or Enter or Space on it.
function toggleLoss(key) {
  const tx = trace.transmissions.find(x => x.key === key);
  if (losses.has(key)) losses.delete(key);
  else losses.set(key, !tx.lost);
  rerun();
}
svg.addEventListener('click', e => {
  const key = e.target.closest('[data-key]')?.dataset.key;
  if (key) toggleLoss(key);
});

// The arrows are a single tab stop: the one that had the focus, or the
// first; ↑ and ↓ go through them in the order they leave. The focus stays on
// the same arrow while the diagram is redrawn.
let focusKey = null;
function rovingFocus(refocus) {
  const msgs = [...svg.querySelectorAll('.msg')];
  const current = msgs.find(m => m.dataset.key === focusKey) ?? msgs[0];
  if (current) current.tabIndex = 0;
  if (refocus) current?.focus({ preventScroll: true });
}
svg.addEventListener('keydown', e => {
  const msg = e.target.closest('.msg');
  if (!msg) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    e.stopPropagation();  // on an arrow, Space presses it, as on any button
    toggleLoss(msg.dataset.key);
    return;
  }
  const msgs = [...svg.querySelectorAll('.msg')];
  const i = msgs.indexOf(msg) + ({ ArrowDown: 1, ArrowUp: -1 }[e.key] ?? NaN);
  if (Number.isNaN(i)) return;  // the player's keys go on to the diagram's frame
  e.preventDefault();
  const next = msgs[Math.max(0, Math.min(msgs.length - 1, i))];
  msg.tabIndex = -1;
  next.tabIndex = 0;
  next.focus();
});
// The arrow with the focus is highlighted as the one under the pointer (§10.8).
svg.addEventListener('focusin', e => {
  const key = e.target.closest('.msg')?.dataset.key;
  if (!key) return;
  focusKey = hoverKey = key;
  markHover();
});
svg.addEventListener('focusout', e => {
  if (svg.contains(e.relatedTarget)) return;
  hoverKey = null;
  markHover();
});

const events = $('events');
const eventsTable = $('events-table');
events.addEventListener('toggle', () => { if (events.open) eventsTable.innerHTML = describeTrace(trace, now); });

// ---------- Language and texts ----------
// Language: ?lang=, then the last choice, then the browser's language.
function initialLang() {
  const q = new URLSearchParams(location.search).get('lang');
  let stored = null;
  try { stored = localStorage.getItem(LANG_KEY); } catch {}
  const browser = (navigator.languages ?? [navigator.language]).map(l => l?.slice(0, 2).toLowerCase());
  return [q, stored, ...browser, 'en'].find(l => LANGS.includes(l));
}

function applyLang(code) {
  setLang(code);
  document.documentElement.lang = lang();
  langSelect.value = lang();
  document.title = view === 'sim' || view === 'demos' ? t('title') : `${t('help')} · ${t('title')}`;
  for (const el of document.querySelectorAll('[data-text]')) el.innerHTML = t(el.dataset.text);
  for (const el of document.querySelectorAll('[data-text-aria]')) el.ariaLabel = t(el.dataset.textAria);
  for (const el of document.querySelectorAll('[data-text-tooltip]')) el.dataset.tooltip = t(el.dataset.textTooltip);
  splitter.ariaLabel = t('split.name');
  splitter.dataset.tooltip = t('split.title');
  side.ariaLabel = t('split.name');
  $('version').textContent = t('version', { v: VERSION });
  fillSelect(f.p, PROTOCOLS.map(p => [p.id, t(`proto.${p.id}`)]));
  if (protocol) fillAckModes(protocol, f.ack.value);
  fillSelect(f.link, [...LINKS.map(l => [l.id, t(`link.${l.id}`)]), ['custom', t('link.custom')]]);
  showLink();
  showPlayButton();
  guide.innerHTML = renderGuide();
  renderDemoList();
  if (protocol) renderDemo();
}

langSelect.addEventListener('change', () => {
  try { localStorage.setItem(LANG_KEY, langSelect.value); } catch {}
  applyLang(langSelect.value);
  setHint('k', f.k.readOnly);
  setHint('w', f.w.readOnly);
  draw();
});

// ---------- Views ----------
// «demos» (the list), «sim» (controls and diagram) and «help»: each has its
// own address (#demos, #sim, #help), so that Back returns to the previous one.
function showView(name) {
  view = name;
  for (const v of VIEWS) $(`view-${v}`).hidden = v !== name;
  for (const a of document.querySelectorAll('[data-view]')) {
    if (a.dataset.view === name) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  document.title = name === 'help' ? `${t('help')} · ${t('title')}` : t('title');
  if (name === 'demos') renderDemoList();
  if (name !== 'sim') setPlaying(false);
  if (name === 'sim') { followedNow = null; pinSide(); placeNames(); }
}

// Going to a view: a new entry in the history, and the focus at its start.
function goTo(name) {
  if (location.hash !== `#${name}`) history.pushState(null, '', `${location.pathname}${location.search}#${name}`);
  showView(name);
}

function viewFromHash() {
  const name = location.hash.slice(1);
  if (name === 'guide') return 'help';  // older links
  if (VIEWS.includes(name)) return name;
  const q = new URLSearchParams(location.search);
  return q.has('demo') || q.has('p') ? 'sim' : 'demos';
}

addEventListener('hashchange', () => {
  showView(viewFromHash());
  $('main').focus({ preventScroll: true });
  scrollTo({ top: 0, behavior: 'instant' });
});
addEventListener('popstate', () => showView(viewFromHash()));

// ---------- Splitter ----------
// Between the columns of the simulation: drag it, or use the arrow keys
// (Home and End for the limits), to share the width; double-click restores
// it. The CSS keeps it within limits; the width each viewer chooses is
// remembered.
const sideWidth = () => side.getBoundingClientRect().width;
const setSide = px => simView.style.setProperty('--side', `${Math.round(px)}px`);

function showSplit() {
  const total = simView.getBoundingClientRect().width || 1;
  splitter.setAttribute('aria-valuenow', Math.round(100 * sideWidth() / total));
}

function saveSide() {
  setSide(sideWidth());  // what the limits let through
  saveSetting('side', Math.round(sideWidth()));
  showSplit();
}

splitter.addEventListener('pointerdown', e => {
  const start = sideWidth() - e.clientX;
  const move = ev => setSide(start + ev.clientX);
  splitter.setPointerCapture(e.pointerId);
  simView.classList.add('resizing');
  splitter.addEventListener('pointermove', move);
  splitter.addEventListener('lostpointercapture', () => {
    splitter.removeEventListener('pointermove', move);
    simView.classList.remove('resizing');
    saveSide();
  }, { once: true });
});

splitter.addEventListener('keydown', e => {
  const target = { ArrowLeft: sideWidth() - 20, ArrowRight: sideWidth() + 20, Home: 0, End: 1e5 }[e.key];
  if (target === undefined) return;
  e.preventDefault();
  setSide(target);
  saveSide();
});

splitter.addEventListener('dblclick', () => {
  simView.style.removeProperty('--side');
  saveSetting('side', undefined);
  showSplit();
});
new ResizeObserver(showSplit).observe(side);

// ---------- Scenario in the URL ----------
// p=gbn&k=2&w=3&n=4&tt=1&d=1&to=6&r=0&l=d1.1,-a2
function scenario() {
  const q = new URLSearchParams({ p: f.p.value });
  for (const name of FIELDS) if (!isFixed(name)) q.set(name, f[name].value);
  const l = [...losses].map(([k, lost]) => (lost ? '' : '-') + k).join(',');
  if (l) q.set('l', l);
  return q;
}
const stateKey = () => scenario().toString();

// State in the URL, to link a specific scenario. With a demo open, ?demo=ID
// goes first; on load, explicit parameters win over the demo's. Each change
// replaces the address, without new entries in the history (§8.15).
function writeUrl() {
  const q = new URLSearchParams(demo ? { demo: demo.id } : {});
  for (const [key, val] of scenario()) q.set(key, val);
  const urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang) q.set('lang', lang());
  history.replaceState(null, '', `?${q}${location.hash}`);
}

// Loads a scenario from URL parameters; returns the instant to show.
function loadQuery(q) {
  loadParams(byId(q.get('p')));
  for (const name of FIELDS) if (q.has(name) && !isFixed(name)) f[name].value = q.get(name);
  if (!q.has('r')) f.r.value = 0;
  if (f.ack.selectedIndex < 0) f.ack.selectedIndex = 0;
  showLink();
  losses = new Map((q.get('l') ?? '').split(',').filter(Boolean)
    .map(k => k.startsWith('-') ? [k.slice(1), false] : [k, true]));
  const time = q.get('t');
  return time === 'end' ? Infinity : time === null ? START : +time;
}

// Loads a demo's scenario, from its start.
function loadDemo(d) {
  demo = d;
  now = loadQuery(new URLSearchParams(demo.query));
  demoKey = stateKey();
  demoValues = Object.fromEntries(['p', ...FIELDS].map(name => [name, f[name].value]));
  demoNotice = false;
  demoOpen = true;  // a demo that is loaded shows its explanation
}

function readUrl() {
  const q = new URLSearchParams(location.search);
  const d = demoById(q.get('demo'));
  if (d) loadDemo(d);
  if (!demo || q.has('p')) {
    const time = loadQuery(q);
    if (!demo || q.has('t')) now = time;
  }
  demoNotice = !!demo && stateKey() !== demoKey;  // a changed demo in the URL: at once
}

// ---------- Start ----------
{
  const s = loadSettings();
  if (s.side > 0) setSide(s.side);
  if ([...speed.options].some(o => o.value === s.speed)) speed.value = s.speed;
}
const firstView = viewFromHash();  // before rerun() writes the scenario in the URL
applyLang(initialLang());
readUrl();
rerun();
showView(firstView);
