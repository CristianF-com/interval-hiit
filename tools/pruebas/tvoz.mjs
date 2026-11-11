// Revisa que cada frase que dice la app esté grabada (completa) en las 6 voces
import { chromium } from 'playwright';
import fs from 'fs';
const APP = process.env.APP || process.cwd();
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', locale: 'es-AR' });
await c.addInitScript(() => { window.NO_CLOUD = 1; });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:8776/'); await p.waitForTimeout(800);
await p.fill('#ob-name', 'Cris'); await p.click('#ob-go'); await p.waitForTimeout(400);
const res = await p.evaluate(async () => {
  const idx = await loadIdx(); const T = new Set(); const add = x => { if (x) T.add(x); };
  // frases fijas
  ['Voz activada', 'Siguiente ejercicio en 10 segundos.', 'uno', 'dos', 'tres', 'Último.', '10 segundos. Prepárate.', '¡Mitad!', 'Faltan diez.', 'Cambia de lado', 'Seguimos', 'Pausa',
   '¡Terminaste! ¡Entrenamiento completado! Buen trabajo.', '¡Entrenamiento completado! Buen trabajo.', '¡Objetivo! ¡Sigue hasta tu máximo!', '¡Última!', '¡Comienza!',
   'Prepárate.', 'Vamos a estirar.', 'Comienza el entrenamiento.', '¡Terminaste! Ronda completada. Descanso de 60 segundos.', 'Empieza por el lado derecho',
   'Prueba: Sentadillas. Haz todas las que puedas en un minuto y cuéntalas.', '¿Cuántas hiciste? Anótalo. Siguiente: Sentadillas'].forEach(add);
  // logros
  AWARDS.forEach(a => add('Logro conseguido: ' + a[2]));
  // anuncios reales de entrenamientos generados (se captura lo que diría)
  const said = []; const o = say; say = x => said.push(x);
  const runTL = w => { try { P.w = w; P.tl = buildTimeline(w); for (let i = 0; i < P.tl.length; i++) { announce(i, 'auto'); announce(i, 'start'); } } catch (e) { said.push('ERR ' + e.message); } };
  for (const lv of [1, 2, 3]) for (let k = 0; k < 6; k++) { S.level = lv; runTL(generate()); }
  try { const sm = getSmart(); } catch (e) {}
  try { Object.keys(PLANS).forEach(key => { const pl = PLANS[key]; }); } catch (e) {}
  say = o; said.forEach(add);
  // cada ejercicio con los formatos de los anuncios
  Object.keys(CATALOG).forEach(id => { const e = ex(id), n = e.n; add(`¡Terminaste! Ahora: ${n}, 30 segundos${e.s ? ', por lado' : ''}`); add(`Siguiente: ${n}, 12 repeticiones.`); add(`Prepárate. Primero: ${n}, 20 segundos.`); add(n); });
  for (let k = 1; k <= 120; k++) { add(`${k} segundos.`); add(`${k} repeticiones.`); add(`Descanso de ${k} segundos.`); }
  for (let R = 2; R <= 12; R++) for (let r = 1; r <= R; r++) add(`Ronda ${r} de ${R}.`);
  // retos
  Object.keys(RETOS).forEach(key => { const R = RETOS[key]; if (!R || !R.n) return;
    add(`${R.n}. Prueba inicial: todas las que puedas. Prepárate.`);
    for (const k of [0, 1, 2, 3, 4, 5]) for (const st of [1, 2, 3, 4, 5, 6]) { let D; try { D = retoDays(key, k, st); } catch (e) { continue; } if (!D) continue;
      D.forEach(d => { if (!d || !d.sets) return; const n = d.sets.length;
        add(d.test ? `${R.n}. Prueba: ${d.sets[0]} seguidas. Prepárate.` : `${R.n}. Serie 1 de ${n}: ${d.sets[0]} repeticiones. Prepárate.`);
        d.sets.forEach((x, i) => { if (i) { const p = d.pauses[i - 1] || d.pauses[0] || 60, r = n - i; add(`¡Terminaste! Descanso de ${p} segundos. ${r <= 3 ? serieTxt(i, n) + '. ' : ''}Siguiente: ${x} repeticiones.`); add(`¡Comienza! ${serieTxt(i, n)}: ${x} repeticiones.`); } });
        const tot = d.sets.reduce((a, x) => a + x, 0); add(`¡Terminaste! ${tot} ${R.n.toLowerCase()}. Buen trabajo.`); add(`¡Terminaste! ${tot} repeticiones. Buen trabajo.`); }); } });
  // timer
  TM_PRESETS.forEach(pr => { const c = tmPreset(pr); tmPlan(c).forEach((s, i, a) => { if (s.ph === 'p' && !a[i + 1]) return; add(s.ph === 'p' ? t('Prepárate.') + ' ' + t('Primero: {0}.', a[i + 1].n) : s.n + '. ' + tmDurTxt(s.s) + '.'); }); });
  ['Falta un minuto.', '10 segundos.', 'Último bloque.', '¡Terminaste! Buen trabajo.', 'Ronda 2.'].forEach(add);
  const out = [];
  for (const x of T) { const pl = vplan(x, idx);
    if (pl) out.push({ x, ids: pl.filter(q => q.id).map(q => q.id) });
    else { const miss = vnorm(x.replace(/[.!?¡¿:;,]/g, ' ')).split(' ').filter(w => w && !idx[w] && !(VNUM[w] && idx[VNUM[w]])); out.push({ x, miss }); } }
  return out;
});
const V = ['dora', 'alex', 'paula', 'julio', 'ona', 'kimetz'];
const miss = res.filter(r => r.miss), byVoice = {};
for (const r of res.filter(r => r.ids)) for (const v of V) { const lack = r.ids.filter(id => !fs.existsSync(`${APP}/voz/${v}/${id}.mp3`)); if (lack.length) (byVoice[v] = byVoice[v] || []).push(r.x); }
console.log('frases revisadas', res.length);
console.log('SIN GRABAR (todas las voces):', miss.length); miss.forEach(r => console.log('  ', r.x, ' → faltan:', r.miss.join(', ')));
for (const v of V) { const l = byVoice[v] || []; console.log(`FALTAN EN ${v}:`, l.length); l.slice(0, 15).forEach(x => console.log('   ', x)); }
fs.writeFileSync((process.env.OUT || '/tmp/inhiit') + '/tvoz.json', JSON.stringify({ miss, byVoice }, null, 1));
console.log(errs); await b.close();
