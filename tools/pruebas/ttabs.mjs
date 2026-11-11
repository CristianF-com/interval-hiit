import { chromium } from 'playwright';
const S = process.argv[2];
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'es-AR' });
await c.addInitScript(() => { window.NO_CLOUD = 1; });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack));
const ok = (v, m) => { console.log(v ? 'OK ' : 'FALLA ', m); if (!v) process.exitCode = 1; };
await p.goto('http://localhost:8776/'); await p.waitForTimeout(800);
await p.fill('#ob-name', 'Cris'); await p.click('#ob-go'); await p.waitForTimeout(300);
await p.evaluate(() => { const H = [], ids = Object.keys(CATALOG).slice(0, 6); for (let i = 0; i < 30; i++) H.push({ at: Date.now() - i * 2e8, secs: 1200, full: true, log: ids.map(id => [id, 12, 0, 30000]), w: { kind: 'plan', title: 'Día ' + i } }); PS.set('history', H); });
const state = g => p.evaluate(g => { const bar = document.querySelector(`.subtabs[data-group="${g}"]`), sel = bar.querySelector('[aria-selected=true]'), vis = [...document.querySelectorAll(`[data-pane^="${g}:"]`)].filter(x => !x.classList.contains('hidden')).map(x => x.dataset.pane);
  const r = sel.getBoundingClientRect(), br = bar.getBoundingClientRect(); return { sel: sel.dataset.st, vis, chipVisible: r.left >= br.left - 1 && r.right <= br.right + 1, scrollLeft: Math.round(bar.scrollLeft), y: Math.round(scrollY) }; }, g);
// historial → Amigos (opción del final)
await p.click('nav [data-tab=hist]'); await p.waitForTimeout(300);
await p.click('#hist-tabs [data-st=friends]'); await p.waitForTimeout(300);
let s1 = await state('hist'); ok(s1.sel === 'friends' && s1.vis[0] === 'hist:friends' && s1.chipVisible, 'Amigos elegido y visible ' + JSON.stringify(s1));
// coach → Mis rutinas
await p.click('nav [data-tab=coach]'); await p.waitForTimeout(300);
let s2 = await state('coach'); ok(s2.sel === 'smart' && s2.vis[0] === 'coach:smart' && s2.scrollLeft === 0, 'al volver a Coach: primera opción ' + JSON.stringify(s2));
await p.click('#coach-tabs [data-st=custom]'); await p.waitForTimeout(300);
s2 = await state('coach'); ok(s2.sel === 'custom' && s2.chipVisible, 'Mis rutinas visible ' + JSON.stringify(s2));
// vuelta a Historial: Resumen, barra al principio
await p.click('nav [data-tab=hist]'); await p.waitForTimeout(300);
let s3 = await state('hist'); ok(s3.sel === 'sum' && s3.vis[0] === 'hist:sum' && s3.scrollLeft === 0 && s3.chipVisible && s3.y === 0, 'al volver a Historial: Resumen ' + JSON.stringify(s3));
await p.screenshot({ path: S + '/back_hist.png' });
// abajo en Progreso y cambio a Sesiones: la parte nueva empieza arriba
await p.click('#hist-tabs [data-st=sum]'); await p.waitForTimeout(300); await p.evaluate(() => scrollTo(0, 1500)); await p.waitForTimeout(200);
await p.click('#hist-tabs [data-st=list]'); await p.waitForTimeout(300);
const top = await p.evaluate(() => Math.round(document.querySelector('[data-pane="hist:list"]').getBoundingClientRect().top));
ok(top > 40 && top < 140, 'Sesiones arranca arriba, debajo de la barra (top ' + top + ')');
await p.screenshot({ path: S + '/switch_scrolled.png' });
// desde el anillo de la meta o un link sigue yendo a la parte pedida
await p.evaluate(() => goTo('hist', 'hist', 'body')); await p.waitForTimeout(300);
ok((await state('hist')).sel === 'body', 'goTo sigue abriendo la parte pedida');
console.log(errs); await b.close();
