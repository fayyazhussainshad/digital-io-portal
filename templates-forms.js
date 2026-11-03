/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — ٹمپلیٹس: «سسٹم کے فارم» حصہ  — templates-forms.js
   (dio-forms.js + system-forms.js کی فہرست؛ ٹمپلیٹس کا صفحہ اسے لاتا ہے)

   • سسٹم کے تمام فارم + خودکار شامل شدہ — نام، گروپ، حالت کے ساتھ فہرست
   • ہر فارم خالی (ڈیٹا کے بغیر) — کالم/قطار کے نام، سرخیاں برقرار
   • کھولیں → پورا صفحہ، قابلِ ترمیم کاغذ · محفوظ · پرنٹ (Ctrl+P = پرنٹ بٹن)
     · شیئر (PDF / Word) · اصل فارم بحال
   • ترمیم شدہ نقل: اسی آلے پر فوراً + سرور (templates جدول) پر، تاکہ
     دوسرے آلے پر بھی ملے۔ سرور کی قطار کی شناخت: مواد کے شروع میں
     <!--dio-form:ID--> (عام ٹمپلیٹس کی فہرست میں یہ قطاریں نہیں دکھتیں)۔
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var EDIT_KEY = 'dio_form_edits_v1';
  var MARK = /^<!--dio-form:([^>]+?)-->/;
  var _q = '';
  var _openId = null, _dirty = false;

  function E(s) { return (window.DIO && DIO.html) ? DIO.html.text(s) : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function J(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;'); }
  function toast(m, t, d) { try { showToast(m, t || 'info', d || 3000); } catch (_) { /* ضمنی */ } }

  // ── ترمیم شدہ نقلیں ─────────────────────────────────────────
  function edits() { try { return JSON.parse(localStorage.getItem(EDIT_KEY) || '{}') || {}; } catch (_) { return {}; } }
  function setEdits(o) { try { localStorage.setItem(EDIT_KEY, JSON.stringify(o)); return true; } catch (_) { return false; } }

  // صارف کی ترمیم شدہ HTML صاف (اسکرپٹ وغیرہ نہیں؛ SVG نقشے کی شکلیں رہیں)
  function clean(html) {
    try {
      if (window.DOMPurify && DOMPurify.sanitize) {
        return DOMPurify.sanitize(String(html), {
          USE_PROFILES: { html: true, svg: true },
          FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'base', 'form', 'input', 'button', 'select', 'textarea'],
          FORBID_ATTR: ['onerror', 'onload', 'onclick', 'formaction', 'srcdoc']
        });
      }
    } catch (_) { /* نیچے متبادل */ }
    return (typeof sanitizeHtml === 'function') ? sanitizeHtml(html) : '';
  }

  // سرور کی قطاریں (templates.js کی _tplList میں) → ترمیمات
  function serverEdits() {
    var out = {};
    try {
      (typeof _tplList !== 'undefined' ? _tplList : []).forEach(function (t) {
        var m = MARK.exec(t.content || '');
        if (m) out[m[1]] = { html: (t.content || '').replace(MARK, ''), at: t.updated_at || t.created_at || '', rowId: t.id };
      });
    } catch (_) { /* فہرست نہیں */ }
    return out;
  }
  function editFor(id) {
    var loc = edits()[id], srv = serverEdits()[id];
    if (loc && srv) return (String(loc.at) >= String(srv.at)) ? Object.assign({ rowId: srv.rowId }, loc) : srv;
    return loc || srv || null;
  }

  function list() {
    var L = (window.DIO && DIO.forms) ? DIO.forms.all() : (window.DIO_SYSTEM_FORMS || []);
    if (_q) L = L.filter(function (f) { return (f.name + ' ' + f.group).toLowerCase().indexOf(_q) >= 0; });
    return L;
  }
  function find(id) {
    var L = (window.DIO && DIO.forms) ? DIO.forms.all() : (window.DIO_SYSTEM_FORMS || []);
    for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i];
    return null;
  }

  function btn(color, label, on, svg) {
    return '<button type="button" aria-label="' + label + '" title="' + label + '" onclick="' + on + '" ' +
      'style="padding:5px 9px;background:' + color + ';color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:9.75pt;">' + svg + '</button>';
  }
  var IC = {
    open: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M4 20h4L18 10l-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg>',
    print: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M7 9.5V3.5h10v6"/><path d="M4.5 9.5h15v7h-15z"/><path d="M7 13.5h10V21H7z"/></svg>',
    share: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4M8.2 13.2l7.6 4"/></svg>',
    reset: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/></svg>',
    del: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/></svg>'
  };

  // ── فہرست ────────────────────────────────────────────────────
  function render() {
    var wrap = document.getElementById('tpl-forms-wrap');
    if (!wrap) return;
    var L = list(), all = (window.DIO && DIO.forms) ? DIO.forms.all() : [];
    var head = '<div class="dio-tplf-head"><b class="dio-sec-h" role="heading" aria-level="2">سسٹم کے فارم</b>' +
      '<small>' + all.length + ' فارم — خالی سانچے (بغیر ڈیٹا)، کالم اور قطار کے نام برقرار۔ کھول کر ترمیم، پرنٹ یا PDF / Word میں شیئر کریں۔ ' +
      'سسٹم میں کوئی نیا فارم آئے تو خود یہاں شامل ہو جاتا ہے۔</small></div>';
    if (!L.length) { wrap.innerHTML = head + '<div class="dio-tplf-empty">اس تلاش سے کوئی فارم نہیں ملا</div>'; return; }
    var rows = L.map(function (f, i) {
      var ed = editFor(f.id);
      var state = f.auto ? '<span class="dio-tplf-tag is-auto">خودکار شامل</span>'
        : (ed ? '<span class="dio-tplf-tag is-edit">ترمیم شدہ</span>' : '<span class="dio-tplf-tag">اصل</span>');
      var id = J(f.id);
      return '<tr ondblclick="DIOFormsUI.open(\'' + id + '\')">' +
        '<td class="n">' + (i + 1) + '</td>' +
        '<td class="nm">' + E(f.name) + '</td>' +
        '<td class="gp">' + E(f.group || '') + '</td>' +
        '<td class="st">' + state + '</td>' +
        '<td class="ac"><div>' +
        btn('#1a73e8', 'کھولیں / ترمیم', "DIOFormsUI.open('" + id + "')", IC.open) +
        btn('#6c757d', 'پرنٹ', "DIOFormsUI.print('" + id + "')", IC.print) +
        btn('#0f766e', 'شیئر — PDF / Word', "DIOFormsUI.share('" + id + "')", IC.share) +
        (ed && !f.auto ? btn('#fd7e14', 'اصل فارم بحال کریں', "DIOFormsUI.reset('" + id + "')", IC.reset) : '') +
        (f.auto ? btn('#dc3545', 'خودکار فارم ہٹائیں', "DIOFormsUI.removeAuto('" + id + "')", IC.del) : '') +
        '</div></td></tr>';
    }).join('');
    wrap.innerHTML = head +
      '<div class="dio-tplf-scroll"><table class="dio-tplf"><thead><tr>' +
      '<th class="n">#</th><th class="nm">فارم کا نام</th><th class="gp">گروپ</th><th class="st">حالت</th><th class="ac">اقدامات</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function filter(q) { _q = String(q || '').trim().toLowerCase(); render(); }

  // ── کاغذ کا HTML (ترمیم ہو تو وہی) ───────────────────────────
  function paperHtml(f) {
    var ed = editFor(f.id);
    return ed ? clean(ed.html) : f.html;      // سسٹم کا فارم ایپ کے ساتھ آتا ہے (قابلِ اعتماد)
  }
  function pageOf(f) {
    var w = +f.wIn || 8.5;
    if (Math.abs(w - 8.27) < 0.15) return { w: 8.27, h: 11.69 };
    return { w: w, h: 13 };                    // Legal/Folio (8.5 × 13 انچ) — سسٹم کا معیاری کاغذ
  }

  // ── پورا صفحہ: قابلِ ترمیم کاغذ ───────────────────────────────
  function open(id) {
    var f = find(id); if (!f) return;
    close(true);
    _openId = id; _dirty = false;
    var ov = document.createElement('div');
    ov.id = 'dio-form-view'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', f.name);
    ov.innerHTML =
      '<div class="dio-fv-bar no-print">' +
      '<div class="dio-fv-btns">' +
      '<button type="button" onclick="DIOFormsUI.save()">محفوظ</button>' +
      '<button type="button" data-dio-print onclick="DIOFormsUI.printOpen()">پرنٹ</button>' +
      '<button type="button" onclick="DIOFormsUI.shareOpen()">شیئر — PDF / Word</button>' +
      (f.auto ? '' : '<button type="button" onclick="DIOFormsUI.reset(\'' + J(id) + '\', true)">اصل فارم</button>') +
      '</div>' +
      '<b class="dio-fv-title">' + E(f.name) + '</b>' +
      '<button type="button" class="dio-fv-close" onclick="DIOFormsUI.close()">بند</button>' +
      '</div>' +
      '<div class="dio-fv-hint no-print">کاغذ پر کہیں بھی دبا کر لکھیں یا بدلیں — پھر «محفوظ» دبائیں۔ اصل فارم ہمیشہ «اصل فارم» سے واپس آ سکتا ہے۔</div>' +
      '<div class="dio-fv-scroll" id="dio-fv-scroll"><div class="dio-fv-zoom" id="dio-fv-zoom">' +
      '<div id="dio-fv-paper" contenteditable="true" spellcheck="false" dir="rtl">' + paperHtml(f) + '</div>' +
      '</div></div>';
    document.body.appendChild(ov);
    var paper = document.getElementById('dio-fv-paper');
    paper.addEventListener('input', function () { _dirty = true; });
    fit();
    window.addEventListener('resize', fit);
    document.addEventListener('keydown', onKey, true);
  }

  // موبائل/تنگ اسکرین: کاغذ اسکرین میں سما جائے
  function fit() {
    var z = document.getElementById('dio-fv-zoom'), p = document.getElementById('dio-fv-paper'), sc = document.getElementById('dio-fv-scroll');
    if (!z || !p || !sc) return;
    var inner = p.firstElementChild || p;
    var w = inner.offsetWidth || 816;
    var avail = sc.clientWidth - 16;
    var k = Math.min(1, avail / w);
    z.style.transform = (k < 1) ? 'scale(' + k.toFixed(3) + ')' : '';
    z.style.width = w + 'px';
    z.style.height = (k < 1) ? (inner.offsetHeight * k) + 'px' : '';
  }

  function onKey(e) {
    if (!document.getElementById('dio-form-view')) return;
    if ((e.ctrlKey || e.metaKey) && !e.altKey && String(e.key || '').toLowerCase() === 'p') {
      // پورے سسٹم کا Ctrl+P (index.html) پہلے ہی یہی «پرنٹ» بٹن دبا چکا ہو تو دوبارہ نہیں
      if (e.defaultPrevented) return;
      e.preventDefault(); e.stopPropagation(); printOpen();       // Ctrl+P = «پرنٹ» بٹن
    } else if (e.key === 'Escape') { close(); }
  }

  function close(force) {
    var ov = document.getElementById('dio-form-view');
    if (!ov) return;
    if (!force && _dirty && !confirm('غیر محفوظ تبدیلیاں ضائع ہو جائیں گی۔ بند کریں؟')) return;
    ov.remove(); _openId = null; _dirty = false;
    window.removeEventListener('resize', fit);
    document.removeEventListener('keydown', onKey, true);
  }

  // ── محفوظ: آلہ + سرور ──────────────────────────────────────────
  async function save() {
    if (!_openId) return;
    if (window.DIO && DIO.sub && typeof DIO.sub.guard === 'function' && !DIO.sub.guard('فارم محفوظ')) return;
    var f = find(_openId), p = document.getElementById('dio-fv-paper');
    if (!f || !p) return;
    var html = clean(p.innerHTML), at = new Date().toISOString();
    if (f.auto) {
      // خودکار فارم: اسی آلے کی فہرست میں ہی بدل دو
      try {
        var L = DIO.forms.autoList().map(function (x) { return x.id === f.id ? Object.assign({}, x, { html: html, at: at }) : x; });
        localStorage.setItem('dio_forms_auto_v1', JSON.stringify(L));
        _dirty = false; toast('فارم محفوظ ہو گیا', 'success'); render();
      } catch (e) { toast('محفوظ نہیں ہوا — آلے کی جگہ بھری ہوئی ہے', 'error', 6000); }
      return;
    }
    var all = edits(); all[f.id] = { html: html, at: at }; setEdits(all);
    _dirty = false;
    // سرور (دوسرے آلے کے لیے) — ناکامی صاف بتائیں، آلے کی نقل محفوظ رہتی ہے
    var srv = serverEdits()[f.id];
    try {
      if (!navigator.onLine) throw new Error('آف لائن');
      var content = '<!--dio-form:' + f.id + '-->' + html;
      if (srv && srv.rowId) {
        dioWriteOk(await supabaseClient.from('templates').update({ content: content, title: f.name, updated_at: at }).eq('id', srv.rowId).select('id'), 'form edit', true);
        try { var t = _tplList.find(function (x) { return x.id === srv.rowId; }); if (t) { t.content = content; t.updated_at = at; } } catch (_) { /* ضمنی */ }
      } else {
        var oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
        var ins = await supabaseClient.from('templates').insert({ officer_id: oid, title: f.name, category: 'other', content: content,
          is_default: false, is_public: false }).select().single();
        if (ins.error) throw ins.error;
        try { if (ins.data) _tplList.push(ins.data); } catch (_) { /* ضمنی */ }
      }
      try { localStorage.setItem('cache_templates', JSON.stringify(_tplList)); } catch (_) { /* ضمنی */ }
      toast('فارم محفوظ ہو گیا', 'success');
    } catch (e) {
      toast('فارم اس آلے پر محفوظ ہو گیا — سرور پر نہیں گیا (' + ((e && e.message) || 'خرابی') + ')؛ انٹرنیٹ پر دوبارہ «محفوظ» دبائیں', 'info', 7000);
    }
    render();
  }

  async function reset(id, fromView) {
    var f = find(id); if (!f) return;
    if (!confirm('«' + f.name + '» کی ترمیم ختم کر کے اصل فارم بحال کریں؟')) return;
    var all = edits(); delete all[id]; setEdits(all);
    var srv = serverEdits()[id];
    if (srv && srv.rowId) {
      try {
        dioWriteOk(await supabaseClient.from('templates').delete().eq('id', srv.rowId).select('id'), 'form reset', true);
        _tplList = _tplList.filter(function (x) { return x.id !== srv.rowId; });
        try { localStorage.setItem('cache_templates', JSON.stringify(_tplList)); } catch (_) { /* ضمنی */ }
      } catch (e) { toast('اس آلے پر اصل بحال — سرور کی نقل نہیں ہٹی (' + ((e && e.message) || '') + ')', 'info', 6000); }
    }
    toast('اصل فارم بحال ہو گیا', 'success');
    render();
    if (fromView) { _dirty = false; open(id); }
  }

  function removeAuto(id) {
    var f = find(id); if (!f || !f.auto) return;
    if (!confirm('خودکار شامل شدہ فارم «' + f.name + '» فہرست سے ہٹائیں؟ (اگلی بار یہ دستاویز کھلنے پر دوبارہ شامل ہو جائے گا)')) return;
    DIO.forms.removeAuto(id); render();
  }

  // ── پرنٹ: صرف کاغذ، اپنے سائز پر ───────────────────────────────
  function printDoc(f, html) {
    if (window.DIO && DIO.sub && typeof DIO.sub.guard === 'function' && !DIO.sub.guard('پرنٹ')) return;
    var pg = pageOf(f), base = location.href.replace(/[^/]*$/, '');
    var doc = '<!doctype html><html lang="ur" dir="rtl"><head><meta charset="utf-8"><title>' + E(f.name) + '</title>' +
      '<style>' +
      "@font-face{font-family:'Jameel Noori Nastaleeq';src:url('" + base + "fonts/jameel-noori-nastaleeq.woff2') format('woff2');font-display:block;}" +
      "@font-face{font-family:'Amiri Quran DIO';src:url('" + base + "fonts/amiri-quran-arabic.woff2') format('woff2');}" +
      "@font-face{font-family:'Amiri DIO';src:url('" + base + "fonts/amiri-arabic.woff2') format('woff2');}" +
      '@page{size:' + pg.w + 'in ' + pg.h + 'in;margin:0;}' +
      'html,body{margin:0;padding:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      '.dio-form-paper{margin:0 auto !important;box-shadow:none !important;}' +
      '</style></head><body>' + html + '</body></html>';
    if (typeof _dioDoPrint === 'function') _dioDoPrint(doc);
    else { var w = window.open('', '_blank'); if (w) { w.document.write(doc); w.document.close(); w.print(); } }
  }
  function print(id) { var f = find(id); if (f) printDoc(f, paperHtml(f)); }
  function printOpen() {
    var f = find(_openId), p = document.getElementById('dio-fv-paper');
    if (f && p) printDoc(f, clean(p.innerHTML));
  }

  // ── شیئر: PDF / Word ─────────────────────────────────────────
  async function shareEl(el, name) {
    if (typeof window.dioShareDoc === 'function') return window.dioShareDoc(el, name);
    toast('شیئر کا آلہ دستیاب نہیں', 'error');
  }
  function shareOpen() {
    var f = find(_openId), p = document.getElementById('dio-fv-paper');
    if (f && p) shareEl(p.firstElementChild || p, f.name);
  }
  function share(id) {
    // فہرست سے: کاغذ پسِ منظر میں بنا کر شیئر
    var f = find(id); if (!f) return;
    var host = document.getElementById('dio-fv-offscreen');
    if (host) host.remove();
    host = document.createElement('div');
    host.id = 'dio-fv-offscreen'; host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:fixed;left:-20000px;top:0;background:#fff;';
    host.innerHTML = paperHtml(f);
    document.body.appendChild(host);
    shareEl(host.firstElementChild || host, f.name);
    setTimeout(function () { try { host.remove(); } catch (_) { /* ضمنی */ } }, 120000);
  }

  // ── انداز ─────────────────────────────────────────────────────
  (function css() {
    if (document.getElementById('dio-tplf-css')) return;
    var st = document.createElement('style'); st.id = 'dio-tplf-css';
    st.textContent =
      '.dio-tplf-head{direction:rtl;text-align:right;margin:4px 0 8px;}' +
      '.dio-tplf-head small{display:block;color:var(--text-muted);font-size:10.5pt;line-height:1.9;}' +
      '.dio-tplf-scroll{overflow-x:auto;margin-bottom:22px;}' +
      '.dio-tplf{width:100%;border-collapse:collapse;direction:rtl;background:var(--bg-card);border-radius:10px;overflow:hidden;}' +
      '.dio-tplf th{background:var(--bg-secondary);border-bottom:2px solid var(--border);padding:10px 8px;font-size:11pt;text-align:right;white-space:nowrap;}' +
      '.dio-tplf td{border-bottom:1px solid var(--border);padding:8px;font-size:11pt;vertical-align:middle;}' +
      '.dio-tplf .n{width:44px;text-align:center;color:var(--text-muted);}' +
      '.dio-tplf .nm{font-weight:700;}' +
      '.dio-tplf .gp{white-space:nowrap;color:var(--text-secondary);}' +
      '.dio-tplf .st{white-space:nowrap;}' +
      '.dio-tplf .ac div{display:flex;gap:5px;justify-content:center;flex-wrap:wrap;}' +
      '.dio-tplf tbody tr{cursor:pointer;} .dio-tplf tbody tr:hover{background:var(--hover-bg);}' +
      '.dio-tplf-tag{display:inline-block;padding:1px 9px;border-radius:12px;font-size:9.5pt;background:rgba(108,117,125,.14);color:var(--text-secondary);}' +
      '.dio-tplf-tag.is-edit{background:rgba(253,126,20,.15);color:#c25e00;}' +
      '.dio-tplf-tag.is-auto{background:rgba(26,115,232,.14);color:#1a5fc4;}' +
      '.dio-tplf-empty{padding:18px;text-align:center;color:var(--text-muted);}' +
      '@media (max-width:760px){.dio-tplf .gp,.dio-tplf .st,.dio-tplf th.gp,.dio-tplf th.st{display:none;}.dio-tplf td,.dio-tplf th{padding:7px 5px;}}' +
      '#dio-form-view{position:fixed;inset:0;z-index:99990;background:#dfe6ee;display:flex;flex-direction:column;direction:rtl;}' +
      '#dio-form-view .dio-fv-bar{display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--dio-file,#13294b);color:#fff;flex-wrap:wrap;}' +
      '#dio-form-view .dio-fv-btns{display:flex;gap:6px;flex-wrap:wrap;}' +
      '#dio-form-view .dio-fv-bar button{background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.35);border-radius:8px;padding:6px 12px;cursor:pointer;' +
      "font-family:'Jameel Noori Nastaleeq';font-size:11.5pt;}" +
      '#dio-form-view .dio-fv-title{flex:1;text-align:center;font-size:13pt;min-width:140px;}' +
      '#dio-form-view .dio-fv-hint{background:#fff8e1;color:#664d03;border-bottom:1px solid #f0d27a;padding:5px 12px;font-size:10pt;text-align:right;}' +
      '#dio-form-view .dio-fv-scroll{flex:1;overflow:auto;padding:12px 8px 40px;}' +
      '#dio-form-view .dio-fv-zoom{margin:0 auto;transform-origin:top right;}' +
      '#dio-form-view #dio-fv-paper{outline:none;}' +
      '#dio-form-view #dio-fv-paper > *{background:#fff;box-shadow:0 2px 14px rgba(0,0,0,.14);margin:0 auto;}' +
      '@media (max-width:760px){#dio-form-view .dio-fv-title{order:-1;flex-basis:100%;}#dio-form-view .dio-fv-zoom{transform-origin:top right;margin:0;}}';
    document.head.appendChild(st);
  })();

  window.DIOFormsUI = { render: render, filter: filter, open: open, close: close, save: save, reset: reset,
    removeAuto: removeAuto, print: print, printOpen: printOpen, share: share, shareOpen: shareOpen, fit: fit };
})();
