/* ═══════════════════════════════════════════════════════════════════
   DIGITAL IO — نقشہ موقع  (Site Plan / Scene Sketch)  ·  naqsha-mauqa.js
   ───────────────────────────────────────────────────────────────────
   • خود مکمل ماڈیول (self-contained)۔ report173.js / کسی locked ماڈیول کو
     ہاتھ نہیں لگاتا۔
   • مکمل RTL، تمام فونٹ points (pt) میں، تاریخ formatDate() → DD/MM/YYYY۔
   • ڈرائنگ ایریا Fabric.js canvas — تصاویر داخل/بدلیں/سرکائیں/سائز/گھمائیں/
     پلٹیں/کاٹیں/کاپی/چسپاں/حذف/آگے-پیچھے + متن کے لیبل۔ ایک سے زائد تصاویر۔
   • ہر سکیچ فی مقدمہ localStorage میں محفوظ (تصاویر، جگہ، زاویہ، لیبل،
     قسم، ہیڈر)، واپسی پر بعینہٖ لوڈ۔
   • چھپائی: صرف دستاویز — کوئی sidebar/tab/toolbar نہیں (dioPrint)۔ عام مارجن۔
   • عالمی مائیک (global-mic) عام focusable خانوں پر خود چلتا ہے — کوئی
     فی-خانہ مائیک بٹن نہیں۔
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── چھوٹے مددگار (globals na milen to bhi na toote) ──────────────
  const E   = (v) => (typeof esc === 'function') ? esc(v) : String(v == null ? '' : v)
                       .replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SAN = (v) => (typeof sanitizeHtml === 'function') ? sanitizeHtml(v) : String(v == null ? '' : v);
  const TOAST = (m, t) => { try { if (typeof showToast === 'function') showToast(m, t || 'info'); } catch (_) {} };
  const FDATE = (d) => { try { return (typeof formatDate === 'function') ? formatDate(d) : (d || ''); } catch (_) { return d || ''; } };
  const PT2PX = 96 / 72;                       // 1pt = 1.3333px
  const px2pt = (px) => Math.round((px / PT2PX) * 10) / 10;
  const pt2px = (pt) => pt * PT2PX;

  // ── حالت ─────────────────────────────────────────────────────────
  let _naqCaseId = null;
  let _naqCase   = {};
  let _naqOff    = {};
  let _naqAccused = '';                          // بنام (auto)
  let _naqData   = { sketches: [], activeId: null };
  let _naqCanvas = null;                         // fabric.Canvas
  let _naqClip   = null;                         // cut/copy clipboard (fabric object json)
  let _naqSaveT  = null;                         // debounce
  let _naqCrop   = null;                         // crop mode state
  const FABRIC_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js';

  const _key = () => 'dio_naqsha_' + (_naqCaseId || 'nocase');
  const _uid = () => 'nq' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // ══ Fabric loader (lazy, isolated) ════════════════════════════════
  function _ensureFabric() {
    return new Promise((resolve, reject) => {
      if (window.fabric) return resolve(window.fabric);
      let s = document.getElementById('naq-fabric-lib');
      if (s) { s.addEventListener('load', () => resolve(window.fabric)); s.addEventListener('error', reject); return; }
      s = document.createElement('script');
      s.id = 'naq-fabric-lib';
      s.src = FABRIC_SRC;
      s.onload = () => window.fabric ? resolve(window.fabric) : reject(new Error('fabric load fail'));
      s.onerror = () => reject(new Error('fabric network fail'));
      document.head.appendChild(s);
    });
  }

  // ══ Case data auto-fetch (وہی ماخذ جو چالان/report173 پڑھتا ہے) ═════
  async function _loadCase() {
    _naqCaseId = (typeof currentCaseId !== 'undefined' && currentCaseId)
              || (typeof _misalCaseId !== 'undefined' && _misalCaseId) || null;
    _naqOff = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
    _naqCase = {};
    if (_naqCaseId && typeof getCase === 'function') {
      try { _naqCase = (await getCase(_naqCaseId)) || {}; } catch (_) { _naqCase = {}; }
    }
    // بنام — case_accused سے (وہی جدول جو چالان پڑھتا ہے)
    _naqAccused = '';
    if (_naqCaseId && typeof supabaseClient !== 'undefined' && supabaseClient) {
      try {
        const { data } = await supabaseClient.from('case_accused')
          .select('name,accused_type').eq('case_id', _naqCaseId).order('created_at', { ascending: true });
        _naqAccused = (data || []).filter(a => (a.accused_type || 'fir') === 'fir')
          .map(a => (a.name || '').trim()).filter(Boolean).join('، ');
      } catch (_) { _naqAccused = ''; }
    }
  }

  // AUTO اقدار
  function _auto() {
    const c = _naqCase || {}, o = _naqOff || {};
    const jurm = [c.section_of_law, c.offence_type].map(x => (x || '').trim()).filter(Boolean).join(' ');
    return {
      thana:  (o.station || c.case_station || '').trim(),
      zila:   (o.district || c.district || 'ملتان').trim(),
      sarkar: '',
      muqadma: (c.fir_number || '').trim(),
      morkha: FDATE(c.fir_date) || '',
      bajurm: jurm,
      banam:  (_naqAccused || '').trim(),
    };
  }

  // ══ Persist ════════════════════════════════════════════════════════
  function _load() {
    try { _naqData = JSON.parse(localStorage.getItem(_key()) || 'null') || { sketches: [], activeId: null }; }
    catch (_) { _naqData = { sketches: [], activeId: null }; }
    if (!Array.isArray(_naqData.sketches)) _naqData.sketches = [];
    if (!_naqData.sketches.length) {
      const s = _newSketch('waqia');
      _naqData.sketches.push(s);
      _naqData.activeId = s.id;
    }
    if (!_naqData.activeId || !_naqData.sketches.some(s => s.id === _naqData.activeId))
      _naqData.activeId = _naqData.sketches[0].id;
  }
  function _persist() {
    try { localStorage.setItem(_key(), JSON.stringify(_naqData)); } catch (_) {}
  }
  function _newSketch(type) {
    return { id: _uid(), type: type || 'waqia', canvas: null, marks: '', header: _auto() };
  }
  const _active = () => _naqData.sketches.find(s => s.id === _naqData.activeId) || _naqData.sketches[0];

  // Debounced save-from-DOM+canvas → active sketch
  function _snapshot() {
    const a = _active(); if (!a) return;
    // header inputs
    const h = {};
    ['thana', 'zila', 'sarkar', 'muqadma', 'morkha', 'bajurm', 'banam'].forEach(k => {
      const el = document.getElementById('naq-h-' + k);
      if (el) h[k] = el.value;
    });
    a.header = h;
    const mk = document.getElementById('naq-marks');
    if (mk) a.marks = mk.value;
    const ty = document.getElementById('naq-type');
    if (ty) a.type = ty.value;
    if (_naqCanvas) { try { a.canvas = _naqCanvas.toJSON(['selectable', 'naqLabel']); } catch (_) {} }
  }
  function _saveSoon() {
    clearTimeout(_naqSaveT);
    _naqSaveT = setTimeout(() => { _snapshot(); _persist(); }, 500);
  }

  // ══ Sidebar registration ═══════════════════════════════════════════
  if (typeof registerPage === 'function') registerPage('naqsha', _renderNaqsha);
  window._renderNaqsha = _renderNaqsha;
  window._naqGetCanvas = () => _naqCanvas;   // فعال canvas تک رسائی

  // ══ Render ═════════════════════════════════════════════════════════
  async function _renderNaqsha(container) {
    container = container || document.getElementById('page-content');
    if (!container) return;
    container.innerHTML = `<div style="padding:40px;text-align:center;direction:rtl;color:var(--text-muted);">
      <div style="font-size:40px;">🗺️</div>
      <div style="font-size:14pt;margin-top:8px;">نقشہ موقع کھل رہا ہے…</div></div>`;

    await _loadCase();
    _load();

    let fabricOk = true;
    try { await _ensureFabric(); } catch (_) { fabricOk = false; }

    // full-screen doc view
    try { document.body.classList.add('workspace-mode'); window._inWorkspace = true; } catch (_) {}

    const a = _active();
    const hv = Object.assign({}, _auto(), a.header || {});   // AUTO + overrides

    container.innerHTML = `
    <style>${_css()}</style>
    <div class="naq-wrap" dir="rtl">

      <div class="naq-topbar no-print">
        <div class="naq-chips" id="naq-chips">${_chipsHTML()}</div>
        <div style="margin-right:auto;display:flex;gap:6px;align-items:center;">
          <button class="naq-btn naq-print" onclick="window._naqPrint()" title="چھپائی">🖨️ چھپائی</button>
        </div>
      </div>

      <div class="naq-scroll">
        <div id="dio-naqsha-doc" class="naq-doc">

          <div class="naq-header">
            <div class="naq-hrow">
              <span class="naq-lbl">تھانہ</span><input id="naq-h-thana" class="naq-in" value="${E(hv.thana)}">
              <span class="naq-lbl">ضلع</span><input id="naq-h-zila" class="naq-in" value="${E(hv.zila)}">
            </div>
            <div class="naq-hrow">
              <span class="naq-lbl">سرکار بذریعہ:</span><input id="naq-h-sarkar" class="naq-in naq-in-wide" value="${E(hv.sarkar)}">
            </div>
            <div class="naq-hrow">
              <span class="naq-lbl">مقدمہ نمبر</span><input id="naq-h-muqadma" class="naq-in naq-in-sm" value="${E(hv.muqadma)}">
              <span class="naq-lbl">مورخہ</span><input id="naq-h-morkha" class="naq-in naq-in-sm" value="${E(hv.morkha)}">
              <span class="naq-lbl">بجرم</span><input id="naq-h-bajurm" class="naq-in naq-in-md" value="${E(hv.bajurm)}">
              <span class="naq-lbl">تھانہ</span><input id="naq-h-thana2" class="naq-in naq-in-sm" value="${E(hv.thana)}" oninput="(function(v){var t=document.getElementById('naq-h-thana');if(t)t.value=v;})(this.value)">
            </div>
            <div class="naq-hrow">
              <span class="naq-lbl">بنام:</span><input id="naq-h-banam" class="naq-in naq-in-wide" value="${E(hv.banam)}">
            </div>
          </div>

          <div class="naq-title">
            <span>نقشہ موقع نظری بلاسکیل</span>
            <select id="naq-type" class="naq-type" onchange="window._naqTypeChange&&_naqTypeChange(this.value)">
              <option value="waqia" ${a.type === 'waqia' ? 'selected' : ''}>جائے وقوعہ</option>
              <option value="baramad" ${a.type === 'baramad' ? 'selected' : ''}>جائے برامدگی</option>
            </select>
          </div>

          <div class="naq-draw-wrap" id="naq-draw-wrap">
            ${fabricOk
              ? `<canvas id="naq-canvas"></canvas>`
              : `<div class="naq-nofab">ڈرائنگ لائبریری لوڈ نہیں ہو سکی۔ انٹرنیٹ سے ایک بار جوڑ کر دوبارہ کھولیں (پھر آف لائن بھی چلے گی)۔</div>`}
            ${_compassHTML()}
          </div>

          <div class="naq-marks-label">امتیازی نشانات:</div>
          <textarea id="naq-marks" class="naq-marks" placeholder="یہاں امتیازی نشانات لکھیں…" oninput="window._naqDirty&&_naqDirty()">${E(a.marks || '')}</textarea>

        </div>
      </div>

      ${fabricOk ? _toolbarHTML() : ''}
    </div>`;

    // header inputs → dirty
    ['thana', 'zila', 'sarkar', 'muqadma', 'morkha', 'bajurm', 'banam'].forEach(k => {
      const el = document.getElementById('naq-h-' + k);
      if (el) el.addEventListener('input', _saveSoon);
    });
    const t2 = document.getElementById('naq-h-thana2');
    if (t2) t2.addEventListener('input', _saveSoon);

    if (fabricOk) _initCanvas(a);
  }

  // ══ Chips / tabs (multiple sketches) ═══════════════════════════════
  function _chipsHTML() {
    const label = (s) => (s.type === 'baramad' ? 'جائے برامدگی' : 'جائے وقوعہ');
    return _naqData.sketches.map(s =>
      `<span class="naq-chip ${s.id === _naqData.activeId ? 'on' : ''}" onclick="window._naqSwitch&&_naqSwitch('${s.id}')">
        ${E(label(s))}
        ${_naqData.sketches.length > 1 ? `<b class="naq-x" title="حذف" onclick="event.stopPropagation();window._naqDelSketch&&_naqDelSketch('${s.id}')">✕</b>` : ''}
      </span>`).join('')
      + `<span class="naq-chip naq-add" title="نیا نقشہ" onclick="window._naqAddSketch&&_naqAddSketch()">➕</span>`;
  }
  function _refreshChips() { const c = document.getElementById('naq-chips'); if (c) c.innerHTML = _chipsHTML(); }

  window._naqSwitch = function (id) {
    if (id === _naqData.activeId) return;
    _snapshot(); _persist();
    _naqData.activeId = id; _persist();
    _renderNaqsha(document.getElementById('page-content'));
  };
  window._naqAddSketch = function () {
    _snapshot();
    const s = _newSketch(_naqData.sketches.some(x => x.type === 'waqia') ? 'baramad' : 'waqia');
    _naqData.sketches.push(s); _naqData.activeId = s.id; _persist();
    _renderNaqsha(document.getElementById('page-content'));
  };
  window._naqDelSketch = function (id) {
    if (_naqData.sketches.length <= 1) return;
    if (typeof confirm === 'function' && !confirm('یہ نقشہ حذف کریں؟')) return;
    _naqData.sketches = _naqData.sketches.filter(s => s.id !== id);
    if (_naqData.activeId === id) _naqData.activeId = _naqData.sketches[0].id;
    _persist();
    _renderNaqsha(document.getElementById('page-content'));
  };
  window._naqTypeChange = function () { _saveSoon(); _refreshChips(); };
  window._naqDirty = _saveSoon;

  // ══ Compass ════════════════════════════════════════════════════════
  function _compassHTML() {
    return `<div class="naq-compass" id="naq-compass" aria-label="سمت نما">
      <svg viewBox="0 0 120 120" width="108" height="108">
        <circle cx="60" cy="60" r="30" fill="none" stroke="#111" stroke-width="1.4"/>
        <polygon points="60,10 54,40 66,40" fill="#111"/>
        <polygon points="60,110 54,80 66,80" fill="#111"/>
        <polygon points="110,60 80,54 80,66" fill="#111"/>
        <polygon points="10,60 40,54 40,66" fill="#111"/>
        <line x1="60" y1="40" x2="60" y2="80" stroke="#111" stroke-width="1.2"/>
        <line x1="40" y1="60" x2="80" y2="60" stroke="#111" stroke-width="1.2"/>
        <text x="60" y="8"   text-anchor="middle" font-size="12" font-weight="700" font-family="'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif">شمال</text>
        <text x="60" y="119" text-anchor="middle" font-size="12" font-weight="700" font-family="'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif">جنوب</text>
        <text x="118" y="64" text-anchor="end"    font-size="12" font-weight="700" font-family="'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif">مشرق</text>
        <text x="2"  y="64"  text-anchor="start"  font-size="12" font-weight="700" font-family="'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif">مغرب</text>
      </svg>
    </div>`;
  }

  // ══ Floating image toolbar ═════════════════════════════════════════
  function _toolbarHTML() {
    const b = (fn, t, ic) => `<button class="naq-tb-btn" title="${t}" onclick="window.${fn}&&${fn}()">${ic}</button>`;
    const sep = '<span class="naq-tb-sep"></span>';
    return `<div class="naq-tb no-print" id="naq-tb" onmousedown="event.preventDefault()">
      ${b('_naqInsertImg', 'تصویر داخل کریں', '🖼️')}
      ${b('_naqReplaceImg', 'تصویر بدلیں', '🔁')}
      ${b('_naqAddText', 'متن کا خانہ', '🅣')}
      ${sep}
      ${b('_naqRotL', 'بائیں 90°', '⟲')}
      ${b('_naqRotR', 'دائیں 90°', '⟳')}
      ${b('_naqFlipH', 'افقی پلٹ', '⇋')}
      ${b('_naqFlipV', 'عمودی پلٹ', '⇅')}
      ${b('_naqCropStart', 'کراپ', '✂️')}
      ${sep}
      ${b('_naqCut', 'کاٹیں', '✀')}
      ${b('_naqCopy', 'کاپی', '⧉')}
      ${b('_naqPaste', 'چسپاں', '📋')}
      ${b('_naqDelete', 'حذف', '🗑️')}
      ${sep}
      ${b('_naqForward', 'آگے', '⬆️')}
      ${b('_naqBackward', 'پیچھے', '⬇️')}
      ${sep}
      <select class="naq-tb-sel" id="naq-fontpt" title="متن کا سائز (pt)" onchange="window._naqSetFont&&_naqSetFont(this.value)">
        ${[10, 12, 14, 16, 18, 20, 24, 28, 36].map(p => `<option value="${p}" ${p === 16 ? 'selected' : ''}>${p} pt</option>`).join('')}
      </select>
      <input type="file" id="naq-file" accept="image/*" style="display:none" onchange="window._naqFilePicked&&_naqFilePicked(event)">
    </div>`;
  }

  // ══ Canvas init ════════════════════════════════════════════════════
  function _sizeCanvasEl() {
    const wrap = document.getElementById('naq-draw-wrap');
    if (!wrap || !_naqCanvas) return;
    const w = Math.max(320, wrap.clientWidth - 4);
    const h = Math.max(360, Math.round(w * 0.72));
    _naqCanvas.setWidth(w); _naqCanvas.setHeight(h); _naqCanvas.renderAll();
  }
  function _initCanvas(a) {
    const el = document.getElementById('naq-canvas');
    if (!el || !window.fabric) return;
    _naqCanvas = new fabric.Canvas('naq-canvas', {
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: true,
    });
    _sizeCanvasEl();
    window.addEventListener('resize', _naqOnResize);

    // load saved
    if (a && a.canvas) {
      try {
        _naqCanvas.loadFromJSON(a.canvas, () => { _naqCanvas.renderAll(); });
      } catch (_) {}
    }

    // auto-save on any change
    ['object:modified', 'object:added', 'object:removed', 'text:changed'].forEach(ev =>
      _naqCanvas.on(ev, _saveSoon));

    // clipboard paste of images (Ctrl+V / mobile paste)
    const wrap = document.getElementById('naq-draw-wrap');
    if (wrap) {
      wrap.addEventListener('paste', _naqPasteEvent);
      wrap.setAttribute('tabindex', '0');
    }
    document.addEventListener('paste', _naqDocPaste);

    // crop interactions
    _naqCanvas.on('mouse:down', _cropDown);
    _naqCanvas.on('mouse:move', _cropMove);
    _naqCanvas.on('mouse:up', _cropUp);
  }
  function _naqOnResize() { _sizeCanvasEl(); }

  // ══ Image insert / replace / file pick / paste ═════════════════════
  let _naqReplaceMode = false;
  window._naqInsertImg = function () { _naqReplaceMode = false; const f = document.getElementById('naq-file'); if (f) { f.value = ''; f.click(); } };
  window._naqReplaceImg = function () {
    const o = _naqCanvas && _naqCanvas.getActiveObject();
    if (!o || o.type !== 'image') { TOAST('پہلے کوئی تصویر منتخب کریں', 'info'); return; }
    _naqReplaceMode = true; const f = document.getElementById('naq-file'); if (f) { f.value = ''; f.click(); }
  };
  window._naqFilePicked = function (ev) {
    const file = ev && ev.target && ev.target.files && ev.target.files[0];
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => { _naqReplaceMode ? _replaceActiveWith(rd.result) : _addImage(rd.result); };
    rd.readAsDataURL(file);
  };
  function _addImage(dataUrl) {
    if (!window.fabric || !_naqCanvas) return;
    fabric.Image.fromURL(dataUrl, (img) => {
      const cw = _naqCanvas.getWidth(), ch = _naqCanvas.getHeight();
      const sc = Math.min(1, (cw * 0.6) / img.width, (ch * 0.6) / img.height);
      img.set({ left: cw / 2, top: ch / 2, originX: 'center', originY: 'center', scaleX: sc, scaleY: sc });
      _naqCanvas.add(img); _naqCanvas.setActiveObject(img); _naqCanvas.renderAll(); _saveSoon();
    }, { crossOrigin: 'anonymous' });
  }
  function _replaceActiveWith(dataUrl) {
    const o = _naqCanvas && _naqCanvas.getActiveObject();
    if (!o || o.type !== 'image') return;
    o.setSrc(dataUrl, () => { _naqCanvas.renderAll(); _saveSoon(); }, { crossOrigin: 'anonymous' });
  }
  function _naqPasteEvent(e) {
    const items = (e.clipboardData || window.clipboardData || {}).items || [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type && items[i].type.indexOf('image') === 0) {
        const f = items[i].getAsFile();
        if (f) { const rd = new FileReader(); rd.onload = () => _addImage(rd.result); rd.readAsDataURL(f); e.preventDefault(); return; }
      }
    }
  }
  function _naqDocPaste(e) {
    // only when naqsha open and no editable text focused
    if (!_naqCanvas) return;
    const ae = document.activeElement;
    if (ae && (ae.isContentEditable || /^(input|textarea)$/i.test(ae.tagName || ''))) return;
    _naqPasteEvent(e);
  }

  // ══ Text annotation ════════════════════════════════════════════════
  window._naqAddText = function () {
    if (!window.fabric || !_naqCanvas) return;
    const t = new fabric.IText('یہاں لکھیں', {
      left: _naqCanvas.getWidth() / 2, top: _naqCanvas.getHeight() / 2,
      originX: 'center', originY: 'center',
      fontFamily: "'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif",
      fontSize: pt2px(16), fill: '#111', textAlign: 'right',
      direction: 'rtl', naqLabel: true, editable: true,
    });
    _naqCanvas.add(t); _naqCanvas.setActiveObject(t);
    t.enterEditing(); if (t.hiddenTextarea) { try { t.hiddenTextarea.focus(); } catch (_) {} }
    _naqCanvas.renderAll(); _saveSoon();
  };
  window._naqSetFont = function (pt) {
    const o = _naqCanvas && _naqCanvas.getActiveObject();
    if (!o || (o.type !== 'i-text' && o.type !== 'text' && o.type !== 'textbox')) { TOAST('پہلے کوئی متن منتخب کریں', 'info'); return; }
    o.set('fontSize', pt2px(parseFloat(pt) || 16)); _naqCanvas.renderAll(); _saveSoon();
  };

  // ══ Transform tools ════════════════════════════════════════════════
  const _act = () => _naqCanvas && _naqCanvas.getActiveObject();
  window._naqRotL = function () { const o = _act(); if (!o) return; o.rotate(((o.angle || 0) - 90) % 360); _naqCanvas.renderAll(); _saveSoon(); };
  window._naqRotR = function () { const o = _act(); if (!o) return; o.rotate(((o.angle || 0) + 90) % 360); _naqCanvas.renderAll(); _saveSoon(); };
  window._naqFlipH = function () { const o = _act(); if (!o) return; o.set('flipX', !o.flipX); _naqCanvas.renderAll(); _saveSoon(); };
  window._naqFlipV = function () { const o = _act(); if (!o) return; o.set('flipY', !o.flipY); _naqCanvas.renderAll(); _saveSoon(); };
  window._naqDelete = function () { const o = _act(); if (!o) return; if (o.isEditing) return; _naqCanvas.remove(o); _naqCanvas.discardActiveObject(); _naqCanvas.renderAll(); _saveSoon(); };
  window._naqForward = function () { const o = _act(); if (!o) return; _naqCanvas.bringForward(o); _naqCanvas.renderAll(); _saveSoon(); };
  window._naqBackward = function () { const o = _act(); if (!o) return; _naqCanvas.sendBackwards(o); _naqCanvas.renderAll(); _saveSoon(); };

  // Cut / Copy / Paste (internal objects)
  window._naqCopy = function () { const o = _act(); if (!o) { TOAST('پہلے کوئی چیز منتخب کریں', 'info'); return; } o.clone((c) => { _naqClip = c; TOAST('کاپی ہو گیا', 'success'); }, ['naqLabel']); };
  window._naqCut = function () { const o = _act(); if (!o) return; o.clone((c) => { _naqClip = c; _naqCanvas.remove(o); _naqCanvas.discardActiveObject(); _naqCanvas.renderAll(); _saveSoon(); }, ['naqLabel']); };
  window._naqPaste = function () {
    if (!_naqClip) { TOAST('پہلے کاپی/کاٹیں', 'info'); return; }
    _naqClip.clone((c) => {
      c.set({ left: (c.left || 0) + 24, top: (c.top || 0) + 24, evented: true });
      if (c.type === 'activeSelection') { c.canvas = _naqCanvas; c.forEachObject(o => _naqCanvas.add(o)); }
      else _naqCanvas.add(c);
      _naqCanvas.setActiveObject(c); _naqCanvas.renderAll(); _saveSoon();
    }, ['naqLabel']);
  };

  // ══ Crop (rubber-band on selected image) ═══════════════════════════
  window._naqCropStart = function () {
    const o = _act();
    if (!o || o.type !== 'image') { TOAST('پہلے کوئی تصویر منتخب کریں', 'info'); return; }
    _naqCrop = { img: o, rect: null, sx: 0, sy: 0 };
    _naqCanvas.discardActiveObject();
    _naqCanvas.selection = false;
    _naqCanvas.defaultCursor = 'crosshair';
    _naqCanvas.renderAll();
    TOAST('تصویر پر مستطیل کھینچیں — اسی حصے تک کراپ ہو جائے گی', 'info');
  };
  function _cropDown(opt) {
    if (!_naqCrop) return;
    const p = _naqCanvas.getPointer(opt.e);
    _naqCrop.sx = p.x; _naqCrop.sy = p.y;
    _naqCrop.rect = new fabric.Rect({
      left: p.x, top: p.y, width: 1, height: 1,
      fill: 'rgba(37,99,235,0.15)', stroke: '#2563eb', strokeDashArray: [5, 4],
      strokeWidth: 1, selectable: false, evented: false,
    });
    _naqCanvas.add(_naqCrop.rect);
  }
  function _cropMove(opt) {
    if (!_naqCrop || !_naqCrop.rect) return;
    const p = _naqCanvas.getPointer(opt.e);
    _naqCrop.rect.set({
      left: Math.min(p.x, _naqCrop.sx), top: Math.min(p.y, _naqCrop.sy),
      width: Math.abs(p.x - _naqCrop.sx), height: Math.abs(p.y - _naqCrop.sy),
    });
    _naqCanvas.renderAll();
  }
  function _cropUp() {
    if (!_naqCrop) return;
    const cr = _naqCrop.rect, img = _naqCrop.img;
    _naqCanvas.selection = true; _naqCanvas.defaultCursor = 'default';
    if (cr && img && cr.width > 6 && cr.height > 6) {
      // rect (canvas coords) → image local (account for scale, origin center, flips)
      const sX = img.scaleX || 1, sY = img.scaleY || 1;
      const iw = img.width * sX, ih = img.height * sY;
      const ileft = img.left - (img.originX === 'center' ? iw / 2 : 0);
      const itop  = img.top  - (img.originY === 'center' ? ih / 2 : 0);
      let rx = (cr.left - ileft) / sX;
      let ry = (cr.top - itop) / sY;
      let rw = cr.width / sX;
      let rh = cr.height / sY;
      // clamp within existing crop frame
      const baseCX = img.cropX || 0, baseCY = img.cropY || 0;
      rx = Math.max(0, rx); ry = Math.max(0, ry);
      rw = Math.min(rw, img.width - rx); rh = Math.min(rh, img.height - ry);
      if (rw > 4 && rh > 4) {
        img.set({
          cropX: baseCX + rx, cropY: baseCY + ry,
          width: rw, height: rh,
          left: cr.left + (img.originX === 'center' ? (cr.width / 2) : 0),
          top:  cr.top  + (img.originY === 'center' ? (cr.height / 2) : 0),
        });
        img.setCoords();
      }
    }
    if (cr) _naqCanvas.remove(cr);
    _naqCrop = null;
    _naqCanvas.renderAll(); _saveSoon();
  }

  // ══ Print — MS Word rule: صرف دستاویز ═══════════════════════════════
  window._naqPrint = function () {
    _snapshot(); _persist();
    const a = _active();
    const hv = Object.assign({}, _auto(), a.header || {});
    // export canvas as image (no selection handles)
    let imgTag = '';
    let cw = 900, ch = 620;
    if (_naqCanvas) {
      try { _naqCanvas.discardActiveObject(); _naqCanvas.renderAll(); } catch (_) {}
      cw = _naqCanvas.getWidth(); ch = _naqCanvas.getHeight();
      let url = '';
      try { url = _naqCanvas.toDataURL({ format: 'png', multiplier: 2 }); } catch (_) { url = ''; }
      if (url) imgTag = `<img src="${url}" style="width:100%;height:auto;display:block;">`;
    }
    const compass = _compassHTML();
    const typeTxt = (a.type === 'baramad') ? 'جائے برامدگی' : 'جائے وقوعہ';
    const html = `<!DOCTYPE html><html dir="rtl" lang="ur"><head><meta charset="UTF-8">
      <style>
        @page { size: A4; margin: 20mm; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body { margin:0; direction:rtl; font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; color:#000; font-size:14pt; }
        .nh-row { display:flex; gap:18px; flex-wrap:wrap; margin:2pt 0; }
        .nh-row .lbl { font-weight:700; }
        .n-title { text-align:center; font-weight:800; font-size:16pt; margin:10pt 0 8pt; }
        .n-draw { position:relative; border:1.5px solid #000; padding:0; margin:0 auto; width:100%; box-sizing:border-box; }
        .n-compass { position:absolute; top:6px; left:6px; }
        .n-marks-l { font-weight:700; margin:10pt 0 3pt; }
        .n-marks { white-space:pre-wrap; border:1px solid #000; min-height:60px; padding:6pt; font-size:14pt; }
      </style></head><body>
      <div class="nh-row"><span><span class="lbl">تھانہ</span> ${E(hv.thana)}</span><span><span class="lbl">ضلع</span> ${E(hv.zila)}</span></div>
      <div class="nh-row"><span><span class="lbl">سرکار بذریعہ:</span> ${E(hv.sarkar)}</span></div>
      <div class="nh-row">
        <span><span class="lbl">مقدمہ نمبر</span> ${E(hv.muqadma)}</span>
        <span><span class="lbl">مورخہ</span> ${E(hv.morkha)}</span>
        <span><span class="lbl">بجرم</span> ${E(hv.bajurm)}</span>
        <span><span class="lbl">تھانہ</span> ${E(hv.thana)}</span>
      </div>
      <div class="nh-row"><span><span class="lbl">بنام:</span> ${E(hv.banam)}</span></div>
      <div class="n-title">نقشہ موقع نظری بلاسکیل — ${E(typeTxt)}</div>
      <div class="n-draw">
        ${imgTag || '<div style="height:520px"></div>'}
        <div class="n-compass">${compass.replace('id="naq-compass"', '')}</div>
      </div>
      <div class="n-marks-l">امتیازی نشانات:</div>
      <div class="n-marks">${E(a.marks || '')}</div>
    </body></html>`;
    if (typeof dioPrint === 'function') dioPrint(html);
    else { const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); w.print(); } }
  };

  // ══ CSS ════════════════════════════════════════════════════════════
  function _css() {
    return `
    .naq-wrap { display:flex; flex-direction:column; height:100%; direction:rtl;
      font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; }
    .naq-topbar { display:flex; align-items:center; gap:8px; padding:8px 12px;
      border-bottom:1px solid var(--border,#ccc); background:var(--bg-secondary,#f3f4f6); flex-wrap:wrap; }
    .naq-chips { display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
    .naq-chip { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:16px;
      border:1px solid var(--border,#ccc); background:var(--bg-card,#fff); color:var(--text-primary,#111);
      cursor:pointer; font-size:12pt; }
    .naq-chip.on { background:var(--nav-active,#e0edff); color:var(--accent,#2563eb); border-color:var(--accent,#2563eb); font-weight:700; }
    .naq-chip .naq-x { color:#b91c1c; font-size:11px; cursor:pointer; }
    .naq-chip.naq-add { font-weight:800; }
    .naq-btn { padding:6px 12px; border:1px solid var(--border,#ccc); border-radius:8px; cursor:pointer;
      background:var(--bg-card,#fff); color:var(--text-primary,#111); font-family:inherit; font-size:12pt; }
    .naq-print { background:var(--accent,#2563eb); color:#fff; border-color:var(--accent,#2563eb); font-weight:700; }
    .naq-scroll { flex:1; overflow:auto; min-height:0; padding:16px; background:var(--bg-tertiary,#eef1f4); }

    /* دستاویز — اپنی 14pt بنیاد (14px عالمی اصول سے مستثنیٰ، index.html میں) */
    #dio-naqsha-doc { width:8.27in; max-width:none; min-height:11in; margin:0 auto; background:#fff;
      color:#111; padding:0.6in 0.7in; box-shadow:0 4px 20px rgba(0,0,0,0.15); border-radius:4px;
      box-sizing:border-box; font-size:14pt; line-height:1.5; }

    .naq-header { margin-bottom:8pt; }
    .naq-hrow { display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin:4px 0; }
    .naq-lbl { font-weight:700; font-size:14pt; white-space:nowrap; }
    .naq-in { border:none; border-bottom:1px dotted #777; background:transparent; color:#111;
      font-family:inherit; font-size:14pt; padding:2px 4px; min-width:70px; outline:none; }
    .naq-in:focus { border-bottom-color:var(--accent,#2563eb); }
    .naq-in-sm { min-width:90px; } .naq-in-md { min-width:150px; flex:1; }
    .naq-in-wide { flex:1; min-width:200px; }

    .naq-title { text-align:center; font-weight:800; font-size:16pt; margin:10pt 0 8pt;
      display:flex; align-items:center; justify-content:center; gap:8px; flex-wrap:wrap; }
    .naq-type { font-family:inherit; font-size:14pt; padding:2px 8px; border:1px solid var(--border,#ccc);
      border-radius:6px; background:#fff; color:#111; cursor:pointer; }

    .naq-draw-wrap { position:relative; border:1.5px solid #111; background:#fff; margin:0 auto; overflow:hidden; }
    .naq-draw-wrap .canvas-container { margin:0 auto; }
    #naq-canvas { display:block; }
    .naq-compass { position:absolute; top:6px; left:6px; pointer-events:none; z-index:5; }
    .naq-nofab { padding:40px 20px; text-align:center; color:#b91c1c; font-size:13pt; }

    .naq-marks-label { font-weight:700; font-size:14pt; margin:10pt 0 3pt; }
    .naq-marks { width:100%; box-sizing:border-box; min-height:70px; border:1px solid #111; border-radius:4px;
      padding:8px; font-family:inherit; font-size:14pt; color:#111; background:#fff; resize:vertical; direction:rtl; }

    /* Floating tools (چھپائی میں نہیں) */
    .naq-tb { position:fixed; bottom:16px; right:50%; transform:translateX(50%); z-index:2147482000;
      display:flex; gap:4px; flex-wrap:wrap; align-items:center; max-width:94vw;
      background:var(--bg-card,#fff); border:1px solid var(--border,#ccc); border-radius:12px;
      padding:6px 8px; box-shadow:0 8px 28px rgba(0,0,0,0.28); direction:rtl; }
    .naq-tb-btn { min-width:34px; height:32px; padding:0 8px; border:1px solid var(--border,#ccc); border-radius:7px;
      background:var(--bg-card,#fff); color:var(--text-primary,#111); cursor:pointer; font-size:15px; }
    .naq-tb-btn:hover { background:var(--hover-bg,#eef6ff); }
    .naq-tb-sel { height:32px; border:1px solid var(--border,#ccc); border-radius:7px; background:#fff;
      color:#111; font-size:12px; padding:0 6px; cursor:pointer; }
    .naq-tb-sep { width:1px; height:22px; background:var(--border,#ccc); margin:0 3px; }

    @media print { .naq-topbar, .naq-tb, .naq-btn, #global-mic-btn { display:none !important; } }
    `;
  }

})();
