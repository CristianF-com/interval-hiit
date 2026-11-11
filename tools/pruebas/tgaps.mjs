// revisa en todas las hojas y pantallas principales que un texto seguido de un recuadro tenga al menos 12 px
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
await c.addInitScript(() => { window.NO_CLOUD = 1; });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:8776/'); await p.waitForTimeout(600);
await p.fill('#ob-name', 'C'); await p.click('#ob-go'); await p.waitForTimeout(300);
const bad = [];
const check = async name => { await p.waitForTimeout(300); const r = await p.evaluate(() => { const out = [];
  document.querySelectorAll('.sub,.note,p').forEach(t => { const n = t.nextElementSibling; if (!n || !n.matches('.block,.seg,.toggles,.field,.chips,.plans-cat,.opts,.row,.weeks')) return;
    const a = t.getBoundingClientRect(), bb = n.getBoundingClientRect(); if (!a.height || !bb.height) return; const g = bb.top - a.bottom; if (g < 12) out.push(`${Math.round(g)}px «${t.textContent.trim().slice(0, 40)}» → .${n.className.split(' ')[0]}`); }); return out; });
  r.forEach(x => bad.push(name + ': ' + x)); };
for (const k of ['smart', 'db', 'abs', 'custom', 'mine']) { await p.evaluate(k => setSubtab('coach', k), k); await check('coach:' + k); }
for (const [n, f] of [['smart-setup', 'openSmartSetup()'], ['db-setup', 'openDbSetup()'], ['abs-setup', 'openAbAiSetup()'], ['abs-plan-setup', 'openAbSetup(false,1)'], ['test', 'openTestSetup()'], ['voice', 'openVoiceSettings()'], ['goal', 'openGoal()'], ['grp-new', 'openGroupNew()'], ['grp-join', 'openGroupJoin()'], ['routine', 'openRoutine(null)']]) {
  await p.evaluate(f => { try { closeSheet(); } catch (e) {} eval(f); }, f); await check(n); }
await p.evaluate(() => closeSheet());
for (const v of ['plans', 'retos', 'cal', 'hist']) { await p.click(`[data-tab=${v}]`); await check(v); }
for (const k of ['sum', 'prog', 'list', 'aw', 'body', 'friends']) { await p.evaluate(k => setSubtab('hist', k), k); await check('hist:' + k); }
console.log(bad.length ? bad.join('\n') : 'todo con espacio'); console.log(errs); await b.close();
