import { simulate } from './sim/simulation.js';
import { PROTOCOLS, byId } from './protocols/index.js';
import { renderTimeline, eventTimes } from './ui/timeline.js';
import { renderState } from './ui/state.js';

const UNITS_PER_SECOND = 2;  // velocidad de reproducción a 1×
const FIELDS = ['k', 'w', 'n', 'd', 'to', 'r'];

const form = document.getElementById('controls');
const f = form.elements;
const svg = document.getElementById('timeline');
const panel = document.getElementById('state');
const wrap = document.getElementById('timeline-wrap');
const playBtn = form.querySelector('[data-act=play]');

let protocol, trace, times;
let losses = new Map();  // clave → true (perder) / false (entregar)
let now = 0;
let playing = false;
let lastFrame = 0;

for (const p of PROTOCOLS) f.p.add(new Option(p.name, p.id));

function readParams() {
  return {
    k: +f.k.value, window: +f.w.value, count: +f.n.value,
    tProp: +f.d.value, timeout: +f.to.value, lossRate: +f.r.value / 100,
  };
}

function loadParams(proto, params = {}) {
  const p = { ...proto.defaults, ...params };
  f.p.value = proto.id;
  f.k.value = p.k;
  f.w.value = p.window;
  f.n.value = p.count;
  f.d.value = p.tProp;
  f.to.value = p.timeout;
  f.k.disabled = f.w.disabled = !!proto.fixed;
}

function updateOutputs() {
  for (const o of form.querySelectorAll('output[for]'))
    o.value = f[o.htmlFor].value + (o.dataset.unit ?? '');
}

function rerun() {
  protocol = byId(f.p.value);
  trace = simulate(protocol, { ...readParams(), forcedLosses: losses });
  times = eventTimes(trace);
  now = Math.min(now, trace.end);
  updateOutputs();
  writeUrl();
  draw();
}

function draw() {
  const r = renderTimeline(trace, now, protocol);
  svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
  svg.setAttribute('width', r.width);
  svg.setAttribute('height', r.height);
  svg.innerHTML = r.svg;
  panel.innerHTML = renderState(trace, now, protocol);
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
  now = Math.min(trace.end, now + dt * UNITS_PER_SECOND * +f.speed.value);
  draw();
  if (now >= trace.end) setPlaying(false);
  else requestAnimationFrame(tick);
}

function setPlaying(on) {
  playing = on;
  playBtn.textContent = on ? '⏸' : '▶';
  playBtn.title = on ? 'Pausa' : 'Reproducir';
  if (!on) return;
  if (now >= trace.end) {
    now = 0;
    wrap.scrollTop = 0;
  }
  lastFrame = 0;
  requestAnimationFrame(tick);
}

const actions = {
  play: () => setPlaying(!playing),
  reset() {
    setPlaying(false);
    now = 0;
    wrap.scrollTop = 0;
    draw();
  },
  step() {
    setPlaying(false);
    now = times.find(t => t > now + 1e-9) ?? trace.end;
    draw();
  },
  end() {
    setPlaying(false);
    now = trace.end;
    draw();
  },
  book() {
    const { params, losses: keys } = protocol.book;
    loadParams(protocol, params);
    f.r.value = 0;
    losses = new Map(keys.map(k => [k, true]));
    now = 0;
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
    now = 0;
  }
  rerun();
});

svg.addEventListener('click', e => {
  const key = e.target.closest('[data-key]')?.dataset.key;
  if (!key) return;
  const tx = trace.transmissions.find(t => t.key === key);
  if (losses.has(key)) losses.delete(key);
  else losses.set(key, !tx.lost);
  rerun();
});

// Estado en la URL, para enlazar un escenario concreto:
// ?p=gbn&k=2&w=3&n=4&d=1&to=6&r=0&l=d1.1,-a2&t=end
function writeUrl() {
  const q = new URLSearchParams({ p: protocol.id });
  for (const name of FIELDS) q.set(name, f[name].value);
  const l = [...losses].map(([k, lost]) => (lost ? '' : '-') + k).join(',');
  if (l) q.set('l', l);
  history.replaceState(null, '', `?${q}`);
}

function readUrl() {
  const q = new URLSearchParams(location.search);
  loadParams(byId(q.get('p')));
  for (const name of FIELDS) if (q.has(name)) f[name].value = q.get(name);
  losses = new Map((q.get('l') ?? '').split(',').filter(Boolean)
    .map(k => k.startsWith('-') ? [k.slice(1), false] : [k, true]));
  const t = q.get('t');
  now = t === 'end' ? Infinity : +(t ?? 0);
}

readUrl();
rerun();
