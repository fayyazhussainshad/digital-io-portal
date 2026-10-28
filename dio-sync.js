/* ═══════════════════════════════════════════════════════════════════════
   DIGITAL IO — dio-sync.js   (v560 — آلات کے درمیان sync، مرحلہ 1)
   ───────────────────────────────────────────────────────────────────────
   افسر کی شکایت (28 اکتوبر 2026): «لیپ ٹاپ پر لکھی ضمنیاں موبائل پر نہیں آتیں»۔
   اصل وجہ (اس کے اپنے ڈیٹا سے ثابت): لکھا ہوا متن «خودکار مسودہ» کی شکل میں
   صرف اسی آلے پر تھا، اور دوسرا آلہ کسی تبدیلی کی خبر خود نہیں لیتا تھا
   (Realtime میں کوئی جدول شامل ہی نہیں تھی)۔

   یہ فائل ایک جگہ سے:
    1) اوپر کی پٹی میں حالت: «محفوظ» / «سنک ہو رہا ہے» / «آف لائن»
       — «آف لائن» تب بھی جب انٹرنیٹ ہو مگر سرور کا session نہ ہو
       (اسی حالت میں آلہ سرور پر کچھ نہیں بھیج سکتا تھا اور پھر بھی «آن لائن» لکھا آتا تھا)
    2) Realtime: دوسرے آلے کی تبدیلی (ضمنی، بیان، چالان، مقدمہ، مسودہ) اسی لمحے
       اس آلے کے مقامی ذخیرے میں، اور کھلی فہرست بغیر refresh تازہ
    3) ایپ پر واپس آتے ہی / انٹرنیٹ آتے ہی: باقی کام سرور پر + کھلا صفحہ تازہ
    4) مسودے (لکھا جا رہا متن) سرور پر بھی — dio_user_data (sql/109)؛ صرف وہی
       جو اب لکھے/بدلے جائیں۔ پرانے مسودے ایک بار کی منتقلی سے (افسر کی اجازت پر)
    5) دو آلات پر ایک ہی دستاویز بدلی جائے: rev سے پہچان، دونوں نسخے سامنے، افسر چنے؛
       نہ چنا گیا نسخہ «حذف شدہ مواد» میں (کچھ ضائع نہیں)
    6) «حذف» = deleted_at کا نشان (اصل قطار محفوظ، «حذف شدہ مواد» سے واپس)
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var DS = window.DIOSync = window.DIOSync || {};
  var LS = window.localStorage;
  var VER = 'dio-sync v1 (v560)';
  DS.VER = VER;

  function now() { return new Date().toISOString(); }
  function jget(k, d) { try { var v = JSON.parse(LS.getItem(k)); return v == null ? d : v; } catch (_) { return d; } }
  function jput(k, v) { try { LS.setItem(k, JSON.stringify(v)); return true; } catch (e) { if (typeof dioLogError === 'function') dioLogError('dio-sync: local save nakaam ' + k, e); return false; } }
  function sb() { try { return (typeof supabaseClient !== 'undefined' && supabaseClient) ? supabaseClient : null; } catch (_) { return null; } }
  function loggedIn() { try { return !!(typeof currentUser !== 'undefined' && currentUser); } catch (_) { return false; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // اردو سطر میں انگریزی / ہندسے (ASI، 681/26، تاریخ) الگ رُخ میں — سطر الٹی نہ ہو
  function bidiHtml(t) {
    return String(t == null ? '' : t).split(/([A-Za-z0-9][A-Za-z0-9.\/:-]*(?: [A-Za-z0-9][A-Za-z0-9.\/:-]*)*)/)
      .map(function (part, i) { return i % 2 ? '<bdi>' + esc(part) + '</bdi>' : esc(part); }).join('');
  }
  function typing() {
    var a = document.activeElement;
    return !!(a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)));
  }

  // ── شناخت: ہر نئے ریکارڈ کی مستقل شناخت آلے پر ہی (آف لائن بھی) ─────────
  //   پہلے آف لائن ریکارڈ «local-…» شناخت پاتا اور سرور نئی شناخت دیتا — اس کے
  //   ساتھ جڑی ضمنیاں/چالان کبھی سرور پر نہ جا سکتے۔ اب ایک ہی شناخت ہمیشہ۔
  DS.uuid = function () {
    try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (_) { /* نیچے والا طریقہ */ }
    var b = new Uint8Array(16); crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    var h = Array.prototype.map.call(b, function (x) { return (x + 256).toString(16).slice(1); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  };
  DS.isUuid = function (s) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || '')); };

  // ── یہ آلہ: «لیپ ٹاپ» / «موبائل» (دو نسخوں میں فرق دکھانے کے لیے) ────────
  DS.device = function () {
    var id = '';
    try { id = LS.getItem('dio_device_id') || ''; if (!id) { id = DS.uuid().slice(0, 4); LS.setItem('dio_device_id', id); } } catch (_) { id = ''; }
    var ua = navigator.userAgent || '', coarse = false;
    try { coarse = window.matchMedia('(pointer: coarse)').matches; } catch (_) { coarse = false; }
    var kind = (/Android|iPhone|iPad|iPod|Mobile/i.test(ua) || coarse) ? 'موبائل' : 'لیپ ٹاپ';
    return id ? kind + ' · ' + id : kind;
  };

  // ── session: انٹرنیٹ ہونا کافی نہیں — سرور کا session بھی ہو ─────────────
  var _sess = { ok: null, at: 0 };
  DS.hasSession = async function (fresh) {
    var c = sb();
    if (!c || !navigator.onLine) { _sess = { ok: false, at: Date.now() }; return false; }
    if (!fresh && _sess.ok !== null && Date.now() - _sess.at < 15000) return _sess.ok;
    try {
      var r = await c.auth.getSession();
      _sess = { ok: !!(r && r.data && r.data.session), at: Date.now() };
    } catch (_) { _sess = { ok: false, at: Date.now() }; }
    return _sess.ok;
  };

  // ═══ 1) حالت کی پٹی ═══════════════════════════════════════════════════
  var _busy = 0, _lastErr = '';
  DS.busy = function (on) { _busy = Math.max(0, _busy + (on ? 1 : -1)); DS.render(); };

  function pendingFromLocal() {
    var out = { zimni: 0, za: 0, r173: 0, drafts: 0, conflicts: 0 };
    try {
      for (var i = 0; i < LS.length; i++) {
        var k = LS.key(i) || '', m, list;
        if ((m = /^dio_zimni_(.+)$/.exec(k)) && !/^(draft_|types_|col$|a_col$)/.test(m[1])) {
          list = jget(k, []);
          if (Array.isArray(list)) list.forEach(function (z) { if (z && z._conflict) out.conflicts++; else if (z && (z._pending || /^(local-|tmp_)/.test(String(z.id)))) out.zimni++; });
        } else if ((m = /^dio_za_(.+)$/.exec(k)) && !/^draft_/.test(m[1])) {
          list = jget(k, []);
          if (Array.isArray(list)) list.forEach(function (z) { if (z && z._conflict) out.conflicts++; else if (z && (z._pending || /^(local-|tmp_)/.test(String(z.id)))) out.za++; });
        } else if (/^dio_r173docs_/.test(k)) {
          list = jget(k, []);
          if (Array.isArray(list)) list.forEach(function (d) { if (d && d._conflict) out.conflicts++; else if (d && (d._pending || /^(local-|tmp_)/.test(String(d.id)))) out.r173++; });
        }
      }
    } catch (_) { /* storage نہ ہو تو صفر */ }
    out.drafts = Object.keys(jget('dio_ud_outbox', {}) || {}).length;
    return out;
  }
  DS.pending = function () { return pendingFromLocal(); };
  var _queueCount = 0;
  async function refreshQueueCount() {
    try { if (typeof offlineStore !== 'undefined' && offlineStore.pendingCount) _queueCount = (await offlineStore.pendingCount()) || 0; }
    catch (_) { _queueCount = 0; }
  }

  DS.state = function () {
    var p = pendingFromLocal();
    var n = p.zimni + p.za + p.r173 + p.drafts + _queueCount;
    var online = navigator.onLine !== false;
    var mode;
    if (!online) mode = 'offline';
    else if (loggedIn() && _sess.ok === false) mode = 'nosession';
    else if (subBlocked()) mode = 'viewonly';          // v561: میعاد ختم — کچھ سرور پر نہیں جاتا
    else if (_busy || n) mode = 'syncing';
    else mode = 'ok';
    return { mode: mode, pending: n, detail: p, queue: _queueCount, conflicts: p.conflicts, realtime: _rtStatus };
  };

  var LABEL = { ok: 'محفوظ', syncing: 'سنک ہو رہا ہے', offline: 'آف لائن', nosession: 'آف لائن', viewonly: 'صرف دیکھنا' };
  // v561: میعاد ختم = صرف دیکھنا — اس آلے سے سرور پر کچھ نہیں بھیجا جاتا (پڑھنا / تازہ ہونا جاری)
  function subBlocked() {
    try { return !!(window.DIO && DIO.sub && typeof DIO.sub.blocked === 'function' && DIO.sub.blocked()); } catch (_) { return false; }
  }
  DS.subBlocked = subBlocked;
  DS.render = function () {
    var t = document.getElementById('status-text'), d = document.getElementById('status-dot');
    if (!t) return;
    var s = DS.state();
    var txt = LABEL[s.mode];
    if (s.mode === 'syncing' && s.pending) txt += ' (' + s.pending + ')';
    if (t.textContent !== txt) t.textContent = txt;
    var wrap = t.parentNode;
    if (wrap) {
      wrap.setAttribute('data-sync', s.mode);
      wrap.setAttribute('role', 'button');
      wrap.setAttribute('tabindex', '0');
      wrap.title = s.mode === 'nosession'
        ? 'انٹرنیٹ ہے مگر سرور سے رابطہ (لاگ اِن) نہیں — کام اسی آلے پر محفوظ ہے۔ تفصیل کے لیے کلک کریں'
        : s.mode === 'offline' ? 'انٹرنیٹ نہیں — کام اسی آلے پر محفوظ ہے، انٹرنیٹ آتے ہی خود سرور پر جائے گا'
        : s.mode === 'viewonly' ? 'سبسکرپشن ختم — صرف دیکھ سکتے ہیں؛ اس آلے کا باقی کام تجدید کے بعد سرور پر جائے گا'
        : s.mode === 'syncing' ? 'کچھ کام ابھی سرور پر جا رہا ہے' : 'تمام کام سرور پر محفوظ';
      if (!wrap._dioSyncBound) {
        wrap._dioSyncBound = true;
        wrap.addEventListener('click', function () { DS.showDetails(); });
        wrap.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); DS.showDetails(); } });
      }
    }
    if (d) d.className = 'status-dot ' + (s.mode === 'ok' ? 'status-online' : (s.mode === 'syncing' || s.mode === 'viewonly') ? 'status-syncing' : 'status-offline');
  };
  (function css() {
    var st = document.createElement('style');
    st.id = 'dio-sync-css';
    st.textContent =
      '.dio-tb-status{cursor:pointer}' +
      '.dio-tb-status #status-text{font-size:9pt !important}' +
      // v561: موبائل پر بھی لفظ نظر آئیں (پہلے صرف رنگین نقطہ — «محفوظ / سنک ہو رہا ہے / آف لائن» افسر کو دکھنا چاہیے)
      '@media (max-width:768px){#main-app .dio-tb-status #status-text{display:inline !important;font-size:8pt !important;white-space:nowrap}' +
      '#main-app .dio-tb-status{padding:0 2px !important;gap:4px}}' +
      '.status-dot.status-syncing{background:#d97706 !important;animation:statusPulse 1s infinite}' +
      '.status-dot.status-offline{background:#b91c1c !important;animation:none}' +
      '.dio-tb-status[data-sync="nosession"] #status-text,.dio-tb-status[data-sync="offline"] #status-text{color:#b91c1c !important}' +
      '.dio-cf{direction:rtl;font-family:"Jameel Noori Nastaleeq",serif;font-size:12pt}' +
      '.dio-cf-cols{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
      '.dio-cf-box{border:1px solid var(--border);border-radius:8px;padding:8px;background:var(--bg-card)}' +
      '.dio-cf-h{font-weight:700;font-size:14pt;margin-bottom:4px}' +
      '.dio-cf-meta{font-size:10pt;color:var(--text-muted);margin-bottom:6px}' +
      '.dio-cf-txt{max-height:38vh;overflow:auto;white-space:pre-wrap;border-top:1px dashed var(--border);padding-top:6px;line-height:1.9}' +
      '.dio-cf-txt bdi,.dio-cf-meta bdi,.dio-cf-diff bdi{unicode-bidi:isolate}' +
      // فرق — دونوں نسخوں میں جو حصہ مختلف ہے، نمایاں (پورا متن نیچے)
      '.dio-cf-diff{background:var(--bg-secondary);border-radius:6px;padding:6px 8px;margin-bottom:6px;line-height:2;white-space:pre-wrap;unicode-bidi:plaintext}' +
      '.dio-cf-diff .dio-cf-dl{font-weight:700;margin-inline-end:4px}' +
      '.dio-cf-diff mark{background:#fde68a;color:#111;padding:0 2px;border-radius:3px}' +
      '@media (max-width:760px){.dio-cf-cols{grid-template-columns:1fr}}';
    (document.head || document.documentElement).appendChild(st);
  })();

  DS.showDetails = async function () {
    await DS.hasSession(true);
    await refreshQueueCount();
    var s = DS.state(), p = s.detail;
    var rows = [];
    if (p.zimni) rows.push('ضمنیاں: <bdi>' + p.zimni + '</bdi>');
    if (p.za) rows.push('بیانات (اندرونی ضمنی): <bdi>' + p.za + '</bdi>');
    if (p.r173) rows.push('چالان / رپورٹ 173: <bdi>' + p.r173 + '</bdi>');
    if (p.drafts) rows.push('مسودے: <bdi>' + p.drafts + '</bdi>');
    if (s.queue) rows.push('دیگر (آف لائن قطار): <bdi>' + s.queue + '</bdi>');
    var head = s.mode === 'ok' ? 'تمام کام سرور پر محفوظ ہے۔'
      : s.mode === 'syncing' ? 'یہ کام ابھی سرور پر جا رہا ہے:'
      : s.mode === 'offline' ? 'انٹرنیٹ نہیں۔ یہ کام اسی آلے پر محفوظ ہے اور انٹرنیٹ آتے ہی خود سرور پر جائے گا:'
      : 'انٹرنیٹ موجود ہے مگر سرور سے رابطہ (لاگ اِن) ختم ہو چکا ہے، اس لیے کچھ بھی سرور پر نہیں جا رہا۔ آپ کا کام اسی آلے پر محفوظ ہے۔';
    var body = '<div class="dio-cf"><p>' + head + '</p>' + (rows.length ? '<ul><li>' + rows.join('</li><li>') + '</li></ul>' : '') +
      (s.conflicts ? '<p style="color:#b45309">دو آلات پر بدلی گئی دستاویزات (فیصلہ باقی): <bdi>' + s.conflicts + '</bdi> — متعلقہ فہرست میں «دو نسخے» پر کلک کریں۔</p>' : '') +
      (_lastErr ? '<p style="color:#b91c1c">آخری ناکامی: ' + esc(_lastErr) + '</p>' : '') +
      '<p style="color:var(--text-muted);font-size:10pt">یہ آلہ: <bdi>' + esc(DS.device()) + '</bdi> · زندہ رابطہ: <bdi>' + esc(_rtStatus || '—') + '</bdi></p></div>';
    var foot = '<div style="display:flex;gap:8px;direction:rtl;flex-wrap:wrap">' +
      (s.mode === 'nosession' ? '<button class="btn btn-primary" onclick="closeModal();DIOSync.relogin()">سرور سے دوبارہ جوڑیں</button>' : '') +
      (s.mode !== 'offline' && s.mode !== 'nosession' ? '<button class="btn btn-primary" onclick="closeModal();DIOSync.kick(true)">ابھی سنک کریں</button>' : '') +
      '<button class="btn btn-secondary" onclick="closeModal()">بند کریں</button></div>';
    if (typeof openModal === 'function') openModal('سنک کی حالت', body, foot);
  };

  // session بحال: پہلے خاموش کوشش، نہ ہو تو صاف بتاؤ کہ پاس ورڈ سے لاگ اِن درکار
  DS.relogin = async function () {
    var ok = false;
    try { if (typeof window._dioReauthIfNeeded === 'function') ok = await window._dioReauthIfNeeded(); } catch (_) { ok = false; }
    await DS.hasSession(true);
    if (ok || _sess.ok) { DS.kick(true); return true; }
    if (typeof openModal === 'function') {
      openModal('دوبارہ لاگ اِن درکار',
        '<div class="dio-cf"><p>سرور سے رابطہ خود بحال نہیں ہو سکا۔ ایک بار پاس ورڈ سے لاگ اِن کریں — اس آلے پر محفوظ کام ضائع نہیں ہوگا اور لاگ اِن ہوتے ہی خود سرور پر چلا جائے گا۔</p></div>',
        '<div style="display:flex;gap:8px;direction:rtl"><button class="btn btn-primary" onclick="closeModal();window.doLogout&&doLogout()">لاگ اِن صفحہ</button><button class="btn btn-secondary" onclick="closeModal()">بعد میں</button></div>');
    }
    return false;
  };

  // ═══ 2) مقامی ذخیرے میں سرور کی قطار (realtime / pull) ═════════════════
  function contentOf(row) {
    if (!row) return {};
    var v = row.content;
    if (v && typeof v === 'object') return v;
    if (typeof v === 'string' && v.trim().charAt(0) === '{') { try { return JSON.parse(v); } catch (_) { /* نیچے */ } }
    if (typeof v === 'string' && v.trim()) return { bodyHtml: v };
    if (typeof row.body === 'string' && row.body.trim()) {
      var b = row.body.trim();
      if (b.charAt(0) === '{') { try { return JSON.parse(b); } catch (_) { /* سادہ متن */ } }
      return { bodyHtml: row.body };
    }
    return {};
  }
  DS.contentOf = contentOf;
  function savedAtOf(x) {
    if (!x) return '';
    if (x.content && x.content.saved_at) return String(x.content.saved_at);
    if (x.form_data && x.form_data.saved_at) return String(x.form_data.saved_at);
    if (x.saved) return String(x.saved);
    return '';
  }
  DS.savedAtOf = savedAtOf;

  /* list میں ایک سرور قطار ملاؤ — نتیجہ: 'add' | 'replace' | 'remove' | 'conflict' | 'same' | ''
     • اسی آلے کی زیرِ التوا ترمیم: سرور والی نقل کا saved_at وہی ہو تو یہ ہماری اپنی
       تحریر کی واپسی ہے (قبول)؛ مختلف ہو تو دونوں نسخے — _conflict (کچھ نہیں مٹتا) */
  DS.mergeInto = function (list, item, opts) {
    opts = opts || {};
    var i = -1;
    for (var j = 0; j < list.length; j++) if (String(list[j] && list[j].id) === String(item.id)) { i = j; break; }
    var cur = i >= 0 ? list[i] : null;
    if (item.deleted_at) {
      if (!cur) return '';
      if (cur._pending && savedAtOf(cur) !== savedAtOf(item)) {
        list[i] = Object.assign({}, cur, { _conflict: Object.assign({}, item, { _deleted: true }) });
        return 'conflict';
      }
      list.splice(i, 1); return 'remove';
    }
    if (!cur) { if (opts.noAdd) return ''; list.push(item); return 'add'; }
    if (cur._pending || cur._conflict) {
      if (savedAtOf(cur) && savedAtOf(cur) === savedAtOf(item)) { list[i] = item; return 'replace'; }
      if (cur.rev != null && item.rev != null && Number(item.rev) <= Number(cur.rev) && !cur._conflict) return 'same';
      list[i] = Object.assign({}, cur, { _conflict: item });
      return 'conflict';
    }
    if (cur.rev != null && item.rev != null && Number(cur.rev) === Number(item.rev) && savedAtOf(cur) === savedAtOf(item)) return 'same';
    list[i] = item; return 'replace';
  };

  function zimniItem(row) { return Object.assign({}, row, { content: contentOf(row) }); }
  function r173Item(row) {
    var f = row.form_data || {};
    return { id: row.id, type: row.report_type, subtype: row.report_subtype || '', head: f.head || '', form_data: f,
      date: f.sho_date2 || f.sho_date || (row.created_at ? String(row.created_at).slice(0, 10) : ''),
      saved: f.saved_at || row.updated_at || row.created_at || '', rev: row.rev, last_device: row.last_device,
      deleted_at: row.deleted_at || null };
  }
  DS.r173Item = r173Item;
  DS.zimniItem = zimniItem;

  function applyToList(key, item, noAdd) {
    var exists = LS.getItem(key) != null;
    // اس آلے پر یہ فہرست کبھی بنی ہی نہیں — ادھوری نقل نہ بناؤ (کھلنے پر سرور سے پوری آتی ہے)
    if (!exists) return '';
    var list = jget(key, []);
    if (!Array.isArray(list)) list = [];
    var r = DS.mergeInto(list, item);
    if (r && r !== 'same') jput(key, list);
    return r;
  }

  // ═══ 3) مسودے (dio_user_data) ══════════════════════════════════════════
  //  doc_key = <case_id>|<مسودے کی چابی>   (چابی: new:<وقت> یا id:<ضمنی>)
  //  باہر جانے والی قطار localStorage میں (dio_ud_outbox) — آلہ بند ہو تب بھی باقی
  var UD_KIND = { zimni_draft: 'dio_zimni_draft_', za_draft: 'dio_za_draft_' };
  var ud = DS.ud = {};
  function udKnown() { return jget('dio_ud_known', {}) || {}; }
  function udKnownSet(docKey, on) { var k = udKnown(); if (on) k[docKey] = 1; else delete k[docKey]; jput('dio_ud_known', k); }
  var _udTimer = null;
  ud.queue = function (kind, caseId, key, data) {
    try { if (window.DIO && DIO.sub && typeof DIO.sub.blocked === 'function' && DIO.sub.blocked()) return; } catch (_) { /* جانچ نہ ہو سکے تو بھیجو */ }
    var docKey = String(caseId) + '|' + key;
    var ob = jget('dio_ud_outbox', {}) || {};
    if (data == null && !udKnown()[docKey] && !ob[docKey]) return;     // کبھی سرور پر گیا ہی نہیں — حذف بھیجنے کی ضرورت نہیں
    ob[docKey] = { kind: kind, case_id: caseId, data: data == null ? null : data, at: now() };
    jput('dio_ud_outbox', ob);
    clearTimeout(_udTimer);
    _udTimer = setTimeout(function () { ud.flush(); }, 2000);
    DS.render();
  };
  // پرانی اور نئی شکل کا فرق — صرف بدلے ہوئے مسودے باہر جائیں (پرانے بغیر چھوئے نہیں)
  ud.diff = function (kind, caseId, before, after) {
    if (!caseId) return;
    before = before || {}; after = after || {};
    Object.keys(after).forEach(function (k) {
      if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) ud.queue(kind, caseId, k, after[k]);
    });
    Object.keys(before).forEach(function (k) { if (!(k in after)) ud.queue(kind, caseId, k, null); });
  };
  var _udFlushing = false;
  ud.flush = async function () {
    if (_udFlushing || subBlocked()) return 0;
    var c = sb();
    if (!c || !navigator.onLine || !(await DS.hasSession())) return 0;
    var ob = jget('dio_ud_outbox', {}) || {};
    var keys = Object.keys(ob);
    if (!keys.length) return 0;
    _udFlushing = true; DS.busy(true);
    var sent = 0;
    try {
      var oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
      if (!oid) return 0;
      for (var i = 0; i < keys.length; i++) {
        var dk = keys[i], it = ob[dk];
        if (it.next && Date.now() < it.next) continue;          // پچھلی بار سرور نے رد کیا — وقفے کے بعد
        try {
          var res;
          if (it.data != null) {
            res = await c.from('dio_user_data').upsert({ officer_id: oid, kind: it.kind, doc_key: dk, case_id: DS.isUuid(it.case_id) ? it.case_id : null,
              data: it.data, last_device: DS.device(), deleted_at: null }, { onConflict: 'officer_id,kind,doc_key' }).select('id');
          } else {
            res = await c.from('dio_user_data').update({ deleted_at: it.at, last_device: DS.device() })
              .eq('kind', it.kind).eq('doc_key', dk).select('id');
          }
          if (res && res.error) throw res.error;
          var fresh = jget('dio_ud_outbox', {}) || {};
          if (fresh[dk] && fresh[dk].at === it.at) { delete fresh[dk]; jput('dio_ud_outbox', fresh); }   // اس دوران نئی تبدیلی نہ آئی ہو
          udKnownSet(dk, it.data != null);
          sent++;
        } catch (e) {
          _lastErr = 'مسودہ: ' + ((e && e.message) || e);
          if (/network|fetch/i.test(String((e && e.message) || ''))) break;
          var f2 = jget('dio_ud_outbox', {}) || {};
          if (f2[dk] && f2[dk].at === it.at) {
            f2[dk].tries = (f2[dk].tries || 0) + 1;
            f2[dk].next = Date.now() + Math.min(f2[dk].tries, 10) * 60000;
            jput('dio_ud_outbox', f2);
            if (f2[dk].tries === 1 && typeof dioLogError === 'function') dioLogError('dio-sync: masooda server par nakaam', e);
          }
        }
      }
    } finally { _udFlushing = false; DS.busy(false); }
    return sent;
  };
  // ═══ 3b) ترتیبات — SHO اور DSP/SDPO کا نام (افسر کا حکم v561: «SHO setting بھی sync») ═══
  //  doc_key = setting|<localStorage چابی>   · ہر آلے پر «کب بدلی» (dio_setting_at) — جو بعد میں بدلی وہی سب پر
  var SET_KEYS = ['digital_io_sho', 'digital_io_dsp'];
  var SET_AT = 'dio_setting_at';
  DS.settingKeys = SET_KEYS.slice();
  DS.settingChanged = function (key) {
    if (SET_KEYS.indexOf(key) < 0) return;
    var at = now(), m = jget(SET_AT, {}) || {};
    m[key] = at; jput(SET_AT, m);
    var v = null; try { v = LS.getItem(key); } catch (_) { /* storage بند */ }
    ud.queue('setting', 'setting', key, { value: v, saved_at: at });
  };
  function applySetting(row) {
    var key = String(row.doc_key || '').split('|')[1];
    if (SET_KEYS.indexOf(key) < 0) return false;
    var ob = jget('dio_ud_outbox', {}) || {};
    if (ob[row.doc_key]) return false;                      // اسی آلے کی نئی تبدیلی جانے والی ہے
    udKnownSet(row.doc_key, !row.deleted_at);
    var d = row.data || {};
    if (row.deleted_at || d.value == null) return false;
    var m = jget(SET_AT, {}) || {};
    if (m[key] && String(m[key]) >= String(d.saved_at || '')) return false;   // یہاں بعد میں بدلی گئی
    m[key] = d.saved_at || now(); jput(SET_AT, m);
    var cur = null; try { cur = LS.getItem(key); } catch (_) { /* storage بند */ }
    if (cur === d.value) return false;
    try { LS.setItem(key, d.value); } catch (_) { return false; }
    return true;
  }
  ud.pullSettings = async function () {
    var c = sb();
    if (!c || !navigator.onLine || !(await DS.hasSession())) return false;
    try {
      var r = await c.from('dio_user_data').select('*').eq('kind', 'setting');
      if (r.error) throw r.error;
      var changed = false, seen = {};
      (r.data || []).forEach(function (row) { seen[String(row.doc_key || '').split('|')[1]] = 1; if (applySetting(row)) changed = true; });
      // پہلی بار: اس آلے پر نام لکھا ہے مگر سرور پر کچھ نہیں اور یہاں سے کبھی بھیجا نہیں — یہی بنیاد بنے
      var m = jget(SET_AT, {}) || {};
      SET_KEYS.forEach(function (k) {
        if (seen[k] || m[k]) return;
        var v = null; try { v = LS.getItem(k); } catch (_) { /* storage بند */ }
        if (v != null && v !== '' && v !== '{}') DS.settingChanged(k);
      });
      if (changed) emit('setting', null, 'replace');
      return changed;
    } catch (e) { if (typeof dioLogError === 'function') dioLogError('dio-sync: settings parhna nakaam', e); return false; }
  };

  // ایک مسودہ قطار (سرور سے) اس آلے کے مسودوں میں — نتیجہ: بدلا یا نہیں
  ud.applyRow = function (row) {
    if (row && row.kind === 'setting') { var ch = applySetting(row); if (ch) emit('setting', row, 'replace'); return ch; }
    var pfx = UD_KIND[row && row.kind];
    if (!pfx || !row.doc_key) return false;
    var bar = String(row.doc_key).indexOf('|');
    if (bar < 0) return false;
    var cid = row.doc_key.slice(0, bar), key = row.doc_key.slice(bar + 1);
    var ob = jget('dio_ud_outbox', {}) || {};
    if (ob[row.doc_key]) return false;                      // اسی آلے کی نئی تبدیلی جانے والی ہے — وہی تازہ
    var store = pfx + cid, drafts = jget(store, {}) || {};
    var local = drafts[key];
    udKnownSet(row.doc_key, !row.deleted_at);
    if (row.deleted_at) {
      if (!local) return false;
      if (String(local.saved_at || '') > String(row.deleted_at)) return false;   // یہاں بعد میں بدلا گیا — رہنے دو
      delete drafts[key];
    } else {
      var rd = row.data || {};
      if (local && String(local.saved_at || '') >= String(rd.saved_at || '')) return false;
      // یہی مسودہ اس وقت اسی آلے پر کھلا ہو — اس کا متن نہ بدلو؛ دوسرا نسخہ الگ مسودہ بن جائے
      if (local && typeof DS.isOpenDraft === 'function' && DS.isOpenDraft(row.kind, cid, key)) {
        var nk = 'new:' + Date.now();
        drafts[nk] = Object.assign({}, rd, { key: nk, zimni_id: null, za_id: null,
          sub_type: (rd.sub_type || 'مسودہ') + ' — دوسرا نسخہ (' + (row.last_device || 'دوسرا آلہ') + ')' });
      } else drafts[key] = rd;
    }
    if (Object.keys(drafts).length) jput(store, drafts); else { try { LS.removeItem(store); } catch (_) { /* کچھ نہیں */ } }
    return true;
  };
  ud.pull = async function (kind, caseId) {
    var c = sb();
    if (!c || !caseId || !navigator.onLine || !(await DS.hasSession())) return false;
    try {
      var r = await c.from('dio_user_data').select('*').eq('kind', kind).eq('case_id', caseId);
      if (r.error) throw r.error;
      var changed = false;
      (r.data || []).forEach(function (row) { if (ud.applyRow(row)) changed = true; });
      return changed;
    } catch (e) { if (typeof dioLogError === 'function') dioLogError('dio-sync: masoode parhna nakaam', e); return false; }
  };

  // ═══ 4) Realtime ════════════════════════════════════════════════════════
  var TABLES = ['zimni_reports', 'zimni_androoni_reports', 'report_173', 'cases', 'dio_user_data'];
  var _rtStatus = '', _channel = null, _listeners = {};
  DS.on = function (table, fn) { (_listeners[table] = _listeners[table] || []).push(fn); };
  function emit(table, row, kind) {
    (_listeners[table] || []).forEach(function (fn) { try { fn(row, kind); } catch (e) { if (typeof dioLogError === 'function') dioLogError('dio-sync listener ' + table, e); } });
    try { window.dispatchEvent(new CustomEvent('dio-remote', { detail: { table: table, row: row, kind: kind } })); } catch (_) { /* پرانا براؤزر */ }
  }
  // ایک تبدیلی (realtime یا pull) — مقامی ذخیرہ + سننے والے
  DS.applyRemote = async function (table, row, evType) {
    if (!row || !row.id) return '';
    var r = '';
    if (table === 'zimni_reports' && row.case_id) r = applyToList('dio_zimni_' + row.case_id, zimniItem(row));
    else if (table === 'zimni_androoni_reports' && row.case_id) r = applyToList('dio_za_' + row.case_id, zimniItem(row));
    else if (table === 'report_173' && row.case_id) r = applyToList('dio_r173docs_' + row.case_id, r173Item(row));
    else if (table === 'cases') {
      try {
        // v561: مقدمہ شیئر ختم — صرف اپنے مقدمات (کسی اور افسر کا مقدمہ اس آلے پر کبھی نہ آئے)
        var me = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
        if (me && row.officer_id && String(row.officer_id) !== String(me)) return '';
        if (typeof offlineStore !== 'undefined') {
          var cur = await offlineStore.getOne('cases_cache', row.id);
          if (row.deleted_at) { if (cur) { await offlineStore.remove('cases_cache', row.id); r = 'remove'; } }
          else if (!cur || !(cur.rev != null && Number(cur.rev) === Number(row.rev))) {
            await offlineStore.cache('cases_cache', row);
            r = cur ? 'replace' : 'add';
          }
        }
      } catch (e) { if (typeof dioLogError === 'function') dioLogError('dio-sync: case cache', e); }
    } else if (table === 'dio_user_data') r = ud.applyRow(row) ? 'replace' : '';
    if (r && r !== 'same') emit(table, row, r);
    return r;
  };
  DS.startRealtime = function () {
    var c = sb();
    if (!c || !c.channel || _channel) return;
    try {
      var ch = c.channel('dio-sync');
      TABLES.forEach(function (t) {
        ch = ch.on('postgres_changes', { event: '*', schema: 'public', table: t }, function (p) {
          var row = (p && (p.new && p.new.id ? p.new : p.old)) || null;
          if (p && p.eventType === 'DELETE' && row) row = Object.assign({}, row, { deleted_at: row.deleted_at || now() });
          DS.applyRemote(t, row, p && p.eventType);
        });
      });
      _channel = ch.subscribe(function (status) { _rtStatus = String(status || ''); DS.render(); });
    } catch (e) { _rtStatus = 'ERROR'; if (typeof dioLogError === 'function') dioLogError('dio-sync realtime', e); }
  };
  DS.stopRealtime = function () {
    try { var c = sb(); if (_channel && c && c.removeChannel) c.removeChannel(_channel); } catch (_) { /* کچھ نہیں */ }
    _channel = null; _rtStatus = '';
  };

  // ═══ 5) کھلا صفحہ تازہ + باقی کام سرور پر ══════════════════════════════
  var _refreshers = [];
  DS.onRefresh = function (fn) { _refreshers.push(fn); };
  DS.refreshOpenView = async function () {
    if (!navigator.onLine || !(await DS.hasSession())) return;
    for (var i = 0; i < _refreshers.length; i++) {
      try { await _refreshers[i](); } catch (e) { if (typeof dioLogError === 'function') dioLogError('dio-sync refresh', e); }
    }
  };
  var _kickAt = 0;
  DS.kick = async function (force) {
    if (!force && Date.now() - _kickAt < 4000) return;
    _kickAt = Date.now();
    if (!loggedIn()) return;
    var had = _sess.ok;
    var ok = await DS.hasSession(true);
    if (!ok && navigator.onLine) {
      try { if (typeof window._dioReauthIfNeeded === 'function') ok = await window._dioReauthIfNeeded(); } catch (_) { ok = false; }
      if (ok) await DS.hasSession(true);
    }
    DS.render();
    if (!_sess.ok) return;
    if (!had || !_channel) DS.startRealtime();
    if (subBlocked()) {                                  // صرف دیکھنا: بھیجنا نہیں، صرف تازہ پڑھنا
      try { await ud.pullSettings(); } catch (_) { /* اگلی بار */ }
      try { await DS.refreshOpenView(); } catch (_) { /* اگلی بار */ }
      DS.render();
      return;
    }
    DS.busy(true);
    try {
      try { if (typeof window._zimniSyncPending === 'function') await window._zimniSyncPending(null, true); } catch (_) { /* اگلی بار */ }
      try { if (typeof window._zaSyncPending === 'function') await window._zaSyncPending(null, true); } catch (_) { /* اگلی بار */ }
      try { if (typeof window._r173SyncPending === 'function') await window._r173SyncPending(); } catch (_) { /* اگلی بار */ }
      try { if (typeof window._syncOfflineQueue === 'function') await window._syncOfflineQueue(); } catch (_) { /* اگلی بار */ }
      try { await ud.flush(); } catch (_) { /* اگلی بار */ }
      try { await ud.pullSettings(); } catch (_) { /* اگلی بار */ }
      await DS.refreshOpenView();
    } finally { DS.busy(false); await refreshQueueCount(); DS.render(); }
  };

  // ═══ 6) تنازعہ (دو آلات) — دونوں نسخے سامنے ══════════════════════════════
  function plain(html) {
    var d = document.createElement('div'); d.innerHTML = String(html || '');
    d.querySelectorAll('style,script').forEach(function (n) { n.remove(); });
    return (d.innerText || d.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
  }
  DS.plain = plain;
  function stamp(iso) {
    var x = new Date(iso); if (!iso || isNaN(x)) return '—';
    var p = function (n) { return String(n).padStart(2, '0'); };
    var h = x.getHours(), ap = h < 12 ? 'am' : 'pm'; h = h % 12 || 12;
    return p(x.getDate()) + '/' + p(x.getMonth() + 1) + '/' + x.getFullYear() + ' ' + p(h) + ':' + p(x.getMinutes()) + ' ' + ap;
  }
  DS.stamp = stamp;
  /* opts: { title, mine:{text, at, device}, theirs:{text, at, device, deleted} }
     نتیجہ: 'mine' | 'theirs' | 'later'  (later = دونوں نسخے جوں کے توں، بعد میں فیصلہ) */
  // دو متن — شروع اور آخر کا مشترک حصہ چھوڑ کر جو بیچ میں مختلف ہے (آس پاس کے چند لفظوں سمیت)
  function diffParts(a, b) {
    a = String(a || '').replace(/\s+/g, ' ').trim(); b = String(b || '').replace(/\s+/g, ' ').trim();
    var p = 0, s = 0;
    while (p < a.length && p < b.length && a.charAt(p) === b.charAt(p)) p++;
    while (s < a.length - p && s < b.length - p && a.charAt(a.length - 1 - s) === b.charAt(b.length - 1 - s)) s++;
    // پورا لفظ نمایاں ہو (آدھا لفظ نہیں) — فرق کو دونوں طرف خالی جگہ تک پھیلاؤ
    if (a !== b) {
      while (p > 0 && !/\s/.test(a.charAt(p - 1))) p--;
      while (s > 0 && !/\s/.test(a.charAt(a.length - s))) s--;
    }
    var C = 60;
    var cut = function (t, from, to) { return t.slice(Math.max(0, from), Math.max(0, to)); };
    var one = function (t) {
      return { pre: (p > C ? '…' : '') + cut(t, p - C, p), mid: t.slice(p, t.length - s),
               post: cut(t, t.length - s, t.length - s + C) + (s > C ? '…' : '') };
    };
    return { same: a === b, a: one(a), b: one(b) };
  }
  DS.diffParts = diffParts;
  DS.conflictDialog = function (opts) {
    return new Promise(function (resolve) {
      if (typeof openModal !== 'function') { resolve('later'); return; }
      var m0 = opts.mine || {}, t0 = opts.theirs || {};
      var df = (!m0.deleted && !t0.deleted) ? diffParts(m0.text, t0.text) : null;
      var diffHtml = function (d) {
        if (!df) return '';
        if (df.same) return '<div class="dio-cf-diff"><span class="dio-cf-dl">فرق:</span>متن دونوں میں ایک جیسا ہے</div>';
        return '<div class="dio-cf-diff"><span class="dio-cf-dl">فرق:</span>' + bidiHtml(d.pre) +
          '<mark>' + (d.mid ? bidiHtml(d.mid) : '(یہاں کچھ نہیں)') + '</mark>' + bidiHtml(d.post) + '</div>';
      };
      var side = function (h, v, btn, d) {
        return '<div class="dio-cf-box"><div class="dio-cf-h">' + h + '</div>' +
          '<div class="dio-cf-meta">آلہ: <bdi>' + esc(v.device || '—') + '</bdi> · وقت: <bdi>' + esc(stamp(v.at)) + '</bdi></div>' +
          (v.deleted ? '<div style="color:#b91c1c">دوسرے آلے پر یہ حذف کر دی گئی ہے</div>'
            : diffHtml(d) + '<div class="dio-cf-txt">' + bidiHtml(v.text || '') + '</div>') +
          '<div style="margin-top:8px"><button class="btn btn-primary btn-sm" data-pick="' + btn + '">' + (v.deleted ? 'حذف ہی رہنے دیں' : 'یہ نسخہ رکھیں') + '</button></div></div>';
      };
      openModal(opts.title || 'دو آلات پر بدلی گئی',
        '<div class="dio-cf"><p>یہ دستاویز دو آلات پر الگ الگ بدلی گئی ہے۔ کوئی متن خود نہیں مٹایا گیا — جو نسخہ رکھنا ہے چنیں۔ دوسرا نسخہ «حذف شدہ مواد» میں محفوظ رہے گا۔</p>' +
        '<div class="dio-cf-cols">' + side('اس آلے کا نسخہ', m0, 'mine', df && df.a) + side('سرور پر موجود نسخہ', t0, 'theirs', df && df.b) + '</div></div>',
        opts.noLater ? '' : '<div style="display:flex;gap:8px;direction:rtl"><button class="btn btn-secondary" data-pick="later">ابھی نہیں — دونوں محفوظ رہیں</button></div>');
      var bd = document.getElementById('modal-backdrop');
      var settled = false, poll = null;
      var done = function (v) {
        if (settled) return; settled = true; clearInterval(poll);
        try { bd.removeEventListener('click', h, true); } catch (_) { /* کچھ نہیں */ }
        if (typeof closeModal === 'function') closeModal();
        resolve(v);
      };
      var h = function (e) { var b = e.target && e.target.closest && e.target.closest('[data-pick]'); if (b) { e.preventDefault(); done(b.getAttribute('data-pick')); } };
      if (bd) bd.addEventListener('click', h, true);
      // کارڈ بغیر چنے بند کر دیا گیا — «بعد میں» (دونوں محفوظ)؛ جہاں «بعد میں» ممکن نہیں وہاں
      // سرور والا رہے اور اس آلے کا نسخہ «حذف شدہ مواد» میں (پکارنے والا یہی کرتا ہے)
      poll = setInterval(function () { if (!bd || bd.style.display === 'none') done(opts.noLater ? 'theirs' : 'later'); }, 300);
    });
  };

  // نہ چنا گیا نسخہ — «حذف شدہ مواد» میں نئی شناخت کے ساتھ (بحال = الگ دستاویز)
  DS.keepLoser = async function (type, row) {
    try {
      var copy = Object.assign({}, row, { id: DS.uuid(), _conflict: undefined, _pending: undefined, deleted_at: null, rev: undefined });
      if (typeof dioBinCopy === 'function') return await dioBinCopy(type, copy.id, Object.assign({ _conflict_copy: true }, copy));
    } catch (e) { if (typeof dioLogError === 'function') dioLogError('dio-sync: dosra nuskha bin me nakaam', e); }
    return false;
  };

  // پرانی آف لائن قطار کا چالان — اگر وہی چالان (اسی «محفوظ کرنے کے وقت» کا) مقامی فہرست میں ہے
  //   تو اسے چالان کا اپنا sync (report173.js → _r173SyncPending) بھیجے گا؛ قطار سے نہیں (ورنہ دو بار)
  DS.r173QueueCovered = function (data) {
    try {
      var fd = data && data.form_data, cid = data && data.case_id;
      if (!fd || !fd.saved_at || !cid) return false;
      var list = jget('dio_r173docs_' + cid, []);
      return Array.isArray(list) && list.some(function (d) { return d && d.form_data && d.form_data.saved_at === fd.saved_at; });
    } catch (_) { return false; }
  };

  // سرور پر قطار کیوں نہیں بدلی؟ — rev بدل گیا (دوسرا آلہ) / حذف / اجازت نہیں
  DS.whyNoRow = async function (table, id) {
    var c = sb();
    try {
      var r = await c.from(table).select('*').eq('id', id).maybeSingle();
      if (r && r.error) return { exists: false, error: r.error };
      return { exists: !!(r && r.data), row: r && r.data };
    } catch (e) { return { exists: false, error: e }; }
  };
  DS.conflictError = function (row, label) {
    var e = new Error((label || 'دستاویز') + ' دوسرے آلے پر بھی بدلی گئی ہے — دونوں نسخے محفوظ، فیصلہ باقی');
    e.code = 'DIO_CONFLICT'; e.server = row; return e;
  };

  // «حذف» = نشان (اصل قطار محفوظ) — پہلے «حذف شدہ مواد» میں نقل
  DS.softDelete = async function (table, binType, row) {
    var c = sb();
    if (!c) throw new Error('سرور دستیاب نہیں');
    var binId = (typeof dioBinCopy === 'function') ? await dioBinCopy(binType, row.id, row) : false;
    if (!binId) throw new Error('«حذف شدہ مواد» میں نقل نہ بن سکی — حذف روک دیا گیا (کچھ ضائع نہیں)');
    var res = await c.from(table).update({ deleted_at: now(), last_device: DS.device() }).eq('id', row.id).select('id');
    if (res.error || !(res.data && res.data.length)) {
      try { if (typeof softDeleteUndo === 'function') await softDeleteUndo(binId); } catch (_) { /* نقل رہ جائے تو بھی ڈیٹا محفوظ */ }
      if (res.error) throw res.error;
      var er = new Error('سرور پر ریکارڈ نہیں ملا یا اجازت نہیں'); er.code = 'DIO_NOROW'; throw er;
    }
    return true;
  };

  // ═══ 6b) مقدمات کی فہرست — دوسرے آلے کا نیا/بدلا/حذف شدہ مقدمہ بغیر refresh ═══
  DS.on('cases', function () {
    // صرف جدول کی قطاریں بدلتی ہیں (تلاش کا خانہ نہیں) — افسر تلاش میں لکھ رہا ہو تب بھی محفوظ
    try { if (document.getElementById('cs-rows') && typeof _csRefreshRows === 'function') _csRefreshRows(); } catch (_) { /* اگلی بار */ }
  });
  DS.onRefresh(async function () {
    if (!document.getElementById('cs-rows') || typing() || typeof _refreshCasesInBackground !== 'function') return;
    var oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
    if (oid) await _refreshCasesInBackground(oid);
  });

  // ═══ 7) چلانا ═══════════════════════════════════════════════════════════
  function boot() {
    DS.render();
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') setTimeout(function () { DS.kick(); }, 600); });
    window.addEventListener('focus', function () { setTimeout(function () { DS.kick(); }, 600); });
    window.addEventListener('online', function () { _sess.ok = null; setTimeout(function () { DS.kick(true); }, 1500); DS.render(); });
    window.addEventListener('offline', function () { DS.render(); });
    // ہر چند سیکنڈ: حالت؛ ہر 15 سیکنڈ: مسودے؛ realtime نہ ہو تو کھلا صفحہ خود تازہ (10 سیکنڈ کا وعدہ)
    setInterval(function () { refreshQueueCount().then(DS.render); }, 4000);
    setInterval(function () { if (loggedIn() && navigator.onLine) ud.flush(); }, 15000);
    setInterval(function () {
      if (!loggedIn() || document.visibilityState !== 'visible' || !navigator.onLine) return;
      if (_rtStatus !== 'SUBSCRIBED' && !typing()) DS.refreshOpenView();
    }, 8000);
    setInterval(function () { if (loggedIn()) DS.hasSession(true).then(function (ok) { DS.render(); if (ok && !_channel) DS.startRealtime(); }); }, 60000);
    // لاگ اِن مکمل ہوتے ہی (currentUser بنتے ہی) پہلی بار
    var tries = 0;
    var t = setInterval(function () {
      if (loggedIn()) { clearInterval(t); setTimeout(function () { DS.kick(true); }, 2500); }
      else if (++tries > 600) clearInterval(t);
    }, 500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
