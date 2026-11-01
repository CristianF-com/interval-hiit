'use strict';
/* =========================================================
   Idiomas (i18n)
   - El español es el idioma de origen: los textos del código y del HTML están en español.
   - Las traducciones viven en i18n/<idioma>.js: un diccionario «texto en español → traducción»
     (I18N) y una lista de frases con partes variables (I18N_PAT, con {0}, {1}…).
   - Por defecto se usa el idioma del navegador/sistema (español si empieza con «es»; si no, inglés).
     Se puede cambiar en Perfil → Idioma (se guarda en este dispositivo y recarga la app).
   - Lo que se muestra en pantalla se traduce al dibujarse (textos, placeholder, aria-label y title),
     y lo que dice la voz se traduce antes de hablar.
   ========================================================= */
const LANGS = { es: 'Español', en: 'English' };
const LANG = (() => {
  try { const v = localStorage.getItem('inhiit.lang'); if (LANGS[v]) return v; } catch (e) {}
  const n = (navigator.languages && navigator.languages[0]) || navigator.language || 'es';
  return /^es\b/i.test(n) ? 'es' : 'en';
})();
const LOC = LANG;   // fechas y números con el formato del idioma
document.documentElement.lang = LANG;
let I18N = {}, I18N_PAT = [];
function setLang(l) { try { localStorage.setItem('inhiit.lang', l); } catch (e) {} location.reload(); }

// Traduce un texto. Busca: exacto → frases con partes variables → partes separadas por « · » → oración por oración.
const _trCache = new Map();
const _pats = [];
function _compilePats() {
  if (_pats.length || !I18N_PAT.length) return;
  for (const [es, en] of I18N_PAT) {
    // las partes variables no cruzan un « · » (cada parte separada se traduce por su lado)
    const re = new RegExp('^' + es.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{(\d+)\}/g, '((?:(?![.!?…]\\s)[^·])+?)') + '$');
    const order = [...es.matchAll(/\{(\d+)\}/g)].map(m => +m[1]);
    const lit = es.replace(/\{\d+\}/g, '').length;
    // «identidad»: el patrón en inglés es igual (p. ej. «{0}: {1}»); solo sirve si alguna parte se traduce
    _pats.push([re, en, order, lit, es.replace(/\{\d+\}/g, '') === en.replace(/\{\d+\}/g, '')]);
  }
  _pats.sort((a, b) => b[3] - a[3]);   // primero los más específicos
}
const _cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const _low = s => s.charAt(0).toLowerCase() + s.slice(1);
function _pat(c, identity) {
  for (const [re, en, order, , id] of _pats) {
    if (id !== identity) continue;
    const m = c.match(re); if (!m) continue;
    let changed = false;
    const r = en.replace(/\{(\d+)\}/g, (x, k) => { const i = order.indexOf(+k); if (i < 0) return x; const v = tr(m[i + 1]); if (v !== m[i + 1]) changed = true; return v; });
    if (identity && !changed) continue;
    return r;
  }
  return null;
}
function _core(c) {
  if (I18N[c] != null) return I18N[c];
  if (I18N['· ' + c] != null) return I18N['· ' + c].replace(/^·\s*/, '');
  if (c !== _cap(c) && I18N[_cap(c)] != null) return _low(I18N[_cap(c)]);   // «bien» / «Bien»
  if (c.length > 400) return null;
  // separadores y símbolos al principio
  if (c.includes(' · ')) { const p = c.split(' · '); const r = p.map(tr); if (r.some((x, i) => x !== p[i])) return r.join(' · '); }
  let m = c.match(/^([·,✓☁☆↻↶▶←→•+−-]\s*)(.+)$/); if (m) { const r = tr(m[2]); if (r !== m[2]) return m[1] + r; }
  let r = _pat(c, false); if (r != null) return r;
  if (c !== _cap(c)) { r = _pat(_cap(c), false); if (r != null) return _low(r); }
  if (/[.!?…]\s+\S/.test(c)) {
    // oración por oración, juntando las seguidas que formen un texto conocido (el más largo posible)
    const p = c.split(/(?<=[.!?…])\s+/);
    if (p.length > 1) {
      const q = []; let i = 0;
      while (i < p.length) { let j = p.length; for (; j > i + 1; j--) { const g = p.slice(i, j).join(' '); if (I18N[g] != null) break; } const g = p.slice(i, j).join(' '); q.push([g, tr(g)]); i = j; }
      if (q.some(([a, b]) => a !== b)) return q.map(x => x[1]).join(' ');
    }
  }
  m = c.match(/^(.+?) \(([^()]+)\)$/); if (m) { const a = tr(m[1]), b = tr(m[2]); if (a !== m[1] || b !== m[2]) return a + ' (' + b + ')'; }
  if (/:$/.test(c)) { const q = tr(c.slice(0, -1)); if (q !== c.slice(0, -1)) return q + ':'; }
  if (/^\(.*\)$/.test(c)) { const q = tr(c.slice(1, -1)); if (q !== c.slice(1, -1)) return '(' + q + ')'; }
  if (/[.!]$/.test(c)) { const q = tr(c.slice(0, -1)); if (q !== c.slice(0, -1)) return q + c.slice(-1); }
  r = _pat(c, true); if (r != null) return r;
  return null;
}
function tr(s) {
  if (LANG === 'es' || s == null || typeof s !== 'string' || !/[A-Za-zÁÉÍÓÚáéíóúñÑ¿¡]/.test(s)) return s;
  if (_trCache.has(s)) return _trCache.get(s);
  _compilePats();
  const m = s.match(/^(\s*)([\s\S]*?)(\s*)$/), core = m[2].replace(/\s+/g, ' ');
  const r = _core(core), out = r == null ? s : m[1] + r + m[3];
  if (_trCache.size > 5000) _trCache.clear();
  _trCache.set(s, out);
  return out;
}
// para textos armados en el código: t('Serie {0} de {1}', i, n)
function t(s, ...v) { const r = LANG === 'es' ? s : (I18N[s] != null ? I18N[s] : s); return v.length ? r.replace(/\{(\d+)\}/g, (x, k) => v[k] != null ? v[k] : x) : r; }

/* ---------- Traducción de la pantalla ---------- */
const _done = new WeakMap();   // texto que ya pusimos en cada nodo (evita traducir dos veces)
const _ATTRS = ['placeholder', 'aria-label', 'title'];
function _trText(n) {
  const v = n.nodeValue; if (!v || _done.get(n) === v) return;
  const r = tr(v); if (r !== v) n.nodeValue = r;
  _done.set(n, n.nodeValue);
}
function _trEl(el) {
  for (const a of _ATTRS) { const v = el.getAttribute && el.getAttribute(a); if (v) { const r = tr(v); if (r !== v) el.setAttribute(a, r); } }
}
function translateDOM(root) {
  if (LANG === 'es' || !root) return;
  if (root.nodeType === 3) { _trText(root); return; }
  if (root.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA)$/.test(root.tagName) || (root.closest && root.closest('[data-noi18n]'))) return;
  _trEl(root);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode: n => { if (n.nodeType !== 1) return NodeFilter.FILTER_ACCEPT; if (n.tagName === 'TEXTAREA') { _trEl(n); return NodeFilter.FILTER_REJECT; } return /^(SCRIPT|STYLE)$/.test(n.tagName) || n.hasAttribute('data-noi18n') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } });
  let n; while ((n = w.nextNode())) { if (n.nodeType === 3) _trText(n); else _trEl(n); }
}
if (LANG !== 'es') {
  const start = () => {
    translateDOM(document.body);
    new MutationObserver(ms => {
      for (const m of ms) {
        if (m.type === 'characterData') _trText(m.target);
        else if (m.type === 'attributes') _trEl(m.target);
        else m.addedNodes.forEach(translateDOM);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: _ATTRS });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
}
