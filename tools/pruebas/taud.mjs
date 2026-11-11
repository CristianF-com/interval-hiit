import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined, args: ['--autoplay-policy=no-user-gesture-required'] });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', locale: 'es-AR' });
await c.addInitScript(() => { window.NO_CLOUD = 1; });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
const ok = (v, m) => console.log((v ? 'OK  ' : 'FALLA ') + m);
await p.goto('http://localhost:8776/'); await p.waitForTimeout(800);
await p.fill('#ob-name', 'Cris'); await p.click('#ob-go'); await p.waitForTimeout(400);
await p.evaluate(() => startWorkout(generate())); await p.waitForTimeout(600);
ok(await p.evaluate(() => AC && AC.state === 'running'), 'audio en marcha al empezar');
// 1) queda suspendido (como al bloquear) y vuelve solo
ok(await p.evaluate(async () => { await AC.suspend(); return AC.state === 'suspended'; }), 'suspendido');
await p.evaluate(() => acRecover()); await p.waitForTimeout(1200);
ok(await p.evaluate(() => AC.state === 'running'), 'acRecover lo reanuda');
// 2) el vigilante lo recupera sin que nadie llame
await p.evaluate(() => AC.suspend()); await p.waitForTimeout(2600);
ok(await p.evaluate(() => AC.state === 'running'), 'el vigilante lo recupera en menos de 3 s');
// 3) contexto que no vuelve (resume no hace nada): se crea uno nuevo
await p.evaluate(async () => { await AC.suspend(); window.OLD = AC; AC.resume = () => new Promise(() => {}); });
await p.evaluate(() => acRecover()); await p.waitForTimeout(7000);
ok(await p.evaluate(() => AC !== window.OLD && AC.state === 'running'), 'contexto trabado → uno nuevo en marcha');
// 4) la voz suena con el contexto nuevo
const played = await p.evaluate(async () => { const r = await vPlay('Descanso de 30 segundos.', 'dora'); return [r, vSrcs.length]; });
ok(played[0] === true && played[1] > 0, 'la voz grabada suena con el contexto nuevo ' + played);
// 5) sin reproductor en pantalla el vigilante no hace nada
await p.evaluate(() => { finish(false); }); await p.waitForTimeout(300);
await p.evaluate(() => AC.suspend()); await p.waitForTimeout(2500);
ok(await p.evaluate(() => AC.state === 'suspended'), 'sin entrenamiento no insiste');
console.log('errores', errs); await b.close();
