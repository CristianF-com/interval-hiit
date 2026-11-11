import { chromium } from 'playwright';
import fs from 'fs';
const S = process.argv[2];
const GR = {}; // grupos simulados compartidos entre teléfonos
const be = (op, a) => {
  if (op === 'groupGet') return GR[a.c] ? GR[a.c].d : null;
  if (op === 'groupCreate') { GR[a.c] = { d: a.d, m: {} }; return true; }
  if (op === 'memberPut') { if (!GR[a.c]) throw 'no'; GR[a.c].m[a.id] = a.d; return true; }
  if (op === 'memberDel') { delete GR[a.c].m[a.id]; return true; }
  if (op === 'membersList') return Object.entries(GR[a.c].m).map(([id, d]) => ({ id, ...d }));
};
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const ok = (v, m) => { console.log(v ? 'OK ' : 'FALLA ', m); if (!v) process.exitCode = 1; };
async function phone(name, uidv, theme = 'lima') {
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'es-AR' });
  await c.exposeFunction('be', (op, a) => { try { return be(op, a); } catch (e) { return { __err: 'x' }; } });
  await c.addInitScript(u => { window.NO_CLOUD = 1; const call = async (op, a) => { const r = await window.be(op, a); if (r && r.__err) throw { code: 'not-found' }; return r; };
    const me = { uid: u, anon: true };
    window.FBA = { init(c, cb) { setTimeout(() => cb(me), 5); }, user: () => me, signInAnon: async () => me, getMeta: async () => null, putAll: async () => true,
      groupGet: c => call('groupGet', { c }), groupCreate: (c, d) => call('groupCreate', { c, d }), memberPut: (c, id, d) => call('memberPut', { c, id, d }), memberDel: (c, id) => call('memberDel', { c, id }), membersList: c => call('membersList', { c }) }; }, uidv);
  const p = await c.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.goto('http://localhost:8776/'); await p.waitForTimeout(800);
  await p.fill('#ob-name', name); await p.click('#ob-go'); await p.waitForTimeout(300);
  await p.evaluate(th => { S.theme = th; save(); applyTheme(); }, theme);
  return p;
}
const A = await phone('Cris', 'uA');
// meta: 2 sesiones; hago dos entrenamientos reales cortos
await A.evaluate(() => { S.goal = { k: 'n', v: 2 }; save(); });
for (let i = 0; i < 2; i++) {
  await A.evaluate(() => { const w = generate(); w.rounds = [w.rounds[0].slice(0, 2)]; w.warm = []; w.cool = []; startWorkout(w); }); await A.waitForTimeout(500);
  await A.evaluate(() => { P.paused = false; while (P.running) skipNow(); }); await A.waitForTimeout(700);
  await A.evaluate(() => { const a = document.getElementById('award-root'); if (a) a.innerHTML = ''; });
  if (i === 1) { ok(/Meta semanal cumplida/.test(await A.textContent('#d-goal')), 'pantalla final: meta semanal cumplida'); await A.screenshot({ path: S + '/done_goal.png' }); }
  else ok(!(await A.textContent('#d-goal')), 'primera sesión: todavía sin meta');
  await A.click('#d-ok'); await A.waitForTimeout(300);
}
// imagen para compartir
const png = await A.evaluate(async () => { const bl = await shareImage(PS.get('history', [])[0]); const r = new FileReader(); return await new Promise(res => { r.onload = () => res(r.result); r.readAsDataURL(bl); }); });
fs.writeFileSync(S + '/share_lima.png', Buffer.from(png.split(',')[1], 'base64')); ok(png.length > 20000, 'imagen para compartir generada');
// descarga: dos «Difícil» seguidos en el entrenador inteligente
const dl = await A.evaluate(() => { const sm = { I: 6, tests: [], sessions: 3, maxDur: 1800, nextAt: Date.now(), log: [{ at: Date.now() - 864e5, I: 6, why: 'inicio' }], opts: smartOpts(null) }; setSmart(sm); const w = { smart: true }; applyFeedback(w, 'hard'); applyFeedback(w, 'hard'); const s2 = getSmart(); return { on: deloadOn(s2), I: s2.I, nextI: s2.next.I, title: title(s2.next) }; });
ok(dl.on && dl.nextI <= dl.I - 1.4, 'semana de descarga tras dos «Difícil»: ' + JSON.stringify(dl));
await A.evaluate(() => show('coach')); await A.waitForTimeout(300); await A.evaluate(() => setSubtab('coach', 'smart')); await A.waitForTimeout(200);
ok(/Semana de descarga/.test(await A.textContent('#smart')), 'la tarjeta muestra la semana de descarga');
await A.screenshot({ path: S + '/deload.png' });
// rutina compartida: link + QR
await A.evaluate(() => { PS.set('routines', [{ id: 'r1', n: 'Core exprés', w: 30, r: 15, R: 2, rr: 45, ex: Object.keys(CATALOG).filter(k => CATALOG[k].t === 'x').slice(10, 14), warm: false, cool: true }]); goTo('coach', 'coach', 'mine'); });
await A.click('[data-rte="0"]'); await A.waitForTimeout(200); await A.click('#rt-share'); await A.waitForTimeout(900);
ok(await A.$('.qr svg'), 'código QR de la rutina'); await A.screenshot({ path: S + '/rt_share.png' });
const link = await A.evaluate(() => rtLink(PS.get('routines')[0]));
// grupo de amigos
await A.evaluate(() => closeSheet());
await A.evaluate(() => goTo('hist', 'hist', 'friends')); await A.waitForTimeout(300);
await A.click('#fr-new'); await A.waitForTimeout(200); await A.fill('#gn-n', 'Los del gym'); await A.click('#gn-ok'); await A.waitForTimeout(900);
const code = await A.evaluate(() => PS.get('groups', [])[0].c); ok(/^[A-Z0-9]{6}$/.test(code), 'grupo creado con código ' + code);
// teléfono B: abre el link de la rutina y el link del grupo
const B = await phone('Ana', 'uB', 'oscuro');
await B.goto(link); await B.waitForTimeout(900);
ok(/Rutina compartida/.test(await B.textContent('#sheet-root')) && /Core exprés/.test(await B.textContent('#sheet-root')), 'el otro teléfono abre la rutina compartida');
await B.screenshot({ path: S + '/rt_import.png' });
await B.click('#sr-save'); await B.waitForTimeout(400); ok((await B.evaluate(() => PS.get('routines', []).length)) === 1, 'rutina guardada en el otro teléfono');
await B.evaluate(c => { location.hash = 'grp=' + c; }, code); await B.waitForTimeout(600);
await B.click('#gj-ok'); await B.waitForTimeout(900);
await B.evaluate(() => { const H = PS.get('history', []); for (let i = 0; i < 3; i++) H.unshift({ at: Date.now() - i * 3600e3, secs: 1500, full: true, w: { kind: 'coach', parts: ['all'], level: 2, rounds: [], sk: { w: 40, r: 20, rr: 0 } } }); PS.set('history', H); const k = Object.keys(RETOS)[0]; PS.set('retos', { [k]: { k: 0, stage: 2, day: 3, best: 42, log: [], v: 2 } }); PS.set('awards', { first: 1, s5: 1 }); return frPublish(); });
await A.evaluate(() => renderFriends()); await A.waitForTimeout(800);
const rows = await A.$$eval('.rk', r => r.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
ok(rows.length === 2 && /Ana/.test(rows[0]), 'ranking con los dos, Ana primera: ' + JSON.stringify(rows));
await A.screenshot({ path: S + '/friends.png' });
ok(/etapa 2\/3/.test(rows[0]) && /récord 42/.test(rows[0]) && /2 logros/.test(rows[0]), 'Ana muestra reto, récord y logros');
const gaps = await A.evaluate(() => { const g = $('#fr-g').getBoundingClientRect(), c = $('#fr-rank .chart').getBoundingClientRect(), a = $('#fr-invite').getBoundingClientRect(), n = $('#fr-new').getBoundingClientRect(); return [Math.round(c.top - g.bottom), Math.round(a.top - c.bottom), Math.round(n.top - a.bottom)]; });
ok(gaps.every(x => x >= 10), 'espacios entre grupos, tarjeta y botones: ' + gaps);
console.log('errores', A.errs, B.errs); await b.close();
