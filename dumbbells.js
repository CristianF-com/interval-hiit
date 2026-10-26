'use strict';
/* =========================================================
   Entrenador con mancuernas: arma las sesiones (A/B, día por medio),
   las pone en el calendario y, al empezar, calcula las repeticiones
   según el peso de mancuerna que elijas para mantener el nivel.
   ========================================================= */
const DB_EX = {
  db_goblet_squat: { n: 'Sentadilla goblet', p: 'lg', d: 'Sujeta una mancuerna vertical contra el pecho y baja en sentadilla con el pecho erguido.', one: 1, r: 0.30 },
  db_rdl: { n: 'Peso muerto rumano con mancuernas', p: 'gl', d: 'Rodillas apenas flexionadas, lleva la cadera atrás y baja las mancuernas pegadas a las piernas con la espalda recta.', r: 0.25 },
  db_lunge: { n: 'Zancada con mancuernas', p: 'lg', d: 'Una mancuerna en cada mano, brazos colgando. Paso atrás y baja la rodilla casi al suelo. Alterna.', r: 0.15 },
  db_row: { n: 'Remo con mancuernas', p: 'ua', d: 'Inclinado con la espalda recta, tira de las mancuernas hacia la cintura llevando los codos atrás.', r: 0.22 },
  db_floor_press: { n: 'Press de pecho en el suelo', p: 'ua', d: 'Tumbado boca arriba con rodillas flexionadas, empuja las mancuernas hacia el techo y baja hasta apoyar los codos.', r: 0.20 },
  db_shoulder_press: { n: 'Press de hombros', p: 'ua', d: 'De pie, mancuernas a la altura de los hombros: empuja hacia arriba hasta estirar los brazos y baja controlando.', r: 0.13 },
  db_curl: { n: 'Curl de bíceps', p: 'a', d: 'Codos pegados al cuerpo, sube las mancuernas doblando los codos y baja lento.', r: 0.12 },
  db_lateral_raise: { n: 'Elevaciones laterales', p: 'u', d: 'Sube los brazos hacia los lados hasta la altura de los hombros, codos apenas flexionados, y baja lento.', r: 0.06 },
  db_triceps_ext: { n: 'Extensión de tríceps sobre la cabeza', p: 'a', d: 'Una mancuerna con las dos manos sobre la cabeza: baja por detrás doblando los codos y vuelve a estirar.', one: 1, r: 0.15 },
  db_thruster: { n: 'Sentadilla con press', p: 'lgu', d: 'Mancuernas en los hombros: baja en sentadilla y al subir empuja las mancuernas por encima de la cabeza.', r: 0.10 },
  db_calf_raise: { n: 'Elevación de talones con mancuernas', p: 'l', d: 'Una mancuerna en cada mano: sube a puntillas y baja lento.', r: 0.30 },
};
// el catálogo general las incluye (biblioteca, estadísticas, voz)
Object.entries(DB_EX).forEach(([id, e]) => { CATALOG[id] = { n: e.n, p: e.p, lv: 2, j: 0, t: 'x', d: e.d, db: 1 }; });

const DB_SESS = {
  A: { n: 'Sesión A', ids: ['db_goblet_squat', 'db_floor_press', 'db_row', 'db_rdl', 'db_curl', 'db_lateral_raise'] },
  B: { n: 'Sesión B', ids: ['db_lunge', 'db_shoulder_press', 'db_row', 'db_rdl', 'db_triceps_ext', 'db_thruster'] },
};
const DB_LV = ['Principiante', 'Intermedio', 'Avanzado'];
const DB_SETS = [2, 3, 4], DB_REST = [60, 75, 90];
const getDumb = () => PS.get('dumb', null);
const setDumb = v => v ? PS.set('dumb', v) : PS.del('dumb');

// 1RM estimado inicial (kg por mancuerna) según tu peso, versión de planes y nivel
function dbInitE1(level) {
  const bw = S.weight || 70, sx = PROFILE.variant === 'm' ? 1 : 0.7, lf = [0.8, 1, 1.25][level - 1];
  const e = {}; Object.entries(DB_EX).forEach(([id, x]) => { e[id] = Math.round(bw * x.r * sx * lf * 2) / 2; }); return e;
}
// repeticiones para un peso: deja ~25 % de margen sobre las máximas (fórmula de Epley invertida)
function dbReps(id, kg, st) {
  const e1 = (st.e1 || {})[id] || 5, max = 30 * (e1 / Math.max(0.5, kg) - 1);
  let reps = Math.round(max * 0.72), warn = '';
  if (max < 8) { warn = 'heavy'; reps = Math.max(3, Math.round(max * 0.8)); }
  else if (reps > 20) { warn = 'light'; reps = 20; }
  reps = Math.max(3, Math.min(20, reps));
  return { reps, warn };
}
const dbWeights = st => (st.weights && st.weights.length ? st.weights : [2, 4, 6, 8, 10]).slice().sort((a, b) => a - b);
// peso sugerido: el disponible que deja unas 12 repeticiones
function dbSuggest(id, st) {
  const ws = dbWeights(st); let best = ws[0], bd = 1e9;
  ws.forEach(w => { const r = dbReps(id, w, st); const d = Math.abs(r.reps - 12) + (r.warn === 'heavy' ? 20 : 0) + (r.warn === 'light' ? 6 : 0); if (d < bd) { bd = d; best = w; } });
  return best;
}
function dbWorkout(st, kgs) {
  const s = DB_SESS[st.type || 'A'], lv = st.level || 1;
  const items = s.ids.map(id => { const kg = kgs[id]; const r = dbReps(id, kg, st); return { id, kg, reps: r.reps, sets: DB_SETS[lv - 1], rest: DB_REST[lv - 1], warn: r.warn }; });
  return { kind: 'db', type: st.type || 'A', title: `Mancuernas · ${s.n}`, level: lv, items, restEx: 90, warm: S.planWarm ? shuffle(WARM).slice(0, 4) : [], cool: [], rounds: [] };
}

/* ---------- Tarjeta en el Coach ---------- */
function renderDumb() {
  const el = $('#dumb'); if (!el || !PROFILE) return;
  const st = getDumb();
  if (!st) {
    el.innerHTML = `<div class="now dumb"><div class="wk">Entrenador con mancuernas</div><b class="name">Fuerza en casa</b>
      <p class="sub">Arma dos sesiones que se alternan, una cada dos días, y las pone en el calendario. Al empezar eliges el peso de tus mancuernas y calcula las repeticiones para mantener el nivel.</p>
      <div class="gap"></div><button class="btn" id="db-setup">Empezar con mancuernas</button></div>`;
    $('#db-setup').onclick = () => openDbSetup();
    return;
  }
  const s = DB_SESS[st.type || 'A'], due = Date.now() >= (st.nextAt || 0);
  el.innerHTML = `<div class="now dumb"><div class="wk">Mancuernas · ${DB_LV[(st.level || 1) - 1]}</div><b class="name">${s.n}</b>
    <p class="sub">${s.ids.map(id => esc(DB_EX[id].n)).join(' · ')}</p>
    <p class="note">${due ? 'Toca hoy.' : 'Próxima: ' + esc(whenStr(st.nextAt)) + '.'} ${DB_SETS[(st.level || 1) - 1]} series por ejercicio.</p><div class="gap"></div>
    <div class="row"><button class="btn ${due ? '' : 'ghost'}" id="db-go">${due ? 'Empezar' : 'Entrenar igual'}</button><button class="btn ghost" id="db-cfg">Ajustes</button></div></div>`;
  $('#db-go').onclick = () => openDbStart();
  $('#db-cfg').onclick = () => openDbSetup(true);
}
function openDbSetup(edit) {
  const st = getDumb(); let lv = st ? st.level : Math.min(3, S.level || 1);
  sheet(`<h3>Mancuernas</h3>
    <p class="sub">Dos sesiones de cuerpo completo que se alternan (A y B), un día sí y otro no.</p>
    <h2>Nivel</h2><div class="seg" id="dbs-lv">${DB_LV.map((n, i) => `<button data-v="${i + 1}" aria-pressed="${lv === i + 1}">${n}</button>`).join('')}</div>
    <h2>Pesos que tienes (kg por mancuerna)</h2>
    <div class="field"><input id="dbs-w" inputmode="decimal" value="${esc(dbWeights(st || {}).map(fmtKg).join(', '))}" placeholder="2, 4, 6, 8"></div>
    <p class="note">Escríbelos separados por comas. Si son ajustables, pon los pesos que puedes armar.${S.weight ? '' : ' <b>Carga tu peso en Perfil → Editar actual</b> para que los primeros cálculos sean más precisos.'}</p>
    <div style="height:14px"></div><button class="btn" id="dbs-ok">${edit ? 'Guardar' : 'Crear mis sesiones'}</button>
    ${edit ? '<div class="gap"></div><button class="btn danger" id="dbs-off">Desactivar mancuernas</button>' : ''}`, () => {
    bindSeg('dbs-lv', 'v', v => { lv = +v; });
    $('#dbs-ok').onclick = () => {
      const ws = [...new Set($('#dbs-w').value.split(/[;,\s]+/).map(x => parseFloat(x.replace(',', '.'))).filter(x => x > 0 && x <= 60))].sort((a, b) => a - b);
      if (!ws.length) { toast('Escribe al menos un peso'); return; }
      const cur = getDumb();
      const nst = cur ? { ...cur, weights: ws, level: lv } : { level: lv, weights: ws, e1: dbInitE1(lv), type: 'A', sessions: 0, nextAt: dayStart(Date.now()), created: Date.now() };
      if (cur && cur.level !== lv) { const f = [0.8, 1, 1.25][lv - 1] / [0.8, 1, 1.25][cur.level - 1]; Object.keys(nst.e1).forEach(k => nst.e1[k] = Math.round(nst.e1[k] * f * 2) / 2); }
      setDumb(nst); closeSheet(); renderDumb(); toast(edit ? 'Guardado' : 'Sesiones creadas · aparecen en el calendario');
    };
    const off = $('#dbs-off'); if (off) off.onclick = async () => { if (await askApp('Desactivar mancuernas', 'Se borran tus pesos y el progreso de fuerza. El historial se mantiene.', 'Desactivar', true)) { setDumb(null); renderDumb(); } };
  });
}
/* ---------- Elegir el peso al empezar ---------- */
function openDbStart() {
  const st = getDumb(); if (!st) { openDbSetup(); return; }
  const s = DB_SESS[st.type || 'A'], ws = dbWeights(st);
  const kgs = {}; s.ids.forEach(id => { kgs[id] = (st.lastKg || {})[id] && ws.includes(st.lastKg[id]) ? st.lastKg[id] : dbSuggest(id, st); });
  const rows = () => s.ids.map(id => { const r = dbReps(id, kgs[id], st);
    return `<div class="dbr"><div class="t"><b>${esc(DB_EX[id].n)}</b><small>${DB_SETS[(st.level || 1) - 1]} × ${r.reps} rep${r.warn === 'heavy' ? ' · <em class="warn">pesada para ti</em>' : r.warn === 'light' ? ' · <em class="warn">liviana: hazlas lentas</em>' : ''}${DB_EX[id].one ? ' · una mancuerna' : ''}</small></div>
      <div class="ask"><button data-k="${id}" data-a="-1" aria-label="Menos peso">−</button><span class="kg">${fmtKg(kgs[id])}<small>kg</small></span><button data-k="${id}" data-a="1" aria-label="Más peso">+</button></div></div>`; }).join('');
  sheet(`<h3>${s.n}</h3><p class="sub">Elige el peso de mancuerna. Las repeticiones se ajustan para mantener el nivel.</p>
    <h2>Mismo peso para todo</h2><div class="chips" id="dbw-all">${ws.map(w => `<button class="chip" data-w="${w}" aria-pressed="false">${fmtKg(w)} kg</button>`).join('')}</div>
    <h2>Por ejercicio</h2><div class="block" id="dbw-rows">${rows()}</div>
    <button class="btn" id="dbw-go">Empezar</button>`, () => {
    const redraw = () => { $('#dbw-rows').innerHTML = rows(); const v = kgs[s.ids[0]], same = s.ids.every(id => kgs[id] === v); $('#dbw-all').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', same && +b.dataset.w === v)); };
    $('#dbw-all').onclick = e => { const b = e.target.closest('[data-w]'); if (!b) return; s.ids.forEach(id => kgs[id] = +b.dataset.w); redraw(); };
    $('#dbw-rows').onclick = e => { const b = e.target.closest('[data-a]'); if (!b) return; const id = b.dataset.k, i = ws.indexOf(kgs[id]); kgs[id] = ws[Math.max(0, Math.min(ws.length - 1, i + +b.dataset.a))]; redraw(); };
    redraw();
    $('#dbw-go').onclick = () => { const st2 = getDumb(); st2.lastKg = { ...(st2.lastKg || {}), ...kgs }; setDumb(st2); closeSheet(); startWorkout(dbWorkout(st2, kgs)); };
  });
}
/* ---------- Al terminar: próxima sesión y ajuste según cómo te fue ---------- */
const DB_FB = { easy: 1.06, ok: 1.03, hard: 0.94 };
const _finishDb = finish;
finish = function (full, reason) {
  const w = P.w;
  _finishDb(full, reason);
  if (!w || w.kind !== 'db' || !full) return;
  const st = getDumb(); if (!st) return;
  st.sessions = (st.sessions || 0) + 1; st.type = st.type === 'A' ? 'B' : 'A';
  st.nextAt = addDays(Date.now(), 2); st.lastIds = w.items.map(x => x.id); st.fbDone = false;
  setDumb(st); renderDumb();
};
const _setFeedbackDb = setFeedback;
setFeedback = function (fb) {
  if (!lastDone || lastDone.w.kind !== 'db') return _setFeedbackDb(fb);
  lastDone.fb = fb;
  const h = PS.get('history', []); if (h[0] && h[0].at >= lastDone.at - 1000) { h[0].fb = fb; PS.set('history', h); }
  const st = getDumb(); if (!st) return;
  if (!st.e1Before) st.e1Before = { ...st.e1 };
  st.e1 = { ...st.e1Before };                    // cambiar la respuesta no suma dos veces
  (lastDone.w.items || []).forEach(it => { st.e1[it.id] = Math.round(st.e1[it.id] * (DB_FB[fb] || 1) * 2) / 2; });
  setDumb(st);
  const msg = $('#fb-msg');
  if (msg) { msg.innerHTML = `${fb === 'hard' ? 'La próxima vez te propongo menos repeticiones con el mismo peso.' : fb === 'easy' ? 'La próxima vez te propongo más repeticiones o más peso.' : 'Subo un poco la exigencia para la próxima.'} Siguiente: <b>${esc(DB_SESS[st.type].n)}</b>, ${esc(whenStr(st.nextAt))}.`; msg.classList.remove('hidden'); }
};
const _rdeDb = renderDoneExtras;
renderDoneExtras = function (full, secs) {
  const st = getDumb(); if (st) { delete st.e1Before; setDumb(st); }
  _rdeDb(full, secs);
  const w = P.w; if (w && w.kind === 'db') {
    const kg = w.items.reduce((a, it) => a + it.kg * it.reps * it.sets * (DB_EX[it.id].one ? 1 : 2), 0);
    $('#d-stats').innerHTML = `<div class="stat"><b>${fmt(secs)}</b><span>tiempo activo</span></div><div class="stat"><b>${w.items.length}</b><span>ejercicios</span></div><div class="stat"><b>${Math.round(kg).toLocaleString('es')}</b><span>kg movidos</span></div>`;
  }
};

/* ---------- Calendario ---------- */
const _agDb = buildAgenda;
buildAgenda = function () {
  const ag = _agDb(), st = getDumb(); if (!st) return ag;
  const today = dayStart(Date.now());
  let t = Math.max(today, dayStart(st.nextAt || Date.now())), ty = st.type || 'A';
  for (let c = 0; c < 20 && t <= addDays(today, HORIZON); c++) { const k = dkey(t); (ag[k] = ag[k] || []).push({ type: 'db', ty, first: c === 0 }); t = addDays(t, 2); ty = ty === 'A' ? 'B' : 'A'; }
  return ag;
};
const _itDb = itemTitle, _isDb = itemSub;
itemTitle = x => x.type === 'db' ? `Mancuernas · ${DB_SESS[x.ty].n}` : _itDb(x);
itemSub = x => x.type === 'db' ? DB_SESS[x.ty].ids.map(id => DB_EX[id].n.split(' ')[0]).join(' · ') : _isDb(x);
const _oaDb = openAgendaItem;
openAgendaItem = function (o) {
  if (o.type !== 'db') return _oaDb(o);
  const st = getDumb(); if (!st) return;
  const t = o.t != null ? o.t : Date.now(), isToday = dkey(t) === dkey(Date.now()), when = isToday ? 'hoy' : new Date(t).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
  sheet(`<h3>${esc(itemTitle(o))}</h3><p class="sub">Programada para ${esc(when)} · ${DB_LV[(st.level || 1) - 1]}</p>
    <div class="block">${DB_SESS[o.ty].ids.map((id, i) => exRow(id, i, '', `${DB_SETS[(st.level || 1) - 1]} series`)).join('')}</div>
    ${o.first ? `<button class="btn" id="ai-go">${isToday || Date.now() >= (st.nextAt || 0) ? 'Empezar' : 'Hacerla ahora'}</button><div class="gap"></div>
      <div class="row"><button class="btn ghost small" id="ai-post">Pasar al día siguiente</button><button class="btn ghost small" id="ai-skip">Saltar esta sesión</button></div>` : '<p class="note">Las repeticiones se calculan al empezar, según el peso que elijas.</p>'}
    <div class="gap"></div><button class="btn danger" id="ai-quit">Desactivar mancuernas</button>`, () => {
    const go = $('#ai-go'); if (go) go.onclick = () => { closeSheet(); openDbStart(); };
    const po = $('#ai-post'); if (po) po.onclick = () => { const s2 = getDumb(); s2.nextAt = addDays(Math.max(Date.now(), s2.nextAt || 0), 1); setDumb(s2); closeSheet(); renderCal(); toast('Sesión pasada al ' + WDN[wdOf(s2.nextAt)]); };
    const sk = $('#ai-skip'); if (sk) sk.onclick = () => confirmApp('¿Saltar esta sesión?', 'Se pasa a la siguiente sesión, dentro de dos días.', 'Saltar', () => { const s2 = getDumb(); s2.type = s2.type === 'A' ? 'B' : 'A'; s2.nextAt = addDays(Math.max(Date.now(), s2.nextAt || 0), 2); setDumb(s2); closeSheet(); renderCal(); renderDumb(); toast('Sesión saltada'); });
    $('#ai-quit').onclick = () => confirmApp('¿Desactivar mancuernas?', 'Se borran tus pesos y el progreso de fuerza. El historial se mantiene.', 'Desactivar', () => { setDumb(null); closeSheet(); renderCal(); renderDumb(); }, true);
  });
};
// la tarjeta se actualiza con el resto del Coach
const _rsDb = renderSmart;
renderSmart = function () { _rsDb(); try { renderDumb(); } catch (e) { console.error(e); } };
renderDumb();
