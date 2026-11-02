/* ---------- Cuenta y guardado automático en la nube (Firebase) ----------
   - Al abrir la app con internet se crea un usuario anónimo (sin pedir nada) y todos los perfiles
     se suben solos a Firestore después de cada entrenamiento y al salir de la app.
   - Desde Perfil se puede vincular un correo o Google para recuperar todo en otro teléfono.
   - Nunca se pisa lo de este teléfono sin preguntar: si en la nube hay algo más nuevo de otro
     teléfono, se ofrece restaurarlo (mostrando qué contiene) o quedarse con lo de acá.
   Firebase se carga aparte (fb.js) y la app funciona igual sin él. */
const FB_CFG = {
  apiKey: 'AIzaSyAJpjmb4Ss80r6Jg17b_MS9PpumLEQIJMs',
  authDomain: 'inhiit.firebaseapp.com',
  projectId: 'inhiit',
  storageBucket: 'inhiit.firebasestorage.app',
  messagingSenderId: '998582972196',
  appId: '1:998582972196:web:88efcded1636cd75870db1'
};
const CLOUD = { user: null, busy: false, err: '', offer: null };
const CL_PART = 700000;                      // caracteres por documento (Firestore admite hasta 1 MB)

const cDev = () => { let d = LS.get('cloud.dev', null); if (!d) { d = (self.crypto && crypto.randomUUID) ? crypto.randomUUID() : uid() + uid(); LS.set('cloud.dev', d); } return d; };
const cRev = () => LS.get('cloud.rev', {}) || {};
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + ':' + s.length; }

function loadFBA() {
  return new Promise((res, rej) => {
    if (window.FBA) return res();
    const s = document.createElement('script'); s.src = 'fb.js';
    s.onload = () => window.FBA ? res() : rej(new Error('fba')); s.onerror = rej;
    document.head.appendChild(s);
  });
}
let cloudReady = null;
function cloudStart() {
  if (cloudReady) return cloudReady;
  cloudReady = loadFBA().then(() => new Promise(res => {
    let first = true;
    FBA.init(FB_CFG, async u => {
      const prev = CLOUD.user;
      CLOUD.user = u;
      if (first) {
        first = false;
        if (!u && navigator.onLine) { try { CLOUD.user = await FBA.signInAnon(); } catch (e) { CLOUD.err = e && e.code || 'auth'; } }
        res(CLOUD.user);
      } else if (!u && !CLOUD.signingOut) {
        // el usuario dejó de existir (p. ej. Firebase borró el anónimo a los 30 días): se crea otro
        // y se vuelve a subir todo desde este teléfono, que es donde viven los datos
        if (prev && !prev.anon) toast('Se cerró la sesión de tu cuenta: vuelve a entrar desde Perfil');
        if (navigator.onLine) { try { CLOUD.user = await FBA.signInAnon(); LS.del('cloud.hash'); setTimeout(() => cloudPush(), 500); } catch (e) {} }
      }
      cloudUI();
    });
  })).catch(() => { cloudReady = null; return null; });
  return cloudReady;
}
// usuario listo (si no había, intenta crear el anónimo: por ejemplo, la app se abrió sin internet)
async function cloudUser() {
  await cloudStart(); if (CLOUD.user) return CLOUD.user;
  if (!window.FBA || !navigator.onLine) return null;
  try { CLOUD.user = await FBA.signInAnon(); return CLOUD.user; } catch (e) { CLOUD.err = e && e.code || 'auth'; cloudUI(); return null; }
}

/* --- empaquetado: JSON → gzip → base64, en partes --- */
async function gz64(str) {
  if (!self.CompressionStream) return null;
  const st = new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'));
  const u = new Uint8Array(await new Response(st).arrayBuffer());
  let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(s);
}
async function ungz64(b64) {
  const bin = atob(b64), u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
}
async function cloudFetch(u, m) {
  const body = (await FBA.getParts(u.uid, m.n)).join('');
  const j = JSON.parse(m.enc === 'gz' ? await ungz64(body) : body);
  j.__cloud = { uid: u.uid, rev: m.updated };
  return j;
}

/* --- subir: mode 'now' = aunque no haya cambios; 'over' = reemplazar lo de la nube aunque sea más nuevo --- */
async function cloudPush(mode) {
  if (!PROFILE || !profiles().length || CLOUD.busy) return false;
  const u = await cloudUser(); if (!u || !navigator.onLine) return false;
  const b = backupAll(), h = hashStr(JSON.stringify([b.profiles, b.active]));
  const r = cRev();
  if (!mode && h === LS.get('cloud.hash', null) && r.uid === u.uid) return true;
  CLOUD.busy = true; CLOUD.err = ''; cloudUI();
  try {
    const m0 = await FBA.getMeta(u.uid);
    if (m0 && mode !== 'over' && m0.device !== cDev() && (r.uid !== u.uid || m0.updated > (r.rev || 0))) { cloudOffer(u, m0); return false; }
    const text = JSON.stringify(b);
    let enc = 'gz', body = await gz64(text).catch(() => null);
    if (!body) { enc = 'json'; body = text; }
    const parts = []; for (let i = 0; i < body.length; i += CL_PART) parts.push(body.slice(i, i + CL_PART));
    const now = Date.now();
    await FBA.putAll(u.uid, { app: 'inhiit', v: 1, updated: now, device: cDev(), n: parts.length, enc, size: text.length, perfiles: b.profiles.length, resumen: b.resumen }, parts, m0 ? m0.n : 0);
    LS.set('cloud.hash', h); LS.set('cloud.rev', { uid: u.uid, rev: now }); LS.set('cloud.last', now);
    return true;
  } catch (e) { CLOUD.err = e && e.code || String(e); return false; }
  finally { CLOUD.busy = false; cloudUI(); }
}
// al abrir: ¿hay algo más nuevo de otro teléfono? si no, sube lo de acá
async function cloudCheck() {
  const u = await cloudUser(); if (!u || !navigator.onLine) return;
  try {
    const m = await FBA.getMeta(u.uid), r = cRev();
    if (m && m.device !== cDev() && (r.uid !== u.uid || m.updated > (r.rev || 0))) { cloudOffer(u, m); return; }
    if (!m && !PROFILE && CLOUD.wantRestore) { CLOUD.wantRestore = false; toast('Esa cuenta todavía no tiene nada guardado'); }
    cloudPush();
  } catch (e) { CLOUD.err = e && e.code || String(e); cloudUI(); }
}
const clWhen = t => dateStr(t) + ' a las ' + new Date(t).toLocaleTimeString(LOC, { hour: '2-digit', minute: '2-digit' });
async function cloudOffer(u, m) {
  CLOUD.offer = m;
  // sin perfiles (teléfono nuevo): directo a ver qué contiene y restaurar
  if (!PROFILE) { try { readBackup(await cloudFetch(u, m)); } catch (e) { toast('No se pudo leer lo guardado en la nube'); } return; }
  if ($('#sheet-root').innerHTML && !$('#cl-acc')) return;   // no tapar otra ventana abierta: se vuelve a ofrecer más tarde
  sheet(`<h3>Hay datos más nuevos en tu cuenta</h3>
    <p class="sub">Se guardaron desde otro teléfono el <b>${clWhen(m.updated)}</b>.</p>
    ${(m.resumen || []).length ? `<div class="bk-card">${m.resumen.map(x => `<div class="t" data-noi18n>${esc(x)}</div>`).join('')}</div>` : ''}
    <button class="btn" id="co-see">Ver y restaurar<small>Antes de cambiar nada te muestro qué contiene</small></button><div class="gap"></div>
    <button class="btn ghost" id="co-mine">Quedarme con lo de este teléfono<small>Lo de la nube se reemplaza por lo de aquí</small></button>`, () => {
    $('#co-see').onclick = async () => { try { readBackup(await cloudFetch(u, m)); } catch (e) { toast('No se pudo leer lo guardado en la nube'); } };
    $('#co-mine').onclick = async () => { closeSheet(); toast('Guardando…'); if (await cloudPush('over')) toast('Listo: la nube tiene lo de este teléfono'); };
  });
}
// al restaurar desde la nube, se marca como sincronizado y se vuelve a subir ya combinado
const _importBackup = importBackup;
importBackup = function (j, replace) {
  _importBackup(j, replace);
  if (j && j.__cloud) { LS.set('cloud.rev', j.__cloud); CLOUD.offer = null; setTimeout(() => cloudPush('now'), 800); }
};

/* --- ventana «Cuenta y guardado automático» --- */
const CL_ERR = {
  'auth/email-already-in-use': 'Ese correo ya tiene una cuenta: usa «Ya tengo cuenta».',
  'auth/credential-already-in-use': 'Esa cuenta de Google ya está en uso: usa «Ya tengo cuenta».',
  'auth/provider-already-linked': 'Esta cuenta ya está vinculada.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-email': 'Ese correo no es válido.',
  'auth/missing-password': 'Escribe la contraseña.',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'No hay ninguna cuenta con ese correo.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
  'auth/network-request-failed': 'Sin conexión. Prueba de nuevo con internet.',
  'auth/popup-blocked': 'No se pudo abrir Google aquí. Usa correo y contraseña.',
  'auth/popup-closed-by-user': 'Se cerró la ventana de Google antes de terminar.',
  'auth/cancelled-popup-request': 'Se cerró la ventana de Google antes de terminar.',
  'auth/operation-not-supported-in-this-environment': 'No se pudo abrir Google aquí. Usa correo y contraseña.',
  'auth/web-storage-unsupported': 'No se pudo abrir Google aquí. Usa correo y contraseña.',
  'auth/unauthorized-domain': 'Falta autorizar esta dirección en Firebase para entrar con Google. Usa correo y contraseña.',
  'auth/operation-not-allowed': 'Ese método de acceso no está activado en Firebase.',
  'auth/admin-restricted-operation': 'Ese método de acceso no está activado en Firebase.'
};
const clErr = e => CL_ERR[e && e.code] || 'No se pudo completar. Prueba de nuevo.';
// por qué no se pudo guardar (para saber qué falta configurar en Firebase)
const SAVE_ERR = {
  'permission-denied': 'Firebase rechazó el guardado: falta publicar las reglas de Firestore.',
  'not-found': 'Falta crear la base de datos Firestore en Firebase.',
  'failed-precondition': 'Falta crear la base de datos Firestore en Firebase.',
  'auth/admin-restricted-operation': 'Falta activar el acceso «Anónimo» en Firebase.',
  'auth/operation-not-allowed': 'Falta activar el acceso «Anónimo» en Firebase.',
  'unavailable': 'No hay conexión con Firebase. Prueba de nuevo.',
  'auth/network-request-failed': 'No hay conexión con Firebase. Prueba de nuevo.',
  'unauthenticated': 'La sesión venció: cierra y vuelve a abrir la app.'
};
const saveErr = c => SAVE_ERR[c] || t('No se pudo guardar ({0})', c);
// app instalada en el iPhone: ahí el acceso con Google no puede volver a la app, así que no se ofrece
const IOS_APP = navigator.standalone === true;
function cloudStatusHTML() {
  const u = CLOUD.user, last = LS.get('cloud.last', 0);
  const who = !u ? (navigator.onLine ? 'Conectando…' : 'Sin conexión: se guardará cuando vuelva internet')
    : u.anon ? 'Usuario anónimo de este teléfono'
    : `Cuenta: <b data-noi18n>${esc(u.email || 'Google')}</b>`;
  return `<div class="bk-card" id="cl-st"><div class="t">${CLOUD.busy ? 'Guardando…' : last ? 'Guardado en la nube: ' + clWhen(last) : 'Todavía no se guardó nada en la nube'}</div><small>${who}</small>${CLOUD.err && !CLOUD.busy ? `<small style="color:var(--work)">${esc(saveErr(CLOUD.err))}</small>` : ''}</div>`;
}
// ¿tiene cuenta (correo o Google)? se recuerda para decidir los avisos aunque Firebase todavía no haya cargado
const hasAcct = () => !!LS.get('cloud.acct', '');
function cloudUI() {
  const u = CLOUD.user;
  if (u) { const was = hasAcct(); if (u.anon) LS.del('cloud.acct'); else LS.set('cloud.acct', u.email || 'google'); if (was !== hasAcct()) { try { renderBkRemind(); } catch (e) {} } }
  const st = $('#cl-st'); if (st) st.outerHTML = cloudStatusHTML();
  const pn = $('#pf-cloud-note'); if (pn) pn.innerHTML = cloudNote();
}
function cloudNote() {
  const u = CLOUD.user, last = LS.get('cloud.last', 0);
  return (last ? 'Guardado automático: ' + clWhen(last) + '. ' : 'Guardado automático en la nube. ') + (u && !u.anon ? '' : 'Crea una cuenta para recuperarlo en otro teléfono.');
}
function openCloud() {
  cloudStart();
  const u = CLOUD.user, linked = u && !u.anon;
  sheet(`<div id="cl-acc"><h3>Cuenta y guardado automático</h3>
    <p class="sub">Todos los perfiles (historial, pulso, planes, retos, entrenador y logros) se guardan solos en la nube después de cada entrenamiento.</p>
    ${cloudStatusHTML()}
    <button class="btn ghost small" id="cl-now">Guardar ahora</button>
    ${linked ? `
      <h2>Tu cuenta</h2>
      <p class="note">Para recuperar todo en otro teléfono: Perfil → Cuenta y guardado automático → «Ya tengo cuenta», con <b data-noi18n>${esc(u.email || 'Google')}</b>.</p>
      <button class="btn ghost small" id="cl-out">Cerrar sesión</button>`
    : `
      <h2>Crea tu cuenta</h2>
      <p class="note">Ahora se guarda con un usuario anónimo de este teléfono: si borras la app o cambias de teléfono, no hay forma de recuperarlo. Crea una cuenta y todo queda sincronizado entre tus dispositivos.</p>
      <button class="btn" id="cl-new">Crear cuenta</button><div class="gap"></div>
      <button class="btn ghost" id="cl-in">Ya tengo cuenta</button>`}
    </div>`, () => {
    $('#cl-now').onclick = async () => { if (!navigator.onLine) { toast('Sin conexión'); return; } if (await cloudPush('now')) toast('Guardado en la nube'); else toast(CLOUD.err ? saveErr(CLOUD.err) : 'No se pudo guardar'); };
    const out = $('#cl-out');
    if (out) out.onclick = async () => {
      if (!(await askApp('Cerrar sesión', 'Los datos de este teléfono no se borran. Se seguirán guardando con un usuario anónimo nuevo hasta que vuelvas a entrar.', 'Cerrar sesión'))) return;
      try { CLOUD.signingOut = true; await FBA.signOut(); CLOUD.user = await FBA.signInAnon(); CLOUD.signingOut = false; LS.del('cloud.hash'); cloudPush(); toast('Sesión cerrada'); } catch (e) { CLOUD.signingOut = false; toast(clErr(e)); }
    };
    const nw = $('#cl-new'); if (nw) nw.onclick = sheetFrom(openCloud, openCloudSignup);
    const inn = $('#cl-in'); if (inn) inn.onclick = sheetFrom(openCloud, openCloudLogin);
  });
}
// crear cuenta: ventana que se abre desde arriba con los campos primero, así el teclado del iPhone
// (que sube desde abajo) nunca los tapa
function openCloudSignup() {
  cloudStart();
  sheet(`<h3>Crea tu cuenta</h3>
    <div class="field"><input id="cl-mail" type="email" inputmode="email" autocomplete="email" placeholder="Correo"></div><div class="gap"></div>
    <div class="field"><input id="cl-pass" type="password" autocomplete="new-password" placeholder="Contraseña (mínimo 6)"></div><div class="gap"></div>
    <div class="field"><input id="cl-pass2" type="password" autocomplete="new-password" placeholder="Repite la contraseña"></div><div class="gap"></div>
    <p class="note auth-msg" id="auth-msg" role="alert"></p>
    <button class="btn" id="cl-link">Crear cuenta</button><div class="gap"></div>
    ${IOS_APP ? '' : `<button class="btn ghost" id="cl-g">Crear cuenta con Google</button>
    <p class="note">Si Google no abre dentro de la app instalada, usa correo y contraseña.</p>`}
    <p class="note">Tus datos se pasan a la cuenta y quedan sincronizados entre tus dispositivos.</p>
    <button class="btn ghost small" id="cl-in">Ya tengo cuenta</button>`, () => {
    const lk = $('#cl-link');
    lk.onclick = async () => {
      const e = $('#cl-mail').value.trim(), p = $('#cl-pass').value;
      if (!e || !p) { authMsg('Escribe correo y contraseña'); return; }
      if (p !== $('#cl-pass2').value) { authMsg('Las contraseñas no coinciden'); $('#cl-pass2').focus(); return; }
      const u = await authTry(lk, 'Creando cuenta…', () => FBA.linkEmail(e, p), x => x && !x.anon);
      if (u) { CLOUD.user = u; cloudUI(); if (SHEET_BACK.length) sheetBack(); else closeSheet(); toast('Listo: cuenta creada'); cloudUI(); cloudPush('now'); }
    };
    const g = $('#cl-g');
    if (g) g.onclick = async () => {
      if (!(await cloudUser())) { toast('Sin conexión'); return; }
      try { CLOUD.user = await FBA.linkGoogle(); closeSheet(); toast('Listo: cuenta creada'); cloudUI(); cloudPush('now'); }
      catch (err) { toast(clErr(err)); }
    };
    $('#cl-in').onclick = sheetFrom(openCloudSignup, openCloudLogin);
  }, false, true);
}
// mensaje que queda a la vista debajo de los campos (el aviso flotante dura poco y se pierde)
function authMsg(m) { const el = $('#auth-msg'); if (el) { el.textContent = t(m); el.classList.toggle('on', !!m); } if (m) toast(m); }
// crear cuenta / entrar: muestra que está trabajando, reintenta una vez si falla la red (en el iPhone el
// primer pedido al volver de segundo plano suele fallar) y, si la respuesta se perdió pero Firebase sí lo
// hizo, lo da por bueno en lugar de pedir que se toque otra vez
async function authTry(btn, busy, fn, okUser) {
  authMsg('');
  if (!(await cloudStart()) && !window.FBA) { authMsg('Sin conexión'); return null; }
  const label = btn.innerHTML; btn.disabled = true; btn.textContent = t(busy);
  const retry = c => !c || c === 'auth/network-request-failed' || c === 'auth/internal-error' || c === 'auth/timeout';
  try {
    for (let i = 0; ; i++) {
      try { return await fn(); }
      catch (err) {
        const now = FBA.user && FBA.user(); if (okUser(now)) return now;
        if (i === 0 && retry(err && err.code)) { await new Promise(r => setTimeout(r, 900)); continue; }
        authMsg(err && err.code && !CL_ERR[err.code] ? t('No se pudo completar ({0})', err.code) : clErr(err));
        return null;
      }
    }
  } finally { if (btn.isConnected) { btn.disabled = false; btn.innerHTML = label; } }
}
// entrar con una cuenta existente (teléfono nuevo o después de borrar la app)
function openCloudLogin() {
  cloudStart();
  sheet(`<h3>Entrar con tu cuenta</h3>
    <div class="field"><input id="cli-mail" type="email" inputmode="email" autocomplete="email" placeholder="Correo"></div><div class="gap"></div>
    <div class="field"><input id="cli-pass" type="password" autocomplete="current-password" placeholder="Contraseña"></div><div class="gap"></div>
    <p class="note auth-msg" id="auth-msg" role="alert"></p>
    <button class="btn" id="cli-go">Entrar</button><div class="gap"></div>
    ${IOS_APP ? '' : '<button class="btn ghost" id="cli-g">Entrar con Google</button><div class="gap"></div>'}
    <button class="btn ghost small" id="cli-forgot">Olvidé mi contraseña</button>
    <p class="note">Después te muestro lo que tienes guardado y eliges si restaurarlo.</p>`, () => {
    const done = u => { CLOUD.user = u; cloudUI(); LS.del('cloud.hash'); closeSheet(); toast('Sesión iniciada'); CLOUD.wantRestore = true; cloudCheck(); };
    $('#cli-go').onclick = async () => {
      const e = $('#cli-mail').value.trim(), p = $('#cli-pass').value;
      if (!e || !p) { authMsg('Escribe correo y contraseña'); return; }
      const u = await authTry($('#cli-go'), 'Entrando…', () => FBA.signInEmail(e, p), x => x && !x.anon && (x.email || '').toLowerCase() === e.toLowerCase());
      if (u) done(u);
    };
    if ($('#cli-g')) $('#cli-g').onclick = async () => {
      if (!(await cloudStart()) && !window.FBA) { toast('Sin conexión'); return; }
      try { done(await FBA.signInGoogle()); } catch (err) { toast(clErr(err)); }
    };
    $('#cli-forgot').onclick = async () => {
      const e = $('#cli-mail').value.trim(); if (!e) { toast('Escribe tu correo arriba'); return; }
      try { await FBA.resetPass(e); toast('Te enviamos un correo para cambiar la contraseña'); } catch (err) { toast(clErr(err)); }
    };
  }, false, true);
}

/* --- cuándo se guarda --- */
const _finishCl = finish;
finish = function (...a) { _finishCl(...a); setTimeout(() => cloudPush(), 1500); };
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') cloudPush(); });
window.addEventListener('online', () => setTimeout(cloudCheck, 1500));
/* --- avisos para crear la cuenta (reemplazan el recordatorio de la copia en archivo) --- */
bkDue = () => false;
const acctDue = () => !!PROFILE && !hasAcct() && Date.now() > LS.get('cloud.snooze', 0);
const acctBanner = (id, closable) => `<div class="banner acct" id="${id}" role="button" tabindex="0"><div class="t"><b>Crea tu cuenta</b><small>Para mantener todo sincronizado entre tus dispositivos</small></div>
  <button class="btn small" data-acct>Crear cuenta</button>${closable ? `<button class="icon-btn acct-x" data-snooze aria-label="Ahora no"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>` : ''}</div>`;
function bindAcct(el) {
  if (!el) return;
  el.onclick = e => {
    if (e.target.closest('[data-snooze]')) { LS.set('cloud.snooze', Date.now() + 3 * 864e5); renderBkRemind(); toast('Te lo recuerdo en unos días'); return; }
    openCloudSignup();
  };
}
renderBkRemind = function () {
  const el = $('#bk-remind'); if (!el) return;
  if (!acctDue()) { el.innerHTML = ''; return; }
  el.innerHTML = acctBanner('acct-home', true); bindAcct($('#acct-home'));
};
// al terminar un entrenamiento (también mancuernas y entrenador inteligente)
const _finishAcct = finish;
finish = function (...a) {
  _finishAcct(...a);
  const d = $('#d-bk'); if (!d) return;
  d.innerHTML = PROFILE && !hasAcct() ? acctBanner('acct-done') + '<div class="gap"></div>' : '';
  bindAcct($('#acct-done'));
};
// al terminar un reto
const _rFinishAcct = rFinish;
rFinish = function (...a) {
  _rFinishAcct(...a);
  const ok = $('#rf-ok'); if (!ok || hasAcct()) return;
  ok.insertAdjacentHTML('beforebegin', acctBanner('acct-reto') + '<div class="gap"></div>');
  bindAcct($('#acct-reto'));
};
if (!window.NO_CLOUD) setTimeout(() => { if (navigator.onLine) cloudCheck(); else cloudStart(); }, 2500);
