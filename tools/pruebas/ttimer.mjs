import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'es-AR' });
await c.addInitScript(() => { window.NO_CLOUD = 1; });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/ERR_|404|Failed to load/.test(m.text())) errs.push(m.text()); });
const ok = (v, m) => console.log((v ? 'OK  ' : 'FALLA ') + m);
const D = process.argv[2] || '/tmp';
await p.goto('http://localhost:8776/'); await p.waitForTimeout(800);
await p.fill('#ob-name', 'Cris'); await p.click('#ob-go'); await p.waitForTimeout(400);
await p.click('.subtabs[data-group=coach] [data-st=timer]'); await p.waitForTimeout(300);
ok(await p.isVisible('#tm-new'), 'pestaña Timer visible');
ok((await p.$$('[data-tpp]')).length === 4, '4 plantillas');
await p.screenshot({ path: D + '/tm-list.png', fullPage: true });
// plan de correr 1 hora
const run = await p.evaluate(() => { const c = tmPreset(TM_PRESETS[0]), s = tmPlan(c); return { n: s.length, R: tmRounds(s), tot: s.reduce((a, x) => a + (x.ph === 'p' ? 0 : x.s), 0), last: s[s.length - 1], sum: tmSummary(c) }; });
ok(run.tot === 3600 && run.R === 5 && run.last.s === 240 && run.last.n === 'Lento', 'correr 1 h: 4 rondas completas + 4 min lento = 60 min ' + JSON.stringify(run));
const tab = await p.evaluate(() => { const s = tmPlan(tmPreset(TM_PRESETS[3])); return [s.length, s.reduce((a, x) => a + x.s, 0)]; });
ok(tab[0] === 17 && tab[1] === 250, 'tabata: preparación + 8×(20+10) ' + tab);
const bike = await p.evaluate(() => { const s = tmPlan(tmPreset(TM_PRESETS[1])); return [s[1].n, s[s.length - 1].n, s.reduce((a, x) => a + (x.ph === 'p' ? 0 : x.s), 0)]; });
ok(bike[0] === 'Calentamiento' && bike[1] === 'Enfriamiento' && bike[2] === 2700, 'bici 45 min con calentamiento y enfriamiento ' + bike);
// editor de plantilla
await p.click('[data-tpe="0"] b'); await p.waitForTimeout(400);
ok((await p.$$('#tm-bl .tm-blk')).length === 3, 'editor con 3 bloques');
await p.fill('#tm-n', 'Mi carrera'); await p.fill('#tm-bl [data-m="0"]', '8');
ok(/60 min · 5 rondas/.test(await p.textContent('#tm-sum')), 'resumen: ' + await p.textContent('#tm-sum'));
await p.click('#tm-add'); ok((await p.$$('#tm-bl .tm-blk')).length === 4, 'agregar bloque');
await p.click('#tm-bl [data-rm="3"]');
await p.click('#tm-rep [data-rep=f]'); ok(/hasta que lo detengas/.test(await p.textContent('#tm-sum')), 'sin final');
await p.screenshot({ path: D + '/tm-edit.png', fullPage: true });
await p.click('#tm-save'); await p.waitForTimeout(400);
ok(/Mi carrera/.test(await p.textContent('#timers')), 'guardado en Mis timers');
// arranca y simula el paso del tiempo
await p.click('[data-tmp="0"]'); await p.waitForTimeout(500);
ok(await p.isVisible('#tplayer'), 'reproductor abierto');
const st0 = await p.evaluate(() => [tpCur().n, document.querySelector('#tp-phase').textContent]);
ok(st0[0] === 'Prepárate', 'empieza con preparación ' + st0);
await p.evaluate(() => { TP.last -= 15000; tmTick(); });
await p.waitForTimeout(300);
await p.screenshot({ path: D + '/tm-play.png' });
const st1 = await p.evaluate(() => [tpCur().n, document.querySelector('#tplayer').className, document.querySelector('#tp-num').textContent, document.querySelector('#tp-next').textContent]);
ok(st1[0] === 'Lento' && /easy/.test(st1[1]), 'bloque Lento (suave) ' + JSON.stringify(st1));
await p.evaluate(() => { TP.last -= (8 * 60 + 3 * 60 + 30) * 1000; tmTick(); });   // pasa lento y rápido, 30 s caminando
const st2 = await p.evaluate(() => [tpCur().n, document.querySelector('#tplayer').className, document.querySelector('#tp-sum').textContent]);
ok(st2[0] === 'Caminar' && /rest/.test(st2[1]), 'tras bloquear el teléfono se pone al día ' + JSON.stringify(st2));
await p.screenshot({ path: D + '/tm-play2.png' });
await p.click('#tp-skip'); const st3 = await p.evaluate(() => [tpCur().n, tpCur().r, document.querySelector('#tp-phase').textContent]);
ok(st3[0] === 'Lento' && st3[1] === 1, 'saltar → ronda 2 ' + st3);
await p.click('#tp-prev'); const st4 = await p.evaluate(() => tpCur().n); ok(st4 === 'Caminar', 'anterior vuelve a Caminar');
await p.click('#tp-play'); ok(await p.evaluate(() => TP.paused), 'pausa');
ok(!!(await p.evaluate(() => PS.get('tsession'))), 'sesión guardada para seguir');
await p.click('#tp-close'); await p.waitForTimeout(300); await p.screenshot({ path: D + '/tm-menu.png' });
await p.click('#tp-menu [data-m=end]'); await p.waitForTimeout(800);
ok(await p.isHidden('#tplayer'), 'terminar cierra el reproductor');
ok(/Por bloque/.test(await p.textContent('#sheet-root')), 'resumen por bloque');
await p.screenshot({ path: D + '/tm-done.png' });
const h = await p.evaluate(() => PS.get('history')[0]);
ok(h.w.kind === 'timer' && h.tlog.length >= 2 && h.secs > 700, 'historial ' + JSON.stringify(h.tlog));
await p.evaluate(() => closeSheet());
for (const v of ['hist', 'cal', 'plans', 'retos', 'coach']) { await p.click(`[data-tab=${v}]`); await p.waitForTimeout(300); }
await p.click('[data-tab=hist]'); for (const st of ['sum', 'aw', 'list']) { await p.click(`.subtabs[data-group=hist] [data-st=${st}]`); await p.waitForTimeout(300); }
ok(/Mi carrera/.test(await p.textContent('#hist-list')), 'en la lista de sesiones');
await p.click('#hist-list [data-det="0"]'); await p.waitForTimeout(300);
ok(/Lento/.test(await p.textContent('#sheet-root')), 'detalle con cuenta por bloque');
await p.click('#hd-rep'); await p.waitForTimeout(300); ok(await p.isVisible('#tm-bl'), 'repetir abre el editor');
console.log('errores', errs); await b.close();
