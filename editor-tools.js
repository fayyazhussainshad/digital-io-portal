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
