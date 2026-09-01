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
    ${B('≡', 'justifyRight', 'دائیں')}
    ${B('☰', 'justifyCenter', 'درمیان')}
    ${B('⚌', 'justifyFull', 'دونوں طرف برابر')}
    <span class="dio-etb-sep"></span>
    ${B('•', 'insertUnorderedList', 'نقطہ دار فہرست')}
    ${B('1.', 'insertOrderedList', 'نمبر والی فہرست')}
    <span class="dio-etb-sep"></span>
    <button type="button" class="dio-etb-btn" onmousedown="event.preventDefault()"
      onclick="dioExec('removeFormat')" title="فارمیٹنگ ہٹائیں">✕</button>
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

// Poore safhe par: jahan bhi likhne wale khane mein jayen, toolbar wahin aa jaye
function dioEnableFloatingToolbar() {
  if (window._dioFloatBound) return;
  window._dioFloatBound = true;
  document.addEventListener('focusin', e => {
    const el = e.target;
    if (!el || !el.isContentEditable) return;
    // چالان اور سزا سلپ کے صفحے پر تیرتی پٹی نہیں — وہاں اوپر اپنی مستقل toolbar موجود ہے
    try { if (el.closest && el.closest('#ch173-doc, #saza-doc')) { _dioHideFloatBar(); return; } } catch(_) {}
    dioBindEditor(el.parentNode || document);
    _dioShowFloatBar(el);
  });
  document.addEventListener('focusout', e => {
    if (e.target && e.target.isContentEditable) _dioHideFloatBar();
  });
  window.addEventListener('scroll', () => {
    const a = document.activeElement;
    if (!a || !a.isContentEditable) return;
    try { if (a.closest && a.closest('#ch173-doc, #saza-doc')) return; } catch(_) {}
    _dioShowFloatBar(a);
  }, true);
  window.addEventListener('resize', () => {
    const a = document.activeElement;
    if (!a || !a.isContentEditable) return;
    try { if (a.closest && a.closest('#ch173-doc, #saza-doc')) return; } catch(_) {}
    _dioShowFloatBar(a);
  });
}
window.dioEnableFloatingToolbar = dioEnableFloatingToolbar;
document.addEventListener('DOMContentLoaded', dioEnableFloatingToolbar);
if (document.readyState !== 'loading') dioEnableFloatingToolbar();
