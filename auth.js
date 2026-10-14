/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — لاگ اِن / PIN / بایومیٹرک / سیشن / رجسٹریشن
   (پہلے یہ سب app-core.js میں تھا — وہ فائل 2100 سطروں کی ہو
    گئی تھی، اسی لیے تبدیلی کرتے وقت غلط جگہ لگ جاتی تھی۔)
   AHEM: یہ فائل app-core.js کے BAAD لوڈ ہوتی ہے۔
   ═══════════════════════════════════════════════════════════ */

// ══ ٹوکن انکرپشن at rest — AES-GCM، کلید IndexedDB میں non-extractable ══════
//   refresh-token اب localStorage میں سادہ نہیں بلکہ انکرپٹڈ محفوظ ہوتا ہے۔
//   کلید IndexedDB میں غیر قابلِ اخراج (JS سے نکالی نہیں جا سکتی)۔ پرانا سادہ
//   ٹوکن خودکار پڑھ کر اگلی بار انکرپٹڈ محفوظ (migration)۔ IndexedDB/crypto نہ
//   ہو تو محفوظ طور پر پرانے رویے (سادہ) پر واپس — لاگ اِن نہیں ٹوٹتا۔
let _dioKeyP = null;
function _dioIDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('dio_sec', 1);
    r.onupgradeneeded = () => { try { r.result.createObjectStore('keys'); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
function _dioIDBget(db, k) { return new Promise((res, rej) => { const t = db.transaction('keys', 'readonly').objectStore('keys').get(k); t.onsuccess = () => res(t.result); t.onerror = () => rej(t.error); }); }
function _dioIDBput(db, k, v) { return new Promise((res, rej) => { const t = db.transaction('keys', 'readwrite').objectStore('keys').put(v, k); t.onsuccess = () => res(); t.onerror = () => rej(t.error); }); }
async function _dioCryptoKey() {
  if (_dioKeyP) return _dioKeyP;
  _dioKeyP = (async () => {
    const db = await _dioIDB();
    let key = await _dioIDBget(db, 'tok');
    if (!key) { key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); await _dioIDBput(db, 'tok', key); }
    return key;
  })();
  return _dioKeyP;
}
const _dioB64 = (u) => btoa(String.fromCharCode.apply(null, new Uint8Array(u)));
const _dioUnB64 = (s) => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function _dioEnc(plain) {
  try {
    const key = await _dioCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain));
    return 'enc1$' + _dioB64(iv) + '$' + _dioB64(ct);
  } catch (_) { return plain; }   // انکرپشن نہ ہو سکے تو سادہ (پرانا رویہ) — لاگ اِن نہ ٹوٹے
}
async function _dioDec(stored) {
  if (!stored) return stored;
  if (stored.indexOf('enc1$') !== 0) return stored;   // legacy سادہ ٹوکن
  try {
    const key = await _dioCryptoKey();
    const p = stored.split('$');
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: _dioUnB64(p[1]) }, key, _dioUnB64(p[2]));
    return new TextDecoder().decode(pt);
  } catch (_) { return null; }   // decrypt ناکام → null (دوبارہ پاسورڈ لاگ اِن)
}
window._dioEnc = _dioEnc; window._dioDec = _dioDec;

async function _dioSaveAuthToken(key) {
  try {
    const { data } = await supabaseClient.auth.getSession();
    const rt = data && data.session && data.session.refresh_token;
    if (rt) { localStorage.setItem(key, await _dioEnc(rt)); return true; }
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  return false;
}

async function _dioLoginWithToken(key) {
  const stored = localStorage.getItem(key);
  if (!stored) return false;
  const rt = await _dioDec(stored);
  if (!rt) { localStorage.removeItem(key); return false; }   // خراب/ناقابلِ decrypt
  try {
    const { data, error } = await supabaseClient.auth.refreshSession({ refresh_token: rt });
    if (error || !data || !data.session) { localStorage.removeItem(key); return false; }
    // نیا token انکرپٹڈ محفوظ (پرانا استعمال ہو چکا)
    if (data.session.refresh_token) localStorage.setItem(key, await _dioEnc(data.session.refresh_token));
    // v530: log aut (taala) par stopAutoRefresh() hua tha — ab dobara chalu,
    //   warna ghante baad access token expire ho kar sync/save ruk jata
    try { supabaseClient.auth.startAutoRefresh(); } catch (_) { /* best-effort — na ho sake to bhi aage chalo */ }
    currentUser = data.session.user;
    await _loadOfficerProfile();
    // GATE YAHIN — PIN/biometric/token ka HAR raasta isi se guzarta hai.
    // Pehle gate sirf password-login par tha, to mo'attal afsar PIN se
    // seedha andar aa jata tha (PIN default panel bhi hai).
    if (!_dioIsOwner(currentOfficer) &&
        (_dioIsSuspended(currentOfficer) || _dioNotApproved(currentOfficer))) {
      try { await supabaseClient.auth.signOut(); } catch (_) { /* best-effort — na ho sake to bhi aage chalo */ }
      try { await _dioPurgeOnSuspend(); } catch (_) { /* best-effort — na ho sake to bhi aage chalo */ }
      // paigham PEHLE tay karo — neeche currentOfficer null ho jata hai
      var _msg = _dioIsSuspended(currentOfficer)
        ? 'آپ کا اکاؤنٹ معطل ہے۔ ایڈمن سے رابطہ کریں۔'
        : 'آپ کا اکاؤنٹ منظوری کے انتظار میں ہے۔';
      currentUser = null; currentOfficer = null;
      try { showToast(_msg, 'error', 7000); } catch (_) { /* paigham na dikh sake to koi baat nahi */ }
      return false;
    }
    return true;
  } catch (_) { localStorage.removeItem(key); return false; }
}
window._dioSaveAuthToken  = _dioSaveAuthToken;
window._dioLoginWithToken = _dioLoginWithToken;

/* ═══ فوری لاگ اِن (PIN / بایومیٹرک) — token ہمیشہ تازہ (v526) ═══════════
   PEHLE KYUN KAAM NAHI KARTA THA (maidan ki shikayat: "bio active ho jata
   hai magar kaam nahi karta"):
   1) "بایومیٹرک فعال کریں" sirf fingerprint ka credential rakhta tha —
      session token mehfooz HI nahi hota tha.
   2) Fingerprint kamyab hone ke baad code purana `dio_biometric_token`
      (sada password) dhoondta tha jo kab ka hata diya gaya tha — natija:
      "ای میل/پاسورڈ سے لاگ ان کریں". Yani har bar password.
   3) Supabase refresh token aik hi bar chalta hai. App khud har ~1 ghante
      token badalti hai — mehfooz naqal purani ho jati thi. Aur LOG AUT par
      signOut() isi session ko server par mansookh kar deta tha.
   AB: token har tabdeeli par khud-ba-khud taza mehfooz hota hai, aur PIN/
   biometric fa'al hon to log aut "taala" hai (session baqi, token encrypted). */
const _DIO_QUICK = [['dio_pin_rt', 'dio_pin_email'], ['dio_bio_rt', 'dio_biometric_email']];
function _dioSameEmail(a, b) {
  return !!a && !!b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}
function _dioQuickKeysFor(email) {
  try { return _DIO_QUICK.filter(([, ek]) => _dioSameEmail(localStorage.getItem(ek), email)).map(([rk]) => rk); }
  catch (_) { return []; }
}
async function _dioSyncQuickTokens(session) {
  if (!session || !session.refresh_token || !session.user) return;
  const keys = _dioQuickKeysFor(session.user.email);
  for (const k of keys) {
    try { localStorage.setItem(k, await _dioEnc(session.refresh_token)); } catch (_) { if (typeof dioLogError === 'function') dioLogError('quick login: token save nakaam', _); }
  }
}
// Supabase ke session ki storage key (app-core.js ka SUPABASE_URL)
/* global SUPABASE_URL */
function _dioAuthStorageKey() {
  try { return 'sb-' + new URL(SUPABASE_URL).hostname.split('.')[0] + '-auth-token'; }
  catch (_) { return null; }
}
// Log aut ke waqt: PIN/biometric fa'al ho to session server par baqi rakho,
// is aale ki browser storage se hata do. true = taala laga (signOut na karo).
async function _dioDetachForQuickLogin() {
  const email = (typeof currentUser !== 'undefined' && currentUser && currentUser.email) || '';
  if (!_dioQuickKeysFor(email).length) return false;
  const { data } = await supabaseClient.auth.getSession();
  const s = data && data.session;
  if (!s || !s.refresh_token) return false;
  await _dioSyncQuickTokens(s);
  try { supabaseClient.auth.stopAutoRefresh(); } catch (_) { /* best-effort — na ho sake to bhi aage chalo */ }
  const key = _dioAuthStorageKey();
  if (key) {
    try { if (window.dioSecureStorage && window.dioSecureStorage.removeItem) await window.dioSecureStorage.removeItem(key); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    try { localStorage.removeItem(key); } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  }
  return true;
}
// Har token tabdeeli par mehfooz naqal taza (callback me await nahi — Supabase ki hidayat)
try {
  if (supabaseClient && supabaseClient.auth && supabaseClient.auth.onAuthStateChange) {
    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        setTimeout(() => { _dioSyncQuickTokens(session); }, 0);
      }
    });
  }
} catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
window._dioSyncQuickTokens = _dioSyncQuickTokens;

/* ═══ انٹرنیٹ آتے ہی سیشن بحال، پھر sync (v527) ══════════════════════
   Offline login ke baad Supabase ka session nahi hota. Internet aate hi:
   1) offline me likha password (sirf yaaddasht me) se khamosh login, ya
   2) PIN/biometric ka mehfooz token — phir offline andraaj sync.
   Kuch na chale to afsar ko saaf paigham; andraaj is aale par mehfooz rehte hain. */
let _dioPendingReauth = null;
let _dioReauthBusy = false;
async function _dioReauthIfNeeded() {
  if (_dioReauthBusy || !navigator.onLine) return false;
  if (!(typeof currentUser !== 'undefined' && currentUser)) return false;
  _dioReauthBusy = true;
  try {
    try {
      const { data } = await supabaseClient.auth.getSession();
      if (data && data.session) return true;
    } catch (_) { /* parhna na ho sake to pehle wali/khali qadr rahe */ }
    let ok = false;
    if (_dioPendingReauth) {
      try {
        const r = await supabaseClient.auth.signInWithPassword({ email: _dioPendingReauth.email, password: _dioPendingReauth.pass });
        ok = !r.error && !!(r.data && r.data.session);
      } catch (_) { ok = false; }
    }
    if (!ok) {
      for (const k of ['dio_bio_rt', 'dio_pin_rt']) {
        try { if (localStorage.getItem(k) && await _dioLoginWithToken(k)) { ok = true; break; } } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      }
    }
    _dioPendingReauth = null;
    if (ok) {
      try { await _loadOfficerProfile(); } catch (_) { /* parhna na ho sake to pehle wali/khali qadr rahe */ }
      try { if (typeof window._syncOfflineQueue === 'function') window._syncOfflineQueue(); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
      try { if (typeof window.updateBadges === 'function') window.updateBadges(); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
      try { showToast('انٹرنیٹ بحال — sync شروع', 'success', 3000); } catch (_) { /* paigham na dikh sake to koi baat nahi */ }
    } else {
      try { showToast('انٹرنیٹ بحال ہے، مگر sync کے لیے ایک بار پاس ورڈ سے لاگ اِن کریں — آپ کا کام اس آلے پر محفوظ ہے', 'warn', 8000); } catch (_) { /* paigham na dikh sake to koi baat nahi */ }
    }
    return ok;
  } finally { _dioReauthBusy = false; }
}
window._dioReauthIfNeeded = _dioReauthIfNeeded;

// v538: آف لائن لاگ اِن کا ریکارڈ (پاس ورڈ کا PBKDF2 ہیش، پاس ورڈ خود نہیں) —
//   وہی شکل جو doLogin لکھتا ہے۔ پاس ورڈ بدلنے پر بھی یہی چلتا ہے، ورنہ
//   آف لائن صرف پرانا پاس ورڈ چلتا رہتا تھا۔
async function _dioSavePwVerifier(email, pass) {
  try {
    const em = String(email || '').trim().toLowerCase();
    if (!em || !pass) return false;
    const h = await _dioHashPin(pass);
    if (h && h.indexOf('pbkdf2$') === 0) {
      localStorage.setItem('dio_pw_verifier', JSON.stringify({ email: em, hash: h }));
      return true;
    }
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  return false;
}
window._dioSavePwVerifier = _dioSavePwVerifier;
window.addEventListener('online', function () { setTimeout(_dioReauthIfNeeded, 800); });

// ══ PIN ہیشنگ (WebCrypto PBKDF2 + نمک) ══════════════════════════════
//   پرانے سادہ (dio_pin) اور btoa (app-lock) PIN درست داخلے پر خودکار
//   ہیش میں بدل جاتے ہیں (migration)۔ صرف ہیش محفوظ ہوتا ہے، خام PIN نہیں۔
async function _dioHashPin(pin, saltB64) {
  try {
    const enc = new TextEncoder();
    const salt = saltB64
      ? Uint8Array.from(atob(saltB64), c => c.charCodeAt(0))
      : crypto.getRandomValues(new Uint8Array(16));
    const km = await crypto.subtle.importKey('raw', enc.encode(String(pin)), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, km, 256);
    const hex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
    const sb64 = btoa(String.fromCharCode.apply(null, salt));
    return 'pbkdf2$' + sb64 + '$' + hex;
  } catch (_) { return 'plain$' + String(pin); }   // crypto دستیاب نہ ہو (نایاب)
}
// true/false اگر معلوم فارمیٹ ہو؛ null اگر پرانا (legacy) — caller migrate کرے
async function _dioPinMatches(pin, stored) {
  if (!stored) return false;
  if (stored.indexOf('pbkdf2$') === 0) {
    const p = stored.split('$');
    return (await _dioHashPin(pin, p[1])) === stored;
  }
  if (stored.indexOf('plain$') === 0) return ('plain$' + String(pin)) === stored;
  return null;
}
window._dioHashPin = _dioHashPin;
window._dioPinMatches = _dioPinMatches;

// ═══════════════════════════════════════════════════════════════
//  OFFLINE LOGIN — بغیر انٹرنیٹ کے (cached session سے)
//  Jab officer pehle ONLINE login kar chuka ho (session + officer
//  cache ho chuka ho) to internet na hone par PIN/biometric se
//  local tasdeeq ke baad yeh function currentUser/currentOfficer
//  bahaal kar deta hai — koi network call nahi.
// ═══════════════════════════════════════════════════════════════
// ── MO'ATTALI KE MUSHTARIK HELPERS ───────────────────────────────
//  DB column `is_suspended` hai; kuch purane record me `suspended` bhi ho
//  sakta hai — dono dekhte hain taake koi darz na bach jaye.
function _dioIsSuspended(o) {
  if (!o) return false;
  return (o.is_suspended === true || o.is_suspended === 'true' ||
          o.suspended    === true || o.suspended    === 'true');
}
//  Manzoori: sirf `=== true` ko manzoor maano. Pehle `=== false` dekha jata
//  tha, to 'false' (string), 0, ya "f" jaise PostgREST ke rup manzoor ban jate.
function _dioNotApproved(o) {
  if (!o) return true;                       // koi record hi nahi → fail-closed
  if (o.is_approved === undefined || o.is_approved === null) return false;  // column hi nahi
  return !(o.is_approved === true || o.is_approved === 'true' || o.is_approved === 't');
}
window._dioNotApproved = _dioNotApproved;
//  Maalik (superadmin) par mo'attali/subscription kabhi lagu nahi.
function _dioIsOwner(o) {
  return !!(o && o.role === 'superadmin');
}
//  Mo'attal hone par is device se offline daakhle ka raasta band karo,
//  warna afsar internet band kar ke cache se andar aa jata.
async function _dioPurgeOnSuspend() {
  try {
    ['dio_officer_cache','dio_pin_rt','dio_bio_rt','dio_license','dio_sub_cache',
     'dio_biometric_email','dio_biometric_token','dio_err_log','dio_pw_verifier'].forEach(function (k) {
      try { localStorage.removeItem(k); } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
    });
  } catch (_) { /* sirf local cache — na ho sake to bhi aage chalo */ }
  try {
    if (typeof offlineStore !== 'undefined' && offlineStore.clearSession) await offlineStore.clearSession();
  } catch (_) { /* best-effort — na ho sake to bhi aage chalo */ }
}
window._dioIsSuspended = _dioIsSuspended;
window._dioIsOwner = _dioIsOwner;

async function _dioOfflineRestore() {
  try {
    let sess = null;
    if (typeof offlineStore !== 'undefined' && offlineStore.loadSession) {
      try { sess = await offlineStore.loadSession(); } catch (_) { /* parhna na ho sake to pehle wali/khali qadr rahe */ }
    }
    let officer = null, uid = null, email = null;
    if (sess && sess.userId) { uid = sess.userId; email = sess.email; officer = sess.officer || null; }
    if (!officer) {
      try { officer = JSON.parse(localStorage.getItem('dio_officer_cache') || 'null'); } catch (_) { /* sirf local cache — na ho sake to bhi aage chalo */ }
    }
    if (!uid && officer) uid = officer.user_id;
    if (!email && officer) email = officer.email || null;
    if (!uid) return false;                       // koi cached session nahi — offline login mumkin nahi
    // Offline raasta bhi mo'attali check kare — warna afsar internet
    // band kar ke cached session se andar aa jata (gate ka bypass).
    // Fail-CLOSED: officer snapshot hi na ho to offline daakhla mat do —
    // warna mo'attal afsar cache mita kar saaf record bana leta tha.
    if (!officer) { try { await _dioPurgeOnSuspend(); } catch (_) { /* best-effort — na ho sake to bhi aage chalo */ } return false; }
    /* ═══ KHAMI BAND KI GAYI — "malik" ki chhoot sirf ONLINE ═══
       Yeh snapshot `offlineStore` ya `dio_officer_cache` se aata hai, yaani
       AFSAR KE APNE AALE se — usay koi bhi DevTools se badal sakta hai.
       Pehle yahan `_dioIsOwner(officer)` ki chhoot thi: kaafi tha ke koi
       `dio_officer_cache` mein `"role"` ko `superadmin` likh de, aur
       mo'attali/manzoori ka gate poora ka poora chhoot jata.
       Ab OFFLINE raaste par yeh chhoot hai hi nahi — jaanch sab par barabar.
       Asal malik par is ka koi asar nahi: us ka `is_suspended` false aur
       `is_approved` true hota hai, is liye wo waise hi guzar jata hai.
       ONLINE raaste (line ~80) par chhoot barqarar hai, kyunke wahan record
       SEEDHA server se aaya hota hai aur us par bharosa kiya ja sakta hai. */
    if (_dioIsSuspended(officer) || _dioNotApproved(officer)) {
      try { await _dioPurgeOnSuspend(); } catch (_) { /* best-effort — na ho sake to bhi aage chalo */ }
      try { showToast('آپ کا اکاؤنٹ معطل ہے۔ ایڈمن سے رابطہ کریں۔', 'error', 7000); } catch (_) { /* paigham na dikh sake to koi baat nahi */ }
      return false;
    }
    currentUser = { id: uid, email: email || '' };
    currentOfficer = officer;
    try { localStorage.setItem('dio_officer_cache', JSON.stringify(currentOfficer)); } catch (_) { /* sirf local cache — na ho sake to bhi aage chalo */ }
    return true;
  } catch (_) { return false; }
}
window._dioOfflineRestore = _dioOfflineRestore;

// Kya is device par offline login ke liye kuch mojood hai? (cached session)
async function _dioHasOfflineSession() {
  try {
    if (typeof offlineStore !== 'undefined' && offlineStore.loadSession) {
      const s = await offlineStore.loadSession();
      if (s && s.userId) return true;
    }
  } catch (_) { /* parhna na ho sake to pehle wali/khali qadr rahe */ }
  try { return !!JSON.parse(localStorage.getItem('dio_officer_cache') || 'null'); } catch (_) { return false; }
}
window._dioHasOfflineSession = _dioHasOfflineSession;


async function doLogin() {
  const email = document.getElementById('login-email')?.value.trim();
  const pass  = document.getElementById('login-password')?.value;
  if (!email||!pass) { showToast('ای میل اور پاسورڈ ضروری ہے','error'); return; }

  /* ══════════════════════════════════════════════════════════════
     OFFLINE LOGIN — "offline first" ka asal taqaza

     MASLA JO THA: offline daakhle ka SIRF do raaste the — PIN ya
     biometric. Jis afsar ne yeh set na kiye hon (aur app sirf AIK BAAR
     poochti hai — `dio_pin_offered`), us ke liye maidan mein koi raasta
     hi nahi bachta tha: paigham aata tha "pehle internet ke sath login
     kar ke PIN set karein" — jo us waqt mumkin hi nahi hota.

     Ghaur talab baat: ONLINE par yehi afsar BINA kuch type kiye andar
     aa jata hai, kyunke Supabase ka session pehle se mehfooz hota hai.
     Yaani PIN ki shart sirf OFFLINE par lagti thi — wohi aala, wohi
     session, magar net band hote hi daakhla band. Yeh tanasub ghalat tha.

     AB: agar is aale par pehle se session mehfooz hai to offline bhi
     daakhla milta hai — bilkul utna hi jitna ONLINE par milta. PIN ya
     biometric mojood hon to unhi ko tarjeeh (wo aik mazeed taala hain).
     Hifazat ka darja ONLINE se neeche nahi gaya.

     Saath AIK NAYI jaanch: likhi hui ای میل mehfooz session wale afsar
     ki hi honi chahiye — warna koi doosra shakhs apni ای میل daal kar
     is aale par mehfooz afsar ke record mein nahi ghus sakta.
     ══════════════════════════════════════════════════════════════ */
  if (!navigator.onLine) {
    /* v527 — OFFLINE FIRST, ASAL PASSWORD KI JAANCH KE SATH
       Pehle: offline par likha hua password JAANCHA hi nahi jata tha (sirf
       ای میل milaai jati thi) — ya PIN/biometric par bhej diya jata tha.
       Ab: har kamyab ONLINE login par password ka PBKDF2 hash (namak ke
       sath, khud password nahi) is aale par rakha jata hai; offline par
       likha password usi se jaancha jata hai. Durust ho to foran andar,
       aur internet aate hi session khud bahal ho kar sync hota hai. */
    const hasOffline = await _dioHasOfflineSession();
    if (!hasOffline) {
      showToast('آفلائن لاگ اِن دستیاب نہیں — اس آلے پر پہلے ایک بار انٹرنیٹ کے ساتھ لاگ اِن کریں', 'warn', 7000);
      return;
    }
    let _savedEmail = '';
    try {
      const _o = JSON.parse(localStorage.getItem('dio_officer_cache') || 'null');
      _savedEmail = (_o && _o.email) ? String(_o.email).trim().toLowerCase() : '';
    } catch (_) { /* sirf local cache — na ho sake to bhi aage chalo */ }
    let ver = null;
    try { ver = JSON.parse(localStorage.getItem('dio_pw_verifier') || 'null'); } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
    if (!_savedEmail && ver && ver.email) _savedEmail = String(ver.email).toLowerCase();
    if (_savedEmail && _savedEmail !== String(email).trim().toLowerCase()) {
      showToast('یہ آلہ کسی اور افسر کے نام پر محفوظ ہے — آف لائن صرف وہی داخل ہو سکتے ہیں', 'error', 7000);
      return;
    }
    setLoginLoading(true);
    if (ver && ver.hash && _dioSameEmail(ver.email, email)) {
      let ok = false;
      try { ok = (await _dioPinMatches(pass, ver.hash)) === true; } catch (_) { ok = false; }
      if (!ok) {
        setLoginLoading(false);
        showToast('پاس ورڈ غلط ہے', 'error', 5000);
        return;
      }
    } else {
      // Is aale par abhi password ka hash nahi (purana login) — PIN/biometric ho to wahi
      const hasPin = !!localStorage.getItem('dio_pin');
      const hasBio = !!(localStorage.getItem('dio_biometric_cred') && localStorage.getItem('dio_biometric_email'));
      if (hasPin || hasBio) {
        setLoginLoading(false);
        showToast('آپ آفلائن ہیں — ' + (hasPin ? 'PIN' : 'بایومیٹرک') + ' سے لاگ اِن کریں (پاس ورڈ آف لائن ایک بار آن لائن لاگ اِن کے بعد چلے گا)', 'warn', 7000);
        if (hasPin) { const b = document.querySelectorAll('.login-method')[1]; if (b) setLoginMethod('pin', b); }
        else { const b = document.querySelectorAll('.login-method')[2]; if (b) setLoginMethod('biometric', b); }
        return;
      }
    }
    const off = await _dioOfflineRestore();
    setLoginLoading(false);
    if (off) {
      // Sirf YAADDASHT me (storage me nahi) — internet aate hi session bahal karne ke liye
      _dioPendingReauth = { email: String(email).trim(), pass };
      showToast('آفلائن موڈ — انٹرنیٹ آنے پر کام خودبخود sync ہو جائے گا', 'info', 4000);
      loginSuccess();
      return;
    }
    showToast('آفلائن لاگ اِن دستیاب نہیں — اس آلے پر پہلے ایک بار انٹرنیٹ کے ساتھ لاگ اِن کریں', 'warn', 7000);
    return;
  }

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
    showToast(`بہت زیادہ غلط کوششیں — ${mins} منٹ بعد دوبارہ کوشش کریں`, 'error', 5000);
    return;
  }

  setLoginLoading(true);
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({email,password:pass});
    if (error) throw error;
    currentUser = data.user;
    // Clear failed attempts on success
    localStorage.removeItem('dio_login_lock');
    // v527: offline login ke liye password ka PBKDF2 hash (password khud nahi) — pas-e-manzar me
    try {
      const _em = String((data.user && data.user.email) || email).toLowerCase();
      _dioHashPin(pass).then(function (h) {
        if (h && h.indexOf('pbkdf2$') === 0) localStorage.setItem('dio_pw_verifier', JSON.stringify({ email: _em, hash: h }));
      }).catch(function () {});
    } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
    // Biometric/PIN is ای میل کے لیے فعال ہو تو تازہ token محفوظ (v526: chhote-baRe huroof ka farq khatam)
    try {
      if (_dioSameEmail(localStorage.getItem('dio_biometric_email'), (data.user && data.user.email) || email)) {
        await _dioSaveAuthToken('dio_bio_rt'); localStorage.removeItem('dio_biometric_token');
      }
    } catch(_) { if (typeof dioLogError === 'function') dioLogError('biometric: token save nakaam', _); }
    await _loadOfficerProfile();

    // Check if officer is approved (skip for admins/superadmins)
    if (!_dioIsOwner(currentOfficer) && _dioNotApproved(currentOfficer)) {
      await supabaseClient.auth.signOut();
      currentUser = null; currentOfficer = null;
      setLoginLoading(false);
      showToast('آپ کا اکاؤنٹ ابھی منظوری کے انتظار میں ہے۔ ایڈمن سے رابطہ کریں۔', 'warn', 6000);
      return;
    }
    // ── MO'ATTALI KA GATE ─────────────────────────────────────
    // BUG THA: yahan pehle `currentOfficer.suspended` check hota tha,
    // magar DB ka column `is_suspended` hai (admin.js wahi likhta hai) —
    // is liye ye check KABHI chala hi nahi aur mo'attal afsar poori app
    // istemaal kar leta tha. Ab dono naam dekhte hain.
    // Sirf SUPERADMIN (maalik) mustasna — use system kabhi band na kare.
    if (!_dioIsOwner(currentOfficer) && _dioIsSuspended(currentOfficer)) {
      try { await supabaseClient.auth.signOut(); } catch (_) { /* best-effort — na ho sake to bhi aage chalo */ }
      try { await _dioPurgeOnSuspend(); } catch (_) { /* best-effort — na ho sake to bhi aage chalo */ }
      currentUser = null; currentOfficer = null;
      setLoginLoading(false);
      showToast('آپ کا اکاؤنٹ معطل ہے۔ ایڈمن سے رابطہ کریں۔', 'error', 7000);
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
      showToast('5 غلط کوششیں — اکاؤنٹ 5 منٹ کے لیے بند', 'error', 5000);
    } else {
      localStorage.setItem('dio_login_lock', JSON.stringify(lock));
      showToast(`${e.message} (${5-lock.count} کوششیں باقی)`, 'error');
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
      <div style="font-size:19px;font-weight:800;margin-bottom:10px;">افسر کا ریکارڈ نہیں ملا</div>
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
          لاگ آؤٹ</button>
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
      } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      return;
    }
    if (data) {
      currentOfficer = data;
      // Cache for offline use
      try { localStorage.setItem('dio_officer_cache', JSON.stringify(data)); } catch(_) { /* sirf local cache — na ho sake to bhi aage chalo */ }
      // Save session to IndexedDB so app opens offline next time
      try { if (currentUser && currentUser.id && typeof offlineStore !== 'undefined' && offlineStore.saveSession) offlineStore.saveSession(currentUser, data); } catch(_) { if (typeof dioLogError === 'function') dioLogError('offline login: session save nakaam', _); }
    }
  } catch(_) {
    // Offline or error — restore from cache
    try {
      const cached = localStorage.getItem('dio_officer_cache');
      if (cached) currentOfficer = JSON.parse(cached);
    } catch(_) { /* sirf local cache — na ho sake to bhi aage chalo */ }
  }
  if (!currentOfficer) {
    currentOfficer = { user_id:currentUser.id, email:currentUser.email, full_name:currentUser.user_metadata?.full_name||'', station:'', district:'', designation:'', role:'officer' };
  }
  // Restore profile photo from DB so it persists across logins/devices
  if (currentOfficer.profile_photo) {
    try {
      localStorage.setItem('dio_profile_photo', currentOfficer.profile_photo);
      localStorage.setItem('officer_photo_url', currentOfficer.profile_photo);
    } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  } else {
    // DB has no photo — try localStorage fallback
    try {
      const saved = localStorage.getItem('officer_photo_url') || localStorage.getItem('dio_profile_photo');
      if (saved) currentOfficer.profile_photo = saved;
    } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  }
}


function setLoginLoading(v) {
  const btn = document.getElementById('login-btn');
  if (btn) { btn.disabled=v; btn.textContent=v?'لاگ ان ہو رہا ہے...':'لاگ ان'; }
}


async function loginSuccess() {
  // SECURITY: is browser session ka nishan. sessionStorage browser band hote hi
  // khud mit jata hai — is liye app dobara kholne par password lazmi hoga.
  try { sessionStorage.setItem('dio_sess_active', '1'); } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  // v526: taala (quick-login logout) par token ka khud-taaza-karna rok diya jata hai —
  // naye login par dobara chalao, warna ghante baad session expire ho jata.
  try { if (supabaseClient && supabaseClient.auth && supabaseClient.auth.startAutoRefresh) supabaseClient.auth.startAutoRefresh(); } catch(_) { /* best-effort — na ho sake to bhi aage chalo */ }
  // AUDIT — login success (Phase 4B). Ye chalega tab jab currentOfficer set ho jaye.
  // Isliye chhota delay — initApp() mein officer profile fetch ho jata hai.
  try {
    setTimeout(function () {
      try {
        if (window.DIO && DIO.audit) DIO.audit.log('login', 'session', null, {
          metadata: {
            user_agent: (navigator.userAgent || '').slice(0, 120),
            ts: new Date().toISOString()
          }
        });
      } catch (_) { /* audit/custody ka masla asal kaam na roke */ }
    }, 1500);
  } catch (_) { /* audit/custody ka masla asal kaam na roke */ }
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
  { icon:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l7 2.6v5.4c0 4.2-2.9 7.3-7 8.9-4.1-1.6-7-4.7-7-8.9V6.1z"/></svg>', title:'خوش آمدید — Digital IO', text:'یہ ایک محفوظ، تیز اور آسان پیپرلیس کیس مینجمنٹ ایپ ہے۔ آئیے 4 آسان قدموں میں کام شروع کرنے کا طریقہ دیکھیں۔' },
  { icon:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 7.5h6l2 2.5h9V19a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 19z"/></svg>', title:'قدم 1 — نیا مقدمہ بنائیں', text:'"میرے مقدمات" کھولیں اور "+ نیا اندراج" پر دبائیں۔ FIR نمبر، مدعی، دفعات اور صورتحال درج کریں۔ یہی آپ کے ہر کام کی بنیاد ہے۔' },
  { icon:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4h8v3H8z"/><path d="M9 4H6v17h12V4h-3"/><path d="M9 11h6"/><path d="M9 15h6"/></svg>', title:'قدم 2 — مقدمہ کھولیں', text:'کسی بھی مقدمے پر دبائیں تو اس کا ورک سپیس کھل جائے گا — یہاں FIR متن، ملزمان، گواہان، ضمنی، رپورٹ 173، CDR/IMEI اور CRO سب موجود ہیں۔' },
  { icon:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L18 10l-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg>', title:'قدم 3 — دستاویز بھریں اور پرنٹ کریں', text:'جو دستاویز چاہیے اسے کھولیں، خانے بھریں (بہت سا ڈیٹا خودکار بھر جاتا ہے)، پھر اوپر پٹی میں پرنٹ کا نشان دبائیں۔ آواز سے لکھنے کے لیے نیچے گول مائیک کا بٹن دبائیں۔' },
  { icon:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.4M12 18.6V21M21 12h-2.4M5.4 12H3M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7M18.4 18.4l-1.7-1.7M7.3 7.3L5.6 5.6"/></svg>', title:'تیار ہیں!', text:'اوپر SHO/DSP کے نام ایک بار شامل کر لیں — وہ تمام رپورٹس میں خودبخود آ جائیں گے۔ کسی بھی وقت مینو (اوپر دائیں) سے مزید سہولیات حاصل کریں۔ اللہ آپ کے کام میں آسانی فرمائے۔' },
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
      ${!isLast?`<button class="btn btn-primary" onclick="_onboardNext()" style="flex:1;">آگے →</button>`:`<button class="btn btn-primary" onclick="_skipOnboarding()" style="flex:1;">شروع کریں</button>`}
    </div>
  `);
}


function _onboardNext() { if (_onboardIdx < _ONBOARD_STEPS.length-1) { _onboardIdx++; _renderOnboardStep(); } }

function _onboardPrev() { if (_onboardIdx > 0) { _onboardIdx--; _renderOnboardStep(); } }

function _skipOnboarding() {
  try { localStorage.setItem('dio_onboarded', 'yes'); } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  closeModal();
}
// Allow re-showing from settings

function showOnboardingAgain() { _showOnboarding(); }


async function doLogout() {
  // ═══════════════════════════════════════════════════════════════════
  //  SECURE LOGOUT (per audit "Correct 8: Logout behavior")
  //  Sirf sign-out kaafi nahi — sensitive local data, cameras/microphones,
  //  aur previews sab band karo, warna doosra afsar seat par baith kar
  //  purana ڈیٹا browser Back se dekh sakta hai.
  // ═══════════════════════════════════════════════════════════════════

  // 0. AUDIT — logout event log karें AUR pending audit flush karें
  //    signOut se PEHLE — warna auth.uid() nahi rahегi RLS ke liye.
  try {
    if (window.DIO && DIO.audit) {
      DIO.audit.log('logout', 'session', null, {
        metadata: { ts: new Date().toISOString() }
      });
      // Sync flush — sab pending audit rows DB mein bhejें
      try { await DIO.audit.flush(); } catch (_) { /* audit/custody ka masla asal kaam na roke */ }
    }
  } catch (_) { /* audit/custody ka masla asal kaam na roke */ }

  // 1. Server sign-out (offline par fail ho to bhi jari raho)
  //    v526: agar is aale par PIN ya biometric fa'al hai to sign-out ki jagah
  //    "taala" — session server par baqi, mehfooz (encrypted) token ke sath.
  //    Warna signOut() wahi token mansookh kar deta tha aur agli dafa
  //    fingerprint/PIN "kaam nahi karta" tha (asal shikayat).
  let _quickKept = false;
  try { _quickKept = await _dioDetachForQuickLogin(); } catch(_) { _quickKept = false; }
  // v530: scope 'local' — sirf IS aale ka session band. supabase-js ka default
  //   'global' hai jo afsar ke HAR aale (phone samet) ka session mansookh kar
  //   deta tha — desktop par log aut karte hi phone ka fingerprint/PIN mar jata
  //   tha (maidan ki shikayat "mobile par biometric kaam nahi karta").
  if (!_quickKept) { try { await supabaseClient.auth.signOut({ scope: 'local' }); } catch(_) { /* best-effort — na ho sake to bhi aage chalo */ } }

  // 2. Camera / microphone / voice recognition stop
  try {
    if (window._voiceRecognition && typeof window._voiceRecognition.stop === 'function')
      window._voiceRecognition.stop();
    window._voiceRecognition = null; window._voiceActive = false;
  } catch(_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
  try {
    // koi bhi live MediaStream (evidence camera, mic) band karo
    if (window._dioMediaStreams && Array.isArray(window._dioMediaStreams)) {
      window._dioMediaStreams.forEach(s => { try { s.getTracks().forEach(t=>t.stop()); } catch(_){ /* ikhtiyari qadam — na ho sake to chhoR do */ } });
      window._dioMediaStreams = [];
    }
  } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }

  // 3. In-memory state saaf
  currentUser=null; currentOfficer=null; _dioPendingReauth = null;
  try { if (typeof window._dioClearLockOnLogout === 'function') window._dioClearLockOnLogout(); } catch(_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
  try { window._workspaceCase = null; window._workspaceEv = null; } catch(_){ /* ikhtiyari qadam — na ho sake to chhoR do */ }
  try { _misalDocs = {}; _misalCaseId = null; _misalCase = null; } catch(_){ /* ikhtiyari qadam — na ho sake to chhoR do */ }
  try { _rfaList = []; _rfaCurrent = null; _rfaCaseId = null; } catch(_){ /* ikhtiyari qadam — na ho sake to chhoR do */ }

  // 4. Sensitive local caches — audit list ke mutabiq
  //    (case-specific ڈیٹا, dashboards, tokens, cases, docs, evidence)
  const _sensitivePrefixes = [
    'dio_officer_cache','digital_io_locked','dio_last_backup_source','dio_gdrive_token',
    'dio_r173_','dio_r173docs_','dio_zimni_','dio_za_','dio_accused_','dio_witness_',
    'dio_cro_','dio_rfa_','dio_rfalist_','dio_sd_','dio_saved_','dio_cache_',
    'dio_evidence_','dio_dashboard_','dio_notifications_',
    // Security fix (Remove 8 / Correct 8): ye sensitive case-data caches pehle logout par
    // saaf NAHI hote the — shared device par agla shakhs parh sakta tha. Ab clear hote hain.
    'dio_cdr_','dio_firmatn_','dio_fircopies_','dio_saza_','dio_staff_',
    'dio_acc_opts_','dio_notifs_cache','dio_recent_cases','case_status_',
    'digital_io_sarkari_gari'
  ];
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (_sensitivePrefixes.some(p => k === p || k.startsWith(p))) {
        try { localStorage.removeItem(k); } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
      }
    }
  } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  try { sessionStorage.clear(); } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  try {
    if ('caches' in window) caches.keys().then(ks => ks.forEach(k => caches.delete(k))).catch(()=>{});
  } catch(_) { /* best-effort — na ho sake to bhi aage chalo */ }
  const ov = document.getElementById('dio-pin-overlay'); if (ov) ov.remove();
  const app = document.getElementById('main-app');
  const login = document.getElementById('login-screen');
  if (app) app.style.display='none';
  if (login) { login.style.display='flex'; login.style.opacity='1'; }
  try { _dioLandingAvatar(); } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  showToast('لاگ آؤٹ ہو گئے','info');
}


function showRegister()       { const m=document.getElementById('register-modal'); if(m){ m.style.setProperty('display','flex','important'); m.style.zIndex='99999'; } else { showToast('رجسٹریشن فارم لوڈ نہیں ہوا — صفحہ ریفریش کریں','error'); } }

function hideRegister()       { const m=document.getElementById('register-modal'); if(m) m.style.display='none'; }

/* ═══ پاس ورڈ بھول گئے (v524) ═══════════════════════════════════
   PEHLE KYUN KAAM NAHI KARTA THA (teen alag kharabiyan):
   1) `showForgotPassword()` `#forgot-card` / `#login-card` dhoondta tha —
      page par aisa koi element hai hi nahi (asal modal `#forgot-modal` hai).
      Natija: button dabane par KUCH bhi nahi hota tha.
   2) Modal ka button `sendOTP()` bulata tha jo sirf "جلد آ رہی ہے" ka
      toast tha — email kabhi bheji hi nahi jati thi.
   3) Email ke link se wapas aane par naya pass word rakhne ki koi jagah
      nahi thi (PASSWORD_RECOVERY ko koi sun hi nahi raha tha).
   AB: (1) sahi modal khulta hai, (2) Supabase `resetPasswordForEmail`
   asal email bhejta hai, (3) link se wapsi par "نیا پاس ورڈ" ka khana
   khud khulta hai aur `updateUser` se pass word badalta hai.
   ═══════════════════════════════════════════════════════════════ */
function _fpStep(n) {
  [1, 2, 3].forEach(i => {
    const el = document.getElementById('forgot-step' + i);
    if (el) el.style.display = (i === n) ? 'block' : 'none';
  });
}
function _fpMsg(text, kind) {
  const el = document.getElementById('forgot-msg');
  if (!el) return;
  el.textContent = text || '';
  el.className = 'fp-msg' + (kind ? ' fp-' + kind : '');
  el.style.display = text ? 'block' : 'none';
}
function _fpOpen(step) {
  const m = document.getElementById('forgot-modal');
  if (!m) { showToast('فارم لوڈ نہیں ہوا — صفحہ ریفریش کریں', 'error'); return; }
  m.style.setProperty('display', 'flex', 'important');
  m.style.zIndex = '99999';
  _fpMsg('');
  _fpStep(step || 1);
  setTimeout(() => {
    const f = document.getElementById(step === 3 ? 'new-pass1' : 'forgot-email');
    if (f) f.focus();
  }, 60);
}
function showForgotPassword() {
  _fpOpen(1);
  const le = document.getElementById('login-email'), fe = document.getElementById('forgot-email');
  if (le && fe && !fe.value) fe.value = (le.value || '').trim();
}
function hideForgotModal() {
  const m = document.getElementById('forgot-modal');
  if (m) m.style.display = 'none';
  // Recovery ke dauran band kiya to adhoora session na rahe
  if (window.__dioRecoveryActive) {
    window.__dioRecoveryActive = false;
    try { supabaseClient.auth.signOut({ scope: 'local' }); } catch (_) { /* best-effort — na ho sake to bhi aage chalo */ }   // v530: doosre aale mehfooz
  }
}

// Supabase ki angrezi galti → saaf Urdu paigham (asal wajah chhupai nahi jati)
function _fpErrText(error) {
  const m = String((error && (error.message || error.msg)) || '').toLowerCase();
  const code = String((error && (error.code || error.error_code)) || '').toLowerCase();
  if (m.includes('not authorized') || code.includes('not_authorized'))
    return 'ای میل سرور اس پتے پر ای میل بھیجنے کی اجازت نہیں دیتا۔ ایڈمن کو Supabase میں اپنا SMTP سرور لگانا ہوگا۔';
  if (m.includes('rate limit') || code.includes('rate_limit') || (error && error.status === 429))
    return 'بہت زیادہ کوششیں — کچھ دیر (تقریباً ایک گھنٹہ) بعد دوبارہ کوشش کریں۔';
  if (m.includes('for security purposes'))
    return 'حفاظتی وجہ سے چند سیکنڈ بعد دوبارہ کوشش کریں۔';
  if (m.includes('redirect'))
    return 'واپسی کا لنک (Redirect URL) Supabase میں منظور شدہ نہیں۔ ایڈمن سے رابطہ کریں۔';
  if (m.includes('same') && m.includes('password'))
    return 'نیا پاس ورڈ پرانے پاس ورڈ سے مختلف ہونا چاہیے۔';
  if (m.includes('weak') || m.includes('at least'))
    return 'پاس ورڈ کمزور ہے — کم از کم 8 حروف، حروف اور ہندسے ملا کر رکھیں۔';
  if (m.includes('session') || m.includes('jwt') || m.includes('expired'))
    return 'ری سیٹ لنک کی مدت ختم ہو گئی — دوبارہ "پاس ورڈ بھول گئے" سے نیا لنک منگوائیں۔';
  if (m.includes('fetch') || m.includes('network'))
    return 'انٹرنیٹ دستیاب نہیں — کنکشن چیک کر کے دوبارہ کوشش کریں۔';
  return 'درخواست مکمل نہ ہو سکی: ' + ((error && error.message) || 'نامعلوم خرابی');
}

// Email ka link wapas ISI safhe par aaye (Vercel ya jahan bhi chal raha ho)
function _fpRedirectUrl() {
  try { return location.origin + location.pathname; } catch (_) { return undefined; }
}

async function sendResetEmail() {
  const inp = document.getElementById('forgot-email');
  const btn = document.getElementById('forgot-send-btn');
  const email = (inp && inp.value || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    _fpMsg('درست ای میل پتہ درج کریں۔', 'err'); return;
  }
  if (!navigator.onLine) { _fpMsg('انٹرنیٹ دستیاب نہیں — ای میل بھیجنے کے لیے کنکشن درکار ہے۔', 'err'); return; }
  if (!supabaseClient) { _fpMsg('سرور سے رابطہ نہیں ہو سکا — صفحہ ریفریش کریں۔', 'err'); return; }
  if (btn) { btn.disabled = true; btn.dataset.t = btn.textContent; btn.textContent = 'بھیجی جا رہی ہے…'; }
  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: _fpRedirectUrl() });
    if (error) { _fpMsg(_fpErrText(error), 'err'); return; }
    // Hifazat: ye nahi bataya jata ke ye email darj hai ya nahi (account enumeration se bachao)
    _fpStep(2);
    const sent = document.getElementById('forgot-sent-to');
    if (sent) sent.textContent = email;
    _fpMsg('');
  } catch (e) {
    _fpMsg(_fpErrText(e), 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = btn.dataset.t || 'ری سیٹ لنک بھیجیں'; }
  }
}
// purane naam — kisi purani jagah se bulaye jaayen to bhi sahi kaam ho
async function sendOTP() { return sendResetEmail(); }

async function resetPassword() {
  const p1 = (document.getElementById('new-pass1') || {}).value || '';
  const p2 = (document.getElementById('new-pass2') || {}).value || '';
  if (p1.length < 8) { _fpMsg('پاس ورڈ کم از کم 8 حروف کا ہو۔', 'err'); return; }
  if (!/[A-Za-z]/.test(p1) || !/\d/.test(p1)) { _fpMsg('پاس ورڈ میں حروف اور ہندسے دونوں شامل کریں۔', 'err'); return; }
  if (p1 !== p2) { _fpMsg('دونوں پاس ورڈ ایک جیسے نہیں۔', 'err'); return; }
  const btn = document.getElementById('forgot-save-btn');
  if (btn) { btn.disabled = true; btn.dataset.t = btn.textContent; btn.textContent = 'محفوظ ہو رہا ہے…'; }
  try {
    const { data: s } = await supabaseClient.auth.getSession();
    if (!s || !s.session) { _fpMsg(_fpErrText({ message: 'session expired' }), 'err'); return; }
    const email = s.session.user && s.session.user.email;
    const { error } = await supabaseClient.auth.updateUser({ password: p1 });
    if (error) { _fpMsg(_fpErrText(error), 'err'); return; }
    // Naye pass word se khud login karwayen — is liye recovery session band
    window.__dioRecoveryActive = false;
    try { await supabaseClient.auth.signOut(); } catch (_) { /* best-effort — na ho sake to bhi aage chalo */ }
    // Purana mehfooz token (PIN/biometric) ab bekaar — wo dobara password login par banega
    hideForgotModal();
    const le = document.getElementById('login-email');
    if (le && email) le.value = email;
    const lp = document.getElementById('login-password'); if (lp) lp.value = '';
    try { setLoginMethod('password', document.querySelectorAll('.login-method')[0]); } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
    showToast('پاس ورڈ تبدیل ہو گیا — اب نئے پاس ورڈ سے لاگ اِن کریں', 'success', 6000);
  } catch (e) {
    _fpMsg(_fpErrText(e), 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = btn.dataset.t || 'نیا پاس ورڈ محفوظ کریں'; }
  }
}

// Email ke link se wapsi: (a) PASSWORD_RECOVERY event, (b) <head> ka flag
// (Supabase hash ko listener lagne se PEHLE parh kar saaf kar deta hai).
function _fpInitRecovery() {
  try {
    if (window.__dioRecoveryError) {
      window.__dioRecoveryError = false;
      setTimeout(() => { _fpOpen(1); _fpMsg('یہ ری سیٹ لنک استعمال ہو چکا یا اس کی مدت ختم ہو گئی — نیا لنک منگوائیں۔', 'err'); }, 400);
    }
    if (window.__dioRecoveryHash) {
      window.__dioRecoveryHash = false;
      window.__dioRecoveryActive = true;
      setTimeout(() => _fpOpen(3), 400);
    }
    if (supabaseClient && supabaseClient.auth && supabaseClient.auth.onAuthStateChange) {
      supabaseClient.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          window.__dioRecoveryActive = true;
          setTimeout(() => _fpOpen(3), 50);
        }
      });
    }
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}
_fpInitRecovery();
window.sendResetEmail = sendResetEmail;
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

  // PIN bilkul set hi nahi hua
  if (!savedPin) {
    showToast('پہلے پاسورڈ سے لاگ ان کر کے PIN سیٹ کریں (ترتیبات میں)', 'warn', 5000);
    _pinValue = ''; _renderPinDots();
    setLoginMethod('password', document.querySelectorAll('.login-method')[0]);
    return;
  }

  // PIN تصدیق (ہیش شدہ)؛ پرانا سادہ PIN درست ہونے پر خودکار ہیش میں بدل جائے
  let _pinOk = await _dioPinMatches(_pinValue, savedPin);
  if (_pinOk === null) {                      // legacy — خام محفوظ تھا
    _pinOk = (_pinValue === savedPin);
    if (_pinOk) { try { localStorage.setItem('dio_pin', await _dioHashPin(_pinValue)); } catch (_) { if (typeof dioLogError === 'function') dioLogError('PIN: naye hash mein badalna nakaam', _); } }
  }
  if (!_pinOk) {
    showToast('غلط PIN', 'error');
    _pinValue = ''; _renderPinDots();
    return;
  }

  // PIN theek —
  _pinValue = ''; _renderPinDots();
  setLoginLoading(true);

  // ── OFFLINE: cached session se seedha andar (koi network nahi) ──
  if (!navigator.onLine) {
    const off = await _dioOfflineRestore();
    setLoginLoading(false);
    if (off) {
      showToast('آفلائن موڈ — انٹرنیٹ آنے پر کام خودبخود sync ہو جائے گا', 'info', 4000);
      loginSuccess();
      return;
    }
    showToast('آفلائن لاگ اِن دستیاب نہیں — پہلے ایک بار انٹرنیٹ کے ساتھ لاگ اِن کریں', 'warn', 6000);
    return;
  }

  // ── ONLINE: refresh-token se poora login (session taza; password kahin mehfooz nahi) ──
  const ok = await _dioLoginWithToken('dio_pin_rt');
  if (ok) { loginSuccess(); return; }

  // Token khatam ho gaya ya mojood nahi → aik dafa password se login
  setLoginLoading(false);
  showToast('سیشن ختم ہو گیا — ایک بار پاسورڈ سے لاگ ان کریں', 'warn', 5000);
  if (savedEmail) { const el = document.getElementById('login-email'); if (el) el.value = savedEmail; }
  setLoginMethod('password', document.querySelectorAll('.login-method')[0]);
}


// PIN set ho to login screen khud PIN panel par khule (bar bar password na maange)

function _dioDefaultLoginPanel() {
  try {
    // PIN set ho to login screen khud PIN panel par khule (bar bar password na maange)
    if (localStorage.getItem('dio_pin')) {
      const pinBtn = document.querySelectorAll('.login-method')[1];  // PIN button
      if (pinBtn && typeof setLoginMethod === 'function') { setLoginMethod('pin', pinBtn); return; }
    }
    // Warna biometric set ho to biometric panel
    if (localStorage.getItem('dio_biometric_cred') && localStorage.getItem('dio_biometric_email')) {
      const bioBtn = document.querySelectorAll('.login-method')[2];
      if (bioBtn && typeof setLoginMethod === 'function') setLoginMethod('biometric', bioBtn);
    }
  } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
}
window._dioDefaultLoginPanel = _dioDefaultLoginPanel;

// ── Login screen boot: offline hint + default panel ──────────────
function _dioInitLoginScreen() {
  try {
    const ls = document.getElementById('login-screen');
    // Sirf jab login screen nazar aa rahi ho
    if (!ls || ls.style.display === 'none') return;
    _dioDefaultLoginPanel();
    const hint = document.getElementById('offline-login-hint');
    if (hint) hint.style.display = navigator.onLine ? 'none' : 'block';
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._dioInitLoginScreen = _dioInitLoginScreen;

/* ═══ لاگ اِن صفحے کے دائرے میں افسر کی تصویر (v527) ══════════════════
   لاگ اِن سے پہلے معلوم نہیں ہوتا کون آ رہا ہے، اس لیے اسی آلے پر
   آخری بار داخل ہونے والے افسر کی محفوظ تصویر دکھائی جاتی ہے (یہی
   تصویر ترتیبات/ڈیش بورڈ میں ہے)۔ تصویر نہ ہو تو ڈھال کا نشان ہی رہتا ہے۔
   صرف data:image یا https کی تصویر — کوئی اور قسم قبول نہیں۔ */
function _dioLandingAvatar() {
  try {
    const box = document.getElementById('dio-land-emblem');
    if (!box) return;
    let src = '';
    try { src = localStorage.getItem('dio_profile_photo') || localStorage.getItem('officer_photo_url') || ''; } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
    src = String(src || '').trim();
    const ok = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(src) || /^https:\/\/[^\s"'<>]+$/.test(src);
    const old = box.querySelector('img.dio-land-photo');
    if (!ok) { if (old) { old.remove(); box.classList.remove('has-photo'); } return; }
    if (old && old.getAttribute('src') === src) return;
    const img = old || document.createElement('img');
    img.className = 'dio-land-photo';
    img.alt = '';
    img.decoding = 'async';
    img.onerror = function () { img.remove(); box.classList.remove('has-photo'); };
    img.src = src;
    if (!old) box.appendChild(img);
    box.classList.add('has-photo');
  } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
}
window._dioLandingAvatar = _dioLandingAvatar;
window.addEventListener('load', function () { setTimeout(_dioLandingAvatar, 50); });
window.addEventListener('load', function () { setTimeout(_dioInitLoginScreen, 300); });
window.addEventListener('offline', function () {
  try { const h = document.getElementById('offline-login-hint'); const ls = document.getElementById('login-screen');
    if (h && ls && ls.style.display !== 'none') h.style.display = 'block'; } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
});
window.addEventListener('online', function () {
  try { const h = document.getElementById('offline-login-hint'); if (h) h.style.display = 'none'; } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
});


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
  // v530: بایومیٹرک ٹیب کھلتے ہی آلہ جانچو (لمس سے پہلے — اس لیے iPhone پر بھی محفوظ)
  if (m === 'biometric') { try { _dioBioPrecheck(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } }
}

// v530: بایومیٹرک ٹیب پر فوراً بتاؤ کہ یہ فون تیار ہے یا نہیں — پہلے بغیر
//   فنگرپرنٹ والے فون پر 60 سیکنڈ بعد جا کر پیغام آتا تھا۔
async function _dioBioPrecheck() {
  const lab = document.querySelector('#panel-biometric .biometric-label');
  if (!lab) return;
  const DEF = 'تصدیق کے لیے یہاں دبائیں';
  let msg = '';
  if (!window.PublicKeyCredential) {
    msg = _dioInAppBrowser()
      ? 'یہ صفحہ کسی ایپ (WhatsApp/Facebook) کے اندر کھلا ہے — Chrome (iPhone پر Safari) میں کھولیں'
      : 'یہ براؤزر بایومیٹرک سپورٹ نہیں کرتا — Chrome (iPhone پر Safari) استعمال کریں';
  } else if (!localStorage.getItem('dio_biometric_cred')) {
    msg = 'اس فون پر بایومیٹرک ابھی فعال نہیں — پاس ورڈ سے لاگ اِن کر کے ترتیبات میں "بایومیٹرک فعال کریں" دبائیں';
  } else {
    try {
      if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable &&
          (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()) === false)
        msg = 'اس فون پر اسکرین لاک یا فنگرپرنٹ/چہرہ سیٹ نہیں — فون کی سیٹنگز میں لگائیں';
    } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  }
  lab.textContent = msg || DEF;
  lab.classList.toggle('dio-bio-warn', !!msg);
}
window._dioBioPrecheck = _dioBioPrecheck;

function togglePasswordVisibility(id) { const el=document.getElementById(id); if(el) el.type=el.type==='password'?'text':'password'; }

function _setupPin() {
  openModal('PIN سیٹ کریں', `
    <div style="direction:rtl;">
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">6 ہندسوں کا PIN منتخب کریں۔ اس سے آپ تیزی سے لاگ ان کر سکیں گے۔</p>
      <input class="form-input" type="password" id="setup-pin" inputmode="numeric" maxlength="6" placeholder="6 ہندسے" dir="ltr" style="text-align:center;font-size:24px;letter-spacing:8px;margin-bottom:10px;">
      <input class="form-input" type="password" id="setup-pin2" inputmode="numeric" maxlength="6" placeholder="دوبارہ PIN" dir="ltr" style="text-align:center;font-size:24px;letter-spacing:8px;">
      <p style="font-size:11px;color:var(--text-muted);margin-top:10px;">موجودہ پاسورڈ بھی درکار ہوگا تاکہ PIN لاگ ان کام کرے</p>
      <input class="form-input" type="password" id="setup-pin-pass" placeholder="موجودہ پاسورڈ" style="margin-top:8px;">
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
    <button class="btn btn-primary" onclick="_savePin()">محفوظ کریں</button>
  `);
}


async function _savePin() {
  const pin = document.getElementById('setup-pin')?.value.trim();
  const pin2 = document.getElementById('setup-pin2')?.value.trim();
  const pass = document.getElementById('setup-pin-pass')?.value;

  if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    showToast('PIN 6 ہندسوں کا ہونا چاہیے', 'error'); return;
  }
  if (pin !== pin2) {
    showToast('دونوں PIN مختلف ہیں', 'error'); return;
  }
  if (!pass) {
    showToast('موجودہ پاسورڈ درکار ہے', 'error'); return;
  }

  const email = currentOfficer?.email || currentUser?.email;
  if (!email) {
    showToast('ای میل نہیں ملی', 'error'); return;
  }

  // Pehle password tasdeeq karo — warna galat password mehfooz ho kar
  // PIN login hamesha nakaam karta rahega
  try {
    const { error: vErr } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
    if (vErr) { showToast('موجودہ پاسورڈ غلط ہے', 'error'); return; }
  } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }

  try {
    localStorage.setItem('dio_pin', await _dioHashPin(pin));   // خام نہیں — PBKDF2 ہیش
    localStorage.setItem('dio_pin_email', email);
    // پاسورڈ نہیں — صرف refresh-token (محدود مدت، پاسورڈ ظاہر نہیں کرتا)
    await _dioSaveAuthToken('dio_pin_rt');
    try { localStorage.removeItem('dio_pin_token'); } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
    closeModal();
    showToast('PIN سیٹ ہو گیا — اب لاگ ان اسکرین پر PIN استعمال کریں', 'success', 5000);
  } catch(e) {
    showToast('' + e.message, 'error');
  }
}

// ── SETUP PIN END ─────────────────────────────────────────────

// ── v530: بایومیٹرک ناکام ہو تو اصل وجہ (اندازہ نہیں — آلے سے پوچھ کر) ──
//   credentials.create/get سے پہلے کوئی await نہیں رکھا گیا (iPhone/Safari
//   میں انگلی کے لمس اور اس کال کے بیچ انتظار ہو تو وہ رد کر دیتا ہے)،
//   اس لیے آلے کی صلاحیت ناکامی کے بعد ہی جانچی جاتی ہے۔
function _dioInAppBrowser() {
  try { return /FBAN|FBAV|Instagram|WhatsApp|Line\/|; wv\)/i.test(navigator.userAgent || ''); }
  catch (_) { return false; }
}
async function _dioBioWhy(e, phase) {
  const n = (e && e.name) || 'Error';
  if (_dioInAppBrowser())
    return 'یہ صفحہ کسی ایپ (WhatsApp/Facebook وغیرہ) کے اندر کھلا ہے — بایومیٹرک کے لیے اسے Chrome (iPhone پر Safari) میں کھولیں (' + n + ')';
  let platform = null;
  try {
    if (window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable)
      platform = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  if (platform === false)
    return 'اس فون پر اسکرین لاک یا فنگرپرنٹ/چہرہ سیٹ نہیں — فون کی سیٹنگز میں لگائیں، پھر دوبارہ کوشش کریں (' + n + ')';
  if (n === 'NotAllowedError')
    return phase === 'enable'
      ? 'بایومیٹرک منسوخ ہوا یا وقت ختم ہو گیا — دوبارہ "بایومیٹرک فعال کریں" دبائیں (' + n + ')'
      : 'بایومیٹرک منسوخ ہوا یا وقت ختم ہو گیا — دوبارہ کوشش کریں۔ بار بار یہی آئے تو پاس ورڈ سے لاگ اِن کر کے ترتیبات میں بایومیٹرک بند کر کے دوبارہ فعال کریں (' + n + ')';
  if (n === 'InvalidStateError' || n === 'NotFoundError')
    return phase === 'enable'
      ? 'یہ فنگرپرنٹ اس فون پر پہلے سے رجسٹر ہے — ترتیبات میں بایومیٹرک بند کر کے دوبارہ فعال کریں (' + n + ')'
      : 'اس فون پر بایومیٹرک رجسٹر نہیں — پاس ورڈ سے لاگ اِن کر کے ترتیبات میں دوبارہ فعال کریں (' + n + ')';
  if (n === 'NotSupportedError')
    return 'اس براؤزر میں فنگرپرنٹ/چہرے کی سہولت نہیں — Chrome (iPhone پر Safari) استعمال کریں (' + n + ')';
  if (n === 'SecurityError')
    return 'یہ سہولت صرف ایپ کے اصل پتے پر چلتی ہے: digital-io-portal.vercel.app (' + n + ')';
  return 'بایومیٹرک ناکام: ' + ((e && e.message) || n);
}
window._dioBioWhy = _dioBioWhy;

async function doBiometric() {
  const ring = document.getElementById('bio-ring');
  if (!window.PublicKeyCredential) {
    showToast(_dioInAppBrowser()
      ? 'یہ صفحہ کسی ایپ (WhatsApp/Facebook وغیرہ) کے اندر کھلا ہے — بایومیٹرک کے لیے Chrome (iPhone پر Safari) میں کھولیں'
      : 'یہ براؤزر بایومیٹرک سپورٹ نہیں کرتا — Chrome (iPhone پر Safari) استعمال کریں', 'warn', 7000);
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

    // Biometric tasdeeq ho gayi (WebAuthn offline bhi chalta hai)
    // ── OFFLINE: cached session se seedha andar ──
    if (!navigator.onLine) {
      const off = await _dioOfflineRestore();
      if (off) {
        showToast('آفلائن موڈ — بایومیٹرک کامیاب، انٹرنیٹ آنے پر sync', 'info', 4000);
        loginSuccess();
      } else {
        showToast('آفلائن لاگ اِن دستیاب نہیں — پہلے ایک بار انٹرنیٹ کے ساتھ لاگ اِن کریں', 'warn', 6000);
      }
      return;
    }
    // ── ONLINE: mehfooz (encrypted) session token se poora login (v526) ──
    // Pehle yahan purana sada password (`dio_biometric_token`) dhoonda jata
    // tha jo kab ka hat chuka tha — is liye fingerprint ke baad bhi har bar
    // password mangta tha.
    setLoginLoading(true);
    const ok = await _dioLoginWithToken('dio_bio_rt');
    if (ok) { loginSuccess(); return; }
    setLoginLoading(false);
    showToast('فنگرپرنٹ درست تھا، مگر اس فون کا محفوظ سیشن ختم ہو چکا (پاس ورڈ بدلا گیا یا اکاؤنٹ مکمل لاگ آؤٹ ہوا) — ایک بار پاس ورڈ سے لاگ اِن کریں، بایومیٹرک خود پھر چل پڑے گا', 'warn', 8000);
    const le = document.getElementById('login-email'); if (le) le.value = savedEmail;
    try { setLoginMethod('password', document.querySelectorAll('.login-method')[0]); } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  } catch(e) {
    try { setLoginLoading(false); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    let msg = 'بایومیٹرک ناکام — دوبارہ کوشش کریں';
    try { msg = await _dioBioWhy(e, 'login'); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    showToast(msg, 'error', 9000);
  } finally {
    if (ring) ring.classList.remove('scanning');
  }
}

// Enable biometric (called after successful login from settings)

async function enableBiometric() {
  if (!window.PublicKeyCredential) {
    showToast(_dioInAppBrowser()
      ? 'یہ صفحہ کسی ایپ (WhatsApp/Facebook وغیرہ) کے اندر کھلا ہے — بایومیٹرک کے لیے Chrome (iPhone پر Safari) میں کھولیں'
      : 'یہ براؤزر بایومیٹرک سپورٹ نہیں کرتا — Chrome (iPhone پر Safari) استعمال کریں', 'warn', 7000);
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
    localStorage.setItem('dio_biometric_email', String(currentUser?.email || '').toLowerCase());
    // v526: session token ABHI mehfooz karo — pehle yeh hota hi nahi tha,
    // is liye fingerprint ke baad bhi login nahi hota tha.
    const saved = await _dioSaveAuthToken('dio_bio_rt');
    if (!saved) {
      showToast('بایومیٹرک رجسٹر ہو گیا، مگر سیشن محفوظ نہ ہو سکا — ایک بار لاگ آؤٹ کر کے پاس ورڈ سے لاگ اِن کریں', 'warn', 7000);
    } else {
      showToast('بایومیٹرک فعال ہو گیا — اگلی بار فنگرپرنٹ/چہرے سے لاگ اِن کریں', 'success', 5000);
    }
    try { if (typeof showPage === 'function' && window._activePage === 'settings') showPage('settings', null); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
  } catch(e) {
    let msg = 'بایومیٹرک فعال نہیں ہوا';
    try { msg = await _dioBioWhy(e, 'enable'); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    showToast(msg, 'error', 9000);
  }
}

// v526: بایومیٹرک بند کریں — credential اور محفوظ token دونوں ہٹاؤ
function disableBiometric() {
  ['dio_biometric_cred', 'dio_biometric_email', 'dio_bio_rt', 'dio_biometric_token'].forEach(k => {
    try { localStorage.removeItem(k); } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  });
  showToast('اس ڈیوائس پر بایومیٹرک بند کر دیا گیا', 'info', 4000);
  try { if (typeof showPage === 'function' && window._activePage === 'settings') showPage('settings', null); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
}
function isBiometricEnabled() {
  try {
    return !!(localStorage.getItem('dio_biometric_cred') &&
      _dioSameEmail(localStorage.getItem('dio_biometric_email'), currentUser && currentUser.email));
  } catch (_) { return false; }
}
window.disableBiometric = disableBiometric;
window.isBiometricEnabled = isBiometricEnabled;


function _bufToB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function _b64ToBuf(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
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
  if(!name||!email||!pass){showToast('تمام ضروری خانے بھریں','error');return;}
  if(pass.length<8){showToast('پاسورڈ کم از کم 8 حروف کا ہو','error');return;}
  if(cnic && !/^\d{5}-\d{7}-\d$/.test(cnic)){showToast('شناختی کارڈ نمبر کا فارمیٹ درست نہیں (00000-0000000-0)','error');return;}
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
    showToast('رجسٹریشن ہو گئی! ایڈمن کی منظوری کا انتظار کریں','success',6000);
    hideRegister();
  } catch(e){showToast(''+e.message,'error',6000);}
}


// نوٹ: settings.js میں اسی نام کا فنکشن بعد میں لوڈ ہو کر اسے دبا دیتا تھا (دہرا گلوبل)۔
// اب یہ منفرد نام سے ہے تاکہ تصادم نہ ہو؛ فعال modal settings.js والا ہے۔
// ── SESSION TIMER ─────────────────────────────────────────────
let _sessionTimer, _sessionWarnTimer;
const SESSION_TIMEOUT = 5 * 60 * 1000;        // 5 منٹ بے عملی پر خودکار لاک

function resetSessionTimer() {
  clearTimeout(_sessionTimer);
  clearTimeout(_sessionWarnTimer);
  // لاک ٹائمر صرف تب لگاؤ جب لاک PIN مقرر ہو اور افسر لاگ اِن ہو
  try {
    if (!localStorage.getItem('digital_io_pin_hash')) return;
    if (!(typeof currentUser !== 'undefined' && currentUser)) return;
    _sessionTimer = setTimeout(lockApp, SESSION_TIMEOUT);
  } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
}
// ── PIN LOCK SCREEN (Priority 1B) ─────────────────────────────
let _pinFailedAttempts = 0;
// ═══════════════════════════════════════════════════════════════════
//  BACKUP STUBS REMOVED — duplicates the real functions in backup.js.
//  Pehle yahan initBackupSystem() + triggerBackup() ke stubs the jo
//  script loading order ki wajah se backup.js ki asal functions ko
//  override kar dete the (silent backup failure). Ab canonical
//  implementations sirf backup.js mein rahें gi.
// ═══════════════════════════════════════════════════════════════════
// Ek chhoti utility yahां rakhi ja rahi hai jo aslah google-drive token
// warm karti thi — is ke bina token load nahi hoga:
function _authWarmDriveToken() {
  try {
    const t = localStorage.getItem('dio_gdrive_token');
    if (t) googleDriveToken = t;
  } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
}
_authWarmDriveToken();

// بے عملی پر ٹائمر ری سیٹ (سرگرمی کے اشارے)
document.addEventListener('click', resetSessionTimer);
document.addEventListener('keypress', resetSessionTimer);
document.addEventListener('touchstart', resetSessionTimer);
// پس منظر میں جاتے ہی فوری لاک (اسکرین بند / دوسری ایپ)
document.addEventListener('visibilitychange', () => { try { if (document.hidden) lockApp(); } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ } });


function lockApp() {
  // لاک صرف تب: لاک PIN مقرر ہو، افسر لاگ اِن ہو، پہلے سے لاک نہ ہو، اور مین ایپ کھلی ہو
  try {
    if (!localStorage.getItem('digital_io_pin_hash')) return;   // PIN نہیں تو لاک نہیں (لاک آؤٹ سے بچاؤ)
    if (!(typeof currentUser !== 'undefined' && currentUser)) return;
    if (document.getElementById('pin-lock-overlay')) return;    // پہلے سے لاک
    const app = document.getElementById('main-app');
    if (!app || app.style.display === 'none') return;           // لاگ اِن اسکرین پر لاک نہیں
    _showPinScreen('unlock');
  } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
}
window.lockApp = lockApp;


function _showPinScreen(mode) {
  // mode: 'set' (first time) or 'unlock'
  const isSet = mode === 'set';
  const ov = document.createElement('div');
  ov.id = 'pin-lock-overlay';
  ov.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:99999;background:var(--bg-primary,#0f1420);display:flex;flex-direction:column;align-items:center;justify-content:center;direction:rtl;';
  ov.innerHTML = `
    <div style="font-size:40px;margin-bottom:8px;"><svg viewBox='0 0 24 24' width='40' height='40' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='opacity:.42;display:inline-block;vertical-align:middle'><path d='M12 3.5l7 2.6v5.4c0 4.2-2.9 7.3-7 8.9-4.1-1.6-7-4.7-7-8.9V6.1z'/></svg></div>
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

  const submit = async () => {
    const pin = (input.value||'').trim();
    if (!/^\d{4}$/.test(pin)) { msg.textContent = '4 ہندسوں کا PIN درج کریں'; return; }
    if (isSet) {
      localStorage.setItem('digital_io_pin_hash', await _dioHashPin(pin));   // PBKDF2 ہیش
      ov.remove();
      showToast('PIN مقرر ہو گیا', 'success');
      resetSessionTimer();   // لاک ٹائمر فوراً فعال
    } else {
      const stored = localStorage.getItem('digital_io_pin_hash');
      let ok = await _dioPinMatches(pin, stored);
      if (ok === null) {                          // legacy btoa — درست ہونے پر migrate
        ok = (btoa('dio_' + pin + '_lock') === stored);
        if (ok) { try { localStorage.setItem('digital_io_pin_hash', await _dioHashPin(pin)); } catch (_) { if (typeof dioLogError === 'function') dioLogError('PIN lock: naye hash mein badalna nakaam', _); } }
      }
      if (ok) {
        _pinFailedAttempts = 0;
        ov.remove();
        resetSessionTimer();
      } else {
        _pinFailedAttempts++;
        if (_pinFailedAttempts >= 5) { ov.remove(); showToast('5 غلط کوششیں — لاگ آؤٹ','error'); doLogout(); return; }
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

// لاگ اِن کے بعد ایک بار (اختیاری) لاک PIN مقرر کرنے کی پیشکش
window.maybeSetupPin = function() {
  try {
    if (localStorage.getItem('digital_io_pin_hash')) return;   // پہلے سے مقرر
    if (localStorage.getItem('dio_pin_offered')) return;       // پہلے پوچھ چکے
    localStorage.setItem('dio_pin_offered', '1');
    if (typeof openModal !== 'function') return;
    openModal('ایپ لاک',
      `<div style="direction:rtl;font-family:'Jameel Noori Nastaleeq',serif;line-height:1.9;">کیا آپ ایپ کو 4 ہندسی PIN سے محفوظ کرنا چاہتے ہیں؟ بے عملی (5 منٹ) یا پس منظر میں جانے پر ایپ خود لاک ہو جائے گی۔ بعد میں سیٹنگز سے بھی مقرر/تبدیل کیا جا سکتا ہے۔</div>`,
      `<div style="display:flex;gap:8px;direction:rtl;">
        <button class="btn btn-secondary" onclick="closeModal()">ابھی نہیں</button>
        <button class="btn btn-primary" onclick="closeModal();_showPinScreen('set')">PIN مقرر کریں</button>
      </div>`);
  } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
};

// سیٹنگز سے ایپ لاک PIN مقرر/تبدیل/ہٹائیں
window.dioLockPinSettings = function() {
  try {
    const has = !!localStorage.getItem('digital_io_pin_hash');
    if (typeof openModal !== 'function') { _showPinScreen('set'); return; }
    openModal('ایپ لاک PIN',
      `<div style="direction:rtl;font-family:'Jameel Noori Nastaleeq',serif;line-height:1.9;">${has ? 'PIN پہلے سے مقرر ہے۔ آپ نیا PIN مقرر کر سکتے ہیں یا لاک ہٹا سکتے ہیں۔' : 'ابھی کوئی لاک PIN مقرر نہیں۔ بے عملی یا پس منظر میں جانے پر خودکار لاک کے لیے PIN مقرر کریں۔'}</div>`,
      `<div style="display:flex;gap:8px;direction:rtl;flex-wrap:wrap;">
        <button class="btn btn-secondary" onclick="closeModal()">بند</button>
        ${has ? `<button class="btn btn-danger" onclick="localStorage.removeItem('digital_io_pin_hash');resetSessionTimer();closeModal();showToast('ایپ لاک ہٹا دیا گیا','info')">لاک ہٹائیں</button>` : ''}
        <button class="btn btn-primary" onclick="closeModal();_showPinScreen('set')">${has ? 'نیا PIN' : 'PIN مقرر کریں'}</button>
      </div>`);
  } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
};
