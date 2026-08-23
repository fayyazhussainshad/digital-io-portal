// ═══ فائل کا نمبر — تصدیق کے لیے کہ نئی فائل چل رہی ہے یا پرانی cached ═══
// کنسول میں لکھیں:  ZIMNI_A_VER    →  اگر نیچے والا نمبر نظر آئے تو نئی فائل ہے
const ZIMNI_A_VER = 'zimni-androoni v18 — Muharrir tag in picker + no FIR-matn auto-fill for Muharrir statements';
window.ZIMNI_A_VER = ZIMNI_A_VER;

/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — اندرونی ضمنی (ZIMNI ANDROONI / INTERNAL PROGRESS REPORT)
   ═══════════════════════════════════════════════════════════
   یہ فائل zimni.js (رپورٹ ضمنی بیرونی) کے بالکل اُسی اصول پر بنی ہے —
   report173.js (LOCKED) کو ہاتھ نہیں لگایا گیا، صرف اُس کے موجودہ
   window functions استعمال کیے گئے ہیں (paper/margins/toolbar/font
   list/format-painter/focus-mode-chips/fit-paper وغیرہ)۔

   AHEM: یہ فائل zimni.js کے BAAD لوڈ ہونی چاہیے (index.html میں
   <script src="zimni.js"> کے بعد <script src="zimni-androoni.js">) —
   کئی جگہ zimni.js کے عام (generic, غیر-berooni-specific) functions
   سیدھے استعمال کیے گئے ہیں تاکہ کوڈ نہ دہرایا جائے:
     _zimniDoc, _zimniCleanHTML, _zimniFmt, _zimniSyncFmtBtns,
     _zimniFmtStamp, _zimniBindKeys, _zimniBindFindReplace
   یہ سب zimni.js میں پہلے سے window پر موجود ہیں اور کسی .zf-* class
   سے نہیں جڑے — اسی لیے اندرونی ضمنی میں بھی ویسے ہی کام کرتے ہیں۔

   فرق (اندرونی بمقابلہ بیرونی):
   - سرنامہ صرف "اندرونی ضمنی" (کوئی پولیس فارم نمبر کی سطر نہیں،
     کوئی الگ "ضلع" خانہ نہیں — اصل Androoi_Zimni.docx میں یہی ہے)
   - ایک ہی سطر میں 4 خانے: مقدمہ نمبر | مورخہ | جرم | تھانہ
   - ٹیبل صرف 3 کالم: نمبر شمار (دائیں) | خالی/تنگ کالم | حالات (بائیں،
     زیادہ چوڑا) — کوئی الگ ہیڈر سطر نہیں، کوئی "از" کالم نہیں،
     کوئی بنام/سرکار-بذریعہ/مرتبہ بوائلر-پلیٹ نہیں (وہ صرف بیرونی
     فارم میں تھا)
   - کوئی اضافی متن (overflow/cont_text) کا خانہ نہیں — بالکل بیرونی
     ضمنی جیسا: قطار خود اگلے صفحے پر جاری رہتی ہے
   - فونٹ، ٹاپ بار، moving/focus-mode chips، کاغذ/مارجن، Tab=8 خالی
     جگہیں، Ctrl+S/F/H، format painter — سب بیرونی ضمنی جیسا (ہی)
   ═══════════════════════════════════════════════════════════ */

let _zaCaseId = null;
let _zaCase   = null;
let _zaList   = [];
let _zaActive = null;  // currently open androoni zimni record

// ── ENTRY POINT (case workspace میں "اندرونی ضمنی" بٹن سے) ──
async function openZimniAndrooniEditor(caseId) {
  _zaCaseId = caseId || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
           || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  if (typeof getCase === 'function' && _zaCaseId) {
    try { _zaCase = await getCase(_zaCaseId); } catch (_) { _zaCase = null; }
  }
  await _loadZimniA();
  _renderZimniAList();
}
window.openZimniAndrooniEditor = openZimniAndrooniEditor;

// ═══════════════════════════════════════════════════════════════
//  zimni_androoni_reports کا اصل ڈھانچہ خود پہچانو — بیرونی ضمنی کی
//  طرح (کچھ ڈیٹابیس میں 'content' نام کا کالم نہ ہو تو، اندازہ لگانے
//  کے بجائے ممکنہ ناموں کو باری باری آزماؤ اور جو چل جائے یاد رکھو)
// ═══════════════════════════════════════════════════════════════
const ZIMNI_A_CONTENT_COLS = ['content', 'content_json', 'data', 'form_data',
                               'body', 'body_html', 'html', 'report_content', 'details'];

function _zaColPref() {
  try { return localStorage.getItem('dio_zimni_a_col') || ''; } catch (_) { return ''; }
}
function _zaColSet(c) {
  try { if (c) localStorage.setItem('dio_zimni_a_col', c); } catch (_) {}
}

function _zaContentOf(row) {
  if (!row) return {};
  for (const c of [_zaColPref(), ...ZIMNI_A_CONTENT_COLS]) {
    if (!c || !(c in row)) continue;
    let v = row[c];
    if (v == null) continue;
    if (typeof v === 'string') {
      const t = v.trim();
      if (t.startsWith('{')) { try { return JSON.parse(t); } catch (_) {} }
      if (t) { _zaColSet(c); return { bodyHtml: v }; }
      continue;
    }
    if (typeof v === 'object') { _zaColSet(c); return v; }
  }
  return {};
}
window._zaContentOf = _zaContentOf;

function _zaMissingCol(e) {
  try {
    const m = String((e && e.message) || '').match(/'([^']+)'\s+column/i);
    return m ? m[1] : '';
  } catch (_) { return ''; }
}

async function _zaWrite(base, contentObj, id) {
  const tried = new Set();
  const cands = [_zaColPref(), ...ZIMNI_A_CONTENT_COLS].filter(c => c && !tried.has(c) && (tried.add(c) || true));
  const payloadBase = Object.assign({}, base);
  let lastErr = null;

  for (let ci = 0; ci < cands.length; ci++) {
    const col = cands[ci];
    for (let g = 0; g < 6; g++) {
      const rec = Object.assign({}, payloadBase);
      rec[col] = contentObj;
      try {
        let res;
        if (id) res = await supabaseClient.from('zimni_androoni_reports').update(rec).eq('id', id).select();
        else    res = await supabaseClient.from('zimni_androoni_reports').insert(rec).select();
        if (res.error) throw res.error;
        _zaColSet(col);
        return (res.data && res.data[0]) || Object.assign({ id: id || ('tmp_' + Date.now()) }, rec);
      } catch (e) {
        lastErr = e;
        if (e && e.code === 'PGRST204') {
          const miss = _zaMissingCol(e);
          if (miss && miss === col) break;
          if (miss && miss in payloadBase) { delete payloadBase[miss]; continue; }
        }
        if (e && (e.code === '22P02' || /invalid input syntax|json/i.test(String(e.message || '')))
              && typeof contentObj === 'object') {
          try {
            const rec2 = Object.assign({}, payloadBase);
            rec2[col] = JSON.stringify(contentObj);
            let r2;
            if (id) r2 = await supabaseClient.from('zimni_androoni_reports').update(rec2).eq('id', id).select();
            else    r2 = await supabaseClient.from('zimni_androoni_reports').insert(rec2).select();
            if (!r2.error) { _zaColSet(col); return (r2.data && r2.data[0]) || Object.assign({ id: id || ('tmp_' + Date.now()) }, rec2); }
            lastErr = r2.error;
          } catch (e2) { lastErr = e2; }
        }
        break;
      }
    }
  }
  throw lastErr || new Error('محفوظ نہ ہو سکی');
}
window._zaWrite = _zaWrite;

async function _loadZimniA() {
  let local = [];
  try { local = JSON.parse(localStorage.getItem('dio_za_' + _zaCaseId) || '[]'); } catch (_) { local = []; }

  if (!navigator.onLine) { _zaList = local; return; }
  if (window._zaDbBroken) { _zaList = local; return; }

  let rows = null;
  try {
    let r = await supabaseClient.from('zimni_androoni_reports').select('*')
      .eq('case_id', _zaCaseId).order('serial_no', { ascending: true });
    if (r.error) r = await supabaseClient.from('zimni_androoni_reports').select('*').eq('case_id', _zaCaseId);
    if (r.error) r = await supabaseClient.from('zimni_androoni_reports').select('*').limit(50);
    if (r.error) throw r.error;
    rows = r.data || [];
  } catch (e) {
    window._zaDbBroken = true;
    try { console.error('[zimni androoni load] zimni_androoni_reports کا ڈھانچہ درست نہیں:', e); } catch (_) {}
    if (!window._zaDbWarned) {
      window._zaDbWarned = true;
      try {
        showToast('⚠️ ڈیٹابیس میں zimni_androoni_reports کے کالم درست نہیں — فی الحال اسی کمپیوٹر پر محفوظ ہو رہی ہیں', 'warn', 9000);
      } catch (_) {}
    }
    _zaList = local;
    return;
  }

  const fromDb = rows.map(r => Object.assign({}, r, { content: _zaContentOf(r) }));
  const ids = new Set(fromDb.map(r => String(r.id)));
  const onlyLocal = local.filter(z => String(z.id).startsWith('local-') && !ids.has(String(z.id)));
  _zaList = fromDb.concat(onlyLocal)
    .sort((a, b) => (parseInt(b.serial_no, 10) || 0) - (parseInt(a.serial_no, 10) || 0));
  try { localStorage.setItem('dio_za_' + _zaCaseId, JSON.stringify(_zaList)); } catch (_) {}
}

// ── LIST VIEW ───────────────────────────────────────────────────
function _renderZimniAList() {
  try { if (typeof _ch173FocusMode === 'function') _ch173FocusMode(false); } catch (_) {}
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  try { if (typeof _ch173FullPage === 'function') _ch173FullPage(area); } catch (_) {}

  const sno = (z) => parseInt(z.serial_no, 10)
    || parseInt((z.content || {}).serial_no, 10) || 0;
  const list = _zaList.slice().sort((a, b) => sno(b) - sno(a));

  const dt = (z) => z.report_date
    ? (typeof formatDate === 'function' ? formatDate(z.report_date) : z.report_date) : '—';
  const wq = (z) => {
    try {
      const iso = (z.content || {}).saved_at || '';
      if (!iso) return '';
      const x = new Date(iso); if (isNaN(x)) return '';
      let h = x.getHours(); const m = String(x.getMinutes()).padStart(2, '0');
      const ap = h < 12 ? 'am' : 'pm'; h = h % 12 || 12;
      return String(h).padStart(2, '0') + ':' + m + ' ' + ap;
    } catch (_) { return ''; }
  };
  const wits = (z) => {
    try {
      const arr = ((z.content || {}).witnesses) || [];
      return arr.length ? arr.join('، ') : '—';
    } catch (_) { return '—'; }
  };

  area.innerHTML = `
  <style>
    .zt{ width:100%; border-collapse:collapse; font-size:13px; direction:rtl;
         font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; }
    .zt th{ background:var(--bg-tertiary); border:1px solid var(--border); padding:7px 6px;
            font-weight:700; white-space:nowrap; text-align:center; }
    .zt td{ border:1px solid var(--border); padding:6px; vertical-align:middle; }
    .zt tbody tr:nth-child(odd){ background:var(--bg-secondary); }
    .zt tbody tr:hover{ background:var(--hover-bg); }
    .zt .num{ text-align:center; font-weight:700; width:60px; }
    .zt .dtc{ text-align:center; white-space:nowrap; width:140px;
      font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
      font-size:13px; direction:ltr; unicode-bidi:isolate; }
    .zt .wq{ font-size:12px; color:var(--text-muted); margin-top:2px;
      font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
      direction:ltr; unicode-bidi:isolate; }
    .zt .act{ white-space:nowrap; text-align:center; width:220px; }
    .zab{ border:1px solid var(--border); background:var(--bg-card); border-radius:6px;
          padding:3px 6px; margin:0 1px; cursor:pointer; font-size:13px; line-height:1; }
    .zab:hover{ background:var(--hover-bg); }
  </style>
  <div style="padding:14px;direction:rtl;height:100%;overflow-y:auto;">
    <div style="display:flex;align-items:center;gap:10px;margin:0 0 8px;flex-wrap:wrap;">
      <button class="btn btn-primary btn-sm" onclick="_newZimniA()">➕ بیان درج کریں</button>
      <button class="btn btn-secondary btn-sm" onclick="_printAllZimniA()">🖨️ تمام بیانات</button>
      <div style="flex:1;"></div>
    </div>
    ${list.length ? `
    <table class="zt">
      <thead><tr>
        <th class="num">نمبر شمار</th>
        <th class="dtc">تاریخ و وقت</th>
        <th>گواہان</th>
        <th class="act">ایکشن</th>
      </tr></thead>
      <tbody>
        ${list.map(z => `
          <tr ondblclick="_openZimniA('${z.id}')" style="cursor:pointer;">
            <td class="num">${esc(String(sno(z) || ''))}</td>
            <td class="dtc">${esc(dt(z))}${wq(z) ? `<div class="wq">${esc(wq(z))}</div>` : ''}</td>
            <td>${esc(wits(z))}</td>
            <td class="act">
              <button class="zab" onclick="event.stopPropagation();_openZimniA('${z.id}')" title="ترمیم">✏️</button>
              <button class="zab" onclick="event.stopPropagation();_copyZimniA('${z.id}')" title="نقل (Copy)">📋</button>
              <button class="zab" onclick="event.stopPropagation();_printZimniAById('${z.id}')" title="پرنٹ">🖨️</button>
              <button class="zab" onclick="event.stopPropagation();_emailZimniA('${z.id}')" title="شیئر">📤</button>
              <button class="zab" onclick="event.stopPropagation();_pdfZimniA('${z.id}')" title="PDF" style="font-size:10px;font-weight:800;color:#b91c1c;">PDF</button>
              <button class="zab" onclick="event.stopPropagation();_deleteZimniA('${z.id}')" title="حذف">🗑️</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>` : `
    <div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
      <div style="font-size:40px;margin-bottom:10px;">📋</div>
      <div style="font-size:14px;">ابھی کوئی بیان درج نہیں</div>
      <div style="font-size:11px;margin-top:6px;">اوپر "بیان درج کریں" پر کلک کریں</div>
    </div>`}
  </div>`;
}

// ── فہرست کے ایکشن ─────────────────────────────────────────────
const _zaRec = (id) => _zaList.find(z => String(z.id) === String(id));

async function _copyZimniA(id) {
  const z = _zaRec(id); if (!z) return;
  const txt = String((z.content || {}).bodyHtml || '')
    .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  try {
    await navigator.clipboard.writeText(txt);
    showToast('📋 نقل ہو گئی', 'success');
  } catch (_) { showToast('❌ نقل نہ ہو سکی', 'error'); }
}
window._copyZimniA = _copyZimniA;

function _newZimniA() {
  const nextSerial = (_zaList.reduce((m, z) => Math.max(m,
    parseInt(z.serial_no, 10) || parseInt((z.content || {}).serial_no, 10) || 0), 0)) + 1;
  _zaActive = { id: null, serial_no: nextSerial, content: null };
  _renderZimniAEditor();
}
window._newZimniA = _newZimniA;

function _openZimniA(id) {
  _zaActive = _zaList.find(z => z.id === id) || null;
  if (!_zaActive) return;
  _renderZimniAEditor();
}
window._openZimniA = _openZimniA;

// ── EDITOR ──────────────────────────────────────────────────────
function _renderZimniAEditor() {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const c = _zaCase || {};
  const z = _zaActive || {};
  const saved = z.content || {};

  const savedBody = saved.bodyHtml ? sanitizeHtml(saved.bodyHtml) : _zaDefaultBody(o, c);

  // چالان/بیرونی-ضمنی jaisi settings — kaghaz, side margin, font list, button style — sab report173 se
  const paper = (typeof _ch173Paper !== 'undefined') ? _ch173Paper : 'legal';
  const side  = (typeof _ch173SideMargin === 'function') ? _ch173SideMargin() : '0.2cm';
  const sizes = (typeof R173_FONT_SIZES !== 'undefined')
    ? R173_FONT_SIZES : [8,9,10,10.5,11,12,14,16,18,20,22,24,26,28,36,48,72];
  const btn = (typeof _chBtn === 'function') ? _chBtn()
    : 'min-width:30px;height:28px;border:1px solid #ccc;border-radius:6px;background:#fff;color:#111;cursor:pointer;font-size:13px;padding:0 7px;margin:0 1px;';
  const sep = '<span style="width:1px;height:22px;background:var(--border,#ccc);margin:0 4px;"></span>';
  const selCss = 'height:28px;border:1px solid var(--border,#ccc);border-radius:6px;background:var(--bg-card,#fff);color:var(--text-primary,#111);font-size:13px;padding:0 6px;margin:0 1px;cursor:pointer;';

  area.innerHTML = `
  <style>${(typeof _ch173CSS === 'function') ? _ch173CSS() : ''}${_zaFormCSS()}</style>
  <div style="display:flex;flex-direction:column;height:100%;direction:rtl;">
    <!-- Topbar — bairooni zimni jaisa (chips patti cursor upar jane par nazar aati hai) -->
    <div class="no-print" style="display:flex;align-items:center;gap:8px;padding:2px 10px;border-bottom:1px solid var(--border);flex-wrap:wrap;background:var(--bg-secondary);">
      <div style="margin-right:auto;display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
        <button id="zf-btn-b" onmousedown="event.preventDefault()" onclick="_zimniFmt('bold')" title="بولڈ" style="${btn}font-weight:900;">B</button>
        <button id="zf-btn-i" onmousedown="event.preventDefault()" onclick="_zimniFmt('italic')" title="ترچھا" style="${btn}font-style:italic;">I</button>
        <button id="zf-btn-u" onmousedown="event.preventDefault()" onclick="_zimniFmt('underline')" title="انڈر لائن" style="${btn}text-decoration:underline;">U</button>
        ${sep}
        <button onmousedown="event.preventDefault()" onclick="_zimniFmt('justifyRight')" title="دائیں سیدھ" style="${btn}">⇥</button>
        <button onmousedown="event.preventDefault()" onclick="_zimniFmt('justifyCenter')" title="درمیان" style="${btn}">⇔</button>
        <button onmousedown="event.preventDefault()" onclick="_zimniFmt('justifyLeft')" title="بائیں سیدھ" style="${btn}">⇤</button>
        <button onmousedown="event.preventDefault()" onclick="_zimniFmt('justifyFull')" title="دونوں طرف برابر" style="${btn}">☰</button>
        ${sep}
        <button onmousedown="event.preventDefault()" onclick="_zimniFmt('insertUnorderedList')" title="نقطہ دار فہرست" style="${btn}">•</button>
        <button onmousedown="event.preventDefault()" onclick="_zimniFmt('insertOrderedList')" title="نمبر والی فہرست" style="${btn}font-size:11px;">1.</button>
        <button onmousedown="event.preventDefault()" onclick="_ch173ClearFmt()" title="فارمیٹ ختم کریں" style="${btn}">🧹</button>
        ${sep}
        <button id="ch173-brush-btn" onmousedown="event.preventDefault()"
          onclick="_ch173BrushClick(false)" ondblclick="_ch173BrushClick(true)"
          title="فارمیٹ پینٹر — ایک کلک: ایک بار، ڈبل کلک: بار بار" style="${btn}">🖌</button>
        <select id="ch173-font-sel" onchange="_zaSetFont(this.value)" title="فونٹ سائز" style="${selCss}">
          ${sizes.map(s => `<option value="${s}" ${String(s)==='14'?'selected':''}>${s}</option>`).join('')}
        </select>
        <button onmousedown="event.preventDefault()" onclick="_zimniFmt('undo')" title="واپس (Undo)" style="${btn}">↶</button>
        <button onmousedown="event.preventDefault()" onclick="_zimniFmt('redo')" title="دوبارہ (Redo)" style="${btn}">↷</button>
        <button class="btn btn-primary btn-sm dio-modbtn" onclick="_saveZimniA(false,true)" title="محفوظ کریں — ضمنی کھلی رہے گی (Ctrl+S)">💾 محفوظ</button>
        <span id="zfa-updated" style="font-size:11px;color:var(--text-muted);white-space:nowrap;align-self:center;"></span>
        <button class="btn btn-secondary btn-sm dio-modbtn" onclick="_printZimniA()">🖨️ پرنٹ</button>
        ${sep}
        <button class="btn btn-secondary btn-sm dio-modbtn" onclick="_zaWitnessPickerOpen(event)" title="کسی گواہ کا بیان اس صفحے میں شامل کریں">👤 گواہ کا بیان</button>
      </div>
    </div>

    <!-- Document — poora editable, kaghaz asal naap par (report173 ke asal functions se) -->
    <div style="flex:1;overflow:auto;min-height:0;padding:10px;background:var(--bg-tertiary);">
      <div id="ch173-doc" contenteditable="true" spellcheck="false" style="
        width:${paper==='a4'?'8.27in':'8.5in'};max-width:none;
        min-height:${paper==='a4'?'11.7in':'13in'};margin:0 auto;
        padding:0.35cm ${side} 1cm ${side};background:#fff;
        box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:4px;
        line-height:1.4;box-sizing:border-box;">${savedBody}</div>
    </div>
  </div>`;

  // ═══ report173 + zimni.js (بیرونی) کے اصل functions — بالکل وہی برتاؤ ═══
  try { if (typeof _ch173FullPage === 'function') _ch173FullPage(area); } catch (_) {}
  try { if (typeof _ch173BlockFloatBar === 'function') _ch173BlockFloatBar(); } catch (_) {}
  setTimeout(() => {
    try { if (typeof _ch173FullPage === 'function') _ch173FullPage(area); } catch (_) {}
    try { if (typeof _ch173FitPaper === 'function') _ch173FitPaper(); } catch (_) {}
    try { _zimniBindKeys(); } catch (_) {}                       // Tab/Enter/Ctrl+BIU/paste (generic)
    try { _dioBindCtrlS(); } catch (_) {}                        // Ctrl+S = اپ ڈیٹ (zimni.js میں .zfa-tbl پہچانا جاتا ہے)
    try { if (typeof _ch173BrushOff === 'function') _ch173BrushOff(); } catch (_) {}
    try { if (typeof _ch173BindBrush === 'function') _ch173BindBrush(); } catch (_) {}     // format painter
    try { if (typeof _ch173BindCellPick === 'function') _ch173BindCellPick(); } catch (_) {}
    try { if (typeof _ch173FocusMode === 'function') _ch173FocusMode(true); } catch (_) {} // chips peek
    try { if (typeof _ch173WatchFit === 'function') _ch173WatchFit(); } catch (_) {}
    try { _zimniBindFindReplace(); } catch (_) {}                                          // Ctrl+F / Ctrl+H (generic)
    try { _zaColResize(); } catch (_) {}
    try { if (saved && saved.saved_at) _zaStampUpdated(saved.saved_at); } catch (_) {}
    try { _zaLayout(); } catch (_) {}
    // AHEM: خودکار نمبر شمار جان بوجھ کر بند — کالم 1 اب خالی/manual ہے
    // (har گواہ کا بلاک اپنا "بحوالہ ضمنی نمبر... فقرہ نمبر..." خود رکھتا
    //  ہے، اس لیے _zaStartNumbers()/_zaAutoNumbers() یہاں نہیں چلائے جاتے)
    [250, 900, 1800].forEach(ms => setTimeout(() => { try { _zaLayout(); } catch (_) {} }, ms));
    // Cursor ke mutabiq font dropdown + B/I/U ki halat khud badle (bairooni ka wahi generic sync)
    try {
      if (!window._zfSyncBound) {
        window._zfSyncBound = true;
        document.addEventListener('selectionchange', () => { try { _zimniSyncFmtBtns(); } catch (_) {} });
      }
    } catch (_) {}
    if (typeof applyMicButtons === 'function') applyMicButtons(area);
  }, 60);
}
window._renderZimniAEditor = _renderZimniAEditor;

// ═══════════════════════════════════════════════════════════════
//  فونٹ سائز — اندرونی ضمنی کے اپنے خانوں پر
//  (bairooni ka _zimniFontToDoc صرف .zf-* classes پر چلتا ہے، اسی
//   لیے یہاں الگ ضروری ہے — باقی سب bairooni ka reuse: _zimniFmt,
//   _zimniSyncFmtBtns وغیرہ)
// ═══════════════════════════════════════════════════════════════
function _zaFontToDoc(pt) {
  const doc = _zimniDoc();
  if (!doc) return;
  doc.dataset.fs = pt;
  doc.style.fontSize = pt + 'pt';
  try {
    doc.querySelectorAll('.zfa-meta *, .zfa-body *, .zfa-tbl td *')
       .forEach(el => { if (el.style && el.style.fontSize) el.style.fontSize = ''; });
  } catch (_) {}
  // AHEM: bairooni ka usool — '.zf-title' HISSE mein nahi hota, isi tarah
  // yahan '.zfa-title' bhi shamil nahi (unwan apni 26pt par rehta hai;
  // badalna ho to matn chun kar badlein)
  const HISSE = ['.zfa-formno', '.zfa-lbl', '.zfa-ln', '.zfa-j-suf', '.zfa-tbl td', '.zfa-num', '.zfa-body'].join(', ');
  try { doc.querySelectorAll(HISSE).forEach(el => { el.style.fontSize = pt + 'pt'; }); } catch (_) {}
  try { _r173Dirty = true; } catch (_) {}
}
window._zaFontToDoc = _zaFontToDoc;

function _zaSetFont(val) {
  const pt = parseFloat(val);
  if (!pt || isNaN(pt)) return;
  try { if (typeof _ch173RestoreRange === 'function') _ch173RestoreRange(); } catch (_) {}
  const fs = document.getElementById('ch173-font-sel');
  if (fs) fs.value = String(pt);
  try {
    if (typeof _ch173FontToSelection === 'function' && _ch173FontToSelection(pt)) {
      if (typeof _ch173SaveRange === 'function') _ch173SaveRange();
      try { _r173Dirty = true; } catch (_) {}
      return;
    }
  } catch (_) {}
  _zaFontToDoc(pt);
}
window._zaSetFont = _zaSetFont;

// ═══════════════════════════════════════════════════════════════
//  آخری اپ ڈیٹ کا وقت — toolbar میں (bairooni کا _zimniFmtStamp reuse)
// ═══════════════════════════════════════════════════════════════
function _zaStampUpdated(iso) {
  const el = document.getElementById('zfa-updated');
  if (!el) return;
  const t = (typeof _zimniFmtStamp === 'function') ? _zimniFmtStamp(iso || new Date().toISOString()) : '';
  el.textContent = t ? ('آخری اپ ڈیٹ: ' + t) : '';
}
window._zaStampUpdated = _zaStampUpdated;

// ═══════════════════════════════════════════════════════════════
//  ٹیبل کی لکیریں MOVEABLE — بیرونی ضمنی جیسی، مگر یہاں کوئی <thead>
//  نہیں (اصل فارم میں ہیڈر سطر ہے ہی نہیں) — اسی لیے grips سیدھا
//  tbody کی قطار کے td پر لگتے ہیں۔
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
//  گواہان کے بیانات — aik androoni zimni par 2 ya ziada gawahan ke
//  byanat add kiye ja sakte hain (161 CrPC). Har gawah ke liye:
//  naam ka heading + khali statement jagah + neeche tafteeshi
//  afsar ka naam+tareekh (khud add hota hai jahan bayan khatam hota).
//  Gawah case_witnesses table (witnesses.js) se fetch hota hai.
// ═══════════════════════════════════════════════════════════════
let _zaWitnesses = null;

async function _zaLoadWitnesses() {
  const cid = _zaCaseId
           || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
           || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  if (!cid || typeof supabaseClient === 'undefined') { _zaWitnesses = []; return _zaWitnesses; }
  try {
    const { data } = await supabaseClient.from('case_witnesses')
      .select('id,full_name,witness_type,status').eq('case_id', cid)
      .order('created_at', { ascending: true });
    _zaWitnesses = data || [];
  } catch (_) { _zaWitnesses = []; }
  return _zaWitnesses;
}
window._zaLoadWitnesses = _zaLoadWitnesses;

// Gawah ka bayan block sfhe mein daalna:
//   1) عنوان: "بیان ازاں [نام]" — dayen (koi bracket nahi)، uske NEECHE
//      "(بحوالہ ضمنی نمبر ... فقرہ نمبر ... زیردفعہ 161 ض ف)" — bayen taraf
//   2) FIR ke matn se shuru hone wali khali statement jagah ("بیان کیا کہ ...")
//   3) "بیان سن لیا ہے درست ہے" — khud-ba-khud, jahan bayan khatam hota
//   4) تفتیشی افسر (تھانہ سمیت) + neeche center mein tareekh — bayen taraf
// AHEM: "display:flex" yahan nahi (copy/paste par newline-per-item bug —
// meta-line ke masle se seekha gaya sabaq). IO+date ke liye "float:left"
// (normal block flow) kaafi hai — ref note ab apni line par hai, float
// ki zaroorat nahi.
async function _zaInsertWitnessStatement(witness) {
  if (!witness) return;
  const doc = _zimniDoc();
  const body = doc && doc.querySelector('.zfa-body');
  if (!body) return;
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  // بیرونی ضمنی کے "مرتبہ" جیسا — صرف نام نہیں، تھانہ بھی شامل
  const io = (typeof getIOSignLine === 'function') ? getIOSignLine()
           : ((o.full_name || '') + (o.designation ? ' ' + o.designation : '') + (o.station ? ' تھانہ ' + o.station : ''));
  const today = (typeof formatDate === 'function') ? formatDate(new Date()) : '';
  const E = (v) => (typeof esc === 'function') ? esc(v == null ? '' : String(v)) : String(v == null ? '' : v);
  const nm  = E(witness.full_name || witness.name || '');
  const zno = (_zaActive && _zaActive.serial_no) ? E(_zaActive.serial_no) : '۔۔۔۔';

  // گواہ کا بیان FIR کے متن سے شروع ہوتا ہے — 'fir_matn' table سے، اُسی
  // طریقے سے جو report173 کا _ch173FirText استعمال کرتا ہے۔ AHEM: report173
  // کا اپنا _ch173FirMatn (shared/global) دوبارہ استعمال نہیں کیا — وہ کسی
  // اور مقدمہ کے لیے پہلے سے بھرا ہو سکتا ہے (report173 پہلے کھلا ہو تو)،
  // جس سے یہاں غلط/پرانا یا خالی متن آ جاتا (بالکل data-k="halaat" والی
  // ٹکراؤ کی طرح)۔ اسی مقدمہ کے لیے ہمیشہ تازہ سوال۔
  // محرر (moharrir) کے لیے FIR کا متن نہیں بھرا جاتا — اُس کا بیان FIR
  // کے واقعے کی تکرار نہیں ہوتا، اسی لیے خالی رہنے دو۔
  const isMoharrir = (witness.status === 'moharrir');
  let firText = '';
  try {
    if (!isMoharrir) {
      const cid = _zaCaseId || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
               || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
      if (cid && typeof supabaseClient !== 'undefined') {
        const { data, error } = await supabaseClient.from('fir_matn')
          .select('matn,type').eq('case_id', cid).order('created_at', { ascending: true });
        try { console.log('[zimni-androoni] fir_matn query:', { cid, error, rows: data }); } catch (_) {}
        const rows = (data || []).filter(m => (m.type || 'fir') === 'fir');
        firText = rows.map(m => String(m.matn || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
                       .filter(Boolean).join(' ');
      }
    }
  } catch (_) {}

  // خالی حالت کا رکھا ہوا <br> (کالم 3 کو خالی ہونے پر بھی کلک ایبل رکھنے کے
  // لیے) — گواہ کا پہلا بلاک آنے پر یہ اضافی خالی سطر کے طور پر رہ جاتا تھا،
  // ہٹا دو تاکہ کوئی اضافی Enter/خالی سطر نہ بچے
  try {
    if (body.innerHTML.trim() === '<br>') body.innerHTML = '';
  } catch (_) {}

  const block = document.createElement('div');
  block.className = 'zfa-wit-block';
  block.setAttribute('data-witness-id', witness.id || '');
  block.setAttribute('data-witness-name', (witness.full_name || witness.name || '').trim());
  block.innerHTML =
    '<div class="zfa-wit-headrow">' +
      '<div class="zfa-wit-ref">(بحوالہ ضمنی نمبر&nbsp;' + zno + '&nbsp;&nbsp;فقرہ نمبر&nbsp;&nbsp;&nbsp;زیردفعہ 161 ض ف)</div>' +
      '<div class="zfa-wit-head">بیان ازاں ' + nm + '</div>' +
    '</div>' +
    '<div class="zfa-wit-stmt" data-mic="true">بیان کیا کہ&nbsp;' + E(firText) + '</div>' +
    '<div class="zfa-wit-close">بیان سن لیا ہے درست ہے</div>' +
    '<div class="zfa-wit-sign"><div class="zfa-wit-io">' + E(io) + '</div>' +
    '<div class="zfa-wit-date">' + E(today) + '</div></div>';
  body.appendChild(block);

  try { _zaLayout(); } catch (_) {}
  try { _r173Dirty = true; } catch (_) {}
  // کرسر نئے بیان کے آخر میں لے جاؤ (تاکہ officer فوراً اپنی بات جوڑ سکے)
  try {
    const stmt = block.querySelector('.zfa-wit-stmt');
    const r = document.createRange(); r.selectNodeContents(stmt); r.collapse(false);
    const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    stmt.scrollIntoView({ block: 'center', behavior: 'smooth' });
  } catch (_) {}
}
window._zaInsertWitnessStatement = _zaInsertWitnessStatement;

// گواہ چننے کی فہرست — چالان/بیرونی ضمنی کے ▾ جیسی، مگر SINGLE-select
// (ایک وقت میں ایک ہی گواہ — checkbox نہیں، radio)
async function _zaWitnessPickerOpen(ev) {
  if (ev && ev.preventDefault) ev.preventDefault();
  const old = document.getElementById('zfa-wit-menu');
  if (old) old.remove();
  const btn = (ev && ev.currentTarget) || document.body;

  let list = _zaWitnesses;
  if (!list || !list.length) list = await _zaLoadWitnesses();
  if ((!list || !list.length) && typeof _witnessList !== 'undefined' && _witnessList && _witnessList.length) list = _witnessList;
  list = (list || []).filter(w => (w.full_name || '').trim());
  if (!list.length) {
    if (typeof showToast === 'function') showToast('ℹ️ اس مقدمہ میں کوئی گواہ درج نہیں', 'info');
    return;
  }

  const E = (v) => (typeof esc === 'function') ? esc(v == null ? '' : String(v)) : String(v == null ? '' : v);
  const box = document.createElement('div');
  box.id = 'zfa-wit-menu';
  box.style.cssText =
    'position:fixed;z-index:99999;background:#fff;border:1px solid #0369a1;border-radius:10px;' +
    'box-shadow:0 10px 30px rgba(0,0,0,.28);direction:rtl;width:270px;max-width:92vw;' +
    'display:flex;flex-direction:column;max-height:min(60vh,340px);overflow:hidden;';
  const rows = list.map((w, i) => {
    const nm = (w.full_name || '').trim();
    const tag = (w.status === 'moharrir') ? ' <span style="color:#0369a1;font-size:11px;">(محرر)</span>' : '';
    return `<label style="display:flex;align-items:center;gap:8px;padding:7px 6px;cursor:pointer;font-size:13px;
              border-bottom:1px solid #f1f5f9;font-family:'Jameel Noori Nastaleeq',serif;">
              <input type="radio" name="zfa-wit-pick" value="${i}"> <span>${E(nm)}${tag}</span></label>`;
  }).join('');
  box.innerHTML = `
    <div style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;font-weight:700;color:#0369a1;
                font-family:'Jameel Noori Nastaleeq',serif;background:#f8fafc;">گواہ منتخب کریں (ایک وقت میں ایک)</div>
    <div style="flex:1;overflow-y:auto;padding:4px 8px;min-height:0;">${rows}</div>
    <div style="display:flex;gap:6px;padding:8px;border-top:1px solid #e5e7eb;background:#f8fafc;flex-shrink:0;">
      <button id="zfa-wit-ok" style="flex:1;padding:8px;border:none;border-radius:6px;background:#0369a1;color:#fff;
        cursor:pointer;font-size:13px;font-weight:700;font-family:'Jameel Noori Nastaleeq',serif;">✔ بیان شامل کریں</button>
      <button id="zfa-wit-x" style="padding:8px 12px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;
        cursor:pointer;font-size:13px;font-family:'Jameel Noori Nastaleeq',serif;">بند</button>
    </div>`;
  document.body.appendChild(box);

  const r = btn.getBoundingClientRect();
  const bw = box.offsetWidth, bh = box.offsetHeight;
  let top = r.bottom + 6;
  if (top + bh > window.innerHeight - 8) top = Math.max(8, r.top - bh - 6);
  let left = r.left + r.width / 2 - bw / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - bw - 8));
  box.style.top = top + 'px'; box.style.left = left + 'px';

  setTimeout(() => {
    const off = (e) => { if (!box.contains(e.target)) { box.remove(); document.removeEventListener('mousedown', off); } };
    document.addEventListener('mousedown', off);
  }, 0);

  box.querySelector('#zfa-wit-x').onclick = () => box.remove();
  box.querySelector('#zfa-wit-ok').onclick = () => {
    const sel = box.querySelector('input[name="zfa-wit-pick"]:checked');
    if (!sel) { if (typeof showToast === 'function') showToast('⚠️ پہلے گواہ منتخب کریں', 'warn'); return; }
    const w = list[parseInt(sel.value, 10)];
    box.remove();
    _zaInsertWitnessStatement(w);
  };
}
window._zaWitnessPickerOpen = _zaWitnessPickerOpen;

function _zaColResize() {
  const doc = _zimniDoc();
  const table = doc && doc.querySelector('table.zfa-tbl');
  if (!table || table._zfaResizeReady) return;
  table._zfaResizeReady = true;
  const cols = [...table.querySelectorAll('colgroup col')];
  if (cols.length < 2) return;
  const row = table.querySelector('tbody tr');
  if (!row) return;
  const tds = [...row.querySelectorAll('td')];

  // ── کالم کی چوڑائی (RTL) ──
  tds.forEach((td, i) => {
    if (i + 1 >= cols.length) return;                    // آخری کالم کے بائیں کچھ نہیں
    const g = document.createElement('div');
    g.className = 'zfa-colgrip';
    g.contentEditable = 'false';
    g.title = 'چوڑائی بدلنے کے لیے کھینچیں';
    td.appendChild(g);
    g.addEventListener('mousedown', (e) => {
      e.preventDefault(); e.stopPropagation();
      const tW = table.offsetWidth || 1;
      const startX = e.clientX;
      const wA = parseFloat(cols[i].style.width)     || (100 / cols.length);
      const wB = parseFloat(cols[i + 1].style.width) || (100 / cols.length);
      document.body.style.cursor = 'col-resize';
      const onMove = (ev) => {
        const dx = (startX - ev.clientX) / tW * 100;      // RTL
        const nA = wA + dx, nB = wB - dx;
        if (nA < 3 || nB < 3) return;
        cols[i].style.width     = nA.toFixed(2) + '%';
        cols[i + 1].style.width = nB.toFixed(2) + '%';
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        try { _r173Dirty = true; } catch (_) {}
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  });

  // ── قطار کی اونچائی (نیچے کی لکیر) ──
  row.querySelectorAll('td').forEach(td => {
    const g = document.createElement('div');
    g.className = 'zfa-rowgrip';
    g.contentEditable = 'false';
    g.title = 'اونچائی بدلنے کے لیے کھینچیں';
    td.appendChild(g);
    g.addEventListener('mousedown', (e) => {
      e.preventDefault(); e.stopPropagation();
      const startY = e.clientY, startH = row.offsetHeight;
      document.body.style.cursor = 'row-resize';
      const onMove = (ev) => {
        const nh = startH + (ev.clientY - startY);
        if (nh < 80) return;
        row.querySelectorAll('td').forEach(c => { c.style.height = nh + 'px'; });
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        try { _r173Dirty = true; } catch (_) {}
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  });
}
window._zaColResize = _zaColResize;

// ═══════════════════════════════════════════════════════════════
//  کالم 1 (دائیں، تنگ) — خودکار نمبر شمار
//  حالات کے کالم میں جتنے پیراگراف ہوں، اُتنے ہی نمبر (1، 2، 3 …) —
//  ہر نمبر ٹھیک اپنے پیراگراف کی پہلی سطر کے برابر (بیرونی ضمنی جیسا)
// ═══════════════════════════════════════════════════════════════
function _zaParas() {
  const doc = _zimniDoc();
  if (!doc) return [];
  const hasText = (el) => String(el.textContent || '').replace(/[\s\u00A0]/g, '').length > 0;
  const marks = [];

  const markOf = (nodes) => {
    try {
      const rg = document.createRange();
      rg.setStartBefore(nodes[0]);
      rg.setEndAfter(nodes[nodes.length - 1]);
      const r = rg.getBoundingClientRect();
      if (!r.height) return null;
      return { getBoundingClientRect: () => rg.getBoundingClientRect() };
    } catch (_) { return null; }
  };

  const scan = (host) => {
    const kids = [...host.children].filter(el =>
      (el.tagName === 'DIV' || el.tagName === 'P') && hasText(el));
    if (kids.length) { kids.forEach(k => marks.push(k)); return; }
    let run = [];
    const flush = () => {
      if (!run.length) return;
      const txt = run.map(n => n.textContent || '').join('').replace(/[\s\u00A0]/g, '');
      if (txt) { const m = markOf(run); if (m) marks.push(m); }
      run = [];
    };
    [...host.childNodes].forEach(n => {
      if (n.nodeType === 1 && n.tagName === 'BR') { flush(); return; }
      run.push(n);
    });
    flush();
  };

  const bodies = [...doc.querySelectorAll('.zfa-body')];
  if (!bodies.length) return [];
  bodies.forEach(scan);
  return marks;
}

function _zaAutoNumbers() {
  const doc = _zimniDoc();
  if (!doc) return { ok: false, wajah: 'اندرونی ضمنی کا صفحہ (#ch173-doc) نہیں ملا' };
  const td = doc.querySelector('td.zfa-c-serial');
  if (!td) return { ok: false, wajah: 'نمبر شمار کا خانہ (td.zfa-c-serial) نہیں ملا' };
  let nums = doc.querySelector('.zfa-nums');
  if (nums && nums.getAttribute('contenteditable') !== 'true') {
    nums.setAttribute('contenteditable', 'true');
  }
  if (!nums) {
    nums = document.createElement('div');
    nums.className = 'zfa-nums';
    nums.setAttribute('contenteditable', 'true');
    td.appendChild(nums);
  }
  const paras = _zaParas();

  while (nums.children.length > paras.length) nums.lastChild.remove();
  while (nums.children.length < paras.length) {
    const d = document.createElement('div');
    d.className = 'zfa-num';
    nums.appendChild(d);
  }
  [...nums.children].forEach((d, i) => {
    if (d.dataset.manual !== '1') {
      const t = String(i + 1);
      if (d.textContent !== t) d.textContent = t;
    }
    d.style.marginTop = '0px';
  });
  if (!paras.length) {
    return { ok: false, wajah: 'کوئی پیراگراف نہیں ملا (حالات کا کالم خالی ہے؟)',
             bodies: doc.querySelectorAll('.zfa-body').length };
  }

  try {
    const scale = (() => {
      const r = td.getBoundingClientRect();
      return (td.offsetHeight && r.height) ? (r.height / td.offsetHeight) : 1;
    })() || 1;
    for (let i = 0; i < paras.length; i++) {
      const d = nums.children[i];
      if (!d) continue;
      const gap = Math.round((paras[i].getBoundingClientRect().top - d.getBoundingClientRect().top) / scale);
      if (gap > 0 && gap < 5000) d.style.marginTop = gap + 'px';
    }
  } catch (_) {}
  return { ok: true, paras: paras.length, numbers: nums.children.length,
           bodies: doc.querySelectorAll('.zfa-body').length };
}
window._zaAutoNumbers = _zaAutoNumbers;

function _zaStartNumbers() {
  const doc = _zimniDoc();
  if (!doc) return;
  const kick = () => {
    clearTimeout(doc._zfaNumT);
    doc._zfaNumT = setTimeout(() => { try { _zaAutoNumbers(); } catch (_) {} }, 200);
  };
  if (!doc._zfaNumEdit) {
    doc._zfaNumEdit = true;
    doc.addEventListener('input', (e) => {
      try {
        const n = e.target && e.target.closest ? e.target.closest('.zfa-num') : null;
        if (n) { n.dataset.manual = '1'; return; }
        const inNums = e.target && e.target.closest && e.target.closest('.zfa-nums');
        if (inNums) return;
      } catch (_) {}
      kick();
    });
  }
  try {
    if (!doc._zfaNumObs && typeof MutationObserver !== 'undefined') {
      doc._zfaNumObs = new MutationObserver((muts) => {
        for (const m of muts) {
          const t = m.target;
          if (t && t.closest && t.closest('.zfa-nums')) continue;
          kick(); return;
        }
      });
      doc._zfaNumObs.observe(doc, { childList: true, subtree: true, characterData: true });
    }
  } catch (_) {}
  try { if (doc._zfaNumIv) clearInterval(doc._zfaNumIv); } catch (_) {}
  doc._zfaNumIv = setInterval(() => {
    const d = _zimniDoc();
    if (!d) { try { clearInterval(doc._zfaNumIv); } catch (_) {} return; }
    try {
      const chahiye = _zaParas().length;
      const mojood  = d.querySelectorAll('.zfa-num').length;
      if (chahiye !== mojood) { _zaAutoNumbers(); }
    } catch (_) {}
  }, 2000);
  kick();
}
window._zaStartNumbers = _zaStartNumbers;

// ═══════════════════════════════════════════════════════════════
//  ٹیبل بالکل صفحہ 1 پر — قطار کی اونچائی وہی جو صفحے میں بچی ہے
//  (بیرونی ضمنی کا وہی _zimniFitTable اصول — کوئی <thead> نہیں یہاں)
// ═══════════════════════════════════════════════════════════════
function _zaFitTable() {
  const doc = _zimniDoc();
  if (!doc) return;
  const table = doc.querySelector('table.zfa-tbl');
  const td = doc.querySelector('table.zfa-tbl tbody td');
  if (!table || !td) return;
  const IN = 96;
  const paper = (typeof _ch173Paper !== 'undefined') ? _ch173Paper : 'legal';
  let padY = 0;
  try {
    const cs = getComputedStyle(doc);
    padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
  } catch (_) {}
  const kaam = ((paper === 'a4') ? 11.7 : 13) * IN - padY;
  if (kaam < 200) return;
  try {
    const dRect = doc.getBoundingClientRect();
    const tRect = table.getBoundingClientRect();
    const scale = (doc.offsetHeight && dRect.height) ? (dRect.height / doc.offsetHeight) : 1;
    let padT = 0;
    try { padT = parseFloat(getComputedStyle(doc).paddingTop) || 0; } catch (_) {}
    const tTop = ((tRect.top - dRect.top) / (scale || 1)) - padT;
    let h = Math.floor(kaam - tTop - 2);
    if (h < 120) h = 120;
    if (String(td.style.height) !== (h + 'px')) {
      table.querySelectorAll('tbody td').forEach(c => { c.style.height = h + 'px'; });
    }
  } catch (_) {}
}
window._zaFitTable = _zaFitTable;

function _zaLayout() {
  try { _zaFitTable(); } catch (_) {}
  // AHEM: _zaAutoNumbers() جان بوجھ کر یہاں سے ہٹایا — کالم 1 اب manual ہے
}
window._zaLayout = _zaLayout;

// Bairooni Zimni form ki CSS jaisa hi pattern — androoni ke apne zfa-* classes
function _zaFormCSS() {
  return `
  /* ── سرنامہ ── پولیس فارم نمبر — bairooni ke zf-formno jaisa، درمیان ── */
  #ch173-doc .zfa-formno{ font-size:14pt; font-weight:normal; direction:ltr; text-align:center; margin-bottom:4px; }
  #ch173-doc .zfa-head{ direction:rtl; margin-bottom:2px; line-height:1.3; text-align:center; }
  /* عنوان — باقی پورے صفحے سے الگ سائز (26pt) اور انڈر لائن — bairooni ke zf-title jaisa */
  #ch173-doc .zfa-title{ font-size:26pt; font-weight:normal; text-align:center; line-height:1.3;
    text-decoration:underline; text-underline-offset:5px; }

  /* ── سطر: مقدمہ نمبر | مورخہ | جرم | تھانہ — ایک لائن، پورے صفحے کے 14pt پر ──
     AHEM: yahan pehle "display:flex" tha — har field apna alag flex-item tha۔
     Iska masla: screen par to yeh sab EK LINE mein theek dikhta tha، lekin jab
     matn select/copy kiya jata (ya kabhi kabhi print) to browser flex-item ki
     "boundary" par khud-ba-khud newline daal deta hai — is se har label aur
     qadar apni ALAG line par nazar ati (jaisa Shafi bhai ne bheja: مقدمہ نمبر
     phir agli line par 347/26 waghera)۔ Halanke asal masla flex ka tha, koi
     "gap" ka nahi۔ Hal: plain inline elements (bilkul normal paragraph text
     jaisa) — yeh copy/print/screen teeno mein aik jaisa, sahih line par rehta
     hai, aur khud apni jagah lambai ke mutabiq phailta hai (auto-expand)۔
     دائیں کنارے سے شروع — کوئی اضافی padding-right نہیں (ٹیبل کی سیدھ میں)۔ */
  #ch173-doc .zfa-meta{ margin:2px 0 4px; padding-right:0; font-size:14pt; font-weight:normal;
    direction:rtl; text-align:center; line-height:1.8; }
  #ch173-doc .zfa-fld{ display:inline; margin-left:22px; }
  #ch173-doc .zfa-lbl{ font-weight:normal; white-space:nowrap; }
  #ch173-doc .zfa-ln{ padding:0 1px; outline:none; unicode-bidi:plaintext; }
  /* جرم — دفعات دائیں، "ت پ" ہمیشہ بائیں کنارے پر — bidi isolation کافی ہے
     (flex/margin-left:auto کی ضرورت نہیں: RTL سیدھ میں پہلے آنے والا حصہ
     خود دائیں طرف اور بعد والا خود بائیں طرف بیٹھتا ہے) */
  #ch173-doc .zfa-jurm{ display:inline; margin-left:22px; }
  #ch173-doc .zfa-j-body{ unicode-bidi:isolate; direction:ltr; }
  #ch173-doc .zfa-j-suf{ unicode-bidi:isolate; direction:rtl; }


  /* ── MAIN TABLE — 3 کالم: نمبر شمار (دائیں) | تنگ خالی کالم | حالات (بائیں، چوڑا) ── */
  #ch173-doc table.zfa-tbl{ width:100%; border-collapse:collapse; table-layout:fixed;
    direction:rtl; margin:0; }
  #ch173-doc table.zfa-tbl td{ border:1px solid #000; padding:8px 9px; font-size:14pt;
    vertical-align:top; line-height:1.5; text-align:justify; text-align-last:right;
    overflow-wrap:anywhere; word-break:break-word; position:relative; }
  /* قطار کی اونچائی JS (_zaFitTable) حساب سے دیتا ہے — یہ صرف ابتدائی ناپ */
  #ch173-doc table.zfa-tbl tbody td{ height:22cm; border-bottom:none; }
  /* باہر کی دائیں، بائیں لکیریں نہیں — صرف اندرونی 2 کالم-تقسیم کی لکیریں */
  #ch173-doc .zfa-tbl tr > td:first-child{ border-right:none; }
  #ch173-doc .zfa-tbl tr > td:last-child{ border-left:none; }
  /* نمبر شمار کا کالم */
  #ch173-doc .zfa-c-serial{ text-align:center; text-align-last:center; }
  #ch173-doc .zfa-nums{ display:block; }
  #ch173-doc .zfa-num{ display:block; text-align:center; line-height:1.5; }
  /* تنگ خالی کالم — اصل فارم جیسا، کوئی مواد نہیں */
  #ch173-doc .zfa-c-gutter{ padding:0; }
  /* حالات کا کالم */
  #ch173-doc .zfa-body{ margin-top:2px; font-size:14pt; line-height:1.5;
    text-align:justify; text-align-last:right; outline:none; white-space:pre-wrap; }
  #ch173-doc .zfa-body > div, #ch173-doc .zfa-body > p{ margin:0 0 1em 0; }

  /* ── گواہ کا بیان ── */
  #ch173-doc .zfa-wit-block{ margin:4px 0 16px; }
  /* عنوان — "بیان ازاں نام" (دائیں، عام وزن)، اُس کے نیچے حوالہ (بائیں) */
  /* عنوان — "بیان ازاں نام" (دائیں)، حوالہ float سے بائیں کنارے پر —
     نام مختصر ہو تو دونوں ایک ہی لائن میں؛ نام طویل ہو کر لپٹے تو حوالہ
     اپنی جگہ (بائیں کنارے) پر رہتا ہے، نام کی اگلی سطریں پوری چوڑائی لیتی ہیں */
  #ch173-doc .zfa-wit-headrow{ margin-bottom:4px; display:flow-root; }
  #ch173-doc .zfa-wit-head{ font-weight:bold; }
  #ch173-doc .zfa-wit-ref{ float:left; font-weight:normal; unicode-bidi:isolate;
    white-space:nowrap; margin-left:10px; }
  #ch173-doc .zfa-wit-stmt{ min-height:1.6em; margin:4px 0 8px; outline:none; }
  #ch173-doc .zfa-wit-close{ margin:2px 0 10px; text-align:center !important;
    text-align-last:center !important; }
  /* تفتیشی افسر (بغیر لیبل) — بائیں طرف، نام کے نیچے تاریخ خود مرکز میں */
  #ch173-doc .zfa-wit-sign{ float:left; text-align:center !important;
    text-align-last:center !important; margin-top:36px; }
  #ch173-doc .zfa-wit-io{ font-weight:normal; white-space:nowrap; }
  #ch173-doc .zfa-wit-date{ margin-top:2px; unicode-bidi:isolate; }

  /* مثل باندھنے کی جگہ — صرف چھپائی میں */
  #ch173-doc .zfa-bindmark{ display:none; }
  @media print{
    #ch173-doc table.zfa-tbl, #ch173-doc table.zfa-tbl tbody,
    #ch173-doc table.zfa-tbl tbody tr, #ch173-doc table.zfa-tbl tbody td{
      page-break-inside:auto !important; break-inside:auto !important; }
    #ch173-doc .zfa-bindmark{
      display:block; float:left; width:2in; height:2in; margin-top:1.25em;
      shape-outside:polygon(0 0, 2in 0, 0 2in);
      -webkit-shape-outside:polygon(0 0, 2in 0, 0 2in);
      shape-margin:3mm; -webkit-shape-margin:3mm;
      clip-path:polygon(0 0, 2in 0, 0 2in);
      -webkit-clip-path:polygon(0 0, 2in 0, 0 2in);
    }
  }

  /* ── Table کی لکیریں MOVEABLE ── */
  #ch173-doc .zfa-colgrip{ position:absolute; top:0; left:-3px; width:7px; height:100%;
    cursor:col-resize; user-select:none; z-index:6; }
  #ch173-doc .zfa-colgrip:hover{ background:rgba(56,189,248,.35); }
  #ch173-doc .zfa-rowgrip{ position:absolute; bottom:0; left:0; width:100%; height:9px;
    cursor:row-resize; user-select:none; z-index:6; }
  #ch173-doc .zfa-rowgrip:hover{ background:rgba(56,189,248,.45); }
  @media print{ #ch173-doc .zfa-colgrip, #ch173-doc .zfa-rowgrip{ display:none !important; } }

  /* Paste کیا ہوا متن ہمیشہ Nastaliq */
  #ch173-doc .zfa-body *, #ch173-doc .zfa-tbl td *, #ch173-doc .zfa-meta *{
    font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif !important;
  }`;
}

// Default document body — Androoi_Zimni.docx کی ہو بہو نقل (title + ایک سطر کے 4
// خانے + 3-کالمی ٹیبل)۔ Fixed chrome = contenteditable=false نہیں (پورا صفحہ
// editable ہے، بیرونی ضمنی جیسا)۔ Known fields case/officer سے auto-fetch۔
function _zaDefaultBody(o, c) {
  o = o || {}; c = c || {};
  const E = (v) => (typeof esc === 'function') ? esc(v == null ? '' : String(v)) : (v == null ? '' : String(v));
  const D = (v) => v ? ((typeof formatDate === 'function') ? formatDate(v) : v) : '';

  const thana   = E(o.station || '');
  const firNo   = E(c.fir_number || '');
  const firDate = E(D(c.fir_date || ''));
  // جرم — دفعات اور "ت پ" الگ الگ (ت پ ہمیشہ بائیں کنارے پر — bairooni ka wahi
  // rule, _ch173JurmParts se؛ AHEM: sadha concatenation kabhi na karein, warna
  // "ت پ" RTL matn ke andar seedhe dayen taraf aa kar ghalat jagah baith jata hai)
  let jBody = ((c.section_of_law || '') + ' ' + (c.offence_type || '')).trim();
  let jSuf  = 'ت پ';
  try {
    if (typeof _ch173JurmParts === 'function') {
      const jp = _ch173JurmParts(c.section_of_law);
      jBody = jp.body; jSuf = jp.suffix;
    }
  } catch (_) {}

  return `
  <div class="zfa-head">
    <div class="zfa-formno">پولیس فارم نمبر&nbsp;25—54(2)</div>
    <div class="zfa-title">اندرونی ضمنی</div>
  </div>

  <div class="zfa-meta">
    <span class="zfa-fld"><span class="zfa-lbl">مقدمہ نمبر</span>&nbsp;<span class="zfa-ln" data-k="fir">${firNo}</span></span>
    <span class="zfa-fld"><span class="zfa-lbl">مورخہ</span>&nbsp;<span class="zfa-ln" data-k="fdate">${firDate}</span></span>
    <span class="zfa-jurm"><span class="zfa-lbl">جرم</span>&nbsp;<span class="zfa-ln zfa-j-body" data-k="jurm">${E(jBody)}</span>&nbsp;<span class="zfa-j-suf" data-k="jurm_suf">${E(jSuf)}</span></span>
    <span class="zfa-fld"><span class="zfa-lbl">تھانہ</span>&nbsp;<span class="zfa-ln" data-k="thana">${thana}</span></span>
  </div>

  <table class="zfa-tbl">
    <colgroup>
      <col style="width:12%"><col style="width:5%"><col style="width:83%">
    </colgroup>
    <tbody>
      <tr>
        <td class="zfa-c-serial"><div class="zfa-nums" contenteditable="true"></div></td>
        <td class="zfa-c-gutter" contenteditable="true"><br></td>
        <td class="zfa-c-body">
          <div class="zfa-body" data-mic="true"><br></div>
        </td>
      </tr>
    </tbody>
  </table>`;
}

// ── SAVE ──────────────────────────────────────────────────────
async function _saveZimniA(silent, keepOpen) {
  const ed = _zimniDoc();
  if (!ed) return false;
  const bodyHtml = _zimniCleanHTML(ed.innerHTML);
  const z = _zaActive || {};

  // گواہان کے نام — DOM سے براہ راست نکالو (ہمیشہ اصل مواد کے مطابق رہتا
  // ہے، الگ سے یاد رکھی ہوئی فہرست کبھی غلط ہم آہنگ نہیں ہو سکتی)
  let witnessNames = [];
  try {
    witnessNames = [...new Set([...ed.querySelectorAll('.zfa-wit-block')]
      .map(b => (b.getAttribute('data-witness-name') || '').trim())
      .filter(Boolean))];
  } catch (_) {}

  let serialNo = parseInt(z.serial_no, 10) || 0;
  if (!serialNo) {
    try { serialNo = Math.max(0, ..._zaList.map(x =>
      parseInt(x.serial_no, 10) || parseInt((x.content || {}).serial_no, 10) || 0)) + 1; }
    catch (_) { serialNo = 1; }
  }

  let head = '';
  try {
    const hi = document.getElementById('zfa-head-in');
    head = hi ? String(hi.value || '').trim() : '';
  } catch (_) {}
  if (!head) head = (z.content && z.content.head) || 'بیان';

  const savedAt = new Date().toISOString();
  const rec = {
    case_id: _zaCaseId,
    serial_no: serialNo,
    report_date: (z.report_date || savedAt.slice(0, 10)),
    content: { bodyHtml, head, serial_no: serialNo, saved_at: savedAt, witnesses: witnessNames },
  };

  try {
    if (typeof dioRegisterSaved === 'function')
      dioRegisterSaved('zimni_androoni', head + ' — نمبر ' + serialNo,
        { case_id: _zaCaseId, serial_no: serialNo });
  } catch (_) {}

  const localSave = (obj) => {
    try {
      const i = _zaList.findIndex(x => String(x.id) === String(obj.id));
      if (i >= 0) _zaList[i] = obj; else _zaList.push(obj);
      _zaList.sort((a, b) => (parseInt(b.serial_no, 10) || 0) - (parseInt(a.serial_no, 10) || 0));
      localStorage.setItem('dio_za_' + _zaCaseId, JSON.stringify(_zaList));
    } catch (_) {}
  };

  if (!navigator.onLine || window._zaDbBroken) {
    const id = z.id || ('local-' + Date.now());
    const obj = Object.assign({ id }, rec);
    _zaActive = obj; localSave(obj);
    try {
      if (typeof offlineStore !== 'undefined' && offlineStore.enqueue) {
        await offlineStore.enqueue('zimni_androoni_reports',
          String(id).startsWith('local-') ? 'insert' : 'update',
          String(id).startsWith('local-') ? rec : Object.assign({ id }, rec));
      }
    } catch (_) {}
    if (!silent) showToast('📴 آف لائن محفوظ — انٹرنیٹ آنے پر sync ہوگا', 'info');
    try { _zaStampUpdated(savedAt); } catch (_) {}
    if (!keepOpen && !silent) setTimeout(() => { try { _renderZimniAList(); } catch (_) {} }, 200);
    return true;
  }

  try {
    try {
      const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
      if (oid) rec.officer_id = oid;
    } catch (_) {}

    const base = {};
    Object.keys(rec).forEach(k => { if (k !== 'content') base[k] = rec[k]; });
    const editing = z.id && !String(z.id).startsWith('local-') && !String(z.id).startsWith('tmp_');
    let savedRec = await _zaWrite(base, rec.content, editing ? z.id : null);
    savedRec = Object.assign({}, savedRec, { content: rec.content });
    _zaActive = savedRec;
    localSave(savedRec);

    let ok = true;
    try {
      const chk = await supabaseClient.from('zimni_androoni_reports')
        .select('id').eq('case_id', _zaCaseId).eq('id', savedRec.id);
      if (chk.error || !chk.data || !chk.data.length) ok = false;
    } catch (_) { ok = false; }

    if (!silent) {
      if (ok) showToast('✅ اندرونی ضمنی نمبر ' + serialNo + ' محفوظ ہو گئی', 'success');
      else showToast('⚠️ اندرونی ضمنی نمبر ' + serialNo + ' مقامی طور پر محفوظ ہے، مگر ڈیٹابیس میں تصدیق نہ ہو سکی', 'warn', 7000);
    }

    try {
      await _loadZimniA();
      if (!silent && !keepOpen) setTimeout(() => { try { _renderZimniAList(); } catch (_) {} }, 200);
    } catch (_) {}
    if (keepOpen) { try { _zaStampUpdated(savedAt); } catch (_) {} }
    return true;
  } catch (e) {
    const id = z.id || ('local-' + Date.now());
    const obj = Object.assign({ id }, rec);
    _zaActive = obj; localSave(obj);
    let msg = '';
    try {
      msg = [e && e.message, e && e.details, e && e.hint,
             (e && e.code) ? ('code ' + e.code) : '']
            .filter(Boolean).join(' — ');
    } catch (_) {}
    if (!msg) { try { msg = JSON.stringify(e); } catch (_) { msg = String(e); } }
    try { console.error('[zimni androoni save]', e); } catch (_) {}
    showToast('❌ محفوظ نہ ہو سکی: ' + msg + ' (مقامی نقل محفوظ ہے)', 'error', 8000);
    return false;
  }
}
window._saveZimniA = _saveZimniA;

async function _deleteZimniA(id, skipConfirm) {
  if (!skipConfirm && !confirm('کیا آپ یہ اندرونی ضمنی حذف کرنا چاہتے ہیں؟')) return;
  try {
    await supabaseClient.from('zimni_androoni_reports').delete().eq('id', id);
    _zaList = _zaList.filter(z => z.id !== id);
    try { localStorage.setItem('dio_za_' + _zaCaseId, JSON.stringify(_zaList)); } catch (_) {}
    _renderZimniAList();
    showToast('🗑️ حذف ہو گئی', 'info');
  } catch (e) { showToast('❌ ' + e.message, 'error'); }
}
window._deleteZimniA = _deleteZimniA;

// ═══════════════════════════════════════════════════════════════
//  مثل باندھنے کی جگہ — دوسرے صفحے سے، اوپر بائیں کونے میں مثلث
//  (بیرونی ضمنی جیسا اصول۔ صرف چھپائی کے لیے۔)
// ═══════════════════════════════════════════════════════════════
function _zaAddBindMarks() {
  const daale = [];
  const doc = _zimniDoc();
  if (!doc) return daale;
  const host = doc.querySelector('.zfa-body');
  if (!host || !host.firstChild) return daale;

  const IN = 96;
  const paper = (typeof _ch173Paper !== 'undefined') ? _ch173Paper : 'legal';
  const safhaH = ((paper === 'a4') ? 11.7 : 13) * IN;
  let hashiya = 0;
  try {
    const cs = getComputedStyle(doc);
    hashiya = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
  } catch (_) {}
  const kaam = safhaH - hashiya;
  if (kaam < 100) return daale;

  const docTop = doc.getBoundingClientRect().top;
  const tukre = [];
  let kul = 0;
  const w = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, null);
  let n;
  while ((n = w.nextNode())) {
    if (!n.nodeValue.length) continue;
    tukre.push({ node: n, shuru: kul });
    kul += n.nodeValue.length;
  }
  if (!kul) return daale;

  const jagah = (i) => {
    for (let k = 0; k < tukre.length; k++) {
      const t = tukre[k];
      if (i >= t.shuru && i < t.shuru + t.node.nodeValue.length) {
        try {
          const rg = document.createRange();
          rg.setStart(t.node, i - t.shuru);
          rg.setEnd(t.node, i - t.shuru + 1);
          const r = rg.getBoundingClientRect();
          return r.height ? (r.top - docTop) : null;
        } catch (_) { return null; }
      }
    }
    return null;
  };

  const aakhri = jagah(kul - 1);
  if (aakhri == null) return daale;
  const safhe = Math.floor(aakhri / kaam);
  for (let p = 1; p <= safhe; p++) {
    const hadd = p * kaam;
    let lo = 0, hi = kul - 1, mila = -1;
    for (let g = 0; g < 24 && lo <= hi; g++) {
      const mid = (lo + hi) >> 1;
      const y = jagah(mid);
      if (y == null) { lo = mid + 1; continue; }
      if (y >= hadd) { mila = mid; hi = mid - 1; } else { lo = mid + 1; }
    }
    if (mila < 0) continue;
    for (const t of tukre) {
      const off = mila - t.shuru;
      if (off >= 0 && off < t.node.nodeValue.length) {
        try {
          const baad = t.node.splitText(off);
          const tri = document.createElement('span');
          tri.className = 'zfa-bindmark';
          t.node.parentNode.insertBefore(tri, baad);
          daale.push(tri);
        } catch (_) {}
        break;
      }
    }
  }
  return daale;
}
window._zaAddBindMarks = _zaAddBindMarks;

// چالان/بیرونی ضمنی jaisa print: kaghaz + margins report173 se، CSS bhi
// report173 (_ch173CSS) + androoni form CSS ملا کر — screen aur print aik jaisa
function _zaPrintHTML(inner) {
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
      ${_zaFormCSS()}
      #ch173-doc{ width:100% !important; max-width:none !important; height:auto !important;
        min-height:0 !important; padding:0 !important; margin:0 !important;
        transform:none !important; box-shadow:none !important; border-radius:0 !important; }
      #ch173-doc table.zfa-tbl, #ch173-doc table.zfa-tbl tbody,
      #ch173-doc table.zfa-tbl tbody tr, #ch173-doc table.zfa-tbl tbody td{
        page-break-inside:auto !important; break-inside:auto !important; }
      /* AHEM: bug tha — JS (_zaAddBindMarks) '.zfa-bindmark' class banata hai,
         lekin CSS pehle sirf '.zfa-bind' ko style karti thi (naam mismatch),
         isi liye 2nd page wali مثلث kabhi nazar hi nahi aati thi. bairooni ke
         _zimniPrintHTML jaisa — yahan seedha (unconditional) sahi class: */
      #ch173-doc .zfa-bindmark{ display:block !important; float:left; width:2in; height:2in;
        margin-top:1.25em;
        shape-outside:polygon(0 0, 2in 0, 0 2in);
        -webkit-shape-outside:polygon(0 0, 2in 0, 0 2in);
        shape-margin:3mm; -webkit-shape-margin:3mm;
        clip-path:polygon(0 0, 2in 0, 0 2in);
        -webkit-clip-path:polygon(0 0, 2in 0, 0 2in); }
      .no-print, button, select{ display:none !important; }
      #ch173-doc, #ch173-doc *{ orphans:2; widows:2; }
    </style></head><body><div id="ch173-doc">${inner}</div></body></html>`;
}
window._zaPrintHTML = _zaPrintHTML;

function _zaPrintDoc(inner) {
  const html = _zaPrintHTML(inner);
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
}

// ── PRINT (صرف دستاویز — MS-Word اصول) ──────────────────────────
function _printZimniA() {
  const ed = _zimniDoc();
  if (!ed) return;
  try { _zaLayout(); } catch (_) {}
  let marks = [];
  try { marks = _zaAddBindMarks() || []; } catch (_) {}
  let inner = _zimniCleanHTML(ed.innerHTML);
  try { marks.forEach(m => m.remove()); ed.normalize(); } catch (_) {}
  try { _zaLayout(); } catch (_) {}
  _zaPrintDoc(inner);
}
window._printZimniA = _printZimniA;

// ═══════════════════════════════════════════════════════════════
//  فہرست کے ایکشن بٹن (پرنٹ / شیئر / PDF)
// ═══════════════════════════════════════════════════════════════
function _zaDocHTML(z) {
  const c = z.content || {};
  return _zaPrintHTML(c.bodyHtml || '');
}
function _zaById(id) { return (_zaList || []).find(z => String(z.id) === String(id)); }

function _printZimniAById(id) {
  const z = _zaById(id);
  if (!z) { if (typeof showToast === 'function') showToast('⚠️ اندرونی ضمنی نہیں ملی', 'error'); return; }
  const html = _zaDocHTML(z);
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
}

function _printAllZimniA() {
  if (!_zaList || !_zaList.length) {
    if (typeof showToast === 'function') showToast('⚠️ کوئی اندرونی ضمنی موجود نہیں', 'info'); return;
  }
  const body = _zaList.map((z, i) => {
    const c = z.content || {};
    const brk = (i < _zaList.length - 1) ? 'style="page-break-after:always;"' : '';
    return `<div ${brk}>${c.bodyHtml || ''}</div>`;
  }).join('');
  const html = _zaPrintHTML(body);
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
}

function _pdfZimniA(id) {
  if (typeof showToast === 'function')
    showToast('📄 پرنٹ ونڈو میں "Save as PDF" منتخب کریں', 'info', 4000);
  _printZimniAById(id);
}

async function _emailZimniA(id) {
  const z = _zaById(id);
  if (!z) return;
  const c    = z.content || {};
  const dt   = z.report_date ? (typeof formatDate === 'function' ? formatDate(z.report_date) : z.report_date) : '';
  const text = (c.bodyHtml || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').replace(/\n{3,}/g, '\n\n').trim();
  const subj = `اندرونی ضمنی نمبر ${z.serial_no || ''}${dt ? ' — ' + dt : ''}`;
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

window._printZimniAById = _printZimniAById;
window._printAllZimniA  = _printAllZimniA;
window._pdfZimniA       = _pdfZimniA;
window._emailZimniA     = _emailZimniA;
window._zaDocHTML       = _zaDocHTML;

// ═══════════════════════════════════════════════════════════════
//  NOTE: Ctrl+S — _dioBindCtrlS() zimni.js میں رہتا ہے (پورے سسٹم
//  کے لیے مشترکہ)۔ اُس میں .zfa-tbl کو پہچاننے کی ایک سطر شامل کی
//  گئی ہے (zimni.js کا ورژن v15 دیکھیں) — یہاں دوبارہ لکھنے کی
//  ضرورت نہیں۔
// ═══════════════════════════════════════════════════════════════
