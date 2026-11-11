'use strict';
/* =========================================================
   Voz del entrenador: audios grabados (Dora, Alex, Paula, Julio, Ona y Kimetz)
   o la voz del teléfono. Se carga al final y reemplaza a say().
   ========================================================= */
// entre paréntesis, la variante del español de cada voz
const VOICES = { dora: 'Dora (Español latino)', alex: 'Alex (Español latino)', paula: 'Paula (Español latino)', julio: 'Julio (Español latino)', ona: 'Ona (Español México)', kimetz: 'Kimetz (Español México)', sistema: 'Voz del teléfono' };
const MALE_VOICES = ['alex', 'julio', 'kimetz'];
// voces que ya tienen sus audios en voz/<voz>/ (se agregan acá cuando están listas)
const READY_VOICES = ['dora', 'alex', 'paula', 'julio', 'ona', 'kimetz', 'sistema'];
const sysSay = say; // voz del sistema (speechSynthesis), queda como respaldo
const VNUM = { cero: '0', uno: '1', dos: '2', tres: '3' };
const vnorm = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
let VIDX = null;
// revisión de los audios de cada voz: al regenerarlos se sube el número y el teléfono baja los nuevos
// (los audios quedan guardados para siempre en el teléfono, así que sin esto seguiría usando los viejos)
const VOZ_REV = { paula: 2, julio: 2 };
const vozUrl = (voice, id) => `voz/${voice}/${id}.mp3` + (VOZ_REV[voice] ? `?r=${VOZ_REV[voice]}` : '');
// borra del teléfono los audios viejos de las voces regeneradas (para no ocupar lugar de más)
setTimeout(async () => {
  try {
    if (!self.caches) return; const c = await caches.open('intervalo-voz');
    for (const req of await c.keys()) { const u = new URL(req.url), m = u.pathname.match(/\/voz\/([a-z]+)\//); if (m && VOZ_REV[m[1]] && u.searchParams.get('r') !== String(VOZ_REV[m[1]])) await c.delete(req); }
  } catch (e) {}
}, 8000);
const loadIdx = () => VIDX || (VIDX = fetch('voz/index.json').then(r => r.ok ? r.json() : null).catch(() => null));
const vbuf = new Map();
// las voces grabadas (Dora, Alex, Paula, Julio, Ona y Kimetz) son en español: en otro idioma se usa la del teléfono
const voiceOf = () => LANG !== 'es' ? 'sistema' : (S.voiceSrc && READY_VOICES.includes(S.voiceSrc)) ? S.voiceSrc : 'dora';
function audioCtx() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state !== 'running') AC.resume().catch(() => {}); // iOS: «suspended» o «interrupted» (tras un aviso del sistema)
  return AC;
}
function getBuf(voice, id) {
  const key = voice + '/' + id;
  if (!vbuf.has(key)) {
    const p = fetch(vozUrl(voice, id)).then(r => { if (!r.ok) throw new Error('404'); return r.arrayBuffer(); })
      .then(a => new Promise((res, rej) => audioCtx().decodeAudioData(a, res, rej)));
    p.catch(() => vbuf.delete(key));
    vbuf.set(key, p);
  }
  return vbuf.get(key);
}
// texto → lista de audios y pausas (el tramo más largo que exista grabado gana)
function vplan(text, idx) {
  const toks = [];
  text.replace(/ · /g, ', ').split(/([.!?¡¿:;,])/).forEach(part => {
    if (/^[.!?:;]$/.test(part)) toks.push({ gap: 0.28 });
    else if (part === ',') toks.push({ gap: 0.12 });
    else if (/^[¡¿]$/.test(part)) return;
    else vnorm(part).split(' ').filter(Boolean).forEach(w => {
      if (VNUM[w] && idx[VNUM[w]] && !idx[w]) w = VNUM[w];
      // números de 301 a 999: «cuatrocientos» + «doce»
      // números de 1000 a 9999: «mil» / «2» + «mil» y el resto (los retos largos pasan las mil repeticiones)
      if (/^\d+$/.test(w) && !idx[w] && +w >= 1000 && +w < 10000 && idx.mil) { const m = Math.floor(+w / 1000), r = +w % 1000; if (m > 1) toks.push({ w: String(m) }); toks.push({ w: 'mil' });
        if (r) { if (idx[String(r)] || r <= 300) toks.push({ w: String(r) }); else { const c = Math.floor(r / 100) * 100, x = r % 100; toks.push({ w: String(c) }); if (x) toks.push({ w: String(x) }); } } return; }
      if (/^\d+$/.test(w) && !idx[w] && +w > 300 && +w < 1000) { const c = Math.floor(+w / 100) * 100, r = +w % 100; toks.push({ w: String(c) }); if (r) toks.push({ w: String(r) }); return; }
      toks.push({ w });
    });
  });
  const out = [];
  for (let i = 0; i < toks.length;) {
    if (toks[i].gap != null) { out.push({ gap: toks[i].gap }); i++; continue; }
    // el tramo grabado más largo gana, aunque cruce signos de puntuación: las frases enteras
    // («Ahora: Sentadillas.», «Descanso de 30 segundos.») suenan más naturales que palabras pegadas
    let found = null;
    for (let j = Math.min(toks.length, i + 24); j > i; j--) {
      const seg = toks.slice(i, j); if (seg[seg.length - 1].gap != null) continue;
      const id = idx[seg.filter(t => t.gap == null).map(t => t.w).join(' ')]; if (id) { found = { id, n: j - i }; break; }
    }
    if (!found) return null;
    out.push({ id: found.id }); i += found.n;
  }
  return out;
}
let vGen = 0, vSrcs = [];
function vStop() { vGen++; vSrcs.forEach(s => { try { s.stop(); } catch (e) {} }); vSrcs = []; }
async function vPlay(text, voice) {
  const my = ++vGen;
  vSrcs.forEach(s => { try { s.stop(); } catch (e) {} }); vSrcs = [];
  const idx = await loadIdx();
  const plan = idx && vplan(text, idx);
  if (!plan) return false;
  let bufs;
  try { bufs = await Promise.all(plan.map(p => p.id ? getBuf(voice, p.id) : null)); } catch (e) { return false; }
  if (my !== vGen) return true; // ya se pidió otra frase
  let ctx = audioCtx();
  // audio frenado (por ejemplo al desbloquear el iPhone): se espera un momento a que vuelva (más si se está
  // recuperando); si no vuelve, la frase se dice con la voz del teléfono en lugar de quedar en cola para más tarde
  if (ctx.state !== 'running') { await acWait(ctx, acFixing ? 2500 : 400); if (my !== vGen) return true; ctx = audioCtx(); if (ctx.state !== 'running') return false; }
  let t = ctx.currentTime + 0.03;
  plan.forEach((p, i) => {
    if (p.gap != null) { t += p.gap; return; }
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = bufs[i]; g.gain.value = 1; src.connect(g).connect(ctx.destination); src.start(t);
    vSrcs.push(src); t += bufs[i].duration + 0.06;
  });
  return true;
}
// reemplaza la voz de toda la app
say = function (t) {
  if (S.sound !== 'voz') return;
  t = tr(t);   // en inglés se traduce antes de hablar (con la voz del teléfono)
  const v = voiceOf();
  if (v === 'sistema') { vStop(); sysSay(t); return; }
  try { speechSynthesis.cancel(); } catch (e) {}
  vPlay(t, v).then(ok => { if (!ok) sysSay(t); }).catch(() => sysSay(t));
};
// al empezar un entrenamiento se precargan los audios que se van a usar
function vPreload(tl) {
  const v = voiceOf(); if (v === 'sistema') return;
  loadIdx().then(idx => {
    if (!idx) return;
    const texts = ['Terminaste. Comienza. Siguiente: Prepárate. Primero: Descanso de segundos repeticiones. Mitad. Cambia de lado. Ronda de Ronda completada.', '1 2 3'];
    tl.forEach(s => {
      const id = s.ex || s.next;
      if (id) { const n = ex(id).n; texts.push(n, `Ahora: ${n}.`, `Siguiente: ${n}.`, `Primero: ${n}.`); }
      if (s.reps) texts.push(String(s.reps), `${s.reps} repeticiones.`);
      if (s.dur) texts.push(String(s.dur), `${s.dur} segundos.`, `${s.dur} segundos, por lado.`, `Descanso de ${s.dur} segundos.`);
    });
    texts.forEach(t => { const p = vplan(t, idx); if (p) p.forEach(x => { if (x.id) getBuf(v, x.id).catch(() => {}); }); });
  });
}
// el audio en iPhone solo arranca dentro de un toque: cualquier toque lo reactiva si quedó suspendido
// (por ejemplo después de pedir permiso a los sensores o de una llamada)
document.addEventListener('pointerdown', () => { try { if (!AC || AC.state !== 'running') audioCtx(); } catch (e) {} }, true);
document.addEventListener('touchend', () => { try { if (AC && AC.state !== 'running') AC.resume().catch(() => {}); } catch (e) {} }, { passive: true, capture: true });
const acWait = (ctx, ms) => new Promise(res => { if (ctx.state === 'running') return res(); const t0 = performance.now(); ctx.resume().catch(() => {}); const iv = setInterval(() => { if ((AC || ctx).state === 'running' || performance.now() - t0 > ms) { clearInterval(iv); res(); } }, 40); });
/* ---------- Audio después de bloquear y desbloquear el iPhone ----------
   Al bloquear, iOS interrumpe el audio. Al volver puede quedar de tres formas: «suspended» o «interrupted»
   (hay que reanudarlo, y recién desbloqueado el primer intento suele fallar), o «running» pero mudo (el reloj
   del audio no avanza). Por eso:
   1) al ocultarse la app se suspende a propósito: un contexto suspendido por la app vuelve mejor que uno
      interrumpido por el sistema;
   2) al volver se reintenta varias veces durante unos segundos, comprobando que el reloj del audio avance;
      si dice «running» pero está mudo se suspende y reanuda, y si nada alcanza se crea un contexto nuevo;
   3) mientras hay un entrenamiento, reto o timer en pantalla, un vigilante repite la comprobación. */
const acSleep = ms => new Promise(r => setTimeout(r, ms));
const acRace = (p, ms) => Promise.race([Promise.resolve(p).catch(() => {}), acSleep(ms)]);
// ¿suena de verdad? el estado es «running» y el reloj del audio avanza
const acAlive = (ctx, ms = 160) => new Promise(res => { const t0 = ctx.currentTime; setTimeout(() => res(ctx.state === 'running' && ctx.currentTime > t0), ms); });
let acFixing = false, AUDIO_WANT = false;
async function acRecover() {
  if (acFixing || !AC || document.visibilityState !== 'visible') return;
  acFixing = true;
  try {
    for (let n = 0; n < 14 && AC && document.visibilityState === 'visible'; n++) {   // unos 6 segundos de intentos
      const ctx = AC;
      // reactivar la sesión de audio del sistema antes de reanudar (a veces queda desactivada tras el bloqueo)
      if (AUDIO_WANT && (n === 2 || n === 7)) { try { navigator.audioSession.type = 'auto'; navigator.audioSession.type = 'transient'; } catch (e) {} }
      if (ctx.state !== 'running') await acRace(ctx.resume(), 350);
      if (await acAlive(ctx)) return;
      if (ctx.state === 'running') {   // «running» pero mudo
        await acRace(ctx.suspend(), 300); await acRace(ctx.resume(), 350);
        if (await acAlive(ctx)) return;
      }
      if (n === 6 && AC === ctx) {   // nada alcanzó: contexto nuevo (los audios ya descargados se vuelven a usar)
        try { ctx.close(); } catch (e) {}
        AC = null; try { audioCtx(); } catch (e) {}
      }
      await acSleep(220);
    }
  } finally { acFixing = false; }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    vStop(); try { speechSynthesis.cancel(); } catch (e) {}
    try { if (AC && AC.state === 'running') AC.suspend().catch(() => {}); } catch (e) {}
    return;
  }
  try { speechSynthesis.cancel(); } catch (e) {}
  acRecover();
});
window.addEventListener('pageshow', () => acRecover());
window.addEventListener('focus', () => acRecover());
// vigilante: con un reproductor en pantalla, si el audio no está sonando se intenta recuperarlo
let acLastT = -1;
setInterval(() => {
  if (!AC || acFixing || document.visibilityState !== 'visible' || !document.querySelector('.player:not(.hidden)')) { acLastT = -1; return; }
  const stuck = AC.state !== 'running' || AC.currentTime === acLastT;
  acLastT = AC.currentTime;
  if (stuck) acRecover();
}, 1500);
// iPhone: con la sesión de audio «transient» los pitidos y la voz suenan aunque el interruptor de silencio esté activado
// y bajan un poco la música que estés escuchando en lugar de cortarla
function audioSession(on) { AUDIO_WANT = !!on; try { if (navigator.audioSession) navigator.audioSession.type = on ? 'transient' : 'auto'; } catch (e) {} }
const _startWorkout = startWorkout;
startWorkout = function (w, resume) { audioSession(true); try { audioCtx(); } catch (e) {} _startWorkout(w, resume); try { vPreload(P.tl); } catch (e) {} };

/* ---------- Voz del teléfono: elegir entre las voces en español que ofrece el sistema ---------- */
// En iPhone las voces «mejoradas» y «premium» descargadas aparecen con «enhanced» o «premium» en su identificador;
// las voces de Siri no están disponibles para las páginas web.
const vQual = x => { const k = x.voiceURI + ' ' + x.name; return /premium/i.test(k) ? 2 : /enhanced|mejorad/i.test(k) ? 1 : 0; };
const vQualTxt = q => q === 2 ? 'premium' : q === 1 ? 'mejorada' : '';
function esVoices() {
  let v = []; try { v = speechSynthesis.getVoices().filter(x => x.lang.toLowerCase().startsWith(LANG)); } catch (e) {}
  v.sort((a, b) => vQual(b) - vQual(a) || (b.localService - a.localService) || a.name.localeCompare(b.name, 'es'));
  // el iPhone a veces informa la misma voz dos veces (o con dos identificadores): queda una por nombre, idioma y calidad
  const seen = new Set();
  return v.filter(x => { const k = vName(x).toLowerCase() + '|' + x.lang.replace('_', '-').toLowerCase() + '|' + vQual(x); if (seen.has(k)) return false; seen.add(k); return true; });
}
const vName = x => x.name.replace(/\s*\((Enhanced|Premium|Mejorada|Compacta|Compact)\)/ig, '').trim();
pickVoice = function () {
  const v = esVoices();
  VOICE = (S.sysVoice && v.find(x => x.voiceURI === S.sysVoice)) || v[0] || null;
};
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = () => { pickVoice(); const l = document.querySelector('#vs-sys'); if (l) l.innerHTML = sysVoiceList(); }; }
function sysVoiceList() {
  const v = esVoices();
  if (!v.length) return '<p class="note">El sistema todavía no informó sus voces. Toca «Probar» o vuelve a abrir este panel.</p>';
  const cur = VOICE && VOICE.voiceURI;
  return `<div class="seg col" id="vs-sl">${v.map(x => `<button data-u="${esc(x.voiceURI)}" aria-pressed="${x.voiceURI === cur}">${esc(vName(x))}<small> · ${esc(x.lang)}${vQualTxt(vQual(x)) ? ' · ' + vQualTxt(vQual(x)) : ''}</small></button>`).join('')}</div>`;
}

/* ---------- Ajustes de voz (en Perfil) ---------- */
function openVoiceSettings() {
  let v = voiceOf();
  sheet(`<h3>Voz del entrenador</h3>
    <p class="sub">Dora, Alex, Paula, Julio, Ona y Kimetz son voces grabadas en español. «Voz del teléfono» usa la del iPhone o del navegador.</p>
    <h2>Voz</h2>
    <div class="seg" id="vs-v">${Object.entries(VOICES).filter(([k]) => READY_VOICES.includes(k) && (LANG === 'es' || k === 'sistema')).map(([k, n]) => `<button data-v="${k}" aria-pressed="${v === k}">${n}</button>`).join('')}</div>
    <div id="vs-sysbox" class="hidden"><h2>Voz del teléfono</h2><div id="vs-sys"></div>
      <p class="note">Aparecen las voces en español que el iPhone deja usar a las apps web; primero las «mejoradas» y «premium». Si descargaste una y no está en la lista, cierra la app del todo (deslizándola hacia arriba) y vuelve a abrirla. Las voces de Siri no están disponibles para apps web.</p></div>
    <div class="gap"></div><button class="btn ghost small" id="vs-try">▶ Probar</button>
    <h2>Sin conexión</h2>
    <p class="note" id="vs-st">Los audios se descargan a medida que se usan. Para tenerlos todos sin internet, guárdalos ahora (unos 15 MB).</p>
    <button class="btn ghost small" id="vs-dl">Guardar la voz en este dispositivo</button>
    <p class="note">Sonido actual en el entrenamiento: ${SOUND_MODES[S.sound]} (se cambia con el altavoz del reproductor).</p>
    <div style="height:16px"></div><button class="btn" id="vs-ok">Listo</button>`, () => {
    const sync = () => {
      $('#vs-dl').classList.toggle('hidden', v === 'sistema'); $('#vs-sysbox').classList.toggle('hidden', v !== 'sistema');
      if (v === 'sistema') { pickVoice(); $('#vs-sys').innerHTML = sysVoiceList(); }
    };
    $('#vs-sys').onclick = e => { const b = e.target.closest('[data-u]'); if (!b) return; S.sysVoice = b.dataset.u; save(); pickVoice(); $('#vs-sys').innerHTML = sysVoiceList(); const prev = S.sound; S.sound = 'voz'; say('¡Hola! ¡Vamos a entrenar!'); S.sound = prev; };
    sync();
    bindSeg('vs-v', 'v', x => { v = x; S.voiceSrc = x; save(); sync(); });
    $('#vs-try').onclick = () => {
      audioCtx();
      const t = MALE_VOICES.includes(v) ? 'Hola, soy tu entrenador. ¡Vamos a entrenar!' : 'Hola, soy tu entrenadora. ¡Vamos a entrenar!';
      const prev = S.sound; S.sound = 'voz'; say(v === 'sistema' ? '¡Hola! ¡Vamos a entrenar! Tres, dos, uno, ¡comienza!' : t); S.sound = prev;
    };
    $('#vs-dl').onclick = async () => {
      const voice = v, idx = await loadIdx(); if (!idx) { toast('No se encontraron los audios'); return; }
      const ids = [...new Set(Object.values(idx))]; let done = 0, fail = 0;
      const st = $('#vs-st'), btn = $('#vs-dl'); btn.disabled = true;
      const work = async () => { while (ids.length) { const id = ids.pop(); try { const r = await fetch(vozUrl(voice, id)); if (!r.ok) fail++; } catch (e) { fail++; } done++; if (done % 10 === 0 && st) st.textContent = `Guardando… ${done} audios`; } };
      await Promise.all([1, 2, 3, 4, 5, 6].map(work));
      if (st) st.textContent = fail ? `Guardados ${done - fail}; ${fail} no se pudieron bajar (¿sin conexión?).` : `Listo: ${done} audios guardados para usar sin conexión.`;
      btn.disabled = false;
    };
    $('#vs-ok').onclick = closeSheet;
  });
}
