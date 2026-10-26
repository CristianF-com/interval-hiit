/* Service worker de Intervalo: estrategia «primero la caché».
   La app (HTML, JS, iconos) se sirve siempre desde el almacenamiento del teléfono,
   al instante y sin internet; si hay red, se actualiza en segundo plano para la próxima vez. */
const VERSION = 'intervalo-v49';
const SHELL = [
  './', './index.html', './app.js', './anim.js', './extras.js', './voice.js', './calendar.js', './retos_data.js', './retos.js', './data.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png'
];
const FONTS = 'intervalo-fonts';
const MEDIA = 'intervalo-media';
const VOZ = 'intervalo-voz';

self.addEventListener('install', e => {
  // cache:'reload' evita guardar copias viejas que el navegador tuviera en su caché HTTP
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== FONTS && k !== MEDIA && k !== VOZ).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Fuentes de Google: se guardan la primera vez que hay conexión
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== location.origin) return;

  // Voz del entrenador: los audios se guardan la primera vez; el índice se actualiza si hay red
  if (url.pathname.includes('/voz/')) {
    const isIdx = url.pathname.endsWith('index.json');
    e.respondWith(caches.open(VOZ).then(async c => {
      const hit = await c.match(req);
      if (hit && !isIdx) return hit;
      try { const r = await fetch(req); if (r.ok) c.put(req, r.clone()); return r; }
      catch (err) { return hit || Response.error(); }
    }));
    return;
  }
  // Carpeta media/: vídeos directo del servidor (el navegador gestiona los rangos);
  // GIF y listado de la carpeta, de red con copia para usar sin conexión
  if (url.pathname.includes('/media/')) {
    if (/\.(mp4|webm)$/i.test(url.pathname)) return;
    e.respondWith(caches.open(MEDIA).then(async c => {
      try { const r = await fetch(req); if (r.ok) c.put(req, r.clone()); return r; }
      catch (err) { const hit = await c.match(req); return hit || Response.error(); }
    }));
    return;
  }

  // Navegación: primero caché, con index.html como respaldo
  if (req.mode === 'navigate') {
    e.respondWith(caches.open(VERSION).then(async c => {
      const hit = await c.match('./index.html');
      const net = fetch(req).then(r => { if (r.ok) c.put('./index.html', r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  // Resto: caché primero y actualización en segundo plano
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
