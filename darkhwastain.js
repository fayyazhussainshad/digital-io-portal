/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — درخواستیں  (Applications to Court)
   ───────────────────────────────────────────────────────────
   Poore-safhe ka editor — bilkul چالان / زمنی / سزا سلپ jaisa:
     • Fixed top toolbar (B/I/U · alignment · font size · undo/redo ·
       محفوظ · پرنٹ) — editor-tools.js ka dioEditorToolbar() jaisa.
     • Moving chip bar (misal-doc-bar) — cursor ooper le jate hi
       jhalak jati hai (report173/saza focus-mode jaisa).
     • Safha لیگل 8.5×13 / A4 (report173 ke margins).
     • Type DROPDOWN — aik IO 20+ qism ki درخواستیں likhta hai
       (ریمانڈ جسمانی/عدالتی، بیانات 164، شناخت پریڈ، طلبی ملزمان,
       waghera). Har qism ka apna khaka (template) jo case/officer/
       ملزمان data se KHUD bhar jata hai; IO azadi se tarmeem kare.
     • Rich contenteditable body (zimni/FIR jaisa).
     • case_documents mein save (document_type:'darkhwastain') +
       localStorage backup — saved chip "مکمل" dikhti hai, dobara
       khulti hai.

   CHIP: misal-docs.js ki MISAL_CASE_DOCS mein 'darkhwastain' pehle
   se darj hai. Us ki chip dabane par yeh module khule — is ke liye
   misal-docs.js ke _openMisalEditor()/_doAddMisalDoc() mein aik
   chhoti "special" shart add ki gayi hai (saza_slip jaisi).
   ═══════════════════════════════════════════════════════════ */

// ── STATE ─────────────────────────────────────────────────────
let _dkCaseId = null;
let _dkCase = null;
let _dkAccused = null;
let _dkSaved = {};
let _dkType = 'remand_jismani';        // default qism
let _dkDirty = false;
let _dkPaper = (function () {
  try { return localStorage.getItem('dio_dk_paper') || 'legal'; } catch (_) { return 'legal'; }
})();

// ── APPLICATION TYPES (Shafi ki فراہم کردہ فہرست) — id · naam ──
//    naam hi heading ban jata hai (editable). Aakhir mein "+ اپنی درخواست"
//    jis se IO apni koi bhi qism/عنوان khud likh sakta hai.
const DK_TYPES = [
  { id:'remand_jismani',   name:'درخواست ریمانڈ جسمانی ملزمان         یوم' },
  { id:'remand_judicial',  name:'درخواست ریمانڈ جوڈیشل ملزمان         یوم' },
  { id:'byanat_164',       name:'درخواست برائے بیانات 164 ض ف' },
  { id:'talbi_mulziman',   name:'درخواست برائے طلبی ملزمان' },
  { id:'warrant_gift',     name:'درخواست برائے اجراء بلا ضمانت وارنٹ گرفتاری ملزمان' },
  { id:'ishtihaari',       name:'درخواست برائے اجراء اشتہار ملزمان' },
  { id:'shanakht_parade',  name:'درخواست برائے جوڈیشل شناخت پریڈ' },
  { id:'postmortem',       name:'درخواست برائے پوسٹمارٹم' },
  { id:'tibbi_victim',     name:'درخواست طبی ملاحظہ وکٹم' },
  { id:'potency',          name:'درخواست برائے پوٹینسی ٹیسٹ ملزم' },
  { id:'tibbi_mazroob',    name:'درخواست برائے طبی ملاحظہ مضروب' },
  { id:'medical_board',    name:'درخواست برائے تشکیل دیئے جانے میڈیکل بورڈ' },
  { id:'custom',           name:'➕ اپنی درخواست (خود لکھیں)' },
];

// ═══ ENTRY POINT — chip se yahi khulta hai ═══
//   Chalan/zimni jaisa: agar پہلے se محفوظ درخواستیں hain to FEHRIST kholo
//   (تاریخ/وقت/سیریل ke saath) — warna seedha nayi درخواست ka editor.
let _dkEntryId = null;   // mojooda khuli hui درخواست ka record id (null = nayi)
async function openDarkhwast(caseId) {
  _dkCaseId = caseId
    || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
    || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  if (typeof _dioOpenDocTab === 'function') { try { _dioOpenDocTab('darkhwastain'); } catch (_) {} }
  // Fehrist dekho
  let entries = [];
  try { entries = (typeof dioLoadDocEntries === 'function') ? await dioLoadDocEntries('darkhwastain', _dkCaseId) : []; } catch (_) { entries = []; }
  if (entries.length) { _dkShowList(); return; }
  await _dkNewEntry();
}
window.openDarkhwast = openDarkhwast;

// محفوظ درخواستوں کی فہرست
function _dkShowList() {
  if (typeof dioRenderDocList !== 'function') { _dkNewEntry(); return; }
  dioRenderDocList('darkhwastain', {
    caseId: _dkCaseId,
    heading: 'درخواستیں',
    titleOf: (r) => (r.content && (r.content.__title || (DK_TYPES.find(t => t.id === r.content.dk_type) || {}).name)) || 'درخواست',
    onNew: () => { _dkNewEntry(); },
    onOpen: (entry) => { _dkOpenEntry(entry); },
  });
}
window._dkShowList = _dkShowList;

// نئی درخواست — khali/fresh editor
async function _dkNewEntry() {
  _dkEntryId = null;
  _dkAccused = null;
  _dkSaved = {};
  if (typeof getCase === 'function' && _dkCaseId) { try { _dkCase = await getCase(_dkCaseId); } catch (_) { _dkCase = null; } }
  await _dkLoadAccused();
  await _dkLoadFirText();
  _dkChosen = _dkAccusedNames();
  _dkType = 'remand_jismani';
  _dkRender();
}
window._dkNewEntry = _dkNewEntry;

// محفوظ درخواست کھولیں (edit)
async function _dkOpenEntry(entry) {
  _dkEntryId = entry.id;
  _dkAccused = null;
  _dkSaved = (entry && entry.content) ? entry.content : {};
  if (typeof getCase === 'function' && _dkCaseId) { try { _dkCase = await getCase(_dkCaseId); } catch (_) { _dkCase = null; } }
  await _dkLoadAccused();
  await _dkLoadFirText();
  try {
    if (_dkSaved && _dkSaved.acc !== undefined) _dkChosen = JSON.parse(_dkSaved.acc) || [];
    else _dkChosen = _dkAccusedNames();
  } catch (_) { _dkChosen = _dkAccusedNames(); }
  if (_dkSaved && _dkSaved.dk_type) _dkType = _dkSaved.dk_type;
  _dkRender();
}
window._dkOpenEntry = _dkOpenEntry;

// Saved content — pehle _misalDocs (case_documents), warna localStorage
async function _dkLoadSaved() {
  _dkSaved = {};
  try {
    if (typeof _misalDocs !== 'undefined' && _misalDocs && _misalDocs['darkhwastain']
        && _misalDocs['darkhwastain'].content && Object.keys(_misalDocs['darkhwastain'].content).length) {
      _dkSaved = _misalDocs['darkhwastain'].content || {};
      return;
    }
  } catch (_) {}
  try {
    const raw = localStorage.getItem('dio_dk_' + _dkCaseId);
    if (raw) {
      _dkSaved = JSON.parse(raw) || {};
      try { _dkMarkMisalSaved(_dkSaved, 'complete'); } catch (_) {}
    }
  } catch (_) { _dkSaved = {}; }
}

async function _dkLoadAccused() {
  const cid = _dkCaseId;
  if (!cid) { _dkAccused = []; return; }
  try {
    const { data } = await supabaseClient.from('case_accused')
      .select('*').eq('case_id', cid).order('created_at', { ascending: true });
    _dkAccused = data || [];
  } catch (_) {
    try { _dkAccused = JSON.parse(localStorage.getItem('dio_accused_' + cid) || '[]'); }
    catch (_2) { _dkAccused = []; }
  }
}

// ── FIR ka matn — CHALLAN jaisa: 'fir_matn' table se (type='fir'). ──
let _dkFirText = '';
async function _dkLoadFirText() {
  _dkFirText = '';
  const cid = _dkCaseId;
  if (!cid) return;
  // Pehle challan ka already-loaded matn (agar mojood)
  try {
    if (typeof _ch173FirMatn !== 'undefined' && Array.isArray(_ch173FirMatn) && _ch173FirMatn.length) {
      const rows = _ch173FirMatn.filter(m => (m.type || 'fir') === 'fir');
      const t = rows.map(m => String(m.matn || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean).join(' ');
      if (t) { _dkFirText = t; return; }
    }
  } catch (_) {}
  // Warna seedha fir_matn table se (bilkul _ch173LoadFirMatn jaisa)
  try {
    const { data } = await supabaseClient.from('fir_matn')
      .select('matn,type').eq('case_id', cid).order('created_at', { ascending: true });
    const rows = (data || []).filter(m => (m.type || 'fir') === 'fir');
    _dkFirText = rows.map(m => String(m.matn || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean).join(' ');
    if (_dkFirText) return;
  } catch (_) {}
  // Aakhri fallback — case_documents (agar kisi jagah FIR wahan ho)
  try {
    if (typeof _misalDocs !== 'undefined' && _misalDocs && _misalDocs['fir'] && _misalDocs['fir'].content) {
      const h = _misalDocs['fir'].content.html || _misalDocs['fir'].content.text || '';
      _dkFirText = String(h).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
  } catch (_) {}
}
// FIR matn (already plain) — درخواست ke andar copy ke liye
function _dkFirPlain() { return _dkFirText || ''; }

// ملزمان — naam + CNIC (dropdown + بنام ke liye)
function _dkAccList() {
  return (_dkAccused || []).map(a => ({ name: (a.name || '').trim(), cnic: (a.cnic || '').trim() })).filter(a => a.name);
}
function _dkAccusedNames() { return _dkAccList().map(a => a.name); }
// Chune hue ملزمان (bydefault sab) — numbered, naam dayen + CNIC (LTR) SIDH mein bayen
function _dkChosenNamesHtml() {
  const all = _dkAccList();
  let names;
  if (_dkChosen && _dkChosen.length !== undefined) names = _dkChosen;
  else names = _dkAccusedNames();
  names = names.filter(Boolean);
  if (!names.length) return '<span style="color:#c00;">[ملزمان منتخب کریں]</span>';
  return names.map((n, i) => {
    const a = all.find(x => x.name === n) || { name:n, cnic:'' };
    const cnic = a.cnic ? esc(a.cnic) : '';
    // Naam se koi غیر ضروری leading control/lone char hatao (bidi marks waghera)
    const cleanN = String(n).replace(/^[\u200e\u200f\u061c\u202a-\u202e\s]+/, '').trim();
    return '<div class="dk-acc-line"><span class="dk-acc-nm"><bdi>' + (i+1) + '۔</bdi> ' + esc(cleanN) + '</span>' +
           '<span class="dk-acc-cnic">' + cnic + '</span></div>';
  }).join('');
}
let _dkChosen = null;   // null = abhi decide nahi (default sab)

// ── SIDE MARGIN (report173 ke mutabiq) ──
function _dkSideMargin() { return (_dkPaper === 'a4') ? '0.5cm' : '0.2cm'; }
function _dkSetPaper(v) {
  _dkPaper = v;
  try { localStorage.setItem('dio_dk_paper', v); } catch (_) {}
  _dkRender();
}
window._dkSetPaper = _dkSetPaper;

// آج کی تاریخ DD/MM/YYYY
function _dkToday() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  if (typeof formatDate === 'function') {
    try { const f = formatDate(d); if (f && /^\d{2}\/\d{2}\/\d{4}$/.test(String(f).trim())) return String(f).trim(); } catch (_) {}
  }
  return dd + '/' + mm + '/' + d.getFullYear();
}

// تفتیشی افسر (subscriber) line — درخواست likhne wala LOGGED-IN افسر (IO),
// SHO nahi. currentOfficer se naam + rank/عہدہ + تھانہ.
function _dkIoLine(o) {
  o = o || (typeof currentOfficer !== 'undefined' ? currentOfficer : {}) || {};
  // PEHLE logged-in officer (تفتیشی/subscriber)
  let name = (o.full_name || '').trim();
  let rank = (o.designation || '').trim();
  // Agar currentOfficer mein rank khali ho to digital_io_sho se sirf rank le lo
  // (naam nahi — naam hamesha logged-in officer ka)
  if (!rank) {
    try { const sho = JSON.parse(localStorage.getItem('digital_io_sho') || '{}'); if ((sho.name||'').trim() === name || !name) rank = (sho.rank || '').trim(); } catch (_) {}
  }
  if (!name) {
    // Aakhri fallback — SHO-saved naam
    try { const sho = JSON.parse(localStorage.getItem('digital_io_sho') || '{}'); name = (sho.name || '').trim(); if (!rank) rank = (sho.rank || '').trim(); } catch (_) {}
  }
  const st = (o.station || '').trim();
  const parts = [];
  if (name) parts.push(name);
  if (rank) parts.push(rank);
  let line = parts.join(' ');
  if (st) line += (line ? ' ' : '') + 'تھانہ ' + st;
  if (!line.trim() && typeof getSHOSignLine === 'function') { const l = getSHOSignLine(st); if (l) return l; }
  return line.trim();
}

// SHO/IO line (report173 _ch173ShoLine jaisa)
function _dkShoLine(o) {
  o = o || (typeof currentOfficer !== 'undefined' ? currentOfficer : {}) || {};
  const st = o.station || '';
  if (typeof getSHOSignLine === 'function') {
    const line = getSHOSignLine(st);
    if (line && line.trim()) return line;
  }
  try {
    const sho = JSON.parse(localStorage.getItem('digital_io_sho') || '{}');
    const parts = [];
    if (sho.name) parts.push(String(sho.name).trim());
    if (sho.rank) parts.push(String(sho.rank).trim());
    let l = parts.join(' ');
    if (st) l += (l ? ' ' : '') + 'تھانہ ' + st;
    if (l.trim()) return l;
  } catch (_) {}
  return st ? ('تھانہ ' + st) : '';
}

// ═══ استدعا (request line) — qism ke hisaab se, aakhir mein ═══
function _dkIstidaa(typeId) {
  switch (typeId) {
    case 'remand_jismani':  return 'لہٰذا استدعا ہے کہ ملزمان بالا کا جسمانی ریمانڈ بحق پولیس عطا فرمایا جائے تاکہ تکمیلِ تفتیش عمل میں لائی جا سکے۔ مہربانی ہوگی۔';
    case 'remand_judicial': return 'لہٰذا استدعا ہے کہ ملزمان بالا کو عدالتی (جوڈیشل) ریمانڈ پر جیل بھیجا جائے۔ مہربانی ہوگی۔';
    case 'byanat_164':      return 'لہٰذا استدعا ہے کہ گواہان/مدعی ہٰذا کے بیانات زیر دفعہ 164 ض ف قلمبند فرمائے جائیں۔ مہربانی ہوگی۔';
    case 'talbi_mulziman':  return 'لہٰذا استدعا ہے کہ ملزمان بالا کو بغرضِ تفتیش عدالت میں طلب فرمایا جائے۔ مہربانی ہوگی۔';
    case 'warrant_gift':    return 'لہٰذا استدعا ہے کہ ملزمان بالا کے بلا ضمانت وارنٹ گرفتاری جاری فرمائے جائیں۔ مہربانی ہوگی۔';
    case 'ishtihaari':      return 'لہٰذا استدعا ہے کہ ملزمان بالا کو زیر دفعہ 87 ض ف اشتہاری قرار دیا جائے۔ مہربانی ہوگی۔';
    case 'shanakht_parade': return 'لہٰذا استدعا ہے کہ کسی مجسٹریٹ صاحب کی وساطت سے ملزمان بالا کی جوڈیشل شناخت پریڈ کروائی جائے۔ مہربانی ہوگی۔';
    case 'postmortem':      return 'لہٰذا استدعا ہے کہ متعلقہ میڈیکل آفیسر کو پوسٹ مارٹم کی ہدایت فرمائی جائے۔ مہربانی ہوگی۔';
    case 'tibbi_victim':    return 'لہٰذا استدعا ہے کہ وکٹم کے طبی ملاحظہ کی ہدایت فرمائی جائے۔ مہربانی ہوگی۔';
    case 'potency':         return 'لہٰذا استدعا ہے کہ ملزم کے پوٹینسی ٹیسٹ کی ہدایت فرمائی جائے۔ مہربانی ہوگی۔';
    case 'tibbi_mazroob':   return 'لہٰذا استدعا ہے کہ مضروب کے طبی ملاحظہ کی ہدایت فرمائی جائے۔ مہربانی ہوگی۔';
    case 'medical_board':   return 'لہٰذا استدعا ہے کہ میڈیکل بورڈ تشکیل دیا جائے۔ مہربانی ہوگی۔';
    default:                return 'لہٰذا استدعا ہے کہ ______________________ ۔ مہربانی ہوگی۔';
  }
}

// ═══ TEMPLATE (body) — Shafi ka structure (point 8):
//   "جناب عالیٰ! مختصرحالات مقدمہ عنوان بالا اس طرح ہیں کہ [FIR ka matn]
//    جس پر مقدمہ عنوان بالا درج ہوا تفتیش عمل میں لائی گئی۔ دورانِ تفتیش
//    ______ [IO yahan apni تفتیش likhega] ______
//    [استدعا line — qism ke hisaab se]" ═══
function _dkTemplateBody(typeId, c, o) {
  c = c || {}; o = o || {};
  const firPlain = _dkFirPlain();
  const firPart = firPlain
    ? esc(firPlain)
    : '<span style="color:#c00;">[ایف آئی آر کا متن یہاں آئے گا — پہلے ایف آئی آر درج کریں]</span>';
  // AHEM: "یہاں اپنی تفتیش تحریر کریں" ab NORMAL rang (siyah) mein — pehle
  // madham (grey #888) tha. Default استدعا/request line aur us se pehle wali
  // khali jagah HATA di — IO khud استدعا/درخواست likhega.
  return `جناب عالیٰ! مختصرحالات مقدمہ عنوان بالا اس طرح ہیں کہ ${firPart} جس پر مقدمہ عنوان بالا درج ہوا تفتیش عمل میں لائی گئی۔ دورانِ تفتیش `;
}

// ═══ RENDER — poore safhe ka editor ═══
function _dkRender() {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const c = _dkCase || {};
  const sv = _dkSaved || {};
  const typeDef = DK_TYPES.find(t => t.id === _dkType) || DK_TYPES[0];
  const docFont = _dkDocFont(sv);

  const fir = c.fir_number || '';
  const firDate = (typeof formatDate === 'function') ? formatDate(c.fir_date) : (c.fir_date || '');
  const dafat = ((c.section_of_law || '') || (c.offence_type || ''));

  // Body — saved (isi qism ka) warna template
  const savedBodyKey = 'body_' + _dkType;
  const bodyHtml = (sv[savedBodyKey] !== undefined)
    ? (typeof sanitizeHtml === 'function' ? sanitizeHtml(sv[savedBodyKey]) : sv[savedBodyKey])
    : _dkTemplateBody(_dkType, c, o);

  const v = (k, def) => (typeof sanitizeHtml === 'function'
    ? sanitizeHtml(sv[k] !== undefined ? sv[k] : (def || ''))
    : (sv[k] !== undefined ? sv[k] : (def || '')));

  area.innerHTML = `
  <style>${_dkCSS()}</style>
  <div style="display:flex;flex-direction:column;height:100%;direction:rtl;">
    <!-- ── FIXED TOOLBAR ── -->
    <div class="no-print" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);flex-wrap:wrap;background:var(--bg-secondary);">
      <span style="font-family:'Jameel Noori Nastaleeq',serif;font-size:15px;font-weight:700;color:var(--accent);">📝 درخواست</span>
      <select id="dk-type-sel" onchange="_dkSetType(this.value)" title="درخواست کی قسم"
        style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;max-width:220px;">
        ${DK_TYPES.map(t => `<option value="${t.id}" ${t.id === _dkType ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}
      </select>
      <select id="dk-paper-sel" onchange="_dkSetPaper(this.value)" title="کاغذ کا سائز"
        style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;">
        <option value="legal" ${_dkPaper==='legal'?'selected':''}>لیگل (8.5×13)</option>
        <option value="a4" ${_dkPaper==='a4'?'selected':''}>A4</option>
      </select>
      <button type="button" class="btn btn-secondary btn-sm" onclick="_dkResetBody()" title="اس قسم کا نیا خاکہ لائیں">↺ خاکہ</button>
      <button type="button" class="btn btn-secondary btn-sm" onclick="_dkShowList()" title="محفوظ درخواستوں کی فہرست">📋 فہرست</button>
      <div style="margin-right:auto;display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
        <button onmousedown="_dkKeep(event)" onclick="_dkFmt('bold')" title="بولڈ" style="${_dkBtn()}font-weight:900;">B</button>
        <button onmousedown="_dkKeep(event)" onclick="_dkFmt('italic')" title="ترچھا" style="${_dkBtn()}font-style:italic;">I</button>
        <button onmousedown="_dkKeep(event)" onclick="_dkFmt('underline')" title="انڈر لائن" style="${_dkBtn()}text-decoration:underline;">U</button>
        <span style="width:1px;height:22px;background:var(--border,#ccc);margin:0 4px;"></span>
        <button onmousedown="_dkKeep(event)" onclick="_dkFmt('justifyRight')" title="دائیں" style="${_dkBtn()}">≡</button>
        <button onmousedown="_dkKeep(event)" onclick="_dkFmt('justifyCenter')" title="درمیان" style="${_dkBtn()}">☰</button>
        <button onmousedown="_dkKeep(event)" onclick="_dkFmt('justifyLeft')" title="بائیں" style="${_dkBtn()}">≡</button>
        <button onmousedown="_dkKeep(event)" onclick="_dkFmt('justifyFull')" title="برابر" style="${_dkBtn()}">⚌</button>
        <span style="width:1px;height:22px;background:var(--border,#ccc);margin:0 4px;"></span>
        <button onmousedown="_dkKeep(event)" onclick="_dkFmt('insertUnorderedList')" title="نقطہ دار فہرست" style="${_dkBtn()}">•</button>
        <button onmousedown="_dkKeep(event)" onclick="_dkFmt('insertOrderedList')" title="نمبر والی فہرست" style="${_dkBtn()}">1.</button>
        <span style="width:1px;height:22px;background:var(--border,#ccc);margin:0 4px;"></span>
        <select id="dk-font-sel" onmousedown="event.stopPropagation()" onchange="_dkSetFont(this.value)" title="فونٹ سائز"
          style="height:28px;border:1px solid var(--border,#ccc);border-radius:6px;background:var(--bg-card,#fff);color:var(--text-primary,#111);font-size:13px;padding:0 6px;">
          ${DK_FONT_SIZES.map(s => `<option value="${s}" ${String(s)===String(docFont)?'selected':''}>${s} pt</option>`).join('')}
        </select>
        <button onmousedown="_dkKeep(event)" onclick="_dkFontStep(1)" title="فونٹ بڑا" style="${_dkBtn()}">A+</button>
        <button onmousedown="_dkKeep(event)" onclick="_dkFontStep(-1)" title="فونٹ چھوٹا" style="${_dkBtn()}font-size:11px;">A−</button>
        <span style="width:1px;height:22px;background:var(--border,#ccc);margin:0 4px;"></span>
        <button id="dk-fmtpaint-btn" onmousedown="_dkKeep(event)" onclick="_dkFormatPainter()" title="فارمیٹ پینٹر (پہلے متن منتخب کریں، پھر یہ دبائیں، پھر جہاں لگانا ہے وہاں منتخب کریں)" style="${_dkBtn()}">🖌️</button>
        <button onmousedown="_dkKeep(event)" onclick="_dkFmt('removeFormat')" title="فارمیٹنگ ہٹائیں" style="${_dkBtn()}">✕</button>
        <span style="width:1px;height:22px;background:var(--border,#ccc);margin:0 4px;"></span>
        <button onmousedown="_dkKeep(event)" onclick="_dkFmt('undo')" title="واپس" style="${_dkBtn()}">↶</button>
        <button onmousedown="_dkKeep(event)" onclick="_dkFmt('redo')" title="دوبارہ" style="${_dkBtn()}">↷</button>
        <button class="btn btn-primary btn-sm dio-modbtn" onclick="_dkSave()">💾 محفوظ کریں</button>
        <button class="btn btn-secondary btn-sm dio-modbtn" onclick="_dkPrint()">🖨️ پرنٹ کریں</button>
      </div>
    </div>

    <!-- ── PAGE AREA ── -->
    <div style="flex:1;overflow:auto;min-height:0;padding:16px;background:var(--bg-tertiary);">
      <div id="dk-doc" data-fs="${esc(String(docFont))}" style="width:${_dkPaper==='a4'?'8.27in':'8.5in'};min-height:${_dkPaper==='a4'?'11.7in':'13in'};margin:0 auto;
           padding:1cm ${_dkSideMargin()};background:#fff;box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:4px;
           line-height:1.9;box-sizing:border-box;font-size:${docFont}pt;">

        <!-- Line 1: تھانہ (dayen, 1in) · ضلع (bayen, 1cm) — چالان/saza jaisa -->
        <div class="dk-title-row">
          <span class="dk-tt-right">تھانہ <span class="dk-fl" contenteditable="true" data-k="thana">${v('thana', esc(o.station || c.case_station || ''))}</span></span>
          <span class="dk-tt-left">ضلع <span class="dk-fl" contenteditable="true" data-k="zila">${v('zila', esc(o.district || c.case_district || ''))}</span></span>
        </div>

        <!-- (Line 1 ke baad 1 inch ki khali jagah — CSS margin se) -->

        <!-- Line 2: سرکاربذریعہ + مدعی (system se) -->
        <div class="dk-sarkar" contenteditable="true" data-k="sarkar">${v('sarkar', 'سرکار بذریعہ ' + esc(c.complainant || '____'))}</div>

        <!-- Line 3: مقدمہ نمبر / تاریخ / دفعہ / تھانہ -->
        <div class="dk-caseline" contenteditable="true" data-k="caseline">${v('caseline', 'مقدمہ نمبر ' + esc(fir) + ' مورخہ ' + esc(firDate) + ' زیر دفعہ ' + esc(dafat) + ' تھانہ ' + esc(o.station || c.case_station || ''))}</div>

        <!-- بنام (accused) — dayen ▾ dropdown, phir بنام + numbered ملزمان -->
        <div class="dk-banam-row" dir="rtl">
          <button class="dk-acc-pick no-print" onclick="_dkAccPicker(event)" title="ملزمان منتخب کریں">▾</button>
          <span class="dk-banam-lbl">بنام</span>
          <span class="dk-banam-list" dir="rtl" contenteditable="true" data-k="banam">${_dkChosenNamesHtml()}</span>
        </div>

        <!-- (بنام ke baad khali jagah — CSS margin se) -->

        <!-- Heading (qism) — dropdown se selected magar EDITABLE, 18pt underline.
             Naam hi عنوان hai. custom qism par khali (IO khud likhega). -->
        <div class="dk-unwan" contenteditable="true" data-k="unwan_${_dkType}">${v('unwan_' + _dkType, (_dkType === 'custom' ? '' : esc(typeDef.name)))}</div>

        <!-- Body (rich text) — جناب عالیٰ! … FIR matn … تفتیش … استدعا -->
        <div class="dk-body" contenteditable="true" data-k="${savedBodyKey}">${bodyHtml}</div>

        <!-- تفتیشی افسر (subscriber) block — bayen sidh: dastkhat ki jagah →
             naam+rank+تھانہ (bold+underline) → neeche تاریخ (naam ke barabar
             chaudai mein CENTER) -->
        <div class="dk-sign">
          <div class="dk-sign-space"></div>
          <div class="dk-sign-io">
            <div class="dk-sign-name" contenteditable="true" data-k="sho">${v('sho', esc(_dkIoLine(o)))}</div>
            <div class="dk-sign-date" contenteditable="true" data-k="sho_date">${v('sho_date', esc(_dkToday()))}</div>
          </div>
        </div>

        <input type="hidden" data-k="doc_font" value="${esc(String(docFont))}">
        <input type="hidden" data-k="dk_type" value="${esc(_dkType)}">
        <input type="hidden" data-k="acc" value="${esc(JSON.stringify(_dkChosen || _dkAccusedNames()))}">
      </div>
    </div>
  </div>`;

  _dkFullPage(area);
  _dkBlockFloatBar();
  setTimeout(() => {
    _dkFullPage(area);
    _dkBindKeys();
    _dkFocusMode(true);
    try { const df = _dkDocFont(sv); if (df) _dkFontToDoc(df); } catch (_) {}
    window.addEventListener('resize', _dkFitPaper);
    if (typeof applyAutoDirection === 'function') { try { applyAutoDirection(area); } catch (_) {} }
  }, 60);
}
window._dkRender = _dkRender;

// ── Type change — mojooda kaam save-state mein rakh kar naye khaka par ──
function _dkSetType(id) {
  _dkCollectInto(_dkSaved);          // mojooda body/fields yaad rakho
  _dkType = id;
  _dkRender();
}
window._dkSetType = _dkSetType;

// ═══ ملزمان منتخب کریں (▾) — چالان/saza jaisa. Default sab select. ═══
function _dkAccPicker(ev) {
  ev.preventDefault(); ev.stopPropagation();
  document.getElementById('dk-acc-menu')?.remove();
  const list = _dkAccList();
  if (!list.length) { if (typeof showToast === 'function') showToast('ℹ️ اس مقدمہ میں کوئی ملزم درج نہیں', 'info'); return; }
  const mine = new Set(_dkChosen && _dkChosen.length !== undefined ? _dkChosen : _dkAccusedNames());
  const box = document.createElement('div');
  box.id = 'dk-acc-menu';
  box.style.cssText = 'position:fixed;z-index:99999;background:#fff;border:1px solid #0369a1;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.28);direction:rtl;width:280px;max-width:92vw;display:flex;flex-direction:column;max-height:min(60vh,360px);overflow:hidden;';
  const rows = list.map(a => {
    const on = mine.has(a.name);
    return `<label style="display:flex;align-items:center;gap:8px;padding:7px 6px;cursor:pointer;font-size:13px;border-bottom:1px solid #f1f5f9;font-family:'Jameel Noori Nastaleeq',serif;"><input type="checkbox" ${on?'checked':''} value="${esc(a.name)}"> <span>${esc(a.name)}</span></label>`;
  }).join('');
  box.innerHTML = `
    <div style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;font-weight:700;color:#0369a1;font-family:'Jameel Noori Nastaleeq',serif;background:#f8fafc;">ملزمان منتخب کریں</div>
    <div style="flex:1;overflow-y:auto;padding:4px 8px;min-height:0;">${rows}</div>
    <div style="display:flex;gap:6px;padding:8px;border-top:1px solid #e5e7eb;background:#f8fafc;flex-shrink:0;">
      <button id="dk-acc-ok" style="flex:1;padding:8px;border:none;border-radius:6px;background:#0369a1;color:#fff;cursor:pointer;font-size:13px;font-weight:700;font-family:'Jameel Noori Nastaleeq',serif;">✔ شامل کریں</button>
      <button id="dk-acc-x" style="padding:8px 12px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;cursor:pointer;font-size:13px;font-family:'Jameel Noori Nastaleeq',serif;">بند</button>
    </div>`;
  document.body.appendChild(box);
  const r = ev.currentTarget.getBoundingClientRect();
  const bw = box.offsetWidth, bh = box.offsetHeight;
  let top = r.bottom + 6; if (top + bh > window.innerHeight - 8) top = Math.max(8, r.top - bh - 6);
  let left = r.left + r.width/2 - bw/2; left = Math.max(8, Math.min(left, window.innerWidth - bw - 8));
  box.style.top = top + 'px'; box.style.left = left + 'px';
  setTimeout(() => { const off = (e) => { if (!box.contains(e.target)) { box.remove(); document.removeEventListener('mousedown', off); } }; document.addEventListener('mousedown', off); }, 0);
  box.querySelector('#dk-acc-x').onclick = () => box.remove();
  box.querySelector('#dk-acc-ok').onclick = () => {
    const picked = [...box.querySelectorAll('input:checked')].map(i => i.value);
    box.remove();
    _dkSetAccused(picked);
  };
}
window._dkAccPicker = _dkAccPicker;

// Chune hue ملزمان — بنام list dobara bharo (numbered), body ke andar bhi
// koi accused-list ho to chھeड़te nahi (body IO ka apna matn hai).
function _dkSetAccused(names) {
  _dkChosen = names.slice();
  const doc = _dkDoc(); if (!doc) return;
  const list = doc.querySelector('.dk-banam-list');
  if (list) list.innerHTML = _dkChosenNamesHtml();
  const accInp = doc.querySelector('[data-k="acc"]');
  if (accInp) accInp.value = JSON.stringify(_dkChosen);
  _dkDirty = true;
}
window._dkSetAccused = _dkSetAccused;

// Naya khaka (is qism ka) — mojooda body ko template se badlo
function _dkResetBody() {
  const doc = _dkDoc(); if (!doc) return;
  const body = doc.querySelector('.dk-body');
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) || {};
  if (body) {
    if (!confirm('اس قسم کا نیا خاکہ لائیں؟ موجودہ متن ختم ہو جائے گا۔')) return;
    body.innerHTML = _dkTemplateBody(_dkType, _dkCase || {}, o);
    _dkDirty = true;
  }
}
window._dkResetBody = _dkResetBody;

// ═══ TOOLBAR helpers ═══
function _dkBtn() {
  return 'min-width:30px;height:28px;border:1px solid var(--border,#ccc);border-radius:6px;' +
         'background:var(--bg-card,#fff);color:var(--text-primary,#111);cursor:pointer;font-size:13px;padding:0 7px;';
}
const DK_FONT_SIZES = [10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 28];
const DK_FONT_DEFAULT = 14;
function _dkDocFont(sv) { const n = parseFloat((sv && sv.doc_font) || ''); return (n && !isNaN(n)) ? n : DK_FONT_DEFAULT; }

function _dkDoc() {
  const all = document.querySelectorAll('#dk-doc');
  if (!all.length) return null;
  for (let i = all.length - 1; i >= 0; i--) {
    const el = all[i];
    if (el.offsetParent !== null || el.getClientRects().length) return el;
  }
  return all[all.length - 1];
}

let _dkRange = null;
function _dkSaveRange() {
  const doc = _dkDoc(); if (!doc) return;
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const r = sel.getRangeAt(0);
  if (doc.contains(r.commonAncestorContainer)) _dkRange = r.cloneRange();
}
function _dkRestoreRange() {
  const doc = _dkDoc(); if (!doc || !_dkRange) return false;
  if (!doc.contains(_dkRange.commonAncestorContainer)) { _dkRange = null; return false; }
  try {
    let n = _dkRange.commonAncestorContainer;
    if (n.nodeType === 3) n = n.parentElement;
    const host = n && n.closest ? n.closest('[contenteditable="true"]') : null;
    if (host) host.focus({ preventScroll: true });
    const sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(_dkRange);
    return true;
  } catch (_) { return false; }
}
function _dkFmt(cmd) {
  const doc = _dkDoc();
  const sel = window.getSelection();
  const live = doc && sel && sel.rangeCount && doc.contains(sel.getRangeAt(0).commonAncestorContainer);
  if (!live) _dkRestoreRange();
  try { document.execCommand('styleWithCSS', false, false); } catch (_) {}
  try { document.execCommand(cmd, false, null); } catch (_) {}
  _dkSaveRange();
  _dkDirty = true;
}
window._dkFmt = _dkFmt;

// Button mousedown — range MEHFOOZ karo phir focus chhutne se roko. YEHI woh
// cheez hai jis ke baghair toolbar buttons "kaam nahi karte" the (button dabate
// hi editor ka selection/focus khatam ho jata tha).
function _dkKeep(ev) {
  try { _dkSaveRange(); } catch (_) {}
  if (ev && ev.preventDefault) ev.preventDefault();
}
window._dkKeep = _dkKeep;

// Font +/- (chune hue matn par, warna poore doc par)
function _dkFontStep(dir) {
  const doc = _dkDoc(); if (!doc) return;
  const sel = window.getSelection();
  const live = sel && sel.rangeCount && !sel.isCollapsed && doc.contains(sel.anchorNode);
  if (!live) _dkRestoreRange();
  let cur = parseFloat(doc.dataset.fs || String(DK_FONT_DEFAULT)) || 14;
  // Agar selection hai to us ka font parhne ki koshish
  try {
    const s2 = window.getSelection();
    if (s2 && s2.anchorNode) {
      let n = s2.anchorNode; if (n.nodeType === 3) n = n.parentElement;
      const cs = n && getComputedStyle ? parseFloat(getComputedStyle(n).fontSize) : 0;
      if (cs) cur = Math.round(cs * 0.75);
    }
  } catch (_) {}
  const next = Math.min(48, Math.max(8, cur + (dir > 0 ? 1 : -1)));
  _dkSetFont(next);
}
window._dkFontStep = _dkFontStep;

// ═══ Format Painter — pehle matn chunein → 🖌️ dabayen → phir jahan lagana ho
//    woh matn chunein. Chune hue matn ki formatting (bold/italic/underline/
//    font-size/align) copy kar ke doosri jagah lagti hai. ═══
let _dkPaintFmt = null;
function _dkFormatPainter() {
  const doc = _dkDoc(); if (!doc) return;
  const btn = document.getElementById('dk-fmtpaint-btn');
  const sel = window.getSelection();
  const hasSel = sel && sel.rangeCount && !sel.isCollapsed && doc.contains(sel.anchorNode);

  // Agar painter pehle se on hai → OFF karo
  if (_dkPaintFmt && !hasSel) { _dkPaintFmt = null; if (btn) btn.style.background = ''; return; }

  if (hasSel && !_dkPaintFmt) {
    // Source formatting parho (anchor element se)
    let n = sel.anchorNode; if (n && n.nodeType === 3) n = n.parentElement;
    if (!n) return;
    const cs = getComputedStyle(n);
    _dkPaintFmt = {
      bold: (parseInt(cs.fontWeight, 10) >= 600) || cs.fontWeight === 'bold',
      italic: cs.fontStyle === 'italic',
      underline: (cs.textDecorationLine || cs.textDecoration || '').indexOf('underline') !== -1,
      size: Math.round(parseFloat(cs.fontSize) * 0.75),
    };
    if (btn) btn.style.background = '#0369a1';
    if (typeof showToast === 'function') showToast('🖌️ فارمیٹ کاپی ہو گئی — اب وہ متن منتخب کریں جہاں لگانی ہے', 'info', 3500);
    return;
  }

  // Painter on hai aur ab target chuna gaya → apply
  if (_dkPaintFmt && hasSel) {
    _dkRestoreRange();
    const f = _dkPaintFmt;
    try { document.execCommand('styleWithCSS', false, false); } catch (_) {}
    // pehle saaf karo phir source jaisa lagao
    try { document.execCommand('removeFormat', false, null); } catch (_) {}
    if (f.bold) { try { document.execCommand('bold', false, null); } catch (_) {} }
    if (f.italic) { try { document.execCommand('italic', false, null); } catch (_) {} }
    if (f.underline) { try { document.execCommand('underline', false, null); } catch (_) {} }
    if (f.size) { try { _dkFontToSelection(f.size); } catch (_) {} }
    _dkSaveRange(); _dkDirty = true;
    _dkPaintFmt = null; if (btn) btn.style.background = '';
    return;
  }
}
window._dkFormatPainter = _dkFormatPainter;

function _dkSetFont(val) {
  const pt = parseFloat(val); if (!pt) return;
  const doc = _dkDoc(); if (!doc) return;
  const sel = window.getSelection();
  const live = sel && sel.rangeCount && !sel.isCollapsed && doc.contains(sel.anchorNode) && doc.contains(sel.focusNode);
  if (!live) _dkRestoreRange();
  const sel2 = window.getSelection();
  const hasSel = sel2 && sel2.rangeCount && !sel2.isCollapsed && doc.contains(sel2.anchorNode);
  if (hasSel && _dkFontToSelection(pt)) { _dkSaveRange(); _dkDirty = true; return; }
  _dkFontToDoc(pt);
  const hid = doc.querySelector('[data-k="doc_font"]'); if (hid) hid.value = String(pt);
  _dkDirty = true;
}
window._dkSetFont = _dkSetFont;
function _dkFontToSelection(pt) {
  const doc = _dkDoc(); if (!doc) return false;
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return false;
  if (!doc.contains(sel.anchorNode) || !doc.contains(sel.focusNode)) return false;
  try { document.execCommand('styleWithCSS', false, false); } catch (_) {}
  let ok = false;
  try { ok = document.execCommand('fontSize', false, '7'); } catch (_) {}
  if (!ok) return false;
  doc.querySelectorAll('font[size="7"]').forEach(f => {
    const span = document.createElement('span');
    while (f.firstChild) span.appendChild(f.firstChild);
    span.style.fontSize = pt + 'pt';
    f.parentNode.replaceChild(span, f);
  });
  return true;
}
function _dkFontToDoc(pt) {
  const doc = _dkDoc(); if (!doc) return;
  doc.dataset.fs = pt;
  doc.style.fontSize = pt + 'pt';
  // AHEM: har hissa (body/سرکار/caseline/بنام/IO) ki apni fixed 14pt CSS hoti
  // hai jo doc ke font ko dabaa deti thi (is liye selector "kaam nahi karta"
  // lagta tha). Ab aik dynamic style se un sab ko naye pt par set karte hain
  // (heading 18pt apni jaga; woh alag rakha). Naya font matn (body) samet
  // sab par lagta hai.
  let st = document.getElementById('dk-font-override');
  if (!st) { st = document.createElement('style'); st.id = 'dk-font-override'; document.head.appendChild(st); }
  st.textContent = `#dk-doc, #dk-doc .dk-body, #dk-doc .dk-sarkar, #dk-doc .dk-caseline,
    #dk-doc .dk-banam-row, #dk-doc .dk-banam-list, #dk-doc .dk-banam-lbl,
    #dk-doc .dk-title-row, #dk-doc .dk-tt-right, #dk-doc .dk-tt-left,
    #dk-doc .dk-sign-name, #dk-doc .dk-sign-date{ font-size:${pt}pt !important; }`;
  const fsel = document.getElementById('dk-font-sel'); if (fsel) fsel.value = String(pt);
}
function _dkBindKeys() {
  const doc = _dkDoc(); if (!doc) return;
  doc.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); _dkFmt('bold'); }
      if (e.key === 'u') { e.preventDefault(); _dkFmt('underline'); }
      if (e.key === 'i') { e.preventDefault(); _dkFmt('italic'); }
    }
  });
  doc.addEventListener('input', () => { _dkDirty = true; });
  doc.addEventListener('mouseup', _dkSaveRange);
  doc.addEventListener('keyup', _dkSaveRange);
}

// Floating toolbar is doc par na lage (defensive — editor-tools ab band bhi hai)
function _dkBlockFloatBar() {
  try {
    if (typeof window.dioBindEditor === 'function' && !window._dkBindPatched) {
      window._dkBindPatched = true;
      const _orig = window.dioBindEditor;
      window.dioBindEditor = function (el) {
        try {
          if (el && (el.id === 'dk-doc' || (el.closest && el.closest('#dk-doc')) || (el.querySelector && el.querySelector('#dk-doc')))) return;
        } catch (_) {}
        return _orig.apply(this, arguments);
      };
    }
  } catch (_) {}
}

// ═══ Full-page + focus (saza jaisa) ═══
function _dkFullPage(area) {
  try {
    document.body.classList.add('workspace-mode');
    ['.workspace-sidebar', '#workspace-doc-list', '.misal-sidebar'].forEach(sel => {
      document.querySelectorAll(sel).forEach(el => { el.style.display = 'none'; });
    });
    let el = area, hops = 0;
    while (el && el !== document.body && hops++ < 8) {
      el.style.width = '100%'; el.style.maxWidth = 'none'; el.style.marginRight = '0'; el.style.marginLeft = '0';
      if (getComputedStyle(el).display === 'flex') el.style.flex = '1 1 auto';
      el = el.parentElement;
    }
    document.querySelectorAll('.workspace-layout, .misal-layout').forEach(w => { w.style.display = 'block'; w.style.gridTemplateColumns = '1fr'; });
    const doc = _dkDoc();
    if (doc) { doc.style.maxWidth = 'none'; doc.style.margin = '0 auto'; _dkFitPaper();
      if (!window._dkFitBound) { window._dkFitBound = true; window.addEventListener('resize', () => { try { _dkFitPaper(); } catch (_) {} }); } }
  } catch (_) {}
}
function _dkFitPaper() {
  const doc = _dkDoc(); if (!doc) return;
  const host = doc.parentElement; if (!host) return;
  try {
    let el = host, hops = 0;
    while (el && el !== document.body && hops++ < 4) {
      const top = el.getBoundingClientRect().top;
      const hh = Math.max(200, (window.innerHeight || 0) - top - 2);
      el.style.height = hh + 'px'; el.style.maxHeight = 'none'; el.style.flexShrink = '0';
      el = el.parentElement;
    }
    host.style.overflow = 'auto'; host.style.flexShrink = '0';
  } catch (_) {}
  const IN = 96;
  doc.style.width = ((_dkPaper === 'a4') ? 8.27 : 8.5) * IN + 'px';
  doc.style.minHeight = ((_dkPaper === 'a4') ? 11.7 : 13) * IN + 'px';
  try { doc.style.padding = '1cm ' + _dkSideMargin(); } catch (_) {}
}
window._dkFitPaper = _dkFitPaper;

function _dkFocusMode(on) {
  const b = document.body; if (!b) return;
  if (!on) { b.classList.remove('dk-focus'); return; }
  b.classList.add('dk-focus');
  try {
    const bar0 = document.getElementById('misal-doc-bar');
    const par = bar0 && bar0.parentElement;
    if (par && getComputedStyle(par).position === 'static') par.style.position = 'relative';
  } catch (_) {}
  if (window._dkPeekBound) return;
  window._dkPeekBound = true;
  document.addEventListener('mousemove', (e) => {
    if (!document.body.classList.contains('dk-focus')) return;
    const bar = document.getElementById('misal-doc-bar'); if (!bar) return;
    let near = e.clientY <= 70;
    if (!near) { try { const r = bar.getBoundingClientRect(); near = e.clientY >= r.top - 10 && e.clientY <= r.bottom + 10 && e.clientX >= r.left && e.clientX <= r.right; } catch (_) {} }
    if (near) {
      clearTimeout(window._dkPeekT);
      try {
        const d0 = _dkDoc(); const host = d0 && d0.parentElement; const wrap = host && host.parentElement;
        const tbar = wrap && wrap.querySelector('.no-print'); const par = bar.offsetParent || bar.parentElement;
        if (tbar && par) { const rp = par.getBoundingClientRect(); const rt = tbar.getBoundingClientRect(); bar.style.top = Math.max(0, Math.round(rt.bottom - rp.top)) + 'px'; }
      } catch (_) {}
      bar.classList.add('peek');
    } else if (bar.classList.contains('peek')) {
      clearTimeout(window._dkPeekT);
      window._dkPeekT = setTimeout(() => { try { bar.classList.remove('peek'); } catch (_) {} }, 400);
    }
  }, { passive: true });
}
window._dkFocusMode = _dkFocusMode;

// ═══ SAVE ═══
function _dkCollectInto(store) {
  const doc = _dkDoc(); if (!doc) return store;
  doc.querySelectorAll('[data-k]').forEach(el => {
    const k = el.getAttribute('data-k');
    store[k] = (el.tagName === 'INPUT') ? el.value : el.innerHTML;
  });
  store.doc_font = doc.dataset.fs || String(DK_FONT_DEFAULT);
  store.dk_type = _dkType;
  return store;
}
async function _dkSave() {
  const doc = _dkDoc(); if (!doc) return;
  const data = _dkCollectInto(_dkSaved);
  data.saved_at = new Date().toISOString();
  // Fehrist mein dikhaya jane wala unwan (qism ka naam)
  const typeDef = DK_TYPES.find(t => t.id === _dkType) || {};
  const title = (data['unwan_' + _dkType] ? String(data['unwan_' + _dkType]).replace(/<[^>]*>/g, '').trim() : '') || typeDef.name || 'درخواست';
  data.__title = title;
  try {
    // NAYA record (ya _dkEntryId par ترمیم) — تاریخ/وقت/سیریل ke saath
    const entry = await dioSaveDocEntry('darkhwastain', title, data, { caseId: _dkCaseId, id: _dkEntryId });
    _dkEntryId = entry.id;
    _dkSaved = data; _dkDirty = false;
    if (typeof showToast === 'function') showToast('✅ درخواست محفوظ — فہرست میں تاریخ/سیریل کے ساتھ آ گئی', 'success', 3500);
    // Save ke baad FEHRIST kholo (chalan jaisa)
    setTimeout(() => { try { _dkShowList(); } catch (_) {} }, 300);
  } catch (e) {
    if (typeof showToast === 'function') showToast('⚠️ محفوظ کرنے میں مسئلہ: ' + ((e && e.message) || e), 'warn', 4500);
  }
}
window._dkSave = _dkSave;

function _dkMarkMisalSaved(content, status) {
  try {
    if (typeof _misalDocs === 'undefined' || !_misalDocs) return;
    if (!_misalDocs['darkhwastain']) _misalDocs['darkhwastain'] = { document_type: 'darkhwastain' };
    _misalDocs['darkhwastain'].content = content;
    _misalDocs['darkhwastain'].status = status || 'complete';
  } catch (_) {}
}
window._dkMarkMisalSaved = _dkMarkMisalSaved;

// ═══ PRINT — zimni ka saaf asool (koi height/stretch zabardasti nahi) ═══
function _dkPrint() {
  const doc = _dkDoc(); if (!doc) return;
  const clone = doc.cloneNode(true);
  clone.querySelectorAll('.no-print, button, select').forEach(el => el.remove());
  const inner = clone.innerHTML;
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title> </title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      @page{ size:${_dkPaper === 'a4' ? 'A4 portrait' : '8.5in 13in'}; margin:1cm ${_dkSideMargin()}; }
      *{ -webkit-print-color-adjust:exact; print-color-adjust:exact; box-sizing:border-box; }
      html, body{ margin:0 !important; padding:0 !important;
        font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
        direction:rtl; line-height:1.9; color:#000; font-size:${_dkDocFont(_dkSaved)}pt; }
      ${_dkCSS()}
      #dk-doc{ width:100% !important; max-width:none !important; height:auto !important;
        min-height:0 !important; padding:0 1in 0 0.4in !important; margin:0 !important;
        transform:none !important; box-shadow:none !important; border-radius:0 !important; }
      /* Chuna hua font (heading ke ilawa) — print par bhi lagu */
      #dk-doc, #dk-doc .dk-body, #dk-doc .dk-sarkar, #dk-doc .dk-caseline,
      #dk-doc .dk-banam-row, #dk-doc .dk-banam-list, #dk-doc .dk-banam-lbl,
      #dk-doc .dk-title-row, #dk-doc .dk-tt-right, #dk-doc .dk-tt-left,
      #dk-doc .dk-sign-name, #dk-doc .dk-sign-date{ font-size:${_dkDocFont(_dkSaved)}pt !important; }
      .no-print, button, select{ display:none !important; }
      #dk-doc, #dk-doc *{ orphans:2; widows:2; }
    </style></head><body><div id="dk-doc">${inner}</div></body></html>`;
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
}
window._dkPrint = _dkPrint;

// ═══ CSS ═══
function _dkCSS() {
  return `
    body.dk-focus #misal-doc-bar{
      position:absolute; top:0; left:0; right:0; z-index:60;
      max-height:0 !important; padding-top:0 !important; padding-bottom:0 !important;
      opacity:0; overflow:hidden; background:var(--bg-secondary,#fff);
      transition:max-height .18s ease, opacity .18s ease, padding .18s ease;
    }
    body.dk-focus #misal-doc-bar.peek{ max-height:240px !important; opacity:1; padding-top:6px !important; padding-bottom:6px !important; box-shadow:0 8px 18px rgba(0,0,0,.18); }
    body.dk-focus .bottombar{ display:none !important; }

    /* Root — RTL, 14pt (default). Dayen 1 inch hashiya. Bayen bhi thoda hashiya
       taake legal/folio print par IO naam (bayen sidh) kinare se na kate.
       --dk-indent = satar 2/3 aur ملزمان list ka right-indent (بنام ke barabar). */
    #dk-doc{ direction:rtl; font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; color:#000; font-size:14pt; text-align:justify; padding-right:1in !important; padding-left:0.4in !important; --dk-indent:0.9in; }
    #dk-doc [contenteditable]{ outline:none; }
    #dk-doc .dk-fl{ unicode-bidi:isolate; direction:rtl; outline:none; min-width:24px; display:inline-block; }

    /* Line 1 — تھانہ (dayen, right margin se 1 inch) · ضلع (bayen, 1cm). */
    #dk-doc .dk-title-row{ display:flex; align-items:baseline; justify-content:space-between; width:100%; font-size:14pt; }
    #dk-doc .dk-tt-right{ text-align:right; white-space:nowrap; }
    #dk-doc .dk-tt-left{ text-align:left; white-space:nowrap; margin-left:1cm; }

    /* Line 1 ke baad THORI (aur kam — 0.12in) khali jagah. */
    #dk-doc .dk-sarkar{ margin-top:0.12in; font-size:14pt; text-align:right; padding-right:var(--dk-indent,0.9in); line-height:1.8; }

    /* Line 3 — مقدمہ نمبر/تاریخ/دفعہ/تھانہ. Satar 2/3/4 ki line-spacing 1pt
       (bilkul tight). */
    #dk-doc .dk-caseline{ font-size:14pt; margin:1pt 0 0; text-align:right; padding-right:var(--dk-indent,0.9in); line-height:1.8; unicode-bidi:plaintext; }

    /* بنام — "بنام" DAYEN kinare par (hanging). ملزمان list usi indent par.
       Line-spacing 1pt (satar 2/3/4 tight). CNIC ki khatir do-satri layout. */
    #dk-doc .dk-banam-row{ position:relative; margin:1pt 0 0; font-size:14pt; padding-right:var(--dk-indent,0.9in); min-height:1.6em; line-height:1.8; }
    #dk-doc .dk-banam-lbl{ position:absolute; right:0; top:0; font-weight:bold; white-space:nowrap; line-height:1.8; }
    #dk-doc .dk-banam-list{ text-align:right; outline:none; line-height:1.8; display:block; }
    /* Har ملزم ki satar — naam dayen, CNIC (LTR) SIDH mein bayen kinare par */
    #dk-doc .dk-acc-line{ display:flex; align-items:baseline; justify-content:space-between; gap:10px; }
    #dk-doc .dk-acc-nm{ text-align:right; flex:1; }
    #dk-doc .dk-acc-cnic{ direction:ltr; unicode-bidi:isolate; text-align:left; white-space:nowrap;
      font-variant-numeric:tabular-nums; min-width:2in; }
    #dk-doc .dk-acc-pick{
      position:absolute; right:-30px; top:0; width:24px; height:24px; line-height:22px; padding:0; border:1px solid #0369a1;
      border-radius:5px; background:#0369a1; color:#fff; cursor:pointer; font-size:13px; font-weight:700; text-align:center;
    }
    #dk-doc .dk-acc-pick:hover{ background:#025687; }

    /* بنام ke baad khali jagah → phir Heading */
    /* Heading (qism) — center, underline, 18pt (editable) */
    #dk-doc .dk-unwan{ text-align:center; font-size:16pt; font-weight:bold; text-decoration:underline; margin:14pt 0 10pt; }

    /* Body — justified, 14pt */
    #dk-doc .dk-body{ text-align:justify; text-align-last:right; font-size:14pt; line-height:2; min-height:2in; }

    /* IO / تفتیشی افسر block — bayen sidh. OOPER dastkhat ki (barhi hui) jagah →
       naam+rank+تھانہ (bold+underline) → neeche تاریخ (naam ke NEECHE CENTER,
       naam ke barabar chaudai mein). IO aur date ke darmiyan bohat kam faasla. */
    #dk-doc .dk-sign{ margin-top:8pt; text-align:left; }
    #dk-doc .dk-sign-space{ min-height:64px; }   /* dastkhat ki (aur barhi hui) khali jagah — naam ke OOPER */
    #dk-doc .dk-sign-io{ display:inline-block; text-align:left; }
    #dk-doc .dk-sign-name{ font-weight:bold; text-decoration:underline; font-size:14pt; text-align:left !important; white-space:nowrap; outline:none; display:block; }
    #dk-doc .dk-sign-date{ font-size:14pt; text-align:center !important; margin-top:0; line-height:1; outline:none; display:block; }
  `;
}
window._dkCSS = _dkCSS;

// ═══════════════════════════════════════════════════════════════
//  Self-healing — مقدمہ khulte hi localStorage se saved darkhwast ko
//  _misalDocs mein "مکمل" mark kar ke chip green kar do (DB constraint
//  ki soorat mein bhi saved nazar aaye). saza-slip jaisa.
// ═══════════════════════════════════════════════════════════════
(function _dkChipHeal() {
  function caseIdNow() {
    return (typeof _misalCaseId !== 'undefined' && _misalCaseId)
      || (window._workspaceCase && window._workspaceCase.id) || _dkCaseId || null;
  }
  function heal() {
    try {
      if (typeof _misalDocs === 'undefined' || !_misalDocs) return;
      const bar = document.getElementById('misal-doc-bar'); if (!bar) return;
      const cid = caseIdNow(); if (!cid) return;
      const already = _misalDocs['darkhwastain'] && _misalDocs['darkhwastain'].status === 'complete'
        && _misalDocs['darkhwastain'].content && Object.keys(_misalDocs['darkhwastain'].content).length;
      if (already) return;
      const raw = localStorage.getItem('dio_dk_' + cid);
      if (!raw) return;
      let content = null; try { content = JSON.parse(raw); } catch (_) { return; }
      if (!content || !Object.keys(content).length) return;
      if (!_misalDocs['darkhwastain']) _misalDocs['darkhwastain'] = { document_type: 'darkhwastain' };
      _misalDocs['darkhwastain'].content = content;
      _misalDocs['darkhwastain'].status = 'complete';
      if (typeof _refreshMisalBar === 'function') _refreshMisalBar();
    } catch (_) {}
  }
  function init() {
    const target = document.getElementById('page-content');
    if (!target) { setTimeout(init, 800); return; }
    try { const obs = new MutationObserver(() => { try { heal(); } catch (_) {} }); obs.observe(target, { childList: true, subtree: true }); heal(); } catch (_) {}
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
