// Amigos: la fila del grupo lleva los retos (en curso y máximos) sin listas anidadas (Firestore no las acepta)
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'es-AR' });
await c.addInitScript(() => { window.NO_CLOUD = 1; });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
const ok = (v, m) => console.log((v ? 'OK  ' : 'FALLA ') + m);
await p.goto('http://localhost:8776/'); await p.waitForTimeout(700);
await p.fill('#ob-name', 'Cris'); await p.click('#ob-go'); await p.waitForTimeout(300);
const r = await p.evaluate(async () => {
  const now = Date.now();
  PS.set('retos', {
    pullups: { k: -1, stage: 3, day: 3, best: 1, log: [{ at: now - 1e5, k: -1, stage: 3, day: 2, sets: [1, 1, 1] }] },
    squats: { k: 1, stage: 1, day: 6, best: 17, log: [{ at: now - 2e5, k: 1, stage: 1, day: 5, sets: [17, 10] }] },
    pushups: { k: 0, stage: 1, day: 6, best: 12, goalsDone: 1, log: [{ at: now - 3e5 }] }
  });
  // nube de mentira: rechaza listas anidadas como Firestore
  const nested = v => Array.isArray(v) ? v.some(x => Array.isArray(x) || nested(x)) : v && typeof v === 'object' ? Object.values(v).some(nested) : false;
  const store = {};
  window.FBA = { memberPut: async (g, id, d) => { if (nested(d)) throw Object.assign(new Error('Nested arrays are not supported'), { code: 'invalid-argument' }); store[id] = d; },
    membersList: async () => Object.entries(store).map(([id, d]) => ({ id, ...d })), memberDel: async () => {} };
  window.cloudUser = async () => ({ uid: 'u1' });
  PS.set('groups', [{ c: 'ABC123', n: 'Familia' }]);
  const x = frExtra();
  await frPublish();
  return { x, nested: nested(x), saved: Object.keys(store).length };
});
ok(!r.nested, 'sin listas anidadas');
ok(r.saved === 1, 'la fila se publica en el grupo');
ok(r.x.rt.length === 3 && r.x.rt[0].k === 'pullups' && r.x.rt[0].n === 'Dominadas sueltas', 'retos con nombre de la etapa, el último primero ' + JSON.stringify(r.x.rt[0]));
await p.click('[data-tab=hist]'); await p.waitForTimeout(200); await p.click('.subtabs[data-group=hist] [data-st=friends]');
await p.waitForTimeout(800);
const txt = await p.evaluate(() => (document.querySelector('#fr-rank') || {}).textContent || '');
ok(/Dominadas sueltas/.test(txt) && /máximo 17/.test(txt) && /Sentadillas/.test(txt), 'el ranking muestra los retos y sus máximos');
await p.locator('#fr-rank').screenshot({ path: (process.env.OUT || '/tmp/inhiit') + '/amigos.png' }).catch(() => {});
console.log('errores', errs); await b.close();
