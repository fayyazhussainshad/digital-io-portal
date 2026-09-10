/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — SERVICE WORKER v414
   Offline-first · Cache all assets · Background sync
   ═══════════════════════════════════════════════════════════ */

const CACHE_NAME = 'digital-io-v447';
const OFFLINE_URL = '/offline.html';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/offline-store.js',

  '/app-core.js',
  '/data-api.js',
  '/auth.js',
  '/dashboard.js',
  '/toolbar.js',
  '/misal-docs.js',
  '/misal-templates.js',
  '/misal-fir.js',
  '/doc-viewer.js',
  '/cases.js',
  '/case-form.js',
  '/case-docs.js',
  '/fivec.js',
  '/evidence.js',
  '/search.js',
  '/suspects.js',
  '/witnesses.js',
  '/mulziman.js',
  '/zimni.js',
  '/fir.js',
  '/report173.js',
  '/saza-slip.js',
  '/saved-docs.js',
  '/darkhwastain.js',
  '/global-mic.js',
  '/cdr-imei.js',
  '/cro-card.js',
  '/staff-v2.js',
  '/law-library.js',
  '/templates.js',
  '/sho-dsp.js',
  '/editor-tools.js',
  '/saved-files.js',
  '/case-sharing.js',
  '/notifications.js',
  '/reminders.js',
  '/performance.js',
  '/backup.js',
  '/settings.js',
  '/subscription.js',
  '/incident.js',
  '/court.js',
  '/bin.js',
  '/admin.js',
];

// ── INSTALL ───────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching core assets');
      // Cache each file individually — one failure won't stop the rest
      return Promise.all(
        CORE_ASSETS.map(url =>
          cache.add(url).catch(err => console.warn('[SW] Skip cache:', url))
        )
      );
    }).then(() => {
      console.log('[SW] New version installed, waiting for user to update');
      // Do NOT auto-skipWaiting — let the page show an "update available" banner
      // and call skipWaiting only when the officer taps it.
    })
  );
});

// Listen for the page telling us to activate now (officer tapped the update banner)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
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
  // External CDN libraries (Supabase, fonts) — network-first, but CACHE for offline
  if (url.hostname.includes('jsdelivr.net') || url.hostname.includes('unpkg.com') || url.hostname.includes('cdnjs.cloudflare.com') || url.hostname.includes('esm.sh')) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // ── HTML navigation — STALE-WHILE-REVALIDATE ──
  //   Cached shell FORAN dikhao (ایپ ہوا کی طرح فوری کھلے), background mein
  //   fresh laa kar cache update karo → agli baar naya. Offline bhi foran chale.
  if (event.request.mode === 'navigate') {
    const navFresh = fetch(event.request).then(response => {
      if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put('/index.html', clone));
      }
      return response;
    }).catch(() => null);
    event.waitUntil(navFresh);   // SW ko zinda rakho taake background cache-update mukammal ho
    event.respondWith(
      caches.match('/index.html').then(cached => cached
        || navFresh.then(r => r
          || caches.match('/').then(c => c || caches.match('/offline.html'))))
    );
    return;
  }

  // ── JS & CSS — STALE-WHILE-REVALIDATE (ایپ ہوا کی طرح ہلکا) ──
  //   Pehle network-first + cache:'reload' tha → har bar poori 1.59MB dobara
  //   download hoti thi (isi liye app dheere khulta tha). Ab: cached copy FORAN
  //   serve karo, background mein 'reload' se fresh la kar cache update karo.
  //   Natija: fauri load + khud-ba-khud taza (aik load peeche) — CACHE_NAME bump
  //   ki zaroorat bhi nahi. Purana "stale version" masla isse behtar hal hota hai.
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    const assetFresh = fetch(new Request(event.request.url, {
      cache: 'reload', credentials: 'same-origin', mode: 'same-origin'
    })).then(response => {
      if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => null);
    event.waitUntil(assetFresh);   // background update mukammal hone tak SW zinda
    event.respondWith(
      caches.match(event.request).then(cached => cached
        || assetFresh.then(r => r || caches.match(event.request)))
    );
    return;
  }

  // Cache-first + stale-while-revalidate for other assets (images/fonts)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Serve cache instantly, update in background (stale-while-revalidate)
        if (navigator.onLine) {
          fetch(event.request).then(fresh => {
            if (fresh && fresh.status === 200) {
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, fresh.clone()));
            }
          }).catch(() => {});
        }
        return cached;
      }
      // Not in cache and offline — fail fast
      if (!navigator.onLine) return caches.match('/offline.html');
      return fetch(event.request).then(response => {
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
