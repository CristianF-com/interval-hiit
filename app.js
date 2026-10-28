'use strict';
/* =========================================================
   INHIIT — coach, planes, perfiles y reproductor
   ========================================================= */

/* ---------- Utilidades ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = s => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60), x = s % 60; return m + ':' + String(x).padStart(2, '0'); };
const mins = s => Math.max(1, Math.round(s / 60)) + ' min';
const rnd = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clone = o => JSON.parse(JSON.stringify(o));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2200); }
const dateStr = t => new Date(t).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });

/* ---------- Almacenamiento (por perfil) ---------- */
const NS = 'intervalo.';
const LS = {
  get(k, d) { try { const v = localStorage.getItem(NS + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(NS + k, JSON.stringify(v)); return true; } catch (e) { toast('No se pudo guardar (almacenamiento lleno o bloqueado)'); return false; } },
  del(k) { try { localStorage.removeItem(NS + k); } catch (e) {} },
  keys() { try { return Object.keys(localStorage).filter(k => k.startsWith(NS)).map(k => k.slice(NS.length)); } catch (e) { return []; } }
};
const PROFILE_KEYS = ['settings', 'favs', 'history', 'plan', 'plansDone', 'session', 'smart', 'awards', 'retos', 'dumb'];
let PROFILE = null;
const PS = {
  get: (k, d) => LS.get(`p.${PROFILE.id}.${k}`, d),
  set: (k, v) => LS.set(`p.${PROFILE.id}.${k}`, v),
  del: k => LS.del(`p.${PROFILE.id}.${k}`)
};
const COLORS = ['#ff5a36', '#35d0bf', '#ffc23d', '#9d8cff', '#7bd88f', '#ff7eb6', '#5fb3ff'];
// el color de cada perfil es un tono de la paleta del tema activo (cambia con el tema)
const avStyle = p => { const i = Math.max(0, COLORS.indexOf(p.color)); return `background:var(--av${i});color:var(--avt${i})`; };
const profiles = () => LS.get('profiles', []);
const saveProfiles = p => LS.set('profiles', p);
// Pedir al navegador que no borre los datos por falta de espacio
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}

const DEFAULTS = { dur: 1200, parts: ['all'], level: 2, noJump: false, warmup: true, cooldown: true, vary: false, custom: false,
  cw: 40, cr: 20, cn: 5, cR: 3, crr: 60, voice: true, sound: 'voz', planWarm: false, planCool: false, autoNext: true };
let S = { ...DEFAULTS };
const save = () => PS.set('settings', S);

/* ---------- Catálogo ---------- */
const UNI = new Set(UNILATERAL);
const PARTS = { all: 'Cuerpo completo', c: 'Core', a: 'Brazos', u: 'Tren superior', g: 'Glúteos', l: 'Piernas' };
const LEVELS = ['Principiante', 'Intermedio', 'Avanzado'];
const PLAN_LEVELS = ['Inicial', 'Básico', 'Intermedio', 'Avanzado'];
const VARIANTS = { f: 'Mujer', m: 'Hombre', x: 'Mixta' };
const REP_SEC = 2.5; // estimación por repetición
const _exCache = new Map();
function ex(id) {
  if (ID_ALIAS[id]) id = ID_ALIAS[id]; // códigos antiguos guardados en historial o favoritos
  if (_exCache.has(id)) return _exCache.get(id);
  let e;
  if (CATALOG[id]) e = { ...CATALOG[id], id, s: UNI.has(id) };
  else {
    const m = id.match(/^(.*)_(l|r)$/);
    if (m && CATALOG[m[1]]) e = { ...CATALOG[m[1]], id, n: CATALOG[m[1]].n + (m[2] === 'l' ? ' · izquierda' : ' · derecha'), side: m[2] };
    else e = { id, n: id, p: '', lv: 1, j: 0, t: 'x', d: '' };
  }
  _exCache.set(id, e); return e;
}
const COACH_POOL = Object.keys(CATALOG).filter(k => CATALOG[k].t === 'x').map(ex);
const WARM = Object.keys(CATALOG).filter(k => CATALOG[k].t === 'w');
const COOL = Object.keys(CATALOG).filter(k => CATALOG[k].t === 's');

/* Plantillas de tiempo del coach */
const SKELETONS = [
  [45,5,4,2,30,420],[55,15,3,2,30,420],
  [40,20,5,2,40,600],[45,15,5,2,30,600],[50,10,5,2,20,600],
  [40,25,7,2,40,900],[40,20,5,3,30,900],
  [45,25,4,4,60,1200],[40,20,6,3,90,1200],[50,25,5,3,75,1200],
  [50,20,5,4,60,1500],[40,10,5,5,75,1500],
  [45,15,7,4,60,1800],
  [40,35,5,5,100,2100],[60,40,7,3,60,2100],
  [45,30,6,5,75,2400],[60,30,5,5,75,2400],
  [50,40,6,5,50,2700],[50,25,7,5,50,2700],
].map(([w, r, n, R, rr, dur]) => ({ w, r, n, R, rr, dur }));
const DURS = [...new Set(SKELETONS.map(s => s.dur))];

/* ---------- Planes: decodificación ---------- */
const FAM = Object.fromEntries(PLAN_FAMILIES.map(f => [f.key, f]));
function decodeDay(str) {
  const c = str.indexOf(':');
  const o = +str.slice(0, c), rounds = [];
  str.slice(c + 1).split('|').forEach(part => {
    let n = 1, r = part; const m = part.match(/^(\d+)\*(.*)$/);
    if (m) { n = +m[1]; r = m[2]; }
    const items = r.split(',').map(it => { const mm = it.match(/^(\d+)([xt])(\d+)$/); return { id: PLAN_IDS[+mm[1]], reps: mm[2] === 'x' ? +mm[3] : 0, secs: mm[2] === 't' ? +mm[3] : 0 }; });
    for (let i = 0; i < n; i++) rounds.push(items);
  });
  return { o, rounds };
}
function planWeek(file, level, week) {
  const w = PLANS[file].find(x => x[0] === level && x[1] === week);
  return w ? w[2].split(';').map(decodeDay) : [];
}
function dayRange(file) {
  const days = planWeek(file, 0, 1);
  return { min: Math.max(1, days.filter(d => d.o === 0).length), max: days.length };
}
// Días activos según días/semana: se quitan primero los de menor orden de eliminación (1, 2, 3…)
function keptDays(days, count) {
  const idx = days.map((d, i) => i);
  let remove = Math.max(0, days.length - count);
  const order = idx.filter(i => days[i].o > 0).sort((a, b) => days[a].o - days[b].o);
  const drop = new Set(order.slice(0, remove));
  return idx.filter(i => !drop.has(i));
}
function dayEstimate(day) {
  let s = 0, n = 0;
  day.rounds.forEach(r => r.forEach(it => { if (it.id === 'pause') s += it.secs; else { n++; s += it.reps ? it.reps * REP_SEC : it.secs; } }));
  return { secs: s, n };
}
function variantFile(fam, v) { return fam.v[v] || fam.v.x || fam.v.f || fam.v.m; }

/* =========================================================
   Perfiles
   ========================================================= */
function legacyData() {
  // datos de la versión anterior (sin perfiles)
  const d = {};
  ['settings', 'favs', 'history'].forEach(k => { const v = LS.get(k, null); if (v != null) d[k] = v; });
  return Object.keys(d).length ? d : null;
}
function createProfile(name, variant, data) {
  const p = { id: uid(), name: name.trim().slice(0, 24) || 'Perfil', variant, color: COLORS[profiles().length % COLORS.length], created: Date.now() };
  const list = profiles(); list.push(p); saveProfiles(list);
  if (data) Object.entries(data).forEach(([k, v]) => { if (PROFILE_KEYS.includes(k)) LS.set(`p.${p.id}.${k}`, v); });
  return p;
}
function switchProfile(id) {
  const p = profiles().find(x => x.id === id); if (!p) return;
  PROFILE = p; LS.set('active', id);
  S = { ...DEFAULTS, ...PS.get('settings', {}) };
  if (!PS.get('settings', {}).sound && S.voice === false) S.sound = 'pitidos';
  W = null; viewWeek = null;
  applyTheme();
  renderWho(); renderSetup(); renderResume();
  if (typeof checkAwards === 'function') checkAwards(false);
  show(currentView === 'preview' ? 'coach' : currentView);
}
function deleteProfile(id) {
  LS.keys().filter(k => k.startsWith(`p.${id}.`)).forEach(k => LS.del(k));
  saveProfiles(profiles().filter(p => p.id !== id));
}
function renderWho() {
  $('#who').innerHTML = `<span class="av" style="${avStyle(PROFILE)}">${esc(PROFILE.name[0].toUpperCase())}</span><span>${esc(PROFILE.name)}</span>`;
}
function variantSeg(id, cur, opts = ['f', 'm']) {
  return `<div class="seg" id="${id}">${opts.map(v => `<button data-v="${v}" aria-pressed="${cur === v}">${VARIANTS[v]}</button>`).join('')}</div>`;
}
function bindSeg(id, attr, cb) {
  const el = document.getElementById(id); if (!el) return;
  el.onclick = e => { const b = e.target.closest(`[data-${attr}]`); if (!b) return; el.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); cb(b.dataset[attr]); };
}

function showOnboarding() {
  const legacy = legacyData();
  let v = 'f';
  $('#ob-form').innerHTML = `
    <h2>Nombre</h2>
    <div class="field"><input id="ob-name" maxlength="24" placeholder="Tu nombre" autocomplete="off"></div>
    <h2>Versión de los planes</h2>
    ${variantSeg('ob-var', v)}
    <p class="note">Los planes tienen versión femenina y masculina con pequeñas diferencias de ejercicios. Puedes cambiarla luego.</p>
    ${legacy ? '<p class="note">Se pasarán a este perfil los entrenamientos que ya tenías guardados.</p>' : ''}
    <div style="height:24px"></div>
    <button class="btn" id="ob-go">Crear perfil</button>
    <div class="gap"></div>
    <button class="btn ghost" id="ob-restore">☁ Ya tengo una copia: restaurar<small>Desde iCloud Drive, Google Drive o Archivos</small></button>`;
  bindSeg('ob-var', 'v', x => v = x);
  $('#onboard').classList.remove('hidden');
  $('#ob-restore').onclick = () => $('#import-file').click();
  $('#ob-go').onclick = () => {
    const name = $('#ob-name').value.trim();
    if (!name) { $('#ob-name').focus(); toast('Escribe un nombre'); return; }
    const p = createProfile(name, v, legacy);
    if (legacy) ['settings', 'favs', 'history'].forEach(k => LS.del(k));
    $('#onboard').classList.add('hidden');
    switchProfile(p.id);
  };
}

/* ---------- Tema de colores ---------- */
const THEMES = { oscuro: { n: 'INHIIT (oscuro)', meta: '#0e0f12', sw: ['#0e0f12', '#17191e', '#ff5a36', '#35d0bf'] },
  naranja: { n: 'Naranja clásico', meta: '#2b2c31', sw: ['#2b2c31', '#d5d8dd', '#ff9500', '#eceef1'] } };
function applyTheme() {
  const t = THEMES[S.theme] ? S.theme : 'oscuro';
  document.documentElement.dataset.theme = t;
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', THEMES[t].meta);
  try { localStorage.setItem('intervalo.theme', t); } catch (e) {}
}

/* ---------- Hojas modales ---------- */
// locked: sin X, sin deslizar y sin cerrar tocando fuera (solo se cierra con sus propios botones)
function sheet(html, onMount, locked) {
  const root = $('#sheet-root');
  if (locked) {
    root.innerHTML = `<div class="scrim" id="scrim"><div class="sheet locked" role="dialog" aria-modal="true">${html}</div></div>`;
    onMount && onMount(root); return;
  }
  root.innerHTML = `<div class="scrim" id="scrim"><div class="sheet" role="dialog"><div class="sh-bar" id="sh-bar"><div class="grab"></div>
    <button class="icon-btn sh-x" id="sh-x" aria-label="Cerrar"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>${html}</div></div>`;
  $('#scrim').onclick = e => { if (e.target.id === 'scrim') closeSheet(); };
  // la barra superior cierra: tocándola o deslizándola hacia abajo
  const bar = $('#sh-bar'), sh = root.querySelector('.sheet');
  bar.onclick = closeSheet;
  let y0 = null, dy = 0;
  bar.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; dy = 0; sh.style.transition = 'none'; }, { passive: true });
  bar.addEventListener('touchmove', e => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); sh.style.transform = `translateY(${dy}px)`; }, { passive: true });
  bar.addEventListener('touchend', () => { if (y0 == null) return; y0 = null; sh.style.transition = 'transform .18s'; if (dy > 70) closeSheet(); else sh.style.transform = ''; });
  onMount && onMount(root);
}
const closeSheet = () => { $('#sheet-root').innerHTML = ''; };
// confirmación con el estilo de la app (en lugar del cuadro del navegador)
function askApp(title, msg, ok, danger) {
  return new Promise(res => sheet(`<h3>${esc(title)}</h3><p class="sub">${esc(msg)}</p><div style="height:18px"></div>
    <button class="btn ${danger ? 'danger' : ''}" id="ask-ok">${esc(ok)}</button><div class="gap"></div><button class="btn ghost" id="ask-no">Volver</button>`, () => {
    $('#ask-ok').onclick = () => { closeSheet(); res(true); };
    $('#ask-no').onclick = () => { closeSheet(); res(false); };
  }));
}

function openProfiles() {
  const list = profiles();
  sheet(`
    <h3>Perfiles</h3>
    <p class="sub">Cada perfil guarda su plan, progreso e historial por separado.</p>
    <div class="gap"></div>
    <div class="block">${list.map(p => `
      <button class="prof" data-id="${p.id}"><span class="av lg" style="${avStyle(p)}">${esc(p.name[0].toUpperCase())}</span>
        <span class="t"><b>${esc(p.name)}</b><small>Planes: ${VARIANTS[p.variant]}${LS.get(`p.${p.id}.plan`, null) ? ' · ' + esc(FAM[LS.get(`p.${p.id}.plan`).fam]?.n || '') : ''}</small></span>
        ${p.id === PROFILE.id ? '<span class="ck"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg></span>' : ''}
      </button>`).join('')}</div>
    <div class="row"><button class="btn ghost small" id="pf-add">+ Nuevo perfil</button><button class="btn ghost small" id="pf-edit">Editar actual</button></div>
    <div id="pf-form"></div>
    <h2>Apariencia</h2>
    <div class="theme-pick" id="pf-theme">${Object.entries(THEMES).map(([k, t]) => `<button data-t="${k}" aria-pressed="${(S.theme || 'oscuro') === k}"><span class="sw4">${t.sw.map(c => `<i style="background:${c}"></i>`).join('')}</span>${t.n}</button>`).join('')}</div>
    <h2>Voz y pulso</h2>
    <div class="row"><button class="btn ghost small" id="pf-voice">Voz del entrenador</button><button class="btn ghost small" id="pf-hr">Pulsómetro y zonas</button></div>
    <h2>Copia en la nube</h2>
    <button class="btn ghost small" id="pf-backup">☁ Guardar o restaurar (iCloud Drive / Google Drive)</button>
    <p class="note">${LS.get('bkLast', 0) ? 'Última copia: ' + dateStr(LS.get('bkLast', 0)) + '. ' : ''}Los datos viven en este teléfono; con la copia en la nube los recuperas si cambias de móvil o se borra el navegador.</p>
    <div id="pf-install"></div>`, () => {
    document.querySelectorAll('.prof').forEach(b => b.onclick = () => { closeSheet(); if (b.dataset.id !== PROFILE.id) { switchProfile(b.dataset.id); toast('Perfil: ' + PROFILE.name); } });
    $('#pf-add').onclick = () => profileForm(null);
    $('#pf-edit').onclick = () => profileForm(PROFILE);
    $('#pf-hr').onclick = openHRSettings;
    $('#pf-voice').onclick = openVoiceSettings;
    bindSeg('pf-theme', 't', t => { S.theme = t; save(); applyTheme(); });
    $('#pf-backup').onclick = openBackup;
    renderInstallBlock();
  });
}
function profileForm(p) {
  let v = p ? p.variant : 'f';
  const ps = p ? (p.id === PROFILE.id ? S : { ...DEFAULTS, ...LS.get(`p.${p.id}.settings`, {}) }) : {};
  $('#pf-form').innerHTML = `
    <h2>${p ? 'Editar perfil' : 'Nuevo perfil'}</h2>
    <div class="field"><input id="pf-name" maxlength="24" placeholder="Nombre" value="${p ? esc(p.name) : ''}"></div>
    <div class="gap"></div>${variantSeg('pf-var', v)}
    <h2>Datos personales</h2>
    <div class="adv" style="grid-template-columns:1fr 1fr 1fr;padding:0">
      <label>Edad<input type="number" inputmode="numeric" min="10" max="99" id="pf-age" value="${ps.age || ''}" placeholder="—"></label>
      <label>Peso (kg)<input type="number" inputmode="decimal" min="25" max="250" step="0.1" id="pf-kg" value="${ps.weight || ''}" placeholder="—"></label>
      <label>Altura (cm)<input type="number" inputmode="numeric" min="100" max="230" id="pf-cm" value="${ps.height || ''}" placeholder="—"></label>
    </div>
    <p class="note">Se usan para calcular las calorías, tus zonas de pulso y los pesos sugeridos con mancuernas.</p>
    <div class="gap"></div>
    <button class="btn small" id="pf-save">${p ? 'Guardar' : 'Crear y cambiar'}</button>
    ${p && profiles().length > 1 ? '<div class="gap"></div><button class="btn danger" id="pf-del">Eliminar este perfil y sus datos</button>' : ''}`;
  bindSeg('pf-var', 'v', x => v = x);
  $('#pf-save').onclick = () => {
    const name = $('#pf-name').value.trim(); if (!name) { toast('Escribe un nombre'); return; }
    const num = (sel, lo, hi) => { const x = parseFloat(String($(sel).value).replace(',', '.')); return isFinite(x) && x >= lo && x <= hi ? Math.round(x * 10) / 10 : null; };
    const pd = { age: num('#pf-age', 10, 99), weight: num('#pf-kg', 25, 250), height: num('#pf-cm', 100, 230) };
    const putPD = id => { if (id === PROFILE.id) { Object.assign(S, pd); save(); } else { const st = LS.get(`p.${id}.settings`, {}); LS.set(`p.${id}.settings`, { ...st, ...pd }); } };
    if (p) {
      putPD(p.id);
      const list = profiles(); const q = list.find(x => x.id === p.id); q.name = name.slice(0, 24); q.variant = v; saveProfiles(list);
      PROFILE = q; renderWho(); closeSheet(); show(currentView); toast('Perfil actualizado');
    } else { const n = createProfile(name, v); putPD(n.id); closeSheet(); switchProfile(n.id); toast('Perfil creado: ' + n.name); }
  };
  const del = $('#pf-del');
  if (del) del.onclick = async () => {
    if (!(await askApp('Eliminar perfil', `Se borrará el perfil «${p.name}» con todo su progreso, historial y logros. No se puede deshacer.`, 'Eliminar perfil', true))) return;
    deleteProfile(p.id); closeSheet(); switchProfile(profiles()[0].id); toast('Perfil eliminado');
  };
}
function exportProfile() {
  const data = {}; PROFILE_KEYS.forEach(k => { const v = PS.get(k, null); if (v != null) data[k] = v; });
  const blob = new Blob([JSON.stringify({ app: 'intervalo', v: 2, exportedAt: Date.now(), profile: PROFILE, data }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `inhiit-${PROFILE.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
$('#import-file').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    if (j.app !== 'intervalo' || !j.profile || !j.data) throw 0;
    const exists = profiles().find(p => p.id === j.profile.id);
    let id;
    if (exists && await askApp('Perfil existente', `Ya existe el perfil «${exists.name}». ¿Reemplazar sus datos con la copia?`, 'Reemplazar')) {
      id = exists.id; PROFILE_KEYS.forEach(k => LS.del(`p.${id}.${k}`));
      Object.entries(j.data).forEach(([k, v]) => { if (PROFILE_KEYS.includes(k)) LS.set(`p.${id}.${k}`, v); });
    } else {
      id = createProfile(j.profile.name + (exists ? ' (copia)' : ''), j.profile.variant || 'f', j.data).id;
    }
    closeSheet(); switchProfile(id); toast('Copia importada');
  } catch (err) { toast('Ese archivo no es una copia válida'); }
};
$('#who').onclick = openProfiles;

/* ---------- Instalación PWA ---------- */
let installEvt = null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; $('#install-top').classList.remove('hidden'); });
window.addEventListener('appinstalled', () => { installEvt = null; $('#install-top').classList.add('hidden'); toast('App instalada'); });
async function doInstall() {
  if (installEvt) { installEvt.prompt(); try { await installEvt.userChoice; } catch (e) {} installEvt = null; $('#install-top').classList.add('hidden'); }
}
$('#install-top').onclick = doInstall;
function renderInstallBlock() {
  const el = $('#pf-install'); if (!el) return;
  if (isStandalone()) { el.innerHTML = ''; return; }
  let h = '<h2>Instalar</h2>';
  if (installEvt) h += '<button class="btn small" id="pf-inst">Instalar INHIIT en este dispositivo</button>';
  else if (isIOS()) h += '<p class="note">En iPhone/iPad: abre en Safari, toca Compartir y luego «Añadir a pantalla de inicio».</p>';
  else if (location.protocol === 'file:') h += '<p class="note">Para instalarla, la app tiene que abrirse desde una dirección web (https o localhost), no como archivo. Mira el LEEME.</p>';
  else h += '<p class="note">Si tu navegador lo permite, usa el menú ⋮ → «Instalar app» o «Añadir a pantalla de inicio».</p>';
  const os = offlineStatus(); h += `<p class="note" style="color:${os.ok ? 'var(--ok, #3fb950)' : 'var(--warn, #e58600)'}">${os.ok ? '✓' : '⚠'} ${os.msg}</p>`;
  el.innerHTML = h;
  const b = $('#pf-inst'); if (b) b.onclick = () => { closeSheet(); doInstall(); };
}
// Service worker «primero la caché»: la app abre desde el teléfono aunque no haya internet
// o el sistema la haya cerrado. Se registra enseguida (no espera a que cargue todo).
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
}
function offlineStatus() {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return { ok: false, msg: 'Modo sin conexión NO disponible: la app está abierta por http. El teléfono solo lo permite con https (mira el LEEME: Netlify Drop o GitHub Pages).' };
  if (navigator.serviceWorker.controller) return { ok: true, msg: 'Modo sin conexión activo: la app abre desde el teléfono aunque no haya internet.' };
  return { ok: false, msg: 'Preparando el modo sin conexión… vuelve a abrir la app una vez con internet.' };
}
// Si el sistema cerró la app en pleno entrenamiento, al volver se retoma en pausa
window.addEventListener('load', () => {
  if (!PROFILE) return;
  const fresh = x => x && Date.now() - x.savedAt < 30 * 60e3;
  const s = PS.get('session', null), r = PS.get('rsession', null);
  if (fresh(r) && (!fresh(s) || r.savedAt > s.savedAt) && typeof resumeReto === 'function') { if (resumeReto(r)) return; }
  if (fresh(s)) { try { startWorkout(s.w, s); toast('Entrenamiento retomado donde quedó'); } catch (e) {} }
  else if (r && !fresh(r)) PS.del('rsession');
});

/* =========================================================
   Coach
   ========================================================= */
let W = null;          // entrenamiento en vista previa
let currentView = 'coach';

function renderSetup() {
  $('#durs').innerHTML = DURS.map(d => `<button class="chip" data-d="${d}" aria-pressed="${!S.custom && S.dur === d}">${d / 60}<small>min</small></button>`).join('');
  $('#parts').innerHTML = Object.entries(PARTS).map(([k, v]) => `<button class="chip" data-p="${k}" aria-pressed="${S.parts.includes(k)}">${v}</button>`).join('');
  $('#levels').innerHTML = LEVELS.map((v, i) => `<button data-l="${i + 1}" aria-pressed="${S.level === i + 1}">${v}</button>`).join('');
  document.querySelectorAll('.tg[data-opt]').forEach(b => b.setAttribute('aria-checked', !!S[b.dataset.opt]));
  $('#adv').classList.toggle('hidden', !S.custom);
  $('#durs').style.opacity = S.custom ? .4 : 1;
  $('#c-work').value = S.cw; $('#c-rest').value = S.cr; $('#c-n').value = S.cn; $('#c-r').value = S.cR; $('#c-rr').value = S.crr;
}
$('#durs').onclick = e => { const b = e.target.closest('[data-d]'); if (!b) return; S.dur = +b.dataset.d; S.custom = false; save(); renderSetup(); };
$('#parts').onclick = e => {
  const b = e.target.closest('[data-p]'); if (!b) return; const k = b.dataset.p;
  if (k === 'all') S.parts = ['all'];
  else { S.parts = S.parts.filter(x => x !== 'all'); S.parts.includes(k) ? S.parts = S.parts.filter(x => x !== k) : S.parts.push(k); if (!S.parts.length) S.parts = ['all']; }
  save(); renderSetup();
};
$('#levels').onclick = e => { const b = e.target.closest('[data-l]'); if (!b) return; S.level = +b.dataset.l; save(); renderSetup(); };
document.querySelectorAll('.tg[data-opt]').forEach(b => b.onclick = () => {
  S[b.dataset.opt] = !S[b.dataset.opt]; save(); renderSetup();
  if (b.closest('#pv-plan-opts') && W) renderPreview();
});
[['#c-work', 'cw', 10, 180], ['#c-rest', 'cr', 0, 180], ['#c-n', 'cn', 1, 12], ['#c-r', 'cR', 1, 10], ['#c-rr', 'crr', 0, 300]].forEach(([sel, k, mn, mx]) => {
  $(sel).onchange = e => { let v = parseInt(e.target.value, 10); if (isNaN(v)) v = S[k]; S[k] = Math.max(mn, Math.min(mx, v)); e.target.value = S[k]; save(); };
});

const activeParts = parts => (parts || S.parts).includes('all') ? ['c', 'a', 'u', 'g', 'l'] : (parts || S.parts);
const poolFor = o => COACH_POOL.filter(e => e.lv <= o.level && !(o.noJump && e.j) && [...e.p].some(p => o.parts.includes(p)) && !(o.zoneMax && e.p && e.lv > (o.zoneMax[e.p[0]] || 3)));
function weighted(c, level) {
  const w = c.map(e => e.lv === level ? 3 : (level - e.lv === 1 ? 2 : 1));
  let t = w.reduce((a, b) => a + b, 0) * Math.random();
  for (let i = 0; i < c.length; i++) { t -= w[i]; if (t <= 0) return c[i]; }
  return c[c.length - 1];
}
function pickExercises(n, o, avoid = new Set()) {
  const pool = poolFor(o); if (!pool.length) return [];
  const order = shuffle(o.parts), out = [], used = new Set();
  for (let i = 0; i < n; i++) {
    const t = order[i % order.length], prev = out[out.length - 1];
    if (o.db && i % 2 === 0 && typeof DB_POOL !== 'undefined') {
      const dc = DB_POOL.filter(e => e.lv <= o.level && !used.has(e.id) && !avoid.has(e.id));
      const dp = dc.filter(e => e.p.includes(t)), pick = dp.length ? dp : dc.filter(e => [...e.p].some(p => o.parts.includes(p)));
      if (pick.length) { const e = rnd(pick); out.push(e); used.add(e.id); continue; }
    }
    let c = pool.filter(e => e.p.includes(t) && !used.has(e.id) && !avoid.has(e.id));
    if (!c.length) c = pool.filter(e => !used.has(e.id) && !avoid.has(e.id));
    if (!c.length) c = pool.filter(e => !used.has(e.id));
    if (!c.length) c = pool.filter(e => !prev || e.id !== prev.id);
    if (!c.length) c = pool;
    if (prev && prev.j) { const nj = c.filter(e => !e.j); if (nj.length) c = nj; }
    const e = weighted(c, o.level); out.push(e); used.add(e.id);
  }
  return out.map(e => e.id);
}
function chooseSkeleton() {
  if (S.custom) return { w: S.cw, r: S.cr, n: S.cn, R: S.cR, rr: S.crr, dur: 0 };
  const c = SKELETONS.filter(s => s.dur === S.dur).sort((a, b) => (a.r / a.w) - (b.r / b.w));
  if (c.length === 1 || S.level === 3) return c[0];
  if (S.level === 1) return c[c.length - 1];
  return rnd(c);
}
function generate() {
  const o = { parts: activeParts(), level: S.level, noJump: S.noJump, db: !!S.useDb };
  const sk = chooseSkeleton(), rounds = [];
  if (S.vary) { const seen = new Set(); for (let r = 0; r < sk.R; r++) { const ids = pickExercises(sk.n, o, seen); ids.forEach(i => seen.add(i)); rounds.push(ids); } }
  else { const ids = pickExercises(sk.n, o); for (let r = 0; r < sk.R; r++) rounds.push(ids); }
  return { kind: 'coach', created: Date.now(), sk, level: S.level, parts: S.parts.slice(), noJump: S.noJump, vary: S.vary, rounds, db: !!S.useDb,
    warm: S.warmup ? shuffle(WARM).slice(0, 5) : [], cool: S.cooldown ? shuffle(COOL).slice(0, 5) : [] };
}
function title(w) {
  if (w.kind === 'plan') return w.title;
  if (w.kind === 'test') return 'Prueba de capacidad';
  if (w.kind === 'reto') return w.title;
  if (w.kind === 'db') return w.title || 'Mancuernas';
  if (w.smart) return `Sesión ${w.smartN} · ${FOCUS[w.focus].n}${w.db ? ' · mancuernas' : ''}`;
  return (w.parts.includes('all') ? 'Cuerpo completo' : w.parts.map(k => PARTS[k]).join(' + ')) + (w.db ? ' · mancuernas' : '');
}

/* =========================================================
   Entrenador inteligente: prueba inicial + ajuste por sensación
   ========================================================= */
// Prueba: 1 minuto de sentadillas, flexiones y abdominales. Cada resultado da una nota de 1 a 4.5
const TESTS = [
  { key: 'sq', ex: 'squats', n: 'Sentadillas', cuts: [20, 35, 50], zones: ['l', 'g'] },
  { key: 'pu', ex: 'push_ups', n: 'Flexiones', cuts: [8, 20, 35], zones: ['u', 'a'] },
  { key: 'ab', ex: 'crunches', n: 'Abdominales', cuts: [15, 30, 45], zones: ['c'] },
];
const FOCUS = [
  { n: 'Cuerpo completo', parts: ['c', 'a', 'u', 'g', 'l'] },
  { n: 'Piernas y core', parts: ['l', 'g', 'c'] },
  { n: 'Tren superior y core', parts: ['u', 'a', 'c'] },
];
const FB = { easy: { n: 'Fácil', d: 0.7 }, ok: { n: 'Bien', d: 0.3 }, hard: { n: 'Difícil', d: -0.6 } };
const getSmart = () => PS.get('smart', null);
const setSmart = v => PS.set('smart', v);
const DAY = 864e5;
const dayStart = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
function testScore(t, v) {
  const [a, b, c] = t.cuts;
  if (v <= 0) return 1;
  if (v < a) return 1 + v / a;
  if (v < b) return 2 + (v - a) / (b - a);
  if (v < c) return 3 + (v - b) / (c - b);
  return Math.min(4.5, 4 + (v - c) / c);
}
function scoresOf(r) {
  const o = {};
  TESTS.forEach(t => { let v = +r[t.key] || 0; if (t.key === 'pu' && r.puKnee) v *= 0.55; o[t.key] = testScore(t, v); });
  return o;
}
const intensityOf = sc => Math.max(1, Math.min(9, 1 + ((sc.sq + sc.pu + sc.ab) / 3 - 1) * 2.6));
const levelOfI = I => I < 3.6 ? 1 : I < 6.6 ? 2 : 3;
function zoneMaxOf(sm) {
  const t = sm.tests && sm.tests[0]; if (!t) return null;
  const sc = scoresOf(t), z = {};
  TESTS.forEach(x => x.zones.forEach(k => { z[k] = sc[x.key] < 2 ? 1 : sc[x.key] < 3 ? 2 : 3; }));
  return z;
}
// Arma la próxima sesión según la intensidad (1–10), la zona del día y la nota de cada zona
function genSmart(sm) {
  const I = sm.I, level = levelOfI(I), n = (sm.sessions || 0) + 1, focus = (n - 1) % 3;
  const want = 600 + (I - 1) * 240, cap = sm.maxDur || 1800;
  const durs = DURS.filter(d => d <= cap);
  const dur = durs.reduce((b, d) => Math.abs(d - want) < Math.abs(b - want) ? d : b, durs[0] || DURS[0]);
  // más intensidad dentro del mismo tiempo = menos descanso
  const c = SKELETONS.filter(k => k.dur === dur).sort((a, b) => (b.r / b.w) - (a.r / a.w));
  const band = (I - 1) / 8, sk = c[Math.min(c.length - 1, Math.round(band * (c.length - 1)))];
  const o = { parts: FOCUS[focus].parts, level, noJump: S.noJump, zoneMax: zoneMaxOf(sm), db: !!sm.db };
  let ids = pickExercises(sk.n, o);
  if (ids.length < sk.n) ids = pickExercises(sk.n, { ...o, zoneMax: null });
  const rounds = []; for (let r = 0; r < sk.R; r++) rounds.push(ids);
  return { kind: 'coach', smart: true, smartN: n, focus, I: +I.toFixed(1), created: Date.now(), sk, level, parts: FOCUS[focus].parts.slice(), noJump: S.noJump, vary: false, rounds, db: !!sm.db,
    warm: S.warmup ? shuffle(WARM).slice(0, 5) : [], cool: S.cooldown ? shuffle(COOL).slice(0, 5) : [] };
}
function smartRefresh(sm) {
  // si pasan muchos días sin entrenar, baja un poco la intensidad (una vez por semana extra de pausa)
  if (sm.lastAt) {
    const idle = Math.floor((Date.now() - sm.lastAt) / DAY);
    const steps = Math.max(0, Math.floor((idle - 7) / 7) + (idle >= 7 ? 1 : 0)) - (sm.decay || 0);
    if (steps > 0) { sm.I = Math.max(1, sm.I - 0.5 * steps); sm.decay = (sm.decay || 0) + steps; sm.next = genSmart(sm); setSmart(sm); }
  }
  if (!sm.next) { sm.next = genSmart(sm); setSmart(sm); }
  return sm;
}
const whenStr = t => {
  const d = Math.round((dayStart(t) - dayStart(Date.now())) / DAY);
  return d <= 0 ? 'hoy' : d === 1 ? 'mañana' : new Date(t).toLocaleDateString('es', { weekday: 'long', day: 'numeric' });
};
function renderSmart() {
  const el = $('#smart'); if (!el || !PROFILE) return;
  let sm = getSmart();
  if (!sm || !sm.I) {
    el.innerHTML = `<div class="now smart">
      <div class="wk">Entrenador inteligente</div>
      <b class="name">Prueba de capacidad</b>
      <p class="sub">3 minutos: sentadillas, flexiones y abdominales, 1 minuto cada uno. Con tus resultados armo sesiones progresivas, una cada dos días, y después de cada una me dices si fue fácil, bien o difícil para ajustar la siguiente.</p>
      <div class="gap"></div><button class="btn" id="sm-test">Hacer la prueba</button>
      <div class="gap"></div><button class="btn ghost small" id="sm-skip">Empezar sin prueba</button></div>`;
    $('#sm-test').onclick = openTestSetup;
    $('#sm-skip').onclick = () => {
      const I = [2, 4.5, 7.5][S.level - 1];
      const n = { I, tests: [], sessions: 0, maxDur: 1800, nextAt: Date.now(), log: [{ at: Date.now(), I, why: 'inicio' }] };
      n.next = genSmart(n); setSmart(n); renderSmart(); toast('Listo: tu primera sesión está preparada');
    };
    return;
  }
  sm = smartRefresh(sm);
  const w = sm.next, due = Date.now() >= (sm.nextAt || 0);
  const t = sm.tests && sm.tests[0], old = t && Date.now() - t.at > 28 * DAY;
  const pct = Math.round(sm.I / 10 * 100);
  el.innerHTML = `<div class="now smart">
    <div class="wk">Entrenador inteligente · Sesión ${w.smartN}</div>
    <b class="name">${due ? 'Hoy toca entrenar' : 'Hoy toca descansar'}</b>
    <p class="sub">${due ? '' : `Próxima sesión: <b>${whenStr(sm.nextAt)}</b>. `}${esc(FOCUS[w.focus].n)} · ~${Math.round(total(buildTimeline(w)) / 60)} min · ${LEVELS[w.level - 1]} · ${w.sk.w}s / ${w.sk.r}s</p>
    <div class="gap"></div>
    <div class="pbar"><i style="width:${pct}%"></i></div>
    <div class="pmeta"><span>Intensidad ${sm.I.toFixed(1)} de 10</span><span>${sm.last ? 'Última: ' + FB[sm.last.fb].n.toLowerCase() : ''}</span></div>
    <div class="gap"></div>
    <div class="row"><button class="btn ${due ? '' : 'ghost'}" id="sm-go">${due ? 'Empezar' : 'Entrenar igual'}</button><button class="btn ghost" id="sm-see">Ver</button></div>
    ${t ? `<p class="note">Prueba del ${dateStr(t.at)}: ${t.sq} sentadillas · ${t.pu} flexiones${t.puKnee ? ' (rodillas)' : ''} · ${t.ab} abdominales${old ? ' · <b>conviene repetirla</b>' : ''}</p>` : '<p class="note">Sin prueba de capacidad: empiezo por tu nivel y me guío por tus respuestas.</p>'}
    <div class="row" style="margin-top:10px"><button class="btn ghost small" id="sm-retest">${t ? 'Repetir prueba' : 'Hacer la prueba'}</button><button class="btn ghost small" id="sm-set">Ajustes</button></div></div>`;
  $('#sm-go').onclick = () => startWorkout(clone(getSmart().next));
  $('#sm-see').onclick = () => openPreview(clone(getSmart().next), 'coach');
  $('#sm-retest').onclick = openTestSetup;
  $('#sm-set').onclick = openSmartSettings;
}
function openSmartSettings() {
  const sm = getSmart(); let cap = sm.maxDur || 1800, useDb = !!sm.db;
  const caps = DURS.filter(d => d >= 600);
  sheet(`<h3>Entrenador inteligente</h3><p class="sub">Intensidad actual ${sm.I.toFixed(1)} de 10 · ${sm.sessions || 0} sesiones hechas.</p>
    <h2>Duración máxima de cada sesión</h2>
    <div class="seg" id="ss-cap" style="grid-auto-flow:row;grid-template-columns:repeat(4,1fr)">${caps.map(d => `<button data-c="${d}" aria-pressed="${cap === d}">${d / 60} min</button>`).join('')}</div>
    <h2>Mancuernas</h2>
    <div class="seg" id="ss-db"><button data-v="0" aria-pressed="${!useDb}">Sin mancuernas</button><button data-v="1" aria-pressed="${useDb}">Con mancuernas</button></div>
    <p class="note">Con mancuernas, la mitad de los ejercicios de cada circuito se hacen con mancuerna (con un peso liviano: es por tiempo, no por repeticiones).${typeof getDumb === 'function' && getDumb() ? ' Si también usas el entrenador con mancuernas, conviene dejarlo sin: la fuerza ya la trabajas ahí.' : ''}</p>
    <h2>Ajuste manual</h2>
    <div class="row"><button class="btn ghost small" id="ss-down">− Más suave</button><button class="btn ghost small" id="ss-up">+ Más intenso</button></div>
    <p class="note">Las opciones «Sin saltos», «Calentamiento» y «Estiramientos» del coach también se aplican aquí.</p>
    <div style="height:20px"></div><button class="btn" id="ss-save">Guardar</button><div class="gap"></div>
    <button class="btn danger" id="ss-reset">Reiniciar el entrenador</button>`, () => {
    bindSeg('ss-cap', 'c', c => cap = +c);
    bindSeg('ss-db', 'v', v => useDb = v === '1');
    const nudge = d => { const s2 = getSmart(); s2.I = Math.max(1, Math.min(10, s2.I + d)); s2.log.push({ at: Date.now(), I: s2.I, why: 'manual' }); s2.next = genSmart(s2); setSmart(s2); toast(`Intensidad ${s2.I.toFixed(1)}`); };
    $('#ss-down').onclick = () => nudge(-0.5);
    $('#ss-up').onclick = () => nudge(0.5);
    $('#ss-save').onclick = () => { const s2 = getSmart(); s2.maxDur = cap; s2.db = useDb; s2.next = genSmart(s2); setSmart(s2); closeSheet(); renderSmart(); toast('Guardado'); };
    $('#ss-reset').onclick = async () => { if (!(await askApp('Reiniciar entrenador', 'Se borran la prueba de capacidad y la intensidad. Tu historial se mantiene.', 'Reiniciar', true))) return; PS.del('smart'); closeSheet(); renderSmart(); };
  });
}
function openTestSetup() {
  let knee = false;
  sheet(`<h3>Prueba de capacidad</h3>
    <p class="sub">Tres ejercicios de 1 minuto con 45 s de descanso. Haz todas las repeticiones que puedas con buena técnica y cuéntalas: en cada descanso te pido el número.</p>
    <h2>Flexiones</h2>
    <div class="seg" id="ts-pu"><button data-k="0" aria-pressed="true">Normales</button><button data-k="1" aria-pressed="false">Con rodillas</button></div>
    <p class="note">Si no llegas a 5 flexiones normales, elige con rodillas.</p>
    <div style="height:20px"></div><button class="btn" id="ts-go">Empezar la prueba</button>`, () => {
    bindSeg('ts-pu', 'k', k => knee = k === '1');
    $('#ts-go').onclick = () => {
      closeSheet();
      const tests = TESTS.map(t => ({ key: t.key, ex: t.key === 'pu' && knee ? 'knee_push_ups' : t.ex }));
      startWorkout({ kind: 'test', created: Date.now(), tests, puKnee: knee, results: {}, rounds: [], level: 1, warm: S.warmup ? shuffle(WARM).slice(0, 5) : [], cool: [] });
    };
  });
}
function saveTest(r) {
  let sm = getSmart();
  const sc = scoresOf(r), It = intensityOf(sc);
  const entry = { at: Date.now(), sq: r.sq, pu: r.pu, ab: r.ab, puKnee: !!r.puKnee };
  if (!sm || !sm.I) sm = { I: It, tests: [entry], sessions: 0, maxDur: 1800, log: [] };
  else { sm.I = sm.tests && sm.tests.length ? (sm.I + It) / 2 : It; sm.tests = [entry, ...(sm.tests || [])].slice(0, 20); sm.decay = 0; }
  sm.I = +sm.I.toFixed(2); sm.nextAt = Date.now();
  sm.log = [...(sm.log || []), { at: Date.now(), I: sm.I, why: 'prueba' }];
  sm.next = genSmart(sm); setSmart(sm);
  return sm;
}
// Respuesta tras entrenar: ajusta la intensidad y deja preparada la siguiente sesión (día por medio)
function applyFeedback(w, fb) {
  const sm = getSmart(); if (!sm || !sm.I) return null;
  const k = w.smart ? 1 : 0.5;
  sm.I = +Math.max(1, Math.min(10, sm.I + FB[fb].d * k)).toFixed(2);
  if (w.smart) { sm.sessions = (sm.sessions || 0) + 1; sm.nextAt = dayStart(Date.now()) + 2 * DAY; }
  sm.lastAt = Date.now(); sm.decay = 0; sm.last = { at: Date.now(), fb };
  sm.log = [...(sm.log || []), { at: Date.now(), I: sm.I, why: fb }].slice(-200);
  sm.next = genSmart(sm); setSmart(sm);
  return sm;
}

/* ---------- Línea de tiempo ---------- */
function buildTimeline(w) {
  let t = [];
  t.push({ k: 'prep', dur: 10, label: 'Prepárate' });
  if (w.warm && w.warm.length) {
    w.warm.forEach((id, i) => t.push({ k: 'work', ex: id, dur: 30, sec: 'Calentamiento', i, N: w.warm.length, soft: 1 }));
    t.push({ k: 'rest', dur: 15, label: 'Comienza el entrenamiento' });
  }
  if (w.kind === 'test') {
    w.tests.forEach((tt, i) => {
      t.push({ k: 'work', ex: tt.ex, dur: 60, sec: 'Prueba', i, N: w.tests.length, test: tt.key });
      if (i < w.tests.length - 1) t.push({ k: 'rest', dur: 45, label: 'Anota tus repeticiones', ask: tt.key });
    });
  } else if (w.kind === 'db') {
    // mancuernas: series seguidas de cada ejercicio con su descanso
    const N = w.items.length;
    w.items.forEach((it, i) => {
      for (let k = 0; k < it.sets; k++) {
        t.push({ k: 'work', ex: it.id, dur: 0, reps: it.reps, kg: it.kg, sec: 'Ronda', i, N, set: k, S: it.sets, metaTxt: `Ejercicio <b>${i + 1}/${N}</b> · Serie <b>${k + 1}/${it.sets}</b>` });
        if (k < it.sets - 1) t.push({ k: 'rest', dur: it.rest, label: 'Descanso' });
      }
      if (i < N - 1) t.push({ k: 'rest', dur: w.restEx || 90, label: 'Descanso' });
    });
  } else if (w.kind === 'plan') {
    const R = w.rounds.length;
    w.rounds.forEach((items, r) => {
      const exs = items.filter(it => it.id !== 'pause'); let n = 0;
      items.forEach((it, i) => {
        if (it.id === 'pause') { if (it.secs > 0) t.push({ k: i === items.length - 1 ? 'roundrest' : 'rest', dur: it.secs, label: i === items.length - 1 ? 'Descanso de ronda' : 'Descanso', r, R }); }
        else t.push({ k: 'work', ex: it.id, dur: it.reps ? 0 : it.secs, reps: it.reps, sec: 'Ronda', r, R, i: n++, N: exs.length });
      });
    });
  } else {
    const sk = w.sk;
    w.rounds.forEach((ids, r) => ids.forEach((id, i) => {
      t.push({ k: 'work', ex: id, dur: sk.w, sec: 'Ronda', r, R: w.rounds.length, i, N: ids.length });
      const lastInRound = i === ids.length - 1, lastRound = r === w.rounds.length - 1;
      if (!lastInRound) { if (sk.r > 0) t.push({ k: 'rest', dur: sk.r, label: 'Descanso', r, R: w.rounds.length }); }
      else if (!lastRound && sk.rr > 0) t.push({ k: 'roundrest', dur: sk.rr, label: 'Descanso de ronda', r, R: w.rounds.length });
    }));
  }
  if (w.cool && w.cool.length) {
    t.push({ k: 'rest', dur: 10, label: 'Vamos a estirar' });
    w.cool.forEach((id, i) => t.push({ k: 'work', ex: id, dur: 30, sec: 'Estiramientos', i, N: w.cool.length, soft: 1 }));
  }
  const link = () => { let next = null; for (let i = t.length - 1; i >= 0; i--) { t[i].next = next; if (t[i].k === 'work') next = t[i].ex; } };
  link();
  // quita descansos sin nada detrás y descansos duplicados seguidos
  t = t.filter((s, i) => s.k === 'work' || s.k === 'prep' || (s.next && !(t[i + 1] && t[i + 1].k !== 'work')));
  link();
  return t;
}
const stepDur = s => s.reps ? s.reps * REP_SEC : s.dur;
const total = tl => tl.reduce((a, s) => a + stepDur(s), 0);

/* ---------- Vista previa ---------- */
const lvBars = l => `<span class="lv">${[1, 2, 3].map(i => `<i class="${i <= l ? 'on' : ''}"></i>`).join('')}</span>`;
const partTags = e => [...e.p].map(k => PARTS[k]).slice(0, 3).join(' · ');
const SWAP_ICON = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h13l-4-4M20 15H7l4 4"/></svg>';
function exRow(id, i, where, tgt, lvl) {
  const e = ex(id);
  const meta = e.t === 'x' ? `${lvBars(e.lv)}${partTags(e)}${e.j ? ' · salto' : ''}${e.s ? ' · por lado' : ''}` : (e.s ? 'por lado' : (e.t === 's' ? 'estiramiento' : 'movilidad'));
  const swap = where ? `<button class="icon-btn" data-swap="${where}" aria-label="Cambiar por otro ejercicio">${SWAP_ICON}</button>` : '';
  // versión más fácil / más difícil del mismo ejercicio (se aplica en todo el entrenamiento)
  let lv = '';
  if (lvl) {
    const ez = easierOf(id), hd = harderOf(id, W && W.noJump);
    if (ez || hd) lv = `<span class="lvsw"><button data-lvsw="-1" data-id="${esc(id)}" ${ez ? '' : 'disabled'} aria-label="${ez ? 'Más fácil: ' + esc(ex(ez).n) : 'No hay versión más fácil'}">${LV_DOWN}</button><button data-lvsw="1" data-id="${esc(id)}" ${hd ? '' : 'disabled'} aria-label="${hd ? 'Más difícil: ' + esc(ex(hd).n) : 'No hay versión más difícil'}">${LV_UP}</button></span>`;
  }
  return `<div class="ex" data-id="${esc(id)}"><span class="n">${i + 1}</span><div class="t" data-toggle><b>${esc(e.n)}</b><small>${meta}</small><div class="cue">${esc(e.d)}</div></div>${tgt ? `<span class="tgt">${tgt}</span>` : ''}${lv}${swap}</div>`;
}
const LV_DOWN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
const LV_UP = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>';
// cambia un ejercicio por su versión más fácil o más difícil en todas las rondas.
// En los planes por repeticiones ajusta la cantidad (más fácil: +20 %, más difícil: −20 %).
function previewLevelSwap(id, dir) {
  const to = dir < 0 ? easierOf(id) : harderOf(id, W.noJump); if (!to) return;
  const k = dir < 0 ? 1.2 : 0.8;
  if (W.kind === 'plan') W.rounds = W.rounds.map(r => r.map(it => it.id === id ? { ...it, id: to, ...(it.reps ? { reps: Math.max(1, Math.round(it.reps * k)) } : {}) } : it));
  else W.rounds = W.rounds.map(ids => ids.map(x => x === id ? to : x));
  W.edited = true;
  renderPreview();
  toast(`${dir < 0 ? 'Más fácil' : 'Más difícil'}: ${ex(to).n}`);
}
// dificultad media de los ejercicios (1 a 3) para mostrar en el resumen
function avgLevel(w) {
  const ids = w.kind === 'plan' ? w.rounds.flat().filter(it => it.id !== 'pause').map(it => it.id) : w.rounds.flat();
  const lv = ids.map(id => ex(id).lv || 1); return lv.length ? lv.reduce((a, b) => a + b, 0) / lv.length : 1;
}
const tgtOf = it => it.reps ? `×${it.reps}` : `${it.secs}s`;
function renderPreview() {
  const w = W, tl = buildTimeline(w), isPlan = w.kind === 'plan';
  $('#pv-title').textContent = title(w);
  $('#pv-plan-opts').classList.toggle('hidden', !isPlan);
  $('#pv-coach-btns').classList.toggle('hidden', isPlan);
  let h = '';
  if (w.warm && w.warm.length) h += `<div class="block"><div class="block-h"><b>Calentamiento</b><span>${w.warm.length} × 30s</span></div>${w.warm.map((id, i) => exRow(id, i, '')).join('')}</div>`;
  if (isPlan) {
    $('#pv-sub').textContent = w.sub + ` · dificultad media ${avgLevel(w).toFixed(1).replace('.', ',')} de 3${w.edited ? ' (ajustada)' : ''}`;
    const nEx = w.rounds.reduce((a, r) => a + r.filter(x => x.id !== 'pause').length, 0);
    $('#pv-stats').innerHTML = `<div class="stat"><b>~${Math.round(total(tl) / 60)}</b><span>minutos</span></div><div class="stat"><b>${w.rounds.length}</b><span>rondas</span></div><div class="stat"><b>${nEx}</b><span>series</span></div>`;
    // agrupa rondas idénticas consecutivas
    const groups = [];
    w.rounds.forEach((r, i) => { const key = JSON.stringify(r); const g = groups[groups.length - 1]; if (g && g.key === key) g.to = i; else groups.push({ key, from: i, to: i, r }); });
    groups.forEach(g => {
      const n = g.to - g.from + 1; let k = 0;
      h += `<div class="block"><div class="block-h"><b>${n > 1 ? `Rondas ${g.from + 1}–${g.to + 1}` : `Ronda ${g.from + 1}`}</b><span>${n > 1 ? `repetir × ${n}` : ''}</span></div>` +
        g.r.map(it => it.id === 'pause' ? `<div class="ex pause">Descanso ${it.secs} s</div>` : exRow(it.id, k++, '', tgtOf(it), true)).join('') + '</div>';
    });
  } else {
    const sk = w.sk;
    $('#pv-sub').textContent = `${w.smart ? 'Entrenador inteligente · intensidad ' + w.I + ' · ' : ''}${LEVELS[w.level - 1]} · ${sk.w}s trabajo / ${sk.r}s descanso${w.noJump ? ' · sin saltos' : ''} · dificultad media ${avgLevel(w).toFixed(1).replace('.', ',')} de 3${w.edited ? ' (ajustada)' : ''}`;
    $('#pv-stats').innerHTML = `<div class="stat"><b>${fmt(total(tl))}</b><span>minutos</span></div><div class="stat"><b>${w.rounds.length}</b><span>rondas</span></div><div class="stat"><b>${w.rounds.flat().length}</b><span>intervalos</span></div>`;
    if (!w.vary) h += `<div class="block"><div class="block-h"><b>Circuito × ${w.rounds.length}</b><span>${sk.w}s / ${sk.r}s · ${sk.rr}s entre rondas</span></div>${w.rounds[0].map((id, i) => exRow(id, i, 'all-' + i, '', true)).join('')}</div>`;
    else w.rounds.forEach((ids, r) => { h += `<div class="block"><div class="block-h"><b>Ronda ${r + 1}</b><span>${sk.w}s / ${sk.r}s</span></div>${ids.map((id, i) => exRow(id, i, r + '-' + i, '', true)).join('')}</div>`; });
  }
  if (w.cool && w.cool.length) h += `<div class="block"><div class="block-h"><b>Estiramientos</b><span>${w.cool.length} × 30s</span></div>${w.cool.map((id, i) => exRow(id, i, '')).join('')}</div>`;
  $('#pv-list').innerHTML = h;
}
$('#pv-list').onclick = e => {
  const lvb = e.target.closest('[data-lvsw]');
  if (lvb) { if (!lvb.disabled) previewLevelSwap(lvb.dataset.id, +lvb.dataset.lvsw); return; }
  const sw = e.target.closest('[data-swap]');
  if (sw) {
    const [r, i] = sw.dataset.swap.split('-'); const idx = +i;
    const o = { parts: activeParts(W.parts), level: W.level, noJump: W.noJump };
    const cur = ex(r === 'all' ? W.rounds[0][idx] : W.rounds[+r][idx]);
    const inUse = new Set(r === 'all' ? W.rounds[0] : W.rounds[+r]);
    let c = poolFor(o).filter(x => !inUse.has(x.id) && [...x.p].some(p => cur.p.includes(p)));
    if (!c.length) c = poolFor(o).filter(x => !inUse.has(x.id));
    if (!c.length) { toast('No hay más ejercicios con estos filtros'); return; }
    const n = rnd(c).id;
    if (r === 'all') W.rounds = W.rounds.map(ids => { const a = [...ids]; a[idx] = n; return a; });
    else { W.rounds[+r] = [...W.rounds[+r]]; W.rounds[+r][idx] = n; }
    renderPreview(); return;
  }
  const t = e.target.closest('[data-toggle]');
  if (t) {
    const row = t.parentElement; row.classList.toggle('open');
    const cue = row.querySelector('.cue');
    if (row.classList.contains('open') && !cue.querySelector('.mini')) { const d = document.createElement('div'); d.className = 'mini'; cue.appendChild(d); Anim.mount(d, row.dataset.id); }
  }
};

/* ---------- Navegación ---------- */
let previewFrom = 'coach';
// vuelve a dibujar la pestaña visible (por ejemplo el calendario después de terminar un entrenamiento)
function refreshView() {
  try {
    const v = currentView;
    if (v === 'cal') renderCal(); else if (v === 'retos' && typeof renderRetos === 'function') renderRetos();
    else if (v === 'plans') renderPlans(); else if (v === 'hist') renderHist(); else if (v === 'coach') renderSmart();
  } catch (e) { console.error(e); }
}
function show(view) {
  currentView = view;
  if (view === 'favs') view = 'hist';   // los guardados ahora están dentro del historial
  currentView = view;
  ['coach', 'preview', 'plans', 'retos', 'cal', 'hist', 'lib'].forEach(v => $('#v-' + v).classList.toggle('hidden', v !== view));
  const tab = view === 'preview' ? previewFrom : view === 'lib' ? 'coach' : view;
  document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-current', b.dataset.tab === tab));
  if (view === 'coach') renderSmart();
  if (view === 'plans') renderPlans();
  if (view === 'retos' && typeof renderRetos === 'function') renderRetos();
  if (view === 'hist') renderHist();
  if (view === 'lib') renderLib();
  if (view === 'cal') renderCal();
  window.scrollTo(0, 0);
}
function openPreview(w, from) { W = w; previewFrom = from; renderPreview(); show('preview'); }
$('#tabs').onclick = e => { const b = e.target.closest('[data-tab]'); if (!b) return; show(b.dataset.tab); };
$('#gen').onclick = () => {
  if (!poolFor({ parts: activeParts(), level: S.level, noJump: S.noJump }).length) { toast('No hay ejercicios con esa combinación'); return; }
  openPreview(generate(), 'coach');
};
$('#regen').onclick = () => {
  if (W && W.smart) { const sm = getSmart(); sm.next = genSmart(sm); setSmart(sm); W = clone(sm.next); } else W = generate();
  renderPreview(); toast('Nuevo entrenamiento');
};
$('#back').onclick = () => { W = null; show(previewFrom); };
$('#fav').onclick = () => saveFav(W);
$('#start').onclick = () => {
  const w = clone(W);
  if (w.kind === 'plan') { w.warm = S.planWarm ? shuffle(WARM).slice(0, 5) : []; w.cool = S.planCool ? shuffle(COOL).slice(0, 5) : []; }
  if (w.smart) { const sm = getSmart(); if (sm) { sm.next = clone(w); setSmart(sm); } } // conserva los cambios de ejercicio
  startWorkout(w);
};

/* =========================================================
   Planes
   ========================================================= */
let viewWeek = null;
const getPlan = () => PS.get('plan', null);
const setPlan = p => p ? PS.set('plan', p) : PS.del('plan');

function planWeekInfo(plan, week) {
  const days = planWeek(plan.file, plan.level, week);
  const kept = keptDays(days, plan.days);
  return { days, kept };
}
function weekDone(plan, week) {
  const { kept } = planWeekInfo(plan, week);
  return kept.length > 0 && kept.every(i => plan.done[`${week}-${i}`]);
}
function planProgress(plan) {
  const fam = FAM[plan.fam];
  const totalDays = fam.weeks * plan.days;
  let done = 0;
  for (let w = 1; w <= fam.weeks; w++) { const { kept } = planWeekInfo(plan, w); done += kept.filter(i => plan.done[`${w}-${i}`]).length; }
  return { done, total: totalDays };
}

function renderPlans() {
  const plan = getPlan();
  const el = $('#v-plans');
  let h = '';
  if (plan) {
    const fam = FAM[plan.fam];
    if (viewWeek == null || viewWeek > fam.weeks) viewWeek = plan.week;
    const pr = planProgress(plan);
    const { days, kept } = planWeekInfo(plan, viewWeek);
    const nextIdx = viewWeek === plan.week ? kept.find(i => !plan.done[`${viewWeek}-${i}`]) : undefined;
    h += `<div class="cols"><div class="col"><p class="hero">Tu <em>plan</em></p>
      <div class="now">
        <div class="wk">Semana ${plan.week} de ${fam.weeks} · Nivel ${PLAN_LEVELS[plan.level]}</div>
        <b class="name">${esc(fam.n)}</b>
        <div class="pbar"><i style="width:${Math.round(pr.done / pr.total * 100)}%"></i></div>
        <div class="pmeta"><span>${pr.done} de ${pr.total} entrenamientos</span><span>${plan.days} días/semana · ${VARIANTS[plan.variant]}</span></div>
      </div>`;
    if (weekDone(plan, plan.week) && viewWeek === plan.week) {
      h += `<div class="block review"><div class="block-h"><b>Semana ${plan.week} completada</b><span>🎉</span></div>
        <p>¿Cómo te fue? Ajusto el nivel de la próxima semana según tu respuesta.</p>
        <div class="opts"><button class="btn ghost small" data-rev="-1">Difícil</button><button class="btn small" data-rev="0">Bien</button><button class="btn ghost small" data-rev="1">Fácil</button></div></div>`;
    }
    h += `<h2>Semanas</h2><div class="weeks" id="weeks">${Array.from({ length: fam.weeks }, (_, i) => i + 1).map(w =>
      `<button data-w="${w}" class="${weekDone(plan, w) ? 'is-done' : ''} ${w === plan.week ? 'cur' : ''}" aria-pressed="${w === viewWeek}">${w}</button>`).join('')}</div>
      </div><div class="col"><h2>Semana ${viewWeek}${viewWeek === plan.week ? ' · actual' : ''}</h2>
      <div class="block">${days.map((d, i) => {
        const on = kept.includes(i), dn = plan.done[`${viewWeek}-${i}`], est = dayEstimate(d);
        const cls = dn ? 'is-done' : (i === nextIdx ? 'next' : (on ? '' : 'off'));
        const label = dn ? `Hecho · ${dateStr(dn.at)}` : (on ? `~${Math.round(est.secs / 60)} min · ${d.rounds.length} rondas · ${est.n} series` : `Opcional · fuera de tus ${plan.days} días (puedes hacerlo igual)`);
        return `<button class="day ${cls}" data-day="${i}"><span class="dn">${dn ? '✓' : kept.indexOf(i) + 1 || '–'}</span><span class="t"><b>${i === nextIdx ? 'Siguiente: ' : ''}${on ? 'Entrenamiento ' + (kept.indexOf(i) + 1) : 'Entrenamiento extra'}</b><small>${label}</small></span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg></button>`;
      }).join('')}</div>
      <div class="row"><button class="btn ghost small" id="pl-settings">Ajustes del plan</button><button class="btn ghost small" id="pl-other">Ver otros planes</button></div></div></div>`;
  } else {
    h += `<p class="hero">Planes</p><p class="sub">Programas de 3 a 12 semanas. El progreso se guarda en tu perfil automáticamente.</p><div style="height:16px"></div>`;
  }
  if (!plan || showCatalog) h += `<h2 id="cat">${plan ? 'Otros planes' : 'Elige un plan'}</h2><div class="plans-cat">` + catalogHTML(plan) + '</div>';
  const doneList = PS.get('plansDone', []);
  if (doneList.length) h += `<h2>Planes completados</h2><div class="block">${doneList.map(d => `<div class="hist"><div class="t"><b>${esc(FAM[d.fam]?.n || d.fam)}</b><small>${dateStr(d.startedAt)} → ${dateStr(d.finishedAt)} · ${d.sessions} entrenamientos</small></div></div>`).join('')}</div>`;
  el.innerHTML = h;

  el.querySelectorAll('[data-fam]').forEach(b => b.onclick = () => openPlanSetup(b.dataset.fam));
  if (!plan) return;
  bindSeg('weeks', 'w', w => { viewWeek = +w; renderPlans(); });
  el.querySelectorAll('[data-day]').forEach(b => b.onclick = () => openPlanDay(viewWeek, +b.dataset.day));
  el.querySelectorAll('[data-rev]').forEach(b => b.onclick = () => reviewWeek(+b.dataset.rev));
  $('#pl-settings').onclick = openPlanSettings;
  $('#pl-other').onclick = () => { showCatalog = !showCatalog; renderPlans(); if (showCatalog) $('#cat').scrollIntoView({ behavior: 'smooth' }); };
  const cur = el.querySelector('.weeks [aria-pressed=true]'); if (cur) cur.scrollIntoView({ inline: 'center', block: 'nearest' });
}
let showCatalog = false;
function catalogHTML(plan) {
  return PLAN_FAMILIES.filter(f => !plan || f.key !== plan.fam).map(f => {
    const r = dayRange(variantFile(f, PROFILE.variant));
    return `<button class="plan-card" data-fam="${f.key}"><span class="wk">${f.weeks} semanas</span><b>${esc(f.n)}</b><p>${esc(f.d)}</p>
      <div class="tags"><span class="tag">${r.min === r.max ? r.max : r.min + '–' + r.max} días/semana</span><span class="tag">${f.reps ? 'Repeticiones y tiempo' : 'Todo por tiempo'}</span>${f.burpees ? '' : '<span class="tag">Sin burpees</span>'}${f.v.x && !f.v.f ? '<span class="tag">Mixto</span>' : ''}</div></button>`;
  }).join('');
}

function openPlanSetup(key) {
  const f = FAM[key];
  const vs = Object.keys(f.v);
  let variant = f.v[PROFILE.variant] ? PROFILE.variant : vs[0];
  let level = 1;
  const range = () => dayRange(variantFile(f, variant));
  let days = range().max;
  const render = () => {
    const r = range(); days = Math.min(Math.max(days, r.min), r.max);
    sheet(`
      <h3>${esc(f.n)}</h3><p class="sub">${esc(f.d)}</p>
      <div class="tags"><span class="tag">${f.weeks} semanas</span><span class="tag">${f.reps ? 'Repeticiones y tiempo' : 'Todo por tiempo'}</span></div>
      ${vs.length > 1 ? `<h2>Versión</h2>${variantSeg('ps-var', variant, vs)}` : ''}
      <h2>¿Cuántas flexiones seguidas puedes hacer?</h2>
      <div class="seg" id="ps-q">${['0–4', '5–14', '15–29', '30+'].map((t, i) => `<button data-q="${i}" aria-pressed="${level === i}">${t}</button>`).join('')}</div>
      <h2>Nivel de inicio</h2>
      <div class="seg" id="ps-lv">${PLAN_LEVELS.map((t, i) => `<button data-l="${i}" aria-pressed="${level === i}">${t}</button>`).join('')}</div>
      <p class="note">El nivel se ajusta al final de cada semana según cómo te haya ido.</p>
      ${r.max > r.min ? `<h2>Días por semana</h2><div class="seg" id="ps-days">${Array.from({ length: r.max - r.min + 1 }, (_, i) => r.min + i).map(d => `<button data-d="${d}" aria-pressed="${days === d}">${d}</button>`).join('')}</div>` : `<p class="note">${r.max} días por semana.</p>`}
      <div style="height:20px"></div>
      <button class="btn" id="ps-go">Empezar plan</button>`, () => {
      bindSeg('ps-var', 'v', v => { variant = v; render(); });
      bindSeg('ps-q', 'q', q => { level = +q; render(); });
      bindSeg('ps-lv', 'l', l => { level = +l; render(); });
      bindSeg('ps-days', 'd', d => { days = +d; });
      $('#ps-go').onclick = async () => {
        const cur = getPlan();
        if (cur && !(await askApp('Cambiar de plan', `Ya sigues «${FAM[cur.fam].n}». Si cambias, se perderá su progreso.`, 'Cambiar de plan', true))) return;
        setPlan({ fam: key, file: variantFile(f, variant), variant, level, days, week: 1, startedAt: Date.now(), done: {}, log: [{ at: Date.now(), week: 1, level }] });
        viewWeek = 1; showCatalog = false; closeSheet(); show('plans'); toast('Plan iniciado. ¡A por la semana 1!');
      };
    });
  };
  render();
}

function openPlanSettings() {
  const plan = getPlan(), fam = FAM[plan.fam], r = dayRange(plan.file);
  let level = plan.level, days = plan.days;
  sheet(`
    <h3>Ajustes del plan</h3><p class="sub">${esc(fam.n)} · semana ${plan.week} de ${fam.weeks}</p>
    <h2>Nivel</h2><div class="seg" id="st-lv">${PLAN_LEVELS.map((t, i) => `<button data-l="${i}" aria-pressed="${level === i}">${t}</button>`).join('')}</div>
    ${r.max > r.min ? `<h2>Días por semana</h2><div class="seg" id="st-days">${Array.from({ length: r.max - r.min + 1 }, (_, i) => r.min + i).map(d => `<button data-d="${d}" aria-pressed="${days === d}">${d}</button>`).join('')}</div>` : ''}
    <h2>Semana actual</h2>
    <div class="row"><button class="btn ghost small" id="st-prev">← Anterior</button><button class="btn ghost small" id="st-next">Siguiente →</button></div>
    <div style="height:20px"></div>
    <button class="btn" id="st-save">Guardar</button><div class="gap"></div>
    <button class="btn danger" id="st-quit">Abandonar el plan</button>`, () => {
    bindSeg('st-lv', 'l', l => level = +l);
    bindSeg('st-days', 'd', d => days = +d);
    const move = d => { const p = getPlan(); p.week = Math.min(fam.weeks, Math.max(1, p.week + d)); setPlan(p); viewWeek = p.week; closeSheet(); renderPlans(); toast('Semana ' + p.week); };
    $('#st-prev').onclick = () => move(-1);
    $('#st-next').onclick = () => move(1);
    $('#st-save').onclick = () => {
      const p = getPlan();
      if (p.level !== level) p.log.push({ at: Date.now(), week: p.week, level });
      if (p.weekdays && p.weekdays.length !== days) delete p.weekdays; // vuelve al reparto por defecto
      p.level = level; p.days = days; setPlan(p); closeSheet(); renderPlans(); toast('Plan actualizado');
    };
    $('#st-quit').onclick = async () => {
      if (!(await askApp('Abandonar el plan', 'Se borrará el progreso del plan. Tu historial de entrenamientos se mantiene.', 'Abandonar', true))) return;
      setPlan(null); viewWeek = null; closeSheet(); renderPlans();
    };
  });
}

function reviewWeek(delta) {
  const p = getPlan(), fam = FAM[p.fam];
  const newLevel = Math.max(0, Math.min(3, p.level + delta));
  if (p.week >= fam.weeks) {
    const pd = PS.get('plansDone', []);
    pd.unshift({ fam: p.fam, file: p.file, startedAt: p.startedAt, finishedAt: Date.now(), sessions: Object.keys(p.done).length, level: p.level });
    PS.set('plansDone', pd); setPlan(null); viewWeek = null; renderPlans(); checkAwards(true);
    toast('¡Plan completado! Enhorabuena 🎉'); return;
  }
  if (newLevel !== p.level) p.log.push({ at: Date.now(), week: p.week + 1, level: newLevel });
  p.level = newLevel; p.week++; setPlan(p); viewWeek = p.week; renderPlans(); checkAwards(true);
  toast(delta > 0 ? `Subimos a nivel ${PLAN_LEVELS[newLevel]}` : delta < 0 ? `Bajamos a nivel ${PLAN_LEVELS[newLevel]}` : `Semana ${p.week}: mismo nivel`);
  window.scrollTo(0, 0);
}

function planDayWorkout(week, dayIdx) {
  const plan = getPlan(), fam = FAM[plan.fam];
  const { days, kept } = planWeekInfo(plan, week);
  const d = days[dayIdx]; if (!d) return null;
  const nth = kept.indexOf(dayIdx);
  return {
    kind: 'plan', fam: plan.fam, file: plan.file, level: plan.level, week, day: dayIdx,
    title: `Semana ${week} · ${nth >= 0 ? 'Día ' + (nth + 1) : 'Extra'}`,
    sub: `${fam.n} · Nivel ${PLAN_LEVELS[plan.level]}${plan.done[`${week}-${dayIdx}`] ? ' · ya hecho' : ''}`,
    rounds: d.rounds, warm: [], cool: []
  };
}
function openPlanDay(week, dayIdx) {
  const w = planDayWorkout(week, dayIdx); if (!w) return;
  openPreview(w, 'plans');
  renderSetup();
}
function markPlanDay(w, secs, skipped) {
  const p = getPlan();
  if (!p || p.file !== w.file) return false;
  p.done[`${w.week}-${w.day}`] = { at: Date.now(), secs, level: w.level, ...(skipped ? { skipped: true } : {}) };
  setPlan(p); return true;
}

/* ---------- Biblioteca de ejercicios ---------- */
const norm = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
let libObs = null;
function renderLib() {
  const q = norm($('#lib-q').value.trim());
  const ids = Object.keys(CATALOG).filter(id => id !== 'pause').sort((a, b) => CATALOG[a].n.localeCompare(CATALOG[b].n, 'es'));
  const list = q ? ids.filter(id => norm(CATALOG[id].n + ' ' + id).includes(q)) : ids;
  $('#lib-sub').innerHTML = `${ids.length} ejercicios.`;
  $('#lib-list').innerHTML = list.map(id => {
    const e = ex(id), names = Anim.fileNames(id, e.n);
    return `<button class="lib-card" data-id="${esc(id)}"><div class="mini"></div><b>${esc(e.n)}</b>
      <small>${e.t === 'x' ? partTags(e) : e.t === 's' ? 'Estiramiento' : 'Movilidad'}${UNI.has(id) ? ' · por lado' : ''}</small>
      <small class="fn"><code>${esc(names[0])}</code></small></button>`;
  }).join('') || '<div class="empty" style="grid-column:1/-1">Ningún ejercicio coincide.</div>';
  if (libObs) libObs.disconnect();
  libObs = 'IntersectionObserver' in window ? new IntersectionObserver(ents => ents.forEach(en => {
    if (!en.isIntersecting) return;
    const card = en.target; libObs.unobserve(card); mountLibCard(card);
  }), { rootMargin: '200px' }) : null;
  document.querySelectorAll('#lib-list .lib-card').forEach(c => libObs ? libObs.observe(c) : mountLibCard(c));
}
function mountLibCard(card) {
  const id = card.dataset.id, mini = card.querySelector('.mini');
  Anim.mount(mini, id);
  Anim.findMedia(id, ex(id).n).then(url => { if (url) card.querySelector('.fn').innerHTML = `<span class="own">✓ Usando tu archivo</span> ${esc(url)}`; });
}
$('#lib-q').oninput = () => renderLib();
$('#lib-list').onclick = e => { const c = e.target.closest('.lib-card'); if (c) toast(ex(c.dataset.id).d); };
$('#open-lib').onclick = () => show('lib');
$('#lib-back').onclick = () => show('coach');

/* ---------- Favoritos & historial ---------- */
function saveFav(w) { const f = PS.get('favs', []); f.unshift({ ...clone(w), savedAt: Date.now() }); PS.set('favs', f.slice(0, 50)); toast('Guardado'); }
const summaryLine = w => `${fmt(total(buildTimeline(w)))} min · ${LEVELS[w.level - 1]} · ${w.rounds.length} rondas`;
let favsOpen = false;
function renderFavs() {
  const f = PS.get('favs', []), el = $('#hist-favs'); if (!el) return;
  if (!f.length) { el.innerHTML = `<h2>Guardados</h2><p class="note">Aún no guardaste ninguno. Genera uno en el coach y toca ☆ Guardar.</p>`; return; }
  const list = favsOpen ? f : f.slice(0, 3);
  el.innerHTML = `<h2>Guardados</h2><div class="block">${list.map((w, i) => `<div class="hist"><div class="t"><b>${esc(title(w))}</b><small>${summaryLine(w)}</small></div>
    <button class="icon-btn" data-open="${i}" aria-label="Abrir"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l12-7z"/></svg></button>
    <button class="icon-btn" data-del="${i}" aria-label="Borrar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/></svg></button></div>`).join('')}</div>
    ${f.length > 3 ? `<button class="btn ghost small" id="fav-more">${favsOpen ? 'Ver menos' : 'Ver los ' + f.length}</button>` : ''}`;
}
$('#hist-favs').onclick = async e => {
  if (e.target.closest('#fav-more')) { favsOpen = !favsOpen; renderFavs(); return; }
  const f = PS.get('favs', []); const o = e.target.closest('[data-open]'), d = e.target.closest('[data-del]');
  if (o) openPreview(clone(f[+o.dataset.open]), 'hist');
  if (d) { if (!(await askApp('Borrar guardado', title(f[+d.dataset.del]), 'Borrar', true))) return; f.splice(+d.dataset.del, 1); PS.set('favs', f); renderFavs(); }
};
function renderHist() {
  const h = PS.get('history', []), wk = Date.now() - 7 * 864e5, thisWeek = h.filter(x => x.at > wk);
  $('#hist-sub').textContent = h.length ? `${h.length} ${h.length === 1 ? 'sesión' : 'sesiones'} de ${PROFILE.name}` : 'Tus sesiones aparecerán aquí.';
  $('#hist-stats').innerHTML = h.length ? `<div class="stat"><b>${thisWeek.length}</b><span>esta semana</span></div><div class="stat"><b>${Math.round(thisWeek.reduce((a, x) => a + x.secs, 0) / 60)}</b><span>min semana</span></div><div class="stat"><b>${Math.round(h.reduce((a, x) => a + x.secs, 0) / 60)}</b><span>min totales</span></div>` : '';
  $('#hist-awards').innerHTML = awardsHTML();
  renderFavs();
  $('#hist-list').innerHTML = h.length ? `<h2>Sesiones</h2><div class="block">${h.map((x, i) => `<div class="hist"><div class="t" data-det="${i}"><b>${esc(title(x.w))}</b><small>${x.w.kind === 'plan' ? esc(FAM[x.w.fam]?.n || '') + ' · ' : ''}${dateStr(x.at)} · ${fmt(x.secs)} min${x.full ? '' : ' · incompleto'}${x.fb ? ' · ' + FB[x.fb].n.toLowerCase() : ''}${x.w.kind === 'test' && x.w.results && x.w.results.sq != null ? ` · ${x.w.results.sq}/${x.w.results.pu}/${x.w.results.ab}` : ''}${x.hr ? ` · <span class="hrs">♥ ${x.hr.avg}</span>` : ''}</small></div>
    <button class="icon-btn" data-rep="${i}" aria-label="Repetir"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4"/></svg></button></div>`).join('')}</div>`
    : `<div class="empty">Completa tu primer entrenamiento.</div>`;
}
$('#hist-awards').onclick = e => { if (e.target.closest('#aw-all')) { awardsAll = !awardsAll; $('#hist-awards').innerHTML = awardsHTML(); return; } const a = e.target.closest('[data-aw]'); if (a) openAward(a.dataset.aw); };
$('#hist-list').onclick = e => {
  const dt = e.target.closest('[data-det]'); if (dt) { openHistDetail(+dt.dataset.det); return; }
  const r = e.target.closest('[data-rep]'); if (!r) return;
  const w = clone(PS.get('history', [])[+r.dataset.rep].w);
  if (w.kind === 'test') { openTestSetup(); return; }
  if (w.kind === 'reto') { openReto(w.reto); return; }
  if (w.kind === 'db') { openDbStart(); return; }
  if (w.kind === 'plan') { w.warm = []; w.cool = []; }
  openPreview(w, 'hist');
};

/* ---------- Sesión a medias ---------- */
function renderResume() {
  const s = PS.get('session', null);
  const el = $('#resume');
  if (!s || Date.now() - s.savedAt > 48 * 3600e3) { if (s) PS.del('session'); el.innerHTML = ''; return; }
  const tl = buildTimeline(s.w);
  el.innerHTML = `<div class="banner"><div class="t"><b>Entrenamiento a medias</b><small>${esc(title(s.w))} · paso ${s.i + 1} de ${tl.length} · ${fmt(s.activeMs / 1000)} hechos</small></div>
    <button class="icon-btn" id="rs-x" aria-label="Descartar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <button class="btn" id="rs-go">Reanudar</button></div>`;
  $('#rs-go').onclick = () => startWorkout(s.w, s);
  $('#rs-x').onclick = async () => { if (await askApp('Descartar entrenamiento', 'Se descartará el entrenamiento a medias.', 'Descartar', true)) { PS.del('session'); renderResume(); } };
}

/* =========================================================
   Audio, voz y pantalla
   ========================================================= */
let AC = null;
function beep(f = 880, ms = 140, vol = .25) {
  if (S.sound === 'silencio') return;
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state !== 'running') AC.resume().catch(() => {});
    const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(vol, AC.currentTime); g.gain.exponentialRampToValueAtTime(.001, AC.currentTime + ms / 1000);
    o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + ms / 1000 + .02);
  } catch (e) {}
}
let VOICE = null;
function pickVoice() { try { const v = speechSynthesis.getVoices(); VOICE = v.find(x => /^es[-_]ES/i.test(x.lang)) || v.find(x => /^es/i.test(x.lang)) || null; } catch (e) {} }
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function say(t) {
  if (S.sound !== 'voz' || !('speechSynthesis' in window)) return;
  t = t.replace(/ · /g, ', ');
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = VOICE ? VOICE.lang : 'es-ES'; if (VOICE) u.voice = VOICE; u.rate = 1.05; speechSynthesis.speak(u); } catch (e) {}
}
// Frases del entrenador
const NUM_WORDS = ['cero', 'uno', 'dos', 'tres'];
function nextWorkStep(i) { for (let j = i + 1; j < P.tl.length; j++) if (P.tl[j].k === 'work') return P.tl[j]; return null; }
function exPhrase(st) {
  if (!st) return '';
  const e = ex(st.ex);
  const what = st.reps ? `${st.reps} repeticiones` : `${st.dur} segundos${e.s ? ', por lado' : ''}`;
  return `${e.n}, ${what}`;
}
function announce(i, reason) {
  const s = P.tl[i], prev = P.tl[i - 1];
  // al acabar un tramo por tiempo o al tocar ✓: "¡Terminaste!" tras un ejercicio, "¡Comienza!" tras un descanso
  let pre = '';
  if (reason === 'auto' || reason === 'done') pre = prev && prev.k === 'work' ? '¡Terminaste! ' : '¡Comienza! ';
  if (s.k === 'work') {
    const e = ex(s.ex);
    const round = s.sec === 'Ronda' && s.i === 0 && s.R > 1 ? `Ronda ${s.r + 1} de ${s.R}. ` : '';
    const sec = s.sec !== 'Ronda' && s.i === 0 ? s.sec + '. ' : '';
    if (s.test) { say(pre + `Prueba: ${e.n}. Haz todas las que puedas en un minuto y cuéntalas.`); return; }
    say(pre + (pre && prev && prev.k === 'work' ? 'Ahora: ' : '') + sec + round + exPhrase(s) + (e.s && !s.reps ? '. Empieza por el lado derecho' : ''));
  } else if (s.k === 'prep') {
    say('Prepárate. Primero: ' + exPhrase(nextWorkStep(i)));
  } else {
    const nx = nextWorkStep(i);
    if (s.ask) { say(pre + '¿Cuántas hiciste? Anótalo. Siguiente: ' + ex(nx.ex).n); return; }
    const what = (s.k === 'roundrest' ? 'Ronda completada. ' : '') + (s.label === 'Descanso' || s.k === 'roundrest' ? `Descanso de ${s.dur} segundos.` : s.label + '.');
    say(pre + what + (nx && s.dur >= 10 ? ' Siguiente: ' + exPhrase(nx) : ''));
  }
}

let lock = null;
async function wake(on) { try { if (on && 'wakeLock' in navigator) lock = await navigator.wakeLock.request('screen'); else if (lock) { await lock.release(); lock = null; } } catch (e) {} }

/* =========================================================
   Reproductor
   ========================================================= */
const P = { tl: [], i: 0, endAt: 0, remain: 0, stepMs: 0, paused: false, running: false, timer: null, lastSec: null, half: false, startedAt: 0, activeMs: 0, last: 0, lastSave: 0, w: null };
const ICON_PAUSE = '<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
const ICON_PLAY = '<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
const ICON_DONE = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
const SOUND_MODES = { voz: 'Voz y pitidos', pitidos: 'Solo pitidos', silencio: 'Silencio' };
// botón de sonido del reproductor y del reto: voz y pitidos → solo pitidos → silencio
function voiceIcon() {
  const spk = '<path d="M4 9v6h4l5 4V5L8 9z"/>';
  const svg = '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + spk +
    (S.sound === 'voz' ? '<path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>' : S.sound === 'pitidos' ? '<path d="M16 10.5a2 2 0 0 1 0 3"/>' : '<path d="M17 9l5 6M22 9l-5 6"/>') + '</svg>';
  ['#p-voice', '#rp-voice'].forEach(id => { const b = $(id); if (!b) return; b.innerHTML = svg; b.setAttribute('aria-label', 'Sonido: ' + SOUND_MODES[S.sound]); });
}
function cycleSound() {
  S.sound = S.sound === 'voz' ? 'pitidos' : S.sound === 'pitidos' ? 'silencio' : 'voz'; S.voice = S.sound === 'voz'; save(); voiceIcon();
  if (S.sound !== 'voz') { try { speechSynthesis.cancel(); } catch (e) {} try { if (typeof vStop === 'function') vStop(); } catch (e) {} }
  toast(SOUND_MODES[S.sound]); if (S.sound === 'voz') say('Voz activada'); else if (S.sound === 'pitidos') beep(880, 120, .2);
}
const cur = () => P.tl[P.i];

function startWorkout(w, resume) {
  P.fromView = currentView === 'preview' ? previewFrom : currentView;
  P.w = clone(w); P.tl = buildTimeline(P.w); P.running = true; P.animId = null;
  P.startedAt = resume ? resume.startedAt : Date.now();
  P.activeMs = resume ? resume.activeMs : 0;
  P.hr = resume && resume.hr ? resume.hr : []; P.pauses = resume ? resume.pauses || 0 : 0;
  P.log = resume && resume.log ? resume.log : []; P.logOpen = null;
  try { P.pace = buildPaces(); (P.log || []).forEach(r => { if (r[1] && !r[2] && !r[5]) paceAdd(P.pace, r[0], r[1], r[3] / 1000); }); } catch (e) { P.pace = {}; }
  if (typeof hrUI === 'function') hrUI();
  P.last = performance.now(); P.lastSave = 0;
  beep(660, 60, .12); // desbloquea el audio en iOS
  $('#player').classList.remove('hidden'); document.body.style.overflow = 'hidden';
  voiceIcon(); wake(true);
  if (resume) {
    P.paused = true; step(Math.min(resume.i, P.tl.length - 1), true);
    const s = cur();
    if (s.reps) P.stepMs = resume.stepMs || 0; else P.remain = Math.max(1000, resume.remain || stepDur(s) * 1000);
    render(); toast('Toca ▶ para continuar');
  } else { P.paused = false; step(0, false, 'start'); }
  clearInterval(P.timer); P.timer = setInterval(tick, 100);
  saveSession();
}
// registro de cada ejercicio hecho: [id, repeticiones, segundos previstos, ms reales]
$('#p-easy').onclick = e => { e.stopPropagation(); makeEasier(); };
$('#p-side').addEventListener('click', e => {
  if (e.target.closest('#p-more')) { e.stopPropagation(); moreTime(); }
  else if (e.target.closest('#p-go-next')) { e.stopPropagation(); autoNext(); }
});
$('#p-swap').onclick = e => { e.stopPropagation(); const s = cur(); if (!s) return; const id = s.k === 'work' ? s.ex : s.next, to = swapOf(id); if (to) swapEx(id, to); };
function logClose() {
  const o = P.logOpen; P.logOpen = null; if (!o) return;
  const s = P.tl[o.i]; if (!s) return;
  const ms = Math.round(P.activeMs - o.at); if (ms < 1500) return;
  const row = s.kg != null ? [s.ex, s.reps || 0, s.dur || 0, ms, s.kg] : [s.ex, s.reps || 0, s.dur || 0, ms];
  if (o.auto) { row[4] = s.kg != null ? s.kg : null; row[5] = 1; }   // pasó solo o con «pasar al siguiente»: no cuenta para el ritmo
  (P.log = P.log || []).push(row);
  if (!o.auto && s.reps && P.pace) paceAdd(P.pace, s.ex, s.reps, ms / 1000);
}

/* ---------- Ritmo por ejercicio y paso automático ---------- */
// Con cada serie por repeticiones se guarda cuánto tardaste. Con 3 o más series de un ejercicio se calcula
// tu ritmo (segundos por repetición, mediana de las últimas 8). Cuando pasa el tiempo esperado,
// avisa «Siguiente ejercicio en 10 segundos» y pasa solo; «+10 s» da más tiempo y «Pasar» avanza ya.
const PACE_MIN = 3;
const paceKey = id => (id || '').replace(/_(l|r)$/, '');
function paceAdd(m, id, reps, secs) {
  if (!reps || !secs) return; const v = secs / reps; if (v < 0.6 || v > 12) return;   // descarta toques olvidados o dobles
  const k = paceKey(id); (m[k] = m[k] || []).push(v);
}
function buildPaces() {
  const m = {}, H = PS.get('history', []).slice(0, 300).reverse();   // de la más vieja a la más nueva
  H.forEach(x => {
    if (x.log) x.log.forEach(r => { if (r[1] && !r[2] && !r[5]) paceAdd(m, r[0], r[1], r[3] / 1000); });
    else if (x.w && x.w.kind === 'reto' && x.w.times && typeof RETOS !== 'undefined' && RETOS[x.w.reto]) (x.w.sets || []).forEach((n, i) => { const t = x.w.times[i]; if (t) paceAdd(m, RETOS[x.w.reto].ex, n, t); });
  });
  return m;
}
const median = a => { const b = [...a].sort((x, y) => x - y), n = b.length; return n ? (n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2) : 0; };
function paceOf(id, m) { const a = (m || {})[paceKey(id)]; return a && a.length >= PACE_MIN ? median(a.slice(-8)) : 0; }
// segundos esperados para la serie actual (0 si todavía no hay datos suficientes)
function expectedSecs(s) {
  if (S.autoNext === false || !s || s.k !== 'work' || !s.reps || s.soft || s.test || s.ask || !P.pace) return 0;
  const p = paceOf(s.ex, P.pace); return p ? Math.max(8, Math.round(s.reps * p)) : 0;
}
function autoTick(s) {
  const exp = expectedSecs(s); if (!exp) return;
  if (!P.autoAt) {
    if (P.stepMs >= exp * 1000) { P.autoAt = P.stepMs + 10000; P.autoLast = null; beep(660, 160, .18); say('Siguiente ejercicio en 10 segundos.'); setSide(''); }
    return;
  }
  const left = Math.ceil((P.autoAt - P.stepMs) / 1000);
  if (left !== P.autoLast) { P.autoLast = left; if (left <= 3 && left >= 1) { beep(left === 1 ? 880 : 740, 110, S.sound === 'voz' ? .1 : .22); say(NUM_WORDS[left]); } }
  if (P.stepMs >= P.autoAt) autoNext();
}
function autoNext() { if (P.logOpen) P.logOpen.auto = true; step(P.i + 1, false, 'auto'); }
function moreTime() { if (!P.autoAt) return; P.autoAt += 10000; P.autoLast = null; beep(523, 90, .15); toast('+10 segundos'); setSide(''); }
// el panel bajo el número se reescribe solo si cambia (si no, los botones no se pueden tocar)
function setSide(h) { const el = $('#p-side'); if (el && el.dataset.h !== h) { el.dataset.h = h; el.innerHTML = h; } }
function step(i, silent, reason) {
  logClose();
  P.i = i;
  if (P.tl[i] && P.tl[i].k === 'work' && !P.tl[i].soft) P.logOpen = { i, at: P.activeMs };
  if (i >= P.tl.length) { finish(true, reason); return; }
  const s = cur();
  P.stepMs = 0; P.remain = s.reps ? 0 : s.dur * 1000; P.endAt = performance.now() + P.remain; P.lastSec = null; P.half = false; P.autoAt = 0; P.autoLast = null;
  render(); saveSession();
  if (silent) return;
  if (s.k === 'work') beep(1046, 320, S.sound === 'voz' ? .16 : .3);
  else if (s.k !== 'prep') beep(523, 320, S.sound === 'voz' ? .14 : .25);
  announce(i, reason);
}
function tick() {
  const now = performance.now(), dt = now - P.last; P.last = now;
  if (!P.running || P.paused) return;
  P.activeMs += dt;
  const s = cur();
  if (s.reps) { P.stepMs += dt; autoTick(s); if (P.i < P.tl.length && cur() === s) paint(); }
  else {
    const rem = P.endAt - now;
    if (rem <= 0) { step(P.i + 1, false, 'auto'); return; }
    P.remain = rem;
    const sec = Math.ceil(rem / 1000);
    if (sec !== P.lastSec) {
      P.lastSec = sec;
      if (sec <= 3 && sec >= 1 && s.dur >= 5) { beep(sec === 1 ? 880 : 740, 110, S.sound === 'voz' ? .1 : .22); say(NUM_WORDS[sec]); }
      // en descansos largos, aviso a 10 s del final para ponerse en posición
      else if (sec === 10 && (s.k === 'rest' || s.k === 'roundrest') && s.dur >= 20) { const v = S.sound === 'voz' ? .1 : .2; beep(660, 160, v); setTimeout(() => beep(660, 160, v), 220); say('10 segundos. Prepárate.'); }
      if (s.k === 'work' && !s.soft && s.dur >= 30 && sec === Math.round(s.dur / 2) && !ex(s.ex).s) say('¡Mitad!');
    }
    if (s.k === 'work' && ex(s.ex).s && !P.half && rem <= s.dur * 500) { P.half = true; beep(988, 200, .25); say('Cambia de lado'); }
    paint();
  }
  if (now - P.lastSave > 3000) saveSession();
}
function saveSession() {
  if (!P.running) return;
  P.lastSave = performance.now();
  PS.set('session', { w: P.w, i: P.i, remain: P.remain, stepMs: P.stepMs, activeMs: P.activeMs, startedAt: P.startedAt, savedAt: Date.now(), hr: P.hr, pauses: P.pauses, log: P.log });
}
// versión más fácil de cada ejercicio (se puede cambiar en pleno entrenamiento)
const EASIER = {
  push_ups: 'knee_push_ups', wide_push_ups: 'wide_knee_push_ups', narrow_push_ups: 'narrow_knee_push_ups', stagger_push_ups: 'knee_stagger_push_ups',
  side_to_side_push_ups: 'knee_side_to_side_push_ups', push_up_shoulder_taps: 'knee_push_up_shoulder_taps', push_up_side_planks: 'knee_push_up_side_planks',
  up_down_push_ups: 'knee_up_down_push_ups', up_downs: 'knee_up_downs', commander_push_ups: 'up_downs', narrow_to_wide_push_ups: 'knee_plyo_push_ups',
  knee_plyo_push_ups: 'knee_push_ups', limb_raise_push_ups: 'push_ups', alligator_push_ups: 'push_ups', push_up_jacks: 'push_ups', pike_push_ups: 'plank_to_down_dog',
  knee_push_ups: 'inclined_wall_push_ups', wide_knee_push_ups: 'inclined_wall_push_ups', narrow_knee_push_ups: 'inclined_wall_push_ups',
  high_side_plank: 'mod_high_side_plank', low_side_plank: 'mod_low_side_plank', low_side_plank_leg_lifts: 'mod_low_side_plank_lifts', side_star_plank: 'high_side_plank',
  jump_squats: 'squats', '180_jump_squats': 'jump_squats', forward_jump_squats: 'jump_squats', butt_kicker_jump_squats: 'jump_squats', plie_jump_squats: 'plie_squats',
  squat_jacks: 'squats', squat_stars: 'jump_squats', squat_to_high_knee_jumps: 'squat_to_high_knee', frog_squats: 'squats',
  jump_lunges: 'backward_lunges', lunge_high_knee_jumps: 'lunge_to_high_knee', scissor_switch: 'backward_lunges', pendulum_lunges: 'backward_lunges', walking_lunges: 'backward_lunges',
  '6_count_burpees': '4_count_burpees', flat_out_burpees: '4_count_burpees', flat_out_burpee_tuck_jumps: 'flat_out_burpees', ultimate_burpees: '6_count_burpees', '4_count_burpees': 'beginner_burpees',
  jumping_jacks: 'mod_jumping_jacks', star_jacks: 'jumping_jacks', clap_jacks: 'jumping_jacks', tuck_jumps: 'jump_squats', high_knees: 'walking_high_knees', wide_high_knees: 'walking_high_knees',
  rockstars: 'jump_squats', inchworm_tuck_jumps: 'inchworms', high_plank_jumping_jacks: 'high_plank_jacks', high_plank_jacks: 'high_plank',
  v_ups: 'single_leg_v_up', single_leg_v_up: 'crunches', wide_legged_v_ups: 'v_ups', sit_ups: 'crunches', straight_leg_bicycle_crunches: 'bicycle_crunches',
  russian_twist_hard: 'russian_twist_easy', knee_tuck_crunches: 'reverse_crunches', leg_raises: 'reverse_crunches', sl_crab_bridge: 'crab_bridge', single_leg_bridge: 'bridge', marching_wall_sit: 'wall_sit'
};
const fmtKg = k => (Math.round(k * 10) / 10).toLocaleString('es');
// versión más difícil: la inversa de EASIER (si hay varias, la de menor nivel; sin saltos si así se pidió)
function harderOf(id, noJump) {
  const b = (id || '').replace(/_(l|r)$/, '');
  let c = Object.keys(EASIER).filter(k => EASIER[k] === b && CATALOG[k]);
  if (noJump) { const nj = c.filter(k => !CATALOG[k].j); if (nj.length) c = nj; }
  c.sort((x, y) => (CATALOG[x].lv || 1) - (CATALOG[y].lv || 1));
  return c[0] || null;
}
const easierOf = id => { const b = (id || '').replace(/_(l|r)$/, ''); const e = EASIER[b]; return e && CATALOG[e] ? e : null; };
// cambia el ejercicio por su versión más fácil en lo que queda del entrenamiento (y en la sesión guardada)
function makeEasier() {
  const s = cur(); if (!s) return;
  const id = s.k === 'work' ? s.ex : s.next, easy = easierOf(id); if (!easy) return;
  swapEx(id, easy);
}
function swapEx(id, to) {
  const swap = o => JSON.parse(JSON.stringify(o).split(`"${id}"`).join(`"${to}"`));
  P.tl = P.tl.map((st, i) => i < P.i ? st : swap(st));
  P.w = swap(P.w);
  // sin mancuerna no hay peso
  if (!isDbEx(to)) { P.tl.forEach((st, i) => { if (i >= P.i && st.ex === to) st.kg = 0; }); (P.w.items || []).forEach(it => { if (it.id === to) it.kg = 0; }); }
  P.animId = null; render(); saveSession();
  toast('Cambiado a ' + ex(to).n); say(ex(to).n);
}
// mismo movimiento con o sin mancuerna
const DB_SWAP = {
  db_goblet_squat: 'squats', db_floor_press: 'push_ups', db_row: 'superman_pull', db_rdl: 'single_leg_deadlift', db_lunge: 'backward_lunges',
  db_shoulder_press: 'pike_push_ups', db_curl: 'superman_pull', db_hammer_curl: 'superman_pull', db_lateral_raise: 'arm_circles_forward',
  db_triceps_ext: 'triceps_dip', db_thruster: 'overhead_squats', db_calf_raise: 'calf_raises'
};
const BW_SWAP = {
  squats: 'db_goblet_squat', plie_squats: 'db_goblet_squat', narrow_squats: 'db_goblet_squat', pulsing_squats: 'db_goblet_squat',
  push_ups: 'db_floor_press', knee_push_ups: 'db_floor_press', wide_push_ups: 'db_floor_press', wide_knee_push_ups: 'db_floor_press', inclined_wall_push_ups: 'db_floor_press',
  superman_pull: 'db_row', single_leg_deadlift: 'db_rdl', bridge: 'db_rdl', backward_lunges: 'db_lunge', forward_lunges: 'db_lunge', walking_lunges: 'db_lunge',
  pike_push_ups: 'db_shoulder_press', triceps_dip: 'db_triceps_ext', narrow_push_ups: 'db_triceps_ext', narrow_knee_push_ups: 'db_triceps_ext',
  calf_raises: 'db_calf_raise', overhead_squats: 'db_thruster', arm_circles_forward: 'db_lateral_raise', arm_circles_backward: 'db_lateral_raise'
};
const isDbEx = id => /^db_/.test(id || '');
const hasDumbbells = () => !!S.useDb || (typeof getDumb === 'function' && !!getDumb()) || (P.w && (P.w.db || P.w.kind === 'db'));
const swapOf = id => { const b = (id || '').replace(/_(l|r)$/, ''); const t = isDbEx(b) ? DB_SWAP[b] : hasDumbbells() ? BW_SWAP[b] : null; return t && CATALOG[t] ? t : null; };
function render() {
  const s = cur(); if (!s) return;
  $('#player').className = 'player ' + s.k;
  let phase, name, cue = '', meta;
  if (s.k === 'work') { const e = ex(s.ex); phase = s.kg ? `${fmtKg(s.kg)} kg · serie ${s.set + 1} de ${s.S}` : s.sec === 'Ronda' ? '¡Dale!' : s.sec; name = e.n; cue = e.d; }
  else { phase = (s.k === 'prep' ? 'Prepárate' : s.label) + (s.next ? ' · siguiente' : ''); name = s.next ? ex(s.next).n : ''; cue = s.next ? ex(s.next).d : ''; }
  $('#p-phase').textContent = phase; $('#p-name').textContent = name; $('#p-cue').textContent = cue;
  const eid = s.k === 'work' ? s.ex : s.next, easy = !s.ask && easierOf(eid);
  $('#p-easy').classList.toggle('hidden', !easy);
  const tgtStep = s.k === 'work' ? s : P.tl.slice(P.i + 1).find(x => x.k === 'work');
  const sw = !s.ask && P.w.kind !== 'test' && !(tgtStep && tgtStep.soft) && swapOf(eid);
  $('#p-swap').classList.toggle('hidden', !sw);
  if (sw) $('#p-swap').innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h12l-3-3M17 17H5l3 3"/></svg> ${isDbEx(sw) ? 'Con mancuerna' : 'Sin mancuerna'}: ${esc(ex(sw).n)}`;
  if (easy) $('#p-easy').innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg> Más fácil: ${esc(ex(easy).n)}`;
  meta = s.r != null ? `Ronda <b>${s.r + 1}/${s.R}</b>${s.k === 'work' ? ` · Ejercicio <b>${s.i + 1}/${s.N}</b>` : ''}` : (s.sec ? `${s.sec} <b>${s.i + 1}/${s.N}</b>` : '&nbsp;');
  if (s.metaTxt) meta = s.metaTxt;
  else if (s.k !== 'work' && s.next && P.w.kind === 'db') { const nx = P.tl.slice(P.i + 1).find(x => x.k === 'work'); if (nx) meta = nx.metaTxt; }
  $('#p-meta').innerHTML = meta;
  $('#p-next').innerHTML = s.k === 'work' ? `<span>Siguiente</span><b>${s.next ? esc(ex(s.next).n) : '¡Último!'}</b>` : `<span>Restante aprox.</span><b id="p-left"></b>`;
  $('#p-ring').classList.toggle('reps', !!s.reps);
  if (s.ask) {
    const tt = TESTS.find(x => x.key === s.ask), v = P.w.results[s.ask] ?? '';
    $('#p-side').dataset.h = 'ask'; $('#p-side').innerHTML = `<div class="ask"><span>${tt.n}:</span><button data-a="-1" aria-label="Menos">−</button><input id="p-ask" type="number" inputmode="numeric" min="0" max="300" value="${v}" placeholder="0"><button data-a="1" aria-label="Más">+</button></div>`;
    const inp = $('#p-ask');
    const setV = v2 => { P.w.results[s.ask] = Math.max(0, Math.min(300, v2 | 0)); inp.value = P.w.results[s.ask]; saveSession(); };
    inp.oninput = () => { if (inp.value !== '') setV(+inp.value); };
    $('#p-side').querySelectorAll('[data-a]').forEach(b => b.onclick = () => setV((+inp.value || 0) + +b.dataset.a));
  }
  const animId = s.k === 'work' ? s.ex : s.next;
  if (animId && P.animId !== animId) { P.animId = animId; Anim.mount($('#p-anim'), animId); }
  Anim.setPaused($('#p-anim'), P.paused && !s.reps);
  $('#p-play').innerHTML = s.reps ? ICON_DONE : (P.paused ? ICON_PLAY : ICON_PAUSE);
  $('#p-play').setAttribute('aria-label', s.reps ? 'Hecho' : (P.paused ? 'Continuar' : 'Pausa'));
  paint();
}
function paint() {
  const s = cur(); if (!s) return;
  const tot = total(P.tl), before = P.tl.slice(0, P.i).reduce((a, x) => a + stepDur(x), 0);
  let el;
  if (s.reps) {
    $('#p-num').innerHTML = `${s.reps}<small>${fmt(P.stepMs / 1000)}${P.paused ? ' · pausa' : ''}</small>`;
    el = before + Math.min(stepDur(s), P.stepMs / 1000);
  } else {
    const rem = Math.max(0, P.remain);
    $('#p-num').textContent = Math.ceil(rem / 1000);
    $('#p-arc').style.strokeDashoffset = 289.03 * (1 - rem / (s.dur * 1000));
    el = before + (s.dur - rem / 1000);
  }
  $('#p-bar').style.width = (el / tot * 100) + '%';
  const l = $('#p-left'); if (l) l.textContent = fmt(tot - el);
  const e = s.k === 'work' && ex(s.ex);
  if (s.ask) { /* el campo del número se dibuja una vez en render() */ }
  else if (s.test) setSide('<span class="side">Cuenta tus repeticiones</span>');
  else if (s.reps && P.autoAt) {
    const left = Math.max(0, Math.ceil((P.autoAt - P.stepMs) / 1000));
    const el = $('#p-auto-n'); if (el && $('#p-side').dataset.h) el.textContent = left;
    if (!el) setSide(`<div class="autonx"><span class="side">Siguiente ejercicio en <b id="p-auto-n">${left}</b> s</span><div class="autonx-b"><button class="btn ghost small" id="p-more">+10 s · más tiempo</button><button class="btn small" id="p-go-next">Pasar al siguiente</button></div></div>`);
  }
  else if (s.reps) { const exp = expectedSecs(s); setSide(`<span class="side">Toca ✓ al terminar${exp ? ` · tu ritmo: ~${fmt(exp)}` : ''}</span>`); }
  else setSide(e && e.s ? `<span class="side">${P.half ? 'Lado izquierdo' : 'Lado derecho'}</span>` : '');
}
function togglePause() {
  if (!P.running) return;
  const s = cur();
  if (P.paused) { P.paused = false; if (!s.reps) P.endAt = performance.now() + P.remain; say('Seguimos'); }
  else { P.paused = true; P.pauses = (P.pauses || 0) + 1; if (!s.reps) P.remain = P.endAt - performance.now(); say('Pausa'); }
  render(); saveSession();
}
$('#p-play').onclick = () => {
  const s = cur();
  if (s && s.reps) { if (P.paused) { P.paused = false; } step(P.i + 1, false, 'done'); return; }
  togglePause();
};
$('#p-skip').onclick = () => {
  if (P.i < P.tl.length - 1) { step(P.i + 1); if (P.paused && !cur().reps) { P.remain = cur().dur * 1000; render(); } }
  else finish(true);
};
$('#p-prev').onclick = () => {
  const s = cur(); const elapsed = s.reps ? P.stepMs / 1000 : s.dur - P.remain / 1000;
  const j = elapsed < 3 && P.i > 0 ? P.i - 1 : P.i;
  step(j); if (P.paused && !cur().reps) { P.remain = cur().dur * 1000; render(); }
};
$('#p-hr').onclick = () => { if (HR.on) openHRSettings(); else hrConnect(); };
$('#p-voice').onclick = cycleSound;
$('#rp-voice').onclick = e => { e.stopPropagation(); cycleSound(); };
const isProgrammed = w => w.kind === 'plan' || !!w.smart;
function closeMenu() { $('#p-menu').classList.add('hidden'); }
function openMenu() {
  if (!P.running) return;
  const wasPaused = P.paused; if (!wasPaused) togglePause();
  P.menuResume = !wasPaused;
  const w = P.w, prog = isProgrammed(w), canChange = w.kind !== 'test' && w.kind !== 'db';
  const tot = total(P.tl), before = P.tl.slice(0, P.i).reduce((a, x) => a + stepDur(x), 0);
  const lvl = w.kind === 'plan' ? 'Nivel ' + PLAN_LEVELS[w.level] : w.smart ? 'Intensidad ' + (getSmart() ? getSmart().I.toFixed(1) : w.I) : w.kind === 'test' ? 'Prueba de capacidad' : LEVELS[w.level - 1];
  $('#p-menu').innerHTML = `<div class="pm-card">
    <div class="pm-k">Pausa</div>
    <b class="pm-t">${esc(title(w))}</b>
    <p class="pm-s">${esc(lvl)} · ${fmt(P.activeMs / 1000)} hechos · ${Math.round(before / tot * 100)}% completado</p>
    <div class="pbar"><i style="width:${Math.round(before / tot * 100)}%"></i></div>
    <div style="height:18px"></div>
    <button class="btn" data-m="go">▶ Continuar</button>
    <button class="btn ghost" data-m="end">Terminar<small>${prog ? 'Queda pendiente para repetirlo otro día' : 'Se guarda en el historial'}</small></button>
    ${prog ? `<button class="btn ghost" data-m="skip">Terminar y saltar<small>${w.kind === 'plan' ? 'Marca este día y pasa al siguiente del plan' : 'Pasa a la siguiente sesión del entrenador'}</small></button>` : ''}
    ${canChange ? `<button class="btn ghost" data-m="chg">Cambiar entrenamiento<small>Elige otro más fácil, igual o más difícil</small></button>
    <div class="pm-chg hidden" id="pm-chg"><button class="btn small ghost" data-d="-1">Más fácil</button><button class="btn small ghost" data-d="0">Otro igual</button><button class="btn small ghost" data-d="1">Más difícil</button></div>` : ''}
  </div>`;
  $('#p-menu').classList.remove('hidden');
}
$('#p-menu').onclick = e => {
  if (e.target.id === 'p-menu') { menuContinue(); return; }
  const b = e.target.closest('[data-m],[data-d]'); if (!b) return;
  const m = b.dataset.m;
  if (m === 'go') menuContinue();
  else if (m === 'end') { closeMenu(); P.endMode = isProgrammed(P.w) ? 'pending' : 'end'; finish(false); }
  else if (m === 'skip') { closeMenu(); P.endMode = 'skip'; finish(false); }
  else if (m === 'chg') $('#pm-chg').classList.toggle('hidden');
  else if (b.dataset.d != null) changeWorkout(+b.dataset.d);
};
function menuContinue() { closeMenu(); if (P.menuResume && P.paused) togglePause(); }
// cambia a otro entrenamiento del mismo tipo con más, igual o menos dificultad (el actual no se guarda)
function changeWorkout(d) {
  const w = P.w; let nw = null, msg = '';
  if (w.kind === 'plan') {
    const p = getPlan(); if (!p || p.file !== w.file) { toast('Este plan ya no está activo'); return; }
    const nl = Math.max(0, Math.min(3, p.level + d));
    if (d && nl === p.level) { toast(d > 0 ? 'Ya estás en el nivel más alto' : 'Ya estás en el nivel más bajo'); return; }
    if (nl !== p.level) { p.log.push({ at: Date.now(), week: p.week, level: nl }); p.level = nl; setPlan(p); }
    nw = planDayWorkout(w.week, w.day); nw.warm = w.warm; nw.cool = w.cool; msg = 'Nivel ' + PLAN_LEVELS[nl];
  } else if (w.smart) {
    const sm = getSmart(); if (!sm) return;
    sm.I = +Math.max(1, Math.min(10, sm.I + d)).toFixed(2); sm.log = [...(sm.log || []), { at: Date.now(), I: sm.I, why: 'cambio' }];
    sm.next = genSmart(sm); sm.next.smartN = w.smartN; setSmart(sm); nw = clone(sm.next); msg = 'Intensidad ' + sm.I.toFixed(1);
  } else {
    const keep = { level: S.level, parts: S.parts, noJump: S.noJump };
    const nl = Math.max(1, Math.min(3, w.level + d));
    if (d && nl === w.level) { toast(d > 0 ? 'Ya es el nivel más alto' : 'Ya es el nivel más bajo'); return; }
    S.level = nl; S.parts = w.parts || S.parts; S.noJump = !!w.noJump;
    nw = generate(); Object.assign(S, keep); msg = LEVELS[nl - 1];
  }
  closeMenu();
  clearInterval(P.timer); P.running = false; PS.del('session');
  startWorkout(nw); toast('Nuevo entrenamiento · ' + msg);
}
$('#p-close').onclick = openMenu;
document.addEventListener('keydown', e => {
  if (!P.running) return;
  if (e.code === 'Space') { e.preventDefault(); $('#p-play').click(); }
  if (e.code === 'ArrowRight') $('#p-skip').click();
  if (e.code === 'ArrowLeft') $('#p-prev').click();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveSession();
  else if (P.running) wake(true);
});
window.addEventListener('pagehide', saveSession);

let lastDone = null;
function finish(full, reason) {
  clearInterval(P.timer); P.running = false; wake(false); $('#p-anim').innerHTML = ''; P.animId = null;
  if (!full) try { speechSynthesis.cancel(); } catch (e) {}
  PS.del('session');
  const secs = Math.round(P.activeMs / 1000);
  $('#player').classList.add('hidden');
  renderResume();
  if (secs < 20 && !full) { document.body.style.overflow = ''; return; }
  logClose();
  const entry = { at: Date.now(), start: P.startedAt, secs, full, w: P.w, pauses: P.pauses || 0 };
  if (P.log && P.log.length) entry.log = P.log;
  if (P.w.kind !== 'test') entry.reps = repsOf(entry, full ? undefined : P.i);
  const hrs = P.hr && P.hr.length ? hrSummary(P.hr) : null; if (hrs) { hrs.src = 'banda'; entry.hr = hrs; }
  const h = PS.get('history', []); h.unshift(entry); PS.set('history', h.slice(0, 400));
  let planMsg = '';
  const isPlan = P.w.kind === 'plan';
  const mode = P.endMode; P.endMode = null;
  if (mode === 'skip') {
    if (isPlan) markPlanDay(P.w, secs, true);
    else if (P.w.smart) { const sm = getSmart(); if (sm) { sm.sessions = (sm.sessions || 0) + 1; sm.nextAt = dayStart(Date.now()) + 2 * DAY; sm.lastAt = Date.now(); sm.next = genSmart(sm); setSmart(sm); } }
  }
  if (isPlan && full && markPlanDay(P.w, secs)) {
    const p = getPlan(), pr = planProgress(p);
    planMsg = `<div class="now"><div class="wk">${esc(FAM[p.fam].n)}</div><div class="gap"></div><div class="pbar"><i style="width:${Math.round(pr.done / pr.total * 100)}%"></i></div><div class="pmeta"><span>${pr.done} de ${pr.total} entrenamientos</span><span>${weekDone(p, p.week) ? '¡Semana completada!' : 'Semana ' + p.week}</span></div></div>`;
  }
  if (full) { beep(784, 150, .25); setTimeout(() => beep(1046, 350, .3), 170); say((reason === 'auto' || reason === 'done' ? '¡Terminaste! ' : '') + '¡Entrenamiento completado! Buen trabajo.'); }
  lastDone = { w: P.w, secs, at: Date.now() };
  $('#d-title').textContent = full ? '¡Hecho!' : mode === 'skip' ? 'Saltado' : 'Sesión guardada';
  $('#d-sub').textContent = title(P.w) + ' · ' + (isPlan ? FAM[P.w.fam].n : LEVELS[P.w.level - 1]);
  const work = P.tl.filter(s => s.k === 'work' && !s.soft).length;
  $('#d-stats').innerHTML = `<div class="stat"><b>${fmt(secs)}</b><span>tiempo activo</span></div><div class="stat"><b>${P.w.rounds.length}</b><span>rondas</span></div><div class="stat"><b>${work}</b><span>series</span></div>`;
  $('#d-plan').innerHTML = planMsg;
  renderDoneExtras(full, secs);
  $('#d-hr').innerHTML = hrs ? hrBlockHTML(hrs) : '';
  setTimeout(() => checkAwards(true), 600);
  $('#d-fav').classList.toggle('hidden', isPlan || P.w.kind === 'test' || !!P.w.smart);
  $('#d-mark').classList.toggle('hidden', !(isPlan && !full && mode !== 'skip' && getPlan() && getPlan().file === P.w.file));
  $('#done').classList.remove('hidden');
}
function renderDoneExtras(full, secs) {
  const w = P.w; lastDone.fb = null; lastDone.testSaved = false;
  $('#d-test').innerHTML = ''; $('#d-fb').innerHTML = '';
  if (w.kind === 'test') {
    $('#d-title').textContent = full ? '¡Prueba hecha!' : 'Prueba interrumpida';
    $('#d-sub').textContent = 'Revisa o escribe tus repeticiones';
    $('#d-stats').innerHTML = '';
    $('#d-test').innerHTML = `<div class="block">${w.tests.map(tt => { const T0 = TESTS.find(x => x.key === tt.key);
      return `<div class="hist"><div class="t"><b>${T0.n}${tt.key === 'pu' && w.puKnee ? ' (rodillas)' : ''}</b><small>en 1 minuto</small></div><div class="ask"><button data-a="-1" data-k="${tt.key}">−</button><input type="number" inputmode="numeric" min="0" max="300" id="dt-${tt.key}" value="${w.results[tt.key] ?? ''}" placeholder="0"><button data-a="1" data-k="${tt.key}">+</button></div></div>`; }).join('')}</div>
      <button class="btn" id="dt-save">Guardar resultados</button><div class="gap"></div>`;
    $('#d-test').querySelectorAll('[data-a]').forEach(b => b.onclick = () => { const i = $('#dt-' + b.dataset.k); i.value = Math.max(0, (+i.value || 0) + +b.dataset.a); });
    $('#dt-save').onclick = saveTestFromDone;
    return;
  }
  if (!full && (secs < 120 || isProgrammed(w))) return;
  $('#d-fb').innerHTML = `<div class="block review"><div class="block-h"><b>¿Cómo te fue?</b><span>${getSmart() && getSmart().I ? 'ajusto la próxima sesión' : ''}</span></div>
    <div class="opts" id="fb-opts">${Object.entries(FB).map(([k, v]) => `<button class="btn ghost small" data-fb="${k}">${v.n}</button>`).join('')}</div><p id="fb-msg" class="hidden"></p></div>`;
  $('#fb-opts').onclick = e => {
    const b = e.target.closest('[data-fb]'); if (!b) return;
    $('#fb-opts').querySelectorAll('button').forEach(x => x.className = 'btn small ' + (x === b ? '' : 'ghost'));
    setFeedback(b.dataset.fb);
  };
}
function setFeedback(fb) {
  const first = lastDone.fb == null;
  lastDone.fb = fb;
  const h = PS.get('history', []); if (h[0] && h[0].at >= lastDone.at - 1000) { h[0].fb = fb; PS.set('history', h); }
  // cambiar de respuesta no suma dos veces: se recalcula desde el estado anterior
  if (first) lastDone.smartBefore = getSmart();
  else if (lastDone.smartBefore) setSmart(lastDone.smartBefore);
  const sm = applyFeedback(lastDone.w, fb);
  checkAwards(true);
  const msg = $('#fb-msg');
  if (sm) {
    const n = sm.next, dir = FB[fb].d > 0.5 ? 'algo más intensa' : FB[fb].d > 0 ? 'un poco más exigente' : 'más suave';
    msg.innerHTML = `Próxima sesión ${lastDone.w.smart ? '<b>' + whenStr(sm.nextAt) + '</b>' : ''}, ${dir}: ${esc(FOCUS[n.focus].n).toLowerCase()} · ~${Math.round(total(buildTimeline(n)) / 60)} min. Intensidad ${sm.I.toFixed(1)}/10.`;
  } else msg.innerHTML = 'Anotado. Haz la prueba de capacidad en el coach para que ajuste tus sesiones.';
  msg.classList.remove('hidden');
}
function saveTestFromDone() {
  const r = { puKnee: lastDone.w.puKnee };
  for (const t of TESTS) { const v = $('#dt-' + t.key).value; if (v === '') { toast('Falta el número de ' + t.n.toLowerCase()); $('#dt-' + t.key).focus(); return; } r[t.key] = Math.max(0, Math.min(300, +v | 0)); }
  const sm = saveTest(r);
  const h = PS.get('history', []); if (h[0] && h[0].w.kind === 'test') { h[0].w.results = r; PS.set('history', h); }
  lastDone.testSaved = true;
  checkAwards(true);
  $('#d-test').innerHTML = `<div class="now"><div class="wk">Resultado</div><b class="name">Intensidad ${sm.I.toFixed(1)} de 10</b>
    <p class="sub">Nivel ${LEVELS[levelOfI(sm.I) - 1].toLowerCase()}. Tu próxima sesión está lista: ${esc(FOCUS[sm.next.focus].n).toLowerCase()}, ~${Math.round(total(buildTimeline(sm.next)) / 60)} min. Puedes hacerla hoy o mañana.</p></div>`;
}
$('#d-ok').onclick = () => {
  // sin respuesta en una sesión del entrenador: cuenta como «bien»
  if (lastDone && lastDone.w.smart && lastDone.fb == null && $('#fb-opts')) applyFeedback(lastDone.w, 'ok');
  $('#done').classList.add('hidden'); document.body.style.overflow = '';
  // si se empezó desde el calendario, vuelve al calendario (ya actualizado)
  W = null; show(P.fromView === 'cal' ? 'cal' : lastDone && lastDone.w.kind === 'plan' ? 'plans' : lastDone && (lastDone.w.smart || lastDone.w.kind === 'test') ? 'coach' : 'hist');
};
$('#d-fav').onclick = () => saveFav(lastDone.w);
$('#d-mark').onclick = () => { if (markPlanDay(lastDone.w, lastDone.secs)) { toast('Día marcado como hecho'); $('#d-mark').classList.add('hidden'); } };

/* =========================================================
   Arranque
   ========================================================= */
(function init() {
  const list = profiles();
  if (!list.length) { showOnboarding(); return; }
  const id = LS.get('active', list[0].id);
  switchProfile(list.find(p => p.id === id) ? id : list[0].id);
})();

/* ---------- Teclado: se cierra con «Listo/Buscar» o tocando fuera del campo ---------- */
const isField = el => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
document.addEventListener('focusin', e => {
  const el = e.target;
  if (el.tagName === 'INPUT' && !el.hasAttribute('enterkeyhint')) el.setAttribute('enterkeyhint', el.type === 'search' ? 'search' : 'done');
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); e.target.blur(); }
});
// solo al tocar una zona «vacía»: si se toca un botón no se cierra antes, para que el toque llegue al botón
// (al cerrarse el teclado la pantalla se reacomoda y el botón se movería bajo el dedo)
document.addEventListener('pointerdown', e => {
  const a = document.activeElement;
  if (!isField(a) || isField(e.target)) return;
  if (e.target.closest('button,a,label,select,[role=button],[onclick],.prof,.ag,.cd,.ex,.row')) return;
  a.blur();
}, true);
// al pulsar un botón, el teclado se cierra después del toque
document.addEventListener('click', e => {
  const a = document.activeElement;
  if (isField(a) && e.target.closest('button,[role=button]')) setTimeout(() => { if (document.activeElement === a) a.blur(); }, 0);
}, true);
