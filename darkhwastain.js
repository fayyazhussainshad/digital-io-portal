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

// ── APPLICATION TYPES (qismain) — id · naam · unwan (heading) ──
const DK_TYPES = [
  { id:'remand_jismani',   name:'ریمانڈ جسمانی',                unwan:'درخواست برائے حصولِ جسمانی ریمانڈ' },
  { id:'remand_judicial',  name:'ریمانڈ عدالتی',                unwan:'درخواست برائے حصولِ عدالتی ریمانڈ' },
  { id:'byanat_164',       name:'بیانات 164',                   unwan:'درخواست برائے قلمبند بیان زیر دفعہ 164 ض ف' },
  { id:'shanakht_parade',  name:'شناخت پریڈ',                   unwan:'درخواست برائے عدالتی شناخت پریڈ' },
  { id:'talbi_mulziman',   name:'طلبی ملزمان',                  unwan:'درخواست برائے طلبی ملزمان' },
  { id:'zamanat_qabl',     name:'منسوخی ضمانت قبل از گرفتاری',  unwan:'درخواست برائے منسوخی ضمانت قبل از گرفتاری' },
  { id:'superdari',        name:'سپردداری مال',                 unwan:'درخواست برائے سپردداری مال مقدمہ' },
  { id:'warrant_gift',     name:'وارنٹ گرفتاری',                unwan:'درخواست برائے اجراء وارنٹ گرفتاری ملزمان' },
  { id:'ishtihaari',       name:'اشتہاری ملزمان',               unwan:'درخواست برائے اعلانِ اشتہاری ملزمان زیر دفعہ 87 ض ف' },
  { id:'behri_dafat',      name:'اضافہ دفعات',                  unwan:'درخواست برائے اضافہ دفعات قانون' },
  { id:'kharaji_dafat',    name:'اخراج دفعات',                  unwan:'درخواست برائے اخراج دفعات قانون' },
  { id:'postmortem',       name:'پوسٹ مارٹم',                   unwan:'درخواست برائے پوسٹ مارٹم/طبی معائنہ' },
  { id:'dna',              name:'ڈی این اے',                    unwan:'درخواست برائے حصولِ ڈی این اے نمونہ جات' },
  { id:'call_data',        name:'کال ڈیٹا (CDR)',               unwan:'درخواست برائے حصولِ کال ڈیٹا ریکارڈ' },
  { id:'geo_fencing',      name:'جیو فینسنگ',                   unwan:'درخواست برائے حصولِ جیو فینسنگ ڈیٹا' },
  { id:'medical_board',    name:'میڈیکل بورڈ',                  unwan:'درخواست برائے تشکیل میڈیکل بورڈ' },
  { id:'transfer_case',    name:'منتقلی مقدمہ',                 unwan:'درخواست برائے منتقلی مقدمہ' },
  { id:'weapon_return',    name:'واپسی اسلحہ',                  unwan:'درخواست برائے واپسی اسلحہ' },
  { id:'record_talbi',     name:'طلبی ریکارڈ',                  unwan:'درخواست برائے طلبی ریکارڈ' },
  { id:'other',            name:'دیگر درخواست',                 unwan:'درخواست بعنوانِ عدالت' },
];

// ═══ ENTRY POINT — chip se yahi khulta hai ═══
async function openDarkhwast(caseId) {
  _dkAccused = null;
  _dkCaseId = caseId
    || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
    || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  if (typeof getCase === 'function' && _dkCaseId) {
    try { _dkCase = await getCase(_dkCaseId); } catch (_) { _dkCase = null; }
  }
  await _dkLoadSaved();
  await _dkLoadAccused();
  // Saved type (agar tha) warna default
  if (_dkSaved && _dkSaved.dk_type) _dkType = _dkSaved.dk_type;
  if (typeof _dioOpenDocTab === 'function') { try { _dioOpenDocTab('darkhwastain'); } catch (_) {} }
  _dkRender();
}
window.openDarkhwast = openDarkhwast;

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

// ملزمان ke naam ki fehrist (numbered) — templates ke liye
function _dkAccusedNames() {
  return (_dkAccused || []).map(a => (a.name || '').trim()).filter(Boolean);
}
function _dkAccusedNamesHtml() {
  const names = _dkAccusedNames();
  if (!names.length) return '<span style="color:#c00;">[ملزمان کے نام درج نہیں]</span>';
  return names.map((n, i) => (i + 1) + '۔ ' + esc(n)).join('<br>');
}

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

// ═══ TEMPLATE — har qism ka khaka (placeholders KHUD bharte hain) ═══
function _dkTemplateBody(typeId, c, o) {
  c = c || {}; o = o || {};
  const fir = esc(c.fir_number || '____');
  const uZila = esc(o.district || c.case_district || '____');
  const uThana = esc(o.station || c.case_station || '____');
  const dafat = esc(c.section_of_law || c.offence_type || '____');
  const accBlock = _dkAccusedNamesHtml();
  const io = esc(_dkShoLine(o));

  const P = (body) => body;   // shortcut

  switch (typeId) {
    case 'remand_jismani':
      return P(`جناب عالیٰ! گزارش ہے کہ مقدمہ نمبر ${fir} زیر دفعہ ${dafat} تھانہ ${uThana} ضلع ${uZila} درج ہے۔ دورانِ تفتیش مندرجہ ذیل ملزم/ملزمان کو گرفتار کیا گیا ہے:<br>${accBlock}<br>چونکہ ملزمان سے برآمدگی/تفتیش مکمل کرنا باقی ہے اور مزید تفتیش کے لیے ملزمان کا جسمانی ریمانڈ درکار ہے، لہٰذا استدعا ہے کہ ملزمان بالا کا جسمانی ریمانڈ بحق پولیس عطا فرمایا جائے تاکہ تکمیلِ تفتیش عمل میں لائی جا سکے۔ مہربانی ہوگی۔`);
    case 'remand_judicial':
      return P(`جناب عالیٰ! گزارش ہے کہ مقدمہ نمبر ${fir} زیر دفعہ ${dafat} تھانہ ${uThana} ضلع ${uZila} درج ہے۔ مندرجہ ذیل ملزم/ملزمان زیرِ حراست ہیں:<br>${accBlock}<br>چونکہ ملزمان سے تفتیش/برآمدگی مکمل ہو چکی ہے اور فی الحال مزید جسمانی ریمانڈ کی ضرورت نہیں، لہٰذا استدعا ہے کہ ملزمان بالا کو عدالتی ریمانڈ پر جیل بھیجا جائے۔ مہربانی ہوگی۔`);
    case 'byanat_164':
      return P(`جناب عالیٰ! گزارش ہے کہ مقدمہ نمبر ${fir} زیر دفعہ ${dafat} تھانہ ${uThana} ضلع ${uZila} درج ہے۔ دورانِ تفتیش گواہان/مدعی کے بیانات زیر دفعہ 164 ض ف بحضورِ عدالت قلمبند کروانا ازحد ضروری ہے تاکہ شہادت کو قانونی تحفظ حاصل ہو۔ لہٰذا استدعا ہے کہ گواہان ہٰذا کے بیانات زیر دفعہ 164 ض ف قلمبند فرمائے جائیں۔ مہربانی ہوگی۔`);
    case 'shanakht_parade':
      return P(`جناب عالیٰ! گزارش ہے کہ مقدمہ نمبر ${fir} زیر دفعہ ${dafat} تھانہ ${uThana} ضلع ${uZila} درج ہے۔ مندرجہ ذیل ملزم/ملزمان زیرِ حراست ہیں:<br>${accBlock}<br>چونکہ ملزمان کی بذریعہ گواہان شناخت کروانا ضروری ہے، لہٰذا استدعا ہے کہ کسی مجسٹریٹ صاحب کی وساطت سے ملزمان بالا کی عدالتی شناخت پریڈ کروائی جائے۔ مہربانی ہوگی۔`);
    case 'talbi_mulziman':
      return P(`جناب عالیٰ! گزارش ہے کہ مقدمہ نمبر ${fir} زیر دفعہ ${dafat} تھانہ ${uThana} ضلع ${uZila} درج ہے۔ مندرجہ ذیل ملزم/ملزمان کی بابت تفتیش درکار ہے:<br>${accBlock}<br>لہٰذا استدعا ہے کہ ملزمان بالا کو بغرضِ تفتیش عدالت میں طلب فرمایا جائے۔ مہربانی ہوگی۔`);
    case 'zamanat_qabl':
      return P(`جناب عالیٰ! گزارش ہے کہ مقدمہ نمبر ${fir} زیر دفعہ ${dafat} تھانہ ${uThana} ضلع ${uZila} درج ہے۔ ملزم/ملزمان نے قبل از گرفتاری ضمانت حاصل کر رکھی ہے، تاہم تفتیش میں عدم تعاون کے باعث ضمانت کی منسوخی ناگزیر ہے۔ لہٰذا استدعا ہے کہ ملزمان بالا کی ضمانت قبل از گرفتاری منسوخ فرمائی جائے۔ مہربانی ہوگی۔`);
    case 'superdari':
      return P(`جناب عالیٰ! گزارش ہے کہ مقدمہ نمبر ${fir} زیر دفعہ ${dafat} تھانہ ${uThana} ضلع ${uZila} درج ہے۔ مالِ مقدمہ بمقام مالخانہ محفوظ ہے۔ چونکہ اصل مالک کی جانب سے سپردداری کی درخواست موصول ہوئی ہے، لہٰذا استدعا ہے کہ مالِ مقدمہ بعد تکمیلِ قانونی کارروائی جائز مالک کے سپرد کیا جائے۔ مہربانی ہوگی۔`);
    case 'warrant_gift':
      return P(`جناب عالیٰ! گزارش ہے کہ مقدمہ نمبر ${fir} زیر دفعہ ${dafat} تھانہ ${uThana} ضلع ${uZila} درج ہے۔ مندرجہ ذیل ملزم/ملزمان تاحال گرفتار نہیں ہو سکے:<br>${accBlock}<br>لہٰذا استدعا ہے کہ ملزمان بالا کے وارنٹ گرفتاری جاری فرمائے جائیں۔ مہربانی ہوگی۔`);
    case 'ishtihaari':
      return P(`جناب عالیٰ! گزارش ہے کہ مقدمہ نمبر ${fir} زیر دفعہ ${dafat} تھانہ ${uThana} ضلع ${uZila} درج ہے۔ مندرجہ ذیل ملزم/ملزمان وارنٹ گرفتاری کے باوجود روپوش ہیں:<br>${accBlock}<br>لہٰذا استدعا ہے کہ ملزمان بالا کو زیر دفعہ 87 ض ف اشتہاری قرار دیا جائے۔ مہربانی ہوگی۔`);
    case 'behri_dafat':
      return P(`جناب عالیٰ! گزارش ہے کہ مقدمہ نمبر ${fir} تھانہ ${uThana} ضلع ${uZila} درج ہے۔ دورانِ تفتیش نئے حقائق سامنے آئے ہیں جن کی روشنی میں دفعات قانون میں اضافہ ناگزیر ہے۔ لہٰذا استدعا ہے کہ مقدمہ ہٰذا میں مناسب دفعات کے اضافہ کی اجازت مرحمت فرمائی جائے۔ مہربانی ہوگی۔`);
    case 'kharaji_dafat':
      return P(`جناب عالیٰ! گزارش ہے کہ مقدمہ نمبر ${fir} زیر دفعہ ${dafat} تھانہ ${uThana} ضلع ${uZila} درج ہے۔ دورانِ تفتیش بعض دفعات کا اطلاق ثابت نہ ہو سکا۔ لہٰذا استدعا ہے کہ غیر متعلقہ دفعات کے اخراج کی اجازت مرحمت فرمائی جائے۔ مہربانی ہوگی۔`);
    case 'postmortem':
      return P(`جناب عالیٰ! گزارش ہے کہ مقدمہ نمبر ${fir} زیر دفعہ ${dafat} تھانہ ${uThana} ضلع ${uZila} درج ہے۔ لاشہ/مضروب کے پوسٹ مارٹم/طبی معائنہ کی رپورٹ بغرضِ تفتیش درکار ہے۔ لہٰذا استدعا ہے کہ متعلقہ میڈیکل آفیسر کو پوسٹ مارٹم/طبی معائنہ کی ہدایت فرمائی جائے۔ مہربانی ہوگی۔`);
    case 'dna':
      return P(`جناب عالیٰ! گزارش ہے کہ مقدمہ نمبر ${fir} زیر دفعہ ${dafat} تھانہ ${uThana} ضلع ${uZila} درج ہے۔ تفتیش کی غرض سے ملزمان/مضروب کے ڈی این اے نمونہ جات کا حصول ازحد ضروری ہے۔ لہٰذا استدعا ہے کہ ڈی این اے نمونہ جات کے حصول کی اجازت مرحمت فرمائی جائے۔ مہربانی ہوگی۔`);
    case 'call_data':
      return P(`جناب عالیٰ! گزارش ہے کہ مقدمہ نمبر ${fir} زیر دفعہ ${dafat} تھانہ ${uThana} ضلع ${uZila} درج ہے۔ تفتیش کے سلسلے میں متعلقہ موبائل نمبرز کا کال ڈیٹا ریکارڈ (CDR) درکار ہے۔ لہٰذا استدعا ہے کہ متعلقہ کمپنیوں سے کال ڈیٹا کے حصول کی اجازت مرحمت فرمائی جائے۔ مہربانی ہوگی۔`);
    case 'geo_fencing':
      return P(`جناب عالیٰ! گزارش ہے کہ مقدمہ نمبر ${fir} زیر دفعہ ${dafat} تھانہ ${uThana} ضلع ${uZila} درج ہے۔ وقوعہ کے مقام کی جیو فینسنگ ڈیٹا بغرضِ شناختِ ملزمان درکار ہے۔ لہٰذا استدعا ہے کہ جیو فینسنگ ڈیٹا کے حصول کی اجازت مرحمت فرمائی جائے۔ مہربانی ہوگی۔`);
    case 'medical_board':
      return P(`جناب عالیٰ! گزارش ہے کہ مقدمہ نمبر ${fir} زیر دفعہ ${dafat} تھانہ ${uThana} ضلع ${uZila} درج ہے۔ مضروب/ملزم کی طبی حالت کے تعین کے لیے میڈیکل بورڈ کی تشکیل ضروری ہے۔ لہٰذا استدعا ہے کہ میڈیکل بورڈ تشکیل دیا جائے۔ مہربانی ہوگی۔`);
    case 'transfer_case':
      return P(`جناب عالیٰ! گزارش ہے کہ مقدمہ نمبر ${fir} زیر دفعہ ${dafat} تھانہ ${uThana} ضلع ${uZila} درج ہے۔ بوجوہِ تفتیش/دائرہ اختیار مقدمہ ہٰذا کی منتقلی ناگزیر ہے۔ لہٰذا استدعا ہے کہ مقدمہ ہٰذا متعلقہ عدالت/تھانہ منتقل فرمایا جائے۔ مہربانی ہوگی۔`);
    case 'weapon_return':
      return P(`جناب عالیٰ! گزارش ہے کہ مقدمہ نمبر ${fir} زیر دفعہ ${dafat} تھانہ ${uThana} ضلع ${uZila} درج ہے۔ برآمد شدہ اسلحہ بابت مقدمہ ہٰذا لائسنس یافتہ ہے اور اصل مالک کی درخواست موصول ہوئی ہے۔ لہٰذا استدعا ہے کہ اسلحہ بعد قانونی کارروائی جائز مالک کو واپس کیا جائے۔ مہربانی ہوگی۔`);
    case 'record_talbi':
      return P(`جناب عالیٰ! گزارش ہے کہ مقدمہ نمبر ${fir} زیر دفعہ ${dafat} تھانہ ${uThana} ضلع ${uZila} درج ہے۔ تفتیش کی غرض سے متعلقہ ریکارڈ درکار ہے۔ لہٰذا استدعا ہے کہ متعلقہ ادارہ/محکمہ کو ریکارڈ فراہمی کی ہدایت فرمائی جائے۔ مہربانی ہوگی۔`);
    default:
      return P(`جناب عالیٰ! گزارش ہے کہ مقدمہ نمبر ${fir} زیر دفعہ ${dafat} تھانہ ${uThana} ضلع ${uZila} درج ہے۔ [یہاں درخواست کا مضمون تحریر کریں]۔ لہٰذا استدعا ہے کہ ______________________ ۔ مہربانی ہوگی۔`);
  }
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
      <div style="margin-right:auto;display:flex;gap:6px;align-items:center;">
        <button onmousedown="event.preventDefault()" onclick="_dkFmt('bold')" title="بولڈ" style="${_dkBtn()}font-weight:900;">B</button>
        <button onmousedown="event.preventDefault()" onclick="_dkFmt('italic')" title="ترچھا" style="${_dkBtn()}font-style:italic;">I</button>
        <button onmousedown="event.preventDefault()" onclick="_dkFmt('underline')" title="انڈر لائن" style="${_dkBtn()}text-decoration:underline;">U</button>
        <span style="width:1px;height:22px;background:var(--border,#ccc);margin:0 4px;"></span>
        <button onmousedown="event.preventDefault()" onclick="_dkFmt('justifyRight')" title="دائیں" style="${_dkBtn()}">⇥</button>
        <button onmousedown="event.preventDefault()" onclick="_dkFmt('justifyFull')" title="برابر" style="${_dkBtn()}">☰</button>
        <span style="width:1px;height:22px;background:var(--border,#ccc);margin:0 4px;"></span>
        <select id="dk-font-sel" onchange="_dkSetFont(this.value)" title="فونٹ سائز"
          style="height:28px;border:1px solid var(--border,#ccc);border-radius:6px;background:var(--bg-card,#fff);color:var(--text-primary,#111);font-size:13px;padding:0 6px;">
          ${DK_FONT_SIZES.map(s => `<option value="${s}" ${String(s)===String(docFont)?'selected':''}>${s}</option>`).join('')}
        </select>
        <button onmousedown="event.preventDefault()" onclick="_dkFmt('undo')" title="واپس" style="${_dkBtn()}">↶</button>
        <button onmousedown="event.preventDefault()" onclick="_dkFmt('redo')" title="دوبارہ" style="${_dkBtn()}">↷</button>
        <button class="btn btn-primary btn-sm dio-modbtn" onclick="_dkSave()">💾 محفوظ کریں</button>
        <button class="btn btn-secondary btn-sm dio-modbtn" onclick="_dkPrint()">🖨️ پرنٹ کریں</button>
      </div>
    </div>

    <!-- ── PAGE AREA ── -->
    <div style="flex:1;overflow:auto;min-height:0;padding:16px;background:var(--bg-tertiary);">
      <div id="dk-doc" data-fs="${esc(String(docFont))}" style="width:${_dkPaper==='a4'?'8.27in':'8.5in'};min-height:${_dkPaper==='a4'?'11.7in':'13in'};margin:0 auto;
           padding:1cm ${_dkSideMargin()};background:#fff;box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:4px;
           line-height:1.9;box-sizing:border-box;font-size:${docFont}pt;">

        <!-- عنوان (court) -->
        <div class="dk-court" contenteditable="true" data-k="court">${v('court', 'بحضور جناب علاقہ مجسٹریٹ صاحب ' + esc(o.district || c.case_district || ''))}</div>

        <!-- Unwan (heading) — qism ke hisaab se, underline -->
        <div class="dk-unwan" contenteditable="true" data-k="unwan">${v('unwan_' + _dkType, esc(typeDef.unwan))}</div>

        <!-- Case line -->
        <div class="dk-caseline" contenteditable="true" data-k="caseline">${v('caseline', 'مقدمہ نمبر ' + esc(fir) + ' مورخہ ' + esc(firDate) + ' زیر دفعہ ' + esc(dafat) + ' تھانہ ' + esc(o.station || c.case_station || ''))}</div>

        <!-- Body (rich text) -->
        <div class="dk-body" contenteditable="true" data-k="${savedBodyKey}">${bodyHtml}</div>

        <!-- SHO/IO block — bayen sidh -->
        <div class="dk-sign">
          <div class="dk-sign-name" contenteditable="true" data-k="sho">${v('sho', esc(_dkShoLine(o)))}</div>
          <div class="dk-sign-date" contenteditable="true" data-k="sho_date">${v('sho_date', 'مورخہ ' + esc(_dkToday()))}</div>
        </div>

        <input type="hidden" data-k="doc_font" value="${esc(String(docFont))}">
        <input type="hidden" data-k="dk_type" value="${esc(_dkType)}">
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
  doc.dataset.fs = pt; doc.style.fontSize = pt + 'pt';
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
  // localStorage backup (hamesha)
  try { localStorage.setItem('dio_dk_' + _dkCaseId, JSON.stringify(data)); } catch (_) {}
  try {
    let exists = false;
    try { exists = !!(typeof _misalDocs !== 'undefined' && _misalDocs && _misalDocs['darkhwastain'] && _misalDocs['darkhwastain'].id); } catch (_) {}
    if (!exists) {
      const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
      const { data: ins, error } = await supabaseClient
        .from('case_documents')
        .insert({ case_id: _dkCaseId, officer_id: oid, document_type: 'darkhwastain', status: 'complete', content: data })
        .select().single();
      if (error) throw error;
      try { if (typeof _misalDocs !== 'undefined') _misalDocs['darkhwastain'] = ins; } catch (_) {}
    } else {
      const { error } = await supabaseClient
        .from('case_documents')
        .update({ content: data, status: 'complete', updated_at: new Date().toISOString() })
        .eq('case_id', _dkCaseId).eq('document_type', 'darkhwastain');
      if (error) throw error;
      try { _misalDocs['darkhwastain'].content = data; _misalDocs['darkhwastain'].status = 'complete'; } catch (_) {}
    }
    _dkSaved = data; _dkDirty = false;
    try { _dkMarkMisalSaved(data, 'complete'); } catch (_) {}
    try { if (typeof _refreshMisalBar === 'function') _refreshMisalBar(); } catch (_) {}
    try { if (typeof dioRegisterSaved === 'function') dioRegisterSaved('misal', 'درخواست', { case_id: _dkCaseId, doc_id: 'darkhwastain' }); } catch (_) {}
    if (typeof showToast === 'function') showToast('✅ درخواست محفوظ ہو گئی — چپ پر "درخواستیں" اب مکمل ہے', 'success');
  } catch (e) {
    // DB fail — localStorage backup pehle hi ho chuka, chip bhi mark
    try { _dkMarkMisalSaved(data, 'complete'); if (typeof _refreshMisalBar === 'function') _refreshMisalBar(); } catch (_) {}
    if (typeof showToast === 'function') showToast('⚠️ آف لائن محفوظ (اس ڈیوائس پر) — ' + ((e && e.message) || e), 'warn', 4500);
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
        min-height:0 !important; padding:0 !important; margin:0 !important;
        transform:none !important; box-shadow:none !important; border-radius:0 !important; }
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

    #dk-doc{ direction:rtl; font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; color:#000; font-size:14pt; text-align:justify; }
    #dk-doc [contenteditable]{ outline:none; }
    /* عنوان (court) — center */
    #dk-doc .dk-court{ text-align:center; font-size:15pt; font-weight:bold; margin:0 0 8pt; }
    /* Unwan — center, underline */
    #dk-doc .dk-unwan{ text-align:center; font-size:16pt; font-weight:bold; text-decoration:underline; margin:0 0 10pt; }
    /* Case line — center */
    #dk-doc .dk-caseline{ text-align:center; font-size:14pt; margin:0 0 14pt; }
    /* Body — justified */
    #dk-doc .dk-body{ text-align:justify; text-align-last:right; font-size:14pt; line-height:2; min-height:3in; }
    /* SHO/IO — bayen sidh */
    #dk-doc .dk-sign{ margin-top:28pt; text-align:left; }
    #dk-doc .dk-sign-name{ font-weight:bold; font-size:14pt; text-align:left !important; white-space:nowrap; outline:none; }
    #dk-doc .dk-sign-date{ font-size:14pt; text-align:left !important; margin-top:4px; outline:none; }
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
