'use strict';
/* =========================================================
   Funciones nuevas: meta semanal, compartir la sesión como imagen, peso y medidas,
   fotos de progreso, rutinas propias y desafíos con amigos.
   ========================================================= */

/* ---------- Meta semanal ----------
   S.goal = { k: 'n' (sesiones) | 'm' (minutos), v: número }. Se muestra como anillo en Coach y en Historial → Resumen. */
const GOAL_DEF = { k: 'n', v: 3 };
const goalOf = () => ({ ...GOAL_DEF, ...(S.goal || {}) });
function weekProgress() {
  const wk = weekKey(Date.now()), H = PS.get('history', []).filter(x => weekKey(x.at) === wk && x.w && x.w.kind !== 'test');
  return { n: H.length, m: Math.round(H.reduce((a, x) => a + (x.secs || 0), 0) / 60) };
}
const goalLabel = () => { const g = goalOf(); return g.k === 'm' ? t('Meta: {0} min por semana', g.v) : t(g.v === 1 ? 'Meta: {0} sesión por semana' : 'Meta: {0} sesiones por semana', g.v); };
function ringSVG(p, size = 64, stroke = 8) {
  const r = (size - stroke) / 2, C = 2 * Math.PI * r, f = Math.min(1, p);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" style="stroke:var(--surface2)" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" style="stroke:var(--work)" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${(C * f).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`;
}
function goalCardHTML() {
  const g = goalOf(), w = weekProgress(), have = g.k === 'm' ? w.m : w.n, p = have / g.v, done = have >= g.v;
  const left = g.v - have, dLeft = 7 - ((new Date().getDay() + 6) % 7);
  const msg = done ? t('¡Meta cumplida! Llevas {0} esta semana.', g.k === 'm' ? t('{0} min', have) : t(have === 1 ? '{0} sesión' : '{0} sesiones', have))
    : g.k === 'm' ? t('Te faltan {0} min · quedan {1} días', left, dLeft) : t(left === 1 ? 'Te falta {0} sesión · quedan {1} días' : 'Te faltan {0} sesiones · quedan {1} días', left, dLeft);
  return `<button class="goal${done ? ' met' : ''}" data-goal aria-label="${esc(goalLabel())}">
    <span class="gr">${ringSVG(p, 48, 6)}<b data-noi18n>${done ? '✓' : have}</b></span>
    <span class="t"><b>${g.k === 'm' ? t('{0} de {1} min esta semana', have, g.v) : t('{0} de {1} sesiones esta semana', have, g.v)}</b><small>${msg}</small></span>
    <svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg></button>`;
}
function renderGoal() {
  ['#goal-card', '#goal-card2'].forEach(id => { const el = $(id); if (el && PROFILE) { el.innerHTML = goalCardHTML(); el.querySelector('[data-goal]').onclick = () => openGoal(); } });
}
function openGoal() {
  const g = goalOf(); let k = g.k, v = g.v;
  const opts = () => k === 'm' ? [30, 45, 60, 90, 120, 150, 180, 240] : [1, 2, 3, 4, 5, 6, 7];
  const draw = () => {
    if (!opts().includes(v)) v = k === 'm' ? 90 : 3;
    $('#gl-v').innerHTML = opts().map(x => `<button class="chip" data-v="${x}" aria-pressed="${x === v}">${x}${k === 'm' ? '<small>min</small>' : ''}</button>`).join('');
  };
  sheet(`<h3>Meta semanal</h3>
    <p class="sub">Cuántas sesiones o minutos quieres entrenar por semana (de lunes a domingo). Cuenta todo: planes, coach, mancuernas, retos y rutinas.</p>
    <div class="seg" id="gl-k"><button data-k="n" aria-pressed="${k === 'n'}">Sesiones</button><button data-k="m" aria-pressed="${k === 'm'}">Minutos</button></div>
    <div class="dur" id="gl-v" style="margin-top:12px"></div>
    <div class="gap"></div><button class="btn" id="gl-ok">Guardar</button>`, () => {
    draw();
    bindSeg('gl-k', 'k', x => { k = x; draw(); });
    $('#gl-v').onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; v = +b.dataset.v; draw(); };
    $('#gl-ok').onclick = () => { S.goal = { k, v }; save(); renderGoal(); if (SHEET_BACK.length) sheetBack(); else closeSheet(); toast('Meta guardada'); };
  });
}
// al terminar: ¿se acaba de cumplir la meta de la semana? (se avisa una sola vez por semana)
function goalJustHit() {
  const g = goalOf(), w = weekProgress(), have = g.k === 'm' ? w.m : w.n, wk = weekKey(Date.now());
  if (have < g.v || PS.get('goalHit', 0) === wk) return false;
  PS.set('goalHit', wk); return true;
}
function goalDoneHTML() {
  return `<div class="banner goal-hit"><span class="gr">${ringSVG(1, 46, 6)}<b>✓</b></span><div class="t"><b>¡Meta semanal cumplida!</b><small>${esc(goalLabel())}</small></div></div>`;
}

/* ---------- Compartir la sesión como imagen ---------- */
// logo de la imagen con los colores del tema (los mismos tonos del acento que usa el logo de la cabecera)
let LOGO_SVG = null;
const hexRgb = c => { c = c.trim(); if (c[0] === '#') { if (c.length === 4) c = '#' + [...c.slice(1)].map(x => x + x).join(''); return [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)); } const m = c.match(/\d+(\.\d+)?/g); return m ? m.slice(0, 3).map(Number) : [255, 90, 54]; };
const mixHex = (a, b, k) => '#' + a.map((v, i) => Math.round(v * k + b[i] * (1 - k)).toString(16).padStart(2, '0')).join('');
async function shareLogo(accent) {
  try {
    if (!LOGO_SVG) LOGO_SVG = await (await fetch('icons/logo.svg')).text();
    const a = hexRgb(accent), blk = [0, 0, 0];
    const col = { st2: mixHex(a, blk, 1), st4: mixHex(a, blk, .74), st6: mixHex(a, [11, 11, 11], .30), st3: mixHex(a, [7, 7, 7], .15) };
    const svg = LOGO_SVG.replace(/\.(st[2346])\{fill:#[0-9A-Fa-f]{6};/g, (m, k) => `.${k}{fill:${col[k]};`).replace(/\.st5\{fill:#[0-9A-Fa-f]{6};/, `.st5{fill:${col.st4};`);
    return await new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
  } catch (e) { return null; }
}
function sessionFacts(x) {
  const mins = Math.round((x.secs || 0) / 60), items = typeof stItems === 'function' ? stItems(x) : [];
  const reps = items.reduce((a, it) => a + (it.reps || 0), 0);
  const kcal = x.hr && x.hr.kcal ? x.hr.kcal : Math.round(items.reduce((a, it) => a + kcalOf(it.id, it.secs), 0));
  const days = new Set(PS.get('history', []).map(x2 => dayStart(x2.at))); let streak = 0;
  for (let d = dayStart(Date.now()); days.has(d); d -= DAY) streak++;
  const w = weekProgress(), g = goalOf();
  return { title: title(x.w), mins, reps, kcal, hr: x.hr && x.hr.avg, streak, week: g.k === 'm' ? [w.m, g.v, 'min'] : [w.n, g.v, ''] };
}
async function shareImage(x) {
  const css = getComputedStyle(document.documentElement), col = v => css.getPropertyValue(v).trim() || '#fff';
  const bg = col('--bg'), sf = col('--surface'), tx = col('--text'), mu = col('--muted'), ac = col('--work');
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const F = s => `${s}px -apple-system, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const gr = g.createRadialGradient(W * .85, 120, 40, W * .85, 120, 700); gr.addColorStop(0, ac + '55'); gr.addColorStop(1, ac + '00'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const logo = await shareLogo(ac); if (logo) { const lw = 340, lh = lw * 623 / 644; g.drawImage(logo, (W - lw) / 2, 70, lw, lh); }
  const f = sessionFacts(x);
  g.textAlign = 'center'; g.fillStyle = ac; g.font = '700 ' + F(40);
  g.fillText(t('ENTRENAMIENTO COMPLETADO').toUpperCase(), W / 2, 500);
  g.fillStyle = tx; g.font = '800 ' + F(62); const ttl = f.title.length > 30 ? f.title.slice(0, 29) + '…' : f.title; g.fillText(ttl, W / 2, 580);
  g.fillStyle = mu; g.font = F(36); g.fillText(new Date(x.at).toLocaleDateString(LOC, { weekday: 'long', day: 'numeric', month: 'long' }), W / 2, 636);
  const tiles = [[f.mins, t('minutos')], [f.kcal, t('kcal aprox.')], f.hr ? [f.hr, t('pulso medio')] : [f.reps || '—', t('repeticiones')], [f.streak, t(f.streak === 1 ? 'día de racha' : 'días de racha')]];
  const tw = 450, th = 210, gx = 40, x0 = (W - tw * 2 - gx) / 2;
  tiles.forEach(([v, l], i) => {
    const tx0 = x0 + (i % 2) * (tw + gx), ty = 700 + Math.floor(i / 2) * (th + gx);
    g.fillStyle = sf; g.beginPath(); g.roundRect ? g.roundRect(tx0, ty, tw, th, 36) : g.rect(tx0, ty, tw, th); g.fill();
    g.fillStyle = tx; g.font = '800 ' + F(96); g.fillText(String(v), tx0 + tw / 2, ty + 120);
    g.fillStyle = mu; g.font = F(34); g.fillText(l, tx0 + tw / 2, ty + 172);
  });
  const [have, goal, u] = f.week, p = Math.min(1, have / goal), by = 1220;
  g.fillStyle = sf; g.beginPath(); g.roundRect ? g.roundRect(x0, by - 34, tw * 2 + gx, 26, 13) : g.rect(x0, by - 34, tw * 2 + gx, 26); g.fill();
  g.fillStyle = ac; g.beginPath(); g.roundRect ? g.roundRect(x0, by - 34, Math.max(26, (tw * 2 + gx) * p), 26, 13) : g.rect(x0, by - 34, (tw * 2 + gx) * p, 26); g.fill();
  g.fillStyle = mu; g.font = F(34); g.fillText(u ? t('Semana: {0} de {1} min', have, goal) : t('Semana: {0} de {1} sesiones', have, goal), W / 2, by + 50);
  g.fillStyle = mu; g.font = '600 ' + F(28); g.fillText('INHIIT', W / 2, H - 30);
  return new Promise(r => c.toBlob(r, 'image/png'));
}
async function shareSession(x) {
  if (!x) return;
  toast('Preparando la imagen…');
  let blob; try { blob = await shareImage(x); } catch (e) { console.error(e); toast('No se pudo preparar la imagen'); return; }
  const file = new File([blob], 'inhiit-sesion.png', { type: 'image/png' });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'INHIIT' }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  const u = URL.createObjectURL(blob);
  sheet(`<h3>Tu sesión</h3><img src="${u}" alt="" style="width:100%;border-radius:16px;display:block">
    <p class="note">Mantén apretada la imagen para guardarla o compartirla.</p><a class="btn" href="${u}" download="inhiit-sesion.png">Descargar imagen</a>`);
}

/* ---------- Peso y medidas ----------
   PS 'body' = [{ at, kg, waist, hip, chest, arm, thigh }] (va en la copia en la nube y en el archivo) */
const BODY = [['kg', 'Peso', 'kg'], ['waist', 'Cintura', 'cm'], ['hip', 'Cadera', 'cm'], ['chest', 'Pecho', 'cm'], ['arm', 'Brazo', 'cm'], ['thigh', 'Muslo', 'cm']];
let bodySel = 'kg';
const nfb = v => (Math.round(v * 10) / 10).toLocaleString(LOC);
function bodyHTML() {
  const B = PS.get('body', []);
  const last = k => B.find(e => e[k] != null), first = k => [...B].reverse().find(e => e[k] != null);
  const cards = BODY.map(([k, n, u]) => { const l = last(k); if (!l) return ''; const f = first(k), d = l[k] - f[k];
    return `<button class="kpi bk" data-bm="${k}" aria-pressed="${bodySel === k}"><b>${nfb(l[k])} <small>${u}</small></b><span>${n}${f !== l && Math.abs(d) >= .1 ? ` · <i class="${(k === 'kg' || k === 'waist' || k === 'hip') ? (d < 0 ? 'pg-up' : 'pg-down') : (d > 0 ? 'pg-up' : 'pg-down')}">${d > 0 ? '+' : '−'}${nfb(Math.abs(d))}</i>` : ''}</span></button>`; }).join('');
  const pts = B.filter(e => e[bodySel] != null).map(e => ({ at: e.at, v: e[bodySel] })).reverse().slice(-30);
  const u = (BODY.find(x => x[0] === bodySel) || [])[2];
  return `<h3 class="st-h">Peso y medidas</h3>
    <button class="btn" id="bd-add">+ Registrar peso o medidas</button>
    ${B.length ? `<div class="kpis" style="margin-top:12px">${cards}</div>
      ${pts.length >= 2 ? `<div class="chart pgc">${lineSVG(pts, v => nfb(v) + ' ' + u)}</div>` : '<p class="note">Con dos registros o más aparece el gráfico. Toca una medida para verla.</p>'}
      <button class="btn ghost small" id="bd-hist" style="margin-top:10px">Ver todos los registros</button>`
    : '<p class="note">Registra tu peso (y si quieres, cintura, cadera y otras medidas) cada semana o cada dos para ver cómo cambian. El peso también se usa para calcular las calorías.</p>'}
    <h3 class="st-h">Fotos de progreso</h3><div id="photos"></div>`;
}
function renderBody() {
  const el = $('#body'); if (!el || !PROFILE) return;
  el.innerHTML = bodyHTML();
  $('#bd-add').onclick = () => openBodyForm();
  el.querySelectorAll('[data-bm]').forEach(b => b.onclick = () => { bodySel = b.dataset.bm; renderBody(); });
  const h = $('#bd-hist'); if (h) h.onclick = openBodyList;
  renderPhotos();
}
function openBodyForm() {
  const B = PS.get('body', []), last = B[0] || {};
  sheet(`<h3>Peso y medidas</h3>
    <div class="adv bd-f" style="grid-template-columns:1fr 1fr;padding:0">${BODY.map(([k, n, u]) => `<label>${n} (${u})<input type="number" inputmode="decimal" step="0.1" id="bd-${k}" placeholder="${last[k] != null ? nfb(last[k]) : '—'}"></label>`).join('')}</div>
    <p class="note">Completa solo lo que quieras medir hoy. Las medidas se toman siempre en el mismo lugar y a la misma hora (mejor en ayunas).</p>
    <div class="row"><button class="btn ghost small" id="bd-no">Cancelar</button><button class="btn small" id="bd-ok">Guardar</button></div>`, () => {
    $('#bd-no').onclick = () => closeSheet();
    $('#bd-ok').onclick = () => {
      const e = { at: Date.now() }; let any = false;
      BODY.forEach(([k]) => { const v = parseFloat(String($('#bd-' + k).value).replace(',', '.')); if (isFinite(v) && v > 0 && v < 400) { e[k] = Math.round(v * 10) / 10; any = true; } });
      if (!any) { toast('Escribe al menos un valor'); return; }
      const B2 = PS.get('body', []); B2.unshift(e); PS.set('body', B2.slice(0, 500));
      if (e.kg && e.kg >= 25 && e.kg <= 250) { S.weight = e.kg; save(); }   // el peso nuevo se usa para las calorías
      closeSheet(); renderBody(); toast('Registrado');
    };
  }, false, true);
}
function openBodyList() {
  const B = PS.get('body', []);
  sheet(`<h3>Registros</h3><div class="block">${B.map((e, i) => `<div class="hist"><div class="t"><b>${dateStr(e.at)}</b><small>${BODY.filter(([k]) => e[k] != null).map(([k, n, u]) => `${n} ${nfb(e[k])} ${u}`).join(' · ')}</small></div>
    <button class="icon-btn" data-bdel="${i}" aria-label="Borrar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/></svg></button></div>`).join('')}</div>`, root => {
    root.querySelectorAll('[data-bdel]').forEach(b => b.onclick = async () => {
      if (!(await askApp('Borrar registro', dateStr(B[+b.dataset.bdel].at), 'Borrar', true))) { openBodyList(); return; }
      const B2 = PS.get('body', []); B2.splice(+b.dataset.bdel, 1); PS.set('body', B2); renderBody(); openBodyList();
    });
  });
}

/* ---------- Fotos de progreso ----------
   Quedan SOLO en este teléfono (IndexedDB), no van a la nube ni a la copia: son privadas. */
const PH_DB = 'inhiit-photos';
function phDB() {
  return new Promise((res, rej) => { const r = indexedDB.open(PH_DB, 1); r.onupgradeneeded = () => r.result.createObjectStore('p', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
async function phAll() {
  const db = await phDB();
  return new Promise(res => { const out = []; const q = db.transaction('p').objectStore('p').openCursor(); q.onsuccess = () => { const c = q.result; if (c) { if (c.value.pid === PROFILE.id) out.push(c.value); c.continue(); } else res(out.sort((a, b) => b.at - a.at)); }; q.onerror = () => res(out); });
}
async function phPut(o) { const db = await phDB(); return new Promise((res, rej) => { const tx = db.transaction('p', 'readwrite'); tx.objectStore('p').put(o); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); }
async function phDel(id) { const db = await phDB(); return new Promise(res => { const tx = db.transaction('p', 'readwrite'); tx.objectStore('p').delete(id); tx.oncomplete = res; tx.onerror = res; }); }
let phUrls = [], phSel = [];
async function renderPhotos() {
  const el = $('#photos'); if (!el) return;
  phUrls.forEach(u => URL.revokeObjectURL(u)); phUrls = [];
  const tok = (renderPhotos.tok = (renderPhotos.tok || 0) + 1);
  let P = []; try { P = await phAll(); } catch (e) { if (el.isConnected) el.innerHTML = '<p class="note">Este navegador no permite guardar fotos.</p>'; return; }
  if (tok !== renderPhotos.tok || !el.isConnected) return;   // mientras leía, la sección se volvió a dibujar
  phSel = phSel.filter(id => P.some(p => p.id === id));
  el.innerHTML = `<p class="note">Solo quedan en este teléfono (no se suben a la nube). Toca dos para compararlas.</p>
    <div class="ph-grid"><button class="ph-add" id="ph-add"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg><span>${t('Agregar foto')}</span></button>
    ${P.map(p => { const u = URL.createObjectURL(p.blob); phUrls.push(u); return `<button class="ph" data-ph="${p.id}" aria-pressed="${phSel.includes(p.id)}"><img src="${u}" alt=""><span data-noi18n>${dateStr(p.at)}</span></button>`; }).join('')}</div>
    ${phSel.length === 2 ? '<button class="btn" id="ph-cmp" style="margin-top:10px">Comparar las dos fotos</button>' : ''}`;
  el.querySelector('#ph-add').onclick = addProgressPhoto;
  el.querySelectorAll('[data-ph]').forEach(b => b.onclick = () => { const id = b.dataset.ph; phSel = phSel.includes(id) ? phSel.filter(x => x !== id) : [...phSel.slice(-1), id]; renderPhotos(); });
  const cm = el.querySelector('#ph-cmp'); if (cm) cm.onclick = () => comparePhotos(P.filter(p => phSel.includes(p.id)).sort((a, b) => a.at - b.at));
}
function addProgressPhoto() {
  let inp = document.getElementById('pp-input');
  if (!inp) { inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.id = 'pp-input'; inp.style.cssText = 'position:fixed;left:-200vw;top:0;width:1px;height:1px;opacity:0'; document.body.appendChild(inp); }
  inp.value = '';
  inp.onchange = async () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    toast('Guardando la foto…');
    try {
      const { img, url } = await loadPhoto(f);                       // achicada a 1600 px
      const k = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.82));
      await phPut({ id: uid(), pid: PROFILE.id, at: Date.now(), blob });
      renderPhotos(); toast('Foto guardada');
    } catch (e) { toast('No se pudo guardar la foto'); }
  };
  inp.click();
}
function comparePhotos(two) {
  const us = two.map(p => URL.createObjectURL(p.blob)), days = Math.round((two[1].at - two[0].at) / DAY);
  sheet(`<h3>Comparar</h3><p class="sub">${t(days === 1 ? '{0} día entre una y otra' : '{0} días entre una y otra', days)}</p>
    <div class="ph-cmp">${two.map((p, i) => `<figure><img src="${us[i]}" alt=""><figcaption data-noi18n>${dateStr(p.at)}</figcaption></figure>`).join('')}</div>
    <div class="row" style="margin-top:12px">${two.map((p, i) => `<button class="btn ghost small" data-pdel="${p.id}">${t(i ? 'Borrar la segunda' : 'Borrar la primera')}</button>`).join('')}</div>`, root => {
    root.querySelectorAll('[data-pdel]').forEach(b => b.onclick = async () => {
      if (!(await askApp('Borrar foto', 'Se borra de este teléfono y no se puede recuperar.', 'Borrar', true))) return;
      await phDel(b.dataset.pdel); phSel = []; renderPhotos();
    });
  });
}

/* ---------- Rutinas propias ----------
   PS 'routines' = [{ id, n, r, R, rr, items: [{ id, m: 't' (segundos) | 'r' (repeticiones), v }], warm, cool }]
   (van en la copia). Cada ejercicio va por tiempo o por repeticiones, con su propia cantidad.
   Las rutinas viejas (ex: [ids] + w: segundos para todos) se convierten solas. Se comparten con un link o QR. */
const RT_DEF = { n: '', r: 20, R: 3, rr: 60, items: [], warm: true, cool: true };
// por defecto: los ejercicios que se sostienen (planchas, isométricos) van por tiempo; el resto por repeticiones
const RT_HOLD = /plank|hold|wall_sit|hollow|superman|bridge_hold|dead_hang|static|isometric|mountain|jack|high_knees|butt_kick|skater|run|climb|skier|quick_feet|shuffle|jog|march|punch|box|rope|sprint|flutter|kick/;
const rtDefItem = (id, prev) => prev ? { id, m: prev.m, v: prev.v } : RT_HOLD.test(id) ? { id, m: 't', v: 40 } : { id, m: 'r', v: 12 };
function rtNorm(rt) {
  rt = { ...RT_DEF, ...rt };
  if (!Array.isArray(rt.items) || !rt.items.length) rt.items = (rt.ex || []).map(id => ({ id, m: 't', v: rt.w || 40 }));
  rt.items = rt.items.filter(it => it && CATALOG[it.id]).map(it => ({ id: it.id, m: it.m === 'r' ? 'r' : 't', v: Math.max(1, Math.min(it.m === 'r' ? 200 : 600, Math.round(+it.v) || (it.m === 'r' ? 12 : 40))) }));
  delete rt.ex; delete rt.w;
  return rt;
}
function rtWorkout(rt0) {
  const rt = rtNorm(rt0), ids = rt.items.map(it => it.id), firstT = rt.items.find(it => it.m === 't');
  return { kind: 'coach', rt: rt.id || 'x', rtName: rt.n, rtItems: rt.items, created: Date.now(), sk: { w: firstT ? firstT.v : 40, r: rt.r, n: ids.length, R: rt.R, rr: rt.rr, dur: 0 },
    level: 2, parts: ['all'], noJump: false, vary: false, rounds: Array.from({ length: rt.R }, () => ids.slice()), db: false,
    warm: rt.warm ? shuffle(WARM).slice(0, 5) : [], cool: rt.cool ? shuffle(COOL).slice(0, 5) : [] };
}
const rtItemSecs = it => it.m === 'r' ? it.v * REP_SEC : it.v;
const rtSecs = rt0 => { const rt = rtNorm(rt0), n = rt.items.length; return n ? rt.R * (rt.items.reduce((a, it) => a + rtItemSecs(it), 0) + (n - 1) * rt.r) + (rt.R - 1) * rt.rr : 0; };
const rtAmt = it => it.m === 'r' ? t('{0} rep', it.v) : t('{0} s', it.v);
function renderRoutines() {
  const el = $('#routines'); if (!el || !PROFILE) return;
  const R = PS.get('routines', []).map(rtNorm);
  el.innerHTML = `<p class="sub pane-intro">Arma tus circuitos con los ejercicios que quieras, cada uno por tiempo o por repeticiones, y compártelos con un link o un código QR.</p>
    <button class="btn" id="rt-new">+ Nueva rutina</button>
    ${R.length ? `<h2>Mis rutinas</h2><div class="block">${R.map((rt, i) => `<div class="hist"><div class="t" data-rto="${i}"><b data-noi18n>${esc(rt.n)}</b><small>${t('{0} ejercicios · {1} rondas · {2} min', rt.items.length, rt.R, Math.round(rtSecs(rt) / 60))}</small></div>
      <button class="icon-btn" data-rtp="${i}" aria-label="Empezar"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l12-7z"/></svg></button>
      <button class="icon-btn" data-rte="${i}" aria-label="Editar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg></button></div>`).join('')}</div>` : ''}`;
  $('#rt-new').onclick = () => openRoutine(null);
  el.querySelectorAll('[data-rtp],[data-rto]').forEach(b => b.onclick = () => { const rt = R[+(b.dataset.rtp || b.dataset.rto)]; openPreview(rtWorkout(rt), 'coach'); });
  el.querySelectorAll('[data-rte]').forEach(b => b.onclick = () => openRoutine(+b.dataset.rte));
}
function openRoutine(idx, preset) {
  const R = PS.get('routines', []), rt = rtNorm(preset ? preset : idx != null ? JSON.parse(JSON.stringify(R[idx])) : { ...RT_DEF, items: [] });
  const num = (id, lo, hi) => { const v = parseInt($(id).value, 10); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : null; };
  const read = () => {
    rt.n = $('#rt-n').value.trim().slice(0, 40);
    const b = num('#rt-r', 0, 300), c = num('#rt-R', 1, 20), d = num('#rt-rr', 0, 600); if (b != null) rt.r = b; if (c != null) rt.R = c; if (d != null) rt.rr = d;
    document.querySelectorAll('#rt-ex [data-v]').forEach(inp => { const it = rt.items[+inp.dataset.v], v = parseInt(inp.value, 10); if (it && isFinite(v) && v > 0) it.v = Math.min(it.m === 'r' ? 200 : 600, v); });
  };
  const sum = () => { $('#rt-sum').textContent = rt.items.length ? t('Duración aprox.: {0} min (sin calentamiento ni estiramientos)', Math.round(rtSecs(rt) / 60)) : ''; };
  const list = () => {
    $('#rt-ex').innerHTML = rt.items.length ? rt.items.map((it, i) => `<div class="rt-item">
      <div class="rt-top"><b>${i + 1}. ${esc(ex(it.id).n)}</b>
        <button class="icon-btn" data-up="${i}" aria-label="Subir" ${i ? '' : 'disabled'}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 15l6-6 6 6"/></svg></button>
        <button class="icon-btn" data-rm="${i}" aria-label="Quitar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      <div class="rt-amt"><div class="seg rt-mode"><button data-mode="${i}" data-m="t" aria-pressed="${it.m === 't'}">Tiempo</button><button data-mode="${i}" data-m="r" aria-pressed="${it.m === 'r'}">Repeticiones</button></div>
        <label class="rt-v"><input type="number" inputmode="numeric" min="1" data-v="${i}" value="${it.v}" aria-label="${it.m === 'r' ? t('Repeticiones') : t('Segundos')}"><span>${it.m === 'r' ? t('rep') : t('s')}</span></label></div></div>`).join('')
      : '<p class="note">Todavía no agregaste ejercicios.</p>';
    sum();
  };
  sheet(`<h3>${idx != null ? 'Editar rutina' : 'Nueva rutina'}</h3>
    <div class="field"><input id="rt-n" maxlength="40" placeholder="Nombre de la rutina" value="${esc(rt.n)}"></div>
    <div class="adv" style="grid-template-columns:1fr 1fr 1fr;padding:0;margin-top:10px">
      <label>Descanso (s)<input type="number" inputmode="numeric" id="rt-r" value="${rt.r}"></label>
      <label>Rondas<input type="number" inputmode="numeric" id="rt-R" value="${rt.R}"></label>
      <label>Entre rondas (s)<input type="number" inputmode="numeric" id="rt-rr" value="${rt.rr}"></label></div>
    <p class="note">El descanso es entre un ejercicio y otro. En los ejercicios por repeticiones se toca ✓ al terminar la serie.</p>
    <h2>Ejercicios</h2><div class="block rt-list" id="rt-ex"></div>
    <button class="btn ghost small" id="rt-add">+ Agregar ejercicio</button>
    <p class="note" id="rt-sum"></p>
    <div class="toggles">
      <button class="tg" id="rt-warm" role="switch" aria-checked="${!!rt.warm}"><span>Calentamiento<small>5 movimientos suaves antes</small></span><i class="sw"></i></button>
      <button class="tg" id="rt-cool" role="switch" aria-checked="${!!rt.cool}"><span>Estiramientos al final<small>5 estiramientos de 30 s</small></span><i class="sw"></i></button></div>
    <div class="row" style="margin-top:12px"><button class="btn ghost small" id="rt-cancel">Cancelar</button><button class="btn small" id="rt-save">Guardar</button></div>
    ${idx != null ? `<div class="row" style="margin-top:10px"><button class="btn ghost small" id="rt-share">Compartir</button><button class="btn danger small" id="rt-del">Borrar</button></div>` : ''}`, () => {
    list();
    ['warm', 'cool'].forEach(k => { const b = $('#rt-' + k); b.onclick = () => { rt[k] = !rt[k]; b.setAttribute('aria-checked', rt[k]); }; });
    $('#rt-ex').onclick = e => {
      const u = e.target.closest('[data-up]'), m = e.target.closest('[data-rm]'), md = e.target.closest('[data-mode]');
      if (u || m || md) read();
      if (u) { const i = +u.dataset.up; [rt.items[i - 1], rt.items[i]] = [rt.items[i], rt.items[i - 1]]; list(); }
      if (m) { rt.items.splice(+m.dataset.rm, 1); list(); }
      if (md) { const it = rt.items[+md.dataset.mode], to = md.dataset.m; if (it.m !== to) { it.m = to; it.v = to === 'r' ? 12 : 40; list(); const inp = document.querySelector(`#rt-ex [data-v="${md.dataset.mode}"]`); if (inp) inp.select(); } }
    };
    $('#rt-ex').oninput = e => { if (e.target.matches('[data-v]')) { read(); sum(); } };
    ['#rt-r', '#rt-R', '#rt-rr'].forEach(id => $(id).oninput = () => { read(); sum(); });
    $('#rt-add').onclick = () => { read(); pickExercise(id => { rt.items.push(rtDefItem(id)); openRoutine(idx, rt); }, () => openRoutine(idx, rt)); };
    $('#rt-cancel').onclick = () => closeSheet();
    $('#rt-save').onclick = () => {
      read(); if (!rt.n) { toast('Ponle un nombre'); $('#rt-n').focus(); return; } if (!rt.items.length) { toast('Agrega al menos un ejercicio'); return; }
      const R2 = PS.get('routines', []); if (!rt.id) rt.id = uid();
      const at = R2.findIndex(x => x.id === rt.id); if (at >= 0) R2[at] = rt; else R2.unshift(rt);
      PS.set('routines', R2.slice(0, 60)); closeSheet(); renderRoutines(); toast('Rutina guardada');
    };
    const sh = $('#rt-share'); if (sh) sh.onclick = () => { read(); shareRoutine(rt); };
    const dl = $('#rt-del'); if (dl) dl.onclick = async () => {
      if (!(await askApp('Borrar rutina', rt.n, 'Borrar', true))) return;
      PS.set('routines', PS.get('routines', []).filter(x => x.id !== rt.id)); renderRoutines();
    };
  }, false, true);
}
// buscador de ejercicios para agregar a la rutina
function pickExercise(onPick, onBack) {
  const all = Object.keys(CATALOG).filter(id => !/_(l|r)$/.test(id) && CATALOG[id].t !== 's').map(id => ({ id, n: ex(id).n })).sort((a, b) => a.n.localeCompare(b.n, LOC));
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  sheet(`<h3>Agregar ejercicio</h3><input class="search" id="pk-q" type="search" placeholder="Buscar ejercicio…" autocomplete="off"><div class="block pk-list" id="pk-l"></div>`, () => {
    const draw = () => { const q = norm($('#pk-q').value.trim()); $('#pk-l').innerHTML = all.filter(e => !q || norm(e.n).includes(q)).slice(0, 80).map(e => `<button class="hist pk" data-pk="${e.id}"><div class="t"><b>${esc(e.n)}</b></div></button>`).join('') || '<p class="note">Sin resultados.</p>'; };
    draw(); $('#pk-q').oninput = draw;
    $('#pk-l').onclick = e => { const b = e.target.closest('[data-pk]'); if (b) onPick(b.dataset.pk); };
    const bk = $('#sh-x'); if (bk && onBack) bk.onclick = ev => { ev.stopPropagation(); onBack(); };
  }, false, true);
}
// link: …/#rt=<datos en base64>; se abre en cualquier teléfono con la app y ofrece guardarla
const b64u = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
const rtLink = rt0 => { const rt = rtNorm(rt0); return location.origin + location.pathname + '#rt=' + b64u(JSON.stringify({ n: rt.n, r: rt.r, R: rt.R, rr: rt.rr, it: rt.items.map(it => [it.id, it.m, it.v]), warm: rt.warm ? 1 : 0, cool: rt.cool ? 1 : 0 })); };
async function shareRoutine(rt) {
  const link = rtLink(rt);
  let qr = ''; try { await loadQR(); const q = qrcode(0, 'M'); q.addData(link); q.make(); qr = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch (e) {}
  sheet(`<h3>Compartir «<span data-noi18n>${esc(rt.n)}</span>»</h3>
    <p class="sub">Quien abra el link (o escanee el código con la cámara) puede guardar la rutina en su app.</p>
    ${qr ? `<div class="qr">${qr}</div>` : ''}
    <button class="btn" id="rs-share">Compartir link</button><div class="gap"></div><button class="btn ghost small" id="rs-copy">Copiar link</button>`, () => {
    $('#rs-share').onclick = async () => { try { if (navigator.share) { await navigator.share({ title: rt.n, text: t('Rutina «{0}» para INHIIT', rt.n), url: link }); return; } } catch (e) { if (e && e.name === 'AbortError') return; } copyLink(); };
    const copyLink = async () => { try { await navigator.clipboard.writeText(link); toast('Link copiado'); } catch (e) { toast('No se pudo copiar'); } };
    $('#rs-copy').onclick = copyLink;
  });
}
let QR_P = null;
const loadQR = () => QR_P || (QR_P = new Promise((res, rej) => { if (window.qrcode) return res(); const s = document.createElement('script'); s.src = 'qr.js'; s.onload = () => window.qrcode ? res() : rej(); s.onerror = () => { QR_P = null; rej(); }; document.head.appendChild(s); }));
// al abrir un link de rutina compartida
function checkSharedRoutine() {
  const m = location.hash.match(/^#rt=([\w-]+)/); if (!m || !PROFILE) return;
  history.replaceState(null, '', location.pathname + location.search);
  let raw; try { raw = JSON.parse(unb64u(m[1])); } catch (e) { toast('Ese link de rutina no es válido'); return; }
  if (Array.isArray(raw.it)) raw.items = raw.it.map(([id, m2, v]) => ({ id, m: m2, v }));
  const rt = rtNorm({ ...raw, warm: !!raw.warm, cool: !!raw.cool }); delete rt.it; if (!rt.items.length) return;
  sheet(`<h3>Rutina compartida</h3><p class="sub"><b data-noi18n>${esc(rt.n)}</b> · ${t('{0} ejercicios · {1} rondas · {2} min', rt.items.length, rt.R, Math.round(rtSecs(rt) / 60))}</p>
    <div class="block">${rt.items.map((it, i) => `<div class="hist"><div class="t"><b>${i + 1}. ${esc(ex(it.id).n)}</b></div><span class="tgt">${rtAmt(it)}</span></div>`).join('')}</div>
    <div class="gap"></div><button class="btn" id="sr-save">Guardar en Mis rutinas</button><div class="gap"></div><button class="btn ghost" id="sr-try">Probarla ahora</button>`, () => {
    $('#sr-save').onclick = () => { rt.id = uid(); const R = PS.get('routines', []); R.unshift(rt); PS.set('routines', R.slice(0, 60)); closeSheet(); goTo('coach', 'coach', 'mine'); toast('Rutina guardada'); };
    $('#sr-try').onclick = () => { closeSheet(); openPreview(rtWorkout(rt), 'coach'); };
  });
}

/* ---------- Desafíos con amigos ----------
   Firestore: groups/{código} = { n, owner, at } · groups/{código}/members/{uid_perfil} = { n, wk, s, m, at }
   Cada uno publica sus sesiones y minutos de la semana; el ranking se arma con eso. PS 'groups' = [{ c, n }]. */
const GRP_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const grpCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), x => GRP_ABC[x % GRP_ABC.length]).join('');
let frMode = 'm', frSel = null, frCache = {};
const memberId = u => u.uid + '_' + PROFILE.id;
async function frUser() { if (typeof cloudUser !== 'function') return null; try { return await cloudUser(); } catch (e) { return null; } }
// lo que ven los demás además de sesiones y minutos: racha de semanas, logros, repeticiones de la semana y retos en curso
function frExtra() {
  const H = PS.get('history', []), wk = weekKey(Date.now());
  let rp = 0; H.forEach(x => { if (weekKey(x.at) !== wk) return; const r = repsNow(x); rp += (r.sq || 0) + (r.pu || 0) + (r.ab || 0) + (r.bu || 0) + (r.dm || 0); });
  const all = PS.get('retos', {}) || {}, rt = [];
  Object.keys(all).forEach(k => { const st = all[k]; if (!st || !RETOS[k] || st.stage == null) return; let D = 0; try { D = retoDays(k, st.k, st.stage).length; } catch (e) {} rt.push([k, st.stage, (st.day || 0) + 1, D, st.best || 0, st.goalsDone || 0]); });
  return { st: weekStreak(H), aw: Object.keys(PS.get('awards', {}) || {}).length, rp, rt: rt.slice(0, 4) };
}
function frInfo(x) {
  const e = x.x || {}, a = [];
  if (e.st) a.push(`🔥 ${t(e.st === 1 ? '{0} semana seguida' : '{0} semanas seguidas', e.st)}`);
  if (e.aw) a.push(`🏅 ${t(e.aw === 1 ? '{0} logro' : '{0} logros', e.aw)}`);
  if (e.rp && x.wk === weekKey(Date.now())) a.push(`💪 ${t('{0} reps esta semana', e.rp)}`);
  const rt = (e.rt || []).filter(r => RETOS[r[0]]).map(([k, st, d, D, b, g]) => `<span class="fr-rt">🎯 <b>${esc(t(RETOS[k].n))}</b> · ${t('etapa {0}/3', st)}${D ? ' · ' + t('día {0}/{1}', d, D) : ''}${b ? ' · ' + t('récord {0}', b) : ''}${g ? ' · 🥇' + (g > 1 ? '×' + g : '') : ''}</span>`);
  return a.length || rt.length ? `<small class="fr-fx">${a.join(' · ')}</small>${rt.join('')}` : '';
}
async function frPublish(only) {
  const G = PS.get('groups', []); if (!G.length || !navigator.onLine) return;
  const u = await frUser(); if (!u || !FBA.memberPut) return;
  const w = weekProgress(), d = { n: PROFILE.name, wk: weekKey(Date.now()), s: w.n, m: w.m, at: Date.now(), x: frExtra() };
  for (const g of G) { if (only && g.c !== only) continue; try { await FBA.memberPut(g.c, memberId(u), d); } catch (e) {} }
}
async function renderFriends() {
  const el = $('#friends'); if (!el || !PROFILE) return;
  const G = PS.get('groups', []);
  if (!frSel || !G.some(g => g.c === frSel)) frSel = G[0] && G[0].c;
  el.innerHTML = `<p class="sub pane-intro">Crea un grupo, comparte el código y compitan por quién entrena más cada semana. Se ve el nombre del perfil, las sesiones y minutos de la semana, la racha, los logros y los retos en curso.</p>
    ${G.length ? `<div class="chips fr-g" id="fr-g">${G.map(g => `<button class="chip" data-g="${g.c}" aria-pressed="${g.c === frSel}" data-noi18n>${esc(g.n)}</button>`).join('')}</div>
      <div id="fr-rank"><p class="note">Cargando…</p></div>` : ''}
    <div class="row fr-act"><button class="btn ghost small" id="fr-new">+ Crear grupo</button><button class="btn ghost small" id="fr-join">Unirme con un código</button></div>`;
  $('#fr-new').onclick = () => openGroupNew(); $('#fr-join').onclick = () => openGroupJoin();
  const gg = $('#fr-g'); if (gg) gg.onclick = e => { const b = e.target.closest('[data-g]'); if (b) { frSel = b.dataset.g; renderFriends(); } };
  if (!G.length) return;
  const rk = $('#fr-rank');
  if (!navigator.onLine) { rk.innerHTML = '<p class="note">Sin conexión: el ranking se ve con internet.</p>'; return; }
  const u = await frUser();
  if (!u || !window.FBA || !FBA.membersList) { rk.innerHTML = '<p class="note">No se pudo conectar con la nube. Prueba de nuevo en un rato.</p>'; return; }
  try {
    await frPublish(frSel);
    const L = await FBA.membersList(frSel), wk = weekKey(Date.now()), me = memberId(u);
    frCache[frSel] = L;
    const rows = L.map(x => ({ ...x, s: x.wk === wk ? x.s : 0, m: x.wk === wk ? x.m : 0 })).sort((a, b) => (frMode === 'm' ? b.m - a.m || b.s - a.s : b.s - a.s || b.m - a.m));
    const g = G.find(x => x.c === frSel);
    rk.innerHTML = `<div class="chart fr">
      <div class="ch-top"><div><b data-noi18n>${esc(g.n)}</b><small>${t('Código: {0} · esta semana', '<span class="code" data-noi18n>' + frSel + '</span>')}</small></div>
        <div class="seg" id="fr-mode"><button data-m="m" aria-pressed="${frMode === 'm'}">Minutos</button><button data-m="s" aria-pressed="${frMode === 's'}">Sesiones</button></div></div>
      <div class="rank">${rows.map((x, i) => `<div class="rk${x.id === me ? ' me' : ''}"><span class="pos">${i + 1}</span><span class="av" style="background:var(--av${i % 7});color:var(--avt${i % 7})" data-noi18n>${esc((x.n || '?')[0].toUpperCase())}</span>
        <span class="fr-who"><span class="nm" data-noi18n>${esc(x.n || '—')}${x.id === me ? ` <small>(${t('tú')})</small>` : ''}</span>${frInfo(x)}</span><b>${frMode === 'm' ? x.m + ' min' : x.s}</b></div>`).join('')}</div></div>
      <div class="row fr-act"><button class="btn ghost small" id="fr-invite">Invitar</button><button class="btn ghost small" id="fr-leave">Salir del grupo</button></div>`;
    bindSeg('fr-mode', 'm', m => { frMode = m; renderFriends(); });
    $('#fr-invite').onclick = () => inviteGroup(g);
    $('#fr-leave').onclick = async () => {
      if (!(await askApp('Salir del grupo', t('Dejas de aparecer en el ranking de «{0}».', g.n), 'Salir', true))) return;
      try { await FBA.memberDel(frSel, me); } catch (e) {}
      PS.set('groups', PS.get('groups', []).filter(x => x.c !== frSel)); frSel = null; renderFriends();
    };
  } catch (e) { rk.innerHTML = `<p class="note">${esc(typeof saveErr === 'function' ? saveErr(e && e.code || 'x') : 'No se pudo cargar el ranking.')}</p>`; }
}
async function inviteGroup(g) {
  const link = location.origin + location.pathname + '#grp=' + g.c;
  const txt = t('Sumate a mi grupo «{0}» en INHIIT para ver quién entrena más esta semana. Código: {1}', g.n, g.c);
  try { if (navigator.share) { await navigator.share({ title: 'INHIIT', text: txt, url: link }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(txt + ' ' + link); toast('Invitación copiada'); } catch (e) { toast('Código: ' + g.c); }
}
function openGroupNew() {
  sheet(`<h3>Crear grupo</h3><div class="field"><input id="gn-n" maxlength="30" placeholder="Nombre del grupo (p. ej. Los del gym)"></div>
    <p class="note auth-msg" id="auth-msg"></p><div class="gap"></div><button class="btn" id="gn-ok">Crear</button>`, () => {
    $('#gn-ok').onclick = async () => {
      const n = $('#gn-n').value.trim().slice(0, 30); if (!n) { authMsg('Ponle un nombre'); return; }
      const u = await frUser(); if (!u || !window.FBA || !FBA.groupCreate) { authMsg('Sin conexión'); return; }
      const b = $('#gn-ok'); b.disabled = true; b.textContent = t('Creando…');
      try {
        let c = grpCode(); for (let i = 0; i < 4 && await FBA.groupGet(c); i++) c = grpCode();
        await FBA.groupCreate(c, { n, owner: u.uid, at: Date.now() });
        PS.set('groups', [{ c, n }, ...PS.get('groups', [])].slice(0, 10)); frSel = c;
        await frPublish(c); closeSheet(); goTo('hist', 'hist', 'friends'); toast(t('Grupo creado. Código: {0}', c));
      } catch (e) { authMsg(typeof saveErr === 'function' ? saveErr(e && e.code || 'x') : 'No se pudo crear'); b.disabled = false; b.textContent = t('Crear'); }
    };
  }, false, true);
}
function openGroupJoin(code) {
  if (typeof code !== 'string') code = '';   // por si llega el evento del toque en lugar de un código
  sheet(`<h3>Unirme a un grupo</h3><div class="field"><input id="gj-c" maxlength="6" placeholder="Código de 6 letras" autocapitalize="characters" autocomplete="off" value="${esc(code || '')}" style="text-transform:uppercase;letter-spacing:.2em"></div>
    <p class="note auth-msg" id="auth-msg"></p><div class="gap"></div><button class="btn" id="gj-ok">Unirme</button>`, () => {
    $('#gj-ok').onclick = async () => {
      const c = $('#gj-c').value.trim().toUpperCase(); if (!/^[A-Z0-9]{6}$/.test(c)) { authMsg('El código tiene 6 letras o números'); return; }
      if (PS.get('groups', []).some(g => g.c === c)) { closeSheet(); frSel = c; goTo('hist', 'hist', 'friends'); return; }
      const u = await frUser(); if (!u || !window.FBA || !FBA.groupGet) { authMsg('Sin conexión'); return; }
      try {
        const g = await FBA.groupGet(c); if (!g) { authMsg('No existe un grupo con ese código'); return; }
        PS.set('groups', [{ c, n: g.n }, ...PS.get('groups', [])].slice(0, 10)); frSel = c;
        await frPublish(c); closeSheet(); goTo('hist', 'hist', 'friends'); toast(t('Te uniste a «{0}»', g.n));
      } catch (e) { authMsg(typeof saveErr === 'function' ? saveErr(e && e.code || 'x') : 'No se pudo unir'); }
    };
  }, false, true);
}
function checkGroupLink() {
  const m = location.hash.match(/^#grp=([A-Z0-9]{6})/i); if (!m || !PROFILE) return;
  history.replaceState(null, '', location.pathname + location.search);
  openGroupJoin(m[1].toUpperCase());
}

/* ---------- Conexiones: subpestañas, pantalla final y arranque ---------- */
SUBTAB_SHOW['coach:mine'] = () => { renderRoutines(); renderFavs(); };
SUBTAB_SHOW['hist:sum'] = renderGoal;
SUBTAB_SHOW['hist:body'] = renderBody;
SUBTAB_SHOW['hist:friends'] = renderFriends;
const _renderResumeM = renderResume;
renderResume = function () { _renderResumeM(); try { renderGoal(); } catch (e) {} };
// al terminar un entrenamiento: meta cumplida, compartir y ranking
const _finishM = finish;
finish = function (...a) {
  _finishM(...a);
  const x = PS.get('history', [])[0], dg = $('#d-goal');
  if (dg) dg.innerHTML = x && goalJustHit() ? goalDoneHTML() : '';
  const sb = $('#d-share'); if (sb) { sb.classList.toggle('hidden', !x); sb.onclick = () => shareSession(PS.get('history', [])[0]); }
  setTimeout(() => frPublish(), 2500);
};
// al terminar un reto
const _rFinishM = rFinish;
rFinish = function (...a) {
  _rFinishM(...a);
  const ok = $('#rf-ok'); if (!ok) return;
  const hit = goalJustHit();
  ok.insertAdjacentHTML('afterend', `<div class="gap"></div><button class="btn ghost" id="rf-share">Compartir mi sesión</button>`);
  if (hit) ok.insertAdjacentHTML('beforebegin', goalDoneHTML() + '<div class="gap"></div>');
  $('#rf-share').onclick = () => shareSession(PS.get('history', [])[0]);
  setTimeout(() => frPublish(), 2500);
};
const _showM = show;
show = function (v) { _showM(v); try { renderGoal(); } catch (e) {} };
// al abrir la app, Coach e Historial arrancan en su primera opción y se dibuja la parte visible
// (la app ya mostró la pantalla antes de cargar este archivo, cuando todavía no sabía dibujar estas partes)
['coach', 'hist'].forEach(g => LS.set('tab.' + g, SUBTABS[g][0][0]));
if (currentView === 'coach' || currentView === 'hist') try { bindSubtabs(currentView); } catch (e) { console.error(e); }
setTimeout(() => { try { renderGoal(); checkSharedRoutine(); checkGroupLink(); } catch (e) { console.error(e); } }, 600);
window.addEventListener('hashchange', () => { checkSharedRoutine(); checkGroupLink(); });
