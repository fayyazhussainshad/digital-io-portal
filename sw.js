/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — SERVICE WORKER v552
   Offline-first · Cache all assets · Background sync
   ═══════════════════════════════════════════════════════════ */

const CACHE_NAME = 'digital-io-v552';
const OFFLINE_URL = '/offline.html';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',

  // shared utilities (load first in index.html)
  '/dio-date.js',
  '/dio-statuses.js',
  '/dio-errors.js',
  '/dio-html.js',
  '/dio-states.js',
  '/dio-audit.js',
  '/dio-custody.js',
  '/dio-approvals.js',
  '/offline-store.js',
  '/error-handler.js',
  '/resume.js',

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
  '/case-context.js',
  '/case-form.js',
  '/case-docs.js',
  '/fivec.js',
  '/evidence.js',
  '/search.js',
  '/suspects.js',
  '/witnesses.js',
  '/mulziman.js',
  '/zimni.js',
  '/naqsha-mauqa.js',
  '/fir.js',
  '/report173.js',
  '/saza-slip.js',
  '/saved-docs.js',
  '/darkhwastain.js',
  '/global-mic.js',
  '/dio-card.js',
  '/dio-prev.js',
  '/dio-entry.js',
  '/cdr-imei.js',
  '/cro-card.js',
  '/rfa-form.js',
  '/staff-v2.js',
  '/law-library.js',
  '/ahkamat.js',
  '/help-guide.js',
  '/templates.js',
  '/templates-forms.js',
  '/system-forms.js',
  '/dio-forms.js',
  '/dio-share.js',
  '/vendor/html2canvas.min.js',
  '/sho-dsp.js',
  '/editor-tools.js',
  '/saved-files.js',
  '/case-sharing.js',
  '/notifications.js',
  '/reminders.js',
  '/auto-interim.js',
  '/performance.js',
  '/backup.js',
  '/settings.js',
  '/subscription.js',
  '/icon-192.png',
  '/icon-512.png',
  '/boot.js',
  '/mobile.css',
  '/theme-pro.css',
  '/ui-home.css',
  '/fonts/amiri-quran-arabic.woff2',
  '/fonts/amiri-arabic.woff2',
  '/islamic-landing.js',
  '/mobile.js',
  '/challan-form.js',
  '/secure-storage.js',
  '/license-token.js',
  '/incident.js',
  '/gasht.js',
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

/* ═══════════════════════════════════════════════════════════════════
   سرور پہلے — محفوظ نقل صرف مجبوری میں   (v520)
   ───────────────────────────────────────────────────────────────────
   پہلے اپنی ہی فائلیں (صفحہ + JS + CSS) «stale-while-revalidate» سے آتی
   تھیں: پہلے محفوظ نقل فوراً، نئی نقل پیچھے سے۔ نتیجہ:
     • ہر نئی اپلوڈ ایک لوڈ پیچھے نظر آتی تھی
     • اکثر sw.js کا ورژن بڑھائے بغیر تبدیلی دکھتی ہی نہیں تھی
     • «سرور درست، براؤزر غلط» — یہی شکایت بار بار آتی رہی
   اب:
     • نیٹ ہو → ہمیشہ سرور کی تازہ فائل (no-cache = سرور سے تصدیق؛ فائل
       نہ بدلی ہو تو 304 کا چھوٹا سا جواب، پوری فائل دوبارہ نہیں آتی)
     • نیٹ نہ ہو → محفوظ نقل (آف لائن پہلے کی طرح چلتا ہے)
     • نیٹ بہت سست ہو (TAAZA_MS سے زیادہ) → محفوظ نقل فوراً، اور تازہ
       فائل پیچھے سے آ کر محفوظ ہو جاتی ہے — میدان میں انتظار نہیں
   یعنی اپنی فائلوں کی تبدیلی کے لیے sw.js کا ورژن بڑھانا اب ضروری نہیں۔ */
const TAAZA_MS = 1500;
/* سست نیٹ کی یادداشت: اگر کسی فائل کے لیے سرور TAAZA_MS میں جواب نہ دے تو
   مان لیا جاتا ہے کہ ابھی نیٹ سست ہے۔ اُس کے بعد کے 15 سیکنڈ تک باقی فائلیں
   انتظار کیے بغیر سیدھی محفوظ نقل سے آتی ہیں (اور تازہ نقل پیچھے سے آ کر
   محفوظ ہوتی رہتی ہے)۔ اِس کے بغیر صفحہ 1.5s انتظار کرتا، پھر ہر اسکرپٹ
   مزید 1.5s — سست نیٹ پر ایپ کھلنے میں کئی سیکنڈ لگ جاتے (ٹیسٹ میں 8s ناپا
   گیا تھا)۔ اب سست نیٹ پر زیادہ سے زیادہ ایک بار کا انتظار۔ */
let _dheemaTak = 0;

function _serverPehle(event, key, fallback) {
  const req = event.request;
  const net = fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
    .then(async r => {
      if (!r || r.status !== 200 || r.type !== 'basic') return r;
      // navigation کا جواب redirected ہو تو سیدھا نہیں دیا جا سکتا — صاف نقل
      if (r.redirected) {
        r = new Response(await r.blob(), { status: r.status, statusText: r.statusText, headers: r.headers });
      }
      const c = r.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(key, c));
      return r;
    })
    .catch(() => null);
  event.waitUntil(net);                       // وقت ختم ہونے کے بعد بھی محفوظ نقل تازہ ہو جائے

  const _bachao = (r) => caches.match(key).then(cached => {
    if (cached) return cached;                // آف لائن / سست / سرور کی خرابی
    if (r && r !== 'WAQT') return r;          // محفوظ نقل بھی نہیں — سرور کا جواب ہی
    return net.then(n => n || (fallback ? fallback() : new Response('', { status: 503, statusText: 'offline' })));
  });

  // ابھی ابھی سست نیٹ دیکھا گیا ہے → انتظار نہیں، محفوظ نقل (اگر ہو)
  if (Date.now() < _dheemaTak) return _bachao('WAQT');

  const waqt = new Promise(res => setTimeout(() => res('WAQT'), TAAZA_MS));
  return Promise.race([net, waqt]).then(r => {
    if (r === 'WAQT') { _dheemaTak = Date.now() + 15000; return _bachao(r); }
    if (r && r.ok) { _dheemaTak = 0; return r; }   // سرور نے بروقت تازہ دے دی
    return _bachao(r);
  });
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET and external API calls
  if (event.request.method !== 'GET') return;

  /* ═══ QANOONI LIBRARY KI FILEIN — offline bhi khulen ═══
     Yeh Supabase ke `return` se PEHLE hai, warna neeche wali shart inhe
     chhoR deti hai aur maidan mein (net ke baghair) qanoon nahi khulta.
     Sirf PUBLIC bucket ka GET — is mein koi niji data nahi hota.
     Pehle cache (foran), background mein taza; net na ho to cache hi. */
  if (url.hostname.includes('supabase') && url.pathname.includes('/storage/v1/object/public/law-library/')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fresh = fetch(event.request).then(r => {
          if (r && r.status === 200) {
            const c = r.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, c));
          }
          return r;
        }).catch(() => null);
        if (cached) { event.waitUntil(fresh); return cached; }
        return fresh.then(r => r || new Response('', { status: 504, statusText: 'offline' }));
      })
    );
    return;
  }

  if (url.hostname === 'supabase.co' || url.hostname.includes('supabase')) return;
  if (url.hostname === 'nominatim.openstreetmap.org') return;
  if (url.hostname === 'api.anthropic.com') return;
  /* ═══ URDU FONT — hamesha ke liye cache (cache-first) ═══
     KAMI THI: `fonts.googleapis.com` / `fonts.gstatic.com` kisi shart mein
     nahi the, yaani Noto Nastaliq Urdu OFFLINE nahi milta tha → maidan mein
     Urdu Naskh mein dikhti aur chhapti thi.
     AHEM BAREEKI: `<link rel=stylesheet>` ki darkhwast `no-cors` hoti hai,
     uska jawab "opaque" (status 0) hota hai aur `cache.put` usay rakh nahi
     sakta. Is liye hum KHUD `mode:'cors'` se laate hain (Google Fonts
     `Access-Control-Allow-Origin: *` deta hai) — phir yeh cache mein aa
     jata hai aur agli dafa net ke baghair bhi milta hai. Font badalta nahi,
     is liye cache pehle. */
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        /* ═══ v504 — ASLI MAIDAN SE MILI KHARABI ═══
           `mode:'cors'` wali darkhwast `connect-src` ke taht aati hai
           (jabke `<link rel=stylesheet>` `style-src` ke taht). CSP ki
           `connect-src` fehrist mein font ke pate NAHI the, is liye yeh
           darkhwast ROK di jati thi aur neeche wala `catch` 504 laut-ta
           tha — yani URDU FONT BILKUL HI NA AATA:
               "Refused to connect … violates connect-src"
               "GET …Noto+Nastaliq+Urdu… net::ERR_ABORTED 504 (offline)"
           Do darustiyan:
             1) CSP ki `connect-src` mein dono font ke pate shamil
                (index.html ki meta aur vercel.json ka header — dono).
             2) Yahan: cors ki koshish NAKAM ho jaye to 504 ki bajaye
                SAADI (asli) darkhwast se font le aao. Cache na ho sake to
                na sahi — font ka aana cache hone se zyada zaroori hai. */
        const corsReq = new Request(event.request.url, { mode: 'cors', credentials: 'omit' });
        const saadi = () => fetch(event.request).catch(() => null);
        return fetch(corsReq).then(r => {
          if (r && r.status === 200) {
            const c = r.clone();
            caches.open(CACHE_NAME).then(cache => {
              // opaque jawab `put` qabool nahi karta — khamoshi se chhoR do
              try { cache.put(event.request, c); } catch (_) {}
            }).catch(() => {});
            return r;
          }
          return saadi().then(x => x || r);
        }).catch(() => saadi().then(x => x
          || caches.match(event.request).then(c => c
          || new Response('', { status: 504, statusText: 'offline' }))));
      })
    );
    return;
  }

  // External CDN libraries — network-first, but CACHE for offline
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

  // ── HTML صفحہ — سرور پہلے ──
  //   (پہلے stale-while-revalidate تھا — محفوظ صفحہ پہلے، نیا ایک لوڈ بعد)
  if (event.request.mode === 'navigate') {
    // اپنی ہی origin — جواب اپنی کلید پر (پرانی cache-poisoning کی درستی برقرار)
    const navUrl = new URL(event.request.url);
    if (navUrl.origin !== self.location.origin) return;
    event.respondWith(
      _serverPehle(event, event.request, () =>
        caches.match('/index.html')
          .then(r => r || caches.match('/offline.html'))
          .then(r => r || new Response('', { status: 503, statusText: 'offline' })))
    );
    return;
  }

  // ── JS & CSS (اپنی) — سرور پہلے ──
  //   (پہلے stale-while-revalidate تھا — یہی «سرور درست، براؤزر غلط» کی جڑ)
  if (url.origin === self.location.origin &&
      (url.pathname.endsWith('.js') || url.pathname.endsWith('.css'))) {
    event.respondWith(_serverPehle(event, event.request, null));
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
