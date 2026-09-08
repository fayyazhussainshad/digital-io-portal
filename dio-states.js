/* ═══════════════════════════════════════════════════════════════════
   DIGITAL IO — UI States utility  (dio-states.js)
   Audit "Change #5" — har page consistently dikhaye:
     loading · loaded · empty · offline · permission-denied · session-expired
     · server-error · retrying · saving · saved · pending-sync

   Kyun zaruri: currently 43+ ad-hoc "⏳ لوڈ..." strings, alag alag styles.
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
    box:     'text-align:center;padding:32px 20px;direction:rtl;color:var(--text-muted);',
    boxSm:   'text-align:center;padding:20px 16px;direction:rtl;color:var(--text-muted);',
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

  var DIO_STATES = {
    // ── LOADING ─────────────────────────────────────────────
    loading: function (msg) {
      msg = msg || 'لوڈ ہو رہا ہے...';
      return '<div style="' + STYLE.box + URDU_FONT + '">' +
             '  <div style="' + STYLE.icon + '"><span class="dio-spin" style="display:inline-block;animation:dio-rot 1.2s linear infinite;">⏳</span></div>' +
             '  <div style="' + STYLE.title + URDU_FONT + '">' + _esc(msg) + '</div>' +
             _spinnerCSS() +
             '</div>';
    },

    loadingSm: function (msg) {
      msg = msg || 'لوڈ ہو رہا ہے...';
      return '<div style="' + STYLE.boxSm + URDU_FONT + '">' +
             '<span style="display:inline-block;animation:dio-rot 1.2s linear infinite;margin-left:6px;">⏳</span>' +
             _esc(msg) + _spinnerCSS() + '</div>';
    },

    // ── EMPTY (no data) ─────────────────────────────────────
    empty: function (icon, title, hint, action) {
      icon  = icon  || '📄';
      title = title || 'کوئی ریکارڈ نہیں';
      var actionBtn = '';
      if (action && action.label && action.onClick) {
        actionBtn = '<button type="button" onclick="' + _esc(action.onClick) + '" style="' + STYLE.btn + URDU_FONT + '">' + _esc(action.label) + '</button>';
      }
      return '<div style="' + STYLE.box + URDU_FONT + '">' +
             '  <div style="' + STYLE.icon + '">' + _esc(icon) + '</div>' +
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
        retry = '<button type="button" onclick="' + _esc(retryFnName) + '()" style="' + STYLE.btn + URDU_FONT + '">🔄 دوبارہ کوشش کریں</button>';
      }
      return '<div style="' + STYLE.box + URDU_FONT + '">' +
             '  <div style="' + STYLE.icon + '">⚠️</div>' +
             '  <div style="' + STYLE.title + 'color:var(--red);' + URDU_FONT + '">مسئلہ</div>' +
             '  <div style="' + STYLE.hint + URDU_FONT + '">' + _esc(msg) + '</div>' +
             retry + '</div>';
    },

    // ── PERMISSION DENIED ───────────────────────────────────
    permDenied: function (msg) {
      return '<div style="' + STYLE.box + URDU_FONT + '">' +
             '  <div style="' + STYLE.icon + '">🔒</div>' +
             '  <div style="' + STYLE.title + URDU_FONT + '">اجازت نہیں</div>' +
             '  <div style="' + STYLE.hint + URDU_FONT + '">' + _esc(msg || 'یہ صفحہ / ریکارڈ دیکھنے کی اجازت نہیں۔ اپنے SHO یا سپروائزر سے رابطہ کریں') + '</div>' +
             '</div>';
    },

    // ── SESSION EXPIRED ─────────────────────────────────────
    sessionExpired: function () {
      return '<div style="' + STYLE.box + URDU_FONT + '">' +
             '  <div style="' + STYLE.icon + '">⏰</div>' +
             '  <div style="' + STYLE.title + URDU_FONT + '">سیشن ختم ہو چکا</div>' +
             '  <div style="' + STYLE.hint + URDU_FONT + '">حفاظت کے لیے دوبارہ لاگ ان کریں</div>' +
             '  <button type="button" onclick="location.reload()" style="' + STYLE.btn + URDU_FONT + '">🔓 دوبارہ لاگ ان</button>' +
             '</div>';
    },

    // ── OFFLINE ─────────────────────────────────────────────
    offline: function (msg) {
      return '<div style="' + STYLE.box + URDU_FONT + '">' +
             '  <div style="' + STYLE.icon + '">📡</div>' +
             '  <div style="' + STYLE.title + URDU_FONT + '">آف لائن</div>' +
             '  <div style="' + STYLE.hint + URDU_FONT + '">' + _esc(msg || 'انٹرنیٹ کنکشن نہیں — کچھ کام مقامی طور پر ہو رہا ہے') + '</div>' +
             '</div>';
    },

    // ── INLINE BADGES (small — top-corner ya toolbar) ───────
    savingBadge: function () {
      return '<span class="dio-badge" style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--amber);' + URDU_FONT + '">' +
             '<span style="display:inline-block;animation:dio-rot 1.2s linear infinite;">💾</span> محفوظ ہو رہا ہے...' +
             _spinnerCSS() + '</span>';
    },

    savedBadge: function (whenIso) {
      var t = '';
      if (whenIso) {
        try { t = (window.DIO && DIO.date) ? (' · ' + DIO.date.time(whenIso)) : ''; } catch (_) {}
      }
      return '<span class="dio-badge" style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--green);' + URDU_FONT + '">' +
             '✅ محفوظ' + _esc(t) + '</span>';
    },

    pendingSyncBadge: function (count) {
      var n = (count && count > 0) ? count : '';
      return '<span class="dio-badge" style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--amber);' + URDU_FONT + '">' +
             '☁️ سنک باقی' + (n ? ' (' + n + ')' : '') + '</span>';
    },

    offlineBadge: function () {
      return '<span class="dio-badge" style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--text-muted);' + URDU_FONT + '">' +
             '📡 آف لائن' + '</span>';
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
