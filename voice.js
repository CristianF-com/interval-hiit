'use strict';
/* =========================================================
   Voz del entrenador: audios grabados (Dora / Alex, acento latino)
   o la voz del teléfono. Se carga al final y reemplaza a say().
   ========================================================= */
const VOICES = { dora: 'Dora · latina', alex: 'Alex · latino', sistema: 'Voz del teléfono' };
const sysSay = say; // voz del sistema (speechSynthesis), queda como respaldo
const VNUM = { cero: '0', uno: '1', dos: '2', tres: '3' };
const vnorm = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
let VIDX = null;
const loadIdx = () => VIDX || (VIDX = fetch('voz/index.json').then(r => r.ok ? r.json() : null).catch(() => null));
const vbuf = new Map();
const voiceOf = () => (S.voiceSrc && VOICES[S.voiceSrc]) ? S.voiceSrc : 'dora';
function audioCtx() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state !== 'running') AC.resume().catch(() => {}); // iOS: «suspended» o «interrupted» (tras un aviso del sistema)
  return AC;
}
function getBuf(voice, id) {
  const key = voice + '/' + id;
  if (!vbuf.has(key)) {
    const p = fetch(`voz/${voice}/${id}.mp3`).then(r => { if (!r.ok) throw new Error('404'); return r.arrayBuffer(); })
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
  const ctx = audioCtx(); let t = ctx.currentTime + 0.03;
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
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && AC && AC.state !== 'running') AC.resume().catch(() => {}); });
// iPhone: con la sesión de audio «transient» los pitidos y la voz suenan aunque el interruptor de silencio esté activado
// y bajan un poco la música que estés escuchando en lugar de cortarla
function audioSession(on) { try { if (navigator.audioSession) navigator.audioSession.type = on ? 'transient' : 'auto'; } catch (e) {} }
const _startWorkout = startWorkout;
startWorkout = function (w, resume) { audioSession(true); try { audioCtx(); } catch (e) {} _startWorkout(w, resume); try { vPreload(P.tl); } catch (e) {} };

/* ---------- Ajustes de voz (en Perfil) ---------- */
function openVoiceSettings() {
  let v = voiceOf();
  sheet(`<h3>Voz del entrenador</h3>
    <p class="sub">Dora y Alex son voces grabadas con acento latino. «Voz del teléfono» usa la del iPhone o del navegador.</p>
    <h2>Voz</h2>
    <div class="seg" id="vs-v">${Object.entries(VOICES).map(([k, n]) => `<button data-v="${k}" aria-pressed="${v === k}">${n}</button>`).join('')}</div>
    <div class="gap"></div><button class="btn ghost small" id="vs-try">▶ Probar</button>
    <h2>Sin conexión</h2>
    <p class="note" id="vs-st">Los audios se descargan a medida que se usan. Para tenerlos todos sin internet, guárdalos ahora (unos 13 MB).</p>
    <button class="btn ghost small" id="vs-dl">Guardar la voz en este dispositivo</button>
    <p class="note">Sonido actual en el entrenamiento: ${SOUND_MODES[S.sound]} (se cambia con el altavoz del reproductor).</p>
    <div style="height:16px"></div><button class="btn" id="vs-ok">Listo</button>`, () => {
    const sync = () => { $('#vs-dl').classList.toggle('hidden', v === 'sistema'); };
    sync();
    bindSeg('vs-v', 'v', x => { v = x; S.voiceSrc = x; save(); sync(); });
    $('#vs-try').onclick = () => {
      audioCtx();
      const t = v === 'alex' ? 'Hola, soy tu entrenador. ¡Vamos a entrenar!' : 'Hola, soy tu entrenadora. ¡Vamos a entrenar!';
      const prev = S.sound; S.sound = 'voz'; say(v === 'sistema' ? '¡Hola! ¡Vamos a entrenar! Tres, dos, uno, ¡comienza!' : t); S.sound = prev;
    };
    $('#vs-dl').onclick = async () => {
      const voice = v, idx = await loadIdx(); if (!idx) { toast('No se encontraron los audios'); return; }
      const ids = [...new Set(Object.values(idx))]; let done = 0, fail = 0;
      const st = $('#vs-st'), btn = $('#vs-dl'); btn.disabled = true;
      const work = async () => { while (ids.length) { const id = ids.pop(); try { const r = await fetch(`voz/${voice}/${id}.mp3`); if (!r.ok) fail++; } catch (e) { fail++; } done++; if (done % 10 === 0 && st) st.textContent = `Guardando… ${done} audios`; } };
      await Promise.all([1, 2, 3, 4, 5, 6].map(work));
      if (st) st.textContent = fail ? `Guardados ${done - fail}; ${fail} no se pudieron bajar (¿sin conexión?).` : `Listo: ${done} audios guardados para usar sin conexión.`;
      btn.disabled = false;
    };
    $('#vs-ok').onclick = closeSheet;
  });
}
