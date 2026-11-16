// Datos: historial en la base local (IndexedDB), paso desde localStorage, fotos en la copia y registro de diagnóstico
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'es-AR' });
await c.addInitScript(() => { window.NO_CLOUD = 1; });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
const ok = (v, m) => console.log((v ? 'OK  ' : 'FALLA ') + m);
await p.goto('http://localhost:8776/'); await p.waitForTimeout(800);
await p.fill('#ob-name', 'Cris'); await p.click('#ob-go'); await p.waitForTimeout(300);
ok(await p.evaluate(() => KV.on), 'base local activa');
// 1) historial viejo en localStorage (como en versiones anteriores) → se pasa a la base al recargar
const pid = await p.evaluate(() => PROFILE.id);
await p.evaluate(pid => { const H = []; for (let i = 0; i < 40; i++) H.push({ at: Date.now() - i * 864e5, secs: 900, full: true, w: { kind: 'smart', title: 'HIIT' }, reps: {} }); localStorage.setItem('intervalo.p.' + pid + '.history', JSON.stringify(H)); }, pid);
await p.reload(); await p.waitForTimeout(1200);
const m = await p.evaluate(pid => ({ n: PS.get('history', []).length, ls: localStorage.getItem('intervalo.p.' + pid + '.history'), mem: !!KV.mem['intervalo.p.' + pid + '.history'] }), pid);
ok(m.n === 40 && m.ls === null && m.mem, 'historial pasado de localStorage a la base ' + JSON.stringify({ n: m.n, ls: m.ls && m.ls.length }));
// 2) sobrevive a una recarga (se lee de la base) y entra en la lista de claves (copias y nube)
await p.evaluate(() => { const h = PS.get('history', []); h.unshift({ at: Date.now(), secs: 600, full: true, w: { kind: 'smart', title: 'HIIT' }, reps: {} }); saveHistory(h); });
await p.reload(); await p.waitForTimeout(1200);
ok(await p.evaluate(() => PS.get('history', []).length) === 41, 'después de recargar sigue todo (41)');
ok(await p.evaluate(pid => LS.keys().includes('p.' + pid + '.history'), pid), 'el historial figura en las claves');
ok(await p.evaluate(() => backupAll().profiles[0].data.history.length) === 41, 'la copia incluye el historial');
// 3) mucho más de lo que entra en localStorage
const big = await p.evaluate(async () => { const h = PS.get('history', []); const pad = 'x'.repeat(3000); for (let i = 0; i < 2000; i++) h.push({ at: Date.now() - (i + 60) * 864e5, secs: 600, full: true, w: { kind: 'smart', title: 'HIIT' }, reps: {}, log: [['squats', 10, 0, 30000, 0, 0, pad]] }); const r = saveHistory(h); await KV.flush(); return r; });
await p.reload(); await p.waitForTimeout(2000);
const nb = await p.evaluate(() => [PS.get('history', []).length, PS.get('history', []).filter(x => x.log).length]);
ok(big && nb[0] === 2000 && nb[1] >= 1900, 'unos 6 MB de historial entran completos, sin perder detalle ' + nb);
// 3b) seguro: si la escritura en la base se corta (la app se cerró), las últimas sesiones vuelven del localStorage
const jr = await p.evaluate(async () => {
  const key = NS + 'p.' + PROFILE.id + '.history', h = PS.get('history', []), at = Date.now() + 5000;
  h.unshift({ at, secs: 700, full: true, w: { kind: 'smart', title: 'HIIT' }, reps: {} });
  KV.put = () => null;                       // la base no confirma nada (como si se cerrara la app)
  LS.set('p.' + PROFILE.id + '.history', h);
  return [at, !!localStorage.getItem(key + '.nuevas')];
});
await p.reload(); await p.waitForTimeout(2000);
const jr2 = await p.evaluate(at => [PS.get('history', [])[0].at === at, PS.get('history', []).length, localStorage.getItem(NS + 'p.' + PROFILE.id + '.history.nuevas')], jr[0]);
ok(jr[1] && jr2[0] && jr2[1] === 2001, 'la última sesión se recupera del seguro ' + JSON.stringify(jr2.slice(0, 2)));
await p.evaluate(() => KV.flush()); 
// 4) fotos: la versión reducida va en la copia; en un teléfono nuevo se recrea
await p.evaluate(async () => {
  const c = document.createElement('canvas'); c.width = 1200; c.height = 1600; const g = c.getContext('2d'); g.fillStyle = '#c33'; g.fillRect(0, 0, 1200, 1600); g.fillStyle = '#fff'; g.fillRect(200, 300, 400, 600);
  const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.9));
  await phPut({ id: 'f1', pid: PROFILE.id, at: Date.now() - 864e5, blob });
  await phSync();
});
const bk = await p.evaluate(() => { const ph = backupAll().profiles[0].data.photos || []; return [ph.length, ph[0] && ph[0].d.slice(0, 23), ph[0] && ph[0].d.length]; });
ok(bk[0] === 1 && bk[1] === 'data:image/jpeg;base64,' && bk[2] < 150000, 'la copia lleva la foto reducida ' + JSON.stringify(bk));
const copia = await p.evaluate(() => JSON.stringify(backupAll()));
const c2 = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', locale: 'es-AR' }); await c2.addInitScript(() => { window.NO_CLOUD = 1; });
const q = await c2.newPage(); q.on('pageerror', e => errs.push(e.message));
await q.goto('http://localhost:8776/'); await q.waitForTimeout(800);
await q.evaluate(j => importBackup(JSON.parse(j), true), copia); await q.waitForTimeout(3500); await q.evaluate(() => KV.flush());
const res = await q.evaluate(async () => { const P = await phAll(); return [PS.get('history', []).length, P.length, P[0] && P[0].blob.size > 1000]; });
ok(res[0] === 2001 && res[1] === 1 && res[2], 'teléfono nuevo: historial y foto restaurados ' + JSON.stringify(res));
// 5) registro de diagnóstico
await p.evaluate(() => { diag('prueba', 'hola'); });
const d = await p.evaluate(() => diagText());
ok(/registro de diagnóstico/.test(d) && /inicio/.test(d) && /prueba hola/.test(d) && !/smart|secs/.test(d), 'registro con inicio y eventos, sin datos de entrenamientos');
await p.click('#who'); await p.waitForTimeout(300); await p.click('.subtabs[data-group=pf] [data-st=set]'); await p.waitForTimeout(300);
ok(await p.isVisible('#pf-diag'), 'botón «Compartir el registro» en Ajustes');
console.log('errores', errs); await b.close();
