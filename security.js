/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — Security layer (Priority 1)
   Session timeout + PIN lock + encrypted storage helper
   Police data — sensitive. Additive, non-breaking.
   ═══════════════════════════════════════════════════════════ */

// ── 1D: encrypted localStorage helper (XOR + base64) ──────────
const _DIO_ENC_KEY = 'digital_io_key_2024';
window.secureStore = {
  set(key, value) {
    try {
      const str = JSON.stringify(value);
      const enc = btoa(unescape(encodeURIComponent(str.split('').map((c,i)=>
        String.fromCharCode(c.charCodeAt(0) ^ _DIO_ENC_KEY.charCodeAt(i % _DIO_ENC_KEY.length))
      ).join(''))));
      localStorage.setItem(key, enc);
    } catch(_) {}
  },
  get(key) {
    try {
      const enc = localStorage.getItem(key);
      if (!enc) return null;
      const dec = decodeURIComponent(escape(atob(enc))).split('').map((c,i)=>
        String.fromCharCode(c.charCodeAt(0) ^ _DIO_ENC_KEY.charCodeAt(i % _DIO_ENC_KEY.length))
      ).join('');
      return JSON.parse(dec);
    } catch(_) { return null; }
  },
  remove(key) { try { localStorage.removeItem(key); } catch(_) {} }
};

// ── 1A: session timeout (30 min inactivity) ───────────────────
let _dioInactivityTimer = null;
const _DIO_SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
let _dioPinFailCount = 0;

function _dioResetInactivity() {
  if (localStorage.getItem('digital_io_locked') === 'true') return; // already locked
  clearTimeout(_dioInactivityTimer);
  _dioInactivityTimer = setTimeout(() => { lockApp('timeout'); }, _DIO_SESSION_TIMEOUT);
}
['click','keypress','touchstart','mousemove','scroll'].forEach(ev =>
  document.addEventListener(ev, _dioResetInactivity, { passive: true })
);

// ── 1B: PIN lock ──────────────────────────────────────────────
function _dioHashPin(pin) { try { return btoa('dio_'+pin+'_salt'); } catch(_) { return pin; } }
function _dioHasPin() { return !!localStorage.getItem('digital_io_pin_hash'); }

// Lock only when logged in
function lockApp(reason) {
  if (typeof currentUser === 'undefined' || !currentUser) return; // not logged in — no lock
  localStorage.setItem('digital_io_locked', 'true');
  showPINScreen();
}
window.lockApp = lockApp;

// Lock when app goes to background (only if a PIN is already set)
document.addEventListener('visibilitychange', () => {
  if (document.hidden && _dioHasPin() && typeof currentUser !== 'undefined' && currentUser) {
    localStorage.setItem('digital_io_locked', 'true');
  }
});
// On return, if marked locked, show screen
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && localStorage.getItem('digital_io_locked') === 'true'
      && typeof currentUser !== 'undefined' && currentUser) {
    showPINScreen();
  }
});

function showPINScreen() {
  if (document.getElementById('dio-pin-overlay')) return;
  const settingMode = !_dioHasPin();
  const ov = document.createElement('div');
  ov.id = 'dio-pin-overlay';
  ov.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:99999;background:var(--bg-primary,#0f1117);display:flex;flex-direction:column;align-items:center;justify-content:center;direction:rtl;font-family:"Jameel Noori Nastaleeq",sans-serif;';
  ov.innerHTML = `
    <div style="text-align:center;max-width:320px;width:90%;">
      <div style="font-size:34px;font-weight:800;color:var(--accent,#3b82f6);margin-bottom:8px;">Digital IO</div>
      <div style="font-size:16px;color:var(--text-secondary,#aaa);margin-bottom:20px;">${settingMode ? 'نیا PIN مقرر کریں (4 ہندسے)' : 'PIN درج کریں'}</div>
      <input id="dio-pin-input" type="password" inputmode="numeric" maxlength="4" autocomplete="off"
        style="font-size:28px;letter-spacing:12px;text-align:center;width:160px;padding:12px;border:2px solid var(--border,#333);border-radius:12px;background:var(--bg-card,#1a1d27);color:var(--text-primary,#fff);outline:none;direction:ltr;">
      <div id="dio-pin-msg" style="color:#ef4444;font-size:13px;min-height:18px;margin-top:10px;"></div>
      <button id="dio-pin-btn" style="margin-top:6px;background:var(--accent,#3b82f6);color:#fff;border:none;border-radius:10px;padding:12px 28px;font-size:16px;cursor:pointer;width:100%;">${settingMode ? 'محفوظ کریں' : 'کھولیں'}</button>
      ${settingMode ? '' : '<button id="dio-pin-logout" style="margin-top:10px;background:transparent;color:#ef4444;border:none;font-size:13px;cursor:pointer;">لاگ آؤٹ کریں</button>'}
    </div>`;
  document.body.appendChild(ov);
  const inp = document.getElementById('dio-pin-input');
  const msg = document.getElementById('dio-pin-msg');
  inp.focus();

  const submit = () => {
    const pin = (inp.value||'').trim();
    if (!/^\d{4}$/.test(pin)) { msg.textContent = '4 ہندسوں کا PIN درج کریں'; return; }
    if (settingMode) {
      localStorage.setItem('digital_io_pin_hash', _dioHashPin(pin));
      localStorage.removeItem('digital_io_locked');
      ov.remove(); _dioResetInactivity();
      if (typeof showToast === 'function') showToast('🔐 PIN مقرر ہو گیا', 'success');
    } else {
      if (_dioHashPin(pin) === localStorage.getItem('digital_io_pin_hash')) {
        _dioPinFailCount = 0;
        localStorage.removeItem('digital_io_locked');
        ov.remove(); _dioResetInactivity();
      } else {
        _dioPinFailCount++;
        msg.textContent = `غلط PIN (${_dioPinFailCount}/5)`;
        inp.value = '';
        if (_dioPinFailCount >= 5) {
          localStorage.removeItem('digital_io_locked');
          ov.remove();
          if (typeof doLogout === 'function') doLogout();
        }
      }
    }
  };
  document.getElementById('dio-pin-btn').onclick = submit;
  inp.onkeydown = (e) => { if (e.key === 'Enter') submit(); };
  const lo = document.getElementById('dio-pin-logout');
  if (lo) lo.onclick = () => { localStorage.removeItem('digital_io_locked'); ov.remove(); if (typeof doLogout==='function') doLogout(); };
}
window.showPINScreen = showPINScreen;

// Start inactivity timer once loaded
_dioResetInactivity();
