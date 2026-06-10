// Network-first service worker: always tries to load the FRESH version online
// (so the game never gets stuck on an old cached build), with an offline fallback.
const CACHE = 'farmsim-cache-v1';

self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith((async () => {
    try {
      const fresh = await fetch(req, { cache: 'no-store' });
      try { const c = await caches.open(CACHE); c.put(req, fresh.clone()); } catch (_) {}
      return fresh;
    } catch (_) {
      const cached = await caches.match(req);
      return cached || Response.error();
    }
  })());
});
