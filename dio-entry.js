/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — dio-entry.js  (Dashboard کا «نیا اندراج»)
   ────────────────────────────────────────────────────────────────
   • ایک ہی «نیا اندراج» بٹن: مقدمہ · ملزم · گواہ · ہمراہی ملازم ·
     پیشی / یاددہانی · شہادت · 5-C درخواست · واقعاتی رپورٹ (v535) · گشت (v548)۔ ہر کارڈ کے اوپر «مقدمہ» — اندراج خود
     اسی مقدمے میں شامل ہوتا ہے (ہر مقدمے میں الگ جا کر کرنے کی ضرورت نہیں)۔
   • پیشی اور یاددہانی کا ایک ہی کارڈ (پیشی کی تمام تفصیل سمیت)۔
   • شہادت: نام کا خانہ نہیں؛ ترتیب — مقدمہ، قسم، تاریخ و وقت (خود،
     بدلے جا سکتے ہیں)، مقام (Lat, Long)، کیمرہ (پیچھے / سامنے)۔
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  function e(s) { return window.DIOCard ? DIOCard.esc(s) : String(s == null ? '' : s); }
  function toast(m, t, d) { if (typeof showToast === 'function') showToast(m, t || 'info', d); }
  async function need(files) {
    if (typeof window._dioNeed === 'function') { await window._dioNeed(files); return; }
    if (typeof window.dioLoadScript === 'function') { for (var i = 0; i < files.length; i++) await window.dioLoadScript(files[i]); }
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  var HUB_CSS = [
    '.dio-hub{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;direction:rtl;padding-top:6px;}',
    '@media (max-width:760px){.dio-hub{grid-template-columns:repeat(2,1fr);}}',
    '.dio-hub button{border:1.5px solid var(--border,#c8d8e8);border-radius:12px;background:var(--bg-secondary,rgba(0,0,0,.02));',
    '  padding:10px 8px 12px;display:grid;justify-items:center;gap:2px;cursor:pointer;color:var(--text-primary,#111);',
    "  font-size:13pt;line-height:2;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;}",
    '.dio-hub button:hover,.dio-hub button:focus-visible{border-color:var(--accent,#0369a1);background:var(--accent-glow,rgba(3,105,161,.08));outline:none;}',
    '.dio-hub svg{width:28px;height:28px;color:var(--accent,#0369a1);}',
    '.dio-kind{display:flex;gap:8px;padding-top:12px;}',
    '.dio-kind button{flex:1;border:1.5px solid var(--border,#c8d8e8);background:var(--bg-card,#fff);color:var(--text-primary,#111);border-radius:9px;',
    "  padding:2px 10px 7px;font-size:13pt;line-height:2;cursor:pointer;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;}",
    '.dio-kind button[aria-pressed="true"]{border-color:var(--accent,#0369a1);background:var(--accent-glow,rgba(3,105,161,.1));color:var(--accent,#0369a1);font-weight:700;}'
  ].join('\n');
  function css() {
    if (document.getElementById('dio-entry-css')) return;
    var s = document.createElement('style'); s.id = 'dio-entry-css'; s.textContent = HUB_CSS; document.head.appendChild(s);
  }

  var SVG = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
  var HUB = [
    ['muqadma', 'مقدمہ', SVG('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>')],
    ['mulzim', 'ملزم', SVG('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>')],
    ['gawah', 'گواہ', SVG('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>')],
    ['hamrahi', 'ہمراہی ملازم', SVG('<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>')],
    ['peshi', 'پیشی / یاددہانی', SVG('<path d="M4 6.5h16V20H4z"/><path d="M4 10.5h16"/><path d="M8 3.5v4"/><path d="M16 3.5v4"/>')],
    ['shahadat', 'شہادت', SVG('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>')],
    ['fivec', '\u20665-C\u2069 درخواست', SVG('<path d="M4 5h16v14H4z"/><path d="M4 7l8 6 8-6"/>')],
    ['waqiati', 'واقعاتی رپورٹ', SVG('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M12 10.5v4"/><path d="M12 17.3h.01"/>')],
    ['gasht', 'گشت', SVG('<circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="5" r="2.2"/><path d="M8 19h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7"/>')]
  ];

  function hub() {
    css();
    if (window.DIO && DIO.sub && typeof DIO.sub.guard === 'function' && !DIO.sub.guard('نیا اندراج')) return;
    openModal('نیا اندراج',
      '<div class="dio-hint" style="padding-top:4px;">کیا درج کرنا ہے؟ ہر اندراج کے اوپر مقدمہ منتخب کریں — اندراج خود اسی مقدمے میں چلا جائے گا۔</div>' +
      '<div class="dio-hub">' + HUB.map(function (h) {
        return '<button type="button" onclick="DIOEntry.go(\'' + h[0] + '\')">' + h[2] + e(h[1]) + '</button>';
      }).join('') + '</div>',
      '<button class="btn btn-secondary" onclick="closeModal()">بند کریں</button>');
    var mc = document.querySelector('#modal-backdrop .modal-card');
    if (mc) mc.classList.add('dio-entry');
  }

  async function go(kind) {
    try {
      if (kind === 'muqadma') { if (typeof openAddCaseModal === 'function') await openAddCaseModal(); return; }
      if (kind === 'mulzim') { await need(['mulziman.js']); await _openAccusedForm(null, 'fir', { hub: true }); return; }
      if (kind === 'gawah') { await need(['witnesses.js']); await _openWitnessForm(null, 'fir', { hub: true }); return; }
      if (kind === 'hamrahi') { await need(['staff-v2.js']); await _stForm(null, { hub: true }); return; }
      if (kind === 'peshi') { await peshi('peshi', null, { hub: true }); return; }
      if (kind === 'shahadat') { await evidence({ hub: true }); return; }
      if (kind === 'fivec') { await need(['fivec.js']); await open5CForm(null); return; }
      // واقعاتی رپورٹ مقدمے سے منسلک نہیں (اختیاری «مقدمہ سے» رپورٹ کے اندر) — سیدھا نئی رپورٹ
      if (kind === 'waqiati') {
        await need(['incident.js']);
        if (typeof closeModal === 'function') closeModal();
        if (typeof window.openIncidentNew === 'function') window.openIncidentNew();
        return;
      }
      // گشت (v548) — جاری گشت ہو تو سیدھا اسی کا اندراج، ورنہ نیا گشت
      if (kind === 'gasht') {
        await need(['gasht.js']);
        if (typeof closeModal === 'function') closeModal();
        if (typeof window.openGashtEntry === 'function') window.openGashtEntry();
        return;
      }
    } catch (err) { toast('' + (err && err.message || err), 'error'); }
  }

  /* ── پیشی / یاددہانی ─────────────────────────────────────── */
  var _pk = 'peshi', _pExisting = null;
  async function peshi(kind, existing, opts) {
    opts = opts || {};
    var D = window.DIOCard;
    css();
    _pk = kind || 'peshi';
    _pExisting = existing || null;
    var x = existing || {};
    var isP = _pk === 'peshi';
    var caseHtml = await D.caseField(x.case_id || opts.caseId || '');
    var tabs = existing ? '' : '<div class="dio-kind" role="group" aria-label="قسم">' +
      '<button type="button" aria-pressed="' + isP + '" onclick="DIOEntry._switch(\'peshi\')">پیشی</button>' +
      '<button type="button" aria-pressed="' + (!isP) + '" onclick="DIOEntry._switch(\'yad\')">یاددہانی</button></div>';
    var body = tabs + caseHtml +
      D.row([
        D.fld({ id: 'pe-date', label: isP ? 'پیشی کی تاریخ' : 'تاریخ', req: true, type: 'date', value: x.hearing_date || x.reminder_date || '' }),
        isP ? D.fld({ id: 'pe-time', label: 'وقت', type: 'time', value: x.hearing_time ? String(x.hearing_time).slice(0, 5) : '' }) : '',
        isP ? D.fld({ id: 'pe-purpose', label: 'پیشی کا مقصد', type: 'sel', w: 'w-s', value: x.purpose || '',
          opts: ['شہادت', 'دلائل', 'فیصلہ', 'ضمانت', 'ریمانڈ', 'چالان', 'دیگر'] }) : '',
        !isP ? D.fld({ id: 'pe-priority', label: 'اہمیت', type: 'sel', w: 'w-s', value: 'medium',
          opts: [['high', 'زیادہ'], ['medium', 'درمیانی'], ['low', 'کم']] }) : ''
      ]) +
      (isP ? D.row([
        D.fld({ id: 'pe-court', label: 'عدالت کا نام', req: true, w: 'w-l', grow: true, value: x.court_name, ph: 'مثلاً: سیشن کورٹ ملتان' }),
        D.fld({ id: 'pe-judge', label: 'جج کا نام', w: 'w-l', grow: true, value: x.judge_name, ph: 'جج کا نام' })
      ]) : '') +
      D.row([D.fld({ id: 'pe-text', label: isP ? 'نوٹس / ہدایت' : 'یاددہانی کا متن', req: !isP, type: 'area', line: true,
        value: isP ? x.notes : '', ph: isP ? 'کوئی خاص ہدایت…' : 'کیا یاد دلانا ہے…' })]);
    D.open(isP ? 'پیشی' : 'یاددہانی', !!existing, body, 'DIOEntry._savePeshi()');
  }
  async function _switch(k) {
    // جو لکھا جا چکا وہ ساتھ رہے
    var keep = {};
    ['dio-case', 'pe-date', 'pe-text'].forEach(function (id) { var el = document.getElementById(id); if (el) keep[id] = el.value; });
    await peshi(k, null);
    Object.keys(keep).forEach(function (id) { var el = document.getElementById(id); if (el && keep[id]) el.value = keep[id]; });
  }
  async function _savePeshi() {
    var D = window.DIOCard;
    var cs = D.readCase();
    var dateIso = D.dmyToIso((document.getElementById('pe-date') || {}).value || '');
    var text = ((document.getElementById('pe-text') || {}).value || '').trim();
    if (!dateIso) { toast('تاریخ درست لکھیں (DD/MM/YYYY)', 'error'); return; }
    try {
      if (_pk === 'peshi') {
        var court = ((document.getElementById('pe-court') || {}).value || '').trim();
        if (!court) { toast('عدالت کا نام درج کریں', 'error'); return; }
        var t = ((document.getElementById('pe-time') || {}).value || '').trim();
        if (t && !/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) { toast('وقت درست لکھیں (HH:MM)', 'error'); return; }
        var payload = {
          fir_number: cs ? cs.fir : '',
          case_id: cs ? cs.id : null,
          hearing_date: dateIso,
          hearing_time: t,
          court_name: court,
          judge_name: ((document.getElementById('pe-judge') || {}).value || '').trim(),
          purpose: (document.getElementById('pe-purpose') || {}).value || '',
          notes: text
        };
        if (_pExisting && _pExisting.id) {
          // v547: 0 قطار (RLS/میعاد ختم) بھی ناکامی — ورنہ «محفوظ» کا جھوٹا پیغام
          dioWriteOk(await supabaseClient.from('court_dates').update(payload).eq('id', _pExisting.id).select('id'), 'peshi update', true);
        } else {
          payload.status = 'pending';
          payload.officer_id = await getOfficerId();
          var r = await supabaseClient.from('court_dates').insert(payload);
          if (r.error) throw r.error;
        }
        closeModal();
        toast('پیشی محفوظ ہو گئی', 'success');
        if (window._activePage === 'court' && typeof renderCourt === 'function') { var c = document.getElementById('page-content'); if (c) renderCourt(c); }
      } else {
        if (!text) { toast('یاددہانی کا متن لکھیں', 'error'); return; }
        await addReminder({
          text: text,
          reminder_date: dateIso,
          priority: (document.getElementById('pe-priority') || {}).value || 'medium',
          linked_fir: cs ? cs.fir : null
        });
        closeModal();
        toast('یاددہانی محفوظ', 'success');
        if (window._activePage === 'reminders' && typeof _buildReminders === 'function') _buildReminders();
      }
      if (typeof updateBadges === 'function') { try { await updateBadges(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } }
    } catch (err) { toast('' + (err && err.message || err), 'error'); }
  }

  /* ── شہادت ───────────────────────────────────────────────── */
  var _evFiles = [];      // اصل فائلیں — شہادت کی تصویر compress نہیں ہوتی (اصل محفوظ)
  function _evThumbs() {
    var box = document.getElementById('ev-thumbs');
    if (!box) return;
    if (!_evFiles.length) { box.innerHTML = '<span class="dio-hint">ابھی کوئی فائل نہیں</span>'; return; }
    box.innerHTML = _evFiles.map(function (f, i) {
      var img = /^image\//.test(f.file.type);
      return '<span class="dio-th' + (img ? '' : ' pdf') + '" role="button" tabindex="0" title="دیکھیں" onclick="DIOEntry._evView(' + i + ')">' +
        (img ? '<img alt="" src="' + f.url + '">' : e((f.file.name.split('.').pop() || 'فائل').toUpperCase().slice(0, 4))) +
        '<button type="button" class="x" aria-label="ہٹائیں" onclick="event.stopPropagation();DIOEntry._evRemove(' + i + ')">✕</button></span>';
    }).join('');
  }
  function _evAdd(input) {
    Array.prototype.slice.call(input.files || []).forEach(function (f) {
      if (_evFiles.length >= 10) return;
      _evFiles.push({ file: f, url: URL.createObjectURL(f) });
    });
    input.value = '';
    _evThumbs();
  }
  function _evRemove(i) { var f = _evFiles.splice(i, 1)[0]; if (f) URL.revokeObjectURL(f.url); _evThumbs(); }
  function _evView(i) {
    var f = _evFiles[i]; if (!f) return;
    if (/^image\/|pdf/.test(f.file.type)) DIOCard.viewer(f.url, f.file.name.replace(/\.[^.]+$/, ''), f.file.name);
    else toast('یہ فائل محفوظ ہونے کے بعد کھلے گی', 'info');
  }
  async function evidence(opts) {
    opts = opts || {};
    var D = window.DIOCard;
    _evFiles.forEach(function (f) { URL.revokeObjectURL(f.url); });
    _evFiles = [];
    var now = new Date();
    var body = (await D.caseField(opts.caseId || '')) +
      D.row([
        D.fld({ id: 'ev2-type', label: 'قسم', type: 'sel', w: 'w-m', opts: [['Photo', 'تصویر'], ['Video', 'ویڈیو'], ['Audio', 'آواز'], ['Document', 'دستاویز']] }),
        D.fld({ id: 'ev2-date', label: 'تاریخ', type: 'date', value: now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) }),
        D.fld({ id: 'ev2-time', label: 'وقت', type: 'time', value: pad(now.getHours()) + ':' + pad(now.getMinutes()) }),
        D.fld({ id: 'ev2-loc', label: 'مقام (Lat, Long)', ltr: true, w: 'w-l', grow: true, ph: '30.195720, 71.475280',
          html: '<div class="dio-wb"><input class="dio-c ltr" id="ev2-loc" type="text" dir="ltr" inputmode="decimal" placeholder="30.195720, 71.475280">' +
            '<button type="button" class="dio-ib" title="موجودہ مقام" aria-label="موجودہ مقام" onclick="DIOCard.getLocation(\'ev2-loc\')">' + D.ICON.pin + '</button></div>' })
      ]) +
      '<div class="dio-hint">تاریخ اور وقت خود آ گئے ہیں — بدلے جا سکتے ہیں۔ مقام کے لیے نشان دبائیں (اجازت درکار)۔</div>' +
      '<div class="dio-up-row"><div class="dio-up"><div class="dio-row" style="padding-top:4px;gap:8px;">' +
      '<label class="dio-cam" tabindex="0">' + D.ICON.cam + 'کیمرہ — پیچھے<input type="file" hidden accept="image/*" capture="environment" onchange="DIOEntry._evAdd(this)"></label>' +
      '<label class="dio-cam" tabindex="0">' + D.ICON.cam + 'کیمرہ — سامنے<input type="file" hidden accept="image/*" capture="user" onchange="DIOEntry._evAdd(this)"></label>' +
      '<label class="dio-cam" tabindex="0">' + D.ICON.up + 'فائل منسلک کریں<input type="file" hidden multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx" onchange="DIOEntry._evAdd(this)"></label>' +
      '</div><div class="dio-thumbs" id="ev-thumbs"></div>' +
      '<div class="dio-hint">تصویر پر دبائیں: دیکھیں، زوم، شیئر، ڈاؤن لوڈ، پرنٹ، کاپی۔ شہادت کی تصویر اصل حالت میں محفوظ ہوتی ہے۔</div></div></div>' +
      D.row([D.fld({ id: 'ev2-notes', label: 'تفصیل', type: 'area', line: true, ph: 'مختصر تفصیل…' })]);
    D.open('شہادت', false, body, 'DIOEntry._saveEvidence()');
    _evThumbs();
  }
  var TYPE_UR = { Photo: 'تصویر', Video: 'ویڈیو', Audio: 'آواز', Document: 'دستاویز' };
  async function _saveEvidence() {
    if (window.DIO && DIO.sub && typeof DIO.sub.guard === 'function' && !DIO.sub.guard('شہادت شامل')) return;
    var D = window.DIOCard;
    var cs = D.readCase();
    if (!cs || !cs.fir) { toast('مقدمہ منتخب کریں', 'error'); return; }
    var type = (document.getElementById('ev2-type') || {}).value || 'Photo';
    var date = ((document.getElementById('ev2-date') || {}).value || '').trim();
    var time = ((document.getElementById('ev2-time') || {}).value || '').trim();
    var loc = ((document.getElementById('ev2-loc') || {}).value || '').trim();
    var notes = ((document.getElementById('ev2-notes') || {}).value || '').trim();
    if (date && !D.dmyToIso(date)) { toast('تاریخ درست لکھیں (DD/MM/YYYY)', 'error'); return; }
    if (loc && !/^-?\d{1,2}(\.\d+)?\s*,\s*-?\d{1,3}(\.\d+)?$/.test(loc)) { toast('مقام اس طرح لکھیں: 30.195720, 71.475280', 'error'); return; }
    var extra = [time ? 'وقت: ' + time : '', loc ? 'مقام: ' + loc : ''].filter(Boolean).join(' · ');
    var fullNotes = [notes, extra].filter(Boolean).join('\n');
    var baseName = (TYPE_UR[type] || type) + ' — ' + (date || '') + (time ? ' ' + time : '');
    var items = _evFiles.length ? _evFiles : [null];
    try {
      var saved = 0, pending = 0;
      for (var i = 0; i < items.length; i++) {
        var name = baseName + (items.length > 1 ? ' (' + (i + 1) + ')' : '');
        var meta = { name: name, fir_number: cs.fir, type: type, evidence_date: date, notes: fullNotes, is_readonly: true };
        var row = (typeof addEvidenceWithFile === 'function')
          ? await addEvidenceWithFile(meta, items[i] ? { file: items[i].file } : null)
          : await addEvidence(meta);
        saved++;
        if (row && row._pendingUpload) pending++;
        try { if (window.DIO && DIO.audit) DIO.audit.log('evidence.uploaded', 'evidence', (row && row.id) || null, { after: { name: name, fir_number: cs.fir, type: type, evidence_date: date }, metadata: { has_notes: !!notes, has_location: !!loc } }); } catch (_) { /* audit/custody ka masla asal kaam na roke */ }
        try { if (window.DIO && DIO.custody) DIO.custody.record('created', (row && row.id) || null, { fir_number: cs.fir, evidence_name: name, details: { type: type } }); } catch (_) { /* audit/custody ka masla asal kaam na roke */ }
      }
      _evFiles.forEach(function (f) { URL.revokeObjectURL(f.url); });
      _evFiles = [];
      closeModal();
      toast(pending ? 'آف لائن محفوظ — انٹرنیٹ آنے پر شہادت اپلوڈ ہو گی' : ('شہادت محفوظ (' + saved + ') — مقدمہ ' + cs.fir), pending ? 'info' : 'success', 4000);
      if (window._activePage === 'evidence' && typeof renderEvidence === 'function') renderEvidence(document.getElementById('page-content'));
    } catch (err) { toast('' + (err && err.message || err), 'error'); }
  }

  window.DIOEntry = {
    hub: hub, go: go, peshi: peshi, evidence: evidence,
    _switch: _switch, _savePeshi: _savePeshi, _saveEvidence: _saveEvidence,
    _evAdd: _evAdd, _evRemove: _evRemove, _evView: _evView
  };
})();
