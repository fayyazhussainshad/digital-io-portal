/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — MISAL DOCUMENT SYSTEM  (misal-docs.js)
   All 33 official case documents — Urdu format
   Click to add to case → pre-filled template → save to DB
   ═══════════════════════════════════════════════════════════ */

// ── ALL 33 OFFICIAL DOCUMENTS ────────────────────────────────
const MISAL_CASE_DOCS = [
  { id:'crime_scene',      name:'جائے واردات',               desc:'Scene of Crime' },
  { id:'statements_161',   name:'بیانات 161 ض ف',            desc:'Statements u/s 161 CrPC' },
  { id:'incidents',        name:'وقوعہ جات',                 desc:'Incidents' },
  { id:'fardat',           name:'فردات',                     desc:'Fardat' },
  { id:'zamniyat',         name:'ضمنیات',                    desc:'Annexures' },
  { id:'memorandum',       name:'میمورنڈم',                  desc:'Memorandum' },
  { id:'cdr_imei',         name:'CDR/IMEI',                  desc:'CDR/IMEI Analysis' },
  { id:'cro_card',         name:'CRO کارڈ',                  desc:'Criminal Index Card' },
  { id:'staff',            name:'ہمراہی ملازمان',            desc:'Accompanying Staff' },
  { id:'index_naql',       name:'انڈیکس نقل مسل',           desc:'Index of Case File Copy' },
  { id:'arrest_form',      name:'فارم گرفتاری',              desc:'Arrest Form' },
  { id:'abscond_form',     name:'فارم مفروری',               desc:'Absconder Form' },
  { id:'warrant',          name:'وارنٹ',                     desc:'Warrant' },
  { id:'ishtihar',         name:'اشتہار',                    desc:'Proclamation' },
  { id:'progress',         name:'پراگریس رپورٹ',            desc:'Progress Report' },
  { id:'inkishafat',       name:'انکشافات',                  desc:'Disclosures' },
  { id:'darkhwastain',     name:'درخواستیں',                 desc:'Applications' },
  { id:'brief',            name:'بریف مقدمہ',                desc:'Case Brief' },
  { id:'preventive',       name:'انسدادی کاروائی',           desc:'Preventive Action' },
  { id:'saza_slip',        name:'سزا سلپ',                   desc:'Sentence Slip' },
  { id:'shahadatain',      name:'شہادتیں',                   desc:'Evidence / Testimonies' },
];

// ── STATE ─────────────────────────────────────────────────────
let _misalDocs   = {};
let _misalDirty  = false;   // { docId: {id, content, status} } for current case
let _misalCaseId = null;
let _misalCase   = null;
let _openDocId   = null;

// ── LOAD DOCS FOR CASE ────────────────────────────────────────
async function loadMisalDocs(caseId) {
  _misalCaseId = caseId;
  _misalDocs   = {};
  try {
    const { data } = await supabaseClient
      .from('case_documents')
      .select('*')
      .eq('case_id', caseId);
    (data || []).forEach(d => { _misalDocs[d.document_type] = d; });
  } catch(e) { console.warn('loadMisalDocs:', e.message); }
}

// ── RENDER DOCUMENT BAR ───────────────────────────────────────
function renderMisalBar(c) {
  // Naya/doosra case khula → purane case ke full-page tabs saaf karo
  if (_misalCase && c && _misalCase.id !== c.id && typeof _dioResetTabs === 'function') _dioResetTabs();
  _misalCase = c;
  const items = MISAL_CASE_DOCS.filter(d => d.id !== 'index_naql').map(d => {
    const saved = _misalDocs[d.id];
    const done  = saved?.status === 'complete';
    const added = !!saved;
    const cls   = done ? 'mdoc-done' : added ? 'mdoc-added' : 'mdoc-empty';
    // ALL documents: open the editor directly (no add/remove confirmation box)
    const action = added ? `_openMisalEditor('${d.id}')` : `_doAddMisalDoc('${d.id}')`;
    return `<span class="mdoc-chip ${cls}" onclick="${action}" title="${d.desc}">${d.name}</span>`;
  }).join('');

  // انڈیکس نقل مسل — first button (rightmost in RTL)
  const _idxSaved = _misalDocs['index_naql'];
  const _idxCls = _idxSaved?.status === 'complete' ? 'mdoc-done' : _idxSaved ? 'mdoc-added' : 'mdoc-empty';
  const _idxAction = _idxSaved ? `_openMisalEditor('index_naql')` : `_doAddMisalDoc('index_naql')`;
  const indexChip = `<span class="mdoc-chip ${_idxCls}" onclick="${_idxAction}" title="Index of Case File Copy">انڈیکس نقل مسل</span>`;

  return `
  <div id="misal-doc-bar" style="
    padding:8px 12px;
    background:var(--bg-secondary);
    border-bottom:1px solid var(--border);">
    <div style="display:flex;gap:8px;direction:rtl;flex-wrap:wrap;align-items:center;">
      ${indexChip}
      ${_misalDropdown('fir-dd', 'الف آئی آر', [
        {label:'الف آئی آر', act:`_ddPick('fir-dd','fir')`},
        {label:'کراس ورژن', act:`_ddPick('fir-dd','cross_version')`}
      ])}
      ${_misalDropdown('acc-dd', 'ملزمان', [
        {label:'ملزمان FIR', act:`_ddPick('acc-dd','named_accused')`},
        {label:'ملزمان کراس ورژن', act:`_ddPick('acc-dd','accused_cross')`}
      ])}
      ${_misalDropdown('wit-dd', 'گواہان', [
        {label:'گواہان FIR', act:`_ddPick('wit-dd','witnesses_fir')`},
        {label:'گواہان کراس ورژن', act:`_ddPick('wit-dd','witnesses_cross')`}
      ])}
      ${_misalDropdown('r173-dd', 'رپورٹ 173 ض ف', [
        {label:'چالان مکمل', act:`openReport173WithType('mukammal')`},
        {label:'چالان نامکمل', act:`openReport173WithType('namukammal')`},
        {label:'انٹیرم چالان', act:`openReport173WithType('interim')`},
        {label:'اخراج', act:`openReport173WithType('ikhraj')`},
        {label:'عدم پتہ', act:`openReport173WithType('adampata')`},
        {label:'تتمہ چالان', act:`openReport173WithType('tatima_challan')`}
      ])}
      ${items}
    </div>
  </div>
  <style>
    .mdoc-chip{
      display:inline-block;
      padding:6px 14px;
      border-radius:20px;
      font-size:16px;
      cursor:pointer;
      font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
      direction:rtl;
      border:1px solid transparent;
      transition:all 0.15s;
      margin-bottom:4px;
      line-height:1.6;
    }
    .mdoc-chip:hover{ transform:translateY(-1px); box-shadow:0 2px 8px rgba(0,0,0,0.25); }
    .mdoc-empty{ color:var(--text-muted);  background:var(--bg-tertiary);   border-color:var(--border); }
    .mdoc-added{ color:var(--accent);      background:rgba(56,189,248,0.12); border-color:var(--accent); font-weight:600; }
    .mdoc-done { color:var(--green);       background:rgba(34,197,94,0.12);  border-color:var(--green);  font-weight:600; }
  </style>`;
}

// ── DROPDOWN BUTTONS (merged FIR / ملزمان / گواہان) ────────────
function _misalDropdown(ddId, label, options) {
  return `
  <span style="position:relative;display:inline-block;">
    <span class="mdoc-chip mdoc-added" onclick="_toggleDD(event,'${ddId}')" style="cursor:pointer;">
      ${label} ▾
    </span>
    <div id="${ddId}" style="display:none;position:fixed;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.4);z-index:5000;min-width:180px;padding:6px;direction:rtl;">
      ${options.map(o => `
        <a onclick="_closeAllDD();${o.act}" style="display:block;padding:9px 12px;font-size:15px;font-family:'Jameel Noori Nastaleeq',serif;color:var(--text-primary);cursor:pointer;border-radius:6px;text-align:right;"
           onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='transparent'">${o.label}</a>`).join('')}
    </div>
  </span>`;
}

function _toggleDD(ev, ddId) {
  ev.stopPropagation();
  const dd = document.getElementById(ddId);
  if (!dd) return;
  const isOpen = dd.style.display === 'block';
  _closeAllDD();
  if (!isOpen) {
    const rect = ev.currentTarget.getBoundingClientRect();
    dd.style.top = (rect.bottom + 4) + 'px';
    dd.style.right = (window.innerWidth - rect.right) + 'px';
    dd.style.display = 'block';
  }
}

function _closeAllDD() {
  ['fir-dd','acc-dd','wit-dd','r173-dd'].forEach(id => {
    const dd = document.getElementById(id);
    if (dd) dd.style.display = 'none';
  });
}

// When an option is picked — open that document/view
function _ddPick(ddId, docId) {
  // Full-page view tab (FIR / گواہان / ملزمان bhi poore page par)
  if (typeof _dioOpenDocTab === 'function') _dioOpenDocTab(docId);
  if (docId === 'fir' || docId === 'cross_version') {
    _openDocId = docId;
    if (typeof openFirView === 'function') openFirView(_misalCaseId, docId);
    else if (typeof _renderFIRView === 'function') _renderFIRView();
  } else if (docId === 'named_accused') {
    if (typeof openAccusedCard === 'function') openAccusedCard(_misalCaseId, 'fir');
  } else if (docId === 'accused_cross') {
    if (typeof openAccusedCard === 'function') openAccusedCard(_misalCaseId, 'cross_version');
  } else if (docId === 'witnesses_fir') {
    if (typeof openWitnessesCard === 'function') openWitnessesCard(_misalCaseId, 'fir');
  } else if (docId === 'witnesses_cross') {
    if (typeof openWitnessesCard === 'function') openWitnessesCard(_misalCaseId, 'cross_version');
  }
}

// Close dropdowns when clicking elsewhere
document.addEventListener('click', () => _closeAllDD());

// ── SET SHO / DSP NAME ────────────────────────────────────────
function _setMisalOfficer(type, caseId) {
  const isSho = type === 'sho';
  const label = isSho ? 'SHO کا نام' : 'DSP/SDPO کا نام';
  const c = _misalCase || {};
  const current = isSho ? (c.sho_name||'') : (c.dsp_name||'');
  openModal(label,
    `<div style="direction:rtl;">
      <label class="form-label">${label}</label>
      <input class="form-input" id="misal-officer-name" value="${current}" placeholder="${label}" dir="auto" style="font-family:'Jameel Noori Nastaleeq',serif;font-size:15px;">
      <div style="font-size:11px;color:var(--text-muted);margin-top:6px;">یہ نام تمام دستاویزات اور رپورٹس میں استعمال ہوگا</div>
    </div>`,
    `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;">
      <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
      <button class="btn btn-primary" onclick="_saveMisalOfficer('${type}','${caseId}')">💾 محفوظ</button>
    </div>`
  );
  setTimeout(()=>document.getElementById('misal-officer-name')?.focus(),100);
}

async function _saveMisalOfficer(type, caseId) {
  const name = document.getElementById('misal-officer-name')?.value.trim()||'';
  const field = type === 'sho' ? 'sho_name' : 'dsp_name';
  try {
    await supabaseClient.from('cases').update({ [field]: name }).eq('id', caseId);
    if (_misalCase) _misalCase[field] = name;
    // Update workspace cache too
    if (window._casesCache) {
      const cc = window._casesCache.find(x=>x.id===caseId);
      if (cc) cc[field] = name;
    }
    closeModal();
    showToast('✅ '+(type==='sho'?'SHO':'DSP/SDPO')+' کا نام محفوظ', 'success');
    _refreshMisalBar();
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

// ── CONFIRMATION: ADD ─────────────────────────────────────────
function confirmAddMisalDoc(docId) {
  const def = MISAL_CASE_DOCS.find(d => d.id === docId);
  if (!def) return;
  // Witnesses & accused: skip confirmation, open the card directly
  if (docId === 'witnesses_fir' || docId === 'witnesses_cross' ||
      docId === 'named_accused' || docId === 'unknown_accused') {
    _doAddMisalDoc(docId);
    return;
  }
  openModal('دستاویز شامل کریں',
    `<div style="text-align:right;direction:rtl;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;font-size:16px;line-height:2;">
      <div style="font-size:20px;font-weight:bold;color:var(--accent);margin-bottom:12px;">${def.name}</div>
      <div style="color:var(--text-secondary);">کیا آپ یہ دستاویز اس مقدمے میں شامل کرنا چاہتے ہیں؟</div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:8px;">${def.desc}</div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">نہیں، واپس جائیں</button>
     <button class="btn btn-primary" onclick="closeModal();_doAddMisalDoc('${docId}')">✅ ہاں، شامل کریں</button>`
  );
}

// ── CONFIRMATION: REMOVE ──────────────────────────────────────
function confirmRemoveMisalDoc(docId) {
  const def = MISAL_CASE_DOCS.find(d => d.id === docId);
  if (!def) return;
  // Witnesses & accused: open directly, no remove/open prompt
  if (docId === 'witnesses_fir' || docId === 'witnesses_cross' ||
      docId === 'named_accused' || docId === 'unknown_accused') {
    _openMisalEditor(docId);
    return;
  }
  const saved = _misalDocs[docId];
  openModal('دستاویز ہٹائیں یا کھولیں',
    `<div style="text-align:right;direction:rtl;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;font-size:16px;line-height:2;">
      <div style="font-size:20px;font-weight:bold;color:var(--accent);margin-bottom:12px;">${def.name}</div>
      <div style="color:var(--text-secondary);">یہ دستاویز پہلے سے شامل ہے۔ آپ کیا کرنا چاہتے ہیں؟</div>
    </div>`,
    `<button class="btn btn-danger" onclick="closeModal();_doRemoveMisalDoc('${docId}')">🗑️ ہٹا دیں</button>
     <button class="btn btn-secondary" onclick="closeModal()">واپس جائیں</button>
     <button class="btn btn-primary" onclick="closeModal();_openMisalEditor('${docId}')">📄 کھولیں</button>`
  );
}


// ── ADD TO CASE ───────────────────────────────────────────────
async function _doAddMisalDoc(docId) {
  const def = MISAL_CASE_DOCS.find(d => d.id === docId);
  if (!def || !_misalCaseId) return;
  const isPersonForm = (docId === 'witnesses_fir' || docId === 'witnesses_cross' ||
                        docId === 'named_accused' || docId === 'unknown_accused' ||
                        docId === 'zamniyat' || docId === 'memorandum' ||
                        docId === 'cdr_imei' || docId === 'cro_card' || docId === 'staff');
  // If already added — open it (form for persons, editor for docs)
  if (_misalDocs[docId]) { _openMisalEditor(docId); return; }
  try {
    const oid = await getOfficerId();
    const { data, error } = await supabaseClient
      .from('case_documents')
      .insert({ case_id: _misalCaseId, officer_id: oid, document_type: docId, status: 'draft', content: {} })
      .select().single();
    if (error) throw error;
    _misalDocs[docId] = data;
    _refreshMisalBar();
    // Persons (witnesses/accused) → open their card form. Other docs → silent.
    if (isPersonForm) _openMisalEditor(docId);
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

// ── REMOVE FROM CASE ──────────────────────────────────────────
async function _doRemoveMisalDoc(docId) {
  const def = MISAL_CASE_DOCS.find(d => d.id === docId);
  if (!def || !_misalCaseId) return;
  try {
    await supabaseClient.from('case_documents')
      .delete()
      .eq('case_id', _misalCaseId)
      .eq('document_type', docId);
    delete _misalDocs[docId];
    _refreshMisalBar();
    _refreshMisalSidebar();
    // Clear editor if this doc was open
    const area = document.getElementById('workspace-editor-area');
    if (area) area.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-muted);">
        <div style="font-size:40px;margin-bottom:12px;">📂</div>
        <div style="font-size:14px;font-weight:600;">دستاویز ہٹا دی گئی</div>
        <div style="font-size:12px;margin-top:6px;">بائیں طرف سے کوئی دستاویز منتخب کریں</div>
      </div>`;
    showToast(`🗑️ ${def.name} ہٹا دی گئی`, 'info');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

// ── OPEN EDITOR ───────────────────────────────────────────────
function _openMisalEditor(docId, _fromTab) {
  // Full-page view: dastawez poore page par khulti hai, chips background mein.
  // _fromTab=true tab aata hai jab tab-switch se dobara render ho raha ho.
  if (!_fromTab && typeof _dioOpenDocTab === 'function') _dioOpenDocTab(docId);

  // Special: شہادتیں shows evidence view
  if (docId === 'shahadatain') {
    _openDocId = docId;
    const area = document.getElementById('workspace-editor-area');
    if (area && typeof renderEvidenceTab === 'function' && window._workspaceCase) {
      area.innerHTML = renderEvidenceTab(window._workspaceCase, window._workspaceEv || []);
    }
    _refreshMisalSidebar();
    return;
  }

  // Special: گواہان FIR → only witness_type='fir'
  if (docId === 'witnesses_fir') {
    _openDocId = docId;
    if (typeof openWitnessesCard === 'function') openWitnessesCard(_misalCaseId, 'fir');
    return;
  }
  // Special: گواہان کراس ورژن → only witness_type='cross_version'
  if (docId === 'witnesses_cross') {
    _openDocId = docId;
    if (typeof openWitnessesCard === 'function') openWitnessesCard(_misalCaseId, 'cross_version');
    return;
  }

  // Special: ملزمان FIR → only accused_type='fir'
  if (docId === 'named_accused') {
    _openDocId = docId;
    if (typeof openAccusedCard === 'function') openAccusedCard(_misalCaseId, 'fir');
    return;
  }
  // Special: ملزمان کراس ورژن → only accused_type='cross_version'
  if (docId === 'accused_cross') {
    _openDocId = docId;
    if (typeof openAccusedCard === 'function') openAccusedCard(_misalCaseId, 'cross_version');
    return;
  }

  // Special: ہمراہی ملازمان → structured staff form
  if (docId === 'staff') {
    _openDocId = docId;
    if (typeof openStaffV2 === 'function') openStaffV2(_misalCaseId);
    return;
  }

  // Special: CRO کارڈ → criminal index card
  if (docId === 'cro_card') {
    _openDocId = docId;
    if (typeof openCroCard === 'function') openCroCard(_misalCaseId);
    return;
  }

  // Special: CDR/IMEI → request form
  if (docId === 'cdr_imei') {
    _openDocId = docId;
    if (typeof openCdrImei === 'function') openCdrImei(_misalCaseId);
    return;
  }

  // Special: ضمنیات / میمورنڈم → Zimni progress report editor
  if (docId === 'zamniyat' || docId === 'memorandum') {
    _openDocId = docId;
    if (typeof openZimniEditor === 'function') openZimniEditor(_misalCaseId);
    return;
  }

  // Special: ایف آئی آر shows structured FIR list view
  if (docId === 'fir') {
    _openDocId = docId;
    _renderFIRView();
    return;
  }
  const def = MISAL_CASE_DOCS.find(d => d.id === docId);
  if (!def) return;
  _openDocId = docId;

  // Switch to docs tab
  document.querySelectorAll('.case-tab').forEach(t => t.classList.remove('active'));
  const tab = document.getElementById('tab-docs');
  if (tab) tab.classList.add('active');

  // If docs tab content not rendered yet, render it first
  const area = document.getElementById('workspace-editor-area');
  if (!area) {
    const tc = document.getElementById('workspace-tab-content');
    if (tc) tc.innerHTML = renderDocsTab(_misalCase, []);
    setTimeout(() => _renderMisalEditor(docId, def), 80);
    return;
  }
  _renderMisalEditor(docId, def);

  // Highlight in sidebar
  document.querySelectorAll('.misal-sidebar-item').forEach(el => el.classList.remove('active'));
  const item = document.getElementById('msb-' + docId);
  if (item) item.classList.add('active');
}

// ── SIDEBAR: list of added documents ─────────────────────────
function renderMisalDocSidebar() {
  // CASE DOCUMENTS side panel permanently removed — returns nothing
  return '';
}

function _refreshMisalSidebar() {
  // Side document table removed — does nothing now (no "CASE DOCUMENTS" table)
}

function _renderMisalEditor(docId, def) {
  const area = document.getElementById('workspace-editor-area');
  if (!area) return;

  const saved   = _misalDocs[docId];
  const content = saved?.content?.html ? sanitizeHtml(saved.content.html) : getMisalTemplate(docId, _misalCase);
  const savedDate = saved?.content?.date || '';

  area.innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;min-height:400px;direction:rtl;">
    <!-- Safha khali hi rehta hai (software koi format nahi deta) —
         lekin likhne ke liye MS Word jaise auzaar mojood hain -->
    <input type="hidden" id="misal-date" value="${savedDate}">
    <div style="flex:1;overflow:auto;min-height:0;padding:14px;">
      <div id="misal-editor" contenteditable="true" spellcheck="false" style="
        width:100%;min-height:100%;
        background:#fff;color:#111;
        font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
        font-size:16px;line-height:2;
        direction:rtl;text-align:justify;
        border:1px solid var(--border);border-radius:8px;
        padding:18px;outline:none;box-sizing:border-box;
      " oninput="_misalDirty=true">${content}</div>
      ${(typeof dioSavedBoxHTML === 'function')
        ? dioSavedBoxHTML(_misalCaseId, docId, 'محفوظ شدہ — ' + ((MISAL_CASE_DOCS.find(d=>d.id===docId)||{}).name || ''))
        : ''}
    </div>
  </div>`;

  // Keyboard shortcuts: Ctrl+B, Ctrl+U, Ctrl+I
  setTimeout(() => {
    const ed = document.getElementById('misal-editor');
    if (ed) {
      ed.onkeydown = (e) => {
        if (e.ctrlKey || e.metaKey) {
          if (e.key === 'b') { e.preventDefault(); document.execCommand('bold'); }
          if (e.key === 'u') { e.preventDefault(); document.execCommand('underline'); }
          if (e.key === 'i') { e.preventDefault(); document.execCommand('italic'); }
        }
      };
    }
    // Auto text-direction for fields in this document editor
    if (typeof applyAutoDirection === 'function') applyAutoDirection(area);
    // MS Word jaise auzaar: Tab, Ctrl+B/I/U waghera
    if (typeof dioBindEditor === 'function') dioBindEditor(area);
    // انڈکس نقل مسل — fresh doc: ملزمان + ضمنیاں database se auto-fill
    if (docId === 'index_naql' && !(saved?.content?.html)) _fillIndexNaqlData();
  }, 80);
}

// ── انڈکس نقل مسل — AUTO-FILL (ملزمان + ضمنیاں) ─────────────────
async function _fillIndexNaqlData() {
  if (!_misalCaseId) return;
  // ملزمان → بنام blocks (max 4)
  try {
    const { data: acc } = await supabaseClient.from('case_accused')
      .select('*').eq('case_id', _misalCaseId)
      .order('created_at', { ascending: true });
    (acc || []).slice(0, 4).forEach((a, i) => {
      const n = i + 1;
      const nm = a.name || a.full_name || '';
      const _fcx = (typeof formatCNIC==='function') ? formatCNIC : (s=>s||'');
      const _fmx = (typeof formatCell==='function') ? formatCell : (s=>s||'');
      const elN = document.getElementById('idxn-name-' + n);
      if (elN && nm) elN.textContent = ' ' + nm + ' ';
      const elC = document.getElementById('idxn-cell-' + n);
      if (elC && a.cell) elC.textContent = ' ' + (_fmx(a.cell) || a.cell) + ' ';
      const elI = document.getElementById('idxn-cnic-' + n);
      if (elI && a.cnic) elI.textContent = ' ' + (_fcx(a.cnic) || a.cnic) + ' ';
    });
  } catch(_) {}
  // ضمنیاں → انڈکس ضمنیات (نمبر کے مطابق مورخہ + تفتیشی افسر)
  // FIX 3: har زمنی entry ka apna date + apna تفتیشی افسر (officer_id lookup);
  // value na ho to cell blank chhoro (koi placeholder nahi).
  try {
    const { data: zs } = await supabaseClient.from('zimni_reports')
      .select('serial_no,report_date,officer_id').eq('case_id', _misalCaseId)
      .order('serial_no', { ascending: true });
    // Officer names ek dafa fetch (id → naam) taake har entry ka apna افسر lag sake
    const _ofcIds = [...new Set((zs || []).map(z => z.officer_id).filter(Boolean))];
    let _ofcMap = {};
    if (_ofcIds.length) {
      try {
        const { data: ofs } = await supabaseClient.from('officers')
          .select('id,full_name,designation').in('id', _ofcIds);
        (ofs || []).forEach(o => {
          _ofcMap[o.id] = (o.full_name || '') + (o.designation ? ' (' + o.designation + ')' : '');
        });
      } catch(_) {}
    }
    const _selfName = (currentOfficer && currentOfficer.full_name) || '';
    (zs || []).forEach(z => {
      const n = parseInt(z.serial_no);
      if (!n || n < 1 || n > 18) return;
      const d = document.getElementById('idxz-d-' + n);
      if (d && z.report_date) d.textContent = (typeof formatDate==='function') ? formatDate(z.report_date) : z.report_date;
      const oEl = document.getElementById('idxz-o-' + n);
      if (oEl) {
        const nm = (z.officer_id && _ofcMap[z.officer_id]) ? _ofcMap[z.officer_id] : (z.officer_id ? _selfName : '');
        if (nm) oEl.textContent = nm;
      }
    });
  } catch(_) {}
}

// Formatting helpers
function _fmtBtn() {
  return 'min-width:34px;height:32px;border:1px solid var(--border);border-radius:6px;background:var(--bg-card);color:var(--text-primary);cursor:pointer;font-size:14px;padding:0 8px;';
}
function _fmtDoc(cmd) {
  const ed = document.getElementById('misal-editor');
  if (ed) ed.focus();
  document.execCommand(cmd, false, null);
}
function _fontSize(dir) {
  const ed = document.getElementById('misal-editor');
  if (!ed) return;
  ed.focus();
  const sel = window.getSelection();
  if (sel && sel.toString()) {
    // Wrap selection in span with adjusted size
    document.execCommand('fontSize', false, dir > 0 ? '5' : '2');
  } else {
    // No selection — change whole editor base size
    const cur = parseInt(window.getComputedStyle(ed).fontSize) || 16;
    ed.style.fontSize = Math.max(11, Math.min(28, cur + (dir*2))) + 'px';
  }
}

// ── CUSTOM FIELDS — officer defines their own fields on the fly ──
function _addCustomField(editorId) {
  openModal('➕ نیا خانہ شامل کریں', `
    <div style="direction:rtl;">
      <label class="form-label">خانے کا نام (Label)</label>
      <input class="form-input" id="cf-label" placeholder="مثلاً: ملزم کا نام" style="margin-bottom:10px;">
      <label class="form-label">قسم</label>
      <select class="form-input" id="cf-type">
        <option value="line">ایک سطری خانہ (مختصر)</option>
        <option value="area">بڑا خانہ (تفصیل کے لیے)</option>
        <option value="date">تاریخ</option>
        <option value="cnic">شناختی کارڈ (00000-0000000-0)</option>
        <option value="phone">فون نمبر (0000-0000000)</option>
      </select>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
    <button class="btn btn-primary" onclick="_insertCustomField('${editorId}')">شامل کریں</button>
  `);
}

function _insertCustomField(editorId) {
  const label = document.getElementById('cf-label')?.value.trim();
  const type  = document.getElementById('cf-type')?.value;
  if (!label) { showToast('⚠️ خانے کا نام لکھیں', 'error'); return; }
  const ed = document.getElementById(editorId);
  if (!ed) return;

  let fieldHtml = '';
  const placeholders = { cnic:'00000-0000000-0', phone:'0000-0000000', date:'', line:'', area:'' };
  if (type === 'area') {
    fieldHtml = `<div style="margin:10px 0;"><b>${label}:</b><div contenteditable="true" style="min-height:60px;border:1px solid #ccc;border-radius:4px;padding:8px;margin-top:4px;">&nbsp;</div></div>`;
  } else {
    const dir = (type==='cnic'||type==='phone'||type==='date') ? 'ltr' : 'rtl';
    const ph = placeholders[type] || '';
    fieldHtml = `<div style="margin:8px 0;display:flex;gap:8px;align-items:center;"><b style="white-space:nowrap;">${label}:</b><span contenteditable="true" style="flex:1;border-bottom:1px solid #999;min-height:20px;padding:2px 6px;direction:${dir};display:inline-block;" data-ph="${ph}">&nbsp;</span></div>`;
  }
  // Insert at end of editor
  ed.innerHTML += fieldHtml;
  closeModal();
  showToast('✅ خانہ شامل ہو گیا', 'success');
}

function _addCustomTable(editorId) {
  openModal('➕ ٹیبل شامل کریں', `
    <div style="direction:rtl;">
      <label class="form-label">کالم کے نام (کاما سے الگ کریں)</label>
      <input class="form-input" id="ct-cols" placeholder="مثلاً: نمبر شمار، نام، عہدہ" style="margin-bottom:10px;">
      <label class="form-label">قطاروں کی تعداد</label>
      <input class="form-input" id="ct-rows" type="number" value="3" min="1" max="20">
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
    <button class="btn btn-primary" onclick="_insertCustomTable('${editorId}')">شامل کریں</button>
  `);
}

function _insertCustomTable(editorId) {
  const cols = (document.getElementById('ct-cols')?.value || '').split('،').map(c=>c.trim()).filter(Boolean);
  const rows = parseInt(document.getElementById('ct-rows')?.value) || 3;
  if (!cols.length) { showToast('⚠️ کم از کم ایک کالم لکھیں', 'error'); return; }
  const ed = document.getElementById(editorId);
  if (!ed) return;

  let table = '<table style="width:100%;border-collapse:collapse;margin:12px 0;"><thead><tr>';
  cols.forEach(c => { table += `<th style="border:1px solid #999;padding:6px;background:#f0f0f0;">${c}</th>`; });
  table += '</tr></thead><tbody>';
  for (let r = 0; r < rows; r++) {
    table += '<tr>';
    cols.forEach(() => { table += '<td style="border:1px solid #999;padding:8px;" contenteditable="true">&nbsp;</td>'; });
    table += '</tr>';
  }
  table += '</tbody></table>';
  ed.innerHTML += table;
  closeModal();
  showToast('✅ ٹیبل شامل ہو گیا', 'success');
}

// ── MISAL TOOLBAR HELPERS ─────────────────────────────────────
function _mExec(cmd, val) {
  const ed = document.getElementById('misal-editor');
  if (!ed) return;
  ed.focus();
  document.execCommand(cmd, false, val || null);
}

function _mFontFamily(val) {
  const ed = document.getElementById('misal-editor');
  if (!ed) return;
  // Apply to whole editor (global font)
  ed.style.fontFamily = val;
}

function _mFontSize(px) {
  const ed = document.getElementById('misal-editor');
  if (!ed) return;
  ed.focus();
  // Use execCommand fontSize trick then restyle
  document.execCommand('fontSize', false, '7');
  ed.querySelectorAll('font[size="7"]').forEach(el => {
    el.removeAttribute('size');
    el.style.fontSize = px + 'px';
  });
  // If nothing selected, just change editor default
  if (!window.getSelection()?.toString()) ed.style.fontSize = px + 'px';
}

function _mDir(dir) {
  const ed = document.getElementById('misal-editor');
  if (!ed) return;
  ed.focus();
  const sel = window.getSelection();
  let el = sel?.rangeCount > 0 ? sel.getRangeAt(0).commonAncestorContainer : null;
  if (el?.nodeType === 3) el = el.parentElement;
  while (el && el !== ed && !['P','DIV','H1','H2','H3','LI','BLOCKQUOTE'].includes(el.tagName)) el = el.parentElement;
  const target = (el && el !== ed) ? el : ed;
  target.dir = dir;
  target.style.textAlign = dir === 'rtl' ? 'right' : 'left';
}

function _mLineSpacing(val) {
  const ed = document.getElementById('misal-editor');
  if (ed) ed.style.lineHeight = val;
}

const _mSizes = { a4:['210mm','297mm'], a3:['297mm','420mm'], legal:['216mm','356mm'], letter:['216mm','279mm'] };
function _mPageSize(val) {
  const ed = document.getElementById('misal-editor');
  if (!ed) return;
  const [w, h] = _mSizes[val] || _mSizes.a4;
  ed.style.width = w; ed.style.minHeight = h;
}
function _mMargins(val) { const ed = document.getElementById('misal-editor'); if (ed) ed.style.padding = val; }
let _mBorderOn = false;
function _mToggleBorder() {
  const ed = document.getElementById('misal-editor');
  if (!ed) return;
  _mBorderOn = !_mBorderOn;
  ed.style.border = _mBorderOn ? '2px solid #333' : 'none';
  const btn = document.getElementById('misal-border-btn');
  if (btn) btn.style.color = _mBorderOn ? 'var(--accent)' : '';
}

// Table picker
function _mToggleTablePicker() {
  const p = document.getElementById('misal-table-picker');
  if (p) p.style.display = p.style.display === 'none' ? 'block' : 'none';
}
function _mHoverCell(r, c) {
  document.querySelectorAll('#misal-table-picker .tgcell').forEach(el => {
    const on = +el.dataset.r <= r && +el.dataset.c <= c;
    el.classList.toggle('tg-on', on);
    el.style.background = on ? 'rgba(56,189,248,0.3)' : '';
    el.style.borderColor = on ? 'var(--accent)' : '#555';
  });
  const lbl = document.getElementById('misal-table-label');
  if (lbl) lbl.textContent = r + ' rows × ' + c + ' cols';
}
function _mInsertTable(rows, cols) {
  const p = document.getElementById('misal-table-picker');
  if (p) p.style.display = 'none';
  const ed = document.getElementById('misal-editor');
  if (!ed) return;
  ed.focus();
  let html = '<table style="border-collapse:collapse;width:100%;margin:8px 0;"><tbody>';
  for (let r = 0; r < rows; r++) {
    html += '<tr>';
    for (let c = 0; c < cols; c++)
      html += '<td style="border:1px solid #999;padding:6px 10px;min-width:50px;min-height:22px;" contenteditable="true">&nbsp;</td>';
    html += '</tr>';
  }
  html += '</tbody></table><br>';
  document.execCommand('insertHTML', false, html);
}

// ── FIR STRUCTURED VIEW ───────────────────────────────────────
async function _renderFIRView() {
  const area = document.getElementById('workspace-editor-area');
  if (!area) return;
  const c = window._workspaceCase || {};

  area.innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;">
    <!-- FIR Header bar -->
    <div style="background:var(--bg-secondary);border-bottom:1px solid var(--border);padding:10px 16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
      <div style="font-family:'Jameel Noori Nastaleeq',serif;font-size:16px;font-weight:700;color:var(--accent);direction:rtl;">
        متن ایف آئی آر — مقدمہ ${esc(c.fir_number||'')}
      </div>
      <div style="display:flex;gap:6px;direction:rtl;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="_openFIREditor()">📝 متن درج کریں</button>
        <button class="btn btn-secondary dio-modbtn" onclick="_printFIRAll()">🖨️ پرنٹ</button>
        <button class="btn btn-secondary" onclick="_shareFIRAll()">📱 شیئر</button>
      </div>
    </div>

    <!-- FIR entries list -->
    <div style="flex:1;overflow-y:auto;padding:16px;" id="fir-entries-area">
      <div style="text-align:center;padding:30px;color:var(--text-muted);">⏳ لوڈ ہو رہا ہے...</div>
    </div>
  </div>`;

  await _loadFIREntries();
}

async function _loadFIREntries() {
  const area = document.getElementById('fir-entries-area');
  if (!area || !_misalCaseId) return;

  try {
    const { data } = await supabaseClient
      .from('case_documents')
      .select('*')
      .eq('case_id', _misalCaseId)
      .eq('document_type', 'fir')
      .order('created_at', { ascending: false });

    const entries = data || [];

    if (!entries.length) {
      area.innerHTML = `
        <div style="text-align:center;padding:48px;color:var(--text-muted);">
          <div style="font-size:48px;margin-bottom:12px;">📄</div>
          <div style="font-size:14px;font-weight:600;font-family:'Jameel Noori Nastaleeq',serif;direction:rtl;">ابھی کوئی FIR متن نہیں</div>
          <div style="font-size:12px;margin-top:6px;">اوپر "متن درج کریں" بٹن دبائیں</div>
        </div>`;
      return;
    }

    area.innerHTML = `
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:var(--bg-secondary);">
          <th style="padding:10px 12px;text-align:right;font-family:'Jameel Noori Nastaleeq',serif;direction:rtl;font-size:13px;border-bottom:2px solid var(--accent);">مضمون</th>
          <th style="padding:10px 12px;text-align:center;font-size:11px;border-bottom:2px solid var(--accent);width:120px;">ایکشن</th>
        </tr>
      </thead>
      <tbody>
        ${entries.map((e,i) => `
          <tr style="border-bottom:1px solid var(--border);${i%2===0?'background:var(--bg-secondary);':''}">
            <td style="padding:12px;direction:rtl;font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;line-height:2;vertical-align:top;">
              <span style="font-size:11px;color:var(--text-faint);display:block;margin-bottom:4px;">${e.status==='complete'?'✅ مکمل':'📝 مسودہ'} · ${formatDate(e.updated_at||e.created_at)}</span>
              <div id="fir-preview-${e.id}" style="max-height:120px;overflow:hidden;">
                ${e.content?.html ? _stripTags(e.content.html).slice(0,300)+'...' : '—'}
              </div>
            </td>
            <td style="padding:8px;text-align:center;vertical-align:top;">
              <div style="display:flex;flex-direction:column;gap:4px;align-items:center;">
                <button class="btn btn-primary btn-sm" onclick="_editFIREntry('${e.id}')" title="ترمیم">✏️ ترمیم</button>
                <button class="btn btn-secondary btn-sm" onclick="_printFIREntry('${e.id}')" title="پرنٹ">🖨️ پرنٹ</button>
                <button class="btn btn-secondary btn-sm" onclick="_shareFIREntry('${e.id}')" title="شیئر">📱 شیئر</button>
                <button class="btn btn-danger btn-sm" onclick="_deleteFIREntry('${e.id}')" title="حذف">🗑️</button>
              </div>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;

    // Store entries for print/share
    window._firEntries = entries;
  } catch(e) {
    if (area) area.innerHTML = `<div style="color:var(--red);padding:20px;">❌ ${e.message}</div>`;
  }
}

function _stripTags(html) {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent || d.innerText || '';
}

function _openFIREditor(entryId) {
  // Open Word editor for new or existing FIR entry
  if (entryId) {
    // Edit existing — find in _misalDocs and open
    _openMisalEditorDirect('fir');
  } else {
    // New entry
    _openMisalEditorDirect('fir');
  }
}

async function _editFIREntry(entryId) {
  // Load content and open editor
  try {
    const { data } = await supabaseClient
      .from('case_documents').select('*').eq('id', entryId).single();
    if (data) {
      _misalDocs['fir'] = data;
      _openMisalEditorDirect('fir');
    }
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

function _openMisalEditorDirect(docId) {
  const def = MISAL_CASE_DOCS.find(d => d.id === docId);
  if (!def) return;
  _openDocId = docId;
  const area = document.getElementById('workspace-editor-area');
  if (!area) return;
  _renderMisalEditor(docId, def);
}

async function _deleteFIREntry(entryId) {
  openModal('🗑️ FIR حذف کریں',
    `<p style="color:var(--text-secondary);font-size:13px;">کیا آپ یہ FIR متن مستقل حذف کرنا چاہتے ہیں؟</p>`,
    `<button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
     <button class="btn btn-danger" onclick="closeModal();_doDeleteFIR('${entryId}')">🗑️ حذف کریں</button>`
  );
}

async function _doDeleteFIR(entryId) {
  try {
    await supabaseClient.from('case_documents').delete().eq('id', entryId);
    delete _misalDocs['fir'];
    showToast('🗑️ FIR حذف ہو گئی','info');
    _refreshMisalBar();
    _renderFIRView();
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

function _printFIREntry(entryId) {
  const entries = window._firEntries || [];
  const e = entries.find(x => x.id === entryId);
  if (!e) return;
  _doPrintFIR(sanitizeHtml(e.content?.html || ''));
}

function _printFIRAll() {
  const entries = window._firEntries || [];
  const html = entries.map(e => sanitizeHtml(e.content?.html || '')).join('<hr>');
  _doPrintFIR(html);
}

function _doPrintFIR(html) {
  const c = window._workspaceCase || {};
  const o = currentOfficer || {};
  let _printHTML = '';
  _printHTML += (`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap" rel="stylesheet">
    <style>
      @page{margin:15mm;} body{font-family:'Noto Nastaliq Urdu',serif;direction:rtl;font-size:14px;line-height:2;}
      h2{text-align:center;} .header{text-align:center;border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:16px;}
    </style></head><body>
    <div class="header">
      <div style="font-size:18px;font-weight:bold;">تھانہ ${o.station||''} ضلع ${o.district||''}</div>
      <div style="font-size:16px;font-weight:bold;margin-top:6px;">ایف آئی آر — مقدمہ نمبر: ${esc(c.fir_number||'')}</div>
      <div style="font-size:13px;">تاریخ: ${formatDate(c.fir_date)} | دفعات: ${esc(c.section_of_law||'')}</div>
    </div>
    ${html}
    </body></html>`);
  dioPrint(_printHTML);
  
}

function _shareFIREntry(entryId) {
  const entries = window._firEntries || [];
  const e = entries.find(x => x.id === entryId);
  if (!e) return;
  _doShareFIR(_stripTags(e.content?.html||''));
}

function _shareFIRAll() {
  const entries = window._firEntries || [];
  const txt = entries.map(e => _stripTags(e.content?.html||'')).join('\n\n---\n\n');
  _doShareFIR(txt);
}

function _doShareFIR(txt) {
  const c = window._workspaceCase || {};
  const full = `ایف آئی آر — مقدمہ ${c.fir_number||''}\n\n${txt}`;
  if (navigator.share) { navigator.share({title:'FIR',text:full}).catch(()=>{}); }
  else { navigator.clipboard.writeText(full).then(()=>showToast('📋 Copy ہو گئی — WhatsApp میں paste کریں','info')); }
}

// ── SAVE (override to refresh FIR view after save) ────────────
async function saveMisalDoc(docId) {
  const editor = document.getElementById('misal-editor');
  if (!editor) return;
  const html = editor.innerHTML;
  const date = document.getElementById('misal-date')?.value || '';
  try {
    const { error } = await supabaseClient
      .from('case_documents')
      .update({ content: { html, date }, updated_at: new Date().toISOString() })
      .eq('case_id', _misalCaseId)
      .eq('document_type', docId);
    if (error) throw error;
    if (_misalDocs[docId]) _misalDocs[docId].content = { html, date };
    _misalDirty = false;
    // محفوظ فائلوں کی فہرست میں درج (نمبر شمار + تاریخ)
    try {
      if (typeof dioRegisterSaved === 'function') {
        const dName = (MISAL_CASE_DOCS.find(d => d.id === docId) || {}).name || docId;
        dioRegisterSaved('misal', dName, { case_id: _misalCaseId, doc_id: docId });
      }
    } catch(_) {}
    showToast('✅ دستاویز محفوظ ہو گئی', 'success');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

async function markMisalComplete(docId) {
  await saveMisalDoc(docId);
  try {
    await supabaseClient.from('case_documents')
      .update({ status: 'complete' })
      .eq('case_id', _misalCaseId)
      .eq('document_type', docId);
    if (_misalDocs[docId]) _misalDocs[docId].status = 'complete';
    _refreshMisalBar();
    showToast('✅ دستاویز مکمل ہو گئی', 'success');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

// ── PRINT ─────────────────────────────────────────────────────
function printMisalDoc(name) {
  const el = document.getElementById('misal-editor');
  if (!el) return;
  // Clone the editor content and strip out any toolbars/buttons/no-print elements
  const clone = el.cloneNode(true);
  clone.querySelectorAll('button, .no-print, .doc-toolbar, .editor-toolbar, [data-no-print], select, input[type=button]').forEach(n => n.remove());
  let _printHTML = '';
  // انڈیکس نقل مسل → Folio 8.5in×13in, margins 11/8.5/6.5/8mm (asal Word original)
  const _isIdx = (_openDocId === 'index_naql');
  const _pageRule = _isIdx ? 'size:8.5in 13in;margin:11mm 8.5mm 6.5mm 8mm;' : 'size:A4;margin:15mm;';
  _printHTML += (`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <title> </title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap" rel="stylesheet">
    <style>
      @page{${_pageRule}}
      body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;font-size:15px;line-height:${_isIdx?'1.6':'2'};direction:rtl;text-align:right;color:#111;}
      table{width:100%;border-collapse:collapse;}
      td,th{border:1px solid #555;padding:6px 10px;}
      button,.no-print,.doc-toolbar,.editor-toolbar,select{display:none !important;}
      /* Bottom-LEFT branding only — koi tareekh/waqt nahi */
      .dio-print-brand{position:fixed;bottom:3mm;left:4mm;font-size:9px;color:#999;direction:ltr;}
      @media print{body{margin:0}button,.no-print,.doc-toolbar,.editor-toolbar,select{display:none !important;}}
    </style></head><body>${clone.innerHTML}<div class="dio-print-brand">Digital IO</div></body></html>`);
  dioPrint(_printHTML);
}

// ── REFRESH BAR ───────────────────────────────────────────────
function _refreshMisalBar() {
  const bar = document.getElementById('misal-doc-bar');
  if (!bar || !_misalCase) return;
  const newBar = document.createElement('div');
  newBar.innerHTML = renderMisalBar(_misalCase);
  bar.replaceWith(newBar.firstElementChild);
}

// ── URDU VOICE INPUT ──────────────────────────────────────────
let _voiceRecognition = null;
let _voiceActive      = false;

function toggleVoiceInput() {
  if (_voiceActive) {
    _stopVoice();
  } else {
    _startVoice();
  }
}

async function _startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('⚠️ آپ کا براؤزر آواز کو سپورٹ نہیں کرتا — Chrome استعمال کریں', 'error', 6000);
    return;
  }

  const editor = document.getElementById('misal-editor') || document.getElementById('a4-paper');
  if (!editor) { showToast('⚠️ پہلے دستاویز کھولیں', 'error'); return; }

  // Explicitly request microphone permission first
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Permission granted — stop the stream immediately, SpeechRecognition handles its own
    stream.getTracks().forEach(t => t.stop());
  } catch(err) {
    if (err.name === 'NotAllowedError') {
      showToast('❌ مائیکروفون کی اجازت نہیں — براؤزر میں Allow کریں', 'error', 6000);
    } else if (err.name === 'NotFoundError') {
      showToast('❌ کوئی مائیکروفون نہیں ملا — مائیکروفون جوڑیں', 'error', 6000);
    } else {
      showToast('❌ مائیکروفون خرابی: ' + err.message, 'error', 6000);
    }
    return;
  }

  editor.focus();

  _voiceRecognition = new SpeechRecognition();
  _voiceRecognition.lang           = 'ur-PK';
  _voiceRecognition.continuous     = true;
  _voiceRecognition.interimResults = true;

  _voiceRecognition.onstart = () => {
    console.log('[Voice] Started — ur-PK');
  };

  _voiceRecognition.onresult = (event) => {
    let interim = '';
    let final   = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) { final += t + ' '; }
      else { interim += t; }
    }
    if (final) _insertTextAtCursor(editor, final);
    const badge = document.getElementById('voice-status');
    if (badge) badge.textContent = interim ? `🎙️ ${interim}` : '🎙️ سن رہا ہے...';
  };

  _voiceRecognition.onerror = (e) => {
    console.warn('[Voice] Error:', e.error);
    const msgs = {
      'not-allowed':  '❌ مائیکروفون کی اجازت نہیں',
      'no-speech':    null, // ignore silence
      'audio-capture':'❌ مائیکروفون نہیں ملا',
      'network':      '❌ نیٹ ورک کی خرابی — آواز نہیں پہنچ رہی',
      'aborted':      null,
    };
    const msg = msgs[e.error];
    if (msg) { showToast(msg, 'error', 5000); _stopVoice(); }
  };

  _voiceRecognition.onend = () => {
    if (_voiceActive) {
      try { _voiceRecognition.start(); } catch(_) {}
    }
  };

  try {
    _voiceRecognition.start();
    _voiceActive = true;
  } catch(err) {
    showToast('❌ آواز شروع نہیں ہو سکی: ' + err.message, 'error', 5000);
    return;
  }

  const btn = document.getElementById('voice-btn');
  if (btn) {
    btn.style.background  = '#ef4444';
    btn.style.color       = '#fff';
    btn.style.borderColor = '#ef4444';
    btn.textContent       = '⏹️ روکیں';
  }

  // Status bar
  let badge = document.getElementById('voice-status');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'voice-status';
    badge.style.cssText = 'padding:6px 16px;background:#1a1a2e;border-bottom:2px solid #ef4444;font-size:13px;color:#ef4444;direction:rtl;text-align:right;font-family:\'Jameel Noori Nastaleeq\',serif;';
    badge.textContent = '🎙️ سن رہا ہے... اردو میں بولیں';
    const editorArea = document.getElementById('workspace-editor-area');
    if (editorArea) editorArea.insertAdjacentElement('afterbegin', badge);
  }

  showToast('🎙️ اردو میں بولنا شروع کریں', 'success', 3000);
}

function _stopVoice() {
  _voiceActive = false;
  if (_voiceRecognition) { _voiceRecognition.stop(); _voiceRecognition = null; }

  const btn = document.getElementById('voice-btn');
  if (btn) {
    btn.style.background  = '';
    btn.style.color       = '';
    btn.style.borderColor = '';
    btn.textContent       = '🎙️ آواز';
  }

  const badge = document.getElementById('voice-status');
  if (badge) badge.remove();

  showToast('⏹️ آواز کی ریکارڈنگ بند', 'info', 2000);
}

// Insert text at the current cursor position in a contenteditable element
function _insertTextAtCursor(el, text) {
  el.focus();
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(text);
    range.insertNode(node);
    // Move cursor to after inserted text
    range.setStartAfter(node);
    range.setEndAfter(node);
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    // Fallback: append to end
    el.textContent += text;
  }
}

function getMisalTemplate(docId, c) {
  // ═══ انڈکس نقل مسل پولیس — GENUINE FORMAT (user ke INDEX.docx ka hoo-ba-hoo) ═══
  // Auto-fill: مقدمہ data + مدعی (sync) · ملزمان + ضمنیاں (async _fillIndexNaqlData)
  if (docId === 'index_naql') {
    // ═══ انڈکس نقل مسل پولیس — EXACT physical Word original ═══
    // Page: 8.5in × 13in (Folio) · margins 11/8.5/6.5/8 mm (print via printMisalDoc)
    const _o    = currentOfficer || {};
    const _sta  = _o.station  || c?.case_station  || '';
    const _dst  = _o.district || c?.case_district || '';
    const _fd   = (v)=> v ? ((typeof formatDate==='function') ? formatDate(v) : v) : '';
    const _e    = (typeof esc==='function') ? esc : (s=>String(s??''));
    const _fc   = (typeof formatCNIC==='function') ? formatCNIC : (s=>s||'');
    const _fm   = (typeof formatCell==='function') ? formatCell : (s=>s||'');

    // ── Section 2 borders: NO outer left/right · top/bottom/header 1.5pt · internal 0.5pt ──
    // Columns: <col> widths + per-cell width + break-word => long text wraps
    // INSIDE the cell (row grows down), column proportions stay put.
    const _cellWrap = 'word-wrap:break-word;overflow-wrap:break-word;white-space:normal;';
    const _thBase = 'border:none;border-top:1.5pt solid #000;border-bottom:1.5pt solid #000;padding:2px 3px;font-weight:normal;text-align:center;font-size:17pt;line-height:1.7;vertical-align:middle;'+_cellWrap;
    const _tdBase = 'border:none;border-bottom:1.5pt solid #000;padding:3px;text-align:center;font-size:17pt;line-height:1.7;vertical-align:top;'+_cellWrap;
    const _vline  = 'border-left:0.5pt solid #000;';

    // ── Section 5 zimni: full 0.5pt grid (FIX 3: fixed layout too) ──
    const _thZ = 'border:0.5pt solid #000;padding:1px 3px;font-weight:normal;text-align:center;font-size:15pt;line-height:1.6;height:6mm;vertical-align:middle;'+_cellWrap;
    const _tdZ = 'border:0.5pt solid #000;padding:1px 3px;text-align:center;font-size:15pt;line-height:1.6;height:7mm;vertical-align:middle;'+_cellWrap;

    // ── FIX 2: aligned dotted fill-line (fixed width, dotted bottom border) ──
    const _fill = (id, w, extra) => `<span ${id?('id="'+id+'"'):''} class="fill-line" style="display:inline-block;width:${w};border-bottom:1.5px dotted #000;vertical-align:bottom;text-align:center;${extra||''}">&nbsp;</span>`;

    const _cCnic = _fc(c?.complainant_cnic) || '';
    const _cCell = _fm(c?.complainant_cell) || '';
    const _ltrS  = 'unicode-bidi:isolate;direction:ltr;';

    // ── Section 3: four accused blocks (sab par sirf "بنام"); equal fixed-width lines ──
    let _bnam = '';
    for (let i=1;i<=4;i++){
      _bnam += `<div style="font-size:16pt;line-height:8mm;">بنام ${_fill('idxn-name-'+i,'82%','font-weight:bold;')}</div>
<div style="font-size:16pt;line-height:8mm;">رابطہ نمبر ${_fill('idxn-cell-'+i,'28%',_ltrS)} شناختی کارڈ نمبر ${_fill('idxn-cnic-'+i,'34%',_ltrS)}</div>`;
    }

    // ── Section 5 rows: numbers column-wise 1–6 / 7–12 / 13–18 ──
    let _zHead = '<tr>';
    for (let g=0;g<3;g++){
      _zHead += `<th style="${_thZ}width:7.8%;">ضمنی نمبر</th><th style="${_thZ}width:10.4%;">مورخہ</th><th style="${_thZ}width:14.3%;">تفتیشی افسر</th>`;
    }
    _zHead += '</tr>';
    let _zRows = '';
    for (let r=0;r<6;r++){
      _zRows += '<tr>';
      for (let g=0;g<3;g++){
        const n = g*6 + r + 1;
        _zRows += `<td style="${_tdZ}">${n}</td><td style="${_tdZ}" id="idxz-d-${n}">&nbsp;</td><td style="${_tdZ}" id="idxz-o-${n}">&nbsp;</td>`;
      }
      _zRows += '</tr>';
    }
    // FIX 3: <col> widths for zimni table (3 groups × 7.8/10.4/14.3)
    let _zCols = '';
    for (let g=0;g<3;g++){
      _zCols += '<col style="width:7.8%;"><col style="width:10.4%;"><col style="width:14.3%;">';
    }

    return `
<div style="display:flex;align-items:baseline;width:100%;margin:0 0 6px 0;">
  <span style="flex:1 1 0;white-space:nowrap;text-align:right;padding-right:8%;font-size:18pt;">تھانہ ${_e(_sta)}</span>
  <span style="flex:1 1 0;white-space:nowrap;text-align:center;font-size:22pt;font-weight:bold;text-decoration:underline;">انڈکس نقل مسل پولیس</span>
  <span style="flex:1 1 0;white-space:nowrap;text-align:left;font-size:18pt;">ضلع ${_e(_dst)}</span>
</div>
<table style="width:100%;border-collapse:collapse;border:none;margin-bottom:6px;table-layout:fixed;">
  <colgroup>
    <col style="width:11.4%;"><col style="width:10.8%;"><col style="width:11.3%;"><col style="width:14.4%;"><col style="width:15.5%;"><col style="width:36.6%;">
  </colgroup>
  <tr style="height:14mm;">
    <th style="${_thBase}${_vline}width:11.4%;">مقدمہ نمبر</th>
    <th style="${_thBase}${_vline}width:10.8%;">تاریخ وقوعہ</th>
    <th style="${_thBase}${_vline}width:11.3%;">تاریخ رجوعہ</th>
    <th style="${_thBase}${_vline}width:14.4%;">جرم</th>
    <th style="${_thBase}${_vline}width:15.5%;">تعداد اوراق</th>
    <th style="${_thBase}width:36.6%;">حکم اخیر عدالت</th>
  </tr>
  <tr style="height:40mm;">
    <td style="${_tdBase}${_vline}">${_e(c?.fir_number||'')}</td>
    <td style="${_tdBase}${_vline}">${_fd(c?.occurrence_date)}</td>
    <td style="${_tdBase}${_vline}">${_fd(c?.fir_date)}</td>
    <td style="${_tdBase}${_vline}">${_e(c?.section_of_law||'')}</td>
    <td style="${_tdBase}${_vline}"></td>
    <td style="${_tdBase}"></td>
  </tr>
</table>
<div style="padding:0 14px;">
  <div style="font-size:16pt;line-height:8mm;">سرکار بذریعہ <span id="idxn-complainant" class="fill-line" style="display:inline-block;width:82%;border-bottom:1.5px dotted #000;vertical-align:bottom;text-align:center;font-weight:bold;">${_e(c?.complainant||'')||'&nbsp;'}</span></div>
  <div style="font-size:16pt;line-height:8mm;">رابطہ نمبر <span id="idxn-mudai-cell" class="fill-line" style="display:inline-block;width:28%;border-bottom:1.5px dotted #000;vertical-align:bottom;text-align:center;${_ltrS}">${_e(_cCell)||'&nbsp;'}</span> شناختی کارڈ نمبر <span id="idxn-mudai-cnic" class="fill-line" style="display:inline-block;width:34%;border-bottom:1.5px dotted #000;vertical-align:bottom;text-align:center;${_ltrS}">${_e(_cCnic)||'&nbsp;'}</span></div>
  ${_bnam}
</div>
<div style="text-align:center;font-size:20pt;font-weight:bold;text-decoration:underline;margin:3px 0 2px;">انڈکس ضمنیات</div>
<table style="width:100%;border-collapse:collapse;table-layout:fixed;"><colgroup>${_zCols}</colgroup>${_zHead}${_zRows}</table>`;
  }

  const o   = currentOfficer || {};
  const fir = c?.fir_number  || '________';
  const dt  = c?.fir_date    || '________';
  const sec = c?.section_of_law || '________';
  const ofc = c?.offence_type   || '________';
  const sta = o.station || c?.case_station || '________';
  const dst = o.district|| c?.case_district|| '________';
  const cmp = c?.complainant   || '________';
  const cnic= c?.complainant_cnic||'________';
  const cel = c?.complainant_cell||'________';
  const ion = o.full_name      || '________';
  const rnk = o.designation   || '________';
  const bdg = o.badge_number  || '________';

  const header = (title) => `
    <div style="text-align:center;border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:16px;">
      <div style="font-size:14px;">تھانہ ${sta} &nbsp;—&nbsp; ضلع ${dst}</div>
      <div style="font-size:16px;font-weight:bold;margin-top:6px;">${title}</div>
      <div style="font-size:12px;margin-top:4px;">مقدمہ نمبر: ${fir} &nbsp;|&nbsp; تاریخ: ${dt}</div>
    </div>`;

  const row = (label, val='') => `
    <tr>
      <td style="width:35%;font-weight:bold;background:#f5f5f5;">${label}</td>
      <td>${val}</td>
    </tr>`;

  const table = (rows) => `<table style="width:100%;border-collapse:collapse;margin-bottom:12px;">${rows}</table>`;

  const sig = `
    <div style="margin-top:40px;display:flex;justify-content:space-between;">
      <div style="text-align:center;">
        <div>_______________________</div>
        <div style="font-size:12px;">دستخط مدعی</div>
      </div>
      <div style="text-align:center;">
        <div>_______________________</div>
        <div style="font-size:12px;">${rnk} ${ion} (${bdg})</div>
        <div style="font-size:12px;">تفتیشی افسر</div>
      </div>
    </div>`;

  const templates = {

    fir: `${header('ایف آئی آر — مقدمہ اول اطلاع')}
      ${table(
        row('مقدمہ نمبر', fir) +
        row('تاریخ و وقت', dt) +
        row('دفعات', sec) +
        row('نوعیت جرم', ofc) +
        row('تھانہ', sta) +
        row('ضلع', dst) +
        row('مدعی / شکایت کنندہ', cmp) +
        row('شناختی کارڈ', cnic) +
        row('رابطہ نمبر', cel)
      )}
      <div style="font-weight:bold;margin-bottom:6px;">بیان مدعی:</div>
      <div style="min-height:120px;border:1px solid #ccc;padding:10px;border-radius:4px;" contenteditable="true">بیان یہاں درج کریں...</div>
      <div style="font-weight:bold;margin:12px 0 6px;">اطلاع کردہ ملزمان:</div>
      <div style="min-height:60px;border:1px solid #ccc;padding:10px;border-radius:4px;" contenteditable="true">ملزمان کے نام...</div>
      ${sig}`,

    report_173: `${header('رپورٹ 173 ضابطہ فوجداری')}
      <div style="margin-bottom:10px;">بخدمت جناب عدالت __________</div>
      ${table(
        row('مقدمہ نمبر', fir) +
        row('دفعات', sec) +
        row('تاریخ وقوعہ', c?.occurrence_date||'________') +
        row('تھانہ', sta) +
        row('مدعی', cmp)
      )}
      <div style="font-weight:bold;margin-bottom:6px;">تفتیش کا نتیجہ:</div>
      <div style="min-height:80px;border:1px solid #ccc;padding:10px;border-radius:4px;" contenteditable="true">تفتیش کے نتیجے یہاں درج کریں...</div>
      <div style="font-weight:bold;margin:12px 0 6px;">گواہان:</div>
      <div style="min-height:60px;border:1px solid #ccc;padding:10px;border-radius:4px;" contenteditable="true">گواہان کی فہرست...</div>
      <div style="font-weight:bold;margin:12px 0 6px;">ملزمان:</div>
      <div style="min-height:60px;border:1px solid #ccc;padding:10px;border-radius:4px;" contenteditable="true">ملزمان کی فہرست...</div>
      ${sig}`,

    crime_scene: `${header('جائے واردات کا نقشہ و رپورٹ')}
      ${table(
        row('مقدمہ نمبر', fir) +
        row('تاریخ وقوعہ', c?.occurrence_date||'________') +
        row('مقام وقوعہ', '________') +
        row('موسم و روشنی', '________')
      )}
      <div style="font-weight:bold;margin-bottom:6px;">جائے واردات کی تفصیل:</div>
      <div style="min-height:100px;border:1px solid #ccc;padding:10px;border-radius:4px;" contenteditable="true">مقام وقوعہ کی تفصیل یہاں درج کریں...</div>
      <div style="font-weight:bold;margin:12px 0 6px;">جائے واردات کا خاکہ / نقشہ:</div>
      <div style="min-height:160px;border:2px dashed #ccc;padding:10px;border-radius:4px;text-align:center;color:#999;" contenteditable="true">نقشہ یہاں بنائیں یا تفصیل لکھیں</div>
      <div style="font-weight:bold;margin:12px 0 6px;">موقع سے برآمد شدہ نشانات:</div>
      <div style="min-height:60px;border:1px solid #ccc;padding:10px;border-radius:4px;" contenteditable="true">نشانات...</div>
      ${sig}`,

    named_accused: `${header('نامزد ملزمان')}
      <div style="font-size:12px;margin-bottom:12px;">مقدمہ نمبر: ${fir} &nbsp;|&nbsp; دفعات: ${sec}</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        <thead><tr style="background:#333;color:#fff;">
          <th style="padding:6px;border:1px solid #555;">نمبر</th>
          <th style="padding:6px;border:1px solid #555;">نام</th>
          <th style="padding:6px;border:1px solid #555;">ولدیت</th>
          <th style="padding:6px;border:1px solid #555;">قوم / ذات</th>
          <th style="padding:6px;border:1px solid #555;">پتہ</th>
          <th style="padding:6px;border:1px solid #555;">شناختی کارڈ</th>
          <th style="padding:6px;border:1px solid #555;">حالت</th>
        </tr></thead>
        <tbody>
          ${[1,2,3,4,5].map(n=>`<tr>
            <td style="border:1px solid #ccc;padding:6px;text-align:center;">${n}</td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true">زیر حراست / فرار</td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${sig}`,

    unknown_accused: `${header('نامعلوم ملزمان')}
      <div style="font-size:12px;margin-bottom:12px;">مقدمہ نمبر: ${fir}</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        <thead><tr style="background:#333;color:#fff;">
          <th style="padding:6px;border:1px solid #555;">نمبر</th>
          <th style="padding:6px;border:1px solid #555;">حلیہ</th>
          <th style="padding:6px;border:1px solid #555;">عمر (تخمینہ)</th>
          <th style="padding:6px;border:1px solid #555;">قد</th>
          <th style="padding:6px;border:1px solid #555;">خصوصی نشانات</th>
          <th style="padding:6px;border:1px solid #555;">لباس</th>
        </tr></thead>
        <tbody>
          ${[1,2,3].map(n=>`<tr>
            <td style="border:1px solid #ccc;padding:6px;text-align:center;">${n}</td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${sig}`,

    witnesses: `${header('گواہان')}
      <div style="font-size:12px;margin-bottom:12px;">مقدمہ نمبر: ${fir}</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        <thead><tr style="background:#333;color:#fff;">
          <th style="padding:6px;border:1px solid #555;">نمبر</th>
          <th style="padding:6px;border:1px solid #555;">نام گواہ</th>
          <th style="padding:6px;border:1px solid #555;">ولدیت</th>
          <th style="padding:6px;border:1px solid #555;">پتہ</th>
          <th style="padding:6px;border:1px solid #555;">رابطہ</th>
          <th style="padding:6px;border:1px solid #555;">قسم گواہ</th>
        </tr></thead>
        <tbody>
          ${[1,2,3,4,5].map(n=>`<tr>
            <td style="border:1px solid #ccc;padding:6px;text-align:center;">${n}</td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true">چشم دید / سماعتی</td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${sig}`,

    stolen: `${header('مسروقہ مال')}
      ${table(row('مقدمہ نمبر', fir) + row('تاریخ', dt))}
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        <thead><tr style="background:#333;color:#fff;">
          <th style="padding:6px;border:1px solid #555;">نمبر</th>
          <th style="padding:6px;border:1px solid #555;">مال کی تفصیل</th>
          <th style="padding:6px;border:1px solid #555;">تعداد</th>
          <th style="padding:6px;border:1px solid #555;">مالیت</th>
          <th style="padding:6px;border:1px solid #555;">مالک</th>
          <th style="padding:6px;border:1px solid #555;">نشانِ خاص</th>
        </tr></thead>
        <tbody>
          ${[1,2,3,4,5].map(n=>`<tr>
            <td style="border:1px solid #ccc;padding:6px;text-align:center;">${n}</td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${sig}`,

    recovery: `${header('برآمدگی مال')}
      ${table(row('مقدمہ نمبر', fir) + row('تاریخ برآمدگی', '________') + row('مقام برآمدگی', '________'))}
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        <thead><tr style="background:#333;color:#fff;">
          <th style="padding:6px;border:1px solid #555;">نمبر</th>
          <th style="padding:6px;border:1px solid #555;">برآمد شدہ مال</th>
          <th style="padding:6px;border:1px solid #555;">تعداد</th>
          <th style="padding:6px;border:1px solid #555;">مالیت</th>
          <th style="padding:6px;border:1px solid #555;">برآمد از</th>
          <th style="padding:6px;border:1px solid #555;">حالت</th>
        </tr></thead>
        <tbody>
          ${[1,2,3,4].map(n=>`<tr>
            <td style="border:1px solid #ccc;padding:6px;text-align:center;">${n}</td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${sig}`,

    court_dates: `${header('عدالت میں ساعت کی تاریخیں')}
      ${table(row('مقدمہ نمبر', fir) + row('عدالت', '________') + row('جج صاحب', '________'))}
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        <thead><tr style="background:#333;color:#fff;">
          <th style="padding:6px;border:1px solid #555;">تاریخ</th>
          <th style="padding:6px;border:1px solid #555;">کارروائی</th>
          <th style="padding:6px;border:1px solid #555;">اگلی تاریخ</th>
          <th style="padding:6px;border:1px solid #555;">نوٹ</th>
        </tr></thead>
        <tbody>
          ${[1,2,3,4,5,6,7,8].map(()=>`<tr>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${sig}`,

    inv_result: `${header('نتیجہ تفتیش')}
      ${table(
        row('مقدمہ نمبر', fir) +
        row('دفعات', sec) +
        row('تھانہ', sta) +
        row('تفتیشی افسر', `${rnk} ${ion} (${bdg})`)
      )}
      <div style="font-weight:bold;margin-bottom:6px;">تفتیش کا خلاصہ:</div>
      <div style="min-height:100px;border:1px solid #ccc;padding:10px;border-radius:4px;" contenteditable="true">تفتیش کا خلاصہ یہاں درج کریں...</div>
      <div style="font-weight:bold;margin:12px 0 6px;">نتیجہ:</div>
      <div style="border:1px solid #ccc;padding:10px;border-radius:4px;">
        <label style="display:block;margin-bottom:6px;"><input type="radio" name="result"> چالان پیش کیا جائے</label>
        <label style="display:block;margin-bottom:6px;"><input type="radio" name="result"> رپورٹ 173 — ملزم فرار</label>
        <label style="display:block;margin-bottom:6px;"><input type="radio" name="result"> کینسل</label>
        <label style="display:block;"><input type="radio" name="result"> عدم پتہ</label>
      </div>
      ${sig}`,

    checklist: `${header('وقوعہ کی چیک لسٹ')}
      ${table(row('مقدمہ نمبر', fir) + row('دفعات', sec))}
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#333;color:#fff;">
          <th style="padding:6px;border:1px solid #555;">نمبر</th>
          <th style="padding:6px;border:1px solid #555;">دستاویز / کارروائی</th>
          <th style="padding:6px;border:1px solid #555;">مکمل</th>
          <th style="padding:6px;border:1px solid #555;">تاریخ</th>
          <th style="padding:6px;border:1px solid #555;">نوٹ</th>
        </tr></thead>
        <tbody>
          ${[
            'ایف آئی آر رجسٹریشن',
            'جائے واردات کا معائنہ',
            'ملزم کی گرفتاری',
            'برآمدگی',
            'طبی معائنہ',
            'فرانزک نمونے',
            'گواہان کے بیانات',
            'فوٹوگرافی',
            'خاکہ جائے واردات',
            'رپورٹ 173 جمع',
          ].map((item,i)=>`<tr>
            <td style="border:1px solid #ccc;padding:6px;text-align:center;">${i+1}</td>
            <td style="border:1px solid #ccc;padding:6px;">${item}</td>
            <td style="border:1px solid #ccc;padding:6px;text-align:center;"><input type="checkbox"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${sig}`,

  };

  // USOOL: jis dastawez ka manzoor-shuda format abhi defined nahi, woh sirf
  // KHALI SAFED KAGHAZ par khulti hai — software apni taraf se koi format,
  // heading, khana ya dastakhat nahi deta. Owner/admin khud form set karega.
  const generic = '';

  return templates[docId] || generic;
}

// ═══════════════════════════════════════════════════════════════════════
//  FULL-PAGE DOCUMENT VIEW  (پورے صفحے پر دستاویز)
//  • Chip par click → dastawez poore page par khulti hai
//  • Chips/toolbars background mein chale jate hain
//  • Corner mein sirf: ↩ واپس  aur  🖨️ پرنٹ
//  • Kai dastawezat aik saath khuli reh sakti hain (tabs)
//  Design: #workspace-editor-area ko overlay ke andar MOVE karte hain,
//  is liye har module (witnesses/mulziman/report173/misal) bina tabdeeli
//  ke waise hi kaam karta hai.
// ═══════════════════════════════════════════════════════════════════════

let _dioTabs = [];        // [{id, name}]
let _dioActiveTab = null;
let _dioAreaHome = null;  // original parent of #workspace-editor-area

// ── Document ka Urdu naam nikalo (special views samet) ──
function _dioDocName(docId) {
  const special = {
    witnesses_fir:   'گواہان FIR',
    witnesses_cross: 'گواہان کراس ورژن',
    named_accused:   'ملزمان FIR',
    accused_cross:   'ملزمان کراس ورژن',
    shahadatain:     'شہادتیں',
    fir:             'الف آئی آر',
    cross_version:   'کراس ورژن',
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
        <button onclick="_dioExitDocView()" title="واپس دستاویزات"
          style="background:var(--bg-tertiary);color:var(--text-primary);border:1px solid var(--border);
                 border-radius:8px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer;
                 font-family:'Jameel Noori Nastaleeq',serif;">↩ واپس</button>
        <button onclick="_dioExitDocView();goBackToCases();" title="واپس مقدمات"
          style="background:var(--bg-tertiary);color:var(--text-primary);border:1px solid var(--border);
                 border-radius:8px;padding:8px 12px;font-size:13px;font-weight:700;cursor:pointer;">⌂</button>
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
  if (area && _dioAreaHome) _dioAreaHome.appendChild(area);
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
