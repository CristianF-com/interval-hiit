import { chromium } from 'playwright';
const S = process.argv[2];
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const ok = (v, m) => { console.log(v ? 'OK ' : 'FALLA ', m); if (!v) process.exitCode = 1; };
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'es-AR' });
await c.addInitScript(() => { window.NO_CLOUD = 1; });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack));
await p.goto('http://localhost:8776/'); await p.waitForTimeout(700);
await p.fill('#ob-name', 'C'); await p.click('#ob-go'); await p.waitForTimeout(300);
const shots = [];
for (const [k, btn, skip] of [['smart', '#sm-start', '#sms-skip'], ['db', '#db-setup', '#dbs-skip'], ['abs', '#abi-start', '#abis-skip']]) {
  await p.evaluate(k => setSubtab('coach', k), k); await p.waitForTimeout(300);
  const lbl = await p.evaluate(b => document.querySelector(b).textContent.trim(), btn);
  const n = await p.evaluate(k => document.querySelectorAll(`[data-pane="coach:${k}"] .now .btn`).length, k);
  ok(lbl === '¡Empezar!' && n === 1, `${k}: un solo botón «${lbl}»`);
  await p.screenshot({ path: `${S}/st_${k}_0.png` }); shots.push(`st_${k}_0.png`);
  await p.click(btn); await p.waitForTimeout(350); await p.screenshot({ path: `${S}/st_${k}_1.png` }); shots.push(`st_${k}_1.png`);
  ok(await p.$(skip), `${k}: dentro, medir o empezar sin prueba`);
  await p.click(skip); await p.waitForTimeout(400);
}
ok(await p.evaluate(() => !!getSmart() && !!getDumb() && !!getAbAi()), 'los tres quedan creados sin prueba');
ok(!errs.length, 'sin errores ' + errs.join('\n'));
await b.close();
