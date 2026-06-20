/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — SERVICE WORKER v54
   Offline-first · Cache all assets · Background sync
   ═══════════════════════════════════════════════════════════ */

const CACHE_NAME = 'digital-io-v54';
const OFFLINE_URL = '/offline.html';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/offline-store.js',
  '/islamic.js',
  '/app-core.js',
  '/dashboard.js',
  '/toolbar.js',
  '/misal-docs.js',
  '/cases.js',
  '/forms.js',
  '/officialdocs.js',
  '/fivec.js',
  '/evidence.js',
  '/search.js',
  '/suspects.js',
  '/witnesses.js',
  '/diary.js',
  '/notifications.js',
  '/law.js',
  '/reminders.js',
  '/performance.js',
  '/backup.js',
  '/settings.js',
  '/patrol.js',
  '/cdr.js',
  '/incident.js',
  '/court.js',
  '/bin.js',
  '/admin.js',
  '/patrol-share.html',
];

// ── INSTALL ───────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching core assets');
      return cache.addAll(CORE_ASSETS).catch(err => {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ──────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH — Offline First Strategy ────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET and external API calls
  if (event.request.method !== 'GET') return;
  if (url.hostname === 'supabase.co' || url.hostname.includes('supabase')) return;
  if (url.hostname === 'nominatim.openstreetmap.org') return;
  if (url.hostname === 'api.anthropic.com') return;
  // External CDN libraries (Supabase, fonts) — always fetch fresh, never cache-first
  // This prevents a broken/partial cached copy from blocking the app
  if (url.hostname.includes('jsdelivr.net') || url.hostname.includes('unpkg.com') || url.hostname.includes('cdnjs.cloudflare.com')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // HTML navigation — offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/offline.html')
      )
    );
    return;
  }

  // Cache-first for JS/CSS/fonts
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('/offline.html'));
    })
  );
});

// ── BACKGROUND SYNC ───────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-cases') {
    event.waitUntil(console.log('[SW] Background sync: cases'));
  }
});

// ── PUSH NOTIFICATIONS ────────────────────────────────────────
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { title:'Digital IO', body:'یاددہانی' };
  event.waitUntil(
    self.registration.showNotification(data.title || 'Digital IO یاددہانی', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      dir: 'rtl',
      lang: 'ur',
      vibrate: [200, 100, 200],
      tag: data.tag || 'reminder',
      data: data.url ? { url: data.url } : {},
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type:'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
