/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — رپورٹ 173 ض ف (FORM 25.56(1))
   5 types: چالان مکمل/نامکمل/انٹیرم/اخراج/عدم پتہ

   11) اخراج / عدم پتہ (dono aik hi form — farq sirf naam ka)
       • Ye CHALAN path par hain (izafi matn, تفصیل کاغذات, SHO, agla safha,
         data-fetch, alfaz — SAB چالان jaise). Farq SIRF table ka:
         چالان ki 7-column vertical table ki jagah اخراج ki 3-column table
         (نمبر شمار / تفصیل / قدر), 8 rows.
       • Heading: «فارم رپورٹ اختتامی بصیغہ اخراج/عدم پتہ زیر دفعہ 173 ض ف».
       • Row 1 (مدعی): CNIC aur numbering (1۔) ke BAGHAIR — sirf naam+pata.
       • Row 2 (جرم): body CENTER; mix likhayi ka bidi formula — Urdu (ت پ)
         RTL isolate, English/number (337A2..) LTR isolate.
       • Rows 3-7 ki khali قدر mein '-----------' CENTER.
       • Aakhri row (مختصر حالات) mein NUMBER nahi (docx jaisa). Us mein FIR
         ka matn khud fetch hota hai (چالان jaisa).
       • Column 2 ki bayen lakeer MOVE-ABLE (grip) + AUTO-FIT (sab se lambi
         row jitni); mehfooz bhi rehti hai. Column auto-sizing (چالان wali)
         is simple table par NAHI chalti.
       • تفصیل کاغذات form mein KHALI khulta hai — 10 default kaghaz dropdown
         (▾) mein maujood, officer khud add karta hai.

   12) تتمہ چالان — sub-menu (شراب/چرس/آئس/اسلحہ/انٹی ریپ/زنا). Har sub-type
       ka apna boilerplate (aslha/chars set). FIR ka matn تتمہ mein NA bhare.
       CNIC columns se hata (body.tatima-active). رزلٹ نمبری top-bar khane se
       do jagah lagti hai: (1) تحریر mein "رزلٹ نمبر[ی]" ke saath usi satar,
       (2) تفصیل کاغذات mein "اصل رزلٹ نمبری" ke naam ke SAATH (.pp-rno) —
       tadaad (1) ko haath NA lagaye.

   13) FONT: default 14 (R173_FONT_DEFAULT). Purani ghalat 10.5 mehfooz value
       nazar-andaz ho kar 14 par aati hai; officer ki apni doosri naap barqarar.
   ═══════════════════════════════════════════════════════════ */

/* ╔═══════════════════════════════════════════════════════════╗
   ║  🔓 رپورٹ 173 — LOCK ہٹا دیا گیا (13 اکتوبر 2026)          ║
   ║  ASI Fayyaz Hussain Shad ke hukm par: AGLE HUKM TAK nizam  ║
   ║  ki koi file locked nahi — is file mein bhi tabdeeli ki    ║
   ║  ijazat hai. Neeche ki fehrist ab "lock" nahi, balke       ║
   ║  takneeki rehnumai hai: tabdeeli se pehle zaroor parh lein ║
   ║  (pehle ki ghaltiyan dobara na hon).                       ║
   ╚═══════════════════════════════════════════════════════════╝

   ═══ SAB SE AHEM USOOL ═══
   Naap ka POORA kaam SIRF _ch173Layout() se hota hai, aik pakki tarteeb mein:
       1. _ch173FitPaper    — safha kaghaz ki naap par + dabba khirki tak
       2. _ch173AutoFitCols — khanon ki chaurai
       3. _ch173AutoSize    — chaurai + lambai (matn ke mutabiq)
       4. _ch173RoundRow    — qatar ko POORI satron par gol (yahin gap khatam)
       5. _ch173StretchRow  — sirf tab jab table ke neeche kuch bhi na ho
       6. _ch173OverflowSettle — matn jama do
       7. _ch173WrapCnics / _ch173AlignSho
   In mein se koi kaam ALAG SE (apne waqt par) na chalaya jaye. Pehle yeh
   bikhre hue chalte the aur aik doosre ki naap badal dete the — isi se
   pehli dafa matn chhupa milta tha aur doosri dafa gap reh jata tha.

   1) KAGHAZ
      • لیگل/فولیو = 8.5in × 13in  |  A4 = 8.27in × 11.7in
      • Ooper/neeche margin 1cm; side margin: لیگل 0.2cm | A4 0.5cm
        → SIRF _ch173SideMargin() se (aik hi jagah, screen aur print dono)
      • Safha SHURU se hi kaghaz ki chaurai par khulta hai (container par
        nirbhar nahi) — warna doosri tabs ke saath matn chhup jata tha.
      • Safha kabhi BARA na kiya jaye (scale <= 1) — warna neeche fazool
        khali patti ban jati hai. Bara dekhna ho to browser ka zoom.
      • doc-viewer.js mein '#dio-dv-body #ch173-doc{width:100%!important}'
        DOBARA NA daala jaye — wohi asal mujrim tha (safha 1244px ho jata tha).

   2) TABLE
      • کالم 1 تا 6 — chaurai aur lambai KHUD-KAR (matn ke mutabiq).
        Naap lene se PEHLE tamam pabandiyan hatai jati hain, warna tang khane
        ki naap chhoti nikalti hai aur khana har dafa aur tang hota jata hai.
      • کالم 7 ke liye kam az kam 22% chaurai hamesha mehfooz.
      • Qatar ki unchai poori satron par GOL hoti hai → gap sifar.
      • "ملزمان" ke neeche wali lakeer kheenchi ja sakti hai (rowgrip-top).

   3) KHADI LIKHAYI (columns 1–6)
      • .rotinner = writing-mode:vertical-rl + display:block + text-align:start
      • FLEX aur transform:rotate yahan HARGIZ nahi. sideways-lr Chrome mein
        nahi chalta (sirf Firefox).

   4) NAAM + CNIC
      • Tarteeb: نمبر شمار + NAAM pehle, phir CNIC.
      • Har satar apne khane (.ln) mein: naam OOPER, CNIC NEECHE → tamam CNIC
        AIK SEEDH mein. CNIC ka rukh ooper se neeche, LTR.
      • CNIC dashes ke saath AUR baghair, dono shaklon mein pehchana jata hai.
      • Yeh lapet SIRF dikhane ke liye — save se pehle _ch173UnwrapCnics se
        khul jati hai, database mein hamesha SAADA matn.

   5) کالم 7 aur نیچے والا متن
      • Satron ka fasla (line-height) = 1.5 — کالم 7 aur cont_text DONO ka.
      • Matn lafz-ba-lafz neeche jata hai AUR lafz-ba-lafz wapas bhi aata hai
        (table bari/chhoti karne par). Poora tukra na uthaya jaye.
      • _ch173StripSpan in khanon par KABHI na lagaya jaye — woh </div> aur
        </span> hata deta hai aur matn ka beech ka hissa chhup jata hai.
      • Khane ke aakhir ki khali satren khud hat jati hain.

   6) تفصیل کاغذات
      • Fehrist localStorage mein, HAR qism ki alag:
        مکمل/نامکمل/512/انٹیرم = aik (17 kaghaz default) | تتمہ | اخراج | عدم پتہ
      • KHALI fehrist ko "mehfooz shuda" na mana jaye (warna default wapas
        nahi aate). Purani 7-wali default fehrist khud nayi par aa jati hai.
      • ▾ se: naam badalna, ＋ naya, ▲▼ tarteeb, ✕ hatana, ↑↓ aur Ctrl+↑↓
      • Har kaghaz: naam UNDERLINED + neeche BEECH mein tadaad ka khana
        (width:2.6em; margin:0 auto — warna aik taraf ho jata hai)
      • Kaghaz ke darmiyan Tab = 0.635cm (4 spaces). Fehrist justified.
      • Rukh PAKKA RTL (direction:rtl !important) — app-core.js ka aam qanoon
        'unicode-bidi:plaintext' warna tarteeb ulat deta hai.

   7) SHO ki lines
      • Pehli line bayen kinare par "behti" hai (float) aur kaghaz us ke
        ird-gird se guzar kar us ke NEECHE bhi chale jate hain.
      • Pehli line theek AIK SATAR neeche (تاریخ wali jagah par) — naap satar
        se khud li jati hai. Doosri line tamam kaghazon ke neeche, us ke
        ooper 0.6cm (dastkhat ke liye).
      • Izafi matn aur تفصیل کاغذات ke darmiyan AIK satar ki jagah.

   8) CHAPAI
      • Chapai wahi naql leti hai jo screen par hai — naap DOBARA na li jaye
        (screen aur print ki chaurai bilkul barabar 801px hai).
      • Misal bandhne ki tikoni jagah: doosre safhe se, ooper bayen kone mein,
        dono bazoo 2-2 inch; matn us se bach kar behta hai. Sirf chapai mein.

   9) LIKHNE aur SAFHON ke USOOL (aakhir mein tay hue)
      • کالم 7 mein likhte waqt: agar khana BHARA NAHI to matn hilaya hi na
        jaye. Bhar jaye to matn neeche bhejo aur cursor THEEK USI jagah wapas
        (aakhir par nahi) — warna cursor matn ke SHURU par chala jata tha.
      • Matn wapas laate waqt neeche ke SHURU ke khali nishan (<br>/khali
        tukre) HATA diye jate hain — warna woh poori satar kha kar kaam pehle
        hi qadam par rok dete the aur aakhri satar adhoori reh jati thi.
        (Khali JAGAH na hatai jaye — warna lafz aapas mein jud jate hain.)
      • Chapai mein safhe ka TOR khud lagaya jata hai (.ch173-pgbrk) — browser
        ka apna tor satar ke beech mein padta tha aur nastaleeq ke huroof kat
        jate the. Saath orphans/widows = 2.
      • Chips ki patti چالان mein chhupti hai aur cursor ooper jane par nazar
        aati hai — magar woh TOOLBAR ke NEECHE se khulti hai (overlay), taake
        toolbar apni jagah se hile nahi aur button dabaya ja sake.

  10) AAM USOOL
      • Har tabdeeli ke baad sw.js ka CACHE_NAME barhana zaroori.
      • Tareekhein sirf DD/MM/YYYY (formatDate).
      • "پنجاب پولیس" ka koi عنوان kahin nahi.
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
    /* ═══ AHEM — QISM BHI MILNI CHAHIYE ═══
       Pehle yahan sirf id dekhi jati thi. Afsar aik محفوظ چالان مکمل khol
       kar قسم ki fehrist se «اخراج» chun leta to `_r173DocId` wohi purana
       reh jata aur اخراج ka فارم چالان مکمل ke data se BHAR jata tha — aur
       «محفوظ کریں» dabate hi wohi purani satar UPDATE ho kar چالان مکمل
       HAMESHA ke liye khatam ho jata tha (us ka report_type ikhraj ban jata).
       Ab id ke saath qism (aur ورژن / ذیلی qism) bhi milni zaroori hai. */
    if (d && d.form_data && _r173DocMatches(d)) return d.form_data;
  }
  return _r173Records[fallbackKey] || {};
}

// Khula hua record mojooda قسم/ورژن ka hi hai?
function _r173DocMatches(d) {
  if (!d) return false;
  if (String(d.type || '') !== String(_r173Type || '')) return false;
  if (_r173Type === 'tatima_challan') return String(d.subtype || 'aslha') === String(_r173Subtype || 'aslha');
  if (R173_BLANK_TYPES.includes(_r173Type)) {
    const dv = (d.subtype === 'cross_version') ? 'cross_version' : 'fir';
    return dv === _ch173Version;
  }
  return true;
}

/* ═══ CHAABI — AIK HI JAGAH SE ═══
   Pehle chaabi teen jagah teen tarah banti thi:
     load   → 'tatima_challan_aslha'        (bina ورژن)
     render → 'tatima_challan_aslha::fir'   (ورژن ke saath)
     save   → 'tatima_challan_aslha::fir'
   Natija: تتمہ چالان محفوظ kar ke app dobara kholne par فارم KHALI khulta
   tha, aur phir se محفوظ karne par DOOSRI satar ban jati thi.
   تتمہ ki ورژن ڈیٹا بیس mein rakhi hi nahi ja sakti (wahan `report_subtype`
   mein ذیلی qism hoti hai), is liye تتمہ ki chaabi mein ورژن nahi aati. */
function _r173Key(type, subtype, version) {
  if (type === 'tatima_challan') return 'tatima_challan_' + (subtype || 'aslha');
  return String(type || 'mukammal') + '::' + (version === 'cross_version' ? 'cross_version' : 'fir');
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
const R173_BLANK_TYPES = ['mukammal','namukammal','ch512','tatima_challan','interim','ikhraj','adampata'];

// تتمہ چالان ka ذیلی (sub) menu — koi cheez repeat na ho.
const R173_TATIMA_SUBS = [
  { id:'aslha',    name:'اسلحہ' },
  { id:'sharab',   name:'شراب' },
  { id:'chars',    name:'چرس' },
  { id:'ice',      name:'آئس' },
  { id:'zina',     name:'زنا/ڈی این اے (DNA)' },
  { id:'antirape', name:'انٹی ریپ ایکٹ' },
];

const R173_TATIMA_BOILER = {
  // Khali — owner khud set karega
  aslha: 'جناب عالیٰ! مختصر حالات مقدمہ اس طرح ہیں کہ مقدمہ ہذا میں قبل ازیں ملزم مندرجہ خانہ نمبر3کے خلاف چالان نامکمل مرتب ہو چکاہے اب PFSA لاہور سے رزلٹ نمبری {{RESULT}} موصول ہوا ہے جس پر جناب ایگزامینر صاحب نے بحروف انگریزی ذیل رائے تحریرفرمائی ہے ۔<br>"The item P1 pistol was examined and found to be in mechanical operating condition"<br>رزلٹ میں پارسل کو item P1 سے ظاہرکیاگیاہے لہٰذا مقدمہ ہذامیں ملزم بالاکے خلاف تتمہ چالان مکمل مرتب ہو کرارسال خدمت ہے سماعت فرمائی جائے ۔',
  chars: 'جناب عالیٰ! مقدمہ ہذا میں قبل ازیں ملزم مندرجہ خانہ نمبر 3 کے خلاف چالان نامکمل مرتب ہو چکا ہے PFSA لاہور سے موصولہ متعلقہ مقدمہ ہذا ایک رزلٹ نمبر {{RESULT}} موصول ہوا ہے جس پر جناب ایگزامینر صاحب نے بحروف انگریزی ذیل رائے تحریر فرمائی ہے۔<br>"Sample 01 having net weight ______ grams of dark brown resinous material in sealed parcel contains Chars. Sample is Narcotic Drug as defined in the section 2 of the CNS Act, 1997."<br>تصدیق چرس ہو چکی ہے لہٰذا مقدمہ ہذا میں ملزم بالا کے خلاف تتمہ چالان مکمل مرتب ہو کر ارسال خدمت ہے سماعت فرمائی جائے۔',
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
  _ch173Accused = null; _ch173Witnesses = null; _ch173FirMatn = null;   // naye case ki list
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

// v560: اسی آلے کا زیرِ التوا چالان (p) بمقابلہ سرور (r) — ضمنی (_zimniPickVersion) والا اصول
function _r173PickVersion(p, r) {
  if (!p) return r;
  const ls = String(p.saved || ''), ss = String(r.saved || '');
  if (ls && ls === ss && !p._conflict) return r;
  if (p._conflict) return Object.assign({}, p, { _conflict: r });
  if (p.rev != null && r.rev != null) return Number(r.rev) > Number(p.rev) ? Object.assign({}, p, { _conflict: r }) : p;
  return (ls && ls >= ss) ? p : r;
}
function _r173LocalPut(caseId) {
  try { localStorage.setItem('dio_r173_'+caseId, JSON.stringify(_r173Records)); } catch(_) { if (typeof dioLogError === 'function') dioLogError('challan: local copy save nakaam', _); }
  try { localStorage.setItem('dio_r173docs_'+caseId, JSON.stringify(_r173Docs)); } catch(_) { if (typeof dioLogError === 'function') dioLogError('challan: local list save nakaam', _); }
}
// ایک چالان سرور پر — نیا (اپنی مستقل شناخت سے؛ دوبارہ بھیجنے پر دوہرا نہیں) یا ترمیم (rev کے ساتھ)
async function _r173Push(caseId, d) {
  const rec = { case_id: caseId, report_type: d.type, form_data: d.form_data || {} };
  if (d.subtype) rec.report_subtype = d.subtype;
  try { const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null; if (oid) rec.officer_id = oid; } catch (_) { /* officer id */ }
  if (window.DIOSync) rec.last_device = DIOSync.device();
  const legacy = /^(local-|tmp_)/.test(String(d.id));
  let res;
  if (d._new || legacy) {
    rec.id = legacy ? (window.DIOSync ? DIOSync.uuid() : undefined) : d.id;
    if (!rec.id) delete rec.id;
    res = await supabaseClient.from('report_173').insert(rec).select().single();
    if (res.error && String(res.error.code) === '23505' && rec.id) {
      const r2 = Object.assign({}, rec); delete r2.id;
      res = await supabaseClient.from('report_173').update(r2).eq('id', rec.id).select().single();
    }
    if (res.error) throw res.error;
  } else {
    let q = supabaseClient.from('report_173').update(rec).eq('id', d.id);
    const useRev = d.rev != null && !isNaN(Number(d.rev));
    if (useRev) q = q.eq('rev', Number(d.rev));
    res = await q.select();
    if (res.error) throw res.error;
    if (!res.data || !res.data.length) {
      if (useRev && window.DIOSync) {
        const w = await DIOSync.whyNoRow('report_173', d.id);
        if (w.exists) {
          const srv = DIOSync.r173Item(w.row);
          // یہی تحریر (اسی «محفوظ کرنے کے وقت» کی) پہلے ہی سرور پر — دوبارہ بھیجنا، ٹکراؤ نہیں
          if (!w.row.deleted_at && d.saved && String(srv.saved) === String(d.saved)) { delete srv.deleted_at; return srv; }
          throw DIOSync.conflictError(srv, 'چالان');
        }
      }
      const e = new Error('سرور پر یہ چالان نہیں ملا یا ترمیم کی اجازت نہیں'); e.code = 'DIO_NOROW'; throw e;
    }
    res = { data: res.data[0] };
  }
  const out = window.DIOSync ? DIOSync.r173Item(res.data) : Object.assign({}, d, { id: res.data.id });
  delete out.deleted_at;
  return out;
}
// زیرِ التوا چالان (کسی بھی مقدمے کے) سرور پر — ایپ پر واپسی / انٹرنیٹ آتے ہی / ہر منٹ
let _r173SyncBusy = false;
async function _r173SyncPending() {
  if (window.DIO && DIO.sub && typeof DIO.sub.blocked === 'function' && DIO.sub.blocked()) return 0;   // v561: صرف دیکھنا — تجدید تک یہیں
  if (_r173SyncBusy || !navigator.onLine || typeof supabaseClient === 'undefined' || !supabaseClient) return 0;
  try { const s0 = await supabaseClient.auth.getSession(); if (!s0 || !s0.data || !s0.data.session) return 0; } catch (_) { return 0; }
  _r173SyncBusy = true;
  let done = 0, clashes = 0, failed = 0, why = '';
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ''; if (/^dio_r173docs_/.test(k)) keys.push(k); }
    for (const k of keys) {
      const cid = k.slice('dio_r173docs_'.length);
      let list = [];
      try { list = JSON.parse(localStorage.getItem(k) || '[]') || []; } catch (_) { continue; }
      for (const d of list.filter(x => x && !x._conflict && (x._pending || /^(local-|tmp_)/.test(String(x.id))))) {
        try {
          const nd = await _r173Push(cid, d);
          const fresh = JSON.parse(localStorage.getItem(k) || '[]') || [];
          const j = fresh.findIndex(x => String(x.id) === String(d.id));
          if (j >= 0) fresh[j] = (String(fresh[j].saved || '') === String(d.saved || '')) ? nd : Object.assign({}, fresh[j], { id: nd.id, rev: nd.rev, _new: false, _pending: true });
          localStorage.setItem(k, JSON.stringify(fresh));
          if (String(cid) === String(_r173CaseId)) {
            const m = _r173Docs.findIndex(x => String(x.id) === String(d.id));
            if (m >= 0) _r173Docs[m] = fresh[j] || nd;
            if (String(_r173DocId) === String(d.id)) _r173DocId = nd.id;
          }
          done++;
        } catch (e) {
          if (typeof _dioIsNetErr === 'function' && _dioIsNetErr(e)) return done;
          if (e && e.code === 'DIO_CONFLICT') {
            clashes++;
            const fresh = JSON.parse(localStorage.getItem(k) || '[]') || [];
            const j = fresh.findIndex(x => String(x.id) === String(d.id));
            if (j >= 0) { fresh[j] = Object.assign({}, fresh[j], { _conflict: e.server }); localStorage.setItem(k, JSON.stringify(fresh)); }
            if (String(cid) === String(_r173CaseId)) { const m = _r173Docs.findIndex(x => String(x.id) === String(d.id)); if (m >= 0) _r173Docs[m] = Object.assign({}, _r173Docs[m], { _conflict: e.server }); }
            continue;
          }
          failed++; why = (window.DIO && DIO.errors && DIO.errors.userMessage) ? DIO.errors.userMessage(e) : String((e && e.message) || e);
        }
      }
    }
  } finally { _r173SyncBusy = false; }
  try {
    if (done) showToast(done + ' چالان سرور پر محفوظ (sync) ہو گئے', 'success', 4000);
    if (clashes) showToast(clashes + ' چالان دو آلات پر الگ الگ بدلے گئے — دونوں نسخے محفوظ؛ فہرست میں «دو نسخے» پر کلک کر کے چنیں', 'warn', 9000);
    if (failed && why !== window._r173LastWhy) showToast(failed + ' چالان سرور پر نہیں گئے — وجہ: ' + why + ' (اس آلے پر محفوظ ہیں)', 'error', 9000);
    window._r173LastWhy = failed ? why : '';
    if ((done || clashes) && document.querySelector('.r173-list-wrap')) _renderR173List();
  } catch (_) { /* paigham */ }
  return done;
}
window._r173SyncPending = _r173SyncPending;
setInterval(() => { try { if (navigator.onLine) _r173SyncPending(); } catch (_) { /* agli dafa */ } }, 60000);

async function _loadR173() {
  if (!navigator.onLine) {
    try { _r173Records = JSON.parse(localStorage.getItem('dio_r173_'+_r173CaseId)||'{}'); } catch(_) { _r173Records={}; }
    // Fehrist bhi cache se — warna offline par "کوئی اندراج نہیں" dikhta tha
    try { _r173Docs = JSON.parse(localStorage.getItem('dio_r173docs_'+_r173CaseId)||'[]').filter(d => d && !d.deleted_at); } catch(_) { _r173Docs = []; }
    return;
  }
  try {
    // v560: «حذف» = نشان — حذف شدہ نہیں؛ اسی آلے کے زیرِ التوا چالان (سرور پر جانا باقی / دو نسخے) ساتھ رہیں
    const { data, error } = await supabaseClient.from('report_173').select('*').eq('case_id', _r173CaseId).is('deleted_at', null);
    if (error) throw error;
    let localDocs = [];
    try { localDocs = JSON.parse(localStorage.getItem('dio_r173docs_'+_r173CaseId)||'[]') || []; } catch(_) { localDocs = []; }
    const pend = {};
    localDocs.forEach(d => { if (d && (d._pending || d._conflict || /^(local-|tmp_)/.test(String(d.id)))) pend[String(d.id)] = d; });
    _r173Records = {};
    _r173Docs = (data || []).map(r => {
      // چالان ki apni تاریخ (SHO wali). Pehle yahan FIR ki مورخہ aa rahi thi,
      // is liye har satar par aik hi تاریخ dikhti thi.
      const srv = (window.DIOSync && DIOSync.r173Item) ? DIOSync.r173Item(r) : {
        id: r.id, type: r.report_type, subtype: r.report_subtype || '', head: (r.form_data && r.form_data.head) || '',
        form_data: r.form_data || {}, date: (r.form_data && (r.form_data.sho_date2 || r.form_data.sho_date)) || (r.created_at ? String(r.created_at).slice(0,10) : ''),
        saved: (r.form_data && r.form_data.saved_at) || r.updated_at || r.created_at || '' };
      delete srv.deleted_at;
      const p = pend[String(r.id)];
      if (p) { delete pend[String(r.id)]; return _r173PickVersion(p, srv); }
      return srv;
    });
    Object.keys(pend).forEach(k => _r173Docs.push(pend[k]));
    (data||[]).forEach(r => {
      // Chaabi bilkul waisi jaisi SAVE aur RENDER banate hain — aik hi jagah se
      _r173Records[_r173Key(r.report_type, r.report_subtype, r.report_subtype)] = r.form_data || {};
    });
    _r173LocalPut(_r173CaseId);
  } catch(_) {
    try { _r173Records = JSON.parse(localStorage.getItem('dio_r173_'+_r173CaseId)||'{}'); } catch(_2) { _r173Records={}; }
    try { _r173Docs = JSON.parse(localStorage.getItem('dio_r173docs_'+_r173CaseId)||'[]').filter(d => d && !d.deleted_at); } catch(_2) { _r173Docs = []; }
  }
}

/* قسم / ذیلی قسم badalna = DOOSRA چالان. Purana `_r173DocId` saath le jane
   se woh satar UPDATE ho kar purana چالان mit jata tha. */
function _r173Pick(type) {
  if (String(type) === String(_r173Type)) { _closeAllDD && _closeAllDD(); return; }
  _r173Type = type;
  _r173SyncDocId();
  _closeAllDD && _closeAllDD();
  _renderR173();
}
function _r173PickSub(sub) {
  if (String(sub) === String(_r173Subtype)) return;
  _r173Subtype = sub;
  _r173SyncDocId();
  _renderR173();
}

// Mojooda قسم/ورژن ka محفوظ چالان dhoondo — na mile to nayi (khali) satar
function _r173SyncDocId() {
  try {
    if (_r173DocId) {
      const cur = _r173Docs.find(x => String(x.id) === String(_r173DocId));
      if (cur && _r173DocMatches(cur)) return;
    }
    const m = _r173Docs.filter(_r173DocMatches);
    m.sort((a, b) => String(b.saved || '').localeCompare(String(a.saved || '')));
    _r173DocId = m.length ? m[0].id : null;
    _r173Head  = m.length ? (m[0].head || '') : '';
  } catch (_) { _r173DocId = null; }
}

// ── RENDER ────────────────────────────────────────────────────

// Har challan type ka apna unwan (512 ka andaz alag hai)
function _ch173Heading(type, typeName) {
  if (type === 'ch512') return 'فارم رپورٹ چالان زیردفعہ 512 ض ف';
  // اخراج / عدم پتہ ka unwan «اختتامی بصیغہ …» hai (AKHRAJ.docx ke mutabiq).
  // Durust unwan file mein mojood to tha magar us (matrook) hissay mein jahan
  // amal kabhi pohnchta hi nahi tha — kaghaz par sada «فارم رپورٹ اخراج …»
  // chhapta raha.
  if (type === 'ikhraj')   return 'فارم رپورٹ اختتامی بصیغہ اخراج زیر دفعہ 173 ض ف';
  if (type === 'adampata') return 'فارم رپورٹ اختتامی بصیغہ عدم پتہ زیر دفعہ 173 ض ف';
  return 'فارم رپورٹ ' + typeName + ' زیر دفعہ 173 ض ف';
}

function _renderR173() {
  // Anjaan qism (purani ڈیٹا بیس ki satar ya ghalat tab) — manzoor-shuda
  // فارم par le aao. Isi se neeche wala matrook safha nakabil-e-rasai sabit
  // hota hai aur usay hata dena mehfooz hai.
  if (!R173_TYPES.some(t => t.id === _r173Type)) _r173Type = 'mukammal';
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
  // Saved record key — AIK hi jagah se (`_r173Key`). Pehle yahan ورژن ke
  // BAGHAIR chaabi banti thi aur neeche ورژن ke SAATH — is liye `saved`
  // (رزلٹ نمبری waghera) aur `bs` (فارم ka jism) do alag records se aate the.
  const recKey = _r173Key(_r173Type, _r173Subtype, _ch173Version);
  const saved = _r173CurrentData(recKey);
  // کالم 7 ki shuruati تحریر: تتمہ mein — agar officer ne khud kuch nahi likha
  // to boilerplate (aslha/chars waghera ka matn) lagao. Warna jo mehfooz hai.
  // تفصیل کاغذات: تتمہ mein — agar khali ho to default kaghaz KHUD bhar do
  // (dropdown ▾ barqarar rahega, us se badal bhi sakte hain).
  const _ch173PapersInit = (sv) => {
    if (sv && sv.papers_body !== undefined &&
        String(sv.papers_body).replace(/<[^>]*>/g, '').trim().length) {
      return sanitizeHtml(sv.papers_body);           // pehle se kuch hai
    }
    // HAR qism (چالان مکمل/نامکمل/512/انٹیرم، تتمہ، اخراج، عدم پتہ) mein
    // form KHALI khulta hai — kaghaz KHUD-BA-KHUD na bharen. Tafteeshi afsar
    // dropdown (▾) se apni zaroorat ke mutabiq khud chun kar lagayega.
    // Har qism ki apni default fehrist dropdown mein maujood rehti hai.
    return sv && sv.papers_body !== undefined ? sanitizeHtml(sv.papers_body) : '';
  };
  const _ch173HalaatInit = (sv, boil) => {
    const cur = (sv && sv.halaat !== undefined) ? String(sv.halaat) : '';
    const khali = !cur.replace(/<[^>]*>/g, '').replace(/[\s\u00A0]/g, '').length;
    if (_r173Type === 'tatima_challan' && khali) return sanitizeHtml(boil || '');
    // اخراج / عدم پتہ: agar officer ne kuch nahi likha to FIR ka matn khud
    // bhar do (bilkul چالان jaisa). Matn baad mein _ch173FillHalaat/LoadFirMatn
    // se bhi aata hai; yahan pehli render par bhi laga do agar mojood ho.
    if ((_r173Type === 'ikhraj' || _r173Type === 'adampata') && khali) {
      try {
        const ft = _ch173FirText();
        if (ft) return sanitizeHtml(R173_HALAAT_START + ft + R173_HALAAT_END);
      } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    }
    return sanitizeHtml(sv && sv.halaat !== undefined ? sv.halaat : (boil || ''));
  };
  const isIkhraj = _r173Type === 'ikhraj';
  const isAdampata = _r173Type === 'adampata';
  // اخراج / عدم پتہ apni 3-column (نمبر شمار / تفصیل / قدر) 8-row table par
  // اخراج/عدم پتہ ab CHALAN path par (izafi matn, تفصیل کاغذات, SHO, agla
  // safha, data fetch, alfaz — SAB چالان jaise). Farq SIRF table ka:
  // چالان ki 7-column vertical table ki jagah اخراج ki 3-column table.
  const _isAkhraj = isIkhraj || isAdampata;    // sirf table + heading ke liye
  const _origClosing = _isAkhraj;   // heading اخراج/عدم پتہ ke liye
  // Boilerplate: tatima uses subtype boiler, others use type boiler
  let boiler = isTatima ? (R173_TATIMA_BOILER[_r173Subtype]||'') : (R173_BOILER[_r173Type]||'');
  // Result number ki jagah — {{RESULT}} ko asal number se badlo (khali ho to
  // likhne ki jagah _____ chhor do)
  const _rno = (saved.result_no || '').trim();
  if (boiler) boiler = boiler.replace(/\{\{RESULT\}\}/g, _rno || '____________');

  // ── CHALLAN types: koi format software NAHI deta ──────────────────────
  // چالان مکمل / نامکمل / 512 ض ف / تتمہ چالان — yeh sarkari manzoor-shuda
  // forms hain jinke khane pehle se muqarrar hote hain. Software apni taraf se
  // koi format, khana ya button nahi dega — sirf khali safed kaghaz. Owner/admin
  // khud manzoor-shuda form set karega.
  if (R173_BLANK_TYPES.includes(_r173Type)) {
    // ملزمان aur گواہان case record se — dropdown + auto-fill ke liye
    if (!_ch173Accused) _ch173LoadPeople();
    // ═══ فارم نمبر 25.56(1) — رپورٹ زیر دفعہ 173 ض ف ═══
    // (FIR aur کراس ورژن ka data alag — yeh farq `_r173Key` mein hai)
    const bs = _r173CurrentData(recKey);
    _r173ForceBlank = false;          // sirf aik bar
    const bv = (k) => _ch173StripSpan(sanitizeHtml(bs[k] !== undefined ? bs[k] : ''));
    // Mehfooz shuda column widths (MS Word jaisi drag-adjust ke baad)
    let savedW = (() => { try { return JSON.parse(bs.col_widths || 'null'); } catch(_) { return null; } })();
    // Agar mehfooz naap bilkul PURANI default jaisi hai (yani officer ne khud
    // drag kar ke nahi badli), to usay nayi default par le aao — warna purane
    // چالان par کالم 1 hamesha chaura hi rehta.
    try {
      const OLD_W = [13, 13, 11, 12, 5, 21, 25];
      if (Array.isArray(savedW) && savedW.length === OLD_W.length &&
          savedW.every((v, i) => Math.abs((parseFloat(v) || 0) - OLD_W[i]) < 0.51)) {
        savedW = null;
      }
    } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    // کالم 1 (مدعی) mein sirf aik shakhs ka naam + CNIC aata hai, is liye
    // woh tang rakha gaya hai; bachi hui jagah کالم 7 (حالات) ko di gayi hai.
    const W = savedW || [9, 13, 11, 12, 5, 21, 29];
    // کالم 1 ki chaurai PAKKI hai — 1.5cm. Yeh mehfooz naap se bhi nahi
    // badalti aur kheench kar bhi nahi badli ja sakti (neeche grip band hai).

    area.innerHTML = `
    <style>${_ch173CSS()}</style>
    <div style="display:flex;flex-direction:column;height:100%;direction:rtl;">
      <div class="no-print" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);flex-wrap:wrap;background:var(--bg-secondary);">
        <select id="r173-type-sel" onchange="_r173Pick(this.value)" style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;">
          ${R173_TYPES.map(t => `<option value="${t.id}" ${t.id===_r173Type?'selected':''}>${t.name}</option>`).join('')}
        </select>
        ${_r173Type === 'tatima_challan' ? `
        <select id="r173-sub-sel" onchange="_r173PickSub(this.value)" style="padding:6px 10px;border:1px solid var(--amber,#d97706);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;">
          ${R173_TATIMA_SUBS.map(sb => `<option value="${sb.id}" ${sb.id===_r173Subtype?'selected':''}>${sb.name}</option>`).join('')}
        </select>
        <input id="r173-result-no" type="text" value="${esc(saved.result_no || '')}"
          oninput="_ch173SetResultNo(this.value)"
          placeholder="رزلٹ نمبری"
          style="padding:6px 10px;border:1px solid var(--amber,#d97706);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;width:140px;"
          title="رزلٹ نمبری — تحریر اور تفصیل کاغذات دونوں جگہ خودبخود لگ جائے گا">` : ''}
        <!-- "ہیڈ منتخب کریں" wali fehrist filhaal hata di gayi hai (zaroorat nahi).
             Zaroorat par wapas lagane ke liye: yahan select dobara daal dein —
             _r173SetHead() aur R173_HEADS / R173_IKHRAJ_HEADS mojood hain. -->
        <select id="ch173-ver-sel" onchange="_ch173SetVersion(this.value)" title="ورژن"
          style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;">
          <option value="fir" ${_ch173Version==='fir'?'selected':''}>FIR</option>
          ${(typeof caseHasCross==='function' && caseHasCross(c))
            ? `<option value="cross_version" ${_ch173Version==='cross_version'?'selected':''}>کراس ورژن</option>` : ''}
        </select>
        <!-- v553: لیگل/A4 کا انتخاب یہاں سے ہٹا — پرنٹ کے وقت پوچھا جاتا ہے (dioWithPaper) -->
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
          <button id="r173-save-btn" class="btn btn-primary btn-sm dio-modbtn" onclick="_saveR173()">💾 محفوظ کریں</button>
          <button class="btn btn-secondary btn-sm dio-modbtn" onclick="_printR173()">🖨️ پرنٹ کریں</button>
        </div>
      </div>
      <div style="flex:1;overflow:auto;min-height:0;padding:16px;background:var(--bg-tertiary);">
        <div id="ch173-doc" style="width:${_ch173Paper==='a4'?'8.27in':'8.5in'};max-width:none;min-height:${_ch173Paper==='a4'?'11.7in':'13in'};margin:0 auto;
             padding:1cm ${_ch173SideMargin()};
             background:#fff;box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:4px;
             line-height:1.4;box-sizing:border-box;">

          <div class="ch173-title-row"><span></span><span class="form-no">FORM No. ${_r173Type === 'adampata' ? '25.57(2)' : '25.56(1)'}</span><span></span></div>
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

          ${_isAkhraj ? `
          <!-- اخراج / عدم پتہ ki apni 3-column table (AKHRAJ.docx jaisi).
               Baqi sab (izafi matn, تفصیل کاغذات, SHO, agla safha) چالان jaisa. -->
          <table class="ch173-table ch173-akhraj-table" id="ch173-table" style="width:100%;border-collapse:collapse;">
            <colgroup>
              <col style="width:7%"><col style="width:32%"><col style="width:61%">
            </colgroup>
            <tbody>
              ${(() => {
                // اخراج/عدم پتہ ke liye مدعی — CNIC aur numbering ke BAGHAIR
                // (چالان se alag; چالان mein 1۔ aur CNIC rehta hai).
                const cross0 = (_ch173Version === 'cross_version');
                const nm0 = String((cross0 ? (c.cross_complainant || c.cross_complainant_name)
                                            : (c.complainant || c.complainant_name)) || '').trim();
                const addr0 = String((cross0 ? c.cross_complainant_address : c.complainant_address) || '').trim();
                const autoMadai = nm0 ? (nm0 + (addr0 ? ' ساکن ' + addr0 : '')) : '';
                const autoJurm  = (c.section_of_law||'').trim();   // صرف دفعات (v544)
                const DASH = '-----------';
                const rows = [
                  ['madai_i','نام وپتہ مدعی و مستغیث', autoMadai],
                  ['jurm_i','مختصر کیفیت جرم', autoJurm],
                  ['masruqa_i','تفصیل مال مسروقہ اگر کوئی ہو', DASH],
                  ['namzad_i','تفصیل ملزمان نامزد', DASH],
                  ['giraftar_i','تفصیل ملزمان گرفتار شدہ', DASH],
                  ['raha_i','تفصیل ملزمان رہا شدہ', DASH],
                  ['baramad_i','تفصیل مال برآمدہ مقبوضہ پولیس', DASH]
                ];
                return rows.map((r,i) => {
                  const val = bs[r[0]] !== undefined ? sanitizeHtml(bs[r[0]]) : esc(r[2]);
                  // Row 2 (مختصر کیفیت جرم): jurm CENTER, aur 'ت پ' jurm ke SAATH
                  // us ke bayen kinare par (jahan jurm khatam ho wahin).
                  if (r[0] === 'jurm_i' && bs[r[0]] === undefined) {
                    const jp = _ch173JurmParts(c.section_of_law);
                    // Upar wali (caseline) jaisa hi format: body phir space phir ت پ
                    return `<tr>
                    <td style="border:1px solid #000;padding:6px;text-align:center;font-weight:bold;">${i+1}</td>
                    <td class="akh-col2" style="border:1px solid #000;padding:6px;font-weight:600;text-align:justify;text-align-last:right;direction:rtl;position:relative;"><span class="akh-grip no-print" ondblclick="_ch173AkhrajResetCol()" title="لکیر کو کھینچ کر چوڑائی بدلیں · دو بار کلک = خودکار"></span>${r[1]}</td>
                    <td class="normcell" contenteditable="true" data-k="${r[0]}" style="border:1px solid #000;padding:6px;text-align:center;direction:rtl;unicode-bidi:plaintext;"><span style="unicode-bidi:isolate;direction:rtl;">${esc(jp.suffix)}</span> <span style="unicode-bidi:isolate;direction:ltr;">${esc(jp.body)}</span></td>
                  </tr>`;
                  }
                  // DASH (خالی) rows ka '-----------' center; row 1 (مدعی) bhi
                  // CENTER (officer ki hidayat); baqi right.
                  const isDash = (val === DASH);
                  const cellAlign = (isDash || r[0] === 'madai_i') ? 'center' : 'right';
                  return `<tr>
                    <td style="border:1px solid #000;padding:6px;text-align:center;font-weight:bold;">${i+1}</td>
                    <td class="akh-col2" style="border:1px solid #000;padding:6px;font-weight:600;text-align:justify;text-align-last:right;direction:rtl;position:relative;"><span class="akh-grip no-print" ondblclick="_ch173AkhrajResetCol()" title="لکیر کو کھینچ کر چوڑائی بدلیں · دو بار کلک = خودکار"></span>${r[1]}</td>
                    <td class="normcell" contenteditable="true" data-k="${r[0]}" style="border:1px solid #000;padding:6px;text-align:${cellAlign};direction:rtl;">${val}</td>
                  </tr>`;
                }).join('');
              })()}
              <tr class="akh-row8">
                <td style="border:1px solid #000;padding:6px;text-align:center;vertical-align:top;font-weight:bold;">8</td>
                <td class="akh-col2" style="border:1px solid #000;padding:6px;font-weight:600;text-align:justify;text-align-last:right;direction:rtl;vertical-align:top;position:relative;"><span class="akh-grip no-print" ondblclick="_ch173AkhrajResetCol()" title="لکیر کو کھینچ کر چوڑائی بدلیں · دو بار کلک = خودکار"></span>مختصر حالات مقدمہ معہ جرم</td>
                <td class="normcell" style="border:1px solid #000;padding:6px;"><div class="normwrap" contenteditable="true" data-mic="true" data-k="halaat">${_ch173HalaatInit(bs, boiler)}</div><span class="akh-hgrip no-print" title="نیچے کی لکیر کو اوپر نیچے کھینچیں"></span></td>
              </tr>
            </tbody>
          </table>` : `
          <table class="ch173-table" id="ch173-table">
            <colgroup>
              ${W.map((w) => `<col style="width:${_ch173WCss(w)}">`).join('')}
            </colgroup>
            <thead>
              <tr>
                <th rowspan="2">نام و پتہ مدعی ومستغیث</th>
                <th rowspan="2">ملزمان جو گرفتارنہ ہوئے</th>
                <th colspan="2">ملزمان</th>
                <th rowspan="2" class="vcell rotcell"><div class="cellbox"><div class="rotclip"><div class="rotinner rothead">مال قبضہ پولیس</div></div></div></th>
                <th rowspan="2">تفصیل شہادت</th>
                <th rowspan="2">مختصر حالات مقدمہ معہ جرم<br>مندرجہ بالا</th>
              </tr>
              <tr>
                <th class="hcell">زیر حراست</th>
                <th class="hcell">برضمانت</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="rotcell"><div class="cellbox"><div class="rotclip"><div class="rotinner" contenteditable="true" data-k="madai">${bs.madai !== undefined ? sanitizeHtml(_ch173StripSpan(bs.madai)) : esc(_ch173MudaiLine(c))}</div></div></div></td>
                <td class="rotcell"><div class="cellbox"><div class="rotclip"><button class="acc-pick no-print" onclick="_ch173AccPicker(event,'ghair_giraftar')" title="ملزمان منتخب کریں">▾</button><div class="rotinner" contenteditable="true" data-k="ghair_giraftar">${bv('ghair_giraftar')}</div></div></div></td>
                <td class="rotcell"><div class="cellbox"><div class="rotclip"><button class="acc-pick no-print" onclick="_ch173AccPicker(event,'zer_hirasat')" title="ملزمان منتخب کریں">▾</button><div class="rotinner" contenteditable="true" data-k="zer_hirasat">${bv('zer_hirasat')}</div></div></div></td>
                <td class="rotcell"><div class="cellbox"><div class="rotclip"><button class="acc-pick no-print" onclick="_ch173AccPicker(event,'bar_zamanat')" title="ملزمان منتخب کریں">▾</button><div class="rotinner" contenteditable="true" data-k="bar_zamanat">${bv('bar_zamanat')}</div></div></div></td>
                <td class="rotcell"><div class="cellbox"><div class="rotclip"><div class="rotinner" contenteditable="true" data-k="mal_qabza">${bv('mal_qabza')}</div></div></div></td>
                <td class="rotcell"><div class="cellbox"><div class="rotclip"><div class="rotinner" contenteditable="true" data-k="shahadat">${bs.shahadat !== undefined ? sanitizeHtml(_ch173StripSpan(bs.shahadat)) : esc(_ch173WitnessText())}</div></div></div></td>
                <td class="normcell"><div class="normwrap" contenteditable="true" data-mic="true" data-k="halaat">${_ch173HalaatInit(bs, boiler)}</div></td>
              </tr>
            </tbody>
          </table>`}

          <!-- خانہ 1: باقی متن (اوپر والے کالم سے خود آتا ہے) — تسلسل/overflow -->
          <div class="ch173-cont" contenteditable="true" data-k="cont_text">${bs.cont_text !== undefined ? sanitizeHtml(bs.cont_text) : ''}</div>

          <!-- اختتامی خانہ — 2 برابر کالم (flex)
               دائیں: تفصیل کاغذات + لکھنے کی جگہ | بائیں: SHO/تاریخ (اوپر اور نیچے)
               دونوں کالم ہمیشہ برابر چوڑے، اور ایک ساتھ ہی نیچے بڑھتے ہیں -->
          <div class="ch173-sho-flex">
            <!-- SHO ki PEHLI line bayen kinare par; kaghaz is ke ird-gird beh
                 kar poori chaurai lete hain aur is ke neeche bhi chale jate
                 hain (jaise asal form mein hota hai). -->
            <div class="sho-block sho-b1">
              <div class="sho-cell-row" contenteditable="true" data-k="sho_line2">${bs.sho_line2 !== undefined ? sanitizeHtml(bs.sho_line2) : (bs.sho_line !== undefined ? sanitizeHtml(bs.sho_line) : esc(_ch173ShoLine(o)))}</div>
              <div class="sho-cell-row sho-cell-date" contenteditable="true" data-k="sho_date2"
                   onclick="_ch173PickDate(this)" title="تاریخ ڈالنے کے لیے کلک کریں">${bs.sho_date2 !== undefined ? sanitizeHtml(bs.sho_date2) : (bs.sho_date !== undefined ? sanitizeHtml(bs.sho_date) : esc(_ch173Today()))}</div>
            </div>
            <div class="sho-col sho-papers">
              <div class="sho-papers-head">تفصیل کاغذات<button class="papers-pick no-print" onclick="_ch173PapersPicker(event)" title="کاغذات منتخب کریں">▾</button></div>
              <!-- AHEM: yahan bv() istemal NA karein — woh tamam </span> hata
                   deta hai aur kaghazon ka dhancha (naam + neeche tadaad)
                   toot jata hai. Seedha sanitizeHtml. -->
              <div class="sho-papers-body" contenteditable="true" data-k="papers_body">${_ch173PapersInit(bs)}</div>
            </div>
            <!-- SHO ki DOOSRI line — tamam kaghazon ke neeche, bayen kinare par -->
            <div class="sho-block sho-b2">
              <div class="sho-cell-row" contenteditable="true" data-k="sho_line5">${bs.sho_line5 !== undefined ? sanitizeHtml(bs.sho_line5) : esc(_ch173ShoLine(o))}</div>
              <div class="sho-cell-row sho-cell-date" contenteditable="true" data-k="sho_date5"
                   onclick="_ch173PickDate(this)" title="تاریخ ڈالنے کے لیے کلک کریں">${bs.sho_date5 !== undefined ? sanitizeHtml(bs.sho_date5) : esc(_ch173Today())}</div>
            </div>
          </div>

          ${_r173Type === 'ikhraj' ? `
          <!-- ═══ فہرست گواہان — ALAG KAGHAZ (sirf اخراج ke saath) ═══
               عدم پتہ ke saath yeh fehrist NAHI banti.
               Satrein: (1) تھانہ dayen kinare se 1 inch andar + ضلع bayen kinare
               par  (2) مدعی  (3) مقدمہ نمبر / تاریخ / جرم  (4) beech mein
               "فہرست گواہان" 20pt  → phir گواہان  → aakhir mein SHO + تاریخ. -->
          <div class="ch173-pgbrk"></div>
          <div class="akh-gw-page">
            <div class="akh-gw-l1">
              <span class="akh-gw-thana" contenteditable="true" data-k="gw_thana">${bs.gw_thana !== undefined ? sanitizeHtml(bs.gw_thana) : esc(_ch173GwThana())}</span>
              <span class="akh-gw-zila" contenteditable="true" data-k="gw_zila">${bs.gw_zila !== undefined ? sanitizeHtml(bs.gw_zila) : esc(_ch173GwZila())}</span>
            </div>
            <div class="akh-gw-l2" contenteditable="true" data-k="gw_madai">${bs.gw_madai !== undefined ? sanitizeHtml(bs.gw_madai) : esc(_ch173GwMadai())}</div>
            <div class="akh-gw-l3" contenteditable="true" data-k="gw_case">${bs.gw_case !== undefined ? sanitizeHtml(bs.gw_case) : esc(_ch173GwCaseLine(c))}</div>
            <div class="akh-gw-l4" contenteditable="true" data-k="gw_banam">${bs.gw_banam !== undefined ? sanitizeHtml(bs.gw_banam) : 'بنام۔'}</div>
            <div class="akh-gw-title">فہرست گواہان</div>
            <div class="akh-gw-body" contenteditable="true" data-k="gawah_body">${bs.gawah_body !== undefined ? sanitizeHtml(bs.gawah_body) : _ch173AkhrajWitnessText()}</div>
            <div class="akh-gw-sho">
              <div class="sho-cell-row" contenteditable="true" data-k="gw_sho">${bs.gw_sho !== undefined ? sanitizeHtml(bs.gw_sho) : esc(_ch173ShoLine(o))}</div>
              <div class="sho-cell-row sho-cell-date" contenteditable="true" data-k="gw_sho_date"
                   onclick="_ch173PickDate(this)" title="تاریخ ڈالنے کے لیے کلک کریں">${bs.gw_sho_date !== undefined ? sanitizeHtml(bs.gw_sho_date) : esc(_ch173Today())}</div>
            </div>
          </div>
          ` : ''}

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
      // گواہان — HAR render par. (LoadPeople sirf pehli dafa chalta hai, is
      // liye qism badalne par yeh wahan se nahi chalta tha.)
      try { _ch173FillWitnessCell(); } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      // Overflow kai martaba aazmao — khane ki asal naap CSS/font lagne ke
      // BAAD hi maloom hoti hai. Aik hi dafa chalane se matn chhupa reh
      // jata tha (khane ki naap us waqt tak 0 hoti thi).
      // Naap ka poora kaam AIK hi tarteeb se (_ch173Layout dekhein). Pehle
      // yeh paanch kaam alag alag waqton par chalte the aur aik doosre ki
      // naap badal dete the — isi se pehli dafa matn chhupa milta tha aur
      // doosri dafa gap reh jata tha.
      [250, 900, 1800].forEach(ms => setTimeout(() => {
        try { _ch173Layout(); } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      }, ms));
      // Nigrani chalu — koi matn chhupa reh jaye to khud neeche chala jaye
      try { _ch173StartOverflowWatch(); } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      // تتمہ چالان mein boilerplate rehne do — FIR ka matn na uthao
      if (_r173Type !== 'tatima_challan') {
        if (_ch173FirMatn === null) _ch173LoadFirMatn(); else _ch173FillHalaat();
      }
      // Khanon ki naap SIRF AIK DAFA — matn poori tarah lag jane ke baad.
      // (Baar baar chalane se har dafa khana aur tang hota chala jata tha.)
      setTimeout(() => { try { _ch173AutoSize(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } }, 900);
      window.addEventListener('resize', _ch173SizeRotated);
      // Mehfooz shuda row height wapas lagao
      try {
        const rh = bs.row_height;
        if (rh) document.querySelectorAll('#ch173-table tbody td').forEach(td => td.style.height = rh);
        _ch173SizeRotated();
      } catch(_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
      // Mehfooz shuda فونٹ سائز wapas lagao.
      // AHEM: pehle yahan shart thi "agar df 14 ke ILAWA ho" — is liye 14 par
      // koi INLINE naap lagti hi nahi thi aur doc sirf CSS ke bharose rehta tha.
      // Us soorat mein baad mein aane wale per-cell (purane 12pt) font us par
      // hawi ho jate the. Ab font HAR HAAL mein poore doc par lagta hai.
      try {
        const df = _ch173DocFont(bs);
        if (df) _ch173FontToDoc(df);
        const _fsel = document.getElementById('ch173-font-sel');
        if (_fsel && df) _fsel.value = String(df);
      } catch(_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
      // Cursor ke mutabiq dropdown khud badalta rahe (MS Word jaisa)
      try {
        if (!window._ch173FontSelBound) {
          window._ch173FontSelBound = true;
          document.addEventListener('selectionchange', _ch173SyncFontSel);
        }
      } catch(_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
      // Format painter — naye safhe par band halat se shuru
      try { _ch173BrushOff(); _ch173BindBrush(); } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      // چالان ko poora safha do
      try { _ch173FocusMode(true); } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      try { document.body.classList.toggle('tatima-active', _r173Type === 'tatima_challan'); } catch(_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
      // Officer ki apni naap yaad ho to khud-ba-khud chaurai band rahe
      try {
        if (bs.cols_manual === '1') {
          const t = document.querySelector('#ch173-table');
          if (t) t.dataset.colsManual = '1';
        }
      } catch(_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
      // Font kis khane par lage — us khane ko yaad rakhne wala nizam
      try { _ch173BindCellPick(); } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      // Har khane ka apna mehfooz shuda font wapas lagao
      // v553: پرانے (fnorm کے بغیر) چالان کے خانوں کے الگ الگ فونٹ نہیں — سب معیاری 14pt
      try { if (String(bs.fnorm || '') === '553') _ch173ApplyCellFonts(bs.cell_fonts); } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      // پرانے محفوظ متن (حالات / جاری متن / کاغذات) کے اندر کے فونٹ سائز بھی معیاری
      try {
        if (String(bs.fnorm || '') !== '553' && typeof dioNormFonts === 'function') {
          const _d = _ch173Doc();
          if (_d) _d.querySelectorAll('[data-k="halaat"], [data-k="cont_text"], [data-k="papers_body"]').forEach(x => dioNormFonts(x));
        }
      } catch(_) { /* ضمنی */ }
      // Tamam font lag jane ke BAAD hi naap ka poora kaam — warna khanon ki
      // chaurai/qatar ki unchai purane (chhote) font par naapi jati thi.
      setTimeout(() => { try { _ch173Layout(); } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } }, 120);
      // Safha poori tarah lag jane ke baad naap dobara theek karo
      try { _ch173WatchFit(); } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    }, 60);
    if (typeof applyMicButtons === 'function') setTimeout(() => applyMicButtons(area), 80);
    return;
  }

  /* ═══════════════════════════════════════════════════════════
     MATROOK (dead) SAFHA — HATA DIYA GAYA
     Yahan aik purana "sada" فارم tha. Us tak amal KABHI nahi pohnchta tha:
     oopar `if (R173_BLANK_TYPES.includes(_r173Type)) { … return; }` hai aur
     `R173_BLANK_TYPES` mein TAMAM SAAT aqsam mojood hain — yani har soorat
     mein oopar hi se wapsi ho jati thi. Us ke andar `isClosing` bhi pakka
     `false` tha, is liye us ka اخراج wala jadwal bhi murda tha.
     (Anjaan qism ab is function ke shuru mein «مکمل» par le aai jati hai.)
     Us ke saath do aur murda cheezein bhi gayin:
       • `_r173Qita()` — sirf isi hissay se bulaya jata tha
       • تتمہ ke teen checkbox (`data-pk`) — kabhi render hi nahi hote the
     ═══════════════════════════════════════════════════════════ */
  return;
}

// ── SAVE ──────────────────────────────────────────────────────
function _collectR173() {
  // Challan types (فارم 25.56(1)) — apna doc id hai
  const chDoc = _ch173Doc();          // hamesha NAZAR AANE wala چالان
  if (chDoc && typeof R173_BLANK_TYPES !== 'undefined' && R173_BLANK_TYPES.includes(_r173Type)) {
    // Mehfooz karne se pehle bhi overflow JAMNE TAK chalao — taake کالم 7 ka
    // izafi matn neeche wale khane mein darj ho kar SAATH mehfooz ho.
    try { _ch173OverflowSettle(5); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    // CNIC ke display-spans hata do — sirf saada matn mehfooz ho (markup nahi)
    try { _ch173UnwrapCnics(chDoc); } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    const d = {};
    chDoc.querySelectorAll('[data-k]').forEach(el => {
      d[el.dataset.k] = (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') ? el.value : el.innerHTML;
    });
    // MS Word jaisi drag se badli hui column widths bhi mehfooz
    try { const cw = _ch173ColWidths(); if (cw) d.col_widths = cw; } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    // Officer ne khud chaurai kheenchi thi? — yaad rakho
    try {
      const t = document.querySelector('#ch173-table');
      if (t && t.dataset.colsManual === '1') d.cols_manual = '1';
    } catch(_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
    // Har khane ka apna font bhi mehfooz (warna reload par kho jata hai)
    try { const cf = _ch173CellFonts(); if (cf) d.cell_fonts = cf; } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    d.fnorm = '553';   // v553: یہ فونٹ افسر نے خود رکھے/چنے — آئندہ معیار سے نہ بدلیں
    // Save ke liye lapet kholi thi — screen par seedh wapas laga do
    try { _ch173WrapCnics(chDoc); } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    try {
      const br = document.querySelector('#ch173-table tbody tr td');
      if (br && br.style.height) d.row_height = br.style.height;
    } catch(_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
    return d;
  }
  // `#r173-doc` wala purana safha hata diya gaya (dekhen `_renderR173`) —
  // ab چالان hamesha `#ch173-doc` par hota hai.
  return {};
}

let _r173Saving = false;   // aik waqt mein aik hi save

async function _saveR173() {
  // VIEW-ONLY ENFORCEMENT [4E]: میعاد ختم پر چالان محفوظ/ترمیم بند
  if (window.DIO && DIO.sub && !DIO.sub.guard('چالان محفوظ')) return;
  // v558: اسی #ch173-doc میں ضمنی / اندرونی ضمنی (بیانات 161) کھلی ہو تو یہ چالان نہیں —
  //   اپنا محفوظ کرنے والا (پہلے غلط راستے سے بیان «چالان» کی جدول میں جا سکتا تھا)
  try {
    const d0 = _ch173Doc();
    if (d0 && d0.querySelector('.zfa-tbl') && typeof window._saveZimniA === 'function') return window._saveZimniA(false, true);
    if (d0 && d0.querySelector('.zf-tbl') && typeof window._saveZimni === 'function') return window._saveZimni(false, true);
  } catch (_) { /* چالان ہی */ }
  // Do dafa dabane par DO satren ban jati thin (dono ko `_r173DocId` khali
  // milta tha). Ab pehla kaam mukammal hone tak doosra nahi chalta.
  if (_r173Saving) return;
  _r173Saving = true;
  const _saveBtn = document.getElementById('r173-save-btn');
  if (_saveBtn) { _saveBtn.disabled = true; _saveBtn.textContent = 'محفوظ ہو رہا ہے…'; }
  try { await _saveR173Inner(); }
  finally {
    _r173Saving = false;
    if (_saveBtn) { _saveBtn.disabled = false; _saveBtn.innerHTML = '💾 محفوظ کریں'; }
  }
}

async function _saveR173Inner() {
  const form_data = _collectR173();
  const isTatima = _r173Type === 'tatima_challan';
  const recKey = _r173Key(_r173Type, _r173Subtype, _ch173Version);
  _r173Records[recKey] = form_data;
  const rec = { case_id: _r173CaseId, report_type: _r173Type, form_data };
  if (R173_BLANK_TYPES.includes(_r173Type)) rec.report_subtype = _ch173Version;
  if (isTatima) rec.report_subtype = _r173Subtype;
  try {
    const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
    if (oid) rec.officer_id = oid;
    // ہیڈ/عنوان بھی محفوظ (ایک ہی قسم کے کئی چالان ہو سکتے ہیں)
    form_data.head = _r173Head || form_data.head || '';
    form_data.saved_at = new Date().toISOString();     // mehfooz karne ka waqt
    rec.form_data = form_data;
    // ── v560: 1) پہلے اسی آلے پر (کبھی ضائع نہیں) — نئے چالان کی مستقل شناخت ابھی (آف لائن بھی) ──
    //   پہلے سرور ناکام ہوتا تو چالان کہیں محفوظ نہ ہوتا (صرف اسکرین پر)، اور آف لائن چالان
    //   «local-…» شناخت سے پرانی قطار میں جاتا — اب ضمنی والا ایک ہی اصول۔
    const curDoc = _r173DocId ? _r173Docs.find(d => String(d.id) === String(_r173DocId)) : null;
    const legacyId = _r173DocId && /^(local-|tmp_)/.test(String(_r173DocId));
    const isNewDoc = !_r173DocId || legacyId || !!(curDoc && curDoc._new);
    if (!_r173DocId || legacyId) {
      const nid = (window.DIOSync && DIOSync.uuid) ? DIOSync.uuid() : ('local-' + Date.now());
      if (legacyId) _r173Docs = _r173Docs.filter(d => String(d.id) !== String(_r173DocId));
      _r173DocId = nid;
    }
    const entry = { id: _r173DocId, type: _r173Type,
      subtype: isTatima ? _r173Subtype : (R173_BLANK_TYPES.includes(_r173Type) ? _ch173Version : ''),
      head: form_data.head, form_data,
      date: form_data.sho_date2 || form_data.sho_date || _ch173Today(),
      saved: form_data.saved_at, _pending: true };
    if (isNewDoc) entry._new = true; else if (curDoc && curDoc.rev != null) entry.rev = curDoc.rev;
    if (curDoc && curDoc._conflict) entry._conflict = curDoc._conflict;
    {
      const idx = _r173Docs.findIndex(d => String(d.id) === String(_r173DocId));
      if (idx >= 0) _r173Docs[idx] = entry; else _r173Docs.push(entry);
    }
    _r173LocalPut(_r173CaseId);
    let onServer = false;
    if (!navigator.onLine || typeof supabaseClient === 'undefined' || !supabaseClient) {
      showToast('اس آلے پر محفوظ — انٹرنیٹ آنے پر خود سرور پر چلا جائے گا', 'info', 4000);
    } else if (entry._conflict) {
      setTimeout(() => { try { _r173Resolve(entry.id); } catch (_) { /* fehrist se */ } }, 300);
    } else {
      try {
        const nd = await _r173Push(_r173CaseId, entry);
        const idx = _r173Docs.findIndex(d => String(d.id) === String(entry.id));
        if (idx >= 0 && String(_r173Docs[idx].saved || '') === String(entry.saved || '')) _r173Docs[idx] = nd;
        _r173DocId = nd.id;
        _r173LocalPut(_r173CaseId);
        onServer = true;
      } catch (e) {
        if (e && e.code === 'DIO_CONFLICT') {
          const idx = _r173Docs.findIndex(d => String(d.id) === String(entry.id));
          if (idx >= 0) _r173Docs[idx] = Object.assign({}, _r173Docs[idx], { _conflict: e.server });
          _r173LocalPut(_r173CaseId);
          setTimeout(() => { try { _r173Resolve(entry.id); } catch (_) { /* fehrist se */ } }, 300);
        } else if (typeof _dioIsNetErr === 'function' && _dioIsNetErr(e)) {
          showToast('انٹرنیٹ/سرور سے رابطہ نہیں — چالان اس آلے پر محفوظ ہے، رابطہ بحال ہوتے ہی خود سرور پر چلا جائے گا', 'info', 7000);
        } else {
          const why = (window.DIO && DIO.errors && DIO.errors.userMessage) ? DIO.errors.userMessage(e) : String((e && e.message) || e);
          const idx = _r173Docs.findIndex(d => String(d.id) === String(entry.id));
          if (idx >= 0) _r173Docs[idx] = Object.assign({}, _r173Docs[idx], { _sync_err: why });
          _r173LocalPut(_r173CaseId);
          showToast('سرور نے چالان قبول نہیں کیا — وجہ: ' + why + '۔ چالان اس آلے پر محفوظ ہے، کچھ ضائع نہیں ہوا۔', 'error', 10000);
          try { if (window.DIO && DIO.errors && DIO.errors.log) DIO.errors.log('report_173.save', e); } catch(_) { /* logging */ }
        }
      }
    }
    // محفوظ فائلوں کی فہرست میں درج — KAMYABI ke BAAD (pehle yeh likhne se
    // PEHLE hi darj ho jata tha, is liye nakaam save bhi «محفوظ فائلیں» mein
    // nazar aata tha). تتمہ ki ذیلی qism bhi sahi darj ho, ورژن nahi.
    try {
      if (typeof dioRegisterSaved === 'function') {
        const tName = (R173_TYPES.find(t => t.id === _r173Type) || {}).name || 'رپورٹ 173';
        const verTxt = isTatima ? '' : (_ch173Version === 'cross_version' ? ' (کراس ورژن)' : ' (FIR)');
        dioRegisterSaved('report_173', tName + verTxt, {
          case_id: _r173CaseId, report_type: _r173Type,
          report_subtype: isTatima ? (_r173Subtype || null) : _ch173Version,
          doc_id: _r173DocId || null
        });
      }
    } catch(_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
    // Save ke baad چالان ki FEHRIST kholo
    _r173Dirty = false;
    _r173ShowList = true;
    setTimeout(() => { try { _renderR173List(); } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } }, 250);

    // P7: auto-update case status based on report type — Phase 2D canonical
    // registry (fallback local map agar dio-statuses.js load na ho)
    const statusMap = {
      mukammal: 'complete',
      namukammal: 'incomplete',
      ch512: 'challan512',
      interim: 'under',
      ikhraj: 'cancel',
      adampata: 'untrace',
      tatima_challan: 'complete'
    };
    const newStatus = (window.DIO && DIO.caseStatuses && DIO.caseStatuses.fromR173Type(_r173Type))
                      || statusMap[_r173Type];
    if (!onServer) {
      // v560: چالان اسی آلے پر محفوظ (اوپر پیغام دیا جا چکا) — مقدمے کی حالت سرور پر جانے کے بعد
    } else if (newStatus) {
      // AUDIT — "before" status pehle capture karें (Phase 4B)
      let _prevStatus = null;
      try {
        if (window.DIO && DIO.audit) {
          const chk = await supabaseClient.from('cases')
            .select('status').eq('id', _r173CaseId).maybeSingle();
          _prevStatus = (chk && chk.data && chk.data.status) || null;
        }
      } catch (_) { /* audit/custody ka masla asal kaam na roke */ }
      try {
        // v547: نتیجہ دیکھ کر — پہلے حالت نہ بدلتی تب بھی «اپ ڈیٹ ہو گئی»
        dioWriteOk(await supabaseClient.from('cases').update({ status: newStatus }).eq('id', _r173CaseId).select('id'), 'r173 case status', true);
        try { localStorage.setItem('case_status_'+_r173CaseId, newStatus); } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
        // AUDIT — case.status_changed (Report 173 par transition)
        try {
          if (window.DIO && DIO.audit && _prevStatus !== newStatus) {
            DIO.audit.log('case.status_changed', 'case', _r173CaseId, {
              case_id: _r173CaseId,
              before: { status: _prevStatus },
              after: { status: newStatus },
              metadata: { source: 'report_173', report_type: _r173Type }
            });
          }
        } catch (_) { /* audit/custody ka masla asal kaam na roke */ }
        showToast('رپورٹ محفوظ — مقدمہ کی حالت اپ ڈیٹ ہو گئی', 'success');
      } catch(_) {
        const why = (window.DIO && DIO.errors) ? DIO.errors.userMessage(_) : ((_ && _.message) || '');
        showToast('رپورٹ محفوظ ہو گئی — مگر مقدمے کی حالت تبدیل نہیں ہوئی (' + why + ')؛ مقدمے میں خود تبدیل کریں', 'info', 8000);
      }
    } else {
      showToast('رپورٹ محفوظ ہو گئی', 'success');
    }
  } catch(e) {
    // Nakami CHUPAI na jaye — afsar ko pata hona chahiye ke چالان mehfooz
    // NAHI hua (warna woh samajh kar chala jata hai ke kaam ho gaya).
    _r173Dirty = true;
    showToast('محفوظ نہیں ہوا — ' + ((e && e.message) || 'نامعلوم خرابی') +
              ' · دوبارہ کوشش کریں', 'error', 7000);
    try { if (window.DIO && DIO.errors && DIO.errors.log) DIO.errors.log('report_173.save', e); } catch(_) { /* logging khud kabhi na phatte */ }
  }
}

// ── PRINT (only the form) ─────────────────────────────────────
// v553: کاغذ کا سائز پرنٹ کے وقت — اوپر کی پٹی سے لیگل/A4 ہٹا دیا گیا۔
//  پرنٹ پر پوچھا جاتا ہے؛ کاغذ بدلے تو چالان پہلے نئے کاغذ پر پوری ترتیب
//  (_ch173SetPaper → _ch173Layout) لیتا ہے، پھر وہی کاغذ چھپتا ہے۔
function _printR173() {
  const a = arguments;
  if (typeof dioWithPaper !== 'function') return _printR173Now.apply(null, a);
  return dioWithPaper({
    get: () => _ch173Paper,
    set: v => {
      _ch173SetPaper(v);
      try { const d = _ch173Doc(); if (d && d.querySelector('.zf-tbl') && typeof _zimniLayout === 'function') _zimniLayout(); } catch (_) { /* ضمنی */ }
      try { const d = _ch173Doc(); if (d && d.querySelector('.zfa-tbl') && typeof window._zaLayout === 'function') window._zaLayout(); } catch (_) { /* اندرونی ضمنی */ }
    },
    run: () => _printR173Now.apply(null, a)
  });
}
function _printR173Now() {
  // Challan types (فارم 25.56(1)) — apna doc + apni styles
  const chDoc = _ch173Doc();          // hamesha NAZAR AANE wala چالان
  // v552: اسی #ch173-doc میں ضمنی ہو تو چالان کی CSS سے نہ چھاپو (شکل بگڑ جاتی تھی)
  if (chDoc && chDoc.querySelector('.zf-tbl') && typeof window._printZimniCurrent === 'function') { return window._printZimniCurrent(); }
  // v558: اندرونی ضمنی (بیانات 161) — اپنا پرنٹ (پہلے چالان کی شکل میں چھپتی تھی)
  if (chDoc && chDoc.querySelector('.zfa-tbl') && typeof window._printZimniANow === 'function') { return window._printZimniANow(); }
  if (chDoc) {
    // ═══ AHEM — کالم 7 ka matn chhup jane ki ASAL wajah ═══
    // Overflow ka hisaab us chaudai par lagta hai jo us waqt SCREEN par hai.
    // Screen chaudi hoti hai, is liye matn wahan poora sama jata hai aur
    // system samajhta hai "kuch bahar nahi gaya" — chunanche kuch neeche
    // nahi bhejta. Magar KAGHAZ tang hota hai, wahan wohi matn zyada satren
    // leta hai, bahar nikal jata hai aur KAT kar chhup jata hai.
    // Hal: chapai se pehle safhe ko KAGHAZ ki asal chaudai par le jao,
    // wahan naap lo, matn neeche bhejo — phir screen wapas apni halat par.
    const _pw = chDoc.style.width, _pmw = chDoc.style.maxWidth;
    const _ptf = chDoc.style.transform, _pmb = chDoc.style.marginBottom;
    let _inner = chDoc.innerHTML;
    try {
      // Dikhane wala 'scale' hata do — naap par asar nahi, magar saaf rahe
      _ch173PrintMeasuring = true;         // naap ke dauran scale na lage
      chDoc.style.transform = 'none';
      chDoc.style.marginBottom = '0';
      chDoc.style.width = (_ch173Paper === 'a4') ? '8.27in' : '8.5in';
      chDoc.style.maxWidth = 'none';
      void chDoc.offsetHeight;                 // nayi naap lagne do
      // AHEM: yahan khanon ki naap DOBARA na lein. Screen pehle se kaghaz ki
      // naap par hai; chapai ke waqt dobara naapne se halaat thore badal jate
      // hain (hashiye alag hote hain) aur natija alag nikalta hai — isi wajah
      // se screen aur chapai ka چالان alag nazar aata tha. Chapai ab wahi naql
      // leti hai jo screen par mojood hai.
      // Wahi AIK tarteeb jo screen par chalti hai — is liye chapai bilkul
      // wohi shakl deti hai jo screen par nazar aa rahi hoti hai.
      try { _ch173Layout(); } catch (__) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      void chDoc.offsetHeight;
      // ═══ Naap ko PAKKA (inline px) kar do — chapai ke liye ═══
      // Screen par khadi khanon ki unchai 'height:100%' ki zanjeer se banti
      // hai (td → .cellbox/.rotclip → .rotinner), aur CNIC ka fasla .ln ke
      // 'inline-size:100%' + space-between se. Chapai ki khirki AIK NAYA
      // document hai jahan yeh percent wali zanjeer usi tarah nahi bandhti —
      // is liye .ln apne matn jitni hi reh jati thi, space-between ka fasla
      // khatam ho jata tha aur NAAM ke saath CNIC aa kar mil jate the.
      // Hal: chapai ki naql lene se PEHLE asal px naap inline likh do (inline
      // naap innerHTML ke saath chali jati hai), naql ke baad hata do.
      let _baked = [];
      try { _baked = _ch173BakeSizes(); } catch (__) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      // Misal bandhne ki tikoni jagah (sirf chapai ke liye)
      let _tri = [];
      // v553: صفحے کا توڑ اور مثل باندھنے کی جگہ اب پرنٹ کی اصل شکل (چھپا iframe، @page کے
      //   حاشیے) پر ناپ کر لگتے ہیں — نیچے dioBindHtml۔ اسکرین کی ناپ سے لگانے پر پرنٹ
      //   میں صفحہ 2 پر چند سطریں رہ کر مثلث صفحہ 3 پر جا پڑتی تھی (ناپا گیا)۔
      if (typeof dioBindHtml !== 'function') { try { _tri = _ch173AddBindMarks() || []; } catch (__) { /* ikhtiyari qadam — na ho sake to chhoR do */ } }
      _inner = chDoc.innerHTML;                // kaghaz ki naap wala natija
      // Nishan foran hata do — screen par kuch badla hua nazar na aaye
      try { _tri.forEach(t => t.remove()); chDoc.normalize(); } catch (__) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
      try { _ch173UnbakeSizes(_baked); } catch (__) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ } finally {
      // Screen wapas apni halat par
      try {
        _ch173PrintMeasuring = false;
        chDoc.style.width = _pw; chDoc.style.maxWidth = _pmw;
        chDoc.style.transform = _ptf; chDoc.style.marginBottom = _pmb;
        void chDoc.offsetHeight;
        try { _ch173FitPaper(); } catch (__) { /* ikhtiyari qadam — na ho sake to chhoR do */ }  // dikhane wali naap wapas
        _ch173OverflowSettle(4);               // screen ki halat bhi durust
      } catch (__) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
    }
    const chHtml = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title> </title>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        /* Print iframe apna font KHUD load kare — warna woh officer ke PC par
           installed font par ya serif par gir jata tha (isi wajah se teeno print
           alag lagte the aur الفاظ جُڑتے تھے). Yeh wahi @font-face hai jo
           index.html mein hai — screen jaisa hi font, har PC par yaksan. */
        @font-face{
          font-family:'Jameel Noori Nastaleeq';
          src: local('Jameel Noori Nastaleeq'), local('Jameel Noori Nastaleeq Regular'),
               url('https://cdn.jsdelivr.net/npm/jameel-noori/fonts/jameel-noori-nastaleeq4.woff2') format('woff2'),
               url('https://unpkg.com/jameel-noori/fonts/jameel-noori-nastaleeq4.woff2') format('woff2');
          font-display: swap;
        }
        /* Charon taraf BARABAR margin — kaghaz chune hue naap ka */
        /* Sides tang aur barabar — table poori qabil-e-tabaat chaudai le */
        @page{ size:${_ch173Paper === 'a4' ? 'A4 portrait' : '8.5in 13in'}; margin:1cm ${_ch173SideMargin()}; }
        html, body{ margin:0 !important; padding:0 !important;
          font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
          direction:rtl; line-height:1.4; color:#000; }

        /* ═══ WAHI CSS jo screen par hai — koi alag nakal nahi ═══ */
        ${_ch173CSS()}

        /* Sirf print ke liye chand izafi baatein */
        #ch173-doc{ width:100% !important; max-width:none !important;
          height:auto !important; min-height:0 !important;
          padding:0 !important; margin:0 !important;
          transform:none !important;   /* dikhane wala scale chapai mein na jaye */
          box-shadow:none !important; border-radius:0 !important; }
        .ch173-table thead{ display:table-row-group !important; }   /* header dohra na ho */
        .ch173-table{ page-break-inside:avoid; break-inside:avoid; } /* agle safhe par na jaye */
        .ch173-cont:empty{ display:none !important; }
        .colgrip,.rowgrip,.acc-pick,.no-print,button,select{ display:none !important; }
        /* ═══ متن چھپنے/کٹنے کا اصل حل (verified in Chromium print) ═══
           Table body ke khane 'position:absolute' + fixed height + overflow:hidden
           par the — is liye jo matn baked-unchai se zyada hota woh CLIP ho kar
           chhup jata tha (halaat ki aakhri satar, gawahan/ملزمان ke naam). Print
           mein har khana STATIC + auto-height + overflow:visible → poora matn nazar
           aata hai, row khud barh jati hai, kuch clip nahi hota. */
        #ch173-doc .ch173-table tbody td,
        #ch173-doc .ch173-table tbody td.normcell,
        #ch173-doc .ch173-table td.rotcell,
        #ch173-doc .cellbox, #ch173-doc .rotclip,
        #ch173-doc .normwrap, #ch173-doc .rotinner, #ch173-doc .hinner{
          position:static !important; inset:auto !important;
          height:auto !important; min-height:0 !important; max-height:none !important;
          overflow:visible !important; }
        #ch173-doc .rotinner{ display:inline-block !important; }
        /* Misal bandhne wali tikoni jagah — chapai mein zaroori */
        #ch173-doc .ch173-bind{ display:block !important; }
        ${typeof dioBindCSS === 'function' ? dioBindCSS('#ch173-doc') : ''}
        /* Safhe ka tor theek apni jagah par */
        #ch173-doc .ch173-pgbrk{ display:block !important; height:0 !important;
          break-before:page !important; page-break-before:always !important; }
        /* Koi satar akeli na chhute (safhe ke kinare par) */
        #ch173-doc, #ch173-doc *{ orphans:2; widows:2; }
        /* ═══ پرنٹ میں الفاظ جُڑنے کا حل (justify برقرار) ═══
           Chrome کی چھپائی میں Urdu/Nastaliq justified متن کی inter-word space
           صفر ہو جاتی ہے → الفاظ جُڑ جاتے ہیں۔ حل: justify رہنے دو (لائن پوری
           بھرے، خالی جگہ نہ ہو) مگر word-spacing کی کم از کم مقدار مقرر کر دو،
           تاکہ چاہے justify صفر کرنے کی کوشش کرے، الفاظ کے بیچ گیپ باقی رہے۔
           آخری سطر دائیں سیدھ (کھنچاؤ نہ ہو)۔ اسکرین ویسی کی ویسی۔ */
        #ch173-doc .hinner,
        #ch173-doc .akh-col2,
        #ch173-doc .normwrap,
        #ch173-doc .sho-papers-body,
        #ch173-doc .ch173-cont,
        #ch173-doc [data-k="halaat"],
        #ch173-doc [data-k="cont_text"],
        #ch173-doc [data-k="papers_body"]{
          text-align:justify !important; text-align-last:right !important;
          text-justify:inter-word !important; word-spacing:0.12em !important; }
        .sho-papers-body, .sho-cell-row, .ch173-cont{ outline:none !important; }
        .sho-papers-body:empty::before, .sho-cell-date:empty::before,
        .sho-cell-row:empty::before, .ch173-cont:empty::before{ content:'' !important; }
      </style></head><body><div id="ch173-doc">${_inner}</div></body></html>`;
    // Print se pehle rotated khanon ki naap inline kar do (print iframe mein JS nahi chalta)
    try { if (typeof _ch173SizeRotated === 'function') _ch173SizeRotated(); } catch(_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
    const _send = (h) => {
      if (typeof dioPrint === 'function') dioPrint(h);
      else { const w = window.open('','_blank'); w.document.write(h); w.document.close(); setTimeout(()=>w.print(),300); }
    };
    if (typeof dioBindHtml === 'function' && typeof dioAutoBind === 'function') {
      // جاری متن (کالم 7 کے نیچے) — ہر صفحے کی حد پر توڑ (نستعلیق نہ کٹے)، جفت صفحے پر
      //   اوپر ایک سطر + مثلث (2pt وتر)
      return dioBindHtml(chHtml, { binder: (d, geo) => {
        const cont = d.querySelector('#ch173-doc [data-k="cont_text"]');
        return cont ? dioAutoBind(d, chHtml, { root: cont, allPages: true, triClass: 'ch173-bind', brkClass: 'ch173-pgbrk' }) : 0;
      } }).then(_send, () => _send(chHtml));
    }
    _send(chHtml);
    return;
  }
  // `#ch173-doc` na mile to chhapne ko kuch hai hi nahi — afsar ko bata do
  // (pehle yahan `#r173-doc` wale purane safhe ki chhapai thi jo ab mojood
  //  nahi; woh khamoshi se kuch na karti thi).
  try { showToast('پرنٹ کے لیے فارم کھلا نہیں', 'error'); } catch (_) { /* paigham na dikh sake to koi baat nahi */ }
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
  // Is qism ka apna محفوظ چالان (ya nayi khali satar) — kisi doosri qism ki
  // satar par kaam jari na rahe
  try { _r173SyncDocId(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  // Fehrist ka nishan saaf — warna فارم ki bajaye fehrist khul jati hai
  _r173ShowList = false;
  _renderR173();
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
  const _colGrips = [];
  const addGrip = (cell, iA, iB) => {
    if (iB >= cols.length) return;              // aakhri column ke bayen kuch nahi
    const grip = document.createElement('div');
    grip.className = 'colgrip';
    grip.title = 'چوڑائی بدلنے کے لیے کھینچیں';
    cell.appendChild(grip);
    // Grip ko POORE table ki unchai tak phailao — taake column ki lakeer
    // sirf header mein nahi, NEECHE data waale hissey mein bhi pakri ja sake.
    try { cell.style.overflow = 'visible'; } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
    _colGrips.push(grip);
    /* ═══ لکیر کھینچ کر چوڑائی — دو خرابیاں تھیں ═══
       1) NAAP KI IKAI: `_ch173AutoSize` aur `_ch173AutoFitCols` chaurai
          hamesha **px** mein likhte hain ("36px"), magar yahan
          `parseFloat("36px")` = 36 ko **فیصد** samajh kar "36.00%" wapas
          likh diya jata tha — 36px ka khana 36% ka ho jata, poora jadwal
          bigar jata aur ملزمان ke khaRe naam kuchal jate.
          Ab naap RENDER ki hui asal chaurai (px) se, aur wapas bhi px.
       2) SCALE: tang khirki mein safha `scale()` par hota hai, is liye
          mouse ke px aur layout ke px barabar nahi hote.
       Saath: kul chaurai barqarar, kam az kam 24px, aur `colsManual` SIRF
       tab jab lakeer sach much HILI ho (pehle khali click se bhi lag jata). */
    // v552: pointer events — ماؤس کے ساتھ ٹچ (موبائل/ٹیبلٹ) پر بھی لکیر کھینچی جا سکے
    grip.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();
      try { grip.setPointerCapture(e.pointerId); } catch (_) { /* purana browser */ }
      const tRect = table.getBoundingClientRect();
      const scale = (tRect.width && table.offsetWidth) ? (tRect.width / table.offsetWidth) : 1;
      const startX = e.clientX;
      const pxOf = (i) => {
        const r = cols[i].getBoundingClientRect();
        const w = (r && r.width) ? (r.width / (scale || 1)) : 0;
        return w || (table.offsetWidth / cols.length);
      };
      const wA = pxOf(iA), wB = pxOf(iB);
      const MIN = 24;
      let moved = false;
      document.body.style.cursor = 'col-resize';
      const onMove = (ev) => {
        const dx = (startX - ev.clientX) / (scale || 1);   // RTL
        if (Math.abs(dx) > 1) moved = true;
        let nA = wA + dx, nB = wB - dx;
        if (nA < MIN || nB < MIN) return;
        cols[iA].style.width = Math.round(nA) + 'px';
        cols[iB].style.width = Math.round(nB) + 'px';
        if (typeof _ch173SizeRotated === 'function') _ch173SizeRotated();
      };
      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onUp);
        document.body.style.cursor = '';
        if (moved) { try { table.dataset.colsManual = '1'; _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } }
        try { table._syncColGripHeights && table._syncColGripHeights(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
        if (moved) { try { _ch173Layout(); } catch (_) { /* unchai matn ke mutabiq */ } }
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
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

  // ── "ملزمان" ke NEECHE wali lakeer — ooper/neeche kheench kar hilao ──
  // Yeh lakeer "ملزمان" (super-header) aur "زیر حراست/برضمانت" ke darmiyan hai.
  // Kheenchne par ooper wala khana bara/chhota hota hai aur neeche wala us ke
  // ulat — is liye header ki KUL unchai wahi rehti hai (form ka naksha nahi bigarta).
  const _hR2 = table.querySelector('thead tr:nth-child(2)');
  const _mulzimanTh = [...table.querySelectorAll('thead tr:first-child th')]
    .find(th => parseInt(th.getAttribute('colspan') || '1') > 1);
  if (_hR2 && _mulzimanTh) {
    _hR2.querySelectorAll('th').forEach(th => {
      const tg = document.createElement('div');
      tg.className = 'rowgrip rowgrip-top';
      tg.title = '"ملزمان" کی لکیر اوپر نیچے کھینچیں';
      th.appendChild(tg);
      tg.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startY = e.clientY;
        const startTop = _mulzimanTh.offsetHeight;
        const startBot = _hR2.offsetHeight;
        document.body.style.cursor = 'row-resize';
        const onMove = (ev) => {
          const d = ev.clientY - startY;
          const nTop = startTop + d, nBot = startBot - d;
          if (nTop < 18 || nBot < 18) return;
          _mulzimanTh.style.height = nTop + 'px';
          _hR2.querySelectorAll('th').forEach(c => { c.style.height = nBot + 'px'; });
        };
        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          document.body.style.cursor = '';
          try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }

  // ── ROW 2 ki NEECHE wali lakeer se HEADER ki unchai badalna ──
  const hRow2 = table.querySelector('thead tr:nth-child(2)');
  if (hRow2) {
    hRow2.querySelectorAll('th').forEach(th => {
      const hg = document.createElement('div');
      hg.className = 'rowgrip';
      hg.title = 'ہیڈر کی اونچائی بدلنے کے لیے کھینچیں';
      th.appendChild(hg);
      hg.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startY = e.clientY;
        const startH = hRow2.offsetHeight;
        // Row 1 ke woh khane jo dono qataron par phaile hue hain (rowspan)
        const spanned = [...table.querySelectorAll('thead tr:first-child th[rowspan]')];
        const spanH = spanned.length ? spanned[0].offsetHeight : 0;
        document.body.style.cursor = 'row-resize';
        const onMove = (ev) => {
          const d = ev.clientY - startY;
          const nh = startH + d;
          if (nh < 24) return;
          hRow2.querySelectorAll('th').forEach(c => { c.style.height = nh + 'px'; });
          spanned.forEach(c => { c.style.height = (spanH + d) + 'px'; });
        };
        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          document.body.style.cursor = '';
          try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }

  // ── ROW 3 ki NEECHE wali lakeer se unchai badalna ──
  // Grip HAR khane par — neeche ki poori lakeer par kahin se bhi pakar sakte hain
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
          // Chhorne ke baad matn poori tarah jam jaye (aik dafa kaafi nahi)
          try { _ch173OverflowSettle(4); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
          try { table._syncColGripHeights && table._syncColGripHeights(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
          try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }

  // ── Column grips ki unchai = POORE table ki unchai (header + data) ──
  // Is se har column ki لکیر neeche data waale hissey mein bhi qabil-e-pakar
  // ho jati hai (pehle sirf header ki patli patti pakri ja sakti thi).
  /* KHARABI THI (asli browser mein naapi gayi): yahan `cell.offsetTop`
     istemal hota tha. `offsetTop` TABLE se nahi, sab se qareeb wale
     "positioned" ﺁba (offsetParent) se naapa jata hai — aur `th` khud
     `position:relative` hai, is liye us ka offsetParent poora safha nikla.
     Naap: table.offsetHeight = 222 magar th.offsetTop = 254 → 222-254 manfi
     → `Math.max(0, …)` = **0px**. Yani HAR grip ki unchai sifar thi aur
     لکیر mouse se PAKRI HI NAHI JA SAKTI THI — jabke toolbar mein likha hai
     «↔ کالم کی لکیر کو پکڑ کر چوڑائی بدلیں». Ab naap table ke apne dabbe se
     (rect se rect), is liye scale ka bhi koi asar nahi. */
  function _syncColGripHeights() {
    let tr = null;
    try { tr = table.getBoundingClientRect(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    if (!tr || !tr.height) return;
    const sc = (tr.width && table.offsetWidth) ? (tr.width / table.offsetWidth) : 1;
    _colGrips.forEach(g => {
      try {
        const cell = g.parentElement;
        if (!cell) return;
        const cr = cell.getBoundingClientRect();
        const top = cr.top - tr.top;
        g.style.height = Math.round(Math.max(0, tr.height - top) / (sc || 1)) + 'px';
      } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
    });
  }
  table._syncColGripHeights = _syncColGripHeights;
  // Pehli dafa + thora baad (fonts/rotated naap ke baad)
  _syncColGripHeights();
  setTimeout(_syncColGripHeights, 300);
  setTimeout(_syncColGripHeights, 900);
  /* Pehle har render par aik NAYA `resize` sunne wala jamta jata tha (har
     dafa naya closure — browser purane ko pehchan kar hata nahi sakta), aur
     hataya kabhi nahi jata tha. Ab: poore nizam ka AIK hi sunne wala jo
     hamesha MOJOODA table par kaam karta hai. */
  try {
    if (!window._ch173GripResizeBound) {
      window._ch173GripResizeBound = true;
      window.addEventListener('resize', () => {
        try {
          const t = document.getElementById('ch173-table');
          if (t && t._syncColGripHeights) t._syncColGripHeights();
        } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
      });
    }
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._ch173MakeResizable = _ch173MakeResizable;

// ═══ Side margin — har kaghaz ki apni ═══
// Folio/Legal (8.5in) chaura hai, wahan 0.2cm kaafi hai. A4 (8.27in) zyada
// tang hai aur printer ka apna na-qabil-e-tabaat hashiya bhi hota hai, is
// liye wahan 0.5cm rakhi jati hai — warna kinare ke alfaz kat jate hain.
function _ch173SideMargin() {
  return (_ch173Paper === 'a4') ? '0.5cm' : '0.2cm';
}
window._ch173SideMargin = _ch173SideMargin;

// ═══ کالم 1 (نام و پتہ مدعی) ki chaurai — PAKKI, 1.5cm ═══
// Yeh har haal mein wahi rehti hai: na mehfooz shuda naap se badalti hai,
// na kheench kar badli ja sakti hai (us ki grip band kar di gayi hai).
// Chaurai ko CSS ki shakl mein — purane چالان mein naap sirf number (13) ki
// tarah mehfooz thi, naye mein unit ke saath ('13%' / '1.5cm'). Dono chalen.
function _ch173WCss(w) {
  if (typeof w === 'string' && /[a-z%]/i.test(w)) return w.trim();
  const n = parseFloat(w);
  return (isNaN(n) || n <= 0) ? 'auto' : (n + '%');
}
window._ch173WCss = _ch173WCss;

// Column widths ko save/collect karne ke liye helper
function _ch173ColWidths() {
  const table = document.getElementById('ch173-table');
  if (!table) return null;
  // Naap unit ke SAATH mehfooz (kuch cm mein hain, kuch % mein)
  return JSON.stringify([...table.querySelectorAll('colgroup col')]
    .map(c => c.style.width || ''));
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
// ═══ Hamesha NAZAR AANE wala چالان pakro ═══
// AHEM: jab doosri tabs bhi khuli hon to safhe par چالان ke AIK SE ZYADA
// khane mojood ho sakte hain (chhupe hue purane tab wale bhi). Pehle code
// "pehla milne wala" khana pakarta tha — jo aksar CHHUPA hua hota hai; us ki
// unchai 0 hoti hai, is liye kaam wahin ruk jata tha aur NAZAR AANE wale
// khane ka matn chhupa reh jata tha. Akele kholne par aik hi khana hota hai,
// isi liye masla sirf doosri tabs ke saath aata tha.
function _ch173Doc() {
  const all = document.querySelectorAll('#ch173-doc');
  if (!all.length) return null;
  for (let i = all.length - 1; i >= 0; i--) {
    const el = all[i];
    if (el.offsetParent !== null || el.getClientRects().length) return el;   // yeh nazar aa raha hai
  }
  return all[all.length - 1];
}
window._ch173Doc = _ch173Doc;

function _ch173Cells() {
  const doc = _ch173Doc();
  if (!doc) return {};
  return {
    doc,
    cell: doc.querySelector('#ch173-table [data-k="halaat"]') || doc.querySelector('[data-k="halaat"]'),
    cont: doc.querySelector('[data-k="cont_text"]'),
  };
}
window._ch173Cells = _ch173Cells;

// ═══ چالان poore SAFHE par — neeche khali jagah na bache ═══
// Table ki qatar ko itna barha dete hain ke unwan + table + neeche wala matn
// + SHO ka khana mil kar poora safha bhar den. Qatar sirf BARHTI hai, kabhi
// chhoti nahi hoti — taake jo matn pehle se neeche gaya hua hai woh ulat-pulat
// na ho. Officer phir bhi lakeer kheench kar apni marzi ki naap le sakta hai.
// ═══ اخراج / عدم پتہ — row 8 (مختصر حالات) ki MUQARRAR unchai ═══
// چالان mein کالم 7 ke khane ki unchai _ch173AutoSize + _ch173RoundRow se
// muqarrar hoti hai: khana utna hi bara rehta hai, aur jo matn na samaye woh
// table ke NEECHE chala jata hai.
// اخراج ki table mein yeh qadam MOJOOD HI NAHI THA — row 8 ki unchai sirf
// bayen wale unwaan ("مختصر حالات مقدمہ معہ جرم") se banti thi, yani aik satar
// jitni. Font barhate hi us aik satar mein bhi matn na samata aur POORA matn
// qatar chhor kar neeche chala jata tha.
// Ab yahan bhi چالان jaisa hi hisab: khane ki unchai hamesha POORI satron ka
// theek guna, aur kam az kam AIK satar. Is se matn apni qatar mein rehta hai
// aur sirf bacha hua hissa neeche jata hai — chahe font kitna bhi bara ho.
// ═══ Row 8 ki NEECHE wali lakeer — kheench kar unchai badlo ═══
// Officer khud tay kare ke مختصر حالات ka khana kitna ooncha ho. Jo naap
// woh chunta hai woh mehfooz rehti hai (khud-kar naap us par hawi nahi hoti).
/* KHAMI THI: yeh AIK hi chaabi thi jo اخراج aur عدم پتہ dono aqsam aur
   TAMAM muqadmat ke liye mushtarik thi, koi bari hadd nahi thi, aur mouse
   ka sirf aik CLICK (bina hilaye) bhi isay likh deta tha. Aik dafa lag jane
   ke baad khud-kar unchai HAMESHA ke liye band — kisi bhi doosre مقدمہ mein
   مختصر حالات ka khana wahi purani naap le kar aata tha, aur wapsi ka koi
   raasta nahi tha.
   Ab: har qism ki apni chaabi, naap ki hadd, aur SIRF sach much kheenchne
   par mehfooz. Grip par DOUBLE-CLICK se dobara khud-kar. */
function _r173AkhHKey() { return 'dio_akhraj_row8_h_' + (_r173Type === 'ikhraj' ? 'ikhraj' : 'adampata'); }
function _r173AkhColKey() { return 'dio_akhraj_col2_' + (_r173Type === 'ikhraj' ? 'ikhraj' : 'adampata'); }
const R173_AKH_H_MIN = 40;
const R173_AKH_H_MAX = 11 * 96;

// Sirf maqool فیصد qabool — "120.34%" jaisi naap poora jadwal bigaR deti hai
function _r173AkhColOk(w) {
  const v = parseFloat(w);
  return String(w || '').indexOf('%') > -1 && v >= 8 && v <= 80;
}
function _ch173AkhrajResetCol() {
  try { localStorage.removeItem(_r173AkhColKey()); } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  try {
    const t = document.getElementById('ch173-table');
    const cs = t ? t.querySelectorAll('colgroup col') : [];
    if (cs.length >= 3) { cs[1].style.width = ''; cs[2].style.width = ''; }
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  try { _ch173AkhrajGrips(); _ch173OverflowSettle(3); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  try { showToast('خانوں کی چوڑائی خودکار', 'info'); } catch (_) { /* paigham na dikh sake to koi baat nahi */ }
}
window._ch173AkhrajResetCol = _ch173AkhrajResetCol;

function _ch173AkhrajSavedH() {
  try {
    const v = parseFloat(localStorage.getItem(_r173AkhHKey()) || '');
    return (v >= R173_AKH_H_MIN && v <= R173_AKH_H_MAX) ? v : 0;
  } catch (_) { return 0; }
}
// Khud-kar naap par wapas
function _ch173AkhrajResetH() {
  try { localStorage.removeItem(_r173AkhHKey()); } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  try {
    const g = document.querySelector('#ch173-doc .akh-hgrip');
    const td = g && g.closest('td.normcell');
    if (td) td.style.height = '';
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  try { _ch173AkhrajRowH(); _ch173OverflowSettle(3); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  try { showToast('مختصر حالات کی اونچائی خودکار', 'info'); } catch (_) { /* paigham na dikh sake to koi baat nahi */ }
}
window._ch173AkhrajResetH = _ch173AkhrajResetH;

function _ch173AkhrajHGrip() {
  const doc = _ch173Doc();
  if (!doc) return;
  const grip = doc.querySelector('.akh-hgrip');
  if (!grip || grip.dataset.bound === '1') return;
  grip.dataset.bound = '1';
  grip.title = 'نیچے کی لکیر کو اوپر نیچے کھینچیں · دو بار کلک = خودکار';
  grip.addEventListener('dblclick', ev => { ev.preventDefault(); _ch173AkhrajResetH(); });
  grip.addEventListener('mousedown', ev => {
    ev.preventDefault(); ev.stopPropagation();
    const td = grip.closest('td.normcell');
    const wrap = td && td.querySelector('.normwrap');
    if (!td || !wrap) return;
    const startY = ev.clientY;
    const h0 = td.clientHeight;
    let wait = false, moved = false;
    const move = e => {
      if (Math.abs(e.clientY - startY) > 1) moved = true;
      let h = h0 + (e.clientY - startY);
      if (h < 30) h = 30;
      td.style.height = Math.round(h) + 'px';
      // Matn foran theek ho — jo na samaye woh neeche, jagah bane to wapas
      if (!wait) {
        wait = true;
        requestAnimationFrame(() => { wait = false; try { _ch173OverflowSettle(1); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } });
      }
    };
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      // SIRF tab mehfooz jab afsar ne waqai lakeer kheenchi ho
      if (moved) {
        const hh = Math.round(td.clientHeight);
        if (hh >= R173_AKH_H_MIN && hh <= R173_AKH_H_MAX) {
          try { localStorage.setItem(_r173AkhHKey(), String(hh)); } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
        }
      }
      try { _ch173OverflowSettle(4); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      try { _ch173AlignSho(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  });
}
window._ch173AkhrajHGrip = _ch173AkhrajHGrip;

function _ch173AkhrajRowH() {
  const doc = _ch173Doc();
  if (!doc) return;
  const table = doc.querySelector('.ch173-akhraj-table');
  if (!table) return;
  const rows = table.querySelectorAll('tbody tr');
  if (!rows.length) return;
  const row = rows[rows.length - 1];              // aakhri qatar = مختصر حالات
  const td  = row.querySelector('td.normcell');
  const wrap = td && td.querySelector('.normwrap');
  const lbl = row.querySelector('.akh-col2');
  if (!td || !wrap) return;

  let lh = 0, wrapPad = 0;
  try {
    const cw = getComputedStyle(wrap);
    lh = parseFloat(cw.lineHeight) || 0;
    if (!lh) lh = (parseFloat(cw.fontSize) || 16) * 1.9;
    wrapPad = (parseFloat(cw.paddingTop) || 0) + (parseFloat(cw.paddingBottom) || 0);
  } catch (_) { return; }
  if (!lh) return;

  // ═══ Officer ki apni naap sab se ooper ═══
  // Agar us ne neeche wali lakeer kheench kar unchai chuni hai to wohi rahegi.
  const chuni = _ch173AkhrajSavedH();
  if (chuni) {
    if (td.style.height !== Math.round(chuni) + 'px') td.style.height = Math.round(chuni) + 'px';
    return;
  }

  // ═══ PEHLE apni lagayi hui unchai HATAO ═══
  // AHEM: yehi is masle ki jar thi. Neeche unwaan wale khane (کالم 2) ki
  // unchai naapi jati hai — magar woh khana QATAR ke barabar ho jata hai.
  // Agar apni pichhli (barhi hui) unchai lagi rahe to wohi dobara naap li
  // jati thi aur qatar har dafa aur lambi hoti chali jati thi. Isi liye
  // row 8 ka کالم 2 baqi qataron se kaheen ZYADA ooncha ho gaya tha.
  td.style.height = '';
  void table.offsetHeight;                        // naap dobara hone do

  // Qatar ki unchai: THEEK poori satrein, aur kam az kam unwaan jitni.
  // Koi faltu jagah nahi — na ooper, na neeche.
  let natural = 0;
  try { natural = lbl ? lbl.offsetHeight : 0; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  const target = Math.max(lh + wrapPad, natural);
  let h = td.clientHeight || target;
  td.style.height = Math.round(h) + 'px';
  for (let i = 0; i < 4; i++) {
    const diff = target - wrap.clientHeight;
    if (Math.abs(diff) < 1) break;
    h += diff;
    if (h < lh) h = lh;
    td.style.height = Math.round(h) + 'px';
  }
}
window._ch173AkhrajRowH = _ch173AkhrajRowH;

function _ch173StretchRow() {
  const doc = _ch173Doc();
  if (!doc) return;
  // اخراج / عدم پتہ ki 3-column table par yeh kaam NAHI chalta. Yahan neeche
  // wala 'querySelector' PEHLI qatar uthata hai — چالان mein pehli qatar hi
  // واحد data qatar hai (is liye wahan durust hai), magar اخراج mein 8 qatarein
  // hain aur woh pehli qatar (نام و پتہ مدعی) ko kheench kar poora safha bharne
  // ki koshish karta — table ka pehla khana bhadda lamba ho jata.
  if (doc.querySelector('.ch173-akhraj-table')) return;
  const row = doc.querySelector('#ch173-table tbody tr');
  if (!row) return;
  // AHEM: agar table ke NEECHE pehle se matn mojood hai to table ko safha
  // bharne ke liye BARHANA nahi. Barhane se sab khanon ke neeche khali jagah
  // bach jati hai (satar gap) — jab ke safha to neeche wale matn se khud hi
  // bhar jata hai. Barhana sirf us waqt jab neeche kuch bhi na ho (chhota
  // چالان), taake safha aadha khali na lage.
  try {
    const cont = doc.querySelector('[data-k="cont_text"]');
    if (cont && cont.innerText.replace(/\s/g, '').length) return;
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  const cur = row.offsetHeight;
  if (!cur) return;                                   // abhi naapa nahi gaya
  let padY = 0;
  try {
    const cs = getComputedStyle(doc);
    padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  const pageH  = ((_ch173Paper === 'a4') ? 11.7 : 13) * 96;
  const avail  = pageH - padY;                        // safhe mein kaam ki unchai
  const content = doc.scrollHeight - padY;            // is waqt ka poora matn
  const rest   = content - cur;                       // qatar ke ilawa sab kuch
  const target = Math.round(avail - rest);
  if (target > cur + 24) {                            // SIRF barhao (chhoti tabdeeli par nahi)
    row.querySelectorAll('td').forEach(c => { c.style.height = target + 'px'; });
    try { _ch173OverflowSettle(3); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  }
}
window._ch173StretchRow = _ch173StretchRow;

// ═══ کالم 7 ke neeche bachi KHALI JAGAH khatam karo ═══
// Matn satar-ba-satar behta hai, is liye aakhri satar ke baad thori jagah
// bach jati hai aur table ki lakeer us khali jagah ke neeche reh jati hai —
// yehi table aur us ke neeche wale matn ke darmiyan "gap" nazar aata tha.
// Ab qatar ko utna hi chhota kar dete hain jitni jagah khali bachi thi, taake
// lakeer aakhri satar ke saath aa jaye. Matn ZAYA nahi hota — neeche wala
// hissa bas thora ooper aa jata hai.
function _ch173TrimRowGap() {
  const { doc, cell } = _ch173Cells();
  if (!doc || !cell) return;
  const row = doc.querySelector('#ch173-table tbody tr');
  if (!row) return;
  // AHEM: yahan 'scrollHeight' se naap NA li jaye. Jab matn khane se CHHOTA
  // ho to scrollHeight khane ki poori unchai hi batata hai — yani khali jagah
  // hamesha 0 nikalti hai aur yeh kaam kabhi chalta hi nahi. Asal naap Range
  // se leni parti hai, jo batati hai ke matn WAQAI kahan khatam hua.
  let bacha = 0;
  try {
    const rg = document.createRange();
    rg.selectNodeContents(cell);
    const rr = rg.getBoundingClientRect();
    const cr = cell.getBoundingClientRect();
    if (!rr.height) return;                                 // khana khali hai
    let padB = 0;
    try { padB = parseFloat(getComputedStyle(cell).paddingBottom) || 0; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    // Safha scale hua ho to naap ko wapas asal paimane par lao
    const scale = (cell.offsetHeight && cr.height) ? (cr.height / cell.offsetHeight) : 1;
    bacha = Math.round(((cr.bottom - rr.bottom) / (scale || 1)) - padB);
  } catch (_) { return; }
  if (bacha <= 4) return;                                   // pehle se chipki hui
  const cur = row.offsetHeight;
  // Naamon ko jitni lambai chahiye us se neeche kabhi na jao — warna
  // khadi likhayi aur CNIC kat jayen.
  const farsh = Math.max(80, window._ch173MinRowH || 0);
  const naya = Math.max(farsh, cur - bacha);
  if (naya >= cur) return;
  row.querySelectorAll('td').forEach(c => { c.style.height = naya + 'px'; });
  try { _ch173OverflowSettle(2); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._ch173TrimRowGap = _ch173TrimRowGap;

// ═══════════════════════════════════════════════════════════════════
//  خانہ نمبر 1 تا 6 — چوڑائی اور لمبائی خودکار
//  • CHAURAI : jitni satren (log) us khane mein hain, utni chaurai.
//  • LAMBAI  : sab se lambi satar (naam + CNIC) jitni.
//  CNIC ki seedh yahan BILKUL nahi chhiri jati — har satar ka khana poori
//  unchai leta hai aur CNIC neeche jamta hai (wohi purana usool), is liye
//  naap badalne par bhi tamam CNIC aik hi seedh mein rehte hain.
// ═══════════════════════════════════════════════════════════════════
function _ch173AutoSize() {
  const doc = _ch173Doc();
  if (!doc) return;
  const table = doc.querySelector('#ch173-table');
  if (!table) return;
  const cols = [...table.querySelectorAll('colgroup col')];
  const tds  = [...table.querySelectorAll('tbody tr > td')];
  const row  = table.querySelector('tbody tr');
  if (cols.length < 7 || tds.length < 7 || !row) return;

  const kul = table.clientWidth;
  if (!kul) return;

  // ═══ AHEM — naap lene se PEHLE tamam pabandiyan hata do ═══
  // Warna naap us tang khane ki aati hai jo pehle se lagi hui hai, aur har
  // dafa chalne par khana aur tang hota chala jata hai — matn kat jata hai.
  // Afsar ne khud lakeer kheench kar chaurai tay ki ho to usay HARGIZ na
  // badlo (pehle yeh function har dafa chalte hi us ki mehnat mita deta tha —
  // font badalte hi ya khirki chhoti karte hi chaurai wapas khud-kar ho jati).
  // Unchai phir bhi khud-kar rehti hai, warna matn kat sakta hai.
  const manual = (table.dataset.colsManual === '1');
  const puraniW = cols.map(c => c.style.width);
  const puraniH = row.querySelector('td') ? row.querySelector('td').style.height : '';
  if (!manual) cols.forEach(c => { c.style.width = ''; });
  row.querySelectorAll('td').forEach(c => { c.style.height = '2400px'; });
  void table.offsetWidth;                              // nayi (khuli) naap lagne do

  const _sc = _ch173Scale();                           // scale ka hisaab
  const naapo = (el) => {                              // asal (qudrati) naap
    if (!el) return { w: 0, h: 0 };
    try {
      const rg = document.createRange();
      rg.selectNodeContents(el);
      const r = rg.getBoundingClientRect();
      return { w: Math.ceil(r.width / _sc), h: Math.ceil(r.height / _sc) };
    } catch (_) { return { w: el.scrollWidth || 0, h: el.scrollHeight || 0 }; }
  };

  // ── 1) Har khadi khane ki DARKAR chaurai + sab se lambi satar ──
  const darkar = [];
  let lambi = 0, jama = 0;
  for (let i = 0; i < 6; i++) {
    const inner = tds[i].querySelector('.rotinner');
    let w = 0;
    if (inner) {
      w = Math.max(naapo(inner).w, inner.scrollWidth || 0);
      const lns = inner.querySelectorAll('.ln');
      if (lns.length) {
        lns.forEach(ln => {
          // Khadi likhayi mein kisi cheez ki "lambai" us ki UNCHAI hoti hai
          const a = naapo(ln.querySelector('.nm')).h;
          const b = naapo(ln.querySelector('.cn')).h;
          if (a + b > lambi) lambi = a + b;
        });
      } else {
        const h = naapo(inner).h;
        if (h > lambi) lambi = h;
      }
    }
    w = Math.max(30, w + 12);                          // saans ki jagah
    // v552 (افسر کی ہدایت): کالم 2، 3، 4 (ملزمان) موجودہ چوڑائی سے 50% زیادہ
    if (i >= 1 && i <= 3) w = Math.round(w * R173_MULZIMAN_BOOST);
    darkar.push(w); jama += w;
  }

  // ── 2) کالم 7 ke liye jagah mehfooz ──
  const col7Kam = Math.max(140, Math.round(kul * 0.22));
  if (jama > kul - col7Kam) {
    const paimana = (kul - col7Kam) / jama;
    for (let i = 0; i < 6; i++) darkar[i] = Math.max(28, Math.floor(darkar[i] * paimana));
    jama = darkar.reduce((a, b) => a + b, 0);
  }
  let zyada = (jama + col7Kam) - kul;
  for (let g = 0; zyada > 0 && g < 40; g++) {
    let bara = 0;
    for (let i = 1; i < 6; i++) if (darkar[i] > darkar[bara]) bara = i;
    if (darkar[bara] <= 28) break;
    const kaato = Math.min(zyada, darkar[bara] - 28);
    darkar[bara] -= kaato; jama -= kaato; zyada -= kaato;
  }

  // ── 3) Naap lagao ──
  if (jama > 0 && lambi > 0) {
    if (manual) {
      cols.forEach((c, i) => { c.style.width = puraniW[i] || c.style.width; });
    } else {
      for (let i = 0; i < 6; i++) cols[i].style.width = darkar[i] + 'px';
      cols[6].style.width = Math.max(col7Kam, kul - jama) + 'px';
    }
    const nayiH = Math.max(140, lambi + 24);           // matn kabhi na kate
    row.querySelectorAll('td').forEach(c => { c.style.height = nayiH + 'px'; });
    window._ch173MinRowH = nayiH;
  } else {
    // Naap na mili to purani halat wapas — kuch bigadne se behtar hai
    cols.forEach((c, i) => { c.style.width = puraniW[i] || ''; });
    row.querySelectorAll('td').forEach(c => { c.style.height = puraniH || ''; });
  }
  try { _ch173OverflowSettle(3); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._ch173AutoSize = _ch173AutoSize;

// ═══════════════════════════════════════════════════════════════════
//  چالان کی ناپ — سب کچھ ایک ہی جگہ، ایک ہی ترتیب سے
//  Pehle yeh kaam alag alag waqton par chalte the (0/150/400/900/1500ms
//  aur har 1200ms nigrani) — har aik doosre ki naap badal deta tha. Isi
//  se pehli dafa kholne par matn chhupa milta tha aur doosri dafa gap
//  reh jata tha. Ab tarteeb PAKKI hai:
//    1. safha kaghaz ki naap par
//    2. khane apne matn ke barabar (chaurai + lambai)
//    3. qatar ko poori satron par gol karo  ← gap yahin khatam hota hai
//    4. matn jama do (jo na samaye woh neeche)
//    5. CNIC ki seedh
// ═══════════════════════════════════════════════════════════════════
function _ch173Layout() {
  try { _ch173FitPaper(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  // اخراج/عدم پتہ ki simple 3-column table hai (khadi likhayi nahi) — us par
  // چالان wali column auto-sizing na chalao. Baqi sab (SHO, کاغذات) chalti hai.
  const _akhrajTbl = !!document.querySelector('.ch173-akhraj-table');
  if (_akhrajTbl) {
    try { _ch173AkhrajGrips(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }     // khanon ki chaurai
    try { _ch173AkhrajRowH(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }      // row 8 ki unchai
    try { _ch173AkhrajHGrip(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }     // neeche wali lakeer kheenchne wala
  }
  if (!_akhrajTbl) {
    try { _ch173AutoFitCols(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }     // khanon ki chaurai (file ka apna)
    try { _ch173AutoSize(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }        // chaurai + lambai (matn ke mutabiq)
    try { _ch173RoundRow(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  }
  try { _ch173StretchRow(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }      // sirf tab jab neeche kuch na ho
  try { _ch173OverflowSettle(4); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  try { _ch173WrapCnics(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  try { _ch173AlignSho(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }        // SHO ki doosri line کاغذات ke neeche
  // Mehfooz result number کاغذات mein "اصل رزلٹ نمبری" ke neeche lagao
  try {
    const doc = _ch173Doc();
    const h = doc && doc.querySelector('input[data-k="result_no"]');
    const rv = h ? (h.value || '') : '';
    if (rv && doc) {
      doc.querySelectorAll('.pp-item').forEach(it => {
        const nm = it.querySelector('.pp-name');
        if (!nm) return;
        const t = nm.textContent.replace(/\s/g, '');
        if (t.indexOf('رزلٹنمبری') === -1) return;
        let rn = nm.querySelector('.pp-rno');
        if (!rn) { rn = document.createElement('span'); rn.className = 'pp-rno'; nm.appendChild(rn); }
        const want = rv ? (' ' + rv) : '';
        if (rn.textContent !== want) rn.textContent = want;
      });
    }
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._ch173Layout = _ch173Layout;

// ═══ اخراج table — column 2 ki bayen lakeer kheench kar chaurai badlo ═══
function _ch173AkhrajGrips() {
  const doc = _ch173Doc();
  if (!doc) return;
  const table = doc.querySelector('.ch173-akhraj-table');
  if (!table) return;
  const cols = table.querySelectorAll('colgroup col');
  if (cols.length < 3) return;
  // Mehfooz chaurai (agar officer ne khud set ki thi) wapas lagao;
  // warna column 2 apne content (sab se lambe unwaan) ke hisaab se KHUD theek.
  /* KHAMI THI: chaabi `dio_akhraj_col2` AIK thi — اخراج aur عدم پتہ, har
     مقدمہ, har aale par wohi. Aur neeche `up()` mouse ke khali CLICK par bhi
     likh deti thi. Aik dafa likhi jane ke baad neeche wali khud-kar chaurai
     (jo unwaan ki lambai ke mutabiq hoti hai) DOBARA kabhi nahi chalti thi.
     Ab: har qism ki apni chaabi, naap ki hadd, sirf sach much kheenchne par
     mehfooz, aur grip par DOUBLE-CLICK se dobara khud-kar. */
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(_r173AkhColKey()) || 'null'); } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  if (saved && _r173AkhColOk(saved.c2) && _r173AkhColOk(saved.c3)) {
    cols[1].style.width = saved.c2; cols[2].style.width = saved.c3;
  } else {
    // AUTO-FIT chaurai — column 2 SAB SE LAMBI likhayi wali row jitni.
    // AHEM: pehle yahan 'td.scrollWidth' se naap li jati thi. Table ke khane
    // ka scrollWidth us ki MOJOODA chaurai hi batata hai (matn chhota ho to
    // bhi) — is liye column sirf BARA ho sakta tha, kabhi CHHOTA nahi. Yehi
    // wajah thi ke unwaan ke bayen taraf khali jagah bach jati thi.
    // Ab aik chhupa hua paimana (probe) bana kar matn ki ASAL chaurai naapte
    // hain — khane ki chaurai us par asar nahi karti, is liye column ab
    // theek utna hi rehta hai jitni sab se lambi satar hai.
    try {
      const probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;' +
                            'top:-9999px;left:-9999px;pointer-events:none;';
      doc.appendChild(probe);
      let need = 0, padX = 0;
      table.querySelectorAll('.akh-col2').forEach(td => {
        let cs;
        try { cs = getComputedStyle(td); } catch (_) { return; }
        probe.style.font       = cs.font;
        probe.style.fontFamily = cs.fontFamily;
        probe.style.fontSize   = cs.fontSize;
        probe.style.fontWeight = cs.fontWeight;
        probe.style.letterSpacing = cs.letterSpacing;
        probe.textContent = (td.textContent || '').trim();
        const w = probe.offsetWidth;             // 'scale' is par asar nahi karta
        if (w > need) need = w;
        const p = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
        if (p > padX) padX = p;
      });
      probe.remove();
      const tW = table.offsetWidth;
      if (need && tW) {
        const c1 = cols[0].getBoundingClientRect().width || (tW * 0.07);
        let px = need + padX + 6;                  // thori saans
        const maxPx = tW - c1 - 120;               // col 3 ke liye kam az kam 120px
        if (px > maxPx) px = maxPx;
        if (px < 60) px = 60;
        cols[1].style.width = (px / tW * 100).toFixed(2) + '%';
        cols[2].style.width = ((tW - c1 - px) / tW * 100).toFixed(2) + '%';
      }
    } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  }
  table.querySelectorAll('.akh-grip').forEach(g => {
    if (g.dataset.bound) return;
    g.dataset.bound = '1';
    g.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const tW = table.offsetWidth;
      // Safha chhoti khirki mein `scale` par hota hai: rect ki naap chhoti
      // aati hai jabke `offsetWidth` asli. Dono ko aik paimane par lao,
      // warna lakeer mouse ke saath nahi chalti (chhalang lagati hai).
      const tRect = table.getBoundingClientRect();
      const sc = (tRect.width && tW) ? (tRect.width / tW) : 1;
      const c2 = cols[1].getBoundingClientRect().width / (sc || 1);
      const c3 = cols[2].getBoundingClientRect().width / (sc || 1);
      let moveWait = false, moved = false;
      const move = (ev) => {
        // RTL: column 2 ki BAYEN lakeer — dayen kheenchne se col2 barhta hai
        let d = (ev.clientX - startX) / (sc || 1);
        if (Math.abs(d) > 1) moved = true;
        let n2 = c2 - d, n3 = c3 + d;
        if (n2 < 60 || n3 < 80) return;
        cols[1].style.width = (n2 / tW * 100).toFixed(2) + '%';
        cols[2].style.width = (n3 / tW * 100).toFixed(2) + '%';
        // Column 3 tang/chaura hone se مختصر حالات ka matn dobara toot-ta hai —
        // jo na samaye woh table ke NEECHE chala jaye, aur jagah bane to wapas
        // ooper aa jaye. Kheenchte hue hi nazar aata rahe (har frame par aik
        // hi dafa — warna kheenchna bhaari ho jata hai).
        if (!moveWait) {
          moveWait = true;
          requestAnimationFrame(() => {
            moveWait = false;
            try { _ch173OverflowSettle(1); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
          });
        }
      };
      const up = () => {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
        if (moved) {
          const c2w = cols[1].style.width, c3w = cols[2].style.width;
          if (_r173AkhColOk(c2w) && _r173AkhColOk(c3w)) {
            try { localStorage.setItem(_r173AkhColKey(), JSON.stringify({ c2: c2w, c3: c3w })); } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
          }
        }
        // Chhorne par matn poori tarah jam jaye (ooper/neeche theek ho)
        try { _ch173OverflowSettle(4); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
        try { _ch173AlignSho(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
        try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      };
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    });
  });
}
window._ch173AkhrajGrips = _ch173AkhrajGrips;

// ═══ GAP ka asal ilaj — qatar ko POORI SATRON par gol karo ═══
// کالم 7 ka matn hamesha POORI satron mein behta hai. Agar qatar ki unchai
// satron ki naap ka theek guna na ho, to aakhir mein aadhi satar ki jagah
// KHALI bach jati hai — yehi "gap" hai. Isay chhota kar ke khatam nahi kiya
// ja sakta (warna naam kat jate hain), is liye ULTA karte hain: qatar ko
// agli POORI satar tak BARHA dete hain. Us se aik satar zyada matn khane
// mein aa jata hai aur khali jagah bilkul sifar ho jati hai — aur naam bhi
// mehfooz rehte hain (CNIC apni seedh mein hi rehte hain).
function _ch173RoundRow() {
  const { doc, cell } = _ch173Cells();
  if (!doc || !cell) return;
  const row = doc.querySelector('#ch173-table tbody tr');
  if (!row) return;
  let lh = 0, padT = 0;
  try {
    const cs = getComputedStyle(cell);
    lh = parseFloat(cs.lineHeight) || 0;
    padT = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  if (!lh || lh < 4) return;
  const chahiye = Math.max(row.offsetHeight, window._ch173MinRowH || 0);
  const andar   = Math.max(lh, chahiye - padT);
  const gol     = Math.ceil(andar / lh) * lh;              // poori satron par
  const naya    = Math.round(gol + padT);
  if (naya > 0 && Math.abs(naya - row.offsetHeight) >= 1) {
    row.querySelectorAll('td').forEach(c => { c.style.height = naya + 'px'; });
    window._ch173MinRowH = naya;
  }
}
window._ch173RoundRow = _ch173RoundRow;

// ═══ SHO ki doosri line — کاغذات ke بالکل نیچے ═══
// Pehli line تفصیل کاغذات ke khane ke barabar ooper se shuru hoti hai.
// Doosri line theek WAHAN se shuru honi chahiye jahan کاغذات ka aakhri
// hindsa (tadaad) khatam hota hai. Yeh naap CSS se nahi ho sakti kyunki
// کاغذات ki unchai un ki tadaad par munhasir hai — is liye yahan naap kar
// jagah tay karte hain.
// SHO ki lines ki jagah ab KHUD beh kar banti hai (float) — naap kar
// jagah tay karne ki zaroorat nahi rahi. Yeh sirf itna karta hai ke purani
// naap ke nishan (margins) saaf kar de, warna wo naye behao se takrate hain.
// ═══ Ooper wali SHO line — theek تاریخ wali jagah par ═══
// Khane ke andar tarteeb hai: pehle SHO ki line, phir us ke neeche تاریخ.
// Poore khane ko THEEK AIK SATAR neeche khiska dete hain — is se SHO ki line
// wahan aa jati hai jahan pehle تاریخ thi, aur تاریخ apni usi shakl mein aik
// satar neeche chali jati hai. Naap khud satar se li jati hai, is liye font
// ya satar ka fasla badle to bhi jagah theek rehti hai.
function _ch173AlignSho() {
  const doc = _ch173Doc();
  if (!doc) return;
  const b1 = doc.querySelector('.sho-b1');
  if (!b1) return;
  const rows = b1.querySelectorAll('.sho-cell-row');
  if (rows.length < 2) return;
  const aikSatar = rows[0].offsetHeight;          // SHO ki line ki unchai
  if (!aikSatar) return;
  b1.style.marginTop = Math.round(aikSatar) + 'px';
}
window._ch173AlignSho = _ch173AlignSho;

// ═══════════════════════════════════════════════════════════════════
//  مثل باندھنے کی جگہ — دوسرے صفحے کے اوپر بائیں کونے میں مثلث
//  Misal bandhne ke liye back side par ooper BAYEN kone mein tikoni (triangle)
//  jagah khali chhori jati hai: us ki nok top-left kone se juri, aur dono
//  lambe bazoo top margin aur left margin ke saath — har aik 2 inch.
//  Matn is tikone se bach kar behta hai.
//  NOTE: yeh SIRF chapai ke liye lagta hai; screen par koi tabdeeli nahi.
//  Sirf un safhon par jahan matn aata hai (pehle safhe par nahi).
// ═══════════════════════════════════════════════════════════════════
                       // tikone ke bazoo — 2 inch

function _ch173AddBindMarks() {
  const daale = [];
  const doc = _ch173Doc();
  if (!doc) return daale;
  const cont = doc.querySelector('[data-k="cont_text"]');
  if (!cont || !cont.firstChild) return daale;

  // Aik safhe mein kitni jagah hai (kaghaz minus ooper/neeche ke hashiye)
  const IN = 96;
  const safhaH = ((_ch173Paper === 'a4') ? 11.7 : 13) * IN;
  let hashiya = 0;
  try {
    const cs = getComputedStyle(doc);
    hashiya = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  const kaam = safhaH - hashiya;                // aik safhe ki kaam ki unchai
  if (kaam < 100) return daale;

  const docTop = doc.getBoundingClientRect().top;

  // cont ke tamam matn ke tukre + un ki lambai
  const tukre = [];
  let kul = 0;
  const w = document.createTreeWalker(cont, NodeFilter.SHOW_TEXT, null);
  let n;
  while ((n = w.nextNode())) {
    if (!n.nodeValue.length) continue;
    tukre.push({ node: n, shuru: kul });
    kul += n.nodeValue.length;
  }
  if (!kul) return daale;

  const jagah = (i) => {                        // i-wein harf ki jagah
    for (let k = 0; k < tukre.length; k++) {
      const t = tukre[k];
      if (i >= t.shuru && i < t.shuru + t.node.nodeValue.length) {
        try {
          const rg = document.createRange();
          rg.setStart(t.node, i - t.shuru);
          rg.setEnd(t.node, i - t.shuru + 1);
          const r = rg.getBoundingClientRect();
          return r.height ? (r.top - docTop) : null;
        } catch (_) { return null; }
      }
    }
    return null;
  };

  // Har safhe ki hadd par tikona daalo (pehla safha chhor kar)
  const aakhri = jagah(kul - 1);
  if (aakhri == null) return daale;
  const safhe = Math.floor(aakhri / kaam);      // matn kitne safhon tak gaya
  for (let p = 1; p <= safhe; p++) {
    const hadd = p * kaam;
    // Binary search — pehla harf jo is safhe par aata hai
    let lo = 0, hi = kul - 1, mila = -1;
    for (let g = 0; g < 24 && lo <= hi; g++) {
      const mid = (lo + hi) >> 1;
      const y = jagah(mid);
      if (y == null) { lo = mid + 1; continue; }
      if (y >= hadd) { mila = mid; hi = mid - 1; } else { lo = mid + 1; }
    }
    if (mila < 0) continue;
    for (const t of tukre) {
      const off = mila - t.shuru;
      if (off >= 0 && off < t.node.nodeValue.length) {
        try {
          const baad = t.node.splitText(off);
          // Safhe ka TOR theek yahan — taake aakhri satar BEECH se na kate.
          // Browser apne aap torta hai to nastaleeq ke lambe huroof us tor par
          // kat jate hain; hum jagah pehle se jante hain, is liye tor khud
          // lagate hain aur satar poori reh kar agle safhe par jati hai.
          const brk = document.createElement('span');
          brk.className = 'ch173-pgbrk';
          t.node.parentNode.insertBefore(brk, baad);
          daale.push(brk);
          // v553: مثلث + اوپر ایک سطر — صرف پچھلی طرف (جفت صفحہ: 2، 4 …)
          if ((p + 1) % 2 === 0) {
            const gap = document.createElement('span');
            gap.className = 'dio-bindgap';
            t.node.parentNode.insertBefore(gap, baad);
            daale.push(gap);
            const tri = document.createElement('span');
            tri.className = 'ch173-bind';
            t.node.parentNode.insertBefore(tri, baad);
            daale.push(tri);
          }
        } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
        break;
      }
    }
  }
  return daale;
}
window._ch173AddBindMarks = _ch173AddBindMarks;

// ═══ کالم 1 تا 6 ki chaurai KHUD-BA-KHUD (jitna mawad, utni chaurai) ═══
// Khadi likhayi mein har shakhs aik satar hai, aur satren dayen se bayen
// jamti hain — is liye khane ki zaroori chaurai = us ke andar ki tamam
// satron ki chaurai. Yehi naap kar har khane ko utni hi chaurai dete hain,
// aur bachi hui saari jagah کالم 7 (حالات) ko mil jati hai.
// AHEM: CNIC ki seedh yahan se BILKUL nahi chhirti — woh khane ki UNCHAI
// par mabni hai (.ln / space-between), chaurai par nahi.
// v552: کالم 2 (ملزمان جو گرفتار نہ ہوئے)، 3 (زیر حراست)، 4 (برضمانت) — 50% زیادہ چوڑے
const R173_MULZIMAN_BOOST = 1.5;
function _ch173AutoFitCols() {
  const doc = _ch173Doc();
  if (!doc) return;
  const table = doc.querySelector('#ch173-table');
  if (!table) return;
  if (table.dataset.colsManual === '1') return;      // officer ne khud naap li hai
  const cols = table.querySelectorAll('colgroup col');
  if (cols.length < 7) return;
  const tW = table.offsetWidth;
  if (!tW) return;

  // Har khane (1–6) ki zaroori chaurai naapo
  const need = [];
  for (let i = 0; i < 6; i++) {
    const td = table.querySelector('tbody tr td:nth-child(' + (i + 1) + ')');
    const inner = td ? td.querySelector('.rotinner') : null;
    if (!inner) { need.push(0); continue; }
    let w = 0;
    const purani = inner.style.maxWidth;
    try {
      inner.style.maxWidth = 'none';                 // hadd hata kar asal naap lo
      w = inner.scrollWidth;
    } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
    inner.style.maxWidth = purani;
    need.push(Math.round((Math.ceil(w) + 6) * ((i >= 1 && i <= 3) ? R173_MULZIMAN_BOOST : 1)));   // saans + v552: کالم 2–4 پر 50%
  }

  // Kam az kam itni jagah کالم 7 ke liye chhoro
  const kam7 = Math.max(140, Math.round(tW * 0.22));
  let kul = need.reduce((a, b) => a + b, 0);
  const mojood = tW - kam7;
  if (kul > mojood && kul > 0) {                     // jagah kam pare to sab ko barabar ghatao
    const k = mojood / kul;
    for (let i = 0; i < 6; i++) need[i] = Math.floor(need[i] * k);
    kul = need.reduce((a, b) => a + b, 0);
  }

  for (let i = 0; i < 6; i++) {
    cols[i].style.width = Math.max(24, need[i]) + 'px';
  }
  cols[6].style.width = Math.max(kam7, tW - kul) + 'px';
}
window._ch173AutoFitCols = _ch173AutoFitCols;

function _ch173Overflow() {
  const { cell, cont } = _ch173Cells();
  if (!cell || !cont) return;
  // Khane ki naap abhi hui hi nahi (unchai 0) — abhi kuch na karo. Warna
  // "sab kuch bahar hai" samajh kar poora matn neeche dhakel diya jata hai.
  if (!cell.clientHeight) return;
  const full = () => cell.scrollHeight > cell.clientHeight + 1;
  let guard = 0;

  // (a) Jo matn na samaye woh NEECHE bhejo — LAFZ-BA-LAFZ.
  // AHEM: agar aakhri cheez aik bara tukra ho to usay POORA na bhejo,
  // balke us ke ANDAR ja kar aakhri lafz nikaalo — warna paste kiya hua
  // sara matn aik saath neeche chala jata hai.
  while (full() && guard++ < 8000) {
    let node = cell.lastChild;
    if (!node) break;
    while (node.nodeType === 1 && node.lastChild) node = node.lastChild;
    if (node.nodeType === 3) {
      const t = node.nodeValue;
      const k = t.replace(/\s+$/, '').lastIndexOf(' ');
      if (k > 0) {
        const moved = t.slice(k);
        node.nodeValue = t.slice(0, k);
        cont.insertBefore(document.createTextNode(moved), cont.firstChild);
        continue;
      }
    }
    const par = node.parentNode;
    cont.insertBefore(node, cont.firstChild);
    if (par && par !== cell && !par.childNodes.length) par.remove();
  }

  // (b) Jagah bache to neeche se WAPAS uthao — LAFZ-BA-LAFZ
  // AHEM: yahan poora tukra na uthayen. Neeche ka matn aksar aik hi bara
  // tukra hota hai; usay poora uthane par woh khane mein samata nahi aur
  // foran wapas chala jata hai — natija yeh ke table bara karne par bhi
  // kuch WAPAS nahi aata tha. Is liye aik aik lafz kar ke uthate hain,
  // bilkul waise hi jaise neeche bhejte waqt karte hain.
  // (b0) NEECHE wale matn ke SHURU ke fazool nishan hatao.
  // AHEM: wahan aksar khali satar / <br> reh jata hai. Matn wapas laate waqt
  // sab se pehle wohi uthta hai aur khane mein POORI satar ghair leta hai —
  // is se kaam PEHLE hi qadam par ruk jata tha aur کالم 7 ki aakhri satar
  // adhoori reh jati thi. (Khali JAGAH nahi hatate — sirf khali nishan,
  //  warna lafz aapas mein jud jayen.)
  try {
    for (let g = 0; g < 200; g++) {
      const f = cont.firstChild;
      if (!f) break;
      if (f.nodeType === 1 &&
          (f.tagName === 'BR' || !f.textContent.replace(/[\s\u00A0]/g, ''))) {
        f.remove(); continue;
      }
      break;
    }
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }

  guard = 0;
  while (!full() && cont.firstChild && guard++ < 8000) {
    let node = cont.firstChild;
    while (node.nodeType === 1 && node.firstChild) node = node.firstChild;
    // Khali nishan (jaise <br>) ko khane mein na le jao — woh poori satar
    // kha jata hai aur kaam wahin ruk jata hai
    if (node.nodeType === 1 &&
        (node.tagName === 'BR' || !node.textContent.replace(/[\s\u00A0]/g, ''))) {
      const par0 = node.parentNode;
      node.remove();
      if (par0 && par0 !== cont && !par0.childNodes.length) par0.remove();
      continue;
    }

    if (node.nodeType === 3) {
      const t = node.nodeValue;
      const m = t.match(/^\s*\S+\s?/);            // sab se pehla lafz
      if (m && m[0].length < t.length) {
        const moved = m[0];
        node.nodeValue = t.slice(moved.length);
        const tn = document.createTextNode(moved);
        cell.appendChild(tn);
        if (full()) {                              // jagah nahi bani — wapas
          tn.remove();
          node.nodeValue = moved + node.nodeValue;
          break;
        }
        continue;
      }
    }

    // Aakhri/poora tukra
    const par = node.parentNode;
    const mark = document.createComment('');
    par.insertBefore(mark, node);                  // wapasi ke liye nishan
    cell.appendChild(node);
    if (full()) {                                  // jagah nahi bani — wapas
      par.insertBefore(node, mark);
      mark.remove();
      break;
    }
    mark.remove();
    if (par && par !== cont && !par.childNodes.length) par.remove();
  }

  // (c0) KHANE ke AAKHIR ki KHALI SATREN hatao.
  // Matn lafz-ba-lafz neeche jata hai, is liye khane ke aakhir mein fazool
  // khali jagah (spaces / khali satren / <br>) reh jati hai. Naap unhen
  // "matn" gin leti hai — is liye hisaab kehta tha "khali jagah sirf 4px" —
  // magar aankh ko woh poori khali satar nazar aati thi. Yehi table aur
  // neeche wale matn ke darmiyan bacha hua gap tha.
  try {
    for (let g = 0; g < 200; g++) {
      let last = cell.lastChild;
      if (!last) break;
      if (last.nodeType === 3) {
        const t = last.nodeValue.replace(/[\s\u00A0]+$/, '');
        if (t === last.nodeValue) break;          // aakhir mein kuch fazool nahi
        if (t) { last.nodeValue = t; break; }
        last.remove();                            // poora khali tukra
        continue;
      }
      if (last.nodeType === 1) {
        const tag = last.tagName;
        const khali = !last.textContent.replace(/[\s\u00A0]/g, '');
        if (tag === 'BR' || khali) { last.remove(); continue; }
      }
      break;
    }
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }

  // (c) TUKRE WAPAS JORO — matn lafz-ba-lafz hilta hai, is liye har lafz ka
  // apna alag tukra ban jata hai. Yeh tukre khud-ba-khud aik nahi hote, aur
  // itne saare tukron ki wajah se likhayi mein khali jagah (gap) nazar aane
  // lagti hai. normalize() saath saath ke tukron ko dobara aik kar deta hai.
  try { cell.normalize(); cont.normalize(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  // Aik se zyada khali jagah aik hi rakho (bar bar torne-jorne se banti hai)
  try {
    [cell, cont].forEach(host => {
      const w = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, null);
      let n;
      while ((n = w.nextNode())) {
        const fixed = n.nodeValue.replace(/[ \t\u00A0]{2,}/g, ' ');
        if (fixed !== n.nodeValue) n.nodeValue = fixed;
      }
    });
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._ch173Overflow = _ch173Overflow;

// ═══ Cursor ko khane ke AAKHIR par le jao ═══
// Matn neeche bhejne ke baad likhayi wahin se jari rahe (warna cursor
// shuru mein chala jata hai). AHEM: yeh function pehle KAHIN define hi
// nahi tha magar neeche pukara ja raha tha — is wajah se jab bhi khana
// bhar jata, wahan error aa kar amal beech mein hi ruk jata tha.
function _ch173CaretEnd(el) {
  try {
    if (!el) return;
    const r = document.createRange();
    r.selectNodeContents(el);
    r.collapse(false);                 // aakhir par
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._ch173CaretEnd = _ch173CaretEnd;

// Overflow ko bar bar chalao jab tak halat theek na ho jaye.
// (Aik dafa chalane se hamesha poora matn neeche nahi jata — matn hatne
//  ke baad khane ki naap badal jati hai, is liye dobara jaanchna zaroori hai.)
function _ch173OverflowSettle(times) {
  const n = times || 4;
  for (let i = 0; i < n; i++) { try { _ch173Overflow(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } }
}
window._ch173OverflowSettle = _ch173OverflowSettle;

// ═══ Nigrani — khana bhara reh jaye to khud neeche bhej do ═══
// Sirf tab chalta hai jab (a) matn waqai chhupa hua ho, aur (b) user us
// khane mein likh NA raha ho — is liye cursor kabhi nahi hilta.
function _ch173StartOverflowWatch() {
  try { if (window._ch173OvWatch) clearInterval(window._ch173OvWatch); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  window._ch173OvWatch = setInterval(function () {
    const cell = (_ch173Cells() || {}).cell;
    if (!cell) { try { clearInterval(window._ch173OvWatch); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } window._ch173OvWatch = null; return; }
    if (document.activeElement === cell) return;          // likhte waqt haath na lagao
    if (!cell.clientHeight) return;                        // abhi naapa nahi gaya
    if (cell.scrollHeight > cell.clientHeight + 1) _ch173OverflowSettle(2);
  }, 1200);
}
window._ch173StartOverflowWatch = _ch173StartOverflowWatch;


function _ch173BindOverflow() {
  const cell = (_ch173Cells() || {}).cell;
  if (!cell || cell._ovBound) return;
  cell._ovBound = true;
  // LIKHTE WAQT bhi khud-kar behe — magar sirf JAB khana bhar jaye.
  // (Har harf par chalane se cursor shuru mein chala jata tha; ab hum
  //  cursor ko wapas aakhir par le aate hain, is liye likhna nahi rukta.)
  // NOTE: 'input' par NAHI chalate — warna har harf par matn dobara set
  // hota hai aur cursor shuru mein chala jata hai. Sirf paste aur blur par.
  // SIRF paste par — blur par chalane se innerText formatting (bold/italic/
  // underline) mita deta tha. Ab likhi hui formatting mehfooz rehti hai.
  // USOOL: column 7 ka jo matn khane mein na samaye woh KHUD table ke
  // neeche wale khane mein chala jaye (aur jagah bane to wapas aa jaye).
  // Cursor khane ke SHURU se kitne harf aage hai
  const caretOffset = () => {
    try {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount || !cell.contains(sel.anchorNode)) return -1;
      const rg = sel.getRangeAt(0).cloneRange();
      const nap = document.createRange();
      nap.selectNodeContents(cell);
      nap.setEnd(rg.endContainer, rg.endOffset);
      return nap.toString().length;
    } catch (_) { return -1; }
  };
  // Cursor wapas usi jagah par
  const caretSet = (off) => {
    if (off < 0) return;
    try {
      const w = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT, null);
      let jama = 0, n, node = null, pos = 0;
      while ((n = w.nextNode())) {
        const L = n.nodeValue.length;
        if (jama + L >= off) { node = n; pos = off - jama; break; }
        jama += L; node = n; pos = L;
      }
      if (!node) return;
      const rg = document.createRange();
      rg.setStart(node, Math.min(pos, node.nodeValue.length));
      rg.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(rg);
    } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  };

  const run = () => {
    if (!cell) return;
    const off  = caretOffset();
    const inCell = off >= 0;
    const bhara  = cell.scrollHeight > cell.clientHeight + 1;
    // AHEM: agar officer khane ke ANDAR likh raha hai aur khana abhi BHARA
    // NAHI to kuch bhi na hilao. Pehle yahan bhi matn ko neeche-ooper karne
    // wala kaam chal padta tha — us se cursor ki jagah zaya ho jati thi aur
    // browser usay matn ke SHURU par le jata tha (aakhri aadhi satar mukammal
    // karte waqt yehi hota tha).
    if (inCell && !bhara) return;
    _ch173Overflow();
    // Cursor wahin wapas jahan tha (aakhir par nahi — theek usi jagah)
    if (inCell) caretSet(off);
  };
  let _t = null;
  cell.addEventListener('input', () => { clearTimeout(_t); _t = setTimeout(run, 350); });
  // PASTE: matn SAADA shakl mein daalo.
  // WAJAH: Word/browser se paste hone par sara matn AIK BARE TUKRE ki
  // shakl mein aata tha — is liye woh poora ka poora aik saath neeche
  // chala jata tha. Saada matn hone se woh lafz-ba-lafz taqseem hota hai
  // aur khane mein jitna samaye utna wahin rehta hai.
  // (Is se font ka aadha-aadha hona bhi khatam ho jata hai.)
  cell.addEventListener('paste', (e) => {
    try {
      e.preventDefault();
      const t = ((e.clipboardData || window.clipboardData).getData('text/plain') || '');
      if (typeof _ch173Insert === 'function') _ch173Insert(t);
      setTimeout(run, 60);
    } catch (_) { setTimeout(run, 150); }
  });
}
window._ch173BindOverflow = _ch173BindOverflow;

// ═══ ملزمان / گواہان — case record se ═══
let _ch173Accused  = null;   // [{id,name,accused_type}]
let _ch173Witnesses = null;  // [{id,full_name,witness_type}]
let _ch173Version = 'fir';   // 'fir' ya 'cross_version'

// Version badlo — ملزمان/گواہان aur mehfooz data dono badal jate hain
function _ch173SetVersion(v) {
  const nv = (v === 'cross_version') ? 'cross_version' : 'fir';
  if (nv === _ch173Version) return;
  _ch173Version = nv;
  // FIR aur کراس ورژن do ALAG چالان hain — purani satar par na likho
  try { _r173SyncDocId(); } catch (_) { _r173DocId = null; }
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
      .select('id,name,cnic,accused_type').eq('case_id', cid).order('created_at', { ascending: true });
    _ch173Accused = acc || [];
  } catch(_) { _ch173Accused = []; }
  try {
    const { data: wit } = await supabaseClient.from('case_witnesses')
      .select('id,full_name,cnic,witness_type').eq('case_id', cid).order('created_at', { ascending: true });
    _ch173Witnesses = wit || [];
  } catch(_) { _ch173Witnesses = []; }
  // Data aane par گواہان wala khana bhar do (agar khali ho)
  try {
    const wcell = document.querySelector('#ch173-table [data-k="shahadat"]');
    if (wcell) _ch173FillWitnessCell();
    try { _ch173WrapCnics(); } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    if (typeof _ch173SizeRotated === 'function') _ch173SizeRotated();
  } catch(_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
}

// Tamam گواہان aik line mein
// ═══════════════════════════════════════════════════════════════
//  SARKARI GAWAH — محرر · تفتیشی افسر · میڈیکل آفیسر
//  USOOL: محرر, تفتیشی افسر aur میڈیکل آفیسر BHI گواہ hote hain.
//   • محرر         — نیا مقدمہ درج karte waqt jo naam likha jata hai
//                    (case ka 'fir_writer' khana).
//   • تفتیشی افسر  — jo afsar is software ka subscriber hai, yani abhi
//                    logged-in officer (currentOfficer.full_name).
//   • میڈیکل آفیسر — SIRF us waqt jab تفصیل کاغذات mein ایم ایل سی /
//                    میڈیکل سرٹیفکیٹ / پوسٹ مارٹم رپورٹ chuna jaye.
//                    Naam mehfooz na ho to system aik dafa poochta hai.
//  Teenon کالم 6 (تفصیل شہادت) mein naam + CNIC ke saath lagte hain.
//  CNIC na mile to '00000-0000000-0' (bilkul baqi گواہان ki tarah).
// ═══════════════════════════════════════════════════════════════
// CNIC ka nishan sirf FORM ke khali khane (placeholder) ke liye — گواہان
// wale khane mein CNIC na mile to jagah BILKUL KHALI rehti hai (zero wala
// nishan wahan nahi lagta).
const R173_CNIC_KHALI = '00000-0000000-0';

// CNIC — mile to LAZMI darj ho; na mile to KHALI (koi zero wala nishan nahi)
function _ch173CnicFmt(v) {
  const d = String(v || '').replace(/\D/g, '');
  if (d.length !== 13) return '';
  return d.slice(0, 5) + '-' + d.slice(5, 12) + '-' + d.slice(12);
}

// تھانہ ka naam naam ke aage — sirf محرر aur تفتیشی افسر ke liye
function _ch173WithThana(name, station) {
  name = String(name || '').trim();
  const st = String(station || '').trim();
  if (!name || !st) return name;
  if (name.indexOf(st) !== -1) return name;        // pehle se likha hai
  return name + ' تھانہ ' + st;
}

// مدعی — کالم 6 mein SAB SE PEHLA گواہ
function _ch173Madai() {
  const c = _r173Case || {};
  const nm = String(c.complainant || '').trim();
  if (!nm) return null;
  return { name: nm, cnic: _ch173CnicFmt(c.complainant_cnic) };
}

// محرر — mojooda مقدمہ ke card se (naam ke aage تھانہ)
function _ch173Muharrir() {
  const c = _r173Case || {};
  const nm = String(c.fir_writer || '').trim();
  if (!nm) return null;
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  return {
    name: _ch173WithThana(nm, c.case_station || o.station),
    cnic: _ch173CnicFmt(c.fir_writer_cnic)
  };
}

// تفتیشی افسر — yehi subscriber (abhi logged-in) afsar hai. SAB SE AAKHRI گواہ.
// v552: نام کے ساتھ عہدہ (ASI / SI / IP / DSP …) — «فیاض حسین شاد ASI تھانہ صدر ملتان»
//   (ضمنی کی «مرتبہ» سطر جیسا)۔ `legacy` = پرانا بغیر عہدہ والا نام — پہلے سے محفوظ
//   چالان میں وہی لکھا ہے، اسے بھی تفتیشی افسر ہی پہچانا جائے (دوہرا نہ لگے)۔
function _ch173IORank(o) {
  return String((o && (o.designation || o.rank)) || '').replace(/\s+/g, ' ').trim();
}
function _ch173IO() {
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const c = _r173Case || {};
  const nm = String(o.full_name || '').trim();
  if (!nm) return null;
  const st = o.station || c.case_station;
  const rank = _ch173IORank(o);
  const withRank = (rank && nm.indexOf(rank) === -1) ? (nm + ' ' + rank) : nm;
  return {
    name: _ch173WithThana(withRank, st),
    legacy: _ch173WithThana(nm, st),
    cnic: _ch173CnicFmt(o.cnic)
  };
}
// یہ نام تفتیشی افسر (subscriber) کا ہے؟ — نیا (عہدہ سمیت) یا پرانا
function _ch173IsIOName(n, io) {
  io = io || _ch173IO();
  return !!io && (_ch173SameName(n, io.name) || _ch173SameName(n, io.legacy));
}

// میڈیکل آفیسر — aik dafa poochne ke baad mehfooz (thane ke hisab se)
const R173_MED_KEY = 'dio_ch173_medical_officer';
function _ch173MedGet() {
  try {
    const o = JSON.parse(localStorage.getItem(R173_MED_KEY) || 'null');
    if (o && String(o.name || '').trim()) {
      return { name: String(o.name).trim(), cnic: _ch173CnicFmt(o.cnic) };
    }
  } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  return null;
}
function _ch173MedSet(name, cnic) {
  try {
    localStorage.setItem(R173_MED_KEY, JSON.stringify({
      name: String(name || '').trim(), cnic: String(cnic || '').trim()
    }));
  } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
}
window._ch173MedSet = _ch173MedSet;

// کالم 6 ka khana
function _ch173WitCell() {
  return document.querySelector('#ch173-doc [data-k="shahadat"]');
}

// ═══ فہرست گواہان (اخراج) ke ALAG safhe ki satrein ═══
function _ch173GwThana() {
  const c = _r173Case || {};
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const st = String(c.case_station || o.station || '').trim();
  return st ? 'تھانہ ' + st : 'تھانہ';
}
function _ch173GwZila() {
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const c = _r173Case || {};
  const d = String(o.district || c.case_district || '').trim();
  return d ? 'ضلع ' + d : 'ضلع';
}
function _ch173GwMadai() {
  const c = _r173Case || {};
  const nm = String(c.complainant || '').trim();
  // Lafz 'مدعی' nahi — 'سرکار بذریعہ' likha jata hai
  return nm ? 'سرکار بذریعہ ' + nm : 'سرکار بذریعہ';
}
function _ch173GwCaseLine(c) {
  c = c || _r173Case || {};
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const j = (typeof _ch173JurmParts === 'function')
    ? _ch173JurmParts(c.section_of_law) : { body: c.section_of_law || '', suffix: '' };
  const st = String(c.case_station || o.station || '').trim();
  return 'مقدمہ نمبر ' + (c.fir_number || '') +
         ' مورخہ ' + (formatDate(c.fir_date) || '') +
         ' جرم ' + [j.body, j.suffix].filter(Boolean).join(' ') +
         (st ? ' تھانہ ' + st : '');
}

// ═══ کالم 6 ko HAR BAAR bharo — har qism ke liye ═══
// AHEM: pehle yeh sara kaam _ch173LoadPeople() ke andar tha, aur woh SIRF
// pehli dafa chalta hai (`if (!_ch173Accused) _ch173LoadPeople()`). Chunanche
// jab officer چالان مکمل se نامکمل / تتمہ / 512 par jata tha to yeh kabhi
// chalta hi nahi tha — isi liye wahan نہ مدعی aata tha, نہ محرر, نہ تفتیشی
// افسر, aur na hi مکمل wali fehrist ki naqal hoti thi.
// Ab yeh alag function hai jo HAR render par chalta hai.
function _ch173FillWitnessCell() {
  const el = _ch173WitCell();
  if (!el) return;
  // 1) چالان مکمل ki fehrist — نامکمل / تتمہ / 512 mein bhi wohi
  try { _ch173InheritWitnesses(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  // 2) مقدمے ke apne گواہان — HAMESHA milao, sirf "khali ho to" NAHI.
  //    AHEM: گواہان Supabase se aate hain (der lagti hai). Pehli dafa yeh
  //    khana un se PEHLE hi مدعی/محرر/تفتیشی افسر se bhar jata tha, aur jab
  //    گواہان aate the to "khana khali nahi hai" keh kar chhor diya jata tha.
  //    Isi liye PEHLI dafa چالان مکمل adhoora aata tha, aur dobara kholne par
  //    (jab list pehle se mehfooz thi) poora nazar aata tha.
  try { _ch173MergeCaseWitnesses(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  // 3) مدعی pehla, محرر aur تفتیشی افسر apni jagah par
  try { _ch173AddDefaultOfficials(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  // 4) کاغذات mein ایم ایل سی / پوسٹ مارٹم ho to میڈیکل آفیسر bhi
  try {
    const pb = document.querySelector('#ch173-doc [data-k="papers_body"]');
    if (pb) {
      const nms = _ch173PapersRead(pb).map(it => it.name);
      if (nms.length) _ch173EnsureMedicalWitness(nms);
    }
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  try { _ch173WrapCnics(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._ch173FillWitnessCell = _ch173FillWitnessCell;

// ═══ گواہان ki PAKKI TARTEEB — 15 darje ═══
//  1 مدعی · 2 FIR گواہان · 3 دیگر گواہان · 4 میڈیکل آفیسر ·
//  5 کانسٹیبل (4525/C) · 6 ہیڈ کانسٹیبل (1009/HC) ·
//  7 ASI · 8 SI · 9 انسپکٹر (IP) · 10 DSP / SDPO · 11 SP · 12 SSP ·
// 13 مجسٹریٹ · 14 محرر · 15 تفتیشی افسر (subscriber)
// Ohde ka pata naam mein likhe darje se chalta hai (English ya Urdu dono).
// Subscriber (تفتیشی افسر) hamesha 15 — chahe us ka ohda kuch bhi ho.
const _CH173_RANKS = [
  [14, /محرر|MOHARRIR|MUHARRIR/i],                    // محرر — HC se PEHLE
  [13, /مجسٹریٹ|MAGISTRATE/i],
  [12, /\bS\.?\s?S\.?\s?P\b|ایس\s*ایس\s*پی/i],        // SSP — SP se pehle
  [10, /\bS\.?\s?D\.?\s?P\.?\s?O\b|\bD\.?\s?S\.?\s?P\b|ڈی\s*ایس\s*پی|ایس\s*ڈی\s*پی\s*او/i],
  [11, /\bS\.?\s?P\b|ایس\s*پی/i],
  [ 9, /\bI\.?\s?P\b|\bINSPECTOR\b|انسپکٹر/i],
  [ 7, /\bA\.?\s?S\.?\s?I\b|اے\s*ایس\s*آئی/i],        // ASI — SI se pehle
  [ 8, /\bS\.?\s?I\b|ایس\s*آئی/i],
  [ 6, /\d+\s*\/\s*H\.?\s*C\b|ہیڈ\s*کانسٹیبل/i],      // 1009/HC
  [ 5, /\d+\s*\/\s*C\b|کانسٹیبل/i],                   // 4525/C
];

// مقدمے ke گواہان jo abhi fehrist mein nahi — unhen milao (mojooda matn
// zaya kiye baghair). Tarteeb baad mein _ch173WitSort khud theek kar deta hai.
function _ch173MergeCaseWitnesses() {
  const el = _ch173WitCell();
  if (!el) return false;
  const L = (typeof _ch173WitList === 'function') ? _ch173WitList() : (_ch173Witnesses || []);
  if (!L || !L.length) return false;
  try { _ch173UnwrapCnics(el); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  const list = _ch173WitParse(el);
  let naya = false;
  L.forEach(w => {
    const nm = String(w.full_name || '').trim();
    if (!nm) return;
    if (list.some(x => _ch173SameName(x.name, nm))) return;
    list.push({ name: nm, cnic: _ch173CnicFmt(w.cnic) });
    naya = true;
  });
  if (!naya) return false;
  _ch173WitWrite(el, _ch173WitSort(list));
  return true;
}
window._ch173MergeCaseWitnesses = _ch173MergeCaseWitnesses;

// FIR گواہ hai ya دیگر — مقدمے ki apni fehrist se pehchano (naam ke zariye).
// Yeh zaroori hai kyunki khane mein sirf naam likha hota hai, حیثیت nahi —
// aur us ke baghair FIR گواہان (darja 2) aur دیگر (darja 3) alag nahi hote.
function _ch173CaseWitRank(name) {
  const L = _ch173Witnesses || [];
  for (let i = 0; i < L.length; i++) {
    if (_ch173SameName(L[i].full_name, name)) {
      const t = String(L[i].witness_type || '');
      return /fir|چشم\s*دید/i.test(t) ? 2 : 3;
    }
  }
  return 0;
}

function _ch173WitRank(name, hint) {
  const n = String(name || '');
  // Khaas kirdaar pehle — inka darja pakka hai
  const io = _ch173IO();
  if (io && _ch173IsIOName(n, io)) return 15;         // subscriber hamesha AAKHRI
  const md = _ch173Madai();
  if (md && _ch173SameName(n, md.name)) return 1;
  const mh = _ch173Muharrir();
  if (mh && _ch173SameName(n, mh.name)) return 14;
  const med = _ch173MedGet();
  if (med && _ch173SameName(n, med.name)) return 4;
  if (hint === 1 || hint === 2 || hint === 3 || hint === 4) return hint;
  // مقدمے ka apna FIR گواہ (darja 2) — ohde walon se pehle dekho
  const cw = _ch173CaseWitRank(n);
  if (cw === 2) return 2;
  for (let i = 0; i < _CH173_RANKS.length; i++) {
    if (_CH173_RANKS[i][1].test(n)) return _CH173_RANKS[i][0];
  }
  return hint || cw || 3;                             // دیگر گواہ
}

// Fehrist ko darje ke mutabiq jamao — aik hi darje ke andar tarteeb wohi
// rehti hai jo officer ne rakhi hai (stable sort).
function _ch173WitSort(list) {
  return list
    .map((w, i) => ({ w: w, i: i, r: _ch173WitRank(w.name, w.rank) }))
    .sort((a, b) => (a.r - b.r) || (a.i - b.i))
    .map(x => x.w);
}

// ═══ اخراج ki فہرست گواہان ═══
// Sarkari 3-column table mein گواہان ka khana nahi hota, magar اخراج ke saath
// fehrist HAR BAAR muratab honi chahiye. Is liye woh table ke neeche apne
// alag khane mein banti hai — tarteeb wohi jo چالان mein hai:
// PEHLA مدعی → baqi گواہان → محرر → AAKHRI تفتیشی افسر.
// Sirf اخراج ke saath — ALAG kaghaz par. عدم پتہ ke saath yeh fehrist nahi hoti.
function _ch173AkhrajWitnessText() {
  const L = (typeof _ch173WitList === 'function') ? _ch173WitList() : (_ch173Witnesses || []);
  const list = [];
  const push = (o) => {
    if (!o || !o.name) return;
    if (list.some(x => _ch173SameName(x.name, o.name))) return;
    list.push(o);
  };
  const madai = _ch173Madai();
  if (madai) push({ name: madai.name, cnic: madai.cnic, rank: 1 });
  // FIR گواہان (darja 2) aur دیگر گواہان (darja 3) — گواہ ki apni حیثیت se
  (L || []).forEach(w => {
    const nm = String(w.full_name || '').trim();
    if (!nm) return;
    const t = String(w.witness_type || w.status || '');
    const isFir = /FIR|چشم\s*دید/i.test(t);
    push({ name: nm, cnic: _ch173CnicFmt(w.cnic), rank: isFir ? 2 : 3 });
  });
  const med = _ch173MedGet();
  if (med) push({ name: med.name, cnic: _ch173CnicFmt(med.cnic), rank: 4 });
  const mh = _ch173Muharrir();
  if (mh) push({ name: mh.name, cnic: mh.cnic, rank: 14 });
  const io = _ch173IO();
  if (io) push({ name: io.name, cnic: io.cnic, rank: 15 });
  if (!list.length) return '';
  // Har گواہ ki apni satar: naam DAYEN, CNIC apni ALAG field mein (sab aik
  // hi seedh mein, LTR) — bilkul waise hi jaise چالان mein muqarrar hai.
  // CNIC na ho to field KHALI rehti hai (zero zero wala nishan nahi).
  const E = (t) => String(t == null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return _ch173WitSort(list).map((w, i) =>
    '<div class="gw-ln"><span class="gw-nm">' +
      E((list.length > 1 ? (i + 1) + '\u06D4 ' : '') + w.name) +   // v558: اکیلا ہو تو «1» نہیں
    '</span><span class="gw-cn">' + E(w.cnic || '') + '</span></div>'
  ).join('');
}
window._ch173AkhrajWitnessText = _ch173AkhrajWitnessText;

// ═══ چالان مکمل ke گواہان — baqi چالان iqsam mein bhi ═══
// USOOL: جتنے گواہان چالان مکمل میں ہوں، وہی سب چالان نامکمل، تتمہ چالان
// اور چالان 512 ض ف میں بھی شامل ہوں گے. (اخراج / عدم پتہ ki alag fehrist
// hoti hai — us ka apna khana hai, wahan yeh naqal nahi hoti.)
const R173_WIT_INHERIT = ['namukammal', 'ch512', 'tatima_challan'];

// چالان مکمل ka mehfooz shuda کالم 6 — jahan se naqal hoti hai
function _ch173MukammalWitnesses() {
  try {
    const keys = Object.keys(_r173Records || {});
    // 'mukammal' ya 'mukammal::<version>' — jo bhi mile
    const k = keys.filter(x => x === 'mukammal' || x.indexOf('mukammal::') === 0);
    for (let i = k.length - 1; i >= 0; i--) {
      const d = _r173Records[k[i]];
      const s = d && d.shahadat;
      if (s && String(s).replace(/<[^>]*>/g, '').trim()) return String(s);
    }
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  return '';
}

// چالان مکمل ke گواہان mojooda چالان mein le aao (sirf un iqsam mein jinhen
// wirasat milni chahiye, aur SIRF jab khana khali ho — officer ka likha hua
// kabhi zaya nahi hota).
function _ch173InheritWitnesses() {
  if (R173_WIT_INHERIT.indexOf(_r173Type) === -1) return false;
  const el = _ch173WitCell();
  if (!el || el.innerText.trim()) return false;            // pehle se kuch hai
  const raw = _ch173MukammalWitnesses();
  if (!raw) return false;
  // Mehfooz matn mein CNIC ke <span> hote hain — saada matn nikal lo
  const tmp = document.createElement('div');
  tmp.innerHTML = raw;
  const txt = (tmp.innerText || '').trim();
  if (!txt) return false;
  el.innerText = txt;
  try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  return true;
}
window._ch173InheritWitnesses = _ch173InheritWitnesses;

// Khane ki har satar ko { naam, CNIC } mein tor lo
function _ch173WitParse(el) {
  const out = [];
  if (!el) return out;
  // Aik satar mein aik YA do gawah ho sakte hain (chhote naam do-per-satar).
  // Is liye har satar ko andar mojood '<number>\u06D4 ' markers par bhi tor kar
  // har hissay ko alag gawah samjho — warna do-per-satar wala data kharab hota.
  const raw = (el.innerText || '').replace(/\u00A0/g, ' ');
  raw.split(/\r?\n/).forEach(line => {
    if (!line.trim()) return;
    // Har '<digits>\u06D4 ' se pehle tor do; pehla khali hissa chhod do.
    line.split(/\s*\d+\u06D4\s+/).forEach(seg => {
      let t = String(seg || '').trim();
      if (!t) return;
      let cnic = '';
      const m = t.match(/(\d{5}-\d{7}-\d)\s*$/);
      if (m) { cnic = m[1]; t = t.slice(0, m.index).trim(); }
      t = t.replace(/\s+/g, ' ').trim();
      if (t) out.push({ name: t, cnic: cnic });
    });
  });
  return out;
}

// Fehrist wapas khane mein — نمبر شمار nayi tarteeb se.
// CNIC na ho to us ki jagah BILKUL KHALI (zero wala nishan nahi).
function _ch173WitWrite(el, list) {
  if (!el) return;
  // gawahan column: sirf number + naam (CNIC nahi). Chhote naam do-per-satar.
  const _out = [];
  let _sr = 0, _i = 0;
  while (_i < list.length) {
    const a = String((list[_i] && list[_i].name) || '').trim();
    const aShort = a.length > 0 && a.length <= 14;
    const nb = (_i + 1 < list.length) ? String((list[_i + 1] && list[_i + 1].name) || '').trim() : null;
    const bShort = nb != null && nb.length > 0 && nb.length <= 14;
    if (aShort && bShort) {
      const s1 = ++_sr, s2 = ++_sr;
      _out.push(s1 + '\u06D4 ' + a + '\u2003' + s2 + '\u06D4 ' + nb);
      _i += 2;
    } else {
      _out.push(list.length > 1 ? (++_sr) + '\u06D4 ' + a : a);   // v558: اکیلا ہو تو «1» نہیں
      _i += 1;
    }
  }
  el.innerText = _out.join('\n');
  try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}

const _ch173SameName = (a, b) =>
  !!a && !!b && String(a).replace(/\s+/g, ' ').trim() === String(b).replace(/\s+/g, ' ').trim();

// Aik گواہ کالم 6 mein — pehle se ho to DOBARA nahi
function _ch173AddWitness(name, cnic) {
  name = String(name || '').trim();
  if (!name) return false;
  const el = _ch173WitCell();
  if (!el) return false;
  // AHEM: naam PARHNE se PEHLE CNIC ke <span> khol do. Mehfooz چالان dobara
  // kholne par CNIC '.ln/.cn' mein lipta hota hai — us soorat mein satar ki
  // shakl badal jati hai aur purana naam pehchana nahi jata. Nateeja: har
  // dafa kholne par naam DOBARA lag jata.
  try { _ch173UnwrapCnics(el); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  const list = _ch173WitParse(el);
  if (list.some(w => _ch173SameName(w.name, name))) return false;
  // تفتیشی افسر hamesha AAKHRI گواہ — naya naam us se PEHLE aata hai
  const io = _ch173IO();
  let at = list.length;
  if (io) {
    const idx = list.findIndex(w => _ch173IsIOName(w.name, io));
    if (idx !== -1) at = idx;
  }
  list.splice(at, 0, { name: name, cnic: _ch173CnicFmt(cnic) });
  _ch173WitWrite(el, list);
  return true;
}
window._ch173AddWitness = _ch173AddWitness;

// ═══ کالم 6 ki PAKKI TARTEEB ═══
// USOOL: PEHLA گواہ مدعی, AAKHRI گواہ تفتیشی افسر. Beech mein baqi گواہان,
// aur un ke baad محرر. Officer ka apna likha hua matn zaya nahi hota —
// sirf tarteeb theek hoti hai aur نمبر شمار nayi ginti par aa jate hain.
function _ch173AddDefaultOfficials() {
  const el = _ch173WitCell();
  if (!el) return false;                       // اخراج/عدم پتہ mein yeh khana hai hi nahi
  try { _ch173UnwrapCnics(el); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  const pehle = el.innerText;
  let list = _ch173WitParse(el);

  const khaas = [_ch173Madai(), _ch173Muharrir(), _ch173IO()];
  // Agar in ka naam pehle se fehrist mein hai to nikal lo — magar us par
  // officer ka likha hua CNIC zaya na ho (system ke paas na ho to wohi rahe)
  khaas.forEach(o => {
    if (!o) return;
    // v552: تفتیشی افسر کا پرانا (بغیر عہدہ) نام بھی — ورنہ پرانے چالان میں دو بار
    for (let idx = list.findIndex(w => _ch173SameName(w.name, o.name) || (o.legacy && _ch173SameName(w.name, o.legacy)));
         idx !== -1;
         idx = list.findIndex(w => _ch173SameName(w.name, o.name) || (o.legacy && _ch173SameName(w.name, o.legacy)))) {
      if (!o.cnic && list[idx].cnic) o.cnic = list[idx].cnic;
      list.splice(idx, 1);
    }
  });

  const [madai, muharrir, io] = khaas;
  const fin = [];
  if (madai) fin.push({ name: madai.name, cnic: madai.cnic, rank: 1 });
  fin.push(...list);                           // baqi گواہان (darja khud lagta hai)
  if (muharrir) fin.push({ name: muharrir.name, cnic: muharrir.cnic, rank: 14 });
  if (io) fin.push({ name: io.name, cnic: io.cnic, rank: 15 });
  if (!fin.length) return false;

  // Muqarrara darja bandi par jamao (مدعی pehla … تفتیشی افسر aakhri)
  _ch173WitWrite(el, _ch173WitSort(fin));
  if (el.innerText === pehle) return false;    // kuch badla hi nahi
  try { _ch173Layout(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  return true;
}
window._ch173AddDefaultOfficials = _ch173AddDefaultOfficials;

// کاغذات mein ایم ایل سی / میڈیکل / پوسٹ مارٹم hai ya nahi
const R173_MED_RE = /(ایم\s*ایل\s*سی|MLC|میڈیکل|میڈیکو|پوسٹ\s*مارٹم|پوسٹمارٹم)/i;
function _ch173NeedsMedical(names) {
  return (names || []).some(n => R173_MED_RE.test(String(n || '')));
}

// میڈیکل آفیسر ko کالم 6 mein lao — naam mehfooz na ho to POOCHO
function _ch173EnsureMedicalWitness(names) {
  if (!_ch173NeedsMedical(names)) return;
  const el = _ch173WitCell();
  if (!el) return;
  const saved = _ch173MedGet();
  if (saved) {
    if (_ch173AddWitness(saved.name, saved.cnic)) {
      try { _ch173Layout(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      if (typeof showToast === 'function') {
        showToast('میڈیکل آفیسر بطور گواہ شامل — ' + saved.name, 'success');
      }
    }
    return;
  }
  _ch173AskMedical();
}
window._ch173EnsureMedicalWitness = _ch173EnsureMedicalWitness;

// میڈیکل آفیسر ka naam poochne wala chhota sa khana
function _ch173AskMedical() {
  document.getElementById('ch173-med-ask')?.remove();
  const cur = _ch173MedGet() || { name: '', cnic: '' };
  const ov = document.createElement('div');
  ov.id = 'ch173-med-ask';
  ov.style.cssText =
    'position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.45);' +
    'display:flex;align-items:center;justify-content:center;padding:16px;';
  ov.innerHTML = `
    <div style="background:#fff;border-radius:12px;width:340px;max-width:94vw;padding:16px;
                direction:rtl;box-shadow:0 18px 50px rgba(0,0,0,.3);">
      <div style="font-family:'Jameel Noori Nastaleeq',serif;font-weight:700;color:#0369a1;
                  font-size:15pt;margin-bottom:4px;">میڈیکل آفیسر کا نام</div>
      <div style="font-size:11pt;color:#64748b;margin-bottom:12px;
                  font-family:'Jameel Noori Nastaleeq',serif;">
        کاغذات میں ایم ایل سی / پوسٹ مارٹم شامل ہے — میڈیکل آفیسر بھی گواہ ہیں۔
      </div>
      <input id="ch173-med-nm" placeholder="نام" dir="auto" value="${esc(cur.name)}"
             style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:7px;
                    margin-bottom:8px;font-size:12pt;direction:rtl;">
      <input id="ch173-med-cn" placeholder="${R173_CNIC_KHALI}" dir="ltr" value="${esc(cur.cnic)}"
             style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:7px;
                    margin-bottom:14px;font-size:12pt;">
      <div style="display:flex;gap:8px;">
        <button id="ch173-med-ok" style="flex:1;padding:9px;border:none;border-radius:7px;
                background:#0369a1;color:#fff;cursor:pointer;font-size:12pt;
                font-family:'Jameel Noori Nastaleeq',serif;">شامل کریں</button>
        <button id="ch173-med-x" style="padding:9px 14px;border:1px solid #cbd5e1;border-radius:7px;
                background:#fff;cursor:pointer;font-size:12pt;
                font-family:'Jameel Noori Nastaleeq',serif;">رہنے دیں</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const nm = ov.querySelector('#ch173-med-nm');
  setTimeout(() => nm.focus(), 30);
  const shut = () => ov.remove();
  ov.querySelector('#ch173-med-x').onclick = shut;
  ov.onmousedown = e => { if (e.target === ov) shut(); };
  ov.querySelector('#ch173-med-ok').onclick = () => {
    const n = nm.value.trim();
    if (!n) { nm.focus(); return; }
    const c = ov.querySelector('#ch173-med-cn').value.trim();
    _ch173MedSet(n, c);                       // agli dafa nahi poochega
    shut();
    if (_ch173AddWitness(n, c)) {
      try { _ch173Layout(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      if (typeof showToast === 'function') {
        showToast('میڈیکل آفیسر بطور گواہ شامل — ' + n, 'success');
      }
    }
  };
}
window._ch173AskMedical = _ch173AskMedical;

function _ch173WitnessText() {
  const L = (typeof _ch173WitList === 'function') ? _ch173WitList() : (_ch173Witnesses || []);
  if (!L.length) return '';
  // Aik line mein aik گواہ
  // Har گواہ: نمبر شمار + naam, aur usi ke saath uska CNIC
  // AIK GAWAH = AIK SATAR: نمبر + naam + uska CNIC
  // gawahan column: sirf number + naam (CNIC ab nahi lagta). Naam chhota ho
  // (aadhe column se km) to usi satar mein doosra chhota gawah bhi naye number
  // ke sath aa jata hai (do-per-satar).
  const _names = L.map(function (w) { return (w.full_name || '').trim(); });
  const _SHORT = 14;
  const _out = [];
  let _sr = 0, _i = 0;
  while (_i < _names.length) {
    const a = _names[_i];
    const aShort = a.length > 0 && a.length <= _SHORT;
    const b = (_i + 1 < _names.length) ? _names[_i + 1] : null;
    const bShort = b != null && b.length > 0 && b.length <= _SHORT;
    if (aShort && bShort) {
      const s1 = ++_sr, s2 = ++_sr;
      _out.push(s1 + '\u06D4 ' + a + '\u2003' + s2 + '\u06D4 ' + b);
      _i += 2;
    } else {
      _out.push(_names.length > 1 ? (++_sr) + '\u06D4 ' + a : a);   // v558: اکیلا ہو تو «1» نہیں
      _i += 1;
    }
  }
  return _out.join('\n');
}

// Kaunse ملزمان pehle se kisi column mein chune ja chuke hain
function _ch173UsedAccused(exceptKey) {
  const keys = ['ghair_giraftar','zer_hirasat','bar_zamanat'];
  const used = new Set();
  keys.forEach(k => {
    if (k === exceptKey) return;
    const el = document.querySelector(`#ch173-table [data-k="${k}"]`);
    if (!el) return;
    el.innerText.split(/\r?\n/).forEach(n => {
      let t = n.trim();
      t = t.replace(/^\s*\d+\u06D4\s*/, '');                  // نمبر شمار hatao
      t = t.replace(/\s*\d{5}-\d{7}-\d\s*$/, '').trim();     // CNIC hatao
      if (t) used.add(t);
    });
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
  // Pehle se chune hue naam — CNIC aur نمبر شمار hata kar sirf naam
  const mine = new Set(cell ? cell.innerText.split(/\r?\n/).map(t => {
    let x = t.trim();
    x = x.replace(/^\s*\d+\u06D4\s*/, '');                   // نمبر شمار hatao
    x = x.replace(/\s*\d{5}-\d{7}-\d\s*$/, '').trim();      // CNIC hatao
    return x;
  }).filter(Boolean) : []);

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
    // Har naam ko apna نمبر شمار (1، 2، 3…) aur uske SAATH uska apna CNIC.
    // Dono aik hi khane mein — is liye har CNIC apne naam ke bilkul saath
    // rehta hai (pehle sab CNIC aik dher mein the, pata nahi chalta tha
    // ke kaunsa kis ka hai).
    if (cell) {
      // AIK SHAKHS = AIK SATAR: نمبر + naam + uska CNIC (sab saath)
      cell.innerText = picked.map((nm, i) => {
        const a = (_ch173Accused || []).find(x => (x.name || '').trim() === nm);
        const c = (a && a.cnic && String(a.cnic).trim()) ? String(a.cnic).trim() : '00000-0000000-0';
        return (picked.length > 1 ? (i + 1) + '\u06D4 ' : '') + nm + ' ' + c;   // v558: اکیلا ہو تو «1» نہیں
      }).join('\n');
    }
    box.remove();
    try { _ch173WrapCnics(); } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    if (typeof _ch173SizeRotated === 'function') _ch173SizeRotated();
    try { _r173Dirty = true; } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  };
}
window._ch173AccPicker   = _ch173AccPicker;

// ═══════════════════════════════════════════════════════════════════
//  تفصیل کاغذات — چیک لسٹ (▾)
//  Neeche wali fehrist mein jo کاغذ چیک ہو جائے وہ خانے میں لکھا جاتا ہے.
//  AHEM: yahan matn SAADA (seedhi, RTL) shakl mein aata hai — ملزمان wali
//  khadi likhayi, نمبر شمار aur CNIC ka andaz yahan NAHI lagta.
//  (Fehrist officer khud badal sakta hai — naam badalna, naya shamil karna,
//   ▲▼ se tarteeb badalna, ✕ se hatana. Sab kuch localStorage mein mehfooz
//   rehta hai: 'dio_ch173_papers'.)
// ═══════════════════════════════════════════════════════════════════
// Shuru ki fehrist — har IO isay khud badal sakta hai (neeche mehfooz hoti hai)
// تتمہ چالان ke default kaghaz (چالان walon se alag)
// اخراج / عدم پتہ ke default kaghaz (AKHRAJ.docx se) — har ek ki tadaad 1
const CH173_IKHRAJ_PAPERS_DEFAULT = [
  'رپورٹ ہذا',
  'فارم ریمانڈ و ڈسچارجگی',
  'نقل FIR',
  'اصل تحریر',
  'نقشہ موقع نظری بلا سکیل',
  'مصدقہ نقل بیان 164ض ف',
  'اطلاع نامہ مدعی',
  'نقول بیانات 161ض ف',
  'اصل ضمنی SHO',
  'فہرست گواہان',
];

const CH173_TATIMA_PAPERS_DEFAULT = [
  'فارم ہذا',
  'نقل FIR',
  'اصل رزلٹ نمبری',
  'سزا سلپ',
];

const CH173_PAPERS_DEFAULT = [
  'فارم ہذا',
  'فارم ریمانڈ',
  'نقل ایف آئی آر',
  'اصل تحریر',
  'فرد بقائیگی ض',
  'نقشہ موقع جائے وقوعہ',
  'نقشہ موقع جائے برآمدگی',
  'میڈیکل معہ ڈاکٹ',
  'سرٹیفکیٹ شناخت ملزم',
  'سزا سلپ',
  'نقل بیانات 161 ض ف',
  'مصدقہ نقل بیانات 164 ض ف',
  'پوسٹ مارٹم رپورٹ',
  'فردات بقائیگی ض',
  'نقشہ موقع با اسکیل',
  'وارنٹ گرفتاری بلا ضمانت معہ درخواست',
  'اشتہار زیر دفعہ 87 ض ف معہ درخواست',
];

// ═══ Har qism ke چالان ki APNI fehrist ═══
// چالان مکمل / نامکمل / 512 ض ف — teeno ka aik hi kaghazon ka set.
// تتمہ چالان, اخراج aur عدم پتہ — har aik ka ALAG set (officer khud bharega).
function _ch173PapersGroup() {
  // تتمہ چالان aur us ke tamam sub-types (شراب/چرس/آئس/انٹی ریپ waghera) —
  // sab aik hi تتمہ fehrist istemal karte hain
  if (_r173Type === 'tatima_challan' ||
      (typeof R173_TATIMA_SUBS !== 'undefined' &&
       R173_TATIMA_SUBS.some(x => x.id === _r173Type))) return 'tatima';
  // اخراج aur عدم پتہ 100% same form — aik hi fehrist (sirf heading ka lafz alag)
  if (_r173Type === 'ikhraj' || _r173Type === 'adampata') return 'ikhraj';
  return 'challan';                 // مکمل / نامکمل / 512 / انٹیرم
}
window._ch173PapersGroup = _ch173PapersGroup;

function _ch173PapersKey() {
  return 'dio_ch173_papers_' + _ch173PapersGroup();
}

// Officer ki apni fehrist (naam badla hua, naya shamil kiya hua, tarteeb badli hui)
function _ch173PapersList() {
  const g = _ch173PapersGroup();
  try {
    const a = JSON.parse(localStorage.getItem(_ch173PapersKey()) || 'null');
    // AHEM: KHALI fehrist ko mehfooz shuda na samjho.
    if (Array.isArray(a) && a.length) {
      // Agar mehfooz fehrist bilkul PURANI default jaisi hai (yani officer ne
      // khud nahi banai — woh sirf ▾ kholne aur band karne se mehfooz ho gayi
      // thi), to usay nazar-andaz kar ke asal fehrist par aa jao.
      const PURANI = ['فارم ہذا','نقل ایف آئی آر','اصل تحریر','فارم ریمانڈ',
                      'نقشہ موقع','اطلاع نامہ مدعی','اصل ضمنی SHO'];
      const wahi = a.length === PURANI.length &&
                   a.every(x => PURANI.includes(String(x).trim()));
      if (!wahi) return a.map(String);        // officer ki apni fehrist — mehfooz
    }
  } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  // Purani (mushtarka) fehrist sirf چالان walon ko milegi
  if (g === 'challan') {
    try {
      const old = JSON.parse(localStorage.getItem('dio_ch173_papers') || 'null');
      if (Array.isArray(old) && old.length) return old.map(String);
    } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
    return CH173_PAPERS_DEFAULT.slice();
  }
  // تتمہ چالان ki apni default fehrist (چالان walon se alag)
  if (g === 'tatima') return CH173_TATIMA_PAPERS_DEFAULT.slice();
  if (g === 'ikhraj' || g === 'adampata') return CH173_IKHRAJ_PAPERS_DEFAULT.slice();
  return [];
}
function _ch173PapersSave(arr) {
  try { localStorage.setItem(_ch173PapersKey(), JSON.stringify(arr)); } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
}
window._ch173PapersList = _ch173PapersList;

// ═══ کاغذات کے خانے کو پڑھنا / لکھنا ═══
// Shakl: har kaghaz ka naam UNDERLINED, aur us ke BILKUL neeche tadaad ka
// khana (jise IO khud bhar sakta hai). Kaghaz dayen se bayen aik ke baad aik
// lagte hain, darmiyan mein MS Word ke aik Tab jitni jagah; satar bhar jaye
// to agla kaghaz khud NAYI satar par chala jata hai (wrap).
function _ch173PapersRead(body) {
  const out = [];
  if (!body) return out;
  body.querySelectorAll('.pp-item').forEach(el => {
    const n = el.querySelector('.pp-name'), q = el.querySelector('.pp-qty');
    // رزلٹ نمبری ka number naam ka hissa nahi — usay nikaal kar saaf naam lo
    let name = '';
    if (n) {
      const rn = n.querySelector('.pp-rno');
      name = (rn ? n.textContent.replace(rn.textContent, '') : n.textContent).trim();
    }
    if (name) out.push({ name, qty: (q ? q.textContent : '').trim() });
  });
  return out;
}
window._ch173PapersRead = _ch173PapersRead;

function _ch173PapersRender(body, items) {
  if (!body) return;
  body.innerHTML = (items || []).map(it =>
    '<span class="pp-item" contenteditable="false">' +
      '<span class="pp-name">' + esc(it.name) + '</span>' +
      '<span class="pp-qty" contenteditable="true">' + esc(it.qty || '1') + '</span>' +
    '</span>'
  ).join('');
}
window._ch173PapersRender = _ch173PapersRender;

function _ch173PapersPicker(ev) {
  ev.preventDefault(); ev.stopPropagation();
  document.getElementById('ch173-papers-menu')?.remove();
  const body = document.querySelector('#ch173-doc [data-k="papers_body"]');
  if (!body) return;

  let list = _ch173PapersList();
  // Khane mein jo kaghaz pehle se lage hain woh ✔ nazar aayen
  const already = _ch173PapersRead(body).map(it => it.name);
  const checked = new Set(already.filter(l => list.includes(l)));
  // Jo kaghaz khane mein hai magar fehrist mein nahi — usay fehrist mein le aao
  already.forEach(n => { if (n && !list.includes(n)) { list.push(n); checked.add(n); } });

  const box = document.createElement('div');
  box.id = 'ch173-papers-menu';
  box.style.cssText =
    'position:fixed;z-index:99999;background:#fff;border:1px solid #0369a1;border-radius:10px;' +
    'box-shadow:0 10px 30px rgba(0,0,0,.28);direction:rtl;width:300px;max-width:94vw;' +
    'display:flex;flex-direction:column;max-height:min(72vh,440px);overflow:hidden;';
  box.innerHTML = `
    <div style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;font-weight:700;color:#0369a1;
                font-family:'Jameel Noori Nastaleeq',serif;background:#f8fafc;">
      کاغذات منتخب کریں <span style="font-weight:400;color:#64748b;">— نام بدلا جا سکتا ہے، ▲▼ سے ترتیب</span>
    </div>
    <div id="pp-list" style="flex:1;overflow-y:auto;padding:4px 6px;min-height:0;"></div>
    <div style="padding:6px;border-top:1px solid #e5e7eb;background:#f8fafc;flex-shrink:0;">
      <button id="pp-add" style="width:100%;padding:7px;border:1px dashed #0369a1;border-radius:6px;background:#fff;
        color:#0369a1;cursor:pointer;font-size:13px;font-weight:700;font-family:'Jameel Noori Nastaleeq',serif;">
        ＋ نیا کاغذ شامل کریں</button>
      <div style="display:flex;gap:6px;margin-top:6px;">
        <button id="ch173-pp-ok" style="flex:1;padding:8px;border:none;border-radius:6px;background:#0369a1;
          color:#fff;cursor:pointer;font-size:13px;font-weight:700;font-family:'Jameel Noori Nastaleeq',serif;">✔ شامل کریں</button>
        <button id="ch173-pp-x" style="padding:8px 12px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;
          cursor:pointer;font-size:13px;font-family:'Jameel Noori Nastaleeq',serif;">بند</button>
      </div>
    </div>`;
  document.body.appendChild(box);

  const wrap = box.querySelector('#pp-list');
  const mini = 'width:22px;height:22px;padding:0;line-height:1;border:1px solid #cbd5e1;border-radius:5px;' +
               'background:#fff;cursor:pointer;font-size:11px;flex-shrink:0;';

  // Screen par jo halat hai usay fehrist mein utaar lo (naam ki tabdeeli + ✔)
  const readDom = () => {
    const out = [];
    checked.clear();
    wrap.querySelectorAll('.pp-row').forEach(r => {
      const t = (r.querySelector('.pp-txt').value || '').trim();
      if (!t) return;
      out.push(t);
      if (r.querySelector('.pp-ck').checked) checked.add(t);
    });
    list = out;
  };

  const render = (focusIdx) => {
    wrap.innerHTML = list.map((p, i) => `
      <div class="pp-row" data-i="${i}" style="display:flex;align-items:center;gap:5px;padding:4px 2px;
           border-bottom:1px solid #f1f5f9;">
        <input type="checkbox" class="pp-ck" ${checked.has(p) ? 'checked' : ''} style="flex-shrink:0;">
        <input type="text" class="pp-txt" value="${esc(p)}" style="flex:1;min-width:0;border:1px solid transparent;
          border-radius:5px;padding:4px 6px;font-size:13px;font-family:'Jameel Noori Nastaleeq',serif;
          direction:rtl;text-align:right;background:#fff;outline:none;"
          onfocus="this.style.borderColor='#93c5fd';this.style.background='#f8fbff';"
          onblur="this.style.borderColor='transparent';this.style.background='#fff';">
        <button class="pp-up"   title="اوپر"  style="${mini}" ${i === 0 ? 'disabled' : ''}>▲</button>
        <button class="pp-down" title="نیچے"  style="${mini}" ${i === list.length - 1 ? 'disabled' : ''}>▼</button>
        <button class="pp-del"  title="حذف"   style="${mini}color:#b91c1c;">✕</button>
      </div>`).join('') ||
      '<div style="font-size:12px;color:#777;padding:10px;">فہرست خالی ہے — ＋ سے شامل کریں</div>';
    if (typeof focusIdx === 'number') {
      const el = wrap.querySelectorAll('.pp-txt')[focusIdx];
      if (el) { el.focus(); el.select(); }
    }
  };

  // Tarteeb badalna / hatana — aik hi jagah se
  wrap.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    e.preventDefault();
    const row = btn.closest('.pp-row');
    if (!row) return;
    const i = parseInt(row.dataset.i, 10);
    readDom();
    if (btn.classList.contains('pp-up')   && i > 0) {
      [list[i - 1], list[i]] = [list[i], list[i - 1]];
      _ch173PapersSave(list); render(); return;
    }
    if (btn.classList.contains('pp-down') && i < list.length - 1) {
      [list[i + 1], list[i]] = [list[i], list[i + 1]];
      _ch173PapersSave(list); render(); return;
    }
    if (btn.classList.contains('pp-del')) {
      list.splice(i, 1);
      _ch173PapersSave(list); render(); return;
    }
  });

  // ── Ooper / Neeche wali keys — satron ke darmiyan aana jana ──
  // (Tab pehle se chalta tha; ab ↑ ↓ bhi. Ctrl ke saath dabane par satar
  //  KHUD ooper/neeche khisak jati hai — tarteeb badalne ka chhota raasta.)
  wrap.addEventListener('keydown', (e) => {
    const t = e.target;
    if (!t.classList || !t.classList.contains('pp-txt')) return;
    const boxes = [...wrap.querySelectorAll('.pp-txt')];
    const i = boxes.indexOf(t);
    if (i < 0) return;

    // Ctrl + ↑↓ → poori satar hi ooper/neeche khisak jaye
    if (e.ctrlKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const btn = t.closest('.pp-row')
        .querySelector(e.key === 'ArrowUp' ? '.pp-up' : '.pp-down');
      if (btn && !btn.disabled) btn.click();
      const naya = wrap.querySelectorAll('.pp-txt')[e.key === 'ArrowUp' ? i - 1 : i + 1];
      if (naya) { naya.focus(); naya.select(); }
      return;
    }

    // ↑ ↓ → agli/pichhli satar ke khane mein (magar SIRF jab cursor kinare par ho,
    // warna arrow lafz ke andar cursor chalaye — yani aam likhayi na ruke)
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const atStart = t.selectionStart === 0 && t.selectionEnd === 0;
      const atEnd   = t.selectionStart === t.value.length && t.selectionEnd === t.value.length;
      if ((e.key === 'ArrowUp' && atStart) || (e.key === 'ArrowDown' && atEnd)) {
        const agla = boxes[e.key === 'ArrowUp' ? i - 1 : i + 1];
        if (agla) { e.preventDefault(); agla.focus(); agla.select(); }
      }
      return;                          // warna normal cursor movement chalne do
    }

    // Enter → nayi satar (naya kaghaz) is ke theek neeche
    if (e.key === 'Enter') {
      e.preventDefault();
      readDom();
      list.splice(i + 1, 0, '');
      _ch173PapersSave(list);
      render(i + 1);
      return;
    }

    // Tab → agli satar (Shift+Tab → pichhli)
    if (e.key === 'Tab') {
      const agla = boxes[e.shiftKey ? i - 1 : i + 1];
      if (agla) { e.preventDefault(); agla.focus(); agla.select(); }
      return;
    }
    // baqi tamam keys (harf, space, backspace, ←→) aam tarah chalen
  });

  box.querySelector('#pp-add').onclick = (e) => {
    e.preventDefault();
    readDom();
    list.push('نیا کاغذ');
    _ch173PapersSave(list);
    render(list.length - 1);          // naye khane mein cursor
    wrap.scrollTop = wrap.scrollHeight;
  };

  render();

  // Jagah: button ke qareeb, magar screen se bahar kabhi nahi
  const r = ev.currentTarget.getBoundingClientRect();
  const bw = box.offsetWidth, bh = box.offsetHeight;
  let top = r.bottom + 6;
  if (top + bh > window.innerHeight - 8) top = Math.max(8, r.top - bh - 6);
  if (top + bh > window.innerHeight - 8) top = Math.max(8, window.innerHeight - bh - 8);
  let left = r.left + r.width / 2 - bw / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - bw - 8));
  box.style.top = top + 'px';
  box.style.left = left + 'px';

  setTimeout(() => {
    const off = (e) => {
      if (!box.contains(e.target)) {
        try { readDom(); _ch173PapersSave(list); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }   // tabdeeli zaya na ho
        box.remove(); document.removeEventListener('mousedown', off);
      }
    };
    document.addEventListener('mousedown', off);
  }, 0);

  box.querySelector('#ch173-pp-x').onclick = () => {
    readDom(); _ch173PapersSave(list); box.remove();
  };
  box.querySelector('#ch173-pp-ok').onclick = () => {
    readDom();
    _ch173PapersSave(list);
    // Pehle se likhi hui tadaad zaya na ho — usi kaghaz ki purani tadaad rakho
    const oldQty = {};
    _ch173PapersRead(body).forEach(it => { oldQty[it.name] = it.qty; });
    const items = list.filter(p => checked.has(p))
                      .map(p => ({ name: p, qty: oldQty[p] || '' }));
    _ch173PapersRender(body, items);
    box.remove();
    try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    // ایم ایل سی / میڈیکل سرٹیفکیٹ / پوسٹ مارٹم chuna gaya ho to میڈیکل آفیسر
    // bhi گواہ hain — un ka naam کالم 6 mein. Naam mehfooz na ho to poochta hai.
    try { _ch173EnsureMedicalWitness(items.map(it => it.name)); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  };
}
window._ch173PapersPicker = _ch173PapersPicker;

// ═══ رزلٹ نمبری — تحریر اور تفصیل کاغذات دونوں جگہ ═══
// Officer aik hi jagah (top bar) number likhta hai; woh (1) کالم 7 ki تحریر
// mein {{RESULT}} ki jagah, aur (2) تفصیل کاغذات ke "اصل رزلٹ نمبری" ke aage
// khud lag jata hai.
function _ch173SetResultNo(val) {
  val = (val || '').trim();
  // Mehfooz karne ke liye — save mein bhi jaye
  try {
    const doc = _ch173Doc();
    if (doc) {
      let h = doc.querySelector('input[data-k="result_no"]');
      if (!h) {
        h = document.createElement('input');
        h.type = 'hidden'; h.setAttribute('data-k', 'result_no');
        doc.appendChild(h);
      }
      h.value = val;
    }
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  // (1) کالم 7 ki تحریر mein — jahan "رزلٹ نمبری" ke baad khali/____ hai
  try {
    const cell = (_ch173Cells() || {}).cell;
    if (cell) {
      // "رزلٹ نمبری" ke foran baad ka number/khali-nishan uthao aur usi
      // satar mein naya number jama do (رزلٹ نمبری33333333 nahi — رزلٹ نمبری 333...)
      // "رزلٹ نمبری" + purana number/nishan (agar ho) uthao, us ke baad ka
      // AIK space bhi — phir naya number aur AIK space wapas rakho. Is se
      // number رزلٹ نمبری ke saath usi satar mein aata hai, dono taraf theek
      // fasla rehta hai, aur baar baar badalne par purana hat kar naya lagta.
      const re = /(رزلٹ نمبری?)(?:[ \u00A0]+[0-9\u06f0-\u06f9A-Za-z_\u0640][0-9\u06f0-\u06f9A-Za-z_\u0640\/\-]*)?[ \u00A0]*/;
      const cur = cell.innerText || '';
      if (re.test(cur)) {
        cell.innerText = cur.replace(re, '$1 ' + (val || '____________') + ' ');
        try { _ch173Layout(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      }
    }
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  // (2) تفصیل کاغذات — "اصل رزلٹ نمبری" wale kaghaz ke NEECHE result number
  // (baqi tamam kaghazon ki tadaad 1 jyun ki tyun rahegi — sirf isi kaghaz
  //  ke neeche number aata hai).
  try {
    const doc = _ch173Doc();
    if (doc) {
      doc.querySelectorAll('.pp-item').forEach(it => {
        const nm = it.querySelector('.pp-name');
        if (!nm) return;
        const t = nm.textContent.replace(/\s/g, '');
        if (t.indexOf('رزلٹنمبری') === -1) return;    // "اصل رزلٹ نمبری" hi
        // Naam ke SAATH usi satar mein number ka alag khana (tadaad NA chhero)
        let rn = nm.querySelector('.pp-rno');
        if (!rn) {
          rn = document.createElement('span');
          rn.className = 'pp-rno';
          nm.appendChild(rn);
        }
        rn.textContent = val ? (' ' + val) : '';
      });
    }
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._ch173SetResultNo = _ch173SetResultNo;

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
// AHEM: purani ghalat default qeematein (10.5 aur 12) ko nazar-andaz kar ke
// 14 par le aate hain — naye AUR purane dono چالان 14 par. Officer ki apni
// chuni hui doosri naapein (16, 18, 20 ...) jyun ki tyun rehti hain.
const R173_FONT_LEGACY = [10.5, 12];
// v553 قاعدہ: v553 سے پہلے محفوظ (fnorm کے بغیر) چالان کا فونٹ معیاری 14pt — بعد میں
//   افسر جو سائز چنے (fnorm='553' کے ساتھ محفوظ) وہ برقرار
function _ch173DocFont(bs) {
  if (bs && Object.keys(bs).length && String(bs.fnorm || '') !== '553') return R173_FONT_DEFAULT;
  const n = parseFloat((bs && bs.doc_font) || '');
  if (R173_FONT_LEGACY.indexOf(n) !== -1) return R173_FONT_DEFAULT;
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
        } catch(_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
        return _orig.apply(this, arguments);
      };
    }
  } catch(_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
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
    // ═══ SCREEN par bhi KAGHAZ ki asal naap ═══
    // Pehle safha screen ki 100% chaudai leta tha jabke chapai 8.5in par hoti
    // hai. Alag chaudai ka matlab: satren alag tarah tootti hain — isi liye
    // screen, print-view aur chhapa hua چالان teeno alag nazar aate the.
    // Ab safha asal kaghaz jitna chaura rehta hai (naap bilkul chapai wali)
    // aur sirf DIKHANE ke liye bara kar diya jata hai (scale) — is se shakl
    // nahi badalti, sirf bara nazar aata hai.
    const doc = _ch173Doc();            // hamesha NAZAR AANE wala چالان
    if (doc) {
      doc.style.maxWidth = 'none';
      doc.style.margin = '0 auto';
      _ch173FitPaper();
      if (!window._ch173FitBound) {
        window._ch173FitBound = true;
        window.addEventListener('resize', () => { try { _ch173FitPaper(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } });
      }
    }
  } catch(_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._ch173FullPage = _ch173FullPage;

// ═══ Safha = kaghaz ki asal chaudai, phir dikhane ke liye bara ═══
// AHEM: yahan 'zoom' ke bajaye 'transform:scale' use hota hai. Zoom naap
// dobara ginta hai (satren badal sakti hain), jabke scale sirf bari tasveer
// banata hai — naap wahi rehti hai jo kaghaz par hogi.
// Chapai ki naap ka lamha — is dauran safha KAGHAZ ki asli naap par rehta hai
let _ch173PrintMeasuring = false;

/* ═══ صفحے کا موجودہ «scale» ═══
   Tang khirki mein safha chhota kar ke dikhaya jata hai. Aisi soorat mein
   `getBoundingClientRect()` CHHOTI naap deta hai, jabke `offsetWidth`,
   `clientWidth` aur kaghaz ke naap (inch × 96) ASLI rehte hain. Dono ko
   milane se khanon ki chaurai aur qatar ki unchai (tang khirki par) taqreeban
   20% kam nikalti thi — aur wohi ghalat naap mehfooz bhi ho jati thi. */
function _ch173Scale() {
  try {
    const d = _ch173Doc();
    if (!d) return 1;
    const r = d.getBoundingClientRect();
    const k = (r && r.width && d.offsetWidth) ? (r.width / d.offsetWidth) : 1;
    return (k > 0.05 && k <= 1.5) ? k : 1;
  } catch (_) { return 1; }
}

function _ch173FitPaper() {
  const doc = _ch173Doc();            // hamesha NAZAR AANE wala چالان
  if (!doc) return;
  const host = doc.parentElement;
  if (!host) return;
  // ═══ Dekhne wala khana KHIRKI ke NEECHE tak ═══
  // Yeh khana khud ba khud poori unchai nahi leta tha — beech mein hi khatam
  // ho jata tha aur us ke neeche khali jagah (chaori patti) reh jati thi,
  // jis se چالان neeche se kat jata tha. Ab isay seedha khirki ke neeche tak
  // le jate hain, taake poora چالان aur us ka neeche wala matn nazar aaye.
  // AHEM: sirf is dabbe ko unchai dena KAAFI NAHI. Yeh dabba aik "flex" khane
  // ke andar hai — aur aise khane ki khasiyat hai ke agar us ka WALID chhota
  // ho to woh apni muqarrar unchai ke BAWAJOOD sikur jata hai. Isi liye pehle
  // unchai lagti to theek thi (588px) magar asal mein 371px reh jati thi.
  // Hal: dabbe ke saath saath us ke walidain ko bhi khirki ke neeche tak
  // le jao, aur sikurne se rok do (flex-shrink:0).
  try {
    let el = host, hops = 0;
    while (el && el !== document.body && hops++ < 4) {
      const top = el.getBoundingClientRect().top;
      const hh = Math.max(200, (window.innerHeight || 0) - top - 2);
      el.style.height = hh + 'px';
      el.style.maxHeight = 'none';
      el.style.flexShrink = '0';                 // ab sikur nahi sakta
      el = el.parentElement;
    }
    host.style.overflow = 'auto';
    host.style.flexShrink = '0';
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }

  const IN = 96;                                        // 1 inch = 96px
  const wPx = ((_ch173Paper === 'a4') ? 8.27 : 8.5) * IN;
  doc.style.width = wPx + 'px';
  doc.style.maxWidth = 'none';
  doc.style.minHeight = ((_ch173Paper === 'a4') ? 11.7 : 13) * IN + 'px';
  // Side margin bhi kaghaz ke hisab se — warna A4 chunne par purani (tang)
  // margin lagi reh jati hai aur kinare ke alfaz kat jate hain.
  try { doc.style.padding = '1cm ' + _ch173SideMargin(); } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  doc.style.transformOrigin = 'top center';

  // Jitni jagah WAQAI nazar aa rahi hai — container ki chaudai aur khirki
  // (window) dono mein se JO KAM ho. Sirf container par bharosa karna ghalat
  // tha: kabhi container khud khirki se chaura ho jata hai (jaise case mein
  // aik se zyada tab khuli hon), aur tab safha screen se bahar nikal jata tha.
  const visible = () => Math.max(200,
    Math.min(host.clientWidth || 0, window.innerWidth || 0) || (host.clientWidth || 800));

  /* ═══ چھپائی کی ناپ کے دوران «scale» ہرگز نہیں ═══
     Safha tang khirki mein chhota kar ke dikhaya jata hai. Yeh sirf DIKHANE
     ke liye hai, magar naap par POORA asar daalta hai: rect ki naap scale
     wali aati hai jabke `offsetHeight` aur kaghaz ke naap (13in × 96) asli.
     `_printR173` chapai se pehle scale hata deta tha — magar usi ke baad
     chalne wala `_ch173Layout()` yahan aa kar usay DOBARA laga deta tha.
     Natija (asli browser mein naapa gaya, aik hi چالان):
         1500px khirki → 4 safha-tor
          700px khirki → 3 safha-tor
     Yani chhapa hua چالان is baat par munhasir tha ke khirki kitni chauri
     hai. Ab chapai ki naap ke dauran scale band. */
  const setK = (k) => {
    if (_ch173PrintMeasuring) { doc.style.transform = 'none'; return 1; }
    doc.style.transform = (Math.abs(k - 1) < 0.005) ? 'none' : ('scale(' + k.toFixed(4) + ')');
    return k;
  };

  // AHEM: safha kabhi BARA na kiya jaye (zyada se zyada 1) — sirf tang jagah
  // mein CHHOTA. Bara karne par us ki gunjaish ke liye neeche fazool khali
  // jagah chhorni parti thi, jo aik chaori patti ban kar safha dhak leti thi.
  // Bara dekhna ho to Chrome ka apna zoom (Ctrl +) mojood hai.
  let k = Math.min(1, Math.max(0.35, (visible() - 32) / wPx));
  setK(k);

  // ═══ Ab NAAP kar TASDEEQ karo ═══
  // Sirf hisaab par bharosa nahi karte — safha lagne ke baad us ki asal
  // chaudai maap kar dekhte hain. Agar phir bhi nazar aane wali jagah se
  // bara ho to chhota kar dete hain (teen koshishon tak).
  try {
    for (let i = 0; i < 3; i++) {
      const w = doc.getBoundingClientRect().width;
      const limit = visible() - 16;
      if (!w || w <= limit) break;
      k = setK(Math.max(0.3, k * (limit / w)));
    }
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }

  // v558: chhota kiya hua safha khirki ke BEECH mein — pehle tang screen (mobile) par
  //   kaghaz (8.5in) dabbe se chaura hota, RTL mein bahar ka hissa BAEN taraf nikalta
  //   (margin-left −446px) aur scale ke baad safha aadha screen se bahar nazar aata tha.
  //   Ab dono taraf barabar manfi hashiya: kaghaz ka markaz = dabbe ka markaz (RTL/LTR dono).
  try {
    const kk = (doc.style.transform && doc.style.transform !== 'none') ? k : 1;
    const cs = getComputedStyle(host);
    const inner = host.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    // اصل چوڑائی (موبائل «فارم» منظر میں CSS اسے 100% کر دیتی ہے — تب کچھ نہیں)
    const m = Math.round((inner - doc.offsetWidth) / 2);
    if (kk < 1 && m < 0 && !_ch173PrintMeasuring) {
      doc.style.marginLeft = m + 'px'; doc.style.marginRight = m + 'px';
      host.style.overflowX = 'hidden';
    } else {
      doc.style.marginLeft = 'auto'; doc.style.marginRight = 'auto';
      host.style.overflowX = '';
    }
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }

  // scale se asli unchai nahi badalti — neeche ki khali jagah barabar karo
  try {
    if (_ch173PrintMeasuring) { doc.style.marginBottom = '0'; }
    else { const h = doc.offsetHeight; doc.style.marginBottom = Math.round(h * (k - 1)) + 'px'; }
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._ch173FitPaper = _ch173FitPaper;

// ═══ Jagah badle to naap KHUD dobara theek ho ═══
// Case mein aik se zyada tab khulne/band hone par safhe wali jagah ki chaudai
// badal jati thi, magar naap purani hi lagi rehti thi — is liye safha screen
// se bahar nikal jata tha. Ab container par nazar rakhi jati hai: jaise hi
// us ki naap badle, safha khud apne aap ko dobara fit kar leta hai.
function _ch173WatchFit() {
  const doc = _ch173Doc();            // hamesha NAZAR AANE wala چالان
  if (!doc) return;
  const host = doc.parentElement;
  if (!host) return;
  try { _ch173FitPaper(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  // Safha lagne ke foran baad naap abhi tay nahi hoti — chand dafa dohrao
  [60, 200, 500, 1000].forEach(ms => setTimeout(() => {
    try { _ch173FitPaper(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  }, ms));
  if (host._fitObs) return;                      // aik hi dafa lagani hai
  if (typeof ResizeObserver === 'undefined') return;
  try {
    host._fitObs = new ResizeObserver(() => {
      clearTimeout(host._fitT);
      host._fitT = setTimeout(() => { try { _ch173FitPaper(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } }, 80);
    });
    host._fitObs.observe(host);
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._ch173WatchFit = _ch173WatchFit;

// ═══════════════════════════════════════════════════════════════════
//  چالان کا صفحہ = پورا صفحہ (FOCUS MODE)
//  چالان khulte hi ooper wali chips ki patti aur neeche wali patti chhup
//  jati hain. Chips ghayब nahi hotin — cursor ooper le jate hi nazar aa
//  jati hain aur hatate hi phir chhup jati hain.
// ═══════════════════════════════════════════════════════════════════
function _ch173FocusMode(on) {
  const b = document.body;
  if (!b) return;
  if (!on) {
    b.classList.remove('ch173-focus');
    b.classList.remove('tatima-active');            // CNIC doosre challan mein wapas
    // تتمہ mein CNIC hata ya lapet — cnSig reset taake dobara sahi lage
    try { _ch173Doc()?.querySelectorAll('.rotinner').forEach(c => { delete c.dataset.cnSig; }); } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
    const bar = document.getElementById('misal-doc-bar');
    if (bar) {
      bar.classList.remove('peek');
      // Us ke khane ki jo tabdeeli ki thi woh wapas
      try { if (bar.parentElement) bar.parentElement.style.position = ''; } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
    }
    try { clearTimeout(window._ch173PeekT); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    return;
  }
  b.classList.add('ch173-focus');
  // Patti ko us ke apne khane ke andar rakhna hai (absolute), warna woh
  // safhe ke bilkul ooper chali jayegi.
  try {
    const bar0 = document.getElementById('misal-doc-bar');
    const par  = bar0 && bar0.parentElement;
    if (par && getComputedStyle(par).position === 'static') par.style.position = 'relative';
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  if (window._ch173PeekBound) return;
  window._ch173PeekBound = true;
  document.addEventListener('mousemove', (e) => {
    if (!document.body.classList.contains('ch173-focus')) return;
    const bar = document.getElementById('misal-doc-bar');
    if (!bar) return;
    let near = e.clientY <= 70;                   // ooper ka ilaqa
    if (!near) {
      try {
        const r = bar.getBoundingClientRect();
        // Patti par (ya us ke bilkul qareeb) cursor ho to khuli rahe
        near = e.clientY >= r.top - 10 && e.clientY <= r.bottom + 10 &&
               e.clientX >= r.left  && e.clientX <= r.right;
      } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    }
    if (near) {
      clearTimeout(window._ch173PeekT);
      // AHEM: patti TOOLBAR ke NEECHE se khule — us ke OOPER nahi. Warna
      // woh toolbar ko hi dhak leti hai aur button dabaya hi nahi ja sakta.
      try {
        const d0   = _ch173Doc();
        const host = d0 && d0.parentElement;            // safhe wala khana
        const wrap = host && host.parentElement;        // toolbar + khana
        const tbar = wrap && wrap.querySelector('.no-print');   // چالان ka toolbar
        const par  = bar.offsetParent || bar.parentElement;
        if (tbar && par) {
          const rp = par.getBoundingClientRect();
          const rt = tbar.getBoundingClientRect();
          bar.style.top = Math.max(0, Math.round(rt.bottom - rp.top)) + 'px';
        }
      } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
      bar.classList.add('peek');
    } else if (bar.classList.contains('peek')) {
      // Foran gayab na ho — thora waqt do, warna button tak pohanchte hi
      // patti band ho jati hai
      clearTimeout(window._ch173PeekT);
      window._ch173PeekT = setTimeout(() => {
        try { bar.classList.remove('peek'); } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
      }, 400);
    }
  }, { passive: true });
}
window._ch173FocusMode = _ch173FocusMode;

// ═══ Chuni hui jagah YAAD rakho ═══
// Toolbar ke select/button par tap karte hi contenteditable se focus hat jata
// hai aur chuna hua matn zaya ho jata hai — isi liye font size lagta hi nahi
// tha aur dropdown wapas purani qeemat par palat jata tha. Yahan hum aakhri
// selection mehfooz rakhte hain aur amal se pehle wapas laga dete hain.
let _ch173Range = null;

function _ch173SaveRange() {
  const doc = _ch173Doc();            // hamesha NAZAR AANE wala چالان
  if (!doc) return;
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const r = sel.getRangeAt(0);
  if (doc.contains(r.commonAncestorContainer)) _ch173Range = r.cloneRange();
}
window._ch173SaveRange = _ch173SaveRange;

function _ch173RestoreRange() {
  const doc = _ch173Doc();            // hamesha NAZAR AANE wala چالان
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
  const doc = _ch173Doc();            // hamesha NAZAR AANE wala چالان
  if (!doc) return [];
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return [];
  if (!doc.contains(sel.anchorNode) || !doc.contains(sel.focusNode)) return [];
  try { document.execCommand('styleWithCSS', false, false); } catch(_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  let ok = false;
  try { ok = document.execCommand('fontSize', false, '7'); } catch(_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
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
  // v553: data-dio-fs = افسر کا خود لگایا ہوا سائز — «پرانے مواد کو 14pt» والا قاعدہ اسے نہ بدلے
  spans.forEach(s => { s.style.fontSize = pt + 'pt'; s.setAttribute('data-dio-fs', '1'); });
  return true;
}

// Poore document ka font (naap hamesha POINT/pt mein — px kahin nahi)
function _ch173FontToDoc(pt) {
  const doc = _ch173Doc();            // hamesha NAZAR AANE wala چالان
  if (!doc) return;
  doc.dataset.fs = pt;
  // Safhe ki JAR par bhi — taake jin khanon ki apni koi alag naap nahi
  // (unwan, کاغذات waghera) woh bhi saath badlen
  doc.style.fontSize = pt + 'pt';
  // PEHLE: andar reh gayi PURANI naapein saaf karo. Matn idhar udhar hilte
  // waqt (کالم 7 se neeche aur wapas) chhote chhote span ban jate hain jin par
  // pichhli naap chipki reh jati hai — woh nayi naap ko rok deti thi.
  // AHEM: yeh kaam nayi naap lagane se PEHLE hona chahiye, warna yeh khud usi
  // nayi naap ko mita deta hai. Chune hue matn ki apni naap alag raaste
  // (_ch173FontToSelection) se lagti hai, wahan yeh nahi chalta.
  try { _ch173ClearInnerFontSizes(doc); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  // Har woh hissa jis ki apni naap CSS mein likhi hai — usay seedha naap do.
  // AHEM: '.ch173-caseline' (مقدمہ نمبر / مورخہ / جرم wali satar) aur کالم 7
  // (.normwrap = row 3 ka حالات khana, aur .ch173-cont = table ke neeche wala
  // tasalsul) pehle is fehrist mein SHAMIL NAHI the — un ki apni CSS ki 14pt
  // naap jyun ki tyun rehti thi, is liye font ghatane/barhane se baqi tamam
  // khane to badal jate the magar YEHI TEEN nahi badalte the.
  // (caseline ke andar wale span ki apni naap nahi — woh khud wirasat mein
  //  le lete hain, is liye unhen alag se naap dene ki zaroorat nahi.)
  const HISSE = [
    '.ch173-table th', '.ch173-table td',
    '.rotinner', '.hinner',
    '.normwrap', '.ch173-cont',       // کالم 7 (row 3) + neeche wala tasalsul
    '.ch173-caseline',                // مقدمہ نمبر / مورخہ / جرم wali satar
    '.sho-cell-row', '.sho-papers-head', '.sho-papers-body'
  ].join(', ');
  doc.querySelectorAll(HISSE).forEach(el => { el.style.fontSize = pt + 'pt'; });
  const hid = doc.querySelector('[data-k="doc_font"]');
  if (hid) hid.value = pt;
  if (typeof _ch173SizeRotated === 'function') _ch173SizeRotated();
  // Font badalne par khanon ki CHAURAI (1–6) aur QATAR ki unchai dono naye
  // naap par honi chahiyen. Sirf _ch173Overflow() kaafi nahi tha — us se naap
  // purane (chhote) font ki hi rehti thi, is liye naam aur CNIC aapas mein mil
  // jate the aur کالم 7 ka izafi matn neeche jane ki bajaye chhup jata tha.
  if (typeof _ch173Layout === 'function') setTimeout(_ch173Layout, 60);
  else if (typeof _ch173Overflow === 'function') setTimeout(_ch173Overflow, 60);
}
window._ch173FontToDoc = _ch173FontToDoc;

// ═══ Andar ke chhote tukron par chipki purani naap hatao ═══
// Matn جب کالم 7 se neeche jata hai aur wapas aata hai to har lafz ka apna
// span ban sakta hai. Agar us par pichhli inline naap lagi ho to poore safhe
// ki nayi naap us par asar nahi karti — woh lafz purani naap par hi reh jata
// hai. Yahan sirf DASTAWEZ ke matn wale hisson ke ANDAR se naap hatate hain
// (khud khane ki naap nahi chhirti — woh abhi lagayi gayi hai).
function _ch173ClearInnerFontSizes(doc) {
  if (!doc) return;
  const MATN = ['.rotinner', '.normwrap', '.ch173-cont', '.ch173-caseline',
                '.sho-papers-body'];
  doc.querySelectorAll(MATN.join(', ')).forEach(host => {
    host.querySelectorAll('*').forEach(el => {
      // کاغذات ki tadaad (.pp-qty) aur naam (.pp-name) ki apni shakl hai —
      // un ki naap CSS se aati hai, chhirne ki zaroorat nahi
      // v563: افسر کا خود لگایا ہوا سائز (data-dio-fs — Ctrl+[ / Ctrl+] یا چنے متن کا سائز) نہیں مٹتا؛
      //   پہلے یہ چالان کھلتے ہی صاف ہو جاتا تھا (دوبارہ کھولنے پر فارمیٹنگ غائب)
      if (el.style && el.style.fontSize && !el.hasAttribute('data-dio-fs')) el.style.fontSize = '';
    });
  });
}
window._ch173ClearInnerFontSizes = _ch173ClearInnerFontSizes;

// Dropdown se font — matn chuna ho to usi par, warna POORE doc par
function _ch173SetFont(val) {
  const pt = parseFloat(val);
  if (!pt || isNaN(pt)) return;
  _ch173RestoreRange();                        // chuna hua matn wapas lagao
  const _fs = document.getElementById('ch173-font-sel');
  if (_fs) _fs.value = String(pt);             // dropdown wapas na palte
  // 1) Matn WAQAI chuna hua ho → sirf usi par
  if (_ch173FontToSelection(pt)) {
    _ch173SaveRange();
    try { _r173Dirty = true; } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    return;
  }
  // 2) Warna POORA safha.
  //    AHEM: yahan pehle "sirf us khane par jahan click hua tha" wala raasta
  //    tha. Officer cursor rakhne ke liye khane par click karta hi hai, is
  //    liye 14 chunne par SIRF aik khana badalta tha aur baqi safha 12 par
  //    reh jata tha — officer ko lagta tha ke font selector kaam hi nahi kar
  //    raha. Ab bina matn chune font POORE safhe par lagta hai (jaisi tawaqqo
  //    hai). Kisi aik khane ka alag font chahiye to us khane ka matn chun kar
  //    naap badlein.
  _ch173FontToDoc(pt);
  try { _r173Dirty = true; } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._ch173SetFont = _ch173SetFont;

// ═══ SIRF aik khane ka font ═══
function _ch173FontToCell(cell, pt) {
  const doc = _ch173Doc();            // hamesha NAZAR AANE wala چالان
  if (!cell || !doc || !doc.contains(cell)) return false;
  cell.style.fontSize = pt + 'pt';
  // Khane ke andar ka matn rakhne wala hissa bhi
  cell.querySelectorAll('.rotinner, .rothead, .normwrap, .hinner').forEach(el => {
    el.style.fontSize = pt + 'pt';
  });
  // Poore doc jaisi wajah — khane ki naap bhi naye font ke mutabiq dobara ho
  if (typeof _ch173Layout === 'function') setTimeout(_ch173Layout, 60);
  else if (typeof _ch173Overflow === 'function') setTimeout(_ch173Overflow, 60);
  return true;
}
window._ch173FontToCell = _ch173FontToCell;

// Aakhri khana jis par click hua — font isi par lagta hai
function _ch173BindCellPick() {
  const doc = _ch173Doc();            // hamesha NAZAR AANE wala چالان
  if (!doc || doc._cellPickBound) return;
  doc._cellPickBound = true;
  doc.addEventListener('mousedown', (e) => {
    try {
      const c = e.target.closest(
        '.ch173-table thead th, .ch173-table tbody td, .ch173-cont, ' +
        '.sho-cell-row, .sho-papers-head, .sho-papers-body');
      if (c) window._ch173LastCell = c;
    } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  }, true);
}
window._ch173BindCellPick = _ch173BindCellPick;

// ═══ Har khane ka apna font — mehfooz karne/wapas lagane ke liye ═══
function _ch173CellFonts() {
  const doc = _ch173Doc();            // hamesha NAZAR AANE wala چالان
  if (!doc) return null;
  const out = { th: [], k: {} };
  doc.querySelectorAll('.ch173-table thead th').forEach(th => out.th.push(th.style.fontSize || ''));
  doc.querySelectorAll('[data-k]').forEach(el => {
    if (el.style && el.style.fontSize) out.k[el.dataset.k] = el.style.fontSize;
  });
  return JSON.stringify(out);
}
window._ch173CellFonts = _ch173CellFonts;

// AHEM — YEH WOHI JAGAH THI JAHAN "font 14 nahi hota" wala masla banta tha:
// _ch173FontToDoc() har khane par INLINE font-size lagata hai, aur un mein se
// aksar khanon par data-k mojood hai. Chunanche _ch173CellFonts() poore doc ka
// font "har khane ka apna font" samajh kar mehfooz kar leta tha. Agle dafa
// safha khulne par yeh function un PURANI (12pt) qeematon ko DOBARA laga deta
// tha — aur woh doc ke 14 ko kha jati thin. Is liye ab legacy naapein
// (10.5pt / 12pt) yahan se nazar-andaz hoti hain; officer ki apni chuni hui
// asal naapein (16, 18, 20 ...) pehle ki tarah mehfooz rehti hain.
function _ch173IsLegacyFont(f) {
  const n = parseFloat(f);
  return !isNaN(n) && R173_FONT_LEGACY.indexOf(n) !== -1;
}

function _ch173ApplyCellFonts(raw) {
  if (!raw) return;
  let o; try { o = JSON.parse(raw); } catch (_) { return; }
  const doc = _ch173Doc();            // hamesha NAZAR AANE wala چالان
  if (!doc || !o) return;
  const ths = doc.querySelectorAll('.ch173-table thead th');
  (o.th || []).forEach((f, i) => {
    if (f && !_ch173IsLegacyFont(f) && ths[i]) {
      ths[i].style.fontSize = f;
      ths[i].querySelectorAll('.rotinner, .rothead').forEach(el => { el.style.fontSize = f; });
    }
  });
  Object.keys(o.k || {}).forEach(k => {
    const f = o.k[k];
    if (!f || _ch173IsLegacyFont(f)) return;      // purani 12pt/10.5pt na lagao
    const el = doc.querySelector('[data-k="' + k + '"]');
    if (el) el.style.fontSize = f;
  });
}
window._ch173ApplyCellFonts = _ch173ApplyCellFonts;

// Cursor jahan ho, dropdown wahi size dikhaye (MS Word jaisa)
function _ch173SyncFontSel() {
  const doc = _ch173Doc();            // hamesha NAZAR AANE wala چالان
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
  } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._ch173SyncFontSel = _ch173SyncFontSel;

// ═══ FORMAT PAINTER — MS Word جیسا ═══
// ایک کلک  = ایک بار لگے گا، پھر خود بند
// ڈبل کلک = بند کرنے تک بار بار لگتا رہے گا (Esc یا دوبارہ کلک سے بند)
let _ch173Brush = null;      // mehfooz formatting
let _ch173BrushMode = null;  // 'once' | 'sticky' | null

// Cursor jahan hai wahan ki formatting naqal karo
function _ch173BrushCopy() {
  const doc = _ch173Doc();            // hamesha NAZAR AANE wala چالان
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
  try { _r173Dirty = true; } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  return true;
}

// Button ki halat (on/off) dikhao
function _ch173BrushUI() {
  const btn = document.getElementById('ch173-brush-btn');
  const doc = _ch173Doc();            // hamesha NAZAR AANE wala چالان
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
  const doc = _ch173Doc();            // hamesha NAZAR AANE wala چالان
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
  try { document.execCommand('removeFormat', false, null); } catch(_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  // Humare apne <span style="font-size:..."> bhi saaf karo
  try {
    _ch173WrapSelection().forEach(sp => sp.removeAttribute('style'));
  } catch(_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  _ch173SaveRange();
  try { _r173Dirty = true; } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._ch173ClearFmt = _ch173ClearFmt;

function _ch173Fmt(cmd) {
  // AHEM: agar cursor/selection PEHLE SE چالان ke andar hai to purani
  // (basi) selection wapas mat lagao — bold lagne ke baad safha badal
  // jata hai, aur basi selection ghalat jagah par lagti thi, isi liye
  // dobara dabane par bold KHATAM nahi hota tha.
  const doc = _ch173Doc();            // hamesha NAZAR AANE wala چالان
  const sel = window.getSelection();
  const live = doc && sel && sel.rangeCount &&
               doc.contains(sel.getRangeAt(0).commonAncestorContainer);
  if (!live) _ch173RestoreRange();
  try { document.execCommand('styleWithCSS', false, false); } catch(_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  try { document.execCommand(cmd, false, null); } catch(_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  _ch173SaveRange();
  try { _r173Dirty = true; } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}
// Purana naam bhi chalta rahe (kahin aur se pukara ja raha ho to)
function _ch173FontStep(dir) {
  const doc = _ch173Doc();            // hamesha NAZAR AANE wala چالان
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
  } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
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
  else if (m) suffix = m[1].replace(/\s+/g, ' ').trim();  // field mein tha to hi
  else suffix = '';   // SETTLED RULE: field mein ت پ na ho to KHUD SE NA lagao
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
    } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
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
  try { _r173Dirty = true; } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
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
  try { _ch173FocusMode(false); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }     // chips wapas
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
    return t ? (t.length > 400 ? t.slice(0, 400) + '…' : t) : '';
  };
  const dt = (d) => d.date ? (typeof formatDate === 'function' ? formatDate(d.date) : d.date) : '';
  // Mehfooz karne ka waqt (تاریخ ke neeche)
  const wq = (d) => {
    const iso = d.saved || '';
    if (!iso) return '';
    try {
      const x = new Date(iso);
      if (isNaN(x)) return '';
      let h = x.getHours(); const m = String(x.getMinutes()).padStart(2, '0');
      const ap = h < 12 ? 'am' : 'pm';
      h = h % 12; if (!h) h = 12;
      return String(h).padStart(2, '0') + ':' + m + ' ' + ap;
    } catch (_) { return ''; }
  };

  const rows = (list) => list.map((d, i) => `
    <tr ondblclick="_r173OpenDoc('${_dioJsHtml(d.id)}')" style="cursor:pointer;">
      <td class="num">${i + 1}</td>
      <td>${esc(d.head || typeName(d.type))}${d._conflict
        ? ` <button type="button" class="r173-st r173-st-c" onclick="event.stopPropagation();_r173Resolve('${_dioJsHtml(d.id)}')">دو نسخے — فیصلہ کریں</button>`
        : ((d._pending || /^(local-|tmp_)/.test(String(d.id))) ? ` <span class="r173-st r173-st-p" title="${esc(d._sync_err || '')}">اس آلے پر — سرور پر بھیجنا باقی</span>` : '')}</td>
      <td style="text-align:center;">${esc(typeName(d.type))}</td>
      <td style="text-align:center;white-space:nowrap;font-family:var(--font-mono);">
        ${esc(dt(d))}${wq(d) ? `<div class="wq">${esc(wq(d))}</div>` : ''}</td>
      <td class="mz">${esc(mazmoon(d))}</td>
      <td class="act">
        ${dioActRow(dioActBtn('edit', `_r173OpenDoc('${_dioJsHtml(d.id)}')`, 'ترمیم')
          + dioActBtn('print', `_r173PrintDoc('${_dioJsHtml(d.id)}')`, 'پرنٹ')
          + dioActBtn('share', `_r173EmailDoc('${_dioJsHtml(d.id)}')`, 'شیئر')
          + dioActBtn('delete', `_r173DeleteDoc('${_dioJsHtml(d.id)}')`, 'حذف'))}
      </td>
    </tr>`).join('');

  area.innerHTML = `
  <style>
    .ct{ width:100%; border-collapse:collapse; font-size:13px; direction:rtl;
         font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; }
    .ct th{ background:var(--bg-tertiary); border:1px solid var(--border); padding:7px 6px;
            font-weight:700; white-space:nowrap; text-align:center; }
    .ct td{ border:1px solid var(--border); padding:6px; vertical-align:middle; }
    .ct tbody tr:nth-child(odd){ background:var(--bg-secondary); }
    .ct tbody tr:hover{ background:var(--hover-bg); }
    .ct .num{ text-align:center; font-weight:700; width:44px; }
    .ct .act{ white-space:nowrap; text-align:center; width:160px; }
    /* مضمون — satar POORI bharta hai; jo na samaye woh kinare par '…' ban jata hai */
    .ct .mz{ font-size:12px; color:var(--text-secondary);
             width:100%; max-width:0; white-space:nowrap;
             overflow:hidden; text-overflow:ellipsis; text-align:right; }
    /* mehfooz karne ka waqt — تاریخ ke neeche, chhota */
    .ct .wq{ font-size:11px; color:var(--text-muted); margin-top:2px; }
    .cab{ border:1px solid var(--border); background:var(--bg-card); border-radius:6px;
          padding:3px 7px; margin:0 1px; cursor:pointer; font-size:14px; line-height:1; }
    .cab:hover{ background:var(--hover-bg); }
    .r173-st{ display:inline-block; font-size:9pt; padding:1px 7px; border-radius:999px; white-space:nowrap; font-family:inherit; }
    .r173-st-p{ background:rgba(217,119,6,.14); color:#b45309; }
    .r173-st-c{ background:rgba(185,28,28,.12); color:#b91c1c; border:1px solid rgba(185,28,28,.35); cursor:pointer; }
  </style>
  <div class="r173-list-wrap" style="padding:14px;direction:rtl;height:100%;overflow-y:auto;">
    <div style="display:flex;align-items:center;gap:10px;margin:0 0 8px;flex-wrap:wrap;">
      <button class="btn btn-primary btn-sm" onclick="_r173NewDoc(false)">+ چالان درج کریں</button>
      <div style="flex:1;"></div>
      <span style="font-size:11px;color:var(--text-muted);">پرنٹ کے لیے ہر سطر کا 🖨️ دبائیں</span>
    </div>
    <table class="ct">
      <thead><tr>
        <th class="num">#</th><th>قسم چالان</th><th>ہیڈ</th><th>تاریخ وقت</th><th>مضمون</th><th class="act">ایکشن</th>
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
  } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
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
    if (!_ch173Doc()) return;
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
    // v560: ابھی صرف اسی آلے پر (سرور پر گیا ہی نہیں) — مقامی ہٹاؤ؛ ورنہ «حذف» = نشان + «حذف شدہ مواد» میں نقل
    if (d._new || /^(local-|tmp_)/.test(String(d.id))) { /* صرف مقامی */ }
    else if (!navigator.onLine) { showToast('سرور پر محفوظ چالان حذف کرنے کے لیے انٹرنیٹ درکار ہے', 'warn', 5000); return; }
    else if (window.DIOSync) await DIOSync.softDelete('report_173', 'r173', Object.assign({ case_id: _r173CaseId, report_type: d.type, report_subtype: d.subtype || null }, d));
    // v547: نتیجہ دیکھ کر — پہلے سرور رد کرتا تب بھی «حذف ہو گیا»
    else dioWriteOk(await supabaseClient.from('report_173').delete().eq('id', d.id).select('id'), 'r173 delete', true);
    _r173Docs = _r173Docs.filter(x => String(x.id) !== String(id));
    _r173LocalPut(_r173CaseId);
    if (typeof showToast === 'function') showToast('حذف ہو گیا', 'info');
  } catch (e) {
    dioWriteFail('اندراج', e, 'حذف نہیں ہوا');
  }
  _renderR173List();
}
window._r173DeleteDoc = _r173DeleteDoc;

// v560 — چالان دو آلات پر بدلا گیا: دونوں نسخے سامنے (ضمنی والا اصول)
function _r173PlainText(fd) {
  const out = [];
  try {
    Object.keys(fd || {}).forEach(k => {
      const v = fd[k];
      if (typeof v !== 'string' || !v.trim() || /^(saved_at|head|fnorm|doc_font|col_w)$/.test(k)) return;
      const t = (window.DIOSync ? DIOSync.plain(v) : v.replace(/<[^>]*>/g, ' ')).trim();
      if (t) out.push(t);
    });
  } catch (_) { /* خالی */ }
  return out.join('\n');
}
async function _r173Resolve(id) {
  const d = _r173Doc(id);
  if (!d || !d._conflict || !window.DIOSync) return;
  const t = d._conflict;
  const pick = await DIOSync.conflictDialog({
    title: 'چالان «' + (d.head || '') + '» — دو آلات پر بدلا گیا',
    mine: { text: _r173PlainText(d.form_data), at: d.saved, device: DIOSync.device() },
    theirs: { text: _r173PlainText(t.form_data), at: t.saved, device: t.last_device, deleted: !!t.deleted_at }
  });
  if (pick === 'later') { _renderR173List(); return; }
  if (!navigator.onLine) { showToast('فیصلہ محفوظ کرنے کے لیے انٹرنیٹ درکار ہے — دونوں نسخے محفوظ ہیں', 'warn', 6000); return; }
  try {
    let next = null;
    if (pick === 'mine') {
      const mine = Object.assign({}, d, { rev: t.rev });
      delete mine._conflict; delete mine._new;
      if (t.deleted_at) { const r0 = await supabaseClient.from('report_173').update({ deleted_at: null }).eq('id', d.id).select('rev'); if (r0.error) throw r0.error; mine.rev = r0.data && r0.data[0] && r0.data[0].rev; }
      next = await _r173Push(_r173CaseId, mine);
      if (!t.deleted_at) await DIOSync.keepLoser('r173', Object.assign({ case_id: _r173CaseId, report_type: t.type, report_subtype: t.subtype || null }, t));
    } else {
      const kept = await DIOSync.keepLoser('r173', Object.assign({ case_id: _r173CaseId, report_type: d.type, report_subtype: d.subtype || null }, d));
      if (!kept) { showToast('اس آلے کا نسخہ «حذف شدہ مواد» میں نہیں جا سکا — اسے نہیں ہٹایا گیا، دوبارہ کوشش کریں', 'error', 8000); return; }
      next = t.deleted_at ? null : Object.assign({}, t);
    }
    if (next) { delete next._conflict; delete next._pending; delete next._new; delete next.deleted_at; }
    const i = _r173Docs.findIndex(x => String(x.id) === String(d.id));
    if (i >= 0) { if (next) _r173Docs[i] = next; else _r173Docs.splice(i, 1); }
    _r173LocalPut(_r173CaseId);
    showToast(pick === 'mine' ? 'اس آلے کا نسخہ سرور پر محفوظ؛ دوسرا «حذف شدہ مواد» میں' : 'سرور والا نسخہ رکھا گیا؛ اس آلے کا «حذف شدہ مواد» میں', 'success', 6000);
  } catch (e) {
    if (e && e.code === 'DIO_CONFLICT') {
      const i = _r173Docs.findIndex(x => String(x.id) === String(d.id));
      if (i >= 0) _r173Docs[i] = Object.assign({}, _r173Docs[i], { _conflict: e.server });
      _r173LocalPut(_r173CaseId);
      showToast('اسی دوران دوسرے آلے نے پھر بدلا — تازہ نسخوں سے دوبارہ چنیں', 'warn', 7000);
    } else dioWriteFail('چالان', e, 'محفوظ نہیں ہوا');
  }
  _renderR173List();
}
window._r173Resolve = _r173Resolve;

// v560 — دوسرے آلے کی تبدیلی (realtime) / ایپ پر واپسی: کھلی چالان فہرست بغیر refresh
function _r173ListOpen() { return !!document.querySelector('.r173-list-wrap'); }
function _r173Typing() { const a = document.activeElement; return !!(a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))); }
if (window.DIOSync && !window._r173SyncHooked) {
  window._r173SyncHooked = true;
  DIOSync.on('report_173', function (row) {
    if (!row || String(row.case_id) !== String(_r173CaseId)) return;
    const item = DIOSync.r173Item(row);
    const r = DIOSync.mergeInto(_r173Docs, item);
    if (r && r !== 'remove' && !row.deleted_at && row.form_data) {
      try { _r173Records[_r173Key(row.report_type, row.report_subtype, row.report_subtype)] = row.form_data; } catch (_) { /* فہرست کافی */ }
    }
    if (_r173ListOpen() && !_r173Typing()) _renderR173List();
    else if (_ch173Doc && _ch173Doc() && String(_r173DocId) === String(row.id) && (r === 'replace' || r === 'remove'))
      showToast('یہ چالان دوسرے آلے پر بھی بدلا گیا ہے — محفوظ کرنے پر دونوں نسخے دکھائے جائیں گے', 'warn', 8000);
  });
  DIOSync.onRefresh(async function () {
    if (!_r173CaseId || !_r173ListOpen() || _r173Typing()) return;
    const before = JSON.stringify(_r173Docs);
    await _loadR173();
    if (_r173ListOpen() && !_r173Typing() && JSON.stringify(_r173Docs) !== before) _renderR173List();
  });
}

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
  // پوری فائل (PDF + Word): چالان کھول کر اسی کا پرنٹ والا کاغذ (جدول، کالم، تمام حروف)
  try {
    if (typeof dioSharePrint === 'function') {
      await _r173OpenDoc(id);
      await new Promise(r => setTimeout(r, 900));
      const tName = (R173_TYPES.find(t => t.id === d.type) || {}).name || 'چالان';
      if (await dioSharePrint(() => _printR173(), subj || tName, () => _ch173Doc())) return;
    }
  } catch (_) { /* نیچے متن والا راستہ */ }
  try {
    if (navigator.share) { await navigator.share({ title: subj, text: subj + '\n\n' + txt }); return; }
    window.location.href = 'mailto:?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(txt);
  } catch (_) {
    try { await navigator.clipboard.writeText(subj + '\n\n' + txt);
      if (typeof showToast === 'function') showToast('نقل ہو گیا', 'success'); } catch (__) { /* share/clipboard na mile to koi baat nahi */ }
  }
}
window._r173EmailDoc = _r173EmailDoc;

// 🖨️ تمام پرنٹ
function _printAllR173(isIkhraj) {
  const IK = ['ikhraj','adampata'];
  const list = _r173Docs.filter(d => isIkhraj ? IK.includes(d.type) : !IK.includes(d.type));
  if (!list.length) {
    if (typeof showToast === 'function') showToast('کوئی اندراج نہیں', 'info'); return;
  }
  if (typeof showToast === 'function')
    showToast('ایک ایک کر کے کھول کر پرنٹ کریں', 'info', 4000);
  _r173PrintDoc(list[0].id);
}
window._printAllR173 = _printAllR173;

// ہیڈ/عنوان بدلیں (فہرست میں یہی نظر آتا ہے)
function _r173SetHead(h) {
  _r173Head = h || '';
  try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
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
  const doc = _ch173Doc();            // hamesha NAZAR AANE wala چالان
  if (!doc || doc._keysBound) return;
  doc._keysBound = true;
  doc.addEventListener('keydown', function (e) {
    const el = e.target;
    if (!el || !el.isContentEditable) return;

    // ENTER → نئی سطر (خانے کے اندر ہی)
    // v563: Tab، Ctrl+B/I/U اور باقی MS Word کلیدیں پورے سسٹم کا ایک ہی سننے والا (dio-keys.js)
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      _ch173Insert('\n');
    }
  });
}
window._ch173BindKeys = _ch173BindKeys;

// ═══ کاغذ کا سائز — لیگل (8.5×13) یا A4 ═══
// سافٹ ویئر کا اصل اصول لیگل ہے، مگر بہت سے دفاتر A4 پر چھاپتے ہیں —
// اس لیے دونوں کا اختیار۔ منتخب کردہ سائز محفوظ رہتا ہے۔

/* کام کی چوڑائی (ٹیبل کا اپنا خانہ) — کاغذ بدلنے سے پہلے اور بعد میں ناپی
   جاتی ہے، تاکہ نسبت نکالی جا سکے۔ */
function _ch173KaamChaurai() {
  try {
    const doc = _ch173Doc(); if (!doc) return 0;
    // ⚠ ٹیبل کی اپنی چوڑائی یہاں کام نہیں آتی: اگر ٹیبل صفحے سے باہر نکلا ہوا
    // ہو تو وہ اپنی ہی (بڑی) چوڑائی بتاتا ہے — یعنی کاغذ بدلنے پر پہلے اور
    // بعد کی قیمت ایک جیسی آتی ہے اور نسبت نکل ہی نہیں پاتی۔
    // اِس لیے صفحے کے اندر کی **دستیاب** چوڑائی ناپی جاتی ہے (padding کے بعد)۔
    const cs = getComputedStyle(doc);
    const w = (doc.clientWidth || 0)
            - (parseFloat(cs.paddingLeft)  || 0)
            - (parseFloat(cs.paddingRight) || 0);
    return Math.max(0, Math.round(w));
  } catch (_) { return 0; }
}

/* افسر کی خود کھینچی ہوئی چوڑائیاں نئے کاغذ کی نسبت سے — صرف کاغذ بدلنے پر۔
   • نسبت = نئی کام کی چوڑائی ÷ پرانی
   • اگر اِس کے بعد بھی کل چوڑائی صفحے سے زیادہ ہو تو مزید سکیڑ کر بالکل
     اندر لے آئی جاتی ہے (یعنی ٹیبل کبھی باہر نہ نکلے)
   • کوئی خانہ 24px سے کم نہیں                                              */
function _ch173RescaleManualCols(puraniChaurai) {
  const doc = _ch173Doc(); if (!doc) return;
  const table = doc.querySelector('#ch173-table'); if (!table) return;
  if (table.dataset.colsManual !== '1') return;   // خود کار ناپ کو _ch173Layout سنبھالتا ہے
  const cols = [...table.querySelectorAll('colgroup col')];
  const row  = table.querySelector('tbody tr');
  if (!cols.length || !row) return;
  const tds = [...row.querySelectorAll('td')];
  if (tds.length < cols.length) return;

  const nayi = _ch173KaamChaurai();
  if (!nayi || !puraniChaurai || nayi === puraniChaurai) return;

  const sc = _ch173Scale() || 1;
  let ab = tds.slice(0, cols.length).map(td => (td.getBoundingClientRect().width / sc) || 0);
  if (!ab.reduce((a, b) => a + b, 0)) return;

  const f = nayi / puraniChaurai;
  let naya = ab.map(w => w * f);

  // صفحے سے باہر نہ جائے
  let kul = naya.reduce((a, b) => a + b, 0);
  if (kul > nayi) { const g = nayi / kul; naya = naya.map(w => w * g); }

  const MIN = 24;
  naya = naya.map(w => Math.max(MIN, Math.round(w)));

  // MIN لگنے سے کل بڑھ گیا ہو تو سب سے چوڑے خانے سے کمی کرو
  let t2 = naya.reduce((a, b) => a + b, 0);
  if (t2 > nayi) {
    let extra = t2 - nayi;
    let idx = naya.indexOf(Math.max(...naya));
    naya[idx] = Math.max(MIN, naya[idx] - extra);
  }

  cols.forEach((c, i) => { if (naya[i]) c.style.width = naya[i] + 'px'; });
  try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._ch173RescaleManualCols = _ch173RescaleManualCols;

/* ── ہر کاغذ کی اپنی ناپ یاد رکھو ───────────────────────────────────────
   لیگل → A4 → لیگل کرنے پر ناپ **بالکل وہی** واپس آ جائے جو پہلے تھی۔
   صرف نسبت سے سکیڑنے پر ایسا نہیں ہوتا تھا: واپس آنے پر ناپ کی ترتیب صفحے
   کی پوری چوڑائی بھر دیتی تھی، یعنی آپ کی اصل ناپ بدل جاتی تھی۔           */
function _ch173RememberCols(kaghaz) {
  try {
    const doc = _ch173Doc(); if (!doc) return;
    const table = doc.querySelector('#ch173-table'); if (!table) return;
    if (table.dataset.colsManual !== '1') return;
    const cols = [...table.querySelectorAll('colgroup col')];
    if (!cols.length) return;
    const w = cols.map(c => c.style.width || '');
    if (!w.some(Boolean)) return;
    table.dataset['colsFor' + (kaghaz === 'a4' ? 'A4' : 'Legal')] = JSON.stringify(w);
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
}

function _ch173RestoreCols(kaghaz) {
  try {
    const doc = _ch173Doc(); if (!doc) return false;
    const table = doc.querySelector('#ch173-table'); if (!table) return false;
    if (table.dataset.colsManual !== '1') return false;
    const raw = table.dataset['colsFor' + (kaghaz === 'a4' ? 'A4' : 'Legal')];
    if (!raw) return false;
    const w = JSON.parse(raw);
    const cols = [...table.querySelectorAll('colgroup col')];
    if (!Array.isArray(w) || w.length !== cols.length) return false;
    cols.forEach((c, i) => { if (w[i]) c.style.width = w[i]; });
    return true;
  } catch (_) { return false; }
}

/* ── آخری ضمانت: ٹیبل کبھی صفحے سے باہر نہ نکلے ─────────────────────────
   یہ صرف کاغذ بدلنے کے موقع پر چلتی ہے، پوری ناپ کی ترتیب کے **بعد**۔
   چاہے چوڑائی افسر نے خود طے کی ہو یا خود کار ترتیب نے — اگر کل چوڑائی
   صفحے کی دستیاب چوڑائی سے زیادہ ہو تو سب خانے اُسی نسبت سے سکیڑ کر اندر
   لے آئے جاتے ہیں۔ یعنی A4 پر ٹیبل باہر نکلنے کی صورت باقی نہیں رہتی۔
   (صرف تین آخری کام دوبارہ چلائے جاتے ہیں جو خانوں کی چوڑائی نہیں بدلتے:
    متن جمانا، CNIC لپیٹنا، SHO کی سطر سیدھ میں کرنا۔)                    */
function _ch173ClampCols() {
  try {
    const doc = _ch173Doc(); if (!doc) return false;
    const table = doc.querySelector('#ch173-table'); if (!table) return false;
    const cols = [...table.querySelectorAll('colgroup col')];
    const row  = table.querySelector('tbody tr');
    if (!cols.length || !row) return false;
    const tds = [...row.querySelectorAll('td')];
    if (tds.length < cols.length) return false;

    const nayi = _ch173KaamChaurai();
    if (!nayi) return false;
    const sc = _ch173Scale() || 1;
    const ab = tds.slice(0, cols.length).map(td => (td.getBoundingClientRect().width / sc) || 0);
    const kul = ab.reduce((a, b) => a + b, 0);
    if (!kul || kul <= nayi + 1) return false;          // پہلے ہی اندر ہے

    const MIN = 24, g = nayi / kul;
    let naya = ab.map(w => Math.max(MIN, Math.round(w * g)));
    let t2 = naya.reduce((a, b) => a + b, 0);
    if (t2 > nayi) {
      const idx = naya.indexOf(Math.max(...naya));
      naya[idx] = Math.max(MIN, naya[idx] - (t2 - nayi));
    }
    cols.forEach((c, i) => { if (naya[i]) c.style.width = naya[i] + 'px'; });

    // صرف وہ آخری کام جو چوڑائی نہیں بدلتے
    try { _ch173OverflowSettle(4); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    try { _ch173WrapCnics(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    try { _ch173AlignSho(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    return true;
  } catch (_) { return false; }
}
window._ch173ClampCols = _ch173ClampCols;

function _ch173SetPaper(v) {
  // کاغذ بدلنے سے پہلے: کام کی چوڑائی (نسبت کے لیے) + پرانے کاغذ کی ناپ یاد
  const _puraniKaamChaurai = _ch173KaamChaurai();
  const _puranaKaghaz = _ch173Paper;
  try { _ch173RememberCols(_puranaKaghaz); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  _ch173Paper = (v === 'a4') ? 'a4' : 'legal';
  try { localStorage.setItem('dio_ch173_paper', _ch173Paper); } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  /* صفحہ نئے سائز پر دوبارہ بنائیں — پوری ناپ کی ترتیب سے۔
     ───────────────────────────────────────────────────────────────────
     پہلے یہاں صرف دو کام الگ الگ چلتے تھے:
         _ch173FitPaper()  اور  _ch173OverflowSettle(4)
     یعنی صفحہ تو نئے کاغذ کی ناپ پر آ جاتا تھا، مگر خانوں کی چوڑائی
     (_ch173AutoFitCols) دوبارہ نہیں لی جاتی تھی۔ A4 لیگل سے تنگ ہے اور
     اُس کا side margin بھی بڑا (0.2cm → 0.5cm) — یعنی کام کی چوڑائی تقریباً
     0.47in کم ہو جاتی ہے، مگر خانے اپنی پرانی px چوڑائی پر قائم رہتے تھے۔
     نتیجہ: A4 منتخب کرنے پر ٹیبل صفحے سے باہر نکل جاتا تھا۔
     براؤزر پر ناپا گیا: کام کی چوڑائی 801px → 756px، مگر خانے 910px پر
     ہی رہے — یعنی 154px باہر۔

     اِس فائل کا اپنا اصول (اوپر LOCKED فہرست میں) یہی کہتا ہے:
       «Naap ka POORA kaam SIRF _ch173Layout() se hota hai, aik pakki
        tarteeb mein … In mein se koi kaam ALAG SE na chalaya jaye.»
     اِس لیے اب وہی ایک ترتیب چلتی ہے۔ _ch173Layout() خود پہلے
     _ch173FitPaper() چلاتا ہے اور آخر میں _ch173OverflowSettle(4) — یعنی
     جو کچھ پہلے ہوتا تھا وہ سب بہرحال ہوتا ہے، اور ساتھ خانوں کی چوڑائی
     بھی نئے کاغذ کے مطابق ہو جاتی ہے۔

     دوسرا حصہ — افسر کی خود کھینچی ہوئی چوڑائی:
     اگر خانوں کی چوڑائی افسر نے خود لکیر کھینچ کر طے کی ہو
     (data-cols-manual='1') تو یہ فائل اُسے جان بوجھ کر کبھی نہیں بدلتی —
     اور یہ درست ہے۔ مگر کاغذ بدلنے پر وہی px چوڑائی A4 کے تنگ صفحے سے
     باہر نکل جاتی تھی۔ اِس لیے اب صرف **کاغذ بدلنے** کے موقع پر وہ چوڑائیاں
     اُسی نسبت سے چھوٹی/بڑی کر دی جاتی ہیں (نیچے _ch173RescaleManualCols)۔
     نسبت برقرار رہتی ہے، اِس لیے شکل وہی رہتی ہے — اور واپس لیگل چُننے پر
     ناپ واپس اپنی جگہ آ جاتی ہے۔ باقی ہر موقع پر (فونٹ، خِرکی، دوبارہ
     ناپ) افسر کی چوڑائی پہلے کی طرح محفوظ ہے۔                           */
  try { _ch173FitPaper(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }                      // نیا کاغذ لگ جائے
  // اِس کاغذ کی ناپ پہلے یاد ہو تو بالکل وہی واپس؛ ورنہ نسبت سے سکیڑو
  let _bahaal = false;
  try { _bahaal = _ch173RestoreCols(_ch173Paper); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  if (!_bahaal) { try { _ch173RescaleManualCols(_puraniKaamChaurai); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } }
  try { _ch173Layout(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  try { _ch173ClampCols(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }                     // باہر نکلنے کی صورت باقی نہ رہے
  if (typeof showToast === 'function')
    showToast(_ch173Paper === 'a4' ? '📄 A4 منتخب' : '📄 لیگل (8.5×13) منتخب', 'info');
}
window._ch173SetPaper = _ch173SetPaper;

// ═══════════════════════════════════════════════════════════════════
//  کالم 7 کا شروعاتی فقرہ (خانہ خالی ہو تو خودبخود آ جاتا ہے)
//  ساخت:  جناب عالیٰ! مختصر حالات مقدمہ اس طرح ہیں کہ
//         + [FIR یا کراس ورژن کا متن — مقدمہ کے ریکارڈ سے]
//         + جس پر مقدمہ عنوان بالا درج ہوا … دورانِ تفتیش
// ═══════════════════════════════════════════════════════════════════
let _ch173FirMatn = null;          // اس مقدمہ کے تمام متن

const R173_HALAAT_START = 'جناب عالیٰ! مختصر حالات مقدمہ اس طرح ہیں کہ ';
const R173_HALAAT_END   = ' جس پر مقدمہ عنوان بالا درج ہوا تفتیش مقدمہ عمل میں لائی گئی دورانِ تفتیش ';

// موجودہ ورژن (FIR / کراس ورژن) کا متن
function _ch173FirText() {
  const list = _ch173FirMatn || [];
  const want = (_ch173Version === 'cross_version') ? 'cross_version' : 'fir';
  const rows = list.filter(m => (m.type || 'fir') === want);
  if (!rows.length) return '';
  return rows.map(m => String(m.matn || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
             .filter(Boolean).join(' ');
}

// پورا فقرہ
function _ch173HalaatText() {
  const body = _ch173FirText();
  return R173_HALAAT_START + (body ? body : '') + R173_HALAAT_END;
}
window._ch173HalaatText = _ch173HalaatText;

// متن لوڈ کرو، پھر خالی خانے میں فقرہ ڈال دو
async function _ch173LoadFirMatn() {
  const cid = _r173CaseId || _misalCaseId ||
              (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  if (!cid) { _ch173FirMatn = []; return; }
  try {
    const { data } = await supabaseClient.from('fir_matn')
      .select('matn,type').eq('case_id', cid).order('created_at', { ascending: true });
    _ch173FirMatn = data || [];
  } catch (_) { _ch173FirMatn = []; }
  _ch173FillHalaat();
}
window._ch173LoadFirMatn = _ch173LoadFirMatn;

// خانہ خالی ہو تو فقرہ ڈالو (لکھا ہوا متن کبھی نہ مٹے)
function _ch173FillHalaat() {
  try {
    // تتمہ چالان mein کالم 7 ka apna (boilerplate) matn rehta hai — FIR ka
    // matn yahan NA bhara jaye. (Pehle تتمہ mein bhi FIR ka matn aa jata tha.)
    if (_r173Type === 'tatima_challan') return;
    const cell = (_ch173Cells() || {}).cell;
    if (!cell) return;
    if (cell.innerText.replace(/\s/g, '').length) return;   // پہلے سے کچھ لکھا ہے
    cell.innerText = _ch173HalaatText();
    if (typeof _ch173Overflow === 'function') _ch173Overflow();
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._ch173FillHalaat = _ch173FillHalaat;

// ═══════════════════════════════════════════════════════════════════
//  چالان کی CSS — ایک ہی جگہ، اسکرین اور پرنٹ دونوں کے لیے
//  پہلے دو الگ نقلیں تھیں (ایک اسکرین کی، ایک پرنٹ کی) جو بار بار
//  ایک دوسرے سے مختلف ہو جاتی تھیں — اسی لیے فارم ہر جگہ الگ نظر
//  آتا تھا (اسکرین، پرنٹ، PDF)۔ اب ایک ہی نقل ہے۔
// ═══════════════════════════════════════════════════════════════════
function _ch173CSS() {
  return `
      /* ═══════════════════════════════════════════════════════════
         کاغذ کے عنوانات کا پیمانہ — تین درجے، ایک ہی جگہ
         Dastavez (چالان، ضمنی، اندرونی ضمنی — sab) inhi naapon se unwan
         lagate hain. Kaghaz par naap POINT (pt) mein hi honi chahiye,
         kyunke inch/point chhapai ka asal paimana hai.
             --doc-h1  20pt  مرکزی عنوان       (فارم کا نام — bold + لکیر)
             --doc-h2  16pt  ذیلی مرکزی عنوان  (حصے کا عنوان)
             --doc-h3  14pt  عام عنوان         (تھانہ/ضلع، خانوں کے سر نامے)
             --doc-h4  12pt  چھوٹی تحریر       (فارم نمبر وغیرہ)
         Safhe (app) ka apna paimana "theme-pro.css" mein hai — aik hi
         tanasub par, is liye safha aur kaghaz aik dikhte hain.
         ═══════════════════════════════════════════════════════════ */
      #ch173-doc{
        --doc-h1: 20pt;
        --doc-h2: 16pt;
        --doc-h3: 14pt;
        --doc-h4: 12pt;
      }
      #ch173-doc .dio-doc-h1{ font-size:var(--doc-h1); font-weight:bold; text-decoration:underline; line-height:1.9; }
      #ch173-doc .dio-doc-h2{ font-size:var(--doc-h2); font-weight:bold; line-height:1.85; }
      #ch173-doc .dio-doc-h3{ font-size:var(--doc-h3); font-weight:bold; line-height:1.8; }
      #ch173-doc table.ch173-table thead th{ font-size:var(--doc-h3); font-weight:bold; }

      /* ═══════════════════════════════════════════════════════════
         نقطہ دار / نمبر والی فہرست — نشان متن پر نہ چڑھے
         MASLA (asli browser mein naapa gaya): app ki bunyadi CSS mein
         "*{ margin:0; padding:0 }" hai — is se ul/ol ki apni jagah
         (padding-inline-start) KHATAM ho jati hai. Nishan ki jagah
         "outside" hoti hai, yani woh khane se BAHAR chhapta hai — RTL
         mein matn ke DAYEN, seedha matn par. Naap:
             safhe par : ul ka dayan kinara 875px = matn ka dayan kinara 875px
                          → nishan ke liye jagah SIFAR
             chhapai   : wahan reset nahi lagta, is liye 40px jagah
         Yani safha aur kaghaz alag the, aur safhe par (aur browser ki apni
         Ctrl+P chhapai mein) nishan matn par charhta tha. Ab dono jagah
         aik hi qaida — jagah bhi aur tarteeb bhi.
         ═══════════════════════════════════════════════════════════ */
      #ch173-doc ul, #ch173-doc ol{
        padding-inline-start: 1.9em !important;
        margin: 0.35em 0 !important;
        list-style-position: outside !important;
      }
      #ch173-doc ul{ list-style-type: disc !important; }
      #ch173-doc ol{ list-style-type: decimal !important; }
      #ch173-doc li{
        text-align: start !important;
        text-align-last: start !important;
        margin: 0.12em 0 !important;
        padding: 0 !important;
        unicode-bidi: plaintext;
      }
      #ch173-doc li::marker{ font-size: 0.9em; }
      #ch173-doc li > br:only-child{ display:none; }
      /* ── چالان = پورا صفحہ ── chips ki patti sirf CHHUPTI hai, hoti wahin
         hai; cursor ooper le jate hi .peek lag kar wapas nazar aa jati hai. */
      /* AHEM: patti matn ke OOPER (absolute) nazar aati hai — neeche wali
         cheezon ko DHAKELTI nahi. Pehle woh dhakel deti thi, jis se toolbar
         neeche aa jata tha; button tak pohanchte hi cursor ooper wale ilaqe
         se nikal jata, patti chhup jati aur toolbar wapas ooper chala jata —
         button haath se nikal jata tha. Ab toolbar apni jagah se hilta hi
         nahi. */
      body.ch173-focus #misal-doc-bar{
        position:absolute; top:0; left:0; right:0; z-index:60;
        max-height:0 !important; padding-top:0 !important; padding-bottom:0 !important;
        opacity:0; overflow:hidden;
        background:var(--bg-secondary, #fff);
        transition:max-height .18s ease, opacity .18s ease, padding .18s ease;
      }
      body.ch173-focus #misal-doc-bar.peek{
        max-height:240px !important; opacity:1;
        padding-top:6px !important; padding-bottom:6px !important;
        box-shadow:0 8px 18px rgba(0,0,0,.18);
      }
      /* Neeche wali patti bhi hat jaye — poora safha چالان ko mile */
      body.ch173-focus .bottombar{ display:none !important; }
      /* Safhe ki apni BUNYADI naap — 14pt. Ye zaroori hai: warna چالان bahar
         wale ('.page-content' wale) 14 PIXEL ko wirasat mein le leta tha aur
         har khana chhota chhap jata tha. Yahan se har woh khana theek rehta
         hai jis par apni koi alag naap nahi lagi. */
      #ch173-doc{ direction:rtl; font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; color:#000; font-size:14pt; }
      /* Unwan: FORM No. aur Urdu heading — dono AIK hi flex dhanche mein,
         is liye dono ka center bilkul aik (linked) */
      /* Unwan: beech wala hissa HAMESHA sacche page-center par (absolute 50%),
         chahe kinaron ka matn kitna bhi lamba ho. FORM No. bhi usi 50% par →
         dono ka center bilkul aik (linked). */
      /* ═══ عنوان کی سطر — ٹکراؤ ختم ═══
         PEHLE: unwan (.tt-mid) aur فارم نمبر (.form-no) DONO
         "position:absolute; left:50%" par the, aur satar ki unchai sirf
         1.6em muqarrar thi. 20pt ka unwan us se kahin ooncha hai, is liye
         woh apni satar se BAHAR nikal kar OOPER wali satar (فارم نمبر) par
         charh jata tha — aur chaurai mein «تھانہ صدر ملتان» par bhi.
         Screenshot mein saaf nazar aata tha: "تھانہ صدر ملتا|فارم رپورٹ…".
         AB: teen khanon wali grid — "1fr auto 1fr". Dono kinare ke khane
         BILKUL barabar hote hain, is liye beech wala unwan KAGHAZ ke theek
         darmiyan rehta hai (sarkari فارم ka taqaza), aur satar apne matn ke
         mutabiq oonchi ho jati hai — koi cheez kisi par nahi charhti.
         RTL mein pehla khana DAYEN hota hai: تھانہ → unwan → ضلع. */
      #ch173-doc .ch173-title-row{
        display:grid; grid-template-columns:1fr auto 1fr;
        align-items:baseline; column-gap:12px; width:100%;
      }
      #ch173-doc .ch173-title-row > span{ min-width:0; }
      #ch173-doc .tt-right{ justify-self:start; text-align:right; font-size:var(--doc-h3); padding-right:0.35in; }
      #ch173-doc .tt-left{ justify-self:end; text-align:left; font-size:var(--doc-h3); padding-left:0.35in; }
      #ch173-doc .tt-mid{
        justify-self:center; text-align:center;
        font-weight:bold; text-decoration:underline; font-size:var(--doc-h1);
        line-height:1.75; text-underline-offset:0.12em;
      }
      #ch173-doc .form-no{ justify-self:center; font-style:italic; font-size:var(--doc-h4); direction:ltr; }

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

      /* AUTO NAAP: 'fixed' ki bajaye 'auto' — ab har khana apne matn ke
         hisab se chaura hota hai (jitna mawad, utni chaurai). کالم 7 ko
         colgroup mein 100% diya gaya hai, is liye bachi hui saari jagah
         wohi le leta hai. */
      /* table-layout:fixed — کالم چوڑائیاں <col> کے مطابق پکی رہتی ہیں۔ پہلے
         'auto' تھا: براؤزر خود مواد کے حساب سے کالم بدل دیتا تھا، اسی لیے ایک
         کالم adjust کرتے ہی پورا table اپنی مرضی سے کھل/بگڑ جاتا تھا۔ اب چوڑائی
         صرف IO کے drag سے بدلے گی، خود بخود نہیں۔ */
      #ch173-doc .ch173-table{ width:100%; border-collapse:collapse; table-layout:fixed; direction:rtl; }
      #ch173-doc .ch173-table th, #ch173-doc .ch173-table td{
        border:1px solid #000; padding:2px 4px; text-align:center;
        white-space:normal; word-wrap:break-word; overflow-wrap:break-word;
        position:relative; line-height:1.15;
      }
      /* Header row 1: jagah ke hisab se chhota font */
      /* Heading font 14pt → 11pt: تنگ کالموں میں heading کم سطروں میں سماتی ہے
         (جیسا user کی image 4 میں target ہے)، اور 96px vcell کی حد کے اندر رہتی
         ہے — heading کبھی اُس سے زیادہ اونچی/زیادہ سطروں والی نہیں ہوتی۔ */
      #ch173-doc .ch173-table thead th{ font-size:11pt; vertical-align:middle; line-height:1.1;
        font-weight:normal; position:relative; padding:1px 4px; }
      /* Data khane: columns 1–6 → Ascending (neeche se ooper). AHEM: CSS transform
         seedha <td> par kaam nahi karta (browser nazar-andaz kar deta hai), is liye
         matn andar <div> wrapper mein rakh kar us par lagate hain. */
      #ch173-doc .ch173-table td{ font-size:14pt; vertical-align:top; line-height:1.15; }
      /* Khane KHUD nahi phailte — sirf haath se (drag) resize hote hain */
      /* USOOL: lambai columns 1–6 se tay. Column 7 usi lambai mein mehdood
         rehta hai — uska baqi matn neeche wale khane mein chala jata hai.
         AHEM: khane ki unchai PUKHTA honi zaroori hai, warna system pehchan
         hi nahi pata ke matn zyada hai. */
      /* Khane ki unchai MUQARRAR — isi se (a) neeche wali lakeer se unchai
         badalti hai, aur (b) column 7 ka izafi matn neeche wale khane mein
         jata hai. Unchai aap khud drag kar ke badal sakte hain. */
      /* Unchai bhi matn ke hisab se. Muqarrar naap hata di gayi hai —
         qatar apne matn jitni hoti hai, phir _ch173StretchRow() usay safha
         bharne tak barha deta hai aur _ch173TrimRowGap() fazool jagah kaat
         deta hai. Yani "jitna mawad, utni lambai" — magar safha khali nahi
         rehta. (Officer phir bhi lakeer kheench kar apni naap le sakta hai.) */
      #ch173-doc .ch173-table tbody td{ height:auto;
        padding:0; overflow:visible; position:relative; vertical-align:top; }
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
      /* Naam aur CNIC do alag khane — saath saath.
         Naam NEECHE se shuru, CNIC OOPER se. */
      #ch173-doc .rotclip{ position:absolute; inset:0; overflow:hidden;
        display:flex; flex-direction:row; justify-content:center; align-items:stretch; }
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
      /* ── اختتامی خانہ ──
         Pehle yeh do alag column the (kaghaz dayen, SHO bayen), is liye SHO ki
         dono lines ke DARMIYAN ki jagah zaya jati thi. Ab SHO ki pehli line
         bayen kinare par "behti" hai aur kaghaz us ke ird-gird se guzar kar
         us ke NEECHE bhi chale jate hain — poori chaurai kaam mein aati hai.
         SHO ki doosri line tamam kaghazon ke neeche aati hai. */
      #ch173-doc .ch173-sho-flex{
        display:block; direction:rtl;
        margin-top:1.25em;      /* izafi matn aur تفصیل کاغذات ke darmiyan AIK satar */
      }
      #ch173-doc .ch173-sho-flex::after{ content:''; display:block; clear:both; }
      /* SHO ki lines ke OOPER ki jagah:
         • pehli line — ooper wali lakeer ke saath lagi hui (bilkul thori jagah)
         • doosri line — pehle 1.2cm thi, ab aadhi (0.6cm) */
      #ch173-doc .sho-b1{ float:left; margin-right:0.7cm; margin-top:0.1cm; }
      #ch173-doc .sho-b2{ clear:both; float:left; margin-top:1.4cm; }  /* dastkhat ke liye munasib fasla */
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
      /* تفصیل کاغذات — چیک لسٹ کھولنے والا چھوٹا بٹن (چھپائی میں نہیں آتا) */
      #ch173-doc .papers-pick{
        margin-right:6px; width:20px; height:20px; line-height:1; padding:0;
        border:1px solid var(--border,#999); border-radius:4px; vertical-align:middle;
        background:#eef6ff; color:#0369a1; cursor:pointer; font-size:12px;
        text-decoration:none; font-weight:400;
      }
      /* کرسر یہاں بلنک کرتا ہے — ڈیٹا عنوان کے نیچے سے شروع ہوتا ہے */
      /* AHEM — کاغذات ki tarteeb DAYEN se BAYEN.
         app-core.js ka aam qanoon is khane par 'unicode-bidi:plaintext' laga
         deta hai, jis ka matlab: satar ka rukh us ke PEHLE HARF se tay ho.
         Kaghazon ke saath tadaad ke angrezi hindse hone ki wajah se rukh ulat
         kar bayen-se-dayen ho gaya tha aur tarteeb ulti ho gayi thi. Yahan
         !important se rukh pakka RTL kar dete hain. */
      #ch173-doc .sho-papers-body{
        font-size:14pt; line-height:1.25; white-space:normal;
        text-align:justify; text-align-last:right;    /* kaghaz barabar phaile */
        direction:rtl !important; unicode-bidi:embed !important;
        outline:1px dashed rgba(120,120,120,0.35); padding:3px 4px; margin-top:4px;
        min-height:22px; overflow-wrap:break-word;
      }
      /* Har kaghaz apne andar bhi apna rukh sambhale */
      #ch173-doc .pp-item{ direction:rtl; unicode-bidi:isolate; }
      #ch173-doc .pp-name{ unicode-bidi:isolate; }
      #ch173-doc .sho-papers-body:empty::before{
        content:'یہاں کاغذات کی تفصیل لکھیں'; color:#bbb; font-size:12pt;
      }
      /* ── کاغذات: نام (انڈر لائن) + بالکل نیچے تعداد کا خانہ ──
         Kaghaz dayen se bayen aik ke baad aik lagte hain; darmiyan mein MS Word
         ke aik Tab (0.5in = 1.27cm) jitni jagah. Satar bhar jane par agla
         kaghaz KHUD nayi satar par chala jata hai (inline-block ka wrap). */
      #ch173-doc .pp-item{
        display:inline-flex; flex-direction:column; align-items:center;
        vertical-align:top; text-align:center;
        margin-left:0.635cm; margin-bottom:4px;  /* Tab = 4 spaces (1.27cm = 8) */
      }
      /* رزلٹ نمبری — naam ke saath usi satar mein (underline ke bagair) */
      #ch173-doc .pp-rno{ text-decoration:none; font-weight:normal; }
      #ch173-doc .pp-name{
        display:block; text-decoration:underline; white-space:nowrap;
        line-height:1.25;
      }
      /* Tadaad — har kaghaz ke bilkul neeche, IO khud likhta hai */
      /* Tadaad ka khana naam ke bilkul NEECHE, BEECH mein.
         'margin:0 auto' hi wo cheez hai jo isay beech mein laati hai —
         pehle yeh poori chaurai le kar aik taraf ho jata tha. */
      #ch173-doc .pp-qty{
        display:block; min-width:1.6em; margin:0 auto; box-sizing:border-box;
        min-height:1.15em; outline:none; padding:0;
        line-height:1.25; text-align:center !important;
        direction:ltr; unicode-bidi:isolate;      /* hindsa naam ke theek neeche beech mein */
      }
      #ch173-doc .pp-qty:empty::before{ content:'—'; color:#c9c9c9; }
      @media print{ #ch173-doc .pp-qty:empty::before{ content:''; } }

      /* بائیں کالم — SHO/تاریخ: ایک اوپر، ایک نیچے */
      /* SHO ka khana OOPER se shuru — pehli line تفصیل کاغذات ke khane ke
         bilkul barabar. Doosri line ki jagah JS naap kar tay karta hai
         (_ch173AlignSho) taake woh theek wahan se shuru ho jahan کاغذات ka
         aakhri hindsa khatam hota hai. */
      #ch173-doc .sho-cell{
        display:flex; flex-direction:column; justify-content:flex-start;
        min-height:42mm;
      }
      /* align-self:flex-end → RTL میں بائیں کنارے پر (جیسے اصل فارم میں) */
      #ch173-doc .sho-block{ align-self:flex-end; }
      /* SHO ki line ko aik satar neeche laane wali khali jagah */
      #ch173-doc .sho-spacer{ height:0; }   /* SHO ki pehli line ab ooper se barabar */
      #ch173-doc .sho-cell-row{
        outline:1px dashed rgba(120,120,120,0.35); padding:3px 6px; line-height:1.25;
        min-height:20px; margin:0; font-size:14pt; text-align:right; white-space:nowrap;
        font-weight:700;
      }
      /* تاریخ bold nahi — sirf SHO ki line.
         SHO ki line aur تاریخ ka darmiyani faasla kam rakha gaya hai
         (ooper wali padding ghata kar) — dono qareeb nazar aayen. */
      #ch173-doc .sho-cell-date{ font-weight:normal; font-size:14pt; color:#333;
        cursor:pointer; text-align:center;
        padding-top:0; margin-top:-3px; }
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
      /* USOOL: column 7 table ki lambai NAHI barhata — jo matn na samaye
         woh khud table ke neeche wale khane mein chala jata hai */
      /* Column 7 khane ke barabar — table ko lamba NAHI karta.
         Jo matn na samaye woh neeche wale khane mein chala jata hai. */
      #ch173-doc .ch173-table td.normcell{ padding:0; vertical-align:top;
        position:relative; overflow:hidden; }
      #ch173-doc .normwrap{
        position:absolute; inset:0;    /* khane ke barabar — table lamba nahi hota */
        padding:5px 5px 0 5px; box-sizing:border-box;   /* neeche ki padding 0 */
        font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
        direction:rtl; text-align:justify; text-align-last:right;
        outline:none; line-height:1.5; font-size:14pt;   /* satron ka fasla — 1.5 */
        overflow-wrap:break-word; word-wrap:break-word;
        overflow:hidden;   /* jo na samaye woh neeche wale khane mein jayega */
      }
      /* Har paragraph ki aakhri line bhi dayen (beech mein nahi) */
      #ch173-doc .normwrap p, #ch173-doc .normwrap div{ text-align:justify; text-align-last:right; }
      /* Paste kiya hua matn apna font saath na laye */
      #ch173-doc .normwrap *, #ch173-doc .ch173-cont *{
        font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif !important;
      }
      #ch173-doc .ch173-cont:empty::before{
        content:'تسلسل — جو تحریر اوپر خانوں میں نہ سما سکے وہ یہاں لکھیں';
        color:#aaa; font-size:12pt;
      }
      /* Table ke NEECHE tasalsul — table se BILKUL chipka hua (koi gap nahi) */
      #ch173-doc .ch173-cont{
        margin:0 !important; border:none !important; padding:0 5px !important;
        min-height:0; direction:rtl; text-align:justify; text-align-last:right;
        font-size:14pt; line-height:1.5; outline:none;   /* کالم 7 jaisa hi — 1.5 */
        overflow-wrap:break-word; word-wrap:break-word; white-space:pre-wrap;
      }
      #ch173-doc .ch173-cont:empty{ min-height:0; padding:0 !important; }
      /* ═══ فہرست گواہان — اخراج ka ALAG kaghaz ═══ */
      /* Satar 1 ke OOPER 0.25 inch ka hashiya */
      #ch173-doc .akh-gw-page{ direction:rtl; padding-top:0.25in; }
      /* Pehli satar: تھانہ dayen kinare se THEEK 1 INCH andar, ضلع bayen kinare par.
         Is ke aur agli satar (سرکار بذریعہ) ke darmiyan 0.4 inch ka faasla. */
      #ch173-doc .akh-gw-l1{
        display:flex; justify-content:space-between; align-items:baseline;
        padding-right:1in; margin-bottom:0.4in;
      }
      #ch173-doc .akh-gw-l1 .akh-gw-thana{ text-align:right; outline:none; }
      #ch173-doc .akh-gw-l1 .akh-gw-zila{ text-align:left; outline:none; }
      /* سرکار بذریعہ · مقدمہ نمبر… · بنام۔ — teenon satrein dayen border se 1.25 INCH */
      #ch173-doc .akh-gw-l2,
      #ch173-doc .akh-gw-l3,
      #ch173-doc .akh-gw-l4{
        text-align:right; text-align-last:right; outline:none;
        padding-right:1.25in; margin-bottom:8px; font-size:14pt;
      }
      /* Chauthi satar — beech mein, 20pt */
      #ch173-doc .akh-gw-title{
        text-align:center; font-size:20pt; font-weight:700;
        margin:18px 0 14px; text-decoration:underline;
      }
      /* گواہان — naam bhi dayen border se 1.25 INCH, aur 14pt */
      #ch173-doc .akh-gw-body{
        direction:rtl !important; outline:none;
        padding-right:1.25in; min-height:3em; margin-bottom:26px;
        font-size:14pt; line-height:1.9;
      }
      #ch173-doc .akh-gw-body:empty::before{
        content:'یہاں گواہان کی فہرست لکھیں'; color:#aaa;
      }
      @media print{ #ch173-doc .akh-gw-body:empty::before{ content:''; } }
      /* Aik گواہ = aik satar: naam DAYEN, CNIC apni ALAG field mein.
         Tamam CNIC aik hi SEEDH mein aur LTR — jaise چالان mein muqarrar hai. */
      #ch173-doc .akh-gw-body .gw-ln{
        display:flex; align-items:baseline; gap:10px; font-size:14pt;
      }
      #ch173-doc .akh-gw-body .gw-nm{ flex:1 1 auto; text-align:right; }
      #ch173-doc .akh-gw-body .gw-cn{
        flex:0 0 2.1in; width:2.1in;
        direction:ltr; unicode-bidi:isolate; text-align:left;
        font-family:'Segoe UI',Arial,sans-serif; font-size:12pt;
      }
      /* Aakhir mein SHO + تاریخ — bilkul چالان ke aakhir jaisa (bayen kinare par) */
      #ch173-doc .akh-gw-sho{ margin-top:34px; width:max-content; margin-left:0; margin-right:auto; }

      /* اخراج table — column 2 ki BAYEN lakeer ko kheenchne wala grip */
      #ch173-doc .akh-col2{ }
      #ch173-doc .akh-grip{
        position:absolute; left:-3px; top:0; width:7px; height:100%;
        cursor:col-resize; z-index:5; background:transparent;
      }
      #ch173-doc .akh-grip:hover{ background:rgba(3,105,161,.25); }
      /* Row 8 ki NEECHE wali lakeer — ooper neeche kheenchne wali patti */
      #ch173-doc .akh-hgrip{
        position:absolute; left:0; right:0; bottom:-3px; height:7px;
        cursor:row-resize; z-index:5; background:transparent;
      }
      #ch173-doc .akh-hgrip:hover{ background:rgba(3,105,161,.25); }

      /* ══ اخراج / عدم پتہ ki 3-column table — SIRF is table ke usool ══
         (چالان ki 7-column table in se bilkul mutasir nahi hoti) */

      /* SATRON ka fasla thora KHULA — pehle qatarein bahut chipki hui thin.
         مختصر حالات wale khane ko bhi wohi fasla (warna woh 1.5 par reh jata,
         kyunke us ka apna qanoon ooper likha hai). */
      #ch173-doc .ch173-akhraj-table td{ line-height:1.9; }
      /* ═══ Row 8 (مختصر حالات) — ooper neeche ki KHALI JAGAH khatam ═══
         AHEM: is jagah ki asal wajah 'line-height:1.9' thi. Aik satar ke
         matn par 1.9 ka matlab hai ke lafzon ke OOPER aur NEECHE takreeban
         9-9px khali chhor di jaye — yehi unwaan ke gird nazar aati thi.
         Sirf AAKHRI qatar par satar ka fasla tang kar dete hain (1.25), aur
         andar bahar ki tamam padding sifar. Qatarein 1-7 aur چالان ki table
         bilkul nahi chhirtin. */
      #ch173-doc .ch173-akhraj-table tbody tr:last-child td{
        line-height:1.25; padding-top:1px !important; padding-bottom:1px !important;
        vertical-align:middle;
      }
      #ch173-doc .ch173-akhraj-table tbody tr:last-child td.normcell{
        padding:0 !important;
      }
      /* Matn ka apna fasla — table ke NEECHE wale matn jaisa (1.5) */
      #ch173-doc .ch173-akhraj-table tbody tr:last-child td.normcell .normwrap{
        line-height:1.5; padding:0 4px 0 4px;
      }
      /* ── مثل باندھنے کی جگہ — دوسرے صفحے کے اوپر بائیں کونے میں مثلث ──
         Nok top-left kone par, dono lambe bazoo (top aur left margin ke saath)
         2-2 inch ke. Matn is se bach kar behta hai. Saath hi pehli satar ko
         ooper wale hashiye se aik satar ka fasla milta hai. */
      #ch173-doc .ch173-bind{
        float:left; width:2in; height:2in; margin-top:1.25em;
        shape-outside:polygon(0 0, 2in 0, 0 2in);
        -webkit-shape-outside:polygon(0 0, 2in 0, 0 2in);
        shape-margin:3mm; -webkit-shape-margin:3mm;
        clip-path:polygon(0 0, 2in 0, 0 2in);
      }
      /* Safhe ka tor — sirf chapai mein */
      #ch173-doc .ch173-pgbrk{ display:none; }
      @media print{
        #ch173-doc .ch173-pgbrk{
          display:block; height:0; margin:0; padding:0;
          break-before:page; page-break-before:always;
        }
      }
      /* Screen par yeh nishan nazar nahi aata — sirf chapai ke liye hai */
      #ch173-doc .ch173-bind, #ch173-doc .dio-bindgap{ display:none; }
      @media print{ #ch173-doc .ch173-bind, #ch173-doc .dio-bindgap{ display:block; } }
      /* CNIC ka APNA khana — naam se alag.
         • Naam  : NEECHE se OOPER (direction:rtl ke saath vertical-rl)
         • CNIC  : OOPER se NEECHE (direction:ltr)
         • Dono ke darmiyan 1.5cm ka fasla */
      /* Har khadi khane ka matn ooper se 1cm neeche shuru ho */
      #ch173-doc .rotinner{
        width:auto; max-width:100%; height:100%; box-sizing:border-box;
        writing-mode:vertical-rl; -webkit-writing-mode:vertical-rl;
        direction:rtl; outline:none; unicode-bidi:plaintext;
        line-height:1.2; white-space:pre; word-break:keep-all;
        overflow-wrap:normal; overflow:hidden; font-size:14pt;
        /* Khadi likhayi mein pehli qeemat OOPER/NEECHE ki jagah hai —
           isay kam rakha hai taake har record Row 2 ki lakeer se bilkul
           saath shuru ho (ooper-neeche fazool jagah na bane). */
        padding:1px 4px;
        /* HAR SATAR ka aaghaz OOPER (Row 2 wali lakeer) se.
           AHEM: yahan 'flex' HARGIZ na lagayen — khadi likhayi (vertical
           writing-mode) mein flex ka rukh ghair-yaqeeni hai, isi wajah se
           doosra/teesra naam aage-ooper khisak jata tha. Saada block mein
           har satar khud ooper se shuru hoti hai. */
        display:block; text-align:start;
      }
      /* CNIC — naam ke saath usi satar mein, magar OOPER se NEECHE parhi jaye
         aur numbers LTR (seedhi tarteeb) mein rahen.
         AHEM: yahan 'transform:rotate' HARGIZ na lagayen — transform sirf
         dikhawa ghumata hai, JAGAH nahi. Us se CNIC ka khaka chaurai wala hi
         rehta tha, jis se naam kinare par dhakel jata tha aur ooper-neeche
         fazool jagah ban jati thi. writing-mode + text-orientation se khaka
         bhi durust naapa jata hai (aur yeh Chrome mein chalta hai —
         'sideways-lr' sirf Firefox ka hai, woh nahi use karna). */
      #ch173-doc .rotinner .cn{
        writing-mode:vertical-rl; -webkit-writing-mode:vertical-rl;
        text-orientation:sideways; -webkit-text-orientation:sideways;
        direction:ltr; unicode-bidi:isolate; white-space:nowrap;
      }
      /* Har satar ka apna khana: NAAM shuru (ooper) — CNIC aakhir (neeche).
         Khadi likhayi mein 'inline-size' poori UNCHAI hoti hai, is liye
         100% dene se har satar poore khane jitni lambi ho jati hai aur
         'space-between' CNIC ko bilkul neeche le jata hai — chunanche
         tamam CNIC aik hi seedh mein aa jate hain (naam chhota ho ya bara). */
      #ch173-doc .rotinner .ln{
        display:flex; flex-direction:row; justify-content:space-between;
        align-items:flex-start; inline-size:100%; min-inline-size:0;
      }
      /* تتمہ چالان — CNIC nahi, is liye satar poori unchai na ghere,
         sirf naam jitni jagah le */
      #ch173-doc.tatima-doc .rotinner .ln,
      body.tatima-active #ch173-doc .rotinner .ln{
        inline-size:auto; justify-content:flex-start;
      }
      #ch173-doc .rotinner .nm{ flex:0 1 auto; min-inline-size:0; overflow:hidden; }
      #ch173-doc .rotinner .ln > .cn{ flex:0 0 auto; }
      /* CNIC ka apna khana — naam ke saath, OOPER se NEECHE parhi jaye,
         aur naam se 1.5cm ka fasla */
      /* Khaka print mein BHI aaye — pehle print par yeh chhupa diya jata
         tha, is liye khali CNIC ka khana bilkul khali chhap jata tha */
      /* CNIC — USI SATAR mein naam ke saath, 1.5cm ke fasle par.
         (Aik satar = naam + CNIC. Alag satar NAHI.) */
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
      /* Header ki unchai kam — pehle 150px thi jis se row 1-2 ke alfaz ke
         ooper-neeche kaafi khali jagah bach jati thi. (Haath se kheench kar
         bhi badal sakte hain.) */
      #ch173-doc th.vcell{ vertical-align:middle; padding:0; text-align:center; height:96px; }
      /* Header ki khadi likhayi — data khanon jaisa hi wrapper (Ascending) */
      /* مال قبضہ پولیس — lakeeron se hat kar, khane ke beech mein */
      #ch173-doc .rothead{ text-align:center !important;
        white-space:normal; padding:2px 4px; font-size:12pt; line-height:1.2; }

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
      /* USOOL: columns 1–6 neeche se BAND (lakeer), column 7 khula */
      #ch173-doc .ch173-table tbody td{ border-bottom:1px solid #000 !important; }
      #ch173-doc .ch173-table tbody td.normcell{ border-bottom:0 !important; }

      /* MS Word jaisi column resize — header par drag handle */
      #ch173-doc .colgrip{
        position:absolute; top:0; left:-3px; width:7px; height:100%;
        cursor:col-resize; user-select:none; z-index:5; touch-action:none;
      }
      @media (pointer:coarse){ #ch173-doc .colgrip{ left:-8px; width:16px; } }
      /* Neeche se unchai badalne wali grip (row height) */
      /* Neeche se unchai badalne wali grip — khane ke ANDAR (kabhi kat na jaye) */
      #ch173-doc .rowgrip{
        position:absolute; bottom:0; left:0; width:100%; height:12px;
        cursor:row-resize; user-select:none; z-index:20;
      }
      /* "ملزمان" ke NEECHE wali lakeer wali grip — khane ke OOPER kinare par */
      #ch173-doc .rowgrip-top{ top:0; bottom:auto; }
      #ch173-doc .rowgrip:hover{ background:rgba(56,189,248,0.45); }
      #ch173-doc .colgrip:hover{ background:rgba(56,189,248,0.35); }
`;
}
window._ch173CSS = _ch173CSS;




// کرسر کی جگہ پر متن ڈالو — ہر براؤزر میں قابلِ اعتبار
// (execCommand کبھی چلتا ہے کبھی نہیں، اس لیے Range سے کام لیتے ہیں)
function _ch173Insert(txt) {
  try {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const r = sel.getRangeAt(0);
    r.deleteContents();
    const node = document.createTextNode(txt);
    r.insertNode(node);
    r.setStartAfter(node);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
    try { _r173Dirty = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
}
window._ch173Insert = _ch173Insert;




// ═══ مدعی — ایک سطر: نمبر + نام + اُس کا CNIC (سب ساتھ) ═══
function _ch173MudaiLine(c) {
  c = c || {};
  const cross = (_ch173Version === 'cross_version');
  const nm = String((cross ? (c.cross_complainant || c.cross_complainant_name)
                           : (c.complainant || c.complainant_name)) || '').trim();
  if (!nm) return '';
  const cn = String((cross ? c.cross_complainant_cnic : c.complainant_cnic) || '').trim()
             || '00000-0000000-0';
  return nm + ' ' + cn;   // v558: مدعی ایک ہی — نمبر «1» نہیں
}
window._ch173MudaiLine = _ch173MudaiLine;

// پرانی محفوظ شدہ سطروں کی صفائی — جہاں <span class="cn"> کا کوڈ خود
// متن بن کر محفوظ ہو گیا تھا، اُسے ہٹا کر صرف نام + CNIC چھوڑ دو
// AHEM: yeh SIRF khadi likhayi wale khanon (naam + CNIC) ke liye hai.
// Yeh tamam </div> aur </span> hata deta hai — is liye ise کالم 7 (halaat)
// ya neeche wale "باقی متن" (cont_text) par KABHI na lagayen. Un khanon mein
// likhte/paste karte waqt browser khud <div>/<span> banata hai; band hone
// wale tags hatne se dhancha toot jata hai aur matn ka hissa CHHUP jata hai.
function _ch173StripSpan(html) {
  let t = String(html || '');
  // asal <span> tags (agar HTML ki shakl mein hon) → sirf saada matn (ek space)
  t = t.replace(/<span class="cn">(.*?)<\/span>/g, ' $1');
  // aur woh jo MATN ki tarah mehfooz ho gaye
  t = t.replace(/&lt;span class=&quot;cn&quot;&gt;/g, ' ').replace(/&lt;\/span&gt;/g, '');
  t = t.replace(/<span class="cn">/g, ' ').replace(/<\/span>/g, '');
  // Hifazat: agar kabhi satar wale khane (.ln/.nm) mehfooz ho jayen to
  // unhen wapas saada matn bana do (har khana = aik satar).
  t = t.replace(/<\/div>\s*<div class="ln">/g, '\n');
  t = t.replace(/<div class="ln">/g, '').replace(/<\/div>/g, '');
  t = t.replace(/<span class="nm">/g, '');
  // Purani mehfooz satron mein naam aur CNIC ke darmiyan TEEN space the
  // (bara khali fasla). Unhen kholte waqt aik space par le aate hain —
  // warna purane چالان mein purana chaura fasla hi nazar aata rehta hai.
  t = t.replace(/[ \t\u00A0]{2,}(?=\d{5}-\d{7}-\d)/g, ' ');
  return t;
}
window._ch173StripSpan = _ch173StripSpan;

// ═══ CNIC ko <span class="cn"> mein lapeto — SIRF dikhane ke liye ═══
// (Isi span par CSS se CNIC neeche-se-ooper LTR banti hai.)
// Yeh SIRF display ke liye hai — mehfooz karte waqt _ch173UnwrapCnics se
// wapas saada matn bana dete hain, taake data-base mein koi markup na jaye
// (pehle span ka code khud matn ban kar mehfooz ho jata tha — woh bug na aaye).
// CNIC ki pehchan — DONO shaklon mein:
//   • dashes ke saath : 00000-0000000-0
//   • baghair dashes  : 36302293139455
// (Kuch گواہان/ملزمان ka CNIC baghair dashes mehfooz hota hai, isi liye un
//  par seedh nahi lag rahi thi.) Satar ke AAKHIR wala number hi CNIC hai.
const _CH173_CNIC_LINE_RE = /^([\s\S]*?)[\s]*(\d[\d\u2010-\u2015-]{8,}\d)[\s]*$/;
// Khana "saada" hai? (officer ne apni formatting nahi lagayi)
// Sirf aisi soorat mein satren dobara tarteeb deni mehfooz hai — warna
// bold/italic wagera mit jayegi.
function _ch173PlainCell(cell) {
  const ok = { DIV: 1, SPAN: 1, BR: 1 };
  const els = cell.querySelectorAll('*');
  for (let i = 0; i < els.length; i++) {
    const e = els[i];
    if (!ok[e.tagName]) return false;
    if (e.tagName === 'DIV'  && !e.classList.contains('ln')) return false;
    if (e.tagName === 'SPAN' && !(e.classList.contains('cn') || e.classList.contains('nm'))) return false;
    if (e.getAttribute('style')) return false;      // koi apni sajawat lagi hai
  }
  return true;
}

// NOTE: pehle yahan "koi bina-lapeta CNIC to nahi?" wali jaanch thi jo
// purane (sirf dashes wale) namoone par chalti thi — isi liye baghair-dash
// wale CNIC par seedh nahi lagti thi. Ab us ki jagah 'nishani' (signature)
// ka tareeqa hai: matn badla ho to hi dobara tarteeb di jati hai.

// ═══ Har satar: NAAM ooper, CNIC neeche — sab CNIC aik SEEDH mein ═══
// Pehle CNIC wahin se shuru hota tha jahan naam khatam hota — naam chhote
// bare hone ki wajah se har CNIC alag jagah par aa jata tha (koi ooper, koi
// neeche) aur bhadda lagta tha. Ab har satar apne khane (.ln) mein hai
// jismein naam SHURU (ooper) aur CNIC AAKHIR (neeche) par jamta hai —
// is liye tamam CNIC aik hi seedh mein aate hain.
// ═══ Chapai ke liye NAAP ko PAKKA karna ═══
// Screen par khadi khanon ki naap 'percent' ki zanjeer se banti hai:
//   td (inline px) → .cellbox height:100% → .rotclip inset:0 → .rotinner
//   height:100% → .ln inline-size:100% → space-between se CNIC ka fasla.
// Chapai aik ALAG document mein hoti hai; wahan yeh zanjeer usi tarah nahi
// bandhti aur .ln apne matn jitni reh jati hai — chunanche NAAM aur CNIC ka
// fasla khatam ho kar dono aapas mein mil jate the (aur کالم 7 ka matn kat
// jata tha). Yahan naql lene se PEHLE har khane ki ASAL px naap inline likh
// dete hain (inline naap innerHTML ke saath chapai mein chali jati hai), aur
// naql ke foran baad _ch173UnbakeSizes se hata dete hain — screen par koi
// tabdeeli nazar nahi aati.
// AHEM: offsetHeight/offsetWidth istemal karte hain kyunki inhen safhe ka
// 'scale' (transform) nahi chhirta — getBoundingClientRect chhirta hai.
function _ch173BakeSizes() {
  const doc = _ch173Doc();
  const undo = [];
  if (!doc) return undo;
  const set = (el, prop, val) => {
    if (!el) return;
    undo.push([el, prop, el.style[prop]]);
    el.style[prop] = val;
  };
  // 1) Khadi khane (columns 1–6) — poori zanjeer ko pakki px naap.
  //    AHEM: clientHeight (offsetHeight NAHI) — 'absolute' khane ki naap khane
  //    ke PADDING-BOX se banti hai, aur offsetHeight mein lakeer (border) bhi
  //    shamil hoti hai. Us se har khana 2px bara ho kar matn phir kat jata.
  doc.querySelectorAll('.ch173-table .rotcell').forEach(td => {
    const h = td.clientHeight;
    if (!h) return;
    set(td.querySelector('.cellbox'), 'height', h + 'px');
    const clip = td.querySelector('.rotclip');
    set(clip, 'height', h + 'px');
    const inner = td.querySelector('.rotinner');
    if (!inner) return;
    const ih = inner.offsetHeight || h;
    set(inner, 'height', ih + 'px');
    // .ln ka 'inline-size' — khadi likhayi mein yehi UNCHAI hoti hai.
    // Isi par CNIC ka space-between wala fasla mabni hai.
    let padY = 0;
    try {
      const cs = getComputedStyle(inner);
      padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    const lnH = Math.max(0, ih - padY);
    if (lnH > 0) {
      inner.querySelectorAll('.ln').forEach(ln => {
        // تتمہ mein CNIC hota hi nahi — wahan satar apne matn jitni rehti hai
        if (!ln.querySelector('.cn')) return;
        set(ln, 'inlineSize', lnH + 'px');
      });
    }
  });
  // 2) کالم 7 (حالات) — 'inset:0' ki jagah pakki px naap, warna chapai mein
  //    khana bara/chhota ho kar matn kat jata tha. (اخراج ki row 8 bhi isi
  //    tarah kaam karti hai, is liye woh bhi shamil hai.)
  doc.querySelectorAll('.ch173-table td.normcell').forEach(td => {
    const h = td.clientHeight;
    const nw = td.querySelector('.normwrap');
    if (!nw || !h) return;
    set(nw, 'height', h + 'px');
  });
  return undo;
}
window._ch173BakeSizes = _ch173BakeSizes;

function _ch173UnbakeSizes(undo) {
  (undo || []).forEach(([el, prop, val]) => {
    try { el.style[prop] = val || ''; } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  });
}
window._ch173UnbakeSizes = _ch173UnbakeSizes;

function _ch173WrapCnics(root) {
  root = root || _ch173Doc();
  if (!root) return;
  const E = (t) => String(t == null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  root.querySelectorAll('.ch173-table td.rotcell .rotinner').forEach(cell => {
    if (document.activeElement === cell) return;      // likhte waqt haath na lagao
    if (!_ch173PlainCell(cell)) return;               // apni formatting mehfooz rahe
    const raw = (cell.innerText || '').replace(/\u00A0/g, ' ');
    // pehle se lapeta hua hai aur matn badla bhi nahi → dobara mehnat na karo
    if (cell.dataset.cnSig === raw && cell.querySelector('.ln')) return;
    if (!raw.trim()) return;
    const lines = raw.split(/\r?\n/);
    let found = false;
    // تتمہ چالان mein CNIC nahi dikhana — satar mein se aakhri CNIC hata kar
    // sirf naam rakho (CNIC ki khadi jagah bhi khatam ho jayegi).
    const tatima = (typeof _r173Type !== 'undefined' && _r173Type === 'tatima_challan');
    const html = lines.map(line => {
      const m = line.match(_CH173_CNIC_LINE_RE);
      if (tatima) {
        found = true;
        const naam = m ? m[1].trim() : line;         // CNIC hata do
        return '<div class="ln"><span class="nm">' + E(naam) + '</span></div>';
      }
      if (!m) return '<div class="ln">' + E(line) + '</div>';
      found = true;
      return '<div class="ln"><span class="nm">' + E(m[1].trim()) + '</span>' +
             '<span class="cn">' + E(m[2]) + '</span></div>';
    }).join('');
    if (!found) return;                               // koi CNIC hi nahi
    cell.innerHTML = html;
    try { cell.dataset.cnSig = cell.innerText; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  });
}
window._ch173WrapCnics = _ch173WrapCnics;

// Save se pehle sab lapet khol do — sirf SAADA matn mehfooz ho (markup nahi)
function _ch173UnwrapCnics(root) {
  root = root || _ch173Doc();
  if (!root) return;
  root.querySelectorAll('.ch173-table td.rotcell .rotinner').forEach(cell => {
    if (!cell.querySelector('.ln')) return;
    const lines = [...cell.querySelectorAll('.ln')].map(d => {
      const nm = d.querySelector('.nm'), cn = d.querySelector('.cn');
      if (nm || cn) {
        return ((nm ? nm.textContent : '').trim() + ' ' +
                (cn ? cn.textContent : '').trim()).trim();
      }
      return (d.textContent || '').trim();
    });
    cell.innerText = lines.join('\n');
    try { delete cell.dataset.cnSig; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }   // nishani mitao
  });
  // baqi kahin koi akela .cn reh gaya ho
  root.querySelectorAll('span.cn').forEach(sp => {
    sp.replaceWith(document.createTextNode(sp.textContent || ''));
  });
}
window._ch173UnwrapCnics = _ch173UnwrapCnics;
