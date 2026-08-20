/* ═══════════════════════════════════════════════════════════
   GLOBAL MIC — poore system ka aik hi mic button
   • Hamesha screen par mojood (har safhe par, form ke andar bhi)
   • Jis field mein cursor ho, dictation usi mein jata hai
   • Cursor kisi field mein na ho to AAKHRI istemal shuda field mein
   • Urdu (ur-PK) — bolti tehreer usi jagah cursor par lagti hai
   NOTE: yeh mustaqil (standalone) hai — report173 ya kisi form ki
   apni setting ko haath nahi lagata.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var lastField = null;        // aakhri field jahan cursor tha
  var savedRange = null;       // contenteditable mein cursor ki theek jagah
  var recog = null;

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

  function stop() {
    if (recog) { try { recog.stop(); } catch (_) {} recog = null; }
    var b = document.getElementById('global-mic-btn');
    if (b) { b.classList.remove('rec'); b.textContent = '🎙️'; }
  }

  function start() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('آپ کا براؤزر آواز کی پہچان کی حمایت نہیں کرتا'); return; }
    if (!lastField || !document.body.contains(lastField)) {
      alert('پہلے اُس خانے پر کلک کریں جہاں لکھنا ہے، پھر مائیک دبائیں');
      return;
    }
    recog = new SR();
    recog.lang = 'ur-PK';
    recog.continuous = true;
    recog.interimResults = false;       // sirf pakka matn daalo (double na ho)
    var b = document.getElementById('global-mic-btn');
    if (b) { b.classList.add('rec'); b.textContent = '🔴'; }
    recog.onresult = function (e) {
      for (var i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          var t = e.results[i][0].transcript;
          if (t) insertText((/\s$/.test(t) ? t : t + ' '));
        }
      }
    };
    recog.onend = function () { stop(); };
    recog.onerror = function () { stop(); };
    try { recog.start(); } catch (_) { stop(); }
  }

  function toggle() { if (recog) stop(); else start(); }

  // Button banao (aik hi dafa)
  function mount() {
    if (document.getElementById('global-mic-btn')) return;
    var btn = document.createElement('button');
    btn.id = 'global-mic-btn';
    btn.type = 'button';
    btn.textContent = '🎙️';
    btn.title = 'آواز سے لکھیں — پہلے خانے پر کلک کریں پھر یہ دبائیں';
    btn.setAttribute('aria-label', 'آواز سے لکھیں');
    // mousedown par focus na chhine (warna cursor field se nikal jata hai)
    btn.addEventListener('mousedown', function (e) { e.preventDefault(); });
    btn.addEventListener('click', function (e) { e.preventDefault(); toggle(); });
    document.body.appendChild(btn);

    var css = document.createElement('style');
    css.textContent =
      '#global-mic-btn{position:fixed;left:16px;bottom:20px;z-index:2147483000;' +
      'width:54px;height:54px;border-radius:50%;border:none;cursor:pointer;' +
      'background:#0369a1;color:#fff;font-size:24px;line-height:1;' +
      'box-shadow:0 4px 14px rgba(0,0,0,.3);display:flex;align-items:center;' +
      'justify-content:center;transition:transform .12s,background .2s;}' +
      '#global-mic-btn:hover{transform:scale(1.06);}' +
      '#global-mic-btn.rec{background:#dc2626;animation:gmicPulse 1s infinite;}' +
      '@keyframes gmicPulse{0%{box-shadow:0 0 0 0 rgba(220,38,38,.5);}' +
      '70%{box-shadow:0 0 0 12px rgba(220,38,38,0);}' +
      '100%{box-shadow:0 0 0 0 rgba(220,38,38,0);}}' +
      '@media print{#global-mic-btn{display:none !important;}}';
    document.head.appendChild(css);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
  window._globalMicStop = stop;      // safhe badalne par band karne ke liye
})();
