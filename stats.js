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
  if (x.w.kind === 'timer') return out;
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
    kcal += x.hr && x.hr.kcal ? x.hr.kcal : (k || x.kcal || 0);
  });
  // rachas de días seguidos
  const ds = [...days].sort((a, b) => a - b); let best = 0, run = 0, prev = null;
  ds.forEach(d => { run = prev != null && Math.round((d - prev) / DAY) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = d; });
  const today = dayStart(Date.now()); let curStreak = 0;
  for (let d = days.has(today) ? today : today - DAY; days.has(d); d -= DAY) curStreak++;
  // retos
  const retos = Object.keys(RETOS).map(key => {
    const xs = H.filter(x => x.w.kind === 'reto' && x.w.reto === key && !preNoCount(x.w)); if (!xs.length) return null;
    let bs = null, tot = 0;
    xs.forEach(x => (x.w.sets || []).forEach((n, i) => { tot += n; const t = (x.w.times || [])[i]; if (!bs || n > bs.n || (n === bs.n && t && (!bs.t || t < bs.t))) bs = { n, t, at: x.at }; }));
    return { key, n: RETOS[key].n, best: bs, total: tot, sessions: xs.length, st: getRetos()[key] };
  }).filter(Boolean);
  const bestWeek = Object.values(weeks).reduce((a, b) => Math.max(a, b), 0);
  const wk = Date.now() - 7 * 864e5, wkH = H.filter(x => x.at > wk);
  return { wkN: wkH.length, wkSecs: wkH.reduce((a, x) => a + (x.secs || 0), 0), H, ex: Object.values(ex), parts, days: days.size, secs, reps, kcal, best, curStreak, hours, longest, bestWeek, hrAvg: hrN ? Math.round(hrSum / hrN) : 0, retos };
}
const fmtDur = s => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h ? `${h} h ${m} min` : `${m} min`; };
const fmtT = s => { s = Math.round(s); return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s} s`; };
const fmtN = n => Math.round(n).toLocaleString(LOC);
let statsAll = false;
function statsHTML() {
  const st = computeStats(); if (!st.H.length) return { sum: '', prog: '<p class="note">Completa tu primer entrenamiento para ver tu progreso.</p>' };
  const tile = (v, l) => `<div class="kpi"><b>${v}</b><span>${l}</span></div>`;
  let h = `<h2>Estadísticas</h2><div class="kpis">
    ${tile(fmtN(st.H.length), st.H.length === 1 ? 'entrenamiento' : 'entrenamientos')}${tile(fmtN(st.days), st.days === 1 ? 'día activo' : 'días activos')}
    ${tile(fmtDur(st.secs), 'tiempo total')}${tile(fmtN(st.reps), 'repeticiones')}
    ${tile(fmtN(st.kcal), 'kcal aprox.')}${tile(st.curStreak ? `${st.curStreak} / ${st.best}` : st.best, 'racha / mejor racha (días)')}
    ${tile(fmtN(st.wkN), st.wkN === 1 ? 'entrenamiento esta semana' : 'entrenamientos esta semana')}${tile(fmtDur(st.wkSecs), 'tiempo esta semana')}</div>`;
  // Resumen: números, constancia y tipo · Progreso: tiempos, partes del cuerpo, tablas y otros datos
  const sum = h + weekChartHTML(st.H) + kindChartHTML(st.H);
  h = progChartHTML();
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
  h += `<p class="note">Calorías estimadas con ${S.weight ? 'tu peso (' + S.weight + ' kg)' : '70 kg: carga tu peso en Perfil → Editar actual'}; si hay pulso registrado se usa ese cálculo. La mejor marca es la serie con más repeticiones (y su tiempo, cuando quedó medido).</p>`;
  // retos
  if (st.retos.length) h += `<h3 class="st-h">Retos</h3><div class="tbl"><table class="st-t"><thead><tr><th>Reto</th><th>Más seguidas</th><th>Tiempo</th><th>Total</th></tr></thead><tbody>${st.retos.map(r => `<tr><td>${esc(r.n)}<small>${r.st ? `rango ${rangeLbl(r.key, r.st.k)} · etapa ${r.st.stage}` : r.sessions + ' sesiones'}</small></td><td>${r.best ? r.best.n : '—'}</td><td>${r.best && r.best.t ? fmtT(r.best.t) : '—'}</td><td>${fmtN(r.total)}</td></tr>`).join('')}</tbody></table></div>`;
  // velocidad: segundos por repetición al principio (primeras 3 series) y ahora (mediana de las últimas 8)
  try {
    const m = buildPaces(), sp = Object.entries(m)
      .filter(([id, v]) => v.length >= PACE_MIN && CATALOG[id])
      .map(([id, v]) => { const first = median(v.slice(0, 3)), now = median(v.slice(-8)); return { id, n: v.length, first, now, d: first ? (first - now) / first * 100 : 0 }; })
      .sort((a, b) => b.n - a.n).slice(0, 10);
    if (sp.length) h += `<h3 class="st-h">Velocidad</h3><div class="tbl"><table class="st-t"><thead><tr><th>Ejercicio</th><th>Al principio</th><th>Ahora</th><th>Cambio</th></tr></thead><tbody>${sp.map(r => `<tr><td>${esc(ex(r.id).n)}<small>${r.n} series medidas</small></td><td>${r.first.toFixed(1).replace('.', ',')} s/rep</td><td>${r.now.toFixed(1).replace('.', ',')} s/rep</td><td>${r.n < 6 ? '—' : `<span class="${r.d > 2 ? 'up' : r.d < -2 ? 'down' : ''}">${r.d > 0 ? '−' : r.d < 0 ? '+' : ''}${Math.abs(Math.round(r.d))} %</span>`}</td></tr>`).join('')}</tbody></table></div>
      <p class="note">Segundos por repetición según lo que tardas en tocar ✓ en los ejercicios por repeticiones (y en los retos). Con 3 series de un ejercicio ya calculo tu ritmo y, si está activado «Pasar solo al siguiente», te aviso 10 s antes de avanzar.</p>`;
  } catch (e) { console.error(e); }
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
  return { sum, prog: h };
}
/* ---------- Gráficos: constancia semanal (barras) y tipo de entrenamiento (dona) ---------- */
let wkMode = 'n';                                    // 'n' entrenamientos · 'm' minutos
const secsOf = x => x.secs || stItems(x).reduce((a, it) => a + it.secs, 0);
function weekChartHTML(H) {
  const now = weekKey(Date.now()), weeks = [];
  for (let i = 7; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - 7 * i); weeks.push({ k: weekKey(d.getTime()), n: 0, s: 0 }); }
  H.forEach(x => { const w = weeks.find(y => y.k === weekKey(x.at)); if (w) { w.n++; w.s += secsOf(x); } });
  const val = w => wkMode === 'm' ? Math.round(w.s / 60) : w.n, max = Math.max(1, ...weeks.map(val));
  const tot = weeks.reduce((a, w) => a + val(w), 0);
  const lbl = k => new Date(k).toLocaleDateString(LOC, { day: 'numeric', month: 'short' }).replace('.', '');
  return `<h3 class="st-h">Constancia semanal</h3><div class="chart">
    <div class="ch-top"><div><b>${wkMode === 'm' ? t('{0} min', fmtN(tot)) : t(tot === 1 ? '{0} entrenamiento' : '{0} entrenamientos', tot)}</b><small>Últimas 8 semanas</small></div>
      <div class="seg" id="wk-mode"><button data-m="n" aria-pressed="${wkMode === 'n'}">Sesiones</button><button data-m="m" aria-pressed="${wkMode === 'm'}">Minutos</button></div></div>
    <div class="wkbars">${weeks.map(w => `<div class="wb${w.k === now ? ' on' : ''}" title="${lbl(w.k)}"><span>${val(w)}</span><i style="height:${Math.round(val(w) / max * 100)}%"></i><small data-noi18n>${w.k === now ? t('Esta') : lbl(w.k)}</small></div>`).join('')}</div>
  </div>`;
}
// los dos primeros siguen los colores del tema; el resto son fijos para que no se repitan en ningún tema
const KINDS = [['plan', 'Planes', 'var(--work)'], ['smart', 'Entrenador inteligente', 'var(--rest)'], ['libre', 'Entrenamiento libre', '#9d8cff'],
  ['db', 'Mancuernas', '#5fb3ff'], ['abs', 'Abdominales', '#7ee0a1'], ['reto', 'Retos', '#ff7eb6'], ['rt', 'Mis rutinas', '#ffc23d'], ['timer', 'Timer', '#4dd0e1'], ['test', 'Pruebas de capacidad', '#8a93a3']];
const kindOf = w => w.kind === 'timer' ? 'timer' : w.rt ? 'rt' : w.kind === 'reto' ? 'reto' : w.kind === 'test' ? 'test' : w.kind === 'db' ? 'db' : w.kind === 'abs' ? 'abs' : w.kind === 'plan' ? 'plan' : w.smart ? 'smart' : 'libre';
// tiempo corto para el centro de la dona: «8 h 22 m», «45 m», «125 h» (que entre aunque pase las 10 horas)
const fmtDurS = s => { s = Math.round(s / 60); const h = Math.floor(s / 60), m = s % 60; return h >= 100 ? `${h} h` : h ? `${h} h ${m} m` : `${m} m`; };
function kindChartHTML(H) {
  const sum = {}; let tot = 0;
  H.forEach(x => { const k = kindOf(x.w), v = secsOf(x); sum[k] = (sum[k] || 0) + v; tot += v; });
  if (!tot) return '';
  const r = 52, C = 2 * Math.PI * r, list = KINDS.filter(([k]) => sum[k] > 0);
  let off = 0;
  const arcs = list.map(([k, , c]) => {
    const len = sum[k] / tot * C, gap = list.length > 1 ? Math.min(3, len / 3) : 0;
    const a = `<circle cx="66" cy="66" r="${r}" fill="none" style="stroke:${c}" stroke-width="16" stroke-linecap="butt" stroke-dasharray="${(len - gap).toFixed(2)} ${(C - len + gap).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 66 66)"/>`;
    off += len; return a;
  }).join('');
  return `<h3 class="st-h">Tipo de entrenamiento</h3><div class="chart donut">
    <svg viewBox="0 0 132 132" role="img" aria-label="${esc(t('Tipo de entrenamiento'))}"><circle cx="66" cy="66" r="${r}" fill="none" style="stroke:var(--surface2)" stroke-width="16"/>${arcs}
      <text x="66" y="63" text-anchor="middle" style="fill:var(--text);font-weight:700;font-size:0.8824rem" data-noi18n>${fmtDurS(tot)}</text>
      <text x="66" y="81" text-anchor="middle" style="fill:var(--muted);font-size:0.6471rem">${t('en total')}</text></svg>
    <div class="dn-leg">${list.map(([k, n, c]) => `<div><i style="background:${c}"></i><span>${n}</span><b>${Math.round(sum[k] / tot * 100)}%</b></div>`).join('')}</div>
  </div>`;
}
/* ---------- Progreso de tiempos: segundos por repetición de cada ejercicio, sesión a sesión, o duración de las sesiones ---------- */
let progSel = null;
function progData() {
  const H = PS.get('history', []).slice(0, 300).reverse(), ex = {}, sess = [];
  H.forEach(x => {
    if (x.secs && x.full !== false) sess.push({ at: x.at, v: x.secs / 60 });
    const per = {}, add = (id, reps, secs) => { if (!reps || !secs) return; const v = secs / reps; if (v < 0.6 || v > 12) return; const k = paceKey(id); (per[k] = per[k] || []).push(v); };
    if (x.log) x.log.forEach(r => { if (r[1] && !r[2] && !r[5]) add(r[0], r[1], r[3] / 1000); });
    else if (x.w && x.w.kind === 'reto' && x.w.times && !x.w.pre && RETOS[x.w.reto]) (x.w.sets || []).forEach((n, i) => { const tt = x.w.times[i]; if (tt) add(RETOS[x.w.reto].ex, n, tt); });
    Object.entries(per).forEach(([k, a]) => (ex[k] = ex[k] || []).push({ at: x.at, v: median(a) }));
  });
  return { ex, sess };
}
const nf1 = v => v.toFixed(1).replace('.', LANG === 'es' ? ',' : '.');
function lineSVG(pts, fmt) {
  const W = 320, H = 150, L = 40, R = 12, T = 14, B = 24;
  let lo = Math.min(...pts.map(p => p.v)), hi = Math.max(...pts.map(p => p.v));
  if (hi - lo < 0.2) { hi += 0.3; lo = Math.max(0, lo - 0.3); } const pad = (hi - lo) * 0.12; lo = Math.max(0, lo - pad); hi += pad;
  const X = i => L + (pts.length === 1 ? (W - L - R) / 2 : i * (W - L - R) / (pts.length - 1)), Y = v => T + (hi - v) / (hi - lo) * (H - T - B);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p.v).toFixed(1)}`).join('');
  const area = `${line}L${X(pts.length - 1).toFixed(1)} ${H - B}L${X(0).toFixed(1)} ${H - B}Z`;
  const dl = t => new Date(t).toLocaleDateString(LOC, { day: 'numeric', month: 'short' }).replace('.', '');
  const grid = [hi, (hi + lo) / 2, lo].map(v => `<line x1="${L}" x2="${W - R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" style="stroke:var(--line)" stroke-dasharray="3 4"/><text x="${L - 6}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end" style="fill:var(--muted);font-size:0.6176rem">${fmt(v)}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" data-noi18n>
    <defs><linearGradient id="pgfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--work-ink);stop-opacity:.28"/><stop offset="1" style="stop-color:var(--work-ink);stop-opacity:0"/></linearGradient></defs>
    ${grid}<path d="${area}" fill="url(#pgfill)"/><path d="${line}" fill="none" style="stroke:var(--work)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${pts.map((p, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="${i === pts.length - 1 ? 5 : 3}" style="fill:${i === pts.length - 1 ? 'var(--work)' : 'var(--bg)'};stroke:var(--work)" stroke-width="2"/>`).join('')}
    <text x="${L}" y="${H - 6}" style="fill:var(--muted);font-size:0.6176rem">${dl(pts[0].at)}</text><text x="${W - R}" y="${H - 6}" text-anchor="end" style="fill:var(--muted);font-size:0.6176rem">${dl(pts[pts.length - 1].at)}</text></svg>`;
}
function progChartHTML() {
  const { ex: E, sess } = progData();
  const opts = Object.entries(E).filter(([k, a]) => a.length >= 2 && CATALOG[k]).sort((a, b) => b[1].length - a[1].length);
  const keys = opts.map(o => o[0]).concat(sess.length >= 2 ? ['__s'] : []);
  if (!keys.length) return '';
  if (!keys.includes(progSel)) progSel = keys[0];
  const isS = progSel === '__s', pts = (isS ? sess : E[progSel]).slice(-20);
  const first = median(pts.slice(0, 3).map(p => p.v)), last = pts[pts.length - 1].v, now = median(pts.slice(-3).map(p => p.v));
  const d = first ? Math.round((first - now) / first * 100) : 0;
  const fmt = isS ? (v => Math.round(v) + ' min') : (v => nf1(v) + ' s');
  const sub = isS
    ? t('Promedio {0} · {1} sesiones', fmt(pts.reduce((a, p) => a + p.v, 0) / pts.length), pts.length)
    : (pts.length < 3 ? t('Al principio {0} por repetición', fmt(first)) : `${t('Al principio {0} por repetición', fmt(first))} · <span class="${d > 2 ? 'pg-up' : d < -2 ? 'pg-down' : ''}">${d > 2 ? t('{0} % más rápido', d) : d < -2 ? t('{0} % más lento', -d) : t('igual que al principio')}</span>`);
  return `<h3 class="st-h">Progreso de tiempos</h3><div class="chart pgc">
    <select id="pg-sel" aria-label="${esc(t('Progreso de tiempos'))}">${opts.map(([k, a]) => `<option value="${k}" ${k === progSel ? 'selected' : ''}>${esc(ex(k).n)} · ${a.length} ${t('sesiones')}</option>`).join('')}${sess.length >= 2 ? `<option value="__s" ${isS ? 'selected' : ''}>${t('Duración de cada sesión')}</option>` : ''}</select>
    <div class="pg-v" data-noi18n>${isS ? fmt(last) : nf1(last) + ' ' + t('s por repetición')}</div><div class="pg-s">${sub}</div>
    ${lineSVG(pts, fmt)}
    <p class="note" style="margin:6px 0 0">${isS ? 'Minutos que duró cada sesión completa (las últimas 20).' : 'Segundos por repetición en cada sesión, según cuándo tocas ✓ (las últimas 20). Más bajo es más rápido.'}</p>
  </div>`;
}
function renderStats() {
  const el = $('#hist-kpi'); if (!el) return;
  const r = statsHTML(); el.innerHTML = r.sum; const hp = $('#hist-prog'); if (hp) hp.innerHTML = r.prog;
  bindSeg('wk-mode', 'm', m => { wkMode = m; renderStats(); });
  const pg = $('#pg-sel'); if (pg) pg.onchange = () => { progSel = pg.value; renderStats(); };
  const b = $('#st-all'); if (b) b.onclick = () => { statsAll = !statsAll; renderStats(); };
}
const _renderHist = renderHist;
renderHist = function () { _renderHist(); try { renderStats(); } catch (e) { console.error(e); } };
