// Sonido con la pantalla bloqueada también en entrenamientos y retos (misma solución que el timer)
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined, args: ['--autoplay-policy=no-user-gesture-required'] });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', locale: 'es-AR' });
await c.addInitScript(() => { window.NO_CLOUD = 1; });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
const ok = (v, m) => console.log((v ? 'OK  ' : 'FALLA ') + m);
await p.goto('http://localhost:8776/'); await p.waitForTimeout(800);
await p.fill('#ob-name', 'Cris'); await p.click('#ob-go'); await p.waitForTimeout(300);
// entrenamiento
await p.evaluate(() => startWorkout(generate())); await p.waitForTimeout(500);
ok(await p.evaluate(() => BG_KEEP && bgEl && !bgEl.paused), 'entrenamiento: audio de fondo activo');
ok(await p.evaluate(() => !!navigator.mediaSession.metadata && navigator.mediaSession.metadata.album.length > 0), 'pantalla de bloqueo con el entrenamiento');
await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
await p.waitForTimeout(200);
ok(await p.evaluate(() => AC && AC.state === 'running'), 'bloqueado: el audio no se suspende');
await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
const i0 = await p.evaluate(() => P.i); await p.evaluate(() => navigator.mediaSession && skipNow()); 
await p.evaluate(() => finish(false)); await p.waitForTimeout(300);
ok(await p.evaluate(() => !BG_KEEP && bgEl.paused), 'al terminar se apaga');
// reto
await p.evaluate(() => startReto('pushups', { mode: 'toque' })); await p.waitForTimeout(800);
ok(await p.evaluate(() => BG_KEEP), 'reto: audio de fondo activo');
await p.evaluate(() => { try { rFinish(true); } catch (e) {} closeSheet && closeSheet(); }); await p.waitForTimeout(500);
// opción apagada
await p.evaluate(() => { S.bgAudio = false; save(); startWorkout(generate()); }); await p.waitForTimeout(400);
ok(await p.evaluate(() => !BG_KEEP), 'con la opción apagada no se activa');
await p.evaluate(() => finish(false));
// opción en Ajustes
await p.click('#who'); await p.waitForTimeout(300); await p.click('.subtabs[data-group=pf] [data-st=set]'); await p.waitForTimeout(300);
ok(await p.isVisible('#pf-bg') && await p.getAttribute('#pf-bg', 'aria-checked') === 'false', 'opción en Ajustes refleja el estado');
await p.click('#pf-bg'); ok(await p.evaluate(() => S.bgAudio === true), 'se vuelve a activar desde Ajustes');
console.log('errores', errs); await b.close();
