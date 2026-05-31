/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — APP CORE
   Shared by every tab. Loaded first by index.html.
   Contains: config, Supabase loader, auth, DB helpers,
             UI helpers (toast/modal/format), page router,
             session timer, backup queue, app bootstrap.
   ═══════════════════════════════════════════════════════════ */

// ── GLOBAL ERROR HANDLER ──
//  GLOBAL ERROR HANDLER — surfaces JS errors to the user
//  instead of leaving buttons silently dead
// ═══════════════════════════════════════════════════
window.addEventListener('error', function(e) {
  console.error('[Digital IO Error]', e.message, 'at', (e.filename || '') + ':' + (e.lineno || ''));
  try {
    var el = document.getElementById('login-error');
    if (el && (!el.textContent || el.textContent.trim() === '')) {
      el.textContent = '⚠️ Script error — open browser console (F12) for details.';
      el.style.display = 'block';
    }
  } catch (_) {}
});
window.addEventListener('unhandledrejection', function(e) {
  console.error('[Digital IO Promise Error]', e.reason);
});

// ── CONFIG + SUPABASE LOADER ──
//  DIGITAL IO — CONFIGURATION
// ═══════════════════════════════════════════════════

const SUPABASE_URL = 'https://bbrhtokynxmljumxyaeh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJicmh0b2t5bnhtbGp1bXh5YWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MzU5ODIsImV4cCI6MjA5NTUxMTk4Mn0.o4uKyqhIx9vWDX-CeJjwujWUYK6Cy0XzEZ5fw_efQMA';

const APP_CONFIG = {
  name: 'Digital IO',
  version: '4.0.0',
  edition: 'Police Case Management System',
  sessionTimeout: 3600000,
  backupInterval: 5000,
  maxLoginAttempts: 5,
  lockoutDuration: 1800000,
  toastDuration: 3000,
};

const STATUS_LABELS = {
  under:       'زیر تفتیش',
  complete:    'مکمل چالان',
  incomplete:  'نامکمل چالان',
  untrace:     'عدم پتہ',
  cancel:      'اخراج',
  challan512:  'چالان 512ض ف',
};

const STATUS_CLASSES = {
  under:       'pill-blue',
  complete:    'pill-green',
  incomplete:  'pill-amber',
  untrace:     'pill-purple',
  cancel:      'pill-red',
  challan512:  'pill-teal',
};

const POLICE_NEWS = [
  '⚖️ Supreme Court: Right to bail is a constitutional right under Article 10 — SC Judgment 2024',
  '🏛️ Lahore High Court: Expedited challan submission within 14 days of arrest — LHC Standing Order',
  '📋 AMENDMENT: Section 302 PPC — Court can award Diyat in addition to Qisas — SC Ruling',
  '🚨 Punjab Police: e-FIR system introduced for Category-B offences — effective citywide',
  '⚖️ SC: Confessions under duress are inadmissible — Full Bench Ruling confirmed',
  '🔵 HIGH COURT: Forensic evidence must accompany challan for CNSA cases — LHC Order',
  '📜 AMENDMENT: Anti-Rape Act 2021 — DNA evidence mandatory within 72 hours of incident',
  '🏛️ SC: Accused right to free legal aid reaffirmed under Article 10-A Constitution of Pakistan',
  '⚠️ ADVISORY: Section 160 CrPC notices must be served via proper channel — SHO responsible',
  '📋 AMENDMENT: Arms Ordinance 1965 — Possession of prohibited bore now non-bailable',
  '🔵 LHC ORDER: Medical examination in hurt cases must be conducted within 6 hours — mandatory',
  '⚖️ SC JUDGMENT: Absconder declaration under Section 87 CrPC requires prior Sections 86/87',
  '🚨 NEW LAW: PECA amendments — digital evidence now fully admissible in Pakistani courts',
  '📜 Punjab Police: Bodycam footage to be uploaded to secure server within 24 hours',
  '🏛️ HIGH COURT: Challan incomplete without postmortem in homicide cases — strict compliance ordered',
];

// ═══════════════════════════════════════════════════
//  ROBUST SUPABASE LOADER
//  Old code crashed everything if the CDN was slow or
//  blocked. This version loads jsDelivr first; if that
//  fails it falls back to unpkg; if both fail the user
//  sees a clear error instead of dead buttons.
// ═══════════════════════════════════════════════════
let supabaseClient = null;
let supabaseReady = false;
const supabaseReadyCallbacks = [];

function onSupabaseReady(cb) {
  if (supabaseReady) cb();
  else supabaseReadyCallbacks.push(cb);
}

function initSupabaseClient() {
  if (typeof supabase === 'undefined' || !supabase.createClient) {
    console.error('Supabase global not found');
    return false;
  }
  const { createClient } = supabase;
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: { params: { eventsPerSecond: 10 } },
  });
  supabaseReady = true;
  console.log('✅ Supabase client ready');
  supabaseReadyCallbacks.forEach(function(cb){ try { cb(); } catch(e) { console.error(e); } });
  return true;
}

function loadSupabaseLibrary() {
  // Attempt #1: jsDelivr
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  s.onload = function() {
    if (!initSupabaseClient()) loadSupabaseFallback();
  };
  s.onerror = loadSupabaseFallback;
  document.head.appendChild(s);
}

function loadSupabaseFallback() {
  // Attempt #2: unpkg
  console.warn('jsDelivr failed, trying unpkg...');
  var f = document.createElement('script');
  f.src = 'https://unpkg.com/@supabase/supabase-js@2';
  f.onload = function() {
    if (!initSupabaseClient()) showCdnError();
  };
  f.onerror = showCdnError;
  document.head.appendChild(f);
}

function showCdnError() {
  console.error('All Supabase CDNs failed to load');
  var msg = '⚠️ Could not load security library. Please check your internet connection and refresh the page. If this keeps happening, your ISP may be blocking the CDN — try a different network.';
  var el = document.getElementById('login-error');
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
  } else {
    // Login screen not in DOM yet, show as fullscreen message
    document.addEventListener('DOMContentLoaded', function() {
      var e2 = document.getElementById('login-error');
      if (e2) { e2.textContent = msg; e2.style.display = 'block'; }
      else alert(msg);
    });
  }
}

// Start loading immediately
loadSupabaseLibrary();

console.log('✅ Digital IO Config Loaded');

// ── STATE ──
let currentUser=null,currentOfficer=null,currentRole='officer',sessionTimer=null,pinBuffer='',loginAttempts=parseInt(localStorage.getItem('dio_login_attempts')||'0');

// ── AUTH ──
function setLoginMethod(method,el){document.querySelectorAll('.login-method').forEach(b=>b.classList.remove('active'));if(el)el.classList.add('active');document.getElementById('panel-password').style.display=method==='password'?'block':'none';document.getElementById('panel-pin').style.display=method==='pin'?'block':'none';document.getElementById('panel-biometric').style.display=method==='biometric'?'block':'none';pinBuffer='';updatePinDots();}
async function doLogin(){const lock=localStorage.getItem('dio_lockout_until');if(lock&&Date.now()<parseInt(lock)){showLoginError('⚠️ Account locked. Try again later.');return;}const email=document.getElementById('login-email').value.trim(),pass=document.getElementById('login-password').value;if(!email||!pass){showLoginError('⚠️ Please enter email and password.');return;}setLoginLoading(true);hideLoginError();try{const{data,error}=await supabaseClient.auth.signInWithPassword({email,password:pass});if(error){loginAttempts++;localStorage.setItem('dio_login_attempts',loginAttempts);if(loginAttempts>=APP_CONFIG.maxLoginAttempts){localStorage.setItem('dio_lockout_until',Date.now()+APP_CONFIG.lockoutDuration);loginAttempts=0;localStorage.setItem('dio_login_attempts',0);showLoginError('🔒 Too many failed attempts. Account locked for 30 minutes.');}else{showLoginError(`❌ Incorrect credentials. ${APP_CONFIG.maxLoginAttempts-loginAttempts} attempt(s) remaining.`);}setLoginLoading(false);return;}loginAttempts=0;localStorage.setItem('dio_login_attempts',0);localStorage.removeItem('dio_lockout_until');currentUser=data.user;await loadOfficerProfile();
    // Save credentials hash for offline login next time
    // Fire-and-forget — never let offline auth saving break the login flow
    _saveOfflineAuth(email,pass).catch(()=>{});
    await loginSuccess();
  }catch(err){
    if(!navigator.onLine){
      // Offline — try local credentials
      const profile=await _attemptOfflineLogin(email,pass);
      if(profile){
        currentOfficer=profile;
        currentUser={id:profile.user_id||profile.id,email};
        setLoginLoading(false);
        await loginSuccess();
        _showSyncBar('offline','📴 Offline mode — working from local data');
        return;
      }
      showLoginError('❌ Offline login failed. Connect to internet or check credentials.');
    }else{
      showLoginError('⚠️ Connection error. Check your internet and try again.');
    }
    setLoginLoading(false);
  }
}
async function loadOfficerProfile(){
  try{
    if(!navigator.onLine)throw new Error('offline');
    const{data:o}=await supabaseClient.from('officers').select('*').eq('user_id',currentUser.id).single();
    if(o){
      currentOfficer=o;
      // Cache profile and role for offline use
      offlineStore.saveOfflineProfile(currentUser.id,o).catch(()=>{});
    }
    const{data:r}=await supabaseClient.from('user_roles').select('role').eq('user_id',currentUser.id).single();
    if(r)currentRole=r.role;
  }catch(e){
    // Offline or Supabase error — load from IndexedDB cache
    // Wrapped in its own try-catch so IndexedDB errors don't propagate to doLogin
    try{
      const cached=await offlineStore.getOfflineProfile(currentUser?.id);
      if(cached){ currentOfficer=cached; }
    }catch(_){ /* IndexedDB unavailable or store not yet created — skip */ }
  }
}
async function loginSuccess(){const ls=document.getElementById('login-screen'),app=document.getElementById('main-app');ls.style.transition='opacity 0.4s';ls.style.opacity='0';setTimeout(()=>{ls.style.display='none';app.style.display='flex';setLoginLoading(false);initApp();},400);resetSessionTimer();}
function resetSessionTimer(){clearTimeout(sessionTimer);sessionTimer=setTimeout(()=>{showToast('⏰ Session expired.','error');setTimeout(doLogout,2000);},APP_CONFIG.sessionTimeout);}
document.addEventListener('mousemove',()=>{if(currentUser)resetSessionTimer();});document.addEventListener('keypress',()=>{if(currentUser)resetSessionTimer();});document.addEventListener('click',()=>{if(currentUser)resetSessionTimer();});
async function doLogout(){clearTimeout(sessionTimer);await supabaseClient.auth.signOut();currentUser=null;currentOfficer=null;currentRole='officer';document.getElementById('main-app').style.display='none';const ls=document.getElementById('login-screen');ls.style.display='flex';ls.style.opacity='1';document.getElementById('login-password').value='';showToast('👋 Signed out.');}
function pinPress(d){if(pinBuffer.length>=6)return;pinBuffer+=d;updatePinDots();if(pinBuffer.length===6)setTimeout(verifyPin,200);}
function pinBackspace(){pinBuffer=pinBuffer.slice(0,-1);updatePinDots();}
function updatePinDots(){for(let i=0;i<6;i++){const d=document.getElementById('pd'+i);if(d)d.classList.toggle('filled',i<pinBuffer.length);}}
async function verifyPin(){const sp=localStorage.getItem('dio_pin');if(!sp||pinBuffer!==sp){showLoginError('❌ Incorrect PIN.');pinBuffer='';updatePinDots();return;}pinBuffer='';updatePinDots();/* SECURITY FIX: Don't store plaintext passwords. Use existing Supabase session refresh token instead. */try{const{data:{session}}=await supabaseClient.auth.getSession();if(session){currentUser=session.user;await loadOfficerProfile();await loginSuccess();}else{showLoginError('⚠️ Session expired. Please use password to sign in.');setLoginMethod('password',document.querySelectorAll('.login-method')[0]);}}catch(e){showLoginError('⚠️ PIN login failed. Use password instead.');}}
async function doBiometric(){if(!window.PublicKeyCredential){showLoginError('⚠️ Biometric not supported.');return;}document.getElementById('bio-ring').classList.add('scanning');try{await navigator.credentials.get({publicKey:{challenge:new Uint8Array(32),timeout:60000,userVerification:'required'}});/* SECURITY FIX: Don't store plaintext passwords. Use existing session. */const{data:{session}}=await supabaseClient.auth.getSession();if(session){currentUser=session.user;await loadOfficerProfile();await loginSuccess();}else{document.getElementById('bio-ring').classList.remove('scanning');showLoginError('⚠️ Session expired. Please use password to sign in.');setLoginMethod('password',document.querySelectorAll('.login-method')[0]);}}catch(e){document.getElementById('bio-ring').classList.remove('scanning');showLoginError('⚠️ Biometric failed. Use password instead.');}}
function showRegister(){document.getElementById('register-modal').style.display='flex';}
function hideRegister(){document.getElementById('register-modal').style.display='none';}
async function submitRegistration(){const name=document.getElementById('reg-name').value.trim(),email=document.getElementById('reg-email').value.trim(),badge=document.getElementById('reg-badge').value.trim(),station=document.getElementById('reg-station').value.trim(),district=document.getElementById('reg-district').value.trim(),pass=document.getElementById('reg-password').value;if(!name||!email||!badge||!station||!pass){showToast('⚠️ Fill all fields.','error');return;}if(pass.length<8){showToast('⚠️ Password min 8 characters.','error');return;}try{const{data,error}=await supabaseClient.auth.signUp({email,password:pass,options:{data:{full_name:name,badge_number:badge,station,district}}});if(error){showToast('❌ '+error.message,'error');return;}/* SECURITY FIX: Do NOT auto-create officer/user_roles rows here. Admin must approve via admin.html. Write to pending_registrations instead. */if(data.user){await supabaseClient.from('pending_registrations').insert({user_id:data.user.id,full_name:name,email,badge_number:badge,station,district,status:'pending'});}hideRegister();showToast('✅ Registration submitted! Admin approval required before you can sign in.','success',6000);}catch(err){showToast('⚠️ Error: '+err.message,'error');}}
function showForgotPassword(){document.getElementById('forgot-modal').style.display='flex';document.getElementById('forgot-step1').style.display='block';document.getElementById('forgot-step2').style.display='none';document.getElementById('forgot-step3').style.display='none';}
function hideForgotModal(){document.getElementById('forgot-modal').style.display='none';}
async function sendOTP(){const email=document.getElementById('forgot-email').value.trim();if(!email){showToast('⚠️ Enter email.','error');return;}await supabaseClient.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});document.getElementById('forgot-step1').style.display='none';document.getElementById('forgot-step2').style.display='block';showToast('📧 Reset email sent.','success');}
function otpNext(i){const v=document.getElementById('otp'+i).value;if(v&&i<5)document.getElementById('otp'+(i+1)).focus();}
function verifyOTP(){document.getElementById('forgot-step2').style.display='none';document.getElementById('forgot-step3').style.display='block';}
async function resetPassword(){const p1=document.getElementById('new-pass1').value,p2=document.getElementById('new-pass2').value;if(!p1||p1.length<8){showToast('⚠️ Min 8 characters.','error');return;}if(p1!==p2){showToast('❌ Passwords do not match.','error');return;}const{error}=await supabaseClient.auth.updateUser({password:p1});if(error){showToast('❌ '+error.message,'error');return;}hideForgotModal();showToast('✅ Password reset! Please log in.','success');}
function showLoginError(msg){const el=document.getElementById('login-error');el.textContent=msg;el.style.display='block';}
function hideLoginError(){document.getElementById('login-error').style.display='none';}
function setLoginLoading(l){const btn=document.getElementById('login-submit-btn');document.getElementById('login-btn-text').style.display=l?'none':'inline';document.getElementById('login-btn-loader').style.display=l?'inline':'none';if(btn)btn.disabled=l;}
function togglePasswordVisibility(){const i=document.getElementById('login-password');i.type=i.type==='password'?'text':'password';}
async function checkExistingSession(){
  const{data:{session}}=await supabaseClient.auth.getSession();
  if(session){
    currentUser=session.user;
    await loadOfficerProfile(); // offline-safe: falls back to IndexedDB cache
    await loginSuccess();
    if(!navigator.onLine)
      _showSyncBar('offline','📴 Offline mode — your data is available locally');
  }else{
    const n=localStorage.getItem('dio_officer_name');
    const el=document.getElementById('login-officer-name');
    if(el)el.textContent=n||'Welcome, Officer';
    // Show offline indicator on login screen if no internet
    if(!navigator.onLine){
      const hint=document.getElementById('offline-login-hint');
      if(hint)hint.style.display='block';
    }
  }
}

// ── DATABASE HELPERS ──
async function getOfficerId(){if(currentOfficer)return currentOfficer.id;if(!currentUser)return null;const{data}=await supabaseClient.from('officers').select('id').eq('user_id',currentUser.id).single();return data?.id||null;}
async function getCases(fStatus,fQuery){fStatus=fStatus||'';fQuery=fQuery||'';
  const oid=await getOfficerId();if(!oid)return[];
  let list=[];
  try{
    if(!navigator.onLine)throw new Error('offline');
    let q=supabaseClient.from('cases').select('*').eq('officer_id',oid).order('created_at',{ascending:false});
    if(fStatus)q=q.eq('status',fStatus);
    const{data,error}=await q;
    if(error)throw error;
    list=data||[];
    // Cache fresh data locally for offline use
    offlineStore.cache('cases_cache',list).catch(()=>{});
  }catch(err){
    // Offline or network error — serve from local cache
    console.warn('[Offline] getCases using local cache');
    list=await offlineStore.getAll('cases_cache',oid);
    if(fStatus)list=list.filter(c=>c.status===fStatus);
    _showSyncBar('offline',`📴 Offline — showing ${list.length} cached case${list.length!==1?'s':''}`);
  }
  if(fQuery){const s=fQuery.toLowerCase().trim();list=list.filter(c=>(c.fir_number||'').toLowerCase().includes(s)||(c.section_of_law||'').toLowerCase().includes(s)||(c.offence_type||'').toLowerCase().includes(s)||(c.complainant||'').toLowerCase().includes(s)||(c.complainant_cnic||'').includes(s));}
  return list;
}
async function getCase(id){
  // Get from cases_decrypted for encrypted fields
  const{data:decrypted}=await supabaseClient.from('cases_decrypted').select('*').eq('id',id).single();
  // Also get from cases directly for new columns that may not be in view
  const{data:raw}=await supabaseClient.from('cases').select('occurrence_date,complainant_cnic,complainant_cell,complainant_profession,fir_writer,complaint_sender,documents_checklist').eq('id',id).single();
  if(!decrypted) return null;
  // Merge both - raw fields take priority for new columns
  return {...decrypted,...(raw||{})};
}
async function addCase(d){
  const oid=await getOfficerId();if(!oid)throw new Error('Not authenticated');
  if(!navigator.onLine){
    // Save locally with a temporary ID and queue for sync
    const tempId='offline_'+Date.now()+'_'+Math.random().toString(36).slice(2,7);
    const local={...d,id:tempId,officer_id:oid,created_at:new Date().toISOString(),_offline:true};
    await offlineStore.cache('cases_cache',local);
    await offlineStore.enqueue('cases','insert',{...d,officer_id:oid,case_station:currentOfficer?.station||null,case_district:currentOfficer?.district||null},tempId);
    _showSyncBar('pending','📴 Case saved offline — will sync when connected');
    return local;
  }
  const{data,error}=await supabaseClient.from('cases').insert({...d,officer_id:oid}).select().single();
  if(error)throw error;
  offlineStore.cache('cases_cache',data).catch(()=>{});
  triggerBackup('case_added');return data;
}
async function updateCase(id,d){
  if(!navigator.onLine){
    // Update local cache and queue
    const cached=(await offlineStore.getAll('cases_cache')).find(c=>c.id===id);
    if(cached)await offlineStore.cache('cases_cache',{...cached,...d,id,updated_at:new Date().toISOString()});
    await offlineStore.enqueue('cases','update',{...d,id,updated_at:new Date().toISOString()});
    _showSyncBar('pending','📴 Case updated offline — will sync when connected');
    return{id,...d};
  }
  const{data,error}=await supabaseClient.from('cases').update({...d,updated_at:new Date().toISOString()}).eq('id',id).select().single();
  if(error)throw error;
  offlineStore.cache('cases_cache',data).catch(()=>{});
  triggerBackup('case_updated');return data;
}
async function deleteCase(id){
  if(!navigator.onLine){
    await offlineStore.remove('cases_cache',id);
    await offlineStore.enqueue('cases','delete',{id});
    _showSyncBar('pending','📴 Case deletion queued — will sync when connected');
    return;
  }
  const{error}=await supabaseClient.from('cases').delete().eq('id',id);
  if(error)throw error;
  offlineStore.remove('cases_cache',id).catch(()=>{});
  triggerBackup('case_deleted');
}

async function getEvidence(fir=''){
  const oid=await getOfficerId();if(!oid)return[];
  try{
    if(!navigator.onLine)throw new Error('offline');
    let q=supabaseClient.from('evidence').select('*').eq('officer_id',oid).order('created_at',{ascending:false});
    if(fir)q=q.eq('fir_number',fir);
    const{data}=await q;
    const list=data||[];
    offlineStore.cache('evidence_cache',list).catch(()=>{});
    return list;
  }catch(_){
    const list=await offlineStore.getAll('evidence_cache',oid);
    return fir?list.filter(e=>e.fir_number===fir):list;
  }
}
async function addEvidence(d){
  const oid=await getOfficerId();if(!oid)throw new Error('Not authenticated');
  if(!navigator.onLine){
    const tempId='offline_ev_'+Date.now();
    const local={...d,id:tempId,officer_id:oid,created_at:new Date().toISOString(),_offline:true};
    await offlineStore.cache('evidence_cache',local);
    await offlineStore.enqueue('evidence','insert',{...d,officer_id:oid},tempId);
    _showSyncBar('pending','📴 Evidence saved offline — will sync when connected');
    return local;
  }
  const{data,error}=await supabaseClient.from('evidence').insert({...d,officer_id:oid}).select().single();
  if(error)throw error;
  offlineStore.cache('evidence_cache',data).catch(()=>{});
  triggerBackup('ev_added');return data;
}
async function deleteEvidence(id){
  if(!navigator.onLine){
    await offlineStore.remove('evidence_cache',id);
    await offlineStore.enqueue('evidence','delete',{id});
    _showSyncBar('pending','📴 Evidence deletion queued — will sync when connected');
    return;
  }
  const{error}=await supabaseClient.from('evidence').delete().eq('id',id);
  if(error)throw error;
  offlineStore.remove('evidence_cache',id).catch(()=>{});
}
async function getReminders(done=null){
  const oid=await getOfficerId();if(!oid)return[];
  try{
    if(!navigator.onLine)throw new Error('offline');
    let q=supabaseClient.from('reminders').select('*').eq('officer_id',oid).order('reminder_date',{ascending:true});
    if(done!==null)q=q.eq('is_done',done);
    const{data}=await q;const list=data||[];
    offlineStore.cache('reminders_cache',list).catch(()=>{});
    return list;
  }catch(_){
    const list=await offlineStore.getAll('reminders_cache',oid);
    return done!==null?list.filter(r=>r.is_done===done):list;
  }
}
async function addReminder(d){
  const oid=await getOfficerId();if(!oid)throw new Error('Not authenticated');
  if(!navigator.onLine){
    const tempId='offline_rem_'+Date.now();
    const local={...d,id:tempId,officer_id:oid,is_done:false,created_at:new Date().toISOString(),_offline:true};
    await offlineStore.cache('reminders_cache',local);
    await offlineStore.enqueue('reminders','insert',{...d,officer_id:oid},tempId);
    _showSyncBar('pending','📴 Reminder saved offline — will sync when connected');
    return local;
  }
  const{data,error}=await supabaseClient.from('reminders').insert({...d,officer_id:oid}).select().single();
  if(error)throw error;
  offlineStore.cache('reminders_cache',data).catch(()=>{});
  return data;
}
async function updateReminder(id,u){
  const cached=await offlineStore.getOne('reminders_cache',id);
  if(cached)await offlineStore.cache('reminders_cache',{...cached,...u});
  if(!navigator.onLine){
    await offlineStore.enqueue('reminders','update',{id,...u});
    _showSyncBar('pending','📴 Reminder updated offline — will sync when connected');
    return{id,...u};
  }
  const{data,error}=await supabaseClient.from('reminders').update(u).eq('id',id).select().single();
  if(error)throw error;
  offlineStore.cache('reminders_cache',data).catch(()=>{});
  return data;
}
async function deleteReminder(id){
  if(!navigator.onLine){
    await offlineStore.remove('reminders_cache',id);
    await offlineStore.enqueue('reminders','delete',{id});
    _showSyncBar('pending','📴 Reminder deletion queued — will sync when connected');
    return;
  }
  const{error}=await supabaseClient.from('reminders').delete().eq('id',id);
  if(error)throw error;
  offlineStore.remove('reminders_cache',id).catch(()=>{});
}
async function getMisal(fir=''){const oid=await getOfficerId();if(!oid)return[];let q=supabaseClient.from('misal').select('*').eq('officer_id',oid).order('saved_at',{ascending:false});if(fir)q=q.eq('fir_number',fir);const{data}=await q;return data||[];}
async function saveMisal(d){const oid=await getOfficerId();if(!oid)throw new Error('Not authenticated');const{data,error}=await supabaseClient.from('misal').insert({...d,officer_id:oid}).select().single();if(error)throw error;return data;}
async function updateOfficerProfile(u){const{data,error}=await supabaseClient.from('officers').update({...u,updated_at:new Date().toISOString()}).eq('user_id',currentUser.id).select().single();if(error)throw error;currentOfficer=data;return data;}
async function getDashboardStats(){const cases=await getCases(),reminders=await getReminders(false);const under=cases.filter(c=>c.status==='under').length,complete=cases.filter(c=>c.status==='complete').length,incomplete=cases.filter(c=>c.status==='incomplete').length,untrace=cases.filter(c=>c.status==='untrace').length,cancel=cases.filter(c=>c.status==='cancel').length,challan512=cases.filter(c=>c.status==='challan512').length;const total=under+complete+incomplete+untrace+cancel+challan512;return{total,under,complete,incomplete,untrace,cancel,challan512,pendingReminders:reminders.length,cases,reminders:reminders.slice(0,5)};}
async function advancedSearch(p){let cases=await getCases();if(p.fir)cases=cases.filter(c=>c.fir_number?.toLowerCase().includes(p.fir.toLowerCase()));if(p.name)cases=cases.filter(c=>c.accused_name?.toLowerCase().includes(p.name.toLowerCase())||c.complainant?.toLowerCase().includes(p.name.toLowerCase()));if(p.cnic)cases=cases.filter(c=>c.accused_cnic?.includes(p.cnic));if(p.cell)cases=cases.filter(c=>c.accused_cell?.includes(p.cell));if(p.status)cases=cases.filter(c=>c.status===p.status);if(p.section)cases=cases.filter(c=>c.section_of_law?.toLowerCase().includes(p.section.toLowerCase()));return cases;}
async function getAdminStats(){if(currentRole!=='admin'&&currentRole!=='superadmin')return null;const{data:officers}=await supabaseClient.from('officers').select('*');const{data:cases}=await supabaseClient.from('cases').select('id,status');const{data:logs}=await supabaseClient.from('audit_log').select('*').order('created_at',{ascending:false}).limit(50);return{totalOfficers:officers?.length||0,totalCases:cases?.length||0,activeCases:cases?.filter(c=>c.status==='under').length||0,completedCases:cases?.filter(c=>c.status==='complete').length||0,officers:officers||[],recentActivity:logs||[]};}
function setupRealtimeSync(cb){supabaseClient.channel('db-changes').on('postgres_changes',{event:'*',schema:'public',table:'cases'},()=>{if(cb)cb('cases');}).on('postgres_changes',{event:'*',schema:'public',table:'reminders'},()=>{if(cb)cb('reminders');}).on('postgres_changes',{event:'*',schema:'public',table:'evidence'},()=>{if(cb)cb('evidence');}).subscribe();}

// ── UI HELPERS + PAGE ROUTER ──
function showToast(msg,type='info',duration=APP_CONFIG.toastDuration){const c=document.getElementById('toast-container'),t=document.createElement('div');t.className=`toast toast-${type}`;t.innerHTML=msg;c.appendChild(t);setTimeout(()=>{t.style.opacity='0';t.style.transition='opacity 0.3s';setTimeout(()=>t.remove(),300);},duration);}
function openModal(title,body,footer=''){document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal-card"><div class="modal-header"><div class="modal-title">${title}</div><button class="modal-close" onclick="closeModal()">✕</button></div><div class="modal-body">${body}</div>${footer?`<div class="modal-footer">${footer}</div>`:''}</div></div>`;}
function closeModal(){document.getElementById('modal-root').innerHTML='';}
const pageTitles={dashboard:'🏠 Dashboard',cases:'📁 My Cases',misal:'📄 MISAL Builder',forms:'📥 Official Forms',fivec:'📋 5-C Applications',evidence:'🔬 Evidence',search:'🔍 Advanced Search',law:'⚖️ Law Library',reminders:'🔔 Reminders',performance:'📊 Performance',backup:'☁️ Backup & Sync',settings:'⚙️ Settings'};
const pageRenderers={};
function registerPage(name,fn){pageRenderers[name]=fn;}
function showPage(page,el){document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));if(el)el.classList.add('active');else document.querySelectorAll('.nav-item').forEach(n=>{if(n.getAttribute('onclick')?.includes(`'${page}'`))n.classList.add('active');});document.getElementById('topbar-title').textContent=pageTitles[page]||page;const c=document.getElementById('page-content');c.innerHTML=`<div class="loading-screen"><div class="loading-spinner"></div><div class="loading-text">Loading...</div></div>`;document.getElementById('sidebar').classList.remove('open');if(pageRenderers[page]){
  /* Wrap renderer in try/catch + timeout so failures don't leave a permanent loading spinner */
  const timeoutId=setTimeout(()=>{if(c.querySelector('.loading-screen')){c.innerHTML=`<div style="padding:40px;text-align:center;color:var(--amber);"><div style="font-size:48px;margin-bottom:12px;">⏱️</div><div style="font-size:14px;margin-bottom:8px;">Loading is taking too long.</div><div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">The database query may be blocked by a security policy or your tables may be missing. Open browser console (F12) for details.</div><button class="btn btn-secondary" onclick="showPage('${page}',null)">🔄 Retry</button></div>`;}},15000);
  Promise.resolve(pageRenderers[page](c)).catch(err=>{console.error('[Page Render Error]',page,err);c.innerHTML=`<div style="padding:40px;text-align:center;color:var(--red);"><div style="font-size:48px;margin-bottom:12px;">⚠️</div><div style="font-size:14px;margin-bottom:8px;">Could not load ${page}.</div><div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);background:var(--bg-tertiary);padding:10px;border-radius:6px;margin:10px auto;max-width:600px;text-align:left;word-break:break-word;">${(err&&err.message)?err.message:String(err)}</div><button class="btn btn-secondary" onclick="showPage('${page}',null)">🔄 Retry</button></div>`;}).finally(()=>clearTimeout(timeoutId));
}else c.innerHTML=`<div style="text-align:center;padding:60px;color:var(--text-muted);"><div style="font-size:48px;margin-bottom:12px;">🚧</div><div>Coming Soon</div></div>`;resetSessionTimer();}
function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');}
function updateConnectionStatus(ok){const d=document.getElementById('status-dot'),t=document.getElementById('status-text'),b=document.getElementById('db-badge');if(d)d.style.background=ok?'var(--green)':'var(--red)';if(t)t.textContent=ok?'Online':'Offline';if(b){b.textContent=ok?'🔗 Connected':'❌ Disconnected';b.style.background=ok?'var(--green-bg)':'var(--red-bg)';b.style.color=ok?'var(--green)':'var(--red)';}}
async function updateBadges(){try{const cases=await getCases(),rem=await getReminders(false);const cb=document.getElementById('badge-cases'),rb=document.getElementById('badge-reminders');if(cb)cb.textContent=cases.length;if(rb)rb.textContent=rem.length;}catch(e){}}
function startClock(){setInterval(()=>{const el=document.getElementById('footer-time');if(el)el.textContent=new Date().toLocaleTimeString('en-PK',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true});},1000);}
function formatCNIC(v){if(!v)return'—';const d=v.replace(/\D/g,'');if(d.length===13)return`${d.slice(0,5)}-${d.slice(5,12)}-${d.slice(12)}`;return v;}
function formatCell(v){if(!v)return'—';const d=v.replace(/\D/g,'');if(d.length===11)return`${d.slice(0,4)}-${d.slice(4)}`;return v;}
function autoFormatCNIC(i){let v=i.value.replace(/\D/g,'').slice(0,13);if(v.length>12)v=`${v.slice(0,5)}-${v.slice(5,12)}-${v.slice(12)}`;else if(v.length>5)v=`${v.slice(0,5)}-${v.slice(5)}`;i.value=v;}
function autoFormatCell(i){let v=i.value.replace(/\D/g,'').slice(0,11);if(v.length>4)v=`${v.slice(0,4)}-${v.slice(4)}`;i.value=v;}
function formatDate(d){if(!d)return'—';try{return new Date(d).toLocaleDateString('en-PK',{day:'2-digit',month:'short',year:'numeric'});}catch{return d;}}
function timeAgo(d){if(!d)return'—';const diff=Date.now()-new Date(d).getTime(),m=Math.floor(diff/60000),h=Math.floor(diff/3600000),days=Math.floor(diff/86400000);if(m<1)return'Just now';if(m<60)return`${m}m ago`;if(h<24)return`${h}h ago`;return`${days}d ago`;}
function updateSidebarProfile(){if(!currentOfficer)return;const ne=document.getElementById('sidebar-name'),re=document.getElementById('sidebar-role'),ae=document.getElementById('sidebar-avatar'),fe=document.getElementById('footer-officer');if(ne)ne.textContent=currentOfficer.full_name||'Officer';if(re)re.textContent=currentOfficer.designation||currentRole;if(fe)fe.textContent=`Officer: ${currentOfficer.full_name||'—'} · ${currentOfficer.station||'—'}`;const photo=localStorage.getItem('dio_profile_photo');if(photo&&ae)ae.innerHTML=`<img src="${photo}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;else if(ae&&currentOfficer.full_name)ae.textContent=currentOfficer.full_name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();if(currentRole==='admin'||currentRole==='superadmin'){const an=document.getElementById('admin-nav-item');if(an)an.style.display='flex';}if(currentOfficer.full_name)localStorage.setItem('dio_officer_name',currentOfficer.full_name);}
function startNewsTicker(){const el=document.getElementById('news-ticker');if(el)el.textContent=POLICE_NEWS.join(' ✦ ');}
function printContent(html,title='Digital IO'){const win=window.open('','_blank');win.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:20px;color:#1a1a1a;}table{width:100%;border-collapse:collapse;}th,td{padding:8px;border:1px solid #ddd;font-size:12px;text-align:left;}th{background:#f5f5f5;}.wm{position:fixed;bottom:20px;right:20px;font-size:10px;color:#ccc;}</style></head><body>${html}<div class="wm">Digital IO · ${currentOfficer?.full_name||'Officer'} · ${new Date().toLocaleDateString('en-PK')}</div></body></html>`);win.document.close();win.focus();setTimeout(()=>win.print(),500);}

// ── BACKUP ──
let backupQueue=[],backupInProgress=false,lastBackupTime=null,googleDriveToken=null;
function triggerBackup(r='manual'){backupQueue.push({r,t:Date.now()});processBackupQueue();}
async function processBackupQueue(){if(backupInProgress||!backupQueue.length)return;backupInProgress=true;await new Promise(r=>setTimeout(r,2000));backupQueue=[];try{await performBackup();}catch(e){}backupInProgress=false;if(backupQueue.length)processBackupQueue();}
async function performBackup(){if(!currentUser)return;try{const cases=await getCases(),evidence=await getEvidence(),reminders=await getReminders(),misal=await getMisal();const bj=JSON.stringify({version:APP_CONFIG.version,date:new Date().toISOString(),officer:currentOfficer?.full_name,data:{cases,evidence,reminders,misal}});try{localStorage.setItem(`dio_backup_${currentUser.id}`,bj);localStorage.setItem(`dio_backup_${currentUser.id}_time`,new Date().toISOString());}catch(e){}if(googleDriveToken)await uploadToGoogleDrive(bj);lastBackupTime=new Date();}catch(e){}}
async function uploadToGoogleDrive(json){if(!googleDriveToken)return;const b='-------314159265358979323846',meta={name:`DigitalIO_${new Date().toISOString().slice(0,10)}.json`,mimeType:'application/json',parents:['appDataFolder']},body=`\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(meta)}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${json}\r\n--${b}--`;await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',{method:'POST',headers:{'Authorization':`Bearer ${googleDriveToken}`,'Content-Type':`multipart/related; boundary="${b}"`},body});}
async function connectGoogleDrive(){showToast('Google Drive integration coming in Phase 7.','info',4000);}
function disconnectGoogleDrive(){googleDriveToken=null;localStorage.removeItem('dio_gdrive_token');showToast('Google Drive disconnected.');}
async function triggerBackupNow(){showToast('⏳ Backing up...','info',2000);await performBackup();showToast('✅ Backup complete!','success');}
function getBackupStatus(){return{lastBackup:lastBackupTime,googleDriveConnected:!!googleDriveToken,localBackupExists:!!localStorage.getItem(`dio_backup_${currentUser?.id}`)};}
async function restoreFromLocalBackup(){const b=localStorage.getItem(`dio_backup_${currentUser?.id}`);if(!b){showToast('⚠️ No local backup found.','error');return;}showToast('✅ Backup found. Contact admin to restore.','info',5000);}
function initBackupSystem(){const t=localStorage.getItem('dio_gdrive_token');if(t)googleDriveToken=t;}

// ── SHARED: MISAL CHECKLIST + DATE HELPER (used by Cases workspace + MISAL Builder) ──
let selectedSections = [];

// ── MISAL DOCUMENT CHECKLIST ──
const MISAL_CHECKLIST = {
  'FIR Documents': ['FIR','FIR Mattan','CRO Form','CDR Form'],
  'Statements': ['Statement 161 CrPC','Statement 164 CrPC','Talbi 160 CrPC','Zimni Androoni','Zimni Berooni'],
  'Court Documents': ['Remand Form','Cancellation Report','Untrace Report'],
  'Identification': ['Shanakht Certificate','Missing Identity Form','Naqsha Moka','Naqsha Baramadgi'],
  'Medical / Forensic': ['Medical Report','Postmortem Report','DNA/PFSA Report','Potency Test'],
  'Judicial Forms': ['High Court Checklist','Forms 25-35A/B/C','Index MISAL','Dockets','Kalandras','Memorandum'],
  'Warrants & Notices': ['Warrant','Ishtihar Application','Abscondence Form','Mafroori Form'],
  'Financial': ['Investigation Bills','Recovery Memo','Saza Slip','RFA Form'],
  'Challan Lists': ['Fehrist Warsan (Death)','Fehrist Gawahan (Challan)','Fehrist Gawahan (Cancellation)'],
  'Intimation': ['Intimation Form','Previous Records'],
};
const ALL_MISAL_DOCS = Object.values(MISAL_CHECKLIST).flat();
let selectedDocuments = [];

function autoFormatDate(inp) {
  let v = inp.value.replace(/\D/g,'');
  if (v.length > 4) v = v.slice(0,2) + '-' + v.slice(2,4) + '-' + v.slice(4,8);
  else if (v.length > 2) v = v.slice(0,2) + '-' + v.slice(2);
  inp.value = v;
}


// ── OFFLINE STORE FALLBACK ──
// If offline-store.js failed to load or hasn't been uploaded yet,
// create a no-op shim so nothing crashes — offline features just silently disabled.
if(typeof offlineStore==='undefined'){
  window.offlineStore={
    cache:()=>Promise.resolve(),
    getAll:()=>Promise.resolve([]),
    getOne:()=>Promise.resolve(null),
    remove:()=>Promise.resolve(),
    enqueue:()=>Promise.resolve(),
    pendingCount:()=>Promise.resolve(0),
    getPending:()=>Promise.resolve([]),
    processQueue:()=>Promise.resolve(0),
    saveOfflineProfile:()=>Promise.resolve(),
    getOfflineProfile:()=>Promise.resolve(null),
    saveOfflineCreds:()=>Promise.resolve(),
    getOfflineCredsByEmail:()=>Promise.resolve(null),
    storeFile:()=>Promise.resolve(),
    getFile:()=>Promise.resolve(null),
    removeFile:()=>Promise.resolve(),
    isAvailable:()=>Promise.resolve(false),
  };
  console.warn('[DigitalIO] offline-store.js not loaded — offline mode disabled');
}


// SHA-256 hash using Web Crypto API (built-in, no library needed)
async function _hashPw(password,salt){
  const enc=new TextEncoder();
  const buf=await crypto.subtle.digest('SHA-256',enc.encode(salt+password+'dio-v1'));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

// Save credentials hash + officer profile to IndexedDB after successful online login
async function _saveOfflineAuth(email,password){
  try{
    const salt=crypto.randomUUID();
    const hash=await _hashPw(password,salt);
    await offlineStore.saveOfflineCreds(currentUser.id,email,hash,salt);
    if(currentOfficer) await offlineStore.saveOfflineProfile(currentUser.id,currentOfficer);
  }catch(e){ console.warn('[OfflineAuth] Could not save offline credentials:',e); }
}

// Verify offline credentials against stored hash. Returns profile or null.
async function _attemptOfflineLogin(email,password){
  const creds=await offlineStore.getOfflineCredsByEmail(email);
  if(!creds) return null;
  // Credentials expire after 30 days of no online login
  if((Date.now()-new Date(creds.saved_at))>30*86400000){
    showToast('⚠️ Offline credentials expired — please connect to login.','error',5000);
    return null;
  }
  const hash=await _hashPw(password,creds.salt);
  if(hash!==creds.hash) return null;
  return offlineStore.getOfflineProfile(creds.id);
}

// ── THEMES ──
const THEMES = [
  // ─ Colour themes ─
  {id:'dark',     name:'Dark Navy',  urdu:'رات',       emoji:'🌑', bg:'#0a1520', accent:'#38bdf8', photo:false},
  {id:'light',    name:'Light',      urdu:'دن',        emoji:'☀️',  bg:'#f0f4f8', accent:'#0369a1', photo:false},
  {id:'forest',   name:'Forest',     urdu:'جنگل',      emoji:'🌲', bg:'#071410', accent:'#4ade80', photo:false},
  {id:'ocean',    name:'Ocean',      urdu:'سمندر',     emoji:'🌊', bg:'#021f1f', accent:'#2dd4bf', photo:false},
  {id:'sunset',   name:'Sunset',     urdu:'شفق',       emoji:'🌅', bg:'#150900', accent:'#fb923c', photo:false},
  {id:'lavender', name:'Lavender',   urdu:'بنفشی',     emoji:'💜', bg:'#0c0818', accent:'#a78bfa', photo:false},
  // ─ Photo / wallpaper themes ─
  {id:'blossom',  name:'Blossom',    urdu:'بہار',      emoji:'🌸', bg:'#190518', accent:'#f472b6', photo:true, seed:'spring-blossom-dio'},
  {id:'peaks',    name:'Mountains',  urdu:'پہاڑ',      emoji:'🏔️', bg:'#04101a', accent:'#60a5fa', photo:true, seed:'mountain-peaks-dio'},
  {id:'cosmos',   name:'Galaxy',     urdu:'کائنات',    emoji:'🌌', bg:'#06031a', accent:'#818cf8', photo:true, seed:'galaxy-cosmos-dio'},
  {id:'autumn',   name:'Autumn',     urdu:'خزاں',      emoji:'🍂', bg:'#180600', accent:'#f97316', photo:true, seed:'autumn-leaves-dio'},
  {id:'aurora',   name:'Aurora',     urdu:'قطبی شفق',  emoji:'✨', bg:'#000e12', accent:'#34d399', photo:true, seed:'northern-lights-dio'},
];

function applyTheme(id){
  const t=THEMES.find(th=>th.id===id)||THEMES[0];
  if(id==='dark'){document.documentElement.removeAttribute('data-theme');}
  else{document.documentElement.setAttribute('data-theme',id);}
  // Photo themes add a class that enables glassmorphism CSS
  if(t.photo){document.documentElement.classList.add('photo-theme');}
  else{document.documentElement.classList.remove('photo-theme');}
  localStorage.setItem('dio_theme',id);
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.content=t.bg;
  const popup=document.getElementById('theme-picker-popup');
  if(popup)_renderThemeSwatches(popup,id);
}

function loadSavedTheme(){
  applyTheme(localStorage.getItem('dio_theme')||'dark');
}

function openThemePicker(){
  const existing=document.getElementById('theme-picker-popup');
  if(existing){existing.remove();return;}
  const btn=document.getElementById('theme-picker-btn');
  const rect=btn?btn.getBoundingClientRect():{bottom:52,right:16};
  const popup=document.createElement('div');
  popup.id='theme-picker-popup';
  popup.style.cssText=`position:fixed;top:${rect.bottom+6}px;right:16px;z-index:3000;`
    +`background:var(--bg-card);border:1px solid var(--border);border-radius:14px;`
    +`padding:16px;box-shadow:var(--shadow);min-width:310px;max-height:80vh;overflow-y:auto;`;
  popup.innerHTML=`<div style="font-size:9px;color:var(--text-faint);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;font-weight:700;">🎨 تھیم — Theme</div>`
    +`<div id="theme-swatches"></div>`;
  document.body.appendChild(popup);
  _renderThemeSwatches(popup,localStorage.getItem('dio_theme')||'dark');
  setTimeout(()=>{
    function closeOnOutside(e){
      if(!popup.contains(e.target)&&e.target.id!=='theme-picker-btn'){
        popup.remove();document.removeEventListener('click',closeOnOutside);
      }
    }
    document.addEventListener('click',closeOnOutside);
  },50);
}

function _renderThemeSwatches(popup,currentId){
  const grid=popup.querySelector('#theme-swatches');if(!grid)return;
  const colourThemes=THEMES.filter(t=>!t.photo);
  const photoThemes=THEMES.filter(t=>t.photo);
  function section(label,themes){
    return `<div style="font-size:9px;color:var(--text-faint);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;font-weight:700;">${label}</div>`
      +`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">`
      +themes.map(t=>{
        const isPhoto=t.photo;
        const circleStyle=isPhoto
          ?`background-image:url('https://picsum.photos/seed/${t.seed}/120/80');background-size:cover;background-position:center;`
          :`background:${t.bg};`;
        const inner=isPhoto?'':`<span>${t.emoji}</span>`;
        return `<div class="theme-swatch ${t.id===currentId?'active':''}" onclick="applyTheme('${t.id}')">
          <div class="theme-swatch-circle" style="${circleStyle}border-color:${t.accent};">${inner}</div>
          <div style="font-size:10px;color:var(--text-secondary);text-align:center;line-height:1.2;">${t.name}</div>
          <div style="font-size:9px;color:var(--text-muted);text-align:center;">${t.urdu}</div>
        </div>`;
      }).join('')+`</div>`;
  }
  grid.innerHTML=section('Colour Themes',colourThemes)+section('Photo / Wallpaper Themes',photoThemes);
}


async function initApp(){updateSidebarProfile();updateConnectionStatus(true);await updateBadges();startClock();initBackupSystem();setupRealtimeSync(async(table)=>{await updateBadges();const pt=document.getElementById('topbar-title')?.textContent;if(table==='cases'&&pt?.includes('Cases'))renderCases(document.getElementById('page-content'));if(table==='reminders'&&pt?.includes('Reminder'))renderReminders(document.getElementById('page-content'));});showPage('dashboard',document.querySelector('.nav-item'));setTimeout(()=>triggerBackup('app_init'),3000);}
// ── STATION TRANSFER ──
async function openTransferModal(){
  const o=currentOfficer||{};
  let history='';
  try{
    const oid=await getOfficerId();
    if(oid){const{data}=await supabaseClient.from('officer_transfers').select('*').eq('officer_id',oid).order('transfer_date',{ascending:false}).limit(10);
      if(data&&data.length){history=`<div style="margin-top:16px;"><div style="font-size:10px;color:var(--text-faint);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;font-weight:700;">Transfer History</div>`+data.map(t=>`<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:var(--bg-tertiary);border-radius:6px;margin-bottom:5px;font-size:11px;flex-wrap:wrap;"><span style="color:var(--text-muted);">${t.transfer_date||'—'}</span><span style="color:var(--text-faint);">→</span><span style="color:var(--text-primary);font-weight:600;">${t.to_station||''}${t.to_district?', '+t.to_district:''}</span>${t.order_number?`<span style="margin-left:auto;font-size:10px;color:var(--text-faint);">Order: ${t.order_number}</span>`:''}</div>`).join('')+'</div>';}}
  }catch(_){}
  const inp='width:100%;padding:8px 10px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:13px;box-sizing:border-box;';
  const lbl='display:block;font-size:11px;color:var(--text-muted);margin-bottom:4px;font-weight:600;';
  openModal('🏛️ Record Station Transfer',
    `<p style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">Recording a transfer updates your current station. All your existing cases remain visible — they are linked to you, not to a station.</p>
     <div style="padding:10px;background:var(--accent-glow);border-radius:6px;margin-bottom:14px;font-size:12px;color:var(--text-secondary);">
       <b>Current Posting:</b> ${o.station||'Not set'}${o.district?', '+o.district:''}
     </div>
     <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
       <div><label style="${lbl}">New Police Station *</label><input style="${inp}" id="tr-station" placeholder="e.g. Seetal Mari"></div>
       <div><label style="${lbl}">New District</label><input style="${inp}" id="tr-district" placeholder="e.g. Multan" value="${o.district||''}"></div>
       <div><label style="${lbl}">Transfer Date</label><input style="${inp}" type="date" id="tr-date" value="${new Date().toISOString().split('T')[0]}"></div>
       <div><label style="${lbl}">Transfer Order No.</label><input style="${inp}" id="tr-order" placeholder="Optional"></div>
       <div style="grid-column:1/-1;"><label style="${lbl}">Notes (optional)</label><input style="${inp}" id="tr-notes" placeholder="e.g. Promoted, posted as SHO"></div>
     </div>${history}`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveTransfer()">✅ Save Transfer</button>`);
}

async function saveTransfer(){
  const newStation=document.getElementById('tr-station').value.trim();
  if(!newStation){showToast('⚠️ New station name is required.','error');return;}
  const o=currentOfficer||{};
  const oid=await getOfficerId();if(!oid)return;
  const newDistrict=document.getElementById('tr-district').value.trim()||null;
  try{
    await supabaseClient.from('officer_transfers').insert({
      officer_id:oid,from_station:o.station||null,from_district:o.district||null,
      to_station:newStation,to_district:newDistrict,
      transfer_date:document.getElementById('tr-date').value||null,
      order_number:document.getElementById('tr-order').value.trim()||null,
      notes:document.getElementById('tr-notes').value.trim()||null,
    });
    await supabaseClient.from('officers').update({station:newStation,district:newDistrict||o.district}).eq('id',oid);
    if(currentOfficer){currentOfficer.station=newStation;if(newDistrict)currentOfficer.district=newDistrict;}
    updateSidebarProfile();
    closeModal();
    showToast(`✅ Transfer recorded — now posted at ${newStation}.`,'success',5000);
  }catch(e){showToast('❌ '+e.message,'error',5000);}
}

// ── OFFLINE SYNC ORCHESTRATION ──
function _showSyncBar(state,msg){
  let bar=document.getElementById('sync-bar');
  if(!bar)return;
  const styles={
    offline: 'background:#ef4444;color:#fff;',
    pending: 'background:#f59e0b;color:#fff;',
    syncing: 'background:#3b82f6;color:#fff;',
    success: 'background:#22c55e;color:#fff;',
  };
  bar.style.cssText=`display:block;position:fixed;top:0;left:0;right:0;z-index:99999;padding:6px 16px;text-align:center;font-size:12px;font-weight:600;${styles[state]||styles.pending}`;
  bar.textContent=msg;
  if(state==='success')setTimeout(()=>{if(bar)bar.style.display='none';},3000);
}
function _hideSyncBar(){const b=document.getElementById('sync-bar');if(b)b.style.display='none';}

async function syncOfflineQueue(){
  const count=await offlineStore.pendingCount();
  if(count===0){_hideSyncBar();return;}
  _showSyncBar('syncing',`🔄 Syncing ${count} offline change${count!==1?'s':''}…`);
  try{
    const synced=await offlineStore.processQueue(supabaseClient);
    const remaining=await offlineStore.pendingCount();
    if(remaining===0){
      _showSyncBar('success',`✅ ${synced} change${synced!==1?'s':''} synced!`);
    }else{
      _showSyncBar('pending',`⚠️ ${synced} synced, ${remaining} still pending — will retry`);
    }
    // Refresh whichever tab is currently visible
    const container=document.getElementById('page-content');
    const title=document.getElementById('topbar-title')?.textContent||'';
    if(container){
      if(title.includes('Cases'))     renderCases(container);
      else if(title.includes('5-C'))  renderFiveC(container);
      else if(title.includes('Remind')) renderReminders(container);
      else if(title.includes('Evidence')) renderEvidence(container);
    }
    await updateBadges();
  }catch(err){
    _showSyncBar('pending','❌ Sync error — will retry on next connection');
    console.error('[Sync]',err);
  }
}

window.addEventListener('online',async()=>{
  updateConnectionStatus(true);
  showToast('🌐 Back online — syncing your offline work…','success',4000);
  await syncOfflineQueue();
});
window.addEventListener('offline',()=>{
  updateConnectionStatus(false);
  _showSyncBar('offline','📴 You are offline — changes will be saved locally and synced when reconnected');
  showToast('📴 Offline mode — working from local cache','error',5000);
});
window.addEventListener('DOMContentLoaded',async()=>{
  loadSavedTheme();
  onSupabaseReady(async()=>{
    await checkExistingSession();
    // Check for pending offline ops from any previous session
    if(navigator.onLine) setTimeout(()=>syncOfflineQueue(),3000);
  });setInterval(()=>{const el=document.getElementById('footer-time');if(el)el.textContent=new Date().toLocaleTimeString('en-PK',{hour12:true});},1000);console.log('✅ Digital IO v4.4.0 — FULLY MODULAR (Round 4 complete — index.html is pure HTML/CSS) — '+new Date().toISOString());});
