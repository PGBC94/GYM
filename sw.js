// Service worker de Mi Rutina: la app funciona sin conexión.
// Cambia VERSION al publicar cambios para que los móviles descarguen la versión nueva.
const VERSION = "mi-rutina-v1.1.0";
const SHELL = [
  "./", "./index.html", "./manifest.webmanifest", "./css/app.css",
  "./js/app.js", "./js/bus.js", "./js/state.js", "./js/storage.js", "./js/logic.js", "./js/utils.js", "./js/install.js",
  "./js/data/routine.js", "./js/data/technique.js", "./js/data/animations.js", "./js/engine/figure.js",
  "./js/screens/hoy.js", "./js/screens/entreno.js", "./js/screens/rutina.js", "./js/screens/progreso.js",
  "./js/screens/historial.js", "./js/screens/sheets.js", "./js/screens/equipo.js", "./js/equipment.js",
  "./icons/icon.svg", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png",
];
const FONTS = "mi-rutina-fonts";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)));
});
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION && k !== FONTS) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener("message", e => { if (e.data === "skipWaiting") self.skipWaiting(); });

self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Tipografías de Google: se guardan la primera vez y se sirven sin conexión
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // Navegación: la página principal desde caché (funciona sin conexión)
  if (req.mode === "navigate") {
    e.respondWith(caches.match("./index.html").then(r => r || fetch(req)));
    return;
  }
  // Resto: primero caché, si no red (y se guarda)
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return r;
  })));
});
