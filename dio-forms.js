/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — سسٹم کے فارم (خالی سانچے)  — dio-forms.js
   افسر کی ہدایت (اکتوبر 2026):
     «جو بھی فارم سسٹم نے اب تک بنائے ہیں یا آئندہ بنائے گا، خود بخود
      ٹمپلیٹس میں نام کے ساتھ شامل ہو جائے، اور سسٹم ان کی فہرست بھی دے۔
      تمام فارم قابلِ ترمیم ہوں اور بغیر ڈیٹا کے ہوں، لیکن کالم / قطار
      کے نام نہ ہٹیں۔»

   دو راستے:
     1) system-forms.js — سسٹم کے تمام موجودہ فارم، اصل ایپ ہی سے خالی
        مقدمے پر بنا کر محفوظ کیے گئے (tests/real-app/forms_build.py)۔
        نیا فارم کوڈ میں آئے تو یہی اسکرپٹ اسے بھی شامل کرتا ہے، اور
        tests/security.test.js ایسا فارم پکڑتا ہے جو فہرست میں نہ ہو۔
     2) خودکار — کوئی ایسی دستاویز کھلے جو فہرست میں نہیں، تو اس کا
        خاکہ (ڈیٹا ہٹا کر) اسی آلے پر «خودکار» فارم کے طور پر محفوظ۔

   DIO.forms.capture(el) → { html, wIn, hIn }:
     • صفحے کی نقل، ہر عنصر کا نظر آنے والا انداز (فونٹ، سائز، لکیریں،
       چوڑائی…) inline — تاکہ فارم ہر جگہ ویسا ہی دکھے اور چھپے۔
     • بٹن، ٹول بار، چھپے حصے، grips ہٹا دیے؛ خانوں (input) کی جگہ خالی خانہ۔
     • ڈیٹا ہٹانا: افسر/SHO/مقدمے کی معلوم قدریں، ہر تاریخ، شناختی کارڈ
       اور موبائل نمبر، اور [data-k] جیسے بھرنے کے خانے خالی۔
       لیبل، سرخیاں، کالم/قطار کے نام اپنی جگہ رہتے ہیں۔
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.DIO = window.DIO || {};

  // وراثتی (inherited) — صرف تب لکھیں جب والد سے مختلف ہوں
  var INH = ['font-family', 'font-size', 'font-weight', 'font-style', 'color', 'direction',
    'text-align', 'line-height', 'white-space', 'writing-mode', 'letter-spacing', 'word-spacing',
    'text-indent', 'border-collapse', 'border-spacing', 'text-orientation'];
  // غیر وراثتی — صرف تب جب اس tag کی عام قدر سے مختلف ہوں
  var NON = ['display', 'position', 'top', 'right', 'bottom', 'left', 'float', 'clear',
    'min-width', 'min-height', 'max-width', 'max-height',
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'border-top-width', 'border-top-style', 'border-top-color',
    'border-right-width', 'border-right-style', 'border-right-color',
    'border-bottom-width', 'border-bottom-style', 'border-bottom-color',
    'border-left-width', 'border-left-style', 'border-left-color',
    'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
    'table-layout', 'vertical-align', 'text-decoration-line', 'text-decoration-style',
    'text-decoration-thickness', 'text-underline-offset', 'unicode-bidi', 'transform', 'transform-origin',
    'background-color', 'box-sizing', 'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink',
    'flex-basis', 'justify-content', 'align-items', 'align-self', 'row-gap', 'column-gap',
    'grid-template-columns', 'grid-template-rows', 'grid-column-start', 'grid-column-end',
    'overflow-x', 'overflow-y', 'break-before', 'break-after', 'break-inside', 'opacity'];
  // ان tags کی چوڑائی/اونچائی ہمیشہ (جدول کے خانے اسی سے بنتے ہیں)
  var SIZE_TAGS = { TABLE: 1, COL: 1, COLGROUP: 1, TD: 1, TH: 1, TR: 1, IMG: 1, svg: 1, SVG: 1, CANVAS: 1 };
  // ہٹانے والی چیزیں (ایڈیٹنگ کے اوزار — کاغذ کا حصہ نہیں)
  var STRIP = 'script,style,link,meta,button,.no-print,[data-noprint],.colgrip,.rowgrip,[class*="grip"],' +
    '.dio-etb,.editor-toolbar,.doc-toolbar,.dio-modbtn,.zf-pick,input[type="file"],input[type="hidden"],' +
    '.dio-saved-box,#dio-saved-box,[id$="-chips"],.naq-chips,.dk-pick,.ch173-dd,[role="toolbar"]';

  // v560: فونٹ کا ناپ ہمیشہ pt میں (computed قدر px میں آتی ہے — وہی ناپ pt میں)
  function ptOf(v) {
    var m = /^(-?[\d.]+)px$/.exec(String(v || '').trim());
    if (!m) return v;
    return (Math.round(parseFloat(m[1]) * 0.75 * 10000) / 10000) + 'pt';
  }

  var _defaults = {};
  function defaultsFor(tag, sandbox) {
    if (_defaults[tag]) return _defaults[tag];
    var e;
    try { e = (tag === 'svg' || tag === 'SVG') ? document.createElementNS('http://www.w3.org/2000/svg', 'svg') : document.createElement(tag); }
    catch (_) { e = document.createElement('div'); }
    sandbox.appendChild(e);
    var cs = getComputedStyle(e), d = {};
    NON.forEach(function (p) { d[p] = cs.getPropertyValue(p); });
    sandbox.removeChild(e);
    _defaults[tag] = d;
    return d;
  }

  function isHidden(el) {
    try {
      var cs = getComputedStyle(el);
      return cs.display === 'none' || cs.visibility === 'hidden';
    } catch (_) { return false; }
  }

  // ── ڈیٹا ہٹانے کی قدریں ───────────────────────────────────────
  function collectStrings(obj, out, depth) {
    if (obj == null || depth > 3) return;
    if (typeof obj === 'string') {
      var s = obj.trim();
      if (s.length >= 3 && s.length < 400 && !/^[a-z_]+$/.test(s) && !/^https?:/.test(s)) out.push(s);
      return;
    }
    if (typeof obj === 'number') return;
    if (Array.isArray(obj)) { obj.forEach(function (x) { collectStrings(x, out, depth + 1); }); return; }
    if (typeof obj === 'object') {
      Object.keys(obj).forEach(function (k) {
        if (/^(id|.*_id|status|created_at|updated_at|type|accused_type|witness_type|report_type|role)$/.test(k)) return;
        collectStrings(obj[k], out, depth + 1);
      });
    }
  }

  function scrubValues(extra) {
    var vals = [];
    try {
      var o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
      ['full_name', 'designation', 'badge_number', 'station', 'district', 'cnic', 'phone', 'cell', 'email', 'belt_no']
        .forEach(function (k) { if (o[k]) vals.push(String(o[k]).trim()); });
    } catch (_) { /* افسر کا ریکارڈ نہ ہو */ }
    ['digital_io_sho', 'digital_io_dsp'].forEach(function (key) {
      try {
        var v = JSON.parse(localStorage.getItem(key) || 'null');
        if (v && typeof v === 'object') Object.keys(v).forEach(function (k) { if (v[k]) vals.push(String(v[k]).trim()); });
        else if (typeof v === 'string' && v) vals.push(v.trim());
      } catch (_) { /* storage بند */ }
    });
    // کھلے مقدمے اور اس کے ملزمان/گواہان کی قدریں (خودکار نقل کے وقت)
    // (let/const والے عالمی متغیر window پر نہیں ہوتے — اس لیے نام لے کر)
    var g = [];
    try { g.push(window._workspaceCase); } catch (_) { /* موجود نہیں */ }
    try { if (typeof _misalCase !== 'undefined') g.push(_misalCase); } catch (_) { /* موجود نہیں */ }
    try { if (typeof _r173Case !== 'undefined') g.push(_r173Case); } catch (_) { /* موجود نہیں */ }
    try { if (typeof _ch173Accused !== 'undefined') g.push(_ch173Accused); } catch (_) { /* موجود نہیں */ }
    try { if (typeof _ch173Witnesses !== 'undefined') g.push(_ch173Witnesses); } catch (_) { /* موجود نہیں */ }
    try { if (typeof _dkCase !== 'undefined') g.push(_dkCase); } catch (_) { /* موجود نہیں */ }
    try { if (typeof _dkAccused !== 'undefined') g.push(_dkAccused); } catch (_) { /* موجود نہیں */ }
    try { g.push(window._workspaceEv); } catch (_) { /* موجود نہیں */ }
    g.forEach(function (x) { collectStrings(x, vals, 0); });
    if (extra) collectStrings(extra, vals, 0);
    // انگریزی فارم (RFA وغیرہ) میں یہی قدریں انگریزی حروف میں بھی ہوتی ہیں
    try {
      if (typeof _rfaEn === 'function') {
        vals.slice().forEach(function (v) {
          try { var en = String(_rfaEn(v) || '').trim(); if (en && en !== v) vals.push(en); } catch (_) { /* ضمنی */ }
          v.split(/\s+/).forEach(function (w) {
            try { var e2 = String(_rfaEn(w) || '').trim(); if (e2.length >= 4 && /^[A-Za-z]/.test(e2)) vals.push(e2); } catch (_) { /* ضمنی */ }
          });
        });
      }
    } catch (_) { /* ضمنی */ }
    // لمبی قدریں پہلے (تاکہ چھوٹی قدر لمبی کا حصہ کاٹ کر باقی نہ چھوڑے)
    var seen = {};
    return vals.filter(function (v) { if (seen[v] || v.length < 2) return false; seen[v] = 1; return true; })
      .sort(function (a, b) { return b.length - a.length; });
  }

  var DATE_RX = /\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b|\b\d{4}-\d{2}-\d{2}(?:T[\d:.]+Z?)?\b/g;
  var CNIC_RX = /\b\d{5}-\d{7}-\d\b/g;
  var CELL_RX = /\b0\d{3}-\d{7}\b|\b03\d{9}\b/g;
  var TIME_RX = /\b\d{1,2}:\d{2}\s?(?:am|pm|AM|PM)?\b/g;
  var GEO_RX = /-?\d{1,3}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,}/g;     // GPS (Lat/Long)
  var YEAR_RX = /\b20\d{2}\b/g;                                       // سال (مثلاً ضمنی کا سال)
  function escRx(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function scrubText(root, values) {
    var rxs = values.map(function (v) { return new RegExp(escRx(v), 'g'); });
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n, list = [];
    while ((n = w.nextNode())) list.push(n);
    list.forEach(function (t) {
      var s = t.nodeValue, o = s;
      rxs.forEach(function (rx) { s = s.replace(rx, ''); });
      s = s.replace(DATE_RX, '').replace(GEO_RX, '').replace(CNIC_RX, '').replace(CELL_RX, '').replace(TIME_RX, '').replace(YEAR_RX, '');
      if (s !== o) t.nodeValue = s;
    });
  }

  // ── نقل + inline انداز ───────────────────────────────────────
  function capture(el, opts) {
    opts = opts || {};
    if (!el) return null;
    var sandbox = document.createElement('div');
    sandbox.style.cssText = 'position:absolute;left:-99999px;top:0;all:initial;';
    document.body.appendChild(sandbox);
    var rootRect = el.getBoundingClientRect();
    var rootCs = getComputedStyle(el);
    // دکھانے والا scale/transform ہٹا کر اصل ناپ
    var scale = 1;
    try {
      if (rootCs.transform && rootCs.transform !== 'none' && el.offsetWidth) scale = rootRect.width / el.offsetWidth;
    } catch (_) { scale = 1; }

    function walk(src, parentCs, isRoot) {
      if (src.nodeType === 3) return document.createTextNode(src.nodeValue);
      if (src.nodeType !== 1) return null;
      var tag = src.tagName;
      if (!isRoot) {
        try { if (src.matches(STRIP)) return null; } catch (_) { /* غلط selector */ }
        if (isHidden(src)) return null;
      }
      var cs = getComputedStyle(src);
      var out;
      // خانے (input/select/textarea) → خالی خانہ، وہی ناپ اور لکیر
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        if (src.type === 'checkbox' || src.type === 'radio') {
          out = document.createElement('span');
          out.textContent = (opts.keepData && src.checked) ? '☑' : '☐';
        } else {
          out = document.createElement('span');
          out.className = 'dio-f-field';
          var val = '';
          if (opts.keepData) {
            try { val = (tag === 'SELECT') ? ((src.options[src.selectedIndex] || {}).text || '') : (src.value || ''); } catch (_) { val = ''; }
          }
          if (val) out.textContent = val; else out.innerHTML = '&nbsp;';
          out.setAttribute('style', 'display:inline-block;width:' + src.getBoundingClientRect().width / scale + 'px;' +
            'min-height:1.4em;border-bottom:1px dotted #000;vertical-align:bottom;');
          return out;
        }
      } else if (src.namespaceURI === 'http://www.w3.org/2000/svg') {
        out = src.cloneNode(true);    // نقشہ/شکلیں جوں کی توں
        return out;
      } else if (tag === 'CANVAS') {
        out = document.createElement('img');
        try { out.src = src.toDataURL('image/png'); } catch (_) { return null; }
      } else {
        out = document.createElement(tag === 'FONT' ? 'span' : tag);
        ['colspan', 'rowspan', 'dir', 'lang', 'src', 'alt', 'width', 'height', 'span', 'data-mso-rot'].forEach(function (a) {
          if (src.hasAttribute(a)) out.setAttribute(a, src.getAttribute(a));
        });
      }
      // انداز
      var decl = [];
      INH.forEach(function (p) {
        var v = cs.getPropertyValue(p);
        if (isRoot || !parentCs || parentCs.getPropertyValue(p) !== v) decl.push(p + ':' + (p === 'font-size' ? ptOf(v) : v));
      });
      var d = defaultsFor(tag, sandbox);
      NON.forEach(function (p) {
        var v = cs.getPropertyValue(p);
        if (isRoot && (p === 'transform' || p.indexOf('margin') === 0 || p === 'position' || p === 'top' || p === 'left' || p === 'right' || p === 'bottom')) return;
        if (v !== d[p]) decl.push(p + ':' + v);
      });
      var styleW = src.style && (src.style.width || src.style.height);
      if (SIZE_TAGS[tag] || styleW || isRoot) {
        var r = src.getBoundingClientRect();
        if (tag === 'COL' || tag === 'COLGROUP') {
          if (cs.width && cs.width !== 'auto') decl.push('width:' + cs.width);
        } else if (r.width) {
          // ناپ بیرونی (border-box) ہے — اسی حساب سے، ورنہ padding دوبارہ جڑ کر کاغذ چوڑا ہو جاتا ہے
          decl = decl.filter(function (x) { return x.indexOf('box-sizing:') !== 0; });
          decl.push('box-sizing:border-box');
          decl.push('width:' + (r.width / scale).toFixed(1) + 'px');
          if (!isRoot && tag !== 'TABLE' && tag !== 'TR') decl.push('height:' + (r.height / scale).toFixed(1) + 'px');
        }
      }
      // اسکرین پر لکھنے کے خانوں کا ہلکا رنگین پس منظر کاغذ کا حصہ نہیں (صرف سفید/سیاہ/خاکستری رہیں)
      if (!opts.keepData) decl = decl.filter(function (x) {
        if (x.indexOf('background-color:') !== 0) return true;
        var m = x.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
        if (!m) return true;
        if (m[4] !== undefined && +m[4] === 0) return false;
        var r = +m[1], gg = +m[2], bb = +m[3];
        return (Math.max(r, gg, bb) - Math.min(r, gg, bb)) <= 12;
      });
      if (decl.length) out.setAttribute('style', decl.join(';'));
      // بچے
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT' && tag !== 'CANVAS' && tag !== 'IMG') {
        for (var c = src.firstChild; c; c = c.nextSibling) {
          var k = walk(c, cs, false);
          if (k) out.appendChild(k);
        }
      }
      // بھرنے کے خانے ([data-k]) — اندر کا ڈیٹا خالی (لیبل الگ عناصر میں ہوتے ہیں)
      if (!isRoot && !opts.keepData && src.hasAttribute && src.hasAttribute('data-k') && opts.clearDataK !== false) {
        out.innerHTML = '&nbsp;';
      }
      return out;
    }

    var clone;
    try { clone = walk(el, null, true); }
    finally { sandbox.remove(); }
    if (!clone) return null;
    clone.removeAttribute('id');
    clone.classList && clone.classList.add('dio-form-paper');
    if (!opts.keepData) scrubText(clone, scrubValues(opts.extra));
    // root کا ناپ: کاغذ کی چوڑائی (انچ)
    var wPx = el.offsetWidth || (rootRect.width / scale);
    var hPx = Math.max(el.scrollHeight || 0, el.offsetHeight || 0);
    return { html: clone.outerHTML, wIn: +(wPx / 96).toFixed(2), hIn: +(hPx / 96).toFixed(2) };
  }

  // ── کھلی دستاویز میں «کاغذ» کون سا ہے ─────────────────────────
  var PAPER_IDS = ['ch173-doc', 'dk-doc', 'saza-doc', 'dio-naqsha-doc', 'cdr-doc', 'idx-paper', 'ir-doc',
    'gl-doc', 'rfa-doc', 'cro-doc', 'zf-doc', 'za-doc', 'misal-editor'];
  function findPaper(scope) {
    if (typeof scope === 'string') return document.querySelector(scope);
    scope = scope || document.getElementById('dio-docview') || document.getElementById('page-content') || document.body;
    for (var i = 0; i < PAPER_IDS.length; i++) {
      var e = scope.querySelector('#' + PAPER_IDS[i]);
      // کاغذ کی چوڑائی (A4/Legal ≈ 8–9 انچ)؛ پوری اسکرین جتنا چوڑا = فہرست/خالی صفحہ، فارم نہیں
      if (e && !isHidden(e)) { var w = e.getBoundingClientRect().width; if (w > 300 && w <= 1100) return e; }
    }
    // ورنہ: سب سے بڑا سفید، کاغذ نما عنصر
    var best = null, area = 0;
    scope.querySelectorAll('div,section,article,table').forEach(function (e) {
      var r = e.getBoundingClientRect();
      if (r.width < 500 || r.width > 1100 || r.height < 300) return;
      var bg = getComputedStyle(e).backgroundColor;
      if (!/rgb\(255, 255, 255\)/.test(bg)) return;
      if (e.id === 'dio-dv-picker') return;
      if (r.width * r.height > area) { area = r.width * r.height; best = e; }
    });
    return best;
  }

  // ── خودکار: فہرست سے باہر کی دستاویز ───────────────────────────
  var AUTO_KEY = 'dio_forms_auto_v1';
  function autoList() {
    try { return JSON.parse(localStorage.getItem(AUTO_KEY) || '[]') || []; } catch (_) { return []; }
  }
  function autoSave(list) {
    try { localStorage.setItem(AUTO_KEY, JSON.stringify(list)); return true; } catch (_) { return false; }
  }
  function currentFormKey(docId) {
    var key = docId, name = (typeof _dioDocName === 'function') ? _dioDocName(docId) : docId;
    try {
      if (docId === 'r173:tatima_challan' && typeof _r173Subtype !== 'undefined') {
        key += ':' + _r173Subtype;
        var s = (typeof R173_TATIMA_SUBS !== 'undefined') ? R173_TATIMA_SUBS.find(function (x) { return x.id === _r173Subtype; }) : null;
        if (s) name += ' — ' + s.name;
      }
      if (docId === 'darkhwastain' && typeof _dkType !== 'undefined' && document.getElementById('dk-doc')) {
        key = 'dk:' + _dkType;
        var t = (typeof DK_TYPES !== 'undefined') ? DK_TYPES.find(function (x) { return x.id === _dkType; }) : null;
        if (t) name = t.name.replace(/\s{2,}/g, ' … ');
      }
    } catch (_) { /* حالت دستیاب نہیں */ }
    return { key: key, name: name };
  }
  function systemHas(key) {
    var L = window.DIO_SYSTEM_FORMS || [];
    for (var i = 0; i < L.length; i++) if (L[i].id === key) return true;
    return false;
  }
  function maybeAutoCapture(docId) {
    if (!docId || docId === 'r173:list') return;
    var ensure = (typeof window.dioLoadScript === 'function') ? window.dioLoadScript('system-forms.js') : Promise.resolve();
    Promise.resolve(ensure).then(function () {
      setTimeout(function () {
        try {
          var k = currentFormKey(docId);
          if (systemHas(k.key)) return;
          var list = autoList();
          if (list.some(function (x) { return x.id === k.key; })) return;
          var paper = findPaper();
          if (!paper) return;
          var cap = capture(paper);
          if (!cap || cap.html.length < 200) return;
          list.push({ id: k.key, name: k.name, group: 'خودکار شامل شدہ', html: cap.html, wIn: cap.wIn, hIn: cap.hIn,
            auto: true, at: new Date().toISOString() });
          if (autoSave(list) && typeof showToast === 'function') {
            showToast('نیا فارم «' + k.name + '» خالی سانچے کے طور پر ٹمپلیٹس میں شامل ہو گیا', 'info', 4000);
          }
        } catch (_) { /* خودکار نقل ضمنی کام ہے — اصل کام نہ رکے */ }
      }, 2500);
    });
  }

  // دستاویز کھلنے کے راستے پر نظر (doc-viewer.js)
  function hookDocViewer() {
    if (typeof window._dioRenderTabContent !== 'function' && typeof _dioRenderTabContent !== 'function') return false;
    var orig = window._dioRenderTabContent || _dioRenderTabContent;
    if (orig._dioFormsHooked) return true;
    var wrapped = function (docId) {
      var r = orig.apply(this, arguments);
      try { maybeAutoCapture(docId); } catch (_) { /* ضمنی */ }
      return r;
    };
    wrapped._dioFormsHooked = true;
    window._dioRenderTabContent = wrapped;
    try { _dioRenderTabContent = wrapped; } catch (_) { /* function declaration نہ بدلے */ }
    var origOpen = window._dioOpenDocTab;
    if (typeof origOpen === 'function' && !origOpen._dioFormsHooked) {
      var w2 = function (docId) { var r = origOpen.apply(this, arguments); try { maybeAutoCapture(docId); } catch (_) { /* ضمنی */ } return r; };
      w2._dioFormsHooked = true;
      window._dioOpenDocTab = w2;
      try { _dioOpenDocTab = w2; } catch (_) { /* ضمنی */ }
    }
    return true;
  }
  (function wait(n) {
    if (hookDocViewer() || n > 300) return;
    setTimeout(function () { wait(n + 1); }, 200);
  })(0);

  // ── اکٹھی فہرست: سسٹم + خودکار ──────────────────────────────
  function all() {
    var sys = (window.DIO_SYSTEM_FORMS || []).map(function (f) { return f; });
    return sys.concat(autoList());
  }
  function removeAuto(id) {
    autoSave(autoList().filter(function (x) { return x.id !== id; }));
  }

  window.DIO.forms = {
    capture: capture, findPaper: findPaper, scrubValues: scrubValues,
    all: all, autoList: autoList, removeAuto: removeAuto, currentFormKey: currentFormKey,
    maybeAutoCapture: maybeAutoCapture
  };
})();
