// barra de pestañas: si queda corrida (iPhone tras desbloquear en horizontal) se detecta y se intenta recolocar;
// en uso normal no se toca nada
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'es-AR', isMobile: true, hasTouch: true });
await c.addInitScript(() => { window.NO_CLOUD = 1; });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
const ok = (v, m) => console.log((v ? 'OK  ' : 'FALLA ') + m);
await p.goto('http://localhost:8776/'); await p.waitForTimeout(800);
await p.fill('#ob-name', 'Cris'); await p.click('#ob-go'); await p.waitForTimeout(600);
const fixes = () => p.evaluate(() => diagText().split('\n').filter(l => / giro:arreglo /.test(l)).length);
await p.evaluate(() => { scrollTo(0, 400); }); await p.waitForTimeout(600);
await p.evaluate(() => { scrollTo(0, 0); }); await p.waitForTimeout(600);
await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(700);
await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(700);
ok(await fixes() === 0, 'en uso normal no se dispara el arreglo');
const nb = await p.evaluate(() => Math.round(document.querySelector('nav.tabs').getBoundingClientRect().bottom));
ok(nb === 844, 'barra pegada abajo (' + nb + ')');
// se simula la barra corrida 47 px como en el registro del iPhone
await p.evaluate(() => { document.querySelector('nav.tabs').style.bottom = '47px'; dispatchEvent(new Event('scroll')); }); await p.waitForTimeout(700);
ok(await fixes() >= 1, 'barra corrida: se detecta y se intenta arreglar');
ok(!errs.length, 'sin errores ' + errs.join(' | ')); await b.close();
