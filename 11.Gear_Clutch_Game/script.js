'use strict';

/* =========================================================
   Gear & Clutch Race — a manual-transmission drag race
   ========================================================= */

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const isNumGear = (g) => g >= '1' && g <= '5';

/* ---------- Car tuning ---------- */
const RACE_LEN = 800; // metres
const RATIOS = { R: -3.4, N: 0, 1: 3.6, 2: 2.25, 3: 1.55, 4: 1.15, 5: 0.88 };
const K_RPM = 140; // engine rpm per (m/s × gear ratio)
const IDLE = 850;
const SHIFT_RPM = 6000;
const LIMIT = 7200; // rev limiter
const FORCE = 1.75; // drive force scale
const STALL_RPM = 380;
const CLUTCH_CAP = 1.6; // clutch can pass more torque than the engine makes
const ENGINE_ACCEL = 9000; // rpm/s per unit of net torque
const GEAR_NAMES = {
  N: 'Neutral',
  R: 'Reverse',
  1: 'First',
  2: 'Second',
  3: 'Third',
  4: 'Fourth',
  5: 'Fifth',
};

// Rival speed profile: v(t) = vmax · (1 − e^(−t/tau))
const RIVALS = {
  easy: { vmax: 41, tau: 9.5 },
  normal: { vmax: 45, tau: 8.8 },
  hard: { vmax: 47.5, tau: 8.4 },
};
const rivalDistAt = (r, t) => r.vmax * (t - r.tau * (1 - Math.exp(-t / r.tau)));
function rivalFinishTime(r) {
  let lo = 0;
  let hi = 200;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (rivalDistAt(r, mid) < RACE_LEN) lo = mid;
    else hi = mid;
  }
  return hi;
}

function torque(rpm) {
  const x = (rpm - 4600) / 3800;
  return Math.max(0.3, 1 - x * x * 0.75);
}

/* ---------- Storage (best times) ---------- */
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable — ignore */
    }
  },
};

/* ---------- Game state ---------- */
const input = { clutch: false, gas: false };
let difficulty = store.get('gc.diff', 'normal');
let muted = store.get('gc.muted', false);

const S = { phase: 'menu' };

function resetState() {
  Object.assign(S, {
    phase: 'countdown',
    countdown: 3.6,
    t: 0,
    dist: 0,
    v: 0,
    rpm: IDLE,
    thr: 0,
    running: true,
    crank: 0,
    clutch: input.clutch ? 1 : 0,
    clutchIn: false,
    pending: null,
    moneyArmed: true,
    gear: 'N',
    dmg: 0,
    perfect: 0,
    grinds: 0,
    stalls: 0,
    topV: 0,
    rivalDist: 0,
    shake: 0,
    flame: 0,
    limiterT: 0,
    lastGrind: -9,
    finishT: 0,
  });
}

/* ---------- Audio (synth engine) ---------- */
const audio = {
  ctx: null,
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain();
    this.master.gain.value = muted ? 0 : 0.5;
    this.master.connect(ctx.destination);

    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 600;
    this.filter.Q.value = 4;
    this.engGain = ctx.createGain();
    this.engGain.gain.value = 0;
    this.filter.connect(this.engGain).connect(this.master);

    this.o1 = ctx.createOscillator();
    this.o1.type = 'sawtooth';
    this.o2 = ctx.createOscillator();
    this.o2.type = 'square';
    const g2 = ctx.createGain();
    g2.gain.value = 0.35;
    this.o1.connect(this.filter);
    this.o2.connect(g2).connect(this.filter);
    this.o1.start();
    this.o2.start();
  },
  update() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const live = S.phase === 'countdown' || S.phase === 'race' || S.phase === 'done';
    const rpm = live ? S.rpm : 0;
    const f = Math.max(20, rpm / 30);
    this.o1.frequency.setTargetAtTime(f, now, 0.03);
    this.o2.frequency.setTargetAtTime(f / 2, now, 0.03);
    this.filter.frequency.setTargetAtTime(400 + S.thr * 1800 + rpm * 0.15, now, 0.05);
    const vol = live && S.running ? 0.05 + S.thr * 0.09 + (rpm / LIMIT) * 0.05 : 0;
    this.engGain.gain.setTargetAtTime(vol, now, 0.05);
  },
  blip(freq, dur, type = 'square', vol = 0.15) {
    if (!this.ctx || muted) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g).connect(this.master);
    o.start();
    o.stop(ctx.currentTime + dur);
  },
  grind() {
    if (!this.ctx || muted) return;
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * 0.35);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) * (i % 90 < 45 ? 1 : 0.3);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2200;
    const g = ctx.createGain();
    g.gain.value = 0.5;
    src.connect(bp).connect(g).connect(this.master);
    src.start();
  },
  setMuted(m) {
    if (this.master) this.master.gain.value = m ? 0 : 0.5;
  },
};

const buzz = (p) => {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(p);
    } catch {
      /* ignore */
    }
  }
};

/* ---------- Toasts & hints ---------- */
const toastEl = $('toast');
let toastTimer = 0;
function toast(text, kind = '', ms = 1100) {
  toastEl.textContent = text;
  toastEl.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastEl.className = 'toast'), ms);
}
const hintEl = $('gearHint');
const HINT_DEFAULT = 'Drag or tap a gear. Press the clutch first.';
let hintTimer = 0;
function hint(text, bad = false) {
  hintEl.textContent = text;
  hintEl.classList.toggle('bad', bad);
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => {
    hintEl.textContent = HINT_DEFAULT;
    hintEl.classList.remove('bad');
  }, 1800);
}

/* ---------- Gear changes ---------- */
function setGear(g) {
  if (S.gear === g) return;
  S.gear = g;
  S.moneyArmed = true;
  const dial = $('gearDial');
  dial.classList.remove('pop');
  void dial.offsetWidth;
  dial.classList.add('pop');
  audio.blip(g === 'N' ? 220 : 140, 0.06, 'triangle', 0.12);

  // Grade the up-shift
  if (S.phase === 'race' && S.pending && isNumGear(g) && +g === S.pending.from + 1) {
    const r = S.pending.rpm;
    if (r >= 5600 && r <= LIMIT + 50) {
      S.perfect++;
      S.flame = 0.45;
      toast('Perfect shift!', 'good');
      buzz(20);
    } else if (r < 4200) {
      toast('Early shift', 'warn', 800);
    } else {
      toast('Good shift', '', 700);
    }
    S.pending = null;
  }
}

function grind(msg) {
  hint(msg, true);
  knobEl.classList.remove('shake');
  void knobEl.offsetWidth;
  knobEl.classList.add('shake');
  const now = performance.now() / 1000;
  if (now - S.lastGrind > 0.5) {
    S.lastGrind = now;
    audio.grind();
    buzz([30, 30, 30]);
    toast('Grind!', 'bad', 700);
    if (S.phase === 'race' || S.phase === 'countdown') {
      S.grinds++;
      S.dmg = Math.min(100, S.dmg + 4);
      S.shake = 0.5;
    }
  }
}

/** Try to put the gearbox into gear g. Returns false (and grinds) if not allowed. */
function tryEngage(g) {
  if (g === S.gear || g === 'N') return true;
  if (S.phase === 'menu' || S.phase === 'done') {
    setGear(g);
    return true;
  }
  if (g === 'R' && S.v > 1.2) {
    grind('Stop before selecting reverse!');
    return false;
  }
  if (S.running && S.clutch < 0.7) {
    grind('Press the clutch before shifting!');
    return false;
  }
  setGear(g);
  return true;
}

/* ---------- H-pattern knob ---------- */
const plate = $('plate');
const knobEl = $('knob');
const COLS = [0.25, 0.5, 0.75];
const TOPY = 0.17;
const BOTY = 0.83;
const MIDY = 0.5;
const GEAR_POS = {
  1: [0, TOPY],
  2: [0, BOTY],
  3: [1, TOPY],
  4: [1, BOTY],
  5: [2, TOPY],
  R: [2, BOTY],
};
const knob = { x: 0.5, y: 0.5, drag: null };

function placeKnob(anim) {
  knobEl.classList.toggle('anim', anim);
  knobEl.style.left = `${knob.x * 100}%`;
  knobEl.style.top = `${knob.y * 100}%`;
}

function gearAt(x, y) {
  const ci = COLS.findIndex((c) => Math.abs(x - c) < 0.02);
  if (ci < 0) return 'N';
  if (y <= TOPY + 0.07) return ['1', '3', '5'][ci];
  if (y >= BOTY - 0.07) return ['2', '4', 'R'][ci];
  return 'N';
}

function plateCoords(e) {
  const r = plate.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, w: r.width, h: r.height };
}

function moveKnobToward(px, py) {
  const ci = COLS.reduce((best, c, i) => (Math.abs(px - c) < Math.abs(px - COLS[best]) ? i : best), 0);
  const onMid = Math.abs(knob.y - MIDY) < 0.035;
  if (onMid) {
    const wantVert = Math.abs(py - MIDY) > 0.06 && Math.abs(px - COLS[ci]) < 0.12;
    if (wantVert) {
      knob.x = COLS[ci];
      knob.y = clamp(py, TOPY, BOTY);
    } else {
      knob.x = clamp(px, COLS[0], COLS[2]);
      knob.y = MIDY;
    }
  } else {
    const ny = clamp(py, TOPY, BOTY);
    // Snap through the middle gate so we can move sideways next
    knob.y = (knob.y - MIDY) * (ny - MIDY) <= 0 ? MIDY : ny;
  }

  const g = gearAt(knob.x, knob.y);
  if (g !== 'N') {
    if (g !== S.gear && !tryEngage(g)) {
      knob.y = knob.y < MIDY ? TOPY + 0.12 : BOTY - 0.12; // blocked at the synchro
    }
  } else if (S.gear !== 'N') {
    setGear('N');
  }
  placeKnob(false);
}

function settleKnob() {
  if (S.gear === 'N') {
    knob.x = 0.5;
    knob.y = MIDY;
  } else {
    const [ci, y] = GEAR_POS[S.gear];
    knob.x = COLS[ci];
    knob.y = y;
  }
  placeKnob(true);
}

/** Tap / keyboard shift: go straight to a gear. */
function requestGear(g) {
  if (g === 'N') {
    setGear('N');
  } else if (!tryEngage(g)) {
    return;
  }
  settleKnob();
}

plate.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  audio.init();
  const p = plateCoords(e);
  const kdx = (p.x - knob.x) * p.w;
  const kdy = (p.y - knob.y) * p.h;
  const onKnob = Math.hypot(kdx, kdy) < knobEl.offsetWidth * 0.75;
  plate.setPointerCapture(e.pointerId);
  knob.drag = { id: e.pointerId, mode: onKnob ? 'drag' : 'tap', ox: p.x - knob.x, oy: p.y - knob.y };
  if (onKnob) knobEl.classList.add('grab');
});

plate.addEventListener('pointermove', (e) => {
  const d = knob.drag;
  if (!d || d.id !== e.pointerId || d.mode !== 'drag') return;
  const p = plateCoords(e);
  moveKnobToward(p.x - d.ox, p.y - d.oy);
});

function endPlatePointer(e) {
  const d = knob.drag;
  if (!d || d.id !== e.pointerId) return;
  knob.drag = null;
  knobEl.classList.remove('grab');
  if (d.mode === 'tap' && e.type === 'pointerup') {
    const p = plateCoords(e);
    let best = 'N';
    let bestD = Math.hypot((p.x - 0.5) * p.w, (p.y - MIDY) * p.h);
    for (const [g, [ci, y]] of Object.entries(GEAR_POS)) {
      const dd = Math.hypot((p.x - COLS[ci]) * p.w, (p.y - y) * p.h);
      if (dd < bestD) {
        bestD = dd;
        best = g;
      }
    }
    requestGear(best);
    return;
  }
  settleKnob();
}
plate.addEventListener('pointerup', endPlatePointer);
plate.addEventListener('pointercancel', endPlatePointer);

/* ---------- Pedals ---------- */
function bindPedal(el, key) {
  const down = (e) => {
    e.preventDefault();
    audio.init();
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    el._pid = e.pointerId;
    input[key] = true;
    el.classList.add('down');
  };
  const up = (e) => {
    if (el._pid !== undefined && e.pointerId !== el._pid) return;
    el._pid = undefined;
    input[key] = false;
    el.classList.remove('down');
  };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('lostpointercapture', up);
}
const clutchEl = $('pedalClutch');
const gasEl = $('pedalGas');
bindPedal(clutchEl, 'clutch');
bindPedal(gasEl, 'gas');
document.addEventListener('contextmenu', (e) => e.preventDefault());

/* ---------- Keyboard (desktop) ---------- */
const KEY_GEARS = { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', r: 'R', n: 'N', 0: 'N' };
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const k = e.key.toLowerCase();
  if (k === ' ' || k === 'shift' || k === 'c') {
    input.clutch = true;
    clutchEl.classList.add('down');
  } else if (k === 'arrowup' || k === 'w') {
    input.gas = true;
    gasEl.classList.add('down');
  } else if (KEY_GEARS[k]) {
    requestGear(KEY_GEARS[k]);
  } else if (k === 'enter' && !$('menu').hidden) {
    startRace();
  } else return;
  audio.init();
  e.preventDefault();
});
window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (k === ' ' || k === 'shift' || k === 'c') {
    input.clutch = false;
    clutchEl.classList.remove('down');
  } else if (k === 'arrowup' || k === 'w') {
    input.gas = false;
    gasEl.classList.remove('down');
  }
});
window.addEventListener('blur', () => {
  input.clutch = input.gas = false;
  clutchEl.classList.remove('down');
  gasEl.classList.remove('down');
});

/* ---------- Physics ---------- */
function stall(msg) {
  S.running = false;
  S.crank = 0;
  S.stalls++;
  toast(msg || 'Stalled!', 'bad', 1400);
  hint('Stalled — press the clutch to restart.', true);
  audio.blip(70, 0.4, 'sawtooth', 0.2);
  buzz(120);
  S.shake = 0.6;
}

function update(dt) {
  if (S.phase !== 'countdown' && S.phase !== 'race' && S.phase !== 'done') return;

  // Timers / phase
  if (S.phase === 'countdown') {
    S.countdown -= dt;
    updateLights();
    if (S.countdown <= 0) {
      S.phase = 'race';
      S.t = 0;
      toast('GO!', 'good', 700);
      audio.blip(880, 0.35, 'square', 0.12);
      setTimeout(() => ($('lights').hidden = true), 600);
    }
  } else if (S.phase === 'race') {
    S.t += dt;
    S.rivalDist = rivalDistAt(RIVALS[difficulty], S.t);
  }

  // Inputs (pedals move smoothly, not instantly)
  const done = S.phase === 'done';
  S.clutch += clamp((input.clutch && !done ? 1 : 0) - S.clutch, -dt * 3.2, dt * 10);
  S.thr += clamp((input.gas && !done ? 1 : 0) - S.thr, -dt * 7, dt * 5);

  if (S.clutch > 0.6 && !S.clutchIn) {
    S.clutchIn = true;
    S.moneyArmed = true;
    if (isNumGear(S.gear) && S.running) S.pending = { rpm: S.rpm, from: +S.gear };
  } else if (S.clutch < 0.2 && S.clutchIn) {
    S.clutchIn = false;
  }

  // Engine restart after a stall
  if (!S.running) {
    S.rpm = Math.max(0, S.rpm - dt * 3000);
    if (S.clutch > 0.7 || S.gear === 'N') {
      S.crank += dt;
      if (S.crank > 0.7) {
        S.running = true;
        S.rpm = IDLE + 400;
        toast('Engine on', '', 700);
        audio.blip(110, 0.25, 'sawtooth', 0.15);
      }
    } else S.crank = 0;
  }

  const ratio = RATIOS[S.gear];
  const e = ratio === 0 ? 0 : smooth(0.15, 0.72, 1 - S.clutch); // clutch engagement
  const wheelRpm = Math.abs(S.v * ratio * K_RPM);
  const dir = Math.sign(ratio);
  let force = 0;
  const held = S.phase === 'countdown'; // handbrake on until GO

  if (S.running) {
    // Engine torque (normalised, 1 = peak). Idle control keeps it alive near idle.
    let te = S.thr * torque(S.rpm) - (1 - S.thr) * 0.2;
    if (S.rpm >= LIMIT) te = Math.min(te, 0) - 0.05; // rev limiter cuts fuel
    te += clamp((IDLE - S.rpm) / 300, 0, 1) * 0.45;

    const slipRpm = S.rpm - wheelRpm;
    if (!held && e >= 0.97 && Math.abs(slipRpm) < 150) {
      // Clutch locked: engine speed is tied to the wheels
      S.rpm = wheelRpm;
      force = te * Math.abs(ratio) * FORCE * dir;
    } else {
      // Clutch slipping (or open): it passes torque until the speeds match
      const tc = e * CLUTCH_CAP * clamp(slipRpm / 250, -1, 1);
      S.rpm = Math.max(0, S.rpm + (te - tc) * ENGINE_ACCEL * dt);
      force = tc * Math.abs(ratio) * FORCE * dir;
    }

    // Rev limiter bounce
    if (S.rpm > LIMIT) {
      S.rpm = LIMIT - Math.random() * 220;
      S.limiterT += dt;
    } else S.limiterT = Math.max(0, S.limiterT - dt);
    if (S.limiterT > 0.6 && S.phase !== 'done') S.dmg = Math.min(100, S.dmg + dt * 7);

    // Money shift: dropping into a gear that is far too low
    if (e > 0.35 && S.moneyArmed && wheelRpm > LIMIT + 1300) {
      S.moneyArmed = false;
      S.dmg = Math.min(100, S.dmg + 35);
      S.shake = 1;
      toast('Over-rev! Engine damage', 'bad', 1400);
      buzz([60, 40, 60]);
      audio.grind();
    }

    // Stall: engine dragged below idle by the wheels
    if (e > 0.3 && S.rpm < STALL_RPM && S.phase !== 'done') {
      stall(held ? 'Stalled — wait for GO!' : 'Stalled!');
    }
  } else if (e > 0.5 && Math.abs(S.v) > 0.1) {
    force = -Math.sign(S.v) * 1.2 * e; // dead engine acts as a brake
  }

  if (held) {
    S.v = 0;
  } else {
    const drag = 0.00036 * S.v * Math.abs(S.v) + (Math.abs(S.v) > 0.05 ? 0.12 * Math.sign(S.v) : 0);
    const brake = S.phase === 'done' ? Math.sign(S.v) * 4 : 0;
    S.v += (force - drag - brake) * dt;
    if (Math.abs(S.v) < 0.05 && Math.abs(force) < 0.13) S.v = 0;
    S.dist = Math.max(-20, S.dist + S.v * dt);
  }
  S.topV = Math.max(S.topV, S.v);
  S.shake = Math.max(0, S.shake - dt * 2);
  S.flame = Math.max(0, S.flame - dt);

  // End conditions
  if (S.phase === 'race') {
    if (S.dist >= RACE_LEN) finishRace(false);
    else if (S.dmg >= 100) finishRace(true, 'Engine blown!');
    else if (S.t > 120) finishRace(true, 'Out of time');
  }
}

/* ---------- Race flow ---------- */
function updateLights() {
  const lamps = $('lights').children;
  const c = S.countdown;
  for (let i = 0; i < 3; i++) {
    lamps[i].className = c <= 0 ? 'green' : c < 3 - i ? 'red' : '';
  }
}

let lastBeep = 4;
function startRace() {
  audio.init();
  $('menu').hidden = true;
  $('result').hidden = true;
  resetState();
  settleKnob();
  $('lights').hidden = false;
  updateLights();
  lastBeep = 4;
  hint('Clutch in, select 1st, hold gas — release at GO!');
}

function finishRace(dnf, reason) {
  S.phase = 'done';
  S.finishT = S.t;
  const rivalT = rivalFinishTime(RIVALS[difficulty]);
  const win = !dnf && S.t < rivalT;
  const key = `gc.best.${difficulty}`;
  const best = store.get(key, null);
  let newBest = false;
  if (!dnf && (best === null || S.t < best)) {
    store.set(key, S.t);
    newBest = true;
  }

  setTimeout(() => {
    $('resEyebrow').textContent = dnf ? 'Did not finish' : `${RACE_LEN} m · ${difficulty}`;
    const title = $('resTitle');
    title.textContent = dnf ? reason : win ? 'You win!' : 'Rival wins';
    title.className = `sheet-title ${win ? 'win' : 'lose'}`;
    $('resTime').textContent = dnf ? '—' : `${S.t.toFixed(2)} s`;
    $('resRival').textContent = `${rivalT.toFixed(2)} s`;
    $('resTop').textContent = `${Math.round(S.topV * 3.6)} km/h`;
    $('resPerfect').textContent = S.perfect;
    $('resGrinds').textContent = S.grinds;
    $('resStalls').textContent = S.stalls;
    const b = store.get(key, null);
    $('resBest').innerHTML = newBest
      ? '<b>New best time!</b>'
      : b !== null
        ? `Best: <b>${b.toFixed(2)} s</b>`
        : '';
    $('result').hidden = false;
  }, 900);
  buzz(win ? [40, 60, 40] : 200);
}

/* ---------- Menu ---------- */
const seg = $('diffSeg');
function renderMenu() {
  for (const b of seg.children) b.setAttribute('aria-checked', String(b.dataset.d === difficulty));
  const best = store.get(`gc.best.${difficulty}`, null);
  const rivalT = rivalFinishTime(RIVALS[difficulty]).toFixed(2);
  $('bestLine').innerHTML =
    `Rival time: <b>${rivalT} s</b> · Your best: ` + (best === null ? '—' : `<b>${best.toFixed(2)} s</b>`);
}
seg.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  difficulty = b.dataset.d;
  store.set('gc.diff', difficulty);
  renderMenu();
});
$('btnStart').addEventListener('click', startRace);
$('btnRetry').addEventListener('click', startRace);
$('btnMenu').addEventListener('click', () => {
  $('result').hidden = true;
  S.phase = 'menu';
  renderMenu();
  $('menu').hidden = false;
});
$('btnMute').addEventListener('click', () => {
  muted = !muted;
  store.set('gc.muted', muted);
  audio.init();
  audio.setMuted(muted);
  renderMute();
});
function renderMute() {
  $('muteWaves').style.display = muted ? 'none' : '';
  $('muteCross').style.display = muted ? '' : 'none';
}

/* ---------- HUD ---------- */
const hud = {
  time: $('hudTime'),
  dist: $('hudDist'),
  dmg: $('hudDmg'),
  speed: $('hudSpeed'),
  rpm: $('hudRpm'),
  tacho: $('tachoFill'),
  shift: $('shiftLight'),
  dial: $('dialGear'),
  dialBox: $('gearDial'),
  you: $('mkYou'),
  rival: $('mkRival'),
  chipClutch: $('chipClutch'),
  chipDrive: $('chipDrive'),
  clutchPct: $('clutchPct'),
  gasPct: $('gasPct'),
};
const labels = [...document.querySelectorAll('.lbl')];
let lastGear = null;

function renderHud() {
  const rpm = S.rpm || 0;
  const t = S.phase === 'race' ? S.t : S.phase === 'done' ? S.finishT : 0;
  hud.time.textContent = t.toFixed(2);
  hud.dist.textContent = `${Math.max(0, Math.round(S.dist || 0))} m`;
  hud.dmg.style.width = `${S.dmg || 0}%`;
  hud.speed.textContent = Math.round(Math.abs(S.v || 0) * 3.6);
  hud.rpm.textContent = S.running === false ? 'Stalled' : `${Math.round(rpm / 10) * 10} rpm`;
  const frac = clamp(rpm / 8000, 0.001, 1);
  hud.tacho.style.width = `${frac * 100}%`;
  hud.tacho.style.backgroundSize = `${100 / frac}% 100%`;
  const canUp = isNumGear(S.gear) && S.gear !== '5';
  hud.shift.className = `shift-light${canUp && rpm > 6500 ? ' flash' : canUp && rpm > SHIFT_RPM - 300 ? ' on' : ''}`;

  hud.you.style.left = `${clamp((S.dist || 0) / RACE_LEN, 0, 1) * 100}%`;
  hud.rival.style.left = `${clamp((S.rivalDist || 0) / RACE_LEN, 0, 1) * 100}%`;

  const c = S.clutch || 0;
  hud.chipClutch.textContent = c > 0.72 ? 'Pressed' : c > 0.15 ? 'Biting' : 'Released';
  hud.chipClutch.className = c > 0.15 ? 'hot' : '';
  hud.clutchPct.textContent = `${Math.round(c * 100)}% down`;
  hud.gasPct.textContent = `${Math.round((S.thr || 0) * 100)}%`;
  clutchEl.style.setProperty('--p', c.toFixed(3));
  gasEl.style.setProperty('--p', (S.thr || 0).toFixed(3));

  if (S.gear !== lastGear) {
    lastGear = S.gear;
    hud.dial.textContent = S.gear;
    hud.dialBox.classList.toggle('rev', S.gear === 'R');
    hud.chipDrive.textContent = GEAR_NAMES[S.gear];
    hud.chipDrive.className = S.gear === 'N' ? 'muted' : S.gear === 'R' ? 'hot' : '';
    for (const l of labels) l.classList.toggle('active', l.dataset.g === S.gear);
  }
}

/* ---------- Road renderer ---------- */
const cv = $('road');
const ctx = cv.getContext('2d');
let W = 0;
let H = 0;
let DPR = 1;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = cv.clientWidth;
  H = cv.clientHeight;
  cv.width = Math.round(W * DPR);
  cv.height = Math.round(H * DPR);
}
window.addEventListener('resize', resize);

// Skyline (generated once)
const skyline = Array.from({ length: 40 }, (_, i) => ({
  x: i * 0.045 + Math.random() * 0.02,
  w: 0.025 + Math.random() * 0.04,
  h: 0.04 + Math.random() * 0.14,
  lit: Array.from({ length: 6 }, () => Math.random() < 0.35),
}));

const CAMH = 2.3;
const ZNEAR = 3.2;
const CAR_Z = 7.5; // camera sits this far behind the player's car
const ROAD_HALF = 4.6;
const LANE = 2.0;
const CAM_X = -1.1;

function drawCar(x, y, s, body, isPlayer) {
  const w = 1.8 * s;
  const h = 1.25 * s;
  ctx.save();
  ctx.translate(x, y);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.6, h * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  // tyres
  ctx.fillStyle = '#050506';
  ctx.fillRect(-w * 0.48, -h * 0.28, w * 0.18, h * 0.28);
  ctx.fillRect(w * 0.3, -h * 0.28, w * 0.18, h * 0.28);
  // body
  const g = ctx.createLinearGradient(0, -h * 0.75, 0, 0);
  g.addColorStop(0, body[0]);
  g.addColorStop(1, body[1]);
  ctx.fillStyle = g;
  roundRect(-w / 2, -h * 0.72, w, h * 0.5, h * 0.12);
  ctx.fill();
  // cabin
  ctx.fillStyle = body[1];
  ctx.beginPath();
  ctx.moveTo(-w * 0.38, -h * 0.7);
  ctx.lineTo(-w * 0.28, -h);
  ctx.lineTo(w * 0.28, -h);
  ctx.lineTo(w * 0.38, -h * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(20,30,45,0.95)';
  ctx.beginPath();
  ctx.moveTo(-w * 0.33, -h * 0.72);
  ctx.lineTo(-w * 0.25, -h * 0.95);
  ctx.lineTo(w * 0.25, -h * 0.95);
  ctx.lineTo(w * 0.33, -h * 0.72);
  ctx.closePath();
  ctx.fill();
  // tail lights
  ctx.shadowColor = '#ff2a2a';
  ctx.shadowBlur = s * 0.4;
  ctx.fillStyle = '#ff3b3b';
  roundRect(-w * 0.46, -h * 0.6, w * 0.22, h * 0.09, 2);
  ctx.fill();
  roundRect(w * 0.24, -h * 0.6, w * 0.22, h * 0.09, 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // plate
  ctx.fillStyle = '#d9dbe0';
  ctx.fillRect(-w * 0.12, -h * 0.45, w * 0.24, h * 0.1);
  // exhaust flame
  if (isPlayer && S.flame > 0) {
    const fl = S.flame / 0.45;
    ctx.fillStyle = `rgba(255,${120 + Math.random() * 80},40,${0.85 * fl})`;
    ctx.beginPath();
    ctx.ellipse(w * 0.3, -h * 0.2, w * 0.06 * fl, h * 0.14 * fl + Math.random() * 3, Math.PI / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function draw() {
  if (!W || !H) resize();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const v = Math.abs(S.v || 0);
  const shake = (S.shake || 0) * 7 + (S.running ? Math.min(v / 60, 1) * 1.2 : 0);
  const sx = (Math.random() - 0.5) * shake;
  const sy = (Math.random() - 0.5) * shake;
  ctx.translate(sx, sy);

  const hz = H * 0.4;
  const F = ((H - hz) * ZNEAR) / CAMH;
  const cx = W / 2;
  const dist = S.dist || 0;
  const camPos = dist - CAR_Z;
  const sxOf = (X, z) => cx + ((X - CAM_X) * F) / z;
  const syOf = (z, hgt = 0) => hz + ((CAMH - hgt) * F) / z;

  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, '#07080b');
  sky.addColorStop(1, '#1a1612');
  ctx.fillStyle = sky;
  ctx.fillRect(-10, -10, W + 20, hz + 10);
  const glow = ctx.createRadialGradient(cx, hz, 0, cx, hz, W * 0.7);
  glow.addColorStop(0, 'rgba(255,122,26,0.22)');
  glow.addColorStop(1, 'rgba(255,122,26,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-10, 0, W + 20, hz);

  // skyline with slow parallax
  const par = ((dist * 0.0004) % 1.8) - 0.4;
  for (const b of skyline) {
    let bx = (b.x - par) % 1.8;
    if (bx < -0.1) bx += 1.8;
    const x = bx * W;
    const bw = b.w * W;
    const bh = b.h * H;
    ctx.fillStyle = '#121318';
    ctx.fillRect(x, hz - bh, bw, bh);
    ctx.fillStyle = 'rgba(255,190,110,0.5)';
    b.lit.forEach((on, i) => {
      if (on) ctx.fillRect(x + bw * 0.3, hz - bh + 6 + i * bh * 0.14, 2, 2);
    });
  }

  // ground
  ctx.fillStyle = '#0d0e10';
  ctx.fillRect(-10, hz, W + 20, H - hz + 10);

  // road surface
  const zFar = 600;
  ctx.fillStyle = '#1f2125';
  ctx.beginPath();
  ctx.moveTo(sxOf(-ROAD_HALF, ZNEAR * 0.6), syOf(ZNEAR * 0.6));
  ctx.lineTo(sxOf(-ROAD_HALF, zFar), syOf(zFar));
  ctx.lineTo(sxOf(ROAD_HALF, zFar), syOf(zFar));
  ctx.lineTo(sxOf(ROAD_HALF, ZNEAR * 0.6), syOf(ZNEAR * 0.6));
  ctx.fill();

  const quad = (x1, x2, z1, z2, color) => {
    if (z2 < ZNEAR * 0.6) return;
    z1 = Math.max(z1, ZNEAR * 0.6);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(sxOf(x1, z1), syOf(z1));
    ctx.lineTo(sxOf(x1, z2), syOf(z2));
    ctx.lineTo(sxOf(x2, z2), syOf(z2));
    ctx.lineTo(sxOf(x2, z1), syOf(z1));
    ctx.fill();
  };

  // rumble strips + centre dashes
  const seg = 4;
  const off = ((camPos % (seg * 2)) + seg * 2) % (seg * 2);
  for (let i = 0; i < 80; i++) {
    const z1 = i * seg - off;
    const z2 = z1 + seg;
    if (z2 < ZNEAR * 0.6) continue;
    const odd = (i + Math.floor(camPos / seg)) % 2 === 0;
    const rc = odd ? '#c9ccd2' : '#ff7a1a';
    quad(-ROAD_HALF - 0.45, -ROAD_HALF, z1, z2, rc);
    quad(ROAD_HALF, ROAD_HALF + 0.45, z1, z2, rc);
    if (odd) quad(-0.08, 0.08, z1, z2, 'rgba(236,237,240,0.75)');
  }

  // start & finish lines
  const checker = (pos) => {
    const z1 = pos - camPos;
    if (z1 < ZNEAR * 0.6 || z1 > zFar) return;
    const cols = 12;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < cols; c++) {
        const x1 = -ROAD_HALF + (c * 2 * ROAD_HALF) / cols;
        quad(x1, x1 + (2 * ROAD_HALF) / cols, z1 + r * 0.8, z1 + (r + 1) * 0.8, (r + c) % 2 ? '#111' : '#eee');
      }
    }
  };
  checker(0);
  checker(RACE_LEN);

  // lamp posts every 40 m (far to near)
  const lampGap = 40;
  const firstLamp = Math.ceil((camPos + ZNEAR) / lampGap) * lampGap;
  for (let p = firstLamp + lampGap * 12; p >= firstLamp; p -= lampGap) {
    const z = p - camPos;
    if (z <= ZNEAR) continue;
    for (const side of [-1, 1]) {
      const X = side * (ROAD_HALF + 2.2);
      const x = sxOf(X, z);
      const yb = syOf(z);
      const yt = syOf(z, 7);
      ctx.strokeStyle = '#2c2e33';
      ctx.lineWidth = Math.max(1, (0.18 * F) / z);
      ctx.beginPath();
      ctx.moveTo(x, yb);
      ctx.lineTo(x, yt);
      ctx.lineTo(sxOf(X - side * 1.6, z), yt);
      ctx.stroke();
      const r = Math.max(2, (1.6 * F) / z);
      const lg = ctx.createRadialGradient(sxOf(X - side * 1.6, z), yt, 0, sxOf(X - side * 1.6, z), yt, r);
      lg.addColorStop(0, 'rgba(255,200,130,0.95)');
      lg.addColorStop(1, 'rgba(255,140,40,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(sxOf(X - side * 1.6, z) - r, yt - r, r * 2, r * 2);
    }
  }

  // finish banner
  const fz = RACE_LEN - camPos;
  if (fz > ZNEAR && fz < zFar) {
    const x1 = sxOf(-ROAD_HALF - 0.6, fz);
    const x2 = sxOf(ROAD_HALF + 0.6, fz);
    const yTop = syOf(fz, 6.5);
    const yBot = syOf(fz, 5.4);
    ctx.fillStyle = '#ff7a1a';
    ctx.fillRect(x1, yTop, x2 - x1, yBot - yTop);
    ctx.fillStyle = '#1b0f05';
    ctx.font = `700 ${Math.max(6, (yBot - yTop) * 0.75)}px Rajdhani, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FINISH', (x1 + x2) / 2, (yTop + yBot) / 2);
    ctx.fillStyle = '#2c2e33';
    ctx.fillRect(x1, yTop, Math.max(1, (0.2 * F) / fz), syOf(fz) - yTop);
    ctx.fillRect(x2, yTop, Math.max(1, (0.2 * F) / fz), syOf(fz) - yTop);
  }

  // cars, far to near
  const cars = [
    { z: (S.rivalDist || 0) - camPos, X: LANE, body: ['#4e86e8', '#1c3566'], me: false },
    { z: CAR_Z, X: -LANE, body: ['#ff8a33', '#7a3008'], me: true },
  ].sort((a, b) => b.z - a.z);
  for (const c of cars) {
    if (c.z < ZNEAR * 0.8 || c.z > zFar) continue;
    drawCar(sxOf(c.X, c.z), syOf(c.z), F / c.z, c.body, c.me);
  }

  // speed streaks
  if (v > 22) {
    const a = Math.min(0.35, (v - 22) / 80);
    ctx.strokeStyle = `rgba(255,255,255,${a})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const side = i % 2 ? 1 : -1;
      const x = cx + side * (W * 0.3 + Math.random() * W * 0.25);
      const y = hz + Math.random() * (H - hz);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + side * 18, y + 14);
      ctx.stroke();
    }
  }
}

/* ---------- Main loop ---------- */
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  // fixed sub-steps for stable physics
  const steps = Math.ceil(dt / 0.008);
  for (let i = 0; i < steps; i++) update(dt / steps);

  if (S.phase === 'countdown') {
    const n = Math.ceil(S.countdown);
    if (n < lastBeep && n >= 1 && n <= 3) audio.blip(440, 0.18, 'square', 0.1);
    lastBeep = n;
  }

  audio.update();
  renderHud();
  draw();
  requestAnimationFrame(frame);
}

/* ---------- Boot ---------- */
Object.assign(S, { gear: 'N', rpm: 0, v: 0, dist: 0, clutch: 0, thr: 0, running: true, dmg: 0 });
renderMenu();
renderMute();
settleKnob();
resize();
requestAnimationFrame(frame);

// Small debug/test hook
window.GearGame = { S, input, update, requestGear, startRace, RIVALS, rivalFinishTime };
