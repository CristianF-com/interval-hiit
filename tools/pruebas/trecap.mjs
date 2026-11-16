// Resumen semanal: tarjeta en Coach, detalle con máximos, peso y grupo, imagen, semanas anteriores; marca de versión en Amigos
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'es-AR' });
await c.addInitScript(() => { window.NO_CLOUD = 1; });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
const ok = (v, m) => console.log((v ? 'OK  ' : 'FALLA ') + m);
const OUT = process.env.OUT || '/tmp/inhiit';
await p.goto('http://localhost:8776/'); await p.waitForTimeout(800);
await p.fill('#ob-name', 'Cris'); await p.click('#ob-go'); await p.waitForTimeout(300);
ok(await p.evaluate(() => !document.querySelector('#recap-card .recap-card')), 'sin sesiones no hay tarjeta');
await p.evaluate(() => {
  const now = weekKey(Date.now()), ws = wkPrev(now), ws2 = wkPrev(ws), H = [];
  const add = (at, secs, w, extra = {}) => H.push({ at, start: at - secs * 1000, secs, full: true, w, reps: {}, ...extra });
  // semana anterior a la pasada: 2 sesiones de 10 min
  add(ws2 + 1 * DAY + 3600e3, 600, { kind: 'smart', title: 'HIIT' }); add(ws2 + 3 * DAY + 3600e3, 600, { kind: 'smart', title: 'HIIT' });
  // mancuernas: curl 5 kg antes, 7 kg la semana pasada
  add(ws2 + 2 * DAY + 7200e3, 1500, { kind: 'db', title: 'Mancuernas' }, { log: [['db_curl', 10, 0, 30000, 5]] });
  add(ws2 + 4 * DAY + 7200e3, 1500, { kind: 'db', title: 'Mancuernas' }, { log: [['db_curl', 10, 0, 30000, 5]] });
  add(ws + 1 * DAY + 7200e3, 1500, { kind: 'db', title: 'Mancuernas' }, { log: [['db_curl', 10, 0, 30000, 7]] });
  // semana pasada: 3 sesiones más
  add(ws + 0 * DAY + 3600e3, 1800, { kind: 'smart', title: 'HIIT' }); add(ws + 2 * DAY + 3600e3, 1200, { kind: 'smart', title: 'HIIT' }); add(ws + 4 * DAY + 3600e3, 900, { kind: 'timer', title: 'Correr' }, { kcal: 120 });
  H.sort((a, b) => b.at - a.at); PS.set('history', H);
  PS.set('retos', { pushups: { k: 0, stage: 1, day: 4, best: 15, log: [{ at: ws2 + DAY, sets: [10, 8] }, { at: ws + 3 * DAY, sets: [15, 9] }] } });
  PS.set('frWeek', { ABC: { cur: { wk: ws, at: ws + 6 * DAY, n: 'Familia', rows: [{ me: false, s: 5, m: 150 }, { me: true, s: 4, m: 98 }, { me: false, s: 1, m: 20 }] } } });
  S.goal = { k: 'n', v: 3 }; save();
  renderGoal();
});
await p.waitForTimeout(300);
const card = await p.textContent('#recap-card').catch(() => '');
ok(/Tu semana pasada/.test(card) && /4 sesiones/.test(card) && /90 min/.test(card), 'tarjeta en Coach: ' + card.replace(/\s+/g, ' ').trim());
await p.screenshot({ path: OUT + '/recap-card.png', clip: { x: 0, y: 0, width: 390, height: 520 } });
await p.click('#rc-open'); await p.waitForTimeout(400);
const sh = (await p.textContent('#sheet-root')).replace(/\s+/g, ' ');
ok(/Meta cumplida/.test(sh), 'meta cumplida');
ok(/Máximo nuevo en Flexiones: 15 \(\+5\)/.test(sh), 'máximo nuevo en el reto');
ok(/7 kg \(2 kg más\)/.test(sh), 'más peso con mancuerna');
ok(/2º de 3 en Familia/.test(sh), 'puesto en el grupo');
ok(/20 min más que la semana anterior/.test(sh), 'comparación con la semana anterior');
await p.screenshot({ path: OUT + '/recap-sheet.png' });
const img = await p.evaluate(async () => { const b = await recapImage(weekRecap(wkPrev(weekKey(Date.now())))); return b && b.size; });
ok(img > 20000, 'imagen para compartir ' + img);
await p.click('#rc-prev'); await p.waitForTimeout(300);
ok(/3 sesiones|sesiones/.test(await p.textContent('#sheet-root')) && /Resumen de la semana/.test(await p.textContent('#sheet-root')), 'semana anterior navegable');
await p.evaluate(() => closeSheet());
await p.click('#rc-x'); await p.waitForTimeout(200);
ok(await p.evaluate(() => !document.querySelector('#recap-card .recap-card')), 'cerrar la tarjeta la oculta hasta la semana siguiente');
await p.click('[data-tab=hist]'); await p.waitForTimeout(200); await p.evaluate(() => setSubtab('hist', 'sum')); await p.waitForTimeout(200);
await p.click('#recap-btn'); await p.waitForTimeout(300);
ok(/Tu semana pasada/.test(await p.textContent('#sheet-root')), 'se abre desde Historial → Resumen');
await p.evaluate(() => closeSheet());
// marca de versión vieja en Amigos
const fr = await p.evaluate(() => [frOld({ x: {} }, APP_V, false), frOld({ x: { v: APP_V } }, APP_V, false), frOld({ x: { v: APP_V - 1 } }, APP_V, true), frExtra().v === APP_V]);
ok(/actualizar/.test(fr[0]) && fr[1] === '' && /versión nueva/.test(fr[2]) && fr[3], 'marca de versión vieja en Amigos');
console.log('errores', errs); await b.close();
