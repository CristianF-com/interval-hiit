// mediciones de accesibilidad por pantalla y tema: texto chico, contraste, áreas táctiles, botones sin nombre
import { chromium } from 'playwright';
import fs from 'fs';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const out = {};
const MEASURE = () => {
  const lum = c => { const m = c.match(/[\d.]+/g); if (!m) return null; const [r, g, bb] = m.slice(0, 3).map(v => { v = v / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * bb; };
  const alpha = c => { const m = c.match(/[\d.]+/g); return m && m.length > 3 ? +m[3] : 1; };
  const bgOf = el => { let e = el; while (e) { const cs = getComputedStyle(e); if (cs.backgroundImage !== 'none' && !/gradient/.test(cs.backgroundImage)) return null; if (alpha(cs.backgroundColor) > 0.9) return cs.backgroundColor; e = e.parentElement; } return getComputedStyle(document.body).backgroundColor; };
  const vis = el => { const r = el.getBoundingClientRect(); if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight) return false; const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.opacity !== '0'; };
  const small = [], lowc = [], tap = [], noname = [];
  const seen = new Set();
  document.querySelectorAll('body *').forEach(el => {
    if (!vis(el)) return;
    const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (own) {
      const cs = getComputedStyle(el), fsz = parseFloat(cs.fontSize), txt = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').slice(0, 40);
      if (fsz < 11) small.push(`${fsz}px «${txt}»`);
      const bg = bgOf(el);
      if (bg && alpha(cs.color) > 0.5) { const L1 = lum(cs.color), L2 = lum(bg); const cr = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); const big = fsz >= 18 || (fsz >= 14 && +cs.fontWeight >= 600); const need = big ? 3 : 4.5;
        const op = parseFloat(cs.opacity); if (cr < need && !seen.has(txt)) { seen.add(txt); lowc.push(`${cr.toFixed(2)}:1 (necesita ${need}) ${fsz}px «${txt}» ${cs.color} sobre ${bg}`); } }
    }
    if (el.matches('button,a,[role=button],[role=switch],input,select,label.reps')) {
      const r = el.getBoundingClientRect(); const mn = Math.min(r.width, r.height);
      if (mn < 44) tap.push(`${Math.round(r.width)}×${Math.round(r.height)} ${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${(el.className + '').split(' ')[0]} «${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 25)}»`);
      if (el.matches('button,[role=button]') && !(el.textContent || '').trim() && !el.getAttribute('aria-label') && !el.getAttribute('title')) noname.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${(el.className + '').split(' ')[0]}`);
    }
  });
  return { small, lowc, tap, noname };
};
for (const th of ['oscuro', 'naranja', 'lima']) {
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block', locale: 'es-AR' });
  await c.addInitScript(() => { window.NO_CLOUD = 1; setInterval(() => { const a = document.querySelector('#aw-ok'); if (a) a.click(); }, 120); });
  const p = await c.newPage(); await p.goto('http://localhost:8776/'); await p.waitForTimeout(700);
  if (th === 'oscuro') out['oscuro:onboarding'] = await p.evaluate(MEASURE);
  await p.fill('#ob-name', 'C'); await p.click('#ob-go'); await p.waitForTimeout(300);
  await p.evaluate(t => { S.theme = t; save(); applyTheme(); const n = { I: 5, tests: [], sessions: 3, maxDur: 1800, nextAt: 0, log: [], opts: smartOpts(null) }; n.next = genSmart(n); setSmart(n); renderSmart(); }, th);
  const screens = [['coach', "goTo('coach','coach','smart')"], ['preview', "openPreview(getSmart().next)"], ['plans', "closeSheet(); show('plans')"], ['retos', "show('retos')"], ['cal', "show('cal')"], ['hist', "show('hist'); setSubtab('hist','sum')"], ['logros', "setSubtab('hist','aw')"], ['perfil', "openProfiles()"], ['voz', "closeSheet(); openVoiceSettings()"],
    ['player-work', "closeSheet(); startWorkout(getSmart().next); setTimeout(()=>step(P.tl.findIndex(s=>s.k==='work'&&!s.soft)),200)"], ['player-rest', "step(P.tl.findIndex((s,i)=>i>P.i&&s.k==='rest'))"], ['done', "P.activeMs=900e3; step(P.tl.length)"]];
  for (const [n, js] of screens) { try { await p.evaluate(js); await p.waitForTimeout(1200); out[`${th}:${n}`] = await p.evaluate(MEASURE); } catch (e) { out[`${th}:${n}`] = { err: e.message }; } }
  await c.close();
}
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
for (const [k, v] of Object.entries(out)) console.log(k, v.err || `chico:${v.small.length} contraste:${v.lowc.length} tactil:${v.tap.length} sinnombre:${v.noname.length}`);
await b.close();
