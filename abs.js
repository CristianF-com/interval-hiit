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
      <button class="tg" data-abo="abCool" role="switch" aria-checked="${!!S.abCool}"><span>Estiramientos al final<small>3 estiramientos de 30 s</small></span><i class="sw"></i></button></div>`;
function bindAbOpts(el) {
  bindFolds(el);
  el.querySelectorAll('[data-abo]').forEach(b => b.onclick = () => { const k = b.dataset.abo, on = b.getAttribute('aria-checked') !== 'true'; S[k] = on; save(); b.setAttribute('aria-checked', on); if (k === 'abExtra') renderAbs(); });
}
function renderAbs() {
  const el = $('#abs'); if (!el || !PROFILE) return;
  const st = getAbs();
  if (!st) {
    el.innerHTML = `<div class="now abs"><div class="wk">Entrenador de abdominales</div><b class="name">Abdominales en casa</b>
      <p class="sub">Un plan de 3 niveles (10, 15 y 25 días) con sesiones cortas y días de descanso. Cada sesión se ajusta según cómo te fue la anterior y aparece en el calendario.</p>
      ${abOptsHTML()}
      <div class="gap"></div><button class="btn" id="ab-setup">Empezar abdominales</button></div>`;
    $('#ab-setup').onclick = () => openAbSetup(); bindAbOpts(el);
    return;
  }
  const L = AB_DAYS[(st.level || 1) - 1], due = Date.now() >= (st.nextAt || 0);
  if (st.levelDone) {
    el.innerHTML = `<div class="now abs"><div class="wk">Abdominales · ${AB_LV[st.level - 1]}</div><b class="name">¡Nivel completado!</b>
      <p class="sub">${t('Terminaste los {0} días del nivel {1}.', L.length, t(AB_LV[st.level - 1]).toLowerCase())}</p><div class="gap"></div>
      ${st.level < 3 ? `<button class="btn" id="ab-next">${t('Pasar a {0}', t(AB_LV[st.level]).toLowerCase())}</button><div class="gap"></div>` : ''}
      <button class="btn ${st.level < 3 ? 'ghost' : ''}" id="ab-again">${st.level < 3 ? 'Repetir el nivel un poco más exigente' : 'Seguir: últimos 10 días más exigentes'}</button>
      <div class="gap"></div><button class="btn ghost small" id="ab-cfg">Ajustes</button></div>`;
    const nx = $('#ab-next'); if (nx) nx.onclick = () => { const s = getAbs(); s.level++; s.day = 0; s.k = Math.max(0.85, Math.min(1.1, s.k || 1)); s.levelDone = false; s.nextAt = dayStart(Date.now()); setAbs(s); renderAbs(); toast(t('Nivel {0}', t(AB_LV[s.level - 1]).toLowerCase())); };
    $('#ab-again').onclick = () => { const s = getAbs(); s.day = s.level === 3 ? L.length - 10 : 0; s.k = Math.min(1.5, (s.k || 1) * 1.1); s.levelDone = false; s.nextAt = dayStart(Date.now()); setAbs(s); renderAbs(); };
    $('#ab-cfg').onclick = () => openAbSetup(true);
    return;
  }
  const its = abItems(st), pct = Math.round((st.day || 0) / L.length * 100);
  el.innerHTML = `<div class="now abs"><div class="wk">Abdominales · ${AB_LV[st.level - 1]}</div><b class="name">${t('Día {0} de {1}', (st.day || 0) + 1, L.length)}</b>
    <div class="ab-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
    <p class="sub">${its.map(it => esc(ex(it.id).n)).join(' · ')}</p>
    <p class="note">${due ? t('Toca hoy.') : t('Próxima: {0}.', esc(whenStr(st.nextAt)))} ${t('{0} series × {1} rep · ~{2} min', its[0].sets, its[0].cnt, abMinutes(st))}${st.k && Math.abs(st.k - 1) > 0.02 ? ' · ' + t('ajuste personal {0} %', (st.k > 1 ? '+' : '−') + Math.round(Math.abs(st.k - 1) * 100)) : ''}.</p>
    ${st.back && Date.now() - st.back < 3 * DAY ? '<p class="note">Volviste después de unos días: retomamos un poco más suave.</p>' : ''}<div class="gap"></div>
    <div class="row"><button class="btn ${due ? '' : 'ghost'}" id="ab-go">${due ? 'Empezar' : 'Entrenar igual'}</button><button class="btn ghost" id="ab-cfg">Ajustes</button></div>
    ${abOptsHTML()}</div>`;
  bindAbOpts(el);
  $('#ab-go').onclick = () => openAbStart();
  $('#ab-cfg').onclick = () => openAbSetup(true);
}
function openAbSetup(edit) {
  const st = getAbs(), sug = abLevelFromTest(); let lv = st ? st.level : (sug || 1);
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
      setAbs(nst); closeSheet(); renderAbs(); toast(edit ? 'Guardado' : 'Plan creado · aparece en el calendario');
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
  if (!w || w.kind !== 'abs' || !full) return;
  const st = getAbs(); if (!st || st.level !== w.level) return;
  const L = AB_DAYS[st.level - 1], d = L[Math.min(w.day, L.length - 1)];
  st.before = { day: st.day, k: st.k, nextAt: st.nextAt, levelDone: !!st.levelDone };
  st.sessions = (st.sessions || 0) + 1; st.lastAt = Date.now();
  if (w.day >= L.length - 1) st.levelDone = true;
  else st.day = w.day + 1;
  st.nextAt = addDays(dayStart(Date.now()), d.r ? 2 : 1);
  setAbs(st); renderAbs();
};
const _setFeedbackAb = setFeedback;
setFeedback = function (fb) {
  if (!lastDone || lastDone.w.kind !== 'abs') return _setFeedbackAb(fb);
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
SUBTAB_SHOW['coach:abs'] = renderAbs;
const _rsAb = renderSmart;
renderSmart = function () { _rsAb(); try { renderAbs(); } catch (e) { console.error(e); } };
renderAbs();
