/* ═══════════════════════════════════════════════════════════════════
   DIGITAL IO — فہرستوں میں تیر کی کلید سے انتخاب (v581)
   dio-listnav.js — افسر کا حکم (4 نومبر 2026، TASK 22 کے ساتھ الگ کام؛ 12 نومبر 2026: «اس کو بھی مکمل کر دیں»)

   فہرستیں: مقدمات (میرے مقدمات / ہر صورتحال)، بیرونی ضمنیات، اندرونی ضمنیات (بیانات 161 ض ف)
   • ↓ / ↑  اگلی / پچھلی قطار — پہلا ↓ = پہلی قطار، پہلا ↑ = آخری قطار؛ آخری قطار پر ↓ وہیں رکتا ہے
   • Home / End  پہلی / آخری قطار (جب کوئی قطار منتخب ہو)
   • Enter  منتخب قطار کھولیں — اسی ٹیب میں (وہی جو «کھولیں» / «ترمیم» بٹن)
   • Ctrl+Enter  نئی ٹیب میں (پیچھے)، Ctrl+Shift+Enter نئی ٹیب سامنے — TASK 22 کا اپنا قاعدہ (dio-tabs.js)
   • Esc  انتخاب ختم
   • مقدمات کی تلاش کے خانے سے ↓ سیدھا پہلی قطار؛ پہلی قطار سے ↑ واپس تلاش میں
   انتخاب = اس قطار کے «کھولیں / ترمیم» بٹن پر focus (اسی لیے Enter اور Ctrl+Enter وہی کرتے ہیں جو وہ بٹن)
   + قطار نمایاں۔ لکھتے وقت (کسی بھی لکھنے کے خانے / دستاویز میں) تیر کی کلیدیں اپنا عام کام کرتی ہیں۔
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__dioListNav) return;
  window.__dioListNav = true;

  // قطار → کھولنے والا بٹن (اسی کا onclick اسی ٹیب / نئی ٹیب میں کھولتا ہے)
  var LISTS = [
    { rows: '#cs-rows > tr', open: 'button[data-act="open"]', search: '#case-search' },
    { rows: '.zt-wrap table.zt > tbody > tr, .zat-wrap table.zt > tbody > tr', open: 'button[data-act="edit"]' }
  ];
  var SEL = 'dio-ln-sel';

  function vis(el) {
    if (!el || !el.isConnected || !el.getClientRects().length) return false;
    try { var cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') return false; } catch (_) { /* ضمنی */ }
    return true;
  }
  function editable(el) { return !!(el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName || ''))); }
  // کوئی کھڑکی / کارڈ / مینو اوپر کھلا ہو تو فہرست کی کلیدیں نہیں
  var OVER = '#modal-backdrop, .modal-overlay, #dio-msearch, #dio-keys-help, #dio-fr-panel, #dio-dv-picker, #dio-cctx';
  function overlayOpen() {
    try {
      var o = document.querySelectorAll(OVER);
      for (var i = 0; i < o.length; i++) if (vis(o[i])) return true;
    } catch (_) { /* ضمنی */ }
    return false;
  }
  function active() {
    if (overlayOpen()) return null;
    for (var i = 0; i < LISTS.length; i++) {
      var L = LISTS[i], rs = [];
      var all = document.querySelectorAll(L.rows);
      for (var j = 0; j < all.length; j++) { var b = all[j].querySelector(L.open); if (b && vis(all[j]) && vis(b) && !b.disabled) rs.push(all[j]); }
      if (rs.length) return { L: L, rows: rs };
    }
    return null;
  }
  function clear() {
    var o = document.querySelectorAll('tr.' + SEL);
    for (var i = 0; i < o.length; i++) { o[i].classList.remove(SEL); o[i].removeAttribute('aria-selected'); }
  }
  function pick(A, r) {
    clear();
    r.classList.add(SEL); r.setAttribute('aria-selected', 'true');
    var b = r.querySelector(A.L.open);
    try { b.focus({ preventScroll: true }); } catch (_) { try { b.focus(); } catch (__) { /* ضمنی */ } }
    try { r.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (_) { /* ضمنی */ }
    keep = b.getAttribute('onclick') || ''; watch();
  }

  // فہرست پیچھے سے تازہ ہو (سرور سے نیا ڈیٹا، سنک) تو وہی قطار دوبارہ منتخب — انتخاب گم نہ ہو
  var keep = null, mo = null, raf = 0;
  function watch() {
    if (mo || typeof MutationObserver === 'undefined' || !document.body) return;
    mo = new MutationObserver(function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; restore(); }); });
    mo.observe(document.body, { childList: true, subtree: true });
  }
  function drop() { keep = null; if (mo) { mo.disconnect(); mo = null; } clear(); }
  function restore() {
    if (!keep) return;
    var r0 = document.querySelector('tr.' + SEL), ae = document.activeElement;
    if (r0 && r0.contains(ae)) return;                               // ابھی بھی وہیں
    if (ae && ae !== document.body && ae !== document.documentElement) { drop(); return; }   // افسر کسی اور جگہ
    var A = active(); if (!A) { drop(); return; }                    // فہرست نہیں رہی (کچھ کھل گیا)
    for (var i = 0; i < A.rows.length; i++) {
      var b = A.rows[i].querySelector(A.L.open);
      if (b && (b.getAttribute('onclick') || '') === keep) { pick(A, A.rows[i]); return; }
    }
    drop();                                                          // وہ قطار اب نہیں (حذف / فلٹر)
  }
  function css() {
    if (document.getElementById('dio-listnav-css')) return;
    var st = document.createElement('style'); st.id = 'dio-listnav-css';
    st.textContent =
      'tr.' + SEL + '{outline:2px solid var(--accent,#2563eb);outline-offset:-2px;}' +
      'tr.' + SEL + ' > td{background:rgba(56,189,248,.16) !important;background:color-mix(in srgb,var(--accent,#2563eb) 16%,transparent) !important;}' +
      '@media print{tr.' + SEL + '{outline:none;} tr.' + SEL + ' > td{background:none !important;}}';
    (document.head || document.documentElement).appendChild(st);
  }

  function onKey(e) {
    if (!e || e.defaultPrevented || e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;   // Ctrl+Enter → dio-tabs.js
    var k = e.key;
    if (k !== 'ArrowDown' && k !== 'ArrowUp' && k !== 'Home' && k !== 'End' && k !== 'Escape') return;
    var A = active(); if (!A) return;
    var ae = document.activeElement, rows = A.rows, n = rows.length, i = -1;
    for (var j = 0; j < n; j++) { if (ae && rows[j].contains(ae)) { i = j; break; } }
    var inSearch = !!(A.L.search && ae && ae.matches && ae.matches(A.L.search));
    if (i < 0 && !inSearch && editable(ae)) return;                 // لکھنے کے خانے میں — تیر اپنا عام کام
    if (k === 'Escape') { if (i >= 0) { drop(); try { ae.blur(); } catch (_) { /* ضمنی */ } } return; }
    if ((k === 'Home' || k === 'End') && i < 0) return;            // کچھ منتخب نہیں: صفحہ اوپر / نیچے (براؤزر کا اپنا)
    var to;
    if (k === 'ArrowDown') to = (i < 0) ? 0 : Math.min(i + 1, n - 1);
    else if (k === 'ArrowUp') {
      if (inSearch) return;
      if (i === 0 && A.L.search) {
        var s = document.querySelector(A.L.search);
        if (s && vis(s)) { e.preventDefault(); drop(); try { s.focus(); } catch (_) { /* ضمنی */ } return; }
      }
      to = (i < 0) ? n - 1 : Math.max(i - 1, 0);
    }
    else if (k === 'Home') to = 0;
    else to = n - 1;
    e.preventDefault();
    css();
    pick(A, rows[to]);
  }
  window.addEventListener('keydown', onKey, false);
  // ماؤس / انگلی سے کہیں اور گئے یا focus قطار سے باہر — انتخاب کا نشان ختم
  document.addEventListener('focusin', function (e) {
    var t = e.target, r = document.querySelector('tr.' + SEL);
    if ((r || keep) && !(r && t && r.contains(t))) drop();
  }, true);
  document.addEventListener('pointerdown', function (e) {
    var r = document.querySelector('tr.' + SEL);
    if ((r || keep) && !(r && e.target && r.contains(e.target))) drop();
  }, true);
  window.dioListNav = { active: active, clear: drop };
})();
