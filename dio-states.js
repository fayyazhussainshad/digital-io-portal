/* ═══════════════════════════════════════════════════════════════════
   DIGITAL IO — UI States utility  (dio-states.js)
   Audit "Change #5" — har page consistently dikhaye:
     loading · loaded · empty · offline · permission-denied · session-expired
     · server-error · retrying · saving · saved · pending-sync

   Kyun zaruri: currently 43+ ad-hoc "لوڈ..." strings, alag alag styles.
   User ko yaqeen nahi kya ho raha — audit ne isko dramatically improve
   trust wala issue kaha hai.

   Usage:
     el.innerHTML = DIO.states.loading('مقدمات لوڈ ہو رہے ہیں');
     el.innerHTML = DIO.states.empty('📁', 'کوئی مقدمہ درج نہیں',
                                       'نیا مقدمہ درج کرنے کے لیے upar button دبائیں');
     el.innerHTML = DIO.states.error(err, () => reload());
     el.innerHTML = DIO.states.permDenied();
     el.innerHTML = DIO.states.offline();
     el.innerHTML = DIO.states.sessionExpired();
     el.insertAdjacentHTML('beforeend', DIO.states.savingBadge());
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  // Shared style constants — poore system mein ek jaisa dikhne ke liye
  var STYLE = {
    box:     'text-align:center;padding:32px 20px;direction:rtl;color:var(--text-muted);width:100%;box-sizing:border-box;',
    boxSm:   'text-align:center;padding:20px 16px;direction:rtl;color:var(--text-muted);width:100%;box-sizing:border-box;',
    icon:    'font-size:44px;margin-bottom:12px;line-height:1;',
    iconSm:  'font-size:30px;margin-bottom:8px;line-height:1;',
    title:   'font-size:15px;font-weight:700;margin-bottom:6px;color:var(--text-primary);',
    titleSm: 'font-size:13px;font-weight:700;margin-bottom:4px;color:var(--text-primary);',
    hint:    'font-size:12px;color:var(--text-muted);line-height:1.6;max-width:360px;margin:0 auto;',
    btn:     'padding:8px 18px;border-radius:8px;border:1px solid var(--accent);background:var(--accent);color:#fff;font-size:13px;font-weight:700;cursor:pointer;margin-top:14px;font-family:inherit;',
    btnSec:  'padding:6px 14px;border-radius:8px;border:1px solid var(--border);background:var(--bg-card);color:var(--text-primary);font-size:12px;font-weight:600;cursor:pointer;margin-top:12px;font-family:inherit;'
  };

  // Font wrap — Jameel Noori Nastaleeq for Urdu
  var URDU_FONT = "font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;";

  // Escape helper (esc / DIO.html.text ka safe wrapper)
  function _esc(s) {
    if (s == null) return '';
    if (typeof window.esc === 'function') return window.esc(s);
    if (window.DIO && window.DIO.html && DIO.html.text) return DIO.html.text(s);
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }


  /* ─────────────────────────────────────────────────────────────
     NISHAN (icons) — emoji ki jagah SVG
     Wajah: emoji har device/OS par alag dikhte hain (Android par rangeen,
     Windows par kuch bilkul nahi), aur sarkari dastavez ke sath maail
     nahi khate. Ye SVG `currentColor` istemal karte hain — is liye har
     theme (roshan/tareek) me khud-ba-khud theek rehte hain.

     AHEM (hifazat): `empty()` pehle `_esc(icon)` karta tha, yani icon
     matn samjha jata tha. Ab icon sirf is DAFTAR se aata hai — chaahe
     caller kuch bhi de. Bahar se aaya hua koi HTML yahan nahi pahunchta,
     is liye XSS ka koi raasta nahi banta. */
  var ICON_PATHS = {
    doc:    '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="M10 13h6"/><path d="M10 17h4"/>',
    folder: '<path d="M3.5 7.5h6l2 2.5h9V19a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 19z"/>',
    list:   '<path d="M8 4h8v3H8z"/><path d="M9 4H6v17h12V4h-3"/><path d="M9 11h6"/><path d="M9 15h6"/>',
    user:   '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
    alert:  '<path d="M12 4L3 19.5h18z"/><path d="M12 10v4.5"/><path d="M12 17.2h.01"/>',
    lock:   '<path d="M5.5 11h13v9.5h-13z"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>',
    unlock: '<path d="M5.5 11h13v9.5h-13z"/><path d="M8.5 11V8a3.5 3.5 0 0 1 6.4-2"/>',
    clock:  '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.2l3.2 2"/>',
    signal: '<path d="M4.5 15a10.5 10.5 0 0 1 15 0"/><path d="M8 18.2a6 6 0 0 1 8 0"/><path d="M12 21h.01"/><path d="M2 11.5a14.5 14.5 0 0 1 20 0"/>',
    cloud:  '<path d="M7.5 19a4.5 4.5 0 0 1 0-9 6 6 0 0 1 11.3 1.6A3.7 3.7 0 0 1 18 19z"/>',
    save:   '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v6h7V4"/><path d="M8 20v-6h8v6"/>',
    check:  '<path d="M4.5 12.5l5 5 10-11"/>',
    refresh:'<path d="M20 11a8 8 0 1 0-.6 4"/><path d="M20 4.5V11h-6.5"/>',
    court:  '<path d="M12 4v16"/><path d="M6 20h12"/><path d="M4 9l3-4 3 4"/><path d="M14 9l3-4 3 4"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'
  };
  /* emoji → nishan ka naam (purane callers bina badle chalte rahein) */
  var ICON_ALIAS = {
    '\ud83d\udcc1':'folder', '\ud83d\udcc2':'folder', '\ud83d\udcc4':'doc',
    '\ud83d\udccb':'list',   '\ud83d\udc64':'user',   '\u26a0':'alert',
    '\ud83d\udd12':'lock',   '\ud83d\udd13':'unlock', '\u23f0':'clock',
    '\u23f3':'clock',         '\ud83d\udce1':'signal', '\u2601':'cloud',
    '\ud83d\udcbe':'save',   '\u2705':'check',         '\ud83d\udd04':'refresh',
    '\u2696':'court',         '\ud83d\udd0d':'search', '\ud83d\udcda':'list'
  };
  function _icon(key, size, extra) {
    var name = ICON_PATHS[key] ? key
             : (ICON_ALIAS[String(key || '').replace(/\ufe0f/g, '').charAt(0)] || 'doc');
    var sz = size || 40;
    return '<svg viewBox="0 0 24 24" width="' + sz + '" height="' + sz + '" fill="none" ' +
           'stroke="currentColor" stroke-width="' + (sz >= 36 ? 1.5 : 1.8) + '" ' +
           'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ' +
           'style="opacity:.45;display:inline-block;vertical-align:middle;' + (extra || '') + '">' +
           ICON_PATHS[name] + '</svg>';
  }

  var DIO_STATES = {
    // ── LOADING ─────────────────────────────────────────────
    loading: function (msg) {
      msg = msg || 'لوڈ ہو رہا ہے...';
      return '<div style="' + STYLE.box + URDU_FONT + '">' +
             '  <div style="' + STYLE.icon + '"><span class="dio-spin" style="display:inline-block;animation:dio-rot 1.2s linear infinite;">' + _icon('refresh', 40) + '</span></div>' +
             '  <div style="' + STYLE.title + URDU_FONT + '">' + _esc(msg) + '</div>' +
             _spinnerCSS() +
             '</div>';
    },

    loadingSm: function (msg) {
      msg = msg || 'لوڈ ہو رہا ہے...';
      return '<div style="' + STYLE.boxSm + URDU_FONT + '">' +
             '<span style="display:inline-block;animation:dio-rot 1.2s linear infinite;margin-left:6px;">' + _icon('refresh', 18) + '</span>' +
             _esc(msg) + _spinnerCSS() + '</div>';
    },

    // ── EMPTY (no data) ─────────────────────────────────────
    empty: function (icon, title, hint, action) {
      icon  = icon  || 'doc';
      title = title || 'کوئی ریکارڈ نہیں';
      var actionBtn = '';
      if (action && action.label && action.onClick) {
        actionBtn = '<button type="button" onclick="' + _esc(action.onClick) + '" style="' + STYLE.btn + URDU_FONT + '">' + _esc(action.label) + '</button>';
      }
      return '<div style="' + STYLE.box + URDU_FONT + '">' +
             '  <div style="' + STYLE.icon + '">' + _icon(icon, 44) + '</div>' +
             '  <div style="' + STYLE.title + URDU_FONT + '">' + _esc(title) + '</div>' +
             (hint ? '  <div style="' + STYLE.hint + URDU_FONT + '">' + _esc(hint) + '</div>' : '') +
             actionBtn +
             '</div>';
    },

    // ── ERROR ───────────────────────────────────────────────
    // retryFnName: window par mojood function ka naam (string) — retry button
    error: function (err, retryFnName) {
      var msg = 'ایک مسئلہ ہوا';
      try {
        if (window.DIO && DIO.errors && DIO.errors.userMessage) msg = DIO.errors.userMessage(err);
        else if (err && err.message) msg = String(err.message);
      } catch (_) {}
      var retry = '';
      if (retryFnName) {
        retry = '<button type="button" onclick="' + _esc(retryFnName) + '()" style="' + STYLE.btn + URDU_FONT + '">دوبارہ کوشش کریں</button>';
      }
      return '<div style="' + STYLE.box + URDU_FONT + '">' +
             '  <div style="' + STYLE.icon + '">' + _icon('alert', 44) + '</div>' +
             '  <div style="' + STYLE.title + 'color:var(--red);' + URDU_FONT + '">مسئلہ</div>' +
             '  <div style="' + STYLE.hint + URDU_FONT + '">' + _esc(msg) + '</div>' +
             retry + '</div>';
    },

    // ── PERMISSION DENIED ───────────────────────────────────
    permDenied: function (msg) {
      return '<div style="' + STYLE.box + URDU_FONT + '">' +
             '  <div style="' + STYLE.icon + '">' + _icon('lock', 44) + '</div>' +
             '  <div style="' + STYLE.title + URDU_FONT + '">اجازت نہیں</div>' +
             '  <div style="' + STYLE.hint + URDU_FONT + '">' + _esc(msg || 'یہ صفحہ / ریکارڈ دیکھنے کی اجازت نہیں۔ اپنے SHO یا سپروائزر سے رابطہ کریں') + '</div>' +
             '</div>';
    },

    // ── SESSION EXPIRED ─────────────────────────────────────
    sessionExpired: function () {
      return '<div style="' + STYLE.box + URDU_FONT + '">' +
             '  <div style="' + STYLE.icon + '">' + _icon('clock', 44) + '</div>' +
             '  <div style="' + STYLE.title + URDU_FONT + '">سیشن ختم ہو چکا</div>' +
             '  <div style="' + STYLE.hint + URDU_FONT + '">حفاظت کے لیے دوبارہ لاگ ان کریں</div>' +
             '  <button type="button" onclick="location.reload()" style="' + STYLE.btn + URDU_FONT + '">دوبارہ لاگ ان</button>' +
             '</div>';
    },

    // ── OFFLINE ─────────────────────────────────────────────
    offline: function (msg) {
      return '<div style="' + STYLE.box + URDU_FONT + '">' +
             '  <div style="' + STYLE.icon + '">' + _icon('signal', 44) + '</div>' +
             '  <div style="' + STYLE.title + URDU_FONT + '">آف لائن</div>' +
             '  <div style="' + STYLE.hint + URDU_FONT + '">' + _esc(msg || 'انٹرنیٹ کنکشن نہیں — کچھ کام مقامی طور پر ہو رہا ہے') + '</div>' +
             '</div>';
    },

    // ── INLINE BADGES (small — top-corner ya toolbar) ───────
    savingBadge: function () {
      return '<span class="dio-badge" style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--amber);' + URDU_FONT + '">' +
             '<span style="display:inline-block;animation:dio-rot 1.2s linear infinite;">' + _icon('refresh', 13) + '</span> محفوظ ہو رہا ہے…' +
             _spinnerCSS() + '</span>';
    },

    savedBadge: function (whenIso) {
      var t = '';
      if (whenIso) {
        try { t = (window.DIO && DIO.date) ? (' · ' + DIO.date.time(whenIso)) : ''; } catch (_) {}
      }
      return '<span class="dio-badge" style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--green);' + URDU_FONT + '">' +
             _icon('check', 13) + ' محفوظ' + _esc(t) + '</span>';
    },

    pendingSyncBadge: function (count) {
      var n = (count && count > 0) ? count : '';
      return '<span class="dio-badge" style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--amber);' + URDU_FONT + '">' +
             _icon('cloud', 13) + ' سنک باقی' + (n ? ' (' + n + ')' : '') + '</span>';
    },

    offlineBadge: function () {
      return '<span class="dio-badge" style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--text-muted);' + URDU_FONT + '">' +
             _icon('signal', 13) + ' آف لائن' + '</span>';
    }
  };

  // Spinner CSS injected once (deduplicated by id)
  function _spinnerCSS() {
    if (typeof document === 'undefined') return '';
    if (document.getElementById('dio-states-css')) return '';
    var s = document.createElement('style');
    s.id = 'dio-states-css';
    s.textContent = '@keyframes dio-rot { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }';
    try { document.head.appendChild(s); } catch (_) {}
    return '';
  }

  window.DIO = window.DIO || {};
  window.DIO.states = DIO_STATES;
})();
