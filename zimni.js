// ═══ فائل کا نمبر — تصدیق کے لیے کہ نئی فائل چل رہی ہے یا پرانی cached ═══
// کنسول میں لکھیں:  ZIMNI_VER    →  اگر نیچے والا نمبر نظر آئے تو نئی فائل ہے
const ZIMNI_VER = 'zimni v35 (v552) — offline-first save + autosave + sync, own print path, title = ذیلی ضمنی';
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
  // v552: اس مقدمے کی جو ضمنیاں ابھی صرف آلے پر ہیں — سرور پر بھیجو
  try { if (navigator.onLine && _zimniList.some(_zimniIsPending)) setTimeout(() => { _zimniSyncPending([_zimniCaseId]); }, 300); } catch (_) { /* baad mein */ }
}

// دوبارہ کوشش — DB ٹوٹنے کے بعد error کارڈ کا "🔄 دوبارہ کوشش" بٹن اسے پکارتا ہے
async function _zimniRetryLoad() {
  window._zimniDbBroken = false;
  window._zimniDbWarned = false;
  try { await _loadZimni(); } catch (_) { /* parhna na ho sake to pehle wali/khali qadr rahe */ }
  _renderZimniList();
}
window._zimniRetryLoad = _zimniRetryLoad;

// ═══════════════════════════════════════════════════════════════
//  zimni_reports کا اصل ڈھانچہ خود پہچانو
//  مسئلہ: کچھ ڈیٹابیس میں 'content' نام کا کالم ہے ہی نہیں
//  (PGRST204). اندازہ لگانے کے بجائے: (1) موجودہ سطر سے کالم پڑھو،
//  (2) نہ ملے تو ممکنہ ناموں کو باری باری آزماؤ اور جو چل جائے
//  اُسے یاد رکھو۔
// ═══════════════════════════════════════════════════════════════

/* ممکنہ کالم ناموں کی فہرست — اوپر والا طریقہ اسی پر چلتا ہے۔
   یہ فہرست پہلے کہیں موجود نہیں تھی (نہ اِس فائل میں، نہ کسی اور
   فائل میں)، حالانکہ `_zimniContentOf` اور `_zimniWrite` دونوں اسے
   استعمال کرتے ہیں۔ نتیجہ: ضمنی محفوظ کرتے وقت
   "ZIMNI_CONTENT_COLS is not defined" اور کام رُک جاتا تھا۔

   ترتیب صرف رفتار کے لیے ہے — جو کالم چل جائے وہ localStorage میں
   یاد رہ جاتا ہے (`_zimniColSet`)، اور غلط نام PGRST204 دے کر خود
   ہی اگلے نام پر منتقل کر دیتا ہے۔ اس لیے فہرست فراخ رکھی گئی ہے۔ */
const ZIMNI_CONTENT_COLS = [
  'content', 'content_json', 'data', 'body', 'body_html',
  'details', 'matn', 'text', 'report', 'zimni_content'
];

function _zimniColPref() {
  try { return localStorage.getItem('dio_zimni_col') || ''; } catch (_) { return ''; }
}
function _zimniColSet(c) {
  try { if (c) localStorage.setItem('dio_zimni_col', c); } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
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
      if (t.startsWith('{')) { try { return JSON.parse(t); } catch (_) { /* kharab/khali JSON — pehle se tay qadr rahe */ } }
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

// ═══════════════════════════════════════════════════════════════
//  v552 — تاریخ، غلطی کی پہچان (محفوظ نہ ہونے کی اصل وجہ)
//  اصل خرابی: کالم 1 کی تاریخ (مثلاً 14/10/2026) سیدھی report_date میں جاتی تھی۔
//  ڈیٹابیس کا تاریخ والا کالم یہ شکل (DD/MM) نہیں مانتا — جس دن تاریخ 12 سے
//  اوپر ہو وہ رد کرتا۔ پرانا کوڈ اصل غلطی چھپا کر آخری آزمائے گئے کالم کا نام
//  دکھاتا تھا: «Could not find the 'zimni_content' column … PGRST204»۔
//  اب report_date ہمیشہ YYYY-MM-DD، اور پیغام میں اصل وجہ۔
// ═══════════════════════════════════════════════════════════════
function _zimniDigits(s) {
  // اردو/عربی ہندسے → انگریزی (افسر ۱۴/۱۰/۲۰۲۶ بھی لکھ سکتا ہے)
  return String(s == null ? '' : s)
    .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06F0))
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660));
}
// متن میں پہلی DD/MM/YYYY تاریخ → { iso:'YYYY-MM-DD', dmy:'DD/MM/YYYY' } یا null
function _zimniFindDate(txt) {
  const m = _zimniDigits(txt).match(/(\d{1,2})\s*[/\-.]\s*(\d{1,2})\s*[/\-.]\s*(\d{4})/);
  if (!m) return null;
  const d = parseInt(m[1], 10), mo = parseInt(m[2], 10), y = parseInt(m[3], 10);
  if (!(d >= 1 && d <= 31 && mo >= 1 && mo <= 12 && y >= 1900 && y <= 2200)) return null;
  const dd = String(d).padStart(2, '0'), mm = String(mo).padStart(2, '0');
  return { iso: y + '-' + mm + '-' + dd, dmy: dd + '/' + mm + '/' + y };
}
window._zimniFindDate = _zimniFindDate;
// آج کی مقامی تاریخ YYYY-MM-DD (UTC نہیں — رات 7 بجے کے بعد UTC اگلا/پچھلا دن دیتا)
function _zimniTodayIso() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
// انٹرنیٹ/سرور تک نہ پہنچنا (رد نہیں)
function _zimniIsNetErr(e) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  const m = String((e && (e.message || e)) || '');
  return /Failed to fetch|NetworkError|Load failed|network|timeout|ERR_|fetch/i.test(m) && !(e && e.code && /^\d{5}$|^PGRST/.test(String(e.code)));
}
// ڈیٹابیس کی غلطی → افسر کے لیے صاف اردو وجہ
function _zimniErrText(e) {
  if (!e) return 'نامعلوم وجہ';
  const code = String(e.code || ''), msg = String(e.message || e || '');
  if (_zimniIsNetErr(e)) return 'انٹرنیٹ یا سرور سے رابطہ نہیں ہو سکا';
  if (code === '42501' || /row-level security|permission denied/i.test(msg)) return 'سرور نے اجازت نہیں دی (سبسکرپشن/مقدمہ کی اجازت چیک کریں)';
  if (code === '22007' || code === '22008' || /date\/time|invalid input syntax for type date/i.test(msg)) return 'تاریخ کی شکل سرور نے قبول نہیں کی';
  if (code === '23505') return 'اسی نمبر کی ضمنی سرور پر پہلے سے موجود ہے';
  if (code === '23502') return 'سرور کا کوئی لازمی خانہ خالی ہے (' + msg.replace(/^.*column "([^"]+)".*$/, '$1') + ')';
  if (code === 'PGRST204' || code === '42703') return 'سرور کے ڈیٹابیس میں ضمنی کا خانہ نہیں ملا (' + (_zimniMissingCol(e) || msg) + ')';
  if (code === 'PGRST205' || code === '42P01') return 'سرور پر ضمنیات کی جدول نہیں ملی';
  if (code === 'DIO_NOCOL' || code === 'DIO_NOROW') return msg;
  return msg + (code ? ' — code ' + code : '');
}
window._zimniErrText = _zimniErrText;

// محفوظ کرو — کالم کا نام خود ڈھونڈتے ہوئے
//  v552: (1) report_date ہمیشہ YYYY-MM-DD؛ تاریخ کی غلطی پر بغیر تاریخ ایک بار اور۔
//        (2) «اصل» غلطی یاد رہے — کالم کے نام کی تلاش والی PGRST204 غلطیاں اسے چھپا نہ دیں۔
async function _zimniWrite(base, contentObj, id) {
  const tried = new Set();
  const cands = [_zimniColPref(), ...ZIMNI_CONTENT_COLS].filter(c => c && !tried.has(c) && (tried.add(c) || true));
  const payloadBase = Object.assign({}, base);
  if (payloadBase.report_date) {
    const fd = _zimniFindDate(payloadBase.report_date);
    if (fd) payloadBase.report_date = fd.iso;
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(String(payloadBase.report_date))) payloadBase.report_date = _zimniTodayIso();
  }
  let lastErr = null;
  const isColErr = (e, col) => e && e.code === 'PGRST204' && _zimniMissingCol(e) === col;

  for (let ci = 0; ci < cands.length; ci++) {
    const col = cands[ci];
    // ایک ہی کالم کے ساتھ چند بار — دوسرے غائب کالم ہٹاتے ہوئے
    for (let g = 0; g < 8; g++) {
      const rec = Object.assign({}, payloadBase);
      rec[col] = contentObj;
      try {
        let res;
        if (id) res = await supabaseClient.from('zimni_reports').update(rec).eq('id', id).select();
        else    res = await supabaseClient.from('zimni_reports').insert(rec).select();
        if (res.error) throw res.error;
        // update پر 0 قطار = سرور پر ریکارڈ نہیں / اجازت نہیں (خاموش RLS)
        if (id && Array.isArray(res.data) && !res.data.length) {
          const er = new Error('سرور پر یہ ضمنی نہیں ملی یا ترمیم کی اجازت نہیں'); er.code = 'DIO_NOROW'; throw er;
        }
        _zimniColSet(col);
        return (res.data && res.data[0]) || Object.assign({ id: id || ('tmp_' + Date.now()) }, rec);
      } catch (e) {
        lastErr = e;
        if (_zimniIsNetErr(e)) throw e;                    // انٹرنیٹ نہیں — باقی نام آزمانا بے کار
        if (e && e.code === 'DIO_NOROW') throw e;
        if (isColErr(e, col)) break;                       // یہ کالم نہیں — اگلا نام آزماؤ
        if (e && e.code === 'PGRST204') {
          const miss = _zimniMissingCol(e);
          if (miss && miss in payloadBase) { delete payloadBase[miss]; continue; }  // فالتو کالم ہٹا کر دوبارہ
        }
        // تاریخ کی شکل رد — بغیر تاریخ دوبارہ (مواد میں تاریخ پھر بھی محفوظ رہتی ہے)
        if (e && (e.code === '22007' || e.code === '22008' || /date\/time|type date/i.test(String(e.message || '')))
              && 'report_date' in payloadBase) {
          delete payloadBase.report_date; continue;
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
        // غلطی کالم کے نام کی نہیں — دوسرے نام آزمانا بے کار، اصل وجہ فوراً دکھاؤ
        throw lastErr;
      }
    }
  }
  if (lastErr && lastErr.code === 'PGRST204') {
    const er = new Error('سرور کی جدول zimni_reports میں ضمنی کا متن رکھنے والا کوئی کالم نہیں ملا'); er.code = 'DIO_NOCOL'; throw er;
  }
  throw lastErr || new Error('محفوظ نہ ہو سکی');
}
window._zimniWrite = _zimniWrite;

// v552: مقامی ریکارڈ جو ابھی سرور تک نہیں گیا (نیا آف لائن، یا سرور کے ریکارڈ میں آف لائن ترمیم)
function _zimniIsPending(z) {
  return !!(z && (z._pending || String(z.id || '').startsWith('local-') || String(z.id || '').startsWith('tmp_')));
}
window._zimniIsPending = _zimniIsPending;
function _zimniLocalGet(caseId) {
  try { const a = JSON.parse(localStorage.getItem('dio_zimni_' + caseId) || '[]'); return Array.isArray(a) ? a : []; }
  catch (_) { return []; }
}
function _zimniLocalPut(caseId, list) {
  try { localStorage.setItem('dio_zimni_' + caseId, JSON.stringify(list || [])); return true; }
  catch (e) { if (typeof dioLogError === 'function') dioLogError('zimni: local list save nakaam', e); return false; }
}

async function _loadZimni() {
  // مقامی نقل ہمیشہ ہاتھ میں رکھو (آف لائن یا ناکام محفوظ والی ضمنیاں ضائع نہ ہوں)
  const local = _zimniLocalGet(_zimniCaseId);

  if (!navigator.onLine) { _zimniList = local; return; }

  // ═══ ڈیٹابیس کا ڈھانچہ ہی نہ ملے تو بار بار کوشش نہ کرو ═══
  // v552: صرف ڈھانچے کی غلطی پر (کالم/جدول نہیں) — عارضی انٹرنیٹ خرابی پر
  //   پورے سیشن کے لیے «ٹوٹا» نشان نہیں لگتا (پہلے ایک بار نیٹ ٹوٹتے ہی ہر ضمنی
  //   صرف کمپیوٹر پر رہ جاتی اور سرور پر جاتی ہی نہیں تھی)۔
  if (window._zimniDbBroken) { _zimniList = local; return; }

  let rows = null;
  try {
    // ═══ SECURITY: صرف اس مقدمے کی ضمنیاں (case_id) — کبھی بغیر چھانٹی نہیں ═══
    let r = await supabaseClient.from('zimni_reports').select('*')
      .eq('case_id', _zimniCaseId).order('serial_no', { ascending: true });
    if (r.error && !_zimniIsNetErr(r.error)) r = await supabaseClient.from('zimni_reports').select('*').eq('case_id', _zimniCaseId);
    if (r.error) throw r.error;
    rows = r.data || [];
  } catch (e) {
    const schema = e && /^(PGRST204|PGRST205|42703|42P01)$/.test(String(e.code || ''));
    if (schema) { window._zimniDbBroken = true; window._zimniBrokenAt = Date.now(); }
    try { console.error('[zimni load]', e); } catch (_) { /* console na ho to bhi na phatte */ }
    if (schema && !window._zimniDbWarned) {
      window._zimniDbWarned = true;
      try {
        showToast('سرور پر ضمنیات کا ڈھانچہ نہیں ملا (' + _zimniErrText(e) + ') — ضمنیاں فی الحال اسی آلے پر محفوظ ہو رہی ہیں', 'warn', 9000);
      } catch (_) { /* paigham na dikh sake to koi baat nahi */ }
    }
    _zimniList = local;
    return;
  }

  const fromDb = rows.map(r => Object.assign({}, r, { content: _zimniContentOf(r) }));
  // v552: مقامی ترمیم جو ابھی سرور تک نہیں گئی (اسی id کی) — سرور کی پرانی نقل
  //   اسے مٹا نہ دے؛ مقامی (تازہ) ہی رہے اور sync ہو۔
  const pendById = {};
  local.forEach(z => { if (z && z._pending && z.id != null) pendById[String(z.id)] = z; });
  const merged = fromDb.map(r => {
    const p = pendById[String(r.id)];
    if (!p) return r;
    const ls = String((p.content || {}).saved_at || ''), ss = String((r.content || {}).saved_at || '');
    return (ls && ls >= ss) ? p : r;
  });
  // ڈیٹابیس میں نہ پہنچنے والے مقامی اندراج بھی ساتھ رکھو
  const ids = new Set(fromDb.map(r => String(r.id)));
  const onlyLocal = local.filter(z => z && _zimniIsPending(z) && !ids.has(String(z.id)));
  _zimniList = merged.concat(onlyLocal)
    .sort((a, b) => (parseInt(b.serial_no, 10) || 0) - (parseInt(a.serial_no, 10) || 0));
  _zimniLocalPut(_zimniCaseId, _zimniList);
}

// ═══════════════════════════════════════════════════════════════
//  v552 — SYNC: آلے پر محفوظ (sync باقی) ضمنیاں سرور پر بھیجو
//  آف لائن پہلے، پھر انٹرنیٹ آتے ہی خود — کسی بھی مقدمے کی، کسی بھی صفحے سے۔
//  دوہرا اندراج نہیں: نئی ضمنی بھیجنے سے پہلے دیکھا جاتا ہے کہ سرور پر اسی مقدمے
//  کی اسی نمبر والی ضمنی اسی «محفوظ کرنے کے وقت» کے ساتھ پہلے سے تو نہیں۔
// ═══════════════════════════════════════════════════════════════
let _zimniSyncBusy = false;
function _zimniPendingCaseIds() {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      const m = /^dio_zimni_(.+)$/.exec(k);
      if (!m || /^(col|types_|draft_)/.test(m[1])) continue;
      const list = _zimniLocalGet(m[1]);
      if (list.some(_zimniIsPending)) out.push(m[1]);
    }
  } catch (_) { /* storage na ho to kuch nahi */ }
  return out;
}
async function _zimniSyncOne(caseId, z) {
  const c = z.content || {};
  const base = { case_id: caseId, serial_no: z.serial_no, report_date: z.report_date || _zimniTodayIso() };
  try {
    const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
    if (oid) base.officer_id = oid;
  } catch (_) { /* officer id na mile to bhi aage */ }
  let serverId = (!String(z.id).startsWith('local-') && !String(z.id).startsWith('tmp_')) ? z.id : null;
  if (!serverId) {
    // پہلے بھیجی جا چکی؟ (جواب راستے میں ٹوٹ گیا ہو) — اسی نمبر + اسی وقت والی ڈھونڈو
    try {
      const r = await supabaseClient.from('zimni_reports').select('*').eq('case_id', caseId).eq('serial_no', z.serial_no);
      const hit = (r && r.data || []).find(x => String((_zimniContentOf(x) || {}).saved_at || '') === String(c.saved_at || ''));
      if (hit) serverId = hit.id;
    } catch (_) { /* talaash na ho saki — naya bana do */ }
  }
  const saved = await _zimniWrite(base, c, serverId);
  return Object.assign({}, saved, { content: c, _pending: false, _sync_err: '' });
}
// ایک ہی ضمنی دو راستوں (Ctrl+S اور خودکار sync) سے ایک ساتھ نہ جائے
const _zimniInFlight = new Set();
// sync کے بعد تازہ مقامی فہرست میں صرف وہی ضمنی بدلو (اس دوران افسر نے ترمیم کی ہو تو وہ نہ مٹے)
function _zimniRekeyDraft(caseId, oldId, newId) {
  if (String(oldId) === String(newId)) return;
  try {
    const o = _zimniDrafts(caseId);
    if (o['id:' + oldId]) { o['id:' + newId] = Object.assign({}, o['id:' + oldId], { key: 'id:' + newId, zimni_id: newId }); delete o['id:' + oldId]; _zimniDraftsPut(caseId, o); }
  } catch (_) { /* draft na ho to kuch nahi */ }
}
function _zimniMergeSynced(list, oldId, sentSavedAt, nz) {
  const j = list.findIndex(x => String(x.id) === String(oldId));
  if (j < 0) return false;
  const cur = list[j];
  if (String((cur.content || {}).saved_at || '') === String(sentSavedAt || '')) list[j] = nz;
  else list[j] = Object.assign({}, cur, { id: nz.id, _pending: true });   // نئی ترمیم باقی — اگلی بار update
  return true;
}
async function _zimniSyncPending(caseIds, quiet) {
  if (_zimniSyncBusy) return 0;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 0;
  if (typeof supabaseClient === 'undefined' || !supabaseClient) return 0;
  // بغیر سیشن (آف لائن لاگ اِن) سرور «اجازت نہیں» کہے گا — انتظار کرو
  try { const s = await supabaseClient.auth.getSession(); if (!s || !s.data || !s.data.session) return 0; } catch (_) { return 0; }
  _zimniSyncBusy = true;
  let done = 0, failed = 0, lastWhy = '', again = false;
  try {
    for (const cid of (caseIds || _zimniPendingCaseIds())) {
      const snapshot = _zimniLocalGet(cid).filter(_zimniIsPending);
      for (const z of snapshot) {
        if (_zimniInFlight.has(String(z.id))) continue;
        _zimniInFlight.add(String(z.id));
        const sentAt = (z.content || {}).saved_at || '';
        try {
          const nz = await _zimniSyncOne(cid, z);
          _zimniRekeyDraft(cid, z.id, nz.id);
          const fresh = _zimniLocalGet(cid);
          _zimniMergeSynced(fresh, z.id, sentAt, nz);
          _zimniLocalPut(cid, fresh);
          if (String(cid) === String(_zimniCaseId)) {
            _zimniMergeSynced(_zimniList, z.id, sentAt, nz);
            if (_zimniActive && String(_zimniActive.id) === String(z.id)) {
              _zimniActive = Object.assign({}, _zimniActive, { id: nz.id });
              if (String((_zimniActive.content || {}).saved_at || '') === String(sentAt)) _zimniActive._pending = false;
            }
          }
          if (fresh.some(x => String(x.id) === String(nz.id) && x._pending)) again = true;
          done++;
        } catch (e) {
          if (_zimniIsNetErr(e)) return done;   // نیٹ پھر ٹوٹ گیا — بعد میں (مقامی نقل جوں کی توں)
          failed++; lastWhy = _zimniErrText(e);
          const fresh = _zimniLocalGet(cid);
          const j = fresh.findIndex(x => String(x.id) === String(z.id));
          if (j >= 0) { fresh[j] = Object.assign({}, fresh[j], { _pending: true, _sync_err: lastWhy }); _zimniLocalPut(cid, fresh); }
          if (String(cid) === String(_zimniCaseId)) {
            const k = _zimniList.findIndex(x => String(x.id) === String(z.id));
            if (k >= 0) _zimniList[k] = Object.assign({}, _zimniList[k], { _sync_err: lastWhy });
          }
        } finally { _zimniInFlight.delete(String(z.id)); }
      }
    }
  } finally { _zimniSyncBusy = false; }
  try {
    if (done) showToast(done + ' ضمنی سرور پر محفوظ (sync) ہو گئیں', 'success', 4000);
    // خودکار (ہر منٹ) کوشش میں وہی ناکامی بار بار نہ دکھاؤ — وجہ فہرست میں درج رہتی ہے
    if (failed && !(quiet && lastWhy === window._zimniLastFailWhy)) showToast(failed + ' ضمنی سرور پر نہیں گئیں — وجہ: ' + lastWhy + ' (اس آلے پر محفوظ ہیں)', 'error', 9000);
    window._zimniLastFailWhy = failed ? lastWhy : '';
  } catch (_) { /* paigham na dikh sake to koi baat nahi */ }
  try { if ((done || (failed && !quiet)) && document.querySelector('.zt-wrap')) _renderZimniList(); } catch (_) { /* list khuli na ho to kuch nahi */ }
  if (again) setTimeout(() => { _zimniSyncPending(); }, 1500);
  return done;
}
window._zimniSyncPending = _zimniSyncPending;
// پرانی آف لائن قطار (offline-store) سے: اس ضمنی کی مقامی نقل «sync باقی»
function _zimniMarkPending(caseId, id) {
  const ids = caseId ? [String(caseId)] : _zimniPendingCaseIds().concat(Object.keys(localStorage).map(k => (/^dio_zimni_(.+)$/.exec(k) || [])[1]).filter(Boolean));
  for (const cid of ids) {
    if (/^(col|types_|draft_)/.test(cid)) continue;
    const list = _zimniLocalGet(cid);
    const j = list.findIndex(x => String(x.id) === String(id));
    if (j >= 0 && !list[j]._pending) { list[j]._pending = true; _zimniLocalPut(cid, list); return true; }
  }
  return false;
}
window._zimniMarkPending = _zimniMarkPending;
window.addEventListener('online', () => { window._zimniDbBroken = false; setTimeout(() => { _zimniSyncPending(); }, 2500); });
setTimeout(() => { try { if (navigator.onLine) _zimniSyncPending(); } catch (_) { /* boot par na ho sake to baad mein */ } }, 6000);
// v558 (افسر کی شکایت، 27 اکتوبر 2026): «لیپ ٹاپ پر محفوظ ضمنیاں صرف اسی لیپ ٹاپ پر — موبائل یا کسی
//   اور آلے پر نہیں، حالانکہ دونوں انٹرنیٹ سے جڑے ہیں»
//   وجہ: «سرور پر بھیجنا باقی» والی ضمنیاں صرف دو موقعوں پر بھیجی جاتی تھیں — ایپ کھلنے کے 6 سیکنڈ
//   بعد (تب تک اکثر لاگ اِن مکمل نہیں ہوتا، اس لیے کوشش خالی) اور انٹرنیٹ «ٹوٹ کر واپس» آنے پر۔
//   لیپ ٹاپ کا انٹرنیٹ مسلسل چلتا رہے تو دوسرا موقع کبھی آتا ہی نہیں تھا۔ اسی طرح سرور کا ڈھانچہ
//   ایک بار نہ ملے تو باقی پورا دن ہر ضمنی صرف آلے پر رہتی۔
//   اب: ہر منٹ (انٹرنیٹ ہو اور کچھ باقی ہو تو)، ایپ پر واپس آتے ہی، اور فہرست کھلتے ہی دوبارہ
//   کوشش؛ «ڈھانچہ نہیں ملا» کا نشان 5 منٹ بعد خود ہٹ کر دوبارہ جانچ۔
function _zimniSyncSoon() {
  try {
    if (!navigator.onLine) return;
    if (window._zimniDbBroken && Date.now() - (window._zimniBrokenAt || 0) > 300000) window._zimniDbBroken = false;
    if (Date.now() - (window._zimniLastTry || 0) < 20000) return;   // بہت جلدی دوبارہ نہیں
    window._zimniLastTry = Date.now();
    if (_zimniPendingCaseIds().length) _zimniSyncPending(null, true);
  } catch (_) { /* agli dafa */ }
}
setInterval(_zimniSyncSoon, 60000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') setTimeout(_zimniSyncSoon, 1500); });

// ═══════════════════════════════════════════════════════════════
//  v552 — خودکار مسودہ (Autosave): لکھتے ہی ہر چند سیکنڈ بعد اسی آلے پر محفوظ۔
//  لیپ ٹاپ/موبائل اچانک بند ہو، بجلی جائے یا ٹیب بند ہو — لکھا ہوا ضائع نہیں۔
//  مسودہ سرور پر نہیں جاتا (عدالتی ریکارڈ میں آدھی لکھی ضمنی نہ جائے) — افسر
//  «محفوظ» / Ctrl+S دبائے تو ضمنی بنتی ہے اور مسودہ ختم۔
// ═══════════════════════════════════════════════════════════════
function _zimniDraftKey(caseId) { return 'dio_zimni_draft_' + caseId; }
function _zimniDrafts(caseId) {
  try { const o = JSON.parse(localStorage.getItem(_zimniDraftKey(caseId || _zimniCaseId)) || '{}'); return (o && typeof o === 'object') ? o : {}; }
  catch (_) { return {}; }
}
function _zimniDraftsPut(caseId, o) {
  try {
    const k = _zimniDraftKey(caseId || _zimniCaseId);
    if (o && Object.keys(o).length) localStorage.setItem(k, JSON.stringify(o)); else localStorage.removeItem(k);
    return true;
  } catch (_) { return false; }
}
// کھلی ضمنی کا مسودہ کس چابی پر
function _zimniActiveDraftKey() {
  const z = _zimniActive || {};
  if (z.id) return 'id:' + z.id;
  if (!z._draftKey) z._draftKey = 'new:' + Date.now();
  return z._draftKey;
}
function _zimniWriteDraft() {
  const ed = _zimniDoc();
  if (!ed || !ed.querySelector('.zf-tbl') || !_zimniActive) return false;
  try { _zimniSyncSignDate(); } catch (_) { /* ikhtiyari */ }
  const o = _zimniDrafts();
  const key = _zimniActiveDraftKey();
  o[key] = {
    key, zimni_id: _zimniActive.id || null,
    serial_no: _zimniZnoFromDoc(ed) || _zimniActive.serial_no || null,   // v555: خانے میں لکھا نمبر
    bodyHtml: _zimniCleanHTML(ed.innerHTML),
    main_type: String((document.getElementById('zf-main-type') || {}).value || '').replace('__add__', ''),
    sub_type: String((document.getElementById('zf-sub-type') || {}).value || '').replace('__add__', ''),
    saved_at: new Date().toISOString(),
  };
  const ok = _zimniDraftsPut(_zimniCaseId, o);
  if (ok) {
    const el = document.getElementById('zf-autosave');
    if (el) el.textContent = 'خودکار محفوظ (اس آلے پر): ' + _zimniFmtStamp(o[key].saved_at);
  }
  return ok;
}
window._zimniWriteDraft = _zimniWriteDraft;
function _zimniClearDraft(key) {
  const o = _zimniDrafts();
  if (key && o[key]) { delete o[key]; _zimniDraftsPut(_zimniCaseId, o); }
}
// لکھائی پر نظر: 1.5 سیکنڈ رکنے پر مسودہ؛ صفحہ چھپنے/بند ہونے پر فوراً
let _zimniDirty = false;
function _zimniWatchEdits() {
  const ed = _zimniDoc();
  if (!ed || ed._zfDraftBound) return;
  ed._zfDraftBound = true;
  const mark = () => {
    _zimniDirty = true;
    clearTimeout(ed._zfDraftT);
    ed._zfDraftT = setTimeout(() => { try { if (_zimniDirty) _zimniWriteDraft(); } catch (_) { /* agli dafa */ } }, 1500);
  };
  ed.addEventListener('input', mark);
  ed.addEventListener('paste', () => setTimeout(mark, 0));
  ed.addEventListener('cut', () => setTimeout(mark, 0));
}
if (!window._zfUnloadBound) {
  window._zfUnloadBound = true;
  const flush = () => { try { if (_zimniDirty) _zimniWriteDraft(); } catch (_) { /* band hote waqt — jo ho sake */ } };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  window.addEventListener('pagehide', flush);
  window.addEventListener('beforeunload', flush);
  setInterval(() => { try { if (_zimniDirty && document.querySelector('#ch173-doc .zf-tbl')) _zimniWriteDraft(); } catch (_) { /* agli dafa */ } }, 20000);
}

// ═══ کالم 1 (سیریل 1 کے سامنے) کی تاریخ = تفتیشی افسر کے نام کے نیچے کی تاریخ (قاعدہ) ═══
function _zimniSyncSignDate() {
  const doc = _zimniDoc();
  if (!doc || !doc.querySelector('.zf-tbl')) return '';
  const b1 = doc.querySelector('tr.zf-blk td.zf-c-action .zf-actbody') || doc.querySelector('tr.zf-blk td.zf-c-action')
          || doc.querySelector('.zf-actbody');
  const fd = b1 ? _zimniFindDate(b1.innerText || b1.textContent || '') : null;
  if (!fd) return '';
  let sd = doc.querySelector('[data-k="io_date"]');
  if (!sd) {
    const sign = doc.querySelector('[data-k="io_sign"]');
    if (!sign || !sign.parentNode) return fd.dmy;
    sd = document.createElement('div');
    sd.className = 'zf-signdate'; sd.setAttribute('data-k', 'io_date');
    sd.setAttribute('style', 'text-align:left !important;display:block;');
    sign.parentNode.insertBefore(sd, sign.nextSibling);
  }
  if (String(sd.textContent || '').trim() !== fd.dmy) sd.textContent = fd.dmy;
  return fd.dmy;
}
window._zimniSyncSignDate = _zimniSyncSignDate;

// ═══ ضمنی کی سرخی = منتخب ذیلی ضمنی کا نام (افسر کی ہدایت، اکتوبر 2026) ═══
const ZIMNI_DEFAULT_TITLE = 'رپورٹ ضمنی بیرونی';
function _zimniApplyTitle(name) {
  const doc = _zimniDoc();
  const t = doc && doc.querySelector('.zf-title');
  if (!t) return;
  const want = String(name || '').trim() || ZIMNI_DEFAULT_TITLE;
  if (t.textContent !== want) t.textContent = want;
}
window._zimniApplyTitle = _zimniApplyTitle;

// ── LIST VIEW (all zimni entries for this case) ───────────────
function _renderZimniList() {
  try { if (typeof _ch173FocusMode === 'function') _ch173FocusMode(false); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }  // chips wapas
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  try { if (typeof _ch173FullPage === 'function') _ch173FullPage(area); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
  _zimniActive = null; _zimniDirty = false;

  const drafts = _zimniDrafts();
  const newDrafts = Object.keys(drafts).filter(k => k.indexOf('new:') === 0).map(k => drafts[k])
    .sort((a, b) => String(b.saved_at).localeCompare(String(a.saved_at)));

  // ── DB ٹوٹ گیا اور کوئی مقامی نقل بھی نہیں: صاف error کارڈ + دوبارہ کوشش ──
  //    (اگر cache موجود ہو تو نیچے نارمل فہرست — field افسر آف لائن نہ پھنسے)
  if ((!_zimniList || _zimniList.length === 0) && !newDrafts.length && window._zimniDbBroken
      && typeof DIO !== 'undefined' && DIO.states && DIO.states.error) {
    try {
      area.innerHTML = DIO.states.error(
        { message: 'اس مقدمے کی ضمنیات لوڈ نہیں ہو سکیں۔ انٹرنیٹ اور مقدمہ چیک کر کے دوبارہ کوشش کریں۔' },
        '_zimniRetryLoad'
      );
      return;
    } catch (_) { /* fail-open: error کارڈ نہ بنے تو نیچے نارمل رینڈر */ }
  }

  // ── ہمیشہ ضمنی نمبر کے حساب سے، بڑے سے چھوٹا (descending) ──
  // نمبر شمار — پہلے ڈیٹابیس کا کالم، نہ ہو تو دستاویز کے ساتھ محفوظ نمبر
  const sno = (z) => parseInt(z.serial_no, 10)
    || parseInt((z.content || {}).serial_no, 10) || 0;
  const list = _zimniList.slice().sort((a, b) => sno(b) - sno(a));

  // تاریخ — block 1 کالم 1 کی لکھی تاریخ؛ ہمیشہ DD/MM/YYYY
  const dt = (z) => {
    const fd = _zimniFindDate((z.content || {}).col1_date || '');
    if (fd) return fd.dmy;
    const raw = String(z.report_date || '').trim();
    if (!raw) return '—';
    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return iso[3] + '/' + iso[2] + '/' + iso[1];
    return (typeof formatDate === 'function' ? formatDate(raw) : raw);
  };
  const wq = (iso) => {
    try {
      if (!iso) return '';
      const x = new Date(iso); if (isNaN(x)) return '';
      let h = x.getHours(); const m = String(x.getMinutes()).padStart(2, '0');
      const ap = h < 12 ? 'am' : 'pm'; h = h % 12 || 12;
      return String(h).padStart(2, '0') + ':' + m + ' ' + ap;
    } catch (_) { return ''; }
  };
  const head = (z) => ((z.content || {}).head || 'رپورٹ ضمنی');
  const J = (v) => _dioJsHtml(v);
  const status = (z) => {
    if (drafts['id:' + z.id]) return '<span class="zst zst-d">غیر محفوظ ترمیم (مسودہ)</span>';
    if (_zimniIsPending(z)) {
      return '<span class="zst zst-p" title="' + esc(z._sync_err || '') + '">اس آلے پر محفوظ — سرور پر بھیجنا باقی</span>'
        + (z._sync_err ? '<div class="zst-why">' + esc(z._sync_err) + '</div>' : '');
    }
    return '<span class="zst zst-ok">سرور پر محفوظ</span>';
  };
  const pendingCount = list.filter(_zimniIsPending).length;
  if (pendingCount) setTimeout(_zimniSyncSoon, 800);   // v558: فہرست کھلتے ہی باقی ضمنیاں سرور پر

  area.innerHTML = `
  <style>
    .zt-wrap{ padding:14px; direction:rtl; height:100%; overflow-y:auto; box-sizing:border-box;
      font-family:'Jameel Noori Nastaleeq'; }
    .zt-bar{ display:flex; align-items:center; gap:10px; margin:0 0 10px; flex-wrap:wrap; }
    .zt-bar .zt-h{ flex:1; text-align:center; font-size:16pt; font-weight:700; color:var(--accent); min-width:8em; }
    .zt{ width:100%; border-collapse:collapse; font-size:13pt; direction:rtl; }
    .zt th{ background:var(--bg-tertiary); border:1px solid var(--border); padding:7px 6px;
            font-weight:700; white-space:nowrap; text-align:center; font-size:12pt; }
    .zt td{ border:1px solid var(--border); padding:6px; vertical-align:middle; }
    .zt tbody tr:nth-child(odd){ background:var(--bg-secondary); }
    .zt tbody tr:hover{ background:var(--hover-bg); }
    .zt .num{ text-align:center; font-weight:700; width:70px; }
    .zt .dtc{ text-align:center; white-space:nowrap; width:130px; direction:ltr; unicode-bidi:isolate; font-size:12pt; }
    .zt .wq{ font-size:10.5pt; color:var(--text-muted); margin-top:2px; direction:ltr; unicode-bidi:isolate; }
    .zt .act{ text-align:center; width:1%; white-space:nowrap; }
    .zt .act-in{ display:flex; flex-wrap:nowrap; gap:4px; justify-content:center; }
    .zab{ display:inline-flex; align-items:center; gap:4px; border:1px solid var(--border); background:var(--bg-card);
          color:var(--text-primary); border-radius:7px; padding:4px 8px; cursor:pointer; font-size:11.5pt; line-height:1.3;
          font-family:inherit; white-space:nowrap; }
    .zab:hover{ background:var(--hover-bg); border-color:var(--accent); }
    .zab.zab-del{ color:#b91c1c; }
    .zst{ display:inline-block; font-size:10.5pt; padding:1px 8px; border-radius:999px; white-space:nowrap; }
    .zst-ok{ background:rgba(22,163,74,.12); color:#15803d; }
    .zst-p{ background:rgba(217,119,6,.14); color:#b45309; }
    .zst-d{ background:rgba(37,99,235,.12); color:#1d4ed8; }
    .zst-why{ font-size:9.5pt; color:#b91c1c; margin-top:2px; }
    .zt tr.zt-draft td{ background:rgba(37,99,235,.06); }
    @media (max-width:760px){
      .zt thead{ display:none; }
      .zt, .zt tbody, .zt tr, .zt td{ display:block; width:auto !important; }
      .zt tr{ border:1px solid var(--border); border-radius:10px; margin-bottom:10px; padding:6px 8px; background:var(--bg-card) !important; }
      .zt td{ border:0; padding:3px 0; text-align:right !important; }
      .zt td.num::before{ content:'ضمنی نمبر: '; font-weight:400; color:var(--text-muted); }
      .zt td.dtc{ direction:rtl; }
      .zt .act-in{ justify-content:flex-start; flex-wrap:wrap; }
      .zt .act{ white-space:normal; }
    }
  </style>
  <div class="zt-wrap">
    <div class="zt-bar">
      <button class="btn btn-primary btn-sm dio-add-btn" onclick="_newZimni()">+ ضمنی درج کریں</button>
      <div class="zt-h">ضمنیات (${list.length})</div>
      ${pendingCount && navigator.onLine ? `<button class="btn btn-secondary btn-sm" onclick="_zimniSyncPending()">⟳ سرور پر بھیجیں (${pendingCount})</button>` : ''}
      <button class="btn btn-secondary btn-sm" onclick="_printAllZimni()">🖨️ تمام ضمنیاں</button>
    </div>
    ${(list.length || newDrafts.length) ? `
    <table class="zt">
      <thead><tr>
        <th class="num">ضمنی نمبر</th>
        <th class="dtc">تاریخ و وقت</th>
        <th>ہیڈ (قسم)</th>
        <th>حالت</th>
        <th class="act">ایکشن</th>
      </tr></thead>
      <tbody>
        ${newDrafts.map(d => `
          <tr class="zt-draft" ondblclick="_openZimniDraft('${J(d.key)}')" style="cursor:pointer;">
            <td class="num">${esc(String(d.serial_no || ''))}</td>
            <td class="dtc">${esc(_zimniFmtStamp(d.saved_at).split(' — ')[0] || '—')}<div class="wq">${esc(wq(d.saved_at))}</div></td>
            <td>${esc(d.sub_type || 'نئی ضمنی')}</td>
            <td><span class="zst zst-d">مسودہ — ابھی محفوظ نہیں کی گئی</span></td>
            <td class="act">${dioActRow(
              dioActBtn('edit', `_openZimniDraft('${J(d.key)}')`, 'جاری رکھیں')
              + dioActBtn('delete', `_deleteZimniDraft('${J(d.key)}')`, 'حذف')
            )}</td>
          </tr>`).join('')}
        ${list.map(z => `
          <tr ondblclick="_openZimni('${J(z.id)}')" style="cursor:pointer;" data-zid="${esc(String(z.id))}">
            <td class="num">${esc(String(sno(z) || ''))}</td>
            <td class="dtc">${esc(dt(z))}${wq((z.content || {}).saved_at) ? `<div class="wq">${esc(wq((z.content || {}).saved_at))}</div>` : ''}</td>
            <td>${esc(head(z))}</td>
            <td>${status(z)}</td>
            <td class="act">${dioActRow(
              dioActBtn('edit', `_openZimni('${J(z.id)}')`, 'ترمیم')
              + dioActBtn('print', `_printZimniById('${J(z.id)}')`, 'پرنٹ — ضمنی کھولے بغیر')
              + dioActBtn('share', `_emailZimni('${J(z.id)}')`, 'شیئر — PDF / Word')
              + dioActBtn('delete', `_deleteZimni('${J(z.id)}')`, 'حذف')
            )}</td>
          </tr>`).join('')}
      </tbody>
    </table>` : `
    <div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
      <div style="font-size:30pt;margin-bottom:10px;">📋</div>
      <div style="font-size:14pt;">ابھی کوئی ضمنی رپورٹ نہیں</div>
      <div style="font-size:11pt;margin-top:6px;">اوپر «ضمنی درج کریں» پر کلک کریں</div>
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


// ↕️ Move — ضمنی نمبر بدلو (ترتیب خود بدل جائے گی)
async function _moveZimni(id) {
  const z = _zimniRec(id); if (!z) return;
  const inp = prompt('نیا ضمنی نمبر درج کریں:', String(z.serial_no || ''));
  if (inp === null) return;
  const n = parseInt(String(inp).replace(/[^\d]/g, ''), 10);
  if (!n || n < 1) { showToast('درست نمبر درج کریں', 'warn'); return; }
  // v555: یہ نمبر کسی اور محفوظ ضمنی کا ہو تو نہیں (ایک نمبر کی ایک ضمنی)
  const clash = (_zimniList || []).find(x => String(x.id) !== String(z.id) && _zimniRecNo(x) === n);
  if (clash) { showToast('⚠ ضمنی نمبر ' + n + ' پہلے سے محفوظ ہے — دوسرا نمبر درج کریں', 'warn', 7000); return; }
  // v555: کاغذ کی سرخی («ضمنی نمبر» خانہ) میں بھی یہی نمبر — پرنٹ پرانا نمبر نہ دکھائے
  const c = Object.assign({}, z.content || {});
  try {
    const t = document.createElement('template'); t.innerHTML = String(c.bodyHtml || '');
    const zf = t.content.querySelector('[data-k="zno"]');
    if (zf) { zf.textContent = String(n); c.bodyHtml = t.innerHTML; }
  } catch (_) { /* سرخی نہ ملے تو صرف نمبر */ }
  c.serial_no = n;
  try {
    if (navigator.onLine && !String(z.id).startsWith('local-')) {
      await _zimniWrite({ serial_no: n }, c, z.id);
    }
    z.serial_no = n; z.content = c;
    try { localStorage.setItem('dio_zimni_' + _zimniCaseId, JSON.stringify(_zimniList)); } catch (_) { if (typeof dioLogError === 'function') dioLogError('zimni: local list save nakaam', _); }
    showToast('ضمنی نمبر ' + n + ' ہو گیا', 'success');
  } catch (e) { showToast('' + (e.message || e), 'error'); }
  _renderZimniList();
}
window._moveZimni = _moveZimni;

// v555: نئی ضمنی کا نمبر = محفوظ شدہ ضمنیوں میں سب سے بڑا + 1۔ پہلے غیر محفوظ (چھوڑے
//   ہوئے) مسودوں کے نمبر بھی گنے جاتے تھے — اسی سے نمبر آگے نکل جاتا اور افسر کو بار بار
//   بدلنا پڑتا تھا۔ دو مسودے ایک ہی نمبر پر ہوں تو محفوظ کرتے وقت خبردار کیا جاتا ہے۔
function _zimniNextSerial() {
  let m = 0;
  (_zimniList || []).forEach(z => { m = Math.max(m, _zimniRecNo(z)); });
  return m + 1;
}
function _newZimni() {
  _zimniActive = { id: null, serial_no: _zimniNextSerial(), content: null, _draftKey: 'new:' + Date.now() };
  _zimniDirty = false;
  _renderZimniEditor();
}

function _openZimni(id) {
  const z = _zimniList.find(x => String(x.id) === String(id)) || null;
  if (!z) return;
  _zimniActive = Object.assign({}, z);
  _zimniDirty = false;
  // اسی ضمنی کا خودکار مسودہ (غیر محفوظ ترمیم) — تازہ ہو تو وہی کھولو
  const d = _zimniDrafts()['id:' + z.id];
  const zs = String((z.content || {}).saved_at || '');
  if (d && d.bodyHtml && String(d.saved_at) > zs) {
    _zimniActive.content = Object.assign({}, z.content || {}, { bodyHtml: d.bodyHtml, main_type: d.main_type, sub_type: d.sub_type });
    _zimniActive._restored = true;
  }
  _renderZimniEditor();
  if (_zimniActive && _zimniActive._restored) {
    _zimniDirty = true;
    try { showToast('غیر محفوظ ترمیم (خودکار مسودہ) بحال کر دی گئی — محفوظ کرنے کے لیے Ctrl+S / «اپ ڈیٹ»', 'info', 6000); } catch (_) { /* paigham */ }
  }
}

// مسودہ (نئی ضمنی جو ابھی محفوظ نہیں ہوئی) دوبارہ کھولو
function _openZimniDraft(key) {
  const d = _zimniDrafts()[key];
  if (!d) { _renderZimniList(); return; }
  _zimniActive = { id: null, serial_no: d.serial_no || _zimniNextSerial(), _draftKey: key,
    content: { bodyHtml: d.bodyHtml, main_type: d.main_type, sub_type: d.sub_type } };
  _zimniDirty = true;
  _renderZimniEditor();
}
window._openZimniDraft = _openZimniDraft;
function _deleteZimniDraft(key) {
  if (!confirm('یہ غیر محفوظ مسودہ حذف کر دیں؟ (واپس نہیں آئے گا)')) return;
  _zimniClearDraft(key);
  _renderZimniList();
}
window._deleteZimniDraft = _deleteZimniDraft;
window._newZimni = _newZimni;
window._openZimni = _openZimni;

// ← فہرست — غیر محفوظ تبدیلی ہو تو پوچھو (مسودہ ویسے بھی آلے پر محفوظ ہے)
async function _zimniBackToList() {
  if (_zimniDirty) {
    try { _zimniWriteDraft(); } catch (_) { /* agli dafa */ }
    if (confirm('تبدیلیاں ابھی محفوظ نہیں ہوئیں۔ محفوظ کر کے فہرست پر جائیں؟\n(«Cancel» = بغیر محفوظ کیے جائیں — مسودہ اس آلے پر رہے گا)')) {
      const ok = await _saveZimni(false, true);
      if (!ok) return;
    }
  }
  _zimniDirty = false;
  await _loadZimni();
  _renderZimniList();
}
window._zimniBackToList = _zimniBackToList;

// ── EDITOR (Police Form 25-54(1)) ──────────────
// ═══════════════════════════════════════════════════════════════
//  ضمنی کی اقسام — مرکزی (Main) + ذیلی (Sub) dropdown
//  چالان/رپورٹ 173 کے فارمیٹ کو ہاتھ نہیں لگتا — یہ صرف ضمنی کی قسم کا انتخاب ہے۔
//  ہر فہرست کے آخر میں "➕ نئی قسم" — افسر اپنی مرضی کی قسم شامل کرے (صرف اپنے لیے،
//  per-officer localStorage)۔
// ═══════════════════════════════════════════════════════════════
const _ZIMNI_TYPES = {
  'اول ضمنی': ['اول ضمنی'],
  'متفرق': ['متفرق ضمنی'],
  'SHO ضمنی': [
    'رپورٹ 173 — مکمل چالان',
    'رپورٹ 173 — نامکمل/عبوری (512 ض ف)',
    'عدمِ سراغ (عدم پتہ)',
    'اخراج',
    'SHO نگرانی نوٹ',
    'تتمہ چالان مکمل — شراب',
    'تتمہ چالان مکمل — چرس',
    'تتمہ چالان مکمل — DNA',
    'تتمہ چالان مکمل — آئس',
    'تتمہ چالان مکمل — افیون',
    'تتمہ چالان مکمل — ہیروئن',
  ],
  'DSP / SDPO ضمنی': [
    'DSP نگرانی نوٹ و ہدایات',
    'تصدیق رپورٹ اخراج',
    'تصدیق رپورٹ عدم پتہ',
  ],
  'عدالتی درخواستیں': [
    'ریمانڈ جسمانی',
    'ریمانڈ عدالتی (judicial)',
    'بیان بمطابق 164 ض ف',
    'اجازتِ میڈیکل / پوسٹ مارٹم',
    'CDR / کال ریکارڈ',
    'IMEI / موبائل ڈیٹا',
    'اشتہاری / مفرور',
    'درخواست تلفی',
    'متفرق درخواست',
  ],
};
const _ZIMNI_TYPE_ADD = '__add__';
function _zimniTypeSelCss() {
  return "height:28px;border:1px solid var(--border,#ccc);border-radius:6px;background:var(--bg-card,#fff);color:var(--text-primary,#111);font-size:9.75pt;padding:0 6px;margin:0 2px;cursor:pointer;max-width:190px;font-family:'Jameel Noori Nastaleeq';";
}
function _zimniTypeOfficerId() {
  try { return String((typeof currentOfficer !== 'undefined' && currentOfficer && (currentOfficer.id || currentOfficer.user_id)) || 'x'); } catch (_) { return 'x'; }
}
function _zimniCustomTypes() {
  try { return JSON.parse(localStorage.getItem('dio_zimni_types_' + _zimniTypeOfficerId()) || '{"main":[],"sub":{}}'); } catch (_) { return { main: [], sub: {} }; }
}
function _zimniSaveCustomTypes(o) { try { localStorage.setItem('dio_zimni_types_' + _zimniTypeOfficerId(), JSON.stringify(o)); } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ } }
function _zimniAllMains() {
  const c = _zimniCustomTypes(); const base = Object.keys(_ZIMNI_TYPES);
  (c.main || []).forEach(m => { if (base.indexOf(m) < 0) base.push(m); });
  return base;
}
function _zimniSubsFor(main) {
  const base = (_ZIMNI_TYPES[main] || []).slice(); const c = _zimniCustomTypes();
  (((c.sub || {})[main]) || []).forEach(s => { if (base.indexOf(s) < 0) base.push(s); });
  return base;
}
function _zimniMainSelectHTML(sel) {
  const E = (v) => (typeof esc === 'function') ? esc(v) : String(v == null ? '' : v);
  const opts = _zimniAllMains().map(m => `<option value="${E(m)}" ${m === sel ? 'selected' : ''}>${E(m)}</option>`).join('');
  return `<select id="zf-main-type" onchange="_zimniOnMainChange(this)" title="مرکزی ضمنی" style="${_zimniTypeSelCss()}">`
    + `<option value="" ${!sel ? 'selected' : ''}>— مرکزی ضمنی —</option>${opts}`
    + `<option value="${_ZIMNI_TYPE_ADD}">➕ نئی قسم…</option></select>`;
}
function _zimniSubSelectHTML(main, sel) {
  const E = (v) => (typeof esc === 'function') ? esc(v) : String(v == null ? '' : v);
  const subs = main ? _zimniSubsFor(main) : [];
  const opts = subs.map(s => `<option value="${E(s)}" ${s === sel ? 'selected' : ''}>${E(s)}</option>`).join('');
  return `<select id="zf-sub-type" onchange="_zimniOnSubChange(this)" title="ذیلی ضمنی" style="${_zimniTypeSelCss()}">`
    + `<option value="" ${!sel ? 'selected' : ''}>— ذیلی ضمنی —</option>${opts}`
    + `<option value="${_ZIMNI_TYPE_ADD}">➕ نئی قسم…</option></select>`;
}
function _zimniSetHead(v) { try { const hi = document.getElementById('zf-head-in'); if (hi) hi.value = v || 'رپورٹ ضمنی'; } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ } }
function _zimniRebuildSub(main, selSub) {
  const wrap = document.getElementById('zf-sub-wrap'); if (!wrap) return;
  wrap.innerHTML = _zimniSubSelectHTML(main, selSub || '');
  if (selSub) _zimniSetHead(selSub);
  _zimniApplyTitle(selSub || '');       // v552: ذیلی نہ ہو تو اصل سرخی
}
function _zimniOnMainChange(sel) {
  if (sel.value === _ZIMNI_TYPE_ADD) {
    const name = ((typeof prompt === 'function' ? prompt('نئی مرکزی ضمنی کا نام:') : '') || '').trim();
    if (name) {
      const c = _zimniCustomTypes(); c.main = c.main || []; if (c.main.indexOf(name) < 0) c.main.push(name); _zimniSaveCustomTypes(c);
      const w = document.createElement('span'); w.innerHTML = _zimniMainSelectHTML(name);
      if (sel.parentNode) sel.parentNode.replaceChild(w.firstElementChild, sel);
      _zimniRebuildSub(name, '');
    } else { sel.value = ''; }
    return;
  }
  _zimniRebuildSub(sel.value, '');
  try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}
function _zimniOnSubChange(sel) {
  const main = (document.getElementById('zf-main-type') || {}).value || '';
  if (sel.value === _ZIMNI_TYPE_ADD) {
    const name = ((typeof prompt === 'function' ? prompt('نئی ذیلی ضمنی کا نام:') : '') || '').trim();
    if (name) {
      const c = _zimniCustomTypes(); c.sub = c.sub || {}; c.sub[main] = c.sub[main] || []; if (c.sub[main].indexOf(name) < 0) c.sub[main].push(name); _zimniSaveCustomTypes(c);
      _zimniRebuildSub(main, name);
    } else { sel.value = ''; }
    return;
  }
  _zimniSetHead(sel.value);
  _zimniApplyTitle(sel.value);          // v552: سرخی = منتخب ذیلی ضمنی
  _zimniDirty = true; try { _zimniWriteDraft(); } catch (_) { /* agli dafa */ }
  try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._zimniMainSelectHTML = _zimniMainSelectHTML;
window._zimniSubSelectHTML = _zimniSubSelectHTML;
window._zimniOnMainChange = _zimniOnMainChange;
window._zimniOnSubChange = _zimniOnSubChange;

function _renderZimniEditor() {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const c = _zimniCase || {};
  const z = _zimniActive || {};
  const saved = z.content || {};
  const savedMain = (saved && saved.main_type) || '';   // مرکزی ضمنی
  const savedSub  = (saved && saved.sub_type)  || '';   // ذیلی ضمنی

  const savedBody = saved.bodyHtml ? _zimniMigrateCols(sanitizeHtml(saved.bodyHtml)) : _zimniDefaultBody(o, c);

  // چالان/اخراج jaisi settings — kaghaz, side margin, font list, button style —
  // sab report173 se (guess nahi)
  const paper = (typeof _ch173Paper !== 'undefined') ? _ch173Paper : 'legal';
  const side  = (typeof _ch173SideMargin === 'function') ? _ch173SideMargin() : '0.2cm';
  const sizes = (typeof R173_FONT_SIZES !== 'undefined')
    ? R173_FONT_SIZES : [8,9,10,10.5,11,12,14,16,18,20,22,24,26,28,36,48,72];
  const btn = (typeof _chBtn === 'function') ? _chBtn()
    : 'min-width:30px;height:28px;border:1px solid #ccc;border-radius:6px;background:#fff;color:#111;cursor:pointer;font-size:9.75pt;padding:0 7px;margin:0 1px;';
  const sep = '<span style="width:1px;height:22px;background:var(--border,#ccc);margin:0 4px;"></span>';
  const selCss = 'height:28px;border:1px solid var(--border,#ccc);border-radius:6px;background:var(--bg-card,#fff);color:var(--text-primary,#111);font-size:9.75pt;padding:0 6px;margin:0 1px;cursor:pointer;';

  area.innerHTML = `
  <style>${(typeof _ch173CSS === 'function') ? _ch173CSS() : ''}${_zimniFormCSS()}${(typeof _zaFormCSS === 'function') ? _zaFormCSS() : ''}</style>
  <div style="display:flex;flex-direction:column;height:100%;direction:rtl;">
    <!-- Topbar — report173 jaisa (chips patti cursor upar jane par nazar aati hai) -->
    <div class="no-print" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);flex-wrap:wrap;background:var(--bg-secondary);">
      <button type="button" class="btn btn-secondary btn-sm" onclick="_zimniBackToList()" title="اس مقدمے کی تمام ضمنیات">← فہرست</button>
      <!-- v553: لیگل/A4 کا انتخاب یہاں سے ہٹا — پرنٹ کے وقت پوچھا جاتا ہے -->
      <!-- مرکزی ضمنی — دائیں کونے میں (تھانہ کے اوپر) -->
      ${_zimniMainSelectHTML(savedMain)}
      <!-- "رپورٹ ضمنی" کا خانہ hidden — قدر save کے لیے (فہرست کا عنوان نہ ٹوٹے) -->
      <input id="zf-head-in" type="hidden" value="${esc(((saved && saved.head) || savedSub || 'رپورٹ ضمنی'))}">
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
        <button onmousedown="event.preventDefault()" onclick="_zimniFmt('insertOrderedList')" title="نمبر والی فہرست" style="${btn}font-size:8.25pt;">1.</button>
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
        ${sep}
        <!-- ── نیچے والا تیرتا (floating) toolbar اب مکمل یہیں (اوپر) شامل ── -->
        <button onmousedown="event.preventDefault()" onclick="dioFontStep(1)" title="فونٹ بڑا" style="${btn}">A+</button>
        <button onmousedown="event.preventDefault()" onclick="dioFontStep(-1)" title="فونٹ چھوٹا" style="${btn}font-size:8.25pt;">A−</button>
        <button onmousedown="event.preventDefault()" onclick="dioSetDir('rtl')" title="اردو — دائیں سے بائیں (RTL)" style="${btn}font-weight:800;">؈</button>
        <button onmousedown="event.preventDefault()" onclick="dioSetDir('ltr')" title="English — Left to Right (LTR)" style="${btn}font-weight:800;direction:ltr;">EN</button>
        ${sep}
        <button id="zf-save-btn" class="btn btn-primary btn-sm dio-modbtn" onclick="_saveZimni(false,true)" title="${z.id ? 'اپ ڈیٹ' : 'محفوظ کریں'} (Ctrl+S) — ضمنی کھلی رہے گی">💾 ${z.id ? 'اپ ڈیٹ' : 'محفوظ'}</button>
        <button type="button" class="btn btn-secondary btn-sm" data-dio-print onclick="_printZimniCurrent()" title="پرنٹ (Ctrl+P)">🖨️ پرنٹ</button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="_shareZimniCurrent()" title="شیئر — PDF / Word">📤 شیئر</button>
        <span style="display:flex;flex-direction:column;line-height:1.35;align-self:center;">
          <span id="zf-updated" style="font-size:8.5pt;color:var(--text-muted);white-space:nowrap;"></span>
          <span id="zf-autosave" style="font-size:8pt;color:var(--text-muted);white-space:nowrap;"></span>
        </span>
      </div>
      <!-- ذیلی ضمنی — بائیں کونے میں (منتخب مرکزی کے مطابق) -->
      <span id="zf-sub-wrap">${_zimniSubSelectHTML(savedMain, savedSub)}</span>
    </div>

    <!-- Document — poora editable (har jaga likha ja sake), kaghaz asal naap par -->
    <div style="flex:1;overflow:auto;min-height:0;padding:16px;background:var(--bg-tertiary);">
      <div id="ch173-doc" class="zf-editor" contenteditable="true" spellcheck="false" style="
        width:${paper==='a4'?'8.27in':'8.5in'};max-width:none;
        min-height:${paper==='a4'?'11.7in':'13in'};margin:0 auto;
        padding:1cm ${side};background:#fff;
        box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:4px;
        line-height:1.4;box-sizing:border-box;">${savedBody}</div>
    </div>
  </div>`;

  // ═══ report173 ke asal functions — behavior bilkul چالان/اخراج jaisa ═══
  try { if (typeof _ch173FullPage === 'function') _ch173FullPage(area); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
  try { if (typeof _ch173BlockFloatBar === 'function') _ch173BlockFloatBar(); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
  setTimeout(() => {
    try { if (typeof _ch173FullPage === 'function') _ch173FullPage(area); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
    try { if (typeof _ch173FitPaper === 'function') _ch173FitPaper(); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
    try { _zimniBindKeys(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    try { _dioBindCtrlS(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }                                                  // Ctrl+S = اپ ڈیٹ                                                 // Tab/Enter/Ctrl+BIU/paste
    // v553: پرانی ضمنی کے متن کے فونٹ سائز معیاری 14pt (سرخیاں اور افسر کے نئے چنے ہوئے سائز جوں کے توں)
    try { const d0 = _zimniDoc(); if (d0 && typeof dioNormFonts === 'function') d0.querySelectorAll('.zf-body, .zf-actbody').forEach(x => dioNormFonts(x)); } catch (_) { /* ضمنی */ }
    // ملزمان لوڈ کر کے بنام کے آگے خود لگا دو (▾ سے unselect ہو سکتا ہے)
    try { _zimniLoadAccused().then(() => { try { _zimniFillBanam(false); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } }); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }                                              // بنام ▾ کی فہرست
    try { if (typeof _ch173BrushOff === 'function') _ch173BrushOff(); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
    try { if (typeof _ch173BindBrush === 'function') _ch173BindBrush(); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }     // format painter
    try { if (typeof _ch173BindCellPick === 'function') _ch173BindCellPick(); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
    try { if (typeof _ch173FocusMode === 'function') _ch173FocusMode(true); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ } // chips peek
    try { if (typeof _ch173WatchFit === 'function') _ch173WatchFit(); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
    try { _zimniBindFindReplace(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }                                          // Ctrl+F / Ctrl+H
    try { _zimniColResize(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    try { if (saved && saved.saved_at) _zimniStampUpdated(saved.saved_at); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    // v552: خودکار مسودہ · سرخی = ذیلی ضمنی · نیچے کی تاریخ = کالم 1 کی تاریخ
    try { _zimniWatchEdits(); } catch (_) { /* ikhtiyari qadam */ }
    try { if (savedSub) _zimniApplyTitle(savedSub); } catch (_) { /* ikhtiyari qadam */ }
    try { _zimniSyncSignDate(); } catch (_) { /* ikhtiyari qadam */ }
    try {
      const d1 = _zimniDoc();
      if (d1 && !d1._zfDateBound) {
        d1._zfDateBound = true;
        d1.addEventListener('input', (ev) => {
          if (ev.target && ev.target.closest && ev.target.closest('td.zf-c-action')) {
            clearTimeout(d1._zfDateT); d1._zfDateT = setTimeout(() => { try { _zimniSyncSignDate(); } catch (_) { /* agli dafa */ } }, 300);
          }
        });
      }
    } catch (_) { /* ikhtiyari qadam */ }
    // خانے کی ناپ + اضافی متن نیچے (چالان کا اصل نظام)
    try { _zimniLayout(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    try { _zimniEnsureClosing(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }   // اختتامی سطر (پرانی ضمنیوں کے لیے)
    try { _zimniFixClose(_zimniDoc()); } catch (_) { /* v558: «۔» */ }
    try { _zimniStartNumbers(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }          // خودکار نمبر — ہر حال میں چالو
    try { _zimniBindBlockKeys(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }          // BLOCK نظام — سیریل پر Enter = نیا block
    // ضمنی نمبر بدلتے ہی نیچے "نمبر شمار" بھی وہی ہو جائے
    try {
      const d0 = _zimniDoc();
      if (d0 && !d0._zfSerBound) {
        d0._zfSerBound = true;
        d0.addEventListener('input', (ev) => {
          try {
            /* ضمنی نمبر صرف محفوظ کرنے کے لیے پڑھا جاتا ہے */
          } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
          clearTimeout(d0._zfAlignT);
          d0._zfAlignT = setTimeout(() => {
            try { _zimniAlignCols(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }   // تاریخ + سیریل کو جناب عالیٰ کے سامنے
            try { _zimniPlaceholders(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }  // کالم 1 کا "بوقت" اشارہ
            try { _zimniFillScreen(); } catch (_) { /* ikhtiyari qadam */ }                            // v558: لکیریں کاغذ کے نیچے تک
          }, 250);
        });
      }
    } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    [250, 900, 1800].forEach(ms => setTimeout(() => {
      try { _zimniLayout(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      try { _zimniAlignCols(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }   // ایڈیٹر میں تاریخ + سیریل "1" کی سیدھ
      try { _zimniPlaceholders(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }  // کالم 1 کا "بوقت" اشارہ
    }, ms));                                                // table ki lakeerein moveable
    // Cursor ke mutabiq font dropdown + B/I/U ki halat khud badle (MS Word jaisa)
    try {
      if (!window._zfSyncBound) {
        window._zfSyncBound = true;
        document.addEventListener('selectionchange', () => { try { _zimniSyncFmtBtns(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } });
      }
    } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
    if (typeof applyMicButtons === 'function') applyMicButtons(area);
  }, 60);
}

// ═══════════════════════════════════════════════════════════════
//  MS Word جیسا Find (Ctrl+F) اور Replace (Ctrl+H) — editor (#ch173-doc)
// ═══════════════════════════════════════════════════════════════
let _zfrIdx = -1;

function _zimniBindFindReplace() {
  // GHAIR-FAAAL (no-op): ab Ctrl+H / Ctrl+F ka kaam poore system ka
  // waahid handler (editor-tools.js → dioFindReplace, MS Word ki tarah
  // "replace with" wala panel) sambhalta hai. Yahan bind na karo warna
  // do panel takra jate the.
  return;
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
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
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
    try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
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
  try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
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
    "direction:rtl;padding:8px;display:flex;flex-direction:column;gap:6px;font-family:'Jameel Noori Nastaleeq';min-width:300px;";
  const inp = "flex:1;min-width:0;border:1px solid var(--border,#cbd5e1);border-radius:6px;padding:5px 8px;font-size:10.5pt;font-family:'Jameel Noori Nastaleeq';direction:rtl;outline:none;";
  const b = "border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg-secondary,#f8fafc);cursor:pointer;padding:5px 9px;font-size:9.75pt;font-family:'Jameel Noori Nastaleeq';";
  box.innerHTML = `
    <div style="display:flex;gap:6px;align-items:center;">
      <input id="zfr-find" placeholder="تلاش کریں…" style="${inp}">
      <span id="zfr-count" style="font-size:8.25pt;color:var(--text-muted);min-width:38px;text-align:center;">0/0</span>
      <button id="zfr-prev" title="پچھلا" style="${b}">▲</button>
      <button id="zfr-next" title="اگلا" style="${b}">▼</button>
      <button id="zfr-x" title="بند" style="${b}">✕</button>
    </div>
    <div id="zfr-rep-row" style="display:${withReplace ? 'flex' : 'none'};gap:6px;align-items:center;">
      <input id="zfr-rep-in" placeholder="بدلیں…" style="${inp}">
      <button id="zfr-rep1" style="${b}">بدلیں</button>
      <button id="zfr-repall" style="${b}">سب بدلیں</button>
    </div>
    <label style="display:flex;align-items:center;gap:5px;font-size:9pt;color:var(--text-secondary);">
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
  try { if (typeof _ch173Today === 'function') return _ch173Today(); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
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
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  // Har woh hissa jis ki apni naap CSS mein likhi hai — usay seedha naap do
  // (عنوان "رپورٹ ضمنی" apni 20pt par rehta hai; usay badalna ho to matn chun kar badlein)
  const HISSE = ['.zf-formno', '.zf-zila', '.zf-meta', '.zf-lbl', '.zf-ln',
                 '.zf-tbl th', '.zf-tbl td', '.zf-bl', '.zf-bdyln', '.zf-body'].join(', ');
  try { doc.querySelectorAll(HISSE).forEach(el => { el.style.fontSize = pt + 'pt'; }); } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._zimniFontToDoc = _zimniFontToDoc;

// Dropdown se font — matn chuna ho to sirf usi par, warna poore safhe par
function _zimniSetFont(val) {
  const pt = parseFloat(val);
  if (!pt || isNaN(pt)) return;
  try { if (typeof _ch173RestoreRange === 'function') _ch173RestoreRange(); } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  const fs = document.getElementById('ch173-font-sel');
  if (fs) fs.value = String(pt);                       // dropdown wapas na palte
  try {
    if (typeof _ch173FontToSelection === 'function' && _ch173FontToSelection(pt)) {
      if (typeof _ch173SaveRange === 'function') _ch173SaveRange();
      try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      return;
    }
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
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
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._zimniSyncFmtBtns = _zimniSyncFmtBtns;

// Formatting lagao + button ki halat foran update
function _zimniFmt(cmd) {
  try { if (typeof _ch173Fmt === 'function') _ch173Fmt(cmd); }
  catch (_) { try { document.execCommand(cmd, false, null); } catch (__) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ } }
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
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
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
          // v553: صرف پچھلی طرف (جفت صفحہ) — اوپر ایک سطر + مثلث (2pt وتر)
          if ((p + 1) % 2 !== 0) break;
          const baad = t.node.splitText(off);
          const gap = document.createElement('span');
          gap.className = 'dio-bindgap';
          t.node.parentNode.insertBefore(gap, baad);
          daale.push(gap);
          const tri = document.createElement('span');
          tri.className = 'zf-bindmark';
          t.node.parentNode.insertBefore(tri, baad);
          daale.push(tri);
        } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
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
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  const kaam = ((paper === 'a4') ? 11.7 : 13) * IN - padY;      // ایک صفحے کی کام کی اونچائی
  if (kaam < 200) return;
  try {
    const dRect = doc.getBoundingClientRect();
    const tRect = table.getBoundingClientRect();
    const scale = (doc.offsetHeight && dRect.height) ? (dRect.height / doc.offsetHeight) : 1;
    let padT = 0;
    try { padT = parseFloat(getComputedStyle(doc).paddingTop) || 0; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
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
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._zimniFitTable = _zimniFitTable;

// v541: کالم 2 کا پرانا خودکار نمبر شمار (_zimniParas) ہٹا دیا — صرف ہٹائے گئے خودکار نظام میں استعمال ہوتا تھا۔

// پرانی محفوظ شدہ ضمنیوں میں اختتامی سطر اور دستخط کا خانہ نہ ہو تو لگا دو
function _zimniEnsureClosing() {
  const doc = _zimniDoc();
  if (!doc) return;
  // ═══ BLOCK نظام ═══ اختتام + دستخط پہلے سے .zf-endrow میں ہیں — صرف بائیں سیدھ
  //  یقینی بناؤ اور واپس (تمہید کی قطار میں غلطی سے اختتام نہ لگے)۔
  if (doc.querySelector('tr.zf-blk')) {
    try {
      doc.querySelectorAll('.zf-signblk, .zf-sign, .zf-signdate, [data-k="io_sign"], [data-k="io_date"]').forEach(el => {
        el.style.setProperty('text-align', 'left', 'important');
        el.style.setProperty('text-align-last', 'left', 'important');
      });
    } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
    return;
  }
  const cell = doc.querySelector('td.zf-c-body');
  if (!cell) return;
  // BUG FIX: purani محفوظ ضمنیوں mein تفتیشی ka naam kabhi RIGHT-align reh jata tha.
  // Rule: signature hamesha LEFT border ke sath. Har render par force LEFT karo —
  // ye editor mein foran theek kar deta hai, aur save par HTML mein bhi persist ho
  // jata hai (phir print bhi LEFT). Purani inline right-align ko override karta hai.
  try {
    // کلاس اور data-k دونوں پکڑو — پرانی محفوظ ضمنیوں میں کلاس مختلف ہو سکتی ہے
    cell.querySelectorAll('.zf-signblk, .zf-sign, .zf-signdate, [data-k="io_sign"], [data-k="io_date"]').forEach(el => {
      el.style.setProperty('text-align', 'left', 'important');
      el.style.setProperty('text-align-last', 'left', 'important');
    });
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  if (cell.querySelector('.zf-close')) return;   // closing pehle se maujood — sirf normalize kiya
  const E = (v) => (typeof esc === 'function') ? esc(v == null ? '' : String(v)) : String(v || '');
  const io = (typeof getIOSignLine === 'function') ? getIOSignLine() : '';
  const wrap = document.createElement('div');
  wrap.innerHTML =
    '<div class="zf-close" data-k="close">رپورٹ ضمنی مرتب ہو کرارسال خدمت ہے۔</div>' +
    '<div class="zf-signblk" style="text-align:left !important;">' +
      '<div class="zf-gap"><br></div><div class="zf-gap"><br></div>' +
      '<div class="zf-sign" data-k="io_sign" style="text-align:left !important;display:block;text-decoration:none;">' + E(io) + '</div>' +
      '<div class="zf-signdate" data-k="io_date" style="text-align:left !important;display:block;">' + E(_zimniToday()) + '</div>' +
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
function _zimniStartNumbers() {
  const doc = _zimniDoc();
  if (!doc) return;
  // ═══ خودکار نمبر بند (MANUAL موڈ) ═══ افسر کی درخواست پر کالم 2 اب مکمل
  //  دستی ہے — سسٹم خود نمبر نہ لگائے، نہ افسر کے لکھے کو چھیڑے۔ صرف یقینی
  //  بناؤ کہ نمبروں کا خانہ editable ہے (تاکہ افسر خود لکھ سکے)۔
  try {
    const _n = doc.querySelector('.zf-nums');
    if (_n) {
      _n.setAttribute('contenteditable', 'true');
      if (!_n.querySelector('.zf-num') && !String(_n.textContent||'').trim()) {
        const _d = document.createElement('div'); _d.className = 'zf-num'; _d.textContent = '1';
        _n.appendChild(_d);
      }
    }
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  // v541: پرانا خودکار نمبرنگ نظام (جو یہاں return کے بعد بند پڑا تھا) افسر کے
  //   حکم پر ہٹا دیا گیا — کالم 2 مکمل دستی ہے۔ ضرورت ہو تو GitHub کی تاریخ میں موجود۔
}
window._zimniStartNumbers = _zimniStartNumbers;

// واپسی کی قدر تشخیص کے لیے — کنسول میں _zimniAutoNumbers() چلا کر
// فوراً پتا چل جاتا ہے کہ کہاں رکا: { doc, cell, paras, numbers }
// ═══ berooni + androoni کے نمبر ایک ہی مسلسل سلسلے میں ═══
// berooni کے پیراگراف 1..N، پھر androoni کے N+1، N+2 … (نمبر جاری رہتا ہے)
function _zimniNumberAll() {
  return null;   // ═══ خودکار نمبر بند (MANUAL موڈ) ═══
  // v541: پرانا خودکار حصہ ہٹا دیا (افسر کا حکم) — نام اور واپسی وہی، بلانے والے نہ ٹوٹیں
}
window._zimniNumberAll = _zimniNumberAll;

function _zimniAutoNumbers() {
  return { ok: true, manual: true };   // ═══ خودکار نمبر بند (MANUAL موڈ) ═══
  // v541: پرانا خودکار حصہ ہٹا دیا (افسر کا حکم) — نام اور واپسی وہی، بلانے والے نہ ٹوٹیں
}
window._zimniAutoNumbers = _zimniAutoNumbers;

// ▾ بٹن — بنام والی سطر کے برابر
function _zimniAlignSerial() {
  return;   // ═══ خودکار سیدھ بند (MANUAL موڈ) ═══ افسر خود نمبر لکھتا ہے
  // v541: پرانا خودکار حصہ ہٹا دیا (افسر کا حکم) — نام وہی، بلانے والے نہ ٹوٹیں
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
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  const kaam = ((paper === 'a4') ? 11.7 : 13) * IN - padY;   // ایک صفحہ
  if (kaam < 100) return false;
  // اندرونی کا اپنا حصہ ناپ سے نکال دو (ورنہ وہ خود ہی شرط پوری کرتا رہے گا)
  let apna = 0;
  try {
    const wrap = doc.querySelector('.zf-androoni');
    if (wrap) apna = wrap.offsetHeight || 0;
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
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
      } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
      if (khali) {
        try { _zimniMoveClosing(null); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }   // اختتامی خانہ واپس بیرونی میں
        wrap.remove();
      }
    }
    return;
  }
  if (wrap) { try { _zimniMoveClosing(wrap); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } return; }

  // ── اندرونی کا فارم — اصل ماڈیول سے ──
  if (typeof _zaDefaultBody !== 'function') {
    try {
      if (!window._zaMissingWarned) {
        window._zaMissingWarned = true;
        showToast('اندرونی ضمنی کا ماڈیول (zimni-androoni.js) لوڈ نہیں ہوا', 'warn', 6000);
      }
    } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
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
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  doc.appendChild(wrap);
  try { _zimniMoveClosing(wrap); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  try { if (typeof _zaAutoNumbers === 'function') _zaAutoNumbers(); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
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
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._zimniMoveClosing = _zimniMoveClosing;

function _zimniLayout() {
  // ═══ BLOCK نظام ═══ نئی block ساخت میں قطاریں خود مواد کے مطابق اونچی ہوتی
  //  ہیں اور ٹیبل قدرتی طور پر صفحہ در صفحہ بٹتا ہے — پرانا fit/androoni/height
  //  نظام یہاں نہ چلاؤ (ورنہ ہر قطار پر 18cm/height لگ کر صفحے ضائع ہوتے)۔
  try { const d = _zimniDoc(); if (d && d.querySelector('tr.zf-blk')) { _zimniFillScreen(); return; } } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  try { _zimniFitTable(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }      // ٹیبل کم از کم پورا صفحہ بھرے
  try { _zimniEnsureAndrooni(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }  // 2 صفحوں سے آگے → اندرونی
  try { _zimniNumberAll(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }       // berooni + androoni مسلسل نمبر + ▾ سیدھ
}
window._zimniLayout = _zimniLayout;

// ═══ v558 (افسر کی شکایت، 22 اکتوبر 2026): «بیرونی ضمنی میں کالم 2 کی لکیریں کاغذ کے نیچے
//  تک نہیں آتیں — وہیں رک جاتی ہیں جہاں آخری تحریر (تفتیشی افسر کا خانہ) ہے۔»
//  وجہ: ایڈیٹر (اسکرین) میں BLOCK ضمنی کی قطاریں صرف مواد جتنی اونچی تھیں؛ چھپائی میں خالی
//  قطار (tr.zf-fill) لگتی ہے مگر اسکرین پر نہیں۔ اب اسکرین پر بھی آخری قطار (اختتام + دستخط)
//  کاغذ کے نیچے (حاشیے) تک پھیلتی ہے — کھڑی لکیریں نیچے تک۔ چھپائی کا حساب یہ اونچائی پہلے
//  ہٹا دیتا ہے (اپنا ناپ)، اس لیے کاغذ پر کوئی فرق نہیں۔ ═══
function _zimniFillScreen() {
  const doc = _zimniDoc();
  const tbl = doc && doc.querySelector('table.zf-tbl');
  const end = tbl && tbl.querySelector('tbody > tr.zf-endrow');
  if (!end || !tbl.querySelector('tr.zf-blk')) return 0;
  const tds = [].slice.call(end.children);
  tds.forEach(td => { td.style.height = ''; });
  // موبائل کا «فارم» منظر (کارڈ) — وہاں لکیریں ہی نہیں؛ صرف «کاغذ» منظر میں
  try { if (!tds.length || getComputedStyle(tds[0]).display !== 'table-cell') return 0; } catch (_) { return 0; }
  const dr = doc.getBoundingClientRect();
  const scale = (doc.offsetHeight && dr.height) ? (dr.height / doc.offsetHeight) : 1;
  let pb = 0;
  try { pb = parseFloat(getComputedStyle(doc).paddingBottom) || 0; } catch (_) { pb = 0; }
  const bottom = doc.offsetHeight - pb;                                       // کاغذ کے کام والے حصے کا نیچے
  const tb = (tbl.getBoundingClientRect().bottom - dr.top) / (scale || 1);    // ٹیبل کا نیچے
  const room = Math.floor(bottom - tb - 1);
  if (room > 4) {
    const h = end.offsetHeight + room;
    tds.forEach(td => { td.style.height = h + 'px'; });
    return room;
  }
  return 0;
}
window._zimniFillScreen = _zimniFillScreen;

// ── ایڈیٹر میں کالم 1 (تاریخ) اور کالم 2 (سیریل) کو حالاتِ تفتیش کی پہلی سطر
//    "جناب عالیٰ! …" (.zf-body) کے سامنے لاؤ — بالکل ویسا جیسا پرنٹ میں ہوتا ہے،
//    تاکہ جو اسکرین پر نظر آئے وہی چھپے۔ کالم 3 میں پہلے سرکار/بنام/مرتبہ آتی ہیں،
//    پھر .zf-body۔ نمبر/تاریخ کے div کا marginTop اتنا کرو کہ وہ .zf-body سے شروع ہوں۔
//    (جس خانے میں کرسر ہو اُسے مت چھیڑو — ورنہ ٹائپنگ کے دوران کرسر اچھلتا)۔
function _zimniAlignCols() {
  try {
    const doc = _zimniDoc(); if (!doc) return;
    if (doc.querySelector('tr.zf-blk')) return;   // BLOCK نظام — قطاریں خود سیدھ میں، alignment کی ضرورت نہیں
    const body = doc.querySelector('td.zf-c-body .zf-body'); if (!body) return;
    const bodyTop = body.getBoundingClientRect().top;
    const ae = document.activeElement;
    const nums = doc.querySelector('td.zf-c-serial .zf-nums');
    if (nums && !(ae && nums.contains(ae))) {
      nums.style.marginTop = '0px';
      const g = Math.round(bodyTop - nums.getBoundingClientRect().top);
      if (g > 0 && g < 3000) nums.style.marginTop = g + 'px';
    }
    const act = doc.querySelector('td.zf-c-action .zf-actbody');
    if (act && !(ae && act.contains(ae))) {
      act.style.marginTop = '0px';
      const g2 = Math.round(bodyTop - act.getBoundingClientRect().top);
      if (g2 > 0 && g2 < 3000) act.style.marginTop = g2 + 'px';
    }
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._zimniAlignCols = _zimniAlignCols;

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
        try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
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
          try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
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
          try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
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
  let s = String(html || '').replace(/<div[^>]*class="zfa?-(col|row)grip"[^>]*><\/div>/g, '');
  // v558: اسکرین کی عارضی چیزیں محفوظ نہ ہوں — آخری قطار کی «نیچے تک» اونچائی (_zimniFillScreen)
  //   اور اندرونی ضمنی کی گواہ-فہرست کا کوئی بچا ہوا نشان
  if (/zf-endrow/.test(s) && typeof document !== 'undefined') {
    try {
      const t = document.createElement('template'); t.innerHTML = s;
      t.content.querySelectorAll('tr.zf-endrow > td').forEach(td => { td.style.height = ''; if (!td.getAttribute('style')) td.removeAttribute('style'); });
      s = t.innerHTML;
    } catch (_) { /* jaisa hai waisa */ }
  }
  return s;
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
        try { ok = document.execCommand('insertText', false, TAB); } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
        if (!ok && typeof _ch173Insert === 'function') _ch173Insert(TAB);
        try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      }
      return;
    }

    // ENTER → براؤزر خود نئی سطر بنائے (کوئی preventDefault نہیں)
    if (e.key === 'Enter') { try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } return; }

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
    } catch (_) { /* share/clipboard na mile to koi baat nahi */ }
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
// v558 قاعدہ (پورا سسٹم): ایک سے زیادہ نام ہوں تو نمبر 1، 2 …؛ صرف ایک ہو تو «1» نہیں
function _zimniAccLine(nm, i, n) {
  const E = (v) => (typeof esc === 'function') ? esc(v == null ? '' : String(v)) : String(v || '');
  return '<div class="zf-acc"><span class="nm">' + ((n === 1) ? '' : (i + 1) + '\u06D4 ') + E(nm) + '</span></div>';
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
  cell.innerHTML = list.map((a, i) => _zimniAccLine((a.name || '').trim(), i, list.length)).join('');
  try { _zimniAutoNumbers(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
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
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }

  const box = document.createElement('div');
  box.id = 'zf-acc-menu';
  box.style.cssText =
    'position:fixed;z-index:99999;background:#fff;border:1px solid #0369a1;border-radius:10px;' +
    'box-shadow:0 10px 30px rgba(0,0,0,.28);direction:rtl;width:270px;max-width:92vw;' +
    'display:flex;flex-direction:column;max-height:min(60vh,340px);overflow:hidden;';
  const rows = list.map(a => {
    const nm = (a.name || '').trim();
    return `<label style="display:flex;align-items:center;gap:8px;padding:7px 6px;cursor:pointer;font-size:9.75pt;
              border-bottom:1px solid #f1f5f9;font-family:'Jameel Noori Nastaleeq';">
              <input type="checkbox" ${mine.has(nm) ? 'checked' : ''} value="${E(nm)}"> <span>${E(nm)}</span></label>`;
  }).join('');
  box.innerHTML = `
    <div style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:9pt;font-weight:700;color:#0369a1;
                font-family:'Jameel Noori Nastaleeq';background:#f8fafc;">ملزمان منتخب کریں</div>
    <div style="flex:1;overflow-y:auto;padding:4px 8px;min-height:0;">${rows}</div>
    <div style="display:flex;gap:6px;padding:8px;border-top:1px solid #e5e7eb;background:#f8fafc;flex-shrink:0;">
      <button id="zf-acc-ok" style="flex:1;padding:8px;border:none;border-radius:6px;background:#0369a1;color:#fff;
        cursor:pointer;font-size:9.75pt;font-weight:700;font-family:'Jameel Noori Nastaleeq';">✔ شامل کریں</button>
      <button id="zf-acc-x" style="padding:8px 12px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;
        cursor:pointer;font-size:9.75pt;font-family:'Jameel Noori Nastaleeq';">بند</button>
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
    if (cell) cell.innerHTML = picked.map((nm, i) => _zimniAccLine(nm, i, picked.length)).join('');
    box.remove();
    try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
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
  /* عنوانات کا اصول (پورا نظام، ہر کاغذ): مرکزی 20pt · ذیلی 16pt · تیسرا درجہ 14pt — چالان کے مطابق */
  #ch173-doc .zf-title{ font-size:20pt; font-weight:700; text-decoration:underline; text-underline-offset:5px; line-height:1.5; }
  /* ضلع … — ضمنی نمبر کی سیدھ میں (دونوں کی چوڑائی ایک: --zf-zcol) */
  #ch173-doc .zf-zila{ position:absolute; left:0; top:0; width:var(--zf-zcol,4.6cm);
    text-align:right; font-size:14pt; font-weight:normal; white-space:nowrap; unicode-bidi:plaintext; }

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
  #ch173-doc table.zf-tbl th{ border:1px solid #000; padding:6px 5px; font-size:14pt; font-weight:normal;
    text-align:center; line-height:1.5; vertical-align:middle; position:relative; }
  #ch173-doc table.zf-tbl th.zf-c-action{ font-size:14pt; }          /* row 1 کالم 1 — 14pt */
  /* row 1 کالم 2 — 12pt اور کھڑی لکھائی (چالان کے گواہان جیسی) */
  #ch173-doc table.zf-tbl th.zf-c-serial{ font-size:14pt; padding:3px 2px; vertical-align:middle; }
  /* AHEM: چالان کا اصول — writing-mode استعمال کرو، flex یا transform:rotate کبھی نہیں */
  #ch173-doc .zf-vert{
    writing-mode:vertical-rl; -webkit-writing-mode:vertical-rl;
    display:block; margin:0 auto; direction:rtl;
    white-space:nowrap; line-height:1.25; text-align:center; }
  #ch173-doc table.zf-tbl th.zf-c-from{ font-size:14pt; text-align:right; }   /* row 1 کالم 4 — دائیں (سائز: عنوانات کا اصول، 14pt) */
  /* v558: «کاغذ» منظر میں جدول جدول ہی رہے (موبائل کا عام «table = block» اصول نہیں؛ «فارم» منظر الگ) */
  html:not(.dio-mform) #ch173-doc table.zf-tbl{ display:table !important; overflow:visible !important; }
  /* ROW 2 (data) */
  #ch173-doc table.zf-tbl td{ border:1px solid #000; padding:8px 9px; font-size:14pt; vertical-align:top;
    line-height:1.5; text-align:justify; text-align-last:right; overflow-wrap:anywhere; word-break:break-word; position:relative; }
  /* کالم 1 (تاریخ و وقت کارروائی) — editable + justified (افسر خود لکھے) */
  #ch173-doc table.zf-tbl td.zf-c-action{ text-align:left; text-align-last:left; }
  #ch173-doc .zf-actbody{ display:block; min-height:1.6em; text-align:left; text-align-last:left; outline:none; direction:ltr; }
  /* کالم 1 — خالی ہو تو "بوقت" اشارہ (صرف ایڈیٹر میں؛ پرنٹ میں نہیں)۔ افسر وقت لکھے
     تو صرف اُس کا لکھا چھپتا ہے، خالی رہے تو کچھ نہیں (نہ "بوقت")۔ */
  #ch173-doc .zf-actbody.zf-ph::before{ content:'بوقت'; color:#9aa; }
  /* کالم 2 (سیریل نمبر) — editable + center (افسر خود لکھے، شروع میں 1) */
  #ch173-doc table.zf-tbl td.zf-c-serial{ text-align:center; text-align-last:center; }
  #ch173-doc .zf-nums{ outline:none; }
  /* قطار کی اونچائی JS (_zimniFitTable) حساب سے دیتا ہے — یہ صرف ابتدائی ناپ */
  #ch173-doc table.zf-tbl tbody td{ height:18cm; }
  /* ═══ BLOCK نظام ═══ block/تمہید/اختتام کی قطاروں کی اونچائی مواد کے مطابق
     (18cm نہ ہو ورنہ ہر قطار پورا صفحہ لے لے)۔ ہر block ایک ساتھ رہے۔ */
  #ch173-doc table.zf-tbl tbody tr.zf-blk td,
  #ch173-doc table.zf-tbl tbody tr.zf-prerow td,
  #ch173-doc table.zf-tbl tbody tr.zf-endrow td{ height:auto; vertical-align:top;
    /* blocks کے درمیان افقی لکیر نہ ہو (پرنٹ + ایڈیٹر دونوں) — صرف عمودی کالم
       لکیریں اور ہیڈر کی لکیر باقی رہیں */
    border-top:none !important; border-bottom:none !important; }
  #ch173-doc table.zf-tbl tbody tr.zf-blk{ break-inside:avoid; page-break-inside:avoid; }
  /* v555 (افسر کا قاعدہ، 21 اکتوبر 2026): «مرتبہ» (IO کا نام) کی سطر کے نیچے صرف معمولی
     جگہ — اور کالم 1 (تاریخ) و کالم 2 (نمبر) «جناب عالیٰ» کی پہلی سطر کی بالکل سیدھ میں:
     تینوں خانوں کی اوپر کی جگہ ایک (td کی padding)، حالات (.zf-body) پر الگ اوپری حاشیہ نہیں۔
     اندراجات کے درمیان پہلے جتنا فاصلہ (اگلے اندراج کے تینوں خانوں پر برابر)۔ */
  #ch173-doc table.zf-tbl tbody tr.zf-prerow td{ padding-bottom:0; }
  #ch173-doc table.zf-tbl tbody tr.zf-prerow .zf-bl-mor{ margin-bottom:0; }
  #ch173-doc table.zf-tbl tbody tr.zf-prerow + tr.zf-blk td{ padding-top:6px; }
  #ch173-doc table.zf-tbl tbody tr.zf-blk + tr.zf-blk td{ padding-top:16px; }
  #ch173-doc table.zf-tbl tbody tr.zf-blk .zf-body{ margin-top:0; }
  #ch173-doc table.zf-tbl tbody tr.zf-blk .zf-body + .zf-body{ margin-top:8px; }   /* Enter سے بنا اگلا پیراگراف — پہلے جتنا فاصلہ */
  /* v555: ٹیبل کی کھڑی لکیریں صفحے کے نیچے (حاشیے) تک — پرنٹ کا حساب آخری صفحے کے
     آخر میں (اور جو اندراج پورا اگلے صفحے پر جائے اُس سے پہلے) یہ خالی قطار لگاتا ہے */
  #ch173-doc table.zf-tbl tbody tr.zf-fill td{ height:auto; padding:0 !important;
    border-top:none !important; border-bottom:none !important; }
  /* v555: محفوظ کرتے وقت یہی تاریخ/نمبر پہلے سے ہو تو درستی کا خانہ نمایاں (چند سیکنڈ) */
  #ch173-doc .zf-dupmark{ outline:2px solid #dc2626 !important; outline-offset:2px; background:#fee2e2 !important; }
  @media print{ #ch173-doc .zf-dupmark{ outline:none !important; background:none !important; } }
  /* کالم 2 — ہر block کا اپنا سیریل نمبر */
  #ch173-doc .zf-nums{ display:block; }
  #ch173-doc .zf-num{ display:block; text-align:center; line-height:1.5; }
  #ch173-doc td.zf-c-serial .zf-num{ min-height:1.4em; outline:none; }
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
  #ch173-doc .zf-bindmark, #ch173-doc .dio-bindgap{ display:none; }
  /* باہر کی دائیں، بائیں اور نیچے کی لکیریں نہیں */
  #ch173-doc .zf-tbl tr > th:first-child, #ch173-doc .zf-tbl tr > td:first-child{ border-right:none; }
  #ch173-doc .zf-tbl tr > th:last-child,  #ch173-doc .zf-tbl tr > td:last-child{ border-left:none; }
  #ch173-doc .zf-tbl tbody td{ border-bottom:none; }
  /* body cell */
  #ch173-doc .zf-bl{ margin-bottom:6px; font-size:14pt; line-height:1.5; position:relative; }
  #ch173-doc .zf-bdyln{ display:inline; border:none; outline:none; }
  /* تفتیشی افسر — بولڈ + انڈر لائن */
  #ch173-doc .zf-io{ font-weight:bold; text-decoration:underline; text-underline-offset:3px; }
  /* مرتبہ (IO/تفتیشی افسر) کی سطر — بائیں سیدھ، بائیں بارڈر کے ساتھ (user hidayat) */
  #ch173-doc .zf-bl-mor{ text-align:left !important; }
  /* ہر پیراگراف کے درمیان ایک سطر کا فاصلہ (مزید Enter سے بڑھایا جا سکتا ہے) */
  #ch173-doc .zf-body > div, #ch173-doc .zf-body > p{ margin:0 0 1em 0; }
  /* ── اندرونی ضمنی — ہمیشہ نئے صفحے سے (بیرونی 2 صفحوں سے آگے جائے تو) ── */
  #ch173-doc .zf-androoni{ margin-top:1.25em; }
  @media print{
    #ch173-doc .zf-androoni{ break-before:page !important; page-break-before:always !important;
      margin-top:0 !important; }
  }
  /* ── اختتامی سطر — درمیان میں ── */
  #ch173-doc table.zf-tbl tbody tr.zf-endrow td{ padding-top:0; }   /* v558: اختتامی سطر کے اوپر کی جگہ پہلے سے آدھی */
  #ch173-doc .zf-close{ margin-top:0.5em; font-size:14pt; line-height:1.5;
    text-align:center; text-align-last:center; outline:none; }
  /* دستخط کا خانہ — دستاویز کے اختتام پر IO (تفتیشی افسر/subscriber) کا نام
     اور تاریخ۔ چالان کی طرح: بائیں سیدھ (LEFT)، bold، مگر انڈر لائن نہیں۔ */
  #ch173-doc .zf-signblk{ font-size:14pt; line-height:1.5; text-align:left !important; }
  #ch173-doc .zf-gap{ min-height:1.5em; }
  #ch173-doc .zf-sign{ font-weight:bold; text-decoration:none !important;
    outline:none; text-align:left !important; display:block; }
  #ch173-doc .zf-signdate{ outline:none; text-align:left !important; display:block; }
  /* پرانی محفوظ ضمنیوں کے لیے — کلاس کچھ بھی ہو، IO نام و تاریخ data-k سے بھی بائیں */
  #ch173-doc [data-k="io_sign"], #ch173-doc [data-k="io_date"]{
    text-align:left !important; text-align-last:left !important; display:block; }
  #ch173-doc .zf-body{ margin-top:8px; font-size:14pt; line-height:1.5;
    text-align:justify; text-align-last:right; outline:none; white-space:pre-wrap; }
  /* v555 (افسر کی شکایت، 21 اکتوبر 2026): «IO کے نام/عہدہ/تھانہ والی سطر سے اوپر کے
     پیراگراف میں انگریزی عہدہ (ASI) لکھنے کے بعد اردو دائیں چلی جاتی ہے اور عہدہ بائیں۔»
     وجہ: پورے سسٹم کا «سطر کا رُخ اُس کے پہلے حرف سے» (unicode-bidi:plaintext) — نیا
     پیراگراف انگریزی عہدے سے شروع ہو تو پوری سطر بائیں سے دائیں (LTR) بن جاتی تھی۔
     ضمنی اردو دستاویز ہے: ہر پیراگراف کا بنیادی رُخ دائیں سے بائیں (RTL)؛ انگریزی الفاظ
     اپنی جگہ بائیں سے دائیں ہی رہتے ہیں۔ افسر خود EN / ؈ سے کسی پیراگراف کا رُخ دے (dir)
     تو وہی چلے گا۔ */
  #ch173-doc .zf-body:not([dir]), #ch173-doc .zf-body > div:not([dir]), #ch173-doc .zf-body > p:not([dir]),
  #ch173-doc .zfa-body:not([dir]), #ch173-doc .zfa-body > div:not([dir]), #ch173-doc .zfa-body > p:not([dir]),
  #ch173-doc table.zf-tbl td.zf-c-body:not([dir]), #ch173-doc .zf-close:not([dir]),
  #ch173-doc .zf-signblk:not([dir]), #ch173-doc .zf-signblk > div:not([dir]),
  #ch173-doc.zf-editor:not([dir]){
    direction:rtl !important; unicode-bidi:isolate !important; }

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
    background:#eef6ff; color:#0369a1; cursor:pointer; font-size:9pt; font-weight:400; }
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
    font-family:'Jameel Noori Nastaleeq' !important;
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
  const wPlace   = E(c.place_of_occurrence || c.jaye_waqoia || ''); // مقام وقوعہ — occurrence_place ہٹا دیا (اب صرف "بحد" خانے میں آتا ہے)
  const behad    = E(c.behad || c.occurrence_place || c.distance || c.samt || ''); // بحد — نئے فارم کی "بحد" فیلڈ (occurrence_place) سے
  const compl    = E(c.complainant_name || c.complainant || '');
  const serial   = E(z.serial_no || '');
  const ioE      = E(io);
  // جرم — دفعات اور "ت پ" الگ الگ (ت پ بائیں کنارے پر)
  let jBody = (c.section_of_law || '').trim();   // صرف دفعات (v544)
  let jSuf  = 'ت پ';
  try {
    if (typeof _ch173JurmParts === 'function') {
      const jp = _ch173JurmParts(c.section_of_law);
      jBody = jp.body; jSuf = jp.suffix;
    }
  } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }

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
      <col style="width:14%"><col style="width:7%"><col style="width:67%"><col style="width:12%">
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
      <!-- ═══ BLOCK نظام ═══ ہر اندراج ایک الگ قطار (block): کالم1 تاریخ |
           کالم2 سیریل | کالم3 حالات۔ تینوں ایک ہی row میں → سیریل ہمیشہ اپنے
           پیراگراف کے سامنے، editing block کے اندر، ڈیٹا محفوظ۔ -->
      <!-- تمہید (بغیر نمبر) — سرکار/بنام/مرتبہ -->
      <tr class="zf-prerow">
        <td class="zf-c-action"></td>
        <td class="zf-c-serial"><button class="zf-pick no-print" contenteditable="false" onclick="_zimniAccPicker(event)" title="ملزمان منتخب کریں">&#9662;</button></td>
        <td class="zf-c-body" colspan="2">
          <div class="zf-bl"><span class="zf-lbl">سرکار بذریعہ ۔</span> <span class="zf-bdyln" data-k="sarkar">${compl}</span></div>
          <div class="zf-bl zf-bl-banam"><span class="zf-lbl">بنام۔</span><span class="zf-bdyln zf-acclist" data-k="banam"></span></div>
          <div class="zf-bl zf-bl-mor"><span class="zf-lbl">مرتبہ ۔</span> <span class="zf-bdyln zf-io" data-k="murattib">${ioE}</span></div>
        </td>
      </tr>
      <!-- پہلا block (سیریل 1) — کالم 1 میں تاریخ صرف پہلے block پر -->
      <tr class="zf-blk">
        <td class="zf-c-action"><div class="zf-actbody" data-k="action" contenteditable="true">${E(_zimniToday())}</div></td>
        <td class="zf-c-serial"><div class="zf-num" data-k="serial" contenteditable="true">1</div></td>
        <td class="zf-c-body" colspan="2"><div class="zf-body" data-mic="true" data-k="halaat" contenteditable="true">جناب عالیٰ! بحوالہ رپورٹ </div></td>
      </tr>
      <!-- اختتام + دستخط (بغیر نمبر) -->
      <tr class="zf-endrow">
        <td class="zf-c-action"></td>
        <td class="zf-c-serial"></td>
        <td class="zf-c-body" colspan="2">
          <div class="zf-close" data-k="close">رپورٹ ضمنی مرتب ہو کرارسال خدمت ہے۔</div>
          <div class="zf-signblk" style="text-align:left !important;">
            <div class="zf-gap"><br></div>
            <div class="zf-gap"><br></div>
            <div class="zf-sign" data-k="io_sign" style="text-align:left !important;display:block;text-decoration:none;">${ioE}</div>
            <div class="zf-signdate" data-k="io_date" style="text-align:left !important;display:block;">${E(_zimniToday())}</div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>`;
}

// ═══════════════════════════════════════════════════════════════
//  BLOCK نظام — ہر اندراج ایک قطار۔ کالم 2 (سیریل) میں Enter دبانے پر
//  نیا block (نئی قطار) بن جاتا ہے، اگلا سیریل نمبر خودبخود، اور تینوں
//  کالم (تاریخ/سیریل/حالات) ایک ساتھ بندھے رہتے ہیں۔ کوئی نیا بٹن نہیں۔
// ═══════════════════════════════════════════════════════════════
function _zimniBlockRowHTML(serial) {
  // نئے block میں کالم 1 خالی (وقت/مواد کے لیے) — خالی ہو تو پرنٹ میں کچھ نہیں آتا۔
  // تینوں خانے editable۔ تاریخ صرف پہلے block پر (template میں) آتی ہے۔
  return '<td class="zf-c-action"><div class="zf-actbody" data-k="action" contenteditable="true"><br></div></td>'
    + '<td class="zf-c-serial"><div class="zf-num" data-k="serial" contenteditable="true">' + (serial || '') + '</div></td>'
    + '<td class="zf-c-body" colspan="2"><div class="zf-body" data-mic="true" data-k="halaat" contenteditable="true"><br></div></td>';
}
function _zimniRenumberBlocks() {
  const doc = _zimniDoc(); if (!doc) return;
  let n = 0;
  doc.querySelectorAll('tr.zf-blk').forEach(function (tr) {
    n++;
    const num = tr.querySelector('td.zf-c-serial .zf-num, td.zf-c-serial [data-k="serial"]');
    if (num) {
      const t = String(num.textContent || '').replace(/[\s ]/g, '');
      // صرف خالی یا خالص عددی نمبر خودبخود درست کرو (افسر کا خاص لیبل نہ بدلو)
      if (t === '' || /^\d+$/.test(t)) { const v = String(n); if (num.textContent !== v) num.textContent = v; }
    }
  });
}
window._zimniRenumberBlocks = _zimniRenumberBlocks;

function _zimniAddBlock(afterRow) {
  const doc = _zimniDoc(); if (!doc) return;
  afterRow = afterRow || (function () {
    const b = doc.querySelectorAll('tr.zf-blk'); return b.length ? b[b.length - 1] : null;
  })();
  const tbody = afterRow ? afterRow.parentNode : (doc.querySelector('table.zf-tbl tbody'));
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.className = 'zf-blk';
  tr.innerHTML = _zimniBlockRowHTML('');
  if (afterRow && afterRow.nextSibling) tbody.insertBefore(tr, afterRow.nextSibling);
  else if (afterRow) tbody.appendChild(tr);
  else {
    // کوئی block نہ ہو تو اختتام سے پہلے ڈالو
    const endr = tbody.querySelector('tr.zf-endrow');
    if (endr) tbody.insertBefore(tr, endr); else tbody.appendChild(tr);
  }
  _zimniRenumberBlocks();
  try { _zimniPlaceholders(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }   // نئے block کے کالم 1 پر "بوقت" اشارہ
  try {
    const h = tr.querySelector('.zf-body');
    const r = document.createRange(); r.setStart(h, 0); r.collapse(true);
    const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._zimniAddBlock = _zimniAddBlock;

function _zimniRemoveBlock(row) {
  const doc = _zimniDoc(); if (!doc || !row) return;
  if (doc.querySelectorAll('tr.zf-blk').length <= 1) return;   // کم از کم ایک block رہے
  const prev = row.previousElementSibling;
  if (row.parentNode) row.parentNode.removeChild(row);
  _zimniRenumberBlocks();
  try {
    if (prev) {
      const h = prev.querySelector('.zf-body') || prev.querySelector('.zf-actbody');
      if (h) { const r = document.createRange(); r.selectNodeContents(h); r.collapse(false);
        const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
    }
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}

// کالم 1 خالی ہو تو "بوقت" اشارہ (class .zf-ph) — ایڈیٹر میں دکھتا ہے، پرنٹ میں نہیں
function _zimniPlaceholders() {
  try {
    const doc = _zimniDoc(); if (!doc) return;
    doc.querySelectorAll('td.zf-c-action .zf-actbody').forEach(function (el) {
      const t = String(el.textContent || '').replace(/[\s ]/g, '');
      if (t === '') el.classList.add('zf-ph'); else el.classList.remove('zf-ph');
    });
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._zimniPlaceholders = _zimniPlaceholders;

function _zimniCaretRect() {
  try {
    const s = window.getSelection(); if (!s || !s.rangeCount) return null;
    const r = s.getRangeAt(0).cloneRange();
    const rects = r.getClientRects();
    if (rects && rects.length) return rects[rects.length - 1];
    let n = r.startContainer; if (n && n.nodeType === 3) n = n.parentElement;
    if (n && n.getBoundingClientRect) return n.getBoundingClientRect();
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  return null;
}
function _zimniColClass(td) {
  if (!td || !td.classList) return null;
  if (td.classList.contains('zf-c-action')) return 'zf-c-action';
  if (td.classList.contains('zf-c-serial')) return 'zf-c-serial';
  if (td.classList.contains('zf-c-body'))   return 'zf-c-body';
  return null;
}
function _zimniEditableIn(td) {
  if (!td) return null;
  return td.querySelector('.zf-actbody, .zf-num, .zf-body')
      || td.querySelector('[contenteditable="true"]') || td;
}
function _zimniPlaceCaret(el, atEnd) {
  try {
    if (el.focus) el.focus();
    const r = document.createRange();
    r.selectNodeContents(el); r.collapse(!atEnd);
    const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
}

// keydown — سیریل خانے میں Enter = نیا block؛ خالی block میں Backspace = block حذف؛
//   Up/Down = ساتھ والی قطار کے اسی کالم میں (تیر صحیح کام کریں)
function _zimniBindBlockKeys() {
  const doc = _zimniDoc(); if (!doc || doc._zfBlkKeys) return;
  doc._zfBlkKeys = true;
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== 'Backspace' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    const sel = window.getSelection(); if (!sel || !sel.anchorNode) return;
    let node = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement;
    if (!node || !node.closest) return;
    const td = node.closest('td');
    const tr = node.closest('tr');
    // ── Up/Down — ساتھ والی قطار کے اسی کالم میں (کراس-سیل عمودی حرکت) ──
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && td && tr && tr.closest('table.zf-tbl')) {
      const editable = _zimniEditableIn(td);
      const cr = _zimniCaretRect(); if (!cr || !editable) return;
      const er = editable.getBoundingClientRect();
      let lh = 20; try { lh = parseFloat(getComputedStyle(editable).lineHeight) || 20; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      const cls = _zimniColClass(td);
      if (e.key === 'ArrowUp') {
        if ((cr.top - er.top) > lh * 0.7) return;
        const ptr = tr.previousElementSibling; if (!ptr || !ptr.querySelector) return;
        const tgt = _zimniEditableIn(cls ? ptr.querySelector('td.' + cls) : null); if (!tgt) return;
        e.preventDefault(); e.stopPropagation(); _zimniPlaceCaret(tgt, true);
      } else {
        if ((er.bottom - cr.bottom) > lh * 0.7) return;
        const ntr = tr.nextElementSibling; if (!ntr || !ntr.querySelector) return;
        const tgt = _zimniEditableIn(cls ? ntr.querySelector('td.' + cls) : null); if (!tgt) return;
        e.preventDefault(); e.stopPropagation(); _zimniPlaceCaret(tgt, false);
      }
      return;
    }
    const blk = node.closest('tr.zf-blk'); if (!blk) return;
    const serialCell = node.closest('td.zf-c-serial');
    if (e.key === 'Enter' && serialCell) {
      // کالم 2 (سیریل) میں Enter → نیا block
      e.preventDefault(); e.stopPropagation();
      _zimniAddBlock(blk);
      return;
    }
    if (e.key === 'Backspace') {
      // خالی block (تینوں خانے خالی) میں Backspace → block حذف
      const t = String(blk.textContent || '').replace(/[\s ]/g, '');
      if (t === '') { e.preventDefault(); e.stopPropagation(); _zimniRemoveBlock(blk); }
    }
  }, true);
}
window._zimniBindBlockKeys = _zimniBindBlockKeys;
// ── SAVE ──────────────────────────────────────────────────────
// ═══ v555: ضمنی نمبر اور تاریخ — افسر کا قاعدہ (21 اکتوبر 2026) ═══
//  • «ضمنی جس نمبر سے edit کر کے لکھی گئی اسی سے محفوظ ہو؛ نمبر نہ بدلا ہو تو جو لکھا
//    ہے وہی درست ہے اور اسی پر محفوظ ہو۔»
//  • «ایک تاریخ میں ایک ضمنی لکھی جاتی ہے — اس تاریخ کی ضمنی پہلے سے محفوظ ہو تو محفوظ
//    کرنے پر خبردار کرے تاکہ تاریخ درست ہو سکے؛ اسی طرح نمبر پہلے سے محفوظ ہو تو بھی۔»
function _zimniZnoFromDoc(ed) {
  try {
    const sf = ed && (ed.querySelector('[data-k="zno"]') || ed.querySelector('[data-k="serial"]'));
    const v = sf ? parseInt(_zimniDigits(String(sf.innerText || sf.textContent || '')).replace(/[^\d]/g, ''), 10) : NaN;
    return (!isNaN(v) && v > 0) ? v : 0;
  } catch (_) { return 0; }
}
function _zimniRecNo(x) { return parseInt((x || {}).serial_no, 10) || parseInt(((x || {}).content || {}).serial_no, 10) || 0; }
function _zimniRecIso(x) {
  const f = _zimniFindDate(String(((x || {}).content || {}).col1_date || ''));
  return f ? f.iso : String((x || {}).report_date || '').slice(0, 10);
}
function _zimniDupCheck(serialNo, iso, selfId) {
  const others = (_zimniList || []).filter(x => !(selfId && String(x.id) === String(selfId)));
  return {
    byNo: serialNo ? (others.find(x => _zimniRecNo(x) === serialNo) || null) : null,
    byDate: iso ? (others.find(x => _zimniRecIso(x) === iso) || null) : null,
  };
}
window._zimniDupCheck = _zimniDupCheck;
function _zimniDupWarn(dup, serialNo, fd) {
  const ed = _zimniDoc();
  const dmy = (x) => { const i = _zimniRecIso(x); return /^\d{4}-\d{2}-\d{2}$/.test(i) ? i.slice(8, 10) + '/' + i.slice(5, 7) + '/' + i.slice(0, 4) : ''; };
  const lines = [];
  if (dup.byDate) lines.push('تاریخ ' + (fd ? fd.dmy : dmy(dup.byDate)) + ' کی ضمنی (ضمنی نمبر ' + (_zimniRecNo(dup.byDate) || '—') + ') پہلے سے محفوظ ہے — ایک تاریخ کی ایک ہی ضمنی۔ کالم 1 میں تاریخ درست کریں۔');
  if (dup.byNo) lines.push('ضمنی نمبر ' + serialNo + ' پہلے سے محفوظ ہے' + (dmy(dup.byNo) ? ' (تاریخ ' + dmy(dup.byNo) + ')' : '') + ' — اوپر «ضمنی نمبر» درست کریں۔');
  const msg = 'ضمنی محفوظ نہیں ہوئی۔ ' + lines.join(' ');
  // درستی کی جگہ پر لے جاؤ — پہلے ضمنی نمبر، ورنہ تاریخ
  const target = ed && (dup.byNo ? (ed.querySelector('[data-k="zno"]') || ed.querySelector('[data-k="serial"]'))
    : (ed.querySelector('tr.zf-blk td.zf-c-action .zf-actbody') || ed.querySelector('tr.zf-blk td.zf-c-action')));
  try {
    if (target) {
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      target.classList.add('zf-dupmark');
      setTimeout(() => { try { target.classList.remove('zf-dupmark'); } catch (_) { /* ضمنی */ } }, 6000);
      const r = document.createRange(); r.selectNodeContents(target);
      const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      try { (target.closest('[contenteditable="true"]') || target).focus({ preventScroll: true }); } catch (_) { /* ضمنی */ }
    }
  } catch (_) { /* UI ka ikhtiyari qadam */ }
  try { showToast('⚠ ' + msg, 'warn', 9000); } catch (_) { /* paigham */ }
  return msg;
}
window._zimniDupWarn = _zimniDupWarn;

async function _saveZimni(silent, keepOpen) {
  // VIEW-ONLY ENFORCEMENT [4E]: میعاد ختم پر ضمنی محفوظ/ترمیم بند۔ silent (خودکار)
  // پر خاموشی سے رکو، صرف manual save پر renew prompt۔
  if (window.DIO && DIO.sub && DIO.sub.blocked()) { if (!silent) DIO.sub.guard('ضمنی محفوظ'); return false; }
  const ed = _zimniDoc();
  if (!ed) return false;
  if (window._zimniSaving) { window._zimniSaveAgain = true; return true; }   // دوہرا Ctrl+S — ایک ہی کام
  window._zimniSaving = true;
  try {
  // قاعدہ: کالم 1 کی تاریخ = نیچے تفتیشی افسر کی تاریخ (محفوظ سے پہلے)
  try { _zimniSyncSignDate(); } catch (_) { /* ikhtiyari qadam */ }
  const bodyHtml = _zimniCleanHTML(ed.innerHTML);   // grips محفوظ نہ ہوں
  const z = _zimniActive || {};
  const draftKey = (() => { try { return _zimniActiveDraftKey(); } catch (_) { return ''; } })();

  // ضمنی نمبر — EDITABLE خانے سے: افسر نے بدلا ہو تو بدلا ہوا، ورنہ جو لکھا ہے وہی
  let serialNo = _zimniZnoFromDoc(ed) || parseInt(z.serial_no, 10) || 0;
  if (!serialNo) serialNo = _zimniNextSerial();   // نیا — سب سے بڑے نمبر سے ایک آگے
  // ہیڈ (قسم) — toolbar کے خانے سے
  let head = '';
  try {
    const hi = document.getElementById('zf-head-in');
    head = hi ? String(hi.value || '').trim() : '';
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  if (!head) head = (z.content && z.content.head) || 'رپورٹ ضمنی';

  // تاریخ و وقت — فہرست میں وہی دکھے جو block 1 کے کالم 1 میں افسر نے لکھی
  let col1Date = '';
  try {
    const b1 = ed.querySelector('tr.zf-blk td.zf-c-action .zf-actbody')
            || ed.querySelector('tr.zf-blk td.zf-c-action');
    if (b1) col1Date = String(b1.innerText || b1.textContent || '').replace(/\s+/g, ' ').trim();
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }

  // مرکزی + ذیلی ضمنی کی قسم — dropdown سے
  let mainType = '', subType = '';
  try { mainType = String((document.getElementById('zf-main-type') || {}).value || '').replace('__add__', ''); } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  try { subType  = String((document.getElementById('zf-sub-type')  || {}).value || '').replace('__add__', ''); } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  if (subType) head = subType;   // فہرست کا عنوان = ذیلی قسم

  const savedAt = new Date().toISOString();
  const fd = _zimniFindDate(col1Date);

  // v555: ایک تاریخ کی ایک ضمنی، ایک نمبر کی ایک ضمنی — پہلے سے محفوظ ہو تو محفوظ نہ کرو،
  //   افسر کو بتاؤ اور اسی خانے (تاریخ / ضمنی نمبر) پر لے جاؤ تاکہ درستی ہو سکے۔
  //   لکھا ہوا کام ضائع نہیں — اس آلے پر خودکار مسودہ بن جاتا ہے۔
  const dup = _zimniDupCheck(serialNo, fd ? fd.iso : '', z.id);
  if (dup.byNo || dup.byDate) {
    try { _zimniWriteDraft(); } catch (_) { /* agli dafa */ }
    if (!silent) _zimniDupWarn(dup, serialNo, fd);
    return false;
  }

  const rec = {
    case_id: _zimniCaseId,
    serial_no: serialNo,
    // v552: ڈیٹابیس کو ہمیشہ YYYY-MM-DD (DD/MM والی شکل سرور رد کرتا تھا)
    report_date: fd ? fd.iso : _zimniTodayIso(),
    content: { bodyHtml, head, serial_no: serialNo, saved_at: savedAt, col1_date: col1Date,
               main_type: mainType, sub_type: subType },
  };

  try {
    if (typeof dioRegisterSaved === 'function')
      dioRegisterSaved('zimni', head + ' — نمبر ' + serialNo,
        { case_id: _zimniCaseId, serial_no: serialNo });
  } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }

  // ── 1) پہلے اسی آلے پر (آف لائن پہلے) — یہ کبھی ضائع نہیں ہوتا ──
  const localId = z.id || ('local-' + Date.now());
  const localObj = Object.assign({ id: localId }, rec, { _pending: true, _sync_err: '' });
  const localSave = (obj, replaceId) => {
    const i = _zimniList.findIndex(x => String(x.id) === String(replaceId != null ? replaceId : obj.id));
    if (i >= 0) _zimniList[i] = obj; else _zimniList.push(obj);
    _zimniList.sort((a, b) => (parseInt(b.serial_no, 10) || 0) - (parseInt(a.serial_no, 10) || 0));
    return _zimniLocalPut(_zimniCaseId, _zimniList);
  };
  const okLocal = localSave(localObj);
  _zimniActive = localObj;
  try { clearTimeout(ed._zfDraftT); } catch (_) { /* ikhtiyari */ }   // پرانا انتظار شدہ مسودہ محفوظ کے بعد نہ لکھا جائے
  if (draftKey) { try { _zimniClearDraft(draftKey); } catch (_) { /* ikhtiyari */ } }
  _zimniDirty = false;
  try { _zimniStampUpdated(savedAt); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  try { const sb = document.getElementById('zf-save-btn'); if (sb) sb.innerHTML = '💾 اپ ڈیٹ'; } catch (_) { /* ikhtiyari */ }
  try { const as = document.getElementById('zf-autosave'); if (as) as.textContent = ''; } catch (_) { /* ikhtiyari */ }
  if (!okLocal && !silent) showToast('آلے کی جگہ (storage) بھری ہوئی ہے — مقامی نقل نہ بن سکی، سرور پر بھیجی جا رہی ہے', 'warn', 6000);

  const backToList = () => { if (!keepOpen && !silent) setTimeout(() => { try { _renderZimniList(); } catch (_) { /* ikhtiyari */ } }, 200); };

  // ── 2) انٹرنیٹ نہیں / سرور کا ڈھانچہ ناقص — بس آلے پر؛ انٹرنیٹ آتے ہی خود sync ──
  if (!navigator.onLine || window._zimniDbBroken) {
    if (!silent) showToast('ضمنی نمبر ' + serialNo + ' اس آلے پر محفوظ — انٹرنیٹ آنے پر خود سرور پر چلی جائے گی', 'info', 5000);
    backToList();
    return true;
  }

  // ── 3) سرور پر ──
  try {
    try {
      const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
      if (oid) rec.officer_id = oid;
    } catch (_) { /* parhna na ho sake to pehle wali/khali qadr rahe */ }
    const base = {};
    Object.keys(rec).forEach(k => { if (k !== 'content') base[k] = rec[k]; });
    const editing = !_zimniIsPending({ id: z.id }) && !!z.id;
    if (_zimniInFlight.has(String(localId))) {
      // یہی ضمنی ابھی خودکار sync میں جا رہی ہے — وہ مکمل ہوتے ہی یہ تازہ نقل بھی جائے گی
      setTimeout(() => { _zimniSyncPending([_zimniCaseId]); }, 2000);
      if (!silent) showToast('ضمنی نمبر ' + serialNo + ' اس آلے پر محفوظ — سرور پر بھیجی جا رہی ہے', 'info', 4000);
      backToList();
      return true;
    }
    _zimniInFlight.add(String(localId));
    let savedRec;
    try {
      if (editing) savedRec = await _zimniWrite(base, rec.content, z.id);
      else savedRec = await _zimniSyncOne(_zimniCaseId, localObj);   // دوہرا اندراج نہیں (اسی وقت والی پہلے سے ہو تو وہی)
    } finally { _zimniInFlight.delete(String(localId)); }
    savedRec = Object.assign({}, savedRec, { content: rec.content, _pending: false, _sync_err: '' });
    _zimniRekeyDraft(_zimniCaseId, localId, savedRec.id);
    // اس دوران افسر نے مزید لکھا ہو تو وہ نہ مٹے (اسی طریقے سے جو sync کرتا ہے)
    _zimniMergeSynced(_zimniList, localId, savedAt, savedRec);
    _zimniLocalPut(_zimniCaseId, _zimniList);
    if (_zimniActive && String(_zimniActive.id) === String(localId)) {
      _zimniActive = (String((_zimniActive.content || {}).saved_at || '') === savedAt) ? savedRec : Object.assign({}, _zimniActive, { id: savedRec.id });
    }
    if (!silent) showToast('ضمنی نمبر ' + serialNo + ' سرور پر محفوظ ہو گئی', 'success');
    backToList();
    return true;
  } catch (e) {
    try { console.error('[zimni save]', e); } catch (_) { /* console na ho to bhi na phatte */ }
    const why = _zimniErrText(e);
    if (_zimniIsNetErr(e)) {
      if (!silent) showToast('انٹرنیٹ/سرور سے رابطہ نہیں — ضمنی نمبر ' + serialNo + ' اس آلے پر محفوظ ہے، رابطہ بحال ہوتے ہی خود سرور پر چلی جائے گی', 'info', 7000);
    } else {
      localSave(Object.assign({}, localObj, { _sync_err: why }));
      if (!silent) showToast('سرور نے ضمنی قبول نہیں کی — وجہ: ' + why + '۔ ضمنی اس آلے پر محفوظ ہے، کچھ ضائع نہیں ہوا۔', 'error', 10000);
      try { if (typeof dioLogError === 'function') dioLogError('zimni save: ' + why, e); } catch (_) { /* logging */ }
    }
    backToList();
    return true;   // آلے پر محفوظ ہو چکی — کام ضائع نہیں
  }
  } finally {
    window._zimniSaving = false;
    if (window._zimniSaveAgain) { window._zimniSaveAgain = false; setTimeout(() => { try { _saveZimni(true, true); } catch (_) { /* agli dafa */ } }, 50); }
  }
}
window._saveZimni = _saveZimni;

async function _deleteZimni(id, skipConfirm) {
  const z = _zimniRec(id);
  if (!skipConfirm && !confirm('کیا آپ ضمنی نمبر ' + ((z && z.serial_no) || '') + ' حذف کرنا چاہتے ہیں؟')) return;
  const dropLocal = () => {
    _zimniList = _zimniList.filter(x => String(x.id) !== String(id));
    _zimniLocalPut(_zimniCaseId, _zimniList);
    _zimniClearDraft('id:' + id);
  };
  // v552: جو ضمنی ابھی صرف اس آلے پر ہے (سرور پر گئی ہی نہیں) — سرور کو پوچھنے کی ضرورت نہیں
  //   (پہلے یہاں بھی سرور سے حذف مانگا جاتا، «نہیں ملی» آتا اور ضمنی فہرست سے ہٹتی ہی نہیں تھی)
  if (String(id).startsWith('local-') || String(id).startsWith('tmp_')) {
    dropLocal(); _renderZimniList(); showToast('حذف ہو گئی', 'info'); return;
  }
  if (!navigator.onLine) { showToast('سرور پر محفوظ ضمنی حذف کرنے کے لیے انٹرنیٹ درکار ہے', 'warn', 5000); return; }
  try {
    // v547: نتیجہ دیکھ کر — پہلے سرور رد کرتا تب بھی فہرست سے ہٹ جاتی (دوبارہ کھولنے پر واپس)
    dioWriteOk(await supabaseClient.from('zimni_reports').delete().eq('id', id).select('id'), 'zimni delete', true);
    dropLocal();
    _renderZimniList();
    showToast('حذف ہو گئی', 'info');
  } catch(e) { dioWriteFail('ضمنی', e, 'حذف نہیں ہوئی'); }
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
// چالان/اخراج jaisa print: kaghaz + margins (1cm / _ch173SideMargin) report173 se,
// CSS bhi report173 (_ch173CSS) + zimni form CSS — screen aur print bilkul aik.
// ── PRINT ke liye MEHFOOZ body ────────────────────────────────
//  DOMPurify `button` hata deta hai magar KEEP_CONTENT ki wajah se us ka
//  andarooni text (accused-picker ka '▾') reh jata tha — aur chhupane wali
//  CSS (`button{display:none}`) khali text node par nahi lagti, is liye
//  har chhapi hui zimni me aik awara '▾' aa jata. Is liye sanitize se
//  PEHLE picker buttons poore (text samet) nikal dete hain.
function _zimniSafePrint(html) {
  var h = String(html == null ? '' : html);
  try { if (typeof dioNormFontsHTML === 'function') h = dioNormFontsHTML(h); } catch (_) { /* v553: پرانے فونٹ معیاری */ }
  try {
    h = h.replace(/<button\b[^>]*>[\s\S]*?<\/button>/gi, '');   // picker/grip buttons
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  try {
    if (window.DIO && DIO.html && DIO.html.safe) return DIO.html.safe(h);
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  return h;   // sanitizer na mile to bina badle — chhapai kabhi na rukay
}
window._zimniSafePrint = _zimniSafePrint;

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
    ${(typeof dioFontHead === 'function') ? dioFontHead() : ''}
    <style>
      /* AHEM: سائیڈ مارجن صفحے پر نہیں، دستاویز کی padding سے — تاکہ دستاویز کی
         چوڑائی بالکل وہی رہے جو اسکرین پر تھی۔ اسی سے کالم 2 کے نمبروں کی سیدھ
         چھپائی میں بھی درست رہتی ہے (چوڑائی بدلنے سے پیراگراف کی اونچائی بدلتی
         تھی اور اسکرین پر ناپا ہوا marginTop غلط ہو جاتا تھا)۔ */
      @page{ size:${size}; margin:1cm 0; }
      *{ -webkit-print-color-adjust:exact; print-color-adjust:exact; box-sizing:border-box; }
      html,body{ margin:0; font-family:'Jameel Noori Nastaleeq';
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
      /* تفتیشی افسر کا نام و تاریخ — پرنٹ میں ہمیشہ بائیں (LEFT)، کلاس/ڈیٹا دونوں پر */
      #ch173-doc [data-k="io_sign"], #ch173-doc [data-k="io_date"],
      #ch173-doc .zf-signblk, #ch173-doc .zf-sign, #ch173-doc .zf-signdate,
      #ch173-doc .zfa-wit-sign, #ch173-doc .zfa-wit-io, #ch173-doc .zfa-wit-date{
        text-align:left !important; text-align-last:left !important; }
      /* کالم 1 کا "بوقت" اشارہ پرنٹ میں کبھی نہ چھپے (خالی ہو تو کچھ نہیں) */
      #ch173-doc .zf-actbody::before{ content:none !important; }
      #ch173-doc, #ch173-doc *{ orphans:2; widows:2; }
      ${typeof dioBindCSS === 'function' ? dioBindCSS('#ch173-doc') : ''}
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

        // ── ایک body کو الگ الگ <div> پیراگرافوں میں توڑو ──
        //  (br، کئی .zf-body، اور — اہم — text node کے اندر نئی سطر سنبھالو)
        //  ضمنی کا خانہ white-space:pre-wrap ہے: افسر Enter دبائے تو براؤزر
        //  اکثر newline کو ایک ہی text node میں ڈال دیتا ہے (نیا div نہیں)۔
        //  پہلے normalize صرف DIV/P/BR پر توڑتا تھا → newline نظرانداز → سارا متن
        //  ایک پیراگراف بن جاتا اور سیریل نمبر بھی صرف ایک چھپتا۔ اب newline کو بھی
        //  پیراگراف کی حد مانتے ہیں۔
        //  مکمل RECURSIVE flatten — کسی بھی گہرائی پر br، newline، اور block
        //  (div/p) کی حد کو پیراگراف کی حد مانو۔ محفوظ شدہ ضمنی کا HTML اکثر
        //  پیراگراف ایک wrapper div کے اندر br سے جوڑ دیتا ہے
        //  (<div>a<br>b<br>c</div>) — پرانا normalize صرف اوپری سطح دیکھتا تھا،
        //  اس لیے وہ سب ایک پیراگراف بن جاتے (چھپائی میں ملے ہوئے)۔ اب ہر br/
        //  newline پر ٹوٹتا ہے، اندرونی div/p پر بھی۔
        function normalize(host){
          var out=[], cur=null;
          function ensure(){ if(!cur) cur=document.createElement('div'); return cur; }
          function endPara(){ if(cur){ if(T(cur).length) out.push(cur); cur=null; } }
          function addText(str){
            var parts=String(str==null?'':str).split('\\n');
            for(var i=0;i<parts.length;i++){
              if(i>0) endPara();                              // newline = نیا پیراگراف
              if(parts[i].length) ensure().appendChild(document.createTextNode(parts[i]));
            }
          }
          function walk(node){
            for(var i=0;i<node.childNodes.length;i++){
              var n=node.childNodes[i];
              if(n.nodeType===3){ addText(n.nodeValue||''); }
              else if(n.nodeType===1){
                var tag=n.tagName;
                if(tag==='BR'){ endPara(); }
                else if(tag==='DIV'||tag==='P'){ endPara(); walk(n); endPara(); }   // بلاک — اندر جاؤ، حدیں توڑیں
                else {
                  // inline (span/b/i/u/a...) — اگر اندر br/newline ہو تو اندر جاؤ، ورنہ جوں کا توں
                  var hasBrk=false;
                  try{ hasBrk = (n.querySelector && n.querySelector('br,div,p')) || /\\n/.test(n.textContent||''); }catch(e){ /* print layout ka ikhtiyari qadam */ }
                  if(hasBrk) walk(n);
                  else ensure().appendChild(n.cloneNode(true));
                }
              }
            }
          }
          walk(host);
          endPara();
          while(host.firstChild) host.removeChild(host.firstChild);
          out.forEach(function(d){ host.appendChild(d); });
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

        // ── کالم 1 (تاریخ) اور کالم 2 (سیریل) کو حالاتِ تفتیش (.zf-body) کی
        //    پہلی سطر "جناب عالیٰ! …" کے سامنے لاؤ ──
        //  کالم 3 میں پہلے "سرکار/بنام/مرتبہ" (.zf-bl) آتی ہیں، پھر اصل تحریر
        //  (.zf-body)۔ افسر چاہتا ہے تاریخ اور سیریل "1" دونوں اُسی "جناب عالیٰ"
        //  کے سامنے ہوں — اس لیے دونوں خانوں کو اتنا نیچے کرو کہ وہ .zf-body سے
        //  شروع ہوں (idempotent — ہر بار پہلے reset)۔
        function alignSerialToBody(){
          try{
            var doc=document.getElementById('ch173-doc'); if(!doc) return;
            // پہلے دونوں خانوں کی اپنی padding reset (idempotent)
            var aTd=doc.querySelector('td.zf-c-action');
            var sTd=doc.querySelector('td.zf-c-serial');
            if(aTd) aTd.style.paddingTop='';
            if(sTd) sTd.style.paddingTop='';
            var body=doc.querySelector('td.zf-c-body .zf-body'); if(!body) return;
            var bodyTop=body.getBoundingClientRect().top;
            // ═══ td پر MARGIN کام نہیں کرتا — اس لیے PADDING-TOP سے نیچے کرو ═══
            //  (محفوظ ضمنی میں تاریخ سیدھی td میں ہو سکتی ہے، بغیر .zf-actbody کے —
            //   padding ہر صورت میں چلتا ہے)۔ خانے کے اوپری کنارے سے .zf-body تک
            //   کا فاصلہ = padding-top۔
            [aTd, sTd].forEach(function(td){
              if(!td) return;
              var pad=Math.round(bodyTop - td.getBoundingClientRect().top);
              if(pad>0 && pad<2000) td.style.paddingTop=pad+'px';
            });
          }catch(e){ /* print layout ka ikhtiyari qadam */ }
        }

        // ── ٹیبل کی لکیریں صفحے کے نیچے تک (اکلوتا صفحہ) — قطار 2 کے تمام خانوں
        //    کی اونچائی بڑھا کر ٹیبل کا نیچے کنارہ صفحے کے ہاشیے تک لے جاؤ۔ ──
        function stretchToBottom(){
          try{
            var doc=document.getElementById('ch173-doc'); if(!doc) return;
            var tbl=doc.querySelector('table.zf-tbl'); if(!tbl) return;
            var row=tbl.querySelector('tbody tr'); if(!row) return;
            var tds=[].slice.call(row.querySelectorAll('td')); if(!tds.length) return;
            // پہلے موجودہ اونچائیاں ہٹاؤ تاکہ اصل (قدرتی) ناپ ملے
            tds.forEach(function(td){ td.style.height=''; });
            // ═══ صفحہ ضائع نہ ہو ═══ پہلے پوری دستاویز کی موجودہ اونچائی ناپو۔
            //  اگر وہ ایک صفحے سے کم ہے تو صرف اتنا کھینچو کہ ٹیبل صفحے کے نیچے
            //  تک پہنچے مگر دستاویز ایک صفحے سے آگے نہ جائے۔ اگر مواد پہلے ہی ایک
            //  صفحہ یا زیادہ ہے تو بالکل نہ کھینچو (ورنہ خالی دوسرا صفحہ بنتا تھا)۔
            var r=doc.getBoundingClientRect();
            var used=r.bottom - r.top;                       // دستاویز کی موجودہ اونچائی
            var pageLimit=contentH - SAFE;                   // ایک صفحے کی کام کی حد
            if(used >= pageLimit - 12) return;               // پہلے ہی بھر چکی — مت کھینچو
            var gap=Math.floor(pageLimit - used);
            if(gap<=10) return;
            var tallest=tds[0];
            tds.forEach(function(td){ if(td.offsetHeight>tallest.offsetHeight) tallest=td; });
            tallest.style.height=(tallest.offsetHeight+gap)+'px';   // صرف سب سے لمبے خانے کو بڑھاؤ
          }catch(e){ /* print layout ka ikhtiyari qadam */ }
        }

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
          }catch(e){ /* print layout ka ikhtiyari qadam */ }
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
              var gap=document.createElement('span'); gap.className='dio-bindgap';
              kids[i].insertBefore(gap, tri);
              return;
            }
          }
        }

        function chain(){
          var doc=document.getElementById('ch173-doc'); if(!doc) return;
          if(contentH<200) return;
          // ═══ BLOCK نظام ═══ اگر ضمنی نئی block ساخت میں ہے (ہر اندراج ایک قطار)
          //  تو پرانا پیچیدہ نظام (normalize/androoni/serial-align) بالکل نہ چلاؤ —
          //  ٹیبل قدرتی طور پر صفحہ در صفحہ خود بٹ جاتا ہے، سیریل ہر قطار میں اپنے
          //  حالات کے سامنے رہتا ہے۔ صرف دستخط بائیں یقینی بناؤ۔
          if(doc.querySelector('tr.zf-blk')){
            // v553: BLOCK ضمنی میں بھی مثل باندھنے کی جگہ — ہر جفت صفحے (پچھلی طرف) کے
            //   شروع میں: اوپر ایک سطر + مثلث (2pt وتر)۔
            // v555: ہر صفحے کا توڑ اب «پکا» (خود براؤزر پر نہیں چھوڑا) — پہلے حساب یہ مانتا تھا
            //   کہ جو اندراج صفحے میں پورا نہ آئے وہ پورا اگلے صفحے پر جائے گا، مگر چھپائی میں
            //   اندراج صفحے کے اندر سے ٹوٹ جاتا تھا — اسی سے مثلث (2pt لکیر) پہلے صفحے کے بیچ
            //   میں آ جاتی تھی۔ اب:
            //   (الف) اندراج کی پہلی سطر ہی صفحے میں نہ آئے (یا تمہید/اختتام کی قطار) → اس سے پہلے
            //        خالی قطار (tr.zf-fill) جو صفحہ نیچے تک بھرے + قطار سے پہلے صفحے کا توڑ
            //   (ب) ورنہ حالات کی اُس سطر سے پہلے صفحے کا توڑ (.dio-pgbrk) جو صفحے میں نہ سمائے —
            //        باقی متن اگلے صفحے پر؛ کھڑی لکیریں اس صفحے کے نیچے تک
            //   آخری صفحے پر ٹیبل کے بعد خالی قطار — لکیریں صفحے کے نیچے (حاشیے) تک۔
            //   کئی ضمنیاں اکٹھی چھپیں تو ہر ضمنی اپنے صفحہ 1 سے گنی جاتی ہے۔
            try{
              doc.querySelectorAll('.zf-bind,.dio-bindgap,.dio-pgbrk,tr.zf-fill').forEach(function(e){ if(e.parentNode)e.parentNode.removeChild(e); });
              // پرانی layout سے چپکی inline اونچائیاں ناپ سے پہلے ہٹاؤ (ورنہ قطاریں 18cm رہتیں)
              doc.querySelectorAll('table.zf-tbl td,table.zf-tbl tr').forEach(function(el){
                el.style.height=''; if(el.tagName==='TR'){ el.style.breakBefore=''; el.style.pageBreakBefore=''; } });
            }catch(e){ /* print layout ka ikhtiyari qadam */ }
            try{
              var dTop=doc.getBoundingClientRect().top;
              var FSAFE=6;                       // صفحے کے نیچے کنارے سے ذرا پہلے (خالی قطار اگلے صفحے پر نہ چھلکے)
              var mkFill=function(like, h){
                var tr=document.createElement('tr'); tr.className='zf-fill';
                [].slice.call(like.children).forEach(function(c){
                  var td=document.createElement('td'); td.className=c.className||'';
                  var cs=c.getAttribute('colspan'); if(cs) td.setAttribute('colspan', cs);
                  td.style.height=Math.floor(h)+'px'; tr.appendChild(td);
                });
                return tr;
              };
              var insB=function(par, before){
                var gap=document.createElement('span'); gap.className='dio-bindgap';
                var tri=document.createElement('span'); tri.className='zf-bind';
                par.insertBefore(gap, before); par.insertBefore(tri, before);
              };
              // پہلی سطر جس کا نچلا کنارہ limitY سے نیچے ہو — {n, off, top}؛ توڑنا بعد میں (cut)
              var lineFind=function(cell, limitY){
                var tw=document.createTreeWalker(cell, NodeFilter.SHOW_TEXT, null), n, rg=document.createRange();
                while((n=tw.nextNode())){
                  if(!n.nodeValue || !n.nodeValue.trim()) continue;
                  rg.selectNodeContents(n); var rs=rg.getClientRects(), hitTop=null;
                  for(var k=0;k<rs.length;k++){ if(rs[k].height>2 && (rs[k].bottom-dTop)>limitY+0.5){ hitTop=rs[k].top; break; } }
                  if(hitTop===null) continue;
                  var lo=0, hi=n.nodeValue.length-1, off=-1;
                  while(lo<=hi){ var mid=(lo+hi)>>1; rg.setStart(n,mid); rg.setEnd(n,mid+1); var bb=rg.getBoundingClientRect();
                    if(bb.height && bb.top>=hitTop-1){ off=mid; hi=mid-1; } else lo=mid+1; }
                  if(off<0) return null;
                  return { n:n, off:off, top: hitTop-dTop };
                }
                return null;
              };
              var cut=function(sp){ return sp.off>0 ? sp.n.splitText(sp.off) : sp.n; };
              // خانے کی پہلی سطر کا اوپر / آخری سطر کا نیچے
              var textEdge=function(cell, last){
                var tw=document.createTreeWalker(cell, NodeFilter.SHOW_TEXT, null), n, rg=document.createRange(), v=null;
                while((n=tw.nextNode())){
                  if(!n.nodeValue || !n.nodeValue.trim()) continue;
                  rg.selectNodeContents(n); var rs=rg.getClientRects();
                  for(var k=0;k<rs.length;k++){ if(rs[k].height>2){
                    if(!last) return rs[k].top-dTop;
                    v=(v===null)?rs[k].bottom-dTop:Math.max(v, rs[k].bottom-dTop); } }
                }
                return v;
              };
              var tables=[].slice.call(doc.querySelectorAll('table.zf-tbl'));
              tables.forEach(function(tbl){
                // اس ضمنی کا صفحہ 1 کہاں سے (اکٹھی چھپائی میں ہر ضمنی اپنے خانے میں، نئے صفحے سے)
                var unit=tbl; while(unit.parentNode && unit.parentNode!==doc) unit=unit.parentNode;
                var pTop=(tables.length>1 ? unit.getBoundingClientRect().top-dTop : 0), pNo=1, guardB=0;
                var rowsB=[].slice.call(tbl.querySelectorAll('tbody > tr'));
                var EPS=2;
                for(var ri=0; ri<rowsB.length && guardB<300; ri++){
                  guardB++;
                  var row=rowsB[ri];
                  var rr=row.getBoundingClientRect(), rt=rr.top-dTop, rb=rr.bottom-dTop;
                  if(rb-pTop <= contentH-EPS) continue;               // پوری قطار اسی صفحے پر
                  var isBlk=row.classList.contains('zf-blk');
                  var bodyC=row.querySelector('td.zf-c-body .zf-body')||row.querySelector('td.zf-c-body');
                  var sp=null, firstLine=false;
                  if(isBlk && bodyC){
                    sp=lineFind(bodyC, pTop+contentH-EPS);
                    if(!sp){ var lb=textEdge(bodyC, true); if(lb!==null) sp=lineFind(bodyC, lb-1); }   // متن سما گیا، نیچے کی جگہ نہیں — آخری سطر اگلے صفحے پر
                    var ft=textEdge(bodyC, false);
                    if(sp && ft!==null && sp.top<=ft+1) firstLine=true;
                  }
                  pNo++;
                  if((!isBlk || !sp || firstLine) && rt > pTop+1){       // (الف) پوری قطار اگلے صفحے پر
                    var room=pTop+contentH-rt-FSAFE;
                    if(room>2) row.parentNode.insertBefore(mkFill(row, room), row);
                    row.style.breakBefore='page'; row.style.pageBreakBefore='always';
                    pTop=row.getBoundingClientRect().top-dTop;
                    if(pNo%2===0 && bodyC){
                      insB(bodyC, bodyC.firstChild);
                      // کالم 1 (تاریخ) اور 2 (نمبر) بھی ایک سطر نیچے — «جناب عالیٰ» کی سیدھ برقرار
                      [].slice.call(row.children).forEach(function(td){
                        if(td.contains(bodyC)) return;
                        var g=document.createElement('span'); g.className='dio-bindgap'; td.insertBefore(g, td.firstChild);
                      });
                    }
                    ri--;                                               // اگلے صفحے پر بھی پوری نہ آئے تو دوبارہ جانچو
                    continue;
                  }
                  if(!sp){ pTop=pTop+contentH; continue; }              // (ناممکن صورت) — آگے بڑھو
                  // (ب) اس سطر سے پہلے صفحے کا پکا توڑ
                  var node=cut(sp);
                  var brk=document.createElement('span'); brk.className='dio-pgbrk';
                  node.parentNode.insertBefore(brk, node);
                  // توڑ سے پہلے کا حاشیہ (پچھلے پیراگراف کا margin) صفحے کی حد پار کرے تو اسے صفر کرو —
                  //   چھپائی میں صفحے کے توڑ پر یہ حاشیہ ویسے بھی کٹ جاتا ہے؛ یوں حساب اور چھپائی ایک
                  if(brk.getBoundingClientRect().top-dTop > pTop+contentH-EPS){
                    for(var E=brk; E && E!==bodyC.parentNode; E=E.parentNode){
                      var pv=E.previousElementSibling, fst=E.parentNode && [].filter.call(E.parentNode.childNodes, function(c){ return c.nodeType===1 || (c.nodeType===3 && c.nodeValue.trim()); })[0];
                      if(pv) pv.style.marginBottom='0px';
                      if(E!==brk && E.style) E.style.marginTop='0px';
                      if(fst!==E) break;
                    }
                  }
                  if(pNo%2===0) insB(node.parentNode, node);
                  // توڑ سے پہلے کا حاشیہ (پیراگراف کا نچلا margin) صفحے کی حد سے آگے ہو تو اگلا صفحہ حد ہی سے
                  //   شروع ہوتا ہے (بچا ہوا حاشیہ اگلے صفحے کے اوپر) — اسی کے مطابق حساب
                  pTop=Math.min(brk.getBoundingClientRect().top-dTop, pTop+contentH);
                  ri--;                                               // یہی قطار اگلے صفحے سے بھی آگے جا سکتی ہے
                }
                // آخری صفحہ — ٹیبل کے بعد خالی قطار، کھڑی لکیریں صفحے کے نیچے (حاشیے) تک
                var lastRow=rowsB[rowsB.length-1];
                if(lastRow){
                  var roomL=pTop+contentH-(tbl.getBoundingClientRect().bottom-dTop)-FSAFE;
                  if(roomL>1) lastRow.parentNode.appendChild(mkFill(lastRow, roomL));
                }
              });
            }catch(e){ /* print layout ka ikhtiyari qadam */ }
            try{
              doc.querySelectorAll('.zf-signblk,.zf-sign,.zf-signdate,[data-k="io_sign"],[data-k="io_date"]').forEach(function(el){
                el.style.setProperty('text-align','left','important');
                el.style.setProperty('text-align-last','left','important');
              });
            }catch(e){ /* print layout ka ikhtiyari qadam */ }
            return;
          }
          // اختتامی خانہ الگ رکھو (screن پر androoni میں ہو تو class بدل چکی: .zfa-wit-sign)
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
          doc.querySelectorAll('.zf-bind,.zf-bindmark,.dio-bindgap').forEach(function(e){ if(e.parentNode)e.parentNode.removeChild(e); });
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
              // ── تفتیشی افسر کا نام + تاریخ ہمیشہ بائیں (LEFT) — پرانی محفوظ ضمنی
              //    میں inline text-align:right ہو سکتا ہے، اِسے یہاں زبردستی ہٹاؤ ──
              [sign,io,dt].forEach(function(el){ if(el){ try{ el.style.setProperty('text-align','left','important'); }catch(_){ /* print layout ka ikhtiyari qadam */ }}});
            }
          };

          var binds=[];
          if(lastBottom<=twoPage){
            // اوور فلو نہیں — سب berooni میں۔
            // ═══ MANUAL سیریل ═══ اب خودکار نمبر نہیں لگتے۔ کالم 2 میں افسر نے
            //  جو لکھا (شروع میں "1") وہی جوں کا توں چھپتا ہے — نہ دوبارہ بنتے،
            //  نہ پیراگراف کے ساتھ خودکار سیدھ ہوتی۔ (پرانا کوڈ یہاں 1..N نمبر
            //  دوبارہ بناتا تھا جو افسر کے لکھے کو مٹا دیتا تھا۔)
            putClose(doc.querySelector('td.zf-c-body'));
            alignSerialToBody();   // سیریل "1" کو "جناب عالیٰ!" (حالات کی پہلی سطر) کے سامنے لاؤ
            // ── ٹیبل کی لکیریں صفحے کے نیچے تک (مگر ایک صفحے سے آگے نہیں) ──
            stretchToBottom();
            addBind(doc.querySelector('td.zf-c-body .zf-body'), docTop);   // صفحہ 2 کا مثلث (صرف اگر واقعی 2 صفحے ہوں)
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
              var r=rg.getBoundingClientRect(); if(r.height)tops.push(r.top);}catch(e){ /* print layout ka ikhtiyari qadam */ }} run=[]; }
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
          if(!kids.length||!tops.length) return;
          // ═══ ABSOLUTE POSITIONING (bulletproof — clump NAHI ho sakta) ═══
          //   Har number ko serial-khane ke andar us ke paragraph ki THEEK Y
          //   جگہ par ABSOLUTE rakho. marginTop wala tareeqa baar baar clump
          //   kar raha tha (aik number set karte hi baqi khisak jate the) —
          //   is liye ab bilkul chhor diya. Har number apne paragraph ke
          //   saamne, aik doosre se مکمل آزاد.
          var td = nums.closest('td') || nums.parentNode;
          try { if (getComputedStyle(td).position === 'static') td.style.position = 'relative'; } catch(e){ /* print layout ka ikhtiyari qadam */ }
          nums.style.position = 'static';
          var cellTop = td.getBoundingClientRect().top;
          var padTop = 0;
          try { padTop = parseFloat(getComputedStyle(td).paddingTop) || 0; } catch(e){ /* print layout ka ikhtiyari qadam */ }
          for(var i=0;i<kids.length;i++){
            kids[i].style.marginTop='0px';
            if(i<tops.length){
              kids[i].style.position='absolute';
              kids[i].style.left='0'; kids[i].style.right='0';
              kids[i].style.top = Math.max(0, Math.round(tops[i]-cellTop)) + 'px';
              kids[i].style.textAlign='center';
            } else {
              kids[i].style.position='absolute';
              kids[i].style.opacity='0';   // extra number (agar ho) chhupa do
            }
          }
        }
        function alignAll(){ [].slice.call(document.querySelectorAll('.zf-nums, .zfa-nums')).forEach(alignOne); }

        // ═══ PER-PARAGRAPH numbering (page-break safe) ═══
        // Masla: absolute number serial-khane mein td se relative tha — 2-page par
        // paragraph page-break se neeche khiskta tha magar number wahin reh jata tha.
        // Hal: har number ki NAQAL us ke PARAGRAPH ke ANDAR rakho (absolute, serial
        // column ke x-range par runtime-measured). Number ab paragraph ka child hai,
        // is liye page break par paragraph ke SAATH jata hai. Original serial-number
        // ko chhupa dete hain (jagah reserve rehti hai). ALL-OR-NOTHING: koi unit
        // mismatch ho to false return, aur purana alignAll() chal jata hai (safe).
        function parasOf(body){
          return [].slice.call(body.children).filter(function(el){
            return (el.tagName==='DIV'||el.tagName==='P') &&
              (el.textContent||'').replace(/[\\s\\u00A0]/g,'').length; });
        }
        function alignByParent(){
          var doc=document.getElementById('ch173-doc'); if(!doc) return false;
          var units=[];
          var bB=doc.querySelector('td.zf-c-body .zf-body');
          var bS=doc.querySelector('td.zf-c-serial');
          if(bB&&bS){ var bN=bS.querySelector('.zf-nums'); if(bN) units.push({body:bB,serialTd:bS,nums:bN,cls:'zf-pnum'}); }
          [].slice.call(doc.querySelectorAll('.zf-androoni')).forEach(function(sh){
            var b=sh.querySelector('.zfa-body'); var st=sh.querySelector('td.zfa-c-serial');
            var n=st?st.querySelector('.zfa-nums'):null;
            if(b&&st&&n) units.push({body:b,serialTd:st,nums:n,cls:'zfa-pnum'});
          });
          if(!units.length) return false;
          // ── validate: har unit mein paragraph 1..N number ke barabar/kam hon ──
          // aur serial column ki measurement sahih ho (warna number ghayab ho sakta) ──
          for(var u=0;u<units.length;u++){
            // manual-space mode — افسر نے خود (خالی لائنوں سے) نمبر رکھے → چھوؤ مت (fallback)
            if(units[u].nums.getAttribute('data-manual-space')==='1') return false;
            units[u].paras=parasOf(units[u].body);
            // صرف بھرے (non-empty) نمبر گنیں — خالی divs شمار نہ ہوں
            units[u].numEls=[].slice.call(units[u].nums.children).filter(function(el){
              return (el.textContent||'').replace(/[\\s\\u00A0]/g,'').length; });
            // نیا: صرف کم از کم 1 نمبر اور 1 پیراگراف چاہیے۔ (پہلے paras>nums پر
            // fallback ہو جاتا تھا — اسی لیے asli zimni (زیادہ پیراگراف) پر یہ
            // page-break-safe طریقہ کبھی نہ چلتا اور نمبر دوسرے صفحے پر کھسک جاتے)۔
            if(!units[u].numEls.length || !units[u].paras.length) return false;
            var srW=units[u].serialTd.getBoundingClientRect().width;
            if(!(srW>4 && srW<400)) return false;        // measurement mashkook — fallback
          }
          // ── apply: number[i] ↔ paragraph[i] (index-wise، جتنے کم ہوں اتنے) ──
          //   number ki naqal us ke paragraph ke ANDAR → page-break par SAATH khiskti hai.
          for(var v=0;v<units.length;v++){
            var U=units[v];
            var cnt=Math.min(U.numEls.length, U.paras.length);
            for(var i=0;i<cnt;i++){
              var src=U.numEls[i]; var p=U.paras[i];
              if(!src||!p) continue;
              src.style.visibility='hidden';               // original jagah reserve
              try{ if(getComputedStyle(p).position==='static') p.style.position='relative'; }catch(e){ /* print layout ka ikhtiyari qadam */ }
              var sr=U.serialTd.getBoundingClientRect();
              var pr=p.getBoundingClientRect();
              var cl=document.createElement('div');
              cl.className=U.cls;
              cl.textContent=src.textContent;
              cl.setAttribute('contenteditable','false');
              cl.style.cssText='position:absolute;top:0;left:'+Math.round(sr.left-pr.left)+
                'px;width:'+Math.round(sr.width)+'px;text-align:center;pointer-events:none;';
              p.appendChild(cl);
            }
          }
          return true;
        }
        function go(){
          // پچھلی نقلیں ہٹاؤ + اصل نمبر دوبارہ ظاہر (idempotent)
          try{ [].slice.call(document.querySelectorAll('.zf-pnum,.zfa-pnum')).forEach(function(e){ if(e.parentNode)e.parentNode.removeChild(e); }); }catch(e){ /* print layout ka ikhtiyari qadam */ }
          try{ [].slice.call(document.querySelectorAll('.zf-num,.zfa-num')).forEach(function(e){ e.style.visibility=''; }); }catch(e){ /* print layout ka ikhtiyari qadam */ }
          try{ chain(); }catch(e){ /* print layout ka ikhtiyari qadam */ }
          // ═══ MANUAL سیریل ═══ خودکار سیدھ (alignByParent/alignAll) بند کر دی —
          //  کالم 2 میں افسر کا لکھا نمبر جوں کا توں رہے (center align بذریعہ CSS)۔
        }
        // AHEM: chain ہمیشہ فونٹ لوڈ ہونے کے بعد چلے — ورنہ ناپ چھوٹی آتی ہے اور
        // زیادہ پیراگراف ایک شیٹ میں سما جاتے ہیں (split غلط)۔ idempotent ہے، اس
        // لیے دوبارہ چلنا محفوظ ہے۔
        function boot(){
          go();                                   // پہلی جھلک (فونٹ سے پہلے)
          setTimeout(go,120); setTimeout(go,400); setTimeout(go,900);
          if(document.fonts&&document.fonts.ready){ document.fonts.ready.then(function(){ go(); setTimeout(go,60); setTimeout(go,300); }); }
        }
        window.__zimniGo=go;                     // v555: _zimniFinalize اسے «پرنٹ» کی شکل میں چلاتا ہے
        boot();
        window.addEventListener('beforeprint', function(){ go(); });
        try{ var mq=window.matchMedia&&window.matchMedia('print');
          if(mq&&mq.addEventListener) mq.addEventListener('change',function(e){ if(e.matches) go(); }); }catch(e){ /* print layout ka ikhtiyari qadam */ }
      })();
    </script></body></html>`;
}
window._zimniPrintHTML = _zimniPrintHTML;

// ═══════════════════════════════════════════════════════════════
//  ضمنیات — fehrist ke ایکشن buttons (پرنٹ / بھیجیں / PDF)
// ═══════════════════════════════════════════════════════════════

// v555: قطار 1 کا کالم 4 («از۔») صرف اتنا چوڑا جتنا لفظ؛ بچی جگہ کالم 3 کو۔ پہلے سے محفوظ
//   ضمنیوں میں اگر کالم بالکل پرانے پہلے سے طے شدہ ناپ (14/7/55/24) پر ہوں تو انہیں بھی نئے
//   ناپ پر — افسر نے خود لکیر کھینچ کر کالم بدلے ہوں تو اُن کا ناپ جوں کا توں۔
// v558 (افسر کی ہدایت، 27 اکتوبر 2026): «از۔» کی جگہ کم ہے — موجودہ سے دُگنی (6% → 12%)؛ کالم 3 اسی قدر کم۔
//   پہلے سے طے شدہ دونوں پرانے ناپ (14/7/55/24 اور v555 کا 14/7/73/6) نئے ناپ پر؛ افسر کا اپنا کھینچا ناپ جوں کا توں۔
const _ZF_OLD_COLS = /<col\s+style="width:\s*14%;?"\s*\/?>\s*<col\s+style="width:\s*7%;?"\s*\/?>\s*<col\s+style="width:\s*(?:55%;?"\s*\/?>\s*<col\s+style="width:\s*24|73%;?"\s*\/?>\s*<col\s+style="width:\s*6)%;?"\s*\/?>/i;
function _zimniMigrateCols(html) {
  const s = String(html || '');
  return _ZF_OLD_COLS.test(s) ? s.replace(_ZF_OLD_COLS, '<col style="width:14%"><col style="width:7%"><col style="width:67%"><col style="width:12%">') : s;
}
window._zimniMigrateCols = _zimniMigrateCols;

// v552: چھاپنے سے پہلے قاعدہ لاگو — نیچے کی تاریخ = کالم 1 (سیریل 1) کی تاریخ؛
//   سرخی = ذیلی ضمنی (محفوظ شدہ پرانی ضمنیوں پر بھی)
function _zimniPrepBody(html, subType) {
  try {
    const box = document.createElement('div');
    box.innerHTML = _zimniMigrateCols(html);
    const b1 = box.querySelector('tr.zf-blk td.zf-c-action .zf-actbody') || box.querySelector('tr.zf-blk td.zf-c-action') || box.querySelector('.zf-actbody');
    const fd = b1 ? _zimniFindDate(b1.textContent || '') : null;
    if (fd) {
      let sd = box.querySelector('[data-k="io_date"]');
      const sign = box.querySelector('[data-k="io_sign"]');
      if (!sd && sign && sign.parentNode) {
        sd = document.createElement('div'); sd.className = 'zf-signdate'; sd.setAttribute('data-k', 'io_date');
        sd.setAttribute('style', 'text-align:left !important;display:block;');
        sign.parentNode.insertBefore(sd, sign.nextSibling);
      }
      if (sd) sd.textContent = fd.dmy;
    }
    if (subType) { const t = box.querySelector('.zf-title'); if (t) t.textContent = subType; }
    _zimniFixClose(box);
    return box.innerHTML;
  } catch (_) { return _zimniMigrateCols(html); }
}
window._zimniPrepBody = _zimniPrepBody;
// v558: اختتامی سطر کے آخر میں «۔» (پرانی محفوظ ضمنیوں میں بھی — اسکرین اور چھپائی دونوں)
function _zimniFixClose(root) {
  try {
    (root || document).querySelectorAll('.zf-close').forEach(el => {
      const t = String(el.textContent || '').replace(/\s+$/, '');
      if (t === 'رپورٹ ضمنی مرتب ہو کرارسال خدمت ہے') el.textContent = t + '۔';
    });
    // v558 قاعدہ: «بنام» میں صرف ایک ملزم ہو تو نمبر «1۔» نہیں (پرانی محفوظ ضمنیاں بھی)
    const accs = (root || document).querySelectorAll('[data-k="banam"] .zf-acc .nm');
    if (accs.length === 1) accs[0].textContent = String(accs[0].textContent || '').replace(/^\s*1\s*\u06D4\s*/, '');
  } catch (_) { /* ضمنی */ }
}
window._zimniFixClose = _zimniFixClose;

// Aik ضمنی ka poora chhapne wala safha — sirf working document
function _zimniDocHTML(z) {
  const c = z.content || {};
  // XSS: print/PDF raasta sanitize nahi karta tha (editor karta hai)
  return _zimniPrintHTML(_zimniSafePrint(_zimniPrepBody(c.bodyHtml, c.sub_type)));
}

// v552: کھلی ضمنی کا پرنٹ — اوپر کا «پرنٹ» بٹن اور Ctrl+P دونوں یہی (ایک ہی راستہ،
//   ایک ہی کاغذ)۔ پہلے Ctrl+P چالان کا پرنٹ چلاتا تھا جس میں ضمنی کی CSS نہیں تھی —
//   اسی سے بالکل مختلف شکل کا کاغذ کھلتا تھا۔
function _zimniCurrentPrintHTML() {
  const ed = _zimniDoc();
  if (!ed || !ed.querySelector('.zf-tbl')) return '';
  try { _zimniSyncSignDate(); } catch (_) { /* ikhtiyari */ }
  const sub = String((document.getElementById('zf-sub-type') || {}).value || '').replace('__add__', '');
  return _zimniPrintHTML(_zimniSafePrint(_zimniPrepBody(_zimniCleanHTML(ed.innerHTML), sub)));
}
// ═══ v555: ضمنی کا کاغذ چھپائی سے پہلے «تیار» ═══
//  افسر کی شکایت (21 اکتوبر 2026): «ضمنی ایک صفحے سے زیادہ ہو تو صفحہ 2، 4، 6 … والی 2pt
//  لکیر پہلے صفحے کے درمیان میں آ جاتی ہے، اور صرف لیگل پر؛ A4 پر آتی ہی نہیں۔»
//  وجہ: صفحات/مثلث کا حساب پرنٹ والے چھپے 0×0 خانے میں «اسکرین» کی شکل پر اور فونٹ
//  پوری طرح آنے سے پہلے ہوتا تھا — چھپائی کی اصل شکل اس سے مختلف نکلتی تھی۔
//  اب: منتخب کاغذ (A4 / لیگل) کی اصل چوڑائی کے خانے میں، «پرنٹ» کی شکل (@media print)
//  پر، فونٹ آنے کے بعد وہی حساب (go) ایک بار — پھر اسکرپٹ ہٹا کر سادہ، پکا HTML۔
//  پرنٹ، شیئر (PDF / Word) اور پورے مقدمے کی چھپائی تینوں یہی تیار کاغذ لیتے ہیں۔
async function _zimniFinalize(html) {
  if (typeof dioBindHtml !== 'function' || !html) return html;
  let ran = false;
  try {
    const out = await dioBindHtml(html, {
      binder: (d) => {
        const w = d && d.defaultView;
        if (!w || typeof w.__zimniGo !== 'function') return 0;
        w.__zimniGo(); ran = true; return 1;
      }
    });
    if (!ran || !out || out === html) return html;
    return String(out).replace(/<script\b[\s\S]*?<\/script>/gi, '');
  } catch (_) { return html; }
}
window._zimniFinalize = _zimniFinalize;
function _zimniSendToPrint(html) {
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
}

async function _printZimniCurrentNow() {
  let html = _zimniCurrentPrintHTML();
  if (!html) { if (typeof showToast === 'function') showToast('پرنٹ کے لیے ضمنی کھلی نہیں', 'error'); return; }
  try { if (_zimniDirty) _zimniWriteDraft(); } catch (_) { /* ikhtiyari */ }
  html = await _zimniFinalize(html);
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
}

// ═══ v553: کاغذ کا سائز پرنٹ کے وقت (اوپر کی پٹی سے لیگل/A4 ہٹا دیا گیا) ═══
//  ہر ضمنی/اندرونی ضمنی کا پرنٹ پہلے کاغذ پوچھتا ہے؛ کاغذ بدلے تو اسکرین کی
//  ترتیب بھی اسی کے مطابق (چالان والا _ch173SetPaper + ضمنی کی اپنی ترتیب)۔
function _zimniWithPaper(run) {
  if (typeof dioWithPaper !== 'function') return run();
  return dioWithPaper({
    get: () => (typeof _ch173Paper !== 'undefined' ? _ch173Paper : 'legal'),
    set: v => {
      try { if (typeof _ch173SetPaper === 'function') _ch173SetPaper(v); } catch (_) { /* ضمنی */ }
      try { const d = _zimniDoc(); if (d && d.querySelector('.zf-tbl')) _zimniLayout(); } catch (_) { /* ضمنی */ }
      try { if (document.querySelector('#ch173-doc .zfa-tbl')) _zaLayout(); } catch (_) { /* ضمنی */ }
    },
    run
  });
}
function _printZimniCurrent() { const a = arguments; return _zimniWithPaper(() => _printZimniCurrentNow.apply(null, a)); }
function _printZimniById() { const a = arguments; return _zimniWithPaper(() => _printZimniByIdNow.apply(null, a)); }
function _printAllZimni() { const a = arguments; return _zimniWithPaper(() => _printAllZimniNow.apply(null, a)); }
function _printZimniA() { const a = arguments; return _zimniWithPaper(() => _printZimniANow.apply(null, a)); }
function _printZimniAById() { const a = arguments; return _zimniWithPaper(() => _printZimniAByIdNow.apply(null, a)); }
function _printAllZimniA() { const a = arguments; return _zimniWithPaper(() => _printAllZimniANow.apply(null, a)); }
window._printZimniCurrent = _printZimniCurrent;
async function _shareZimniCurrent() {
  const z = _zimniActive || {};
  const ed = _zimniDoc();
  const subj = 'ضمنی نمبر ' + (z.serial_no || '');
  try { if (typeof dioSharePrint === 'function' && await dioSharePrint(() => _printZimniCurrent(), subj, ed)) return; } catch (_) { /* نیچے */ }
  try { if (typeof showToast === 'function') showToast('شیئر نہ ہو سکا', 'error'); } catch (_) { /* paigham */ }
}
window._shareZimniCurrent = _shareZimniCurrent;

function _zimniById(id) { return (_zimniList || []).find(z => String(z.id) === String(id)); }

// 🖨️ Aik ضمنی print
async function _printZimniByIdNow(id) {
  const z = _zimniById(id);
  if (!z) { if (typeof showToast === 'function') showToast('ضمنی نہیں ملی', 'error'); return; }
  _zimniSendToPrint(await _zimniFinalize(_zimniDocHTML(z)));
}

// 🖨️ Tamam ضمنیاں aik saath
async function _printAllZimniNow() {
  if (!_zimniList || !_zimniList.length) {
    if (typeof showToast === 'function') showToast('کوئی ضمنی موجود نہیں', 'info'); return;
  }
  // v558: کئی ضمنیاں ہوں تو کاغذ تیار ہونے میں چند سیکنڈ لگتے ہیں — افسر کو بتاؤ کہ کام جاری ہے
  try { if (typeof showToast === 'function') showToast('🖨️ تمام ضمنیاں (' + _zimniList.length + ') چھپائی کے لیے تیار ہو رہی ہیں…', 'info', 4000); } catch (_) { /* paigham */ }
  // مثل کی ترتیب: ضمنی نمبر 1، 2، 3 … (فہرست میں نئی اوپر ہوتی ہے، کاغذ پر پہلی پہلے)
  const ordered = _zimniList.slice().sort((a, b) => (_zimniRecNo(a) || 0) - (_zimniRecNo(b) || 0));
  const body = ordered.map((z, i) => {
    const c = z.content || {};
    const brk = (i < ordered.length - 1) ? 'style="page-break-after:always;"' : '';
    return `<div ${brk}>${_zimniSafePrint(_zimniPrepBody(c.bodyHtml, c.sub_type))}</div>`;
  }).join('');
  _zimniSendToPrint(await _zimniFinalize(_zimniPrintHTML(body)));
}


// ✉️ Bhejna — share sheet ya email
async function _emailZimni(id) {
  const z = _zimniById(id);
  if (!z) return;
  const c    = z.content || {};
  const dt   = z.report_date ? (typeof formatDate === 'function' ? formatDate(z.report_date) : z.report_date) : '';
  const text = (c.bodyHtml || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').replace(/\n{3,}/g, '\n\n').trim();
  const subj = `ضمنی نمبر ${z.serial_no || ''}${dt ? ' — ' + dt : ''}`;
  // پوری فائل (PDF + Word) — وہی کاغذ جو پرنٹ میں آتا ہے (افسر کی ہدایت، اکتوبر 2026)
  try { if (typeof dioSharePrint === 'function' && await dioSharePrint(() => _printZimniById(id), subj)) return; } catch (_) { /* نیچے متن والا راستہ */ }
  try {
    if (navigator.share) { await navigator.share({ title: subj, text: subj + '\n\n' + text }); return; }
  } catch (_) { /* share/clipboard na mile to koi baat nahi */ }
  try {
    window.location.href = 'mailto:?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(text);
  } catch (_) {
    try { await navigator.clipboard.writeText(subj + '\n\n' + text);
      if (typeof showToast === 'function') showToast('نقل ہو گیا', 'success'); } catch (__) { /* share/clipboard na mile to koi baat nahi */ }
  }
}

window._printZimniById = _printZimniById;
window._printAllZimni  = _printAllZimni;
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
        // v558: اندرونی ضمنی (بیانات 161) پہلے — پہلے یہ چالان کے _saveR173 پر چلی جاتی تھی
        if (doc.querySelector('.zfa-tbl')) { _saveZimniA(false, true); done = true; }
        else if (doc.querySelector('.zf-tbl')) { _saveZimni(false, true); done = true; }   // کھلی رہے
        else if (typeof _saveR173 === 'function') { _saveR173(); done = true; }
      }
    } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
    if (done) return;
    // باقی فارم — صفحے کا "محفوظ" بٹن دبا دو
    try {
      const btn = [...document.querySelectorAll('button')].find(b => {
        const t = (b.textContent || '');
        return /محفوظ|Save/i.test(t) && b.offsetParent !== null && !b.disabled;
      });
      if (btn) { e.preventDefault(); btn.click(); }
    } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  }, true);
}
window._dioBindCtrlS = _dioBindCtrlS;
try { _dioBindCtrlS(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }


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
const ZIMNI_A_VER = 'zimni-androoni v24 — v558: local-first save + autosave draft + sync, witness dropdown, (زیردفعہ 161ض ف)';
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

/* بیرونی ضمنی کی `ZIMNI_CONTENT_COLS` کی طرح — یہ فہرست بھی کہیں
   موجود نہیں تھی، اور یہی وہ خرابی تھی جو میدان میں سامنے آئی:
   "ZIMNI_A_CONTENT_COLS is not defined"۔ ضمنی اندرونی کا اپنا الگ
   کالم ہو سکتا ہے، اس لیے فہرست الگ رکھی گئی ہے (یاد رکھنے کی کلید
   بھی الگ ہے: dio_zimni_a_col)۔ */
const ZIMNI_A_CONTENT_COLS = [
  'content', 'content_json', 'data', 'body', 'body_html',
  'details', 'matn', 'text', 'report', 'zimni_content'
];

function _zaColPref() {
  try { return localStorage.getItem('dio_zimni_a_col') || ''; } catch (_) { return ''; }
}
function _zaColSet(c) {
  try { if (c) localStorage.setItem('dio_zimni_a_col', c); } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
}

function _zaContentOf(row) {
  if (!row) return {};
  for (const c of [_zaColPref(), ...ZIMNI_A_CONTENT_COLS]) {
    if (!c || !(c in row)) continue;
    let v = row[c];
    if (v == null) continue;
    if (typeof v === 'string') {
      const t = v.trim();
      if (t.startsWith('{')) { try { return JSON.parse(t); } catch (_) { /* kharab/khali JSON — pehle se tay qadr rahe */ } }
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
        // v558: update پر 0 قطار = سرور پر ریکارڈ نہیں / اجازت نہیں (خاموش RLS) — «محفوظ» نہ مانو
        if (id && Array.isArray(res.data) && !res.data.length) {
          const er = new Error('سرور پر یہ بیان (اندرونی ضمنی) نہیں ملا یا ترمیم کی اجازت نہیں'); er.code = 'DIO_NOROW'; throw er;
        }
        _zaColSet(col);
        return (res.data && res.data[0]) || Object.assign({ id: id || ('tmp_' + Date.now()) }, rec);
      } catch (e) {
        lastErr = e;
        if (_zimniIsNetErr(e)) throw e;                    // v558: انٹرنیٹ نہیں — باقی نام آزمانا بے کار
        if (e && e.code === 'DIO_NOROW') throw e;
        if (e && e.code === 'PGRST204') {
          const miss = _zaMissingCol(e);
          if (miss && miss === col) break;
          if (miss && miss in payloadBase) { delete payloadBase[miss]; continue; }
        }
        // تاریخ کی شکل رد — بغیر تاریخ دوبارہ (مواد میں وقت پھر بھی محفوظ)
        if (e && (e.code === '22007' || e.code === '22008' || /date\/time|type date/i.test(String(e.message || '')))
              && 'report_date' in payloadBase) {
          delete payloadBase.report_date; continue;
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
        // v552: غلطی کالم کے نام کی نہیں (مثلاً اجازت/انٹرنیٹ) — اصل وجہ فوراً، دوسرے نام آزما کر چھپاؤ نہیں
        if (!(lastErr && lastErr.code === 'PGRST204' && _zaMissingCol(lastErr) === col)) throw lastErr;
        break;
      }
    }
  }
  throw lastErr || new Error('محفوظ نہ ہو سکی');
}
window._zaWrite = _zaWrite;

// ═══════════════════════════════════════════════════════════════
//  v558 — اندرونی ضمنی (بیانات 161) کا محفوظ کرنے کا نظام = بیرونی ضمنی (v552) والا
//  افسر کی شکایت (22 اکتوبر 2026): «محفوظ کرنے کے باوجود بیان کہیں محفوظ نہیں — سارا بیان
//  دوبارہ لکھنا پڑے گا۔ ضمنیات/بیانات/نقشے/چالان کا محفوظ کرنے کا نظام ہر جگہ مختلف ہے۔»
//  پرانی کمزوریاں:
//   (1) سرور سے ایک بار بھی پڑھنا ناکام ہو (عارضی انٹرنیٹ) تو پورے سیشن کے لیے «ڈیٹابیس
//       ٹوٹا» مان لیا جاتا — پھر ہر بیان صرف اسی آلے پر رہتا، سرور پر جاتا ہی نہیں تھا۔
//   (2) کوئی خودکار مسودہ نہیں — محفوظ دبانے سے پہلے پرنٹ/دوسرا صفحہ/آلہ بند = لکھا ضائع۔
//   (3) آلے پر رکھا بیان خود سرور پر نہیں جاتا تھا (پرانی قطار کالم کا نام نہیں جانتی تھی)۔
//  اب (بیرونی ضمنی جیسا، ایک ہی اصول):
//   • محفوظ = پہلے اسی آلے پر (کبھی ضائع نہیں)، پھر سرور؛ سرور نہ ملے تو «سرور پر بھیجنا
//     باقی» اور انٹرنیٹ آتے ہی خود سرور پر — دوہرا اندراج نہیں
//   • «ٹوٹا» صرف تب جب سرور پر جدول/کالم ہی نہ ہو (عارضی خرابی پر نہیں)
//   • لکھتے ہی خودکار مسودہ (اسی آلے پر) — صفحہ چھپنے/بند ہونے پر فوراً
//   • فہرست میں ہر بیان کی حالت: مسودہ / اس آلے پر — سرور پر بھیجنا باقی / سرور پر محفوظ
// ═══════════════════════════════════════════════════════════════
function _zaLocalGet(caseId) {
  try { const a = JSON.parse(localStorage.getItem('dio_za_' + caseId) || '[]'); return Array.isArray(a) ? a : []; }
  catch (_) { return []; }
}
function _zaLocalPut(caseId, list) {
  try { localStorage.setItem('dio_za_' + caseId, JSON.stringify(list || [])); return true; }
  catch (e) { if (typeof dioLogError === 'function') dioLogError('zimni androoni: local list save nakaam', e); return false; }
}
function _zaSno(z) {
  return parseInt(z && z.serial_no, 10) || parseInt(((z && z.content) || {}).serial_no, 10) || 0;
}
// فہرست: تاریخ کے حساب سے (نئی اوپر)، ایک تاریخ پر نمبر کے حساب سے
function _zaSort(list) {
  return (list || []).sort((a, b) => {
    const da = String(a.report_date || ''), db = String(b.report_date || '');
    if (da !== db) return db.localeCompare(da);
    return _zaSno(b) - _zaSno(a);
  });
}

async function _loadZimniA() {
  // مقامی نقل ہمیشہ ہاتھ میں (آف لائن یا ناکام محفوظ والے بیانات ضائع نہ ہوں)
  const local = _zaLocalGet(_zaCaseId);
  if (!navigator.onLine || window._zaDbBroken || typeof supabaseClient === 'undefined' || !supabaseClient) {
    _zaList = _zaSort(local.slice()); return;
  }
  let rows = null;
  try {
    // ═══ SECURITY: صرف اس مقدمے کے بیانات (case_id) — کبھی بغیر چھانٹی نہیں ═══
    let r = await supabaseClient.from('zimni_androoni_reports').select('*')
      .eq('case_id', _zaCaseId).order('serial_no', { ascending: true });
    if (r.error && !_zimniIsNetErr(r.error)) r = await supabaseClient.from('zimni_androoni_reports').select('*').eq('case_id', _zaCaseId);
    if (r.error) throw r.error;
    rows = r.data || [];
  } catch (e) {
    // v558: «ٹوٹا» صرف ڈھانچے کی غلطی پر (جدول/کالم نہیں) — عارضی انٹرنیٹ خرابی پر نہیں
    const schema = e && /^(PGRST204|PGRST205|42703|42P01)$/.test(String(e.code || ''));
    if (schema) { window._zaDbBroken = true; window._zaBrokenAt = Date.now(); }
    try { console.error('[zimni androoni load]', e); } catch (_) { /* console na ho to bhi na phatte */ }
    if (schema && !window._zaDbWarned) {
      window._zaDbWarned = true;
      try { showToast('سرور پر بیانات (اندرونی ضمنی) کا ڈھانچہ نہیں ملا (' + _zimniErrText(e) + ') — بیانات فی الحال اسی آلے پر محفوظ ہو رہے ہیں', 'warn', 9000); }
      catch (_) { /* paigham na dikh sake to koi baat nahi */ }
    }
    _zaList = _zaSort(local.slice());
    return;
  }
  const fromDb = rows.map(r => Object.assign({}, r, { content: _zaContentOf(r) }));
  // اسی آلے پر کی گئی ترمیم جو ابھی سرور تک نہیں گئی — سرور کی پرانی نقل اسے نہ مٹائے
  const pendById = {};
  local.forEach(z => { if (z && z._pending && z.id != null) pendById[String(z.id)] = z; });
  const merged = fromDb.map(r => {
    const p = pendById[String(r.id)];
    if (!p) return r;
    const ls = String((p.content || {}).saved_at || ''), ss = String((r.content || {}).saved_at || '');
    return (ls && ls >= ss) ? p : r;
  });
  const ids = new Set(fromDb.map(r => String(r.id)));
  const onlyLocal = local.filter(z => z && _zimniIsPending(z) && !ids.has(String(z.id)));
  _zaList = _zaSort(merged.concat(onlyLocal));
  _zaLocalPut(_zaCaseId, _zaList);
}

// ── SYNC: آلے پر محفوظ (سرور پر بھیجنا باقی) بیانات — انٹرنیٹ آتے ہی خود ──
let _zaSyncBusy = false;
const _zaInFlight = new Set();
function _zaPendingCaseIds() {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const m = /^dio_za_(.+)$/.exec(localStorage.key(i) || '');
      if (!m || /^draft_/.test(m[1])) continue;
      if (_zaLocalGet(m[1]).some(_zimniIsPending)) out.push(m[1]);
    }
  } catch (_) { /* storage na ho to kuch nahi */ }
  return out;
}
async function _zaSyncOne(caseId, z) {
  const c = z.content || {};
  const base = { case_id: caseId, serial_no: _zaSno(z) || 1, report_date: z.report_date || _zimniTodayIso() };
  try {
    const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
    if (oid) base.officer_id = oid;
  } catch (_) { /* officer id na mile to bhi aage */ }
  let serverId = _zimniIsPending({ id: z.id }) ? null : z.id;
  if (!serverId) {
    // پہلے بھیجا جا چکا؟ (جواب راستے میں ٹوٹ گیا ہو) — اسی نمبر + اسی «محفوظ کرنے کے وقت» والا
    try {
      const r = await supabaseClient.from('zimni_androoni_reports').select('*').eq('case_id', caseId).eq('serial_no', base.serial_no);
      const hit = ((r && r.data) || []).find(x => String((_zaContentOf(x) || {}).saved_at || '') === String(c.saved_at || ''));
      if (hit) serverId = hit.id;
    } catch (_) { /* talaash na ho saki — naya bana do */ }
  }
  const saved = await _zaWrite(base, c, serverId);
  return Object.assign({}, saved, { content: c, _pending: false, _sync_err: '' });
}
function _zaMergeSynced(list, oldId, sentSavedAt, nz) {
  const j = list.findIndex(x => String(x.id) === String(oldId));
  if (j < 0) return false;
  const cur = list[j];
  if (String((cur.content || {}).saved_at || '') === String(sentSavedAt || '')) list[j] = nz;
  else list[j] = Object.assign({}, cur, { id: nz.id, _pending: true });   // نئی ترمیم باقی — اگلی بار update
  return true;
}
function _zaRekeyDraft(caseId, oldId, newId) {
  if (String(oldId) === String(newId)) return;
  try {
    const o = _zaDrafts(caseId);
    if (o['id:' + oldId]) { o['id:' + newId] = Object.assign({}, o['id:' + oldId], { key: 'id:' + newId, za_id: newId }); delete o['id:' + oldId]; _zaDraftsPut(caseId, o); }
  } catch (_) { /* draft na ho to kuch nahi */ }
}
async function _zaSyncPending(caseIds, quiet) {
  if (_zaSyncBusy) return 0;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 0;
  if (typeof supabaseClient === 'undefined' || !supabaseClient) return 0;
  try { const s = await supabaseClient.auth.getSession(); if (!s || !s.data || !s.data.session) return 0; } catch (_) { return 0; }
  _zaSyncBusy = true;
  let done = 0, failed = 0, lastWhy = '', again = false;
  try {
    for (const cid of (caseIds || _zaPendingCaseIds())) {
      const snapshot = _zaLocalGet(cid).filter(_zimniIsPending);
      for (const z of snapshot) {
        if (_zaInFlight.has(String(z.id))) continue;
        _zaInFlight.add(String(z.id));
        const sentAt = (z.content || {}).saved_at || '';
        try {
          const nz = await _zaSyncOne(cid, z);
          _zaRekeyDraft(cid, z.id, nz.id);
          const fresh = _zaLocalGet(cid);
          _zaMergeSynced(fresh, z.id, sentAt, nz);
          _zaLocalPut(cid, fresh);
          if (String(cid) === String(_zaCaseId)) {
            _zaMergeSynced(_zaList, z.id, sentAt, nz);
            if (_zaActive && String(_zaActive.id) === String(z.id)) {
              _zaActive = Object.assign({}, _zaActive, { id: nz.id });
              if (String((_zaActive.content || {}).saved_at || '') === String(sentAt)) _zaActive._pending = false;
            }
          }
          if (fresh.some(x => String(x.id) === String(nz.id) && x._pending)) again = true;
          done++;
        } catch (e) {
          if (_zimniIsNetErr(e)) return done;   // نیٹ پھر ٹوٹ گیا — بعد میں (مقامی نقل جوں کی توں)
          failed++; lastWhy = _zimniErrText(e);
          const fresh = _zaLocalGet(cid);
          const j = fresh.findIndex(x => String(x.id) === String(z.id));
          if (j >= 0) { fresh[j] = Object.assign({}, fresh[j], { _pending: true, _sync_err: lastWhy }); _zaLocalPut(cid, fresh); }
          if (String(cid) === String(_zaCaseId)) {
            const k = _zaList.findIndex(x => String(x.id) === String(z.id));
            if (k >= 0) _zaList[k] = Object.assign({}, _zaList[k], { _sync_err: lastWhy });
          }
        } finally { _zaInFlight.delete(String(z.id)); }
      }
    }
  } finally { _zaSyncBusy = false; }
  try {
    if (done) showToast(done + ' بیان (اندرونی ضمنی) سرور پر محفوظ (sync) ہو گئے', 'success', 4000);
    if (failed && !(quiet && lastWhy === window._zaLastFailWhy)) showToast(failed + ' بیان سرور پر نہیں گئے — وجہ: ' + lastWhy + ' (اس آلے پر محفوظ ہیں)', 'error', 9000);
    window._zaLastFailWhy = failed ? lastWhy : '';
  } catch (_) { /* paigham na dikh sake to koi baat nahi */ }
  try { if ((done || (failed && !quiet)) && document.querySelector('.zat-wrap')) _renderZimniAList(); } catch (_) { /* list khuli na ho to kuch nahi */ }
  if (again) setTimeout(() => { _zaSyncPending(); }, 1500);
  return done;
}
window._zaSyncPending = _zaSyncPending;
// پرانی آف لائن قطار (offline-store) سے: اس بیان کی مقامی نقل «sync باقی»
function _zaMarkPending(caseId, id) {
  const ids = caseId ? [String(caseId)] : _zaPendingCaseIds();
  for (const cid of ids) {
    const list = _zaLocalGet(cid);
    const j = list.findIndex(x => String(x.id) === String(id));
    if (j >= 0 && !list[j]._pending) { list[j]._pending = true; _zaLocalPut(cid, list); return true; }
  }
  return false;
}
window._zaMarkPending = _zaMarkPending;
window.addEventListener('online', () => { window._zaDbBroken = false; setTimeout(() => { _zaSyncPending(); }, 3000); });
setTimeout(() => { try { if (navigator.onLine) _zaSyncPending(); } catch (_) { /* boot par na ho sake to baad mein */ } }, 7000);
// v558: بیرونی ضمنی والا اصول — ہر منٹ، ایپ پر واپس آتے ہی، اور فہرست کھلتے ہی دوبارہ کوشش
function _zaSyncSoon() {
  try {
    if (!navigator.onLine) return;
    if (window._zaDbBroken && Date.now() - (window._zaBrokenAt || 0) > 300000) window._zaDbBroken = false;
    if (Date.now() - (window._zaLastTry || 0) < 20000) return;
    window._zaLastTry = Date.now();
    if (_zaPendingCaseIds().length) _zaSyncPending(null, true);
  } catch (_) { /* agli dafa */ }
}
setInterval(_zaSyncSoon, 60000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') setTimeout(_zaSyncSoon, 1700); });

// ── خودکار مسودہ (Autosave) — لکھتے ہی اسی آلے پر؛ سرور پر نہیں (آدھا بیان ریکارڈ میں نہ جائے) ──
function _zaDraftKey(caseId) { return 'dio_za_draft_' + caseId; }
function _zaDrafts(caseId) {
  try { const o = JSON.parse(localStorage.getItem(_zaDraftKey(caseId || _zaCaseId)) || '{}'); return (o && typeof o === 'object') ? o : {}; }
  catch (_) { return {}; }
}
function _zaDraftsPut(caseId, o) {
  try {
    const k = _zaDraftKey(caseId || _zaCaseId);
    if (o && Object.keys(o).length) localStorage.setItem(k, JSON.stringify(o)); else localStorage.removeItem(k);
    return true;
  } catch (_) { return false; }
}
function _zaActiveDraftKey() {
  const z = _zaActive || {};
  if (z.id) return 'id:' + z.id;
  if (!z._draftKey) z._draftKey = 'new:' + Date.now();
  return z._draftKey;
}
// صفحے پر جن گواہان کے بیانات ہیں — اُن کے نام (DOM سے، ہمیشہ اصل مواد کے مطابق)
function _zaWitNames(root) {
  try {
    return [...new Set([...root.querySelectorAll('.zfa-wit-block')]
      .map(b => (b.getAttribute('data-witness-name') || '').trim()).filter(Boolean))];
  } catch (_) { return []; }
}
function _zaWriteDraft() {
  const ed = _zimniDoc();
  if (!ed || !ed.querySelector('.zfa-tbl') || !_zaActive) return false;
  const o = _zaDrafts();
  const key = _zaActiveDraftKey();
  o[key] = {
    key, za_id: _zaActive.id || null, serial_no: _zaActive.serial_no || null,
    report_date: _zaActive.report_date || '',
    bodyHtml: _zimniCleanHTML(ed.innerHTML), witnesses: _zaWitNames(ed),
    saved_at: new Date().toISOString(),
  };
  const ok = _zaDraftsPut(_zaCaseId, o);
  if (ok) {
    const el = document.getElementById('zfa-autosave');
    if (el) el.textContent = 'خودکار محفوظ (اس آلے پر): ' + _zimniFmtStamp(o[key].saved_at);
  }
  return ok;
}
window._zaWriteDraft = _zaWriteDraft;
function _zaClearDraft(key) {
  const o = _zaDrafts();
  if (key && o[key]) { delete o[key]; _zaDraftsPut(_zaCaseId, o); }
}
let _zaDirty = false;
function _zaMarkDirty() {
  _zaDirty = true;
  const ed = _zimniDoc();
  if (!ed) return;
  clearTimeout(ed._zfaDraftT);
  ed._zfaDraftT = setTimeout(() => { try { _zaRefPlace(); } catch (_) { /* حوالہ */ } try { if (_zaDirty) _zaWriteDraft(); } catch (_) { /* agli dafa */ } }, 1500);
}
function _zaWatchEdits() {
  const ed = _zimniDoc();
  if (!ed || ed._zfaDraftBound) return;
  ed._zfaDraftBound = true;
  ed.addEventListener('input', _zaMarkDirty);
  ed.addEventListener('paste', () => setTimeout(_zaMarkDirty, 0));
  ed.addEventListener('cut', () => setTimeout(_zaMarkDirty, 0));
}
if (!window._zfaUnloadBound) {
  window._zfaUnloadBound = true;
  const flush = () => { try { if (_zaDirty) _zaWriteDraft(); } catch (_) { /* band hote waqt — jo ho sake */ } };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  window.addEventListener('pagehide', flush);
  window.addEventListener('beforeunload', flush);
  setInterval(() => { try { if (_zaDirty && document.querySelector('#ch173-doc .zfa-tbl')) _zaWriteDraft(); } catch (_) { /* agli dafa */ } }, 20000);
}

// ── LIST VIEW — بیانات تاریخ اور گواہان کے ناموں کے ساتھ ─────────────
function _zaDmy(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[3] + '/' + m[2] + '/' + m[1];
  const s = String(iso || '').trim();
  return s ? ((typeof formatDate === 'function') ? formatDate(s) : s) : '—';
}
function _zaTime(iso) {
  try {
    if (!iso) return '';
    const x = new Date(iso); if (isNaN(x)) return '';
    let h = x.getHours(); const m = String(x.getMinutes()).padStart(2, '0');
    const ap = h < 12 ? 'am' : 'pm'; h = h % 12 || 12;
    return String(h).padStart(2, '0') + ':' + m + ' ' + ap;
  } catch (_) { return ''; }
}
// گواہان کے نام — محفوظ فہرست، نہ ہو تو صفحے کے مواد سے (پرانے بیانات)
function _zaWitOf(z) {
  const c = (z && z.content) || z || {};
  let arr = Array.isArray(c.witnesses) ? c.witnesses.slice() : [];
  if (!arr.length && c.bodyHtml) {
    try { const t = document.createElement('template'); t.innerHTML = String(c.bodyHtml); arr = _zaWitNames(t.content); } catch (_) { arr = []; }
  }
  return arr;
}
function _zaShortName(n) {
  try { if (window.DIOCard && DIOCard.coreName) return DIOCard.coreName(n) || n; } catch (_) { /* poora naam */ }
  return String(n || '').split(/\s+ولد\s+|\s+زوجہ\s+|\s+دختر\s+/)[0];
}

function _renderZimniAList() {
  try { if (typeof _ch173FocusMode === 'function') _ch173FocusMode(false); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  try { if (typeof _ch173FullPage === 'function') _ch173FullPage(area); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
  _zaActive = null; _zaDirty = false;

  const drafts = _zaDrafts();
  const newDrafts = Object.keys(drafts).filter(k => k.indexOf('new:') === 0).map(k => drafts[k])
    .sort((a, b) => String(b.saved_at).localeCompare(String(a.saved_at)));
  const list = _zaSort(_zaList.slice());
  const J = (v) => _dioJsHtml(v);
  const names = (arr) => arr.length
    ? arr.map(n => `<span class="zat-wn" title="${esc(n)}">${esc(_zaShortName(n))}</span>`).join('<span class="zat-sep">، </span>')
    : '<span style="color:var(--text-muted);">—</span>';
  const status = (z) => {
    if (drafts['id:' + z.id]) return '<span class="zst zst-d">غیر محفوظ ترمیم (مسودہ)</span>';
    if (_zimniIsPending(z)) {
      return '<span class="zst zst-p" title="' + esc(z._sync_err || '') + '">اس آلے پر محفوظ — سرور پر بھیجنا باقی</span>'
        + (z._sync_err ? '<div class="zst-why">' + esc(z._sync_err) + '</div>' : '');
    }
    return '<span class="zst zst-ok">سرور پر محفوظ</span>';
  };
  const pendingCount = list.filter(_zimniIsPending).length;
  if (pendingCount) setTimeout(_zaSyncSoon, 800);   // v558: فہرست کھلتے ہی باقی بیانات سرور پر

  area.innerHTML = `
  <style>
    .zat-wrap{ padding:14px; direction:rtl; height:100%; overflow-y:auto; box-sizing:border-box;
      font-family:'Jameel Noori Nastaleeq'; }
    .zat-wrap .zt-bar{ display:flex; align-items:center; gap:10px; margin:0 0 10px; flex-wrap:wrap; }
    .zat-wrap .zt-h{ flex:1; text-align:center; font-size:16pt; font-weight:700; color:var(--accent); min-width:8em; }
    .zat-wrap .zt{ width:100%; border-collapse:collapse; font-size:13pt; direction:rtl; }
    .zat-wrap .zt th{ background:var(--bg-tertiary); border:1px solid var(--border); padding:7px 6px;
            font-weight:700; white-space:nowrap; text-align:center; font-size:12pt; }
    .zat-wrap .zt td{ border:1px solid var(--border); padding:6px; vertical-align:middle; }
    .zat-wrap .zt tbody tr:nth-child(odd){ background:var(--bg-secondary); }
    .zat-wrap .zt tbody tr:hover{ background:var(--hover-bg); }
    .zat-wrap .num{ text-align:center; font-weight:700; width:70px; }
    .zat-wrap .dtc{ text-align:center; white-space:nowrap; width:130px; direction:ltr; unicode-bidi:isolate; font-size:12pt; }
    .zat-wrap .wq{ font-size:10.5pt; color:var(--text-muted); margin-top:2px; direction:ltr; unicode-bidi:isolate; }
    .zat-wrap .zat-wn{ white-space:nowrap; }
    .zat-wrap .zat-sep{ color:var(--text-muted); }
    .zat-wrap .act{ text-align:center; width:1%; white-space:nowrap; }
    .zat-wrap .act-in{ display:flex; flex-wrap:nowrap; gap:4px; justify-content:center; }
    .zat-wrap .zab{ display:inline-flex; align-items:center; gap:4px; border:1px solid var(--border); background:var(--bg-card);
          color:var(--text-primary); border-radius:7px; padding:4px 8px; cursor:pointer; font-size:11.5pt; line-height:1.3;
          font-family:inherit; white-space:nowrap; }
    .zat-wrap .zab:hover{ background:var(--hover-bg); border-color:var(--accent); }
    .zat-wrap .zab.zab-del{ color:#b91c1c; }
    .zat-wrap .zst{ display:inline-block; font-size:10.5pt; padding:1px 8px; border-radius:999px; white-space:nowrap; }
    .zat-wrap .zst-ok{ background:rgba(22,163,74,.12); color:#15803d; }
    .zat-wrap .zst-p{ background:rgba(217,119,6,.14); color:#b45309; }
    .zat-wrap .zst-d{ background:rgba(37,99,235,.12); color:#1d4ed8; }
    .zat-wrap .zst-why{ font-size:9.5pt; color:#b91c1c; margin-top:2px; }
    .zat-wrap .zt tr.zt-draft td{ background:rgba(37,99,235,.06); }
    @media (max-width:760px){
      .zat-wrap .zt thead{ display:none; }
      .zat-wrap .zt, .zat-wrap .zt tbody, .zat-wrap .zt tr, .zat-wrap .zt td{ display:block; width:auto !important; }
      .zat-wrap .zt tr{ border:1px solid var(--border); border-radius:10px; margin-bottom:10px; padding:6px 8px; background:var(--bg-card) !important; }
      .zat-wrap .zt td{ border:0; padding:3px 0; text-align:right !important; }
      .zat-wrap .zt td.num::before{ content:'نمبر شمار: '; font-weight:400; color:var(--text-muted); }
      .zat-wrap .zt td.dtc{ direction:rtl; }
      .zat-wrap .zt td.dtc::before{ content:'تاریخ: '; color:var(--text-muted); }
      .zat-wrap .zt td.wit::before{ content:'گواہان: '; color:var(--text-muted); }
      .zat-wrap .zat-wn{ white-space:normal; }
      .zat-wrap .act-in{ justify-content:flex-start; flex-wrap:wrap; }
      .zat-wrap .act{ white-space:normal; }
    }
  </style>
  <div class="zat-wrap">
    <div class="zt-bar">
      <button class="btn btn-primary btn-sm dio-add-btn" onclick="_newZimniA()">+ بیان درج کریں</button>
      <div class="zt-h">بیانات 161 ض ف (${list.length})</div>
      ${pendingCount && navigator.onLine ? `<button class="btn btn-secondary btn-sm" onclick="_zaSyncPending()">⟳ سرور پر بھیجیں (${pendingCount})</button>` : ''}
      <button class="btn btn-secondary btn-sm" onclick="_printAllZimniA()">🖨️ تمام بیانات</button>
    </div>
    ${(list.length || newDrafts.length) ? `
    <table class="zt">
      <thead><tr>
        <th class="num">نمبر شمار</th>
        <th class="dtc">تاریخ و وقت</th>
        <th>گواہان (جن کے بیانات)</th>
        <th>حالت</th>
        <th class="act">ایکشن</th>
      </tr></thead>
      <tbody>
        ${newDrafts.map(d => `
          <tr class="zt-draft" ondblclick="_openZimniADraft('${J(d.key)}')" style="cursor:pointer;">
            <td class="num">${esc(String(d.serial_no || ''))}</td>
            <td class="dtc">${esc(_zaDmy(d.report_date || d.saved_at))}<div class="wq">${esc(_zaTime(d.saved_at))}</div></td>
            <td class="wit">${names(_zaWitOf(d))}</td>
            <td><span class="zst zst-d">مسودہ — ابھی محفوظ نہیں کیا گیا</span></td>
            <td class="act">${dioActRow(
              dioActBtn('edit', `_openZimniADraft('${J(d.key)}')`, 'جاری رکھیں')
              + dioActBtn('delete', `_deleteZimniADraft('${J(d.key)}')`, 'حذف')
            )}</td>
          </tr>`).join('')}
        ${list.map(z => `
          <tr ondblclick="_openZimniA('${J(z.id)}')" style="cursor:pointer;" data-zaid="${esc(String(z.id))}">
            <td class="num">${esc(String(_zaSno(z) || ''))}</td>
            <td class="dtc">${esc(_zaDmy(z.report_date))}${_zaTime((z.content || {}).saved_at) ? `<div class="wq">${esc(_zaTime((z.content || {}).saved_at))}</div>` : ''}</td>
            <td class="wit">${names(_zaWitOf(z))}</td>
            <td>${status(z)}</td>
            <td class="act">${dioActRow(
              dioActBtn('edit', `_openZimniA('${J(z.id)}')`, 'ترمیم')
              + dioActBtn('print', `_printZimniAById('${J(z.id)}')`, 'پرنٹ — کھولے بغیر')
              + dioActBtn('share', `_emailZimniA('${J(z.id)}')`, 'شیئر — PDF / Word')
              + dioActBtn('delete', `_deleteZimniA('${J(z.id)}')`, 'حذف')
            )}</td>
          </tr>`).join('')}
      </tbody>
    </table>` : `
    <div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
      <div style="font-size:30pt;margin-bottom:10px;">📋</div>
      <div style="font-size:14pt;">ابھی کوئی بیان درج نہیں</div>
      <div style="font-size:11pt;margin-top:6px;">اوپر «بیان درج کریں» پر کلک کریں</div>
    </div>`}
  </div>`;
}
window._renderZimniAList = _renderZimniAList;

// ── فہرست کے ایکشن ─────────────────────────────────────────────
const _zaRec = (id) => _zaList.find(z => String(z.id) === String(id));


// نئے بیان کا نمبر = محفوظ شدہ میں سب سے بڑا + 1 (چھوڑے ہوئے مسودے نہیں گنے جاتے)
function _zaNextSerial() {
  return (_zaList || []).reduce((m, z) => Math.max(m, _zaSno(z)), 0) + 1;
}
function _newZimniA() {
  _zaActive = { id: null, serial_no: _zaNextSerial(), report_date: _zimniTodayIso(), content: null, _draftKey: 'new:' + Date.now() };
  _zaDirty = false;
  _renderZimniAEditor();
}
window._newZimniA = _newZimniA;

function _openZimniA(id) {
  const z = _zaList.find(x => String(x.id) === String(id)) || null;
  if (!z) return;
  _zaActive = Object.assign({}, z);
  _zaDirty = false;
  // اسی بیان کا خودکار مسودہ (غیر محفوظ ترمیم) — تازہ ہو تو وہی کھولو
  const d = _zaDrafts()['id:' + z.id];
  const zs = String((z.content || {}).saved_at || '');
  if (d && d.bodyHtml && String(d.saved_at) > zs) {
    _zaActive.content = Object.assign({}, z.content || {}, { bodyHtml: d.bodyHtml });
    _zaActive._restored = true;
  }
  _renderZimniAEditor();
  if (_zaActive && _zaActive._restored) {
    _zaDirty = true;
    try { showToast('غیر محفوظ ترمیم (خودکار مسودہ) بحال کر دی گئی — محفوظ کرنے کے لیے Ctrl+S / «اپ ڈیٹ»', 'info', 6000); } catch (_) { /* paigham */ }
  }
}
window._openZimniA = _openZimniA;

// مسودہ (نیا بیان جو ابھی محفوظ نہیں ہوا) دوبارہ کھولو
function _openZimniADraft(key) {
  const d = _zaDrafts()[key];
  if (!d) { _renderZimniAList(); return; }
  _zaActive = { id: null, serial_no: d.serial_no || _zaNextSerial(), report_date: d.report_date || _zimniTodayIso(),
    _draftKey: key, content: { bodyHtml: d.bodyHtml } };
  _zaDirty = true;
  _renderZimniAEditor();
}
window._openZimniADraft = _openZimniADraft;
function _deleteZimniADraft(key) {
  if (!confirm('یہ غیر محفوظ مسودہ حذف کر دیں؟ (واپس نہیں آئے گا)')) return;
  _zaClearDraft(key);
  _renderZimniAList();
}
window._deleteZimniADraft = _deleteZimniADraft;

// ← واپس (فہرست) — غیر محفوظ تبدیلی ہو تو پوچھو (مسودہ ویسے بھی آلے پر محفوظ ہے)
async function _zaAskSave(what) {
  if (!_zaDirty) return true;
  try { _zaWriteDraft(); } catch (_) { /* agli dafa */ }
  if (confirm('تبدیلیاں ابھی محفوظ نہیں ہوئیں۔ محفوظ کر کے ' + what + '؟\n(«Cancel» = بغیر محفوظ کیے — مسودہ اس آلے پر رہے گا)')) {
    const ok = await _saveZimniA(false, true);
    if (!ok) return false;
  }
  return true;
}
async function _zaBackToList() {
  if (!(await _zaAskSave('فہرست پر جائیں'))) return;
  _zaDirty = false;
  await _loadZimniA();
  _renderZimniAList();
}
window._zaBackToList = _zaBackToList;
// ✕ بند — بیانات کا صفحہ بند (مقدمے کی مسل پر واپس)
async function _zaClose() {
  if (!(await _zaAskSave('بند کریں'))) return;
  _zaDirty = false;
  _zaActive = null;
  try { if (typeof _ch173FocusMode === 'function') _ch173FocusMode(false); } catch (_) { /* chips wapas */ }
  try {
    if (typeof _dioCloseTab === 'function' && typeof _dioActiveTab !== 'undefined' && _dioActiveTab === 'statements_161') { _dioCloseTab('statements_161'); return; }
  } catch (_) { /* agla raasta */ }
  try { if (typeof _openDocId !== 'undefined') _openDocId = null; } catch (_) { /* ikhtiyari */ }
  try { if (typeof openCaseWorkspace === 'function' && _zaCaseId) { openCaseWorkspace(_zaCaseId); return; } } catch (_) { /* agla raasta */ }
  _renderZimniAList();
}
window._zaClose = _zaClose;

// ── EDITOR ──────────────────────────────────────────────────────
// v558 (افسر کی ہدایت، 22 اکتوبر 2026): اوپر کی ٹول بار مکمل ختم — صرف
//   • دائیں کونے میں «بیان ازاں ▾» — اس مقدمے کے تمام گواہان (مدعی اور محرر خود شامل)؛ نام
//     چنتے ہی اُس گواہ کا بیان صفحے پر
//   • «محفوظ / اپ ڈیٹ» (Ctrl+S بھی)، «← واپس» (بیانات کی فہرست)، «✕ بند»
//   فونٹ/بولڈ وغیرہ کی بورڈ سے (Ctrl+B/I/U، Ctrl + / −) — ویسے ہی چلتے ہیں۔
function _zaBarCSS() {
  return `
  .zfa-bar{ display:flex; align-items:center; gap:8px; padding:6px 10px; border-bottom:1px solid var(--border);
    flex-wrap:wrap; background:var(--bg-secondary); direction:rtl;
    font-family:'Jameel Noori Nastaleeq'; }
  .zfa-bar .zfa-pick{ display:flex; align-items:center; gap:6px; min-width:0; flex:0 1 auto; }
  .zfa-bar .zfa-pick-lbl{ font-size:12pt; font-weight:700; color:var(--accent); white-space:nowrap; }
  .zfa-bar #zfa-wit-sel{ height:32px; min-width:12em; max-width:min(26em, 62vw); border:1px solid var(--accent);
    border-radius:8px; background:var(--bg-card,#fff); color:var(--text-primary,#111); font-size:12pt;
    padding:0 8px; cursor:pointer; font-family:inherit; }
  .zfa-bar .zfa-stamps{ display:flex; flex-direction:column; line-height:1.35; font-size:8.5pt; color:var(--text-muted); }
  .zfa-bar .zfa-end{ margin-right:auto; display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
  @media (max-width:760px){
    .zfa-bar{ gap:6px; padding:6px 8px; }
    .zfa-bar .zfa-pick{ flex:1 1 100%; }
    .zfa-bar #zfa-wit-sel{ flex:1; max-width:none; min-width:0; }
    .zfa-bar .zfa-end{ margin-right:0; flex:1 1 100%; justify-content:flex-start; }
    .zfa-bar .zfa-stamps{ order:3; flex:1 1 100%; }
  }`;
}

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
  const paper = (typeof _ch173Paper !== 'undefined') ? _ch173Paper : 'legal';
  const side  = (typeof _ch173SideMargin === 'function') ? _ch173SideMargin() : '0.2cm';

  area.innerHTML = `
  <style>${(typeof _ch173CSS === 'function') ? _ch173CSS() : ''}${_zaFormCSS()}${_zaBarCSS()}</style>
  <div style="display:flex;flex-direction:column;height:100%;direction:rtl;">
    <div class="no-print zfa-bar">
      <label class="zfa-pick" title="گواہ منتخب کریں — اُس کا بیان اس صفحے پر آ جائے گا">
        <span class="zfa-pick-lbl">بیان ازاں</span>
        <select id="zfa-wit-sel" onchange="_zaWitSelChange(this)"><option value="">گواہان لوڈ ہو رہے ہیں…</option></select>
      </label>
      <span class="zfa-stamps"><span id="zfa-updated"></span><span id="zfa-autosave"></span></span>
      <div class="zfa-end">
        <button type="button" id="zfa-save-btn" class="btn btn-primary btn-sm" data-dio-save onclick="_saveZimniA(false,true)"
          title="${z.id ? 'اپ ڈیٹ' : 'محفوظ کریں'} (Ctrl+S) — صفحہ کھلا رہے گا">💾 ${z.id ? 'اپ ڈیٹ' : 'محفوظ'}</button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="_zaBackToList()" title="تمام بیانات کی فہرست">← واپس</button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="_zaClose()" title="بیانات کا صفحہ بند کریں">✕ بند</button>
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
  try { if (typeof _ch173FullPage === 'function') _ch173FullPage(area); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
  try { if (typeof _ch173BlockFloatBar === 'function') _ch173BlockFloatBar(); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
  try { _zaFillWitSel(true); } catch (_) { /* gawahan baad mein */ }
  setTimeout(() => {
    try { if (typeof _ch173FullPage === 'function') _ch173FullPage(area); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
    try { if (typeof _ch173FitPaper === 'function') _ch173FitPaper(); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
    try { _zimniBindKeys(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }                       // Tab/Enter/Ctrl+BIU/paste (generic)
    try { _dioBindCtrlS(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }                        // Ctrl+S = اپ ڈیٹ
    try { const d0 = _zimniDoc(); if (d0 && typeof dioNormFonts === 'function') d0.querySelectorAll('.zfa-body').forEach(x => dioNormFonts(x)); } catch (_) { /* ضمنی */ }
    try { if (typeof _ch173BrushOff === 'function') _ch173BrushOff(); } catch (_) { /* format painter band */ }
    try { if (typeof _ch173BindCellPick === 'function') _ch173BindCellPick(); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
    try { if (typeof _ch173FocusMode === 'function') _ch173FocusMode(true); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ } // chips peek
    try { if (typeof _ch173WatchFit === 'function') _ch173WatchFit(); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
    try { _zimniBindFindReplace(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }                                          // Ctrl+F / Ctrl+H (generic)
    try { _zaColResize(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    try { if (saved && saved.saved_at) _zaStampUpdated(saved.saved_at); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    try { _zaWatchEdits(); } catch (_) { /* ikhtiyari qadam */ }                                                // v558: خودکار مسودہ
    try { _zaLayout(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    // AHEM: خودکار نمبر شمار جان بوجھ کر بند — کالم 1 خالی/manual ہے
    [250, 900, 1800].forEach(ms => setTimeout(() => { try { _zaLayout(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } }, ms));
    if (typeof applyMicButtons === 'function') applyMicButtons(area);
  }, 60);
}
window._renderZimniAEditor = _renderZimniAEditor;

// ═══════════════════════════════════════════════════════════════
//  آخری اپ ڈیٹ کا وقت — اوپر کی پٹی میں (bairooni کا _zimniFmtStamp reuse)
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
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }

  _zaWitnesses = rows;
  return _zaWitnesses;
}
window._zaLoadWitnesses = _zaLoadWitnesses;

// گواہ کا بیان صفحے میں (v558 — افسر کی ہدایت، 22 اکتوبر 2026):
//   1) «بیان ازاں» پہلے، پھر گواہ کا مکمل نام و پتہ؛ اُسی کے سامنے بائیں کنارے (حاشیے) کے ساتھ
//      «(زیردفعہ 161ض ف)» — نام والی سطر میں جگہ نہ ہو تو اگلی سطر میں، مگر جگہ وہی (بائیں کنارہ)
//      [CSS float:left نام کے بعد — جگہ ہو تو اسی سطر میں، ورنہ خود اگلی سطر کے بائیں کنارے پر]
//   2) «بیان کیا کہ» (مدعی / محرر کے علاوہ FIR کا متن ساتھ)
//   3) «بیان سن لیا ہے درست ہے»
//   4) آخر میں بائیں جانب تفتیشی افسر کا نام اور نیچے تاریخ — بیرونی ضمنی کے دستخط کا اصول
//      (دو خالی سطریں دستخط کی جگہ، نام بولڈ، تاریخ DD/MM/YYYY، دونوں بائیں سیدھ)
async function _zaInsertWitnessStatement(witness) {
  if (!witness) return;
  const doc = _zimniDoc();
  const body = doc && doc.querySelector('.zfa-body');
  if (!body) return;
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const io = (typeof getIOSignLine === 'function') ? getIOSignLine()
           : ((o.full_name || '') + (o.designation ? ' ' + o.designation : '') + (o.station ? ' تھانہ ' + o.station : ''));
  const today = _zimniToday();
  const E = (v) => (typeof esc === 'function') ? esc(v == null ? '' : String(v)) : String(v == null ? '' : v);
  const isMoharrir = (witness.status === 'moharrir');
  const isMudai    = (witness.status === 'mudai');
  const skipFir    = (isMoharrir || isMudai);          // محرر اور مدعی کے بیان میں FIR کا متن خود نہیں آتا
  let nmRaw = String(witness.full_name || witness.name || '').trim();
  if (isMoharrir) {
    const stn = String((_zaCase && (_zaCase.case_station || _zaCase.station || _zaCase.police_station)) || o.station || '').trim();
    if (!/محرر/.test(nmRaw)) nmRaw = nmRaw + ' محرر';
    if (stn && nmRaw.indexOf(stn) === -1) nmRaw = nmRaw + ' تھانہ ' + stn;
  }

  // گواہ کا بیان FIR کے متن سے — اسی مقدمے کے لیے ہمیشہ تازہ سوال (report173 کا مشترکہ
  //   _ch173FirMatn نہیں — وہ کسی اور مقدمے کا ہو سکتا ہے)
  let firText = '';
  try {
    if (!skipFir) {
      const cid = _zaCaseId || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
               || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
      if (cid && typeof supabaseClient !== 'undefined') {
        const { data } = await supabaseClient.from('fir_matn')
          .select('matn,type').eq('case_id', cid).order('created_at', { ascending: true });
        const rows = (data || []).filter(m => (m.type || 'fir') === 'fir');
        firText = rows.map(m => String(m.matn || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
                       .filter(Boolean).join(' ');
      }
    }
  } catch (_) { /* parhna na ho sake to khali */ }

  // خالی حالت کا رکھا ہوا <br> — پہلا بیان آنے پر اضافی خالی سطر نہ بچے
  try { if (body.innerHTML.trim() === '<br>') body.innerHTML = ''; } catch (_) { /* UI ka ikhtiyari qadam */ }

  const block = document.createElement('div');
  block.className = 'zfa-wit-block';
  block.setAttribute('data-witness-id', witness.id || '');
  block.setAttribute('data-witness-name', nmRaw);
  block.innerHTML =
    '<div class="zfa-wit-head">بیان ازاں ' + E(nmRaw) + ' <span class="zfa-wit-ref161">(زیردفعہ 161ض ف)</span></div>' +
    '<div class="zfa-wit-stmt" data-mic="true">بیان کیا کہ&nbsp;' + E(firText) + '</div>' +
    '<div class="zfa-wit-close">بیان سن لیا ہے درست ہے</div>' +
    '<div class="zfa-wit-sign">' +
      '<div class="zfa-wit-gap"><br></div><div class="zfa-wit-gap"><br></div>' +
      '<div class="zfa-wit-io">' + E(io) + '</div>' +
      '<div class="zfa-wit-date">' + E(today) + '</div>' +
    '</div>';
  body.appendChild(block);

  try { _zaLayout(); } catch (_) { /* ikhtiyari qadam */ }
  try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam */ }
  try { _zaMarkDirty(); } catch (_) { /* v558: خودکار مسودہ */ }
  // کرسر نئے بیان کے آخر میں (افسر فوراً لکھ سکے)
  try {
    const stmt = block.querySelector('.zfa-wit-stmt');
    const r = document.createRange(); r.selectNodeContents(stmt); r.collapse(false);
    const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    // صرف اوپر نیچے سرکاؤ — scrollIntoView موبائل پر کاغذ کو دائیں بائیں بھی کھسکا دیتا تھا
    const sc = doc.parentElement;
    if (sc) {
      const rr = stmt.getBoundingClientRect(), cr = sc.getBoundingClientRect();
      sc.scrollTop += (rr.top - cr.top) - sc.clientHeight / 2;
    }
  } catch (_) { /* UI ka ikhtiyari qadam */ }
}
window._zaInsertWitnessStatement = _zaInsertWitnessStatement;

// «بیان ازاں ▾» — اس مقدمے کے تمام گواہان (مدعی اور محرر خود شامل)؛ جن کا بیان اس صفحے پر
//   پہلے سے ہے اُن کے آگے ✓
async function _zaFillWitSel(reload) {
  if (reload || !Array.isArray(_zaWitnesses)) {
    let list = [];
    try { list = await _zaLoadWitnesses(); } catch (_) { list = []; }
    _zaWitnesses = (list || []).filter(w => String(w.full_name || '').trim());
  }
  const sel = document.getElementById('zfa-wit-sel');
  if (!sel) return 0;
  const doc = _zimniDoc();
  const have = new Set(doc ? [...doc.querySelectorAll('.zfa-wit-block')].map(b => String(b.getAttribute('data-witness-id') || '')) : []);
  const E = (v) => (typeof esc === 'function') ? esc(String(v == null ? '' : v)) : String(v == null ? '' : v);
  const tag = (w) => (w.status === 'mudai') ? ' (مدعی)' : (w.status === 'moharrir') ? ' (محرر)' : '';
  const list = _zaWitnesses || [];
  sel.innerHTML = `<option value="">${list.length ? '— گواہ منتخب کریں —' : '— اس مقدمے میں کوئی گواہ درج نہیں —'}</option>`
    + list.map((w, i) => `<option value="${i}">${have.has(String(w.id)) ? '✓ ' : ''}${E(String(w.full_name).trim())}${tag(w)}</option>`).join('')
    + '<option value="__add__">➕ نیا گواہ شامل کریں</option>';
  sel.value = '';
  return list.length;
}
window._zaFillWitSel = _zaFillWitSel;

function _zaWitSelChange(sel) {
  const v = sel ? sel.value : '';
  if (sel) sel.value = '';
  if (!v) return;
  if (v === '__add__') {
    // نیا گواہ — «نیا اندراج — گواہ» کا کارڈ اسی مقدمے کے ساتھ (بیان کا صفحہ کھلا رہے)؛
    //   کارڈ بند ہوتے ہی فہرست تازہ
    try { if (_zaDirty) _zaWriteDraft(); } catch (_) { /* مسودہ */ }
    try {
      if (typeof _openWitnessForm === 'function') {
        try { _witnessCaseId = _zaCaseId; } catch (_) { /* ikhtiyari */ }
        _openWitnessForm(null, 'fir', { caseId: _zaCaseId });
        const t0 = Date.now();
        const iv = setInterval(() => {
          const mb = document.getElementById('modal-backdrop');
          const open = !!(mb && mb.style.display !== 'none' && getComputedStyle(mb).display !== 'none');
          if (!document.getElementById('zfa-wit-sel') || Date.now() - t0 > 900000) { clearInterval(iv); return; }
          if (!open && Date.now() - t0 > 700) { clearInterval(iv); _zaFillWitSel(true); }
        }, 800);
      } else if (typeof openWitnessesCard === 'function') {
        openWitnessesCard(_zaCaseId, 'fir');
      }
    } catch (_) { if (typeof showToast === 'function') showToast('گواہان کے صفحے سے گواہ شامل کریں', 'info'); }
    return;
  }
  const w = (_zaWitnesses || [])[parseInt(v, 10)];
  if (!w) return;
  const doc = _zimniDoc();
  const already = doc && [...doc.querySelectorAll('.zfa-wit-block')].some(b => String(b.getAttribute('data-witness-id') || '') === String(w.id));
  if (already && !confirm('اس گواہ کا بیان پہلے سے اس صفحے پر موجود ہے۔ دوبارہ شامل کریں؟')) return;
  _zaInsertWitnessStatement(w).then(() => _zaFillWitSel(false)).catch(() => { /* UI */ });
}
window._zaWitSelChange = _zaWitSelChange;

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
        try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
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
        try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
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
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  return { ok: true, paras: paras.length, numbers: nums.children.length,
           bodies: doc.querySelectorAll('.zfa-body').length };
}
window._zaAutoNumbers = _zaAutoNumbers;

function _zaStartNumbers() {
  const doc = _zimniDoc();
  if (!doc) return;
  const kick = () => {
    clearTimeout(doc._zfaNumT);
    doc._zfaNumT = setTimeout(() => { try { _zaAutoNumbers(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } }, 200);
  };
  if (!doc._zfaNumEdit) {
    doc._zfaNumEdit = true;
    doc.addEventListener('input', (e) => {
      try {
        const n = e.target && e.target.closest ? e.target.closest('.zfa-num') : null;
        if (n) { n.dataset.manual = '1'; return; }
        const inNums = e.target && e.target.closest && e.target.closest('.zfa-nums');
        if (inNums) return;
      } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
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
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  try { if (doc._zfaNumIv) clearInterval(doc._zfaNumIv); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  doc._zfaNumIv = setInterval(() => {
    const d = _zimniDoc();
    if (!d) { try { clearInterval(doc._zfaNumIv); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } return; }
    try {
      const chahiye = _zaParas().length;
      const mojood  = d.querySelectorAll('.zfa-num').length;
      if (chahiye !== mojood) { _zaAutoNumbers(); }
    } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
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
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  const kaam = ((paper === 'a4') ? 11.7 : 13) * IN - padY;
  if (kaam < 200) return;
  try {
    const dRect = doc.getBoundingClientRect();
    const tRect = table.getBoundingClientRect();
    const scale = (doc.offsetHeight && dRect.height) ? (dRect.height / doc.offsetHeight) : 1;
    let padT = 0;
    try { padT = parseFloat(getComputedStyle(doc).paddingTop) || 0; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    const tTop = ((tRect.top - dRect.top) / (scale || 1)) - padT;
    let h = Math.floor(kaam - tTop - 2);
    if (h < 120) h = 120;
    if (String(td.style.height) !== (h + 'px')) {
      table.querySelectorAll('tbody td').forEach(c => { c.style.height = h + 'px'; });
    }
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._zaFitTable = _zaFitTable;

// v558: «(زیردفعہ 161ض ف)» — نام کی آخری سطر میں جگہ ہو تو اسی سطر کے بائیں کنارے پر (float)؛
//   ورنہ اگلی اپنی سطر میں، بائیں کنارے پر۔ float نیچے کھسک کر بیان کی پہلی سطر میں نہ آ بیٹھے،
//   اس لیے ناپ کر فیصلہ (ایڈیٹر میں، اور چھپائی سے پہلے اصل کاغذ کی چوڑائی پر)۔
function _zaRefPlace(root) {
  const R = root || _zimniDoc();
  if (!R) return 0;
  let n = 0;
  R.querySelectorAll('.zfa-wit-head .zfa-wit-ref161').forEach(ref => {
    ref.classList.remove('zfa-ref-own');
    const h = ref.parentNode, d = h.ownerDocument;
    let last = null;
    h.childNodes.forEach(x => {
      if (x === ref || !(x.nodeType === 3 ? x.nodeValue.trim() : (x.textContent || '').trim())) return;
      const rg = d.createRange(); rg.selectNodeContents(x);
      [].forEach.call(rg.getClientRects(), r => { if (r.height > 2 && r.width > 1 && (!last || r.top > last.top + 2)) last = r; });
    });
    const rr = ref.getBoundingClientRect();
    if (last && rr.top > last.top + last.height / 2) { ref.classList.add('zfa-ref-own'); n++; }
  });
  return n;
}
window._zaRefPlace = _zaRefPlace;

function _zaLayout() {
  try { _zaRefPlace(); } catch (_) { /* ikhtiyari qadam */ }
  try { _zaFitTable(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
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
  /* عنوانات کا اصول (پورا نظام، ہر کاغذ): مرکزی 20pt · ذیلی 16pt · تیسرا درجہ 14pt — چالان کے مطابق */
  #ch173-doc .zfa-title{ font-size:20pt; font-weight:normal; text-align:center; line-height:1.3;
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
  /* v558: موبائل/ٹیبلٹ (≤900px) کا عام اصول «ہر table = block» کاغذ کی جدول پر نہیں — ورنہ خالی
     کالم سکڑ کر جدول آدھی چوڑائی کی رہ جاتی تھی (کاغذ ہمیشہ کاغذ) */
  #ch173-doc table.zfa-tbl{ display:table !important; overflow:visible !important; }
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
  /* v555: اندرونی ضمنی بھی — پیراگراف انگریزی عہدے (ASI) سے شروع ہو تب بھی بنیادی رُخ RTL
     (بیرونی ضمنی کا اصول)؛ افسر کا اپنا دیا ہوا رُخ (dir) برقرار */
  #ch173-doc .zfa-body:not([dir]), #ch173-doc .zfa-body > div:not([dir]), #ch173-doc .zfa-body > p:not([dir]){
    direction:rtl !important; unicode-bidi:isolate !important; }

  /* ── گواہ کا بیان ── */
  /* v558: بیان کا خانہ عام block (flow-root نہیں) — ورنہ صفحہ 2، 4 … پر مثل کی 2pt لکیر کے سامنے پورا
     مربع خالی رہ جاتا (نیا formatting context تیرتی مثلث کی شکل نہیں، پورا مربع چھوڑتا ہے) */
  #ch173-doc .zfa-wit-block{ margin:4px 0 16px; display:block; }
  /* v558: «بیان ازاں» + مکمل نام و پتہ (دائیں سے)، اُس کے سامنے بائیں کنارے پر «(زیردفعہ 161ض ف)» —
     float:left نام کے بعد: آخری سطر میں جگہ ہو تو اسی سطر میں، ورنہ اگلی سطر کے بائیں کنارے پر */
  #ch173-doc .zfa-wit-head{ font-weight:bold; margin-bottom:4px; display:block;
    text-align:right !important; text-align-last:right !important; }
  #ch173-doc .zfa-wit-ref161{ float:left; font-weight:normal; white-space:nowrap; unicode-bidi:isolate;
    direction:rtl; margin-right:12px; }
  /* نام کی آخری سطر میں جگہ نہ ہو — حوالہ اپنی سطر میں، بائیں کنارے پر (_zaRefPlace لگاتا ہے) */
  #ch173-doc .zfa-wit-ref161.zfa-ref-own{ float:none; display:block; margin-right:0;
    text-align:left !important; text-align-last:left !important; }
  /* پرانے محفوظ بیانات (v557 تک) — عنوان کی قطار + «بحوالہ ضمنی نمبر …» جوں کا توں */
  #ch173-doc .zfa-wit-headrow{ margin-bottom:4px; display:flow-root; }
  #ch173-doc .zfa-wit-headrow .zfa-wit-head{ display:block; margin-bottom:0; }
  #ch173-doc .zfa-wit-ref{ float:left; font-weight:normal; unicode-bidi:isolate;
    white-space:nowrap; margin-left:10px; }
  #ch173-doc .zfa-wit-stmt{ min-height:1.6em; margin:4px 0 8px; outline:none; }
  #ch173-doc .zfa-wit-close{ margin:2px 0 4px; text-align:center !important;
    text-align-last:center !important; }
  /* تفتیشی افسر کا نام و تاریخ — بیرونی ضمنی کا دستخط (zf-signblk) والا اصول: بائیں سیدھ،
     اوپر دو خالی سطریں (دستخط کی جگہ)، نام بولڈ (انڈر لائن نہیں)، نیچے تاریخ */
  #ch173-doc .zfa-wit-sign{ float:none; display:block; margin-top:0;
    text-align:left !important; text-align-last:left !important; }
  #ch173-doc .zfa-wit-sign:not(:has(.zfa-wit-gap)){ margin-top:3em; }   /* پرانے بیانات — دستخط کی جگہ */
  #ch173-doc .zfa-wit-gap{ min-height:1.5em; }
  #ch173-doc .zfa-wit-io{ font-weight:bold; text-decoration:none; display:block;
    text-align:left !important; text-align-last:left !important; }
  #ch173-doc .zfa-wit-date{ display:block; margin-top:0; unicode-bidi:isolate;
    text-align:left !important; text-align-last:left !important; }

  /* v555: آخری صفحے کی خالی قطار (کاغذ کی تیاری لگاتی ہے) — کھڑی لکیریں صفحے کے نیچے تک */
  #ch173-doc table.zfa-tbl tbody tr.zfa-fill td{ padding:0 !important; border-top:none !important; border-bottom:none !important; }
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
    font-family:'Jameel Noori Nastaleeq' !important;
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
  let jBody = (c.section_of_law || '').trim();   // صرف دفعات (v544)
  let jSuf  = 'ت پ';
  try {
    if (typeof _ch173JurmParts === 'function') {
      const jp = _ch173JurmParts(c.section_of_law);
      jBody = jp.body; jSuf = jp.suffix;
    }
  } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }

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
// v558: بیرونی ضمنی (_saveZimni) والا اصول — (1) پہلے اسی آلے پر (کبھی ضائع نہیں)
//   (2) انٹرنیٹ/سرور نہ ہو تو «سرور پر بھیجنا باقی» اور بعد میں خود (3) ورنہ سرور پر —
//   سرور رد کرے تو اصل وجہ صاف لفظوں میں، بیان آلے پر محفوظ۔ Ctrl+S اور «اپ ڈیٹ» ایک ہی کام۔
async function _saveZimniA(silent, keepOpen) {
  // VIEW-ONLY ENFORCEMENT [4E]: میعاد ختم پر ضمنی اندرونی محفوظ/ترمیم بند
  if (window.DIO && DIO.sub && DIO.sub.blocked()) { if (!silent) DIO.sub.guard('ضمنی محفوظ'); return false; }
  const ed = _zimniDoc();
  if (!ed || !ed.querySelector('.zfa-tbl')) return false;
  if (window._zaSaving) { window._zaSaveAgain = true; return true; }   // دوہرا Ctrl+S — ایک ہی کام
  window._zaSaving = true;
  try {
  const bodyHtml = _zimniCleanHTML(ed.innerHTML);
  const z = _zaActive || {};
  const draftKey = (() => { try { return _zaActiveDraftKey(); } catch (_) { return ''; } })();
  const witnessNames = _zaWitNames(ed);
  const serialNo = _zaSno(z) || _zaNextSerial();
  const head = (z.content && z.content.head) || 'بیان';
  const savedAt = new Date().toISOString();
  const rec = {
    case_id: _zaCaseId,
    serial_no: serialNo,
    report_date: (z.report_date || _zimniTodayIso()),   // مقامی دن (UTC کا پچھلا دن نہیں)
    content: { bodyHtml, head, serial_no: serialNo, saved_at: savedAt, witnesses: witnessNames },
  };

  try {
    if (typeof dioRegisterSaved === 'function')
      dioRegisterSaved('zimni_androoni', head + ' — نمبر ' + serialNo,
        { case_id: _zaCaseId, serial_no: serialNo });
  } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }

  // ── 1) پہلے اسی آلے پر — یہ کبھی ضائع نہیں ہوتا ──
  const localId = z.id || ('local-' + Date.now());
  const localObj = Object.assign({ id: localId }, rec, { _pending: true, _sync_err: '' });
  const localSave = (obj) => {
    const i = _zaList.findIndex(x => String(x.id) === String(obj.id));
    if (i >= 0) _zaList[i] = obj; else _zaList.push(obj);
    _zaSort(_zaList);
    return _zaLocalPut(_zaCaseId, _zaList);
  };
  const okLocal = localSave(localObj);
  _zaActive = localObj;
  try { clearTimeout(ed._zfaDraftT); } catch (_) { /* ikhtiyari */ }
  if (draftKey) { try { _zaClearDraft(draftKey); } catch (_) { /* ikhtiyari */ } }
  _zaDirty = false;
  try { _zaStampUpdated(savedAt); } catch (_) { /* ikhtiyari qadam */ }
  try { const sb = document.getElementById('zfa-save-btn'); if (sb) { sb.innerHTML = '💾 اپ ڈیٹ'; sb.title = 'اپ ڈیٹ (Ctrl+S) — صفحہ کھلا رہے گا'; } } catch (_) { /* ikhtiyari */ }
  try { const as = document.getElementById('zfa-autosave'); if (as) as.textContent = ''; } catch (_) { /* ikhtiyari */ }
  if (!okLocal && !silent) showToast('آلے کی جگہ (storage) بھری ہوئی ہے — مقامی نقل نہ بن سکی، سرور پر بھیجا جا رہا ہے', 'warn', 6000);

  const backToList = () => { if (!keepOpen && !silent) setTimeout(() => { try { _renderZimniAList(); } catch (_) { /* ikhtiyari */ } }, 200); };

  // ── 2) انٹرنیٹ نہیں / سرور کا ڈھانچہ ناقص — بس آلے پر؛ انٹرنیٹ آتے ہی خود سرور پر ──
  if (!navigator.onLine || window._zaDbBroken || typeof supabaseClient === 'undefined' || !supabaseClient) {
    if (!silent) showToast('بیان (اندرونی ضمنی نمبر ' + serialNo + ') اس آلے پر محفوظ — انٹرنیٹ آنے پر خود سرور پر چلا جائے گا', 'info', 5000);
    backToList();
    return true;
  }

  // ── 3) سرور پر ──
  try {
    const editing = !_zimniIsPending({ id: z.id }) && !!z.id;
    if (_zaInFlight.has(String(localId))) {
      // یہی بیان ابھی خودکار sync میں جا رہا ہے — وہ مکمل ہوتے ہی یہ تازہ نقل بھی جائے گی
      setTimeout(() => { _zaSyncPending([_zaCaseId]); }, 2000);
      if (!silent) showToast('بیان اس آلے پر محفوظ — سرور پر بھیجا جا رہا ہے', 'info', 4000);
      backToList();
      return true;
    }
    _zaInFlight.add(String(localId));
    let savedRec;
    try {
      if (editing) {
        const base = { case_id: _zaCaseId, serial_no: serialNo, report_date: rec.report_date };
        try { const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null; if (oid) base.officer_id = oid; } catch (_) { /* officer id */ }
        savedRec = await _zaWrite(base, rec.content, z.id);
      } else {
        savedRec = await _zaSyncOne(_zaCaseId, localObj);   // دوہرا اندراج نہیں
      }
    } finally { _zaInFlight.delete(String(localId)); }
    savedRec = Object.assign({}, savedRec, { content: rec.content, _pending: false, _sync_err: '' });
    _zaRekeyDraft(_zaCaseId, localId, savedRec.id);
    _zaMergeSynced(_zaList, localId, savedAt, savedRec);
    _zaLocalPut(_zaCaseId, _zaList);
    if (_zaActive && String(_zaActive.id) === String(localId)) {
      _zaActive = (String((_zaActive.content || {}).saved_at || '') === savedAt) ? savedRec : Object.assign({}, _zaActive, { id: savedRec.id });
    }
    if (!silent) showToast('اندرونی ضمنی (بیان) نمبر ' + serialNo + ' سرور پر محفوظ ہو گئی', 'success');
    backToList();
    return true;
  } catch (e) {
    try { console.error('[zimni androoni save]', e); } catch (_) { /* console na ho to bhi na phatte */ }
    const why = _zimniErrText(e);
    if (_zimniIsNetErr(e)) {
      if (!silent) showToast('انٹرنیٹ/سرور سے رابطہ نہیں — بیان (نمبر ' + serialNo + ') اس آلے پر محفوظ ہے، رابطہ بحال ہوتے ہی خود سرور پر چلا جائے گا', 'info', 7000);
    } else {
      localSave(Object.assign({}, localObj, { _sync_err: why }));
      if (!silent) showToast('سرور نے بیان قبول نہیں کیا — وجہ: ' + why + '۔ بیان اس آلے پر محفوظ ہے، کچھ ضائع نہیں ہوا۔', 'error', 10000);
      try { if (typeof dioLogError === 'function') dioLogError('zimni androoni save: ' + why, e); } catch (_) { /* logging */ }
    }
    backToList();
    return true;   // آلے پر محفوظ ہو چکا — کام ضائع نہیں
  }
  } finally {
    window._zaSaving = false;
    if (window._zaSaveAgain) { window._zaSaveAgain = false; setTimeout(() => { try { _saveZimniA(true, true); } catch (_) { /* agli dafa */ } }, 50); }
  }
}
window._saveZimniA = _saveZimniA;

async function _deleteZimniA(id, skipConfirm) {
  const z = _zaRec(id);
  if (!skipConfirm && !confirm('کیا آپ یہ بیان (اندرونی ضمنی نمبر ' + ((z && _zaSno(z)) || '') + ') حذف کرنا چاہتے ہیں؟')) return;
  const dropLocal = () => {
    _zaList = _zaList.filter(x => String(x.id) !== String(id));
    _zaLocalPut(_zaCaseId, _zaList);
    _zaClearDraft('id:' + id);
  };
  // جو بیان ابھی صرف اس آلے پر ہے (سرور پر گیا ہی نہیں) — سرور سے پوچھنے کی ضرورت نہیں
  if (_zimniIsPending({ id })) { dropLocal(); _renderZimniAList(); showToast('حذف ہو گیا', 'info'); return; }
  if (!navigator.onLine) { showToast('سرور پر محفوظ بیان حذف کرنے کے لیے انٹرنیٹ درکار ہے', 'warn', 5000); return; }
  try {
    dioWriteOk(await supabaseClient.from('zimni_androoni_reports').delete().eq('id', id).select('id'), 'zimni androoni delete', true);
    dropLocal();
    _renderZimniAList();
    showToast('حذف ہو گیا', 'info');
  } catch (e) { dioWriteFail('اندرونی ضمنی', e, 'حذف نہیں ہوئی'); }
}
window._deleteZimniA = _deleteZimniA;

// ═══════════════════════════════════════════════════════════════
//  مثل باندھنے کی جگہ — صفحہ 2، 4، 6 … کے اوپر بائیں کونے میں مثلث (2pt وتر)
//  v555 (افسر کا قاعدہ، 21 اکتوبر 2026): «2pt والی لکیر اندرونی ضمنی پر بھی» —
//  بیرونی ضمنی والا طریقہ: حساب چھپائی سے پہلے منتخب کاغذ (A4 / لیگل) کی اصل چوڑائی اور
//  «پرنٹ» کی شکل پر، اردو فونٹ آنے کے بعد (dioBindHtml)۔ پہلے یہ اسکرین کے ایڈیٹر پر
//  ناپا جاتا تھا (موبائل پر چھوٹا کیا ہوا صفحہ، دوسرا فونٹ) اور فہرست کے پرنٹ میں لگتا ہی
//  نہیں تھا۔ ہر صفحے کا توڑ پکا (.dio-pgbrk) — حالات کی اُس سطر سے پہلے جو صفحے میں نہ
//  سمائے؛ نمبر شمار کے کالم میں بھی اسی جگہ (نمبر اپنے پیراگراف کی سیدھ میں رہیں)۔
//  آخری صفحے پر خالی قطار — کھڑی لکیریں صفحے کے نیچے (حاشیے) تک۔
// ═══════════════════════════════════════════════════════════════
function _zaBinder(d, geo) {
  const doc = d.getElementById('ch173-doc'); if (!doc || !geo || geo.ch < 200) return 0;
  try { _zaRefPlace(doc); } catch (_) { /* v558: حوالہ اصل کاغذ کی چوڑائی پر */ }
  const ch = geo.ch, EPS = 2, FSAFE = 6;
  let made = 0;
  // پرانے نشان اور ایڈیٹر کی چپکی اونچائیاں (اسکرین کا صفحہ 1) ہٹاؤ
  doc.querySelectorAll('.zfa-bindmark,.zf-bind,.dio-bindgap,.dio-pgbrk,.dio-colpad,tr.zfa-fill').forEach(e => e.remove());
  doc.querySelectorAll('table.zfa-tbl td, table.zfa-tbl tr').forEach(el => { if (el.style.height) { el.style.height = 'auto'; made++; } });
  // پرانی (خودکار) نمبر شمار — margin سے پیراگراف کی سیدھ، جو ایڈیٹر کے کاغذ کی چوڑائی پر ناپی گئی
  //   تھی؛ دوسرے کاغذ (A4 / لیگل) پر سطریں بدلتی ہیں — اسی کاغذ کی چوڑائی پر دوبارہ (_zaAutoNumbers کا اصول)
  doc.querySelectorAll('table.zfa-tbl').forEach(tbl => {
    const nb = tbl.querySelector('.zfa-nums'), bd = tbl.querySelector('.zfa-body');
    if (!nb || !bd) return;
    const ks = [].filter.call(nb.children, e => e.classList && e.classList.contains('zfa-num'));
    if (!ks.length || !ks.some(k => k.style.marginTop)) return;
    const ps = [].filter.call(bd.children, el => (el.tagName === 'DIV' || el.tagName === 'P') && String(el.textContent || '').replace(/[\s\u00A0]/g, '').length);
    if (!ps.length) return;
    ks.forEach(k => { k.style.marginTop = '0px'; });
    ks.forEach((k, i) => {
      if (!ps[i]) return;
      const g = Math.round(ps[i].getBoundingClientRect().top - k.getBoundingClientRect().top);
      if (g > 0 && g < 5000) k.style.marginTop = g + 'px';
    });
    made++;
  });
  // حالات کے کالم کے آخری پیراگراف کا نچلا حاشیہ — چھپائی میں آخری صفحے پر شمار نہیں ہوتا (ٹیبل اتنا
  //   چھوٹا نکلتا تھا اور لکیریں نیچے سے ذرا پہلے رک جاتیں)؛ کاغذ پر یہ جگہ ویسے بھی خالی قطار بھرتی ہے
  doc.querySelectorAll('table.zfa-tbl .zfa-body').forEach(bd => { const lc = bd.lastElementChild; if (lc && lc.tagName !== 'BR') lc.style.marginBottom = '0px'; });
  const dTop = doc.getBoundingClientRect().top;
  const texts = (cell) => { const out = [], tw = d.createTreeWalker(cell, NodeFilter.SHOW_TEXT, null); let n; while ((n = tw.nextNode())) { if (n.nodeValue && n.nodeValue.trim()) out.push(n); } return out; };
  const rects = (n) => { const r = d.createRange(); r.selectNodeContents(n); return [].filter.call(r.getClientRects(), x => x.height > 2); };
  // پہلی سطر جس کا نچلا کنارہ limitY سے نیچے ہو → {n, off, top}
  const lineFind = (cell, limitY) => {
    for (const n of texts(cell)) {
      const hit = rects(n).find(x => x.bottom - dTop > limitY + 0.5); if (!hit) continue;
      const rg = d.createRange(); let lo = 0, hi = n.nodeValue.length - 1, off = -1;
      while (lo <= hi) { const mid = (lo + hi) >> 1; rg.setStart(n, mid); rg.setEnd(n, mid + 1); const bb = rg.getBoundingClientRect();
        if (bb.height && bb.top >= hit.top - 1) { off = mid; hi = mid - 1; } else lo = mid + 1; }
      return off < 0 ? null : { n, off, top: hit.top - dTop };
    }
    return null;
  };
  const lastBottom = (cell) => { let v = null; texts(cell).forEach(n => rects(n).forEach(x => { v = (v === null) ? x.bottom - dTop : Math.max(v, x.bottom - dTop); })); return v; };
  const cut = (sp) => (sp.off > 0 ? sp.n.splitText(sp.off) : sp.n);
  const mk = (cls) => { const e = d.createElement('span'); e.className = cls; return e; };
  // نمبر شمار کے کالم میں بھی اسی جگہ توڑ: پہلی چیز (نمبر یا خالی سطر) جو حالات کے توڑ (y) کے بعد
  //   شروع ہو، اگلے صفحے پر — اور صفحے کے اوپر سے اُتنا ہی فاصلہ جتنا اُس کے پیراگراف کا (نمبر
  //   پیراگراف کی سیدھ میں رہے)۔ colShift = اس کالم اور حالات کے کالم کی اونچائی کا فرق
  let colShift = 0;
  const splitCol = (cell, y, even) => {
    if (!cell) return;
    const yC = y + colShift;
    const tw = d.createTreeWalker(cell, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null); let n, at = null, atTop = 0;
    while ((n = tw.nextNode())) {
      if (n.nodeType === 3) {
        if (!n.nodeValue.trim()) continue;
        // سطر کا اوپری کنارہ (line box) — نستعلیق فونٹ کا حرف سطر سے اوپر تک جاتا ہے، اس لیے حرف کا نہیں
        let lh = 0; try { lh = parseFloat(d.defaultView.getComputedStyle(n.parentNode).lineHeight) || 0; } catch (_) { lh = 0; }
        const lt = (x) => (lh ? (x.top + x.bottom) / 2 - lh / 2 : x.top) - dTop;
        const hit = rects(n).find(x => lt(x) >= yC - 2); if (!hit) continue;   // اس متن کی پہلی سطر جو توڑ کے بعد شروع ہو
        const rg = d.createRange(); let lo = 0, hi = n.nodeValue.length - 1, off = -1;
        while (lo <= hi) { const mid = (lo + hi) >> 1; rg.setStart(n, mid); rg.setEnd(n, mid + 1); const bb = rg.getBoundingClientRect();
          if (bb.height && bb.top >= hit.top - 1) { off = mid; hi = mid - 1; } else lo = mid + 1; }
        if (off >= 0) { at = off > 0 ? n.splitText(off) : n; atTop = lt(hit); break; }
      } else if (n.tagName === 'BR') {
        const r = d.createRange(); r.selectNode(n); const bb = r.getBoundingClientRect();
        if (bb.height && bb.top - dTop >= yC - 2) { at = n; atTop = bb.top - dTop; break; }
      }
    }
    if (!at || !at.parentNode) return;
    // نمبر اپنے خانے (div) کا پہلا حصہ ہو تو توڑ اُس خانے سے پہلے، اور اُس کا اوپری حاشیہ صفر —
    //   ورنہ چھپائی میں وہ حاشیہ اگلے صفحے کے اوپر دوبارہ لگ کر نمبر کو پیراگراف سے نیچے کر دیتا
    const firstOf = (p) => [].find.call(p.childNodes, c => c.nodeType === 1 || (c.nodeType === 3 && c.nodeValue.trim()));
    let E = at;
    while (E.parentNode && E.parentNode !== cell && firstOf(E.parentNode) === E) E = E.parentNode;
    const pad = Math.round(atTop - yC);
    const brk = mk('dio-pgbrk'); E.parentNode.insertBefore(brk, E);
    if (pad > 1) { const g = mk('dio-colpad'); g.style.cssText = 'display:block;height:' + pad + 'px;margin:0;padding:0;'; E.parentNode.insertBefore(g, E); }
    if (even) E.parentNode.insertBefore(mk('dio-bindgap'), E);
    if (E.nodeType === 1) { try { if (parseFloat(d.defaultView.getComputedStyle(E).marginTop) > 0) E.style.marginTop = '0px'; } catch (_) { /* ضمنی */ } }
    colShift = brk.getBoundingClientRect().top - dTop - y;
    return brk;
  };
  // مثلث کے گرد متن مڑنے سے حالات کی سطریں نیچے کھسکتی ہیں — توڑ کے بعد کے نمبر بھی اتنا ہی نیچے
  const firstOfP = (p) => [].find.call(p.childNodes, c => c.nodeType === 1 || (c.nodeType === 3 && c.nodeValue.trim()));
  const colItems = (cell, after) => {
    const out = [], seen = new Set();
    texts(cell).forEach(n => {
      if (!(after.compareDocumentPosition(n) & 4)) return;            // صرف توڑ کے بعد والے
      let E = n; while (E.parentNode && E.parentNode !== cell && firstOfP(E.parentNode) === E) E = E.parentNode;
      if (seen.has(E)) return; seen.add(E);
      const r = rects(n)[0]; if (r) out.push({ E, s: r.top - dTop });
    });
    return out;
  };
  const anchorAt = (cell, Y) => {
    for (const n of texts(cell)) {
      const hit = rects(n).find(x => x.top - dTop >= Y - 2); if (!hit) continue;
      const rg = d.createRange(); let lo = 0, hi = n.nodeValue.length - 1, off = -1;
      while (lo <= hi) { const mid = (lo + hi) >> 1; rg.setStart(n, mid); rg.setEnd(n, mid + 1); const bb = rg.getBoundingClientRect();
        if (bb.height && bb.top >= hit.top - 1) { off = mid; hi = mid - 1; } else lo = mid + 1; }
      return off < 0 ? null : { n, off };
    }
    return null;
  };
  const topOf = (a) => { const r = d.createRange(); r.setStart(a.n, a.off); r.setEnd(a.n, a.off + 1); return r.getBoundingClientRect().top - dTop; };
  const tables = [].slice.call(doc.querySelectorAll('table.zfa-tbl'));
  tables.forEach(tbl => {
    // اس ضمنی کا صفحہ 1 (سب اکٹھی چھپیں تو ہر ایک اپنے خانے میں، نئے صفحے سے)
    let unit = tbl; while (unit.parentNode && unit.parentNode !== doc) unit = unit.parentNode;
    let pTop = tables.length > 1 ? unit.getBoundingClientRect().top - dTop : 0, pNo = 1, guard = 0;
    colShift = 0;
    const body = tbl.querySelector('td.zfa-c-body'), nums = tbl.querySelector('td.zfa-c-serial');
    // اس صفحے پر ٹیبل کتنا اونچا چھپے گا — حالات کا کالم، اور نمبر شمار کا کالم اپنے صفحے کے آغاز (sStart) سے
    let sStart = pTop;
    const used = () => {
      let u = tbl.getBoundingClientRect().bottom - dTop - pTop;
      const nd = nums && nums.querySelector('.zfa-nums');
      if (nd && lastBottom(nd) !== null) {
        let pb = 0; try { pb = parseFloat(d.defaultView.getComputedStyle(nums).paddingBottom) || 0; } catch (_) { pb = 0; }
        u = Math.max(u, nd.getBoundingClientRect().bottom - dTop - sStart + pb);
      }
      return u;
    };
    while (body && guard++ < 80) {
      if (used() <= ch - EPS) break;      // باقی سب اسی صفحے پر
      let sp = lineFind(body, pTop + ch - EPS);
      if (!sp) { const lb = lastBottom(body); if (lb !== null) sp = lineFind(body, lb - 1); }   // متن سما گیا — آخری سطر اگلے صفحے پر
      if (!sp || sp.top <= pTop + 1) break;                                             // آگے نہیں بڑھ سکتے
      pNo++;
      const even = pNo % 2 === 0;
      // سطر کسی تیرتے خانے (float — گواہ کے بیان کا حوالہ / تفتیشی افسر کا دستخط) میں ہو تو اُس خانے کو
      //   نہ توڑو — پورا خانہ اگلے صفحے پر
      let fl = null;
      for (let e = sp.n.parentNode; e && e !== body; e = e.parentNode) {
        try { if (d.defaultView.getComputedStyle(e).cssFloat !== 'none') fl = e; } catch (_) { /* ضمنی */ }
        // v558: گواہ کا عنوان (نام + «زیردفعہ 161ض ف») اور دستخط (نام + تاریخ) — پورا خانہ ایک ساتھ
        if (e.classList && (e.classList.contains('zfa-wit-head') || e.classList.contains('zfa-wit-sign'))) fl = e;
      }
      const node = fl || cut(sp);
      const brk = mk('dio-pgbrk'); node.parentNode.insertBefore(brk, node);
      if (brk.getBoundingClientRect().top - dTop <= pTop + 1) { brk.remove(); break; }   // آگے نہیں بڑھ سکتے
      // توڑ سے پہلے کا حاشیہ (پچھلے پیراگراف کا margin) صفحے کی حد پار کرے تو اسے صفر کرو — چھپائی میں
      //   صفحے کے توڑ پر یہ حاشیہ ویسے بھی کٹ جاتا ہے؛ یوں حساب اور چھپائی ایک
      const yOrig = brk.getBoundingClientRect().top - dTop;      // نمبر شمار کی سیدھ اسی (اصل) جگہ کے حساب سے
      if (yOrig > pTop + ch - EPS) {
        for (let E = brk; E && E !== body; E = E.parentNode) {
          const pv = E.previousElementSibling, fst = E.parentNode && firstOfP(E.parentNode);
          if (pv) pv.style.marginBottom = '0px';
          if (E !== brk && E.style) E.style.marginTop = '0px';
          if (fst !== E) break;
        }
      }
      const y = brk.getBoundingClientRect().top - dTop;
      if (even) node.parentNode.insertBefore(mk('dio-bindgap'), node);
      const sBrk = splitCol(nums, yOrig, even);
      sStart = sBrk ? sBrk.getBoundingClientRect().top - dTop : yOrig + colShift;
      colShift = sStart - y;                                      // حالات کے کالم کی نئی جگہ کے حساب سے
      if (even) {
        // مثلث سے پہلے: ہر نمبر کے سامنے حالات کی کون سی سطر ہے؛ مثلث کے بعد وہ سطر کتنی کھسکی
        const its = sBrk ? colItems(nums, sBrk).map(it => ({ it, a: anchorAt(body, it.s - colShift) })) : [];
        const was = its.map(x => (x.a ? topOf(x.a) : null));
        node.parentNode.insertBefore(mk('zfa-bindmark'), node);
        let applied = 0;
        its.forEach((x, k) => {
          if (!x.a) return;
          const dl = Math.round(topOf(x.a) - was[k]) - applied;
          if (dl > 1) { const g = mk('dio-colpad'); g.style.cssText = 'display:block;height:' + dl + 'px;margin:0;padding:0;'; x.it.E.parentNode.insertBefore(g, x.it.E); applied += dl; }
        });
      }
      // توڑ سے پہلے کا حاشیہ (پیراگراف کا نچلا margin) صفحے کی حد سے آگے ہو تو چھپائی میں اگلے صفحے کی
      //   اونچائی اسی حد سے گنی جاتی ہے — صفحہ بھرنے کا حساب اسی کے مطابق (محتاط)
      pTop = Math.min(y, pTop + ch);
      made++;
    }
    // آخری صفحہ — ٹیبل کے بعد خالی قطار، کھڑی لکیریں صفحے کے نیچے (حاشیے) تک
    const last = tbl.querySelector('tbody > tr:last-child');
    const room = Math.floor(ch - used() - FSAFE);
    if (last && room > 1) {
      const tr = d.createElement('tr'); tr.className = 'zfa-fill';
      [].slice.call(last.children).forEach(c => {
        const td = d.createElement('td'); td.className = c.className || '';
        td.style.cssText = 'height:' + room + 'px !important;padding:0 !important;border-top:none !important;border-bottom:none !important;';
        tr.appendChild(td);
      });
      last.parentNode.appendChild(tr); made++;
    }
  });
  return made;
}
window._zaBinder = _zaBinder;
// کاغذ چھپائی سے پہلے «تیار» (بیرونی ضمنی کے _zimniFinalize جیسا)
async function _zaFinalize(html) {
  if (typeof dioBindHtml !== 'function' || !html) return html;
  try { return await dioBindHtml(html, { binder: _zaBinder }); } catch (_) { return html; }
}
window._zaFinalize = _zaFinalize;

// چالان/بیرونی ضمنی jaisa print: kaghaz + margins report173 se، CSS bhi
// report173 (_ch173CSS) + androoni form CSS ملا کر — screen aur print aik jaisa
function _zaPrintHTML(inner) {
  const paper = (typeof _ch173Paper !== 'undefined') ? _ch173Paper : 'legal';
  const side  = (typeof _ch173SideMargin === 'function') ? _ch173SideMargin() : '0.2cm';
  const size  = (paper === 'a4') ? 'A4 portrait' : '8.5in 13in';
  const css173 = (typeof _ch173CSS === 'function') ? _ch173CSS() : '';
  return `<!DOCTYPE html><html dir="rtl" lang="ur"><head><meta charset="UTF-8"><title> </title>
    ${(typeof dioFontHead === 'function') ? dioFontHead() : ''}
    <style>
      @page{ size:${size}; margin:1cm ${side}; }
      *{ -webkit-print-color-adjust:exact; print-color-adjust:exact; box-sizing:border-box; }
      html,body{ margin:0; font-family:'Jameel Noori Nastaleeq';
            direction:rtl; text-align:justify; color:#000; line-height:1.4; }
      ${css173}
      ${_zaFormCSS()}
      #ch173-doc{ width:100% !important; max-width:none !important; height:auto !important;
        min-height:0 !important; padding:0 !important; margin:0 !important;
        transform:none !important; box-shadow:none !important; border-radius:0 !important; }
      #ch173-doc table.zfa-tbl, #ch173-doc table.zfa-tbl tbody,
      #ch173-doc table.zfa-tbl tbody tr, #ch173-doc table.zfa-tbl tbody td{
        page-break-inside:auto !important; break-inside:auto !important; }
      /* AHEM: bug tha — JS (اب _zaBinder) '.zfa-bindmark' class banata hai,
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
      /* تفتیشی افسر کا نام و تاریخ — پرنٹ میں ہمیشہ بائیں (LEFT)، کلاس/ڈیٹا دونوں پر */
      #ch173-doc [data-k="io_sign"], #ch173-doc [data-k="io_date"],
      #ch173-doc .zf-signblk, #ch173-doc .zf-sign, #ch173-doc .zf-signdate,
      #ch173-doc .zfa-wit-sign, #ch173-doc .zfa-wit-io, #ch173-doc .zfa-wit-date{
        text-align:left !important; text-align-last:left !important; }
      /* کالم 1 کا "بوقت" اشارہ پرنٹ میں کبھی نہ چھپے (خالی ہو تو کچھ نہیں) */
      #ch173-doc .zf-actbody::before{ content:none !important; }
      #ch173-doc, #ch173-doc *{ orphans:2; widows:2; }
      ${typeof dioBindCSS === 'function' ? dioBindCSS('#ch173-doc') : ''}
    </style></head><body><div id="ch173-doc">${inner}</div></body></html>`;
}
window._zaPrintHTML = _zaPrintHTML;

async function _zaPrintDoc(inner) {
  const html = await _zaFinalize(_zaPrintHTML(inner));
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
}

// ── PRINT (صرف دستاویز — MS-Word اصول) ──────────────────────────
// v555: مثل کی جگہ اب کاغذ کی تیاری (_zaFinalize) میں — ایڈیٹر کو نہیں چھیڑا جاتا
async function _printZimniANow() {
  const ed = _zimniDoc();
  if (!ed) return;
  try { _zaLayout(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  await _zaPrintDoc(_zimniCleanHTML(ed.innerHTML));
}
window._printZimniA = _printZimniA;
window._printZimniANow = _printZimniANow;   // v558: چالان کے Ctrl+P راستے سے (کاغذ پہلے ہی پوچھا جا چکا)

// ═══════════════════════════════════════════════════════════════
//  فہرست کے ایکشن بٹن (پرنٹ / شیئر / PDF)
// ═══════════════════════════════════════════════════════════════
function _zaDocHTML(z) {
  const c = z.content || {};
  // XSS: androoni print/PDF raasta bhi sanitize nahi karta tha
  return _zaPrintHTML(_zimniSafePrint(c.bodyHtml));
}
function _zaById(id) { return (_zaList || []).find(z => String(z.id) === String(id)); }

async function _printZimniAByIdNow(id) {
  const z = _zaById(id);
  if (!z) { if (typeof showToast === 'function') showToast('اندرونی ضمنی نہیں ملی', 'error'); return; }
  const html = await _zaFinalize(_zaDocHTML(z));
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
}

async function _printAllZimniANow() {
  if (!_zaList || !_zaList.length) {
    if (typeof showToast === 'function') showToast('کوئی اندرونی ضمنی موجود نہیں', 'info'); return;
  }
  try { if (typeof showToast === 'function') showToast('🖨️ تمام بیانات (' + _zaList.length + ') چھپائی کے لیے تیار ہو رہے ہیں…', 'info', 4000); } catch (_) { /* paigham */ }
  const ordered = _zaSort(_zaList.slice()).reverse();   // پرانا پہلے (تاریخ / نمبر)
  const body = ordered.map((z, i) => {
    const c = z.content || {};
    const brk = (i < ordered.length - 1) ? 'style="page-break-after:always;"' : '';
    return `<div ${brk}>${_zimniSafePrint(c.bodyHtml)}</div>`;
  }).join('');
  const html = await _zaFinalize(_zaPrintHTML(body));
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
}


async function _emailZimniA(id) {
  const z = _zaById(id);
  if (!z) return;
  const c    = z.content || {};
  const dt   = z.report_date ? (typeof formatDate === 'function' ? formatDate(z.report_date) : z.report_date) : '';
  const text = (c.bodyHtml || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').replace(/\n{3,}/g, '\n\n').trim();
  const subj = `اندرونی ضمنی نمبر ${z.serial_no || ''}${dt ? ' — ' + dt : ''}`;
  // پوری فائل (PDF + Word) — وہی کاغذ جو پرنٹ میں آتا ہے
  try { if (typeof dioSharePrint === 'function' && await dioSharePrint(() => _printZimniAById(id), subj)) return; } catch (_) { /* نیچے متن والا راستہ */ }
  try {
    if (navigator.share) { await navigator.share({ title: subj, text: subj + '\n\n' + text }); return; }
  } catch (_) { /* share/clipboard na mile to koi baat nahi */ }
  try {
    window.location.href = 'mailto:?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(text);
  } catch (_) {
    try { await navigator.clipboard.writeText(subj + '\n\n' + text);
      if (typeof showToast === 'function') showToast('نقل ہو گیا', 'success'); } catch (__) { /* share/clipboard na mile to koi baat nahi */ }
  }
}

window._printZimniAById = _printZimniAById;
window._printAllZimniA  = _printAllZimniA;
window._emailZimniA     = _emailZimniA;
window._zaDocHTML       = _zaDocHTML;

// ═══════════════════════════════════════════════════════════════
//  NOTE: Ctrl+S — _dioBindCtrlS() zimni.js میں رہتا ہے (پورے سسٹم
//  کے لیے مشترکہ)۔ اُس میں .zfa-tbl کو پہچاننے کی ایک سطر شامل کی
//  گئی ہے (zimni.js کا ورژن v15 دیکھیں) — یہاں دوبارہ لکھنے کی
//  ضرورت نہیں۔
// ═══════════════════════════════════════════════════════════════
