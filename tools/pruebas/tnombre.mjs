// nombre del ejercicio largo: se achica para entrar en dos líneas sin cortar palabras
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'es-AR' });
await c.addInitScript(() => { window.NO_CLOUD = 1; });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
const ok = (v, m) => console.log((v ? 'OK  ' : 'FALLA ') + m); const D = process.argv[2];
await p.goto('http://localhost:8776/'); await p.waitForTimeout(800);
await p.fill('#ob-name', 'Cris'); await p.click('#ob-go'); await p.waitForTimeout(400);
const meas = () => p.evaluate(() => { const el = document.querySelector('#p-name'), cs = getComputedStyle(el); return { t: el.textContent, fs: parseFloat(cs.fontSize), lines: Math.round(el.clientHeight / parseFloat(cs.lineHeight)), fit: document.querySelector('#p-cue').getBoundingClientRect().bottom <= document.querySelector('#player .p-bottom').getBoundingClientRect().top }; });
const go = id => p.evaluate(id => { const w = { kind: 'coach', title: 'x', items: [{ id, t: 'time', v: 30 }] }; const g = generate(); const i = g.items ? 0 : 0; const w2 = generate(); w2.items = w2.items || []; startWorkout(w2); const k = P.tl.findIndex(s => s.k === 'work'); P.tl[k].ex = id; step(k, true); }, id);
await go('squats'); await p.waitForTimeout(300); const a = await meas(); ok(a.lines === 1 && a.fs > 30, 'nombre corto queda grande ' + JSON.stringify(a));
await go('knee_push_up_shoulder_taps'); await p.waitForTimeout(300); const m = await meas();
ok(m.lines <= 2 && m.fs < a.fs, 'nombre largo se achica a 2 líneas ' + JSON.stringify(m));
ok(m.fit, 'entra todo en pantalla'); await p.screenshot({ path: D + '/nombre-largo.png' });
await go('low_side_plank_leg_lifts'); await p.waitForTimeout(300); ok((await meas()).lines <= 2, 'otro largo');
ok(!errs.length, 'sin errores ' + errs.join(' | ')); await b.close();
