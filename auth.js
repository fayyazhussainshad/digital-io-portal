/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — لاگ اِن / PIN / بایومیٹرک / سیشن / رجسٹریشن
   (پہلے یہ سب app-core.js میں تھا — وہ فائل 2100 سطروں کی ہو
    گئی تھی، اسی لیے تبدیلی کرتے وقت غلط جگہ لگ جاتی تھی۔)
   AHEM: یہ فائل app-core.js کے BAAD لوڈ ہوتی ہے۔
   ═══════════════════════════════════════════════════════════ */

async function _dioSaveAuthToken(key) {
  try {
    const { data } = await supabaseClient.auth.getSession();
    const rt = data && data.session && data.session.refresh_token;
    if (rt) { localStorage.setItem(key, rt); return true; }
  } catch (_) {}
  return false;
}

async function _dioLoginWithToken(key) {
  const rt = localStorage.getItem(key);
  if (!rt) return false;
  try {
    const { data, error } = await supabaseClient.auth.refreshSession({ refresh_token: rt });
    if (error || !data || !data.session) { localStorage.removeItem(key); return false; }
    // نیا token محفوظ (پرانا استعمال ہو چکا)
    if (data.session.refresh_token) localStorage.setItem(key, data.session.refresh_token);
    currentUser = data.session.user;
    await _loadOfficerProfile();
    return true;
  } catch (_) { localStorage.removeItem(key); return false; }
}
window._dioSaveAuthToken  = _dioSaveAuthToken;
window._dioLoginWithToken = _dioLoginWithToken;


async function doLogin() {
  const email = document.getElementById('login-email')?.value.trim();
  const pass  = document.getElementById('login-password')?.value;
  if (!email||!pass) { showToast('⚠️ ای میل اور پاسورڈ ضروری ہے','error'); return; }

  // ── Failed-login lockout (UX ONLY — NOT a security control) ──────────────
  // SECURITY NOTE (Fix 3): Yeh localStorage-based lockout sirf user-experience
  // ke liye hai (barishtakna galat koshishon par saaf feedback). Ise bypass
  // karna aasan hai (localStorage clear karke), is liye YEH SECURITY NAHI hai.
  // Asal brute-force protection Supabase Auth server-side rate-limiting deti
  // hai (signInWithPassword par per-IP / per-account throttling) — wahi asal
  // control hai jis par bharosa kiya jata hai. Client lockout sirf uska
  // dostana front-end hai.
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
      try { await _dioSaveAuthToken('dio_bio_rt'); localStorage.removeItem('dio_biometric_token'); } catch(_) {}
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
    // Track failed attempts (UX-only — see SECURITY NOTE above; real throttling
    // is Supabase Auth server-side). This just gives friendly local feedback.
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


// ── افسر کا ریکارڈ نہ ملے تو صاف پیغام (خاموش ناکامی نہیں) ──

function _dioShowNoProfile(email, uid) {
  if (document.getElementById('dio-noprofile')) return;
  const d = document.createElement('div');
  d.id = 'dio-noprofile';
  d.style.cssText =
    'position:fixed;inset:0;z-index:2147483647;background:rgba(8,15,26,0.96);color:#fff;' +
    "display:flex;align-items:center;justify-content:center;padding:20px;direction:rtl;" +
    "font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;";
  d.innerHTML = `
    <div style="max-width:560px;background:#0f2136;border:1px solid #2a4a6b;border-radius:14px;padding:22px;">
      <div style="font-size:19px;font-weight:800;margin-bottom:10px;">⚠️ افسر کا ریکارڈ نہیں ملا</div>
      <div style="font-size:15px;line-height:1.9;color:#cfe0f0;">
        آپ کا لاگ اِن تو کامیاب ہے، مگر اس اکاؤنٹ کے ساتھ کوئی <b>افسر پروفائل</b> منسلک نہیں۔
        اسی وجہ سے مقدمات، دستاویزات وغیرہ محفوظ نہیں ہو رہے۔
      </div>
      <div style="margin:14px 0;padding:10px 12px;background:#08182a;border-radius:8px;
                  font-family:monospace;font-size:12px;direction:ltr;text-align:left;color:#9fc6e8;">
        ${email || ''}<br>${uid || ''}
      </div>
      <div style="font-size:14px;line-height:1.9;color:#cfe0f0;">
        اگر یہ آپ کا اصل اکاؤنٹ نہیں تو <b>لاگ آؤٹ</b> کر کے درست ای میل سے لاگ اِن کریں۔
      </div>
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button onclick="doLogout()" style="flex:1;padding:10px;border:none;border-radius:8px;
                background:#2563eb;color:#fff;font-weight:700;cursor:pointer;font-family:inherit;font-size:15px;">
          🚪 لاگ آؤٹ</button>
        <button onclick="document.getElementById('dio-noprofile').remove()"
                style="padding:10px 16px;border:1px solid #2a4a6b;border-radius:8px;background:transparent;
                       color:#cfe0f0;cursor:pointer;font-family:inherit;font-size:15px;">بند کریں</button>
      </div>
    </div>`;
  document.body.appendChild(d);
}
window._dioShowNoProfile = _dioShowNoProfile;


async function _loadOfficerProfile() {
  // currentUser set na ho to profile load mat karo (crash se bachao)
  if (!currentUser || !currentUser.id) return;
  try {
    const { data, error } = await supabaseClient.from('officers')
      .select('*').eq('user_id', currentUser.id).maybeSingle();
    // AFSAR ka record hi mojood na ho → har cheez par 403 aata hai.
    // Khamoshi se nakaam hone ki bajaye SAAF paighaam do.
    if (!data && !error) {
      currentOfficer = null;
      try {
        _dioShowNoProfile(currentUser.email || '', currentUser.id);
      } catch(_) {}
      return;
    }
    if (data) {
      currentOfficer = data;
      // Cache for offline use
      try { localStorage.setItem('dio_officer_cache', JSON.stringify(data)); } catch(_) {}
      // Save session to IndexedDB so app opens offline next time
      try { if (currentUser && currentUser.id && typeof offlineStore !== 'undefined' && offlineStore.saveSession) offlineStore.saveSession(currentUser, data); } catch(_) {}
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
  // SECURITY: is browser session ka nishan. sessionStorage browser band hote hi
  // khud mit jata hai — is liye app dobara kholne par password lazmi hoga.
  try { sessionStorage.setItem('dio_sess_active', '1'); } catch(_) {}
  const ls=document.getElementById('login-screen'), app=document.getElementById('main-app');
  ls.style.transition='opacity 0.4s'; ls.style.opacity='0';
  setTimeout(()=>{ ls.style.display='none'; app.style.display='flex'; setLoginLoading(false); initApp(); },400);
  resetSessionTimer();
  // Show onboarding for first-time users
  setTimeout(()=>{ if(typeof _maybeShowOnboarding==='function') _maybeShowOnboarding(); }, 1200);
  // Offer PIN setup (optional, once)
  if (typeof maybeSetupPin === 'function') maybeSetupPin();
}

// ── ONBOARDING WALKTHROUGH (S6) ───────────────────────────────

function _maybeShowOnboarding() {
  // Only show once per device
  if (localStorage.getItem('dio_onboarded') === 'yes') return;
  _showOnboarding();
}

const _ONBOARD_STEPS = [
  { icon:'🛡️', title:'خوش آمدید — Digital IO', text:'یہ ایک محفوظ، تیز اور آسان پیپرلیس کیس مینجمنٹ ایپ ہے۔ آئیے 4 آسان قدموں میں کام شروع کرنے کا طریقہ دیکھیں۔' },
  { icon:'📁', title:'قدم 1 — نیا مقدمہ بنائیں', text:'"میرے مقدمات" کھولیں اور "+ نیا اندراج" پر دبائیں۔ FIR نمبر، مدعی، دفعات اور صورتحال درج کریں۔ یہی آپ کے ہر کام کی بنیاد ہے۔' },
  { icon:'📋', title:'قدم 2 — مقدمہ کھولیں', text:'کسی بھی مقدمے پر دبائیں تو اس کا ورک سپیس کھل جائے گا — یہاں FIR متن، ملزمان، گواہان، ضمنی، رپورٹ 173، CDR/IMEI اور CRO سب موجود ہیں۔' },
  { icon:'✍️', title:'قدم 3 — دستاویز بھریں اور پرنٹ کریں', text:'جو دستاویز چاہیے اسے کھولیں، خانے بھریں (بہت سا ڈیٹا خودکار بھر جاتا ہے)، پھر 🖨️ پرنٹ دبائیں۔ آواز سے لکھنے کے لیے 🎙️ بٹن استعمال کریں۔' },
  { icon:'⚙️', title:'تیار ہیں!', text:'اوپر SHO/DSP کے نام ایک بار شامل کر لیں — وہ تمام رپورٹس میں خودبخود آ جائیں گے۔ کسی بھی وقت 🔧 اوزار سے مزید سہولیات حاصل کریں۔ اللہ آپ کے کام میں آسانی فرمائے۔' },
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
  // Clear cached session + any app-lock state so login screen shows
  try { localStorage.removeItem('dio_officer_cache'); } catch(_) {}
  try { localStorage.removeItem('digital_io_locked'); } catch(_) {}
  const ov = document.getElementById('dio-pin-overlay'); if (ov) ov.remove();
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

  // PIN bilkul set hi nahi hua
  if (!savedPin) {
    showToast('⚠️ پہلے پاسورڈ سے لاگ ان کر کے PIN سیٹ کریں (ترتیبات میں)', 'warn', 5000);
    _pinValue = ''; _renderPinDots();
    setLoginMethod('password', document.querySelectorAll('.login-method')[0]);
    return;
  }

  // Galat PIN
  if (_pinValue !== savedPin) {
    showToast('❌ غلط PIN', 'error');
    _pinValue = ''; _renderPinDots();
    return;
  }

  // PIN theek — ab refresh-token se login (password kahin mehfooz nahi)
  _pinValue = ''; _renderPinDots();
  setLoginLoading(true);
  const ok = await _dioLoginWithToken('dio_pin_rt');
  if (ok) { loginSuccess(); return; }

  // Token khatam ho gaya ya mojood nahi → aik dafa password se login
  setLoginLoading(false);
  showToast('⚠️ سیشن ختم ہو گیا — ایک بار پاسورڈ سے لاگ ان کریں', 'warn', 5000);
  if (savedEmail) { const el = document.getElementById('login-email'); if (el) el.value = savedEmail; }
  setLoginMethod('password', document.querySelectorAll('.login-method')[0]);
}


// PIN set ho to login screen khud PIN panel par khule (bar bar password na maange)

function _dioDefaultLoginPanel() {
  try {
    if (localStorage.getItem('dio_pin') && localStorage.getItem('dio_pin_token')) {
      const pinBtn = document.querySelectorAll('.login-method')[1];  // PIN button
      if (pinBtn && typeof setLoginMethod === 'function') setLoginMethod('pin', pinBtn);
    }
  } catch(_) {}
}
window._dioDefaultLoginPanel = _dioDefaultLoginPanel;


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


async function _savePin() {
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

  // Pehle password tasdeeq karo — warna galat password mehfooz ho kar
  // PIN login hamesha nakaam karta rahega
  try {
    const { error: vErr } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
    if (vErr) { showToast('❌ موجودہ پاسورڈ غلط ہے', 'error'); return; }
  } catch(_) {}

  try {
    localStorage.setItem('dio_pin', pin);
    localStorage.setItem('dio_pin_email', email);
    // پاسورڈ نہیں — صرف refresh-token (محدود مدت، پاسورڈ ظاہر نہیں کرتا)
    await _dioSaveAuthToken('dio_pin_rt');
    try { localStorage.removeItem('dio_pin_token'); } catch(_) {}
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

// Auto-format CNIC as 00000-0000000-0

function _formatCnic(input) {
  let d = (input.value || '').replace(/\D/g, '').slice(0, 13);
  let out = d;
  if (d.length > 5) out = d.slice(0,5) + '-' + d.slice(5);
  if (d.length > 12) out = d.slice(0,5) + '-' + d.slice(5,12) + '-' + d.slice(12);
  input.value = out;
}
window._formatCnic = _formatCnic;


async function submitRegistration() {
  const name  = document.getElementById('reg-name')?.value.trim();
  const email = document.getElementById('reg-email')?.value.trim();
  const pass  = document.getElementById('reg-password')?.value;
  const badge = document.getElementById('reg-badge')?.value.trim();
  const station=document.getElementById('reg-station')?.value.trim();
  const district=document.getElementById('reg-district')?.value.trim();
  const desig = document.getElementById('reg-designation')?.value.trim();
  const cnic = document.getElementById('reg-cnic')?.value.trim();
  if(!name||!email||!pass){showToast('⚠️ تمام ضروری خانے بھریں','error');return;}
  if(pass.length<8){showToast('⚠️ پاسورڈ کم از کم 8 حروف کا ہو','error');return;}
  if(cnic && !/^\d{5}-\d{7}-\d$/.test(cnic)){showToast('⚠️ شناختی کارڈ نمبر کا فارمیٹ درست نہیں (00000-0000000-0)','error');return;}
  try {
    const{data,error}=await supabaseClient.auth.signUp({email,password:pass,options:{data:{full_name:name}}});
    if(error)throw error;
    if(data.user){
      // Build officer record (omit email/cnic if column doesn't exist)
      const rec={user_id:data.user.id,full_name:name,badge_number:badge,designation:desig,station,district,role:'officer',is_approved:false};
      if(cnic) rec.cnic = cnic;
      let{error:insErr}=await supabaseClient.from('officers').insert({...rec,email});
      // If email column doesn't exist, retry without it
      if(insErr && insErr.message && insErr.message.toLowerCase().includes('email')){
        const r2=await supabaseClient.from('officers').insert(rec);
        insErr=r2.error;
      }
      // If cnic column doesn't exist, retry without it
      if(insErr && insErr.message && insErr.message.toLowerCase().includes('cnic')){
        delete rec.cnic;
        const r3=await supabaseClient.from('officers').insert({...rec,email});
        insErr=r3.error;
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
const SESSION_TIMEOUT = 30 * 60 * 1000;       // 30 minutes inactivity (Priority 1A)
const SESSION_WARN_AT = 29 * 60 * 1000;       // warn at 29 min

function resetSessionTimer() {
  // App lock DISABLED — no session timeout, no PIN lock.
  clearTimeout(_sessionTimer);
  clearTimeout(_sessionWarnTimer);
}
// ── PIN LOCK SCREEN (Priority 1B) ─────────────────────────────
let _pinFailedAttempts = 0;
function initBackupSystem() {
  const t = localStorage.getItem('dio_gdrive_token');
  if(t) googleDriveToken=t;
}
function triggerBackup(src) { localStorage.setItem('dio_last_backup_source',src||'auto'); }

// (listeners kept but harmless — they just clear timers)
document.addEventListener('click', resetSessionTimer);
document.addEventListener('keypress', resetSessionTimer);
document.addEventListener('touchstart', resetSessionTimer);


function _hashPin(pin) { try { return btoa('dio_'+pin+'_lock'); } catch(_) { return pin; } }


function lockApp() {
  // App lock DISABLED — never lock.
  return;
}
window.lockApp = lockApp;


function _showPinScreen(mode) {
  // mode: 'set' (first time) or 'unlock'
  const isSet = mode === 'set';
  const ov = document.createElement('div');
  ov.id = 'pin-lock-overlay';
  ov.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:99999;background:var(--bg-primary,#0f1420);display:flex;flex-direction:column;align-items:center;justify-content:center;direction:rtl;';
  ov.innerHTML = `
    <div style="font-size:40px;margin-bottom:8px;">🛡️</div>
    <div style="font-size:22px;font-weight:800;color:var(--text-primary,#fff);margin-bottom:4px;">Digital IO</div>
    <div id="pin-prompt" style="font-size:15px;color:var(--text-secondary,#aaa);margin-bottom:20px;font-family:'Jameel Noori Nastaleeq',serif;">${isSet?'نیا PIN مقرر کریں (4 ہندسے)':'PIN درج کریں'}</div>
    <input id="pin-input" type="password" inputmode="numeric" maxlength="4" autocomplete="off"
      style="width:160px;font-size:28px;text-align:center;letter-spacing:12px;padding:10px;border:2px solid var(--accent,#2563eb);border-radius:12px;background:var(--bg-card,#1a2030);color:var(--text-primary,#fff);outline:none;">
    <div id="pin-msg" style="font-size:13px;color:#e0524d;min-height:18px;margin-top:10px;font-family:'Jameel Noori Nastaleeq',serif;"></div>
    <button id="pin-submit" class="btn btn-primary" style="margin-top:8px;padding:10px 28px;">${isSet?'محفوظ کریں':'کھولیں'}</button>
    ${!isSet?'<button id="pin-logout" style="margin-top:14px;background:none;border:none;color:var(--text-muted,#888);font-size:13px;cursor:pointer;font-family:\'Jameel Noori Nastaleeq\',serif;">لاگ آؤٹ کریں</button>':''}
  `;
  document.body.appendChild(ov);
  const input = ov.querySelector('#pin-input');
  const msg = ov.querySelector('#pin-msg');
  input.focus();

  const submit = () => {
    const pin = (input.value||'').trim();
    if (!/^\d{4}$/.test(pin)) { msg.textContent = '4 ہندسوں کا PIN درج کریں'; return; }
    if (isSet) {
      localStorage.setItem('digital_io_pin_hash', _hashPin(pin));
      ov.remove();
      showToast('✅ PIN مقرر ہو گیا', 'success');
    } else {
      if (_hashPin(pin) === localStorage.getItem('digital_io_pin_hash')) {
        _pinFailedAttempts = 0;
        ov.remove();
        resetSessionTimer();
      } else {
        _pinFailedAttempts++;
        if (_pinFailedAttempts >= 5) { ov.remove(); showToast('🚫 5 غلط کوششیں — لاگ آؤٹ','error'); doLogout(); return; }
        msg.textContent = `غلط PIN (${5-_pinFailedAttempts} کوششیں باقی)`;
        input.value = '';
      }
    }
  };
  ov.querySelector('#pin-submit').onclick = submit;
  input.onkeydown = (e) => { if (e.key === 'Enter') submit(); };
  const lo = ov.querySelector('#pin-logout');
  if (lo) lo.onclick = () => { ov.remove(); doLogout(); };
}

// PIN setup DISABLED (app lock removed)
window.maybeSetupPin = function() { return; };

function _disabledPinSetup() {
  if (!currentUser) return;
  if (localStorage.getItem('digital_io_pin_hash')) return;
  if (localStorage.getItem('dio_pin_declined') === 'yes') return;
  // gentle prompt, not forced
  setTimeout(() => {
    if (confirm('کیا آپ ایپ کے تحفظ کے لیے 4 ہندسوں کا PIN مقرر کرنا چاہتے ہیں؟ (غیر فعالی پر ایپ مقفل ہو جائے گی)')) {
      _showPinScreen('set');
    } else {
      localStorage.setItem('dio_pin_declined', 'yes');
    }
  }, 2000);
};

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

// ── CHECK SUPABASE SESSION ON LOAD ────────────────────────────
window.addEventListener('load', async function() {
  // OFFLINE: don't wait for Supabase — restore from cached session immediately
  if (!navigator.onLine) {
    try {
      let sess = null;
      if (typeof offlineStore !== 'undefined' && offlineStore.getSession) {
        sess = await offlineStore.getSession();
      }
      // Fallback: localStorage-cached officer
      const cachedOfficer = sess?.officer || JSON.parse(localStorage.getItem('dio_officer_cache') || 'null');
      // Wahi usool offline par bhi — naya browser session → login lazmi
      const sameSessionOff = (() => { try { return sessionStorage.getItem('dio_sess_active') === '1'; } catch(_) { return false; } })();
      if (cachedOfficer && sameSessionOff) {
        currentOfficer = cachedOfficer;
        currentUser = sess?.user || { id: cachedOfficer.user_id };
        loginSuccess();
        return;
      }
    } catch(_) {}
    // No cached session — show login with an offline note
    try { setLoginLoading(false); } catch(_) {}
    try { _dioDefaultLoginPanel(); } catch(_) {}
    showToast('📴 آف لائن — پہلے ایک بار آن لائن لاگ اِن کریں', 'info');
    return;
  }

  // ONLINE: session check — magar SIRF usi browser session mein auto-login.
  // ═══ SECURITY FIX ═══
  // Pehle Supabase ka mehfooz session milte hi app KHUD-BAKHUD khul jata tha,
  // chahe browser band kar ke dobara khola gaya ho — yani koi bhi shakhs app
  // khol kar bina password andar aa sakta tha. Ab agar yeh naya browser session
  // hai to session khatam kar ke login screen dikhate hain.
  try {
    const sameSession = (() => { try { return sessionStorage.getItem('dio_sess_active') === '1'; } catch(_) { return false; } })();
    const { data:{ session } } = await supabaseClient.auth.getSession();
    if (session?.user) {
      if (!sameSession) {
        // Naya browser session → password lazmi
        try { await supabaseClient.auth.signOut(); } catch(_) {}
        currentUser = null; currentOfficer = null;
        try { setLoginLoading(false); } catch(_) {}
        try { _dioDefaultLoginPanel(); } catch(_) {}
        return;
      }
      currentUser = session.user;
      await _loadOfficerProfile();
      loginSuccess();
    }
  } catch(_) {}
});


supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event==='SIGNED_OUT') {
    currentUser=null; currentOfficer=null;
    try { sessionStorage.removeItem('dio_sess_active'); } catch(_) {}
  }
});

