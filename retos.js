'use strict';
/* =========================================================
   Retos de repeticiones (abdominales, sentadillas, flexiones, dominadas y 4 con mancuernas)
   - Programa: 3 etapas por rango; el último día de cada etapa es una prueba.
   - Rangos: 0–meta, meta–2×meta, … (se elige al empezar).
   - Conteo: sensores de movimiento del móvil o tocando la pantalla.
   ========================================================= */
const RETOS = {
  situps: { n: 'Abdominales', one: 'abdominal', ex: 'sit_ups', goal: 100, tests: [20, 60, 100], rep: 'ab',
    modes: { original: 'Móvil sobre el pecho (sensor)', toque: 'Tocando la pantalla' }, mode: 'original',
    how: { original: 'Túmbate con las rodillas flexionadas y sujeta el móvil plano contra el pecho, con la pantalla hacia arriba (puede ir atravesado o a lo largo). La app mide cuánto se inclina la pantalla: cuenta una cada vez que te incorporas y vuelves a bajar.', toque: 'Toca la pantalla en cada repetición.' } },
  squats: { n: 'Sentadillas', one: 'sentadilla', ex: 'squats', goal: 150, tests: [20, 100, 150], rep: 'sq',
    modes: { original: 'Móvil en la mano o en el bolsillo (sensor)', muslo: 'Móvil en el bolsillo del pantalón, por el ángulo del muslo (sensor)', toque: 'Tocando la pantalla' }, mode: 'original',
    how: { original: 'Sujeta el móvil contra el pecho o guárdalo en un bolsillo. Detecta la bajada y la frenada abajo: cuenta al llegar abajo.', muslo: 'Móvil en el bolsillo delantero del pantalón, vertical. Cuenta al volver a subir, cuando el muslo pasa de horizontal a vertical.', toque: 'Toca la pantalla en cada repetición.' } },
  pushups: { n: 'Flexiones', one: 'flexión', ex: 'push_ups', goal: 100, tests: [20, 50, 100], rep: 'pu',
    modes: { toque: 'Tocando la pantalla con la nariz o la barbilla' }, mode: 'toque',
    how: { toque: 'Deja el móvil en el suelo bajo tu cara y tócalo con la nariz o la barbilla en cada bajada.' } },
  pullups: { n: 'Dominadas', one: 'dominada', ex: 'pull_ups', goal: 30, tests: [10, 20, 30], rep: 'dm',
    modes: { original: 'Móvil en el bolsillo (sensor)', toque: 'Tocando la pantalla al bajar' }, mode: 'original',
    how: { original: 'Guarda el móvil en un bolsillo ajustado o en una banda de brazo. Detecta la bajada y la frenada abajo: cuenta al terminar cada dominada.', toque: 'Deja el móvil cerca y tócalo al bajar de cada dominada.' } },
};
// retos con mancuernas: con las manos ocupadas se cuenta al ritmo de la app o con el móvil en el brazo
const DB_MODES = (where, extra) => ({
  modes: { ritmo: 'Al ritmo de la app (cuenta sola)', brazo: `Móvil ${where} (sensor)`, toque: 'Tocando la pantalla' }, mode: 'ritmo',
  how: { ritmo: 'Deja el móvil a la vista: suena un pitido por repetición y cuenta sola. Sube con el pitido y baja controlando. Si no llegas, toca «Serie hecha» y corrige con «−1».',
    brazo: `Sujeta el móvil ${where} con un brazalete o una banda. Cuenta cada vez que vuelves a la posición inicial.${extra || ''}`,
    toque: 'Toca la pantalla al terminar cada repetición (con el codo o los nudillos, sin soltar la mancuerna).' } });
Object.assign(RETOS, {
  dbtriceps: { n: 'Extensión de tríceps', one: 'extensión', ex: 'db_triceps_ext', goal: 50, tests: [15, 30, 50], rep: 'db', db: 1, tilt: 60, ...DB_MODES('en el antebrazo') },
  dblateral: { n: 'Elevación lateral', one: 'elevación', ex: 'db_lateral_raise', goal: 50, tests: [15, 30, 50], rep: 'db', db: 1, tilt: 50, ...DB_MODES('en la parte alta del brazo', ' Sube hasta la altura del hombro.') },
  dbpress: { n: 'Press de hombros', one: 'press', ex: 'db_shoulder_press', goal: 50, tests: [15, 30, 50], rep: 'db', db: 1, tilt: 45, ...DB_MODES('en la parte alta del brazo') },
  dbhammer: { n: 'Curl martillo', one: 'curl', ex: 'db_hammer_curl', goal: 50, tests: [15, 30, 50], rep: 'db', db: 1, tilt: 60, ...DB_MODES('en el antebrazo') },
});
// programa: el de flexiones escalado a pruebas de 15, 30 y 50 (mismas etapas, descansos y días libres entre sesiones)
['dbtriceps', 'dblateral', 'dbpress', 'dbhammer'].forEach(key => {
  RETOS_DATA[key] = RETOS_DATA.pushups.map((st, si) => st.map(([sets, pauses, next]) => [sets.map(v => Math.max(3, Math.round(v * [0.75, 0.6, 0.5][si]))), pauses, next]));
});
const TEMPOS = [2, 3, 4];
const RANGES = 10;
const getRetos = () => PS.get('retos', {}) || {};
const setRetos = v => PS.set('retos', v);
// arreglo de los retos ya empezados: antes el siguiente día se ponía sin el día de descanso
function migrateRetos() {
  if (!PROFILE) return;
  const all = getRetos(); let ch = false;
  for (const [key, s] of Object.entries(all)) {
    if (!s || s.v >= 2) continue;
    s.v = 2; ch = true;
    const last = (s.log || []).filter(l => !l.partial && !l.test).slice(-1)[0];
    if (!last || !RETOS_DATA[key]) continue;
    const d = retoDays(key, last.k, last.stage)[last.day]; if (!d) continue;
    const want = addDays(last.at, d.gap);
    if ((s.nextAt || 0) < want) s.nextAt = want;
  }
  if (ch) setRetos(all);
}
const rangeLbl = (key, k) => `${k * RETOS[key].goal}–${(k + 1) * RETOS[key].goal}`;
// días de una etapa en un rango: el rango 0 es el programa base; los demás se escalan
// para que cada prueba sea (inicio del rango + prueba base)
function retoDays(key, k, stage) {
  const R = RETOS[key], src = RETOS_DATA[key][stage - 1], t = R.tests[stage - 1];
  const f = (k * R.goal + t) / t;
  return src.map(([sets, pauses, next], i) => {
    const test = i === src.length - 1;
    return { sets: test ? [k * R.goal + t] : sets.map(v => Math.max(1, Math.round(v * f))), pauses, next, gap: next + 1, test };
  });
}
const dayTotal = d => d.sets.reduce((a, b) => a + b, 0);

/* ---------- Pantalla de Planes: tarjetas de retos ---------- */
function retosHTML() {
  const st = getRetos();
  const card = ([key, R]) => {
    const s = st[key];
    if (!s) return `<button class="reto" data-reto="${key}"><b>${R.n}</b><small>De 0 a ${R.goal} y más</small><span class="tag">Empezar</span></button>`;
    const days = retoDays(key, s.k, s.stage), d = days[s.day], due = Date.now() >= (s.nextAt || 0);
    const pct = Math.round(((s.stage - 1) * 100 + s.day / days.length * 100) / 3);
    return `<button class="reto on" data-reto="${key}"><b>${R.n}</b><small>${rangeLbl(key, s.k)}${s.kg ? ' · ' + fmtKg(s.kg) + ' kg' : ''} · etapa ${s.stage}/3 · día ${s.day + 1}/${days.length}</small>
      <span class="pbar"><i style="width:${pct}%"></i></span><span class="tag ${due ? 'due' : ''}">${due ? (d.test ? 'Hoy: prueba' : 'Hoy: ' + dayTotal(d)) : whenStr(s.nextAt)}</span></button>`;
  };
  const all = Object.entries(RETOS);
  return `<h2>Sin equipo</h2><div class="retos">${all.filter(([, R]) => !R.db).map(card).join('')}</div>
    <h2>Con mancuernas</h2><div class="retos">${all.filter(([, R]) => R.db).map(card).join('')}</div>`;
}
function renderRetos() {
  const el = $('#v-retos'); if (!el || !PROFILE) return;
  const st = getRetos(), act = Object.keys(st).filter(k => RETOS[k]);
  el.innerHTML = `<p class="hero">Retos</p>
    <p class="sub">Programas para llegar a muchas repeticiones de un ejercicio, con pruebas al final de cada etapa. ${act.length ? `Tienes ${act.length} ${act.length === 1 ? 'reto activo' : 'retos activos'}.` : 'Puedes tener varios activos a la vez.'}</p>
    <div style="height:6px"></div>${retosHTML()}`;
  el.querySelectorAll('[data-reto]').forEach(b => b.onclick = () => openReto(b.dataset.reto));
}
function openReto(key) { const s = getRetos()[key]; if (s) openRetoDetail(key); else openRetoSetup(key); }
function openRetoSetup(key, change) {
  const R = RETOS[key], cur = getRetos()[key];
  let k = cur ? cur.k : 0, stage = cur ? cur.stage : 1, mode = cur && R.modes[cur.mode] ? cur.mode : R.mode, sens = cur && cur.sens ? cur.sens : 3;
  let kg = cur && cur.kg ? cur.kg : 0, tempo = cur && cur.tempo ? cur.tempo : 3;
  const dws = R.db && typeof getDumb === 'function' && getDumb() ? dbWeights(getDumb()) : [];
  const kgNow = () => { const i = $('#rs-kg'); if (i) kg = parseFloat(String(i.value).replace(',', '.')) || 0; };
  const render = () => sheet(`<h3>${R.n}</h3>
    <p class="sub">Programa de 3 etapas con pruebas a las ${R.tests.join(', ')} repeticiones${R.goal !== R.tests[2] ? '' : ''}. Elige desde dónde empiezas.</p>
    <h2>Rango</h2>
    <div class="seg wrap" id="rs-k">${Array.from({ length: RANGES }, (_, i) => `<button data-k="${i}" aria-pressed="${k === i}">${rangeLbl(key, i)}</button>`).join('')}</div>
    <h2>Etapa inicial</h2>
    <div class="seg" id="rs-st">${[1, 2, 3].map(i => `<button data-s="${i}" aria-pressed="${stage === i}">${i}<br><small>hasta ${k * R.goal + R.tests[i - 1]}</small></button>`).join('')}</div>
    <p class="note">Si no sabes dónde empezar, haz la prueba inicial: tantas ${R.n.toLowerCase()} como puedas y elijo el rango y la etapa.</p>
    ${R.db ? `<h2>Peso de la mancuerna</h2>
    <div class="field"><input id="rs-kg" inputmode="decimal" value="${kg ? fmtKg(kg) : ''}" placeholder="kg por mancuerna"></div>
    ${dws.length ? `<div class="chips" id="rs-kgc" style="margin-top:8px">${dws.map(w => `<button class="chip" data-w="${w}" aria-pressed="${kg === w}">${fmtKg(w)} kg</button>`).join('')}</div>` : ''}
    <p class="note">Usa un peso con el que puedas hacer al menos ${R.tests[0]} seguidas con buena técnica. Mantén el mismo peso durante el reto.</p>` : ''}
    <h2>Cómo contar</h2>
    <div class="seg col" id="rs-m">${Object.entries(R.modes).map(([m, n]) => `<button data-m="${m}" aria-pressed="${mode === m}">${n}</button>`).join('')}</div>
    <p class="note">${esc(R.how[mode])}</p>
    ${mode === 'ritmo' ? `<h2>Ritmo</h2>
    <div class="seg" id="rs-tp">${TEMPOS.map(v => `<button data-v="${v}" aria-pressed="${tempo === v}">${v} s<br><small>${v === 2 ? 'rápido' : v === 3 ? 'normal' : 'lento'}</small></button>`).join('')}</div>
    <p class="note">Segundos por repetición: subir y bajar.</p>` : ''}
    ${mode !== 'toque' && mode !== 'ritmo' ? `<h2>Sensibilidad del sensor</h2>
    <div class="seg" id="rs-sens">${[1, 2, 3, 4, 5].map(i => `<button data-v="${i}" aria-pressed="${sens === i}">${i}</button>`).join('')}</div>
    <p class="note">Si cuenta de más, bájala; si se le escapan repeticiones, súbela. Siempre puedes tocar la pantalla o usar «−1».</p>` : ''}
    <div style="height:18px"></div>
    <button class="btn" id="rs-go">${change ? 'Guardar cambios' : 'Empezar el reto'}</button><div class="gap"></div>
    <button class="btn ghost small" id="rs-test">Hacer la prueba inicial</button>`, () => {
    bindSeg('rs-k', 'k', v => { kgNow(); k = +v; render(); });
    bindSeg('rs-st', 's', v => { stage = +v; });
    bindSeg('rs-m', 'm', v => { kgNow(); mode = v; render(); });
    bindSeg('rs-sens', 'v', v => { sens = +v; });
    if ($('#rs-tp')) bindSeg('rs-tp', 'v', v => { tempo = +v; });
    const kc = $('#rs-kgc'); if (kc) kc.onclick = e => { const b = e.target.closest('[data-w]'); if (!b) return; kg = +b.dataset.w; $('#rs-kg').value = fmtKg(kg); kc.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); };
    $('#rs-go').onclick = () => {
      kgNow();
      if (R.db && !(kg > 0 && kg <= 60)) { toast('Escribe el peso de la mancuerna'); return; }
      const all = getRetos();
      if (change && all[key]) { const s = all[key]; if (s.k !== k || s.stage !== stage) { s.k = k; s.stage = stage; s.day = 0; } s.mode = mode; s.sens = sens; s.tempo = tempo; if (R.db) s.kg = kg; }
      else all[key] = { k, stage, day: 0, mode, sens, tempo, ...(R.db ? { kg } : {}), startedAt: Date.now(), nextAt: Date.now(), log: [], v: 2 };
      setRetos(all); closeSheet(); renderRetos(); openRetoDetail(key);
    };
    $('#rs-test').onclick = () => { kgNow(); if (R.db && !(kg > 0)) { toast('Escribe el peso de la mancuerna'); return; } closeSheet(); startReto(key, { initial: true, mode, sens, tempo, kg }); };
  });
  render();
}
function openRetoDetail(key) {
  const R = RETOS[key], s = getRetos()[key]; if (!s) return;
  const days = retoDays(key, s.k, s.stage), due = Date.now() >= (s.nextAt || 0);
  const last = (s.log || []).slice(-1)[0];
  let t = Math.max(dayStart(Date.now()), dayStart(s.nextAt || Date.now()));
  const rows = days.map((d, i) => {
    let when = '';
    if (i >= s.day) { when = i === s.day ? (due ? 'hoy' : whenStr(t)) : whenStr(t); t = addDays(t, d.gap); }
    const done = i < s.day;
    return `<div class="rday ${done ? 'is-done' : ''} ${i === s.day ? 'cur' : ''}"><span class="dn">${done ? '✓' : i + 1}</span>
      <span class="t"><b>${d.test ? 'Prueba: ' + d.sets[0] + ' seguidas' : d.sets.join(' · ')}</b><small>${d.test ? 'Todas las que puedas' : dayTotal(d) + ' en total · descansos de ' + [...new Set(d.pauses)].join('/') + ' s'}${when ? ' · ' + when : ''}</small></span></div>`;
  }).join('');
  sheet(`<h3>${R.n}</h3><p class="sub">${s.kg ? fmtKg(s.kg) + ' kg · ' : ''}Rango ${rangeLbl(key, s.k)} · etapa ${s.stage} de 3 · día ${s.day + 1} de ${days.length}${s.best ? ' · tu récord: ' + s.best : ''}</p>
    <div class="gap"></div>
    <button class="btn" id="rd-go">${due ? 'Empezar' : 'Entrenar igual'} · ${days[s.day].test ? 'prueba' : dayTotal(days[s.day]) + ' ' + R.n.toLowerCase()}</button>
    ${due ? '' : `<p class="note">Próximo entrenamiento: ${whenStr(s.nextAt)}. Descansar entre sesiones es parte del programa.</p>`}
    ${last ? `<p class="note">Último: ${dateStr(last.at)} · ${last.total} ${R.n.toLowerCase()}${last.test ? (last.passed ? ' · prueba superada' : ' · prueba no superada') : ''}</p>` : ''}
    <h2>Etapa ${s.stage}</h2><div class="block">${rows}</div>
    <div class="row"><button class="btn ghost small" id="rd-chg">Cambiar ${R.db ? 'peso, rango o modo' : 'rango o modo'}</button><button class="btn ghost small" id="rd-quit">Abandonar</button></div>`, () => {
    $('#rd-go').onclick = () => { closeSheet(); startReto(key); };
    $('#rd-chg').onclick = () => openRetoSetup(key, true);
    $('#rd-quit').onclick = () => confirmApp(`¿Abandonar el reto de ${R.n.toLowerCase()}?`, 'Se borra el progreso del reto. Las sesiones hechas siguen en tu historial.', 'Abandonar', () => { const a = getRetos(); delete a[key]; setRetos(a); renderRetos(); toast('Reto abandonado'); }, true);
  });
}

/* ---------- Detección de repeticiones con los sensores ---------- */
// Devuelve un detector: feed(evento devicemotion) → true cuando hay una repetición nueva
// Detectores de repeticiones por sensores:
// - Abdominales: inclinación del móvil sobre el pecho; cuenta cada subida de 18° o más
//   (tras haber bajado otros 18°), como su detector de orientación.
// - Sentadillas y dominadas: magnitud de la aceleración; una fase «más liviana» (< g − 0,6 m/s²)
//   de más de 225 ms seguida de una frenada (> g) de más de 450 ms (doble si supera g + 3) = una repetición.
// - Alternativa para sentadillas: ángulo del muslo con el móvil en el bolsillo.
// sens: 1 (más exigente) … 5 (más sensible)
function makeDetector(key, mode, sens) {
  const k = [1.35, 1.15, 1, 0.85, 0.7][Math.max(1, Math.min(5, sens)) - 1];
  const G = 9.80665;
  let sig = 0, last = 0;
  if (key === 'situps' && mode === 'original') {
    // inclinación del tronco con signo (0° tumbado, 90° sentado, >90° inclinado hacia las rodillas).
    // Antes se usaba el valor absoluto: al pasar la vertical el ángulo «bajaba» y volvía a subir → contaba dos veces.
    let g = null, s = 0, base = null, up = false, lastT = 0;
    const HI = 32 * k, LO = 12;
    return { feed(e) {
      const a = e.accelerationIncludingGravity; if (!a || a.x == null) return false;
      const t = performance.now(), dt = lastT ? Math.min(0.2, (t - lastT) / 1000) : 0; lastT = t;
      // los golpes y tirones (aceleración muy distinta de la gravedad) no mueven el ángulo
      const mag = Math.hypot(a.x, a.y, a.z);
      if (Math.abs(mag - G) > 3.5) return false;
      g = g ? { x: g.x * 0.8 + a.x * 0.2, y: g.y * 0.8 + a.y * 0.2, z: g.z * 0.8 + a.z * 0.2 } : { x: a.x, y: a.y, z: a.z };
      const n = Math.hypot(g.x, g.y, g.z) || 1;
      if (!s) s = g.z >= 0 ? 1 : -1;               // pantalla hacia arriba o hacia el pecho: se decide al empezar
      const ang = Math.acos(Math.max(-1, Math.min(1, s * g.z / n))) * 180 / Math.PI;
      // referencia «tumbado»: baja al instante, sube despacio (2°/s) por si el móvil se mueve en el pecho
      base = base == null ? ang : Math.min(ang, base + 2 * dt);
      const rel = ang - base;
      sig = Math.max(0, Math.min(1, rel / HI));
      if (!up && rel > HI && t - last > 600) { up = true; last = t; return true; }
      if (up && rel < LO) up = false;
      return false;
    }, level: () => sig, hint: 'Incorpórate hasta que se llene la barra' };
  }
  if (mode === 'brazo') {
    // giro del brazo: ángulo entre la gravedad actual y la de la posición inicial
    // (cuenta al volver a la posición inicial después de pasar el umbral)
    const HI = (RETOS[key].tilt || 55) * k, LO = Math.min(20, HI * 0.4);
    let g = null, ref = null, up = false, upT = 0;
    const ang = (p, q) => { const d = (p[0] * q[0] + p[1] * q[1] + p[2] * q[2]) / ((Math.hypot(...p) * Math.hypot(...q)) || 1); return Math.acos(Math.max(-1, Math.min(1, d))) * 180 / Math.PI; };
    return { feed(e) {
      const a = e.accelerationIncludingGravity; if (!a || a.x == null) return false;
      const v = [a.x, a.y, a.z]; if (Math.abs(Math.hypot(...v) - G) > 4) return false;
      g = g ? g.map((x, i) => x + 0.25 * (v[i] - x)) : v;
      if (!ref) ref = g.slice();
      const th = ang(g, ref), t = performance.now(); sig = Math.min(1, th / HI);
      if (!up) {
        if (th > HI) { up = true; upT = t; }
        else if (th < LO) ref = ref.map((x, i) => x + 0.02 * (g[i] - x));   // la posición inicial se ajusta despacio
      } else if (th < LO) { up = false; if (t - last > 500) { last = t; return true; } }
      else if (t - upT > 8000) { ref = g.slice(); up = false; }            // quieto en otra posición: nueva referencia
      return false;
    }, reset() { ref = null; up = false; }, level: () => sig, hint: 'Cuenta al volver a la posición inicial' };
  }
  if (key === 'squats' && mode === 'muslo') {
    let g = null, state = 0;
    const hi = Math.min(75, 55 * k), lo = Math.max(12, 20 * k);
    return { feed(e) {
      const a = e.accelerationIncludingGravity; if (!a || a.x == null) return false;
      g = g ? { x: g.x * 0.8 + a.x * 0.2, y: g.y * 0.8 + a.y * 0.2, z: g.z * 0.8 + a.z * 0.2 } : { x: a.x, y: a.y, z: a.z };
      const n = Math.hypot(g.x, g.y, g.z) || 1, v = Math.acos(Math.min(1, Math.abs(g.y) / n)) * 180 / Math.PI;
      sig = Math.min(1, v / 90);
      const t = performance.now();
      if (state === 0 && v > hi) state = 1;
      else if (state === 1 && v < lo) { state = 0; if (t - last > 600) { last = t; return true; } }
      return false;
    }, level: () => sig, hint: 'Baja hasta que se llene la barra' };
  }
  // sentadillas y dominadas: bajada y frenada
  let x = 0, y = 0, z = true, prevT = 0;
  const LOW_START = -0.6 * k, LOW = -0.2, PH1 = 225 * k, PH2 = 450 * k;
  return { feed(e) {
    const a = e.accelerationIncludingGravity; if (!a || a.x == null) return false;
    const t = performance.now(); let dt = prevT ? t - prevT : 0; prevT = t; if (dt > 120) dt = 0;
    const v = Math.hypot(a.x, a.y, a.z) - G;
    sig = Math.min(1, (y / PH2) * 0.6 + (x > PH1 ? 0.4 : x / PH1 * 0.4));
    let hit = false;
    if (x === 0) { if (v < LOW_START) { x = dt || 1; y = 0; } }
    else if (v < LOW) { x += dt; y = 0; }
    else if (x > 0) x = Math.max(0, x - dt);
    if (v > 0) {
      if (x > PH1) {
        y += dt; x += dt;
        if (v > 3) y += dt;
        if (z && y > PH2) { z = false; x = 0; hit = true; }
      } else { x = 0; y = 0; z = true; }
    } else if (y > 0) { x = Math.max(0, x - 2 * dt); y = Math.max(0, y - 2 * dt); z = true; }
    return hit;
  }, level: () => sig, hint: key === 'pullups' ? 'Cuenta al terminar cada dominada' : 'Cuenta al llegar abajo' };
}
async function motionPermission() {
  try {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') return (await DeviceMotionEvent.requestPermission()) === 'granted';
    return typeof DeviceMotionEvent !== 'undefined';
  } catch (e) { return false; }
}

/* ---------- Reproductor del reto ---------- */
const RP = { key: null, s: null, d: null, set: 0, count: 0, extra: 0, done: [], phase: 'idle', restEnd: 0, timer: null, det: null, t0: 0, initial: false, mode: 'toque', sensOn: false };
const sensorMode = (key, mode) => mode !== 'toque' && mode !== 'ritmo';
async function startReto(key, opts = {}) {
  // audio antes de pedir permiso a los sensores: después de ese aviso ya no cuenta como toque y el iPhone lo deja mudo
  try { if (typeof audioSession === 'function') audioSession(true); audioCtx(); beep(660, 60, .1); } catch (e) {}
  if (S.sound !== 'voz') toast(S.sound === 'silencio' ? 'Sonido desactivado: actívalo con el altavoz en un entrenamiento' : 'Voz desactivada: solo pitidos');
  const R = RETOS[key], s = getRetos()[key];
  let mode = opts.mode || (s ? s.mode : R.mode);
  if (!R.modes[mode]) mode = R.mode; // modos de la versión anterior
  let d;
  if (opts.initial || !s) d = { sets: [0], pauses: [], next: 1, test: true, initial: true };
  else d = retoDays(key, s.k, s.stage)[s.day];
  Object.assign(RP, { key, s, d, set: 0, count: 0, extra: 0, done: [], times: [], setT0: 0, phase: 'prep', restEnd: performance.now() + PREP_S * 1000, lastSec: null, initial: !!opts.initial || !s, mode, sens: opts.sens || (s && s.sens) || 3, t0: Date.now(), active: 0, lastTick: performance.now(), paused: false,
    tempo: opts.tempo || (s && s.tempo) || 3, kg: opts.kg || (s && s.kg) || 0, nextBeat: 0 });
  // sensores (en iPhone hace falta permiso, pedido aquí con el toque del usuario)
  RP.sensOn = false;
  if (sensorMode(key, mode)) {
    const ok = await motionPermission();
    if (ok) { RP.det = makeDetector(key, mode, opts.sens || (s && s.sens) || 3); window.addEventListener('devicemotion', onMotion); RP.sensOn = true; }
    else toast('Sin acceso a los sensores: cuenta tocando la pantalla');
  }
  try { audioCtx(); } catch (e) {}
  $('#rplayer').classList.remove('hidden'); document.body.style.overflow = 'hidden'; wake(true);
  clearInterval(RP.timer); RP.timer = setInterval(rTick, 200);
  rRender();
  rSave();
  const tg = d.test ? (RP.initial ? 'Prueba inicial: todas las que puedas' : `Prueba: ${d.sets[0]} seguidas`) : `Serie 1 de ${d.sets.length}: ${d.sets[0]} repeticiones`;
  say(`${R.n}. ${tg}. Prepárate.`);
}
const PREP_S = 10;   // segundos para ponerse en posición antes de empezar a contar
// modo ritmo: una repetición por pulso; en la última serie se detiene al llegar al objetivo (las extra se tocan)
function rBeat() {
  if (RP.mode !== 'ritmo' || RP.phase !== 'work' || RP.paused) return;
  const lastSet = RP.set === RP.d.sets.length - 1;
  if (!RP.d.test && lastSet && RP.count >= rTarget()) return;
  if (RP.active >= RP.nextBeat) { RP.nextBeat = RP.active + RP.tempo * 1000; rCount(1); }
}
function onMotion(e) {
  if (RP.phase !== 'work' || RP.paused || !RP.det) return;
  if (RP.det.feed(e)) rCount(1);
  const m = $('#rp-meter i'); if (m) m.style.width = Math.round(RP.det.level() * 100) + '%';
}
function rTarget() { return RP.d.test ? RP.d.sets[0] : RP.d.sets[RP.set]; }
function rCount(n) {
  if (RP.phase !== 'work' || RP.paused) return;
  if (n < 0) { if (RP.count > 0) RP.count--; rRender(); return; }
  RP.count++;
  const tgt = rTarget(), lastSet = RP.set === RP.d.sets.length - 1;
  beep(RP.count >= tgt ? 1046 : 880, 70, .18);
  if (RP.d.test || (lastSet && RP.count >= tgt)) say(String(RP.count) + (RP.count === tgt ? '. ¡Objetivo!' : ''));
  else { const left = tgt - RP.count; say(String(left > 0 ? left : 0)); }
  if (!RP.d.test && !lastSet && RP.count >= tgt) rEndSet();
  else rRender();
  rSave();
}
function rEndSet() {
  RP.done[RP.set] = RP.count; RP.times[RP.set] = Math.round((RP.active - (RP.setT0 || 0)) / 100) / 10;
  const lastSet = RP.set === RP.d.sets.length - 1;
  if (lastSet || RP.d.test) { rFinish(); return; }
  const p = RP.d.pauses[RP.set] || RP.d.pauses[0] || 60;
  RP.phase = 'rest'; RP.restEnd = performance.now() + p * 1000; RP.restLen = p; RP.count = 0; RP.set++;
  rSave(); beep(523, 300, .2); { const n = RP.d.sets.length, r = n - RP.set; say(`¡Bien! Descanso de ${p} segundos. ${r <= 3 ? serieTxt(RP.set, n) + '. ' : ''}Siguiente: ${RP.d.sets[RP.set]} repeticiones.`); }
  rRender();
}
function rTick() {
  const t = performance.now(), dt = t - RP.lastTick; RP.lastTick = t;
  if (t - (RP.lastSave || 0) > 3000) rSave();
  if (RP.paused) return;
  if (RP.phase === 'work') { RP.active += dt; rBeat(); }
  if (RP.phase === 'rest' || RP.phase === 'prep') {
    const rem = Math.ceil((RP.restEnd - t) / 1000), prep = RP.phase === 'prep';
    if (rem !== RP.lastSec) {
      RP.lastSec = rem;
      if (rem <= 3 && rem >= 1) { beep(740, 100, .15); say(String(rem)); }
      // aviso a 10 s del final del descanso (si el descanso es más largo)
      else if (!prep && rem === 10 && (RP.restLen || 0) >= 15) { beep(660, 160, .18); setTimeout(() => beep(660, 160, .18), 220); say('10 segundos. Prepárate.'); }
    }
    if (t >= RP.restEnd) {
      RP.phase = 'work'; RP.setT0 = RP.active; RP.nextBeat = RP.active + RP.tempo * 1000; if (RP.det && RP.det.reset) RP.det.reset(); beep(1046, 300, .2);
      say(RP.d.test ? '¡Comienza!' : `¡Comienza! ${serieTxt(RP.set, RP.d.sets.length)}: ${rTarget()} repeticiones.`); rRender(); rSave(); return;
    }
    const el = $('#rp-num'); if (el) el.textContent = Math.max(0, rem);
  }
}
// series como línea de progreso; si no entran todas, se ve una ventana que avanza con la serie actual
// las tres últimas series se nombran: «Quedan 3 series», «Penúltima serie», «Última serie»
function serieTxt(i, n) { const r = n - i; return r === 3 ? 'Quedan 3 series' : r === 2 ? 'Penúltima serie' : r === 1 ? 'Última serie' : `Serie ${i + 1} de ${n}`; }
function setsBar(sets, fill) {
  const n = sets.length, cur = RP.set, el = $('#rp-sets');
  const maxS = Math.max(4, Math.floor(((el && el.clientWidth) || 240) / 40));
  const item = i => { const ok = i < cur, c = i === cur, w = ok ? 100 : c ? Math.round(fill * 100) : 0;
    return `<div class="st${ok ? ' ok' : c ? ' cur' : ''}"><b>${ok && RP.done[i] != null ? RP.done[i] : sets[i]}</b><i><u style="width:${w}%"></u></i></div>`; };
  const r = n - cur, lbl = r <= 3 ? `<b>${serieTxt(cur, n)}</b>` : `Serie <b>${cur + 1}</b> de ${n}`;
  const cap = `<div class="sb-cap">${RP.phase === 'rest' ? 'Siguiente: ' : ''}${lbl}</div>`;
  const wrap = h => `<div class="sb-row">${h}</div>${cap}`;
  if (n <= maxS) return wrap(sets.map((_, i) => item(i)).join(''));
  // ventana: se ven las que entran, con la serie actual y la anterior a la vista
  const a = Math.max(0, Math.min(cur - 1, n - maxS));
  let h = '';
  for (let i = a; i < a + maxS; i++) h += item(i);
  return wrap(h);
}
function rRender() {
  const R = RETOS[RP.key], d = RP.d, tgt = rTarget(), lastSet = RP.set === d.sets.length - 1;
  const prep = RP.phase === 'prep', rest = RP.phase === 'rest' || prep;
  $('#rplayer').className = 'player rplayer ' + (rest ? 'rest' : 'work');
  $('#rp-phase').textContent = (prep ? 'Prepárate' : rest ? 'Descanso' : d.test ? (RP.initial ? 'Prueba inicial' : 'Prueba') : serieTxt(RP.set, d.sets.length)) + (RP.kg ? ' · ' + fmtKg(RP.kg) + ' kg' : '');
  $('#rp-name').textContent = R.n;
  $('#rp-sets').innerHTML = d.test ? '' : setsBar(d.sets, rest ? 0 : Math.min(1, RP.count / Math.max(1, tgt)));
  let big, small;
  if (rest) { big = Math.max(0, Math.ceil((RP.restEnd - performance.now()) / 1000)); small = prep ? (d.test ? (RP.initial ? 'segundos · luego todas las que puedas' : `segundos · luego ${tgt} seguidas`) : `segundos · luego ${tgt} repeticiones`) : `segundos · luego ${tgt}`; }
  else if (d.test) { big = RP.count; small = RP.initial ? 'repeticiones' : `de ${tgt}`; }
  else if (lastSet && RP.count >= tgt) { big = '+' + (RP.count - tgt); small = 'extra · sigue si puedes'; }
  else { big = tgt - RP.count; small = lastSet ? 'faltan · última serie' : 'faltan'; }
  $('#rp-num').textContent = big; $('#rp-small').textContent = small;
  $('#rp-help').textContent = prep ? 'Ponte en posición. ' + (R.how[RP.mode] || '') : rest ? 'Recupera el aire. A 10 s del final te aviso.' : RP.mode === 'ritmo' ? (lastSet && !d.test && RP.count >= tgt ? 'Objetivo cumplido: toca la pantalla por cada extra o «Terminar».' : d.test ? 'Una por pitido. Cuando no puedas más, toca «Terminar» (y «−1» si la última no salió).' : `Una por pitido, cada ${RP.tempo} s. Si no llegas, «Serie hecha».`) : RP.sensOn ? (RP.det.hint + ' · también puedes tocar la pantalla') : (R.how.toque || 'Toca la pantalla en cada repetición.');
  $('#rp-meter').classList.toggle('hidden', !RP.sensOn || rest);
  $('#rp-done').textContent = prep ? 'Empezar ya' : rest ? 'Saltar descanso' : (d.test || lastSet) ? 'Terminar' : 'Serie hecha';
  $('#rp-pause').textContent = RP.paused ? '▶ Seguir' : 'Pausa';
  const m = $('#rp-anim'); if (m && m.dataset.animId !== R.ex) Anim.mount(m, R.ex);
}
function rFinish(partial) {
  if (RP.initial) partial = false; // la prueba inicial vale aunque se corte antes
  window.removeEventListener('devicemotion', onMotion); clearInterval(RP.timer); wake(false); PS.del('rsession');
  const R = RETOS[RP.key], d = RP.d, all = getRetos(), key = RP.key;
  if (RP.phase === 'work' && RP.done[RP.set] == null) { RP.done[RP.set] = RP.count; RP.times[RP.set] = Math.round((RP.active - (RP.setT0 || 0)) / 100) / 10; }
  const reps = RP.done.filter(x => x != null);
  const total = reps.reduce((a, b) => a + b, 0), secs = Math.round(RP.active / 1000) || Math.round((Date.now() - RP.t0) / 1000);
  $('#rplayer').classList.add('hidden'); document.body.style.overflow = '';
  RP.phase = 'idle';
  if (!total) { toast('Sesión sin repeticiones: no se guarda'); renderRetos(); return; }
  let msg = '', s = all[key];
  if (RP.initial) {
    // la prueba inicial elige rango y etapa
    const k = Math.min(RANGES - 1, Math.floor(total / R.goal)), r = total - k * R.goal;
    const stage = r < R.tests[0] ? 1 : r < R.tests[1] ? 2 : 3;
    all[key] = { k, stage, day: 0, mode: RP.mode, sens: RP.sens, tempo: RP.tempo, ...(RP.kg ? { kg: RP.kg } : {}), v: 2, startedAt: Date.now(), nextAt: addDays(Date.now(), 1), log: [], best: total };
    s = all[key];
    msg = `Hiciste ${total}. Empiezas en el rango ${rangeLbl(key, k)}, etapa ${stage}, mañana.`;
  } else if (partial) {
    // salida antes de terminar: se guarda lo hecho, pero el programa no avanza
    s.log = [...(s.log || []), { at: Date.now(), k: s.k, stage: s.stage, day: s.day, sets: reps, total, test: !!d.test, partial: true }].slice(-300);
    s.best = Math.max(s.best || 0, Math.max(...reps));
    msg = `Guardado como incompleto. ${d.test ? 'La prueba' : 'El día ' + (s.day + 1)} queda pendiente para repetirlo.`;
  } else {
    const days = retoDays(key, s.k, s.stage), target = d.test ? d.sets[0] : 0;
    const passed = d.test ? total >= target : null;
    s.log = [...(s.log || []), { at: Date.now(), k: s.k, stage: s.stage, day: s.day, sets: reps, total, test: !!d.test, passed, ...(RP.kg ? { kg: RP.kg } : {}) }].slice(-300);
    s.best = Math.max(s.best || 0, Math.max(...reps));
    if (d.test) {
      if (passed) {
        if (s.stage < 3) { s.stage++; s.day = 0; msg = `¡Prueba superada! Pasas a la etapa ${s.stage}.`; }
        else if (s.k < RANGES - 1) { s.k++; s.stage = 1; s.day = 0; s.goalsDone = (s.goalsDone || 0) + 1; msg = `¡Meta de ${s.k * R.goal} conseguida! Empieza el rango ${rangeLbl(key, s.k)}.`; }
        else { s.goalsDone = (s.goalsDone || 0) + 1; msg = '¡Completaste el último rango!'; }
      } else { s.day = Math.max(0, s.day - 3); msg = `Hiciste ${total} de ${target}. Repite las últimas sesiones y vuelve a intentarlo.`; }
      s.nextAt = addDays(Date.now(), 2);
    } else {
      s.nextAt = addDays(Date.now(), d.gap);
      s.day = Math.min(days.length - 1, s.day + 1);
      msg = `Próximo entrenamiento: ${whenStr(s.nextAt)}${days[s.day].test ? ' (prueba)' : ''}.`;
    }
  }
  setRetos(all);
  // historial y logros
  const h = PS.get('history', []);
  const rp = { sq: 0, pu: 0, ab: 0, bu: 0, pl: 0, dm: 0 }; rp[R.rep] = total;
  h.unshift({ at: Date.now(), start: RP.t0, secs, full: !partial, w: { kind: 'reto', reto: key, ...(RP.kg ? { kg: RP.kg } : {}), title: `${R.n}${RP.kg ? ' ' + fmtKg(RP.kg) + ' kg' : ''} · ${RP.initial ? 'prueba inicial' : d.test ? 'prueba' : 'día ' + ((s.log.slice(-1)[0] || {}).day + 1)}`, sets: reps, times: (RP.times || []).slice(0, reps.length), rounds: [] }, reps: rp });
  PS.set('history', h.slice(0, 400));
  beep(784, 150, .25); setTimeout(() => beep(1046, 350, .3), 170);
  if (!partial) say(`¡Terminaste! ${total} ${R.n.toLowerCase()}. Buen trabajo.`);
  sheet(`<div class="big-check" style="margin:8px auto 10px"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg></div>
    <h3 style="text-align:center">${total} ${R.n.toLowerCase()}</h3>
    <p class="sub" style="text-align:center">${reps.join(' · ')} · ${fmt(secs)} min</p>
    <p class="note" style="text-align:center">${esc(msg)}</p><div style="height:16px"></div>
    <button class="btn" id="rf-ok">Listo</button>`, () => { $('#rf-ok').onclick = () => { closeSheet(); renderRetos(); }; });
  renderRetos();
  setTimeout(() => checkAwards(true), 800);
}
// controles del reproductor del reto
// toque en cualquier parte de la pantalla (también en horizontal y con las repeticiones extra), salvo en los botones
// se cuenta al apoyar el dedo (sin esperar al «click», que en el móvil se pierde con toques rápidos)
$('#rplayer').addEventListener('pointerdown', e => {
  if (e.target.closest('button,.p-top,#sheet-root') || e.button > 0) return;
  try { audioCtx(); } catch (e2) {}
  if (RP.phase === 'work' && !RP.paused) {
    // al ritmo de la app solo se tocan las extra de la última serie
    if (RP.mode === 'ritmo' && !(RP.set === RP.d.sets.length - 1 && !RP.d.test && RP.count >= rTarget())) return;
    e.preventDefault(); rCount(1);
  }
});
$('#rp-minus').onclick = () => rCount(-1);
$('#rp-done').onclick = () => {
  if (RP.phase === 'rest' || RP.phase === 'prep') { RP.restEnd = performance.now(); return; }
  if (RP.d.test || RP.set === RP.d.sets.length - 1) { rFinish(); return; }
  rEndSet();
};
$('#rp-pause').onclick = async () => {
  // al reanudar tras un cierre de la app, los sensores se vuelven a pedir con este toque
  if (RP.paused && !RP.sensOn && RP.wantSens && await motionPermission()) { RP.det = makeDetector(RP.key, RP.mode, RP.sens); window.addEventListener('devicemotion', onMotion); RP.sensOn = true; }
  if (RP.paused) rResume(); else rPause();
};
function rPause() {
  RP.paused = true; RP.pausedAt = performance.now(); say('Pausa'); rRender();
  const sensor = RP.sensOn || RP.wantSens;
  sheet(`<h3>Pausa</h3>
    <p class="sub">${RETOS[RP.key].n} · ${RP.d.test ? 'prueba' : serieTxt(RP.set, RP.d.sets.length).toLowerCase()}</p>
    ${sensor ? `<h2>Sensibilidad del sensor</h2>
      <div class="seg" id="rpz-s">${[1, 2, 3, 4, 5].map(v => `<button data-v="${v}" aria-pressed="${RP.sens === v}">${v}</button>`).join('')}</div>
      <p class="note">1 = cuenta solo movimientos amplios · 5 = cuenta movimientos más cortos. Si cuenta de más, bájala; si no cuenta, súbela.</p>`
    : RP.mode === 'ritmo' ? `<h2>Ritmo</h2><div class="seg" id="rpz-t">${TEMPOS.map(v => `<button data-v="${v}" aria-pressed="${RP.tempo === v}">${v} s</button>`).join('')}</div><p class="note">Segundos por repetición.</p>`
    : `<p class="note">Modo toque: toca cualquier parte de la pantalla en cada repetición.</p>`}
    <div style="height:14px"></div><button class="btn" id="rpz-go">▶ Seguir</button>`, () => {
    if (sensor) bindSeg('rpz-s', 'v', v => {
      RP.sens = +v; if (RP.sensOn) RP.det = makeDetector(RP.key, RP.mode, RP.sens);
      const all = getRetos(); if (all[RP.key]) { all[RP.key].sens = RP.sens; setRetos(all); }
      toast('Sensibilidad ' + v);
    });
    if ($('#rpz-t')) bindSeg('rpz-t', 'v', v => { RP.tempo = +v; const all = getRetos(); if (all[RP.key]) { all[RP.key].tempo = RP.tempo; setRetos(all); } });
    $('#rpz-go').onclick = () => { closeSheet(); rResume(); };
  });
}
function rResume() {
  if (!RP.paused) return;
  if ((RP.phase === 'rest' || RP.phase === 'prep') && RP.pausedAt) RP.restEnd += performance.now() - RP.pausedAt; // el descanso no corre en pausa
  RP.paused = false; RP.pausedAt = 0; RP.lastTick = performance.now(); say('Seguimos'); rRender();
}
$('#rp-close').onclick = () => {
  RP.paused = true; rRender();
  const any = RP.done.length || RP.count;
  const quit = () => { window.removeEventListener('devicemotion', onMotion); clearInterval(RP.timer); wake(false); $('#rplayer').classList.add('hidden'); document.body.style.overflow = ''; RP.phase = 'idle'; PS.del('rsession'); };
  sheet(`<h3>¿Salir del reto?</h3>
    <p class="sub">${any ? `Llevas ${RP.done.filter(x => x != null).reduce((a, b) => a + b, 0) + (RP.phase === 'work' && RP.done[RP.set] == null ? RP.count : 0)} repeticiones.` : 'Todavía no hiciste ninguna repetición.'}</p>
    <div style="height:16px"></div>
    <button class="btn" id="rx-go">▶ Seguir entrenando</button><div class="gap"></div>
    ${any && !RP.initial ? `<button class="btn ghost" id="rx-save">Guardar lo hecho y salir<small>Queda en el historial; este día del programa sigue pendiente</small></button><div class="gap"></div>` : ''}
    ${any && RP.initial ? `<button class="btn ghost" id="rx-save">Terminar la prueba aquí<small>Elijo rango y etapa con lo que hiciste</small></button><div class="gap"></div>` : ''}
    <button class="btn danger" id="rx-quit">Salir sin guardar</button>`, () => {
    $('#rx-go').onclick = () => { closeSheet(); RP.paused = false; rRender(); };
    const sv = $('#rx-save'); if (sv) sv.onclick = () => { closeSheet(); rFinish(true); };
    $('#rx-quit').onclick = () => { closeSheet(); quit(); };
  });
};

/* ---------- Si el teléfono cierra la app a mitad del reto, se retoma ---------- */
function rSave() {
  if (!RP.key || RP.phase === 'idle') return;
  RP.lastSave = performance.now();
  PS.set('rsession', { key: RP.key, d: RP.d, set: RP.set, count: RP.count, done: RP.done, phase: RP.phase, restLen: RP.restLen, restLeft: RP.phase === 'rest' || RP.phase === 'prep' ? Math.max(0, RP.restEnd - performance.now()) : 0,
    initial: RP.initial, mode: RP.mode, sens: RP.sens, tempo: RP.tempo, kg: RP.kg, nextBeat: RP.nextBeat, t0: RP.t0, active: RP.active, times: RP.times, setT0: RP.setT0, sensWanted: sensorMode(RP.key, RP.mode), savedAt: Date.now() });
}
function resumeReto(x) {
  const R = RETOS[x.key]; if (!R) { PS.del('rsession'); return false; }
  Object.assign(RP, { key: x.key, s: getRetos()[x.key], d: x.d, set: x.set, count: x.count, extra: 0, done: x.done || [], phase: x.phase === 'rest' || x.phase === 'prep' ? x.phase : 'work', restLen: x.restLen || 0,
    restEnd: performance.now() + (x.restLeft || 0), initial: !!x.initial, mode: x.mode, sens: x.sens || 3, tempo: x.tempo || 3, kg: x.kg || 0, nextBeat: x.nextBeat || 0, t0: x.t0, active: x.active || 0, times: x.times || [], setT0: x.setT0 || 0, lastTick: performance.now(), paused: true,
    sensOn: false, det: null, wantSens: !!x.sensWanted });
  if (!RP.initial && !RP.s) { PS.del('rsession'); return false; }
  $('#rplayer').classList.remove('hidden'); document.body.style.overflow = 'hidden'; wake(true);
  clearInterval(RP.timer); RP.timer = setInterval(rTick, 200);
  rRender(); toast('Reto retomado donde quedó · toca Seguir');
  return true;
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') rSave(); });
window.addEventListener('pagehide', rSave);

migrateRetos();
const _swR = switchProfile;
switchProfile = function (id) { _swR(id); try { migrateRetos(); } catch (e) {} };
