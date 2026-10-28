/* ═══════════════════════════════════════════════════════════════════
   DIGITAL IO — MS Word کی کلیدیں: پورے سسٹم کا ایک ہی سننے والا
   dio-keys.js  (v563 — افسر کا قاعدہ، 28 اکتوبر 2026)

   «MS Word کی تمام عام کلیدیں سسٹم میں ہر جگہ کام کریں — Ctrl+S براؤزر کی HTML فائل نہیں،
    کام محفوظ کرے؛ Tab بالکل MS Word کی طرح۔»

   • ایک ہی سننے والا: window پر capture مرحلہ — ہر دستاویز، کارڈ اور صفحے سے پہلے یہی سنتا ہے۔
     جو کلید یہ سنبھالے اُس پر preventDefault + stopImmediatePropagation — نہ براؤزر کا اپنا کام،
     نہ کسی ماڈیول کا پرانا دوہرا کام۔
   • کلید کی پہچان کی بورڈ کی اصل کلید (event.code) سے — اردو کی بورڈ، فونیٹک / IME («Process»)
     ہر صورت ایک جیسی۔ لاطینی کی بورڈ پر حرف وہی جو کی بورڈ لکھے (MS Word کی طرح)۔
   • Ctrl+S محفوظ + «محفوظ ہو گیا» · Ctrl+X/C/V (چسپاں: باہر سے صرف سادہ متن، اردو فونٹ برقرار)
     · Ctrl+F مرکزی تلاش (منتخب متن کے ساتھ) · Ctrl+H دستاویز میں ڈھونڈیں اور بدلیں
     · Ctrl+B/I/U · Ctrl+Z/Y اپنی تاریخ (ہر دستاویز کی الگ، execCommand کی نہیں)
     · Ctrl+J/R/L/E سیدھ · Ctrl+[ / ] فونٹ 1pt کم/زیادہ · Ctrl+A صرف کھلی دستاویز
     · Ctrl+P وہی پرنٹ جو «پرنٹ» بٹن · Tab = 0.5 انچ (1.27 سینٹی میٹر)، Shift+Tab واپس (پیراگراف کے
       شروع کا Tab = پہلی سطر کا حاشیہ، MS Word کی طرح — justify میں بھی ٹھیک 1.27؛ Backspace سے بھی واپس)؛
       جدول کے خانے میں Tab اگلا خانہ / Shift+Tab پچھلا (لکھنے والے بڑے خانوں میں Tab = آگے)
   • میعاد ختم (صرف دیکھنا): S / P کا فیصلہ subscription.js کا پہرا کرتا ہے؛ یہاں صرف تلاش کھلی۔
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__dioKeys2) return;
  window.__dioKeys2 = true;
  window.__dioKeys = true;
  // پرانے سننے والے دوبارہ نہ لگیں (zimni.js کا Ctrl+S، editor-tools.js کا Ctrl+H/F)
  window._dioCtrlSBound = true;
  window._dioFRKeys = true;

  // ── عام اوزار ─────────────────────────────────────────────────────
  const TAB_CM = 1.27;                         // MS Word: ایک Tab = 0.5 انچ
  const ROOT_SEL = '#ch173-doc,#dk-doc,#ir-doc,#saza-doc,#rfa-doc,#cro-doc,#cdr-doc,#dio-naqsha-doc,' +
    '#misal-editor,#dio-fv-paper,#a4-paper,#tpl-editable-area,#word-doc-editable,[data-dio-doc]';
  // جدول کے وہ خانے جن میں دستاویز کی اصل تحریر ہے (افسر کا فیصلہ، 28 اکتوبر): Tab = آگے
  const PROSE_SEL = 'td.zf-c-body,td.zfa-c-body,.normwrap,.ch173-cont,.saza-c4-body,.ir-detail,[data-dio-prose]';
  const MY_UI = '#dio-msearch,#dio-keys-help,#dio-fr-panel';

  const toast = (m, t, d) => { try { if (typeof window.showToast === 'function') window.showToast(m, t || 'info', d); } catch (_) { /* پیغام ضمنی */ } };
  const vis = (el) => {
    if (!el || !el.isConnected || !el.getClientRects().length) return false;
    try { const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') return false; } catch (_) { /* ضمنی */ }
    return true;
  };
  const isField = (el) => !!(el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName || ''));
  const viewOnly = () => { try { return typeof window._dioViewOnlyActive === 'function' && !!window._dioViewOnlyActive(); } catch (_) { return false; } };
  const sel = () => window.getSelection();

  // لکھنے والا خانہ (contenteditable کا سب سے باہر والا میزبان)
  function hostOf(n) {
    if (!n) return null;
    if (n.nodeType !== 1) n = n.parentElement;
    if (!n || !n.isContentEditable) return null;
    while (n.parentElement && n.parentElement.isContentEditable) n = n.parentElement;
    return n;
  }
  function editHost() {
    const ae = document.activeElement;
    if (isField(ae)) return null;                       // input / textarea — اپنا کام خود
    if (ae && ae.closest && ae.closest(MY_UI)) return null;
    let h = (ae && ae.isContentEditable) ? hostOf(ae) : null;
    if (!h) { try { const s = sel(); if (s && s.rangeCount) h = hostOf(s.anchorNode); } catch (_) { /* ضمنی */ } }
    return h;
  }
  // دستاویز کی جڑ (جس پر Ctrl+A / Ctrl+H / تاریخ لاگو ہو)
  function rootOf(h) { return h ? ((h.closest && h.closest(ROOT_SEL)) || h) : null; }
  function layerOf(el) {
    if (el.closest('#modal-backdrop')) return 3;
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      try { if (getComputedStyle(n).position === 'fixed') return 2; } catch (_) { /* ضمنی */ }
    }
    return 1;
  }
  // صفحے پر کھلی سب سے اوپر کی دستاویز (کرسر اس میں نہ بھی ہو)
  function openDocRoot() {
    const c = [].slice.call(document.querySelectorAll(ROOT_SEL)).filter(el => vis(el) && !(el.parentElement && el.parentElement.closest(ROOT_SEL)));
    if (!c.length) return null;
    const top = Math.max.apply(null, c.map(layerOf));
    const L = c.filter(el => layerOf(el) === top);
    return L[L.length - 1];
  }
  function curRoot() { const h = editHost(); return h ? rootOf(h) : (selRoot() || openDocRoot()); }
  // کئی خانوں والی دستاویز (چالان، واقعاتی رپورٹ، RFA …) میں Ctrl+A کے بعد انتخاب کسی ایک خانے میں نہیں —
  // تب جڑ اسی انتخاب سے
  function selRoot() {
    try {
      const s = sel(); if (!s || !s.rangeCount || s.isCollapsed) return null;
      let n = s.getRangeAt(0).commonAncestorContainer;
      if (n && n.nodeType !== 1) n = n.parentElement;
      const r = n && n.closest && n.closest(ROOT_SEL);
      return (r && vis(r) && r.querySelector('[contenteditable="true"],[contenteditable=""]')) ? r : null;
    } catch (_) { return null; }
  }
  window.dioDocRoot = curRoot;

  // ── متن کی جگہ (کرسر) — خانے کے متن میں حرفوں کا شمار ──────────────
  function offsetIn(host, node, off) { const r = document.createRange(); r.setStart(host, 0); r.setEnd(node, off); return r.toString().length; }
  function caretOf(host) {
    try {
      const s = sel(); if (!s || !s.rangeCount) return null;
      const r = s.getRangeAt(0);
      if (!host.contains(r.startContainer) || !host.contains(r.endContainer)) return null;
      return { s: offsetIn(host, r.startContainer, r.startOffset), e: offsetIn(host, r.endContainer, r.endOffset) };
    } catch (_) { return null; }
  }
  function pointAt(host, n) {
    const w = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    let t, acc = 0, last = null;
    while ((t = w.nextNode())) {
      const L = t.nodeValue.length;
      if (acc + L >= n) return { node: t, offset: n - acc };
      acc += L; last = t;
    }
    return last ? { node: last, offset: last.nodeValue.length } : { node: host, offset: host.childNodes.length };
  }
  function setPoint(r, which, p) {
    const tab = p.node.parentElement && p.node.parentElement.closest && p.node.parentElement.closest('.dio-tab');
    if (tab) { if (which === 's') r.setStartAfter(tab); else r.setEndAfter(tab); return; }
    if (which === 's') r.setStart(p.node, p.offset); else r.setEnd(p.node, p.offset);
  }
  function restoreCaret(host, c) {
    try {
      try { host.focus({ preventScroll: true }); } catch (_) { /* ضمنی */ }
      if (!c) return;
      const r = document.createRange();
      setPoint(r, 's', pointAt(host, c.s));
      if (c.e !== c.s) setPoint(r, 'e', pointAt(host, c.e)); else r.collapse(true);
      const s = sel(); s.removeAllRanges(); s.addRange(r);
    } catch (_) { /* کرسر نہ لگ سکے تو بھی متن بحال */ }
  }

  // ═══ واپس / دوبارہ — ہر دستاویز کی اپنی تاریخ (execCommand پر بھروسہ نہیں) ═══
  const HIST = new WeakMap();       // جڑ → { u: [], r: [], g }
  const CACHE = new WeakMap();      // خانہ → آخری معلوم حالت { html, text, caret }
  let muting = 0;                   // ہم خود DOM بدل رہے ہیں — تاریخ نہ لکھو
  let beforeHost = null;            // beforeinput آیا (صارف کی لکھائی) — input پر دوبارہ نہیں
  const MAX = 300;

  function hist(root) { let s = HIST.get(root); if (!s) { s = { u: [], r: [], g: null }; HIST.set(root, s); } return s; }
  function pathOf(root, el) {
    const p = [];
    for (let n = el; n && n !== root; n = n.parentElement) {
      if (!n.parentElement) return null;
      p.unshift([].indexOf.call(n.parentElement.children, n));
    }
    return p;
  }
  const sigOf = (el) => el.tagName + '|' + (typeof el.className === 'string' ? el.className : '') + '|' + (el.getAttribute('data-k') || '');
  function snapOf(root, h, src) {
    const c = src || { html: h.innerHTML, text: h.textContent, caret: caretOf(h) };
    return { host: h, path: pathOf(root, h), sig: sigOf(h), html: c.html, text: c.text, caret: c.caret };
  }
  function remember(h) { if (h) CACHE.set(h, { html: h.innerHTML, text: h.textContent, caret: caretOf(h) }); }
  function resolve(root, it) {
    if (it.host && it.host.isConnected && root.contains(it.host)) return it.host;
    if (!it.path) return null;
    let n = root;
    for (let i = 0; i < it.path.length && n; i++) n = n.children[it.path[i]];
    return (n && sigOf(n) === it.sig && n.isContentEditable) ? n : null;
  }
  function push(root, items) {
    const s = hist(root);
    s.u.push(items); if (s.u.length > MAX) s.u.shift();
    s.r.length = 0;
  }
  // کمانڈ سے پہلے کی حالت (Ctrl+B، سیدھ، فونٹ، Tab، ڈھونڈیں-بدلیں …)
  function before(root, hosts) {
    if (!root || !hosts || !hosts.length) return;
    push(root, hosts.map(h => snapOf(root, h)));
    hist(root).g = null;
  }
  function fireInput(h, type) {
    muting++;
    try { h.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: type || 'insertText' })); }
    catch (_) { try { h.dispatchEvent(new Event('input', { bubbles: true })); } catch (__) { /* ضمنی */ } }
    finally { muting--; }
  }
  function after(hosts, type) { hosts.forEach(h => { fireInput(h, type); remember(h); }); }
  function catOf(t) {
    if (/^insert(Text|CompositionText|ReplacementText)$/.test(t)) return 'type';
    if (/^delete(Content|Word|Soft|Hard|EntireSoft)/.test(t)) return 'del';
    return 'other';
  }
  function onBeforeInput(e) {
    if (muting || viewOnly()) return;
    const t = String(e.inputType || '');
    if (t === 'historyUndo' || t === 'historyRedo') return;
    const h = hostOf(e.target); if (!h) return;
    const root = rootOf(h), s = hist(root), now = Date.now(), cat = catOf(t);
    const ws = cat === 'type' && /^\s+$/.test(e.data || '');
    const g = s.g;
    let start = !g || g.host !== h || cat === 'other' || g.cat !== cat || now - g.t > 1500;
    if (!start && cat === 'type' && g.ws && !ws) start = true;     // نیا لفظ = نیا قدم (MS Word کی طرح)
    if (start) push(root, [snapOf(root, h)]);
    s.g = (cat === 'other') ? null : { host: h, cat: cat, t: now, ws: ws };
    beforeHost = h;
  }
  function onInput(e) {
    if (muting) return;
    const h = hostOf(e.target); if (!h) return;
    if (beforeHost !== h) {
      // beforeinput کے بغیر تبدیلی (ماڈیول کا بٹن، مائیک، دائیں کلک) — پچھلی حالت ایک قدم
      const c = CACHE.get(h), root = rootOf(h);
      if (c && c.html !== h.innerHTML) { push(root, [snapOf(root, h, c)]); hist(root).g = null; }
    }
    beforeHost = null;
    fixTabs(h);
    remember(h);
  }
  function onFocusIn(e) { const h = hostOf(e.target); if (h && !CACHE.has(h)) remember(h); }
  function onSelChange() {
    try {
      const s = sel(); if (!s || !s.rangeCount) return;
      const h = hostOf(s.anchorNode); if (!h) return;
      const c = CACHE.get(h); if (c) c.caret = caretOf(h);
    } catch (_) { /* ضمنی */ }
  }
  function breakGroup() { try { const r = curRoot(); if (r) hist(r).g = null; } catch (_) { /* ضمنی */ } }

  function undoRedo(root, redo) {
    if (!root) return false;
    const s = hist(root), src = redo ? s.r : s.u, dst = redo ? s.u : s.r;
    const entry = src.pop();
    if (!entry) { toast(redo ? 'دوبارہ کرنے کو کچھ نہیں' : 'واپس کرنے کو کچھ نہیں'); return true; }
    const hosts = entry.map(it => resolve(root, it));
    // دستاویز اسی دوران کسی اور طریقے سے بدل گئی (نیا کاغذ کھلا) — پرانا متن نئے پر کبھی نہ آئے
    const stale = hosts.some(h => {
      if (!h) return true;
      const c = CACHE.get(h);
      return !!(c && c.text !== h.textContent);
    });
    if (stale) { s.u.length = 0; s.r.length = 0; s.g = null; toast('یہ دستاویز باہر سے بدلی گئی — اس سے پہلے کی تبدیلی واپس نہیں ہو سکتی'); return true; }
    dst.push(hosts.map(h => snapOf(root, h)));
    muting++;
    try {
      hosts.forEach((h, i) => { h.innerHTML = entry[i].html; });
    } finally { muting--; }
    hosts.forEach(h => { fireInput(h, redo ? 'historyRedo' : 'historyUndo'); remember(h); });
    const last = entry.length - 1;
    restoreCaret(hosts[last], entry[last].caret);
    remember(hosts[last]);
    s.g = null;
    return true;
  }
  window.dioUndo = function () { return undoRedo(curRoot(), false); };
  window.dioRedo = function () { return undoRedo(curRoot(), true); };
  window.dioHistory = { before: before, after: function (hosts, type) { after(hosts, type); }, remember: remember, rootOf: rootOf, hostOf: hostOf };

  // ماڈیولوں کی پٹی کے ↶ ↷ بٹن (execCommand('undo'/'redo')) بھی اسی تاریخ پر
  try {
    const nativeExec = document.execCommand.bind(document);
    document.execCommand = function (cmd, ui, val) {
      const c = String(cmd || '').toLowerCase();
      if ((c === 'undo' || c === 'redo') && !viewOnly()) {
        const root = curRoot();
        if (root) return undoRedo(root, c === 'redo');
      }
      return nativeExec(cmd, ui, val);
    };
  } catch (_) { /* پرانا براؤزر — پٹی کا بٹن براؤزر کا اپنا */ }

  // ── چنے ہوئے حصے کے لکھنے والے خانے ──────────────────────────────
  function rangeNow() { const s = sel(); return (s && s.rangeCount) ? s.getRangeAt(0) : null; }
  function hostsIn(root, r, host) {
    if (!r || r.collapsed) return host ? [host] : [];
    const a = hostOf(r.startContainer), b = hostOf(r.endContainer);
    if (a && a === b) return [a];
    const set = [];
    const add = (h) => { if (h && set.indexOf(h) < 0) set.push(h); };
    if (root.isContentEditable) add(hostOf(root));
    root.querySelectorAll('[contenteditable="true"],[contenteditable=""]').forEach(el => {
      const h = hostOf(el);
      try { if (h && r.intersectsNode(h)) add(h); } catch (_) { /* ضمنی */ }
    });
    return set;
  }
  function clip(r, h) {
    const x = document.createRange(); x.selectNodeContents(h);
    if (r.compareBoundaryPoints(Range.START_TO_START, x) > 0) x.setStart(r.startContainer, r.startOffset);
    if (r.compareBoundaryPoints(Range.END_TO_END, x) < 0) x.setEnd(r.endContainer, r.endOffset);
    return x.collapsed ? null : x;
  }
  function useRange(h, r) { try { h.focus({ preventScroll: true }); } catch (_) { /* ضمنی */ } const s = sel(); s.removeAllRanges(); s.addRange(r); }

  // ═══ Ctrl+B / I / U ═════════════════════════════════════════════
  function format(cmd, host, root0) {
    const root = root0 || rootOf(host), r = rangeNow(); if (!r || !root) return;
    try { document.execCommand('styleWithCSS', false, false); } catch (_) { /* ضمنی */ }
    if (r.collapsed) {
      if (!host) return;               // اگلی لکھائی کے لیے (MS Word کی طرح) — DOM نہیں بدلتا
      muting++; try { document.execCommand(cmd, false, null); } catch (_) { /* ضمنی */ } finally { muting--; }
      return;
    }
    const hosts = hostsIn(root, r, host);
    if (!hosts.length) return;
    before(root, hosts);
    const keep = r.cloneRange();
    muting++;
    try {
      if (hosts.length === 1 && host) document.execCommand(cmd, false, null);
      else {
        const parts = hosts.map(h => ({ h: h, x: clip(keep, h) })).filter(p => p.x);
        let on = true;
        parts.forEach(p => { useRange(p.h, p.x); if (!document.queryCommandState(cmd)) on = false; });
        parts.forEach(p => { useRange(p.h, p.x); if (document.queryCommandState(cmd) === on) document.execCommand(cmd, false, null); });
        try {
          if (!host) { const ae = document.activeElement; if (ae && ae !== document.body && ae.blur) ae.blur(); }   // پورا انتخاب واپس (کسی ایک خانے تک محدود نہیں)
          const s = sel(); s.removeAllRanges(); s.addRange(keep);
        } catch (_) { /* ضمنی */ }
      }
    } catch (_) { /* ضمنی */ } finally { muting--; }
    after(hosts, cmd === 'bold' ? 'formatBold' : cmd === 'italic' ? 'formatItalic' : 'formatUnderline');
    try { if (typeof window._zimniSyncFmtBtns === 'function') setTimeout(window._zimniSyncFmtBtns, 10); } catch (_) { /* ضمنی */ }
  }

  // ═══ Ctrl+J / R / L / E — پیراگراف کی سیدھ ═══════════════════════
  function blockOf(node, host) {
    let el = node && (node.nodeType === 1 ? node : node.parentElement);
    while (el && el !== host) {
      let d = 'inline'; try { d = getComputedStyle(el).display; } catch (_) { /* ضمنی */ }
      if (!/^inline|^contents$/.test(d)) return el;
      el = el.parentElement;
    }
    if (el === host) { let d = 'inline'; try { d = getComputedStyle(host).display; } catch (_) { /* ضمنی */ } return /^inline/.test(d) ? null : host; }
    return null;
  }
  function textNodesIn(r) {
    const out = [];
    const anc = r.commonAncestorContainer;
    if (anc.nodeType === 3) return [anc];
    const w = document.createTreeWalker(anc, NodeFilter.SHOW_TEXT);
    let t;
    while ((t = w.nextNode())) { try { if (r.intersectsNode(t)) out.push(t); } catch (_) { /* ضمنی */ } }
    return out;
  }
  function alignOf(el) {
    let a = '', dir = 'rtl';
    try { const cs = getComputedStyle(el); a = cs.textAlign; dir = cs.direction; } catch (_) { /* ضمنی */ }
    if (a === 'start') a = dir === 'rtl' ? 'right' : 'left';
    else if (a === 'end') a = dir === 'rtl' ? 'left' : 'right';
    return a.replace('-webkit-', '');
  }
  function lastOf(el) {
    let a = '', dir = 'rtl';
    try { const cs = getComputedStyle(el); a = cs.textAlignLast; dir = cs.direction; } catch (_) { /* ضمنی */ }
    if (a === 'auto' || !a) return alignOf(el) === 'justify' ? (dir === 'rtl' ? 'right' : 'left') : alignOf(el);
    if (a === 'start') a = dir === 'rtl' ? 'right' : 'left';
    else if (a === 'end') a = dir === 'rtl' ? 'left' : 'right';
    return a.replace('-webkit-', '');
  }
  // سطریں <br> سے الگ ہوں (ایک ہی خانے میں کئی پیراگراف) تو سیدھ صرف اسی پیراگراف کی —
  // اُس سطر کو اپنے <div> میں لے کر (MS Word میں ہر Enter ایک الگ پیراگراف)
  const isBreak = (n) => {
    if (!n) return true;
    if (n.nodeName === 'BR') return true;
    if (n.nodeType !== 1) return false;
    let d = 'inline'; try { d = getComputedStyle(n).display; } catch (_) { /* ضمنی */ }
    return !/^inline|^contents$/.test(d);
  };
  // b کی اپنی سطر-حدیں: <br> (کسی بھی inline کے اندر)، b کے براہ راست block بچے، اور
  // pre-wrap خانوں (چالان کا کالم 7) میں «\n» — ہر «\n» کو الگ متن بنا کر
  const ownOf = (x, b) => { for (let n = x.parentElement; n && n !== b; n = n.parentElement) if (isBreak(n)) return false; return true; };
  function ownBreaks(b) {
    const out = [];
    let ws = ''; try { ws = getComputedStyle(b).whiteSpace; } catch (_) { /* ضمنی */ }
    if (/pre|break-spaces/.test(ws)) {
      const tw = document.createTreeWalker(b, NodeFilter.SHOW_TEXT), list = [];
      let t; while ((t = tw.nextNode())) if (t.nodeValue.indexOf('\n') >= 0 && ownOf(t, b) && !t.parentElement.closest('.dio-tab')) list.push(t);
      list.forEach(tn => {
        let cur = tn;
        while (cur && cur.nodeValue.length > 1 && cur.nodeValue.indexOf('\n') >= 0) {
          const i = cur.nodeValue.indexOf('\n');
          if (i > 0) { cur = cur.splitText(i); continue; }      // «\n» شروع میں لاؤ
          const rest = cur.splitText(1);                         // «\n» اکیلا
          out.push(cur); cur = rest;
        }
        if (cur && cur.nodeValue === '\n' && out.indexOf(cur) < 0) out.push(cur);
      });
    }
    [].forEach.call(b.querySelectorAll('br'), x => { if (ownOf(x, b)) out.push(x); });
    [].forEach.call(b.children, c => { if (c.nodeName !== 'BR' && isBreak(c)) out.push(c); });
    out.sort((p, q) => (p.compareDocumentPosition(q) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);
    return out;
  }
  function needsWrap(b) {
    return ownBreaks(b).length > 0 && /\S/.test(b.textContent || '');
  }
  // b کے اندر وہ سطر (پیراگراف) جس میں r ہے — پچھلی حد کے بعد سے اگلی حد سے پہلے تک
  function lineRange(b, r) {
    const S = r.cloneRange(); S.collapse(true);
    const E = r.cloneRange(); E.collapse(false);
    const R = document.createRange();
    R.setStart(b, 0); R.setEnd(b, b.childNodes.length);
    let endBr = null;
    const brk = ownBreaks(b);
    brk.forEach(x => {                                           // پچھلی حد کے بعد سے
      const p = x.parentNode, i = [].indexOf.call(p.childNodes, x);
      if (S.comparePoint(p, i + 1) <= 0) R.setStartAfter(x);
    });
    for (let k = brk.length - 1; k >= 0; k--) {                  // اگلی حد سے پہلے تک
      const x = brk[k], p = x.parentNode, i = [].indexOf.call(p.childNodes, x);
      if (E.comparePoint(p, i) >= 0) { R.setEndBefore(x); endBr = (x.nodeName === 'BR' || (x.nodeType === 3 && x.nodeValue === '\n')) ? x : null; }
    }
    return { R: R, endBr: endBr };
  }
  function lineWrap(b, r) {
    const L = lineRange(b, r), R = L.R, endBr = L.endBr;
    if (R.collapsed) {                                           // خالی سطر
      const d0 = document.createElement('div'); d0.appendChild(document.createElement('br'));
      R.insertNode(d0);
      if (endBr && endBr.isConnected) endBr.remove();
      noInherit(d0);
      return d0;
    }
    const frag = R.extractContents();
    const d = document.createElement('div');
    d.appendChild(frag);
    if (!/\S/.test(d.textContent || '') && !d.querySelector('br,.dio-tab')) d.appendChild(document.createElement('br'));
    // نیا پیراگراف b کی سطح پر — کٹی ہوئی جگہ کے فوراً بعد
    let t = R.startContainer;
    if (t === b) b.insertBefore(d, b.childNodes[R.startOffset] || null);
    else { while (t.parentNode !== b) t = t.parentNode; b.insertBefore(d, t.nextSibling); }
    if (endBr && endBr.isConnected) endBr.remove();              // div خود سطر توڑتا ہے — دوہری خالی سطر نہیں
    // کٹنے سے بچے خالی خول (<b></b> وغیرہ) ہٹاؤ
    [d.previousSibling, d.nextSibling].forEach(n => {
      if (n && n.nodeType === 1 && !isBreak(n) && !/\S/.test(n.textContent || '') && !n.querySelector('br,.dio-tab,img')) n.remove();
    });
    noInherit(d);
    return d;
  }
  // پیراگراف کا حاشیہ (سطر کے شروع کا Tab) صرف اس کی پہلی سطر پر ہوتا ہے؛ بعد کی سطر الگ div بنے
  // تو text-indent وراثت میں نہ لے — ورنہ وہ سطر بھی خود بخود 1.27 سینٹی میٹر اندر چلی جاتی
  const hasContent = (n) => {
    if (!n) return false;
    if (n.nodeType === 3) return /[^\s\u200B]/.test(n.nodeValue || '');
    if (n.nodeType !== 1) return false;
    if (n.nodeName === 'BR' || n.nodeName === 'IMG' || (n.classList && n.classList.contains('dio-tab'))) return true;
    return /[^\s\u200B]/.test(n.textContent || '') || !!n.querySelector('br,img,.dio-tab');
  };
  function firstIn(el) { for (let p = el.previousSibling; p; p = p.previousSibling) if (hasContent(p)) return false; return true; }
  function noInherit(d) {
    try { if (d.parentElement && !firstIn(d) && !d.style.textIndent && parseFloat(getComputedStyle(d).textIndent)) d.style.textIndent = '0px'; } catch (_) { /* ضمنی */ }
  }
  function align(val, host, root0) {
    const root = root0 || rootOf(host), r = rangeNow(); if (!r || !root) return;
    const hosts = hostsIn(root, r, host);
    const blocks = [];
    const addB = (b) => { if (b && blocks.indexOf(b) < 0) blocks.push(b); };
    if (r.collapsed) { if (!host) return; addB(blockOf(r.startContainer, host)); }
    else hosts.forEach(h => { const x = clip(r, h); if (!x) return; const tn = textNodesIn(x); if (!tn.length) addB(blockOf(x.startContainer, h)); tn.forEach(t => addB(blockOf(t, h))); });
    if (!blocks.length) return;
    const hs = hosts.filter(h => blocks.some(b => h.contains(b)));
    const touched = hs.length ? hs : (host ? [host] : []);
    if (!touched.length) return;
    before(root, touched);
    const carets = touched.map(h => caretOf(h));
    const targets = [];
    muting++;
    try {
      blocks.forEach(b => {
        if (needsWrap(b)) {
          const x = r.collapsed ? r : (clip(r, b) || r);
          const w = lineWrap(b, x);
          if (w && targets.indexOf(w) < 0) targets.push(w);
        } else if (b.isContentEditable && hostOf(b) === b) {
          // پورا خانہ ایک ہی پیراگراف: سیدھ اندر کے پیراگراف (div) پر — ماڈیول خانے کا اندرونی HTML
          // ہی محفوظ کرتے ہیں، خانے کا اپنا انداز نہیں؛ ورنہ دوبارہ کھولنے پر سیدھ ختم
          let w = (b.childNodes.length === 1 && b.firstChild.nodeType === 1 && b.firstChild.tagName === 'DIV') ? b.firstChild : null;
          if (!w) { w = document.createElement('div'); while (b.firstChild) w.appendChild(b.firstChild); b.appendChild(w); }
          if (targets.indexOf(w) < 0) targets.push(w);
        } else if (targets.indexOf(b) < 0) targets.push(b);
      });
      const all = targets.every(b => alignOf(b) === val && (val === 'justify' || lastOf(b) === val));
      targets.forEach(b => {
        if (!b.hasAttribute('data-dio-ta0')) b.setAttribute('data-dio-ta0', (b.style.textAlign || '') + '|' + (b.style.textAlignLast || ''));
        const o = String(b.getAttribute('data-dio-ta0') || '').split('|');
        // دوبارہ وہی کلید = واپس پہلی سیدھ (MS Word کی طرح)
        b.style.textAlign = all ? (o[0] || '') : val;
        // ایک سطر / آخری سطر بھی اسی سیدھ میں (ماڈیول کا text-align-last:right ورنہ اسے دائیں رکھتا)؛
        // «دونوں طرف برابر» میں آخری سطر MS Word کی طرح شروع (دائیں) پر — ماڈیول کا اپنا
        b.style.textAlignLast = (all || val === 'justify') ? (o[1] || '') : val;
      });
    } finally { muting--; }
    after(touched, 'formatJustify' + val.charAt(0).toUpperCase() + val.slice(1));
    const i = host ? touched.indexOf(host) : -1;
    if (i >= 0 && carets[i]) restoreCaret(host, carets[i]);
    else if (!host) { try { const s2 = sel(); s2.removeAllRanges(); const y = document.createRange(); y.selectNodeContents(root); s2.addRange(y); } catch (_) { /* ضمنی */ } }
  }

  // ═══ Ctrl+[ / Ctrl+] — فونٹ 1pt کم / زیادہ (ہر حصے کا اپنا سائز) ════
  function wordAt(r) {
    const n = r.startContainer; if (!n || n.nodeType !== 3) return null;
    const s = n.nodeValue; let a = r.startOffset, b = a;
    const isW = (ch) => !!ch && !/[\s .,;:!?،۔؟"'()[\]{}<>\-—\t]/.test(ch);
    while (a > 0 && isW(s[a - 1])) a--;
    while (b < s.length && isW(s[b])) b++;
    if (a === b) return null;
    const x = document.createRange(); x.setStart(n, a); x.setEnd(n, b); return x;
  }
  function fontStep(dir, host, root0) {
    const root = root0 || rootOf(host); let r = rangeNow(); if (!r || !root) return;
    if (r.collapsed && !host) return;
    const wasCaret = r.collapsed ? caretOf(host) : null;
    if (r.collapsed) { r = wordAt(r); if (!r) return; }
    const hosts = hostsIn(root, r, host);
    if (!hosts.length) return;
    before(root, hosts);
    let first = null, last = null;
    muting++;
    try {
      // سرحد پر متن کاٹو تاکہ صرف چنا ہوا حصہ بدلے
      let sc = r.startContainer, so = r.startOffset, ec = r.endContainer, eo = r.endOffset;
      if (ec.nodeType === 3 && eo > 0 && eo < ec.nodeValue.length) { ec.splitText(eo); }
      if (sc.nodeType === 3 && so > 0 && so < sc.nodeValue.length) { const nn = sc.splitText(so); if (ec === sc) { ec = nn; eo = eo - so; } sc = nn; so = 0; }
      const x = document.createRange(); x.setStart(sc, so); x.setEnd(ec, eo);
      textNodesIn(x).forEach(tn => {
        if (!tn.nodeValue.length || !hostOf(tn)) return;
        const par = tn.parentElement; if (!par || par.closest('.dio-tab')) return;
        if (x.comparePoint(tn, 0) > 0 || (tn === ec && eo === 0)) return;
        let px = 18.6667; try { px = parseFloat(getComputedStyle(par).fontSize) || px; } catch (_) { /* ضمنی */ }
        const pt = Math.max(1, Math.round(px * 0.75 * 2) / 2 + dir);
        let sp;
        if (par.tagName === 'SPAN' && par.hasAttribute('data-dio-fs') && par.childNodes.length === 1) sp = par;
        else { sp = document.createElement('span'); sp.setAttribute('data-dio-fs', '1'); par.insertBefore(sp, tn); sp.appendChild(tn); }
        sp.style.fontSize = pt + 'pt';
        if (!first) first = tn; last = tn;
      });
    } catch (_) { /* ضمنی */ } finally { muting--; }
    after(hosts, 'formatFontSize');
    if (wasCaret) restoreCaret(host, wasCaret);
    else if (first) {
      const y = document.createRange(); y.setStart(first, 0); y.setEnd(last, last.nodeValue.length);
      if (hostOf(first) === hostOf(last)) useRange(hostOf(first), y);
      else { const s2 = sel(); s2.removeAllRanges(); s2.addRange(y); }
    }
  }

  // ═══ Tab — 0.5 انچ (1.27 سینٹی میٹر)؛ جدول کے خانے میں اگلا خانہ ═════
  function makeTab() {
    const sp = document.createElement('span');
    sp.className = 'dio-tab';
    sp.setAttribute('contenteditable', 'false');
    // MS Word کی طرح Tab stop: ہر 1.27 سینٹی میٹر پر (سطر کے شروع میں بالکل 1.27)؛ Word فائل میں بھی Tab
    sp.setAttribute('style', TAB_STYLE);
    sp.textContent = '\t';
    return sp;
  }
  // <br> کے فوراً بعد (سطر کے شروع میں) Tab ہو تو براؤزر اُس سطر کے شروع پر کرسر نہیں رکھ سکتا —
  // Home / کلک کرسر کو پچھلی سطر کے آخر پر لے جاتے اور لکھائی وہاں جاتی۔ اس لیے Tab سے پہلے ایک
  // نظر نہ آنے والا نشان (U+200B، چوڑائی صفر)؛ Tab ہٹے تو یہ نشان بھی خود ہٹ جاتا ہے
  const ZW = '\u200B';
  const prevSib = (n) => { let p = n.previousSibling; while (p && p.nodeType === 3 && p.nodeValue === '') p = p.previousSibling; return p; };
  function fixTabs(h) {
    if (!h || (!h.querySelector('.dio-tab') && (h.textContent || '').indexOf(ZW) < 0)) return;
    // ترامیم deleteData / insertBefore سے — کرسر (براؤزر کا زندہ انتخاب) خود اپنی جگہ رہتا ہے
    muting++;
    try {
      const tw = document.createTreeWalker(h, NodeFilter.SHOW_TEXT), list = [];
      let t; while ((t = tw.nextNode())) if (t.nodeValue.indexOf(ZW) >= 0) list.push(t);
      list.forEach(tn => {                                         // ہٹ چکے Tab کا بچا ہوا نشان
        const nx = tn.nextSibling;
        const tabNext = !!(nx && nx.nodeType === 1 && nx.classList.contains('dio-tab'));
        for (let i = tn.nodeValue.length - 1; i >= 0; i--) {
          if (tn.nodeValue.charAt(i) !== ZW) continue;
          if (tabNext && i === tn.nodeValue.length - 1) continue;
          tn.deleteData(i, 1);
        }
      });
      [].forEach.call(h.querySelectorAll('.dio-tab'), sp => {     // سطر کے شروع والے ہر Tab سے پہلے نشان
        const p = prevSib(sp);
        if (p && p.nodeName === 'BR') sp.parentNode.insertBefore(document.createTextNode(ZW), sp);
        else if (p && p.nodeType === 3 && p.nodeValue.charAt(p.nodeValue.length - 1) === ZW) { /* موجود */ }
      });
    } finally { muting--; }
  }
  // ── سطر کے شروع میں Tab = پیراگراف کی پہلی سطر کا حاشیہ (text-indent)، ہر Tab پر 1.27 سینٹی میٹر ──
  //   MS Word بھی پیراگراف کے شروع کا Tab پہلی سطر کے حاشیے کے طور پر رکھتا ہے (Backspace / Shift+Tab سے کم)۔
  //   «دونوں طرف برابر» (justify) والی پوری سطر میں براؤزر Tab کے حرف کو بھی کھینچ دیتا ہے (ناپ 45–49px)؛
  //   text-indent نہیں کھنچتا — اسکرین، پرنٹ، PDF تینوں میں ٹھیک 1.27 سینٹی میٹر۔ Word فائل میں یہ Word کا اپنا Tab بنتا ہے۔
  const TAB_PX = 48;                                              // 1.27 سینٹی میٹر = 0.5 انچ = 48 CSS px
  function indentOf(p) {
    let v = 0; try { v = parseFloat(getComputedStyle(p).textIndent) || 0; } catch (_) { /* ضمنی */ }
    return Math.max(0, Math.round(v / TAB_PX));
  }
  // پہلی سطر کے بعد والے اندرونی پیراگراف (div) حاشیہ وراثت میں نہ لیں
  function zeroRest(p) {
    let first = true;
    const walk = (el) => {
      for (let c = el.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) { if (/[^\s\u200B]/.test(c.nodeValue || '')) first = false; continue; }
        if (c.nodeType !== 1) continue;
        if (c.nodeName === 'BR' || c.nodeName === 'IMG' || (c.classList && c.classList.contains('dio-tab'))) { first = false; continue; }
        if (!isBreak(c)) { walk(c); continue; }
        if (c.style && c.style.textIndent) { first = false; continue; }
        if (first) { walk(c); first = false; continue; }
        c.style.textIndent = '0px';
      }
    };
    walk(p);
  }
  function setIndent(p, n) {
    if (n > 0) { p.style.textIndent = (Math.round(n * TAB_CM * 100) / 100) + 'cm'; zeroRest(p); return; }
    p.style.textIndent = '';
    if (indentOf(p) > 0) p.style.textIndent = '0px';              // والد سے وراثت میں آیا حاشیہ بھی ختم
    if (!p.getAttribute('style')) p.removeAttribute('style');
  }
  // کرسر والی سطر (پچھلی سطر-حد سے کرسر تک) — کرسر سے پہلے اسی سطر پر کیا ہے
  function beforeCaret(blk, r) {
    const L = lineRange(blk, r).R, x = document.createRange();
    x.setStart(L.startContainer, L.startOffset); x.setEnd(r.startContainer, r.startOffset);
    return { L: L, x: x };
  }
  function atLineStart(blk, r) {
    try {
      const x = beforeCaret(blk, r).x;
      if (x.collapsed) return true;
      const f = x.cloneContents();
      return !(f.querySelector && f.querySelector('.dio-tab,img')) && !/[^\s\u00A0\u200B]/.test(x.toString());
    } catch (_) { return false; }
  }
  function tabBefore(blk, r) {
    try { const f = beforeCaret(blk, r).x.cloneContents(); return !!(f.querySelector && f.querySelector('.dio-tab')); } catch (_) { return true; }
  }
  // کرسر پیراگراف کی پہلی سطر پر ہے؟ (اس سے پہلے کوئی <br> / «\n» / اندرونی پیراگراف نہیں)
  function firstLine(blk, r) {
    try {
      const L = beforeCaret(blk, r).L, y = document.createRange();
      y.setStart(blk, 0); y.setEnd(L.startContainer, L.startOffset);
      if (y.collapsed) return true;
      const f = y.cloneContents();
      return !/[^\s\u200B]/.test(y.toString()) && !(f.querySelector && f.querySelector('br,div,p,li,img,.dio-tab'));
    } catch (_) { return false; }
  }
  // حاشیہ جس عنصر پر لکھا ہے — پہلی سطر والا اندرونی div اپنے والد کا حاشیہ وراثت میں لیتا ہے
  function indentTarget(blk, host) {
    let n = blk;
    while (n && n !== host && !(n.style && n.style.textIndent) && n.parentElement && n.parentElement !== host && firstIn(n)) n = n.parentElement;
    return (n && n !== host && n.style && n.style.textIndent) ? n : blk;
  }
  // کرسر وہیں (سطر کے شروع) — سطر اپنے div میں گئی ہو تو اس div کے شروع پر
  function caretBack(keep, p, h) {
    let x = keep;
    try { if (!x || !x.startContainer.isConnected || !p.contains(x.startContainer)) { x = document.createRange(); x.setStart(p, 0); } } catch (_) { x = document.createRange(); x.setStart(p, 0); }
    x.collapse(true);
    useRange(h, x);
  }
  function indentLine(host, r, dir) {
    const blk = blockOf(r.startContainer, host); if (!blk) return false;
    const fl = blk !== host && firstLine(blk, r);
    let p = fl ? indentTarget(blk, host) : null;
    if (dir < 0 && !(p && indentOf(p) > 0)) return false;
    const root = rootOf(host), keep = r.cloneRange();
    before(root, [host]);
    muting++;
    try {
      if (!p) {
        if (blk === host && !needsWrap(host)) {
          // پورا خانہ ایک ہی پیراگراف: حاشیہ اندر کے div پر (ماڈیول خانے کا اندرونی HTML ہی محفوظ کرتے ہیں)
          p = (host.childNodes.length === 1 && host.firstChild.nodeType === 1 && host.firstChild.tagName === 'DIV') ? host.firstChild : null;
          if (!p) { p = document.createElement('div'); while (host.firstChild) p.appendChild(host.firstChild); host.appendChild(p); }
        } else p = lineWrap(blk, r);                               // بعد کی سطر — اپنا پیراگراف
      }
      if (p) setIndent(p, Math.max(0, indentOf(p) + dir));
    } finally { muting--; }
    after([host], dir > 0 ? 'insertText' : 'deleteContentBackward');
    if (p && dir > 0) caretBack(keep, p, host);
    return true;
  }
  function insertTab(host) {
    const root = rootOf(host), r = rangeNow(); if (!r) return;
    if (r.collapsed) {
      const blk = blockOf(r.startContainer, host);
      if (blk && atLineStart(blk, r) && indentLine(host, r, 1)) return;
    }
    before(root, [host]);
    let t = null;
    muting++;
    try {
      if (!r.collapsed) r.deleteContents();
      t = makeTab();
      r.insertNode(t);
      const p = prevSib(t);
      if (p && p.nodeName === 'BR') t.parentNode.insertBefore(document.createTextNode(ZW), t);
      const a = document.createRange(); a.setStartAfter(t); a.collapse(true);
      const s = sel(); s.removeAllRanges(); s.addRange(a);
    } finally { muting--; }
    after([host], 'insertText');
  }
  function removeTab(host) {
    const root = rootOf(host), r = rangeNow(); if (!r) return;
    const blk = blockOf(r.startContainer, host) || host;
    // پہلی سطر پر، کرسر سے پہلے کوئی Tab نہیں: پیراگراف کا حاشیہ ایک قدم کم (MS Word کی طرح)
    if (r.collapsed && blk !== host && !tabBefore(blk, r) && indentLine(host, r, -1)) return;
    let line = null;
    try { line = lineRange(blk, r).R; } catch (_) { line = null; }
    // صرف اسی سطر کے Tab (پیراگراف کی کسی اور سطر کا نہیں)
    const tabs = [].slice.call(blk.querySelectorAll('.dio-tab')).filter(t => {
      if (hostOf(t.parentElement) !== host) return false;
      try { return !line || line.intersectsNode(t); } catch (_) { return true; }
    });
    let target = null;
    tabs.forEach(t => {
      const p = t.parentNode, i = [].indexOf.call(p.childNodes, t);
      try { if (r.comparePoint(p, i + 1) <= 0) target = t; } catch (_) { /* ضمنی */ }
    });
    if (!target && tabs.length) target = tabs[0];
    if (target) {
      before(root, [host]);
      muting++; try { target.remove(); } finally { muting--; }
      fixTabs(host);
      after([host], 'deleteContentBackward');
      return;
    }
    // پرانی دستاویزات: Tab سے بنی خالی جگہیں (5 / 8 nbsp) کرسر سے پہلے
    const n = r.startContainer;
    if (n.nodeType === 3) {
      const txt = n.nodeValue.slice(0, r.startOffset), m = /[ \t ]{3,8}$/.exec(txt);
      if (m && / |\t/.test(m[0])) {
        before(root, [host]);
        muting++;
        try { const k = r.startOffset; n.nodeValue = txt.slice(0, k - m[0].length) + n.nodeValue.slice(k); const a = document.createRange(); a.setStart(n, k - m[0].length); a.collapse(true); const s = sel(); s.removeAllRanges(); s.addRange(a); }
        finally { muting--; }
        after([host], 'deleteContentBackward');
      }
    }
  }
  function cellTargets(table) {
    const out = [];
    [].forEach.call(table.rows || [], row => [].forEach.call(row.cells || [], c => {
      const t = c.isContentEditable ? c : c.querySelector('[contenteditable="true"],[contenteditable=""]');
      if (t && t.isContentEditable && vis(t)) out.push({ cell: c, t: t });
    }));
    return out;
  }
  function moveCell(cell, dir) {
    const table = cell.closest('table'); if (!table) return;
    const L = cellTargets(table);
    const i = L.findIndex(x => x.cell === cell), j = i + dir;
    if (i < 0 || j < 0 || j >= L.length) return;
    const t = L[j].t, x = document.createRange();
    x.selectNodeContents(t);                       // MS Word: اگلے خانے کا متن منتخب
    useRange(hostOf(t) || t, x);
    try { t.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (_) { /* ضمنی */ }
    breakGroup();
  }
  // ٹیمپلیٹ (سسٹم کا فارم) کے کاغذ میں ماڈیول کی class نہیں رہتیں — وہاں لکھنے والا بڑا خانہ
  // (جدول کی چوڑائی کا 35% یا زیادہ، سرخی نہیں) = لکھنے والا خانہ: Tab آگے؛ باقی خانوں میں اگلا خانہ
  function formProse(cell, root) {
    try {
      if (!root || root.id !== 'dio-fv-paper' || cell.tagName !== 'TD') return false;
      const tb = cell.closest('table'); if (!tb) return false;
      const tw = tb.getBoundingClientRect().width, cw = cell.getBoundingClientRect().width;
      return tw > 300 && cw >= tw * 0.35;
    } catch (_) { return false; }
  }
  function onTab(e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing || viewOnly()) return;
    const host = editHost(); if (!host) return;            // input / select: براؤزر کا عام Tab (اگلا خانہ)
    const r = rangeNow(); if (!r) return;
    const at = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement;
    const root = rootOf(host);
    const cell = at && at.closest && at.closest('td,th');
    const prose = (at && at.closest && at.closest(PROSE_SEL)) || (cell && formProse(cell, root) ? cell : null);
    e.preventDefault(); e.stopImmediatePropagation();
    if (cell && root.contains(cell) && !(prose && root.contains(prose))) { moveCell(cell, e.shiftKey ? -1 : 1); return; }
    if (e.shiftKey) removeTab(host); else insertTab(host);
  }

  // پیراگراف کے بالکل شروع پر Backspace: پہلے حاشیہ (Tab) ہٹے، پھر سطر جڑے — MS Word کی طرح
  function backIndent(e) {
    const h = editHost(); if (!h) return;
    const r = rangeNow(); if (!r || !r.collapsed) return;
    const blk = blockOf(r.startContainer, h); if (!blk || blk === h) return;
    if (!atLineStart(blk, r) || !firstLine(blk, r) || !(indentOf(indentTarget(blk, h)) > 0)) return;
    stop(e);
    indentLine(h, r, -1);
  }

  // ═══ Ctrl+A — صرف کھلی دستاویز ═══════════════════════════════════
  //   ایک خانے والی دستاویز (ضمنی، بیان، مسل، 5-C …): براؤزر کا اپنا انتخاب — پوری دستاویز۔
  //   کئی خانوں والی (چالان، واقعاتی رپورٹ، درخواست، سزا سلپ، RFA …): براؤزر کئی الگ لکھنے والے خانوں پر
  //   ایک انتخاب رکھ ہی نہیں سکتا — اس لیے «پوری دستاویز منتخب» کی حالت: تمام خانے نمایاں، اور
  //   Ctrl+C / Ctrl+X / Delete / B / I / U / سیدھ / فونٹ سب خانوں پر ایک ساتھ (Ctrl+Z سے ایک قدم میں واپس)
  let allSel = null;
  function allCss() {
    if (document.getElementById('dio-allsel-css')) return;
    const st = document.createElement('style'); st.id = 'dio-allsel-css';
    st.textContent = '.dio-allsel [contenteditable="true"],.dio-allsel [contenteditable=""]{background:rgba(56,132,255,.24) !important;}' +
      '@media print{.dio-allsel [contenteditable="true"],.dio-allsel [contenteditable=""]{background:transparent !important;}}';
    document.head.appendChild(st);
  }
  function allOff() { if (allSel) { try { allSel.classList.remove('dio-allsel'); } catch (_) { /* ضمنی */ } } allSel = null; }
  function allHosts(root) {
    const out = [];
    root.querySelectorAll('[contenteditable="true"],[contenteditable=""]').forEach(el => {
      const h = hostOf(el);
      if (h && root.contains(h) && out.indexOf(h) < 0 && vis(h) && !h.closest('.no-print')) out.push(h);
    });
    return out;
  }
  function selectAll(root) {
    const single = root.isContentEditable && hostOf(root) === root;
    if (single) {
      allOff();
      const r = document.createRange(); r.selectNodeContents(root);
      try { if (document.activeElement !== root) root.focus({ preventScroll: true }); } catch (_) { /* ضمنی */ }
      const s = sel(); s.removeAllRanges(); s.addRange(r);
      breakGroup();
      return;
    }
    allOff(); allCss();
    allSel = root;
    root.classList.add('dio-allsel');
    try { const ae = document.activeElement; if (ae && ae !== document.body && root.contains(ae) && ae.blur) ae.blur(); } catch (_) { /* ضمنی */ }
    try { sel().removeAllRanges(); } catch (_) { /* ضمنی */ }
    breakGroup();
  }
  function wholeRange(h) { const x = document.createRange(); x.selectNodeContents(h); return x; }
  function allFormat(cmd) {
    const root = allSel, hosts = allHosts(root); if (!hosts.length) return;
    before(root, hosts);
    muting++;
    try {
      try { document.execCommand('styleWithCSS', false, false); } catch (_) { /* ضمنی */ }
      const live = hosts.filter(h => /\S/.test(h.textContent || ''));
      let on = true;
      live.forEach(h => { useRange(h, wholeRange(h)); if (!document.queryCommandState(cmd)) on = false; });
      live.forEach(h => { useRange(h, wholeRange(h)); if (document.queryCommandState(cmd) === on) document.execCommand(cmd, false, null); });
    } catch (_) { /* ضمنی */ } finally { muting--; }
    after(hosts, 'format');
    allRefocus();
  }
  function allAlign(val) {
    const root = allSel, hosts = allHosts(root).filter(h => { let d = 'inline'; try { d = getComputedStyle(h).display; } catch (_) { /* ضمنی */ } return !/^inline/.test(d); });
    if (!hosts.length) return;
    before(root, hosts);
    muting++;
    try {
      hosts.forEach(b => {
        let w = (b.childNodes.length === 1 && b.firstChild.nodeType === 1 && b.firstChild.tagName === 'DIV') ? b.firstChild : null;
        if (!w) { w = document.createElement('div'); while (b.firstChild) w.appendChild(b.firstChild); b.appendChild(w); }
        if (!w.hasAttribute('data-dio-ta0')) w.setAttribute('data-dio-ta0', (w.style.textAlign || '') + '|' + (w.style.textAlignLast || ''));
        w.style.textAlign = val;
        w.style.textAlignLast = val === 'justify' ? '' : val;
      });
    } finally { muting--; }
    after(hosts, 'formatJustify');
    allRefocus();
  }
  function allFont(dir) {
    const root = allSel, hosts = allHosts(root); if (!hosts.length) return;
    before(root, hosts);
    muting++;
    try {
      hosts.forEach(h => {
        textNodesIn(wholeRange(h)).forEach(tn => {
          if (!tn.nodeValue.length || !/\S/.test(tn.nodeValue)) return;
          const par = tn.parentElement; if (!par || par.closest('.dio-tab')) return;
          let px = 18.6667; try { px = parseFloat(getComputedStyle(par).fontSize) || px; } catch (_) { /* ضمنی */ }
          const pt = Math.max(1, Math.round(px * 0.75 * 2) / 2 + dir);
          let sp;
          if (par.tagName === 'SPAN' && par.hasAttribute('data-dio-fs') && par.childNodes.length === 1) sp = par;
          else { sp = document.createElement('span'); sp.setAttribute('data-dio-fs', '1'); par.insertBefore(sp, tn); sp.appendChild(tn); }
          sp.style.fontSize = pt + 'pt';
        });
      });
    } catch (_) { /* ضمنی */ } finally { muting--; }
    after(hosts, 'formatFontSize');
    allRefocus();
  }
  function allClear() {
    const root = allSel, hosts = allHosts(root); if (!hosts.length) return;
    before(root, hosts);
    muting++;
    try { hosts.forEach(h => { h.innerHTML = ''; }); } finally { muting--; }
    after(hosts, 'deleteContent');
    allOff();
  }
  let copyAll = null;
  function allCopy() {
    copyAll = allSel;
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
    copyAll = null;
    return ok;
  }
  // فارمیٹنگ کے بعد بھی «پوری دستاویز منتخب» برقرار (کرسر کسی ایک خانے میں نہیں)
  function allRefocus() {
    try { const ae = document.activeElement; if (ae && ae !== document.body && ae.blur) ae.blur(); sel().removeAllRanges(); } catch (_) { /* ضمنی */ }
  }
  // پوری دستاویز منتخب ہو تو کلید کا کام؛ true = سنبھال لی
  function allKey(e, k, ctrl) {
    if (!allSel) return false;
    if (!allSel.isConnected || !vis(allSel)) { allOff(); return false; }
    const key = String(e.key || '');
    if (/^(Control|Shift|Alt|Meta|CapsLock)$/.test(key)) return true;
    if (ctrl && !e.shiftKey) {
      if (k === 'a') { stop(e); return true; }
      if (k === 'c') { stop(e); allCopy(); return true; }
      if (k === 'x') { stop(e); if (allCopy()) allClear(); return true; }
      if (k === 'b' || k === 'i' || k === 'u') { stop(e); allFormat(k === 'b' ? 'bold' : k === 'i' ? 'italic' : 'underline'); return true; }
      if (k === 'j' || k === 'r' || k === 'l' || k === 'e') { stop(e); allAlign(k === 'j' ? 'justify' : k === 'r' ? 'right' : k === 'l' ? 'left' : 'center'); return true; }
      if (k === '[' || k === ']') { stop(e); allFont(k === ']' ? 1 : -1); return true; }
    }
    if (ctrl && (k === '[' || k === ']')) { stop(e); allFont(k === ']' ? 1 : -1); return true; }
    if (!ctrl && (key === 'Delete' || key === 'Backspace')) { stop(e); allClear(); return true; }
    if (key === 'Escape') { stop(e); allOff(); return true; }
    const root = allSel;
    allOff();                                                     // باقی ہر کلید (تیر، لکھائی، Ctrl+Z …) — حالت ختم
    if (ctrl && (k === 'z' || k === 'y')) { stop(e); undoRedo(root, k === 'y' || e.shiftKey); return true; }
    return false;
  }
  document.addEventListener('mousedown', function () { if (allSel) allOff(); }, true);

  // ═══ Ctrl+S — کھلی چیز محفوظ + «محفوظ ہو گیا» ═══════════════════════
  const SAVE_RE = /محفوظ|اپ ڈیٹ|\bSave\b/i;
  const NOT_SAVE_RE = /غیر محفوظ|محفوظ شدہ|محفوظ فہرست|فہرست|و پرنٹ/;
  function btnText(b) { return ((b.textContent || '') + ' ' + (b.getAttribute('title') || '')).replace(/\s+/g, ' '); }
  function findSaveIn(root) {
    if (!root) return null;
    const list = [].slice.call(root.querySelectorAll('button, [role="button"], a.btn')).filter(b =>
      !b.disabled && vis(b) && SAVE_RE.test(btnText(b)) && !NOT_SAVE_RE.test(b.textContent || '') && !b.closest(MY_UI));
    return list.find(b => b.hasAttribute('data-dio-save')) || list.find(b => /btn-primary|naq-save|dio-dv-save/.test(b.className + ' ' + b.id)) || list[0] || null;
  }
  // body کے اوپر کھلی پوری اسکرین کی دستاویز (5-C جواب، ٹیمپلیٹ …) — سب سے اوپر والی
  function topOverlay() {
    const SKIP = /^(dio-docview|modal-backdrop|dio-msearch|dio-keys-help|dio-fr-panel|toast-container|dio-print-frame)$/;
    const L = [].slice.call(document.body.children).filter(el => {
      if (SKIP.test(el.id || '') || !vis(el)) return false;
      let fx = false; try { fx = getComputedStyle(el).position === 'fixed'; } catch (_) { /* ضمنی */ }
      return fx && !!findSaveIn(el);
    });
    if (!L.length) return null;
    const z = (el) => { let v = 0; try { v = parseInt(getComputedStyle(el).zIndex, 10) || 0; } catch (_) { /* ضمنی */ } return v; };
    L.sort((a, b) => z(a) - z(b));
    return L[L.length - 1];
  }
  function saveNow() {
    // 1) سب سے اوپر کھلا کارڈ (نیا اندراج / ترمیم)
    const mb = document.getElementById('modal-backdrop');
    if (mb && vis(mb) && mb.style.display !== 'none') {
      const b = findSaveIn(mb.querySelector('.modal-card') || mb);
      if (b) { b.click(); return true; }
    }
    // 2) پوری اسکرین کی اپنی دستاویزات
    if (vis(document.getElementById('dio-form-view')) && window.DIOFormsUI && typeof window.DIOFormsUI.save === 'function') { window.DIOFormsUI.save(); return true; }
    if (vis(document.getElementById('ir-view')) && typeof window._irSave === 'function') { window._irSave(); return true; }
    const ov = topOverlay();
    if (ov) { findSaveIn(ov).click(); return true; }
    // 3) چالان / ضمنی / اندرونی ضمنی (ایک ہی #ch173-doc)
    try {
      const doc = (typeof window._ch173Doc === 'function') ? window._ch173Doc() : document.getElementById('ch173-doc');
      if (doc && vis(doc)) {
        if (doc.querySelector('.zfa-tbl') && typeof window._saveZimniA === 'function') { window._saveZimniA(false, true); return true; }
        if (doc.querySelector('.zf-tbl') && typeof window._saveZimni === 'function') { window._saveZimni(false, true); return true; }
        if (typeof window._saveR173 === 'function') { window._saveR173(); return true; }
      }
    } catch (_) { /* اگلا راستہ */ }
    // 4) نقشہ موقع
    if (document.getElementById('dio-naqsha-doc') && typeof window.naqSaveNow === 'function') { window.naqSaveNow(); return true; }
    // 5) پورے صفحے والی دستاویز کی پٹی کا «محفوظ»
    const dv = document.getElementById('dio-dv-save');
    if (dv && vis(dv) && typeof window._dioSaveCurrent === 'function') { window._dioSaveCurrent(); return true; }
    // 6) کھلی دستاویز کے اندر کا «محفوظ»، ورنہ صفحے کا
    const b = findSaveIn(document.getElementById('dio-dv-body')) || findSaveIn(document.getElementById('page-content'));
    if (b) { b.click(); return true; }
    return false;
  }
  // Ctrl+S کے بعد ماڈیول کی کامیابی کا پیغام = «محفوظ ہو گیا» (ساتھ سرور / آلے کی تفصیل اگر ہو)
  let saveUntil = 0;
  // کامیابی نہیں: انکار / خرابی، «… محفوظ کریں» جیسی ہدایت، یا «محفوظ ہو رہا ہے» جیسا جاری کام
  const NEG_RE = /نہیں|ناکام|غیر محفوظ|نہ ہو|خرابی|رد|محفوظ کریں|محفوظ کرنے|محفوظ ہو رہ|محفوظ کیا جا رہا|محفوظ کی جا رہی/;
  function wrapToast() {
    const cur = window.showToast;
    if (typeof cur !== 'function' || cur.__dioSaveWrap) return;
    const w = function (msg, type) {
      try {
        if (Date.now() < saveUntil) {
          const m = String(msg == null ? '' : msg).trim(), ty = String(type || 'info');
          const ok = ty === 'success' || (ty === 'info' && /محفوظ/.test(m) && !NEG_RE.test(m));
          if (ok) {
            saveUntil = 0;
            const plain = m.replace(/[\s۔.!]+$/, '');
            arguments[0] = (plain.length <= 24 || /^محفوظ ہو گیا/.test(plain)) ? 'محفوظ ہو گیا' : 'محفوظ ہو گیا — ' + m;
          } else if (/^(error|warn|warning)$/.test(ty)) saveUntil = 0;
        }
      } catch (_) { /* پیغام جوں کا توں */ }
      return cur.apply(this, arguments);
    };
    w.__dioSaveWrap = true;
    window.showToast = w;
  }
  function doSave() {
    wrapToast();
    saveUntil = Date.now() + 8000;
    let ok = false;
    try { ok = saveNow(); } catch (err) { ok = true; try { if (typeof window.dioLogError === 'function') window.dioLogError('Ctrl+S', err); } catch (_) { /* ضمنی */ } }
    if (!ok) { saveUntil = 0; toast('اس صفحے پر محفوظ کرنے کو کچھ نہیں — دستاویز یا اندراج کھول کر Ctrl+S دبائیں'); }
  }
  window.dioSaveNow = saveNow;

  // ═══ Ctrl+F — مرکزی تلاش · Ctrl+H — دستاویز میں ڈھونڈیں اور بدلیں ═══
  function pickedText() {
    const ae = document.activeElement;
    let t = '';
    try {
      if (isField(ae) && typeof ae.selectionStart === 'number') t = String(ae.value || '').slice(ae.selectionStart, ae.selectionEnd);
      else t = String(sel() || '');
    } catch (_) { t = ''; }
    return t.replace(/\s+/g, ' ').trim().slice(0, 120);
  }
  async function need(src) {
    try { if (typeof window.dioLoadScript === 'function') await window.dioLoadScript(src); } catch (_) { /* لوڈ نہ ہو سکے */ }
  }
  function openSearch() {
    const q = pickedText();
    if (typeof window.dioOpenMainSearch === 'function') window.dioOpenMainSearch(q);
    else if (typeof window.showPage === 'function') window.showPage('dashboard', null);
  }
  async function findReplace() {
    const q = pickedText();
    if (!curRoot()) { toast('پہلے کوئی دستاویز کھولیں — ڈھونڈیں اور بدلیں دستاویز کے اندر چلتا ہے'); return; }
    if (typeof window.dioFindReplace !== 'function') await need('editor-tools.js');
    if (typeof window.dioFindReplace === 'function') window.dioFindReplace(q);
  }

  // ═══ چسپاں — باہر سے سادہ متن؛ سسٹم کے اندر سے بنیادی فارمیٹنگ، فونٹ دستاویز کا ═══
  let lastClip = '';
  const normClip = (t) => String(t || '').replace(/\r/g, '').replace(/[\s ]+/g, ' ').trim();
  function onCopy(e) {
    if (copyAll && e && e.clipboardData) {
      const root = copyAll, txt = String(root.innerText || '');
      e.preventDefault(); e.stopImmediatePropagation();
      try { e.clipboardData.setData('text/plain', txt); e.clipboardData.setData('text/html', root.innerHTML); } catch (_) { /* ضمنی */ }
      lastClip = normClip(txt);
      return;
    }
    try { lastClip = normClip(sel()); } catch (_) { /* ضمنی */ }
  }
  const KEEP_TAGS = /^(B|STRONG|I|EM|U|BR|P|DIV|SPAN|SUB|SUP|UL|OL|LI)$/;
  const BLOCK_TAGS = /^(P|DIV|LI)$/;
  // انداز جو ساتھ جائیں: حرف کا (بولڈ / ترچھا / لکیر / اپنا لگایا pt سائز) اور پیراگراف کی سیدھ؛ فونٹ کا نام، رنگ، px نہیں
  const KEEP_CSS_INLINE = /^(font-weight|font-style|text-decoration|text-decoration-line|font-size)$/;
  const KEEP_CSS_BLOCK = /^(text-align|text-align-last|text-indent)$/;
  const TAB_STYLE = 'white-space:pre;tab-size:' + TAB_CM + 'cm;-moz-tab-size:' + TAB_CM + 'cm;mso-tab-count:1';
  function cleanHtml(html) {
    let h = String(html || '');
    const a = h.indexOf('<!--StartFragment-->'), b = h.indexOf('<!--EndFragment-->');
    if (a >= 0 && b > a) h = h.slice(a + 20, b);
    const tpl = document.createElement('template');
    tpl.innerHTML = (window.DIO && DIO.html && typeof DIO.html.safe === 'function') ? DIO.html.safe(h) : h;
    const walk = (node) => {
      [].slice.call(node.childNodes).forEach(n => {
        if (n.nodeType === 8) { n.remove(); return; }
        if (n.nodeType !== 1) return;
        walk(n);
        if (!KEEP_TAGS.test(n.tagName)) { while (n.firstChild) n.parentNode.insertBefore(n.firstChild, n); n.remove(); return; }
        const isTab = n.classList && n.classList.contains('dio-tab');
        const isBlock = BLOCK_TAGS.test(n.tagName);
        const st = [];
        String(n.getAttribute('style') || '').split(';').forEach(d => {
          const k = d.indexOf(':'); if (k < 0) return;
          const p = d.slice(0, k).trim().toLowerCase(), v = d.slice(k + 1).trim();
          if (!(isBlock ? KEEP_CSS_BLOCK : KEEP_CSS_INLINE).test(p)) return;
          if (p === 'font-size' && !(/pt$/.test(v) && n.hasAttribute('data-dio-fs'))) return;   // اپنا لگایا ہوا سائز ہی
          if (p === 'text-indent' && !/^(\d*\.?\d+)(cm|mm|in|pt|px)$/.test(v)) return;            // صرف آگے کا حاشیہ (منفی / % نہیں)
          st.push(p + ':' + v);
        });
        [].slice.call(n.attributes).forEach(at => n.removeAttribute(at.name));
        if (isTab) { n.className = 'dio-tab'; n.setAttribute('contenteditable', 'false'); n.setAttribute('style', TAB_STYLE); n.textContent = '\t'; return; }
        if (st.length) n.setAttribute('style', st.join(';'));
        if (/font-size/.test(st.join(';'))) n.setAttribute('data-dio-fs', '1');
      });
    };
    walk(tpl.content);
    // ایک ہی پیراگراف کے اندر سے نقل — پیراگراف کا خول نہیں (MS Word کی طرح سطر کے اندر چسپاں)
    const tops = [].filter.call(tpl.content.childNodes, n => n.nodeType === 1 || /\S/.test(n.nodeValue || ''));
    if (tops.length === 1 && tops[0].nodeType === 1 && BLOCK_TAGS.test(tops[0].tagName)) {
      const w = tops[0]; while (w.firstChild) w.parentNode.insertBefore(w.firstChild, w); w.remove();
    }
    // خالی رہ جانے والے span (انداز سب ہٹ گئے) — اتار دو
    [].slice.call(tpl.content.querySelectorAll('span:not([style]):not(.dio-tab)')).forEach(sp => { while (sp.firstChild) sp.parentNode.insertBefore(sp.firstChild, sp); sp.remove(); });
    return tpl.innerHTML;
  }
  function onPaste(e) {
    if (viewOnly()) return;
    const h = hostOf(e.target); if (!h) return;                   // input / textarea: سادہ متن خود
    const cd = e.clipboardData; if (!cd) return;
    const text = cd.getData('text/plain') || '', html = cd.getData('text/html') || '';
    if (!text && !html) return;                                   // تصویر وغیرہ — ماڈیول خود
    const root = rootOf(h);
    const internal = !!text && !!lastClip && normClip(text) === lastClip;
    // چالان کے خانے اپنا سادہ چسپاں + اوور فلو خود چلاتے ہیں — اُنہیں نہ چھیڑو
    const challan = root && root.id === 'ch173-doc' && !root.querySelector('.zf-tbl,.zfa-tbl');
    if (challan) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (internal && html) {
      const c = cleanHtml(html);
      if (c && c.replace(/<[^>]*>/g, '').trim()) { try { if (document.execCommand('insertHTML', false, c)) return; } catch (_) { /* سادہ متن پر */ } }
    }
    try { document.execCommand('insertText', false, text); } catch (_) { /* ضمنی */ }
  }

  // ═══ منتقل (Move) — منتخب متن کو ماؤس سے کھینچ کر نئی جگہ (MS Word: کھینچو = منتقل، Ctrl کے ساتھ = نقل) ═══
  //   براؤزر کا اپنا چھوڑنا (drop) px والے فونٹ کے خول ڈالتا اور دو قدم بنتے؛ یہاں ایک قدم، فونٹ دستاویز کا
  let dragSrc = null;
  function onDragStart(e) {
    dragSrc = null;
    const h = hostOf(e.target && e.target.nodeType === 1 ? e.target : (e.target && e.target.parentElement));
    const r = rangeNow();
    if (h && r && !r.collapsed && h.contains(r.commonAncestorContainer)) dragSrc = { host: h, range: r.cloneRange(), text: normClip(r.toString()) };
  }
  function onDrop(e) {
    if (viewOnly()) return;
    const h = hostOf(e.target); if (!h) return;
    const dt = e.dataTransfer; if (!dt) return;
    const text = dt.getData('text/plain') || '', html = dt.getData('text/html') || '';
    if (!text && !html) return;                                   // فائل / تصویر — ماڈیول خود
    let pt = null;
    try { pt = document.caretRangeFromPoint ? document.caretRangeFromPoint(e.clientX, e.clientY) : null; } catch (_) { pt = null; }
    if (!pt || hostOf(pt.startContainer) !== h) return;
    const root = rootOf(h);
    const src = (dragSrc && dragSrc.host.isConnected && dragSrc.text === normClip(text)) ? dragSrc : null;
    dragSrc = null;
    e.preventDefault(); e.stopImmediatePropagation();
    if (src && src.range.isPointInRange(pt.startContainer, pt.startOffset) && !(e.ctrlKey || e.metaKey)) return;   // اپنے ہی اوپر چھوڑا
    const hosts = [h]; if (src && src.host !== h && rootOf(src.host) === root) hosts.push(src.host);
    before(root, hosts);
    let first = null, last = null;
    muting++;
    try {
      const mark = document.createElement('span');
      pt.insertNode(mark);                                         // پہلے نشان، تاکہ منبع ہٹنے سے جگہ نہ ہلے
      if (src && !(e.ctrlKey || e.metaKey)) src.range.deleteContents();
      const tpl = document.createElement('template');
      if (src && html) tpl.innerHTML = cleanHtml(html); else tpl.content.appendChild(document.createTextNode(text));
      const nodes = [].slice.call(tpl.content.childNodes);
      nodes.forEach(n => mark.parentNode.insertBefore(n, mark));
      first = nodes[0] || null; last = nodes[nodes.length - 1] || null;
      mark.remove();
    } catch (_) { /* ضمنی */ } finally { muting--; }
    after(hosts, 'insertFromDrop');
    if (first && last) { try { const y = document.createRange(); y.setStartBefore(first); y.setEndAfter(last); useRange(h, y); } catch (_) { /* ضمنی */ } }
  }

  // ═══ «شارٹ کٹس» — مدد کی فہرست ══════════════════════════════════
  const KB = (s) => s.split(' / ').map(x => '<kbd dir="ltr"><bdi>' + x + '</bdi></kbd>').join(' <span class="dk-or">/</span> ');
  const HELP = [
    ['محفوظ کریں (نیا یا ترمیم) — «محفوظ ہو گیا»', 'Ctrl+S'],
    ['کاٹیں / نقل / چسپاں (باہر سے صرف سادہ متن، فونٹ دستاویز کا)', 'Ctrl+X / Ctrl+C / Ctrl+V'],
    ['منتقل کریں: منتخب متن کو ماؤس سے کھینچ کر دستاویز میں نئی جگہ چھوڑیں', ''],
    ['مرکزی تلاش (منتخب متن کے ساتھ)', 'Ctrl+F'],
    ['دستاویز میں ڈھونڈیں اور بدلیں', 'Ctrl+H'],
    ['بولڈ / ترچھا / انڈر لائن', 'Ctrl+B / Ctrl+I / Ctrl+U'],
    ['واپس / دوبارہ (ہر دستاویز کی اپنی تاریخ)', 'Ctrl+Z / Ctrl+Y'],
    ['دونوں طرف برابر / دائیں / بائیں / درمیان', 'Ctrl+J / Ctrl+R / Ctrl+L / Ctrl+E'],
    ['فونٹ 1 پوائنٹ چھوٹا / بڑا', 'Ctrl+[ / Ctrl+]'],
    ['پوری دستاویز منتخب (صرف کھلی دستاویز)', 'Ctrl+A'],
    ['پرنٹ — وہی جو «پرنٹ» بٹن', 'Ctrl+P'],
    ['0.5 انچ (1.27 سینٹی میٹر) آگے / واپس (پیراگراف کے شروع میں: پہلی سطر کا حاشیہ، Backspace سے بھی واپس)', 'Tab / Shift+Tab'],
    ['جدول میں اگلا / پچھلا خانہ (ضمنی، بیان 161، مختصر حالات، سزا اور تفصیل کے لکھنے والے خانوں میں Tab = 1.27 سینٹی میٹر آگے)', 'Tab / Shift+Tab'],
  ];
  function helpCss() {
    if (document.getElementById('dio-keys-help-css')) return;
    const st = document.createElement('style'); st.id = 'dio-keys-help-css';
    st.textContent =
      '#dio-keys-help{position:fixed;inset:0;z-index:2147483100;background:rgba(9,20,40,.5);display:flex;align-items:flex-start;justify-content:center;padding:56px 12px 12px;}' +
      '#dio-keys-help .dkh-card{background:var(--bg-card,#fff);color:var(--text-primary,#111);border:1px solid var(--border,#ccd);border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,.35);' +
      'width:min(720px,100%);max-height:calc(100vh - 80px);overflow:auto;direction:rtl;text-align:right;font-family:"Jameel Noori Nastaleeq","Noto Nastaliq Urdu",serif;padding:10pt 14pt 12pt;}' +
      '#dio-keys-help .dkh-top{display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid var(--border,#dde);padding-bottom:4pt;margin-bottom:6pt;}' +
      '#dio-keys-help h2{font-size:16pt;line-height:1.9;margin:0;font-weight:700;}' +
      '#dio-keys-help .dkh-x{border:1px solid var(--border,#ccd);background:transparent;color:inherit;border-radius:8px;min-width:36px;min-height:32px;cursor:pointer;font-size:12pt;font-family:inherit;}' +
      '#dio-keys-help table{width:100%;border-collapse:collapse;font-size:12pt;line-height:1.9;}' +
      '#dio-keys-help td{border-bottom:1px solid var(--border,#e3e7ee);padding:2pt 4pt;vertical-align:middle;}' +
      '#dio-keys-help td.dkh-k{white-space:nowrap;text-align:left;width:1%;}' +
      '#dio-keys-help kbd{display:inline-block;font-family:var(--font-mono,Consolas,monospace);font-size:10pt;line-height:1.5;border:1px solid var(--border,#c8ced8);border-bottom-width:2px;border-radius:5px;padding:0 5px;background:var(--bg-tertiary,#f3f5f8);unicode-bidi:isolate;}' +
      '#dio-keys-help .dk-or{opacity:.55;padding:0 2px;}' +
      '#dio-keys-help .dkh-note{font-size:11pt;line-height:1.9;color:var(--text-muted,#556);margin-top:6pt;}' +
      '@media print{#dio-keys-help{display:none !important;}}';
    document.head.appendChild(st);
  }
  function helpClose() { const o = document.getElementById('dio-keys-help'); if (o) o.remove(); document.removeEventListener('keydown', helpEsc, true); }
  function helpEsc(e) { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); helpClose(); } }
  function dioShortcutsHelp() {
    helpCss(); helpClose();
    const o = document.createElement('div');
    o.id = 'dio-keys-help'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', 'شارٹ کٹس');
    o.innerHTML = '<div class="dkh-card"><div class="dkh-top"><h2>شارٹ کٹس — MS Word کی طرح، پورے سسٹم میں</h2>' +
      '<button type="button" class="dkh-x" aria-label="بند کریں" title="بند کریں (Esc)">✕</button></div>' +
      '<table><tbody>' + HELP.map(r => '<tr><td>' + r[0] + '</td><td class="dkh-k">' + (r[1] ? KB(r[1]) : '') + '</td></tr>').join('') + '</tbody></table>' +
      '<div class="dkh-note">یہ کلیدیں براؤزر کی اپنی ہیں — کوئی ویب سائٹ انہیں استعمال نہیں کر سکتی: ' +
      KB('Ctrl+N / Ctrl+T / Ctrl+W / Ctrl+Shift+N / Ctrl+Shift+T / Ctrl+Tab / Ctrl+Shift+Tab') + '۔ ' +
      'صفحہ تازہ کرنے کے لیے ' + KB('F5') + ' (' + KB('Ctrl+R') + ' اب دائیں سیدھ ہے)۔</div></div>';
    o.addEventListener('click', (e) => { if (e.target === o || (e.target.closest && e.target.closest('.dkh-x'))) helpClose(); });
    document.body.appendChild(o);
    document.addEventListener('keydown', helpEsc, true);
    try { o.querySelector('.dkh-x').focus(); } catch (_) { /* ضمنی */ }
  }
  window.dioShortcutsHelp = dioShortcutsHelp;

  // ═══ چھپائی کا فریم: کرسر وہاں رہ جائے تو بھی کلیدیں سسٹم کی ═══════════
  //   (وجہ: پرنٹ کے بعد کرسر سسٹم کے چھپے فریم میں رہ جاتا اور Ctrl+S اُسی فریم کو HTML فائل بنا دیتا)
  window.dioGuardFrameKeys = function (win, back) {
    try {
      win.addEventListener('keydown', function (e) {
        if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
        e.preventDefault(); e.stopImmediatePropagation();
        try { window.focus(); } catch (_) { /* ضمنی */ }
        let t = back && back.isConnected ? back : document.body;
        try { if (t && t.focus) t.focus({ preventScroll: true }); } catch (_) { /* ضمنی */ }
        t = document.activeElement || document.body;
        try {
          t.dispatchEvent(new KeyboardEvent('keydown', { key: e.key, code: e.code, keyCode: e.keyCode, ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey, bubbles: true, cancelable: true }));
        } catch (_) { /* ضمنی */ }
      }, true);
    } catch (_) { /* ضمنی */ }
  };

  // ═══ کلید کی پہچان — کی بورڈ کی اصل کلید (اردو / IME پر بھی) ═══════════
  function keyOf(e) {
    const k = String(e.key || ''), c = String(e.code || '');
    if (k.length === 1 && /[A-Za-z]/.test(k)) return k.toLowerCase();      // لاطینی کی بورڈ: جو حرف لکھے
    let m = /^Key([A-Z])$/.exec(c);
    if (m) return m[1].toLowerCase();                                       // اردو / IME / کوئی بھی: اصل کلید
    if (c === 'BracketLeft' || k === '[' || k === '{') return '[';
    if (c === 'BracketRight' || k === ']' || k === '}') return ']';
    if (k === 'Tab' || c === 'Tab') return 'tab';
    const kc = e.keyCode | 0;
    if (kc >= 65 && kc <= 90) return String.fromCharCode(kc).toLowerCase();
    if (kc === 219) return '[';
    if (kc === 221) return ']';
    return '';
  }
  // باقی سننے والوں (پرنٹ کا راستہ، میعاد کا پہرا) کو بھی لاطینی حرف ہی دکھے
  function fixKey(e, k) {
    const want = e.shiftKey ? k.toUpperCase() : k;
    if (e.key === want) return;
    try { Object.defineProperty(e, 'key', { value: want, configurable: true }); } catch (_) { /* ضمنی */ }
  }
  const stop = (e) => { e.preventDefault(); e.stopImmediatePropagation(); };

  function onKey(e) {
    if (!e || e.altKey) return;                    // AltGr (= Ctrl+Alt) سے اردو حروف لکھے جاتے ہیں — کبھی نہ روکو
    const ctrl = e.ctrlKey || e.metaKey;
    const k = keyOf(e);
    if (allSel && !viewOnly() && allKey(e, k, ctrl)) return;
    if (!ctrl) {
      if (k === 'tab') onTab(e);
      else if (e.key === 'Backspace' && !e.shiftKey && !e.isComposing && !viewOnly()) backIndent(e);
      else if (/^(Arrow|Home|End|Page)/.test(String(e.key || ''))) breakGroup();
      return;
    }
    if (!k) return;
    if (/^[a-z]$/.test(k)) fixKey(e, k);
    const sh = e.shiftKey, vo = viewOnly();
    const ae = document.activeElement, field = isField(ae);
    const host = field ? null : editHost();
    const sroot = (!host && !field) ? selRoot() : null;          // Ctrl+A کے بعد پوری دستاویز
    switch (k) {
      case 's':
        if (sh || vo) return;                      // میعاد ختم: subscription.js کا پہرا پیغام دیتا ہے
        stop(e); doSave(); return;
      case 'p': {
        if (sh || vo) return;
        let fn = null; try { fn = (typeof window._dioPrintTarget === 'function') ? window._dioPrintTarget() : null; } catch (_) { fn = null; }
        if (fn) { stop(e); fn(); }                 // وہی جو «پرنٹ» بٹن؛ ورنہ دستاویز کا اپنا پرنٹ (اگلے سننے والے)
        return;
      }
      case 'f':
        if (sh) return;
        stop(e); openSearch(); return;
      case 'h':
        if (sh) return;
        stop(e); if (!vo) findReplace(); return;
      case 'b': case 'i': case 'u':
        if (sh) return;
        stop(e);                                   // Ctrl+U: براؤزر کا «صفحے کا ماخذ» کبھی نہیں
        if (!vo && (host || sroot)) format(k === 'b' ? 'bold' : k === 'i' ? 'italic' : 'underline', host, sroot);
        return;
      case 'z': case 'y': {
        if (field) return;                         // input / textarea کی اپنی واپسی
        const redo = (k === 'y') || sh;
        if (k === 'y' && sh) return;
        if (host || sroot) { stop(e); if (!vo) undoRedo(host ? rootOf(host) : sroot, redo); return; }
        const nq = document.getElementById('dio-naqsha-doc');
        if (nq && vis(nq)) return;                 // نقشے کی ڈرائنگ کی اپنی واپسی
        const root = openDocRoot();
        if (root) { stop(e); if (!vo) undoRedo(root, redo); }
        return;
      }
      case 'j': case 'r': case 'l': case 'e':
        if (sh) return;
        stop(e);                                   // Ctrl+R صفحہ تازہ / Ctrl+J ڈاؤن لوڈ / Ctrl+L، E پتے کی پٹی — کبھی نہیں
        if (!vo && (host || sroot)) align(k === 'j' ? 'justify' : k === 'r' ? 'right' : k === 'l' ? 'left' : 'center', host, sroot);
        return;
      case '[': case ']':
        if (!host && !sroot) return;
        stop(e); if (!vo) fontStep(k === ']' ? 1 : -1, host, sroot);
        return;
      case 'a': {
        if (sh || field) return;                   // input میں عام «سب منتخب»
        const root = host ? rootOf(host) : (sroot || openDocRoot());
        if (!root) return;
        stop(e); selectAll(root); return;
      }
      default: return;                             // X / C / V براؤزر کا اپنا (چسپاں اوپر سنبھالا)
    }
  }

  window.addEventListener('keydown', onKey, true);
  document.addEventListener('beforeinput', onBeforeInput, true);
  document.addEventListener('input', onInput, true);
  document.addEventListener('focusin', onFocusIn, true);
  document.addEventListener('selectionchange', onSelChange);
  document.addEventListener('mousedown', function (e) { if (hostOf(e.target)) breakGroup(); }, true);
  document.addEventListener('copy', onCopy, true);
  document.addEventListener('cut', onCopy, true);
  document.addEventListener('paste', onPaste, true);
  document.addEventListener('dragstart', onDragStart, true);
  document.addEventListener('drop', onDrop, true);
  window.dioKeys ={ saveNow: saveNow, help: dioShortcutsHelp, keyOf: keyOf, undo: window.dioUndo, redo: window.dioRedo };
})();
