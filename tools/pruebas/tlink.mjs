import { chromium } from 'playwright';
const S = process.argv[2];
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const ok = (v, m) => { console.log(v ? 'OK ' : 'FALLA ', m); if (!v) process.exitCode = 1; };
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block', locale: 'es-AR', permissions: ['clipboard-read', 'clipboard-write'] });
await c.addInitScript(() => { window.NO_CLOUD = 1; });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
// navegador del teléfono, sin perfil
await p.goto('http://localhost:8776/#grp=ABC234'); await p.waitForTimeout(1200);
ok(await p.$('#lk-here') && /ABC234/.test(await p.textContent('.lk-code')), 'aviso para abrir la app instalada con el código');
await p.screenshot({ path: S + '/link_hint.png' });
await p.click('#lk-copy'); ok((await p.evaluate(() => navigator.clipboard.readText())) === 'ABC234', 'código copiado');
await p.click('#lk-here'); await p.waitForTimeout(500);
await p.fill('#ob-name', 'Ana'); await p.click('#ob-go'); await p.waitForTimeout(1200);
ok(await p.$('#gj-c') && (await p.inputValue('#gj-c')) === 'ABC234', 'tras crear el perfil en el navegador, sigue con la invitación');
// pegar en la app
await p.evaluate(() => navigator.clipboard.writeText('Sumate… Código: QWE789 https://x/#grp=QWE789'));
await p.fill('#gj-c', ''); await p.click('#gj-paste'); await p.waitForTimeout(300);
ok((await p.inputValue('#gj-c')) === 'QWE789', 'pegar código desde el portapapeles');
await p.evaluate(() => closeSheet());
// rutina pegada en Mis rutinas
const link = await p.evaluate(() => rtLink({ n: 'Core', r: 15, R: 2, rr: 30, items: [{ id: 'squats', m: 'r', v: 12 }], warm: false, cool: false }));
await p.evaluate(l => navigator.clipboard.writeText(l), link);
await p.evaluate(() => goTo('coach', 'coach', 'mine')); await p.waitForTimeout(300); await p.click('#rt-paste'); await p.waitForTimeout(500);
ok(await p.$('#sr-save'), 'pegar link de rutina abre la rutina compartida');
await p.evaluate(() => closeSheet()); await p.screenshot({ path: S + '/rt_paste.png' });
// en la app instalada no aparece el aviso
const c2 = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
await c2.addInitScript(() => { window.NO_CLOUD = 1; Object.defineProperty(navigator, 'standalone', { get: () => true }); });
const q = await c2.newPage(); await q.goto('http://localhost:8776/'); await q.waitForTimeout(600); await q.fill('#ob-name', 'B'); await q.click('#ob-go'); await q.waitForTimeout(400);
await q.evaluate(() => { location.hash = 'grp=ZXC234'; }); await q.waitForTimeout(600);
ok(!(await q.$('#lk-here')) && await q.$('#gj-c'), 'en la app instalada va directo a unirse');
ok(!errs.length, 'sin errores ' + errs.join(' | '));
await b.close();
