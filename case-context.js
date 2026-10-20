/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — case-context.js  (v552، افسر کی ہدایت اکتوبر 2026)
   مقدمے کے اندر دایاں کلک → اس مقدمے کی تمام تفصیل کی فہرست:
     مقدمہ · مدعی · ملزمان · گواہان · ہمراہی ملازمان · ایف آئی آر / متن ·
     کراس ورژن · تفتیشی افسر · موبائل (چوری شدہ)
   کسی سرخی پر کلک → اس کی تفصیل (مثلاً تمام ملزمان)؛ کسی چیز پر کلک → وہ
   متن اسی جگہ لکھا جاتا ہے جہاں کرسر تھا (ضمنی، چالان، درخواست، کوئی بھی
   لکھنے کا خانہ)۔ کرسر کسی لکھنے کے خانے میں نہ ہو تو متن نقل (Copy) ہو جاتا ہے۔
   • براؤزر کا اپنا مینیو: Shift + دایاں کلک
   • موبائل/ٹیبلٹ (ٹچ): مقدمے کے اندر نیچے «مقدمہ کی تفصیل» کا بٹن — وہی فہرست
   ڈیٹا وہی جو سسٹم میں درج ہے — کچھ گھڑا نہیں جاتا؛ خالی خانہ فہرست میں نہیں آتا۔
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var cache = { id: null, at: 0, data: null };
  var target = null;          // { el, range, start, end } — جہاں متن لکھنا ہے
  var lastEdit = null;        // آخری لکھنے کا خانہ (ٹچ بٹن کے لیے)
  var menu = null;
  var stack = [];             // کھلی سطحیں (واپس کے لیے)

  function E(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function T(v) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }
  function fmtDate(v) {
    if (!v) return '';
    try { return (typeof formatDate === 'function') ? formatDate(v) : String(v); } catch (_) { return String(v); }
  }
  function toast(m, t) { try { if (typeof showToast === 'function') showToast(m, t || 'info', 2600); } catch (_) { /* paigham */ } }

  // ── کون سا مقدمہ کھلا ہے ──
  function caseId() {
    if (!window._inWorkspace) return null;
    var id = null;
    /* global _misalCaseId, currentCaseId, _zimniCaseId */
    try { if (typeof _misalCaseId !== 'undefined' && _misalCaseId) id = _misalCaseId; } catch (_) { /* nahi */ }
    try { if (!id && typeof currentCaseId !== 'undefined' && currentCaseId) id = currentCaseId; } catch (_) { /* nahi */ }
    try { if (!id && typeof _zimniCaseId !== 'undefined' && _zimniCaseId) id = _zimniCaseId; } catch (_) { /* nahi */ }
    return id;
  }

  // ── لکھنے کا خانہ اور کرسر ──
  function editableOf(node) {
    var el = node && (node.nodeType === 1 ? node : node.parentElement);
    if (!el || !el.closest) return null;
    if (el.closest('#dio-cctx')) return null;
    var f = el.closest('input, textarea');
    if (f && !f.readOnly && !f.disabled && /^(text|search|tel|email|url|)$/i.test(f.type || 'text')) return f;
    if (el.isContentEditable) {
      var root = el;
      while (root.parentElement && root.parentElement.isContentEditable) root = root.parentElement;
      return root;
    }
    return null;
  }
  function snap(el) {
    if (!el) return null;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      return { el: el, start: el.selectionStart, end: el.selectionEnd };
    }
    var sel = window.getSelection && window.getSelection();
    var rg = (sel && sel.rangeCount) ? sel.getRangeAt(0).cloneRange() : null;
    if (rg && !el.contains(rg.commonAncestorContainer)) rg = null;
    return { el: el, range: rg };
  }

  function insert(text) {
    var t = target || lastEdit;
    close();
    text = String(text || '');
    if (!text) return;
    if (t && t.el && document.contains(t.el)) {
      var el = t.el;
      try {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.focus();
          var s = (t.start != null) ? t.start : el.value.length, e = (t.end != null) ? t.end : s;
          el.setRangeText(text, s, e, 'end');
          el.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          el.focus();
          var sel = window.getSelection();
          if (t.range) { sel.removeAllRanges(); sel.addRange(t.range); }
          else { var r = document.createRange(); r.selectNodeContents(el); r.collapse(false); sel.removeAllRanges(); sel.addRange(r); }
          var ok = false;
          try { ok = document.execCommand('insertText', false, text); } catch (_) { ok = false; }
          if (!ok) {
            var rg = sel.getRangeAt(0); rg.deleteContents();
            var tn = document.createTextNode(text); rg.insertNode(tn);
            rg.setStartAfter(tn); rg.collapse(true); sel.removeAllRanges(); sel.addRange(rg);
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
        lastEdit = snap(el);
        toast('شامل ہو گیا', 'success');
        return;
      } catch (_) { /* نیچے نقل */ }
    }
    try {
      navigator.clipboard.writeText(text).then(function () {
        toast('نقل ہو گیا — جہاں لکھنا ہو وہاں کرسر رکھ کر Ctrl+V کریں', 'info');
      }, function () { toast('نقل نہ ہو سکا', 'error'); });
    } catch (_) { toast('نقل نہ ہو سکا', 'error'); }
  }

  // ── ڈیٹا (سسٹم میں درج) ──
  async function rows(table, cid) {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) return null;
    if (navigator.onLine === false) return null;
    try {
      var r = await supabaseClient.from(table).select('*').eq('case_id', cid).order('created_at', { ascending: true });
      return (r && !r.error) ? (r.data || []) : null;
    } catch (_) { return null; }
  }
  function local(key) { try { var a = JSON.parse(localStorage.getItem(key) || 'null'); return Array.isArray(a) ? a : null; } catch (_) { return null; } }

  async function load(cid) {
    if (cache.id === cid && cache.data && Date.now() - cache.at < 45000) return cache.data;
    var c = null;
    try { c = (typeof getCase === 'function') ? await getCase(cid) : null; } catch (_) { c = null; }
    var res = await Promise.all([rows('case_accused', cid), rows('case_witnesses', cid), rows('hamrahi_mulazman', cid), rows('fir_matn', cid)]);
    var d = {
      c: c || {},
      acc: res[0] || local('dio_cctx_acc_' + cid) || [],
      wit: res[1] || local('dio_cctx_wit_' + cid) || [],
      staff: res[2] || local('dio_staff_' + cid) || [],
      matn: res[3] || local('dio_firmatn_' + cid) || [],
    };
    // آف لائن کے لیے نقل
    try { if (res[0]) localStorage.setItem('dio_cctx_acc_' + cid, JSON.stringify(res[0])); } catch (_) { /* storage */ }
    try { if (res[1]) localStorage.setItem('dio_cctx_wit_' + cid, JSON.stringify(res[1])); } catch (_) { /* storage */ }
    cache = { id: cid, at: Date.now(), data: d };
    return d;
  }

  // ایک چیز = { label, value, ltr?, sub?:[...] , badge? }
  function it(label, value, opts) {
    value = T(value);
    if (!value) return null;
    var o = { label: label, value: value };
    if (opts) Object.keys(opts).forEach(function (k) { o[k] = opts[k]; });
    return o;
  }
  function clean(list) { return list.filter(Boolean); }
  function person(name, cnic, cell, extra) {
    var sub = clean([
      it('نام و پتہ', name),
      it('شناختی کارڈ', cnic, { ltr: true }),
      it('موبائل نمبر', cell, { ltr: true }),
    ].concat(extra || []));
    return sub;
  }
  function staffLine(s) {
    var rk = { C: 'کانسٹیبل', HC: 'ہیڈ کانسٹیبل', ASI: 'ASI', SI: 'SI', Inspector: 'انسپکٹر' }[s.rank] || T(s.rank);
    return T([s.name, rk, s.service_number].filter(Boolean).join(' '));
  }
  function ioLine() {
    try { if (typeof getIOSignLine === 'function') return T(getIOSignLine()); } catch (_) { /* nahi */ }
    var o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
    return T([o.full_name, o.designation, o.station ? 'تھانہ ' + o.station : ''].filter(Boolean).join(' '));
  }

  function groups(d) {
    var c = d.c || {};
    var o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
    var thana = T(c.case_station || o.station), zila = T(c.case_district || o.district);
    var fir = T(c.fir_number), fdate = fmtDate(c.fir_date), sec = T(c.section_of_law);
    var firLine = T(['مقدمہ نمبر ' + fir, fdate ? 'مورخہ ' + fdate : '', sec ? 'بجرم ' + sec : '', thana ? 'تھانہ ' + thana : ''].join(' '));
    var G = [];

    G.push({ title: 'مقدمہ', items: clean([
      it('مکمل سطر', fir ? firLine : ''),
      it('مقدمہ نمبر', fir, { ltr: true }),
      it('تاریخ اندراج', fdate, { ltr: true }),
      it('تاریخ وقوعہ', fmtDate(c.occurrence_date), { ltr: true }),
      it('بحد / جائے وقوعہ', c.occurrence_place),
      it('دفعات (بجرم)', sec),
      it('تھانہ', thana),
      it('ضلع', zila),
    ]) });

    G.push({ title: 'مدعی', items: clean([
      it('نام و پتہ', c.complainant),
      it('شناختی کارڈ', c.complainant_cnic, { ltr: true }),
      it('موبائل نمبر', c.complainant_cell, { ltr: true }),
      it('پیشہ', c.complainant_profession),
    ]) });

    G.push({ title: 'ملزمان', items: (d.acc || []).map(function (a, i) {
      var nm = T(a.name);
      if (!nm) return null;
      return { label: (i + 1) + '۔ ' + nm, value: nm, sub: person(nm, a.cnic, a.cell || a.mobile),
        badge: a.accused_type === 'cross_version' ? 'کراس ورژن' : '' };
    }).filter(Boolean) });

    // مدعی بھی گواہ ہے (سسٹم کا اصول) — پہلے
    var wit = [];
    if (T(c.complainant)) wit.push({ label: T(c.complainant), value: T(c.complainant), badge: 'مدعی', sub: person(c.complainant, c.complainant_cnic, c.complainant_cell) });
    (d.wit || []).forEach(function (w) {
      var nm = T(w.full_name);
      if (!nm || (T(c.complainant) && nm.replace(/\s/g, '') === T(c.complainant).replace(/\s/g, ''))) return;
      wit.push({ label: nm, value: nm, sub: person(nm, w.cnic, w.cell, [it('پیشہ', w.profession)]) });
    });
    wit.forEach(function (w, i) { w.label = (i + 1) + '۔ ' + w.label; });
    G.push({ title: 'گواہان', items: wit });

    G.push({ title: 'ہمراہی ملازمان', items: (d.staff || []).map(function (s, i) {
      var ln = staffLine(s);
      if (!ln) return null;
      return { label: (i + 1) + '۔ ' + ln, value: ln, sub: clean([it('نام مع عہدہ', ln), it('شناختی کارڈ', s.cnic, { ltr: true }), it('موبائل نمبر', s.mobile, { ltr: true })]) };
    }).filter(Boolean) });

    var firItems = clean([it('مقدمہ نمبر مع تاریخ و جرم', fir ? firLine : '')]);
    var mt = (d.matn || []).filter(function (m) { return (m.type || 'fir') === 'fir' && T(m.matn); });
    mt.forEach(function (m, i) { firItems.push({ label: 'متن ایف آئی آر' + (mt.length > 1 ? ' (' + (i + 1) + ')' : ''), value: String(m.matn).trim(), long: true }); });
    G.push({ title: 'ایف آئی آر', items: firItems });

    var hasCross = false;
    try { hasCross = (typeof caseHasCross === 'function') ? caseHasCross(c) : !!(c.cross_fir_number || c.cross_complainant); } catch (_) { hasCross = false; }
    if (hasCross) {
      var cx = clean([
        it('کراس مقدمہ نمبر', c.cross_fir_number, { ltr: true }),
        it('تاریخ', fmtDate(c.cross_fir_date), { ltr: true }),
        it('کراس مدعی', c.cross_complainant),
        it('شناختی کارڈ', c.cross_complainant_cnic, { ltr: true }),
        it('دفعات', c.cross_section_of_law),
        it('رپٹ نمبر', c.cross_rapat_number, { ltr: true }),
      ]);
      (d.matn || []).filter(function (m) { return m.type === 'cross_version' && T(m.matn); })
        .forEach(function (m, i) { cx.push({ label: 'متن کراس ورژن' + (i ? ' (' + (i + 1) + ')' : ''), value: String(m.matn).trim(), long: true }); });
      G.push({ title: 'کراس ورژن', items: cx });
    }

    G.push({ title: 'تفتیشی افسر', items: clean([
      it('نام مع عہدہ و تھانہ', ioLine()),
      it('نام', o.full_name),
      it('عہدہ', o.designation, { ltr: /^[A-Za-z]/.test(String(o.designation || '')) }),
      it('تھانہ', o.station),
      it('بیلٹ / محکمانہ نمبر', o.badge_number, { ltr: true }),
    ]) });

    if (T(c.theft_imei) || T(c.theft_brand) || T(c.theft_cell)) {
      var imeis = String(c.theft_imei || '').split(',').map(T).filter(Boolean);
      var brands = String(c.theft_brand || '').split(',').map(T);
      var sims = String(c.theft_cell || '').split(',').map(T);
      var mob = [];
      var n = Math.max(Math.ceil(imeis.length / 2), brands.filter(Boolean).length, Math.ceil(sims.filter(Boolean).length / 2));
      for (var i = 0; i < n; i++) {
        var sub = clean([
          it('ماڈل / کمپنی', brands[i]),
          it('IMEI 1', imeis[i * 2], { ltr: true }), it('IMEI 2', imeis[i * 2 + 1], { ltr: true }),
          it('سم 1', sims[i * 2], { ltr: true }), it('سم 2', sims[i * 2 + 1], { ltr: true }),
        ]);
        if (!sub.length) continue;
        var line = T([brands[i] ? 'موبائل فون ' + brands[i] : 'موبائل فون',
          imeis[i * 2] ? 'IMEI ' + imeis[i * 2] : '', imeis[i * 2 + 1] ? '/ ' + imeis[i * 2 + 1] : ''].join(' '));
        mob.push({ label: 'موبائل ' + (i + 1) + (brands[i] ? ' — ' + brands[i] : ''), value: line, sub: sub });
      }
      if (mob.length) G.push({ title: 'موبائل (چوری شدہ)', items: mob });
    }
    return G.filter(function (g) { return g.items && g.items.length; });
  }

  // ── مینیو ──
  var CSS = [
    '#dio-cctx{position:fixed;z-index:100001;min-width:250px;max-width:min(420px,94vw);max-height:72vh;overflow:auto;direction:rtl;',
    '  background:var(--bg-card,#fff);color:var(--text-primary,#0f1923);border:1px solid var(--border,#c8d8e8);border-radius:12px;',
    '  box-shadow:0 18px 44px rgba(9,20,40,.28);font-family:"Jameel Noori Nastaleeq","Noto Nastaliq Urdu",serif;padding:6px;}',
    '#dio-cctx .cc-h{display:flex;align-items:center;gap:8px;padding:6px 8px 8px;border-bottom:1px solid var(--border,#e2e8f0);margin-bottom:4px;}',
    '#dio-cctx .cc-h b{flex:1;font-size:12.5pt;color:var(--accent,#0b3d64);}',
    '#dio-cctx .cc-h button{border:1px solid var(--border,#c8d8e8);background:var(--bg-secondary,#f4f6f9);color:inherit;border-radius:8px;padding:2px 10px;cursor:pointer;font:inherit;font-size:11pt;}',
    '#dio-cctx .cc-i{display:flex;align-items:center;gap:6px;width:100%;text-align:right;border:0;background:none;color:inherit;cursor:pointer;',
    '  padding:6px 10px;border-radius:8px;font:inherit;font-size:12pt;line-height:1.7;}',
    '#dio-cctx .cc-i:hover,#dio-cctx .cc-i:focus-visible{background:var(--hover-bg,rgba(56,189,248,.12));outline:none;}',
    '#dio-cctx .cc-i .cc-l{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '#dio-cctx .cc-i .cc-v{font-size:10.5pt;color:var(--text-muted,#64748b);max-width:48%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '#dio-cctx .cc-i .cc-v.ltr{direction:ltr;unicode-bidi:isolate;font-family:Aptos,"Segoe UI",Arial,sans-serif;}',
    '#dio-cctx .cc-n{font-size:10pt;color:var(--text-muted,#64748b);background:var(--bg-tertiary,#eef2f7);border-radius:999px;padding:0 8px;}',
    '#dio-cctx .cc-b{font-size:9.5pt;background:var(--dio-brass,#c9a227);color:#13294b;border-radius:999px;padding:0 7px;}',
    '#dio-cctx .cc-more{border:1px solid var(--border,#c8d8e8);background:var(--bg-secondary,#f4f6f9);color:inherit;border-radius:6px;cursor:pointer;padding:0 8px;font:inherit;font-size:11pt;line-height:1.6;}',
    '#dio-cctx .cc-f{font-size:9.5pt;color:var(--text-muted,#64748b);padding:6px 10px 2px;border-top:1px solid var(--border,#e2e8f0);margin-top:4px;}',
    '#dio-cctx .cc-empty{padding:10px;color:var(--text-muted,#64748b);font-size:11pt;}',
    '@media (max-width:760px){#dio-cctx{left:8px !important;right:8px !important;top:auto !important;bottom:8px !important;max-width:none;max-height:62vh;}}',
    '#dio-cctx-btn{position:fixed;z-index:9990;inset-inline-start:14px;bottom:calc(84px + env(safe-area-inset-bottom,0px));',
    '  border:0;border-radius:22px;padding:8px 14px;background:var(--dio-file,#13294b);color:#fff;font-family:"Jameel Noori Nastaleeq","Noto Nastaliq Urdu",serif;',
    '  font-size:12pt;box-shadow:0 6px 18px rgba(0,0,0,.25);display:none;}',
    '@media (pointer:coarse){body.workspace-mode #dio-cctx-btn{display:block;}}',
    '@media print{#dio-cctx,#dio-cctx-btn{display:none !important;}}',
  ].join('\n');
  function css() {
    if (document.getElementById('dio-cctx-css')) return;
    var s = document.createElement('style'); s.id = 'dio-cctx-css'; s.textContent = CSS; document.head.appendChild(s);
  }

  function close() {
    if (menu) { try { menu.remove(); } catch (_) { /* pehle hi hata */ } }
    menu = null; stack = [];
    document.removeEventListener('keydown', onKey, true);
    document.removeEventListener('mousedown', onOutside, true);
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (stack.length > 1) back(); else close(); }
  }
  function onOutside(e) { if (menu && !menu.contains(e.target)) close(); }

  function place(x, y) {
    if (!menu) return;
    var w = menu.offsetWidth, h = menu.offsetHeight;
    var L = Math.min(Math.max(8, x - w), window.innerWidth - w - 8);   // RTL: کرسر کے بائیں کھلے
    var Tp = Math.min(Math.max(8, y), window.innerHeight - h - 8);
    menu.style.left = L + 'px'; menu.style.top = Tp + 'px';
  }

  function render() {
    if (!menu) return;
    var lv = stack[stack.length - 1];
    var html = '<div class="cc-h">' + (stack.length > 1 ? '<button type="button" data-act="back">← واپس</button>' : '') +
      '<b>' + E(lv.title) + '</b><button type="button" data-act="close" aria-label="بند کریں">✕</button></div>';
    if (!lv.items || !lv.items.length) {
      html += '<div class="cc-empty">' + E(lv.empty || 'اس مقدمے میں ابھی کچھ درج نہیں') + '</div>';
    }
    (lv.items || []).forEach(function (x, i) {
      if (x.group) {
        html += '<button type="button" class="cc-i" data-g="' + i + '"><span class="cc-l">' + E(x.title) + '</span><span class="cc-n">' + x.items.length + '</span><span aria-hidden="true">‹</span></button>';
      } else {
        var showV = x.value && x.value !== x.label.replace(/^\d+۔\s*/, '');
        html += '<div style="display:flex;align-items:center;gap:4px;"><button type="button" class="cc-i" data-i="' + i + '" title="' + E(x.long ? 'پورا متن شامل کریں' : x.value) + '">' +
          '<span class="cc-l">' + E(x.label) + '</span>' +
          (x.badge ? '<span class="cc-b">' + E(x.badge) + '</span>' : '') +
          (showV ? '<span class="cc-v' + (x.ltr ? ' ltr' : '') + '">' + E(x.long ? (x.value.slice(0, 40) + '…') : x.value) + '</span>' : '') +
          '</button>' + (x.sub && x.sub.length > 1 ? '<button type="button" class="cc-more" data-s="' + i + '" title="تفصیل (شناختی کارڈ، موبائل …)">‹</button>' : '') + '</div>';
      }
    });
    html += '<div class="cc-f">' + (target || lastEdit ? 'کلک = کرسر کی جگہ لکھیں' : 'کلک = نقل (Copy)') + ' · براؤزر کا مینیو: Shift + دایاں کلک</div>';
    menu.innerHTML = html;
  }
  function back() { if (stack.length > 1) { stack.pop(); render(); } }

  function onMenuClick(e) {
    var b = e.target.closest && e.target.closest('button');
    if (!b || !menu.contains(b)) return;
    e.preventDefault(); e.stopPropagation();
    var lv = stack[stack.length - 1];
    var a = b.getAttribute('data-act');
    if (a === 'close') { close(); return; }
    if (a === 'back') { back(); return; }
    if (b.hasAttribute('data-g')) { var g = lv.items[+b.getAttribute('data-g')]; stack.push({ title: g.title, items: g.items, empty: 'اس مقدمے میں ابھی کوئی ' + g.title + ' درج نہیں' }); render(); return; }
    if (b.hasAttribute('data-s')) { var p = lv.items[+b.getAttribute('data-s')]; stack.push({ title: p.label, items: p.sub }); render(); return; }
    if (b.hasAttribute('data-i')) { insert(lv.items[+b.getAttribute('data-i')].value); }
  }

  async function open(x, y, cid) {
    css(); close();
    menu = document.createElement('div');
    menu.id = 'dio-cctx'; menu.setAttribute('role', 'menu');
    menu.innerHTML = '<div class="cc-empty">مقدمے کی تفصیل لوڈ ہو رہی ہے…</div>';
    document.body.appendChild(menu);
    // کلک سے کرسر/انتخاب نہ ہلے (لکھنے کی جگہ محفوظ رہے)
    menu.addEventListener('mousedown', function (e) { e.preventDefault(); });
    menu.addEventListener('click', onMenuClick);
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('mousedown', onOutside, true);
    place(x, y);
    var d = null;
    try { d = await load(cid); } catch (_) { d = null; }
    if (!menu) return;
    var G = d ? groups(d) : [];
    var fir = d && d.c && d.c.fir_number ? ' ' + d.c.fir_number : '';
    stack = [{ title: 'مقدمہ' + fir + ' — تفصیل', items: G.map(function (g) { return { group: true, title: g.title, items: g.items }; }),
      empty: 'مقدمے کی تفصیل نہیں ملی (انٹرنیٹ نہیں اور اس آلے پر نقل بھی نہیں)' }];
    render(); place(x, y);
  }

  // ── دایاں کلک ──
  document.addEventListener('contextmenu', function (e) {
    if (e.shiftKey) return;                                  // براؤزر کا اپنا مینیو
    var cid = caseId();
    if (!cid) return;
    if (e.target && e.target.closest && e.target.closest('#dio-cctx, .naq-canvas-wrap, canvas, img, a[href], video')) return;
    if (!e.target || !e.target.closest || !e.target.closest('#page-content, #dio-docview, #modal-backdrop, #dio-form-view')) return;
    e.preventDefault();
    target = snap(editableOf(e.target));
    open(e.clientX, e.clientY, cid);
  }, true);

  // ٹچ بٹن کے لیے آخری لکھنے کی جگہ یاد رکھو
  document.addEventListener('selectionchange', function () {
    try {
      var a = document.activeElement;
      var el = editableOf(a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') ? a : (window.getSelection().anchorNode));
      if (el) lastEdit = snap(el);
    } catch (_) { /* ikhtiyari */ }
  });

  // ── موبائل/ٹیبلٹ: «مقدمہ کی تفصیل» بٹن ──
  function ensureBtn() {
    css();
    if (document.getElementById('dio-cctx-btn')) return;
    var b = document.createElement('button');
    b.id = 'dio-cctx-btn'; b.type = 'button'; b.className = 'no-print';
    b.textContent = 'مقدمہ کی تفصیل';
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); });   // کرسر نہ ہٹے
    b.addEventListener('click', function () {
      var cid = caseId(); if (!cid) return;
      target = null;
      var r = b.getBoundingClientRect();
      open(r.right, r.top - 10, cid);
    });
    document.body.appendChild(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureBtn); else ensureBtn();

  // مقدمہ بدلے یا ڈیٹا بدلے تو تازہ (45 سیکنڈ cache)
  window.DIOCaseCtx = { open: open, close: close, reload: function () { cache = { id: null, at: 0, data: null }; }, _groups: groups, _load: load };
})();
