/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — CDR / IMEI درخواست فارم  (نیا فارم 2026)
   «درخواست برائے فراہمی کال ڈیٹا ریکارڈ» — NEW_CDR_FORM_FOR_IO_2026 کے
   عین مطابق (پرانا جدول والا فارم اس سے بدل دیا گیا)۔

   • کاغذ: A4 · سسٹم کا طے شدہ مارجن (اوپر/نیچے 1cm، دائیں 1in، بائیں 0.4in) · ایک صفحہ
   • تمام فونٹ pt میں · اردو RTL، انگریزی/نمبر LTR (ملی جلی سطر میں بھی)
   • ڈیٹا سسٹم سے: تھانہ/ضلع، مدعی (سرکار بذریعہ — جیسا سسٹم میں لکھا ہے)،
     مقدمہ نمبر/تاریخ/دفعہ، ملزمان (بنام — ▾ سے انتخاب)، موبائل/IMEI نمبر،
     درخواست دہندہ (نام + عہدہ + محکمانہ نمبر، فون)، CDR کی مدت (وقوعہ سے آج تک)
   • کوئی ترمیمی ٹول بار نہیں — صرف سکرین پر ایک پٹی: «فہرست» اور CDR کی تاریخیں
     (چھپائی میں نہیں)۔ ہر خانہ براہِ راست قابلِ ترمیم۔
   • چھپائی: صرف براؤزر کی اپنی چھپائی (Ctrl+P / اوپر والا «پرنٹ» — دونوں ایک ہی)
   • ایک مقدمے میں کئی CDR درخواستیں — ہر ایک الگ ریکارڈ، تاریخ کے ساتھ
     (فہرست میں نئی سب سے اوپر)۔ پرانا ریکارڈ کبھی مٹتا/بدلتا نہیں جب تک خود نہ کھولیں۔
   • ڈیٹابیس: `cdr_imei_requests` — ہر درخواست ایک قطار (schema نہیں بدلا)
     ڈیٹا `rows` میں: 10 نمبر + آخر میں {_form:'cdr2', f, chk, acc, saved_at}
   ═══════════════════════════════════════════════════════════ */

/* global _misalCaseId, currentCaseId, getCase, dioBindEditor,
          dioRegisterSaved, _misalDocs, _refreshMisalBar */

let _cdrICaseId = null;
let _cdrICase = null;
let _cdrList = [];        // اس مقدمے کی تمام CDR درخواستیں
let _cdrISaved = null;    // کھلی ہوئی درخواست (null = نئی)
let _cdrAccused = [];     // ملزمان کے نام (سسٹم سے)
let _cdrDirty = false;

const CDR_FORM_TAG = 'cdr2';
const CDR_NUM_COUNT = 10;
const CDR_PX_PER_IN = 96;
// سسٹم کا طے شدہ اصول (درخواستیں/نقشہ موقع): A4 · اوپر/نیچے 1cm · دائیں 1in · بائیں 0.4in
const CDR_AVAIL_H_IN = 11.69 - 2 / 2.54;

async function openCdrImei(caseId) {
  _cdrICaseId = caseId || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
            || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  const area = _cdrArea();
  if (area && window.DIO && DIO.states) area.innerHTML = DIO.states.loading('CDR/IMEI درخواستیں لوڈ ہو رہی ہیں');
  _cdrICase = null;
  if (typeof getCase === 'function' && _cdrICaseId) {
    try { _cdrICase = await getCase(_cdrICaseId); } catch (e) { _cdrICase = null; console.warn('cdr getCase:', e && e.message); }
  }
  await Promise.all([_cdrLoadList(), _cdrLoadAccused()]);
  _cdrDirty = false;
  _cdrISaved = null;
  // کوئی درخواست نہیں → سیدھا نیا فارم؛ ورنہ فہرست
  if (_cdrList.length) _cdrRenderList(); else _renderCdr();
  if (!window._cdrPrintBound) {
    window._cdrPrintBound = true;
    window.addEventListener('beforeprint', () => { if (document.getElementById('cdr-doc')) _cdrBalance(); });
  }
}
window.openCdrImei = openCdrImei;

function _cdrArea() {
  return document.getElementById('workspace-editor-area')
      || document.getElementById('workspace-tab-content')
      || document.getElementById('page-content');
}

// ── فہرست: سرور + مقامی (آف لائن محفوظ، ابھی سرور پر نہیں گئی) ──
function _cdrCacheKey() { return 'dio_cdrlist_' + _cdrICaseId; }
function _cdrLocal() { try { return JSON.parse(localStorage.getItem(_cdrCacheKey()) || '[]') || []; } catch { return []; } }
function _cdrStoreLocal() { try { localStorage.setItem(_cdrCacheKey(), JSON.stringify(_cdrList)); } catch (e) { console.warn('cdr cache:', e && e.message); } }

async function _cdrLoadList() {
  const local = _cdrLocal();
  // پرانے نظام کا ایک ہی ریکارڈ والا cache (dio_cdr_<id>) — ضائع نہ ہو
  try {
    const old = JSON.parse(localStorage.getItem('dio_cdr_' + _cdrICaseId) || 'null');
    if (old && old.id && !local.some(x => String(x.id) === String(old.id))) {
      local.push(String(old.id).indexOf('tmp_') === 0 ? { ...old, _pending: true } : old);
    }
  } catch { /* خراب cache — نظرانداز */ }
  let server = null;
  if (navigator.onLine) {
    try {
      const { data, error } = await supabaseClient.from('cdr_imei_requests').select('*')
        .eq('case_id', _cdrICaseId).order('created_at', { ascending: false });
      if (error) throw error;
      server = data || [];
    } catch (e) { console.warn('cdr list:', e && e.message); }
  }
  let list = server ? server.slice() : local.filter(x => !x._pending);
  // مقامی زیرِ التوا ریکارڈ ہمیشہ غالب (ورنہ آف لائن کام ضائع)
  local.filter(x => x._pending).forEach(p => {
    const i = list.findIndex(x => String(x.id) === String(p.id));
    if (i >= 0) list[i] = p; else list.push(p);
  });
  list.sort((a, b) => _cdrTimeCreated(b).localeCompare(_cdrTimeCreated(a)));
  _cdrList = list;
  _cdrStoreLocal();
}
function _cdrTimeCreated(r) { return String(r.created_at || ''); }

// ملزمان — case_accused (FIR والے پہلے) · نہ ہوں تو مقدمے کا اپنا «ملزم» خانہ
async function _cdrLoadAccused() {
  let rows = [];
  if (_cdrICaseId) {
    try {
      const { data, error } = await supabaseClient.from('case_accused').select('*')
        .eq('case_id', _cdrICaseId).order('created_at', { ascending: true });
      if (error) throw error;
      rows = data || [];
    } catch {
      try { rows = JSON.parse(localStorage.getItem('dio_accused_' + _cdrICaseId) || '[]') || []; }
      catch { rows = []; }
    }
  }
  const fir = rows.filter(a => !a.accused_type || a.accused_type === 'fir');
  const use = fir.length ? fir : rows;
  let names = use.map(a => String(a.name || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
  if (!names.length) {
    const c = _cdrICase || {};
    const own = String(c.accused_name || '').replace(/\s+/g, ' ').trim();
    if (own) names = [own];
  }
  _cdrAccused = names;
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

// محفوظ ہونے کا وقت — DD/MM/YYYY hh:mm (پاکستان وقت)
function _cdrFmtStamp(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return _cdrFmtDate(iso);
  try {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true }).formatToParts(d);
    const g = t => (p.find(x => x.type === t) || {}).value || '';
    return `${g('day')}/${g('month')}/${g('year')}\u2003${g('hour')}:${g('minute')} ${g('dayPeriod').toLowerCase()}`;
  } catch { return _cdrFmtDate(iso); }
}

// بنام — ملزمان کے نام (ایک ہو تو سادہ، زیادہ ہوں تو نمبر وار)
function _cdrBanamHtml(names) {
  const n = (names || []).filter(Boolean);
  if (!n.length) return '';
  if (n.length === 1) return esc(n[0]);
  return n.map((x, i) => `<div class="cdr-acc-line"><bdi>${i + 1}۔</bdi> ${esc(x)}</div>`).join('');
}

// پہلے سے طے شدہ ڈیٹا (سسٹم سے) — نیا فارم یا خالی خانہ
function _cdrDefaults() {
  const c = _cdrICase || {};
  const of = _cdrOfficer();
  return {
    thana: of.station || c.case_station || '',
    zila: of.district || c.case_district || '',
    // سرکار بذریعہ — مدعی بالکل ویسا جیسا سسٹم میں درج ہے
    s_full: String(c.complainant || '').replace(/\s+/g, ' ').trim(),
    fir: c.fir_number || '', fir_date: _cdrFmtDate(c.fir_date),
    // بجرم = صرف دفعہ (مثلاً 379 ت پ) — جرم کی تفصیل نہیں
    jurm: String(c.section_of_law || '').trim(),
    fir_thana: c.case_station || of.station || '',
    // CDR کی مدت — پہلے سے: تاریخِ وقوعہ سے آج تک (وقوعہ درج نہ ہو تو FIR کی تاریخ)
    date_from: _cdrFmtDate(c.occurrence_date) || _cdrFmtDate(c.fir_date), date_to: _cdrToday(),
    applicant: of.line, applicant_phone: of.phone,
    io_sign: '', dispatch_no: '', dispatch_date: '',
    sho_note1: '', sho_note2: '', sdpo_note1: '', sdpo_note2: '', sp_note1: '', sp_note2: '',
  };
}

function _cdrMeta(r) { return (r && Array.isArray(r.rows)) ? r.rows.find(x => x && x._form === CDR_FORM_TAG) : null; }

// محفوظ ریکارڈ → {f, nums, chk, acc}
function _cdrFromSaved(s) {
  if (!s || !Array.isArray(s.rows)) return null;
  const meta = _cdrMeta(s);
  const nums = s.rows.filter(r => r && !r._form).map(r => String(r.req || '').trim());
  if (meta) {
    const f = { ...(meta.f || {}) };
    // آج کے ابتدائی نسخے (نام/ولد/قوم/ساکن الگ خانے) → ایک سطر
    const join = (a, b, c, d) => [a, b && ('ولد ' + b), c && ('قوم ' + c), d && ('سکنہ ' + d)]
      .map(x => String(x || '').replace(/<[^>]*>/g, '').trim()).filter(Boolean).join(' ');
    if (f.s_full === undefined && (f.s_name || f.s_father)) f.s_full = join(f.s_name, f.s_father, f.s_qaum, f.s_address);
    if (f.banam === undefined && (f.b_name || f.b_father)) f.banam = esc(join(f.b_name, f.b_father, f.b_qaum, f.b_address));
    while (nums.length < CDR_NUM_COUNT) nums.push('');
    return { f, nums: nums.slice(0, CDR_NUM_COUNT), chk: meta.chk || [false, false, false], acc: meta.acc };
  }
  // پرانا (جدول والا) فارم — صرف نمبر منتقل؛ باقی سسٹم سے
  const old = nums.filter(Boolean).slice(0, CDR_NUM_COUNT);
  while (old.length < CDR_NUM_COUNT) old.push('');
  return { f: {}, nums: old, chk: [false, false, false], acc: 'all', legacy: true };
}

// ══════════════ فہرست ══════════════
function _cdrRenderList() {
  const area = _cdrArea();
  if (!area) return;
  const total = _cdrList.length;
  const strip = s => String(s || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  const rows = _cdrList.map((r, i) => {
    const meta = _cdrMeta(r);
    const f = (meta && meta.f) || {};
    const nums = (r.rows || []).filter(x => x && !x._form && String(x.req || '').trim()).length;
    const range = (strip(f.date_from) || strip(f.date_to)) ? `${strip(f.date_from) || '—'} سے ${strip(f.date_to) || '—'} تک` : '';
    const no = total - i;   // پہلی بنی = 1
    return `
    <div class="cdr-li" onclick="_cdrOpen('${esc(String(r.id))}')">
      <div class="cdr-li-no">${no}</div>
      <div class="cdr-li-body">
        <div class="cdr-li-t">CDR درخواست نمبر ${no}${r._pending ? ' <span class="cdr-li-pend">سرور پر نہیں گئی — کھول کر محفوظ کریں</span>' : ''}</div>
        <div class="cdr-li-s">بنائی: <bdi dir="ltr">${esc(_cdrFmtStamp(r.created_at) || '—')}</bdi>
          ${meta && meta.saved_at && _cdrFmtStamp(meta.saved_at) !== _cdrFmtStamp(r.created_at) ? ` · آخری محفوظ: <bdi dir="ltr">${esc(_cdrFmtStamp(meta.saved_at))}</bdi>` : ''}</div>
        <div class="cdr-li-s">نمبرز: <bdi dir="ltr">${nums}</bdi>${range ? ' · مدت: <bdi>' + esc(range) + '</bdi>' : ''}</div>
      </div>
      <button type="button" class="btn btn-primary btn-sm" onclick="event.stopPropagation();_cdrOpen('${esc(String(r.id))}')">کھولیں</button>
    </div>`;
  }).join('');

  area.innerHTML = `
  <div class="cdr-listwrap">
    <!-- عنوان درمیان میں · «نیا» بٹن دائیں (SYSTEM RULE: add-new button ہمیشہ دائیں) -->
    <div class="cdr-list-head">
      <button type="button" class="btn btn-primary btn-sm dio-add-btn" onclick="_newCdr()">+ نئی CDR درخواست</button>
      <div class="cdr-list-title">CDR/IMEI درخواستیں — فہرست (${total})</div>
      <span class="btn btn-primary btn-sm" style="visibility:hidden;pointer-events:none;">+ نئی CDR درخواست</span>
    </div>
    ${rows}
  </div>
  <style>
    .cdr-listwrap{ padding:16px; direction:rtl; height:100%; overflow-y:auto; font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; }
    .cdr-list-head{ display:flex; align-items:center; gap:10px; border-bottom:2px solid var(--accent); padding-bottom:8px; margin-bottom:14px; }
    .cdr-list-title{ flex:1; text-align:center; font-size:14pt; font-weight:800; color:var(--accent); }
    .cdr-li{ display:flex; align-items:center; gap:12px; padding:10px 14px; background:var(--bg-card); border:1px solid var(--border);
      border-radius:10px; margin-bottom:8px; cursor:pointer; }
    .cdr-li:hover{ border-color:var(--accent); }
    .cdr-li-no{ flex:0 0 34px; height:34px; border-radius:50%; background:var(--accent); color:#fff; font-weight:800;
      display:flex; align-items:center; justify-content:center; font-family:Arial,sans-serif; font-size:11pt; }
    .cdr-li-body{ flex:1; min-width:0; }
    .cdr-li-t{ font-weight:700; font-size:12pt; }
    .cdr-li-s{ font-size:10.5pt; color:var(--text-muted); }
    .cdr-li-s bdi{ font-family:Arial,sans-serif; font-size:9.5pt; margin:0 5px; white-space:pre; }
    .cdr-li-pend{ font-size:9.5pt; color:#b45309; font-weight:700; margin-right:6px; }
  </style>`;
}
window._cdrRenderList = _cdrRenderList;

function _cdrOpen(id) {
  const r = _cdrList.find(x => String(x.id) === String(id));
  if (!r) return;
  _cdrISaved = r;
  _cdrDirty = false;
  _renderCdr();
}
window._cdrOpen = _cdrOpen;

function _cdrBackToList() {
  if (_cdrDirty && !confirm('غیر محفوظ تبدیلیاں ضائع ہو جائیں گی۔ فہرست پر جائیں؟')) return;
  _cdrDirty = false;
  _cdrRenderList();
}
window._cdrBackToList = _cdrBackToList;

function _newCdr() {
  if (_cdrDirty && !confirm('غیر محفوظ تبدیلیاں ضائع ہو جائیں گی۔ نئی درخواست کھولیں؟')) return;
  _cdrISaved = null;
  _cdrDirty = false;
  _renderCdr();
}
window._newCdr = _newCdr;

// ══════════════ فارم ══════════════
function _renderCdr() {
  const area = _cdrArea();
  if (!area) return;
  const saved = _cdrFromSaved(_cdrISaved);
  const def = _cdrDefaults();
  const sf = (saved && saved.f) || {};
  const _san = (typeof sanitizeHtml === 'function') ? sanitizeHtml : (x => esc(x));
  // محفوظ قیمت (HTML) — ورنہ سسٹم کی قیمت (escape)
  const has = k => sf[k] !== undefined && sf[k] !== null && String(sf[k]).replace(/<[^>]*>|&nbsp;/g, '').trim() !== '';
  const val = k => has(k) ? _san(sf[k]) : esc(def[k] || '');
  let nums = saved ? saved.nums.slice() : [];
  if (!saved || nums.every(n => !n)) {
    const sys = _cdrSystemNumbers();
    nums = Array.from({ length: CDR_NUM_COUNT }, (_, i) => sys[i] || '');
  }
  const chk = (saved && saved.chk) || [false, false, false];
  // بنام — محفوظ متن؛ ورنہ سسٹم کے تمام ملزمان
  const acc = (saved && saved.acc !== undefined && saved.acc !== null) ? saved.acc : 'all';
  const banam = has('banam') ? _san(sf.banam) : _cdrBanamHtml(_cdrAccused);
  const total = _cdrList.length;
  const idx = _cdrISaved ? _cdrList.findIndex(x => String(x.id) === String(_cdrISaved.id)) : -1;
  const title = idx >= 0 ? `CDR درخواست نمبر ${total - idx}` : 'نئی CDR درخواست';

  // خانہ (field) — نیچے کے حصے کے لیے: خالی ہو تو ڈیش لکیر (ہاتھ سے لکھنے کو)، بھرا ہو تو بولڈ
  const F = (k, grow, extra) => `<span class="cdr-f${val(k) ? ' cdr-has' : ''}" contenteditable="true" data-k="${k}"` +
    ` style="flex:${grow} 1 0;${extra || ''}" oninput="_cdrOnInput(this)">${val(k)}</span>`;
  const L = t => `<span class="cdr-l">${t}</span>`;
  // پہلی چار سطریں: لیبل + بہتا ہوا خانہ — کوئی لکیر نہیں
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

  const approvalBlock = (ttl, noteLbl, k1, k2) => `
    <div class="cdr-appr">
      <div class="cdr-box">
        <div class="cdr-box-t">${ttl}</div>
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
  const accOpts = `<option value="all" ${acc === 'all' ? 'selected' : ''}>تمام ملزمان</option>` +
    _cdrAccused.map((a, i) => `<option value="${i}" ${acc === i ? 'selected' : ''}>${esc(a)}</option>`).join('');

  area.innerHTML = `
  <div class="cdr-wrap" style="display:flex;flex-direction:column;height:100%;direction:rtl;">
    <div class="cdr-scroll" id="cdr-scroll">
      <!-- سکرین کی پٹی (چھپائی میں نہیں): فہرست · CDR کی مدت -->
      <div class="cdr-strip no-print">
        <button type="button" class="btn btn-secondary btn-sm" onclick="_cdrBackToList()" title="اس مقدمے کی تمام CDR درخواستیں">← فہرست</button>
        <span class="cdr-strip-t">${esc(title)}</span>
        <span class="cdr-tb-lbl">CDR مورخہ
          <span class="cdr-cal" title="کس تاریخ سے — تاریخ چنیں">📅<input type="date" class="cdr-date-in" data-for="date_from" value="${_cdrIso(val('date_from'))}" onclick="try{this.showPicker()}catch(_){ /* picker na ho to koi baat nahi */ }" onchange="_cdrSetDate('date_from', this.value)" aria-label="CDR کس تاریخ سے"></span>
          تک
          <span class="cdr-cal" title="کس تاریخ تک — تاریخ چنیں">📅<input type="date" class="cdr-date-in" data-for="date_to" value="${_cdrIso(val('date_to'))}" onclick="try{this.showPicker()}catch(_){ /* picker na ho to koi baat nahi */ }" onchange="_cdrSetDate('date_to', this.value)" aria-label="CDR کس تاریخ تک"></span>
        </span>
        <button type="button" class="btn btn-primary btn-sm dio-modbtn" onclick="_saveCdr()">محفوظ کریں</button>
      </div>
      <div class="cdr-zoom" id="cdr-zoom">
      <div id="cdr-doc" class="cdr-page" data-acc="${esc(String(acc))}"><div class="cdr-inner" id="cdr-inner">

        <!-- پہلی چار سطریں — درخواستیں (darkhwastain) کی ترتیب -->
        <div class="cdr-title-row">
          <span class="cdr-tt-right">${H('تھانہ:')} ${FI('thana')}</span>
          <span class="cdr-tt-left">${H('ضلع:')} ${FI('zila')}</span>
        </div>

        <div class="cdr-sarkar">${H('سرکار بذریعہ:۔')} ${FI('s_full')}</div>

        <div class="cdr-caseline">${H('مقدمہ نمبر')} ${FI('fir', 'unicode-bidi:isolate;')} ${H('مورخہ')} ${FI('fir_date', 'unicode-bidi:isolate;')} ${H('بجرم')} ${FI('jurm')} ${H('تھانہ')} ${FI('fir_thana')}</div>

        <div class="cdr-banam-row">
          ${_cdrAccused.length ? `<span class="cdr-acc-pick no-print" title="ملزم منتخب کریں">▾<select onchange="_cdrPickAccused(this.value)" aria-label="ملزم منتخب کریں">${accOpts}</select></span>` : ''}
          <span class="cdr-banam-lbl">بنام:۔</span>
          <div class="cdr-banam-list cdr-fi${banam ? ' cdr-has' : ''}" contenteditable="true" data-k="banam" oninput="_cdrOnInput(this)">${banam}</div>
        </div>

        <div class="cdr-line cdr-subj">${L('عنوان:')}<span class="cdr-subj-t">درخواست برائے فراہمی کال ڈیٹا ریکارڈ</span></div>

        <div class="cdr-body">
          <b>جناب عالی!</b>&nbsp; گزارش ہے کہ مقدمہ عنوان بالا کی تفتیش کے لیے مندرجہ ذیل موبائل نمبروں/${EN('IMEI')} نمبروں کی ${EN('CDR')}<br>
          مورخہ ${F('date_from', 0, '')} سے ${F('date_to', 0, '')}
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
    /* سکرین کی پٹی — فہرست اور CDR کی تاریخیں (چھپائی میں نہیں) */
    .cdr-strip{ position:sticky; top:0; z-index:20; display:flex; align-items:center; gap:10px; flex-wrap:nowrap;
      overflow-x:auto; scrollbar-width:none; padding:6px 10px; direction:rtl; background:var(--bg-secondary,#f3f6f9);
      border-bottom:1px solid var(--border,#ddd); font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; }
    .cdr-strip::-webkit-scrollbar{ display:none; }
    .cdr-strip > *{ flex:0 0 auto; white-space:nowrap; }
    .cdr-strip-t{ font-weight:700; font-size:11pt; color:var(--accent,#0369a1); }
    .cdr-tb-lbl{ display:inline-flex; align-items:center; gap:6px; white-space:nowrap; font-size:11pt; color:var(--text-primary,#111); }
    .cdr-cal{ position:relative; display:inline-flex; align-items:center; justify-content:center; overflow:hidden; cursor:pointer;
      width:34px; height:30px; border:1px solid var(--border,#ccc); border-radius:6px; background:var(--bg-card,#fff); font-size:15px; }
    .cdr-cal input{ position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:pointer; border:0; padding:0; }
    /* کاغذ کے گرد کوئی خالی جگہ نہیں — A4 سیدھا اوپر سے شروع */
    .cdr-scroll{ flex:1; min-height:0; overflow:auto; padding:0; background:var(--bg-tertiary,#e9eef3); }
    .cdr-zoom{ width:8.27in; margin:0 auto; }

    #cdr-doc{ width:8.27in; min-height:11.69in; box-sizing:border-box; padding:1cm 1in 1cm 0.4in; margin:0 auto;
      background:#fff; color:#000; direction:rtl; text-align:right;
      font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; font-size:12pt; line-height:1.6;
      box-shadow:0 0 0 1px rgba(0,0,0,0.08); border-radius:0; }
    #cdr-doc *{ box-sizing:border-box; }
    #cdr-doc .cdr-en{ font-family:'Times New Roman',Times,'Liberation Serif',serif; unicode-bidi:isolate; }

    #cdr-doc .cdr-line{ display:flex; align-items:baseline; gap:0 5pt; margin:0 0 9pt; flex-wrap:nowrap; }
    /* ── پہلی چار سطریں — درخواستیں (#dk-doc) کے عین اصول، 14pt ── */
    #cdr-doc{ --cdr-indent:0.9in; }
    #cdr-doc .cdr-h{ font-weight:normal; white-space:nowrap; }
    #cdr-doc .cdr-fi{ outline:none; unicode-bidi:plaintext; margin:0 4pt; }
    #cdr-doc .cdr-fi.cdr-has{ font-weight:bold; }
    /* سطر 2 تا 4 — ہر لفظ ایک ہی فونٹ، ایک ہی ناپ، ایک ہی وزن */
    #cdr-doc .cdr-sarkar, #cdr-doc .cdr-sarkar *, #cdr-doc .cdr-caseline, #cdr-doc .cdr-caseline *,
    #cdr-doc .cdr-banam-row, #cdr-doc .cdr-banam-row *{ font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif !important;
      font-size:14pt !important; font-weight:normal !important; }
    /* خالی خانہ — کوئی نقطہ دار لکیر نہیں؛ صرف سکرین پر ہلکا رنگ تاکہ نظر آئے کہاں لکھنا ہے */
    #cdr-doc .cdr-fi:empty{ display:inline-block; min-width:0.8in; vertical-align:baseline; }
    #cdr-doc .cdr-fi:empty::before{ content:'\\200b'; }
    @media screen{ #cdr-doc .cdr-fi:empty{ background:rgba(56,189,248,0.13); border-radius:3px; } }
    #cdr-doc .cdr-fi:focus{ background:rgba(56,189,248,0.10); border-radius:3px; }
    #cdr-doc .cdr-title-row{ display:flex; align-items:baseline; justify-content:space-between; width:100%; font-size:14pt; line-height:1.8; }
    #cdr-doc .cdr-tt-right{ text-align:right; white-space:nowrap; }
    #cdr-doc .cdr-tt-left{ text-align:left; white-space:nowrap; margin-left:1cm; }
    #cdr-doc .cdr-sarkar{ margin-top:0.12in; font-size:14pt; text-align:right; padding-right:var(--cdr-indent); line-height:1.8; }
    #cdr-doc .cdr-caseline{ margin:1pt 0 0; font-size:14pt; text-align:right; padding-right:var(--cdr-indent); line-height:1.8; }
    #cdr-doc .cdr-banam-row{ position:relative; margin:1pt 0 0; font-size:14pt; padding-right:var(--cdr-indent); min-height:1.6em; line-height:1.8; }
    #cdr-doc .cdr-banam-lbl{ position:absolute; right:0; top:0; white-space:nowrap; line-height:1.8; }
    #cdr-doc .cdr-banam-list{ display:block; margin:0; text-align:right; line-height:1.8; min-width:2in; }
    #cdr-doc .cdr-acc-line{ margin:0; }
    /* ملزم کا انتخاب ▾ — درخواستیں کی طرح دائیں حاشیے میں (چھپائی میں نہیں) */
    #cdr-doc .cdr-acc-pick{ position:absolute; right:-30px; top:4px; width:24px; height:24px; line-height:22px; border-radius:5px;
      background:#0369a1; color:#fff; font-size:13px !important; font-weight:700; text-align:center; cursor:pointer; overflow:hidden; }
    #cdr-doc .cdr-acc-pick select{ position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:pointer; }
    #cdr-doc .cdr-center{ justify-content:center; }
    #cdr-doc .cdr-l{ white-space:nowrap; flex:0 0 auto; font-weight:bold; }
    #cdr-doc .cdr-l.cdr-n{ font-weight:normal; }
    #cdr-doc .cdr-b{ font-weight:bold; }
    #cdr-doc .cdr-u{ text-decoration:underline; text-underline-offset:4pt; }

    /* نیچے کے حصے کے خانے — خالی ہو تو ڈیش لکیر (اصل فارم جیسی، ہاتھ سے لکھنے کو)؛ بھرا ہو تو بولڈ */
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

    /* سطر 6 اور 7 — دونوں مکمل justify */
    #cdr-doc .cdr-body{ text-align:justify; text-align-last:justify; line-height:1.95; margin:0 0 calc(3pt + var(--cdr-x,0px)); word-spacing:1pt; }
    /* تاریخ کے خانے — نقطہ دار لکیر نہیں؛ دونوں تاریخوں اور «سے» کے درمیان فاصلہ */
    #cdr-doc .cdr-body .cdr-f{ display:inline; min-width:0; min-height:0; padding:0; border-bottom:none; margin:0 6pt; text-align:center; }
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
    #cdr-doc .cdr-sop{ display:grid; grid-template-columns:max-content 0.5in; column-gap:6pt; row-gap:2pt; align-items:center; }
    #cdr-doc .cdr-sop-row{ display:contents; }
    #cdr-doc .cdr-sop-t{ line-height:1.5; }
    #cdr-doc .cdr-chk{ flex:0 0 auto; width:0.5in; height:0.24in; border:2px solid #000; border-radius:5px;
      display:inline-flex; align-items:center; justify-content:center; font-family:Arial,sans-serif; font-size:11pt;
      font-weight:bold; cursor:pointer; user-select:none; line-height:1; }
    #cdr-doc .cdr-office{ font-weight:bold; padding-left:0.3in; white-space:nowrap; }

    /* ── چھپائی (Ctrl+P / اوپر والا «پرنٹ»): کاغذ = سکرین · مارجن کاغذ کے اندر (padding) ── */
    @page{ size:A4 portrait; margin:0; }
    @media print{
      html, body{ background:#fff !important; }
      .cdr-strip, .cdr-acc-pick, .no-print{ display:none !important; }
      .cdr-wrap{ display:block !important; height:auto !important; }
      .cdr-scroll{ overflow:visible !important; padding:0 !important; background:#fff !important; height:auto !important; }
      .cdr-zoom{ zoom:1 !important; width:auto !important; margin:0 !important; }
      #cdr-doc{ box-shadow:none !important; margin:0 !important; min-height:0 !important; zoom:var(--cdr-pz,1); }
      #cdr-doc .cdr-fi:empty, #cdr-doc .cdr-fi:focus, #cdr-doc .cdr-f:focus{ background:none !important; }
    }
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

// ── صفحہ متوازن: نیچے بچی ہوئی جگہ فارم کے 8 وقفوں (اوپر سمیت) میں برابر بانٹو؛
//    مواد زیادہ ہو تو چھپائی خود چھوٹی (--cdr-pz) — ہمیشہ ایک صفحہ ──
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
  const availH = CDR_AVAIL_H_IN * CDR_PX_PER_IN;
  const spare = availH * 0.96 - h;
  const x = Math.max(0, Math.min(28, Math.floor(spare / CDR_GAP_POINTS)));
  doc.style.setProperty('--cdr-x', x + 'px');
  const pz = h > availH * 0.98 ? Math.max(0.75, Math.floor((availH * 0.98 / h) * 1000) / 1000) : 1;
  doc.style.setProperty('--cdr-pz', String(pz));
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
  // تاریخ ہاتھ سے لکھی تو پٹی کا تاریخ والا خانہ بھی ساتھ بدلے
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

// بنام — «تمام ملزمان» یا ایک ملزم
function _cdrPickAccused(v) {
  const doc = document.getElementById('cdr-doc');
  const el = doc && doc.querySelector('[data-k="banam"]');
  if (!el) return;
  const i = parseInt(v, 10);
  const names = (v === 'all') ? _cdrAccused : (Number.isInteger(i) && _cdrAccused[i] ? [_cdrAccused[i]] : []);
  doc.dataset.acc = (v === 'all') ? 'all' : String(i);
  el.innerHTML = _cdrBanamHtml(names);
  _cdrOnInput(el);
  _cdrBalance();
}
window._cdrPickAccused = _cdrPickAccused;

function _collectCdr() {
  const doc = document.getElementById('cdr-doc');
  const f = {};
  const nums = [];
  if (!doc) return { f, nums, chk: [false, false, false], acc: 'all' };
  doc.querySelectorAll('[data-k]').forEach(el => {
    const t = (el.innerText || '').trim();
    f[el.dataset.k] = t ? el.innerHTML : '';
  });
  const cnt = document.getElementById('cdr-count');
  f.count_manual = !!(cnt && cnt.dataset.manual === '1');
  doc.querySelectorAll('.cdr-num').forEach(el => nums.push((el.innerText || '').replace(/\s+/g, ' ').trim()));
  const chk = Array.from(doc.querySelectorAll('.cdr-chk')).map(el => el.classList.contains('on'));
  const a = doc.dataset.acc;
  return { f, nums, chk, acc: (a === 'all' || a === undefined) ? 'all' : (parseInt(a, 10) || 0) };
}

function _cdrPutInList(rec) {
  const i = _cdrList.findIndex(x => String(x.id) === String(rec.id));
  if (i >= 0) _cdrList[i] = rec; else _cdrList.unshift(rec);
  _cdrStoreLocal();
}

async function _saveCdr() {
  if (!_cdrICaseId) { if (typeof showToast === 'function') showToast('مقدمہ منتخب نہیں', 'error'); return; }
  if (!document.getElementById('cdr-doc')) { if (typeof showToast === 'function') showToast('پہلے کوئی CDR درخواست کھولیں', 'info'); return; }
  const d = _collectCdr();
  const now = new Date().toISOString();
  const rows = d.nums.map(n => ({ req: n }));
  rows.push({ _form: CDR_FORM_TAG, f: d.f, chk: d.chk, acc: d.acc, saved_at: now });
  const rec = { case_id: _cdrICaseId, rows };
  const cur = _cdrISaved;
  const isTmp = !cur || !cur.id || String(cur.id).indexOf('tmp_') === 0;
  try {
    const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
    if (oid) rec.officer_id = oid;
    let saved;
    if (!isTmp) {
      const { data, error } = await supabaseClient.from('cdr_imei_requests').update(rec).eq('id', cur.id).select().maybeSingle();
      if (error) throw error;
      saved = data || { ...cur, ...rec };
    } else {
      const { data, error } = await supabaseClient.from('cdr_imei_requests').insert(rec).select().single();
      if (error) throw error;
      saved = data;
      // آف لائن والا عارضی ریکارڈ فہرست سے ہٹاؤ (اب سرور پر ہے)
      if (cur && cur.id) _cdrList = _cdrList.filter(x => String(x.id) !== String(cur.id));
    }
    delete saved._pending;
    _cdrISaved = saved;
    _cdrPutInList(saved);
    _cdrMarkChipDone();
    try { if (typeof dioRegisterSaved === 'function') dioRegisterSaved('cdr', 'CDR/IMEI درخواست', { case_id: _cdrICaseId, cdr_id: saved.id }); } catch (e) { console.warn('cdr register:', e && e.message); }
    _cdrDirty = false;
    _renderCdrTitle();
    if (typeof showToast === 'function') showToast('درخواست محفوظ ہو گئی', 'success');
  } catch (e) {
    // آف لائن / سرور خرابی — مقامی طور پر محفوظ؛ فہرست میں «سرور پر نہیں گئی»
    try {
      const local = { ...(cur || {}), ...rec, id: (cur && cur.id) || ('tmp_' + Date.now()),
        created_at: (cur && cur.created_at) || now, _pending: true };
      _cdrISaved = local;
      _cdrPutInList(local);
      _cdrDirty = false;
      _renderCdrTitle();
      if (typeof showToast === 'function') showToast('آف لائن محفوظ (انٹرنیٹ آنے پر دوبارہ محفوظ کریں)', 'info');
    } catch { if (typeof showToast === 'function') showToast('' + (e && e.message), 'error'); }
  }
}
window._saveCdr = _saveCdr;

// پٹی کا عنوان (درخواست نمبر) — محفوظ ہونے کے بعد تازہ
function _renderCdrTitle() {
  const t = document.querySelector('.cdr-strip-t');
  if (!t || !_cdrISaved) return;
  const i = _cdrList.findIndex(x => String(x.id) === String(_cdrISaved.id));
  if (i >= 0) t.textContent = 'CDR درخواست نمبر ' + (_cdrList.length - i);
}

// چِپ سبز — محفوظ ہونے کا نشان (سسٹم کا اصول: صرف ڈیٹا والی chip سبز)
function _cdrMarkChipDone() {
  try {
    if (typeof _misalDocs !== 'undefined' && _misalDocs) {
      _misalDocs['cdr_imei'] = { ...(_misalDocs['cdr_imei'] || {}), document_type: 'cdr_imei', status: 'complete' };
    }
    if (typeof _refreshMisalBar === 'function') _refreshMisalBar();
  } catch (e) { console.warn('cdr chip:', e && e.message); }
  try {
    supabaseClient.from('case_documents').update({ status: 'complete' })
      .eq('case_id', _cdrICaseId).eq('document_type', 'cdr_imei')
      .then(() => {}, e => console.warn('cdr doc status:', e && e.message));
  } catch (e) { console.warn('cdr doc status:', e && e.message); }
}

// ── چھپائی — صرف براؤزر کی اپنی چھپائی (بالکل Ctrl+P جیسی)۔ پرانا iframe
//    والا طریقہ ہٹا دیا گیا (اس میں صفحہ کھسک کر کٹ جاتا تھا)۔ ──
function _printCdr() {
  if (!document.getElementById('cdr-doc')) { if (typeof showToast === 'function') showToast('پہلے کوئی CDR درخواست کھولیں', 'info'); return; }
  if (window.DIO && DIO.sub && !DIO.sub.guard('پرنٹ')) return;
  _cdrBalance();
  window.print();
}
window._printCdr = _printCdr;
