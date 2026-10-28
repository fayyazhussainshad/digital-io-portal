/* ════════════════════════════════════════════════════════════════════════
   Digital IO — ڈیٹا کی گنتی اور مکمل بیک اپ   (dio-inventory v1 — 28/10/2026)
   ────────────────────────────────────────────────────────────────────────
   صرف پڑھتا ہے — کچھ بھی تبدیل، حذف یا سرور پر نہیں بھیجتا۔
   1) اس آلے پر محفوظ ہر قسم کے ڈیٹا کی گنتی (ضمنیاں، بیانات، چالان، …)
   2) کون سی چیزیں ابھی سرور پر نہیں گئیں — اور سرور نے کیوں رد کیا (اگر کیا)
   3) کیا یہ آلہ سرور سے جڑا ہوا ہے (session) یا صرف آف لائن لاگ اِن ہے
   4) اس آلے کا پورا ڈیٹا ایک JSON فائل میں ڈاؤن لوڈ (بیک اپ) —
      لاگ اِن/PIN/فنگر پرنٹ کی خفیہ چابیاں بیک اپ میں شامل نہیں کی جاتیں۔
   چلانا: Digital IO کھول کر لاگ اِن کریں → F12 → Console → یہ پوری فائل
   paste کر کے Enter۔ (Chrome پہلی بار paste روکے تو وہاں allow pasting لکھیں۔)
   ════════════════════════════════════════════════════════════════════════ */
(async function dioInventory() {
  'use strict';
  var VER = 'dio-inventory v1 (28/10/2026)';
  var LS = window.localStorage;

  // ── خفیہ چابیاں: بیک اپ میں نہیں جاتیں (صرف گنتی میں «لاگ اِن / حفاظت») ──
  var SECRET = /(auth-token|^dio_pin|^digital_io_pin_hash$|^dio_biometric|^dio_bio_rt$|^dio_pin_rt$|^dio_pw_verifier$|^dio_login_lock$|^dio_license|^dio_gdrive_token$)/;

  function J(k) { try { return JSON.parse(LS.getItem(k)); } catch (_) { return undefined; } }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function idPend(x) { return !!(x && /^(local-|tmp_)/.test(String(x.id == null ? '' : x.id))); }
  function isUuid(s) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s)); }

  // ── ہر قسم کی قطار ──
  var rows = {};          // label → { label, where, items, pending, cases:Set, reasons:{}, note, sync }
  var caseIds = {};       // case id → [labels]
  var unknownKeys = [];
  function row(label, where, sync, note) {
    if (!rows[label]) rows[label] = { label: label, where: where, sync: sync, items: 0, pending: 0, cases: {}, reasons: {}, note: note || '' };
    return rows[label];
  }
  function addCase(r, cid) {
    if (!cid) return;
    r.cases[cid] = 1;
    (caseIds[cid] = caseIds[cid] || []);
    if (caseIds[cid].indexOf(r.label) < 0) caseIds[cid].push(r.label);
  }
  function reason(r, why) { if (!why) return; why = String(why).slice(0, 160); r.reasons[why] = (r.reasons[why] || 0) + 1; }

  // پرچی: per-case list (array) + pending قاعدہ
  function caseList(label, cid, list, pendFn, errFn) {
    var r = row(label, 'localStorage', 'سرور + مقامی نقل');
    addCase(r, cid);
    list.forEach(function (x) {
      r.items++;
      if (pendFn(x)) { r.pending++; reason(r, errFn ? errFn(x) : ''); }
    });
  }

  var SAZA = {};          // سزا سلپ: case id → local copy (سرور سے جانچ بعد میں)
  var NAQ_PEND = {};
  var keys = [];
  for (var i = 0; i < LS.length; i++) keys.push(LS.key(i));
  keys.forEach(function (k) { var m = /^dio_naqsha_(.+)::pending$/.exec(k); if (m && LS.getItem(k) === '1') NAQ_PEND[m[1]] = 1; });

  var SETTINGS = /^(digital_io_sho|digital_io_dsp|digital_io_sho_sign|digital_io_sarkari_gari|dio_ch173_papers.*|dio_ch173_paper|dio_ch173_medical_officer|dio_akhraj_.*|dio_wit_status_custom|dio_acc_opts_.*|dio_zimni_types_.*|suggest_.*|dio_saza_paper|dio_dk_paper)$/;
  var DEVICE = /^(dio_theme|dio_font_size|dio_challan_view|dio_doc_view|dio_officer_cache|dio_profile_photo|officer_photo_url|officer_profile|dio_onboarded|dio_seen_welcome_v1|dio_recent_cases|digital_io_search_history|dio_btn_usage|dio_hw_clock|dio_grace_start|dio_sub_cache|dio_last_sync|dio_last_backup.*|dio_err_log|dio_zikr_deck_v2|cache_law_library|cache_ahkamat|dio_auto_interim_done_v1|dio_last_loc.*|case_status_.*|case_data_.*|dio_print_preview|dio_notifs_cache|dio_zimni_col|dio_zimni_a_col|digital_io_locked|dio_resume.*|dio_last_page.*)$/;
  var DOC_NAMES = { darkhwastain: 'درخواستیں', saza_slip: 'سزا سلپ', rfa_form: 'RFA', cdr_imei: 'CDR / IMEI', naqsha: 'نقشہ موقع' };

  keys.forEach(function (k) {
    var m, v;
    if (SECRET.test(k)) { row('لاگ اِن / حفاظت (بیک اپ میں شامل نہیں)', 'localStorage', 'صرف یہی آلہ').items++; return; }
    if (/::pending$/.test(k)) return;
    if ((m = /^dio_zimni_draft_(.+)$/.exec(k))) {
      v = J(k) || {}; var r1 = row('ضمنی (بیرونی) — خودکار مسودے', 'localStorage', 'صرف یہی آلہ'); r1.items += Object.keys(v).length; addCase(r1, m[1]); return;
    }
    if ((m = /^dio_za_draft_(.+)$/.exec(k))) {
      v = J(k) || {}; var r2 = row('بیان 161 ض ف / اندرونی ضمنی — خودکار مسودے', 'localStorage', 'صرف یہی آلہ'); r2.items += Object.keys(v).length; addCase(r2, m[1]); return;
    }
    if (SETTINGS.test(k)) { row('ترتیبات (SHO/DSP، تفصیل کاغذات، کاغذ، اپنی اقسام، دستخط…)', 'localStorage + dio_user_data', 'ہاں (v562)').items++; return; }
    if (DEVICE.test(k)) { row('آلے کی اپنی (تھیم، حالیہ، cache…)', 'localStorage', 'صرف یہی آلہ', 'sync کی ضرورت نہیں').items++; return; }
    if ((m = /^dio_zimni_(.+)$/.exec(k))) {
      caseList('ضمنی (بیرونی)', m[1], arr(J(k)), function (x) { return !!(x && (x._pending || idPend(x))); }, function (x) { return x._sync_err || ''; }); return;
    }
    if ((m = /^dio_za_(.+)$/.exec(k))) {
      caseList('بیان 161 ض ف / اندرونی ضمنی', m[1], arr(J(k)), function (x) { return !!(x && (x._pending || idPend(x))); }, function (x) { return x._sync_err || ''; }); return;
    }
    if ((m = /^dio_r173docs_(.+)$/.exec(k))) {
      caseList('چالان / رپورٹ 173 (مکمل، نامکمل، انٹیرم، تتمہ، اخراج، عدم پتہ)', m[1], arr(J(k)), idPend); return;
    }
    if ((m = /^dio_r173_(.+)$/.exec(k))) { var r3 = row('چالان — فارم کی مقامی نقل (cache)', 'localStorage', 'سرور کی نقل'); r3.items += Object.keys(J(k) || {}).length; addCase(r3, m[1]); return; }
    if ((m = /^dio_saza_(.+)$/.exec(k))) { var r4 = row('سزا سلپ', 'localStorage', 'سرور + مقامی نقل'); r4.items++; addCase(r4, m[1]); SAZA[m[1]] = 1; return; }
    if ((m = /^dio_naqsha_(.+)$/.exec(k))) {
      v = J(k) || {}; var r5 = row('نقشہ موقع', 'localStorage', 'سرور + مقامی نقل'); var n = arr(v.sketches).length;
      r5.items += n; addCase(r5, m[1]); if (NAQ_PEND[m[1]]) { r5.pending += n || 1; reason(r5, 'سرور پر جانا باقی'); } return;
    }
    if ((m = /^dio_sd_(.+)_([^_]*)$/.exec(k))) {   // dio_sd_<docType>_<caseId> — docType میں _ ہو سکتا ہے، caseId میں نہیں
      caseList('محفوظ دستاویزات — ' + (DOC_NAMES[m[1]] || m[1]), m[2], arr(J(k)), function (x) { return !!(x && (x._pendingSync || idPend(x))); }); return;
    }
    if ((m = /^dio_dk_(.+)$/.exec(k))) { var r6 = row('درخواستیں (پرانی مقامی نقل)', 'localStorage', 'صرف یہی آلہ'); r6.items++; addCase(r6, m[1]); return; }
    if ((m = /^dio_rfalist_(.+)$/.exec(k))) { caseList('RFA فارم', m[1], arr(J(k)), idPend); return; }
    if ((m = /^dio_cdrlist_(.+)$/.exec(k))) { caseList('CDR / IMEI فارم', m[1], arr(J(k)), function (x) { return !!(x && (x._pending || idPend(x))); }); return; }
    if ((m = /^dio_cdr_(.+)$/.exec(k))) { var r7 = row('CDR (پرانی مقامی نقل)', 'localStorage', 'صرف یہی آلہ'); r7.items++; addCase(r7, m[1]); return; }
    if ((m = /^dio_cro_(.+)$/.exec(k))) { v = J(k); caseList('CRO کارڈ', m[1], v ? [v] : [], idPend); return; }
    if ((m = /^dio_firmatn_(.+)$/.exec(k))) { caseList('متن ایف آئی آر', m[1], arr(J(k)), idPend); return; }
    if ((m = /^dio_fircopies_(.+)$/.exec(k))) { caseList('فوٹو کاپی ایف آئی آر', m[1], arr(J(k)), idPend); return; }
    if ((m = /^dio_accused_(.+)$/.exec(k))) { caseList('ملزمان (سرور کی نقل)', m[1], arr(J(k)), idPend); return; }
    if ((m = /^dio_staff_(.+)$/.exec(k))) { caseList('ہمراہی ملازمان (سرور کی نقل)', m[1], arr(J(k)), idPend); return; }
    if ((m = /^dio_cctx_(acc|wit)_(.+)$/.exec(k))) { var r8 = row('مقدمے کا سیاق (ملزم/گواہ cache)', 'localStorage', 'سرور کی نقل'); r8.items += arr(J(k)).length; addCase(r8, m[2]); return; }
    if (/^dio_irlist_/.test(k)) { caseList('واقعاتی رپورٹ', '', arr(J(k)), function (x) { return !!(x && (x._pending || idPend(x))); }); return; }
    if (/^dio_ir_draft_/.test(k)) { row('واقعاتی رپورٹ — خودکار مسودہ', 'localStorage', 'صرف یہی آلہ').items++; return; }
    if (/^dio_gllist_|^dio_gl_draft_/.test(k)) { var r9 = row('گشت (ختم کیا جانا ہے)', 'localStorage', '—'); r9.items += Math.max(1, arr(J(k)).length); return; }
    if (k === 'cache_templates') { row('ٹیمپلیٹس (سرور کی نقل)', 'localStorage', 'سرور کی نقل').items += arr(J(k)).length; return; }
    if (k === 'dio_form_edits_v1') { row('سسٹم فارم — ترامیم', 'localStorage', 'سرور + مقامی نقل').items += Object.keys(J(k) || {}).length; return; }
    if (k === 'dio_forms_auto_v1') { row('فارم — خودکار فہرست', 'localStorage', 'صرف یہی آلہ').items += arr(J(k)).length; return; }
    if (/^cache_reminders_/.test(k)) { row('یاددہانیاں (سرور کی نقل)', 'localStorage', 'سرور کی نقل').items += arr(J(k)).length; return; }
    if (k === 'dio_saved_files') { row('محفوظ فائلیں (فہرست)', 'localStorage', 'صرف یہی آلہ').items += arr(J(k)).length; return; }
    unknownKeys.push(k);
  });
  if (unknownKeys.length) { var ru = row('دیگر (نامعلوم چابیاں)', 'localStorage', '؟', unknownKeys.slice(0, 30).join('، ')); ru.items = unknownKeys.length; }

  // ── IndexedDB (digital-io-v2) — صرف اگر پہلے سے موجود ہو (نیا ڈیٹابیس نہیں بنتا) ──
  var idb = {}, idbNote = '';
  async function idbDump() {
    try {
      if (!indexedDB.databases) { idbNote = 'یہ براؤزر IndexedDB فہرست نہیں دیتا'; return; }
      var list = await indexedDB.databases();
      if (!list.some(function (d) { return d.name === 'digital-io-v2'; })) { idbNote = 'digital-io-v2 موجود نہیں'; return; }
      var db = await new Promise(function (res, rej) { var q = indexedDB.open('digital-io-v2'); q.onsuccess = function () { res(q.result); }; q.onerror = function () { rej(q.error); }; });
      var names = [].slice.call(db.objectStoreNames);
      for (var s = 0; s < names.length; s++) {
        var st = names[s];
        idb[st] = await new Promise(function (res) {
          try { var g = db.transaction(st, 'readonly').objectStore(st).getAll(); g.onsuccess = function () { res(g.result || []); }; g.onerror = function () { res([]); }; }
          catch (_) { res([]); }
        });
      }
      db.close();
    } catch (e) { idbNote = 'IndexedDB نہیں پڑھا جا سکا: ' + (e && e.message); }
  }
  await idbDump();
  var Q = idb.sync_queue || [];
  var TABLE_UR = { cases: 'مقدمات', zimni_reports: 'ضمنی (بیرونی)', zimni_androoni_reports: 'بیان 161 / اندرونی ضمنی', report_173: 'چالان / رپورٹ 173',
    evidence: 'شہادت', fivec: '5-C درخواستیں', reminders: 'یاددہانیاں', case_documents: 'مثل کی دستاویزات', sarkari_gari: 'سرکاری گاڑی' };
  Q.forEach(function (q) {
    if (q.status === 'synced') return;
    var r = row('آف لائن قطار — ' + (TABLE_UR[q.table] || q.table), 'IndexedDB (sync_queue)', 'قطار');
    r.items++;
    r.pending++;
    reason(r, (q.status === 'failed' ? 'مستقل ناکام: ' : 'باقی: ') + (q.last_error || q.op));
    if (q.data && q.data.case_id) addCase(r, q.data.case_id);
  });
  (idb.cases_cache || []).forEach(function (c) {
    var r = row('مقدمات (cache)', 'IndexedDB (cases_cache)', 'سرور کی نقل'); r.items++;
    if (idPend(c) || c._pending) { r.pending++; reason(r, 'آف لائن بنا مقدمہ (عارضی local شناخت)'); }
  });
  (idb.evidence_cache || []).forEach(function (e) {
    var r = row('شہادت (cache)', 'IndexedDB (evidence_cache)', 'سرور کی نقل'); r.items++;
    if (e._pendingUpload || idPend(e)) { r.pending++; reason(r, 'فائل سرور پر جانا باقی'); }
  });
  if ((idb.pending_files || []).length) { var rf = row('شہادت/تصاویر — فائلیں جو ابھی اپ لوڈ نہیں ہوئیں', 'IndexedDB (pending_files)', 'قطار'); rf.items = rf.pending = idb.pending_files.length; }
  if ((idb.fivec_cache || []).length) row('5-C درخواستیں (cache)', 'IndexedDB (fivec_cache)', 'سرور کی نقل').items = idb.fivec_cache.length;
  if ((idb.reminders_cache || []).length) row('یاددہانیاں (IndexedDB cache)', 'IndexedDB (reminders_cache)', 'سرور کی نقل').items = idb.reminders_cache.length;

  // ── سرور: کیا یہ آلہ واقعی سرور سے جڑا ہے؟ (صرف پڑھنا) ──
  var server = { session: false, officer_id: null, checked: false, missingCases: [], localCaseIds: [], sazaNotOnServer: 0, error: '' };
  var sb = null;
  try { sb = (typeof supabaseClient !== 'undefined') ? supabaseClient : null; } catch (_) { sb = null; }
  try { server.officer_id = (typeof currentOfficer !== 'undefined' && currentOfficer && currentOfficer.id) || null; } catch (_) { /* لاگ اِن نہیں */ }
  if (sb && navigator.onLine) {
    try {
      var s0 = await sb.auth.getSession();
      server.session = !!(s0 && s0.data && s0.data.session);
    } catch (e) { server.error = 'session: ' + (e && e.message); }
    if (server.session) {
      try {
        var ids = Object.keys(caseIds);
        server.localCaseIds = ids.filter(function (x) { return /^local-/.test(x); });
        var uu = ids.filter(isUuid), found = {};
        for (var c = 0; c < uu.length; c += 50) {
          var part = uu.slice(c, c + 50);
          var res = await sb.from('cases').select('id').in('id', part);
          if (res.error) throw res.error;
          (res.data || []).forEach(function (x) { found[x.id] = 1; });
        }
        server.missingCases = uu.filter(function (x) { return !found[x]; }).map(function (x) { return { case_id: x, data: caseIds[x] }; });
        var sz = Object.keys(SAZA).filter(isUuid);
        if (sz.length) {
          var have = {};
          for (var d = 0; d < sz.length; d += 50) {
            var r2 = await sb.from('case_documents').select('case_id').eq('document_type', 'saza_slip').in('case_id', sz.slice(d, d + 50));
            if (r2.error) throw r2.error;
            (r2.data || []).forEach(function (x) { have[x.case_id] = 1; });
          }
          server.sazaNotOnServer = sz.filter(function (x) { return !have[x]; }).length;
          if (rows['سزا سلپ']) { rows['سزا سلپ'].pending += server.sazaNotOnServer; if (server.sazaNotOnServer) reason(rows['سزا سلپ'], 'سرور پر اس مقدمے کی سزا سلپ نہیں ملی'); }
        }
        server.checked = true;
      } catch (e) { server.error = 'سرور سے جانچ نہیں ہو سکی: ' + ((e && (e.message || e.code)) || e); }
    }
  }

  // ── خلاصہ ──
  var out = Object.keys(rows).map(function (k) {
    var r = rows[k];
    return { 'قسم': r.label, 'کہاں': r.where, 'کل': r.items, 'سرور پر نہیں گئے': r.pending, 'مقدمات': Object.keys(r.cases).length,
      'وجوہات': Object.keys(r.reasons).map(function (w) { return w + ' (' + r.reasons[w] + ')'; }).join(' · '), 'نوٹ': r.note };
  }).sort(function (a, b) { return (b['سرور پر نہیں گئے'] - a['سرور پر نہیں گئے']) || (b['کل'] - a['کل']); });
  var totalPending = out.reduce(function (s, r) { return s + r['سرور پر نہیں گئے']; }, 0);

  // ── بیک اپ (خفیہ چابیاں اور لاگ اِن کا ذخیرہ شامل نہیں) ──
  var lsCopy = {};
  keys.forEach(function (k) { if (!SECRET.test(k)) lsCopy[k] = LS.getItem(k); });
  var idbCopy = {};
  Object.keys(idb).forEach(function (st) { if (!/^(session_cache|offline_creds|offline_profiles)$/.test(st)) idbCopy[st] = idb[st]; });
  var now = new Date();
  var p2 = function (n) { return String(n).padStart(2, '0'); };
  var stamp = p2(now.getDate()) + '-' + p2(now.getMonth() + 1) + '-' + now.getFullYear() + '_' + p2(now.getHours()) + '-' + p2(now.getMinutes());
  var backup = { app: 'Digital IO', tool: VER, made_at: now.toISOString(), origin: location.origin, user_agent: navigator.userAgent,
    officer_id: server.officer_id, server: server, summary: out, localStorage: lsCopy, indexedDB: idbCopy };
  var fileName = 'DigitalIO-backup-' + stamp + '.json';
  var downloaded = false;
  try {
    var blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = fileName;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { try { URL.revokeObjectURL(a.href); } catch (_) { /* کچھ نہیں */ } }, 60000);
    downloaded = true;
  } catch (e) { console.warn('backup download nakaam', e); }

  // ── اسکرین پر خلاصہ (screenshot کے لیے) ──
  try {
    var old = document.getElementById('dio-inv-panel'); if (old) old.remove();
    var P = document.createElement('div');
    P.id = 'dio-inv-panel';
    P.setAttribute('dir', 'rtl');
    P.style.cssText = 'position:fixed;inset:12px;z-index:2147483647;background:#fff;color:#111;border:2px solid #1f4e79;border-radius:10px;overflow:auto;padding:14px;font:12pt "Jameel Noori Nastaleeq",serif;box-shadow:0 8px 30px rgba(0,0,0,.35)';
    var h = document.createElement('div');
    h.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px';
    var t = document.createElement('div'); t.style.cssText = 'font-size:16pt;font-weight:700';
    t.textContent = 'اس آلے کا ڈیٹا — گنتی';
    var x = document.createElement('button'); x.textContent = 'بند کریں'; x.style.cssText = 'font:inherit;padding:4px 14px;cursor:pointer';
    x.onclick = function () { P.remove(); };
    h.appendChild(t); h.appendChild(x); P.appendChild(h);
    // اردو RTL، انگریزی/ہندسے LTR — ہر انگریزی ٹکڑا <bdi> میں (سطر الٹی نہ ہو)
    function rich(el, txt) {
      String(txt == null ? '' : txt).split(/([A-Za-z0-9][A-Za-z0-9_:.\/\-]*(?:[ ][A-Za-z0-9][A-Za-z0-9_:.\/\-]*)*)/).forEach(function (part, i) {
        if (!part) return;
        if (i % 2) { var bd = document.createElement('bdi'); bd.setAttribute('dir', 'ltr'); bd.textContent = part; el.appendChild(bd); }
        else el.appendChild(document.createTextNode(part));
      });
    }
    function line(txt, bad) { var d = document.createElement('div'); d.style.cssText = 'margin:2px 0;' + (bad ? 'color:#b00020;font-weight:700' : ''); rich(d, txt); P.appendChild(d); }
    line('سرور سے رابطہ (session): ' + (server.session ? 'ہاں' : 'نہیں — یہ آلہ سرور پر کچھ نہیں بھیج سکتا'), !server.session);
    line('سرور پر نہیں گئی کل چیزیں: ' + totalPending, totalPending > 0);
    if (server.localCaseIds.length) line('آف لائن بنے مقدمات (عارضی local شناخت) جن سے ڈیٹا جڑا ہے: ' + server.localCaseIds.length, true);
    if (server.checked && server.missingCases.length) line('ایسے مقدمات کا ڈیٹا جو سرور پر موجود نہیں: ' + server.missingCases.length, true);
    if (server.error) line(server.error, true);
    if (idbNote) line(idbNote);
    line('بیک اپ فائل: ' + (downloaded ? fileName + ' (ڈاؤن لوڈ فولڈر میں)' : 'ڈاؤن لوڈ نہیں ہو سکی'), !downloaded);
    var tb = document.createElement('table');
    tb.style.cssText = 'border-collapse:collapse;width:100%;margin-top:8px;font-size:11pt';
    var cols = ['قسم', 'کہاں', 'کل', 'سرور پر نہیں گئے', 'مقدمات', 'وجوہات'];
    var tr = document.createElement('tr');
    cols.forEach(function (c) { var th = document.createElement('th'); rich(th, c); th.style.cssText = 'border:1px solid #888;padding:3px 6px;background:#e8eef5'; tr.appendChild(th); });
    tb.appendChild(tr);
    out.forEach(function (r) {
      var rr = document.createElement('tr');
      cols.forEach(function (c) {
        var td = document.createElement('td');
        td.style.cssText = 'border:1px solid #aaa;padding:3px 6px;vertical-align:top' + (c === 'سرور پر نہیں گئے' && r[c] > 0 ? ';color:#b00020;font-weight:700' : '');
        rich(td, r[c]);
        rr.appendChild(td);
      });
      tb.appendChild(rr);
    });
    P.appendChild(tb);
    document.body.appendChild(P);
  } catch (e) { console.warn('panel nakaam', e); }

  console.log('%c' + VER, 'font-weight:bold');
  console.log('سرور session:', server.session, '| officer:', server.officer_id, '| سرور پر نہیں گئے:', totalPending);
  console.table(out);
  if (server.missingCases.length) console.table(server.missingCases);
  window.__dioInventory = { version: VER, summary: out, server: server, totalPending: totalPending, fileName: fileName, downloaded: downloaded, unknownKeys: unknownKeys };
  return window.__dioInventory;
})();
