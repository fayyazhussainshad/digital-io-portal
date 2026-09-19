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
    const g = (id) => { const el = document.getElementById(id); return el ? el.value : undefined; };
    a.header = a.header || {};
    ['thana', 'zila', 'sarkar', 'muqadma', 'morkha', 'bajurm'].forEach(k => { const v = g('naq-h-' + k); if (v !== undefined) a.header[k] = v; });
    const t2 = g('naq-h-thana2'); if (t2 !== undefined) a.header.thana = t2;
    const ty = document.getElementById('naq-type'); if (ty) a.type = ty.value;
    a.header.banam = _chosenBanam();
    // امتیازی نشانات
    const rows = document.querySelectorAll('#naq-marks .naq-mtext');
    if (rows.length) a.marks = Array.from(rows).map(r => r.innerText.replace(/ /g, ' ').trim());
    if (_naqCanvas) { try { a.canvas = _naqCanvas.toJSON(['naqLabel']); } catch (_) {} }
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
  // پہلا بلا نمبر، پھر 2،3 … (انگریزی)
  function _banamHTML() {
    const names = _chosenBanam().filter(Boolean);
    if (!names.length) return '<div class="naq-acc" style="color:#999;">—</div>';
    return names.map((n, i) =>
      `<div class="naq-acc">${i === 0 ? '' : '<span class="naq-accno">' + (i + 1) + '.</span> '}${E(n)}</div>`
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
  function _marksHTML(list) {
    const arr = (list && list.length) ? list : [''];
    return arr.map((t, i) =>
      `<div class="naq-mrow"><span class="naq-mno" contenteditable="false">${_MARK_PREFIX(i + 1)}</span>` +
      `<span class="naq-mtext" contenteditable="true" data-mic="true">${E(t)}</span></div>`
    ).join('');
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
    const io = (typeof getIOSignLine === 'function') ? (getIOSignLine() || '') : '';

    container.innerHTML = `
    <style>${_css()}</style>
    <div class="naq-wrap" dir="rtl">

      <div class="naq-topbar no-print">
        <div class="naq-chips" id="naq-chips">${_chipsHTML()}</div>
        <div class="naq-tools">
          <select id="naq-paper" class="naq-sel" onchange="window._naqSetPaper&&_naqSetPaper(this.value)" title="کاغذ">
            <option value="legal" ${paper === 'legal' ? 'selected' : ''}>لیگل</option>
            <option value="a4" ${paper === 'a4' ? 'selected' : ''}>A4</option>
          </select>
          ${fabricOk ? `
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
          <input type="file" id="naq-file" accept="image/*" style="display:none" onchange="window._naqFilePicked&&_naqFilePicked(event)">
          ` : ''}
          <span class="naq-sep"></span>
          <button class="naq-tb naq-save" title="محفوظ" onclick="window.naqSaveNow&&naqSaveNow()">💾 محفوظ</button>
          <button class="naq-tb naq-print" title="چھپائی" onclick="window._naqPrint&&_naqPrint()">🖨️</button>
        </div>
      </div>

      <div class="naq-scroll">
        <div id="dio-naqsha-doc" class="naq-doc naq-${paper}">

          <div class="naq-hrow naq-edge">
            <span><span class="naq-lbl">تھانہ</span> <input id="naq-h-thana" class="naq-in" value="${E(hv.thana)}"></span>
            <span><span class="naq-lbl">ضلع</span> <input id="naq-h-zila" class="naq-in" value="${E(hv.zila)}"></span>
          </div>
          <div class="naq-gap"></div>
          <div class="naq-hrow">
            <span class="naq-lbl">سرکار بذریعہ</span>
            <input id="naq-h-sarkar" class="naq-in naq-in-grow" value="${E(hv.sarkar)}" placeholder="مدعی کا پورا نام، ذات و پتہ">
          </div>
          <div class="naq-hrow naq-firrow">
            <span class="naq-lbl">مقدمہ نمبر</span><input id="naq-h-muqadma" class="naq-in naq-in-sm" value="${E(hv.muqadma)}">
            <span class="naq-lbl">مورخہ</span><input id="naq-h-morkha" class="naq-in naq-in-sm" value="${E(hv.morkha)}">
            <span class="naq-lbl">بجرم</span><input id="naq-h-bajurm" class="naq-in naq-in-md" value="${E(hv.bajurm)}">
            <span class="naq-lbl">تھانہ</span><input id="naq-h-thana2" class="naq-in naq-in-sm" value="${E(hv.thana)}"
              oninput="var t=document.getElementById('naq-h-thana');if(t)t.value=this.value;">
          </div>
          <div class="naq-banam">
            <button class="naq-caret no-print" title="ملزمان منتخب کریں" onclick="window._naqAccPicker&&_naqAccPicker(event)">▾</button>
            <span class="naq-lbl">بنام</span>
            <span id="naq-banam-list" class="naq-banam-list">${_banamHTML()}</span>
          </div>

          <div class="naq-title">نقشہ موقع نظری بلاسکیل
            <select id="naq-type" class="naq-type" onchange="window._naqType&&_naqType(this.value)">
              <option value="waqia" ${a.type === 'waqia' ? 'selected' : ''}>جائے وقوعہ</option>
              <option value="baramad" ${a.type === 'baramad' ? 'selected' : ''}>جائے برامدگی</option>
            </select>
          </div>

          <div class="naq-map" id="naq-map">
            ${_compassSVG()}
            ${fabricOk ? `<canvas id="naq-canvas"></canvas>` : `<div class="naq-nofab">ڈرائنگ لائبریری لوڈ نہیں ہو سکی — ایک بار انٹرنیٹ سے جوڑ کر دوبارہ کھولیں۔</div>`}
          </div>

          <div class="naq-marks-l">امتیازی نشانات:</div>
          <div id="naq-marks" onkeydown="window._naqMarksKey&&_naqMarksKey(event)" oninput="window._naqDirty&&_naqDirty()">${_marksHTML(a.marks)}</div>

          <div class="naq-io">
            <div class="naq-io-nm" contenteditable="true">${E(io)}</div>
            <div class="naq-io-dt" contenteditable="true">${E(a.date || _regDate())}</div>
          </div>

        </div>
      </div>
    </div>`;

    ['thana', 'zila', 'sarkar', 'muqadma', 'morkha', 'bajurm', 'thana2'].forEach(k => {
      const el = document.getElementById('naq-h-' + k); if (el) el.addEventListener('input', _saveSoon);
    });
    if (fabricOk) _initCanvas(a);
  }
  window._renderNaqsha = _renderNaqsha;
  window._naqDirty = _saveSoon;
  window._naqType = function () { _saveSoon(); _refreshChips(); };
  window._naqSetPaper = function (v) { const a = _active(); if (a) a.paper = v; _snapshot(); _persistLocal(); _renderNaqsha(); };

  // ══ Compass — E-W عنوان کی سیدھ میں (اوپر)، N-S لمبا اسی پر fixed ═════
  function _compassSVG() {
    const F = "font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif";
    return `<svg class="naq-compass" viewBox="0 0 92 118" aria-label="سمت نما">
      <line x1="46" y1="10" x2="46" y2="112" stroke="#111" stroke-width="1.7"/>
      <polygon points="46,3 41,15 51,15" fill="#111"/>
      <polygon points="46,116 41,104 51,104" fill="#111"/>
      <line x1="24" y1="30" x2="68" y2="30" stroke="#111" stroke-width="1.7"/>
      <polygon points="72,30 60,25 60,35" fill="#111"/>
      <polygon points="20,30 32,25 32,35" fill="#111"/>
      <text x="46" y="9"   text-anchor="middle" font-size="11" font-weight="700" style="${F}">شمال</text>
      <text x="46" y="118" text-anchor="middle" font-size="11" font-weight="700" style="${F}">جنوب</text>
      <text x="74" y="33"  text-anchor="start"  font-size="11" font-weight="700" style="${F}">مشرق</text>
      <text x="18" y="33"  text-anchor="end"    font-size="11" font-weight="700" style="${F}">مغرب</text>
    </svg>`;
  }

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
    const w = Math.max(280, map.clientWidth - 2);
    const h = Math.round(w * 0.66);
    _naqCanvas.setWidth(w); _naqCanvas.setHeight(h); _naqCanvas.renderAll();
    map.style.minHeight = h + 'px';
  }
  function _initCanvas(a) {
    const el = document.getElementById('naq-canvas'); if (!el || !window.fabric) return;
    _naqCanvas = new fabric.Canvas('naq-canvas', { backgroundColor: 'transparent', preserveObjectStacking: true, selection: true });
    _sizeCanvas();
    window.addEventListener('resize', _sizeCanvas);
    if (a && a.canvas) { try { _naqCanvas.loadFromJSON(a.canvas, () => _naqCanvas.renderAll()); } catch (_) {} }
    ['object:modified', 'object:added', 'object:removed', 'text:changed'].forEach(ev => _naqCanvas.on(ev, _saveSoon));
    const map = document.getElementById('naq-map');
    if (map) { map.addEventListener('paste', _pasteEvt); map.setAttribute('tabindex', '0'); }
    document.addEventListener('paste', _docPaste);
    _naqCanvas.on('mouse:down', _cropDown); _naqCanvas.on('mouse:move', _cropMove); _naqCanvas.on('mouse:up', _cropUp);
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
    if (_naqCanvas) { try { _naqCanvas.discardActiveObject(); _naqCanvas.renderAll(); cw = _naqCanvas.getWidth(); ch = _naqCanvas.getHeight(); png = _naqCanvas.toDataURL({ format: 'png', multiplier: 2 }); } catch (_) {} }
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
    const side = (typeof _ch173SideMargin === 'function') ? _ch173SideMargin() : (paper === 'a4' ? '0.5cm' : '0.2cm');
    const html = `<!DOCTYPE html><html dir="rtl" lang="ur"><head><meta charset="UTF-8">
      <style>
        @page{ size:${paper === 'a4' ? 'A4' : 'legal'}; margin:0; }
        *{ -webkit-print-color-adjust:exact; print-color-adjust:exact; box-sizing:border-box; }
        html,body{ margin:0; }
        body{ direction:rtl; font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; color:#000; }
        ${_docCSS(true, side)}
        .naq-doc{ box-shadow:none !important; border-radius:0 !important; }
      </style></head><body>${clone.outerHTML}</body></html>`;
    if (typeof dioPrint === 'function') dioPrint(html);
    else { const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); w.print(); } }
  };

  // ══ CSS ════════════════════════════════════════════════════════════
  // دستاویز کی CSS — screen اور print دونوں ایک ہی (WYSIWYG)
  function _docCSS(forPrint, sideMargin) {
    const side = sideMargin || '0.2cm';
    return `
    .naq-doc{ background:#fff; color:#111; font-size:14pt; line-height:1.6;
      font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; }
    .naq-doc.naq-legal{ width:8.5in; padding:0.5in ${side}; }
    .naq-doc.naq-a4{ width:8.27in; padding:0.5in ${side}; }
    ${forPrint ? `.naq-doc{ width:100% !important; }` : ''}
    .naq-hrow{ display:flex; align-items:baseline; gap:6px; margin:3px 0; flex-wrap:wrap; }
    .naq-edge{ justify-content:space-between; flex-wrap:nowrap; }
    .naq-edge > span{ display:inline-flex; align-items:baseline; gap:6px; }
    .naq-firrow{ gap:4px; }
    .naq-lbl{ font-weight:700; white-space:nowrap; }
    .naq-gap{ height:1.1em; }
    .naq-in{ border:none; border-bottom:1px dotted #7a7a7a; background:transparent; color:#111;
      font-family:inherit; font-size:14pt; padding:1px 5px; min-width:64px; outline:none; }
    .naq-in:focus{ border-bottom-color:#2563eb; }
    .naq-in-sm{ min-width:88px; } .naq-in-md{ min-width:150px; flex:1 1 auto; } .naq-in-grow{ flex:1 1 auto; min-width:200px; }
    .naq-banam{ display:flex; align-items:baseline; gap:8px; margin-top:4px; }
    .naq-caret{ width:22px; height:22px; border:1px solid #cbd5e1; border-radius:5px; background:#fff; font-size:12px; cursor:pointer; flex:0 0 auto; }
    .naq-banam-list{ flex:1; }
    .naq-acc{ padding-inline-start:1in; margin:2px 0; }
    .naq-accno{ font-weight:700; }
    .naq-title{ text-align:center; font-weight:700; font-size:16pt; margin:12px 0 6px;
      text-decoration:underline; text-underline-offset:5px; }
    .naq-type{ font-family:inherit; font-size:13pt; border:1px solid #cbd5e1; border-radius:6px; padding:1px 6px; background:#fff; color:#111; }
    .naq-map{ position:relative; min-height:3.2in; margin:2px 0 6px; }
    .naq-map .canvas-container{ margin:0 auto; }
    #naq-canvas{ display:block; }
    .naq-compass{ position:absolute; top:0; right:6px; width:78px; height:100px; z-index:5; pointer-events:none; }
    .naq-nofab{ padding:36px 16px; text-align:center; color:#b91c1c; }
    .naq-marks-l{ font-weight:700; text-decoration:underline; text-underline-offset:4px; margin:6px 0 4px; }
    .naq-mrow{ display:flex; align-items:baseline; gap:6px; margin:4px 0; }
    .naq-mno{ white-space:nowrap; }
    .naq-mtext{ flex:1; min-width:60px; border-bottom:1px dotted #7a7a7a; outline:none; }
    .naq-io{ margin-top:20px; text-align:left; direction:rtl; line-height:1.5; }
    .naq-io-nm{ font-weight:700; } .naq-io-dt{ font-size:13pt; }
    `;
  }
  // پورا صفحہ (topbar + scroll) کی CSS
  function _css() {
    return `
    .naq-wrap{ display:flex; flex-direction:column; height:100%; direction:rtl;
      font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; }
    .naq-topbar{ display:flex; align-items:center; gap:8px; padding:7px 10px; border-bottom:1px solid var(--border,#ccc);
      background:var(--bg-secondary,#f3f4f6); flex-wrap:wrap; position:sticky; top:0; z-index:20; }
    .naq-chips{ display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
    .naq-chip{ padding:4px 11px; border:1px solid var(--border,#cbd5e1); border-radius:16px; background:var(--bg-card,#fff);
      color:var(--text-primary,#111); cursor:pointer; font-size:12pt; }
    .naq-chip.on{ background:var(--nav-active,#e0edff); color:var(--accent,#2563eb); border-color:var(--accent,#2563eb); font-weight:700; }
    .naq-chip .naq-x{ color:#b91c1c; font-size:11px; cursor:pointer; }
    .naq-chip.naq-add{ font-weight:800; }
    .naq-tools{ margin-inline-start:auto; display:flex; gap:4px; flex-wrap:wrap; align-items:center; }
    .naq-tb{ min-width:32px; height:30px; padding:0 8px; border:1px solid var(--border,#cbd5e1); border-radius:7px;
      background:var(--bg-card,#fff); color:var(--text-primary,#111); cursor:pointer; font-size:14px; }
    .naq-tb:hover{ background:var(--hover-bg,#eef6ff); }
    .naq-save{ background:#e8f5e9; border-color:#3a923e; color:#1b5e20; font-weight:700; }
    .naq-print{ background:var(--accent,#2563eb); color:#fff; border-color:var(--accent,#2563eb); }
    .naq-sel{ height:30px; border:1px solid var(--border,#cbd5e1); border-radius:7px; background:#fff; color:#111; font-size:11pt; padding:0 6px; cursor:pointer; }
    .naq-sep{ width:1px; height:22px; background:var(--border,#ccc); margin:0 3px; }
    .naq-scroll{ flex:1; overflow:auto; min-height:0; padding:16px; background:var(--bg-tertiary,#eef1f4); }
    .naq-doc{ margin:0 auto; box-shadow:0 4px 22px rgba(0,0,0,0.15); border-radius:4px; max-width:100%; }
    ${_docCSS(false)}
    @media print{ .naq-topbar,#global-mic-btn{ display:none !important; } }
    `;
  }

})();
