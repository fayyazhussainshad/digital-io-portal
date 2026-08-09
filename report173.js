/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — رپورٹ 173 ض ف (FORM 25.56(1))
   5 types: چالان مکمل/نامکمل/انٹیرم/اخراج/عدم پتہ
   ═══════════════════════════════════════════════════════════ */

let _r173CaseId = null;
let _r173Case = null;
// کاغذ کا سائز — لیگل (8.5×13) یا A4 (اوپر ہی رکھنا ضروری، نیچے استعمال ہوتا ہے)
let _ch173Paper = (function () {
  try { return localStorage.getItem('dio_ch173_paper') || 'legal'; } catch (_) { return 'legal'; }
})();

let _r173Records = {};  // type -> saved form_data
let _r173Docs = [];     // ہر چالان الگ ریکارڈ

// ═══ چالان کا ہیڈ/عنوان — ایک ہی قسم کے کئی چالان بن سکتے ہیں ═══
const R173_HEADS = [
  'انکشاف ـ مال مسروق',
  'انکشاف ـ نقدی رقم',
  'نامزد ملزم ـ مخصی',
  'نامزد ملزمان ـ مخصی',
  'نامزد ملزم ـ جو ڈی چالان',
  'نامزد ملزمان ـ جو ڈی چالان',
  'نامزد ملزمان ـ بروئے راضی نامہ',
  'کینگ',
  'نامکمل 512 ض ف',
  'نامزد ملزم ـ پیش عدالت',
  'نامزد ملزم ـ پیش عدالت ـ مخصی ـ بروئے راضی نامہ',
  'نامزد ملزمان ـ پیش عدالت ـ مخصی ـ بروئے راضی نامہ',
  'مکمل چالان ـ B/CNSA-9',
];
// عدم پتہ / اخراج کے ہیڈ
const R173_IKHRAJ_HEADS = [
  'عدم پتہ',
  'اخراج',
  'اخراج ـ بوجہ عدم ثبوت',
  'اخراج ـ بوجہ راضی نامہ',
  'ساقط',
];
// موجودہ کھلے چالان کی شناخت (نیا ہو تو null)
let _r173DocId = null;
let _r173Head  = '';
// Naya چالان — purana data hargiz na aaye (khali فارم)
let _r173ForceBlank = false;
// Kahin tabdeeli hui hai? (mehfooz karne ki yaad dahani ke liye)
let _r173Dirty = false;

// Mojooda khule چالان ka apna record — chaabi ki takraar se bachne ke liye.
// (Aik hi qism ke kai چالان ki chaabi aik jaisi banti hai, is liye SIRF
//  chaabi par bharosa karne se aik چالان ka data doosre mein aa jata tha.)
function _r173CurrentData(fallbackKey) {
  if (_r173ForceBlank) return {};
  if (_r173DocId) {
    const d = _r173Docs.find(x => String(x.id) === String(_r173DocId));
    if (d && d.form_data) return d.form_data;
  }
  return _r173Records[fallbackKey] || {};
}
let _r173ShowList = false;   // save ke baad چالان ki fehrist

let _r173Type = 'mukammal';

const R173_TYPES = [
  { id:'mukammal',  name:'چالان مکمل' },
  { id:'namukammal',name:'چالان نامکمل' },
  { id:'ch512',     name:'چالان 512 ض ف' },
  { id:'tatima_challan', name:'تتمہ چالان' },
  { id:'interim',   name:'انٹیرم چالان' },
  { id:'ikhraj',    name:'اخراج' },
  { id:'adampata',  name:'عدم پتہ' },
];

// CHALLAN types — inka format software NAHI deta (sarkari manzoor-shuda form
// owner/admin khud set karega). Yeh types khali safed safhe par khulte hain.
const R173_BLANK_TYPES = ['mukammal','namukammal','ch512','tatima_challan','interim'];

const R173_TATIMA_SUBS = [
  { id:'aslha',  name:'تتمہ چالان — اسلحہ' },
  { id:'chars',  name:'تتمہ چالان — چرس/منشیات' },
  { id:'sharab', name:'تتمہ چالان — شراب' },
  { id:'zina',   name:'تتمہ چالان — زنا/ڈی این اے' },
];

const R173_TATIMA_BOILER = {
  // Khali — owner khud set karega
  _unused_aslha: 'جناب عالیٰ! مقدمہ ہذا میں قبل ازیں ملزم مندرجہ خانہ نمبر 3 کے خلاف چالان نامکمل مرتب ہو چکا ہے اب PFSA لاہور سے رزلٹ نمبری ____________ موصول ہوا ہے جس پر جناب ایگزامینر صاحب نے بحروف انگریزی ذیل رائے تحریر فرمائی ہے۔ "The item P1 pistol was examined and found to be in mechanical operating condition" رزلٹ میں پارسل کو item P1 سے ظاہر کیا گیا ہے لہٰذا مقدمہ ہذا میں ملزم بالا کے خلاف تتمہ چالان مکمل مرتب ہو کر ارسال خدمت ہے سماعت فرمائی جائے۔',
  chars: 'جناب عالیٰ! مقدمہ ہذا میں قبل ازیں ملزم مندرجہ خانہ نمبر 3 کے خلاف چالان نامکمل مرتب ہو چکا ہے PFSA لاہور سے موصولہ متعلقہ مقدمہ ہذا ایک رزلٹ نمبر ____________ موصول ہوا ہے جس پر جناب ایگزامینر صاحب نے بحروف انگریزی ذیل رائے تحریر فرمائی ہے۔ "Sample 01 having net weight ______ grams of dark brown resinous material in sealed parcel contains Chars. Sample is Narcotic Drug as defined in the section 2 of the CNS Act, 1997." تصدیق چرس ہو چکی ہے لہٰذا مقدمہ ہذا میں ملزم بالا کے خلاف تتمہ چالان مکمل مرتب ہو کر ارسال خدمت ہے سماعت فرمائی جائے۔',
  sharab: 'جناب عالیٰ! مقدمہ ہذا میں قبل ازیں ملزم مندرجہ خانہ نمبر 3 کے خلاف چالان نامکمل مرتب ہو چکا ہے اب PFSA لاہور سے رزلٹ نمبری ____________ موصول ہوا ہے جس پر جناب ایگزامینر صاحب نے بحروف انگریزی ذیل رائے تحریر فرمائی ہے۔ "Presumptive test indicated the presence of alcohol in item 1." لہٰذا مقدمہ ہذا میں ملزم بالا کے خلاف تتمہ چالان مکمل مرتب ہو کر ارسال خدمت ہے سماعت فرمائی جائے۔',
  zina: 'جناب عالیٰ! مقدمہ ہذا میں قبل ازیں ملزم مندرجہ خانہ نمبر 3 کے خلاف چالان نامکمل مرتب ہو چکا ہے اب PFSA لاہور سے رزلٹ نمبری ____________ موصول ہوا ہے جس پر جناب ایگزامینر صاحب نے بحروف انگریزی ذیل رائے تحریر فرمائی ہے۔ "No seminal material was found on item no.1 and 2.1-2.3; therefore no further DNA analysis was conducted on these." مقدمہ ہذا میں تکمیل تفتیش ہو چکی ہے لہٰذا ملزم بالا کے خلاف تتمہ چالان مکمل مرتب ہو کر ارسال خدمت ہے سماعت فرمائی جائے۔',
};

let _r173Subtype = 'aslha';

const R173_BOILER = {
  // چالان types ka koi taiyar matn nahi — owner khud likhega/set karega
  mukammal: '',
  namukammal: '',
  ch512: '',
  interim: '',
  ikhraj: '',
  adampata: 'جناب عالیٰ! مختصر حالات مقدمہ عنوان بالا اس طرح ہیں کہ باوجود بھرپور کوشش ملزمان کا کوئی سراغ نہ مل سکا۔ رپورٹ عدم پتہ مرتب ہوکر ارسالِ خدمت ہے، سماعت فرمائی جائے۔',
};

// ── ENTRY ─────────────────────────────────────────────────────
async function openReport173(caseId) {
  _ch173Accused = null; _ch173Witnesses = null;   // naye case ki list
  _r173CaseId = caseId || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
             || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  if (typeof getCase === 'function' && _r173CaseId) {
    try { _r173Case = await getCase(_r173CaseId); } catch(_) { _r173Case = null; }
  }
  await _loadR173();
  // NOTE: yahan render NAHI karte — warna do martaba render hota hai aur
  // beech mein ghalat safha ("fake" report 173) jhalak jata hai.
  // Render ka faisla bulane wala karta hai (openR173List ya openReport173WithType).
}

async function _loadR173() {
  if (!navigator.onLine) {
    try { _r173Records = JSON.parse(localStorage.getItem('dio_r173_'+_r173CaseId)||'{}'); } catch(_) { _r173Records={}; }
    // Fehrist bhi cache se — warna offline par "کوئی اندراج نہیں" dikhta tha
    try { _r173Docs = JSON.parse(localStorage.getItem('dio_r173docs_'+_r173CaseId)||'[]'); } catch(_) { _r173Docs = []; }
    return;
  }
  try {
    const { data } = await supabaseClient.from('report_173').select('*').eq('case_id', _r173CaseId);
    _r173Records = {};
    _r173Docs = (data || []).map(r => ({
      id: r.id, type: r.report_type, subtype: r.report_subtype || '',
      head: (r.form_data && r.form_data.head) || '',
      form_data: r.form_data || {},
      // چالان ki apni تاریخ (SHO wali). Pehle yahan FIR ki مورخہ aa rahi thi,
      // is liye har satar par aik hi تاریخ dikhti thi.
      date: (r.form_data && (r.form_data.sho_date2 || r.form_data.sho_date))
            || (r.created_at ? String(r.created_at).slice(0,10) : ''),
    }));
    (data||[]).forEach(r => {
      // Chaabi bilkul waisi jaisi SAVE karte waqt banti hai (warna dohri entries)
      let key;
      if (r.report_type === 'tatima_challan') key = 'tatima_challan_' + (r.report_subtype || 'aslha');
      else if (R173_BLANK_TYPES.includes(r.report_type)) key = r.report_type + '::' + (r.report_subtype || 'fir');
      else key = r.report_type;
      _r173Records[key] = r.form_data || {};
    });
    try { localStorage.setItem('dio_r173_'+_r173CaseId, JSON.stringify(_r173Records)); } catch(_) {}
    try { localStorage.setItem('dio_r173docs_'+_r173CaseId, JSON.stringify(_r173Docs)); } catch(_) {}
  } catch(_) {
    try { _r173Records = JSON.parse(localStorage.getItem('dio_r173_'+_r173CaseId)||'{}'); } catch(_2) { _r173Records={}; }
  }
}

function _r173Pick(type) {
  _r173Type = type;
  _closeAllDD && _closeAllDD();
  _renderR173();
}
function _r173PickSub(sub) {
  _r173Subtype = sub;
  _renderR173();
}

// ── RENDER ────────────────────────────────────────────────────

// Har challan type ka apna unwan (512 ka andaz alag hai)
function _ch173Heading(type, typeName) {
  if (type === 'ch512') return 'فارم رپورٹ چالان زیردفعہ 512 ض ف';
  return 'فارم رپورٹ ' + typeName + ' زیر دفعہ 173 ض ف';
}

function _renderR173() {
  // Fehrist ya فارم — yeh halat SIRF user ke amal se badalti hai.
  // (Pehle yeh flag khud saaf ho jata tha, is liye tab dobara render hone par
  //  ghalat safha khul jata tha — yani "fake" report 173.)
  if (_r173ShowList) { _renderR173List(); return; }
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const c = _r173Case || {};
  const isTatima = _r173Type === 'tatima_challan';
  let typeName = (R173_TYPES.find(t => t.id === _r173Type) || {}).name || '';
  if (isTatima) typeName = 'تتمہ چالان مکمل';
  // Saved record key (tatima uses subtype)
  let recKey = isTatima ? 'tatima_challan_' + _r173Subtype : _r173Type;
  const saved = _r173CurrentData(recKey);
  const v = (k, def) => sanitizeHtml(saved[k] !== undefined ? saved[k] : (def || ''));
  const isIkhraj = _r173Type === 'ikhraj';
  const isAdampata = _r173Type === 'adampata';
  const isClosing = isIkhraj || isAdampata; // both use the 3-col 8-row table layout
  // Boilerplate: tatima uses subtype boiler, others use type boiler
  const boiler = isTatima ? (R173_TATIMA_BOILER[_r173Subtype]||'') : (R173_BOILER[_r173Type]||'');

  // ── CHALLAN types: koi format software NAHI deta ──────────────────────
  // چالان مکمل / نامکمل / 512 ض ف / تتمہ چالان — yeh sarkari manzoor-shuda
  // forms hain jinke khane pehle se muqarrar hote hain. Software apni taraf se
  // koi format, khana ya button nahi dega — sirf khali safed kaghaz. Owner/admin
  // khud manzoor-shuda form set karega.
  if (R173_BLANK_TYPES.includes(_r173Type)) {
    // ملزمان aur گواہان case record se — dropdown + auto-fill ke liye
    if (!_ch173Accused) _ch173LoadPeople();
    // FIR aur کراس ورژن ka data alag mehfooz hota hai
    recKey = recKey + '::' + _ch173Version;
    // ═══ فارم نمبر 25.56(1) — رپورٹ زیر دفعہ 173 ض ف ═══
    const bs = _r173CurrentData(recKey);
    _r173ForceBlank = false;          // sirf aik bar
    const bv = (k) => sanitizeHtml(bs[k] !== undefined ? bs[k] : '');
    // Mehfooz shuda column widths (MS Word jaisi drag-adjust ke baad)
    const savedW = (() => { try { return JSON.parse(bs.col_widths || 'null'); } catch(_) { return null; } })();
    const W = savedW || [10, 12, 8, 10, 6, 27, 27];

    area.innerHTML = `
    <style>
      #ch173-doc{ direction:rtl; font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; color:#000; }
      /* Unwan: FORM No. aur Urdu heading — dono AIK hi flex dhanche mein,
         is liye dono ka center bilkul aik (linked) */
      /* Unwan: beech wala hissa HAMESHA sacche page-center par (absolute 50%),
         chahe kinaron ka matn kitna bhi lamba ho. FORM No. bhi usi 50% par →
         dono ka center bilkul aik (linked). */
      #ch173-doc .ch173-title-row{ position:relative; display:flex; align-items:baseline;
        justify-content:space-between; width:100%; min-height:1.6em; }
      #ch173-doc .ch173-title-row > span{ white-space:nowrap; }
      #ch173-doc .tt-right{ text-align:right; font-size:14pt; padding-right:1in; }
      #ch173-doc .tt-left{ text-align:left; font-size:14pt; }
      #ch173-doc .tt-mid, #ch173-doc .form-no{
        position:absolute; left:50%; transform:translateX(-50%); white-space:nowrap;
      }
      #ch173-doc .tt-mid{ font-weight:bold; text-decoration:underline; font-size:20pt; }
      #ch173-doc .form-no{ font-style:italic; font-size:12pt; direction:ltr; }

      /* مقدمہ نمبر / مورخہ / جرم — unwan ke neeche, table se pehle */
      /* مقدمہ نمبر / مورخہ / جرم — koi dashes nahi, data ke hisab se khud fit */
      #ch173-doc .ch173-caseline{ display:flex; gap:22px; align-items:baseline; font-size:14pt;
        margin:18px 0 16px 0; direction:rtl; flex-wrap:wrap; line-height:1.4;
        justify-content:center; }
      #ch173-doc .ch173-caseline .fl{ display:inline-block; min-width:40px;
        border:none; text-align:right; outline:none; font-weight:normal;
        unicode-bidi:isolate; direction:rtl; }
      #ch173-doc .ch173-caseline .fl-lg{ min-width:60px; }
      /* "ت پ" — دفعات کے بعد آخر میں، اپنا الگ خانہ */
      #ch173-doc .ch173-caseline .fl-suf{ min-width:24px; }

      #ch173-doc .ch173-table{ width:100%; border-collapse:collapse; table-layout:fixed; direction:rtl; }
      #ch173-doc .ch173-table th, #ch173-doc .ch173-table td{
        border:1px solid #000; padding:2px 4px; text-align:center;
        white-space:normal; word-wrap:break-word; overflow-wrap:break-word;
        position:relative; line-height:1.15;
      }
      /* Header row 1: jagah ke hisab se chhota font */
      #ch173-doc .ch173-table thead th{ font-size:14pt; vertical-align:middle; line-height:1.15; font-weight:normal; }
      /* Data khane: columns 1–6 → Ascending (neeche se ooper). AHEM: CSS transform
         seedha <td> par kaam nahi karta (browser nazar-andaz kar deta hai), is liye
         matn andar <div> wrapper mein rakh kar us par lagate hain. */
      #ch173-doc .ch173-table td{ font-size:14pt; vertical-align:top; line-height:1.15; }
      /* Khane KHUD nahi phailte — sirf haath se (drag) resize hote hain */
      #ch173-doc .ch173-table tbody td{ height:${_ch173Paper==='a4'?'150mm':'185mm'}; padding:0;
        overflow:visible; position:relative; }
      /* ASCENDING (neeche se ooper) — writing-mode Chrome mein na-qabil-e-aitbaar
         hai, is liye seedha ghumao (rotate) use karte hain. Khana relative,
         andar ka box absolute + rotate(90deg) → RTL Urdu neeche se ooper. */
      /* Khane ke andar clip-box — rotated matn kabhi doosre column mein na jaye */
      #ch173-doc .ch173-table td.rotcell, #ch173-doc .ch173-table th.rotcell{
        position:relative; padding:0; overflow:hidden;
      }
      /* Khadi likhayi — SIRF CSS (koi JS naap nahi), is liye print par bhi
         khud theek rehti hai. writing-mode se matn khada, rotate(180) se
         NEECHE se OOPER (Ascending). */
      #ch173-doc .cellbox{ position:relative; width:100%; height:100%; overflow:hidden; }
      /* Khadi likhayi ka block khane ke BEECH mein (pehle dayen kinare se
         chipka hua tha). rotclip ko flex bana kar beech mein rakhte hain. */
      #ch173-doc .rotclip{ position:absolute; inset:0; overflow:hidden;
        display:flex; justify-content:center; align-items:stretch; }
      /* Table ke neeche koi lakeer nahi (magar wahan se unchai badalti hai) */
      #ch173-doc .ch173-table, #ch173-doc .ch173-table tbody,
      #ch173-doc .ch173-table tbody tr, #ch173-doc .ch173-table tbody td{
        border-bottom:0 !important;
      }
      /* Column 7 — normal RTL (khadi nahi), khane ke andar hi mehdood */
      #ch173-doc .hcell-td{ padding:0; vertical-align:top; }
      #ch173-doc .hinner{
        width:100%; height:100%; padding:5px; box-sizing:border-box;
        direction:rtl; text-align:justify; text-align-last:right; outline:none;
        line-height:1.15; overflow:hidden; overflow-wrap:break-word;
        white-space:pre-wrap; font-size:14pt;
      }
      /* اختتامی خانہ — 2 برابر کالم۔ flex اس لیے کہ دونوں کالم ہمیشہ ایک جتنے
         چوڑے رہیں اور ایک ساتھ ہی نیچے بڑھیں (ایک دوسرے سے آگے نہ نکلے) */
      #ch173-doc .ch173-sho-flex{
        display:flex; direction:rtl; align-items:stretch; gap:0; margin-top:6px;
      }
      #ch173-doc .ch173-sho-flex > .sho-col{ min-width:0; box-sizing:border-box; }
      /* تفصیل کاغذات کا خانہ SHO لائن کے دائیں کنارے سے 1cm پہلے تک پھیلتا ہے */
      #ch173-doc .ch173-sho-flex > .sho-papers{ flex:1 1 auto; }
      /* SHO کالم — چوڑائی صرف اپنی لائن جتنی (شرنک-ٹو-فٹ) */
      #ch173-doc .ch173-sho-flex > .sho-cell{ flex:0 0 auto; }

      /* دائیں کالم — تفصیل کاغذات (عنوان) + اس کے نیچے لکھنے کی جگہ */
      #ch173-doc .sho-papers{ text-align:right; padding:4px 6px 0 0; }
      #ch173-doc .sho-papers-head{
        font-weight:700; text-decoration:underline; white-space:nowrap;
        font-size:14pt; line-height:1.25; margin:0;
      }
      /* کرسر یہاں بلنک کرتا ہے — ڈیٹا عنوان کے نیچے سے شروع ہوتا ہے */
      #ch173-doc .sho-papers-body{
        font-size:14pt; line-height:1.25; text-align:right; white-space:pre-wrap;
        outline:1px dashed rgba(120,120,120,0.35); padding:3px 4px; margin-top:4px;
        min-height:22px; overflow-wrap:break-word;
      }
      #ch173-doc .sho-papers-body:empty::before{
        content:'یہاں کاغذات کی تفصیل لکھیں'; color:#bbb; font-size:12pt;
      }

      /* بائیں کالم — SHO/تاریخ: ایک اوپر، ایک نیچے */
      #ch173-doc .sho-cell{
        display:flex; flex-direction:column; justify-content:space-between;
        min-height:42mm;
      }
      /* align-self:flex-end → RTL میں بائیں کنارے پر (جیسے اصل فارم میں) */
      #ch173-doc .sho-block{ align-self:flex-end; }
      /* SHO ki line ko aik satar neeche laane wali khali jagah */
      #ch173-doc .sho-spacer{ height:1.6em; }
      #ch173-doc .sho-cell-row{
        outline:1px dashed rgba(120,120,120,0.35); padding:3px 6px; line-height:1.25;
        min-height:20px; margin:0; font-size:14pt; text-align:right; white-space:nowrap;
        font-weight:700;
      }
      /* تاریخ bold nahi — sirf SHO ki line */
      #ch173-doc .sho-cell-date{ font-weight:normal; }
      #ch173-doc .sho-cell-date{ font-size:14pt; color:#333; cursor:pointer; text-align:center; }
      #ch173-doc .sho-cell-date:empty::before{ content:'تاریخ…'; color:#aaa; }
      /* SHO ka naam set na ho to saaf hidayat (اوزار → SHO se set karein) */
      #ch173-doc .sho-cell-row:empty::before{
        content:'⚠ اوزار → SHO سے نام درج کریں'; color:#c00; font-size:11pt; font-weight:normal;
      }
      @media print{ #ch173-doc .sho-cell-row:empty::before{ content:''; } }
      @media print{
        #ch173-doc .sho-papers-body{ outline:none !important; }
        #ch173-doc .sho-papers-body:empty::before{ content:''; }
        #ch173-doc .sho-cell-row{ outline:none !important; }
        #ch173-doc .sho-cell-date:empty::before{ content:''; }
      }
      /* Izafi khane screen par nazar aayen (kahan likhna hai pata chale) —
         print mein yeh nishan nahi aata */
      /* ملزمان chunne wala chhota button */
      #ch173-doc .acc-pick{
        position:absolute; top:2px; left:2px; z-index:7;
        width:20px; height:20px; line-height:1; padding:0;
        border:1px solid var(--border,#999); border-radius:4px;
        background:#eef6ff; color:#0369a1; cursor:pointer; font-size:12px;
      }
      /* Column 7 — normal RTL (khadi nahi) */
      #ch173-doc .ch173-table td.normcell{ padding:0; vertical-align:top; position:relative; }
      #ch173-doc .normwrap{
        position:absolute; inset:0;      /* khane ke barabar — unchai pukhta */
        padding:5px; box-sizing:border-box;
        font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
        direction:rtl; text-align:justify; text-align-last:right;
        outline:none; line-height:1.15; font-size:14pt;
        overflow-wrap:break-word; word-wrap:break-word;
        overflow:hidden;   /* scroll NAHI — jo na samaye woh neeche chala jaye */
      }
      /* Har paragraph ki aakhri line bhi dayen (beech mein nahi) */
      #ch173-doc .normwrap p, #ch173-doc .normwrap div{ text-align:justify; text-align-last:right; }
      /* Paste kiya hua matn apna font saath na laye */
      #ch173-doc .normwrap *{ font-family:inherit !important; }
      #ch173-doc .ch173-cont:empty::before{
        content:'تسلسل — جو تحریر اوپر خانوں میں نہ سما سکے وہ یہاں لکھیں';
        color:#aaa; font-size:12pt;
      }
      /* Table ke NEECHE tasalsul — table se BILKUL chipka hua (koi gap nahi) */
      #ch173-doc .ch173-cont{
        margin:0 !important; border:none !important; padding:0 5px !important;
        min-height:0; direction:rtl; text-align:justify; text-align-last:right;
        font-size:14pt; line-height:1.15; outline:none;
        overflow-wrap:break-word; word-wrap:break-word; white-space:pre-wrap;
      }
      #ch173-doc .ch173-cont:empty{ min-height:0; padding:0 !important; }
      #ch173-doc .rotinner{
        width:auto; max-width:100%; height:100%; box-sizing:border-box; padding:4px 6px;
        writing-mode:vertical-rl; -webkit-writing-mode:vertical-rl;
        direction:rtl; text-align:start; outline:none; unicode-bidi:plaintext;
        line-height:1.2; overflow-wrap:break-word; white-space:pre-wrap;
        overflow:hidden; font-size:14pt;
      }
      /* Column 7 — normal, RTL, justified */
      #ch173-doc .hwrap{
        writing-mode:horizontal-tb; transform:none;
        width:100%; height:100%; padding:5px; box-sizing:border-box;
        direction:rtl; text-align:justify; outline:none;
      }

      /* Khadi likhayi — NEECHE se OOPER (earth → sky) */
      /* Header ki khadi likhayi — Ascending (neeche se ooper) */
      #ch173-doc .vtxt{
        display:inline-block;
        writing-mode:vertical-rl; -webkit-writing-mode:vertical-rl; -ms-writing-mode:tb-rl;
        transform:rotate(180deg); -webkit-transform:rotate(180deg);
        white-space:nowrap; line-height:1.2; text-align:center;
      }
      #ch173-doc th.vcell{ vertical-align:middle; padding:0; text-align:center; height:150px; }
      /* Header ki khadi likhayi — data khanon jaisa hi wrapper (Ascending) */
      /* مال قبضہ پولیس — lakeeron se hat kar, khane ke beech mein */
      #ch173-doc .rothead{ text-align:center !important; white-space:normal;
        padding:8px 6px; font-size:12pt; line-height:1.3; }

      #ch173-doc th.hcell{ vertical-align:middle; text-align:center; direction:rtl; white-space:normal; }

      /* Bahar ke kinare khule — pehla column dayen se, aakhri bayen se */
      #ch173-doc .ch173-table thead tr:first-child th:first-child{ border-right:none; }
      #ch173-doc .ch173-table thead tr:first-child th:last-child{ border-left:none; }
      /* Data row (row 3): dono kinare khule — dayen bhi, bayen bhi */
      #ch173-doc .ch173-table tbody tr > td:first-child{ border-right:0 !important; }
      #ch173-doc .ch173-table tbody tr > td:last-child{ border-left:0 !important; }
      #ch173-doc .ch173-table tbody tr > td:nth-last-child(1){ border-left:0 !important; }
      /* Row 2 ki bayen aakhri line hataayi */
      #ch173-doc .ch173-table thead tr:nth-child(2) th:last-child{ border-left:none; }
      /* Neeche wali lakeer nazar NAHI aati, lekin wahan se unchai badal sakte
         hain (MS Word jaisa) — grip hover par halka nishan dikhata hai */
      #ch173-doc .ch173-table tbody td{ border-bottom:0 !important; }

      /* MS Word jaisi column resize — header par drag handle */
      #ch173-doc .colgrip{
        position:absolute; top:0; left:-3px; width:7px; height:100%;
        cursor:col-resize; user-select:none; z-index:5;
      }
      /* Neeche se unchai badalne wali grip (row height) */
      /* Neeche se unchai badalne wali grip — khane ke ANDAR (kabhi kat na jaye) */
      #ch173-doc .rowgrip{
        position:absolute; bottom:0; left:0; width:100%; height:12px;
        cursor:row-resize; user-select:none; z-index:20;
      }
      #ch173-doc .rowgrip:hover{ background:rgba(56,189,248,0.45); }
      #ch173-doc .colgrip:hover{ background:rgba(56,189,248,0.35); }
      @media print{
        .no-print,.doc-toolbar,.editor-toolbar,button,select{ display:none !important; }
        .ch173-table tbody td{ border-bottom:0 !important; }
        .rotcell{ position:relative; padding:0; overflow:hidden; }
        .cellbox{ position:relative; width:100%; height:100%; overflow:hidden; }
        .rotclip{ position:absolute; inset:0; overflow:hidden;
          display:flex; justify-content:center; align-items:stretch; }
        .ch173-table, .ch173-table tbody, .ch173-table tbody tr,
        .ch173-table tbody td, .ch173-table tbody th,
        .ch173-table tr:last-child td, .ch173-table tr:last-child th{
          border-bottom:0 !important; border-bottom-width:0 !important;
          border-bottom-style:none !important; border-bottom-color:transparent !important;
        }
        .hcell-td{ padding:0; vertical-align:top; }
        .hinner{ width:100%; height:100%; padding:5px; box-sizing:border-box;
          direction:rtl; text-align:justify; line-height:1.15; overflow:hidden; overflow-wrap:break-word; white-space:pre-wrap; }
        .ch173-cont{ direction:rtl; text-align:justify; text-align-last:right;
          font-size:14pt; line-height:1.15; padding:6px 4px; overflow-wrap:break-word;
          border:none !important; white-space:pre-wrap; }
        /* Matn safhe se zyada ho to khud agle safhe (back side) par chala jaye */
        .ch173-cont{ page-break-inside:auto; break-inside:auto; }
        .acc-pick{ display:none !important; }
        .ch173-table td.normcell{ padding:0; vertical-align:top; position:relative; }
        .normwrap{ position:absolute; inset:0; padding:5px; box-sizing:border-box;
          font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
          direction:rtl; text-align:justify; line-height:1.15; overflow-wrap:break-word; }
        .ch173-cont{ margin:0 !important; border:none !important; padding:0 5px !important;
          min-height:0; direction:rtl; text-align:justify; text-align-last:right;
          font-size:14pt; line-height:1.15; overflow-wrap:break-word; white-space:pre-wrap; }
        .ch173-cont:empty{ display:none; }
        .rotinner{ width:auto; max-width:100%; height:100%; box-sizing:border-box; padding:4px;
          writing-mode:vertical-rl; -webkit-writing-mode:vertical-rl;
          direction:rtl; text-align:start; line-height:1.2; unicode-bidi:plaintext;
          overflow-wrap:break-word; white-space:pre-wrap; overflow:hidden; font-size:14pt; }
        .rothead{ text-align:center !important; white-space:normal; }
        .colgrip,.rowgrip{ display:none !important; }
        .colgrip,.rowgrip{ display:none !important; }
        #ch173-doc{ box-shadow:none !important; border-radius:0 !important; margin:0 !important; padding:0 !important; max-width:none !important; }
      }
    </style>
    <div style="display:flex;flex-direction:column;height:100%;direction:rtl;">
      <div class="no-print" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);flex-wrap:wrap;background:var(--bg-secondary);">
        <select id="r173-type-sel" onchange="_r173Pick(this.value)" style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;">
          ${R173_TYPES.map(t => `<option value="${t.id}" ${t.id===_r173Type?'selected':''}>${t.name}</option>`).join('')}
        </select>
        <select id="ch173-head-sel" onchange="_r173SetHead(this.value)" title="ہیڈ / عنوان"
          style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);
                 color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;max-width:260px;">
          <option value="">— ہیڈ منتخب کریں —</option>
          ${(['ikhraj','adampata'].includes(_r173Type) ? R173_IKHRAJ_HEADS : R173_HEADS)
            .map(h => `<option value="${esc(h)}" ${_r173Head===h?'selected':''}>${esc(h)}</option>`).join('')}
        </select>
        <select id="ch173-ver-sel" onchange="_ch173SetVersion(this.value)" title="ورژن"
          style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;">
          <option value="fir" ${_ch173Version==='fir'?'selected':''}>FIR</option>
          ${(typeof caseHasCross==='function' && caseHasCross(c))
            ? `<option value="cross_version" ${_ch173Version==='cross_version'?'selected':''}>کراس ورژن</option>` : ''}
        </select>
        <select id="ch173-paper-sel" onchange="_ch173SetPaper(this.value)" title="کاغذ کا سائز"
          style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);
                 color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;">
          <option value="legal" ${_ch173Paper==='legal'?'selected':''}>لیگل (8.5×13)</option>
          <option value="a4"    ${_ch173Paper==='a4'   ?'selected':''}>A4 (8.27×11.7)</option>
        </select>
        <span style="font-size:11px;color:var(--text-muted);">↔ کالم کی لکیر کو پکڑ کر چوڑائی بدلیں</span>
        <div style="margin-right:auto;display:flex;gap:6px;">
          <button onmousedown="event.preventDefault()" onclick="_ch173Fmt('bold')" title="بولڈ" style="${_chBtn()}font-weight:900;">B</button>
          <button onmousedown="event.preventDefault()" onclick="_ch173Fmt('italic')" title="ترچھا" style="${_chBtn()}font-style:italic;">I</button>
          <button onmousedown="event.preventDefault()" onclick="_ch173Fmt('underline')" title="انڈر لائن" style="${_chBtn()}text-decoration:underline;">U</button>
          <span style="width:1px;height:22px;background:var(--border,#ccc);margin:0 4px;"></span>
          <button onmousedown="event.preventDefault()" onclick="_ch173Fmt('justifyRight')" title="دائیں سیدھ" style="${_chBtn()}">⇥</button>
          <button onmousedown="event.preventDefault()" onclick="_ch173Fmt('justifyCenter')" title="درمیان" style="${_chBtn()}">⇔</button>
          <button onmousedown="event.preventDefault()" onclick="_ch173Fmt('justifyLeft')" title="بائیں سیدھ" style="${_chBtn()}">⇤</button>
          <button onmousedown="event.preventDefault()" onclick="_ch173Fmt('justifyFull')" title="دونوں طرف برابر (Justify)" style="${_chBtn()}">☰</button>
          <span style="width:1px;height:22px;background:var(--border,#ccc);margin:0 4px;"></span>
          <button onmousedown="event.preventDefault()" onclick="_ch173Fmt('insertUnorderedList')" title="نقطہ دار فہرست" style="${_chBtn()}">•</button>
          <button onmousedown="event.preventDefault()" onclick="_ch173Fmt('insertOrderedList')" title="نمبر والی فہرست" style="${_chBtn()}font-size:11px;">1.</button>
          <button onmousedown="event.preventDefault()" onclick="_ch173ClearFmt()" title="فارمیٹ ختم کریں" style="${_chBtn()}">🧹</button>
          <span style="width:1px;height:22px;background:var(--border,#ccc);margin:0 4px;"></span>
          <button id="ch173-brush-btn" onmousedown="event.preventDefault()"
            onclick="_ch173BrushClick(false)" ondblclick="_ch173BrushClick(true)"
            title="فارمیٹ پینٹر — ایک کلک: ایک بار، ڈبل کلک: بار بار" style="${_chBtn()}">🖌</button>
          <select id="ch173-font-sel" onchange="_ch173SetFont(this.value)" title="فونٹ سائز"
            style="height:28px;border:1px solid var(--border,#ccc);border-radius:6px;background:var(--bg-card,#fff);color:var(--text-primary,#111);font-size:13px;padding:0 6px;margin:0 1px;cursor:pointer;">
            ${R173_FONT_SIZES.map(s => `<option value="${s}" ${String(s)===String(_ch173DocFont(bs))?'selected':''}>${s}</option>`).join('')}
          </select>
          <button onmousedown="event.preventDefault()" onclick="_ch173Fmt('undo')" title="واپس (Undo)" style="${_chBtn()}">↶</button>
          <button onmousedown="event.preventDefault()" onclick="_ch173Fmt('redo')" title="دوبارہ (Redo)" style="${_chBtn()}">↷</button>
          <button class="btn btn-primary btn-sm dio-modbtn" onclick="_saveR173()">💾 محفوظ کریں</button>
          <button class="btn btn-secondary btn-sm dio-modbtn" onclick="_printR173()">🖨️ پرنٹ کریں</button>
        </div>
      </div>
      <div style="flex:1;overflow:auto;min-height:0;padding:16px;background:var(--bg-tertiary);">
        <div id="ch173-doc" style="width:100%;max-width:none;min-height:${_ch173Paper==='a4'?'11.7in':'13in'};margin:0 auto;
             padding:1cm;
             background:#fff;box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:4px;
             line-height:1.4;box-sizing:border-box;">

          <div class="ch173-title-row"><span></span><span class="form-no">FORM No. 25.56(1)</span><span></span></div>
          <div class="ch173-title-row" style="margin:2px 0 8px;">
            <span class="tt-right">تھانہ ${esc(o.station||'')}</span>
            <span class="tt-mid">${esc(_ch173Heading(_r173Type, typeName))}</span>
            <span class="tt-left">ضلع ${esc(o.district||'')}</span>
          </div>

          <div class="ch173-caseline">
            <span>مقدمہ نمبر <span class="fl" contenteditable="true" data-k="cl_fir">${bs.cl_fir !== undefined ? sanitizeHtml(bs.cl_fir) : esc(c.fir_number||'')}</span></span>
            <span>مورخہ <span class="fl" contenteditable="true" data-k="cl_date">${bs.cl_date !== undefined ? sanitizeHtml(bs.cl_date) : esc(formatDate(c.fir_date)||'')}</span></span>
            <span>جرم <span class="fl fl-lg" contenteditable="true" data-k="cl_jurm">${bs.cl_jurm !== undefined ? sanitizeHtml(bs.cl_jurm) : esc(_ch173JurmParts(c.section_of_law).body)}</span> <span class="fl fl-suf" contenteditable="true" data-k="cl_jurm_suf">${bs.cl_jurm_suf !== undefined ? sanitizeHtml(bs.cl_jurm_suf) : esc(_ch173JurmParts(c.section_of_law).suffix)}</span></span>
          </div>

          <table class="ch173-table" id="ch173-table">
            <colgroup>
              ${W.map(w => `<col style="width:${w}%">`).join('')}
            </colgroup>
            <thead>
              <tr>
                <th rowspan="2">نام و پتہ مدعی ومستغیث</th>
                <th rowspan="2">ملزمان جو گرفتارنہ ہوئے</th>
                <th colspan="2">ملزمان</th>
                <th rowspan="2" class="vcell rotcell"><div class="cellbox"><div class="rotclip"><div class="rotinner rothead">مال قبضہ پولیس</div></div></div></th>
                <th rowspan="2">تفصیل شہادت</th>
                <th rowspan="2">مختصر حالات مقدمہ معہ جرم مندرجہ بالا</th>
              </tr>
              <tr>
                <th class="hcell">زیر حراست</th>
                <th class="hcell">برضمانت</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="rotcell"><div class="cellbox"><div class="rotclip"><div class="rotinner" contenteditable="true" data-k="madai">${bs.madai !== undefined ? sanitizeHtml(bs.madai) : esc(_ch173Version==='cross_version' ? (c.cross_complainant||c.cross_complainant_name||'') : (c.complainant||c.complainant_name||''))}</div></div></div></td>
                <td class="rotcell"><div class="cellbox"><div class="rotclip"><button class="acc-pick no-print" onclick="_ch173AccPicker(event,'ghair_giraftar')" title="ملزمان منتخب کریں">▾</button><div class="rotinner" contenteditable="true" data-k="ghair_giraftar">${bv('ghair_giraftar')}</div></div></div></td>
                <td class="rotcell"><div class="cellbox"><div class="rotclip"><button class="acc-pick no-print" onclick="_ch173AccPicker(event,'zer_hirasat')" title="ملزمان منتخب کریں">▾</button><div class="rotinner" contenteditable="true" data-k="zer_hirasat">${bv('zer_hirasat')}</div></div></div></td>
                <td class="rotcell"><div class="cellbox"><div class="rotclip"><button class="acc-pick no-print" onclick="_ch173AccPicker(event,'bar_zamanat')" title="ملزمان منتخب کریں">▾</button><div class="rotinner" contenteditable="true" data-k="bar_zamanat">${bv('bar_zamanat')}</div></div></div></td>
                <td class="rotcell"><div class="cellbox"><div class="rotclip"><div class="rotinner" contenteditable="true" data-k="mal_qabza">${bv('mal_qabza')}</div></div></div></td>
                <td class="rotcell"><div class="cellbox"><div class="rotclip"><div class="rotinner" contenteditable="true" data-k="shahadat">${bs.shahadat !== undefined ? sanitizeHtml(bs.shahadat) : esc(_ch173WitnessText())}</div></div></div></td>
                <td class="normcell"><div class="normwrap" contenteditable="true" data-mic="true" data-k="halaat">${bv('halaat')}</div></td>
              </tr>
            </tbody>
          </table>

          <!-- خانہ 1: باقی متن (اوپر والے کالم سے خود آتا ہے) — تسلسل/overflow -->
          <div class="ch173-cont" contenteditable="true" data-k="cont_text">${bv('cont_text')}</div>

          <!-- اختتامی خانہ — 2 برابر کالم (flex)
               دائیں: تفصیل کاغذات + لکھنے کی جگہ | بائیں: SHO/تاریخ (اوپر اور نیچے)
               دونوں کالم ہمیشہ برابر چوڑے، اور ایک ساتھ ہی نیچے بڑھتے ہیں -->
          <div class="ch173-sho-flex">
            <div class="sho-col sho-papers">
              <div class="sho-papers-head">تفصیل کاغذات</div>
              <div class="sho-papers-body" contenteditable="true" data-k="papers_body">${bv('papers_body')}</div>
            </div>
            <div class="sho-col sho-cell">
              <div class="sho-block">
                <!-- خالی سطر — SHO کی لائن "تفصیل کاغذات" کے برابر نہ آئے،
                     بلکہ ایک سطر نیچے (جہاں پہلے تاریخ تھی) اور تاریخ اُس کے نیچے -->
                <div class="sho-spacer"></div>
                <div class="sho-cell-row" contenteditable="true" data-k="sho_line2">${bs.sho_line2 !== undefined ? sanitizeHtml(bs.sho_line2) : (bs.sho_line !== undefined ? sanitizeHtml(bs.sho_line) : esc(_ch173ShoLine(o)))}</div>
                <div class="sho-cell-row sho-cell-date" contenteditable="true" data-k="sho_date2"
                     onclick="_ch173PickDate(this)" title="تاریخ ڈالنے کے لیے کلک کریں">${bs.sho_date2 !== undefined ? sanitizeHtml(bs.sho_date2) : (bs.sho_date !== undefined ? sanitizeHtml(bs.sho_date) : esc(_ch173Today()))}</div>
              </div>
              <div class="sho-block">
                <div class="sho-cell-row" contenteditable="true" data-k="sho_line5">${bs.sho_line5 !== undefined ? sanitizeHtml(bs.sho_line5) : esc(_ch173ShoLine(o))}</div>
                <div class="sho-cell-row sho-cell-date" contenteditable="true" data-k="sho_date5"
                     onclick="_ch173PickDate(this)" title="تاریخ ڈالنے کے لیے کلک کریں">${bs.sho_date5 !== undefined ? sanitizeHtml(bs.sho_date5) : esc(_ch173Today())}</div>
              </div>
            </div>
          </div>

          <input type="hidden" data-k="doc_font" value="${esc(String(_ch173DocFont(bs)))}">

        </div>
      </div>
    </div>`;
    _ch173FullPage(area);
    _ch173BlockFloatBar();
    setTimeout(() => {
      _ch173FullPage(area);
      _ch173MakeResizable();
      _ch173SizeRotated();
      _ch173BindKeys();
      _ch173BindOverflow();
      _ch173Overflow();
      window.addEventListener('resize', _ch173SizeRotated);
      // Mehfooz shuda row height wapas lagao
      try {
        const rh = bs.row_height;
        if (rh) document.querySelectorAll('#ch173-table tbody td').forEach(td => td.style.height = rh);
        _ch173SizeRotated();
      } catch(_) {}
      // Mehfooz shuda فونٹ سائز wapas lagao
      try {
        const df = _ch173DocFont(bs);
        if (df && df !== R173_FONT_DEFAULT) _ch173FontToDoc(df);
      } catch(_) {}
      // Cursor ke mutabiq dropdown khud badalta rahe (MS Word jaisa)
      try {
        if (!window._ch173FontSelBound) {
          window._ch173FontSelBound = true;
          document.addEventListener('selectionchange', _ch173SyncFontSel);
        }
      } catch(_) {}
      // Format painter — naye safhe par band halat se shuru
      try { _ch173BrushOff(); _ch173BindBrush(); } catch(_) {}
    }, 60);
    if (typeof applyMicButtons === 'function') setTimeout(() => applyMicButtons(area), 80);
    return;
  }

  area.innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;direction:rtl;">
    <!-- Toolbar -->
    <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);flex-wrap:wrap;background:var(--bg-secondary);">
      <select id="r173-type-sel" onchange="_r173Pick(this.value)" style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;">
        ${R173_TYPES.map(t => `<option value="${t.id}" ${t.id===_r173Type?'selected':''}>${t.name}</option>`).join('')}
      </select>
      ${isTatima ? `
      <select id="r173-sub-sel" onchange="_r173PickSub(this.value)" style="padding:6px 10px;border:1px solid var(--amber);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;">
        ${R173_TATIMA_SUBS.map(s => `<option value="${s.id}" ${s.id===_r173Subtype?'selected':''}>${s.name}</option>`).join('')}
      </select>` : ''}
      <div style="margin-right:auto;display:flex;gap:6px;">
        <button class="btn btn-primary btn-sm dio-modbtn" onclick="_saveR173()">💾 محفوظ کریں</button>
        <button class="btn btn-secondary btn-sm dio-modbtn" onclick="_printR173()">🖨️ پرنٹ کریں</button>
      </div>
    </div>

    <!-- Form -->
    <div style="flex:1;overflow-y:auto;padding:16px;background:var(--bg-tertiary);">
      <div id="r173-doc" style="max-width:210mm;margin:0 auto;padding:16mm;background:#fff;color:#111;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;font-size:14px;line-height:1.9;direction:rtl;box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:4px;">

        <!-- Header -->
        <div style="text-align:center;font-size:12px;color:#555;">فارم نمبر 25.56(1)</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin:8px 0;">
          <span style="font-weight:bold;text-decoration:underline;">تھانہ ${o.station||'صدر ملتان'}</span>
          <span style="font-weight:bold;text-decoration:underline;font-size:17px;">${isClosing ? `فارم رپورٹ اختتامی بصیغہ ${isIkhraj?'اخراج':'عدم پتہ'} زیر دفعہ 173 ض ف` : `فارم رپورٹ ${typeName} زیر دفعہ 173 ض ف`}</span>
          <span style="font-weight:bold;text-decoration:underline;">ضلع ${o.district||'ملتان'}</span>
        </div>

        <!-- Case info -->
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:10px;">
          <tr>
            <td style="border:1px solid #999;padding:6px;"><b>مقدمہ نمبر:</b> ${c.fir_number||''}</td>
            <td style="border:1px solid #999;padding:6px;"><b>مورخہ:</b> ${c.fir_date||''}</td>
            <td style="border:1px solid #999;padding:6px;"><b>جرم:</b> ${c.section_of_law||''} ${c.offence_type||''}</td>
            <td style="border:1px solid #999;padding:6px;"><b>تھانہ:</b> ${o.station||''}</td>
          </tr>
        </table>

        <!-- Main data table (NOT in closing reports — اخراج/عدم پتہ use 3-col table) -->
        ${!isClosing ? `
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr style="background:#f0f0f0;">
            <th style="border:1px solid #999;padding:6px;">نام و پتہ مدعی و مستغیث</th>
            <th style="border:1px solid #999;padding:6px;">ملزمان جو گرفتار نہ ہوئے</th>
            <th style="border:1px solid #999;padding:6px;">ملزمان زیر حراست</th>
            <th style="border:1px solid #999;padding:6px;">ملزمان بر ضمانت</th>
            <th style="border:1px solid #999;padding:6px;">مال قبضہ پولیس</th>
            <th style="border:1px solid #999;padding:6px;">تفصیل شہادت</th>
          </tr>
          <tr>
            <td contenteditable="true" data-k="madai" style="border:1px solid #999;padding:8px;vertical-align:top;">${v('madai')}</td>
            <td contenteditable="true" data-k="ghair_giraftar" style="border:1px solid #999;padding:8px;vertical-align:top;">${v('ghair_giraftar')}</td>
            <td contenteditable="true" data-k="zer_hirasat" style="border:1px solid #999;padding:8px;vertical-align:top;">${v('zer_hirasat')}</td>
            <td contenteditable="true" data-k="bar_zamanat" style="border:1px solid #999;padding:8px;vertical-align:top;">${v('bar_zamanat')}</td>
            <td contenteditable="true" data-k="mal_qabza" style="border:1px solid #999;padding:8px;vertical-align:top;">${v('mal_qabza')}</td>
            <td contenteditable="true" data-k="shahadat" style="border:1px solid #999;padding:8px;vertical-align:top;">${v('shahadat')}</td>
          </tr>
        </table>` : ''}

        <!-- مختصر حالات مقدمہ (separate — NOT for closing reports) -->
        ${!isClosing ? `
        <div style="margin-top:12px;font-weight:700;">مختصر حالات مقدمہ معہ جرم:</div>
        <div contenteditable="true" data-mic="true" data-k="halaat" data-ph="یہاں پر مختصر حالات لکھیں" style="border:1px solid #999;padding:10px;min-height:120px;text-align:justify;margin-top:4px;${v('halaat', boiler)?'':'color:#999;'}" onfocus="if(this.dataset.ph&&!this.innerText.trim()){this.style.color='#000';}" oninput="this.style.color=this.innerText.trim()?'#000':'#999';">${v('halaat', boiler)}</div>
        <style>[data-k="halaat"]:empty:before{content:attr(data-ph);color:#999;}</style>` : ''}

        ${isTatima ? `
        <!-- Tatima: رزلٹ نمبر + checkboxes -->
        <div style="margin-top:10px;">رزلٹ نمبر: <span contenteditable="true" data-k="result_no" style="border-bottom:1px solid #999;min-width:120px;display:inline-block;">${v('result_no')}</span></div>
        <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:8px;font-size:13px;">
          <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" data-pk="t_form" ${v('t_form')?'checked':''}> فارم ہذا/یک</label>
          <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" data-pk="t_result" ${v('t_result')?'checked':''}> اصل رزلٹ نمبری/یک</label>
          <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" data-pk="t_fir" ${v('t_fir')?'checked':''}> نقل FIR/یک</label>
        </div>` : ''}

        ${isClosing ? `
        <!-- Closing report 3-column 8-row table (اخراج / عدم پتہ) -->
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:12px;">
          <tr style="background:#f0f0f0;">
            <th style="border:1px solid #000;padding:6px;width:8%;">نمبر شمار</th>
            <th style="border:1px solid #000;padding:6px;width:30%;">تفصیل</th>
            <th style="border:1px solid #000;padding:6px;width:62%;">قدر</th>
          </tr>
          ${(() => {
            const autoMadai = (c.complainant_name||'') + (c.complainant_address?(' ساکن '+c.complainant_address):'');
            const autoJurm  = (c.section_of_law||'') + ' ' + (c.offence_type||'');
            const rows = [
              ['madai_i','نام وپتہ مدعی و مستغیث', autoMadai],
              ['jurm_i','مختصر کیفیت جرم', autoJurm.trim()],
              ['masruqa_i','تفصیل مال مسروقہ اگر کوئی ہو',''],
              ['namzad_i','تفصیل ملزمان نامزد',''],
              ['giraftar_i','تفصیل ملزمان گرفتار شدہ',''],
              ['raha_i','تفصیل ملزمان رہا شدہ',''],
              ['baramad_i','تفصیل مال برآمدہ مقبوضہ پولیس','']
            ];
            return rows.map((r,i)=>{
              const val = v(r[0], r[2]);
              const bold = (val && String(val).trim()) ? 'font-weight:bold;' : '';
              return `<tr>
                <td style="border:1px solid #000;padding:6px;text-align:center;">${i+1}</td>
                <td style="border:1px solid #000;padding:6px;font-weight:600;">${r[1]}</td>
                <td contenteditable="true" data-k="${r[0]}" oninput="this.style.fontWeight=this.innerText.trim()?'bold':'normal';" style="border:1px solid #000;padding:6px;${bold}">${val}</td>
              </tr>`;
            }).join('');
          })()}
          <tr>
            <td style="border:1px solid #000;padding:8px;text-align:center;vertical-align:top;width:8%;font-weight:bold;">8</td>
            <td style="border:1px solid #000;padding:8px;font-weight:bold;text-align:right;vertical-align:top;width:30%;">مختصر حالات مقدمہ</td>
            <td style="border:1px solid #000;padding:8px;width:62%;">
              <div contenteditable="true" data-mic="true" data-k="halaat" data-ph="یہاں پر متن FIR، متن کراس ورژن، تفتیشی وجوہات ${isIkhraj?'اخراج':'عدم پتہ'} لکھیں" style="width:100%;box-sizing:border-box;min-height:120px;direction:rtl;text-align:justify;font-size:15px;${v('halaat')?'':'color:#999;'}" oninput="this.style.color=this.innerText.trim()?'#000':'#999';">${v('halaat')}</div>
            </td>
          </tr>
        </table>
        <style>[data-k="halaat"]:empty:before{content:attr(data-ph);color:#999;}</style>` : ''}

        <!-- تفصیل کاغذات -->
        ${isClosing ? (() => {
          const _sho = (typeof getSHOSignLine==='function') ? getSHOSignLine(o.station||'صدر ملتان') : '';
          const items6 = ['فارم ہذا','نقل FIR','اصل تحریر','نقشہ موقع','اطلاع نامہ مدعی','اصل ضمنی SHO'];
          return `
        <!-- Header row: top SHO (left) + heading (right), full-width line below -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin:16px 0 4px;">
          <div class="sho-signature-block-top" style="text-align:right;">
            <div class="sho-name-line" style="font-weight:${_sho?'bold':'normal'};font-size:14px;">${_sho}</div>
          </div>
          <div style="font-weight:bold;font-size:15px;">تفصیل کاغذات:</div>
        </div>
        <hr style="border:none;border-top:1px solid #000;margin:0 0 16px 0;">

        <!-- Items: one straight horizontal line, evenly spaced -->
        <div style="display:flex;flex-direction:row-reverse;justify-content:space-around;align-items:flex-start;margin:12px 0 40px;">
          ${items6.map((p,i)=>`
            <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
              <span style="font-size:14px;text-decoration:underline;">${p}</span>
              <input type="text" inputmode="numeric" pattern="[0-9]*" class="qita-input" data-k="paper_${i}" value="${v('paper_'+i)}" oninput="_r173Qita(this)"
                style="width:45px;border:none;border-bottom:1px solid #000;text-align:center;background:transparent;outline:none;font-size:13px;">
              <span class="qita-label" style="font-size:11px;min-height:14px;">${(() => { const n=parseInt(v('paper_'+i)); return n===1?'قطعہ':(n>1?'قطعات':''); })()}</span>
            </div>`).join('')}
        </div>

        <!-- Bottom SHO block (left): signature space → name → date -->
        <div class="sho-signature-block-bottom" style="text-align:right;margin-top:8px;min-width:220px;display:inline-block;">
          <div style="border-bottom:1px solid #000;min-height:50px;margin-bottom:6px;"></div>
          <div class="sho-name-line" style="font-weight:${_sho?'bold':'normal'};font-size:14px;">${_sho}</div>
          <div style="font-size:13px;margin-top:6px;">تاریخ: _______________</div>
        </div>`;
        })() : `
        <!-- تفصیل کاغذات (non-closing types) -->
        <div style="margin-top:14px;font-weight:700;text-align:right;">تفصیل کاغذات:</div>
        <div style="display:flex;flex-wrap:wrap;gap:16px;font-size:13px;justify-content:center;margin-top:8px;">
          ${['فارم ہذا','نقل FIR','اصل تحریر','فارم ریمانڈ','نقشہ موقع','اطلاع نامہ مدعی','اصل ضمنی SHO'].map((p,i)=>`
            <div style="display:inline-flex;flex-direction:column;align-items:center;margin:0 6px;">
              <span style="text-decoration:underline;">${p}</span>
              <input type="text" inputmode="numeric" pattern="[0-9]*" data-k="paper_${i}" value="${v('paper_'+i)}" oninput="_r173Qita(this)"
                style="width:45px;border:none;border-bottom:1px solid #000;text-align:center;background:transparent;margin-top:4px;font-size:14px;outline:none;">
              <span class="qita-label" style="font-size:11px;min-height:14px;color:#555;">${(() => { const n=parseInt(v('paper_'+i)); return n===1?'قطعہ':(n>1?'قطعات':''); })()}</span>
            </div>`).join('')}
        </div>`}

        <!-- SHO signature — non-closing types only (one line, SHO only) -->
        ${!isClosing ? `
        <div style="margin-top:24px;display:flex;justify-content:flex-start;">
          <div style="border-top:1px solid #333;padding-top:6px;display:flex;flex-direction:row-reverse;gap:8px;align-items:center;font-weight:bold;">
            ${(() => {
              const shoName = (typeof getSHOSignLine === 'function') ? getSHOSignLine(o.station||'صدر ملتان') : '';
              const val = v('sho_name', shoName);
              return `<span contenteditable="true" data-k="sho_name" oninput="this.style.fontWeight='bold';" style="min-width:120px;">${val}</span>`;
            })()}
          </div>
        </div>` : ''}
      </div>
    </div>
  </div>`;
  if (typeof applyMicButtons === 'function') setTimeout(() => applyMicButtons(area), 50);
}

// ── SAVE ──────────────────────────────────────────────────────
function _collectR173() {
  // Challan types (فارم 25.56(1)) — apna doc id hai
  const chDoc = document.getElementById('ch173-doc');
  if (chDoc && typeof R173_BLANK_TYPES !== 'undefined' && R173_BLANK_TYPES.includes(_r173Type)) {
    const d = {};
    chDoc.querySelectorAll('[data-k]').forEach(el => {
      d[el.dataset.k] = (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') ? el.value : el.innerHTML;
    });
    // MS Word jaisi drag se badli hui column widths bhi mehfooz
    try { const cw = _ch173ColWidths(); if (cw) d.col_widths = cw; } catch(_) {}
    try {
      const br = document.querySelector('#ch173-table tbody tr td');
      if (br && br.style.height) d.row_height = br.style.height;
    } catch(_) {}
    return d;
  }
  const doc = document.getElementById('r173-doc');
  if (!doc) return {};
  const data = {};
  doc.querySelectorAll('[data-k]').forEach(el => {
    data[el.dataset.k] = (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') ? el.value : el.innerHTML;
  });
  doc.querySelectorAll('[data-pk]').forEach(el => { data[el.dataset.pk] = el.checked; });
  return data;
}

async function _saveR173() {
  const form_data = _collectR173();
  // محفوظ فائلوں کی فہرست میں درج (نمبر شمار + تاریخ کے ساتھ)
  try {
    if (typeof dioRegisterSaved === 'function') {
      const tName = (R173_TYPES.find(t => t.id === _r173Type) || {}).name || 'رپورٹ 173';
      const verTxt = R173_BLANK_TYPES.includes(_r173Type)
        ? (_ch173Version === 'cross_version' ? ' (کراس ورژن)' : ' (FIR)') : '';
      dioRegisterSaved('report_173', tName + verTxt, {
        case_id: _r173CaseId, report_type: _r173Type,
        report_subtype: R173_BLANK_TYPES.includes(_r173Type) ? _ch173Version : (_r173Subtype || null)
      });
    }
  } catch(_) {}
  const isTatima = _r173Type === 'tatima_challan';
  let recKey = isTatima ? 'tatima_challan_' + _r173Subtype : _r173Type;
  // Challan types: FIR aur کراس ورژن ka data alag mehfooz
  if (R173_BLANK_TYPES.includes(_r173Type)) recKey = recKey + '::' + _ch173Version;
  _r173Records[recKey] = form_data;
  const rec = { case_id: _r173CaseId, report_type: _r173Type, form_data };
  if (R173_BLANK_TYPES.includes(_r173Type)) rec.report_subtype = _ch173Version;
  if (isTatima) rec.report_subtype = _r173Subtype;
  try {
    const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
    if (oid) rec.officer_id = oid;
    // ہیڈ/عنوان بھی محفوظ (ایک ہی قسم کے کئی چالان ہو سکتے ہیں)
    form_data.head = _r173Head || form_data.head || '';
    rec.form_data = form_data;
    if (!navigator.onLine) {
      // OFFLINE — mahfooz maqami tor par + qatar mein daal do (data zaya na ho)
      if (!_r173DocId) _r173DocId = 'local-' + Date.now();
      try {
        if (typeof offlineStore !== 'undefined' && offlineStore.enqueue) {
          await offlineStore.enqueue('report_173', String(_r173DocId).startsWith('local-') ? 'insert' : 'update',
            String(_r173DocId).startsWith('local-') ? rec : { id: _r173DocId, ...rec });
        }
      } catch(_) {}
      showToast('📴 آف لائن محفوظ — انٹرنیٹ آنے پر sync ہوگا', 'info');
    } else if (_r173DocId && !String(_r173DocId).startsWith('local-')) {
      // موجودہ چالان میں ترمیم
      await supabaseClient.from('report_173').update(rec).eq('id', _r173DocId);
    } else {
      // نیا چالان — الگ ریکارڈ
      const { data: ins } = await supabaseClient.from('report_173').insert(rec).select('id').single();
      if (ins && ins.id) _r173DocId = ins.id;
    }
    // مقامی فہرست تازہ کرو
    try {
      const idx = _r173Docs.findIndex(d => d.id === _r173DocId);
      const entry = { id: _r173DocId, type: _r173Type,
        subtype: isTatima ? _r173Subtype : (R173_BLANK_TYPES.includes(_r173Type) ? _ch173Version : ''),
        head: form_data.head, form_data,
        date: form_data.sho_date2 || form_data.sho_date || _ch173Today() };
      if (idx >= 0) _r173Docs[idx] = entry; else _r173Docs.push(entry);
    } catch(_) {}
    try { localStorage.setItem('dio_r173_'+_r173CaseId, JSON.stringify(_r173Records)); } catch(_) {}
    try { localStorage.setItem('dio_r173docs_'+_r173CaseId, JSON.stringify(_r173Docs)); } catch(_) {}
    // Save ke baad چالان ki FEHRIST kholo
    _r173Dirty = false;
    _r173ShowList = true;
    setTimeout(() => { try { _renderR173List(); } catch(_) {} }, 250);

    // P7: auto-update case status based on report type
    const statusMap = {
      mukammal: 'complete',
      namukammal: 'incomplete',
      ch512: 'challan512',
      interim: 'under',
      ikhraj: 'cancel',
      adampata: 'untrace',
      tatima_challan: 'complete'
    };
    const newStatus = statusMap[_r173Type];
    if (newStatus) {
      try {
        await supabaseClient.from('cases').update({ status: newStatus }).eq('id', _r173CaseId);
        try { localStorage.setItem('case_status_'+_r173CaseId, newStatus); } catch(_) {}
        showToast('✅ رپورٹ محفوظ — مقدمہ کی حالت اپ ڈیٹ ہو گئی', 'success');
      } catch(_) { showToast('✅ رپورٹ محفوظ ہو گئی', 'success'); }
    } else {
      showToast('✅ رپورٹ محفوظ ہو گئی', 'success');
    }
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

// ── PRINT (only the form) ─────────────────────────────────────
function _printR173() {
  // Challan types (فارم 25.56(1)) — apna doc + apni styles
  const chDoc = document.getElementById('ch173-doc');
  if (chDoc) {
    const chHtml = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title> </title>
      <style>
        /* ═══ PRINT CSS — SCREEN ke bilkul mutabiq (koi purani class nahi) ═══ */
        /* Pehla safha: kinare kam. Agle safhon par BAYEN taraf punch ki jagah
           taake sooraakh karne se alfaz na katen aur jild mein na chhupein. */
        /* A4 — kyunki print isi kaghaz par hota hai. Pehle 'legal' likha
           tha, jis se browser safhe ko sikor kar deta tha aur margins
           bade/ghair-barabar ho jate the. */
        /* Charon taraf BARABAR margin — har safhe par yaksan */
        @page{ size:${_ch173Paper === 'a4' ? 'A4 portrait' : '8.5in 13in'}; margin:1cm; }
        body{ font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; direction:rtl;
              line-height:1.4; color:#000; margin:0; }

        /* Unwan */
        .ch173-title-row{ position:relative; display:flex; align-items:baseline;
          justify-content:space-between; width:100%; min-height:1.6em; }
        .ch173-title-row > span{ white-space:nowrap; }
        .tt-right{ text-align:right; font-size:14pt; padding-right:1in; }
        .tt-left{ text-align:left; font-size:14pt; }
        .tt-mid, .form-no{ position:absolute; left:50%; transform:translateX(-50%); white-space:nowrap; }
        .tt-mid{ font-weight:bold; text-decoration:underline; font-size:20pt; }
        .form-no{ font-style:italic; font-size:12pt; direction:ltr; }

        /* مقدمہ نمبر / مورخہ / جرم */
        .ch173-caseline{ display:flex; gap:22px; align-items:baseline; font-size:14pt;
          margin:18px 0 16px 0; direction:rtl; flex-wrap:wrap; line-height:1.4; justify-content:center; }
        .ch173-caseline .fl{ display:inline-block; min-width:40px; border:none;
          text-align:right; font-weight:normal; unicode-bidi:isolate; direction:rtl; }
        .ch173-caseline .fl-lg{ min-width:60px; }
        .ch173-caseline .fl-suf{ min-width:24px; }

        /* Table */
        .ch173-table{ width:100%; border-collapse:collapse; table-layout:fixed; direction:rtl; }
        .ch173-table th, .ch173-table td{ border:1px solid #000; padding:2px 4px; text-align:center;
          white-space:normal; word-wrap:break-word; overflow-wrap:break-word; line-height:1.15; }
        .ch173-table thead th{ font-size:14pt; vertical-align:middle; line-height:1.15; font-weight:normal; }
        .ch173-table td{ font-size:14pt; vertical-align:top; height:170mm; padding:0; }
        th.hcell{ vertical-align:middle; text-align:center; direction:rtl; white-space:normal; }
        /* AHEM: unchai zaroori hai — warna cellbox ki height 0 ho jati thi
           aur 'مال قبضہ پولیس' print mein bilkul nazar hi nahi aata tha */
        th.vcell{ vertical-align:middle; padding:0; text-align:center; height:150px; }

        /* Khadi likhayi — SCREEN jaisa hi (cellbox + rotinner) */
        .cellbox{ position:relative; width:100%; height:100%; overflow:hidden; }
        .rotclip{ position:absolute; inset:0; overflow:hidden;
          display:flex; justify-content:center; align-items:stretch; }
        .rotinner{ width:auto; max-width:100%; height:100%; box-sizing:border-box; padding:4px;
          writing-mode:vertical-rl; -webkit-writing-mode:vertical-rl;
          direction:rtl; text-align:start; line-height:1.2; unicode-bidi:plaintext;
          overflow-wrap:break-word; white-space:pre-wrap; overflow:hidden; font-size:14pt; }
        .rothead{ text-align:center !important; }
        /* Column 7 — poora justified, aakhri line dayen (beech mein nahi) */
        .ch173-table td.normcell{ padding:0; vertical-align:top; position:relative; }
        .normwrap{ position:absolute; inset:0; padding:5px; box-sizing:border-box;
          font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
          direction:rtl; text-align:justify; text-align-last:right; line-height:1.15;
          font-size:14pt; overflow-wrap:break-word; word-wrap:break-word; }
        .normwrap p, .normwrap div{ text-align:justify; text-align-last:right; }
        /* SHO / تھانہ ki line bold */
        .sho-cell-row{ font-weight:700; }
        .sho-cell-date{ font-weight:normal; }

        /* Column 7 — normal RTL */
        .hcell-td{ padding:0; vertical-align:top; }
        .hinner{ width:100%; height:100%; padding:5px; box-sizing:border-box;
          direction:rtl; text-align:justify; text-align-last:right; line-height:1.15;
          overflow:hidden; overflow-wrap:break-word; white-space:pre-wrap; font-size:14pt; }

        /* Table ke neeche baqaya matn — koi kinari lakeer nahi */
        .ch173-cont{ direction:rtl; text-align:justify; text-align-last:right;
          font-size:14pt; line-height:1.15; padding:6px 4px; overflow-wrap:break-word;
          border:none !important; white-space:pre-wrap; }
        /* SHO دستخط خانہ — پرنٹ میں کوئی لکیر نہیں، صرف متن (SHO لائن + تاریخ) */
        /* اختتامی خانہ — 2 برابر کالم (SCREEN کے بالکل مطابق)۔
           align-items:stretch → دونوں کالم ہمیشہ ایک جتنے اونچے؛
           justify-content:space-between → نیچے والا SHO ہمیشہ سب سے نیچے،
           یعنی کالم 1 بڑھے تو نیچے والا SHO بھی اُسی کے ساتھ نیچے جاتا ہے۔ */
        .ch173-sho-flex{ display:flex; direction:rtl; align-items:stretch; gap:0; margin-top:6px; }
        .ch173-sho-flex > .sho-col{ min-width:0; box-sizing:border-box; }
        .ch173-sho-flex > .sho-papers{ flex:1 1 auto; }
        .ch173-sho-flex > .sho-cell{ flex:0 0 auto; }
        .sho-papers{ text-align:right; padding:4px 6px 0 0; }
        .sho-papers-head{ font-weight:700; text-decoration:underline; white-space:nowrap;
          font-size:14pt; line-height:1.25; margin:0; }
        .sho-papers-body{ font-size:14pt; line-height:1.25; text-align:right; white-space:pre-wrap;
          padding:3px 4px; margin-top:4px; overflow-wrap:break-word; }
        .sho-cell{ display:flex; flex-direction:column; justify-content:space-between; min-height:42mm; }
        .sho-block{ align-self:flex-end; }
        .sho-spacer{ height:1.6em; }
        .sho-cell-row{ padding:2px 6px; line-height:1.25; margin:0; min-height:20px;
          font-size:14pt; text-align:right; white-space:nowrap; font-weight:700; }
        .sho-cell-date{ font-size:14pt; color:#000; text-align:center; }
        /* یہ خانہ درمیان سے نہ ٹوٹے */
        .ch173-sho-flex{ page-break-inside:avoid; break-inside:avoid; }
        /* Matn safhe se zyada ho to khud agle safhe (back side) par chala jaye */
        .ch173-cont{ page-break-inside:auto; break-inside:auto; }

        /* Kinare khule: pehla column dayen se, aakhri bayen se */
        .ch173-table thead tr:first-child th:first-child{ border-right:none; }
        .ch173-table thead tr:first-child th:last-child{ border-left:none; }
        .ch173-table thead tr:nth-child(2) th:last-child{ border-left:none; }
        .ch173-table tbody tr > td:first-child{ border-right:0 !important; }
        .ch173-table tbody tr > td:last-child{ border-left:0 !important; }

        /* ═══ NEECHE wali lakeer — har haal mein KHATAM ═══ */
        .ch173-table, .ch173-table tbody, .ch173-table tbody tr,
        .ch173-table tbody td, .ch173-table tr:last-child td{
          border-bottom:0 !important; border-bottom-width:0 !important;
          border-bottom-style:none !important; border-bottom-color:transparent !important;
        }

        /* ═══ TABLE SIRF PEHLE SAFHE PAR ═══
           Pehle table agle safhe par bhi chhap jati thi (header dohra kar).
           Do wajahein: (1) browser <thead> ko har safhe par dohrata hai,
           (2) table beech se tootti thi. Ab dono band. */
        /* Header har safhe par na dohraye (yeh browser ka default rawaiya hai) */
        .ch173-table thead{ display:table-row-group !important; }
        /* Khane ki unchai itni ke unwan + table SAB aik hi safhe par sama jaye
           (A4 aur لیگل ke liye alag) */
        .ch173-table tbody td{
          height:${_ch173Paper === 'a4' ? '150mm' : '185mm'} !important;
          max-height:${_ch173Paper === 'a4' ? '150mm' : '185mm'} !important;
          overflow:hidden !important;
        }
        /* Khali izafi khane fazool safhe na banayen */
        .ch173-cont:empty{ display:none !important; }
        .sho-papers-body:empty{ min-height:0 !important; }
        /* Safhe ki lambai zabardasti na barhe */
        #ch173-doc{ height:auto !important; }
        .colgrip,.rowgrip,.acc-pick,.no-print,button,select{ display:none !important; }
        /* Print: poori chaudai istemal karo — koi fixed inch nahi, warna
           browser safha sikor kar dono taraf bari khali jagah chhor deta hai */
        /* Safhe ka margin @page se aata hai — doc ka apna padding SIFAR,
           warna margin dohra ho jata hai (isi liye kinare bade lagte the) */
        #ch173-doc{ width:100% !important; max-width:none !important;
          min-height:auto !important; padding:0 !important; margin:0 !important;
          box-shadow:none !important; border-radius:0 !important; }
        html, body{ margin:0 !important; padding:0 !important; }
        .dio-print-brand{ position:fixed; bottom:3mm; left:4mm; font-size:9px; color:#999; direction:ltr; }
      </style></head><body>${chDoc.innerHTML}<div class="dio-print-brand">Digital IO</div></body></html>`;
    // Print se pehle rotated khanon ki naap inline kar do (print iframe mein JS nahi chalta)
    try { if (typeof _ch173SizeRotated === 'function') _ch173SizeRotated(); } catch(_) {}
    if (typeof dioPrint === 'function') dioPrint(chHtml);
    else { const w = window.open('','_blank'); w.document.write(chHtml); w.document.close(); setTimeout(()=>w.print(),300); }
    return;
  }
  const doc = document.getElementById('r173-doc');
  if (!doc) return;
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title> </title>
    <style>@page{size:legal;margin:12mm}
      body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;direction:rtl;font-size:14px;line-height:1.9;color:#000;}
      table{border-collapse:collapse;width:100%;}td,th{border:1px solid #000;padding:6px;}
      .dio-print-brand{position:fixed;bottom:3mm;left:4mm;font-size:9px;color:#999;direction:ltr;}
    </style></head><body>${doc.innerHTML}<div class="dio-print-brand">Digital IO</div></body></html>`;
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('','_blank'); w.document.write(html); w.document.close(); setTimeout(()=>w.print(),300); }
}

// Open report 173 with a specific type pre-selected (from dropdown)
async function openReport173WithType(type, _fromTab) {
  // ═══ AHEM: misal-docs.js ka tab nizam 'r173:' se shuru hone wale id parhta
  //     hai (_dioRenderTabContent → docId.slice(5)). Is liye tab id hamesha
  //     'r173:<qism>' honi chahiye — warna tab badalte hi khali safha aata hai.
  //     Aur 'list' koi چالان ki qism NAHI, fehrist hai — pehle yeh قسم samajh
  //     kar ghalat فارم render hota tha, yani "fake report 173". ═══
  if (type === 'list') {
    if (!_fromTab && typeof _dioOpenDocTab === 'function') _dioOpenDocTab('r173:list');
    await openReport173(_misalCaseId || (typeof currentCaseId !== 'undefined' ? currentCaseId : null));
    _r173ShowList = true;
    _renderR173List();
    return;
  }
  // Har qism ka apna tab (misal-docs.js ke naam ki fehrist mein yeh mojood hain)
  if (!_fromTab && typeof _dioOpenDocTab === 'function') _dioOpenDocTab('r173:' + (type || 'mukammal'));
  await openReport173(_misalCaseId || (typeof currentCaseId !== 'undefined' ? currentCaseId : null));
  _r173Type = type || 'mukammal';
  // Fehrist ka nishan saaf — warna فارم ki bajaye fehrist khul jati hai
  _r173ShowList = false;
  _renderR173();
}

// Update قطعہ/قطعات label based on count
function _r173Qita(input) {
  if (!input) return;
  const label = input.parentElement && input.parentElement.querySelector('.qita-label');
  if (!label) return;
  const n = parseInt(input.value);
  label.textContent = n === 1 ? 'قطعہ' : (n > 1 ? 'قطعات' : '');
}

// ═══ MS Word jaisi column resize — header ki lakeer pakar kar chaudai badlein ═══
function _ch173MakeResizable() {
  const table = document.getElementById('ch173-table');
  if (!table || table._resizeReady) return;
  table._resizeReady = true;
  const cols = table.querySelectorAll('colgroup col');
  const headRow = table.querySelector('thead tr:first-child');
  if (!headRow) return;

  // Grip lagane ka common helper
  const addGrip = (cell, iA, iB) => {
    if (iB >= cols.length) return;              // aakhri column ke bayen kuch nahi
    const grip = document.createElement('div');
    grip.className = 'colgrip';
    grip.title = 'چوڑائی بدلنے کے لیے کھینچیں';
    cell.appendChild(grip);
    grip.addEventListener('mousedown', (e) => {
      e.preventDefault(); e.stopPropagation();
      const tW = table.offsetWidth;
      const startX = e.clientX;
      const wA = parseFloat(cols[iA].style.width) || (100/cols.length);
      const wB = parseFloat(cols[iB].style.width) || (100/cols.length);
      document.body.style.cursor = 'col-resize';
      const onMove = (ev) => {
        const dx = (startX - ev.clientX) / tW * 100;   // RTL
        let nA = wA + dx, nB = wB - dx;
        if (nA < 3 || nB < 3) return;
        cols[iA].style.width = nA.toFixed(2) + '%';
        cols[iB].style.width = nB.toFixed(2) + '%';
        if (typeof _ch173SizeRotated === 'function') _ch173SizeRotated();
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  };

  // Row 1 ke headers
  let ci = 0;
  headRow.querySelectorAll('th').forEach(th => {
    const span = parseInt(th.getAttribute('colspan') || '1');
    addGrip(th, ci + span - 1, ci + span);
    ci += span;
  });

  // Row 2 ke headers (زیر حراست / برضمانت) — yeh columns 3 aur 4 hain
  const row2 = table.querySelector('thead tr:nth-child(2)');
  if (row2) {
    const ths = row2.querySelectorAll('th');
    if (ths[0]) addGrip(ths[0], 2, 3);   // زیر حراست ↔ برضمانت
    if (ths[1]) addGrip(ths[1], 3, 4);   // برضمانت ↔ مال قبضہ
  }

  // ── NEECHE wali lakeer se unchai badalna (jaise ooper chaudai) ──
  // Grip HAR khane par lagate hain taake neeche ki poori lakeer par kahin se
  // bhi pakar kar kheencha ja sake.
  const bodyRow = table.querySelector('tbody tr');
  if (bodyRow) {
    bodyRow.querySelectorAll('td').forEach(td => {
      const rg = document.createElement('div');
      rg.className = 'rowgrip';
      rg.title = 'اونچائی بدلنے کے لیے کھینچیں';
      td.appendChild(rg);
      rg.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startY = e.clientY;
        const startH = bodyRow.offsetHeight;
        document.body.style.cursor = 'row-resize';
        const onMove = (ev) => {
          const nh = startH + (ev.clientY - startY);
          if (nh < 80) return;
          bodyRow.querySelectorAll('td').forEach(c => { c.style.height = nh + 'px'; });
          if (typeof _ch173SizeRotated === 'function') _ch173SizeRotated();
          if (typeof _ch173Overflow === 'function') _ch173Overflow();
        };
        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          document.body.style.cursor = '';
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }
}
window._ch173MakeResizable = _ch173MakeResizable;

// Column widths ko save/collect karne ke liye helper
function _ch173ColWidths() {
  const table = document.getElementById('ch173-table');
  if (!table) return null;
  return JSON.stringify([...table.querySelectorAll('colgroup col')]
    .map(c => parseFloat(c.style.width) || 0));
}

// ═══ Khadi likhayi ki naap set karo — box ko khane ke barabar banata hai ═══
// Tareeqa: andar ka box chaudai = khane ki UNCHAI, unchai = khane ki CHAUDAI.
// Phir 90° ghumane par woh bilkul khane ko bhar deta hai, aur RTL Urdu
// NEECHE se OOPER (Ascending) parhi jati hai.
function _ch173SizeRotated() {
  return;   // ab zaroorat nahi — layout poori tarah CSS se hai (print-safe)
  /* eslint-disable no-unreachable */
  document.querySelectorAll('#ch173-doc .rotcell').forEach(cell => {
    const clip  = cell.querySelector('.rotclip');
    const inner = cell.querySelector('.rotinner');
    if (!inner) return;
    const box = clip || cell;
    const w = box.clientWidth  || cell.clientWidth;
    const h = box.clientHeight || cell.clientHeight;
    if (!w || !h) return;
    inner.style.width  = h + 'px';   // chaudai = khane ki unchai
    inner.style.height = w + 'px';   // unchai  = khane ki chaudai
    inner.style.transform = 'translate(-50%,-50%) rotate(90deg)';
  });
}
window._ch173SizeRotated = _ch173SizeRotated;

// ═══ Khane se baqaya matn khud table ke NEECHE wali jagah mein ═══
// Usool: khana apni muqarrar unchai se bara nahi hota (table khud nahi phailta).
// Jo matn khane mein na samaye woh neeche wali jagah mein chala jata hai.
let _ch173OverflowTimer = null;
function _ch173Overflow() {
  const cell = document.querySelector('#ch173-table [data-k="halaat"]');
  const cont = document.querySelector('#ch173-doc [data-k="cont_text"]');
  if (!cell || !cont) return;

  const full = () => cell.scrollHeight > cell.clientHeight + 1;
  let guard = 0;

  // ── (a) Jo matn khane mein na samaye woh NEECHE bhejo ──────────────
  // AHEM: yahan matn dobara nahi likhte (innerText se bold/italic mit
  // jata tha aur kabhi matn bhi zaya ho jata tha). Ab asal DOM node ko
  // uthakar neeche wale khane mein rakhte hain — formatting mehfooz.
  while (full() && guard++ < 4000) {
    const last = cell.lastChild;
    if (!last) break;
    if (last.nodeType === 3) {                       // saada matn — aakhri lafz
      const t = last.nodeValue;
      const k = t.replace(/\s+$/, '').lastIndexOf(' ');
      if (k > 0) {
        const moved = t.slice(k);
        last.nodeValue = t.slice(0, k);
        cont.insertBefore(document.createTextNode(moved), cont.firstChild);
        continue;
      }
    }
    cont.insertBefore(last, cont.firstChild);        // poora element utha lo
  }

  // ── (b) Jagah bach jaye to neeche se WAPAS uthao ──────────────────
  guard = 0;
  while (!full() && cont.firstChild && guard++ < 4000) {
    const first = cont.firstChild;
    cell.appendChild(first);
    if (full()) { cont.insertBefore(first, cont.firstChild); break; }  // na samaya → wapas
  }
}

function _ch173OverflowSoon() {
  clearTimeout(_ch173OverflowTimer);
  _ch173OverflowTimer = setTimeout(_ch173Overflow, 250);
}
window._ch173Overflow = _ch173Overflow;

// Khane par input/paste sunno
// Cursor ko khane ke AAKHIR par le jao (matn behne ke baad)
function _ch173CaretEnd(el) {
  try {
    el.focus({ preventScroll: true });
    const r = document.createRange();
    r.selectNodeContents(el);
    r.collapse(false);
    const s = window.getSelection();
    s.removeAllRanges(); s.addRange(r);
  } catch (_) {}
}

function _ch173BindOverflow() {
  const cell = document.querySelector('#ch173-table [data-k="halaat"]');
  if (!cell || cell._ovBound) return;
  cell._ovBound = true;
  // LIKHTE WAQT bhi khud-kar behe — magar sirf JAB khana bhar jaye.
  // (Har harf par chalane se cursor shuru mein chala jata tha; ab hum
  //  cursor ko wapas aakhir par le aate hain, is liye likhna nahi rukta.)
  // NOTE: 'input' par NAHI chalate — warna har harf par matn dobara set
  // hota hai aur cursor shuru mein chala jata hai. Sirf paste aur blur par.
  // SIRF paste par — blur par chalane se innerText formatting (bold/italic/
  // underline) mita deta tha. Ab likhi hui formatting mehfooz rehti hai.
  const run = () => {
    if (cell.scrollHeight <= cell.clientHeight + 1) return;
    // Cursor kahan hai yaad rakho
    let atEnd = false;
    try {
      const sel = window.getSelection();
      atEnd = sel && sel.rangeCount && cell.contains(sel.anchorNode);
    } catch (_) {}
    _ch173Overflow();
    if (atEnd) _ch173CaretEnd(cell);
  };
  let _t = null;
  cell.addEventListener('input', () => { clearTimeout(_t); _t = setTimeout(run, 350); });
  cell.addEventListener('paste', () => setTimeout(run, 150));
}
window._ch173BindOverflow = _ch173BindOverflow;

// ═══ ملزمان / گواہان — case record se ═══
let _ch173Accused  = null;   // [{id,name,accused_type}]
let _ch173Witnesses = null;  // [{id,full_name,witness_type}]
let _ch173Version = 'fir';   // 'fir' ya 'cross_version'

// Version badlo — ملزمان/گواہان aur mehfooz data dono badal jate hain
function _ch173SetVersion(v) {
  _ch173Version = (v === 'cross_version') ? 'cross_version' : 'fir';
  if (typeof _renderR173 === 'function') _renderR173();
}
window._ch173SetVersion = _ch173SetVersion;

// Sirf mojooda version ke ملزمان
function _ch173AccList() {
  return (_ch173Accused || []).filter(a => (a.accused_type || 'fir') === _ch173Version);
}
// Sirf mojooda version ke گواہان
function _ch173WitList() {
  return (_ch173Witnesses || []).filter(w => (w.witness_type || 'fir') === _ch173Version);
}

async function _ch173LoadPeople() {
  const cid = _misalCaseId || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  if (!cid) { _ch173Accused = []; _ch173Witnesses = []; return; }
  try {
    const { data: acc } = await supabaseClient.from('case_accused')
      .select('id,name,accused_type').eq('case_id', cid).order('created_at', { ascending: true });
    _ch173Accused = acc || [];
  } catch(_) { _ch173Accused = []; }
  try {
    const { data: wit } = await supabaseClient.from('case_witnesses')
      .select('id,full_name,witness_type').eq('case_id', cid).order('created_at', { ascending: true });
    _ch173Witnesses = wit || [];
  } catch(_) { _ch173Witnesses = []; }
  // Data aane par گواہان wala khana bhar do (agar khali ho)
  try {
    const wcell = document.querySelector('#ch173-table [data-k="shahadat"]');
    if (wcell && !wcell.innerText.trim()) wcell.innerText = _ch173WitnessText();
    if (typeof _ch173SizeRotated === 'function') _ch173SizeRotated();
  } catch(_) {}
}

// Tamam گواہان aik line mein
function _ch173WitnessText() {
  const L = (typeof _ch173WitList === 'function') ? _ch173WitList() : (_ch173Witnesses || []);
  if (!L.length) return '';
  // Aik line mein aik گواہ
  return L.map(function(w, i){ return (i + 1) + '\u06D4 ' + (w.full_name || ''); }).join('\n');
}

// Kaunse ملزمان pehle se kisi column mein chune ja chuke hain
function _ch173UsedAccused(exceptKey) {
  const keys = ['ghair_giraftar','zer_hirasat','bar_zamanat'];
  const used = new Set();
  keys.forEach(k => {
    if (k === exceptKey) return;
    const el = document.querySelector(`#ch173-table [data-k="${k}"]`);
    if (!el) return;
    el.innerText.split(/\r?\n/).forEach(n => { const t = n.trim(); if (t) used.add(t); });
  });
  return used;
}

// ملزمان chunne ki list (jo doosre column mein chun liya gaya woh yahan nahi aata)
function _ch173AccPicker(ev, key) {
  ev.preventDefault(); ev.stopPropagation();
  document.getElementById('ch173-acc-menu')?.remove();
  const list = _ch173AccList();
  if (!list.length) {
    if (typeof showToast === 'function') showToast('ℹ️ ' + (_ch173Version==='cross_version'?'کراس ورژن':'FIR') + ' میں کوئی ملزم درج نہیں', 'info');
    return;
  }
  const used = _ch173UsedAccused(key);
  const cell = document.querySelector(`#ch173-table [data-k="${key}"]`);
  const mine = new Set(cell ? cell.innerText.split(/\r?\n/).map(t=>t.trim()).filter(Boolean) : []);

  // Panel: list SCROLL hoti hai, buttons HAMESHA neeche nazar aate hain
  const box = document.createElement('div');
  box.id = 'ch173-acc-menu';
  box.style.cssText =
    'position:fixed;z-index:99999;background:#fff;border:1px solid #0369a1;border-radius:10px;' +
    'box-shadow:0 10px 30px rgba(0,0,0,.28);direction:rtl;width:260px;max-width:92vw;' +
    'display:flex;flex-direction:column;max-height:min(60vh,340px);overflow:hidden;';
  const rows = list.filter(a => !used.has((a.name||'').trim())).map(a => {
    const nm = (a.name||'').trim();
    const on = mine.has(nm);
    return `<label style="display:flex;align-items:center;gap:8px;padding:7px 6px;cursor:pointer;font-size:13px;
              border-bottom:1px solid #f1f5f9;font-family:'Jameel Noori Nastaleeq',serif;">
              <input type="checkbox" ${on?'checked':''} value="${esc(nm)}"> <span>${esc(nm)}</span></label>`;
  }).join('');
  box.innerHTML = `
    <div style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;font-weight:700;color:#0369a1;
                font-family:'Jameel Noori Nastaleeq',serif;background:#f8fafc;">
      ملزمان منتخب کریں (${_ch173Version==='cross_version'?'کراس ورژن':'FIR'})
    </div>
    <div style="flex:1;overflow-y:auto;padding:4px 8px;min-height:0;">
      ${rows || '<div style="font-size:12px;color:#777;padding:10px;">باقی کوئی ملزم نہیں</div>'}
    </div>
    <div style="display:flex;gap:6px;padding:8px;border-top:1px solid #e5e7eb;background:#f8fafc;flex-shrink:0;">
      <button id="ch173-acc-ok" style="flex:1;padding:8px;border:none;border-radius:6px;background:#0369a1;
        color:#fff;cursor:pointer;font-size:13px;font-weight:700;font-family:'Jameel Noori Nastaleeq',serif;">✔ شامل کریں</button>
      <button id="ch173-acc-x" style="padding:8px 12px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;
        cursor:pointer;font-size:13px;font-family:'Jameel Noori Nastaleeq',serif;">بند</button>
    </div>`;
  document.body.appendChild(box);

  // Position: button ke qareeb, magar screen se bahar kabhi nahi
  const r = ev.currentTarget.getBoundingClientRect();
  const bw = box.offsetWidth, bh = box.offsetHeight;
  let top  = r.bottom + 6;
  if (top + bh > window.innerHeight - 8) top = Math.max(8, r.top - bh - 6);
  if (top + bh > window.innerHeight - 8) top = Math.max(8, window.innerHeight - bh - 8);
  let left = r.left + r.width/2 - bw/2;
  left = Math.max(8, Math.min(left, window.innerWidth - bw - 8));
  box.style.top  = top + 'px';
  box.style.left = left + 'px';

  // Bahar click par band
  setTimeout(() => {
    const off = (e) => { if (!box.contains(e.target)) { box.remove(); document.removeEventListener('mousedown', off); } };
    document.addEventListener('mousedown', off);
  }, 0);

  box.querySelector('#ch173-acc-x').onclick = () => box.remove();
  box.querySelector('#ch173-acc-ok').onclick = () => {
    const picked = [...box.querySelectorAll('input:checked')].map(i => i.value);
    if (cell) cell.innerText = picked.join('\n');
    box.remove();
    if (typeof _ch173SizeRotated === 'function') _ch173SizeRotated();
    try { _r173Dirty = true; } catch(_) {}
  };
}
window._ch173AccPicker   = _ch173AccPicker;
window._ch173LoadPeople  = _ch173LoadPeople;
window._ch173WitnessText = _ch173WitnessText;

// ═══ چالان editor ke chhote buttons ═══
function _chBtn() {
  return 'min-width:30px;height:28px;border:1px solid var(--border,#ccc);border-radius:6px;' +
         'background:var(--bg-card,#fff);color:var(--text-primary,#111);cursor:pointer;' +
         'font-size:13px;padding:0 7px;margin:0 1px;';
}
// ═══ فونٹ سائز — MS Word جیسی فہرست (پوائنٹ میں) ═══
const R173_FONT_SIZES = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
const R173_FONT_DEFAULT = 14;

// Mehfooz shuda doc font (na ho to default 14pt)
function _ch173DocFont(bs) {
  const n = parseFloat((bs && bs.doc_font) || '');
  return (n && !isNaN(n)) ? n : R173_FONT_DEFAULT;
}

// ═══ Floating toolbar چالان کے صفحے پر نہ لگے ═══
// dioBindEditor کسی اور فائل میں بنتی ہے اور ہر contenteditable پر تیرتی ہوئی
// پٹی لگا دیتی ہے۔ یہاں اسے صرف چالان کے صفحے کے لیے روک دیتے ہیں — باقی
// دستاویزات پر وہ پہلے کی طرح کام کرتی رہے گی۔
function _ch173BlockFloatBar() {
  try {
    if (typeof window.dioBindEditor === 'function' && !window._ch173BindPatched) {
      window._ch173BindPatched = true;
      const _orig = window.dioBindEditor;
      window.dioBindEditor = function (el) {
        try {
          if (el && (el.id === 'ch173-doc' ||
                    (el.closest && el.closest('#ch173-doc')) ||
                    (el.querySelector && el.querySelector('#ch173-doc')))) return;
        } catch(_) {}
        return _orig.apply(this, arguments);
      };
    }
  } catch(_) {}
}
window._ch173BlockFloatBar = _ch173BlockFloatBar;

// ═══ چالان کا فارم پورے صفحے پر ═══
// Workspace ka doosra hissa (dastawez ki fehrist) aur tang container safhe ko
// aadha kar dete the. Yahan editor wale khane aur us ke tamam والدین ko poori
// chaudai/unchai par le aate hain.
function _ch173FullPage(area) {
  try {
    document.body.classList.add('workspace-mode');
    // Side ki dastawez fehrist chhupao (agar khuli ho)
    ['.workspace-sidebar', '#workspace-doc-list', '.misal-sidebar'].forEach(sel => {
      document.querySelectorAll(sel).forEach(el => { el.style.display = 'none'; });
    });
    // Editor ka khana + us ke والدین — poori jagah
    let el = area, hops = 0;
    while (el && el !== document.body && hops++ < 8) {
      el.style.width = '100%';
      el.style.maxWidth = 'none';
      el.style.marginRight = '0';
      el.style.marginLeft = '0';
      if (getComputedStyle(el).display === 'flex') el.style.flex = '1 1 auto';
      el = el.parentElement;
    }
    // Workspace ka grid do-column tha to usay aik column bana do
    document.querySelectorAll('.workspace-layout, .misal-layout').forEach(w => {
      w.style.display = 'block';
      w.style.gridTemplateColumns = '1fr';
    });
    // Poore safhe wale view (dio-docview) ke andar safha poori chaudai le
    // چالان کا صفحہ ہمیشہ پوری چوڑائی لے (8.5in کی حد بڑی سکرین پر
    // آدھا صفحہ لگتی تھی — چاہے پورے صفحے والا منظر ہو یا نہ ہو)
    const doc = document.getElementById('ch173-doc');
    if (doc) {
      doc.style.width = '100%';
      doc.style.maxWidth = 'none';
      doc.style.margin = '0 auto';
    }
  } catch(_) {}
}
window._ch173FullPage = _ch173FullPage;

// ═══ Chuni hui jagah YAAD rakho ═══
// Toolbar ke select/button par tap karte hi contenteditable se focus hat jata
// hai aur chuna hua matn zaya ho jata hai — isi liye font size lagta hi nahi
// tha aur dropdown wapas purani qeemat par palat jata tha. Yahan hum aakhri
// selection mehfooz rakhte hain aur amal se pehle wapas laga dete hain.
let _ch173Range = null;

function _ch173SaveRange() {
  const doc = document.getElementById('ch173-doc');
  if (!doc) return;
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const r = sel.getRangeAt(0);
  if (doc.contains(r.commonAncestorContainer)) _ch173Range = r.cloneRange();
}
window._ch173SaveRange = _ch173SaveRange;

function _ch173RestoreRange() {
  const doc = document.getElementById('ch173-doc');
  if (!doc || !_ch173Range) return false;
  if (!doc.contains(_ch173Range.commonAncestorContainer)) { _ch173Range = null; return false; }
  try {
    // Jis khane mein selection hai usay focus do, warna execCommand kaam nahi karta
    let n = _ch173Range.commonAncestorContainer;
    if (n.nodeType === 3) n = n.parentElement;
    const host = n && n.closest ? n.closest('[contenteditable="true"]') : null;
    if (host) host.focus({ preventScroll: true });
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(_ch173Range);
    return true;
  } catch(_) { return false; }
}
window._ch173RestoreRange = _ch173RestoreRange;

// Chune hue matn ko <span> mein lapet do (font size aur format painter dono ke liye).
// execCommand('fontSize') sirf 1–7 leta hai, is liye size=7 laga kar un <font> tags
// ko foran <span> se badal dete hain — phir un par koi bhi style lagai ja sakti hai.
function _ch173WrapSelection() {
  const doc = document.getElementById('ch173-doc');
  if (!doc) return [];
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return [];
  if (!doc.contains(sel.anchorNode) || !doc.contains(sel.focusNode)) return [];
  try { document.execCommand('styleWithCSS', false, false); } catch(_) {}
  let ok = false;
  try { ok = document.execCommand('fontSize', false, '7'); } catch(_) {}
  if (!ok) return [];
  const spans = [];
  doc.querySelectorAll('font[size="7"]').forEach(f => {
    const span = document.createElement('span');
    while (f.firstChild) span.appendChild(f.firstChild);
    f.parentNode.replaceChild(span, f);
    spans.push(span);
  });
  return spans;
}

// Chune hue matn par sahih pt lagao
function _ch173FontToSelection(pt) {
  const spans = _ch173WrapSelection();
  if (!spans.length) return false;
  spans.forEach(s => { s.style.fontSize = pt + 'pt'; });
  return true;
}

// Poore document ka font
function _ch173FontToDoc(pt) {
  const doc = document.getElementById('ch173-doc');
  if (!doc) return;
  doc.dataset.fs = pt;
  doc.querySelectorAll('.ch173-table th, .ch173-table td, .rotinner, .hinner, .normwrap, .ch173-cont, .sho-cell-row, .sho-papers-head, .sho-papers-body')
     .forEach(el => { el.style.fontSize = pt + 'pt'; });
  const hid = doc.querySelector('[data-k="doc_font"]');
  if (hid) hid.value = pt;
  if (typeof _ch173SizeRotated === 'function') _ch173SizeRotated();
  if (typeof _ch173Overflow === 'function') _ch173Overflow();
}
window._ch173FontToDoc = _ch173FontToDoc;

// Dropdown se font — matn chuna ho to usi par, warna poore doc par
function _ch173SetFont(val) {
  const pt = parseFloat(val);
  if (!pt || isNaN(pt)) return;
  _ch173RestoreRange();                        // chuna hua matn wapas lagao
  const _fs = document.getElementById('ch173-font-sel');
  if (_fs) _fs.value = String(pt);             // dropdown wapas na palte
  if (_ch173FontToSelection(pt)) {
    _ch173SaveRange();
    try { _r173Dirty = true; } catch(_) {}
    return;
  }
  _ch173FontToDoc(pt);
  try { _r173Dirty = true; } catch(_) {}
}
window._ch173SetFont = _ch173SetFont;

// Cursor jahan ho, dropdown wahi size dikhaye (MS Word jaisa)
function _ch173SyncFontSel() {
  const doc = document.getElementById('ch173-doc');
  const selEl = document.getElementById('ch173-font-sel');
  if (!doc || !selEl) return;
  // Dropdown khud khula ho to us ki qeemat mat badlo (warna wapas palat jati hai)
  if (document.activeElement === selEl) return;
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount || !sel.anchorNode || !doc.contains(sel.anchorNode)) return;
  _ch173SaveRange();
  let node = sel.anchorNode;
  if (node.nodeType === 3) node = node.parentElement;
  if (!node) return;
  try {
    const px = parseFloat(getComputedStyle(node).fontSize);
    if (!px) return;
    const pt = Math.round(px * 0.75 * 2) / 2;          // px → pt
    if ([...selEl.options].some(op => parseFloat(op.value) === pt)) selEl.value = String(pt);
  } catch(_) {}
}
window._ch173SyncFontSel = _ch173SyncFontSel;

// ═══ FORMAT PAINTER — MS Word جیسا ═══
// ایک کلک  = ایک بار لگے گا، پھر خود بند
// ڈبل کلک = بند کرنے تک بار بار لگتا رہے گا (Esc یا دوبارہ کلک سے بند)
let _ch173Brush = null;      // mehfooz formatting
let _ch173BrushMode = null;  // 'once' | 'sticky' | null

// Cursor jahan hai wahan ki formatting naqal karo
function _ch173BrushCopy() {
  const doc = document.getElementById('ch173-doc');
  if (!doc) return null;
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount || !sel.anchorNode || !doc.contains(sel.anchorNode)) return null;
  let node = sel.anchorNode;
  if (node.nodeType === 3) node = node.parentElement;
  if (!node) return null;
  let cs;
  try { cs = getComputedStyle(node); } catch(_) { return null; }
  // bold/italic/underline queryCommandState se — yeh ancestors ka bhi sahih batata hai
  const st = (c) => { try { return document.queryCommandState(c); } catch(_) { return false; } };
  const px = parseFloat(cs.fontSize) || 0;
  return {
    fontSize: px ? (Math.round(px * 0.75 * 2) / 2) + 'pt' : '',
    fontFamily: cs.fontFamily || '',
    color: cs.color || '',
    fontWeight: st('bold') ? 'bold' : 'normal',
    fontStyle: st('italic') ? 'italic' : 'normal',
    textDecoration: st('underline') ? 'underline' : 'none'
  };
}

// Naqal ki hui formatting chune hue matn par lagao
function _ch173BrushPaint() {
  if (!_ch173Brush) return false;
  _ch173RestoreRange();
  const spans = _ch173WrapSelection();
  if (!spans.length) return false;
  spans.forEach(s => {
    Object.keys(_ch173Brush).forEach(k => {
      if (_ch173Brush[k]) s.style[k] = _ch173Brush[k];
    });
  });
  try { _r173Dirty = true; } catch(_) {}
  return true;
}

// Button ki halat (on/off) dikhao
function _ch173BrushUI() {
  const btn = document.getElementById('ch173-brush-btn');
  const doc = document.getElementById('ch173-doc');
  const on = !!_ch173BrushMode;
  if (btn) {
    btn.style.background = on ? '#0369a1' : 'var(--bg-card,#fff)';
    btn.style.color = on ? '#fff' : 'var(--text-primary,#111)';
    btn.title = on
      ? (_ch173BrushMode === 'sticky' ? 'فارمیٹ پینٹر چالو (بار بار) — بند کرنے کے لیے کلک یا Esc' : 'فارمیٹ پینٹر چالو — اب متن منتخب کریں')
      : 'فارمیٹ پینٹر — ایک کلک: ایک بار، ڈبل کلک: بار بار';
  }
  if (doc) doc.style.cursor = on ? 'copy' : '';
}

function _ch173BrushOff() {
  _ch173Brush = null;
  _ch173BrushMode = null;
  _ch173BrushUI();
}
window._ch173BrushOff = _ch173BrushOff;

// Button par click / double click
function _ch173BrushClick(sticky) {
  if (_ch173BrushMode && !sticky) { _ch173BrushOff(); return; }   // dobara click = band
  _ch173RestoreRange();
  const b = _ch173BrushCopy();
  if (!b) {
    if (typeof showToast === 'function') showToast('ℹ️ پہلے اُس متن پر کلک کریں جس کی فارمیٹنگ نقل کرنی ہے', 'info');
    return;
  }
  _ch173Brush = b;
  _ch173BrushMode = sticky ? 'sticky' : 'once';
  _ch173BrushUI();
}
window._ch173BrushClick = _ch173BrushClick;

// Document par matn chunte hi formatting lag jaye
function _ch173BindBrush() {
  const doc = document.getElementById('ch173-doc');
  if (!doc || doc._brushBound) return;
  doc._brushBound = true;
  doc.addEventListener('mouseup', () => {
    if (!_ch173BrushMode) return;
    setTimeout(() => {
      if (!_ch173BrushMode) return;
      const done = _ch173BrushPaint();
      if (done && _ch173BrushMode === 'once') _ch173BrushOff();
    }, 10);
  });
  if (!window._ch173BrushEscBound) {
    window._ch173BrushEscBound = true;
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && _ch173BrushMode) _ch173BrushOff();
    });
  }
}
window._ch173BindBrush = _ch173BindBrush;

// 🧹 فارمیٹ ختم — بولڈ/ترچھا/انڈر لائن/رنگ/سائز سب ہٹا کر سادہ متن
function _ch173ClearFmt() {
  _ch173RestoreRange();
  try { document.execCommand('removeFormat', false, null); } catch(_) {}
  // Humare apne <span style="font-size:..."> bhi saaf karo
  try {
    _ch173WrapSelection().forEach(sp => sp.removeAttribute('style'));
  } catch(_) {}
  _ch173SaveRange();
  try { _r173Dirty = true; } catch(_) {}
}
window._ch173ClearFmt = _ch173ClearFmt;

function _ch173Fmt(cmd) {
  // AHEM: agar cursor/selection PEHLE SE چالان ke andar hai to purani
  // (basi) selection wapas mat lagao — bold lagne ke baad safha badal
  // jata hai, aur basi selection ghalat jagah par lagti thi, isi liye
  // dobara dabane par bold KHATAM nahi hota tha.
  const doc = document.getElementById('ch173-doc');
  const sel = window.getSelection();
  const live = doc && sel && sel.rangeCount &&
               doc.contains(sel.getRangeAt(0).commonAncestorContainer);
  if (!live) _ch173RestoreRange();
  try { document.execCommand('styleWithCSS', false, false); } catch(_) {}
  try { document.execCommand(cmd, false, null); } catch(_) {}
  _ch173SaveRange();
  try { _r173Dirty = true; } catch(_) {}
}
// Purana naam bhi chalta rahe (kahin aur se pukara ja raha ho to)
function _ch173FontStep(dir) {
  const doc = document.getElementById('ch173-doc');
  if (!doc) return;
  const cur = parseFloat(doc.dataset.fs || String(R173_FONT_DEFAULT));
  const i = R173_FONT_SIZES.indexOf(cur);
  let next;
  if (i >= 0) next = R173_FONT_SIZES[Math.min(R173_FONT_SIZES.length - 1, Math.max(0, i + (dir > 0 ? 1 : -1)))];
  else next = Math.min(72, Math.max(8, cur + (dir > 0 ? 1 : -1)));
  _ch173SetFont(next);
  const selEl = document.getElementById('ch173-font-sel');
  if (selEl) selEl.value = String(next);
}
window._chBtn = _chBtn;
window._ch173Fmt = _ch173Fmt;
window._ch173FontStep = _ch173FontStep;

// ═══ SHO ki line — system se khud (naam + عہدہ + تھانہ) ═══
function _ch173ShoLine(o) {
  o = o || (typeof currentOfficer !== 'undefined' ? currentOfficer : {}) || {};
  const st = o.station || '';
  if (typeof getSHOSignLine === 'function') {
    const line = getSHOSignLine(st);
    if (line && line.trim()) return line;
  }
  // Backup: seedha localStorage se (agar helper ki file load na hui ho)
  try {
    const sho = JSON.parse(localStorage.getItem('digital_io_sho') || '{}');
    const parts = [];
    if (sho.name) parts.push(String(sho.name).trim());
    if (sho.rank) parts.push(String(sho.rank).trim());
    let l = parts.join(' ');
    if (st) l += (l ? ' ' : '') + 'تھانہ ' + st;
    if (l.trim()) return l;
  } catch(_) {}
  // Ab bhi kuch na mile → officer ko batao ke اوزار mein SHO set karein
  return st ? ('تھانہ ' + st) : '';
}
window._ch173ShoLine = _ch173ShoLine;

// ═══ جرم — دفعات اور "ت پ" الگ الگ ═══
// "ت پ" (تعزیراتِ پاکستان) ہمیشہ دفعات کے بعد، آخر میں آنا چاہیے۔ اگر دونوں ایک ہی
// خانے میں ہوں تو RTL/LTR ملی جلی تحریر کی وجہ سے اس کی جگہ بدل سکتی ہے، اس لیے
// اسے الگ خانے میں رکھا جاتا ہے — تب ترتیب ہمیشہ پکی رہتی ہے۔
const R173_JURM_SUF_RE = /[\s،,\-]*(ت\s*\.?\s*پ|تعزیرات\s*پاکستان)\s*$/;

function _ch173JurmParts(raw, savedSuf) {
  const txt = String(raw || '').trim();
  const m = txt.match(R173_JURM_SUF_RE);
  const body = m ? txt.slice(0, m.index).trim() : txt;
  let suffix;
  if (savedSuf !== undefined && savedSuf !== null) suffix = String(savedSuf);
  else if (m) suffix = m[1].replace(/\s+/g, ' ').trim();
  else suffix = 'ت پ';
  return { body, suffix };
}
window._ch173JurmParts = _ch173JurmParts;

// ═══ آج کی تاریخ — ہمیشہ DD/MM/YYYY (عالمی formatDate پہلے، ورنہ خود) ═══
function _ch173Today() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const manual = dd + '/' + mm + '/' + d.getFullYear();
  if (typeof formatDate === 'function') {
    try {
      const f = formatDate(d);
      if (f && /^\d{2}\/\d{2}\/\d{4}$/.test(String(f).trim())) return String(f).trim();
    } catch(_) {}
  }
  return manual;
}
window._ch173Today = _ch173Today;

// ═══ تاریخ — system POOCHTA hai, khud nahi likhta ═══
function _ch173PickDate(el) {
  if (!el) return;
  const cur = (el.innerText || '').trim();
  const inp = prompt('تاریخ درج کریں (DD/MM/YYYY):', cur);
  if (inp === null) return;                       // منسوخ
  const t = inp.trim();
  if (!t) { el.innerText = ''; return; }
  el.innerText = (typeof formatDate === 'function') ? formatDate(t) : t;
  try { _r173Dirty = true; } catch(_) {}
}
window._ch173PickDate = _ch173PickDate;


// ═══ Kya is مقدمہ mein کراس ورژن mojood hai? ═══
// (Agar nahi to کراس ورژن ka option dikhaya hi nahi jata)
function _ch173HasCross() {
  const a = (_ch173Accused   || []).some(x => (x.accused_type || 'fir') === 'cross_version');
  const w = (_ch173Witnesses || []).some(x => (x.witness_type || 'fir') === 'cross_version');
  return a || w;
}
window._ch173HasCross = _ch173HasCross;

// ═══════════════════════════════════════════════════════════════════
//  چالان کی فہرست — save karne ke baad yeh khulti hai
//  (ضمنیات جیسی table: # | چالان | ہیڈ | تاریخ | مضمون | ایکشن)
// ═══════════════════════════════════════════════════════════════════
function _renderR173List() {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;

  if (typeof _ch173FullPage === 'function') _ch173FullPage(area);

  const typeName = (t) => (R173_TYPES.find(x => x.id === t) || {}).name || t;
  const mazmoon  = (d) => {
    const f = d.form_data || {};
    const t = [f.halaat, f.cont_text, f.shahadat].filter(Boolean).join(' ')
      .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return t ? (t.length > 95 ? t.slice(0, 95) + '…' : t) : '';
  };
  const dt = (d) => d.date ? (typeof formatDate === 'function' ? formatDate(d.date) : d.date) : '';

  const rows = (list) => list.map((d, i) => `
    <tr ondblclick="_r173OpenDoc('${d.id}')" style="cursor:pointer;">
      <td class="num">${i + 1}</td>
      <td>${esc(d.head || typeName(d.type))}</td>
      <td style="text-align:center;">${esc(typeName(d.type))}</td>
      <td style="text-align:center;white-space:nowrap;font-family:var(--font-mono);">${esc(dt(d))}</td>
      <td class="mz">${esc(mazmoon(d))}</td>
      <td class="act">
        <button class="cab" onclick="event.stopPropagation();_r173OpenDoc('${d.id}')" title="ترمیم">✏️</button>
        <button class="cab" onclick="event.stopPropagation();_r173DeleteDoc('${d.id}')" title="حذف">🗑️</button>
        <button class="cab" onclick="event.stopPropagation();_r173PrintDoc('${d.id}')" title="پرنٹ">🖨️</button>
        <button class="cab" onclick="event.stopPropagation();_r173EmailDoc('${d.id}')" title="بھیجیں">✉️</button>
      </td>
    </tr>`).join('');

  area.innerHTML = `
  <style>
    .ct{ width:100%; border-collapse:collapse; font-size:13px; direction:rtl;
         font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; }
    .ct th{ background:var(--bg-tertiary); border:1px solid var(--border); padding:7px 6px;
            font-weight:700; white-space:nowrap; }
    .ct td{ border:1px solid var(--border); padding:6px; vertical-align:middle; }
    .ct tbody tr:nth-child(odd){ background:var(--bg-secondary); }
    .ct tbody tr:hover{ background:var(--hover-bg); }
    .ct .num{ text-align:center; font-weight:700; width:44px; }
    .ct .act{ white-space:nowrap; text-align:center; width:160px; }
    .ct .mz{ font-size:12px; color:var(--text-secondary); }
    .cab{ border:1px solid var(--border); background:var(--bg-card); border-radius:6px;
          padding:3px 7px; margin:0 1px; cursor:pointer; font-size:14px; line-height:1; }
    .cab:hover{ background:var(--hover-bg); }
  </style>
  <div style="padding:14px;direction:rtl;height:100%;overflow-y:auto;">
    <div style="display:flex;align-items:center;gap:10px;margin:0 0 8px;flex-wrap:wrap;">
      <button class="btn btn-primary btn-sm" onclick="_r173NewDoc(false)">چالان درج کریں</button>
      <div style="flex:1;"></div>
      <span style="font-size:11px;color:var(--text-muted);">پرنٹ کے لیے ہر سطر کا 🖨️ دبائیں</span>
    </div>
    <table class="ct">
      <thead><tr>
        <th class="num">#</th><th>چالان</th><th>ہیڈ</th><th>تاریخ</th><th>مضمون</th><th class="act">ایکشن</th>
      </tr></thead>
      <tbody>${_r173Docs.length ? rows(_r173Docs)
        : `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:22px;">ابھی کوئی اندراج نہیں</td></tr>`}</tbody>
    </table>
  </div>`;
}
window._renderR173List = _renderR173List;

// ═══ Version (FIR / کراس ورژن) + چالان ki qism — dono aik saath ═══
async function _r173PickVer(version, type) {
  _ch173Version = (version === 'cross_version') ? 'cross_version' : 'fir';
  if (typeof openReport173WithType === 'function') await openReport173WithType(type);
}
window._r173PickVer = _r173PickVer;

// ➕ نیا چالان — koi card/modal NAHI. Seedha khali فارم poore safhe par.
// (قسم / ہیڈ / ورژن — teeno ab upar wali fixed toolbar mein hain.)
function _r173NewDoc(isIkhraj) {
  _r173DocId    = null;                      // naya record
  _r173ForceBlank = true;                    // khali فارم — purana data na aaye
  _r173Head     = '';                        // ہیڈ toolbar se chunenge
  _r173ShowList = false;                     // fehrist nahi — فارم
  const t = isIkhraj ? 'adampata' : 'mukammal';
  _r173Type = t;
  // Mojooda khali فارم dikhane ke liye purana mehfooz data saaf karo
  try {
    let k = t;
    if (R173_BLANK_TYPES.includes(t)) k = t + '::' + _ch173Version;
    delete _r173Records[k];
  } catch(_) {}
  if (typeof openReport173WithType === 'function') openReport173WithType(t);
}
window._r173NewDoc = _r173NewDoc;

// Purana naam bhi chalta rahe (kahin aur se pukara ja raha ho to)
function _r173CreateDoc() { _r173NewDoc(false); }
window._r173CreateDoc = _r173CreateDoc;

const _r173Doc = (id) => _r173Docs.find(d => String(d.id) === String(id));

// Tabdeeli hui ho to safha chhorne se pehle poocho
if (!window._r173DirtyBound) {
  window._r173DirtyBound = true;
  window.addEventListener('beforeunload', function (e) {
    if (!_r173Dirty) return;
    if (!document.getElementById('ch173-doc')) return;
    e.preventDefault(); e.returnValue = '';
  });
  document.addEventListener('input', function (e) {
    if (e.target && e.target.closest && e.target.closest('#ch173-doc')) _r173Dirty = true;
  }, true);
}

// ✏️ موجودہ کھولیں
async function _r173OpenDoc(id) {
  const d = _r173Doc(id);
  if (!d) return;
  _r173DocId    = d.id;
  _r173Head     = d.head || '';
  _r173Type     = d.type;
  _ch173Version = (d.subtype === 'cross_version') ? 'cross_version' : 'fir';
  if (d.form_data) {
    let k = d.type;
    if (d.type === 'tatima_challan') k = 'tatima_challan_' + (d.subtype || 'aslha');
    else if (R173_BLANK_TYPES.includes(d.type)) k = d.type + '::' + _ch173Version;
    _r173Records[k] = d.form_data;
  }
  _r173ShowList = false;
  if (typeof openReport173WithType === 'function') await openReport173WithType(d.type);
}
window._r173OpenDoc = _r173OpenDoc;

// 🗑️ حذف
async function _r173DeleteDoc(id) {
  const d = _r173Doc(id);
  if (!d) return;
  if (!confirm('کیا یہ اندراج حذف کر دیں؟')) return;
  try {
    await supabaseClient.from('report_173').delete().eq('id', d.id);
    _r173Docs = _r173Docs.filter(x => String(x.id) !== String(id));
    if (typeof showToast === 'function') showToast('🗑️ حذف ہو گیا', 'info');
  } catch (e) {
    if (typeof showToast === 'function') showToast('❌ ' + e.message, 'error');
  }
  _renderR173List();
}
window._r173DeleteDoc = _r173DeleteDoc;

// 🖨️ پرنٹ
async function _r173PrintDoc(id) {
  await _r173OpenDoc(id);
  setTimeout(() => { if (typeof _printR173 === 'function') _printR173(); }, 800);
}
window._r173PrintDoc = _r173PrintDoc;

// ✉️ بھیجیں
async function _r173EmailDoc(id) {
  const d = _r173Doc(id);
  if (!d) return;
  const f = d.form_data || {};
  const txt = String(f.halaat || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const subj = (d.head || '') + (d.date ? ' — ' + d.date : '');
  try {
    if (navigator.share) { await navigator.share({ title: subj, text: subj + '\n\n' + txt }); return; }
    window.location.href = 'mailto:?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(txt);
  } catch (_) {
    try { await navigator.clipboard.writeText(subj + '\n\n' + txt);
      if (typeof showToast === 'function') showToast('📋 نقل ہو گیا', 'success'); } catch (__) {}
  }
}
window._r173EmailDoc = _r173EmailDoc;

// 🖨️ تمام پرنٹ
function _printAllR173(isIkhraj) {
  const IK = ['ikhraj','adampata'];
  const list = _r173Docs.filter(d => isIkhraj ? IK.includes(d.type) : !IK.includes(d.type));
  if (!list.length) {
    if (typeof showToast === 'function') showToast('⚠️ کوئی اندراج نہیں', 'info'); return;
  }
  if (typeof showToast === 'function')
    showToast('🖨️ ایک ایک کر کے کھول کر پرنٹ کریں', 'info', 4000);
  _r173PrintDoc(list[0].id);
}
window._printAllR173 = _printAllR173;

// ہیڈ/عنوان بدلیں (فہرست میں یہی نظر آتا ہے)
function _r173SetHead(h) {
  _r173Head = h || '';
  try { _r173Dirty = true; } catch (_) {}
}
window._r173SetHead = _r173SetHead;

// ═══ رپورٹ 173 ض ف کا چِپ — سیدھی فہرست کھولتا ہے (فارم نہیں) ═══
async function openR173List() {
  if (typeof _dioOpenDocTab === 'function') _dioOpenDocTab('r173:list');
  await openReport173(_misalCaseId || (typeof currentCaseId !== 'undefined' ? currentCaseId : null));
  _r173ShowList = true;
  _renderR173List();
}
window.openR173List = openR173List;

// ═══════════════════════════════════════════════════════════════════
//  MS Word جیسی سہولتیں — Tab / Shift+Tab / Enter / Ctrl+B,I,U
//  چالان کے ہر لکھنے والے خانے میں (تیرتی پٹی یہاں نہیں چلتی، اس لیے
//  یہ الگ سے لگانا ضروری ہے)
// ═══════════════════════════════════════════════════════════════════
function _ch173BindKeys() {
  const doc = document.getElementById('ch173-doc');
  if (!doc || doc._keysBound) return;
  doc._keysBound = true;
  doc.addEventListener('keydown', function (e) {
    const el = e.target;
    if (!el || !el.isContentEditable) return;

    // TAB → خالی جگہ (فوکس دوسرے خانے پر نہ جائے)
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) { try { document.execCommand('outdent'); } catch(_) {} return; }
      try { document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'); } catch(_) {}
      return;
    }

    // ENTER → نئی سطر (خانے کے اندر ہی)
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      try { document.execCommand('insertLineBreak'); }
      catch(_) { try { document.execCommand('insertHTML', false, '<br>'); } catch(__) {} }
      return;
    }

    // Ctrl+B / I / U
    if (e.ctrlKey || e.metaKey) {
      const k = String(e.key || '').toLowerCase();
      if (k === 'b') { e.preventDefault(); _ch173Fmt('bold'); }
      else if (k === 'i') { e.preventDefault(); _ch173Fmt('italic'); }
      else if (k === 'u') { e.preventDefault(); _ch173Fmt('underline'); }
    }
  });
}
window._ch173BindKeys = _ch173BindKeys;

// ═══ کاغذ کا سائز — لیگل (8.5×13) یا A4 ═══
// سافٹ ویئر کا اصل اصول لیگل ہے، مگر بہت سے دفاتر A4 پر چھاپتے ہیں —
// اس لیے دونوں کا اختیار۔ منتخب کردہ سائز محفوظ رہتا ہے۔

function _ch173SetPaper(v) {
  _ch173Paper = (v === 'a4') ? 'a4' : 'legal';
  try { localStorage.setItem('dio_ch173_paper', _ch173Paper); } catch (_) {}
  // صفحہ نئے سائز پر دوبارہ بنائیں
  const doc = document.getElementById('ch173-doc');
  if (doc) doc.style.minHeight = (_ch173Paper === 'a4') ? '11.7in' : '13in';
  if (typeof showToast === 'function')
    showToast(_ch173Paper === 'a4' ? '📄 A4 منتخب' : '📄 لیگل (8.5×13) منتخب', 'info');
}
window._ch173SetPaper = _ch173SetPaper;
