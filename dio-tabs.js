/* ═══════════════════════════════════════════════════════════════════════
   DIGITAL IO — dio-tabs.js   (TASK 22 — صفحات کھلے رہیں، Chrome جیسی ٹیبیں)
   ───────────────────────────────────────────────────────────────────────
   افسر کی شکایت (4 نومبر 2026): مقدمے کے اندر دوسرا صفحہ کھولتے ہی پہلا بند ہو
   جاتا ہے؛ اوپر کا X / Android «واپس» پورا سافٹ ویئر بند کر دیتا ہے۔
   اصل وجہ (اصل ایپ پر ناپی گئی):
     • ہر دستاویز ایک ہی خانے (#workspace-editor-area) میں نئے سرے سے بنتی تھی
       (doc-viewer.js _dioSwitchTab → _dioRenderTabContent)، پچھلی مٹ جاتی؛
       ضمنی کا مسودہ 1.5 سیکنڈ رکنے پر ہی لکھا جاتا تھا۔
     • ایپ براؤزر کی تاریخ (history) میں کبھی کچھ نہیں ڈالتی تھی (صرف replaceState)
       — اس لیے براؤزر / Android کا «واپس» سیدھا ایپ سے باہر۔

   حل (افسر کی منظوری، 4 نومبر 2026):
     • اوپر ٹیبوں کی پٹی (+، ہر ٹیب کا اپنا ✕، دائیں کونے میں «واپس» / «آگے»)۔
     • ہر ٹیب = Digital IO کی الگ، مکمل نقل اسی کھڑکی میں (اسی افسر کے نام، وہی
       ڈیٹا) — ایک ٹیب دوسری کو کبھی نہیں چھیڑتی (دو مقدمات ساتھ ساتھ محفوظ)۔
     • مرکزی کھڑکی (یہی فائل «host» حالت میں): لاگ اِن، PIN تالا، sync، یاددہانیاں —
       سرور سے ایک ہی رابطہ، ٹیبیں اسی کو استعمال کرتی ہیں۔
     • ٹیب کے اندر «واپس» / «آگے»: جس دستاویز سے آپ ہٹیں وہ پیچھے زندہ رہتی ہے
       (متن، کرسر، scroll)؛ فہرستیں اور ڈیش بورڈ تازہ ڈیٹا سے، اسی scroll پر۔
     • کچھ بھی خود بند نہیں ہوتا: «واپس» کے بعد نیا صفحہ کھولیں تو «آگے» والا
       غیر محفوظ صفحہ اپنی الگ ٹیب میں چلا جاتا ہے؛ محفوظ والا ہٹ جاتا ہے۔
     • ڈیش بورڈ پر «واپس» → «کیا آپ بند کرنا چاہتے ہیں؟»
     • کھڑکی کا اپنا X: براؤزر کی اپنی تصدیق (beforeunload) + خودکار مسودے۔
     • حدیں: 8 ٹیبیں (موبائل 4)، ہر ٹیب میں 10 قدم پیچھے۔
   دو حالتیں، ایک فائل:
     host  — اوپر کی کھڑکی (window.top)، لاگ اِن کے بعد ٹیبیں دکھاتی ہے
     child — ٹیب کے اندر کی نقل (index.html?dtab=…)، window.__dioTabChild
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var CHILD = window.__dioTabChild || null;

  // ── مشترکہ ────────────────────────────────────────────────────────────
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // اردو سطر میں انگریزی / ہندسے (663/26، ASI) الگ رُخ میں — سطر الٹی نہ ہو
  function bidi(t) {
    return String(t == null ? '' : t).split(/([A-Za-z0-9][A-Za-z0-9.\/:-]*(?: [A-Za-z0-9][A-Za-z0-9.\/:-]*)*)/)
      .map(function (p, i) { return i % 2 ? '<bdi>' + esc(p) + '</bdi>' : esc(p); }).join('');
  }
  function mobile() { try { return window.matchMedia('(max-width: 768px)').matches; } catch (_) { return false; } }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  async function waitFor(fn, ms) {
    var t0 = Date.now();
    while (Date.now() - t0 < (ms || 5000)) { try { if (fn()) return true; } catch (_) { /* ابھی نہیں */ } await sleep(60); }
    return false;
  }
  // ایک ہی جگہ؟ (نئی ضمنی محفوظ ہوئی: مسودے کی چابی کی جگہ شناخت — یہ ہٹنا نہیں)
  function samePlace(a, b) {
    if (!a || !b || a.k !== b.k || (a.page || '') !== (b.page || '') || (a.cid || '') !== (b.cid || '') || (a.doc || '') !== (b.doc || '')) return false;
    var x = a.sub, y = b.sub;
    if (!x && !y) return true;
    if (!x || !y || x.t !== y.t) return false;
    if (x.id && y.id) return String(x.id) === String(y.id);
    return !!((x.key && !x.id && y.id) || (y.key && !y.id && x.id) || (x.key && x.key === y.key));
  }
  function isDash(loc) { return !!(loc && loc.k === 'page' && (loc.page || 'dashboard') === 'dashboard'); }
  function locKey(l) {
    if (!l) return '';
    var s = l.sub ? (l.sub.t + ':' + (l.sub.id || l.sub.key || '')) : '';
    return [l.k, l.page || '', l.cid || '', l.doc || '', s].join('|');
  }
  // کلیدیں (افسر نے منظور کیں) — AltGr (= Ctrl+Alt) سے اردو حروف لکھے جاتے ہیں: کبھی نہ روکو
  function keyAction(e) {
    if (!e || e.isComposing) return null;
    var c = e.ctrlKey || e.metaKey, a = e.altKey, s = e.shiftKey, k = e.key, code = e.code || '';
    if (c && a) return null;
    if (a && !c) {
      if (k === 'ArrowLeft') return 'back';
      if (k === 'ArrowRight') return 'fwd';
      if (!s && code === 'KeyT') return 'new';
      if (!s && code === 'KeyW') return 'close';
      if (k === 'PageDown') return 'next';
      if (k === 'PageUp') return 'prev';
      return null;
    }
    if (c && !a) {
      if (!s && code === 'KeyT') return 'new';                 // انسٹال شدہ ایپ (براؤزر کی ٹیب میں Chrome خود لے لیتا ہے)
      if (!s && code === 'KeyW') return 'close';
      if (k === 'Tab') return s ? 'prev' : 'next';
      if (k === 'PageDown') return 'next';
      if (k === 'PageUp') return 'prev';
      if (!s && /^Digit[1-9]$/.test(code)) return 'tab' + code.slice(5);
      if (k === 'Enter') return s ? 'opennewfg' : 'opennew';
    }
    return null;
  }

  if (CHILD) childMain();
  else if (window.top === window && !window.__dioTabsOff) hostMain();

  /* ═════════════════════════════════════════════════════════════════════
     CHILD — ٹیب کے اندر کی نقل
     ═════════════════════════════════════════════════════════════════════ */
  function childMain() {
    var C = window.DIOTabsChild = { fid: CHILD, depth: 0, replaying: 0, ready: false, lastKey: '', scroll: null };
    function H() { try { return window.top.DIOTabs || null; } catch (_) { return null; } }

    // ── یہ ٹیب اس وقت کہاں ہے ──
    function zimniSub() {
      try {
        if (typeof _zimniEditorOpen === 'function' && _zimniEditorOpen() && typeof _zimniActive !== 'undefined' && _zimniActive)
          return { t: 'zimni', id: _zimniActive.id || null, key: _zimniActive.id ? null : (_zimniActive._draftKey || null) };
      } catch (_) { /* ضمنی نہیں */ }
      try {
        var d = document.getElementById('ch173-doc');
        if (d && d.querySelector('.zfa-tbl') && typeof _zaActive !== 'undefined' && _zaActive)
          return { t: 'za', id: _zaActive.id || null, key: _zaActive.id ? null : (_zaActive._draftKey || null) };
        if (d && d.querySelector('#ch173-table') && typeof _r173DocId !== 'undefined' && _r173DocId)
          return { t: 'r173', id: _r173DocId };
      } catch (_) { /* کچھ نہیں */ }
      return null;
    }
    function loc() {
      try {
        if (document.getElementById('dio-docview') && typeof _misalCaseId !== 'undefined' && _misalCaseId) {
          var doc = (typeof _dioActiveTab !== 'undefined' && _dioActiveTab) || (typeof _openDocId !== 'undefined' && _openDocId) || '';
          return { k: 'doc', cid: String(_misalCaseId), doc: String(doc), sub: zimniSub() };
        }
        if (window._inWorkspace && typeof currentCaseId !== 'undefined' && currentCaseId) return { k: 'case', cid: String(currentCaseId) };
        var p = window._activePage || 'dashboard';
        if (p === 'incident' && document.getElementById('ir-view') && typeof _irCur !== 'undefined' && _irCur && _irCur.id)
          return { k: 'page', page: p, sub: { t: 'ir', id: _irCur.id } };
        return { k: 'page', page: p };
      } catch (_) { return { k: 'page', page: 'dashboard' }; }
    }
    C.loc = loc;
    function fir() {
      try { var c = (typeof _misalCase !== 'undefined' && _misalCase) || window._workspaceCase; return c && c.fir_number ? String(c.fir_number) : ''; } catch (_) { return ''; }
    }
    function meta() {
      var l = loc(), t = '', n = '', ic = 'doc';
      try {
        if (l.k === 'page') {
          var te = document.getElementById('topbar-title');
          t = (te && te.textContent.trim()) || 'ڈیش بورڈ';
          ic = l.page === 'dashboard' ? 'home' : (l.page === 'cases' ? 'fold' : 'list');
          if (l.sub && l.sub.t === 'ir') { t = 'واقعاتی رپورٹ'; ic = 'doc'; }
        } else if (l.k === 'case') { t = 'مقدمہ'; n = fir(); ic = 'fold'; }
        else {
          t = (typeof _dioDocName === 'function') ? _dioDocName(l.doc) : l.doc;
          if (l.sub && l.sub.t === 'zimni') {
            var z = (typeof _zimniActive !== 'undefined' && _zimniActive) || {};
            var no = ''; try { no = (typeof _zimniZnoTextFromDoc === 'function' && typeof _zimniDoc === 'function') ? String(_zimniZnoTextFromDoc(_zimniDoc()) || '') : ''; } catch (_) { no = ''; }
            t = 'ضمنی' + (no ? ' ' + no : (z.id ? '' : ' (نئی)'));
          } else if (l.sub && l.sub.t === 'za') t = 'بیان 161';
          n = fir();
        }
      } catch (_) { /* سادہ عنوان */ }
      return { t: t || 'Digital IO', n: n, ic: ic, live: C.isLive(), dirty: C.dirty() };
    }
    C.meta = meta;

    // ── غیر محفوظ کام (ہر ماڈیول کا اپنا نشان) ──
    C.dirtyFlags = function () {
      var f = {};
      try { if (typeof _zimniDirty !== 'undefined' && _zimniDirty) f.zimni = 1; } catch (_) { /* - */ }
      try { if (typeof _zaDirty !== 'undefined' && _zaDirty) f.za = 1; } catch (_) { /* - */ }
      try { if (typeof _misalDirty !== 'undefined' && _misalDirty) f.misal = 1; } catch (_) { /* - */ }
      try { if (typeof _irDirty !== 'undefined' && _irDirty) f.ir = 1; } catch (_) { /* - */ }
      try { if (typeof _dkDirty !== 'undefined' && _dkDirty) f.other = 1; } catch (_) { /* - */ }
      try { if (typeof _sazaDirty !== 'undefined' && _sazaDirty) f.other = 1; } catch (_) { /* - */ }
      try { if (typeof _rfaDirty !== 'undefined' && _rfaDirty) f.other = 1; } catch (_) { /* - */ }
      try { if (typeof _cdrDirty !== 'undefined' && _cdrDirty) f.other = 1; } catch (_) { /* - */ }
      try { if (typeof _croDirty !== 'undefined' && _croDirty) f.other = 1; } catch (_) { /* - */ }
      // نقشہ موقع خود ہی سرور پر محفوظ کرتا ہے (window._naqDirty اس کا فنکشن ہے، نشان نہیں)
      // چالان: _r173Dirty ہر #ch173-doc لکھائی پر لگتا ہے (ضمنی بھی) — صرف چالان کھلا ہو تو
      try { if (typeof _r173Dirty !== 'undefined' && _r173Dirty && document.querySelector('#ch173-doc #ch173-table')) f.other = 1; } catch (_) { /* - */ }
      return f;
    };
    C.dirty = function () { return Object.keys(C.dirtyFlags()).length > 0; };
    // صرف وہ کام جس کا خودکار مسودہ نہیں (بند کرنے سے پہلے پوچھنا ہو)
    C.unsafeDirty = function () { var f = C.dirtyFlags(); return !!(f.other); };
    // زندہ صفحہ = جس میں لکھا جا رہا / لکھا جا سکتا ہے — اس سے ہٹیں تو یہ پیچھے زندہ رہے
    C.isLive = function () {
      if (C.dirty()) return true;
      try {
        if (document.getElementById('ir-view')) return true;
        var b = document.querySelector('#dio-docview #dio-dv-body');
        if (b && b.querySelector('[contenteditable="true"], textarea, input:not([type=hidden]):not([type=search]):not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=file])')) return true;
      } catch (_) { /* نہیں */ }
      return false;
    };
    // بند / سونے / reload سے پہلے: خودکار مسودے ابھی لکھو
    C.flush = function () {
      try { if (typeof _zimniDirty !== 'undefined' && _zimniDirty && typeof _zimniWriteDraft === 'function') _zimniWriteDraft(); } catch (_) { /* - */ }
      try { if (typeof _zaDirty !== 'undefined' && _zaDirty && typeof _zaWriteDraft === 'function') _zaWriteDraft(); } catch (_) { /* - */ }
      try { if (typeof _misalDirty !== 'undefined' && _misalDirty && typeof _openDocId !== 'undefined' && _openDocId && typeof saveMisalDoc === 'function') saveMisalDoc(_openDocId); } catch (_) { /* - */ }
    };

    // ── scroll / کرسر — جو خانہ افسر نے scroll کیا (کوئی بھی)، اسی کی جگہ یاد ──
    function elPath(el) {
      var idx = [];
      for (var n = el; n && n !== document.body && n.parentElement; n = n.parentElement) idx.unshift([].indexOf.call(n.parentElement.children, n));
      return idx.join('.');
    }
    function elAt(p) {
      var n = document.body;
      String(p).split('.').forEach(function (i) { if (n && i !== '') n = n.children[+i]; });
      return n;
    }
    C.scrollMap = {};
    C.scrollSnap = function () { var m = {}; Object.keys(C.scrollMap).forEach(function (k) { m[k] = C.scrollMap[k]; }); return m; };
    C.scrollApply = function (m) {
      if (!m) return;
      Object.keys(m).forEach(function (k) {
        try {
          if (k === 'w') window.scrollTo(0, m[k]);
          else { var e = elAt(k); if (e) e.scrollTop = m[k]; }
        } catch (_) { /* - */ }
      });
    };
    document.addEventListener('scroll', function (e) {
      if (C.replaying) return;
      var t = e.target;
      if (t === document || t === document.documentElement) C.scrollMap.w = window.scrollY || 0;
      else if (t && t.nodeType === 1) C.scrollMap[elPath(t)] = t.scrollTop;
    }, true);
    var _focusEl = null, _range = null;
    document.addEventListener('focusin', function (e) { _focusEl = e.target; }, true);
    document.addEventListener('selectionchange', function () {
      try { var s = getSelection(); if (s && s.rangeCount && document.activeElement && document.activeElement !== document.body) _range = s.getRangeAt(0).cloneRange(); } catch (_) { /* - */ }
    });
    C.restoreFocus = function () {
      try {
        if (_focusEl && _focusEl.isConnected && _focusEl !== document.body) {
          _focusEl.focus({ preventScroll: true });
          if (_range && _focusEl.contains(_range.startContainer)) { var s = getSelection(); s.removeAllRanges(); s.addRange(_range); }
        }
      } catch (_) { /* - */ }
    };

    // ── ہٹنا (navigation) دیکھنا ──
    var _checkT = [];
    function check(replay) {
      var k = locKey(loc());
      if (k === C.lastKey) return;
      var prev = C.navScroll || C.scrollSnap(); C.lastKey = k; C.navScroll = null; C.scrollMap = {};
      var h = H(); if (!h || !C.ready) return;
      try { h._navigated(CHILD, loc(), meta(), { prevScroll: prev, replay: !!replay }); } catch (_) { /* host */ }
    }
    C.check = check;
    function scheduleCheck() {
      _checkT.forEach(clearTimeout);
      _checkT = [80, 450, 1200, 2500].map(function (ms) { return setTimeout(function () { if (!C.replaying) check(false); }, ms); });
    }
    document.addEventListener('click', function () { if (C.ready) scheduleCheck(); }, true);
    document.addEventListener('keyup', function (e) { if (C.ready && (e.key === 'Enter' || e.key === ' ')) scheduleCheck(); }, true);

    // ── نیویگیشن کے دروازے: زندہ صفحے سے ہٹنا = اسی ٹیب میں نیا صفحہ (پچھلا زندہ رہے) ──
    var NAV = ['showPage', 'dioOpenCases', 'openCaseWorkspace', 'goBackToCases', '_openMisalEditor', '_doAddMisalDoc', '_ddPick',
      'openR173List', 'openIncidentReport', 'openIncidentNew'];
    function plain(a) { return (a == null || typeof a === 'string' || typeof a === 'number' || typeof a === 'boolean') ? a : null; }
    // پورے صفحے کے دروازے (کھلی دستاویز کے اوپر نہیں کھلتے) / مقدمے کے اندر کے دروازے (مقدمہ کھلا ہونا چاہیے)
    var PAGE_FNS = { showPage: 1, dioOpenCases: 1, openCaseWorkspace: 1, goBackToCases: 1, openIncidentReport: 1, openIncidentNew: 1 };
    var CASE_FNS = { _openMisalEditor: 1, _doAddMisalDoc: 1, _ddPick: 1, openR173List: 1 };
    function caseLoc() {
      try {
        var cid = (typeof _misalCaseId !== 'undefined' && _misalCaseId) || (typeof currentCaseId !== 'undefined' && currentCaseId) || null;
        return cid ? { k: 'case', cid: String(cid) } : null;
      } catch (_) { return null; }
    }
    function listLoc() { var l = loc(); return l.sub ? { k: l.k, page: l.page, cid: l.cid, doc: l.doc } : l; }
    C.listLoc = listLoc;
    function exitDocs() {
      try {
        if (document.getElementById('dio-docview')) {
          if (typeof _dioResetTabs === 'function') _dioResetTabs();
          if (typeof _dioExitDocView === 'function') _dioExitDocView();
        }
      } catch (_) { /* - */ }
    }
    function wrap(name) {
      var orig = window[name];
      if (typeof orig !== 'function' || orig.__dioTabW) return;
      var w = function () {
        var args = [].slice.call(arguments);
        if (C.depth > 0 || C.replaying || !C.ready) return orig.apply(this, args);
        if (name === '_openMisalEditor' && args[1]) return orig.apply(this, args);     // ٹیب کے اندر دوبارہ بنانا
        if (C.isLive()) {
          var h = H();
          if (h) { h._forwardNav(CHILD, CASE_FNS[name] ? caseLoc() : null, { fn: name, args: args.map(plain) }); return; }
        }
        if (PAGE_FNS[name]) exitDocs();                 // صاف (غیر زندہ) دستاویز کے اوپر نیا صفحہ نہیں — اسی جگہ بدلے
        C.depth++;
        C.navScroll = C.navScroll || C.scrollSnap();
        var r;
        try { r = orig.apply(this, args); } catch (e) { C.depth--; throw e; }
        Promise.resolve(r).then(function () { C.depth--; scheduleCheck(); }, function () { C.depth--; scheduleCheck(); });
        return r;
      };
      w.__dioTabW = true; w.__orig = orig;
      window[name] = w;
    }
    function installWraps() { NAV.forEach(wrap); }

    // ── host کے حکم: کسی جگہ جاؤ / کوئی کام چلاؤ ──
    async function settle() {
      var last = '', same = 0;
      for (var i = 0; i < 40; i++) {
        await sleep(100);
        var k = locKey(loc()) + '#' + (document.querySelector('.loading-screen') ? 'L' : '');
        if (k === last) { if (++same >= 4) return; } else { same = 0; last = k; }
      }
    }
    function openDoc(doc) {
      if (typeof _dioOpenDocTab === 'function') _dioOpenDocTab(doc);
      if (typeof _dioRenderTabContent === 'function') _dioRenderTabContent(doc);
    }
    async function applySub(sub) {
      if (!sub) return;
      var has = function (list, id) { try { return !!(list && list.some(function (z) { return String(z.id) === String(id); })); } catch (_) { return false; } };
      if (sub.t === 'zimni') {
        await waitFor(function () { return document.querySelector('#dio-dv-body [onclick*="_newZimni"]') && (!sub.id || (typeof _zimniList !== 'undefined' && has(_zimniList, sub.id))); }, 9000);
        if (sub.id && typeof _openZimni === 'function') _openZimni(sub.id);
        else if (sub.key && typeof _openZimniDraft === 'function') _openZimniDraft(sub.key);
      } else if (sub.t === 'za') {
        await waitFor(function () { return typeof _zaList !== 'undefined' && (!sub.id || has(_zaList, sub.id)); }, 9000);
        if (sub.id && typeof _openZimniA === 'function') _openZimniA(sub.id);
        else if (sub.key && typeof _openZimniADraft === 'function') _openZimniADraft(sub.key);
      } else if (sub.t === 'r173') {
        await waitFor(function () { return typeof _r173Docs !== 'undefined' && _r173Docs && _r173Docs.length; }, 6000);
        if (typeof _r173OpenDoc === 'function') await _r173OpenDoc(sub.id);
      }
    }
    C.go = async function (l) {
      if (!l) return;
      C.replaying++;
      try {
        if (l.k === 'page') {
          if (l.sub && l.sub.t === 'ir') window._irOpenId = l.sub.id;
          if (document.getElementById('dio-docview') && typeof _dioExitDocView === 'function') _dioExitDocView();
          if (window._inWorkspace && typeof goBackToCases === 'function' && l.page !== 'cases') { window._inWorkspace = false; document.body.classList.remove('workspace-mode'); }
          showPage(l.page || 'dashboard', null);
        } else if (l.k === 'case') {
          if (document.getElementById('dio-docview') && typeof _dioExitDocView === 'function') _dioExitDocView();
          await openCaseWorkspace(l.cid);
        } else if (l.k === 'doc') {
          var same = (typeof _misalCaseId !== 'undefined' && String(_misalCaseId) === String(l.cid) && document.getElementById('misal-doc-bar'));
          if (!same) await openCaseWorkspace(l.cid);
          await waitFor(function () { return document.getElementById('misal-doc-bar') && typeof _dioOpenDocTab === 'function'; }, 8000);
          openDoc(l.doc);
          await settle();
          await applySub(l.sub);
        }
        await settle();
      } finally { C.replaying--; }
    };
    function clickCode(code) {
      var el = document.createElement('span');
      el.style.display = 'none';
      el.setAttribute('onclick', code);          // اسی صفحے کا اپنا onclick (CSP: unsafe-inline پہلے سے)
      document.body.appendChild(el);
      try { el.click(); } finally { el.remove(); }
    }
    C.exec = async function (steps) {
      for (var i = 0; i < steps.length; i++) {
        var s = steps[i];
        if (s.go) await C.go(s.go);
        if (s.run && typeof window[s.run.fn] === 'function') { var r = window[s.run.fn].apply(null, s.run.args || []); try { await r; } catch (_) { /* - */ } await settle(); }
        if (s.click) { clickCode(s.click); await settle(); }
        if (s.doc) { openDoc(s.doc); await settle(); }
        if (s.scroll) { C.scrollApply(s.scroll); }
      }
      C.lastKey = locKey(loc()); C.navScroll = null;
      return { loc: loc(), meta: meta() };
    };

    // ── «واپس» سے پہلے: کوئی چھوٹی تہہ کھلی ہو تو پہلے وہی بند (ایک قدم) ──
    function shown(el) { try { return !!(el && el.isConnected && el.getClientRects().length && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden'); } catch (_) { return false; } }
    C.closeLayer = function () {
      try { if (document.getElementById('dio-msearch') && typeof _msClose === 'function') { _msClose(); return true; } } catch (_) { /* - */ }
      try { if (shown(document.getElementById('dio-fr-panel')) && typeof dioFRClose === 'function') { dioFRClose(); return true; } } catch (_) { /* - */ }
      try { var sb = document.getElementById('dio-share-box'); if (sb) { sb.remove(); return true; } } catch (_) { /* - */ }
      try { var m = document.querySelector('#naq-acc-menu, #saza-acc-menu, #dk-acc-menu, #dio-dv-picker, #dio-cctx'); if (m) { m.remove(); return true; } } catch (_) { /* - */ }
      try { var dd = document.querySelector('[id$="-dd"]'); if (dd && shown(dd) && typeof _closeAllDD === 'function') { _closeAllDD(); return true; } } catch (_) { /* - */ }
      try { if (shown(document.getElementById('modal-backdrop')) && typeof closeModal === 'function') { closeModal(); return true; } } catch (_) { /* - */ }
      try { var ov = document.querySelector('.modal-overlay,[id$="-overlay"]'); if (ov && shown(ov) && typeof closeModal === 'function') { closeModal(); return true; } } catch (_) { /* - */ }
      return false;
    };

    // ── «ایک نئی ٹیب میں کھولیں»: Ctrl+click / درمیانی بٹن / Ctrl+Enter ──
    var NAVRX = /\b(showPage|dioOpenCases|openCaseWorkspace|goBackToCases|_openMisalEditor|_doAddMisalDoc|_ddPick|openR173List|openReport173WithType|openIncidentReport|openIncidentNew|_openZimni|_openZimniDraft|_newZimni|_openZimniA|_openZimniADraft|_newZimniA|_r173OpenDoc|_dioPickDoc|_dioSwitchTab|_irOpen|openFirView)\s*\(/;
    function navCodeOf(el) {
      for (var n = el; n && n !== document.body && n.nodeType === 1; n = n.parentElement) {
        var oc = n.getAttribute && n.getAttribute('onclick');
        if (oc && NAVRX.test(oc) && !/_srShowDocs|DIOCard\.viewer|event\.stopPropagation\(\);\s*_dio(Close|Del)/.test(oc)) return oc;
        if (oc) return null;                      // اپنا کوئی اور کام (Bold وغیرہ) — نئی ٹیب نہیں
      }
      return null;
    }
    function typingIn(el) { return !!(el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))); }
    C.openNewFrom = function (el, fg) {
      var code = el ? navCodeOf(el) : null;
      if (!code) return false;
      var h = H(); if (!h) return false;
      h.openNew({ base: listLoc(), click: code, fg: !!fg, from: CHILD });
      return true;
    };
    window.addEventListener('click', function (e) {
      if (!C.ready || e.button !== 0 || !(e.ctrlKey || e.metaKey) || e.altKey) return;
      if (typingIn(e.target)) return;
      if (C.openNewFrom(e.target, e.shiftKey)) { e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);
    window.addEventListener('mousedown', function (e) { if (e.button === 1 && navCodeOf(e.target)) e.preventDefault(); }, true);
    window.addEventListener('auxclick', function (e) {
      if (!C.ready || e.button !== 1) return;
      if (C.openNewFrom(e.target, false)) { e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);

    // ── کلیدیں → host ──
    window.addEventListener('keydown', function (e) {
      if (!C.ready) return;
      var a = keyAction(e); if (!a) return;
      var h = H(); if (!h) return;
      if (a === 'opennew' || a === 'opennewfg') {
        var el = document.activeElement;
        if (typingIn(el)) return;                 // لکھتے ہوئے Ctrl+Enter: کچھ نہیں (MS Word میں یہ صفحہ توڑتا ہے)
        if (C.openNewFrom(el, a === 'opennewfg')) { e.preventDefault(); e.stopImmediatePropagation(); }
        return;
      }
      e.preventDefault(); e.stopImmediatePropagation();
      h.action(a, CHILD);
    }, true);
    // سرگرمی → مرکزی کھڑکی (PIN تالا کا ٹائمر + «واپس» کا محافظ)
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
      window.addEventListener(ev, function () { var h = H(); if (h) { try { h._activity(CHILD); if (ev !== 'keydown') h._focusFrame(CHILD); } catch (_) { /* - */ } } }, true);
    });
    window.addEventListener('focus', function () { var h = H(); if (h && C.ready) { try { h._focusFrame(CHILD); } catch (_) { /* - */ } } });
    // تھیم ایک ٹیب میں بدلی → ہر ٹیب میں
    window.addEventListener('storage', function (e) {
      if (e.key !== 'dio_theme') return;
      try { if (!e.newValue || e.newValue === 'dark') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', e.newValue); } catch (_) { /* - */ }
    });

    // ── دستاویز کی پٹی کا «مقدمہ 663/26» = اسی ٹیب میں مقدمے کی مسل (دستاویز پیچھے زندہ؛ Ctrl+click = نئی ٹیب) ──
    document.addEventListener('click', function (e) {
      var el = e.target && e.target.closest && e.target.closest('#dio-dv-fir');
      if (!el || !C.ready) return;
      var cid = (typeof _misalCaseId !== 'undefined' && _misalCaseId) ? String(_misalCaseId) : '';
      if (!cid) return;
      e.preventDefault(); e.stopPropagation();
      var code = "openCaseWorkspace('" + cid.replace(/[^\w-]/g, '') + "')";
      if (e.ctrlKey || e.metaKey) { var h = H(); if (h) h.openNew({ base: null, click: code, fg: e.shiftKey, from: CHILD }); return; }
      openCaseWorkspace(cid);
    });

    // ── موجودہ «واپس» / «بند» بٹن → ٹیب کا ایک قدم پیچھے ──
    function patchBack() {
      window.dioGoBack = function () { var h = H(); if (h) h.back(CHILD); };
      // دستاویز کی پٹی کا «نئی دستاویز» → نئی ٹیب (موجودہ بند نہیں)
      window._dioPickDoc = function (docId) {
        try { var p = document.getElementById('dio-dv-picker'); if (p) p.remove(); } catch (_) { /* - */ }
        var h = H(); var cid = (typeof _misalCaseId !== 'undefined' && _misalCaseId) ? String(_misalCaseId) : null;
        if (h && cid) h.openNew({ base: { k: 'case', cid: cid }, doc: docId, fg: true, from: CHILD });
      };
      try { _dioPickDoc = window._dioPickDoc; } catch (_) { /* - */ }
      var oc = window._dioCloseTab;
      if (typeof oc === 'function' && !oc.__dioTabW) {
        var nc = function (docId) {
          var act = (typeof _dioActiveTab !== 'undefined') ? _dioActiveTab : null;
          if (!docId || docId === act) { var h = H(); if (h) { h.back(CHILD, { drop: true, noLayer: true }); return; } }
          return oc.apply(this, arguments);
        };
        nc.__dioTabW = true; window._dioCloseTab = nc;
        try { _dioCloseTab = nc; } catch (_) { /* - */ }
      }
      // ضمنی / بیان 161 کا «← فہرست»: پچھلا قدم اسی دستاویز کی فہرست ہو تو بس «واپس»
      ['_zimniBackToList', '_zaBackToList'].forEach(function (fn) {
        var o = window[fn];
        if (typeof o !== 'function' || o.__dioTabW) return;
        var w = function () {
          var h = H();
          if (h && h.prevIsList(CHILD, loc())) { h.back(CHILD, { noLayer: true }); return; }
          return o.apply(this, arguments);
        };
        w.__dioTabW = true; window[fn] = w;
      });
      // لاگ آؤٹ ٹیب کے اندر سے = پورے Digital IO سے
      window.doLogout = function () { try { return window.top.doLogout(); } catch (_) { /* - */ } };
      try { doLogout = window.doLogout; } catch (_) { /* - */ }
    }

    // ── شروع: مرکزی کھڑکی کے لاگ اِن کا انتظار، پھر اسی افسر کے نام اندر ──
    async function boot() {
      await waitFor(function () { var h = H(); return h && h.started(); }, 24 * 3600 * 1000);
      // `let` والے عالمی متغیر window پر نہیں ہوتے — اوپر کی کھڑکی خود بتاتی ہے (وہی افسر، وہی ریکارڈ)
      try { var w0 = H().who(); currentUser = w0.u; currentOfficer = w0.o; } catch (_) { return; }
      if (!currentUser) return;
      try { if (typeof window._dioChildLogin === 'function') await window._dioChildLogin(); } catch (e) { try { console.warn('dio-tabs child login', e); } catch (_) { /* - */ } }
      await waitFor(function () { return window._activePage === 'dashboard' && document.getElementById('page-content') && !document.querySelector('#page-content .loading-screen'); }, 15000);
      // boot.js / index.html کے اپنے showPage لپیٹے جانے کے بعد — ہمارا سب سے باہر
      await waitFor(function () { return window.showPage && window.showPage._dioWrapped; }, 3000);
      await sleep(350);
      installWraps();
      await waitFor(function () { return typeof _dioRenderTabContent === 'function' && typeof _zimniBackToList === 'function'; }, 20000);
      patchBack();
      C.lastKey = locKey(loc());
      C.ready = true;
      var h = H(); if (h) h._childReady(CHILD, window);
      // دیر سے آنے والی فائلیں (lazy، boot.js) — ان کے دروازے بھی
      var n = 0, iv = setInterval(function () { installWraps(); patchBack(); if (++n > 45) clearInterval(iv); }, 2000);
    }
    if (document.readyState === 'complete') boot(); else window.addEventListener('load', boot);
  }

  /* ═════════════════════════════════════════════════════════════════════
     HOST — اوپر کی کھڑکی: ٹیبوں کی پٹی + ہر ٹیب کی نقل
     ═════════════════════════════════════════════════════════════════════ */
  function hostMain() {
    window.__dioTabsHost = true;
    var MAX_STEPS = 10;
    function maxTabs() { return mobile() ? 4 : 8; }
    function maxFrames() {
      var m = 0; try { m = navigator.deviceMemory || 0; } catch (_) { m = 0; }
      if (mobile()) return m && m <= 2 ? 4 : 6;
      return m && m <= 4 ? 10 : 16;
    }
    var S = { on: false, tabs: [], active: null, prevActive: null, frames: {}, seq: 0, spare: null,
      split: { on: false, other: null, ratio: 0.5, focus: 'a' }, gi: 0, leaving: false, sheet: false };
    var D = window.DIOTabs = { isHost: true };
    D.started = function () { return S.on; };
    D.who = function () { return { u: currentUser, o: currentOfficer }; };
    D._state = function () { return S; };                                  // جانچ کے لیے
    var ROOT, STRIP, STAGE, SHEET, EXIT;
    var ICON = {
      back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 6l6 6-6 6"/><path d="M20 12H4"/></svg>',
      fwd: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 6l-6 6 6 6"/><path d="M4 12h16"/></svg>',
      home: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5L12 4l8 6.5V20H4z"/><path d="M9.5 20v-6h5v6"/></svg>',
      doc: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/></svg>',
      fold: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7.5h6l2 2.5h9V19a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 19z"/></svg>',
      list: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>',
      split: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/></svg>',
    };
    var DASH = { k: 'page', page: 'dashboard' };

    function toast(m, t, ms) { try { if (typeof showToast === 'function') showToast(m, t || 'info', ms || 3500); } catch (_) { /* - */ } }
    function key() {
      var id = '';
      try { id = (currentOfficer && (currentOfficer.id || currentOfficer.user_id)) || (currentUser && currentUser.id) || ''; } catch (_) { id = ''; }
      return 'dio_tabs_v1_' + id;
    }
    function tabById(id) { for (var i = 0; i < S.tabs.length; i++) if (S.tabs[i].id === id) return S.tabs[i]; return null; }
    function activeTab() { return tabById(S.active) || S.tabs[0] || null; }
    function cur(tab) { return tab ? tab.entries[tab.idx] : null; }
    function tabOfFid(fid) {
      for (var i = 0; i < S.tabs.length; i++) for (var j = 0; j < S.tabs[i].entries.length; j++) if (S.tabs[i].entries[j].fid === fid) return S.tabs[i];
      var r = S.frames[fid]; return r ? tabById(r.tabId) : null;
    }
    function entryOfFid(tab, fid) { if (!tab) return -1; for (var j = 0; j < tab.entries.length; j++) if (tab.entries[j].fid === fid) return j; return -1; }
    function mkEntry(l, m, fid) { m = m || {}; return { loc: l, t: m.t || '', n: m.n || '', ic: m.ic || 'doc', fid: fid || null, scroll: null }; }
    function child(rec) { try { return rec && rec.win && rec.win.DIOTabsChild ? rec.win.DIOTabsChild : null; } catch (_) { return null; } }
    function recLive(rec) { var c = child(rec); try { return c ? c.isLive() : false; } catch (_) { return false; } }
    function recDirty(rec) { var c = child(rec); try { return c ? c.dirty() : false; } catch (_) { return false; } }

    // ── نقلیں (فریم) ──
    function frameEl(fid) {
      var f = document.createElement('iframe');
      f.className = 'dio-tf';
      f.name = 'dio-tab-' + fid;
      f.title = 'Digital IO';
      f.setAttribute('allow', 'fullscreen; clipboard-read; clipboard-write; camera; microphone; geolocation; web-share');
      f.setAttribute('allowfullscreen', '');
      f.src = new URL('index.html?dtab=' + fid, location.href).href;
      return f;
    }
    function newRec() {
      var fid = 'f' + Date.now().toString(36) + (++S.seq);
      var rec = { fid: fid, el: null, win: null, tabId: null, last: Date.now(), busy: 0 };
      rec.ready = new Promise(function (res) { rec._res = res; });
      rec.el = frameEl(fid);
      rec.el.addEventListener('load', function () { frameLoaded(rec); });
      build();
      STAGE.appendChild(rec.el);                                       // کبھی منتقل نہیں (منتقل ہو تو دوبارہ لوڈ ہوتی ہے)
      S.frames[fid] = rec;
      return rec;
    }
    // انٹرنیٹ نہ ہو اور service worker ابھی قابو میں نہ ہو تو نئی نقل لوڈ نہیں ہو سکتی (براؤزر کا خرابی والا صفحہ) —
    // فالتو نقل نہیں بنتی؛ ٹیب کی نقل انٹرنیٹ آتے ہی خود دوبارہ لوڈ ہوتی ہے
    function canLoad() { return navigator.onLine !== false || !!(navigator.serviceWorker && navigator.serviceWorker.controller); }
    function whenOnline(fn) { if (canLoad()) { fn(); return; } (S._onl = S._onl || []).push(fn); }
    window.addEventListener('online', function () { var q = S._onl || []; S._onl = []; q.forEach(function (f) { try { f(); } catch (_) { /* - */ } }); });
    function frameOk(rec) { try { var w = rec.el.contentWindow; return !!w && /[?&]dtab=/.test(w.location.search); } catch (_) { return false; } }
    function frameLoaded(rec) {
      if (S.frames[rec.fid] !== rec) return;
      if (frameOk(rec)) { rec.failed = false; return; }
      rec.failed = true; rec.tries = (rec.tries || 0) + 1;
      if (S.spare === rec) { destroy(rec, true); whenOnline(function () { spareArm(1500); }); return; }
      if (S.on) layout();
      if (rec.tries > 6) return;
      var retry = function () {
        if (S.frames[rec.fid] !== rec || rec.win) return;
        rec.el.src = new URL('index.html?dtab=' + rec.fid, location.href).href;
      };
      if (canLoad()) setTimeout(retry, 4000); else whenOnline(retry);
    }
    D._childReady = function (fid, win) { var r = S.frames[fid]; if (!r) return; r.win = win; if (r._res) r._res(win); if (S.on) { layout(); render(); } };
    function spareArm(ms) {
      clearTimeout(S._spareT);
      S._spareT = setTimeout(function () {
        if (S.spare || Object.keys(S.frames).length >= maxFrames() + 1) return;
        if (!canLoad()) { whenOnline(function () { spareArm(1500); }); return; }
        S.spare = newRec();
      }, ms == null ? 1500 : ms);
    }
    function takeFrame(tabId) {
      sleepIfNeeded();
      var r = S.spare;
      if (r) S.spare = null;
      else r = newRec();
      r.tabId = tabId; r.last = Date.now();
      spareArm();
      return r;
    }
    function destroy(rec, noFlush) {
      if (!rec) return;
      var c = child(rec);
      if (c && !noFlush) { try { c.flush(); } catch (_) { /* - */ } }
      try { rec.el.remove(); } catch (_) { /* - */ }
      delete S.frames[rec.fid];
      if (S.spare === rec) S.spare = null;
    }
    // آلے کی حد: پرانا، صاف (بغیر غیر محفوظ کام کے)، نظر سے ہٹا صفحہ «سو» جاتا ہے — دوبارہ آئیں تو محفوظ ڈیٹا سے
    function sleepIfNeeded() {
      var used = Object.keys(S.frames).filter(function (f) { return S.frames[f] !== S.spare; });
      if (used.length < maxFrames()) return;
      var vis = visibleFids(), best = null;
      S.tabs.forEach(function (t) {
        t.entries.forEach(function (e) {
          var r = e.fid && S.frames[e.fid];
          if (!r || vis.indexOf(e.fid) >= 0 || recDirty(r) || r.busy) return;
          if (!best || r.last < best.r.last) best = { r: r, e: e };
        });
      });
      if (best) { try { best.e.scroll = child(best.r) ? child(best.r).scrollSnap() : best.e.scroll; } catch (_) { /* - */ } best.e.fid = null; destroy(best.r); }
    }
    async function drive(rec, steps, entry) {
      rec.busy++;
      try {
        var win = await rec.ready;
        var res = await win.DIOTabsChild.exec(steps);
        if (entry && res) { entry.loc = res.loc; entry.t = res.meta.t; entry.n = res.meta.n; entry.ic = res.meta.ic; }
        return res;
      } catch (e) { try { console.warn('dio-tabs drive', e); } catch (_) { /* - */ } return null; }
      finally { rec.busy--; }
    }

    // ── ٹیبیں ──
    function newTab(pos) {
      var t = { id: 't' + Date.now().toString(36) + (++S.seq), entries: [], idx: -1, dirty: false, loading: false, shown: null };
      if (pos == null || pos > S.tabs.length) S.tabs.push(t); else S.tabs.splice(pos, 0, t);
      return t;
    }
    // ٹیب کی موجودہ جگہ دکھانے کے لیے فریم (سوئی ہوئی ہو تو جگا کر)
    function ensureFrame(tab) {
      var e = cur(tab); if (!e) return Promise.resolve();
      if (e.fid && S.frames[e.fid]) return Promise.resolve();
      var r = takeFrame(tab.id); e.fid = r.fid; e.pending = true; tab.loading = true; render();
      var steps = isDash(e.loc) ? [{ scroll: e.scroll }] : [{ go: e.loc, scroll: e.scroll }];
      return drive(r, steps, e).then(function () { e.pending = false; tab.loading = false; layout(); render(); save(); });
    }
    D.newTab = function (opts) {
      opts = opts || {};
      if (S.tabs.length >= maxTabs()) { toast('زیادہ سے زیادہ ' + maxTabs() + ' ٹیبیں — پہلے کوئی ٹیب بند کریں', 'warn', 4500); return null; }
      var t = newTab(opts.pos != null ? opts.pos : null);            // «+» / Alt+T: Chrome کی طرح آخر میں
      var r = takeFrame(t.id);
      var e = mkEntry(opts.loc || DASH, { t: 'ڈیش بورڈ', ic: 'home' }, r.fid); e.pending = !!(opts.loc && !isDash(opts.loc)) || !!opts.steps;
      t.entries.push(e); t.idx = 0;
      if (opts.fg !== false) activate(t, true);
      render(); save();
      var steps = opts.steps || (opts.loc && !isDash(opts.loc) ? [{ go: opts.loc }] : []);
      t.loading = true; render();
      drive(r, steps, e).then(function () { e.pending = false; t.loading = false; layout(); render(); save(); });
      return t;
    };
    // Ctrl+click / Ctrl+Enter / «نئی دستاویز» → نئی ٹیب (پیچھے اسی جگہ کا ایک قدم، تاکہ «واپس» وہیں لے جائے)
    D.openNew = function (o) {
      if (S.tabs.length >= maxTabs()) { toast('زیادہ سے زیادہ ' + maxTabs() + ' ٹیبیں — پہلے کوئی ٹیب بند کریں', 'warn', 4500); return; }
      var from = o.from ? tabOfFid(o.from) : activeTab();
      var pos = from ? S.tabs.indexOf(from) + 1 : S.tabs.length;
      var steps = [];
      if (o.base && !isDash(o.base)) steps.push({ go: o.base });
      if (o.click) steps.push({ click: o.click });
      if (o.doc) steps.push({ doc: o.doc });
      var t = newTab(pos), r = takeFrame(t.id);
      var base = o.base || DASH, fm = from ? cur(from) : null;
      if (o.base) t.entries.push(mkEntry(base, fm ? { t: fm.t, n: fm.n, ic: fm.ic } : null, null));
      var e = mkEntry(base, { t: '…' }, r.fid); e.pending = true;
      t.entries.push(e); t.idx = t.entries.length - 1; t.loading = true;
      if (o.fg) activate(t, true);
      render(); save();
      drive(r, steps, e).then(function () {
        e.pending = false; t.loading = false;
        if (t.entries.length > 1 && locKey(t.entries[0].loc) === locKey(e.loc)) { t.entries.shift(); t.idx = t.entries.length - 1; }
        layout(); render(); save();
        if (!o.fg) toast('نئی ٹیب میں کھل گیا: ' + (e.t || ''), 'info', 2500);
      });
    };
    function activate(t, quiet) {
      if (!t) return;
      if (S.active !== t.id) S.prevActive = S.active;
      // ساتھ ساتھ: دوسرے خانے والی ٹیب پر کلک = خانہ بدلو
      if (S.split.on && S.split.other === t.id) { S.split.other = S.active; }
      S.active = t.id;
      closeSheet();
      ensureFrame(t);
      layout();
      if (!quiet) { render(); save(); }
      focusActive();
    }
    D.activate = function (id) { activate(tabById(id)); render(); };
    function focusActive() {
      var t = activeTab(), e = cur(t), r = e && e.fid && S.frames[e.fid];
      if (!r) return;
      setTimeout(function () {
        try { r.el.focus(); if (r.win) { r.win.focus(); var c = child(r); if (c) c.restoreFocus(); } } catch (_) { /* - */ }
      }, 30);
    }
    function closeTab(t) {
      if (!t) return;
      var recs = t.entries.map(function (e) { return e.fid && S.frames[e.fid]; }).filter(Boolean);
      var unsafe = recs.some(function (r) { var c = child(r); try { return c && c.unsafeDirty(); } catch (_) { return false; } });
      if (unsafe && !confirm('اس ٹیب میں غیر محفوظ تبدیلیاں ہیں جن کا خودکار مسودہ نہیں بنتا۔\nپھر بھی بند کریں؟ («Cancel» = ٹیب کھلی رہے، پہلے محفوظ کر لیں)')) {
        activate(t); return;
      }
      recs.forEach(function (r) { destroy(r); });
      var i = S.tabs.indexOf(t);
      S.tabs.splice(i, 1);
      if (S.split.other === t.id) S.split.on = false, S.split.other = null;
      if (!S.tabs.length) { D.newTab({ fg: true }); return; }
      if (S.active === t.id) {
        var nt = tabById(S.prevActive) || S.tabs[Math.min(i, S.tabs.length - 1)];
        S.active = null; activate(nt);
      }
      layout(); render(); save();
    }
    D.close = function (id) { closeTab(tabById(id) || activeTab()); };
    // «آگے» والے صفحات ہٹیں: غیر محفوظ کام والا اپنی الگ ٹیب میں، باقی بند
    function dropForward(t) {
      var gone = t.entries.splice(t.idx + 1);
      gone.forEach(function (e) {
        var r = e.fid && S.frames[e.fid];
        if (!r) return;
        if (recDirty(r)) {
          var nt = newTab(S.tabs.indexOf(t) + 1); nt.entries.push(e); nt.idx = 0; r.tabId = nt.id;
          toast('غیر محفوظ صفحہ «' + (e.t || '') + '» الگ ٹیب میں منتقل — بند نہیں ہوا', 'info', 5000);
        } else destroy(r);
      });
    }
    function trim(t) {
      while (t.entries.length > MAX_STEPS) {
        var e = t.entries.shift(); t.idx--;
        var r = e.fid && S.frames[e.fid];
        if (r) {
          if (recDirty(r)) { var nt = newTab(S.tabs.indexOf(t) + 1); nt.entries.push(e); nt.idx = 0; r.tabId = nt.id; }
          else destroy(r);
        }
      }
    }

    // ── ٹیب کے اندر ہٹنا (child بتاتی ہے) ──
    D._navigated = function (fid, l, m, info) {
      var r = S.frames[fid]; if (!r || r.busy) return;
      r.last = Date.now();
      var t = tabOfFid(fid); if (!t) return;
      var ei = entryOfFid(t, fid); if (ei < 0) return;
      var e = t.entries[ei];
      if (locKey(e.loc) === locKey(l) || samePlace(e.loc, l)) { e.loc = l; e.t = m.t; e.n = m.n; e.ic = m.ic; render(); save(); return; }
      if (ei !== t.idx) { e.loc = l; e.t = m.t; e.n = m.n; e.ic = m.ic; render(); save(); return; }
      dropForward(t);
      e.fid = null; e.scroll = info && info.prevScroll;
      t.entries.push(mkEntry(l, m, fid)); t.idx = t.entries.length - 1;
      trim(t);
      render(); save(); guardTopUp();
    };
    // زندہ صفحے سے ہٹنا: نیا صفحہ نئی نقل میں (پچھلا وہیں زندہ)
    D._forwardNav = function (fid, base, call) {
      var t = tabOfFid(fid); if (!t) return;
      var ei = entryOfFid(t, fid); if (ei !== t.idx) return;
      try { t.entries[ei].scroll = child(S.frames[fid]).scrollSnap(); } catch (_) { /* - */ }
      dropForward(t);
      var r = takeFrame(t.id);
      var e = mkEntry(base || DASH, { t: '…' }, r.fid); e.pending = true;
      t.entries.push(e); t.idx = t.entries.length - 1; t.loading = true;
      trim(t); render();
      var steps = []; if (base && !isDash(base)) steps.push({ go: base }); steps.push({ run: call });
      drive(r, steps, e).then(function () {
        e.pending = false; t.loading = false; layout(); render(); save();
        if (S.active === t.id) focusActive();
      });
    };
    D.prevIsList = function (fid, l) {
      var t = tabOfFid(fid); if (!t || t.idx < 1) return false;
      var p = t.entries[t.idx - 1].loc;
      return !!(p && l && p.k === 'doc' && l.k === 'doc' && p.cid === l.cid && p.doc === l.doc && !p.sub);
    };

    // ── «واپس» / «آگے» ──
    function goTo(t, i, drop) {
      var from = t.idx, ce = t.entries[from], te = t.entries[i];
      if (!te) return;
      var cr = ce && ce.fid && S.frames[ce.fid];
      if (cr) { try { ce.scroll = child(cr).scrollSnap(); } catch (_) { /* - */ } }
      if (te.fid && S.frames[te.fid]) {
        t.idx = i;
        if (drop) { t.entries.splice(from, 1); if (from < t.idx) t.idx--; if (cr) destroy(cr, true); }
        layout(); render(); save();
        if (S.active === t.id) focusActive();
        return;
      }
      var reuse = null;
      if (cr && (drop || !recLive(cr))) { reuse = cr; ce.fid = null; }
      var r = reuse || takeFrame(t.id);
      te.fid = r.fid; te.pending = true; t.idx = i; t.loading = true;
      if (drop) { t.entries.splice(from, 1); if (from < t.idx) t.idx--; if (cr && !reuse) destroy(cr, true); }
      render();
      drive(r, [{ go: te.loc, scroll: te.scroll }], te).then(function () {
        te.pending = false; t.loading = false; layout(); render(); save();
        if (S.active === t.id) focusActive();
      });
    }
    function tabFor(fid) { return (fid && tabOfFid(fid)) || activeTab(); }
    D.back = function (fid, opts) {
      opts = opts || {};
      var t = tabFor(fid); if (!t || t.loading) return;
      var e = cur(t), r = e && e.fid && S.frames[e.fid];
      if (!opts.noLayer && r) { var c = child(r); try { if (c && c.closeLayer()) return; } catch (_) { /* - */ } }
      if (t.idx > 0) { goTo(t, t.idx - 1, opts.drop); return; }
      if (isDash(e.loc)) { exitAsk(); return; }
      t.entries.unshift(mkEntry(DASH, { t: 'ڈیش بورڈ', ic: 'home' }, null)); t.idx = 1;
      goTo(t, 0, opts.drop);
    };
    D.forward = function (fid) {
      var t = tabFor(fid); if (!t || t.loading) return;
      if (t.idx < t.entries.length - 1) goTo(t, t.idx + 1, false);
    };
    D.action = function (a, fid) {
      var t = tabFor(fid);
      if (a === 'back') return D.back(fid);
      if (a === 'fwd') return D.forward(fid);
      if (a === 'new') return D.newTab({ fg: true });
      if (a === 'close') return closeTab(t);
      if (a === 'next' || a === 'prev') {
        var i = S.tabs.indexOf(activeTab()); if (i < 0) return;
        var j = (i + (a === 'next' ? 1 : -1) + S.tabs.length) % S.tabs.length;
        return activate(S.tabs[j]);
      }
      var m = /^tab(\d)$/.exec(a);
      if (m) { var n = +m[1]; var tt = n === 9 ? S.tabs[S.tabs.length - 1] : S.tabs[n - 1]; if (tt) activate(tt); }
    };

    // ── ڈیش بورڈ پر «واپس» → «کیا آپ بند کرنا چاہتے ہیں؟» ──
    function exitAsk() {
      if (!EXIT) return;
      EXIT.innerHTML = '<div class="box" role="dialog" aria-modal="true">' +
        '<h3>کیا آپ بند کرنا چاہتے ہیں؟</h3>' +
        '<p>آپ کا کام ہر ٹیب میں کھلا ہے؛ ضمنی اور بیان 161 کا مسودہ خودکار محفوظ ہوتا ہے۔ کھلی ٹیبیں اگلی بار لاگ اِن کے بعد واپس آ جائیں گی۔</p>' +
        '<div class="row"><button type="button" class="stay">نہیں — Digital IO میں رہیں</button><button type="button" class="go">ہاں، بند کریں</button></div></div>';
      EXIT.classList.add('on');
      var stay = EXIT.querySelector('.stay'), go = EXIT.querySelector('.go');
      stay.onclick = function () { EXIT.classList.remove('on'); guardTopUp(); focusActive(); };
      go.onclick = function () { EXIT.classList.remove('on'); leave(); };
      setTimeout(function () { try { stay.focus(); } catch (_) { /* - */ } }, 30);
    }
    D._exitAsk = exitAsk;
    function leave() {
      flushAll(); saveNow();
      S.leaving = true;
      try { window.close(); } catch (_) { /* - */ }
      setTimeout(function () {
        try { history.go(-(S.gi + 1)); } catch (_) { /* - */ }
        setTimeout(function () {
          if (document.visibilityState === 'visible') {
            S.leaving = false; guardTopUp();
            toast('یہ کھڑکی ایپ خود بند نہیں کر سکتی — اوپر کھڑکی کا ✕ دبائیں', 'info', 6000);
          }
        }, 900);
      }, 250);
    }

    // ── براؤزر / Android «واپس»: تاریخ میں محافظ قدم (صرف کلک / ٹیپ کے وقت ڈالے جاتے ہیں) ──
    function guardInit() {
      try { history.replaceState({ dioG: 0 }, ''); } catch (_) { /* - */ }
      S.gi = 0; guardTopUp();
    }
    function guardTopUp() {
      if (!S.on || S.leaving) return;
      try { while (S.gi < 2) { S.gi++; history.pushState({ dioG: S.gi }, ''); } } catch (_) { /* - */ }
    }
    D._activity = function () {
      guardTopUp();
      try { if (typeof resetSessionTimer === 'function') resetSessionTimer(); } catch (_) { /* - */ }
    };
    window.addEventListener('popstate', function (e) {
      if (!S.on || S.leaving) return;
      var g = (e.state && typeof e.state.dioG === 'number') ? e.state.dioG : 0;
      if (g < S.gi) { S.gi = g; if (EXIT && EXIT.classList.contains('on')) { EXIT.classList.remove('on'); return; } if (S.sheet) { closeSheet(); render(); return; } D.back(); }
      else if (g > S.gi) { S.gi = g; D.forward(); }
    });

    // ── کھڑکی کا اپنا X / reload: خودکار مسودے + براؤزر کی اپنی تصدیق ──
    function flushAll() { Object.keys(S.frames).forEach(function (f) { var c = child(S.frames[f]); if (c) { try { c.flush(); } catch (_) { /* - */ } } }); }
    function anyDirty() { return Object.keys(S.frames).some(function (f) { return recDirty(S.frames[f]); }); }
    window.addEventListener('beforeunload', function (e) {
      if (!S.on || S.leaving) return;
      flushAll(); saveNow();
      if (window.__dioReloadQuiet && !anyDirty()) return;
      e.preventDefault(); e.returnValue = '';
      return '';
    });
    window.addEventListener('pagehide', function () { if (S.on) { flushAll(); saveNow(); } });

    // ── محفوظ کرنا / بحال کرنا (ہر افسر کا الگ، اسی آلے پر) ──
    var _saveT = null;
    function saveNow() {
      clearTimeout(_saveT); _saveT = null;
      if (!S.on) return;
      try {
        var st = { v: 1, at: Date.now(), active: S.tabs.indexOf(activeTab()), tabs: S.tabs.map(function (t) {
          return { idx: t.idx, entries: t.entries.map(function (e) { return { loc: e.loc, t: e.t, n: e.n, ic: e.ic, scroll: e.scroll || null }; }) };
        }) };
        localStorage.setItem(key(), JSON.stringify(st));
      } catch (_) { /* آلے کی جگہ بھری */ }
    }
    function save() {
      if (!S.on) return;
      clearTimeout(_saveT);
      _saveT = setTimeout(saveNow, 120);
    }
    function restore() {
      var st = null;
      try { st = JSON.parse(localStorage.getItem(key()) || 'null'); } catch (_) { st = null; }
      S.tabs = [];
      if (st && Array.isArray(st.tabs)) {
        st.tabs.slice(0, maxTabs()).forEach(function (s) {
          if (!s || !Array.isArray(s.entries) || !s.entries.length) return;
          var t = newTab(null);
          t.entries = s.entries.slice(-MAX_STEPS).map(function (x) { var e = mkEntry(x.loc, x, null); e.scroll = x.scroll || null; return e; });
          t.idx = Math.max(0, Math.min(t.entries.length - 1, s.idx | 0));
        });
      }
      // افسر کا فیصلہ (4 نومبر 2026): لاگ اِن کے بعد ڈیش بورڈ سامنے، باقی ٹیبیں ساتھ
      var dash = null;
      for (var i = 0; i < S.tabs.length; i++) if (isDash(cur(S.tabs[i]).loc)) { dash = S.tabs[i]; break; }
      if (dash) { S.tabs.splice(S.tabs.indexOf(dash), 1); S.tabs.unshift(dash); }
      else {
        if (S.tabs.length >= maxTabs()) S.tabs.length = maxTabs() - 1;
        var d = newTab(0); d.entries.push(mkEntry(DASH, { t: 'ڈیش بورڈ', ic: 'home' }, null)); d.idx = 0;
      }
      S.active = S.tabs[0].id;
    }

    // ── شروع / بند ──
    D.start = function () {
      if (S.on) return;
      S.on = true; S.leaving = false;
      build();
      ROOT.classList.remove('pre');
      document.body.classList.add('dio-tabs-on');
      restore();
      var t = activeTab(), e = cur(t);
      // پہلے سے تیار نقل (لاگ اِن اسکرین کے دوران بنی) ڈیش بورڈ ٹیب کو
      var r = takeFrame(t.id); e.fid = r.fid; e.pending = false;
      layout(); render(); save();
      r.ready.then(function () { layout(); render(); focusActive(); });
      guardInit();
      clearInterval(S._poll); S._poll = setInterval(poll, 1500);
    };
    D.stop = function () {
      if (!S.on) return;
      flushAll(); saveNow();                     // فوراً — بعد میں لاگ آؤٹ کی صفائی یہ فہرست مٹاتی ہے (دوبارہ نہ لکھی جائے)
      S.on = false;
      clearInterval(S._poll);
      Object.keys(S.frames).forEach(function (f) { destroy(S.frames[f], true); });
      S.frames = {}; S.tabs = []; S.active = null; S.spare = null; S.split.on = false;
      document.body.classList.remove('dio-tabs-on');
      try { ROOT.classList.add('pre'); STRIP.innerHTML = ''; SHEET.classList.remove('on'); EXIT.classList.remove('on'); } catch (_) { /* - */ }
      preSpare();
    };
    // لاگ اِن کے دوران ہی پہلی نقل تیار (لاگ اِن کے بعد ڈیش بورڈ فوراً)
    function preSpare() {
      setTimeout(function () {
        if (S.on || S.spare) return;
        try { var ls = document.getElementById('login-screen'); if (!ls || getComputedStyle(ls).display === 'none') return; } catch (_) { return; }
        S.spare = newRec();
      }, 1200);
    }
    if (document.readyState === 'complete') preSpare(); else window.addEventListener('load', preSpare);

    // ── باقاعدہ جانچ: غیر محفوظ نشان + عنوان ──
    function poll() {
      if (!S.on) return;
      var ch = false;
      S.tabs.forEach(function (t) {
        var d = false;
        t.entries.forEach(function (e) { var r = e.fid && S.frames[e.fid]; if (r && recDirty(r)) d = true; });
        if (d !== t.dirty) { t.dirty = d; ch = true; }
        var e = cur(t), r = e && e.fid && S.frames[e.fid], c = child(r);
        if (c && c.ready && !r.busy && !e.pending) {
          try { var m = c.meta(); if (m.t !== e.t || m.n !== e.n) { e.t = m.t; e.n = m.n; e.ic = m.ic; ch = true; } } catch (_) { /* - */ }
          // محفوظ ہوتے ہی نئی ضمنی کو اپنی شناخت ملتی ہے — بحالی اسی شناخت سے کھولے
          try { var l = c.loc(); if (locKey(l) !== locKey(e.loc) && samePlace(e.loc, l)) { e.loc = l; ch = true; } } catch (_) { /* - */ }
          // کلک کے بغیر کوئی صفحہ بدلا ہو (کلید، خودکار) — وہ بھی اسی ٹیب کی تاریخ میں
          try { if (!c.replaying && !c.depth) c.check(false); } catch (_) { /* - */ }
        }
      });
      if (ch) { render(); save(); }
    }

    // تھیم کسی ٹیب میں بدلی → اوپر کی پٹی بھی اسی رنگ میں
    window.addEventListener('storage', function (e) {
      if (e.key !== 'dio_theme') return;
      try { if (!e.newValue || e.newValue === 'dark') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', e.newValue); } catch (_) { /* - */ }
    });

    // ── Realtime: مرکزی کھڑکی کا ایک ہی رابطہ، ہر ٹیب کو خبر ──
    function eachChild(fn) { Object.keys(S.frames).forEach(function (f) { var r = S.frames[f]; try { if (r.win) fn(r.win); } catch (_) { /* - */ } }); }
    D.relayTable = function (table) { eachChild(function (w) { if (typeof w.__dioOnTable === 'function') w.__dioOnTable(table); }); };
    window.addEventListener('dio-remote', function (e) {
      var d = e && e.detail; if (!d) return;
      eachChild(function (w) { if (w.DIOSync && typeof w.DIOSync.emitLocal === 'function') w.DIOSync.emitLocal(d.table, d.row, d.kind); });
    });

    // ── براؤزر کے مینو کی چھپائی (⋮ › Print): کھلی ٹیب کا وہی کاغذ ──
    var _pr = null;
    window.addEventListener('beforeprint', function () {
      if (!S.on || _pr) return;
      var t = activeTab(), e = cur(t), r = e && e.fid && S.frames[e.fid], w = r && r.win;
      if (!w) return;
      _pr = { added: [], cls: [] };
      try {
        if (w.document.documentElement.classList.contains('dio-viewonly')) {
          if (!document.documentElement.classList.contains('dio-viewonly')) { document.documentElement.classList.add('dio-viewonly'); _pr.cls.push('vo'); }
          return;
        }
        var pk = (w.dioNativePrint && typeof w.dioNativePrint.pick === 'function') ? w.dioNativePrint.pick() : null;
        if (pk && window.dioNativePrint) {
          var a = window.dioNativePrint.render(pk.html);
          _pr.pp = a;
          if (typeof pk.after === 'function') pk.after(a.root, window);
          return;
        }
        var node = (typeof w._dioNPrintFind === 'function') ? w._dioNPrintFind() : null;
        if (!node) return;
        // ٹیب کی اپنی (چلتے وقت بنی) CSS — یہاں پہلے سے نہ ہو تو
        var have = {};
        [].forEach.call(document.querySelectorAll('style'), function (s) { have[s.textContent] = 1; });
        [].forEach.call(w.document.querySelectorAll('style'), function (s) {
          if (node.contains(s) || have[s.textContent]) return;
          var c = document.createElement('style'); c.textContent = s.textContent; c.setAttribute('data-dio-tabs-print', '');
          document.head.appendChild(c); _pr.added.push(c);
        });
        [].forEach.call(w.document.body.classList, function (c) { if (!document.body.classList.contains(c)) { document.body.classList.add(c); _pr.cls.push('b:' + c); } });
        var host = document.createElement('div');
        host.id = 'dio-nprint-host';
        host.appendChild(document.importNode(node, true));
        document.body.appendChild(host); _pr.host = host;
        if (!document.body.classList.contains('dio-nprint')) { document.body.classList.add('dio-nprint'); _pr.cls.push('b:dio-nprint'); }
      } catch (err) { try { console.warn('dio-tabs print', err); } catch (_) { /* - */ } }
    });
    function printDone() {
      var p = _pr; _pr = null; if (!p) return;
      try { if (p.pp && window.dioNativePrint) { p.pp.host.remove(); p.pp.style.remove(); } } catch (_) { /* - */ }
      try { if (p.host) p.host.remove(); } catch (_) { /* - */ }
      p.added.forEach(function (s) { try { s.remove(); } catch (_) { /* - */ } });
      p.cls.forEach(function (c) { if (c === 'vo') document.documentElement.classList.remove('dio-viewonly'); else document.body.classList.remove(c.slice(2)); });
    }
    window.addEventListener('afterprint', printDone);
    D._printDone = printDone;

    // ── کلیدیں (کرسر اوپر کی پٹی پر ہو تو) ──
    window.addEventListener('keydown', function (e) {
      if (!S.on) return;
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.code === 'KeyP')) {
        // Ctrl+P پٹی پر: کھلی ٹیب کا وہی راستہ جو اندر Ctrl+P کا
        var r0 = (function () { var t = activeTab(), x = cur(t); return x && x.fid && S.frames[x.fid]; })();
        if (r0 && r0.win) {
          e.preventDefault(); e.stopImmediatePropagation();
          try {
            var ev = new r0.win.KeyboardEvent('keydown', { key: 'p', code: 'KeyP', ctrlKey: true, bubbles: true, cancelable: true });
            var tgt = r0.win.document.activeElement || r0.win.document.body;
            if (tgt.dispatchEvent(ev)) r0.win.print();
          } catch (_) { /* - */ }
        }
        return;
      }
      var a = keyAction(e); if (!a || a === 'opennew' || a === 'opennewfg') return;
      e.preventDefault(); e.stopImmediatePropagation();
      D.action(a, null);
    }, true);

    // ── پٹی بنانا ──
    var CSS =
      '#dio-tabs-root{position:fixed;inset:0;display:flex;flex-direction:column;z-index:1;background:var(--bg-primary,#eef2f7);direction:rtl;}' +
      '#dio-tabs-root.pre{visibility:hidden;z-index:-1;pointer-events:none;}' +
      'body.dio-tabs-on{overflow:hidden;}' +
      'body.dio-tabs-on #main-app,body.dio-tabs-on #login-screen,body.dio-tabs-on #pwa-install-btn{display:none !important;}' +
      // اوپر کی کھڑکی کی اپنی موبائل نیچے والی پٹی (انگوٹھے کی پٹی) وغیرہ — ٹیب کی اپنی پٹی ہی نظر آئے، اوپر والی اس پر نہ چڑھے
      'body.dio-tabs-on > .dio-thumbbar,body.dio-tabs-on > .dio-mbar,body.dio-tabs-on > .dio-addblk{display:none !important;}' +
      '#dio-tabs-strip{height:40px;flex-shrink:0;display:flex;align-items:flex-end;gap:4px;padding:0 8px;direction:rtl;' +
        'background:var(--dio-file-2,#0b1730);border-bottom:2px solid var(--dio-brass,#c9a227);font-family:"Jameel Noori Nastaleeq";}' +
      '#dio-tabs-strip .nav{display:flex;gap:2px;align-self:center;flex-shrink:0;}' +
      '#dio-tabs-strip .nb{height:30px;min-width:34px;border:none;border-radius:8px;background:transparent;color:#fff;display:inline-flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;padding:0 8px;font:inherit;font-size:10.5pt;}' +
      '#dio-tabs-strip .nb svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;}' +
      '#dio-tabs-strip .nb:hover{background:rgba(255,255,255,.12);}' +
      '#dio-tabs-strip .nb.off{opacity:.35;}' +
      '#dio-tabs-strip .tabs{display:flex;gap:2px;align-items:flex-end;min-width:0;flex:1 1 auto;overflow:hidden;}' +
      '#dio-tabs-strip .dio-tab{height:34px;min-width:96px;max-width:210px;flex:0 1 210px;display:flex;align-items:center;gap:6px;padding:0 12px 0 6px;' +
        'border-radius:10px 10px 0 0;color:#c9d4e6;font-size:10.5pt;white-space:nowrap;position:relative;cursor:pointer;user-select:none;}' +
      '#dio-tabs-strip .dio-tab .t{overflow:hidden;text-overflow:ellipsis;flex:1 1 auto;min-width:0;padding-top:2px;}' +
      '#dio-tabs-strip .dio-tab .n{flex-shrink:0;font-size:9.75pt;opacity:.9;font-family:Arial,sans-serif;}' +
      '#dio-tabs-strip .sep,#dio-tabs-sheet .sep{opacity:.6;flex-shrink:0;}' +
      '#dio-tabs-strip .dio-tab .ic{width:15px;height:15px;flex-shrink:0;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;opacity:.85;}' +
      '#dio-tabs-strip .dio-tab .x{width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font:9pt Arial,sans-serif;opacity:.75;flex-shrink:0;}' +
      '#dio-tabs-strip .dio-tab .x:hover{background:rgba(255,255,255,.2);opacity:1;}' +
      '#dio-tabs-strip .dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#e9cf73;flex-shrink:0;}' +
      '#dio-tabs-strip .dio-tab:not(.on):hover{background:rgba(255,255,255,.07);}' +
      '#dio-tabs-strip .dio-tab.on{background:var(--dio-file,#14284a);color:#fff;box-shadow:inset 0 2px 0 var(--dio-brass,#c9a227);}' +
      '#dio-tabs-strip .dio-tab.split2{background:rgba(255,255,255,.12);color:#fff;box-shadow:inset 0 2px 0 #38bdf8;}' +
      '#dio-tabs-strip .dio-tab.loading .ic{animation:dioTabSpin 1s linear infinite;}' +
      '@keyframes dioTabSpin{to{transform:rotate(360deg);}}' +
      '#dio-tabs-strip .plus{align-self:center;flex-shrink:0;width:30px;height:30px;margin:0 4px 2px 0;border:none;border-radius:8px;background:transparent;color:#fff;font:16pt Arial,sans-serif;line-height:1;cursor:pointer;}' +
      '#dio-tabs-strip .plus:hover{background:rgba(255,255,255,.12);}' +
      '#dio-tabs-strip .end{display:flex;gap:6px;align-self:center;flex-shrink:0;margin-right:6px;}' +
      '#dio-tabs-strip .split-btn{height:28px;border:1px solid rgba(255,255,255,.3);border-radius:8px;background:transparent;color:#fff;font:inherit;font-size:9.75pt;padding:0 10px;display:inline-flex;align-items:center;gap:6px;cursor:pointer;}' +
      '#dio-tabs-strip .split-btn.on{background:#38bdf8;border-color:#38bdf8;color:#06223a;}' +
      '#dio-tabs-strip .split-btn svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;}' +
      '#dio-tabs-strip.m{height:48px;align-items:center;gap:4px;padding:0 6px;}' +
      '#dio-tabs-strip.m .nb{width:40px;height:40px;padding:0;}' +
      '#dio-tabs-strip.m .mtitle{flex:1;min-width:0;color:#fff;font-size:11.25pt;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-top:3px;}' +
      '#dio-tabs-strip.m .mtitle .n{font-family:Arial,sans-serif;font-size:10.5pt;}' +
      '#dio-tabs-strip.m .count{width:30px;height:30px;border:2px solid #fff;border-radius:8px;color:#fff;font:700 11pt Arial,sans-serif;background:transparent;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;}' +
      '#dio-tabs-strip.m .plus{width:40px;height:40px;margin:0;}' +
      '#dio-tabs-stage{position:relative;flex:1;min-height:0;background:var(--bg-primary,#eef2f7);}' +
      '#dio-tabs-stage iframe.dio-tf{position:absolute;top:0;bottom:0;right:0;width:100%;height:100%;border:0;visibility:hidden;pointer-events:none;background:var(--bg-primary,#eef2f7);}' +
      '#dio-tabs-stage iframe.dio-tf.on{visibility:visible;pointer-events:auto;}' +
      '#dio-tabs-stage iframe.dio-tf.on.focus{box-shadow:inset 0 3px 0 #38bdf8;}' +
      '#dio-tabs-stage.dragging iframe{pointer-events:none !important;}' +
      '#dio-tabs-stage .dio-split-div{position:absolute;top:0;bottom:0;width:6px;background:#94a3b8;cursor:col-resize;z-index:3;}' +
      '#dio-tabs-stage .dio-tabs-load{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:var(--text-muted,#64748b);font-family:"Jameel Noori Nastaleeq";font-size:11.25pt;z-index:2;}' +
      '#dio-tabs-sheet{position:fixed;inset:0;z-index:9000;background:var(--bg-primary,#eef2f7);display:none;flex-direction:column;direction:rtl;font-family:"Jameel Noori Nastaleeq";}' +
      '#dio-tabs-sheet.on{display:flex;}' +
      '#dio-tabs-sheet .hd{height:56px;flex-shrink:0;background:var(--dio-file-2,#0b1730);color:#fff;display:flex;align-items:center;gap:8px;padding:0 12px;font-size:13pt;}' +
      '#dio-tabs-sheet .hd .sp{flex:1;}' +
      '#dio-tabs-sheet .hd button{height:36px;border-radius:9px;border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;font:inherit;font-size:10.5pt;padding:0 12px;cursor:pointer;}' +
      '#dio-tabs-sheet .hd button.pri{background:#e9cf73;border-color:#e9cf73;color:#1b1300;font-weight:700;}' +
      '#dio-tabs-sheet .list{padding:12px;display:flex;flex-direction:column;gap:10px;overflow:auto;}' +
      '#dio-tabs-sheet .card{background:var(--bg-card,#fff);color:var(--text-primary,#0f1d36);border:1px solid var(--border,#d6dee9);border-radius:14px;padding:10px 14px 12px 10px;display:flex;gap:10px;align-items:flex-start;cursor:pointer;}' +
      '#dio-tabs-sheet .card.on{border:2px solid var(--accent,#0369a1);}' +
      '#dio-tabs-sheet .card .bd{flex:1;min-width:0;}' +
      '#dio-tabs-sheet .card .tt{font-size:12pt;font-weight:700;}' +
      '#dio-tabs-sheet .card .tt .n{font-family:Arial,sans-serif;font-size:11pt;}' +
      '#dio-tabs-sheet .card .pth{font-size:9.75pt;color:var(--text-muted,#64748b);margin-top:2px;}' +
      '#dio-tabs-sheet .card .uns{display:inline-block;margin-top:6px;font-size:9pt;color:#92400e;background:#fef3c7;border:1px solid #fcd34d;border-radius:20px;padding:1px 10px;}' +
      '#dio-tabs-sheet .card .cx{width:34px;height:34px;border-radius:50%;border:1px solid var(--border,#d6dee9);background:transparent;color:inherit;font:12pt Arial,sans-serif;flex-shrink:0;cursor:pointer;}' +
      '#dio-tabs-sheet .ft{margin-top:auto;padding:10px 12px 16px;color:var(--text-muted,#64748b);font-size:9.75pt;text-align:center;}' +
      '#dio-tabs-exit{position:fixed;inset:0;background:rgba(5,12,24,.55);z-index:20000;display:none;align-items:center;justify-content:center;direction:rtl;font-family:"Jameel Noori Nastaleeq";}' +
      '#dio-tabs-exit.on{display:flex;}' +
      '#dio-tabs-exit .box{width:min(440px,92vw);background:var(--bg-card,#fff);color:var(--text-primary,#0f1d36);border-radius:16px;padding:20px 22px 18px;box-shadow:0 18px 50px rgba(0,0,0,.35);}' +
      '#dio-tabs-exit h3{margin:0 0 6px;font-size:16pt;}' +
      '#dio-tabs-exit p{margin:0 0 16px;font-size:11.25pt;color:var(--text-muted,#475569);line-height:1.9;}' +
      '#dio-tabs-exit .row{display:flex;gap:10px;}' +
      '#dio-tabs-exit .row button{flex:1;min-height:44px;border-radius:10px;font:inherit;font-size:11.25pt;cursor:pointer;}' +
      '#dio-tabs-exit .stay{background:#0f3a63;color:#fff;border:none;font-weight:700;}' +
      '#dio-tabs-exit .go{background:transparent;color:#b91c1c;border:1px solid #fecaca;}' +
      'bdi{unicode-bidi:isolate;}' +
      '@media print{#dio-tabs-root,#dio-tabs-sheet,#dio-tabs-exit{display:none !important;}}';
    function build() {
      if (ROOT) return;
      if (!document.getElementById('dio-tabs-css')) { var st = document.createElement('style'); st.id = 'dio-tabs-css'; st.textContent = CSS; document.head.appendChild(st); }
      ROOT = document.createElement('div'); ROOT.id = 'dio-tabs-root'; ROOT.className = 'pre'; ROOT.setAttribute('dir', 'rtl');
      STRIP = document.createElement('div'); STRIP.id = 'dio-tabs-strip';
      STAGE = document.createElement('div'); STAGE.id = 'dio-tabs-stage';
      ROOT.appendChild(STRIP); ROOT.appendChild(STAGE);
      document.body.appendChild(ROOT);
      SHEET = document.createElement('div'); SHEET.id = 'dio-tabs-sheet'; SHEET.setAttribute('dir', 'rtl'); document.body.appendChild(SHEET);
      EXIT = document.createElement('div'); EXIT.id = 'dio-tabs-exit'; EXIT.setAttribute('dir', 'rtl'); document.body.appendChild(EXIT);
      STRIP.addEventListener('click', onStrip);
      STRIP.addEventListener('auxclick', function (e) { if (e.button !== 1) return; var tb = e.target.closest('.dio-tab'); if (tb) { e.preventDefault(); closeTab(tabById(tb.getAttribute('data-id'))); } });
      STRIP.addEventListener('mousedown', function (e) { if (e.button === 1 && e.target.closest('.dio-tab')) e.preventDefault(); });
      SHEET.addEventListener('click', onSheet);
      window.addEventListener('resize', function () { if (S.on) { if (mobile() && S.split.on) S.split.on = false; layout(); render(); } });
    }
    function onStrip(e) {
      var b = e.target.closest('[data-act]');
      if (b) {
        var a = b.getAttribute('data-act');
        if (a === 'back') return D.back();
        if (a === 'fwd') return D.forward();
        if (a === 'new') return D.newTab({ fg: true });
        if (a === 'split') return toggleSplit();
        if (a === 'sheet') return openSheet();
        if (a === 'close') { e.stopPropagation(); return closeTab(tabById(b.closest('.dio-tab').getAttribute('data-id'))); }
      }
      var tb = e.target.closest('.dio-tab');
      if (tb) activate(tabById(tb.getAttribute('data-id')));
    }
    function onSheet(e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var a = b.getAttribute('data-act'), id = b.getAttribute('data-id');
      if (a === 'new') { closeSheet(); D.newTab({ fg: true }); return; }
      if (a === 'hide') { closeSheet(); render(); return; }
      if (a === 'close') { e.stopPropagation(); closeTab(tabById(id)); renderSheet(); return; }
      if (a === 'open') { activate(tabById(id)); render(); }
    }
    function openSheet() { S.sheet = true; renderSheet(); guardTopUp(); }
    function closeSheet() { S.sheet = false; if (SHEET) SHEET.classList.remove('on'); }
    // عنوان · مقدمہ نمبر — ہر انگریزی / ہندسہ الگ رُخ میں، بیچ میں واضح فاصلہ (ضمنی 1 اور 701/26 آپس میں نہ ملیں)
    function title(e) { return bidi(e.t || '…') + (e.n ? '<span class="sep">&nbsp;·&nbsp;</span><bdi class="n">' + esc(e.n) + '</bdi>' : ''); }
    function render() {
      if (!STRIP || !S.on) return;
      var t = activeTab(), e = cur(t);
      var canBack = !!t, canFwd = !!(t && t.idx < t.entries.length - 1);
      if (mobile()) {
        STRIP.className = 'm';
        STRIP.innerHTML =
          '<button type="button" class="nb" data-act="back" title="واپس" aria-label="واپس">' + ICON.back + '</button>' +
          '<button type="button" class="nb' + (canFwd ? '' : ' off') + '" data-act="fwd" title="آگے" aria-label="آگے">' + ICON.fwd + '</button>' +
          '<div class="mtitle">' + (e ? title(e) : '') + (t && t.dirty ? ' <span class="dot" title="غیر محفوظ تبدیلی"></span>' : '') + '</div>' +
          '<button type="button" class="count" data-act="sheet" title="کھلی ٹیبیں" aria-label="کھلی ٹیبیں">' + S.tabs.length + '</button>' +
          '<button type="button" class="plus" data-act="new" title="نئی ٹیب" aria-label="نئی ٹیب">+</button>';
      } else {
        STRIP.className = '';
        STRIP.innerHTML =
          '<div class="nav"><button type="button" class="nb back" data-act="back" title="واپس (Alt+←)" aria-label="واپس">' + ICON.back + '<span>واپس</span></button>' +
          '<button type="button" class="nb' + (canFwd ? '' : ' off') + '" data-act="fwd" title="آگے (Alt+→)" aria-label="آگے">' + ICON.fwd + '</button></div>' +
          '<div class="tabs" role="tablist">' + S.tabs.map(function (tt) {
            var x = cur(tt) || {}, on = tt.id === S.active, two = S.split.on && S.split.other === tt.id;
            return '<div class="dio-tab' + (on ? ' on' : '') + (two ? ' split2' : '') + (tt.loading ? ' loading' : '') + '" role="tab" aria-selected="' + on + '" data-id="' + tt.id + '" title="' + esc((x.t || '') + (x.n ? ' ' + x.n : '')) + '">' +
              (ICON[x.ic] || ICON.doc) + '<span class="t">' + bidi(x.t || '…') + '</span>' + (x.n ? '<span class="sep">·</span><bdi class="n">' + esc(x.n) + '</bdi>' : '') +
              (tt.dirty ? '<span class="dot" title="غیر محفوظ تبدیلی (ضمنی / بیان کا خودکار مسودہ)"></span>' : '') +
              '<span class="x" data-act="close" role="button" title="ٹیب بند کریں (Alt+W)" aria-label="ٹیب بند کریں">✕</span></div>';
          }).join('') + '<button type="button" class="plus" data-act="new" title="نئی ٹیب (Alt+T)" aria-label="نئی ٹیب">+</button></div>' +
          '<div class="end"><button type="button" class="split-btn' + (S.split.on ? ' on' : '') + '" data-act="split" title="دو ٹیبیں ساتھ ساتھ">' + ICON.split + '<span>ساتھ ساتھ</span></button></div>';
      }
      if (S.sheet) renderSheet();
      var b0 = STRIP.querySelector('[data-act="back"]'); if (b0) b0.classList.toggle('off', !canBack);
    }
    D.render = render;
    function renderSheet() {
      if (!SHEET) return;
      SHEET.innerHTML = '<div class="hd"><span>کھلی ٹیبیں (<bdi>' + S.tabs.length + '</bdi>)</span><span class="sp"></span>' +
        '<button type="button" class="pri" data-act="new">+ نئی ٹیب</button><button type="button" data-act="hide">واپس</button></div><div class="list">' +
        S.tabs.map(function (t) {
          var e = cur(t) || {};
          var path = t.entries.slice(Math.max(0, t.idx - 2), t.idx + 1).map(function (x) { return x.t || ''; }).join(' ‹ ');
          return '<div class="card' + (t.id === S.active ? ' on' : '') + '" data-act="open" data-id="' + t.id + '"><div class="bd"><div class="tt">' + title(e) + '</div>' +
            '<div class="pth">' + bidi(path) + '</div>' + (t.dirty ? '<span class="uns">غیر محفوظ تبدیلی</span>' : '') + '</div>' +
            '<button type="button" class="cx" data-act="close" data-id="' + t.id + '" title="بند کریں" aria-label="بند کریں">✕</button></div>';
        }).join('') + '</div><div class="ft">ٹیب پر ٹیپ کریں تو وہی کھلے گی — بند صرف ✕ سے</div>';
      SHEET.classList.add('on');
    }
    // ── کون سی نقل کہاں دکھے ──
    function shownFid(t) {
      if (!t) return null;
      var e = cur(t);
      var ok = function (f) { return !!(f && S.frames[f] && S.frames[f].win); };
      if (e && ok(e.fid) && !e.pending) { t.shown = e.fid; return e.fid; }
      if (ok(t.shown)) return t.shown;                                 // نیا صفحہ بن رہا ہے — تب تک پچھلا
      return null;
    }
    function visibleFids() {
      var out = [], a = shownFid(activeTab());
      if (a) out.push(a);
      if (S.split.on) { var o = shownFid(tabById(S.split.other)); if (o) out.push(o); }
      return out;
    }
    function layout() {
      if (!STAGE) return;
      if (S.split.on && (!tabById(S.split.other) || S.split.other === S.active || mobile())) S.split.on = false;
      var a = shownFid(activeTab()), o = S.split.on ? shownFid(tabById(S.split.other)) : null;
      Object.keys(S.frames).forEach(function (f) {
        var r = S.frames[f], el = r.el, on = (f === a || f === o);
        el.classList.toggle('on', on);
        el.classList.toggle('focus', S.split.on && f === a);
        if (S.split.on && on) {
          var w = Math.round(S.split.ratio * 1000) / 10;
          if (f === a) { el.style.right = '0'; el.style.left = 'auto'; el.style.width = 'calc(' + w + '% - 3px)'; }
          else { el.style.left = '0'; el.style.right = 'auto'; el.style.width = 'calc(' + (100 - w) + '% - 3px)'; }
        } else { el.style.left = ''; el.style.right = ''; el.style.width = ''; }
        if (on) r.last = Date.now();
      });
      var dv = STAGE.querySelector('.dio-split-div');
      if (S.split.on) {
        if (!dv) { dv = document.createElement('div'); dv.className = 'dio-split-div'; STAGE.appendChild(dv); dragDivider(dv); }
        dv.style.right = 'calc(' + (Math.round(S.split.ratio * 1000) / 10) + '% - 3px)';
      } else if (dv) dv.remove();
      var ld = STAGE.querySelector('.dio-tabs-load');
      var t = activeTab();
      if (t && !a) {
        var ce = cur(t), cr = ce && ce.fid && S.frames[ce.fid], fail = !!(cr && cr.failed);
        if (!ld) { ld = document.createElement('div'); ld.className = 'dio-tabs-load'; STAGE.appendChild(ld); }
        if (ld.getAttribute('data-f') !== String(fail)) {
          ld.setAttribute('data-f', String(fail));
          ld.innerHTML = fail ? '<div>انٹرنیٹ نہیں — یہ ٹیب انٹرنیٹ آتے ہی خود کھل جائے گی</div><div>باقی ٹیبیں اور محفوظ کام اپنی جگہ موجود ہیں</div>'
            : '<div class="loading-spinner"></div><div>Digital IO کھل رہا ہے…</div>';
        }
      } else if (ld) ld.remove();
    }
    D.layout = layout;
    function toggleSplit() {
      if (mobile()) return;
      if (S.split.on) { S.split.on = false; layout(); render(); return; }
      var o = tabById(S.prevActive);
      if (!o || o.id === S.active) o = S.tabs.filter(function (t) { return t.id !== S.active; })[0];
      if (!o) { var keep = S.active; var nt = D.newTab({ fg: false }); if (!nt) return; o = nt; S.active = keep; }
      S.split.on = true; S.split.other = o.id;
      ensureFrame(o);
      layout(); render(); save();
    }
    D.toggleSplit = toggleSplit;
    // ساتھ ساتھ: جس خانے میں کام کریں وہی «فعال» ٹیب
    D._focusFrame = function (fid) {
      if (!S.split.on) return;
      var t = tabOfFid(fid); if (!t || t.id === S.active || t.id !== S.split.other) return;
      S.split.other = S.active; S.active = t.id; layout(); render();
    };
    function dragDivider(dv) {
      dv.addEventListener('pointerdown', function (e) {
        e.preventDefault(); dv.setPointerCapture(e.pointerId); STAGE.classList.add('dragging');
        var move = function (ev) {
          var r = STAGE.getBoundingClientRect();
          S.split.ratio = Math.min(0.8, Math.max(0.2, (r.right - ev.clientX) / r.width)); layout();
        };
        var up = function () { STAGE.classList.remove('dragging'); dv.removeEventListener('pointermove', move); dv.removeEventListener('pointerup', up); save(); };
        dv.addEventListener('pointermove', move); dv.addEventListener('pointerup', up);
      });
    }
  }
})();
