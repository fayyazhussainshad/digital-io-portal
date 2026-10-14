/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — گشت لاگ  (gasht.js · v548)
   ────────────────────────────────────────────────────────────────
   ASI کا حکم (14 اکتوبر 2026): «گشت لاگ دوبارہ بنائیں، پیشہ ورانہ، تمام
   اصول لاگو»۔ پرانا patrol.js (جون 2026، PR #1/#2) موجودہ ایپ کا حصہ نہیں
   تھا — یہ اسی کی جگہ نئے سرے سے، واقعاتی رپورٹ والے جانچے ہوئے ڈھانچے پر:

   • فہرست ملزمان/گواہان/واقعاتی رپورٹ کی طرح — «+ نیا اندراج» سے نیا گشت؛
     جاری گشت اوپر نمایاں (اندراج / کھولیں / گشت ختم کریں)؛ Dashboard کے
     «نیا اندراج» hub میں «گشت» (جاری گشت ہو تو سیدھا اسی کا اندراج)
   • دستاویز «گشت رپورٹ» — پورا صفحہ (full-page)، A4، سرکاری مارجن
     (اوپر/نیچے 1cm، دائیں 0.5in، بائیں 0.4in)؛ لمبی ہو تو اگلے صفحے پر
     (جدول کا سرخی والا حصہ ہر صفحے پر دوبارہ)
     سطر 1: تھانہ (دائیں) · ضلع (بائیں) — باقی دستاویزات کا اصول
     عنوان 20pt · ذیلی عنوان 16pt · متن 14pt (dio-doc-h1/h2 — پورے نظام میں یکساں)
     تفصیل: تاریخ، روانگی، واپسی، دورانیہ (خود)، رپٹ نمبر، علاقہ/روٹ،
     سرکاری گاڑی/ڈرائیور، ہمراہی ملازمان، گشت افسر
     «دورانِ گشت کارروائی» — نمبر شمار · وقت · نوعیت · مقام (+Lat/Long) · تفصیل و کارروائی
     خلاصہ (خود گنتی) · مشاہدات / ہدایات · دستخط (تفتیشی افسر کی سطر)
   • ہر اندراج «نیا اندراج — گشت اندراج» مشترکہ کارڈ سے (وقت اور Lat/Long خود،
     دونوں قابلِ ترمیم؛ موبائل 0000-0000000)؛ دستاویز کا ہر خانہ براہِ راست بھی قابلِ ترمیم
   • Ctrl+P = «پرنٹ» بٹن (ایک ہی راستہ — SYSTEM RULE، index.html)
   • اردو RTL، انگریزی/نمبر LTR (<bdi>) · تاریخ ہمیشہ DD/MM/YYYY · font ہمیشہ pt
   • آف لائن: اس آلے پر محفوظ، انٹرنیٹ آنے پر خود سرور پر؛ غیر محفوظ کام کا مسودہ
   • میعاد ختم: دیکھنا اور چھاپنا کھلا، لکھنا بند (DIO.sub.guard + سرور کی روک)
   • حذف: پہلے «حذف شدہ مواد» میں نقل، پھر اصل (v547 کا اصول)
   • ڈیٹابیس: `gasht_logs` (sql/104) — پوری رپورٹ `data` (jsonb) میں؛ اوپر کے
     کالم (تاریخ، علاقہ، حالت، روانگی/واپسی) فہرست اور تلاش کے لیے
   ═══════════════════════════════════════════════════════════════ */

/* global registerPage, dioBindEditor, getSarkariGari, getIOSignLine, dioBinCopy, softDeleteUndo, dioWriteOk */

registerPage('gasht', renderGasht);

const GL_FORM = 'gl1';
const GL_PX_IN = 96;
const GL_TABLE = 'gasht_logs';

let _glList = [];        // تمام گشت (نئے سب سے اوپر)
let _glCur = null;       // کھلا گشت (null = نیا)
let _glDirty = false;
let _glMeta = {};        // کھلے گشت کا ڈیٹا: start_iso، end_iso، date_iso، entries[]، name

// اندراج کی نوعیت — گشت کے عام کام (پیشہ ورانہ ترتیب)؛ فہرست میں زیادہ استعمال والی اوپر
const GL_KINDS = ['15 کال', 'ناکہ بندی', 'چیکنگ مشکوک افراد', 'چیکنگ گاڑیاں / موٹر سائیکل', 'حساس مقامات کی چیکنگ',
  'گرفتاری', 'برآمدگی', 'حادثہ / واقعہ', 'شکایت / درخواست', 'دیگر'];

// دستاویز میں ترتیب: پہلی دو قطاروں میں دو دو خانے (کاغذ پر جگہ کی بچت — عام گشت ایک صفحے پر)
const GL_LAYOUT = [
  [{ k: 'date', l: 'تاریخ گشت', pick: 'date' }, { k: 'start', l: 'روانگی', dt: 'start' }],
  [{ k: 'end', l: 'واپسی', dt: 'end' }, { k: 'duration', l: 'کل دورانیہ' }],
  [{ k: 'rapat', l: 'رپٹ نمبر (روانگی / واپسی)' }],
  [{ k: 'area', l: 'علاقہ / روٹ گشت' }],
  [{ k: 'vehicle', l: 'سرکاری گاڑی / ڈرائیور' }],
  [{ k: 'staff', l: 'ہمراہی ملازمان' }],
  [{ k: 'officer', l: 'گشت افسر' }],
];
// متن / کاپی کی ترتیب (ایک خانہ فی سطر)
const GL_ROWS = [
  { k: 'date',     l: 'تاریخ گشت',                pick: 'date' },
  { k: 'start',    l: 'روانگی',                   dt: 'start' },
  { k: 'end',      l: 'واپسی',                    dt: 'end' },
  { k: 'duration', l: 'کل دورانیہ' },
  { k: 'rapat',    l: 'رپٹ نمبر (روانگی / واپسی)' },
  { k: 'area',     l: 'علاقہ / روٹ گشت' },
  { k: 'vehicle',  l: 'سرکاری گاڑی / ڈرائیور' },
  { k: 'staff',    l: 'ہمراہی ملازمان' },
  { k: 'officer',  l: 'گشت افسر' },
];

const GL_ICON = {
  back: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  save: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4"/><path d="M8 20v-6h8v6"/></svg>',
  print: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 9V4h10v5"/><path d="M6 18H4v-7h16v7h-2"/><path d="M7 14h10v6H7z"/></svg>',
  share: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.9l7.6-3.8"/><path d="M8.2 13.1l7.6 3.8"/></svg>',
  down: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v12"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>',
  del: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/></svg>',
  pin: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  cal: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6.5h16V20H4z"/><path d="M4 10.5h16"/><path d="M8 3.5v4"/><path d="M16 3.5v4"/></svg>',
  clock: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  add: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
  stop: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
  edit: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
  copy: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
  tag: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.4"/></svg>',
  zoom: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>',
  route: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="5" r="2.2"/><path d="M8 19h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7"/></svg>',
};

/* ═════════════ چھوٹے مددگار ═════════════ */
function _glE(s) { return (typeof esc === 'function') ? esc(s == null ? '' : String(s)) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function _glSan(h) { return (typeof sanitizeHtml === 'function') ? sanitizeHtml(String(h || '')) : _glE(String(h || '').replace(/<br\s*\/?>/gi, '\n')).replace(/\n/g, '<br>'); }
function _glPlain(h) {
  const d = document.createElement('div');
  d.innerHTML = String(h || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(div|p)>/gi, '\n');
  return (d.textContent || '').replace(/ /g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}
function _glPad(n) { return String(n).padStart(2, '0'); }
function _glToast(m, t, ms) { if (typeof showToast === 'function') showToast(m, t || 'info', ms); }
function _glGuard(what) { return !(window.DIO && DIO.sub && typeof DIO.sub.guard === 'function' && !DIO.sub.guard(what)); }
function _glOfficer() {
  let o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : null;
  if (!o) { try { o = JSON.parse(localStorage.getItem('dio_officer_cache') || 'null'); } catch { o = null; } }
  return o || {};
}
function _glCacheKey() { const o = _glOfficer(); return 'dio_gllist_' + (o.id || 'me'); }
function _glStoreLocal() { try { localStorage.setItem(_glCacheKey(), JSON.stringify(_glList)); } catch (e) { console.warn('gl cache:', e && e.message); } }
function _glLocal() { try { return JSON.parse(localStorage.getItem(_glCacheKey()) || '[]') || []; } catch { return []; } }

// Pakistan وقت (Asia/Karachi) میں «اب» → 'YYYY-MM-DDTHH:MM'
function _glNowIso() {
  const d = new Date();
  try {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
    const g = t => (p.find(x => x.type === t) || {}).value || '';
    const hh = g('hour') === '24' ? '00' : g('hour');
    return `${g('year')}-${g('month')}-${g('day')}T${hh}:${g('minute')}`;
  } catch {
    return `${d.getFullYear()}-${_glPad(d.getMonth() + 1)}-${_glPad(d.getDate())}T${_glPad(d.getHours())}:${_glPad(d.getMinutes())}`;
  }
}
function _glDmy(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}
function _glIsoDate(s) {
  s = String(s || '').trim();
  let m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${_glPad(m[2])}-${_glPad(m[3])}`;
  m = s.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  return m ? `${m[3]}-${_glPad(m[2])}-${_glPad(m[1])}` : '';
}
function _glPeriod(h) {
  if (h >= 4 && h < 12) return 'صبح';
  if (h >= 12 && h < 15) return 'دوپہر';
  if (h >= 15 && h < 18) return 'سہ\u00a0پہر';   // «سہ پہر» ایک لفظ — دو سطروں میں نہ ٹوٹے
  if (h >= 18 && h < 20) return 'شام';
  return 'رات';
}
// 'HH:MM' → «05:15 بجے صبح» (نمبر LTR)
function _glTimeHtml(hm) {
  const m = String(hm || '').match(/^(\d{1,2}):(\d{2})/);
  if (!m) return '';
  const h = parseInt(m[1], 10);
  return `<bdi dir="ltr">${_glPad((h % 12) || 12)}:${m[2]}</bdi> بجے\u00a0${_glPeriod(h)}`;
}
// iso → «14/10/2026 بوقت 08:00 بجے صبح»
function _glDtHtml(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!m) return '';
  const date = `<bdi dir="ltr">${m[3]}/${m[2]}/${m[1]}</bdi>`;
  return m[4] === undefined ? date : `${date} بوقت ${_glTimeHtml(m[4] + ':' + m[5])}`;
}
// روانگی/واپسی: گشت کی تاریخ والے دن کا ہو تو صرف وقت (تاریخ اوپر الگ)؛ کسی اور دن کا ہو تو تاریخ سمیت
function _glDtShort(iso) {
  const m = String(iso || '').match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (!m) return _glDtHtml(iso);
  return (_glMeta.date_iso && m[1] === _glMeta.date_iso) ? _glTimeHtml(m[2]) : _glDtHtml(iso);
}
function _glAddDays(isoDate, n) {
  const m = String(isoDate || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return isoDate;
  const d = new Date(Date.UTC(+m[1], m[2] - 1, +m[3] + n));
  return d.getUTCFullYear() + '-' + _glPad(d.getUTCMonth() + 1) + '-' + _glPad(d.getUTCDate());
}
// دورانیہ — «4 گھنٹے 30 منٹ»
function _glDuration(a, b) {
  const t = s => { const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/); return m ? Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5]) : NaN; };
  const d = (t(b) - t(a)) / 60000;
  if (!isFinite(d) || d < 0) return '';
  const h = Math.floor(d / 60), mi = Math.round(d % 60);
  return [h ? `<bdi dir="ltr">${h}</bdi> گھنٹے` : '', mi || !h ? `<bdi dir="ltr">${mi}</bdi> منٹ` : ''].filter(Boolean).join(' ');
}
function _glStamp(iso) {
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
function _glLatLngText(lat, lng) {
  const a = Number(lat), b = Number(lng);
  return (isFinite(a) && isFinite(b) && (a || b)) ? `${a.toFixed(6)}, ${b.toFixed(6)}` : '';
}
function _glParseLatLng(t) {
  const m = String(t || '').match(/(-?\d{1,2}(?:\.\d+)?)\s*[,،\s]\s*(-?\d{1,3}(?:\.\d+)?)/);
  if (!m) return null;
  const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
  if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}
// انگریزی حروف اور ہندسے (ASI، HC، LEA-1234، 1122، 0303-2333981، 14/10/2026) — ہر ٹکڑا اپنے LTR خانے (bdi) میں:
//  • RTL سطر میں ترتیب کبھی نہ الٹے («LEA-1234» → «1234-LEA» / «0303-2333981» کے ٹکڑے آگے پیچھے نہ ہوں)
//  • پورے کاغذ پر انگریزی کا ایک ہی فونٹ (Times) — ورنہ Jameel کے اپنے انگریزی حروف الگ شکل میں آتے تھے
//  • انگریزی لفظ اردو سے نہ چپکے (gl-lw)
//  جس خانے میں ابھی لکھا جا رہا ہو اسے نہیں چھیڑتے (کرسر نہ ہلے) — وہ خانہ چھوڑتے ہی (focusout، force) درست ہوتا ہے۔
const GL_LATIN_RE = /[+#]?[A-Za-z0-9]+(?:[-–./:,+@_&][A-Za-z0-9]+)*/g;
function _glIsolateNums(root, force) {
  if (!root || !document.createTreeWalker) return;
  const act = force ? null : document.activeElement;
  const typing = act && act !== document.body && act.isContentEditable ? act : null;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach(n => {
    const par = n.parentElement;
    if (!par || par.closest('bdi,[dir="ltr"],button,svg,style,script,input,select,textarea,.no-print')) return;
    if (typing && typing.contains(n)) return;
    const t = n.nodeValue || '';
    GL_LATIN_RE.lastIndex = 0;
    if (!GL_LATIN_RE.test(t)) return;
    GL_LATIN_RE.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0, m;
    while ((m = GL_LATIN_RE.exec(t))) {
      if (m.index > last) frag.appendChild(document.createTextNode(t.slice(last, m.index)));
      const b = document.createElement('bdi');
      b.setAttribute('dir', 'ltr');
      // دونوں طرف ہلکا فاصلہ (Jameel کا خالی حرف بہت تنگ ہے)؛ مگر «1122،» میں نمبر اور «،» کے بیچ نہیں
      const prev = m.index > 0 ? t[m.index - 1] : ' ', next = t[m.index + m[0].length] || ' ';
      const cls = [];
      if (/[A-Za-z]/.test(m[0])) cls.push('gl-lw');
      if (!/\s/.test(next)) cls.push('gl-nl');
      if (!/\s/.test(prev)) cls.push('gl-nr');
      if (cls.length) b.className = cls.join(' ');
      b.textContent = m[0];
      frag.appendChild(b);
      last = m.index + m[0].length;
    }
    if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
    n.parentNode.replaceChild(frag, n);
  });
}

/* ═════════════ محفوظ ریکارڈ ═════════════ */
function _glData(row) {
  let d = row && row.data;
  if (typeof d === 'string') { try { d = JSON.parse(d); } catch { d = {}; } }
  return d || {};
}
function _glEntriesOf(row) { const d = _glData(row); return Array.isArray(d.entries) ? d.entries : []; }
function _glIsActive(row) { return !!row && row.status !== 'mukammal' && !_glData(row).end_iso; }
function _glListDate(row) {
  const d = _glData(row);
  return _glDmy(d.date_iso || row.gasht_date || d.start_iso || '') || '';
}
// فہرست کے لیے: «03:00 بجے سہ پہر سے 06:30 بجے شام تک» / «… سے — جاری» (HTML)
function _glListTimes(row) {
  const d = _glData(row);
  const t = iso => { const m = String(iso || '').match(/T(\d{2}:\d{2})/); return m ? m[1] : ''; };
  const a = t(d.start_iso), b = t(d.end_iso);
  if (!a) return '';
  return _glTimeHtml(a) + ' سے ' + (b ? _glTimeHtml(b) + ' تک' : '— جاری');
}
function _glListArea(row) {
  const d = _glData(row);
  return ((d.f && _glPlain(d.f.area)) || row.area || '').trim();
}
function _glActive() { return _glList.find(_glIsActive) || null; }

/* ═════════════ فہرست (صفحہ) ═════════════ */
const _glF = { q: '' };

async function renderGasht(container) {
  if (!container) return;
  _glF.q = '';
  const cached = _glLocal();
  if (cached.length) {
    _glList = cached.slice().sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
    _glRenderList(container);
    _glLoadList().then(() => {
      if (window._activePage !== 'gasht' || document.getElementById('gl-view')) return;
      const q = document.getElementById('gl-list-q');
      if (q && q.value) return _glListFilter(q.value);
      _glRenderList(container);
    });
  } else {
    container.innerHTML = (window.DIO && DIO.states && DIO.states.loading)
      ? DIO.states.loading('گشت لاگ لوڈ ہو رہا ہے')
      : '<div style="text-align:center;padding:30px;color:var(--text-muted);">لوڈ ہو رہا ہے…</div>';
    await _glLoadList();
    _glRenderList(container);
  }
  const want = window._glOpenId;
  if (want) { window._glOpenId = null; _glOpen(want); return; }
  if (window._glOpenNew) { window._glOpenNew = false; _glNew(); return; }
  if (window._glOpenEntry) { window._glOpenEntry = false; _glQuickEntry(); }
}
window.renderGasht = renderGasht;

let _glNoTable = false;   // sql/104 ابھی نہیں چلی
async function _glLoadList() {
  const local = _glLocal();
  let server = null;
  if (navigator.onLine && typeof supabaseClient !== 'undefined') {
    try {
      const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
      if (oid) {
        const { data, error } = await supabaseClient.from(GL_TABLE).select('*')
          .eq('officer_id', oid).order('created_at', { ascending: false }).limit(500);
        if (error) throw error;
        server = data || [];
        _glNoTable = false;
      }
    } catch (e) {
      if (_glIsMissingTable(e)) _glNoTable = true;
      console.warn('gl list:', e && e.message);
    }
  }
  let list = server ? server.slice() : local.filter(x => !x._pending);
  // مقامی زیرِ التوا (آف لائن / sql/104 سے پہلے) ریکارڈ ہمیشہ غالب — ورنہ کام ضائع
  local.filter(x => x._pending).forEach(p => {
    const i = list.findIndex(x => String(x.id) === String(p.id));
    if (i >= 0) list[i] = p; else list.push(p);
  });
  list.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  _glList = list;
  _glStoreLocal();
  if (server) _glSyncPending();
}

function _glRenderList(container) {
  const area = container || document.getElementById('page-content');
  if (!area) return;
  const act = _glActive();
  area.innerHTML = `
  <div class="gl-page" style="direction:rtl;">
    <div class="page-header">
      <button class="btn btn-primary dio-add-btn" onclick="_glNew()">+ نیا اندراج</button>
      <div>
        <div class="page-title">گشت لاگ</div>
        <div class="page-subtitle"><span id="gl-count">${_glVisible().length}</span> گشت — تاریخ، علاقہ اور کارروائی کے ساتھ</div>
      </div>
    </div>
    ${_glNoTable ? '<div class="gl-note">ڈیٹابیس اپڈیٹ (sql/104) ابھی نہیں چلی — گشت اس آلے پر محفوظ ہو رہے ہیں؛ چلتے ہی خود سرور پر چلے جائیں گے۔</div>' : ''}
    ${act ? _glActiveBanner(act) : ''}
    <div style="margin-bottom:14px;">
      <input class="form-input" id="gl-list-q" type="text" dir="rtl" autocomplete="off" style="width:100%;"
        placeholder="تاریخ، علاقہ، گاڑی، ملازم یا کارروائی سے تلاش کریں..." oninput="_glListFilter(this.value)">
    </div>
    <div id="gl-list-body">${_glListRows()}</div>
  </div>
  <style>${_glListCSS()}</style>`;
}
window._glRenderList = _glRenderList;

function _glActiveBanner(r) {
  const id = _glE(String(r.id));
  const n = _glEntriesOf(r).length;
  const d = _glData(r);
  return `<div class="gl-active" role="region" aria-label="جاری گشت">
    <div class="gl-active-dot" aria-hidden="true"></div>
    <div class="gl-active-body">
      <div class="gl-active-t">جاری گشت${_glListArea(r) ? ' — <bdi>' + _glE(_glListArea(r)) + '</bdi>' : ''}</div>
      <div class="gl-active-s">روانگی ${_glDtHtml(d.start_iso) || '—'} · اندراجات <bdi dir="ltr">${n}</bdi></div>
    </div>
    <div class="gl-active-acts">
      <button type="button" class="btn btn-primary btn-sm" onclick="_glQuickEntry('${id}')">${GL_ICON.add} اندراج</button>
      <button type="button" class="btn btn-secondary btn-sm" onclick="_glOpen('${id}')">${GL_ICON.edit} کھولیں</button>
      <button type="button" class="btn btn-secondary btn-sm gl-end-btn" onclick="_glEndRow('${id}')">${GL_ICON.stop} گشت ختم کریں</button>
    </div>
  </div>`;
}

function _glSearchText(r) {
  const d = _glData(r);
  const f = d.f || {};
  return [_glListDate(r), _glListArea(r), _glPlain(_glListTimes(r)), d.name, ...Object.keys(f).map(k => _glPlain(f[k])),
    ..._glEntriesOf(r).map(e => [e.t, e.kind, e.place, e.person, e.mobile, e.detail].join(' '))]
    .map(x => String(x || '')).join(' ').replace(/\s+/g, ' ').toLowerCase();
}
function _glVisible() {
  const q = _glF.q.trim().toLowerCase();
  return _glList.map((r, i) => ({ r, no: _glList.length - i })).filter(({ r }) => !q || _glSearchText(r).includes(q));
}
function _glListRows() {
  if (!_glList.length) {
    return `<div class="gl-empty">
      <div class="gl-empty-ico">${GL_ICON.route}</div>
      <div>ابھی کوئی گشت محفوظ نہیں</div>
      <button type="button" class="btn btn-primary" onclick="_glNew()">+ نیا اندراج — گشت</button></div>`;
  }
  const rows = _glVisible();
  const n = document.getElementById('gl-count');
  if (n) n.textContent = rows.length;
  if (!rows.length) return '<div class="gl-empty">اس تلاش سے کوئی گشت نہیں ملا</div>';
  return `<div class="gl-cards">${rows.map(({ r, no }) => {
    const d = _glData(r);
    const f = d.f || {};
    const name = String(d.name || '').trim();
    const area = _glListArea(r);
    const ents = _glEntriesOf(r);
    const times = _glListTimes(r);
    const veh = _glPlain(f.vehicle);
    const kinds = _glKindCounts(ents).slice(0, 3).map(([k, c]) => `${_glE(k)} <bdi dir="ltr">${c}</bdi>`).join('، ');
    const id = _glE(String(r.id));
    const active = _glIsActive(r);
    const A = (fn, ico, t, cls) => `<button type="button" class="gl-act${cls ? ' ' + cls : ''}" onclick="${fn}('${id}')" title="${t}" aria-label="${t}">${GL_ICON[ico]}<span>${t}</span></button>`;
    return `
    <div class="card gl-card${active ? ' gl-card-on' : ''}" role="button" tabindex="0" onclick="_glOpen('${id}')" onkeydown="if(event.key==='Enter'&&event.target===this)_glOpen('${id}')">
      <div class="gl-card-ico">${GL_ICON.route}</div>
      <div class="gl-card-body">
        <div class="gl-card-t">${_glE(name || area || 'گشت')}${name && area && name !== area ? ` <span class="gl-card-sub">${_glE(area)}</span>` : ''}
          ${active ? '<span class="gl-badge gl-badge-on">جاری</span>' : '<span class="gl-badge">مکمل</span>'}
          ${r._pending ? '<span class="gl-pend">سرور پر نہیں گیا — انٹرنیٹ آنے پر خود</span>' : ''}</div>
        <div class="gl-card-s">${GL_ICON.cal}<bdi dir="ltr">${_glE(_glListDate(r) || '—')}</bdi>${times ? `<i class="gl-dot">·</i>${GL_ICON.clock}<span>${times}</span>` : ''}</div>
        <div class="gl-card-m"><span><b>اندراجات:</b> <bdi dir="ltr">${ents.length}</bdi></span>${kinds ? `<i class="gl-dot">·</i><span>${kinds}</span>` : ''}${veh ? `<i class="gl-dot">·</i><span><b>گاڑی:</b> <bdi>${_glE(veh)}</bdi></span>` : ''}</div>
        <div class="gl-card-x">گشت <bdi dir="ltr">#${no}</bdi></div>
      </div>
      <div class="gl-acts" role="group" aria-label="گشت کے اقدامات" onclick="event.stopPropagation()" onkeydown="event.stopPropagation()">
        ${A('_glPrintRow', 'print', 'پرنٹ', 'gl-act-main')}
        ${A('_glOpen', 'edit', 'ترمیم')}
        ${A('_glShareRow', 'share', 'شیئر')}
        ${A('_glCopyRow', 'copy', 'کاپی')}
        ${A('_glRename', 'tag', 'نام بدلیں')}
        ${A('_glDelete', 'del', 'حذف', 'gl-act-del')}
      </div>
    </div>`;
  }).join('')}</div>`;
}
function _glListFilter(v) {
  _glF.q = String(v || '');
  const b = document.getElementById('gl-list-body');
  if (b) b.innerHTML = _glListRows();
}
window._glListFilter = _glListFilter;

function _glListCSS() {
  return `
    .gl-note{ font-size:11pt; line-height:1.9; color:#92400e; background:#fffbeb; border:1px solid #fcd34d; border-radius:8px;
      padding:6px 12px 8px; margin-bottom:12px; font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; }
    .gl-active{ display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:12px; margin-bottom:14px;
      padding:10px 14px; border-radius:12px; border:1.5px solid var(--green,#16a34a); background:rgba(22,163,74,.07);
      font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; }
    .gl-active-dot{ width:12px; height:12px; border-radius:50%; background:var(--green,#16a34a); box-shadow:0 0 0 4px rgba(22,163,74,.2); }
    .gl-active-t{ font-size:14pt; font-weight:700; line-height:1.8; color:var(--green,#16a34a); }
    .gl-active-s{ font-size:12pt; line-height:1.9; color:var(--text-primary); }
    .gl-active-s bdi[dir="ltr"]{ font-family:Arial,sans-serif; font-size:10pt; }
    .gl-active-acts{ display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end; }
    .gl-active-acts .btn{ display:inline-flex; align-items:center; gap:5px; white-space:nowrap; }
    .gl-cards{ display:flex; flex-direction:column; gap:10px; }
    .gl-card{ display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:14px;
      padding:12px 14px; cursor:pointer; border-right:3px solid var(--accent,#0369a1); }
    .gl-card-on{ border-right-color:var(--green,#16a34a); }
    .gl-card:hover, .gl-card:focus-visible{ border-color:var(--accent); outline:none; }
    .gl-card-ico{ width:42px; height:42px; border-radius:50%; background:var(--accent,#0369a1); color:#fff;
      display:flex; align-items:center; justify-content:center; align-self:start; }
    .gl-card-on .gl-card-ico{ background:var(--green,#16a34a); }
    .gl-card-body{ min-width:0; font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; }
    .gl-card-t{ font-size:14pt; font-weight:700; line-height:1.8; }
    .gl-card-sub{ font-size:11pt; font-weight:400; color:var(--text-muted); margin-right:6px; }
    .gl-badge{ display:inline-block; font-size:10pt; font-weight:700; line-height:1.6; padding:0 8px 2px; margin-right:6px; border-radius:999px;
      border:1px solid var(--border); color:var(--text-muted); }
    .gl-badge-on{ border-color:var(--green,#16a34a); color:var(--green,#16a34a); }
    .gl-card-s, .gl-card-m{ font-size:12pt; line-height:1.9; color:var(--text-primary); overflow-wrap:anywhere; }
    .gl-card-s svg{ width:14px; height:14px; margin-left:4px; position:relative; top:2px; color:var(--text-muted); }
    .gl-card-m b{ font-weight:700; color:var(--text-muted); }
    .gl-dot{ font-style:normal; color:var(--text-muted); margin:0 7px; }
    .gl-card-x{ font-size:10.5pt; color:var(--text-muted); line-height:1.8; }
    .gl-card bdi[dir="ltr"]{ font-family:Arial,sans-serif; font-size:9.5pt; white-space:nowrap; }
    .gl-pend{ font-size:10pt; color:#b45309; font-weight:700; margin-right:6px; }
    .gl-acts{ display:grid; grid-template-columns:repeat(3, auto); gap:6px; cursor:default; align-self:center; }
    .gl-act{ display:inline-flex; align-items:center; justify-content:flex-start; gap:6px; height:34px; min-width:98px; padding:0 11px 3px;
      border-radius:8px; cursor:pointer; border:1px solid var(--border); background:var(--bg-secondary,transparent); color:var(--text-primary);
      font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; font-size:11.5pt; line-height:1; white-space:nowrap;
      transition:border-color .15s, background .15s, color .15s; }
    .gl-act svg{ width:16px; height:16px; flex:none; position:relative; top:1px; }
    .gl-act:hover, .gl-act:focus-visible{ border-color:var(--accent); color:var(--accent); outline:none; }
    .gl-act-main{ background:var(--accent); border-color:var(--accent); color:#fff; }
    .gl-act-main:hover, .gl-act-main:focus-visible{ color:#fff; filter:brightness(1.08); }
    .gl-act-del{ color:var(--red,#dc2626); }
    .gl-act-del:hover, .gl-act-del:focus-visible{ border-color:var(--red,#dc2626); color:#fff; background:var(--red,#dc2626); }
    .gl-empty{ text-align:center; padding:40px 20px; color:var(--text-muted); line-height:2.4; font-size:14pt;
      font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; }
    .gl-empty-ico svg{ width:46px; height:46px; opacity:.45; }
    @media screen and (max-width:900px){ .gl-act{ min-width:0; } }
    @media screen and (max-width:760px){
      .gl-active{ grid-template-columns:auto minmax(0,1fr); }
      .gl-active-acts{ grid-column:1 / -1; justify-content:stretch; }
      .gl-active-acts .btn{ flex:1 1 0; justify-content:center; min-height:44px; }
      .gl-card{ grid-template-columns:minmax(0,1fr) auto; gap:10px; padding:10px 12px; }
      .gl-card-ico{ display:none; }
      .gl-card-t{ font-size:13pt; }
      .gl-card-s, .gl-card-m{ font-size:11pt; line-height:1.8; }
      .gl-acts{ grid-template-columns:repeat(2, 44px); gap:5px; align-self:start; }
      .gl-act{ width:44px; height:44px; min-height:44px !important; padding:0; justify-content:center; }
      .gl-act span{ display:none; }
      .gl-act svg{ width:19px; height:19px; top:0; }
    }`;
}

/* ═════════════ گشت کھولنا / نیا ═════════════ */
function _glDraftKey() { const o = _glOfficer(); return 'dio_gl_draft_' + (o.id || 'me'); }
function _glDraft() { try { return JSON.parse(localStorage.getItem(_glDraftKey()) || 'null'); } catch { return null; } }
function _glDraftClear() { try { localStorage.removeItem(_glDraftKey()); } catch { /* storage بند */ } }
let _glDraftT = null;
function _glDraftSoon() {
  clearTimeout(_glDraftT);
  _glDraftT = setTimeout(() => {
    if (!_glDirty || !document.getElementById('gl-doc')) return;
    try {
      localStorage.setItem(_glDraftKey(), JSON.stringify({ cur_id: _glCur ? _glCur.id : null, f: _glCollect(true),
        meta: { ..._glMeta, entries: _glReadEntries() }, at: new Date().toISOString() }));
    } catch { /* جگہ نہیں */ }
  }, 900);
}
function _glOfferDraft(curId) {
  const d = _glDraft();
  if (!d || !d.f || String(d.cur_id || '') !== String(curId || '')) return null;
  const when = _glStamp(d.at);
  if (confirm(`اس گشت کا غیر محفوظ مسودہ موجود ہے${when ? ' (' + when + ')' : ''}۔\nکیا اسے بحال کریں؟`)) return d;
  _glDraftClear();
  return null;
}

function _glNew() {
  if (!_glGuard('نیا گشت')) return;
  const act = _glActive();
  if (act && !confirm('ایک گشت ابھی جاری ہے (واپسی درج نہیں)۔\n«OK» = نیا گشت شروع کریں · «Cancel» = جاری گشت کھولیں')) { _glOpen(act.id); return; }
  if (document.getElementById('gl-view') && _glDirty && !confirm('غیر محفوظ تبدیلیاں ضائع ہو جائیں گی۔ نیا گشت کھولیں؟')) return;
  _glCur = null;
  const draft = _glOfferDraft(null);
  if (draft) {
    _glMeta = { ...(draft.meta || {}) };
    _glRenderDoc(draft.f);
    _glMarkDirty(true);
    return;
  }
  const now = _glNowIso();
  _glMeta = { date_iso: now.slice(0, 10), start_iso: now, end_iso: '', entries: [] };
  _glRenderDoc();
  _glMarkDirty(false);   // «نیا — ابھی محفوظ نہیں»؛ پہلا اندراج یا «محفوظ کریں» اسے محفوظ کرتا ہے
}
window._glNew = _glNew;

function _glOpen(id) {
  const r = _glList.find(x => String(x.id) === String(id));
  if (!r) { _glToast('گشت نہیں ملا', 'error'); return false; }
  const v0 = document.getElementById('gl-view');
  // یہی گشت پہلے سے کھلا ہے — دوبارہ نہ بناؤ (ورنہ لکھا ہوا ضائع)
  if (v0 && !v0.classList.contains('gl-quick') && _glCur && String(_glCur.id) === String(id)) return true;
  if (v0 && _glDirty && !confirm('غیر محفوظ تبدیلیاں ضائع ہو جائیں گی۔ یہ گشت کھولیں؟')) return false;
  _glCur = r;
  const draft = _glOfferDraft(r.id);
  const d = _glData(r);
  _glMeta = draft ? { ...(draft.meta || {}) } : { date_iso: d.date_iso || r.gasht_date || '', start_iso: d.start_iso || '', end_iso: d.end_iso || '',
    entries: _glEntriesOf(r).map(e => ({ ...e })), name: d.name || '' };
  _glRenderDoc(draft ? draft.f : null);
  _glMarkDirty(!!draft);
  return true;
}
window._glOpen = _glOpen;
function openGashtLog(id) { window._glOpenId = id; if (typeof showPage === 'function') showPage('gasht', null); }
window.openGashtLog = openGashtLog;
function openGashtNew() { window._glOpenNew = true; if (typeof showPage === 'function') showPage('gasht', null); }
window.openGashtNew = openGashtNew;
// Dashboard «نیا اندراج» → گشت: جاری گشت ہو تو سیدھا اسی کا اندراج، ورنہ نیا گشت
function openGashtEntry() {
  if (window._activePage === 'gasht' && document.getElementById('gl-list-body')) { _glQuickEntry(); return; }
  window._glOpenEntry = true;
  if (typeof showPage === 'function') showPage('gasht', null);
}
window.openGashtEntry = openGashtEntry;

function _glClose(force) {
  if (!force && _glDirty) {
    if (!confirm('غیر محفوظ تبدیلیاں ضائع ہو جائیں گی۔ فہرست پر جائیں؟')) return;
    _glDraftClear();
  }
  const v = document.getElementById('gl-view');
  if (v) v.remove();
  document.body.classList.remove('gl-open');
  document.removeEventListener('keydown', _glKeys);
  _glDirty = false;
  _glCur = null;
  if (window._activePage === 'gasht') _glRenderList();
}
window._glClose = _glClose;
function _glKeys(e) {
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); _glSave(); return; }
  if (e.key !== 'Escape') return;
  const bd = document.getElementById('modal-backdrop');
  if (bd && bd.style.display !== 'none') return;
  _glClose();
}
function _glMarkDirty(b) {
  _glDirty = !!b;
  const s = document.getElementById('gl-state');
  if (s) {
    s.textContent = _glDirty ? (_glCur ? 'غیر محفوظ تبدیلیاں' : 'نیا — ابھی محفوظ نہیں') : (_glCur && !_glCur._pending ? 'محفوظ' : (_glCur ? 'اس آلے پر محفوظ' : 'نیا — ابھی محفوظ نہیں'));
    s.dataset.state = _glDirty ? 'dirty' : (_glCur ? 'saved' : 'new');
  }
}
window.addEventListener('beforeunload', e => {
  if (document.getElementById('gl-view') && _glDirty) { e.preventDefault(); e.returnValue = ''; }
});

/* ═════════════ پہلے سے طے شدہ ڈیٹا (سسٹم سے) ═════════════ */
// گاڑی اور ہمراہی: پچھلے گشت سے (عموماً وہی رہتے ہیں)؛ پہلی بار سرکاری گاڑی کی ترتیب سے
function _glLastField(k) {
  for (const r of _glList) { const f = _glData(r).f || {}; if (_glPlain(f[k])) return _glSan(f[k]); }
  return '';
}
function _glIoLine() {
  try { if (typeof getIOSignLine === 'function') return getIOSignLine() || ''; } catch (e) { console.warn('gl io line:', e && e.message); }
  const o = _glOfficer();
  return [o.full_name, o.designation, o.station ? 'تھانہ ' + o.station : ''].filter(Boolean).join(' ');
}
// انگریزی حصہ (ASI، SI/SHO …) LTR میں الگ — اردو کے ساتھ جڑ کر الٹا یا چپکا نظر نہ آئے
//  (escape شدہ متن پر — «&amp;» جیسے entity کو نہیں چھیڑتا)
function _glLtrWords(html) { return String(html || '').replace(/(?<![&\w])([A-Za-z][A-Za-z0-9/.\-]*)(?!;)/g, '<bdi dir="ltr" class="gl-lw">$1</bdi>'); }
function _glDefaults() {
  const o = _glOfficer();
  let vehicle = _glLastField('vehicle');
  if (!vehicle) {
    try {
      const g = (typeof getSarkariGari === 'function') ? getSarkariGari() : {};
      vehicle = [g.vehicle_number ? `<bdi dir="ltr">${_glE(g.vehicle_number)}</bdi>` : '', g.driver_name ? 'ڈرائیور ' + _glE(g.driver_name) : ''].filter(Boolean).join(' — ');
    } catch (e) { console.warn('gl gari:', e && e.message); }
  }
  const io = _glLtrWords(_glE(_glIoLine()));
  return {
    title: 'گشت رپورٹ',
    thana: _glE((o.station || '').trim()), zila: _glE((o.district || '').trim()),
    date: _glDtHtml(_glMeta.date_iso), start: _glDtShort(_glMeta.start_iso), end: _glDtShort(_glMeta.end_iso),
    duration: _glDuration(_glMeta.start_iso, _glMeta.end_iso),
    rapat: '', area: '', vehicle, staff: _glLastField('staff'), officer: io,
    remarks: '', closing: 'گشت رپورٹ مرتب ہو کر پیش ہے۔',
    sign_line: io, sign_date: `<bdi dir="ltr">${_glDmy(_glNowIso())}</bdi>`,
  };
}

function _glPhone() { try { return window.matchMedia('(max-width: 760px)').matches; } catch { return false; } }

/* ═════════════ دستاویز (پورا صفحہ) ═════════════ */
function _glRenderDoc(override) {
  const saved = override || (_glCur ? (_glData(_glCur).f || {}) : {});
  const def = _glDefaults();
  const has = k => saved[k] !== undefined && saved[k] !== null && _glPlain(saved[k]) !== '';
  const val = k => has(k) ? _glSan(saved[k]) : (def[k] || '');

  const total = _glList.length;
  const idx = _glCur ? _glList.findIndex(x => String(x.id) === String(_glCur.id)) : -1;
  const title = idx >= 0 ? `گشت #${total - idx}` : 'نیا اندراج — گشت';
  const active = !_glMeta.end_iso;

  const F = (k, cls, extra) => `<div class="gl-f ${cls || ''}" contenteditable="true" spellcheck="false" data-k="${k}" ${extra || ''}>${val(k)}</div>`;
  const FI = k => `<span class="gl-fi" contenteditable="true" spellcheck="false" data-k="${k}">${val(k)}</span>`;
  const pickDate = `<span class="gl-pick no-print" title="تاریخ چنیں">${GL_ICON.cal}<input type="date" aria-label="تاریخ گشت چنیں"
      value="${_glE(_glMeta.date_iso || '')}" onclick="try{this.showPicker()}catch(_){ /* picker na ho to koi baat nahi */ }" onchange="_glSetDate(this.value)"></span>`;
  const pickDt = k => `<span class="gl-pick no-print" title="تاریخ و وقت چنیں">${GL_ICON.clock}<input type="datetime-local" aria-label="${k === 'start' ? 'روانگی' : 'واپسی'} کا وقت چنیں"
      value="${_glE(_glMeta[k + '_iso'] || '')}" onclick="try{this.showPicker()}catch(_){ /* picker na ho to koi baat nahi */ }" onchange="_glSetDt('${k}', this.value)"></span>`;

  const pair = r => {
    const tools = r.pick === 'date' ? pickDate : r.dt ? pickDt(r.dt) : '';
    return `<div class="gl-cell${tools ? ' has-pick' : ''}">${F(r.k)}${tools}</div>`;
  };
  const rowsHtml = GL_LAYOUT.map(row => row.length === 2
    ? `<tr class="gl-r2"><th scope="row"><span class="gl-lbl">${row[0].l}</span></th><td>${pair(row[0])}</td><th scope="row" class="gl-th2"><span class="gl-lbl2">${row[1].l}</span></th><td>${pair(row[1])}</td></tr>`
    : `<tr><th scope="row"><span class="gl-lbl">${row[0].l}</span></th><td colspan="3">${pair(row[0])}</td></tr>`).join('');

  const phone = _glPhone();
  let v = document.getElementById('gl-view');
  if (!v) {
    v = document.createElement('div');
    v.id = 'gl-view';
    document.body.appendChild(v);
    document.body.classList.add('gl-open');
    document.addEventListener('keydown', _glKeys);
  }
  v.classList.toggle('gl-a4', !phone || !!_glA4View);
  v.innerHTML = `
  <div class="gl-strip no-print" role="toolbar" aria-label="گشت رپورٹ">
    <div class="gl-strip-r">
      <button type="button" class="btn btn-secondary btn-sm" onclick="_glClose()" title="تمام گشت (Esc)">${GL_ICON.back} فہرست</button>
      <div class="gl-strip-tt">
        <span class="gl-strip-t" id="gl-strip-t">${_glE(title)}</span>
        <span class="gl-state" id="gl-state"></span>
      </div>
      <span class="gl-chip${active ? ' gl-chip-on' : ''}" id="gl-chip">${active ? 'جاری' : 'مکمل'}</span>
    </div>
    <div class="gl-strip-l">
      <button type="button" class="btn btn-primary btn-sm gl-addbtn" onclick="_glEntryCard(-1)" title="گشت کے دوران کارروائی درج کریں">${GL_ICON.add} اندراج</button>
      <button type="button" class="btn btn-secondary btn-sm gl-endbtn" id="gl-endbtn" onclick="_glEnd()" title="واپسی کا وقت (اب) درج کر کے گشت مکمل کریں"${active ? '' : ' hidden'}>${GL_ICON.stop} گشت ختم کریں</button>
      ${phone ? `<button type="button" class="btn btn-secondary btn-sm" onclick="_glToggleView()" id="gl-view-btn" title="موبائل منظر / A4 کاغذ">${GL_ICON.zoom} <span>${_glA4View ? 'موبائل منظر' : 'A4 منظر'}</span></button>` : ''}
      <button type="button" class="btn btn-secondary btn-sm" onclick="_glShare()" title="شیئر">${GL_ICON.share} شیئر</button>
      <button type="button" class="btn btn-secondary btn-sm" onclick="_glDownload()" title="ڈاؤن لوڈ">${GL_ICON.down} ڈاؤن لوڈ</button>
      <button type="button" class="btn btn-secondary btn-sm" data-dio-print onclick="_glPrint()" title="پرنٹ (Ctrl+P)">${GL_ICON.print} پرنٹ</button>
      <button type="button" class="btn btn-primary btn-sm gl-savebtn" onclick="_glSave()" title="محفوظ کریں (Ctrl+S)">${GL_ICON.save} محفوظ کریں</button>
      ${_glCur ? `<button type="button" class="btn btn-danger btn-sm gl-del" onclick="_glDelete('${_glE(String(_glCur.id))}')" title="حذف" aria-label="حذف">${GL_ICON.del}</button>` : ''}
    </div>
  </div>
  <div class="gl-scroll" id="gl-scroll">
    <div class="gl-zoom" id="gl-zoom">
      <div id="gl-doc" class="gl-page" lang="ur" dir="rtl"><div class="gl-inner" id="gl-inner">

        <div class="gl-title-row">
          <span class="gl-tt-right">تھانہ ${FI('thana')}</span>
          <span class="gl-tt-left">ضلع ${FI('zila')}</span>
        </div>

        <div class="gl-head"><div class="gl-f gl-title dio-doc-h1" contenteditable="true" spellcheck="false" data-k="title">${val('title')}</div></div>

        <table class="gl-table" role="presentation">
          <colgroup><col class="gl-c1"><col><col class="gl-c3"><col></colgroup>
          <tbody>${rowsHtml}</tbody>
        </table>

        <div class="gl-h2 dio-doc-h2">دورانِ گشت کارروائی</div>
        <table class="gl-etable" id="gl-etable">
          <colgroup><col class="gl-ec-no"><col class="gl-ec-t"><col class="gl-ec-k"><col class="gl-ec-p"><col></colgroup>
          <thead><tr><th>نمبر شمار</th><th>وقت</th><th>نوعیت</th><th>مقام</th><th>تفصیل و کارروائی</th></tr></thead>
          <tbody id="gl-ebody">${_glEntriesHtml()}</tbody>
        </table>
        <div class="gl-sum" id="gl-sum">${_glSummaryHtml()}</div>

        <!-- مشاہدات + آخری سطر + دستخط ایک گروہ: صفحہ بدلے تو سب ساتھ — دستخط کبھی اکیلا اگلے صفحے پر نہیں -->
        <div class="gl-final">
          <div class="gl-h2 dio-doc-h2">مشاہدات / ہدایات</div>
          ${F('remarks', 'gl-remarks')}
          <div class="gl-tail">
            <div class="gl-closing-row">${F('closing', 'gl-closing')}</div>
            <div class="gl-end">
              <div class="gl-endbox">
                <div class="gl-signspace" aria-hidden="true"></div>
                ${F('sign_line', 'gl-signline')}
                ${F('sign_date', 'gl-signdate')}
              </div>
            </div>
          </div>
        </div>

      </div></div>
    </div>
  </div>
  <style id="gl-style">${_glCSS()}</style>`;

  const doc = document.getElementById('gl-doc');
  if (doc) {
    doc.addEventListener('input', e => {
      _glMarkDirty(true);
      const t = e.target;
      const k = t && t.dataset && t.dataset.k;
      if (k === 'start' || k === 'end' || k === 'date') {
        // ہاتھ سے لکھا: خالی = وقت ہٹا (واپسی خالی = گشت پھر جاری)؛ پڑھا جا سکے تو وہی؛ ورنہ پچھلا برقرار
        const txt = _glPlain(t.innerHTML);
        const mk = k === 'date' ? 'date_iso' : k + '_iso';
        const iso = txt ? _glParseDtText(txt, k === 'date', k) : '';
        if (!txt || iso) {
          _glMeta[mk] = iso;
          if (k !== 'date') { _glRefreshDuration(); if (k === 'end') _glSetActiveUi(!iso); }
        }
      }
      if (t && t.closest && t.closest('#gl-ebody')) _glRefreshSummary();
      _glDraftSoon();
    });
    doc.addEventListener('focusout', e => { if (e.target && e.target.dataset && (e.target.dataset.k || e.target.dataset.e)) _glIsolateNums(e.target, true); });
    doc.addEventListener('paste', e => {
      const t = e.clipboardData && e.clipboardData.getData('text/plain');
      if (t == null) return;
      e.preventDefault();
      try { document.execCommand('insertText', false, t); } catch { /* پرانا براؤزر — عام چسپاں */ }
    });
  }
  _glIsolateNums(doc, true);
  if (typeof dioBindEditor === 'function') { try { dioBindEditor(v); } catch (e) { console.warn('gl bind:', e && e.message); } }
  _glMarkDirty(_glDirty);
  _glFit();
  _glFitLabels(doc);
  try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { _glFit(); _glFitLabels(); }); } catch { /* پرانا براؤزر */ }
  if (!window._glResizeBound) {
    window._glResizeBound = true;
    window.addEventListener('resize', () => {
      const vv = document.getElementById('gl-view');
      if (!vv) return;
      vv.classList.toggle('gl-a4', !_glPhone() || !!_glA4View);
      _glFit();
    });
  }
}
window._glRenderDoc = _glRenderDoc;

// «08:30 بجے رات» → 24 گھنٹے (_glPeriod کا الٹ): صبح 4–11 · دوپہر 12–14 · سہ پہر 15–17 · شام 18–19 · رات 20–3
function _glFrom12(h, s) {
  if (h > 12) return h % 24;                      // پہلے ہی 24 گھنٹے
  if (/صبح/.test(s)) return h === 12 ? 0 : h;
  if (/دوپہر/.test(s)) return h === 12 ? 12 : h + 12;
  if (/سہ\s*پہر|شام/.test(s)) return h === 12 ? 12 : h + 12;
  if (/رات/.test(s)) return h === 12 ? 0 : (h >= 8 ? h + 12 : h);
  return h;
}
// «14/10/2026 بوقت 08:30 بجے صبح» / «08:30 بجے صبح» / «20:30» → iso
//  صرف وقت ہو تو گشت کی تاریخ؛ واپسی روانگی سے پہلے کا وقت ہو تو اگلا دن (آدھی رات کے بعد واپسی)
function _glParseDtText(t, dateOnly, k) {
  const s = String(t || '');
  let d = _glIsoDate(s);
  if (dateOnly) return d;
  const tm = s.match(/(\d{1,2}):(\d{2})/);
  if (!tm) return '';
  const hm = `${_glPad(_glFrom12(parseInt(tm[1], 10), s))}:${tm[2]}`;
  if (!d) {
    d = _glMeta.date_iso || (_glMeta.start_iso || '').slice(0, 10);
    if (!d) return '';
    if (k === 'end' && _glMeta.start_iso && `${d}T${hm}` < _glMeta.start_iso) d = _glAddDays(d, 1);
  }
  return `${d}T${hm}`;
}

function _glKindCounts(ents) {
  const c = {};
  (ents || []).forEach(e => { const k = String(e.kind || '').trim() || 'دیگر'; c[k] = (c[k] || 0) + 1; });
  return Object.keys(c).map(k => [k, c[k]]).sort((a, b) => b[1] - a[1] || (GL_KINDS.indexOf(a[0]) - GL_KINDS.indexOf(b[0])));
}
function _glEntriesHtml() {
  const ents = _glMeta.entries || [];
  if (!ents.length) {
    return `<tr class="gl-erow-empty"><td colspan="5">دورانِ گشت ابھی کوئی کارروائی درج نہیں<span class="no-print"> — «اندراج» سے شامل کریں</span></td></tr>`;
  }
  const C = (i, k, l, html, cls) => `<td data-l="${l}"${cls ? ` class="${cls}"` : ''}><div class="gl-e" contenteditable="true" spellcheck="false" data-e="${i}:${k}">${html}</div></td>`;
  return ents.map((e, i) => {
    const ll = _glLatLngText(e.lat, e.lng);
    const who = [e.person ? _glE(e.person) : '', e.mobile ? `<bdi dir="ltr">${_glE(e.mobile)}</bdi>` : ''].filter(Boolean).join(' — ');
    const detail = (e.detail_html !== undefined ? _glSan(e.detail_html) : _glE(e.detail || '').replace(/\n/g, '<br>'));
    return `<tr class="gl-erow">
      <td data-l="نمبر شمار" class="gl-eno"><bdi dir="ltr">${i + 1}</bdi>
        <span class="gl-eacts no-print"><button type="button" title="اندراج میں ترمیم" aria-label="اندراج ${i + 1} میں ترمیم" onclick="_glEntryCard(${i})">${GL_ICON.edit}</button><button type="button" title="اندراج حذف" aria-label="اندراج ${i + 1} حذف" onclick="_glEntryDel(${i})">${GL_ICON.del}</button></span></td>
      ${C(i, 't', 'وقت', e.t ? _glTimeHtml(e.t) : '', 'gl-et')}
      ${C(i, 'kind', 'نوعیت', _glE(e.kind || ''))}
      <td data-l="مقام"><div class="gl-e" contenteditable="true" spellcheck="false" data-e="${i}:place">${_glE(e.place || '')}</div>${ll ? `<div class="gl-ell" dir="ltr">${_glE(ll)}</div>` : ''}</td>
      <td data-l="تفصیل و کارروائی"><div class="gl-e gl-edetail" contenteditable="true" spellcheck="false" data-e="${i}:detail">${detail}</div>${who ? `<div class="gl-ewho">متعلقہ شخص: ${who}</div>` : ''}</td>
    </tr>`;
  }).join('');
}
function _glSummaryHtml() {
  const ents = _glMeta.entries || [];
  const k = _glKindCounts(ents).map(([n, c]) => `${_glE(n)}: <bdi dir="ltr">${c}</bdi>`).join(' · ');
  return `<b>خلاصہ:</b> کل اندراجات <bdi dir="ltr">${ents.length}</bdi>${k ? ' — ' + k : ''}`;
}
function _glRefreshSummary() { const s = document.getElementById('gl-sum'); if (s) { _glMeta.entries = _glReadEntries(); s.innerHTML = _glSummaryHtml(); _glIsolateNums(s, true); } }
function _glRedrawEntries() {
  const b = document.getElementById('gl-ebody');
  if (b) { b.innerHTML = _glEntriesHtml(); _glIsolateNums(b, true); }
  const s = document.getElementById('gl-sum');
  if (s) { s.innerHTML = _glSummaryHtml(); _glIsolateNums(s, true); }
}
// جدول میں براہِ راست کی گئی ترامیم اندراجات میں واپس
function _glReadEntries() {
  const ents = (_glMeta.entries || []).map(e => ({ ...e }));
  document.querySelectorAll('#gl-ebody [data-e]').forEach(el => {
    const [i, k] = String(el.dataset.e).split(':');
    const e = ents[+i];
    if (!e) return;
    const txt = _glPlain(el.innerHTML);
    if (k === 't') { const m = txt.match(/(\d{1,2}):(\d{2})/); if (m) e.t = _glPad(_glFrom12(+m[1], txt)) + ':' + m[2]; else if (!txt) e.t = ''; }
    else if (k === 'detail') { e.detail = txt; e.detail_html = _glPlain(el.innerHTML) ? el.innerHTML : ''; }
    else e[k] = txt;
  });
  return ents;
}

/* ── CSS (سکرین + چھپائی) ── */
function _glCSS() {
  return `
    body.gl-open{ overflow:hidden; }
    @media screen{ #gl-view.gl-quick{ opacity:0; pointer-events:none; } }
    body.gl-open #toast-container{ z-index:9700; }
    #gl-view{ position:fixed; inset:0; z-index:9500; display:flex; flex-direction:column; direction:rtl; background:var(--bg-tertiary,#e9eef3); }
    .gl-strip{ flex:none; display:flex; align-items:center; justify-content:space-between; gap:10px; padding:8px 14px;
      background:var(--bg-card,#fff); border-bottom:1px solid var(--border,#ddd); box-shadow:0 2px 10px rgba(0,0,0,.08);
      font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; }
    .gl-strip-r, .gl-strip-l{ display:flex; align-items:center; gap:8px; min-width:0; }
    .gl-strip .btn{ display:inline-flex; align-items:center; gap:5px; white-space:nowrap; }
    .gl-strip-tt{ display:flex; flex-direction:column; line-height:1.3; min-width:0; }
    /* Nastaleeq کے لمبے حروف (گ، ک) اوپر سے نہ کٹیں */
    .gl-strip-t{ font-weight:700; font-size:13pt; line-height:2.1; padding-top:2px; color:var(--accent,#0369a1); white-space:nowrap; overflow:visible; }
    .gl-state{ font-size:9.5pt; color:var(--text-muted,#64748b); white-space:nowrap; }
    .gl-state[data-state="dirty"]{ color:#b45309; font-weight:700; }
    .gl-state[data-state="saved"]{ color:var(--green,#16a34a); }
    .gl-chip{ font-size:10.5pt; border:1px solid var(--border,#ccc); color:var(--text-muted,#64748b); border-radius:999px; padding:0 10px 3px; white-space:nowrap; }
    .gl-chip-on{ border-color:var(--green,#16a34a); color:var(--green,#16a34a); font-weight:700; }
    .gl-endbtn[hidden]{ display:none !important; }
    .gl-scroll{ flex:1; min-height:0; overflow:auto; -webkit-overflow-scrolling:touch; }
    .gl-zoom{ width:8.27in; margin:0 auto; }

    /* سرکاری مارجن: اوپر/نیچے 1cm · دائیں 0.5in · بائیں 0.4in (واقعاتی رپورٹ جیسا) */
    #gl-doc{ width:8.27in; min-height:11.69in; box-sizing:border-box; padding:1cm 0.5in 1cm 0.4in; margin:0 auto;
      background:#fff; color:#000; direction:rtl; text-align:right; position:relative;
      font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; font-size:14pt; line-height:1.75;
      box-shadow:0 1px 3px rgba(0,0,0,.12), 0 8px 28px rgba(0,0,0,.14); }
    #gl-doc *{ box-sizing:border-box; }
    #gl-doc [contenteditable="true"]{ font-size:inherit !important; }
    #gl-doc bdi[dir="ltr"], #gl-doc [dir="ltr"]{ font-family:'Times New Roman',Times,'Liberation Serif',serif; }
    #gl-doc .gl-f, #gl-doc .gl-e{ outline:none; min-height:1.6em; direction:rtl; unicode-bidi:isolate; overflow-wrap:anywhere; }
    #gl-doc .gl-f:focus, #gl-doc .gl-fi:focus, #gl-doc .gl-e:focus{ background:rgba(56,189,248,0.10); border-radius:3px; }
    @media screen{ #gl-doc .gl-f:empty, #gl-doc .gl-fi:empty{ background:rgba(56,189,248,0.11); border-radius:3px; } }
    #gl-doc .gl-f:empty::before, #gl-doc .gl-fi:empty::before, #gl-doc .gl-e:empty::before{ content:'\\200b'; }

    #gl-doc .gl-title-row{ display:flex; align-items:baseline; justify-content:space-between; width:100%; font-size:14pt; line-height:1.9; }
    #gl-doc .gl-tt-right{ text-align:right; white-space:nowrap; }
    #gl-doc .gl-tt-left{ text-align:left; white-space:nowrap; margin-left:1cm; }
    #gl-doc .gl-fi{ display:inline-block; min-width:24px; outline:none; direction:rtl; unicode-bidi:isolate; }

    /* عنوانات — پورے نظام کا اصول: مرکزی 20pt · ذیلی 16pt */
    #gl-doc .gl-head{ text-align:center; margin:0.08in 0 0.1in; }
    #gl-doc .gl-title{ display:inline-block; min-width:2in; font-size:20pt !important; font-weight:bold;
      text-decoration:underline; text-underline-offset:7pt; line-height:1.7; text-align:center; }
    #gl-doc .gl-h2{ font-size:16pt; font-weight:bold; line-height:1.7; margin:0.15in 0 0.03in; }

    #gl-doc .gl-table, #gl-doc .gl-etable{ width:100%; border-collapse:collapse; table-layout:fixed; }
    #gl-doc .gl-c1{ width:var(--gl-c1, 2.3in); }
    #gl-doc .gl-c3{ width:var(--gl-c3, 1.1in); }
    #gl-doc .gl-table th .gl-lbl, #gl-doc .gl-table th .gl-lbl2{ white-space:nowrap; }
    /* نمبر (موبائل، شناختی کارڈ، تاریخ) کبھی دو سطروں میں نہ ٹوٹیں؛ انگریزی لفظ (ASI…) کے دونوں طرف واضح وقفہ
       (Nastaleeq کا خالی حرف بہت تنگ ہے — اردو کے ساتھ چپک جاتا تھا) */
    #gl-doc bdi[dir="ltr"]{ white-space:nowrap; margin:0 0.15em; }
    #gl-doc .gl-lw{ margin:0 0.22em; }
    #gl-doc bdi.gl-nl{ margin-left:0; } #gl-doc bdi.gl-nr{ margin-right:0; }
    /* 4pt اوپر نیچے: متن خانے کے بیچ میں، اور Nastaleeq کے گ / ک کی لمبی لکیر اوپر والی لکیر کو نہ کاٹے */
    #gl-doc .gl-table th, #gl-doc .gl-table td, #gl-doc .gl-etable th, #gl-doc .gl-etable td{
      border:1px solid #000; padding:4pt 6pt 4pt; vertical-align:middle; font-size:14pt; line-height:1.6; }
    #gl-doc .gl-table th, #gl-doc .gl-etable th{ font-weight:bold; text-align:right; background:#f3f5f8; }
    #gl-doc .gl-etable th{ text-align:center; font-size:13pt; }
    #gl-doc .gl-cell{ position:relative; }
    /* «نمبر شمار» ایک سطر میں؛ وقت دو سطریں: «03:20» / «بجے سہ پہر» */
    #gl-doc .gl-ec-no{ width:0.8in; } #gl-doc .gl-ec-t{ width:0.95in; } #gl-doc .gl-ec-k{ width:1.25in; } #gl-doc .gl-ec-p{ width:1.45in; }
    /* کئی سطروں والا اردو متن: Nastaleeq کے لمبے حروف (گ، ک) اور نیچے کے (ے، ں) نہ کٹیں نہ اگلی سطر/لکیر پر چڑھیں —
       واقعاتی رپورٹ کی تفصیل والا 1.85 */
    #gl-doc .gl-etable td{ vertical-align:top; padding:4pt 6pt 6pt; line-height:1.85; }
    #gl-doc .gl-eno{ text-align:center; position:relative; }
    #gl-doc .gl-ell{ font-size:9.5pt; line-height:1.5; color:#333; font-family:'Times New Roman',Times,serif; direction:ltr; text-align:left; }
    #gl-doc .gl-ewho{ font-size:11pt; line-height:1.85; color:#222; border-top:1px dotted #9aa5b1; margin-top:3pt; padding-top:1pt; }
    #gl-doc .gl-edetail{ text-align:justify; text-align-last:right; }
    #gl-doc .gl-erow-empty td{ text-align:center; color:#444; }
    #gl-doc .gl-eacts{ display:flex; gap:3px; justify-content:center; margin-top:2pt; }
    #gl-doc .gl-eacts button{ width:24px; height:24px; border-radius:5px; border:1px solid #0369a1; background:#fff; color:#0369a1;
      display:inline-grid; place-items:center; padding:0; cursor:pointer; }
    #gl-doc .gl-eacts button svg{ width:13px; height:13px; }
    #gl-doc .gl-eacts button:last-child{ border-color:#dc2626; color:#dc2626; }
    #gl-doc .gl-sum{ font-size:13pt; line-height:1.8; padding:3pt 2pt 0; }
    #gl-doc .gl-sum bdi[dir="ltr"]{ font-size:12pt; }
    #gl-doc .gl-remarks{ border:1px solid #000; min-height:0.5in; padding:6pt 8pt 4pt; text-align:justify; text-align-last:right; line-height:1.85; }

    /* 📅 / 🕒 — خانے کے بائیں کنارے پر (صرف سکرین؛ چھپائی میں نہیں) */
    @media screen{ #gl-doc .gl-cell.has-pick{ padding-left:28px; } }
    #gl-doc .gl-pick{ position:absolute; left:0; top:2pt; width:24px; height:24px; border-radius:5px; background:#0369a1; color:#fff;
      cursor:pointer; overflow:hidden; border:0; padding:0; display:inline-grid; place-items:center; }
    #gl-doc .gl-pick select, #gl-doc .gl-pick input{ position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:pointer; border:0; padding:0; }

    #gl-doc .gl-final, #gl-doc .gl-tail{ break-inside:avoid; page-break-inside:avoid; }
    #gl-doc .gl-tail{ padding-top:0.12in; }
    #gl-doc .gl-closing-row{ text-align:center; }
    #gl-doc .gl-closing{ display:inline-block; min-width:2in; text-align:center; }
    #gl-doc .gl-end{ display:flex; justify-content:flex-end; margin-top:0.04in; }
    #gl-doc .gl-endbox{ width:3.6in; text-align:center; }
    #gl-doc .gl-signspace{ height:0.32in; }
    #gl-doc .gl-signline{ font-weight:bold; text-align:center; }
    #gl-doc .gl-signdate{ text-align:center; font-size:12pt !important; }

    @media screen and (min-width:761px){ .gl-scroll{ padding:14px 0 24px; } }
    @media screen and (max-width:760px){
      .gl-strip{ flex-wrap:wrap; padding:6px 8px; gap:6px; }
      .gl-strip-r{ flex:1 1 100%; }
      .gl-strip-l{ flex:1 1 100%; overflow-x:auto; scrollbar-width:none; padding-bottom:1px; }
      .gl-strip-l::-webkit-scrollbar{ display:none; }
      .gl-strip-l .btn{ flex:0 0 auto; padding:4px 10px; min-height:40px; }
      .gl-strip .gl-chip{ margin-inline-start:auto; }
      .gl-strip-l .gl-addbtn{ order:-3; } .gl-strip-l .gl-savebtn{ order:-2; } .gl-strip-l [data-dio-print]{ order:-1; }
      #gl-view:not(.gl-a4){ background:#fff; }
      #gl-view:not(.gl-a4) .gl-scroll{ background:#fff; }
      #gl-view:not(.gl-a4) .gl-zoom{ width:100%; zoom:1 !important; }
      #gl-view:not(.gl-a4) #gl-doc{ width:100%; min-height:100%; padding:12px 12px 28px; box-shadow:none; }
      /* موبائل منظر: تفصیل کا جدول — ہر خانہ اپنی قطار میں (لیبل 33%)؛ چھپائی پھر بھی A4 والا */
      #gl-view:not(.gl-a4) #gl-doc .gl-table, #gl-view:not(.gl-a4) #gl-doc .gl-table tbody{ display:block; }
      #gl-view:not(.gl-a4) #gl-doc .gl-table colgroup{ display:none; }
      #gl-view:not(.gl-a4) #gl-doc .gl-table tr{ display:grid; grid-template-columns:33% minmax(0,1fr); }
      #gl-view:not(.gl-a4) #gl-doc .gl-table th, #gl-view:not(.gl-a4) #gl-doc .gl-table td{ display:block; margin:0 0 -1px -1px; }
      #gl-view:not(.gl-a4) #gl-doc .gl-table th .gl-lbl, #gl-view:not(.gl-a4) #gl-doc .gl-table th .gl-lbl2{ white-space:normal; }
      #gl-view:not(.gl-a4) #gl-doc .gl-pick{ top:3px; width:26px; height:26px; }
      #gl-view:not(.gl-a4) #gl-doc .gl-cell.has-pick{ padding-left:30px; }
      /* موبائل منظر: اندراجات کا جدول کارڈ کی صورت (سکرین پر؛ چھپائی پھر بھی A4 جدول) */
      #gl-view:not(.gl-a4) #gl-doc .gl-etable, #gl-view:not(.gl-a4) #gl-doc .gl-etable tbody{ display:block; }
      #gl-view:not(.gl-a4) #gl-doc .gl-etable colgroup, #gl-view:not(.gl-a4) #gl-doc .gl-etable thead{ display:none; }
      #gl-view:not(.gl-a4) #gl-doc .gl-erow{ display:block; border:1px solid #000; margin-bottom:8px; }
      #gl-view:not(.gl-a4) #gl-doc .gl-erow td{ display:grid; grid-template-columns:5.2em minmax(0,1fr); gap:6px; border:0; border-bottom:1px dotted #b6c2cf; padding:2pt 6pt 3pt; }
      #gl-view:not(.gl-a4) #gl-doc .gl-erow td::before{ content:attr(data-l); font-weight:bold; font-size:12pt; color:#334155; }
      /* خانے کا ہر حصہ (مقام + Lat/Long، تفصیل + متعلقہ شخص) قیمت والے کالم میں — لیبل والے تنگ کالم میں نہ گرے */
      #gl-view:not(.gl-a4) #gl-doc .gl-erow td > *{ grid-column:2; }
      #gl-view:not(.gl-a4) #gl-doc .gl-erow td:last-child{ border-bottom:0; }
      #gl-view:not(.gl-a4) #gl-doc .gl-eno{ text-align:right; display:flex !important; align-items:center; justify-content:space-between; }
      #gl-view:not(.gl-a4) #gl-doc .gl-eno::before{ display:none; }
      #gl-view:not(.gl-a4) #gl-doc .gl-eacts button{ width:40px; height:40px; }
      #gl-view:not(.gl-a4) #gl-doc .gl-eacts button svg{ width:18px; height:18px; }
      #gl-view:not(.gl-a4) #gl-doc .gl-erow-empty, #gl-view:not(.gl-a4) #gl-doc .gl-erow-empty td{ display:block; border:1px solid #000; padding:6pt; }
      #gl-view:not(.gl-a4) #gl-doc .gl-endbox{ width:auto; min-width:60%; }
      #gl-view.gl-a4 .gl-scroll{ padding:10px 0; }
    }

    /* ── چھپائی: A4 · سرکاری مارجن ہر صفحے پر · صرف کاغذ · لمبی رپورٹ اگلے صفحے پر ── */
    @page{ size:A4 portrait; margin:1cm 0.5in 1cm 0.4in; }
    @media print{
      html, body{ background:#fff !important; }
      .gl-strip, .no-print, .gl-pick{ display:none !important; }
      #gl-view{ position:static !important; display:block !important; background:#fff !important; }
      .gl-scroll{ overflow:visible !important; height:auto !important; padding:0 !important; }
      .gl-zoom{ zoom:1 !important; width:auto !important; margin:0 !important; }
      #gl-doc{ width:auto !important; box-shadow:none !important; margin:0 !important; min-height:0 !important; padding:0 !important; }
      #gl-doc .gl-f:empty, #gl-doc .gl-fi:empty, #gl-doc .gl-f:focus, #gl-doc .gl-e:focus{ background:none !important; }
      #gl-doc .gl-table th, #gl-doc .gl-etable th{ background:#f3f5f8 !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
      #gl-doc .gl-etable thead{ display:table-header-group; }
      #gl-doc .gl-etable tr, #gl-doc .gl-table tr{ break-inside:avoid; page-break-inside:avoid; }
      #gl-doc .gl-h2{ break-after:avoid; page-break-after:avoid; }
    }`;
}

/* ── سکرین پر پورا کاغذ (zoom) — موبائل منظر میں zoom نہیں ── */
let _glA4View = false;
function _glFit() {
  const sc = document.getElementById('gl-scroll');
  const z = document.getElementById('gl-zoom');
  const v = document.getElementById('gl-view');
  if (!sc || !z) return;
  if (v && !v.classList.contains('gl-a4')) { z.style.zoom = '1'; return; }
  const pageW = 8.27 * GL_PX_IN + 8;
  const avail = sc.clientWidth;
  const k = (avail > 0 && avail < pageW) ? Math.max(0.3, avail / pageW) : 1;
  z.style.zoom = String(Math.floor(k * 1000) / 1000);
}
window._glFit = _glFit;
function _glToggleView() {
  _glA4View = !_glA4View;
  const v = document.getElementById('gl-view');
  if (v) v.classList.toggle('gl-a4', !_glPhone() || _glA4View);
  const b = document.querySelector('#gl-view-btn span');
  if (b) b.textContent = _glA4View ? 'موبائل منظر' : 'A4 منظر';
  _glFit();
  _glFitLabels();
}
window._glToggleView = _glToggleView;
// پہلے کالم کی چوڑائی = سب سے لمبا لیبل (ایک سطر میں) + خانے کی اندرونی جگہ۔
// ناپ کاغذ سے باہر الگ پیمانے پر: موبائل منظر میں لیبل ٹوٹ کر دو سطریں بنتے ہیں اور A4 منظر میں zoom لگا ہوتا ہے —
// وہاں ناپنے سے کالم تنگ بنتا تھا اور چھپائی میں لیبل ساتھ والے خانے پر چڑھ جاتا تھا۔
function _glFitLabels(doc) {
  doc = doc || document.getElementById('gl-doc');
  if (!doc || !document.body) return;
  const probe = document.createElement('span');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;font-weight:bold;font-size:14pt;letter-spacing:normal;';
  probe.style.fontFamily = getComputedStyle(doc).fontFamily;
  document.body.appendChild(probe);
  const widest = sel => {
    let mx = 0;
    doc.querySelectorAll(sel).forEach(s => { probe.textContent = s.textContent; mx = Math.max(mx, probe.getBoundingClientRect().width); });
    return mx;
  };
  const mx = widest('.gl-table th .gl-lbl'), m2 = widest('.gl-table th .gl-lbl2');
  probe.remove();
  if (mx > 0) doc.style.setProperty('--gl-c1', Math.ceil(mx + 16 + 2 + 4) + 'px');
  if (m2 > 0) doc.style.setProperty('--gl-c3', Math.ceil(m2 + 16 + 2 + 4) + 'px');
}

/* ═════════════ خانوں کے اوزار ═════════════ */
function _glCell(k) { return document.querySelector('#gl-doc [data-k="' + k + '"]'); }
function _glSetCell(k, html) {
  const el = _glCell(k);
  if (!el) return;
  el.innerHTML = html;
  _glIsolateNums(el, true);
  _glMarkDirty(true); _glDraftSoon();
}
function _glRefreshDuration() {
  const d = _glDuration(_glMeta.start_iso, _glMeta.end_iso);
  const el = _glCell('duration');
  if (el) el.innerHTML = d;
}
function _glSetDate(v) {
  if (!v) return;
  // تاریخ بدلی تو روانگی/واپسی بھی اتنے ہی دن آگے پیچھے (وقت وہی)
  const old = _glMeta.date_iso;
  if (old && old !== v) {
    const days = Math.round((Date.parse(v + 'T00:00Z') - Date.parse(old + 'T00:00Z')) / 86400000);
    ['start', 'end'].forEach(k => {
      const iso = _glMeta[k + '_iso'];
      if (iso && days) _glMeta[k + '_iso'] = _glAddDays(iso.slice(0, 10), days) + iso.slice(10);
    });
  }
  _glMeta.date_iso = v;
  _glSetCell('date', _glDtHtml(v));
  ['start', 'end'].forEach(k => { if (_glMeta[k + '_iso']) _glSetCell(k, _glDtShort(_glMeta[k + '_iso'])); });
}
window._glSetDate = _glSetDate;
function _glSetDt(k, v) {
  if (!v) return;
  _glMeta[k + '_iso'] = v;
  _glSetCell(k, _glDtShort(v));
  _glRefreshDuration();
  if (k === 'end') _glSetActiveUi(false);
}
window._glSetDt = _glSetDt;
function _glSetActiveUi(active) {
  const c = document.getElementById('gl-chip');
  if (c) { c.textContent = active ? 'جاری' : 'مکمل'; c.classList.toggle('gl-chip-on', !!active); }
  const b = document.getElementById('gl-endbtn');
  if (b) b.hidden = !active;
}

/* ═════════════ اندراج (مشترکہ «نیا اندراج» کارڈ) ═════════════ */
let _glEIdx = -1;      // -1 = نیا اندراج
let _glELat = null, _glELng = null;
function _glKindOptions() {
  const cnt = {};
  _glList.forEach(r => _glEntriesOf(r).forEach(e => { const k = String(e.kind || '').trim(); if (k && k.length <= 40) cnt[k] = (cnt[k] || 0) + 1; }));
  const all = GL_KINDS.slice();
  Object.keys(cnt).forEach(k => { if (!all.includes(k)) all.push(k); });
  const idx = n => { const i = GL_KINDS.indexOf(n); return i < 0 ? 999 : i; };
  return all.filter(n => n !== 'دیگر').sort((a, b) => ((cnt[b] || 0) - (cnt[a] || 0)) || (idx(a) - idx(b)) || a.localeCompare(b)).concat('دیگر');
}
function _glEntryCard(i) {
  if (!_glGuard('گشت اندراج')) return;
  const D = window.DIOCard;
  if (!D) { _glToast('اندراج کارڈ ابھی دستیاب نہیں — صفحہ تازہ کریں', 'error'); return; }
  _glMeta.entries = _glReadEntries();
  _glEIdx = (typeof i === 'number' && i >= 0 && _glMeta.entries[i]) ? i : -1;
  const x = _glEIdx >= 0 ? _glMeta.entries[_glEIdx] : {};
  _glELat = x.lat !== undefined ? x.lat : null;
  _glELng = x.lng !== undefined ? x.lng : null;
  const now = _glNowIso().slice(11, 16);
  const kinds = _glKindOptions();
  const kindVal = x.kind || '';
  const opts = [['', 'نوعیت منتخب کریں']].concat(kinds.map(k => [k, k]));
  if (kindVal && !kinds.includes(kindVal)) opts.push([kindVal, kindVal]);
  const body =
    D.row([
      D.fld({ id: 'gle-time', label: 'وقت', type: 'time', req: true, value: x.t || now }),
      D.fld({ id: 'gle-kind', label: 'نوعیت', type: 'sel', req: true, w: 'w-l', grow: true, value: kindVal, opts: opts }),
    ]) +
    D.row([
      D.fld({ id: 'gle-place', label: 'مقام', w: 'w-l', grow: true, value: x.place || '', ph: 'مثلاً: چوک کمہاراں والا' }),
      D.fld({ id: 'gle-ll', label: 'Lat, Long', w: 'gl-w-ll', ltr: true, value: _glLatLngText(_glELat, _glELng), ph: '30.157458, 71.524918',
        html: '<div class="dio-wb"><input class="dio-c ltr" id="gle-ll" type="text" dir="ltr" placeholder="30.157458, 71.524918" value="' + _glE(_glLatLngText(_glELat, _glELng)) + '">' +
          '<button type="button" class="dio-ib" title="موجودہ مقام لیں" aria-label="موجودہ مقام لیں" onclick="_glEntryLoc(false)">' + GL_ICON.pin + '</button></div>' }),
    ]) +
    D.row([
      D.fld({ id: 'gle-person', label: 'متعلقہ شخص (اگر ہو)', w: 'w-l', grow: true, value: x.person || '', ph: 'نام ولد … سکنہ …' }),
      D.fld({ id: 'gle-mobile', label: 'موبائل', type: 'mob', value: x.mobile || '' }),
    ]) +
    D.row([D.fld({ id: 'gle-detail', label: 'تفصیل و کارروائی', type: 'area', req: true, line: true, value: x.detail || '',
      ph: 'کیا ہوا، کیا دیکھا، کیا کارروائی کی…' })]);
  if (!document.getElementById('gl-card-css')) {
    const st = document.createElement('style');
    st.id = 'gl-card-css';
    st.textContent = '.dio-f.gl-w-ll{--w:15.5em}';
    document.head.appendChild(st);
  }
  D.open('گشت اندراج', _glEIdx >= 0, body, '_glEntrySave()', 'محفوظ کریں');
  if (_glEIdx < 0 && _glELat === null) _glEntryLoc(true);
}
window._glEntryCard = _glEntryCard;
function _glEntryLoc(silent) {
  if (!navigator.geolocation) { if (!silent) _glToast('اس آلے پر مقام کی سہولت نہیں', 'error'); return; }
  if (!silent) _glToast('مقام لیا جا رہا ہے…', 'info', 2500);
  navigator.geolocation.getCurrentPosition(p => {
    const el = document.getElementById('gle-ll');
    if (!el) return;
    el.value = _glLatLngText(+p.coords.latitude.toFixed(6), +p.coords.longitude.toFixed(6));
    if (!silent) _glToast('مقام مل گیا (درستگی تقریباً ' + Math.round(p.coords.accuracy || 0) + ' میٹر)', 'success');
  }, err => {
    if (!silent) _glToast(err && err.code === 1 ? 'مقام کی اجازت نہیں دی گئی' : 'مقام نہیں مل سکا', 'error');
  }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
}
window._glEntryLoc = _glEntryLoc;
async function _glEntrySave() {
  const v = id => ((document.getElementById(id) || {}).value || '').trim();
  const t = v('gle-time'), kind = v('gle-kind'), detail = v('gle-detail');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) { _glToast('وقت درست لکھیں (HH:MM)', 'error'); return; }
  if (!kind) { _glToast('نوعیت منتخب کریں', 'error'); return; }
  if (!detail) { _glToast('تفصیل و کارروائی لکھیں', 'error'); return; }
  const mob = v('gle-mobile');
  if (mob && mob.replace(/\D/g, '').length !== 11) { _glToast('موبائل نمبر 0000-0000000 کی صورت میں پورا لکھیں', 'error'); return; }
  const ll = _glParseLatLng(v('gle-ll'));
  const e = { id: (_glEIdx >= 0 && _glMeta.entries[_glEIdx].id) || ('e' + Date.now().toString(36)), t, kind, place: v('gle-place'),
    person: v('gle-person'), mobile: mob, detail };
  if (ll) { e.lat = ll.lat; e.lng = ll.lng; }
  // ترتیب وہی جس میں درج ہوئے (آدھی رات کے بعد کے اندراج وقت سے ترتیب دینے پر اوپر چلے جاتے)
  if (_glEIdx >= 0) _glMeta.entries[_glEIdx] = e; else _glMeta.entries.push(e);
  if (typeof closeModal === 'function') closeModal();
  _glRedrawEntries();
  _glMarkDirty(true);
  await _glSave({ what: 'اندراج' });   // میدان میں کام — ہر اندراج فوراً محفوظ
}
window._glEntrySave = _glEntrySave;
async function _glEntryDel(i) {
  if (!_glGuard('اندراج حذف')) return;
  _glMeta.entries = _glReadEntries();
  const e = _glMeta.entries[i];
  if (!e) return;
  if (!confirm(`اندراج نمبر ${i + 1} (${e.kind || '—'}) حذف کریں؟`)) return;
  _glMeta.entries.splice(i, 1);
  _glRedrawEntries();
  _glMarkDirty(true);
  await _glSave({ what: 'اندراج کا حذف' });
}
window._glEntryDel = _glEntryDel;
// فہرست / Dashboard سے: جاری گشت میں سیدھا اندراج (کھلا ہو یا نہ ہو)
function _glQuickEntry(id) {
  const r = id ? _glList.find(x => String(x.id) === String(id)) : _glActive();
  if (!r) { _glNew(); return; }
  if (!_glOpen(r.id)) return;
  // اندراج صرف اسی گشت میں — کوئی اور کھلا رہ گیا ہو تو نہیں
  if (document.getElementById('gl-doc') && _glCur && String(_glCur.id) === String(r.id)) _glEntryCard(-1);
}
window._glQuickEntry = _glQuickEntry;

/* ═════════════ گشت ختم ═════════════ */
async function _glEnd() {
  if (!_glGuard('گشت ختم')) return;
  if (!_glMeta.end_iso) {
    const now = _glNowIso();
    _glMeta.end_iso = now;
    _glSetCell('end', _glDtShort(now));
    _glRefreshDuration();
  }
  _glSetActiveUi(false);
  await _glSave({ what: 'گشت مکمل' });
}
window._glEnd = _glEnd;
async function _glEndRow(id) {
  if (!_glOpen(id)) return;
  if (document.getElementById('gl-doc') && _glCur && String(_glCur.id) === String(id)) await _glEnd();
}
window._glEndRow = _glEndRow;

/* ═════════════ جمع / محفوظ ═════════════ */
function _glCollect(noIso) {
  const f = {};
  if (!noIso) _glIsolateNums(document.getElementById('gl-doc'));
  document.querySelectorAll('#gl-doc [data-k]').forEach(el => { f[el.dataset.k] = _glPlain(el.innerHTML) ? el.innerHTML : ''; });
  return f;
}
function _glBuildRecord(f) {
  const p = k => _glPlain(f[k] || '');
  const ents = _glReadEntries();
  _glMeta.entries = ents;
  const dateIso = _glMeta.date_iso || _glIsoDate(p('date')) || (_glMeta.start_iso || '').slice(0, 10) || _glNowIso().slice(0, 10);
  const toTs = iso => (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(iso || '') ? iso + ':00+05:00' : null);
  const data = {
    _form: GL_FORM, f,
    date_iso: dateIso, start_iso: _glMeta.start_iso || '', end_iso: _glMeta.end_iso || '',
    entries: ents.map(e => { const o = { ...e }; Object.keys(o).forEach(k => { if (o[k] === '' || o[k] === undefined) delete o[k]; }); return o; }),
    name: String(_glMeta.name || '').trim(),
    saved_at: new Date().toISOString(),
  };
  return {
    gasht_date: dateIso,
    area: p('area').slice(0, 500),
    status: data.end_iso ? 'mukammal' : 'jari',
    started_at: toTs(data.start_iso),
    ended_at: toTs(data.end_iso),
    data,
  };
}
function _glIsMissingTable(e) {
  const m = String((e && (e.message || e.details)) || e || ''), c = String((e && e.code) || '');
  return c === 'PGRST205' || c === '42P01' || /could not find the table|relation .*gasht_logs.* does not exist/i.test(m);
}
function _glIsNetErr(e) {
  if (!navigator.onLine) return true;
  const m = String((e && (e.message || e.details)) || e || '');
  return !(e && e.code) && /Failed to fetch|NetworkError|Load failed|network|timeout|ERR_NAME|ERR_INTERNET/i.test(m);
}
function _glPutInList(rec) {
  const i = _glList.findIndex(x => String(x.id) === String(rec.id));
  if (i >= 0) _glList[i] = rec; else _glList.unshift(rec);
  _glList.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  _glStoreLocal();
}
// سرور پر: نیا → insert · پرانا → update — نتیجہ ہمیشہ دیکھ کر (v547)؛ 0 قطار = ناکامی
async function _glPush(rec, cur) {
  const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
  if (!oid) throw new Error(navigator.onLine ? 'لاگ ان مکمل نہیں — دوبارہ کوشش کریں' : 'Failed to fetch');
  const full = { ...rec, officer_id: oid };
  const isTmp = !cur || !cur.id || String(cur.id).indexOf('tmp_') === 0;
  if (!isTmp) return dioWriteOk(await supabaseClient.from(GL_TABLE).update(full).eq('id', cur.id).select().maybeSingle(), 'gasht update', true);
  return dioWriteOk(await supabaseClient.from(GL_TABLE).insert(full).select().single(), 'gasht insert', true);
}

let _glSaving = false;
async function _glSave(opts) {
  opts = opts || {};
  if (!document.getElementById('gl-doc')) return false;
  if (!_glGuard('محفوظ کرنا')) return false;
  if (_glSaving) { _glToast('محفوظ ہو رہا ہے…', 'info', 1500); return false; }
  const f = _glCollect();
  const rec = _glBuildRecord(f);
  const cur = _glCur;
  const what = opts.what || 'گشت';
  _glSaving = true;
  try {
    const saved = await _glPush(rec, cur);
    delete saved._pending;
    if (cur && String(cur.id) !== String(saved.id)) _glList = _glList.filter(x => String(x.id) !== String(cur.id));
    _glCur = saved;
    _glNoTable = false;
    _glPutInList(saved);
    _glMarkDirty(false); _glDraftClear();
    _glUpdateTitle();
    _glToast(what === 'گشت' ? 'گشت محفوظ ہو گیا' : what + ' — محفوظ ہو گیا', 'success');
    return true;
  } catch (e) {
    const offline = _glIsNetErr(e), noTable = _glIsMissingTable(e);
    if (offline || noTable) {
      if (noTable) _glNoTable = true;
      const now = new Date().toISOString();
      const local = { ...(cur || {}), ...rec, id: (cur && cur.id) || ('tmp_' + Date.now()), created_at: (cur && cur.created_at) || now, _pending: true };
      _glCur = local;
      _glPutInList(local);
      _glMarkDirty(false); _glDraftClear();
      _glUpdateTitle();
      _glToast(noTable ? what + ' اس آلے پر محفوظ — ڈیٹابیس اپڈیٹ (sql/104) ابھی نہیں چلی؛ چلتے ہی خود سرور پر'
        : 'انٹرنیٹ نہیں — ' + what + ' اس آلے پر محفوظ؛ انٹرنیٹ آتے ہی خود سرور پر چلا جائے گا', 'info', 6000);
      return true;
    }
    if (typeof dioWriteFail === 'function') dioWriteFail(what, e, 'محفوظ نہیں ہوا');
    else _glToast('محفوظ نہیں ہوا: ' + ((e && e.message) || e), 'error', 6000);
    console.error('gl save:', e);
    return false;
  } finally { _glSaving = false; }
}
window._glSave = _glSave;

let _glSyncing = false;
async function _glSyncPending() {
  if (_glSyncing || !navigator.onLine) return;
  const pend = _glList.filter(x => x._pending);
  if (!pend.length) return;
  _glSyncing = true;
  let n = 0;
  try {
    for (const p of pend) {
      const rec = { gasht_date: p.gasht_date, area: p.area, status: p.status, started_at: p.started_at, ended_at: p.ended_at, data: p.data };
      try {
        const saved = await _glPush(rec, p);
        delete saved._pending;
        _glList = _glList.filter(x => String(x.id) !== String(p.id));
        _glList.push(saved);
        if (_glCur && String(_glCur.id) === String(p.id)) _glCur = saved;
        n++;
      } catch (e) { console.warn('gl sync:', e && e.message); if (_glIsNetErr(e) || _glIsMissingTable(e)) break; }
    }
  } finally { _glSyncing = false; }
  if (n) {
    _glList.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
    _glStoreLocal();
    _glToast(`${n} گشت سرور پر محفوظ ہو گئے`, 'success');
    if (!document.getElementById('gl-view') && window._activePage === 'gasht') _glRenderList();
  }
}
window.addEventListener('online', () => { setTimeout(_glSyncPending, 1500); });

function _glUpdateTitle() {
  const t = document.getElementById('gl-strip-t');
  if (!t || !_glCur) return;
  const i = _glList.findIndex(x => String(x.id) === String(_glCur.id));
  if (i >= 0) t.textContent = 'گشت #' + (_glList.length - i);
  const grp = document.querySelector('.gl-strip-l');
  const onc = `_glDelete('${_glE(String(_glCur.id))}')`;
  const d = grp && grp.querySelector('.gl-del');
  if (grp && !d) grp.insertAdjacentHTML('beforeend', `<button type="button" class="btn btn-danger btn-sm gl-del" onclick="${onc}" title="حذف" aria-label="حذف">${GL_ICON.del}</button>`);
  else if (d) d.setAttribute('onclick', onc);
  _glSetActiveUi(!_glMeta.end_iso);
  _glMarkDirty(_glDirty);
}

/* ═════════════ محفوظ گشت: نام بدلیں / کاپی / شیئر / پرنٹ / حذف ═════════════ */
function _glRowRecord(r) {
  return { gasht_date: r.gasht_date, area: r.area, status: r.status, started_at: r.started_at, ended_at: r.ended_at, data: { ..._glData(r) } };
}
async function _glWriteRow(rec, cur) {
  try {
    const saved = await _glPush(rec, cur);
    delete saved._pending;
    _glPutInList(saved);
    return { row: saved, offline: false };
  } catch (e) {
    if (!_glIsNetErr(e) && !_glIsMissingTable(e)) throw e;
    const local = { ...(cur || {}), ...rec, _pending: true };
    _glPutInList(local);
    return { row: local, offline: true };
  }
}
async function _glRename(id) {
  const r = _glList.find(x => String(x.id) === String(id));
  if (!r || !_glGuard('نام بدلنا')) return;
  const d = _glData(r);
  const cur = String(d.name || '').trim() || _glListArea(r);
  const v = prompt('گشت کا نام لکھیں (فہرست میں یہی نظر آئے گا):', cur);
  if (v === null) return;
  const rec = _glRowRecord(r);
  rec.data.name = v.replace(/\s+/g, ' ').trim().slice(0, 120);
  try {
    const res = await _glWriteRow(rec, r);
    const b = document.getElementById('gl-list-body');
    if (b) b.innerHTML = _glListRows();
    _glToast(res.offline ? 'نام اس آلے پر بدل گیا — انٹرنیٹ آنے پر خود سرور پر' : 'نام بدل گیا', res.offline ? 'info' : 'success');
  } catch (e) {
    if (typeof dioWriteFail === 'function') dioWriteFail('نام', e, 'نہیں بدلا'); else _glToast('نام نہیں بدلا', 'error');
  }
}
window._glRename = _glRename;

function _glFieldsWithDefaults(r) {
  const d = _glData(r);
  const keep = { ..._glMeta };
  _glMeta = { date_iso: d.date_iso || r.gasht_date || '', start_iso: d.start_iso || '', end_iso: d.end_iso || '', entries: _glEntriesOf(r) };
  const def = _glDefaults();
  const f = d.f || {};
  const out = {};
  Object.keys(def).forEach(k => { out[k] = (f[k] !== undefined && _glPlain(f[k]) !== '') ? _glSan(f[k]) : (def[k] || ''); });
  _glMeta = keep;
  return { f: out, entries: _glEntriesOf(r) };
}
function _glTextReport(f, ents) {
  const p = k => _glPlain(f[k] || '');
  const lines = [p('title') || 'گشت رپورٹ', '='.repeat(40), `تھانہ: ${p('thana')}    ضلع: ${p('zila')}`];
  GL_ROWS.forEach(r => lines.push(`${r.l}: ${p(r.k)}`));
  lines.push('', 'دورانِ گشت کارروائی:');
  if (!ents.length) lines.push('کوئی اندراج نہیں');
  ents.forEach((e, i) => {
    lines.push(`${i + 1}. ${e.t || ''} — ${e.kind || ''}${e.place ? ' — ' + e.place : ''}`);
    if (e.detail) lines.push('   ' + e.detail);
    if (e.person || e.mobile) lines.push('   متعلقہ شخص: ' + [e.person, e.mobile].filter(Boolean).join(' — '));
    const ll = _glLatLngText(e.lat, e.lng);
    if (ll) lines.push('   نقشہ: https://maps.google.com/?q=' + ll.replace(/\s/g, ''));
  });
  const k = _glKindCounts(ents).map(([n, c]) => `${n}: ${c}`).join('، ');
  lines.push('', `خلاصہ: کل اندراجات ${ents.length}${k ? ' — ' + k : ''}`);
  if (p('remarks')) lines.push('', 'مشاہدات / ہدایات: ' + p('remarks'));
  lines.push('', p('closing'), p('sign_line'), p('sign_date'), '', 'Digital IO');
  return lines.join('\n');
}
function _glReportHTML(f, ents) {
  const v = k => f[k] || '';
  const td = 'border:1px solid #000;padding:3pt 6pt;vertical-align:top;';
  const rows = GL_ROWS.map(r => `<tr><th style="${td}background:#f3f5f8;text-align:right;white-space:nowrap;">${r.l}</th><td style="${td}">${v(r.k)}</td></tr>`).join('');
  const erows = ents.length ? ents.map((e, i) => `<tr><td style="${td}text-align:center;">${i + 1}</td><td style="${td}white-space:nowrap;">${e.t ? _glTimeHtml(e.t) : ''}</td><td style="${td}">${_glE(e.kind || '')}</td><td style="${td}">${_glE(e.place || '')}</td><td style="${td}">${_glE(e.detail || '')}${(e.person || e.mobile) ? '<br><span style="font-size:11pt;">متعلقہ شخص: ' + _glE([e.person, e.mobile].filter(Boolean).join(' — ')) + '</span>' : ''}</td></tr>`).join('')
    : `<tr><td colspan="5" style="${td}text-align:center;">دورانِ گشت کوئی کارروائی درج نہیں</td></tr>`;
  const th = s => `<th style="${td}background:#f3f5f8;text-align:center;">${s}</th>`;
  return `<div dir="rtl" lang="ur" style="font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;font-size:14pt;line-height:1.75;color:#000;">
<table style="width:100%;border:0;font-size:14pt;"><tr><td style="text-align:right;">تھانہ ${v('thana')}</td><td style="text-align:left;">ضلع ${v('zila')}</td></tr></table>
<p style="text-align:center;font-size:20pt;font-weight:bold;text-decoration:underline;margin:6pt 0;">${v('title')}</p>
<table dir="rtl" style="width:100%;border-collapse:collapse;font-size:14pt;">${rows}</table>
<p style="font-size:16pt;font-weight:bold;margin:10pt 0 4pt;">دورانِ گشت کارروائی</p>
<table dir="rtl" style="width:100%;border-collapse:collapse;font-size:14pt;"><tr>${th('نمبر شمار')}${th('وقت')}${th('نوعیت')}${th('مقام')}${th('تفصیل و کارروائی')}</tr>${erows}</table>
${_glPlain(v('remarks')) ? `<p style="font-size:16pt;font-weight:bold;margin:10pt 0 4pt;">مشاہدات / ہدایات</p><p>${v('remarks')}</p>` : ''}
<p style="text-align:center;margin:12pt 0 0;">${v('closing')}</p>
<p style="text-align:left;margin:30pt 0 0;"><b>${v('sign_line')}</b><br>${v('sign_date')}</p></div>`;
}
async function _glCopyText(html, txt) {
  try {
    if (navigator.clipboard && window.ClipboardItem && navigator.clipboard.write) {
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([txt], { type: 'text/plain' }) })]);
      return true;
    }
  } catch (e) { console.warn('gl copy (rich):', e && e.message); }
  try { if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(txt); return true; } }
  catch (e) { console.warn('gl copy (text):', e && e.message); }
  return false;
}
async function _glCopyRow(id) {
  const r = _glList.find(x => String(x.id) === String(id));
  if (!r) return;
  const { f, entries } = _glFieldsWithDefaults(r);
  const ok = await _glCopyText(_glReportHTML(f, entries), _glTextReport(f, entries));
  _glToast(ok ? 'گشت رپورٹ نقل ہو گئی — Word، Gmail، WhatsApp وغیرہ میں چسپاں (Paste) کریں' : 'نقل نہیں ہو سکی — «شیئر» استعمال کریں', ok ? 'success' : 'error', 4500);
}
window._glCopyRow = _glCopyRow;
function _glShareText(txt) {
  if (navigator.share) { navigator.share({ title: 'گشت رپورٹ', text: txt }).catch(() => { /* افسر نے بند کر دیا */ }); return; }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(() => _glToast('متن نقل ہو گیا — جہاں بھیجنا ہو وہاں چسپاں کریں', 'info'), () => _glToast('نقل نہیں ہو سکا', 'error'));
  } else _glToast('اس آلے پر شیئر کی سہولت نہیں — ڈاؤن لوڈ استعمال کریں', 'info');
}
function _glShareRow(id) {
  const r = _glList.find(x => String(x.id) === String(id));
  if (!r) return;
  // پوری فائل (PDF + Word): رپورٹ کھول کر اسی کا کاغذ
  if (typeof dioShareDoc === 'function') {
    _glOpen(id);
    setTimeout(() => { const el = document.getElementById('gl-doc'); if (el) dioShareDoc(el, 'گشت رپورٹ'); }, 900);
    return;
  }
  const { f, entries } = _glFieldsWithDefaults(r);
  _glShareText(_glTextReport(f, entries));
}
window._glShareRow = _glShareRow;
function _glShare() {
  if (!document.getElementById('gl-doc')) return;
  if (typeof dioShareDoc === 'function') { dioShareDoc(document.getElementById('gl-doc'), 'گشت رپورٹ'); return; }
  _glShareText(_glTextReport(_glCollect(), _glReadEntries()));
}
window._glShare = _glShare;
function _glDownload() {
  if (!document.getElementById('gl-doc')) return;
  const date = (_glMeta.date_iso ? _glDmy(_glMeta.date_iso) : _glDmy(_glNowIso())).replace(/\//g, '-');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + _glTextReport(_glCollect(), _glReadEntries())], { type: 'text/plain;charset=utf-8' }));
  a.download = `Gasht-Report-${date}.txt`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  _glToast('گشت رپورٹ ڈاؤن لوڈ ہو رہی ہے — PDF کے لیے «پرنٹ» میں «Save as PDF» چنیں', 'success', 5000);
}
window._glDownload = _glDownload;

// صرف براؤزر کی اپنی چھپائی (Ctrl+P جیسی) — صرف کاغذ۔ پڑھنا اور چھاپنا سبسکرپشن پر بند نہیں۔
function _glPrint() {
  if (!document.getElementById('gl-doc')) return;
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  _glFitLabels();
  window.print();
}
window._glPrint = _glPrint;
// فہرست سے، کھولے بغیر — وہی چھپائی جو کھلا گشت کرتا ہے (ایک ہی راستہ)
function _glPrintRow(id) {
  const r = _glList.find(x => String(x.id) === String(id));
  if (!r) return;
  _glCur = r;
  const d = _glData(r);
  _glMeta = { date_iso: d.date_iso || r.gasht_date || '', start_iso: d.start_iso || '', end_iso: d.end_iso || '', entries: _glEntriesOf(r).map(e => ({ ...e })), name: d.name || '' };
  _glDirty = false;
  _glRenderDoc();
  const v = document.getElementById('gl-view');
  if (!v) return;
  v.classList.add('gl-quick');
  let done = false;
  const finish = () => {
    if (done) return; done = true;
    window.removeEventListener('afterprint', onAfter);
    setTimeout(() => {
      if (!v.isConnected || !v.classList.contains('gl-quick')) return;
      v.remove();
      if (!document.getElementById('gl-view')) document.body.classList.remove('gl-open');
      document.removeEventListener('keydown', _glKeys);
      _glCur = null; _glDirty = false;
    }, 0);
  };
  const onAfter = () => finish();
  window.addEventListener('afterprint', onAfter);
  setTimeout(finish, 120000);
  _glPrint();
}
window._glPrintRow = _glPrintRow;

// حذف — پہلے «حذف شدہ مواد» میں نقل، پھر اصل (v547)
async function _glDelete(id) {
  const r = _glList.find(x => String(x.id) === String(id));
  if (!r) return;
  if (!confirm('یہ گشت حذف کریں؟ (حذف شدہ مواد میں چلا جائے گا)')) return;
  const isTmp = String(id).indexOf('tmp_') === 0;
  if (!isTmp) {
    if (!_glGuard('حذف')) return;
    if (!navigator.onLine) { _glToast('حذف کے لیے انٹرنیٹ درکار ہے', 'error'); return; }
    let binId = false;
    try {
      const clean = { ...r }; delete clean._pending;
      binId = await dioBinCopy('gasht', id, clean);
      if (!binId) throw new Error('«حذف شدہ مواد» میں نقل نہیں ہو سکی — دوبارہ کوشش کریں');
      dioWriteOk(await supabaseClient.from(GL_TABLE).delete().eq('id', id).select('id'), 'gasht delete', true);
    } catch (e) {
      if (binId) await softDeleteUndo(binId);
      if (typeof dioWriteFail === 'function') dioWriteFail('گشت', e, 'حذف نہیں ہوا'); else _glToast('حذف نہیں ہوا', 'error');
      return;
    }
  }
  _glList = _glList.filter(x => String(x.id) !== String(id));
  _glStoreLocal();
  _glToast('گشت «حذف شدہ مواد» میں منتقل ہو گیا', 'info');
  if (document.getElementById('gl-view') && _glCur && String(_glCur.id) === String(id)) _glClose(true);
  else if (window._activePage === 'gasht') _glRenderList();
}
window._glDelete = _glDelete;
