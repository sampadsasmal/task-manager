const CACHE = 'dtm-v1';
const STATIC = ['/apple-touch-icon.png', '/icon-192.png', '/icon-512.png'];

// Install: pre-cache static assets, activate immediately
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
});

// Activate: drop old caches, claim all clients right away
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const { pathname } = new URL(e.request.url);

  // Network-first for HTML + manifest — always reflects the latest deploy
  if (pathname === '/' || pathname.endsWith('.html') || pathname === '/manifest.json') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for icons and other static assets
  e.respondWith(
    caches.match(e.request).then(cached => cached ||
      fetch(e.request).then(res => {
        caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      })
    )
  );
});
