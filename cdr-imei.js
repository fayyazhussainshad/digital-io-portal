/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — CDR / IMEI درخواست فارم  (نیا فارم 2026)
   «درخواست برائے فراہمی کال ڈیٹا ریکارڈ» — NEW_CDR_FORM_FOR_IO_2026 کے
   عین مطابق (پرانا جدول والا فارم اس سے بدل دیا گیا)۔

   • کاغذ: A4 · سسٹم کا طے شدہ مارجن (اوپر/نیچے 1cm، دائیں 1in، بائیں 0.4in) · ایک صفحہ
     (fit to page — مواد زیادہ ہو تو چھپائی خود چھوٹی ہو کر ایک صفحے میں)
   • تمام فونٹ pt میں · اردو RTL، انگریزی/نمبر LTR (ملی جلی سطر میں بھی)
   • ڈیٹا سسٹم سے: تھانہ/ضلع، مدعی (سرکار بذریعہ)، مقدمہ نمبر/تاریخ/جرم،
     ملزم (بنام — ▾ سے انتخاب)، موبائل/IMEI نمبر (مقدمے کے چوری ڈیٹا سے)،
     درخواست دہندہ (نام + عہدہ + محکمانہ نمبر، فون)
   • ہر خانہ قابلِ ترمیم · اوپر مستقل ترمیمی ٹول بار (floating نہیں)
   • محفوظ: `cdr_imei_requests` (وہی ٹیبل/کالم جو پہلے تھے — schema نہیں بدلا)
     نئے فارم کا ڈیٹا `rows` میں: 10 نمبر + آخر میں {_form:'cdr2', f, chk}
     پرانی محفوظ درخواست کھلے تو اُس کے نمبر نئے فارم میں آ جاتے ہیں
   ═══════════════════════════════════════════════════════════ */

/* global _misalCaseId, currentCaseId, getCase, dioEditorToolbar, dioEditorToolbarCSS, dioBindEditor,
          dioRegisterSaved, _misalDocs, _refreshMisalBar, dioFontHead, dioPrint */

let _cdrICaseId = null;
let _cdrICase = null;
let _cdrISaved = null;
let _cdrAccused = [];
let _cdrDirty = false;

const CDR_FORM_TAG = 'cdr2';
const CDR_NUM_COUNT = 10;
// A4 پر 1 انچ مارجن کے بعد لکھنے کی جگہ (چوڑائی 6.27in · اونچائی 9.69in)
const CDR_PX_PER_IN = 96;
// سسٹم کا طے شدہ اصول (درخواستیں/نقشہ موقع): A4 · اوپر/نیچے 1cm · دائیں 1in · بائیں 0.4in
const CDR_MARGIN_CSS = '1cm 1in 1cm 0.4in';
const CDR_AVAIL_H_IN = 11.69 - 2 / 2.54;

async function openCdrImei(caseId) {
  _cdrICaseId = caseId || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
            || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  const area = _cdrArea();
  if (area && window.DIO && DIO.states) area.innerHTML = DIO.states.loading('CDR/IMEI درخواست لوڈ ہو رہی ہے');
  _cdrICase = null;
  if (typeof getCase === 'function' && _cdrICaseId) {
    try { _cdrICase = await getCase(_cdrICaseId); } catch (e) { _cdrICase = null; console.warn('cdr getCase:', e && e.message); }
  }
  await Promise.all([_loadCdr(), _cdrLoadAccused()]);
  _cdrDirty = false;
  _renderCdr();
}
window.openCdrImei = openCdrImei;

function _cdrArea() {
  return document.getElementById('workspace-editor-area')
      || document.getElementById('workspace-tab-content')
      || document.getElementById('page-content');
}

async function _loadCdr() {
  const key = 'dio_cdr_' + _cdrICaseId;
  const fromCache = () => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
  if (!navigator.onLine) { _cdrISaved = fromCache(); return; }
  // آف لائن محفوظ شدہ (ابھی سرور پر نہیں گیا) نسخہ — سرور کا خالی/پرانا جواب
  // اسے مٹا نہ دے؛ اگلی بار «محفوظ کریں» پر یہی سرور پر جائے گا
  const local = fromCache();
  if (local && local.id && String(local.id).indexOf('tmp_') === 0) { _cdrISaved = local; return; }
  try {
    const { data, error } = await supabaseClient.from('cdr_imei_requests').select('*')
      .eq('case_id', _cdrICaseId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    _cdrISaved = data || null;
    try { localStorage.setItem(key, JSON.stringify(_cdrISaved)); } catch (e) { console.warn('cdr cache:', e && e.message); }
  } catch {
    _cdrISaved = fromCache();
  }
}

// ملزمان (case_accused) — بنام کے لیے؛ آف لائن پر وہی cache جو ملزمان ماڈیول رکھتا ہے
async function _cdrLoadAccused() {
  _cdrAccused = [];
  if (!_cdrICaseId) return;
  try {
    const { data, error } = await supabaseClient.from('case_accused').select('*')
      .eq('case_id', _cdrICaseId).order('created_at', { ascending: true });
    if (error) throw error;
    _cdrAccused = data || [];
  } catch {
    try { _cdrAccused = JSON.parse(localStorage.getItem('dio_accused_' + _cdrICaseId) || '[]') || []; }
    catch { _cdrAccused = []; }
  }
}

// ── "نام ولد … قوم … سکنہ …" کو چار حصوں میں (سسٹم میں مدعی/ملزم ایک ہی
//    خانے میں لکھے جاتے ہیں)۔ جو لفظ نہ ملے وہ حصہ خالی — اندازہ نہیں۔ ──
function _cdrParsePerson(raw) {
  const out = { name: '', father: '', qaum: '', address: '' };
  let s = String(raw == null ? '' : raw).replace(/<[^>]*>/g, ' ')
    .replace(/[‎‏؜‪-‮]/g, '').replace(/\s+/g, ' ').trim();
  if (!s) return out;
  const MARK = [
    ['address', /(?:^|[\s،,])(?:سکنہ|ساکنہ|ساکن|سکنائے|سکنا)\s*[:：۔-]*\s*/],
    ['qaum',    /(?:^|[\s،,])(?:قوم|ذات)\s*[:：۔-]*\s*/],
    ['father',  /(?:^|[\s،,])(?:ولدیت|ولد|زوجہ|دختر|بنت)\s*[:：۔-]*\s*/],
  ];
  const hits = [];
  MARK.forEach(([k, re]) => { const m = re.exec(s); if (m) hits.push({ k, at: m.index, end: m.index + m[0].length }); });
  hits.sort((a, b) => a.at - b.at);
  const clean = t => String(t || '').replace(/^[\s،,:۔-]+|[\s،,:۔-]+$/g, '').trim();
  out.name = clean(s.slice(0, hits.length ? hits[0].at : s.length));
  hits.forEach((h, i) => { out[h.k] = clean(s.slice(h.end, i + 1 < hits.length ? hits[i + 1].at : s.length)); });
  return out;
}

// موبائل/IMEI نمبر — مقدمے کے چوری ڈیٹا سے (IMEI پہلے، پھر سم نمبر)
function _cdrSystemNumbers() {
  const c = _cdrICase || {};
  const list = [];
  const add = v => String(v || '').split(/[،,;\n]/).map(x => x.trim()).filter(Boolean)
    .forEach(x => { if (!list.includes(x)) list.push(x); });
  add(c.theft_imei);
  add(c.theft_cell);
  return list.slice(0, CDR_NUM_COUNT);
}

// تفتیشی افسر / درخواست دہندہ — نام + عہدہ (+ محکمانہ نمبر)
function _cdrOfficer() {
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  let name = (o.full_name || '').trim();
  let rank = (o.designation || o.rank || '').trim();
  if (!name || !rank) {
    try {
      const p = JSON.parse(localStorage.getItem('dio_officer_cache') || '{}');
      if (!name) name = (p.full_name || '').trim();
      if (!rank) rank = (p.designation || '').trim();
    } catch { /* cache خراب — سسٹم کا ڈیٹا ہی کافی */ }
  }
  const badge = String(o.badge_number || '').trim();
  return {
    line: [name, rank, badge].filter(Boolean).join(' '),
    phone: String(o.official_phone || o.phone || '').trim(),
    station: (o.station || '').trim(),
    district: (o.district || '').trim(),
  };
}

// آج کی تاریخ DD/MM/YYYY (انگریزی ہندسے — مقامی ترتیب نہیں)
function _cdrToday() {
  const d = new Date();
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
}

function _cdrFmtDate(d) {
  if (!d) return '';
  if (typeof formatDate === 'function') { const f = formatDate(d); return f === '—' ? '' : f; }
  return String(d);
}

// پہلے سے طے شدہ ڈیٹا (سسٹم سے) — نیا فارم یا خالی خانہ
function _cdrDefaults(accIdx) {
  const c = _cdrICase || {};
  const of = _cdrOfficer();
  const cmp = _cdrParsePerson(c.complainant);
  const acc = (_cdrAccused[accIdx] || null);
  const ap = _cdrParsePerson(acc ? acc.name : '');
  // بجرم = صرف دفعہ (مثلاً 379 ت پ) — جرم کی تفصیل (چوری موبائل وغیرہ) نہیں
  const jurm = String(c.section_of_law || '').trim();
  return {
    thana: of.station || c.case_station || '',
    zila: of.district || c.case_district || '',
    s_name: cmp.name, s_father: cmp.father, s_qaum: cmp.qaum, s_address: cmp.address,
    fir: c.fir_number || '', fir_date: _cdrFmtDate(c.fir_date), jurm,
    fir_thana: c.case_station || of.station || '',
    b_name: ap.name, b_father: ap.father, b_qaum: ap.qaum, b_address: ap.address,
    // CDR کی مدت — پہلے سے: تاریخِ وقوعہ سے آج تک (ہر خانہ قابلِ ترمیم / ٹول بار سے تاریخ چنیں)
    date_from: _cdrFmtDate(c.occurrence_date), date_to: _cdrToday(),
    applicant: of.line, applicant_phone: of.phone,
    io_sign: '', dispatch_no: '', dispatch_date: '',
    sho_note1: '', sho_note2: '', sdpo_note1: '', sdpo_note2: '', sp_note1: '', sp_note2: '',
  };
}

// محفوظ ریکارڈ → {f, nums, chk, acc}
function _cdrFromSaved(s) {
  if (!s || !Array.isArray(s.rows)) return null;
  const meta = s.rows.find(r => r && r._form === CDR_FORM_TAG);
  const nums = s.rows.filter(r => r && !r._form).map(r => String(r.req || '').trim());
  if (meta) {
    while (nums.length < CDR_NUM_COUNT) nums.push('');
    return { f: meta.f || {}, nums: nums.slice(0, CDR_NUM_COUNT), chk: meta.chk || [false, false, false], acc: meta.acc };
  }
  // پرانا فارم — صرف نمبر منتقل؛ باقی سسٹم سے
  const old = nums.filter(Boolean).slice(0, CDR_NUM_COUNT);
  while (old.length < CDR_NUM_COUNT) old.push('');
  return { f: {}, nums: old, chk: [false, false, false], acc: 0, legacy: true };
}

function _renderCdr() {
  const area = _cdrArea();
  if (!area) return;
  const saved = _cdrFromSaved(_cdrISaved);
  const accIdx = (saved && Number.isInteger(saved.acc)) ? saved.acc : 0;
  const def = _cdrDefaults(accIdx);
  const sf = (saved && saved.f) || {};
  const _san = (typeof sanitizeHtml === 'function') ? sanitizeHtml : (x => esc(x));
  // محفوظ قیمت (HTML) — ورنہ سسٹم کی قیمت (escape)
  const val = k => (sf[k] !== undefined && sf[k] !== null && String(sf[k]).replace(/<[^>]*>|&nbsp;/g, '').trim() !== '')
    ? _san(sf[k]) : esc(def[k] || '');
  let nums = saved ? saved.nums.slice() : [];
  if (!saved || nums.every(n => !n)) {
    const sys = _cdrSystemNumbers();
    nums = Array.from({ length: CDR_NUM_COUNT }, (_, i) => sys[i] || '');
  }
  const chk = (saved && saved.chk) || [false, false, false];

  // خانہ (field) — data-k، خالی ہو تو نقطہ دار لکیر، بھرا ہو تو بولڈ
  const F = (k, grow, extra) => `<span class="cdr-f${val(k) ? ' cdr-has' : ''}" contenteditable="true" data-k="${k}"` +
    ` style="flex:${grow} 1 0;${extra || ''}" oninput="_cdrOnInput(this)">${val(k)}</span>`;
  const L = t => `<span class="cdr-l">${t}</span>`;
  // پہلی چار سطروں کے لیے: لیبل اور سطر میں بہتا ہوا خانہ (اپنی چوڑائی جتنا)
  const H = t => `<span class="cdr-h">${t}</span>`;
  const FI = (k, extra) => `<span class="cdr-fi${val(k) ? ' cdr-has' : ''}" contenteditable="true" data-k="${k}"` +
    ` style="${extra || ''}" oninput="_cdrOnInput(this)">${val(k)}</span>`;
  const EN = t => `<bdi class="cdr-en" dir="ltr">${t}</bdi>`;

  const numCell = i => `
    <div class="cdr-num-row">
      <span class="cdr-num-no">${i + 1})</span>
      <span class="cdr-num${nums[i] ? ' cdr-has' : ''}" contenteditable="true" dir="ltr" data-n="${i}"
        oninput="_cdrOnInput(this);_cdrCount()">${esc(nums[i] || '')}</span>
    </div>`;

  const approvalBlock = (title, noteLbl, k1, k2) => `
    <div class="cdr-appr">
      <div class="cdr-box">
        <div class="cdr-box-t">${title}</div>
        <div class="cdr-box-s">حصول ${EN('CDR/IMEI')} کی اہمیت اور ضرورت کی تصدیق</div>
      </div>
      <div class="cdr-notes">
        <div class="cdr-line">${L('نوٹ ' + EN(noteLbl) + ':')}${F(k1, 1)}</div>
        <div class="cdr-line">${F(k2, 1)}</div>
      </div>
    </div>`;

  const sopRow = (i, txt) => `
    <div class="cdr-sop-row">
      <span class="cdr-sop-t">${txt}</span>
      <span class="cdr-chk${chk[i] ? ' on' : ''}" data-chk="${i}" role="checkbox" aria-checked="${chk[i] ? 'true' : 'false'}"
        tabindex="0" onclick="_cdrToggleChk(this)" onkeydown="if(event.key===' '||event.key==='Enter'){event.preventDefault();_cdrToggleChk(this);}"
        title="نشان لگائیں / ہٹائیں">${chk[i] ? '✓' : ''}</span>
    </div>`;

  // ملزم کا انتخاب (بنام) — صرف سکرین پر
  const accOpts = _cdrAccused.length
    ? _cdrAccused.map((a, i) => `<option value="${i}" ${i === accIdx ? 'selected' : ''}>${esc(_cdrParsePerson(a.name).name || a.name || ('ملزم ' + (i + 1)))}</option>`).join('')
    : '<option value="">کوئی ملزم درج نہیں</option>';

  const tb = (typeof dioEditorToolbar === 'function') ? dioEditorToolbar() : '';

  area.innerHTML = `
  <div class="cdr-wrap" style="display:flex;flex-direction:column;height:100%;direction:rtl;">
    <!-- ترمیمی ٹول بار — اوپر مستقل (floating نہیں) -->
    <div class="cdr-toolbar no-print">
      ${tb}
      <span class="dio-etb-sep"></span>
      <!-- CDR کی مدت — 📅 دبا کر تاریخ چنیں؛ فارم میں ہمیشہ DD/MM/YYYY (براؤزر کی مقامی ترتیب نہیں) -->
      <span class="cdr-tb-lbl">CDR مورخہ
        <span class="cdr-cal dio-etb-btn" title="کس تاریخ سے — تاریخ چنیں">📅<input type="date" class="cdr-date-in" data-for="date_from" value="${_cdrIso(val('date_from'))}" onclick="try{this.showPicker()}catch{}" onchange="_cdrSetDate('date_from', this.value)" aria-label="CDR کس تاریخ سے"></span>
        تک
        <span class="cdr-cal dio-etb-btn" title="کس تاریخ تک — تاریخ چنیں">📅<input type="date" class="cdr-date-in" data-for="date_to" value="${_cdrIso(val('date_to'))}" onclick="try{this.showPicker()}catch{}" onchange="_cdrSetDate('date_to', this.value)" aria-label="CDR کس تاریخ تک"></span>
      </span>
      <span class="dio-etb-sep"></span>
      <button type="button" class="btn btn-secondary btn-sm" onclick="_cdrRefill()" title="خالی خانے سسٹم کے ڈیٹا سے دوبارہ بھریں">↺ سسٹم ڈیٹا</button>
      <button type="button" class="btn btn-secondary btn-sm" onclick="_newCdr()">نئی درخواست</button>
      <span style="margin-right:auto;"></span>
      <button type="button" class="btn btn-primary btn-sm dio-modbtn cdr-save" onclick="_saveCdr()">محفوظ کریں</button>
      <button type="button" class="btn btn-secondary btn-sm dio-modbtn cdr-print" onclick="_printCdr()">پرنٹ کریں</button>
    </div>

    <div class="cdr-scroll" id="cdr-scroll">
      <div class="cdr-zoom" id="cdr-zoom">
      <div id="cdr-doc" class="cdr-page" data-acc="${accIdx}"><div class="cdr-inner" id="cdr-inner">

        <!-- پہلی چار سطریں — درخواستیں (darkhwastain) کی ترتیب: تھانہ دائیں کنارے،
             ضلع بائیں کنارے · سرکار بذریعہ/مقدمہ 0.9in اندر سے شروع، متن جہاں ختم
             وہیں سطر ختم · بنام دائیں کنارے (hanging)، باقی اُسی 0.9in پر -->
        <div class="cdr-title-row">
          <span class="cdr-tt-right">${H('تھانہ:')} ${FI('thana')}</span>
          <span class="cdr-tt-left">${H('ضلع:')} ${FI('zila')}</span>
        </div>

        <div class="cdr-sarkar">${H('سرکار بذریعہ:۔')} ${H('نام')} ${FI('s_name')} ${H('ولد')} ${FI('s_father')} ${H('قوم')} ${FI('s_qaum')} ${H('ساکن')} ${FI('s_address')}</div>

        <div class="cdr-caseline">${H('مقدمہ نمبر')} ${FI('fir', 'unicode-bidi:isolate;')} ${H('مورخہ')} ${FI('fir_date', 'unicode-bidi:isolate;')} ${H('بجرم')} ${FI('jurm')} ${H('تھانہ')} ${FI('fir_thana')}</div>

        <div class="cdr-banam-row">
          ${_cdrAccused.length ? `<span class="cdr-acc-pick no-print" title="ملزم منتخب کریں — بنام کے خانے بھر جائیں گے">▾<select onchange="_cdrPickAccused(this.value)" aria-label="ملزم منتخب کریں">${accOpts}</select></span>` : ''}
          <span class="cdr-banam-lbl">بنام:۔</span>
          <span class="cdr-banam-list">${H('نام')} ${FI('b_name')} ${H('ولد')} ${FI('b_father')} ${H('قوم')} ${FI('b_qaum')} ${H('ساکن')} ${FI('b_address')}</span>
        </div>

        <div class="cdr-line cdr-subj">${L('عنوان:')}<span class="cdr-subj-t">درخواست برائے فراہمی کال ڈیٹا ریکارڈ</span></div>

        <div class="cdr-body">
          <b>جناب عالی!</b>&nbsp; گزارش ہے کہ مقدمہ عنوان بالا کی تفتیش کے لیے مندرجہ ذیل موبائل نمبروں/${EN('IMEI')} نمبروں کی ${EN('CDR')}<br>
          مورخہ ${F('date_from', 0, 'min-width:1.15in;display:inline-block;')} سے ${F('date_to', 0, 'min-width:1.15in;display:inline-block;')}
          تک فراہم کی جائے تاکہ اصل حقائق کی روشنی میں مقدمہ عنوان بالا کو یکسو کیا جا سکے۔
        </div>

        <div class="cdr-numhead">موبائل نمبر/${EN('IMEI')} نمبر:۔</div>
        <div class="cdr-grid">
          ${Array.from({ length: CDR_NUM_COUNT }, (_, i) => numCell(i)).join('')}
        </div>

        <div class="cdr-line cdr-center">
          <span class="cdr-l cdr-b">کتنے نمبر فارورڈ کیے گئے:۔</span>
          <span class="cdr-f cdr-count cdr-has" id="cdr-count" contenteditable="true" data-k="count" dir="ltr"
            oninput="this.dataset.manual='1';_cdrOnInput(this)" ${sf.count_manual ? 'data-manual="1"' : ''}>${sf.count_manual ? _san(sf.count) : ''}</span>
        </div>

        <div class="cdr-line">
          <span class="cdr-l cdr-b cdr-u">تفصیل درخواست دہندہ:</span><span class="cdr-l cdr-n">نام معہ عہدہ و محکمانہ نمبر</span>${F('applicant', 4, 'unicode-bidi:plaintext;')}<span class="cdr-l cdr-n">فون نمبر</span>${F('applicant_phone', 2, 'direction:ltr;unicode-bidi:isolate;')}
        </div>

        <div class="cdr-line cdr-sign">
          <span class="cdr-l cdr-b">دستخط ${EN('IO')} معہ ${EN('STAMP')} تھانہ ہذا</span>${F('io_sign', 3)}<span class="cdr-l cdr-b">ڈسپیچ رجسٹر نمبر ${EN('5A')}</span>${F('dispatch_no', 2, 'unicode-bidi:plaintext;')}<span class="cdr-l cdr-b">مورخہ</span>${F('dispatch_date', 1.6, 'unicode-bidi:plaintext;')}
        </div>

        ${approvalBlock(`دستخط ${EN('SHO')} تھانہ ہذا معہ ${EN('STAMP')}`, 'SHO', 'sho_note1', 'sho_note2')}
        ${approvalBlock(`دستخط ${EN('SDPO')} سرکل ہذا+${EN('STAMP')}`, 'SDPO', 'sdpo_note1', 'sdpo_note2')}
        ${approvalBlock(`دستخط ${EN('STAMP+SP/INVESTIGATION')}`, 'SP/INV', 'sp_note1', 'sp_note2')}

        <div class="cdr-foot">
          <div class="cdr-sop">
            ${sopRow(0, `نوٹ: 1۔ کیا ${EN('SOP')} کے مطابق ${EN('FIR')} کی فوٹو کاپی لف ہے`)}
            ${sopRow(1, `2۔ کیا ${EN('SOP')} کے مطابق تمام نمبرز کی ضمنی ساتھ لف ہے`)}
            ${sopRow(2, `3۔ کیا ${EN('SOP')} کے مطابق تمام نمبرز کی ضمنی ${EN('POLCOM')} میں درج ہے`)}
          </div>
          <div class="cdr-office">دفتری استعمال کے لیے۔</div>
        </div>

      </div></div>
      </div>
    </div>
  </div>
  <style id="cdr-style">${_cdrCSS()}</style>`;

  if (typeof dioEditorToolbarCSS === 'function') dioEditorToolbarCSS();
  if (typeof dioBindEditor === 'function') { try { dioBindEditor(area); } catch (e) { console.warn('cdr bind:', e && e.message); } }
  _cdrCount();
  _cdrFit();
  _cdrBalance();
  try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(_cdrBalance); } catch { /* پرانا براؤزر */ }
  if (!window._cdrResizeBound) { window._cdrResizeBound = true; window.addEventListener('resize', _cdrFit); }
}
window._renderCdr = _renderCdr;

// ── CSS (سکرین + چھپائی دونوں — ایک ہی ناپ) ──
function _cdrCSS() {
  return `
    .cdr-toolbar{ position:sticky; top:0; z-index:20; display:flex; align-items:center; gap:6px; flex-wrap:wrap;
      padding:7px 10px; direction:rtl; background:var(--bg-secondary,#f3f6f9); border-bottom:1px solid var(--border,#ddd); }
    .cdr-tb-lbl{ display:inline-flex; align-items:center; gap:4px; white-space:nowrap; font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; font-size:11pt; color:var(--text-primary,#111); }
    .cdr-cal{ position:relative; display:inline-flex; align-items:center; justify-content:center; overflow:hidden; cursor:pointer; }
    .cdr-cal input{ position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:pointer; border:0; padding:0; }
    /* موبائل: ٹول بار ایک ہی قطار (نقشہ موقع کی طرح) — انگلی سے دائیں/بائیں
       سرکائیں، کوئی بٹن ہٹایا نہیں · محفوظ/پرنٹ بائیں کنارے پر ہمیشہ نظر میں */
    @media (max-width:760px){
      .cdr-toolbar{ flex-wrap:nowrap; overflow-x:auto; overflow-y:hidden; gap:4px; padding:4px 6px;
        -webkit-overflow-scrolling:touch; scrollbar-width:none; overscroll-behavior-x:contain; }
      .cdr-toolbar::-webkit-scrollbar{ display:none; }
      .cdr-toolbar > *, .cdr-toolbar .dio-etb > *{ flex:0 0 auto; }
      .cdr-toolbar .dio-etb{ flex:0 0 auto; flex-wrap:nowrap !important; }
      .cdr-toolbar .dio-etb-btn, .cdr-toolbar .dio-etb-sel, .cdr-toolbar .btn{ height:34px; white-space:nowrap; }
      .cdr-toolbar .cdr-save{ position:sticky; left:0; z-index:3; }
      .cdr-toolbar .cdr-print{ position:sticky; left:0; z-index:3; box-shadow:-6px 0 8px -4px rgba(0,0,0,.18); }
    }
    /* کاغذ کے گرد کوئی خالی جگہ نہیں — A4 سیدھا اوپر سے شروع */
    .cdr-scroll{ flex:1; min-height:0; overflow:auto; padding:0; background:var(--bg-tertiary,#e9eef3); }
    .cdr-zoom{ width:8.27in; margin:0 auto; }

    #cdr-doc{ width:8.27in; min-height:11.69in; box-sizing:border-box; padding:1cm 1in 1cm 0.4in; margin:0 auto;
      background:#fff; color:#000; direction:rtl; text-align:right;
      font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; font-size:12pt; line-height:1.6;
      box-shadow:0 0 0 1px rgba(0,0,0,0.08); border-radius:0; }
    #cdr-doc *{ box-sizing:border-box; }
    #cdr-doc .cdr-en{ font-family:'Times New Roman',Times,'Liberation Serif',serif; unicode-bidi:isolate; }

    /* سطر — لیبل + خانے، ایک ہی سطر میں (لفظوں میں مناسب فاصلہ) */
    #cdr-doc .cdr-line{ display:flex; align-items:baseline; gap:0 5pt; margin:0 0 9pt; flex-wrap:nowrap; }
    /* ── پہلی چار سطریں — درخواستیں (#dk-doc) کے عین اصول، 14pt ── */
    #cdr-doc{ --cdr-indent:0.9in; }
    /* لیبل عام، بھرا ہوا ڈیٹا بولڈ (درخواستیں جیسا) · لیبل اور ڈیٹا کے درمیان واضح فاصلہ */
    #cdr-doc .cdr-h{ font-weight:normal; white-space:nowrap; }
    #cdr-doc .cdr-fi{ outline:none; unicode-bidi:plaintext; margin:0 4pt; }
    #cdr-doc .cdr-fi.cdr-has{ font-weight:bold; }
    /* سطر 2 تا 4 — ہر لفظ ایک ہی فونٹ، ایک ہی ناپ، ایک ہی وزن (لیبل اور ڈیٹا یکساں) */
    #cdr-doc .cdr-sarkar, #cdr-doc .cdr-sarkar *, #cdr-doc .cdr-caseline, #cdr-doc .cdr-caseline *,
    #cdr-doc .cdr-banam-row, #cdr-doc .cdr-banam-row *{ font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif !important;
      font-size:14pt !important; font-weight:normal !important; }
    /* خالی خانہ — ہاتھ سے لکھنے کے لیے نقطہ دار لکیر */
    #cdr-doc .cdr-fi:not(.cdr-has){ display:inline-block; min-width:0.85in; border-bottom:1.2px dashed #000; vertical-align:baseline; }
    #cdr-doc .cdr-fi:empty::before{ content:'\\200b'; }
    #cdr-doc .cdr-title-row{ display:flex; align-items:baseline; justify-content:space-between; width:100%; font-size:14pt; line-height:1.8; }
    #cdr-doc .cdr-tt-right{ text-align:right; white-space:nowrap; }
    #cdr-doc .cdr-tt-left{ text-align:left; white-space:nowrap; margin-left:1cm; }
    #cdr-doc .cdr-sarkar{ margin-top:0.12in; font-size:14pt; text-align:right; padding-right:var(--cdr-indent); line-height:1.8; }
    #cdr-doc .cdr-caseline{ margin:1pt 0 0; font-size:14pt; text-align:right; padding-right:var(--cdr-indent); line-height:1.8; }
    #cdr-doc .cdr-banam-row{ position:relative; margin:1pt 0 0; font-size:14pt; padding-right:var(--cdr-indent); min-height:1.6em; line-height:1.8; }
    #cdr-doc .cdr-banam-lbl{ position:absolute; right:0; top:0; font-weight:bold; white-space:nowrap; line-height:1.8; }
    #cdr-doc .cdr-banam-list{ display:block; text-align:right; line-height:1.8; }
    /* ملزم کا انتخاب ▾ — درخواستیں کی طرح دائیں حاشیے میں (چھپائی میں نہیں) */
    #cdr-doc .cdr-acc-pick{ position:absolute; right:-30px; top:4px; width:24px; height:24px; line-height:22px; border-radius:5px;
      background:#0369a1; color:#fff; font-size:13px; font-weight:700; text-align:center; cursor:pointer; overflow:hidden; }
    #cdr-doc .cdr-acc-pick select{ position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:pointer; }
    #cdr-doc .cdr-center{ justify-content:center; }
    #cdr-doc .cdr-l{ white-space:nowrap; flex:0 0 auto; font-weight:bold; }
    #cdr-doc .cdr-l.cdr-n{ font-weight:normal; }
    #cdr-doc .cdr-b{ font-weight:bold; }
    #cdr-doc .cdr-u{ text-decoration:underline; text-underline-offset:4pt; }

    /* خانہ — خالی ہو تو ڈیش لکیر (اصل فارم جیسی)؛ بھرا ہو تو بولڈ */
    #cdr-doc .cdr-f{ display:inline-block; min-width:0.45in; min-height:1.45em; padding:0 3pt; text-align:center;
      border-bottom:1.2px dashed #000; outline:none; unicode-bidi:plaintext; overflow-wrap:anywhere; vertical-align:baseline; }
    #cdr-doc .cdr-f:empty::before, #cdr-doc .cdr-num:empty::before{ content:'\\200b'; }
    #cdr-doc .cdr-f.cdr-has{ font-weight:bold; }
    #cdr-doc .cdr-f:focus{ background:rgba(56,189,248,0.10); }
    #cdr-doc .cdr-count{ flex:0 0 1.6in; }

    #cdr-doc .cdr-subj{ margin-top:calc(12pt + var(--cdr-x,0px)); }
    #cdr-doc .cdr-inner{ padding-top:var(--cdr-x,0px); }
    #cdr-doc .cdr-subj .cdr-l{ font-weight:bold; }
    #cdr-doc .cdr-subj-t{ font-weight:bold; text-decoration:underline; text-underline-offset:5pt; margin-right:1in; }

    #cdr-doc .cdr-body{ text-align:justify; text-align-last:right; line-height:1.95; margin:0 0 calc(3pt + var(--cdr-x,0px)); word-spacing:1pt; }
    #cdr-doc .cdr-body .cdr-f{ text-align:center; }
    #cdr-doc .cdr-numhead{ margin:0 0 2pt; font-weight:bold; }

    /* 10 نمبر — دائیں کالم 1–5، بائیں 6–10 (RTL گرڈ) */
    #cdr-doc .cdr-grid{ display:grid; grid-template-columns:1fr 1fr; grid-template-rows:repeat(5, auto);
      grid-auto-flow:column; column-gap:0.45in; row-gap:9pt; margin:0 0 calc(8pt + var(--cdr-x,0px)); }
    #cdr-doc .cdr-num-row{ display:flex; align-items:baseline; gap:8pt; }
    #cdr-doc .cdr-num-no{ flex:0 0 0.36in; font-family:Calibri,Carlito,Arial,sans-serif; font-weight:bold; font-size:12pt; text-align:right; }
    #cdr-doc .cdr-num{ flex:1 1 0; min-height:1.45em; border-bottom:1.2px solid #000; outline:none; text-align:center;
      font-family:Calibri,Carlito,Arial,sans-serif; font-size:12pt; letter-spacing:0.3pt; direction:ltr; unicode-bidi:isolate; }
    #cdr-doc .cdr-num.cdr-has{ font-weight:bold; }

    #cdr-doc .cdr-sign{ margin-top:2pt; margin-bottom:calc(12pt + var(--cdr-x,0px)); }

    /* SHO / SDPO / SP — دائیں ڈبہ (دستخط + مہر)، بائیں نوٹ کی دو لکیریں */
    #cdr-doc .cdr-appr{ display:flex; align-items:stretch; gap:0.2in; margin:0 0 calc(12pt + var(--cdr-x,0px)); }
    #cdr-doc .cdr-box{ flex:0 0 51%; border:2px solid #000; min-height:0.76in; padding:3pt 6pt 2pt;
      display:flex; flex-direction:column; justify-content:flex-end; align-items:center; text-align:center; }
    #cdr-doc .cdr-box-t{ font-weight:bold; font-size:11.5pt; line-height:1.5; }
    #cdr-doc .cdr-box-s{ font-size:8.5pt; line-height:1.5; }
    #cdr-doc .cdr-notes{ flex:1 1 0; display:flex; flex-direction:column; justify-content:space-between; padding-top:2pt; }
    #cdr-doc .cdr-notes .cdr-line{ margin:0 0 4pt; }

    /* SOP نوٹ + نشان والے خانے · بائیں «دفتری استعمال کے لیے» */
    #cdr-doc .cdr-foot{ display:flex; justify-content:space-between; align-items:flex-start; margin-top:2pt; font-size:10.5pt; }
    /* گرڈ: دائیں متن، بائیں نشان کے خانے — تینوں خانے ایک ہی سیدھ میں (اصل فارم جیسا) */
    #cdr-doc .cdr-sop{ display:grid; grid-template-columns:max-content 0.5in; column-gap:6pt; row-gap:2pt; align-items:center; }
    #cdr-doc .cdr-sop-row{ display:contents; }
    #cdr-doc .cdr-sop-t{ line-height:1.5; }
    #cdr-doc .cdr-chk{ flex:0 0 auto; width:0.5in; height:0.24in; border:2px solid #000; border-radius:5px;
      display:inline-flex; align-items:center; justify-content:center; font-family:Arial,sans-serif; font-size:11pt;
      font-weight:bold; cursor:pointer; user-select:none; line-height:1; }
    #cdr-doc .cdr-office{ font-weight:bold; padding-left:0.3in; white-space:nowrap; }

    @media print{ .cdr-toolbar{ display:none !important; } }
  `;
}

// DD/MM/YYYY ⇄ YYYY-MM-DD (تاریخ چننے والے خانے کے لیے)
function _cdrIso(t) {
  const m = String(t || '').replace(/<[^>]*>/g, '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : '';
}
function _cdrSetDate(k, iso) {
  const el = document.querySelector('#cdr-doc [data-k="' + k + '"]');
  if (!el) return;
  el.textContent = iso ? _cdrFmtDate(iso) : '';
  _cdrOnInput(el);
  _cdrBalance();
}
window._cdrSetDate = _cdrSetDate;

// ── صفحہ متوازن: نیچے بچی ہوئی جگہ فارم کے 8 وقفوں (اوپر سمیت) میں برابر بانٹو —
//    نیچے زیادہ خالی اور اوپر تنگ نظر نہ آئے۔ مارجن (طے شدہ اصول) نہیں بدلتے۔ ──
const CDR_GAP_POINTS = 8;
function _cdrBalance() {
  const doc = document.getElementById('cdr-doc');
  const inner = document.getElementById('cdr-inner');
  const z = document.getElementById('cdr-zoom');
  if (!doc || !inner) return;
  const prev = z ? z.style.zoom : '';
  if (z) z.style.zoom = '1';
  doc.style.setProperty('--cdr-x', '0px');
  const h = inner.getBoundingClientRect().height;
  if (z) z.style.zoom = prev;
  const spare = CDR_AVAIL_H_IN * CDR_PX_PER_IN * 0.96 - h;
  const x = Math.max(0, Math.min(28, Math.floor(spare / CDR_GAP_POINTS)));
  doc.style.setProperty('--cdr-x', x + 'px');
}
window._cdrBalance = _cdrBalance;

// ── سکرین پر کاغذ پورا نظر آئے (موبائل پر چھوٹا) — ناپ نہیں بدلتی، صرف zoom ──
function _cdrFit() {
  const sc = document.getElementById('cdr-scroll');
  const z = document.getElementById('cdr-zoom');
  if (!sc || !z) return;
  const pageW = 8.27 * CDR_PX_PER_IN;
  const avail = sc.clientWidth;
  const k = (avail > 0 && avail < pageW) ? Math.max(0.3, avail / pageW) : 1;
  z.style.zoom = String(k);
}
window._cdrFit = _cdrFit;

function _cdrOnInput(el) {
  _cdrDirty = true;
  if (!el) return;
  const t = (el.innerText || el.textContent || '').trim();
  el.classList.toggle('cdr-has', !!t);
  // تاریخ ہاتھ سے لکھی تو ٹول بار کا تاریخ والا خانہ بھی ساتھ بدلے
  const k = el.dataset && el.dataset.k;
  if (k === 'date_from' || k === 'date_to') {
    const inp = document.querySelector('.cdr-date-in[data-for="' + k + '"]');
    if (inp) inp.value = _cdrIso(t);
  }
}
window._cdrOnInput = _cdrOnInput;

// کتنے نمبر فارورڈ — بھرے ہوئے نمبر خانے گنو (ہاتھ سے لکھا ہو تو وہی رہے)
function _cdrCount() {
  const el = document.getElementById('cdr-count');
  if (!el || el.dataset.manual === '1') return;
  let n = 0;
  document.querySelectorAll('#cdr-doc .cdr-num').forEach(x => { if ((x.innerText || '').trim()) n++; });
  el.textContent = n ? String(n) : '';
  el.classList.toggle('cdr-has', !!n);
}
window._cdrCount = _cdrCount;

function _cdrToggleChk(el) {
  if (!el) return;
  const on = !el.classList.contains('on');
  el.classList.toggle('on', on);
  el.textContent = on ? '✓' : '';
  el.setAttribute('aria-checked', on ? 'true' : 'false');
  _cdrDirty = true;
}
window._cdrToggleChk = _cdrToggleChk;

// بنام — منتخب ملزم کے چار خانے بھرو
function _cdrPickAccused(idx) {
  const i = parseInt(idx, 10);
  if (!Number.isInteger(i) || !_cdrAccused[i]) return;
  const p = _cdrParsePerson(_cdrAccused[i].name);
  const doc = document.getElementById('cdr-doc');
  if (!doc) return;
  doc.dataset.acc = String(i);
  [['b_name', p.name], ['b_father', p.father], ['b_qaum', p.qaum], ['b_address', p.address]].forEach(([k, v]) => {
    const el = doc.querySelector('[data-k="' + k + '"]');
    if (el) { el.textContent = v || ''; _cdrOnInput(el); }
  });
}
window._cdrPickAccused = _cdrPickAccused;

// خالی خانے سسٹم کے ڈیٹا سے (بھرے ہوئے نہیں چھیڑتے)
function _cdrRefill() {
  const doc = document.getElementById('cdr-doc');
  if (!doc) return;
  const def = _cdrDefaults(parseInt(doc.dataset.acc || '0', 10) || 0);
  let n = 0;
  doc.querySelectorAll('[data-k]').forEach(el => {
    const k = el.dataset.k;
    if (k === 'count') return;
    if (!(el.innerText || '').trim() && def[k]) { el.textContent = def[k]; _cdrOnInput(el); n++; }
  });
  const sys = _cdrSystemNumbers();
  const cells = Array.from(doc.querySelectorAll('.cdr-num'));
  const have = cells.map(c => (c.innerText || '').trim()).filter(Boolean);
  sys.filter(x => !have.includes(x)).forEach(x => {
    const empty = cells.find(c => !(c.innerText || '').trim());
    if (empty) { empty.textContent = x; _cdrOnInput(empty); n++; }
  });
  _cdrCount();
  if (typeof showToast === 'function') showToast(n ? (n + ' خانے سسٹم ڈیٹا سے بھرے گئے') : 'کوئی خالی خانہ نہیں جس کا ڈیٹا سسٹم میں ہو', 'info');
}
window._cdrRefill = _cdrRefill;

function _collectCdr() {
  const doc = document.getElementById('cdr-doc');
  const f = {};
  const nums = [];
  if (!doc) return { f, nums, chk: [false, false, false], acc: 0 };
  doc.querySelectorAll('[data-k]').forEach(el => {
    const t = (el.innerText || '').trim();
    f[el.dataset.k] = t ? el.innerHTML : '';
  });
  const cnt = document.getElementById('cdr-count');
  f.count_manual = !!(cnt && cnt.dataset.manual === '1');
  doc.querySelectorAll('.cdr-num').forEach(el => nums.push((el.innerText || '').replace(/\s+/g, ' ').trim()));
  const chk = Array.from(doc.querySelectorAll('.cdr-chk')).map(el => el.classList.contains('on'));
  return { f, nums, chk, acc: parseInt(doc.dataset.acc || '0', 10) || 0 };
}

async function _saveCdr() {
  if (!_cdrICaseId) { if (typeof showToast === 'function') showToast('مقدمہ منتخب نہیں', 'error'); return; }
  const d = _collectCdr();
  const rows = d.nums.map(n => ({ req: n }));
  rows.push({ _form: CDR_FORM_TAG, f: d.f, chk: d.chk, acc: d.acc });
  const rec = { case_id: _cdrICaseId, rows };
  const key = 'dio_cdr_' + _cdrICaseId;
  try {
    const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
    if (oid) rec.officer_id = oid;
    if (_cdrISaved && _cdrISaved.id && String(_cdrISaved.id).indexOf('tmp_') !== 0) {
      const { data, error } = await supabaseClient.from('cdr_imei_requests').update(rec).eq('id', _cdrISaved.id).select().maybeSingle();
      if (error) throw error;
      _cdrISaved = data || { ..._cdrISaved, ...rec };
    } else {
      const { data, error } = await supabaseClient.from('cdr_imei_requests').insert(rec).select().single();
      if (error) throw error;
      _cdrISaved = data;
    }
    try { localStorage.setItem(key, JSON.stringify(_cdrISaved)); } catch (e) { console.warn('cdr cache:', e && e.message); }
    _cdrMarkChipDone();
    try { if (typeof dioRegisterSaved === 'function') dioRegisterSaved('cdr', 'CDR/IMEI درخواست', { case_id: _cdrICaseId }); } catch (e) { console.warn('cdr register:', e && e.message); }
    _cdrDirty = false;
    if (typeof showToast === 'function') showToast('درخواست محفوظ ہو گئی', 'success');
  } catch (e) {
    // آف لائن / سرور خرابی — مقامی طور پر محفوظ (پرانا رویہ)
    try {
      _cdrISaved = { ...(_cdrISaved || {}), ...rec, id: (_cdrISaved && _cdrISaved.id) || ('tmp_' + Date.now()), created_at: new Date().toISOString() };
      localStorage.setItem(key, JSON.stringify(_cdrISaved));
      _cdrDirty = false;
      if (typeof showToast === 'function') showToast('آف لائن محفوظ (انٹرنیٹ آنے پر دوبارہ محفوظ کریں)', 'info');
    } catch { if (typeof showToast === 'function') showToast('' + (e && e.message), 'error'); }
  }
}
window._saveCdr = _saveCdr;

// چِپ سبز — محفوظ ہونے کا نشان (سسٹم کا اصول: صرف ڈیٹا والی chip سبز)
function _cdrMarkChipDone() {
  try {
    if (typeof _misalDocs !== 'undefined' && _misalDocs) {
      _misalDocs['cdr_imei'] = { ...(_misalDocs['cdr_imei'] || {}), document_type: 'cdr_imei', status: 'complete' };
    }
    if (typeof _refreshMisalBar === 'function') _refreshMisalBar();
  } catch (e) { console.warn('cdr chip:', e && e.message); }
  // case_documents میں بھی حالت «مکمل» — دوبارہ کھولنے پر chip سبز رہے
  try {
    supabaseClient.from('case_documents').update({ status: 'complete' })
      .eq('case_id', _cdrICaseId).eq('document_type', 'cdr_imei')
      .then(() => {}, e => console.warn('cdr doc status:', e && e.message));
  } catch (e) { console.warn('cdr doc status:', e && e.message); }
}

function _newCdr() {
  if (_cdrDirty && !confirm('غیر محفوظ تبدیلیاں ضائع ہو جائیں گی۔ نئی درخواست کھولیں؟')) return;
  _cdrISaved = null;
  _cdrDirty = false;
  _renderCdr();
  if (typeof showToast === 'function') showToast('نئی درخواست — سسٹم کا ڈیٹا بھر دیا گیا', 'info');
}
window._newCdr = _newCdr;

// ── چھپائی — A4، چاروں طرف 1 انچ، صرف فارم (ٹول بار نہیں)، ایک صفحہ ──
function _printCdr() {
  const doc = document.getElementById('cdr-doc');
  if (!doc) return;
  _cdrBalance();
  // ایک صفحے میں سمانا: مواد کی اصل اونچائی (سکرین پر وہی ناپ) بمقابلہ جگہ
  const z = document.getElementById('cdr-zoom');
  const prevZoom = z ? z.style.zoom : '';
  if (z) z.style.zoom = '1';
  const inner = document.getElementById('cdr-inner');
  const contentH = inner ? inner.getBoundingClientRect().height : 0;
  if (z) z.style.zoom = prevZoom;
  const availH = CDR_AVAIL_H_IN * CDR_PX_PER_IN;
  // 2% حفاظتی گنجائش (چھاپنے والے کا ناپ ذرا سا مختلف ہو سکتا ہے)
  const fit = contentH > availH * 0.98 ? Math.max(0.75, Math.floor((availH * 0.98 / contentH) * 1000) / 1000) : 1;

  const clone = doc.cloneNode(true);
  clone.querySelectorAll('.no-print, button, select').forEach(el => el.remove());
  clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
  clone.querySelectorAll('[oninput],[onclick],[onkeydown]').forEach(el => {
    el.removeAttribute('oninput'); el.removeAttribute('onclick'); el.removeAttribute('onkeydown');
  });
  const html = `<!DOCTYPE html><html dir="rtl" lang="ur"><head><meta charset="UTF-8"><title> </title>
    ${typeof dioFontHead === 'function' ? dioFontHead() : ''}
    <style>
      @page{ size:A4 portrait; margin:${CDR_MARGIN_CSS}; }
      *{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }
      html,body{ margin:0; padding:0; background:#fff; }
      ${_cdrCSS()}
      #cdr-doc{ width:auto !important; min-height:0 !important; padding:0 !important; margin:0 !important;
        box-shadow:none !important; border-radius:0 !important; ${fit < 1 ? 'zoom:' + fit + ';' : ''} }
      #cdr-doc .cdr-f:focus{ background:none; }
      #cdr-doc .cdr-appr, #cdr-doc .cdr-foot{ break-inside:avoid; }
    </style></head><body>${clone.outerHTML}</body></html>`;
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400); }
}
window._printCdr = _printCdr;
