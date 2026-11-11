import { chromium } from 'playwright';
const S = process.argv[2];
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'es-AR', hasTouch: true, isMobile: true });
await c.addInitScript(() => { window.NO_CLOUD = 1; });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack));
const ok = (v, m) => { console.log(v ? 'OK ' : 'FALLA ', m); if (!v) process.exitCode = 1; };
await p.goto('http://localhost:8776/'); await p.waitForTimeout(800);
await p.fill('#ob-name', 'C'); await p.click('#ob-go'); await p.waitForTimeout(300);
await p.evaluate(() => { PS.set('routines', [{ id: 'r', n: 'Larga', r: 15, R: 2, rr: 60, items: ['push_ups', 'squats', 'lunges', 'burpees', 'plank', 'crunches', 'mountain_climbers'].filter(i => CATALOG[i]).map(id => ({ id, m: 'r', v: 12 })), warm: true, cool: true }]); goTo('coach', 'coach', 'mine'); });
await p.waitForTimeout(300); await p.click('[data-rte="0"]'); await p.waitForTimeout(400);
const n = await p.evaluate(() => document.querySelectorAll('#rt-ex [data-v]').length);
// teclado del iPhone: la parte visible baja a 470 px, el alto de la página (innerHeight) sigue en 844
await p.evaluate(() => Object.defineProperty(window, 'innerHeight', { get: () => 844, configurable: true }));
await p.setViewportSize({ width: 390, height: 470 });
const check = async (i, label) => {
  await p.evaluate(i => document.querySelector(`#rt-ex [data-v="${i}"]`).focus(), i); await p.waitForTimeout(900);
  const r = await p.evaluate(i => { const e = document.querySelector(`#rt-ex [data-v="${i}"]`).getBoundingClientRect(); return { top: Math.round(e.top), bottom: Math.round(e.bottom), vh: Math.round(visualViewport.height), kb: getComputedStyle(document.documentElement).getPropertyValue('--kb') }; }, i);
  ok(r.top >= 60 && r.bottom <= r.vh - 40, `${label}: campo ${i + 1} a la vista y centrado ${JSON.stringify(r)}`);
};
await check(n - 1, 'último ejercicio');
await p.screenshot({ path: S + '/kb_last.png' });
await check(1, 'segundo ejercicio');
// tocar «Tiempo» en el último: se redibuja y el campo nuevo queda centrado
await p.evaluate(i => document.querySelector(`#rt-ex [data-mode="${i}"][data-m="t"]`).click(), n - 2); await p.waitForTimeout(900);
const r2 = await p.evaluate(() => { const a = document.activeElement, e = a.getBoundingClientRect(); return { tag: a.tagName, top: Math.round(e.top), bottom: Math.round(e.bottom), vh: Math.round(visualViewport.height) }; });
ok(r2.tag === 'INPUT' && r2.top >= 60 && r2.bottom <= r2.vh - 40, 'tras cambiar a Tiempo, el campo queda a la vista ' + JSON.stringify(r2));
await p.screenshot({ path: S + '/kb_mode.png' });
// se cierra el teclado: vuelve el tamaño normal
await p.evaluate(() => document.activeElement.blur()); await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(700);
ok((await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--kb'))) === '0px', 'sin teclado no queda espacio extra');
console.log(errs); await b.close();
