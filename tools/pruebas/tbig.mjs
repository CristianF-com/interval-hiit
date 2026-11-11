// texto grande (simula Dynamic Type de accesibilidad): busca desbordes y saca capturas
import { chromium } from 'playwright';
const S = process.argv[2], ROOT = process.argv[3] || '26px';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, serviceWorkers: 'block', locale: 'es-AR' });
await c.addInitScript(r => { window.NO_CLOUD = 1; setInterval(() => { const a = document.querySelector('#aw-ok'); if (a) a.click(); }, 120); document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.fontSize = r; }); }, ROOT);
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:8776/'); await p.waitForTimeout(700);
await p.screenshot({ path: `${S}/big_00-onb.png` });
await p.fill('#ob-name', 'Cristian'); await p.click('#ob-go'); await p.waitForTimeout(300);
await p.evaluate(() => { const n = { I: 5.2, tests: [], sessions: 3, maxDur: 1800, nextAt: 0, log: [], opts: smartOpts(null) }; n.next = genSmart(n); setSmart(n); renderSmart(); });
const issues = [];
const scan = async n => { await p.waitForTimeout(500); await p.screenshot({ path: `${S}/big_${n}.png` });
  const r = await p.evaluate(() => { const o = []; if (document.documentElement.scrollWidth > innerWidth + 1) o.push('PÁGINA desborda a lo ancho ' + document.documentElement.scrollWidth);
    document.querySelectorAll('body *').forEach(e => { const cs = getComputedStyle(e); if (!e.offsetParent || cs.overflow === 'visible' && cs.overflowX === 'visible') return; if (cs.textOverflow === 'ellipsis' || cs.overflowX === 'auto' || cs.overflowX === 'scroll') return; if (e.scrollHeight > e.clientHeight + 2 && cs.overflowY === 'hidden' && e.textContent.trim()) o.push('recorte vertical: ' + (e.id || e.className) + ' «' + e.textContent.trim().slice(0, 30) + '»'); });
    return o.slice(0, 8); }); r.forEach(x => issues.push(n + ': ' + x)); };
await scan('01-coach');
await p.evaluate(() => openPreview(getSmart().next)); await scan('02-preview'); await p.evaluate(() => closeSheet());
await p.evaluate(() => { startWorkout(getSmart().next); }); await p.waitForTimeout(300); await p.evaluate(() => step(P.tl.findIndex(s => s.k === 'work' && !s.soft))); await scan('03-player');
await p.evaluate(() => step(P.tl.findIndex((s, i) => i > P.i && s.k === 'rest'))); await scan('04-rest');
await p.evaluate(() => { P.activeMs = 900e3; step(P.tl.length); }); await p.waitForTimeout(600); await scan('05-done');
await p.evaluate(() => document.querySelector('#d-ok').click()); await p.waitForTimeout(400);
for (const t of ['plans', 'retos', 'cal', 'hist']) { await p.click(`[data-tab=${t}]`); await scan('06-' + t); }
await p.evaluate(() => openProfiles()); await scan('07-perfil');
console.log(issues.join('\n') || 'sin desbordes'); console.log(errs); await b.close();
