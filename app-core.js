/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — APP CORE  (app-core.js)
   Auth · Data · UI · Voice · Penal Codes · Notifications
   Punjab Police Case Management System
   ═══════════════════════════════════════════════════════════ */

// ── SUPABASE ──────────────────────────────────────────────────
const SUPABASE_URL = 'https://bbrhtokynxmljumxyaeh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJicmh0b2t5bnhtbGp1bXh5YWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MzU5ODIsImV4cCI6MjA5NTUxMTk4Mn0.o4uKyqhIx9vWDX-CeJjwujWUYK6Cy0XzEZ5fw_efQMA';
if (!window.supabase || !window.supabase.createClient) {
  document.addEventListener('DOMContentLoaded', function(){
    alert('⚠️ انٹرنیٹ کنکشن چیک کریں — Supabase لائبریری لوڈ نہیں ہوئی۔ صفحہ ریفریش کریں۔');
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
function registerPage(name, fn) { _pages[name] = fn; }

function showPage(page, el) {
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
    court:'عدالتی پیشیاں', evidence:'شہادتیں',
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
    _pages[page](container);
  } else {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);">
      <div style="font-size:48px;">🚧</div>
      <div style="font-size:16px;margin-top:12px;">${page} — جلد آ رہا ہے</div>
    </div>`;
  }
}

// ── MODAL ─────────────────────────────────────────────────────
function openModal(title, body, footer) {
  document.getElementById('modal-title').textContent  = title||'';
  document.getElementById('modal-body').innerHTML     = body||'';
  document.getElementById('modal-footer').innerHTML   = footer||'';
  document.getElementById('modal-backdrop').style.display = 'flex';
  document.getElementById('modal-backdrop').style.alignItems = 'center';
  document.getElementById('modal-backdrop').style.justifyContent = 'center';
}
function closeModal() {
  document.getElementById('modal-backdrop').style.display = 'none';
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
  const uid = currentUser?.id || supabaseClient.auth.getUser().then(r=>r.data?.user?.id);
  const { data } = await supabaseClient.from('officers').select('id').eq('user_id', typeof uid==='string'?uid:(await uid)).single();
  return data?.id||null;
}

async function getCases(status, query) {
  const oid = await getOfficerId();
  let q = supabaseClient.from('cases').select('*').eq('officer_id',oid).order('created_at',{ascending:false});
  if (status) q = q.eq('status',status);
  if (query) {
    const w = `%${query}%`;
    q = q.or(`fir_number.ilike.${w},complainant.ilike.${w},section_of_law.ilike.${w},complainant_cnic.ilike.${w},complainant_cell.ilike.${w}`);
  }
  const { data } = await q;
  return data||[];
}

async function getCase(id) {
  const { data } = await supabaseClient.from('cases').select('*').eq('id',id).single();
  return data;
}

async function addCase(caseData) {
  const oid = await getOfficerId();
  const { data, error } = await supabaseClient.from('cases').insert({...caseData, officer_id:oid}).select().single();
  if (error) throw error;
  return data;
}

async function updateCase(id, updates) {
  const { data, error } = await supabaseClient.from('cases').update(updates).eq('id',id).select().single();
  if (error) throw error;
  return data;
}

async function deleteCase(id) {
  const { error } = await supabaseClient.from('cases').delete().eq('id',id);
  if (error) throw error;
}

async function getReminders() {
  const oid = await getOfficerId();
  const { data } = await supabaseClient.from('reminders').select('*').eq('officer_id',oid).order('reminder_date',{ascending:true});
  return data||[];
}

// ── EVIDENCE ──────────────────────────────────────────────────
async function getEvidence(firNumber) {
  try {
    const oid = await getOfficerId();
    let q = supabaseClient.from('evidence').select('*').eq('officer_id',oid).order('created_at',{ascending:false});
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
  if (avEl) {
    const initials = (o.full_name||'IO').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase();
    avEl.textContent = initials;
  }
  // Show admin nav if applicable
  const adminNav = document.getElementById('admin-nav-item');
  if (adminNav) adminNav.style.display = ['admin','superadmin'].includes(o.role) ? 'flex' : 'none';
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
  if (text) text.textContent = online ? 'Online' : 'Offline';
  if (badge) badge.textContent = online ? '🔗 Connected' : '⚡ Offline';
}

window.addEventListener('online',  ()=>updateConnectionStatus(true));
window.addEventListener('offline', ()=>updateConnectionStatus(false));

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

// Load saved theme
(function(){ const t=localStorage.getItem('dio_theme'); if(t&&t!=='dark') setTheme(t); })();

// ── AUTH ──────────────────────────────────────────────────────
async function doLogin() {
  const email = document.getElementById('login-email')?.value.trim();
  const pass  = document.getElementById('login-password')?.value;
  if (!email||!pass) { showToast('⚠️ ای میل اور پاسورڈ ضروری ہے','error'); return; }
  setLoginLoading(true);
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({email,password:pass});
    if (error) throw error;
    currentUser = data.user;
    await _loadOfficerProfile();
    loginSuccess();
  } catch(e) { showToast('❌ '+e.message,'error'); setLoginLoading(false); }
}

async function _loadOfficerProfile() {
  const { data } = await supabaseClient.from('officers').select('*').eq('user_id',currentUser.id).single();
  currentOfficer = data||{ user_id:currentUser.id, email:currentUser.email, full_name:currentUser.user_metadata?.full_name||'', station:'', district:'', designation:'', role:'officer' };
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
}

async function doLogout() {
  await supabaseClient.auth.signOut();
  currentUser=null; currentOfficer=null;
  document.getElementById('main-app').style.display='none';
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('login-screen').style.opacity='1';
  showToast('✅ لاگ آؤٹ ہو گئے','info');
}

function showRegister()       { document.getElementById('register-card')?.style&&(document.getElementById('register-card').style.display='block'); document.getElementById('login-card')?.style&&(document.getElementById('login-card').style.display='none'); }
function hideRegister()       { document.getElementById('register-card')?.style&&(document.getElementById('register-card').style.display='none'); document.getElementById('login-card')?.style&&(document.getElementById('login-card').style.display='block'); }
function showForgotPassword() { document.getElementById('forgot-card')?.style&&(document.getElementById('forgot-card').style.display='block'); document.getElementById('login-card')?.style&&(document.getElementById('login-card').style.display='none'); }
function hideForgotModal()    { document.getElementById('forgot-card')?.style&&(document.getElementById('forgot-card').style.display='none'); document.getElementById('login-card')?.style&&(document.getElementById('login-card').style.display='block'); }
function setLoginMethod(m)    { /* handled inline */ }
function togglePasswordVisibility(id) { const el=document.getElementById(id); if(el) el.type=el.type==='password'?'text':'password'; }
function pinPress(v)     { const el=document.getElementById('pin-display'); if(el&&el.textContent.length<6) el.textContent+='●'; }
function pinBackspace()  { const el=document.getElementById('pin-display'); if(el) el.textContent=el.textContent.slice(0,-1); }
function doBiometric()   { showToast('بایومیٹرک ابھی دستیاب نہیں','warn'); }

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
  try {
    const{data,error}=await supabaseClient.auth.signUp({email,password:pass,options:{data:{full_name:name}}});
    if(error)throw error;
    if(data.user){
      await supabaseClient.from('officers').insert({user_id:data.user.id,full_name:name,email,badge_number:badge,designation:desig,station,district,role:'officer',is_approved:false});
    }
    showToast('✅ رجسٹریشن ہو گئی! ای میل تصدیق کریں','success');
    hideRegister();
  } catch(e){showToast('❌ '+e.message,'error');}
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
let _sessionTimer;
function resetSessionTimer() {
  clearTimeout(_sessionTimer);
  _sessionTimer = setTimeout(()=>{
    showToast('⏰ سیشن ختم — دوبارہ لاگ ان کریں','warn',5000);
    setTimeout(doLogout, 5000);
  }, 8*60*60*1000); // 8 hours
}
document.addEventListener('click', resetSessionTimer);
document.addEventListener('keypress', resetSessionTimer);

// ── BACKUP COMPAT ─────────────────────────────────────────────
function initBackupSystem() {
  const t = localStorage.getItem('dio_gdrive_token');
  if(t) googleDriveToken=t;
}
function triggerBackup(src) { localStorage.setItem('dio_last_backup_source',src||'auto'); }

// ── INIT APP ──────────────────────────────────────────────────
async function initApp() {
  updateSidebarProfile();
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
