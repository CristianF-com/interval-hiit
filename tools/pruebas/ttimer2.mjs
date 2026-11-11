// Timer: actividad y calorías, programar en el calendario, abrir en el calendario si hoy hay algo, audio en segundo plano
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined, args: ['--autoplay-policy=no-user-gesture-required'] });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'es-AR' });
await c.addInitScript(() => { window.NO_CLOUD = 1; });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
const ok = (v, m) => console.log((v ? 'OK  ' : 'FALLA ') + m);
const D = process.argv[2] || '.';
await p.goto('http://localhost:8776/'); await p.waitForTimeout(800);
await p.fill('#ob-name', 'Cris'); await p.click('#ob-go'); await p.waitForTimeout(400);
ok(await p.evaluate(() => currentView === 'coach'), 'perfil nuevo: abre en Coach');
await p.evaluate(() => setSubtab('coach', 'timer')); await p.waitForTimeout(200);
ok(await p.isVisible('#tm-bg') && await p.getAttribute('#tm-bg', 'aria-checked') === 'true', 'opción «pantalla bloqueada» activada por defecto');
// plantilla de correr: actividad Correr; se programa hoy y se guarda
await p.click('[data-tpe="0"] b'); await p.waitForTimeout(300);
ok(await p.inputValue('#tm-act') === 'run', 'la plantilla de correr trae la actividad Correr');
ok((await p.$$('#tm-act option')).length >= 20, 'lista de actividades');
const wd = await p.evaluate(() => wdOf(Date.now()));
await p.click(`#tm-wd [data-wd="${wd}"]`); await p.fill('#tm-n', 'Fondo');
await p.screenshot({ path: D + '/tm2-edit.png', fullPage: true });
await p.click('#tm-save'); await p.waitForTimeout(300);
ok(await p.evaluate(() => { const c = PS.get('timers')[0]; return c.act === 'run' && c.wd.length === 1; }), 'guardado con actividad y día');
await p.click('[data-tab=cal]'); await p.waitForTimeout(400);
ok(/Timer · Fondo/.test(await p.textContent('#cal-day')), 'aparece hoy en el calendario');
ok(await p.evaluate(() => !!document.querySelector('.cd.today .dt.timer')), 'punto del timer en el día');
await p.screenshot({ path: D + '/tm2-cal.png', fullPage: true });
await p.click('#cal-day .ag'); await p.waitForTimeout(300);
ok(await p.isVisible('#tma-go'), 'detalle con Empezar'); await p.screenshot({ path: D + '/tm2-item.png' });
await p.click('#tma-go'); await p.waitForTimeout(500);
ok(await p.evaluate(() => BG_KEEP === true && !!bgEl), 'audio en segundo plano activado');
ok(await p.evaluate(() => navigator.mediaSession.metadata && /Prepárate/.test(navigator.mediaSession.metadata.title)), 'pantalla de bloqueo: bloque actual');
// con la app oculta el audio no se suspende
await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
await p.waitForTimeout(200);
ok(await p.evaluate(() => AC && AC.state === 'running'), 'oculta: el audio sigue en marcha');
await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
// 10 s de preparación + 10 min lento + 3 rápido + 1 caminar, y termina
await p.evaluate(() => { TP.last -= (10 + 14 * 60) * 1000; tmTick(); }); await p.evaluate(() => tmFinish(false)); await p.waitForTimeout(600);
const h = await p.evaluate(() => PS.get('history')[0]);
// 70 kg: 600 s × 8.3 + 180 × 11.5 + 60 × 3.5 MET → (4980 + 2070 + 210) × 70 / 3600 = 141
ok(h.kcal >= 138 && h.kcal <= 144, 'calorías de correr: ' + h.kcal);
ok(/kcal/.test(await p.textContent('#sheet-root')), 'resumen con calorías'); await p.screenshot({ path: D + '/tm2-done.png' });
ok(await p.evaluate(() => BG_KEEP === false && bgEl.paused), 'al terminar se apaga el audio de fondo');
await p.evaluate(() => closeSheet());
ok(await p.evaluate(() => Math.round(computeStats().kcal) >= 138), 'las calorías entran en las estadísticas');
ok(!(await p.evaluate(() => (buildAgenda()[dkey(Date.now())] || []).some(x => x.type === 'timer'))), 'hecho hoy: ya no figura como pendiente');
// al abrir la app con algo programado para hoy → calendario
await p.evaluate(() => { const L = PS.get('timers'); L.push({ ...L[0], id: 'x2', n: 'Otro' }); PS.set('timers', L); });
await p.reload(); await p.waitForTimeout(900);
ok(await p.evaluate(() => currentView === 'cal'), 'con algo programado hoy abre en el calendario');
await p.screenshot({ path: D + '/tm2-open.png' });
await p.evaluate(() => { const L = PS.get('timers').map(c => ({ ...c, wd: [] })); PS.set('timers', L); });
await p.reload(); await p.waitForTimeout(900);
ok(await p.evaluate(() => currentView === 'coach'), 'sin nada programado abre en Coach');
console.log('errores', errs); await b.close();
