/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — "جہاں بند ہوا، وہیں سے کھلے"
   • آخری جگہ یاد رکھتی ہے: عام صفحہ، یا کیس + اُس کے اندر کی ٹیب
     (مثلاً میرے مقدمات → فلاں کیس → ضمنیات/161/چالان وغیرہ)
   • پاس ورڈ کے بعد بالکل وہیں کھولتی ہے (ہر افسر کا الگ)
   • مستقل (standalone) — cases.js / misal-docs.js کو ہاتھ نہیں لگاتی،
     صرف اُن کے موجودہ functions لپیٹتی ہے۔

   index.html میں app-core.js سے پہلے:  <script src="resume.js"></script>
   app-core.js (سطر ~868):  showPage(_dioResumePage(), …)   ← ہو چکا
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KEY = 'dio_last_loc';
  var SKIP = ['admin', 'backup', 'bin'];   // ان صفحوں پر واپس نہیں کھولتے

  // ہر افسر کی الگ یادداشت
  function key() {
    var who = '';
    try {
      who = (typeof currentOfficer !== 'undefined' && currentOfficer &&
             (currentOfficer.id || currentOfficer.cnic || currentOfficer.username)) || '';
    } catch (_) {}
    return KEY + (who ? ('_' + who) : '');
  }

  function readState() {
    try { return JSON.parse(localStorage.getItem(key()) || 'null'); } catch (_) { return null; }
  }
  function writeState(st) {
    try { localStorage.setItem(key(), JSON.stringify(st)); } catch (_) {}
  }

  // ── عام صفحہ محفوظ ──
  function savePage(page) {
    if (!page || SKIP.indexOf(page) !== -1) return;
    writeState({ t: 'page', page: String(page) });
  }
  // ── کیس محفوظ (ٹیب بعد میں لگتی ہے) ──
  function saveCase(caseId) {
    if (!caseId) return;
    var prev = readState();
    var docId = (prev && prev.t === 'case' && String(prev.caseId) === String(caseId)) ? prev.docId : null;
    writeState({ t: 'case', caseId: String(caseId), docId: docId || null });
  }
  // ── کیس کے اندر کی ٹیب محفوظ ──
  function saveTab(docId) {
    var cid = '';
    try {
      cid = (typeof _misalCaseId !== 'undefined' && _misalCaseId) ||
            (typeof currentCaseId !== 'undefined' && currentCaseId) ||
            (typeof _currentWorkspaceCaseId !== 'undefined' && _currentWorkspaceCaseId) || '';
    } catch (_) {}
    if (!cid || !docId) return;
    writeState({ t: 'case', caseId: String(cid), docId: String(docId) });
  }

  // شروع میں app-core کے showPage کے لیے — کون سا "صفحہ"
  window._dioResumePage = function () {
    var h = '';
    try { h = (window.location.hash || '').replace('#', '').toLowerCase().trim(); } catch (_) {}
    if (h) { if (SKIP.indexOf(h) !== -1) return 'dashboard';
             try { if (typeof canAccess === 'function' && !canAccess(h)) return 'dashboard'; } catch (_) {}
             return h; }
    var st = readState();
    if (!st) return 'dashboard';
    if (st.t === 'case') return 'cases';
    if (st.t === 'page') {
      if (SKIP.indexOf(st.page) !== -1) return 'dashboard';
      try { if (typeof canAccess === 'function' && !canAccess(st.page)) return 'dashboard'; } catch (_) {}
      return st.page;
    }
    return 'dashboard';
  };

  // ── موجودہ functions لپیٹو (بعد میں لوڈ ہوتے ہیں، اس لیے انتظار) ──
  function wrapAll() {
    var ok = true;
    if (typeof window.showPage === 'function' && !window.showPage.__dioW) {
      var oP = window.showPage;
      window.showPage = function (page, el) { try { savePage(page); } catch (_) {} return oP.apply(this, arguments); };
      window.showPage.__dioW = true;
    } else if (typeof window.showPage !== 'function') ok = false;

    if (typeof window.openCaseWorkspace === 'function' && !window.openCaseWorkspace.__dioW) {
      var oC = window.openCaseWorkspace;
      window.openCaseWorkspace = function (id) { try { saveCase(id); } catch (_) {} return oC.apply(this, arguments); };
      window.openCaseWorkspace.__dioW = true;
    } else if (typeof window.openCaseWorkspace !== 'function') ok = false;

    if (typeof window._openMisalEditor === 'function' && !window._openMisalEditor.__dioW) {
      var oM = window._openMisalEditor;
      window._openMisalEditor = function (docId, fromTab) { try { saveTab(docId); } catch (_) {} return oM.apply(this, arguments); };
      window._openMisalEditor.__dioW = true;
    } else if (typeof window._openMisalEditor !== 'function') ok = false;

    return ok;
  }
  if (!wrapAll()) {
    var t1 = 0, iv1 = setInterval(function () { if (wrapAll() || ++t1 > 200) clearInterval(iv1); }, 100);
  }

  // ── خود بحالی — لاگ اِن مکمل ہونے کے بعد آخری جگہ کھولو (صرف ایک بار) ──
  (function () {
    var done = false, tries = 0;
    var iv = setInterval(function () {
      if (done || ++tries > 150) { clearInterval(iv); return; }
      if (typeof window.showPage !== 'function') return;
      if (!window._activePage) return;
      var ls = document.getElementById('login-screen');
      if (ls && ls.offsetParent !== null) return;
      done = true; clearInterval(iv);
      restore();
    }, 200);
  })();

  function restore() {
    var st = readState();
    if (!st) return;

    if (st.t === 'page') {
      if (st.page && st.page !== window._activePage && typeof window.showPage === 'function') {
        try { window.showPage(st.page, null); } catch (_) {}
      }
      return;
    }

    if (st.t === 'case' && st.caseId && typeof window.openCaseWorkspace === 'function') {
      try { window.openCaseWorkspace(st.caseId); } catch (_) { return; }
      if (!st.docId) return;
      var t2 = 0;
      var iv2 = setInterval(function () {
        if (++t2 > 80) { clearInterval(iv2); return; }
        var ready = document.getElementById('workspace-editor-area') ||
                    document.getElementById('workspace-tab-content');
        if (ready && typeof window._openMisalEditor === 'function') {
          clearInterval(iv2);
          try { window._openMisalEditor(st.docId); } catch (_) {}
        }
      }, 200);
    }
  }

  // صفحہ بند/چھپنے سے پہلے — عام صفحہ ہو تو محفوظ (کیس/ٹیب پہلے ہی محفوظ)
  function saveNow() {
    try {
      if (window._inWorkspace) return;
      if (window._activePage) savePage(window._activePage);
    } catch (_) {}
  }
  window.addEventListener('beforeunload', saveNow);
  document.addEventListener('visibilitychange', function () { if (document.hidden) saveNow(); });
})();
