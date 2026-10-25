'use strict';
/* =========================================================
   Retos de repeticiones (abdominales, sentadillas, flexiones, dominadas)
   - Programa original: 3 etapas por rango; el último día de cada etapa es una prueba.
   - Rangos: 0–meta, meta–2×meta, … (se elige al empezar).
   - Conteo: sensores de movimiento del móvil o tocando la pantalla.
   ========================================================= */
const RETOS = {
  situps: { n: 'Abdominales', one: 'abdominal', ex: 'sit_ups', goal: 100, tests: [20, 60, 100], rep: 'ab',
    modes: { original: 'Móvil sobre el pecho (sensor, como la app original)', toque: 'Tocando la pantalla' }, mode: 'original',
    how: { original: 'Túmbate con las rodillas flexionadas y sujeta el móvil plano contra el pecho, con la pantalla hacia arriba (puede ir atravesado o a lo largo). La app mide cuánto se inclina la pantalla: cada vez que te incorporas 18° o más, cuenta una.', toque: 'Toca la pantalla en cada repetición.' } },
  squats: { n: 'Sentadillas', one: 'sentadilla', ex: 'squats', goal: 150, tests: [20, 100, 150], rep: 'sq',
    modes: { original: 'Móvil en la mano o en el bolsillo (sensor, como la app original)', muslo: 'Móvil en el bolsillo del pantalón, por el ángulo del muslo (sensor)', toque: 'Tocando la pantalla' }, mode: 'original',
    how: { original: 'Sujeta el móvil contra el pecho o guárdalo en un bolsillo. Como en la app original, detecta la bajada (menos peso) y la frenada abajo: cuenta al llegar abajo.', muslo: 'Móvil en el bolsillo delantero del pantalón, vertical. Cuenta al volver a subir, cuando el muslo pasa de horizontal a vertical.', toque: 'Toca la pantalla en cada repetición.' } },
  pushups: { n: 'Flexiones', one: 'flexión', ex: 'push_ups', goal: 100, tests: [20, 50, 100], rep: 'pu',
    modes: { toque: 'Tocando la pantalla con la nariz o la barbilla (como la app original)' }, mode: 'toque',
    how: { toque: 'Deja el móvil en el suelo bajo tu cara y tócalo con la nariz o la barbilla en cada bajada. La app original usaba el sensor de proximidad, que el navegador no permite leer; el toque cumple la misma función.' } },
  pullups: { n: 'Dominadas', one: 'dominada', ex: 'pull_ups', goal: 30, tests: [10, 20, 30], rep: 'dm',
    modes: { original: 'Móvil en el bolsillo (sensor, como la app original)', toque: 'Tocando la pantalla al bajar' }, mode: 'original',
    how: { original: 'Guarda el móvil en un bolsillo ajustado o en una banda de brazo. Como en la app original, detecta la bajada y la frenada abajo: cuenta al terminar cada dominada.', toque: 'Deja el móvil cerca y tócalo al bajar de cada dominada.' } },
};
const RANGES = 10;
const getRetos = () => PS.get('retos', {}) || {};
const setRetos = v => PS.set('retos', v);
const rangeLbl = (key, k) => `${k * RETOS[key].goal}–${(k + 1) * RETOS[key].goal}`;
// días de una etapa en un rango: el rango 0 es el programa original; los demás se escalan
// para que cada prueba sea (inicio del rango + prueba original)
function retoDays(key, k, stage) {
  const R = RETOS[key], src = RETOS_DATA[key][stage - 1], t = R.tests[stage - 1];
  const f = (k * R.goal + t) / t;
  return src.map(([sets, pauses, next], i) => {
    const test = i === src.length - 1;
    return { sets: test ? [k * R.goal + t] : sets.map(v => Math.max(1, Math.round(v * f))), pauses, next, test };
  });
}
const dayTotal = d => d.sets.reduce((a, b) => a + b, 0);

/* ---------- Pantalla de Planes: tarjetas de retos ---------- */
function retosHTML() {
  const st = getRetos();
  return `<h2>Retos de repeticiones</h2><div class="retos">${Object.entries(RETOS).map(([key, R]) => {
    const s = st[key];
    if (!s) return `<button class="reto" data-reto="${key}"><b>${R.n}</b><small>De 0 a ${R.goal} y más</small><span class="tag">Empezar</span></button>`;
    const days = retoDays(key, s.k, s.stage), d = days[s.day], due = Date.now() >= (s.nextAt || 0);
    const pct = Math.round(((s.stage - 1) * 100 + s.day / days.length * 100) / 3);
    return `<button class="reto on" data-reto="${key}"><b>${R.n}</b><small>${rangeLbl(key, s.k)} · etapa ${s.stage}/3 · día ${s.day + 1}/${days.length}</small>
      <span class="pbar"><i style="width:${pct}%"></i></span><span class="tag ${due ? 'due' : ''}">${due ? (d.test ? 'Hoy: prueba' : 'Hoy: ' + dayTotal(d)) : whenStr(s.nextAt)}</span></button>`;
  }).join('')}</div>`;
}
function openReto(key) { const s = getRetos()[key]; if (s) openRetoDetail(key); else openRetoSetup(key); }
function openRetoSetup(key, change) {
  const R = RETOS[key], cur = getRetos()[key];
  let k = cur ? cur.k : 0, stage = cur ? cur.stage : 1, mode = cur && R.modes[cur.mode] ? cur.mode : R.mode, sens = cur && cur.sens ? cur.sens : 3;
  const render = () => sheet(`<h3>${R.n}</h3>
    <p class="sub">Programa original de 3 etapas con pruebas a las ${R.tests.join(', ')} repeticiones${R.goal !== R.tests[2] ? '' : ''}. Elige desde dónde empiezas.</p>
    <h2>Rango</h2>
    <div class="seg wrap" id="rs-k">${Array.from({ length: RANGES }, (_, i) => `<button data-k="${i}" aria-pressed="${k === i}">${rangeLbl(key, i)}</button>`).join('')}</div>
    <h2>Etapa inicial</h2>
    <div class="seg" id="rs-st">${[1, 2, 3].map(i => `<button data-s="${i}" aria-pressed="${stage === i}">${i}<br><small>hasta ${k * R.goal + R.tests[i - 1]}</small></button>`).join('')}</div>
    <p class="note">Si no sabes dónde empezar, haz la prueba inicial: tantas ${R.n.toLowerCase()} como puedas y elijo el rango y la etapa.</p>
    <h2>Cómo contar</h2>
    <div class="seg col" id="rs-m">${Object.entries(R.modes).map(([m, n]) => `<button data-m="${m}" aria-pressed="${mode === m}">${n}</button>`).join('')}</div>
    <p class="note">${esc(R.how[mode])}</p>
    ${mode !== 'toque' ? `<h2>Sensibilidad del sensor</h2>
    <div class="seg" id="rs-sens">${[1, 2, 3, 4, 5].map(i => `<button data-v="${i}" aria-pressed="${sens === i}">${i}</button>`).join('')}</div>
    <p class="note">Si cuenta de más, bájala; si se le escapan repeticiones, súbela. Siempre puedes tocar la pantalla o usar «−1».</p>` : ''}
    <div style="height:18px"></div>
    <button class="btn" id="rs-go">${change ? 'Guardar cambios' : 'Empezar el reto'}</button><div class="gap"></div>
    <button class="btn ghost small" id="rs-test">Hacer la prueba inicial</button>`, () => {
    bindSeg('rs-k', 'k', v => { k = +v; render(); });
    bindSeg('rs-st', 's', v => { stage = +v; });
    bindSeg('rs-m', 'm', v => { mode = v; render(); });
    bindSeg('rs-sens', 'v', v => { sens = +v; });
    $('#rs-go').onclick = () => {
      const all = getRetos();
      if (change && all[key]) { const s = all[key]; if (s.k !== k || s.stage !== stage) { s.k = k; s.stage = stage; s.day = 0; } s.mode = mode; s.sens = sens; }
      else all[key] = { k, stage, day: 0, mode, sens, startedAt: Date.now(), nextAt: Date.now(), log: [] };
      setRetos(all); closeSheet(); renderPlans(); openRetoDetail(key);
    };
    $('#rs-test').onclick = () => { closeSheet(); startReto(key, { initial: true, mode, sens }); };
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
    if (i >= s.day) { when = i === s.day ? (due ? 'hoy' : whenStr(t)) : whenStr(t); t = addDays(t, d.next); }
    const done = i < s.day;
    return `<div class="rday ${done ? 'is-done' : ''} ${i === s.day ? 'cur' : ''}"><span class="dn">${done ? '✓' : i + 1}</span>
      <span class="t"><b>${d.test ? 'Prueba: ' + d.sets[0] + ' seguidas' : d.sets.join(' · ')}</b><small>${d.test ? 'Todas las que puedas' : dayTotal(d) + ' en total · descansos de ' + [...new Set(d.pauses)].join('/') + ' s'}${when ? ' · ' + when : ''}</small></span></div>`;
  }).join('');
  sheet(`<h3>${R.n}</h3><p class="sub">Rango ${rangeLbl(key, s.k)} · etapa ${s.stage} de 3 · día ${s.day + 1} de ${days.length}${s.best ? ' · tu récord: ' + s.best : ''}</p>
    <div class="gap"></div>
    <button class="btn" id="rd-go">${due ? 'Empezar' : 'Entrenar igual'} · ${days[s.day].test ? 'prueba' : dayTotal(days[s.day]) + ' ' + R.n.toLowerCase()}</button>
    ${due ? '' : `<p class="note">Próximo entrenamiento: ${whenStr(s.nextAt)}. Descansar entre sesiones es parte del programa.</p>`}
    ${last ? `<p class="note">Último: ${dateStr(last.at)} · ${last.total} ${R.n.toLowerCase()}${last.test ? (last.passed ? ' · prueba superada' : ' · prueba no superada') : ''}</p>` : ''}
    <h2>Etapa ${s.stage}</h2><div class="block">${rows}</div>
    <div class="row"><button class="btn ghost small" id="rd-chg">Cambiar rango o modo</button><button class="btn ghost small" id="rd-quit">Abandonar</button></div>`, () => {
    $('#rd-go').onclick = () => { closeSheet(); startReto(key); };
    $('#rd-chg').onclick = () => openRetoSetup(key, true);
    $('#rd-quit').onclick = () => confirmApp(`¿Abandonar el reto de ${R.n.toLowerCase()}?`, 'Se borra el progreso del reto. Las sesiones hechas siguen en tu historial.', 'Abandonar', () => { const a = getRetos(); delete a[key]; setRetos(a); renderPlans(); toast('Reto abandonado'); }, true);
  });
}

/* ---------- Detección de repeticiones con los sensores ---------- */
// Devuelve un detector: feed(evento devicemotion) → true cuando hay una repetición nueva
// Detectores basados en los de las apps originales (Runtastic … PRO):
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
    // ángulo respecto a plano (0° tumbado, 90° vertical) con la gravedad suavizada
    let g = null, B = null, A = 0, Z = 0, down = false, armed = false, first = true, lastCount = 0;
    const STEP = 18 * k;
    return { feed(e) {
      const a = e.accelerationIncludingGravity; if (!a || a.x == null) return false;
      g = g ? { x: g.x * 0.75 + a.x * 0.25, y: g.y * 0.75 + a.y * 0.25, z: g.z * 0.75 + a.z * 0.25 } : { x: a.x, y: a.y, z: a.z };
      const n = Math.hypot(g.x, g.y, g.z) || 1, ang = Math.acos(Math.min(1, Math.abs(g.z) / n)) * 180 / Math.PI;
      sig = Math.min(1, ang / 70);
      if (B == null) { B = ang; return false; }
      const d = ang - B;
      if (Math.abs(d) < 2) return false;          // cambios pequeños se ignoran (como el original)
      B = ang;
      if (Math.abs(d) > 30) return false;          // saltos bruscos: ruido
      let hit = false;
      if (d > 0) {                                  // subiendo
        if (down) { A = 0; down = false; }
        A += d;
        if (!armed && A >= STEP && (first || Z >= STEP)) {
          const t = performance.now();
          if (t - lastCount >= 300) { lastCount = t; hit = true; armed = true; first = false; }
        }
      } else {                                      // bajando
        if (!down) { Z = 0; down = true; }
        Z += -d;
        if (Z >= STEP) armed = false;
      }
      return hit;
    }, level: () => sig, hint: 'Incorpórate hasta que se llene la barra' };
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
  // sentadillas y dominadas «como la app original»
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
const sensorMode = (key, mode) => mode !== 'toque';
async function startReto(key, opts = {}) {
  const R = RETOS[key], s = getRetos()[key];
  let mode = opts.mode || (s ? s.mode : R.mode);
  if (!R.modes[mode]) mode = R.mode; // modos de la versión anterior
  let d;
  if (opts.initial || !s) d = { sets: [0], pauses: [], next: 1, test: true, initial: true };
  else d = retoDays(key, s.k, s.stage)[s.day];
  Object.assign(RP, { key, s, d, set: 0, count: 0, extra: 0, done: [], phase: 'work', restEnd: 0, initial: !!opts.initial || !s, mode, sens: opts.sens || (s && s.sens) || 3, t0: Date.now(), active: 0, lastTick: performance.now(), paused: false });
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
  say(`${R.n}. ${tg}`);
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
  RP.done[RP.set] = RP.count;
  const lastSet = RP.set === RP.d.sets.length - 1;
  if (lastSet || RP.d.test) { rFinish(); return; }
  const p = RP.d.pauses[RP.set] || RP.d.pauses[0] || 60;
  RP.phase = 'rest'; RP.restEnd = performance.now() + p * 1000; RP.count = 0; RP.set++;
  rSave(); beep(523, 300, .2); say(`¡Bien! Descanso de ${p} segundos. Siguiente: ${RP.d.sets[RP.set]} repeticiones.`);
  rRender();
}
function rTick() {
  const t = performance.now(), dt = t - RP.lastTick; RP.lastTick = t;
  if (t - (RP.lastSave || 0) > 3000) rSave();
  if (RP.paused) return;
  if (RP.phase === 'work') RP.active += dt;
  if (RP.phase === 'rest') {
    const rem = Math.ceil((RP.restEnd - t) / 1000);
    if (rem !== RP.lastSec) { RP.lastSec = rem; if (rem <= 3 && rem >= 1) { beep(740, 100, .15); say(String(rem)); } }
    if (t >= RP.restEnd) { RP.phase = 'work'; beep(1046, 300, .2); say(`¡Comienza! Serie ${RP.set + 1} de ${RP.d.sets.length}: ${rTarget()} repeticiones.`); rRender(); return; }
    const el = $('#rp-num'); if (el) el.textContent = Math.max(0, rem);
  }
}
function rRender() {
  const R = RETOS[RP.key], d = RP.d, tgt = rTarget(), lastSet = RP.set === d.sets.length - 1;
  const rest = RP.phase === 'rest';
  $('#rplayer').className = 'player rplayer ' + (rest ? 'rest' : 'work');
  $('#rp-phase').textContent = rest ? 'Descanso' : d.test ? (RP.initial ? 'Prueba inicial' : 'Prueba') : `Serie ${RP.set + 1} de ${d.sets.length}`;
  $('#rp-name').textContent = R.n;
  $('#rp-sets').innerHTML = d.test ? '' : d.sets.map((n, i) => `<span class="${i < RP.set ? 'ok' : i === RP.set ? 'cur' : ''}">${i < RP.set ? RP.done[i] : n}</span>`).join('');
  let big, small;
  if (rest) { big = Math.max(0, Math.ceil((RP.restEnd - performance.now()) / 1000)); small = `segundos · luego ${tgt}`; }
  else if (d.test) { big = RP.count; small = RP.initial ? 'repeticiones' : `de ${tgt}`; }
  else if (lastSet && RP.count >= tgt) { big = '+' + (RP.count - tgt); small = 'extra · sigue si puedes'; }
  else { big = tgt - RP.count; small = lastSet ? 'faltan · última serie' : 'faltan'; }
  $('#rp-num').textContent = big; $('#rp-small').textContent = small;
  $('#rp-help').textContent = rest ? 'Recupera el aire.' : RP.sensOn ? (RP.det.hint + ' · también puedes tocar la pantalla') : (R.how.toque || 'Toca la pantalla en cada repetición.');
  $('#rp-meter').classList.toggle('hidden', !RP.sensOn || rest);
  $('#rp-done').textContent = rest ? 'Saltar descanso' : (d.test || lastSet) ? 'Terminar' : 'Serie hecha';
  $('#rp-pause').textContent = RP.paused ? '▶ Seguir' : 'Pausa';
  const m = $('#rp-anim'); if (m && m.dataset.animId !== R.ex) Anim.mount(m, R.ex);
}
function rFinish(partial) {
  if (RP.initial) partial = false; // la prueba inicial vale aunque se corte antes
  window.removeEventListener('devicemotion', onMotion); clearInterval(RP.timer); wake(false); PS.del('rsession');
  const R = RETOS[RP.key], d = RP.d, all = getRetos(), key = RP.key;
  if (RP.phase === 'work' && RP.done[RP.set] == null) RP.done[RP.set] = RP.count;
  const reps = RP.done.filter(x => x != null);
  const total = reps.reduce((a, b) => a + b, 0), secs = Math.round(RP.active / 1000) || Math.round((Date.now() - RP.t0) / 1000);
  $('#rplayer').classList.add('hidden'); document.body.style.overflow = '';
  RP.phase = 'idle';
  if (!total) { toast('Sesión sin repeticiones: no se guarda'); renderPlans(); return; }
  let msg = '', s = all[key];
  if (RP.initial) {
    // la prueba inicial elige rango y etapa
    const k = Math.min(RANGES - 1, Math.floor(total / R.goal)), r = total - k * R.goal;
    const stage = r < R.tests[0] ? 1 : r < R.tests[1] ? 2 : 3;
    all[key] = { k, stage, day: 0, mode: RP.mode, sens: RP.sens, startedAt: Date.now(), nextAt: addDays(Date.now(), 1), log: [], best: total };
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
    s.log = [...(s.log || []), { at: Date.now(), k: s.k, stage: s.stage, day: s.day, sets: reps, total, test: !!d.test, passed }].slice(-300);
    s.best = Math.max(s.best || 0, Math.max(...reps));
    if (d.test) {
      if (passed) {
        if (s.stage < 3) { s.stage++; s.day = 0; msg = `¡Prueba superada! Pasas a la etapa ${s.stage}.`; }
        else if (s.k < RANGES - 1) { s.k++; s.stage = 1; s.day = 0; s.goalsDone = (s.goalsDone || 0) + 1; msg = `¡Meta de ${s.k * R.goal} conseguida! Empieza el rango ${rangeLbl(key, s.k)}.`; }
        else { s.goalsDone = (s.goalsDone || 0) + 1; msg = '¡Completaste el último rango!'; }
      } else { s.day = Math.max(0, s.day - 3); msg = `Hiciste ${total} de ${target}. Repite las últimas sesiones y vuelve a intentarlo.`; }
      s.nextAt = addDays(Date.now(), 2);
    } else {
      s.nextAt = addDays(Date.now(), d.next);
      s.day = Math.min(days.length - 1, s.day + 1);
      msg = `Próximo entrenamiento: ${whenStr(s.nextAt)}${days[s.day].test ? ' (prueba)' : ''}.`;
    }
  }
  setRetos(all);
  // historial y logros
  const h = PS.get('history', []);
  const rp = { sq: 0, pu: 0, ab: 0, bu: 0, pl: 0, dm: 0 }; rp[R.rep] = total;
  h.unshift({ at: Date.now(), start: RP.t0, secs, full: !partial, w: { kind: 'reto', reto: key, title: `${R.n} · ${RP.initial ? 'prueba inicial' : d.test ? 'prueba' : 'día ' + ((s.log.slice(-1)[0] || {}).day + 1)}`, sets: reps, rounds: [] }, reps: rp });
  PS.set('history', h.slice(0, 400));
  beep(784, 150, .25); setTimeout(() => beep(1046, 350, .3), 170);
  if (!partial) say(`¡Terminaste! ${total} ${R.n.toLowerCase()}. Buen trabajo.`);
  sheet(`<div class="big-check" style="margin:8px auto 10px"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg></div>
    <h3 style="text-align:center">${total} ${R.n.toLowerCase()}</h3>
    <p class="sub" style="text-align:center">${reps.join(' · ')} · ${fmt(secs)} min</p>
    <p class="note" style="text-align:center">${esc(msg)}</p><div style="height:16px"></div>
    <button class="btn" id="rf-ok">Listo</button>`, () => { $('#rf-ok').onclick = () => { closeSheet(); renderPlans(); }; });
  renderPlans();
  setTimeout(() => checkAwards(true), 800);
}
// controles del reproductor del reto
$('#rp-tap').onclick = e => { if (e.target.closest('button')) return; if (RP.phase === 'work') rCount(1); };
$('#rp-minus').onclick = () => rCount(-1);
$('#rp-done').onclick = () => {
  if (RP.phase === 'rest') { RP.restEnd = performance.now(); return; }
  if (RP.d.test || RP.set === RP.d.sets.length - 1) { rFinish(); return; }
  rEndSet();
};
$('#rp-pause').onclick = async () => {
  // al reanudar tras un cierre de la app, los sensores se vuelven a pedir con este toque
  if (RP.paused && !RP.sensOn && RP.wantSens && await motionPermission()) { RP.det = makeDetector(RP.key, RP.mode, RP.sens); window.addEventListener('devicemotion', onMotion); RP.sensOn = true; }
  RP.paused = !RP.paused; if (!RP.paused && RP.phase === 'rest') RP.restEnd += 0; say(RP.paused ? 'Pausa' : 'Seguimos'); rRender(); };
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
  PS.set('rsession', { key: RP.key, d: RP.d, set: RP.set, count: RP.count, done: RP.done, phase: RP.phase, restLeft: RP.phase === 'rest' ? Math.max(0, RP.restEnd - performance.now()) : 0,
    initial: RP.initial, mode: RP.mode, sens: RP.sens, t0: RP.t0, active: RP.active, sensWanted: sensorMode(RP.key, RP.mode), savedAt: Date.now() });
}
function resumeReto(x) {
  const R = RETOS[x.key]; if (!R) { PS.del('rsession'); return false; }
  Object.assign(RP, { key: x.key, s: getRetos()[x.key], d: x.d, set: x.set, count: x.count, extra: 0, done: x.done || [], phase: x.phase === 'rest' ? 'rest' : 'work',
    restEnd: performance.now() + (x.restLeft || 0), initial: !!x.initial, mode: x.mode, sens: x.sens || 3, t0: x.t0, active: x.active || 0, lastTick: performance.now(), paused: true,
    sensOn: false, det: null, wantSens: !!x.sensWanted });
  if (!RP.initial && !RP.s) { PS.del('rsession'); return false; }
  $('#rplayer').classList.remove('hidden'); document.body.style.overflow = 'hidden'; wake(true);
  clearInterval(RP.timer); RP.timer = setInterval(rTick, 200);
  rRender(); toast('Reto retomado donde quedó · toca Seguir');
  return true;
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') rSave(); });
window.addEventListener('pagehide', rSave);
