/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — boot.js   (sust net par raftaar)
   ────────────────────────────────────────────────────────────────
   MASLA (naapa gaya, Fast-3G, khali cache):
       pehla manzar 1.16s  —  magar DOM taiyar 10.1s
       wajah: 62 JS files (1.86 MB) SAB `defer` se DOMContentLoaded
       se PEHLE lazmi thin. Field me afsar 10 second intezar karta tha.

   HAL (do tahain, dono mehfooz):
     1) SAFHE ka module maang par — `registerPage()` aik hi raasta hai,
        aur `showPage()` pehle se "module nahi mila" sambhalta hai. Jab
        afsar safha kholta hai, tab us ki file aati hai.
     2) Baqi bhaari module FURSAT me (load ke baad, requestIdleCallback)
        khud-ba-khud aa jate hain — pehle manzar ko rokte nahi, magar
        do-teen second me mojood hote hain. Agar afsar in se pehle hi
        koi cheez kholta hai, pehli tah use foran le aati hai.

   Is liye kisi module ka code badalna nahi paRa — sirf unhein
   index.html ke blocking list se nikal kar yahan rakha gaya hai.
   SW precache me ye sab pehle se hain, is liye OFFLINE par koi farq
   nahi paRta (cache se foran milte hain).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var _loaded = Object.create(null);     // src → Promise

  function load(src) {
    if (_loaded[src]) return _loaded[src];
    _loaded[src] = new Promise(function (res) {
      // Pehle se page me mojood ho to dobara na laao
      if (document.querySelector('script[src="' + src + '"]')) { res(true); return; }
      var s = document.createElement('script');
      s.src = src; s.async = false;      // aapas ki tarteeb barqarar rahe
      s.onload = function () { res(true); };
      s.onerror = function () { _loaded[src] = null; res(false); };
      document.head.appendChild(s);
    });
    return _loaded[src];
  }
  window.dioLoadScript = load;

  function loadedAlready(src) {
    return !!(_loaded[src] || document.querySelector('script[src="' + src + '"]'));
  }

  // ── 1) Safhe ka module maang par ─────────────────────────────
  //  sirf wo safhe jo pehli sakreen ke liye zaroori NAHI.
  //  (dashboard/cases/search/reminders eager rehte hain — thumb-bar
  //   aur pehla manzar inhi par hai; admin ka apna lazy loader hai.)
  var PAGE_SRC = {
    ahkamat:     'ahkamat.js',
    backup:      'backup.js',
    bin:         'bin.js',
    court:       'court.js',
    evidence:    'evidence.js',
    fivec:       'fivec.js',
    help:        'help-guide.js',
    incident:    'incident.js',
    law:         'law-library.js',
    performance: 'performance.js',
    settings:    'settings.js',
    suspects:    'suspects.js',
    templates:   'templates.js'
  };

  function ensurePage(name) {
    var src = PAGE_SRC[name];
    if (!src) return Promise.resolve(false);
    return load(src);
  }
  window.dioEnsurePage = ensurePage;

  // showPage ko lapeto — module na ho to pehle le aao, phir kholo
  function wrapShowPage() {
    if (typeof window.showPage !== 'function' || window.showPage._dioWrapped) return false;
    var orig = window.showPage;
    var wrapped = function (page, el) {
      try {
        // AHEM: `window._pages` par bharosa NAHI — app-core.js me wo
        // `const _pages` hai, aur top-level `const` kabhi window par
        // nahi aata. Pehle yahi dekha ja raha tha, is liye har safha
        // (eager bhi) lazy raaste par chala jata tha. Ab sawal seedha
        // hai: is safhe ki file abhi tak aayi hai ya nahi.
        if (PAGE_SRC[page] && !loadedAlready(PAGE_SRC[page])) {
          // Halka sa "khul raha hai" — khali safha na dikhe
          try {
            var c = document.getElementById('page-content');
            if (c) {
              c.setAttribute('data-dio-loading', page);   // nishan — baad mein pehchan sakein
              c.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted,#7d97ad);' +
                'font-size:13px;direction:rtl;">کھل رہا ہے…</div>';
            }
          } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
          ensurePage(page).then(function () {
            orig.call(window, page, el);
            /* MEHFOOZ JAAL: agar safha kisi wajah se khula hi nahi
               (misal: rasai ka darwaza band — `showPage` wahin se
               wapas mud jata hai), to hamara "khul raha hai…" wala
               paigham wahin laga reh jata tha aur afsar HAMESHA usay
               dekhta rehta. Ab: agar mawad abhi bhi wahi paigham hai,
               to saaf baat likh do. */
            setTimeout(function () {
              try {
                var c = document.getElementById('page-content');
                if (!c || c.getAttribute('data-dio-loading') !== page) return;
                c.removeAttribute('data-dio-loading');
                if (c.textContent.trim().indexOf('کھل رہا ہے') === 0) {
                  c.innerHTML = '<div style="text-align:center;padding:40px 20px;' +
                    'direction:rtl;color:var(--text-muted);font-size:13px;">' +
                    'یہ صفحہ ابھی نہیں کھل سکا۔ دوبارہ کوشش کریں یا مینو سے دوسرا صفحہ چنیں۔</div>';
                }
              } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
            }, 400);
          });
          return;
        }
      } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      return orig.call(window, page, el);
    };
    wrapped._dioWrapped = true;
    window.showPage = wrapped;
    return true;
  }

  // app-core.js ke aane ka intezar (wo showPage banata hai)
  (function waitForShowPage(tries) {
    if (wrapShowPage()) return;
    if ((tries || 0) > 200) return;                 // ~20s ke baad chhoR do
    setTimeout(function () { waitForShowPage((tries || 0) + 1); }, 100);
  })(0);

  // ── 2) Baqi bhaari module FURSAT me ──────────────────────────
  //  Tarteeb ahmiyat ke mutabiq: pehle wo jo afsar sab se jaldi kholta
  //  hai (mocaddme ke andar ka kaam), phir baqi.
  var IDLE = [
    // Mocaddme ke andar ka asal kaam
    'zimni.js', 'report173.js', 'case-form.js', 'case-docs.js',
    'witnesses.js', 'mulziman.js', 'fir.js',
    // Dastavezat aur aalaat
    'toolbar.js', 'editor-tools.js', 'doc-viewer.js', 'saved-docs.js',
    'misal-docs.js', 'misal-fir.js', 'misal-templates.js',
    // سسٹم کے فارم (خودکار شامل) + پوری فائل شیئر (PDF/Word)
    'dio-forms.js', 'dio-share.js',
    // Mukhtalif forms
    'naqsha-mauqa.js', 'saza-slip.js', 'darkhwastain.js', 'rfa-form.js',
    'cro-card.js', 'cdr-imei.js',
    // Safhe (agar afsar in tak pahunche to pehli tah pehle hi le aayegi)
    'templates.js', 'law-library.js', 'fivec.js', 'ahkamat.js', 'incident.js',
    'settings.js', 'suspects.js', 'evidence.js', 'court.js',
    'performance.js', 'backup.js', 'bin.js', 'help-guide.js'
  ];

  function idle(fn) {
    if (window.requestIdleCallback) requestIdleCallback(fn, { timeout: 1500 });
    else setTimeout(fn, 200);
  }

  function preload(i) {
    if (i >= IDLE.length) return;
    idle(function () {
      load(IDLE[i]).then(function () { preload(i + 1); });
    });
  }

  function start() {
    // Pehla manzar par asar na ho — load ke BAAD shuru karo
    setTimeout(function () { preload(0); }, 300);
  }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
