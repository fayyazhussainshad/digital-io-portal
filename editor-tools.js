// ═══════════════════════════════════════════════════════════════════════
//  EDITOR TOOLS — MS Word jaisa "Home" toolbar (poore system ke liye)
//  Istemal: dioEditorToolbar()  → toolbar ka HTML
//           dioBindEditor(root) → us hisse ke editable khanon par Tab waghera
//  Har dastawez (چالان، ضمنی، مسل، 5C waghera) mein yaksan chalta hai.
// ═══════════════════════════════════════════════════════════════════════

// ── Toolbar ka HTML ───────────────────────────────────────────────────
// AHEM: har button par onmousedown="event.preventDefault()" — is ke baghair
// button dabate hi editor ka focus chhut jata hai aur command kaam nahi karti.
function dioEditorToolbar(opts) {
  opts = opts || {};
  const cls = opts.className || 'dio-etb';
  // TASK 19: ہر ایڈیٹر کی پٹی میں وہی مشترکہ بٹن — نشان اسی سیٹ (dio-icons.js) سے، اشارہ ہر جگہ ایک
  const KIND = { bold: 'bold', italic: 'italic', underline: 'underline', insertUnorderedList: 'bullets', insertOrderedList: 'numbers',
    justifyRight: 'align-right', justifyCenter: 'align-center', justifyLeft: 'align-left', justifyFull: 'justify' };
  const TIP = { bold: 'بولڈ (Ctrl+B)', italic: 'ترچھا (Ctrl+I)', underline: 'انڈر لائن (Ctrl+U)', insertUnorderedList: 'نقطہ دار فہرست',
    insertOrderedList: 'نمبر والی فہرست', justifyRight: 'دائیں سیدھ', justifyCenter: 'درمیان', justifyLeft: 'بائیں سیدھ', justifyFull: 'دونوں طرف برابر' };
  const B = (label, cmd) =>
    `<button type="button" class="dio-etb-btn dio-btn dio-btn--i" onmousedown="event.preventDefault()" ` +
    `onclick="dioExec('${cmd}')" title="${TIP[cmd]}" aria-label="${TIP[cmd]}" data-act="${KIND[cmd]}">${dioIco(KIND[cmd])}</button>`;
  const AL = (svg, cmd) => B('', cmd);
  const AL_LEFT = '', AL_CENTER = '', AL_RIGHT = '', AL_JUST = '';

  return `
  <div class="${cls} no-print" style="display:flex;align-items:center;gap:3px;flex-wrap:wrap;">
    <button type="button" class="dio-etb-btn dio-btn dio-btn--i" onmousedown="event.preventDefault()"
      onclick="dioExec('undo')" title="کالعدم (Ctrl+Z)" aria-label="کالعدم (Ctrl+Z)" data-act="undo"><i class="dio-i" data-ico="undo" aria-hidden="true"></i></button>
    <button type="button" class="dio-etb-btn dio-btn dio-btn--i" onmousedown="event.preventDefault()"
      onclick="dioExec('redo')" title="دوبارہ (Ctrl+Y)" aria-label="دوبارہ (Ctrl+Y)" data-act="redo"><i class="dio-i" data-ico="redo" aria-hidden="true"></i></button>
    <span class="dio-etb-sep"></span>
    ${B('B', 'bold', 'بولڈ (Ctrl+B)', 'font-weight:900;')}
    ${B('I', 'italic', 'ترچھا (Ctrl+I)', 'font-style:italic;')}
    ${B('U', 'underline', 'انڈر لائن (Ctrl+U)', 'text-decoration:underline;')}
    <span class="dio-etb-sep"></span>
    <select class="dio-etb-sel" onmousedown="event.stopPropagation()"
      onchange="dioSetFontSize(this.value); this.selectedIndex=0;" title="فونٹ سائز">
      <option value="">فونٹ</option>
      <option value="10">10 pt</option><option value="11">11 pt</option>
      <option value="12">12 pt</option><option value="14">14 pt</option>
      <option value="16">16 pt</option><option value="18">18 pt</option>
      <option value="20">20 pt</option><option value="24">24 pt</option>
    </select>
    <button type="button" class="dio-etb-btn dio-btn dio-btn--i" onmousedown="event.preventDefault()"
      onclick="dioFontStep(1)" title="فونٹ بڑا" aria-label="فونٹ بڑا" data-act="font-up"><i class="dio-i" data-ico="font-up" aria-hidden="true"></i></button>
    <button type="button" class="dio-etb-btn dio-btn dio-btn--i" onmousedown="event.preventDefault()"
      onclick="dioFontStep(-1)" title="فونٹ چھوٹا" style="font-size:8.25pt;" aria-label="فونٹ چھوٹا" data-act="font-down"><i class="dio-i" data-ico="font-down" aria-hidden="true"></i></button>
    <span class="dio-etb-sep"></span>
    ${AL(AL_RIGHT,  'justifyRight',  'دائیں (Right)')}
    ${AL(AL_CENTER, 'justifyCenter', 'درمیان (Center)')}
    ${AL(AL_LEFT,   'justifyLeft',   'بائیں (Left)')}
    ${AL(AL_JUST,   'justifyFull',   'دونوں طرف برابر (Justify)')}
    <span class="dio-etb-sep"></span>
    <button type="button" class="dio-etb-btn dio-btn dio-btn--i" onmousedown="event.preventDefault()"
      onclick="dioSetDir('rtl')" title="اردو — دائیں سے بائیں" style="font-weight:800;" aria-label="اردو — دائیں سے بائیں" data-act="rtl"><i class="dio-i" data-ico="rtl" aria-hidden="true"></i></button>
    <button type="button" class="dio-etb-btn dio-btn dio-btn--i" onmousedown="event.preventDefault()"
      onclick="dioSetDir('ltr')" title="انگریزی — بائیں سے دائیں" style="font-weight:800;direction:ltr;" aria-label="انگریزی — بائیں سے دائیں" data-act="ltr"><i class="dio-i" data-ico="ltr" aria-hidden="true"></i></button>
    <span class="dio-etb-sep"></span>
    ${B('•', 'insertUnorderedList', 'نقطہ دار فہرست (Bullets)')}
    ${B('1.', 'insertOrderedList', 'نمبر والی فہرست (Numbering)')}
    <span class="dio-etb-sep"></span>
    <button type="button" class="dio-etb-btn dio-btn dio-btn--i" onmousedown="event.preventDefault()"
      onclick="dioFindReplace()" title="ڈھونڈیں اور بدلیں" aria-label="ڈھونڈیں اور بدلیں" data-act="find-replace"><i class="dio-i" data-ico="find-replace" aria-hidden="true"></i></button>
    <button type="button" class="dio-etb-btn dio-btn dio-btn--i" onmousedown="event.preventDefault()"
      onclick="dioExec('removeFormat')" title="فارمیٹ ختم کریں" aria-label="فارمیٹ ختم کریں" data-act="clear-format"><i class="dio-i" data-ico="clear-format" aria-hidden="true"></i></button>
  </div>`;
}

// ── Toolbar ki CSS (aik dafa) ─────────────────────────────────────────
function dioEditorToolbarCSS() {
  if (document.getElementById('dio-etb-style')) return;
  const st = document.createElement('style');
  st.id = 'dio-etb-style';
  st.textContent = `
    .dio-etb-btn{ min-width:30px; height:28px; padding:0 7px; cursor:pointer;
      border:1px solid var(--border,#ccc); border-radius:6px;
      background:var(--bg-card,#fff); color:var(--text-primary,#111); font-size:9.75pt; }
    .dio-etb-btn:hover{ background:var(--hover-bg,#eef6ff); }
    .dio-etb-btn:active{ transform:translateY(1px); }
    .dio-etb-sel{ height:28px; padding:0 6px; border:1px solid var(--border,#ccc);
      border-radius:6px; background:var(--bg-card,#fff); color:var(--text-primary,#111); font-size:9pt; }
    .dio-etb-sep{ width:1px; height:20px; background:var(--border,#ddd); margin:0 3px; }
    @media print{ .dio-etb, .dio-etb-btn, .dio-etb-sel, .dio-etb-sep{ display:none !important; } }
  `;
  document.head.appendChild(st);
}

// ── Commands ──────────────────────────────────────────────────────────
function dioExec(cmd) {
  try { document.execCommand(cmd, false, null); } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
}
window.dioExec = dioExec;

// Font size — chune hue matn par; kuch chuna na ho to poore khane par
function dioSetFontSize(pt) {
  if (!pt) return;
  const sel = window.getSelection();
  try {
    if (sel && !sel.isCollapsed) {
      // execCommand ka fontSize 1–7 hai; is liye span laga kar asal pt dete hain
      document.execCommand('fontSize', false, '7');
      document.querySelectorAll('font[size="7"]').forEach(f => {
        const s = document.createElement('span');
        s.style.fontSize = pt + 'pt';
        s.setAttribute('data-dio-fs', '1');     // v553: افسر کا خود لگایا ہوا سائز — معیار سے نہ بدلے
        s.innerHTML = f.innerHTML;
        f.replaceWith(s);
      });
      return;
    }
    const el = _dioActiveEditable();
    if (el) { el.style.fontSize = pt + 'pt'; el.setAttribute('data-dio-fs', '1'); }
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
}
window.dioSetFontSize = dioSetFontSize;

// Font chhota/bara
function dioFontStep(dir) {
  const el = _dioActiveEditable();
  const sel = window.getSelection();
  if (sel && !sel.isCollapsed) {
    // v553: منتخب متن کا اپنا موجودہ سائز (پورے خانے کا نہیں) — MS Word کی طرح ایک درجہ اوپر/نیچے
    let px = 0;
    try { const a = sel.anchorNode; const ae = a && (a.nodeType === 1 ? a : a.parentElement); if (ae) px = parseFloat(getComputedStyle(ae).fontSize); } catch (_) { /* نیچے */ }
    if (!px) px = parseFloat((el && getComputedStyle(el).fontSize) || '18.67');
    dioSetFontSize(Math.min(48, Math.max(8, Math.round(px * 0.75) + (dir > 0 ? 1 : -1))));
    return;
  }
  if (!el) return;
  const cur = parseFloat(getComputedStyle(el).fontSize) || 18.67;
  const pt = Math.round(cur * 0.75);
  el.style.fontSize = Math.min(48, Math.max(8, pt + (dir > 0 ? 1 : -1))) + 'pt';
  el.setAttribute('data-dio-fs', '1');
}
window.dioFontStep = dioFontStep;

// Jis editable khane mein cursor hai
function _dioActiveEditable() {
  let n = document.activeElement;
  if (n && n.isContentEditable) return n;
  const s = window.getSelection();
  n = s && s.anchorNode;
  while (n && n !== document.body) {
    if (n.nodeType === 1 && n.isContentEditable) return n;
    n = n.parentNode;
  }
  return null;
}

// ── DIRECTION (RTL/LTR) — Urdu/English mix, MS Word jaisa ──────────────
// Chune hue paragraph (ya jis khane mein cursor hai) ka rukh badalta hai.
function dioSetDir(dir) {
  const el = _dioActiveEditable();
  if (!el) { if (typeof showToast === 'function') showToast('پہلے کسی خانے میں کلک کریں', 'info'); return; }
  // Cursor jis block (paragraph/div/li) mein hai wohi dhoondo; na mile to poora khana
  let node = null;
  try { const s = window.getSelection(); node = s && s.anchorNode; } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  let n = (node && node.nodeType === 1) ? node : (node && node.parentNode);
  let block = null;
  while (n && n !== el && n !== document.body) {
    let disp = '';
    try { disp = getComputedStyle(n).display; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    const tag = n.tagName;
    if (disp === 'block' || disp === 'list-item' || tag === 'P' || tag === 'DIV' || tag === 'LI') { block = n; break; }
    n = n.parentNode;
  }
  const target = block || el;
  target.setAttribute('dir', dir);
  target.style.textAlign = (dir === 'rtl') ? 'right' : 'left';
  try { el.focus(); } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
}
window.dioSetDir = dioSetDir;

// ── FIND & REPLACE — MS Word jaisa (chhota panel) ─────────────────────
let _dioFRTarget = null;   // jis editable par kaam ho raha hai
let _dioFRPos = 0;         // agli talash yahan se

function _dioFRPickTarget() {
  // v563: پوری کھلی دستاویز (MS Word کی طرح) — صرف وہ ایک خانہ نہیں جس میں کرسر ہے
  try { if (typeof window.dioDocRoot === 'function') { const r = window.dioDocRoot(); if (r) return r; } } catch (_) { /* پرانا راستہ */ }
  // Pehle active editable; warna khula bara editor
  let t = _dioActiveEditable();
  if (t) return t;
  const CAND = ['#misal-editor', '#dk-doc', '#ch173-doc', '#saza-doc', '#dio-dv-body [contenteditable="true"]'];
  for (let i = 0; i < CAND.length; i++) {
    const e = document.querySelector(CAND[i]);
    if (e && (e.isContentEditable || e.querySelector('[contenteditable="true"]'))) {
      return e.isContentEditable ? e : e.querySelector('[contenteditable="true"]');
    }
  }
  return null;
}

function dioFindReplace(prefill) {
  // Target ko ABHI pakad lo (panel ke input par focus jaate hi active editable badal jata hai)
  _dioFRTarget = _dioFRPickTarget();
  if (!_dioFRTarget) { if (typeof showToast === 'function') showToast('پہلے کسی دستاویز کے خانے میں لکھنے کے لیے کلک کریں', 'info'); return; }
  _dioFRPos = 0;
  const _fill = () => { const f = document.getElementById('dio-fr-find'); if (!f) return; if (prefill) f.value = String(prefill); f.focus(); try { f.select(); } catch (_) { /* ضمنی */ } };
  let p = document.getElementById('dio-fr-panel');
  if (p) { p.style.display = 'block'; _dioFRNote(''); _fill(); return; }
  p = document.createElement('div');
  p.id = 'dio-fr-panel';
  p.className = 'no-print';
  p.style.cssText =
    'position:fixed;z-index:2147483000;top:64px;left:50%;transform:translateX(-50%);' +
    'background:var(--bg-card,#fff);color:var(--text-primary,#111);border:1px solid var(--border,#ccc);' +
    'border-radius:12px;box-shadow:0 10px 34px rgba(0,0,0,.28);padding:12px 14px;direction:rtl;' +
    "font-family:'Jameel Noori Nastaleeq';max-width:94vw;width:360px;";
  p.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
      '<span style="font-weight:800;font-size:11.25pt;">' + (typeof dioIco === 'function' ? dioIco('find-replace') + ' ' : '') + 'ڈھونڈیں اور بدلیں</span>' +
      '<button class="dio-btn dio-btn--i" type="button" onclick="dioFRClose()" title="بند کریں" style="border:none;background:none;font-size:13.5pt;cursor:pointer;color:var(--text-muted,#777);line-height:1;" aria-label="بند کریں" data-act="close"><i class="dio-i" data-ico="close" aria-hidden="true"></i></button>' +
    '</div>' +
    '<input id="dio-fr-find" type="text" placeholder="کیا ڈھونڈنا ہے؟" ' +
      'style="width:100%;box-sizing:border-box;padding:8px 10px;margin-bottom:7px;border:1px solid var(--border,#ccc);border-radius:8px;background:var(--bg-tertiary,#f6f8fa);color:inherit;font-size:10.5pt;">' +
    '<input id="dio-fr-repl" type="text" placeholder="کس سے بدلنا ہے؟" ' +
      'style="width:100%;box-sizing:border-box;padding:8px 10px;margin-bottom:9px;border:1px solid var(--border,#ccc);border-radius:8px;background:var(--bg-tertiary,#f6f8fa);color:inherit;font-size:10.5pt;">' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
      '<button class="dio-btn" type="button" onclick="dioFRFindNext()" style="flex:1;min-width:80px;padding:8px;border:1px solid var(--accent,#2563eb);background:var(--bg-tertiary,#eef);color:var(--text-primary,#111);border-radius:8px;cursor:pointer;font-weight:700;font-family:inherit;" title="تلاش" aria-label="تلاش" data-act="search"><i class="dio-i" data-ico="search" aria-hidden="true"></i><span>تلاش</span></button>' +
      '<button class="dio-btn" type="button" onclick="dioFRReplaceOne()" style="flex:1;min-width:80px;padding:8px;border:1px solid var(--border,#ccc);background:var(--bg-card,#fff);color:var(--text-primary,#111);border-radius:8px;cursor:pointer;font-weight:700;font-family:inherit;" title="بدلیں" aria-label="بدلیں" data-act="find-replace"><i class="dio-i" data-ico="find-replace" aria-hidden="true"></i><span>بدلیں</span></button>' +
      '<button class="dio-btn" type="button" onclick="dioFRReplaceAll()" style="flex:1;min-width:96px;padding:8px;border:none;background:var(--accent,#2563eb);color:#fff;border-radius:8px;cursor:pointer;font-weight:800;font-family:inherit;" title="سب بدلیں" aria-label="سب بدلیں" data-act="find-replace"><i class="dio-i" data-ico="find-replace" aria-hidden="true"></i><span>سب بدلیں</span></button>' +
    '</div>' +
    '<div id="dio-fr-note" style="margin-top:8px;font-size:9pt;color:var(--text-muted,#777);min-height:16px;"></div>';
  document.body.appendChild(p);
  const fi = document.getElementById('dio-fr-find');
  fi.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); dioFRFindNext(); } });
  // Esc = صرف یہ خانہ بند (پیچھے کی دستاویز / پورا صفحہ نہیں)
  p.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); dioFRClose(); } });
  _fill();
}
window.dioFindReplace = dioFindReplace;

function dioFRClose() {
  const p = document.getElementById('dio-fr-panel');
  if (p) p.style.display = 'none';
  // کرسر واپس اُسی دستاویز میں (جہاں سے ڈھونڈنا شروع کیا تھا)
  try { if (_dioFRTarget && _dioFRTarget.isConnected) _dioFRTarget.focus(); } catch (_) { /* ضمنی */ }
}
window.dioFRClose = dioFRClose;

function _dioFRNote(msg) {
  const n = document.getElementById('dio-fr-note');
  if (n) n.textContent = msg || '';
}
function _dioFRTextNodes(root) {
  const out = [];
  if (!root) return out;
  // v563: پوری دستاویز میں — مگر صرف لکھنے والے خانوں کا متن (سسٹم کے لیبل / بٹن / Tab نہیں)
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: function (t) {
      const p = t.parentElement;
      if (!p || !p.isContentEditable || p.closest('.dio-tab,.no-print,button,select')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  let t; while ((t = w.nextNode())) out.push(t);
  return out;
}
// v563: ڈھونڈیں-بدلیں بھی Ctrl+Z سے واپس (ہر دستاویز کی اپنی تاریخ — dio-keys.js)
function _dioFRHost(n) {
  try { if (window.dioHistory) return window.dioHistory.hostOf(n); } catch (_) { /* ضمنی */ }
  return null;
}
function _dioFRBefore(hosts) {
  try { if (window.dioHistory && hosts.length) { window.dioHistory.before(window.dioHistory.rootOf(hosts[0]), hosts); return true; } } catch (_) { /* ضمنی */ }
  return false;
}
function _dioFRAfter(hosts) {
  try { if (window.dioHistory && hosts.length) { window.dioHistory.after(hosts, 'insertReplacementText'); _markDirtyMaybe(true); return; } } catch (_) { /* ضمنی */ }
  _markDirtyMaybe();
}

// Agli match dhoondo aur select karo (case-insensitive)
function dioFRFindNext() {
  const q = (document.getElementById('dio-fr-find') || {}).value || '';
  if (!q) { _dioFRNote('لکھیں کہ کیا ڈھونڈنا ہے'); return; }
  const root = _dioFRTarget;
  if (!root || !document.body.contains(root)) { _dioFRNote('خانہ دستیاب نہیں'); return; }
  const nodes = _dioFRTextNodes(root);
  const ql = q.toLowerCase();
  // Poora text jorr kar position track karte hain
  let acc = 0, found = null;
  for (let i = 0; i < nodes.length; i++) {
    const txt = nodes[i].nodeValue || '';
    const start = (acc >= _dioFRPos) ? 0 : Math.max(0, _dioFRPos - acc);
    const idx = txt.toLowerCase().indexOf(ql, start);
    if (idx !== -1) { found = { node: nodes[i], idx: idx, globalEnd: acc + idx + q.length }; break; }
    acc += txt.length;
  }
  if (!found) {
    // Shuru se dobara koshish (loop)
    if (_dioFRPos !== 0) { _dioFRPos = 0; _dioFRNote('آخر تک پہنچ گئے — شروع سے دوبارہ'); return dioFRFindNext(); }
    _dioFRNote('کوئی نتیجہ نہیں'); return;
  }
  try {
    const r = document.createRange();
    r.setStart(found.node, found.idx);
    r.setEnd(found.node, found.idx + q.length);
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    const sp = found.node.parentElement;
    if (sp && sp.scrollIntoView) sp.scrollIntoView({ block: 'center', behavior: 'smooth' });
    _dioFRPos = found.globalEnd;
    _dioFRNote('ملا ✓');
  } catch (e) { _dioFRNote('نتیجہ منتخب نہ ہو سکا'); }
}
window.dioFRFindNext = dioFRFindNext;

// Mojooda select shuda match ko badlo, phir agli dhoondo
function dioFRReplaceOne() {
  const q = (document.getElementById('dio-fr-find') || {}).value || '';
  const rep = (document.getElementById('dio-fr-repl') || {}).value || '';
  if (!q) { _dioFRNote('لکھیں کہ کیا ڈھونڈنا ہے'); return; }
  const sel = window.getSelection();
  const selText = sel ? String(sel).toLowerCase() : '';
  if (selText && selText === q.toLowerCase() && sel.rangeCount) {
    try {
      const r = sel.getRangeAt(0);
      const h = _dioFRHost(r.startContainer);
      const hs = h ? [h] : [];
      _dioFRBefore(hs);
      r.deleteContents();
      const tn = document.createTextNode(rep);
      r.insertNode(tn);
      // cursor match ke baad
      _dioFRPos = Math.max(0, _dioFRPos - q.length + rep.length);
      try { _dioFRTarget && (_dioFRTarget._dioDirtyPing = true); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      _dioFRAfter(hs);
      _dioFRNote('بدل دیا ✓');
    } catch (e) { _dioFRNote('نہ بدل سکا'); }
  }
  dioFRFindNext();
}
window.dioFRReplaceOne = dioFRReplaceOne;

// Sab matches badlo (case-insensitive) — sirf text nodes, formatting mehfooz
function dioFRReplaceAll() {
  const q = (document.getElementById('dio-fr-find') || {}).value || '';
  const rep = (document.getElementById('dio-fr-repl') || {}).value || '';
  if (!q) { _dioFRNote('لکھیں کہ کیا ڈھونڈنا ہے'); return; }
  const root = _dioFRTarget;
  if (!root || !document.body.contains(root)) { _dioFRNote('خانہ دستیاب نہیں'); return; }
  const nodes = _dioFRTextNodes(root);
  const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(esc, 'gi');
  let count = 0;
  // v563: جن خانوں میں بدلنا ہے اُن کی پچھلی حالت پہلے (Ctrl+Z سے ایک ہی قدم میں واپس)
  const hosts = [];
  nodes.forEach(nd => { re.lastIndex = 0; if (re.test(nd.nodeValue || '')) { const h = _dioFRHost(nd); if (h && hosts.indexOf(h) < 0) hosts.push(h); } });
  _dioFRBefore(hosts);
  nodes.forEach(nd => {
    const before = nd.nodeValue || '';
    if (!before) return;
    re.lastIndex = 0;
    const after = before.replace(re, function (m) { count++; return rep; });
    if (after !== before) nd.nodeValue = after;
  });
  if (count > 0) { _dioFRAfter(hosts); _dioFRNote(count + ' جگہ بدل دیں ✓'); }
  else _dioFRNote('کوئی نتیجہ نہیں');
}
window.dioFRReplaceAll = dioFRReplaceAll;

// Editor ko "dirty" mark karo (taake wapsi/محفوظ warning theek chale)
function _markDirtyMaybe(flagsOnly) {
  try { if (typeof _misalDirty !== 'undefined') window._misalDirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  try { if (typeof _r173Dirty !== 'undefined') window._r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  try { if (typeof _zimniDirty !== 'undefined') window._zimniDirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  if (flagsOnly) return;                 // v563: input ہر بدلے خانے پر dioHistory.after دے چکا
  // input event fire karo taake har module ka apna oninput=dirty chal jaye
  try {
    if (_dioFRTarget) _dioFRTarget.dispatchEvent(new Event('input', { bubbles: true }));
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}

// ── Enter (خانے کے اندر نئی سطر) ───────────────────────────────────────
// v563: Tab، Ctrl+B/I/U اور باقی تمام MS Word کلیدیں اب پورے سسٹم کا ایک ہی سننے والا
//   (dio-keys.js) سنبھالتا ہے — یہاں صرف Enter۔
function dioBindEditor(root) {
  root = root || document;
  dioEditorToolbarCSS();
  root.querySelectorAll('[contenteditable="true"]').forEach(el => {
    if (el._dioKeysBound) return;
    el._dioKeysBound = true;
    el.addEventListener('keydown', function (e) {
      if (e.defaultPrevented) return;
      // ENTER → nayi satar (khane ke andar hi)
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        try { document.execCommand('insertLineBreak'); }
        catch(_) { try { document.execCommand('insertHTML', false, '<br>'); } catch(__) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ } }
        return;
      }
    });
  });
}
window.dioBindEditor = dioBindEditor;
window.dioEditorToolbar = dioEditorToolbar;
window.dioEditorToolbarCSS = dioEditorToolbarCSS;


// تیرتی پٹی کا پرانا کوڈ (دکھانا/چھپانا/skip-list) v529 میں ہٹا دیا گیا —
// پٹی پورے سسٹم سے بند ہے۔ صرف یہ حوالہ باقی ہے تاکہ پرانی پٹی صاف ہو سکے۔
let _dioFloatBar = null;

/* ═══════════════════════════════════════════════════════════════════════
   ⛔ تیرتی پٹی (FLOATING TOOLBAR) — پورے سسٹم سے **بند**
   ───────────────────────────────────────────────────────────────────────
   صارف کی ہدایت: «remove floating tool bar from all system, no more
   floating toolbar.»

   پہلے یہ پٹی ہر contenteditable خانے پر focus آنے سے خود نمودار ہو جاتی
   تھی (صرف skip-list کی جگہیں مستثنیٰ تھیں)، اور متن کے اوپر آ کر کام میں
   رکاوٹ بنتی تھی۔ اب:
     • کوئی listener نہیں لگتا (نہ focusin، نہ scroll، نہ resize)
     • اگر پہلے سے کوئی پٹی DOM میں پڑی ہو تو ہٹا دی جاتی ہے

   فنکشن کا نام قائم رکھا گیا ہے (ہٹایا نہیں) کیونکہ darkhwastain.js،
   report173.js اور saza-slip.js میں اِسے روکنے کے لیے احتیاطی کالیں موجود
   ہیں — نام ہٹانے سے وہ فائلیں ٹوٹ سکتی تھیں۔ اب یہ کال بے اثر ہے۔

   ⚠ نوٹ: جن خانوں پر صرف یہی پٹی تھی، وہاں اب موٹا/ترچھا جیسے بٹن نہیں
   ہوں گے۔ جن صفحات پر اوپر مستقل پٹی پہلے سے موجود ہے — مثلاً مسل
   (misal-docs.js)، ضمنی (zimni.js) اور درخواستیں (darkhwastain.js) — وہاں
   کوئی فرق نہیں پڑے گا۔ Ctrl+B / Ctrl+I جیسی براؤزر کی عام کلیدیں اور
   Ctrl+H (ڈھونڈیں اور بدلیں) پہلے کی طرح چلتی رہیں گی۔
   ═══════════════════════════════════════════════════════════════════════ */
function dioEnableFloatingToolbar() {
  // جان بوجھ کر بے اثر — صرف پرانی پٹی کی صفائی کرتا ہے
  try {
    const old = document.getElementById('dio-float-bar');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    _dioFloatBar = null;
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  return false;
}
window.dioEnableFloatingToolbar = dioEnableFloatingToolbar;
window.dioFloatingToolbarDisabled = true;

// پرانی پٹی کی صفائی — اگر کسی پرانے cache سے DOM میں رہ گئی ہو
(function () {
  function _saaf() { try { dioEnableFloatingToolbar(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _saaf);
  else _saaf();
})();

// ── Ctrl+H (ڈھونڈیں اور بدلیں) اور Ctrl+F (مرکزی تلاش) ──────────────────
//   v563: پورے سسٹم کا ایک ہی کلیدی سننے والا (dio-keys.js) — یہاں پرانا الگ سننے والا ختم۔
