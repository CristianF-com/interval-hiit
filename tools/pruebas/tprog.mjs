// Progreso de tiempos: dominadas (retos, también «sueltas» y negativas aparte) y peso de mancuernas
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'es-AR' });
await c.addInitScript(() => { window.NO_CLOUD = 1; });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
const ok = (v, m) => console.log((v ? 'OK  ' : 'FALLA ') + m);
await p.goto('http://localhost:8776/'); await p.waitForTimeout(700);
await p.fill('#ob-name', 'Cris'); await p.click('#ob-go'); await p.waitForTimeout(300);
await p.evaluate(() => {
  const day = 864e5, now = Date.now(), H = [];
  const reto = (i, pre, sets, times, extra = {}) => H.push({ at: now - i * day, start: now - i * day - 6e5, secs: 600, full: true, w: { kind: 'reto', reto: 'pullups', ...(pre ? { pre } : {}), title: 'x', sets, times, rounds: [], ...extra }, reps: { dm: 0 } });
  reto(9, 1, [3, 3], [18, 17]); reto(8, 1, [3, 3], [16, 16]);            // negativas
  reto(6, 3, [1, 1, 1], [4, 3.8, 3.6]); reto(4, 3, [1, 1, 1], [3.5, 3.4, 3.3]); reto(2, 0, [3, 2], [9, 6]);   // sueltas y dominadas
  // coach de mancuernas: curl con peso creciente, series que pasaron solas (r[5] = 1)
  const db = (i, kg) => H.push({ at: now - i * day - 3600e3, start: now - i * day - 7200e3, secs: 1500, full: true, w: { kind: 'db', title: 'Mancuernas · A', level: 1, items: [] }, log: [['db_curl', 10, 0, 32000, kg, 1], ['db_curl', 10, 0, 30000, kg, 1], ['db_row', 10, 0, 28000, kg + 2]], reps: {} });
  db(7, 4); db(5, 5); db(3, 6);
  // reto con mancuerna al ritmo de la app: peso sí, ritmo no
  H.push({ at: now - 1 * day, start: now - day - 3e5, secs: 300, full: true, w: { kind: 'reto', reto: 'dbcurl' in RETOS ? 'dbcurl' : 'dbtriceps', kg: 7, mode: 'ritmo', title: 'x', sets: [10, 10], times: [30, 30], rounds: [] }, reps: {} });
  H.sort((a, b) => b.at - a.at); PS.set('history', H);
});
await p.click('[data-tab=hist]'); await p.waitForTimeout(300);
await p.evaluate(() => setSubtab('hist', 'sum')); await p.waitForTimeout(300);
const opts = await p.evaluate(() => [...document.querySelectorAll('#pg-sel option')].map(o => [o.value, o.textContent]));
console.log(JSON.stringify(opts));
const has = re => opts.some(([v, t]) => re.test(t));
ok(has(/^Dominadas · 3 sesiones/), 'dominadas (sueltas + completas) en el ritmo');
ok(has(/^Dominadas negativas · 2/), 'negativas aparte');
ok(has(/Curl.*\(kg\) · 3/), 'curl con mancuerna: peso aunque las series pasaran solas');
ok(has(/Remo.*\(kg\) · 3/), 'remo con mancuerna: peso');
ok(!opts.some(([v]) => v === 'db_curl'), 'sin ritmo de las series que pasaron solas');
await p.selectOption('#pg-sel', opts.find(([v, t]) => /Curl.*\(kg\)/.test(t))[0]); await p.waitForTimeout(300);
const txt = await p.textContent('.pgc'); ok(/6 kg/.test(txt) && /2 kg más/.test(txt), 'gráfica de peso: 6 kg, 2 kg más que al principio');
await p.locator('.pgc').screenshot({ path: (process.env.OUT || '/tmp/inhiit') + '/progreso-kg.png' });
await p.selectOption('#pg-sel', 'pull_ups'); await p.waitForTimeout(300);
ok(/s por repetición/.test(await p.textContent('.pgc')), 'gráfica de ritmo de dominadas');
console.log('errores', errs); await b.close();
