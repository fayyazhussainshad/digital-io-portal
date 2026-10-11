/* ════════════════════════════════════════════════════════════════════
   DIGITAL IO — license-token.js   (Finding 9 ka OFFLINE hissa)
   ────────────────────────────────────────────────────────────────────
   Server (Edge Function dio-license) ECDSA se dastkhat-shuda, mukhtasir-
   muddat license token deta hai. Yahan client SIRF PUBLIC key se us ki
   tasdeeq karta hai (jaali nahi bana sakta). OFFLINE ijazat isi token ki
   miyaad tak — koi khud-ba-khud 30-din trial nahi.

   ISTEMAAL (wiring — subscription.js me):
     • ONLINE login ke baad:  await dioRefreshLicense();
     • checkSubscription() ke OFFLINE branch me trial/30 ki jagah:
         const lic = await dioLicenseValid();
         if (lic.valid) return { status:'active', daysLeft: Math.ceil((lic.entitledUntil-Date.now())/86400000), plan:'آف لائن اجازت' };
         return { status:'expired', daysLeft:0, plan:'میعاد ختم — آن لائن تجدید کریں' };
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ═══ OWNER ki AAMA (public) chaabi — 11 October 2026 ko banai gayi ═══
  //  Yeh PUBLIC chaabi hai: client mein rakhna bilkul mehfooz hai. Is se
  //  sirf dastkhat JAANCHA ja sakta hai, BANAYA nahi. Dastkhat banane wali
  //  (nijee) chaabi sirf Supabase ke raaz `DIO_LICENSE_PRIV_JWK` mein hai.
  //  AHEM: agar kabhi chaabiyan badlein to DONO jagah ek sath badalni hain —
  //  warna purane license token jaanche nahi ja sakenge aur maidan mein
  //  afsar offline likh nahi payega.
  const DIO_LICENSE_PUB_JWK = {
    "kty": "EC", "crv": "P-256",
    "x": "AUgVhrkD57b75bVUycWpnFNrdb7GVVdiLATNoYt0T3s",
    "y": "UgfV94EI6nk785CEyBNXhmnaX_T49GWaKMDWIUISrcw"
  };

  const _unb64url = (s) => {
    s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
    return Uint8Array.from(atob(s), c => c.charCodeAt(0));
  };

  let _pubKeyP = null;
  function _pubKey() {
    if (_pubKeyP) return _pubKeyP;
    _pubKeyP = crypto.subtle.importKey('jwk', DIO_LICENSE_PUB_JWK,
      { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    return _pubKeyP;
  }

  // token = base64url(payloadJson) + '.' + base64url(signature)
  async function _dioVerifyLicenseToken(token) {
    try {
      if (!token || token.indexOf('.') < 0) return { valid: false };
      const [pB64, sB64] = token.split('.');
      const payloadBytes = _unb64url(pB64);
      const sig = _unb64url(sB64);
      const ok = await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' }, await _pubKey(), sig, payloadBytes);
      if (!ok) return { valid: false };
      const p = JSON.parse(new TextDecoder().decode(payloadBytes));
      const entitledUntil = +p.entitled_until || 0;
      if (entitledUntil <= Date.now()) return { valid: false, expired: true, entitledUntil, plan: p.plan };
      return { valid: true, entitledUntil, plan: p.plan, officerId: p.officer_id };
    } catch (_) { return { valid: false }; }
  }

  /* ────────────────────────────────────────────────────────────────────
     Nakami ki wajah — pehle `return false` ke peechay har cheez chhup
     jati thi: na afsar ko pata chalta tha, na console me kuch likha
     jata tha. Maidan me "offline ijazat nahi mil rahi" ka sabab dhoondna
     namumkin tha. Ab aakhri wajah `dio_license_err` me mehfooz hoti hai
     aur aik dafa Urdu me console par likhi jati hai.
     ──────────────────────────────────────────────────────────────────── */
  const LIC_WAJOOHAT = {
    no_officer:            'اس اکاؤنٹ کے لیے officers میں کوئی ریکارڈ نہیں ملا',
    officer_lookup_failed: 'افسر کا ریکارڈ پڑھتے ہوئے ڈیٹا بیس کی خرابی',
    sub_lookup_failed:     'سبسکرپشن پڑھتے ہوئے ڈیٹا بیس کی خرابی',
    server_misconfigured:  'ایج فنکشن کے secrets نامکمل ہیں',
    suspended:             'اکاؤنٹ معطل ہے',
    not_approved:          'اکاؤنٹ ابھی منظور نہیں ہوا',
    not_entitled:          'کوئی فعال سبسکرپشن نہیں',
    no_token:              'لاگ اِن سیشن موجود نہیں',
    bad_token:             'لاگ اِن سیشن قابلِ قبول نہیں',
    internal:              'سرور کی اندرونی خرابی',
  };

  function _licNote(code, extra) {
    const matn = LIC_WAJOOHAT[code] || ('نامعلوم وجہ (' + code + ')');
    try {
      localStorage.setItem('dio_license_err', JSON.stringify({
        code: code, waqt: new Date().toISOString(), extra: extra || null,
      }));
    } catch (_) {}
    try { console.warn('[DIO] لائسنس نہیں ملا — ' + matn, extra || ''); } catch (_) {}
    return false;
  }

  // Aik hi waqt me do darkhwastein na jayen (console me do-do 403 aa rahe the)
  let _licInFlight = null;

  // ONLINE: Edge Function se naya token le kar mehfooz karo
  function dioRefreshLicense() {
    if (_licInFlight) return _licInFlight;
    _licInFlight = _dioRefreshLicenseInner().finally(() => { _licInFlight = null; });
    return _licInFlight;
  }

  async function _dioRefreshLicenseInner() {
    try {
      if (typeof supabaseClient === 'undefined' || !supabaseClient) return false;
      const { data: sess } = await supabaseClient.auth.getSession();
      const jwt = sess && sess.session && sess.session.access_token;
      if (!jwt) return _licNote('no_token');
      const base = (supabaseClient.functionsUrl) || ((supabaseClient.supabaseUrl || '') + '/functions/v1');
      const res = await fetch(base + '/dio-license', {
        method: 'POST', headers: { 'Authorization': 'Bearer ' + jwt, 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        let j = null;
        try { j = await res.json(); } catch (_) {}
        return _licNote((j && j.error) || ('http_' + res.status), j || null);
      }
      const j = await res.json();
      if (j && j.token) {
        localStorage.setItem('dio_license', j.token);
        try { localStorage.removeItem('dio_license_err'); } catch (_) {}
        return true;
      }
      return _licNote('no_token_in_reply', j || null);
    } catch (e) {
      return _licNote('network', String((e && e.message) || e));
    }
  }

  // Aakhri nakami ki wajah (settings/tashkhees ke liye)
  function dioLicenseError() {
    try { return JSON.parse(localStorage.getItem('dio_license_err') || 'null'); }
    catch (_) { return null; }
  }

  // OFFLINE (ya kabhi bhi): mehfooz token faal hai?
  async function dioLicenseValid() {
    const t = localStorage.getItem('dio_license');
    return await _dioVerifyLicenseToken(t);
  }

  window.dioRefreshLicense = dioRefreshLicense;
  window.dioLicenseValid = dioLicenseValid;
  window.dioLicenseError = dioLicenseError;
  window._dioVerifyLicenseToken = _dioVerifyLicenseToken;   // test ke liye
})();
