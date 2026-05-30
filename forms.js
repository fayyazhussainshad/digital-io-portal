/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — OFFICIAL FORMS TAB
   Government-approved templates auto-filled with case data.
   Libraries (PizZip, docxtemplater, FileSaver) are loaded
   lazily with fallback CDNs — no head-script dependency.
   ═══════════════════════════════════════════════════════════ */

// ── LIBRARY LOADER (lazy, with fallback CDNs) ──
let _formsLibState = 'idle'; // idle | loading | ready | error
const _formsLibCallbacks = [];

const _LIB_SETS = [
  // Attempt 1: cdnjs.cloudflare.com
  [
    'https://cdnjs.cloudflare.com/ajax/libs/pizzip/3.1.7/pizzip.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/docxtemplater/3.44.0/docxtemplater.js',
    'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js',
  ],
  // Attempt 2: unpkg.com
  [
    'https://unpkg.com/pizzip@3.1.7/dist/pizzip.min.js',
    'https://unpkg.com/docxtemplater@3.44.0/build/docxtemplater.js',
    'https://unpkg.com/file-saver@2.0.5/dist/FileSaver.min.js',
  ],
];

function _loadScript(url) {
  return new Promise((resolve, reject) => {
    // Skip if already loaded
    if (document.querySelector(`script[src="${url}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = url;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Failed: ' + url));
    document.head.appendChild(s);
  });
}

function _formsLibsReady() {
  return typeof PizZip !== 'undefined' &&
         (typeof window.docxtemplater !== 'undefined' || typeof Docxtemplater !== 'undefined') &&
         typeof saveAs !== 'undefined';
}

async function _loadFormsLibs() {
  if (_formsLibState === 'ready') return true;
  if (_formsLibState === 'loading') {
    return new Promise(res => _formsLibCallbacks.push(res));
  }
  _formsLibState = 'loading';

  for (let attempt = 0; attempt < _LIB_SETS.length; attempt++) {
    try {
      await Promise.all(_LIB_SETS[attempt].map(_loadScript));
      if (_formsLibsReady()) {
        _formsLibState = 'ready';
        console.log('✅ Forms libraries loaded (attempt ' + (attempt + 1) + ')');
        _formsLibCallbacks.forEach(cb => cb(true));
        _formsLibCallbacks.length = 0;
        return true;
      }
    } catch (e) {
      console.warn('Forms libs attempt ' + (attempt + 1) + ' failed:', e.message);
    }
  }

  _formsLibState = 'error';
  _formsLibCallbacks.forEach(cb => cb(false));
  _formsLibCallbacks.length = 0;
  return false;
}

// ── FORMS DATA ──
const OFFICIAL_FORMS = [
  {id:'cdr',    name:'CDR Form — کال ڈیٹا ریکارڈ',                           file:'CDR_Form_template.docx',        type:'docx'},
  {id:'berooni',name:'Zimni Berooni — بیرونی ضمنی',                           file:'Zimni_Berooni_template.docx',   type:'docx'},
  {id:'bill',   name:'Investigation Bill — بل تفتیش',                          file:'Investigation_Bill_template.docx',type:'docx'},
  {id:'androoni',name:'Zimni Androoni — اندرونی ضمنی (blank note form)',       file:'Zimni_Androoni.docx',           type:'docx-blank'},
  {id:'cro',    name:'CRO Form — کریمنل ریکارڈ کارڈ (print &amp; fill by hand)',file:'CRO_FORM.pdf',               type:'pdf-blank'},
];

function buildFormData(c) {
  const o = currentOfficer || {};
  const now = new Date();
  const months = ['جنوری','فروری','مارچ','اپریل','مئی','جون','جولائی','اگست','ستمبر','اکتوبر','نومبر','دسمبر'];
  return {
    station: o.station || '', district: o.district || '',
    firNumber: c?.fir_number || '', firDate: c?.fir_date || '',
    offence: [c?.section_of_law, c?.offence_type].filter(Boolean).join(' — ') || '',
    occurrenceDate: c?.occurrence_date || '', occurrencePlace: '',
    ioName: o.full_name || '', ioMobile: o.phone || '',
    year: String(now.getFullYear()),
    billMonth: months[now.getMonth()], billYear: String(now.getFullYear()),
  };
}

async function generateOfficialForm(formId) {
  const form = OFFICIAL_FORMS.find(f => f.id === formId);
  if (!form) return;
  const caseId = document.getElementById('offform-case-select')?.value;

  // PDF / blank docx — no library needed
  if (form.type === 'pdf-blank') {
    window.open('templates/' + form.file, '_blank');
    showToast('🖨️ CRO form opened — print and fill by hand.', 'info', 6000);
    return;
  }
  if (form.type === 'docx-blank') {
    const a = document.createElement('a'); a.href = 'templates/' + form.file;
    a.download = form.file; document.body.appendChild(a); a.click(); a.remove();
    showToast('📄 Blank form downloaded.', 'info');
    return;
  }

  // Auto-filled docx — needs libraries
  showToast('⏳ Loading document library…', 'info', 8000);
  const loaded = await _loadFormsLibs();
  if (!loaded) {
    showToast('❌ Could not load document library. Check internet connection — cdnjs.cloudflare.com and unpkg.com both failed.', 'error', 8000);
    return;
  }

  let caseData = null;
  if (caseId) { try { caseData = await getCase(caseId); } catch (e) {} }
  const data = buildFormData(caseData);

  try {
    const resp = await fetch('templates/' + form.file);
    if (!resp.ok) throw new Error('Template file not found. Make sure "' + form.file + '" is inside the /templates/ folder in your repo.');
    const buf = await resp.arrayBuffer();
    const zip = new PizZip(buf);
    // docxtemplater exposes itself as window.docxtemplater or Docxtemplater depending on version
    const Docx = window.docxtemplater || Docxtemplater;
    const doc = new Docx(zip, { paragraphLoop: true, linebreaks: true, delimiters: { start: '{', end: '}' } });
    doc.render(data);
    const out = doc.getZip().generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const fname = form.id + '_' + (data.firNumber || 'blank').replace(/[^\w]/g, '-') + '.docx';
    saveAs(out, fname);
    showToast('✅ Official form generated & downloaded!', 'success');
  } catch (e) {
    showToast('❌ Generation failed: ' + e.message, 'error', 7000);
    console.error('[Forms] Generation error:', e);
  }
}

// ── PAGE RENDERER ──
registerPage('forms', renderOfficialForms);
async function renderOfficialForms(container) {
  // Start loading libs in background as soon as user opens this tab
  _loadFormsLibs();
  const cases = await getCases();
  const libStatus = _formsLibState === 'ready'
    ? '<span style="color:var(--green);font-size:11px;">✅ Document library ready</span>'
    : '<span style="color:var(--amber);font-size:11px;">⏳ Loading document library in background…</span>';
  container.innerHTML =
    `<div class="page-header"><div><div class="page-title">📥 Official Forms</div>`
    + `<div class="page-subtitle">Government-approved templates, auto-filled from case data</div></div></div>`
    + `<div class="card" style="margin-bottom:16px;">`
    + `<div class="card-title">1️⃣ Select Case <span style="font-weight:400;color:var(--text-muted);">(optional — fills FIR number, date, offence etc.)</span></div>`
    + `<select class="filter-select" id="offform-case-select" style="width:100%;max-width:420px;">`
    + `<option value="">— Blank form (no case data) —</option>`
    + cases.map(c => `<option value="${c.id}">${c.fir_number||'(no FIR)'} — ${c.complainant||c.accused_name||''}</option>`).join('')
    + `</select></div>`
    + `<div class="card"><div class="card-title">2️⃣ Choose a Form to Generate <span style="float:right;">${libStatus}</span></div>`
    + OFFICIAL_FORMS.map(f =>
        `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 8px;border-bottom:1px solid var(--border-light);">`
        + `<div style="font-size:13px;color:var(--text-secondary);">📄 ${f.name}</div>`
        + `<button class="btn btn-primary btn-sm" style="white-space:nowrap;flex-shrink:0;" onclick="generateOfficialForm('${f.id}')">`
        + `${f.type==='docx'?'⬇️ Generate Filled':f.type==='pdf-blank'?'🖨️ Open to Print':'⬇️ Download Blank'}</button></div>`
      ).join('')
    + `</div>`
    + `<div style="margin-top:14px;padding:14px;background:var(--bg-tertiary);border-radius:8px;font-size:11px;color:var(--text-muted);line-height:1.8;">`
    + `ℹ️ <b>How it works:</b> Generated forms keep the <b>exact</b> government format. Pick a case, click "Generate Filled" — FIR number, date, offence, station, and your name are inserted automatically.<br>`
    + `🖐️ <b>CRO Form</b> — scanned fingerprint card, print blank and fill by hand.<br>`
    + `📝 <b>Zimni Androoni</b> — internal note form, handwritten.</div>`;
}
