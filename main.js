import { simulate } from './sim/simulation.js';
import { analyze } from './sim/analysis.js';
import { LINKS, linkFor } from './sim/links.js';
import { PROTOCOLS, byId } from './protocols/index.js';
import { renderTimeline, eventTimes } from './ui/timeline.js';
import { timeScale } from './ui/timescale.js';
import { renderState, progress, num } from './ui/state.js';
import { renderGuide } from './ui/guide.js';
import { LANGS, lang, setLang, t } from './ui/i18n.js';
import { demoById } from './ui/demos.js';
import { createTape } from './ui/tape.js';

// Playback at 1×, in pixels of the diagram per second: an RTT takes 1.5 s
// with a = 1. Slower for larger a, so a long propagation feels longer,
// though far from to scale (about 3.7 s per RTT on a satellite link).
const PX_PER_SECOND = 75;
const playbackRate = ({ tTrans, tProp }) => PX_PER_SECOND / (1 + 0.25 * Math.log2(1 + tProp / tTrans));
const FIELDS = ['k', 'w', 'n', 'tt', 'd', 'to', 'r', 'ack'];
const LANG_KEY = 'arq-demo.lang';

const form = document.getElementById('controls');
const f = form.elements;
const svg = document.getElementById('timeline');
const panel = document.getElementById('state');
const wrap = document.getElementById('timeline-wrap');
const clockOut = document.getElementById('clock');
const playBtn = form.querySelector('[data-act=play]');
const langBar = document.getElementById('lang');
const tabs = document.getElementById('tabs');
const hint = document.getElementById('diagram-hint');
const guide = document.getElementById('tab-guide');
const demoBox = document.getElementById('demo');
const tape = createTape(document.getElementById('tape'));

let protocol, trace, times, analysis, scale;
let losses = new Map();  // key → true (lose) / false (deliver)
let demo = null;         // demo loaded with ?demo=ID, while its box is open
let demoKey = '';        // its scenario, to tell whether it was changed
// At rest, before anything happens: t = 0 already shows data 0 leaving.
const START = -1e-6;
let now = START;
let playing = false;
let lastFrame = 0;

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

function fillAckModes(proto, selected) {
  fillSelect(f.ack, proto.ackModes.map(m => [m, t(`ack.${m}`)]), selected);
  f.ack.disabled = proto.ackModes.length === 1;
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
  f.k.disabled = f.w.disabled = !!proto.fixed;
  fillAckModes(proto, p.ack);
  showLink();
}

// Highlights the fields that break one of the chapter's constraints.
function markInputs(an) {
  for (const input of [f.k, f.w, f.to, f.ack]) input.classList.remove('invalid', 'warn');
  if (!an.windowOk) f.k.classList.add('invalid'), f.w.classList.add('invalid');
  else if (!an.efficient && !f.w.disabled) f.w.classList.add('warn');
  if (!an.ackOk) f.ack.classList.add('invalid');
  if (!an.timeoutOk) f.to.classList.add('warn');
  wrap.classList.toggle('failed', !!(an.failure || an.loop || an.unfinished));
}

function updateOutputs() {
  for (const o of form.querySelectorAll('output[for]'))
    o.value = f[o.htmlFor].value + (o.dataset.unit ?? '');
}

function rerun() {
  protocol = byId(f.p.value);
  trace = simulate(protocol, { ...readParams(), forcedLosses: losses });
  analysis = analyze(trace, protocol);
  scale = timeScale(trace);
  times = eventTimes(trace);
  tape.load(trace);
  document.getElementById('calc-a').value = num(analysis.a);
  document.getElementById('calc-2a').value = +(1 + 2 * analysis.a).toPrecision(4);
  markInputs(analysis);
  now = Math.min(now, trace.end);
  updateOutputs();
  writeUrl();
  renderDemo();
  draw();
}

// Box with what the loaded demo shows, and a way back if it was changed.
function renderDemo() {
  demoBox.hidden = !demo;
  if (!demo) return;
  const changed = stateKey() !== demoKey;
  demoBox.innerHTML = `
    <div class="demo-head">
      <h2>${demo.id} · ${demo.title[lang()]}</h2>
      <button type="button" class="btn-close" data-demo="close" title="${t('demo.close')}" aria-label="${t('demo.close')}"></button>
    </div>
    <p>${demo.text[lang()]}</p>
    ${changed ? `<p class="demo-changed">${t('demo.modified')}
      <button type="button" class="btn btn-link btn-sm p-0 align-baseline" data-demo="restore">${t('demo.restore')}</button></p>` : ''}`;
}

demoBox.addEventListener('click', e => {
  const act = e.target.closest('[data-demo]')?.dataset.demo;
  if (!act) return;
  if (act === 'close') demo = null;
  if (act === 'restore') {
    setPlaying(false);
    now = loadQuery(new URLSearchParams(demo.query));
    wrap.scrollTop = 0;
  }
  rerun();
});

function draw() {
  const r = renderTimeline(trace, now, protocol);
  svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
  svg.setAttribute('width', r.width);
  svg.setAttribute('height', r.height);
  svg.innerHTML = r.svg;
  panel.innerHTML = renderState(trace, analysis);
  clockOut.innerHTML = progress(trace, now);
  tape.update(now);
  hint.textContent = t('hint.arrows');
  if (playing) {
    const yPx = r.playheadY * svg.clientWidth / r.width;
    if (yPx > wrap.scrollTop + wrap.clientHeight * 0.8)
      wrap.scrollTop = yPx - wrap.clientHeight * 0.5;
  }
}

function tick(ts) {
  if (!playing) return;
  const dt = lastFrame ? (ts - lastFrame) / 1000 : 0;
  lastFrame = ts;
  const py = scale.y(now) + dt * playbackRate(trace.params) * +f.speed.value;
  now = Math.min(trace.end, scale.time(py));
  draw();
  if (now >= trace.end) setPlaying(false);
  else requestAnimationFrame(tick);
}

function showPlayButton() {
  playBtn.innerHTML = `<i class="bi bi-${playing ? 'pause' : 'play'}-fill"></i>`;
  playBtn.title = t(playing ? 'pause' : 'play');
}

function setPlaying(on) {
  playing = on;
  showPlayButton();
  if (!on) return;
  if (now >= trace.end) {
    now = START;
    wrap.scrollTop = 0;
  }
  lastFrame = 0;
  requestAnimationFrame(tick);
}

const actions = {
  play: () => setPlaying(!playing),
  reset() {
    setPlaying(false);
    now = START;
    wrap.scrollTop = 0;
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
  book() {
    const { params, losses: keys } = protocol.book;
    loadParams(protocol, { ack: f.ack.value, ...params });
    f.r.value = 0;
    losses = new Map(keys.map(k => [k, true]));
    now = START;
    rerun();
    setPlaying(true);
  },
  clear() {
    losses.clear();
    rerun();
  },
};

form.addEventListener('click', e => {
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act) actions[act]();
});

form.addEventListener('input', e => {
  if (e.target === f.speed) return;
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

svg.addEventListener('click', e => {
  const key = e.target.closest('[data-key]')?.dataset.key;
  if (!key) return;
  const tx = trace.transmissions.find(x => x.key === key);
  if (losses.has(key)) losses.delete(key);
  else losses.set(key, !tx.lost);
  rerun();
});

// Language: ?lang=, then the last choice, then the browser's language.
function initialLang() {
  const q = new URLSearchParams(location.search).get('lang');
  let stored = null;
  try { stored = localStorage.getItem(LANG_KEY); } catch {}
  const browser = navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en';
  return [q, stored, browser].find(l => LANGS.includes(l));
}

function applyLang(code) {
  setLang(code);
  document.documentElement.lang = lang();
  document.title = t('title');
  for (const el of document.querySelectorAll('[data-i18n]')) el.innerHTML = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);
  for (const el of document.querySelectorAll('[data-i18n-aria]')) el.ariaLabel = t(el.dataset.i18nAria);
  for (const b of langBar.querySelectorAll('[data-lang]')) b.classList.toggle('active', b.dataset.lang === lang());
  fillSelect(f.p, PROTOCOLS.map(p => [p.id, t(`proto.${p.id}`)]));
  if (protocol) fillAckModes(protocol, f.ack.value);
  fillSelect(f.link, [...LINKS.map(l => [l.id, t(`link.${l.id}`)]), ['custom', t('link.custom')]]);
  showLink();
  showPlayButton();
  guide.innerHTML = renderGuide();
  if (protocol) renderDemo();
}

// Tabs: «sim» (controls and diagram) and «guide»; the URL hash keeps it.
function showTab(name) {
  for (const b of tabs.querySelectorAll('[data-tab]')) {
    const on = b.dataset.tab === name;
    b.classList.toggle('active', on);
    b.ariaSelected = on;
    document.getElementById(`tab-${b.dataset.tab}`).hidden = !on;
  }
  if (name !== 'sim') setPlaying(false);
  const base = location.pathname + location.search;
  history.replaceState(null, '', name === 'sim' ? base : `${base}#${name}`);
}

tabs.addEventListener('click', e => {
  const name = e.target.closest('[data-tab]')?.dataset.tab;
  if (name) showTab(name);
});

langBar.addEventListener('click', e => {
  const code = e.target.closest('[data-lang]')?.dataset.lang;
  if (!code) return;
  try { localStorage.setItem(LANG_KEY, code); } catch {}
  applyLang(code);
  draw();
});

// The scenario as URL parameters:
// p=gbn&k=2&w=3&n=4&tt=1&d=1&to=6&r=0&l=d1.1,-a2
function scenario() {
  const q = new URLSearchParams({ p: f.p.value });
  for (const name of FIELDS) if (!f[name].disabled) q.set(name, f[name].value);
  const l = [...losses].map(([k, lost]) => (lost ? '' : '-') + k).join(',');
  if (l) q.set('l', l);
  return q;
}
const stateKey = () => scenario().toString();

// State in the URL, to link a specific scenario. With a demo open, ?demo=ID
// goes first; on load, explicit parameters win over the demo's.
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
  for (const name of FIELDS) if (q.has(name) && !f[name].disabled) f[name].value = q.get(name);
  if (!q.has('r')) f.r.value = 0;
  if (f.ack.selectedIndex < 0) f.ack.selectedIndex = 0;
  showLink();
  losses = new Map((q.get('l') ?? '').split(',').filter(Boolean)
    .map(k => k.startsWith('-') ? [k.slice(1), false] : [k, true]));
  const time = q.get('t');
  return time === 'end' ? Infinity : time === null ? START : +time;
}

function readUrl() {
  const q = new URLSearchParams(location.search);
  demo = demoById(q.get('demo'));
  if (demo) {
    now = loadQuery(new URLSearchParams(demo.query));
    demoKey = stateKey();
  }
  if (!demo || q.has('p')) {
    const time = loadQuery(q);
    if (!demo || q.has('t')) now = time;
  }
}

applyLang(initialLang());
readUrl();
rerun();
showTab(location.hash === '#guide' ? 'guide' : 'sim');
