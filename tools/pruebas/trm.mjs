import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
await c.addInitScript(() => { window.NO_CLOUD = 1; });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:8776/'); await p.waitForTimeout(600);
await p.fill('#ob-name', 'C'); await p.click('#ob-go'); await p.waitForTimeout(300);
await p.evaluate(() => { const n = { I: 5, tests: [], sessions: 3, maxDur: 1800, nextAt: 0, log: [], opts: smartOpts(null) }; n.next = genSmart(n); setSmart(n); startWorkout(n.next); });
await p.waitForTimeout(300); await p.evaluate(() => step(P.tl.findIndex(s => s.k === 'work' && !s.soft)));
const snap = () => p.evaluate(() => document.querySelector('#p-anim svg .body, .player svg .body').innerHTML.length + ':' + document.querySelector('.player svg .body').innerHTML.slice(0, 80));
const a = []; for (let i = 0; i < 8; i++) { a.push(await snap()); await p.waitForTimeout(300); }
console.log('cambios en 2,4 s:', new Set(a).size, '(con movimiento continuo serían ~8)'); console.log(errs); await b.close();
