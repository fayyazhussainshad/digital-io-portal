/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — dio-card.js  (نیا اندراج — مشترکہ کارڈ)
   ────────────────────────────────────────────────────────────────
   SYSTEM RULE (اکتوبر 2026): ہر «نیا اندراج» کارڈ ایک ہی pattern،
   ایک ہی سائز اور ایک ہی font پر — صرف خانے بدلتے ہیں۔
     • عنوان: «نیا اندراج — <چیز>» / «ترمیم — <چیز>»
     • خانے کا نام خانے کے اوپری دائیں کنارے پر (اوپر الگ سطر نہیں)
     • اندراج کا font 14pt؛ ہر خانہ صرف اتنا چوڑا جتنا اس کا ڈیٹا
     • نام و پتہ: Desktop پر ایک سطر (نام ولد … قوم … سکنہ …)،
       Mobile پر نام / ولدیت / قوم / پتہ الگ سطریں — محفوظ ایک ہی
       خانے میں جڑ کر ہوتا ہے (پرانا ڈیٹا اور چالان بغیر تبدیلی)
     • شناختی کارڈ 00000-0000000-0 · موبائل 0000-0000000 ·
       تاریخ DD/MM/YYYY — لکھتے ہی خود
     • Mic صرف Desktop پر، کارڈ کے footer میں
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var PHONE_Q = '(max-width: 760px)';
  function isPhone() {
    try { return window.matchMedia(PHONE_Q).matches; } catch (_) { return false; }
  }
  function e(s) {
    return (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ── CSS (aik dafa) ───────────────────────────────────────── */
  var CSS = [
    '#modal-backdrop .modal-card.dio-entry{max-width:780px!important;width:100%!important;min-height:0!important;}',
    '.dio-entry #modal-body.modal-body{display:block!important;padding:2px 18px 12px!important;}',
    '.dio-entry #modal-title{font-size:var(--dio-h1,15pt)!important;}',
    '.dio-row{display:flex;flex-wrap:wrap;gap:13px 10px;padding-top:13px;direction:rtl;}',
    '.dio-f{position:relative;flex:0 0 var(--w,8em);min-width:0;font-size:14pt;}',
    '.dio-f.grow{flex:1 1 var(--w,8em);}',
    '.dio-f.line{flex:1 1 100%;}',
    '.dio-f.w-xs{--w:4.6em}.dio-f.w-s{--w:5.8em}.dio-f.w-m{--w:7.4em}.dio-f.w-l{--w:10em}',
    '.dio-f.w-cnic{--w:10.2em}.dio-f.w-mob{--w:8.4em}.dio-f.w-date{--w:9.4em}.dio-f.w-fir{--w:6em}.dio-f.w-time{--w:6.4em}',
    '.dio-f>label.dio-l{position:absolute;top:-0.8em;inset-inline-start:10px;z-index:1;padding:0 5px;margin:0;',
    '  background:var(--bg-card,#fff);color:var(--accent,#0369a1);font-size:var(--dio-h3,11.25pt);font-weight:700;',
    '  line-height:1.35;pointer-events:none;white-space:nowrap;max-width:calc(100% - 16px);overflow:hidden;text-overflow:ellipsis;',
    "  font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;}",
    '.dio-f>label.dio-l .req{color:var(--red,#dc2626);}',
    '.dio-c{width:100%!important;height:40px!important;box-sizing:border-box!important;margin:0!important;',
    "  font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif!important;font-size:14pt!important;",
    '  color:var(--text-primary,#111)!important;background:var(--bg-card,#fff)!important;',
    '  border:1.5px solid var(--border,#c8d8e8)!important;border-radius:9px!important;padding:0 10px!important;',
    '  line-height:1.5!important;outline:none;text-align:right;direction:rtl;}',
    'select.dio-c{cursor:pointer;padding-inline-end:4px!important;text-align:right!important;}',
    'textarea.dio-c{height:auto!important;min-height:70px;resize:vertical;padding-top:10px!important;line-height:2!important;}',
    '.dio-c:focus{border-color:var(--accent,#0369a1)!important;box-shadow:0 0 0 3px var(--accent-glow,rgba(3,105,161,.12))!important;}',
    '.dio-c.ltr{direction:ltr!important;text-align:right!important;font-family:Aptos,"Segoe UI",system-ui,sans-serif!important;',
    '  font-size:12pt!important;font-variant-numeric:tabular-nums;letter-spacing:.02em;}',
    '.dio-wb{display:flex;gap:5px;}.dio-wb .dio-c{flex:1;min-width:0;}',
    '.dio-ib{height:40px;width:38px;flex:none;border-radius:9px;border:1.5px solid var(--border,#c8d8e8);',
    '  background:var(--bg-card,#fff);color:var(--accent,#0369a1);cursor:pointer;display:inline-grid;place-items:center;position:relative;padding:0;}',
    '.dio-ib svg{width:17px;height:17px;}',
    '.dio-ib input[type=date]{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;}',
    '.dio-hint{font-size:10.5pt;color:var(--text-muted,#64748b);line-height:1.9;padding-top:2px;}',
    '.f5c-hide{display:none!important;}',
    '.dio-opt{margin-top:12px;border:1px dashed var(--border,#c8d8e8);border-radius:12px;padding:2px 10px 12px;}',
    /* Uploads */
    '.dio-up-row{display:flex;flex-wrap:wrap;gap:10px;padding-top:12px;}',
    '.dio-up{flex:1 1 11em;border:1.5px dashed var(--border,#c8d8e8);border-radius:10px;padding:4px 10px 8px;display:grid;gap:4px;',
    '  background:var(--bg-secondary,rgba(0,0,0,.02));}',
    '.dio-up-h{display:flex;align-items:center;gap:8px;font-size:11.5pt;line-height:2;cursor:pointer;margin:0;}',
    '.dio-up-h svg{width:20px;height:20px;color:var(--accent,#0369a1);flex:none;}',
    '.dio-up-h small{color:var(--text-muted,#64748b);font-size:9.5pt;margin-inline-start:auto;}',
    '.dio-thumbs{display:flex;flex-wrap:wrap;gap:6px;}',
    '.dio-th{position:relative;width:60px;height:60px;border-radius:8px;overflow:hidden;border:1px solid var(--border,#c8d8e8);',
    '  cursor:zoom-in;background:var(--bg-card,#fff);padding:0;}',
    '.dio-th img{width:100%;height:100%;object-fit:cover;display:block;}',
    '.dio-th .x{position:absolute;top:1px;left:1px;width:18px;height:18px;border-radius:50%;border:0;background:rgba(0,0,0,.6);',
    '  color:#fff;font-size:11px;line-height:18px;cursor:pointer;padding:0;}',
    '.dio-th.pdf{display:grid;place-items:center;font-size:10pt;color:var(--accent,#0369a1);font-family:Aptos,"Segoe UI",sans-serif;}',
    '.dio-cam{display:inline-flex;align-items:center;gap:6px;border:1.5px solid var(--accent,#0369a1);color:var(--accent,#0369a1);',
    '  background:var(--bg-card,#fff);border-radius:9px;padding:2px 12px 6px;font-size:11.5pt;line-height:2;cursor:pointer;margin:0;}',
    '.dio-cam svg{width:18px;height:18px;position:relative;top:3px;}',
    /* Footer mic */
    '.dio-mic{margin-inline-start:auto;display:inline-flex;align-items:center;gap:8px;font-size:11.5pt;border-radius:999px;',
    '  padding:2px 16px 7px;line-height:2;border:1.5px solid var(--accent,#0369a1);color:var(--accent,#0369a1);background:transparent;cursor:pointer;',
    "  font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;}",
    '.dio-mic svg{width:18px;height:18px;position:relative;top:3px;}',
    '.dio-mic[aria-pressed="true"]{background:var(--red,#dc2626);border-color:var(--red,#dc2626);color:#fff;}',
    /* Viewer */
    '#dio-viewer{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.86);display:grid;grid-template-rows:auto 1fr;direction:rtl;}',
    '#dio-viewer .bar{display:flex;flex-wrap:wrap;gap:6px;padding:10px 14px;justify-content:center;background:rgba(0,0,0,.45);}',
    '#dio-viewer .bar button{border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;border-radius:8px;',
    "  padding:0 12px 5px;font-size:11.5pt;line-height:2;cursor:pointer;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;}",
    '#dio-viewer .pane{overflow:auto;display:grid;place-items:center;padding:14px;}',
    '#dio-viewer .pane img{max-width:100%;max-height:84vh;transform-origin:center top;transition:transform .12s;}',
    '#dio-viewer .pane iframe{width:min(96vw,900px);height:84vh;border:0;background:#fff;border-radius:6px;}',
    /* Mobile: کارڈ درمیان میں (نیچے نہیں) */
    '@media ' + PHONE_Q + '{',
    '  #modal-backdrop .modal-card.dio-entry{position:relative!important;bottom:auto!important;left:auto!important;right:auto!important;',
    '    margin:auto!important;border-radius:14px!important;max-width:calc(100vw - 16px)!important;max-height:92vh!important;}',
    '  .dio-entry #modal-body.modal-body{padding:2px 12px 12px!important;}',
    '  .dio-f{flex-grow:1;}.dio-f.pair{flex:1 1 40%;}.dio-f.w-date.pair{flex:1 0 10em;}',
    '  .dio-f.w-cnic{flex-basis:9.3em;}.dio-f.w-mob{flex-basis:7.6em;}',
    '  .dio-entry #modal-footer .btn{flex:1;}',
    '}',
    '@media print{.dio-mic{display:none!important;}}'
  ].join('\n');
  function injectCSS() {
    if (document.getElementById('dio-card-css')) return;
    var s = document.createElement('style');
    s.id = 'dio-card-css';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  var ICON = {
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6.5h16V20H4z"/><path d="M4 10.5h16"/><path d="M8 3.5v4"/><path d="M16 3.5v4"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/></svg>',
    cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>'
  };

  /* ── Formatters (پورے نظام کا ایک ہی اصول) ─────────────────── */
  function fmtCnic(v) {
    var d = String(v || '').replace(/\D/g, '').slice(0, 13);
    if (d.length > 12) return d.slice(0, 5) + '-' + d.slice(5, 12) + '-' + d.slice(12);
    if (d.length > 5) return d.slice(0, 5) + '-' + d.slice(5);
    return d;
  }
  function fmtMob(v) {
    var d = String(v || '').replace(/\D/g, '').slice(0, 11);
    return d.length > 4 ? d.slice(0, 4) + '-' + d.slice(4) : d;
  }
  function fmtDate(v) {
    var d = String(v || '').replace(/\D/g, '').slice(0, 8);
    if (d.length > 4) return d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4);
    if (d.length > 2) return d.slice(0, 2) + '/' + d.slice(2);
    return d;
  }
  function fmtTime(v) {
    var d = String(v || '').replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + ':' + d.slice(2) : d;
  }
  // DD/MM/YYYY ↔ YYYY-MM-DD
  function dmyToIso(s) {
    var m = /^(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})$/.exec(String(s || '').trim());
    if (!m) return '';
    var d = +m[1], mo = +m[2], y = +m[3], dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return '';
    return m[3] + '-' + m[2] + '-' + m[1];
  }
  function isoToDmy(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''));
    if (m) return m[3] + '/' + m[2] + '/' + m[1];
    var m2 = /^(\d{2})[\-.](\d{2})[\-.](\d{4})$/.exec(String(s || '').trim());
    return m2 ? m2[1] + '/' + m2[2] + '/' + m2[3] : String(s || '');
  }

  document.addEventListener('input', function (ev) {
    var el = ev.target, t = el && el.getAttribute && el.getAttribute('data-fmt');
    if (!t) return;
    var v = el.value;
    if (t === 'cnic') el.value = fmtCnic(v);
    else if (t === 'mob') el.value = fmtMob(v);
    else if (t === 'date') el.value = fmtDate(v);
    else if (t === 'time') el.value = fmtTime(v);
  }, true);

  /* ── خانہ ─────────────────────────────────────────────────── */
  // o: {id,label,req,type:'text'|'sel'|'area'|'cnic'|'mob'|'date'|'time',
  //     w,grow,line,pair,value,ph,opts:[[val,label]|str],ltr,attrs,html}
  function fld(o) {
    o = o || {};
    var t = o.type || 'text', id = o.id || ('dio-f-' + Math.random().toString(36).slice(2, 8));
    var w = o.w || (t === 'cnic' ? 'w-cnic' : t === 'mob' ? 'w-mob' : t === 'date' ? 'w-date' : t === 'time' ? 'w-time' : '');
    var cls = 'dio-f ' + w + (o.grow ? ' grow' : '') + (o.line ? ' line' : '') + (o.pair ? ' pair' : '');
    var lab = '<label class="dio-l" for="' + e(id) + '">' + e(o.label) + (o.req ? ' <span class="req">*</span>' : '') + '</label>';
    var attrs = o.attrs || '';
    var ctl;
    if (o.html) {
      ctl = o.html;
    } else if (t === 'sel') {
      ctl = '<select class="dio-c' + (o.ltr ? ' ltr' : '') + '" id="' + e(id) + '" ' + attrs + '>' +
        (o.opts || []).map(function (op) {
          var val = Array.isArray(op) ? op[0] : op, lb = Array.isArray(op) ? op[1] : op;
          return '<option value="' + e(val) + '"' + (String(o.value == null ? '' : o.value) === String(val) ? ' selected' : '') + '>' + e(lb) + '</option>';
        }).join('') + '</select>';
    } else if (t === 'area') {
      ctl = '<textarea class="dio-c" id="' + e(id) + '" placeholder="' + e(o.ph || '') + '" ' + attrs + '>' + e(o.value) + '</textarea>';
    } else {
      var ltr = t === 'cnic' || t === 'mob' || t === 'date' || t === 'time' || o.ltr;
      var ph = t === 'cnic' ? '00000-0000000-0' : t === 'mob' ? '0000-0000000' : t === 'date' ? 'DD/MM/YYYY' : t === 'time' ? 'HH:MM' : (o.ph || '');
      var val = o.value == null ? '' : o.value;
      if (t === 'cnic') val = val ? fmtCnic(val) : '';
      if (t === 'mob') val = val ? fmtMob(val) : '';
      if (t === 'date') val = val ? isoToDmy(val) : '';
      var extra = t === 'cnic' ? ' data-fmt="cnic" maxlength="15" inputmode="numeric" autocomplete="off"'
        : t === 'mob' ? ' data-fmt="mob" maxlength="12" inputmode="numeric" autocomplete="off"'
          : t === 'date' ? ' data-fmt="date" maxlength="10" inputmode="numeric" autocomplete="off"'
            : t === 'time' ? ' data-fmt="time" maxlength="5" inputmode="numeric" autocomplete="off"' : '';
      ctl = '<input class="dio-c' + (ltr ? ' ltr' : '') + '" id="' + e(id) + '" type="text" dir="' + (ltr ? 'ltr' : 'rtl') + '"' +
        ' placeholder="' + e(ph) + '" value="' + e(val) + '"' + extra + ' ' + attrs + '>';
      if (t === 'date') {
        // کیلنڈر — چھپا ہوا native picker بٹن کے اوپر
        ctl = '<div class="dio-wb">' + ctl + '<label class="dio-ib" title="کیلنڈر" aria-label="کیلنڈر">' + ICON.cal +
          '<input type="date" tabindex="-1" onchange="DIOCard._pick(this,\'' + e(id) + '\')"></label></div>';
      }
    }
    return '<div class="' + cls + '">' + lab + ctl + '</div>';
  }
  function _pick(picker, targetId) {
    var t = document.getElementById(targetId);
    if (t && picker.value) { t.value = isoToDmy(picker.value); t.dispatchEvent(new Event('input', { bubbles: true })); }
  }
  function row(cells) { return '<div class="dio-row">' + cells.join('') + '</div>'; }

  /* ── نام و پتہ ─────────────────────────────────────────────── */
  function splitName(str) {
    var s = ' ' + String(str || '').replace(/\s+/g, ' ').trim() + ' ';
    var out = { n: '', w: '', q: '', p: '' };
    var re = /\s(ولد|بنت|زوجہ|قوم|سکنہ|ساکن)\s/g, m, marks = [];
    while ((m = re.exec(s))) marks.push({ k: m[1], i: m.index, len: m[0].length });
    if (!marks.length) { out.n = s.trim(); return out; }
    out.n = s.slice(0, marks[0].i).trim();
    marks.forEach(function (mk, idx) {
      var end = idx + 1 < marks.length ? marks[idx + 1].i : s.length;
      var val = s.slice(mk.i + mk.len, end).trim();
      var key = (mk.k === 'ولد' || mk.k === 'بنت' || mk.k === 'زوجہ') ? 'w' : mk.k === 'قوم' ? 'q' : 'p';
      if (key === 'w' && mk.k !== 'ولد') val = mk.k + '|' + val;
      out[key] = out[key] ? out[key] + ' ' + val : val;
    });
    return out;
  }
  function joinName(parts) {
    var n = (parts.n || '').trim();
    if (!n) return '';
    var s = n, w = (parts.w || '').trim();
    if (w) {
      var rel = 'ولد';
      if (w.indexOf('|') > 0) { rel = w.split('|')[0]; w = w.split('|').slice(1).join('|'); }
      s += ' ' + rel + ' ' + w;
    }
    if ((parts.q || '').trim()) s += ' قوم ' + parts.q.trim();
    if ((parts.p || '').trim()) s += ' سکنہ ' + parts.p.trim();
    return s;
  }
  // prefix id → desktop: <input id=prefix>, mobile: prefix-n / -w / -q / -p
  function nameField(prefix, value, label, req, attrs) {
    label = label || 'نام و پتہ';
    if (!isPhone()) {
      return row([fld({ id: prefix, label: label, req: req !== false, line: true, value: value,
        ph: 'نام ولد ولدیت قوم … سکنہ موضع / محلہ، تحصیل، ضلع', attrs: (attrs || '') + ' data-dio-name="1"' })]);
    }
    var p = splitName(value), lead = label.indexOf('—') > -1 ? label.split('—')[0].trim() + ' — ' : '';
    var w = p.w, rel = '';
    if (w && w.indexOf('|') > 0) { rel = w.split('|')[0]; w = w.split('|').slice(1).join('|'); }
    return row([fld({ id: prefix + '-n', label: lead + 'نام', req: req !== false, line: true, value: p.n, ph: 'پورا نام', attrs: (attrs || '') + ' data-dio-name="1"' })]) +
      row([fld({ id: prefix + '-w', label: rel || 'ولدیت', line: true, value: w, ph: 'والد کا نام', attrs: (rel ? 'data-rel="' + e(rel) + '" ' : '') + (attrs || '') })]) +
      row([fld({ id: prefix + '-q', label: 'قوم', line: true, value: p.q, ph: 'ذات / قوم', attrs: attrs || '' })]) +
      row([fld({ id: prefix + '-p', label: 'پتہ', line: true, value: p.p, ph: 'مکمل پتہ', attrs: attrs || '' })]);
  }
  function readName(prefix) {
    var one = document.getElementById(prefix);
    if (one) return one.value.replace(/\s+/g, ' ').trim();
    var g = function (k) { var el = document.getElementById(prefix + '-' + k); return el ? el.value.trim() : ''; };
    var wEl = document.getElementById(prefix + '-w'), rel = wEl && wEl.getAttribute('data-rel');
    var w = g('w');
    return joinName({ n: g('n'), w: w ? (rel ? rel + '|' + w : w) : '', q: g('q'), p: g('p') });
  }
  // پرانے فارم کا ایک خانہ (مثلاً مدعی) — Mobile پر 4 سطریں، محفوظ وہی خانہ
  function splitNameInput(inputId, lead) {
    if (!isPhone()) return;
    var inp = document.getElementById(inputId);
    if (!inp || inp.getAttribute('data-split') === '1') return;
    inp.setAttribute('data-split', '1');
    var holder = (inp.closest && (inp.closest('.cf-field') || inp.closest('.dio-f'))) || inp.parentNode;
    var wrap = document.createElement('div');
    wrap.innerHTML = nameField(inputId + '__m', inp.value, (lead ? lead + ' — ' : '') + 'نام و پتہ', true);
    holder.style.setProperty('display', 'none', 'important');   // کارڈ کا CSS display:block!important ہے
    holder.parentNode.insertBefore(wrap, holder.nextSibling);
    wrap.addEventListener('input', function () {
      inp.value = readName(inputId + '__m');
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
  // اصل نام (ولد / قوم / سکنہ سے پہلے) — سابقہ ریکارڈ کی تلاش کے لیے
  function coreName(str) {
    return String(str || '').split(/\s(?:ولد|بنت|زوجہ|قوم|سکنہ|ساکن)\s|[،,]/)[0].replace(/\s+/g, ' ').trim();
  }

  /* ── مقدمہ (اندراج خود اسی مقدمے میں) ─────────────────────── */
  var _caseCache = null;
  function _caseLabel(c) {
    var p = [c.fir_number || '—'];
    if (c.section_of_law) p.push(c.section_of_law);
    if (c.complainant) p.push('مدعی ' + coreName(c.complainant));
    return p.join(' · ');
  }
  async function loadCases() {
    try { _caseCache = (typeof getCases === 'function') ? (await getCases()) || [] : []; }
    catch (_) { _caseCache = _caseCache || []; }
    return _caseCache;
  }
  // async — HTML لوٹاتا ہے؛ selectedId ہو تو پہلے سے منتخب
  // extra: اسی سطر میں کوئی اور خانہ (مثلاً ملزم کی قسم)
  // optional: مقدمہ لازمی نہیں (مثلاً 5-C درخواست جو کسی مقدمے سے متعلق بھی ہو سکتی ہے)
  async function caseField(selectedId, extra, optional) {
    var cases = await loadCases();
    var opts = [['', optional ? '— کوئی مقدمہ نہیں —' : '— مقدمہ منتخب کریں —']].concat(cases.map(function (c) { return [c.id, _caseLabel(c)]; }));
    if (selectedId && !cases.some(function (c) { return String(c.id) === String(selectedId); })) opts.push([selectedId, 'موجودہ مقدمہ']);
    var cf = fld({ id: 'dio-case', label: optional ? 'متعلقہ مقدمہ (اختیاری)' : 'مقدمہ', req: !optional, line: !extra, grow: !!extra, w: 'w-l', type: 'sel', opts: opts, value: selectedId || '' });
    return row(extra ? [cf, extra] : [cf]) +
      '<div class="dio-hint">' + (optional ? 'اگر یہ کسی مقدمے سے متعلق ہے تو منتخب کریں — ساتھ مقدمہ نمبر محفوظ ہو جائے گا۔' : 'یہ اندراج خود منتخب مقدمے میں شامل ہو جائے گا۔') + '</div>';
  }
  function readCase() {
    var s = document.getElementById('dio-case');
    if (!s) return null;
    var id = s.value || null;
    if (!id) return null;
    var c = (_caseCache || []).find(function (x) { return String(x.id) === String(id); }) || {};
    return { id: id, fir: c.fir_number || '', c: c };
  }

  /* ── تصاویر / شناختی کارڈ ─────────────────────────────────── */
  var _files = {};   // key → [dataUrl]
  function setFiles(key, list) { _files[key] = (list || []).filter(Boolean).slice(); }
  function getFiles(key) { return (_files[key] || []).slice(); }
  function _thumbsHtml(key) {
    var list = _files[key] || [];
    if (!list.length) return '<span class="dio-hint">کوئی فائل نہیں</span>';
    return list.map(function (u, i) {
      var pdf = /^data:application\/pdf/.test(u);
      return '<span class="dio-th' + (pdf ? ' pdf' : '') + '" role="button" tabindex="0" title="دیکھیں" onclick="DIOCard.viewKey(\'' + key + '\',' + i + ')">' +
        (pdf ? 'PDF' : '<img alt="" src="' + e(u) + '">') +
        '<button type="button" class="x" aria-label="ہٹائیں" onclick="event.stopPropagation();DIOCard.removeFile(\'' + key + '\',' + i + ')">✕</button></span>';
    }).join('');
  }
  // items: [[key,label,note,multiple,max]]
  function uploads(items) {
    return '<div class="dio-up-row">' + items.map(function (it) {
      var key = it[0];
      return '<div class="dio-up"><label class="dio-up-h" tabindex="0">' + ICON.up + e(it[1]) + (it[2] ? '<small>' + e(it[2]) + '</small>' : '') +
        '<input type="file" hidden accept="image/*,application/pdf"' + (it[3] ? ' multiple' : '') +
        ' onchange="DIOCard._onFiles(this,\'' + key + '\',' + (it[3] ? 1 : 0) + ',' + (it[4] || 1) + ')"></label>' +
        '<div class="dio-thumbs" id="dio-th-' + key + '">' + _thumbsHtml(key) + '</div></div>';
    }).join('') + '</div>';
  }
  function _redraw(key) { var b = document.getElementById('dio-th-' + key); if (b) b.innerHTML = _thumbsHtml(key); }
  function compress(file, maxW, q) {
    return new Promise(function (res) {
      if (/^application\/pdf/.test(file.type)) {
        var r0 = new FileReader(); r0.onload = function () { res(r0.result); }; r0.onerror = function () { res(null); }; r0.readAsDataURL(file); return;
      }
      var r = new FileReader();
      r.onload = function () {
        var img = new Image();
        img.onload = function () {
          try {
            var sc = Math.min(1, maxW / img.width), c = document.createElement('canvas');
            c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            res(c.toDataURL('image/jpeg', q));
          } catch (_) { res(r.result); }
        };
        img.onerror = function () { res(null); };
        img.src = r.result;
      };
      r.onerror = function () { res(null); };
      r.readAsDataURL(file);
    });
  }
  async function _onFiles(input, key, multi, max) {
    var list = Array.prototype.slice.call(input.files || []);
    input.value = '';
    if (!list.length) return;
    var cur = multi ? (_files[key] || []).slice() : [];
    for (var i = 0; i < list.length; i++) {
      if (cur.length >= (max || 1)) { if (typeof showToast === 'function') showToast('زیادہ سے زیادہ ' + max + ' فائلیں', 'info'); break; }
      var u = await compress(list[i], 1400, 0.8);
      if (u) cur.push(u);
    }
    _files[key] = cur;
    _redraw(key);
  }
  function removeFile(key, i) { (_files[key] || []).splice(i, 1); _redraw(key); }
  function viewKey(key, i) { var u = (_files[key] || [])[i]; if (u) viewer(u, key + '_' + (i + 1)); }

  /* ── دیکھیں / زوم / شیئر / ڈاؤن لوڈ / پرنٹ / کاپی ─────────── */
  function _dataUrlToBlob(u) {
    var parts = String(u).split(','), mime = (/data:([^;]+)/.exec(parts[0]) || [])[1] || 'application/octet-stream';
    var bin = atob(parts[1] || ''), arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }
  async function _toBlob(u) {
    if (/^data:/.test(u)) return _dataUrlToBlob(u);
    var r = await fetch(u); return await r.blob();
  }
  function _ext(type) { return /pdf/.test(type) ? '.pdf' : /png/.test(type) ? '.png' : /jpe?g/.test(type) ? '.jpg' : ''; }
  function viewer(url, name, title) {
    if (!url) return;
    var old = document.getElementById('dio-viewer'); if (old) old.remove();
    var pdf = /^data:application\/pdf/.test(url) || /\.pdf(\?|$)/i.test(url);
    var v = document.createElement('div');
    v.id = 'dio-viewer'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-label', title || 'فائل');
    v.innerHTML = '<div class="bar">' +
      (pdf ? '' : '<button type="button" data-z="1">زوم +</button><button type="button" data-z="-1">زوم −</button>') +
      '<button type="button" data-a="share">شیئر</button><button type="button" data-a="dl">ڈاؤن لوڈ</button>' +
      '<button type="button" data-a="print">پرنٹ</button>' + (pdf ? '' : '<button type="button" data-a="copy">کاپی</button>') +
      '<button type="button" data-a="x">بند کریں ✕</button></div>' +
      '<div class="pane">' + (pdf ? '<iframe title="فائل" src="' + e(url) + '"></iframe>' : '<img alt="" src="' + e(url) + '">') + '</div>';
    document.body.appendChild(v);
    var z = 1, img = v.querySelector('img'), fname = String(name || 'dio_file').replace(/\s+/g, '_');
    function close() { v.remove(); document.removeEventListener('keydown', onKey, true); }
    function onKey(ev) { if (ev.key === 'Escape') { ev.stopPropagation(); close(); } }
    document.addEventListener('keydown', onKey, true);
    v.addEventListener('click', async function (ev) {
      var b = ev.target.closest('button');
      if (!b) { if (ev.target.classList.contains('pane')) close(); return; }
      if (b.dataset.z && img) { z = Math.max(0.5, Math.min(5, z + (+b.dataset.z) * 0.5)); img.style.transform = 'scale(' + z + ')'; return; }
      var a = b.dataset.a;
      if (a === 'x') return close();
      try {
        var blob = await _toBlob(url), fn = fname + _ext(blob.type);
        if (a === 'dl') {
          var link = document.createElement('a'), ou = URL.createObjectURL(blob);
          link.href = ou; link.download = fn; document.body.appendChild(link); link.click(); link.remove();
          setTimeout(function () { URL.revokeObjectURL(ou); }, 4000);
        } else if (a === 'share') {
          var file = new File([blob], fn, { type: blob.type });
          if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: title || fn });
          else if (typeof showToast === 'function') showToast('اس آلے پر شیئر کی سہولت نہیں — ڈاؤن لوڈ کر کے بھیجیں', 'info');
        } else if (a === 'copy') {
          var png = blob;
          if (blob.type !== 'image/png') {
            var bm = await createImageBitmap(blob), c = document.createElement('canvas');
            c.width = bm.width; c.height = bm.height; c.getContext('2d').drawImage(bm, 0, 0);
            png = await new Promise(function (r) { c.toBlob(r, 'image/png'); });
          }
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
          if (typeof showToast === 'function') showToast('تصویر کاپی ہو گئی', 'success');
        } else if (a === 'print') {
          var w = window.open('', '_blank');
          if (!w) { if (typeof showToast === 'function') showToast('پاپ اپ کی اجازت دیں', 'error'); return; }
          var ou2 = URL.createObjectURL(blob);
          w.document.write('<!DOCTYPE html><html><head><title>' + e(fn) + '</title><style>@page{margin:10mm}body{margin:0;text-align:center}img{max-width:100%}</style></head><body>' +
            (/pdf/.test(blob.type) ? '<iframe src="' + ou2 + '" style="width:100%;height:100vh;border:0" onload="setTimeout(function(){window.focus();window.print();},500)"></iframe>'
              : '<img src="' + ou2 + '" onload="setTimeout(function(){window.focus();window.print();},300)">') + '</body></html>');
          w.document.close();
        }
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        if (typeof showToast === 'function') showToast(a === 'copy' ? 'اس browser میں تصویر کاپی نہیں ہو سکتی' : ('' + (err && err.message || err)), 'error');
      }
    });
  }

  /* ── کیمرہ / مقام ─────────────────────────────────────────── */
  function cameraButtons(key, max) {
    return '<label class="dio-cam" tabindex="0">' + ICON.cam + 'کیمرہ — پیچھے<input type="file" hidden accept="image/*" capture="environment" onchange="DIOCard._onFiles(this,\'' + key + '\',1,' + (max || 10) + ')"></label>' +
      '<label class="dio-cam" tabindex="0">' + ICON.cam + 'کیمرہ — سامنے<input type="file" hidden accept="image/*" capture="user" onchange="DIOCard._onFiles(this,\'' + key + '\',1,' + (max || 10) + ')"></label>';
  }
  function getLocation(targetId) {
    var t = document.getElementById(targetId);
    if (!navigator.geolocation) { if (typeof showToast === 'function') showToast('اس آلے پر مقام کی سہولت نہیں', 'error'); return; }
    if (typeof showToast === 'function') showToast('مقام لیا جا رہا ہے…', 'info');
    navigator.geolocation.getCurrentPosition(function (p) {
      if (t) t.value = p.coords.latitude.toFixed(6) + ', ' + p.coords.longitude.toFixed(6);
      if (typeof showToast === 'function') showToast('مقام مل گیا (درستگی تقریباً ' + Math.round(p.coords.accuracy) + ' میٹر)', 'success');
    }, function (err) {
      if (typeof showToast === 'function') showToast(err && err.code === 1 ? 'مقام کی اجازت نہیں دی گئی' : 'مقام نہیں مل سکا', 'error');
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }

  /* ── کارڈ کھولنا ───────────────────────────────────────────── */
  function footer(saveCall, saveLabel) {
    var mic = isPhone() ? '' : '<button type="button" class="dio-mic" id="dio-card-mic" aria-pressed="false" onmousedown="event.preventDefault()" onclick="DIOCard.micToggle()">' + ICON.mic + 'آواز سے لکھیں</button>';
    return '<button class="btn btn-primary" onclick="' + saveCall + '">' + e(saveLabel || 'محفوظ کریں') + '</button>' +
      '<button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>' + mic;
  }
  function title(item, edit) { return (edit ? 'ترمیم' : 'نیا اندراج') + ' — ' + item; }
  // نیا اندراج کارڈ کھولو
  function open(item, edit, body, saveCall, saveLabel) {
    injectCSS();
    if (typeof openModal !== 'function') return;
    openModal(title(item, edit), body, footer(saveCall, saveLabel));
    var mc = document.querySelector('#modal-backdrop .modal-card');
    if (mc) { mc.classList.add('dio-entry'); mc.scrollTop = 0; }
    var bd = document.getElementById('modal-backdrop');
    if (bd && isPhone()) bd.style.padding = '8px';
  }
  function micToggle() {
    if (typeof window._globalMicToggle === 'function') window._globalMicToggle();
  }

  /* ── ڈیٹابیس: نئے کالم نہ ہوں تو بھی محفوظ (اور اطلاع) ─────── */
  function _missingCol(err) {
    if (!err) return false;
    return err.code === 'PGRST204' || err.code === '42703' ||
      /column .*(does not exist|schema cache)|could not find the .* column/i.test(err.message || '');
  }
  // op: 'insert' | 'update'. optional: نئے کالم (sql/101) — نہ ہوں تو ان کے بغیر دوبارہ
  async function safeWrite(table, op, rec, id, optional) {
    var run = function (payload) {
      var q = supabaseClient.from(table);
      q = op === 'update' ? q.update(payload).eq('id', id) : q.insert(payload);
      return q.select().single();
    };
    var r = await run(rec);
    if (r.error && _missingCol(r.error) && optional && optional.length) {
      var slim = {};
      Object.keys(rec).forEach(function (k) { if (optional.indexOf(k) === -1) slim[k] = rec[k]; });
      r = await run(slim);
      if (!r.error && typeof showToast === 'function') {
        showToast('محفوظ ہو گیا، مگر اضافی تصاویر / سابقہ ریکارڈ کے لیے ڈیٹابیس اپڈیٹ (sql/101) ابھی نہیں چلی', 'info', 7000);
      }
      r.slim = true;
    }
    if (r.error) throw r.error;
    return r;
  }

  injectCSS();
  window.DIOCard = {
    isPhone: isPhone, esc: e, injectCSS: injectCSS, ICON: ICON,
    fmtCnic: fmtCnic, fmtMob: fmtMob, fmtDate: fmtDate, fmtTime: fmtTime, dmyToIso: dmyToIso, isoToDmy: isoToDmy,
    fld: fld, row: row, _pick: _pick,
    nameField: nameField, readName: readName, splitNameInput: splitNameInput, splitName: splitName, joinName: joinName, coreName: coreName,
    caseField: caseField, readCase: readCase, loadCases: loadCases,
    uploads: uploads, setFiles: setFiles, getFiles: getFiles, _onFiles: _onFiles, removeFile: removeFile, viewKey: viewKey,
    viewer: viewer, cameraButtons: cameraButtons, getLocation: getLocation, compress: compress,
    open: open, title: title, footer: footer, micToggle: micToggle, safeWrite: safeWrite, _missingCol: _missingCol
  };
})();
