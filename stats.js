'use strict';
/* =========================================================
   Estadísticas del historial: totales, partes del cuerpo,
   tabla por ejercicio (repeticiones, calorías, mejor marca) y retos
   ========================================================= */
const ST_PARTS = { l: 'Piernas', g: 'Glúteos', c: 'Core', u: 'Tren superior', a: 'Brazos' };
const metOf = id => { const c = CATALOG[id] || {}; return c.t === 's' ? 2.3 : c.t === 'w' ? 3.5 : c.j ? 8 : 5; };
const stKg = () => S.weight || 70;
const kcalOf = (id, secs) => metOf(id) * stKg() * secs / 3600;
const REP_EST = 3; // segundos por repetición cuando no hay tiempo medido
// lo que se hizo en una sesión: [{ id, reps, secs, timed, measured }]
function stItems(x) {
  const out = [];
  if (x.w.kind === 'reto') {
    const R = RETOS[x.w.reto]; if (!R) return out;
    (x.w.sets || []).forEach((n, i) => { const t = (x.w.times || [])[i]; out.push({ id: R.ex, reps: n, secs: t || n * REP_EST, measured: !!t, reto: x.w.reto }); });
    return out;
  }
  if (x.w.kind === 'test') {
    const r = x.w.results || {}; TESTS.forEach(t => { if (+r[t.key]) out.push({ id: t.ex, reps: +r[t.key], secs: 60, measured: true }); });
    return out;
  }
  if (x.log && x.log.length) {
    x.log.forEach(([id, reps, dur, ms]) => { const secs = ms / 1000; out.push(reps ? { id, reps, secs, measured: true } : { id, reps: 0, secs, timed: true, measured: true }); });
    return out;
  }
  let tl; try { tl = buildTimeline(x.w); } catch (e) { return out; }
  const end = x.full ? tl.length : Math.round(tl.length * 0.5);
  tl.slice(0, end).forEach(s => { if (s.k !== 'work' || s.soft) return; out.push(s.reps ? { id: s.ex, reps: s.reps, secs: s.reps * REP_EST } : { id: s.ex, reps: 0, secs: s.dur, timed: true }); });
  return out;
}
function computeStats() {
  const H = PS.get('history', []);
  const ex = {}, parts = {}, days = new Set(), hours = [0, 0, 0, 0], weeks = {};
  let reps = 0, kcal = 0, secs = 0, longest = null, hrSum = 0, hrN = 0;
  H.forEach(x => {
    secs += x.secs || 0; days.add(dayStart(x.at));
    const wk = weekKey(x.at); weeks[wk] = (weeks[wk] || 0) + 1;
    const hr = new Date(x.start || x.at).getHours(); hours[hr < 12 ? 0 : hr < 16 ? 1 : hr < 20 ? 2 : 3]++;
    if (!longest || x.secs > longest.secs) longest = x;
    if (x.hr && x.hr.avg) { hrSum += x.hr.avg; hrN++; }
    let k = 0;
    stItems(x).forEach(it => {
      const e = ex[it.id] = ex[it.id] || { id: it.id, sets: 0, reps: 0, secs: 0, tsecs: 0, kcal: 0, rb: null, tb: null };
      e.sets++; e.reps += it.reps; e.secs += it.secs; const kc = kcalOf(it.id, it.secs); e.kcal += kc; k += kc; reps += it.reps;
      if (it.timed) { e.tsecs += it.secs; if (!e.tb || it.secs > e.tb.secs) e.tb = { secs: it.secs }; }
      else if (!e.rb || it.reps > e.rb.reps || (it.reps === e.rb.reps && it.measured && (!e.rb.measured || it.secs < e.rb.secs))) e.rb = { reps: it.reps, secs: it.secs, measured: it.measured };
      const ps = ((CATALOG[it.id] || {}).p || '').split('').filter(c => ST_PARTS[c]);
      ps.forEach(c => { parts[c] = (parts[c] || 0) + it.secs / ps.length; });
    });
    kcal += x.hr && x.hr.kcal ? x.hr.kcal : k;
  });
  // rachas de días seguidos
  const ds = [...days].sort((a, b) => a - b); let best = 0, run = 0, prev = null;
  ds.forEach(d => { run = prev != null && Math.round((d - prev) / DAY) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = d; });
  const today = dayStart(Date.now()); let curStreak = 0;
  for (let d = days.has(today) ? today : today - DAY; days.has(d); d -= DAY) curStreak++;
  // retos
  const retos = Object.keys(RETOS).map(key => {
    const xs = H.filter(x => x.w.kind === 'reto' && x.w.reto === key); if (!xs.length) return null;
    let bs = null, tot = 0;
    xs.forEach(x => (x.w.sets || []).forEach((n, i) => { tot += n; const t = (x.w.times || [])[i]; if (!bs || n > bs.n || (n === bs.n && t && (!bs.t || t < bs.t))) bs = { n, t, at: x.at }; }));
    return { key, n: RETOS[key].n, best: bs, total: tot, sessions: xs.length, st: getRetos()[key] };
  }).filter(Boolean);
  const bestWeek = Object.values(weeks).reduce((a, b) => Math.max(a, b), 0);
  return { H, ex: Object.values(ex), parts, days: days.size, secs, reps, kcal, best, curStreak, hours, longest, bestWeek, hrAvg: hrN ? Math.round(hrSum / hrN) : 0, retos };
}
const fmtDur = s => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h ? `${h} h ${m} min` : `${m} min`; };
const fmtT = s => { s = Math.round(s); return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s} s`; };
const fmtN = n => Math.round(n).toLocaleString('es');
let statsAll = false;
function statsHTML() {
  const st = computeStats(); if (!st.H.length) return '';
  const tile = (v, l) => `<div class="kpi"><b>${v}</b><span>${l}</span></div>`;
  let h = `<h2>Estadísticas</h2><div class="kpis">
    ${tile(fmtN(st.H.length), st.H.length === 1 ? 'entrenamiento' : 'entrenamientos')}${tile(fmtN(st.days), st.days === 1 ? 'día activo' : 'días activos')}
    ${tile(fmtDur(st.secs), 'tiempo total')}${tile(fmtN(st.reps), 'repeticiones')}
    ${tile(fmtN(st.kcal), 'kcal aprox.')}${tile(st.curStreak ? `${st.curStreak} / ${st.best}` : st.best, 'racha / mejor racha (días)')}</div>`;
  // partes del cuerpo
  const tot = Object.values(st.parts).reduce((a, b) => a + b, 0);
  if (tot) h += `<h3 class="st-h">Partes del cuerpo trabajadas</h3><div class="zbars">${Object.entries(ST_PARTS).map(([c, n]) => { const v = st.parts[c] || 0, p = Math.round(v / tot * 100);
    return `<div class="zb"><span>${n}</span><i><u style="width:${p}%"></u></i><b>${p}%</b><small>${fmtDur(v)}</small></div>`; }).join('')}</div>`;
  // tabla por ejercicio
  const rows = st.ex.sort((a, b) => b.secs - a.secs), show = statsAll ? rows : rows.slice(0, 8);
  h += `<h3 class="st-h">Por ejercicio</h3><div class="tbl"><table class="st-t"><thead><tr><th>Ejercicio</th><th>Total</th><th>kcal</th><th>Mejor marca</th></tr></thead><tbody>${show.map(e => {
    // ejercicios por repeticiones y por tiempo: se muestran las repeticiones y, aparte, el tiempo
    const best = e.rb ? `${e.rb.reps} rep${e.rb.measured ? `<small>en ${fmtT(e.rb.secs)}</small>` : ''}` : e.tb ? fmtT(e.tb.secs) : '—';
    const total = e.reps ? `${fmtN(e.reps)} rep${e.tsecs ? `<small>+ ${fmtT(e.tsecs)}</small>` : ''}` : fmtT(e.tsecs);
    return `<tr><td>${esc(ex(e.id).n)}<small>${e.sets} ${e.sets === 1 ? 'serie' : 'series'}</small></td><td>${total}</td><td>${fmtN(e.kcal)}</td><td>${best}</td></tr>`; }).join('')}</tbody></table></div>`;
  if (rows.length > 8) h += `<button class="btn ghost small" id="st-all">${statsAll ? 'Ver menos' : `Ver los ${rows.length} ejercicios`}</button>`;
  h += `<p class="note">Calorías estimadas con ${S.weight ? 'tu peso (' + S.weight + ' kg)' : '70 kg: pon tu peso en Perfil → Pulsómetro'}; si hay pulso registrado se usa ese cálculo. La mejor marca es la serie con más repeticiones (y su tiempo, cuando quedó medido).</p>`;
  // retos
  if (st.retos.length) h += `<h3 class="st-h">Retos</h3><div class="tbl"><table class="st-t"><thead><tr><th>Reto</th><th>Más seguidas</th><th>Tiempo</th><th>Total</th></tr></thead><tbody>${st.retos.map(r => `<tr><td>${esc(r.n)}<small>${r.st ? `rango ${rangeLbl(r.key, r.st.k)} · etapa ${r.st.stage}` : r.sessions + ' sesiones'}</small></td><td>${r.best ? r.best.n : '—'}</td><td>${r.best && r.best.t ? fmtT(r.best.t) : '—'}</td><td>${fmtN(r.total)}</td></tr>`).join('')}</tbody></table></div>`;
  // otros datos
  const fav = [...st.ex].sort((a, b) => b.sets - a.sets)[0];
  const moments = ['por la mañana', 'al mediodía', 'por la tarde', 'por la noche'], mi = st.hours.indexOf(Math.max(...st.hours));
  const items = [
    fav && ['Ejercicio favorito', `${ex(fav.id).n} (${fav.sets} ${fav.sets === 1 ? 'serie' : 'series'})`],
    ['Promedio por entrenamiento', fmtDur(st.secs / st.H.length)],
    st.longest && ['Entrenamiento más largo', `${fmtDur(st.longest.secs)} · ${dateStr(st.longest.at)}`],
    ['Mejor semana', `${st.bestWeek} ${st.bestWeek === 1 ? 'entrenamiento' : 'entrenamientos'}`],
    ['Sueles entrenar', moments[mi]],
    st.hrAvg && ['Pulso medio', `${st.hrAvg} ppm`],
  ].filter(Boolean);
  h += `<h3 class="st-h">Otros datos</h3><div class="block st-list">${items.map(([k, v]) => `<div class="kv"><span>${k}</span><b>${esc(String(v))}</b></div>`).join('')}</div>`;
  return h;
}
function renderStats() {
  const el = $('#hist-kpi'); if (!el) return;
  el.innerHTML = statsHTML();
  const b = $('#st-all'); if (b) b.onclick = () => { statsAll = !statsAll; renderStats(); };
}
const _renderHist = renderHist;
renderHist = function () { _renderHist(); try { renderStats(); } catch (e) { console.error(e); } };
