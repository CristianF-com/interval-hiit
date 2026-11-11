import { chromium } from 'playwright';
const S = process.argv[2];
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const ok = (v, m) => { console.log(v ? 'OK ' : 'FALLA ', m); if (!v) process.exitCode = 1; };
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'es-AR' });
await c.addInitScript(() => { window.NO_CLOUD = 1; setInterval(() => { const b = document.querySelector('#aw-ok'); if (b) b.click(); }, 80); });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack));
await p.goto('http://localhost:8776/'); await p.waitForTimeout(700);
await p.fill('#ob-name', 'C'); await p.click('#ob-go'); await p.waitForTimeout(300);
await p.click('[data-tab=plans]'); await p.waitForTimeout(300);
await p.click('[data-abl="1"]'); await p.waitForTimeout(300);
await p.click('#abs-ok'); await p.waitForTimeout(400);
ok(await p.$('#abp-go'), 'plan creado');
const info = await p.evaluate(() => { const st = getAbs(); return { v: PROFILE.variant, day: st.day, items: abItems(st).map(i => [i.id, i.cnt, i.sets]) }; });
console.log(JSON.stringify(info));
ok(info.items.length === 3 && info.items[0][1] === (info.v === 'm' ? 8 : 6), 'día 1 nivel 1: 3 ejercicios con las reps de la versión ' + info.v);
// empezar
await p.click('#abp-go'); await p.waitForTimeout(400);
await p.click('#abw-go'); await p.waitForTimeout(600);
const tl = await p.evaluate(() => P.tl.filter(s => s.k === 'work' && !s.soft).map(s => [s.ex, s.cnt, s.dur]));
ok(tl.length === 9 && tl[0][1] === info.items[0][1], 'línea de tiempo: 9 series guiadas ' + JSON.stringify(tl[0]));
// ir a la primera serie y ver el contador de repeticiones
await p.evaluate(() => { const i = P.tl.findIndex(s => s.k === 'work' && s.cnt); step(i, true); }); await p.waitForTimeout(1500);
const num = await p.textContent('#p-num'); ok(/\d+\s*reps quedan/.test(num), 'contador de repeticiones: ' + num);
// terminar todo
await p.evaluate(() => { P.activeMs = 400000; step(P.tl.length); }); await p.waitForTimeout(800);
let st = await p.evaluate(() => getAbs());
ok(st.day === 1 && st.sessions === 1, 'avanza al día 2');
await p.click('[data-fb="hard"]'); await p.waitForTimeout(300);
st = await p.evaluate(() => getAbs());
ok(st.day === 0 && st.k < 1, 'difícil: repite el día con menos repeticiones (k=' + st.k + ')');
await p.click('[data-fb="easy"]'); await p.waitForTimeout(300);
st = await p.evaluate(() => getAbs());
ok(st.day === 1 && st.k > 1, 'cambiar a fácil: avanza y sube (k=' + st.k + ')');
const hist = await p.evaluate(() => PS.get('history', [])[0]);
ok(hist.w.kind === 'abs', 'queda en el historial como abdominales');
await p.evaluate(() => closeDone && closeDone()).catch(() => {});
// calendario
const ag = await p.evaluate(() => { const a = buildAgenda(); return Object.entries(a).filter(([k, v]) => v.some(x => x.type === 'abs')).map(([k, v]) => k).slice(0, 6); });
ok(ag.length >= 6, 'días en el calendario: ' + ag.join(', '));
// nivel completado
await p.evaluate(() => { const s = getAbs(); s.day = 9; setAbs(s); });
await p.evaluate(() => startWorkout(abWorkout(getAbs()))); await p.waitForTimeout(300);
await p.evaluate(() => { P.activeMs = 400000; step(P.tl.length); }); await p.waitForTimeout(600);
await p.click('[data-fb="ok"]'); await p.waitForTimeout(300);
st = await p.evaluate(() => getAbs()); ok(st.levelDone, 'nivel completado');
await p.evaluate(() => { document.querySelector('.done').classList.add('hidden'); show('plans'); }); await p.waitForTimeout(300);
ok(await p.$('#abp-next'), 'ofrece pasar al nivel intermedio');
await p.click('#abp-next'); await p.waitForTimeout(300);
st = await p.evaluate(() => getAbs()); ok(st.level === 2 && st.day === 0, 'nivel intermedio día 1');
// retomar tras 10 días
await p.evaluate(() => { const s = getAbs(); s.day = 5; s.lastAt = Date.now() - 10 * DAY; setAbs(s); openAbStart(); }); await p.waitForTimeout(300);
st = await p.evaluate(() => getAbs()); ok(st.day === 3, 'tras 10 días sin entrenar retrocede 2 días');
ok(!errs.length, 'sin errores ' + errs.join('\n'));
await b.close();
