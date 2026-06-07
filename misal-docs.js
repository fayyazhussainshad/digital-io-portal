/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — MISAL DOCUMENT SYSTEM  (misal-docs.js)
   All 33 official case documents — Urdu format
   Click to add to case → pre-filled template → save to DB
   ═══════════════════════════════════════════════════════════ */

// ── ALL 33 OFFICIAL DOCUMENTS ────────────────────────────────
const CASE_DOCS = [
  { id:'fir',              name:'ایف آئی آر',                              desc:'First Information Report' },
  { id:'cross',            name:'کراس ورش',                                desc:'Cross Verification' },
  { id:'position',         name:'پوزیشن مقدمہ',                            desc:'Case Position' },
  { id:'report_173',       name:'رپورٹ ۱۷۳',                               desc:'Report u/s 173 CrPC' },
  { id:'crime_scene',      name:'جائے واردات',                              desc:'Scene of Crime' },
  { id:'named_accused',    name:'نامزد ملزمان',                             desc:'Named Accused' },
  { id:'unknown_accused',  name:'نامعلوم ملزمان',                           desc:'Unknown Accused' },
  { id:'witnesses',        name:'گواہان',                                   desc:'Witnesses' },
  { id:'inv_officers',     name:'تفتیشی افسران',                            desc:'Investigation Officers' },
  { id:'affected',         name:'متاثرہ اشخاص',                             desc:'Affected Persons' },
  { id:'stolen',           name:'مسروقہ مال',                               desc:'Stolen Property' },
  { id:'recovery',         name:'برآمدگی مال',                              desc:'Recovered Property' },
  { id:'narcotics',        name:'منثیات واسطہ و دیگر برآمدگی',              desc:'Narcotics & Other Recovery' },
  { id:'index',            name:'انڈیکس ضمنیات',                            desc:'Index of Annexures' },
  { id:'pursuing',         name:'پیروی آفیسر',                              desc:'Pursuing Officer' },
  { id:'forensic',         name:'نمونہ جات برائے پنجاب فرانزک لیبارٹری',   desc:'Punjab Forensic Lab Samples' },
  { id:'court_dates',      name:'عدالت میں ساعت کی تاریخیں',               desc:'Court Hearing Dates' },
  { id:'testimonies',      name:'شہادتیں',                                  desc:'Testimonies' },
  { id:'preventive',       name:'انسدادی کاروائی',                          desc:'Preventive Action' },
  { id:'reg_4',            name:'رجسٹر نمبر ۴',                             desc:'Register No. 4' },
  { id:'reg_8',            name:'رجسٹر نمبر ۸',                             desc:'Register No. 8' },
  { id:'reg_8b',           name:'رجسٹر ۸ (پ)',                              desc:'Register 8(B)' },
  { id:'reg_10',           name:'رجسٹر نمبر ۱۰',                            desc:'Register No. 10' },
  { id:'reg_11',           name:'رجسٹر ۱۱',                                 desc:'Register 11' },
  { id:'reg_12',           name:'رجسٹر ۱۲',                                 desc:'Register 12' },
  { id:'reg_21',           name:'رجسٹر ۲۱',                                 desc:'Register 21' },
  { id:'property_reg',     name:'رجسٹر نمبر ۱۹ کتاب مال خانہ',             desc:'Property Register 19' },
  { id:'inv_result',       name:'نتیجہ تفتیش',                              desc:'Investigation Result' },
  { id:'court_proc',       name:'عدالتی کارروائی',                          desc:'Court Proceedings' },
  { id:'intl_travel',      name:'بین الاقوامی سفر',                         desc:'International Travel' },
  { id:'inv_sample',       name:'نمونہ تفتیش',                              desc:'Investigation Sample' },
  { id:'checklist',        name:'وقوعہ کی چیک لسٹ',                        desc:'Incident Checklist' },
  { id:'warrant',          name:'فردمطبوطشکی',                              desc:'Warrant Details' },
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
  const items = CASE_DOCS.map(d => {
    const saved = _misalDocs[d.id];
    const done  = saved?.status === 'complete';
    const added = !!saved;
    const cls   = done ? 'mdoc-done' : added ? 'mdoc-added' : 'mdoc-empty';
    const action = added ? `confirmRemoveMisalDoc('${d.id}')` : `confirmAddMisalDoc('${d.id}')`;
    return `<span class="mdoc-chip ${cls}" onclick="${action}" title="${d.desc}">${d.name}</span>`;
  }).join('');

  return `
  <div id="misal-doc-bar" style="
    padding:12px 16px;
    background:var(--bg-secondary);
    border-bottom:1px solid var(--border);">
    <div style="font-size:11px;color:var(--text-faint);margin-bottom:8px;display:flex;gap:16px;align-items:center;">
      <span>مثال دستاویزات</span>
      <span><span style="color:var(--text-muted);">■</span> شامل نہیں</span>
      <span><span style="color:var(--accent);">■</span> جاری</span>
      <span><span style="color:var(--green);">■</span> مکمل</span>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">${items}</div>
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

// ── CONFIRMATION: ADD ─────────────────────────────────────────
function confirmAddMisalDoc(docId) {
  const def = CASE_DOCS.find(d => d.id === docId);
  if (!def) return;
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
  const def = CASE_DOCS.find(d => d.id === docId);
  if (!def) return;
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
  const def = CASE_DOCS.find(d => d.id === docId);
  if (!def || !_misalCaseId) return;
  try {
    const oid = await getOfficerId();
    const { data, error } = await supabaseClient
      .from('case_documents')
      .insert({ case_id: _misalCaseId, officer_id: oid, document_type: docId, status: 'draft', content: {} })
      .select().single();
    if (error) throw error;
    _misalDocs[docId] = data;
    _refreshMisalBar();
    _refreshMisalSidebar();
    showToast(`✅ ${def.name} شامل کر دی گئی`, 'success');
    _openMisalEditor(docId);
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

// ── REMOVE FROM CASE ──────────────────────────────────────────
async function _doRemoveMisalDoc(docId) {
  const def = CASE_DOCS.find(d => d.id === docId);
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
  const def = CASE_DOCS.find(d => d.id === docId);
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
  const added = CASE_DOCS.filter(d => _misalDocs[d.id]);
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

  area.innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;">
    <!-- Toolbar -->
    <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--bg-secondary);border-bottom:1px solid var(--border);flex-wrap:wrap;">
      <span style="font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;font-weight:700;color:var(--accent);direction:rtl;flex:1;">${def.name}</span>
      <select onchange="document.getElementById('misal-editor').style.fontFamily=this.value" style="background:var(--bg-tertiary);border:1px solid var(--border);border-radius:4px;padding:4px 8px;color:var(--text-secondary);font-size:11px;">
        <option value="'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif" selected>Jameel Noori Nastaleeq</option>
        <option value="'Noto Nastaliq Urdu',serif">Noto Nastaliq Urdu</option>
        <option value="'Times New Roman',serif">Times New Roman</option>
      </select>
      <select onchange="document.getElementById('misal-editor').style.fontSize=this.value+'px'" style="background:var(--bg-tertiary);border:1px solid var(--border);border-radius:4px;padding:4px 8px;color:var(--text-secondary);font-size:11px;">
        <option value="13">13px</option>
        <option value="15" selected>15px</option>
        <option value="17">17px</option>
        <option value="20">20px</option>
      </select>
      <button class="btn btn-secondary btn-sm" onclick="saveMisalDoc('${docId}')">💾 محفوظ کریں</button>
      <button class="btn btn-secondary btn-sm" onclick="markMisalComplete('${docId}')">✅ مکمل</button>
      <button class="btn btn-secondary btn-sm" onclick="printMisalDoc('${def.name}')">🖨️ پرنٹ</button>
    </div>
    <!-- A4 Editor -->
    <div style="flex:1;overflow-y:auto;padding:20px;background:var(--bg-tertiary);">
      <div id="misal-editor" contenteditable="true" spellcheck="false" style="
        width:210mm;max-width:100%;min-height:297mm;
        margin:0 auto;padding:20mm;
        background:#fff;color:#111;
        font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
        font-size:15px;line-height:2;
        direction:rtl;text-align:right;
        box-shadow:0 2px 16px rgba(0,0,0,0.15);
        border-radius:4px;outline:none;
      ">${content}</div>
    </div>
  </div>`;
}

// ── SAVE ──────────────────────────────────────────────────────
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
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <title>${name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap" rel="stylesheet">
    <style>
      @page{margin:15mm}
      body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;font-size:15px;line-height:2;direction:rtl;text-align:right;color:#111;}
      table{width:100%;border-collapse:collapse;}
      td,th{border:1px solid #555;padding:6px 10px;}
      @media print{body{margin:0}}
    </style></head><body>${el.innerHTML}</body></html>`);
  w.document.close();
  setTimeout(() => { w.print(); }, 500);
}

// ── REFRESH BAR ───────────────────────────────────────────────
function _refreshMisalBar() {
  const bar = document.getElementById('misal-doc-bar');
  if (!bar || !_misalCase) return;
  const newBar = document.createElement('div');
  newBar.innerHTML = renderMisalBar(_misalCase);
  bar.replaceWith(newBar.firstElementChild);
}

// ── TEMPLATES ─────────────────────────────────────────────────
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

    report_173: `${header('رپورٹ ۱۷۳ ضابطہ فوجداری')}
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
        <label style="display:block;margin-bottom:6px;"><input type="radio" name="result"> رپورٹ ۱۷۳ — ملزم فرار</label>
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
            'رپورٹ ۱۷۳ جمع',
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

  // Generic template for remaining document types
  const generic = `${header(CASE_DOCS.find(d=>d.id===docId)?.name||docId)}
    ${table(row('مقدمہ نمبر', fir) + row('تاریخ', dt) + row('دفعات', sec) + row('تھانہ', sta))}
    <div style="font-weight:bold;margin-bottom:6px;">تفصیل:</div>
    <div style="min-height:200px;border:1px solid #ccc;padding:12px;border-radius:4px;" contenteditable="true">
      یہاں تفصیل درج کریں...
    </div>
    ${sig}`;

  return templates[docId] || generic;
}
