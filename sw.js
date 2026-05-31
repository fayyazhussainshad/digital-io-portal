/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — SERVICE WORKER  (sw.js)
   Strategy:
     • Static assets (JS, HTML, CSS): Cache-first with
       network update in background (stale-while-revalidate)
     • Supabase API calls: Network-first, no caching
       (case data must always be fresh and secure)
     • Offline fallback: offline.html shown when network
       fails and no cached page is available
   ═══════════════════════════════════════════════════════════ */

const CACHE_NAME   = 'digital-io-v5';
const OFFLINE_URL  = '/offline.html';

// All static files that make the shell work offline
const STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/offline-store.js',
  '/app-core.js',
  '/dashboard.js',
  '/cases.js',
  '/misal.js',
  '/forms.js',
  '/fivec.js',
  '/evidence.js',
  '/search.js',
  '/law.js',
  '/reminders.js',
  '/performance.js',
  '/backup.js',
  '/settings.js',
  '/admin.js',
  '/officialdocs.js',
  '/icon-192.png',
  '/icon-512.png',
];

// ── INSTALL: cache all static files ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching static files');
      return cache.addAll(STATIC_FILES);
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: delete old caches from previous versions ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: route requests ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Skip non-GET requests (POST, PUT, DELETE — Supabase writes)
  if (event.request.method !== 'GET') return;

  // 2. Skip Supabase API and auth calls — always network, never cached
  //    (case data must be real-time and secure)
  if (url.hostname.includes('supabase.co')) return;

  // 3. Skip browser-extension and non-http requests
  if (!url.protocol.startsWith('http')) return;

  // 4. For navigation requests (loading the app shell):
  //    Network-first → fall back to cached index.html → fall back to offline.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Update cache with fresh version in background
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() =>
          caches.match('/index.html')
            .then(cached => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // 5. For static assets (JS, CSS, images, fonts):
  //    Cache-first → network fallback (stale-while-revalidate)
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(response => {
        // Update cache with fresh copy if request succeeded
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => null);

      // Return cached version immediately; update happens in background
      return cached || networkFetch ||
        (event.request.destination === 'document'
          ? caches.match(OFFLINE_URL)
          : new Response('', { status: 404 }));
    })
  );
});
