/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — mobile.js
   Fon par rawani. Kaam ka asal hissa mobile.css karti hai; ye file
   sirf wo cheezein karti hai jo CSS akeli nahi kar sakti:
     • فارم / کاغذ ka toggle (aur afsar ka intikhab yaad rakhna)
     • "+ نیا اندراج" — angoothe ki pahunch me (fon par serial khane me
       Enter dabana mushkil hai)
     • Table ko card banane ke liye har khane par uska unwan (data-label)
     • Naqsha mauqa — ungli se drawing, do ungliyon se zoom/pan
   Koi DOM node hilayi NAHI jati — save/print bilkul waise hi chalte hain.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var MOBILE_Q = '(max-width: 900px)';
  var KEY_MODE = 'dio_doc_view';          // 'form' | 'paper'

  function isMobile() {
    try { return window.matchMedia(MOBILE_Q).matches; } catch (_) { return window.innerWidth <= 900; }
  }
  function docEl() { return document.getElementById('ch173-doc') || document.getElementById('r173-doc'); }

  // ── 1) FORM / KAGHAZ ─────────────────────────────────────────
  function mode() {
    try { return localStorage.getItem(KEY_MODE) || 'form'; } catch (_) { return 'form'; }
  }
  function setMode(m) {
    try { localStorage.setItem(KEY_MODE, m); } catch (_) {}
    apply();
  }
  function apply() {
    var on = isMobile() && mode() === 'form' && !!docEl();
    document.documentElement.classList.toggle('dio-mform', on);
    var bar = document.querySelector('.dio-mbar');
    if (bar) {
      var f = bar.querySelector('[data-m="form"]'), p = bar.querySelector('[data-m="paper"]');
      if (f) f.classList.toggle('on', on);
      if (p) p.classList.toggle('on', !on);
    }
    var add = document.querySelector('.dio-addblk');
    if (add) add.style.display = (on && hasBlocks()) ? '' : 'none';
  }
  function hasBlocks() {
    var d = docEl(); return !!(d && d.querySelector('tr.zf-blk'));
  }

  function buildBar() {
    var d = docEl(); if (!d || !isMobile()) return;
    if (document.querySelector('.dio-mbar')) return;
    var host = d.parentElement; if (!host) return;
    var bar = document.createElement('div');
    bar.className = 'dio-mbar no-print';
    bar.innerHTML =
      '<button type="button" data-m="form"><svg viewBox=\'0 0 24 24\' width=\'15\' height=\'15\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'1.9\' stroke-linecap=\'round\' stroke-linejoin=\'round\' aria-hidden=\'true\' style=\'vertical-align:-2px\'><path d=\'M4.5 4h15v16h-15z\'/><path d=\'M8 9h8\'/><path d=\'M8 12.5h8\'/><path d=\'M8 16h5\'/></svg> فارم</button>' +
      '<button type="button" data-m="paper"><svg viewBox=\'0 0 24 24\' width=\'15\' height=\'15\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'1.9\' stroke-linecap=\'round\' stroke-linejoin=\'round\' aria-hidden=\'true\' style=\'vertical-align:-2px\'><path d=\'M7 3h7l4 4v14H7z\'/><path d=\'M14 3v5h5\'/></svg> کاغذ</button>' +
      '<span class="sp"></span>' +
      '<span style="font-size:11px;color:var(--text-muted,#7d97ad)">چھپائی ہمیشہ A4</span>';
    bar.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-m]') : null;
      if (b) setMode(b.getAttribute('data-m'));
    });
    host.insertBefore(bar, d);

    if (!document.querySelector('.dio-addblk') && hasBlocks()) {
      var add = document.createElement('button');
      add.type = 'button';
      add.className = 'dio-addblk no-print';
      add.innerHTML = "<svg viewBox=\'0 0 24 24\' width=\'15\' height=\'15\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'1.9\' stroke-linecap=\'round\' stroke-linejoin=\'round\' aria-hidden=\'true\' style=\'vertical-align:-2px\'><path d=\'M12 5v14\'/><path d=\'M5 12h14\'/></svg>" + ' نیا اندراج';
      add.addEventListener('click', function () {
        try {
          if (typeof window._zimniAddBlock === 'function') {
            window._zimniAddBlock();
            // naye block ke halaat khane par le jao
            setTimeout(function () {
              var rows = docEl() ? docEl().querySelectorAll('tr.zf-blk') : [];
              var last = rows[rows.length - 1];
              var body = last && last.querySelector('.zf-body');
              if (body) { body.focus(); body.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
            }, 60);
          }
        } catch (_) {}
      });
      document.body.appendChild(add);
    }
    apply();
  }

  // ── 2) TABLE → CARD (har khane par uska unwan) ───────────────
  //  CSS `td::before{content:attr(data-label)}` se card banata hai —
  //  magar data-label yahan se lagana paRta hai (thead ke unwan se).
  function labelTables(root) {
    var scope = root || document;
    var tables = scope.querySelectorAll('table.data-table, table.dio-cards');
    Array.prototype.forEach.call(tables, function (t) {
      var head = t.tHead && t.tHead.rows.length ? t.tHead.rows[0] : null;
      if (!head) return;
      var names = Array.prototype.map.call(head.cells, function (c) {
        return (c.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24);
      });
      if (!t.classList.contains('dio-cards')) t.classList.add('dio-cards');
      Array.prototype.forEach.call(t.tBodies, function (tb) {
        Array.prototype.forEach.call(tb.rows, function (r) {
          Array.prototype.forEach.call(r.cells, function (c, i) {
            if (c.hasAttribute('data-label')) return;
            var n = names[i] || '';
            // Amal/buttons wala khana — koi unwan nahi, poori qatar
            if (c.querySelector('button, .btn') && (!n || n.length < 3)) {
              c.classList.add('dio-actions'); c.setAttribute('data-label', '');
            } else {
              c.setAttribute('data-label', n);
            }
          });
        });
      });
    });
  }

  // ── 3) NAQSHA MAUQA — ungli se drawing, do ungli se zoom/pan ──
  //  Fabric.js mouse ke liye bana hai; yahan touch ko us tak pahunchate
  //  hain aur do-ungli ke ishare ko zoom/pan bana dete hain.
  var _naqTouchOn = false;
  function wireNaqshaTouch() {
    if (_naqTouchOn) return;
    var cv = document.getElementById('naq-canvas');
    if (!cv) return;
    _naqTouchOn = true;

    var upper = cv.parentElement ? cv.parentElement.querySelector('.upper-canvas') || cv : cv;
    var last = null, startDist = 0, startZoom = 1;

    function dist(t) {
      var dx = t[0].clientX - t[1].clientX, dy = t[0].clientY - t[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }
    function mid(t) {
      return { x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 };
    }

    upper.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) {
        startDist = dist(e.touches);
        try { startZoom = (window._naqCanvas && window._naqCanvas.getZoom()) || 1; } catch (_) { startZoom = 1; }
        last = mid(e.touches);
        e.preventDefault();          // do ungli = zoom/pan, drawing nahi
      }
    }, { passive: false });

    upper.addEventListener('touchmove', function (e) {
      if (e.touches.length !== 2) return;
      e.preventDefault();
      var c = window._naqCanvas; if (!c) return;
      try {
        var d = dist(e.touches);
        if (startDist > 0) {
          var z = Math.min(4, Math.max(0.25, startZoom * (d / startDist)));
          var m = mid(e.touches);
          var r = upper.getBoundingClientRect();
          c.zoomToPoint({ x: m.x - r.left, y: m.y - r.top }, z);
          if (last) {                      // do ungli khiskao → pan
            var vt = c.viewportTransform;
            vt[4] += (m.x - last.x); vt[5] += (m.y - last.y);
            c.setViewportTransform(vt);
          }
          last = m;
        }
      } catch (_) {}
    }, { passive: false });

    upper.addEventListener('touchend', function () { last = null; startDist = 0; }, { passive: true });

    // Ungli se drawing ke doran safha na khiske
    upper.style.touchAction = 'none';
  }

  // ── 4) ANGOOTHE KI PATTI (aik haath se) ──────────────────────
  /* Nishan SVG hain (emoji nahi): har Android/iOS par aik jaisa dikhte
     hain aur `currentColor` se chaley hue safhe ka rang le lete hain. */
  var THUMB = [
    { p: 'dashboard', ic: "<svg viewBox='0 0 24 24' width='21' height='21' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M4 10.5L12 4l8 6.5V20H4z'/><path d='M9.5 20v-6h5v6'/></svg>", t: 'ہوم' },
    { p: 'cases',     ic: "<svg viewBox='0 0 24 24' width='21' height='21' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M3.5 7.5h6l2 2.5h9V19a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 19z'/></svg>", t: 'مقدمات' },
    { p: 'search',    ic: "<svg viewBox='0 0 24 24' width='21' height='21' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><circle cx='11' cy='11' r='6.5'/><path d='M16 16l4.5 4.5'/></svg>", t: 'تلاش' },
    { p: 'reminders', ic: "<svg viewBox='0 0 24 24' width='21' height='21' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5S6.5 14 6.5 10z'/><path d='M10.2 19a2 2 0 0 0 3.6 0'/></svg>", t: 'یاددہانی' }
  ];
  function buildThumbBar() {
    if (!isMobile() || document.querySelector('.dio-thumbbar')) return;
    var app = document.getElementById('main-app');
    if (!app || app.style.display === 'none') return;
    var bar = document.createElement('nav');
    bar.className = 'dio-thumbbar no-print';
    bar.innerHTML = THUMB.map(function (b) {
      return '<button type="button" data-p="' + b.p + '"><span class="ic">' + b.ic + '</span>' + b.t + '</button>';
    }).join('');
    bar.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-p]') : null;
      if (!b) return;
      try {
        var _p = b.getAttribute('data-p');
        // "مقدمات" = ہمیشہ تمام مقدمات (ڈیش بورڈ کا پچھلا فلٹر نہ چپکا رہے)
        if (_p === 'cases' && typeof window.dioOpenCases === 'function') window.dioOpenCases('');
        else if (typeof showPage === 'function') showPage(_p, null);
      } catch (_) {}
      markThumb(b.getAttribute('data-p'));
    });
    document.body.appendChild(bar);
    document.body.classList.add('dio-hasthumb');
    markThumb((location.hash || '').replace('#', '') || 'dashboard');
  }
  function markThumb(p) {
    var bar = document.querySelector('.dio-thumbbar'); if (!bar) return;
    Array.prototype.forEach.call(bar.querySelectorAll('[data-p]'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-p') === p);
    });
  }

  // ── 5) Safhe badalne par dobara lagao ────────────────────────
  function refresh() {
    try { buildThumbBar(); } catch (_) {}
    try { buildBar(); } catch (_) {}
    try { apply(); } catch (_) {}
    try { if (isMobile()) labelTables(document.getElementById('page-content') || document); } catch (_) {}
    try { wireNaqshaTouch(); } catch (_) {}
  }

  var _t = null;
  var obs = new MutationObserver(function () {
    clearTimeout(_t); _t = setTimeout(refresh, 180);
  });

  function start() {
    refresh();
    try {
      var host = document.getElementById('page-content') || document.body;
      obs.observe(host, { childList: true, subtree: true });
    } catch (_) {}
    try {
      window.matchMedia(MOBILE_Q).addEventListener('change', refresh);
    } catch (_) { window.addEventListener('resize', function () { clearTimeout(_t); _t = setTimeout(refresh, 250); }); }
    window.addEventListener('orientationchange', function () { setTimeout(refresh, 300); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  // Bahar se bhi bulaya ja sake
  window.dioMobile = { refresh: refresh, setMode: setMode, labelTables: labelTables, isMobile: isMobile };
})();
