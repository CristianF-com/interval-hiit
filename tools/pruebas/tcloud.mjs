import { chromium } from 'playwright';
// Nube simulada compartida entre "teléfonos" (contextos separados)
const DB = {}, USERS = {}; let N = 0;
const be = (op, a) => {
  switch (op) {
    case 'anon': return { uid: 'anon' + (++N), anon: true, email: '', provider: 'anonymous' };
    case 'linkEmail': { if (USERS[a.e]) throw { code: 'auth/email-already-in-use' }; if (a.p.length < 6) throw { code: 'auth/weak-password' }; USERS[a.e] = { uid: a.uid, p: a.p }; return { uid: a.uid, anon: false, email: a.e, provider: 'password' }; }
    case 'signInEmail': { const u = USERS[a.e]; if (!u || u.p !== a.p) throw { code: 'auth/invalid-credential' }; return { uid: u.uid, anon: false, email: a.e, provider: 'password' }; }
    case 'getMeta': return DB[a.uid] ? DB[a.uid].meta : null;
    case 'getParts': return Array.from({ length: a.n }, (_, i) => DB[a.uid].parts[(a.pre || '') + i]);
    case 'putAll': { const d = DB[a.uid] = DB[a.uid] || { parts: {} }; d.meta = a.meta; a.parts.forEach((x, i) => d.parts[(a.pre || '') + i] = x); for (let i = a.parts.length; i < (a.oldN || 0); i++) delete d.parts[(a.pre || '') + i]; return true; }
  }
};
const MOCK = () => {
  const call = async (op, a) => { const r = await window.be(op, a || {}); if (r && r.__err) throw { code: r.__err }; return r; };
  let cur = JSON.parse(localStorage.getItem('mock.user') || 'null'), cb = null;
  const setU = u => { cur = u; localStorage.setItem('mock.user', JSON.stringify(u)); return u; };
  window.FBA = {
    init(c, onUser) { cb = onUser; setTimeout(() => onUser(cur), 10); },
    user: () => cur,
    signInAnon: async () => setU(await call('anon')),
    linkEmail: async (e, p) => {
      if (window.__failOnce) { window.__failOnce = 0; await new Promise(r => setTimeout(r, 300)); throw { code: 'auth/network-request-failed' }; }
      const u = setU(await call('linkEmail', { e, p, uid: cur.uid }));
      if (window.__lost) { window.__lost = 0; throw { code: 'auth/network-request-failed' }; }
      return u;
    },
    signInEmail: async (e, p) => setU(await call('signInEmail', { e, p })),
    linkGoogle: async () => { throw { code: 'auth/popup-blocked' }; },
    signInGoogle: async () => { throw { code: 'auth/popup-blocked' }; },
    resetPass: async () => true,
    signOut: async () => setU(null),
    _kill: () => { setU(null); cb(null); },
    getMeta: uid => call('getMeta', { uid }),
    getParts: (uid, n, pre) => call('getParts', { uid, n, pre }),
    putAll: (uid, meta, parts, oldN, pre) => call('putAll', { uid, meta, parts, oldN, pre })
  };
};
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const errs = [];
async function phone() {
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', locale: 'es-AR' });
  await c.exposeFunction('be', (op, a) => { try { return be(op, a); } catch (e) { return { __err: e.code || String(e) }; } });
  await c.addInitScript(MOCK);
  const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8776/'); await p.waitForTimeout(600);
  return p;
}
const ok = (c, m) => { console.log(c ? 'OK ' : 'FALLA ', m); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));

// Teléfono A: crea perfil, entrena (simulado con historial), se sube solo
const A = await phone();
await A.fill('#ob-name', 'Cris'); await A.click('#ob-go'); await A.waitForTimeout(300);
await A.evaluate(() => { PS.set('history', [{ at: Date.now(), name: 'Tabata', dur: 600 }]); });
await A.waitForTimeout(2600);           // arranque de la nube (2,5 s)
await A.evaluate(() => cloudPush());
await A.waitForTimeout(400);
const uA = await A.evaluate(() => CLOUD.user && CLOUD.user.uid);
ok(uA && uA.startsWith('anon'), 'A tiene usuario anónimo ' + uA);
ok(DB[uA] && DB[uA].meta.n >= 1 && DB[uA].meta.enc === 'gz', 'A subió sus datos comprimidos');
ok(DB[uA].meta.cur === 'a' && !DB[uA].meta.bak, 'primera copia en el lugar a, sin respaldo todavía');
// la ventana de cuenta
await A.click('#who'); await A.waitForTimeout(200); await A.evaluate(()=>setSubtab('pf','data')); await A.click('#pf-cloud'); await A.waitForTimeout(200);
const st = await A.textContent('#cl-st'); ok(/Guardado en la nube/.test(st) && /anónimo/.test(st), 'estado: ' + st.trim().replace(/\s+/g, ' '));
await A.click('#cl-new'); await A.waitForTimeout(200);
ok(await A.$('.sheet.top #cl-mail') !== null, 'crear cuenta se abre desde arriba');
await A.fill('#cl-mail', 'cris@x.com'); await A.fill('#cl-pass', 'secreta1'); await A.fill('#cl-pass2', 'secreta2'); await A.click('#cl-link'); await A.waitForTimeout(200);
ok(/no coinciden/.test(await A.textContent('#toast')), 'contraseñas distintas avisadas');
await A.fill('#cl-pass', '123'); await A.fill('#cl-pass2', '123'); await A.click('#cl-link'); await A.waitForTimeout(200);
ok(/6 caracteres/.test(await A.textContent('#toast')), 'contraseña corta avisada');
await A.fill('#cl-pass', 'secreta1'); await A.fill('#cl-pass2', 'secreta1'); await A.click('#cl-link'); await A.waitForTimeout(500);
ok(USERS['cris@x.com'] && USERS['cris@x.com'].uid === uA, 'correo vinculado al mismo usuario (datos conservados)');
ok(/cris@x\.com/.test(await A.textContent('#sheet-root')), 'tras crear la cuenta vuelve a Cuenta');
await A.evaluate(() => closeSheet());
await A.click('#who'); await A.waitForTimeout(200); await A.evaluate(()=>setSubtab('pf','data')); await A.click('#pf-cloud'); await A.waitForTimeout(200);
ok(/cris@x\.com/.test(await A.textContent('#cl-st')), 'muestra la cuenta vinculada');
await A.screenshot({ path: (process.env.OUT || '/tmp/inhiit') + '/cl_linked.png' });
await A.evaluate(() => closeSheet());

// Teléfono B (nuevo): entra con la cuenta desde la bienvenida y restaura
const B = await phone();
await B.screenshot({ path: (process.env.OUT || '/tmp/inhiit') + '/cl_onboard.png' });
await B.click('#ob-login'); await B.waitForTimeout(200);
await B.fill('#cli-mail', 'cris@x.com'); await B.fill('#cli-pass', 'mala'); await B.click('#cli-go'); await B.waitForTimeout(200);
ok(/incorrectos/.test(await B.textContent('#toast')), 'contraseña incorrecta avisada');
await B.fill('#cli-pass', 'secreta1'); await B.click('#cli-go'); await B.waitForTimeout(900);
const sh0 = await B.textContent('#sheet-root');
ok(/Qué copia restauras/.test(sh0), 'teléfono nuevo: elige entre la última copia y el respaldo');
await B.click('#sheet-root [data-slot]'); await B.waitForTimeout(500);
const sh = await B.textContent('#sheet-root');
ok(/Restaurar copia/.test(sh) && /Cris/.test(sh), 'B ve qué contiene la nube antes de restaurar');
await B.screenshot({ path: (process.env.OUT || '/tmp/inhiit') + '/cl_restore.png' });
await B.click('#rb-new'); await B.waitForTimeout(1500);
const hB = await B.evaluate(() => PROFILE && PROFILE.name + ':' + PS.get('history', []).length);
ok(hB === 'Cris:1', 'B restauró el perfil con su historial ' + hB);
ok(DB[uA].meta.device !== undefined, 'B volvió a subir tras restaurar');
const devB = await B.evaluate(() => cDev());
ok(DB[uA].meta.device === devB, 'la última subida es de B');

// B entrena: A al volver a abrir ve que hay algo más nuevo y NO pisa la nube
await B.evaluate(() => { const h = PS.get('history', []); h.unshift({ at: Date.now(), name: 'HIIT', dur: 900 }); PS.set('history', h); });
await B.evaluate(() => cloudPush()); await B.waitForTimeout(300);
ok(DB[uA].meta.device === devB, 'B subió su entrenamiento nuevo');
await A.evaluate(() => { const h = PS.get('history', []); h.unshift({ at: Date.now(), name: 'Solo A', dur: 300 }); PS.set('history', h); });
await A.evaluate(() => cloudPush()); await A.waitForTimeout(400);
ok(DB[uA].meta.device === devB, 'A no pisó lo más nuevo de B');
ok(/Hay datos más nuevos/.test(await A.textContent('#sheet-root')), 'A recibe la pregunta');
await A.screenshot({ path: (process.env.OUT || '/tmp/inhiit') + '/cl_offer.png' });
await A.click('#co-mine'); await A.waitForTimeout(500);
const devA = await A.evaluate(() => cDev());
ok(DB[uA].meta.device === devA, '«Quedarme con lo de este teléfono» reemplaza la nube');

// Partes: una copia grande se divide en varias
await A.evaluate(() => { const h = PS.get('history', []); for (let i = 0; i < 4000; i++) h.push({ at: Date.now() - i * 1e6, name: 'x' + Math.random().toString(36), hr: Array.from({ length: 60 }, () => Math.random()) }); PS.set('history', h); });
await A.evaluate(() => cloudPush('now')); await A.waitForTimeout(1500);
ok(DB[uA].meta.n > 1, 'copia grande dividida en ' + DB[uA].meta.n + ' partes');
const back = await A.evaluate(async () => { const m = await FBA.getMeta(CLOUD.user.uid); const j = await cloudFetch(CLOUD.user, m); return j.profiles[0].data.history.length; });
ok(back === await A.evaluate(() => PS.get('history', []).length), 'la copia grande se lee entera: ' + back);
// Firebase borra el anónimo (limpieza de 30 días): se crea otro y se vuelve a subir todo
const C = await phone();
await C.fill('#ob-name', 'Ana'); await C.click('#ob-go'); await C.waitForTimeout(300);
await C.evaluate(() => PS.set('history', [{ at: Date.now(), name: 'Tabata', dur: 600 }]));
await C.waitForTimeout(2600); await C.evaluate(() => cloudPush()); await C.waitForTimeout(400);
const u1 = await C.evaluate(() => CLOUD.user.uid);
await C.evaluate(() => FBA._kill()); await C.waitForTimeout(1500);
const u2 = await C.evaluate(() => CLOUD.user && CLOUD.user.uid);
ok(u2 && u2 !== u1 && DB[u2] && DB[u2].meta.perfiles === 1, 'anónimo borrado → nuevo usuario ' + u2 + ' con los datos subidos de nuevo');
ok(!/Hay datos más nuevos/.test(await C.textContent('#sheet-root')), 'sin preguntas al usuario');
// contraste del subtítulo en el botón naranja
await A.evaluate(() => cloudOffer(CLOUD.user, { updated: Date.now() + 1e6, device: 'otro', resumen: ['x'] }));
await A.waitForTimeout(200);
const col = await A.evaluate(() => { const s = getComputedStyle(document.querySelector('#co-see small')); return s.color + ' ' + s.opacity; });
ok(/rgb\((17, 17, 17|28, 29, 33)\)/.test(col), 'subtítulo del botón oscuro sobre naranja: ' + col);
await A.screenshot({ path: (process.env.OUT || '/tmp/inhiit') + '/cl_offer2.png' });
// avisos de crear cuenta
const D = await phone();
await D.fill('#ob-name', 'Leo'); await D.click('#ob-go'); await D.waitForTimeout(400);
ok(await D.$('#acct-home') === null, 'sin aviso de cuenta en Coach (solo en Historial cuando hay mucho en riesgo)');
ok(await D.$('#bk-remind .banner.bk') === null, 'sin aviso de copia en archivo');
await D.screenshot({ path: (process.env.OUT || '/tmp/inhiit') + '/acct_home.png' });
await D.evaluate(() => { startWorkout(generate()); }).catch(e => console.log('start', e.message)); await D.waitForTimeout(400);
await D.evaluate(() => { P.paused = false; while (P.running) skipNow(); }).catch(e => console.log('skip', e.message)); await D.waitForTimeout(500);
ok(await D.$('#acct-done') !== null, 'aviso al terminar el primer entrenamiento');
await D.screenshot({ path: (process.env.OUT || '/tmp/inhiit') + '/acct_done.png' });
await D.waitForTimeout(1200); await D.evaluate(() => { const a = document.getElementById('award-root'); if (a) a.innerHTML = ''; });
await D.click('#acct-done button[data-acct]'); await D.waitForTimeout(200);
await D.fill('#cl-mail', 'leo@x.com'); await D.fill('#cl-pass', 'secreta1'); await D.fill('#cl-pass2', 'secreta1'); await D.click('#cl-link'); await D.waitForTimeout(600);
ok(await D.$('#acct-home') === null, 'con cuenta creada desaparece el aviso del inicio');
ok(/cuenta creada/.test(await D.textContent('#toast')), 'toast: ' + await D.textContent('#toast'));
// falla de red en el primer intento: con un solo toque igual crea la cuenta
const E = await phone();
await E.fill('#ob-name', 'Eva'); await E.click('#ob-go'); await E.waitForTimeout(2800);
await E.evaluate(() => { window.__failOnce = 1; openCloudSignup(); }); await E.waitForTimeout(200);
await E.fill('#cl-mail', 'eva@x.com'); await E.fill('#cl-pass', 'secreta1'); await E.fill('#cl-pass2', 'secreta1');
await E.click('#cl-link'); await E.waitForTimeout(100);
const busy = await E.evaluate(() => { const b = $('#cl-link'); return b && b.disabled + ' ' + b.textContent; });
ok(/true Creando cuenta/.test(busy), 'botón muestra que está trabajando: ' + busy);
await E.waitForTimeout(1600);
ok(USERS['eva@x.com'] && (await E.evaluate(() => CLOUD.user && !CLOUD.user.anon)), 'con falla de red en el primer intento, un solo toque crea la cuenta');
// la respuesta se pierde pero la cuenta sí se creó: no pide tocar de nuevo
const F = await phone();
await F.fill('#ob-name', 'Flo'); await F.click('#ob-go'); await F.waitForTimeout(2800);
await F.evaluate(() => { window.__lost = 1; openCloudSignup(); }); await F.waitForTimeout(200);
await F.fill('#cl-mail', 'flo@x.com'); await F.fill('#cl-pass', 'secreta1'); await F.fill('#cl-pass2', 'secreta1');
await F.click('#cl-link'); await F.waitForTimeout(800);
ok((await F.evaluate(() => !$('#cl-link') && CLOUD.user && !CLOUD.user.anon)), 'respuesta perdida pero cuenta creada: se da por buena');
// error que no se arregla reintentando: queda escrito debajo de los campos
await F.evaluate(() => { CLOUD.user = { uid: 'z', anon: true }; openCloud(); }); await F.waitForTimeout(200);
// respaldo: pasan 4 días → la copia actual queda como respaldo y la nueva va al otro lugar
const G = await phone();
await G.fill('#ob-name', 'Gus'); await G.click('#ob-go'); await G.waitForTimeout(2800);
await G.evaluate(() => { PS.set('history', [{ at: Date.now(), name: 'Uno', secs: 600, w: { kind: 'plan' } }]); return cloudPush('now'); }); await G.waitForTimeout(300);
const uG = await G.evaluate(() => CLOUD.user.uid);
await G.evaluate(() => { const h = PS.get('history'); h.unshift({ at: Date.now(), name: 'Dos', secs: 600, w: { kind: 'plan' } }); PS.set('history', h); return cloudPush(); }); await G.waitForTimeout(300);
ok(DB[uG].meta.cur === 'b' && DB[uG].meta.bak === 'a', 'el segundo guardado deja la primera copia como respaldo');
const bak0 = JSON.stringify(DB[uG].meta.s.a);
await G.evaluate(() => { const h = PS.get('history'); h.unshift({ at: Date.now(), name: 'Tres', secs: 600, w: { kind: 'plan' } }); PS.set('history', h); return cloudPush(); }); await G.waitForTimeout(300);
ok(DB[uG].meta.cur === 'b' && DB[uG].meta.bak === 'a' && JSON.stringify(DB[uG].meta.s.a) === bak0 && DB[uG].meta.s.b.resumen[0].includes('3 entrenamientos'), 'dentro de los 3 días se actualiza la última y el respaldo no cambia');
DB[uG].meta.s.b.since -= 4 * 864e5;
await G.evaluate(() => { const h = PS.get('history'); h.unshift({ at: Date.now(), name: 'Cuatro', secs: 600, w: { kind: 'plan' } }); PS.set('history', h); return cloudPush(); }); await G.waitForTimeout(300);
ok(DB[uG].meta.cur === 'a' && DB[uG].meta.bak === 'b' && DB[uG].meta.s.b.resumen[0].includes('3 entrenamientos'), 'a los 3 días: copia nueva y la anterior (3 entrenamientos) queda de respaldo');
ok(DB[uG].parts.a0 && DB[uG].parts.b0, 'las dos copias están en la nube');
// se "daña" lo del teléfono y se sube; el respaldo sigue intacto
await G.evaluate(() => { PS.set('history', []); return cloudPush(); }); await G.waitForTimeout(300);
ok(DB[uG].meta.cur === 'a' && DB[uG].meta.s.b.resumen[0].includes('3 entrenamientos'), 'el respaldo conserva lo anterior (' + DB[uG].meta.s.b.resumen[0] + ')');
// elegir el respaldo para restaurar
await G.evaluate(() => cloudRestore()); await G.waitForTimeout(500);
ok(/Qué copia restauras/.test(await G.textContent('#sheet-root')), 'deja elegir entre la última copia y el respaldo');
await G.screenshot({ path: (process.env.OUT || '/tmp/inhiit') + '/bak_choose.png' });
await G.click('[data-slot=b]'); await G.waitForTimeout(500);
ok(/Restaurar copia/.test(await G.textContent('#sheet-root')), 'muestra qué contiene el respaldo');
await G.click('#rb-rep'); await G.waitForTimeout(1500);
ok(await G.evaluate(() => PS.get('history', []).length) === 3, 'restaurado el respaldo: 3 entrenamientos');
ok(DB[uG].meta.cur === 'a' && DB[uG].meta.bak === 'b' && DB[uG].meta.s.b.resumen[0].includes('3 entrenamientos') && DB[uG].meta.s.a.resumen[0].includes('3 entrenamientos'), 'al subir lo restaurado, el respaldo no se pisa');
console.log('errores', errs);
await b.close();
