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
  db_hammer_curl: { n: 'Curl martillo', p: 'a', d: 'Mancuernas con las palmas mirándose (agarre neutro): sube doblando los codos sin moverlos del costado y baja lento.', r: 0.13 },
  db_lateral_raise: { n: 'Elevaciones laterales', p: 'u', d: 'Sube los brazos hacia los lados hasta la altura de los hombros, codos apenas flexionados, y baja lento.', r: 0.06 },
  db_triceps_ext: { n: 'Extensión de tríceps sobre la cabeza', p: 'a', d: 'Una mancuerna con las dos manos sobre la cabeza: baja por detrás doblando los codos y vuelve a estirar.', one: 1, r: 0.15 },
  db_thruster: { n: 'Sentadilla con press', p: 'lgu', d: 'Mancuernas en los hombros: baja en sentadilla y al subir empuja las mancuernas por encima de la cabeza.', r: 0.10 },
  db_calf_raise: { n: 'Elevación de talones con mancuernas', p: 'l', d: 'Una mancuerna en cada mano: sube a puntillas y baja lento.', r: 0.30 },
};
// el catálogo general las incluye (biblioteca, estadísticas, voz)
Object.entries(DB_EX).forEach(([id, e]) => { CATALOG[id] = { n: e.n, p: e.p, lv: id === 'db_thruster' ? 2 : 1, j: 0, t: 'x', d: e.d, db: 1 }; });
// grupo para mezclar en los circuitos del coach («Con mancuernas»)
const DB_POOL = Object.keys(DB_EX).filter(id => id !== 'db_calf_raise').map(ex);

/* ---------- Prueba de fuerza ---------- */
// 4 ejercicios base: con el peso elegido, todas las repeticiones posibles con buena técnica.
// 1RM estimado (Epley) = kg × (1 + reps/30); el resto de ejercicios se deduce de su grupo.
const DB_TEST = [
  { id: 'db_goblet_squat', n: 'Piernas', from: ['db_rdl', 'db_lunge', 'db_calf_raise'] },
  { id: 'db_floor_press', n: 'Empuje', from: ['db_triceps_ext'] },
  { id: 'db_row', n: 'Tirón', from: ['db_curl', 'db_hammer_curl'] },
  { id: 'db_shoulder_press', n: 'Hombros', from: ['db_lateral_raise'] },
];
const dbBase = id => (S.weight || 70) * DB_EX[id].r * (PROFILE.variant === 'm' ? 1 : 0.7);
function dbApplyTest(st, res) {
  const e1 = { ...(st.e1 || dbInitE1(st.level || 1)) }, rel = [];
  DB_TEST.forEach(t => {
    const r = res[t.id]; if (!r || !(r.reps > 0)) return;
    const v = r.kg * (1 + Math.min(30, r.reps) / 30);
    e1[t.id] = Math.round(v * 2) / 2; rel.push(v / dbBase(t.id));
    t.from.forEach(x => { e1[x] = Math.round(v * DB_EX[x].r / DB_EX[t.id].r * 2) / 2; });
  });
  if (res.db_goblet_squat && res.db_shoulder_press) e1.db_thruster = Math.round(Math.min(e1.db_goblet_squat * DB_EX.db_thruster.r / DB_EX.db_goblet_squat.r, e1.db_shoulder_press * DB_EX.db_thruster.r / DB_EX.db_shoulder_press.r) * 2) / 2;
  const avg = rel.length ? rel.reduce((a, b) => a + b, 0) / rel.length : 1;
  const level = avg < 0.9 ? 1 : avg < 1.15 ? 2 : 3;
  return { e1, level, avg };
}
function openDbTest() {
  const st = getDumb(); if (!st) return;
  const ws = dbWeights(st), res = {};
  DB_TEST.forEach(t => { res[t.id] = { kg: dbSuggest(t.id, st), reps: '' }; });
  const rows = () => DB_TEST.map(t => `<div class="dbt"><div class="t"><b>${esc(DB_EX[t.id].n)}</b><small>${t.n}${DB_EX[t.id].one ? ' · una mancuerna' : ''}</small></div>
    <div class="dbt-c"><div class="ask"><button data-k="${t.id}" data-a="-1" aria-label="Menos peso">−</button><span class="kg">${fmtKg(res[t.id].kg)}<small>kg</small></span><button data-k="${t.id}" data-a="1" aria-label="Más peso">+</button></div>
    <label class="reps"><input type="number" inputmode="numeric" min="0" max="60" data-r="${t.id}" value="${res[t.id].reps}" placeholder="0"><small>reps</small></label></div></div>`).join('');
  sheet(`<h3>Prueba de fuerza</h3>
    <p class="sub">Cuatro ejercicios. Con cada uno haz todas las repeticiones que puedas <b>con buena técnica</b> (para cuando la última te cueste de verdad) y anota cuántas. Descansa 2 minutos entre uno y otro.</p>
    <p class="note">Elige un peso con el que creas que llegas a 8–15. Si pasas de 20, la próxima vez usa uno más pesado: el cálculo es más preciso entre 5 y 15.</p>
    <div class="block" id="dbt-rows">${rows()}</div>
    <button class="btn" id="dbt-ok">Calcular mi nivel</button>`, () => {
    const box = $('#dbt-rows');
    box.onclick = e => { const b = e.target.closest('[data-a]'); if (!b) return; const id = b.dataset.k, i = ws.indexOf(res[id].kg); res[id].kg = ws[Math.max(0, Math.min(ws.length - 1, (i < 0 ? 0 : i) + +b.dataset.a))]; box.querySelectorAll('[data-r]').forEach(x => res[x.dataset.r].reps = x.value); box.innerHTML = rows(); };
    box.oninput = e => { const x = e.target.closest('[data-r]'); if (x) res[x.dataset.r].reps = x.value; };
    $('#dbt-ok').onclick = () => {
      const r = {}; let n = 0;
      DB_TEST.forEach(t => { const v = parseInt(res[t.id].reps, 10); if (v > 0) { r[t.id] = { kg: res[t.id].kg, reps: Math.min(60, v) }; n++; } });
      if (!n) { toast('Anota las repeticiones de al menos un ejercicio'); return; }
      const s2 = getDumb(), out = dbApplyTest(s2, r), before = s2.level;
      s2.e1 = out.e1; s2.level = out.level; delete s2.e1Before;
      s2.tests = [{ at: Date.now(), res: r }, ...(s2.tests || [])].slice(0, 20);
      setDumb(s2); renderDumb();
      sheet(`<h3>Listo</h3><p class="sub">Nivel <b>${DB_LV[out.level - 1].toLowerCase()}</b>${before !== out.level ? ` (antes: ${DB_LV[before - 1].toLowerCase()})` : ''}.</p>
        <div class="block">${DB_TEST.filter(t => r[t.id]).map(t => `<div class="hist"><div class="t"><b>${esc(DB_EX[t.id].n)}</b><small>${r[t.id].reps} reps con ${fmtKg(r[t.id].kg)} kg</small></div><span class="tag">~${fmtKg(s2.e1[t.id])} kg máx.</span></div>`).join('')}</div>
        <p class="note">Desde ahora las repeticiones de cada sesión se calculan con estos datos. Conviene repetir la prueba cada 6 semanas.${n < 4 ? ' Los grupos que no probaste siguen con la estimación anterior.' : ''}</p>
        <div style="height:12px"></div><button class="btn" id="dbt-done">Ver mi próxima sesión</button>`, () => { $('#dbt-done').onclick = () => { closeSheet(); openDbStart(); }; });
    };
  });
}

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
  const tst = (st.tests || [])[0], old = tst && Date.now() - tst.at > 42 * DAY;
  el.innerHTML = `<div class="now dumb"><div class="wk">Mancuernas · ${DB_LV[(st.level || 1) - 1]}</div><b class="name">${s.n}</b>
    <p class="sub">${s.ids.map(id => esc(DB_EX[id].n)).join(' · ')}</p>
    <p class="note">${due ? 'Toca hoy.' : 'Próxima: ' + esc(whenStr(st.nextAt)) + '.'} ${DB_SETS[(st.level || 1) - 1]} series por ejercicio.</p><div class="gap"></div>
    <div class="row"><button class="btn ${due ? '' : 'ghost'}" id="db-go">${due ? 'Empezar' : 'Entrenar igual'}</button><button class="btn ghost" id="db-cfg">Ajustes</button></div>
    ${tst ? `<p class="note">Prueba de fuerza del ${dateStr(tst.at)}${old ? ' · <b>conviene repetirla</b>' : ''}</p>` : '<p class="note">Sin prueba de fuerza: los pesos se estiman con tu peso corporal y se corrigen con tus respuestas.</p>'}
    <button class="btn ghost small" id="db-test" style="margin-top:8px">${tst ? 'Repetir prueba de fuerza' : 'Medir mi nivel'}</button></div>`;
  $('#db-go').onclick = () => openDbStart();
  $('#db-test').onclick = () => openDbTest();
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
    ${edit ? '' : '<p class="note">Después te propongo una prueba de fuerza de 4 ejercicios para calcular tu nivel real. Si no la haces, parto de una estimación por tu peso corporal y el nivel elegido.</p>'}
    <div style="height:14px"></div><button class="btn" id="dbs-ok">${edit ? 'Guardar' : 'Crear y medir mi nivel'}</button>
    ${edit ? '' : '<div class="gap"></div><button class="btn ghost small" id="dbs-skip">Crear sin prueba</button>'}
    ${edit ? '<div class="gap"></div><button class="btn danger" id="dbs-off">Desactivar mancuernas</button>' : ''}`, () => {
    bindSeg('dbs-lv', 'v', v => { lv = +v; });
    const create = test => {
      const ws = [...new Set($('#dbs-w').value.split(/[;,\s]+/).map(x => parseFloat(x.replace(',', '.'))).filter(x => x > 0 && x <= 60))].sort((a, b) => a - b);
      if (!ws.length) { toast('Escribe al menos un peso'); return; }
      const cur = getDumb();
      const nst = cur ? { ...cur, weights: ws, level: lv } : { level: lv, weights: ws, e1: dbInitE1(lv), type: 'A', sessions: 0, nextAt: dayStart(Date.now()), created: Date.now() };
      if (cur && cur.level !== lv) { const f = [0.8, 1, 1.25][lv - 1] / [0.8, 1, 1.25][cur.level - 1]; Object.keys(nst.e1).forEach(k => nst.e1[k] = Math.round(nst.e1[k] * f * 2) / 2); }
      setDumb(nst); closeSheet(); renderDumb();
      if (test) openDbTest(); else toast(edit ? 'Guardado' : 'Sesiones creadas · aparecen en el calendario');
    };
    $('#dbs-ok').onclick = () => create(!edit);
    const sk = $('#dbs-skip'); if (sk) sk.onclick = () => create(false);
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
  if (!w || !full) return;
  const tomorrow = addDays(Date.now(), 1);
  if (w.kind !== 'db') {
    // tras un HIIT (coach, entrenador inteligente o plan) las mancuernas pasan a mañana
    const sd = getDumb();
    if (sd && (w.kind === 'coach' || w.kind === 'plan') && P.activeMs >= 8 * 60e3 && (sd.nextAt || 0) < tomorrow) { sd.nextAt = tomorrow; setDumb(sd); renderDumb(); }
    return;
  }
  // tras mancuernas, el entrenador inteligente pasa a mañana
  const sm = getSmart(); if (sm && sm.I && (sm.nextAt || 0) < tomorrow) { sm.nextAt = tomorrow; setSmart(sm); }
  const st = getDumb(); if (!st) return;
  st.sessions = (st.sessions || 0) + 1; st.type = st.type === 'A' ? 'B' : 'A';
  st.nextAt = dbFreeDay(addDays(Date.now(), 2)); st.lastIds = w.items.map(x => x.id); st.fbDone = false;
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
  (lastDone.w.items || []).forEach(it => { if (st.e1[it.id] && it.kg) st.e1[it.id] = Math.round(st.e1[it.id] * (DB_FB[fb] || 1) * 2) / 2; });
  setDumb(st);
  const msg = $('#fb-msg');
  if (msg) { msg.innerHTML = `${fb === 'hard' ? 'La próxima vez te propongo menos repeticiones con el mismo peso.' : fb === 'easy' ? 'La próxima vez te propongo más repeticiones o más peso.' : 'Subo un poco la exigencia para la próxima.'} Siguiente: <b>${esc(DB_SESS[st.type].n)}</b>, ${esc(whenStr(st.nextAt))}.`; msg.classList.remove('hidden'); }
};
const _rdeDb = renderDoneExtras;
renderDoneExtras = function (full, secs) {
  const st = getDumb(); if (st) { delete st.e1Before; setDumb(st); }
  _rdeDb(full, secs);
  const w = P.w; if (w && w.kind === 'db') {
    const kg = w.items.reduce((a, it) => a + (it.kg || 0) * it.reps * it.sets * (DB_EX[it.id] && DB_EX[it.id].one ? 1 : 2), 0);
    $('#d-stats').innerHTML = `<div class="stat"><b>${fmt(secs)}</b><span>tiempo activo</span></div><div class="stat"><b>${w.items.length}</b><span>ejercicios</span></div><div class="stat"><b>${Math.round(kg).toLocaleString('es')}</b><span>kg movidos</span></div>`;
  }
};

/* ---------- Calendario ---------- */
// Con el entrenador inteligente o un plan activos, las mancuernas van a días sin HIIT
// (como mucho se corren 2 días; si el plan no deja huecos, se comparten).
const busyDay = (ag, t) => (ag[dkey(t)] || []).some(x => x.type === 'smart' || x.type === 'plan');
function dbFreeDay(t, ag) {
  if (dayStart(t) <= dayStart(Date.now())) return t;   // hoy no se mueve: el que hagas primero corre al otro a mañana
  ag = ag || _agDb();
  for (let i = 0; i < 3; i++) { const d = addDays(t, i); if (!busyDay(ag, d)) return d; }
  return t;
}
const _agDb = buildAgenda;
buildAgenda = function () {
  const ag = _agDb(), st = getDumb(); if (!st) return ag;
  const today = dayStart(Date.now());
  let t = dbFreeDay(Math.max(today, dayStart(st.nextAt || Date.now())), ag), ty = st.type || 'A';
  for (let c = 0; c < 20 && t <= addDays(today, HORIZON); c++) { const k = dkey(t); (ag[k] = ag[k] || []).push({ type: 'db', ty, first: c === 0 }); t = dbFreeDay(addDays(t, 2), ag); ty = ty === 'A' ? 'B' : 'A'; }
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
