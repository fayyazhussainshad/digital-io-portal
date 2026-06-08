/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — MS WORD-STYLE RIBBON TOOLBAR  (toolbar.js)
   Shared by MISAL document editor and 5-C response editor.
   Exact Word ribbon visual: groups · labels · active states
   ═══════════════════════════════════════════════════════════ */

// ── BUILD TOOLBAR HTML ────────────────────────────────────────
// editorId : ID of the contenteditable div this toolbar controls
// opts      : { showVoice, showSave, onSave, onComplete, onPrint,
//               preserveSel (adds mousedown=preventDefault),
//               titleHtml }
function buildWordToolbar(editorId, opts) {
  opts = opts || {};
  var E   = editorId;
  var ps  = opts.preserveSel ? 'onmousedown="_wbSaveSel();event.preventDefault()" ' : '';
  var psF = opts.preserveSel ? 'onfocus="_wbSaveSel()" '                            : '';

  // Table grid cells (8×8)
  var grid = '';
  for (var gi = 0; gi < 64; gi++) {
    var gr = Math.floor(gi / 8) + 1, gc = (gi % 8) + 1;
    grid += '<div class="wb-tc" data-r="' + gr + '" data-c="' + gc + '"' +
            ' onmouseover="_wbHoverTbl(\'' + E + '\',' + gr + ',' + gc + ')"' +
            ' onclick="_wbInsertTbl(\'' + E + '\',' + gr + ',' + gc + ')"' +
            ' style="width:18px;height:18px;border:1px solid #ccc;border-radius:2px;cursor:pointer;"></div>';
  }

  var html = '<div class="wb-ribbon" id="wbr-' + E + '">';

  // ── GROUP: History ─────────────────────────────────────────
  html += '<div class="wb-grp">' +
    '<div class="wb-gbody wb-gcol">' +
      '<div class="wb-grow">' +
        '<button class="wb-big" ' + ps + 'onclick="_wbExec(\'' + E + '\',\'undo\')" title="Undo (Ctrl+Z)"><span class="wb-ico">↩</span><span class="wb-blab">Undo</span></button>' +
        '<button class="wb-big" ' + ps + 'onclick="_wbExec(\'' + E + '\',\'redo\')" title="Redo (Ctrl+Y)"><span class="wb-ico">↪</span><span class="wb-blab">Redo</span></button>' +
      '</div>' +
    '</div>' +
    '<div class="wb-glab">Clipboard</div>' +
  '</div><div class="wb-div"></div>';

  // ── GROUP: Font ────────────────────────────────────────────
  html += '<div class="wb-grp">' +
    '<div class="wb-gbody wb-gcol">' +
      '<div class="wb-grow">' +
        '<select class="wb-font-sel" ' + psF + 'onchange="' + (opts.preserveSel ? '_wbRestoreSel();' : '') + '_wbFontFamily(\'' + E + '\',this.value)" title="Font Family">' +
          '<option value="\'Jameel Noori Nastaleeq\',\'Noto Nastaliq Urdu\',serif">Jameel Noori Nastaleeq</option>' +
          '<option value="\'Noto Nastaliq Urdu\',serif">Noto Nastaliq Urdu</option>' +
          '<option value="\'Arial\',sans-serif">Arial</option>' +
          '<option value="\'Times New Roman\',serif">Times New Roman</option>' +
          '<option value="\'Georgia\',serif">Georgia</option>' +
          '<option value="\'Courier New\',monospace">Courier New</option>' +
        '</select>' +
        '<input class="wb-sz-inp" type="number" value="14" min="1" max="400" ' + ps + 'onchange="' + (opts.preserveSel ? '_wbRestoreSel();' : '') + '_wbFontSize(\'' + E + '\',this.value)" title="Font Size (pt)">' +
      '</div>' +
      '<div class="wb-grow">' +
        '<button class="wb-btn wb-fmt" id="wbB-' + E + '" ' + ps + 'onclick="_wbExec(\'' + E + '\',\'bold\')" title="Bold (Ctrl+B)"><b>B</b></button>' +
        '<button class="wb-btn wb-fmt wb-it"  id="wbI-' + E + '" ' + ps + 'onclick="_wbExec(\'' + E + '\',\'italic\')" title="Italic (Ctrl+I)"><i>I</i></button>' +
        '<button class="wb-btn wb-fmt wb-ul"  id="wbU-' + E + '" ' + ps + 'onclick="_wbExec(\'' + E + '\',\'underline\')" title="Underline (Ctrl+U)">U</button>' +
        '<button class="wb-btn wb-fmt wb-st"  id="wbS-' + E + '" ' + ps + 'onclick="_wbExec(\'' + E + '\',\'strikeThrough\')" title="Strikethrough">S</button>' +
        '<button class="wb-btn" ' + ps + 'onclick="_wbExec(\'' + E + '\',\'subscript\')" title="Subscript" style="font-size:11px;">X<sub>2</sub></button>' +
        '<button class="wb-btn" ' + ps + 'onclick="_wbExec(\'' + E + '\',\'superscript\')" title="Superscript" style="font-size:11px;">X<sup>2</sup></button>' +
        '<div class="wb-vdiv"></div>' +
        '<label class="wb-clr-btn" title="Font Color" ' + ps + '>A<input type="color" value="#111111" onchange="_wbExec(\'' + E + '\',\'foreColor\',this.value)" style="width:16px;height:12px;padding:0;border:none;cursor:pointer;"><div class="wb-clr-bar" id="wbFClr-' + E + '" style="background:#111;"></div></label>' +
        '<label class="wb-clr-btn" title="Highlight" ' + ps + '>🖊<input type="color" value="#ffff00" onchange="_wbExec(\'' + E + '\',\'hiliteColor\',this.value)" style="width:16px;height:12px;padding:0;border:none;cursor:pointer;"><div class="wb-clr-bar" id="wbHClr-' + E + '" style="background:#ff0;"></div></label>' +
        '<button class="wb-btn" ' + ps + 'onclick="_wbClearFmt(\'' + E + '\')" title="Clear All Formatting" style="font-size:10px;color:#c00;">✕A</button>' +
      '</div>' +
    '</div>' +
    '<div class="wb-glab">Font</div>' +
  '</div><div class="wb-div"></div>';

  // ── GROUP: Paragraph ──────────────────────────────────────
  html += '<div class="wb-grp">' +
    '<div class="wb-gbody wb-gcol">' +
      '<div class="wb-grow">' +
        '<button class="wb-btn" ' + ps + 'onclick="_wbExec(\'' + E + '\',\'insertUnorderedList\')" title="Bullet List">•≡</button>' +
        '<button class="wb-btn" ' + ps + 'onclick="_wbExec(\'' + E + '\',\'insertOrderedList\')" title="Numbered List">1≡</button>' +
        '<button class="wb-btn" ' + ps + 'onclick="_wbExec(\'' + E + '\',\'outdent\')" title="Decrease Indent">⇤</button>' +
        '<button class="wb-btn" ' + ps + 'onclick="_wbExec(\'' + E + '\',\'indent\')" title="Increase Indent">⇥</button>' +
        '<div class="wb-vdiv"></div>' +
        '<button class="wb-btn" id="wbRTL-' + E + '" ' + ps + 'onclick="_wbDir(\'' + E + '\',\'rtl\')" title="Right to Left (Urdu)">RTL ←</button>' +
        '<button class="wb-btn" id="wbLTR-' + E + '" ' + ps + 'onclick="_wbDir(\'' + E + '\',\'ltr\')" title="Left to Right">→ LTR</button>' +
      '</div>' +
      '<div class="wb-grow">' +
        '<button class="wb-btn" id="wbJL-' + E + '" ' + ps + 'onclick="_wbExec(\'' + E + '\',\'justifyLeft\')"   title="Align Left"><span style="font-size:13px;">⬛</span>≡</button>' +
        '<button class="wb-btn" id="wbJC-' + E + '" ' + ps + 'onclick="_wbExec(\'' + E + '\',\'justifyCenter\')" title="Center">≡<span style="font-size:13px;">⬛</span>≡</button>' +
        '<button class="wb-btn" id="wbJR-' + E + '" ' + ps + 'onclick="_wbExec(\'' + E + '\',\'justifyRight\')"  title="Align Right">≡<span style="font-size:13px;">⬛</span></button>' +
        '<button class="wb-btn" id="wbJF-' + E + '" ' + ps + 'onclick="_wbExec(\'' + E + '\',\'justifyFull\')"   title="Justify">⬛≡⬛</button>' +
        '<div class="wb-vdiv"></div>' +
        '<select class="wb-sel" ' + psF + 'onchange="' + (opts.preserveSel ? '_wbRestoreSel();' : '') + '_wbLineSpacing(\'' + E + '\',this.value)" title="Line Spacing" style="width:64px;">' +
          '<option value="1.0">≡ 1.0</option><option value="1.15">≡ 1.15</option>' +
          '<option value="1.5" selected>≡ 1.5</option><option value="2.0">≡ 2.0</option>' +
          '<option value="2.5">≡ 2.5</option><option value="3.0">≡ 3.0</option>' +
        '</select>' +
      '</div>' +
    '</div>' +
    '<div class="wb-glab">Paragraph</div>' +
  '</div><div class="wb-div"></div>';

  // ── GROUP: Insert ─────────────────────────────────────────
  html += '<div class="wb-grp">' +
    '<div class="wb-gbody" style="position:relative;">' +
      '<button class="wb-big" ' + ps + 'onclick="_wbToggleTbl(\'' + E + '\')" title="Insert Table"><span class="wb-ico">⊞</span><span class="wb-blab">Table</span></button>' +
      '<div id="wbtp-' + E + '" class="wb-tbl-picker">' +
        '<div style="font-size:10px;color:#666;text-align:center;margin-bottom:5px;" id="wbtpl-' + E + '">Insert Table</div>' +
        '<div style="display:grid;grid-template-columns:repeat(8,18px);gap:2px;">' + grid + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="wb-glab">Insert</div>' +
  '</div><div class="wb-div"></div>';

  // ── GROUP: Page Layout ────────────────────────────────────
  html += '<div class="wb-grp">' +
    '<div class="wb-gbody wb-gcol">' +
      '<div class="wb-grow">' +
        '<select class="wb-sel" ' + psF + 'onchange="_wbPageSz(\'' + E + '\',this.value)" title="Page Size" style="width:66px;">' +
          '<option value="a4">A4</option><option value="a3">A3</option>' +
          '<option value="legal">Legal</option><option value="letter">Letter</option>' +
        '</select>' +
        '<select class="wb-sel" ' + psF + 'onchange="_wbMarg(\'' + E + '\',this.value)" title="Page Margins" style="width:80px;">' +
          '<option value="20mm">Normal</option><option value="12mm">Narrow</option>' +
          '<option value="25mm">Moderate</option><option value="38mm">Wide</option>' +
        '</select>' +
      '</div>' +
      '<div class="wb-grow">' +
        '<button class="wb-btn" id="wbBrd-' + E + '" ' + ps + 'onclick="_wbBorder(\'' + E + '\')" title="Toggle Page Border">☐ Border</button>' +
      '</div>' +
    '</div>' +
    '<div class="wb-glab">Page Layout</div>' +
  '</div>';

  // ── GROUP: Voice (optional) ───────────────────────────────
  if (opts.showVoice) {
    html += '<div class="wb-div"></div>' +
    '<div class="wb-grp">' +
      '<div class="wb-gbody">' +
        '<button class="wb-big" id="voice-btn" onclick="toggleVoiceInput()" title="Urdu Voice Input (Speak)"><span class="wb-ico">🎙️</span><span class="wb-blab">آواز</span></button>' +
      '</div>' +
      '<div class="wb-glab">Voice</div>' +
    '</div>';
  }

  // ── GROUP: Document actions (Save / Complete / Print) ─────
  if (opts.showSave) {
    html += '<div style="flex:1;min-width:8px;"></div>' +
    '<div class="wb-grp">' +
      '<div class="wb-gbody wb-gcol" style="align-items:flex-end;">' +
        '<div class="wb-grow">' +
          '<button class="wb-doc-save" onclick="' + opts.onSave + '">' + (opts.saveLabel || '💾 Save') + '</button>' +
          (opts.onComplete ? '<button class="wb-doc-done" onclick="' + opts.onComplete + '">' + (opts.completeLabel || '✅ Done') + '</button>' : '') +
          (opts.onPrint    ? '<button class="wb-btn" onclick="' + opts.onPrint + '" title="Print" style="font-size:16px;">🖨️</button>' : '') +
        '</div>' +
        (opts.titleHtml ? '<div class="wb-grow" style="font-family:\'Jameel Noori Nastaleeq\',serif;font-size:12px;color:#0369a1;direction:rtl;">' + opts.titleHtml + '</div>' : '') +
      '</div>' +
      '<div class="wb-glab">Document</div>' +
    '</div>';
  }

  html += '</div>'; // close .wb-ribbon

  // ── STYLES ────────────────────────────────────────────────
  html += '<style>' +
  '.wb-ribbon{background:#f3f3f3;border-bottom:2px solid #c8c8c8;display:flex;align-items:stretch;padding:3px 6px 0;flex-wrap:wrap;user-select:none;font-family:"Segoe UI",Aptos,system-ui,sans-serif;}' +
  '.wb-grp{display:flex;flex-direction:column;padding:2px 3px 0;}' +
  '.wb-gbody{display:flex;align-items:center;gap:2px;flex:1;}' +
  '.wb-gcol{flex-direction:column!important;align-items:flex-start!important;}' +
  '.wb-glab{font-size:9px;color:#777;text-align:center;border-top:1px solid #d4d4d4;padding:2px 0 2px;margin-top:3px;}' +
  '.wb-grow{display:flex;align-items:center;gap:1px;flex-wrap:nowrap;}' +
  '.wb-div{width:1px;background:#c8c8c8;align-self:stretch;margin:0 3px;}' +
  '.wb-vdiv{width:1px;height:18px;background:#c8c8c8;margin:0 2px;flex-shrink:0;}' +
  '.wb-btn{min-width:26px;height:24px;padding:2px 5px;background:transparent;border:1px solid transparent;border-radius:3px;cursor:pointer;font-size:12px;color:#1f1f1f;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;transition:background 0.1s;}' +
  '.wb-btn:hover{background:#d4e2f7;border-color:#6ca8e8;}' +
  '.wb-btn.active{background:#c5d9f7;border-color:#2563eb;font-weight:700;}' +
  '.wb-fmt{font-size:13px;font-weight:800;}' +
  '.wb-it{font-style:italic;}' +
  '.wb-ul{text-decoration:underline;}' +
  '.wb-st{text-decoration:line-through;}' +
  '.wb-big{min-width:44px;min-height:52px;padding:4px 6px;background:transparent;border:1px solid transparent;border-radius:3px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:#1f1f1f;transition:background 0.1s;}' +
  '.wb-big:hover{background:#d4e2f7;border-color:#6ca8e8;}' +
  '.wb-big.active{background:#c5d9f7;border-color:#2563eb;}' +
  '.wb-ico{font-size:20px;line-height:1;}' +
  '.wb-blab{font-size:9px;color:#555;line-height:1;}' +
  '.wb-font-sel{width:170px;height:24px;border:1px solid #bbb;border-radius:3px;font-size:11px;background:#fff;padding:0 4px;cursor:pointer;outline:none;}' +
  '.wb-font-sel:hover,.wb-font-sel:focus{border-color:#2563eb;}' +
  '.wb-sz-inp{width:44px;height:24px;border:1px solid #bbb;border-radius:3px;font-size:11px;background:#fff;text-align:center;padding:0 2px;cursor:pointer;outline:none;}' +
  '.wb-sz-inp:hover,.wb-sz-inp:focus{border-color:#2563eb;}' +
  '.wb-sel{height:24px;border:1px solid #bbb;border-radius:3px;font-size:11px;background:#fff;padding:0 3px;cursor:pointer;outline:none;}' +
  '.wb-sel:hover{border-color:#2563eb;}' +
  '.wb-clr-btn{display:inline-flex;flex-direction:column;align-items:center;gap:1px;min-width:22px;height:24px;padding:2px 3px;background:transparent;border:1px solid transparent;border-radius:3px;cursor:pointer;font-size:11px;color:#1f1f1f;}' +
  '.wb-clr-btn:hover{background:#d4e2f7;border-color:#6ca8e8;}' +
  '.wb-clr-bar{width:16px;height:3px;border-radius:1px;}' +
  '.wb-tbl-picker{display:none;position:absolute;top:calc(100% + 4px);left:0;z-index:9999;background:#fff;border:1px solid #bbb;border-radius:6px;padding:8px;box-shadow:0 4px 16px rgba(0,0,0,0.2);}' +
  '.wb-tbl-picker.open{display:block;}' +
  '.wb-tc:hover,.wb-tc.on{background:rgba(59,130,246,0.25)!important;border-color:#3b82f6!important;}' +
  '.wb-doc-save{padding:5px 14px;background:#0369a1;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:700;margin-right:3px;}' +
  '.wb-doc-save:hover{background:#0284c7;}' +
  '.wb-doc-done{padding:5px 14px;background:#16a34a;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:700;}' +
  '.wb-doc-done:hover{background:#15803d;}' +
  '</style>';

  return html;
}

// ── TOOLBAR ACTIONS ───────────────────────────────────────────

var _wbSavedRange = null;

function _wbSaveSel() {
  var sel = window.getSelection();
  if (sel && sel.rangeCount > 0) _wbSavedRange = sel.getRangeAt(0).cloneRange();
}

function _wbRestoreSel() {
  if (_wbSavedRange) {
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(_wbSavedRange);
  }
}

function _wbExec(editorId, cmd, val) {
  var ed = document.getElementById(editorId);
  if (!ed) return;
  if (_wbSavedRange) _wbRestoreSel();
  ed.focus();
  document.execCommand(cmd, false, val || null);
  _wbUpdateStates(editorId);
  // Update colour bar if colour command
  if (cmd === 'foreColor') { var b = document.getElementById('wbFClr-' + editorId); if (b) b.style.background = val; }
  if (cmd === 'hiliteColor') { var b2 = document.getElementById('wbHClr-' + editorId); if (b2) b2.style.background = val; }
}

function _wbFontFamily(editorId, val) {
  var ed = document.getElementById(editorId);
  if (!ed) return;
  if (_wbSavedRange) _wbRestoreSel();
  var sel = window.getSelection();
  if (sel && sel.toString()) {
    document.execCommand('fontName', false, val);
  } else {
    ed.style.fontFamily = val;
  }
}

function _wbFontSize(editorId, val) {
  var ed = document.getElementById(editorId);
  if (!ed) return;
  if (_wbSavedRange) _wbRestoreSel();
  var sel = window.getSelection();
  if (sel && sel.toString()) {
    document.execCommand('fontSize', false, '7');
    ed.querySelectorAll('font[size="7"]').forEach(function(el) {
      el.removeAttribute('size');
      el.style.fontSize = val + 'pt';
    });
  } else {
    ed.style.fontSize = val + 'pt';
  }
}

function _wbDir(editorId, dir) {
  var ed = document.getElementById(editorId);
  if (!ed) return;
  var sel = window.getSelection();
  var el = null;
  if (sel && sel.rangeCount > 0) {
    el = sel.getRangeAt(0).commonAncestorContainer;
    if (el.nodeType === 3) el = el.parentElement;
    while (el && el !== ed && ['P','DIV','H1','H2','H3','LI','BLOCKQUOTE'].indexOf(el.tagName) === -1) el = el.parentElement;
  }
  var target = (el && el !== ed) ? el : ed;
  target.dir = dir;
  target.style.textAlign = dir === 'rtl' ? 'right' : 'left';
  var r = document.getElementById('wbRTL-' + editorId);
  var l = document.getElementById('wbLTR-' + editorId);
  if (r) r.classList.toggle('active', dir === 'rtl');
  if (l) l.classList.toggle('active', dir === 'ltr');
}

function _wbLineSpacing(editorId, val) {
  var ed = document.getElementById(editorId);
  if (ed) ed.style.lineHeight = val;
}

var _wbSizes = { a4:['210mm','297mm'], a3:['297mm','420mm'], legal:['216mm','356mm'], letter:['216mm','279mm'] };
function _wbPageSz(editorId, val) {
  var ed = document.getElementById(editorId);
  if (!ed) return;
  var s = _wbSizes[val] || _wbSizes.a4;
  ed.style.width = s[0]; ed.style.minHeight = s[1];
}

function _wbMarg(editorId, val) {
  var ed = document.getElementById(editorId);
  if (ed) ed.style.padding = val;
}

var _wbBorderState = {};
function _wbBorder(editorId) {
  var ed = document.getElementById(editorId);
  if (!ed) return;
  _wbBorderState[editorId] = !_wbBorderState[editorId];
  ed.style.border = _wbBorderState[editorId] ? '2px solid #444' : '';
  var btn = document.getElementById('wbBrd-' + editorId);
  if (btn) btn.classList.toggle('active', _wbBorderState[editorId]);
}

function _wbClearFmt(editorId) {
  var ed = document.getElementById(editorId);
  if (!ed) return;
  if (_wbSavedRange) _wbRestoreSel();
  ed.focus();
  document.execCommand('removeFormat', false, null);
}

function _wbToggleTbl(editorId) {
  var p = document.getElementById('wbtp-' + editorId);
  if (p) p.classList.toggle('open');
}

function _wbHoverTbl(editorId, r, c) {
  var p = document.getElementById('wbtp-' + editorId);
  if (!p) return;
  p.querySelectorAll('.wb-tc').forEach(function(el) {
    var on = +el.dataset.r <= r && +el.dataset.c <= c;
    el.classList.toggle('on', on);
    el.style.background = on ? 'rgba(59,130,246,0.25)' : '';
    el.style.borderColor = on ? '#3b82f6' : '#ccc';
  });
  var lbl = document.getElementById('wbtpl-' + editorId);
  if (lbl) lbl.textContent = r + ' × ' + c;
}

function _wbInsertTbl(editorId, rows, cols) {
  var p = document.getElementById('wbtp-' + editorId);
  if (p) p.classList.remove('open');
  var ed = document.getElementById(editorId);
  if (!ed) return;
  if (_wbSavedRange) _wbRestoreSel();
  ed.focus();
  var html = '<table style="border-collapse:collapse;width:100%;margin:8px 0;"><tbody>';
  for (var r = 0; r < rows; r++) {
    html += '<tr>';
    for (var c = 0; c < cols; c++)
      html += '<td style="border:1px solid #999;padding:6px 8px;min-width:50px;" contenteditable="true">&nbsp;</td>';
    html += '</tr>';
  }
  html += '</tbody></table><br>';
  document.execCommand('insertHTML', false, html);
}

// Update bold/italic/underline/alignment active states
function _wbUpdateStates(editorId) {
  try {
    var map = {
      'wbB': 'bold', 'wbI': 'italic', 'wbU': 'underline', 'wbS': 'strikeThrough',
      'wbJL': 'justifyLeft', 'wbJC': 'justifyCenter', 'wbJR': 'justifyRight', 'wbJF': 'justifyFull'
    };
    Object.keys(map).forEach(function(prefix) {
      var btn = document.getElementById(prefix + '-' + editorId);
      if (btn) btn.classList.toggle('active', document.queryCommandState(map[prefix]));
    });
  } catch(e) {}
}

// Setup active-state tracking for an editor (call after editor is in DOM)
function setupWordToolbar(editorId) {
  var ed = document.getElementById(editorId);
  if (!ed) return;
  ed.addEventListener('keyup',   function() { _wbUpdateStates(editorId); });
  ed.addEventListener('mouseup', function() { _wbUpdateStates(editorId); });
  ed.addEventListener('click',   function() { _wbUpdateStates(editorId); });
}

// Close table picker when clicking outside
document.addEventListener('click', function(e) {
  if (!e.target.closest('[onclick*="_wbToggleTbl"]') && !e.target.closest('.wb-tbl-picker')) {
    document.querySelectorAll('.wb-tbl-picker.open').forEach(function(p) { p.classList.remove('open'); });
  }
});
