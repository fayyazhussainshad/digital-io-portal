/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — APP CORE  (app-core.js)
   Auth · Data · UI · Voice · Penal Codes · Notifications
   Digital IO — Tafteeshi Officer ka Chhotu
   ═══════════════════════════════════════════════════════════ */

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
  officer:    ['dashboard','cases','forms','fivec','incident','patrol','diary','cdr','law','reminders','search','suspects','performance','backup','settings','bin','subscription','court','evidence'],
  supervisor: ['dashboard','cases','forms','fivec','incident','patrol','diary','cdr','law','reminders','search','suspects','performance','backup','settings','bin','subscription','court','evidence'],
  admin:      ['dashboard','cases','forms','fivec','incident','patrol','diary','cdr','law','reminders','search','suspects','performance','backup','settings','bin','subscription','court','evidence','admin'],
  superadmin: ['dashboard','cases','forms','fivec','incident','patrol','diary','cdr','law','reminders','search','suspects','performance','backup','settings','bin','subscription','court','evidence','admin'],
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
function canViewTeam() {
  return hasRole('supervisor');
}

// ── BUTTON/PAGE USAGE TRACKING (admin analytics) ──────────────
let _usageBuffer = {};
let _usageTimer = null;

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
    dashboard:'ڈیش بورڈ', cases:'میرے مقدمات', forms:'ٹیمپلیٹس',
    fivec:'مارک شدہ درخواستیں', incident:'واقعاتی رپورٹ', patrol:'گشت',
    law:'قانونی لائبریری', performance:'کارکردگی', backup:'بیک اپ',
    settings:'ترتیبات', admin:'ایڈمن', bin:'حذف شدہ مواد',
    reminders:'یاددہانیاں', search:'تلاش', cdr:'CDR Analyzer',
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
function formatDate(d) {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString('en-PK',{day:'2-digit',month:'2-digit',year:'numeric'});
  } catch(_) { return d; }
}

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

function autoFormatCNIC(input) {
  let v = input.value.replace(/\D/g,'').slice(0,13);
  if (v.length>12) v = v.slice(0,5)+'-'+v.slice(5,12)+'-'+v.slice(12);
  else if (v.length>5) v = v.slice(0,5)+'-'+v.slice(5);
  input.value = v;
}
function autoFormatCell(input) {
  let v = input.value.replace(/\D/g,'').slice(0,11);
  if (v.length>4) v = v.slice(0,4)+'-'+v.slice(4);
  input.value = v;
}
function autoFormatDate(input) {
  let v = input.value.replace(/\D/g,'').slice(0,8);
  if (v.length>4) v = v.slice(0,2)+'-'+v.slice(2,4)+'-'+v.slice(4);
  else if (v.length>2) v = v.slice(0,2)+'-'+v.slice(2);
  input.value = v;
}

// ── SUPABASE DATA FUNCTIONS ───────────────────────────────────
async function getOfficerId() {
  if (currentOfficer?.id) return currentOfficer.id;
  // Try cached officer (offline / fast path)
  try {
    const cached = JSON.parse(localStorage.getItem('dio_officer_cache')||'null');
    if (cached?.id) {
      if (!currentOfficer) currentOfficer = cached;
      return cached.id;
    }
  } catch(_) {}
  // Resolve user id safely
  let uid = currentUser?.id;
  if (!uid) {
    try { const r = await supabaseClient.auth.getUser(); uid = r.data?.user?.id; } catch(_) {}
  }
  if (!uid) return null;  // Don't query with undefined — prevents 400 errors
  if (!navigator.onLine) return null;  // Can't look up offline without cache
  try {
    const { data } = await supabaseClient.from('officers').select('*').eq('user_id', uid).single();
    if (data?.id) {
      if (!currentOfficer || !currentOfficer.id) currentOfficer = data;
      try { localStorage.setItem('dio_officer_cache', JSON.stringify(data)); } catch(_) {}
      return data.id;
    }
    return null;
  } catch(_) { return null; }
}

async function getCases(status, query) {
  try {
    const oid = await getOfficerId();
    if (!oid) {
      if (typeof offlineStore !== 'undefined') {
        try { return await offlineStore.getAll('cases_cache'); } catch(_) {}
      }
      return [];
    }

    // Helper: filter cached list by status/query
    const filterCached = (all) => {
      if (status) all = all.filter(c => c.status === status);
      if (query) {
        const w = query.toLowerCase();
        all = all.filter(c => (c.fir_number||'').toLowerCase().includes(w) ||
          (c.complainant||'').toLowerCase().includes(w) ||
          (c.section_of_law||'').toLowerCase().includes(w) ||
          (c.complainant_cnic||'').toLowerCase().includes(w) ||
          (c.complainant_cell||'').toLowerCase().includes(w));
      }
      return all.sort((a,b)=> String(a.fir_number||'').localeCompare(String(b.fir_number||''), undefined, {numeric:true}));
    };

    // CACHE-FIRST: try to return cached instantly
    let cached = null;
    if (typeof offlineStore !== 'undefined') {
      try { cached = await offlineStore.getAll('cases_cache', oid); } catch(_) {}
    }

    // If offline — return cache only (instant)
    if (!navigator.onLine) {
      return cached ? filterCached(cached) : [];
    }

    // ONLINE: if we have cache, refresh it in the BACKGROUND (don't block)
    if (cached && cached.length) {
      _refreshCasesInBackground(oid);
      return filterCached(cached);
    }

    // No cache yet — fetch from server now (first ever load)
    let q = supabaseClient.from('cases').select('*').eq('officer_id',oid).order('fir_number',{ascending:true});
    if (status) q = q.eq('status',status);
    if (query) {
      const w = `%${query}%`;
      q = q.or(`fir_number.ilike.${w},complainant.ilike.${w},section_of_law.ilike.${w},complainant_cnic.ilike.${w},complainant_cell.ilike.${w}`);
    }
    const { data } = await q;
    if (typeof markSynced === 'function') markSynced();
    if (typeof offlineStore !== 'undefined' && data && !status && !query) {
      try { await offlineStore.cache('cases_cache', data); } catch(_) {}
    }
    return data||[];
  } catch(e) {
    console.error('getCases error:', e);
    return [];
  }
}

// Background refresh — updates cache silently, refreshes UI if cases page open
let _bgRefreshTimer = null;
async function _refreshCasesInBackground(oid) {
  if (_bgRefreshTimer) return; // throttle
  _bgRefreshTimer = setTimeout(()=>{ _bgRefreshTimer = null; }, 2000);
  try {
    const { data } = await supabaseClient.from('cases').select('*').eq('officer_id',oid).order('fir_number',{ascending:true});
    if (data && typeof offlineStore !== 'undefined') {
      try { await offlineStore.cache('cases_cache', data); } catch(_) {}
      if (typeof markSynced === 'function') markSynced();
      // If cases page currently open AND not in a workspace, silently refresh the list
      if (window._activePage === 'cases' && !window._inWorkspace) {
        const c = document.getElementById('page-content');
        if (c && typeof renderCases === 'function') {
          if (!document.querySelector('.workspace-tabs') && !document.querySelector('.modal-overlay[style*="flex"]')) {
            renderCases(c);
          }
        }
      }
    }
  } catch(_) {}
}

async function getCase(id) {
  // CACHE-FIRST: return cached instantly if available
  if (typeof offlineStore !== 'undefined') {
    try {
      const cached = await offlineStore.getOne('cases_cache', id);
      if (cached) {
        // Refresh in background if online
        if (navigator.onLine) {
          supabaseClient.from('cases').select('*').eq('id',id).single()
            .then(({data}) => { if (data) { try { offlineStore.cache('cases_cache', data); } catch(_){} } })
            .catch(()=>{});
        }
        return cached;
      }
    } catch(_) {}
  }
  // Not cached — fetch now
  if (!navigator.onLine) return null;
  try {
    const { data } = await supabaseClient.from('cases').select('*').eq('id',id).single();
    if (data && typeof offlineStore !== 'undefined') {
      try { await offlineStore.cache('cases_cache', data); } catch(_) {}
    }
    return data;
  } catch(_) { return null; }
}

async function addCase(caseData) {
  const oid = await getOfficerId();
  const rec = {...caseData, officer_id:oid};
  // OFFLINE: save locally + queue for sync
  if (!navigator.onLine && typeof offlineStore !== 'undefined') {
    const tempId = 'local-' + Date.now();
    const localRec = { ...rec, id: tempId, created_at: new Date().toISOString(), _pending: true };
    await offlineStore.cache('cases_cache', localRec);
    await offlineStore.enqueue('cases', 'insert', rec);
    showToast('📴 آف لائن محفوظ — انٹرنیٹ آنے پر sync ہوگا', 'info');
    return localRec;
  }
  const { data, error } = await supabaseClient.from('cases').insert(rec).select().single();
  if (error) throw error;
  if (typeof offlineStore !== 'undefined') { try { await offlineStore.cache('cases_cache', data); } catch(_) {} }
  return data;
}

async function updateCase(id, updates) {
  if (!navigator.onLine && typeof offlineStore !== 'undefined') {
    const existing = await offlineStore.getOne('cases_cache', id) || {};
    const merged = { ...existing, ...updates, id };
    await offlineStore.cache('cases_cache', merged);
    await offlineStore.enqueue('cases', 'update', { id, ...updates });
    showToast('📴 آف لائن محفوظ — sync باقی', 'info');
    return merged;
  }
  const { data, error } = await supabaseClient.from('cases').update(updates).eq('id',id).select().single();
  if (error) throw error;
  if (typeof offlineStore !== 'undefined') { try { await offlineStore.cache('cases_cache', data); } catch(_) {} }
  return data;
}

async function deleteCase(id) {
  if (!navigator.onLine && typeof offlineStore !== 'undefined') {
    await offlineStore.remove('cases_cache', id);
    await offlineStore.enqueue('cases', 'delete', { id });
    return;
  }
  const { error } = await supabaseClient.from('cases').delete().eq('id',id);
  if (error) throw error;
  if (typeof offlineStore !== 'undefined') { try { await offlineStore.remove('cases_cache', id); } catch(_) {} }
}

let _remindersFailedAt = 0;  // timestamp of last network failure (backoff)

async function getReminders() {
  const oid = await getOfficerId();
  if (!oid) return [];
  const lsKey = 'cache_reminders_' + oid;
  const _fromLS = () => { try { return JSON.parse(localStorage.getItem(lsKey)||'[]'); } catch(_) { return []; } };

  // Offline — use cache, never hit network
  if (!navigator.onLine) {
    if (typeof offlineStore !== 'undefined') {
      try { return await offlineStore.getAll('reminders_cache', oid); } catch(_) {}
    }
    return _fromLS();
  }
  // Backoff: if a fetch failed in the last 30s, serve cache instead of retrying (stops error spam)
  if (_remindersFailedAt && (Date.now() - _remindersFailedAt) < 30000) {
    return _fromLS();
  }
  try {
    const { data, error } = await supabaseClient.from('reminders').select('*').eq('officer_id',oid).order('reminder_date',{ascending:true});
    if (error) throw error;
    _remindersFailedAt = 0;
    if (data) {
      try { localStorage.setItem(lsKey, JSON.stringify(data)); } catch(_) {}
      if (typeof offlineStore !== 'undefined') { try { await offlineStore.cache('reminders_cache', data); } catch(_) {} }
    }
    return data||[];
  } catch(_) {
    // Network failed — mark backoff, fall back to cache
    _remindersFailedAt = Date.now();
    if (typeof offlineStore !== 'undefined') {
      try { return await offlineStore.getAll('reminders_cache', oid); } catch(_) {}
    }
    return _fromLS();
  }
}

// Reset backoff when connection returns
window.addEventListener('online', () => { _remindersFailedAt = 0; });

// ── EVIDENCE ──────────────────────────────────────────────────
async function getEvidence(firNumber) {
  try {
    const oid = await getOfficerId();
    let q = supabaseClient.from('evidence').select('*').eq('officer_id',oid).order('fir_number',{ascending:true});
    if (firNumber) q = q.eq('fir_number', firNumber);
    const { data } = await q;
    return data||[];
  } catch(_) { return []; }
}

async function addEvidence(ev) {
  const oid = await getOfficerId();
  const { data, error } = await supabaseClient.from('evidence').insert({...ev, officer_id:oid}).select().single();
  if (error) throw error;
  return data;
}

async function deleteEvidence(id) {
  const { error } = await supabaseClient.from('evidence').delete().eq('id',id);
  if (error) throw error;
}

async function addReminder(rem) {
  const oid = await getOfficerId();
  const { data, error } = await supabaseClient.from('reminders').insert({...rem,officer_id:oid}).select().single();
  if (error) throw error;
  return data;
}

async function updateReminder(id,updates) {
  const { data,error } = await supabaseClient.from('reminders').update(updates).eq('id',id).select().single();
  if (error) throw error;
  return data;
}

async function deleteReminder(id) {
  const { error } = await supabaseClient.from('reminders').delete().eq('id',id);
  if (error) throw error;
}

async function getDashboardStats() {
  const cases = await getCases();
  const rems = await getReminders();
  return {
    total:    cases.length,
    complete: cases.filter(c=>c.status==='complete').length,
    incomplete:cases.filter(c=>c.status==='incomplete').length,
    under:    cases.filter(c=>c.status==='under').length,
    untrace:  cases.filter(c=>c.status==='untrace').length,
    cancel:   cases.filter(c=>c.status==='cancel').length,
    challan512:cases.filter(c=>c.status==='challan512').length,
    pendingReminders:rems.filter(r=>!r.is_done).length,
  };
}

async function updateOfficerProfile(updates) {
  const oid = await getOfficerId();
  const { data, error } = await supabaseClient.from('officers').update(updates).eq('id',oid).select().single();
  if (error) throw error;
  currentOfficer = {...currentOfficer,...updates,...data};
  return currentOfficer;
}

// ── BADGES ────────────────────────────────────────────────────
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

function _editTopbarField(field) {
  const o = currentOfficer||{};
  const isSho = field==='sho';
  const label = isSho?'SHO کا نام':'DSP/SDPO کا نام';
  const current = isSho?(o.sho_name||''):(o.dsp_name||'');
  openModal(label,
    `<input class="form-input" id="topbar-edit-val" value="${current}" placeholder="${label}" dir="auto">`,
    `<div style="display:flex;gap:8px;direction:rtl;">
      <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
      <button class="btn btn-primary" onclick="_saveTopbarField('${field}')">💾 محفوظ</button>
    </div>`
  );
  setTimeout(()=>document.getElementById('topbar-edit-val')?.focus(),100);
}

async function _saveTopbarField(field) {
  const val = document.getElementById('topbar-edit-val')?.value.trim()||'';
  const update = field==='sho'?{sho_name:val}:{dsp_name:val};
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

function checkNotifications() { _checkDueReminders(); }

// ── BUTTON USAGE LOGGER ───────────────────────────────────────
const _usageKey = 'dio_btn_usage';
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

function voiceTypeArea(editorId, btnId) {
  if (!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)) {
    showToast('⚠️ آواز کی سہولت دستیاب نہیں','warn'); return;
  }
  const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
  const rec = new SR();
  rec.lang = 'ur-PK'; rec.continuous = true; rec.interimResults = false;
  const btn = document.getElementById(btnId);
  if (btn) { btn.textContent='🔴 بند کریں'; btn.onclick=()=>rec.stop(); }
  rec.onresult = e => {
    const el = document.getElementById(editorId);
    if (el) { const t = e.results[e.results.length-1][0].transcript; if(el.tagName==='TEXTAREA'){el.value+=t;}else{el.innerHTML+=t;} }
  };
  rec.onend = () => { if(btn){btn.textContent='🎙️';} };
  rec.start();
}

// ── AUTO FORMAT ───────────────────────────────────────────────
// Already defined above

// ── PENAL CODE SEARCH ─────────────────────────────────────────
// NOTE: PENAL_CODES, searchPenalCodes, selectSection, removeSection, addSection
// are defined in cases.js (which has the full detailed version with bail/punishment).
// They were removed from here to avoid "already declared" errors.

// ── THEME PICKER ──────────────────────────────────────────────
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

// ── AUTH ──────────────────────────────────────────────────────
async function doLogin() {
  const email = document.getElementById('login-email')?.value.trim();
  const pass  = document.getElementById('login-password')?.value;
  if (!email||!pass) { showToast('⚠️ ای میل اور پاسورڈ ضروری ہے','error'); return; }

  // Failed login lockout check
  const lockData = JSON.parse(localStorage.getItem('dio_login_lock')||'{}');
  if (lockData.until && Date.now() < lockData.until) {
    const mins = Math.ceil((lockData.until - Date.now())/60000);
    showToast(`🔒 بہت زیادہ غلط کوششیں — ${mins} منٹ بعد دوبارہ کوشش کریں`, 'error', 5000);
    return;
  }

  setLoginLoading(true);
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({email,password:pass});
    if (error) throw error;
    currentUser = data.user;
    // Clear failed attempts on success
    localStorage.removeItem('dio_login_lock');
    // If biometric is enabled for this email, save token for future biometric login
    if (localStorage.getItem('dio_biometric_email') === email) {
      try { localStorage.setItem('dio_biometric_token', btoa(pass)); } catch(_) {}
    }
    await _loadOfficerProfile();

    // Check if officer is approved (skip for admins/superadmins)
    const role = currentOfficer?.role || 'officer';
    const isPrivileged = ['admin','superadmin'].includes(role);
    if (!isPrivileged && currentOfficer && currentOfficer.is_approved === false) {
      await supabaseClient.auth.signOut();
      currentUser = null; currentOfficer = null;
      setLoginLoading(false);
      showToast('⏳ آپ کا اکاؤنٹ ابھی منظوری کے انتظار میں ہے۔ ایڈمن سے رابطہ کریں۔', 'warn', 6000);
      return;
    }
    // Check if suspended
    if (currentOfficer && currentOfficer.suspended === true) {
      await supabaseClient.auth.signOut();
      currentUser = null; currentOfficer = null;
      setLoginLoading(false);
      showToast('🚫 آپ کا اکاؤنٹ معطل کر دیا گیا ہے۔ ایڈمن سے رابطہ کریں۔', 'error', 6000);
      return;
    }

    loginSuccess();
  } catch(e) {
    // Track failed attempts
    const lock = JSON.parse(localStorage.getItem('dio_login_lock')||'{"count":0}');
    lock.count = (lock.count||0) + 1;
    if (lock.count >= 5) {
      lock.until = Date.now() + 5*60*1000; // lock for 5 minutes
      lock.count = 0;
      localStorage.setItem('dio_login_lock', JSON.stringify(lock));
      showToast('🔒 5 غلط کوششیں — اکاؤنٹ 5 منٹ کے لیے بند', 'error', 5000);
    } else {
      localStorage.setItem('dio_login_lock', JSON.stringify(lock));
      showToast(`❌ ${e.message} (${5-lock.count} کوششیں باقی)`, 'error');
    }
    setLoginLoading(false);
  }
}

async function _loadOfficerProfile() {
  try {
    const { data } = await supabaseClient.from('officers').select('*').eq('user_id',currentUser.id).single();
    if (data) {
      currentOfficer = data;
      // Cache for offline use
      try { localStorage.setItem('dio_officer_cache', JSON.stringify(data)); } catch(_) {}
    }
  } catch(_) {
    // Offline or error — restore from cache
    try {
      const cached = localStorage.getItem('dio_officer_cache');
      if (cached) currentOfficer = JSON.parse(cached);
    } catch(_) {}
  }
  if (!currentOfficer) {
    currentOfficer = { user_id:currentUser.id, email:currentUser.email, full_name:currentUser.user_metadata?.full_name||'', station:'', district:'', designation:'', role:'officer' };
  }
  // Restore profile photo from DB so it persists across logins/devices
  if (currentOfficer.profile_photo) {
    try {
      localStorage.setItem('dio_profile_photo', currentOfficer.profile_photo);
      localStorage.setItem('officer_photo_url', currentOfficer.profile_photo);
    } catch(_) {}
  } else {
    // DB has no photo — try localStorage fallback
    try {
      const saved = localStorage.getItem('officer_photo_url') || localStorage.getItem('dio_profile_photo');
      if (saved) currentOfficer.profile_photo = saved;
    } catch(_) {}
  }
}

function setLoginLoading(v) {
  const btn = document.getElementById('login-btn');
  if (btn) { btn.disabled=v; btn.textContent=v?'⏳ لاگ ان ہو رہا ہے...':'🔑 لاگ ان'; }
}

async function loginSuccess() {
  const ls=document.getElementById('login-screen'), app=document.getElementById('main-app');
  ls.style.transition='opacity 0.4s'; ls.style.opacity='0';
  setTimeout(()=>{ ls.style.display='none'; app.style.display='flex'; setLoginLoading(false); initApp(); },400);
  resetSessionTimer();
  // Show onboarding for first-time users
  setTimeout(()=>{ if(typeof _maybeShowOnboarding==='function') _maybeShowOnboarding(); }, 1200);
}

// ── ONBOARDING WALKTHROUGH (S6) ───────────────────────────────
function _maybeShowOnboarding() {
  // Only show once per device
  if (localStorage.getItem('dio_onboarded') === 'yes') return;
  _showOnboarding();
}

const _ONBOARD_STEPS = [
  { icon:'🛡️', title:'خوش آمدید — Digital IO', text:'پنجاب پولیس کے لیے ایک محفوظ، تیز اور آسان کیس مینجمنٹ سسٹم۔ آئیے چند اہم خصوصیات دیکھیں۔' },
  { icon:'📁', title:'میرے مقدمات', text:'تمام مقدمات یہاں درج کریں۔ ہر مقدمے کا FIR، مدعی، دفعات، صورتحال — سب ایک جگہ۔ نیا مقدمہ کے لیے Ctrl+N دبائیں۔' },
  { icon:'📋', title:'MISAL بلڈر', text:'مقدمہ کھولیں تو 26 سرکاری دستاویزات (زمنی، 161 بیانات، چالان وغیرہ) خودکار تیار ہوتی ہیں۔ SHO/DSP کے نام بھی یہیں شامل کریں۔' },
  { icon:'🤖', title:'سمارٹ مدد', text:'CDR تجزیہ، 161 سوالات کی تجاویز، عدالت کے لیے تیاری کا چیکر (🟢🔴) — سب آپ کی تفتیش میں مدد کے لیے۔' },
  { icon:'🔗', title:'Ripple Effect', text:'ٹیمپلیٹ میں {مدعی}، {FIR} لکھیں — مقدمے کا ڈیٹا خودبخود بھر جائے گا۔ بار بار لکھنے کی ضرورت نہیں!' },
  { icon:'✅', title:'تیار ہیں!', text:'بس اتنا ہی۔ کسی بھی وقت ⚙️ ترتیبات سے مدد حاصل کریں۔ اللہ آپ کے کام میں آسانی فرمائے۔' },
];
let _onboardIdx = 0;

function _showOnboarding() {
  _onboardIdx = 0;
  _renderOnboardStep();
}

function _renderOnboardStep() {
  const s = _ONBOARD_STEPS[_onboardIdx];
  const isLast = _onboardIdx === _ONBOARD_STEPS.length - 1;
  const isFirst = _onboardIdx === 0;

  openModal('', `
    <div style="text-align:center;direction:rtl;padding:10px;">
      <div style="font-size:56px;margin-bottom:14px;">${s.icon}</div>
      <div style="font-size:18px;font-weight:800;font-family:'Jameel Noori Nastaleeq',serif;margin-bottom:10px;color:var(--accent);">${s.title}</div>
      <div style="font-size:14px;line-height:1.9;color:var(--text-secondary);font-family:'Jameel Noori Nastaleeq',serif;">${s.text}</div>
      <div style="display:flex;gap:5px;justify-content:center;margin-top:18px;">
        ${_ONBOARD_STEPS.map((_,i)=>`<span style="width:8px;height:8px;border-radius:50%;background:${i===_onboardIdx?'var(--accent)':'var(--border)'};"></span>`).join('')}
      </div>
    </div>
  `, `
    <div style="display:flex;gap:8px;width:100%;direction:rtl;">
      <button class="btn btn-secondary" onclick="_skipOnboarding()" style="flex:1;">${isLast?'بند کریں':'چھوڑیں'}</button>
      ${!isFirst?`<button class="btn btn-secondary" onclick="_onboardPrev()">← پیچھے</button>`:''}
      ${!isLast?`<button class="btn btn-primary" onclick="_onboardNext()" style="flex:1;">آگے →</button>`:`<button class="btn btn-primary" onclick="_skipOnboarding()" style="flex:1;">✅ شروع کریں</button>`}
    </div>
  `);
}

function _onboardNext() { if (_onboardIdx < _ONBOARD_STEPS.length-1) { _onboardIdx++; _renderOnboardStep(); } }
function _onboardPrev() { if (_onboardIdx > 0) { _onboardIdx--; _renderOnboardStep(); } }
function _skipOnboarding() {
  try { localStorage.setItem('dio_onboarded', 'yes'); } catch(_) {}
  closeModal();
}
// Allow re-showing from settings
function showOnboardingAgain() { _showOnboarding(); }

async function doLogout() {
  // Sign out from server, but don't fail if offline
  try { await supabaseClient.auth.signOut(); } catch(_) {}
  currentUser=null; currentOfficer=null;
  // Clear cached session so login screen shows
  try { localStorage.removeItem('dio_officer_cache'); } catch(_) {}
  const app = document.getElementById('main-app');
  const login = document.getElementById('login-screen');
  if (app) app.style.display='none';
  if (login) { login.style.display='flex'; login.style.opacity='1'; }
  showToast('✅ لاگ آؤٹ ہو گئے','info');
}

function showRegister()       { const m=document.getElementById('register-modal'); if(m){ m.style.setProperty('display','flex','important'); m.style.zIndex='99999'; } else { showToast('رجسٹریشن فارم لوڈ نہیں ہوا — صفحہ ریفریش کریں','error'); } }
function hideRegister()       { const m=document.getElementById('register-modal'); if(m) m.style.display='none'; }
function showForgotPassword() { document.getElementById('forgot-card')?.style&&(document.getElementById('forgot-card').style.display='block'); document.getElementById('login-card')?.style&&(document.getElementById('login-card').style.display='none'); }
function hideForgotModal()    { document.getElementById('forgot-card')?.style&&(document.getElementById('forgot-card').style.display='none'); document.getElementById('login-card')?.style&&(document.getElementById('login-card').style.display='block'); }
// ── PIN LOGIN ─────────────────────────────────────────────────
let _pinValue = '';

function _renderPinDots() {
  for (let i = 0; i < 6; i++) {
    const dot = document.getElementById('pd' + i);
    if (dot) dot.classList.toggle('filled', i < _pinValue.length);
  }
}

function pinPress(v) {
  if (_pinValue.length >= 6) return;
  _pinValue += v;
  _renderPinDots();
  if (_pinValue.length === 6) {
    setTimeout(_verifyPin, 200);
  }
}

function pinBackspace() {
  _pinValue = _pinValue.slice(0, -1);
  _renderPinDots();
}

async function _verifyPin() {
  const savedPin = localStorage.getItem('dio_pin');
  const savedEmail = localStorage.getItem('dio_pin_email');
  const savedToken = localStorage.getItem('dio_pin_token');

  if (!savedPin) {
    showToast('⚠️ پہلے پاسورڈ سے لاگ ان کر کے PIN سیٹ کریں (ترتیبات میں)', 'warn', 5000);
    _pinValue = ''; _renderPinDots();
    setLoginMethod('password', document.querySelectorAll('.login-method')[0]);
    return;
  }

  if (_pinValue === savedPin && savedEmail && savedToken) {
    try {
      document.getElementById('login-email').value = savedEmail;
      document.getElementById('login-password').value = atob(savedToken);
      _pinValue = ''; _renderPinDots();
      await doLogin();
    } catch(e) {
      showToast('❌ PIN لاگ ان ناکام — پاسورڈ استعمال کریں', 'error');
      setLoginMethod('password', document.querySelectorAll('.login-method')[0]);
    }
  } else {
    showToast('❌ غلط PIN', 'error');
    _pinValue = ''; _renderPinDots();
  }
}

function setLoginMethod(m, btn) {
  // Switch active button
  document.querySelectorAll('.login-method').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  // Show the right panel, hide others
  const panels = { password:'panel-password', pin:'panel-pin', biometric:'panel-biometric' };
  Object.entries(panels).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (el) el.style.display = (key === m) ? 'block' : 'none';
  });
  // Reset PIN dots when switching to PIN
  if (m === 'pin') { _pinValue = ''; _renderPinDots(); }
}
function togglePasswordVisibility(id) { const el=document.getElementById(id); if(el) el.type=el.type==='password'?'text':'password'; }
function setLoginMethodOld(m)    { /* deprecated */ }
// ── SETUP PIN (from settings, while logged in) ────────────────
function _setupPin() {
  openModal('🔢 PIN سیٹ کریں', `
    <div style="direction:rtl;">
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">6 ہندسوں کا PIN منتخب کریں۔ اس سے آپ تیزی سے لاگ ان کر سکیں گے۔</p>
      <input class="form-input" type="password" id="setup-pin" inputmode="numeric" maxlength="6" placeholder="6 ہندسے" dir="ltr" style="text-align:center;font-size:24px;letter-spacing:8px;margin-bottom:10px;">
      <input class="form-input" type="password" id="setup-pin2" inputmode="numeric" maxlength="6" placeholder="دوبارہ PIN" dir="ltr" style="text-align:center;font-size:24px;letter-spacing:8px;">
      <p style="font-size:11px;color:var(--text-muted);margin-top:10px;">⚠️ موجودہ پاسورڈ بھی درکار ہوگا تاکہ PIN لاگ ان کام کرے</p>
      <input class="form-input" type="password" id="setup-pin-pass" placeholder="موجودہ پاسورڈ" style="margin-top:8px;">
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
    <button class="btn btn-primary" onclick="_savePin()">💾 محفوظ کریں</button>
  `);
}

function _savePin() {
  const pin = document.getElementById('setup-pin')?.value.trim();
  const pin2 = document.getElementById('setup-pin2')?.value.trim();
  const pass = document.getElementById('setup-pin-pass')?.value;

  if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    showToast('⚠️ PIN 6 ہندسوں کا ہونا چاہیے', 'error'); return;
  }
  if (pin !== pin2) {
    showToast('⚠️ دونوں PIN مختلف ہیں', 'error'); return;
  }
  if (!pass) {
    showToast('⚠️ موجودہ پاسورڈ درکار ہے', 'error'); return;
  }

  const email = currentOfficer?.email || currentUser?.email;
  if (!email) {
    showToast('❌ ای میل نہیں ملی', 'error'); return;
  }

  try {
    localStorage.setItem('dio_pin', pin);
    localStorage.setItem('dio_pin_email', email);
    localStorage.setItem('dio_pin_token', btoa(pass));
    closeModal();
    showToast('✅ PIN سیٹ ہو گیا — اب لاگ ان اسکرین پر PIN استعمال کریں', 'success', 5000);
  } catch(e) {
    showToast('❌ ' + e.message, 'error');
  }
}

// ── SETUP PIN END ─────────────────────────────────────────────
async function doBiometric() {
  const ring = document.getElementById('bio-ring');
  if (!window.PublicKeyCredential) {
    showToast('⚠️ یہ ڈیوائس بایومیٹرک سپورٹ نہیں کرتی', 'warn');
    return;
  }

  // Check if a biometric credential was registered before
  const savedCred = localStorage.getItem('dio_biometric_cred');
  const savedEmail = localStorage.getItem('dio_biometric_email');

  if (!savedCred || !savedEmail) {
    // First time — need to register. Prompt to enable after normal login.
    showToast('پہلے ای میل/پاسورڈ سے لاگ ان کریں، پھر بایومیٹرک فعال کریں', 'info', 4000);
    return;
  }

  if (ring) ring.classList.add('scanning');
  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'required',
        allowCredentials: [{
          type: 'public-key',
          id: _b64ToBuf(savedCred),
        }],
      }
    });

    // Biometric verified — log in with saved session
    const savedPass = localStorage.getItem('dio_biometric_token');
    if (savedPass) {
      document.getElementById('login-email').value = savedEmail;
      document.getElementById('login-password').value = atob(savedPass);
      await doLogin();
    } else {
      showToast('✅ بایومیٹرک کامیاب — ای میل/پاسورڈ سے لاگ ان کریں', 'success');
      document.getElementById('login-email').value = savedEmail;
    }
  } catch(e) {
    showToast('❌ بایومیٹرک ناکام — دوبارہ کوشش کریں', 'error');
  } finally {
    if (ring) ring.classList.remove('scanning');
  }
}

// Enable biometric (called after successful login from settings)
async function enableBiometric() {
  if (!window.PublicKeyCredential) {
    showToast('⚠️ یہ ڈیوائس بایومیٹرک سپورٹ نہیں کرتی', 'warn');
    return;
  }
  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const userId = new Uint8Array(16);
    crypto.getRandomValues(userId);

    const cred = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Digital IO', id: window.location.hostname },
        user: {
          id: userId,
          name: currentUser?.email || 'officer',
          displayName: currentOfficer?.full_name || 'Officer',
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      }
    });

    localStorage.setItem('dio_biometric_cred', _bufToB64(cred.rawId));
    localStorage.setItem('dio_biometric_email', currentUser?.email || '');
    showToast('✅ بایومیٹرک فعال ہو گیا — اب فنگرپرنٹ سے لاگ ان کریں', 'success');
  } catch(e) {
    showToast('❌ بایومیٹرک فعال نہیں ہوا: ' + (e.message||''), 'error');
  }
}

function _bufToB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function _b64ToBuf(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

async function sendOTP() { showToast('OTP بھیجنے کی سہولت جلد آ رہی ہے','info'); }
async function verifyOTP() { showToast('OTP کی تصدیق جلد آ رہی ہے','info'); }
async function resetPassword() {
  const email = document.getElementById('forgot-email')?.value.trim();
  if (!email) { showToast('⚠️ ای میل ضروری ہے','error'); return; }
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
  if (error) { showToast('❌ '+error.message,'error'); return; }
  showToast('✅ پاسورڈ ری سیٹ ای میل بھیج دی','success');
  hideForgotModal();
}

async function submitRegistration() {
  const name  = document.getElementById('reg-name')?.value.trim();
  const email = document.getElementById('reg-email')?.value.trim();
  const pass  = document.getElementById('reg-password')?.value;
  const badge = document.getElementById('reg-badge')?.value.trim();
  const station=document.getElementById('reg-station')?.value.trim();
  const district=document.getElementById('reg-district')?.value.trim();
  const desig = document.getElementById('reg-designation')?.value.trim();
  if(!name||!email||!pass){showToast('⚠️ تمام ضروری خانے بھریں','error');return;}
  if(pass.length<8){showToast('⚠️ پاسورڈ کم از کم 8 حروف کا ہو','error');return;}
  try {
    const{data,error}=await supabaseClient.auth.signUp({email,password:pass,options:{data:{full_name:name}}});
    if(error)throw error;
    if(data.user){
      // Build officer record (omit email if column doesn't exist)
      const rec={user_id:data.user.id,full_name:name,badge_number:badge,designation:desig,station,district,role:'officer',is_approved:false};
      let{error:insErr}=await supabaseClient.from('officers').insert({...rec,email});
      // If email column doesn't exist, retry without it
      if(insErr && insErr.message && insErr.message.toLowerCase().includes('email')){
        const r2=await supabaseClient.from('officers').insert(rec);
        insErr=r2.error;
      }
      if(insErr)throw insErr;
    }
    showToast('✅ رجسٹریشن ہو گئی! ایڈمن کی منظوری کا انتظار کریں','success',6000);
    hideRegister();
  } catch(e){showToast('❌ '+e.message,'error',6000);}
}

function openChangePasswordModal() {
  openModal('🔑 پاسورڈ تبدیل کریں',
    `<div style="direction:rtl;">
      <label class="form-label">موجودہ پاسورڈ</label>
      <input class="form-input" type="password" id="cp-old" placeholder="موجودہ پاسورڈ" style="margin-bottom:8px;">
      <label class="form-label">نیا پاسورڈ</label>
      <input class="form-input" type="password" id="cp-new" placeholder="نیا پاسورڈ (کم از کم 8)" style="margin-bottom:8px;">
    </div>`,
    `<div style="display:flex;gap:8px;direction:rtl;">
      <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
      <button class="btn btn-primary" onclick="_doChangePassword()">💾 تبدیل</button>
    </div>`
  );
}

async function _doChangePassword() {
  const np = document.getElementById('cp-new')?.value;
  if(!np||np.length<8){showToast('⚠️ کم از کم 8 حروف','error');return;}
  const{error}=await supabaseClient.auth.updateUser({password:np});
  if(error){showToast('❌ '+error.message,'error');return;}
  closeModal(); showToast('✅ پاسورڈ تبدیل ہو گیا','success');
}

// ── SESSION TIMER ─────────────────────────────────────────────
let _sessionTimer, _sessionWarnTimer;
const SESSION_TIMEOUT = 10 * 60 * 1000;       // 10 minutes inactivity
const SESSION_WARN_AT = 9 * 60 * 1000;        // warn at 9 min
function resetSessionTimer() {
  clearTimeout(_sessionTimer);
  clearTimeout(_sessionWarnTimer);
  // Warn 1 minute before logout
  _sessionWarnTimer = setTimeout(()=>{
    showToast('⏰ غیر فعالی کے باعث 1 منٹ میں خودکار لاگ آؤٹ ہوگا — کوئی کلک کریں', 'warn', 8000);
  }, SESSION_WARN_AT);
  _sessionTimer = setTimeout(()=>{
    showToast('🔒 سیشن ختم — حفاظتی وجہ سے لاگ آؤٹ', 'warn', 4000);
    setTimeout(doLogout, 2000);
  }, SESSION_TIMEOUT);
}
document.addEventListener('click', resetSessionTimer);
document.addEventListener('keypress', resetSessionTimer);
document.addEventListener('touchstart', resetSessionTimer);

// ── KEYBOARD SHORTCUTS ────────────────────────────────────────
document.addEventListener('keydown', function(e) {
  // Only when logged in and not typing in an input
  const app = document.getElementById('main-app');
  if (!app || app.style.display === 'none') return;
  const tag = (e.target.tagName || '').toLowerCase();
  const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;

  // Ctrl/Cmd + N = New case
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
    e.preventDefault();
    if (typeof openAddCaseModal === 'function') openAddCaseModal();
    return;
  }
  // Ctrl/Cmd + K = Search
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    showPage('search', null);
    return;
  }
  // Ctrl/Cmd + D = Dashboard
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
    e.preventDefault();
    showPage('dashboard', document.querySelector('.nav-item'));
    return;
  }
  // Escape closes any open modal (if not typing)
  if (e.key === 'Escape' && !typing && typeof closeModal === 'function') {
    closeModal();
  }
});

// ── BACKUP COMPAT ─────────────────────────────────────────────
function initBackupSystem() {
  const t = localStorage.getItem('dio_gdrive_token');
  if(t) googleDriveToken=t;
}
function triggerBackup(src) { localStorage.setItem('dio_last_backup_source',src||'auto'); }

// ── INIT APP ──────────────────────────────────────────────────
async function initApp() {
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

// ── CHECK SUPABASE SESSION ON LOAD ────────────────────────────
window.addEventListener('load', async function() {
  try {
    const { data:{ session } } = await supabaseClient.auth.getSession();
    if (session?.user) {
      currentUser = session.user;
      await _loadOfficerProfile();
      loginSuccess();
    }
  } catch(_) {}
});

supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event==='SIGNED_OUT') { currentUser=null; currentOfficer=null; }
});

// ═══════════════════════════════════════════════════════════
//  GLOBAL PRINT HELPER — iframe-based, no double-close, no full-screen stuck
// ═══════════════════════════════════════════════════════════
function dioPrint(htmlContent) {
  // Remove any previous print iframe
  const old = document.getElementById('dio-print-frame');
  if (old) old.remove();

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
