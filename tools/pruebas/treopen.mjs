import { chromium } from 'playwright';
const S = process.argv[2];
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'es-AR' });
await c.addInitScript(() => { window.NO_CLOUD = 1; });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack));
const ok = (v, m) => { console.log(v ? 'OK ' : 'FALLA ', m); if (!v) process.exitCode = 1; };
await p.goto('http://localhost:8776/'); await p.waitForTimeout(800);
await p.fill('#ob-name', 'Cris'); await p.click('#ob-go'); await p.waitForTimeout(300);
await p.evaluate(() => PS.set('routines', [{ id: 'r1', n: 'Mixta', r: 15, R: 2, rr: 60, items: [{ id: 'push_ups', m: 'r', v: 15 }], warm: true, cool: true }]));
// dejo elegidas opciones del final y "cierro" la app
await p.evaluate(() => goTo('coach', 'coach', 'mine')); await p.waitForTimeout(200);
await p.evaluate(() => goTo('hist', 'hist', 'friends')); await p.waitForTimeout(200);
await p.reload(); await p.waitForTimeout(1500);
const st = await p.evaluate(() => { const vis = g => [...document.querySelectorAll(`[data-pane^="${g}:"]`)].filter(x => !x.classList.contains('hidden')).map(x => x.dataset.pane + ':' + x.textContent.trim().length); const sel = g => document.querySelector(`.subtabs[data-group="${g}"] [aria-selected=true]`)?.dataset.st; return { view: currentView, coach: vis('coach'), selC: sel('coach') }; });
ok(st.selC === 'smart' && st.coach.length === 1 && st.coach[0].startsWith('coach:smart') && +st.coach[0].split(':').pop() > 50, 'al reabrir: Coach en Int. HIIT con contenido ' + JSON.stringify(st));
await p.click('nav [data-tab=hist]'); await p.waitForTimeout(400);
const h = await p.evaluate(() => [...document.querySelectorAll('[data-pane^="hist:"]')].filter(x => !x.classList.contains('hidden')).map(x => x.dataset.pane + ':' + x.textContent.trim().length));
ok(h[0].startsWith('hist:sum') && h.every(x => /^hist:(sum|prog)/.test(x)), 'Historial en Resumen ' + JSON.stringify(h));
// también si la app se abre en una opción que se dibuja aparte (Mis rutinas)
await p.evaluate(() => { LS.set('tab.coach', 'mine'); }); await p.reload(); await p.waitForTimeout(1500);
ok((await p.evaluate(() => document.querySelector('#smart').textContent.trim().length)) > 50, 'Int. HIIT dibujado tras reabrir aunque estuviera en Mis rutinas');
// texto vacío del editor de rutinas con margen
await p.evaluate(() => openRoutine(null)); await p.waitForTimeout(300);
const pad = await p.evaluate(() => { const n = document.querySelector('#rt-ex .note'), b = document.querySelector('#rt-ex'); const rg = document.createRange(); rg.selectNodeContents(n); const r = rg.getBoundingClientRect(), br = b.getBoundingClientRect(); return { left: Math.round(r.left - br.left), top: Math.round(r.top - br.top) }; });
ok(pad.left >= 12 && pad.top >= 0, 'texto «Todavía no agregaste ejercicios» dentro del recuadro ' + JSON.stringify(pad));
await p.evaluate(() => document.querySelector('#rt-ex').scrollIntoView({ block: 'center' })); await p.waitForTimeout(200);
await p.screenshot({ path: S + '/rt_empty.png' });
console.log(errs); await b.close();
