/* ════════════════════════════════════════════════════════════════════
   DIGITAL IO — secure-storage.js   (Khami 2 ka baqaya hissa)
   ────────────────────────────────────────────────────────────────────
   Khami 2 kehti thi: "refresh token localStorage me". Hum ne auth.js me
   apne dio_pin_rt / dio_bio_rt to encrypt kar diye the, MAGAR Supabase
   apna session (access + refresh token) KHUD localStorage me SADA MATN
   me rakhta hai (persistSession default = true). Ye us gap ko band karta
   hai: Supabase ko aik CUSTOM storage adapter diya jata hai jo har value
   AES-GCM se encrypt kar ke rakhta hai. Key IndexedDB me non-extractable
   hai (wahi 'tok' record jo auth.js istemaal karta hai — aik hi key).

   MEHFOOZ DEGRADE (field officer kabhi phanse na):
     • Purani SADA value mile to jyun ki tyun wapas (khud-ba-khud migrate).
     • Crypto/IndexedDB dastyab na ho (private window, cleared data) to
       sada localStorage par lautta hai — login todta NAHI.
     • Koi method kabhi throw nahi karti (Supabase auth toot jata).
   index.html me app-core.js se PEHLE load karein.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // AHEM: auth.js bhi 'dio_sec' database (store 'keys') istemaal karta hai.
  // Pehle yahan bhi 'dio_sec' magar store 'k' tha — aik hi DB, aik hi version:
  // onupgradeneeded sirf AIK baar chalta hai, to sirf AIK store banta tha aur
  // dusre module ka har transaction NotFoundError se marta tha — yaani do me se
  // aik encryption layer KHAMOSHI se band ho jati thi. Ab ALAG database:
  var DB = 'dio_sec_store', STORE = 'k', REC = 'tok', PFX = 'enc1$';

  function _idb() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open(DB, 1);
      r.onupgradeneeded = function () {
        try { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE); } catch (_) {}
      };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }
  function _get(db, k) {
    return new Promise(function (res, rej) {
      var t = db.transaction(STORE, 'readonly').objectStore(STORE).get(k);
      t.onsuccess = function () { res(t.result); }; t.onerror = function () { rej(t.error); };
    });
  }
  function _put(db, k, v) {
    return new Promise(function (res, rej) {
      var t = db.transaction(STORE, 'readwrite').objectStore(STORE).put(v, k);
      t.onsuccess = function () { res(); }; t.onerror = function () { rej(t.error); };
    });
  }

  // Do tab/PWA window aik sath cold-start karein to dono key bana kar
  // aik dusre ki key par likh dete the — purane enc1$ blob phir kabhi na
  // khulte. Is liye get-or-create AIK hi readwrite transaction me.
  //  AHEM: pehle key IndexedDB transaction ke ANDAR banayi jati thi. Magar
  //  IndexedDB ka transaction tab khud band ho jata hai jab event loop khali
  //  ho, aur crypto.subtle.generateKey sust device par der se jawab de sakta
  //  hai — us waqt tak tx murda, `put` nakaam, aur promise KABHI hal na ho
  //  (yaani login hang). Is liye ab: key PEHLE banao, phir AIK readwrite
  //  transaction me "jo pehle se hai wo lo, warna ye rakh do".
  function _getOrCreate(db, fresh) {
    return new Promise(function (res, rej) {
      var tx, os, g;
      try { tx = db.transaction(STORE, 'readwrite'); os = tx.objectStore(STORE); }
      catch (e) { rej(e); return; }
      var done = false;
      var finish = function (k) { if (!done) { done = true; res(k); } };
      g = os.get(REC);
      g.onerror   = function () { rej(g.error); };
      g.onsuccess = function () {
        if (g.result) { finish(g.result); return; }     // dusre tab ki key jeet gayi
        try { os.put(fresh, REC); } catch (e) { rej(e); return; }
      };
      tx.oncomplete = function () { finish(fresh); };
      tx.onabort    = function () { rej(tx.error || new Error('tx abort')); };
      tx.onerror    = function () { rej(tx.error || new Error('tx error')); };
    });
  }

  var _keyP = null;
  function _key() {
    if (_keyP) return _keyP;
    _keyP = (async function () {
      var db = await _idb();
      // key pehle — transaction ke bahar
      var fresh = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
      return await _getOrCreate(db, fresh);
    })();
    _keyP.catch(function () { _keyP = null; });   // nakaami cache na ho — agli baar phir koshish
    return _keyP;
  }

  var _b64 = function (buf) { return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))); };
  var _unb64 = function (s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); };

  async function _enc(plain) {
    var key = await _key();
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(plain));
    return PFX + _b64(iv) + '$' + _b64(ct);
  }
  async function _dec(stored) {
    var parts = String(stored).split('$');           // enc1 $ iv $ ct
    if (parts.length !== 3) return null;
    var key = await _key();
    var pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: _unb64(parts[1]) }, key, _unb64(parts[2]));
    return new TextDecoder().decode(pt);
  }

  // Supabase v2 async storage adapter — koi method kabhi throw na kare
  window.dioSecureStorage = {
    getItem: async function (k) {
      try {
        var v = localStorage.getItem(k);
        if (v === null || v === undefined) return null;
        if (String(v).indexOf(PFX) !== 0) return v;      // purani sada value — migrate
        var out = await _dec(v);
        if (out === null) { try { localStorage.removeItem(k); } catch (_) {} }  // kharab blob na chhoro
        return out;
      } catch (_) { return null; }
    },
    setItem: async function (k, v) {
      try { localStorage.setItem(k, await _enc(String(v))); }
      catch (e) {
        // Encryption nakaam — sada rakh lo (login na tootay) MAGAR chup na raho
        try { if (window.dioLogError) dioLogError('secure-storage: encryption band, sada storage par', e); } catch (_) {}
        try { localStorage.setItem(k, String(v)); } catch (_e) {}
      }
    },
    removeItem: async function (k) {
      try { localStorage.removeItem(k); } catch (_) {}
    }
  };
})();
