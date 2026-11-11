import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'es-AR', colorScheme: 'dark' });
await c.addInitScript(() => { window.NO_CLOUD = 1; });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
const ok = (v, m) => console.log((v ? 'OK  ' : 'FALLA ') + m);
await p.goto('http://localhost:8776/'); await p.waitForTimeout(700);
await p.fill('#ob-name', 'Cris'); await p.click('#ob-go'); await p.waitForTimeout(300);
await p.evaluate(() => { for (let k = 0; k < 300; k++) { const w = generate(); const tl = buildTimeline(w); const i = tl.findIndex(s => s.ex === 'bent_leg_cross_overs'); if (i >= 0) { startWorkout(w); step(i, true); return; } } });
await p.waitForTimeout(400);
ok(await p.evaluate(() => P.animId === 'bent_leg_cross_overs' + 'R'), 'primera mitad: lado derecho');
ok(await p.evaluate(() => Anim.keysOf('bent_leg_cross_overs@R') === 5 && Anim.keysOf('bent_leg_cross_overs') === 10), 'versión de un lado');
await p.evaluate(() => { P.endAt = performance.now() + cur().dur * 500 - 50; tick(); }); await p.waitForTimeout(1400);
ok(await p.evaluate(() => P.animId === 'bent_leg_cross_overs' + 'L'), 'a la mitad cambia al lado izquierdo');
await p.screenshot({ path: (process.env.OUT || '/tmp/inhiit') + '/cruce.png' });
// otros ejercicios por lado sin versión propia siguen igual
const o = await p.evaluate(() => { for (let k = 0; k < 300; k++) { const w = generate(); const tl = buildTimeline(w); const i = tl.findIndex(s => s.k === 'work' && !s.reps && ex(s.ex).s && s.ex !== 'bent_leg_cross_overs'); if (i >= 0) { step(0, true); P.w = w; P.tl = tl; step(i, true); return [tl[i].ex, document.querySelector('#p-anim svg') ? 1 : 0]; } } return null; });
ok(!o || o[1] === 1, 'otro ejercicio por lado se dibuja normal ' + JSON.stringify(o));
console.log('errores', errs); await b.close();
