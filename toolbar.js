/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — MS WORD RIBBON TOOLBAR  (toolbar.js  v2)
   Exact Word Home tab features + Speech-to-Text
   All numbers in English (123456789 not Arabic)
   ═══════════════════════════════════════════════════════════ */

function buildWordToolbar(editorId, opts) {
  opts = opts || {};
  var E   = editorId;
  var ps  = opts.preserveSel ? 'onmousedown="_wbSaveSel();event.preventDefault()" ' : '';
  var psF = opts.preserveSel ? 'onfocus="_wbSaveSel()" ' : '';

  // Table grid (8x8)
  var grid = '';
  for (var gi = 0; gi < 64; gi++) {
    var gr = Math.floor(gi/8)+1, gc = (gi%8)+1;
    grid += '<div class="wb-tc" data-r="'+gr+'" data-c="'+gc+'"'+
            ' onmouseover="_wbHoverTbl(\''+E+'\','+gr+','+gc+')"'+
            ' onclick="_wbInsertTbl(\''+E+'\','+gr+','+gc+')"'+
            ' style="width:18px;height:18px;border:1px solid #ccc;border-radius:2px;cursor:pointer;"></div>';
  }

  var html = '<div class="wb-ribbon" id="wbr-'+E+'">';

  // ══ GROUP: Clipboard ══════════════════════════════════════
  html += '<div class="wb-grp">'+
    '<div class="wb-gbody wb-gcol">'+
      '<div class="wb-grow">'+
        '<button class="wb-big" '+ps+'onclick="_wbPaste(\''+E+'\')" title="Paste (Ctrl+V)"><span class="wb-ico">📋</span><span class="wb-blab">Paste</span></button>'+
      '</div>'+
      '<div class="wb-grow">'+
        '<button class="wb-btn" '+ps+'onclick="_wbExec(\''+E+'\',\'cut\')" title="Cut (Ctrl+X)">✂ Cut</button>'+
        '<button class="wb-btn" '+ps+'onclick="_wbExec(\''+E+'\',\'copy\')" title="Copy (Ctrl+C)">📄 Copy</button>'+
        '<button class="wb-btn" '+ps+'onclick="_wbFormatPainter(\''+E+'\')" title="Format Painter" id="wbFP-'+E+'">🖌 Paint</button>'+
      '</div>'+
    '</div>'+
    '<div class="wb-glab">Clipboard</div>'+
  '</div><div class="wb-div"></div>';

  // ══ GROUP: Font ═══════════════════════════════════════════
  html += '<div class="wb-grp">'+
    '<div class="wb-gbody wb-gcol">'+
      '<div class="wb-grow">'+
        '<select class="wb-font-sel" '+psF+'onchange="'+(opts.preserveSel?'_wbRestoreSel();':'')+'_wbFontFamily(\''+E+'\',this.value)" title="Font Family">'+
          '<option value="\'Jameel Noori Nastaleeq\',\'Noto Nastaliq Urdu\',serif">Jameel Noori Nastaleeq</option>'+
          '<option value="\'Noto Nastaliq Urdu\',serif">Noto Nastaliq Urdu</option>'+
          '<option value="\'Arial\',sans-serif">Arial</option>'+
          '<option value="\'Times New Roman\',serif">Times New Roman</option>'+
          '<option value="\'Georgia\',serif">Georgia</option>'+
          '<option value="\'Courier New\',monospace">Courier New</option>'+
        '</select>'+
        '<input class="wb-sz-inp" type="number" value="14" min="1" max="400" '+ps+'onchange="'+(opts.preserveSel?'_wbRestoreSel();':'')+'_wbFontSize(\''+E+'\',this.value)" title="Font Size" id="wbSZ-'+E+'">'+
        '<button class="wb-btn" '+ps+'onclick="_wbFontSizeAdj(\''+E+'\',1)" title="Increase Font Size">A↑</button>'+
        '<button class="wb-btn" '+ps+'onclick="_wbFontSizeAdj(\''+E+'\',-1)" title="Decrease Font Size">A↓</button>'+
        '<button class="wb-btn" '+ps+'onclick="_wbChangeCase(\''+E+'\')" title="Change Case">Aa</button>'+
      '</div>'+
      '<div class="wb-grow">'+
        '<button class="wb-btn wb-fmt" id="wbB-'+E+'" '+ps+'onclick="_wbExec(\''+E+'\',\'bold\')" title="Bold (Ctrl+B)"><b>B</b></button>'+
        '<button class="wb-btn wb-fmt wb-it" id="wbI-'+E+'" '+ps+'onclick="_wbExec(\''+E+'\',\'italic\')" title="Italic (Ctrl+I)"><i>I</i></button>'+
        '<button class="wb-btn wb-fmt wb-ul" id="wbU-'+E+'" '+ps+'onclick="_wbExec(\''+E+'\',\'underline\')" title="Underline (Ctrl+U)">U</button>'+
        '<button class="wb-btn wb-fmt wb-st" id="wbS-'+E+'" '+ps+'onclick="_wbExec(\''+E+'\',\'strikeThrough\')" title="Strikethrough">S</button>'+
        '<button class="wb-btn" '+ps+'onclick="_wbExec(\''+E+'\',\'subscript\')" title="Subscript" style="font-size:11px;">X<sub>2</sub></button>'+
        '<button class="wb-btn" '+ps+'onclick="_wbExec(\''+E+'\',\'superscript\')" title="Superscript" style="font-size:11px;">X<sup>2</sup></button>'+
        '<div class="wb-vdiv"></div>'+
        '<label class="wb-clr-btn" title="Font Color" '+ps+'><span style="font-weight:700;text-decoration:underline;text-decoration-color:#e00;">A</span><input type="color" value="#111111" onchange="_wbExec(\''+E+'\',\'foreColor\',this.value);document.getElementById(\'wbFClr-'+E+'\').style.background=this.value" style="width:16px;height:12px;padding:0;border:none;cursor:pointer;"><div class="wb-clr-bar" id="wbFClr-'+E+'" style="background:#111;"></div></label>'+
        '<label class="wb-clr-btn" title="Highlight Color" '+ps+'><span style="background:#ff0;padding:0 2px;">ab</span><input type="color" value="#ffff00" onchange="_wbExec(\''+E+'\',\'hiliteColor\',this.value);document.getElementById(\'wbHClr-'+E+'\').style.background=this.value" style="width:16px;height:12px;padding:0;border:none;cursor:pointer;"><div class="wb-clr-bar" id="wbHClr-'+E+'" style="background:#ff0;"></div></label>'+
        '<button class="wb-btn" '+ps+'onclick="_wbClearFmt(\''+E+'\')" title="Clear All Formatting" style="font-size:10px;color:#c00;">✕A</button>'+
      '</div>'+
    '</div>'+
    '<div class="wb-glab">Font</div>'+
  '</div><div class="wb-div"></div>';

  // ══ GROUP: Paragraph ══════════════════════════════════════
  html += '<div class="wb-grp">'+
    '<div class="wb-gbody wb-gcol">'+
      '<div class="wb-grow">'+
        '<button class="wb-btn" '+ps+'onclick="_wbExec(\''+E+'\',\'insertUnorderedList\')" title="Bullet List">•≡</button>'+
        '<button class="wb-btn" '+ps+'onclick="_wbExec(\''+E+'\',\'insertOrderedList\')" title="Numbered List (1,2,3...)">1≡</button>'+
        '<button class="wb-btn" '+ps+'onclick="_wbOutdent(\''+E+'\')" title="Decrease Indent">⇤</button>'+
        '<button class="wb-btn" '+ps+'onclick="_wbExec(\''+E+'\',\'indent\')" title="Increase Indent">⇥</button>'+
        '<div class="wb-vdiv"></div>'+
        '<button class="wb-btn" id="wbRTL-'+E+'" '+ps+'onclick="_wbDir(\''+E+'\',\'rtl\')" title="Right to Left (Urdu)">RTL ←</button>'+
        '<button class="wb-btn" id="wbLTR-'+E+'" '+ps+'onclick="_wbDir(\''+E+'\',\'ltr\')" title="Left to Right">→ LTR</button>'+
        '<div class="wb-vdiv"></div>'+
        '<button class="wb-btn" '+ps+'onclick="_wbShowHide(\''+E+'\')" title="Show/Hide Formatting Marks">¶</button>'+
      '</div>'+
      '<div class="wb-grow">'+
        '<button class="wb-btn" id="wbJL-'+E+'" '+ps+'onclick="_wbExec(\''+E+'\',\'justifyLeft\')"   title="Align Left">⬛≡</button>'+
        '<button class="wb-btn" id="wbJC-'+E+'" '+ps+'onclick="_wbExec(\''+E+'\',\'justifyCenter\')" title="Center">≡⬛≡</button>'+
        '<button class="wb-btn" id="wbJR-'+E+'" '+ps+'onclick="_wbExec(\''+E+'\',\'justifyRight\')"  title="Align Right">≡⬛</button>'+
        '<button class="wb-btn" id="wbJF-'+E+'" '+ps+'onclick="_wbExec(\''+E+'\',\'justifyFull\')"   title="Justify">⬛≡⬛</button>'+
        '<div class="wb-vdiv"></div>'+
        '<select class="wb-sel" '+psF+'onchange="'+(opts.preserveSel?'_wbRestoreSel();':'')+'_wbLineSpacing(\''+E+'\',this.value)" title="Line Spacing" style="width:66px;">'+
          '<option value="1.0">≡ 1.0</option>'+
          '<option value="1.15">≡ 1.15</option>'+
          '<option value="1.5" selected>≡ 1.5</option>'+
          '<option value="2.0">≡ 2.0</option>'+
          '<option value="2.5">≡ 2.5</option>'+
          '<option value="3.0">≡ 3.0</option>'+
        '</select>'+
        '<div class="wb-vdiv"></div>'+
        '<button class="wb-btn" '+ps+'onclick="_wbBorderBox(\''+E+'\')" title="Borders">⊞</button>'+
      '</div>'+
    '</div>'+
    '<div class="wb-glab">Paragraph</div>'+
  '</div><div class="wb-div"></div>';

  // ══ GROUP: Styles ═════════════════════════════════════════
  html += '<div class="wb-grp">'+
    '<div class="wb-gbody">'+
      '<button class="wb-style-btn" '+ps+'onclick="_wbStyle(\''+E+'\',\'p\')" title="Normal">Normal</button>'+
      '<button class="wb-style-btn" style="font-size:15px;font-weight:700;" '+ps+'onclick="_wbStyle(\''+E+'\',\'h1\')" title="Heading 1">H1</button>'+
      '<button class="wb-style-btn" style="font-size:13px;font-weight:700;" '+ps+'onclick="_wbStyle(\''+E+'\',\'h2\')" title="Heading 2">H2</button>'+
      '<button class="wb-style-btn" style="font-size:12px;font-weight:700;" '+ps+'onclick="_wbStyle(\''+E+'\',\'h3\')" title="Heading 3">H3</button>'+
      '<button class="wb-style-btn" style="font-weight:700;letter-spacing:1px;" '+ps+'onclick="_wbStyle(\''+E+'\',\'title\')" title="Title">Title</button>'+
    '</div>'+
    '<div class="wb-glab">Styles</div>'+
  '</div><div class="wb-div"></div>';

  // ══ GROUP: Insert ═════════════════════════════════════════
  html += '<div class="wb-grp">'+
    '<div class="wb-gbody" style="position:relative;">'+
      '<button class="wb-big" '+ps+'onclick="_wbToggleTbl(\''+E+'\')" title="Insert Table"><span class="wb-ico">⊞</span><span class="wb-blab">Table</span></button>'+
      '<div id="wbtp-'+E+'" class="wb-tbl-picker">'+
        '<div style="font-size:10px;color:#666;text-align:center;margin-bottom:5px;" id="wbtpl-'+E+'">Insert Table</div>'+
        '<div style="display:grid;grid-template-columns:repeat(8,18px);gap:2px;">'+grid+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="wb-glab">Insert</div>'+
  '</div><div class="wb-div"></div>';

  // ══ GROUP: Page Layout ════════════════════════════════════
  html += '<div class="wb-grp">'+
    '<div class="wb-gbody wb-gcol">'+
      '<div class="wb-grow">'+
        '<select class="wb-sel" '+psF+'onchange="_wbPageSz(\''+E+'\',this.value)" title="Page Size" style="width:66px;">'+
          '<option value="a4">A4</option><option value="a3">A3</option>'+
          '<option value="legal">Legal</option><option value="letter">Letter</option>'+
        '</select>'+
        '<select class="wb-sel" '+psF+'onchange="_wbMarg(\''+E+'\',this.value)" title="Margins" style="width:80px;">'+
          '<option value="20mm">Normal</option><option value="12mm">Narrow</option>'+
          '<option value="25mm">Moderate</option><option value="38mm">Wide</option>'+
        '</select>'+
      '</div>'+
      '<div class="wb-grow">'+
        '<button class="wb-btn" id="wbBrd-'+E+'" '+ps+'onclick="_wbBorder(\''+E+'\')" title="Page Border">☐ Border</button>'+
      '</div>'+
    '</div>'+
    '<div class="wb-glab">Page Layout</div>'+
  '</div><div class="wb-div"></div>';

  // ══ GROUP: Editing ════════════════════════════════════════
  html += '<div class="wb-grp">'+
    '<div class="wb-gbody wb-gcol">'+
      '<div class="wb-grow">'+
        '<button class="wb-btn" '+ps+'onclick="_wbFind(\''+E+'\')" title="Find (Ctrl+F)">🔍 Find</button>'+
        '<button class="wb-btn" '+ps+'onclick="_wbReplace(\''+E+'\')" title="Find & Replace">↔ Replace</button>'+
      '</div>'+
      '<div class="wb-grow">'+
        '<button class="wb-btn" '+ps+'onclick="_wbExec(\''+E+'\',\'undo\')" title="Undo (Ctrl+Z)">↩ Undo</button>'+
        '<button class="wb-btn" '+ps+'onclick="_wbExec(\''+E+'\',\'redo\')" title="Redo (Ctrl+Y)">↪ Redo</button>'+
      '</div>'+
    '</div>'+
    '<div class="wb-glab">Editing</div>'+
  '</div>';

  // ══ GROUP: Voice (optional) ═══════════════════════════════
  if (opts.showVoice) {
    html += '<div class="wb-div"></div>'+
    '<div class="wb-grp">'+
      '<div class="wb-gbody">'+
        '<button class="wb-big" id="voice-btn" onclick="toggleVoiceInput()" title="Urdu Voice Input"><span class="wb-ico">🎙️</span><span class="wb-blab">آواز</span></button>'+
      '</div>'+
      '<div class="wb-glab">Voice</div>'+
    '</div>';
  }

  // ══ GROUP: Document actions ═══════════════════════════════
  if (opts.showSave) {
    html += '<div style="flex:1;min-width:8px;"></div>'+
    '<div class="wb-grp">'+
      '<div class="wb-gbody wb-gcol">'+
        '<div class="wb-grow">'+
          '<button class="wb-doc-save" onclick="'+opts.onSave+'">'+(opts.saveLabel||'💾 Save')+'</button>'+
          (opts.onComplete?'<button class="wb-doc-done" onclick="'+opts.onComplete+'">'+(opts.completeLabel||'✅ Done')+'</button>':'')+
          (opts.onPrint?'<button class="wb-btn" onclick="'+opts.onPrint+'" title="Print" style="font-size:16px;">🖨️</button>':'')+
        '</div>'+
        (opts.titleHtml?'<div class="wb-grow" style="font-family:\'Jameel Noori Nastaleeq\',serif;font-size:12px;color:#0369a1;direction:rtl;">'+opts.titleHtml+'</div>':'')+
      '</div>'+
      '<div class="wb-glab">Document</div>'+
    '</div>';
  }

  html += '</div>';

  // ══ STYLES ════════════════════════════════════════════════
  html += '<style>'+
  '.wb-ribbon{background:#f3f3f3;border-bottom:2px solid #c8c8c8;display:flex;align-items:stretch;padding:3px 6px 0;flex-wrap:wrap;user-select:none;font-family:"Segoe UI",system-ui,sans-serif;}'+
  '.wb-grp{display:flex;flex-direction:column;padding:2px 3px 0;}'+
  '.wb-gbody{display:flex;align-items:center;gap:2px;flex:1;}'+
  '.wb-gcol{flex-direction:column!important;align-items:flex-start!important;}'+
  '.wb-glab{font-size:9px;color:#777;text-align:center;border-top:1px solid #d4d4d4;padding:2px 0;margin-top:3px;}'+
  '.wb-grow{display:flex;align-items:center;gap:1px;flex-wrap:nowrap;}'+
  '.wb-div{width:1px;background:#c8c8c8;align-self:stretch;margin:0 3px;}'+
  '.wb-vdiv{width:1px;height:18px;background:#c8c8c8;margin:0 2px;flex-shrink:0;}'+
  '.wb-btn{min-width:26px;height:24px;padding:2px 5px;background:transparent;border:1px solid transparent;border-radius:3px;cursor:pointer;font-size:12px;color:#1f1f1f;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;transition:background 0.1s;}'+
  '.wb-btn:hover{background:#d4e2f7;border-color:#6ca8e8;}'+
  '.wb-btn.active{background:#c5d9f7;border-color:#2563eb;font-weight:700;}'+
  '.wb-fmt{font-size:13px;font-weight:800;}.wb-it{font-style:italic;}.wb-ul{text-decoration:underline;}.wb-st{text-decoration:line-through;}'+
  '.wb-big{min-width:44px;min-height:52px;padding:4px 6px;background:transparent;border:1px solid transparent;border-radius:3px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:#1f1f1f;transition:background 0.1s;}'+
  '.wb-big:hover{background:#d4e2f7;border-color:#6ca8e8;}'+
  '.wb-ico{font-size:20px;line-height:1;}.wb-blab{font-size:9px;color:#555;line-height:1;}'+
  '.wb-font-sel{width:168px;height:24px;border:1px solid #bbb;border-radius:3px;font-size:11px;background:#fff;padding:0 4px;cursor:pointer;outline:none;}'+
  '.wb-font-sel:hover,.wb-font-sel:focus{border-color:#2563eb;}'+
  '.wb-sz-inp{width:44px;height:24px;border:1px solid #bbb;border-radius:3px;font-size:11px;background:#fff;text-align:center;padding:0 2px;outline:none;}'+
  '.wb-sz-inp:hover,.wb-sz-inp:focus{border-color:#2563eb;}'+
  '.wb-sel{height:24px;border:1px solid #bbb;border-radius:3px;font-size:11px;background:#fff;padding:0 3px;cursor:pointer;outline:none;}'+
  '.wb-sel:hover{border-color:#2563eb;}'+
  '.wb-clr-btn{display:inline-flex;flex-direction:column;align-items:center;gap:1px;min-width:22px;height:24px;padding:2px 3px;background:transparent;border:1px solid transparent;border-radius:3px;cursor:pointer;font-size:11px;color:#1f1f1f;}'+
  '.wb-clr-btn:hover{background:#d4e2f7;border-color:#6ca8e8;}'+
  '.wb-clr-bar{width:16px;height:3px;border-radius:1px;}'+
  '.wb-style-btn{padding:3px 8px;border:1px solid transparent;border-radius:3px;background:transparent;cursor:pointer;font-size:11px;color:#1f1f1f;white-space:nowrap;height:54px;display:flex;align-items:center;justify-content:center;}'+
  '.wb-style-btn:hover{background:#d4e2f7;border-color:#6ca8e8;}'+
  '.wb-tbl-picker{display:none;position:absolute;top:calc(100% + 4px);left:0;z-index:9999;background:#fff;border:1px solid #bbb;border-radius:6px;padding:8px;box-shadow:0 4px 16px rgba(0,0,0,0.2);}'+
  '.wb-tbl-picker.open{display:block;}'+
  '.wb-tc:hover,.wb-tc.on{background:rgba(59,130,246,0.25)!important;border-color:#3b82f6!important;}'+
  '.wb-doc-save{padding:5px 14px;background:#0369a1;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:700;margin-right:3px;}'+
  '.wb-doc-save:hover{background:#0284c7;}'+
  '.wb-doc-done{padding:5px 14px;background:#16a34a;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:700;}'+
  '.wb-doc-done:hover{background:#15803d;}'+
  '#wb-find-bar{position:sticky;top:0;z-index:100;background:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:8px 12px;margin:4px;display:flex;align-items:center;gap:8px;}'+
  '</style>';

  return html;
}

// ══ TOOLBAR ACTIONS ══════════════════════════════════════════

var _wbSavedRange = null;
var _wbFPActive   = false;
var _wbFPStyle    = null;

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
}

function _wbPaste(editorId) {
  var ed = document.getElementById(editorId);
  if (!ed) return;
  ed.focus();
  navigator.clipboard.readText().then(function(txt) {
    document.execCommand('insertText', false, txt);
  }).catch(function() {
    document.execCommand('paste', false, null);
  });
}

function _wbFontFamily(editorId, val) {
  var ed = document.getElementById(editorId);
  if (!ed) return;
  if (_wbSavedRange) _wbRestoreSel();
  var sel = window.getSelection();
  if (sel && sel.toString()) { document.execCommand('fontName', false, val); }
  else { ed.style.fontFamily = val; }
}

function _wbFontSize(editorId, val) {
  var ed = document.getElementById(editorId);
  if (!ed) return;
  if (_wbSavedRange) _wbRestoreSel();
  var sel = window.getSelection();
  if (sel && sel.toString()) {
    document.execCommand('fontSize', false, '7');
    ed.querySelectorAll('font[size="7"]').forEach(function(el) {
      el.removeAttribute('size'); el.style.fontSize = val + 'pt';
    });
  } else { ed.style.fontSize = val + 'pt'; }
}

function _wbFontSizeAdj(editorId, delta) {
  var inp = document.getElementById('wbSZ-' + editorId);
  var cur = inp ? (parseInt(inp.value) || 14) : 14;
  var nxt = Math.max(6, Math.min(400, cur + delta));
  if (inp) inp.value = nxt;
  _wbFontSize(editorId, nxt);
}

function _wbChangeCase(editorId) {
  var ed = document.getElementById(editorId);
  if (!ed) return;
  if (_wbSavedRange) _wbRestoreSel();
  var sel = window.getSelection();
  if (!sel || !sel.toString()) return;
  var txt = sel.toString();
  var newTxt = txt === txt.toUpperCase() ? txt.toLowerCase() :
               txt === txt.toLowerCase() ? txt.replace(/\b\w/g, function(c){return c.toUpperCase();}) :
               txt.toUpperCase();
  document.execCommand('insertText', false, newTxt);
}

function _wbDir(editorId, dir) {
  var ed = document.getElementById(editorId);
  if (!ed) return;
  var sel = window.getSelection();
  var el = null;
  if (sel && sel.rangeCount > 0) {
    el = sel.getRangeAt(0).commonAncestorContainer;
    if (el.nodeType === 3) el = el.parentElement;
    while (el && el !== ed && ['P','DIV','H1','H2','H3','LI'].indexOf(el.tagName) === -1) el = el.parentElement;
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

function _wbOutdent(editorId) {
  var ed = document.getElementById(editorId); if (!ed) return;
  if (_wbSavedRange) _wbRestoreSel();
  ed.focus();
  document.execCommand('outdent', false, null);
}

function _wbStyle(editorId, tag) {
  var ed = document.getElementById(editorId); if (!ed) return;
  if (_wbSavedRange) _wbRestoreSel();
  ed.focus();
  if (tag === 'title') {
    document.execCommand('formatBlock', false, 'h1');
    document.execCommand('fontSize', false, '7');
    ed.querySelectorAll('font[size="7"]').forEach(function(el) {
      el.removeAttribute('size'); el.style.fontSize = '24pt'; el.style.letterSpacing = '2px';
    });
  } else {
    document.execCommand('formatBlock', false, tag);
  }
}

function _wbShowHide(editorId) {
  var ed = document.getElementById(editorId); if (!ed) return;
  ed._showPara = !ed._showPara;
  ed.style.whiteSpace = ed._showPara ? 'pre-wrap' : '';
}

function _wbBorderBox(editorId) {
  var ed = document.getElementById(editorId); if (!ed) return;
  if (_wbSavedRange) _wbRestoreSel();
  ed.focus();
  document.execCommand('insertHTML', false, '<span style="border:1px solid #333;padding:2px 4px;">'+( window.getSelection()?.toString()||'text')+'</span>');
}

// Format Painter
function _wbFormatPainter(editorId) {
  var ed = document.getElementById(editorId); if (!ed) return;
  var btn = document.getElementById('wbFP-' + editorId);
  if (_wbFPActive) {
    _wbFPActive = false; _wbFPStyle = null;
    if (btn) { btn.style.background = ''; btn.style.borderColor = ''; }
    return;
  }
  var sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    var el = sel.getRangeAt(0).startContainer;
    if (el.nodeType === 3) el = el.parentElement;
    _wbFPStyle = el.style.cssText;
    _wbFPActive = true;
    if (btn) { btn.style.background = '#c5d9f7'; btn.style.borderColor = '#2563eb'; }
    showToast && showToast('🖌 Format Painter active — select text to apply', 'info', 2000);
    ed.addEventListener('mouseup', function _fpApply() {
      if (!_wbFPActive) { ed.removeEventListener('mouseup', _fpApply); return; }
      var s = window.getSelection();
      if (s && s.toString() && _wbFPStyle) {
        document.execCommand('insertHTML', false,
          '<span style="'+_wbFPStyle+'">'+s.toString()+'</span>');
      }
      _wbFPActive = false; _wbFPStyle = null;
      if (btn) { btn.style.background = ''; btn.style.borderColor = ''; }
      ed.removeEventListener('mouseup', _fpApply);
    });
  }
}

// Find & Replace
function _wbFind(editorId) {
  var ed = document.getElementById(editorId); if (!ed) return;
  var existing = document.getElementById('wb-find-bar');
  if (existing) { existing.remove(); return; }
  var bar = document.createElement('div');
  bar.id = 'wb-find-bar';
  bar.innerHTML = '<span style="font-size:12px;font-weight:600;">Find:</span>'+
    '<input id="wb-find-inp" placeholder="Search in document..." style="border:1px solid #ccc;border-radius:4px;padding:4px 8px;font-size:12px;width:180px;">'+
    '<button onclick="_wbDoFind(\''+editorId+'\')" style="padding:4px 10px;background:#0369a1;color:#fff;border:none;border-radius:4px;font-size:12px;cursor:pointer;">Find</button>'+
    '<span style="font-size:12px;font-weight:600;margin-left:8px;">Replace:</span>'+
    '<input id="wb-rep-inp" placeholder="Replace with..." style="border:1px solid #ccc;border-radius:4px;padding:4px 8px;font-size:12px;width:150px;">'+
    '<button onclick="_wbDoReplace(\''+editorId+'\')" style="padding:4px 10px;background:#16a34a;color:#fff;border:none;border-radius:4px;font-size:12px;cursor:pointer;">Replace All</button>'+
    '<button onclick="document.getElementById(\'wb-find-bar\').remove()" style="padding:4px 8px;background:transparent;border:none;font-size:16px;cursor:pointer;color:#666;">✕</button>';
  ed.parentElement.insertBefore(bar, ed);
  document.getElementById('wb-find-inp').focus();
}

function _wbReplace(editorId) { _wbFind(editorId); }

function _wbDoFind(editorId) {
  var q = document.getElementById('wb-find-inp')?.value; if (!q) return;
  var ed = document.getElementById(editorId); if (!ed) return;
  var html = ed.innerHTML;
  var highlighted = html.replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),
    '<mark style="background:#ffff00;">$&</mark>');
  ed.innerHTML = highlighted;
}

function _wbDoReplace(editorId) {
  var q = document.getElementById('wb-find-inp')?.value;
  var r = document.getElementById('wb-rep-inp')?.value || '';
  if (!q) return;
  var ed = document.getElementById(editorId); if (!ed) return;
  ed.innerHTML = ed.innerHTML.replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'), r);
  showToast && showToast('✅ Replace complete', 'success', 2000);
}

// Page layout
var _wbSizes = { a4:['210mm','297mm'], a3:['297mm','420mm'], legal:['216mm','356mm'], letter:['216mm','279mm'] };
function _wbPageSz(editorId, val) {
  var ed = document.getElementById(editorId); if (!ed) return;
  var s = _wbSizes[val] || _wbSizes.a4;
  ed.style.width = s[0]; ed.style.minHeight = s[1];
}
function _wbMarg(editorId, val) {
  var ed = document.getElementById(editorId); if (ed) ed.style.padding = val;
}
var _wbBorderState = {};
function _wbBorder(editorId) {
  var ed = document.getElementById(editorId); if (!ed) return;
  _wbBorderState[editorId] = !_wbBorderState[editorId];
  ed.style.border = _wbBorderState[editorId] ? '2px solid #444' : '';
  var btn = document.getElementById('wbBrd-' + editorId);
  if (btn) btn.classList.toggle('active', _wbBorderState[editorId]);
}
function _wbClearFmt(editorId) {
  var ed = document.getElementById(editorId); if (!ed) return;
  if (_wbSavedRange) _wbRestoreSel();
  ed.focus(); document.execCommand('removeFormat', false, null);
}

// Table
function _wbToggleTbl(editorId) {
  var p = document.getElementById('wbtp-' + editorId);
  if (p) p.classList.toggle('open');
}
function _wbHoverTbl(editorId, r, c) {
  var p = document.getElementById('wbtp-' + editorId); if (!p) return;
  p.querySelectorAll('.wb-tc').forEach(function(el) {
    var on = +el.dataset.r <= r && +el.dataset.c <= c;
    el.classList.toggle('on', on);
    el.style.background = on ? 'rgba(59,130,246,0.25)' : '';
    el.style.borderColor = on ? '#3b82f6' : '#ccc';
  });
  var lbl = document.getElementById('wbtpl-' + editorId);
  if (lbl) lbl.textContent = r + ' x ' + c;
}
function _wbInsertTbl(editorId, rows, cols) {
  var p = document.getElementById('wbtp-' + editorId);
  if (p) p.classList.remove('open');
  var ed = document.getElementById(editorId); if (!ed) return;
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

// Active states
function _wbUpdateStates(editorId) {
  try {
    var map = { 'wbB':'bold','wbI':'italic','wbU':'underline','wbS':'strikeThrough',
                'wbJL':'justifyLeft','wbJC':'justifyCenter','wbJR':'justifyRight','wbJF':'justifyFull' };
    Object.keys(map).forEach(function(prefix) {
      var btn = document.getElementById(prefix + '-' + editorId);
      if (btn) btn.classList.toggle('active', document.queryCommandState(map[prefix]));
    });
    // Sync font size display
    var sz = document.queryCommandValue('fontSize');
    var inp = document.getElementById('wbSZ-' + editorId);
    if (inp && sz && sz !== '0') inp.value = sz;
  } catch(_) {}
}

function setupWordToolbar(editorId) {
  var ed = document.getElementById(editorId); if (!ed) return;
  ed.addEventListener('keyup',   function() { _wbUpdateStates(editorId); });
  ed.addEventListener('mouseup', function() { _wbUpdateStates(editorId); });
  ed.addEventListener('click',   function() { _wbUpdateStates(editorId); });
  // Enforce English numerals in output
  ed.addEventListener('input', function() {
    var arabicNums = /[\u0660-\u0669\u06F0-\u06F9]/g;
    if (arabicNums.test(ed.innerHTML)) {
      var sel = window.getSelection();
      var range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
      ed.innerHTML = ed.innerHTML.replace(/[\u0660-\u0669]/g, function(c){return String.fromCharCode(c.charCodeAt(0) - 0x0660 + 48);})
                                 .replace(/[\u06F0-\u06F9]/g, function(c){return String.fromCharCode(c.charCodeAt(0) - 0x06F0 + 48);});
    }
  });
}

// Close table picker on outside click
document.addEventListener('click', function(e) {
  if (!e.target.closest('[onclick*="_wbToggleTbl"]') && !e.target.closest('.wb-tbl-picker')) {
    document.querySelectorAll('.wb-tbl-picker.open').forEach(function(p) { p.classList.remove('open'); });
  }
});
