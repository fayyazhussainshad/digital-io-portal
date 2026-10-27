/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — dio-prev.js  (سابقہ ریکارڈ — ملزم / گواہ کارڈ)
   ────────────────────────────────────────────────────────────────
   • نام یا شناختی کارڈ لکھتے ہی، اسی افسر کے دوسرے مقدمات میں اس
     شخص کا ریکارڈ (ملزم / گواہ / مدعی) کارڈ کے نیچے خود ظاہر ہوتا ہے۔
   • سابقہ ریکارڈ ہاتھ سے بھی شامل ہو سکتا ہے:
       FIR نمبر · تاریخ · جرم · تھانہ · ضلع · حیثیت · فیصلہ
   • ہر ریکارڈ: دیکھیں · کاپی · ڈاؤن لوڈ۔ کاپی کیا ہوا ریکارڈ کسی
     دوسرے کارڈ میں «چسپاں کریں» سے خانوں میں خود بھر جاتا ہے۔
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var HAISIYAT = ['ملزم', 'گواہ', 'مدعی'];
  var FAISLA = ['چالان', 'سزا', 'بری', 'ڈسچارج', 'بے گناہ'];
  var _manual = [];
  var _auto = [];
  var _timer = null;
  var _ctx = null;

  function e(s) { return (window.DIOCard ? DIOCard.esc(s) : String(s == null ? '' : s)); }
  function toast(m, t) { if (typeof showToast === 'function') showToast(m, t || 'info'); }

  var CSS = [
    '.dio-prev{margin-top:14px;border:1.5px solid #7c3aed;border-radius:12px;padding:4px 12px 10px;background:rgba(124,58,237,.06);direction:rtl;}',
    '.dio-prev-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:var(--dio-h3,11.25pt);font-weight:700;color:#7c3aed;line-height:2.2;}',
    '.dio-prev-h .sp{margin-inline-start:auto;display:flex;gap:6px;flex-wrap:wrap;}',
    '.dio-mini{border:1px solid var(--border,#c8d8e8);background:var(--bg-card,#fff);color:var(--text-primary,#111);border-radius:8px;',
    "  padding:0 10px 4px;font-size:11pt;line-height:2;cursor:pointer;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;}",
    '.dio-mini.v{border-color:#7c3aed;color:#7c3aed;}',
    '.dio-rec{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:0 12px;background:var(--bg-card,#fff);',
    '  border:1px solid var(--border,#c8d8e8);border-radius:10px;padding:4px 10px 6px;margin-top:6px;font-size:12pt;line-height:2;}',
    '.dio-rec b{color:var(--text-muted,#64748b);font-weight:400;font-size:10pt;margin-inline-end:4px;}',
    '.dio-rec .acts{grid-column:1/-1;display:flex;gap:6px;flex-wrap:wrap;}',
    '.dio-rec .more{grid-column:1/-1;font-size:11pt;color:var(--text-muted,#64748b);}',
    '.dio-rec .role{display:inline-block;border:1px solid currentColor;border-radius:999px;padding:0 9px 2px;font-size:10pt;line-height:1.8;}',
    '.dio-rec .role.r-mudai{color:#7c3aed;}.dio-rec .role.r-mulzim{color:#ea580c;}.dio-rec .role.r-gawah{color:#0369a1;}',
    '.dio-src{display:inline-block;border-radius:6px;padding:0 8px 2px;font-size:10pt;line-height:1.8;background:#ede9fe;color:#5b21b6;}',
    '.dio-src.s{background:#e0f2fe;color:#075985;}.dio-src.m{background:#fef3c7;color:#92400e;}',
    '.dio-paste{width:100%;margin-top:10px;min-height:52px;box-sizing:border-box;font-size:12pt;border:1.5px dashed #7c3aed;border-radius:9px;',
    "  background:var(--bg-card,#fff);color:var(--text-primary,#111);padding:6px 10px;resize:vertical;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;}"
  ].join('\n');
  function css() {
    if (document.getElementById('dio-prev-css')) return;
    var s = document.createElement('style'); s.id = 'dio-prev-css'; s.textContent = CSS; document.head.appendChild(s);
  }

  /* ── متن (کاپی / چسپاں ایک ہی format) ─────────────────────── */
  function toText(r) {
    var p = [];
    if (r.name) p.push(r.name);
    p.push('مقدمہ ' + (r.fir || '—') + ' مورخہ ' + (r.date || '—'));
    p.push('جرم ' + (r.jurm || '—'));
    p.push('تھانہ ' + (r.thana || '—') + ' ضلع ' + (r.zila || '—'));
    p.push('حیثیت ' + (r.haisiyat || '—'));
    p.push('فیصلہ ' + (r.faisla || '—'));
    return p.join(' — ');
  }
  function parse(text) {
    var t = String(text || '').replace(/\s+/g, ' ').trim();
    if (!t) return null;
    var g = function (re) { var m = re.exec(t); return m ? m[1].trim().replace(/^—$/, '') : ''; };
    var r = {
      fir: g(/مقدمہ\s+([^\s—]+)/),
      date: g(/مورخہ\s+([\d\/\-.]+)/),
      jurm: g(/جرم\s+([^—]+?)(?:\s+—|$)/),
      thana: g(/تھانہ\s+(.+?)\s+ضلع/),
      zila: g(/ضلع\s+([^—]+?)(?:\s+—|$)/),
      haisiyat: g(/حیثیت\s+([^—\s]+)/),
      faisla: g(/فیصلہ\s+([^—]+?)(?:\s+—|$)/)
    };
    if (!r.fir && !r.jurm && !r.thana) return null;
    if (r.date && window.DIOCard) r.date = DIOCard.isoToDmy(r.date);
    if (HAISIYAT.indexOf(r.haisiyat) === -1) r.haisiyat = r.haisiyat || '';
    return r;
  }
  function copy(r) {
    var txt = toText(r);
    var done = function () { toast('ریکارڈ کاپی ہو گیا — کسی بھی کارڈ میں «چسپاں کریں» سے لگا سکتے ہیں', 'success'); };
    try {
      navigator.clipboard.writeText(txt).then(done, function () { _fallbackCopy(txt); done(); });
    } catch (_) { _fallbackCopy(txt); done(); }
  }
  function _fallbackCopy(txt) {
    var ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ } ta.remove();
  }
  function download(list, who) {
    var txt = list.map(function (r, i) { return (list.length > 1 ? (i + 1) + '۔ ' : '') + toText(r); }).join('\n');
    if (!txt) return;
    var blob = new Blob(['﻿' + 'سابقہ ریکارڈ' + (who ? ' — ' + who : '') + '\n\n' + txt + '\n'], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a'), u = URL.createObjectURL(blob);
    a.href = u; a.download = 'sabiqa_record' + (who ? '_' + String(who).replace(/\s+/g, '_').slice(0, 30) : '') + '.txt';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
  }

  /* ── پینل ─────────────────────────────────────────────────── */
  function recHtml(r, kind, i) {
    var roleCls = r.haisiyat === 'مدعی' ? 'r-mudai' : r.haisiyat === 'ملزم' ? 'r-mulzim' : 'r-gawah';
    return '<div class="dio-rec">' +
      (r.name ? '<div style="grid-column:1/-1;"><b>نام</b>' + e(r.name) + '</div>' : '') +
      '<div><b>FIR</b><span dir="ltr">' + e(r.fir || '—') + '</span></div>' +
      '<div><b>تاریخ</b><span dir="ltr">' + e(r.date || '—') + '</span></div>' +
      '<div><b>جرم</b>' + e(r.jurm || '—') + '</div>' +
      '<div><b>تھانہ</b>' + e(r.thana || '—') + '</div>' +
      '<div><b>ضلع</b>' + e(r.zila || '—') + '</div>' +
      '<div><b>حیثیت</b><span class="role ' + roleCls + '">' + e(r.haisiyat || '—') + '</span></div>' +
      '<div><b>فیصلہ</b>' + e(r.faisla || '—') + '</div>' +
      '<div class="more" id="dio-prev-more-' + kind + i + '" hidden>' + e(r.more || '') + '</div>' +
      '<div class="acts">' +
      (r.more ? '<button type="button" class="dio-mini" onclick="DIOPrev._toggleMore(\'' + kind + i + '\')">دیکھیں</button>' : '') +
      '<button type="button" class="dio-mini" onclick="DIOPrev._copy(\'' + kind + '\',' + i + ')">کاپی</button>' +
      '<button type="button" class="dio-mini" onclick="DIOPrev._dl(\'' + kind + '\',' + i + ')">ڈاؤن لوڈ</button>' +
      (kind === 'm' ? '<button type="button" class="dio-mini" onclick="DIOPrev._remove(' + i + ')">ہٹائیں</button>' : '') +
      '</div></div>';
  }
  function _drawManual() {
    var box = document.getElementById('dio-prev-list');
    if (box) box.innerHTML = _manual.map(function (r, i) { return recHtml(r, 'm', i); }).join('');
    var c = document.getElementById('dio-prev-mcount');
    if (c) c.textContent = _manual.length ? '(' + _manual.length + ')' : '';
  }
  function _drawAuto(state) {
    var box = document.getElementById('dio-prev-auto');
    if (!box) return;
    if (state === 'offline') { box.innerHTML = '<div class="dio-hint">سابقہ ریکارڈ کی خودکار تلاش کے لیے انٹرنیٹ درکار ہے۔</div>'; return; }
    if (!_auto.length) { box.innerHTML = state === 'none' ? '<div class="dio-hint">دوسرے مقدمات میں کوئی ریکارڈ نہیں ملا۔</div>' : ''; return; }
    box.innerHTML = '<div class="dio-prev-h">دوسرے مقدمات میں ریکارڈ ملا (' + _auto.length + ')' +
      '<span class="sp"><button type="button" class="dio-mini v" onclick="DIOPrev._dlAll()">سب ڈاؤن لوڈ</button></span></div>' +
      _auto.map(function (r, i) { return recHtml(r, 'a', i); }).join('');
  }
  // records: محفوظ شدہ (prev_records)
  function panel(records) {
    css();
    _manual = Array.isArray(records) ? records.slice() : [];
    _auto = [];
    var D = window.DIOCard;
    var addForm = D.row([
      D.fld({ id: 'dp-fir', label: 'FIR نمبر', ltr: true, w: 'w-fir', ph: '000/2026' }),
      D.fld({ id: 'dp-date', label: 'تاریخ', type: 'date' }),
      D.fld({ id: 'dp-jurm', label: 'جرم', w: 'w-l', grow: true, ph: 'مثلاً 379 ت پ' })
    ]) + D.row([
      D.fld({ id: 'dp-thana', label: 'تھانہ', w: 'w-l', grow: true, ph: 'تھانہ' }),
      D.fld({ id: 'dp-zila', label: 'ضلع', w: 'w-m', ph: 'ضلع' }),
      D.fld({ id: 'dp-h', label: 'حیثیت', type: 'sel', w: 'w-s', opts: HAISIYAT }),
      D.fld({ id: 'dp-f', label: 'فیصلہ', type: 'sel', w: 'w-m', opts: FAISLA })
    ]) +
      '<textarea class="dio-paste" id="dp-paste" placeholder="یا کاپی کیا ہوا ریکارڈ یہاں چسپاں کریں (Ctrl+V / دبا کر Paste) — خانے خود بھر جائیں گے" oninput="DIOPrev._onPaste(this)"></textarea>' +
      '<div class="dio-row" style="padding-top:8px;"><button type="button" class="btn btn-primary btn-sm" onclick="DIOPrev._add()">ریکارڈ شامل کریں</button>' +
      '<button type="button" class="btn btn-secondary btn-sm" onclick="DIOPrev._toggleAdd(false)">بند کریں</button></div>';
    return '<div class="dio-prev" id="dio-prev">' +
      '<div id="dio-prev-auto"></div>' +
      '<div class="dio-prev-h">سابقہ ریکارڈ <span id="dio-prev-mcount"></span><span class="sp">' +
      '<button type="button" class="dio-mini v" onclick="DIOPrev._toggleAdd(true)">+ سابقہ ریکارڈ درج کریں</button></span></div>' +
      '<div id="dio-prev-list">' + _manual.map(function (r, i) { return recHtml(r, 'm', i); }).join('') + '</div>' +
      '<div id="dio-prev-add" hidden>' + addForm + '</div></div>';
  }
  function _toggleAdd(on) { var b = document.getElementById('dio-prev-add'); if (b) b.hidden = !on; if (on) { var f = document.getElementById('dp-fir'); if (f) f.focus(); } }
  function _val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function _set(id, v) { var el = document.getElementById(id); if (el && v) el.value = v; }
  function _add() {
    var r = { fir: _val('dp-fir'), date: _val('dp-date'), jurm: _val('dp-jurm'), thana: _val('dp-thana'), zila: _val('dp-zila'), haisiyat: _val('dp-h'), faisla: _val('dp-f') };
    if (!r.fir && !r.jurm) { toast('کم از کم FIR نمبر یا جرم لکھیں', 'error'); return; }
    _manual.push(r);
    ['dp-fir', 'dp-date', 'dp-jurm', 'dp-thana', 'dp-zila', 'dp-paste'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
    _drawManual();
    toast('سابقہ ریکارڈ شامل — کارڈ محفوظ کرنے پر محفوظ ہوگا', 'success');
  }
  function _onPaste(ta) {
    var r = parse(ta.value);
    if (!r) return;
    _set('dp-fir', r.fir); _set('dp-date', r.date); _set('dp-jurm', r.jurm); _set('dp-thana', r.thana); _set('dp-zila', r.zila);
    if (r.haisiyat) _set('dp-h', r.haisiyat);
    if (r.faisla) _set('dp-f', r.faisla);
  }
  function _remove(i) { _manual.splice(i, 1); _drawManual(); }
  function _toggleMore(k) { var el = document.getElementById('dio-prev-more-' + k); if (el) el.hidden = !el.hidden; }
  function _pick(kind, i) { return (kind === 'a' ? _auto : kind === 's' ? _shown : _manual)[i]; }
  function _copy(kind, i) { var r = _pick(kind, i); if (r) copy(r); }
  function _dl(kind, i) { var r = _pick(kind, i); if (r) download([r], r.name); }
  function _dlAll() { download(_auto.concat(_manual), _ctx && _ctx.who); }
  function read() { return _manual.slice(); }

  /* ── خودکار تلاش ──────────────────────────────────────────── */
  // ctx: {nameIds:[..], cnicId, selfTable, selfId, caseId}
  function watch(ctx) {
    _ctx = ctx || {};
    var ids = (ctx.nameIds || []).concat(ctx.cnicId ? [ctx.cnicId] : []);
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function () { clearTimeout(_timer); _timer = setTimeout(run, 650); });
    });
    setTimeout(run, 50);
  }
  function _nameNow() {
    var nm = '';
    (_ctx.nameIds || []).some(function (id) { var el = document.getElementById(id); if (el && el.value.trim()) { nm = el.value.trim(); return true; } return false; });
    return DIOCard.coreName(nm);
  }
  async function run() {
    if (!_ctx || !document.getElementById('dio-prev')) return;
    var core = _nameNow();
    var cnEl = _ctx.cnicId ? document.getElementById(_ctx.cnicId) : null;
    var digits = cnEl ? cnEl.value.replace(/\D/g, '') : '';
    _ctx.who = core;
    if (core.length < 3 && digits.length !== 13) { _auto = []; _drawAuto(''); return; }
    if (!navigator.onLine || typeof supabaseClient === 'undefined' || !supabaseClient) { _auto = []; _drawAuto('offline'); return; }
    var stamp = core + '|' + digits;
    _ctx._stamp = stamp;
    try {
      var out = await query(core, digits, _ctx);
      if (_ctx._stamp !== stamp) return;   // پرانا جواب
      _auto = out;
      _drawAuto(_auto.length ? 'found' : 'none');
    } catch (_) { _auto = []; _drawAuto(''); }
  }

  /* ── تلاش (فارم کے بغیر بھی) — دوسرے مقدمات میں یہی شخص ───────────
     ctx: {selfTable, selfId, caseId} → [{name, fir, date, jurm, thana, zila, haisiyat, faisla, more}] */
  async function query(core, digits, ctx) {
    ctx = ctx || {};
    var cn = digits.length === 13 ? [DIOCard.fmtCnic(digits), digits] : null;
    var esc = function (s) { return String(s).replace(/[%_,()]/g, ' ').trim(); };
    var like = core.length >= 3 ? esc(core) + '%' : null;
    var orA = [], orW = [], orC = [];
    if (cn) { orA.push('cnic.in.(' + cn.join(',') + ')'); orW.push('cnic.in.(' + cn.join(',') + ')'); orC.push('complainant_cnic.in.(' + cn.join(',') + ')'); }
    if (like) { orA.push('name.ilike.' + like); orW.push('full_name.ilike.' + like); orC.push('complainant.ilike.' + like); }
    {
      var oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
      var qA = supabaseClient.from('case_accused').select('id,case_id,name,cnic,mobile').or(orA.join(',')).limit(20);
      var qW = supabaseClient.from('case_witnesses').select('id,case_id,full_name,cnic,cell,status').or(orW.join(',')).limit(20);
      var qC = supabaseClient.from('cases').select('id,fir_number,fir_date,section_of_law,complainant,complainant_cnic,status,case_station,case_district');
      if (oid) qC = qC.eq('officer_id', oid);
      qC = qC.or(orC.join(',')).limit(20);
      var res = await Promise.all([qA, qW, qC]);
      var A = (res[0] && res[0].data) || [], W = (res[1] && res[1].data) || [], C = (res[2] && res[2].data) || [];
      var skip = function (r, table) { return (ctx.selfTable === table && String(r.id) === String(ctx.selfId)) || (ctx.caseId && String(r.case_id) === String(ctx.caseId)); };
      A = A.filter(function (r) { return !skip(r, 'case_accused'); });
      W = W.filter(function (r) { return !skip(r, 'case_witnesses'); });
      C = C.filter(function (c) { return !(ctx.caseId && String(c.id) === String(ctx.caseId)); });
      var ids = {};
      A.concat(W).forEach(function (r) { if (r.case_id) ids[r.case_id] = 1; });
      var caseMap = {};
      C.forEach(function (c) { caseMap[c.id] = c; });
      var need = Object.keys(ids).filter(function (k) { return !caseMap[k]; });
      if (need.length) {
        var cr = await supabaseClient.from('cases').select('id,fir_number,fir_date,section_of_law,complainant,status,case_station,case_district').in('id', need);
        ((cr && cr.data) || []).forEach(function (c) { caseMap[c.id] = c; });
      }
      var st = function (c) {
        var map = { complete: 'چالان', incomplete: 'چالان', challan512: 'چالان', cancel: 'اخراج', untrace: 'عدم پتہ', under: 'زیر تفتیش' };
        return (c && map[c.status]) || '';
      };
      var mk = function (c, name, role, more) {
        c = c || {};
        return { name: name, fir: c.fir_number || '', date: c.fir_date ? DIOCard.isoToDmy(c.fir_date) : '',
          jurm: (c.section_of_law || '').trim(), thana: c.case_station || '', zila: c.case_district || '', haisiyat: role, faisla: st(c), more: more };
      };
      var out = [];
      A.forEach(function (r) { out.push(mk(caseMap[r.case_id], r.name, 'ملزم', [r.cnic, r.mobile].filter(Boolean).join(' · '))); });
      W.forEach(function (r) { out.push(mk(caseMap[r.case_id], r.full_name, r.status === 'mudai' ? 'مدعی' : 'گواہ', [r.cnic, r.cell].filter(Boolean).join(' · '))); });
      C.forEach(function (c) { out.push(mk(c, c.complainant, 'مدعی', c.complainant_cnic || '')); });
      // ایک ہی مقدمے میں ایک شخص دو بار نہ آئے
      var seen = {};
      return out.filter(function (r) { var k = r.fir + '|' + r.haisiyat + '|' + DIOCard.coreName(r.name); if (seen[k]) return false; seen[k] = 1; return true; });
    }
  }

  /* ── v553: «سابقہ ریکارڈ» بٹن — سسٹم کا ریکارڈ خودکار + خود درج کیا ہوا، یکجا ──
     افسر کا قاعدہ: «یہ بٹن سسٹم کے ریکارڈ کو خودکار fetch کرے اور شامل کیے گئے دونوں
     ریکارڈ کو یکجا کر کے دکھائے، کوئی دہراؤ نہ ہو۔» */
  function _normFir(f) {
    var t = String(f || '').replace(/[\s\u200e\u200f]/g, '').replace(/[\u06F0-\u06F9]/g, function (d) { return String(d.charCodeAt(0) - 0x06F0); });
    var m = /^0*(\d+)\/(\d{2}|\d{4})$/.exec(t);
    if (m) return m[1] + '/' + m[2].slice(-2);
    return t.toLowerCase();
  }
  function _normTxt(x) { return String(x || '').replace(/^تھانہ\s*/, '').replace(/\s+/g, ' ').trim(); }
  // ایک ہی مقدمہ (FIR + تھانہ اگر دونوں میں ہو) اور ایک ہی حیثیت (اگر دونوں میں ہو) = دہراؤ
  function same(a, b) {
    var fa = _normFir(a.fir), fb = _normFir(b.fir);
    if (!fa || !fb || fa !== fb) return false;
    var ta = _normTxt(a.thana), tb = _normTxt(b.thana);
    if (ta && tb && ta !== tb) return false;
    var ha = _normTxt(a.haisiyat), hb = _normTxt(b.haisiyat);
    if (ha && hb && ha !== hb) return false;
    return true;
  }
  function merge(auto, manual) {
    var out = [];
    (auto || []).forEach(function (r) { var x = Object.assign({ src: 'system' }, r); if (!out.some(function (y) { return same(x, y); })) out.push(x); });
    (manual || []).forEach(function (r) {
      var x = Object.assign({ src: 'manual' }, r);
      var hit = out.find(function (y) { return same(x, y); });
      if (hit) {   // دونوں میں — ایک ہی ریکارڈ، خالی خانے ایک دوسرے سے پُر
        ['date', 'jurm', 'thana', 'zila', 'haisiyat', 'faisla'].forEach(function (k) { if (!hit[k] && x[k]) hit[k] = x[k]; });
        hit.src = 'both';
      } else out.push(x);
    });
    return out;
  }
  async function search(o) {
    o = o || {};
    var core = window.DIOCard ? DIOCard.coreName(o.name || '') : String(o.name || '').trim();
    var digits = String(o.cnic || '').replace(/\D/g, '');
    if (core.length < 3 && digits.length !== 13) return [];
    if (!navigator.onLine || typeof supabaseClient === 'undefined' || !supabaseClient) throw new Error('offline');
    return query(core, digits, o);
  }
  var _shown = [];
  function show(title, list, who, note) {
    css();
    _shown = list || [];
    var src = function (r) {
      return r.src === 'both' ? '<span class="dio-src">سسٹم + درج شدہ</span>' : r.src === 'manual' ? '<span class="dio-src m">درج شدہ</span>' : '<span class="dio-src s">سسٹم</span>';
    };
    var body = '<div class="dio-prev" style="margin-top:0;">' +
      (note ? '<div class="dio-hint">' + e(note) + '</div>' : '') +
      (_shown.length
        ? _shown.map(function (r, i) { return recHtml(r, 's', i).replace('<div class="dio-rec">', '<div class="dio-rec"><div style="grid-column:1/-1;">' + src(r) + '</div>'); }).join('')
        : '<div class="dio-hint" style="text-align:center;padding:16px 0;">اس شخص کا کسی دوسرے مقدمے میں کوئی سابقہ ریکارڈ نہیں ملا۔</div>') +
      '</div>';
    var foot = (_shown.length ? '<button class="btn btn-secondary" onclick="DIOPrev._dlShown()">سب ڈاؤن لوڈ</button>' : '') +
      '<button class="btn btn-secondary" onclick="closeModal()">بند کریں</button>';
    _shownWho = who || '';
    if (typeof openModal === 'function') openModal(title + (_shown.length ? ' (' + _shown.length + ')' : ''), body, foot);
  }
  var _shownWho = '';
  // یکجا فہرست — ایک شخص کے لیے: سسٹم کی تلاش + اس کے اپنے درج شدہ ریکارڈ
  async function forPerson(o) {
    var manual = Array.isArray(o.manual) ? o.manual : [];
    var auto = [], note = '';
    try { auto = await search(o); }
    catch (_) { note = 'سسٹم کے ریکارڈ کی خودکار تلاش کے لیے انٹرنیٹ درکار ہے — صرف درج شدہ ریکارڈ دکھایا جا رہا ہے۔'; }
    return { list: merge(auto, manual), note: note };
  }

  window.DIOPrev = {
    panel: panel, watch: watch, read: read, run: run, parse: parse, toText: toText,
    search: search, merge: merge, same: same, show: show, forPerson: forPerson,
    _dlShown: function () { download(_shown, _shownWho); },
    _toggleAdd: _toggleAdd, _add: _add, _onPaste: _onPaste, _remove: _remove, _toggleMore: _toggleMore,
    _copy: _copy, _dl: _dl, _dlAll: _dlAll
  };
})();
