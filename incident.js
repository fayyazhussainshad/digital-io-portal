/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — واقعاتی رپورٹ  (incident.js · v536)
   ────────────────────────────────────────────────────────────────
   ترتیب (ASI کے احکامات، 13 اکتوبر 2026):
   • فہرست ملزمان/گواہان کی طرح — «+ نیا اندراج» سے نئی رپورٹ؛ Dashboard کے
     «نیا اندراج» hub میں بھی «واقعاتی رپورٹ»
   • سطر 1: تھانہ (دائیں) · ضلع (بائیں) — باقی دستاویزات کا اصول؛ پھر عنوان
     «واقعاتی رپورٹ» (20pt)؛ جدول: نوعیت وقوعہ … اطلاع دہندہ … موقع وزٹ کرنے
     والے افسران، ریسپانڈنگ آفیسر …؛ آخر میں ملا ہوا خانہ «جناب عالیٰ! مختصر
     حالات اس طرح پر ہیں کہ»؛ «واقعاتی رپورٹ مرتب ہو کر ارسال ہے۔» + دستخط +
     SHO کی سطر (صرف عہدہ + تھانہ، نام نہیں) + تاریخ
   • کاغذ: A4 · سرکاری مارجن (اوپر/نیچے 1cm، دائیں 1in، بائیں 0.4in) · ایک صفحہ
     · Desktop پر A4 کاغذ؛ Mobile پر پوری چوڑائی (خالی جگہ نہیں) + «A4 منظر»
   • font: Jameel Noori Nastaleeq · 14pt (کبھی px نہیں) · مرکزی عنوان 20pt
   • Ctrl+P = «پرنٹ» بٹن (ایک ہی راستہ — SYSTEM RULE، index.html)
   • اردو RTL، انگریزی/نمبر LTR (ملی جلی سطر میں بھی — <bdi>)
   • ہر خانہ براہِ راست قابلِ ترمیم (عنوان، تھانہ، ضلع اور آخری سطر بھی)
   • ڈیٹا سسٹم سے: تھانہ/ضلع (افسر)، ریسپانڈنگ آفیسر اور SHO کی دستخطی سطر
     (digital_io_sho — SHO کی سطر میں صرف عہدہ + تھانہ)، اور «مقدمہ سے» — نوعیت، وقوعہ، مدعی، ملزمان
   • تاریخ و وقت: خود (اس لمحے کا) — مگر قابلِ ترمیم (📅 سے یا لکھ کر)
   • مقام: Lat/Long خود (GPS) — قابلِ ترمیم، دوبارہ لینے کا بٹن
   • SHO کے دستخط کا خانہ: بنائیں (انگلی/ماؤس) یا تصویر لگائیں — قانونی تنبیہ کے ساتھ
   • ہر رپورٹ: تاریخ + نوعیت (موضوع) + مقام کے ساتھ فہرست میں محفوظ؛
     مرکزی تلاش میں شامل (search.js)
   • آف لائن: انٹرنیٹ نہ ہو تو مقامی طور پر محفوظ، واپس آنے پر خود سرور پر
   • ڈیٹابیس: `incident_reports` — schema نہیں بدلا۔ پورا فارم `data` (jsonb)
     میں {_form:'ir2', f:{…}, …}؛ اوپر کے کالم (نوعیت/تاریخ/مقام/تفصیل) تلاش
     اور حذف شدہ مواد کے لیے
   ═══════════════════════════════════════════════════════════════ */

/* global registerPage, dioBindEditor, softDelete, getCases, getSHOSignLine */

registerPage('incident', renderIncident);

const IR_FORM = 'ir2';
const IR_PX_IN = 96;
// A4 اونچائی − اوپر/نیچے 1cm
const IR_AVAIL_H_IN = 11.69 - 2 / 2.54;
const IR_SIGN_KEY = 'digital_io_sho_sign';

let _irList = [];        // تمام رپورٹس (نئی سب سے اوپر)
let _irCur = null;       // کھلی رپورٹ (null = نئی)
let _irDirty = false;
let _irMeta = {};        // کھلی رپورٹ کا اضافی ڈیٹا (iso تاریخیں، lat/lng، دستخط، مقدمہ)

// جدول کی سطریں — اصل کاغذ کی ترتیب میں
const IR_ROWS = [
  { k: 'nature',    l: 'نوعیت وقوعہ',                   pick: 'nature' },
  { k: 'occ',       l: 'تاریخ / وقت وقوعہ',              dt: 'occ' },
  { k: 'info',      l: 'تاریخ / وقت اطلاع کنٹرول روم',   dt: 'info' },
  { k: 'place',     l: 'جائے وقوعہ',                     loc: true },
  { k: 'caller',    l: 'اطلاع دہندہ' },
  { k: 'victim',    l: 'متاثرہ کا نام',                  pick: 'ptype' },
  { k: 'motive',    l: 'وجہ عناد / حادثہ' },
  { k: 'accused',   l: 'ملزم / ملزمان کے نام / تعداد' },
  { k: 'hulya',     l: 'حلیہ جات ملزمان' },
  { k: 'vehicle',   l: 'وہیکل / قسم / رنگ' },
  { k: 'visitors',  l: 'موقع وزٹ کرنے والے افسران' },
  { k: 'responder', l: 'ریسپانڈنگ آفیسر' },
  { k: 'arrested',  l: 'تعداد گرفتار ملزمان' },
];

// پرانے فارم کی فہرستیں (کام کی تھیں — برقرار)
const IR_NATURES = ['قتل', 'اقدام قتل', 'ڈکیتی', 'راہزنی', 'چوری', 'نقب زنی', 'اغوا', 'دہشت گردی', 'فساد',
  'ٹریفک حادثہ', 'جنسی زیادتی', 'غیر قانونی اسلحہ', 'منشیات', 'فراڈ / دھوکہ', 'توڑ پھوڑ',
  'خودکشی', 'لاوارث لاش', 'آگ لگنا', 'دیگر'];
const IR_PTYPES = ['متاثرہ', 'مقتول', 'مضروب', 'مغوی', 'مدعی'];

const IR_ICON = {
  back: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  save: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4"/><path d="M8 20v-6h8v6"/></svg>',
  print: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 9V4h10v5"/><path d="M6 18H4v-7h16v7h-2"/><path d="M7 14h10v6H7z"/></svg>',
  share: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.9l7.6-3.8"/><path d="M8.2 13.1l7.6 3.8"/></svg>',
  down: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v12"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>',
  del: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/></svg>',
  pin: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  cal: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6.5h16V20H4z"/><path d="M4 10.5h16"/><path d="M8 3.5v4"/><path d="M16 3.5v4"/></svg>',
  case: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16v12H4z"/><path d="M9 7V5h6v2"/><path d="M4 12h16"/></svg>',
  zoom: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/><path d="M8.5 11h5"/><path d="M11 8.5v5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
};

/* ═════════════ چھوٹے مددگار ═════════════ */
function _irE(s) { return (typeof esc === 'function') ? esc(s == null ? '' : String(s)) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function _irSan(h) { return (typeof sanitizeHtml === 'function') ? sanitizeHtml(String(h || '')) : _irE(String(h || '').replace(/<br\s*\/?>/gi, '\n')).replace(/\n/g, '<br>'); }
function _irPlain(h) {
  const d = document.createElement('div');
  d.innerHTML = String(h || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(div|p)>/gi, '\n');
  return (d.textContent || '').replace(/ /g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}
function _irPad(n) { return String(n).padStart(2, '0'); }
function _irToast(m, t, ms) { if (typeof showToast === 'function') showToast(m, t || 'info', ms); }
function _irOfficer() {
  let o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : null;
  if (!o) { try { o = JSON.parse(localStorage.getItem('dio_officer_cache') || 'null'); } catch { o = null; } }
  return o || {};
}
function _irSho() {
  try { const s = JSON.parse(localStorage.getItem('digital_io_sho') || '{}'); return { name: (s.name || '').trim(), rank: (s.rank || '').trim() }; }
  catch { return { name: '', rank: '' }; }
}
function _irCacheKey() { const o = _irOfficer(); return 'dio_irlist_' + (o.id || 'me'); }
function _irStoreLocal() { try { localStorage.setItem(_irCacheKey(), JSON.stringify(_irList)); } catch (e) { console.warn('ir cache:', e && e.message); } }
function _irLocal() { try { return JSON.parse(localStorage.getItem(_irCacheKey()) || '[]') || []; } catch { return []; } }

// Pakistan وقت (Asia/Karachi) میں «اب» → 'YYYY-MM-DDTHH:MM'
function _irNowIso() {
  const d = new Date();
  try {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
    const g = t => (p.find(x => x.type === t) || {}).value || '';
    const hh = g('hour') === '24' ? '00' : g('hour');
    return `${g('year')}-${g('month')}-${g('day')}T${hh}:${g('minute')}`;
  } catch {
    return `${d.getFullYear()}-${_irPad(d.getMonth() + 1)}-${_irPad(d.getDate())}T${_irPad(d.getHours())}:${_irPad(d.getMinutes())}`;
  }
}
// 'YYYY-MM-DD…' → 'DD/MM/YYYY'
function _irDmy(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}
// 'DD/MM/YYYY' یا 'YYYY-MM-DD' → 'YYYY-MM-DD'
function _irIsoDate(s) {
  s = String(s || '').trim();
  let m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${_irPad(m[2])}-${_irPad(m[3])}`;
  m = s.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  return m ? `${m[3]}-${_irPad(m[2])}-${_irPad(m[1])}` : '';
}
// دن کا حصہ — اصل کاغذ کی طرح «بجے صبح»
function _irPeriod(h) {
  if (h >= 4 && h < 12) return 'صبح';
  if (h >= 12 && h < 15) return 'دوپہر';
  if (h >= 15 && h < 18) return 'سہ پہر';
  if (h >= 18 && h < 20) return 'شام';
  return 'رات';
}
// iso → «08/10/2026 بوقت 05:15 بجے صبح» (نمبر LTR)
function _irDtHtml(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!m) return '';
  const date = `<bdi dir="ltr">${m[3]}/${m[2]}/${m[1]}</bdi>`;
  if (m[4] === undefined) return date;
  const h = parseInt(m[4], 10);
  const h12 = (h % 12) || 12;
  return `${date} بوقت <bdi dir="ltr">${_irPad(h12)}:${m[5]}</bdi> بجے ${_irPeriod(h)}`;
}
function _irStamp(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  try {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true }).formatToParts(d);
    const g = t => (p.find(x => x.type === t) || {}).value || '';
    return `${g('day')}/${g('month')}/${g('year')} ${g('hour')}:${g('minute')} ${g('dayPeriod').toLowerCase()}`;
  } catch { return d.toISOString().slice(0, 16).replace('T', ' '); }
}
function _irLatLngText(lat, lng) {
  const a = Number(lat), b = Number(lng);
  return (isFinite(a) && isFinite(b) && (a || b)) ? `${a.toFixed(6)}, ${b.toFixed(6)}` : '';
}
function _irParseLatLng(t) {
  const m = String(t || '').match(/(-?\d{1,2}(?:\.\d+)?)\s*[,،\s]\s*(-?\d{1,3}(?:\.\d+)?)/);
  if (!m) return null;
  const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
  if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

// اردو جملے میں «0303-2333981» / «36302-1234567-1» جیسے نمبر RTL میں الٹ جاتے ہیں
// (عربی حرف کے بعد ہندسے AN بن جاتے ہیں اور «-» انہیں جوڑتا نہیں) — انہیں LTR میں الگ کر دو۔
// تاریخ (08/10/2026) اور وقت (05:15) پہلے ہی درست رہتے ہیں۔
function _irIsolateNums(root) {
  if (!root || !document.createTreeWalker) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach(n => {
    const par = n.parentElement;
    if (!par || par.closest('bdi,[dir="ltr"]')) return;
    const t = n.nodeValue || '';
    const re = /\d+(?:[-\u2013]\d+)+/g;
    if (!re.test(t)) return;
    re.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0, m;
    while ((m = re.exec(t))) {
      if (m.index > last) frag.appendChild(document.createTextNode(t.slice(last, m.index)));
      const b = document.createElement('bdi');
      b.setAttribute('dir', 'ltr');
      b.textContent = m[0];
      frag.appendChild(b);
      last = m.index + m[0].length;
    }
    if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
    n.parentNode.replaceChild(frag, n);
  });
}

/* ═════════════ محفوظ ریکارڈ → خانے ═════════════ */
function _irData(row) {
  let d = row && row.data;
  if (typeof d === 'string') { try { d = JSON.parse(d); } catch { d = {}; } }
  return d || {};
}
// نئی ترتیب ہو تو اس کے خانے؛ پرانا فارم ہو تو اس کے خانے نئی جگہ پر (کچھ ضائع نہیں)
function _irFieldsOf(row) {
  const d = _irData(row);
  if (d._form === IR_FORM && d.f) return { f: { ...d.f }, meta: { ...d } };
  const t = s => _irE(s || '');
  const offs = Array.isArray(d.officers) ? d.officers.join('، ') : (d.officers || '');
  const f = {
    nature: t(row.incident_type || d.severity),
    occ: t(d.datetime || row.incident_date),
    place: t(row.address || d.place),
    caller: t([d.caller_name, d.caller_phone].filter(Boolean).join(' ')),
    victim: t(d.person_name),
    accused: t(d.accused || row.action_taken),
    visitors: t(offs),
    detail: t(row.narrative).replace(/\n/g, '<br>'),
    sign_date: t(d.sign_date),
  };
  return { f, meta: { person_type: d.person_type || '', fir_number: d.fir_number || '', legacy: true } };
}
function _irListDate(row) {
  const d = _irData(row);
  if (d._form === IR_FORM) {
    const iso = d.occ_iso || '';
    if (iso) return _irDmy(iso) + (iso.length > 10 ? ' ' + _irPlain(_irDtHtml(iso)).replace(/^\S+\s/, '') : '');
    return _irPlain(d.f && d.f.occ);
  }
  return String(d.datetime || row.incident_date || '').trim();
}
function _irListSubject(row) {
  const d = _irData(row);
  return ((d._form === IR_FORM && d.f) ? _irPlain(d.f.nature) : String(row.incident_type || d.severity || '')).trim();
}
function _irListPlace(row) {
  const d = _irData(row);
  return ((d._form === IR_FORM && d.f) ? _irPlain(d.f.place) : String(row.address || d.place || '')).trim();
}

/* ═════════════ فہرست (صفحہ) — ملزمان/گواہان والی ترتیب ═════════════ */
const _irF = { q: '', nature: '' };   // اس صفحے کی واحد چھاننے کی حالت (تلاش + نوعیت)

async function renderIncident(container) {
  if (!container) return;
  container.innerHTML = (window.DIO && DIO.states && DIO.states.loading)
    ? DIO.states.loading('واقعاتی رپورٹس لوڈ ہو رہی ہیں')
    : '<div style="text-align:center;padding:30px;color:var(--text-muted);">لوڈ ہو رہا ہے…</div>';
  await _irLoadList();
  _irF.q = ''; _irF.nature = '';
  _irRenderList(container);
  // تلاش سے آئے ہوں تو سیدھا وہی رپورٹ؛ «نیا اندراج» سے آئے ہوں تو نئی رپورٹ
  const want = window._irOpenId;
  if (want) { window._irOpenId = null; _irOpen(want); return; }
  if (window._irOpenNew) { window._irOpenNew = false; _irNew(); }
}
window.renderIncident = renderIncident;

async function _irLoadList() {
  const local = _irLocal();
  let server = null;
  if (navigator.onLine && typeof supabaseClient !== 'undefined') {
    try {
      const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
      if (oid) {
        const { data, error } = await supabaseClient.from('incident_reports').select('*')
          .eq('officer_id', oid).order('created_at', { ascending: false }).limit(500);
        if (error) throw error;
        server = data || [];
      }
    } catch (e) { console.warn('ir list:', e && e.message); }
  }
  let list = server ? server.slice() : local.filter(x => !x._pending);
  // مقامی زیرِ التوا (آف لائن) ریکارڈ ہمیشہ غالب — ورنہ کام ضائع
  local.filter(x => x._pending).forEach(p => {
    const i = list.findIndex(x => String(x.id) === String(p.id));
    if (i >= 0) list[i] = p; else list.push(p);
  });
  list.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  _irList = list;
  _irStoreLocal();
  if (server) _irSyncPending();   // انٹرنیٹ ہے → زیرِ التوا خود سرور پر
}

const IR_LIST_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M12 10.5v4"/><path d="M12 17.3h.01"/></svg>';

function _irRenderList(container) {
  const area = container || document.getElementById('page-content');
  if (!area) return;
  // نوعیت کی chips — صرف وہ جو محفوظ رپورٹس میں ہیں (زیادہ والی پہلے)
  const cnt = {};
  _irList.forEach(r => { const s = _irListSubject(r); if (s) cnt[s] = (cnt[s] || 0) + 1; });
  const natures = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]).slice(0, 8);
  area.innerHTML = `
  <div class="ir-page" style="direction:rtl;">
    <div class="page-header">
      <button class="btn btn-primary dio-add-btn" onclick="_irNew()">+ نیا اندراج</button>
      <div>
        <div class="page-title">واقعاتی رپورٹس</div>
        <div class="page-subtitle"><span id="ir-count">${_irVisible().length}</span> رپورٹس — تاریخ، نوعیت اور مقام کے ساتھ</div>
      </div>
    </div>
    <div style="margin-bottom:14px;">
      <input class="form-input" id="ir-list-q" type="text" dir="rtl" autocomplete="off" style="width:100%;"
        placeholder="نوعیت، تاریخ، مقام، اطلاع دہندہ یا رپورٹ نمبر سے تلاش کریں..." oninput="_irListFilter(this.value)">
    </div>
    ${natures.length > 1 ? `<div class="ir-chips">
      <button class="btn btn-secondary btn-sm ir-chip-f active" data-n="" onclick="_irNatureFilter('',this)">سب</button>
      ${natures.map(n => `<button class="btn btn-secondary btn-sm ir-chip-f" data-n="${_irE(n)}" onclick="_irNatureFilter(this.dataset.n,this)">${_irE(n)} <bdi dir="ltr">${cnt[n]}</bdi></button>`).join('')}
    </div>` : ''}
    <div id="ir-list-body">${_irListRows()}</div>
  </div>
  <style>${_irListCSS()}</style>`;
}
window._irRenderList = _irRenderList;

function _irSearchText(r) {
  const d = _irData(r);
  const f = (d._form === IR_FORM && d.f) ? d.f : {};
  return [_irListSubject(r), _irListDate(r), _irListPlace(r), r.report_number, _irPlain(f.caller), d.caller_name, d.fir_number]
    .map(x => String(x || '')).join(' ').toLowerCase();
}
function _irVisible() {
  const q = _irF.q.trim().toLowerCase();
  return _irList.map((r, i) => ({ r, no: _irList.length - i })).filter(({ r }) =>
    (!_irF.nature || _irListSubject(r) === _irF.nature) && (!q || _irSearchText(r).includes(q)));
}
function _irListRows() {
  if (!_irList.length) {
    return `<div class="ir-empty">
      <div class="ir-empty-ico">${IR_LIST_ICON}</div>
      <div>ابھی کوئی واقعاتی رپورٹ محفوظ نہیں</div>
      <button type="button" class="btn btn-primary" onclick="_irNew()">+ نیا اندراج — واقعاتی رپورٹ</button></div>`;
  }
  const rows = _irVisible();
  const n = document.getElementById('ir-count');
  if (n) n.textContent = rows.length;
  if (!rows.length) return '<div class="ir-empty">اس تلاش سے کوئی رپورٹ نہیں ملی</div>';
  return `<div class="ir-cards">${rows.map(({ r, no }) => {
    const d = _irData(r);
    const subj = _irListSubject(r) || 'واقعاتی رپورٹ';
    const date = _irListDate(r) || '—';
    const place = _irListPlace(r) || '—';
    const ll = _irLatLngText(d.lat, d.lng);
    const id = _irE(String(r.id));
    return `
    <div class="card ir-card" role="button" tabindex="0" onclick="_irOpen('${id}')" onkeydown="if(event.key==='Enter')_irOpen('${id}')">
      <div class="ir-card-row">
        <div class="ir-card-ico">${IR_LIST_ICON}</div>
        <div class="ir-card-body">
          <div class="ir-card-t">${_irE(subj)}${r._pending ? ' <span class="ir-pend">سرور پر نہیں گئی — انٹرنیٹ آنے پر خود</span>' : ''}</div>
          <div class="ir-card-s"><bdi>${_irE(date)}</bdi> · <bdi>${_irE(place)}</bdi></div>
          <div class="ir-card-x">${ll ? `<bdi dir="ltr">${_irE(ll)}</bdi> · ` : ''}رپورٹ <bdi dir="ltr">#${no}</bdi> · <bdi dir="ltr">${_irE(r.report_number || '')}</bdi></div>
        </div>
        ${d.fir_number ? `<div class="ir-card-badge">مقدمہ <bdi dir="ltr">${_irE(d.fir_number)}</bdi></div>` : ''}
      </div>
    </div>`;
  }).join('')}</div>`;
}
function _irListFilter(v) {
  _irF.q = String(v || '');
  const b = document.getElementById('ir-list-body');
  if (b) b.innerHTML = _irListRows();
}
window._irListFilter = _irListFilter;
function _irNatureFilter(n, el) {
  document.querySelectorAll('.ir-chip-f').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  _irF.nature = n || '';
  const b = document.getElementById('ir-list-body');
  if (b) b.innerHTML = _irListRows();
}
window._irNatureFilter = _irNatureFilter;

function _irListCSS() {
  return `
    .ir-chips{ display:flex; gap:6px; margin-bottom:14px; flex-wrap:wrap; }
    .ir-chips bdi{ font-family:Arial,sans-serif; font-size:9pt; opacity:.75; }
    .ir-cards{ display:flex; flex-direction:column; gap:10px; }
    .ir-card{ padding:14px; cursor:pointer; border-right:3px solid var(--red,#dc2626); }
    .ir-card:hover, .ir-card:focus-visible{ border-color:var(--accent); border-right-color:var(--red,#dc2626); outline:none; }
    .ir-card-row{ display:flex; align-items:center; gap:12px; }
    .ir-card-ico{ width:42px; height:42px; border-radius:50%; background:var(--red,#dc2626); color:#fff; flex-shrink:0;
      display:flex; align-items:center; justify-content:center; }
    .ir-card-body{ flex:1; min-width:0; }
    .ir-card-t{ font-size:14pt; font-weight:700; line-height:1.9; font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; }
    .ir-card-s{ font-size:12pt; line-height:1.9; color:var(--text-primary); font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; overflow-wrap:anywhere; }
    .ir-card-x{ font-size:10.5pt; color:var(--text-muted); line-height:1.8; }
    .ir-card bdi[dir="ltr"]{ font-family:Arial,sans-serif; font-size:9.5pt; white-space:nowrap; }
    .ir-card-badge{ background:var(--accent-glow); color:var(--accent); border-radius:12px; padding:3px 10px; font-size:10.5pt;
      font-weight:700; white-space:nowrap; }
    .ir-pend{ font-size:10pt; color:#b45309; font-weight:700; margin-right:6px; }
    .ir-empty{ text-align:center; padding:40px 20px; color:var(--text-muted); line-height:2.4; font-size:14pt;
      font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; }
    .ir-empty-ico svg{ width:46px; height:46px; opacity:.45; }
    @media (max-width:760px){
      .ir-card{ padding:12px; }
      .ir-card-row{ align-items:flex-start; }
      .ir-card-badge{ display:none; }
    }`;
}

/* ═════════════ رپورٹ کھولنا / نئی ═════════════ */
function _irDraftKey() { const o = _irOfficer(); return 'dio_ir_draft_' + (o.id || 'me'); }
function _irDraft() { try { return JSON.parse(localStorage.getItem(_irDraftKey()) || 'null'); } catch { return null; } }
function _irDraftClear() { try { localStorage.removeItem(_irDraftKey()); } catch { /* storage بند */ } }
let _irDraftT = null;
// غیر محفوظ کام کا مسودہ (ایپ بند ہو جائے/فون بند ہو جائے تو بھی ضائع نہ ہو)
function _irDraftSoon() {
  clearTimeout(_irDraftT);
  _irDraftT = setTimeout(() => {
    if (!_irDirty || !document.getElementById('ir-doc')) return;
    const m = { ..._irMeta };
    const rec = () => JSON.stringify({ cur_id: _irCur ? _irCur.id : null, f: _irCollect(true), meta: m, at: new Date().toISOString() });
    try { localStorage.setItem(_irDraftKey(), rec()); }
    catch { /* بہت بڑا (دستخط) — بغیر دستخط */ try { delete m.sho_sign; localStorage.setItem(_irDraftKey(), rec()); } catch { /* جگہ نہیں */ } }
  }, 900);
}
function _irOfferDraft(curId) {
  const d = _irDraft();
  if (!d || !d.f || String(d.cur_id || '') !== String(curId || '')) return null;
  const when = _irStamp(d.at);
  if (confirm(`اس رپورٹ کا غیر محفوظ مسودہ موجود ہے${when ? ' (' + when + ')' : ''}۔\nکیا اسے بحال کریں؟`)) return d;
  _irDraftClear();
  return null;
}

function _irNew() {
  if (window.DIO && DIO.sub && typeof DIO.sub.guard === 'function' && !DIO.sub.guard('نئی واقعاتی رپورٹ')) return;
  if (document.getElementById('ir-view') && _irDirty && !confirm('غیر محفوظ تبدیلیاں ضائع ہو جائیں گی۔ نئی رپورٹ کھولیں؟')) return;
  _irCur = null;
  const draft = _irOfferDraft(null);
  if (draft) {
    _irMeta = { ...(draft.meta || {}) };
    _irRenderDoc(draft.f);
    _irMarkDirty(true);
    return;
  }
  const now = _irNowIso();
  _irMeta = { occ_iso: now, info_iso: now, person_type: 'متاثرہ' };
  _irRenderDoc();
  _irMarkDirty(false);
  _irGetLocation(true);     // Lat/Long خود
}
window._irNew = _irNew;

function _irOpen(id) {
  const r = _irList.find(x => String(x.id) === String(id));
  if (!r) { _irToast('رپورٹ نہیں ملی', 'error'); return; }
  if (document.getElementById('ir-view') && _irDirty && !confirm('غیر محفوظ تبدیلیاں ضائع ہو جائیں گی۔ یہ رپورٹ کھولیں؟')) return;
  _irCur = r;
  const draft = _irOfferDraft(r.id);
  _irMeta = draft ? { ...(draft.meta || {}) } : { ..._irFieldsOf(r).meta };
  delete _irMeta.f;
  _irRenderDoc(draft ? draft.f : null);
  _irMarkDirty(!!draft);
}
window._irOpen = _irOpen;
// تلاش (search.js) سے — صفحہ کھلے، پھر رپورٹ
function openIncidentReport(id) {
  window._irOpenId = id;
  if (typeof showPage === 'function') showPage('incident', null);
}
window.openIncidentReport = openIncidentReport;
// «نیا اندراج» hub سے — واقعاتی رپورٹ کا صفحہ، پھر نئی رپورٹ
function openIncidentNew() {
  window._irOpenNew = true;
  if (typeof showPage === 'function') showPage('incident', null);
}
window.openIncidentNew = openIncidentNew;

function _irClose(force) {
  if (!force && _irDirty) {
    if (!confirm('غیر محفوظ تبدیلیاں ضائع ہو جائیں گی۔ فہرست پر جائیں؟')) return;
    _irDraftClear();
  }
  const v = document.getElementById('ir-view');
  if (v) v.remove();
  document.body.classList.remove('ir-open');
  document.removeEventListener('keydown', _irKeys);
  _irDirty = false;
  _irCur = null;
  if (window._activePage === 'incident') _irRenderList();
}
window._irClose = _irClose;
function _irKeys(e) {
  // Ctrl+S → محفوظ (براؤزر کا «صفحہ محفوظ کریں» نہیں)
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === 's' || e.key === 'S')) {
    e.preventDefault(); _irSave(); return;
  }
  if (e.key !== 'Escape') return;
  const bd = document.getElementById('modal-backdrop');
  if (bd && bd.style.display !== 'none') return;     // پہلے کارڈ بند ہو
  _irClose();
}
function _irMarkDirty(b) {
  _irDirty = !!b;
  const s = document.getElementById('ir-state');
  if (s) {
    s.textContent = _irDirty ? 'غیر محفوظ تبدیلیاں' : (_irCur && !_irCur._pending ? 'محفوظ' : (_irCur ? 'آف لائن محفوظ' : 'نئی — ابھی محفوظ نہیں'));
    s.dataset.state = _irDirty ? 'dirty' : (_irCur ? 'saved' : 'new');
  }
}
window.addEventListener('beforeunload', e => {
  if (document.getElementById('ir-view') && _irDirty) { e.preventDefault(); e.returnValue = ''; }
});

/* ═════════════ پہلے سے طے شدہ ڈیٹا (سسٹم سے) ═════════════ */
function _irDefaults() {
  const o = _irOfficer();
  const sho = _irSho();
  const station = (o.station || '').trim();
  const responder = [sho.name, sho.rank].filter(Boolean).join(' ') ||
    [(o.full_name || '').trim(), (o.designation || o.rank || '').trim()].filter(Boolean).join(' ');
  // SHO کی سطر: صرف عہدہ (SI/SHO، I/SHO …) + تھانہ — نام نہیں (ASI کا حکم)
  const shoRank = sho.rank || 'SHO';
  return {
    title: 'واقعاتی رپورٹ',
    thana: _irE(station), zila: _irE((o.district || '').trim()),
    nature: '', occ: _irDtHtml(_irMeta.occ_iso), info: _irDtHtml(_irMeta.info_iso),
    place: '', latlng: _irE(_irLatLngText(_irMeta.lat, _irMeta.lng)),
    caller: '', victim: '', motive: '', accused: '', hulya: '', vehicle: '', visitors: '',
    responder: _irE(responder), arrested: '',
    detail: '<b>جناب عالیٰ!</b> مختصر حالات اس طرح پر ہیں کہ&nbsp;',
    closing: 'واقعاتی رپورٹ مرتب ہو کر ارسال ہے۔',
    sho_line: `<bdi dir="ltr">${_irE(shoRank)}</bdi> تھانہ ${_irE(station)}`,
    sign_date: `<bdi dir="ltr">${_irDmy(_irNowIso())}</bdi>`,
  };
}
const IR_DETAIL_OPEN = /^\s*جناب عالیٰ!?\s*مختصر حالات اس طرح پر ہیں کہ\s*/;

function _irPhone() { try { return window.matchMedia('(max-width: 760px)').matches; } catch { return false; } }

/* ═════════════ دستاویز (پورا صفحہ) ═════════════ */
function _irRenderDoc(override) {
  const saved = override || (_irCur ? _irFieldsOf(_irCur).f : {});
  const def = _irDefaults();
  const has = k => saved[k] !== undefined && saved[k] !== null && _irPlain(saved[k]) !== '';
  const val = k => has(k) ? _irSan(saved[k]) : (def[k] || '');

  const total = _irList.length;
  const idx = _irCur ? _irList.findIndex(x => String(x.id) === String(_irCur.id)) : -1;
  const title = idx >= 0 ? `واقعاتی رپورٹ #${total - idx}` : 'نیا اندراج — واقعاتی رپورٹ';

  const F = (k, cls, extra) => `<div class="ir-f ${cls || ''}" contenteditable="true" spellcheck="false" data-k="${k}" ${extra || ''}>${val(k)}</div>`;
  const FI = k => `<span class="ir-fi" contenteditable="true" spellcheck="false" data-k="${k}">${val(k)}</span>`;
  const pType = _irMeta.person_type || 'متاثرہ';
  const label = r => (r.pick === 'ptype') ? `<span id="ir-ptype-l">${_irE(pType)}</span> کا نام` : r.l;

  const pickNature = `<span class="ir-pick no-print" title="نوعیت منتخب کریں">▾<select aria-label="نوعیت وقوعہ منتخب کریں" onchange="_irPickNature(this)">
      <option value="">نوعیت منتخب کریں</option>${IR_NATURES.map(n => `<option>${_irE(n)}</option>`).join('')}</select></span>`;
  const pickPtype = `<span class="ir-pick no-print" title="حیثیت بدلیں">▾<select aria-label="حیثیت منتخب کریں" onchange="_irPickPtype(this)">
      ${IR_PTYPES.map(n => `<option ${n === pType ? 'selected' : ''}>${_irE(n)}</option>`).join('')}<option value="__new">+ نئی حیثیت</option></select></span>`;
  const pickDt = k => `<span class="ir-pick ir-cal no-print" title="تاریخ و وقت چنیں">${IR_ICON.cal}<input type="datetime-local" aria-label="تاریخ و وقت چنیں"
      value="${_irE(_irMeta[k + '_iso'] || '')}" onclick="try{this.showPicker()}catch(_){}" onchange="_irSetDt('${k}', this.value)"></span>`;
  const pickLoc = `<button type="button" class="ir-pick ir-locbtn no-print" title="موجودہ مقام (Lat/Long) دوبارہ لیں" aria-label="مقام لیں" onclick="_irGetLocation(false)">${IR_ICON.pin}</button>`;

  const rowsHtml = IR_ROWS.map(r => {
    let cell;
    if (r.loc) {
      cell = `${F('place')}
        <div class="ir-llrow"><span class="ir-lll">لوکیشن</span> <bdi dir="ltr" class="ir-lle">Lat/Long:</bdi>
          <div class="ir-f ir-ll" contenteditable="true" spellcheck="false" data-k="latlng" dir="ltr">${val('latlng')}</div>
          ${_irMeta.lat !== undefined ? `<a class="ir-map no-print" href="https://maps.google.com/?q=${encodeURIComponent(_irLatLngText(_irMeta.lat, _irMeta.lng))}" target="_blank" rel="noopener">نقشہ</a>` : ''}
        </div>`;
    } else {
      cell = F(r.k);
    }
    const tools = r.pick === 'nature' ? pickNature : r.pick === 'ptype' ? pickPtype : r.dt ? pickDt(r.dt) : r.loc ? pickLoc : '';
    return `<tr><th scope="row">${label(r)}</th><td><div class="ir-cell${tools ? ' has-pick' : ''}">${cell}${tools}</div></td></tr>`;
  }).join('');

  const sign = _irMeta.sho_sign || '';
  const hasStored = (() => { try { return !!localStorage.getItem(IR_SIGN_KEY); } catch { return false; } })();
  const caseChip = _irMeta.fir_number ? `<span class="ir-chip" title="منسلک مقدمہ">مقدمہ <bdi dir="ltr">${_irE(_irMeta.fir_number)}</bdi></span>` : '';
  const phone = _irPhone();

  let v = document.getElementById('ir-view');
  if (!v) {
    v = document.createElement('div');
    v.id = 'ir-view';
    document.body.appendChild(v);
    document.body.classList.add('ir-open');
    document.addEventListener('keydown', _irKeys);
  }
  v.classList.toggle('ir-a4', !phone || !!_irA4View);
  v.innerHTML = `
  <div class="ir-strip no-print" role="toolbar" aria-label="واقعاتی رپورٹ">
    <div class="ir-strip-r">
      <button type="button" class="btn btn-secondary btn-sm" onclick="_irClose()" title="تمام واقعاتی رپورٹس (Esc)">${IR_ICON.back} فہرست</button>
      <div class="ir-strip-tt">
        <span class="ir-strip-t" id="ir-strip-t">${_irE(title)}</span>
        <span class="ir-state" id="ir-state"></span>
      </div>
      ${caseChip}
    </div>
    <div class="ir-strip-l">
      <button type="button" class="btn btn-secondary btn-sm" onclick="_irPickCase()" title="مقدمے کا ڈیٹا اس رپورٹ میں لائیں">${IR_ICON.case} مقدمہ سے</button>
      ${phone ? `<button type="button" class="btn btn-secondary btn-sm" onclick="_irToggleView()" id="ir-view-btn" title="موبائل منظر / A4 کاغذ">${IR_ICON.zoom} <span>${_irA4View ? 'موبائل منظر' : 'A4 منظر'}</span></button>` : ''}
      <button type="button" class="btn btn-secondary btn-sm" onclick="_irShare()" title="شیئر">${IR_ICON.share} شیئر</button>
      <button type="button" class="btn btn-secondary btn-sm" onclick="_irDownload()" title="ڈاؤن لوڈ">${IR_ICON.down} ڈاؤن لوڈ</button>
      <button type="button" class="btn btn-secondary btn-sm" data-dio-print onclick="_irPrint()" title="پرنٹ (Ctrl+P)">${IR_ICON.print} پرنٹ</button>
      <button type="button" class="btn btn-primary btn-sm" onclick="_irSave()" title="محفوظ کریں (Ctrl+S)">${IR_ICON.save} محفوظ کریں</button>
      ${_irCur ? `<button type="button" class="btn btn-danger btn-sm ir-del" onclick="_irDelete('${_irE(String(_irCur.id))}')" title="حذف" aria-label="حذف">${IR_ICON.del}</button>` : ''}
    </div>
  </div>
  <div class="ir-scroll" id="ir-scroll">
    <div class="ir-zoom" id="ir-zoom">
      <div id="ir-doc" class="ir-page" lang="ur" dir="rtl"><div class="ir-inner" id="ir-inner">

        <!-- سطر 1 (نظام کا اصول، درخواستوں کی طرح): تھانہ دائیں · ضلع بائیں -->
        <div class="ir-title-row">
          <span class="ir-tt-right">تھانہ ${FI('thana')}</span>
          <span class="ir-tt-left">ضلع ${FI('zila')}</span>
        </div>

        <div class="ir-head"><div class="ir-f ir-title dio-doc-h1" contenteditable="true" spellcheck="false" data-k="title">${val('title')}</div></div>

        <table class="ir-table" role="presentation">
          <colgroup><col class="ir-c1"><col></colgroup>
          <tbody>
            ${rowsHtml}
            <tr class="ir-detail-row"><td colspan="2"><div class="ir-cell">${F('detail', 'ir-detail')}</div></td></tr>
          </tbody>
        </table>

        <div class="ir-end">
          <div class="ir-endbox">
            ${F('closing', 'ir-closing')}
            <div class="ir-signbox" id="ir-signbox">${sign ? `<img alt="SHO دستخط" src="${_irE(sign)}">` : ''}</div>
            <div class="ir-signbtns no-print">
              <button type="button" onclick="_irSignPad()">دستخط بنائیں</button>
              <label>تصویر لگائیں<input type="file" accept="image/*" onchange="_irSignFile(this)"></label>
              ${hasStored && !sign ? '<button type="button" onclick="_irSignStored()">محفوظ دستخط</button>' : ''}
              ${sign ? '<button type="button" onclick="_irSignClear()">ہٹائیں</button>' : ''}
            </div>
            ${F('sho_line', 'ir-sholine')}
            ${F('sign_date', 'ir-signdate')}
          </div>
        </div>

      </div></div>
    </div>
  </div>
  <style id="ir-style">${_irCSS()}</style>`;

  const doc = document.getElementById('ir-doc');
  if (doc) {
    doc.addEventListener('input', e => {
      _irMarkDirty(true);
      const k = e.target && e.target.dataset && e.target.dataset.k;
      if (k === 'latlng') { const p = _irParseLatLng(e.target.innerText); if (p) { _irMeta.lat = p.lat; _irMeta.lng = p.lng; } _irMapLink(); }
      if (k === 'occ' || k === 'info') { _irMeta[k + '_iso'] = ''; }   // ہاتھ سے لکھا — وہی معتبر
      _irBalanceSoon();
      _irDraftSoon();
    });
    // خانہ چھوڑتے ہی نمبر LTR میں (لکھتے وقت نہیں — کرسر نہ کودے)
    doc.addEventListener('focusout', e => { if (e.target && e.target.dataset && e.target.dataset.k) _irIsolateNums(e.target); });
    // چسپاں (paste) — صرف سادہ متن (باہر کی formatting کاغذ نہ بگاڑے)
    doc.addEventListener('paste', e => {
      const t = e.clipboardData && e.clipboardData.getData('text/plain');
      if (t == null) return;
      e.preventDefault();
      try { document.execCommand('insertText', false, t); } catch { /* پرانا براؤزر — عام چسپاں */ }
    });
  }
  _irIsolateNums(doc);
  if (typeof dioBindEditor === 'function') { try { dioBindEditor(v); } catch (e) { console.warn('ir bind:', e && e.message); } }
  _irMarkDirty(_irDirty);
  _irFit();
  _irBalance();
  try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { _irFit(); _irBalance(); }); } catch { /* پرانا براؤزر */ }
  if (!window._irResizeBound) {
    window._irResizeBound = true;
    window.addEventListener('resize', () => {
      const vv = document.getElementById('ir-view');
      if (!vv) return;
      vv.classList.toggle('ir-a4', !_irPhone() || !!_irA4View);
      _irFit();
    });
    window.addEventListener('beforeprint', () => { if (document.getElementById('ir-doc')) _irBalance(); });
  }
}
window._irRenderDoc = _irRenderDoc;

/* ── CSS (سکرین + چھپائی) ──
   • Desktop / «A4 منظر»: بالکل چھپائی والا A4 کاغذ (ناپ وہی، ضرورت ہو تو zoom)
   • Mobile «موبائل منظر»: وہی دستاویز سکرین کی پوری چوڑائی میں — اوپر نیچے
     کوئی خالی جگہ نہیں؛ چھپائی پھر بھی A4 ہی (یہ اصول صرف سکرین پر) */
function _irCSS() {
  return `
    body.ir-open{ overflow:hidden; }
    body.ir-open #toast-container{ z-index:9700; }
    #ir-view{ position:fixed; inset:0; z-index:9500; display:flex; flex-direction:column; direction:rtl;
      background:var(--bg-tertiary,#e9eef3); }
    .ir-strip{ flex:none; display:flex; align-items:center; justify-content:space-between; gap:10px;
      padding:8px 14px; background:var(--bg-card,#fff); border-bottom:1px solid var(--border,#ddd);
      box-shadow:0 2px 10px rgba(0,0,0,.08); font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; }
    .ir-strip-r, .ir-strip-l{ display:flex; align-items:center; gap:8px; min-width:0; }
    .ir-strip .btn{ display:inline-flex; align-items:center; gap:5px; white-space:nowrap; }
    .ir-strip-tt{ display:flex; flex-direction:column; line-height:1.5; min-width:0; }
    .ir-strip-t{ font-weight:700; font-size:13pt; color:var(--accent,#0369a1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .ir-state{ font-size:9.5pt; color:var(--text-muted,#64748b); white-space:nowrap; }
    .ir-state[data-state="dirty"]{ color:#b45309; font-weight:700; }
    .ir-state[data-state="saved"]{ color:var(--green,#16a34a); }
    .ir-chip{ font-size:10.5pt; border:1px solid var(--accent,#0369a1); color:var(--accent,#0369a1); border-radius:999px;
      padding:0 10px 3px; white-space:nowrap; }
    .ir-scroll{ flex:1; min-height:0; overflow:auto; -webkit-overflow-scrolling:touch; }
    .ir-zoom{ width:8.27in; margin:0 auto; }

    #ir-doc{ width:8.27in; min-height:11.69in; box-sizing:border-box; padding:1cm 1in 1cm 0.4in; margin:0 auto;
      background:#fff; color:#000; direction:rtl; text-align:right; position:relative;
      font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; font-size:14pt; line-height:1.75;
      box-shadow:0 1px 3px rgba(0,0,0,.12), 0 8px 28px rgba(0,0,0,.14); }
    #ir-doc *{ box-sizing:border-box; }
    /* موبائل کا عام قاعدہ (mobile.css: ہر contenteditable 16px — iOS zoom سے بچاؤ) کاغذ پر نہیں:
       14pt (18.67px) پہلے ہی 16px سے بڑا ہے؛ ورنہ موبائل پر ناپ بدل کر چھپائی دو صفحے بن جاتی */
    #ir-doc [contenteditable="true"]{ font-size:inherit !important; }
    #ir-doc bdi[dir="ltr"], #ir-doc [dir="ltr"]{ font-family:'Times New Roman',Times,'Liberation Serif',serif; }
    #ir-doc .ir-f{ outline:none; min-height:1.75em; direction:rtl; unicode-bidi:isolate; overflow-wrap:anywhere; }
    #ir-doc .ir-f:focus, #ir-doc .ir-fi:focus{ background:rgba(56,189,248,0.10); border-radius:3px; }
    @media screen{ #ir-doc .ir-f:empty, #ir-doc .ir-fi:empty{ background:rgba(56,189,248,0.11); border-radius:3px; } }
    #ir-doc .ir-f:empty::before, #ir-doc .ir-fi:empty::before{ content:'\\200b'; }

    /* سطر 1 — درخواستیں / نقشہ موقع / سزا سلپ کا ہو بہو اصول: تھانہ دائیں کنارے پر،
       ضلع بائیں سے 1cm اندر، 14pt، line-height 1.9، لیبل اور قیمت دونوں سادہ (bold نہیں) */
    #ir-doc .ir-title-row{ display:flex; align-items:baseline; justify-content:space-between; width:100%; font-size:14pt; line-height:1.9; }
    #ir-doc .ir-tt-right{ text-align:right; white-space:nowrap; font-weight:normal; }
    #ir-doc .ir-tt-left{ text-align:left; white-space:nowrap; margin-left:1cm; font-weight:normal; }
    #ir-doc .ir-fi{ display:inline-block; min-width:24px; outline:none; direction:rtl; unicode-bidi:isolate; font-weight:normal; }

    /* مرکزی عنوان — 20pt، درمیان میں، نیچے لکیر */
    #ir-doc .ir-head{ text-align:center; margin:0.12in 0 0.14in; }
    #ir-doc .ir-title{ display:inline-block; min-width:2in; font-size:20pt !important; font-weight:bold;
      text-decoration:underline; text-underline-offset:7pt; line-height:1.7; text-align:center; }

    /* جدول — دائیں عنوان، بائیں قیمت */
    #ir-doc .ir-table{ width:100%; border-collapse:collapse; table-layout:fixed; }
    #ir-doc .ir-c1{ width:2.8in; }
    #ir-doc .ir-table th, #ir-doc .ir-table td{ border:1px solid #000; padding:1pt 6pt 2pt; vertical-align:middle; font-size:14pt; }
    /* جدول کی سطریں سمٹی ہوئی (Nastaleeq کے لیے کافی 1.6) — عام رپورٹ پورے 14pt پر ایک صفحہ */
    #ir-doc .ir-table td, #ir-doc .ir-table th{ line-height:1.6; }
    #ir-doc .ir-table .ir-f{ min-height:1.6em; }
    #ir-doc .ir-table th{ font-weight:bold; text-align:right; white-space:normal; line-height:1.6; background:#f3f5f8; }
    #ir-doc .ir-cell{ position:relative; }
    #ir-doc .ir-detail-row td{ vertical-align:top; padding:3pt 8pt 4pt; }
    #ir-doc .ir-detail{ min-height:var(--ir-dmin,1.6in); text-align:justify; text-align-last:right; line-height:1.85; }

    /* مقام کے نیچے Lat/Long */
    #ir-doc .ir-llrow{ display:flex; align-items:baseline; gap:5pt; font-size:11pt; line-height:1.6; border-top:1px dotted #9aa5b1; }
    #ir-doc .ir-lll{ font-weight:bold; white-space:nowrap; }
    #ir-doc .ir-lle{ font-size:10.5pt; white-space:nowrap; }
    #ir-doc .ir-ll{ flex:1; min-height:1.5em; font-size:11pt !important; direction:ltr; text-align:left; unicode-bidi:isolate;
      font-family:'Times New Roman',Times,serif; }
    #ir-doc .ir-map{ font-size:10.5pt; color:#0369a1; white-space:nowrap; }

    /* ▾ انتخاب / 📅 / 📍 — صرف سکرین پر، کاغذ کے بائیں حاشیے میں */
    #ir-doc .ir-pick{ position:absolute; left:-0.36in; top:2pt; width:24px; height:24px; line-height:22px; border-radius:5px;
      background:#0369a1; color:#fff; font-size:13px; font-weight:700; text-align:center; cursor:pointer; overflow:hidden;
      border:0; padding:0; display:inline-grid; place-items:center; font-family:Arial,sans-serif; }
    #ir-doc .ir-pick select, #ir-doc .ir-pick input{ position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:pointer; border:0; padding:0; }

    /* آخری حصہ — بائیں جانب */
    #ir-doc .ir-end{ display:flex; justify-content:flex-end; margin-top:0.22in; }
    #ir-doc .ir-endbox{ width:3.6in; text-align:center; }
    #ir-doc .ir-closing{ text-align:right; }
    #ir-doc .ir-signbox{ height:0.75in; display:flex; align-items:flex-end; justify-content:center; }
    #ir-doc .ir-signbox img{ max-height:0.75in; max-width:2.6in; object-fit:contain; }
    @media screen{ #ir-doc .ir-signbox:empty{ border:1px dashed #b6c2cf; border-radius:6px; } }
    #ir-doc .ir-signbtns{ display:flex; gap:6px; justify-content:center; flex-wrap:wrap; margin:3pt 0; }
    #ir-doc .ir-signbtns button, #ir-doc .ir-signbtns label{ font-family:inherit; font-size:10.5pt; line-height:1.9; padding:0 9px 3px;
      border:1px solid #0369a1; color:#0369a1; background:#fff; border-radius:6px; cursor:pointer; position:relative; overflow:hidden; }
    #ir-doc .ir-signbtns input{ position:absolute; inset:0; opacity:0; cursor:pointer; }
    #ir-doc .ir-sholine{ font-weight:bold; text-align:center; }
    #ir-doc .ir-signdate{ text-align:center; font-size:12pt !important; }

    /* ── Desktop: کاغذ کے اوپر/نیچے ہلکا وقفہ (پیشہ ورانہ منظر) ── */
    @media screen and (min-width:761px){
      .ir-scroll{ padding:14px 0 24px; }
    }
    /* ── Mobile: پٹی دو قطاروں میں صاف؛ «موبائل منظر» = پوری چوڑائی، کوئی خالی جگہ نہیں ── */
    @media screen and (max-width:760px){
      .ir-strip{ flex-wrap:wrap; padding:6px 8px; gap:6px; }
      .ir-strip-r{ flex:1 1 100%; }
      .ir-strip-l{ flex:1 1 100%; overflow-x:auto; scrollbar-width:none; padding-bottom:1px; }
      .ir-strip-l::-webkit-scrollbar{ display:none; }
      .ir-strip-l .btn{ flex:0 0 auto; padding:4px 10px; }
      .ir-strip .ir-chip{ margin-inline-start:auto; }
      #ir-view:not(.ir-a4){ background:#fff; }
      #ir-view:not(.ir-a4) .ir-scroll{ background:#fff; }
      #ir-view:not(.ir-a4) .ir-zoom{ width:100%; zoom:1 !important; }
      #ir-view:not(.ir-a4) #ir-doc{ width:100%; min-height:100%; padding:12px 12px 28px; box-shadow:none; }
      #ir-view:not(.ir-a4) #ir-doc .ir-c1{ width:33%; }
      #ir-view:not(.ir-a4) #ir-doc .ir-table th, #ir-view:not(.ir-a4) #ir-doc .ir-table td{ padding:2pt 5pt 3pt; }
      #ir-view:not(.ir-a4) #ir-doc .ir-cell.has-pick{ padding-left:30px; }
      #ir-view:not(.ir-a4) #ir-doc .ir-pick{ left:0; top:3px; width:26px; height:26px; }
      #ir-view:not(.ir-a4) #ir-doc .ir-llrow{ flex-wrap:wrap; }
      #ir-view:not(.ir-a4) #ir-doc .ir-ll{ flex:1 1 100%; white-space:nowrap; }
      /* اہم بٹن پہلے نظر آئیں: محفوظ، پھر پرنٹ (باقی سرکا کر) */
      .ir-strip-l .btn-primary{ order:-2; }
      .ir-strip-l [data-dio-print]{ order:-1; }
      #ir-view:not(.ir-a4) #ir-doc .ir-detail{ min-height:7em; }
      #ir-view:not(.ir-a4) #ir-doc .ir-endbox{ width:auto; min-width:60%; }
      #ir-view.ir-a4 .ir-scroll{ padding:10px 0; }
    }

    /* ── چھپائی: ہمیشہ A4 · مارجن کاغذ کے اندر (padding) · صرف کاغذ ── */
    @page{ size:A4 portrait; margin:0; }
    @media print{
      html, body{ background:#fff !important; }
      .ir-strip, .no-print, .ir-pick, .ir-signbtns, .ir-map{ display:none !important; }
      #ir-view{ position:static !important; display:block !important; background:#fff !important; }
      .ir-scroll{ overflow:visible !important; height:auto !important; padding:0 !important; }
      .ir-zoom{ zoom:1 !important; width:auto !important; margin:0 !important; }
      #ir-doc{ box-shadow:none !important; margin:0 !important; min-height:0 !important; zoom:var(--ir-pz,1); }
      #ir-doc .ir-f:empty, #ir-doc .ir-fi:empty, #ir-doc .ir-f:focus, #ir-doc .ir-signbox:empty{ background:none !important; border:0 !important; }
      #ir-doc .ir-table th{ background:#f3f5f8 !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    }`;
}

/* ── سکرین پر پورا کاغذ — ناپ نہیں بدلتی، صرف zoom (موبائل منظر میں zoom نہیں) ── */
let _irA4View = false;   // موبائل پر: false = موبائل منظر (پوری چوڑائی) · true = A4 کاغذ
function _irFit() {
  const sc = document.getElementById('ir-scroll');
  const z = document.getElementById('ir-zoom');
  const v = document.getElementById('ir-view');
  if (!sc || !z) return;
  if (v && !v.classList.contains('ir-a4')) { z.style.zoom = '1'; return; }
  const pageW = 8.27 * IR_PX_IN + 8;
  const avail = sc.clientWidth;
  const k = (avail > 0 && avail < pageW) ? Math.max(0.3, avail / pageW) : 1;
  z.style.zoom = String(Math.floor(k * 1000) / 1000);
}
window._irFit = _irFit;
function _irToggleView() {
  _irA4View = !_irA4View;
  const v = document.getElementById('ir-view');
  if (v) v.classList.toggle('ir-a4', !_irPhone() || _irA4View);
  const b = document.querySelector('#ir-view-btn span');
  if (b) b.textContent = _irA4View ? 'موبائل منظر' : 'A4 منظر';
  _irFit();
  _irBalance();
}
window._irToggleView = _irToggleView;

/* ── صفحہ متوازن: آخری (مختصر حالات) خانہ بچی ہوئی جگہ لے (کاغذ پورا بھرا لگے)؛
      مواد زیادہ ہو تو چھپائی خود چھوٹی (--ir-pz) — ہمیشہ ایک صفحہ۔
      ناپ ہمیشہ A4 والی ترتیب میں (موبائل منظر میں بھی) — تاکہ چھپائی درست رہے ── */
let _irBalT = null;
function _irBalanceSoon() { clearTimeout(_irBalT); _irBalT = setTimeout(_irBalance, 250); }
function _irBalance() {
  const doc = document.getElementById('ir-doc');
  const inner = document.getElementById('ir-inner');
  const z = document.getElementById('ir-zoom');
  const v = document.getElementById('ir-view');
  if (!doc || !inner) return;
  const prev = z ? z.style.zoom : '';
  const wasA4 = v ? v.classList.contains('ir-a4') : true;
  if (v && !wasA4) v.classList.add('ir-a4');
  if (z) z.style.zoom = '1';
  const base = 1.6 * IR_PX_IN;
  doc.style.setProperty('--ir-dmin', base + 'px');
  // سکرین کے بٹن (دستخط) چھپائی میں نہیں — ناپ سے نکالو
  const btns = inner.querySelector('.ir-signbtns');
  const bH = btns ? btns.getBoundingClientRect().height : 0;
  const h = inner.getBoundingClientRect().height - bH;
  const availH = IR_AVAIL_H_IN * IR_PX_IN;
  const spare = Math.floor(availH * 0.985 - h);
  // خانے کی اصل اونچائی (متن لمبا ہو تو 1.6in سے زیادہ) + بچی جگہ — تاکہ کاغذ ہمیشہ پورا بھرے
  const det = inner.querySelector('.ir-detail');
  const detH = det ? det.getBoundingClientRect().height : base;
  if (spare > 0) doc.style.setProperty('--ir-dmin', Math.floor(Math.max(base, detH) + spare) + 'px');
  const pz = h > availH * 0.99 ? Math.max(0.7, Math.floor((availH * 0.99 / h) * 1000) / 1000) : 1;
  doc.style.setProperty('--ir-pz', String(pz));
  if (v && !wasA4) v.classList.remove('ir-a4');
  if (z) z.style.zoom = prev;
}
window._irBalance = _irBalance;

/* ═════════════ خانوں کے اوزار ═════════════ */
function _irCell(k) { return document.querySelector('#ir-doc [data-k="' + k + '"]'); }
function _irSetCell(k, html) {
  const el = _irCell(k);
  if (!el) return;
  el.innerHTML = html;
  _irIsolateNums(el);
  _irMarkDirty(true); _irDraftSoon();
  _irBalanceSoon();
}
function _irSetDt(k, v) {
  if (!v) return;
  _irMeta[k + '_iso'] = v;
  _irSetCell(k, _irDtHtml(v));
}
window._irSetDt = _irSetDt;
function _irPickNature(sel) {
  const v = sel.value;
  sel.value = '';
  if (!v) return;
  _irSetCell('nature', _irE(v));
}
window._irPickNature = _irPickNature;
function _irPickPtype(sel) {
  let v = sel.value;
  if (v === '__new') {
    v = (prompt('نئی حیثیت درج کریں (مثلاً: مقتول، مضروب):') || '').trim();
    if (!v) { sel.value = _irMeta.person_type || 'متاثرہ'; return; }
    const opt = document.createElement('option');
    opt.textContent = v; opt.selected = true;
    sel.insertBefore(opt, sel.lastElementChild);
  }
  _irMeta.person_type = v;
  const l = document.getElementById('ir-ptype-l');
  if (l) l.textContent = v;
  _irMarkDirty(true); _irDraftSoon();
}
window._irPickPtype = _irPickPtype;

/* ── مقام: GPS سے Lat/Long (خود) — قابلِ ترمیم ── */
function _irGetLocation(silent) {
  if (!navigator.geolocation) { if (!silent) _irToast('اس آلے پر مقام کی سہولت نہیں', 'error'); return; }
  if (!silent) _irToast('مقام لیا جا رہا ہے…', 'info', 2500);
  navigator.geolocation.getCurrentPosition(p => {
    if (!document.getElementById('ir-doc')) return;
    _irMeta.lat = +p.coords.latitude.toFixed(6);
    _irMeta.lng = +p.coords.longitude.toFixed(6);
    _irMeta.loc_acc = Math.round(p.coords.accuracy || 0);
    const el = _irCell('latlng');
    if (el) el.textContent = _irLatLngText(_irMeta.lat, _irMeta.lng);
    _irMapLink();
    _irMarkDirty(true); _irDraftSoon();
    if (!silent) _irToast('مقام (Lat/Long) درج ہو گیا' + (_irMeta.loc_acc ? ` — درستگی تقریباً ${_irMeta.loc_acc} میٹر` : ''), 'success');
  }, err => {
    if (silent) return;
    const m = err && err.code === 1 ? 'مقام کی اجازت نہیں دی گئی — براؤزر کی ترتیبات میں اجازت دیں، یا Lat/Long خود لکھیں'
      : 'مقام نہیں مل سکا — Lat/Long خود لکھ دیں';
    _irToast(m, 'error', 5000);
  }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
}
window._irGetLocation = _irGetLocation;

// «نقشہ» کا لنک (صرف سکرین پر) — Lat/Long کے ساتھ تازہ
function _irMapLink() {
  const row = document.querySelector('#ir-doc .ir-llrow');
  if (!row) return;
  const t = _irLatLngText(_irMeta.lat, _irMeta.lng);
  let a = row.querySelector('.ir-map');
  if (!t) { if (a) a.remove(); return; }
  if (!a) { row.insertAdjacentHTML('beforeend', '<a class="ir-map no-print" target="_blank" rel="noopener">نقشہ</a>'); a = row.querySelector('.ir-map'); }
  a.href = 'https://maps.google.com/?q=' + encodeURIComponent(t);
}

/* ── مقدمہ سے ڈیٹا (سسٹم سے) ── */
async function _irPickCase() {
  let cases = [];
  try { cases = (typeof getCases === 'function') ? (await getCases()) || [] : []; } catch (e) { console.warn('ir cases:', e && e.message); }
  if (!cases.length) { _irToast('کوئی مقدمہ نہیں ملا', 'info'); return; }
  window._irCaseRows = cases;
  const opts = cases.map((c, i) => `<option value="${i}">${_irE(`${c.fir_number || '—'} — ${c.offence_type || ''} ${c.section_of_law || ''} — ${c.complainant || ''}`.replace(/\s+/g, ' ').trim().slice(0, 120))}</option>`).join('');
  openModal('مقدمہ سے ڈیٹا',
    `<div style="direction:rtl;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;font-size:14pt;line-height:2;">
      <select id="ir-case-sel" class="form-input" style="width:100%;font-family:inherit;font-size:13pt;">${opts}</select>
      <div style="font-size:11pt;color:var(--text-muted);margin-top:6px;">نوعیت وقوعہ، تاریخ وقوعہ، جائے وقوعہ، اطلاع دہندہ (مدعی) اور ملزمان اس مقدمے سے بھرے جائیں گے — بعد میں ہر خانہ قابلِ ترمیم۔</div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">بند کریں</button>
     <button class="btn btn-primary" onclick="_irApplyCase()">ڈیٹا لائیں</button>`);
}
window._irPickCase = _irPickCase;

async function _irApplyCase() {
  const sel = document.getElementById('ir-case-sel');
  const c = sel && window._irCaseRows ? window._irCaseRows[parseInt(sel.value, 10)] : null;
  if (typeof closeModal === 'function') closeModal();
  if (!c) return;
  // ملزمان — case_accused (FIR والے پہلے) · نہ ملیں تو مقدمے کا اپنا خانہ
  let names = [];
  try {
    const { data, error } = await supabaseClient.from('case_accused').select('name,accused_type,created_at')
      .eq('case_id', c.id).order('created_at', { ascending: true });
    if (error) throw error;
    const rows = data || [];
    const fir = rows.filter(a => !a.accused_type || a.accused_type === 'fir');
    names = (fir.length ? fir : rows).map(a => String(a.name || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
  } catch {
    try { names = (JSON.parse(localStorage.getItem('dio_accused_' + c.id) || '[]') || []).map(a => String(a.name || '').trim()).filter(Boolean); }
    catch { names = []; }
  }
  if (!names.length && c.accused_name) names = [String(c.accused_name).trim()];

  const nature = [c.offence_type, c.section_of_law].map(x => String(x || '').trim()).filter(Boolean).join(' — ');
  if (nature) _irSetCell('nature', _irE(nature));
  const occ = _irIsoDate(c.occurrence_date) || '';
  if (occ) { _irMeta.occ_iso = occ; _irSetCell('occ', _irDtHtml(occ)); }
  if (c.occurrence_place) _irSetCell('place', _irE(String(c.occurrence_place).trim()));
  if (c.complainant) _irSetCell('caller', _irE(String(c.complainant).replace(/\s+/g, ' ').trim()));
  if (names.length) {
    const list = names.length === 1 ? _irE(names[0]) : names.map((n, i) => `<bdi dir="ltr">${i + 1}</bdi>۔ ${_irE(n)}`).join('<br>');
    _irSetCell('accused', `${list}<br>تعداد: <bdi dir="ltr">${names.length}</bdi>`);
  }
  _irMeta.case_id = c.id;
  _irMeta.fir_number = c.fir_number || '';
  const t = document.getElementById('ir-strip-t');
  if (t && !document.querySelector('.ir-chip')) t.insertAdjacentHTML('afterend', `<span class="ir-chip">مقدمہ <bdi dir="ltr">${_irE(_irMeta.fir_number)}</bdi></span>`);
  _irToast('مقدمے کا ڈیٹا آ گیا — دیکھ کر ضرورت ہو تو ترمیم کریں', 'success');
}
window._irApplyCase = _irApplyCase;

/* ═════════════ SHO دستخط ═════════════ */
// قانونی تنبیہ — کسی دوسرے کے دستخط بغیر اجازت لگانا جعلسازی کے زمرے میں آ سکتا ہے
function _irSignWarnOk() {
  return confirm('قانونی تنبیہ:\nیہ دستخط صرف متعلقہ SHO کی اپنی رضامندی/اجازت سے لگائیں۔\n' +
    'کسی دوسرے افسر کے دستخط بغیر اجازت لگانا جعلسازی کے زمرے میں آ سکتا ہے (تعزیراتِ پاکستان دفعات 463 تا 471)۔\n\nکیا اجازت موجود ہے؟');
}
function _irApplySign(dataUrl, remember) {
  _irMeta.sho_sign = dataUrl;
  if (remember) { try { localStorage.setItem(IR_SIGN_KEY, dataUrl); } catch { /* جگہ نہ ہو — صرف اسی رپورٹ میں */ } }
  _irMarkDirty(true); _irDraftSoon();
  _irRefreshSign();
}
function _irRefreshSign() {
  const box = document.getElementById('ir-signbox');
  if (box) box.innerHTML = _irMeta.sho_sign ? `<img alt="SHO دستخط" src="${_irE(_irMeta.sho_sign)}">` : '';
  const btns = document.querySelector('#ir-doc .ir-signbtns');
  if (btns) {
    let stored = false;
    try { stored = !!localStorage.getItem(IR_SIGN_KEY); } catch { stored = false; }
    btns.innerHTML = `<button type="button" onclick="_irSignPad()">دستخط بنائیں</button>
      <label>تصویر لگائیں<input type="file" accept="image/*" onchange="_irSignFile(this)"></label>
      ${stored && !_irMeta.sho_sign ? '<button type="button" onclick="_irSignStored()">محفوظ دستخط</button>' : ''}
      ${_irMeta.sho_sign ? '<button type="button" onclick="_irSignClear()">ہٹائیں</button>' : ''}`;
  }
  _irBalanceSoon();
}
function _irSignClear() { _irMeta.sho_sign = ''; _irMarkDirty(true); _irRefreshSign(); }
window._irSignClear = _irSignClear;
function _irSignStored() {
  let s = '';
  try { s = localStorage.getItem(IR_SIGN_KEY) || ''; } catch { s = ''; }
  if (!s) { _irToast('کوئی محفوظ دستخط نہیں', 'info'); return; }
  if (!_irSignWarnOk()) return;
  _irApplySign(s, false);
}
window._irSignStored = _irSignStored;
function _irSignFile(inp) {
  const file = inp && inp.files && inp.files[0];
  if (inp) inp.value = '';
  if (!file) return;
  if (!/^image\//.test(file.type)) { _irToast('صرف تصویر (PNG/JPG) لگائیں', 'error'); return; }
  if (!_irSignWarnOk()) return;
  const rd = new FileReader();
  rd.onload = () => {
    const img = new Image();
    img.onload = () => {
      // چھوٹا کر کے (زیادہ سے زیادہ 600px) — ڈیٹابیس ہلکا رہے
      const k = Math.min(1, 600 / Math.max(img.width, img.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      _irApplySign(cv.toDataURL('image/png'), true);
      _irToast('دستخط لگ گئے', 'success');
    };
    img.onerror = () => _irToast('تصویر نہیں کھل سکی', 'error');
    img.src = rd.result;
  };
  rd.readAsDataURL(file);
}
window._irSignFile = _irSignFile;

let _irPadCtx = null, _irPadInk = false;
function _irSignPad() {
  openModal('SHO دستخط',
    `<div style="direction:rtl;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;font-size:12pt;line-height:2;">
      <div style="color:#b45309;font-weight:700;">صرف متعلقہ SHO کی اجازت سے — کسی دوسرے کے دستخط بغیر اجازت لگانا جعلسازی کے زمرے میں آ سکتا ہے (تعزیراتِ پاکستان دفعات 463 تا 471)۔</div>
      <div style="color:var(--text-muted);font-size:11pt;">نیچے خانے میں انگلی یا ماؤس سے دستخط کریں۔</div>
      <canvas id="ir-pad" width="600" height="200" style="width:100%;height:auto;aspect-ratio:3/1;background:#fff;border:1.5px dashed #94a3b8;border-radius:8px;touch-action:none;cursor:crosshair;display:block;"></canvas>
      <label style="display:flex;gap:8px;align-items:center;margin-top:6px;font-size:11.5pt;"><input type="checkbox" id="ir-pad-ok"> متعلقہ SHO کی اجازت موجود ہے</label>
    </div>`,
    `<button class="btn btn-secondary" onclick="_irPadClear()">صاف کریں</button>
     <button class="btn btn-secondary" onclick="closeModal()">بند کریں</button>
     <button class="btn btn-primary" onclick="_irPadApply()">دستخط لگائیں</button>`);
  setTimeout(_irPadInit, 30);
}
window._irSignPad = _irSignPad;
function _irPadInit() {
  const cv = document.getElementById('ir-pad');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0b1f4a';
  _irPadCtx = ctx; _irPadInk = false;
  let down = false;
  const pt = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; };
  cv.addEventListener('pointerdown', e => { down = true; try { cv.setPointerCapture(e.pointerId); } catch { /* پرانا براؤزر */ } const p = pt(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); });
  cv.addEventListener('pointermove', e => { if (!down) return; const p = pt(e); ctx.lineTo(p.x, p.y); ctx.stroke(); _irPadInk = true; e.preventDefault(); });
  const up = () => { down = false; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('pointerleave', up);
}
function _irPadClear() {
  const cv = document.getElementById('ir-pad');
  if (cv && _irPadCtx) { _irPadCtx.clearRect(0, 0, cv.width, cv.height); _irPadInk = false; }
}
window._irPadClear = _irPadClear;
function _irPadApply() {
  const cv = document.getElementById('ir-pad');
  if (!cv || !_irPadInk) { _irToast('پہلے خانے میں دستخط کریں', 'info'); return; }
  const ok = document.getElementById('ir-pad-ok');
  if (!ok || !ok.checked) { _irToast('پہلے تصدیق کریں کہ متعلقہ SHO کی اجازت موجود ہے', 'error', 4000); return; }
  // خالی کنارے کاٹ دو
  const ctx = cv.getContext('2d');
  const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
  let x0 = cv.width, y0 = cv.height, x1 = 0, y1 = 0;
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
    if (d[(y * cv.width + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
  }
  const pad = 6;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(cv.width, x1 + pad); y1 = Math.min(cv.height, y1 + pad);
  const out = document.createElement('canvas');
  out.width = Math.max(1, x1 - x0); out.height = Math.max(1, y1 - y0);
  out.getContext('2d').drawImage(cv, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  if (typeof closeModal === 'function') closeModal();
  _irApplySign(out.toDataURL('image/png'), true);
  _irToast('دستخط لگ گئے', 'success');
}
window._irPadApply = _irPadApply;

/* ═════════════ جمع / محفوظ ═════════════ */
function _irCollect(noIso) {
  const f = {};
  // مسودہ (لکھتے لکھتے) میں نہیں — ورنہ کرسر کود جائے؛ محفوظ/چھپائی پر ہاں
  if (!noIso) _irIsolateNums(document.getElementById('ir-doc'));
  document.querySelectorAll('#ir-doc [data-k]').forEach(el => {
    f[el.dataset.k] = _irPlain(el.innerHTML) ? el.innerHTML : '';
  });
  return f;
}
function _irBuildRecord(f) {
  const p = k => _irPlain(f[k] || '');
  const now = new Date().toISOString();
  // تاریخ وقوعہ (DD/MM/YYYY) — چنی ہوئی؛ ورنہ لکھی ہوئی میں سے پہلی تاریخ
  const occIso = _irMeta.occ_iso || _irIsoDate(p('occ'));
  const ll = _irParseLatLng(p('latlng'));
  if (ll) { _irMeta.lat = ll.lat; _irMeta.lng = ll.lng; } else if (!p('latlng')) { delete _irMeta.lat; delete _irMeta.lng; }
  const data = {
    _form: IR_FORM, f,
    occ_iso: _irMeta.occ_iso || '', info_iso: _irMeta.info_iso || '',
    lat: _irMeta.lat, lng: _irMeta.lng, loc_acc: _irMeta.loc_acc,
    person_type: _irMeta.person_type || 'متاثرہ',
    sho_sign: _irMeta.sho_sign || '',
    case_id: _irMeta.case_id || null, fir_number: _irMeta.fir_number || '',
    saved_at: now,
    // پرانے فارم والے نام بھی (حذف شدہ مواد / بیک اپ / پرانا کوڈ پڑھ سکے)
    severity: p('nature'), caller_name: p('caller'), person_name: p('victim'),
    place: p('place'), datetime: p('occ'), accused: p('accused'),
    officers: p('responder') ? [p('responder')] : [], sign_date: p('sign_date'),
  };
  return {
    report_number: (_irCur && _irCur.report_number) || ('IR-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-6)),
    incident_type: p('nature').slice(0, 300),
    incident_date: occIso ? _irDmy(occIso) : '',
    address: p('place').slice(0, 500),
    narrative: p('detail'),
    action_taken: p('accused').slice(0, 1000),
    data,
  };
}

// ڈیٹابیس کا لکھنا — کالم کی قسم/موجودگی پر خود سنبھلے (schema نہیں بدلا)
async function _irDb(kind, rec, id) {
  let r = { ...rec };
  for (let i = 0; i < 5; i++) {
    const t = supabaseClient.from('incident_reports');
    const q = kind === 'insert' ? t.insert(r).select().maybeSingle() : t.update(r).eq('id', id).select().maybeSingle();
    const { data, error } = await q;
    if (!error) return data;
    const msg = String(error.message || ''), code = String(error.code || '');
    const mc = msg.match(/Could not find the '([a-z_]+)' column/i) || msg.match(/column "?([a-z_]+)"? of relation/i) || msg.match(/column "?[a-z_]*\.?([a-z_]+)"? does not exist/i);
    if ((code === '42703' || code === 'PGRST204') && mc && mc[1] in r && !['officer_id', 'data', 'report_number'].includes(mc[1])) { delete r[mc[1]]; continue; }
    if (['22007', '22008', '22P02'].includes(code) && 'incident_date' in r) {
      const iso = _irIsoDate(r.incident_date);
      if (iso && iso !== r.incident_date) { r.incident_date = iso; continue; }
      delete r.incident_date; continue;
    }
    if (code === '23502' && /incident_date/.test(msg)) { r.incident_date = _irIsoDate(_irNowIso()); continue; }
    throw error;
  }
  throw new Error('محفوظ نہیں ہو سکا');
}
function _irIsNetErr(e) {
  if (!navigator.onLine) return true;
  const m = String((e && (e.message || e.details)) || e || '');
  return /Failed to fetch|NetworkError|Load failed|network|timeout|ERR_NAME|ERR_INTERNET/i.test(m);
}
function _irPutInList(rec) {
  const i = _irList.findIndex(x => String(x.id) === String(rec.id));
  if (i >= 0) _irList[i] = rec; else _irList.unshift(rec);
  _irList.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  _irStoreLocal();
}

// سرور پر: نئی → insert · پرانی → update (update کی اجازت نہ ہو تو نئی + پرانی حذف)
async function _irPush(rec, cur) {
  const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
  if (!oid) throw new Error(navigator.onLine ? 'لاگ ان مکمل نہیں — دوبارہ کوشش کریں' : 'Failed to fetch');
  const full = { ...rec, officer_id: oid };
  const isTmp = !cur || !cur.id || String(cur.id).indexOf('tmp_') === 0;
  if (!isTmp) {
    const up = await _irDb('update', full, cur.id);
    if (up) return up;
    // update پر روک (پرانی policy) — نئی بنا کر پرانی ہٹا دو؛ نمبر وہی رہے
    const ins = await _irDb('insert', full);
    try { await supabaseClient.from('incident_reports').delete().eq('id', cur.id); }
    catch (e) { console.warn('ir old delete:', e && e.message); }
    return ins || { ...full, id: cur.id };
  }
  const ins = await _irDb('insert', full);
  if (!ins) throw new Error('محفوظ ہوا مگر واپس نہیں پڑھا جا سکا — فہرست تازہ کریں');
  return ins;
}

async function _irSave() {
  if (!document.getElementById('ir-doc')) return;
  if (window.DIO && DIO.sub && typeof DIO.sub.guard === 'function' && !DIO.sub.guard('محفوظ کرنا')) return;
  const f = _irCollect();
  if (!_irPlain(f.nature) && !_irPlain(f.detail).replace(IR_DETAIL_OPEN, '').trim()) {
    _irToast('نوعیت وقوعہ یا مختصر حالات لکھیں — خالی رپورٹ محفوظ نہیں ہو گی', 'error', 4000); return;
  }
  const rec = _irBuildRecord(f);
  const cur = _irCur;
  try {
    const saved = await _irPush(rec, cur);
    delete saved._pending;
    if (cur && String(cur.id) !== String(saved.id)) _irList = _irList.filter(x => String(x.id) !== String(cur.id));
    _irCur = saved;
    _irPutInList(saved);
    _irMarkDirty(false); _irDraftClear();
    _irUpdateTitle();
    _irToast('واقعاتی رپورٹ محفوظ ہو گئی', 'success');
  } catch (e) {
    if (_irIsNetErr(e)) {
      const now = new Date().toISOString();
      const local = { ...(cur || {}), ...rec, id: (cur && cur.id) || ('tmp_' + Date.now()),
        created_at: (cur && cur.created_at) || now, _pending: true };
      _irCur = local;
      _irPutInList(local);
      _irMarkDirty(false); _irDraftClear();
      _irUpdateTitle();
      _irToast('آف لائن محفوظ — انٹرنیٹ آنے پر خود سرور پر چلی جائے گی', 'info', 5000);
    } else {
      _irToast('محفوظ نہیں ہو سکی: ' + ((e && e.message) || e), 'error', 6000);
      console.error('ir save:', e);
    }
  }
}
window._irSave = _irSave;

let _irSyncing = false;
async function _irSyncPending() {
  if (_irSyncing || !navigator.onLine) return;
  const pend = _irList.filter(x => x._pending);
  if (!pend.length) return;
  _irSyncing = true;
  let n = 0;
  try {
    for (const p of pend) {
      const rec = { report_number: p.report_number, incident_type: p.incident_type, incident_date: p.incident_date,
        address: p.address, narrative: p.narrative, action_taken: p.action_taken, data: p.data };
      try {
        const saved = await _irPush(rec, p);
        delete saved._pending;
        _irList = _irList.filter(x => String(x.id) !== String(p.id));
        _irList.push(saved);
        if (_irCur && String(_irCur.id) === String(p.id)) _irCur = saved;
        n++;
      } catch (e) { console.warn('ir sync:', e && e.message); if (_irIsNetErr(e)) break; }
    }
  } finally { _irSyncing = false; }
  if (n) {
    _irList.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
    _irStoreLocal();
    _irToast(`${n} واقعاتی رپورٹ سرور پر محفوظ ہو گئی`, 'success');
    if (!document.getElementById('ir-view') && window._activePage === 'incident') {
      const b = document.getElementById('ir-list-body');
      if (b) b.innerHTML = _irListRows();
    }
  }
}
window.addEventListener('online', () => { setTimeout(_irSyncPending, 1500); });

function _irUpdateTitle() {
  const t = document.getElementById('ir-strip-t');
  if (!t || !_irCur) return;
  const i = _irList.findIndex(x => String(x.id) === String(_irCur.id));
  if (i >= 0) t.textContent = 'واقعاتی رپورٹ #' + (_irList.length - i);
  // حذف کا بٹن (اب محفوظ ہے)
  const grp = document.querySelector('.ir-strip-l');
  const onc = `_irDelete('${_irE(String(_irCur.id))}')`;
  const d = grp && grp.querySelector('.ir-del');
  if (grp && !d) grp.insertAdjacentHTML('beforeend', `<button type="button" class="btn btn-danger btn-sm ir-del" onclick="${onc}" title="حذف" aria-label="حذف">${IR_ICON.del}</button>`);
  else if (d) d.setAttribute('onclick', onc);
  _irMarkDirty(_irDirty);
}

/* ═════════════ حذف ═════════════ */
async function _irDelete(id) {
  const r = _irList.find(x => String(x.id) === String(id));
  if (!r) return;
  if (!confirm('یہ واقعاتی رپورٹ حذف کریں؟ (حذف شدہ مواد میں چلی جائے گی)')) return;
  const isTmp = String(id).indexOf('tmp_') === 0;
  if (!isTmp) {
    if (window.DIO && DIO.sub && typeof DIO.sub.guard === 'function' && !DIO.sub.guard('حذف')) return;
    if (!navigator.onLine) { _irToast('حذف کے لیے انٹرنیٹ درکار ہے', 'error'); return; }
    try {
      const clean = { ...r }; delete clean._pending;
      if (typeof softDelete === 'function') await softDelete('incident', id, clean);
      const { error } = await supabaseClient.from('incident_reports').delete().eq('id', id);
      if (error) throw error;
    } catch (e) { _irToast('حذف نہیں ہو سکی: ' + ((e && e.message) || e), 'error', 5000); return; }
  }
  _irList = _irList.filter(x => String(x.id) !== String(id));
  _irStoreLocal();
  _irToast('رپورٹ حذف ہو گئی', 'info');
  if (document.getElementById('ir-view') && _irCur && String(_irCur.id) === String(id)) _irClose(true);
  else if (window._activePage === 'incident') _irRenderList();
}
window._irDelete = _irDelete;

/* ═════════════ چھپائی / شیئر / ڈاؤن لوڈ ═════════════ */
// صرف براؤزر کی اپنی چھپائی (Ctrl+P جیسی) — صرف کاغذ، کوئی پٹی/بٹن نہیں۔
// پڑھنا اور چھاپنا سبسکرپشن پر بند نہیں (اصول)۔
function _irPrint() {
  if (!document.getElementById('ir-doc')) return;
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  _irBalance();
  window.print();
}
window._irPrint = _irPrint;

function _irTextReport() {
  const f = _irCollect();
  const p = k => _irPlain(f[k] || '');
  const lines = [p('title') || 'واقعاتی رپورٹ', '='.repeat(40), `تھانہ: ${p('thana')}    ضلع: ${p('zila')}`];
  IR_ROWS.forEach(r => {
    const lbl = r.pick === 'ptype' ? `${_irMeta.person_type || 'متاثرہ'} کا نام` : r.l;
    lines.push(`${lbl}: ${p(r.k)}`);
    if (r.loc && p('latlng')) {
      lines.push(`Lat/Long: ${p('latlng')}`);
      const ll = _irParseLatLng(p('latlng'));
      if (ll) lines.push(`نقشہ: https://maps.google.com/?q=${ll.lat},${ll.lng}`);
    }
  });
  lines.push('', p('detail'), '', p('closing'), p('sho_line'), p('sign_date'), '', 'Digital IO');
  return lines.join('\n');
}
function _irShare() {
  if (!document.getElementById('ir-doc')) return;
  const txt = _irTextReport();
  if (navigator.share) { navigator.share({ title: 'واقعاتی رپورٹ', text: txt }).catch(() => { /* افسر نے بند کر دیا */ }); return; }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(() => _irToast('متن نقل ہو گیا — جہاں بھیجنا ہو وہاں چسپاں کریں', 'info'),
      () => _irToast('نقل نہیں ہو سکا', 'error'));
  } else _irToast('اس آلے پر شیئر کی سہولت نہیں — ڈاؤن لوڈ استعمال کریں', 'info');
}
window._irShare = _irShare;
function _irDownload() {
  if (!document.getElementById('ir-doc')) return;
  const f = _irCollect();
  const subj = _irPlain(f.nature || '').replace(/[\\/:*?"<>|\s]+/g, '-').slice(0, 30) || 'Report';
  const date = (_irMeta.occ_iso ? _irDmy(_irMeta.occ_iso) : _irDmy(_irNowIso())).replace(/\//g, '-');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + _irTextReport()], { type: 'text/plain;charset=utf-8' }));
  a.download = `Incident-Report-${date}-${subj}.txt`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  _irToast('رپورٹ ڈاؤن لوڈ ہو رہی ہے — PDF کے لیے «پرنٹ» میں «Save as PDF» چنیں', 'success', 5000);
}
window._irDownload = _irDownload;
