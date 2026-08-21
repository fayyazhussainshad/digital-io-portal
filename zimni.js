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
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
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
  setTimeout(() => { if (typeof _zimniBindTools === 'function') _zimniBindTools(); }, 120);
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const c = _zimniCase || {};
  const z = _zimniActive || {};
  const saved = z.content || {};
  const year = new Date().getFullYear();

  const savedBody = saved.bodyHtml ? sanitizeHtml(saved.bodyHtml) : _zimniDefaultBody(o, c);

  area.innerHTML = `
  <style>${_zimniFormCSS()}</style>
  <div style="display:flex;flex-direction:column;height:100%;direction:rtl;">
    <!-- Formatting buttons yahan nahi — jab kisi khane mein likhenge to
         MS Word wala toolbar khud wahin nazar aa jayega -->
    <div style="display:flex;align-items:center;gap:6px;padding:8px 12px;border-bottom:1px solid var(--border);flex-wrap:wrap;background:var(--bg-secondary);">
      <div style="margin-right:auto;display:flex;gap:6px;">
        <button class="btn btn-primary btn-sm" onclick="_saveZimni()">💾 محفوظ</button>
        <button class="btn btn-secondary btn-sm" onclick="_printZimni()">🖨️ پرنٹ</button>
        
      </div>
    </div>

    <!-- Document — Legal size, margins 10mm top/bottom · 12mm sides, font 14pt -->
    <div style="flex:1;overflow-y:auto;padding:16px;background:var(--bg-tertiary);">
      <div id="zimni-doc" data-mic="true" contenteditable="true" spellcheck="false" style="
        width:216mm;min-height:356mm;margin:0 auto;padding:10mm 12mm;
        background:#fff;color:#111;
        font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
        font-size:14pt;line-height:2;
        direction:rtl;text-align:justify;
        box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:4px;outline:none;
      ">${savedBody}</div>
    </div>
  </div>`;

  // Keyboard shortcuts
  setTimeout(() => {
    const ed = document.getElementById('zimni-doc');
    if (typeof applyMicButtons === 'function') applyMicButtons(area);
    if (ed) {
      ed.focus();
      ed.onkeydown = (e) => {
        if (e.ctrlKey || e.metaKey) {
          if (e.key==='b'){e.preventDefault();document.execCommand('bold');}
          if (e.key==='i'){e.preventDefault();document.execCommand('italic');}
          if (e.key==='u'){e.preventDefault();document.execCommand('underline');}
        }
      };
    }
  }, 80);
}

// Shared CSS for the Berooni Zimni form (editor + print) — sizes in pt
function _zimniFormCSS() {
  return `
  .zf-head{ display:grid; grid-template-columns:1fr 2fr 1fr; align-items:start; column-gap:6px; }
  .zf-hl{ text-align:center; }
  .zf-hl .zf-zila{ font-size:14pt; font-weight:600; }
  .zf-seal{ width:22mm; height:22mm; border:1.5px solid #000; border-radius:50%; margin:3px auto 0; }
  .zf-hr{ text-align:left; font-size:14pt; font-weight:700; padding-top:2px; }
  .zf-hc{ text-align:center; }
  .zf-hc .zf-formno{ font-size:13pt; font-weight:600; margin-bottom:6px; }
  .zf-hc .zf-title{ font-size:20pt; font-weight:700; text-decoration:underline; text-underline-offset:5px; line-height:1.3; }
  .zf-hc .zf-zname{ font-size:14pt; font-weight:600; margin-top:2px; }
  .zf-meta{ margin:12px 0 8px; font-size:14pt; }
  .zf-mrow{ display:flex; gap:22px; flex-wrap:wrap; align-items:baseline; margin-bottom:9px; }
  .zf-fld{ display:flex; align-items:baseline; gap:6px; }
  .zf-fld.grow{ flex:1; }
  .zf-lbl{ font-weight:700; white-space:nowrap; }
  .zf-lbl.b{ font-weight:800; }
  .zf-ln{ flex:1; min-width:60px; border-bottom:1px solid #000; min-height:1.4em; padding:0 4px; }
  table.zf-tbl{ width:100%; border-collapse:collapse; table-layout:fixed; }
  table.zf-tbl thead{ display:table-header-group; }
  table.zf-tbl th{ border:1.5px solid #000; padding:6px 5px; font-size:13pt; font-weight:700; text-align:center; line-height:1.5; vertical-align:middle; }
  table.zf-tbl td{ border:1.5px solid #000; padding:8px 9px; font-size:14pt; vertical-align:top; overflow-wrap:anywhere; word-break:break-word; }
  .zf-c-action{ width:14%; text-align:center; }
  .zf-c-serial{ width:14%; text-align:center; }
  .zf-c-body{ width:60%; }
  .zf-c-from{ width:12%; text-align:center; }
  table.zf-tbl tbody td{ height:200mm; }
  .zf-bl{ margin-bottom:8px; }
  .zf-bdyln{ display:inline-block; min-width:55%; border-bottom:1px dotted #000; }
  .zf-body{ margin-top:10px; line-height:2.0; text-align:justify; }`;
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
  <div class="zf-head" contenteditable="false">
    <div class="zf-hl"><div class="zf-zila">ضلع</div><div class="zf-seal"></div></div>
    <div class="zf-hc">
      <div class="zf-formno">پولیس فارم نمبر&nbsp;25—54(1)</div>
      <div class="zf-title">رپورٹ ضمنی</div>
      <div class="zf-zname">ملتان</div>
    </div>
    <div class="zf-hr">بیرونی</div>
  </div>

  <div class="zf-meta">
    <div class="zf-mrow">
      <div class="zf-fld grow"><span class="zf-lbl" contenteditable="false">تھانہ۔</span><span class="zf-ln">${thana}</span></div>
      <div class="zf-fld"><span class="zf-lbl" contenteditable="false">سال</span><span class="zf-ln" style="min-width:80px">${year}</span></div>
      <div class="zf-fld"><span class="zf-lbl" contenteditable="false">ضمنی نمبر</span><span class="zf-ln" style="min-width:90px">${serial}</span></div>
    </div>
    <div class="zf-mrow">
      <div class="zf-fld"><span class="zf-lbl" contenteditable="false">مقدمہ نمبر</span><span class="zf-ln" style="min-width:120px">${firNo}</span></div>
      <div class="zf-fld"><span class="zf-lbl" contenteditable="false">مورخہ</span><span class="zf-ln" style="min-width:120px">${firDate}</span></div>
      <div class="zf-fld grow"><span class="zf-lbl" contenteditable="false">تھانہ میں پہنچنے کا وقت و تاریخ</span><span class="zf-ln"></span></div>
    </div>
    <div class="zf-mrow">
      <div class="zf-fld grow"><span class="zf-lbl" contenteditable="false">تاریخ و مقام وقوعہ۔</span><span class="zf-ln"></span></div>
      <div class="zf-fld grow"><span class="zf-lbl" contenteditable="false">تھانہ سے روانگی کا وقت و تاریخ</span><span class="zf-ln"></span></div>
    </div>
    <div class="zf-mrow">
      <div class="zf-fld"><span class="zf-lbl" contenteditable="false">بحد۔</span><span class="zf-ln" style="min-width:140px"></span></div>
      <div class="zf-fld grow"><span class="zf-lbl b" contenteditable="false">جرم۔</span><span class="zf-ln">${jurm}</span></div>
    </div>
  </div>

  <table class="zf-tbl">
    <thead contenteditable="false">
      <tr>
        <th class="zf-c-action">تاریخ و وقت<br>کارروائی</th>
        <th class="zf-c-serial">رپورٹ نمبر شمار<br>سلسلہ وار</th>
        <th class="zf-c-body">حالاتِ تفتیش</th>
        <th class="zf-c-from">از۔</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="zf-c-action"></td>
        <td class="zf-c-serial">${serial}</td>
        <td class="zf-c-body">
          <div class="zf-bl"><span class="zf-lbl" contenteditable="false">سرکار بذریعہ ۔</span> <span class="zf-bdyln">${compl}</span></div>
          <div class="zf-bl"><span class="zf-lbl" contenteditable="false">بنام۔</span> <span class="zf-bdyln"></span></div>
          <div class="zf-bl"><span class="zf-lbl" contenteditable="false">مرتبہ ۔</span> <span class="zf-bdyln">${ioE}</span></div>
          <div class="zf-body"><br></div>
        </td>
        <td class="zf-c-from">${ioE}</td>
      </tr>
    </tbody>
  </table>`;
}

// ── FORMATTING ────────────────────────────────────────────────
function _zBtn() {
  return 'min-width:32px;height:30px;border:1px solid var(--border);border-radius:6px;background:var(--bg-card);color:var(--text-primary);cursor:pointer;font-size:14px;padding:0 7px;';
}
function _zimniBindTools() {
  try {
    const ed = document.getElementById('zimni-doc');
    if (ed && typeof dioBindEditor === 'function') dioBindEditor(ed.parentNode || document);
  } catch(_) {}
}
window._zimniBindTools = _zimniBindTools;

// ── SAVE ──────────────────────────────────────────────────────
async function _saveZimni() {
  const ed = document.getElementById('zimni-doc');
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

// ── PRINT (only the document) ──────────────────
function _printZimni() {
  const ed = document.getElementById('zimni-doc');
  if (!ed) return;
  _zimniPrintDoc(ed.innerHTML);
}

// Sirf working document print — no tabs/toolbars (MS-Word rule). Legal, 10/12mm.
function _zimniPrintDoc(inner) {
  const html = `<!DOCTYPE html><html dir="rtl" lang="ur"><head><meta charset="UTF-8"><title> </title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      @page{ size:216mm 356mm; margin:10mm 12mm 10mm 12mm; }
      *{ -webkit-print-color-adjust:exact; print-color-adjust:exact; box-sizing:border-box; }
      body{ margin:0; font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Tahoma',sans-serif;
            direction:rtl; text-align:justify; font-size:14pt; line-height:2; color:#000; }
      ${_zimniFormCSS()}
    </style></head><body>${inner}</body></html>`;
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
}

// ═══════════════════════════════════════════════════════════════
//  ضمنیات — fehrist ke ایکشن buttons (پرنٹ / بھیجیں / PDF)
// ═══════════════════════════════════════════════════════════════

// Aik ضمنی ka poora chhapne wala safha — sirf working document (koi extra heading/signature/brand nahi)
function _zimniDocHTML(z) {
  const c = z.content || {};
  const inner = c.bodyHtml || '';
  return `<!DOCTYPE html><html dir="rtl" lang="ur"><head><meta charset="UTF-8"><title> </title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      @page{ size:216mm 356mm; margin:10mm 12mm 10mm 12mm; }
      *{ -webkit-print-color-adjust:exact; print-color-adjust:exact; box-sizing:border-box; }
      body{ margin:0; font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Tahoma',sans-serif;
            direction:rtl; text-align:justify; font-size:14pt; line-height:2; color:#000; }
      ${_zimniFormCSS()}
    </style></head><body>${inner}</body></html>`;
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
  const html = `<!DOCTYPE html><html dir="rtl" lang="ur"><head><meta charset="UTF-8"><title> </title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      @page{ size:216mm 356mm; margin:10mm 12mm 10mm 12mm; }
      *{ -webkit-print-color-adjust:exact; print-color-adjust:exact; box-sizing:border-box; }
      body{ margin:0; font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Tahoma',sans-serif;
            direction:rtl; text-align:justify; font-size:14pt; line-height:2; color:#000; }
      ${_zimniFormCSS()}
    </style></head><body>${body}</body></html>`;
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
