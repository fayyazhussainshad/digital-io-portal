/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — challan-form.js   (چالان کا موبائل فارم)
   ────────────────────────────────────────────────────────────────
   CHALLAN ZIMNI SE MUKHTALIF HAI — is liye tareeqa bhi mukhtalif:

   • Zimni AIK FEHRIST hai (har andraaj `tr.zf-blk`), is liye wahan
     kaghaz ko hi CSS se card bana dena kaafi tha.
   • Challan aik HI qatar ka FORM hai: tbody me sirf 1 `<tr>`, 7 khane,
     jin me se 6 AMOODI (`writing-mode: vertical-rl`) hain taake lamba
     Urdu matn tang column me sama jaye. Yahan "block system" ka koi
     mafhoom nahi — dohrai jane wali qatar hai hi nahi.

   AUR SAB SE AHEM — kaghaz ko HAATH NAHI LAGANA:
     `_printR173` chhapai se pehle `chDoc.style.width = '8.5in'` INLINE
     laga kar naapta hai (report173.js:1065), phir usi naap par matn
     column 7 me neeche bhejta hai. Agar mobile CSS `width:100%
     !important` laga de to INLINE naap HAAR jati hai (important stylesheet
     inline ko harata hai) → chhapai 375px par naapi jati aur challan ki
     safha-bandi TOOT jati. `_ch173AutoSize`/`_ch173AutoFitCols`/
     `_ch173FitPaper` bhi px me naapte hain.
     Is liye: kaghaz apni asal chauRai par, apni jagah, bilkul jyun ka tyun.
     Form aik ALAG panel hai jo sirf `[data-k]` khano se juRa hai.
     Kaghaz chhupane ke liye uske parent ko `height:0; overflow:hidden`
     kiya jata hai — `display:none` HARGIZ nahi (us se naap 0 ho jati
     hai, jaancha gaya).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var MOBILE_Q = '(max-width: 900px)';

  // data-k → (unwan, kis qism ka khana)
  //  'line' = aik satar, 'area' = bara khana
  var FIELDS = [
    ['cl_fir',        'مقدمہ نمبر',                 'line'],
    ['cl_date',       'مورخہ',                      'line'],
    ['cl_jurm',       'جرم',                        'line'],
    ['cl_jurm_suf',   'جرم (تسلسل)',                'line'],
    ['madai',         'نام و پتہ مدعی و مستغیث',    'area'],
    ['ghair_giraftar','ملزمان جو گرفتار نہ ہوئے',   'area'],
    ['zer_hirasat',   'ملزمان — زیر حراست',         'area'],
    ['bar_zamanat',   'ملزمان — برضمانت',           'area'],
    ['mal_qabza',     'مال قبضہ پولیس',             'area'],
    ['shahadat',      'تفصیل شہادت',                'area'],
    ['halaat',        'مختصر حالات مقدمہ معہ جرم',  'area'],
    ['cont_text',     'تسلسل',                      'area'],
    ['gw_case',       'گواہان — مقدمہ',             'line'],
    ['gw_madai',      'گواہان — مدعی',              'line'],
    ['gw_banam',      'گواہان — بنام',              'line'],
    ['gw_thana',      'گواہان — تھانہ',             'line'],
    ['gw_zila',       'گواہان — ضلع',               'line'],
    ['gawah_body',    'فہرست گواہان',               'area'],
    ['gw_sho',        'گواہان — ایس ایچ او',        'line'],
    ['gw_sho_date',   'گواہان — تاریخ',             'line'],
    ['papers_body',   'فہرست کاغذات',               'area'],
    ['sho_name',      'ایس ایچ او — نام/تھانہ',     'line'],
    ['sho_line2',     'ایس ایچ او — سطر ۲',         'line'],
    ['sho_date2',     'ایس ایچ او — تاریخ ۲',       'line'],
    ['sho_line5',     'ایس ایچ او — سطر ۵',         'line'],
    ['sho_date5',     'ایس ایچ او — تاریخ ۵',       'line'],
    ['result_no',     'رزلٹ نمبر',                  'line']
  ];

  function isMobile() {
    try { return window.matchMedia(MOBILE_Q).matches; } catch (_) { return innerWidth <= 900; }
  }
  // Challan ka document = wahi id, MAGAR zimni wali .zf-editor class ke BAGHAIR
  function challanDoc() {
    var d = document.getElementById('ch173-doc');
    if (d && !d.classList.contains('zf-editor')) return d;
    var all = document.querySelectorAll('#ch173-doc');
    for (var i = 0; i < all.length; i++)
      if (!all[i].classList.contains('zf-editor')) return all[i];
    return null;
  }

  var KEY = 'dio_challan_view';      // 'form' | 'paper'
  var _open = false;
  var _wrapEl = null;                // jis dabbe ko humne collapse kiya (HAWALA se)
  var _printing = false;             // chhapai ke doran refresh na chhupaye

  function wantForm() {
    try { return (localStorage.getItem(KEY) || 'form') === 'form'; } catch (_) { return true; }
  }

  function panel() { return document.getElementById('dio-chform'); }

  function build() {
    var doc = challanDoc(); if (!doc) return null;
    var host = doc.parentElement; if (!host) return null;
    var p = panel();
    if (p) p.remove();

    p = document.createElement('div');
    p.id = 'dio-chform';
    p.className = 'dio-chform no-print';

    var html = '<div class="dio-chform-head">' +
      '<button type="button" class="' + (wantForm() ? 'on' : '') + '" data-v="form">📝 فارم</button>' +
      '<button type="button" class="' + (wantForm() ? '' : 'on') + '" data-v="paper">📄 کاغذ</button>' +
      '<span class="sp"></span>' +
      '<span class="hint">چھپائی ہمیشہ اصل فارم پر</span></div>';

    var n = 0;
    FIELDS.forEach(function (f) {
      var k = f[0], label = f[1], kind = f[2];
      var node = doc.querySelector('[data-k="' + k + '"]');
      if (!node) return;                       // is challan me ye khana nahi
      n++;
      // Mulziman ka picker button (agar isi khane me ho)
      var picker = node.parentElement && node.parentElement.querySelector
        ? node.parentElement.querySelector('.acc-pick') : null;
      html += '<div class="dio-chf-row" data-for="' + k + '">' +
        '<div class="dio-chf-lbl">' + label +
        (picker ? ' <button type="button" class="dio-chf-pick" data-pick="' + k + '">ملزمان ▾</button>' : '') +
        '</div>' +
        '<div class="dio-chf-in ' + (kind === 'area' ? 'area' : 'line') + '" ' +
        'contenteditable="true" data-bind="' + k + '"></div></div>';
    });
    if (!n) return null;

    p.innerHTML = html;
    host.insertBefore(p, doc);
    wire(p, doc);
    return p;
  }

  function wire(p, doc) {
    // Kaghaz → form
    pull(p, doc);

    // Form → kaghaz (WAHI node jise save/print parhte hain)
    p.addEventListener('input', function (e) {
      var el = e.target.closest ? e.target.closest('[data-bind]') : null;
      if (!el) return;
      var node = doc.querySelector('[data-k="' + el.getAttribute('data-bind') + '"]');
      if (!node) return;
      node.innerHTML = el.innerHTML;
      try { window._r173Dirty = true; } catch (_) {}
      // Challan ka apna layout chalne do (matn column 7 me neeche jata hai)
      clearTimeout(p._t);
      p._t = setTimeout(function () {
        try { if (typeof _ch173OverflowSettle === 'function') _ch173OverflowSettle(2); } catch (_) {}
      }, 600);
    });

    // Mulziman picker — asal button hi dabao
    p.addEventListener('click', function (e) {
      var v = e.target.closest ? e.target.closest('[data-v]') : null;
      if (v) { show(v.getAttribute('data-v') === 'form'); return; }
      var pk = e.target.closest ? e.target.closest('[data-pick]') : null;
      if (pk) {
        var node = doc.querySelector('[data-k="' + pk.getAttribute('data-pick') + '"]');
        var btn = node && node.parentElement ? node.parentElement.querySelector('.acc-pick') : null;
        if (btn) { show(false); btn.click(); }   // kaghaz dikha kar picker kholo
      }
    });
  }

  // Kaghaz se form me qadren laao
  function pull(p, doc) {
    p = p || panel(); doc = doc || challanDoc();
    if (!p || !doc) return;
    Array.prototype.forEach.call(p.querySelectorAll('[data-bind]'), function (el) {
      if (el === document.activeElement) return;      // likhte waqt na badlo
      var node = doc.querySelector('[data-k="' + el.getAttribute('data-bind') + '"]');
      if (node && el.innerHTML !== node.innerHTML) el.innerHTML = node.innerHTML;
    });
  }

  // Kaghaz chhupao/dikhao — parent ko collapse karke (display:none HARGIZ nahi,
  // warna `_printR173` ki naap sifar ho jati hai)
  function show(formOn) {
    var doc = challanDoc(); if (!doc) return;
    // AHEM: `doc.parentElement` par bharosa NAHI. `beforeprint` par app
    // dastavez ko #dio-nprint-host me LE JATI hai (native chhapai ka tareeqa),
    // to us waqt parent badal chuka hota hai aur hum GHALAT dabbe ko
    // "wapas" karne lagte the. Is liye jise collapse kiya, usi ka hawala.
    var wrap = _wrapEl || doc.parentElement; if (!wrap) return;
    var p = panel(); if (!p) return;
    _open = !!formOn;
    try { localStorage.setItem(KEY, _open ? 'form' : 'paper'); } catch (_) {}
    if (formOn) {
      if (!wrap.hasAttribute('data-dio-h')) {
        wrap.setAttribute('data-dio-h', wrap.style.height || '');
        wrap.setAttribute('data-dio-o', wrap.style.overflow || '');
      }
      _wrapEl = wrap;
      wrap.style.height = '0'; wrap.style.overflow = 'hidden';
      p.style.display = '';
      pull(p, doc);
    } else {
      wrap.style.height = wrap.getAttribute('data-dio-h') || '';
      wrap.style.overflow = wrap.getAttribute('data-dio-o') || '';
      wrap.removeAttribute('data-dio-h'); wrap.removeAttribute('data-dio-o');
      _wrapEl = null;
    }
    Array.prototype.forEach.call(p.querySelectorAll('[data-v]'), function (b) {
      b.classList.toggle('on', (b.getAttribute('data-v') === 'form') === _open);
    });
  }

  // Chhapai se PEHLE kaghaz wapas apni poori halat par — naap sahih rahe
  function restoreForPrint() {
    // Chhapai ke doran refresh() dobara na chhupa de — warna `_printR173`
    // ki px-naap sifar/ghalat ho jati.
    _printing = true;
    // Jise humne collapse kiya tha, WAHI kholo — chahe dastavez ab
    // #dio-nprint-host me chala gaya ho.
    var wrap = _wrapEl;
    if (wrap && wrap.hasAttribute('data-dio-h')) {
      wrap.style.height = wrap.getAttribute('data-dio-h') || '';
      wrap.style.overflow = wrap.getAttribute('data-dio-o') || '';
    }
  }
  window.addEventListener('beforeprint', restoreForPrint);
  window.addEventListener('afterprint', function () {
    _printing = false;
    // Afsar ka intikhab wapas laao
    try { if (isMobile() && panel()) show(wantForm()); } catch (_) {}
  });

  function refresh() {
    if (_printing) return;                       // chhapai chal rahi hai — haath na lagao
    if (!isMobile()) { var p0 = panel(); if (p0) { show(false); p0.remove(); } return; }
    var doc = challanDoc();
    if (!doc) { var p1 = panel(); if (p1) { show(false); p1.remove(); } return; }
    // AHEM: pehle yahan har rebuild par `show(true)` tha — is liye afsar
    // "کاغذ" chunta to bhi form wapas aa jata, aur beforeprint ke baad
    // kaghaz phir chhup jata. Ab wahi nazariya jo afsar ne chuna.
    if (!panel()) { if (build()) show(wantForm()); }
    else pull();
  }

  var _t = null;
  try {
    new MutationObserver(function () { clearTimeout(_t); _t = setTimeout(refresh, 250); })
      .observe(document.getElementById('page-content') || document.body,
               { childList: true, subtree: true });
  } catch (_) {}
  try { window.matchMedia(MOBILE_Q).addEventListener('change', refresh); } catch (_) {}

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh);
  else refresh();

  window.dioChallanForm = { refresh: refresh, show: show, pull: pull, restoreForPrint: restoreForPrint };
})();
