/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — APP CORE  (app-core.js)
   Auth · Data · UI · Voice · Penal Codes · Notifications
   Digital IO — Tafteeshi Officer ka Chhotu
   ═══════════════════════════════════════════════════════════ */

// (صفائی کے دوران غلطی سے ہٹ گئے تھے — واپس)
let _usageBuffer = {};
const _usageKey = 'dio_btn_usage';
let _usageTimer = null;

// ── SUPABASE ──────────────────────────────────────────────────
const SUPABASE_URL = 'https://bbrhtokynxmljumxyaeh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJicmh0b2t5bnhtbGp1bXh5YWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MzU5ODIsImV4cCI6MjA5NTUxMTk4Mn0.o4uKyqhIx9vWDX-CeJjwujWUYK6Cy0XzEZ5fw_efQMA';
if (!window.supabase || !window.supabase.createClient) {
  document.addEventListener('DOMContentLoaded', function(){
    // Wait a moment in case CDN is still loading, then show a retry UI
    setTimeout(function(){
      if (!window.supabase || !window.supabase.createClient) {
        document.body.innerHTML = '<div style="font-family:sans-serif;direction:rtl;text-align:center;padding:40px 20px;max-width:400px;margin:60px auto;background:#0f1923;color:#e5eef5;border-radius:16px;border:1px solid #1e3a52;">'
          + '<div style="font-size:48px;margin-bottom:16px;"><svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.42;display:inline-block;vertical-align:middle"><path d="M4.5 15a10.5 10.5 0 0 1 15 0"/><path d="M8 18.2a6 6 0 0 1 8 0"/><path d="M12 21h.01"/><path d="M2 11.5a14.5 14.5 0 0 1 20 0"/></svg></div>'
          + '<div style="font-size:18px;font-weight:700;margin-bottom:10px;">کنکشن کا مسئلہ</div>'
          + '<div style="font-size:14px;color:#7d97ad;line-height:1.8;margin-bottom:20px;">انٹرنیٹ سے لائبریری لوڈ نہیں ہو سکی۔ براہِ کرم انٹرنیٹ چیک کریں اور دوبارہ کوشش کریں۔</div>'
          + '<button onclick="location.reload(true)" style="background:#38bdf8;color:#fff;border:none;border-radius:10px;padding:12px 28px;font-size:15px;font-weight:700;cursor:pointer;">دوبارہ کوشش کریں</button>'
          + '</div>';
      }
    }, 2500);
  });
}
// Khami 2: Supabase apna session default localStorage me SADA rakhta hai.
// dioSecureStorage (secure-storage.js) use encrypt kar ke rakhta hai.
// Wo file na mile to purana bartao — login kabhi na toote.
const _dioAuthOpts = (window.dioSecureStorage)
  ? { auth: { storage: window.dioSecureStorage, persistSession: true,
              autoRefreshToken: true, detectSessionInUrl: true } }
  : undefined;
const supabaseClient = (window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, _dioAuthOpts)
  : null;
window.supabaseClient = supabaseClient;

// ── GLOBAL STATE ──────────────────────────────────────────────
let currentUser    = null;
let currentOfficer = null;
let googleDriveToken = null;
const _pages = {};

// ── STATUS LABELS & CLASSES ───────────────────────────────────
const STATUS_LABELS = {
  under:       'زیر تفتیش',
  complete:    'چالان مکمل',
  incomplete:  'چالان نامکمل',
  untrace:     'عدم پتہ',
  cancel:      'اخراج',
  challan512:  'چالان 512',
};
const STATUS_CLASSES = {
  under:       'pill-blue',
  complete:    'pill-green',
  incomplete:  'pill-amber',
  untrace:     'pill-purple',
  cancel:      'pill-red',
  challan512:  'pill-amber',
};

// ── PAGE REGISTRY ─────────────────────────────────────────────
// ── ROLE-BASED ACCESS CONTROL ─────────────────────────────────
// Roles: officer < supervisor < admin < superadmin
const ROLE_LEVELS = { officer:1, supervisor:2, admin:3, superadmin:4 };

// Which pages each role can access
const ROLE_PAGES = {
  officer:    ['dashboard','cases','fivec','incident','gasht','reminders','law','ahkamat','templates','search','suspects','performance','backup','settings','bin','subscription','court','evidence','help'],
  supervisor: ['dashboard','cases','fivec','incident','gasht','reminders','law','ahkamat','templates','search','suspects','performance','backup','settings','bin','subscription','court','evidence','help'],
  admin:      ['dashboard','cases','fivec','incident','gasht','reminders','law','ahkamat','templates','search','suspects','performance','backup','settings','bin','subscription','court','evidence','help','admin'],
  superadmin: ['dashboard','cases','fivec','incident','gasht','reminders','law','ahkamat','templates','search','suspects','performance','backup','settings','bin','subscription','court','evidence','help','admin'],
};

function getRole() {
  return (currentOfficer?.role) || 'officer';
}
function roleLevel() {
  return ROLE_LEVELS[getRole()] || 1;
}
function canAccess(page) {
  const role = getRole();
  return (ROLE_PAGES[role] || ROLE_PAGES.officer).includes(page);
}
function hasRole(minRole) {
  return roleLevel() >= (ROLE_LEVELS[minRole] || 99);
}
// Supervisors+ can see team data, others only their own
function _trackUsage(page) {
  if (!page) return;
  _usageBuffer[page] = (_usageBuffer[page] || 0) + 1;
  // Debounce: flush to DB after 5 seconds of activity
  if (_usageTimer) clearTimeout(_usageTimer);
  _usageTimer = setTimeout(_flushUsage, 5000);
}

let _usageDisabled = false;
async function _flushUsage() {
  if (_usageDisabled) return;
  // Login ke baghair koi query nahi — warna 401 error console mein aata hai
  // (logout/naye session ke baad cache mein officer bacha rehta tha).
  if (typeof currentUser === 'undefined' || !currentUser) return;
  const buffer = { ..._usageBuffer };
  _usageBuffer = {};
  if (!Object.keys(buffer).length) return;
  if (!navigator.onLine) return;  // Skip when offline
  try {
    const oid = await getOfficerId();
    if (!oid) return;
    for (const [page, count] of Object.entries(buffer)) {
      const { data: existing, error: selErr } = await supabaseClient
        .from('usage_stats')
        .select('id,count')
        .eq('officer_id', oid).eq('page', page).maybeSingle();
      // If the table is not accessible (RLS/401), disable tracking entirely
      if (selErr) { _usageDisabled = true; return; }
      if (existing) {
        // v547: insert جیسا — رد ہو تو گنتی بند (پہلے update کا نتیجہ دیکھا ہی نہیں جاتا تھا)
        const { error: updErr } = await supabaseClient.from('usage_stats')
          .update({ count: (existing.count||0) + count, last_used: new Date().toISOString() })
          .eq('id', existing.id);
        if (updErr) { _usageDisabled = true; return; }
      } else {
        const { error: insErr } = await supabaseClient.from('usage_stats')
          .insert({ officer_id: oid, page, count, last_used: new Date().toISOString() });
        if (insErr) { _usageDisabled = true; return; }
      }
    }
  } catch(_) { _usageDisabled = true; }
}

function registerPage(name, fn) { _pages[name] = fn; }


function showPage(page, el) {
  // Role-based access check
  if (typeof canAccess === 'function' && !canAccess(page)) {
    /* AHEM: pehle yahan sirf aik toast tha jo chand lamhon mein gayab
       ho jata tha aur safhe par kuch bhi na likha jata. Agar us waqt
       koi "khul raha hai…" wala paigham laga hua hota (boot.js ka
       lazy-load), to afsar HAMESHA usi ko dekhta reh jata — usay pata
       hi nahi chalta ke safha rok diya gaya hai.
       Ab wajah safhe par bhi likhi jati hai. */
    showToast('آپ کو اس صفحے تک رسائی نہیں ہے', 'error');
    try {
      var _c = document.getElementById('page-content');
      if (_c) {
        _c.innerHTML = (window.DIO && DIO.states && DIO.states.permDenied)
          ? DIO.states.permDenied()
          : '<div style="text-align:center;padding:40px 20px;direction:rtl;' +
            'color:var(--text-muted);">آپ کو اس صفحے تک رسائی نہیں ہے</div>';
      }
    } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
    return;
  }
  window._activePage = page;  // Track current page for background refresh
  // صفحہ بدلنے پر آواز سے لکھنا بند (پہلے mic پچھلے صفحے پر بھی سنتا رہتا تھا)
  if (typeof window._globalMicStop === 'function') { try { window._globalMicStop(); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ } }
  window._inWorkspace = false;  // Left any workspace when navigating via menu
  document.body.classList.remove('workspace-mode');  // Restore topbar on navigation

  // Track page usage (for admin button-usage log)
  if (typeof _trackUsage === 'function') _trackUsage(page);

  // Update active nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el && el.classList) el.classList.add('active');

  // Update topbar title
  const titles = {
    dashboard:'ڈیش بورڈ', cases:'میرے مقدمات', templates:'ٹمپلیٹس',
    fivec:'مارک شدہ درخواستیں', incident:'واقعاتی رپورٹ', gasht:'گشت لاگ',
    law:'قانونی لائبریری', ahkamat:'احکامات و ضوابط', performance:'کارکردگی', backup:'بیک اپ',
    settings:'ترتیبات', admin:'ایڈمن', bin:'حذف شدہ مواد',
    reminders:'یاددہانیاں', search:'تلاش',
    court:'عدالتی پیشیاں', evidence:'شہادتیں', suspects:'ملزمان / گواہان',
    help:'رہنمائی',
  };
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = (titles[page]||page);

  // Update URL hash
  try { history.replaceState(null,'','#'+page); } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }

  // Log usage
  _logUsage('page:'+page);

  // Render page
  const container = document.getElementById('page-content');
  if (!container) return;
  container.style.padding = '16px';
  container.style.overflow = 'auto';

  if (_pages[page]) {
    try {
      _pages[page](container);
      // Auto-fix text direction for English-data + mixed fields
      if (typeof applyAutoDirection === 'function') setTimeout(() => applyAutoDirection(container), 60);
    } catch(err) {
      console.error('Page render error ['+page+']:', err);
      container.innerHTML = `<div style="padding:30px;direction:rtl;text-align:center;">
        <div style="font-size:40px;"><svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:-3px'><path d='M12 4L3 19.5h18z'/><path d='M12 10v4.5'/><path d='M12 17.2h.01'/></svg></div>
        <div style="font-size:15px;margin-top:10px;color:var(--text-secondary);">صفحہ کھولنے میں مسئلہ</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:8px;font-family:monospace;direction:ltr;">${(err&&err.message)||err}</div>
        <button class="btn btn-secondary btn-sm" style="margin-top:14px;" onclick="showPage('${page}',null)">دوبارہ کوشش</button>
      </div>`;
    }
  } else {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);">
      <div style="font-size:48px;"><svg viewBox='0 0 24 24' width='48' height='48' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='opacity:.42;display:inline-block;vertical-align:middle'><path d='M12 4L3 19.5h18z'/><path d='M12 10v4.5'/><path d='M12 17.2h.01'/></svg></div>
      <div style="font-size:16px;margin-top:12px;">${page} — جلد آ رہا ہے</div>
    </div>`;
  }
}

// ── MODAL ─────────────────────────────────────────────────────

// ── SHO کی دستخطی لائن — backup تعریف ───────────────────────────
// اصل تعریف sho-dsp.js میں ہے۔ اگر کسی وجہ سے وہ فائل لوڈ نہ ہو تو
// SHO کی لائن خالی آ جاتی تھی (اور تاریخ اکیلی رہ جاتی تھی) — اس لیے
// یہاں بھی رکھ دی ہے تاکہ کبھی غائب نہ ہو۔
if (typeof window.getSHOSignLine !== 'function') {
  window.getSHOSignLine = function (station) {
    let name = '', rank = '';
    try {
      const sho = JSON.parse(localStorage.getItem('digital_io_sho') || '{}');
      name = (sho.name || '').trim();
      rank = (sho.rank || '').trim();
    } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
    const st = (station ||
      (typeof currentOfficer !== 'undefined' && currentOfficer ? currentOfficer.station : '') || '').trim();
    const parts = [];
    if (name) parts.push(name);
    if (rank) parts.push(rank);
    let line = parts.join(' ');
    if (st) line += (line ? ' ' : '') + 'تھانہ ' + st;
    return line;
  };
}

// ── تفتیشی افسر (IO) کی دستخطی لائن ─────────────────────────────
// یہ فنکشن پہلے کہیں define نہیں تھا، مگر چار جگہ استعمال ہو رہا تھا:
//   zimni.js (1124, 2026, 3641) اور naqsha-mauqa.js (335)
// ہر جگہ `typeof getIOSignLine === 'function'` کی گارڈ لگی تھی، اس لیے
// خرابی (error) کبھی نظر نہیں آئی — بس ضمنی کی دستاویزات میں تفتیشی
// افسر کے دستخط کی لائن خاموشی سے خالی رہ جاتی تھی۔
//
// منطق نئی نہیں بنائی گئی۔ یہ darkhwastain.js کے `_dkIoLine()` کی نقل ہے
// (وہیں پہلے سے جانچی ہوئی ہے)، تاکہ پورے سسٹم میں IO کی لائن ایک جیسی
// رہے: نام + عہدہ + تھانہ۔
//
// اہم: نام ہمیشہ LOGGED-IN افسر کا (تفتیشی/subscriber) — SHO کا نہیں۔
// `digital_io_sho` سے صرف عہدہ لیا جاتا ہے، اور وہ بھی اُسی صورت جب
// افسر کے ریکارڈ میں عہدہ خالی ہو اور نام وہی ہو۔
if (typeof window.getIOSignLine !== 'function') {
  window.getIOSignLine = function (o) {
    o = o || (typeof currentOfficer !== 'undefined' ? currentOfficer : {}) || {};
    let name = (o.full_name || '').trim();
    let rank = (o.designation || '').trim();   // officers میں کالم `designation` ہے
    if (!rank) {
      try {
        const sho = JSON.parse(localStorage.getItem('digital_io_sho') || '{}');
        if ((sho.name || '').trim() === name || !name) rank = (sho.rank || '').trim();
      } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
    }
    if (!name) {
      try {
        const sho = JSON.parse(localStorage.getItem('digital_io_sho') || '{}');
        name = (sho.name || '').trim();
        if (!rank) rank = (sho.rank || '').trim();
      } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
    }
    const st = (o.station || '').trim();
    const parts = [];
    if (name) parts.push(name);
    if (rank) parts.push(rank);
    let line = parts.join(' ');
    if (st) line += (line ? ' ' : '') + 'تھانہ ' + st;
    return line.trim();
  };
}


// ═══════════════════════════════════════════════════════════════════
//  ⚠️  SECURITY — PIN / Biometric کے لیے پاسورڈ محفوظ کرنا
//  پہلے پاسورڈ btoa() سے localStorage میں رکھا جاتا تھا۔ btoa خفیہ کاری
//  (encryption) نہیں — صرف encoding ہے، جسے کوئی بھی سیکنڈوں میں کھول
//  سکتا ہے۔ پولیس کے حساس ڈیٹا کے لیے یہ خطرناک تھا۔
//  اب پاسورڈ کی جگہ Supabase کا refresh-token رکھا جاتا ہے:
//   • وہ مقررہ مدت کے بعد خود ختم ہو جاتا ہے
//   • اُس سے آپ کا اصل پاسورڈ معلوم نہیں ہو سکتا
//   • لاگ آؤٹ پر سرور کی طرف سے بھی منسوخ ہو جاتا ہے
// ═══════════════════════════════════════════════════════════════════
function openModal(title, body, footer) {
  // ہر بار کارڈ کا سائز پہلے DEFAULT پر — کسی پچھلے کارڈ (FIR متن / 5-C) کی
  // چوڑائی یا اونچائی اگلے کارڈ میں منتقل نہ ہو (نیا اندراج rule، اکتوبر 2026)
  _dioResetModalCard();
  const t = document.getElementById('modal-title');
  const b = document.getElementById('modal-body');
  const f = document.getElementById('modal-footer');
  const bd = document.getElementById('modal-backdrop');
  if (t) t.textContent  = title||'';
  if (b) b.innerHTML     = body||'';
  if (f) f.innerHTML   = footer||'';
  if (bd) {
    bd.style.display = 'flex';
    bd.style.alignItems = 'center';
    bd.style.justifyContent = 'center';
  }
  // Auto text-direction for fields inside the modal
  if (b && typeof applyAutoDirection === 'function') setTimeout(() => applyAutoDirection(b), 40);
}
function _dioResetModalCard() {
  const _mc = document.querySelector('#modal-backdrop .modal-card');
  if (_mc) {
    _mc.style.maxWidth = '980px'; _mc.style.width = '100%'; _mc.style.minHeight = '';
    _mc.classList.remove('dio-entry');
  }
  const bd = document.getElementById('modal-backdrop');
  if (bd) bd.style.padding = '16px';
  // v552: کسی ایک کارڈ کی درمیانی سرخی اگلے کارڈ میں نہ جائے
  const mt = document.getElementById('modal-title');
  if (mt) mt.classList.remove('dio-mt-center');
}
function closeModal() {
  const bd = document.getElementById('modal-backdrop');
  if (bd) bd.style.display = 'none';
  // مشترکہ modal card کا سائز واپس default (کیس فارم/FIR/5-C اسے بدلتے ہیں — باقی modals متاثر نہ ہوں)
  _dioResetModalCard();
  // کارڈ بند ہو تو آواز سے لکھنا بھی بند
  if (typeof window._globalMicStop === 'function') { try { window._globalMicStop(); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ } }
}

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg, type='info', duration=3000) {
  let t = document.getElementById('toast-msg');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast-msg';
    t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);padding:10px 20px;border-radius:8px;font-size:13px;z-index:99999;box-shadow:0 4px 14px rgba(0,0,0,0.3);font-family:"Jameel Noori Nastaleeq","Noto Nastaliq Urdu",serif;direction:rtl;max-width:90vw;text-align:center;';
    document.body.appendChild(t);
  }
  const colors = { success:'#22c55e', error:'#ef4444', info:'#38bdf8', warn:'#f59e0b' };
  t.style.background = colors[type]||colors.info;
  t.style.color = type==='warn' ? '#000' : '#fff';
  t.textContent = msg;
  t.style.display = 'block'; t.style.opacity = '1';
  clearTimeout(t._tm);
  t._tm = setTimeout(() => { t.style.opacity='0'; setTimeout(()=>{t.style.display='none';},300); }, duration);
}

// ── FORMAT HELPERS ────────────────────────────────────────────
// ── GLOBAL XSS-SAFE ESCAPE ────────────────────────────────────
// Use esc() around ANY user-entered value rendered into innerHTML.
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
window.esc = esc;
// اِن لائن onclick="..(' ${data} ')" جیسے مقامات کے لیے: پہلے JS-string محفوظ
// (backslash)، پھر HTML-attribute محفوظ (esc)۔ دونوں تہوں سے XSS رک جاتا ہے۔
function _dioJsHtml(s) {
  return esc(String(s == null ? '' : s).replace(/[\\'"\r\n]/g,
    m => ({ '\\': '\\\\', "'": "\\'", '"': '\\"', '\r': '\\r', '\n': '\\n' }[m])));
}
window._dioJsHtml = _dioJsHtml;
// Alias — same HTML-escaper under the name used across print/innerHTML sinks.
window.escapeHtml = esc;

// ── SANITIZE rich-text HTML (for contenteditable-saved content) ──
// Keeps formatting (<b>, <br>, tables) but strips scripts & event handlers.
// ═══ Phase 3D — sanitizeHtml ab DIO.html.safe() par forward hoti hai ═══
// (DOMPurify jab load ho — industry-grade; warna dio-html.js ka mazboot
//  native fallback. Purani basic sanitization se behtar — vbscript:, data:,
//  style expression(), srcdoc, formaction, svg xss sab block.)
// Legacy in-file implementation neechay fallback ke tor par rakhi hai —
// sirf tab use hoti hai jab dio-html.js load na ho.
function sanitizeHtml(html) {
  if (html == null) return '';
  // Prefer new Phase 3D pipeline agar available
  try {
    if (window.DIO && window.DIO.html && typeof window.DIO.html.safe === 'function') {
      return window.DIO.html.safe(html);
    }
  } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
  // ── Legacy fallback (agar dio-html.js load nahi hui) ──────
  const t = document.createElement('template');
  t.innerHTML = String(html);
  t.content.querySelectorAll('script,iframe,object,embed,link,style').forEach(n => n.remove());
  t.content.querySelectorAll('*').forEach(el => {
    [...el.attributes].forEach(a => {
      const n = a.name.toLowerCase(), v = String(a.value || '').toLowerCase();
      if (n.startsWith('on') || ((n === 'href' || n === 'src') && v.trim().startsWith('javascript:'))) {
        el.removeAttribute(a.name);
      }
    });
  });
  return t.innerHTML;
}
window.sanitizeHtml = sanitizeHtml;

function formatDate(d) {
  if (!d) return '—';
  try {
    const str = String(d).trim();

    // Pehle se DD/MM/YYYY ya DD-MM-YYYY (dashes) — dono ko DD/MM/YYYY banao.
    // (JS `new Date('31-05-2026')` ko nahi samajhta, is liye yahan khud handle
    //  karte hain — warna woh dash wali tareekh jaisi hai waisi hi reh jati thi.)
    let m = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (m) {
      return `${String(m[1]).padStart(2,'0')}/${String(m[2]).padStart(2,'0')}/${m[3]}`;
    }
    // YYYY-MM-DD (Supabase ka standard) — DD/MM/YYYY banao
    m = str.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
    if (m) {
      return `${String(m[3]).padStart(2,'0')}/${String(m[2]).padStart(2,'0')}/${m[1]}`;
    }

    const dt = new Date(d);
    if (isNaN(dt)) return str;
    const dd = String(dt.getDate()).padStart(2,'0');
    const mm = String(dt.getMonth()+1).padStart(2,'0');
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch(_) { return d; }
}
window.formatDate = formatDate;

// ── GLOBAL: voice-to-text mic button (Rule 7) ──────────────────
// Apply mic to any field marked data-mic="true"
// BAND KAR DIYA GAYA — ab poore system ka AIK global mic button hai
// (global-mic.js). Purane bikhre hue mic buttons (har field par) khatam.
// data-mic="true" jyun ka tyun reh sakta hai, us se ab koi button nahi banta.
window.applyMicButtons = function(root) { /* no-op: global mic ab kaam karta hai */ };

// ── GLOBAL: complainant name from case (Rule 8) ────────────────
window.getComplainantName = async function(caseId) {
  if (!caseId) return '';
  try {
    const cached = JSON.parse(localStorage.getItem('case_data_'+caseId) || '{}');
    if (cached.complainant_name) return cached.complainant_name;
  } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  try {
    const { data } = await supabaseClient.from('cases')
      .select('complainant_name,complainant_address').eq('id',caseId).maybeSingle();
    return (data && data.complainant_name) || '';
  } catch(_) { return ''; }
};

// ── GLOBAL: confirm-delete dialog (P8-B) ──────────────────────
window.confirmDelete = function(itemName, onConfirm) {
  const dialog = document.createElement('div');
  dialog.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;background:rgba(0,0,0,0.55);z-index:99999;display:flex;align-items:center;justify-content:center;';
  dialog.innerHTML = `
    <div style="background:var(--bg-card,#fff);padding:24px;border-radius:14px;max-width:340px;width:90%;text-align:center;direction:rtl;font-family:'Jameel Noori Nastaleeq',serif;">
      <div style="font-size:34px;margin-bottom:10px;"><svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:-3px'><path d='M12 4L3 19.5h18z'/><path d='M12 10v4.5'/><path d='M12 17.2h.01'/></svg></div>
      <div style="font-size:17px;font-weight:bold;margin-bottom:6px;color:var(--text-primary,#111);">کیا آپ واقعی حذف کرنا چاہتے ہیں؟</div>
      <div style="font-size:14px;color:var(--text-secondary,#777);margin-bottom:20px;">${itemName||''}</div>
      <div style="display:flex;gap:12px;justify-content:center;">
        <button id="_cd-cancel" style="padding:10px 22px;border:1px solid var(--border,#ccc);border-radius:8px;background:transparent;color:var(--text-primary,#111);cursor:pointer;font-size:15px;">منسوخ</button>
        <button id="_cd-ok" style="padding:10px 22px;border:none;border-radius:8px;background:var(--red);color:#fff;cursor:pointer;font-size:15px;">حذف کریں</button>
      </div>
    </div>`;
  document.body.appendChild(dialog);
  dialog.querySelector('#_cd-cancel').onclick = () => dialog.remove();
  dialog.querySelector('#_cd-ok').onclick = () => { try { onConfirm && onConfirm(); } finally { dialog.remove(); } };
  dialog.onclick = (e) => { if (e.target === dialog) dialog.remove(); };
};

// ── GLOBAL: empty-state with guidance (P8-A) ──────────────────
window.showEmptyState = function(container, message, actionHint) {
  if (!container) return;
  container.innerHTML = `
    <div style="text-align:center;padding:40px 20px;color:var(--text-muted,#888);direction:rtl;font-family:'Jameel Noori Nastaleeq',serif;">
      <div style="font-size:46px;margin-bottom:14px;"><svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:-3px'><path d='M3.5 7.5h6l2 2.5h9V19a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 19z'/></svg></div>
      <div style="font-size:16px;margin-bottom:8px;color:var(--text-secondary,#aaa);">${message||''}</div>
      ${actionHint ? `<div style="font-size:13px;color:var(--text-faint,#999);">${actionHint}</div>` : ''}
    </div>`;
};

// ── GLOBAL: smart suggestions (Rule 5) — subtle, non-forcing ───
// Remembers recent values per "category" key in localStorage, shows
// dismissible hints below a field. Officer must tap ✓ to accept.
window.rememberValue = function(categoryKey, value) {
  if (!value || !String(value).trim()) return;
  value = String(value).trim();
  try {
    let arr = JSON.parse(localStorage.getItem('suggest_'+categoryKey) || '[]');
    arr = arr.filter(v => v !== value);   // move to front, no dupes
    arr.unshift(value);
    arr = arr.slice(0, 8);                 // keep last 8
    localStorage.setItem('suggest_'+categoryKey, JSON.stringify(arr));
  } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
};

window.attachSuggestions = function(inputEl, categoryKey, opts) {
  if (!inputEl || inputEl._suggAttached) return;
  inputEl._suggAttached = true;
  opts = opts || {};
  const extra = opts.presets || [];   // fixed common suggestions (e.g. PPC sections)

  // Build hint container right after the field
  const box = document.createElement('div');
  box.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;';
  if (inputEl.nextSibling) inputEl.parentNode.insertBefore(box, inputEl.nextSibling);
  else inputEl.parentNode.appendChild(box);

  const setVal = (val) => {
    if (inputEl.isContentEditable) { inputEl.innerText = val; inputEl.style.fontWeight='bold'; }
    else { inputEl.value = val; inputEl.style.fontWeight='bold'; }
    inputEl.dispatchEvent(new Event('input', { bubbles:true }));
  };

  const render = () => {
    let recent = [];
    try { recent = JSON.parse(localStorage.getItem('suggest_'+categoryKey) || '[]'); } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
    const all = [...new Set([...recent, ...extra])].slice(0, 8);
    box.innerHTML = '';
    if (!all.length) return;
    const cur = (inputEl.isContentEditable ? inputEl.innerText : inputEl.value || '').trim();
    all.filter(s => s && s !== cur).forEach(s => {
      const chip = document.createElement('span');
      chip.style.cssText = 'display:inline-flex;align-items:center;gap:4px;font-style:italic;color:#888;font-size:12px;border:1px dashed #bbb;border-radius:12px;padding:2px 8px;cursor:pointer;';
      chip.innerHTML = `${s} <b style="color:var(--accent,#2563eb);font-style:normal;"><svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='opacity:.9;display:inline-block;vertical-align:middle'><path d='M4.5 12.5l5 5 10-11'/></svg></b>`;
      chip.title = 'قبول کریں';
      chip.onclick = () => { setVal(s); render(); };
      box.appendChild(chip);
    });
  };
  render();
  inputEl.addEventListener('focus', render);
  // Remember on blur
  inputEl.addEventListener('blur', () => {
    const val = inputEl.isContentEditable ? inputEl.innerText : inputEl.value;
    window.rememberValue(categoryKey, val);
  });
};

function formatCNIC(v) {
  if (!v) return '';
  const d = v.replace(/\D/g,'').slice(0,13);
  if (d.length<=5) return d;
  if (d.length<=12) return d.slice(0,5)+'-'+d.slice(5);
  return d.slice(0,5)+'-'+d.slice(5,12)+'-'+d.slice(12);
}
function formatCell(v) {
  if (!v) return '';
  const d = v.replace(/\D/g,'').slice(0,11);
  if (d.length<=4) return d;
  return d.slice(0,4)+'-'+d.slice(4);
}

// ── GLOBAL: auto text-direction ──────────────────────────────
// English-data fields (CNIC, phone, email, vehicle, badge) → LTR
// Mixed Urdu+English fields (name, address, place) → plaintext (auto per-line)

// ═══════════════════════════════════════════════════════════════════
//  اردو + انگریزی ایک ساتھ — ہر حصے کا اپنا رُخ
//  اصول: اردو RTL، انگریزی/ہندسے LTR۔ applyAutoDirection پورے خانے
//  کا رُخ طے کرتا ہے، مگر جب ایک ہی خانے میں دونوں ہوں (جیسے
//  "نام  36302-4459712-5") تو ہر حصے کو الگ رُخ چاہیے — یہ CSS
//  وہی کرتی ہے (unicode-bidi:plaintext)۔ پورے سسٹم پر لاگو۔
// ═══════════════════════════════════════════════════════════════════

// نام + CNIC ایک ساتھ دکھانے کا معیاری طریقہ (پورے سسٹم کے لیے)
// اردو نام RTL، CNIC LTR، اور دونوں کے درمیان 1cm کا فاصلہ۔
function dioNameWithCnic(name, cnic) {
  const nm = String(name || '').trim();
  if (!nm) return '';
  const cn = String(cnic || '').trim() || '00000-0000000-0';
  const e = (typeof esc === 'function') ? esc : (x => x);
  return e(nm) + '<bdi class="dio-cnic">' + e(cn) + '</bdi>';
}
window.dioNameWithCnic = dioNameWithCnic;

function dioMixedTextCSS() {
  if (document.getElementById('dio-bidi-style')) return;
  const st = document.createElement('style');
  st.id = 'dio-bidi-style';
  st.textContent = `
    /* ہر پیراگراف/سطر اپنے پہلے حرف کے مطابق رُخ لے */
    [contenteditable="true"], .dio-mixed,
    td, th, .form-input, input[type="text"], textarea,
    .mdoc-chip, .zt td, .ct td, .sho-cell-row, .ch173-cont,
    .rotinner, .normwrap, .hinner, .sho-papers-body {
      unicode-bidi: plaintext;
    }
    /* اعداد/انگریزی ہمیشہ بائیں سے دائیں */
    .dio-ltr, .cnic, .phone { direction: ltr; unicode-bidi: isolate; }
    /* نام اور CNIC/نمبر کے درمیان 1cm کا فاصلہ (پورے سسٹم میں) —
       CNIC کو U+2066 … U+2069 میں لپیٹا جاتا ہے، اسی نشان سے پہلے
       یہ جگہ ڈالی جاتی ہے۔ */
    /* CNIC — hindse kabhi na tootein, aur naam se 1cm ka fasla.
       'margin-inline-start' seedhi aur khadi dono likhayi mein theek chalta
       hai (margin-right khadi likhayi mein ghalat taraf lagta tha). */
    .dio-cnic {
      direction: ltr; unicode-bidi: isolate;
      margin-inline-start: 1cm;
      white-space: nowrap;        /* hindse tootein nahi */
      word-break: keep-all;
    }
  `;
  document.head.appendChild(st);
}
window.dioMixedTextCSS = dioMixedTextCSS;
document.addEventListener('DOMContentLoaded', dioMixedTextCSS);
if (document.readyState !== 'loading') dioMixedTextCSS();

function applyAutoDirection(root) {
  root = root || document;
  const ltrHints = /cnic|phone|mobile|cell|email|vehicle|badge|گاڑی|نمبر پلیٹ|رابطہ|شناختی|موبائل/i;
  const fields = root.querySelectorAll('input[type="text"], input:not([type]), input[type="tel"], input[type="email"], textarea, [contenteditable="true"]');
  fields.forEach(el => {
    if (el._dirDone) return;
    // Skip if an explicit dir is already set in markup
    const hasDir = el.getAttribute('dir');
    const hint = (el.id||'') + ' ' + (el.getAttribute('placeholder')||'') + ' ' + (el.getAttribute('data-k')||'') + ' ' + (el.name||'');
    if (!hasDir) {
      if (ltrHints.test(hint)) { el.setAttribute('dir','ltr'); el.style.textAlign='left'; }
      else { el.style.unicodeBidi = 'plaintext'; }   // mixed → auto direction per content
    }
    el._dirDone = true;
  });
}
window.applyAutoDirection = applyAutoDirection;

function autoFormatCNIC(input) {
  input.setAttribute('dir','ltr'); input.style.textAlign='left';   // English numbers always LTR
  let v = input.value.replace(/\D/g,'').slice(0,13);
  if (v.length>12) v = v.slice(0,5)+'-'+v.slice(5,12)+'-'+v.slice(12);
  else if (v.length>5) v = v.slice(0,5)+'-'+v.slice(5);
  input.value = v;
}
function autoFormatCell(input) {
  input.setAttribute('dir','ltr'); input.style.textAlign='left';   // English numbers always LTR
  let v = input.value.replace(/\D/g,'').slice(0,11);
  if (v.length>4) v = v.slice(0,4)+'-'+v.slice(4);
  input.value = v;
}
function autoFormatDate(input) {
  input.setAttribute('dir','ltr'); input.style.textAlign='left';
  const s = input.value.replace(/\D/g,'').slice(0,8);   // DDMMYYYY (زیادہ سے زیادہ 8 ہندسے)
  let dd = s.slice(0,2), mm = s.slice(2,4), yy = s.slice(4,8);
  // دن: 01–31 (31 سے آگے نہ جائے)
  if (dd.length === 2) { const n = +dd; if (n > 31) dd = '31'; else if (n === 0) dd = '01'; }
  // مہینہ: 01–12 (12 سے آگے نہ جائے)
  if (mm.length === 2) { const n = +mm; if (n > 12) mm = '12'; else if (n === 0) mm = '01'; }
  // سال: زیادہ سے زیادہ 4 ہندسے (yy پہلے ہی 4 پر محدود)
  // نظام کا اصول: تاریخ ہر جگہ DD/MM/YYYY (پرانی DD-MM-YYYY بھی ہر جگہ پڑھی جاتی ہے)
  let out = dd;
  if (s.length > 2) out += '/' + mm;
  if (s.length > 4) out += '/' + yy;
  input.value = out;
}

// تاریخ مکمل و درست ہے؟ (خالی = اختیاری، اجازت)۔ DD-MM-YYYY، دن ۱–۳۱، مہینہ ۱–۱۲، سال ۴ ہندسے۔
function _dioValidDate(s) {
  s = (s || '').trim();
  if (!s) return true;
  const m = /^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/.exec(s);   // DD/MM/YYYY (نیا) یا DD-MM-YYYY (پرانا)
  if (!m) return false;                          // مکمل 4-ہندسی سال نہ ہو تو غلط (مثلاً سال "00")
  const d = +m[1], mo = +m[2];
  return d >= 1 && d <= 31 && mo >= 1 && mo <= 12;
}
window._dioValidDate = _dioValidDate;

// ── SUPABASE DATA FUNCTIONS ───────────────────────────────────
async function updateBadges() {
  try {
    const oid = await getOfficerId();
    if (!oid) return;
    if (!navigator.onLine) return;  // Skip network call when offline
    const [{ count:cases },{ count:rems }] = await Promise.all([
      supabaseClient.from('cases').select('id',{count:'exact',head:true}).eq('officer_id',oid).is('deleted_at', null),
      supabaseClient.from('reminders').select('id',{count:'exact',head:true}).eq('officer_id',oid).eq('is_done',false),
    ]);
    const b = document.getElementById('badge-cases');
    if (b) { b.textContent = cases||0; b.style.display = cases>0?'inline':'none'; }
    const r = document.getElementById('badge-reminders');
    if (r) { r.textContent = rems||0; r.style.display = rems>0?'inline':'none'; }
  } catch(_) { /* parhna na ho sake to pehle wali/khali qadr rahe */ }
}

// ── SIDEBAR PROFILE ───────────────────────────────────────────
function updateSidebarProfile() {
  const o = currentOfficer||{};
  const nameEl = document.getElementById('sidebar-name');
  const rankEl = document.getElementById('sidebar-role');
  const avEl   = document.getElementById('sidebar-avatar');
  if (nameEl) nameEl.textContent = o.full_name||'افسر';
  if (rankEl) rankEl.textContent = `${o.designation||''} · ${o.station||''}`;
  // Resolve photo once (DB first, then localStorage fallback)
  let _photo = o.profile_photo;
  if (!_photo) { try { _photo = localStorage.getItem('dio_profile_photo') || localStorage.getItem('officer_photo_url'); } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ } }
  const _initials = (o.full_name||'IO').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase();
  if (avEl) {
    if (_photo) avEl.innerHTML = `<img src="${_photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    else avEl.textContent = _initials;
  }
  // Topbar corner avatar (always update — visible on mobile too)
  const tbAv = document.getElementById('topbar-avatar');
  if (tbAv) {
    if (_photo) tbAv.innerHTML = `<img src="${_photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    else tbAv.textContent = _initials;
  }
  // Show admin nav if applicable (both old sidebar and new top-nav)
  const isAdmin = ['admin','superadmin'].includes(o.role);
  const adminNav = document.getElementById('admin-nav-item');
  if (adminNav) adminNav.style.display = isAdmin ? 'flex' : 'none';
  const topAdmin = document.getElementById('top-admin-item');
  if (topAdmin) topAdmin.style.display = isAdmin ? 'block' : 'none';
}

// ── TOPBAR SHO/DSP ────────────────────────────────────────────
// ── CONNECTION STATUS ──────────────────────────────────────────
function updateConnectionStatus(online) {
  const dot  = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  const badge= document.getElementById('db-badge');
  if (badge) badge.textContent = online ? 'متصل' : 'آف لائن';
  // v560: پٹی کی حالت اب dio-sync.js کی — «محفوظ / سنک ہو رہا ہے / آف لائن» (session سمیت)۔
  //   پہلے صرف انٹرنیٹ دیکھ کر «آن لائن» لکھا جاتا تھا، چاہے سرور سے رابطہ (session) نہ ہو۔
  if (window.DIOSync && typeof DIOSync.render === 'function') { DIOSync.render(); return; }
  if (dot)  dot.className  = 'status-dot' + (online?' status-online':' status-offline');
  if (text) text.textContent = online ? 'آن لائن' : 'آف لائن';
}

/* ═══════════════════════════════════════════════════════════════
   KHARABI JO THEEK KI GAYI:
   `updateConnectionStatus()` sirf `online`/`offline` EVENTS par
   chalta tha. Event tab aata hai jab haalat BADLE. Agar app pehle
   se hi aaf line khuli (jo maidan me aam hai — afsar signal se
   bahar jaga par app kholta hai) to koi event nahi aata, aur
   topbar par likha hua pehla matn "آن لائن" wahin laga rehta hai.
   Naapa gaya: navigator.onLine = false, magar patti par "آن لائن".
   Afsar samajhta ke uska kaam server tak pahunch raha hai — halanke
   nahi pahunch raha.
   AB: shuru me aik baar asal haalat se nishan lagaya jata hai.
   ═══════════════════════════════════════════════════════════════ */
function _dioInitConnectionStatus() {
  try { updateConnectionStatus(navigator.onLine); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _dioInitConnectionStatus);
} else {
  _dioInitConnectionStatus();
}
// Topbar baad me bhi ban sakti hai — do dafa aur yaqeeni bana lo
setTimeout(_dioInitConnectionStatus, 600);
setTimeout(_dioInitConnectionStatus, 2000);

// ── SYNC STATUS (S4) ──────────────────────────────────────────
function markSynced() {
  try { localStorage.setItem('dio_last_sync', Date.now().toString()); } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  _updateSyncLabel();
}
function _updateSyncLabel() {
  const el = document.getElementById('sync-label');
  if (!el) return;
  let ts = 0;
  try { ts = parseInt(localStorage.getItem('dio_last_sync')||'0'); } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  if (!ts) { el.textContent = ''; return; }
  const mins = Math.floor((Date.now() - ts) / 60000);
  let txt;
  if (mins < 1) txt = 'ابھی sync ہوا';
  else if (mins < 60) txt = `${mins} منٹ پہلے sync`;
  else txt = `${Math.floor(mins/60)} گھنٹے پہلے sync`;
  el.textContent = '· ' + txt;
}
setInterval(_updateSyncLabel, 60000); // update label every minute

// Internet toot-ne par foran cache mode — network par bekar koshishein band
window.addEventListener('offline', () => {
  try { _remindersFailedAt = Date.now(); } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
});
// Internet wapas aane par backoff hata do
window.addEventListener('online', () => {
  try { _remindersFailedAt = 0; } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
});

// v552: نیٹ چند لمحوں کے لیے آئے جائے (Wi-Fi/موبائل سگنل) تو پٹی بار بار «آف لائن/آن لائن»
//   نہ پلٹے — «آف لائن» صرف تب دکھاؤ جب 3 سیکنڈ بعد بھی آف لائن ہو۔ (کام پر کوئی اثر نہیں:
//   ہر اندراج پہلے آلے پر محفوظ ہوتا ہے اور نیٹ آتے ہی خود sync۔)
let _dioOfflineT = null;
window.addEventListener('online',  ()=>{ clearTimeout(_dioOfflineT); updateConnectionStatus(true); _syncOfflineQueue(); });
window.addEventListener('offline', ()=>{
  clearTimeout(_dioOfflineT);
  _dioOfflineT = setTimeout(()=>{ if (!navigator.onLine) updateConnectionStatus(false); }, 3000);
});

// ── SYNC offline queue when back online ───────────────────────
async function _syncOfflineQueue() {
  if (typeof offlineStore === 'undefined' || !navigator.onLine) return;
  /* v527 — AHEM HIFAZAT: offline login ke baad Supabase ka session nahi
     hota. Us halat me sync chalta to server "permission denied" deta aur
     processQueue() us ko MUSTAQIL nakaami maan kar andraaj 'failed' kar
     deta — offline me likhi zimniyan zaya. Ab session ke baghair sync
     NAHI chalta; auth.js internet aate hi session bahal kar ke khud
     dobara bulata hai. */
  try {
    const { data } = await supabaseClient.auth.getSession();
    if (!data || !data.session) return;
  } catch (_) { return; }
  // v552: ضمنیاں اپنے مقامی ذخیرے سے (zimni.js) — لاگ اِن/انٹرنیٹ بحال ہوتے ہی
  try { if (typeof window._zimniSyncPending === 'function') window._zimniSyncPending(); } catch (_) { /* ikhtiyari hook */ }
  try {
    const count = await offlineStore.pendingCount();
    if (!count) return;
    showToast(`${count} تبدیلیاں sync ہو رہی ہیں...`, 'info');
    const synced = await offlineStore.processQueue(supabaseClient);
    if (synced > 0) {
      showToast(`${synced} تبدیلیاں sync ہو گئیں`, 'success');
      // Refresh cases page if currently shown
      if (window._activePage === 'cases') {
        showPage('cases', null);
      }
    }
  } catch(e) { console.warn('sync error', e); }
}
// Try sync on app start too
setTimeout(() => { if (navigator.onLine) _syncOfflineQueue(); }, 3000);

// ── CLOCK ─────────────────────────────────────────────────────
function startClock() {
  const update = () => {
    const el = document.getElementById('footer-time');
    if (el) el.textContent = new Date().toLocaleTimeString('en-PK',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true});
  };
  update();
  setInterval(update, 1000);
}

// ── REAL-TIME SYNC ────────────────────────────────────────────
function setupRealtimeSync(cb) {
  try {
    supabaseClient.channel('realtime').on('postgres_changes',{event:'*',schema:'public'},e=>{ if(cb) cb(e.table); }).subscribe();
  } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}

// ── PUSH NOTIFICATIONS ────────────────────────────────────────
async function _initNotifications() {
  if (!('Notification' in window)) return;
  if (Notification.permission==='default') {
    const perm = await Notification.requestPermission();
    if (perm==='granted') showToast('اطلاعات فعال','success');
  }
}

function _showNotification(title, body, tag) {
  if (Notification.permission!=='granted') return;
  try {
    const n = new Notification(title,{body,tag:tag||'dio',icon:'/icon-192.png',dir:'rtl',lang:'ur',vibrate:[200,100,200]});
    n.onclick = ()=>{ window.focus(); n.close(); };
    setTimeout(()=>n.close(),8000);
  } catch(_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
}

async function _checkDueReminders() {
  try {
    if (Notification.permission!=='granted') return;
    const rems = await getReminders();
    const today = new Date().toISOString().split('T')[0];
    const due = rems.filter(r=>!r.is_done&&r.reminder_date&&r.reminder_date<=today);
    if (!due.length) return;
    due.slice(0,3).forEach((r,i)=>{
      setTimeout(()=>_showNotification(`یاددہانی — ${r.reminder_date===today?'آج':'گزر گئی'}`,r.text.slice(0,100),'rem-'+r.id),i*1500);
    });
    if (due.length>3) setTimeout(()=>_showNotification('Digital IO',`${due.length} یاددہانیاں باقی`,'rem-count'),5000);
  } catch(_) { /* parhna na ho sake to pehle wali/khali qadr rahe */ }
}

function _logUsage(label) {
  try {
    const d = JSON.parse(localStorage.getItem(_usageKey)||'{}');
    d[label] = (d[label]||0)+1;
    localStorage.setItem(_usageKey, JSON.stringify(d));
  } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
}
function getUsageStats() {
  try {
    return Object.entries(JSON.parse(localStorage.getItem(_usageKey)||'{}')).sort((a,b)=>b[1]-a[1]).map(([l,c])=>({label:l,count:c}));
  } catch(_) { return []; }
}
document.addEventListener('click',function(e){
  const btn=e.target.closest('.btn');
  if(btn&&!btn.closest('.nav-item')){const t=(btn.textContent||btn.title||'').trim().slice(0,30);if(t)_logUsage('btn:'+t);}
},true);


/* Theme chunne ka khana.
   PEHLE: sirf 5 theme dikhti thin (dark/light/forest/ocean/sunset)
   halanke index.html mein GYARAH mukammal tor par mojood hain —
   lavender, blossom, peaks, cosmos, autumn, aurora afsar tak
   pahunchti hi nahi thin (CSS likhi hui thi, faida sifar).
   Naam bhi angrezi + emoji the.
   AB: gyarah ki gyarah, Urdu naam, aur har aik ka apna rang
   namoona (swatch) taake afsar dekh kar chun sake. */
const DIO_THEMES = [
  { k: 'light',    n: 'روشن',        c: ['#ffffff', '#0b3d64'] },
  { k: 'dark',     n: 'تاریک',        c: ['#111f2e', '#38bdf8'] },
  { k: 'forest',   n: 'سبزہ',        c: ['#0f2218', '#34d399'] },
  { k: 'ocean',    n: 'سمندر',      c: ['#0c3030', '#2dd4bf'] },
  { k: 'sunset',   n: 'غروب',        c: ['#1c0e00', '#fb923c'] },
  { k: 'lavender', n: 'نیلوفر',     c: ['#2e1065', '#c4b5fd'] },
  { k: 'blossom',  n: 'گلاب',        c: ['#3b0a25', '#f9a8d4'] },
  { k: 'peaks',    n: 'پہاڑ',        c: ['#0b1a2b', '#93c5fd'] },
  { k: 'cosmos',   n: 'کہکشاں',     c: ['#0a0a1f', '#a78bfa'] },
  { k: 'autumn',   n: 'خزاں',        c: ['#231204', '#fbbf24'] },
  { k: 'aurora',   n: 'شفق',          c: ['#04121c', '#5eead4'] }
];

function openThemePicker() {
  let cur = '';
  try { cur = localStorage.getItem('dio_theme') || 'light'; } catch (_) { cur = 'light'; }
  openModal('تھیم منتخب کریں',
    `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:10px;direction:rtl;">
      ${DIO_THEMES.map(t => `
        <button type="button" onclick="setTheme('${t.k}');closeModal();"
          aria-pressed="${t.k === cur ? 'true' : 'false'}"
          style="display:flex;flex-direction:column;align-items:center;gap:7px;padding:11px 8px;
                 border-radius:11px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700;
                 border:2px solid ${t.k === cur ? 'var(--accent)' : 'var(--border)'};
                 background:var(--bg-secondary);color:var(--text-primary);">
          <span style="width:42px;height:28px;border-radius:7px;flex:none;
                       border:1px solid var(--border);overflow:hidden;display:flex;">
            <span style="flex:2;background:${t.c[0]};"></span>
            <span style="flex:1;background:${t.c[1]};"></span>
          </span>
          ${t.n}
        </button>`).join('')}
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">بند</button>`
  );
}

function setTheme(t) {
  if (t === 'dark') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', t);
  }
  try { localStorage.setItem('dio_theme', t); } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
}

// Load saved theme — default to LIGHT if none chosen
(function(){
  let t = localStorage.getItem('dio_theme');
  if (!t) {
    // No theme chosen — default to light
    t = 'light';
    try { localStorage.setItem('dio_theme', 'light'); } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  }
  setTheme(t);
})();

// ── FONT SIZE (accessibility — har officer apni pasand rakh sake) ──────────
// Base html font-size badalne se poori app proportionally choti/bari hoti hai.
const DIO_FONT_SIZES = { small: '15px', medium: '16px', large: '18px', xlarge: '20px' };
function setFontSize(key) {
  const px = DIO_FONT_SIZES[key] || DIO_FONT_SIZES.medium;
  document.documentElement.style.fontSize = px;
  try { localStorage.setItem('dio_font_size', key); } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
}
function getFontSize() {
  return localStorage.getItem('dio_font_size') || 'medium';
}
// Font-size option HATA diya gaya (settings se). Poora system ab aik hi
// معیاری size par (medium = 16px). Purana save-shuda choice (chhota/bara)
// clear kar do taake koi us par "phansa" na rahe — sab standard par aa jayen.
(function(){
  try { localStorage.removeItem('dio_font_size'); } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  document.documentElement.style.fontSize = DIO_FONT_SIZES.medium;   // 16px
})();
window.setFontSize = setFontSize;   // (baqi code kahin call kare to mehfooz — no-op-ish)
window.getFontSize = getFontSize;

// ── AUTH ──────────────────────────────────────────────────────

// ── INIT APP ──────────────────────────────────────────────────
// #11: admin.js صرف ایڈمن/سپرایڈمن کو dynamically لوڈ (غیر-ایڈمن کو 68KB ایڈمن
//   کوڈ نہ بھیجا/چلایا جائے)۔ admin.js لوڈ ہوتے ہی registerPage('admin', …) چلتا ہے۔
let _dioAdminLoaded = false;
function _dioEnsureAdminBundle() {
  if (_dioAdminLoaded) return Promise.resolve(true);
  const role = (typeof currentOfficer !== 'undefined' && currentOfficer && currentOfficer.role) || '';
  if (role !== 'admin' && role !== 'superadmin') return Promise.resolve(false);
  _dioAdminLoaded = true;
  return new Promise((res) => {
    const s = document.createElement('script'); s.src = 'admin.js'; s.defer = true;
    s.onload = () => res(true);
    s.onerror = () => { _dioAdminLoaded = false; res(false); };
    document.head.appendChild(s);
  });
}
window._dioEnsureAdminBundle = _dioEnsureAdminBundle;

async function initApp() {
  // پرانا lock flag صاف کرو۔ نوٹ: digital_io_pin_hash کو NA ہٹائیں — یہ فعال ایپ
  // لاک PIN ہے (قدم 3)؛ پہلے یہاں یہ مٹ جاتا تھا جس سے لاک ہر init پر ختم ہو جاتا۔
  try { localStorage.removeItem('digital_io_locked'); } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  ['dio-pin-overlay'].forEach(id => { const e=document.getElementById(id); if(e) e.remove(); });
  // #11: admin بنڈل صرف ایڈمن/سپرایڈمن کو لوڈ کرو (غیر-ایڈمن کے آلے پر admin.js نہ چلے)
  try { if (typeof _dioEnsureAdminBundle === 'function') _dioEnsureAdminBundle(); } catch(_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
  updateSidebarProfile();
  // Refresh avatar again after profile fully loads (photo persistence)
  setTimeout(() => { if (typeof updateSidebarProfile === 'function') updateSidebarProfile(); }, 600);
  updateConnectionStatus(navigator.onLine);
  // v527 (tez login): badges ka network jawab dashboard ko na roke
  try { updateBadges(); } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  startClock();
  // ═══ DEFENSIVE (Phase 1 cleanup ke baad zarur) ═══
  // Pehle auth.js mein stub tha jo agar backup.js load na hui ho to bhi
  // crash nahi hone deta tha. Ab stub hata diya — is liye yahan typeof
  // guard laga di taake stale/late load par bhi safe rahें.
  try { if (typeof initBackupSystem === 'function') initBackupSystem(); }
  catch(e) { console.warn('[app-core] initBackupSystem skipped:', e && e.message); }
  setupRealtimeSync(async(table)=>{
    await updateBadges();
    const pt = document.getElementById('topbar-title')?.textContent;
    // Afsar us waqt kuch likh raha ho (talaash ya koi khana) to safha
    // dobara na banao — warna cursor nikal jata hai aur likhai ruk jati hai.
    const _busy = (function(){
      const a = document.activeElement;
      if (!a) return false;
      return a.isContentEditable || ['INPUT','TEXTAREA','SELECT'].indexOf(a.tagName) !== -1;
    })();
    if (_busy) return;
    if(table==='cases'&&pt?.includes('مقدمات')){
      // Sirf qatarein — filter aur talaash barqarar rahen
      if (typeof _csRefreshRows === 'function' && document.getElementById('cs-rows')) _csRefreshRows();
      else renderCases&&renderCases(document.getElementById('page-content'));
    }
    if(table==='reminders'&&pt?.includes('یاددہانی')) renderReminders&&renderReminders(document.getElementById('page-content'));
  });
  // Check license
  if (typeof checkLicense==='function') checkLicense();
  // لاگ اِن کے بعد ہمیشہ ڈیش بورڈ کھلے (پہلے آخری صفحہ resume ہوتا تھا، جس سے
  // لاگ اِن پر "میرے مقدمات" کھل جاتا تھا — اب ہمیشہ dashboard)۔
  showPage('dashboard', document.querySelector('.nav-item'));
  setTimeout(function(){ try { if (typeof triggerBackup === 'function') triggerBackup('app_init'); } catch(_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ } }, 3000);
  setTimeout(_initNotifications, 2000);
  setTimeout(_checkDueReminders, 5000);
  setInterval(_checkDueReminders, 30*60*1000);
  setTimeout(()=>{ if(typeof updateNotifBadge==='function') updateNotifBadge(); }, 2000);
  // Check subscription
  setTimeout(async()=>{
    if(typeof showSubscriptionBanner==='function') await showSubscriptionBanner();
    if(typeof updateSubBadge==='function') await updateSubBadge();
  }, 2000);
}

/* ═══════════════════════════════════════════════════════════
   CHHAPAI KA URDU FONT — `dioFontHead()`

   MASLA (asli browser mein naapa gaya): `dioPrint()` chhapai ka safha aik
   ALAG iframe mein likhta hai. `index.html` ka `@font-face` us iframe tak
   NAHI pohnchta — iframe sirf wohi font istemal karta hai jiska ELAAN uske
   apne <head> mein ho. Kai safhe apni chhapai ke CSS mein sirf
   `font-family:'Jameel Noori Nastaleeq'` likhte the, elaan nahi — natija:
   Nastaliq ke bajaye `serif` (Naskh) chhapta tha, yaani "فونٹ ٹوٹ گیا"۔
   (Naap: 627px = serif, 707px = asli font — barabar aane ka matlab font
   laga hi nahi.)

   Ab har chhapai isi aik jagah se font leti hai. `font-display:block` —
   taake chhapai se pehle font aa jaye, adha-adha na chhape. Aakhir mein
   system ke Urdu font bhi rakhe hain (aale par jo mil jaye).
   ═══════════════════════════════════════════════════════════ */
function dioFontHead() {
  return '<link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=block" rel="stylesheet">'
    + '<style>'
    + "@font-face{font-family:'Jameel Noori Nastaleeq';"
    + "src:local('Jameel Noori Nastaleeq'),local('JameelNooriNastaleeq'),local('Jameel Noori Nastaleeq Regular'),"
    + "url('https://cdn.jsdelivr.net/npm/jameel-noori/fonts/jameel-noori-nastaleeq4.woff2') format('woff2'),"
    + "url('https://unpkg.com/jameel-noori/fonts/jameel-noori-nastaleeq4.woff2') format('woff2');"
    + 'font-weight:normal;font-style:normal;font-display:block;}'
    + '</style>';
}
window.dioFontHead = dioFontHead;

// ═══ v553: مثل باندھنے کی جگہ (back side) — پورے سسٹم کا ایک ہی قاعدہ ═══
//  افسر کا قاعدہ: «جہاں بھی کاغذ کا دوسرا صفحہ آئے گا تو back side پر اوپر ایک سطر کی
//  جگہ ہوگی اور اوپر بائیں کونے پر ایک مثلث جو پرنٹ میں نظر نہیں آئے گی لیکن اُس کی
//  تحریر والی طرف کی لکیر پرنٹ ہوگی (2pt)؛ کاغذ A4/لیگل کے حساب سے پرنٹ کے وقت خود۔»
//   • صرف جفت صفحات (2، 4، 6 …) — کاغذ کی پچھلی طرف
//   • .dio-bindgap = اوپر ایک سطر (اسی متن کی ایک سطر کی اونچائی، 1lh) — مثلث اس کے فوراً نیچے
//   • مثلث خود سفید/غائب؛ صرف وتر (متن کی طرف) 2pt کی سیاہ لکیر
//   • صفحے کی اونچائی ہر ماڈیول پرنٹ کے وقت منتخب کاغذ (لیگل 13in / A4 11.69in) سے لیتا ہے
function dioBindCSS(scope) {
  const S = scope ? scope + ' ' : '';
  const tri = ['.ch173-bind', '.zf-bind', '.zf-bindmark', '.zfa-bindmark', '.saza-bind', '.dio-bind'].map(c => S + c).join(',');
  return `
    ${S}.dio-bind{ display:block !important; float:left; width:2in; height:2in;
      shape-outside:polygon(0 0, 2in 0, 0 2in); -webkit-shape-outside:polygon(0 0, 2in 0, 0 2in);
      shape-margin:3mm; -webkit-shape-margin:3mm;
      clip-path:polygon(0 0, 2in 0, 0 2in); -webkit-clip-path:polygon(0 0, 2in 0, 0 2in); }
    ${tri}{ margin-top:0 !important; opacity:1 !important;
      background:linear-gradient(to top left, transparent 50%, #000 50%, #000 calc(50% + 2pt), transparent calc(50% + 2pt)) !important;
      -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
    ${S}.dio-bindgap{ display:block !important; height:1.5em !important; height:1lh !important; margin:0 !important; padding:0 !important; float:none !important; }
    ${S}.dio-pgbrk{ display:block !important; height:0 !important; margin:0 !important; padding:0 !important;
      break-before:page !important; page-break-before:always !important; }`;
}
window.dioBindCSS = dioBindCSS;
// مثلث + اوپر کی ایک سطر — کسی بھی جگہ (node سے پہلے) ڈالو؛ دونوں عنصر واپس
function dioBindInsert(parent, before, triClass) {
  const gap = document.createElement('span'); gap.className = 'dio-bindgap';
  const tri = document.createElement('span'); tri.className = triClass || 'dio-bind';
  parent.insertBefore(gap, before || null);
  parent.insertBefore(tri, before || null);
  return [gap, tri];
}
window.dioBindInsert = dioBindInsert;

// ═══ v558 SYSTEM RULE (افسر کی ہدایت، 27 اکتوبر 2026): «سسٹم کا ہر بٹن پورے سسٹم میں ایک جیسا —
//   جیسے مقدمہ کی فہرست کے ایکشن بٹن» — فہرستوں کے ایکشن بٹن اسی ایک جگہ سے (وہی شکل، سائز، نشان) ═══
const DIO_ACT_ICONS = {
  open:     '<path d="M6.5 3.5h7l4.5 4.5V20.5h-11.5z"/><path d="M13.5 3.5V8H18"/>',
  edit:     '<path d="M4 20h4L18 10l-4-4L4 16v4z"/><path d="M14 6l4 4"/>',
  print:    '<path d="M7 8V3.5h10V8"/><path d="M6 17.5H4.5V10a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v7.5H18"/><path d="M7 14h10v6.5H7z"/>',
  download: '<path d="M12 3.5v11"/><path d="M7.5 10.5L12 15l4.5-4.5"/><path d="M4.5 20h15"/>',
  share:    '<path d="M12 15V3.5"/><path d="M7.5 8L12 3.5 16.5 8"/><path d="M4.5 13.5V20h15v-6.5"/>',
  delete:   '<path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/>',
  copy:     '<path d="M8.5 8.5h11v11h-11z"/><path d="M15.5 8.5V4.5h-11v11h4"/>',
};
// kind: open | edit | print | download | share | delete | copy ؛ js: onclick کا کوڈ (پہلے سے محفوظ/escape شدہ)
function dioActBtn(kind, js, title) {
  const cls = kind === 'share' ? 'btn-primary' : kind === 'delete' ? 'btn-danger' : 'btn-secondary';
  const t = String(title || '').replace(/"/g, '&quot;');
  return `<button type="button" aria-label="${t}" class="btn ${cls} btn-sm dio-act" onclick="event.stopPropagation();${js}" title="${t}">`
    + `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px">${DIO_ACT_ICONS[kind] || DIO_ACT_ICONS.open}</svg></button>`;
}
// بٹنوں کی قطار — مقدمہ کی فہرست والی ترتیب (دائیں سے، 2px فاصلہ، درمیان میں)
function dioActRow(html) {
  return `<div class="dio-act-row" style="display:flex;gap:2px;direction:rtl;justify-content:center;flex-direction:row-reverse;flex-wrap:nowrap;">${html}</div>`;
}
window.dioActBtn = dioActBtn;
window.dioActRow = dioActRow;

// ── باقی تمام دستاویزات (FIR متن، درخواستیں، مسل کی دستاویزات، ٹمپلیٹ …) ──
//  چالان/ضمنی/سزا سلپ اپنا حساب خود کرتے ہیں (#ch173-doc / #saza-doc)؛ باقی ہر پرنٹ
//  (iframe) میں یہ: صفحات کا حساب (منتخب کاغذ کا @page سائز اور حاشیے)، ہر جفت صفحے
//  کی پہلی سطر سے پہلے: صفحے کا توڑ + اوپر ایک سطر + مثلث۔ کئی کالم والا جدول صفحے کی
//  حد پر ہو (سطریں ترتیب میں نہ ہوں) تو کچھ نہیں بدلتا — ترتیب کبھی نہیں بگڑتی۔
function _dioPageGeo(html) {
  const IN = 96;
  let w = 8.5, h = 13, mt = 0, mr = 0, mb = 0, ml = 0;
  const m = /@page\s*\x7b([^\x7d]*)\x7d/i.exec(html || '');   // \x7b/\x7d = { } (سادہ قوسین کی گنتی والی جانچ نہ بگڑے)
  const body = m ? m[1] : '';
  const sz = /size\s*:\s*([^;]+)/i.exec(body);
  if (sz) {
    const v = sz[1].trim().toLowerCase();
    if (/a4/.test(v)) { w = 8.27; h = 11.69; }
    else if (/legal/.test(v)) { w = 8.5; h = 14; }
    else if (/letter/.test(v)) { w = 8.5; h = 11; }
    else {
      const n = /([\d.]+)\s*(in|mm|cm)\s+([\d.]+)\s*(in|mm|cm)/.exec(v);
      const k = (x, u) => { x = +x; return u === 'mm' ? x / 25.4 : (u === 'cm' ? x / 2.54 : x); };
      if (n) { w = k(n[1], n[2]); h = k(n[3], n[4]); }
    }
    if (/landscape/.test(v)) { const t = w; w = h; h = t; }
  }
  const mg = /margin\s*:\s*([^;]+)/i.exec(body);
  if (mg) {
    const u = (x) => {
      const n = /(-?[\d.]+)\s*(in|mm|cm|pt|px)?/.exec(x || '0'); if (!n) return 0;
      const vv = +n[1], kk = n[2] || 'px';
      return kk === 'in' ? vv : kk === 'mm' ? vv / 25.4 : kk === 'cm' ? vv / 2.54 : kk === 'pt' ? vv / 72 : vv / 96;
    };
    let p = mg[1].trim().split(/\s+/).map(u);
    if (p.length === 1) p = [p[0], p[0], p[0], p[0]];
    else if (p.length === 2) p = [p[0], p[1], p[0], p[1]];
    else if (p.length === 3) p = [p[0], p[1], p[2], p[1]];
    [mt, mr, mb, ml] = p;
  }
  return { cw: Math.round((w - ml - mr) * IN), ch: (h - mt - mb) * IN };
}
// opts: {root (صرف اس حصے کا متن — مثلاً چالان کا جاری متن), allPages (طاق صفحوں پر بھی
//   صفحے کا توڑ — نستعلیق کے حروف کنارے پر نہ کٹیں), triClass, brkClass}
function dioAutoBind(d, html, opts) {
  opts = opts || {};
  try {
    if (!d || !d.body) return 0;
    if (!opts.root && d.querySelector('#ch173-doc, #saza-doc, .ch173-bind, .zf-bind, .zf-bindmark, .zfa-bindmark, .saza-bind, .dio-bind, [data-dio-nobind]')) return 0;
    const root = opts.root || d.body;
    const triClass = opts.triClass || 'dio-bind', brkClass = opts.brkClass || 'dio-pgbrk';
    const win = d.defaultView;
    const geo = _dioPageGeo(html || (d.documentElement ? d.documentElement.outerHTML.slice(0, 60000) : ''));
    if (geo.ch < 200) return 0;
    const docH = Math.max(d.documentElement.scrollHeight, d.body.scrollHeight);
    if (docH <= geo.ch + 2) return 0;                      // ایک ہی صفحہ
    if (!d.getElementById('dio-bind-css')) {
      const st = d.createElement('style'); st.id = 'dio-bind-css';
      st.textContent = dioBindCSS('') + '.dio-pgbrk{display:block !important;height:0 !important;margin:0 !important;padding:0 !important;' +
        'break-before:page !important;page-break-before:always !important;}';
      (d.head || d.documentElement).appendChild(st);
    }
    const skipEl = (el) => {
      for (let n = el; n && n !== root && n !== d.body; n = n.parentElement) {
        const cs = win.getComputedStyle(n);
        if (cs.display === 'none' || cs.position === 'fixed' || cs.position === 'absolute' || cs.visibility === 'hidden') return true;
      }
      return false;
    };
    const texts = () => {
      const out = [], tw = d.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
      let n;
      while ((n = tw.nextNode())) {
        if (!/\S/.test(n.nodeValue)) continue;
        const pe = n.parentElement;
        if (!pe || /^(SCRIPT|STYLE)$/.test(pe.tagName) || skipEl(pe)) continue;
        out.push(n);
      }
      return out;
    };
    const lines = (n) => {
      const r = d.createRange(); r.selectNodeContents(n);
      return [].filter.call(r.getClientRects(), x => x.height > 2 && x.width > 0);
    };
    // پہلے جانچ: سطریں اوپر سے نیچے ترتیب میں ہوں (ایک کالم کا بہاؤ)؛ ورنہ کچھ نہ بدلو
    let lastTop = -1e9;
    for (const n of texts()) {
      for (const ln of lines(n)) {
        if (ln.top < lastTop - 4) return 0;
        lastTop = Math.max(lastTop, ln.top);
      }
    }
    const sy = () => (win.scrollY || 0);
    const forced = (el) => {
      const cs = win.getComputedStyle(el);
      return /page|always/.test((cs.breakBefore || '') + ' ' + (cs.pageBreakBefore || ''));
    };
    let pageStart = 0, pageNo = 1, made = 0, guard = 0;
    let list = texts(), i = 0;
    const seenForced = new Set();
    while (i < list.length && guard++ < 400) {
      const n = list[i];
      // اس متن سے پہلے کوئی زبردستی صفحہ توڑ (دستاویز کا اپنا) — نیا صفحہ وہاں سے
      for (let el = n.parentElement; el && el !== d.body; el = el.parentElement) {
        if (!seenForced.has(el) && forced(el) && el.getBoundingClientRect().top + sy() > pageStart + 5) {
          seenForced.add(el);
          pageStart = el.getBoundingClientRect().top + sy(); pageNo++;
          if (pageNo % 2 === 0) {
            const first = el.firstChild;
            const gap = d.createElement('span'); gap.className = 'dio-bindgap';
            const tri = d.createElement('span'); tri.className = triClass;
            el.insertBefore(tri, first); el.insertBefore(gap, tri); made++;
          }
        }
      }
      const ls = lines(n);
      let hit = null;
      for (const ln of ls) { if (ln.bottom + sy() > pageStart + geo.ch + 0.5 && ln.top + sy() > pageStart + 1) { hit = ln; break; } }
      if (!hit) { i++; continue; }
      pageNo++;
      const even = (pageNo % 2 === 0);
      if (!even && !opts.allPages) { pageStart = hit.top + sy(); continue; }   // طاق صفحہ — صرف حساب
      // اس سطر کا پہلا حرف (ایک ہی text node میں — ترتیب یقینی)
      let lo = 0, hiI = n.nodeValue.length - 1, off = -1;
      const rr = d.createRange();
      while (lo <= hiI) {
        const mid = (lo + hiI) >> 1;
        rr.setStart(n, mid); rr.setEnd(n, mid + 1);
        const b = rr.getBoundingClientRect();
        if (b.height && b.top >= hit.top - 1) { off = mid; hiI = mid - 1; } else lo = mid + 1;
      }
      if (off < 0) { pageStart = hit.top + sy(); continue; }
      const baad = off > 0 ? n.splitText(off) : n;
      const brk = d.createElement('span'); brk.className = brkClass;
      baad.parentNode.insertBefore(brk, baad);
      if (even) {
        const gap = d.createElement('span'); gap.className = 'dio-bindgap';
        const tri = d.createElement('span'); tri.className = triClass;
        baad.parentNode.insertBefore(gap, baad); baad.parentNode.insertBefore(tri, baad);
      }
      made++;
      pageStart = brk.getBoundingClientRect().top + sy();
      list = texts(); i = list.indexOf(baad); if (i < 0) break;
    }
    return made;
  } catch (e) { try { console.warn('dioAutoBind:', e && e.message); } catch (_) { /* ضمنی */ } return 0; }
}
window.dioAutoBind = dioAutoBind;
window._dioPageGeo = _dioPageGeo;
// v555: کاغذ کی چیزیں (فونٹ کی CSS اور اردو فونٹ) آ جانے کا انتظار — زیادہ سے زیادہ maxMs۔
//   ناپ (مثل کی جگہ / صفحات کا حساب) اور اصل چھپائی دونوں اسی کے بعد، تاکہ دونوں ایک ہی
//   فونٹ پر ہوں۔ انٹرنیٹ نہ ہو تو مقررہ وقت کے بعد جو فونٹ ہے اسی پر۔
async function _dioWaitAssets(d, maxMs) {
  const t0 = Date.now();
  const left = (cap) => Math.max(0, Math.min(cap || 1e9, (maxMs || 5000) - (Date.now() - t0)));
  const within = (p, cap) => Promise.race([p, new Promise(r => setTimeout(r, left(cap)))]);
  try {
    const links = [].slice.call(d.querySelectorAll('link[rel~="stylesheet"]'));
    await within(Promise.all(links.map(l => (l.sheet ? 0 : new Promise(r => {
      l.addEventListener('load', r, { once: true }); l.addEventListener('error', r, { once: true });
    })))), 2500);
  } catch (_) { /* ضمنی */ }
  try { void (d.body && d.body.offsetHeight); } catch (_) { /* ضمنی */ }
  try {
    if (d.fonts && d.fonts.load) {
      await within(Promise.all(['Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu'].map(fm =>
        d.fonts.load('14pt "' + fm + '"', 'ابج abc 123').catch(() => 0))));
    }
  } catch (_) { /* ضمنی */ }
  try { if (d.fonts && d.fonts.ready) await within(d.fonts.ready); } catch (_) { /* ضمنی */ }
}
window._dioWaitAssets = _dioWaitAssets;
// پرنٹ HTML → (ضرورت ہو تو) جفت صفحات پر مثلث والا HTML۔ ناپ ایک چھپے iframe میں
//   «پرنٹ» کی شکل پر (@media print لاگو)، پھر اصل HTML کا head + نیا body۔
//   اسکرپٹ والی یا اپنا حساب رکھنے والی دستاویزات (چالان/ضمنی/سزا) جوں کی توں۔
function dioBindNeeded(html) {
  const h = String(html || '');
  return /@page/i.test(h) && !/<script/i.test(h) && !/id=["'](ch173-doc|saza-doc)["']/.test(h) && !/data-dio-nobind/.test(h);
}
// opts.binder(doc, geo) → ماڈیول کا اپنا حساب (مثلاً سزا سلپ کی قطاریں) — اسی «پرنٹ» شکل میں
async function dioBindHtml(html, opts) {
  opts = opts || {};
  if (!opts.binder && !dioBindNeeded(html)) return html;
  const geo = _dioPageGeo(html);
  const f = document.createElement('iframe');
  f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
  f.style.cssText = 'position:fixed;left:-30000px;top:0;border:0;background:#fff;width:' + geo.cw + 'px;height:' + Math.round(geo.ch) + 'px;';
  document.documentElement.appendChild(f);
  try {
    const d = f.contentWindow.document;
    d.open(); d.write(String(html)); d.close();
    await new Promise(r => setTimeout(r, 120));
    // v555: ناپ صرف اصل فونٹ آ جانے کے بعد (پہلے کبھی فونٹ کی CSS ابھی راستے میں ہوتی اور
    //   ناپ دوسرے فونٹ پر ہو جاتی — چھپائی میں سطریں بدل کر صفحے کا حساب غلط ہو جاتا)
    await _dioWaitAssets(d, 6000);
    // «پرنٹ» کی شکل: @media print → سب پر، screen → کسی پر نہیں (صرف CSSOM میں —
    //   <style> کا متن نہیں بدلتا، اس لیے نقل جوں کی توں رہتی ہے)
    const flip = (rules) => {
      [].forEach.call(rules || [], (r) => {
        try {
          if (r.type === 4) {
            const t = r.media.mediaText;
            if (/\bprint\b/i.test(t) && !/not\s+print/i.test(t)) r.media.mediaText = 'all';
            else if (/^\s*screen\b/i.test(t)) r.media.mediaText = 'not all';
            flip(r.cssRules);
          }
        } catch (_) { /* ایک قاعدہ نہ بدلے تو باقی */ }
      });
    };
    [].forEach.call(d.styleSheets, (sh) => {
      try { if (sh.media && /\bprint\b/i.test(sh.media.mediaText)) sh.media.mediaText = 'all'; } catch (_) { /* ضمنی */ }
      try { flip(sh.cssRules); } catch (_) { /* دوسری جگہ کی شیٹ */ }
    });
    try { void d.body.offsetHeight; } catch (_) { /* ضمنی */ }
    for (let i = 0; i < 30; i++) {
      let st = 'loaded'; try { st = d.fonts ? d.fonts.status : 'loaded'; } catch (_) { st = 'loaded'; }
      if (st === 'loaded') break;
      await new Promise(r => setTimeout(r, 100));
    }
    let made = 0;
    try { made = opts.binder ? (opts.binder(d, geo) || 0) : dioAutoBind(d, html); }
    catch (e) { try { console.warn('bind:', e && e.message); } catch (_) { /* ضمنی */ } made = 0; }
    if (!made) return html;
    const css = '<style id="dio-bind-css">' + dioBindCSS('') + '.dio-pgbrk{display:block !important;height:0 !important;margin:0 !important;' +
      'padding:0 !important;break-before:page !important;page-break-before:always !important;}</style>';
    let out = String(html).replace(/<body([^>]*)>[\s\S]*<\/body>/i, (all, attrs) => '<body' + attrs + '>' + d.body.innerHTML + '</body>');
    out = /<\/head>/i.test(out) ? out.replace(/<\/head>/i, css + '</head>') : css + out;
    return out;
  } catch (e) { try { console.warn('dioBindHtml:', e && e.message); } catch (_) { /* ضمنی */ } return html; }
  finally { f.remove(); }
}
window.dioBindNeeded = dioBindNeeded;
window.dioBindHtml = dioBindHtml;

// ═══ v553: فونٹ کا معیار — دستاویز کا متن 14pt (پرانا مواد بھی) ═══
//  افسر کا قاعدہ: «کسی بھی کارڈ میں یا پورے سسٹم میں default فونٹ 14pt ہے؛ پہلے سے
//  شامل مواد کا فونٹ کم یا زیادہ ہو تو اسے معیاری سائز پر کر دیا جائے — لیکن سرخیوں،
//  ذیلی سرخیوں اور تیسرے درجے کی سرخیوں کے جو قواعد پہلے سے طے ہیں انہیں نہ چھیڑا جائے۔»
//   • لکھنے والے خانے کے اندر جس عنصر پر اپنا فونٹ سائز لکھا ہو (پرانی محفوظ دستاویز،
//     کہیں سے چسپاں متن، پرانے سانچے کی 12px/15px سطریں) → وہ سائز ہٹا کر معیاری 14pt
//   • سرخیاں (h1–h6، عنوان/سرخی والی کلاسیں، موٹی + درمیانی/خط کشیدہ سطر) نہیں چھیڑی جاتیں
//   • v553 کے بعد افسر جو سائز خود لگائے (Ctrl + / −، فونٹ کی فہرست) وہ data-dio-fs سے
//     پہچانا جاتا ہے اور برقرار رہتا ہے
const _DIO_HEAD_SEL = 'h1,h2,h3,h4,h5,h6,[data-heading],[class*="title"],[class*="head"],[class*="formno"],' +
  '[class*="-h1"],[class*="-h2"],[class*="-h3"],.dio-doc-h1,.dio-doc-h2,.dio-doc-h3,.dio-hs1,.dio-hs2,.dio-hs3';
function _dioIsHeadingEl(el, root) {
  for (let n = el; n && n !== root; n = n.parentElement) {
    try { if (n.matches && n.matches(_DIO_HEAD_SEL)) return true; } catch (_) { /* ضمنی */ }
    const st = n.style || {};
    const bold = /bold|[6-9]00/.test(String(st.fontWeight || ''));
    if (bold && (/center/.test(String(st.textAlign || '')) || /underline/.test(String(st.textDecoration || '') + String(st.textDecorationLine || '')))) return true;
  }
  return false;
}
function dioNormFonts(root) {
  if (!root || !root.querySelectorAll) return 0;
  let n = 0;
  root.querySelectorAll('[style*="font-size"], font[size]').forEach(el => {
    if (el === root) return;
    if (el.closest('[data-dio-fs]')) return;               // افسر کا خود لگایا ہوا (v553 کے بعد)
    if (_dioIsHeadingEl(el, root)) return;                  // سرخی — اپنا قاعدہ
    if (/^(TABLE|THEAD|TBODY|TR|TD|TH|IMG|SVG|CANVAS)$/.test(el.tagName)) return;   // ڈھانچہ — صرف متن
    if (el.tagName === 'FONT') { el.removeAttribute('size'); n++; return; }
    el.style.removeProperty('font-size');
    if (!el.getAttribute('style')) el.removeAttribute('style');
    n++;
  });
  return n;
}
// HTML (محفوظ متن) → وہی HTML، پرانے فونٹ سائز معیاری
function dioNormFontsHTML(html) {
  const h = String(html == null ? '' : html);
  if (!/font-size|<font/i.test(h)) return h;
  try {
    const t = document.createElement('template'); t.innerHTML = h;
    const wrap = document.createElement('div'); wrap.appendChild(t.content);
    return dioNormFonts(wrap) ? wrap.innerHTML : h;
  } catch (_) { return h; }
}
window.dioNormFonts = dioNormFonts;
window.dioNormFontsHTML = dioNormFontsHTML;

// ═══ v553: «دو حصوں والا صفحہ» (ملزمان / گواہان — متن FIR کی طرح) کا مشترکہ انداز ═══
//   بٹن دائیں کنارے کے ساتھ، سرخی بالکل درمیان (3 خانوں کا grid)
function _dio2pCSS() {
  return `
    .dio-2p{ direction:rtl; height:100%; overflow-y:auto; padding:10px; width:100%; box-sizing:border-box; }
    .dio-2p .dio-2p-part{ border:1px solid var(--border); border-radius:10px; padding:10px; background:var(--bg-card); }
    .dio-2p .dio-2p-part + .dio-2p-part{ margin-top:22px; }
    .dio-2p .dio-2p-head{ display:grid; grid-template-columns:1fr auto 1fr; align-items:center; column-gap:8px; padding-bottom:6px; margin:0 0 10px; }
    .dio-2p .dio-2p-btn{ justify-self:start; display:flex; }
    .dio-2p .dio-2p-btn .btn{ white-space:nowrap; }
    .dio-2p .dio-2p-title{ text-align:center; white-space:nowrap; font-weight:800; font-family:'Jameel Noori Nastaleeq',serif; }`;
}
window._dio2pCSS = _dio2pCSS;

// ═══════════════════════════════════════════════════════════
//  کاغذ کا سائز — پرنٹ کے وقت (v553، افسر کا قاعدہ)
//  «اوپر کی پٹی سے لیگل/A4 کا انتخاب ہٹائیں — یہ پرنٹ کے وقت طے ہو گا اور
//   سسٹم پرنٹ کے وقت صفحے کے سائز کے لحاظ سے تحریر کو ایڈجسٹ کرے۔»
//  dioAskPaper({current})  → 'legal' | 'a4' | null (منسوخ)
//    Enter = پچھلا انتخاب، Esc = منسوخ۔
//  window.__dioPaperAuto: 'legal'|'a4' → بغیر پوچھے یہی؛ 'keep' → موجودہ ہی
//    (شیئر کی نقل اور «ایک ساتھ کئی دستاویزات» میں ایک بار پوچھا جاتا ہے)۔
//  dioWithPaper({get,set,run}) → پوچھ کر کاغذ لگاتا، ترتیب بیٹھنے دیتا، پھر پرنٹ۔
// ═══════════════════════════════════════════════════════════
window.dioAskPaper = function (opts) {
  opts = opts || {};
  const cur = (opts.current === 'a4') ? 'a4' : 'legal';
  const auto = window.__dioPaperAuto;
  if (auto === 'keep') return Promise.resolve(cur);
  if (auto === 'a4' || auto === 'legal') return Promise.resolve(auto);
  return new Promise(resolve => {
    const old = document.getElementById('dio-paper-ask'); if (old) old.remove();
    const box = document.createElement('div');
    box.id = 'dio-paper-ask'; box.className = 'no-print';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'کاغذ کا سائز');
    const opt = (v, t, sub) => `<button type="button" data-v="${v}" class="${v === cur ? 'is-cur' : ''}">` +
      `<b>${t}</b><small dir="ltr">${sub}</small></button>`;
    box.innerHTML = '<div class="dpa-card" dir="rtl">' +
      '<b class="dpa-h">پرنٹ — کاغذ کا سائز منتخب کریں</b>' +
      '<small class="dpa-sub">تحریر اسی کاغذ کے مطابق خود بخود ترتیب پائے گی</small>' +
      '<div class="dpa-btns">' + opt('legal', 'لیگل', '8.5 × 13 in') + opt('a4', 'A4', '8.27 × 11.69 in') + '</div>' +
      '<button type="button" class="dpa-x" data-v="">منسوخ</button></div>';
    if (!document.getElementById('dio-paper-ask-css')) {
      const st = document.createElement('style'); st.id = 'dio-paper-ask-css';
      st.textContent =
        '#dio-paper-ask{position:fixed;inset:0;z-index:100001;background:rgba(9,20,40,.55);display:flex;align-items:center;justify-content:center;padding:16px;}' +
        '#dio-paper-ask .dpa-card{background:var(--bg-card,#fff);color:var(--text-primary,#111);border:1px solid var(--border,#ccd);border-radius:14px;' +
        'padding:18px 18px 10px;width:min(380px,100%);box-shadow:0 18px 50px rgba(0,0,0,.35);text-align:center;font-family:"Jameel Noori Nastaleeq","Noto Nastaliq Urdu",serif;}' +
        '#dio-paper-ask .dpa-h{display:block;font-size:15pt;line-height:1.9;}' +
        '#dio-paper-ask .dpa-sub{display:block;font-size:10.5pt;color:var(--text-muted,#667);line-height:1.8;margin-bottom:10px;}' +
        '#dio-paper-ask .dpa-btns{display:grid;grid-template-columns:1fr 1fr;gap:10px;}' +
        '#dio-paper-ask .dpa-btns button{min-height:64px;border-radius:12px;border:1.5px solid var(--accent,#13294b);background:transparent;' +
        'color:var(--text-primary,#13294b);cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;}' +
        '#dio-paper-ask .dpa-btns button b{font-size:14pt;line-height:1.5;}' +
        '#dio-paper-ask .dpa-btns button small{font-size:9.5pt;font-family:var(--font-mono,monospace);opacity:.8;}' +
        '#dio-paper-ask .dpa-btns button.is-cur{background:var(--accent,#13294b);color:#fff;}' +
        '#dio-paper-ask .dpa-btns button:focus-visible{outline:3px solid var(--amber,#f59e0b);outline-offset:2px;}' +
        '#dio-paper-ask .dpa-x{margin-top:8px;background:none;border:0;color:var(--text-muted,#667);font-size:11pt;cursor:pointer;font-family:inherit;min-height:36px;}' +
        '@media print{#dio-paper-ask{display:none !important;}}';
      document.head.appendChild(st);
    }
    document.body.appendChild(box);
    let done = false;
    const finish = v => {
      if (done) return; done = true;
      document.removeEventListener('keydown', onKey, true);
      box.remove();
      resolve(v === 'a4' || v === 'legal' ? v : null);
    };
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); finish(null); }
      else if (e.key === 'Enter') {
        e.preventDefault(); e.stopImmediatePropagation();
        const f = document.activeElement && box.contains(document.activeElement) ? document.activeElement.getAttribute('data-v') : cur;
        finish(f || cur);
      }
    };
    document.addEventListener('keydown', onKey, true);
    box.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) { if (e.target === box) finish(null); return; }
      finish(b.getAttribute('data-v'));
    });
    try { const f = box.querySelector('.is-cur'); if (f) f.focus(); } catch (_) { /* ضمنی */ }
  });
};

// پوچھو → کاغذ لگاؤ → ترتیب بیٹھنے دو → پرنٹ (اندر کوئی دوبارہ نہ پوچھے)
window.dioWithPaper = async function (o) {
  let cur = 'legal';
  try { cur = (o.get() === 'a4') ? 'a4' : 'legal'; } catch (_) { /* پہلے سے طے */ }
  const p = await window.dioAskPaper({ current: cur });
  if (!p) return false;
  if (p !== cur && typeof o.set === 'function') {
    try { o.set(p); } catch (e) { try { console.warn('paper set:', e && e.message); } catch (_) { /* ضمنی */ } }
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise(r => setTimeout(r, 350));
  }
  // صرف سب سے باہر والا بلانے والا نشان لگاتا/ہٹاتا ہے — اندر والے (مثلاً چالان
  // کے اندر ضمنی کا پرنٹ، یا «کئی دستاویزات ایک ساتھ») اسے نہیں چھیڑتے۔
  const outer = !window.__dioPaperAuto;
  if (outer) window.__dioPaperAuto = p;
  try { return await o.run(p); } finally { if (outer) window.__dioPaperAuto = undefined; }
};

// ═══════════════════════════════════════════════════════════
//  GLOBAL PRINT HELPER — iframe-based, no double-close, no full-screen stuck
// ═══════════════════════════════════════════════════════════
function dioPrint(htmlContent) {
  // VIEW-ONLY ENFORCEMENT [4E]: میعاد ختم/معطل پر تمام پرنٹنگ بند (ہر دستاویز
  // یہیں سے پرنٹ ہوتی ہے)۔ fail-open: DIO.sub نہ ہو تو پرنٹ چلے۔
  if (window.DIO && DIO.sub && !DIO.sub.guard('پرنٹ')) return;
  // DIRECT PRINT: pehle aik extra in-app preview aata tha (بند کریں/پرنٹ کریں).
  // Woh fazool tha kyunki browser ka apna print dialog pehle se preview deta hai.
  // Ab seedha print par jate hain. (Purana preview chahiye to localStorage mein
  // 'dio_print_preview' = 'on' set karein.)
  if (localStorage.getItem('dio_print_preview') === 'on') {
    _dioPrintPreview(htmlContent);
    return;
  }
  // v553: کئی صفحوں والی دستاویز — جفت صفحات (پچھلی طرف) پر مثل باندھنے کی جگہ
  if (typeof dioBindNeeded === 'function' && dioBindNeeded(htmlContent)) {
    dioBindHtml(htmlContent).then(h => _dioDoPrint(h), () => _dioDoPrint(htmlContent));
    return;
  }
  _dioDoPrint(htmlContent);
}

// ── پوری فائل شیئر (PDF + Word) — dio-share.js (اکتوبر 2026، افسر کی ہدایت) ──
//    ہر «شیئر» بٹن یہی بلاتا ہے: دستاویز کا کاغذ (el) + نام۔ ماڈیول ضرورت پر آتا ہے۔
window.dioShareDoc = async function (el, title) {
  try {
    if (typeof window.dioLoadScript === 'function') {
      await window.dioLoadScript('dio-forms.js');
      await window.dioLoadScript('dio-share.js');
    }
    if (window.DIO && DIO.share && el) { DIO.share.open(el, title); return true; }
  } catch (_) { /* نیچے پیغام */ }
  try { showToast('شیئر کا آلہ لوڈ نہیں ہو سکا — انٹرنیٹ/صفحہ دوبارہ کھولیں', 'error', 5000); } catch (_) { /* ضمنی */ }
  return false;
};
// ماڈیول کا اپنا «پرنٹ» (run) چلا کر وہی کاغذ شیئر — جو پرنٹ میں نظر آتا ہے وہی فائل میں
window.dioSharePrint = async function (run, title, fallbackEl) {
  try {
    if (typeof window.dioLoadScript === 'function') {
      await window.dioLoadScript('dio-forms.js');
      await window.dioLoadScript('dio-share.js');
    }
    if (window.DIO && DIO.share) return DIO.share.fromPrint(run, title, fallbackEl);
  } catch (_) { /* نیچے پیغام */ }
  try { showToast('شیئر کا آلہ لوڈ نہیں ہو سکا — انٹرنیٹ/صفحہ دوبارہ کھولیں', 'error', 5000); } catch (_) { /* ضمنی */ }
  return false;
};

function _dioPrintPreview(htmlContent) {
  const old = document.getElementById('dio-preview-overlay');
  if (old) old.remove();
  const ov = document.createElement('div');
  ov.id = 'dio-preview-overlay';
  ov.className = 'no-print';
  ov.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:99998;background:rgba(0,0,0,0.8);display:flex;flex-direction:column;align-items:center;padding:12px 0;overflow:auto;';
  ov.innerHTML = `
    <div style="display:flex;gap:12px;margin-bottom:10px;direction:rtl;">
      <button id="dio-prev-print" style="background:var(--accent);color:#fff;padding:10px 24px;border:none;border-radius:8px;font-size:16px;cursor:pointer;font-family:'Jameel Noori Nastaleeq',serif;">پرنٹ کریں</button>
      <button id="dio-prev-close" style="background:var(--red);color:#fff;padding:10px 24px;border:none;border-radius:8px;font-size:16px;cursor:pointer;font-family:'Jameel Noori Nastaleeq',serif;">بند کریں</button>
    </div>
    <iframe id="dio-preview-frame" style="width:210mm;max-width:96vw;height:80vh;background:#fff;border:none;border-radius:4px;box-shadow:0 8px 40px rgba(0,0,0,0.5);"></iframe>`;
  document.body.appendChild(ov);
  const f = document.getElementById('dio-preview-frame');
  const d = f.contentWindow.document; d.open(); d.write(htmlContent); d.close();
  document.getElementById('dio-prev-close').onclick = () => ov.remove();
  document.getElementById('dio-prev-print').onclick = () => { ov.remove(); _dioDoPrint(htmlContent); };
}

function _dioDoPrint(htmlContent) {
  // Remove any previous print iframe
  const old = document.getElementById('dio-print-frame');
  if (old) old.remove();
  // continued below…

  // Inject a global print stylesheet that hides everything except the print iframe.
  // Only the working document prints, never the app's tabs/sidebar/toolbars.
  if (!document.getElementById('dio-print-style')) {
    const st = document.createElement('style');
    st.id = 'dio-print-style';
    // AHEM: :has(#dio-print-frame) se scope kiya — yeh style aik dafa head mein
    // add ho kar hamesha rehti hai. Pehle 'body > *:not(#dio-print-frame)' bina
    // shart tha → app-print ke baad iframe hat jata, magar rule reh jata, is liye
    // agli dafa NATIVE (Ctrl+P) print par sab kuch chhup kar KHALI safha chhapta.
    // Ab yeh rule sirf tab lagta hai jab print-iframe MOJOOD ho (app ka apna print).
    st.textContent = `@media print {
      body:has(#dio-print-frame) > *:not(#dio-print-frame) { display: none !important; visibility: hidden !important; }
      #sidebar, .sidebar, #topbar, .topbar, .nav-item, nav, .workspace-tabs,
      .case-tabs, .doc-toolbar, .editor-toolbar, .no-print { display: none !important; }
    }`;
    document.head.appendChild(st);
  }

  // Create hidden iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'dio-print-frame';
  iframe.style.cssText = 'position:fixed;right:-9999px;bottom:-9999px;width:0;height:0;border:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Wait for content + fonts to load, then print once
  const triggerPrint = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch(e) { console.warn('print error', e); }
    // Clean up after printing
    setTimeout(() => { iframe.remove(); }, 1000);
  };

  // Wait for fonts if available, else timeout
  // v555: پہلے فونٹ کی CSS آنے سے پہلے ہی fonts.ready پورا ہو جاتا اور کاغذ کبھی دوسرے فونٹ میں
  //   چھپتا (سطریں بدل کر صفحے کا حساب غلط)۔ اب CSS + اردو فونٹ آنے کا انتظار (حد: 6 سیکنڈ)۔
  if (iframe.contentWindow.document.fonts && iframe.contentWindow.document.fonts.ready) {
    _dioWaitAssets(doc, 6000).then(() => setTimeout(triggerPrint, 200), () => setTimeout(triggerPrint, 200));
  } else {
    setTimeout(triggerPrint, 600);
  }
}

// ── PWA INSTALL PROMPT ────────────────────────────────────────
let _deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  _deferredInstallPrompt = e;
  _showInstallButton();
});

function _showInstallButton() {
  // Show a floating install button (only if not already installed)
  if (document.getElementById('pwa-install-btn')) return;
  const btn = document.createElement('button');
  btn.id = 'pwa-install-btn';
  btn.innerHTML = 'ایپ انسٹال کریں';
  btn.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:9999;background:var(--accent,#38bdf8);color:#fff;border:none;border-radius:24px;padding:12px 20px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.3);font-family:"Jameel Noori Nastaleeq",sans-serif;';
  btn.onclick = _installApp;
  document.body.appendChild(btn);
}

async function _installApp() {
  if (!_deferredInstallPrompt) return;
  _deferredInstallPrompt.prompt();
  const { outcome } = await _deferredInstallPrompt.userChoice;
  if (outcome === 'accepted') {
    showToast('ایپ انسٹال ہو رہی ہے', 'success');
  }
  _deferredInstallPrompt = null;
  const btn = document.getElementById('pwa-install-btn');
  if (btn) btn.remove();
}

// Hide install button once installed
window.addEventListener('appinstalled', function() {
  const btn = document.getElementById('pwa-install-btn');
  if (btn) btn.remove();
  try { showToast('Digital IO آپ کے آلے پر انسٹال ہو گئی', 'success'); } catch(_) { /* paigham na dikh sake to koi baat nahi */ }
});

// ── Explicit global bindings (ensure inline onclick handlers work) ──
if (typeof doLogin === 'function') window.doLogin = doLogin;
if (typeof doLogout === 'function') window.doLogout = doLogout;
if (typeof showPage === 'function') window.showPage = showPage;
if (typeof openCaseWorkspace === 'function') window.openCaseWorkspace = openCaseWorkspace;
if (typeof togglePasswordVisibility === 'function') window.togglePasswordVisibility = togglePasswordVisibility;

// ═══════════════════════════════════════════════════════════════════
//  کیا اِس مقدمہ میں کراس ورژن ہے؟
//  کراس ورژن کے اختیارات صرف اُسی وقت نظر آنے چاہئیں جب "نیا مقدمہ"
//  والے کارڈ میں کراس ورژن پر ✓ لگایا گیا ہو — ورنہ ہر مقدمہ میں
//  فضول اختیارات نظر آتے ہیں۔
// ═══════════════════════════════════════════════════════════════════
//  v554 (افسر کا قاعدہ): «جس مقدمہ میں کراس ورژن درج نہیں کیا گیا اُس میں ہر بار
//   FIR / کراس ورژن کا انتخاب کیوں؟» — وجہ: نئے مقدمے کا فارم اوپر والا مقدمہ نمبر
//   اور تاریخ خود بخود (چھپے) کراس ورژن کے خانوں میں نقل کرتا تھا، اور یہی نقل
//   «کراس ورژن موجود ہے» سمجھی جاتی تھی — یعنی ہر مقدمہ۔ اب:
//     • کارڈ میں کراس ورژن پر ✓ (is_cross_version) = کراس ورژن
//     • پرانا ریکارڈ: صرف اصل کراس ڈیٹا (کراس مدعی، شناختی کارڈ، رپٹ، دفعات، یا
//       اوپر والے سے مختلف کراس مقدمہ نمبر) — خودکار نقل شمار نہیں
function caseHasCross(c) {
  c = c || (typeof currentCase !== 'undefined' ? currentCase : null)
        || (typeof _misalCase !== 'undefined' ? _misalCase : null) || {};
  if (c.is_cross_version === true) return true;
  const T = (v) => String(v == null ? '' : v).trim();
  const ownNo = T(c.cross_fir_number) && T(c.cross_fir_number).replace(/\s/g, '') !== T(c.fir_number).replace(/\s/g, '');
  return !!(T(c.cross_complainant) || T(c.cross_complainant_cnic) || T(c.cross_rapat_number) ||
            T(c.cross_section_of_law) || ownNo);
}
window.caseHasCross = caseHasCross;

// ═══════════════════════════════════════════════════════════════════
//  فائل کا اپنا (in-app) منظر — نئی Chrome ٹیب میں نہیں
//  وجہ: فائل ڈیٹا بیس میں data: URL کی شکل میں محفوظ ہوتی ہے، اور
//  Chrome نئی ٹیب میں data: URL کھولنے سے انکار کر دیتا ہے (اسی لیے
//  ٹیب خالی آتی تھی)۔ اب فائل ایپ کے اندر ہی کھلتی ہے — جیسے چالان۔
// ═══════════════════════════════════════════════════════════════════

// data: URL → blob: URL (blob ہر جگہ چلتا ہے، data نہیں)
function _dioToBlobUrl(url) {
  try {
    if (!url || !url.startsWith('data:')) return url;
    const [head, b64] = url.split(',');
    const mime = (head.match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([arr], { type: mime }));
  } catch (_) { return url; }
}
window._dioToBlobUrl = _dioToBlobUrl;

function _dioIsImage(url, name) {
  return (url || '').startsWith('data:image') ||
         /\.(jpg|jpeg|png|webp|gif)$/i.test(name || '') ||
         /-(jpg|jpeg|png|webp|gif)$/i.test(name || '');
}

function _dioIsPdf(url, name) {
  return /^data:application\/pdf/i.test(url || '') || /\.pdf(\?|#|$)/i.test(url || '') || /\.pdf$/i.test(name || '') || /-pdf$/i.test(name || '');
}
// اپنا PDF ناظر نہیں (موبائل/ٹچ، یا navigator.pdfViewerEnabled = false)
function _dioNeedPdfJs() {
  try { if (navigator.pdfViewerEnabled === false) return true; } catch (_) { /* ضمنی */ }
  try { if (window.dioMobile && dioMobile.isMobile && dioMobile.isMobile()) return true; } catch (_) { /* ضمنی */ }
  try { if (window.matchMedia && matchMedia('(pointer:coarse)').matches && Math.min(screen.width, screen.height) < 900) return true; } catch (_) { /* ضمنی */ }
  return false;
}
function _dioPdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (window._pdfJsLoading) return window._pdfJsLoading;
  window._pdfJsLoading = new Promise((res, rej) => {
    const sc = document.createElement('script');
    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    sc.onload = () => {
      try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; } catch (_) { /* ضمنی */ }
      res(window.pdfjsLib);
    };
    sc.onerror = () => { window._pdfJsLoading = null; sc.remove(); rej(new Error('pdfjs')); };
    document.head.appendChild(sc);
  });
  return window._pdfJsLoading;
}
// فائل کے بائٹ: data: سیدھا (fetch کے بغیر)، ورنہ fetch / XHR
async function _dioFileBytes(url) {
  if (/^data:/i.test(url)) {
    const b64 = url.slice(url.indexOf(',') + 1);
    const bin = atob(b64), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  try { return new Uint8Array(await (await fetch(url)).arrayBuffer()); }
  catch (e) {
    return await new Promise((res, rej) => {
      const x = new XMLHttpRequest(); x.open('GET', url); x.responseType = 'arraybuffer';
      x.onload = () => res(new Uint8Array(x.response)); x.onerror = () => rej(e); x.send();
    });
  }
}
async function _dioRenderPdfInto(ov, srcUrl) {
  const box = ov.querySelector('#dio-fv-frame') ? ov.querySelector('#dio-fv-frame').parentElement : null;
  if (!box) return;
  // کالم کی صورت میں اوپر سے شروع (درمیان سے نہیں — ورنہ پہلا صفحہ اوپر سے کٹ جاتا)
  box.style.flexDirection = 'column'; box.style.alignItems = 'center'; box.style.justifyContent = 'flex-start'; box.style.gap = '10px';
  box.innerHTML = '<div id="dio-fv-pdfmsg" style="color:#fff;padding:30px 16px;text-align:center;font-family:\'Jameel Noori Nastaleeq\',serif;font-size:14pt;">فائل کھل رہی ہے…</div>';
  try {
    const lib = await _dioPdfJs();
    const buf = await _dioFileBytes(srcUrl);
    const pdf = await lib.getDocument({ data: buf }).promise;
    const msg = document.getElementById('dio-fv-pdfmsg'); if (msg) msg.remove();
    const W = Math.max(280, Math.min(box.clientWidth - 20, 1100));
    ov._pdfPages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const pg = await pdf.getPage(i);
      const v1 = pg.getViewport({ scale: 1 });
      const scale = (W / v1.width) * Math.min(2, window.devicePixelRatio || 1.5);
      const vp = pg.getViewport({ scale });
      const c = document.createElement('canvas');
      c.width = Math.round(vp.width); c.height = Math.round(vp.height);
      c.style.cssText = 'width:' + W + 'px;max-width:100%;height:auto;background:#fff;box-shadow:0 4px 20px rgba(0,0,0,.4);';
      await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
      box.appendChild(c);
      ov._pdfPages.push(c);
    }
  } catch (e) {
    try { console.warn('PDF view:', e); } catch (_) { /* ضمنی */ }
    box.innerHTML = '<div style="color:#fff;text-align:center;padding:40px 20px;font-family:\'Jameel Noori Nastaleeq\',serif;">' +
      '<div style="font-size:14pt;margin-bottom:6px;">یہ فائل یہاں نہیں دکھائی جا سکی</div>' +
      '<div style="font-size:11pt;color:#cbd5e1;margin-bottom:16px;">پہلی بار کھولنے کے لیے انٹرنیٹ درکار ہے — یا نیچے سے محفوظ کر کے کھول لیں</div>' +
      '<button class="btn btn-primary" onclick="_dioDownloadFileView()">فائل محفوظ کریں</button></div>';
  }
}
window._dioRenderPdfInto = _dioRenderPdfInto;

// فائل ایپ کے اندر کھولیں
function _dioViewFile(url, name) {
  if (!url) { if (typeof showToast === 'function') showToast('فائل نہیں ملی', 'error'); return; }
  document.getElementById('dio-file-view')?.remove();
  const blob = _dioToBlobUrl(url);
  const isImg = _dioIsImage(url, name);

  const ov = document.createElement('div');
  ov.id = 'dio-file-view';
  ov.style.cssText =
    'position:fixed;inset:0;z-index:99998;background:var(--bg-primary,#0b1826);' +
    'display:flex;flex-direction:column;direction:rtl;';
  ov.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;flex-shrink:0;
         background:var(--bg-secondary);border-bottom:1px solid var(--border);">
      <button onclick="_dioCloseFileView()" title="واپس"
        style="width:34px;height:34px;border-radius:50%;cursor:pointer;border:1px solid var(--border);
               background:var(--bg-card);color:var(--text-primary);font-size:18px;font-weight:900;
               line-height:1;direction:ltr;">←</button>
      <span style="font-weight:700;font-size:14px;">${esc(name || 'فائل')}</span>
      <div style="margin-right:auto;display:flex;gap:6px;">
        <button class="btn btn-secondary btn-sm" onclick="_dioPrintFileView()">پرنٹ</button>
        <button class="btn btn-secondary btn-sm" onclick="_dioShareFileView()" title="شیئر — اصل فائل (تصویر ہو تو PDF / Word بھی)">شیئر</button>
        <button class="btn btn-secondary btn-sm" onclick="_dioDownloadFileView()">محفوظ</button>
      </div>
    </div>
    <div style="flex:1;min-height:0;background:#525659;overflow:auto;display:flex;
                align-items:flex-start;justify-content:center;padding:10px;">
      ${isImg
        ? `<img id="dio-fv-img" src="${blob}" style="max-width:100%;height:auto;background:#fff;box-shadow:0 4px 20px rgba(0,0,0,.4);">`
        : `<iframe id="dio-fv-frame" src="${blob}" style="width:100%;height:100%;border:none;background:#fff;"
             onload="this.dataset.ok='1'"></iframe>
           <div id="dio-fv-fallback" style="display:none;color:#fff;text-align:center;padding:40px 20px;
                font-family:'Jameel Noori Nastaleeq',serif;">
             <div style="font-size:40px;margin-bottom:12px;"><svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:-3px'><path d='M7 3h7l4 4v14H7z'/><path d='M14 3v5h5'/></svg></div>
             <div style="font-size:15px;margin-bottom:6px;">یہ فائل یہاں نہیں دکھائی جا سکی</div>
             <div style="font-size:12px;color:#cbd5e1;margin-bottom:16px;">نیچے سے محفوظ کر کے کھول لیں</div>
             <button class="btn btn-primary" onclick="_dioDownloadFileView()">فائل محفوظ کریں</button>
           </div>`}
    </div>`;
  document.body.appendChild(ov);
  ov._blob = blob; ov._src = url; ov._name = name || 'file'; ov._isImg = isImg;
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', _dioFileViewEsc);
  // v553: موبائل پر (اور جس براؤزر میں اپنا PDF ناظر نہ ہو) PDF صفحہ بہ صفحہ تصویر کی
  //   صورت میں (pdf.js) — پہلے موبائل پر مقدمے کے ساتھ لگی FIR نہ نظر آتی تھی نہ کھلتی تھی
  const isPdf = !isImg && _dioIsPdf(url, name);
  if (isPdf && _dioNeedPdfJs()) { _dioRenderPdfInto(ov, url); return; }
  // Agar iframe (PDF) na chale — jaise browser rok de — to backup dikhao
  if (!isImg) setTimeout(() => {
    try {
      const fr = document.getElementById('dio-fv-frame');
      const fb = document.getElementById('dio-fv-fallback');
      if (fr && fb && fr.dataset.ok !== '1') { fr.style.display = 'none'; fb.style.display = 'block'; }
    } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  }, 1500);
}
window._dioViewFile = _dioViewFile;

function _dioFileViewEsc(e) { if (e.key === 'Escape') _dioCloseFileView(); }

function _dioCloseFileView() {
  const ov = document.getElementById('dio-file-view');
  if (!ov) return;
  try { if (ov._blob && ov._blob.startsWith('blob:')) URL.revokeObjectURL(ov._blob); } catch (_) { /* blob pehle hi aazad ho to koi baat nahi */ }
  ov.remove();
  document.body.style.overflow = '';
  document.removeEventListener('keydown', _dioFileViewEsc);
}
window._dioCloseFileView = _dioCloseFileView;

// پرنٹ — ایپ کے اندر ہی (نئی ٹیب نہیں)
function _dioPrintFileView() {
  const ov = document.getElementById('dio-file-view');
  if (!ov) return;
  if (ov._isImg) {
    const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title> </title>
      <style>@page{size:A4;margin:8mm}html,body{margin:0;padding:0;}
      img{max-width:100%;max-height:98vh;display:block;margin:0 auto;}</style></head>
      <body><img src="${ov._blob}"></body></html>`;
    if (typeof dioPrint === 'function') { dioPrint(html); return; }
  }
  // v553: pdf.js سے بنے صفحات (موبائل) — ہر صفحہ ایک تصویر، اپنے پرنٹ سے
  if (ov._pdfPages && ov._pdfPages.length) {
    const imgs = ov._pdfPages.map(c => '<img src="' + c.toDataURL('image/jpeg', 0.92) + '">').join('');
    const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title> </title><style>@page{size:A4;margin:6mm}html,body{margin:0;padding:0;}' +
      'img{width:100%;height:auto;display:block;break-after:page;page-break-after:always;}img:last-child{break-after:auto;page-break-after:auto;}</style></head><body>' + imgs + '</body></html>';
    if (typeof dioPrint === 'function') { dioPrint(html); return; }
  }
  // PDF — usi iframe ko chhapo
  const f = document.getElementById('dio-fv-frame');
  try { f.contentWindow.focus(); f.contentWindow.print(); return; } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  try { window.print(); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
}
window._dioPrintFileView = _dioPrintFileView;

function _dioDownloadFileView() {
  const ov = document.getElementById('dio-file-view');
  if (!ov) return;
  const a = document.createElement('a');
  a.href = ov._blob; a.download = ov._name || 'file';
  document.body.appendChild(a); a.click(); a.remove();
}
window._dioDownloadFileView = _dioDownloadFileView;

// ── v553: کوئی بھی لگی ہوئی / محفوظ فائل شیئر (افسر کا قاعدہ: «کسی بھی فائل یا ڈیٹا کو
//    Word یا PDF میں export یا share کیا جا سکے») ──
//    • تصویر → پورے صفحے پر رکھ کر PDF / Word (انتخاب کا خانہ)
//    • PDF / Word / دیگر → اصل فائل جوں کی توں (موبائل: شیئر شیٹ، ورنہ ڈاؤن لوڈ)
async function _dioFileBlob(url) {
  const m = /^data:([^;,]+)/i.exec(url || '');
  if (m) return new Blob([await _dioFileBytes(url)], { type: m[1] });   // fetch کے بغیر (CSP)
  const r = await fetch(url);
  if (!r.ok) throw new Error('فائل نہیں ملی (' + r.status + ')');
  return await r.blob();
}
window.dioShareFileUrl = async function (url, name, mime) {
  if (!url) { try { showToast('فائل نہیں ملی', 'error'); } catch (_) { /* ضمنی */ } return false; }
  try {
    if (typeof window.dioLoadScript === 'function') { await window.dioLoadScript('dio-forms.js'); await window.dioLoadScript('dio-share.js'); }
    const title = String(name || 'فائل');
    if (_dioIsImage(url, name) && window.DIO && DIO.share && DIO.share.open) {
      const base = title.replace(/\.(png|jpe?g|gif|webp|bmp|heic)$/i, '') || 'تصویر';
      const src = /^(data:|blob:)/i.test(url) ? url : URL.createObjectURL(await _dioFileBlob(url));
      DIO.share.open({ html: '<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title> </title><style>@page{size:A4;margin:8mm}' +
        'html,body{margin:0;padding:0;}img{max-width:100%;max-height:275mm;display:block;margin:0 auto;}</style></head><body><img src="' + src + '"></body></html>' }, base);
      return true;
    }
    const blob = await _dioFileBlob(url);
    const type = mime || blob.type || (_dioIsPdf(url, name) ? 'application/pdf' : 'application/octet-stream');
    let fname = title.replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'file';
    if (!/\.[a-z0-9]{2,5}$/i.test(fname)) {
      const ext = { 'application/pdf': '.pdf', 'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx' }[type];
      if (ext) fname += ext;
    }
    const file = new File([blob], fname, { type: type });
    if (!(window.DIO && DIO.share && DIO.share.deliver)) throw new Error('شیئر کا آلہ لوڈ نہیں ہوا');
    const r = await DIO.share.deliver([file], title);
    if (r !== 'cancel') showToast(r === 'shared' ? 'فائل شیئر کے لیے بھیج دی گئی' : 'فائل تیار — ڈاؤن لوڈ ہو گئی', 'success');
    return true;
  } catch (e) {
    try { showToast('فائل شیئر نہیں ہو سکی — ' + ((e && e.message) || 'انٹرنیٹ دیکھیں'), 'error', 5000); } catch (_) { /* ضمنی */ }
    return false;
  }
};
function _dioShareFileView() {
  const ov = document.getElementById('dio-file-view');
  if (!ov) return;
  // اصل پتہ (data: / https) — blob: کو CSP کا connect-src پڑھنے نہیں دیتا
  return window.dioShareFileUrl(ov._src || ov._blob, ov._name);
}
window._dioShareFileView = _dioShareFileView;


/* ═══════════════════════════════════════════════════════════════════════
   Ctrl+P — چالان (اور آگے دیگر دستاویزات) کی چھپائی ایک ہی راستے سے
   ───────────────────────────────────────────────────────────────────────
   مسئلہ: چالان کی چھپائی کے دو الگ راستے تھے، اور دونوں کا نتیجہ مختلف:

     • سسٹم کا 🖨️ بٹن → `_printR173()` ایک **نیا** HTML دستاویز بناتا ہے،
       کاغذ کی اصل چوڑائی پر ناپ لیتا ہے، خانوں کی ناپ inline px میں پکی
       کرتا ہے، اور اپنا فونٹ خود لوڈ کرتا ہے۔
     • Ctrl+P → براؤزر سیدھا **زندہ صفحہ** چھاپ دیتا تھا، صرف
       `@media print` کے سہارے — نہ وہ ناپ، نہ وہ پکی inline قدریں۔

   اِسی لیے دونوں کی شکل الگ آتی تھی (خاص طور پر خانوں کی چوڑائی اور
   CNIC کے فاصلے)۔

   حل: چالان کھلا ہو تو Ctrl+P کو روک کر اُسی سرکاری راستے (`_printR173`)
   پر بھیج دیا جاتا ہے۔ یعنی دونوں طریقوں سے **بالکل ایک ہی** نتیجہ۔

   اہم: report173.js کو ہاتھ نہیں لگایا گیا — وہ فائل v385 پر مقفل (LOCKED)
   ہے اور ناپ کی ترتیب نہایت نازک ہے۔ یہ صرف ایک اضافی keydown سننے والا ہے۔
   نقشہ موقع کا اپنا Ctrl+P پہلے سے موجود ہے، اِس لیے اُس کے کھلے ہونے پر
   یہ خاموش رہتا ہے (دو بار چھپائی نہ ہو)۔
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  if (window._dioCtrlPBound) return;
  window._dioCtrlPBound = true;

  function _nazarMein(el) {
    if (!el) return false;
    try {
      if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    } catch (_) { return false; }
  }

  document.addEventListener('keydown', function (e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
    if (String(e.key || '').toLowerCase() !== 'p') return;
    if (e.defaultPrevented) return;          // v552: پہلے سننے والے نے پرنٹ چلا دیا — دوبارہ نہیں

    // نقشہ موقع کا اپنا handler ہے — یہاں کچھ نہ کریں
    if (_nazarMein(document.getElementById('dio-naqsha-doc'))) return;

    // چالان کھلا ہے؟
    const ch = document.getElementById('ch173-doc');
    if (!_nazarMein(ch)) return;
    // v552: یہ ضمنی ہے (چالان نہیں) — ضمنی کا اپنا پرنٹ
    if (ch.querySelector('.zf-tbl') && typeof window._printZimniCurrent === 'function') {
      e.preventDefault(); e.stopPropagation(); window._printZimniCurrent(); return;
    }
    // v558: اندرونی ضمنی (بیانات 161) — اپنا پرنٹ، چالان والا نہیں
    if (ch.querySelector('.zfa-tbl') && typeof window._printZimniA === 'function') {
      e.preventDefault(); e.stopPropagation(); window._printZimniA(); return;
    }
    if (typeof window._printR173 !== 'function' && typeof _printR173 !== 'function') return;

    e.preventDefault();
    e.stopPropagation();
    try {
      (window._printR173 || _printR173)();
    } catch (_) {
      // آخری سہارا — کم از کم براؤزر کی چھپائی چل جائے
      try { window.print(); } catch (__) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
    }
  }, true);
})();
