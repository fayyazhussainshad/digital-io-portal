// ═══ فائل کا نمبر — تصدیق کے لیے کہ نئی فائل چل رہی ہے یا پرانی cached ═══
// کنسول میں لکھیں:  ZIMNI_VER    →  اگر نیچے والا نمبر نظر آئے تو نئی فائل ہے
const ZIMNI_VER = 'zimni v20 — androoni module MERGED back (161 chip) + v19 chaining/numbering';
window.ZIMNI_VER = ZIMNI_VER;

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

// ═══════════════════════════════════════════════════════════════
//  zimni_reports کا اصل ڈھانچہ خود پہچانو
//  مسئلہ: کچھ ڈیٹابیس میں 'content' نام کا کالم ہے ہی نہیں
//  (PGRST204). اندازہ لگانے کے بجائے: (1) موجودہ سطر سے کالم پڑھو،
//  (2) نہ ملے تو ممکنہ ناموں کو باری باری آزماؤ اور جو چل جائے
//  اُسے یاد رکھو۔
// ═══════════════════════════════════════════════════════════════
const ZIMNI_CONTENT_COLS = ['content', 'content_json', 'data', 'form_data',
                            'body', 'body_html', 'html', 'report_content', 'details'];

function _zimniColPref() {
  try { return localStorage.getItem('dio_zimni_col') || ''; } catch (_) { return ''; }
}
function _zimniColSet(c) {
  try { if (c) localStorage.setItem('dio_zimni_col', c); } catch (_) {}
}

// کسی سطر میں سے دستاویز کا مواد نکالو (کالم کا نام جو بھی ہو)
function _zimniContentOf(row) {
  if (!row) return {};
  for (const c of [_zimniColPref(), ...ZIMNI_CONTENT_COLS]) {
    if (!c || !(c in row)) continue;
    let v = row[c];
    if (v == null) continue;
    if (typeof v === 'string') {
      const t = v.trim();
      if (t.startsWith('{')) { try { return JSON.parse(t); } catch (_) {} }
      if (t) { _zimniColSet(c); return { bodyHtml: v }; }      // سادہ HTML کالم
      continue;
    }
    if (typeof v === 'object') { _zimniColSet(c); return v; }
  }
  return {};
}
window._zimniContentOf = _zimniContentOf;

// PGRST204 کے پیغام سے غائب کالم کا نام نکالو
function _zimniMissingCol(e) {
  try {
    const m = String((e && e.message) || '').match(/'([^']+)'\s+column/i);
    return m ? m[1] : '';
  } catch (_) { return ''; }
}

// محفوظ کرو — کالم کا نام خود ڈھونڈتے ہوئے
async function _zimniWrite(base, contentObj, id) {
  const tried = new Set();
  const cands = [_zimniColPref(), ...ZIMNI_CONTENT_COLS].filter(c => c && !tried.has(c) && (tried.add(c) || true));
  const payloadBase = Object.assign({}, base);
  let lastErr = null;

  for (let ci = 0; ci < cands.length; ci++) {
    const col = cands[ci];
    // ایک ہی کالم کے ساتھ چند بار — دوسرے غائب کالم ہٹاتے ہوئے
    for (let g = 0; g < 6; g++) {
      const rec = Object.assign({}, payloadBase);
      rec[col] = contentObj;
      try {
        let res;
        if (id) res = await supabaseClient.from('zimni_reports').update(rec).eq('id', id).select();
        else    res = await supabaseClient.from('zimni_reports').insert(rec).select();
        if (res.error) throw res.error;
        _zimniColSet(col);
        return (res.data && res.data[0]) || Object.assign({ id: id || ('tmp_' + Date.now()) }, rec);
      } catch (e) {
        lastErr = e;
        if (e && e.code === 'PGRST204') {
          const miss = _zimniMissingCol(e);
          if (miss && miss === col) break;                 // یہ کالم نہیں — اگلا نام آزماؤ
          if (miss && miss in payloadBase) { delete payloadBase[miss]; continue; }  // فالتو کالم ہٹا کر دوبارہ
        }
        // JSON کالم نہ ہو تو سادہ HTML متن کے طور پر ایک بار آزماؤ
        if (e && (e.code === '22P02' || /invalid input syntax|json/i.test(String(e.message || '')))
              && typeof contentObj === 'object') {
          try {
            const rec2 = Object.assign({}, payloadBase);
            rec2[col] = JSON.stringify(contentObj);
            let r2;
            if (id) r2 = await supabaseClient.from('zimni_reports').update(rec2).eq('id', id).select();
            else    r2 = await supabaseClient.from('zimni_reports').insert(rec2).select();
            if (!r2.error) { _zimniColSet(col); return (r2.data && r2.data[0]) || Object.assign({ id: id || ('tmp_' + Date.now()) }, rec2); }
            lastErr = r2.error;
          } catch (e2) { lastErr = e2; }
        }
        break;
      }
    }
  }
  throw lastErr || new Error('محفوظ نہ ہو سکی');
}
window._zimniWrite = _zimniWrite;

async function _loadZimni() {
  // مقامی نقل ہمیشہ ہاتھ میں رکھو (آف لائن یا ناکام محفوظ والی ضمنیاں ضائع نہ ہوں)
  let local = [];
  try { local = JSON.parse(localStorage.getItem('dio_zimni_' + _zimniCaseId) || '[]'); } catch (_) { local = []; }

  if (!navigator.onLine) { _zimniList = local; return; }

  // ═══ ڈیٹابیس کا ڈھانچہ ہی نہ ملے تو بار بار کوشش نہ کرو ═══
  // (کنسول میں درجنوں 400 آ رہے تھے۔ ایک بار ناکامی کے بعد مقامی نقل پر
  //  چلو اور افسر کو ایک بار صاف پیغام دو۔)
  if (window._zimniDbBroken) { _zimniList = local; return; }

  let rows = null;
  try {
    // 'serial_no' یا 'case_id' کالم نہ ہو تو query خود 400 دیتی ہے —
    // اسی لیے پہلے ترتیب کے ساتھ، پھر بغیر ترتیب، پھر بغیر چھانٹی۔
    let r = await supabaseClient.from('zimni_reports').select('*')
      .eq('case_id', _zimniCaseId).order('serial_no', { ascending: true });
    if (r.error) r = await supabaseClient.from('zimni_reports').select('*').eq('case_id', _zimniCaseId);
    if (r.error) r = await supabaseClient.from('zimni_reports').select('*').limit(50);
    if (r.error) throw r.error;
    rows = r.data || [];
  } catch (e) {
    window._zimniDbBroken = true;
    try { console.error('[zimni load] zimni_reports کا ڈھانچہ درست نہیں:', e); } catch (_) {}
    if (!window._zimniDbWarned) {
      window._zimniDbWarned = true;
      try {
        showToast('⚠️ ڈیٹابیس میں zimni_reports کے کالم درست نہیں — ضمنیاں فی الحال اسی کمپیوٹر پر محفوظ ہو رہی ہیں', 'warn', 9000);
      } catch (_) {}
    }
    _zimniList = local;
    return;
  }

  const fromDb = rows.map(r => Object.assign({}, r, { content: _zimniContentOf(r) }));
  // ڈیٹابیس میں نہ پہنچنے والے مقامی اندراج بھی ساتھ رکھو
  const ids = new Set(fromDb.map(r => String(r.id)));
  const onlyLocal = local.filter(z => String(z.id).startsWith('local-') && !ids.has(String(z.id)));
  _zimniList = fromDb.concat(onlyLocal)
    .sort((a, b) => (parseInt(b.serial_no, 10) || 0) - (parseInt(a.serial_no, 10) || 0));
  try { localStorage.setItem('dio_zimni_' + _zimniCaseId, JSON.stringify(_zimniList)); } catch (_) {}
}

// ── LIST VIEW (all zimni entries for this case) ───────────────
function _renderZimniList() {
  try { if (typeof _ch173FocusMode === 'function') _ch173FocusMode(false); } catch (_) {}  // chips wapas
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  try { if (typeof _ch173FullPage === 'function') _ch173FullPage(area); } catch (_) {}

  // ── ہمیشہ ضمنی نمبر کے حساب سے، بڑے سے چھوٹا (descending) ──
  // نمبر شمار — پہلے ڈیٹابیس کا کالم، نہ ہو تو دستاویز کے ساتھ محفوظ نمبر
  const sno = (z) => parseInt(z.serial_no, 10)
    || parseInt((z.content || {}).serial_no, 10) || 0;
  const list = _zimniList.slice().sort((a, b) => sno(b) - sno(a));

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
  const head = (z) => ((z.content || {}).head || 'رپورٹ ضمنی');

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
      <button class="btn btn-primary btn-sm" onclick="_newZimni()">➕ ضمنی درج کریں</button>
      <button class="btn btn-secondary btn-sm" onclick="_printAllZimni()">🖨️ تمام ضمنیاں</button>
      <div style="flex:1;"></div>
      <span style="font-size:11px;color:var(--text-muted);">ترتیب: ضمنی نمبر — بڑے سے چھوٹا</span>
    </div>
    ${list.length ? `
    <table class="zt">
      <thead><tr>
        <th class="num">نمبر شمار</th>
        <th class="dtc">تاریخ و وقت</th>
        <th>ہیڈ (قسم)</th>
        <th class="act">ایکشن</th>
      </tr></thead>
      <tbody>
        ${list.map(z => `
          <tr ondblclick="_openZimni('${z.id}')" style="cursor:pointer;">
            <td class="num">${esc(String(sno(z) || ''))}</td>
            <td class="dtc">${esc(dt(z))}${wq(z) ? `<div class="wq">${esc(wq(z))}</div>` : ''}</td>
            <td>${esc(head(z))}</td>
            <td class="act">
              <button class="zab" onclick="event.stopPropagation();_openZimni('${z.id}')" title="ترمیم">✏️</button>
              <button class="zab" onclick="event.stopPropagation();_copyZimni('${z.id}')" title="نقل (Copy)">📋</button>
              <button class="zab" onclick="event.stopPropagation();_printZimniById('${z.id}')" title="پرنٹ">🖨️</button>
              <button class="zab" onclick="event.stopPropagation();_emailZimni('${z.id}')" title="شیئر">📤</button>
              <button class="zab" onclick="event.stopPropagation();_pdfZimni('${z.id}')" title="PDF" style="font-size:10px;font-weight:800;color:#b91c1c;">PDF</button>
              <button class="zab" onclick="event.stopPropagation();_deleteZimni('${z.id}')" title="حذف">🗑️</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>` : `
    <div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
      <div style="font-size:40px;margin-bottom:10px;">📋</div>
      <div style="font-size:14px;">ابھی کوئی ضمنی رپورٹ نہیں</div>
      <div style="font-size:11px;margin-top:6px;">اوپر "ضمنی درج کریں" پر کلک کریں</div>
    </div>`}
  </div>`;
}

// ── فہرست کے ایکشن ─────────────────────────────────────────────
const _zimniRec = (id) => _zimniList.find(z => String(z.id) === String(id));

// 💾 اپ ڈیٹ — کھول کر دوبارہ محفوظ (تاریخ و وقت تازہ)
async function _updateZimni(id) {
  await _openZimni(id);
  setTimeout(async () => { await _saveZimni(); _renderZimniList(); }, 500);
}
window._updateZimni = _updateZimni;

// 📋 نقل — متن clipboard میں
async function _copyZimni(id) {
  const z = _zimniRec(id); if (!z) return;
  const txt = String((z.content || {}).bodyHtml || '')
    .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  try {
    await navigator.clipboard.writeText(txt);
    showToast('📋 نقل ہو گئی', 'success');
  } catch (_) { showToast('❌ نقل نہ ہو سکی', 'error'); }
}
window._copyZimni = _copyZimni;

// ✂️ کاٹیں — نقل کر کے حذف
async function _cutZimni(id) {
  const z = _zimniRec(id); if (!z) return;
  if (!confirm('ضمنی نمبر ' + (z.serial_no || '') + ' نقل کر کے حذف کر دیں؟')) return;
  await _copyZimni(id);
  await _deleteZimni(id, true);
}
window._cutZimni = _cutZimni;

// ↕️ Move — ضمنی نمبر بدلو (ترتیب خود بدل جائے گی)
async function _moveZimni(id) {
  const z = _zimniRec(id); if (!z) return;
  const inp = prompt('نیا ضمنی نمبر درج کریں:', String(z.serial_no || ''));
  if (inp === null) return;
  const n = parseInt(String(inp).replace(/[^\d]/g, ''), 10);
  if (!n || n < 1) { showToast('⚠️ درست نمبر درج کریں', 'warn'); return; }
  try {
    if (navigator.onLine && !String(z.id).startsWith('local-')) {
      const { error } = await supabaseClient.from('zimni_reports')
        .update({ serial_no: n }).eq('id', z.id);
      if (error) throw error;
    }
    z.serial_no = n;
    try { localStorage.setItem('dio_zimni_' + _zimniCaseId, JSON.stringify(_zimniList)); } catch (_) {}
    showToast('✅ ضمنی نمبر ' + n + ' ہو گیا', 'success');
  } catch (e) { showToast('❌ ' + (e.message || e), 'error'); }
  _renderZimniList();
}
window._moveZimni = _moveZimni;

function _newZimni() {
  const nextSerial = (_zimniList.reduce((m,z)=>Math.max(m,
    parseInt(z.serial_no,10) || parseInt((z.content||{}).serial_no,10) || 0), 0)) + 1;
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
  <style>${(typeof _ch173CSS === 'function') ? _ch173CSS() : ''}${_zimniFormCSS()}${(typeof _zaFormCSS === 'function') ? _zaFormCSS() : ''}</style>
  <div style="display:flex;flex-direction:column;height:100%;direction:rtl;">
    <!-- Topbar — report173 jaisa (chips patti cursor upar jane par nazar aati hai) -->
    <div class="no-print" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);flex-wrap:wrap;background:var(--bg-secondary);">
      <select id="ch173-paper-sel" onchange="_ch173SetPaper(this.value)" title="کاغذ کا سائز" style="${selCss}font-family:'Jameel Noori Nastaleeq',serif;">
        <option value="legal" ${paper==='legal'?'selected':''}>لیگل (8.5×13)</option>
        <option value="a4"    ${paper==='a4'   ?'selected':''}>A4 (8.27×11.7)</option>
      </select>
      <input id="zf-head-in" type="text" value="${esc(((saved && saved.head) || 'رپورٹ ضمنی'))}"
        placeholder="ہیڈ (قسم)" title="ہیڈ / قسم — فہرست میں یہی نظر آتا ہے"
        style="${selCss}width:150px;font-family:'Jameel Noori Nastaleeq',serif;">
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
        <select id="ch173-font-sel" onchange="_zimniSetFont(this.value)" title="فونٹ سائز" style="${selCss}">
          ${sizes.map(s => `<option value="${s}" ${String(s)==='14'?'selected':''}>${s}</option>`).join('')}
        </select>
        <button onmousedown="event.preventDefault()" onclick="_zimniFmt('undo')" title="واپس (Undo)" style="${btn}">↶</button>
        <button onmousedown="event.preventDefault()" onclick="_zimniFmt('redo')" title="دوبارہ (Redo)" style="${btn}">↷</button>
        <button class="btn btn-primary btn-sm dio-modbtn" onclick="_saveZimni()">💾 محفوظ</button>
        <button class="btn btn-secondary btn-sm dio-modbtn" onclick="_saveZimni(false,true)" title="محفوظ کریں مگر ضمنی کھلی رہے (Ctrl+S)">🔄 اپ ڈیٹ</button>
        <span id="zf-updated" style="font-size:11px;color:var(--text-muted);white-space:nowrap;align-self:center;"></span>
        <button class="btn btn-secondary btn-sm dio-modbtn" onclick="_printZimni()">🖨️ پرنٹ</button>
      </div>
    </div>

    <!-- Document — poora editable (har jaga likha ja sake), kaghaz asal naap par -->
    <div style="flex:1;overflow:auto;min-height:0;padding:16px;background:var(--bg-tertiary);">
      <div id="ch173-doc" contenteditable="true" spellcheck="false" style="
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
    try { _zimniBindKeys(); } catch (_) {}
    try { _dioBindCtrlS(); } catch (_) {}                                                  // Ctrl+S = اپ ڈیٹ                                                 // Tab/Enter/Ctrl+BIU/paste
    // ملزمان لوڈ کر کے بنام کے آگے خود لگا دو (▾ سے unselect ہو سکتا ہے)
    try { _zimniLoadAccused().then(() => { try { _zimniFillBanam(false); } catch (_) {} }); } catch (_) {}                                              // بنام ▾ کی فہرست
    try { if (typeof _ch173BrushOff === 'function') _ch173BrushOff(); } catch (_) {}
    try { if (typeof _ch173BindBrush === 'function') _ch173BindBrush(); } catch (_) {}     // format painter
    try { if (typeof _ch173BindCellPick === 'function') _ch173BindCellPick(); } catch (_) {}
    try { if (typeof _ch173FocusMode === 'function') _ch173FocusMode(true); } catch (_) {} // chips peek
    try { if (typeof _ch173WatchFit === 'function') _ch173WatchFit(); } catch (_) {}
    try { _zimniBindFindReplace(); } catch (_) {}                                          // Ctrl+F / Ctrl+H
    try { _zimniColResize(); } catch (_) {}
    try { if (saved && saved.saved_at) _zimniStampUpdated(saved.saved_at); } catch (_) {}
    // خانے کی ناپ + اضافی متن نیچے (چالان کا اصل نظام)
    try { _zimniLayout(); } catch (_) {}
    try { _zimniEnsureClosing(); } catch (_) {}   // اختتامی سطر (پرانی ضمنیوں کے لیے)
    try { _zimniStartNumbers(); } catch (_) {}          // خودکار نمبر — ہر حال میں چالو
    // ضمنی نمبر بدلتے ہی نیچے "نمبر شمار" بھی وہی ہو جائے
    try {
      const d0 = _zimniDoc();
      if (d0 && !d0._zfSerBound) {
        d0._zfSerBound = true;
        d0.addEventListener('input', (ev) => {
          try {
            /* ضمنی نمبر صرف محفوظ کرنے کے لیے پڑھا جاتا ہے */
          } catch (_) {}
          clearTimeout(d0._zfAlignT);
          d0._zfAlignT = setTimeout(() => {
            try { _zimniAlignSerial(); } catch (_) {}
            try { _zimniAutoNumbers(); } catch (_) {}
          }, 250);
        });
      }
    } catch (_) {}
    [250, 900, 1800].forEach(ms => setTimeout(() => { try { _zimniLayout(); } catch (_) {} }, ms));                                                // table ki lakeerein moveable
    // Cursor ke mutabiq font dropdown + B/I/U ki halat khud badle (MS Word jaisa)
    try {
      if (!window._zfSyncBound) {
        window._zfSyncBound = true;
        document.addEventListener('selectionchange', () => { try { _zimniSyncFmtBtns(); } catch (_) {} });
      }
    } catch (_) {}
    if (typeof applyMicButtons === 'function') applyMicButtons(area);
  }, 60);
}

// ═══════════════════════════════════════════════════════════════
//  MS Word جیسا Find (Ctrl+F) اور Replace (Ctrl+H) — editor (#ch173-doc)
// ═══════════════════════════════════════════════════════════════
let _zfrIdx = -1;

function _zimniBindFindReplace() {
  if (window._zfrBound) return;
  window._zfrBound = true;
  document.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = String(e.key || '').toLowerCase();
    if (k !== 'f' && k !== 'h') return;
    // Sirf tab jab editor (#ch173-doc) safhe par mojood ho
    const doc = (typeof _ch173Doc === 'function') ? _ch173Doc() : document.getElementById('ch173-doc');
    if (!doc) return;
    e.preventDefault();
    _zimniFindReplaceUI(k === 'h');
  }, true);
}
window._zimniBindFindReplace = _zimniBindFindReplace;

function _zfrMatches(term, matchCase) {
  const doc = (typeof _ch173Doc === 'function') ? _ch173Doc() : document.getElementById('ch173-doc');
  const out = [];
  if (!doc || !term) return out;
  const w = document.createTreeWalker(doc, NodeFilter.SHOW_TEXT, null);
  const t = matchCase ? term : term.toLowerCase();
  let n;
  while ((n = w.nextNode())) {
    const raw = n.nodeValue || '';
    const hay = matchCase ? raw : raw.toLowerCase();
    let i = 0;
    while ((i = hay.indexOf(t, i)) !== -1) { out.push({ node: n, start: i, end: i + term.length }); i += term.length; }
  }
  return out;
}

function _zfrSelect(m) {
  try {
    const r = document.createRange();
    r.setStart(m.node, m.start); r.setEnd(m.node, m.end);
    const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    const el = m.node.parentElement;
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  } catch (_) {}
}

function _zfrFindNext(back) {
  const box = document.getElementById('zfr-box'); if (!box) return;
  const term = box.querySelector('#zfr-find').value;
  const mc = box.querySelector('#zfr-mc').checked;
  const ms = _zfrMatches(term, mc);
  const cnt = box.querySelector('#zfr-count');
  if (!ms.length) { if (cnt) cnt.textContent = '0/0'; _zfrIdx = -1; return; }
  _zfrIdx = back ? (_zfrIdx <= 0 ? ms.length - 1 : _zfrIdx - 1)
                 : (_zfrIdx >= ms.length - 1 ? 0 : _zfrIdx + 1);
  _zfrSelect(ms[_zfrIdx]);
  if (cnt) cnt.textContent = (_zfrIdx + 1) + '/' + ms.length;
}

function _zfrReplaceOne() {
  const box = document.getElementById('zfr-box'); if (!box) return;
  const term = box.querySelector('#zfr-find').value;
  const rep  = box.querySelector('#zfr-rep-in') ? box.querySelector('#zfr-rep-in').value : '';
  const mc = box.querySelector('#zfr-mc').checked;
  const sel = window.getSelection();
  const cur = sel && sel.toString();
  const eq = mc ? (cur === term) : (String(cur).toLowerCase() === String(term).toLowerCase());
  if (cur && eq && sel.rangeCount) {
    const r = sel.getRangeAt(0);
    r.deleteContents(); r.insertNode(document.createTextNode(rep));
    try { _r173Dirty = true; } catch (_) {}
  }
  _zfrFindNext(false);
}

function _zfrReplaceAll() {
  const box = document.getElementById('zfr-box'); if (!box) return;
  const term = box.querySelector('#zfr-find').value;
  const rep  = box.querySelector('#zfr-rep-in') ? box.querySelector('#zfr-rep-in').value : '';
  const mc = box.querySelector('#zfr-mc').checked;
  const doc = (typeof _ch173Doc === 'function') ? _ch173Doc() : document.getElementById('ch173-doc');
  if (!doc || !term) return;
  let count = 0;
  const w = document.createTreeWalker(doc, NodeFilter.SHOW_TEXT, null);
  const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), mc ? 'g' : 'gi');
  let n;
  while ((n = w.nextNode())) {
    const before = n.nodeValue;
    const after = before.replace(re, () => { count++; return rep; });
    if (after !== before) n.nodeValue = after;
  }
  const cnt = box.querySelector('#zfr-count');
  if (cnt) cnt.textContent = count + ' بدلے';
  try { _r173Dirty = true; } catch (_) {}
}

function _zimniFindReplaceUI(withReplace) {
  let box = document.getElementById('zfr-box');
  if (box) {
    box.style.display = 'flex';
    box.querySelector('#zfr-rep-row').style.display = withReplace ? 'flex' : 'none';
    const f = box.querySelector('#zfr-find'); f.focus(); f.select();
    return;
  }
  box = document.createElement('div');
  box.id = 'zfr-box';
  box.style.cssText = 'position:fixed;top:64px;left:50%;transform:translateX(-50%);z-index:100000;' +
    'background:var(--bg-card,#fff);border:1px solid #0369a1;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.28);' +
    "direction:rtl;padding:8px;display:flex;flex-direction:column;gap:6px;font-family:'Jameel Noori Nastaleeq',serif;min-width:300px;";
  const inp = "flex:1;min-width:0;border:1px solid var(--border,#cbd5e1);border-radius:6px;padding:5px 8px;font-size:14px;font-family:'Jameel Noori Nastaleeq',serif;direction:rtl;outline:none;";
  const b = "border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg-secondary,#f8fafc);cursor:pointer;padding:5px 9px;font-size:13px;font-family:'Jameel Noori Nastaleeq',serif;";
  box.innerHTML = `
    <div style="display:flex;gap:6px;align-items:center;">
      <input id="zfr-find" placeholder="تلاش کریں…" style="${inp}">
      <span id="zfr-count" style="font-size:11px;color:var(--text-muted);min-width:38px;text-align:center;">0/0</span>
      <button id="zfr-prev" title="پچھلا" style="${b}">▲</button>
      <button id="zfr-next" title="اگلا" style="${b}">▼</button>
      <button id="zfr-x" title="بند" style="${b}">✕</button>
    </div>
    <div id="zfr-rep-row" style="display:${withReplace ? 'flex' : 'none'};gap:6px;align-items:center;">
      <input id="zfr-rep-in" placeholder="بدلیں…" style="${inp}">
      <button id="zfr-rep1" style="${b}">بدلیں</button>
      <button id="zfr-repall" style="${b}">سب بدلیں</button>
    </div>
    <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:var(--text-secondary);">
      <input type="checkbox" id="zfr-mc"> حروف کا فرق (Case)
    </label>`;
  document.body.appendChild(box);
  box.querySelector('#zfr-next').onclick  = () => _zfrFindNext(false);
  box.querySelector('#zfr-prev').onclick  = () => _zfrFindNext(true);
  box.querySelector('#zfr-x').onclick     = () => { box.style.display = 'none'; };
  box.querySelector('#zfr-rep1').onclick  = () => _zfrReplaceOne();
  box.querySelector('#zfr-repall').onclick= () => _zfrReplaceAll();
  const fi = box.querySelector('#zfr-find');
  fi.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); _zfrFindNext(!!e.shiftKey); }
    if (e.key === 'Escape') { e.preventDefault(); box.style.display = 'none'; }
  });
  fi.addEventListener('input', () => { _zfrIdx = -1; });
  fi.focus();
}
window._zimniFindReplaceUI = _zimniFindReplaceUI;

// ═══════════════════════════════════════════════════════════════
//  فونٹ سائز — ضمنی کے اپنے خانوں پر (report173 کا _ch173FontToDoc
//  صرف چالان کی classes پر چلتا ہے، اسی لیے یہاں الگ ضروری ہے)
// ═══════════════════════════════════════════════════════════════
// ── آخری اپ ڈیٹ کا وقت — toolbar میں ──
function _zimniFmtStamp(iso) {
  try {
    const x = new Date(iso);
    if (isNaN(x)) return '';
    const dd = String(x.getDate()).padStart(2, '0');
    const mm = String(x.getMonth() + 1).padStart(2, '0');
    let h = x.getHours(); const mi = String(x.getMinutes()).padStart(2, '0');
    const ap = h < 12 ? 'am' : 'pm'; h = h % 12 || 12;
    return dd + '/' + mm + '/' + x.getFullYear() + ' — ' +
           String(h).padStart(2, '0') + ':' + mi + ' ' + ap;
  } catch (_) { return ''; }
}
function _zimniStampUpdated(iso) {
  const el = document.getElementById('zf-updated');
  if (!el) return;
  const t = _zimniFmtStamp(iso || new Date().toISOString());
  el.textContent = t ? ('آخری اپ ڈیٹ: ' + t) : '';
}
window._zimniStampUpdated = _zimniStampUpdated;

// آج کی تاریخ — ہمیشہ DD/MM/YYYY
function _zimniToday() {
  try { if (typeof _ch173Today === 'function') return _ch173Today(); } catch (_) {}
  const d = new Date();
  return String(d.getDate()).padStart(2, '0') + '/' +
         String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
}
window._zimniToday = _zimniToday;

function _zimniDoc() {
  return (typeof _ch173Doc === 'function' && _ch173Doc()) || document.getElementById('ch173-doc');
}
window._zimniDoc = _zimniDoc;

function _zimniFontToDoc(pt) {
  const doc = _zimniDoc();
  if (!doc) return;
  doc.dataset.fs = pt;
  doc.style.fontSize = pt + 'pt';
  // PEHLE andar chipki purani naapein saaf (warna nayi naap un par nahi lagti)
  try {
    doc.querySelectorAll('.zf-meta *, .zf-body *, .zf-tbl td *, .zf-tbl th *')
       .forEach(el => { if (el.style && el.style.fontSize) el.style.fontSize = ''; });
  } catch (_) {}
  // Har woh hissa jis ki apni naap CSS mein likhi hai — usay seedha naap do
  // (عنوان "رپورٹ ضمنی" apni 20pt par rehta hai; usay badalna ho to matn chun kar badlein)
  const HISSE = ['.zf-formno', '.zf-zila', '.zf-meta', '.zf-lbl', '.zf-ln',
                 '.zf-tbl th', '.zf-tbl td', '.zf-bl', '.zf-bdyln', '.zf-body'].join(', ');
  try { doc.querySelectorAll(HISSE).forEach(el => { el.style.fontSize = pt + 'pt'; }); } catch (_) {}
  try { _r173Dirty = true; } catch (_) {}
}
window._zimniFontToDoc = _zimniFontToDoc;

// Dropdown se font — matn chuna ho to sirf usi par, warna poore safhe par
function _zimniSetFont(val) {
  const pt = parseFloat(val);
  if (!pt || isNaN(pt)) return;
  try { if (typeof _ch173RestoreRange === 'function') _ch173RestoreRange(); } catch (_) {}
  const fs = document.getElementById('ch173-font-sel');
  if (fs) fs.value = String(pt);                       // dropdown wapas na palte
  try {
    if (typeof _ch173FontToSelection === 'function' && _ch173FontToSelection(pt)) {
      if (typeof _ch173SaveRange === 'function') _ch173SaveRange();
      try { _r173Dirty = true; } catch (_) {}
      return;
    }
  } catch (_) {}
  _zimniFontToDoc(pt);
}
window._zimniSetFont = _zimniSetFont;

// ═══ B / I / U — cursor jahan ho wahan ki halat button par nazar aaye ═══
function _zimniSyncFmtBtns() {
  const doc = _zimniDoc();
  if (!doc) return;
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount || !sel.anchorNode || !doc.contains(sel.anchorNode)) return;
  const st = (c) => { try { return document.queryCommandState(c); } catch (_) { return false; } };
  [['zf-btn-b','bold'], ['zf-btn-i','italic'], ['zf-btn-u','underline']].forEach(([id, cmd]) => {
    const b = document.getElementById(id);
    if (!b) return;
    const on = st(cmd);
    b.style.background = on ? '#0369a1' : 'var(--bg-card,#fff)';
    b.style.color      = on ? '#fff'    : 'var(--text-primary,#111)';
  });
  // Font dropdown bhi cursor ke mutabiq
  try {
    const selEl = document.getElementById('ch173-font-sel');
    if (selEl && document.activeElement !== selEl) {
      let n = sel.anchorNode; if (n.nodeType === 3) n = n.parentElement;
      if (n) {
        const px = parseFloat(getComputedStyle(n).fontSize);
        if (px) {
          const pt = Math.round(px * 0.75 * 2) / 2;
          if ([...selEl.options].some(op => parseFloat(op.value) === pt)) selEl.value = String(pt);
        }
      }
    }
  } catch (_) {}
}
window._zimniSyncFmtBtns = _zimniSyncFmtBtns;

// Formatting lagao + button ki halat foran update
function _zimniFmt(cmd) {
  try { if (typeof _ch173Fmt === 'function') _ch173Fmt(cmd); }
  catch (_) { try { document.execCommand(cmd, false, null); } catch (__) {} }
  setTimeout(_zimniSyncFmtBtns, 10);
}
window._zimniFmt = _zimniFmt;

// ═══════════════════════════════════════════════════════════════
//  ٹیبل کی لکیریں MOVEABLE — MS Word جیسی (چوڑائی + اونچائی)
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
//  حالاتِ تفتیش کے خانے کی ناپ پکی کرو
//  خانہ اپنی ناپ سے بڑا نہیں ہوتا — جو متن نہ سمائے وہ ٹیبل کے نیچے
//  والے خانے میں چلا جاتا ہے (چالان کا _ch173Overflow یہی کرتا ہے)۔
//  اسی سے دوسرے صفحے پر ٹیبل دوبارہ نہیں چھپتا۔
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
//  ٹیبل بالکل صفحہ 1 پر — قطار کی اونچائی وہی جو صفحے میں بچی ہے
//  (چالان کے _ch173StretchRow کا اصول۔ پہلے قطار 21cm پکی تھی، اس لیے
//   عنوان + تفصیل کے بعد ٹیبل صفحے میں نہیں سماتا تھا اور پورا کا پورا
//   دوسرے صفحے پر چلا جاتا تھا۔)
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
//  نگرانی — متن چھپا رہ جائے تو خود نیچے بھیج دو
//  AHEM: report173 کا _ch173StartOverflowWatch یہاں استعمال نہیں کیا جا
//  سکتا۔ وہ جانچتا ہے کہ 'document.activeElement === cell' — چالان میں
//  خانہ خود editable ہوتا ہے، مگر ضمنی میں پورا صفحہ editable ہے، اس لیے
//  activeElement ہمیشہ #ch173-doc ہوتا ہے، .zf-body نہیں۔ نتیجہ: وہ ہر
//  1.2 سیکنڈ بعد "کوئی لکھ نہیں رہا" سمجھ کر متن ہلا دیتا تھا — جس سے
//  کرسر (اور مائیک کا محفوظ کیا ہوا مقام) ٹوٹ جاتا تھا اور بولی ہوئی
//  تحریر کہیں نہیں لگتی تھی۔ یہاں جانچ صفحے کے پورے حصے پر ہے۔

// ═══════════════════════════════════════════════════════════════
//  مثل باندھنے کی جگہ — دوسرے صفحے سے، اوپر بائیں کونے میں مثلث
//  نوک اوپر بائیں کونے پر، دونوں بازو 2-2 انچ؛ متن اس سے بچ کر بہتا ہے۔
//  اوپر کے مارجن کے بعد ایک سطر کی جگہ (margin-top:1.25em)۔
//  NOTE: چالان میں یہ کام cont_text پر ہوتا ہے؛ ضمنی میں اضافی متن کا
//  خانہ ہوتا ہی نہیں، اس لیے یہ سیدھا .zf-body کے متن پر لگتا ہے۔
//  صرف چھپائی کے لیے — اسکرین پر کوئی تبدیلی نہیں۔
// ═══════════════════════════════════════════════════════════════
function _zimniAddBindMarks() {
  const daale = [];
  const doc = _zimniDoc();
  if (!doc) return daale;
  const host = doc.querySelector('.zf-body');
  if (!host || !host.firstChild) return daale;

  const IN = 96;
  const paper = (typeof _ch173Paper !== 'undefined') ? _ch173Paper : 'legal';
  const safhaH = ((paper === 'a4') ? 11.7 : 13) * IN;
  let hashiya = 0;
  try {
    const cs = getComputedStyle(doc);
    hashiya = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
  } catch (_) {}
  const kaam = safhaH - hashiya;                  // ایک صفحے کی کام کی اونچائی
  if (kaam < 100) return daale;

  const docTop = doc.getBoundingClientRect().top;

  // متن کے تمام ٹکڑے + ان کی لمبائی
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

  const jagah = (i) => {                          // i-ویں حرف کی جگہ
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
  const safhe = Math.floor(aakhri / kaam);        // متن کتنے صفحوں تک گیا
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
          tri.className = 'zf-bindmark';
          t.node.parentNode.insertBefore(tri, baad);
          daale.push(tri);
        } catch (_) {}
        break;
      }
    }
  }
  return daale;
}
window._zimniAddBindMarks = _zimniAddBindMarks;




// ناپ + متن جمانا — ایک ہی ترتیب سے (چالان کے _ch173Layout جیسا)
// ═══ ٹیبل ٹھیک ایک صفحے میں — دوسرے صفحے پر نہ جائے ═══
// AHEM: پہلے tbody کی اونچائی پکی 21cm تھی۔ اوپر کا حصہ (عنوان + تفصیل)
// جتنا بڑھتا، ٹیبل اتنا نیچے سرکتا اور ایک صفحے میں نہ سماتا — اور
// 'page-break-inside:avoid' کی وجہ سے پورا ٹیبل دوسرے صفحے پر چلا جاتا،
// پہلا صفحہ خالی رہ جاتا۔ اب اونچائی ناپ کر رکھی جاتی ہے: ٹیبل بالکل
// صفحے کے نیچے تک جاتا ہے، اس سے آگے نہیں۔
function _zimniFitTable() {
  const doc = _zimniDoc();
  if (!doc) return;
  const table = doc.querySelector('table.zf-tbl');
  const td = doc.querySelector('table.zf-tbl tbody td');
  if (!table || !td) return;
  const IN = 96;
  const paper = (typeof _ch173Paper !== 'undefined') ? _ch173Paper : 'legal';
  let padY = 0;
  try {
    const cs = getComputedStyle(doc);
    padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
  } catch (_) {}
  const kaam = ((paper === 'a4') ? 11.7 : 13) * IN - padY;      // ایک صفحے کی کام کی اونچائی
  if (kaam < 200) return;
  try {
    const dRect = doc.getBoundingClientRect();
    const tRect = table.getBoundingClientRect();
    const scale = (doc.offsetHeight && dRect.height) ? (dRect.height / doc.offsetHeight) : 1;
    let padT = 0;
    try { padT = parseFloat(getComputedStyle(doc).paddingTop) || 0; } catch (_) {}
    // ٹیبل کا آغاز — صفحے کے کام والے حصے کے شروع سے
    const tTop = ((tRect.top - dRect.top) / (scale || 1)) - padT;
    const thead = table.querySelector('thead');
    const hH = thead ? thead.offsetHeight : 0;
    let h = Math.floor(kaam - tTop - hH - 2);
    if (h < 120) h = 120;
    // AHEM: خانے کی 'height' دراصل کم از کم ناپ ہے۔ متن کم ہو تو ٹیبل پورا
    // صفحہ بھرتا ہے؛ متن زیادہ ہو تو خانہ خود بڑا ہو کر قطار اگلے صفحے پر
    // جاری رہتی ہے (ضمنی بیرونی کا یہی اصول ہے)۔
    if (String(td.style.height) !== (h + 'px')) {
      table.querySelectorAll('tbody td').forEach(c => { c.style.height = h + 'px'; });
    }
  } catch (_) {}
}
window._zimniFitTable = _zimniFitTable;

// ═══════════════════════════════════════════════════════════════
//  کالم 2 — خودکار نمبر شمار
//  حالاتِ تفتیش (کالم 3) میں جتنے پیراگراف ہوں، کالم 2 میں اُتنے ہی
//  نمبر (1، 2، 3 …) — اور ہر نمبر ٹھیک اپنے پیراگراف کی پہلی سطر کے
//  برابر۔ پہلا نمبر "جناب عالیٰ" والی سطر سے شروع ہوتا ہے۔
//  خالی سطریں (صرف Enter) شمار نہیں ہوتیں۔
// ═══════════════════════════════════════════════════════════════
function _zimniParas() {
  const doc = _zimniDoc();
  if (!doc) return [];
  const hasText = (el) => String(el.textContent || '').replace(/[\s\u00A0]/g, '').length > 0;
  const marks = [];

  // متن کے ایک ٹکڑے کی جگہ ناپنے کے لیے (Range سے — عنصر ہو یا سادہ متن)
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

  // ═══ ایک خانے کے اندر کے پیراگراف ═══
  // AHEM: پیراگراف صرف الگ <div> نہیں ہوتے۔ Enter دبانے پر براؤزر کبھی
  // نیا <div> بناتا ہے اور کبھی صرف <br> ڈالتا ہے — پہلے صرف <div>/<p>
  // گِنے جاتے تھے، اسی لیے کنسول میں bodies:3 مگر paras:1 آ رہا تھا۔
  // اب <br> سے ٹوٹے ہوئے پیراگراف بھی شمار ہوتے ہیں۔
  const scan = (host) => {
    const kids = [...host.children].filter(el =>
      (el.tagName === 'DIV' || el.tagName === 'P') && hasText(el));
    if (kids.length) { kids.forEach(k => marks.push(k)); return; }
    // <br> سے الگ ہونے والے حصے
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

  let bodies = [...doc.querySelectorAll('.zf-body')];
  if (!bodies.length) {
    // پرانی/مختلف ساخت — حالاتِ تفتیش کا خانہ (لیبل والی سطریں چھوڑ کر)
    const cell = doc.querySelector('td.zf-c-body');
    if (!cell) return [];
    const SKIP = ['zf-bl', 'zf-close', 'zf-signblk', 'zf-gap', 'zf-sign', 'zf-signdate'];
    const rest = [...cell.children].filter(el =>
      (el.tagName === 'DIV' || el.tagName === 'P') &&
      !SKIP.some(c => el.classList.contains(c)) && hasText(el));
    if (rest.length) { rest.forEach(scan); return marks; }
    scan(cell);
    return marks;
  }
  bodies.forEach(scan);
  return marks;
}

// پرانی محفوظ شدہ ضمنیوں میں اختتامی سطر اور دستخط کا خانہ نہ ہو تو لگا دو
function _zimniEnsureClosing() {
  const doc = _zimniDoc();
  if (!doc) return;
  const cell = doc.querySelector('td.zf-c-body');
  if (!cell || cell.querySelector('.zf-close')) return;
  const E = (v) => (typeof esc === 'function') ? esc(v == null ? '' : String(v)) : String(v || '');
  const io = (typeof getIOSignLine === 'function') ? getIOSignLine() : '';
  const wrap = document.createElement('div');
  wrap.innerHTML =
    '<div class="zf-close" data-k="close">رپورٹ ضمنی مرتب ہو کرارسال خدمت ہے</div>' +
    '<div class="zf-signblk">' +
      '<div class="zf-gap"><br></div><div class="zf-gap"><br></div>' +
      '<div class="zf-sign" data-k="io_sign">' + E(io) + '</div>' +
      '<div class="zf-signdate" data-k="io_date">' + E(_zimniToday()) + '</div>' +
    '</div>';
  while (wrap.firstChild) cell.appendChild(wrap.firstChild);
}
window._zimniEnsureClosing = _zimniEnsureClosing;

// ═══════════════════════════════════════════════════════════════
//  ضمنی 2 صفحوں سے آگے جائے تو تیسرے صفحے پر اندرونی ضمنی
//  • اندرونی کا کالم 3 بالکل خالی (FIR کا متن یہاں نہیں بھرتا)
//  • اندرونی پر بھی وہی خودکار نمبر کا اصول (_zaAutoNumbers)
//  • اختتامی سطر اور تفتیشی افسر کے دستخط اندرونی کے آخر میں آتے ہیں
//  ساخت اور دستخط کا انداز zimni-androoni.js سے ہو بہو (اندازہ نہیں)
// ═══════════════════════════════════════════════════════════════

// صفحے کی کام کی اونچائی (px)
function _zimniPageH() {
  const doc = _zimniDoc();
  const IN = 96;
  const paper = (typeof _ch173Paper !== 'undefined') ? _ch173Paper : 'legal';
  let padY = 0;
  try {
    const cs = getComputedStyle(doc);
    padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
  } catch (_) {}
  return ((paper === 'a4') ? 11.7 : 13) * IN - padY;
}


function _zimniStartNumbers() {
  const doc = _zimniDoc();
  if (!doc) return;
  const kick = () => {
    clearTimeout(doc._zfNumT);
    doc._zfNumT = setTimeout(() => {
      try { _zimniNumberAll(); } catch (_) {}
    }, 200);
  };
  // افسر خود نمبر بدلے تو وہ نمبر پکا (خودکار اُسے نہیں چھیڑے گا)
  if (!doc._zfNumEdit) {
    doc._zfNumEdit = true;
    doc.addEventListener('input', (e) => {
      try {
        const n = e.target && e.target.closest ? e.target.closest('.zf-num') : null;
        if (n) { n.dataset.manual = '1'; return; }      // نمبر کی اپنی ترمیم
        const inNums = e.target && e.target.closest && e.target.closest('.zf-nums');
        if (inNums) return;
      } catch (_) {}
      kick();
    });
    // ── نمبروں کے خانے میں ENTER — خالی سطر ڈالو (نمبر نیچے)، continuous serial ──
    // AHEM: پورا صفحہ editable ہے، اس لیے keydown کا target ہمیشہ #ch173-doc
    // ہوتا ہے — کرسر کہاں ہے یہ selection کے anchorNode سے پہچانا جاتا ہے۔
    doc.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      let nums = null, curNode = null;
      try {
        const sel = window.getSelection();
        if (sel && sel.anchorNode) {
          curNode = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement;
          if (curNode && curNode.closest) nums = curNode.closest('.zf-nums');
        }
      } catch (_) {}
      if (!nums) return;
      e.preventDefault(); e.stopPropagation();
      nums.dataset.manualSpace = '1';                 // اب manual spacing موڈ
      // موجودہ سطر کے بعد ایک خالی سطر ڈالو
      let cur = null;
      try { cur = curNode && curNode.closest ? curNode.closest('.zf-num') : null; } catch (_) {}
      const blank = document.createElement('div');
      blank.className = 'zf-num';
      blank.dataset.blank = '1';
      blank.innerHTML = '<br>';
      if (cur && cur.parentElement === nums) cur.after(blank);
      else nums.appendChild(blank);
      // کرسر نئی خالی سطر میں
      try {
        const r = document.createRange(); r.setStart(blank, 0); r.collapse(true);
        const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      } catch (_) {}
      try { _zimniAutoNumbers(); } catch (_) {}
      try { _r173Dirty = true; } catch (_) {}
    }, true);
  }
  // DOM بدلے تو بھی (Enter سے نئے خانے بننا، paste، undo وغیرہ)
  try {
    if (!doc._zfNumObs && typeof MutationObserver !== 'undefined') {
      doc._zfNumObs = new MutationObserver((muts) => {
        // نمبروں کے اپنے خانے کی تبدیلی پر دوبارہ نہ چلو (ورنہ چکر بن جائے)
        for (const m of muts) {
          const t = m.target;
          if (t && t.closest && t.closest('.zf-nums')) continue;
          kick(); return;
        }
      });
      doc._zfNumObs.observe(doc, { childList: true, subtree: true, characterData: true });
    }
  } catch (_) {}
  // حفاظتی جال — ہر 2 سیکنڈ بعد جانچ (صرف تب چلتا ہے جب تعداد بدلی ہو)
  try { if (doc._zfNumIv) clearInterval(doc._zfNumIv); } catch (_) {}
  doc._zfNumIv = setInterval(() => {
    const d = _zimniDoc();
    if (!d) { try { clearInterval(doc._zfNumIv); } catch (_) {} return; }
    try {
      const chahiye = _zimniParas().length;
      const mojood  = d.querySelectorAll('.zf-num').length;
      if (chahiye !== mojood) { _zimniAutoNumbers(); _zimniAlignSerial(); }
    } catch (_) {}
  }, 2000);
  kick();
}
window._zimniStartNumbers = _zimniStartNumbers;

// واپسی کی قدر تشخیص کے لیے — کنسول میں _zimniAutoNumbers() چلا کر
// فوراً پتا چل جاتا ہے کہ کہاں رکا: { doc, cell, paras, numbers }
// ═══ berooni + androoni کے نمبر ایک ہی مسلسل سلسلے میں ═══
// berooni کے پیراگراف 1..N، پھر androoni کے N+1، N+2 … (نمبر جاری رہتا ہے)
function _zimniNumberAll() {
  let r = null;
  try { r = _zimniAutoNumbers(); } catch (_) {}
  try { _zimniAlignSerial(); } catch (_) {}
  const doc = _zimniDoc();
  if (!doc) return r;
  const wrap = doc.querySelector('.zf-androoni');
  if (!wrap || typeof _zaAutoNumbers !== 'function') return r;
  try { _zaAutoNumbers(); } catch (_) {}      // androoni کی سیدھ (margin) لگا دو
  // berooni میں کتنے (غیر خالی) نمبر لگے؟
  let base = 0;
  doc.querySelectorAll('.zf-nums .zf-num').forEach(d => {
    const blank = d.dataset.blank === '1' ||
      !String(d.textContent || '').replace(/[\s\u00A0]/g, '').length;
    if (!blank) base++;
  });
  // androoni کے نمبروں کو base سے آگے دوبارہ لکھ دو (سیدھ وہی رہے گی)
  let run = base;
  wrap.querySelectorAll('.zfa-nums .zfa-num').forEach(d => {
    if (d.dataset.blank === '1') return;
    run++;
    const t = String(run);
    if (d.textContent !== t) d.textContent = t;
  });
  return r;
}
window._zimniNumberAll = _zimniNumberAll;

function _zimniAutoNumbers() {
  const doc = _zimniDoc();
  if (!doc) return { ok: false, wajah: 'ضمنی کا صفحہ (#ch173-doc) نہیں ملا' };
  const td = doc.querySelector('td.zf-c-serial');
  if (!td) return { ok: false, wajah: 'کالم 2 کا خانہ (td.zf-c-serial) نہیں ملا' };
  // ── پرانی محفوظ شدہ ضمنیوں کے لیے ── ان کے HTML میں نمبروں کا خانہ
  // ہوتا ہی نہیں (وہ پرانے .zf-serno کے ساتھ محفوظ ہوئی تھیں)، اس لیے
  // نمبر لگنے کی جگہ ہی نہیں ملتی تھی۔ نہ ہو تو یہیں بنا دو۔
  let nums = doc.querySelector('.zf-nums');
  if (nums && nums.getAttribute('contenteditable') !== 'true') {
    nums.setAttribute('contenteditable', 'true');     // پرانی ضمنیوں کے لیے
  }
  if (!nums) {
    try { td.querySelectorAll('.zf-serno').forEach(el => el.remove()); } catch (_) {}
    nums = document.createElement('div');
    nums.className = 'zf-nums';
    nums.setAttribute('contenteditable', 'true');
    td.appendChild(nums);
  }
  // ▾ بٹن بھی نہ ہو تو لگا دو (پرانی ضمنیوں میں وہ بنام کی سطر میں تھا)
  if (!td.querySelector('.zf-pick')) {
    try {
      doc.querySelectorAll('.zf-bl-banam .zf-pick').forEach(el => el.remove());
      const b = document.createElement('button');
      b.className = 'zf-pick no-print';
      b.setAttribute('contenteditable', 'false');
      b.title = 'ملزمان منتخب کریں';
      b.textContent = '\u25BE';
      b.onclick = (e) => { try { _zimniAccPicker(e); } catch (_) {} };
      td.insertBefore(b, td.firstChild);
    } catch (_) {}
  }
  const paras = _zimniParas();

  // ═══ MANUAL SPACING موڈ ═══
  // افسر نے نمبروں کے خانے میں Enter دبا کر خالی سطریں ڈالی ہوں تو ہم
  // خودکار ترتیب کو نہیں چھیڑتے: صرف غیر خالی سطروں کو 1،2،3… دیتے ہیں
  // (خالی سطریں گیپ کے طور پر برقرار — نمبر نیچے چلے جاتے ہیں)۔
  if (nums.dataset.manualSpace === '1') {
    let n = 0;
    [...nums.children].forEach((d) => {
      d.style.marginTop = '0px';
      const blank = !String(d.textContent || '').replace(/[\s\u00A0]/g, '').length;
      if (d.dataset.blank === '1' || blank) { d.dataset.blank = '1'; return; }
      n += 1;
      if (d.dataset.manual !== '1') { const t = String(n); if (d.textContent !== t) d.textContent = t; }
    });
    return { ok: true, mode: 'manual', numbers: n, lines: nums.children.length };
  }

  // ═══ AUTO موڈ ═══ نمبروں کی تعداد پیراگرافوں کے برابر
  while (nums.children.length > paras.length) nums.lastChild.remove();
  while (nums.children.length < paras.length) {
    const d = document.createElement('div');
    d.className = 'zf-num';
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
    return { ok: false, wajah: 'کوئی پیراگراف نہیں ملا (حالاتِ تفتیش خالی ہے؟)',
             bodies: doc.querySelectorAll('.zf-body').length };
  }

  // ہر نمبر کو اُس کے پیراگراف کی پہلی سطر کے برابر لاؤ
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
  return { ok: true, mode: 'auto', paras: paras.length, numbers: nums.children.length,
           bodies: doc.querySelectorAll('.zf-body').length };
}
window._zimniAutoNumbers = _zimniAutoNumbers;

// ▾ بٹن — بنام والی سطر کے برابر
function _zimniAlignSerial() {
  const doc = _zimniDoc();
  if (!doc) return;
  const td    = doc.querySelector('td.zf-c-serial');
  const banam = doc.querySelector('.zf-bl-banam');
  const pick  = doc.querySelector('.zf-pick');
  if (!td || !pick || !banam) return;
  try {
    pick.style.marginTop = '0px';
    const r = td.getBoundingClientRect();
    const k = (td.offsetHeight && r.height) ? (r.height / td.offsetHeight) : 1;
    const gap = Math.round((banam.getBoundingClientRect().top - pick.getBoundingClientRect().top) / (k || 1));
    if (gap > 0 && gap < 2000) pick.style.marginTop = gap + 'px';
  } catch (_) {}
}
window._zimniAlignSerial = _zimniAlignSerial;

// ناپ + متن جمانا — ایک ہی ترتیب سے (چالان کے _ch173Layout جیسا)
// ═══════════════════════════════════════════════════════════════
//  ضمنی 2 صفحوں سے آگے جائے تو صفحہ 3 پر اندرونی ضمنی خود لگ جائے
//  • اندرونی کا فارم زیرِ استعمال اصل ماڈیول (zimni-androoni.js) سے آتا
//    ہے — یہاں کوئی نقل نہیں بنائی گئی۔
//  • کالم 3 بالکل خالی — FIR کے متن کی نقل والا اصول یہاں نہیں چلتا۔
//  • خودکار نمبر شمار اندرونی پر بھی چلتے ہیں (_zaAutoNumbers)۔
//  • اختتامی سطر اور تفتیشی افسر کے دستخط اندرونی کے آخر میں جاتے ہیں۔
// ═══════════════════════════════════════════════════════════════
function _zimniNeedsAndrooni() {
  const doc = _zimniDoc();
  if (!doc) return false;
  const IN = 96;
  const paper = (typeof _ch173Paper !== 'undefined') ? _ch173Paper : 'legal';
  let padY = 0;
  try {
    const cs = getComputedStyle(doc);
    padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
  } catch (_) {}
  const kaam = ((paper === 'a4') ? 11.7 : 13) * IN - padY;   // ایک صفحہ
  if (kaam < 100) return false;
  // اندرونی کا اپنا حصہ ناپ سے نکال دو (ورنہ وہ خود ہی شرط پوری کرتا رہے گا)
  let apna = 0;
  try {
    const wrap = doc.querySelector('.zf-androoni');
    if (wrap) apna = wrap.offsetHeight || 0;
  } catch (_) {}
  const matn = (doc.scrollHeight - padY) - apna;
  return matn > (2 * kaam);
}

function _zimniEnsureAndrooni() {
  const doc = _zimniDoc();
  if (!doc) return;
  let wrap = doc.querySelector('.zf-androoni');
  const chahiye = _zimniNeedsAndrooni();

  // ── ضرورت نہ ہو اور اندرونی خالی ہو تو ہٹا دو (لکھا ہوا کبھی نہ مٹے) ──
  if (!chahiye) {
    if (wrap) {
      let khali = true;
      try {
        const b = wrap.querySelector('.zfa-body');
        khali = !b || !String(b.textContent || '').replace(/[\s\u00A0]/g, '').length;
      } catch (_) {}
      if (khali) {
        try { _zimniMoveClosing(null); } catch (_) {}   // اختتامی خانہ واپس بیرونی میں
        wrap.remove();
      }
    }
    return;
  }
  if (wrap) { try { _zimniMoveClosing(wrap); } catch (_) {} return; }

  // ── اندرونی کا فارم — اصل ماڈیول سے ──
  if (typeof _zaDefaultBody !== 'function') {
    try {
      if (!window._zaMissingWarned) {
        window._zaMissingWarned = true;
        showToast('⚠️ اندرونی ضمنی کا ماڈیول (zimni-androoni.js) لوڈ نہیں ہوا', 'warn', 6000);
      }
    } catch (_) {}
    return;
  }
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const c = _zimniCase || {};
  wrap = document.createElement('div');
  wrap.className = 'zf-androoni';
  try { wrap.innerHTML = _zaDefaultBody(o, c); } catch (_) { return; }
  // کالم 3 بالکل خالی (FIR کا متن یہاں نہیں آتا) — تصدیق
  try {
    const b = wrap.querySelector('.zfa-body');
    if (b) b.innerHTML = '<br>';
  } catch (_) {}
  doc.appendChild(wrap);
  try { _zimniMoveClosing(wrap); } catch (_) {}
  try { if (typeof _zaAutoNumbers === 'function') _zaAutoNumbers(); } catch (_) {}
}
window._zimniEnsureAndrooni = _zimniEnsureAndrooni;

// اختتامی سطر + دستخط کہاں رہیں: اندرونی ہو تو اُس کے آخر میں، ورنہ بیرونی میں
function _zimniMoveClosing(wrap) {
  const doc = _zimniDoc();
  if (!doc) return;
  const close = doc.querySelector('.zf-close');
  const sign  = doc.querySelector('.zf-signblk');
  if (!close && !sign) return;
  const manzil = wrap ? wrap.querySelector('.zfa-c-body') : doc.querySelector('td.zf-c-body');
  if (!manzil) return;
  if (close && close.parentElement !== manzil) manzil.appendChild(close);
  if (sign  && sign.parentElement  !== manzil) manzil.appendChild(sign);
  // ═══ دستخط کا انداز ═══
  // اندرونی میں ہو تو بالکل وہی انداز جو zimni-androoni.js میں ہے:
  //   .zfa-wit-sign > .zfa-wit-io (bold، بائیں طرف) + .zfa-wit-date
  // بیرونی میں واپس آئے تو اپنا پرانا انداز (.zf-sign / .zf-signdate)
  try {
    if (!sign) return;
    const io = sign.querySelector('[data-k="io_sign"]');
    const dt = sign.querySelector('[data-k="io_date"]');
    if (wrap) {
      sign.className = 'zfa-wit-sign';
      if (io) io.className = 'zfa-wit-io';
      if (dt) dt.className = 'zfa-wit-date';
      // اندرونی کے انداز میں 2 خالی سطروں کی جگہ CSS (margin-top:36px) سے آتی ہے
      sign.querySelectorAll('.zf-gap').forEach(g => { g.style.display = 'none'; });
    } else {
      sign.className = 'zf-signblk';
      if (io) io.className = 'zf-sign';
      if (dt) dt.className = 'zf-signdate';
      sign.querySelectorAll('.zf-gap').forEach(g => { g.style.display = ''; });
    }
  } catch (_) {}
}
window._zimniMoveClosing = _zimniMoveClosing;

function _zimniLayout() {
  try { _zimniFitTable(); } catch (_) {}      // ٹیبل کم از کم پورا صفحہ بھرے
  try { _zimniEnsureAndrooni(); } catch (_) {}  // 2 صفحوں سے آگے → اندرونی
  try { _zimniNumberAll(); } catch (_) {}       // berooni + androoni مسلسل نمبر + ▾ سیدھ
}
window._zimniLayout = _zimniLayout;

function _zimniColResize() {
  const doc = _zimniDoc();
  const table = doc && doc.querySelector('table.zf-tbl');
  if (!table || table._zfResizeReady) return;
  table._zfResizeReady = true;
  const cols = [...table.querySelectorAll('colgroup col')];
  if (cols.length < 2) return;

  // ── Column ki BAYEN lakeer — chaurai badlo (RTL) ──
  [...table.querySelectorAll('thead th')].forEach((th, i) => {
    if (i + 1 >= cols.length) return;                     // aakhri column ke bayen kuch nahi
    const g = document.createElement('div');
    g.className = 'zf-colgrip';
    g.contentEditable = 'false';
    g.title = 'چوڑائی بدلنے کے لیے کھینچیں';
    th.appendChild(g);
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

  // ── Header ki NEECHE wali lakeer — header ki unchai badlo ──
  const hRow = table.querySelector('thead tr');
  if (hRow) {
    hRow.querySelectorAll('th').forEach(th => {
      const g = document.createElement('div');
      g.className = 'zf-rowgrip';
      g.contentEditable = 'false';
      g.title = 'اونچائی بدلنے کے لیے کھینچیں';
      th.appendChild(g);
      g.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startY = e.clientY, startH = hRow.offsetHeight;
        document.body.style.cursor = 'row-resize';
        const onMove = (ev) => {
          const nh = startH + (ev.clientY - startY);
          if (nh < 26) return;
          hRow.querySelectorAll('th').forEach(c => { c.style.height = nh + 'px'; });
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

  // ── Data row ki NEECHE wali lakeer — qatar ki unchai ──
  const bRow = table.querySelector('tbody tr');
  if (bRow) {
    bRow.querySelectorAll('td').forEach(td => {
      const g = document.createElement('div');
      g.className = 'zf-rowgrip';
      g.contentEditable = 'false';
      g.title = 'اونچائی بدلنے کے لیے کھینچیں';
      td.appendChild(g);
      g.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startY = e.clientY, startH = bRow.offsetHeight;
        document.body.style.cursor = 'row-resize';
        const onMove = (ev) => {
          const nh = startH + (ev.clientY - startY);
          if (nh < 80) return;
          bRow.querySelectorAll('td').forEach(c => { c.style.height = nh + 'px'; });
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
}
window._zimniColResize = _zimniColResize;

// Grips مکمل طور پر دکھاوے کے لیے ہیں — محفوظ/چھپائی سے پہلے ہٹا دیے جاتے ہیں
function _zimniCleanHTML(html) {
  return String(html || '').replace(/<div[^>]*class="zf-(col|row)grip"[^>]*><\/div>/g, '');
}
window._zimniCleanHTML = _zimniCleanHTML;

// ═══════════════════════════════════════════════════════════════
//  MS Word جیسی keys — Tab / Ctrl+B,I,U ؛ ENTER براؤزر کے حوالے
//  (report173 کا _ch173BindKeys Enter پر '\n' ڈالتا ہے جو صرف
//   white-space:pre-wrap والے خانوں میں چلتا ہے — اسی لیے ضمنی میں
//   Enter کچھ نہیں کرتا تھا۔ یہاں Enter قدرتی (MS Word جیسا) ہے۔)
// ═══════════════════════════════════════════════════════════════
function _zimniBindKeys() {
  const doc = _zimniDoc();
  if (!doc || doc._zfKeys) return;
  doc._zfKeys = true;
  doc.addEventListener('keydown', function (e) {
    const el = e.target;
    if (!el || !doc.contains(el)) return;

    // TAB → MS Word جیسی خالی جگہ (Shift+Tab پیچھے)
    if (e.key === 'Tab') {
      e.preventDefault();
      if (!e.shiftKey) {
        const TAB = '\u00A0'.repeat(8);              // ایک Tab = 8 خالی جگہیں
        let ok = false;
        try { ok = document.execCommand('insertText', false, TAB); } catch (_) {}
        if (!ok && typeof _ch173Insert === 'function') _ch173Insert(TAB);
        try { _r173Dirty = true; } catch (_) {}
      }
      return;
    }

    // ENTER → براؤزر خود نئی سطر بنائے (کوئی preventDefault نہیں)
    if (e.key === 'Enter') { try { _r173Dirty = true; } catch (_) {} return; }

    if (e.ctrlKey || e.metaKey) {
      const k = String(e.key || '').toLowerCase();
      if (k === 'b') { e.preventDefault(); _zimniFmt('bold'); }
      else if (k === 'i') { e.preventDefault(); _zimniFmt('italic'); }
      else if (k === 'u') { e.preventDefault(); _zimniFmt('underline'); }
      return;                                   // باقی سب (C/V/X/A/Z/Y/F/H) براؤزر کے حوالے
    }
  });
  // Paste — سادہ متن (font/سائز ساتھ نہ آئے)
  doc.addEventListener('paste', function (e) {
    try {
      e.preventDefault();
      const t = ((e.clipboardData || window.clipboardData).getData('text/plain') || '');
      document.execCommand('insertText', false, t);
      _r173Dirty = true;
    } catch (_) {}
  });
}
window._zimniBindKeys = _zimniBindKeys;

// ═══════════════════════════════════════════════════════════════
//  بنام — ملزمان کی فہرست (چالان جیسی ▾ )
//  ایک سطر = ایک ملزم : نمبر شمار + نام (دائیں) اور CNIC (بائیں)
//  → تمام نام ایک سیدھ میں، تمام CNIC ایک سیدھ میں
// ═══════════════════════════════════════════════════════════════
let _zimniAccused = null;    // اس مقدمہ کے ملزمان

// ملزمان لوڈ کرو — ضمنی کا اپنا case id سے
// (report173 کا _ch173LoadPeople صرف _misalCaseId / currentCaseId دیکھتا ہے،
//  اسی لیے ضمنی میں فہرست خالی آ رہی تھی۔)
async function _zimniLoadAccused() {
  const cid = _zimniCaseId
           || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
           || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  if (!cid || typeof supabaseClient === 'undefined') { _zimniAccused = []; return _zimniAccused; }
  try {
    const { data } = await supabaseClient.from('case_accused')
      .select('id,name,cnic,accused_type').eq('case_id', cid)
      .order('created_at', { ascending: true });
    _zimniAccused = data || [];
  } catch (_) { _zimniAccused = []; }
  return _zimniAccused;
}
window._zimniLoadAccused = _zimniLoadAccused;

// ایک سطر = ایک ملزم : نمبر شمار + نام (CNIC ساتھ نہیں)
// تمام نام ایک ہی سیدھ سے شروع، دائیں طرف
function _zimniAccLine(nm, i) {
  const E = (v) => (typeof esc === 'function') ? esc(v == null ? '' : String(v)) : String(v || '');
  return '<div class="zf-acc"><span class="nm">' + (i + 1) + '\u06D4 ' + E(nm) + '</span></div>';
}
window._zimniAccLine = _zimniAccLine;

// ملزمان کے تمام نام خود بخود "بنام" کے آگے (▾ سے کوئی نام ہٹایا جا سکتا ہے)
async function _zimniFillBanam(force) {
  const doc = _zimniDoc();
  const cell = doc && doc.querySelector('[data-k="banam"]');
  if (!cell) return;
  // پہلے سے کچھ لکھا/چنا ہوا ہو تو ہاتھ نہ لگاؤ (افسر کی اپنی ترمیم محفوظ)
  if (!force && String(cell.textContent || '').replace(/[\s\u00A0]/g, '').length) return;
  let list = _zimniAccused;
  if (!list || !list.length) list = await _zimniLoadAccused();
  if ((!list || !list.length) && typeof _ch173Accused !== 'undefined' && _ch173Accused) list = _ch173Accused;
  list = (list || []).filter(a => (a.name || '').trim());
  if (!list.length) return;
  cell.innerHTML = list.map((a, i) => _zimniAccLine((a.name || '').trim(), i)).join('');
  try { _zimniAutoNumbers(); } catch (_) {}
}
window._zimniFillBanam = _zimniFillBanam;

async function _zimniAccPicker(ev) {
  ev.preventDefault(); ev.stopPropagation();
  document.getElementById('zf-acc-menu')?.remove();
  const btn = ev.currentTarget;

  // ملزمان — ضمنی کے اپنے case id سے (ہر بار تازہ اگر خالی ہوں)
  let list = _zimniAccused;
  if (!list || !list.length) list = await _zimniLoadAccused();
  // اگر پھر بھی خالی، تو چالان والی فہرست آزماؤ
  if ((!list || !list.length) && typeof _ch173Accused !== 'undefined' && _ch173Accused && _ch173Accused.length) {
    list = _ch173Accused;
  }
  list = (list || []).filter(a => (a.name || '').trim());
  if (!list.length) {
    if (typeof showToast === 'function') showToast('ℹ️ اس مقدمہ میں کوئی ملزم درج نہیں', 'info');
    return;
  }

  const doc = _zimniDoc();
  const cell = doc && doc.querySelector('[data-k="banam"]');
  const E = (v) => (typeof esc === 'function') ? esc(v == null ? '' : String(v)) : String(v || '');
  // پہلے سے چنے ہوئے نام
  const mine = new Set();
  try {
    (cell ? cell.querySelectorAll('.zf-acc .nm') : []).forEach(n => {
      mine.add(String(n.textContent).replace(/^\s*\d+\u06D4\s*/, '').trim());
    });
  } catch (_) {}

  const box = document.createElement('div');
  box.id = 'zf-acc-menu';
  box.style.cssText =
    'position:fixed;z-index:99999;background:#fff;border:1px solid #0369a1;border-radius:10px;' +
    'box-shadow:0 10px 30px rgba(0,0,0,.28);direction:rtl;width:270px;max-width:92vw;' +
    'display:flex;flex-direction:column;max-height:min(60vh,340px);overflow:hidden;';
  const rows = list.map(a => {
    const nm = (a.name || '').trim();
    return `<label style="display:flex;align-items:center;gap:8px;padding:7px 6px;cursor:pointer;font-size:13px;
              border-bottom:1px solid #f1f5f9;font-family:'Jameel Noori Nastaleeq',serif;">
              <input type="checkbox" ${mine.has(nm) ? 'checked' : ''} value="${E(nm)}"> <span>${E(nm)}</span></label>`;
  }).join('');
  box.innerHTML = `
    <div style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;font-weight:700;color:#0369a1;
                font-family:'Jameel Noori Nastaleeq',serif;background:#f8fafc;">ملزمان منتخب کریں</div>
    <div style="flex:1;overflow-y:auto;padding:4px 8px;min-height:0;">${rows}</div>
    <div style="display:flex;gap:6px;padding:8px;border-top:1px solid #e5e7eb;background:#f8fafc;flex-shrink:0;">
      <button id="zf-acc-ok" style="flex:1;padding:8px;border:none;border-radius:6px;background:#0369a1;color:#fff;
        cursor:pointer;font-size:13px;font-weight:700;font-family:'Jameel Noori Nastaleeq',serif;">✔ شامل کریں</button>
      <button id="zf-acc-x" style="padding:8px 12px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;
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

  box.querySelector('#zf-acc-x').onclick = () => box.remove();
  box.querySelector('#zf-acc-ok').onclick = () => {
    const picked = [...box.querySelectorAll('input:checked')].map(i => i.value);
    if (cell) cell.innerHTML = picked.map((nm, i) => _zimniAccLine(nm, i)).join('');
    box.remove();
    try { _r173Dirty = true; } catch (_) {}
  };
}
window._zimniAccPicker = _zimniAccPicker;

// Berooni Zimni form ki CSS (editor + print) — sab #ch173-doc ke andar, naap pt mein.
function _zimniFormCSS() {
  return `
  /* ── HEADER ── form no + رپورٹ ضمنی page ke CENTER; ضلع top-LEFT ── */
  #ch173-doc .zf-head{ direction:rtl; margin-bottom:6px; line-height:1.5; }
  #ch173-doc .zf-formno{ font-size:12pt; font-weight:normal; direction:ltr; text-align:center; margin-bottom:4px; }
  #ch173-doc .zf-titlerow{ position:relative; text-align:center; min-height:1.6em; }
  #ch173-doc .zf-title{ font-size:24pt; font-weight:700; text-decoration:underline; text-underline-offset:5px; line-height:1.5; }
  /* ضلع … — ضمنی نمبر کی سیدھ میں (دونوں کی چوڑائی ایک: --zf-zcol) */
  #ch173-doc .zf-zila{ position:absolute; left:0; top:0; width:var(--zf-zcol,4.6cm);
    text-align:right; font-size:16pt; font-weight:normal; white-space:nowrap; unicode-bidi:plaintext; }

  /* ── METADATA (table کے اوپر والا حصہ) ── 16pt، bold نہیں، spacing 1.5،
     دائیں طرف 1cm مارجن (ٹیبل کو نہیں) ── */
  #ch173-doc .zf-meta{ --zf-zcol:4.6cm; margin:10px 0 8px; padding-right:1cm;
    font-size:16pt; font-weight:normal; direction:rtl; line-height:1.5; }
  /* Row 1 : تھانہ | سال | ضمنی نمبر (ضمنی نمبر کا خانہ پکی چوڑائی پر) */
  #ch173-doc .zf-r1{ display:grid; grid-template-columns:1fr auto var(--zf-zcol,4.6cm);
    gap:0 9px; align-items:baseline; margin-bottom:7px; direction:rtl; }
  /* دو حصے — دائیں (مقدمہ/وقوعہ) اور بائیں (پہنچنے/روانگی) */
  #ch173-doc .zf-mid{ display:grid; grid-template-columns:1.2fr 0.8fr; gap:0 9px; direction:rtl; margin-bottom:7px; }
  /* دائیں حصہ : لیبل | قدر | لیبل | تاریخ — دونوں تاریخیں ایک ہی کالم میں */
  /* ہر قدر اپنے لیبل کے ساتھ (فاصلہ 0.25cm — 1cm سے کہیں کم) */
  #ch173-doc .zf-gR{ display:grid; grid-template-columns:auto auto auto minmax(0,1fr);
    gap:4px 0.05cm; align-items:baseline; }
  #ch173-doc .zf-gR .zf-span2{ grid-column:span 2; }
  /* چھوٹی قدریں (نمبر/تاریخ) کبھی نہ ٹوٹیں */
  #ch173-doc .zf-nw{ white-space:nowrap; }
  /* بائیں حصہ : لیبل | قدر */
  #ch173-doc .zf-gL{ display:grid; grid-template-columns:auto 1fr; gap:4px 4px; align-items:baseline; align-content:start; }
  #ch173-doc .zf-mrow{ display:flex; gap:5px; flex-wrap:wrap; align-items:baseline; margin-bottom:7px; direction:rtl; }
  /* بحد — اپنے مواد جتنا؛ متن بڑھے تو خود پھیل جائے، جرم خود سِمٹ جائے */
  #ch173-doc .zf-mrow > .zf-fld{ flex:0 1 auto; min-width:0; }
  #ch173-doc .zf-mrow > .zf-fld .zf-ln{ flex:0 1 auto; min-width:2em; }
  #ch173-doc .zf-fld{ display:flex; align-items:baseline; gap:3px; }
  #ch173-doc .zf-fld.grow{ flex:1; }
  #ch173-doc .zf-lbl{ font-weight:normal; white-space:nowrap; }
  /* قدر ہمیشہ دائیں سے شروع — انگریزی/ہندسوں پر plaintext رخ اُلٹ کر
     اسے بائیں چپکا دیتا تھا، اسی سے لیبل کے ساتھ خالی جگہ بچتی تھی */
  #ch173-doc .zf-ln{ min-width:20px; padding:0 1px; outline:none;
    unicode-bidi:plaintext; text-align:right; }
  #ch173-doc .zf-fld .zf-ln{ flex:1; }
  /* چھوٹی قدریں (سال، ضمنی نمبر) لیبل کے ساتھ ہی رہیں — پھیل کر بائیں
     کنارے (مارجن) سے نہ جا لگیں */
  #ch173-doc .zf-fld .zf-ln.zf-nw{ flex:0 0 auto; min-width:1.4em; padding:0 4px 0 0; }
  /* جرم : دفعات دائیں، "ت پ" بائیں (bidi isolation سے جگہ پکی) */
  #ch173-doc .zf-jurm{ display:flex; align-items:baseline; gap:8px; flex:1; min-width:0; }
  #ch173-doc .zf-j-body{ unicode-bidi:isolate; direction:ltr; text-align:right; }
  #ch173-doc .zf-j-suf{ unicode-bidi:isolate; direction:rtl; margin-left:auto; }   /* بائیں کنارے پر */
  /* MS Word جیسا ایک Tab */
  #ch173-doc .zf-tab{ display:inline-block; width:0.635cm; }

  /* ── MAIN TABLE ── (کوئی مارجن نہیں) */
  #ch173-doc table.zf-tbl{ width:100%; border-collapse:collapse; table-layout:fixed; direction:rtl; margin:0; }
  #ch173-doc table.zf-tbl thead{ display:table-row-group; }   /* header دوہرا نہ ہو */
  /* ROW 1 (header) — column 3 (حالاتِ تفتیش) 16pt، باقی (1،2،4) 14pt، bold نہیں */
  #ch173-doc table.zf-tbl th{ border:1px solid #000; padding:6px 5px; font-size:16pt; font-weight:normal;
    text-align:center; line-height:1.5; vertical-align:middle; position:relative; }
  #ch173-doc table.zf-tbl th.zf-c-action{ font-size:14pt; }          /* row 1 کالم 1 — 14pt */
  /* row 1 کالم 2 — 12pt اور کھڑی لکھائی (چالان کے گواہان جیسی) */
  #ch173-doc table.zf-tbl th.zf-c-serial{ font-size:12pt; padding:3px 2px; vertical-align:middle; }
  /* AHEM: چالان کا اصول — writing-mode استعمال کرو، flex یا transform:rotate کبھی نہیں */
  #ch173-doc .zf-vert{
    writing-mode:vertical-rl; -webkit-writing-mode:vertical-rl;
    display:block; margin:0 auto; direction:rtl;
    white-space:nowrap; line-height:1.25; text-align:center; }
  #ch173-doc table.zf-tbl th.zf-c-from{ font-size:16pt; text-align:right; }   /* row 1 کالم 4 — 16pt، دائیں */
  /* ROW 2 (data) */
  #ch173-doc table.zf-tbl td{ border:1px solid #000; padding:8px 9px; font-size:14pt; vertical-align:top;
    line-height:1.5; text-align:justify; text-align-last:right; overflow-wrap:anywhere; word-break:break-word; position:relative; }
  #ch173-doc table.zf-tbl td.zf-c-action{ text-align:center; text-align-last:center; }
  #ch173-doc table.zf-tbl td.zf-c-serial{ text-align:center; text-align-last:center; }
  /* قطار کی اونچائی JS (_zimniFitTable) حساب سے دیتا ہے — یہ صرف ابتدائی ناپ */
  #ch173-doc table.zf-tbl tbody td{ height:18cm; }
  /* کالم 2 — ہر پیراگراف کا اپنا نمبر (خودکار) */
  #ch173-doc .zf-nums{ display:block; }
  #ch173-doc .zf-num{ display:block; text-align:center; line-height:1.5; }
  /* اندرونی ضمنی — تیسرے صفحے پر (صفحے کا توڑ صرف چھپائی میں) */
  #ch173-doc .zf-pgbrk{ display:block; height:0; }
  #ch173-doc .zf-androoni{ margin-top:1.5em; }
  @media print{
    #ch173-doc .zf-pgbrk{ break-before:page !important; page-break-before:always !important;
      height:0 !important; margin:0 !important; }
    #ch173-doc .zf-androoni{ margin-top:0; }
  }
  /* اسکرین پر اندرونی کہاں سے شروع ہوتی ہے — ایک ہلکی لکیر */
  #ch173-doc .zf-androoni{ border-top:2px dashed #bbb; padding-top:1em; }
  @media print{ #ch173-doc .zf-androoni{ border-top:none; padding-top:0; } }

  /* مثل باندھنے کی جگہ — صرف چھپائی میں */
  #ch173-doc .zf-bindmark{ display:none; }
  /* باہر کی دائیں، بائیں اور نیچے کی لکیریں نہیں */
  #ch173-doc .zf-tbl tr > th:first-child, #ch173-doc .zf-tbl tr > td:first-child{ border-right:none; }
  #ch173-doc .zf-tbl tr > th:last-child,  #ch173-doc .zf-tbl tr > td:last-child{ border-left:none; }
  #ch173-doc .zf-tbl tbody td{ border-bottom:none; }
  /* body cell */
  #ch173-doc .zf-bl{ margin-bottom:6px; font-size:14pt; line-height:1.5; position:relative; }
  #ch173-doc .zf-bdyln{ display:inline; border:none; outline:none; }
  /* تفتیشی افسر — بولڈ + انڈر لائن */
  #ch173-doc .zf-io{ font-weight:bold; text-decoration:underline; text-underline-offset:3px; }
  /* ہر پیراگراف کے درمیان ایک سطر کا فاصلہ (مزید Enter سے بڑھایا جا سکتا ہے) */
  #ch173-doc .zf-body > div, #ch173-doc .zf-body > p{ margin:0 0 1em 0; }
  /* ── اندرونی ضمنی — ہمیشہ نئے صفحے سے (بیرونی 2 صفحوں سے آگے جائے تو) ── */
  #ch173-doc .zf-androoni{ margin-top:1.25em; }
  @media print{
    #ch173-doc .zf-androoni{ break-before:page !important; page-break-before:always !important;
      margin-top:0 !important; }
  }
  /* ── اختتامی سطر — درمیان میں ── */
  #ch173-doc .zf-close{ margin-top:1em; font-size:14pt; line-height:1.5;
    text-align:center; text-align-last:center; outline:none; }
  /* دستخط کا خانہ — 2 Enter کی جگہ کے بعد تفتیشی افسر کا نام اور تاریخ.
     BAYEN sidh (چالان format jaisa — user ki hidayat par mirror kiya). */
  #ch173-doc .zf-signblk{ font-size:14pt; line-height:1.5; text-align:left; }
  #ch173-doc .zf-gap{ min-height:1.5em; }
  #ch173-doc .zf-sign{ font-weight:bold; text-decoration:underline;
    text-underline-offset:3px; outline:none; text-align:left; }
  #ch173-doc .zf-signdate{ outline:none; text-align:left; }
  #ch173-doc .zf-body{ margin-top:8px; font-size:14pt; line-height:1.5;
    text-align:justify; text-align-last:right; outline:none; white-space:pre-wrap; }

  /* ── ملزمان — ایک سطر = ایک ملزم : نمبر+نام دائیں، CNIC بائیں ──
     سب نام ایک سیدھ میں، سب CNIC ایک سیدھ میں (space-between) */
  /* بنام کی سطر : لیبل + ▾ + ملزمان کی فہرست — پہلا نام لیبل کے ساتھ اسی سطر میں،
     باقی تمام نام بالکل اُسی سیدھ سے شروع (نمبر شمار برقرار) */
  #ch173-doc .zf-bl-banam{ display:flex; align-items:baseline; gap:6px; }
  #ch173-doc .zf-acclist{ display:block; flex:1 1 auto; min-width:0; }
  #ch173-doc .zf-acc{ display:block; direction:rtl; text-align:right; text-align-last:right; }
  #ch173-doc .zf-acc .nm{ unicode-bidi:plaintext; }
  /* ملزمان منتخب کرنے کا چھوٹا بٹن (چھپائی میں نہیں) */
  /* ملزمان منتخب کرنے کا بٹن — کالم 2 row 2 میں، بنام کی بالکل سیدھ میں
     (JS اسے بنام والی سطر کے برابر رکھتا ہے) */
  #ch173-doc .zf-pick{ display:block; margin:0 auto; width:20px; height:20px;
    line-height:1; padding:0; border:1px solid var(--border,#999); border-radius:4px;
    background:#eef6ff; color:#0369a1; cursor:pointer; font-size:12px; font-weight:400; }
  @media print{ #ch173-doc .zf-pick{ display:none !important; } }

  /* ── Table کی لکیریں MOVEABLE ── */
  #ch173-doc .zf-colgrip{ position:absolute; top:0; left:-3px; width:7px; height:100%;
    cursor:col-resize; user-select:none; z-index:6; }
  #ch173-doc .zf-colgrip:hover{ background:rgba(56,189,248,.35); }
  #ch173-doc .zf-rowgrip{ position:absolute; bottom:0; left:0; width:100%; height:9px;
    cursor:row-resize; user-select:none; z-index:6; }
  #ch173-doc .zf-rowgrip:hover{ background:rgba(56,189,248,.45); }
  @media print{ #ch173-doc .zf-colgrip, #ch173-doc .zf-rowgrip{ display:none !important; } }

  /* Paste کیا ہوا متن ہمیشہ Nastaliq (bold/italic/underline برقرار) */
  #ch173-doc .zf-body *, #ch173-doc .zf-tbl td *, #ch173-doc .zf-meta *{
    font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif !important;
  }
  #ch173-doc b, #ch173-doc strong{ font-weight:bold; }
  #ch173-doc i, #ch173-doc em{ font-style:italic; }
  #ch173-doc u{ text-decoration:underline; }
  /* مثل باندھنے کی جگہ — دوسرے صفحے سے، اوپر بائیں کونے میں مثلث (صرف چھپائی) */
  #ch173-doc .zf-bind{ display:none; }
  @media print{
    #ch173-doc table.zf-tbl thead{ page-break-inside:avoid; }
    /* AHEM: header کو دہرانے نہ دو — ورنہ ہر صفحے پر ٹیبل دوبارہ چھپ جاتا ہے */
    #ch173-doc table.zf-tbl thead{ display:table-row-group !important; }
    /* AHEM: مثلث کو سفید بھر کر مت رکھو — وہ متن کو ڈھانپ لیتی ہے۔
       چالان کا اصول: float + shape-outside، تاکہ متن اُس کے گرد سے بہہ جائے */
    #ch173-doc .zf-bind{
      display:block; float:left; width:2in; height:2in;
      margin-top:1.25em;                       /* اوپر کے مارجن کے بعد ایک سطر کی جگہ */
      shape-outside:polygon(0 0, 2in 0, 0 2in);
      -webkit-shape-outside:polygon(0 0, 2in 0, 0 2in);
      shape-margin:3mm; -webkit-shape-margin:3mm;
      clip-path:polygon(0 0, 2in 0, 0 2in);
      -webkit-clip-path:polygon(0 0, 2in 0, 0 2in);
    }
  }`;
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
  // ── Auto-fetch (case + officer record se) ──
  const district = E(o.district || '');
  const thana    = E(o.station || '');
  const firNo    = E(c.fir_number || '');
  const firDate  = E(D(c.fir_date || ''));
  const wDate    = E(D(c.occurrence_date || ''));                                     // وقوعہ کی تاریخ
  const wPlace   = E(c.place_of_occurrence || c.occurrence_place || c.jaye_waqoia || ''); // مقام وقوعہ
  const behad    = E(c.behad || c.distance || c.samt || '');
  const compl    = E(c.complainant_name || c.complainant || '');
  const serial   = E(z.serial_no || '');
  const ioE      = E(io);
  // جرم — دفعات اور "ت پ" الگ الگ (ت پ بائیں کنارے پر)
  let jBody = ((c.section_of_law || '') + ' ' + (c.offence_type || '')).trim();
  let jSuf  = 'ت پ';
  try {
    if (typeof _ch173JurmParts === 'function') {
      const jp = _ch173JurmParts(c.section_of_law);
      jBody = jp.body; jSuf = jp.suffix;
    }
  } catch (_) {}

  return `
  <div class="zf-head">
    <div class="zf-formno">پولیس فارم نمبر&nbsp;25—54(1)</div>
    <div class="zf-titlerow">
      <span class="zf-zila" data-k="zila">ضلع ${district}</span>
      <span class="zf-title">رپورٹ ضمنی بیرونی</span>
    </div>
  </div>

  <div class="zf-meta">
    <div class="zf-r1">
      <span class="zf-fld"><span class="zf-lbl">تھانہ۔</span><span class="zf-ln" data-k="thana">${thana}</span></span>
      <span class="zf-fld"><span class="zf-lbl">سال</span><span class="zf-ln zf-nw" data-k="saal">${year}</span></span>
      <span class="zf-fld"><span class="zf-lbl">ضمنی نمبر</span><span class="zf-ln zf-nw" data-k="zno">${serial}</span></span>
    </div>

    <div class="zf-mid">
      <!-- دائیں : مقدمہ نمبر / مورخہ — اور نیچے وقوعہ (تاریخ اوپر والی مورخہ کی سیدھ میں) -->
      <div class="zf-gR">
        <span class="zf-lbl">مقدمہ نمبر</span>
        <span class="zf-ln zf-nw" data-k="fir">${firNo}</span>
        <span class="zf-lbl">مورخہ</span>
        <span class="zf-ln zf-nw" data-k="fdate">${firDate}</span>

        <span class="zf-lbl">تاریخ و مقام وقوعہ۔</span>
        <span class="zf-ln zf-span2" data-k="wplace">${wPlace}</span>
        <span class="zf-ln zf-nw" data-k="wdate">${wDate}</span>
      </div>
      <!-- بائیں : تھانہ میں پہنچنے / تھانہ سے روانگی -->
      <div class="zf-gL">
        <span class="zf-lbl">تھانہ میں پہنچنے کا وقت و تاریخ</span>
        <span class="zf-ln" data-k="arrival"></span>
        <span class="zf-lbl">تھانہ سے روانگی کا وقت و تاریخ</span>
        <span class="zf-ln" data-k="depart"></span>
      </div>
    </div>

    <div class="zf-mrow">
      <span class="zf-fld"><span class="zf-lbl">بحد۔</span><span class="zf-ln" data-k="behad">${behad}</span></span>
      <span class="zf-jurm"><span class="zf-lbl">جرم۔</span><span class="zf-ln zf-j-body" data-k="jurm">${E(jBody)}</span><span class="zf-j-suf" data-k="jurm_suf">${E(jSuf)}</span></span>
    </div>
  </div>

  <table class="zf-tbl">
    <colgroup>
      <col style="width:14%"><col style="width:7%"><col style="width:55%"><col style="width:24%">
    </colgroup>
    <thead>
      <tr>
        <th class="zf-c-action">تاریخ و وقت<br>کارروائی</th>
        <th class="zf-c-serial"><div class="zf-vert">رپورٹ نمبر شمار<br>سلسلہ وار</div></th>
        <th class="zf-c-body">حالاتِ تفتیش</th>
        <th class="zf-c-from">از۔</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="zf-c-action" data-k="action"></td>
        <td class="zf-c-serial"><button class="zf-pick no-print" contenteditable="false" onclick="_zimniAccPicker(event)" title="ملزمان منتخب کریں">&#9662;</button><div class="zf-nums" contenteditable="true"></div></td>
        <td class="zf-c-body" colspan="2">
          <div class="zf-bl"><span class="zf-lbl">سرکار بذریعہ ۔</span> <span class="zf-bdyln" data-k="sarkar">${compl}</span></div>
          <div class="zf-bl zf-bl-banam"><span class="zf-lbl">بنام۔</span><span class="zf-bdyln zf-acclist" data-k="banam"></span></div>
          <div class="zf-bl"><span class="zf-tab"></span><span class="zf-tab"></span><span class="zf-lbl">مرتبہ ۔</span> <span class="zf-bdyln zf-io" data-k="murattib">${ioE}</span></div>
          <div class="zf-body" data-mic="true" data-k="halaat">جناب عالیٰ! بحوالہ رپورٹ </div>
          <!-- اختتام — تحریر جہاں بھی ختم ہو (کسی بھی صفحے پر) اس کے نیچے آتا ہے -->
          <div class="zf-close" data-k="close">رپورٹ ضمنی مرتب ہو کرارسال خدمت ہے</div>
          <div class="zf-signblk">
            <div class="zf-gap"><br></div>
            <div class="zf-gap"><br></div>
            <div class="zf-sign" data-k="io_sign">${ioE}</div>
            <div class="zf-signdate" data-k="io_date">${E(_zimniToday())}</div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>`;
}
// ── SAVE ──────────────────────────────────────────────────────
async function _saveZimni(silent, keepOpen) {
  const ed = _zimniDoc();
  if (!ed) return false;
  const bodyHtml = _zimniCleanHTML(ed.innerHTML);   // grips محفوظ نہ ہوں
  const z = _zimniActive || {};

  // ضمنی نمبر — EDITABLE خانے سے
  let serialNo = parseInt(z.serial_no, 10) || 0;
  try {
    const sf = ed.querySelector('[data-k="zno"]') || ed.querySelector('[data-k="serial"]');
    const sv = sf ? parseInt(String(sf.innerText || sf.textContent).replace(/[^\d]/g, ''), 10) : NaN;
    if (!isNaN(sv) && sv > 0) serialNo = sv;
  } catch (_) {}
  if (!serialNo) {   // نیا — سب سے بڑے نمبر سے ایک آگے
    try { serialNo = Math.max(0, ..._zimniList.map(x =>
      parseInt(x.serial_no, 10) || parseInt((x.content||{}).serial_no, 10) || 0)) + 1; }
    catch (_) { serialNo = 1; }
  }
  // ہیڈ (قسم) — toolbar کے خانے سے
  let head = '';
  try {
    const hi = document.getElementById('zf-head-in');
    head = hi ? String(hi.value || '').trim() : '';
  } catch (_) {}
  if (!head) head = (z.content && z.content.head) || 'رپورٹ ضمنی';

  const savedAt = new Date().toISOString();
  const rec = {
    case_id: _zimniCaseId,
    serial_no: serialNo,
    report_date: (z.report_date || savedAt.slice(0, 10)),   // پہلی بار کی تاریخ برقرار
    content: { bodyHtml, head, serial_no: serialNo, saved_at: savedAt },
  };

  try {
    if (typeof dioRegisterSaved === 'function')
      dioRegisterSaved('zimni', head + ' — نمبر ' + serialNo,
        { case_id: _zimniCaseId, serial_no: serialNo });
  } catch (_) {}

  // مقامی فہرست ہمیشہ تازہ (آن لائن ہو یا نہ ہو — ضمنی کبھی ضائع نہ ہو)
  const localSave = (obj) => {
    try {
      const i = _zimniList.findIndex(x => String(x.id) === String(obj.id));
      if (i >= 0) _zimniList[i] = obj; else _zimniList.push(obj);
      _zimniList.sort((a, b) => (parseInt(b.serial_no, 10) || 0) - (parseInt(a.serial_no, 10) || 0));
      localStorage.setItem('dio_zimni_' + _zimniCaseId, JSON.stringify(_zimniList));
    } catch (_) {}
  };

  // ── آف لائن یا ڈیٹابیس کا ڈھانچہ ناقص — مقامی محفوظ ──
  if (!navigator.onLine || window._zimniDbBroken) {
    const id = z.id || ('local-' + Date.now());
    const obj = Object.assign({ id }, rec);
    _zimniActive = obj; localSave(obj);
    try {
      if (typeof offlineStore !== 'undefined' && offlineStore.enqueue) {
        await offlineStore.enqueue('zimni_reports',
          String(id).startsWith('local-') ? 'insert' : 'update',
          String(id).startsWith('local-') ? rec : Object.assign({ id }, rec));
      }
    } catch (_) {}
    if (!silent) showToast('📴 آف لائن محفوظ — انٹرنیٹ آنے پر sync ہوگا', 'info');
    try { _zimniStampUpdated(savedAt); } catch (_) {}
    if (!keepOpen && !silent) setTimeout(() => { try { _renderZimniList(); } catch (_) {} }, 200);
    return true;
  }

  try {
    try {
      const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
      if (oid) rec.officer_id = oid;
    } catch (_) {}

    // کالم کا نام خود ڈھونڈتے ہوئے محفوظ کرو ('content' ہر ڈیٹابیس میں نہیں ہوتا)
    const base = {};
    Object.keys(rec).forEach(k => { if (k !== 'content') base[k] = rec[k]; });
    const editing = z.id && !String(z.id).startsWith('local-') && !String(z.id).startsWith('tmp_');
    let savedRec = await _zimniWrite(base, rec.content, editing ? z.id : null);
    savedRec = Object.assign({}, savedRec, { content: rec.content });   // مواد ہمیشہ ہاتھ میں
    _zimniActive = savedRec;
    localSave(savedRec);

    // ═══ تصدیق — واقعی ڈیٹابیس میں پہنچی یا نہیں؟ ═══
    // (صرف "کامیاب" کا پیغام کافی نہیں تھا — کبھی سطر جاتی ہی نہیں تھی
    //  اور ضمنیات کی فہرست خالی رہتی تھی۔)
    let ok = true;
    try {
      const chk = await supabaseClient.from('zimni_reports')
        .select('id').eq('case_id', _zimniCaseId).eq('id', savedRec.id);
      if (chk.error || !chk.data || !chk.data.length) ok = false;
    } catch (_) { ok = false; }

    if (!silent) {
      if (ok) showToast('✅ ضمنی نمبر ' + serialNo + ' محفوظ ہو گئی', 'success');
      else showToast('⚠️ ضمنی نمبر ' + serialNo + ' مقامی طور پر محفوظ ہے، مگر ڈیٹابیس میں تصدیق نہ ہو سکی', 'warn', 7000);
    }

    // فہرست تازہ کرو۔ AHEM: 'keepOpen' ہو تو ضمنی کھلی ہی رہے —
    // Ctrl+S اور اوپر والے "اپ ڈیٹ" بٹن پر ضمنی بند نہیں ہونی چاہیے۔
    try {
      await _loadZimni();
      if (!silent && !keepOpen) setTimeout(() => { try { _renderZimniList(); } catch (_) {} }, 200);
    } catch (_) {}
    if (keepOpen) { try { _zimniStampUpdated(savedAt); } catch (_) {} }
    return true;
  } catch (e) {
    // مقامی نقل پھر بھی محفوظ — کام ضائع نہ ہو
    const id = z.id || ('local-' + Date.now());
    const obj = Object.assign({ id }, rec);
    _zimniActive = obj; localSave(obj);
    // ═══ پورا پیغام دکھاؤ — صرف e.message اکثر خالی ہوتا ہے ═══
    let msg = '';
    try {
      msg = [e && e.message, e && e.details, e && e.hint,
             (e && e.code) ? ('code ' + e.code) : '']
            .filter(Boolean).join(' — ');
    } catch (_) {}
    if (!msg) { try { msg = JSON.stringify(e); } catch (_) { msg = String(e); } }
    try { console.error('[zimni save]', e); } catch (_) {}
    showToast('❌ محفوظ نہ ہو سکی: ' + msg + ' (مقامی نقل محفوظ ہے)', 'error', 8000);
    return false;
  }
}
window._saveZimni = _saveZimni;

async function _deleteZimni(id, skipConfirm) {
  if (!skipConfirm && !confirm('کیا آپ یہ ضمنی حذف کرنا چاہتے ہیں؟')) return;
  try {
    await supabaseClient.from('zimni_reports').delete().eq('id', id);
    _zimniList = _zimniList.filter(z => z.id !== id);
    try { localStorage.setItem('dio_zimni_' + _zimniCaseId, JSON.stringify(_zimniList)); } catch(_) {}
    _renderZimniList();
    showToast('🗑️ حذف ہو گئی', 'info');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

// ═══════════════════════════════════════════════════════════════
//  مثل باندھنے کی جگہ — دوسرے صفحے سے، اوپر بائیں کونے میں مثلث
//  (چالان جیسا۔ صرف چھپائی کے لیے — اسکرین پر کچھ نہیں بدلتا)
//  اوپر کے مارجن کے بعد ایک سطر کی جگہ چھوڑی جاتی ہے۔
// ═══════════════════════════════════════════════════════════════
function _zimniBindHTML() {
  const doc = _zimniDoc();
  if (!doc) return '';
  const IN = 96, CM = 37.8;
  const paper = (typeof _ch173Paper !== 'undefined') ? _ch173Paper : 'legal';
  const pageH = ((paper === 'a4') ? 11.7 : 13) * IN - (2 * CM);   // اوپر/نیچے 1cm مارجن
  if (pageH < 100) return '';
  let padY = 0, lh = 0;
  try {
    const cs = getComputedStyle(doc);
    padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    lh = parseFloat(cs.lineHeight) || 0;
    if (!lh) lh = (parseFloat(cs.fontSize) || 19) * 1.5;
  } catch (_) { lh = 28; }
  const h = (doc.scrollHeight || 0) - padY;
  const pages = Math.ceil(h / pageH);
  let out = '';
  for (let p = 1; p < pages && p < 40; p++) {          // صفحہ 2 سے آگے
    out += '<div class="zf-bind" style="top:' + Math.round(p * pageH + lh) + 'px"></div>';
  }
  return out;
}
window._zimniBindHTML = _zimniBindHTML;

// ── PRINT (only the document — MS-Word rule) ──────────────────
function _printZimni() {
  const ed = _zimniDoc();
  if (!ed) return;
  // 1) متن پوری طرح جما لو — جو حالاتِ تفتیش کے خانے میں نہ سمائے وہ
  //    ٹیبل کے نیچے والے خانے میں چلا جائے (اسی سے ٹیبل دوسرے صفحے پر
  //    دوبارہ نہیں چھپتا)
  try { _zimniLayout(); } catch (_) {}
  // 2) مثل باندھنے کی تکونی جگہ + صفحہ بندی سب اب چھپائی کی دستاویز کے اندر
  //    (print width پر) chain script کرتا ہے — screen-width نشان غلط بیٹھتے تھے۔
  let inner = _zimniCleanHTML(ed.innerHTML);
  _zimniPrintDoc(inner);
}

// چالان/اخراج jaisa print: kaghaz + margins (1cm / _ch173SideMargin) report173 se,
// CSS bhi report173 (_ch173CSS) + zimni form CSS — screen aur print bilkul aik.
function _zimniPrintHTML(inner) {
  const paper = (typeof _ch173Paper !== 'undefined') ? _ch173Paper : 'legal';
  const side  = (typeof _ch173SideMargin === 'function') ? _ch173SideMargin() : '0.2cm';
  const size  = (paper === 'a4') ? 'A4 portrait' : '8.5in 13in';
  const pw    = (paper === 'a4') ? '210mm' : '8.5in';      // کاغذ کی چوڑائی
  const css173 = (typeof _ch173CSS === 'function') ? _ch173CSS() : '';
  // ── #3: chained androoni sheets کے لیے — androoni کا خالی فارم + کاغذ ──
  const _o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const _c = (typeof _zimniCase !== 'undefined' && _zimniCase) ? _zimniCase : {};
  const zaSkel = (typeof _zaDefaultBody === 'function')
    ? ('<div class="zf-androoni">' + _zaDefaultBody(_o, _c) + '</div>') : '';
  return `<!DOCTYPE html><html dir="rtl" lang="ur"><head><meta charset="UTF-8"><title> </title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      /* AHEM: سائیڈ مارجن صفحے پر نہیں، دستاویز کی padding سے — تاکہ دستاویز کی
         چوڑائی بالکل وہی رہے جو اسکرین پر تھی۔ اسی سے کالم 2 کے نمبروں کی سیدھ
         چھپائی میں بھی درست رہتی ہے (چوڑائی بدلنے سے پیراگراف کی اونچائی بدلتی
         تھی اور اسکرین پر ناپا ہوا marginTop غلط ہو جاتا تھا)۔ */
      @page{ size:${size}; margin:1cm 0; }
      *{ -webkit-print-color-adjust:exact; print-color-adjust:exact; box-sizing:border-box; }
      html,body{ margin:0; font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Tahoma',sans-serif;
            direction:rtl; text-align:justify; color:#000; line-height:1.4; }
      ${css173}
      ${_zimniFormCSS()}
      ${(typeof _zaFormCSS === 'function') ? _zaFormCSS() : ''}
      /* Print overrides — sirf working document (koi toolbar/button nahi) */
      #ch173-doc{ width:${pw} !important; max-width:none !important; height:auto !important;
        min-height:0 !important; padding:0 ${side} !important; margin:0 auto !important;
        transform:none !important; box-shadow:none !important; border-radius:0 !important; }
      /* AHEM: header کو دہرانے نہ دو — ورنہ ہر صفحے پر ٹیبل دوبارہ چھپ جاتا ہے
         (چالان کا بھی یہی اصول: thead{display:table-row-group}) */
      #ch173-doc table.zf-tbl thead{ display:table-row-group !important; page-break-inside:avoid; }
      /* مثل باندھنے کی مثلث — صفحہ 2 سے (float + shape-outside) */
      #ch173-doc .zf-bind{ display:block !important; float:left; width:2in; height:2in;
        margin-top:1.25em;
        shape-outside:polygon(0 0, 2in 0, 0 2in);
        -webkit-shape-outside:polygon(0 0, 2in 0, 0 2in);
        shape-margin:3mm; -webkit-shape-margin:3mm;
        clip-path:polygon(0 0, 2in 0, 0 2in);
        -webkit-clip-path:polygon(0 0, 2in 0, 0 2in); }
      /* ── مثل باندھنے کی جگہ — دوسرے صفحے سے، اوپر بائیں کونے میں مثلث ──
         نوک اوپر بائیں کونے پر، دونوں بازو 2-2 انچ؛ متن اس سے بچ کر بہتا ہے۔
         اوپر کے مارجن کے بعد ایک سطر کی جگہ (margin-top:1.25em) */
      #ch173-doc .zf-bindmark{ display:block !important; float:left;
        width:2in; height:2in; margin-top:1.25em;
        shape-outside:polygon(0 0, 2in 0, 0 2in);
        -webkit-shape-outside:polygon(0 0, 2in 0, 0 2in);
        shape-margin:3mm; -webkit-shape-margin:3mm;
        clip-path:polygon(0 0, 2in 0, 0 2in);
        -webkit-clip-path:polygon(0 0, 2in 0, 0 2in); }
      /* قطار 3 اگلے صفحے پر جاری رہے */
      #ch173-doc table.zf-tbl, #ch173-doc table.zf-tbl tbody,
      #ch173-doc table.zf-tbl tbody tr, #ch173-doc table.zf-tbl tbody td{
        page-break-inside:auto !important; break-inside:auto !important; }
      /* #3: ہر androoni sheet نئے صفحے سے شروع (page 3، 5، 7 …) */
      #ch173-doc .zf-androoni{ break-before:page !important; page-break-before:always !important; }
      .no-print, button, select{ display:none !important; }
      #ch173-doc, #ch173-doc *{ orphans:2; widows:2; }
    </style></head><body>
    <script>window.__ZA_SKEL=${JSON.stringify(zaSkel)};window.__PAPER=${JSON.stringify(paper)};</script>
    <div id="ch173-doc">${inner}</div>
    <script>
      (function(){
        var CM=37.795;
        var isA4=(window.__PAPER==='a4');
        var contentH=(isA4?11.69:13)*96 - 2*CM;   // ایک صفحے کی کام کی اونچائی (1cm hashiye)
        var twoPage=2*contentH;
        var SAFE=16;                 // صفحے کے کنارے سے تھوڑا پہلے روکو (spill نہ ہو)
        var fitLimit=twoPage-SAFE;
        function T(el){ return (el.textContent||'').replace(/[\\s\\u00A0]/g,''); }

        // ── ایک body کو الگ الگ <div> پیراگرافوں میں توڑو (br اور کئی .zf-body سنبھالو) ──
        function normalize(host){
          var groups=[],cur=[];
          [].slice.call(host.childNodes).forEach(function(n){
            if(n.nodeType===1&&(n.tagName==='DIV'||n.tagName==='P')){ if(cur.length){groups.push(cur);cur=[];} groups.push([n]); }
            else if(n.nodeType===1&&n.tagName==='BR'){ if(cur.length){groups.push(cur);cur=[];} }
            else { cur.push(n); }
          });
          if(cur.length) groups.push(cur);
          while(host.firstChild) host.removeChild(host.firstChild);
          var out=[];
          groups.forEach(function(g){
            var d;
            if(g.length===1&&g[0].nodeType===1&&(g[0].tagName==='DIV'||g[0].tagName==='P')) d=g[0];
            else { d=document.createElement('div'); g.forEach(function(n){ d.appendChild(n); }); }
            host.appendChild(d);
            if(T(d).length) out.push(d);
          });
          return out;
        }

        // ── berooni کے تمام .zf-body ایک میں جوڑ کر پیراگراف نکالو ──
        function beroParas(doc){
          var bodies=[].slice.call(doc.querySelectorAll('td.zf-c-body .zf-body'));
          if(!bodies.length) return {body:null,paras:[]};
          var first=bodies[0];
          for(var i=1;i<bodies.length;i++){ while(bodies[i].firstChild) first.appendChild(bodies[i].firstChild); if(bodies[i].parentNode) bodies[i].parentNode.removeChild(bodies[i]); }
          return {body:first, paras:normalize(first)};
        }

        function numDiv(n,cls){ var d=document.createElement('div'); d.className=cls||'zf-num'; d.textContent=String(n); return d; }

        // ── ایک صفحے پر کتنے پیراگراف سماتے ہیں (اوپر سے limit تک) ──
        function fitCount(paras, startIdx, topY, limit){
          var k=startIdx;
          for(var i=startIdx;i<paras.length;i++){
            var b=paras[i].getBoundingClientRect().bottom;
            if((b-topY)<=limit) k=i; else break;
          }
          return k; // آخری index جو سما گیا (کم از کم ایک ضرور)
        }

        function fillHeight(cell, wantBottomFromTop, topY){
          try{
            var cur=cell.getBoundingClientRect().bottom - topY;
            var extra=Math.floor(wantBottomFromTop - cur);
            if(extra>4) cell.style.height=(cell.offsetHeight+extra)+'px';
          }catch(e){}
        }
        // ── مثل باندھنے کی تکونی جگہ — ہر unit کے دوسرے صفحے کے اوپر بائیں ──
        // (berooni کا صفحہ 2، ہر androoni sheet کا پچھلا صفحہ)
        function addBind(body, topRef){
          if(!body) return;
          var kids=[].slice.call(body.children).filter(function(el){
            return (el.textContent||'').replace(/[\\s\\u00A0]/g,'').length; });
          var limit=topRef+contentH;               // پہلا صفحہ یہاں ختم
          for(var i=0;i<kids.length;i++){
            if(kids[i].getBoundingClientRect().top>=limit){
              var tri=document.createElement('span'); tri.className='zf-bind';
              kids[i].insertBefore(tri, kids[i].firstChild);
              return;
            }
          }
        }

        function chain(){
          var doc=document.getElementById('ch173-doc'); if(!doc) return;
          if(contentH<200) return;
          // اختتامی خانہ الگ رکھو (screen پر androoni میں ہو تو class بدل چکی: .zfa-wit-sign)
          var closeNodes=[];
          doc.querySelectorAll('.zf-close,.zf-signblk,.zfa-wit-sign').forEach(function(e){ closeNodes.push(e); if(e.parentNode)e.parentNode.removeChild(e); });
          // ═══ IDEMPOTENT ═══ chain کئی بار چلتا ہے (load + fonts.ready + timeouts)۔
          // دوبارہ چلنے پر پہلے androoni sheets کے تمام پیراگراف واپس berooni میں
          // لاؤ، پھر sheets ہٹاؤ — ورنہ دوسری بار sheets (اور اُن کے پیراگراف)
          // حذف ہو کر متن غائب ہو جاتا تھا۔
          var beroBody0=doc.querySelector('td.zf-c-body .zf-body');
          doc.querySelectorAll('.zf-androoni .zfa-body').forEach(function(ab){
            if(beroBody0){ while(ab.firstChild) beroBody0.appendChild(ab.firstChild); }
          });
          doc.querySelectorAll('.zf-androoni').forEach(function(e){ if(e.parentNode)e.parentNode.removeChild(e); });
          // پرانے مثل نشان ہٹاؤ (screen-width والے، اب print width پر لگائیں گے)
          doc.querySelectorAll('.zf-bind,.zf-bindmark').forEach(function(e){ if(e.parentNode)e.parentNode.removeChild(e); });
          // berooni کی اندرونی اونچائیاں reset (screen کی ناپ ہٹاؤ)
          doc.querySelectorAll('table.zf-tbl tbody td').forEach(function(td){ td.style.height=''; });

          var bp=beroParas(doc); var P=bp.paras;
          var beroNums=doc.querySelector('.zf-nums');
          if(!P.length){ // کچھ نہیں — بس اختتام واپس
            var cell0=doc.querySelector('td.zf-c-body'); closeNodes.forEach(function(e){cell0&&cell0.appendChild(e);}); return;
          }
          var docTop=doc.getBoundingClientRect().top;

          // اوور فلو ہے یا نہیں؟ (2 صفحوں سے آگے)
          var lastBottom=P[P.length-1].getBoundingClientRect().bottom - docTop;
          var putClose=function(cell){
            closeNodes.forEach(function(e){ cell.appendChild(e); });
            // دستخط کا انداز منزل کے مطابق (androoni: بائیں bold؛ berooni: اپنا)
            var inA=!!(cell.closest&&cell.closest('.zf-androoni'));
            var sign=cell.querySelector('.zf-signblk,.zfa-wit-sign');
            if(sign){
              var io=sign.querySelector('[data-k="io_sign"]'); var dt=sign.querySelector('[data-k="io_date"]');
              if(inA){ sign.className='zfa-wit-sign'; if(io)io.className='zfa-wit-io'; if(dt)dt.className='zfa-wit-date';
                sign.querySelectorAll('.zf-gap').forEach(function(g){g.style.display='none';}); }
              else { sign.className='zf-signblk'; if(io)io.className='zf-sign'; if(dt)dt.className='zf-signdate';
                sign.querySelectorAll('.zf-gap').forEach(function(g){g.style.display='';}); }
            }
          };

          var binds=[];
          if(lastBottom<=twoPage){
            // اوور فلو نہیں — سب berooni میں، نمبر 1..N، اختتام berooni میں
            if(beroNums){ beroNums.innerHTML=''; for(var i=0;i<P.length;i++) beroNums.appendChild(numDiv(i+1)); }
            putClose(doc.querySelector('td.zf-c-body'));
            addBind(doc.querySelector('td.zf-c-body .zf-body'), docTop);   // صفحہ 2 کا مثلث
            return;
          }

          // ── اوور فلو: berooni کو 2 صفحوں پر روکو ──
          var k0=fitCount(P,0,docTop,fitLimit);           // berooni میں آخری پیراگراف
          var gnum=0;                                     // مسلسل نمبر
          // ═══ ترتیب اہم ═══ پہلے اضافی پیراگراف berooni سے نکالو، پھر berooni
          // کو 2 صفحے بھرو۔ ہر androoni sheet کے لیے: پیراگراف ڈال کر sTop ناپو
          // (تب berooni + پچھلی sheets اپنی آخری اونچائی پر)، پھر 2 صفحے تک رکھو،
          // پھر اُس sheet کو 2 صفحے بھرو۔ (پہلے sTop غلط جگہ ناپا جا رہا تھا۔)
          var overflow=P.slice(k0+1);
          overflow.forEach(function(p){ if(p.parentNode) p.parentNode.removeChild(p); });
          if(beroNums){ beroNums.innerHTML=''; for(var i2=0;i2<=k0;i2++){ gnum++; beroNums.appendChild(numDiv(gnum)); } }
          fillHeight(doc.querySelector('td.zf-c-body'), fitLimit, docTop);   // berooni = 2 صفحے
          binds.push({body:doc.querySelector('td.zf-c-body .zf-body'), top:docTop});

          var oi=0, guard=0, lastBody=null;
          while(oi<overflow.length && guard<80){
            guard++;
            var wrap=document.createElement('div'); wrap.innerHTML=window.__ZA_SKEL;
            var sheet=wrap.firstChild; if(!sheet) break;
            doc.appendChild(sheet);
            var sBody=sheet.querySelector('.zfa-body'); var sNums=sheet.querySelector('.zfa-nums');
            if(sBody) sBody.innerHTML=''; if(sNums) sNums.innerHTML='';
            var local=[];
            for(var j=oi;j<overflow.length;j++){ sBody.appendChild(overflow[j]); local.push(overflow[j]); }
            var sTop=sheet.getBoundingClientRect().top;   // اب درست (پیراگراف ڈالنے کے بعد)
            var keep=fitCount(local,0,sTop,fitLimit);
            for(var m=local.length-1;m>keep;m--){ if(local[m].parentNode) local[m].parentNode.removeChild(local[m]); }
            for(var q=0;q<=keep;q++){ gnum++; if(sNums) sNums.appendChild(numDiv(gnum,'zfa-num')); }
            var cellL=sheet.querySelector('.zfa-c-body')||sBody;
            var isLast=((oi+keep+1)>=overflow.length);
            if(isLast) putClose(cellL);            // اختتام آخری شیٹ میں — fill سے پہلے (spill نہ ہو)
            fillHeight(cellL, fitLimit, sTop);      // یہ sheet = 2 صفحے
            binds.push({body:sBody, top:sTop});     // اس sheet کے پچھلے صفحے کا مثلث
            lastBody=cellL;
            oi=oi+keep+1;
          }
          if(!doc.querySelector('.zf-close')) putClose(lastBody||doc.querySelector('td.zf-c-body'));
          // تمام مثلث آخر میں (سب صفحہ بندی مکمل ہونے کے بعد)
          binds.forEach(function(u){ addBind(u.body, u.top); });
        }

        // ── نمبروں کی سیدھ (ہر شیٹ میں، اُسی کی اصل ناپ سے) ──
        function paraTops(body){
          var kids=[].slice.call(body.children).filter(function(el){
            return (el.tagName==='DIV'||el.tagName==='P') && (el.textContent||'').replace(/[\\s\\u00A0]/g,'').length;});
          if(kids.length) return kids.map(function(k){return k.getBoundingClientRect().top;});
          var tops=[],run=[];
          function flush(){ if(!run.length)return;
            var txt=run.map(function(n){return n.textContent||'';}).join('').replace(/[\\s\\u00A0]/g,'');
            if(txt){try{var rg=document.createRange();rg.setStartBefore(run[0]);rg.setEndAfter(run[run.length-1]);
              var r=rg.getBoundingClientRect(); if(r.height)tops.push(r.top);}catch(e){}} run=[]; }
          [].slice.call(body.childNodes).forEach(function(n){
            if(n.nodeType===1&&n.tagName==='BR'){flush();return;} run.push(n);});
          flush();
          if(tops.length) return tops;
          var r=body.getBoundingClientRect(); return r.height?[r.top]:[];
        }
        function alignOne(nums){
          if(nums.getAttribute('data-manual-space')==='1') return;
          var row=nums.closest('tr'); if(!row) return;
          var bodies=[].slice.call(row.querySelectorAll('.zf-body, .zfa-body'));
          if(!bodies.length) return;
          var tops=[]; bodies.forEach(function(b){ tops=tops.concat(paraTops(b)); });
          var kids=[].slice.call(nums.children);
          for(var i=0;i<kids.length;i++) kids[i].style.marginTop='0px';
          for(i=0;i<kids.length&&i<tops.length;i++){
            var g=Math.round(tops[i]-kids[i].getBoundingClientRect().top);
            if(g>0&&g<40000) kids[i].style.marginTop=g+'px';
          }
        }
        function alignAll(){ [].slice.call(document.querySelectorAll('.zf-nums, .zfa-nums')).forEach(alignOne); }

        function go(){ try{ chain(); }catch(e){} alignAll(); }
        // AHEM: chain ہمیشہ فونٹ لوڈ ہونے کے بعد چلے — ورنہ ناپ چھوٹی آتی ہے اور
        // زیادہ پیراگراف ایک شیٹ میں سما جاتے ہیں (split غلط)۔ idempotent ہے، اس
        // لیے دوبارہ چلنا محفوظ ہے۔
        function boot(){
          go();                                   // پہلی جھلک (فونٹ سے پہلے)
          setTimeout(go,120); setTimeout(go,400); setTimeout(go,900);
          if(document.fonts&&document.fonts.ready){ document.fonts.ready.then(function(){ go(); setTimeout(go,60); setTimeout(go,300); }); }
        }
        boot();
        window.addEventListener('beforeprint', function(){ go(); });
        try{ var mq=window.matchMedia&&window.matchMedia('print');
          if(mq&&mq.addEventListener) mq.addEventListener('change',function(e){ if(e.matches) go(); }); }catch(e){}
      })();
    </script></body></html>`;
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

// ═══════════════════════════════════════════════════════════════
//  Ctrl+S — پورے سسٹم میں: جو بھی فارم کھلا ہو وہ محفوظ/اپ ڈیٹ ہو
//  (براؤزر کا "صفحہ محفوظ کریں" رک جاتا ہے)
// ═══════════════════════════════════════════════════════════════
function _dioBindCtrlS() {
  if (window._dioCtrlSBound) return;
  window._dioCtrlSBound = true;
  document.addEventListener('keydown', function (e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    if (String(e.key || '').toLowerCase() !== 's') return;
    if (e.shiftKey || e.altKey) return;
    // کون سا فارم کھلا ہے؟ — پہلے ضمنی، پھر چالان، پھر عام محفوظ
    let done = false;
    try {
      const doc = (typeof _ch173Doc === 'function') ? _ch173Doc() : document.getElementById('ch173-doc');
      if (doc) {
        e.preventDefault();
        // ضمنی کا صفحہ اپنی .zf-tbl سے پہچانا جاتا ہے
        if (doc.querySelector('.zf-tbl')) { _saveZimni(false, true); done = true; }   // کھلی رہے
        else if (typeof _saveR173 === 'function') { _saveR173(); done = true; }
      }
    } catch (_) {}
    if (done) return;
    // باقی فارم — صفحے کا "محفوظ" بٹن دبا دو
    try {
      const btn = [...document.querySelectorAll('button')].find(b => {
        const t = (b.textContent || '');
        return /محفوظ|Save/i.test(t) && b.offsetParent !== null && !b.disabled;
      });
      if (btn) { e.preventDefault(); btn.click(); }
    } catch (_) {}
  }, true);
}
window._dioBindCtrlS = _dioBindCtrlS;
try { _dioBindCtrlS(); } catch (_) {}


// ═══════════════════════════════════════════════════════════════════════
// ▼▼▼  اندرونی ضمنی (zimni-androoni) — اب اسی فائل میں شامل  ▼▼▼
//  WAJAH: alag file (zimni-androoni.js) baar baar deploy hone se reh jati
//  thi (index.html mein tag reh jata ya GitHub par upload na hoti), jis se
//  ZIMNI_A_VER undefined aata aur '161 byanat' chip kaam na karti. Ab yeh
//  poora code zimni.js ke andar hai — jab zimni.js load hoti hai (jo hamesha
//  hoti hai), androoni khud-ba-khud maujood hota hai. Alag file ki zaroorat
//  KHATAM. index.html se <script src="zimni-androoni.js"> line hata sakte hain.
// ═══════════════════════════════════════════════════════════════════════

// ═══ فائل کا نمبر — تصدیق کے لیے کہ نئی فائل چل رہی ہے یا پرانی cached ═══
// کنسول میں لکھیں:  ZIMNI_A_VER    →  اگر نیچے والا نمبر نظر آئے تو نئی فائل ہے
const ZIMNI_A_VER = 'zimni-androoni v23 — FIR matn also skipped for مدعی (like محرر)';
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
  let rows = [];
  try {
    const { data } = await supabaseClient.from('case_witnesses')
      .select('id,full_name,witness_type,status').eq('case_id', cid)
      .order('created_at', { ascending: true });
    rows = data || [];
  } catch (_) { rows = []; }

  // محرر — نیا مقدمہ درج کرتے وقت FIR کی تفصیل میں لکھا جاتا ہے (case ka
  // 'fir_writer' field — wahi source jo report173 ka _ch173Muharrir use
  // karta hai)۔ case_witnesses mein عموماً الگ record نہیں ہوتا، اس لیے
  // اسے یہاں خود بطور پہلا "گواہ" (status:moharrir) شامل کر دو۔
  // مدعی — 'complainant' field se (مدعی بھی گواہ ہوتا ہے)۔
  try {
    const c = _zaCase || {};
    const nameKey = (s) => String(s || '').replace(/\s+/g, '');
    const inject = (nm, status) => {
      nm = String(nm || '').trim();
      if (!nm) return;
      const dup = rows.some(w => w.status === status ||
        nameKey(w.full_name) === nameKey(nm));
      if (!dup) rows.unshift({ id: status + '-card', full_name: nm, status, _fromCard: true });
    };
    // ترتیب: مدعی پہلے آئے، پھر محرر (unshift اُلٹا لگاتا ہے، اس لیے پہلے محرر)
    inject(c.fir_writer, 'moharrir');
    inject(c.complainant, 'mudai');
  } catch (_) {}

  _zaWitnesses = rows;
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
  // محرر ہو تو نام کے ساتھ لفظ "محرر" اور تھانہ کا نام بھی — باقی گواہ کے لیے
  // صرف نام (اُن کا ولد/قوم/سکنہ نام ہی میں شامل ہوتا ہے)
  const isMoharrir = (witness.status === 'moharrir');
  const isMudai    = (witness.status === 'mudai');
  // محرر اور مدعی — دونوں کے بیان میں FIR کا متن خود بخود نہیں آتا
  const skipFir    = (isMoharrir || isMudai);
  let nmRaw = String(witness.full_name || witness.name || '').trim();
  if (isMoharrir) {
    const stn = String((_zaCase && (_zaCase.station || _zaCase.police_station)) || o.station || '').trim();
    if (!/محرر/.test(nmRaw)) nmRaw = nmRaw + ' محرر';
    if (stn && nmRaw.indexOf(stn) === -1) nmRaw = nmRaw + ' تھانہ ' + stn;
  }
  const nm  = E(nmRaw);
  const zno = (_zaActive && _zaActive.serial_no) ? E(_zaActive.serial_no) : '۔۔۔۔';

  // گواہ کا بیان FIR کے متن سے شروع ہوتا ہے — 'fir_matn' table سے، اُسی
  // طریقے سے جو report173 کا _ch173FirText استعمال کرتا ہے۔ AHEM: report173
  // کا اپنا _ch173FirMatn (shared/global) دوبارہ استعمال نہیں کیا — وہ کسی
  // اور مقدمہ کے لیے پہلے سے بھرا ہو سکتا ہے (report173 پہلے کھلا ہو تو)،
  // جس سے یہاں غلط/پرانا یا خالی متن آ جاتا (بالکل data-k="halaat" والی
  // ٹکراؤ کی طرح)۔ اسی مقدمہ کے لیے ہمیشہ تازہ سوال۔
  // محرر اور مدعی کے لیے FIR کا متن نہیں بھرا جاتا۔
  let firText = '';
  try {
    if (!skipFir) {
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
  block.setAttribute('data-witness-name', nmRaw.trim());
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

  let list = await _zaLoadWitnesses();
  if ((!list || !list.length) && typeof _witnessList !== 'undefined' && _witnessList && _witnessList.length) list = _witnessList;
  list = (list || []).filter(w => (w.full_name || '').trim());
  if (!list.length) {
    if (typeof openWitnessesCard === 'function') {
      if (typeof showToast === 'function') showToast('ℹ️ ابھی کوئی گواہ درج نہیں — گواہان اسکرین کھول دی', 'info');
      openWitnessesCard(_zaCaseId, 'fir');
    } else if (typeof showToast === 'function') {
      showToast('ℹ️ اس مقدمہ میں کوئی گواہ درج نہیں', 'info');
    }
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
    const tag = (w.status === 'moharrir') ? ' <span style="color:#0369a1;font-size:11px;">(محرر)</span>'
              : (w.status === 'mudai') ? ' <span style="color:#0369a1;font-size:11px;">(مدعی)</span>'
              : '';
    return `<label style="display:flex;align-items:center;gap:8px;padding:7px 6px;cursor:pointer;font-size:13px;
              border-bottom:1px solid #f1f5f9;font-family:'Jameel Noori Nastaleeq',serif;">
              <input type="checkbox" name="zfa-wit-pick" value="${i}"> <span>${E(nm)}${tag}</span></label>`;
  }).join('');
  box.innerHTML = `
    <div style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;font-weight:700;color:#0369a1;
                font-family:'Jameel Noori Nastaleeq',serif;background:#f8fafc;">گواہان منتخب کریں (ایک سے زیادہ)</div>
    <div style="flex:1;overflow-y:auto;padding:4px 8px;min-height:0;">${rows}</div>
    <div style="padding:4px 8px;border-top:1px solid #f1f5f9;">
      <button id="zfa-wit-addnew" style="width:100%;padding:6px;border:1px dashed #94a3b8;border-radius:6px;
        background:#fff;color:#0369a1;cursor:pointer;font-size:12px;font-family:'Jameel Noori Nastaleeq',serif;">
        ➕ نیا گواہ / محرر شامل کریں</button>
    </div>
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
  // نیا گواہ/محرر — سیدھا گواہان اسکرین کھول دو (status وہاں سے "محرر" چنیں)
  box.querySelector('#zfa-wit-addnew').onclick = () => {
    box.remove();
    if (typeof openWitnessesCard === 'function') openWitnessesCard(_zaCaseId, 'fir');
    else if (typeof showToast === 'function') showToast('گواہان اسکرین سے شامل کریں', 'info');
  };
  box.querySelector('#zfa-wit-ok').onclick = () => {
    const sels = [...box.querySelectorAll('input[name="zfa-wit-pick"]:checked')];
    if (!sels.length) { if (typeof showToast === 'function') showToast('⚠️ پہلے گواہان منتخب کریں', 'warn'); return; }
    box.remove();
    // Chune hue TAMAM gawahan ke byanat aik-aik kar ke add karo (161 CrPC)
    sels.forEach(s => { const w = list[parseInt(s.value, 10)]; if (w) _zaInsertWitnessStatement(w); });
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
  #ch173-doc .zfa-wit-block{ margin:4px 0 16px; display:flow-root; }
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
  #ch173-doc .zfa-wit-io{ font-weight:bold; white-space:nowrap; }
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
