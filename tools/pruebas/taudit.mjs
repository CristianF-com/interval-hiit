// capturas para la auditoría de UX/UI (no modifica el repo)
import { chromium } from 'playwright';
const S = process.argv[2];
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const errs = [];
async function phone(theme, opts = {}) {
  const c = await b.newContext({ viewport: opts.vp || { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block', locale: 'es-AR', colorScheme: 'dark' });
  await c.addInitScript(t => { window.NO_CLOUD = 1; setInterval(() => { const a = document.querySelector('#aw-ok'); if (a) a.click(); }, 120); try { if (t) localStorage.setItem('intervalo.theme', t); } catch (e) {} }, theme);
  const p = await c.newPage(); p.on('pageerror', e => errs.push(e.stack));
  await p.goto('http://localhost:8776/'); await p.waitForTimeout(800);
  return [c, p];
}
const shot = async (p, n) => { await p.waitForTimeout(450); await p.screenshot({ path: `${S}/${n}.png` }); };
const seed = async p => {
  await p.fill('#ob-name', 'Cristian'); await p.click('#ob-go'); await p.waitForTimeout(400);
  await p.evaluate(() => {
    const now = Date.now(), H = [];
    const kinds = [() => ({ kind: 'coach', parts: ['all'], level: 2, rounds: [], sk: { w: 40, r: 20, rr: 60 } })];
    
    const n = { I: 5.2, tests: [{ at: now - 20 * 864e5, sq: 38, pu: 22, ab: 31 }], sessions: 14, maxDur: 1800, nextAt: now - 1000, log: [{ at: now, I: 5.2, why: 'ok' }], opts: smartOpts(null) };
    n.next = genSmart(n); setSmart(n);
    for (let i = 1; i < 45; i++) H.push({ at: now - i * 1.6 * 864e5, secs: 900 + (i % 5) * 120, full: true, fb: ['ok', 'easy', 'hard'][i % 3], w: JSON.parse(JSON.stringify(n.next)) });
    PS.set('history', H);
    PS.set('awards', { first: now, s5: now, s10: now, sq100: now, tsq15: now });
  });
  await p.evaluate(() => { setSubtab('coach', 'smart'); window.scrollTo(0, 0); });
};
if (process.argv[3] === 'extra') { const [c2, p2] = await phone('naranja'); await seed(p2); await p2.evaluate(() => { S.theme = 'naranja'; save(); applyTheme(); }); await p2.click('[data-tab=plans]'); await shot(p2, '30-naranja-planes'); await p2.click('[data-tab=cal]'); await p2.evaluate(() => window.scrollTo(0, 260)); await shot(p2, '31-naranja-cal'); await p2.evaluate(() => { startWorkout(getSmart().next); }); await p2.waitForTimeout(400); await p2.evaluate(() => step(P.tl.findIndex((s, i) => s.k === 'rest' && !s.soft))); await p2.waitForTimeout(1500); await shot(p2, '32-naranja-descanso'); await c2.close(); await b.close(); process.exit(0); }
if (process.argv[3] === 'temas') { for (const th of ['naranja', 'lima']) { const [c2, p2] = await phone(th); await seed(p2); await p2.evaluate(t => { S.theme = t; save(); applyTheme(); window.scrollTo(0, 0); }, th); await shot(p2, `20-tema-${th}`); await p2.evaluate(() => { startWorkout(getSmart().next); }); await p2.waitForTimeout(500); await p2.evaluate(() => step(P.tl.findIndex(s => s.k === 'work' && !s.soft))); await p2.waitForTimeout(1500); await shot(p2, `21-player-${th}`); await p2.evaluate(() => step(P.tl.findIndex((s, i) => i > P.i && s.k === 'rest'))); await p2.waitForTimeout(1500); await shot(p2, `21b-rest-${th}`); await c2.close(); } await b.close(); process.exit(0); }
// 1. primer uso
{ const [c, p] = await phone(null); await shot(p, '01-onboarding'); await c.close(); }
// 2. tema oscuro con datos
const [c, p] = await phone('oscuro'); await seed(p);
await shot(p, '02-coach-ai-hiit');
await p.evaluate(() => { const w = getSmart().next; openPreview(w); }); await shot(p, '03-preview');
await p.evaluate(() => closeSheet());
await p.evaluate(() => { startWorkout(getSmart().next); }); await p.waitForTimeout(500);
await p.evaluate(() => step(P.tl.findIndex(s => s.k === 'work' && !s.soft))); await p.waitForTimeout(1600); await shot(p, '04-player-work');
await p.evaluate(() => step(P.tl.findIndex((s, i) => i > P.i && s.k === 'rest'))); await p.waitForTimeout(1600); await shot(p, '05-player-rest');
await p.evaluate(() => { P.activeMs = 900e3; step(P.tl.length); }); await p.waitForTimeout(900); await p.evaluate(() => { const b = document.querySelector('#aw-ok'); if (b) b.click(); }); await shot(p, '06-done');
await p.evaluate(() => { document.querySelectorAll('#aw-ok').forEach(b => b.click()); document.querySelector('#d-ok').click(); }); await p.waitForTimeout(600); console.log(await p.evaluate(() => [currentView, document.querySelector('.done').className, [...document.querySelectorAll('.scrim,.sheet,.aw-pop,.modal')].filter(e => e.offsetParent).map(e => e.className)]));
await p.evaluate(() => { goTo('coach', 'coach', 'db'); }); await p.waitForTimeout(300); console.log(await p.evaluate(() => [document.body.className, document.documentElement.className, getComputedStyle(document.querySelector('#db-setup')).visibility])); await p.evaluate(() => document.querySelector('#db-setup').click()); await p.waitForTimeout(300); await p.evaluate(() => document.querySelector('#dbs-skip').click()); await p.waitForTimeout(400); await p.evaluate(() => window.scrollTo(0, 0)); await shot(p, '07-coach-ai-db');
await p.evaluate(() => { goTo('coach', 'coach', 'abs'); }); await p.waitForTimeout(300); await p.evaluate(() => document.querySelector('#abi-start').click()); await shot(p, '08-ai-abs-setup'); await p.evaluate(() => document.querySelector('#abis-skip').click()); await p.waitForTimeout(300); await shot(p, '09-coach-ai-abs');
console.log(await p.evaluate(() => { const b = document.querySelector('[data-tab=plans]').getBoundingClientRect(); const e = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); return [JSON.stringify(b), e.tagName, e.id, e.className, e.closest('[id]') && e.closest('[id]').id]; })); await p.click('[data-tab=plans]'); await p.evaluate(() => window.scrollTo(0, 0)); await shot(p, '10-planes');
await p.click('[data-tab=retos]'); await shot(p, '11-retos');
await p.click('[data-tab=cal]'); await shot(p, '12-calendario');
await p.click('[data-tab=hist]'); await p.evaluate(() => setSubtab('hist', 'sum')); await shot(p, '13-hist-resumen');
await p.evaluate(() => setSubtab('hist', 'prog')); await shot(p, '14-hist-progreso');
await p.evaluate(() => setSubtab('hist', 'list')); await shot(p, '15-hist-lista');
await p.evaluate(() => setSubtab('hist', 'aw')); await shot(p, '16-logros');
await p.evaluate(() => openProfiles()); await shot(p, '17-perfil'); await p.evaluate(() => closeSheet());
await p.evaluate(() => openVoiceSettings()); await shot(p, '18-voz'); await p.evaluate(() => closeSheet());
await p.evaluate(() => openTestSetup()); await shot(p, '19-prueba'); await p.evaluate(() => closeSheet());
await c.close();
// 3. otros temas
for (const th of ['naranja', 'lima']) { const [c2, p2] = await phone(th); await seed(p2); await p2.evaluate(t => { S.theme = t; save(); applyTheme(); window.scrollTo(0, 0); }, th); await shot(p2, `20-tema-${th}`);
  await p2.evaluate(() => { startWorkout(getSmart().next); }); await p2.waitForTimeout(500); await p2.evaluate(() => step(P.tl.findIndex(s => s.k === 'work' && !s.soft))); await p2.waitForTimeout(1500); await shot(p2, `21-player-${th}`); await c2.close(); }
// 4. horizontal
{ const [c3, p3] = await phone('oscuro', { vp: { width: 844, height: 390 } }); await seed(p3); await shot(p3, '22-horizontal-coach');
  await p3.evaluate(() => { startWorkout(getSmart().next); }); await p3.waitForTimeout(500); await p3.evaluate(() => step(P.tl.findIndex(s => s.k === 'work' && !s.soft))); await p3.waitForTimeout(1500); await shot(p3, '23-horizontal-player'); await c3.close(); }
console.log('errores', errs); await b.close();
