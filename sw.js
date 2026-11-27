/* RutaViva — service worker mínimo para poder instalar la app.
   Siempre busca la versión nueva en internet; si no hay conexión, abre la última página guardada. */
const CACHE = "rutaviva-v1";
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || req.mode !== "navigate") return; // todo lo demás va directo a internet
  e.respondWith(
    fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put("./", copy)).catch(() => {});
      return res;
    }).catch(() => caches.match("./"))
  );
});
