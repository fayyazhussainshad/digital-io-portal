/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — دستاویز کا پورے صفحے والا منظر + ٹیبز
   (پہلے یہ misal-docs.js میں تھا)
   AHEM: misal-docs.js کے BAAD لوڈ ہو
   ═══════════════════════════════════════════════════════════ */

function _dioDocName(docId) {
  const special = {
    witnesses_fir:   'گواہان FIR',
    witnesses_cross: 'گواہان کراس ورژن',
    named_accused:   'ملزمان FIR',
    accused_cross:   'ملزمان کراس ورژن',
    shahadatain:     'شہادتیں',
    fir:             'الف آئی آر',
    cross_version:   'کراس ورژن',
    'r173:list':           'رپورٹ 173 ض ف',
    'r173:mukammal':       'رپورٹ 173 — چالان مکمل',
    'r173:namukammal':     'رپورٹ 173 — چالان نامکمل',
    'r173:interim':        'رپورٹ 173 — انٹیرم چالان',
    'r173:ikhraj':         'رپورٹ 173 — اخراج',
    'r173:adampata':       'رپورٹ 173 — عدم پتہ',
    'r173:tatima_challan': 'رپورٹ 173 — تتمہ چالان',
    'r173:ch512':          'رپورٹ 173 — چالان 512 ض ف',
  };
  if (special[docId]) return special[docId];
  const d = MISAL_CASE_DOCS.find(x => x.id === docId);
  return d ? d.name : docId;
}

// ── Overlay banao aur editor-area us ke andar le jao ──

function _dioEnterDocView() {
  if (document.getElementById('dio-docview')) return; // already open
  const area = document.getElementById('workspace-editor-area');
  if (!area) return;
  _dioAreaHome = area.parentElement;   // wapas isi jagah rakhenge

  const ov = document.createElement('div');
  ov.id = 'dio-docview';
  ov.style.cssText =
    'position:fixed;inset:0;z-index:9500;background:var(--bg-primary);' +
    'display:flex;flex-direction:column;direction:rtl;';
  // Full-page view mein har module ke apne محفوظ/پرنٹ buttons chhupa dete hain —
  // upar wale bar mein pehle se hain, warna do do buttons nazar aate the.
  if (!document.getElementById('dio-dv-style')) {
    const st = document.createElement('style');
    st.id = 'dio-dv-style';
    st.textContent =
      '#dio-dv-body .dio-modbtn{display:none !important;}' +
      /* Full page: dastawez poore safhe par phaile (aadhe par nahi) */
      '#dio-dv-body{display:flex;flex-direction:column;}' +
      '#dio-dv-body > #workspace-editor-area{flex:1;min-height:0;width:100%;display:flex;flex-direction:column;}' +
      '#dio-dv-body #workspace-editor-area > *{flex:1;min-height:0;}' +
      /* چالان ka safha bhi poori chaudai le */
      '#dio-dv-body #ch173-doc{width:100% !important;max-width:none !important;}' +
      '#dio-dv-body #misal-editor{min-height:calc(100vh - 160px) !important;}';
    document.head.appendChild(st);
  }
  ov.innerHTML = `
    <div id="dio-dv-bar" style="display:flex;align-items:center;gap:8px;padding:8px 12px;
         background:var(--bg-secondary);border-bottom:1px solid var(--border);flex-wrap:wrap;">
      <!-- واپس — پورے صفحے پر اوپر والی پٹی ڈھک جاتی ہے، اس لیے یہاں بھی ضروری ہے -->
      <button onclick="dioGoBack()" title="واپس" aria-label="واپس"
        style="width:34px;height:34px;border-radius:50%;flex-shrink:0;cursor:pointer;
               border:1px solid var(--border);background:var(--bg-card);color:var(--text-primary);
               font-size:18px;font-weight:900;line-height:1;direction:ltr;">←</button>
      <span id="dio-dv-fir" style="font-size:14px;font-weight:900;color:var(--accent);
            font-family:var(--font-mono);flex-shrink:0;white-space:nowrap;"></span>
      <div id="dio-dv-tabs" style="display:flex;gap:6px;flex:1;flex-wrap:wrap;min-width:0;"></div>
      <div style="display:flex;gap:8px;flex-shrink:0;">
        <button onclick="_dioAddDocPicker()" title="نئی دستاویز کھولیں (موجودہ بند نہیں ہوگی)"
          style="background:var(--bg-tertiary);color:var(--text-primary);border:1px solid var(--accent);
                 border-radius:8px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer;
                 font-family:'Jameel Noori Nastaleeq',serif;">➕ نئی دستاویز</button>
        <button onclick="_dioSaveCurrent()" title="محفوظ کریں"
          style="background:var(--green,#16a34a);color:#fff;border:none;border-radius:8px;padding:8px 16px;
                 font-size:13px;font-weight:700;cursor:pointer;
                 font-family:'Jameel Noori Nastaleeq',serif;">💾 محفوظ</button>
        <button onclick="_dioPrintCurrent()" title="پرنٹ"
          style="background:var(--accent);color:#fff;border:none;border-radius:8px;padding:8px 16px;
                 font-size:13px;font-weight:700;cursor:pointer;
                 font-family:'Jameel Noori Nastaleeq',serif;">🖨️ پرنٹ</button>
        
      </div>
    </div>
    <div id="dio-dv-body" style="flex:1;min-height:0;overflow:auto;"></div>`;
  document.body.appendChild(ov);
  document.getElementById('dio-dv-body').appendChild(area);
  try {
    const f = document.getElementById('dio-dv-fir');
    if (f && _misalCase) f.textContent = 'مقدمہ ' + (_misalCase.fir_number || '—');
  } catch(_) {}
  document.body.style.overflow = 'hidden';

  // Escape se band
  document.addEventListener('keydown', _dioDocViewEsc);
}


function _dioDocViewEsc(e) {
  if (e.key === 'Escape') _dioExitDocView();
}

// ── Band karo — editor-area apni asal jagah wapas ──
// NOTE: Tabs ko JAAN-BOOJH KAR mehfooz rakhte hain, taake wapas ja kar koi
// aur chip kholne par purane tabs band na hon (sab khule rahen).

function _dioExitDocView() {
  const ov = document.getElementById('dio-docview');
  if (!ov) return;
  const area = document.getElementById('workspace-editor-area');
  // Ghair-mehfooz tabdeeli mehfooz kar lo
  try { if (_misalDirty && _openDocId && typeof saveMisalDoc === 'function') saveMisalDoc(_openDocId); } catch(_) {}
  if (area && _dioAreaHome) {
    _dioAreaHome.appendChild(area);
    // Form/dastawez ko yahan chhod kar na jao — warna woh bina chune bhi
    // nazar aata rehta hai. Dastawez sirf chip → fehrist se chunne par khulti hai.
    area.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
           height:100%;min-height:260px;color:var(--text-muted);direction:rtl;">
        <div style="font-size:40px;margin-bottom:10px;">📄</div>
        <div style="font-size:14px;">اوپر سے کوئی دستاویز منتخب کریں</div>
      </div>`;
  }
  ov.remove();
  document.body.style.overflow = '';
  document.removeEventListener('keydown', _dioDocViewEsc);
}

// Naya case khulne par tabs saaf (purane case ke tabs na rahen)

function _dioResetTabs() { _dioTabs = []; _dioActiveTab = null; }
window._dioResetTabs = _dioResetTabs;

// ── ➕ نئی دستاویز — fullscreen ke ANDAR se naya tab kholo ──
// (Moujooda tab band nahi hota — sab khule rehte hain)

function _dioAddDocPicker() {
  const old = document.getElementById('dio-dv-picker');
  if (old) { old.remove(); return; }   // toggle

  const groups = [
    { title:'انڈیکس / FIR', items:[
      ['index_naql','انڈیکس نقل مسل'], ['fir','الف آئی آر'], ['cross_version','کراس ورژن'],
    ]},
    { title:'ملزمان / گواہان', items:[
      ['named_accused','ملزمان FIR'], ['accused_cross','ملزمان کراس ورژن'],
      ['witnesses_fir','گواہان FIR'], ['witnesses_cross','گواہان کراس ورژن'],
    ]},
    { title:'رپورٹ 173 ض ف', items:[
      ['r173:mukammal','چالان مکمل'], ['r173:namukammal','چالان نامکمل'],
      ['r173:ch512','چالان 512 ض ف'],
      ['r173:interim','انٹیرم چالان'], ['r173:ikhraj','اخراج'],
      ['r173:adampata','عدم پتہ'], ['r173:tatima_challan','تتمہ چالان'],
    ]},
    { title:'دیگر دستاویزات', items: MISAL_CASE_DOCS
        .filter(d => d.id !== 'index_naql').map(d => [d.id, d.name]) },
  ];

  const box = document.createElement('div');
  box.id = 'dio-dv-picker';
  box.style.cssText =
    'position:absolute;top:56px;left:12px;z-index:9600;max-height:70vh;overflow:auto;' +
    'background:var(--bg-card);border:1px solid var(--accent);border-radius:12px;' +
    'padding:12px;box-shadow:0 12px 40px rgba(0,0,0,0.45);direction:rtl;min-width:280px;max-width:92vw;';
  box.innerHTML = groups.map(g => `
    <div style="margin-bottom:10px;">
      <div style="font-size:11px;color:var(--text-muted);font-weight:700;margin-bottom:6px;
                  font-family:'Jameel Noori Nastaleeq',serif;">${g.title}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        ${g.items.map(([id,label]) => {
          const open = _dioTabs.some(t => t.id === id);
          return `<span onclick="_dioPickDoc('${id}')"
            style="padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;
                   font-family:'Jameel Noori Nastaleeq',serif;
                   border:1px solid ${open?'var(--accent)':'var(--border)'};
                   background:${open?'var(--accent)':'var(--bg-tertiary)'};
                   color:${open?'#fff':'var(--text-primary)'};">${esc(label)}${open?' ✓':''}</span>`;
        }).join('')}
      </div>
    </div>`).join('') +
    `<div style="text-align:center;padding-top:6px;border-top:1px solid var(--border);">
       <span onclick="document.getElementById('dio-dv-picker')?.remove()"
         style="font-size:12px;color:var(--text-muted);cursor:pointer;
                font-family:'Jameel Noori Nastaleeq',serif;">✕ بند کریں</span>
     </div>`;
  document.getElementById('dio-docview')?.appendChild(box);
}

// Picker se document chuna → naya tab (purane khule rehte hain)

function _dioPickDoc(docId) {
  document.getElementById('dio-dv-picker')?.remove();
  if (_dioTabs.some(t => t.id === docId)) { _dioSwitchTab(docId); return; }
  _dioTabs.push({ id: docId, name: _dioDocName(docId) });
  _dioActiveTab = docId;
  _dioRenderTabs();
  _dioRenderTabContent(docId);
}

// 💾 محفوظ — active dastawez

function _dioSaveCurrent() {
  const id = _dioActiveTab;
  if (!id) return;
  if (id.startsWith('r173:')) {
    if (typeof _saveR173 === 'function') { _saveR173(); return; }
  }
  if (document.getElementById('misal-editor') && typeof saveMisalDoc === 'function') {
    saveMisalDoc(_openDocId || id); return;
  }
  if (typeof showToast === 'function') showToast('ℹ️ یہ صفحہ خودکار محفوظ ہوتا ہے', 'info');
}

window._dioAddDocPicker = _dioAddDocPicker;
window._dioPickDoc      = _dioPickDoc;
window._dioSaveCurrent  = _dioSaveCurrent;

// ── Tab kholo (ya pehle se khuli ho to us par jao) ──

function _dioOpenDocTab(docId) {
  _dioEnterDocView();
  if (!_dioTabs.some(t => t.id === docId)) {
    _dioTabs.push({ id: docId, name: _dioDocName(docId) });
  }
  _dioActiveTab = docId;
  _dioRenderTabs();
}

// ── Tab bar ──

function _dioRenderTabs() {
  const box = document.getElementById('dio-dv-tabs');
  if (!box) return;
  box.innerHTML = _dioTabs.map(t => {
    const on = t.id === _dioActiveTab;
    return `<span style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;
      cursor:pointer;font-size:12px;font-weight:700;white-space:nowrap;
      font-family:'Jameel Noori Nastaleeq',serif;transition:all .15s;
      border:1px solid ${on ? 'var(--accent)' : 'var(--border)'};
      background:${on ? 'var(--accent)' : 'var(--bg-tertiary)'};
      color:${on ? '#fff' : 'var(--text-secondary)'};"
      onclick="_dioSwitchTab('${t.id}')">
      ${esc(t.name)}
      <span onclick="event.stopPropagation();_dioCloseTab('${t.id}')" title="بند کریں"
        style="opacity:.75;font-weight:900;padding:0 2px;">✕</span>
    </span>`;
  }).join('');
}

// ── Tab badlo (pehle ghair-mehfooz kaam save) ──

function _dioSwitchTab(docId) {
  if (docId === _dioActiveTab) return;
  try { if (_misalDirty && _openDocId && typeof saveMisalDoc === 'function') saveMisalDoc(_openDocId); } catch(_) {}
  _dioActiveTab = docId;
  _dioRenderTabs();
  _dioRenderTabContent(docId);
}

// ── Tab band karo ──

function _dioCloseTab(docId) {
  _dioTabs = _dioTabs.filter(t => t.id !== docId);
  if (!_dioTabs.length) { _dioActiveTab = null; _dioExitDocView(); return; }
  if (_dioActiveTab === docId) {
    _dioActiveTab = _dioTabs[_dioTabs.length - 1].id;
    _dioRenderTabContent(_dioActiveTab);
  }
  _dioRenderTabs();
}

// ── Tab ka content dobara render karo ──

function _dioRenderTabContent(docId) {
  if (docId.startsWith('r173:')) {
    const type = docId.slice(5);
    if (typeof openReport173WithType === 'function') openReport173WithType(type, true);
    return;
  }
  // FIR / کراس ورژن — inka apna opener hai
  if (docId === 'fir' || docId === 'cross_version') {
    _openDocId = docId;
    if (typeof openFirView === 'function') openFirView(_misalCaseId, docId);
    else if (typeof _renderFIRView === 'function') _renderFIRView();
    return;
  }
  if (typeof _openMisalEditor === 'function') _openMisalEditor(docId, true);
}

// ── Smart print — active dastawez ke hisab se ──

function _dioPrintCurrent() {
  const id = _dioActiveTab;
  if (!id) return;
  if (id.startsWith('r173:')) {
    if (typeof _printR173 === 'function') { _printR173(); return; }
  }
  if (id === 'fir' || id === 'cross_version') {
    if (typeof _printFIRAll === 'function') { _printFIRAll(); return; }
  }
  if (typeof printMisalDoc === 'function') { printMisalDoc(_dioDocName(id)); return; }
  window.print();
}

window._dioExitDocView  = _dioExitDocView;
window._dioSwitchTab    = _dioSwitchTab;
window._dioCloseTab     = _dioCloseTab;
window._dioPrintCurrent = _dioPrintCurrent;
window._dioOpenDocTab   = _dioOpenDocTab;

