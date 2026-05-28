// ═══════════════════════════════════════════════════
//  DIGITAL IO — AUTHENTICATION SYSTEM
// ═══════════════════════════════════════════════════

let currentUser = null;
let currentOfficer = null;
let currentRole = 'officer';
let sessionTimer = null;
let pinBuffer = '';
let loginAttempts = 0;
let lockoutTimer = null;

// ── Login Method Switch ──
function setLoginMethod(method, el) {
  document.querySelectorAll('.login-method').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('panel-password').style.display = method === 'password' ? 'block' : 'none';
  document.getElementById('panel-pin').style.display = method === 'pin' ? 'block' : 'none';
  document.getElementById('panel-biometric').style.display = method === 'biometric' ? 'block' : 'none';
  pinBuffer = '';
  updatePinDots();
}

// ── Password Login ──
async function doLogin() {
  // Check lockout
  const lockoutUntil = localStorage.getItem('dio_lockout_until');
  if (lockoutUntil && Date.now() < parseInt(lockoutUntil)) {
    const mins = Math.ceil((parseInt(lockoutUntil) - Date.now()) / 60000);
    showLoginError(`⚠️ Account locked. Try again in ${mins} minute(s).`);
    return;
  }

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showLoginError('⚠️ Please enter email and password.');
    return;
  }
  if (!isValidEmail(email)) {
    showLoginError('⚠️ Please enter a valid email address.');
    return;
  }

  setLoginLoading(true);
  hideLoginError();

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
      loginAttempts++;
      localStorage.setItem('dio_login_attempts', loginAttempts);

      if (loginAttempts >= APP_CONFIG.maxLoginAttempts) {
        const lockUntil = Date.now() + APP_CONFIG.lockoutDuration;
        localStorage.setItem('dio_lockout_until', lockUntil);
        loginAttempts = 0;
        localStorage.setItem('dio_login_attempts', 0);
        showLoginError(`🔒 Too many failed attempts. Account locked for 30 minutes.`);
      } else {
        const remaining = APP_CONFIG.maxLoginAttempts - loginAttempts;
        showLoginError(`❌ Incorrect email or password. ${remaining} attempt(s) remaining.`);
      }
      setLoginLoading(false);
      return;
    }

    // Success
    loginAttempts = 0;
    localStorage.setItem('dio_login_attempts', 0);
    localStorage.removeItem('dio_lockout_until');

    currentUser = data.user;
    await loadOfficerProfile();
    await loginSuccess();

  } catch (err) {
    showLoginError('⚠️ Connection error. Please check your internet and try again.');
    setLoginLoading(false);
  }
}

// ── Load Officer Profile ──
async function loadOfficerProfile() {
  try {
    const { data: officer } = await supabaseClient
      .from('officers')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();

    if (officer) {
      currentOfficer = officer;
    }

    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .single();

    if (roleData) currentRole = roleData.role;

  } catch (err) {
    console.log('Profile load error:', err);
  }
}

// ── Login Success ──
async function loginSuccess() {
  const loginScreen = document.getElementById('login-screen');
  const mainApp = document.getElementById('main-app');

  // Fade out login
  loginScreen.style.transition = 'opacity 0.4s';
  loginScreen.style.opacity = '0';

  setTimeout(() => {
    loginScreen.style.display = 'none';
    mainApp.style.display = 'flex';
    setLoginLoading(false);
    initApp();
  }, 400);

  // Start session timeout
  resetSessionTimer();
}

// ── Session Timeout ──
function resetSessionTimer() {
  clearTimeout(sessionTimer);
  sessionTimer = setTimeout(() => {
    showToast('⏰ Session expired due to inactivity. Please log in again.', 'error');
    setTimeout(doLogout, 2000);
  }, APP_CONFIG.sessionTimeout);
}

// Reset timer on any user activity
document.addEventListener('mousemove', () => { if (currentUser) resetSessionTimer(); });
document.addEventListener('keypress', () => { if (currentUser) resetSessionTimer(); });
document.addEventListener('click', () => { if (currentUser) resetSessionTimer(); });

// ── Logout ──
async function doLogout() {
  clearTimeout(sessionTimer);
  await supabaseClient.auth.signOut();
  currentUser = null;
  currentOfficer = null;
  currentRole = 'officer';

  const mainApp = document.getElementById('main-app');
  const loginScreen = document.getElementById('login-screen');

  mainApp.style.display = 'none';
  loginScreen.style.display = 'flex';
  loginScreen.style.opacity = '1';
  document.getElementById('login-password').value = '';
  showToast('👋 Signed out successfully.');
}

// ── PIN Login ──
function pinPress(digit) {
  if (pinBuffer.length >= 6) return;
  pinBuffer += digit;
  updatePinDots();

  if (pinBuffer.length === 6) {
    setTimeout(verifyPin, 200);
  }
}

function pinBackspace() {
  pinBuffer = pinBuffer.slice(0, -1);
  updatePinDots();
}

function updatePinDots() {
  for (let i = 0; i < 6; i++) {
    const dot = document.getElementById('pd' + i);
    if (dot) dot.classList.toggle('filled', i < pinBuffer.length);
  }
}

async function verifyPin() {
  const storedPin = localStorage.getItem('dio_pin');
  const storedEmail = localStorage.getItem('dio_pin_email');
  const storedPassword = localStorage.getItem('dio_pin_password');

  if (!storedPin || pinBuffer !== storedPin) {
    showLoginError('❌ Incorrect PIN. Please try again.');
    pinBuffer = '';
    updatePinDots();
    return;
  }

  // Use stored credentials to login
  document.getElementById('login-email').value = storedEmail || '';
  document.getElementById('login-password').value = storedPassword || '';
  pinBuffer = '';
  updatePinDots();

  if (storedEmail && storedPassword) {
    await doLogin();
  }
}

// ── Biometric ──
async function doBiometric() {
  const ring = document.getElementById('bio-ring');

  if (!window.PublicKeyCredential) {
    showLoginError('⚠️ Biometric authentication not supported on this device.');
    return;
  }

  ring.classList.add('scanning');
  showToast('🫆 Scanning biometric...');

  try {
    // Use Web Authentication API
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(32),
        timeout: 60000,
        userVerification: 'required',
      }
    });

    if (credential) {
      ring.classList.remove('scanning');
      showToast('✅ Biometric verified!');
      // Use stored credentials
      const storedEmail = localStorage.getItem('dio_bio_email');
      const storedPassword = localStorage.getItem('dio_bio_password');
      if (storedEmail && storedPassword) {
        document.getElementById('login-email').value = storedEmail;
        document.getElementById('login-password').value = storedPassword;
        await doLogin();
      }
    }
  } catch (err) {
    ring.classList.remove('scanning');
    showLoginError('⚠️ Biometric verification failed. Use password instead.');
  }
}

// ── Registration ──
function showRegister() {
  document.getElementById('register-modal').style.display = 'flex';
}
function hideRegister() {
  document.getElementById('register-modal').style.display = 'none';
}

async function submitRegistration() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const badge = document.getElementById('reg-badge').value.trim();
  const station = document.getElementById('reg-station').value.trim();
  const district = document.getElementById('reg-district').value.trim();
  const password = document.getElementById('reg-password').value;

  if (!name || !email || !badge || !station || !password) {
    showToast('⚠️ Please fill in all required fields.', 'error');
    return;
  }
  if (!isValidEmail(email)) {
    showToast('⚠️ Invalid email address.', 'error');
    return;
  }
  if (password.length < 8) {
    showToast('⚠️ Password must be at least 8 characters.', 'error');
    return;
  }

  try {
    // Sign up user
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          badge_number: badge,
          station: station,
          district: district,
        }
      }
    });

    if (error) {
      showToast('❌ Registration failed: ' + error.message, 'error');
      return;
    }

    // Create officer profile (pending admin approval)
    if (data.user) {
      await supabaseClient.from('officers').insert({
        user_id: data.user.id,
        full_name: name,
        badge_number: badge,
        station: station,
        district: district,
      });

      await supabaseClient.from('user_roles').insert({
        user_id: data.user.id,
        role: 'officer',
      });
    }

    hideRegister();
    showToast('✅ Registration submitted! Please check your email to verify your account. Admin approval required before first login.', 'success');

  } catch (err) {
    showToast('⚠️ Error: ' + err.message, 'error');
  }
}

// ── Forgot Password ──
let generatedOTP = '';

function showForgotPassword() {
  document.getElementById('forgot-modal').style.display = 'flex';
  document.getElementById('forgot-step1').style.display = 'block';
  document.getElementById('forgot-step2').style.display = 'none';
  document.getElementById('forgot-step3').style.display = 'none';
}
function hideForgotModal() {
  document.getElementById('forgot-modal').style.display = 'none';
}

async function sendOTP() {
  const email = document.getElementById('forgot-email').value.trim();
  if (!email || !isValidEmail(email)) {
    showToast('⚠️ Enter a valid email address.', 'error');
    return;
  }

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password',
  });

  if (error) {
    showToast('❌ Error: ' + error.message, 'error');
    return;
  }

  document.getElementById('forgot-step1').style.display = 'none';
  document.getElementById('forgot-step2').style.display = 'block';
  showToast('📧 Password reset email sent. Check your inbox.', 'success');
}

function otpNext(idx) {
  const val = document.getElementById('otp' + idx).value;
  if (val && idx < 5) document.getElementById('otp' + (idx + 1)).focus();
}

function verifyOTP() {
  document.getElementById('forgot-step2').style.display = 'none';
  document.getElementById('forgot-step3').style.display = 'block';
}

async function resetPassword() {
  const p1 = document.getElementById('new-pass1').value;
  const p2 = document.getElementById('new-pass2').value;

  if (!p1 || p1.length < 8) { showToast('⚠️ Password must be at least 8 characters.', 'error'); return; }
  if (p1 !== p2) { showToast('❌ Passwords do not match.', 'error'); return; }

  const { error } = await supabaseClient.auth.updateUser({ password: p1 });
  if (error) { showToast('❌ Error: ' + error.message, 'error'); return; }

  hideForgotModal();
  showToast('✅ Password reset successfully! Please log in with your new password.', 'success');
}

// ── Helpers ──
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showLoginError(msg) {
  const el = document.getElementById('login-error');
  el.textContent = msg;
  el.style.display = 'block';
}
function hideLoginError() {
  document.getElementById('login-error').style.display = 'none';
}

function setLoginLoading(loading) {
  const btn = document.getElementById('login-submit-btn');
  const text = document.getElementById('login-btn-text');
  const loader = document.getElementById('login-btn-loader');
  if (btn) btn.disabled = loading;
  if (text) text.style.display = loading ? 'none' : 'inline';
  if (loader) loader.style.display = loading ? 'inline' : 'none';
}

function togglePasswordVisibility() {
  const inp = document.getElementById('login-password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

// ── Check existing session on load ──
async function checkExistingSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (session) {
    currentUser = session.user;
    await loadOfficerProfile();
    await loginSuccess();
  } else {
    // Load officer name for display if stored
    const storedName = localStorage.getItem('dio_officer_name');
    if (storedName) {
      document.getElementById('login-officer-name').textContent = storedName;
    } else {
      document.getElementById('login-officer-name').textContent = 'Welcome, Officer';
    }
    document.getElementById('login-officer-role').textContent = 'Digital IO — Secure Portal';
  }
}

// Initialize login attempts from storage
loginAttempts = parseInt(localStorage.getItem('dio_login_attempts') || '0');

console.log('✅ Auth System Loaded');
