'use strict';
/* =========================================================
   Intervalo — pulsómetro, importación de pulso, logros y copias
   (se carga después de app.js y usa sus funciones globales)
   ========================================================= */

/* ---------- Pulso: zonas y resumen ---------- */
const ZONES = [
  { n: 'Z1 Muy suave', c: '#5fb3ff', from: 0.5 }, { n: 'Z2 Suave', c: '#35d0bf', from: 0.6 },
  { n: 'Z3 Moderada', c: '#7bd88f', from: 0.7 }, { n: 'Z4 Intensa', c: '#ffc23d', from: 0.8 }, { n: 'Z5 Máxima', c: '#ff5a36', from: 0.9 },
];
const hrMax = () => S.hrMax || (S.age ? Math.round(208 - 0.7 * S.age) : 190);
const zoneOf = bpm => { const r = bpm / hrMax(); let z = -1; ZONES.forEach((x, i) => { if (r >= x.from) z = i; }); return z; };
// samples: [[segundo, ppm], ...]
function hrSummary(samples) {
  const s = samples.filter(x => x[1] > 30 && x[1] < 240);
  if (s.length < 3) return null;
  const zones = [0, 0, 0, 0, 0];
  let sum = 0, wsum = 0, max = 0, min = 999;
  for (let i = 0; i < s.length; i++) {
    const dt = i < s.length - 1 ? Math.min(10, Math.max(0, s[i + 1][0] - s[i][0])) : 1;
    const b = s[i][1]; sum += b * dt; wsum += dt; max = Math.max(max, b); min = Math.min(min, b);
    const z = zoneOf(b); if (z >= 0) zones[z] += dt;
  }
  const avg = Math.round(sum / Math.max(1, wsum)), mins = wsum / 60;
  let kcal = null;
  if (S.age && S.weight) {
    const m = PROFILE.variant === 'm';
    const perMin = m ? (-55.0969 + 0.6309 * avg + 0.1988 * S.weight + 0.2017 * S.age) / 4.184 : (-20.4022 + 0.4472 * avg - 0.1263 * S.weight + 0.074 * S.age) / 4.184;
    kcal = Math.max(0, Math.round(perMin * mins));
  }
  // se guarda una muestra cada 5 s para la gráfica
  const pts = []; let bucket = null;
  s.forEach(([t, b]) => { const k = Math.floor(t / 5); if (!bucket || bucket.k !== k) { if (bucket) pts.push([bucket.k * 5, Math.round(bucket.s / bucket.n)]); bucket = { k, s: 0, n: 0 }; } bucket.s += b; bucket.n++; });
  if (bucket) pts.push([bucket.k * 5, Math.round(bucket.s / bucket.n)]);
  return { avg, max, min, zones: zones.map(Math.round), secs: Math.round(wsum), kcal, hrMax: hrMax(), pts };
}
function hrChartSVG(hr) {
  const pts = hr.pts; if (!pts || pts.length < 2) return '';
  const W = 320, H = 120, t1 = pts[pts.length - 1][0] || 1, lo = Math.min(...pts.map(p => p[1])) - 8, hi = Math.max(...pts.map(p => p[1])) + 8;
  const y = b => H - (b - lo) / (hi - lo) * H, x = t => t / t1 * W;
  let bands = '';
  ZONES.forEach((z, i) => {
    const b0 = z.from * hr.hrMax, b1 = (ZONES[i + 1] ? ZONES[i + 1].from : 1.2) * hr.hrMax;
    const ya = Math.max(0, Math.min(H, y(b1))), yb = Math.max(0, Math.min(H, y(b0)));
    if (yb - ya > 0.5) bands += `<rect x="0" y="${ya.toFixed(1)}" width="${W}" height="${(yb - ya).toFixed(1)}" fill="${z.c}" opacity=".10"/>`;
  });
  const line = pts.map(p => x(p[0]).toFixed(1) + ',' + y(p[1]).toFixed(1)).join(' ');
  return `<svg class="hrchart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${bands}<polyline points="${line}" fill="none" stroke="#ff5a36" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>
    <div class="pmeta"><span>${hi - 8 | 0} máx. gráfico</span><span>${fmt(t1)} min</span></div>`;
}
function hrBlockHTML(hr) {
  if (!hr) return '';
  const tot = hr.zones.reduce((a, b) => a + b, 0) || 1;
  return `<div class="block"><div class="block-h"><b>Pulso</b><span>FC máx. usada ${hr.hrMax}${hr.src ? ' · ' + esc(hr.src) : ''}</span></div>
    <div class="stats" style="margin:12px 12px 4px"><div class="stat"><b>${hr.avg}</b><span>media ppm</span></div><div class="stat"><b>${hr.max}</b><span>máxima ppm</span></div><div class="stat"><b>${hr.kcal != null ? hr.kcal : '–'}</b><span>kcal aprox.</span></div></div>
    <div style="padding:4px 16px 8px">${hrChartSVG(hr)}</div>
    <div class="zbar">${hr.zones.map((s, i) => s ? `<i style="flex:${s};background:${ZONES[i].c}" title="${ZONES[i].n}"></i>` : '').join('')}</div>
    <div class="zlist">${hr.zones.map((s, i) => `<span><i style="background:${ZONES[i].c}"></i>${ZONES[i].n.split(' ')[0]} ${fmt(s)} · ${Math.round(s / tot * 100)}%</span>`).join('')}</div></div>`;
}

/* ---------- Pulsómetro Bluetooth (Chrome/Edge en Android y PC, Bluefy en iPhone) ---------- */
const HR = { dev: null, on: false, bpm: 0, at: 0, busy: false };
const hasBT = () => !!(navigator.bluetooth && navigator.bluetooth.requestDevice);
async function hrAttach() {
  const srv = await HR.dev.gatt.connect();
  const svc = await srv.getPrimaryService('heart_rate');
  const ch = await svc.getCharacteristic('heart_rate_measurement');
  ch.addEventListener('characteristicvaluechanged', hrData);
  await ch.startNotifications();
  HR.on = true; hrUI();
}
async function hrConnect() {
  if (!hasBT()) { hrHelp(); return; }
  if (HR.busy) return; HR.busy = true;
  try {
    HR.dev = await navigator.bluetooth.requestDevice({ filters: [{ services: ['heart_rate'] }] });
    HR.dev.addEventListener('gattserverdisconnected', hrLost);
    await hrAttach();
    toast('Pulsómetro conectado' + (HR.dev.name ? ': ' + HR.dev.name : ''));
  } catch (e) {
    if (e && e.name !== 'NotFoundError') toast('No se pudo conectar. ¿Está la banda puesta y libre?');
    if (!HR.on) HR.dev = null;
  }
  HR.busy = false; hrUI();
}
function hrDisconnect() {
  const d = HR.dev; HR.dev = null; HR.on = false; HR.bpm = 0;
  if (d) { d.removeEventListener('gattserverdisconnected', hrLost); try { d.gatt.disconnect(); } catch (e) {} }
  hrUI(); toast('Pulsómetro desconectado');
}
function hrLost() {
  HR.on = false; hrUI();
  let n = 0;
  const retry = async () => {
    if (!HR.dev || HR.on) return;
    try { await hrAttach(); toast('Pulsómetro reconectado'); } catch (e) { if (++n < 6) setTimeout(retry, 1500 * n); else toast('Se perdió el pulsómetro'); }
  };
  setTimeout(retry, 800);
}
function hrData(e) {
  const v = e.target.value, f = v.getUint8(0);
  const bpm = f & 1 ? v.getUint16(1, true) : v.getUint8(1);
  if (!bpm) return;
  HR.bpm = bpm; HR.at = Date.now();
  if (P.running && !P.paused) {
    if (!P.hr) P.hr = [];
    const t = Math.round(P.activeMs / 1000), last = P.hr[P.hr.length - 1];
    if (!last || last[0] !== t) P.hr.push([t, bpm]);
  }
  hrUI();
}
function hrUI() {
  const b = $('#p-hr'); if (!b) return;
  const stale = Date.now() - HR.at > 6000;
  b.classList.toggle('hidden', !hasBT() && !HR.on);
  b.classList.toggle('on', HR.on);
  if (HR.on && HR.bpm && !stale) { const z = zoneOf(HR.bpm); b.style.setProperty('--hz', z >= 0 ? ZONES[z].c : 'var(--muted)'); b.innerHTML = `<span class="hrv">♥ ${HR.bpm}</span>`; }
  else { b.style.removeProperty('--hz'); b.innerHTML = HR.on ? '<span class="hrv">♥ …</span>' : '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>'; }
  b.setAttribute('aria-label', HR.on ? `Pulso ${HR.bpm || ''}` : 'Conectar pulsómetro');
  const st = $('#hr-state'); if (st) st.textContent = HR.on ? `Conectado${HR.dev && HR.dev.name ? ' · ' + HR.dev.name : ''}${HR.bpm ? ' · ' + HR.bpm + ' ppm' : ''}` : (hasBT() ? 'Sin conectar' : 'Este navegador no puede conectarse por Bluetooth');
}
setInterval(() => { if (HR.on) hrUI(); }, 3000);
function hrHelp() {
  sheet(`<h3>Pulsómetro</h3>
    <p class="sub">Este navegador no permite conectar dispositivos Bluetooth.</p>
    <h2>En iPhone</h2><p class="note">Instala el navegador gratuito <b>Bluefy</b> (App Store) y abre la app desde él con su dirección https. Ahí aparece el botón ♥ para conectar la banda.</p>
    <h2>En Android o PC</h2><p class="note">Usa Chrome o Edge.</p>
    <h2>Sin Bluetooth</h2><p class="note">Graba la sesión con la app de Polar (u otra), exporta el archivo TCX o CSV desde Polar Flow y en Historial abre el entrenamiento → «Añadir pulso desde archivo».</p>
    <div style="height:16px"></div><button class="btn ghost" onclick="closeSheet()">Entendido</button>`);
}
function openHRSettings() {
  sheet(`<h3>Pulso y datos personales</h3>
    <p class="sub">Para calcular tus zonas de pulso y una estimación de calorías.</p>
    <div class="adv" style="padding:12px 0 0">
      <label>Edad<input type="number" inputmode="numeric" min="10" max="99" id="hs-age" value="${S.age || ''}" placeholder="—"></label>
      <label>Peso (kg)<input type="number" inputmode="decimal" min="25" max="250" id="hs-w" value="${S.weight || ''}" placeholder="—"></label>
      <label>FC máxima (ppm)<input type="number" inputmode="numeric" min="120" max="230" id="hs-max" value="${S.hrMax || ''}" placeholder="${hrMax()}"></label>
    </div>
    <p class="note">Si no pones FC máxima se estima con la edad (208 − 0,7 × edad). Si la conoces por una prueba, es mejor.</p>
    <h2>Banda o reloj</h2>
    <div class="block"><div class="hist"><div class="t"><b>Estado</b><small id="hr-state"></small></div></div></div>
    <div class="row"><button class="btn small" id="hs-con">${HR.on ? 'Reconectar' : 'Conectar'}</button>${HR.on ? '<button class="btn ghost small" id="hs-dis">Desconectar</button>' : ''}</div>
    <div style="height:16px"></div><button class="btn" id="hs-save">Guardar</button>`, () => {
    hrUI();
    $('#hs-con').onclick = () => { closeSheet(); hrConnect(); };
    const d = $('#hs-dis'); if (d) d.onclick = () => { hrDisconnect(); closeSheet(); };
    $('#hs-save').onclick = () => {
      const num = (id, a, b) => { const v = parseFloat($(id).value); return isFinite(v) && v >= a && v <= b ? v : null; };
      S.age = num('#hs-age', 10, 99); S.weight = num('#hs-w', 25, 250); S.hrMax = num('#hs-max', 120, 230); save(); closeSheet(); toast('Guardado');
    };
  });
}

/* ---------- Importar pulso desde archivo (Polar Flow TCX/CSV, GPX) ---------- */
function parseHRFile(text, name) {
  const out = [];
  if (/<\?xml|<TrainingCenterDatabase|<gpx/i.test(text.slice(0, 2000))) {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    const tps = doc.getElementsByTagName('Trackpoint').length ? doc.getElementsByTagName('Trackpoint') : doc.getElementsByTagName('trkpt');
    for (const tp of tps) {
      const tEl = tp.getElementsByTagName('Time')[0] || tp.getElementsByTagName('time')[0];
      let hEl = null; const hb = tp.getElementsByTagName('HeartRateBpm')[0];
      if (hb) hEl = hb.getElementsByTagName('Value')[0];
      if (!hEl) for (const el of tp.getElementsByTagName('*')) if (el.localName === 'hr') { hEl = el; break; }
      if (!tEl || !hEl) continue;
      const t = Date.parse(tEl.textContent.trim()), b = parseInt(hEl.textContent, 10);
      if (isFinite(t) && b > 0) out.push([t, b]);
    }
    return { samples: out, abs: true };
  }
  // CSV de Polar Flow: cabecera con fecha y hora de inicio, luego muestras por segundo
  const lines = text.split(/\r?\n/), sep = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ';' : ',';
  const cells = l => l.split(sep).map(x => x.trim().replace(/^"|"$/g, ''));
  let start = null, hi = -1, ti = -1, rowStart = -1;
  for (let i = 0; i < lines.length; i++) {
    const c = cells(lines[i]); const lc = c.map(x => x.toLowerCase());
    const di = lc.indexOf('date'), si = lc.findIndex(x => x.startsWith('start time'));
    if (di >= 0 && si >= 0 && lines[i + 1]) {
      const v = cells(lines[i + 1]);
      const dm = (v[di] || '').match(/(\d{1,4})[-./](\d{1,2})[-./](\d{1,4})/), tm = (v[si] || '').match(/(\d{1,2}):(\d{2}):?(\d{2})?/);
      if (dm && tm) {
        let [_, a, b2, c2] = dm; let Y, M, D;
        if (a.length === 4) { Y = +a; M = +b2; D = +c2; } else { D = +a; M = +b2; Y = +c2; }
        start = new Date(Y, M - 1, D, +tm[1], +tm[2], +(tm[3] || 0)).getTime();
      }
    }
    const tIdx = lc.indexOf('time'), hIdx = lc.findIndex(x => /^hr\b|heart ?rate/.test(x));
    if (tIdx >= 0 && hIdx >= 0 && di < 0) { ti = tIdx; hi = hIdx; rowStart = i + 1; break; }
  }
  if (rowStart < 0) return { samples: [], abs: false };
  for (let i = rowStart; i < lines.length; i++) {
    const c = cells(lines[i]); if (c.length <= Math.max(ti, hi)) continue;
    const m = c[ti].match(/(\d+):(\d{2}):(\d{2})/); const b = parseInt(c[hi], 10);
    if (!m || !(b > 0)) continue;
    const sec = +m[1] * 3600 + +m[2] * 60 + +m[3];
    out.push([start != null ? start + sec * 1000 : sec * 1000, b]);
  }
  return { samples: out, abs: start != null };
}
let hrTarget = null;
function importHRFor(idx) { hrTarget = idx; $('#hr-file').click(); }
$('#hr-file').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f || hrTarget == null) return;
  try {
    const { samples, abs } = parseHRFile(await f.text(), f.name);
    if (samples.length < 5) throw new Error('vacío');
    const h = PS.get('history', []), x = h[hrTarget]; if (!x) return;
    let use = samples;
    if (abs) {
      const st = x.start || (x.at - x.secs * 1000 - 5 * 60e3), en = x.at + 2 * 60e3;
      const win = samples.filter(s => s[0] >= st - 2 * 60e3 && s[0] <= en);
      if (win.length >= 5) use = win; else if (!confirm('Las horas del archivo no coinciden con este entrenamiento. ¿Usar el archivo completo igualmente?')) return;
    }
    const t0 = use[0][0];
    const sum = hrSummary(use.map(s => [Math.round((s[0] - t0) / 1000), s[1]]));
    if (!sum) throw new Error('sin datos');
    sum.src = 'archivo'; x.hr = sum; PS.set('history', h);
    toast(`Pulso añadido: media ${sum.avg}, máx. ${sum.max}`);
    renderHist(); openHistDetail(hrTarget); checkAwards(true);
  } catch (err) { toast('No encontré datos de pulso en ese archivo (usa TCX o CSV de Polar Flow)'); }
};

/* ---------- Detalle de una sesión del historial ---------- */
function openHistDetail(i) {
  const h = PS.get('history', []), x = h[i]; if (!x) return;
  const r = x.reps || repsOf(x);
  const rl = [['sq', 'sentadillas'], ['pu', 'flexiones'], ['ab', 'abdominales'], ['bu', 'burpees']].filter(([k]) => r[k]).map(([k, n]) => `${r[k]} ${n}`).join(' · ');
  sheet(`<h3>${esc(title(x.w))}</h3>
    <p class="sub">${dateStr(x.at)} · ${new Date(x.at - x.secs * 1000).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })} · ${fmt(x.secs)} min activos${x.full ? '' : ' · incompleto'}${x.fb ? ' · ' + FB[x.fb].n.toLowerCase() : ''}</p>
    ${rl ? `<p class="note">Aprox.: ${rl}${r.pl ? ` · ${fmt(r.pl)} min de plancha` : ''}</p>` : ''}
    <div class="gap"></div>
    ${x.hr ? hrBlockHTML(x.hr) : '<div class="empty" style="padding:22px 16px">Sin datos de pulso.</div>'}
    <div class="gap"></div>
    <button class="btn ghost small" id="hd-file">${x.hr ? 'Reemplazar pulso desde archivo' : 'Añadir pulso desde archivo (TCX / CSV)'}</button>
    ${x.hr ? '<div class="gap"></div><button class="btn danger" id="hd-del">Quitar datos de pulso</button>' : ''}
    <div class="gap"></div><button class="btn" id="hd-rep">Repetir este entrenamiento</button>`, () => {
    $('#hd-file').onclick = () => importHRFor(i);
    const d = $('#hd-del'); if (d) d.onclick = () => { const h2 = PS.get('history', []); delete h2[i].hr; PS.set('history', h2); closeSheet(); renderHist(); };
    $('#hd-rep').onclick = () => {
      closeSheet(); const w = clone(x.w);
      if (w.kind === 'test') { openTestSetup(); return; }
      if (w.kind === 'reto') { openReto(w.reto); return; }
      if (w.kind === 'plan') { w.warm = []; w.cool = []; }
      openPreview(w, 'hist');
    };
  });
}

/* ---------- Repeticiones aproximadas de una sesión ---------- */
const REP_CAT = { sq: /squat/, pu: /push_up/, ab: /crunch|sit_up|v_up|bicycle|leg_raise|toe_touch|russian_twist|scissor_kick|beetle|windshield|knee_tuck/, bu: /burpee/ };
const REP_SECS = { sq: 2.5, pu: 3, ab: 2.5, bu: 5 };
function repsOf(x, upto) {
  const r = { sq: 0, pu: 0, ab: 0, bu: 0, pl: 0, dm: 0 };
  if (x.w.kind === 'reto') return { ...r, ...(x.reps || {}) };
  if (x.w.kind === 'test') { const t = x.w.results || {}; r.sq = +t.sq || 0; r.pu = +t.pu || 0; r.ab = +t.ab || 0; return r; }
  let tl; try { tl = buildTimeline(x.w); } catch (e) { return r; }
  const end = upto != null ? upto : (x.full ? tl.length : Math.round(tl.length * 0.5));
  tl.slice(0, end).forEach(s => {
    if (s.k !== 'work' || s.soft) return;
    const id = ex(s.ex).id;
    for (const k in REP_CAT) if (REP_CAT[k].test(id)) { r[k] += s.reps || Math.round(s.dur / REP_SECS[k]); break; }
    if (/plank/.test(id) && !s.reps) r.pl += s.dur;
  });
  return r;
}

/* ---------- Logros ---------- */
const sumR = (H, k) => H.reduce((a, x) => a + ((x.reps || repsOf(x))[k] || 0), 0);
const weekKey = t => { const d = new Date(dayStart(t)); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
function weekStreak(H) {
  const weeks = new Set(H.filter(x => x.full).map(x => weekKey(x.at)));
  let best = 0, cur = 0, prev = null;
  [...weeks].sort((a, b) => a - b).forEach(w => { cur = prev != null && Math.round((w - prev) / (7 * DAY)) === 1 ? cur + 1 : 1; best = Math.max(best, cur); prev = w; });
  return best;
}
function awardCtx() {
  const H = PS.get('history', []), full = H.filter(x => x.full && x.w.kind !== 'test');
  const sm = getSmart() || {}, plan = getPlan(), pd = PS.get('plansDone', []);
  const byWeek = {}; full.forEach(x => { const k = weekKey(x.at); byWeek[k] = (byWeek[k] || 0) + 1; });
  const tests = (sm.tests || []);
  const hrs = H.filter(x => x.hr);
  let planWeeks = 0;
  if (plan) for (let w = 1; w <= FAM[plan.fam].weeks; w++) if (weekDone(plan, w)) planWeeks++;
  return {
    H, n: full.length, mins: Math.round(H.reduce((a, x) => a + x.secs, 0) / 60),
    sq: sumR(H, 'sq'), pu: sumR(H, 'pu'), ab: sumR(H, 'ab'), bu: sumR(H, 'bu'), pl: sumR(H, 'pl'),
    streak: weekStreak(H), maxWeek: Math.max(0, ...Object.values(byWeek)),
    long: Math.max(0, ...full.map(x => x.secs)),
    early: full.some(x => new Date(x.start || x.at - x.secs * 1000).getHours() < 7),
    night: full.some(x => new Date(x.start || x.at - x.secs * 1000).getHours() >= 22),
    nopause: full.some(x => x.pauses === 0 && x.secs >= 600),
    weekend: full.some(x => { const d = new Date(x.at); if (d.getDay() !== 0) return false; return full.some(y => y.at < x.at && x.at - y.at < 2 * DAY && new Date(y.at).getDay() === 6); }),
    tests: tests.length, improved: tests.length > 1 && ['sq', 'pu', 'ab'].some(k => tests[0][k] > tests[1][k]),
    I: sm.I || 0, hard: H.filter(x => x.fb === 'hard' && x.full).length,
    planWeeks: planWeeks + pd.length * 4, plansDone: pd.length,
    dm: sumR(H, 'dm'), retoN: H.filter(x => x.w.kind === 'reto').length,
    retoPass: Object.values(PS.get('retos', {}) || {}).reduce((a, s) => a + (s.log || []).filter(l => l.test && l.passed).length, 0),
    retoGoal: Object.values(PS.get('retos', {}) || {}).reduce((a, s) => a + (s.goalsDone || 0), 0),
    hr: hrs.length, z5: hrs.some(x => x.hr.zones[4] > 0), z45: Math.max(0, ...hrs.map(x => x.hr.zones[3] + x.hr.zones[4])),
  };
}
// [id, icono, nombre, descripción, nivel (1 bronce, 2 plata, 3 oro), comprobación, progreso opcional]
const AWARDS = [
  ['first', '🏁', 'Primer paso', 'Completaste tu primer entrenamiento.', 1, c => c.n >= 1],
  ['s5', '⭐', '5 entrenamientos', 'Completaste 5 entrenamientos.', 1, c => c.n >= 5, c => [c.n, 5]],
  ['s10', '💪', '10 entrenamientos', 'Completaste 10 entrenamientos.', 2, c => c.n >= 10, c => [c.n, 10]],
  ['s25', '🎖️', '25 entrenamientos', 'Completaste 25 entrenamientos.', 2, c => c.n >= 25, c => [c.n, 25]],
  ['s50', '🏅', '50 entrenamientos', 'Completaste 50 entrenamientos.', 3, c => c.n >= 50, c => [c.n, 50]],
  ['s100', '🏆', '100 entrenamientos', 'Completaste 100 entrenamientos. ¡Leyenda!', 3, c => c.n >= 100, c => [c.n, 100]],
  ['wk3', '📆', 'Semana redonda', '3 entrenamientos en una misma semana.', 1, c => c.maxWeek >= 3, c => [c.maxWeek, 3]],
  ['wk5', '⚡', 'Imparable', '5 entrenamientos en una misma semana.', 2, c => c.maxWeek >= 5, c => [c.maxWeek, 5]],
  ['st2', '🔥', '2 semanas seguidas', 'Entrenaste todas las semanas durante 2 semanas.', 1, c => c.streak >= 2, c => [c.streak, 2]],
  ['st4', '🗓️', '1 mes de constancia', 'Entrenaste todas las semanas durante 4 semanas.', 2, c => c.streak >= 4, c => [c.streak, 4]],
  ['st8', '🌟', '2 meses de constancia', 'Entrenaste todas las semanas durante 8 semanas.', 3, c => c.streak >= 8, c => [c.streak, 8]],
  ['st12', '👑', '3 meses de constancia', 'Entrenaste todas las semanas durante 12 semanas.', 3, c => c.streak >= 12, c => [c.streak, 12]],
  ['sq100', '🦵', '100 sentadillas', 'Sumaste 100 sentadillas.', 1, c => c.sq >= 100, c => [c.sq, 100]],
  ['sq500', '🦵', '500 sentadillas', 'Sumaste 500 sentadillas.', 2, c => c.sq >= 500, c => [c.sq, 500]],
  ['sq1000', '🦵', '1000 sentadillas', 'Sumaste 1000 sentadillas.', 3, c => c.sq >= 1000, c => [c.sq, 1000]],
  ['pu100', '🤜', '100 flexiones', 'Sumaste 100 flexiones.', 1, c => c.pu >= 100, c => [c.pu, 100]],
  ['pu500', '🤜', '500 flexiones', 'Sumaste 500 flexiones.', 2, c => c.pu >= 500, c => [c.pu, 500]],
  ['pu1000', '🤜', '1000 flexiones', 'Sumaste 1000 flexiones.', 3, c => c.pu >= 1000, c => [c.pu, 1000]],
  ['ab100', '🍫', '100 abdominales', 'Sumaste 100 abdominales.', 1, c => c.ab >= 100, c => [c.ab, 100]],
  ['ab500', '🍫', '500 abdominales', 'Sumaste 500 abdominales.', 2, c => c.ab >= 500, c => [c.ab, 500]],
  ['ab1000', '🍫', '1000 abdominales', 'Sumaste 1000 abdominales.', 3, c => c.ab >= 1000, c => [c.ab, 1000]],
  ['bu50', '🐸', '50 burpees', 'Sumaste 50 burpees.', 1, c => c.bu >= 50, c => [c.bu, 50]],
  ['bu250', '🐸', '250 burpees', 'Sumaste 250 burpees.', 3, c => c.bu >= 250, c => [c.bu, 250]],
  ['pl10', '🧱', '10 minutos de plancha', 'Sumaste 10 minutos en planchas.', 2, c => c.pl >= 600, c => [Math.floor(c.pl / 60), 10]],
  ['m60', '⏱️', '1 hora entrenando', 'Sumaste 60 minutos de entrenamiento.', 1, c => c.mins >= 60, c => [c.mins, 60]],
  ['m300', '⏳', '5 horas entrenando', 'Sumaste 5 horas de entrenamiento.', 2, c => c.mins >= 300, c => [c.mins, 300]],
  ['m1000', '🕰️', '1000 minutos', 'Sumaste 1000 minutos de entrenamiento.', 3, c => c.mins >= 1000, c => [c.mins, 1000]],
  ['l30', '🧗', 'Media hora a tope', 'Una sesión completa de 30 minutos o más.', 2, c => c.long >= 1800],
  ['l45', '🏔️', 'Maratón HIIT', 'Una sesión completa de 45 minutos o más.', 3, c => c.long >= 2700],
  ['np', '🎯', 'Sin pausas', 'Completaste 10 minutos o más sin pausar ni una vez.', 2, c => c.nopause],
  ['early', '🌅', 'Madrugador', 'Entrenaste antes de las 7 de la mañana.', 1, c => c.early],
  ['night', '🌙', 'Búho', 'Entrenaste después de las 10 de la noche.', 1, c => c.night],
  ['wknd', '🏖️', 'Finde activo', 'Entrenaste sábado y domingo del mismo fin de semana.', 1, c => c.weekend],
  ['test', '📏', 'Me medí', 'Hiciste la prueba de capacidad.', 1, c => c.tests >= 1],
  ['imp', '📈', 'Mejoraste', 'Superaste un resultado de tu prueba anterior.', 2, c => c.improved],
  ['i5', '🚀', 'Intensidad 5', 'Tu entrenador llegó a intensidad 5.', 2, c => c.I >= 5],
  ['i8', '🛸', 'Intensidad 8', 'Tu entrenador llegó a intensidad 8.', 3, c => c.I >= 8],
  ['hard3', '🦁', 'Valiente', 'Completaste 3 sesiones que te parecieron difíciles.', 2, c => c.hard >= 3, c => [c.hard, 3]],
  ['pw1', '📋', 'Semana de plan', 'Completaste una semana de un plan.', 1, c => c.planWeeks >= 1],
  ['pdone', '🎓', 'Plan terminado', 'Terminaste un plan completo.', 3, c => c.plansDone >= 1],
  ['hr1', '❤️', 'Con el corazón', 'Guardaste tu primera sesión con pulso.', 1, c => c.hr >= 1],
  ['z5', '🌡️', 'Al máximo', 'Llegaste a la zona 5 de pulso (90% de tu máximo).', 2, c => c.z5],
  ['z45', '♨️', 'Zona roja', '10 minutos en zonas 4–5 en una misma sesión.', 3, c => c.z45 >= 600],
  ['reto1', '🎯', 'Primer reto', 'Hiciste tu primera sesión de un reto de repeticiones.', 1, c => c.retoN >= 1],
  ['retoEt', '🪜', 'Etapa superada', 'Superaste la prueba de una etapa de un reto.', 2, c => c.retoPass >= 1],
  ['retoMeta', '🥇', 'Meta alcanzada', 'Llegaste a la meta de un rango de un reto, por ejemplo 100 abdominales seguidas.', 3, c => c.retoGoal >= 1],
  ['dm100', '🧗', '100 dominadas', 'Sumaste 100 dominadas.', 2, c => c.dm >= 100, c => [c.dm, 100]],
  ['dm500', '🧗', '500 dominadas', 'Sumaste 500 dominadas.', 3, c => c.dm >= 500, c => [c.dm, 500]],
];
const AWARD_TIER = ['', '#c98a54', '#c3ccd6', '#f5c542'];
let awardQueue = [];
function checkAwards(show) {
  if (!PROFILE) return [];
  const got = PS.get('awards', null), first = got == null, g = got || {};
  let c; try { c = awardCtx(); } catch (e) { return []; }
  const fresh = [];
  AWARDS.forEach(a => { if (!g[a[0]] && a[5](c)) { g[a[0]] = Date.now(); fresh.push(a); } });
  if (fresh.length || first) PS.set('awards', g);
  // la primera vez se marcan en silencio los logros que ya tenías
  if (show && !first && fresh.length) { awardQueue.push(...fresh); if (!$('#award-root').innerHTML) nextAward(); }
  return fresh;
}
function medalSVG(a, on, size = 64) {
  const col = on ? AWARD_TIER[a[4]] : '#3a3f4a';
  return `<span class="medal ${on ? 'on' : ''}" style="--mc:${col};width:${size}px;height:${size}px"><span class="ic" style="font-size:${size * 0.44}px">${on ? a[1] : '🔒'}</span></span>`;
}
function nextAward() {
  const a = awardQueue.shift(), root = $('#award-root');
  if (!a) { root.innerHTML = ''; return; }
  root.innerHTML = `<div class="award-scrim"><div class="award-card">${'<i class="cf"></i>'.repeat(14)}
    <div class="aw-k">¡Logro conseguido!</div>${medalSVG(a, true, 120)}
    <b class="aw-n">${esc(a[2])}</b><p class="aw-d">${esc(a[3])}</p>
    <button class="btn" id="aw-ok">${awardQueue.length ? 'Siguiente (' + awardQueue.length + ')' : '¡Genial!'}</button></div></div>`;
  beep(784, 120, .2); setTimeout(() => beep(988, 120, .2), 130); setTimeout(() => beep(1318, 260, .22), 260);
  setTimeout(() => say('Logro conseguido: ' + a[2]), 500);
  $('#aw-ok').onclick = nextAward;
}
let awardsAll = false;
function awardsHTML() {
  const g = PS.get('awards', {}) || {};
  let c = null; try { c = awardCtx(); } catch (e) {}
  const n = AWARDS.filter(a => g[a[0]]).length;
  // vista corta: los conseguidos y los más cercanos a conseguirse
  const prog = a => { if (g[a[0]]) return 2; if (!a[6] || !c) return 0; const p = a[6](c); return Math.min(0.99, p[0] / p[1]); };
  const list = awardsAll ? AWARDS : [...AWARDS].sort((x, y) => prog(y) - prog(x)).slice(0, Math.max(8, n + 4));
  return `<h2>Logros · ${n} de ${AWARDS.length}</h2><div class="awards">${list.map(a => {
    const on = !!g[a[0]], pr = !on && a[6] && c ? a[6](c) : null;
    return `<button class="aw ${on ? 'on' : ''}" data-aw="${a[0]}">${medalSVG(a, on, 54)}<small>${esc(a[2])}</small>${pr ? `<span class="awp"><i style="width:${Math.min(100, Math.round(pr[0] / pr[1] * 100))}%"></i></span>` : ''}</button>`;
  }).join('')}</div><button class="btn ghost small" id="aw-all">${awardsAll ? 'Ver menos' : 'Ver todos los logros'}</button>`;
}
function openAward(id) {
  const a = AWARDS.find(x => x[0] === id), g = PS.get('awards', {}) || {}, on = !!g[id];
  let pr = null; try { pr = !on && a[6] ? a[6](awardCtx()) : null; } catch (e) {}
  sheet(`<div style="text-align:center;padding:10px 0">${medalSVG(a, on, 110)}<h3>${esc(a[2])}</h3><p class="sub">${esc(a[3])}</p>
    <p class="note">${on ? 'Conseguido el ' + dateStr(g[id]) : pr ? `Progreso: ${Math.min(pr[0], pr[1])} de ${pr[1]}` : 'Aún no conseguido'}</p></div>
    <button class="btn ghost" onclick="closeSheet()">Cerrar</button>`);
}

/* ---------- Copias de seguridad completas (todos los perfiles) ---------- */
async function deliverJSON(obj, fname) {
  const text = JSON.stringify(obj);
  const file = new File([text], fname, { type: 'application/json' });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Copia de Intervalo' }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try {
    const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = fname;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  } catch (e) { copyText(text); }
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('Copia copiada al portapapeles'); }
  catch (e) { sheet(`<h3>Copia en texto</h3><p class="sub">Selecciona todo y cópialo.</p><textarea class="paste" readonly>${esc(text)}</textarea>`); }
}
function profileData(id) { const d = {}; PROFILE_KEYS.forEach(k => { const v = LS.get(`p.${id}.${k}`, null); if (v != null) d[k] = v; }); return d; }
function backupAll() { return { app: 'intervalo', v: 3, all: true, exportedAt: Date.now(), active: PROFILE && PROFILE.id, profiles: profiles().map(p => ({ profile: p, data: profileData(p.id) })) }; }
function importBackup(j) {
  if (!j || j.app !== 'intervalo') throw new Error('formato');
  const list = j.all ? j.profiles : [{ profile: j.profile, data: j.data }];
  if (!list || !list.length) throw new Error('vacío');
  const clash = list.filter(x => profiles().some(p => p.id === x.profile.id));
  const replace = clash.length ? confirm(`${clash.length === 1 ? 'Ya existe el perfil "' + clash[0].profile.name + '"' : 'Ya existen ' + clash.length + ' de estos perfiles'} en este navegador.\n\nAceptar: reemplazar sus datos con la copia.\nCancelar: importarlos como perfiles nuevos.`) : false;
  let lastId = null;
  list.forEach(({ profile, data }) => {
    const ex0 = profiles().find(p => p.id === profile.id);
    if (ex0 && replace) {
      PROFILE_KEYS.forEach(k => LS.del(`p.${ex0.id}.${k}`));
      Object.entries(data || {}).forEach(([k, v]) => { if (PROFILE_KEYS.includes(k)) LS.set(`p.${ex0.id}.${k}`, v); });
      const l2 = profiles(); const q = l2.find(p => p.id === ex0.id); Object.assign(q, { name: profile.name, variant: profile.variant, color: profile.color || q.color }); saveProfiles(l2);
      lastId = ex0.id;
    } else if (!ex0) {
      const l2 = profiles(); l2.push({ ...profile }); saveProfiles(l2);
      Object.entries(data || {}).forEach(([k, v]) => { if (PROFILE_KEYS.includes(k)) LS.set(`p.${profile.id}.${k}`, v); });
      lastId = profile.id;
    } else lastId = createProfile(profile.name + ' (copia)', profile.variant || 'f', data).id;
  });
  const want = j.all && j.active && profiles().some(p => p.id === j.active) ? j.active : lastId;
  closeSheet(); switchProfile(want);
  toast(list.length > 1 ? `${list.length} perfiles importados` : 'Copia importada');
}
function openBackup() {
  const stamp = new Date().toISOString().slice(0, 10), slugName = PROFILE.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-');
  sheet(`<h3>Copia de seguridad</h3>
    <p class="sub">Incluye ajustes, historial (con pulso), guardados, plan y progreso, entrenador inteligente, próxima sesión y logros. Sirve para pasar todo a otro navegador o móvil.</p>
    <h2>Exportar</h2>
    <div class="row"><button class="btn small" id="bk-me">Este perfil</button><button class="btn small" id="bk-all">Todos los perfiles</button></div>
    <div class="gap"></div><button class="btn ghost small" id="bk-copy">Copiar todo como texto</button>
    <h2>Importar</h2>
    <button class="btn ghost small" id="bk-file">Desde un archivo .json</button>
    <div class="gap"></div>
    <textarea class="paste" id="bk-text" placeholder="…o pega aquí el texto de una copia"></textarea>
    <div class="gap"></div><button class="btn ghost small" id="bk-paste">Importar el texto pegado</button>
    <p class="note">En iPhone, «Exportar» abre el menú Compartir: elige «Guardar en Archivos». Para importar en otro navegador (por ejemplo Bluefy), usa «Desde un archivo» o pega el texto.</p>`, () => {
    $('#bk-me').onclick = () => deliverJSON({ app: 'intervalo', v: 3, exportedAt: Date.now(), profile: PROFILE, data: profileData(PROFILE.id) }, `intervalo-${slugName}-${stamp}.json`);
    $('#bk-all').onclick = () => deliverJSON(backupAll(), `intervalo-todo-${stamp}.json`);
    $('#bk-copy').onclick = () => copyText(JSON.stringify(backupAll()));
    $('#bk-file').onclick = () => $('#import-file').click();
    $('#bk-paste').onclick = () => { try { importBackup(JSON.parse($('#bk-text').value.trim())); } catch (e) { toast('Ese texto no es una copia válida'); } };
  });
}
// el selector de archivo de copias usa el importador nuevo (perfil suelto o todos)
$('#import-file').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try { importBackup(JSON.parse(await f.text())); } catch (err) { toast('Ese archivo no es una copia válida'); }
};

// al cargar: estado del botón de pulso y logros ya conseguidos (sin avisos)
hrUI();
if (PROFILE) checkAwards(false);
