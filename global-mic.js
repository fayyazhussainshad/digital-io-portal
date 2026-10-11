/* ═══════════════════════════════════════════════════════════
   GLOBAL MIC — poore system ka aik hi mic button
   • Hamesha screen par mojood (har safhe par, form ke andar bhi)
   • Jis field mein cursor ho, dictation usi mein jata hai
   • Urdu (ur-PK) — bolti tehreer usi jagah cursor par lagti hai

   ───────────────────────────────────────────────────────────
   DESKTOP PAR "SUST" HONE KI TEEN ASAL WAJUHAT (ab theek):

   1) `interimResults = false` tha.
      Browser jab tak poora jumla "pakka" na kar le, afsar ko sakreen
      par KUCH nazar nahi aata tha. Desktop Chrome yeh faisla kai
      second baad karta hai — is liye lagta tha ke mic chal hi nahi
      raha. AB: sunta hua matn FORAN neeche patti mein nazar aata hai
      (dastavez mein sirf PAKKA matn jata hai, taake aadha lafz zimni
      mein na reh jaye).

   2) `onend` par seedha `stop()`.
      Chrome khamoshi ke baad session KHUD band kar deta hai —
      `continuous = true` ke bawajood. Har baar afsar ko dobara button
      dabana paRta tha. AB: agar afsar ne khud band nahi kiya to
      session chupke se dobara chal paRta hai.

   3) `onerror` par bhi seedha `stop()`.
      `no-speech` / `network` / `aborted` aam, waqti masle hain —
      unhen mustaqil band samjha jata tha. AB: sirf ijazat waali
      ghalti par band, baqi par jari.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var lastField = null;        // aakhri field jahan cursor tha
  var savedRange = null;       // contenteditable mein cursor ki theek jagah
  var recog = null;
  var wantOn = false;          // afsar ne chalaya hua hai?
  var restarts = 0;            // pe-dar-pe dobara chalne ki ginti
  var lastStart = 0;

  // Kaun si cheez "likhne wali field" hai
  function isField(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.isContentEditable) return true;
    var t = (el.tagName || '').toLowerCase();
    if (t === 'textarea') return true;
    if (t === 'input') {
      var ty = (el.type || 'text').toLowerCase();
      return ['text', 'search', 'url', 'tel', 'email', 'number', ''].indexOf(ty) !== -1;
    }
    return false;
  }

  // Cursor jis field mein gaya, usay yaad rakho
  document.addEventListener('focusin', function (e) {
    if (isField(e.target)) lastField = e.target;
  }, true);
  // contenteditable mein cursor ki theek jagah yaad rakho
  document.addEventListener('selectionchange', function () {
    try {
      var s = window.getSelection();
      if (s && s.rangeCount && lastField && lastField.isContentEditable &&
          lastField.contains(s.anchorNode)) {
        savedRange = s.getRangeAt(0).cloneRange();
      }
    } catch (_) {}
  });

  // Bola hua matn cursor ki theek jagah par daalo
  function insertText(txt) {
    var el = lastField;
    if (!el || !document.body.contains(el)) return;
    try { el.focus(); } catch (_) {}

    if (el.isContentEditable) {
      var sel = window.getSelection();
      if (savedRange) { sel.removeAllRanges(); sel.addRange(savedRange); }
      var range = (sel.rangeCount ? sel.getRangeAt(0) : null);
      if (!range) {                       // cursor nahi mila — aakhir mein
        el.innerText = (el.innerText || '') + txt;
      } else {
        range.deleteContents();
        var node = document.createTextNode(txt);
        range.insertNode(node);
        range.setStartAfter(node);
        range.collapse(true);
        sel.removeAllRanges(); sel.addRange(range);
        savedRange = range.cloneRange();
      }
      // form ko batao ke matn badla (overflow/save waghera chalen)
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      var start = (typeof el.selectionStart === 'number') ? el.selectionStart : el.value.length;
      var end   = (typeof el.selectionEnd   === 'number') ? el.selectionEnd   : el.value.length;
      el.value = el.value.slice(0, start) + txt + el.value.slice(end);
      var pos = start + txt.length;
      try { el.setSelectionRange(pos, pos); } catch (_) {}
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  var ICON_MIC =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="9" y="3" width="6" height="11" rx="3"/>' +
    '<path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>';
  var ICON_REC =
    '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">' +
    '<rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor"/></svg>';

  function setBtn(on) {
    var b = document.getElementById('global-mic-btn');
    if (!b) return;
    b.classList.toggle('rec', !!on);
    b.innerHTML = on ? ICON_REC : ICON_MIC;
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.title = on
      ? '\u0628\u0648\u0644\u062a\u06d2 \u0631\u06c1\u06cc\u06ba \u2014 \u0628\u0646\u062f \u06a9\u0631\u0646\u06d2 \u06a9\u06d2 \u0644\u06cc\u06d2 \u062f\u0628\u0627\u0626\u06cc\u06ba'
      : '\u0622\u0648\u0627\u0632 \u0633\u06d2 \u0644\u06a9\u06be\u06cc\u06ba \u2014 \u067e\u06c1\u0644\u06d2 \u062e\u0627\u0646\u06d2 \u067e\u0631 \u06a9\u0644\u06a9 \u06a9\u0631\u06cc\u06ba';
  }

  /* Neeche ki patti — jo abhi suna ja raha hai wo FORAN dikhati hai.
     Yahi cheez "sust" hone ka ehsas khatam karti hai: afsar bolte hi
     apne alfaz dekh leta hai, chahe browser ne abhi "pakka" na kiya ho. */
  function say(txt, live) {
    var el = document.getElementById('global-mic-live');
    if (!el) return;
    if (!txt) { el.style.display = 'none'; el.textContent = ''; return; }
    el.style.display = 'block';
    el.textContent = txt;
    el.classList.toggle('live', !!live);
  }

  // Afsar ne KHUD band kiya — ab dobara na chale
  function stop() {
    wantOn = false;
    if (recog) {
      try { recog.onend = null; recog.onerror = null; recog.stop(); } catch (_) {}
      recog = null;
    }
    setBtn(false);
    say('');
  }

  // Aik session chalao. Nakami par false.
  function spin() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return false;
    recog = new SR();
    recog.lang = 'ur-PK';
    recog.continuous = true;
    recog.interimResults = true;   // FORAN dikhao — yahi raftaar ka ehsas deta hai
    try { recog.maxAlternatives = 1; } catch (_) {}
    lastStart = Date.now();

    recog.onresult = function (e) {
      var live = '';
      for (var i = e.resultIndex; i < e.results.length; i++) {
        var t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          // PAKKA matn hi dastavez mein jata hai (aadha lafz kabhi nahi)
          if (t) insertText(/\s$/.test(t) ? t : t + ' ');
          restarts = 0;            // kaam ho raha hai
        } else {
          live += t;               // adhoora matn sirf patti mein
        }
      }
      say(live || '\u0633\u0646 \u0631\u06c1\u0627 \u06c1\u06d2\u2026', true);
    };

    /* Chrome khamoshi par session KHUD band kar deta hai (continuous ke
       bawajood). Agar afsar ne band nahi kiya to chupke se dobara chala
       do — usay pata bhi na chale ke session toota tha. */
    recog.onend = function () {
      recog = null;
      if (!wantOn) { setBtn(false); say(''); return; }
      if (Date.now() - lastStart < 400) restarts++; else restarts = 0;
      if (restarts > 5) {          // pe-dar-pe nakami — toofan se bachao
        wantOn = false; setBtn(false);
        say('\u0622\u0648\u0627\u0632 \u0646\u06c1\u06cc\u06ba \u0622 \u0631\u06c1\u06cc \u2014 \u0645\u0627\u0626\u06cc\u06a9 \u062f\u0648\u0628\u0627\u0631\u06c1 \u062f\u0628\u0627\u0626\u06cc\u06ba', false);
        setTimeout(function () { say(''); }, 3500);
        return;
      }
      setTimeout(function () { if (wantOn) spin(); }, 180);
    };

    recog.onerror = function (ev) {
      var code = (ev && ev.error) || '';
      /* Ijazat ka masla = asal rukawat. Baqi (no-speech / aborted /
         network) waqti hain — un par band kar dena hi purani kharabi thi. */
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        wantOn = false;
        say('\u0645\u0627\u0626\u06a9 \u06a9\u06cc \u0627\u062c\u0627\u0632\u062a \u0646\u06c1\u06cc\u06ba \u2014 \u0628\u0631\u0627\u0624\u0632\u0631 \u06a9\u06cc \u062a\u0631\u062a\u06cc\u0628\u0627\u062a \u0645\u06cc\u06ba \u0627\u062c\u0627\u0632\u062a \u062f\u06cc\u062c\u06cc\u06d2', false);
        setTimeout(function () { say(''); }, 4500);
      }
      // baqi surton mein `onend` khud dobara chala dega
    };

    try { recog.start(); return true; }
    catch (_) { recog = null; return false; }
  }

  function start() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      say('\u06cc\u06c1 \u0628\u0631\u0627\u0624\u0632\u0631 \u0622\u0648\u0627\u0632 \u0633\u06d2 \u0644\u06a9\u06be\u0646\u06d2 \u06a9\u06cc \u0633\u06c1\u0648\u0644\u062a \u0646\u06c1\u06cc\u06ba \u062f\u06cc\u062a\u0627', false);
      setTimeout(function () { say(''); }, 4500);
      return;
    }
    if (!lastField || !document.body.contains(lastField)) {
      say('\u067e\u06c1\u0644\u06d2 \u0627\u0633 \u062e\u0627\u0646\u06d2 \u067e\u0631 \u06a9\u0644\u06a9 \u06a9\u0631\u06cc\u06ba \u062c\u06c1\u0627\u06ba \u0644\u06a9\u06be\u0646\u0627 \u06c1\u06d2\u060c \u067e\u06be\u0631 \u0645\u0627\u0626\u06cc\u06a9 \u062f\u0628\u0627\u0626\u06cc\u06ba', false);
      setTimeout(function () { say(''); }, 4500);
      return;
    }
    wantOn = true; restarts = 0;
    setBtn(true);
    say('\u0633\u0646 \u0631\u06c1\u0627 \u06c1\u06d2\u2026', true);
    if (!spin()) { wantOn = false; setBtn(false); say(''); }
  }

  function toggle() { if (wantOn) stop(); else start(); }

  // Button banao (aik hi dafa)
  function mount() {
    if (document.getElementById('global-mic-btn')) return;
    var btn = document.createElement('button');
    btn.id = 'global-mic-btn';
    btn.type = 'button';
    btn.className = 'no-print';
    btn.innerHTML = ICON_MIC;
    btn.setAttribute('aria-label', '\u0622\u0648\u0627\u0632 \u0633\u06d2 \u0644\u06a9\u06be\u06cc\u06ba');
    btn.setAttribute('aria-pressed', 'false');
    btn.title = '\u0622\u0648\u0627\u0632 \u0633\u06d2 \u0644\u06a9\u06be\u06cc\u06ba \u2014 \u067e\u06c1\u0644\u06d2 \u062e\u0627\u0646\u06d2 \u067e\u0631 \u06a9\u0644\u06a9 \u06a9\u0631\u06cc\u06ba';
    // mousedown par focus na chhine (warna cursor field se nikal jata hai)
    btn.addEventListener('mousedown', function (e) { e.preventDefault(); });
    btn.addEventListener('click', function (e) { e.preventDefault(); toggle(); });
    document.body.appendChild(btn);

    // Sunta hua matn dikhane wali patti
    var live = document.createElement('div');
    live.id = 'global-mic-live';
    live.className = 'no-print';
    live.setAttribute('aria-live', 'polite');
    live.style.display = 'none';
    document.body.appendChild(live);

    var css = document.createElement('style');
    css.textContent =
      '#global-mic-btn{position:fixed;inset-inline-start:16px;' +
      'inset-block-end:calc(20px + env(safe-area-inset-bottom,0px));z-index:2147483000;' +
      'width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;' +
      'background:#0b3d64;color:#fff;line-height:1;' +
      'box-shadow:0 6px 18px rgba(11,61,100,.32);display:flex;align-items:center;' +
      'justify-content:center;transition:transform .12s,background .2s;}' +
      '#global-mic-btn:hover{transform:scale(1.06);}' +
      '#global-mic-btn.rec{background:#c2261d;animation:gmicPulse 1.1s infinite;}' +
      /* Angoothe ki patti (mobile) ke ooper rahe — us ke neeche na chhupe */
      'body.dio-hasthumb #global-mic-btn{' +
      'inset-block-end:calc(76px + env(safe-area-inset-bottom,0px));}' +
      '@keyframes gmicPulse{0%{box-shadow:0 0 0 0 rgba(194,38,29,.45);}' +
      '70%{box-shadow:0 0 0 13px rgba(194,38,29,0);}' +
      '100%{box-shadow:0 0 0 0 rgba(194,38,29,0);}}' +
      /* Patti: jo suna ja raha hai wo FORAN yahan — afsar ko intezar na kare */
      '#global-mic-live{position:fixed;inset-inline-start:78px;' +
      'inset-block-end:calc(24px + env(safe-area-inset-bottom,0px));' +
      'z-index:2147482999;max-width:min(62vw,540px);' +
      'padding:9px 14px;border-radius:11px;direction:rtl;text-align:right;' +
      'background:#0f1b2a;color:#fff;font-size:13.5px;line-height:1.9;' +
      'font-family:"Jameel Noori Nastaleeq","Noto Nastaliq Urdu",serif;' +
      'box-shadow:0 8px 24px rgba(15,27,42,.3);' +
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
      '#global-mic-live.live{opacity:.92;}' +
      'body.dio-hasthumb #global-mic-live{' +
      'inset-block-end:calc(80px + env(safe-area-inset-bottom,0px));}' +
      '@media (max-width:520px){#global-mic-live{inset-inline-start:12px;' +
      'inset-inline-end:12px;max-width:none;' +
      'inset-block-end:calc(80px + env(safe-area-inset-bottom,0px));}' +
      'body.dio-hasthumb #global-mic-live{' +
      'inset-block-end:calc(136px + env(safe-area-inset-bottom,0px));}}' +
      '@media print{#global-mic-btn,#global-mic-live{display:none !important;}}';
    document.head.appendChild(css);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
  window._globalMicStop = stop;      // safhe badalne par band karne ke liye
})();
