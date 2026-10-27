/* ═══════════════════════════════════════════════════════════════════
   DIGITAL IO — MS Word جیسی کلیدیں، پورے سسٹم میں (بغیر کسی ٹول بار کے)
   dio-keys.js  (v553 — افسر کا قاعدہ)
   «پورے سسٹم میں MS Word کی طرح auto select، select all (Ctrl+A)، copy (Ctrl+C)،
    paste (Ctrl+V)، cut (Ctrl+X)، bold (Ctrl+B)، italic (Ctrl+I)، underline (Ctrl+U)،
    move، enter، tab، replace / replace all (Ctrl+H)، find (Ctrl+F)، font size
    (Ctrl + / −)، save (Ctrl+S) وغیرہ لاگو ہوں گے — چھپے ہوئے، کوئی ٹول بار نہیں؛
    کسی بھی متن پر کہیں بھی، اور محفوظ کرنے پر ترمیم کے مطابق محفوظ ہوں۔»

   • یہ فائل ہمیشہ لوڈ ہوتی ہے (index.html)۔ جو دستاویز اپنی کوئی کلید خود سنبھالتی
     ہے (e.defaultPrevented) اُس میں دخل نہیں — یہ صرف باقی جگہوں کو پورا کرتی ہے۔
   • Ctrl+A / C / V / X / Z / Y، Enter، متن کو کھینچ کر ہٹانا (move) اور دو کلک سے لفظ
     منتخب کرنا براؤزر کا اپنا کام ہے — یہاں انہیں روکا نہیں جاتا (ہر جگہ چلتے ہیں)۔
   • Ctrl+B / I / U، Tab، Ctrl + / −: لکھنے والے خانے (contenteditable) میں
   • Ctrl+H / Ctrl+F: ڈھونڈیں اور بدلیں / سب بدلیں (editor-tools.js کا پینل)
   • Ctrl+S: جو فارم/دستاویز کھلی ہو وہی محفوظ/اپ ڈیٹ — براؤزر کا «صفحہ محفوظ کریں» نہیں
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__dioKeys) return;
  window.__dioKeys = true;
  // zimni.js کا پرانا Ctrl+S سننے والا اب نہ لگے — اُس کا سارا کام یہیں (ایک ہی جگہ)
  window._dioCtrlSBound = true;

  const toast = (m, t) => { try { if (typeof showToast === 'function') showToast(m, t || 'info'); } catch (_) { /* پیغام ضمنی */ } };
  const visible = (el) => {
    if (!el || !el.isConnected) return false;
    if (!el.getClientRects().length) return false;
    try { const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') return false; } catch (_) { /* ضمنی */ }
    return true;
  };
  // جس لکھنے والے خانے میں کرسر ہے (contenteditable کا میزبان)
  function editHost() {
    let n = document.activeElement;
    if (n && n.isContentEditable) {
      while (n.parentElement && n.parentElement.isContentEditable) n = n.parentElement;
      return n;
    }
    try {
      const s = window.getSelection();
      n = s && s.anchorNode;
      if (n && n.nodeType !== 1) n = n.parentElement;
      if (n && n.isContentEditable) {
        while (n.parentElement && n.parentElement.isContentEditable) n = n.parentElement;
        return n;
      }
    } catch (_) { /* ضمنی */ }
    return null;
  }
  const isField = (el) => el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName || '');
  async function need(src) {
    try { if (typeof window.dioLoadScript === 'function') await window.dioLoadScript(src); } catch (_) { /* لوڈ نہ ہو سکے */ }
  }
  const markDirty = (el) => { try { if (el) el.dispatchEvent(new Event('input', { bubbles: true })); } catch (_) { /* ضمنی */ } };

  // ── Ctrl+S — کھلی چیز محفوظ ──────────────────────────────────────
  function btnText(b) { return ((b.textContent || '') + ' ' + (b.getAttribute('title') || '')).replace(/\s+/g, ' '); }
  const SAVE_RE = /محفوظ|اپ ڈیٹ|\bSave\b/i;
  const NOT_SAVE_RE = /غیر محفوظ|محفوظ شدہ|محفوظ فہرست|فہرست/;
  function findSaveIn(root) {
    if (!root) return null;
    const list = [].slice.call(root.querySelectorAll('button, [role="button"], a.btn')).filter(b =>
      !b.disabled && visible(b) && SAVE_RE.test(btnText(b)) && !NOT_SAVE_RE.test(b.textContent || ''));
    // واضح نشان پہلے
    return list.find(b => b.hasAttribute('data-dio-save')) || list.find(b => /btn-primary|naq-save|dio-dv-save/.test(b.className + ' ' + b.id)) || list[0] || null;
  }
  function saveNow() {
    // 1) سب سے اوپر کھلا کارڈ (نیا اندراج / ترمیم)
    const mb = document.getElementById('modal-backdrop');
    if (mb && visible(mb) && mb.style.display !== 'none') {
      const b = findSaveIn(mb.querySelector('.modal-card') || mb);
      if (b) { b.click(); return true; }
    }
    // 2) چالان / ضمنی / اندرونی ضمنی (ایک ہی #ch173-doc)
    try {
      const doc = (typeof _ch173Doc === 'function') ? _ch173Doc() : document.getElementById('ch173-doc');
      if (doc && visible(doc)) {
        if (doc.querySelector('.zfa-tbl') && typeof window._saveZimniA === 'function') { window._saveZimniA(false, true); return true; }
        if (doc.querySelector('.zf-tbl') && typeof window._saveZimni === 'function') { window._saveZimni(false, true); return true; }
        if (typeof window._saveR173 === 'function') { window._saveR173(); return true; }
      }
    } catch (_) { /* اگلا راستہ */ }
    // 3) نقشہ موقع
    if (document.getElementById('dio-naqsha-doc') && typeof window.naqSaveNow === 'function') { window.naqSaveNow(); return true; }
    // 4) پورے صفحے والی دستاویز کی پٹی کا «محفوظ»
    const dv = document.getElementById('dio-dv-save');
    if (dv && visible(dv) && typeof window._dioSaveCurrent === 'function') { window._dioSaveCurrent(); return true; }
    // 5) کھلی دستاویز کے اندر کا «محفوظ»، ورنہ صفحے کا
    const b = findSaveIn(document.getElementById('dio-dv-body')) || findSaveIn(document.getElementById('page-content'));
    if (b) { b.click(); return true; }
    return false;
  }
  window.dioSaveNow = saveNow;

  // ── Ctrl + / − — فونٹ (دستاویز کا اپنا نظام پہلے) ──────────────────
  async function fontStep(dir, host) {
    const inCh = host && host.closest && host.closest('#ch173-doc');
    const inDk = host && host.closest && host.closest('#dk-doc');
    const sel = window.getSelection();
    const hasSel = sel && !sel.isCollapsed;
    if (inCh) {
      // چنا ہوا متن → اسی کا سائز (pt کی MS Word فہرست)؛ ورنہ پوری دستاویز
      if (hasSel && typeof window._ch173FontToSelection === 'function' && typeof R173_FONT_SIZES !== 'undefined') {
        let cur = 14;
        try { const a = sel.anchorNode; const el = a && (a.nodeType === 1 ? a : a.parentElement); cur = Math.round(parseFloat(getComputedStyle(el).fontSize) * 0.75 * 2) / 2; } catch (_) { /* پہلے سے طے */ }
        const L = R173_FONT_SIZES;
        let next = dir > 0 ? L.find(x => x > cur) : [].concat(L).reverse().find(x => x < cur);
        if (!next) next = dir > 0 ? L[L.length - 1] : L[0];
        if (window._ch173FontToSelection(next)) { markDirty(host); return true; }
      }
      if (typeof window._ch173FontStep === 'function') { window._ch173FontStep(dir); return true; }
    }
    if (inDk && typeof window._dkFontStep === 'function') { window._dkFontStep(dir); return true; }
    if (typeof window.dioFontStep !== 'function') await need('editor-tools.js');
    if (typeof window.dioFontStep === 'function') { window.dioFontStep(dir); markDirty(host); return true; }
    return false;
  }

  // ── Ctrl+H / Ctrl+F — ڈھونڈیں اور بدلیں ─────────────────────────────
  async function findReplace() {
    if (typeof window.dioFindReplace !== 'function') await need('editor-tools.js');
    if (typeof window.dioFindReplace === 'function') { window.dioFindReplace(); return true; }
    return false;
  }
  // صفحے پر کوئی لکھنے والی دستاویز کھلی ہے؟ (Ctrl+F کو براؤزر کی تلاش سے روکنے کے لیے)
  function docOpen() {
    const c = document.querySelector('#dio-dv-body [contenteditable="true"], #page-content [contenteditable="true"], #modal-body [contenteditable="true"]');
    return !!(c && visible(c));
  }

  function onKey(e) {
    if (e.defaultPrevented || e.isComposing) return;
    const ctrl = e.ctrlKey || e.metaKey;
    const k = String(e.key || '');
    const kl = k.toLowerCase();
    const host = editHost();
    const ae = document.activeElement;

    // Ctrl+S
    if (ctrl && !e.altKey && !e.shiftKey && kl === 's') {
      e.preventDefault();
      if (!saveNow()) toast('ℹ️ اس صفحے پر محفوظ کرنے کو کچھ نہیں — اندراج کھول کر Ctrl+S دبائیں');
      return;
    }
    // Ctrl+H / Ctrl+F (editor-tools.js لوڈ ہو تو وہی پہلے سنبھال لیتی ہے)
    if (ctrl && !e.altKey && (kl === 'h' || kl === 'f')) {
      if (host || isField(ae) || docOpen()) { e.preventDefault(); findReplace(); }
      return;
    }
    // Ctrl + / − (براؤزر کا zoom نہیں — صرف لکھنے والے خانے میں)
    if (ctrl && !e.altKey && host && (k === '+' || k === '=' || k === '-' || k === '_' || e.code === 'NumpadAdd' || e.code === 'NumpadSubtract')) {
      e.preventDefault();
      fontStep((k === '-' || k === '_' || e.code === 'NumpadSubtract') ? -1 : 1, host);
      return;
    }
    if (!host) return;                                   // باقی صرف دستاویز کے متن میں
    // Ctrl+B / I / U
    if (ctrl && !e.altKey && !e.shiftKey && (kl === 'b' || kl === 'i' || kl === 'u')) {
      e.preventDefault();
      try { document.execCommand('styleWithCSS', false, false); } catch (_) { /* ضمنی */ }
      try { document.execCommand(kl === 'b' ? 'bold' : kl === 'i' ? 'italic' : 'underline', false, null); } catch (_) { /* ضمنی */ }
      markDirty(host);
      return;
    }
    // Tab → خالی جگہ؛ Shift+Tab → واپس (MS Word کی طرح — توجہ اگلے خانے پر نہ جائے)
    //   (صرف متن کے بڑے خانے میں؛ ایک سطر والے چھوٹے خانوں — مثلاً نقشے کے سرنامے — میں
    //    Tab پہلے کی طرح اگلے خانے پر جاتا ہے)
    let blockHost = true;
    try { blockHost = !/^inline/.test(getComputedStyle(host).display) && !host.hasAttribute('data-tab-move'); } catch (_) { /* ضمنی */ }
    if (k === 'Tab' && !ctrl && !e.altKey && blockHost) {
      e.preventDefault();
      try {
        if (e.shiftKey) document.execCommand('outdent', false, null);
        else if (!document.execCommand('insertText', false, '     ')) document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
      } catch (_) { /* ضمنی */ }
      markDirty(host);
    }
  }
  window.addEventListener('keydown', onKey, false);
  window.dioKeys = { saveNow: saveNow, fontStep: fontStep, findReplace: findReplace };
})();
