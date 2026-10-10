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

  // ⚠️ KEYGEN ke baad public key JWK yahan paste karein (dekho README.md)
  //    Ye PUBLIC key hai — client me rakhna mehfooz hai.
  const DIO_LICENSE_PUB_JWK = {
    "kty": "EC", "crv": "P-256",
    "x": "REPLACE_WITH_PUBLIC_X",
    "y": "REPLACE_WITH_PUBLIC_Y"
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

  // ONLINE: Edge Function se naya token le kar mehfooz karo
  async function dioRefreshLicense() {
    try {
      if (typeof supabaseClient === 'undefined' || !supabaseClient) return false;
      const { data: sess } = await supabaseClient.auth.getSession();
      const jwt = sess && sess.session && sess.session.access_token;
      if (!jwt) return false;
      const base = (supabaseClient.functionsUrl) || ((supabaseClient.supabaseUrl || '') + '/functions/v1');
      const res = await fetch(base + '/dio-license', {
        method: 'POST', headers: { 'Authorization': 'Bearer ' + jwt, 'Content-Type': 'application/json' },
      });
      if (!res.ok) return false;
      const j = await res.json();
      if (j && j.token) { localStorage.setItem('dio_license', j.token); return true; }
    } catch (_) {}
    return false;
  }

  // OFFLINE (ya kabhi bhi): mehfooz token faal hai?
  async function dioLicenseValid() {
    const t = localStorage.getItem('dio_license');
    return await _dioVerifyLicenseToken(t);
  }

  window.dioRefreshLicense = dioRefreshLicense;
  window.dioLicenseValid = dioLicenseValid;
  window._dioVerifyLicenseToken = _dioVerifyLicenseToken;   // test ke liye
})();
