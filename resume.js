/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — "جہاں بند ہوا، وہیں سے کھلے"
   • آخری کھلا صفحہ یاد رکھتا ہے (localStorage میں، ہر افسر کا الگ)
   • پاس ورڈ کے بعد ڈیش بورڈ کی بجائے وہی صفحہ کھلتا ہے
   • یہ فائل مستقل (standalone) ہے — کسی اور فائل کا کام نہیں بدلتی۔
     app-core.js میں صرف ایک سطر بدلنی ہے (نیچے ہدایت دیکھیں)۔

   app-core.js میں (تقریباً سطر 868):
       showPage('dashboard', document.querySelector('.nav-item'));
   کی جگہ:
       showPage(_dioResumePage(), document.querySelector('.nav-item'));

   index.html میں <script src="app-core.js"> سے پہلے:
       <script src="resume.js"></script>
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KEY = 'dio_last_page';

  // ہر افسر کی اپنی یادداشت (ایک ہی کمپیوٹر پر کئی افسر ہو سکتے ہیں)
  function key() {
    var who = '';
    try {
      who = (typeof currentOfficer !== 'undefined' && currentOfficer &&
             (currentOfficer.id || currentOfficer.cnic || currentOfficer.username)) || '';
    } catch (_) {}
    return KEY + (who ? ('_' + who) : '');
  }

  // یہ صفحے یاد نہیں رکھے جاتے (ان پر واپس کھولنا مناسب نہیں)
  var SKIP = ['admin', 'backup', 'bin'];

  function save(page) {
    if (!page || SKIP.indexOf(page) !== -1) return;
    try { localStorage.setItem(key(), String(page)); } catch (_) {}
  }

  // شروع میں کون سا صفحہ کھولنا ہے
  window._dioResumePage = function () {
    // (1) پتے میں hash ہو تو اُسے پہل (مثلاً کسی نے لنک کھولا)
    try {
      var h = (window.location.hash || '').replace('#', '').toLowerCase().trim();
      if (h && typeof canAccess === 'function' ? (h && canAccess(h)) : h) {
        if (h) return h;
      }
    } catch (_) {}
    // (2) پچھلی بار کا صفحہ
    var p = '';
    try { p = localStorage.getItem(key()) || ''; } catch (_) {}
    if (!p) return 'dashboard';
    // اجازت نہ ہو تو ڈیش بورڈ
    try { if (typeof canAccess === 'function' && !canAccess(p)) return 'dashboard'; } catch (_) {}
    return p;
  };

  // showPage کو لپیٹ دو — ہر صفحہ کھلتے ہی یاد ہو جائے
  function wrap() {
    if (typeof window.showPage !== 'function' || window._dioResumeWrapped) return false;
    window._dioResumeWrapped = true;
    var orig = window.showPage;
    window.showPage = function (page, el) {
      try { save(page); } catch (_) {}
      return orig.apply(this, arguments);
    };
    return true;
  }

  // showPage بعد میں بھی بن سکتا ہے (فائلوں کی ترتیب کی وجہ سے) — انتظار کرو
  if (!wrap()) {
    var tries = 0;
    var iv = setInterval(function () {
      if (wrap() || ++tries > 200) clearInterval(iv);   // ~20 سیکنڈ تک
    }, 100);
  }

  // صفحہ بند/چھپنے سے پہلے بھی محفوظ (آخری حالت ضائع نہ ہو)
  window.addEventListener('beforeunload', function () {
    try { if (window._activePage) save(window._activePage); } catch (_) {}
  });
  document.addEventListener('visibilitychange', function () {
    try { if (document.hidden && window._activePage) save(window._activePage); } catch (_) {}
  });
})();
