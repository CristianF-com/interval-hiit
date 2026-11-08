'use strict';
/* =========================================================
   Timer de intervalos (sin ejercicios): bloques fuertes, suaves y descansos con nombre propio,
   que se repiten por rondas, hasta completar un tiempo o hasta que lo detengas.
   Avisa con pitidos y voz en cada cambio, lleva la cuenta de cada bloque y se guarda en el historial.
   PS 'timers'   = [{ id, n, prep, warm, cool, blocks: [{ n, k: 'w' | 'e' | 'r', s }], rep: 'n' | 't' | 'f', R, T }]
                   (prep en segundos; warm, cool y bloques en segundos; T en minutos e incluye calentamiento y enfriamiento)
   PS 'tsession' = timer en curso (para seguir si se cierra la app)
   ========================================================= */
const TM_KIND = { w: 'Fuerte', e: 'Suave', r: 'Descanso' };
const TM_CLS = { w: 'work', e: 'easy', r: 'rest', p: 'prep' };
const TM_DEF = { n: '', prep: 10, warm: 0, cool: 0, blocks: [{ n: 'Trabajo', k: 'w', s: 120 }, { n: 'Descanso', k: 'r', s: 30 }], rep: 'f', R: 5, T: 30 };
const TM_PRESETS = [
  { key: 'run', n: 'Correr 1 hora', prep: 10, warm: 0, cool: 0, blocks: [{ n: 'Lento', k: 'e', s: 600 }, { n: 'Rápido', k: 'w', s: 180 }, { n: 'Caminar', k: 'r', s: 60 }], rep: 't', R: 4, T: 60 },
  { key: 'bike', n: 'Bici 45 minutos', prep: 10, warm: 300, cool: 300, blocks: [{ n: 'Fuerte', k: 'w', s: 120 }, { n: 'Suave', k: 'e', s: 180 }], rep: 't', R: 7, T: 45 },
  { key: 'blocks', n: 'Bloques de 2 minutos', prep: 10, warm: 0, cool: 0, blocks: [{ n: 'Trabajo', k: 'w', s: 120 }, { n: 'Descanso', k: 'r', s: 30 }], rep: 'f', R: 5, T: 30 },
  { key: 'tabata', n: 'Tabata', prep: 10, warm: 0, cool: 0, blocks: [{ n: 'Trabajo', k: 'w', s: 20 }, { n: 'Descanso', k: 'r', s: 10 }], rep: 'n', R: 8, T: 4 }
];
const tmClamp = (v, lo, hi, d) => { v = Math.round(+v); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
function tmNorm(c) {
  c = { ...TM_DEF, ...(c || {}) };
  c.blocks = (Array.isArray(c.blocks) ? c.blocks : []).filter(Boolean).slice(0, 20)
    .map(b => ({ n: String(b.n || '').slice(0, 24), k: TM_KIND[b.k] ? b.k : 'w', s: tmClamp(b.s, 0, 5 * 3600, 60) }));
  c.prep = tmClamp(c.prep, 0, 120, 10); c.warm = tmClamp(c.warm, 0, 3600, 0); c.cool = tmClamp(c.cool, 0, 3600, 0);
  c.rep = ['n', 't', 'f'].includes(c.rep) ? c.rep : 'f'; c.R = tmClamp(c.R, 1, 200, 5); c.T = tmClamp(c.T, 1, 600, 30);
  return c;
}
// plantillas con los textos en el idioma de la app
const tmPreset = p => tmNorm({ ...p, n: t(p.n), blocks: p.blocks.map(b => ({ ...b, n: t(b.n) })) });
const tmLoop = c => c.blocks.reduce((a, b) => a + b.s, 0);
const tmName = (b, i) => b.n || t('Bloque {0}', i + 1);
// minutos y segundos: 1:05:00 · 10:00 · 0:30
const tmFmt = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
// duración dicha o escrita: «10 minutos», «1 minuto y 30 segundos», «45 segundos»
function tmDurTxt(s) {
  s = Math.round(s); const m = Math.floor(s / 60), x = s % 60;
  const mm = m === 1 ? t('1 minuto') : t('{0} minutos', m), ss = t('{0} segundos', x);
  return !m ? ss : !x ? mm : t('{0} y {1}', mm, ss);
}

/* ---------- Línea de tiempo ---------- */
// segmentos { n, k, s, t0, ph: 'p' | 'warm' | 'loop' | 'cool', r, b }; sin final: se arman rondas hasta cubrir «upto» segundos
function tmPlan(c, upto = 0) {
  const seg = []; let t0 = 0;
  const push = (n, k, s, x) => { if (s > 0) { seg.push({ n, k, s, t0, ...x }); t0 += s; } };
  push(t('Prepárate'), 'p', c.prep, { ph: 'p' });
  if (c.warm) push(t('Calentamiento'), 'e', c.warm, { ph: 'warm' });
  const loop = tmLoop(c), end = c.rep === 't' ? c.prep + c.T * 60 - (c.cool || 0) : Infinity;
  for (let r = 0; loop > 0; r++) {
    if (c.rep === 'n' && r >= c.R) break;
    if (c.rep === 'f' && t0 > upto) break;
    if (c.rep === 't' && t0 >= end - 0.5) break;
    for (let b = 0; b < c.blocks.length; b++) {
      const B = c.blocks[b]; let s = B.s;
      if (c.rep === 't') { s = Math.min(s, end - t0); if (s < 1) break; }
      push(tmName(B, b), B.k, s, { ph: 'loop', r, b });
    }
  }
  if (c.cool && c.rep !== 'f') push(t('Enfriamiento'), 'e', c.cool, { ph: 'cool' });
  return seg;
}
const tmRounds = seg => seg.reduce((a, s) => s.ph === 'loop' ? Math.max(a, s.r + 1) : a, 0);
// resumen para la lista y el editor
function tmSummary(c) {
  const loop = tmLoop(c);
  if (!loop) return t('Agrega al menos un bloque con tiempo');
  if (c.rep === 'f') return t('Rondas de {0} · hasta que lo detengas', tmFmt(loop));
  const seg = tmPlan(c), tot = seg.reduce((a, s) => a + (s.ph === 'p' ? 0 : s.s), 0), R = tmRounds(seg);
  const lastCut = c.rep === 't' && seg.some(s => s.ph === 'loop' && s.r === R - 1 && s.s < c.blocks[s.b].s);
  return t('{0} min · {1} rondas', Math.round(tot / 60), R) + (lastCut ? ' ' + t('(la última más corta)') : '');
}

/* ---------- Lista en Coach → Timer ---------- */
const TM_PLAY = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l12-7z"/></svg>';
const TM_EDIT = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>';
const tmBar = c => { const L = tmLoop(c) || 1; return `<span class="tm-mini">${c.blocks.filter(b => b.s).map(b => `<i class="k-${b.k}" style="flex:${b.s / L}"></i>`).join('')}</span>`; };
function renderTimers() {
  const el = $('#timers'); if (!el || !PROFILE) return;
  const L = PS.get('timers', []).map(tmNorm), ses = PS.get('tsession', null);
  el.innerHTML = `<p class="sub pane-intro">Solo el reloj, sin ejercicios: arma bloques fuertes, suaves y descansos para correr, andar en bici o lo que quieras. Te avisa en cada cambio.</p>
    ${ses && ses.c ? `<div class="block tm-resume"><div class="hist"><div class="t"><b data-noi18n>${esc(ses.c.n || t('Timer'))}</b><small>${t('En curso · {0} hechos', tmFmt(ses.act || 0))}</small></div>
      <button class="btn small" id="tm-res-go">Continuar</button><button class="icon-btn" id="tm-res-x" aria-label="Descartar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div></div>` : ''}
    <button class="btn" id="tm-new">+ Nuevo timer</button>
    ${L.length ? `<h2>Mis timers</h2><div class="block">${L.map((c, i) => `<div class="hist"><div class="t" data-tme="${i}"><b data-noi18n>${esc(c.n)}</b><small>${tmBar(c)}${esc(tmSummary(c))}</small></div>
      <button class="icon-btn" data-tmp="${i}" aria-label="Empezar">${TM_PLAY}</button><button class="icon-btn" data-tme="${i}" aria-label="Editar">${TM_EDIT}</button></div>`).join('')}</div>` : ''}
    <h2>Plantillas</h2><div class="block">${TM_PRESETS.map((p, i) => { const c = tmPreset(p); return `<div class="hist"><div class="t" data-tpe="${i}"><b>${esc(c.n)}</b><small>${tmBar(c)}${esc(c.blocks.map(b => `${b.n} ${tmFmt(b.s)}`).join(' · '))} · ${esc(tmSummary(c))}</small></div>
      <button class="icon-btn" data-tpp="${i}" aria-label="Empezar">${TM_PLAY}</button><button class="icon-btn" data-tpe="${i}" aria-label="Editar">${TM_EDIT}</button></div>`; }).join('')}</div>
    <p class="note">Toca una plantilla para cambiar los tiempos y guardarla con otro nombre.</p>`;
  $('#tm-new').onclick = () => tmOpen(null, { ...TM_DEF, blocks: TM_DEF.blocks.map(b => ({ ...b, n: t(b.n) })) });
  el.querySelectorAll('[data-tmp]').forEach(b => b.onclick = () => tmStart(L[+b.dataset.tmp]));
  el.querySelectorAll('[data-tme]').forEach(b => b.onclick = () => tmOpen(+b.dataset.tme));
  el.querySelectorAll('[data-tpp]').forEach(b => b.onclick = () => tmStart(tmPreset(TM_PRESETS[+b.dataset.tpp])));
  el.querySelectorAll('[data-tpe]').forEach(b => b.onclick = () => tmOpen(null, tmPreset(TM_PRESETS[+b.dataset.tpe])));
  const rg = $('#tm-res-go'); if (rg) rg.onclick = () => tmResume();
  const rx = $('#tm-res-x'); if (rx) rx.onclick = async () => { if (!(await askApp('Descartar timer', t('Se pierde lo que llevabas de {0}.', ses.c.n || t('Timer')), 'Descartar', true))) return; PS.del('tsession'); renderTimers(); };
}
SUBTAB_SHOW['coach:timer'] = renderTimers;

/* ---------- Editor ---------- */
function tmOpen(idx, preset) {
  const L = PS.get('timers', []), c = tmNorm(preset ? JSON.parse(JSON.stringify(preset)) : idx != null ? JSON.parse(JSON.stringify(L[idx])) : TM_DEF);
  const saved = idx != null;
  const int = (v, lo, hi) => { v = parseInt(v, 10); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : 0; };
  const read = () => {
    c.n = $('#tm-n').value.trim().slice(0, 40);
    document.querySelectorAll('#tm-bl .tm-blk').forEach((row, i) => {
      const b = c.blocks[i]; if (!b) return;
      b.n = row.querySelector('[data-n]').value.trim().slice(0, 24);
      b.s = int(row.querySelector('[data-m]').value, 0, 300) * 60 + int(row.querySelector('[data-s]').value, 0, 59);
    });
    c.prep = int($('#tm-prep').value, 0, 120); c.warm = int($('#tm-warm').value, 0, 60) * 60; c.cool = int($('#tm-cool').value, 0, 60) * 60;
    const rv = $('#tm-rv'); if (rv) { if (c.rep === 'n') c.R = int(rv.value, 1, 200) || 1; if (c.rep === 't') c.T = int(rv.value, 1, 600) || 1; }
  };
  const sum = () => { $('#tm-sum').textContent = tmSummary(c); };
  const repUI = () => {
    $('#tm-rep').querySelectorAll('[data-rep]').forEach(b => b.setAttribute('aria-pressed', b.dataset.rep === c.rep));
    $('#tm-repv').innerHTML = c.rep === 'n' ? `<label class="tm-in"><input type="number" inputmode="numeric" id="tm-rv" min="1" value="${c.R}"><span>rondas</span></label>`
      : c.rep === 't' ? `<label class="tm-in"><input type="number" inputmode="numeric" id="tm-rv" min="1" value="${c.T}"><span>minutos en total</span></label>`
      : `<p class="note">Repite los bloques hasta que toques terminar.</p>`;
    $('#tm-coolf').classList.toggle('hidden', c.rep === 'f');
    const rv = $('#tm-rv'); if (rv) rv.oninput = () => { read(); sum(); };
    sum();
  };
  const list = () => {
    $('#tm-bl').innerHTML = c.blocks.length ? c.blocks.map((b, i) => `<div class="tm-blk k-${b.k}">
      <div class="tm-r1"><input data-n="${i}" maxlength="24" value="${esc(b.n)}" placeholder="${esc(t('Nombre del bloque'))}" aria-label="${esc(t('Nombre del bloque'))}">
        <button class="icon-btn" data-up="${i}" aria-label="Subir" ${i ? '' : 'disabled'}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 15l6-6 6 6"/></svg></button>
        <button class="icon-btn" data-rm="${i}" aria-label="Quitar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      <div class="tm-r2"><div class="seg tm-k">${Object.entries(TM_KIND).map(([k, n]) => `<button data-k="${i}" data-v="${k}" aria-pressed="${b.k === k}">${n}</button>`).join('')}</div>
        <label class="tm-in"><input type="number" inputmode="numeric" data-m="${i}" min="0" value="${Math.floor(b.s / 60)}" aria-label="${esc(t('Minutos'))}"><span>min</span></label>
        <label class="tm-in"><input type="number" inputmode="numeric" data-s="${i}" min="0" max="59" value="${b.s % 60}" aria-label="${esc(t('Segundos'))}"><span>s</span></label></div></div>`).join('')
      : '<p class="note">Todavía no agregaste bloques.</p>';
    sum();
  };
  const save = () => {
    read();
    if (!c.n) { toast('Ponle un nombre'); $('#tm-n').focus(); return false; }
    if (!tmLoop(c)) { toast('Agrega al menos un bloque con tiempo'); return false; }
    const L2 = PS.get('timers', []); if (!c.id) c.id = uid();
    const at = L2.findIndex(x => x.id === c.id); if (at >= 0) L2[at] = c; else L2.unshift(c);
    PS.set('timers', L2.slice(0, 60)); return true;
  };
  sheet(`<h3>${saved ? 'Editar timer' : 'Nuevo timer'}</h3>
    <div class="field"><input id="tm-n" maxlength="40" placeholder="${esc(t('Nombre del timer'))}" value="${esc(c.n)}"></div>
    <h2>Bloques</h2><div class="tm-list" id="tm-bl"></div>
    <button class="btn ghost small" id="tm-add">+ Agregar bloque</button>
    <p class="note">Fuerte, suave y descanso cambian el color de la pantalla y el pitido del aviso.</p>
    <h2>Repetir</h2>
    <div class="seg" id="tm-rep"><button data-rep="n">Rondas</button><button data-rep="t">Por tiempo</button><button data-rep="f">Sin final</button></div>
    <div id="tm-repv" class="tm-repv"></div>
    <div class="adv tm-adv">
      <label>Preparación (s)<input type="number" inputmode="numeric" id="tm-prep" value="${c.prep}"></label>
      <label>Calentamiento (min)<input type="number" inputmode="numeric" id="tm-warm" value="${Math.round(c.warm / 60)}"></label>
      <label id="tm-coolf">Enfriamiento (min)<input type="number" inputmode="numeric" id="tm-cool" value="${Math.round(c.cool / 60)}"></label></div>
    <p class="note tm-sum" id="tm-sum"></p>
    <div class="row" style="margin-top:12px"><button class="btn ghost small" id="tm-save">Guardar</button><button class="btn small" id="tm-go">Empezar</button></div>
    ${saved ? `<div class="row" style="margin-top:10px"><button class="btn danger small" id="tm-del">Borrar</button></div>` : ''}`, () => {
    list(); repUI();
    $('#tm-bl').onclick = e => {
      const u = e.target.closest('[data-up]'), m = e.target.closest('[data-rm]'), k = e.target.closest('[data-k]');
      if (!u && !m && !k) return; read();
      if (u) { const i = +u.dataset.up; [c.blocks[i - 1], c.blocks[i]] = [c.blocks[i], c.blocks[i - 1]]; }
      if (m) c.blocks.splice(+m.dataset.rm, 1);
      if (k) c.blocks[+k.dataset.k].k = k.dataset.v;
      list();
    };
    $('#tm-bl').oninput = () => { read(); sum(); };
    ['#tm-prep', '#tm-warm', '#tm-cool'].forEach(id => $(id).oninput = () => { read(); sum(); });
    $('#tm-rep').onclick = e => { const b = e.target.closest('[data-rep]'); if (!b) return; read(); c.rep = b.dataset.rep; repUI(); };
    $('#tm-add').onclick = () => {
      read(); if (c.blocks.length >= 20) { toast('Hasta 20 bloques'); return; }
      const last = c.blocks[c.blocks.length - 1];
      c.blocks.push(last && last.k !== 'r' ? { n: t('Descanso'), k: 'r', s: 60 } : { n: t('Trabajo'), k: 'w', s: 120 }); list();
      const ins = document.querySelectorAll('#tm-bl [data-n]'); if (ins.length) ins[ins.length - 1].select();
    };
    $('#tm-save').onclick = () => { if (save()) { closeSheet(); renderTimers(); toast('Timer guardado'); } };
    $('#tm-go').onclick = () => {
      read(); if (!tmLoop(c)) { toast('Agrega al menos un bloque con tiempo'); return; }
      if (saved && c.n) save();
      closeSheet(); renderTimers(); tmStart({ ...c, n: c.n || t('Timer') });
    };
    const dl = $('#tm-del'); if (dl) dl.onclick = async () => {
      if (!(await askApp('Borrar timer', c.n, 'Borrar', true))) return;
      PS.set('timers', PS.get('timers', []).filter(x => x.id !== c.id)); renderTimers();
    };
  }, false, true);
}

/* ---------- Reproductor ---------- */
// pos = segundo de la línea de tiempo (saltar o volver lo mueve); act = tiempo real activo (lo que se guarda)
const TP = { c: null, seg: [], i: 0, pos: 0, act: 0, last: 0, paused: false, running: false, timer: null, lastSec: null, log: [], startedAt: 0, lastSave: 0 };
const tpCur = () => TP.seg[TP.i];
function tmExtend() {   // sin final: siempre hay al menos dos rondas por delante
  if (TP.c.rep !== 'f') return;
  const need = TP.pos + 2 * tmLoop(TP.c) + 5, last = TP.seg[TP.seg.length - 1];
  if (!last || last.t0 + last.s < need) TP.seg = tmPlan(TP.c, need);
}
function tmStart(c0, resume) {
  if (P.running) { toast('Termina primero el entrenamiento en curso'); return; }
  const c = tmNorm(c0); if (!tmLoop(c)) { toast('Agrega al menos un bloque con tiempo'); return; }
  try { audioSession(true); audioCtx(); } catch (e) {}
  beep(660, 60, .12);   // desbloquea el audio en iPhone
  Object.assign(TP, { c, seg: tmPlan(c, (resume ? resume.pos : 0) + 2 * tmLoop(c) + 5), i: 0, pos: resume ? resume.pos : 0, act: resume ? resume.act : 0, log: resume ? resume.log || [] : [],
    startedAt: resume ? resume.startedAt : Date.now(), last: Date.now(), running: true, paused: !!resume, lastSec: null, lastSave: 0 });
  while (TP.i < TP.seg.length - 1 && TP.pos >= TP.seg[TP.i].t0 + TP.seg[TP.i].s) TP.i++;
  $('#tplayer').classList.remove('hidden'); $('#tp-menu').classList.add('hidden'); document.body.style.overflow = 'hidden';
  voiceIcon(); wake(true); tmPreload();
  clearInterval(TP.timer); TP.timer = setInterval(tmTick, 200);
  tmPaint();
  if (resume) toast('Toca ▶ para continuar'); else tmEnter();
  tmSave();
}
function tmResume() {
  const s = PS.get('tsession', null); if (!s || !s.c) return;
  // si se cerró la app con el timer andando, el tiempo siguió corriendo (hasta 3 horas)
  if (!s.paused && s.savedAt) { const gap = Math.min(3 * 3600, Math.max(0, (Date.now() - s.savedAt) / 1000)); s.pos += gap; s.act += gap; }
  tmStart(s.c, s);
}
// al entrar en un bloque: pitido según el tipo y voz con el nombre y la duración
function tmEnter(quiet) {
  const s = tpCur(); TP.lastSec = null; tmPaint(); tmSave();
  if (quiet || !s) return;
  const v = S.sound === 'voz' ? .7 : 1;
  if (s.k === 'w') { beep(1046, 180, .3 * v); setTimeout(() => beep(1318, 260, .3 * v), 200); }
  else if (s.k === 'e') beep(784, 320, .26 * v);
  else if (s.k === 'r') { beep(523, 220, .25 * v); setTimeout(() => beep(392, 300, .22 * v), 240); }
  if (s.ph === 'p') { say(t('Prepárate.') + ' ' + t('Primero: {0}.', (TP.seg[TP.i + 1] || {}).n || '')); return; }
  const lastLoop = TP.c.rep !== 'f' && s.ph === 'loop' && !TP.seg.slice(TP.i + 1).some(x => x.ph === 'loop');
  const head = s.ph === 'loop' && s.b === 0 && s.r > 0 && TP.c.blocks.length > 1 ? t('Ronda {0}.', s.r + 1) + ' ' : '';
  say(head + s.n + '. ' + tmDurTxt(s.s) + '.' + (lastLoop && TP.c.blocks.length > 1 ? ' ' + t('Último bloque.') : ''));
}
function tmLogSeg(s, secs) { if (s && s.ph !== 'p' && secs >= 1) TP.log.push([s.n, s.k, Math.round(secs)]); }
function tmTick() {
  const now = Date.now(), dt = Math.max(0, (now - TP.last) / 1000); TP.last = now;
  if (!TP.running || TP.paused) return;
  TP.act += dt; TP.pos += dt; tmExtend();
  let moved = 0;
  while (TP.i < TP.seg.length && TP.pos >= TP.seg[TP.i].t0 + TP.seg[TP.i].s) { tmLogSeg(TP.seg[TP.i], TP.seg[TP.i].s); TP.i++; moved++; }
  if (TP.i >= TP.seg.length) { tmFinish(true); return; }
  // al volver de la pantalla bloqueada se ponen al día los bloques sin anunciar cada uno
  if (moved) tmEnter(false);
  const s = tpCur(), rem = s.t0 + s.s - TP.pos, sec = Math.ceil(rem);
  if (sec !== TP.lastSec && dt < 1.5) {
    TP.lastSec = sec;
    if (sec <= 3 && sec >= 1 && s.s >= 8) { beep(sec === 1 ? 880 : 740, 110, S.sound === 'voz' ? .1 : .22); say(NUM_WORDS[sec]); }
    else if (sec === 60 && s.s >= 300) { beep(660, 160, .18); say(t('Falta un minuto.')); }
    else if (sec === 10 && s.s >= 60 && s.k === 'r') { beep(660, 140, .16); say(t('10 segundos.')); }
  }
  tmPaint();
  if (now - TP.lastSave > 3000) tmSave();
}
function tmSave() {
  if (!TP.running) return; TP.lastSave = Date.now();
  PS.set('tsession', { c: TP.c, pos: TP.pos, act: TP.act, log: TP.log, startedAt: TP.startedAt, savedAt: Date.now(), paused: TP.paused });
}
function tmPaint() {
  const s = tpCur(); if (!s) return;
  const c = TP.c, el = $('#tplayer'), rem = Math.max(0, s.t0 + s.s - TP.pos);
  el.className = 'player tplayer ' + TM_CLS[s.k];
  const R = c.rep === 'n' ? c.R : c.rep === 't' ? tmRounds(TP.seg) : 0;
  $('#tp-phase').textContent = s.ph === 'loop' ? (R ? t('Ronda {0} de {1}', s.r + 1, R) : t('Ronda {0}', s.r + 1)) : s.ph === 'p' ? t('Preparación') : s.ph === 'warm' ? t('Antes de empezar') : t('Para terminar');
  $('#tp-name').textContent = s.n;
  $('#tp-num').textContent = tmFmt(Math.ceil(rem - 0.05));
  $('#tp-arc').style.strokeDashoffset = (289.03 * (1 - rem / s.s)).toFixed(2);
  const last = TP.seg[TP.seg.length - 1], end = last.t0 + last.s, prep = c.prep;
  const done = Math.max(0, TP.pos - prep);
  $('#tp-tot').innerHTML = c.rep === 'f' ? `<span>${t('Total')}</span><b>${tmFmt(done)}</b>` : `<span>${t('Total')}</span><b>${tmFmt(done)}</b><span>${t('Faltan')}</span><b>${tmFmt(end - TP.pos)}</b>`;
  $('#tp-bar').style.width = (c.rep === 'f' ? (s.ph === 'loop' ? ((TP.pos - TP.seg.find(x => x.ph === 'loop' && x.r === s.r).t0) / tmLoop(c)) : 0) : TP.pos / end) * 100 + '%';
  $('#tp-meta').innerHTML = `<b data-noi18n>${esc(c.n || t('Timer'))}</b>`;
  // cuenta de cada bloque: cuántas veces y cuánto tiempo en total
  const acc = {}; TP.log.forEach(([n, k, x]) => { const a = acc[n] || (acc[n] = { k, n: 0, s: 0 }); a.n++; a.s += x; });
  if (s.ph !== 'p') { const a = acc[s.n] || (acc[s.n] = { k: s.k, n: 0, s: 0 }); a.live = TP.pos - s.t0; }
  const keys = Object.keys(acc);
  $('#tp-sum').innerHTML = keys.length ? keys.map(n => { const a = acc[n]; return `<span class="k-${a.k}"><i></i>${esc(n)} <b>${tmFmt(a.s + (a.live || 0))}</b></span>`; }).join('') : '';
  const nx = TP.seg[TP.i + 1];
  $('#tp-next').innerHTML = nx ? `<span>${t('Luego')}</span><b><i class="tp-dot k-${nx.k}"></i>${esc(nx.n)} · ${tmFmt(nx.s)}</b>` : `<b class="solo">${t('Último bloque')}</b>`;
  $('#tp-play').innerHTML = TP.paused ? ICON_PLAY : ICON_PAUSE;
  $('#tp-play').setAttribute('aria-label', TP.paused ? t('Continuar') : t('Pausa'));
}
function tmPause(p) {
  TP.paused = p != null ? p : !TP.paused; TP.last = Date.now();
  if (!TP.paused) { try { audioCtx(); } catch (e) {} TP.lastSec = null; }
  tmPaint(); tmSave();
}
function tmSkip() {
  const s = tpCur(); if (!s) return;
  tmLogSeg(s, TP.pos - s.t0); TP.pos = s.t0 + s.s; TP.i++; tmExtend();
  if (TP.i >= TP.seg.length) { tmFinish(true); return; }
  tmEnter();
}
function tmPrev() {
  const s = tpCur(); if (!s) return;
  if (TP.pos - s.t0 > 3 || TP.i === 0) TP.pos = s.t0;
  else { TP.i--; TP.pos = TP.seg[TP.i].t0; const l = TP.log[TP.log.length - 1]; if (l && l[0] === TP.seg[TP.i].n) TP.log.pop(); }
  tmEnter();
}
function tmMenu() {
  const was = TP.paused; tmPause(true);
  const m = $('#tp-menu');
  m.innerHTML = `<div class="pm-card"><div class="pm-k">Pausa</div><b class="pm-t" data-noi18n>${esc(TP.c.n || t('Timer'))}</b>
    <p class="pm-s">${t('{0} hechos', tmFmt(TP.act))}</p><div style="height:12px"></div>
    <button class="btn" data-m="go">▶ Continuar</button>
    <button class="btn ghost" data-m="end">Terminar<small>Se guarda en el historial</small></button>
    <button class="btn ghost" data-m="drop">Descartar<small>No se guarda</small></button></div>`;
  m.classList.remove('hidden');
  m.onclick = e => {
    const b = e.target.closest('[data-m]'); if (!b && e.target !== m) return;
    m.classList.add('hidden');
    const a = b ? b.dataset.m : 'go';
    if (a === 'go') { if (!was) tmPause(false); }
    else if (a === 'end') tmFinish(false);
    else tmFinish(false, true);
  };
}
function tmFinish(full, drop) {
  clearInterval(TP.timer); TP.running = false; wake(false);
  try { audioSession(false); } catch (e) {}
  if (!full) { try { speechSynthesis.cancel(); } catch (e) {} try { vStop(); } catch (e) {} }
  const s = tpCur(); if (!full && s) tmLogSeg(s, TP.pos - s.t0);
  PS.del('tsession');
  $('#tplayer').classList.add('hidden'); document.body.style.overflow = '';
  renderTimers();
  const secs = Math.round(TP.act);
  if (drop || secs < 20) return;
  const entry = { at: Date.now(), start: TP.startedAt, secs, full, w: { kind: 'timer', title: TP.c.n || t('Timer'), tm: TP.c }, tlog: TP.log, pauses: 0,
    reps: { sq: 0, pu: 0, ab: 0, bu: 0, pl: 0, dm: 0, t: { sq: 0, pu: 0, ab: 0, bu: 0, dm: 0 } }, rv: 2 };
  const h = PS.get('history', []); h.unshift(entry); saveHistory(h);
  if (full) { beep(784, 150, .25); setTimeout(() => beep(1046, 350, .3), 170); say(t('¡Terminaste! Buen trabajo.')); }
  try { renderHist(); } catch (e) {}
  tmDone(entry);
  setTimeout(() => { try { checkAwards(true); } catch (e) {} }, 600);
}
// cuenta por bloque: [{ n, k, x: veces, s: segundos }]
function tmTotals(log) { const m = new Map(); (log || []).forEach(([n, k, s]) => { const a = m.get(n) || { n, k, x: 0, s: 0 }; a.x++; a.s += s; m.set(n, a); }); return [...m.values()]; }
const tmTotalsHTML = log => { const T = tmTotals(log); return T.length ? `<div class="block">${T.map(a => `<div class="hist tm-tot"><div class="t"><b data-noi18n><i class="tp-dot k-${a.k}"></i>${esc(a.n)}</b><small>${a.x === 1 ? t('1 vez') : t('{0} veces', a.x)}</small></div><b class="tm-tv">${tmFmt(a.s)}</b></div>`).join('')}</div>` : ''; };
function tmDone(x) {
  sheet(`<h3>${x.full ? '¡Hecho!' : 'Timer guardado'}</h3><p class="sub" data-noi18n>${esc(x.w.title)}</p>
    <div class="stats"><div class="stat"><b>${tmFmt(x.secs)}</b><span>tiempo total</span></div><div class="stat"><b>${(x.tlog || []).length}</b><span>bloques</span></div></div>
    <h2>Por bloque</h2>${tmTotalsHTML(x.tlog)}
    <div class="gap"></div><button class="btn" id="tmd-ok">Listo</button>`, () => { $('#tmd-ok').onclick = () => closeSheet(); });
}
function tmPreload() {
  try {
    const v = voiceOf(); if (v === 'sistema') return;
    loadIdx().then(idx => {
      if (!idx) return;
      const texts = [t('Prepárate.'), '1 2 3', t('Falta un minuto.'), t('Último bloque.'), t('¡Terminaste! Buen trabajo.')];
      TP.seg.slice(0, 40).forEach(s => texts.push(s.n + '. ' + tmDurTxt(s.s) + '.', t('Primero: {0}.', s.n)));
      texts.forEach(x => { const p = vplan(x, idx); if (p) p.forEach(q => { if (q.id) getBuf(v, q.id).catch(() => {}); }); });
    });
  } catch (e) {}
}
$('#tp-play').onclick = () => tmPause();
$('#tp-skip').onclick = () => tmSkip();
$('#tp-prev').onclick = () => tmPrev();
$('#tp-close').onclick = () => tmMenu();
$('#tp-voice').onclick = () => cycleSound();
document.addEventListener('visibilitychange', () => { if (!TP.running) return; if (document.visibilityState === 'hidden') tmSave(); else { TP.lastSec = null; tmTick(); } });
