'use strict';
/* =========================================================
   Entrenador inteligente de abdominales (basado en el plan de una app de
   abdominales: 3 niveles de 10, 15 y 25 días con días de descanso fijos).
   Mejoras: se adapta a cómo te fue cada sesión, retoma suave si dejas de
   entrenar, ritmo guiado como el original o a tu ritmo, prueba de nivel,
   serie extra opcional y calendario.
   ========================================================= */
const AB_DAYS = [[{"s":3,"p":30,"r":0,"x":[[20,8,6],[11,8,6],[7,8,6]]},{"s":3,"p":30,"r":0,"x":[[11,10,8],[7,10,8],[20,10,8]]},{"s":3,"p":30,"r":1,"x":[[7,12,10],[20,12,10],[11,12,10]]},{"s":3,"p":30,"r":0,"x":[[20,14,12],[11,14,12],[7,14,12]]},{"s":3,"p":30,"r":1,"x":[[11,16,12],[7,16,12],[20,16,12]]},{"s":2,"p":30,"r":0,"x":[[27,18,14],[15,18,14],[23,18,14],[48,18,14]]},{"s":2,"p":30,"r":0,"x":[[15,20,15],[23,20,15],[48,20,15],[27,20,15]]},{"s":2,"p":30,"r":1,"x":[[23,22,16],[48,22,16],[27,22,16],[15,22,16]]},{"s":2,"p":30,"r":0,"x":[[48,24,17],[27,24,17],[15,24,17],[23,24,17]]},{"s":2,"p":30,"r":1,"x":[[27,26,18],[15,26,18],[23,26,18],[48,26,18]]}],[{"s":3,"p":30,"r":0,"x":[[14,18,14],[6,18,14],[18,18,14]]},{"s":3,"p":30,"r":0,"x":[[6,20,15],[18,20,15],[14,20,15]]},{"s":3,"p":30,"r":1,"x":[[18,22,16],[14,22,16],[6,22,16]]},{"s":3,"p":30,"r":0,"x":[[14,24,17],[6,24,17],[18,24,17]]},{"s":3,"p":30,"r":1,"x":[[6,26,18],[18,26,18],[14,26,18]]},{"s":2,"p":30,"r":0,"x":[[28,26,16],[41,26,16],[24,26,16],[27,26,16]]},{"s":2,"p":30,"r":0,"x":[[41,28,17],[24,28,17],[27,28,17],[28,28,17]]},{"s":2,"p":30,"r":1,"x":[[24,30,18],[27,30,18],[28,30,18],[41,30,18]]},{"s":2,"p":30,"r":0,"x":[[28,32,18],[41,32,18],[24,32,18],[27,32,18]]},{"s":2,"p":30,"r":1,"x":[[27,34,20],[28,34,20],[41,34,20],[24,34,20]]},{"s":2,"p":30,"r":0,"x":[[22,26,18],[47,26,18],[31,26,18],[53,26,18],[29,26,18]]},{"s":2,"p":30,"r":0,"x":[[47,28,19],[31,28,19],[53,28,19],[29,26,19],[22,28,19]]},{"s":2,"p":30,"r":1,"x":[[31,30,20],[53,30,20],[29,30,20],[22,26,20],[47,30,20]]},{"s":2,"p":30,"r":0,"x":[[53,32,22],[29,32,22],[22,32,22],[47,26,22],[31,32,22]]},{"s":2,"p":30,"r":1,"x":[[29,34,23],[22,34,23],[47,34,23],[31,26,23],[53,34,23]]}],[{"s":3,"p":30,"r":0,"x":[[45,26,16],[10,26,16],[3,26,16],[16,26,16]]},{"s":3,"p":30,"r":0,"x":[[10,26,17],[3,26,17],[16,26,17],[45,26,17]]},{"s":3,"p":30,"r":1,"x":[[3,28,18],[16,28,18],[45,28,18],[10,28,18]]},{"s":3,"p":30,"r":0,"x":[[16,28,18],[45,28,18],[10,28,18],[3,28,18]]},{"s":3,"p":30,"r":1,"x":[[45,30,20],[10,30,20],[3,30,20],[16,30,20]]},{"s":3,"p":30,"r":0,"x":[[33,30,20],[21,30,20],[4,30,20],[13,30,20]]},{"s":3,"p":30,"r":0,"x":[[21,32,22],[4,32,22],[13,32,22],[33,32,22]]},{"s":3,"p":30,"r":1,"x":[[4,32,22],[13,32,22],[33,32,22],[21,32,22]]},{"s":3,"p":30,"r":0,"x":[[13,34,24],[33,34,24],[21,34,24],[4,34,24]]},{"s":3,"p":30,"r":1,"x":[[33,34,24],[21,34,24],[4,34,24],[13,34,24]]},{"s":2,"p":30,"r":0,"x":[[40,36,26],[51,36,26],[36,36,26],[1,36,26],[17,36,26]]},{"s":2,"p":30,"r":0,"x":[[51,36,26],[36,36,26],[1,36,26],[17,36,26],[40,36,26]]},{"s":2,"p":30,"r":1,"x":[[36,38,28],[1,38,28],[17,38,28],[40,38,28],[51,38,28]]},{"s":2,"p":30,"r":0,"x":[[1,38,28],[17,38,28],[40,38,28],[51,38,28],[36,38,28]]},{"s":2,"p":30,"r":1,"x":[[17,40,30],[40,40,30],[51,40,30],[36,40,30],[1,40,30]]},{"s":3,"p":15,"r":0,"x":[[12,40,30],[30,40,30],[38,40,30],[19,40,30]]},{"s":3,"p":15,"r":0,"x":[[30,42,32],[38,42,32],[19,42,32],[12,42,32]]},{"s":3,"p":15,"r":1,"x":[[38,42,32],[19,42,32],[12,42,32],[30,42,32]]},{"s":3,"p":15,"r":0,"x":[[19,44,34],[12,44,34],[30,44,34],[38,44,34]]},{"s":3,"p":15,"r":1,"x":[[12,44,34],[30,44,34],[38,44,34],[19,44,34]]},{"s":2,"p":15,"r":0,"x":[[37,46,36],[50,46,36],[26,46,36],[49,46,36],[39,46,36],[9,46,36]]},{"s":2,"p":15,"r":0,"x":[[50,46,36],[26,46,36],[49,46,36],[39,46,36],[9,46,36],[37,46,36]]},{"s":2,"p":15,"r":1,"x":[[26,48,38],[49,48,38],[39,48,38],[9,48,38],[37,48,38],[50,48,38]]},{"s":2,"p":15,"r":0,"x":[[49,48,38],[39,48,38],[9,48,38],[37,48,38],[50,48,38],[26,48,38]]},{"s":2,"p":15,"r":1,"x":[[39,50,40],[9,50,40],[37,50,40],[50,50,40],[26,50,40],[49,50,40]]}]];
const AB_PACE_MS = {"1":3200,"2":3200,"3":3200,"4":4800,"5":2400,"6":3200,"7":2400,"8":4800,"9":4800,"10":2400,"11":4800,"12":2400,"13":3200,"14":3200,"15":3200,"16":3200,"17":3200,"18":2400,"19":2400,"20":3200,"21":2400,"22":2400,"23":3200,"24":2400,"25":3200,"26":3200,"27":3200,"28":3200,"29":2400,"30":3200,"31":3200,"32":3200,"33":2400,"34":4800,"35":2400,"36":4800,"37":3200,"38":4800,"39":4800,"40":3200,"41":4800,"45":3200,"46":3200,"47":2400,"48":3200,"49":3200,"50":3200,"51":3200,"52":3200,"53":3200};
// número de ejercicio del plan → ejercicio de INHIIT (los que ya existían se reutilizan)
const AB_ID = { 1: 'ab_adductor_crunch', 3: 'ab_scissor_legs', 4: 'straight_leg_bicycle_crunches', 6: 'ab_crossover', 7: 'crunches', 9: 'push_up_side_planks',
  10: 'table_top_crunches', 11: 'ab_hip_drop', 12: 'v_ups', 13: 'ab_crunch_reach', 14: 'ab_knee_touch', 15: 'ab_bent_leg_raise', 16: 'mountain_climbers',
  17: 'bicycle_crunches', 18: 'reverse_crunches', 19: 'russian_twist_hard', 20: 'ab_table_twist', 21: 'knee_tuck_crunches', 22: 'ab_side_bridge_r',
  23: 'ab_side_leg_lift_r', 24: 'ab_stretch_crunch', 26: 'ab_side_plank_lift_r', 27: 'sit_ups', 28: 'leg_raises', 29: 'ab_toe_touch', 30: 'ab_hip_raise',
  31: 'ab_oblique_crunch_r', 33: 'bridge', 36: 'high_plank_leg_lifts', 37: 'ab_double_knee_r', 38: 'low_plank_knee_to_elbow', 39: 'high_plank_limb_raises',
  40: 'ab_thread_needle_r', 41: 'russian_twist_easy', 45: 'scissor_kicks', 47: 'ab_side_bridge_l', 48: 'ab_side_leg_lift_l', 49: 'ab_side_plank_lift_l',
  50: 'ab_double_knee_l', 51: 'ab_thread_needle_l', 53: 'ab_oblique_crunch_l' };
const AB_NEW = {
  ab_adductor_crunch: ['Crunch de aductores', 3, 'Boca arriba con las piernas hacia el techo, abiertas en V. Despega los hombros y lleva las manos al centro, entre los pies.'],
  ab_toe_touch: ['Toque de puntas con piernas arriba', 2, 'Piernas rectas hacia el techo. Despega los hombros y estira los brazos para tocar las puntas de los pies.'],
  ab_hip_raise: ['Elevación de cadera con piernas arriba', 3, 'Piernas rectas hacia el techo y brazos en el suelo. Empuja los pies hacia arriba despegando la cadera, sin impulso, y baja lento.'],
  ab_scissor_legs: ['Tijeras cruzadas', 3, 'Boca arriba, piernas rectas un poco despegadas del suelo. Ábrelas y crúzalas alternando cuál queda arriba, con la zona lumbar pegada al suelo.'],
  ab_crossover: ['Crunch cruzado combinado', 2, 'Boca arriba, un tobillo apoyado sobre la rodilla contraria. Lleva el codo opuesto hacia esa rodilla girando el tronco.'],
  ab_hip_drop: ['Caída de rodillas a los lados', 1, 'Boca arriba, brazos abiertos y rodillas flexionadas en el aire. Baja las rodillas juntas hacia un lado sin despegar los hombros y vuelve al centro; alterna.'],
  ab_crunch_reach: ['Crunch con brazos arriba', 3, 'Rodillas flexionadas y brazos estirados hacia el techo. Despega los hombros empujando las manos hacia arriba.'],
  ab_knee_touch: ['Crunch con toque de rodillas', 2, 'Rodillas flexionadas y manos sobre los muslos. Sube deslizando las manos hasta tocar las rodillas y baja lento.'],
  ab_bent_leg_raise: ['Elevación de piernas flexionadas', 1, 'Boca arriba con las rodillas flexionadas. Sube las piernas hasta que los muslos queden verticales y baja sin apoyar los pies.'],
  ab_table_twist: ['Crunch en mesa con giro', 1, 'Piernas en posición de mesa (rodillas a 90°). Sube en crunch llevando el codo hacia la rodilla contraria; alterna.'],
  ab_stretch_crunch: ['Crunch con extensión de piernas', 2, 'Recoge las rodillas hacia el pecho mientras subes el tronco y estira las piernas al bajar, sin apoyar los pies.'],
  ab_side_bridge: ['Plancha lateral', 2, 'Apoyado en el antebrazo, cuerpo alineado y cadera alta. Mantén la posición sin dejar caer la cadera.'],
  ab_side_leg_lift: ['Elevación lateral de piernas', 1, 'Tumbado de lado con las piernas juntas y rectas. Súbelas juntas unos centímetros y baja lento.'],
  ab_side_plank_lift: ['Plancha lateral con elevación', 3, 'Plancha lateral sobre la mano: sube la pierna y el brazo de arriba y bájalos sin dejar caer la cadera.'],
  ab_oblique_crunch: ['Crunch oblicuo', 2, 'Rodillas flexionadas y caídas hacia un lado, hombros mirando al techo. Sube el tronco llevando el hombro hacia la cadera.'],
  ab_double_knee: ['Doble rodilla en cuadrupedia', 3, 'En cuatro apoyos con las rodillas apenas despegadas del suelo: lleva una rodilla hacia el pecho dos veces seguidas y estírala atrás.'],
  ab_thread_needle: ['Enhebrar la aguja', 3, 'Plancha lateral sobre el antebrazo: pasa el brazo de arriba por debajo del cuerpo girando el tronco y vuelve a abrirlo.'],
};
Object.entries(AB_NEW).forEach(([id, [n, lv, d]]) => {
  const sided = /^ab_(side_|oblique|double|thread)/.test(id);
  const put = (k, nm) => { CATALOG[k] = { n: nm, p: 'c', lv, j: 0, t: 'x', d, ab: 1 }; };
  if (sided) { put(id + '_r', n + ' (derecha)'); put(id + '_l', n + ' (izquierda)'); } else put(id, n);
});
const AB_LV = ['Principiante', 'Intermedio', 'Avanzado'];
const getAbs = () => PS.get('abs', null);
const setAbs = v => v ? PS.set('abs', v) : PS.del('abs');
const abFemale = () => PROFILE && PROFILE.variant && PROFILE.variant !== 'm';
const abPace = n => (AB_PACE_MS[n] || 3200) / 1000;
// repeticiones del día con el ajuste personal (k): nunca menos de 4
const abReps = (st, x) => Math.max(4, Math.round((abFemale() ? x[2] : x[1]) * (st.k || 1)));
const abDayOf = st => AB_DAYS[(st.level || 1) - 1][Math.min(st.day || 0, AB_DAYS[(st.level || 1) - 1].length - 1)];
function abItems(st) {
  const d = abDayOf(st);
  return d.x.map(x => ({ id: AB_ID[x[0]], n: x[0], cnt: abReps(st, x), sets: d.s, rest: d.p, pace: abPace(x[0]) }));
}
const abSetSecs = it => Math.ceil(it.cnt * it.pace);
function abMinutes(st) {
  const its = abItems(st), d = abDayOf(st);
  const s = its.reduce((a, it) => a + it.sets * abSetSecs(it) + (it.sets - 1) * it.rest, 0) + (its.length - 1) * d.p;
  return Math.max(1, Math.round(s / 60));
}
function abWorkout(st) {
  const lv = st.level || 1, items = abItems(st);
  if (S.abExtra) items[items.length - 1] = { ...items[items.length - 1], sets: items[items.length - 1].sets + 1, extra: 1 };
  return { kind: 'abs', title: `Abdominales · ${AB_LV[lv - 1]} · día ${(st.day || 0) + 1}`, level: lv, day: st.day || 0, items, restEx: abDayOf(st).p,
    guided: S.abGuided !== false, warm: S.abWarm !== false ? shuffle(WARM).slice(0, 3) : [], cool: S.abCool ? shuffle(COOL).slice(0, 3) : [], rounds: [] };
}
// más de una semana sin entrenar: se retrocede dos días y se baja un poco la exigencia
function abComeback(st) {
  if (!st.lastAt || Date.now() - st.lastAt < 8 * DAY) return false;
  st.day = Math.max(0, (st.day || 0) - 2); st.k = Math.max(0.7, (st.k || 1) * 0.92); st.lastAt = Date.now(); st.back = Date.now();
  return true;
}
// según el último resultado de la prueba de capacidad (abdominales en 1 minuto), el nivel sugerido
function abLevelFromTest() {
  const t = PS.get('history', []).find(x => x.w && x.w.kind === 'test' && x.w.results && +x.w.results.ab > 0);
  if (!t) return 0; const n = +t.w.results.ab; return n < 25 ? 1 : n < 45 ? 2 : 3;
}

/* ---------- Tarjeta en el Coach ---------- */
const abOptsHTML = () => optFold('ab-opts', abTogglesHTML());
const abTogglesHTML = () => `<div class="toggles">
      <button class="tg" data-abo="abGuided" role="switch" aria-checked="${S.abGuided !== false}"><span>Ritmo guiado<small>Marca cada repetición como el plan original; apagado, haces las repeticiones a tu ritmo y tocas ✓</small></span><i class="sw"></i></button>
      <button class="tg" data-abo="abTick" role="switch" aria-checked="${S.abTick !== false}"><span>Sonido en cada repetición<small>Un toque suave para seguir el ritmo</small></span><i class="sw"></i></button>
      <button class="tg" data-abo="abExtra" role="switch" aria-checked="${!!S.abExtra}"><span>Serie extra<small>Una serie más del último ejercicio para ir un poco más allá</small></span><i class="sw"></i></button>
      <button class="tg" data-abo="abWarm" role="switch" aria-checked="${S.abWarm !== false}"><span>Calentamiento<small>3 movimientos suaves de 30 s antes</small></span><i class="sw"></i></button>
      <button class="tg" data-abo="abCool" role="switch" aria-checked="${!!S.abCool}"><span>Estiramientos al final<small>3 estiramientos de 30 s</small></span><i class="sw"></i></button>
      ${gapRowHTML('ab-gap')}</div>`;
function bindAbOpts(el) {
  bindFolds(el); el.querySelectorAll('#ab-gap').forEach(g => g.onclick = e => { const x = e.target.closest('[data-v]'); if (!x) return; g.querySelectorAll('button').forEach(y => y.setAttribute('aria-pressed', y === x)); S.sideGap = +x.dataset.v; save(); });
  el.querySelectorAll('[data-abo]').forEach(b => b.onclick = () => { const k = b.dataset.abo, on = b.getAttribute('aria-checked') !== 'true'; S[k] = on; save(); b.setAttribute('aria-checked', on); if (k === 'abExtra') { renderAbs(); renderAbAi(); } });
}
// el plan de abdominales se ve en Planes; esto lo refresca donde esté a la vista
function renderAbs() { try { if (currentView === 'plans') renderPlans(); } catch (e) { console.error(e); } }
function abNextLevel() { const s = getAbs(); s.level++; s.day = 0; s.k = Math.max(0.85, Math.min(1.1, s.k || 1)); s.levelDone = false; s.nextAt = dayStart(Date.now()); setAbs(s); renderAbs(); toast(t('Nivel {0}', t(AB_LV[s.level - 1]).toLowerCase())); }
function abRepeatLevel() { const s = getAbs(), L = AB_DAYS[s.level - 1]; s.day = s.level === 3 ? L.length - 10 : 0; s.k = Math.min(1.5, (s.k || 1) * 1.1); s.levelDone = false; s.nextAt = dayStart(Date.now()); setAbs(s); renderAbs(); }
function openAbSetup(edit, pre) {
  const st = getAbs(), sug = abLevelFromTest(); let lv = pre || (st ? st.level : (sug || 1));
  sheet(`<h3>Abdominales</h3>
    <p class="sub">Tres niveles con días de entrenamiento y de descanso fijos. Las repeticiones suben día a día y se ajustan según cómo te va.</p>
    <h2>Nivel</h2><div class="seg" id="abs-lv">${AB_LV.map((n, i) => `<button data-v="${i + 1}" aria-pressed="${lv === i + 1}">${n}</button>`).join('')}</div>
    <p class="note" id="abs-lv-n"></p>
    ${sug && !edit ? `<p class="note">${t('Según tu última prueba de capacidad te sugiero {0}.', '<b>' + t(AB_LV[sug - 1]).toLowerCase() + '</b>')}</p>` : ''}
    ${edit ? '' : '<p class="note">¿No sabes cuál elegir? Haz todos los crunches que puedas en 1 minuto: menos de 25, principiante; de 25 a 44, intermedio; 45 o más, avanzado.</p>'}
    <div style="height:14px"></div><button class="btn" id="abs-ok">${edit ? 'Guardar' : 'Crear plan'}</button>
    ${edit ? '<div class="gap"></div><button class="btn ghost small" id="abs-restart">Empezar el nivel de nuevo</button><div class="gap"></div><button class="btn danger" id="abs-off">Desactivar abdominales</button>' : ''}`, () => {
    const info = () => { const L = AB_DAYS[lv - 1]; $('#abs-lv-n').textContent = t('{0} días de entrenamiento · {1} ejercicios por sesión', L.length, L[0].x.length + '–' + Math.max(...L.map(d => d.x.length))); };
    bindSeg('abs-lv', 'v', v => { lv = +v; info(); }); info();
    $('#abs-ok').onclick = () => {
      const cur = getAbs();
      const nst = cur ? (cur.level !== lv ? { ...cur, level: lv, day: 0, levelDone: false } : cur) : { level: lv, day: 0, k: 1, sessions: 0, nextAt: dayStart(Date.now()), created: Date.now() };
      setAbs(nst); closeSheet(); renderAbs(); if (currentView === 'plans') renderPlans(); toast(edit ? 'Guardado' : 'Plan creado · aparece en el calendario');
    };
    const rs = $('#abs-restart'); if (rs) rs.onclick = () => confirmApp('¿Empezar el nivel de nuevo?', 'Vuelves al día 1 de este nivel. El ajuste personal se mantiene.', 'Empezar de nuevo', () => { const s = getAbs(); s.day = 0; s.levelDone = false; s.nextAt = dayStart(Date.now()); setAbs(s); closeSheet(); renderAbs(); });
    const off = $('#abs-off'); if (off) off.onclick = async () => { if (await askApp('Desactivar abdominales', 'Se borra tu avance en el plan. El historial se mantiene.', 'Desactivar', true)) { setAbs(null); closeSheet(); renderAbs(); } };
  });
}
function openAbStart() {
  const st = getAbs(); if (!st) { openAbSetup(); return; }
  if (abComeback(st)) { setAbs(st); renderAbs(); }
  const its = abItems(st);
  sheet(`<h3>Día ${(st.day || 0) + 1} · ${AB_LV[st.level - 1]}</h3>
    <p class="sub">${t('{0} series de cada ejercicio con {1} s de descanso · ~{2} min', its[0].sets, its[0].rest, abMinutes(st))}</p>
    <div class="block">${its.map((it, i) => exRow(it.id, i, '', `${it.sets}×${it.cnt}`)).join('')}</div>
    <h2>Para esta sesión</h2>${abTogglesHTML()}
    <div class="gap"></div><button class="btn" id="abw-go">Empezar</button>`, () => {
    bindAbOpts($('#sheet-root'));
    $('#abw-go').onclick = () => { const s2 = getAbs(); closeSheet(); startWorkout(abWorkout(s2)); };
  });
}

/* ---------- Al terminar: avanza el plan; la respuesta ajusta las repeticiones ---------- */
const AB_FB = { easy: 1.08, ok: 1.02, hard: 0.9 };
const _finishAb = finish;
finish = function (full, reason) {
  const w = P.w;
  _finishAb(full, reason);
  if (!w || w.kind !== 'abs' || w.ai || !full) return;
  const st = getAbs(); if (!st || st.level !== w.level) return;
  const L = AB_DAYS[st.level - 1], d = L[Math.min(w.day, L.length - 1)];
  st.before = { day: st.day, k: st.k, nextAt: st.nextAt, levelDone: !!st.levelDone };
  st.sessions = (st.sessions || 0) + 1; st.lastAt = Date.now();
  if (w.day >= L.length - 1) st.levelDone = true;
  else st.day = w.day + 1;
  st.nextAt = addDays(dayStart(Date.now()), d.r ? 2 : 1);
  setAbs(st); renderAbs(); try { renderPlans(); } catch (e) {}
};
const _setFeedbackAb = setFeedback;
setFeedback = function (fb) {
  if (!lastDone || lastDone.w.kind !== 'abs' || lastDone.w.ai) return _setFeedbackAb(fb);
  lastDone.fb = fb;
  const h = PS.get('history', []); if (h[0] && h[0].at >= lastDone.at - 1000) { h[0].fb = fb; PS.set('history', h); }
  const st = getAbs(); if (!st || !st.before) return;
  // cambiar la respuesta no suma dos veces: se parte del estado de antes de la sesión
  const b = st.before, L = AB_DAYS[st.level - 1];
  st.k = Math.max(0.7, Math.min(1.5, (b.k || 1) * (AB_FB[fb] || 1)));
  if (fb === 'hard' && !b.levelDone) { st.day = b.day; st.levelDone = false; st.nextAt = addDays(dayStart(Date.now()), 1); }   // difícil: se repite el día, con menos repeticiones
  else { st.day = Math.min(lastDone.w.day + 1, L.length - 1); st.levelDone = lastDone.w.day >= L.length - 1; st.nextAt = addDays(dayStart(Date.now()), L[lastDone.w.day].r ? 2 : 1); }
  setAbs(st); renderAbs();
  const msg = $('#fb-msg');
  if (msg) { msg.innerHTML = fb === 'hard' ? 'La próxima vez repetimos este día con algunas repeticiones menos.' : fb === 'easy' ? 'La próxima vez subo un poco más las repeticiones.' : 'Seguimos con el plan.'; msg.classList.remove('hidden'); }
};
const _rdeAb = renderDoneExtras;
renderDoneExtras = function (full, secs) {
  _rdeAb(full, secs);
  const w = P.w; if (!w || w.kind !== 'abs') return;
  const reps = (P.log || []).reduce((a, r) => a + (r[1] || 0), 0);
  $('#d-stats').innerHTML = `<div class="stat"><b>${fmt(secs)}</b><span>tiempo activo</span></div><div class="stat"><b>${w.items.length}</b><span>ejercicios</span></div><div class="stat"><b>${reps}</b><span>repeticiones</span></div>`;
  const st = getAbs(); if (full && st && st.levelDone) toast('¡Nivel completado!');
};

/* ---------- Calendario: días de entrenamiento y descanso del plan ---------- */
const _agAb = buildAgenda;
buildAgenda = function () {
  const ag = _agAb(), st = getAbs(); if (!st || st.levelDone) return ag;
  const today = dayStart(Date.now()), L = AB_DAYS[st.level - 1];
  let t = Math.max(today, dayStart(st.nextAt || Date.now()));
  for (let i = st.day || 0; i < L.length && t <= addDays(today, HORIZON); i++) { const k = dkey(t); (ag[k] = ag[k] || []).push({ type: 'abs', i, first: i === (st.day || 0) }); t = addDays(t, L[i].r ? 2 : 1); }
  return ag;
};
const _itAb = itemTitle, _isAb = itemSub;
itemTitle = x => x.type === 'abs' ? `${t('Abdominales')} · ${t('día {0}', x.i + 1)}` : _itAb(x);
itemSub = x => { if (x.type !== 'abs') return _isAb(x); const st = getAbs(); if (!st) return ''; const d = AB_DAYS[st.level - 1][x.i]; return `${t(AB_LV[st.level - 1])} · ${t('{0} ejercicios', d.x.length)} · ${t('{0} series', d.s)}`; };
const _oaAb = openAgendaItem;
openAgendaItem = function (o) {
  if (o.type !== 'abs') return _oaAb(o);
  const st = getAbs(); if (!st) return;
  const t0 = o.t != null ? o.t : Date.now(), isToday = dkey(t0) === dkey(Date.now()), when = isToday ? 'hoy' : new Date(t0).toLocaleDateString(LOC, { weekday: 'long', day: 'numeric', month: 'long' });
  const its = abItems({ ...st, day: o.i });
  sheet(`<h3>${esc(itemTitle(o))}</h3><p class="sub">${t('Programado para {0}', esc(t(when)))} · ${t(AB_LV[st.level - 1])}</p>
    <div class="block">${its.map((it, i) => exRow(it.id, i, '', `${it.sets}×${it.cnt}`)).join('')}</div>
    ${o.first ? `<button class="btn" id="ai-go">${isToday || Date.now() >= (st.nextAt || 0) ? 'Empezar' : 'Hacerlo ahora'}</button><div class="gap"></div>
      <button class="btn ghost small" id="ai-post">Pasar al día siguiente</button>` : '<p class="note">Las repeticiones de los próximos días se ajustan según cómo te vaya.</p>'}`, () => {
    const go = $('#ai-go'); if (go) go.onclick = () => { closeSheet(); openAbStart(); };
    const po = $('#ai-post'); if (po) po.onclick = () => { const s2 = getAbs(); s2.nextAt = addDays(Math.max(dayStart(Date.now()), s2.nextAt || 0), 1); setAbs(s2); closeSheet(); renderCal(); renderAbs(); toast(t('Pasado al {0}', t(WDN[wdOf(s2.nextAt)]))); };
  });
};

/* ---------- En Planes: el plan de abdominales con su cronograma ---------- */
const AB_DESC = ['Para empezar: 3 o 4 ejercicios básicos por sesión, de 6 a 26 repeticiones.', 'Más ejercicios y repeticiones, con oblicuos y planchas laterales.', 'Sesiones largas y exigentes, con planchas dinámicas y hasta 50 repeticiones.'];
function abPlansHTML() {
  const st = getAbs();
  if (!st) return `<h2>Abdominales</h2><p class="sub">Plan diario de abdominales con días de descanso. Se puede combinar con cualquier otro plan.</p><div class="plans-cat">${AB_LV.map((n, i) => { const L = AB_DAYS[i];
    return `<button class="plan-card" data-abl="${i + 1}"><span class="wk">${t('{0} días', L.length)}</span><b>${t('Abdominales')} · ${t(n)}</b><p>${t(AB_DESC[i])}</p>
      <div class="tags"><span class="tag">${t('{0} ejercicios', Math.min(...L.map(d => d.x.length)) + '–' + Math.max(...L.map(d => d.x.length)))}</span><span class="tag">${t('Repeticiones guiadas')}</span></div></button>`; }).join('')}</div>`;
  const L = AB_DAYS[st.level - 1], cur = st.levelDone ? L.length : (st.day || 0);
  let tday = Math.max(dayStart(Date.now()), dayStart(st.nextAt || Date.now()));
  const rows = L.map((d, i) => {
    const done = i < cur, next = i === cur, when = !done ? tday : 0;
    if (!done) tday = addDays(tday, d.r ? 2 : 1);
    const reps = abReps(st, d.x[0]);
    return `<button class="day ${done ? 'is-done' : next ? 'next' : ''}" data-abd="${i}"><span class="dn">${done ? '✓' : i + 1}</span><span class="t"><b>${next ? t('Siguiente:') + ' ' : ''}${t('Día {0}', i + 1)}</b><small>${done ? t('Hecho') : esc(whenStr(when))} · ${t('{0} ejercicios', d.x.length)} · ${d.s}×${reps}${d.r ? ' · ' + t('después, un día de descanso') : ''}</small></span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg></button>`;
  }).join('');
  return `<h2>Abdominales</h2><div class="now abs"><div class="wk">${t('Abdominales')} · ${t(AB_LV[st.level - 1])}</div><b class="name">${st.levelDone ? t('¡Nivel completado!') : t('Día {0} de {1}', cur + 1, L.length)}</b>
      <div class="pbar"><i style="width:${Math.round(cur / L.length * 100)}%"></i></div>
      <div class="pmeta"><span>${t('{0} de {1} días', cur, L.length)}</span><span>${t('{0} sesiones', st.sessions || 0)}</span></div></div>
    ${st.levelDone ? `<div class="block review"><div class="block-h"><b>${t('¡Nivel completado!')}</b><span>🎉</span></div><p>${t('Terminaste los {0} días del nivel {1}.', L.length, t(AB_LV[st.level - 1]).toLowerCase())}</p>
      <div class="opts">${st.level < 3 ? `<button class="btn small" id="abp-next">${t('Pasar a {0}', t(AB_LV[st.level]).toLowerCase())}</button>` : ''}<button class="btn ghost small" id="abp-again">${st.level < 3 ? t('Repetir el nivel un poco más exigente') : t('Seguir: últimos 10 días más exigentes')}</button></div></div>` : `<button class="btn" id="abp-go">${Date.now() >= (st.nextAt || 0) ? t('Empezar día {0}', cur + 1) : t('Hacer el día {0} ahora', cur + 1)}</button><div class="gap"></div>`}
    ${abOptsHTML()}
    <div class="block">${rows}</div>
    <div class="row"><button class="btn ghost small" id="abp-cfg">${t('Ajustes')}</button></div>`;
}
const _rpAb = renderPlans;
renderPlans = function () {
  _rpAb();
  const el = $('#v-plans'); if (!el || !PROFILE) return;
  const box = document.createElement('div'); box.id = 'abs-plans'; box.innerHTML = abPlansHTML(); el.appendChild(box);
  box.querySelectorAll('[data-abl]').forEach(b => b.onclick = () => openAbSetup(false, +b.dataset.abl));
  box.querySelectorAll('[data-abd]').forEach(b => b.onclick = () => { const st = getAbs(), i = +b.dataset.abd; if (!st) return;
    if (i === (st.day || 0) && !st.levelDone) { openAgendaItem({ type: 'abs', i, first: true, t: Math.max(Date.now(), st.nextAt || 0) }); return; }
    const its = abItems({ ...st, day: i });
    sheet(`<h3>${t('Día {0}', i + 1)} · ${t(AB_LV[st.level - 1])}</h3><p class="sub">${i < (st.day || 0) || st.levelDone ? t('Hecho') : t('Las repeticiones de los próximos días se ajustan según cómo te vaya.')}</p>
      <div class="block">${its.map((it, k) => exRow(it.id, k, '', `${it.sets}×${it.cnt}`)).join('')}</div>`); });
  const c = $('#abp-cfg'); if (c) c.onclick = () => openAbSetup(true);
  const go = $('#abp-go'); if (go) go.onclick = () => openAbStart();
  const nx = $('#abp-next'); if (nx) nx.onclick = abNextLevel;
  const ag = $('#abp-again'); if (ag) ag.onclick = abRepeatLevel;
  bindAbOpts(box);
};
/* =========================================================
   Coach inteligente de abdominales: sin fecha de fin.
   Mide tu capacidad (crunches en 1 minuto y plancha), arma cada sesión con los
   ejercicios del plan según tu nivel (superior, oblicuos e inferior) y sube la
   dificultad de a poco según cómo te va. Cada tanto, una sesión de descarga.
   ========================================================= */
// categoría (1 superior, 2 oblicuos y estabilidad, 3 inferior) y dificultad (1 a 3) de cada ejercicio de la app original
const AB_META = { 1: [3, 3], 3: [1, 2], 4: [3, 3], 6: [2, 1], 7: [1, 1], 9: [2, 3], 10: [1, 2], 11: [2, 1], 12: [3, 3], 13: [1, 2], 14: [2, 2], 15: [3, 1], 16: [2, 2],
  17: [2, 2], 18: [1, 1], 19: [2, 2], 20: [2, 1], 21: [1, 2], 22: [2, 2], 23: [2, 1], 24: [1, 1], 26: [2, 3], 27: [1, 1], 28: [3, 2], 29: [1, 2], 30: [3, 3],
  31: [2, 2], 33: [3, 2], 36: [1, 2], 37: [2, 3], 38: [2, 3], 39: [1, 3], 40: [2, 3], 41: [2, 2], 45: [1, 2], 47: [2, 2], 48: [2, 1], 49: [2, 3], 50: [2, 3], 51: [2, 3], 53: [2, 2] };
const AB_PAIR = { 22: 47, 23: 48, 26: 49, 31: 53, 37: 50, 40: 51 };   // derecha → izquierda
const AB_LEFT = new Set(Object.values(AB_PAIR));
const AB_HOLD = new Set([22, 47]);                                    // planchas laterales: se miden con la prueba de plancha
const AB_CAT = ['Abdomen superior', 'Oblicuos', 'Abdomen inferior'];
const getAbAi = () => PS.get('absAi', null);
const setAbAi = v => v ? PS.set('absAi', v) : PS.del('absAi');
const AB_DELOAD_EVERY = 8;
// nivel inicial según la prueba: crunches en 1 minuto (y plancha en segundos, si la hiciste)
function abAiLevel(cr, pl) { let I = cr < 15 ? 1 : cr < 25 ? 2 : cr < 35 ? 3.5 : cr < 45 ? 5 : cr < 60 ? 6.5 : 8; if (pl) I += pl < 30 ? -0.5 : pl > 90 ? 0.5 : 0; return Math.max(1, I); }
const abAiDeload = st => (st.sessions || 0) > 0 && ((st.sessions || 0) + 1) % AB_DELOAD_EVERY === 0;
// arma la sesión: cantidad de ejercicios, series, descanso y repeticiones salen de la intensidad (I) y de tu prueba
function abAiSession(st, seedN) {
  const I0 = st.I || 1, dl = abAiDeload(st), I = dl ? Math.max(1, I0 - 1.5) : I0;
  const maxD = I < 3 ? 1 : I < 6 ? 2 : 3;
  const nEx = Math.min(6, 3 + Math.floor(I / 3)), sets = Math.min(4, (nEx <= 4 ? 3 : 2) + (I > 14 ? 1 : 0)), rest = I >= 8 ? 15 : 30;
  // generador pseudoaleatorio con semilla: la sesión de hoy no cambia cada vez que la abres
  let x = ((seedN != null ? seedN : st.sessions || 0) * 2654435761 + (st.created || 1)) >>> 0;
  const rnd = () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; };
  const last = new Set(st.lastNs || []);
  const pool = Object.keys(AB_META).map(Number).filter(n => !AB_LEFT.has(n) && AB_META[n][1] <= maxD);
  const score = n => (AB_META[n][1] === maxD ? 1.6 : 1) * (last.has(n) ? 0.35 : 1) * (0.6 + rnd());
  const pick = [], cats = [0, 0, 0];
  let slots = nEx;
  while (slots > 0) {
    const need = cats.indexOf(Math.min(...cats)) + 1;   // reparte entre superior, oblicuos e inferior
    const opts = pool.filter(n => !pick.includes(n) && AB_META[n][0] === need && (!AB_PAIR[n] || slots >= 2));
    const from = opts.length ? opts : pool.filter(n => !pick.includes(n) && (!AB_PAIR[n] || slots >= 2));
    if (!from.length) break;
    const n = from.sort((a, b) => score(b) - score(a))[0];
    pick.push(n); cats[AB_META[n][0] - 1] += AB_PAIR[n] ? 2 : 1; slots -= AB_PAIR[n] ? 2 : 1;
  }
  const cr = (st.test && st.test.cr) || 20, pl = (st.test && st.test.pl) || 40;
  const items = [];
  pick.forEach(n => {
    const pace = abPace(n), dfac = [1, 0.85, 0.7][AB_META[n][1] - 1];
    let cnt = AB_HOLD.has(n) ? Math.round(pl * (0.35 + 0.035 * I) / pace) : Math.round(cr * (0.3 + 0.045 * I) * dfac);
    cnt = Math.max(6, Math.min(60, cnt));
    const one = { id: AB_ID[n], n, cnt, sets, rest, pace };
    items.push(one); if (AB_PAIR[n]) items.push({ ...one, id: AB_ID[AB_PAIR[n]], n: AB_PAIR[n] });
  });
  return { items, I, deload: dl };
}
function abAiWorkout(st) {
  const ss = abAiSession(st), items = ss.items.slice();
  if (S.abExtra && !ss.deload) items[items.length - 1] = { ...items[items.length - 1], sets: items[items.length - 1].sets + 1, extra: 1 };
  return { kind: 'abs', ai: 1, title: `${t('Abdominales')} · ${t('Sesión {0}', (st.sessions || 0) + 1)}${ss.deload ? ' · ' + t('descarga') : ''}`, I: ss.I, deload: ss.deload, items,
    restEx: items[0].rest, guided: S.abGuided !== false, warm: S.abWarm !== false ? shuffle(WARM).slice(0, 3) : [], cool: S.abCool ? shuffle(COOL).slice(0, 3) : [], rounds: [] };
}
const abAiMinutes = items => Math.max(1, Math.round((items.reduce((a, it) => a + it.sets * abSetSecs(it) + (it.sets - 1) * it.rest, 0) + (items.length - 1) * items[0].rest) / 60));
// días: entrena dos días seguidos y descansa uno (como el plan original)
const abAiNext = st => addDays(dayStart(Date.now()), (st.streak || 0) >= 2 ? 2 : 1);
// más de una semana sin entrenar: baja medio punto por semana (como mucho 2)
function abAiComeback(st) {
  if (!st.lastAt) return false; const wk = Math.floor((Date.now() - st.lastAt) / (7 * DAY)); if (wk < 1) return false;
  const d = Math.min(2, wk * 0.5); st.I = Math.max(1, st.I - d); st.lastAt = Date.now(); st.streak = 0; (st.log = st.log || []).unshift({ at: Date.now(), I: st.I, why: 'vuelta' }); st.back = Date.now();
  return true;
}
function renderAbAi() {
  const el = $('#abs'); if (!el || !PROFILE) return;
  const st = getAbAi();
  if (!st) {
    el.innerHTML = `<div class="now abs"><div class="wk">${t('Entrenador inteligente · Abdominales')}</div><b class="name">${t('Abdominales a tu medida')}</b>
      <p class="sub">${t('Mide tu capacidad con una prueba corta y arma cada sesión con ejercicios de abdomen superior, oblicuos e inferior. No tiene fecha de fin: la dificultad sube de a poco según cómo te va.')}</p>
      ${abOptsHTML()}<div class="gap"></div><button class="btn" id="abi-start">${t('¡Empezar!')}</button></div>`;
    $('#abi-start').onclick = () => openAbAiSetup(); bindAbOpts(el);
    return;
  }
  const ss = abAiSession(st), due = Date.now() >= (st.nextAt || 0), tst = st.test, old = tst && Date.now() - tst.at > 42 * DAY;
  const lvl = Math.min(100, Math.round(st.I * 10));
  el.innerHTML = `<div class="now abs"><div class="wk">${t('Abdominales')} · ${t('Sesión {0}', (st.sessions || 0) + 1)}${ss.deload ? ' · ' + t('descarga') : ''}</div>
    <b class="name">${t('Nivel {0}', d1(st.I))}</b>
    <div class="ab-bar"><i style="width:${lvl}%"></i></div>
    <p class="sub">${[...new Set(ss.items.map(it => ex(it.id).n.replace(/ \((derecha|izquierda)\)$/, '')))].map(esc).join(' · ')}</p>
    <p class="note">${due ? t('Toca hoy.') : t('Próxima: {0}.', esc(whenStr(st.nextAt)))} ${t('{0} ejercicios · {1} series · ~{2} min', ss.items.length, ss.items[0].sets, abAiMinutes(ss.items))}.</p>
    ${ss.deload ? `<p class="note">${t('Sesión de descarga: un poco más suave para recuperar y seguir subiendo.')}</p>` : ''}
    ${st.back && Date.now() - st.back < 3 * DAY ? `<p class="note">${t('Volviste después de unos días: retomamos un poco más suave.')}</p>` : ''}<div class="gap"></div>
    <div class="row"><button class="btn ${due ? '' : 'ghost'}" id="abi-go">${due ? t('Empezar') : t('Entrenar igual')}</button><button class="btn ghost" id="abi-cfg">${t('Ajustes')}</button></div>
    <p class="note">${tst && tst.est ? t('Sin prueba: empiezo por el nivel elegido y lo ajusto con tus respuestas.') : tst ? t('Prueba del {0}: {1} crunches', dateStr(tst.at), tst.cr) + (tst.pl ? ' · ' + t('plancha {0} s', tst.pl) : '') + (old ? ' · <b>' + t('conviene repetirla') + '</b>' : '') : ''}</p>
    ${abOptsHTML()}
    <button class="btn ghost small" id="abi-test" style="margin-top:8px">${tst && !tst.est ? t('Repetir la prueba') : t('Medir mi nivel')}</button></div>`;
  bindAbOpts(el);
  $('#abi-go').onclick = () => openAbAiStart();
  $('#abi-cfg').onclick = () => openAbAiSettings();
  $('#abi-test').onclick = () => openAbAiTest();
}
function openAbAiSetup() {
  const sug = abLevelFromTest(); let lv = sug || 1;
  sheet(`<h3>${t('AI abdominales')}</h3>
    <p class="sub">${t('Sesiones de abdominales que se arman a tu medida y suben de a poco, dos días sí y uno no.')}</p>
    <p class="note">${t('La prueba son crunches en 1 minuto y, si quieres, cuánto aguantas la plancha. Con eso calculo tu nivel real.')}</p>
    <div style="height:14px"></div><button class="btn" id="abis-test">${t('Medir mi nivel y empezar')}</button>
    <h2 class="or-h">${t('O sin prueba')}</h2><p class="note">${t('Elige tu nivel: parto de ahí y lo ajusto con tus respuestas.')}</p>
    <div class="seg" id="abis-lv">${AB_LV.map((n, i) => `<button data-v="${i + 1}" aria-pressed="${lv === i + 1}">${t(n)}</button>`).join('')}</div>
    <div style="height:12px"></div><button class="btn ghost" id="abis-skip">${t('Empezar sin prueba')}</button>
    <p class="note">${t('¿Prefieres un plan cerrado de 10, 15 o 25 días? Están en Planes.')}</p>`, () => {
    bindSeg('abis-lv', 'v', v => { lv = +v; });
    $('#abis-test').onclick = () => { closeSheet(); openAbAiTest(); };
    $('#abis-skip').onclick = () => {
      const I = [2, 4.5, 7][lv - 1], cr = [15, 30, 50][lv - 1];
      setAbAi({ I, test: { at: 0, cr, pl: 0, est: 1 }, sessions: 0, streak: 0, nextAt: dayStart(Date.now()), created: Date.now(), log: [{ at: Date.now(), I, why: 'inicio' }] });
      closeSheet(); renderAbAi(); toast(t('Listo: tu primera sesión está preparada'));
    };
  });
}
function openAbAiTest() {
  const prev = getAbAi(), capTest = PS.get('history', []).find(x => x.w && x.w.kind === 'test' && x.w.results && +x.w.results.ab > 0);
  const cr0 = (prev && prev.test && !prev.test.est && prev.test.cr) || (capTest ? +capTest.w.results.ab : '');
  sheet(`<h3>${t('Prueba de abdominales')}</h3>
    <p class="sub">${t('Dos ejercicios con buena técnica. Descansa 2 minutos entre uno y otro.')}</p>
    <div class="block" id="dbt-rows"><div class="dbt"><div class="t"><b>${esc(ex('crunches').n)}</b><small>${t('Todos los que puedas en 1 minuto')}</small></div>
      <div class="dbt-c"><label class="reps"><input type="number" inputmode="numeric" min="0" max="150" id="abt-cr" value="${cr0}" placeholder="0"><small>reps</small></label></div></div>
    <div class="dbt"><div class="t"><b>${esc(ex('low_plank').n)}</b><small>${t('Opcional: cuánto aguantas con buena postura')}</small></div>
      <div class="dbt-c"><label class="reps"><input type="number" inputmode="numeric" min="0" max="600" id="abt-pl" value="${(prev && prev.test && !prev.test.est && prev.test.pl) || ''}" placeholder="0"><small>s</small></label></div></div></div>
    ${capTest && !prev ? `<p class="note">${t('Usé el resultado de tu última prueba de capacidad. Puedes cambiarlo.')}</p>` : ''}
    <button class="btn" id="abt-ok">${prev ? t('Guardar y recalcular') : t('Calcular mi nivel')}</button>`, () => {
    $('#abt-ok').onclick = () => {
      const cr = Math.min(150, parseInt($('#abt-cr').value, 10) || 0), pl = Math.min(600, parseInt($('#abt-pl').value, 10) || 0);
      if (!cr) { toast(t('Anota cuántos crunches hiciste')); return; }
      const lv = abAiLevel(cr, pl), cur = getAbAi();
      // al repetir la prueba, el nivel se mueve hacia lo medido pero sin perder lo ganado de golpe
      const I = cur ? Math.max(1, Math.round((cur.I * 0.5 + Math.max(lv, cur.I - 1) * 0.5) * 10) / 10) : lv;
      const st = cur ? { ...cur, I, test: { at: Date.now(), cr, pl } } : { I, test: { at: Date.now(), cr, pl }, sessions: 0, streak: 0, nextAt: dayStart(Date.now()), created: Date.now(), log: [] };
      (st.log = st.log || []).unshift({ at: Date.now(), I, why: 'prueba' }); st.tests = [{ at: Date.now(), cr, pl }, ...(st.tests || [])].slice(0, 20);
      setAbAi(st); closeSheet(); renderAbAi();
      toast(t('Nivel {0}', d1(I)) + (cur ? '' : ' · ' + t('aparece en el calendario')));
    };
  });
}
function openAbAiSettings() {
  const st = getAbAi(); if (!st) return;
  sheet(`<h3>${t('Coach de abdominales')}</h3><p class="sub">${t('Nivel {0}', d1(st.I))} · ${t('{0} sesiones', st.sessions || 0)}</p>
    <h2>${t('Ajustar la dificultad')}</h2><div class="row"><button class="btn ghost small" id="abc-dn">${t('Más fácil')}</button><button class="btn ghost small" id="abc-up">${t('Más difícil')}</button></div>
    <p class="note">${t('Cada toque mueve el nivel medio punto. El coach igual lo sigue ajustando con tus respuestas.')}</p>
    ${(st.log || []).length ? `<h2>${t('Historial del nivel')}</h2><div class="block">${st.log.slice(0, 8).map(l => `<div class="hist"><div class="t"><b>${t('Nivel {0}', d1(l.I))}</b><small>${dateStr(l.at)} · ${t(AB_WHY[l.why] || l.why)}</small></div></div>`).join('')}</div>` : ''}
    <div class="gap"></div><button class="btn danger" id="abc-off">${t('Desactivar el coach de abdominales')}</button>`, () => {
    const mv = d => { const s2 = getAbAi(); s2.I = Math.max(1, Math.round((s2.I + d) * 10) / 10); (s2.log = s2.log || []).unshift({ at: Date.now(), I: s2.I, why: 'manual' }); setAbAi(s2); renderAbAi(); closeSheet(); toast(t('Nivel {0}', d1(s2.I))); };
    $('#abc-dn').onclick = () => mv(-0.5); $('#abc-up').onclick = () => mv(0.5);
    $('#abc-off').onclick = async () => { if (await askApp(t('Desactivar el coach de abdominales'), t('Se borran tu nivel y tus pruebas. El historial se mantiene.'), t('Desactivar'), true)) { setAbAi(null); closeSheet(); renderAbAi(); } };
  });
}
const AB_WHY = { inicio: 'inicio', prueba: 'prueba', easy: 'te resultó fácil', ok: 'bien', hard: 'te costó', none: 'sesión hecha', vuelta: 'volviste después de unos días', manual: 'ajuste manual' };
function openAbAiStart() {
  const st = getAbAi(); if (!st) { openAbAiTest(); return; }
  if (abAiComeback(st)) { setAbAi(st); renderAbAi(); }
  const ss = abAiSession(st);
  sheet(`<h3>${t('Sesión {0}', (st.sessions || 0) + 1)}${ss.deload ? ' · ' + t('descarga') : ''}</h3>
    <p class="sub">${t('{0} series de cada ejercicio con {1} s de descanso · ~{2} min', ss.items[0].sets, ss.items[0].rest, abAiMinutes(ss.items))}</p>
    <div class="block">${ss.items.map((it, i) => exRow(it.id, i, '', `${it.sets}×${it.cnt}`)).join('')}</div>
    <h2>${t('Para esta sesión')}</h2>${abTogglesHTML()}
    <div class="gap"></div><button class="btn" id="abiw-go">${t('Empezar')}</button>`, () => {
    bindAbOpts($('#sheet-root'));
    $('#abiw-go').onclick = () => { const s2 = getAbAi(); closeSheet(); startWorkout(abAiWorkout(s2)); };
  });
}
// al terminar: cuenta la sesión y sube un poco; la respuesta ajusta cuánto
const AB_AI_STEP = { easy: 0.45, ok: 0.25, hard: -0.4, none: 0.15 };
const _finishAi = finish;
finish = function (full, reason) {
  const w = P.w;
  _finishAi(full, reason);
  if (!w || w.kind !== 'abs' || !w.ai || !full) return;
  const st = getAbAi(); if (!st) return;
  st.before = { I: st.I, nextAt: st.nextAt, streak: st.streak || 0 };
  const consec = st.lastAt && dayStart(Date.now()) - dayStart(st.lastAt) <= DAY;
  st.streak = consec ? (st.streak || 0) + 1 : 1;
  st.sessions = (st.sessions || 0) + 1; st.lastAt = Date.now(); st.lastNs = w.items.map(i => i.n);
  if (!w.deload) st.I = Math.round((st.I + AB_AI_STEP.none) * 100) / 100;
  (st.log = st.log || []).unshift({ at: Date.now(), I: st.I, why: 'none' }); st.log = st.log.slice(0, 40);
  st.nextAt = abAiNext(st);
  setAbAi(st); renderAbAi();
};
const _setFeedbackAi = setFeedback;
setFeedback = function (fb) {
  if (!lastDone || lastDone.w.kind !== 'abs' || !lastDone.w.ai) return _setFeedbackAi(fb);
  lastDone.fb = fb;
  const h = PS.get('history', []); if (h[0] && h[0].at >= lastDone.at - 1000) { h[0].fb = fb; PS.set('history', h); }
  const st = getAbAi(); if (!st || !st.before) return;
  const step = lastDone.w.deload ? Math.min(0, AB_AI_STEP[fb]) : AB_AI_STEP[fb];   // en la descarga no se sube
  st.I = Math.max(1, Math.round((st.before.I + step) * 100) / 100);
  if (st.log && st.log[0]) { st.log[0].I = st.I; st.log[0].why = fb; }
  setAbAi(st); renderAbAi();
  const msg = $('#fb-msg');
  if (msg) { msg.innerHTML = `${fb === 'hard' ? t('La próxima sesión será un poco más suave.') : fb === 'easy' ? t('La próxima sesión sube un poco más.') : t('La próxima sesión sube un poco.')} ${t('Nivel {0}', d1(st.I))}.`; msg.classList.remove('hidden'); }
};
// calendario: las próximas sesiones del coach (las de más adelante se ajustan con cada respuesta)
const _agAi = buildAgenda;
buildAgenda = function () {
  const ag = _agAi(), st = getAbAi(); if (!st) return ag;
  const today = dayStart(Date.now()); let t0 = Math.max(today, dayStart(st.nextAt || Date.now())), streak = st.streak || 0;
  if (dayStart(t0) - dayStart(st.lastAt || 0) > DAY) streak = 0;
  for (let c = 0; c < 40 && t0 <= addDays(today, HORIZON); c++) {
    const k = dkey(t0); (ag[k] = ag[k] || []).push({ type: 'absai', n: (st.sessions || 0) + 1 + c, first: c === 0 });
    streak++; t0 = addDays(t0, streak >= 2 ? 2 : 1); if (streak >= 2) streak = 0;
  }
  return ag;
};
const _itAi = itemTitle, _isAi = itemSub;
itemTitle = x => x.type === 'absai' ? `${t('Abdominales')} · ${t('Sesión {0}', x.n)}` : _itAi(x);
itemSub = x => { if (x.type !== 'absai') return _isAi(x); const st = getAbAi(); if (!st) return ''; if (!x.first) return t('se ajusta según la sesión anterior'); const ss = abAiSession(st); return `${t('{0} ejercicios', ss.items.length)} · ~${abAiMinutes(ss.items)} min`; };
const _oaAi = openAgendaItem;
openAgendaItem = function (o) {
  if (o.type !== 'absai') return _oaAi(o);
  const st = getAbAi(); if (!st) return;
  if (o.first) { openAbAiStart(); return; }
  sheet(`<h3>${esc(itemTitle(o))}</h3><p class="sub">${t('Los ejercicios y las repeticiones se eligen después de la sesión anterior, según cómo te fue.')}</p>`);
};
const _rdeAi = renderDoneExtras;
renderDoneExtras = function (full, secs) {
  const st = getAbAi(); if (st && st.before && (!P.w || !P.w.ai)) { delete st.before; setAbAi(st); }
  _rdeAi(full, secs);
};
SUBTAB_SHOW['coach:abs'] = renderAbAi;
const _rsAb = renderSmart;
renderSmart = function () { _rsAb(); try { renderAbAi(); } catch (e) { console.error(e); } };
renderAbAi();
