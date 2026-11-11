import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'es-AR' });
await c.addInitScript(() => { window.NO_CLOUD = 1; });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
const ok = (v, m) => console.log((v ? 'OK  ' : 'FALLA ') + m);
await p.goto('http://localhost:8776/'); await p.waitForTimeout(800);
await p.fill('#ob-name', 'Cris'); await p.click('#ob-go'); await p.waitForTimeout(400);
ok(await p.evaluate(() => S.sideGap === 4), 'pausa por defecto 4 s');
const r = await p.evaluate(() => {
  for (let k = 0; k < 200; k++) { const w = generate(); const tl = buildTimeline(w); const i = tl.findIndex(s => s.k === 'work' && !s.reps && ex(s.ex).s); if (i >= 0) { startWorkout(w); step(i, true); return [i, ex(tl[i].ex).n, tl[i].dur]; } }
  return null; });
ok(!!r, 'entrenamiento con ejercicio por lado ' + JSON.stringify(r));
const dur = r[2];
await p.evaluate(d => { P.endAt = performance.now() + d * 500 - 50; tick(); }, dur);
const a = await p.evaluate(() => [P.sw, document.querySelector('#p-num').textContent, document.querySelector('#p-side').textContent]);
ok(a[0] > 3000 && /^4s$/.test(a[1]) && /Cambia de lado/.test(a[2]), 'a la mitad: pausa de cambio ' + JSON.stringify(a));
await p.screenshot({ path: process.argv[2] + '/gap.png' });
const rem0 = await p.evaluate(() => P.endAt - performance.now());
await p.evaluate(() => { P.last -= 2000; tick(); });
const rem1 = await p.evaluate(() => P.endAt - performance.now());
ok(Math.abs(rem1 - rem0 - 2000) < 300, 'el reloj del ejercicio no corre durante el cambio (se corre el final 2 s) ' + Math.round(rem0) + ' ' + Math.round(rem1));
await p.evaluate(() => { P.last -= 2500; tick(); });
const b2 = await p.evaluate(() => [P.sw, document.querySelector('#p-side').textContent]);
ok(b2[0] === 0 && /izquierdo/.test(b2[1]), 'después sigue con el lado izquierdo ' + JSON.stringify(b2));
// opción en el menú de pausa
await p.evaluate(() => { step(P.i - 1 >= 0 ? P.i - 1 : 0, true); }); await p.click('#p-close').catch(() => {}); await p.waitForTimeout(300);
const pm = await p.evaluate(() => !!document.querySelector('#pm-gap'));
ok(pm, 'opción en el menú de pausa');
if (pm) { await p.click('#pm-gap [data-v="0"]'); ok(await p.evaluate(() => S.sideGap === 0), 'se puede quitar la pausa'); await p.screenshot({ path: process.argv[2] + '/gap-menu.png' }); }
await p.click('#p-menu [data-m=go]').catch(() => {});
await p.evaluate(() => { step(P.tl.findIndex(s => s.k === 'work' && !s.reps && ex(s.ex).s), true); P.endAt = performance.now() + cur().dur * 500 - 50; tick(); });
ok(await p.evaluate(() => P.sw === 0 && P.half), 'sin pausa si está en «No»');
console.log('errores', errs); await b.close();
