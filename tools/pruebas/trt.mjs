import { chromium } from 'playwright';
const S = process.argv[2];
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'es-AR' });
await c.addInitScript(() => { window.NO_CLOUD = 1; });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack));
const ok = (v, m) => { console.log(v ? 'OK ' : 'FALLA ', m); if (!v) process.exitCode = 1; };
await p.goto('http://localhost:8776/'); await p.waitForTimeout(800);
await p.fill('#ob-name', 'Cris'); await p.click('#ob-go'); await p.waitForTimeout(300);
await p.evaluate(() => goTo('coach', 'coach', 'mine')); await p.waitForTimeout(300);
await p.click('#rt-new'); await p.waitForTimeout(200);
await p.fill('#rt-n', 'Mixta');
const add = async q => { await p.click('#rt-add'); await p.waitForTimeout(200); await p.fill('#pk-q', q); await p.waitForTimeout(150); await p.click('#pk-l [data-pk]'); await p.waitForTimeout(250); };
await add('flexiones'); await add('plancha'); await add('sentadilla');
const items = await p.evaluate(() => [...document.querySelectorAll('#rt-ex .rt-item')].map(r => r.querySelector('b').textContent + ' | ' + r.querySelector('[aria-pressed=true]').textContent + ' ' + r.querySelector('[data-v]').value));
console.log(items);
// la primera: repeticiones 15 · la segunda: tiempo 45 · la tercera: cambio a tiempo 30
await p.click('#rt-ex [data-mode="0"][data-m="r"]'); await p.fill('#rt-ex [data-v="0"]', '15');
await p.click('#rt-ex [data-mode="1"][data-m="t"]'); await p.fill('#rt-ex [data-v="1"]', '45');
await p.click('#rt-ex [data-mode="2"][data-m="t"]'); await p.fill('#rt-ex [data-v="2"]', '30');
await p.fill('#rt-r', '15'); await p.fill('#rt-R', '2');
await p.waitForTimeout(200); await p.screenshot({ path: S + '/rt_editor.png' });
await p.click('#rt-save'); await p.waitForTimeout(300);
const saved = await p.evaluate(() => PS.get('routines')[0]);
ok(saved.items.map(i => i.m + i.v).join(',') === 'r15,t45,t30' && saved.r === 15 && saved.R === 2, 'guardada con cada ejercicio a su manera: ' + JSON.stringify(saved.items));
// vista previa
await p.click('[data-rtp="0"]'); await p.waitForTimeout(400);
const tg = await p.$$eval('#pv-list .tgt', x => x.map(e => e.textContent));
ok(tg.join(',') === '×15,45s,30s', 'vista previa con ×15 / 45s / 30s: ' + tg);
await p.screenshot({ path: S + '/rt_preview.png' });
// reproductor: los pasos de trabajo respetan cada modo
const steps = await p.evaluate(() => buildTimeline(W).filter(s => s.k === 'work' && !s.soft).slice(0, 3).map(s => (s.reps ? 'r' + s.reps : 't' + s.dur)));
ok(steps.join(',') === 'r15,t45,t30', 'reproductor: ' + steps);
await p.click('#start'); await p.waitForTimeout(300);
await p.evaluate(() => step(P.tl.findIndex(s => s.k === 'work' && s.reps))); await p.waitForTimeout(500);
await p.screenshot({ path: S + '/rt_player_reps.png' });
await p.evaluate(() => { P.running = false; clearInterval(P.timer); document.querySelector('#player').classList.add('hidden'); document.body.style.overflow = ''; PS.del('session'); });
// rutina vieja (todo por tiempo) se convierte sola
const old = await p.evaluate(() => { PS.set('routines', [{ id: 'o', n: 'Vieja', w: 35, r: 20, R: 2, rr: 50, ex: ['squats', 'push_ups'], warm: false, cool: false }]); return rtNorm(PS.get('routines')[0]); });
ok(old.items.map(i => i.m + i.v).join(',') === 't35,t35', 'rutina vieja convertida: ' + JSON.stringify(old.items));
// link compartido conserva el modo de cada uno
await p.evaluate(s => PS.set('routines', [s]), saved);
const link = await p.evaluate(() => rtLink(PS.get('routines')[0]));
await p.evaluate(() => PS.set('routines', []));
await p.goto(link); await p.waitForTimeout(900);
const sh = await p.$$eval('#sheet-root .tgt', x => x.map(e => e.textContent));
ok(sh.join(',') === '15 rep,45 s,30 s', 'link compartido: ' + sh);
await p.screenshot({ path: S + '/rt_import2.png' });
console.log(errs); await b.close();
