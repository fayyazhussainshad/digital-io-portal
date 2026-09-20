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
  const TOAST = (m, t) => { try { if (typeof showToast === 'function') showToast(m, t || 'info'); } catch (_) {} };
  const FDATE = (d) => { try { return (typeof formatDate === 'function') ? formatDate(d) : (d || ''); } catch (_) { return d || ''; } };
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
      s.onload = () => window.fabric ? resolve(window.fabric) : reject(new Error('fabric'));
      s.onerror = () => reject(new Error('fabric net'));
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
    const jurm = [c.section_of_law, c.offence_type].map(x => (x || '').trim()).filter(Boolean).join(' ');
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
  async function _load() {
    _naqData = null; _naqRowId = null;
    // cloud پہلے (آن لائن)
    if (_naqCaseId && typeof supabaseClient !== 'undefined' && supabaseClient && _online()) {
      try {
        const { data } = await supabaseClient.from('case_documents')
          .select('id,content').eq('case_id', _naqCaseId).eq('document_type', 'naqsha').maybeSingle();
        if (data) { _naqRowId = data.id; if (data.content && data.content.sketches) _naqData = data.content; }
      } catch (_) {}
    }
    if (!_naqData) {
      try { _naqData = JSON.parse(localStorage.getItem(_key()) || 'null'); } catch (_) { _naqData = null; }
    }
    if (!_naqData || !Array.isArray(_naqData.sketches)) _naqData = { sketches: [], activeId: null };
    if (!_naqData.sketches.length) {
      const s = _newSketch('waqia'); _naqData.sketches.push(s); _naqData.activeId = s.id;
    }
    if (!_naqData.activeId || !_naqData.sketches.some(s => s.id === _naqData.activeId))
      _naqData.activeId = _naqData.sketches[0].id;
  }
  function _persistLocal() { try { localStorage.setItem(_key(), JSON.stringify(_naqData)); } catch (_) {} }
  async function _persistCloud() {
    if (!_naqCaseId || typeof supabaseClient === 'undefined' || !supabaseClient || !_online()) return;
    try {
      const content = _naqData;
      if (_naqRowId) {
        await supabaseClient.from('case_documents').update({ content, status: 'draft' }).eq('id', _naqRowId);
      } else {
        let oid = null; try { oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null; } catch (_) {}
        const { data } = await supabaseClient.from('case_documents')
          .insert({ case_id: _naqCaseId, officer_id: oid, document_type: 'naqsha', status: 'draft', content })
          .select().single();
        if (data) _naqRowId = data.id;
      }
    } catch (_) {}
  }
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
    // امتیازی نشانات
    const mrows = document.querySelectorAll('#naq-marks .naq-mrow');
    if (mrows.length) a.marks = Array.from(mrows).map(r => {
      const tx = r.querySelector('.naq-mtext');
      const t = tx ? tx.innerText.replace(/\u00a0/g, ' ').trim() : '';
      const id = r.getAttribute('data-markid') || '';
      return id ? { id, t } : t;
    });
    if (_naqCanvas) { try { a.canvas = _naqCanvas.toJSON(['naqLabel', 'naqSym', 'naqMark', 'naqMarkId', 'naqMarkSeq']); } catch (_) {} }
  }
  function _saveSoon() {
    clearTimeout(_naqSaveT);
    _naqSaveT = setTimeout(() => { _snapshot(); _persistLocal(); _persistCloud(); }, 600);
  }
  // صریح محفوظ (💾)
  async function naqSaveNow() {
    _snapshot(); const a = _active();
    if (a) a.name = 'نقشہ موقع — ' + (a.type === 'baramad' ? 'جائے برامدگی' : 'جائے وقوعہ');
    _persistLocal(); await _persistCloud();
    try {
      if (typeof dioRegisterSaved === 'function' && a)
        dioRegisterSaved('naqsha', (a.name || 'نقشہ موقع') + ' — نمبر ' + (a.serial || ''),
          { case_id: _naqCaseId, doc_id: 'crime_scene', serial_no: a.serial, date: a.date });
    } catch (_) {}
    TOAST('✅ نقشہ موقع محفوظ ہو گیا', 'success');
    _refreshChips();
  }
  window.naqSaveNow = naqSaveNow;

  // ══ Entry ══════════════════════════════════════════════════════════
  async function openNaqsha(caseId) {
    const cid = caseId || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
      || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
    // چالان/زمنی/درخواست کی طرح — پورے صفحے کی doc-view کھولو تاکہ مقدمہ کی
    // دستاویزات کی chips patti ڈھک جائے (نہ کہ نقشہ اس کے نیچے inline کھلے)
    if (typeof _dioOpenDocTab === 'function') { try { _dioOpenDocTab('crime_scene'); } catch (_) {} }
    const area = document.getElementById('workspace-editor-area')
      || document.getElementById('workspace-tab-content') || document.getElementById('page-content');
    if (!area) { setTimeout(() => openNaqsha(cid), 80); return; }
    await _renderNaqsha(area, cid);
  }
  window.openNaqsha = openNaqsha;
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
    box.style.cssText = 'position:fixed;z-index:99999;background:#fff;border:1px solid #0369a1;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.28);direction:rtl;width:280px;max-width:92vw;max-height:min(60vh,360px);display:flex;flex-direction:column;overflow:hidden;font-family:\'Jameel Noori Nastaleeq\',serif;';
    box.innerHTML =
      '<div style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-weight:700;color:#0369a1;background:#f8fafc;font-size:13px;">بنام — ملزمان منتخب کریں</div>' +
      '<div style="flex:1;overflow:auto;padding:4px 8px;">' +
      _naqAccList.map(a => `<label style="display:flex;align-items:center;gap:8px;padding:7px 6px;cursor:pointer;font-size:13px;border-bottom:1px solid #f1f5f9;"><input type="checkbox" ${chosen.has(a.name) ? 'checked' : ''} value="${E(a.name)}"> <span>${E(a.name)}</span></label>`).join('') +
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
            const sel = getSelection(); sel.removeAllRanges(); sel.addRange(rng); } catch (_) {} } }
        _saveSoon();
      }
    }
  };

  // ══ Render ═════════════════════════════════════════════════════════
  async function _renderNaqsha(container, forceId) {
    container = container || document.getElementById('workspace-editor-area')
      || document.getElementById('workspace-tab-content') || document.getElementById('page-content');
    if (!container) return;
    container.innerHTML = `<div style="padding:40px;text-align:center;direction:rtl;color:var(--text-muted);"><div style="font-size:40px;">🗺️</div><div style="font-size:14pt;margin-top:8px;">نقشہ موقع کھل رہا ہے…</div></div>`;

    await _loadCase(forceId);
    await _load();
    let fabricOk = true; try { await _ensureFabric(); } catch (_) { fabricOk = false; }
    try { document.body.classList.add('workspace-mode'); window._inWorkspace = true; } catch (_) {}

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
       <div class="naq-topbar">
        <div class="naq-chips" id="naq-chips">${_chipsHTML()}</div>
        <div class="naq-tools">
          <select id="naq-paper" class="naq-sel" onchange="window._naqSetPaper&&_naqSetPaper(this.value)" title="کاغذ">
            <option value="legal" ${paper === 'legal' ? 'selected' : ''}>لیگل</option>
            <option value="a4" ${paper === 'a4' ? 'selected' : ''}>A4</option>
          </select>
          ${fabricOk ? `
          <span class="naq-sep"></span>
          <button class="naq-tb naq-tool on" data-tool="select" title="منتخب / حرکت" onclick="window._naqSetTool&&_naqSetTool('select')">↖</button>
          <button class="naq-tb naq-tool" data-tool="pen" title="قلم (آزاد ڈرائنگ)" onclick="window._naqSetTool&&_naqSetTool('pen')">✏️</button>
          <button class="naq-tb naq-tool" data-tool="line" title="لکیر" onclick="window._naqSetTool&&_naqSetTool('line')">╱</button>
          <button class="naq-tb naq-tool" data-tool="arrow" title="تیر" onclick="window._naqSetTool&&_naqSetTool('arrow')">➜</button>
          <button class="naq-tb naq-tool" data-tool="rect" title="مستطیل" onclick="window._naqSetTool&&_naqSetTool('rect')">▭</button>
          <button class="naq-tb naq-tool" data-tool="ellipse" title="دائرہ / بیضوی" onclick="window._naqSetTool&&_naqSetTool('ellipse')">◯</button>
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
          <button class="naq-tb naq-tool" title="پین (کھینچ کر گھمائیں)" data-tool="pan" onclick="window._naqSetTool&&_naqSetTool('pan')">✋</button>
          <button class="naq-tb" title="زوم اِن" onclick="window._naqZoomIn&&_naqZoomIn()">＋</button>
          <button class="naq-tb" title="زوم آؤٹ" onclick="window._naqZoomOut&&_naqZoomOut()">－</button>
          <button class="naq-tb" title="زوم ری سیٹ (1:1)" onclick="window._naqZoomReset&&_naqZoomReset()">1:1</button>
          <input type="file" id="naq-file" accept="image/*" style="display:none" onchange="window._naqFilePicked&&_naqFilePicked(event)">
          ` : ''}
          <span class="naq-sep"></span>
          <button class="naq-tb naq-save" title="محفوظ" onclick="window.naqSaveNow&&naqSaveNow()">💾 محفوظ</button>
          <button class="naq-tb naq-print" title="چھپائی" onclick="window._naqPrint&&_naqPrint()">🖨️</button>
        </div>
       </div>
       <div class="naq-toplip" onclick="window._naqToggleBar&&_naqToggleBar()" title="ٹول بار دکھائیں/چھپائیں">⋯</div>
      </div>

      <div class="naq-scroll">
        <div id="dio-naqsha-doc" class="naq-doc naq-${paper}">

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
            <span id="naq-banam-list" class="naq-banam-list">${_banamHTML()}</span>
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

          <div class="naq-io">
            <div id="naq-io-nm" class="naq-io-nm" contenteditable="true">${E(io)}</div>
            <div id="naq-io-dt" class="naq-io-dt" contenteditable="true">${E(a.date || _regDate())}</div>
          </div>

        </div>
      </div>
    </div>`;

    ['thana', 'zila', 'sarkar', 'muqadma', 'morkha', 'bajurm', 'thana2', 'bahad'].forEach(k => {
      const el = document.getElementById('naq-h-' + k); if (el) el.addEventListener('input', _saveSoon);
    });
    if (fabricOk) _initCanvas(a);
  }
  window._renderNaqsha = _renderNaqsha;
  window._naqDirty = _saveSoon;
  window._naqType = function () { _saveSoon(); _refreshChips(); };
  window._naqSetPaper = function (v) { const a = _active(); if (a) a.paper = v; _snapshot(); _persistLocal(); _renderNaqsha(); };
  window._naqToggleBar = function () { const w = document.getElementById('naq-topwrap'); if (w) w.classList.toggle('show'); };

  // ══ Compass — E-W (افقی) عنوان کی سیدھ میں (y=48)، N-S لمبا اسی پر fixed؛
  //   الفاظ arrow heads سے فاصلے پر ════════════════════════════════════
  function _compassSVG() {
    const F = "font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif";
    // E-W افقی lline y=62 (عنوان کی سیدھ)؛ N-S عمودی لمبا؛ الفاظ arrow heads سے صاف فاصلے پر (middle anchor)
    // N-S عمودی وہی؛ E-W افقی تھوڑا نیچے (y=78)
    return `<svg class="naq-compass" viewBox="0 0 150 190" aria-label="سمت نما">
      <line x1="75" y1="46" x2="75" y2="170" stroke="#111" stroke-width="1.8"/>
      <polygon points="75,38 69,52 81,52" fill="#111"/>
      <polygon points="75,178 69,164 81,164" fill="#111"/>
      <line x1="47" y1="78" x2="103" y2="78" stroke="#111" stroke-width="1.8"/>
      <polygon points="110,78 98,72 98,84" fill="#111"/>
      <polygon points="40,78 52,72 52,84" fill="#111"/>
      <text x="75"  y="30"  text-anchor="middle" font-size="13" style="${F}">شمال</text>
      <text x="75"  y="190" text-anchor="middle" font-size="13" style="${F}">جنوب</text>
      <text x="128" y="83"  text-anchor="middle" font-size="13" style="${F}">مشرق</text>
      <text x="22"  y="83"  text-anchor="middle" font-size="13" style="${F}">مغرب</text>
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
      if (_naqCanvas) { try { _naqCanvas.setHeight(h); _naqCanvas.renderAll(); } catch (_) {} }
    };
    const up = () => {
      document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
      document.removeEventListener('touchmove', move); document.removeEventListener('touchend', up);
      _saveSoon();
    };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    document.addEventListener('touchmove', move, { passive: false }); document.addEventListener('touchend', up);
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
      try { _markGroups().forEach(m => { if ((m.naqMarkSeq || 0) > _naqMarkSeq) _naqMarkSeq = m.naqMarkSeq; }); } catch (_) {}
      _naqCanvas.renderAll(); _naqSyncMarks(); _histInit();
    };
    if (a && a.canvas) { try { _naqCanvas.loadFromJSON(a.canvas, _afterLoad); } catch (_) { _histInit(); } }
    else _histInit();
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
  }

  // ══ ڈرائنگ ٹولز — لکیر/تیر/مستطیل/دائرہ/قلم + رنگ/موٹائی ═══════════════
  window._naqSetTool = function (t) {
    _naqTool = t; if (!_naqCanvas) return;
    const pen = (t === 'pen');
    _naqPanning = false;
    _naqCanvas.isDrawingMode = pen;
    if (pen) {
      try { _naqCanvas.freeDrawingBrush = new fabric.PencilBrush(_naqCanvas); } catch (_) {}
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
    if (_naqTool === 'select' || _naqTool === 'pen') return;
    const p = _naqCanvas.getPointer(opt.e); _naqDrawStart = { x: p.x, y: p.y };
    const s = { stroke: _naqStroke, strokeWidth: _naqStrokeW, fill: 'transparent', selectable: false, evented: false };
    if (_naqTool === 'line' || _naqTool === 'arrow') _naqDrawing = new fabric.Line([p.x, p.y, p.x, p.y], { stroke: _naqStroke, strokeWidth: _naqStrokeW, selectable: false, evented: false, strokeLineCap: 'round' });
    else if (_naqTool === 'rect') _naqDrawing = new fabric.Rect(Object.assign({ left: p.x, top: p.y, width: 1, height: 1 }, s));
    else if (_naqTool === 'ellipse') _naqDrawing = new fabric.Ellipse(Object.assign({ left: p.x, top: p.y, rx: 1, ry: 1, originX: 'left', originY: 'top' }, s));
    if (_naqDrawing) { _naqCanvas.add(_naqDrawing); _naqCanvas.renderAll(); }
  }
  function _drawMove(opt) {
    if (_naqPanning) {
      const e = opt.e, vpt = _naqCanvas.viewportTransform;
      vpt[4] += e.clientX - _naqPanLast.x; vpt[5] += e.clientY - _naqPanLast.y;
      _naqPanLast = { x: e.clientX, y: e.clientY }; _naqCanvas.requestRenderAll(); return;
    }
    if (!_naqDrawing || !_naqDrawStart) return;
    const p = _naqCanvas.getPointer(opt.e), s = _naqDrawStart;
    if (_naqTool === 'line' || _naqTool === 'arrow') _naqDrawing.set({ x2: p.x, y2: p.y });
    else if (_naqTool === 'rect') _naqDrawing.set({ left: Math.min(p.x, s.x), top: Math.min(p.y, s.y), width: Math.abs(p.x - s.x), height: Math.abs(p.y - s.y) });
    else if (_naqTool === 'ellipse') _naqDrawing.set({ left: Math.min(p.x, s.x), top: Math.min(p.y, s.y), rx: Math.abs(p.x - s.x) / 2, ry: Math.abs(p.y - s.y) / 2 });
    _naqDrawing.setCoords(); _naqCanvas.renderAll();
  }
  function _drawUp() {
    if (_naqPanning) { _naqPanning = false; _naqCanvas.setCursor('grab'); return; }
    if (!_naqDrawing) return;
    const d = _naqDrawing, tool = _naqTool; _naqDrawing = null; _naqDrawStart = null;
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
    { key: 'north', label: 'شمال تیر', svg: _S(`<path d="M32 56V14" ${_ST}/><path d="M32 8L25 22H39Z" fill="#111"/><text x="32" y="54" text-anchor="middle" font-size="12" fill="#111" font-family="serif">N</text>`) },
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
    } catch (_) {}
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
    try { const r = document.querySelector(`#naq-marks .naq-mrow[data-markid="${g.naqMarkId}"] .naq-mtext`); if (r) r.focus(); } catch (_) {}
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
    if (_naqHist.length > 40) { _naqHist.shift(); _naqHistI--; }
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
      try { _markGroups().forEach(m => { if ((m.naqMarkSeq || 0) > _naqMarkSeq) _naqMarkSeq = m.naqMarkSeq; }); } catch (_) {}
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
  }

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
      fontFamily: "'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif", fontSize: pt2px(16), fill: '#111',
      textAlign: 'right', direction: 'rtl', naqLabel: true, editable: true,
    });
    _naqCanvas.add(t); _naqCanvas.setActiveObject(t); t.enterEditing();
    if (t.hiddenTextarea) { try { t.hiddenTextarea.focus(); } catch (_) {} }
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
    _naqCanvas.renderAll();
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
  window._naqPrint = function () {
    _snapshot(); _persistLocal();
    const doc = document.getElementById('dio-naqsha-doc'); if (!doc) return;
    let png = '', cw = 0, ch = 0;
    if (_naqCanvas) {
      try {
        _naqCanvas.discardActiveObject();
        // زوم/پین کو نظر انداز کر کے اصل (1:1) viewport پر capture کرو
        const vpt = (_naqCanvas.viewportTransform || [1, 0, 0, 1, 0, 0]).slice();
        _naqCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]); _naqCanvas.renderAll();
        cw = _naqCanvas.getWidth(); ch = _naqCanvas.getHeight();
        png = _naqCanvas.toDataURL({ format: 'png', multiplier: 2 });
        _naqCanvas.setViewportTransform(vpt); _naqCanvas.renderAll();
      } catch (_) {}
    }
    const clone = doc.cloneNode(true);
    // canvas → img
    const cwrap = clone.querySelector('#naq-map');
    if (cwrap) {
      const cc = cwrap.querySelector('.canvas-container, #naq-canvas'); if (cc) cc.remove();
      if (png) { const img = document.createElement('img'); img.src = png; img.style.cssText = 'width:100%;height:auto;display:block;'; cwrap.appendChild(img); }
    }
    // inputs → text
    clone.querySelectorAll('input').forEach(inp => { const s = document.createElement('span'); s.textContent = inp.value || ''; s.className = inp.className; inp.replaceWith(s); });
    // select (قسم) → منتخب قدر کا متن
    clone.querySelectorAll('select').forEach(sel => { const s = document.createElement('span'); const opt = sel.options[sel.selectedIndex]; s.textContent = opt ? opt.textContent : ''; s.className = sel.className; sel.replaceWith(s); });
    // no-print controls (▾ picker وغیرہ) ہٹاؤ
    clone.querySelectorAll('.no-print, .naq-caret').forEach(n => n.remove());
    clone.querySelectorAll('[contenteditable]').forEach(n => n.removeAttribute('contenteditable'));

    const a = _active(); const paper = (a && a.paper) || 'legal';
    const html = `<!DOCTYPE html><html dir="rtl" lang="ur"><head><meta charset="UTF-8">
      <style>
        @page{ size:${paper === 'a4' ? 'A4' : 'legal'}; margin:0; }
        *{ -webkit-print-color-adjust:exact; print-color-adjust:exact; box-sizing:border-box; }
        html,body{ margin:0; }
        body{ direction:rtl; font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; color:#000; }
        ${_docCSS(true)}
        .naq-doc{ box-shadow:none !important; border-radius:0 !important; }
      </style></head><body>${clone.outerHTML}</body></html>`;
    if (typeof dioPrint === 'function') dioPrint(html);
    else { const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); w.print(); } }
  };

  // ══ CSS ════════════════════════════════════════════════════════════
  // دستاویز کی CSS — screen اور print دونوں ایک ہی (WYSIWYG)
  function _docCSS(forPrint) {
    // چالان/زمنی کی طرح: دائیں 1 انچ indent، بائیں 0.4 انچ۔ کوئی dotted line نہیں۔
    return `
    /* درخواست (darkhwastain) کی ہو بہو top-4-line ترتیب: دائیں 1in، بائیں 0.4in،
       اوپر/نیچے 1cm؛ line-height 1.9؛ سطر 2/3/4 کا right-indent 0.9in۔ */
    .naq-doc{ background:#fff; color:#111; font-size:14pt; line-height:1.9;
      font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; padding:1cm 1in 1cm 0.4in; --naq-indent:0.9in; }
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
    .naq-caret{ width:20px; height:20px; border:1px solid #cbd5e1; border-radius:5px; background:#fff; font-size:11px; cursor:pointer; }
    .naq-banam-list{ display:block; }
    .naq-acc{ margin:0; }
    .naq-accno{ font-weight:400; }
    /* بحد — بائیں بارڈر کی سیدھ میں، 12pt، ڈیٹا کے گرد ( ) */
    .naq-bahad{ margin-top:6px; text-align:left; font-size:12pt; }
    .naq-bahad .naq-f{ font-size:12pt; }
    .naq-paren{ font-size:12pt; }
    /* عنوان — 18pt، پوری سطر underline؛ bold نہیں؛ قسم dropdown سادہ underline متن (کوئی دائرہ/باکس نہیں) */
    .naq-title{ position:relative; z-index:5; text-align:center; font-weight:400; font-size:18pt; margin:16px 0 6px; }
    .naq-title-t{ text-decoration:underline; text-underline-offset:5px; }
    .naq-type{ -webkit-appearance:none; -moz-appearance:none; appearance:none; font-family:inherit; font-size:18pt; font-weight:400;
      border:none; background:transparent; color:#111; padding:0 2px; cursor:pointer; text-decoration:underline; text-underline-offset:5px; outline:none; }
    .naq-map{ position:relative; margin:2px 0 6px; }
    .naq-map .canvas-container{ margin:0 auto; }
    #naq-canvas{ display:block; }
    .naq-map-resize{ position:absolute; left:0; right:0; bottom:0; height:14px; cursor:ns-resize;
      background:linear-gradient(180deg,transparent,rgba(37,99,235,0.10)); }
    .naq-map-resize::after{ content:'⋯'; position:absolute; left:50%; bottom:0; transform:translateX(-50%); color:#9aa; font-size:12px; }
    /* سمت نما — دائیں بارڈر کی طرف؛ N-S لمبا وہی؛ E-W افقی تھوڑا نیچے */
    .naq-compass{ position:absolute; top:50%; right:-40px; width:116px; height:147px; transform:translateY(-48px); z-index:6; pointer-events:none; }
    .naq-nofab{ padding:36px 16px; text-align:center; color:#b91c1c; }
    .naq-marks-l{ font-weight:700; text-decoration:underline; text-underline-offset:4px; }
    .naq-mrow{ display:flex; align-items:baseline; gap:6px; margin:4px 0; }
    .naq-mno{ white-space:nowrap; font-weight:400; }
    .naq-mtext{ flex:1; min-width:60px; outline:none; }
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
      font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; }
    /* ٹول بار — چالان/زمنی کی طرح چھپی رہے، cursor اوپر لاتے ہی ظاہر (یا لکیر پر tap) */
    .naq-topwrap{ position:sticky; top:0; z-index:30; background:var(--bg-secondary,#f3f4f6); }
    .naq-topbar{ display:flex; align-items:center; gap:8px; padding:0 10px; overflow:hidden;
      max-height:0; opacity:0; transition:max-height .2s ease, opacity .2s ease, padding .2s ease; flex-wrap:wrap; }
    .naq-topwrap:hover .naq-topbar, .naq-topwrap.show .naq-topbar{ max-height:260px; opacity:1; padding:6px 10px; border-bottom:1px solid var(--border,#ccc); }
    .naq-toplip{ height:8px; cursor:pointer; text-align:center; line-height:6px; color:#8aa; font-size:14px;
      background:linear-gradient(180deg,var(--bg-secondary,#eef1f4),rgba(37,99,235,0.10)); border-bottom:1px solid var(--border,#ddd); }
    .naq-topwrap:hover .naq-toplip, .naq-topwrap.show .naq-toplip{ color:var(--accent,#2563eb); }
    /* chip bar — چلتی (افقی scroll)، سطریں نہ ٹوٹیں تاکہ کام کے لیے جگہ ملے */
    .naq-chips{ display:flex; gap:6px; align-items:center; flex-wrap:nowrap; overflow-x:auto; flex:1 1 220px; min-width:0;
      scrollbar-width:thin; }
    .naq-chips::-webkit-scrollbar{ height:6px; }
    .naq-chip{ flex:0 0 auto; }
    .naq-chip{ padding:4px 11px; border:1px solid var(--border,#cbd5e1); border-radius:16px; background:var(--bg-card,#fff);
      color:var(--text-primary,#111); cursor:pointer; font-size:12pt; }
    .naq-chip.on{ background:var(--nav-active,#e0edff); color:var(--accent,#2563eb); border-color:var(--accent,#2563eb); font-weight:700; }
    .naq-chip .naq-x{ color:#b91c1c; font-size:11px; cursor:pointer; }
    .naq-chip.naq-add{ font-weight:800; }
    .naq-tools{ margin-inline-start:auto; display:flex; gap:4px; flex-wrap:wrap; align-items:center; }
    .naq-tb{ min-width:32px; height:30px; padding:0 8px; border:1px solid var(--border,#cbd5e1); border-radius:7px;
      background:var(--bg-card,#fff); color:var(--text-primary,#111); cursor:pointer; font-size:14px; }
    .naq-tb:hover{ background:var(--hover-bg,#eef6ff); }
    .naq-tool.on{ background:var(--nav-active,#e0edff); border-color:var(--accent,#2563eb); color:var(--accent,#2563eb); font-weight:700; }
    .naq-color{ width:32px; height:30px; padding:2px; border:1px solid var(--border,#cbd5e1); border-radius:7px; background:#fff; cursor:pointer; }
    .naq-save{ background:#e8f5e9; border-color:#3a923e; color:#1b5e20; font-weight:700; }
    .naq-print{ background:var(--accent,#2563eb); color:#fff; border-color:var(--accent,#2563eb); }
    .naq-sel{ height:30px; border:1px solid var(--border,#cbd5e1); border-radius:7px; background:#fff; color:#111; font-size:11pt; padding:0 6px; cursor:pointer; }
    .naq-sep{ width:1px; height:22px; background:var(--border,#ccc); margin:0 3px; }
    .naq-scroll{ flex:1; overflow:auto; min-height:0; padding:16px; background:var(--bg-tertiary,#eef1f4); }
    /* دستاویز اصل کاغذ کی چوڑائی پر (screen=print)؛ تنگ اسکرین پر افقی scroll — squish نہیں */
    .naq-doc{ margin:0 auto; box-shadow:0 4px 22px rgba(0,0,0,0.15); border-radius:4px; }
    ${_docCSS(false)}
    /* پولیس علامات پینل */
    .naq-sympanel{ position:fixed; z-index:99998; background:#fff; border:1px solid #0369a1; border-radius:12px;
      box-shadow:0 12px 34px rgba(0,0,0,.28); direction:rtl; width:340px; max-width:94vw; max-height:min(66vh,460px);
      display:flex; flex-direction:column; overflow:hidden; font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; }
    .naq-sympanel-h{ padding:9px 12px; font-weight:700; color:#0369a1; background:#f8fafc; border-bottom:1px solid #e5e7eb;
      display:flex; justify-content:space-between; align-items:center; gap:8px; font-size:13px; }
    .naq-sym-x{ color:#b91c1c; cursor:pointer; font-size:14px; padding:0 4px; }
    .naq-symgrid{ display:grid; grid-template-columns:repeat(4,1fr); gap:7px; padding:11px; overflow:auto; }
    .naq-symcell{ display:flex; flex-direction:column; align-items:center; gap:4px; padding:7px 3px;
      border:1px solid #e5e7eb; border-radius:9px; background:#fff; cursor:pointer; }
    .naq-symcell:hover{ background:#eef6ff; border-color:#2563eb; }
    .naq-symcell svg{ width:34px; height:34px; }
    .naq-symcell span{ font-size:11px; color:#334155; line-height:1.2; }
    @media print{ .naq-topbar,#global-mic-btn,.naq-sympanel{ display:none !important; } }
    `;
  }

})();
