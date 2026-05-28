// Digital IO — Service Worker (PWA Offline Support)
const CACHE = 'digital-io-v4';
const ASSETS = ['/', '/index.html', '/css/main.css', '/js/config.js', '/js/auth.js', '/js/db.js', '/js/ui.js', '/js/backup.js', '/js/pages/dashboard.js', '/js/pages/cases.js', '/js/pages/evidence.js', '/js/pages/all-pages.js', '/js/app.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => {
      const clone = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('/index.html')))
  );
});
