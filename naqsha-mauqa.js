/* ═══════════════════════════════════════════════════════════════════
   DIGITAL IO — نقشہ موقع  (Site Plan / Scene Sketch)  ·  naqsha-mauqa.js
   ───────────────────────────────────────────────────────────────────
   مقدمہ کی دستاویزات کی patti کا chip «نقشہ موقع» (misal-docs.js) اسے کھولتا ہے۔
   • مکمل دستاویز (چالان/زمنی جیسا): ہیڈر (تھانہ/ضلع کناروں پر، سرکار بذریعہ+مدعی،
     FIR سطر، بنام ▾ + ملزمان [پہلا بلا نمبر، پھر 2،3 — انگریزی])، underline عنوان +
     قسم dropdown، بے-بارڈر نقشہ + اوپر-دائیں سمت نما (E-W عنوان کی سیدھ، N-S لمبا)،
     امتیازی نشانات (auto-نمبر: «نمبر1 سے مراد وہ مقام»)، نیچے بائیں IO + تاریخ۔
   • تصویر insert/paste/drag + move/resize/rotate/flip/crop/copy/delete + متن لیبل (Fabric)۔
   • A4 اور legal دونوں؛ editor == print (WYSIWYG)؛ margins چالان کی طرح۔
   • Save فی مقدمہ: serial + تاریخ + نام؛ localStorage + cloud (case_documents)؛
     فہرست/chips؛ تصویر خودکار compress۔ report173.js/locked ماڈیول کو ہاتھ نہیں لگاتا۔
   • تمام serial/نمبر انگریزی ہندسے (پورے سسٹم کا اصول)۔ عالمی مائیک خودکار۔
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const E   = (v) => (typeof esc === 'function') ? esc(v) : String(v == null ? '' : v)
                       .replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TOAST = (m, t) => { try { if (typeof showToast === 'function') showToast(m, t || 'info'); } catch (_) { /* paigham na dikh sake to koi baat nahi */ } };
  // formatDate خالی پر «—» دیتا ہے — یہاں خالی ہی رہے (ورنہ «||» کا متبادل کبھی نہ چلتا)
  const FDATE = (d) => { try { const v = (typeof formatDate === 'function') ? formatDate(d) : (d || ''); return (v === '—') ? '' : v; } catch (_) { return d || ''; } };
  const PT2PX = 96 / 72;
  const pt2px = (pt) => pt * PT2PX;

  // ── حالت ─────────────────────────────────────────────────────────
  let _naqCaseId = null, _naqCase = {}, _naqOff = {};
  let _naqAccList = [];                 // [{name,cnic}]
  let _naqData   = { sketches: [], activeId: null };
  let _naqRowId  = null;                // case_documents row id (cloud)
  let _naqCanvas = null, _naqClip = null, _naqSaveT = null, _naqCrop = null, _naqReplaceMode = false;
  // ── ڈرائنگ حالت (لکیر/تیر/شکلیں + قلم + pan + رنگ/موٹائی) ──
  let _naqTool = 'select';          // select | pen | line | arrow | rect | ellipse | pan
  let _naqStroke = '#111111', _naqStrokeW = 2;
  let _naqDrawing = null, _naqDrawStart = null;   // زیرِ تعمیر عارضی شکل
  let _naqPanning = false, _naqPanLast = null, _naqZoom = 1;
  // ── Undo/Redo history ──
  let _naqHist = [], _naqHistI = -1, _naqRestoring = false, _naqHistT = null;
  // v553: کینوس پوری طرح لوڈ (محفوظ JSON سمیت) — پرنٹ/پیمائش اس کا انتظار کرتی ہے
  let _naqReady = Promise.resolve(), _naqReadyR = null;
  // v553: سیدھی لکیر (Ctrl/Shift دبا کر، یا 📏 بٹن) — 0°/45°/90°
  let _naqStraightLock = false, _naqKeyStraight = false, _naqDrawTool = null;
  const FABRIC_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js';

  const _key = () => 'dio_naqsha_' + (_naqCaseId || 'nocase');
  const _uid = () => 'nq' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const _online = () => { try { return navigator.onLine; } catch (_) { return false; } };

  // ══ Fabric loader ══════════════════════════════════════════════════
  function _ensureFabric() {
    return new Promise((resolve, reject) => {
      if (window.fabric) return resolve(window.fabric);
      let s = document.getElementById('naq-fabric-lib');
      if (s) { s.addEventListener('load', () => resolve(window.fabric)); s.addEventListener('error', reject); return; }
      s = document.createElement('script'); s.id = 'naq-fabric-lib'; s.src = FABRIC_SRC;
      // v546: لوڈ ناکام (مثلاً آف لائن) ہو تو ٹیگ ہٹا دو — پہلے ٹیگ رہ جاتا اور دوسری
      //   بار نقشہ کھولنے پر وہ ایسے «load» کا انتظار کرتا جو کبھی نہیں آتا (صفحہ اٹک جاتا)
      const drop = () => { try { s.remove(); } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ } };
      s.onload = () => { if (window.fabric) resolve(window.fabric); else { drop(); reject(new Error('fabric')); } };
      s.onerror = () => { drop(); reject(new Error('fabric net')); };
      document.head.appendChild(s);
    });
  }

  // ══ Case data (وہی ماخذ جو report173 پڑھتا ہے) ═════════════════════
  async function _loadCase(forceId) {
    _naqCaseId = forceId
      || (typeof _misalCaseId !== 'undefined' && _misalCaseId)
      || (typeof currentCaseId !== 'undefined' && currentCaseId) || null;
    _naqOff = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
    _naqCase = {};
    if (_naqCaseId && typeof getCase === 'function') {
      try { _naqCase = (await getCase(_naqCaseId)) || {}; } catch (_) { _naqCase = {}; }
    }
    _naqAccList = [];
    if (_naqCaseId && typeof supabaseClient !== 'undefined' && supabaseClient && _online()) {
      try {
        const { data } = await supabaseClient.from('case_accused')
          .select('name,cnic,accused_type').eq('case_id', _naqCaseId).order('created_at', { ascending: true });
        _naqAccList = (data || []).filter(a => (a.accused_type || 'fir') === 'fir')
          .map(a => ({ name: (a.name || '').trim(), cnic: (a.cnic || '').trim() })).filter(a => a.name);
      } catch (_) { _naqAccList = []; }
    }
  }

  function _auto() {
    const c = _naqCase || {}, o = _naqOff || {};
    // بجرم = صرف دفعات (v544 — پورے سسٹم کا اصول؛ جرم کی تفصیل نہیں)
    const jurm = (c.section_of_law || '').trim();
    return {
      thana: (o.station || c.case_station || '').trim(),
      zila:  (o.district || c.district || 'ملتان').trim(),
      sarkar: (c.complainant || '').trim(),
      muqadma: (c.fir_number || '').trim(),
      morkha: FDATE(c.fir_date) || '',
      bajurm: jurm,
      bahad: (c.occurrence_place || '').trim(),   // بحد (نیا کیس کارڈ کا خانہ)
      banam: _naqAccList.map(a => a.name),   // default: تمام ملزمان
    };
  }
  // اندراجِ مقدمہ کی تاریخ (IO لائن + محفوظ فہرست کے لیے)
  const _regDate = () => FDATE((_naqCase || {}).fir_date) || FDATE(new Date().toISOString().slice(0, 10));

  // ══ Persist (localStorage + cloud) ═════════════════════════════════
  //  v546 — خرابیاں دور: (1) سرور کا نتیجہ دیکھا ہی نہیں جاتا تھا، پھر بھی «محفوظ»؛
  //  (2) آف لائن تبدیلیاں کبھی سرور پر نہ جاتیں، اور اگلی بار آن لائن کھولنے پر سرور
  //  کی پرانی کاپی انہیں دبا دیتی (ڈیٹا ضائع)؛ (3) ایک ساتھ دو save پر دوہری قطار۔
  //  اب: جو سرور تک نہ پہنچے وہ «زیرِ التوا» نشان کے ساتھ اس آلے پر رہتا ہے، کھولنے
  //  پر وہی ترجیح پاتا ہے، اور انٹرنیٹ آتے ہی خود سرور پر چلا جاتا ہے۔
  const _pendKey = (cid) => 'dio_naqsha_' + (cid || 'nocase') + '::pending';
  function _setPending(cid, on) {
    try { if (on) localStorage.setItem(_pendKey(cid), '1'); else localStorage.removeItem(_pendKey(cid)); }
    catch (_) { if (typeof dioLogError === 'function') dioLogError('naqsha: pending nishan nakaam', _); }
  }
  function _isPending(cid) { try { return localStorage.getItem(_pendKey(cid)) === '1'; } catch (_) { return false; } }

  async function _load() {
    _naqData = null; _naqRowId = null;
    let cloud = null, local = null;
    if (_naqCaseId && typeof supabaseClient !== 'undefined' && supabaseClient && _online()) {
      try {
        const { data, error } = await supabaseClient.from('case_documents')
          .select('id,content').eq('case_id', _naqCaseId).eq('document_type', 'naqsha')
          .order('created_at', { ascending: true }).limit(1);
        if (error) throw error;
        const row = (data || [])[0];
        if (row) { _naqRowId = row.id; if (row.content && row.content.sketches) cloud = row.content; }
      } catch (_) { /* parhna na ho sake to is aale wali copy chalegi */ }
    }
    try { local = JSON.parse(localStorage.getItem(_key()) || 'null'); } catch (_) { local = null; }
    const localOk = !!(local && Array.isArray(local.sketches));
    // زیرِ التوا (سرور تک نہ پہنچی) مقامی کاپی سرور کی پرانی کاپی سے نئی ہے — وہی چلے
    if (localOk && _isPending(_naqCaseId)) { _naqData = local; if (_online()) _persistCloud(); }
    else _naqData = cloud || (localOk ? local : null);
    if (!_naqData || !Array.isArray(_naqData.sketches)) _naqData = { sketches: [], activeId: null };
    // v553: خالی فہرست ممکن (chip پر پہلے محفوظ نقشوں کی فہرست کھلتی ہے)؛
    //   نیا نقشہ صرف «+ نقشہ موقع درج کریں» سے بنتا ہے
    if (_naqData.sketches.length && (!_naqData.activeId || !_naqData.sketches.some(s => s.id === _naqData.activeId)))
      _naqData.activeId = _naqData.sketches[0].id;
  }
  function _persistLocal() { try { localStorage.setItem(_key(), JSON.stringify(_naqData)); } catch (_) { if (typeof dioLogError === 'function') dioLogError('naqsha: local save nakaam', _); } }

  // ایک مقدمے کا نقشہ سرور پر (update، قطار نہ ملے تو insert) → { status, rowId, error }
  async function _cloudOnce(cid, content, rowId) {
    if (!cid) return { status: 'ok', rowId };
    if (typeof supabaseClient === 'undefined' || !supabaseClient || !_online()) return { status: 'queued', rowId };
    try {
      const T = () => supabaseClient.from('case_documents');
      if (!rowId) {   // پہلے دیکھو سرور پر اس مقدمے کا نقشہ موجود تو نہیں (دوہری قطار سے بچاؤ)
        const q = await T().select('id').eq('case_id', cid).eq('document_type', 'naqsha')
          .order('created_at', { ascending: true }).limit(1);
        if (q.error) throw q.error;
        if (q.data && q.data.length) rowId = q.data[0].id;
      }
      let r = null;
      if (rowId) {
        r = await T().update({ content, status: 'draft' }).eq('id', rowId).select('id');
        if (!r.error && Array.isArray(r.data) && !r.data.length) { rowId = null; r = null; }   // قطار نہیں رہی
      }
      if (!r) {
        let oid = null; try { oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null; } catch (_) { /* parhna na ho sake to pehle wali/khali qadr rahe */ }
        r = await T().insert({ case_id: cid, officer_id: oid, document_type: 'naqsha', status: 'draft', content })
          .select('id').single();
        if (!r.error && r.data) rowId = r.data.id;
      }
      if (r.error) throw r.error;
      return { status: 'ok', rowId };
    } catch (e) {
      const net = !_online() || (typeof _dioIsNetErr === 'function' && _dioIsNetErr(e));
      if (!net && typeof dioLogError === 'function') dioLogError('naqsha: server par save nakaam', e);
      return { status: net ? 'queued' : 'error', error: e, rowId };
    }
  }
  // ایک وقت میں ایک ہی save؛ بیچ میں نئی تبدیلی آئے تو ختم ہونے پر تازہ data دوبارہ
  let _naqCloudP = null, _naqCloudAgain = false;
  function _persistCloud() {
    if (_naqCloudP) { _naqCloudAgain = true; return _naqCloudP; }
    _naqCloudP = (async () => {
      let res;
      do {
        _naqCloudAgain = false;
        const cid = _naqCaseId;
        res = await _cloudOnce(cid, _naqData, _naqRowId);
        if (cid === _naqCaseId) _naqRowId = res.rowId || null;
        _setPending(cid, res.status !== 'ok');
      } while (_naqCloudAgain && res.status === 'ok');
      _naqCloudP = null;
      return res;
    })();
    return _naqCloudP;
  }
  // انٹرنیٹ آتے ہی: ہر مقدمے کا زیرِ التوا نقشہ سرور پر (کھلا ہو یا نہیں)
  async function _syncPendingNaqshe() {
    if (!_online() || typeof supabaseClient === 'undefined' || !supabaseClient) return;
    let keys = [];
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^dio_naqsha_.+::pending$/.test(k)) keys.push(k); } }
    catch (_) { return; }
    for (const k of keys) {
      const cid = k.slice('dio_naqsha_'.length, -'::pending'.length);
      if (cid === _naqCaseId) { await _persistCloud(); continue; }
      let data = null; try { data = JSON.parse(localStorage.getItem('dio_naqsha_' + cid) || 'null'); } catch (_) { data = null; }
      if (!data || !Array.isArray(data.sketches)) { _setPending(cid, false); continue; }
      const res = await _cloudOnce(cid, data, null);
      if (res.status === 'ok') _setPending(cid, false);
    }
  }
  window.addEventListener('online', () => { setTimeout(() => { _syncPendingNaqshe(); }, 1500); });
  setTimeout(() => { _syncPendingNaqshe(); }, 5000);
  window._naqSyncPending = _syncPendingNaqshe;
  function _newSketch(type) {
    const serials = (_naqData && _naqData.sketches) ? _naqData.sketches.map(s => parseInt(s.serial, 10) || 0) : [];
    const nextSerial = (serials.length ? Math.max.apply(null, serials) : 0) + 1;
    return {
      id: _uid(), serial: nextSerial, type: type || 'waqia',
      name: 'نقشہ موقع', date: _regDate(),
      header: _auto(), marks: [''], canvas: null,
    };
  }
  const _active = () => _naqData.sketches.find(s => s.id === _naqData.activeId) || _naqData.sketches[0];

  // موجودہ DOM + canvas سے فعال سکیچ اپڈیٹ کرو
  function _snapshot() {
    const a = _active(); if (!a) return;
    const g = (id) => { const el = document.getElementById(id); if (!el) return undefined; return (el.tagName === 'INPUT') ? el.value : el.innerText.replace(/ /g, ' ').trim(); };
    a.header = a.header || {};
    ['thana', 'zila', 'sarkar', 'muqadma', 'morkha', 'bajurm', 'bahad'].forEach(k => { const v = g('naq-h-' + k); if (v !== undefined) a.header[k] = v; });
    const t2 = g('naq-h-thana2'); if (t2 !== undefined && t2 !== '') a.header.thana2 = t2;
    const ty = document.getElementById('naq-type'); if (ty) a.type = ty.value;
    a.header.banam = _chosenBanam();
    const ionm = document.getElementById('naq-io-nm'); if (ionm) a.io = ionm.innerText.replace(/ /g, ' ').trim();
    const iodt = document.getElementById('naq-io-dt'); if (iodt) a.date = iodt.innerText.replace(/ /g, ' ').trim();
    const mh = document.getElementById('naq-map'); if (mh) a.mapH = mh.clientHeight;
    if (_naqCanvas) { try { a.mapW = _naqCanvas.getWidth(); } catch (_) { /* ضمنی */ } }
    a.savedAt = new Date().toISOString();       // فہرست میں «وقت»
    // امتیازی نشانات
    const mrows = document.querySelectorAll('#naq-marks .naq-mrow');
    if (mrows.length) a.marks = Array.from(mrows).map(r => {
      const tx = r.querySelector('.naq-mtext');
      const t = tx ? tx.innerText.replace(/\u00a0/g, ' ').trim() : '';
      const id = r.getAttribute('data-markid') || '';
      return id ? { id, t } : t;
    });
    // فاصلہ جات (تخمیناً)
    const drows = document.querySelectorAll('#naq-dist .naq-dtext');
    if (drows.length) a.dists = Array.from(drows).map(r => r.innerText.replace(/ /g, ' ').trim());
    if (_naqCanvas) { try { a.canvas = _naqCanvas.toJSON(['naqLabel', 'naqSym', 'naqMark', 'naqMarkId', 'naqMarkSeq']); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } }
  }
  function _saveSoon() {
    clearTimeout(_naqSaveT);
    _naqSaveT = setTimeout(() => { _snapshot(); _persistLocal(); _persistCloud(); }, 600);
  }
  // صریح محفوظ (💾)
  async function naqSaveNow() {
    _snapshot(); const a = _active();
    if (a) a.name = 'نقشہ موقع — ' + (a.type === 'baramad' ? 'جائے برامدگی' : 'جائے وقوعہ');
    _persistLocal(); const _res = await _persistCloud();
    try {
      if (typeof dioRegisterSaved === 'function' && a)
        dioRegisterSaved('naqsha', (a.name || 'نقشہ موقع') + ' — نمبر ' + (a.serial || ''),
          { case_id: _naqCaseId, doc_id: 'crime_scene', serial_no: a.serial, date: a.date });
    } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
    // v546: صرف واقعی محفوظ ہونے پر «محفوظ»؛ ورنہ صاف بتاؤ کہ کہاں ہے
    if (typeof dioSaveToast === 'function') dioSaveToast(_res, 'نقشہ موقع', { fail: 'محفوظ نہیں ہوا (اس آلے پر محفوظ ہے؛ دوبارہ کوشش خود ہوگی)' });
    else TOAST(_res.status === 'ok' ? '✅ نقشہ موقع محفوظ ہو گیا' : '⚠ نقشہ موقع اس آلے پر محفوظ — سرور پر بعد میں جائے گا', _res.status === 'ok' ? 'success' : 'info');
    _refreshChips();
  }
  window.naqSaveNow = naqSaveNow;

  // ══ Entry ══════════════════════════════════════════════════════════
  async function openNaqsha(caseId) {
    const cid = caseId || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
      || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
    // چالان/زمنی/درخواست کی طرح — پورے صفحے کی doc-view کھولو تاکہ مقدمہ کی
    // دستاویزات کی chips patti ڈھک جائے (نہ کہ نقشہ اس کے نیچے inline کھلے)
    if (typeof _dioOpenDocTab === 'function') { try { _dioOpenDocTab('crime_scene'); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } }
    const area = document.getElementById('workspace-editor-area')
      || document.getElementById('workspace-tab-content') || document.getElementById('page-content');
    if (!area) { setTimeout(() => openNaqsha(cid), 80); return; }
    // v553: chip پر پہلے اس مقدمے کے محفوظ نقشوں کی فہرست (تاریخ/وقت/ملزم/قسم)
    await _renderList(area, cid);
  }
  window.openNaqsha = openNaqsha;
  // براہِ راست ایڈیٹر (فہرست کے بغیر) — id نہ ہو تو فعال، وہ بھی نہ ہو تو نیا
  async function openNaqshaEditor(caseId, id) {
    const cid = caseId || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
      || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
    if (typeof _dioOpenDocTab === 'function') { try { _dioOpenDocTab('crime_scene'); } catch (_) { /* ضمنی */ } }
    await _loadCase(cid); await _load();
    if (id && _naqData.sketches.some(x => x.id === id)) _naqData.activeId = id;
    await _renderNaqsha(null, null, true);
  }
  window.openNaqshaEditor = openNaqshaEditor;
  window._naqGetCanvas = () => _naqCanvas;

  // ══ بنام (ملزمان) ══════════════════════════════════════════════════
  function _chosenBanam() {
    const a = _active(); const h = (a && a.header) || {};
    return Array.isArray(h.banam) ? h.banam : _naqAccList.map(x => x.name);
  }
  // اصول: ایک ملزم → کوئی نمبر نہیں؛ ایک سے زائد → تمام کو نمبر (1،2،3… انگریزی)
  function _banamHTML() {
    const names = _chosenBanam().filter(Boolean);
    if (!names.length) return '<div class="naq-acc" style="color:#999;">—</div>';
    if (names.length === 1) return `<div class="naq-acc">${E(names[0])}</div>`;
    return names.map((n, i) =>
      `<div class="naq-acc"><span class="naq-accno">${i + 1}.</span> ${E(n)}</div>`
    ).join('');
  }
  function _naqRebuildBanam() { const w = document.getElementById('naq-banam-list'); if (w) w.innerHTML = _banamHTML(); }
  window._naqAccPicker = function (ev) {
    ev && ev.preventDefault && ev.preventDefault();
    document.getElementById('naq-acc-menu') && document.getElementById('naq-acc-menu').remove();
    if (!_naqAccList.length) { TOAST('اس مقدمہ میں کوئی ملزم درج نہیں (یا آف لائن)', 'info'); return; }
    const chosen = new Set(_chosenBanam());
    const box = document.createElement('div'); box.id = 'naq-acc-menu';
    box.style.cssText = 'position:fixed;z-index:99999;background:#fff;border:1px solid #0369a1;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.28);direction:rtl;width:280px;max-width:92vw;max-height:min(60vh,360px);display:flex;flex-direction:column;overflow:hidden;font-family:\'Jameel Noori Nastaleeq\';';
    box.innerHTML =
      '<div style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-weight:700;color:#0369a1;background:#f8fafc;font-size:9.75pt;">بنام — ملزمان منتخب کریں</div>' +
      '<div style="flex:1;overflow:auto;padding:4px 8px;">' +
      _naqAccList.map(a => `<label style="display:flex;align-items:center;gap:8px;padding:7px 6px;cursor:pointer;font-size:9.75pt;border-bottom:1px solid #f1f5f9;"><input type="checkbox" ${chosen.has(a.name) ? 'checked' : ''} value="${E(a.name)}"> <span>${E(a.name)}</span></label>`).join('') +
      '</div>' +
      '<div style="display:flex;gap:6px;padding:8px;border-top:1px solid #e5e7eb;background:#f8fafc;">' +
      '<button id="naq-acc-ok" style="flex:1;padding:8px;border:none;border-radius:6px;background:#0369a1;color:#fff;font-weight:700;cursor:pointer;">✔ شامل کریں</button>' +
      '<button id="naq-acc-x" style="padding:8px 12px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;cursor:pointer;">بند</button></div>';
    document.body.appendChild(box);
    const r = (ev.currentTarget || ev.target).getBoundingClientRect();
    box.style.top = Math.min(r.bottom + 4, window.innerHeight - box.offsetHeight - 8) + 'px';
    box.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
    box.querySelector('#naq-acc-x').onclick = () => box.remove();
    box.querySelector('#naq-acc-ok').onclick = () => {
      const picked = Array.from(box.querySelectorAll('input:checked')).map(c => c.value);
      const a = _active(); if (a) { a.header = a.header || {}; a.header.banam = picked; }
      _naqRebuildBanam(); box.remove(); _saveSoon();
    };
  };

  // ══ امتیازی نشانات — auto-نمبر فہرست ════════════════════════════════
  const _MARK_PREFIX = (n) => 'نمبر' + n + ' سے مراد وہ مقام';
  // marks item: string (پرانا) یا {id, t} (نئے — نقشے کے نشان سے منسلک)
  function _marksHTML(list) {
    const arr = (list && list.length) ? list : [''];
    return arr.map((it, i) => {
      const t = (it && typeof it === 'object') ? (it.t || '') : (it || '');
      const id = (it && typeof it === 'object') ? (it.id || '') : '';
      return `<div class="naq-mrow"${id ? ` data-markid="${E(id)}"` : ''}><span class="naq-mno" contenteditable="false">${_MARK_PREFIX(i + 1)}</span>` +
        `<span class="naq-mtext" contenteditable="true" data-mic="true">${E(t)}</span></div>`;
    }).join('');
  }
  function _renumberMarks() {
    const rows = document.querySelectorAll('#naq-marks .naq-mrow');
    rows.forEach((row, i) => { const no = row.querySelector('.naq-mno'); if (no) no.textContent = _MARK_PREFIX(i + 1); });
  }
  window._naqMarksKey = function (e) {
    const t = e.target; if (!t.classList || !t.classList.contains('naq-mtext')) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      const row = t.closest('.naq-mrow');
      const nr = document.createElement('div'); nr.className = 'naq-mrow';
      nr.innerHTML = `<span class="naq-mno" contenteditable="false"></span><span class="naq-mtext" contenteditable="true" data-mic="true"></span>`;
      row.parentNode.insertBefore(nr, row.nextSibling);
      _renumberMarks();
      const nt = nr.querySelector('.naq-mtext'); if (nt) nt.focus();
      _saveSoon();
    } else if (e.key === 'Backspace' && !t.innerText.trim()) {
      const row0 = t.closest('.naq-mrow');
      // نقشے کے نشان سے منسلک سطر یہاں سے حذف نہ ہو — نشان مٹانے پر خود ہٹے گی
      if (row0 && row0.hasAttribute('data-markid')) { e.preventDefault(); return; }
      const rows = document.querySelectorAll('#naq-marks .naq-mrow');
      if (rows.length > 1) {
        e.preventDefault();
        const row = t.closest('.naq-mrow'); const prev = row.previousElementSibling;
        row.remove(); _renumberMarks();
        if (prev) { const p = prev.querySelector('.naq-mtext'); if (p) { p.focus();
          try { const rng = document.createRange(); rng.selectNodeContents(p); rng.collapse(false);
            const sel = getSelection(); sel.removeAllRanges(); sel.addRange(rng); } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ } } }
        _saveSoon();
      }
    }
  };

  // ══ فاصلہ جات / پیمائش (تخمیناً) — آزاد متن سطریں ═══════════════════════
  function _distHTML(list) {
    const arr = (list && list.length) ? list : [''];
    return arr.map((t) =>
      `<div class="naq-drow"><span class="naq-dno" contenteditable="false">•</span>` +
      `<span class="naq-dtext" contenteditable="true" data-mic="true" data-ph="مثلاً: نمبر1 تا نمبر2 ≈ 15 فٹ">${E(t || '')}</span></div>`
    ).join('');
  }
  window._naqDistKey = function (e) {
    const t = e.target; if (!t.classList || !t.classList.contains('naq-dtext')) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      const row = t.closest('.naq-drow');
      const nr = document.createElement('div'); nr.className = 'naq-drow';
      nr.innerHTML = `<span class="naq-dno" contenteditable="false">•</span><span class="naq-dtext" contenteditable="true" data-mic="true" data-ph="مثلاً: نمبر1 تا نمبر2 ≈ 15 فٹ"></span>`;
      row.parentNode.insertBefore(nr, row.nextSibling);
      const nt = nr.querySelector('.naq-dtext'); if (nt) nt.focus();
      _saveSoon();
    } else if (e.key === 'Backspace' && !t.innerText.trim()) {
      const rows = document.querySelectorAll('#naq-dist .naq-drow');
      if (rows.length > 1) {
        e.preventDefault();
        const row = t.closest('.naq-drow'); const prev = row.previousElementSibling;
        row.remove();
        if (prev) { const p = prev.querySelector('.naq-dtext'); if (p) { p.focus();
          try { const rng = document.createRange(); rng.selectNodeContents(p); rng.collapse(false);
            const sel = getSelection(); sel.removeAllRanges(); sel.addRange(rng); } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ } } }
        _saveSoon();
      }
    }
  };


  // v553: دستاویز کا اندرونی خاکہ — ایڈیٹر اور فہرست سے براہِ راست پرنٹ دونوں یہی
  //   (ایک ہی ماخذ: جو ایڈیٹر میں نظر آتا ہے وہی فہرست کا پرنٹ دیتا ہے)
  function _docInner(a, hv, io, fabricOk) {
    return `

          <div class="naq-hrow naq-edge naq-row1">
            <span><span class="naq-lbl">تھانہ</span> <span id="naq-h-thana" class="naq-f" contenteditable="true">${E(hv.thana)}</span></span>
            <span class="naq-zila"><span class="naq-lbl">ضلع</span> <span id="naq-h-zila" class="naq-f" contenteditable="true">${E(hv.zila)}</span></span>
          </div>
          <div class="naq-hrow naq-l2">
            <span class="naq-lbl">سرکار بذریعہ</span>
            <span id="naq-h-sarkar" class="naq-f naq-f-grow" contenteditable="true">${E(hv.sarkar)}</span>
          </div>
          <div class="naq-hrow naq-firrow naq-l3">
            <span class="naq-seg"><span class="naq-lbl">مقدمہ نمبر</span> <span id="naq-h-muqadma" class="naq-f" contenteditable="true">${E(hv.muqadma)}</span></span>
            <span class="naq-seg"><span class="naq-lbl">مورخہ</span> <span id="naq-h-morkha" class="naq-f" contenteditable="true">${E(hv.morkha)}</span></span>
            <span class="naq-seg"><span class="naq-lbl">بجرم</span> <span id="naq-h-bajurm" class="naq-f" contenteditable="true">${E(hv.bajurm)}</span></span>
            <span class="naq-seg"><span class="naq-lbl">تھانہ</span> <span id="naq-h-thana2" class="naq-f" contenteditable="true">${E(hv.thana2 || hv.thana)}</span></span>
          </div>
          <div class="naq-banam">
            <span class="naq-banam-lbl"><button class="naq-caret no-print" title="ملزمان منتخب کریں" onclick="window._naqAccPicker&&_naqAccPicker(event)">▾</button> بنام</span>
            <span id="naq-banam-list" class="naq-banam-list">${_banamHTMLFor(a)}</span>
          </div>

          <div class="naq-title">
            ${_compassSVG()}
            <span class="naq-title-t">نقشہ موقع نظری بلاسکیل</span>
            <select id="naq-type" class="naq-type" onchange="window._naqType&&_naqType(this.value)">
              <option value="waqia" ${a.type === 'waqia' ? 'selected' : ''}>جائے وقوعہ</option>
              <option value="baramad" ${a.type === 'baramad' ? 'selected' : ''}>جائے برامدگی</option>
            </select>
          </div>
          <div class="naq-bahad"><span class="naq-lbl">بحد۔</span> <span class="naq-paren">(</span><span id="naq-h-bahad" class="naq-f naq-f-grow" contenteditable="true">${E(hv.bahad)}</span><span class="naq-paren">)</span></div>

          <div class="naq-map" id="naq-map" style="${a.mapH ? 'height:' + a.mapH + 'px;' : ''}">
            ${fabricOk ? `<canvas id="naq-canvas"></canvas><div class="naq-map-resize no-print" title="کھینچ کر بڑا/چھوٹا کریں" onmousedown="window._naqResizeStart&&_naqResizeStart(event)" ontouchstart="window._naqResizeStart&&_naqResizeStart(event)"></div>` : `<div class="naq-nofab">ڈرائنگ لائبریری لوڈ نہیں ہو سکی — ایک بار انٹرنیٹ سے جوڑ کر دوبارہ کھولیں۔</div>`}
          </div>

          <div class="naq-marks-l naq-sp">امتیازی نشانات:</div>
          <div id="naq-marks" class="naq-sp-sm" onkeydown="window._naqMarksKey&&_naqMarksKey(event)" oninput="window._naqDirty&&_naqDirty()">${_marksHTML(a.marks)}</div>

          <!-- «فاصلہ جات (تخمیناً)» کا حصہ صارف کی ہدایت پر ہٹا دیا گیا
               (12 اکتوبر 2026)۔ متعلقہ معاون کوڈ (_distHTML / _naqDistKey /
               چھپائی کی صفائی) جان بوجھ کر چھوڑا گیا ہے تاکہ پرانے محفوظ
               نقشوں کا ڈیٹا ضائع نہ ہو — وہ صرف دکھایا نہیں جاتا۔ واپس لانا
               ہو تو یہی دو سطریں بحال کر دیں۔ -->

          <div class="naq-io">
            <div id="naq-io-nm" class="naq-io-nm" contenteditable="true">${E(io)}</div>
            <div id="naq-io-dt" class="naq-io-dt" contenteditable="true">${E(a.date || _regDate())}</div>
          </div>

`;
  }
  function _hvFor(a) { return Object.assign({}, _auto(), (a && a.header) || {}); }
  function _ioFor(a) {
    let io = (a && a.io) || ((typeof getIOSignLine === 'function') ? (getIOSignLine() || '') : '');
    if (!io) {
      const o = _naqOff || {};
      io = [o.full_name || o.name, o.rank || o.designation, (o.station ? 'تھانہ ' + o.station : '')].map(x => (x || '').trim()).filter(Boolean).join(' ');
    }
    return io;
  }
  function _banamFor(a) {
    const h = (a && a.header) || {};
    return (Array.isArray(h.banam) ? h.banam : _naqAccList.map(x => x.name)).filter(Boolean);
  }
  function _banamHTMLFor(a) {
    const names = _banamFor(a);
    if (!names.length) return '<div class="naq-acc" style="color:#999;">—</div>';
    if (names.length === 1) return `<div class="naq-acc">${E(names[0])}</div>`;
    return names.map((n, i) => `<div class="naq-acc"><span class="naq-accno">${i + 1}.</span> ${E(n)}</div>`).join('');
  }

  // ══ Render ═════════════════════════════════════════════════════════
  async function _renderNaqsha(container, forceId, skipLoad) {
    container = container || document.getElementById('workspace-editor-area')
      || document.getElementById('workspace-tab-content') || document.getElementById('page-content');
    if (!container) return;
    container.innerHTML = `<div style="padding:40px;text-align:center;direction:rtl;color:var(--text-muted);"><div style="font-size:30pt;">🗺️</div><div style="font-size:14pt;margin-top:8px;">نقشہ موقع کھل رہا ہے…</div></div>`;

    // v553: فہرست سے آئیں تو data پہلے سے موجود — دوبارہ سرور سے نہ پڑھو
    //   (پرانی سرور کاپی تازہ مقامی ترمیم کو دبا سکتی تھی)
    if (!skipLoad || !_naqData || !Array.isArray(_naqData.sketches)) { await _loadCase(forceId); await _load(); }
    if (!_naqData.sketches.length) {
      const s0 = _newSketch('waqia'); _naqData.sketches.push(s0); _naqData.activeId = s0.id; _persistLocal();
    }
    _naqReady = new Promise(r => { _naqReadyR = r; });
    let fabricOk = true; try { await _ensureFabric(); } catch (_) { fabricOk = false; }
    try { document.body.classList.add('workspace-mode'); window._inWorkspace = true; } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }

    const a = _active();
    const paper = a.paper || 'legal';
    const hv = Object.assign({}, _auto(), a.header || {});
    let io = (a && a.io) || ((typeof getIOSignLine === 'function') ? (getIOSignLine() || '') : '');
    if (!io) {   // fallback — موجودہ افسر سے (نام + عہدہ + تھانہ)
      const o = _naqOff || {};
      io = [o.full_name || o.name, o.rank || o.designation, (o.station ? 'تھانہ ' + o.station : '')].map(x => (x || '').trim()).filter(Boolean).join(' ');
    }

    container.innerHTML = `
    <style>${_css()}</style>
    <div class="naq-wrap" dir="rtl">

      <div class="naq-topwrap no-print" id="naq-topwrap">
       <div class="naq-toolbar">
        <div class="naq-tools">
          <button class="naq-tb naq-chiptog" id="naq-tolist" title="اس مقدمے کے تمام محفوظ نقشے" onclick="window._naqBackToList&&_naqBackToList()">← فہرست</button>
          <!-- v553: لیگل/A4 کا انتخاب یہاں سے ہٹا — پرنٹ کے وقت پوچھا جاتا ہے -->
          ${fabricOk ? `
          <span class="naq-sep"></span>
          <button class="naq-tb naq-tool on" data-tool="select" title="منتخب / حرکت" onclick="window._naqPickTool&&_naqPickTool('select')">↖</button>
          <button class="naq-tb naq-tool" data-tool="pen" title="قلم (آزاد ڈرائنگ)" onclick="window._naqPickTool&&_naqPickTool('pen')">✏️</button>
          <button class="naq-tb naq-tool" data-tool="line" title="لکیر" onclick="window._naqPickTool&&_naqPickTool('line')">╱</button>
          <button class="naq-tb naq-tool" data-tool="arrow" title="تیر" onclick="window._naqPickTool&&_naqPickTool('arrow')">➜</button>
          <button class="naq-tb naq-tool" data-tool="rect" title="مستطیل" onclick="window._naqPickTool&&_naqPickTool('rect')">▭</button>
          <button class="naq-tb naq-tool" data-tool="ellipse" title="دائرہ / بیضوی" onclick="window._naqPickTool&&_naqPickTool('ellipse')">◯</button>
          <button class="naq-tb" id="naq-straight" title="سیدھی لکیر — MS Word کی طرح Ctrl (یا Shift) دبا کر کھینچیں تو لکیر سیدھی (0°/45°/90°) رہتی ہے؛ موبائل پر یہ بٹن دبائیں" onclick="window._naqToggleStraight&&_naqToggleStraight()">📏</button>
          <button class="naq-tb" title="پولیس علامات (لاش، اسلحہ، گاڑی…)" onclick="window._naqToggleSyms&&_naqToggleSyms(event)">🚔</button>
          <button class="naq-tb" title="امتیازی نشان لگائیں (①②③ — نیچے فہرست خود بنے)" onclick="window._naqAddMark&&_naqAddMark()">①</button>
          <input type="color" class="naq-color" value="#111111" title="لکیر کا رنگ" onchange="window._naqSetColor&&_naqSetColor(this.value)">
          <select class="naq-sel" title="لکیر کی موٹائی" onchange="window._naqSetWidth&&_naqSetWidth(this.value)">
            ${[1, 2, 3, 4, 6, 8].map(w => `<option value="${w}" ${w === 2 ? 'selected' : ''}>${w}px</option>`).join('')}
          </select>
          <span class="naq-sep"></span>
          <button class="naq-tb" title="تصویر داخل کریں" onclick="window._naqInsertImg&&_naqInsertImg()">🖼️</button>
          <button class="naq-tb" title="تصویر بدلیں" onclick="window._naqReplaceImg&&_naqReplaceImg()">🔁</button>
          <button class="naq-tb" title="متن کا خانہ" onclick="window._naqAddText&&_naqAddText()">🅣</button>
          <span class="naq-sep"></span>
          <button class="naq-tb" title="بائیں 90°" onclick="window._naqRotL&&_naqRotL()">⟲</button>
          <button class="naq-tb" title="دائیں 90°" onclick="window._naqRotR&&_naqRotR()">⟳</button>
          <button class="naq-tb" title="افقی پلٹ" onclick="window._naqFlipH&&_naqFlipH()">⇋</button>
          <button class="naq-tb" title="عمودی پلٹ" onclick="window._naqFlipV&&_naqFlipV()">⇅</button>
          <button class="naq-tb" title="کراپ" onclick="window._naqCropStart&&_naqCropStart()">✂️</button>
          <span class="naq-sep"></span>
          <button class="naq-tb" title="کاپی" onclick="window._naqCopy&&_naqCopy()">⧉</button>
          <button class="naq-tb" title="چسپاں" onclick="window._naqPaste&&_naqPaste()">📋</button>
          <button class="naq-tb" title="حذف" onclick="window._naqDelete&&_naqDelete()">🗑️</button>
          <button class="naq-tb" title="آگے" onclick="window._naqForward&&_naqForward()">⬆️</button>
          <button class="naq-tb" title="پیچھے" onclick="window._naqBackward&&_naqBackward()">⬇️</button>
          <select class="naq-sel" title="متن سائز pt" onchange="window._naqSetFont&&_naqSetFont(this.value)">
            ${[10, 12, 14, 16, 18, 20, 24, 28].map(p => `<option value="${p}" ${p === 16 ? 'selected' : ''}>${p}pt</option>`).join('')}
          </select>
          <span class="naq-sep"></span>
          <button class="naq-tb" id="naq-undo" title="واپس (Ctrl+Z)" onclick="window._naqUndo&&_naqUndo()">↶</button>
          <button class="naq-tb" id="naq-redo" title="دوبارہ (Ctrl+Y)" onclick="window._naqRedo&&_naqRedo()">↷</button>
          <span class="naq-sep"></span>
          <button class="naq-tb naq-tool" title="پین (کھینچ کر گھمائیں)" data-tool="pan" onclick="window._naqPickTool&&_naqPickTool('pan')">✋</button>
          <button class="naq-tb" title="زوم اِن" onclick="window._naqZoomIn&&_naqZoomIn()">＋</button>
          <button class="naq-tb" title="زوم آؤٹ" onclick="window._naqZoomOut&&_naqZoomOut()">－</button>
          <button class="naq-tb" title="زوم ری سیٹ (1:1)" onclick="window._naqZoomReset&&_naqZoomReset()">1:1</button>
          <input type="file" id="naq-file" accept="image/*" style="display:none" onchange="window._naqFilePicked&&_naqFilePicked(event)">
          ` : ''}
          <span class="naq-sep"></span>
          <label class="naq-hctl" title="نقشے کی جگہ (عنوان اور امتیازی نشانات کے درمیان) — انچ میں">📐 <input id="naq-maph" type="number" step="0.1" min="1.5" max="14" inputmode="decimal" onchange="window._naqSetMapH&&_naqSetMapH(this.value)"> انچ</label>
          <span class="naq-remain" id="naq-remain" title="صفحہ 1 میں باقی جگہ"></span>
          <button class="naq-tb" title="نقشے کی جگہ کو صفحے کے مطابق کریں (باقی جگہ پوری)" onclick="window._naqFitPage&&_naqFitPage()">⤓ صفحہ</button>
          <span class="naq-sep"></span>
          <button class="naq-tb naq-save" title="محفوظ" onclick="window.naqSaveNow&&naqSaveNow()">💾 محفوظ</button>
          <button class="naq-tb naq-print" title="چھپائی (Ctrl+P)" onclick="window._naqPrint&&_naqPrint()">🖨️</button>
        </div>
       </div>
      </div>

      <div class="naq-scroll">
       <div class="naq-paperwrap" id="naq-paperwrap">
        <div class="naq-ruler no-print" id="naq-ruler" aria-hidden="true"></div>
        <div class="naq-pgline no-print" id="naq-pgline" aria-hidden="true"><span>صفحہ 1 کا اختتام</span></div>
        <div id="dio-naqsha-doc" class="naq-doc naq-${paper}">
${_docInner(a, hv, io, fabricOk)}
        </div>
       </div>
      </div>
    </div>`;

    ['thana', 'zila', 'sarkar', 'muqadma', 'morkha', 'bajurm', 'thana2', 'bahad'].forEach(k => {
      const el = document.getElementById('naq-h-' + k); if (el) el.addEventListener('input', _saveSoon);
    });
    if (fabricOk) _initCanvas(a); else if (_naqReadyR) _naqReadyR();
    try { _naqWsOn(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    try { _naqRulerInit(); } catch (_) { /* ضمنی */ }
  }

  /* ══ کیس صفحے پر نقشہ موقع: ترتیب + خالی پٹی ═══════════════════════════
     حقیقی ایپ میں نقشہ موقع «پورے صفحے والے منظر» میں نہیں کھلتا بلکہ کیس کے
     صفحے کے اندر — #misal-doc-bar (واپس / مقدمہ نمبر / دستاویزات کی chips)
     کے نیچے، #workspace-tab-content میں۔ اِسی لیے پہلے کی ساری تبدیلیاں (جو
     doc-viewer کی پٹی پر تھیں) یہاں کبھی لاگو ہی نہیں ہوئیں۔
     اور #workspace-tab-content کی اونچائی cases.js میں «100vh - 220px» لکھی
     ہوئی ہے: chip پٹی (~106px) + نیچے کی پٹی (~32px) صرف 138px لیتی ہیں —
     باقی ~82px خالی رہ جاتے تھے۔ یہی وہ «خالی پٹی» تھی۔
     نقشہ کھلا ہو تو:
       1) chip پٹی بہاؤ سے باہر (fixed) — ترمیمی اوزار بالکل اوپر
       2) chip پٹی چھپی رہتی ہے؛ کرسر اوپری کنارے پر → اوزاروں کے **نیچے**
          نمودار؛ کرسر نیچے → غائب۔ موبائل پر اوپر scroll → نمودار
       3) کام کی جگہ نیچے کی پٹی تک پوری — کوئی خالی پٹی نہیں
     نقشہ بند ہوتے ہی سب کچھ پہلے جیسا (کیس کا عام صفحہ متاثر نہیں)۔ */
  function _naqWsCSS() {
    if (document.getElementById('naq-ws-style')) return;
    const st = document.createElement('style');
    st.id = 'naq-ws-style';
    st.textContent =
      'body.naq-ws #misal-doc-bar{position:fixed;z-index:70;' +
      'left:var(--naq-chip-l,0px);width:var(--naq-chip-w,100%);top:var(--naq-chip-t,0px);' +
      'box-sizing:border-box;opacity:0;visibility:hidden;pointer-events:none;transform:translateY(-6px);' +
      'transition:opacity .15s ease,transform .15s ease,visibility 0s linear .15s;' +
      'box-shadow:0 8px 20px rgba(0,0,0,.18);}' +
      'body.naq-ws.naq-chips-on #misal-doc-bar{opacity:1;visibility:visible;pointer-events:auto;transform:none;' +
      'transition:opacity .15s ease,transform .15s ease;}' +
      '@media print{body.naq-ws #misal-doc-bar{display:none !important;}}';
    document.head.appendChild(st);
  }

  let _naqWsObs = null, _naqWsT = null, _naqWsLastY = null;

  function _naqWsFit() {
    // کام کی جگہ کو نیچے کی پٹی تک پورا کرو
    const tc = document.getElementById('workspace-tab-content');
    if (!tc || !document.body.classList.contains('naq-ws')) return;
    if (tc.dataset.naqH === undefined) tc.dataset.naqH = tc.style.height || '';
    const top = Math.max(0, tc.getBoundingClientRect().top);
    const bb = document.querySelector('.bottombar');
    let neeche = 0;
    if (bb) { const cs = getComputedStyle(bb); if (cs.display !== 'none' && cs.visibility !== 'hidden') neeche = bb.offsetHeight || 0; }
    tc.style.height = Math.max(200, Math.floor(window.innerHeight - top - neeche)) + 'px';
  }

  function _naqWsPlace() {
    // chip پٹی کی جگہ: ترمیمی اوزاروں کے ٹھیک نیچے، صفحے کی چوڑائی میں
    const tb = document.getElementById('naq-topwrap');
    const pc = document.getElementById('page-content') || document.body;
    if (!tb) return;
    const t = tb.getBoundingClientRect(), r = pc.getBoundingClientRect();
    const bs = document.body.style;
    bs.setProperty('--naq-chip-t', Math.round(t.bottom) + 'px');
    bs.setProperty('--naq-chip-l', Math.round(r.left) + 'px');
    bs.setProperty('--naq-chip-w', Math.round(r.width) + 'px');
  }

  function _naqChips(on) {
    const b = document.body;
    if (!b.classList.contains('naq-ws')) return;
    if (on) { _naqWsPlace(); b.classList.add('naq-chips-on'); }
    else b.classList.remove('naq-chips-on');
  }
  window._naqChips = _naqChips;

  function _naqWsOff() {
    const b = document.body;
    b.classList.remove('naq-ws', 'naq-chips-on');
    const tc = document.getElementById('workspace-tab-content');
    if (tc && tc.dataset.naqH !== undefined) { tc.style.height = tc.dataset.naqH; delete tc.dataset.naqH; }
    if (_naqWsObs) { try { _naqWsObs.disconnect(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } _naqWsObs = null; }
  }

  function _naqWsOn() {
    // صرف کیس کے صفحے والی صورت — پورے صفحے والے منظر میں doc-viewer خود سنبھالتا ہے
    if (!document.getElementById('misal-doc-bar') || document.getElementById('dio-docview')) { _naqWsOff(); return; }
    _naqWsCSS();
    document.body.classList.add('naq-ws');
    document.body.classList.remove('naq-chips-on');
    _naqWsFit();
    requestAnimationFrame(() => { _naqWsFit(); requestAnimationFrame(_naqWsFit); });

    // نقشہ بند ہوا (دوسری دستاویز / دوسرا صفحہ) → سب بحال
    if (_naqWsObs) { try { _naqWsObs.disconnect(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } }
    _naqWsObs = new MutationObserver(() => { if (!document.querySelector('.naq-wrap')) _naqWsOff(); });
    ['page-content', 'workspace-tab-content'].forEach(id => {
      const el = document.getElementById(id);
      if (el) _naqWsObs.observe(el, { childList: true });
    });

    // موبائل: اوپر scroll → chips، نیچے → غائب
    const sc = document.querySelector('.naq-scroll');
    if (sc && !sc._naqWsBound) {
      sc._naqWsBound = true; _naqWsLastY = sc.scrollTop;
      sc.addEventListener('scroll', () => {
        const y = sc.scrollTop, d = y - (_naqWsLastY == null ? y : _naqWsLastY);
        if (Math.abs(d) < 8) return;
        _naqWsLastY = y;
        _naqChips(d < 0 && y > 0);
      }, { passive: true });
    }

    // ڈیسک ٹاپ: کرسر اوپری کنارے پر → chips؛ نیچے → غائب (فی فریم ایک بار)
    if (!window._naqWsMoveBound) {
      window._naqWsMoveBound = true;
      let pend = false, y = 0;
      const kaam = () => {
        pend = false;
        const b = document.body;
        if (!b.classList.contains('naq-ws')) return;
        const on = b.classList.contains('naq-chips-on');
        if (y <= 10) { clearTimeout(_naqWsT); if (!on) _naqChips(true); return; }
        if (!on) return;
        const bar = document.getElementById('misal-doc-bar');
        const neeche = bar ? bar.getBoundingClientRect().bottom : 0;
        if (y > neeche + 24) {
          clearTimeout(_naqWsT);
          _naqWsT = setTimeout(() => _naqChips(false), 250);
        } else clearTimeout(_naqWsT);
      };
      document.addEventListener('mousemove', (e) => {
        y = e.clientY;
        const b = document.body;
        if (!b.classList.contains('naq-ws')) return;                       // نقشہ کھلا نہیں
        if (y > 260 && !b.classList.contains('naq-chips-on')) return;      // سستا پہرا
        if (pend) return; pend = true; requestAnimationFrame(kaam);
      }, { passive: true });
      window.addEventListener('resize', () => { _naqWsFit(); if (document.body.classList.contains('naq-chips-on')) _naqWsPlace(); });
    }
  }
  window._naqWsOn = _naqWsOn;
  window._naqWsOff = _naqWsOff;

  window._renderNaqsha = _renderNaqsha;
  window._naqDirty = _saveSoon;
  window._naqType = function () { _saveSoon(); _refreshChips(); };
  window._naqSetPaper = function (v) { const a = _active(); if (a) a.paper = v; _snapshot(); _persistLocal(); _renderNaqsha(); };
  window._naqToggleBar = function () { const w = document.getElementById('naq-topwrap'); if (w) w.classList.toggle('show'); };
  // چِپ بار (محفوظ نقشے) دکھائیں/چھپائیں
  window._naqToggleChips = function () {
    const s = document.getElementById('naq-chipstrip'); const b = document.getElementById('naq-chiptog');
    if (!s) return; const on = s.classList.toggle('show');
    if (b) b.innerHTML = on ? '🗂️ نقشے ▴' : '🗂️ نقشے ▾';
  };


  // ══ Compass — E-W (افقی) عنوان کی سیدھ میں (y=48)، N-S لمبا اسی پر fixed؛
  //   الفاظ arrow heads سے فاصلے پر ════════════════════════════════════
  function _compassSVG() {
    const F = "font-family:'Jameel Noori Nastaleeq'";
    // E-W افقی lline y=62 (عنوان کی سیدھ)؛ N-S عمودی لمبا؛ الفاظ arrow heads سے صاف فاصلے پر (middle anchor)
    // N-S عمودی وہی؛ E-W افقی تھوڑا نیچے (y=78)
    return `<svg class="naq-compass" viewBox="0 0 150 190" aria-label="سمت نما">
      <line x1="75" y1="46" x2="75" y2="170" stroke="#111" stroke-width="1.8"/>
      <polygon points="75,38 69,52 81,52" fill="#111"/>
      <polygon points="75,178 69,164 81,164" fill="#111"/>
      <line x1="47" y1="78" x2="103" y2="78" stroke="#111" stroke-width="1.8"/>
      <polygon points="110,78 98,72 98,84" fill="#111"/>
      <polygon points="40,78 52,72 52,84" fill="#111"/>
      <text x="75"  y="30"  text-anchor="middle" font-size="9.75pt" style="${F}">شمال</text>
      <text x="75"  y="190" text-anchor="middle" font-size="9.75pt" style="${F}">جنوب</text>
      <text x="128" y="83"  text-anchor="middle" font-size="9.75pt" style="${F}">مشرق</text>
      <text x="22"  y="83"  text-anchor="middle" font-size="9.75pt" style="${F}">مغرب</text>
    </svg>`;
  }

  // ══ نقشہ ایریا — کھینچ کر بڑا/چھوٹا (expandable) ════════════════════
  window._naqResizeStart = function (ev) {
    ev.preventDefault();
    const map = document.getElementById('naq-map'); if (!map) return;
    const startY = (ev.touches ? ev.touches[0].clientY : ev.clientY);
    const startH = map.clientHeight;
    const move = (e) => {
      const y = (e.touches ? e.touches[0].clientY : e.clientY);
      const h = Math.max(140, Math.min(1400, startH + (y - startY)));
      map.style.height = h + 'px';
      if (_naqCanvas) { try { _naqCanvas.setHeight(h); _naqCanvas.renderAll(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } }
      _naqRulerUpdate();
    };
    const up = () => {
      document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
      document.removeEventListener('touchmove', move); document.removeEventListener('touchend', up);
      _saveSoon();
    };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    document.addEventListener('touchmove', move, { passive: false }); document.addEventListener('touchend', up);
  };

  /* ══ v553: نقشے کی جگہ + پیمانہ (ruler) ══════════════════════════════════
     افسر کا قاعدہ: «نقشہ موقع کی سرخی اور امتیازی نشانات کی سرخی کے درمیان والی
     جگہ قابلِ ترمیم ہو، اور ساتھ پیمانہ ہو جو دکھائے کہ کتنا فارم باقی ہے، تاکہ
     ضرورت کے مطابق نقشہ ایڈجسٹ کیا جا سکے۔»
       • 📐 خانہ: نقشے کی جگہ انچ میں لکھ کر (یا نیچے کا کنارہ کھینچ کر) بدلیں
       • «صفحہ 1 میں باقی» — ہر تبدیلی پر خود حساب
       • ⤓ صفحہ: باقی جگہ نقشے کو دے دو (صفحہ بالکل بھر جائے، دوسرا نہ بنے)
       • کاغذ کے ساتھ عمودی پیمانہ (انچ) + صفحہ 1 کے اختتام کی لکیر (چھپائی میں نہیں) */
  const _PAGE_IN = { legal: 13, a4: 11.69 };      // سسٹم کا لیگل = 8.5×13
  function _naqPaperOf(a) { return (a && a.paper === 'a4') ? 'a4' : 'legal'; }
  function _naqPageH(a) { return _PAGE_IN[_naqPaperOf(a)] * 96; }
  function _naqRulerInit() {
    const doc = document.getElementById('dio-naqsha-doc'); if (!doc) return;
    if (window.ResizeObserver) {
      try { if (window._naqRO) window._naqRO.disconnect(); } catch (_) { /* ضمنی */ }
      window._naqRO = new ResizeObserver(() => _naqRulerUpdate());
      window._naqRO.observe(doc);
    }
    _naqRulerUpdate();
  }
  function _naqRulerUpdate() {
    const doc = document.getElementById('dio-naqsha-doc'); if (!doc) return;
    const a = _active();
    const pageH = _naqPageH(a), docH = doc.offsetHeight || 0;
    const ruler = document.getElementById('naq-ruler');
    if (ruler) {
      const n = Math.max(Math.ceil(pageH / 96), Math.ceil(docH / 96)) + 1;
      if (ruler.getAttribute('data-n') !== String(n)) {
        let h = '';
        for (let i = 1; i <= n; i++) h += '<b style="top:' + (i * 96) + 'px">' + i + '</b>';
        ruler.innerHTML = h; ruler.setAttribute('data-n', String(n));
      }
      ruler.style.height = Math.max(docH, pageH) + 'px';
    }
    const pl = document.getElementById('naq-pgline');
    if (pl) { pl.style.top = pageH + 'px'; pl.style.display = ''; }
    const rem = (pageH - docH) / 96;
    const el = document.getElementById('naq-remain');
    if (el) {
      el.classList.toggle('over', rem < -0.005);
      el.textContent = rem >= -0.005 ? ('صفحہ 1 میں باقی: ' + Math.max(0, rem).toFixed(2) + ' انچ')
        : ('⚠ صفحے سے ' + (-rem).toFixed(2) + ' انچ زیادہ');
    }
    const inp = document.getElementById('naq-maph');
    const map = document.getElementById('naq-map');
    if (inp && map && document.activeElement !== inp) inp.value = (map.clientHeight / 96).toFixed(2);
  }
  window._naqRulerUpdate = _naqRulerUpdate;
  function _naqApplyMapH(hpx) {
    const map = document.getElementById('naq-map'); if (!map) return;
    const h = Math.max(140, Math.min(1400, Math.round(hpx)));
    map.style.height = h + 'px';
    if (_naqCanvas) { try { _naqCanvas.setHeight(h); _naqCanvas.renderAll(); } catch (_) { /* ضمنی */ } }
    const a = _active(); if (a) a.mapH = h;
    _naqRulerUpdate(); _saveSoon();
  }
  window._naqSetMapH = function (v) {
    const inch = parseFloat(String(v || '').replace(',', '.'));
    if (!(inch > 0)) { _naqRulerUpdate(); return; }
    _naqApplyMapH(inch * 96);
  };
  window._naqFitPage = function () {
    const doc = document.getElementById('dio-naqsha-doc'), map = document.getElementById('naq-map');
    if (!doc || !map) return;
    const rem = _naqPageH(_active()) - doc.offsetHeight;
    // 4px کی گنجائش: پرنٹ کا گول کرنا دوسرا خالی صفحہ نہ بنائے
    _naqApplyMapH(map.clientHeight + rem - 4);
    // 📐 خانہ بھی نئی ناپ دکھائے (کرسر اسی خانے میں ہو تب بھی)
    const inp = document.getElementById('naq-maph'); if (inp) inp.value = (map.clientHeight / 96).toFixed(2);
    TOAST('نقشے کی جگہ صفحہ 1 کے مطابق کر دی گئی', 'success');
  };

  // ══ Chips (محفوظ نقشے) ═════════════════════════════════════════════
  function _chipsHTML() {
    const lbl = (s) => (s.type === 'baramad' ? 'جائے برامدگی' : 'جائے وقوعہ') + ' #' + (s.serial || '');
    return _naqData.sketches.map(s =>
      `<span class="naq-chip ${s.id === _naqData.activeId ? 'on' : ''}" onclick="window._naqSwitch&&_naqSwitch('${s.id}')">${E(lbl(s))}` +
      (_naqData.sketches.length > 1 ? ` <b class="naq-x" onclick="event.stopPropagation();window._naqDel&&_naqDel('${s.id}')">✕</b>` : '') +
      `</span>`).join('') +
      `<span class="naq-chip naq-add" title="نیا نقشہ" onclick="window._naqAdd&&_naqAdd()">➕</span>`;
  }
  function _refreshChips() { const c = document.getElementById('naq-chips'); if (c) c.innerHTML = _chipsHTML(); }
  window._naqSwitch = function (id) { if (id === _naqData.activeId) return; _snapshot(); _persistLocal(); _naqData.activeId = id; _persistLocal(); _renderNaqsha(); };
  window._naqAdd = function () { _snapshot(); const s = _newSketch(_naqData.sketches.some(x => x.type === 'waqia') ? 'baramad' : 'waqia'); _naqData.sketches.push(s); _naqData.activeId = s.id; _persistLocal(); _persistCloud(); _renderNaqsha(); };
  window._naqDel = function (id) {
    if (_naqData.sketches.length <= 1) return;
    if (typeof confirm === 'function' && !confirm('یہ نقشہ حذف کریں؟')) return;
    _naqData.sketches = _naqData.sketches.filter(s => s.id !== id);
    if (_naqData.activeId === id) _naqData.activeId = _naqData.sketches[0].id;
    _persistLocal(); _persistCloud(); _renderNaqsha();
  };

  // ══ Canvas ═════════════════════════════════════════════════════════
  function _sizeCanvas() {
    const map = document.getElementById('naq-map'); if (!map || !_naqCanvas) return;
    const a = _active();
    const w = Math.max(280, map.clientWidth - 2);
    // اونچائی: محفوظ شدہ (a.mapH) ورنہ default؛ صارف کھینچ کر بدل سکتا ہے
    const h = Math.max(140, (a && a.mapH) ? a.mapH : Math.round(w * 0.6));
    _naqCanvas.setWidth(w); _naqCanvas.setHeight(h); _naqCanvas.renderAll();
    map.style.height = h + 'px';
  }
  function _initCanvas(a) {
    const el = document.getElementById('naq-canvas'); if (!el || !window.fabric) return;
    _naqCanvas = new fabric.Canvas('naq-canvas', { backgroundColor: 'transparent', preserveObjectStacking: true, selection: true });
    _naqTool = 'select'; _naqZoom = 1; _naqPanning = false; _naqDrawing = null; _naqMarkSeq = 0;
    _naqHist = []; _naqHistI = -1; _naqRestoring = false;
    _sizeCanvas();
    window.addEventListener('resize', _sizeCanvas);
    const _afterLoad = () => {
      // محفوظ نشانوں کا max seq بحال کرو، پھر فہرست ہم آہنگ
      try { _markGroups().forEach(m => { if ((m.naqMarkSeq || 0) > _naqMarkSeq) _naqMarkSeq = m.naqMarkSeq; }); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      _naqCanvas.renderAll(); _naqSyncMarks(); _histInit();
      if (_naqReadyR) { _naqReadyR(); _naqReadyR = null; }
      try { _naqRulerUpdate(); } catch (_) { /* ضمنی */ }
    };
    const _readyNow = () => { if (_naqReadyR) { _naqReadyR(); _naqReadyR = null; } };
    if (a && a.canvas) { try { _naqCanvas.loadFromJSON(a.canvas, _afterLoad); } catch (_) { _histInit(); _readyNow(); } }
    else { _histInit(); _readyNow(); }
    ['object:modified', 'object:added', 'object:removed', 'text:changed', 'path:created'].forEach(ev => _naqCanvas.on(ev, _saveSoon));
    ['object:modified', 'object:added', 'object:removed', 'text:changed', 'path:created'].forEach(ev => _naqCanvas.on(ev, _histPush));
    // نشان مٹنے پر فہرست خودکار ہم آہنگ (undo/redo restore کے دوران نہیں)
    _naqCanvas.on('object:removed', (e) => { if (_naqRestoring) return; const o = e && e.target; if (o && o.naqMark) _naqSyncMarks(); });
    const map = document.getElementById('naq-map');
    if (map) { map.addEventListener('paste', _pasteEvt); map.setAttribute('tabindex', '0'); }
    document.addEventListener('paste', _docPaste);
    // pointer handlers: crop → draw → pan (ہر ایک اپنی حالت خود چیک کرتا ہے)
    _naqCanvas.on('mouse:down', _cropDown); _naqCanvas.on('mouse:move', _cropMove); _naqCanvas.on('mouse:up', _cropUp);
    _naqCanvas.on('mouse:down', _drawDown); _naqCanvas.on('mouse:move', _drawMove); _naqCanvas.on('mouse:up', _drawUp);
    _naqCanvas.on('mouse:wheel', _wheelZoom);
    _naqCanvas.on('path:created', () => _histPush(true));   // قلم سٹروک الگ undo step
    if (!window._naqKeyBound) { document.addEventListener('keydown', _naqKey); window._naqKeyBound = true; }
    _updUndoBtns();
    // موبائل: انگلی سے ڈرائنگ + دو انگلی زوم/پین — ہر نئے کینوس پر
    try { if (window.dioMobile && dioMobile.wireNaqshaTouch) setTimeout(dioMobile.wireNaqshaTouch, 0); } catch (_) { /* ضمنی */ }
  }

  // ══ ڈرائنگ ٹولز — لکیر/تیر/مستطیل/دائرہ/قلم + رنگ/موٹائی ═══════════════
  /* ── بٹن سے ٹول منتخب کرنا — دوبارہ دبانے سے چھوٹ جاتا ہے ────────────
     پہلے ٹول بٹن «ایک طرفہ» تھے: ✋ دبانے سے pan لگ جاتا، مگر دوبارہ ✋
     دبانے سے نہیں چھوٹتا تھا۔ اب وہی بٹن دوبارہ دبانے سے واپس «منتخب /
     حرکت» (↖) پر آ جاتا ہے — یعنی ہر بٹن خود ہی on/off ہے۔
     اندرونی کالیں (مثلاً تصویر ڈالنے کے بعد) براہِ راست _naqSetTool
     استعمال کرتی ہیں، تاکہ اُن پر toggle کا اثر نہ ہو۔                   */
  window._naqPickTool = function (t) {
    if (t && t !== 'select' && _naqTool === t) { window._naqSetTool('select'); return; }
    window._naqSetTool(t);
  };

  window._naqSetTool = function (t) {
    // ٹول بدلتے ہی کراپ کی «تیار» حالت منسوخ — ورنہ اگلی کھینچ تصویر کاٹ دیتی
    if (_naqCrop && typeof _naqCropCancel === 'function') _naqCropCancel(true);
    _naqTool = t; if (!_naqCanvas) return;
    const pen = (t === 'pen');
    _naqPanning = false;
    _naqCanvas.isDrawingMode = pen && !(_naqStraightLock || _naqKeyStraight);
    if (pen) {
      try { _naqCanvas.freeDrawingBrush = new fabric.PencilBrush(_naqCanvas); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      if (_naqCanvas.freeDrawingBrush) { _naqCanvas.freeDrawingBrush.color = _naqStroke; _naqCanvas.freeDrawingBrush.width = _naqStrokeW; }
    }
    _naqCanvas.selection = (t === 'select');
    _naqCanvas.skipTargetFind = (t !== 'select');
    _naqCanvas.defaultCursor = (t === 'pan') ? 'grab' : (t === 'select' ? 'default' : 'crosshair');
    document.querySelectorAll('.naq-tool').forEach(b => b.classList.toggle('on', b.getAttribute('data-tool') === t));
    if (t !== 'select') { _naqCanvas.discardActiveObject(); }
    _naqCanvas.requestRenderAll();
  };
  window._naqSetColor = function (v) {
    _naqStroke = v || '#111111';
    if (_naqCanvas && _naqCanvas.freeDrawingBrush) _naqCanvas.freeDrawingBrush.color = _naqStroke;
    const o = _act();
    if (o) {
      if (/text/.test(o.type)) o.set('fill', _naqStroke);
      else if (o.type === 'group') o.forEachObject(x => { if (x.type === 'triangle') x.set('fill', _naqStroke); else if (x.stroke) x.set('stroke', _naqStroke); });
      else if (o.type !== 'image') o.set('stroke', _naqStroke);
      _naqCanvas.renderAll(); _saveSoon();
    }
  };
  window._naqSetWidth = function (v) {
    _naqStrokeW = Math.max(1, parseFloat(v) || 2);
    if (_naqCanvas && _naqCanvas.freeDrawingBrush) _naqCanvas.freeDrawingBrush.width = _naqStrokeW;
    const o = _act();
    if (o) {
      if (o.type === 'group') o.forEachObject(x => { if (x.stroke) x.set('strokeWidth', _naqStrokeW); });
      else if (o.type !== 'image' && !/text/.test(o.type)) o.set('strokeWidth', _naqStrokeW);
      _naqCanvas.renderAll(); _saveSoon();
    }
  };
  // تیر — لکیر + سرہ (triangle) کا گروپ
  function _makeArrow(x1, y1, x2, y2) {
    const line = new fabric.Line([x1, y1, x2, y2], { stroke: _naqStroke, strokeWidth: _naqStrokeW, selectable: false, evented: false, strokeLineCap: 'round' });
    const deg = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    const hs = Math.max(12, _naqStrokeW * 5);
    const tri = new fabric.Triangle({ left: x2, top: y2, originX: 'center', originY: 'center', angle: deg + 90, width: hs, height: hs, fill: _naqStroke, selectable: false, evented: false });
    return new fabric.Group([line, tri], { selectable: true, evented: true });
  }
  function _drawDown(opt) {
    if (_naqCrop) return;                              // کراپ حالت خود سنبھالتی ہے
    if (_naqTool === 'pan') {
      const e = opt.e; _naqPanning = true; _naqPanLast = { x: e.clientX, y: e.clientY };
      _naqCanvas.setCursor('grabbing'); return;
    }
    // قلم + Ctrl/Shift (یا 📏) = سیدھی لکیر (MS Word کی طرح)
    const tool = (_naqTool === 'pen' && _naqStraightNow(opt.e)) ? 'line' : _naqTool;
    if (tool === 'select' || tool === 'pen') return;
    _naqDrawTool = tool;
    const p = _naqCanvas.getPointer(opt.e); _naqDrawStart = { x: p.x, y: p.y };
    const s = { stroke: _naqStroke, strokeWidth: _naqStrokeW, fill: 'transparent', selectable: false, evented: false };
    if (tool === 'line' || tool === 'arrow') _naqDrawing = new fabric.Line([p.x, p.y, p.x, p.y], { stroke: _naqStroke, strokeWidth: _naqStrokeW, selectable: false, evented: false, strokeLineCap: 'round' });
    else if (tool === 'rect') _naqDrawing = new fabric.Rect(Object.assign({ left: p.x, top: p.y, width: 1, height: 1 }, s));
    else if (tool === 'ellipse') _naqDrawing = new fabric.Ellipse(Object.assign({ left: p.x, top: p.y, rx: 1, ry: 1, originX: 'left', originY: 'top' }, s));
    if (_naqDrawing) { _naqCanvas.add(_naqDrawing); _naqCanvas.renderAll(); }
  }
  // Ctrl / Shift دبا ہوا، یا 📏 بٹن چالو → سیدھا
  function _naqStraightNow(e) { return !!(_naqStraightLock || (e && (e.ctrlKey || e.shiftKey || e.metaKey))); }
  // لکیر کا دوسرا سرا قریب ترین 45° زاویے پر (لمبائی وہی)
  function _naqSnap45(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    if (!len) return { x: x2, y: y2 };
    const st = Math.PI / 4, ang = Math.round(Math.atan2(dy, dx) / st) * st;
    const r = (v) => Math.round(v * 1000) / 1000;
    return { x: r(x1 + len * Math.cos(ang)), y: r(y1 + len * Math.sin(ang)) };
  }
  window._naqSnap45 = _naqSnap45;
  window._naqToggleStraight = function () {
    _naqStraightLock = !_naqStraightLock;
    const b = document.getElementById('naq-straight'); if (b) b.classList.toggle('on', _naqStraightLock);
    _naqPenMode();
    TOAST(_naqStraightLock ? '📏 سیدھی لکیر چالو — لکیر/تیر/قلم سیدھے (0°/45°/90°)' : 'سیدھی لکیر بند', 'info');
  };
  // قلم منتخب ہو اور سیدھا حکم (Ctrl/Shift یا 📏) ہو تو آزاد ڈرائنگ عارضی بند
  function _naqPenMode() {
    if (!_naqCanvas || _naqTool !== 'pen') return;
    const straight = _naqStraightLock || _naqKeyStraight;
    if (_naqDrawing) return;                                       // کھینچنے کے دوران حالت نہ بدلے
    _naqCanvas.isDrawingMode = !straight;
    _naqCanvas.defaultCursor = 'crosshair';
  }
  function _naqStraightKeys(e) {
    if (!document.getElementById('dio-naqsha-doc')) return;
    const on = !!(e.ctrlKey || e.shiftKey || e.metaKey);
    if (on === _naqKeyStraight) return;
    _naqKeyStraight = on; _naqPenMode();
  }
  if (!window._naqStraightBound) {
    window._naqStraightBound = true;
    document.addEventListener('keydown', _naqStraightKeys, true);
    document.addEventListener('keyup', _naqStraightKeys, true);
    window.addEventListener('blur', () => { _naqKeyStraight = false; _naqPenMode(); });
  }
  function _drawMove(opt) {
    if (_naqPanning) {
      const e = opt.e, vpt = _naqCanvas.viewportTransform;
      vpt[4] += e.clientX - _naqPanLast.x; vpt[5] += e.clientY - _naqPanLast.y;
      _naqPanLast = { x: e.clientX, y: e.clientY }; _naqCanvas.requestRenderAll(); return;
    }
    if (!_naqDrawing || !_naqDrawStart) return;
    const p = _naqCanvas.getPointer(opt.e), s = _naqDrawStart, tool = _naqDrawTool || _naqTool;
    const straight = _naqStraightNow(opt.e);
    if (tool === 'line' || tool === 'arrow') {
      const q = straight ? _naqSnap45(s.x, s.y, p.x, p.y) : p;
      _naqDrawing.set({ x2: q.x, y2: q.y });
    } else if (tool === 'rect' || tool === 'ellipse') {
      // Ctrl/Shift → مربع / گول دائرہ (MS Word کی طرح)
      let w = Math.abs(p.x - s.x), h = Math.abs(p.y - s.y);
      if (straight) { const m = Math.max(w, h); w = m; h = m; }
      const L = (p.x < s.x) ? s.x - w : s.x, T = (p.y < s.y) ? s.y - h : s.y;
      if (tool === 'rect') _naqDrawing.set({ left: L, top: T, width: w, height: h });
      else _naqDrawing.set({ left: L, top: T, rx: w / 2, ry: h / 2 });
    }
    /* کارکردگی: پہلے یہاں renderAll() تھا — یہ ماؤس کی ہر حرکت پر پورا کینوس
       فوراً (synchronously) دوبارہ بناتا ہے۔ شکل کھینچتے وقت ماؤس سیکنڈ میں
       سینکڑوں بار ہلتا ہے، یعنی سینکڑوں مکمل redraw — اِسی سے لکیر/مستطیل
       کھینچنا «بھاری» محسوس ہوتا تھا۔ requestRenderAll() وہی کام کرتا ہے مگر
       فی فریم ایک بار — شکل بالکل ویسی ہی بنتی ہے، صرف روانی بہتر ہو جاتی ہے۔ */
    _naqDrawing.setCoords(); _naqCanvas.requestRenderAll();
  }
  function _drawUp() {
    if (_naqPanning) { _naqPanning = false; _naqCanvas.setCursor('grab'); return; }
    if (!_naqDrawing) return;
    const d = _naqDrawing, tool = _naqDrawTool || _naqTool; _naqDrawing = null; _naqDrawStart = null; _naqDrawTool = null;
    setTimeout(_naqPenMode, 0);
    let tiny = false;
    if (tool === 'line' || tool === 'arrow') tiny = Math.hypot((d.x2 - d.x1), (d.y2 - d.y1)) < 8;
    else if (tool === 'rect') tiny = (d.width < 6 && d.height < 6);
    else if (tool === 'ellipse') tiny = (d.rx < 4 && d.ry < 4);
    if (tiny) { _naqCanvas.remove(d); _naqCanvas.renderAll(); return; }
    if (tool === 'arrow') {
      const x1 = d.x1, y1 = d.y1, x2 = d.x2, y2 = d.y2;
      _naqCanvas.remove(d);
      const arw = _makeArrow(x1, y1, x2, y2);
      _naqCanvas.add(arw); _naqCanvas.setActiveObject(arw);
    } else {
      d.set({ selectable: true, evented: true }); d.setCoords(); _naqCanvas.setActiveObject(d);
    }
    _naqCanvas.renderAll(); _saveSoon(); _histPush(true);   // ہر شکل الگ undo step
  }

  // ══ پولیس علامات کی لائبریری (تیار symbols) ═════════════════════════
  //   ہر علامت سادہ schematic SVG — پولیس نقشے کی روایتی طرز۔ کلک پر canvas میں
  //   ڈلتی ہے، پھر عام شکل کی طرح حرکت/سائز/گھماؤ/رنگ/حذف۔
  const _S = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${inner}</svg>`;
  const _ST = 'fill="none" stroke="#111" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"';
  const _NAQ_SYMS = [
    { key: 'laash', label: 'لاش', svg: _S(`<circle cx="32" cy="12" r="7" ${_ST}/><path d="M32 19V44M32 26L18 34M32 26L46 34M32 44L24 58M32 44L40 58" ${_ST}/>`) },
    { key: 'pistol', label: 'پستول', svg: _S(`<path d="M6 18H46V26H24L20 44H9L13 26H6Z" fill="#111"/>`) },
    { key: 'rifle', label: 'بندوق', svg: _S(`<path d="M4 25H54V30H30L27 39H22L25 30H4Z" fill="#111"/><rect x="45" y="20" width="5" height="6" fill="#111"/>`) },
    { key: 'chaqu', label: 'چاقو', svg: _S(`<path d="M6 22L40 30L6 38Z" fill="#111"/><rect x="40" y="26" width="18" height="8" rx="3" fill="#111"/>`) },
    { key: 'khol', label: 'خول', svg: _S(`<path d="M24 20L32 8L40 20Z" fill="#111"/><rect x="24" y="20" width="16" height="24" fill="#111"/><rect x="23" y="44" width="18" height="6" fill="#111"/>`) },
    { key: 'khoon', label: 'خون', svg: _S(`<path d="M32 8C40 24 46 30 46 38A14 14 0 1 1 18 38C18 30 24 24 32 8Z" fill="#b3261e"/><circle cx="52" cy="18" r="3" fill="#b3261e"/><circle cx="13" cy="16" r="2.5" fill="#b3261e"/>`) },
    { key: 'car', label: 'گاڑی', svg: _S(`<rect x="12" y="8" width="40" height="48" rx="9" ${_ST}/><rect x="18" y="15" width="28" height="13" rx="3" ${_ST}/><rect x="18" y="36" width="28" height="12" rx="3" ${_ST}/>`) },
    { key: 'moto', label: 'موٹرسائیکل', svg: _S(`<circle cx="16" cy="44" r="10" ${_ST}/><circle cx="48" cy="44" r="10" ${_ST}/><path d="M16 44L30 44L38 28L48 44M30 44L34 28H44" ${_ST}/>`) },
    { key: 'door', label: 'دروازہ', svg: _S(`<path d="M20 56V12H44" ${_ST}/><path d="M44 12A32 32 0 0 1 20 56" fill="none" stroke="#111" stroke-width="1.5" stroke-dasharray="4 3"/>`) },
    { key: 'window', label: 'کھڑکی', svg: _S(`<rect x="12" y="16" width="40" height="32" ${_ST}/><path d="M32 16V48M12 32H52" fill="none" stroke="#111" stroke-width="2"/>`) },
    { key: 'stairs', label: 'سیڑھی', svg: _S(`<path d="M8 54V44H20V36H32V28H44V20H56" ${_ST}/>`) },
    { key: 'tree', label: 'درخت', svg: _S(`<circle cx="32" cy="19" r="13" ${_ST}/><path d="M32 32V58M32 44L23 38M32 42L41 36" ${_ST}/>`) },
    { key: 'charpai', label: 'چارپائی', svg: _S(`<rect x="10" y="18" width="44" height="28" rx="2" ${_ST}/><path d="M14 46V54M50 46V54M14 18V12M50 18V12" ${_ST}/><path d="M10 27H54M10 37H54M24 18V46M40 18V46" fill="none" stroke="#111" stroke-width="1.1"/>`) },
    { key: 'chair', label: 'کرسی', svg: _S(`<path d="M20 12V38H46M20 38V54M46 38V54M20 26H40" ${_ST}/>`) },
    { key: 'table', label: 'میز', svg: _S(`<path d="M8 24H56M14 24V50M50 24V50" ${_ST}/>`) },
    { key: 'well', label: 'کنواں', svg: _S(`<circle cx="32" cy="34" r="16" ${_ST}/><circle cx="32" cy="34" r="9" fill="none" stroke="#111" stroke-width="1.6"/><path d="M14 20H50" ${_ST}/>`) },
    { key: 'pole', label: 'بجلی کھمبا', svg: _S(`<path d="M32 10V56M18 18H46M22 24H42" ${_ST}/>`) },
    { key: 'north', label: 'شمال تیر', svg: _S(`<path d="M32 56V14" ${_ST}/><path d="M32 8L25 22H39Z" fill="#111"/><text x="32" y="54" text-anchor="middle" font-size="9pt" fill="#111" font-family="serif">N</text>`) },
    { key: 'house', label: 'گھر', svg: _S(`<path d="M10 30L32 12L54 30" ${_ST}/><path d="M16 30V52H48V30" ${_ST}/><rect x="28" y="40" width="10" height="12" ${_ST}/>`) },
    { key: 'wall', label: 'دیوار', svg: _S(`<rect x="8" y="20" width="48" height="24" ${_ST}/><path d="M8 32H56M24 20V32M40 20V32M16 32V44M32 32V44M48 32V44" fill="none" stroke="#111" stroke-width="1.5"/>`) },
    { key: 'road', label: 'سڑک', svg: _S(`<path d="M14 8V56M50 8V56" ${_ST}/><path d="M32 10V22M32 30V40M32 48V58" fill="none" stroke="#111" stroke-width="2" stroke-dasharray="6 5"/>`) },
    { key: 'gate', label: 'گیٹ', svg: _S(`<path d="M8 22V50M56 22V50M8 22H56M8 36H56" ${_ST}/><path d="M18 22V50M28 22V50M38 22V50M48 22V50" fill="none" stroke="#111" stroke-width="1.5"/>`) },
    { key: 'handpump', label: 'نلکہ', svg: _S(`<path d="M26 54V24H34V54M30 24V14H46" ${_ST}/><path d="M46 14V24" ${_ST}/><rect x="21" y="52" width="18" height="4" fill="#111"/>`) },
    { key: 'truck', label: 'ٹرک', svg: _S(`<rect x="6" y="20" width="30" height="24" ${_ST}/><path d="M36 26H48L56 36V44H36Z" ${_ST}/><circle cx="17" cy="48" r="5" ${_ST}/><circle cx="47" cy="48" r="5" ${_ST}/>`) },
    { key: 'bottle', label: 'بوتل', svg: _S(`<path d="M27 8H37V16C37 20 42 22 42 30V52C42 55 40 56 38 56H26C24 56 22 55 22 52V30C22 22 27 20 27 16Z" ${_ST}/>`) },
    { key: 'phone', label: 'موبائل', svg: _S(`<rect x="22" y="8" width="20" height="48" rx="4" ${_ST}/><circle cx="32" cy="50" r="2" fill="#111"/><path d="M28 13H36" fill="none" stroke="#111" stroke-width="1.6"/>`) },
    { key: 'stick', label: 'لاٹھی', svg: _S(`<path d="M12 52L52 12" fill="none" stroke="#111" stroke-width="4.5" stroke-linecap="round"/>`) },
    { key: 'footprint', label: 'نشانِ قدم', svg: _S(`<ellipse cx="28" cy="36" rx="10" ry="16" fill="#111"/><circle cx="42" cy="20" r="3" fill="#111"/><circle cx="45" cy="27" r="2.6" fill="#111"/><circle cx="45" cy="34" r="2.3" fill="#111"/>`) },
    { key: 'fire', label: 'آگ', svg: _S(`<path d="M32 8C36 20 44 22 44 36A12 12 0 0 1 20 36C20 30 24 28 26 24C28 30 30 30 32 28C32 22 30 16 32 8Z" fill="#e2571f" stroke="#b03a1a" stroke-width="1.4"/>`) },
    { key: 'pit', label: 'گڑھا', svg: _S(`<ellipse cx="32" cy="22" rx="20" ry="8" ${_ST}/><path d="M12 22C12 40 20 52 32 52C44 52 52 40 52 22" ${_ST}/>`) },
  ];
  function _symSVGscaled(sv) { return sv.replace('<svg ', '<svg style="width:34px;height:34px" '); }
  window._naqToggleSyms = function (ev) {
    ev && ev.stopPropagation && ev.stopPropagation();
    const ex = document.getElementById('naq-sym-panel');
    if (ex) { ex.remove(); return; }
    const box = document.createElement('div'); box.id = 'naq-sym-panel'; box.className = 'naq-sympanel no-print';
    box.innerHTML =
      '<div class="naq-sympanel-h"><span>🚔 پولیس علامات — کلک کر کے نقشے میں رکھیں</span>' +
      '<b class="naq-sym-x" onclick="window._naqToggleSyms&&_naqToggleSyms(event)">✕</b></div>' +
      '<div class="naq-symgrid">' +
      _NAQ_SYMS.map(s => `<button type="button" class="naq-symcell" title="${E(s.label)}" onclick="window._naqAddSymbol&&_naqAddSymbol('${s.key}')">${_symSVGscaled(s.svg)}<span>${E(s.label)}</span></button>`).join('') +
      '</div>';
    document.body.appendChild(box);
    // بٹن کے قریب رکھو
    try {
      const r = (ev.currentTarget || ev.target).getBoundingClientRect();
      box.style.top = Math.min(r.bottom + 6, window.innerHeight - box.offsetHeight - 8) + 'px';
      box.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
    } catch (_) { box.style.top = '70px'; box.style.right = '16px'; }
    setTimeout(() => document.addEventListener('mousedown', _symOutside), 0);
  };
  function _symOutside(e) {
    const box = document.getElementById('naq-sym-panel'); if (!box) { document.removeEventListener('mousedown', _symOutside); return; }
    if (!box.contains(e.target) && !(e.target.closest && e.target.closest('[onclick*="_naqToggleSyms"]'))) {
      box.remove(); document.removeEventListener('mousedown', _symOutside);
    }
  }
  window._naqAddSymbol = function (key) {
    const sym = _NAQ_SYMS.find(s => s.key === key);
    if (!sym || !_naqCanvas || !window.fabric) return;
    window._naqSetTool('select');   // ڈالنے کے بعد فوراً حرکت/سائز ممکن
    fabric.loadSVGFromString(sym.svg, (objects, options) => {
      let obj;
      try { obj = fabric.util.groupSVGElements(objects, options); } catch (_) { return; }
      const cw = _naqCanvas.getWidth(), ch = _naqCanvas.getHeight();
      const target = 76;
      const bw = obj.width || 64, bh = obj.height || 64;
      const sc = Math.min(target / bw, target / bh);
      obj.set({ left: cw / 2, top: ch / 2, originX: 'center', originY: 'center', scaleX: sc, scaleY: sc });
      obj.naqSym = key;
      _naqCanvas.add(obj); _naqCanvas.setActiveObject(obj); _naqCanvas.renderAll();
      _saveSoon(); _histPush(true);
    });
  };

  // ══ امتیازی نشان (نمبر مارکر) — نقشے پر ①②③ + نیچے فہرست خودکار ═════════
  let _naqMarkSeq = 0;
  const _mkId = () => 'mk' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  function _makeMarkGroup(n, id, seq) {
    const circle = new fabric.Circle({ radius: 14, fill: '#fff', stroke: _naqStroke, strokeWidth: 2, originX: 'center', originY: 'center' });
    const txt = new fabric.Text(String(n), { fontSize: 18, fontWeight: 'bold', fontFamily: 'Arial', fill: _naqStroke, originX: 'center', originY: 'center' });
    const g = new fabric.Group([circle, txt], { originX: 'center', originY: 'center' });
    g.naqMark = true; g.naqMarkId = id || _mkId(); g.naqMarkSeq = (seq != null) ? seq : (++_naqMarkSeq);
    if (g.naqMarkSeq > _naqMarkSeq) _naqMarkSeq = g.naqMarkSeq;
    return g;
  }
  function _markGroups() {
    if (!_naqCanvas) return [];
    return _naqCanvas.getObjects().filter(o => o.naqMark).sort((a, b) => (a.naqMarkSeq || 0) - (b.naqMarkSeq || 0));
  }
  function _setMarkNumber(g, n) {
    try {
      const t = g.getObjects && g.getObjects().find(o => o.type === 'text' || o.type === 'i-text');
      if (t && t.text !== String(n)) { t.set('text', String(n)); g.dirty = true; g.addWithUpdate && g.addWithUpdate(); }
    } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  }
  function _makeMarkRow(id) {
    const row = document.createElement('div'); row.className = 'naq-mrow'; row.setAttribute('data-markid', id);
    row.innerHTML = `<span class="naq-mno" contenteditable="false"></span><span class="naq-mtext" contenteditable="true" data-mic="true"></span>`;
    return row;
  }
  // نشان اور فہرست کی سطریں ہم آہنگ کرو (نمبر + ترتیب + orphan صفائی)
  function _naqSyncMarks() {
    const list = document.getElementById('naq-marks'); if (!list || !_naqCanvas) return;
    const marks = _markGroups();
    // orphan منسلک سطریں ہٹاؤ (جن کا نشان موجود نہیں)
    Array.from(list.querySelectorAll('.naq-mrow[data-markid]')).forEach(r => {
      if (!marks.some(m => m.naqMarkId === r.getAttribute('data-markid'))) r.remove();
    });
    // ہر نشان کی سطر یقینی بناؤ اور نشان کی ترتیب میں سب سے اوپر رکھو
    marks.forEach((m, i) => {
      let row = list.querySelector(`.naq-mrow[data-markid="${m.naqMarkId}"]`);
      if (!row) row = _makeMarkRow(m.naqMarkId);
      const ref = list.children[i] || null;
      if (row !== ref) list.insertBefore(row, ref);
    });
    // نشان موجود ہوں تو خالی غیر-منسلک سطریں ہٹا دو (چھپائی میں خالی نمبر نہ آئے)
    if (marks.length) {
      Array.from(list.querySelectorAll('.naq-mrow:not([data-markid])')).forEach(r => {
        const tx = r.querySelector('.naq-mtext');
        if (!tx || !tx.innerText.trim()) r.remove();
      });
    }
    // اگر کوئی سطر باقی نہ ہو تو ایک خالی manual سطر رہنے دو
    if (!list.querySelector('.naq-mrow')) list.innerHTML = _marksHTML(['']);
    _renumberMarks();
    marks.forEach((m, i) => _setMarkNumber(m, i + 1));
    _naqCanvas.renderAll();
  }
  window._naqAddMark = function () {
    if (!_naqCanvas || !window.fabric) return;
    window._naqSetTool('select');
    const n = _markGroups().length + 1;
    const g = _makeMarkGroup(n, _mkId());
    g.set({ left: _naqCanvas.getWidth() / 2, top: _naqCanvas.getHeight() / 2 });
    _naqCanvas.add(g); _naqCanvas.setActiveObject(g);
    _naqSyncMarks();
    // نئی سطر پر focus تاکہ افسر فوراً تفصیل لکھ سکے
    try { const r = document.querySelector(`#naq-marks .naq-mrow[data-markid="${g.naqMarkId}"] .naq-mtext`); if (r) r.focus(); } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
    _saveSoon(); _histPush(true);
  };

  // ══ Zoom / Pan ═════════════════════════════════════════════════════
  function _setZoom(z) {
    if (!_naqCanvas) return;
    z = Math.max(0.3, Math.min(4, z)); _naqZoom = z;
    const c = _naqCanvas, pt = new fabric.Point(c.getWidth() / 2, c.getHeight() / 2);
    c.zoomToPoint(pt, z); c.requestRenderAll();
  }
  window._naqZoomIn = function () { _setZoom(_naqZoom * 1.2); };
  window._naqZoomOut = function () { _setZoom(_naqZoom / 1.2); };
  window._naqZoomReset = function () {
    if (!_naqCanvas) return; _naqZoom = 1;
    _naqCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]); _naqCanvas.setZoom(1); _naqCanvas.requestRenderAll();
  };
  function _wheelZoom(opt) {
    if (!_naqCanvas) return;
    const e = opt.e; if (!(e.ctrlKey || e.metaKey)) return;   // Ctrl+wheel = زوم (ورنہ عام scroll)
    e.preventDefault(); e.stopPropagation();
    let z = _naqCanvas.getZoom() * (0.999 ** e.deltaY);
    z = Math.max(0.3, Math.min(4, z)); _naqZoom = z;
    _naqCanvas.zoomToPoint(new fabric.Point(opt.pointer.x, opt.pointer.y), z);
  }

  // ══ Undo / Redo ════════════════════════════════════════════════════
  function _histSnap() { try { return JSON.stringify(_naqCanvas.toJSON(['naqLabel', 'naqSym', 'naqMark', 'naqMarkId', 'naqMarkSeq'])); } catch (_) { return null; } }
  function _histInit() {
    if (!_naqCanvas) return;
    const j = _histSnap(); if (j == null) return;
    _naqHist = [j]; _naqHistI = 0; _updUndoBtns();
  }
  function _histCommit() {
    const j = _histSnap(); if (j == null) return;
    if (_naqHistI >= 0 && _naqHist[_naqHistI] === j) return;   // کوئی تبدیلی نہیں
    _naqHist = _naqHist.slice(0, _naqHistI + 1);
    _naqHist.push(j); _naqHistI = _naqHist.length - 1;
    if (_naqHist.length > 80) { _naqHist.shift(); _naqHistI--; }
    _updUndoBtns();
  }
  // immediate=true → فوری commit (ہر مکمل شکل/سٹروک الگ undo)؛ ورنہ debounce (متن ٹائپنگ)
  function _histPush(immediate) {
    if (_naqRestoring || !_naqCanvas) return;
    clearTimeout(_naqHistT);
    if (immediate === true) { _histCommit(); return; }
    _naqHistT = setTimeout(_histCommit, 250);
  }
  function _histRestore(json) {
    if (!_naqCanvas || json == null) return;
    _naqRestoring = true;
    _naqCanvas.loadFromJSON(json, () => {
      try { _markGroups().forEach(m => { if ((m.naqMarkSeq || 0) > _naqMarkSeq) _naqMarkSeq = m.naqMarkSeq; }); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      _naqCanvas.renderAll(); _naqRestoring = false; _naqSyncMarks(); _updUndoBtns(); _saveSoon();
    });
  }
  window._naqUndo = function () { if (_naqHistI <= 0) return; _naqHistI--; _histRestore(_naqHist[_naqHistI]); };
  window._naqRedo = function () { if (_naqHistI >= _naqHist.length - 1) return; _naqHistI++; _histRestore(_naqHist[_naqHistI]); };
  function _updUndoBtns() {
    const u = document.getElementById('naq-undo'), r = document.getElementById('naq-redo');
    if (u) u.style.opacity = (_naqHistI <= 0) ? '0.4' : '1';
    if (r) r.style.opacity = (_naqHistI >= _naqHist.length - 1) ? '0.4' : '1';
  }

  // ══ کی بورڈ — Ctrl+Z / Ctrl+Y / Delete (صرف نقشہ کھلا ہو اور متن edit نہ ہو رہا ہو) ══
  function _naqKey(e) {
    if (!document.getElementById('dio-naqsha-doc')) return;
    // Ctrl/Cmd+P — پورا صفحہ نہیں، صرف نقشہ چھپے (editing کے دوران بھی)
    if ((e.ctrlKey || e.metaKey) && (e.key || '').toLowerCase() === 'p') {
      e.preventDefault(); e.stopPropagation();
      try { window._naqPrint && _naqPrint(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      return;
    }
    const ae = document.activeElement;
    const editing = ae && (ae.isContentEditable || /^(input|textarea|select)$/i.test(ae.tagName || ''));
    const ao = _naqCanvas && _naqCanvas.getActiveObject();
    if (ao && ao.isEditing) return;                    // canvas متن edit ہو رہا ہے
    if ((e.ctrlKey || e.metaKey) && !editing) {
      const k = (e.key || '').toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); window._naqUndo(); return; }
      if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); window._naqRedo(); return; }
    }
    if ((e.key === 'Delete') && !editing && _naqCanvas && ao) {
      e.preventDefault(); _naqCanvas.remove(ao); _naqCanvas.discardActiveObject(); _naqCanvas.renderAll(); _saveSoon();
    }
    /* ── Escape — ہر حالت سے باہر نکلنے کا راستہ ──────────────────────
       پہلے کوئی راستہ نہیں تھا: ٹول منتخب ہو جاتا تھا مگر چھوڑنے کا کوئی
       طریقہ نہ تھا، اِس لیے سسٹم سے نکل کر دوبارہ لاگ اِن کرنا پڑتا تھا۔ */
    if (e.key === 'Escape' && !editing) {
      e.preventDefault();
      _naqEscape();
    }
  }

  /* ══ ہر چپکی ہوئی حالت سے باہر ═══════════════════════════════════════
     کراپ منسوخ + زیرِ تعمیر شکل ہٹاؤ + pan بند + ٹول واپس «منتخب»۔ */
  function _naqEscape() {
    let kuch = false;
    if (_naqCrop) { _naqCropCancel(true); kuch = true; }
    if (_naqDrawing) {
      try { _naqCanvas && _naqCanvas.remove(_naqDrawing); } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
      _naqDrawing = null; _naqDrawStart = null; kuch = true;
    }
    if (_naqPanning) { _naqPanning = false; kuch = true; }
    if (_naqTool !== 'select') { window._naqSetTool('select'); kuch = true; }
    if (_naqCanvas) { try { _naqCanvas.discardActiveObject(); _naqCanvas.requestRenderAll(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } }
    if (kuch) TOAST('ٹول چھوڑ دیا — اب «منتخب / حرکت» حالت میں ہیں', 'info');
  }
  window._naqEscape = _naqEscape;

  /* ══ کراپ منسوخ ══════════════════════════════════════════════════════
     پہلے منسوخی کا کوئی راستہ نہ تھا۔ کراپ «تیار» ہو جانے کے بعد اگلی
     بار کینوس پر کھینچنے سے کراپ ہی ہوتا تھا — چاہے آپ نے مستطیل یا کوئی
     اور ٹول منتخب کر لیا ہو۔ یعنی آپ سمجھتے کہ مستطیل بنا رہے ہیں، مگر
     اصل میں تصویر کٹ جاتی تھی۔ اب ٹول بدلنے یا Esc دبانے سے کراپ منسوخ۔ */
  function _naqCropCancel(chup) {
    if (!_naqCrop) return;
    try { if (_naqCrop.rect && _naqCanvas) _naqCanvas.remove(_naqCrop.rect); } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
    _naqCrop = null;
    if (_naqCanvas) {
      _naqCanvas.selection = (_naqTool === 'select');
      _naqCanvas.defaultCursor = 'default';
      try { _naqCanvas.requestRenderAll(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    }
    if (!chup) TOAST('کراپ منسوخ', 'info');
  }
  window._naqCropCancel = _naqCropCancel;

  // تصویر compress (لمبا رخ ≤1600px, JPEG ~0.82)
  function _compress(dataUrl, cb) {
    try {
      const im = new Image();
      im.onload = () => {
        const MAX = 1600; let w = im.width, h = im.height;
        if (Math.max(w, h) > MAX) { const s = MAX / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(im, 0, 0, w, h);
        try { cb(c.toDataURL('image/jpeg', 0.82)); } catch (_) { cb(dataUrl); }
      };
      im.onerror = () => cb(dataUrl);
      im.src = dataUrl;
    } catch (_) { cb(dataUrl); }
  }
  function _addImage(dataUrl) {
    _compress(dataUrl, (url) => {
      if (!window.fabric || !_naqCanvas) return;
      fabric.Image.fromURL(url, (img) => {
        const cw = _naqCanvas.getWidth(), ch = _naqCanvas.getHeight();
        const sc = Math.min(1, (cw * 0.55) / img.width, (ch * 0.55) / img.height);
        img.set({ left: cw / 2, top: ch / 2, originX: 'center', originY: 'center', scaleX: sc, scaleY: sc });
        _naqCanvas.add(img); _naqCanvas.setActiveObject(img); _naqCanvas.renderAll(); _saveSoon();
      }, { crossOrigin: 'anonymous' });
    });
  }
  window._naqInsertImg = function () { _naqReplaceMode = false; const f = document.getElementById('naq-file'); if (f) { f.value = ''; f.click(); } };
  window._naqReplaceImg = function () { const o = _act(); if (!o || o.type !== 'image') { TOAST('پہلے تصویر منتخب کریں', 'info'); return; } _naqReplaceMode = true; const f = document.getElementById('naq-file'); if (f) { f.value = ''; f.click(); } };
  window._naqFilePicked = function (ev) {
    const file = ev && ev.target && ev.target.files && ev.target.files[0]; if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      if (_naqReplaceMode) { const o = _act(); if (o && o.type === 'image') _compress(rd.result, (u) => o.setSrc(u, () => { _naqCanvas.renderAll(); _saveSoon(); }, { crossOrigin: 'anonymous' })); }
      else _addImage(rd.result);
    };
    rd.readAsDataURL(file);
  };
  function _pasteEvt(e) {
    const items = (e.clipboardData || window.clipboardData || {}).items || [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type && items[i].type.indexOf('image') === 0) {
        const f = items[i].getAsFile();
        if (f) { const rd = new FileReader(); rd.onload = () => _addImage(rd.result); rd.readAsDataURL(f); e.preventDefault(); return; }
      }
    }
  }
  function _docPaste(e) {
    if (!_naqCanvas) return;
    const ae = document.activeElement;
    if (ae && (ae.isContentEditable || /^(input|textarea)$/i.test(ae.tagName || ''))) return;
    _pasteEvt(e);
  }

  window._naqAddText = function () {
    if (!window.fabric || !_naqCanvas) return;
    const t = new fabric.IText('یہاں لکھیں', {
      left: _naqCanvas.getWidth() / 2, top: _naqCanvas.getHeight() / 2, originX: 'center', originY: 'center',
      fontFamily: "'Jameel Noori Nastaleeq'", fontSize: pt2px(16), fill: '#111',
      textAlign: 'right', direction: 'rtl', naqLabel: true, editable: true,
    });
    _naqCanvas.add(t); _naqCanvas.setActiveObject(t); t.enterEditing();
    if (t.hiddenTextarea) { try { t.hiddenTextarea.focus(); } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ } }
    _naqCanvas.renderAll(); _saveSoon();
  };
  window._naqSetFont = function (pt) {
    const o = _act(); if (!o || !/(text)/.test(o.type)) { TOAST('پہلے متن منتخب کریں', 'info'); return; }
    o.set('fontSize', pt2px(parseFloat(pt) || 16)); _naqCanvas.renderAll(); _saveSoon();
  };

  const _act = () => _naqCanvas && _naqCanvas.getActiveObject();
  window._naqRotL = function () { const o = _act(); if (!o) return; o.rotate(((o.angle || 0) - 90) % 360); _naqCanvas.renderAll(); _saveSoon(); };
  window._naqRotR = function () { const o = _act(); if (!o) return; o.rotate(((o.angle || 0) + 90) % 360); _naqCanvas.renderAll(); _saveSoon(); };
  window._naqFlipH = function () { const o = _act(); if (!o) return; o.set('flipX', !o.flipX); _naqCanvas.renderAll(); _saveSoon(); };
  window._naqFlipV = function () { const o = _act(); if (!o) return; o.set('flipY', !o.flipY); _naqCanvas.renderAll(); _saveSoon(); };
  window._naqDelete = function () { const o = _act(); if (!o || o.isEditing) return; _naqCanvas.remove(o); _naqCanvas.discardActiveObject(); _naqCanvas.renderAll(); _saveSoon(); };
  window._naqForward = function () { const o = _act(); if (!o) return; _naqCanvas.bringForward(o); _naqCanvas.renderAll(); _saveSoon(); };
  window._naqBackward = function () { const o = _act(); if (!o) return; _naqCanvas.sendBackwards(o); _naqCanvas.renderAll(); _saveSoon(); };
  window._naqCopy = function () { const o = _act(); if (!o) { TOAST('پہلے کوئی چیز منتخب کریں', 'info'); return; } o.clone((c) => { _naqClip = c; TOAST('کاپی ہو گیا', 'success'); }, ['naqLabel']); };
  window._naqPaste = function () {
    if (!_naqClip) { TOAST('پہلے کاپی کریں', 'info'); return; }
    _naqClip.clone((c) => {
      c.set({ left: (c.left || 0) + 22, top: (c.top || 0) + 22, evented: true });
      if (c.type === 'activeSelection') { c.canvas = _naqCanvas; c.forEachObject(o => _naqCanvas.add(o)); }
      else _naqCanvas.add(c);
      _naqCanvas.setActiveObject(c); _naqCanvas.renderAll(); _saveSoon();
    }, ['naqLabel']);
  };

  // Crop
  window._naqCropStart = function () {
    const o = _act(); if (!o || o.type !== 'image') { TOAST('پہلے تصویر منتخب کریں', 'info'); return; }
    _naqCrop = { img: o, rect: null, sx: 0, sy: 0 };
    _naqCanvas.discardActiveObject(); _naqCanvas.selection = false; _naqCanvas.defaultCursor = 'crosshair'; _naqCanvas.renderAll();
    TOAST('تصویر پر مستطیل کھینچیں — اسی حصے تک کراپ', 'info');
  };
  function _cropDown(opt) {
    if (!_naqCrop) return; const p = _naqCanvas.getPointer(opt.e); _naqCrop.sx = p.x; _naqCrop.sy = p.y;
    _naqCrop.rect = new fabric.Rect({ left: p.x, top: p.y, width: 1, height: 1, fill: 'rgba(37,99,235,0.15)', stroke: '#2563eb', strokeDashArray: [5, 4], strokeWidth: 1, selectable: false, evented: false });
    _naqCanvas.add(_naqCrop.rect);
  }
  function _cropMove(opt) {
    if (!_naqCrop || !_naqCrop.rect) return; const p = _naqCanvas.getPointer(opt.e);
    _naqCrop.rect.set({ left: Math.min(p.x, _naqCrop.sx), top: Math.min(p.y, _naqCrop.sy), width: Math.abs(p.x - _naqCrop.sx), height: Math.abs(p.y - _naqCrop.sy) });
    _naqCanvas.requestRenderAll();   // ہر حرکت پر مکمل redraw نہیں — فی فریم ایک بار
  }
  function _cropUp() {
    if (!_naqCrop) return; const cr = _naqCrop.rect, img = _naqCrop.img;
    _naqCanvas.selection = true; _naqCanvas.defaultCursor = 'default';
    if (cr && img && cr.width > 6 && cr.height > 6) {
      const sX = img.scaleX || 1, sY = img.scaleY || 1;
      const iw = img.width * sX, ih = img.height * sY;
      const ileft = img.left - (img.originX === 'center' ? iw / 2 : 0);
      const itop = img.top - (img.originY === 'center' ? ih / 2 : 0);
      let rx = (cr.left - ileft) / sX, ry = (cr.top - itop) / sY, rw = cr.width / sX, rh = cr.height / sY;
      const bCX = img.cropX || 0, bCY = img.cropY || 0;
      rx = Math.max(0, rx); ry = Math.max(0, ry); rw = Math.min(rw, img.width - rx); rh = Math.min(rh, img.height - ry);
      if (rw > 4 && rh > 4) {
        img.set({ cropX: bCX + rx, cropY: bCY + ry, width: rw, height: rh,
          left: cr.left + (img.originX === 'center' ? cr.width / 2 : 0), top: cr.top + (img.originY === 'center' ? cr.height / 2 : 0) });
        img.setCoords();
      }
    }
    if (cr) _naqCanvas.remove(cr); _naqCrop = null; _naqCanvas.renderAll(); _saveSoon();
  }

  // ══ Print — editor کی ہو بہو نقل (WYSIWYG) ══════════════════════════
  //  v553: (1) کاغذ کا سائز پرنٹ کے وقت پوچھا جاتا ہے (اوپر کی پٹی سے ہٹا)؛
  //        کاغذ بدلے تو نقشہ اسی نسبت سے نئی چوڑائی پر آ جاتا ہے — کچھ نہیں کٹتا۔
  //        (2) سسٹم کا «لیگل» ہر جگہ 8.5×13 انچ — نقشہ بھی وہی (پہلے CSS کا 8.5×14 تھا)۔
  //        (3) فہرست سے براہِ راست پرنٹ/ڈاؤن لوڈ — اسی خاکے (_docInner) سے۔
  function _naqCurPNG() {
    if (!_naqCanvas) return '';
    try {
      _naqCanvas.discardActiveObject();
      // زوم/پین کو نظر انداز کر کے اصل (1:1) viewport پر capture کرو
      const vpt = (_naqCanvas.viewportTransform || [1, 0, 0, 1, 0, 0]).slice();
      _naqCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]); _naqCanvas.renderAll();
      const png = _naqCanvas.toDataURL({ format: 'png', multiplier: 2 });
      _naqCanvas.setViewportTransform(vpt); _naqCanvas.renderAll();
      return png;
    } catch (_) { return ''; }
  }
  // کاغذ (DOM) + نقشے کی تصویر → چھپائی والا مکمل HTML
  function _naqPrintHTML(doc, png, paper) {
    const clone = doc.cloneNode(true);
    clone.removeAttribute('style');
    clone.classList.remove('naq-legal', 'naq-a4'); clone.classList.add('naq-' + paper);
    // canvas → img
    const cwrap = clone.querySelector('#naq-map');
    if (cwrap) {
      const cc = cwrap.querySelector('.canvas-container, #naq-canvas'); if (cc) cc.remove();
      if (png) { const img = document.createElement('img'); img.src = png; img.style.cssText = 'width:100%;height:auto;display:block;'; cwrap.appendChild(img); cwrap.style.height = 'auto'; }
    }
    // inputs → text
    clone.querySelectorAll('input').forEach(inp => { const sp = document.createElement('span'); sp.textContent = inp.value || ''; sp.className = inp.className; inp.replaceWith(sp); });
    // select (قسم) → منتخب قدر کا متن
    clone.querySelectorAll('select').forEach(sel => { const sp = document.createElement('span'); const opt = sel.options[sel.selectedIndex]; sp.textContent = opt ? opt.textContent : ''; sp.className = sel.className; sel.replaceWith(sp); });
    // no-print controls (▾ picker وغیرہ) ہٹاؤ
    clone.querySelectorAll('.no-print, .naq-caret').forEach(n => n.remove());
    // فاصلہ جات خالی ہوں تو عنوان + خانہ چھپائی سے ہٹا دو
    const dwrap = clone.querySelector('#naq-dist');
    if (dwrap) {
      Array.from(dwrap.querySelectorAll('.naq-drow')).forEach(r => {
        const tx = r.querySelector('.naq-dtext'); if (!tx || !(tx.textContent || '').trim()) r.remove();
      });
      if (!dwrap.querySelector('.naq-drow')) { const lbl = clone.querySelector('#naq-dist-l'); if (lbl) lbl.remove(); dwrap.remove(); }
    }
    clone.querySelectorAll('[contenteditable]').forEach(n => n.removeAttribute('contenteditable'));
    const size = (paper === 'a4') ? 'A4 portrait' : '8.5in 13in';
    return `<!DOCTYPE html><html dir="rtl" lang="ur"><head><meta charset="UTF-8"><title> </title>
      ${typeof dioFontHead==='function'?dioFontHead():''}
      <style>
        @page{ size:${size}; margin:0; }
        *{ -webkit-print-color-adjust:exact; print-color-adjust:exact; box-sizing:border-box; }
        html,body{ margin:0; }
        body{ direction:rtl; font-family:'Jameel Noori Nastaleeq'; color:#000; }
        ${_docCSS(true)}
        .naq-doc{ box-shadow:none !important; border-radius:0 !important; }
      </style></head><body>${clone.outerHTML}</body></html>`;
  }
  function _naqDoPrint(html) {
    if (typeof dioPrint === 'function') dioPrint(html);
    else { const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); w.print(); } }
  }
  // کاغذ بدلنا (ایڈیٹر کھلا ہو): صفحہ دوبارہ نہیں بنتا — کاغذ کی چوڑائی بدلتی ہے اور
  //   نقشے کی ہر چیز اسی نسبت سے چھوٹی/بڑی (کوئی چیز کنارے سے نہ کٹے)
  function _naqPaperSoft(v) {
    const a = _active(); if (!a) return;
    const p = (v === 'a4') ? 'a4' : 'legal';
    a.paper = p;
    const doc = document.getElementById('dio-naqsha-doc');
    if (doc) { doc.classList.remove('naq-legal', 'naq-a4'); doc.classList.add('naq-' + p); }
    const map = document.getElementById('naq-map');
    if (_naqCanvas && map) {
      try {
        const oldW = _naqCanvas.getWidth(), newW = Math.max(280, map.clientWidth - 2);
        if (oldW && newW && Math.abs(newW - oldW) > 0.5) {
          const f = newW / oldW;
          _naqCanvas.getObjects().forEach(o => {
            o.set({ left: (o.left || 0) * f, top: (o.top || 0) * f, scaleX: (o.scaleX || 1) * f, scaleY: (o.scaleY || 1) * f });
            o.setCoords();
          });
          const h = Math.max(140, Math.round(_naqCanvas.getHeight() * f));
          _naqCanvas.setWidth(newW); _naqCanvas.setHeight(h); map.style.height = h + 'px'; a.mapH = h;
          _naqCanvas.renderAll();
        }
      } catch (_) { /* ضمنی */ }
    }
    _snapshot(); _persistLocal(); _saveSoon();
    try { _naqRulerUpdate(); } catch (_) { /* ضمنی */ }
  }
  window._naqSetPaper = _naqPaperSoft;
  function _naqPrintNow() {
    _snapshot(); _persistLocal();
    const doc = document.getElementById('dio-naqsha-doc'); if (!doc) return;
    const a = _active();
    _naqDoPrint(_naqPrintHTML(doc, _naqCurPNG(), _naqPaperOf(a)));
  }
  window._naqPrint = function () {
    const a = _active();
    if (typeof dioWithPaper !== 'function') return _naqPrintNow();
    return dioWithPaper({ get: () => _naqPaperOf(_active() || a), set: _naqPaperSoft, run: () => _naqPrintNow() });
  };

  // ── فہرست سے (ایڈیٹر کھولے بغیر): محفوظ JSON → نقشے کی تصویر ──
  function _naqMapW(sk) {
    if (sk && sk.mapW) return sk.mapW;
    // کاغذ کی چوڑائی − (دائیں 1in + بائیں 0.4in) − 2
    return Math.round((_naqPaperOf(sk) === 'a4' ? 8.27 : 8.5) * 96 - 1.4 * 96) - 2;
  }
  function _naqSketchPNG(sk) {
    return new Promise(resolve => {
      if (!sk || !sk.canvas || !window.fabric) return resolve('');
      let done = false; const fin = (v) => { if (!done) { done = true; resolve(v); } };
      setTimeout(() => fin(''), 8000);
      try {
        const w = _naqMapW(sk), h = Math.max(140, sk.mapH || Math.round(w * 0.6));
        const el = document.createElement('canvas'); el.width = w; el.height = h;
        const sc = new fabric.StaticCanvas(el, { width: w, height: h, backgroundColor: 'transparent' });
        sc.loadFromJSON(sk.canvas, () => {
          try { sc.renderAll(); const png = sc.toDataURL({ format: 'png', multiplier: 2 }); sc.dispose(); fin(png); }
          catch (_) { fin(''); }
        });
      } catch (_) { fin(''); }
    });
  }
  // کسی بھی محفوظ نقشے کا مکمل چھپائی HTML (فہرست کا پرنٹ / ڈاؤن لوڈ / «ایک ساتھ کئی»)
  async function _naqSketchHTML(sk, paper) {
    try { await _ensureFabric(); } catch (_) { /* نقشے کی تصویر کے بغیر */ }
    const png = await _naqSketchPNG(sk);
    const box = document.createElement('div');
    box.id = 'dio-naqsha-doc'; box.className = 'naq-doc naq-' + (paper || _naqPaperOf(sk));
    box.innerHTML = _docInner(sk, _hvFor(sk), _ioFor(sk), !!png);
    // ایڈیٹر کی طرح «قسم» کا انتخاب اور نشانات کی سطریں
    const ty = box.querySelector('#naq-type'); if (ty) ty.value = sk.type === 'baramad' ? 'baramad' : 'waqia';
    const map = box.querySelector('#naq-map');
    if (map) { map.innerHTML = ''; if (sk.mapH) map.style.height = sk.mapH + 'px'; }
    return _naqPrintHTML(box, png, paper || _naqPaperOf(sk));
  }
  window._naqSketchHTML = (id, paper) => { const sk = _naqData.sketches.find(x => x.id === id); return sk ? _naqSketchHTML(sk, paper) : Promise.resolve(''); };

  // ══ v553: محفوظ نقشوں کی فہرست ═════════════════════════════════════
  //  افسر کا قاعدہ: «نقشہ موقع chip پر کلک کریں تو پہلے سے تاریخ، وقت اور ملزم کے
  //  حساب سے جائے وقوعہ اور جائے برامدگی کے محفوظ نقشے نظر آئیں تاکہ ضرورت کے مطابق
  //  پرنٹ لیا جا سکے؛ اوپر دائیں کونے میں نیا نقشہ بنانے کا بٹن۔ ہر محفوظ نقشے کے
  //  عمل کے بٹن ایک ہی سطر میں: ترمیم، پرنٹ، ڈاؤن لوڈ، کاپی، حذف — پرنٹ سیدھا۔»
  const _typeLbl = (sk) => sk.type === 'baramad' ? 'جائے برامدگی' : 'جائے وقوعہ';
  function _savedTime(sk) {
    if (!sk.savedAt) return '';
    try { return new Date(sk.savedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); } catch (_) { return ''; }
  }
  // تاریخ: نقشے کی اپنی (IO کی سطر) — درست نہ ہو تو محفوظ ہونے کی تاریخ
  function _rowDate(sk) {
    if (/\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4}/.test(String(sk.date || ''))) return sk.date;
    return sk.savedAt ? FDATE(String(sk.savedAt).slice(0, 10)) : '';
  }
  function _dmyKey(d) {   // DD/MM/YYYY → YYYYMMDD (ترتیب کے لیے)
    const m = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/.exec(String(d || ''));
    return m ? (m[3] + m[2].padStart(2, '0') + m[1].padStart(2, '0')) : '';
  }
  let _naqLF = { type: '', acc: '' };          // فہرست کی چھان
  function _listRows() {
    let L = _naqData.sketches.slice();
    if (_naqLF.type) L = L.filter(x => (x.type === 'baramad' ? 'baramad' : 'waqia') === _naqLF.type);
    if (_naqLF.acc) L = L.filter(x => _banamFor(x).indexOf(_naqLF.acc) !== -1);
    // تاریخ + وقت کے حساب سے — نیا اوپر
    L.sort((p, q) => {
      const a = _dmyKey(_rowDate(p)) + (p.savedAt || ''), b = _dmyKey(_rowDate(q)) + (q.savedAt || '');
      return a < b ? 1 : a > b ? -1 : (q.serial || 0) - (p.serial || 0);
    });
    return L;
  }
  function _listHTML() {
    const rows = _listRows();
    const accs = [];
    _naqData.sketches.forEach(x => _banamFor(x).forEach(n => { if (accs.indexOf(n) === -1) accs.push(n); }));
    _naqAccList.forEach(x => { if (accs.indexOf(x.name) === -1) accs.push(x.name); });
    // v558: پورے سسٹم کے ایکشن بٹن ایک جیسے (مقدمہ کی فہرست والے) — dioActBtn
    const btn = (fn, id, kind, t) => dioActBtn(kind, `window.${fn}&&${fn}('${id}')`, t);
    const body = rows.length ? rows.map((sk, i) => `<tr data-naq="${E(sk.id)}">
        <td class="dio-col-num" style="text-align:center;">${i + 1}</td>
        <td><b>${E(_typeLbl(sk))}</b> <small dir="ltr" style="color:var(--text-muted);">#${E(sk.serial || '')}</small></td>
        <td>${E(_banamFor(sk).join('، ') || '—')}</td>
        <td dir="ltr" style="white-space:nowrap;">${E(_rowDate(sk) || '—')}</td>
        <td dir="ltr" style="white-space:nowrap;">${E(_savedTime(sk) || '—')}</td>
        <td><div class="naq-lacts">
          ${btn('_naqEdit', sk.id, 'edit', 'ترمیم')}
          ${btn('_naqListPrint', sk.id, 'print', 'پرنٹ')}
          ${btn('_naqListDownload', sk.id, 'download', 'ڈاؤن لوڈ')}
          ${btn('_naqCopyRow', sk.id, 'copy', 'کاپی')}
          ${btn('_naqDelRow', sk.id, 'delete', 'حذف')}
        </div></td></tr>`).join('')
      : `<tr><td colspan="6" style="padding:26px;text-align:center;color:var(--text-muted);">${
          _naqData.sketches.length ? 'اس چھان سے کوئی نقشہ نہیں ملا' : 'ابھی کوئی نقشہ محفوظ نہیں — نیا نقشہ بنانے کے لیے «+ نقشہ موقع درج کریں» دبائیں'}</td></tr>`;
    const tsel = (v, t) => `<option value="${v}" ${_naqLF.type === v ? 'selected' : ''}>${t}</option>`;
    return `
    <div class="naq-list" dir="rtl">
      <div class="page-header naq-lhead">
        <button type="button" class="btn btn-primary dio-add-btn" onclick="window._naqNew&&_naqNew()">+ نقشہ موقع درج کریں</button>
        <div class="naq-lttl">
          <div class="dio-h1 naq-lh1">نقشہ موقع — محفوظ نقشے</div>
          <div class="naq-lsub">مقدمہ <bdi dir="ltr">${E((_naqCase || {}).fir_number || '—')}</bdi> · <span id="naq-lcount">${_naqData.sketches.length}</span> نقشے</div>
        </div>
      </div>
      <div class="naq-lfilter">
        <select class="filter-select" onchange="window._naqListFilter&&_naqListFilter('type',this.value)" aria-label="قسم">
          ${tsel('', 'تمام اقسام')}${tsel('waqia', 'جائے وقوعہ')}${tsel('baramad', 'جائے برامدگی')}
        </select>
        <select class="filter-select" onchange="window._naqListFilter&&_naqListFilter('acc',this.value)" aria-label="ملزم">
          <option value="">تمام ملزمان</option>
          ${accs.map(n => `<option value="${E(n)}" ${_naqLF.acc === n ? 'selected' : ''}>${E(n)}</option>`).join('')}
        </select>
      </div>
      <div class="card" style="padding:0;overflow:hidden;">
        <div style="overflow-x:auto;">
          <table class="data-table naq-ltable" style="width:100%;">
            <thead><tr>
              <th class="dio-col-num" style="width:44px;text-align:center;">#</th>
              <th>قسم</th><th>ملزم (بنام)</th><th>تاریخ</th><th>وقت</th>
              <th style="text-align:center;">اقدامات</th>
            </tr></thead>
            <tbody id="naq-lrows">${body}</tbody>
          </table>
        </div>
      </div>
    </div>`;
  }
  function _listCSS() {
    return `
    .naq-list{ padding:14px 16px 24px; direction:rtl; font-family:'Jameel Noori Nastaleeq'; }
    .naq-lhead{ display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
    .naq-lh1{ font-size:15pt; font-weight:800; line-height:1.9; color:var(--text-primary,#111); }
    .naq-lsub{ font-size:11pt; color:var(--text-muted,#667); line-height:1.7; }
    .naq-list .data-table td{ font-size:14pt; line-height:1.6; }
    .naq-lfilter{ display:flex; gap:8px; flex-wrap:wrap; margin:0 0 12px; }
    .naq-lacts{ display:flex; gap:2px; flex-wrap:nowrap; justify-content:center; white-space:nowrap; }
    .naq-lacts .btn{ display:inline-flex; align-items:center; gap:4px; white-space:nowrap; }
    @media (max-width:760px){ .naq-lacts{ justify-content:flex-start; overflow-x:auto; }
      .naq-lacts .btn span{ display:none; } .naq-lacts .btn{ min-width:40px; min-height:38px; justify-content:center; } }`;
  }
  async function _renderList(container, cid, skipLoad) {
    container = container || document.getElementById('workspace-editor-area')
      || document.getElementById('workspace-tab-content') || document.getElementById('page-content');
    if (!container) return;
    try { _naqWsOff(); } catch (_) { /* ضمنی */ }
    if (!skipLoad || !_naqData || !Array.isArray(_naqData.sketches)) {
      container.innerHTML = `<div style="padding:40px;text-align:center;direction:rtl;color:var(--text-muted);"><div style="font-size:30pt;">🗺️</div><div style="font-size:14pt;margin-top:8px;">نقشہ موقع کھل رہا ہے…</div></div>`;
      await _loadCase(cid); await _load();
    }
    _naqCanvas = null;
    container.innerHTML = `<style>${_listCSS()}</style><div id="naq-listbox">${_listHTML()}</div>`;
    _naqLabel(container);
  }
  // موبائل: فہرست کا جدول کارڈ کی شکل (پورے صفحے والا منظر page-content سے باہر ہے)
  function _naqLabel(root) {
    try { if (window.dioMobile && dioMobile.isMobile && dioMobile.isMobile()) dioMobile.labelTables(root); } catch (_) { /* ضمنی */ }
  }
  function _refreshList() {
    const b = document.getElementById('naq-listbox'); if (!b) return;
    b.innerHTML = _listHTML();
    _naqLabel(b);
  }
  window._naqListFilter = function (k, v) { _naqLF[k] = v || ''; _refreshList(); };
  window._naqBackToList = function () {
    if (document.getElementById('dio-naqsha-doc')) { _snapshot(); _persistLocal(); _setPending(_naqCaseId, true); _persistCloud(); }
    _renderList(null, _naqCaseId, true);
  };
  window._naqEdit = function (id) {
    if (!_naqData.sketches.some(x => x.id === id)) return;
    _naqData.activeId = id; _persistLocal();
    _renderNaqsha(null, null, true);
  };
  window._naqNew = function () {
    if (document.getElementById('dio-naqsha-doc')) _snapshot();
    const sk = _newSketch(_naqData.sketches.some(x => x.type === 'waqia') ? 'baramad' : 'waqia');
    _naqData.sketches.push(sk); _naqData.activeId = sk.id;
    _persistLocal(); _persistCloud();
    _renderNaqsha(null, null, true);
  };
  window._naqListPrint = async function (id) {
    const sk = _naqData.sketches.find(x => x.id === id); if (!sk) return;
    const run = async (p) => { const html = await _naqSketchHTML(sk, p); if (html) _naqDoPrint(html); };
    if (typeof dioWithPaper !== 'function') return run(_naqPaperOf(sk));
    return dioWithPaper({
      get: () => _naqPaperOf(sk),
      set: (v) => { sk.paper = (v === 'a4') ? 'a4' : 'legal'; _persistLocal(); _persistCloud(); },
      run: (p) => run(p)
    });
  };
  window._naqListDownload = async function (id) {
    const sk = _naqData.sketches.find(x => x.id === id); if (!sk) return;
    const name = 'نقشہ موقع — ' + _typeLbl(sk) + ' نمبر ' + (sk.serial || '') + ' — مقدمہ ' + ((_naqCase || {}).fir_number || '');
    try {
      TOAST('PDF تیار ہو رہی ہے…', 'info');
      if (typeof dioLoadScript === 'function') { await dioLoadScript('dio-forms.js'); await dioLoadScript('dio-share.js'); }
      if (!(window.DIO && DIO.share && DIO.share.pdf)) throw new Error('شیئر کا آلہ لوڈ نہیں ہوا');
      const html = await _naqSketchHTML(sk, _naqPaperOf(sk));
      const blob = await DIO.share.pdf({ html }, name);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name.replace(/[\\/:*?"<>|]+/g, ' ').trim() + '.pdf';
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
      TOAST('✅ نقشہ موقع PDF ڈاؤن لوڈ ہو گیا', 'success');
    } catch (e) { TOAST('ڈاؤن لوڈ نہیں ہو سکا — ' + ((e && e.message) || ''), 'error'); }
  };
  window._naqCopyRow = function (id) {
    const sk = _naqData.sketches.find(x => x.id === id); if (!sk) return;
    const cp = JSON.parse(JSON.stringify(sk));
    const serials = _naqData.sketches.map(x => parseInt(x.serial, 10) || 0);
    cp.id = _uid(); cp.serial = Math.max.apply(null, serials.concat([0])) + 1;
    cp.savedAt = new Date().toISOString();
    _naqData.sketches.push(cp);
    _persistLocal(); _persistCloud(); _refreshList();
    TOAST('⧉ نقشے کی نقل بن گئی — نمبر ' + cp.serial, 'success');
  };
  window._naqDelRow = function (id) {
    const sk = _naqData.sketches.find(x => x.id === id); if (!sk) return;
    if (typeof confirm === 'function' && !confirm('یہ نقشہ (' + _typeLbl(sk) + ' نمبر ' + (sk.serial || '') + ') حذف کریں؟')) return;
    _naqData.sketches = _naqData.sketches.filter(x => x.id !== id);
    if (_naqData.activeId === id) _naqData.activeId = _naqData.sketches.length ? _naqData.sketches[0].id : null;
    _persistLocal(); _persistCloud(); _refreshList();
    TOAST('نقشہ حذف ہو گیا', 'success');
  };
  // «ایک ساتھ کئی دستاویزات» (case-print.js): اس مقدمے کے تمام محفوظ نقشے
  window._naqSketchIds = () => (_naqData && Array.isArray(_naqData.sketches)) ? _naqData.sketches.map(x => x.id) : [];

  // ══ CSS ════════════════════════════════════════════════════════════
  // دستاویز کی CSS — screen اور print دونوں ایک ہی (WYSIWYG)
  function _docCSS(forPrint) {
    // چالان/زمنی کی طرح: دائیں 1 انچ indent، بائیں 0.4 انچ۔ کوئی dotted line نہیں۔
    return `
    /* درخواست (darkhwastain) کی ہو بہو top-4-line ترتیب: دائیں 1in، بائیں 0.4in،
       اوپر/نیچے 1cm؛ line-height 1.9؛ سطر 2/3/4 کا right-indent 0.9in۔ */
    .naq-doc{ background:#fff; color:#111; font-size:14pt; line-height:1.9;
      font-family:'Jameel Noori Nastaleeq'; padding:1cm 1in 1cm 0.4in; --naq-indent:0.9in; }
    .naq-doc.naq-legal{ width:8.5in; }
    .naq-doc.naq-a4{ width:8.27in; }
    ${forPrint ? `.naq-doc{ width:100% !important; }` : ''}
    .naq-hrow{ display:flex; align-items:baseline; gap:6px 10px; margin:2px 0; flex-wrap:wrap; }
    /* سطر 1 — تھانہ (دائیں) · ضلع (بائیں)، بغیر indent (کناروں پر) */
    .naq-edge{ justify-content:space-between; flex-wrap:nowrap; }
    .naq-edge > span{ display:inline-flex; align-items:baseline; gap:6px; }
    /* سطر 2 (سرکار): سطر 1 کے بعد صرف 0.12in؛ indent 0.9in؛ line-height 1.8 */
    .naq-l2{ margin-top:0.12in; padding-right:var(--naq-indent,0.9in); line-height:1.8; }
    /* سطر 3 (مقدمہ/دفعہ): tight 1pt؛ indent 0.9in */
    .naq-l3{ margin-top:1pt; padding-right:var(--naq-indent,0.9in); line-height:1.8; }
    .naq-firrow{ gap:4px 16px; }
    .naq-seg{ display:inline-flex; align-items:baseline; gap:6px; white-space:nowrap; }
    .naq-firrow .naq-f{ white-space:normal; }
    .naq-lbl{ font-weight:400; white-space:nowrap; }   /* لیبل bold نہیں */
    .naq-sp{ margin-top:16px; }            /* امتیازی سے پہلے */
    .naq-sp-sm{ margin-top:6px; }
    /* inline editable خانہ — کوئی dotted line/gap نہیں، مواد کے مطابق سکڑے/بڑھے */
    .naq-f{ display:inline-block; min-width:1.5ch; font-family:inherit; font-size:14pt; color:#111; outline:none; }
    .naq-f:focus{ background:rgba(37,99,235,0.06); border-radius:3px; }
    .naq-f-grow{ display:inline; }
    /* سطر 4 بنام — «بنام» دائیں کنارے (تھانہ کی سیدھ) hanging؛ ملزمان 0.9in indent (سرکار کی سیدھ)؛ tight 1pt */
    .naq-banam{ position:relative; margin-top:1pt; padding-right:var(--naq-indent,0.9in); line-height:1.8; min-height:1.6em; }
    .naq-banam-lbl{ position:absolute; right:0; top:0; white-space:nowrap; }
    .naq-caret{ width:20px; height:20px; border:1px solid #cbd5e1; border-radius:5px; background:#fff; font-size:8.25pt; cursor:pointer; }
    .naq-banam-list{ display:block; }
    .naq-acc{ margin:0; }
    .naq-accno{ font-weight:400; }
    /* بحد — بائیں بارڈر کی سیدھ میں، 12pt، ڈیٹا کے گرد ( ) */
    .naq-bahad{ margin-top:6px; text-align:left; font-size:12pt; }
    .naq-bahad .naq-f{ font-size:12pt; }
    .naq-paren{ font-size:12pt; }
    /* عنوان — 18pt، پوری سطر underline؛ bold نہیں؛ قسم dropdown سادہ underline متن (کوئی دائرہ/باکس نہیں) */
    /* عنوانات کا اصول (پورا نظام، ہر کاغذ): مرکزی 20pt · ذیلی 16pt · تیسرا درجہ 14pt — چالان کے مطابق */
    .naq-title{ position:relative; z-index:5; text-align:center; font-weight:400; font-size:20pt; margin:16px 0 6px; }
    .naq-title-t{ text-decoration:underline; text-underline-offset:5px; }
    .naq-type{ -webkit-appearance:none; -moz-appearance:none; appearance:none; font-family:inherit; font-size:20pt; font-weight:400;
      border:none; background:transparent; color:#111; padding:0 2px; cursor:pointer; text-decoration:underline; text-underline-offset:5px; outline:none; }
    .naq-map{ position:relative; margin:2px 0 6px; }
    .naq-map .canvas-container{ margin:0 auto; }
    #naq-canvas{ display:block; }
    /* نقشے کے نیچے کھینچنے والی پٹی — اب نظر نہیں آتی۔
       پہلے یہ ہلکی نیلی پٹی (⋯ کے ساتھ) ہر وقت دکھائی دیتی تھی اور نقشے کے
       خالی حصے کے نیچے ایک فالتو «پٹی» معلوم ہوتی تھی۔ اب صاف ہے — مگر کام
       ویسا ہی: ماؤس اُس جگہ لے جائیں تو ہلکی سی نمودار ہو جاتی ہے اور نقشہ
       پہلے کی طرح کھینچ کر بڑا/چھوٹا کیا جا سکتا ہے۔ (چھپائی میں پہلے بھی
       نہیں آتی تھی — no-print.) */
    .naq-map-resize{ position:absolute; left:0; right:0; bottom:0; height:14px; cursor:ns-resize;
      background:transparent; opacity:0; transition:opacity .15s ease; }
    .naq-map:hover .naq-map-resize, .naq-map-resize:hover{ opacity:1;
      background:linear-gradient(180deg,transparent,rgba(37,99,235,0.10)); }
    .naq-map-resize::after{ content:'⋯'; position:absolute; left:50%; bottom:0; transform:translateX(-50%); color:#9aa; font-size:9pt; }
    /* سمت نما — دائیں بارڈر کی طرف؛ N-S لمبا وہی؛ E-W افقی تھوڑا نیچے */
    .naq-compass{ position:absolute; top:50%; right:-40px; width:116px; height:147px; transform:translateY(-48px); z-index:6; pointer-events:none; }
    .naq-nofab{ padding:36px 16px; text-align:center; color:#b91c1c; }
    .naq-marks-l{ font-size:16pt; font-weight:700; text-decoration:underline; text-underline-offset:4px; }
    .naq-mrow{ display:flex; align-items:baseline; gap:6px; margin:4px 0; }
    .naq-mno{ white-space:nowrap; font-weight:400; }
    .naq-mtext{ flex:1; min-width:60px; outline:none; }
    /* فاصلہ جات (تخمیناً) — بلٹ + آزاد متن؛ خالی سطر پر ہلکا اشارہ */
    .naq-sp2{ margin-top:12px; }
    .naq-drow{ display:flex; align-items:baseline; gap:6px; margin:4px 0; }
    .naq-dno{ white-space:nowrap; color:#111; }
    .naq-dtext{ flex:1; min-width:60px; outline:none; }
    .naq-dtext:empty:before{ content:attr(data-ph); color:#bbb; }
    /* IO — بائیں کونے؛ نام bold بائیں، تاریخ نام کے نیچے وسط میں */
    .naq-io{ margin-top:18px; width:fit-content; margin-inline-start:auto; }
    .naq-io-nm{ font-weight:700; text-align:left; white-space:nowrap; }
    .naq-io-dt{ font-size:13pt; font-weight:400; text-align:center; }
    `;
  }
  // پورا صفحہ (topbar + scroll) کی CSS
  function _css() {
    return `
    .naq-wrap{ display:flex; flex-direction:column; height:100%; direction:rtl;
      font-family:'Jameel Noori Nastaleeq'; }
    /* ٹول بار — ہمیشہ اوپر، ہر وقت نظر میں (چالان کی طرح)۔
       پہلے میں نے اِسے صفحے کے ساتھ چلتا کر دیا تھا — وہ غلط تھا۔ صارف کی
       وضاحت: ترمیم کے اوزار (کاٹنا، چسپاں، واپس…) ہمیشہ اوپر رہیں، اور
       مقدمہ کی chip پٹی اُن کے **نیچے** صرف اُس وقت آئے جب کرسر اوپر جائے۔
       یہ .naq-wrap (flex column) کی پہلی قطار ہے، اِس لیے خود بخود اوپر
       ٹکی رہتی ہے اور نیچے والا حصہ اکیلا scroll ہوتا ہے — کوئی خالی پٹی
       نہیں بنتی۔ */
    .naq-topwrap{ position:relative; z-index:30; background:var(--bg-secondary,#f3f4f6); }
    .naq-toolbar{ display:flex; align-items:center; gap:8px; padding:6px 10px; flex-wrap:wrap;
      background:var(--bg-secondary,#f3f4f6); border-bottom:1px solid var(--border,#ccc); }
    .naq-chiptog{ font-weight:700; background:var(--bg-card,#fff); }
    /* چِپ بار (محفوظ نقشے) — پہلے سے چھپی، بٹن سے دکھائیں/چھپائیں */
    .naq-chipstrip{ max-height:0; opacity:0; overflow:hidden; background:var(--bg-secondary,#eef1f4);
      transition:max-height .2s ease, opacity .2s ease, padding .2s ease; }
    .naq-chipstrip.show{ max-height:120px; opacity:1; padding:6px 10px; border-bottom:1px solid var(--border,#ccc); }
    /* chip bar — چلتی (افقی scroll)، سطریں نہ ٹوٹیں */
    .naq-chips{ display:flex; gap:6px; align-items:center; flex-wrap:nowrap; overflow-x:auto; min-width:0;
      scrollbar-width:thin; }
    .naq-chips::-webkit-scrollbar{ height:6px; }
    .naq-chip{ flex:0 0 auto; }
    .naq-chip{ padding:4px 11px; border:1px solid var(--border,#cbd5e1); border-radius:16px; background:var(--bg-card,#fff);
      color:var(--text-primary,#111); cursor:pointer; font-size:12pt; }
    .naq-chip.on{ background:var(--nav-active,#e0edff); color:var(--accent,#2563eb); border-color:var(--accent,#2563eb); font-weight:700; }
    .naq-chip .naq-x{ color:#b91c1c; font-size:8.25pt; cursor:pointer; }
    .naq-chip.naq-add{ font-weight:800; }
    .naq-tools{ display:flex; gap:4px; flex-wrap:wrap; align-items:center; width:100%; }
    .naq-tb{ min-width:32px; height:30px; padding:0 8px; border:1px solid var(--border,#cbd5e1); border-radius:7px;
      background:var(--bg-card,#fff); color:var(--text-primary,#111); cursor:pointer; font-size:10.5pt; }
    .naq-tb:hover{ background:var(--hover-bg,#eef6ff); }
    .naq-tool.on{ background:var(--nav-active,#e0edff); border-color:var(--accent,#2563eb); color:var(--accent,#2563eb); font-weight:700; }
    .naq-color{ width:32px; height:30px; padding:2px; border:1px solid var(--border,#cbd5e1); border-radius:7px; background:#fff; cursor:pointer; }
    .naq-save{ background:#e8f5e9; border-color:#3a923e; color:#1b5e20; font-weight:700; }
    .naq-print{ background:var(--accent,#2563eb); color:#fff; border-color:var(--accent,#2563eb); }
    .naq-sel{ height:30px; border:1px solid var(--border,#cbd5e1); border-radius:7px; background:#fff; color:#111; font-size:11pt; padding:0 6px; cursor:pointer; }
    .naq-sep{ width:1px; height:22px; background:var(--border,#ccc); margin:0 3px; }
    /* ── موبائل: ٹول بار ایک ہی قطار ─────────────────────────────────────
       پہلے فون پر یہ 4 قطاروں میں ٹوٹ کر اسکرین کا تقریباً 30٪ لے لیتی تھی۔
       اب ایک قطار، انگلی سے دائیں/بائیں سرکائیں — کوئی اوزار ہٹایا نہیں گیا۔
       «محفوظ» اور «پرنٹ» بائیں کنارے پر ہمیشہ نظر میں رہتے ہیں (sticky)۔
       ڈیسک ٹاپ پر کوئی تبدیلی نہیں۔ */
    @media (max-width:760px){
      .naq-toolbar{ padding:4px 6px; gap:4px; }
      .naq-tools{ flex-wrap:nowrap; overflow-x:auto; overflow-y:hidden; gap:4px;
        -webkit-overflow-scrolling:touch; scrollbar-width:none; overscroll-behavior-x:contain; }
      .naq-tools::-webkit-scrollbar{ display:none; }
      .naq-tools > *{ flex:0 0 auto; }
      .naq-tb, .naq-sel, .naq-color{ height:34px; }
      .naq-sep{ height:20px; margin:0 1px; }
      .naq-print{ position:sticky; left:0; z-index:3; width:40px; min-width:40px; padding:0; }
      .naq-save{ position:sticky; left:44px; z-index:3; padding:0 7px;
        box-shadow:-6px 0 8px -4px rgba(0,0,0,.18); }
    }
    .naq-scroll{ flex:1; overflow:auto; min-height:0; padding:16px; background:var(--bg-tertiary,#eef1f4); }
    /* v553: پیمانہ (انچ) + صفحہ 1 کا اختتام — صرف اسکرین پر */
    .naq-paperwrap{ position:relative; width:fit-content; margin:0 auto; padding-left:30px; }
    .naq-paperwrap > .naq-doc{ margin:0; }
    .naq-ruler{ position:absolute; left:0; top:0; width:22px; background-color:#f8fafc; border:1px solid #cbd5e1; border-radius:3px;
      background-image:repeating-linear-gradient(to bottom, transparent 0, transparent 23px, #94a3b8 23px, #94a3b8 24px);
      background-size:9px 100%; background-repeat:repeat-y; background-position:right top; }
    .naq-ruler b{ position:absolute; left:0; right:0; height:0; border-top:1.5px solid #334155; }
    .naq-ruler b{ font:700 6.75pt/1 var(--font-mono,monospace); color:#334155; text-align:center; }
    .naq-ruler b{ padding-top:2px; }
    .naq-pgline{ position:absolute; left:0; right:0; height:0; border-top:2px dashed #dc2626; z-index:7; pointer-events:none; }
    .naq-pgline span{ position:absolute; left:28px; top:-1.6em; font-size:10pt; color:#dc2626; background:rgba(255,255,255,.9); padding:0 6px; border-radius:4px; white-space:nowrap; }
    .naq-hctl{ display:inline-flex; align-items:center; gap:4px; font-size:11pt; white-space:nowrap; }
    .naq-hctl input{ width:64px; height:30px; border:1px solid var(--border,#cbd5e1); border-radius:7px; padding:0 4px;
      font-family:var(--font-mono,monospace); direction:ltr; background:#fff; color:#111; }
    .naq-remain{ font-size:10.5pt; color:#166534; background:#ecfdf5; border:1px solid #86efac; border-radius:6px; padding:2px 8px; white-space:nowrap; }
    .naq-remain.over{ color:#991b1b; background:#fef2f2; border-color:#fca5a5; }
    #naq-straight.on{ background:var(--nav-active,#e0edff); border-color:var(--accent,#2563eb); color:var(--accent,#2563eb); font-weight:700; }
    @media print{ .naq-ruler,.naq-pgline{ display:none !important; } }
    /* دستاویز اصل کاغذ کی چوڑائی پر (screen=print)؛ تنگ اسکرین پر افقی scroll — squish نہیں */
    .naq-doc{ margin:0 auto; box-shadow:0 4px 22px rgba(0,0,0,0.15); border-radius:4px; }
    ${_docCSS(false)}
    /* پولیس علامات پینل */
    .naq-sympanel{ position:fixed; z-index:99998; background:#fff; border:1px solid #0369a1; border-radius:12px;
      box-shadow:0 12px 34px rgba(0,0,0,.28); direction:rtl; width:340px; max-width:94vw; max-height:min(66vh,460px);
      display:flex; flex-direction:column; overflow:hidden; font-family:'Jameel Noori Nastaleeq'; }
    .naq-sympanel-h{ padding:9px 12px; font-weight:700; color:#0369a1; background:#f8fafc; border-bottom:1px solid #e5e7eb;
      display:flex; justify-content:space-between; align-items:center; gap:8px; font-size:9.75pt; }
    .naq-sym-x{ color:#b91c1c; cursor:pointer; font-size:10.5pt; padding:0 4px; }
    .naq-symgrid{ display:grid; grid-template-columns:repeat(4,1fr); gap:7px; padding:11px; overflow:auto; }
    .naq-symcell{ display:flex; flex-direction:column; align-items:center; gap:4px; padding:7px 3px;
      border:1px solid #e5e7eb; border-radius:9px; background:#fff; cursor:pointer; }
    .naq-symcell:hover{ background:#eef6ff; border-color:#2563eb; }
    .naq-symcell svg{ width:34px; height:34px; }
    .naq-symcell span{ font-size:8.25pt; color:#334155; line-height:1.2; }
    @media print{ .naq-toolbar,.naq-chipstrip,.naq-topwrap,#global-mic-btn,.naq-sympanel{ display:none !important; } }
    `;
  }

})();
