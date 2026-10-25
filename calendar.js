'use strict';
/* =========================================================
   Calendario: entrenamientos hechos y próximos (plan y entrenador)
   ========================================================= */
const WD = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];          // lunes = 0
const WDN = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const wdOf = t => (new Date(t).getDay() + 6) % 7;
const dkey = t => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const addDays = (t, n) => { const d = new Date(dayStart(t)); d.setDate(d.getDate() + n); return d.getTime(); };
const DEF_WD = { 1: [2], 2: [1, 4], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
const planWeekdays = p => (p.weekdays && p.weekdays.length) ? p.weekdays : DEF_WD[p.days] || DEF_WD[3];
const HORIZON = 120;

// Días del plan pendientes en orden: semana actual y siguientes
function planPending(p) {
  const fam = FAM[p.fam], out = [];
  for (let w = p.week; w <= fam.weeks; w++) {
    const { kept } = planWeekInfo(p, w);
    kept.forEach(i => { if (!p.done[`${w}-${i}`]) out.push({ week: w, day: i }); });
  }
  return out;
}
// Agenda completa: { 'AAAA-MM-DD': [items] }
function buildAgenda() {
  const ag = {}, push = (t, it) => { const k = dkey(t); (ag[k] = ag[k] || []).push(it); };
  const today = dayStart(Date.now());
  // hechos (historial)
  PS.get('history', []).forEach((x, i) => push(x.at, { type: 'done', i, x }));
  // plan: los pendientes ocupan, por orden, los días de entrenamiento elegidos
  const p = getPlan();
  if (p) {
    const wds = new Set(planWeekdays(p)), off = new Set(p.offDates || []);
    const doneToday = Object.values(p.done).some(d => dayStart(d.at) === today);
    const pend = planPending(p);
    let t = today, n = 0;
    while (pend.length && n++ < HORIZON * 2) {
      const k = dkey(t);
      if (wds.has(wdOf(t)) && !off.has(k) && !(t === today && doneToday)) { const d = pend.shift(); push(t, { type: 'plan', ...d }); }
      t = addDays(t, 1);
    }
  }
  // retos de repeticiones: sus próximos días según los descansos del programa
  const retos = typeof getRetos === 'function' ? getRetos() : {};
  Object.entries(retos).forEach(([key, s]) => {
    const days = retoDays(key, s.k, s.stage); let t = Math.max(today, dayStart(s.nextAt || Date.now()));
    for (let i = s.day; i < days.length && t <= addDays(today, HORIZON); i++) { push(t, { type: 'reto', key, i, first: i === s.day }); t = addDays(t, days[i].next); }
  });
  // entrenador inteligente: la próxima sesión y luego una cada dos días
  const sm = getSmart();
  if (sm && sm.I && sm.next) {
    let t = Math.max(today, dayStart(sm.nextAt || Date.now())), n = sm.next.smartN, f = sm.next.focus;
    for (let c = 0; c < 20 && t <= addDays(today, HORIZON); c++) {
      push(t, { type: 'smart', n, focus: f, first: c === 0 });
      t = addDays(t, 2); n++; f = (f + 1) % 3;
    }
  }
  return ag;
}

let calMonth = null, calSel = null;
function renderCal() {
  const el = $('#v-cal'); if (!el) return;
  const now = Date.now(), today = dkey(now);
  if (!calMonth) { const d = new Date(now); calMonth = new Date(d.getFullYear(), d.getMonth(), 1).getTime(); }
  if (!calSel) calSel = today;
  const ag = buildAgenda();
  const m = new Date(calMonth), y = m.getFullYear(), mo = m.getMonth();
  const first = new Date(y, mo, 1), lead = (first.getDay() + 6) % 7, nd = new Date(y, mo + 1, 0).getDate();
  let cells = '';
  for (let i = 0; i < lead; i++) cells += '<span class="cd blank"></span>';
  for (let d = 1; d <= nd; d++) {
    const t = new Date(y, mo, d).getTime(), k = dkey(t), its = ag[k] || [];
    const dots = [...new Set(its.map(x => x.type === 'done' ? (x.x.full ? 'ok' : 'part') : x.type))].map(c => `<i class="dt ${c}"></i>`).join('');
    cells += `<button class="cd ${k === today ? 'today' : ''} ${k === calSel ? 'sel' : ''} ${t < dayStart(now) ? 'past' : ''}" data-k="${k}"><b>${d}</b><span class="dots">${dots}</span></button>`;
  }
  const mname = m.toLocaleDateString('es', { month: 'long', year: 'numeric' });
  // próximos 14 días
  const up = [];
  for (let i = 0; i < 14; i++) { const t = addDays(now, i), k = dkey(t); (ag[k] || []).filter(x => x.type !== 'done').forEach(x => up.push({ t, k, x })); }
  const p = getPlan(), sm = getSmart();
  el.innerHTML = `<p class="hero">Calendario</p>
    <p class="sub">${p || (sm && sm.I) ? 'Tus próximos entrenamientos y los que ya hiciste.' : 'Empieza un plan o el entrenador inteligente para ver aquí tus próximos entrenamientos.'}</p>
    <div class="cal-h"><button class="icon-btn" id="cal-prev" aria-label="Mes anterior"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg></button>
      <b>${mname}</b><button class="icon-btn" id="cal-next" aria-label="Mes siguiente"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 5l7 7-7 7"/></svg></button></div>
    <div class="cal">${WD.map(w => `<span class="cw">${w}</span>`).join('')}${cells}</div>
    <div class="legend"><span><i class="dt plan"></i>Plan</span><span><i class="dt smart"></i>Entrenador</span><span><i class="dt reto"></i>Retos</span><span><i class="dt ok"></i>Hecho</span><span><i class="dt part"></i>Incompleto</span></div>
    <div id="cal-day"></div>
    <h2>Próximos 14 días</h2>
    ${up.length ? `<div class="block">${up.map(u => agendaRow(u.x, u.t)).join('')}</div>` : '<div class="empty">Nada programado en los próximos días.</div>'}
    ${p ? `<h2>Días de entrenamiento del plan</h2>
      <div class="wdpick" id="cal-wd">${WD.map((w, i) => `<button data-wd="${i}" aria-pressed="${planWeekdays(p).includes(i)}">${w}</button>`).join('')}</div>
      <p class="note">${esc(FAM[p.fam].n)} · ${dayRange(p.file).min === dayRange(p.file).max ? dayRange(p.file).max : dayRange(p.file).min + ' a ' + dayRange(p.file).max} días por semana. Los entrenamientos pendientes se reparten en estos días.</p>` : ''}`;
  renderCalDay(ag);
  $('#cal-prev').onclick = () => { const d = new Date(calMonth); calMonth = new Date(d.getFullYear(), d.getMonth() - 1, 1).getTime(); renderCal(); };
  $('#cal-next').onclick = () => { const d = new Date(calMonth); calMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime(); renderCal(); };
  el.querySelectorAll('.cd[data-k]').forEach(b => b.onclick = () => { calSel = b.dataset.k; renderCal(); $('#cal-day').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
  el.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openAgendaItem(JSON.parse(b.dataset.open)));
  const wd = $('#cal-wd');
  if (wd) wd.onclick = e => {
    const b = e.target.closest('[data-wd]'); if (!b) return;
    const pl = getPlan(), r = dayRange(pl.file); let set = new Set(planWeekdays(pl)); const i = +b.dataset.wd;
    if (set.has(i)) set.delete(i); else set.add(i);
    if (set.size < r.min) { toast(`El plan necesita al menos ${r.min} días por semana`); return; }
    if (set.size > r.max) { toast(`Este plan tiene como máximo ${r.max} días por semana`); return; }
    pl.weekdays = [...set].sort(); pl.days = set.size; setPlan(pl); renderCal();
  };
}
function itemTitle(x) {
  if (x.type === 'reto') { const d = retoDays(x.key, getRetos()[x.key].k, getRetos()[x.key].stage)[x.i]; return `Reto ${RETOS[x.key].n.toLowerCase()} · ${d.test ? 'prueba' : 'día ' + (x.i + 1)}`; }
  if (x.type === 'plan') { const p = getPlan(); const { kept } = planWeekInfo(p, x.week); return `Plan · Semana ${x.week}, día ${kept.indexOf(x.day) + 1}`; }
  if (x.type === 'smart') return `Entrenador · Sesión ${x.n}`;
  return title(x.x.w);
}
function itemSub(x) {
  if (x.type === 'reto') { const s = getRetos()[x.key], d = retoDays(x.key, s.k, s.stage)[x.i]; return d.test ? `${d.sets[0]} seguidas · etapa ${s.stage}` : `${d.sets.join(' · ')} · etapa ${s.stage}`; }
  if (x.type === 'plan') { const p = getPlan(), d = planWeek(p.file, p.level, x.week)[x.day], est = dayEstimate(d); return `${esc(FAM[p.fam].n)} · ~${Math.round(est.secs / 60)} min · ${est.n} series`; }
  if (x.type === 'smart') { const sm = getSmart(); return x.first ? `${esc(FOCUS[x.focus].n)} · ~${Math.round(total(buildTimeline(sm.next)) / 60)} min` : `${esc(FOCUS[x.focus].n)} · se ajusta según la sesión anterior`; }
  return `${fmt(x.x.secs)} min${x.x.full ? '' : ' · incompleto'}${x.x.fb ? ' · ' + FB[x.x.fb].n.toLowerCase() : ''}`;
}
function agendaRow(x, t) {
  const cls = x.type === 'done' ? (x.x.full ? 'ok' : 'part') : x.type;
  const when = t != null ? `<span class="ag-d"><b>${new Date(t).getDate()}</b>${WD[wdOf(t)]}</span>` : '';
  return `<button class="ag" data-open='${JSON.stringify({ ...x, x: undefined, t })}'>${when}<i class="dt ${cls}"></i><span class="t"><b>${esc(itemTitle(x))}</b><small>${itemSub(x)}</small></span>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg></button>`;
}
function renderCalDay(ag) {
  const k = calSel, its = ag[k] || [], [y, mo, d] = k.split('-').map(Number), t = new Date(y, mo - 1, d).getTime();
  const lbl = k === dkey(Date.now()) ? 'Hoy' : new Date(t).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
  $('#cal-day').innerHTML = `<h2>${esc(lbl)}</h2>` + (its.length ? `<div class="block">${its.map(x => agendaRow(x, null)).join('')}</div>` : '<div class="empty" style="padding:20px 16px">Día libre.</div>');
  $('#cal-day').querySelectorAll('[data-open]').forEach(b => b.onclick = () => { const o = JSON.parse(b.dataset.open); o.t = t; openAgendaItem(o); });
}
// lista de ejercicios de un entrenamiento (nombre y objetivo)
function exListHTML(w) {
  const seen = new Map();
  if (w.kind === 'plan') w.rounds.forEach(r => r.forEach(it => { if (it.id !== 'pause' && !seen.has(it.id)) seen.set(it.id, it.reps ? `×${it.reps}` : `${it.secs}s`); }));
  else w.rounds.forEach(r => r.forEach(id => { if (!seen.has(id)) seen.set(id, `${w.sk.w}s`); }));
  return `<div class="block">${[...seen].map(([id, tg], i) => exRow(id, i, '', tg)).join('')}</div>`;
}
function openAgendaItem(o) {
  if (o.type === 'reto') { openRetoDetail(o.key); return; }
  if (o.type === 'done') { openHistDetail(o.i); return; }
  const t = o.t != null ? o.t : Date.now(), isToday = dkey(t) === dkey(Date.now()), when = isToday ? 'hoy' : new Date(t).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
  if (o.type === 'plan') {
    const p = getPlan(); if (!p) return;
    const w = planDayWorkout(o.week, o.day);
    sheet(`<h3>${esc(itemTitle(o))}</h3><p class="sub">Programado para ${esc(when)} · Nivel ${PLAN_LEVELS[p.level]}</p>
      <h2>Ejercicios</h2>${exListHTML(w)}
      <button class="btn" id="ai-go">${isToday ? 'Empezar' : 'Hacerlo ahora'}</button><div class="gap"></div>
      <div class="row"><button class="btn ghost small" id="ai-off">No entrenar ${isToday ? 'hoy' : 'ese día'}</button><button class="btn ghost small" id="ai-skip">Saltar este entrenamiento</button></div>
      <p class="note">«No entrenar» corre este y los siguientes al próximo día disponible. «Saltar» lo da por hecho sin hacerlo.</p>
      <div class="gap"></div><button class="btn danger" id="ai-quit">Cancelar el plan</button>`, () => {
      $('#ai-go').onclick = () => { closeSheet(); openPreview(w, 'cal'); };
      $('#ai-off').onclick = () => { const pl = getPlan(); pl.offDates = [...new Set([...(pl.offDates || []), dkey(t)])].filter(k => k >= dkey(Date.now())); setPlan(pl); closeSheet(); renderCal(); toast('Movido al siguiente día disponible'); };
      $('#ai-skip').onclick = () => { confirmApp('¿Saltar este entrenamiento?', 'Se marca como saltado y el plan sigue con el siguiente.', 'Saltar', () => { markPlanDay(w, 0, true); closeSheet(); renderCal(); toast('Entrenamiento saltado'); }); };
      $('#ai-quit').onclick = () => confirmApp('¿Cancelar el plan?', 'Se borra el progreso del plan. Tu historial de entrenamientos se mantiene.', 'Cancelar plan', () => { setPlan(null); viewWeek = null; closeSheet(); renderCal(); toast('Plan cancelado'); }, true);
    });
  } else if (o.type === 'smart') {
    const sm = getSmart(); if (!sm) return;
    const nxt = o.first;
    sheet(`<h3>${esc(itemTitle(o))}</h3><p class="sub">${esc(FOCUS[o.focus].n)} · programada para ${esc(when)}</p>
      ${nxt ? `<h2>Ejercicios</h2>${exListHTML(sm.next)}
        <button class="btn" id="ai-go">${isToday || Date.now() >= (sm.nextAt || 0) ? 'Empezar' : 'Hacerla ahora'}</button><div class="gap"></div>
        <div class="row"><button class="btn ghost small" id="ai-post">Pasar al día siguiente</button><button class="btn ghost small" id="ai-skip">Saltar esta sesión</button></div>`
      : `<p class="note">Los ejercicios de esta sesión se eligen cuando termines la anterior, según cómo te haya ido.</p>`}
      <div class="gap"></div><button class="btn danger" id="ai-quit">Desactivar el entrenador inteligente</button>`, () => {
      const go = $('#ai-go'); if (go) go.onclick = () => { closeSheet(); openPreview(clone(getSmart().next), 'cal'); };
      const po = $('#ai-post'); if (po) po.onclick = () => { const s2 = getSmart(); s2.nextAt = addDays(Math.max(Date.now(), s2.nextAt || 0), 1); setSmart(s2); closeSheet(); renderCal(); toast('Sesión pasada al ' + WDN[wdOf(s2.nextAt)]); };
      const sk = $('#ai-skip'); if (sk) sk.onclick = () => confirmApp('¿Saltar esta sesión?', 'Se prepara la siguiente, con la misma intensidad.', 'Saltar', () => {
        const s2 = getSmart(); s2.sessions = (s2.sessions || 0) + 1; s2.next = genSmart(s2); s2.nextAt = addDays(Math.max(Date.now(), s2.nextAt || 0), 2); setSmart(s2); closeSheet(); renderCal(); toast('Sesión saltada'); });
      $('#ai-quit').onclick = () => confirmApp('¿Desactivar el entrenador inteligente?', 'Se borran la prueba y la intensidad. Tu historial se mantiene y puedes volver a activarlo cuando quieras.', 'Desactivar', () => { PS.del('smart'); closeSheet(); renderCal(); toast('Entrenador desactivado'); }, true);
    });
  }
}
// confirmación con el estilo de la app
function confirmApp(t, msg, ok, cb, danger) {
  sheet(`<h3>${esc(t)}</h3><p class="sub">${esc(msg)}</p><div style="height:18px"></div>
    <button class="btn ${danger ? 'danger' : ''}" id="cf-ok">${esc(ok)}</button><div class="gap"></div><button class="btn ghost" id="cf-no">Volver</button>`, () => {
    $('#cf-ok').onclick = () => { closeSheet(); cb(); };
    $('#cf-no').onclick = closeSheet;
  });
}
