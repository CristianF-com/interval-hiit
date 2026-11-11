import { chromium } from 'playwright';
const S = process.argv[2];
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const ok = (v, m) => { console.log(v ? 'OK ' : 'FALLA ', m); if (!v) process.exitCode = 1; };
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'es-AR' });
await c.addInitScript(() => { window.NO_CLOUD = 1; setInterval(() => { const b = document.querySelector('#aw-ok'); if (b) b.click(); }, 80); });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack));
await p.goto('http://localhost:8776/'); await p.waitForTimeout(700);
await p.fill('#ob-name', 'C'); await p.click('#ob-go'); await p.waitForTimeout(300);
await p.evaluate(() => goTo('coach', 'coach', 'abs')); await p.waitForTimeout(300);
ok(await p.$('#abi-start'), 'coach de abdominales: ¡Empezar!'); await p.screenshot({ path: S + '/abai_0.png' });
await p.click('#abi-start'); await p.waitForTimeout(300); await p.screenshot({ path: S + '/abai_1.png' }); await p.click('#abis-test'); await p.waitForTimeout(300);
await p.fill('#abt-cr', '30'); await p.fill('#abt-pl', '60'); await p.click('#abt-ok'); await p.waitForTimeout(400);
let st = await p.evaluate(() => getAbAi()); ok(st && st.I === 3.5, 'nivel inicial 3.5 con 30 crunches');
await p.screenshot({ path: S + '/abai_2.png' });
// progresión: 30 sesiones simuladas con «bien»
const prog = await p.evaluate(() => { const out = []; for (let i = 0; i < 40; i++) { const st = getAbAi(); const ss = abAiSession(st); out.push([+st.I.toFixed(1), ss.items.length, ss.items[0].sets, ss.items.map(x => x.cnt).join('/'), ss.deload ? 'D' : '']);
  st.before = { I: st.I }; st.sessions++; if (!ss.deload) st.I += 0.15 + 0.25; st.lastNs = ss.items.map(x => x.n); setAbAi(st); } return out; });
prog.filter((_, i) => i % 5 === 0 || prog[i][4]).forEach(r => console.log('   ', JSON.stringify(r)));
ok(prog[39][0] > prog[0][0] && prog.some(r => r[4] === 'D'), 'la dificultad sube sin fin y hay descargas');
// sesión real
await p.evaluate(() => { const s = getAbAi(); s.I = 4; s.sessions = 2; s.nextAt = 0; setAbAi(s); renderAbAi(); });
await p.click('#abi-go'); await p.waitForTimeout(300); await p.screenshot({ path: S + '/abai_3.png' });
await p.click('#abiw-go'); await p.waitForTimeout(400);
await p.evaluate(() => { P.activeMs = 400000; step(P.tl.length); }); await p.waitForTimeout(600);
st = await p.evaluate(() => getAbAi()); ok(st.sessions === 3 && st.I > 4, 'sesión contada y sube ' + st.I);
await p.click('[data-fb="hard"]'); await p.waitForTimeout(300);
st = await p.evaluate(() => getAbAi()); ok(st.I < 4, 'difícil: baja ' + st.I);
const h = await p.evaluate(() => PS.get('history', [])[0].w); ok(h.kind === 'abs' && h.ai, 'en el historial como abdominales (coach)');
const ag = await p.evaluate(() => Object.entries(buildAgenda()).filter(([k, v]) => v.some(x => x.type === 'absai')).map(([k]) => k).slice(0, 7));
ok(ag.length === 7, 'en el calendario, dos días sí y uno no: ' + ag.join(', '));
// el plan cerrado sigue aparte
ok(!(await p.evaluate(() => getAbs())), 'el coach no crea un plan cerrado');
ok(!errs.length, 'sin errores ' + errs.join('\n'));
await b.close();
