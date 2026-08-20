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
          + '<div style="font-size:48px;margin-bottom:16px;">📡</div>'
          + '<div style="font-size:18px;font-weight:700;margin-bottom:10px;">کنکشن کا مسئلہ</div>'
          + '<div style="font-size:14px;color:#7d97ad;line-height:1.8;margin-bottom:20px;">انٹرنیٹ سے لائبریری لوڈ نہیں ہو سکی۔ براہِ کرم انٹرنیٹ چیک کریں اور دوبارہ کوشش کریں۔</div>'
          + '<button onclick="location.reload(true)" style="background:#38bdf8;color:#fff;border:none;border-radius:10px;padding:12px 28px;font-size:15px;font-weight:700;cursor:pointer;">🔄 دوبارہ کوشش کریں</button>'
          + '</div>';
      }
    }, 2500);
  });
}
const supabaseClient = (window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
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
  officer:    ['dashboard','cases','fivec','incident','reminders','law','templates','search','suspects','performance','backup','settings','bin','subscription','court','evidence'],
  supervisor: ['dashboard','cases','fivec','incident','reminders','law','templates','search','suspects','performance','backup','settings','bin','subscription','court','evidence'],
  admin:      ['dashboard','cases','fivec','incident','reminders','law','templates','search','suspects','performance','backup','settings','bin','subscription','court','evidence','admin'],
  superadmin: ['dashboard','cases','fivec','incident','reminders','law','templates','search','suspects','performance','backup','settings','bin','subscription','court','evidence','admin'],
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
        await supabaseClient.from('usage_stats')
          .update({ count: (existing.count||0) + count, last_used: new Date().toISOString() })
          .eq('id', existing.id);
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
    showToast('🔒 آپ کو اس صفحے تک رسائی نہیں ہے', 'error');
    return;
  }
  window._activePage = page;  // Track current page for background refresh
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
    fivec:'مارک شدہ درخواستیں', incident:'واقعاتی رپورٹ',
    law:'قانونی لائبریری', performance:'کارکردگی', backup:'بیک اپ',
    settings:'ترتیبات', admin:'ایڈمن', bin:'حذف شدہ مواد',
    reminders:'یاددہانیاں', search:'تلاش',
    court:'عدالتی پیشیاں', evidence:'شہادتیں', suspects:'ملزمان / گواہان',
  };
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = (titles[page]||page);

  // Update URL hash
  try { history.replaceState(null,'','#'+page); } catch(_) {}

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
        <div style="font-size:40px;">⚠️</div>
        <div style="font-size:15px;margin-top:10px;color:var(--text-secondary);">صفحہ کھولنے میں مسئلہ</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:8px;font-family:monospace;direction:ltr;">${(err&&err.message)||err}</div>
        <button class="btn btn-secondary btn-sm" style="margin-top:14px;" onclick="showPage('${page}',null)">🔄 دوبارہ کوشش</button>
      </div>`;
    }
  } else {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);">
      <div style="font-size:48px;">🚧</div>
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
    } catch (_) {}
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
function closeModal() {
  const bd = document.getElementById('modal-backdrop');
  if (bd) bd.style.display = 'none';
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
// Alias — same HTML-escaper under the name used across print/innerHTML sinks.
const escapeHtml = esc;
window.escapeHtml = esc;

// ── SANITIZE rich-text HTML (for contenteditable-saved content) ──
// Keeps formatting (<b>, <br>, tables) but strips scripts & event handlers.
function sanitizeHtml(html) {
  if (html == null) return '';
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
window.addMicButton = function(inputElement) {
  if (!inputElement || inputElement._micAdded) return;
  inputElement._micAdded = true;
  const micBtn = document.createElement('button');
  micBtn.innerHTML = '🎙️';
  micBtn.type = 'button';
  micBtn.style.cssText = 'border:none;background:transparent;cursor:pointer;font-size:18px;padding:2px 6px;vertical-align:middle;';
  micBtn.title = 'آواز سے لکھیں';
  // Place the mic button right after the field
  if (inputElement.nextSibling) inputElement.parentNode.insertBefore(micBtn, inputElement.nextSibling);
  else inputElement.parentNode.appendChild(micBtn);

  let recognition;
  micBtn.addEventListener('click', () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('آپ کا براؤزر آواز کی پہچان کی حمایت نہیں کرتا'); return; }
    if (recognition) { try { recognition.stop(); } catch(_) {} recognition = null; micBtn.innerHTML='🎙️'; return; }
    recognition = new SR();
    recognition.lang = 'ur-PK';
    recognition.continuous = true;
    recognition.interimResults = true;
    micBtn.innerHTML = '🔴';
    const isCE = inputElement.isContentEditable;
    const base = isCE ? (inputElement.innerText||'') : (inputElement.value||'');
    recognition.onresult = (e) => {
      let t = '';
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
      if (isCE) { inputElement.innerText = (base?base+' ':'') + t; inputElement.style.fontWeight='bold'; }
      else { inputElement.value = (base?base+' ':'') + t; inputElement.style.fontWeight='bold'; }
    };
    recognition.onend = () => { micBtn.innerHTML = '🎙️'; recognition = null; };
    recognition.onerror = () => { micBtn.innerHTML = '🎙️'; recognition = null; };
    try { recognition.start(); } catch(_) { micBtn.innerHTML='🎙️'; }
  });
};
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
  } catch(_) {}
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
      <div style="font-size:34px;margin-bottom:10px;">⚠️</div>
      <div style="font-size:17px;font-weight:bold;margin-bottom:6px;color:var(--text-primary,#111);">کیا آپ واقعی حذف کرنا چاہتے ہیں؟</div>
      <div style="font-size:14px;color:var(--text-secondary,#777);margin-bottom:20px;">${itemName||''}</div>
      <div style="display:flex;gap:12px;justify-content:center;">
        <button id="_cd-cancel" style="padding:10px 22px;border:1px solid var(--border,#ccc);border-radius:8px;background:transparent;color:var(--text-primary,#111);cursor:pointer;font-size:15px;">منسوخ</button>
        <button id="_cd-ok" style="padding:10px 22px;border:none;border-radius:8px;background:#dc3545;color:#fff;cursor:pointer;font-size:15px;">✕ حذف کریں</button>
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
      <div style="font-size:46px;margin-bottom:14px;">📂</div>
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
  } catch(_) {}
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
    try { recent = JSON.parse(localStorage.getItem('suggest_'+categoryKey) || '[]'); } catch(_) {}
    const all = [...new Set([...recent, ...extra])].slice(0, 8);
    box.innerHTML = '';
    if (!all.length) return;
    const cur = (inputEl.isContentEditable ? inputEl.innerText : inputEl.value || '').trim();
    all.filter(s => s && s !== cur).forEach(s => {
      const chip = document.createElement('span');
      chip.style.cssText = 'display:inline-flex;align-items:center;gap:4px;font-style:italic;color:#888;font-size:12px;border:1px dashed #bbb;border-radius:12px;padding:2px 8px;cursor:pointer;';
      chip.innerHTML = `${s} <b style="color:var(--accent,#2563eb);font-style:normal;">✓</b>`;
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
  let v = input.value.replace(/\D/g,'').slice(0,8);
  if (v.length>4) v = v.slice(0,2)+'-'+v.slice(2,4)+'-'+v.slice(4);
  else if (v.length>2) v = v.slice(0,2)+'-'+v.slice(2);
  input.value = v;
}

// ── SUPABASE DATA FUNCTIONS ───────────────────────────────────
async function updateBadges() {
  try {
    const oid = await getOfficerId();
    if (!oid) return;
    if (!navigator.onLine) return;  // Skip network call when offline
    const [{ count:cases },{ count:rems }] = await Promise.all([
      supabaseClient.from('cases').select('id',{count:'exact',head:true}).eq('officer_id',oid),
      supabaseClient.from('reminders').select('id',{count:'exact',head:true}).eq('officer_id',oid).eq('is_done',false),
    ]);
    const b = document.getElementById('badge-cases');
    if (b) { b.textContent = cases||0; b.style.display = cases>0?'inline':'none'; }
    const r = document.getElementById('badge-reminders');
    if (r) { r.textContent = rems||0; r.style.display = rems>0?'inline':'none'; }
  } catch(_) {}
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
  if (!_photo) { try { _photo = localStorage.getItem('dio_profile_photo') || localStorage.getItem('officer_photo_url'); } catch(_) {} }
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
function _updateTopbarShoDsp(o) {
  const shoEl = document.getElementById('topbar-sho');
  const dspEl = document.getElementById('topbar-dsp');
  if (shoEl) { shoEl.style.display='block'; shoEl.innerHTML=`<span style="color:var(--accent);font-weight:700;">SHO</span>`; }
  if (dspEl) { dspEl.style.display='block'; dspEl.innerHTML=`<span style="color:var(--accent);font-weight:700;">DSP/SDPO</span>`; }
}

async function _saveTopbarField(field) {
  const val = document.getElementById('topbar-edit-val')?.value.trim()||'';
  const rank = document.getElementById('topbar-edit-rank')?.value || '';
  const update = field==='sho' ? { sho_name:val, ...(rank?{sho_rank:rank}:{}) } : { dsp_name:val };
  try {
    const updated = await updateOfficerProfile(update);
    _updateTopbarShoDsp(updated);
    closeModal();
    showToast('✅ محفوظ','success');
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

// ── CONNECTION STATUS ──────────────────────────────────────────
function updateConnectionStatus(online) {
  const dot  = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  const badge= document.getElementById('db-badge');
  if (dot)  dot.className  = 'status-dot' + (online?' status-online':' status-offline');
  if (text) text.textContent = online ? 'آن لائن' : 'آف لائن';
  if (badge) badge.textContent = online ? '🔗 Connected' : '⚡ Offline';
}

// ── SYNC STATUS (S4) ──────────────────────────────────────────
function markSynced() {
  try { localStorage.setItem('dio_last_sync', Date.now().toString()); } catch(_) {}
  _updateSyncLabel();
}
function _updateSyncLabel() {
  const el = document.getElementById('sync-label');
  if (!el) return;
  let ts = 0;
  try { ts = parseInt(localStorage.getItem('dio_last_sync')||'0'); } catch(_) {}
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
  try { _remindersFailedAt = Date.now(); } catch(_) {}
});
// Internet wapas aane par backoff hata do
window.addEventListener('online', () => {
  try { _remindersFailedAt = 0; } catch(_) {}
});

window.addEventListener('online',  ()=>{ updateConnectionStatus(true); _syncOfflineQueue(); });
window.addEventListener('offline', ()=>updateConnectionStatus(false));

// ── SYNC offline queue when back online ───────────────────────
async function _syncOfflineQueue() {
  if (typeof offlineStore === 'undefined' || !navigator.onLine) return;
  try {
    const count = await offlineStore.pendingCount();
    if (!count) return;
    showToast(`🔄 ${count} تبدیلیاں sync ہو رہی ہیں...`, 'info');
    const synced = await offlineStore.processQueue(supabaseClient);
    if (synced > 0) {
      showToast(`✅ ${synced} تبدیلیاں sync ہو گئیں`, 'success');
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
  } catch(_) {}
}

// ── PUSH NOTIFICATIONS ────────────────────────────────────────
async function _initNotifications() {
  if (!('Notification' in window)) return;
  if (Notification.permission==='default') {
    const perm = await Notification.requestPermission();
    if (perm==='granted') showToast('🔔 اطلاعات فعال','success');
  }
}

function _showNotification(title, body, tag) {
  if (Notification.permission!=='granted') return;
  try {
    const n = new Notification(title,{body,tag:tag||'dio',icon:'/icon-192.png',dir:'rtl',lang:'ur',vibrate:[200,100,200]});
    n.onclick = ()=>{ window.focus(); n.close(); };
    setTimeout(()=>n.close(),8000);
  } catch(_) {}
}

async function _checkDueReminders() {
  try {
    if (Notification.permission!=='granted') return;
    const rems = await getReminders();
    const today = new Date().toISOString().split('T')[0];
    const due = rems.filter(r=>!r.is_done&&r.reminder_date&&r.reminder_date<=today);
    if (!due.length) return;
    due.slice(0,3).forEach((r,i)=>{
      setTimeout(()=>_showNotification(`🔔 یاددہانی — ${r.reminder_date===today?'آج':'گزر گئی'}`,r.text.slice(0,100),'rem-'+r.id),i*1500);
    });
    if (due.length>3) setTimeout(()=>_showNotification('🔔 Digital IO',`${due.length} یاددہانیاں باقی`,'rem-count'),5000);
  } catch(_) {}
}

function _logUsage(label) {
  try {
    const d = JSON.parse(localStorage.getItem(_usageKey)||'{}');
    d[label] = (d[label]||0)+1;
    localStorage.setItem(_usageKey, JSON.stringify(d));
  } catch(_) {}
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

// ── VOICE INPUT ───────────────────────────────────────────────
function voiceType(targetId, btnId) {
  if (!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)) {
    showToast('⚠️ آواز کی سہولت دستیاب نہیں','warn'); return;
  }
  const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
  const rec = new SR();
  rec.lang = 'ur-PK'; rec.continuous = false; rec.interimResults = false;
  const btn = document.getElementById(btnId);
  if (btn) { btn.textContent='🔴'; btn.disabled=true; }
  rec.onresult = e => {
    const inp = document.getElementById(targetId);
    if (inp) { inp.value += (inp.value?' ':'')+e.results[0][0].transcript; inp.dispatchEvent(new Event('input')); }
  };
  rec.onerror = () => showToast('⚠️ آواز سننے میں مشکل','warn');
  rec.onend   = () => { if(btn){btn.textContent='🎙️';btn.disabled=false;} };
  rec.start();
}

function openThemePicker() {
  const themes = ['dark','light','forest','ocean','sunset'];
  const labels = {dark:'🌙 Dark',light:'☀️ Light',forest:'🌿 Forest',ocean:'🌊 Ocean',sunset:'🌅 Sunset'};
  openModal('🎨 تھیم منتخب کریں',
    `<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">
      ${themes.map(t=>`<button onclick="setTheme('${t}');closeModal();" style="padding:10px 20px;border-radius:8px;border:2px solid var(--border);background:var(--bg-secondary);color:var(--text-primary);cursor:pointer;font-size:13px;">${labels[t]}</button>`).join('')}
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
  try { localStorage.setItem('dio_theme', t); } catch(_) {}
}

// Load saved theme — default to LIGHT if none chosen
(function(){
  let t = localStorage.getItem('dio_theme');
  if (!t) {
    // No theme chosen — default to light
    t = 'light';
    try { localStorage.setItem('dio_theme', 'light'); } catch(_) {}
  }
  setTheme(t);
})();

// ── FONT SIZE (accessibility — har officer apni pasand rakh sake) ──────────
// Base html font-size badalne se poori app proportionally choti/bari hoti hai.
const DIO_FONT_SIZES = { small: '15px', medium: '16px', large: '18px', xlarge: '20px' };
function setFontSize(key) {
  const px = DIO_FONT_SIZES[key] || DIO_FONT_SIZES.medium;
  document.documentElement.style.fontSize = px;
  try { localStorage.setItem('dio_font_size', key); } catch(_) {}
}
function getFontSize() {
  return localStorage.getItem('dio_font_size') || 'medium';
}
// Apply saved font-size on load (default medium = 16px)
(function(){ setFontSize(getFontSize()); })();
window.setFontSize = setFontSize;
window.getFontSize = getFontSize;

// ── AUTH ──────────────────────────────────────────────────────

// ── INIT APP ──────────────────────────────────────────────────
async function initApp() {
  // App lock removed — clear any leftover lock state and overlays
  try {
    localStorage.removeItem('digital_io_locked');
    localStorage.removeItem('digital_io_pin_hash');
  } catch(_) {}
  ['pin-lock-overlay','dio-pin-overlay'].forEach(id => { const e=document.getElementById(id); if(e) e.remove(); });
  updateSidebarProfile();
  // Refresh avatar again after profile fully loads (photo persistence)
  setTimeout(() => { if (typeof updateSidebarProfile === 'function') updateSidebarProfile(); }, 600);
  updateConnectionStatus(navigator.onLine);
  await updateBadges();
  startClock();
  initBackupSystem();
  setupRealtimeSync(async(table)=>{
    await updateBadges();
    const pt = document.getElementById('topbar-title')?.textContent;
    if(table==='cases'&&pt?.includes('مقدمات')) renderCases&&renderCases(document.getElementById('page-content'));
    if(table==='reminders'&&pt?.includes('یاددہانی')) renderReminders&&renderReminders(document.getElementById('page-content'));
  });
  // Check license
  if (typeof checkLicense==='function') checkLicense();
  showPage('dashboard', document.querySelector('.nav-item'));
  setTimeout(()=>triggerBackup('app_init'), 3000);
  setTimeout(_initNotifications, 2000);
  setTimeout(_checkDueReminders, 5000);
  setInterval(_checkDueReminders, 30*60*1000);
  // Start Islamic messages
  setTimeout(()=>{ if(typeof initIslamicMessages==='function') initIslamicMessages(); }, 1500);
  setTimeout(()=>{ if(typeof updateNotifBadge==='function') updateNotifBadge(); }, 2000);
  // Check subscription
  setTimeout(async()=>{
    if(typeof showSubscriptionBanner==='function') await showSubscriptionBanner();
    if(typeof updateSubBadge==='function') await updateSubBadge();
  }, 2000);
}

// ═══════════════════════════════════════════════════════════
//  GLOBAL PRINT HELPER — iframe-based, no double-close, no full-screen stuck
// ═══════════════════════════════════════════════════════════
function dioPrint(htmlContent) {
  // DIRECT PRINT: pehle aik extra in-app preview aata tha (بند کریں/پرنٹ کریں).
  // Woh fazool tha kyunki browser ka apna print dialog pehle se preview deta hai.
  // Ab seedha print par jate hain. (Purana preview chahiye to localStorage mein
  // 'dio_print_preview' = 'on' set karein.)
  if (localStorage.getItem('dio_print_preview') === 'on') {
    _dioPrintPreview(htmlContent);
    return;
  }
  _dioDoPrint(htmlContent);
}

function _dioPrintPreview(htmlContent) {
  const old = document.getElementById('dio-preview-overlay');
  if (old) old.remove();
  const ov = document.createElement('div');
  ov.id = 'dio-preview-overlay';
  ov.className = 'no-print';
  ov.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:99998;background:rgba(0,0,0,0.8);display:flex;flex-direction:column;align-items:center;padding:12px 0;overflow:auto;';
  ov.innerHTML = `
    <div style="display:flex;gap:12px;margin-bottom:10px;direction:rtl;">
      <button id="dio-prev-print" style="background:#1a73e8;color:#fff;padding:10px 24px;border:none;border-radius:8px;font-size:16px;cursor:pointer;font-family:'Jameel Noori Nastaleeq',serif;">🖨️ پرنٹ کریں</button>
      <button id="dio-prev-close" style="background:#dc3545;color:#fff;padding:10px 24px;border:none;border-radius:8px;font-size:16px;cursor:pointer;font-family:'Jameel Noori Nastaleeq',serif;">✕ بند کریں</button>
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
    st.textContent = `@media print {
      body > *:not(#dio-print-frame) { display: none !important; visibility: hidden !important; }
      #sidebar, .sidebar, #topbar, .topbar, .nav-item, nav, .workspace-tabs,
      .case-tabs, .doc-toolbar, .editor-toolbar, .no-print, #islamic-bar { display: none !important; }
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
  if (iframe.contentWindow.document.fonts && iframe.contentWindow.document.fonts.ready) {
    iframe.contentWindow.document.fonts.ready.then(() => setTimeout(triggerPrint, 300));
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
  btn.innerHTML = '📲 ایپ انسٹال کریں';
  btn.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:9999;background:var(--accent,#38bdf8);color:#fff;border:none;border-radius:24px;padding:12px 20px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.3);font-family:"Jameel Noori Nastaleeq",sans-serif;';
  btn.onclick = _installApp;
  document.body.appendChild(btn);
}

async function _installApp() {
  if (!_deferredInstallPrompt) return;
  _deferredInstallPrompt.prompt();
  const { outcome } = await _deferredInstallPrompt.userChoice;
  if (outcome === 'accepted') {
    showToast('✅ ایپ انسٹال ہو رہی ہے', 'success');
  }
  _deferredInstallPrompt = null;
  const btn = document.getElementById('pwa-install-btn');
  if (btn) btn.remove();
}

// Hide install button once installed
window.addEventListener('appinstalled', function() {
  const btn = document.getElementById('pwa-install-btn');
  if (btn) btn.remove();
  try { showToast('✅ Digital IO آپ کے آلے پر انسٹال ہو گئی', 'success'); } catch(_) {}
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
function caseHasCross(c) {
  c = c || (typeof currentCase !== 'undefined' ? currentCase : null)
        || (typeof _misalCase !== 'undefined' ? _misalCase : null) || {};
  return !!(c.cross_complainant || c.cross_fir_number || c.cross_rapat_number ||
            c.cross_complainant_cnic || c.cross_section_of_law);
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

// فائل ایپ کے اندر کھولیں
function _dioViewFile(url, name) {
  if (!url) { if (typeof showToast === 'function') showToast('❌ فائل نہیں ملی', 'error'); return; }
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
        <button class="btn btn-secondary btn-sm" onclick="_dioPrintFileView()">🖨️ پرنٹ</button>
        <button class="btn btn-secondary btn-sm" onclick="_dioDownloadFileView()">⬇️ محفوظ</button>
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
             <div style="font-size:40px;margin-bottom:12px;">📄</div>
             <div style="font-size:15px;margin-bottom:6px;">یہ فائل یہاں نہیں دکھائی جا سکی</div>
             <div style="font-size:12px;color:#cbd5e1;margin-bottom:16px;">نیچے سے محفوظ کر کے کھول لیں</div>
             <button class="btn btn-primary" onclick="_dioDownloadFileView()">⬇️ فائل محفوظ کریں</button>
           </div>`}
    </div>`;
  document.body.appendChild(ov);
  ov._blob = blob; ov._name = name || 'file'; ov._isImg = isImg;
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', _dioFileViewEsc);
  // Agar iframe (PDF) na chale — jaise browser rok de — to backup dikhao
  if (!isImg) setTimeout(() => {
    try {
      const fr = document.getElementById('dio-fv-frame');
      const fb = document.getElementById('dio-fv-fallback');
      if (fr && fb && fr.dataset.ok !== '1') { fr.style.display = 'none'; fb.style.display = 'block'; }
    } catch (_) {}
  }, 1500);
}
window._dioViewFile = _dioViewFile;

function _dioFileViewEsc(e) { if (e.key === 'Escape') _dioCloseFileView(); }

function _dioCloseFileView() {
  const ov = document.getElementById('dio-file-view');
  if (!ov) return;
  try { if (ov._blob && ov._blob.startsWith('blob:')) URL.revokeObjectURL(ov._blob); } catch (_) {}
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
  // PDF — usi iframe ko chhapo
  const f = document.getElementById('dio-fv-frame');
  try { f.contentWindow.focus(); f.contentWindow.print(); return; } catch (_) {}
  try { window.print(); } catch (_) {}
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
