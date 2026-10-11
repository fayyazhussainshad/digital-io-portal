/* ════════════════════════════════════════════════════════════════════
   DIGITAL IO — error-handler.js   (Finding 13 — khamosh khrabiyan pakRo)
   ────────────────────────────────────────────────────────────────────
   Poore system me 961 khali catch(_){} the — khrabiyan chup jati thin.
   Ye chhota, KHUD-MUKHTAR handler har uncaught error aur promise-rejection
   ko pakaR kar:
     • console par saaf likhta hai,
     • aakhri 50 errors localStorage ring-buffer me rakhta hai (afsar ke
       "mera record"/support ke liye — dioGetErrors() se dekhein),
     • ONLINE ho to (agar `client_errors` table mojood ho) best-effort
       server par bhejta hai — table na ho to khamoshi se chhoR deta hai.
   Ye kabhi khud throw nahi karta aur kisi app-logic ko nahi badalta.
   index.html me SAB SE PEHLE load karein taake shuru ki errors bhi aayen.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var KEY = 'dio_err_log', MAX = 50;
  var _recent = [];   // in-memory de-dupe (spam roko)

  // ── REDACTION ─────────────────────────────────────────────────
  //  Error ka matn aksar bheja hua data doharata hai (PostgREST ki ghalti
  //  me field ki value aa jati hai). CNIC, mobile, token, password waghera
  //  log me nahi jane chahiyen — khaas kar mushtarik thana device par.
  function _redact(t) {
    var x = String(t == null ? '' : t);
    try {
      x = x.replace(/\b\d{5}-\d{7}-\d\b/g, '[CNIC]')          // 35202-1234567-1
           .replace(/\b\d{13}\b/g, '[CNIC]')                    // bina dash
           .replace(/\b(?:\+92|0)3\d{2}[- ]?\d{7}\b/g, '[MOBILE]')
           .replace(/\b[\w.%+-]+@[\w.-]+\.[a-z]{2,}\b/gi, '[EMAIL]')
           .replace(/(eyJ[\w-]+\.[\w-]+\.)[\w-]+/g, '$1[JWT]')  // JWT
           .replace(/((?:password|passwd|pin|token|apikey|api_key|secret|authorization)\s*[:=]\s*)\S+/gi, '$1[HIDDEN]');
    } catch (_) {}
    return x.slice(0, 500);                                        // lambai ki hadd
  }

  function _store(rec) {
    try {
      var arr = JSON.parse(localStorage.getItem(KEY) || '[]');
      arr.push(rec); while (arr.length > MAX) arr.shift();
      localStorage.setItem(KEY, JSON.stringify(arr));
    } catch (_) {}
  }

  function _remote(rec) {
    try {
      if (!navigator.onLine) return;
      if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
      var oid = null;
      try { oid = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer.id : null; } catch (_) {}
      // best-effort — table na ho to error khamoshi se nazar-andaaz
      supabaseClient.from('client_errors').insert({
        officer_id: oid, message: rec.m, source: rec.s, line: rec.l,
        col: rec.c, stack: rec.st, url: rec.u, ua: rec.ua, at: rec.t
      }).then(function () {}, function () {});
    } catch (_) {}
  }

  function _handle(kind, message, source, line, col, err) {
    try {
      var msg = String(message || (err && err.message) || 'unknown');
      var stack = (err && err.stack) ? String(err.stack).slice(0, 1200) : '';
      var sig = kind + '|' + msg + '|' + (source || '') + ':' + (line || '');
      // 5 second de-dupe (aik hi error baar baar na bhare)
      var now = Date.now();
      _recent = _recent.filter(function (r) { return now - r.t < 5000; });
      if (_recent.some(function (r) { return r.sig === sig; })) return;
      _recent.push({ sig: sig, t: now });

      var rec = { k: kind, m: _redact(msg), s: source || '', l: line || 0, c: col || 0,
        st: _redact(stack), u: String(location.hash || ''), ua: navigator.userAgent, t: new Date().toISOString() };
      try { console.error('[DIO error]', kind, msg, source ? ('@' + source + ':' + line) : '', err || ''); } catch (_) {}
      _store(rec);
      _remote(rec);
    } catch (_) { /* handler khud kabhi na phatte */ }
  }

  window.addEventListener('error', function (e) {
    _handle('error', e.message, e.filename, e.lineno, e.colno, e.error);
  });
  window.addEventListener('unhandledrejection', function (e) {
    var r = e && e.reason;
    _handle('promise', (r && r.message) || r, '', 0, 0, (r && r.stack) ? r : null);
  });

  // Afsar/support ke liye: recent errors parho ya saaf karo
  window.dioGetErrors = function () { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (_) { return []; } };
  window.dioClearErrors = function () { try { localStorage.removeItem(KEY); } catch (_) {} };
  // Manual log (app kahin bhi ahem khrabi report kar sakti hai)
  window.dioLogError = function (message, err) { _handle('manual', message, '', 0, 0, err || null); };
})();
