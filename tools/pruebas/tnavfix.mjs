// la página en sí no scrollea (scrollea #app): la barra de pestañas queda pegada abajo (o a la izquierda en horizontal)
// aunque se scrollee, y las subpestañas siguen fijas arriba
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'es-AR', isMobile: true, hasTouch: true });
await c.addInitScript(() => { window.NO_CLOUD = 1; });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
const ok = (v, m) => console.log((v ? 'OK  ' : 'FALLA ') + m); const D = process.argv[2] || '/tmp/inhiit';
await p.goto('http://localhost:8776/'); await p.waitForTimeout(800);
await p.fill('#ob-name', 'Cris'); await p.click('#ob-go'); await p.waitForTimeout(600);
const st = () => p.evaluate(() => { const n = document.querySelector('nav.tabs').getBoundingClientRect(), sc = pageScroller();
  const sub = document.querySelector('#v-coach .subtabs'); return { nav: [Math.round(n.top), Math.round(n.bottom), Math.round(n.left)], winY: scrollY, appY: Math.round(sc.scrollTop), sub: sub ? Math.round(sub.getBoundingClientRect().top) : null, h: innerHeight }; });
await p.evaluate(() => show('lib'));
await p.waitForTimeout(300);
const tall = await p.evaluate(() => pageScroller().scrollHeight > innerHeight + 200);
ok(tall, 'hay contenido para scrollear');
await p.touchscreen.tap(195, 400); await p.mouse.wheel(0, 900); await p.waitForTimeout(400);
await p.evaluate(() => pageScroller().scrollBy(0, 600)); await p.waitForTimeout(300);
const a = await st();
ok(a.appY > 300 && a.winY === 0, 'scrollea #app y no la página (' + a.appY + ', ' + a.winY + ')');
ok(a.nav[1] === a.h, 'la barra sigue pegada abajo (' + a.nav + ')');
await p.screenshot({ path: D + '/scroll-app.png' });
await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(800);
await p.evaluate(() => pageScroller().scrollBy(0, 300)); await p.waitForTimeout(300);
const l = await st(); ok(l.nav[0] === 0 && l.nav[1] === 390 && l.nav[2] === 0 && l.winY === 0, 'horizontal: barra a la izquierda, de arriba abajo (' + l.nav + ')');
await p.screenshot({ path: D + '/scroll-app-h.png' });
await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(800);
const v = await st(); ok(v.nav[1] === 844 && v.winY === 0, 'de nuevo vertical: barra abajo (' + v.nav + ')');
ok(!errs.length, 'sin errores ' + errs.join(' | ')); await b.close();
