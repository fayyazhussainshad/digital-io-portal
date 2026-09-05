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
  { id:'daakt_haye',       name:'ڈاکٹ ہائے',                 desc:'Docket / Dak' },
  { id:'rfa_form',         name:'RFA فارم',                  desc:'RFA Form' },
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
      <!-- واپس — چپس کی پٹی کا حصہ، بائیں سرے پر -->
      <button onclick="dioGoBack()" title="واپس" aria-label="واپس"
        style="order:999;margin-right:auto;width:34px;height:34px;border-radius:50%;flex-shrink:0;
               cursor:pointer;border:1px solid var(--border);background:var(--bg-card);
               color:var(--text-primary);font-size:18px;font-weight:900;line-height:1;direction:ltr;">←</button>
      ${indexChip}
      ${_misalDropdown('fir-dd', 'الف آئی آر', [
        {label:'الف آئی آر', act:`_ddPick('fir-dd','fir')`},
        ...(typeof caseHasCross==='function' && caseHasCross(c) ? [{label:'کراس ورژن', act:`_ddPick('fir-dd','cross_version')`}] : [])
      ], _misalHasData('fir'))}
      ${_misalDropdown('acc-dd', 'ملزمان', [
        {label:'ملزمان FIR', act:`_ddPick('acc-dd','named_accused')`},
        ...(typeof caseHasCross==='function' && caseHasCross(c) ? [{label:'ملزمان کراس ورژن', act:`_ddPick('acc-dd','accused_cross')`}] : [])
      ], _misalHasData('named_accused'))}
      ${_misalDropdown('wit-dd', 'گواہان', [
        {label:'گواہان FIR', act:`_ddPick('wit-dd','witnesses_fir')`},
        ...(typeof caseHasCross==='function' && caseHasCross(c) ? [{label:'گواہان کراس ورژن', act:`_ddPick('wit-dd','witnesses_cross')`}] : [])
      ], _misalHasData('witnesses_fir'))}
      <span class="mdoc-chip ${_misalHasData('report_173') ? 'mdoc-done' : 'mdoc-empty'}" onclick="openR173List()" title="رپورٹ 173 ض ف">رپورٹ 173 ض ف</span>
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
    /* RULE (poore system): sab chips DHEEMA (aik jaisa) — SIRF jis chip mein
       data mehfooz ho jaye woh GREEN. (Pehle "added" alag neela tha — ab woh
       bhi dheema, taake sirf green se pata chale ke kaam ho chuka hai.) */
    .mdoc-empty{ color:var(--text-muted);  background:var(--bg-tertiary);   border-color:var(--border); }
    .mdoc-added{ color:var(--text-muted);  background:var(--bg-tertiary);   border-color:var(--border); }
    .mdoc-done { color:var(--green);       background:rgba(34,197,94,0.16);  border-color:var(--green);  font-weight:700; }
  </style>`;
}

// ── Kisi doc/type ka data mehfooz hai ya nahi (chip green karne ke liye) ──
function _misalHasData(key) {
  try {
    // case_documents (misal) — _misalDocs mein status complete ya content
    if (_misalDocs && _misalDocs[key]) {
      const s = _misalDocs[key];
      if (s.status === 'complete') return true;
      if (s.content && Object.keys(s.content).length) return true;
    }
    // report_173 — alag table; localStorage flag se check
    if (key === 'report_173') {
      const cid = _misalCaseId || (_misalCase && _misalCase.id);
      if (cid) {
        const r = localStorage.getItem('dio_r173docs_' + cid);
        if (r) { try { const a = JSON.parse(r); if (a && a.length) return true; } catch(_){} }
        const r2 = localStorage.getItem('dio_r173_' + cid);
        if (r2 && r2.length > 5) return true;
      }
    }
    // RFA فارم — alag table (rfa_forms); localStorage list se check
    if (key === 'rfa_form') {
      const cid = _misalCaseId || (_misalCase && _misalCase.id);
      if (cid) {
        const r = localStorage.getItem('dio_rfalist_' + cid);
        if (r) { try { const a = JSON.parse(r); if (a && a.length) return true; } catch(_){} }
      }
    }
    // saved-docs (shared) — localStorage list
    const cid2 = _misalCaseId || (_misalCase && _misalCase.id);
    if (cid2) {
      const sd = localStorage.getItem('dio_sd_' + key + '_' + cid2);
      if (sd) { try { const a = JSON.parse(sd); if (a && a.length) return true; } catch(_){} }
    }
  } catch (_) {}
  return false;
}
window._misalHasData = _misalHasData;

// ── DROPDOWN BUTTONS (merged FIR / ملزمان / گواہان) ────────────
function _misalDropdown(ddId, label, options, hasData) {
  const cls = hasData ? 'mdoc-done' : 'mdoc-empty';
  if (!options || options.length <= 1) {
    const only = options && options[0];
    if (!only) return '';
    return `<span class="mdoc-chip ${cls}" onclick="${only.act}"
              style="cursor:pointer;">${label}</span>`;
  }
  return `
  <span style="position:relative;display:inline-block;">
    <span class="mdoc-chip ${cls}" onclick="_toggleDD(event,'${ddId}')" style="cursor:pointer;">
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
async function _doAddMisalDoc(docId) {
  const def = MISAL_CASE_DOCS.find(d => d.id === docId);
  if (!def || !_misalCaseId) return;
  // سزا سلپ → seedha full-page editor kholo (record khud save par banega —
  // report173/challan jaisa). Yahan khali record insert karne ki zaroorat nahi.
  if (docId === 'saza_slip') { _openMisalEditor(docId); return; }
  // درخواستیں → seedha full-page editor (darkhwastain.js)
  if (docId === 'darkhwastain') { _openMisalEditor(docId); return; }
  // RFA فارم → seedha full-page editor (rfa-form.js); record khud save par banega
  if (docId === 'rfa_form') { _openMisalEditor(docId); return; }
  const isPersonForm = (docId === 'witnesses_fir' || docId === 'witnesses_cross' ||
                        docId === 'named_accused' || docId === 'unknown_accused' ||
                        docId === 'zamniyat' || docId === 'memorandum' ||
                        docId === 'statements_161' ||
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

  // Special: سزا سلپ → full-page Saza Slip editor (saza-slip.js)
  if (docId === 'saza_slip') {
    _openDocId = docId;
    if (typeof openSazaSlip === 'function') openSazaSlip(_misalCaseId);
    return;
  }

  // Special: درخواستیں → full-page Applications editor (darkhwastain.js)
  if (docId === 'darkhwastain') {
    _openDocId = docId;
    if (typeof openDarkhwast === 'function') openDarkhwast(_misalCaseId);
    return;
  }

  // Special: RFA فارم → full-page RFA editor (rfa-form.js)
  if (docId === 'rfa_form') {
    _openDocId = docId;
    if (typeof openRfaForm === 'function') openRfaForm(_misalCaseId);
    return;
  }

  // Special: بیانات 161 ض ف → Androoni Zimni editor
  // (mojooda govt rules ke mutabiq gawahan ke 161 CrPC byanat andarooni
  //  zimni par hi likhe jate hain — isi liye yeh chip seedha wahi khulti hai,
  //  alag koi generic khali document editor nahi)
  if (docId === 'statements_161') {
    _openDocId = docId;
    if (typeof openZimniAndrooniEditor === 'function') openZimniAndrooniEditor(_misalCaseId);
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
function _mToggleTablePicker() {
  const p = document.getElementById('misal-table-picker');
  if (p) p.style.display = p.style.display === 'none' ? 'block' : 'none';
}
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
