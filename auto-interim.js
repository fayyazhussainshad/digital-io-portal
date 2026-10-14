/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — خودکار انٹیرم چالان (10 دن)  — auto-interim.js
   افسر کی ہدایت (اکتوبر 2026):
     «جو بھی نیا مقدمہ درج ہو — ملزمان معلوم ہوں یا نامعلوم — سسٹم 10 دن
      بعد اس کی انٹیرم رپورٹ بنا کر محفوظ چالانوں کے ساتھ «انٹیرم چالان»
      کے نام سے شامل کر دے اور یاددہانی بھی دے۔»

   قانونی پس منظر: دفعہ 173 ض ف — تفتیش 14 دن کی قانونی مدت میں مکمل
   نہ ہو تو عبوری (انٹیرم) رپورٹ؛ 10ویں دن تیاری اس مدت کے اندر ہے۔

   کیسے:
     • صرف وہ مقدمات جو اس سہولت کے آغاز (NEW_FROM) کے بعد سسٹم میں درج ہوئے،
       حالت «زیر تفتیش»، اور اندراج (تاریخ ایف آئی آر، ورنہ اندراج کی تاریخ)
       کو 10 دن پورے۔
     • اس مقدمے میں پہلے سے کوئی انٹیرم چالان ہو (افسر نے خود بنایا یا پہلے
       خودکار بنا) تو کچھ نہیں — دوہرا نہیں بنتا۔
     • report_173 میں «انٹیرم چالان» کی قطار (report_type = interim) —
       یہ مقدمے کے محفوظ چالانوں کی فہرست میں آتی ہے؛ کھولنے پر فارم
       مقدمے کے تازہ ڈیٹا (ملزمان، گواہان، ایف آئی آر) سے بھرا کھلتا ہے۔
     • ساتھ یاددہانی (آج کی تاریخ) اور «محفوظ فائلیں» میں اندراج۔
     • مقدمے کی حالت نہیں بدلی جاتی (زیر تفتیش ہی رہتا ہے)۔
     • آف لائن ہو تو کچھ نہیں — اگلی بار انٹرنیٹ پر خود ہو جائے گا۔
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.DIO = window.DIO || {};

  var DAYS = 10;
  var NEW_FROM = '2026-10-14T00:00:00+05:00';      // اس سہولت کا آغاز — اس کے بعد درج مقدمات
  var DONE_KEY = 'dio_auto_interim_done_v1';
  var HEAD = 'انٹیرم چالان (خودکار — 10 دن)';
  var _running = false;

  function done() { try { return JSON.parse(localStorage.getItem(DONE_KEY) || '{}') || {}; } catch (_) { return {}; } }
  function markDone(id) { try { var d = done(); d[id] = new Date().toISOString(); localStorage.setItem(DONE_KEY, JSON.stringify(d)); } catch (_) { /* storage بند */ } }

  // تاریخ (YYYY-MM-DD یا DD/MM/YYYY) → Date (مقامی آدھی رات)
  function parseDay(v) {
    if (!v) return null;
    var s = String(v), m;
    if ((m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s))) return new Date(+m[1], +m[2] - 1, +m[3]);
    if ((m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/.exec(s))) return new Date(+m[3], +m[2] - 1, +m[1]);
    var d = new Date(s);
    return isNaN(d) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function today() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  function eligible(c, now) {
    if (!c || !c.id || String(c.id).indexOf('local-') === 0) return false;
    if (c.status && c.status !== 'under') return false;                 // صرف زیر تفتیش
    if (!c.created_at || new Date(c.created_at) < new Date(NEW_FROM)) return false;   // صرف نئے مقدمات
    var base = parseDay(c.fir_date) || parseDay(c.created_at);
    if (!base) return false;
    return Math.floor((now - base) / 86400000) >= DAYS;
  }

  async function run(opts) {
    opts = opts || {};
    if (_running || !navigator.onLine || typeof supabaseClient === 'undefined') return { made: 0 };
    if (window.DIO && DIO.sub && typeof DIO.sub.blocked === 'function' && DIO.sub.blocked()) return { made: 0 };   // میعاد ختم = صرف دیکھنا
    _running = true;
    var made = [], now = today(), dn = done();
    try {
      var cases = (typeof getCases === 'function') ? (await getCases().catch(function () { return []; })) : [];
      var due = cases.filter(function (c) { return !dn[c.id] && eligible(c, now); });
      if (!due.length) return { made: 0 };
      var oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
      if (!oid) return { made: 0 };
      for (var i = 0; i < due.length; i++) {
        var c = due[i];
        try {
          // پہلے سے کوئی انٹیرم؟ (افسر کا بنایا یا پہلے خودکار) — دوہرا نہیں
          var ex = await supabaseClient.from('report_173').select('id').eq('case_id', c.id).eq('report_type', 'interim');
          if (ex.error) throw ex.error;
          if (ex.data && ex.data.length) { markDone(c.id); continue; }
          var form = { head: HEAD, saved_at: new Date().toISOString(), auto_interim: true, auto_interim_on: iso(now) };
          var ins = await supabaseClient.from('report_173').insert({ case_id: c.id, officer_id: oid, report_type: 'interim',
            report_subtype: 'fir', form_data: form }).select('id').single();
          if (ins.error) throw ins.error;
          if (!ins.data || !ins.data.id) throw new Error('ڈیٹا بیس نے شناخت واپس نہیں کی');
          markDone(c.id);
          made.push(c);
          // محفوظ چالانوں کی مقامی فہرست بھی تازہ (آف لائن کھلنے پر بھی نظر آئے)
          try {
            var lk = 'dio_r173docs_' + c.id, L = JSON.parse(localStorage.getItem(lk) || '[]');
            L.push({ id: ins.data.id, type: 'interim', subtype: 'fir', head: HEAD, form_data: form, date: iso(now), saved: form.saved_at });
            localStorage.setItem(lk, JSON.stringify(L));
          } catch (_) { /* ضمنی */ }
          try { if (typeof dioRegisterSaved === 'function') dioRegisterSaved('report_173', 'انٹیرم چالان (FIR) — خودکار', { case_id: c.id, report_type: 'interim', report_subtype: 'fir', doc_id: ins.data.id }); } catch (_) { /* ضمنی */ }
          // یاددہانی: مقدمہ درج کرتے وقت بنی «انٹیرم چالان» یاددہانی ہو تو اسی کو «تیار» میں
          // بدلو (ایک ہی یاددہانی)؛ نہ ہو تو نئی (آج کی تاریخ)
          try {
            var who = c.complainant ? ' (' + String(c.complainant).split(/\s+ولد\s+|\s+ولدیت\s+/)[0].slice(0, 40) + ')' : '';
            var txt = 'انٹیرم چالان تیار (خودکار، 10 دن مکمل) — مقدمہ FIR ' + (c.fir_number || '') + who +
              ' · «محفوظ شدہ چالان» میں کھول کر جائزہ لیں، مکمل کریں اور پیش کریں (دفعہ 173 ض ف: 14 دن)';
            var old = await supabaseClient.from('reminders').select('id,text,is_done').eq('officer_id', oid);
            var mine = ((old && old.data) || []).filter(function (x) {
              return !x.is_done && /انٹیرم چالان/.test(x.text || '') && c.fir_number && (x.text || '').indexOf('FIR ' + c.fir_number + ' ') >= 0;
            })[0];
            var r = mine
              ? await supabaseClient.from('reminders').update({ text: txt, reminder_date: iso(now) }).eq('id', mine.id).select('id')
              : await supabaseClient.from('reminders').insert({ officer_id: oid, is_done: false, reminder_date: iso(now), text: txt }).select('id');
            if (r && r.error) throw r.error;
          } catch (e) { try { console.warn('auto interim reminder:', e && e.message); } catch (_) { /* ضمنی */ } }
        } catch (e) {
          try { if (window.DIO && DIO.errors && DIO.errors.log) DIO.errors.log('auto_interim', e); } catch (_) { /* ضمنی */ }
        }
      }
      if (made.length && !opts.silent && typeof showToast === 'function') {
        showToast(made.length === 1
          ? 'مقدمہ FIR ' + (made[0].fir_number || '') + ' کا انٹیرم چالان خودکار تیار — «محفوظ شدہ چالان» اور یاددہانیوں میں دیکھیں'
          : made.length + ' مقدمات کے انٹیرم چالان خودکار تیار — یاددہانیوں میں تفصیل', 'info', 7000);
      }
      if (made.length) { try { if (typeof updateNotifBadge === 'function') updateNotifBadge(); } catch (_) { /* ضمنی */ } }
      return { made: made.length, cases: made.map(function (c) { return c.id; }) };
    } finally { _running = false; }
  }

  window.DIO.autoInterim = { run: run, eligible: eligible, DAYS: DAYS, NEW_FROM: NEW_FROM, HEAD: HEAD };

  // لاگ اِن کے بعد، اور ہر 6 گھنٹے (ایپ کھلی رہے تو) — انٹرنیٹ واپس آنے پر بھی
  function later() { setTimeout(function () { try { if (typeof currentOfficer !== 'undefined' && currentOfficer) run(); } catch (_) { /* ضمنی */ } }, 8000); }
  if (document.readyState === 'complete') later(); else window.addEventListener('load', later);
  setInterval(function () { try { if (typeof currentOfficer !== 'undefined' && currentOfficer) run({ silent: false }); } catch (_) { /* ضمنی */ } }, 6 * 3600 * 1000);
  window.addEventListener('online', function () { setTimeout(function () { try { if (typeof currentOfficer !== 'undefined' && currentOfficer) run(); } catch (_) { /* ضمنی */ } }, 5000); });
})();
