/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — رپورٹ ضمنی (ZIMNI / PROGRESS REPORT)
   Police Form 25-54(1) — rich text editor
   ═══════════════════════════════════════════════════════════ */

let _zimniCaseId = null;
let _zimniCase   = null;
let _zimniList   = [];
let _zimniActive = null;  // currently open zimni record

// ── ENTRY POINT (called when ضمنیات/میمورنڈم button pressed) ──
async function openZimniEditor(caseId) {
  _zimniCaseId = caseId || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
              || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  if (typeof getCase === 'function' && _zimniCaseId) {
    try { _zimniCase = await getCase(_zimniCaseId); } catch(_) { _zimniCase = null; }
  }
  await _loadZimni();
  _renderZimniList();
}

async function _loadZimni() {
  if (!navigator.onLine) {
    try { _zimniList = JSON.parse(localStorage.getItem('dio_zimni_' + _zimniCaseId) || '[]'); }
    catch(_) { _zimniList = []; }
    return;
  }
  try {
    const { data } = await supabaseClient
      .from('zimni_reports').select('*')
      .eq('case_id', _zimniCaseId)
      .order('serial_no', { ascending: true });
    _zimniList = data || [];
    try { localStorage.setItem('dio_zimni_' + _zimniCaseId, JSON.stringify(_zimniList)); } catch(_) {}
  } catch(_) {
    try { _zimniList = JSON.parse(localStorage.getItem('dio_zimni_' + _zimniCaseId) || '[]'); }
    catch(_2) { _zimniList = []; }
  }
}

// ── LIST VIEW (all zimni entries for this case) ───────────────
function _renderZimniList() {
  try { if (typeof _ch173FocusMode === 'function') _ch173FocusMode(false); } catch (_) {}  // chips wapas
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  try { if (typeof _ch173FullPage === 'function') _ch173FullPage(area); } catch (_) {}
  area.innerHTML = `
  <style>
    .zt{ width:100%; border-collapse:collapse; font-size:13px; direction:rtl;
         font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; }
    .zt th{ background:var(--bg-tertiary); border:1px solid var(--border);
            padding:7px 6px; font-weight:700; white-space:nowrap; }
    .zt td{ border:1px solid var(--border); padding:6px; vertical-align:middle; }
    .zt tbody tr:nth-child(odd){ background:var(--bg-secondary); }
    .zt tbody tr:hover{ background:var(--hover-bg); }
    .zt .num{ text-align:center; font-weight:700; width:52px; }
    .zt .act{ white-space:nowrap; text-align:center; width:190px; }
    .zab{ border:1px solid var(--border); background:var(--bg-card); border-radius:6px;
          padding:3px 7px; margin:0 1px; cursor:pointer; font-size:14px; line-height:1; }
    .zab:hover{ background:var(--hover-bg); }
    .zt .khulasa{ font-size:12px; color:var(--text-secondary); max-width:340px; }
  </style>
  <div style="padding:14px;direction:rtl;height:100%;overflow-y:auto;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
      <button class="btn btn-primary btn-sm" onclick="_newZimni()">➕ ضمنی درج کریں</button>
      <button class="btn btn-secondary btn-sm" onclick="_printAllZimni()">🖨️ تمام ضمنیاں پرنٹ کریں</button>
      <div style="margin-right:auto;font-weight:700;font-size:15px;">ضمنیات</div>
    </div>
    ${_zimniList.length ? `
    <table class="zt">
      <thead>
        <tr>
          <th class="num">ضمنی نمبر</th>
          <th>ضمنی</th>
          <th>بنام</th>
          <th>مرتبہ</th>
          <th>تاریخ</th>
          <th>فقرہ نمبر</th>
          <th>خلاصہ</th>
          <th class="act">ایکشن</th>
        </tr>
      </thead>
      <tbody>
        ${_zimniList.map((z, i) => {
          const c = z.content || {};
          const plain = (c.bodyHtml || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          const khulasa = plain ? (plain.length > 90 ? plain.slice(0, 90) + '…' : plain) : '—';
          const dt = z.report_date ? (typeof formatDate === 'function' ? formatDate(z.report_date) : z.report_date) : '—';
          const murattib = (typeof getIOSignLine === 'function') ? getIOSignLine()
                         : ((currentOfficer && currentOfficer.full_name ? currentOfficer.full_name + ' ' : '')
                            + (currentOfficer && currentOfficer.designation ? currentOfficer.designation + ' ' : '')
                            + 'تھانہ ' + ((currentOfficer && currentOfficer.station) || ''));
          return `
          <tr ondblclick="_openZimni('${z.id}')" style="cursor:pointer;">
            <td class="num">${esc(String(z.serial_no || (i + 1)))}</td>
            <td>${esc(c.unwan || 'ضمنی رپورٹ')}</td>
            <td>${esc(c.banam || '')}</td>
            <td style="white-space:nowrap;">${esc(murattib)}</td>
            <td style="text-align:center;white-space:nowrap;font-family:var(--font-mono);">${esc(dt)}</td>
            <td style="text-align:center;">${esc(String(c.faqra_no || 1))}</td>
            <td class="khulasa">${esc(khulasa)}</td>
            <td class="act">
              <button class="zab" onclick="event.stopPropagation();_openZimni('${z.id}')" title="ترمیم">✏️</button>
              <button class="zab" onclick="event.stopPropagation();_deleteZimni('${z.id}')" title="حذف">🗑️</button>
              <button class="zab" onclick="event.stopPropagation();_printZimniById('${z.id}')" title="پرنٹ">🖨️</button>
              <button class="zab" onclick="event.stopPropagation();_emailZimni('${z.id}')" title="بھیجیں">✉️</button>
              <button class="zab" onclick="event.stopPropagation();_pdfZimni('${z.id}')" title="PDF" style="font-size:10px;font-weight:800;color:#b91c1c;">PDF</button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>` : `
    <div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
      <div style="font-size:40px;margin-bottom:10px;">📋</div>
      <div style="font-size:14px;">ابھی کوئی ضمنی رپورٹ نہیں</div>
      <div style="font-size:11px;margin-top:6px;">اوپر "ضمنی درج کریں" پر کلک کریں</div>
    </div>`}
  </div>`;
}

function _newZimni() {
  const nextSerial = (_zimniList.reduce((m,z)=>Math.max(m, parseInt(z.serial_no)||0), 0)) + 1;
  _zimniActive = { id: null, serial_no: nextSerial, content: null };
  _renderZimniEditor();
}

function _openZimni(id) {
  _zimniActive = _zimniList.find(z => z.id === id) || null;
  if (!_zimniActive) return;
  _renderZimniEditor();
}

// ── EDITOR (Police Form 25-54(1)) ──────────────
function _renderZimniEditor() {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const c = _zimniCase || {};
  const z = _zimniActive || {};
  const saved = z.content || {};

  const savedBody = saved.bodyHtml ? sanitizeHtml(saved.bodyHtml) : _zimniDefaultBody(o, c);

  // چالان/اخراج jaisi settings — kaghaz, side margin, font list, button style —
  // sab report173 se (guess nahi)
  const paper = (typeof _ch173Paper !== 'undefined') ? _ch173Paper : 'legal';
  const side  = (typeof _ch173SideMargin === 'function') ? _ch173SideMargin() : '0.2cm';
  const sizes = (typeof R173_FONT_SIZES !== 'undefined')
    ? R173_FONT_SIZES : [8,9,10,10.5,11,12,14,16,18,20,22,24,26,28,36,48,72];
  const btn = (typeof _chBtn === 'function') ? _chBtn()
    : 'min-width:30px;height:28px;border:1px solid #ccc;border-radius:6px;background:#fff;color:#111;cursor:pointer;font-size:13px;padding:0 7px;margin:0 1px;';
  const sep = '<span style="width:1px;height:22px;background:var(--border,#ccc);margin:0 4px;"></span>';
  const selCss = 'height:28px;border:1px solid var(--border,#ccc);border-radius:6px;background:var(--bg-card,#fff);color:var(--text-primary,#111);font-size:13px;padding:0 6px;margin:0 1px;cursor:pointer;';

  area.innerHTML = `
  <style>${(typeof _ch173CSS === 'function') ? _ch173CSS() : ''}${_zimniFormCSS()}</style>
  <div style="display:flex;flex-direction:column;height:100%;direction:rtl;">
    <!-- Topbar — report173 jaisa (chips patti cursor upar jane par nazar aati hai) -->
    <div class="no-print" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);flex-wrap:wrap;background:var(--bg-secondary);">
      <select id="ch173-paper-sel" onchange="_ch173SetPaper(this.value)" title="کاغذ کا سائز" style="${selCss}font-family:'Jameel Noori Nastaleeq',serif;">
        <option value="legal" ${paper==='legal'?'selected':''}>لیگل (8.5×13)</option>
        <option value="a4"    ${paper==='a4'   ?'selected':''}>A4 (8.27×11.7)</option>
      </select>
      <div style="margin-right:auto;display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
        <button onmousedown="event.preventDefault()" onclick="_ch173Fmt('bold')" title="بولڈ" style="${btn}font-weight:900;">B</button>
        <button onmousedown="event.preventDefault()" onclick="_ch173Fmt('italic')" title="ترچھا" style="${btn}font-style:italic;">I</button>
        <button onmousedown="event.preventDefault()" onclick="_ch173Fmt('underline')" title="انڈر لائن" style="${btn}text-decoration:underline;">U</button>
        ${sep}
        <button onmousedown="event.preventDefault()" onclick="_ch173Fmt('justifyRight')" title="دائیں سیدھ" style="${btn}">⇥</button>
        <button onmousedown="event.preventDefault()" onclick="_ch173Fmt('justifyCenter')" title="درمیان" style="${btn}">⇔</button>
        <button onmousedown="event.preventDefault()" onclick="_ch173Fmt('justifyLeft')" title="بائیں سیدھ" style="${btn}">⇤</button>
        <button onmousedown="event.preventDefault()" onclick="_ch173Fmt('justifyFull')" title="دونوں طرف برابر" style="${btn}">☰</button>
        ${sep}
        <button onmousedown="event.preventDefault()" onclick="_ch173Fmt('insertUnorderedList')" title="نقطہ دار فہرست" style="${btn}">•</button>
        <button onmousedown="event.preventDefault()" onclick="_ch173Fmt('insertOrderedList')" title="نمبر والی فہرست" style="${btn}font-size:11px;">1.</button>
        <button onmousedown="event.preventDefault()" onclick="_ch173ClearFmt()" title="فارمیٹ ختم کریں" style="${btn}">🧹</button>
        ${sep}
        <button id="ch173-brush-btn" onmousedown="event.preventDefault()"
          onclick="_ch173BrushClick(false)" ondblclick="_ch173BrushClick(true)"
          title="فارمیٹ پینٹر — ایک کلک: ایک بار، ڈبل کلک: بار بار" style="${btn}">🖌</button>
        <select id="ch173-font-sel" onchange="_ch173SetFont(this.value)" title="فونٹ سائز" style="${selCss}">
          ${sizes.map(s => `<option value="${s}" ${String(s)==='14'?'selected':''}>${s}</option>`).join('')}
        </select>
        <button onmousedown="event.preventDefault()" onclick="_ch173Fmt('undo')" title="واپس (Undo)" style="${btn}">↶</button>
        <button onmousedown="event.preventDefault()" onclick="_ch173Fmt('redo')" title="دوبارہ (Redo)" style="${btn}">↷</button>
        <button class="btn btn-primary btn-sm dio-modbtn" onclick="_saveZimni()">💾 محفوظ</button>
        <button class="btn btn-secondary btn-sm dio-modbtn" onclick="_printZimni()">🖨️ پرنٹ</button>
      </div>
    </div>

    <!-- Document — kaghaz asal naap par (challan/akhraj jaisa), margins 1cm / side -->
    <div style="flex:1;overflow:auto;min-height:0;padding:16px;background:var(--bg-tertiary);">
      <div id="ch173-doc" spellcheck="false" style="
        width:${paper==='a4'?'8.27in':'8.5in'};max-width:none;
        min-height:${paper==='a4'?'11.7in':'13in'};margin:0 auto;
        padding:1cm ${side};background:#fff;
        box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:4px;
        line-height:1.4;box-sizing:border-box;">${savedBody}</div>
    </div>
  </div>`;

  // ═══ report173 ke asal functions — behavior bilkul چالان/اخراج jaisa ═══
  try { if (typeof _ch173FullPage === 'function') _ch173FullPage(area); } catch (_) {}
  try { if (typeof _ch173BlockFloatBar === 'function') _ch173BlockFloatBar(); } catch (_) {}
  setTimeout(() => {
    try { if (typeof _ch173FullPage === 'function') _ch173FullPage(area); } catch (_) {}
    try { if (typeof _ch173FitPaper === 'function') _ch173FitPaper(); } catch (_) {}
    try { if (typeof _ch173BindKeys === 'function') _ch173BindKeys(); } catch (_) {}       // Tab/Enter/Ctrl+BIU
    try { if (typeof _ch173BrushOff === 'function') _ch173BrushOff(); } catch (_) {}
    try { if (typeof _ch173BindBrush === 'function') _ch173BindBrush(); } catch (_) {}     // format painter
    try { if (typeof _ch173BindCellPick === 'function') _ch173BindCellPick(); } catch (_) {}
    try { if (typeof _ch173FocusMode === 'function') _ch173FocusMode(true); } catch (_) {} // chips peek
    try { if (typeof _ch173WatchFit === 'function') _ch173WatchFit(); } catch (_) {}
    // Cursor ke mutabiq font dropdown khud badle (MS Word jaisa)
    try {
      if (!window._ch173FontSelBound && typeof _ch173SyncFontSel === 'function') {
        window._ch173FontSelBound = true;
        document.addEventListener('selectionchange', _ch173SyncFontSel);
      }
    } catch (_) {}
    if (typeof applyMicButtons === 'function') applyMicButtons(area);
  }, 60);
}

// Berooni Zimni form ki CSS (editor + print) — sab #ch173-doc ke andar,
// naap POINT (pt) mein. RTL: بیرونی دائیں، ضلع بائیں (flex ordering).
function _zimniFormCSS() {
  return `
  /* ── HEADER ── flex RTL: pehla bachcha (بیرونی) DAYEN, aakhri (ضلع) BAYEN ── */
  #ch173-doc .zf-head{ display:flex; justify-content:space-between; align-items:flex-start; direction:rtl; column-gap:6px; }
  #ch173-doc .zf-hr{ width:20%; text-align:right; font-size:14pt; font-weight:700; padding-top:2px; }   /* بیرونی — دائیں */
  #ch173-doc .zf-hc{ flex:1; text-align:center; }                                                        /* عنوان — درمیان */
  #ch173-doc .zf-hl{ width:20%; text-align:center; }                                                     /* ضلع — بائیں */
  #ch173-doc .zf-hl .zf-zila{ font-size:14pt; font-weight:600; }
  #ch173-doc .zf-seal{ width:22mm; height:22mm; border:1.5px solid #000; border-radius:50%; margin:3px auto 0; }
  #ch173-doc .zf-hc .zf-formno{ font-size:13pt; font-weight:600; margin-bottom:6px; direction:ltr; }
  #ch173-doc .zf-hc .zf-title{ font-size:20pt; font-weight:700; text-decoration:underline; text-underline-offset:5px; line-height:1.3; }
  #ch173-doc .zf-hc .zf-zname{ font-size:14pt; font-weight:600; margin-top:2px; }

  /* ── METADATA (fill-in lines) ── */
  #ch173-doc .zf-meta{ margin:12px 0 8px; font-size:14pt; direction:rtl; }
  #ch173-doc .zf-mrow{ display:flex; gap:22px; flex-wrap:wrap; align-items:baseline; margin-bottom:9px; direction:rtl; }
  #ch173-doc .zf-fld{ display:flex; align-items:baseline; gap:6px; }
  #ch173-doc .zf-fld.grow{ flex:1; }
  #ch173-doc .zf-lbl{ font-weight:700; white-space:nowrap; }
  #ch173-doc .zf-lbl.b{ font-weight:800; }
  #ch173-doc .zf-ln{ flex:1; min-width:60px; border-bottom:1px solid #000; min-height:1.4em; padding:0 4px; outline:none; }

  /* ── MAIN TABLE ── */
  #ch173-doc table.zf-tbl{ width:100%; border-collapse:collapse; table-layout:fixed; direction:rtl; }
  #ch173-doc table.zf-tbl thead{ display:table-header-group; }
  #ch173-doc table.zf-tbl th{ border:1.5px solid #000; padding:6px 5px; font-size:13pt; font-weight:700; text-align:center; line-height:1.5; vertical-align:middle; }
  #ch173-doc table.zf-tbl td{ border:1.5px solid #000; padding:8px 9px; font-size:14pt; vertical-align:top; overflow-wrap:anywhere; word-break:break-word; }
  #ch173-doc .zf-c-action{ width:14%; text-align:center; }
  #ch173-doc .zf-c-serial{ width:14%; text-align:center; }
  #ch173-doc .zf-c-body{ width:60%; }
  #ch173-doc .zf-c-from{ width:12%; text-align:center; }
  #ch173-doc table.zf-tbl tbody td{ height:21cm; }              /* register jaisa poora safha */
  #ch173-doc .zf-bl{ margin-bottom:8px; }
  #ch173-doc .zf-bdyln{ display:inline-block; min-width:55%; border-bottom:1px dotted #000; outline:none; }
  #ch173-doc .zf-body{ margin-top:10px; line-height:2.0; text-align:justify; outline:none; }
  #ch173-doc [contenteditable="true"]{ outline:none; }

  /* Paste kiya hua matn apna font saath na laye — hamesha Nastaliq */
  #ch173-doc .zf-body *, #ch173-doc .zf-tbl td *, #ch173-doc .zf-ln *{
    font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif !important;
  }
  /* Table thead agle safhe par na kate; body row qudrati tor par tootay */
  @media print{ #ch173-doc table.zf-tbl thead{ page-break-inside:avoid; } }`;
}

// Default document body — editable بیرونی Zimni form (Police Form 25-54(1))
// Fixed chrome (headings/labels/table header) = contenteditable=false.
// Fill-in values + main body = editable. Known fields pre-filled from case/officer.
function _zimniDefaultBody(o, c) {
  o = o || {}; c = c || {};
  const z = _zimniActive || {};
  const E = (v) => (typeof esc === 'function') ? esc(v == null ? '' : String(v)) : (v == null ? '' : String(v));
  const D = (v) => v ? ((typeof formatDate === 'function') ? formatDate(v) : v) : '';
  const year = new Date().getFullYear();
  const io = (typeof getIOSignLine === 'function') ? getIOSignLine()
           : ((o.full_name || '') + (o.designation ? ' ' + o.designation : '') + (o.station ? ' تھانہ ' + o.station : ''));
  const thana   = E(o.station || '');
  const firNo   = E(c.fir_number || '');
  const firDate = E(D(c.occurrence_date || c.fir_date || ''));
  const jurm    = E(((c.section_of_law || '') + ' ' + (c.offence_type || '')).trim());
  const compl   = E(c.complainant_name || c.complainant || '');
  const serial  = E(z.serial_no || '');
  const ioE     = E(io);

  return `
  <div class="zf-head">
    <div class="zf-hr">بیرونی</div>
    <div class="zf-hc">
      <div class="zf-formno">پولیس فارم نمبر&nbsp;25—54(1)</div>
      <div class="zf-title">رپورٹ ضمنی</div>
      <div class="zf-zname">ملتان</div>
    </div>
    <div class="zf-hl"><div class="zf-zila">ضلع</div><div class="zf-seal"></div></div>
  </div>

  <div class="zf-meta">
    <div class="zf-mrow">
      <div class="zf-fld grow"><span class="zf-lbl">تھانہ۔</span><span class="zf-ln" contenteditable="true" data-k="thana">${thana}</span></div>
      <div class="zf-fld"><span class="zf-lbl">سال</span><span class="zf-ln" contenteditable="true" data-k="saal" style="min-width:80px">${year}</span></div>
      <div class="zf-fld"><span class="zf-lbl">ضمنی نمبر</span><span class="zf-ln" contenteditable="true" data-k="zno" style="min-width:90px">${serial}</span></div>
    </div>
    <div class="zf-mrow">
      <div class="zf-fld"><span class="zf-lbl">مقدمہ نمبر</span><span class="zf-ln" contenteditable="true" data-k="fir" style="min-width:120px">${firNo}</span></div>
      <div class="zf-fld"><span class="zf-lbl">مورخہ</span><span class="zf-ln" contenteditable="true" data-k="fdate" style="min-width:120px">${firDate}</span></div>
      <div class="zf-fld grow"><span class="zf-lbl">تھانہ میں پہنچنے کا وقت و تاریخ</span><span class="zf-ln" contenteditable="true" data-k="arrival"></span></div>
    </div>
    <div class="zf-mrow">
      <div class="zf-fld grow"><span class="zf-lbl">تاریخ و مقام وقوعہ۔</span><span class="zf-ln" contenteditable="true" data-k="waqoia"></span></div>
      <div class="zf-fld grow"><span class="zf-lbl">تھانہ سے روانگی کا وقت و تاریخ</span><span class="zf-ln" contenteditable="true" data-k="depart"></span></div>
    </div>
    <div class="zf-mrow">
      <div class="zf-fld"><span class="zf-lbl">بحد۔</span><span class="zf-ln" contenteditable="true" data-k="behad" style="min-width:140px"></span></div>
      <div class="zf-fld grow"><span class="zf-lbl b">جرم۔</span><span class="zf-ln" contenteditable="true" data-k="jurm">${jurm}</span></div>
    </div>
  </div>

  <table class="zf-tbl">
    <thead>
      <tr>
        <th class="zf-c-action">تاریخ و وقت<br>کارروائی</th>
        <th class="zf-c-serial">رپورٹ نمبر شمار<br>سلسلہ وار</th>
        <th class="zf-c-body">حالاتِ تفتیش</th>
        <th class="zf-c-from">از۔</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="zf-c-action" contenteditable="true" data-k="action"></td>
        <td class="zf-c-serial" contenteditable="true" data-k="serial">${serial}</td>
        <td class="zf-c-body">
          <div class="zf-bl"><span class="zf-lbl">سرکار بذریعہ ۔</span> <span class="zf-bdyln" contenteditable="true" data-k="sarkar">${compl}</span></div>
          <div class="zf-bl"><span class="zf-lbl">بنام۔</span> <span class="zf-bdyln" contenteditable="true" data-k="banam"></span></div>
          <div class="zf-bl"><span class="zf-lbl">مرتبہ ۔</span> <span class="zf-bdyln" contenteditable="true" data-k="murattib">${ioE}</span></div>
          <div class="zf-body" contenteditable="true" data-mic="true" data-k="halaat"><br></div>
        </td>
        <td class="zf-c-from" contenteditable="true" data-k="az">${ioE}</td>
      </tr>
    </tbody>
  </table>`;
}

// ── SAVE ──────────────────────────────────────────────────────
async function _saveZimni() {
  const ed = (typeof _ch173Doc === 'function' && _ch173Doc()) || document.getElementById('ch173-doc');
  if (!ed) return;
  const bodyHtml = ed.innerHTML;
  const z = _zimniActive || {};
  const rec = {
    case_id: _zimniCaseId,
    serial_no: z.serial_no || 1,
    report_date: new Date().toISOString().slice(0,10),
    content: { bodyHtml },
  };
  // محفوظ فائلوں کی فہرست میں درج (نمبر شمار + تاریخ)
  try {
    if (typeof dioRegisterSaved === 'function')
      dioRegisterSaved('zimni', 'ضمنی نمبر ' + (z.serial_no || 1),
        { case_id: _zimniCaseId, serial_no: z.serial_no || 1 });
  } catch(_) {}
  try {
    const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
    if (oid) rec.officer_id = oid;
    let savedRec = null;
    if (z.id) {
      const { data } = await supabaseClient.from('zimni_reports').update(rec).eq('id', z.id).select().single();
      savedRec = data || { ...rec, id: z.id };
      const idx = _zimniList.findIndex(x => x.id === z.id);
      if (idx >= 0) _zimniList[idx] = savedRec;
    } else {
      const { data, error } = await supabaseClient.from('zimni_reports').insert(rec).select().single();
      if (error) throw error;
      savedRec = data || { ...rec, id: 'tmp_'+Date.now() };
      _zimniList.push(savedRec);
    }
    _zimniActive = savedRec;
    try { localStorage.setItem('dio_zimni_' + _zimniCaseId, JSON.stringify(_zimniList)); } catch(_) {}
    showToast('✅ ضمنی محفوظ ہو گئی', 'success');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

async function _deleteZimni(id) {
  if (!confirm('کیا آپ یہ ضمنی حذف کرنا چاہتے ہیں؟')) return;
  try {
    await supabaseClient.from('zimni_reports').delete().eq('id', id);
    _zimniList = _zimniList.filter(z => z.id !== id);
    try { localStorage.setItem('dio_zimni_' + _zimniCaseId, JSON.stringify(_zimniList)); } catch(_) {}
    _renderZimniList();
    showToast('🗑️ حذف ہو گئی', 'info');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

// ── PRINT (only the document — MS-Word rule) ──────────────────
function _printZimni() {
  const ed = (typeof _ch173Doc === 'function' && _ch173Doc()) || document.getElementById('ch173-doc');
  if (!ed) return;
  _zimniPrintDoc(ed.innerHTML);
}

// چالان/اخراج jaisa print: kaghaz + margins (1cm / _ch173SideMargin) report173 se,
// CSS bhi report173 (_ch173CSS) + zimni form CSS — screen aur print bilkul aik.
function _zimniPrintHTML(inner) {
  const paper = (typeof _ch173Paper !== 'undefined') ? _ch173Paper : 'legal';
  const side  = (typeof _ch173SideMargin === 'function') ? _ch173SideMargin() : '0.2cm';
  const size  = (paper === 'a4') ? 'A4 portrait' : '8.5in 13in';
  const css173 = (typeof _ch173CSS === 'function') ? _ch173CSS() : '';
  return `<!DOCTYPE html><html dir="rtl" lang="ur"><head><meta charset="UTF-8"><title> </title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      @page{ size:${size}; margin:1cm ${side}; }
      *{ -webkit-print-color-adjust:exact; print-color-adjust:exact; box-sizing:border-box; }
      html,body{ margin:0; font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Tahoma',sans-serif;
            direction:rtl; text-align:justify; color:#000; line-height:1.4; }
      ${css173}
      ${_zimniFormCSS()}
      /* Print overrides — sirf working document (koi toolbar/button nahi) */
      #ch173-doc{ width:100% !important; max-width:none !important; height:auto !important;
        min-height:0 !important; padding:0 !important; margin:0 !important;
        transform:none !important; box-shadow:none !important; border-radius:0 !important; }
      #ch173-doc table.zf-tbl thead{ display:table-header-group !important; page-break-inside:avoid; }
      .no-print, button, select{ display:none !important; }
      #ch173-doc, #ch173-doc *{ orphans:2; widows:2; }
    </style></head><body><div id="ch173-doc">${inner}</div></body></html>`;
}
window._zimniPrintHTML = _zimniPrintHTML;

function _zimniPrintDoc(inner) {
  const html = _zimniPrintHTML(inner);
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
}

// ═══════════════════════════════════════════════════════════════
//  ضمنیات — fehrist ke ایکشن buttons (پرنٹ / بھیجیں / PDF)
// ═══════════════════════════════════════════════════════════════

// Aik ضمنی ka poora chhapne wala safha — sirf working document
function _zimniDocHTML(z) {
  const c = z.content || {};
  return _zimniPrintHTML(c.bodyHtml || '');
}

function _zimniById(id) { return (_zimniList || []).find(z => String(z.id) === String(id)); }

// 🖨️ Aik ضمنی print
function _printZimniById(id) {
  const z = _zimniById(id);
  if (!z) { if (typeof showToast === 'function') showToast('⚠️ ضمنی نہیں ملی', 'error'); return; }
  const html = _zimniDocHTML(z);
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
}

// 🖨️ Tamam ضمنیاں aik saath
function _printAllZimni() {
  if (!_zimniList || !_zimniList.length) {
    if (typeof showToast === 'function') showToast('⚠️ کوئی ضمنی موجود نہیں', 'info'); return;
  }
  const body = _zimniList.map((z, i) => {
    const c = z.content || {};
    const brk = (i < _zimniList.length - 1) ? 'style="page-break-after:always;"' : '';
    return `<div ${brk}>${c.bodyHtml || ''}</div>`;
  }).join('');
  const html = _zimniPrintHTML(body);
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
}

// 📄 PDF — print window se "Save as PDF"
function _pdfZimni(id) {
  if (typeof showToast === 'function')
    showToast('📄 پرنٹ ونڈو میں "Save as PDF" منتخب کریں', 'info', 4000);
  _printZimniById(id);
}

// ✉️ Bhejna — share sheet ya email
async function _emailZimni(id) {
  const z = _zimniById(id);
  if (!z) return;
  const c    = z.content || {};
  const dt   = z.report_date ? (typeof formatDate === 'function' ? formatDate(z.report_date) : z.report_date) : '';
  const text = (c.bodyHtml || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').replace(/\n{3,}/g, '\n\n').trim();
  const subj = `ضمنی نمبر ${z.serial_no || ''}${dt ? ' — ' + dt : ''}`;
  try {
    if (navigator.share) { await navigator.share({ title: subj, text: subj + '\n\n' + text }); return; }
  } catch (_) {}
  try {
    window.location.href = 'mailto:?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(text);
  } catch (_) {
    try { await navigator.clipboard.writeText(subj + '\n\n' + text);
      if (typeof showToast === 'function') showToast('📋 نقل ہو گیا', 'success'); } catch (__) {}
  }
}

window._printZimniById = _printZimniById;
window._printAllZimni  = _printAllZimni;
window._pdfZimni       = _pdfZimni;
window._emailZimni     = _emailZimni;
window._zimniDocHTML   = _zimniDocHTML;
