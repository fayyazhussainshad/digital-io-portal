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
  <div style="display:flex;flex-direction:column;height:100%;direction:rtl;">
    <!-- Formatting buttons yahan nahi — jab kisi khane mein likhenge to
         MS Word wala toolbar khud wahin nazar aa jayega -->
    <div style="display:flex;align-items:center;gap:6px;padding:8px 12px;border-bottom:1px solid var(--border);flex-wrap:wrap;background:var(--bg-secondary);">
      <button onclick="_zAddRow()" title="نئی قطار" style="${_zBtn()}font-size:11px;">➕ قطار</button>
      <div style="margin-right:auto;display:flex;gap:6px;">
        <button class="btn btn-primary btn-sm" onclick="_saveZimni()">💾 محفوظ</button>
        <button class="btn btn-secondary btn-sm" onclick="_printZimni()">🖨️ پرنٹ</button>
        
      </div>
    </div>

    <!-- Document -->
    <div style="flex:1;overflow-y:auto;padding:16px;background:var(--bg-tertiary);">
      <div id="zimni-doc" data-mic="true" contenteditable="true" spellcheck="false" style="
        max-width:210mm;margin:0 auto;padding:18mm;
        background:#fff;color:#111;
        font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
        font-size:15px;line-height:2;
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

// Default document body (Police Form 25-54(1))
function _zimniDefaultBody(o, c) {
  const z = _zimniActive || {};
  const station = o.station || '________';
  const district = o.district || '________';
  const year = new Date().getFullYear();
  const cell = (v) => v || '';
  return `
  <div style="text-align:left;font-size:11px;color:#555;margin-bottom:6px;">پولیس فارم نمبر 25—54(1) — بیرونی</div>
  <div style="text-align:center;font-size:18px;font-weight:800;margin-bottom:4px;">رپورٹ ضمنی</div>
  <div style="text-align:center;font-size:13px;margin-bottom:12px;">ضلع ${district} تھانہ ${station} — سال ${year} — ضمنی نمبر <b>${z.serial_no||''}</b></div>

  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:10px;">
    <tr>
      <td style="border:1px solid #999;padding:6px;width:33%;"><b>مقدمہ نمبر:</b> ${cell(c.fir_number)}</td>
      <td style="border:1px solid #999;padding:6px;width:33%;"><b>مورخہ:</b> ${cell(c.occurrence_date)}</td>
      <td style="border:1px solid #999;padding:6px;"><b>تھانہ میں پہنچنے کا وقت و تاریخ:</b> </td>
    </tr>
    <tr>
      <td style="border:1px solid #999;padding:6px;"><b>تاریخ و مقام وقوعہ:</b> </td>
      <td style="border:1px solid #999;padding:6px;" colspan="2"><b>تھانہ سے روانگی کا وقت و تاریخ:</b> </td>
    </tr>
    <tr>
      <td style="border:1px solid #999;padding:6px;"><b>بحد:</b> </td>
      <td style="border:1px solid #999;padding:6px;" colspan="2"><b>جرم:</b> ${cell(c.section_of_law)} ${cell(c.offence_type)}</td>
    </tr>
  </table>

  <!-- Main 4-column table -->
  <table style="width:100%;border-collapse:collapse;font-size:13px;" id="zimni-main-table">
    <thead>
      <tr style="background:#f0f0f0;">
        <th style="border:1px solid #999;padding:6px;width:18%;">از۔تھانہ</th>
        <th style="border:1px solid #999;padding:6px;">حالاتِ تفتیش</th>
        <th style="border:1px solid #999;padding:6px;width:12%;">رپورٹ نمبر شمار سلسلہ وار</th>
        <th style="border:1px solid #999;padding:6px;width:16%;">تاریخ و وقت کارروائی</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border:1px solid #999;padding:8px;vertical-align:top;">${esc(o.full_name)||''}<br>${esc(station)}</td>
        <td style="border:1px solid #999;padding:8px;vertical-align:top;text-align:justify;min-height:200px;"> </td>
        <td style="border:1px solid #999;padding:8px;text-align:center;vertical-align:top;">${z.serial_no||''}</td>
        <td style="border:1px solid #999;padding:8px;vertical-align:top;"> </td>
      </tr>
    </tbody>
  </table>`;
}

// Add a new row to the main table
function _zAddRow() {
  const ed = document.getElementById('zimni-doc');
  if (!ed) return;
  const tbody = ed.querySelector('#zimni-main-table tbody');
  if (!tbody) { showToast('⚠️ ٹیبل نہیں ملا', 'warn'); return; }
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td style="border:1px solid #999;padding:8px;vertical-align:top;">${esc(o.full_name)||''}<br>${esc(o.station)||''}</td>
    <td style="border:1px solid #999;padding:8px;vertical-align:top;text-align:justify;"> </td>
    <td style="border:1px solid #999;padding:8px;text-align:center;vertical-align:top;"> </td>
    <td style="border:1px solid #999;padding:8px;vertical-align:top;"> </td>`;
  tbody.appendChild(tr);
}

// ── FORMATTING ────────────────────────────────────────────────
function _zBtn() {
  return 'min-width:32px;height:30px;border:1px solid var(--border);border-radius:6px;background:var(--bg-card);color:var(--text-primary);cursor:pointer;font-size:14px;padding:0 7px;';
}
function _zFmt(cmd) {
  const ed = document.getElementById('zimni-doc');
  if (ed) ed.focus();
  document.execCommand(cmd, false, null);
}
function _zFont(dir) {
  const ed = document.getElementById('zimni-doc');
  if (!ed) return;
  ed.focus();
  const sel = window.getSelection();
  if (sel && sel.toString()) {
    document.execCommand('fontSize', false, dir > 0 ? '5' : '2');
  } else {
    const cur = parseInt(window.getComputedStyle(ed).fontSize) || 15;
    ed.style.fontSize = Math.max(11, Math.min(26, cur + dir*2)) + 'px';
  }
}

// Editor khulte hi MS Word jaise auzaar (Tab, Ctrl+B/I/U)
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
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <style>@page{size:legal;margin:15mm}
      body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;direction:rtl;text-align:justify;font-size:15px;line-height:2;color:#000;}
      table{border-collapse:collapse;width:100%;}td,th{border:1px solid #000;padding:6px;}
    </style></head><body>${ed.innerHTML}</body></html>`;
  if (typeof dioPrint === 'function') {
    dioPrint(html);
  } else {
    const w = window.open('', '_blank');
    w.document.write(html); w.document.close(); w.print();
  }
}

// ═══════════════════════════════════════════════════════════════
//  ضمنیات — fehrist ke ایکشن buttons (پرنٹ / بھیجیں / PDF)
// ═══════════════════════════════════════════════════════════════

// Aik ضمنی ka poora chhapne wala safha
function _zimniDocHTML(z) {
  const o  = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const c  = z.content || {};
  const dt = z.report_date
    ? (typeof formatDate === 'function' ? formatDate(z.report_date) : z.report_date) : '';
  const io = (o.full_name || '') + (o.designation ? ' ' + o.designation : '') +
             (o.station ? ' تھانہ ' + o.station : '');
  return `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title> </title>
    <style>
      @page{ size:legal; margin:15mm; }
      body{ font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; direction:rtl;
            text-align:justify; font-size:15px; line-height:2; color:#000; }
      .hd{ text-align:center; font-weight:bold; font-size:18px; margin-bottom:4px; }
      .sub{ text-align:center; font-size:13px; margin-bottom:14px; }
      table{ border-collapse:collapse; width:100%; } td,th{ border:1px solid #000; padding:6px; }
      .sign{ margin-top:40px; text-align:left; }
      .sign .nm{ font-weight:bold; } .sign .dt{ font-size:12px; }
      .brand{ position:fixed; bottom:3mm; left:4mm; font-size:9px; color:#999; direction:ltr; }
    </style></head><body>
    <div class="hd">ضمنی رپورٹ</div>
    <div class="sub">ضمنی نمبر <b>${z.serial_no || ''}</b>${dt ? ' &nbsp;—&nbsp; تاریخ ' + dt : ''}</div>
    <div>${c.bodyHtml || ''}</div>
    <div class="sign"><div class="nm">${io}</div><div class="dt">${dt}</div></div>
    <div class="brand">Digital IO</div>
  </body></html>`;
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
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const body = _zimniList.map(z => {
    const c  = z.content || {};
    const dt = z.report_date ? (typeof formatDate === 'function' ? formatDate(z.report_date) : z.report_date) : '';
    return `<div style="page-break-after:always;">
      <div style="text-align:center;font-weight:bold;font-size:17px;">ضمنی نمبر ${z.serial_no || ''}</div>
      <div style="text-align:center;font-size:12px;margin-bottom:10px;">${dt}</div>
      <div>${c.bodyHtml || ''}</div>
    </div>`;
  }).join('');
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title> </title>
    <style>@page{size:legal;margin:15mm}
      body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;direction:rtl;
           text-align:justify;font-size:15px;line-height:2;color:#000;}
      table{border-collapse:collapse;width:100%;}td,th{border:1px solid #000;padding:6px;}
      .brand{position:fixed;bottom:3mm;left:4mm;font-size:9px;color:#999;direction:ltr;}
    </style></head><body>${body}<div class="brand">Digital IO</div></body></html>`;
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
