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
  const B = (label, cmd, tip, style) =>
    `<button type="button" class="dio-etb-btn" onmousedown="event.preventDefault()" ` +
    `onclick="dioExec('${cmd}')" title="${tip}" style="${style || ''}">${label}</button>`;

  // Alignment ke saaf SVG icons (MS Word jaise) — unicode se zyada wazeh
  const _sv = (lines) => `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" ` +
    `stroke="currentColor" stroke-width="1.6" stroke-linecap="round">${lines}</svg>`;
  const AL = (svg, cmd, tip) =>
    `<button type="button" class="dio-etb-btn" onmousedown="event.preventDefault()" ` +
    `onclick="dioExec('${cmd}')" title="${tip}">${svg}</button>`;
  const AL_LEFT   = _sv('<line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="10" y2="8"/><line x1="2" y1="12" x2="13" y2="12"/>');
  const AL_CENTER = _sv('<line x1="3" y1="4" x2="13" y2="4"/><line x1="4" y1="8" x2="12" y2="8"/><line x1="3" y1="12" x2="13" y2="12"/>');
  const AL_RIGHT  = _sv('<line x1="2" y1="4" x2="14" y2="4"/><line x1="6" y1="8" x2="14" y2="8"/><line x1="3" y1="12" x2="14" y2="12"/>');
  const AL_JUST   = _sv('<line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="14" y2="12"/>');

  return `
  <div class="${cls} no-print" style="display:flex;align-items:center;gap:3px;flex-wrap:wrap;">
    <button type="button" class="dio-etb-btn" onmousedown="event.preventDefault()"
      onclick="dioExec('undo')" title="واپس (Ctrl+Z)">↶</button>
    <button type="button" class="dio-etb-btn" onmousedown="event.preventDefault()"
      onclick="dioExec('redo')" title="دوبارہ (Ctrl+Y)">↷</button>
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
    <button type="button" class="dio-etb-btn" onmousedown="event.preventDefault()"
      onclick="dioFontStep(1)" title="فونٹ بڑا">A+</button>
    <button type="button" class="dio-etb-btn" onmousedown="event.preventDefault()"
      onclick="dioFontStep(-1)" title="فونٹ چھوٹا" style="font-size:11px;">A−</button>
    <span class="dio-etb-sep"></span>
    ${AL(AL_RIGHT,  'justifyRight',  'دائیں (Right)')}
    ${AL(AL_CENTER, 'justifyCenter', 'درمیان (Center)')}
    ${AL(AL_LEFT,   'justifyLeft',   'بائیں (Left)')}
    ${AL(AL_JUST,   'justifyFull',   'دونوں طرف برابر (Justify)')}
    <span class="dio-etb-sep"></span>
    <button type="button" class="dio-etb-btn" onmousedown="event.preventDefault()"
      onclick="dioSetDir('rtl')" title="اردو — دائیں سے بائیں (RTL)" style="font-weight:800;">؈</button>
    <button type="button" class="dio-etb-btn" onmousedown="event.preventDefault()"
      onclick="dioSetDir('ltr')" title="English — Left to Right (LTR)" style="font-weight:800;direction:ltr;">EN</button>
    <span class="dio-etb-sep"></span>
    ${B('•', 'insertUnorderedList', 'نقطہ دار فہرست (Bullets)')}
    ${B('1.', 'insertOrderedList', 'نمبر والی فہرست (Numbering)')}
    <span class="dio-etb-sep"></span>
    <button type="button" class="dio-etb-btn" onmousedown="event.preventDefault()"
      onclick="dioFindReplace()" title="ڈھونڈیں اور بدلیں (Find &amp; Replace)">🔎</button>
    <button type="button" class="dio-etb-btn" onmousedown="event.preventDefault()"
      onclick="dioExec('removeFormat')" title="فارمیٹنگ ہٹائیں (Clear)">✕</button>
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
      background:var(--bg-card,#fff); color:var(--text-primary,#111); font-size:13px; }
    .dio-etb-btn:hover{ background:var(--hover-bg,#eef6ff); }
    .dio-etb-btn:active{ transform:translateY(1px); }
    .dio-etb-sel{ height:28px; padding:0 6px; border:1px solid var(--border,#ccc);
      border-radius:6px; background:var(--bg-card,#fff); color:var(--text-primary,#111); font-size:12px; }
    .dio-etb-sep{ width:1px; height:20px; background:var(--border,#ddd); margin:0 3px; }
    @media print{ .dio-etb, .dio-etb-btn, .dio-etb-sel, .dio-etb-sep{ display:none !important; } }
  `;
  document.head.appendChild(st);
}

// ── Commands ──────────────────────────────────────────────────────────
function dioExec(cmd) {
  try { document.execCommand(cmd, false, null); } catch (_) {}
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
        s.innerHTML = f.innerHTML;
        f.replaceWith(s);
      });
      return;
    }
    const el = _dioActiveEditable();
    if (el) el.style.fontSize = pt + 'pt';
  } catch (_) {}
}
window.dioSetFontSize = dioSetFontSize;

// Font chhota/bara
function dioFontStep(dir) {
  const el = _dioActiveEditable();
  const sel = window.getSelection();
  if (sel && !sel.isCollapsed) {
    const cur = parseFloat((el && getComputedStyle(el).fontSize) || '14');
    dioSetFontSize(Math.min(48, Math.max(8, Math.round(cur * 0.75) + (dir > 0 ? 1 : -1))));
    return;
  }
  if (!el) return;
  const cur = parseFloat(getComputedStyle(el).fontSize) || 18.67;
  const pt = Math.round(cur * 0.75);
  el.style.fontSize = Math.min(48, Math.max(8, pt + (dir > 0 ? 1 : -1))) + 'pt';
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
  try { const s = window.getSelection(); node = s && s.anchorNode; } catch (_) {}
  let n = (node && node.nodeType === 1) ? node : (node && node.parentNode);
  let block = null;
  while (n && n !== el && n !== document.body) {
    let disp = '';
    try { disp = getComputedStyle(n).display; } catch (_) {}
    const tag = n.tagName;
    if (disp === 'block' || disp === 'list-item' || tag === 'P' || tag === 'DIV' || tag === 'LI') { block = n; break; }
    n = n.parentNode;
  }
  const target = block || el;
  target.setAttribute('dir', dir);
  target.style.textAlign = (dir === 'rtl') ? 'right' : 'left';
  try { el.focus(); } catch (_) {}
}
window.dioSetDir = dioSetDir;

// ── FIND & REPLACE — MS Word jaisa (chhota panel) ─────────────────────
let _dioFRTarget = null;   // jis editable par kaam ho raha hai
let _dioFRPos = 0;         // agli talash yahan se

function _dioFRPickTarget() {
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

function dioFindReplace() {
  // Target ko ABHI pakad lo (panel ke input par focus jaate hi active editable badal jata hai)
  _dioFRTarget = _dioFRPickTarget();
  if (!_dioFRTarget) { if (typeof showToast === 'function') showToast('پہلے کسی دستاویز کے خانے میں لکھنے کے لیے کلک کریں', 'info'); return; }
  _dioFRPos = 0;
  let p = document.getElementById('dio-fr-panel');
  if (p) { p.style.display = 'block'; document.getElementById('dio-fr-find').focus(); return; }
  p = document.createElement('div');
  p.id = 'dio-fr-panel';
  p.className = 'no-print';
  p.style.cssText =
    'position:fixed;z-index:2147483000;top:64px;left:50%;transform:translateX(-50%);' +
    'background:var(--bg-card,#fff);color:var(--text-primary,#111);border:1px solid var(--border,#ccc);' +
    'border-radius:12px;box-shadow:0 10px 34px rgba(0,0,0,.28);padding:12px 14px;direction:rtl;' +
    "font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;max-width:94vw;width:360px;";
  p.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
      '<span style="font-weight:800;font-size:15px;">🔎 ڈھونڈیں اور بدلیں</span>' +
      '<button type="button" onclick="dioFRClose()" title="بند کریں" style="border:none;background:none;font-size:18px;cursor:pointer;color:var(--text-muted,#777);line-height:1;">✕</button>' +
    '</div>' +
    '<input id="dio-fr-find" type="text" placeholder="کیا ڈھونڈنا ہے؟" ' +
      'style="width:100%;box-sizing:border-box;padding:8px 10px;margin-bottom:7px;border:1px solid var(--border,#ccc);border-radius:8px;background:var(--bg-tertiary,#f6f8fa);color:inherit;font-size:14px;">' +
    '<input id="dio-fr-repl" type="text" placeholder="کس سے بدلنا ہے؟" ' +
      'style="width:100%;box-sizing:border-box;padding:8px 10px;margin-bottom:9px;border:1px solid var(--border,#ccc);border-radius:8px;background:var(--bg-tertiary,#f6f8fa);color:inherit;font-size:14px;">' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
      '<button type="button" onclick="dioFRFindNext()" style="flex:1;min-width:80px;padding:8px;border:1px solid var(--accent,#2563eb);background:var(--bg-tertiary,#eef);color:var(--text-primary,#111);border-radius:8px;cursor:pointer;font-weight:700;font-family:inherit;">ڈھونڈیں ▸</button>' +
      '<button type="button" onclick="dioFRReplaceOne()" style="flex:1;min-width:80px;padding:8px;border:1px solid var(--border,#ccc);background:var(--bg-card,#fff);color:var(--text-primary,#111);border-radius:8px;cursor:pointer;font-weight:700;font-family:inherit;">بدلیں</button>' +
      '<button type="button" onclick="dioFRReplaceAll()" style="flex:1;min-width:96px;padding:8px;border:none;background:var(--accent,#2563eb);color:#fff;border-radius:8px;cursor:pointer;font-weight:800;font-family:inherit;">سب بدلیں</button>' +
    '</div>' +
    '<div id="dio-fr-note" style="margin-top:8px;font-size:12px;color:var(--text-muted,#777);min-height:16px;"></div>';
  document.body.appendChild(p);
  const fi = document.getElementById('dio-fr-find');
  fi.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); dioFRFindNext(); } });
  fi.focus();
}
window.dioFindReplace = dioFindReplace;

function dioFRClose() {
  const p = document.getElementById('dio-fr-panel');
  if (p) p.style.display = 'none';
}
window.dioFRClose = dioFRClose;

function _dioFRNote(msg) {
  const n = document.getElementById('dio-fr-note');
  if (n) n.textContent = msg || '';
}
function _dioFRTextNodes(root) {
  const out = [];
  if (!root) return out;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let t; while ((t = w.nextNode())) out.push(t);
  return out;
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
      r.deleteContents();
      const tn = document.createTextNode(rep);
      r.insertNode(tn);
      // cursor match ke baad
      _dioFRPos = Math.max(0, _dioFRPos - q.length + rep.length);
      try { _dioFRTarget && (_dioFRTarget._dioDirtyPing = true); } catch (_) {}
      _markDirtyMaybe();
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
  nodes.forEach(nd => {
    const before = nd.nodeValue || '';
    if (!before) return;
    const after = before.replace(re, function (m) { count++; return rep; });
    if (after !== before) nd.nodeValue = after;
  });
  if (count > 0) { _markDirtyMaybe(); _dioFRNote(count + ' جگہ بدل دیں ✓'); }
  else _dioFRNote('کوئی نتیجہ نہیں');
}
window.dioFRReplaceAll = dioFRReplaceAll;

// Editor ko "dirty" mark karo (taake wapsi/محفوظ warning theek chale)
function _markDirtyMaybe() {
  try { if (typeof _misalDirty !== 'undefined') window._misalDirty = true; } catch (_) {}
  try { if (typeof _r173Dirty !== 'undefined') window._r173Dirty = true; } catch (_) {}
  try { if (typeof _zimniDirty !== 'undefined') window._zimniDirty = true; } catch (_) {}
  // input event fire karo taake har module ka apna oninput=dirty chal jaye
  try {
    if (_dioFRTarget) _dioFRTarget.dispatchEvent(new Event('input', { bubbles: true }));
  } catch (_) {}
}

// ── Tab / Shift+Tab / keyboard shortcuts ──────────────────────────────
// Tab: editable ke andar asal TAB ki jagah (browser default focus badalta hai)
function dioBindEditor(root) {
  root = root || document;
  dioEditorToolbarCSS();
  root.querySelectorAll('[contenteditable="true"]').forEach(el => {
    if (el._dioKeysBound) return;
    el._dioKeysBound = true;
    el.addEventListener('keydown', function (e) {
      // TAB → khali jagah (focus na badle)
      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) { document.execCommand('outdent'); return; }
        document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
        return;
      }
      // ENTER → nayi satar (khane ke andar hi)
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        try { document.execCommand('insertLineBreak'); }
        catch(_) { try { document.execCommand('insertHTML', false, '<br>'); } catch(__) {} }
        return;
      }
      // Ctrl shortcuts (MS Word jaise)
      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === 'b') { e.preventDefault(); dioExec('bold'); }
        else if (k === 'i') { e.preventDefault(); dioExec('italic'); }
        else if (k === 'u') { e.preventDefault(); dioExec('underline'); }
      }
    });
  });
}
window.dioBindEditor = dioBindEditor;
window.dioEditorToolbar = dioEditorToolbar;
window.dioEditorToolbarCSS = dioEditorToolbarCSS;


// ═══════════════════════════════════════════════════════════════════════
//  FLOATING TOOLBAR — sirf wahan nazar aata hai jahan likhai/tarmeem ho
//  rahi ho. Koi mustaqil (permanent) toolbar nahi.
// ═══════════════════════════════════════════════════════════════════════
let _dioFloatBar = null;
let _dioFloatHideTimer = null;

function _dioEnsureFloatBar() {
  if (_dioFloatBar && document.body.contains(_dioFloatBar)) return _dioFloatBar;
  dioEditorToolbarCSS();
  const bar = document.createElement('div');
  bar.id = 'dio-float-bar';
  bar.className = 'no-print';
  bar.style.cssText =
    'position:fixed; z-index:100000; display:none; gap:3px; align-items:center;' +
    'background:var(--bg-card,#fff); border:1px solid var(--border,#ccc); border-radius:10px;' +
    'padding:5px 7px; box-shadow:0 6px 22px rgba(0,0,0,.18); direction:rtl; flex-wrap:wrap;' +
    'max-width:min(96vw,620px);';
  bar.innerHTML = dioEditorToolbar({ className: 'dio-etb-inner' });
  // Toolbar par click karne se likhne wale khane ka focus na chhute
  bar.addEventListener('mousedown', e => e.preventDefault());
  document.body.appendChild(bar);
  _dioFloatBar = bar;
  return bar;
}

function _dioShowFloatBar(el) {
  if (!el) return;
  clearTimeout(_dioFloatHideTimer);
  const bar = _dioEnsureFloatBar();
  bar.style.display = 'flex';
  // Khane ke ooper rakho; jagah na ho to neeche
  const r  = el.getBoundingClientRect();
  const bh = bar.offsetHeight || 44;
  const bw = bar.offsetWidth  || 420;
  let top = r.top - bh - 8;
  if (top < 8) top = Math.min(r.bottom + 8, window.innerHeight - bh - 8);
  let left = r.left + (r.width / 2) - (bw / 2);
  if (left < 8) left = 8;
  if (left + bw > window.innerWidth - 8) left = Math.max(8, window.innerWidth - bw - 8);
  bar.style.top  = Math.max(8, top) + 'px';
  bar.style.left = left + 'px';
}

function _dioHideFloatBar() {
  _dioFloatHideTimer = setTimeout(() => {
    if (_dioFloatBar) _dioFloatBar.style.display = 'none';
  }, 200);
}

// Poore safhe par: jahan bhi likhne wale khane (contenteditable) mein jayen,
// MS Word jaisa toolbar wahin aa jata hai — is tarah HAR jagah (mojooda aur
// AAGE banne wale NAYE forms bhi) khud-ba-khud toolbar mil jata hai, kisi
// alag file ko chhoo-e baghair.
//
// ── JAHAN TOOLBAR NAHI CHAHIYE (skip list) ───────────────────────────────
// Neeche comma-separated selectors likhen. Jis khane ka ye selector se
// closest match hoga wahan floating toolbar NAHI aayega.
//   • #misal-editor  → is par pehle se OOPER mustaqil toolbar hai (double na ho).
// User jab kahe "falan jagah se hatao" to us jagah ka selector yahan add kar dein.
const _DIO_FLOAT_SKIP = '#misal-editor';

function _dioFloatSkip(el) {
  try { return !!(el && el.closest && _DIO_FLOAT_SKIP && el.closest(_DIO_FLOAT_SKIP)); }
  catch (_) { return false; }
}

function dioEnableFloatingToolbar() {
  if (window._dioFloatBound) return;
  window._dioFloatBound = true;
  document.addEventListener('focusin', e => {
    const el = e.target;
    if (!el || !el.isContentEditable) return;
    if (_dioFloatSkip(el)) { _dioHideFloatBar(); return; }
    dioBindEditor(el.parentNode || document);
    _dioShowFloatBar(el);
  });
  document.addEventListener('focusout', e => {
    if (e.target && e.target.isContentEditable) _dioHideFloatBar();
  });
  window.addEventListener('scroll', () => {
    const a = document.activeElement;
    if (!a || !a.isContentEditable) return;
    if (_dioFloatSkip(a)) return;
    _dioShowFloatBar(a);
  }, true);
  window.addEventListener('resize', () => {
    const a = document.activeElement;
    if (!a || !a.isContentEditable) return;
    if (_dioFloatSkip(a)) return;
    _dioShowFloatBar(a);
  });
}
window.dioEnableFloatingToolbar = dioEnableFloatingToolbar;

// ── KHUD-BA-KHUD chalu — app load hote hi (har jagah + naye forms) ──────────
(function () {
  function _start() { try { dioEnableFloatingToolbar(); } catch (_) {} }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _start);
  else _start();
})();
