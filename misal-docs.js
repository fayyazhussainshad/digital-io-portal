/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — MISAL DOCUMENT SYSTEM  (misal-docs.js)
   All 33 official case documents — Urdu format
   Click to add to case → pre-filled template → save to DB
   ═══════════════════════════════════════════════════════════ */

// ── ALL 33 OFFICIAL DOCUMENTS ────────────────────────────────
const MISAL_CASE_DOCS = [
  { id:'fir',              name:'ایف آئی آر',               desc:'First Information Report' },
  { id:'cross_version',    name:'کراس ورشن',                 desc:'Cross Version' },
  { id:'report_173',       name:'رپورٹ 173 ض ف',            desc:'Report u/s 173 CrPC' },
  { id:'crime_scene',      name:'جائے واردات',               desc:'Scene of Crime' },
  { id:'named_accused',    name:'نامزد ملزمان',              desc:'Named Accused' },
  { id:'witnesses_fir',    name:'گواہان FIR',                desc:'FIR Witnesses' },
  { id:'witnesses_cross',  name:'گواہان کراس ورشن',          desc:'Cross Version Witnesses' },
  { id:'statements_161',   name:'بیانات 161 ض ف',            desc:'Statements u/s 161 CrPC' },
  { id:'incidents',        name:'وقوعہ جات',                 desc:'Incidents' },
  { id:'fardat',           name:'فردات',                     desc:'Fardat' },
  { id:'zamniyat',         name:'ضمنیات',                    desc:'Annexures' },
  { id:'memorandum',       name:'میمورنڈم',                  desc:'Memorandum' },
  { id:'cdr_analyzer',     name:'CDR Analyzer',              desc:'CDR Analyzer' },
  { id:'cdr_imei',         name:'CDR/IMEI',                  desc:'CDR/IMEI Analysis' },
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
  { id:'shahadatain',      name:'شہادتیں',                   desc:'Evidence / Testimonies' },
];

// ── STATE ─────────────────────────────────────────────────────
let _misalDocs   = {};   // { docId: {id, content, status} } for current case
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
  _misalCase = c;
  const items = MISAL_CASE_DOCS.map(d => {
    const saved = _misalDocs[d.id];
    const done  = saved?.status === 'complete';
    const added = !!saved;
    const cls   = done ? 'mdoc-done' : added ? 'mdoc-added' : 'mdoc-empty';
    // ALL documents: open the editor directly (no add/remove confirmation box)
    const action = added ? `_openMisalEditor('${d.id}')` : `_doAddMisalDoc('${d.id}')`;
    return `<span class="mdoc-chip ${cls}" onclick="${action}" title="${d.desc}">${d.name}</span>`;
  }).join('');

  return `
  <div id="misal-doc-bar" style="
    padding:12px 16px;
    background:var(--bg-secondary);
    border-bottom:1px solid var(--border);">
    <div style="font-size:11px;color:var(--text-faint);margin-bottom:8px;display:flex;gap:16px;align-items:center;flex-wrap:wrap;direction:rtl;">
      <span>مثال دستاویزات</span>
      <span><span style="color:var(--text-muted);">■</span> شامل نہیں</span>
      <span><span style="color:var(--accent);">■</span> جاری</span>
      <span><span style="color:var(--green);">■</span> مکمل</span>
      <!-- SHO / DSP quick-set buttons -->
      <span style="margin-inline-start:auto;display:flex;gap:6px;align-items:center;">
        <button onclick="_setMisalOfficer('sho','${c.id}')" title="SHO کا نام مقرر کریں"
          style="background:${c.sho_name?'rgba(34,197,94,0.15)':'var(--bg-tertiary)'};border:1px solid ${c.sho_name?'var(--green)':'var(--border)'};border-radius:8px;padding:4px 10px;font-size:11px;color:${c.sho_name?'var(--green)':'var(--text-secondary)'};cursor:pointer;font-family:'Jameel Noori Nastaleeq',serif;">
          👮 SHO${c.sho_name?': '+c.sho_name:''}
        </button>
        <button onclick="_setMisalOfficer('dsp','${c.id}')" title="DSP/SDPO کا نام مقرر کریں"
          style="background:${c.dsp_name?'rgba(34,197,94,0.15)':'var(--bg-tertiary)'};border:1px solid ${c.dsp_name?'var(--green)':'var(--border)'};border-radius:8px;padding:4px 10px;font-size:11px;color:${c.dsp_name?'var(--green)':'var(--text-secondary)'};cursor:pointer;font-family:'Jameel Noori Nastaleeq',serif;">
          🎖️ DSP/SDPO${c.dsp_name?': '+c.dsp_name:''}
        </button>
      </span>
    </div>
    <div style="display:flex;gap:8px;direction:rtl;flex-wrap:wrap;">${items}</div>
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
                        docId === 'named_accused' || docId === 'unknown_accused');
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
    // Persons (witnesses/accused) → open their card form. Other docs → silent (no MS Word page).
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
function _openMisalEditor(docId) {
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

  // Special: گواہان shows structured witness card system (form only — no side table, no doc page)
  if (docId === 'witnesses_fir' || docId === 'witnesses_cross') {
    _openDocId = docId;
    if (typeof openWitnessesCard === 'function') openWitnessesCard(_misalCaseId);
    return;
  }

  // Special: ملزمان / مجرمان shows accused form (form only — no side table, no doc page)
  if (docId === 'named_accused' || docId === 'unknown_accused') {
    _openDocId = docId;
    if (typeof openAccusedCard === 'function') {
      openAccusedCard(_misalCaseId);
    } else if (typeof openWitnessesCard === 'function') {
      openWitnessesCard(_misalCaseId);
    }
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
  const added = MISAL_CASE_DOCS.filter(d => _misalDocs[d.id]);
  if (!added.length) return `
    <div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px;line-height:1.8;">
      <div style="font-size:28px;margin-bottom:8px;">📂</div>
      ابھی کوئی دستاویز شامل نہیں<br>
      اوپر دستاویز کے نام پر کلک کریں
    </div>`;

  return added.map(d => {
    const saved = _misalDocs[d.id];
    const done  = saved?.status === 'complete';
    const isOpen = _openDocId === d.id;
    return `
      <div class="misal-sidebar-item doc-card ${isOpen?'active':''}" id="msb-${d.id}"
           onclick="_openMisalEditor('${d.id}')"
           style="cursor:pointer;padding:10px 12px;border-bottom:1px solid var(--border);">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:16px;">${done?'✅':'📄'}</span>
          <div style="flex:1;">
            <div style="font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;font-size:15px;direction:rtl;color:${done?'var(--green)':isOpen?'var(--accent)':'var(--text-primary)'};">${d.name}</div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">${done?'مکمل':'مسودہ'}</div>
          </div>
        </div>
      </div>`;
  }).join('');
}

function _refreshMisalSidebar() {
  const list = document.getElementById('workspace-doc-list');
  if (list) list.innerHTML = renderMisalDocSidebar();
}

function _renderMisalEditor(docId, def) {
  const area = document.getElementById('workspace-editor-area');
  if (!area) return;

  const saved   = _misalDocs[docId];
  const content = saved?.content?.html || getMisalTemplate(docId, _misalCase);

  area.innerHTML =
    buildWordToolbar('misal-editor', {
      showVoice:    true,
      showSave:     true,
      saveLabel:    '💾 محفوظ',
      onSave:       "saveMisalDoc('" + docId + "')",
      showComplete: true,
      completeLabel:'✅ مکمل',
      onComplete:   "markMisalComplete('" + docId + "')",
      onPrint:      "printMisalDoc('" + def.name.replace(/'/g,"\\'") + "')",
      titleHtml:    def.name,
    }) +
    `<div style="flex:1;overflow-y:auto;padding:20px;background:var(--bg-tertiary);">
      <div style="max-width:210mm;margin:0 auto 10px;display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" onclick="_addCustomField('misal-editor')">➕ خانہ شامل کریں</button>
        <button class="btn btn-secondary btn-sm" onclick="_addCustomTable('misal-editor')">➕ ٹیبل شامل کریں</button>
        <span style="font-size:11px;color:var(--text-muted);align-self:center;">اپنی مرضی کے خانے یا ٹیبل شامل کریں</span>
      </div>
      <div id="misal-editor" contenteditable="true" spellcheck="false" style="
        width:210mm;max-width:100%;min-height:297mm;
        margin:0 auto;padding:20mm;
        background:#fff;color:#111;
        font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
        font-size:14pt;line-height:1.5;
        direction:rtl;text-align:right;
        box-shadow:0 4px 20px rgba(0,0,0,0.15);
        border-radius:4px;outline:none;
      ">${content}</div>
    </div>`;
  // Wrap in outer flex column
  const _outer = document.createElement('div');
  _outer.style.cssText = 'display:flex;flex-direction:column;height:100%;';
  _outer.innerHTML = area.innerHTML;
  area.innerHTML = '';
  area.appendChild(_outer);
  // Activate selection-change tracking
  setTimeout(function() { setupWordToolbar('misal-editor'); }, 80);
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
        متن ایف آئی آر — مقدمہ ${c.fir_number||''}
      </div>
      <div style="display:flex;gap:6px;direction:rtl;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="_openFIREditor()">📝 متن درج کریں</button>
        <button class="btn btn-secondary" onclick="_printFIRAll()">🖨️ پرنٹ</button>
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
  _doPrintFIR(e.content?.html || '');
}

function _printFIRAll() {
  const entries = window._firEntries || [];
  const html = entries.map(e => e.content?.html || '').join('<hr>');
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
      <div style="font-size:16px;font-weight:bold;margin-top:6px;">ایف آئی آر — مقدمہ نمبر: ${c.fir_number||''}</div>
      <div style="font-size:13px;">تاریخ: ${formatDate(c.fir_date)} | دفعات: ${c.section_of_law||''}</div>
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
  try {
    const { error } = await supabaseClient
      .from('case_documents')
      .update({ content: { html }, updated_at: new Date().toISOString() })
      .eq('case_id', _misalCaseId)
      .eq('document_type', docId);
    if (error) throw error;
    if (_misalDocs[docId]) _misalDocs[docId].content = { html };
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
  _printHTML += (`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <title>${name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap" rel="stylesheet">
    <style>
      @page{margin:15mm}
      body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;font-size:15px;line-height:2;direction:rtl;text-align:right;color:#111;}
      table{width:100%;border-collapse:collapse;}
      td,th{border:1px solid #555;padding:6px 10px;}
      button,.no-print,.doc-toolbar,.editor-toolbar,select{display:none !important;}
      @media print{body{margin:0}button,.no-print,.doc-toolbar,.editor-toolbar,select{display:none !important;}}
    </style></head><body>${clone.innerHTML}</body></html>`);
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
      <div style="font-size:18px;font-weight:bold;">پنجاب پولیس</div>
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

  const generic = `${header(MISAL_CASE_DOCS.find(d=>d.id===docId)?.name||docId)}
    ${table(row('مقدمہ نمبر', fir) + row('تاریخ', dt) + row('دفعات', sec) + row('تھانہ', sta))}
    <div style="font-weight:bold;margin-bottom:6px;">تفصیل:</div>
    <div style="min-height:200px;border:1px solid #ccc;padding:12px;border-radius:4px;" contenteditable="true">
      یہاں تفصیل درج کریں...
    </div>
    ${sig}`;

  return templates[docId] || generic;
}
