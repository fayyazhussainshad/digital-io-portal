/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — CASES TAB
   Includes: cases list, add/edit modal, case workspace
             (FIR document editor), penal-code picker,
             delete confirmation.
   Loaded after app-core.js.
   ═══════════════════════════════════════════════════════════ */

// ── MISAL DOCUMENTS CHECKLIST (used by case add/edit form) ──
const ALL_MISAL_DOCS = [
  'FIR / ایف آئی آر',
  'Cross Version / کراس ورژن',
  'رپورٹ 173 ض ف',
  'جائے وقوعہ کا نقشہ',
  'نامزد ملزمان',
  'گواہان موقع',
  'گواہان کراس ورژن',
  'بیانات 161 ض ف',
  'واقعاتی رپورٹ',
  'فردات',
  'ضمنیات',
  'میمورنڈم',
  'CDR / IMEI',
  'سٹاف / ہمراہی ملازمان',
  'انڈیکس نقل مسل',
  'فارم گرفتاری',
  'فارم مفروری',
  'وارنٹ',
  'اشتہار',
  'پراگرس رپورٹ',
  'انکشافات',
  'درخواستیں',
  'بریف مقدمہ',
  'انسدادی کاروائی',
  'شہادتیں',
];

// Documents grouped by category (used by renderDocChecklist)
const MISAL_CHECKLIST = {
  'بنیادی دستاویزات': [
    'FIR / ایف آئی آر',
    'Cross Version / کراس ورژن',
    'رپورٹ 173 ض ف',
    'جائے وقوعہ کا نقشہ',
  ],
  'ملزمان و گواہان': [
    'نامزد ملزمان',
    'گواہان موقع',
    'گواہان کراس ورژن',
    'بیانات 161 ض ف',
  ],
  'رپورٹس و فردات': [
    'واقعاتی رپورٹ',
    'فردات',
    'ضمنیات',
    'میمورنڈم',
  ],
  'CDR و تجزیہ': [
    'CDR / IMEI',
  ],
  'فارمز و وارنٹ': [
    'سٹاف / ہمراہی ملازمان',
    'انڈیکس نقل مسل',
    'فارم گرفتاری',
    'فارم مفروری',
    'وارنٹ',
    'اشتہار',
  ],
  'دیگر دستاویزات': [
    'پراگرس رپورٹ',
    'انکشافات',
    'درخواستیں',
    'بریف مقدمہ',
    'انسدادی کاروائی',
    'شہادتیں',
  ],
};

// ── PENAL CODE DATABASE (used by the section picker in case form) ──
const PENAL_CODES = [
  // PPC — Pakistan Penal Code
  {s:'302',law:'PPC',title:'Qatl-i-Amd (Murder)',offence:'Murder',bail:'Non-Bailable',punishment:'Death or Life Imprisonment or 25 years + Diyat'},
  {s:'302-B',law:'PPC',title:'Qatl-i-Amd of Spouse',offence:'Murder of Spouse',bail:'Non-Bailable',punishment:'Death'},
  {s:'304',law:'PPC',title:'Qatl-i-Khata (Accidental Death)',offence:'Accidental Killing',bail:'Bailable',punishment:'Diyat'},
  {s:'307',law:'PPC',title:'Attempt to Commit Qatl-i-Amd',offence:'Attempted Murder',bail:'Non-Bailable',punishment:'Up to 14 years + Arsh or Daman'},
  {s:'311',law:'PPC',title:'Qatl Sababul-Amd',offence:'Death by Rash Act',bail:'Non-Bailable',punishment:'Diyat'},
  {s:'320',law:'PPC',title:'Qatl-i-Khata by Rash Driving',offence:'Rash Driving Causing Death',bail:'Bailable',punishment:'5 years'},
  {s:'322',law:'PPC',title:'Qatl bis-Sabab',offence:'Constructive Murder',bail:'Non-Bailable',punishment:'Diyat'},
  {s:'324',law:'PPC',title:'Attempt to Qatl',offence:'Attempt to Murder',bail:'Non-Bailable',punishment:'Up to 10 years'},
  {s:'326',law:'PPC',title:'Hurt by Firearm',offence:'Hurt by Firearm / Explosive',bail:'Non-Bailable',punishment:'Up to 14 years'},
  {s:'337-A',law:'PPC',title:'Shajjah (Head Injury)',offence:'Head/Face Injury',bail:'Bailable',punishment:'Arsh + imprisonment'},
  {s:'337-F',law:'PPC',title:'Jurh (Wound)',offence:'Wound/Injury',bail:'Bailable',punishment:'Arsh + Daman'},
  {s:'337-L',law:'PPC',title:'Hurt Causing Grievous Harm',offence:'Grievous Hurt',bail:'Non-Bailable',punishment:'Up to 10 years'},
  {s:'341',law:'PPC',title:'Wrongful Restraint',offence:'Wrongful Restraint',bail:'Bailable',punishment:'1 month or fine'},
  {s:'342',law:'PPC',title:'Wrongful Confinement',offence:'Wrongful Confinement',bail:'Bailable',punishment:'1 year or fine'},
  {s:'354',law:'PPC',title:'Assault / Criminal Force to Woman',offence:'Assault on Woman',bail:'Non-Bailable',punishment:'Up to 10 years'},
  {s:'354-A',law:'PPC',title:'Assault on Woman with Intent to Strip',offence:'Stripping/Assault on Woman',bail:'Non-Bailable',punishment:'Up to 7 years'},
  {s:'363',law:'PPC',title:'Kidnapping',offence:'Kidnapping',bail:'Non-Bailable',punishment:'Up to 7 years'},
  {s:'364',law:'PPC',title:'Kidnapping for Murder',offence:'Kidnapping for Murder',bail:'Non-Bailable',punishment:'Life imprisonment'},
  {s:'364-A',law:'PPC',title:'Kidnapping for Ransom',offence:'Kidnapping for Ransom',bail:'Non-Bailable',punishment:'Death or Life'},
  {s:'365',law:'PPC',title:'Kidnapping to Confine',offence:'Kidnapping to Confine Person',bail:'Non-Bailable',punishment:'Up to 7 years'},
  {s:'365-A',law:'PPC',title:'Kidnapping / Abduction for Extortion',offence:'Kidnapping for Extortion',bail:'Non-Bailable',punishment:'Death or Life'},
  {s:'365-B',law:'PPC',title:'Kidnapping / Abduction of Woman',offence:'Kidnapping of Woman',bail:'Non-Bailable',punishment:'Life imprisonment'},
  {s:'366',law:'PPC',title:'Kidnapping/Abduction of Woman to Compel Marriage',offence:'Abduction for Forced Marriage',bail:'Non-Bailable',punishment:'Up to 10 years'},
  {s:'376',law:'PPC',title:'Rape',offence:'Rape',bail:'Non-Bailable',punishment:'Death or 10-25 years'},
  {s:'377',law:'PPC',title:'Unnatural Offence',offence:'Unnatural Offence',bail:'Non-Bailable',punishment:'Life or up to 10 years'},
  {s:'379',law:'PPC',title:'Theft',offence:'Theft',bail:'Bailable',punishment:'Up to 3 years or fine'},
  {s:'380',law:'PPC',title:'Theft in Dwelling House',offence:'House Theft',bail:'Non-Bailable',punishment:'Up to 7 years'},
  {s:'381',law:'PPC',title:'Theft by Servant',offence:'Theft by Servant',bail:'Non-Bailable',punishment:'Up to 7 years'},
  {s:'382',law:'PPC',title:'Theft after Preparation to Cause Death',offence:'Theft with Violence',bail:'Non-Bailable',punishment:'Up to 10 years'},
  {s:'392',law:'PPC',title:'Robbery',offence:'Robbery',bail:'Non-Bailable',punishment:'Up to 10 years, or 14 years if at night'},
  {s:'393',law:'PPC',title:'Attempt to Commit Robbery',offence:'Attempted Robbery',bail:'Non-Bailable',punishment:'Up to 7 years'},
  {s:'394',law:'PPC',title:'Voluntarily Causing Hurt in Robbery',offence:'Robbery with Hurt',bail:'Non-Bailable',punishment:'Life or Up to 10 years'},
  {s:'395',law:'PPC',title:'Dacoity',offence:'Dacoity',bail:'Non-Bailable',punishment:'Life or Up to 10 years'},
  {s:'396',law:'PPC',title:'Dacoity with Murder',offence:'Dacoity with Murder',bail:'Non-Bailable',punishment:'Death'},
  {s:'397',law:'PPC',title:'Robbery with Firearm',offence:'Armed Robbery',bail:'Non-Bailable',punishment:'Up to 14 years'},
  {s:'399',law:'PPC',title:'Making Preparation for Dacoity',offence:'Preparation for Dacoity',bail:'Non-Bailable',punishment:'Up to 10 years'},
  {s:'400',law:'PPC',title:'Belonging to Gang of Dacoits',offence:'Gang Dacoity',bail:'Non-Bailable',punishment:'Life or Up to 10 years'},
  {s:'401',law:'PPC',title:'Belonging to Gang of Thieves',offence:'Gang Theft',bail:'Non-Bailable',punishment:'Up to 7 years'},
  {s:'406',law:'PPC',title:'Criminal Breach of Trust',offence:'Criminal Breach of Trust',bail:'Non-Bailable',punishment:'Up to 3 years or fine'},
  {s:'409',law:'PPC',title:'Criminal Breach of Trust by Public Servant',offence:'Breach of Trust (Public Servant)',bail:'Non-Bailable',punishment:'Life or Up to 10 years'},
  {s:'411',law:'PPC',title:'Receiving Stolen Property',offence:'Receiving Stolen Property',bail:'Bailable',punishment:'Up to 3 years or fine'},
  {s:'420',law:'PPC',title:'Cheating and Dishonestly Inducing',offence:'Cheating / Fraud',bail:'Non-Bailable',punishment:'Up to 7 years'},
  {s:'427',law:'PPC',title:'Mischief Causing Damage',offence:'Mischief / Property Damage',bail:'Bailable',punishment:'Up to 2 years or fine'},
  {s:'435',law:'PPC',title:'Mischief by Fire or Explosive',offence:'Arson / Explosive Mischief',bail:'Non-Bailable',punishment:'Up to 7 years'},
  {s:'436',law:'PPC',title:'Mischief by Fire to Destroy Building',offence:'Arson of Building',bail:'Non-Bailable',punishment:'Life or Up to 10 years'},
  {s:'448',law:'PPC',title:'Punishment for House Trespass',offence:'House Trespass',bail:'Bailable',punishment:'Up to 1 year or fine'},
  {s:'449',law:'PPC',title:'House Trespass to Commit Capital Offence',offence:'Trespass for Capital Offence',bail:'Non-Bailable',punishment:'Life'},
  {s:'452',law:'PPC',title:'House Trespass after Preparation for Hurt',offence:'Trespass with Intent to Hurt',bail:'Non-Bailable',punishment:'Up to 7 years'},
  {s:'454',law:'PPC',title:'Lurking House Trespass at Night',offence:'Night House Trespass',bail:'Non-Bailable',punishment:'Up to 3 years'},
  {s:'457',law:'PPC',title:'Lurking House Trespass to Commit Offence',offence:'Trespass to Commit Offence',bail:'Non-Bailable',punishment:'Up to 5 years'},
  {s:'458',law:'PPC',title:'Lurking Trespass after Preparation for Hurt',offence:'Trespass with Preparation to Hurt',bail:'Non-Bailable',punishment:'Up to 14 years'},
  {s:'460',law:'PPC',title:'All in House Liable When Death Occurs',offence:'Group Liability for Death',bail:'Non-Bailable',punishment:'Life or Death'},
  {s:'489-A',law:'PPC',title:'Counterfeiting Currency',offence:'Currency Counterfeiting',bail:'Non-Bailable',punishment:'Life or Up to 10 years'},
  {s:'489-F',law:'PPC',title:'Dishonestly Issuing a Cheque',offence:'Cheque Dishonour',bail:'Bailable',punishment:'Up to 3 years or fine'},
  {s:'499',law:'PPC',title:'Defamation',offence:'Defamation',bail:'Bailable',punishment:'Up to 2 years or fine'},
  {s:'506',law:'PPC',title:'Criminal Intimidation',offence:'Criminal Intimidation / Threats',bail:'Bailable',punishment:'Up to 2 years, or 7 years if life threat'},
  {s:'34',law:'PPC',title:'Acts Done by Several Persons in Furtherance of Common Intention',offence:'Common Intention',bail:'Depends on main offence',punishment:'Same as main offence'},
  {s:'109',law:'PPC',title:'Abetment',offence:'Abetment',bail:'Depends on offence abetted',punishment:'Same as abetted offence'},
  {s:'120-B',law:'PPC',title:'Criminal Conspiracy',offence:'Criminal Conspiracy',bail:'Non-Bailable',punishment:'Same as conspiracy offence'},
  {s:'147',law:'PPC',title:'Rioting',offence:'Rioting',bail:'Bailable',punishment:'Up to 2 years or fine'},
  {s:'148',law:'PPC',title:'Rioting Armed with Deadly Weapon',offence:'Armed Rioting',bail:'Non-Bailable',punishment:'Up to 3 years or fine'},
  {s:'149',law:'PPC',title:'Member of Unlawful Assembly',offence:'Unlawful Assembly',bail:'Bailable',punishment:'Same as rioting'},
  // CrPC
  {s:'54',law:'CrPC',title:'Arrest Without Warrant',offence:'Preventive Arrest',bail:'Bailable',punishment:'Procedure'},
  {s:'107',law:'CrPC',title:'Security for Keeping Peace',offence:'Breach of Peace',bail:'Bailable',punishment:'Bond/Security'},
  {s:'151',law:'CrPC',title:'Arrest to Prevent Cognizable Offence',offence:'Preventive Arrest',bail:'Bailable',punishment:'Procedure'},
  // Arms Ordinance
  {s:'13',law:'Arms Ord.',title:'Possession of Prohibited Bore',offence:'Illegal Weapon (Prohibited Bore)',bail:'Non-Bailable',punishment:'Up to 7 years'},
  {s:'13-A',law:'Arms Ord.',title:'Use of Prohibited Bore',offence:'Use of Illegal Weapon',bail:'Non-Bailable',punishment:'Death or Life'},
  {s:'15',law:'Arms Ord.',title:'Possession Without License',offence:'Unlicensed Weapon Possession',bail:'Bailable',punishment:'Up to 3 years or fine'},
  // CNSA
  {s:'9',law:'CNSA',title:'Trafficking Narcotics',offence:'Drug Trafficking',bail:'Non-Bailable',punishment:'Death or Life'},
  {s:'9-C',law:'CNSA',title:'Possession of Narcotics',offence:'Drug Possession',bail:'Non-Bailable',punishment:'Up to 2 years or fine (small qty) to Life (large qty)'},
  {s:'10',law:'CNSA',title:'Financing Narcotics',offence:'Drug Financing',bail:'Non-Bailable',punishment:'Death or Life'},
  // ATA
  {s:'6',law:'ATA',title:'Terrorism',offence:'Terrorist Act',bail:'Non-Bailable',punishment:'Death or Life'},
  {s:'7',law:'ATA',title:'Punishment for Terrorism',offence:'Acts of Terrorism',bail:'Non-Bailable',punishment:'Death'},
  {s:'11-N',law:'ATA',title:'Membership of Terrorist Organization',offence:'Terrorist Organization Membership',bail:'Non-Bailable',punishment:'Up to 10 years'},
  // Electricity
  {s:'39',law:'Electricity Act',title:'Theft of Electricity',offence:'Electricity Theft',bail:'Bailable',punishment:'Up to 3 years or fine'},
  // Prohibition
  {s:'3',law:'Prohibition Act',title:'Manufacture of Liquor',offence:'Liquor Manufacturing',bail:'Non-Bailable',punishment:'Up to 5 years'},
  {s:'4',law:'Prohibition Act',title:'Possession of Liquor',offence:'Liquor Possession',bail:'Bailable',punishment:'Up to 1 year or fine'},
];


// ── CASES LIST ──
registerPage('cases',renderCases);
let _casesCache = []; // cleared on every render — no stale data
/* ───────────────────────────────────────────────────────────────
   FILTER ki halat — safhe ke sath YAAD rehti hai.

   MASLA jo theek kiya gaya:
   1) `data-api.js` ka background refresh `renderCases(c)` ko BINA
      daleel bulata tha. Us se har chand second baad filter khud-ba-khud
      saaf ho jata tha — afsar "زیر تفتیش" chunta tha aur thoRi der
      baad phir se saare mocaddme aa jate the.
   2) Talaash ke khane ka `oninput` poore safhe ko dobara banata tha,
      is liye do-teen huroof ke baad cursor khane se nikal jata tha
      aur aage likha hi nahi ja sakta tha.

   Hal: halat yahan mehfooz hai. Daleel na di jaye to WAHI halat chalti
   hai (saaf nahi hoti), aur talaash/filter sirf TABLE ki qatarein
   badalte hain — khana jyun ka tyun rehta hai, cursor bhi.
   ─────────────────────────────────────────────────────────────── */
window._csFilter = window._csFilter || { status:'', query:'', station:'' };

// Sirf qatarein dobara banao — khana aur cursor ko haath na lagao
async function _csRefreshRows(){
  const tb = document.getElementById('cs-rows');
  if (!tb) return;
  const f = window._csFilter;
  const o = currentOfficer||{};
  let all = await getCases(f.status, f.query);
  all.sort((a,b)=>{
    const na=parseInt(String(a.fir_number||'0').split('/')[0])||0;
    const nb=parseInt(String(b.fir_number||'0').split('/')[0])||0;
    return nb-na;
  });
  _casesCache = all;
  const rows = f.station ? all.filter(c=>(c.case_station||o.station)==f.station) : all;
  tb.innerHTML = rows.length
    ? rows.map((c,i)=>renderCaseRow(c,i+1)).join('')
    : `<tr><td colspan="10" style="padding:0;">${
        (window.DIO && DIO.states)
          ? DIO.states.empty('folder', 'کوئی مقدمہ نہیں', (f.query||f.status)
              ? 'اس چھان سے کوئی مقدمہ نہیں ملا — لفظ یا صورتحال بدل کر دیکھیں'
              : 'نیا مقدمہ درج کرنے کے لیے "+ نیا اندراج" پر دبائیں')
          : '<div style="text-align:center;padding:30px;color:var(--text-muted);">کوئی مقدمہ نہیں</div>'
      }</td></tr>`;
  const cnt = document.getElementById('cs-count');
  if (cnt) cnt.textContent = rows.length;
}
window._csRefreshRows = _csRefreshRows;

function _csOnSearch(v){
  window._csFilter.query = String(v||'').trim();
  clearTimeout(window._csTmr);
  window._csTmr = setTimeout(_csRefreshRows, 280);
}
window._csOnSearch = _csOnSearch;

function _csOnStatus(v){
  window._csFilter.status = String(v||'');
  _csRefreshRows();
}
window._csOnStatus = _csOnStatus;

async function renderCases(container,fStatus,fQuery,fStation){
  // Daleel na di jaye to PICHHLI halat chalti rahe (background refresh
  // yahan bina daleel aata hai — pehle wo filter saaf kar deta tha).
  const _f = window._csFilter;
  fStatus  = (fStatus  === undefined || fStatus  === null) ? _f.status  : fStatus;
  fQuery   = (fQuery   === undefined || fQuery   === null) ? _f.query   : fQuery;
  fStation = (fStation === undefined || fStation === null) ? _f.station : fStation;
  fStatus=fStatus||'';fQuery=fQuery||'';fStation=fStation||'';
  window._csFilter = { status:fStatus, query:fQuery, station:fStation };
  _casesCache = [];
  const allCases=await getCases(fStatus,fQuery);
  // Sort by FIR number — bigger number first (numeric, not text)
  allCases.sort((a,b) => {
    const na = parseInt(String(a.fir_number||'0').split('/')[0]) || 0;
    const nb = parseInt(String(b.fir_number||'0').split('/')[0]) || 0;
    return nb - na;
  });
  _casesCache=allCases;
  const o=currentOfficer||{};

  // Get unique stations from cases (for folder view)
  const stations=[...new Set(allCases.map(c=>c.case_station||o.station||'—').filter(Boolean))].sort();
  const cases = fStation ? allCases.filter(c=>(c.case_station||o.station)==fStation) : allCases;
  const currentStation = o.station||'—';
  const isArchiveView = fStation && fStation !== currentStation;

  container.innerHTML=`
  <div class="page-header">
    <button class="btn btn-primary dio-add-btn" onclick="openAddCaseModal()">+ نیا اندراج</button>
    <div>
      <div class="page-title">میرے مقدمات</div>
      <div class="page-subtitle"><span id="cs-count">${cases.length}</span> مقدمات${isArchiveView?' · '+fStation+' آرکائیو':''}</div>
    </div>
  </div>

  <!-- Station filter buttons removed (FIX6) — all cases shown by default for more space -->
  ${isArchiveView?`<div style="background:rgba(167,139,250,0.1);border:1px solid #a78bfa;border-radius:8px;padding:8px 14px;margin-bottom:10px;font-size:12px;color:#a78bfa;direction:rtl;">آرکائیو — تھانہ ${fStation} کے پرانے مقدمات (صرف دیکھنے کے لیے)</div>`:''}

  <div style="display:flex;gap:8px;direction:rtl;flex-wrap:wrap;margin-bottom:14px;">
    <input class="search-input" id="case-search" style="flex:1;min-width:180px;" placeholder="مقدمہ نمبر، مدعی، شناختی کارڈ، دفعہ…" value="${fQuery}" oninput="_csOnSearch(this.value)" dir="rtl">
    <select class="filter-select" id="case-status-filter" onchange="_csOnStatus(this.value)">
      <option value="" ${!fStatus?'selected':''}>تمام صورتحال</option>
      ${(window.DIO && DIO.caseStatuses)
        ? DIO.caseStatuses.toOptions(fStatus)
        : `<option value="under"      ${fStatus==='under'?'selected':''}>زیر تفتیش</option>
           <option value="complete"   ${fStatus==='complete'?'selected':''}>چالان مکمل</option>
           <option value="incomplete" ${fStatus==='incomplete'?'selected':''}>چالان نامکمل</option>
           <option value="challan512" ${fStatus==='challan512'?'selected':''}>چالان 512</option>
           <option value="untrace"    ${fStatus==='untrace'?'selected':''}>عدم پتہ</option>
           <option value="cancel"     ${fStatus==='cancel'?'selected':''}>اخراج</option>`}
    </select>
  </div>
  <div class="card" style="padding:0;overflow:hidden;">
    <div style="overflow-x:auto;">
      <table class="data-table" style="width:100%;min-width:900px;">
        <thead><tr>
          <th style="width:44px;text-align:center;">#</th>
          <th>مقدمہ نمبر</th>
          <th>تاریخ اندراج</th>
          <th>تاریخ وقوعہ</th>
          <th>دفعہ قانون</th>
          <th>تھانہ</th>
          <th>مدعی</th>
          <th>شناختی کارڈ / موبائل</th>
          <th>صورتحال</th>
          <th style="text-align:center;">اقدامات</th>
        </tr></thead>
        <tbody id="cs-rows">
          ${cases.length ? cases.map((c,i)=>renderCaseRow(c,i+1)).join('')
            : `<tr><td colspan="10" style="padding:0;">${
                (window.DIO && DIO.states)
                  ? DIO.states.empty('folder', 'کوئی مقدمہ نہیں', fQuery
                      ? 'اس تلاش سے کوئی مقدمہ نہیں ملا — لفظ بدل کر کوشش کریں'
                      : 'نیا مقدمہ درج کرنے کے لیے اوپر "+ نیا اندراج" پر دبائیں')
                  : `<div style="text-align:center;padding:30px;color:var(--text-muted);">کوئی مقدمہ نہیں</div>`
              }</td></tr>`}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderCaseRow(c,sn){
  const station=c.case_station||(currentOfficer&&currentOfficer.station)||'—';
  const offence=[c.section_of_law,c.offence_type].filter(Boolean).join(' / ')||'—';
  const cnic=formatCNIC(c.complainant_cnic)||'—';
  const cell=formatCell(c.complainant_cell)||'—';
  return `<tr>
    <td style="text-align:center;font-size:11px;color:var(--text-muted);font-weight:700;">${sn}</td>
    <td>
      ${(() => { const fn=c.fir_number||'—'; const p=String(fn).split('/'); return p.length===2 ? `<span style="cursor:pointer;" onclick="openCaseWorkspace('${c.id}')" title="Open Case Workspace"><span dir="ltr" style="unicode-bidi:isolate;font-family:var(--font-mono);font-weight:800;color:var(--accent);font-size:15px;display:block;line-height:1.1;text-decoration:underline;text-decoration-color:rgba(56,189,248,0.4);">${p[0]}</span><span dir="ltr" style="unicode-bidi:isolate;font-family:var(--font-mono);font-size:10px;color:var(--text-muted);display:block;line-height:1;">/${p[1]}</span></span>` : `<span dir="ltr" style="unicode-bidi:isolate;font-family:var(--font-mono);font-weight:800;color:var(--accent);font-size:12px;cursor:pointer;text-decoration:underline;text-decoration-color:rgba(56,189,248,0.4);" onclick="openCaseWorkspace('${c.id}')" title="Open Case Workspace">${fn}</span>`; })()}
      ${c.priority ? `<br><span style="font-size:9px;font-weight:700;color:${c.priority==='high'?'var(--red)':c.priority==='medium'?'var(--amber)':'var(--green)'};">${c.priority==='high'?'اہم':c.priority==='medium'?'درمیانہ':'کم'}</span>` : ''}
      ${c.is_cross_version?'<br><span style="font-size:9px;color:var(--red);font-weight:600;">کراس ورژن</span>':''}
      ${c._shared?`<br><span style="font-size:9px;color:var(--accent);font-weight:600;" title="آپ کے ساتھ شیئر کیا گیا (${c._sharePermission==='write'?'ترمیم':'دیکھیں'})">شیئرڈ</span>`:''}
    </td>
    <td style="font-size:11px;white-space:nowrap;">${formatDate(c.fir_date)}</td>
    <td style="font-size:11px;white-space:nowrap;">${formatDate(c.occurrence_date)}</td>
    <td style="font-size:11px;max-width:150px;">${esc(offence)}</td>
    <td style="font-size:11px;">${esc(station)}</td>
    <td style="font-size:12px;font-weight:500;">${esc(c.complainant)||'—'}</td>
    <td style="font-family:var(--font-mono);font-size:11px;white-space:nowrap;" dir="ltr"><span>${cnic}</span> <span style="color:var(--text-muted);">·</span> <span>${cell}</span></td>
    <td><span class="pill ${STATUS_CLASSES[c.status]||'pill-blue'}">${STATUS_LABELS[c.status]||c.status}</span></td>
    <td>
      <div style="display:flex;gap:2px;direction:rtl;justify-content:center;flex-direction:row-reverse;">
        <button aria-label="مقدمہ کھولیں" class="btn btn-secondary btn-sm" onclick="openCaseWorkspace('${c.id}')" title="مقدمہ کھولیں"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M6.5 3.5h7l4.5 4.5V20.5h-11.5z"/><path d="M13.5 3.5V8H18"/></svg></button>
        <button aria-label="ترمیم" class="btn btn-secondary btn-sm" onclick="openEditCaseModal('${c.id}')" title="ترمیم"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M4 20h4L18 10l-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg></button>
        <button aria-label="ڈاؤنلوڈ" class="btn btn-secondary btn-sm" onclick="downloadCaseFile('${c.id}')" title="ڈاؤنلوڈ"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M12 3.5v11"/><path d="M7.5 10.5L12 15l4.5-4.5"/><path d="M4.5 20h15"/></svg></button>
        <button aria-label="شیئر" class="btn btn-primary   btn-sm" onclick="openShareModal('${c.id}')"    title="شیئر"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M12 15V3.5"/><path d="M7.5 8L12 3.5 16.5 8"/><path d="M4.5 13.5V20h15v-6.5"/></svg></button>
        <button aria-label="حذف" class="btn btn-danger    btn-sm" onclick="confirmDeleteCase('${c.id}','${c.fir_number||'?'}')" title="حذف"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/></svg></button>
      </div>
    </td>
  </tr>`;
}

// ── DIRECT FIR PRINT ─────────────────────────────────────────
async function downloadCaseFile(id) {
  const c = _casesCache.find(x=>x.id===id) || await getCase(id);
  if (!c) { showToast('Case not found','error'); return; }

  openModal('Case File Download — FIR ' + (c.fir_number||''),
    `<div style="display:flex;flex-direction:column;gap:12px;padding:10px 0;">
      <div style="font-size:13px;color:var(--text-secondary);text-align:center;margin-bottom:4px;">FIR ${esc(c.fir_number)||'—'} · ${esc(c.complainant)||'—'}</div>
      <button class="btn btn-primary" style="padding:14px;font-size:14px;" onclick="closeModal();_downloadCaseTxt('${id}')">
        Text File Download کریں (.txt)
      </button>
      <button class="btn btn-secondary" style="padding:14px;font-size:14px;" onclick="closeModal();_downloadCaseHTML('${id}')">
        HTML File Download کریں (Print → PDF)
      </button>
      <div style="font-size:10px;color:var(--text-faint);text-align:center;">PDF کے لیے: HTML کھولیں → Ctrl+P → Save as PDF</div>
    </div>`,
    `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>`
  );
}

async function _downloadCaseTxt(id) {
  const c = _casesCache.find(x=>x.id===id) || await getCase(id);
  if (!c) return;
  const o = currentOfficer || {};
  let txt = '══════════════════════════════════\n';
  txt += '      \n';
  txt += `      تھانہ ${o.station||'—'} ضلع ${o.district||'—'}\n`;
  txt += '══════════════════════════════════\n\n';
  txt += `مقدمہ نمبر:        ${c.fir_number||'—'}\n`;
  txt += `تاریخ اندراج:      ${formatDate(c.fir_date)}\n`;
  txt += `تاریخ وقوعہ:       ${formatDate(c.occurrence_date)}\n`;
  txt += `دفعات:             ${c.section_of_law||'—'}\n`;
  txt += `جرم:               ${c.offence_type||'—'}\n`;
  txt += `صورتحال:           ${STATUS_LABELS[c.status]||c.status}\n`;
  txt += `\n── مدعی ──────────────────────────\n`;
  txt += `نام:               ${c.complainant||'—'}\n`;
  txt += `شناختی کارڈ:       ${c.complainant_cnic||'—'}\n`;
  txt += `موبائل:            ${c.complainant_cell||'—'}\n`;
  txt += `پیشہ:              ${c.complainant_profession||'—'}\n`;
  txt += `\n── رپورٹنگ افسر ──────────────────\n`;
  txt += `نام:               ${o.full_name||'—'}\n`;
  txt += `عہدہ:              ${o.designation||'—'}\n`;
  txt += `تھانہ:             ${o.station||'—'}\n`;
  txt += `\nتاریخ پرنٹ: ${formatDate(new Date())}\n`;
  txt += '══════════════════════════════════\n';
  txt += '         Digital IO\n';
  txt += '══════════════════════════════════\n';

  const blob = new Blob([txt], {type:'text/plain;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Case-FIR-${c.fir_number||'file'}-${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  showToast('File Download ہو رہی ہے','success');
}

async function _downloadCaseHTML(id) {
  const c = _casesCache.find(x=>x.id===id) || await getCase(id);
  if (!c) return;
  const o = currentOfficer || {};
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    ${typeof dioFontHead==='function'?dioFontHead():''}
  <title>FIR ${c.fir_number||''}</title>
  <style>
    body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',Arial,sans-serif;direction:rtl;margin:30px;color:#111;font-size:14px;}
    h2,h3{text-align:center;} .row{display:flex;gap:20px;margin-bottom:8px;}
    .lbl{color:#555;min-width:140px;font-weight:600;} .val{flex:1;}
    .sec{border-top:1px solid #ccc;margin:16px 0 8px;padding-top:8px;font-weight:700;color:var(--text-primary);}
    .footer{text-align:left;font-size:11px;color:#888;margin-top:40px;border-top:1px solid #ccc;padding-top:10px;direction:ltr;}
    @media print{body{margin:15mm;}}
  </style></head><body>
  <h2></h2>
  <h3>تھانہ ${o.station||'—'} ضلع ${o.district||'—'}</h3>
  <hr>
  <div class="row"><span class="lbl">مقدمہ نمبر:</span><span class="val"><b>${c.fir_number||'—'}</b></span></div>
  <div class="row"><span class="lbl">تاریخ اندراج:</span><span class="val">${formatDate(c.fir_date)}</span></div>
  <div class="row"><span class="lbl">تاریخ وقوعہ:</span><span class="val">${formatDate(c.occurrence_date)}</span></div>
  <div class="row"><span class="lbl">دفعات:</span><span class="val">${esc(c.section_of_law)||'—'}</span></div>
  <div class="row"><span class="lbl">جرم:</span><span class="val">${esc(c.offence_type)||'—'}</span></div>
  <div class="row"><span class="lbl">صورتحال:</span><span class="val">${STATUS_LABELS[c.status]||c.status}</span></div>
  <div class="sec">مدعی کی تفصیل</div>
  <div class="row"><span class="lbl">نام:</span><span class="val">${esc(c.complainant)||'—'}</span></div>
  <div class="row"><span class="lbl">شناختی کارڈ:</span><span class="val">${esc(c.complainant_cnic)||'—'}</span></div>
  <div class="row"><span class="lbl">موبائل:</span><span class="val">${esc(c.complainant_cell)||'—'}</span></div>
  <div class="row"><span class="lbl">پیشہ:</span><span class="val">${esc(c.complainant_profession)||'—'}</span></div>
  <div class="sec">رپورٹنگ افسر</div>
  <div class="row"><span class="lbl">نام:</span><span class="val">${esc(o.full_name||'—')}</span></div>
  <div class="row"><span class="lbl">عہدہ:</span><span class="val">${esc(o.designation||'—')}</span></div>
  <div class="row"><span class="lbl">تھانہ:</span><span class="val">${o.station||'—'}</span></div>
  <div style="margin-top:50px;display:flex;justify-content:space-between;">
    <div style="text-align:center;"><div style="border-top:1px solid #333;width:200px;padding-top:6px;">دستخط رپورٹنگ افسر</div></div>
    <div style="text-align:center;"><div style="border-top:1px solid #333;width:220px;padding-top:6px;">${esc((typeof getSHOSignLine==='function') ? getSHOSignLine(o.station||'') : '')}<div style="font-size:11pt;margin-top:0;">${esc(formatDate(new Date()))}</div></div></div>
  </div>
  <div class="footer">Digital IO</div>
  </body></html>`;

  const blob = new Blob([html], {type:'text/html;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Case-FIR-${c.fir_number||'file'}-${new Date().toISOString().slice(0,10)}.html`;
  a.click();
  showToast('HTML file download ہوئی — browser میں کھولیں، Ctrl+P سے PDF بنائیں','success');
}

// ── SHARE CASE ──
async function openShareModal(id){
  const c=_casesCache.find(x=>x.id===id)||await getCase(id);
  if(!c){showToast('Case not found','error');return;}
  const o=currentOfficer||{};
  const station=c.case_station||o.station||'—';
  const offence=[c.section_of_law,c.offence_type].filter(Boolean).join(' / ')||'—';
  const lines=[
    'CASE FILE — Digital IO Police Portal',
    '─────────────────────────────────',
    `تھانہ (Station):      ${station}`,
    `مقدمہ نمبر (FIR No):  ${c.fir_number||'—'}`,
    `تاریخ FIR (Date):     ${formatDate(c.fir_date)}`,
    `تاریخ وقوعہ (Occ.):  ${formatDate(c.occurrence_date)}`,
    `جرم (Offence):        ${offence}`,
    `مدعی (Complainant):   ${c.complainant||'—'}`,
    `CNIC:                 ${c.complainant_cnic||'—'}`,
    `رابطہ (Cell):         ${c.complainant_cell||'—'}`,
    `حالت (Status):        ${STATUS_LABELS[c.status]||c.status}`,
    '─────────────────────────────────',
    `تفتیشی آفیسر (IO):   ${o.full_name||''}`,
    `عہدہ (Rank):          ${o.designation||''} — ${station}`,
  ];
  const text=lines.join('\n');
  const enc=encodeURIComponent(text);
  const sub=encodeURIComponent(`Case File — FIR ${c.fir_number}`);
  openModal(`Share Case — FIR ${c.fir_number||''}`,
    `<div style="margin-bottom:14px;background:var(--bg-tertiary);border-radius:8px;padding:12px;font-size:10.5px;color:var(--text-secondary);font-family:var(--font-mono);white-space:pre;line-height:1.7;max-height:180px;overflow-y:auto;">${text}</div>
     <div style="display:flex;gap:10px;direction:rtl;justify-content:center;flex-wrap:wrap;">
       <a href="https://wa.me/?text=${enc}" target="_blank" rel="noopener"
          style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:8px;background:#25D366;color:#fff;font-weight:700;font-size:13px;text-decoration:none;">
         وٹس ایپ پر بھیجیں
       </a>
       <a href="mailto:?subject=${sub}&body=${enc}"
          style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:8px;background:var(--accent-dark);color:#fff;font-weight:700;font-size:13px;text-decoration:none;">
         ای میل سے بھیجیں
       </a>
     </div>
     <div style="margin-top:10px;font-size:10px;color:var(--text-muted);text-align:center;">WhatsApp opens in a new tab · Email opens your default email app</div>`,
    `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">بند کریں</button>`);
}


// ── CASE FORM (add/edit) ──
function toggleDoc(doc, row) {
  const cb = row.querySelector('input[type=checkbox]');
  const span = row.querySelector('span');
  if (selectedDocuments.includes(doc)) {
    selectedDocuments = selectedDocuments.filter(d => d !== doc);
    if (cb) cb.checked = false;
    if (span) span.style.color = 'var(--text-secondary)';
  } else {
    selectedDocuments.push(doc);
    if (cb) cb.checked = true;
    if (span) span.style.color = 'var(--accent)';
  }
  // Update count
  const countEl = document.querySelector('#doc-checklist').previousElementSibling?.previousElementSibling?.previousElementSibling?.querySelector('span:last-child');
  const parent = document.getElementById('doc-checklist')?.closest('div[style*="border-radius"]');
  if (parent) { const cnt = parent.querySelector('span[style*="text-faint"]'); if (cnt) cnt.textContent = selectedDocuments.length + ' selected'; }
}

function removeCustomDoc(doc) {
  selectedDocuments = selectedDocuments.filter(d => d !== doc);
  const el = document.getElementById('doc-checklist');
  if (el) el.innerHTML = renderDocChecklist(ALL_MISAL_DOCS, selectedDocuments);
}

function searchPenalCodes(query) {
  const dd = document.getElementById('section-dropdown');
  if (!query || query.length < 1) { dd.style.display = 'none'; return; }
  const q = query.toLowerCase().trim();
  const results = PENAL_CODES.filter(p =>
    p.s.toLowerCase().includes(q) ||
    p.title.toLowerCase().includes(q) ||
    p.offence.toLowerCase().includes(q) ||
    p.law.toLowerCase().includes(q)
  ).slice(0, 10);

  if (!results.length) { dd.style.display = 'none'; return; }

  dd.style.display = 'block';
  dd.innerHTML = results.map(p => `
    <div onclick="addSection('${p.s} ${p.law}','${p.offence}','${p.bail}')" style="padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border-light);transition:background 0.1s;" onmouseenter="this.style.background='var(--hover-bg)'" onmouseleave="this.style.background=''">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <span style="font-size:13px;font-weight:700;color:var(--accent);">§ ${p.s} ${p.law}</span>
          <span style="font-size:11px;color:var(--text-secondary);margin-left:8px;">${p.title}</span>
        </div>
        <span style="font-size:9px;padding:2px 7px;border-radius:10px;background:${p.bail==='Non-Bailable'?'var(--red-bg)':'var(--green-bg)'};color:${p.bail==='Non-Bailable'?'var(--red)':'var(--green)'};">${p.bail}</span>
      </div>
      <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">Offence: ${p.offence} · ${p.punishment}</div>
    </div>`).join('');
}

function addSection(sectionStr, offence, bail) {
  if (selectedSections.includes(sectionStr)) {
    showToast('Section already added.', 'error'); return;
  }
  selectedSections.push(sectionStr);

  // Update hidden input
  document.getElementById('cf-section').value = selectedSections.join(' + ');

  // Update offence field
  const offenceInp = document.getElementById('cf-offence');
  if (offenceInp) {
    const current = offenceInp.value;
    offenceInp.value = current ? current + ' + ' + offence : offence;
  }

  // Render tags
  const container = document.getElementById('selected-sections');
  if (container) container.innerHTML = selectedSections.map(s => sectionTag(s)).join('');

  // Clear search
  const searchInp = document.getElementById('cf-section-search');
  if (searchInp) searchInp.value = '';
  document.getElementById('section-dropdown').style.display = 'none';

  _updateMobileBox();
  showToast(`Added: ${sectionStr}`, 'success', 1500);
}

// Show/hide mobile theft box based on selected sections (379-402 PPC)
function _hasMobileSection(sections) {
  const theftSections = ['379','380','381','382','392','393','394','395','396','397','398','399','400','401','402','356','411'];
  return (sections||[]).some(s => theftSections.some(t => String(s).includes(t)));
}
function _updateMobileBox() {
  const box = document.getElementById('cf-mobile-box');
  if (box) box.style.display = _hasMobileSection(selectedSections) ? 'block' : 'none';
}
// IMEI brand/model lookup from TAC (first 8 digits = Type Allocation Code)
function removeSection(sectionStr) {
  selectedSections = selectedSections.filter(s => s !== sectionStr);
  document.getElementById('cf-section').value = selectedSections.join(' + ');
  const container = document.getElementById('selected-sections');
  if (container) container.innerHTML = selectedSections.map(s => sectionTag(s)).join('');
  _updateMobileBox();
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
  const dd = document.getElementById('section-dropdown');
  if (dd && !dd.contains(e.target) && e.target.id !== 'cf-section-search') {
    dd.style.display = 'none';
  }
});

// ── MODAL OPENERS + SAVE/VIEW ──
async function openAddCaseModal(){await _dioNeed(['case-form.js']);openModal('',caseFormHTML(),`<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">منسوخ</button><button class="btn btn-primary" onclick="saveNewCase()">اندراج محفوظ کریں</button>`);setTimeout(function(){_cfRenderMobilePhones();if(typeof _cfSizeModal==='function')_cfSizeModal();},50);}
// ── AUTO REMINDERS ────────────────────────────────────────────
async function _createAutoReminders(firNum, firDateStr, mulzmanType, complainant) {
  try {
    const oid = await getOfficerId();
    if (!oid || !firDateStr) return;

    // Parse FIR date
    let firDate;
    if (/^\d{4}-\d{2}-\d{2}/.test(firDateStr)) {
      firDate = new Date(firDateStr);
    } else {
      const p = firDateStr.split(/[-\/]/);
      if (p.length === 3) firDate = new Date(p[2]+'-'+p[1].padStart(2,'0')+'-'+p[0].padStart(2,'0'));
    }
    if (!firDate || isNaN(firDate)) return;

    const addDays = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r.toISOString().split('T')[0]; };

    // 10-day: 173 CrPC interim report
    await supabaseClient.from('reminders').insert({
      officer_id: oid,
      text: `رپورٹ 173 ض ف — مقدمہ FIR ${firNum} (${complainant}) — ابتدائی رپورٹ مرتب کریں`,
      reminder_date: addDays(firDate, 10),
      is_done: false,
    });

    // 15-day: untrace warning (only namaloom)
    if (mulzmanType === 'namaloom') {
      await supabaseClient.from('reminders').insert({
        officer_id: oid,
        text: `عدم پتہ ہونے والا مقدمہ — FIR ${firNum} (${complainant}) — ملزمان نامعلوم، 15 دن مکمل`,
        reminder_date: addDays(firDate, 15),
        is_done: false,
      });
    }
    showToast('خودکار یاددہانیاں بن گئیں','info');
  } catch(e) { console.warn('auto reminder:', e.message); }
}
function viewCase(id) { openCaseWorkspace(id); }

// ── CASE WORKSPACE (FIR document editor) ──
// ════════════════════════════════════════════
//  CASE WORKSPACE
// ════════════════════════════════════════════
let currentCaseId = null;
let currentDocIndex = null;
 // stores edited content per case+doc

// ── RELATED CASES LINKING ─────────────────────────────────────

/* ═══════════════════════════════════════════════════════════════════
   سست (lazy) ماڈیول — استعمال سے پہلے یقینی بنائیں
   ───────────────────────────────────────────────────────────────────
   boot.js رفتار کے لیے بھاری فائلیں «فرصت میں» ایک ایک کر کے لاتا ہے۔
   `cases.js` فوراً لوڈ ہوتی ہے، مگر یہ اُن فائلوں کے فنکشن سیدھا پکارتی
   تھی — بغیر یہ دیکھے کہ وہ آ بھی چکی ہیں یا نہیں۔ عام حالت میں فائلیں
   cache سے فوراً مل جاتی تھیں، اِس لیے خرابی سامنے نہیں آتی تھی۔ مگر جب
   cache نیا ہو (نیا ورژن چڑھنے کے بعد) تو ہر فائل نیٹ ورک سے آتی ہے اور
   قطار لمبی ہو جاتی ہے — اُس وقفے میں مقدمہ کھولنے پر:
       ReferenceError: loadMisalDocs is not defined
   اور پورا ورک سپیس کھلنے سے رہ جاتا تھا۔
   (`loadMisalDocs` misal-docs.js میں ہے، جو قطار میں 13ویں نمبر پر ہے۔)

   اب ہر داخلی دروازہ پہلے اپنی ضروری فائلیں منگوا لیتا ہے۔ یہ انتظار صرف
   پہلی بار ہوتا ہے؛ boot.js وہی promise دوبارہ دے دیتا ہے۔                */
async function _dioNeed(files) {
  if (typeof window.dioLoadScript !== 'function') return false;
  for (var i = 0; i < files.length; i++) {
    try { await window.dioLoadScript(files[i]); } catch (_) {}
  }
  return true;
}
window._dioNeed = _dioNeed;

/* جو بٹن سیدھا کسی سست فائل کے فنکشن کو پکارتے ہیں، اُن کے لیے عارضی
   قائم مقام — فائل منگوا کر اصل فنکشن چلا دیتا ہے۔ فائل آتے ہی اصل
   تعریف خود اِس کی جگہ لے لیتی ہے۔ */
(function () {
  var SHIMS = { openEditCaseModal: 'case-form.js' };
  Object.keys(SHIMS).forEach(function (fn) {
    if (typeof window[fn] === 'function') return;
    var shim = function () {
      var args = Array.prototype.slice.call(arguments);
      _dioNeed([SHIMS[fn]]).then(function () {
        var real = window[fn];
        if (typeof real === 'function' && !real._dioShim) { real.apply(null, args); return; }
        try { if (typeof showToast === 'function') showToast('فائل لوڈ نہیں ہو سکی — ایک لمحے بعد دوبارہ کوشش کریں', 'error'); } catch (_) {}
      });
    };
    shim._dioShim = true;
    window[fn] = shim;
  });
})();

async function openCaseWorkspace(id) {
  // ورک سپیس کو جن سست فائلوں کی ضرورت ہے، پہلے وہ آ جائیں
  await _dioNeed(['misal-docs.js', 'case-docs.js', 'case-form.js']);
  closeMobileSidebar();
  window._inWorkspace = true;  // Prevent background refresh from redirecting back to list
  document.body.classList.add('workspace-mode');  // Hide topbar for more space
  currentCaseId = id;
  _currentWorkspaceCaseId = id;
  currentDocIndex = null;
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = 'Case Workspace';
  const container = document.getElementById('page-content');
  container.innerHTML = `<div class="loading-screen"><div class="loading-spinner"></div><div class="loading-text">Opening Case Workspace...</div></div>`;
  try {
    const c = await getCase(id);
    if (!c) { 
      container.innerHTML = `<div style="padding:30px;text-align:center;direction:rtl;"><div style="font-size:40px;"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.42;display:inline-block;vertical-align:middle"><path d="M12 4L3 19.5h18z"/><path d="M12 10v4.5"/><path d="M12 17.2h.01"/></svg></div><div style="margin-top:10px;">مقدمہ نہیں ملا</div><button class="btn btn-secondary btn-sm" style="margin-top:14px;" onclick="showPage('cases',null)">← واپس مقدمات</button></div>`;
      return; 
    }
    // Track recently viewed
    try {
      let recent = JSON.parse(localStorage.getItem('dio_recent_cases')||'[]');
      recent = recent.filter(r => r.id !== id);
      recent.unshift({ id, fir: c.fir_number||'—', name: c.complainant||'', at: Date.now() });
      recent = recent.slice(0, 8);
      localStorage.setItem('dio_recent_cases', JSON.stringify(recent));
    } catch(_) {}
    // Parallel fetch (was sequential — Bug 8 speed fix)
    let docs = [];
    try { docs = c.documents_checklist ? (typeof c.documents_checklist==='string'?JSON.parse(c.documents_checklist):c.documents_checklist) : []; } catch(_) { docs = []; }
    let ev = [];
    const [_misalRes, evRes] = await Promise.allSettled([
      loadMisalDocs(id),
      getEvidence(c.fir_number),
    ]);
    if (evRes.status === 'fulfilled') ev = evRes.value || [];
    renderWorkspace(c, docs, ev, container);
  } catch(err) {
    console.error('openCaseWorkspace error:', err);
    container.innerHTML = `<div style="padding:30px;text-align:center;direction:rtl;">
      <div style="font-size:40px;"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.42;display:inline-block;vertical-align:middle"><path d="M12 4L3 19.5h18z"/><path d="M12 10v4.5"/><path d="M12 17.2h.01"/></svg></div>
      <div style="margin-top:10px;color:var(--text-secondary);">مقدمہ کھولنے میں مسئلہ</div>
      <div style="font-size:11px;color:var(--text-muted);direction:ltr;font-family:monospace;margin-top:8px;">${(err&&err.message)||err}</div>
      <button class="btn btn-secondary btn-sm" style="margin-top:14px;" onclick="showPage('cases',null)">← واپس مقدمات</button>
    </div>`;
  }
}

// P4: Case progress tracker — FIR -> arrest -> challan -> faisla
function renderWorkspace(c, docs, ev, container) {
  const statusColor = {under:'var(--accent)',complete:'var(--green)',incomplete:'var(--amber)',untrace:'var(--purple)',cancel:'var(--red)',challan512:'#f97316'}[c.status]||'var(--accent)';
  const o = currentOfficer||{};
  container.style.padding = '0';
  container.style.overflow = 'hidden';
  container.innerHTML = `
    <!-- TOP BAR hataayi gayi — مقدمہ نمبر ab دستاویز والی patti mein hai -->

    <!-- CASE PROGRESS TRACKER (P4) -->

    <!-- MISAL DOCUMENT BAR (directly after topbar — nothing in between) -->
    ${renderMisalBar(c)}

    <!-- TAB CONTENT -->
    <div id="workspace-tab-content" style="height:calc(100vh - 220px);overflow:hidden;">
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-muted);">
        <div style="font-size:48px;margin-bottom:12px;"><svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.42;display:inline-block;vertical-align:middle"><path d="M3.5 7.5h6l2 2.5h9V19a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 19z"/></svg></div>
        <div style="font-size:14px;font-weight:600;margin-bottom:6px;font-family:'Jameel Noori Nastaleeq',serif;direction:rtl;">دستاویز منتخب کریں</div>
        <div style="font-size:12px;">اوپر دستاویز کے نام پر کلک کریں</div>
      </div>
    </div>`;

  // Store for tab switching
  window._workspaceCase = c;
  window._workspaceDocs = docs;
  window._workspaceEv = ev;
}

function renderDocsTab(c, docs) {
  return `<div class="workspace-layout" style="display:block;">
    <!-- Document Editor (full width — no side document list) -->
    <div class="workspace-main" id="workspace-editor-area" style="width:100%;">
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-muted);">
        <div style="font-size:48px;margin-bottom:12px;"><svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.42;display:inline-block;vertical-align:middle"><path d="M3.5 7.5h6l2 2.5h9V19a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 19z"/></svg></div>
        <div style="font-size:14px;font-weight:600;margin-bottom:6px;font-family:'Jameel Noori Nastaleeq',serif;direction:rtl;">دستاویز منتخب کریں</div>
        <div style="font-size:12px;direction:rtl;">اوپر دستاویز کے نام پر کلک کریں</div>
      </div>
    </div>
  </div>`;
}

function renderEvidenceTab(c, ev) {
  const icon = t => t==='Photo'?"<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" style=\"vertical-align:-3px;opacity:.9\"><path d=\"M3.5 8h3.2l1.6-2.4h7.4L17.3 8h3.2v11.5h-17z\"/><circle cx=\"12\" cy=\"13.5\" r=\"3.6\"/></svg>":t==='Video'?"<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" style=\"vertical-align:-3px;opacity:.9\"><path d=\"M3.5 6.5h11v11h-11z\"/><path d=\"M14.5 10.5l6-3v9l-6-3z\"/></svg>":t==='Audio'?"<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" style=\"vertical-align:-3px;opacity:.9\"><rect x=\"9\" y=\"3\" width=\"6\" height=\"11\" rx=\"3\"/><path d=\"M5 11a7 7 0 0 0 14 0\"/><path d=\"M12 18v3\"/></svg>":"<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" style=\"vertical-align:-3px;opacity:.9\"><path d=\"M7 3h7l4 4v14H7z\"/><path d=\"M14 3v5h5\"/></svg>";
  const cards = ev.length === 0
    ? `<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text-muted);">
        <div style="font-size:40px;margin-bottom:12px;"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.42;display:inline-block;vertical-align:middle"><path d="M8 4h8v3H8z"/><path d="M9 4H6v17h12V4h-3"/><path d="M9 11h6"/><path d="M9 15h6"/></svg></div>
        <div style="font-weight:600;margin-bottom:4px;font-family:'Jameel Noori Nastaleeq',serif;direction:rtl;">ابھی کوئی شہادت نہیں</div>
        <div style="font-size:12px;">+ شہادت شامل کریں بٹن دبائیں</div>
       </div>`
    : ev.map(e => { const hf = (e.storage_path || e.file_url); const vu = (e._viewUrl || e.file_url); return `
      <div class="evidence-card" id="ev-${e.id}">
        <div class="evidence-thumb" onclick="openEvidenceFile('${e.id}','${_dioJsHtml(vu||'')}','${_dioJsHtml(e.name)}','${_dioJsHtml(e.type)}')" style="cursor:${hf?'pointer':'default'};" title="${hf?'Click to open file':'No file attached'}">
          ${hf && e.type==='Photo'
            ? `<img src="${esc(vu||'')}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" alt="${esc(e.name)}" onerror="this.style.display='none';this.parentElement.querySelector('.ev-fallback').style.display='flex'"><div class="ev-fallback" style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:36px;"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.42;display:inline-block;vertical-align:middle"><path d="M3.5 8h3.2l1.6-2.4h7.4L17.3 8h3.2v11.5h-17z"/><circle cx="12" cy="13.5" r="3.6"/></svg></div>`
            : `<span style="font-size:36px;">${icon(e.type)}</span>`}
          ${hf ? `<div style="position:absolute;bottom:4px;right:4px;background:rgba(0,0,0,0.6);border-radius:4px;padding:2px 5px;font-size:9px;color:#fff;">کھولیں</div>` : ''}
        </div>
        <div class="evidence-info">
          <div class="evidence-name" id="ev-name-${e.id}">${esc(e.name)}</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">${esc(e.type)} · ${e.evidence_date||formatDate(e.created_at)}</div>
          ${e.notes ? `<div style="font-size:10px;color:var(--text-faint);margin-top:3px;font-style:italic;">${esc(e.notes)}</div>` : ''}
          <div style="display:flex;gap:6px;direction:rtl;margin-top:8px;">
            ${hf ? `<button class="btn btn-secondary btn-sm" onclick="openEvidenceFile('${e.id}','${_dioJsHtml(vu||'')}','${_dioJsHtml(e.name)}','${_dioJsHtml(e.type)}')" title="Open File">کھولیں</button>` : ''}
            <button class="btn btn-secondary btn-sm" onclick="renameEvidence('${e.id}','${_dioJsHtml(e.name)}','${_dioJsHtml(c.fir_number)}')" title="Rename">نام بدلیں</button>
            <button aria-label="Delete" class="btn btn-danger btn-sm" onclick="deleteWorkspaceEvidence('${e.id}','${c.fir_number}')" title="Delete"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/></svg></button>
          </div>
        </div>
      </div>`; }).join('');

  return `<div class="case-tab-content">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;direction:rtl;">
      <div>
        <div class="dio-hs1" style="font-weight:700;font-family:'Jameel Noori Nastaleeq',serif;direction:rtl;">شہادتیں — FIR ${c.fir_number}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${ev.length} فائل منسلک</div>
      </div>
      <button class="btn btn-primary" onclick="openWorkspaceEvidenceModal('${c.id}','${c.fir_number}')">+ شہادت شامل کریں</button>
    </div>
    <div class="evidence-grid">${cards}</div>
  </div>`;
}

// ── OPEN FILE ──────────────────────────────────────────────────
function openEvidenceFile(id, url, name, type) {
  if (!url) { showToast('No file attached to this evidence item.', 'error'); return; }
  // Open file in new tab
  window.open(url, '_blank', 'noopener');
}

// ── RENAME EVIDENCE ────────────────────────────────────────────
function renameEvidence(id, currentName, firNumber) {
  openModal('Rename Evidence',
    `<div style="margin-bottom:8px;font-size:12px;color:var(--text-muted);">Enter a new name for this evidence item.</div>
     <input class="form-input" id="ev-rename-input" value="${esc(currentName)}" style="width:100%;box-sizing:border-box;" placeholder="شہادت کا نام">`,
    `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
     <button class="btn btn-primary" onclick="saveEvidenceRename('${id}','${firNumber}')">نام بدلیں</button>`
  );
  setTimeout(() => { const i = document.getElementById('ev-rename-input'); if(i){i.focus();i.select();} }, 100);
}

async function saveEvidenceRename(id, firNumber) {
  const newName = document.getElementById('ev-rename-input')?.value.trim();
  if (!newName) { showToast('Name cannot be empty.', 'error'); return; }
  try {
    await supabaseClient.from('evidence').update({ name: newName }).eq('id', id);
    closeModal();
    showToast('Evidence renamed.', 'success');
    // Refresh evidence tab
    const c = await getCase(_currentWorkspaceCaseId);
    const ev = await getEvidence(firNumber);
    document.getElementById('workspace-tab-content').innerHTML = renderEvidenceTab(c, ev);
  } catch(err) { showToast('' + err.message, 'error'); }
}

// ── DELETE EVIDENCE ────────────────────────────────────────────
function deleteWorkspaceEvidence(id, firNumber) {
  openModal('Delete Evidence',
    `<p style="color:var(--text-secondary);font-size:13px;">Are you sure you want to delete this evidence item?<br><span style="color:var(--red);font-size:11px;margin-top:8px;display:block;">This cannot be undone.</span></p>`,
    `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
     <button class="btn btn-danger" onclick="closeModal();doDeleteWorkspaceEvidence('${id}','${firNumber}')">حذف کریں</button>`
  );
}

async function doDeleteWorkspaceEvidence(id, firNumber) {
  try {
    await deleteEvidence(id);
    showToast('Evidence deleted.', 'info');
    const c = await getCase(_currentWorkspaceCaseId);
    const ev = await getEvidence(firNumber);
    document.getElementById('workspace-tab-content').innerHTML = renderEvidenceTab(c, ev);
  } catch(err) { showToast('' + err.message, 'error'); }
}

// ── ATTACH EVIDENCE MODAL ──────────────────────────────────────
function openWorkspaceEvidenceModal(caseId, firNumber) {
  openModal('Attach Evidence',
    `<div style="margin-bottom:12px;">
       <div style="display:flex;gap:8px;direction:rtl;margin-bottom:12px;">
         <button class="btn btn-secondary btn-sm" onclick="wevOpenCamera()">کیمرہ</button>
         <button class="btn btn-secondary btn-sm" onclick="wevOpenFile()">فائل منتخب کریں</button>
       </div>
       <!-- Camera preview -->
       <div id="wev-camera" style="display:none;margin-bottom:12px;">
         <video id="wev-video" style="width:100%;border-radius:8px;max-height:200px;" autoplay playsinline></video>
         <div style="display:flex;gap:8px;direction:rtl;margin-top:8px;">
           <button class="btn btn-primary btn-sm" onclick="wevSnap()">تصویر لیں</button>
           <button class="btn btn-secondary btn-sm" onclick="wevStopCamera()">بند کریں</button>
         </div>
         <canvas id="wev-canvas" style="display:none;"></canvas>
       </div>
       <!-- File / photo preview -->
       <div id="wev-preview" style="display:none;margin-bottom:12px;text-align:center;">
         <img id="wev-img-preview" style="max-height:120px;border-radius:6px;border:2px solid var(--accent);display:none;" alt="">
         <div id="wev-file-name" style="font-size:12px;color:var(--accent);margin-top:4px;"></div>
       </div>
     </div>
     <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;direction:rtl;margin-bottom:10px;">
       <div><label class="form-label">Name *</label><input class="form-input" id="wev-name" placeholder="e.g. CCTV Screenshot"></div>
       <div><label class="form-label">قسم</label>
         <select class="form-input" id="wev-type">
           <option>تصویر</option><option>ویڈیو</option><option>آواز</option><option>دستاویز</option>
         </select>
       </div>
     </div>
     <div style="margin-bottom:10px;"><label class="form-label">شہادت کی تاریخ</label><input class="form-input" id="wev-date" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
     <div><label class="form-label">تفصیل</label><textarea class="form-input" id="wev-notes" rows="2" placeholder="تفصیل، کہاں سے ملی، وغیرہ"></textarea></div>`,
    `<button class="btn btn-secondary" onclick="wevStopCamera();closeModal()">منسوخ</button>
     <button class="btn btn-primary" onclick="wevSave('${caseId}','${firNumber}')">شامل کریں</button>`
  );
  window._wevFile = null;
  window._wevDataUrl = null;
}

// Camera helpers
async function wevOpenCamera() {
  document.getElementById('wev-camera').style.display = 'block';
  try {
    window._wevStream = await navigator.mediaDevices.getUserMedia({ video: true });
    document.getElementById('wev-video').srcObject = window._wevStream;
  } catch(e) { showToast('Camera not available.', 'error'); }
}
function wevStopCamera() {
  if (window._wevStream) { window._wevStream.getTracks().forEach(t => t.stop()); window._wevStream = null; }
  const cam = document.getElementById('wev-camera'); if (cam) cam.style.display = 'none';
}
function wevSnap() {
  const v = document.getElementById('wev-video');
  const cv = document.getElementById('wev-canvas');
  cv.width = v.videoWidth; cv.height = v.videoHeight;
  cv.getContext('2d').drawImage(v, 0, 0);
  window._wevDataUrl = cv.toDataURL('image/jpeg', 0.85);
  wevStopCamera();
  const prev = document.getElementById('wev-preview');
  const img = document.getElementById('wev-img-preview');
  prev.style.display = 'block'; img.style.display = 'block'; img.src = window._wevDataUrl;
  document.getElementById('wev-file-name').textContent = 'Camera capture ready';
  if (!document.getElementById('wev-name').value) document.getElementById('wev-name').value = 'Photo ' + formatDate(new Date());
  document.getElementById('wev-type').value = 'Photo';
}
function wevOpenFile() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx';
  inp.onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    window._wevFile = f;
    const prev = document.getElementById('wev-preview');
    const img = document.getElementById('wev-img-preview');
    prev.style.display = 'block';
    document.getElementById('wev-file-name').textContent = '' + f.name + ' (' + (f.size/1024).toFixed(1) + ' KB)';
    if (f.type.startsWith('image/')) {
      const r = new FileReader(); r.onload = ev => { img.src = ev.target.result; img.style.display = 'block'; }; r.readAsDataURL(f);
    } else { img.style.display = 'none'; }
    if (!document.getElementById('wev-name').value) document.getElementById('wev-name').value = f.name.replace(/\.[^/.]+$/, '');
    if (f.type.startsWith('image/')) document.getElementById('wev-type').value = 'Photo';
    else if (f.type.startsWith('video/')) document.getElementById('wev-type').value = 'Video';
    else if (f.type.startsWith('audio/')) document.getElementById('wev-type').value = 'Audio';
    else document.getElementById('wev-type').value = 'Document';
  };
  inp.click();
}

let _currentWorkspaceCaseId = null;

async function wevSave(caseId, firNumber) {
  // VIEW-ONLY ENFORCEMENT [4E]: میعاد ختم پر نئی شہادت منسلک کرنا بند
  if (window.DIO && DIO.sub && !DIO.sub.guard('شہادت منسلک')) return;
  const name = document.getElementById('wev-name')?.value.trim();
  if (!name) { showToast('Evidence name is required.', 'error'); return; }
  _currentWorkspaceCaseId = caseId;

  const type = document.getElementById('wev-type')?.value || 'Document';
  const date = document.getElementById('wev-date')?.value || '';
  const notes = document.getElementById('wev-notes')?.value || '';

  try {
    // Photo/file (camera dataURL ya select ki hui file) — online upload ya OFFLINE store+queue.
    // addEvidenceWithFile dono soorton (online/offline) ko sambhalta hai.
    const _fileInfo = window._wevDataUrl ? { dataUrl: window._wevDataUrl }
                    : (window._wevFile ? { file: window._wevFile } : null);
    const _meta = { name, fir_number: firNumber, type, evidence_date: date, notes };
    let _row;
    if (typeof addEvidenceWithFile === 'function') {
      _row = await addEvidenceWithFile(_meta, _fileInfo);
    } else {
      // Fallback (purana raasta) — sirf online
      let fileUrl = null, storagePath = null;
      if (window._wevFile || window._wevDataUrl) {
        let blob, ext;
        if (window._wevDataUrl) { const res = await fetch(window._wevDataUrl); blob = await res.blob(); ext = 'jpg'; }
        else { blob = window._wevFile; ext = window._wevFile.name.split('.').pop(); }
        const path = `${currentUser?.id||'officer'}/${firNumber}/${Date.now()}_${name.replace(/\s+/g,'_')}.${ext}`;
        const { error: upErr } = await supabaseClient.storage.from('evidence').upload(path, blob, { upsert: true });
        if (upErr) throw upErr;
        // عوامی URL محفوظ نہ کریں (leak سے بچاؤ) — صرف storage_path؛ دیکھنا signed URL سے
        storagePath = path;
      }
      _row = await addEvidence({ name, fir_number: firNumber, type, evidence_date: date, notes, file_url: fileUrl, storage_path: storagePath });
    }
    window._wevDataUrl = null; window._wevFile = null;
    wevStopCamera();
    closeModal();
    if (_row && _row._pendingUpload) showToast('آف لائن محفوظ — انٹرنیٹ آنے پر شہادت اپلوڈ ہو گی', 'info', 4000);
    else showToast('Evidence attached: ' + name, 'success');

    // Refresh evidence tab
    const c = await getCase(caseId);
    const ev = await getEvidence(firNumber);
    const tabContent = document.getElementById('workspace-tab-content');
    if (tabContent) tabContent.innerHTML = renderEvidenceTab(c, ev);
  } catch(err) { showToast('' + err.message, 'error'); }
}


// ── BACK / DELETE ──
function goBackToCases() {
  window._inWorkspace = false;
  document.body.classList.remove('workspace-mode');  // Restore topbar
  const container = document.getElementById('page-content');
  if (container) {
    container.style.padding = '20px';
    container.style.overflow = 'auto';
  }
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = 'My Cases';
  if (container) renderCases(container);
}
function confirmDeleteCase(id,fir){openModal('Confirm Delete',`<p style="color:var(--text-secondary);font-size:13px;">مقدمہ حذف کریں <b style="color:var(--accent);">FIR ${fir}</b>?<br><br><span style="color:var(--red);font-size:11px;">This cannot be undone.</span></p>`,`<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">منسوخ</button><button class="btn btn-danger" onclick="closeModal();doDeleteCase('${id}')">حذف کریں</button>`);}
async function doDeleteCase(id){
  try {
    const c = await getCase(id);
    if (c) await softDelete('case', id, c);
    await deleteCase(id);
    showToast('مقدمہ حذف شدہ مواد میں منتقل ہو گیا۔','info');
    await updateBadges();
    renderCases(document.getElementById('page-content'));
  } catch(err) { showToast('Error: '+err.message,'error'); }
}
