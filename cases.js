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
  'CDR Analyzer',
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
    'CDR Analyzer',
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
async function renderCases(container,fStatus,fQuery,fStation){
  fStatus=fStatus||'';fQuery=fQuery||'';fStation=fStation||'';
  _casesCache = [];
  const allCases=await getCases(fStatus,fQuery);
  _casesCache=allCases;
  const o=currentOfficer||{};

  // Get unique stations from cases (for folder view)
  const stations=[...new Set(allCases.map(c=>c.case_station||o.station||'—').filter(Boolean))].sort();
  const cases = fStation ? allCases.filter(c=>(c.case_station||o.station)==fStation) : allCases;
  const currentStation = o.station||'—';
  const isArchiveView = fStation && fStation !== currentStation;

  container.innerHTML=`
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;direction:rtl;flex-wrap:wrap;">
    <div>
      <div style="font-size:18px;font-weight:800;">📁 میرے مقدمات</div>
      <div style="font-size:12px;color:var(--text-muted);">${cases.length} مقدمات${isArchiveView?' · '+fStation+' آرکائیو':''}</div>
    </div>
    <div style="display:flex;gap:6px;direction:rtl;margin-inline-start:auto;flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="openAddCaseModal()">+ نیا اندراج</button>
    </div>
  </div>

  <!-- Station Folders -->
  ${stations.length>1?`
  <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;direction:rtl;">
    <button class="btn ${!fStation?'btn-primary':'btn-secondary'} btn-sm" onclick="renderCases(document.getElementById('page-content'),'','','')">📁 تمام (${allCases.length})</button>
    ${stations.map(s=>`
    <button class="btn ${fStation===s?'btn-primary':'btn-secondary'} btn-sm"
      onclick="renderCases(document.getElementById('page-content'),'','','${s}')"
      title="${s===currentStation?'موجودہ تھانہ':'پرانا تھانہ — آرکائیو'}">
      ${s===currentStation?'🏛️':'📦'} ${s} (${allCases.filter(c=>(c.case_station||o.station)===s).length})
    </button>`).join('')}
  </div>`:``}

  ${isArchiveView?`<div style="background:rgba(167,139,250,0.1);border:1px solid #a78bfa;border-radius:8px;padding:8px 14px;margin-bottom:10px;font-size:12px;color:#a78bfa;direction:rtl;">📦 آرکائیو — تھانہ ${fStation} کے پرانے مقدمات (صرف دیکھنے کے لیے)</div>`:''}

  <div style="display:flex;gap:8px;direction:rtl;flex-wrap:wrap;margin-bottom:14px;">
    <input class="search-input" id="case-search" style="flex:1;min-width:180px;" placeholder="🔍 FIR نمبر، مدعی، CNIC، دفعہ..." value="${fQuery}" oninput="clearTimeout(window._csTmr);window._csTmr=setTimeout(()=>renderCases(document.getElementById('page-content'),'',this.value,'${fStation}'),280)" dir="rtl">
    <select class="filter-select" id="case-status-filter" onchange="renderCases(document.getElementById('page-content'),this.value,document.getElementById('case-search').value,'${fStation}')">
      <option value="" ${!fStatus?'selected':''}>تمام صورتحال</option>
      <option value="under"      ${fStatus==='under'?'selected':''}>زیر تفتیش</option>
      <option value="complete"   ${fStatus==='complete'?'selected':''}>چالان مکمل</option>
      <option value="incomplete" ${fStatus==='incomplete'?'selected':''}>چالان نامکمل</option>
      <option value="challan512" ${fStatus==='challan512'?'selected':''}>چالان 512</option>
      <option value="untrace"    ${fStatus==='untrace'?'selected':''}>عدم پتہ</option>
      <option value="cancel"     ${fStatus==='cancel'?'selected':''}>اخراج</option>
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
          <th>شناختی کارڈ</th>
          <th>موبائل</th>
          <th>صورتحال</th>
          <th style="text-align:center;">اقدامات</th>
        </tr></thead>
        <tbody>
          ${cases.length ? cases.map((c,i)=>renderCaseRow(c,i+1)).join('') : `<tr><td colspan="11" style="text-align:center;padding:30px;color:var(--text-muted);">کوئی مقدمہ نہیں</td></tr>`}
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
      <span style="font-family:var(--font-mono);font-weight:800;color:var(--accent);font-size:12px;cursor:pointer;text-decoration:underline;text-decoration-color:rgba(56,189,248,0.4);" onclick="openCaseWorkspace('${c.id}')" title="Open Case Workspace">${c.fir_number||'—'}</span>
      ${c.priority ? `<br><span style="font-size:9px;font-weight:700;color:${c.priority==='high'?'var(--red)':c.priority==='medium'?'var(--amber)':'var(--green)'};">${c.priority==='high'?'🔴 اہم':c.priority==='medium'?'🟡 درمیانہ':'🟢 کم'}</span>` : ''}
      ${c.is_cross_version?'<br><span style="font-size:9px;color:var(--red);font-weight:600;">⚔️ Cross</span>':''}
    </td>
    <td style="font-size:11px;white-space:nowrap;">${formatDate(c.fir_date)}</td>
    <td style="font-size:11px;white-space:nowrap;">${formatDate(c.occurrence_date)}</td>
    <td style="font-size:11px;max-width:150px;">${offence}</td>
    <td style="font-size:11px;">${station}</td>
    <td style="font-size:12px;font-weight:500;">${c.complainant||'—'}</td>
    <td style="font-family:var(--font-mono);font-size:11px;">${cnic}</td>
    <td style="font-family:var(--font-mono);font-size:11px;">${cell}</td>
    <td><span class="pill ${STATUS_CLASSES[c.status]||'pill-blue'}">${STATUS_LABELS[c.status]||c.status}</span></td>
    <td>
      <div style="display:flex;gap:2px;direction:rtl;justify-content:center;flex-direction:row-reverse;">
        <button class="btn btn-secondary btn-sm" onclick="openCaseWorkspace('${c.id}')" title="مقدمہ کھولیں">📄</button>
        <button class="btn btn-secondary btn-sm" onclick="openEditCaseModal('${c.id}')" title="ترمیم">✏️</button>
        <button class="btn btn-secondary btn-sm" onclick="downloadCaseFile('${c.id}')" title="ڈاؤنلوڈ">⬇️</button>
        <button class="btn btn-primary   btn-sm" onclick="openShareModal('${c.id}')"    title="شیئر">📤</button>
        <button class="btn btn-danger    btn-sm" onclick="confirmDeleteCase('${c.id}','${c.fir_number||'?'}')" title="حذف">🗑️</button>
      </div>
    </td>
  </tr>`;
}

// ── DIRECT FIR PRINT ─────────────────────────────────────────
async function _printFIRDirect(id) {
  const c = _casesCache.find(x=>x.id===id) || await getCase(id);
  if (!c) { showToast('❌ مقدمہ نہیں ملا','error'); return; }
  const o = currentOfficer||{};
  let _printHTML = '';
  _printHTML += (`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page{margin:15mm;size:A4;}
    body{font-family:'Noto Nastaliq Urdu','Jameel Noori Nastaleeq',serif;direction:rtl;color:#111;font-size:13px;line-height:1.8;}
    .hdr{text-align:center;border-bottom:3px double #000;padding-bottom:10px;margin-bottom:14px;}
    .hdr h1{font-size:20px;font-weight:900;margin:0 0 4px;}
    .fir-title{font-size:17px;font-weight:900;text-align:center;background:#1a3a5c;color:#fff;padding:8px;margin:10px 0;}
    table{width:100%;border-collapse:collapse;margin-bottom:12px;}
    td,th{border:1px solid #333;padding:7px 10px;font-size:13px;}
    th{background:#e8e8e8;font-weight:700;width:38%;}
    .s-lbl{font-size:13px;font-weight:800;background:#f0f4f8;padding:7px 12px;border-right:4px solid #1a3a5c;margin:12px 0 6px;}
    .narrative{border:1px solid #999;padding:12px;min-height:80px;margin-top:6px;line-height:2.2;}
    .sig-row{display:flex;justify-content:space-between;margin-top:40px;gap:20px;}
    .sig-box{text-align:center;flex:1;}
    .sig-line{border-top:1px solid #000;padding-top:6px;margin-top:30px;font-size:12px;}
    .footer{font-size:9px;color:#888;text-align:center;margin-top:20px;border-top:1px solid #ccc;padding-top:6px;}
  </style></head><body>
  <div class="hdr">
    <h1></h1>
    <div>تھانہ ${c.case_station||o.station||'___'} ضلع ${c.case_district||o.district||'___'}</div>
  </div>
  <div class="fir-title">فرسٹ انفارمیشن رپورٹ (FIR)</div>
  <table>
    <tr><th>مقدمہ نمبر</th><td><b>${c.fir_number||'—'}</b></td><th>تاریخ اندراج</th><td>${formatDate(c.fir_date)}</td></tr>
    <tr><th>تاریخ وقوعہ</th><td>${formatDate(c.occurrence_date)||'—'}</td><th>دفعات</th><td><b>${c.section_of_law||'—'}</b></td></tr>
    <tr><th>ملزمان</th><td colspan="3">${c.mulzman_type==='maloom'?'✅ معلوم':'⚠️ نامعلوم'}</td></tr>
  </table>
  <div class="s-lbl">مدعی کی تفصیل</div>
  <table>
    <tr><th>نام</th><td><b>${c.complainant||'—'}</b></td><th>شناختی کارڈ</th><td>${c.complainant_cnic||'—'}</td></tr>
    <tr><th>موبائل</th><td>${c.complainant_cell||'—'}</td><th>پیشہ</th><td>${c.complainant_profession||'—'}</td></tr>
  </table>
  <div class="s-lbl">واقعے کی تفصیل</div>
  <div class="narrative">${c.notes||'&nbsp;'.repeat(200)}</div>
  <div class="s-lbl">دفتری</div>
  <table>
    <tr><th>تفتیشی افسر</th><td>${o.full_name||'—'}</td><th>عہدہ</th><td>${o.designation||'—'}</td></tr>
    <tr><th>صورتحال</th><td colspan="3">${STATUS_LABELS[c.status]||c.status||'—'}</td></tr>
  </table>
  <div class="sig-row">
    <div class="sig-box"><div class="sig-line">دستخط مدعی<br>${c.complainant||'___'}</div></div>
    <div class="sig-box"><div class="sig-line">تفتیشی افسر<br>${o.full_name||'___'}</div></div>
    <div class="sig-box"><div class="sig-line">SHO تھانہ ${c.case_station||o.station||'___'}<br>مہر و دستخط</div></div>
  </div>
  <div class="footer">Digital IO · ‏${new Date().toLocaleDateString('en-PK')}</div>
  
  </body></html>`);
  dioPrint(_printHTML);
}

// ── DOWNLOAD CASE FILE ──
async function downloadCaseFile(id) {
  const c = _casesCache.find(x=>x.id===id) || await getCase(id);
  if (!c) { showToast('❌ Case not found','error'); return; }

  openModal('⬇️ Case File Download — FIR ' + (c.fir_number||''),
    `<div style="display:flex;flex-direction:column;gap:12px;padding:10px 0;">
      <div style="font-size:13px;color:var(--text-secondary);text-align:center;margin-bottom:4px;">FIR ${c.fir_number||'—'} · ${c.complainant||'—'}</div>
      <button class="btn btn-primary" style="padding:14px;font-size:14px;" onclick="closeModal();_downloadCaseTxt('${id}')">
        📄 Text File Download کریں (.txt)
      </button>
      <button class="btn btn-secondary" style="padding:14px;font-size:14px;" onclick="closeModal();_downloadCaseHTML('${id}')">
        🌐 HTML File Download کریں (Print → PDF)
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
  txt += `\nتاریخ پرنٹ: ${new Date().toLocaleDateString('en-PK')}\n`;
  txt += '══════════════════════════════════\n';
  txt += '         Digital IO\n';
  txt += '══════════════════════════════════\n';

  const blob = new Blob([txt], {type:'text/plain;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Case-FIR-${c.fir_number||'file'}-${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  showToast('✅ File Download ہو رہی ہے','success');
}

async function _downloadCaseHTML(id) {
  const c = _casesCache.find(x=>x.id===id) || await getCase(id);
  if (!c) return;
  const o = currentOfficer || {};
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
  <title>FIR ${c.fir_number||''}</title>
  <style>
    body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',Arial,sans-serif;direction:rtl;margin:30px;color:#111;font-size:14px;}
    h2,h3{text-align:center;} .row{display:flex;gap:20px;margin-bottom:8px;}
    .lbl{color:#555;min-width:140px;font-weight:600;} .val{flex:1;}
    .sec{border-top:1px solid #ccc;margin:16px 0 8px;padding-top:8px;font-weight:700;color:#1a3a5c;}
    .footer{text-align:center;font-size:11px;color:#888;margin-top:40px;border-top:1px solid #ccc;padding-top:10px;}
    @media print{body{margin:15mm;}}
  </style></head><body>
  <h2></h2>
  <h3>تھانہ ${o.station||'—'} ضلع ${o.district||'—'}</h3>
  <hr>
  <div class="row"><span class="lbl">مقدمہ نمبر:</span><span class="val"><b>${c.fir_number||'—'}</b></span></div>
  <div class="row"><span class="lbl">تاریخ اندراج:</span><span class="val">${formatDate(c.fir_date)}</span></div>
  <div class="row"><span class="lbl">تاریخ وقوعہ:</span><span class="val">${formatDate(c.occurrence_date)}</span></div>
  <div class="row"><span class="lbl">دفعات:</span><span class="val">${c.section_of_law||'—'}</span></div>
  <div class="row"><span class="lbl">جرم:</span><span class="val">${c.offence_type||'—'}</span></div>
  <div class="row"><span class="lbl">صورتحال:</span><span class="val">${STATUS_LABELS[c.status]||c.status}</span></div>
  <div class="sec">مدعی کی تفصیل</div>
  <div class="row"><span class="lbl">نام:</span><span class="val">${c.complainant||'—'}</span></div>
  <div class="row"><span class="lbl">شناختی کارڈ:</span><span class="val">${c.complainant_cnic||'—'}</span></div>
  <div class="row"><span class="lbl">موبائل:</span><span class="val">${c.complainant_cell||'—'}</span></div>
  <div class="row"><span class="lbl">پیشہ:</span><span class="val">${c.complainant_profession||'—'}</span></div>
  <div class="sec">رپورٹنگ افسر</div>
  <div class="row"><span class="lbl">نام:</span><span class="val">${o.full_name||'—'}</span></div>
  <div class="row"><span class="lbl">عہدہ:</span><span class="val">${o.designation||'—'}</span></div>
  <div class="row"><span class="lbl">تھانہ:</span><span class="val">${o.station||'—'}</span></div>
  <div style="margin-top:50px;display:flex;justify-content:space-between;">
    <div style="text-align:center;"><div style="border-top:1px solid #333;width:200px;padding-top:6px;">دستخط رپورٹنگ افسر</div></div>
    <div style="text-align:center;"><div style="border-top:1px solid #333;width:200px;padding-top:6px;">SHO تھانہ ${o.station||'—'}</div></div>
  </div>
  <div class="footer">Digital IO · تاریخ: ${new Date().toLocaleDateString('en-PK')}</div>
  </body></html>`;

  const blob = new Blob([html], {type:'text/html;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Case-FIR-${c.fir_number||'file'}-${new Date().toISOString().slice(0,10)}.html`;
  a.click();
  showToast('✅ HTML file download ہوئی — browser میں کھولیں، Ctrl+P سے PDF بنائیں','success');
}

// ── SHARE CASE ──
async function openShareModal(id){
  const c=_casesCache.find(x=>x.id===id)||await getCase(id);
  if(!c){showToast('❌ Case not found','error');return;}
  const o=currentOfficer||{};
  const station=c.case_station||o.station||'—';
  const offence=[c.section_of_law,c.offence_type].filter(Boolean).join(' / ')||'—';
  const lines=[
    '📋 CASE FILE — Digital IO Police Portal',
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
  openModal(`📤 Share Case — FIR ${c.fir_number||''}`,
    `<div style="margin-bottom:14px;background:var(--bg-tertiary);border-radius:8px;padding:12px;font-size:10.5px;color:var(--text-secondary);font-family:var(--font-mono);white-space:pre;line-height:1.7;max-height:180px;overflow-y:auto;">${text}</div>
     <div style="display:flex;gap:10px;direction:rtl;justify-content:center;flex-wrap:wrap;">
       <a href="https://wa.me/?text=${enc}" target="_blank" rel="noopener"
          style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:8px;background:#25D366;color:#fff;font-weight:700;font-size:13px;text-decoration:none;">
         💬 Share on WhatsApp
       </a>
       <a href="mailto:?subject=${sub}&body=${enc}"
          style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:8px;background:var(--accent-dark);color:#fff;font-weight:700;font-size:13px;text-decoration:none;">
         📧 Send via Email
       </a>
     </div>
     <div style="margin-top:10px;font-size:10px;color:var(--text-muted);text-align:center;">WhatsApp opens in a new tab · Email opens your default email app</div>`,
    `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">Close</button>`);
}


// ── CASE FORM (add/edit) ──
function caseFormHTML(c) {
  c = c || {};
  selectedSections = c.section_of_law ? c.section_of_law.split(' + ').filter(Boolean) : [];
  try {
    selectedDocuments = c.documents_checklist
      ? (typeof c.documents_checklist === 'string'
          ? JSON.parse(c.documents_checklist)
          : Array.isArray(c.documents_checklist) ? c.documents_checklist : [])
      : [];
  } catch(e) { selectedDocuments = []; }

  var fir = c.fir_number || '';
  var date = c.fir_date || '';
  var occ = c.occurrence_date || '';
  var accused = c.accused_name || '';
  var cnic = c.accused_cnic || '';
  var cell = c.accused_cell || '';
  var complainant = c.complainant || '';
  var cmpCnic = c.complainant_cnic || '';
  var cmpCell = c.complainant_cell || '';
  var cmpProf = c.complainant_profession || '';
  var section = c.section_of_law || '';
  var offence = c.offence_type || '';
  var sho = c.sho || '';
  var sdpo = c.sdpo || '';
  var firWriter = c.fir_writer || '';
  var compSender = c.complaint_sender || '';
  var notes = c.notes || '';
  var status = c.status || 'under';
  var position = c.position || 'pending';
  var isCross = c.is_cross_version || false;

  var statusOpts = '<option value="under"'+(status==='under'?' selected':'')+'>&#x0632;&#x06CC;&#x0631; &#x062A;&#x0641;&#x062A;&#x06CC;&#x0634; (Under Investigation)</option>'
    + '<option value="complete"'+(status==='complete'?' selected':'')+'>&#x0645;&#x06A9;&#x0645;&#x0644; &#x0686;&#x0627;&#x0644;&#x0627;&#x0646; (Complete)</option>'
    + '<option value="incomplete"'+(status==='incomplete'?' selected':'')+'>&#x0646;&#x0627;&#x0645;&#x06A9;&#x0645;&#x0644; &#x0686;&#x0627;&#x0644;&#x0627;&#x0646; (Incomplete)</option>'
    + '<option value="challan512"'+(status==='challan512'?' selected':'')+'>\u0686\u0627\u0644\u0627\u0646 512\u0636 \u0641 (512 CrPC)</option>'
    + '<option value="untrace"'+(status==='untrace'?' selected':'')+'>&#x0639;&#x062F;&#x0645; &#x067E;&#x062A;&#x06C1; (Untraced)</option>'
    + '<option value="cancel"'+(status==='cancel'?' selected':'')+'>&#x0627;&#x062E;&#x0631;&#x0627;&#x062C; (Cancelled)</option>';

  var posOpts = '<option value="pending"'+(position==='pending'?' selected':'')+'>' + '&#x23F3; Pending</option>'
    + '<option value="court"'+(position==='court'?' selected':'')+'>&#x2696;&#xFE0F; In Court</option>';

  var sectionTags = selectedSections.map(function(s) { return sectionTag(s); }).join('');
  var docList = renderDocChecklist(ALL_MISAL_DOCS, selectedDocuments);

  var crossFields = '';
  if (isCross) {
    crossFields = buildCrossFields(c);
  }

  var html = ''
    + '<div style="max-height:70vh;overflow-y:auto;padding-right:4px;">'

    // Row 1: مقدمہ نمبر + تاریخ اندراج مقدمہ
    + '<div class="form-row">'
    + '<div class="form-group"><label class="form-label">مقدمہ نمبر *</label>'
    + '<input class="form-input" id="cf-fir" value="'+fir+'" placeholder="e.g. 245/2025" dir="ltr" style="text-align:left;"></div>'
    + '<div class="form-group"><label class="form-label">تاریخ اندراج مقدمہ *</label>'
    + '<input class="form-input" id="cf-date" value="'+date+'" placeholder="DD-MM-YYYY" oninput="autoFormatDate(this)" dir="ltr" style="text-align:left;"></div>'
    + '</div>'

    // Row 2: تاریخ وقوعہ + Status
    + '<div class="form-row">'
    + '<div class="form-group"><label class="form-label">تاریخ وقوعہ</label>'
    + '<input class="form-input" id="cf-occurrence-date" value="'+occ+'" placeholder="DD-MM-YYYY" oninput="autoFormatDate(this)" dir="ltr" style="text-align:left;"></div>'
    + '<div class="form-group"><label class="form-label">صورتحال *</label>'
    + '<select class="form-input" id="cf-status">'+statusOpts+'</select></div>'
    + '<div class="form-group"><label class="form-label">ترجیح (Priority)</label>'
    + '<select class="form-input" id="cf-priority">'
    +   '<option value="">— منتخب کریں —</option>'
    +   '<option value="high"'+(c.priority==='high'?' selected':'')+'>🔴 اہم</option>'
    +   '<option value="medium"'+(c.priority==='medium'?' selected':'')+'>🟡 درمیانہ</option>'
    +   '<option value="low"'+(c.priority==='low'?' selected':'')+'>🟢 کم</option>'
    + '</select></div>'
    + '</div>'

    // Row 2b: ملزمان کی صورتحال
    + '<div class="form-row">'
    + '<div class="form-group"><label class="form-label">ملزمان</label>'
    + '<select class="form-input" id="cf-mulzman-type">'
    + '<option value="maloom" '+(c.mulzman_type==='maloom'?'selected':'')+'>✅ ملزمان معلوم</option>'
    + '<option value="namaloom" '+(c.mulzman_type==='namaloom'||!c.mulzman_type?'selected':'')+'>⚠️ ملزمان نامعلوم</option>'
    + '</select></div>'
    + '<div class="form-group"><label class="form-label">&nbsp;</label>'
    + '<div style="font-size:11px;color:var(--text-muted);padding:9px 12px;background:var(--bg-secondary);border-radius:6px;">'
    + '⚠️ نامعلوم منتخب کریں تو 15 دن بعد خودکار یاددہانی ملے گی'
    + '</div></div>'
    + '</div>'

    // Row 3: Sections of Law (full width)
    + '<div class="form-group">'
    + '<label class="form-label">دفعات قانون * <span style="color:var(--text-faint);font-weight:400;">(ایک سے زیادہ)</span></label>'
    + '<div style="position:relative;">'
    + '<input class="form-input" id="cf-section-search" placeholder="🔍 دفعہ نمبر یا کلیدی الفاظ..." dir="ltr" style="text-align:left;" oninput="searchPenalCodes(this.value)" autocomplete="off">'
    + '<div id="section-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--bg-card);border:1px solid var(--accent);border-radius:0 0 var(--radius-sm) var(--radius-sm);max-height:180px;overflow-y:auto;z-index:200;box-shadow:var(--shadow);"></div>'
    + '</div>'
    + '<div id="selected-sections" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">'+sectionTags+'</div>'
    + '<input type="hidden" id="cf-section" value="'+section+'">'
    + '</div>'

    // Mobile theft detail (shown only when section 379-402 PPC selected)
    + '<div id="cf-mobile-box" style="display:'+(_hasMobileSection(selectedSections)?'block':'none')+';background:var(--bg-secondary);border:1px solid var(--amber);border-radius:8px;padding:12px;margin-bottom:12px;">'
    +   '<div style="font-size:12px;font-weight:700;color:var(--amber);margin-bottom:8px;">📱 موبائل چوری کی تفصیل</div>'
    +   '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'
    +     '<div><label class="form-label">چوری شدہ چیز</label>'
    +       '<select class="form-input" id="cf-theft-item" onchange="_toggleMobileFields()">'
    +         '<option value="">— منتخب کریں —</option>'
    +         '<option value="mobile"'+(c.theft_item==='mobile'?' selected':'')+'>📱 موبائل فون</option>'
    +         '<option value="motorcycle"'+(c.theft_item==='motorcycle'?' selected':'')+'>🏍️ موٹرسائیکل</option>'
    +         '<option value="car"'+(c.theft_item==='car'?' selected':'')+'>🚗 گاڑی</option>'
    +         '<option value="cash"'+(c.theft_item==='cash'?' selected':'')+'>💵 نقدی</option>'
    +         '<option value="jewelry"'+(c.theft_item==='jewelry'?' selected':'')+'>💍 زیورات</option>'
    +         '<option value="other"'+(c.theft_item==='other'?' selected':'')+'>دیگر</option>'
    +       '</select></div>'
    +     '<div id="cf-mobile-imei-wrap" style="display:'+(c.theft_item==='mobile'?'block':'none')+';"><label class="form-label">IMEI نمبر (15 ہندسے)</label>'
    +       '<input class="form-input" id="cf-mobile-imei" dir="ltr" inputmode="numeric" maxlength="15" value="'+(c.theft_imei||'')+'" placeholder="000000000000000" oninput="_imeiLookup(this)"></div>'
    +     '<div id="cf-mobile-brand-wrap" style="display:'+(c.theft_item==='mobile'?'block':'none')+';"><label class="form-label">کمپنی / ماڈل (قابل ترمیم)</label>'
    +       '<input class="form-input" id="cf-mobile-brand" value="'+(c.theft_brand||'')+'" placeholder="IMEI سے خودکار، یا خود لکھیں"></div>'
    +     '<div id="cf-mobile-cell-wrap" style="display:'+(c.theft_item==='mobile'?'block':'none')+';grid-column:1/-1;"><label class="form-label">چوری شدہ موبائل کے نمبر (ایک سے زیادہ — کاما سے الگ کریں)</label>'
    +       '<input class="form-input" id="cf-mobile-cell" dir="ltr" value="'+(c.theft_cell||'')+'" placeholder="0000-0000000، 0000-0000000"></div>'
    +   '</div>'
    + '</div>'


    // Complainant section — RTL, new order
    + '<div style="padding:10px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);margin-bottom:12px;">'
    + '<div style="font-size:10px;color:var(--accent);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;text-align:right;direction:rtl;">مدعی کی تفصیل 👤</div>'

    // Row 1: مدعی (full width with voice + live counter)
    + '<div class="form-group">'
    + '<label class="form-label">مدعی *</label>'
    + '<div style="display:flex;gap:6px;direction:rtl;align-items:center;">'
    + '<div style="flex:1;position:relative;">'
    + '<input class="form-input" id="cf-complainant" value="'+complainant+'" placeholder="مدعی کا نام" dir="auto" oninput="var _cc=document.getElementById(\'cf-comp-count\');if(_cc)_cc.textContent=this.value.length+\' حروف\';">'
    + '<span id="cf-comp-count" style="position:absolute;bottom:4px;left:8px;font-size:9px;color:var(--text-faint);">'+(complainant?complainant.length+' حروف':'')+'</span>'
    + '</div>'
    + '<button id="vmb-cf-complainant" type="button" onclick="voiceType(\'cf-complainant\',\'vmb-cf-complainant\')" style="width:36px;height:36px;flex-shrink:0;border:1px solid var(--border);border-radius:6px;background:var(--bg-tertiary);font-size:16px;cursor:pointer;">🎙️</button>'
    + '</div>'
    + '</div>'

    // Row 2: موبائل نمبر + شناختی کارڈ
    + '<div class="form-row">'
    + '<div class="form-group"><label class="form-label">موبائل نمبر</label>'
    + '<input class="form-input" id="cf-complainant-cell" value="'+cmpCell+'" placeholder="0XXX-XXXXXXX" oninput="autoFormatCell(this)" dir="ltr" style="text-align:left;"></div>'
    + '<div class="form-group"><label class="form-label">شناختی کارڈ نمبر</label>'
    + '<input class="form-input" id="cf-complainant-cnic" value="'+cmpCnic+'" placeholder="XXXXX-XXXXXXX-X" oninput="autoFormatCNIC(this)" dir="ltr" style="text-align:left;"></div>'
    + '</div>'

    // Row 3: پیشہ (occupation)
    + '<div class="form-group"><label class="form-label">پیشہ</label>'
    + '<input class="form-input" id="cf-complainant-profession" value="'+cmpProf+'" placeholder="پیشہ" dir="auto"></div>'

    + '</div>'

    // FIR Details — swapped pairs
    + '<div style="padding:10px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);margin-bottom:12px;">'
    + '<div style="font-size:10px;color:var(--accent);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">📋 FIR کی تفصیل</div>'
    + '<div class="form-row">'
    + '<div class="form-group"><label class="form-label">مرتبہ مرسلہ</label>'
    + '<div style="display:flex;gap:4px;direction:rtl;"><input class="form-input" id="cf-complaint-sender" value="'+compSender+'" placeholder="مرتبہ مرسلہ" dir="auto" style="flex:1;"><button id="vmb-cs" type="button" onclick="voiceType(\'cf-complaint-sender\',\'vmb-cs\')" style="width:34px;height:34px;flex-shrink:0;border:1px solid var(--border);border-radius:5px;background:var(--bg-tertiary);font-size:14px;cursor:pointer;">🎙️</button></div></div>'
    + '<div class="form-group"><label class="form-label">محرر</label>'
    + '<div style="display:flex;gap:4px;direction:rtl;"><input class="form-input" id="cf-fir-writer" value="'+firWriter+'" placeholder="محرر کا نام" dir="auto" style="flex:1;"><button id="vmb-fw" type="button" onclick="voiceType(\'cf-fir-writer\',\'vmb-fw\')" style="width:34px;height:34px;flex-shrink:0;border:1px solid var(--border);border-radius:5px;background:var(--bg-tertiary);font-size:14px;cursor:pointer;">🎙️</button></div></div>'
    + '</div>'
    + '<div class="form-row">'
    + '<div class="form-group"><label class="form-label">پوزیشن</label>'
    + '<select class="form-input" id="cf-position">'+posOpts+'</select></div>'
    + '</div>'
    + '</div>'

    + '</div>';

  return html;
}

function buildCrossFields(c) {
  c = c || {};
  var cfn = c.cross_fir_number || '';
  var cfd = c.cross_fir_date || '';
  var cc = c.cross_complainant || '';
  var ccc = c.cross_complainant_cnic || '';
  var ccl = c.cross_complainant_cell || '';
  var ccp = c.cross_complainant_profession || '';
  var cs = c.cross_section_of_law || '';
  var co = c.cross_offence_type || '';
  var cfw = c.cross_fir_writer || '';
  return '<div style="font-size:10px;color:var(--red);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">&#x2694;&#xFE0F; Cross FIR Details</div>'
    + '<div class="form-row">'
    + '<div class="form-group"><label class="form-label">Cross FIR Number</label>'
    + '<input class="form-input" id="cf-cross-fir" value="'+cfn+'" placeholder="e.g. 246/2025" dir="auto"></div>'
    + '<div class="form-group"><label class="form-label">Cross FIR Date</label>'
    + '<input class="form-input" id="cf-cross-fir-date" value="'+cfd+'" placeholder="DD-MM-YYYY" oninput="autoFormatDate(this)"></div>'
    + '</div>'
    + '<div class="form-row">'
    + '<div class="form-group"><label class="form-label">Cross Complainant Name</label>'
    + '<input class="form-input" id="cf-cross-complainant" value="'+cc+'" placeholder="&#x0645;&#x062F;&#x0639;&#x06CC; &#x06A9;&#x0627; &#x0646;&#x0627;&#x0645;" dir="auto"></div>'
    + '<div class="form-group"><label class="form-label">CNIC</label>'
    + '<input class="form-input" id="cf-cross-complainant-cnic" value="'+ccc+'" placeholder="XXXXX-XXXXXXX-X" oninput="autoFormatCNIC(this)"></div>'
    + '</div>'
    + '<div class="form-row">'
    + '<div class="form-group"><label class="form-label">Cell Number</label>'
    + '<input class="form-input" id="cf-cross-complainant-cell" value="'+ccl+'" placeholder="0XXX-XXXXXXX" oninput="autoFormatCell(this)"></div>'
    + '<div class="form-group"><label class="form-label">Profession</label>'
    + '<input class="form-input" id="cf-cross-complainant-profession" value="'+ccp+'" placeholder="&#x067E;&#x06CC;&#x0634;&#x06C1; / Profession" dir="auto"></div>'
    + '</div>'
    + '<div class="form-row">'
    + '<div class="form-group"><label class="form-label">Cross Sections of Law</label>'
    + '<input class="form-input" id="cf-cross-section" value="'+cs+'" placeholder="e.g. 302 PPC + 34 PPC" dir="auto"></div>'
    + '<div class="form-group"><label class="form-label">Cross Offence Type</label>'
    + '<input class="form-input" id="cf-cross-offence" value="'+co+'" placeholder="Cross offence" dir="auto"></div>'
    + '</div>'
    + '<div class="form-group"><label class="form-label">Cross FIR Writer</label>'
    + '<input class="form-input" id="cf-cross-fir-writer" value="'+cfw+'" placeholder="FIR &#x0644;&#x06A9;&#x06BE;&#x0646;&#x06D2; &#x0648;&#x0627;&#x0644;&#x0627;" dir="auto"></div>'
    + '</div>'
    + '<div style="padding:8px 10px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-sm);font-size:11px;color:var(--red);">'
    + '&#x26A0;&#xFE0F; Cross Version cases are linked to the original FIR. Both cases will appear in the case workspace under the same folder.'
    + '</div>';
}

function toggleCrossVersion() {
  const cb = document.getElementById('cf-cross-version');
  const fields = document.getElementById('cross-version-fields');
  if (!cb || !fields) return;
  cb.checked = !cb.checked;
  fields.style.display = cb.checked ? 'block' : 'none';
}

function renderDocChecklist(docs, selected) {
  let html = '';
  for (const [cat, items] of Object.entries(MISAL_CHECKLIST)) {
    const filtered = docs.filter(d => items.includes(d));
    if (!filtered.length) continue;
    html += `<div style="font-size:9px;color:var(--text-faint);letter-spacing:2px;text-transform:uppercase;padding:6px 0 4px;">${cat}</div>`;
    filtered.forEach(doc => {
      const checked = selected.includes(doc);
      html += `<div style="display:flex;align-items:center;gap:8px;padding:5px 6px;border-radius:4px;cursor:pointer;transition:background 0.1s;" onmouseenter="this.style.background='var(--hover-bg)'" onmouseleave="this.style.background=''" onclick="toggleDoc('${doc.replace(/'/g,"\\'")}',this)">
        <input type="checkbox" ${checked?'checked':''} style="accent-color:var(--accent);width:14px;height:14px;pointer-events:none;">
        <span style="font-size:12px;color:${checked?'var(--accent)':'var(--text-secondary)'};">${doc}</span>
      </div>`;
    });
  }
  // Custom documents
  const customDocs = selected.filter(d => !ALL_MISAL_DOCS.includes(d));
  if (customDocs.length) {
    html += `<div style="font-size:9px;color:var(--text-faint);letter-spacing:2px;text-transform:uppercase;padding:6px 0 4px;">Custom Documents</div>`;
    customDocs.forEach(doc => {
      html += `<div style="display:flex;align-items:center;gap:8px;padding:5px 6px;border-radius:4px;cursor:pointer;" onclick="toggleDoc('${doc.replace(/'/g,"\\'")}',this)">
        <input type="checkbox" checked style="accent-color:var(--accent);width:14px;height:14px;pointer-events:none;">
        <span style="font-size:12px;color:var(--accent);">${doc}</span>
        <span onclick="event.stopPropagation();removeCustomDoc('${doc.replace(/'/g,"\\'")}');" style="margin-inline-start:auto;color:var(--red);font-size:12px;cursor:pointer;">×</span>
      </div>`;
    });
  }
  return html;
}

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

function filterDocChecklist(query) {
  const docs = query ? ALL_MISAL_DOCS.filter(d => d.toLowerCase().includes(query.toLowerCase())) : ALL_MISAL_DOCS;
  const el = document.getElementById('doc-checklist');
  if (el) el.innerHTML = renderDocChecklist(docs, selectedDocuments);
}

function addCustomDoc() {
  const inp = document.getElementById('custom-doc-input');
  const val = inp?.value.trim();
  if (!val) { showToast('⚠️ Enter document name.','error'); return; }
  if (selectedDocuments.includes(val)) { showToast('⚠️ Already added.','error'); return; }
  selectedDocuments.push(val);
  inp.value = '';
  const el = document.getElementById('doc-checklist');
  if (el) el.innerHTML = renderDocChecklist(ALL_MISAL_DOCS, selectedDocuments);
  showToast('✅ Added: ' + val, 'success', 1500);
}

function removeCustomDoc(doc) {
  selectedDocuments = selectedDocuments.filter(d => d !== doc);
  const el = document.getElementById('doc-checklist');
  if (el) el.innerHTML = renderDocChecklist(ALL_MISAL_DOCS, selectedDocuments);
}

function sectionTag(sectionStr) {
  return `<div style="display:inline-flex;align-items:center;gap:6px;background:var(--nav-active);border:1px solid var(--accent);border-radius:20px;padding:4px 10px;font-size:11px;color:var(--accent);">
    <b>${sectionStr}</b>
    <span onclick="removeSection('${sectionStr}')" style="cursor:pointer;color:var(--text-muted);font-size:14px;line-height:1;" title="Remove">×</span>
  </div>`;
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
    showToast('⚠️ Section already added.', 'error'); return;
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
  showToast(`✅ Added: ${sectionStr}`, 'success', 1500);
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
function _toggleMobileFields() {
  const item = document.getElementById('cf-theft-item')?.value;
  const show = item === 'mobile';
  ['cf-mobile-imei-wrap','cf-mobile-brand-wrap','cf-mobile-cell-wrap'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? 'block' : 'none';
  });
}

// IMEI brand/model lookup from TAC (first 8 digits = Type Allocation Code)
function _imeiLookup(input) {
  // Keep only digits, max 15
  let v = (input.value || '').replace(/\D/g, '').slice(0, 15);
  input.value = v;
  const brandField = document.getElementById('cf-mobile-brand');
  if (!brandField) return;
  if (v.length < 8) return;
  const tac = v.slice(0, 8);
  // Common TAC prefixes → brand (partial DB; officer can edit)
  const TAC_BRANDS = {
    '35':'(عام GSM)','01':'Apple iPhone','35332':'Apple','35326':'Apple',
    '86':'Xiaomi / Redmi','86891':'Xiaomi','86553':'Oppo','86742':'Vivo',
    '35846':'Samsung','35649':'Samsung','35878':'Samsung','35291':'Nokia',
    '35395':'Huawei','86095':'Huawei','86227':'Tecno','86303':'Infinix',
    '86997':'Realme','35775':'OnePlus','86452':'itel',
  };
  // Try longest prefix match
  let brand = '';
  for (let len = 6; len >= 2; len--) {
    const pre = v.slice(0, len);
    if (TAC_BRANDS[pre]) { brand = TAC_BRANDS[pre]; break; }
  }
  // Only auto-fill if field empty or was auto-filled before (don't overwrite manual entry)
  if (brand && (!brandField.value || brandField.dataset.auto === '1')) {
    brandField.value = brand;
    brandField.dataset.auto = '1';
  }
  // If user types manually, stop auto
  brandField.oninput = () => { brandField.dataset.auto = '0'; };
}

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
function openAddCaseModal(){openModal('',caseFormHTML(),`<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">منسوخ</button><button class="btn btn-primary" onclick="saveNewCase()">💾 اندراج محفوظ کریں</button>`);}
async function openEditCaseModal(id){const c=await getCase(id);if(!c)return;openModal(`✏️ ترمیم — مقدمہ ${c.fir_number}`,caseFormHTML(c),`<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">منسوخ</button><button class="btn btn-primary" onclick="saveEditCase('${id}')">💾 تبدیلیاں محفوظ کریں</button>`);}
async function saveNewCase(){
  // Check case limit
  if (typeof checkCaseLimit==='function') {
    const allowed = await checkCaseLimit();
    if (!allowed) return;
  }
  var fir=document.getElementById('cf-fir')?.value.trim()||'';
  var section=document.getElementById('cf-section')?.value.trim()||'';
  // Fallback: if user typed a section but didn't pick from dropdown, use the typed text
  if(!section){
    var typedSec=document.getElementById('cf-section-search')?.value.trim()||'';
    if(typedSec){ section=typedSec; var _sh=document.getElementById('cf-section'); if(_sh)_sh.value=typedSec; }
  }
  var complainant=document.getElementById('cf-complainant')?.value.trim()||'';
  if(!fir){showToast('⚠️ مقدمہ نمبر درج کریں','error');document.getElementById('cf-fir')?.focus();return;}
  if(!section){showToast('⚠️ دفعہ قانون درج کریں','error');document.getElementById('cf-section-search')?.focus();return;}
  if(!complainant){showToast('⚠️ مدعی کا نام درج کریں','error');document.getElementById('cf-complainant')?.focus();return;}
  try{
    await addCase({
      fir_number:fir,
      fir_date:document.getElementById('cf-date').value.trim(),
      occurrence_date:document.getElementById('cf-occurrence-date')?.value.trim()||'',
      complainant:complainant,
      complainant_cnic:document.getElementById('cf-complainant-cnic')?.value.trim()||'',
      complainant_cell:document.getElementById('cf-complainant-cell')?.value.trim()||'',
      complainant_profession:document.getElementById('cf-complainant-profession')?.value.trim()||'',
      fir_writer:document.getElementById('cf-fir-writer')?.value.trim()||'',
      complaint_sender:document.getElementById('cf-complaint-sender')?.value.trim()||'',
      section_of_law:section,
      theft_item:document.getElementById('cf-theft-item')?.value||null,
      theft_imei:document.getElementById('cf-mobile-imei')?.value?.trim()||null,
      theft_brand:document.getElementById('cf-mobile-brand')?.value?.trim()||null,
      theft_cell:document.getElementById('cf-mobile-cell')?.value?.trim()||null,
      offence_type:document.getElementById('cf-offence')?.value?.trim()||'',
      sho:document.getElementById('cf-sho')?.value.trim()||'',
      sdpo:document.getElementById('cf-sdpo')?.value.trim()||'',
      status:document.getElementById('cf-status').value,
      priority:document.getElementById('cf-priority')?.value||null,
      mulzman_type:document.getElementById('cf-mulzman-type')?.value||'namaloom',
      position:document.getElementById('cf-position').value,
      notes:document.getElementById('cf-notes')?.value.trim()||'',
      documents_checklist:selectedDocuments?.length>0?selectedDocuments:[],
      is_cross_version:document.getElementById('cf-cross-version')?.checked||false,
      cross_fir_number:document.getElementById('cf-cross-fir')?.value.trim()||null,
      cross_fir_date:document.getElementById('cf-cross-fir-date')?.value.trim()||null,
      cross_complainant:document.getElementById('cf-cross-complainant')?.value.trim()||null,
      cross_complainant_cnic:document.getElementById('cf-cross-complainant-cnic')?.value.trim()||null,
      cross_complainant_cell:document.getElementById('cf-cross-complainant-cell')?.value.trim()||null,
      cross_complainant_profession:document.getElementById('cf-cross-complainant-profession')?.value.trim()||null,
      cross_section_of_law:document.getElementById('cf-cross-section')?.value.trim()||null,
      cross_offence_type:document.getElementById('cf-cross-offence')?.value.trim()||null,
      cross_fir_writer:document.getElementById('cf-cross-fir-writer')?.value.trim()||null,
      case_station:  currentOfficer?.station  || null,
      case_district: currentOfficer?.district || null,
    });
    // Auto reminders
    const firDate = document.getElementById('cf-date').value.trim();
    const mulzmanType = document.getElementById('cf-mulzman-type')?.value||'namaloom';
    await _createAutoReminders(fir, firDate, mulzmanType, complainant);
    closeModal();showToast('✅ مقدمہ درج ہو گیا: FIR '+fir,'success');await updateBadges();renderCases(document.getElementById('page-content'));
  }catch(err){showToast('Error: '+err.message,'error');}
}

// ── DOCUMENTS CHECKLIST ────────────────────────────────────────
const _DOCS_LIST = [
  'ایف آئی آر','کراس ورشن','رپورٹ 173 ض ف','جائے واردات',
  'نامزد ملزمان','گواہان FIR','گواہان کراس ورشن','بیانات 161 ض ف',
  'وقوعہ جات','فردات','ضمنیات','میمورنڈم','فارم گرفتاری',
  'انکشافات','درخواستیں','بریف مقدمہ','شہادتیں','انسدادی کاروائی',
  'وارنٹ','اشتہار','پراگریس رپورٹ','فارم مفروری','CDR/IMEI',
  'ہمراہی ملازمان','انڈیکس نقل مسل',
];

async function _openDocsChecklist(caseId, firNum) {
  // Load existing checklist
  let checked = {};
  try {
    const { data } = await supabaseClient.from('cases').select('docs_checklist').eq('id',caseId).single();
    checked = data?.docs_checklist || {};
  } catch(_) {}

  const html = `<div style="direction:rtl;">
    <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">FIR ${firNum} — مکمل ہونے والی دستاویزات چیک کریں</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
      ${_DOCS_LIST.map(d => `
        <label style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg-secondary);border-radius:6px;cursor:pointer;border:1px solid ${checked[d]?'var(--green)':'var(--border)'};">
          <input type="checkbox" value="${d}" ${checked[d]?'checked':''} onchange="_updateDocCheck('${caseId}',this)"
            style="width:16px;height:16px;accent-color:var(--green);">
          <span style="font-size:13px;font-family:'Jameel Noori Nastaleeq',serif;">${d}</span>
        </label>`).join('')}
    </div>
    <div style="margin-top:12px;padding:10px;background:var(--bg-secondary);border-radius:8px;font-size:12px;color:var(--text-muted);">
      مکمل: <b id="docs-done-count">${Object.values(checked).filter(Boolean).length}</b> / ${_DOCS_LIST.length}
    </div>
  </div>`;

  openModal(`📋 دستاویزات کی فہرست — FIR ${firNum}`, html,
    `<button class="btn btn-primary" onclick="closeModal()">✅ محفوظ</button>`
  );
}

async function _updateDocCheck(caseId, checkbox) {
  const doc = checkbox.value;
  const val = checkbox.checked;
  const label = checkbox.closest('label');
  if (label) label.style.borderColor = val ? 'var(--green)' : 'var(--border)';

  // Update count
  const allChecked = document.querySelectorAll('input[type=checkbox]:checked').length;
  const countEl = document.getElementById('docs-done-count');
  if (countEl) countEl.textContent = allChecked;

  try {
    // Get current checklist
    const { data } = await supabaseClient.from('cases').select('docs_checklist').eq('id',caseId).single();
    const current = data?.docs_checklist || {};
    current[doc] = val;
    await supabaseClient.from('cases').update({ docs_checklist: current }).eq('id', caseId);
  } catch(e) { console.warn('docs checklist:', e.message); }
}

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
      text: `📋 رپورٹ 173 ض ف — مقدمہ FIR ${firNum} (${complainant}) — ابتدائی رپورٹ مرتب کریں`,
      reminder_date: addDays(firDate, 10),
      is_done: false,
    });

    // 15-day: untrace warning (only namaloom)
    if (mulzmanType === 'namaloom') {
      await supabaseClient.from('reminders').insert({
        officer_id: oid,
        text: `⚠️ عدم پتہ ہونے والا مقدمہ — FIR ${firNum} (${complainant}) — ملزمان نامعلوم، 15 دن مکمل`,
        reminder_date: addDays(firDate, 15),
        is_done: false,
      });
    }
    showToast('🔔 خودکار یاددہانیاں بن گئیں','info');
  } catch(e) { console.warn('auto reminder:', e.message); }
}
async function saveEditCase(id){
  // Resolve section: use selected, else typed search value
  var _editSection=document.getElementById('cf-section').value.trim();
  if(!_editSection){
    var _typed=document.getElementById('cf-section-search')?.value.trim()||'';
    if(_typed) _editSection=_typed;
  }
  try{
    await updateCase(id,{
      fir_number:document.getElementById('cf-fir').value.trim(),
      fir_date:document.getElementById('cf-date').value.trim(),
      occurrence_date:document.getElementById('cf-occurrence-date')?.value.trim()||'',
      complainant:document.getElementById('cf-complainant').value.trim(),
      complainant_cnic:document.getElementById('cf-complainant-cnic')?.value.trim()||'',
      complainant_cell:document.getElementById('cf-complainant-cell')?.value.trim()||'',
      complainant_profession:document.getElementById('cf-complainant-profession')?.value.trim()||'',
      fir_writer:document.getElementById('cf-fir-writer')?.value.trim()||'',
      complaint_sender:document.getElementById('cf-complaint-sender')?.value.trim()||'',
      section_of_law:_editSection,
      theft_item:document.getElementById('cf-theft-item')?.value||null,
      theft_imei:document.getElementById('cf-mobile-imei')?.value?.trim()||null,
      theft_brand:document.getElementById('cf-mobile-brand')?.value?.trim()||null,
      theft_cell:document.getElementById('cf-mobile-cell')?.value?.trim()||null,
      offence_type:document.getElementById('cf-offence')?.value?.trim()||'',
      sho:document.getElementById('cf-sho')?.value.trim()||'',
      sdpo:document.getElementById('cf-sdpo')?.value.trim()||'',
      status:document.getElementById('cf-status').value,
      priority:document.getElementById('cf-priority')?.value||null,
      mulzman_type:document.getElementById('cf-mulzman-type')?.value||'namaloom',
      position:document.getElementById('cf-position').value,
      notes:document.getElementById('cf-notes')?.value.trim()||'',
      documents_checklist:selectedDocuments.length>0?selectedDocuments:[],
      is_cross_version:document.getElementById('cf-cross-version')?.checked||false,
      cross_fir_number:document.getElementById('cf-cross-fir')?.value.trim()||null,
      cross_fir_date:document.getElementById('cf-cross-fir-date')?.value.trim()||null,
      cross_complainant:document.getElementById('cf-cross-complainant')?.value.trim()||null,
      cross_complainant_cnic:document.getElementById('cf-cross-complainant-cnic')?.value.trim()||null,
      cross_complainant_cell:document.getElementById('cf-cross-complainant-cell')?.value.trim()||null,
      cross_complainant_profession:document.getElementById('cf-cross-complainant-profession')?.value.trim()||null,
      cross_section_of_law:document.getElementById('cf-cross-section')?.value.trim()||null,
      cross_offence_type:document.getElementById('cf-cross-offence')?.value.trim()||null,
      cross_fir_writer:document.getElementById('cf-cross-fir-writer')?.value.trim()||null,
    });
    closeModal();
    showToast('✅ Case updated!','success');
    // Wait briefly so DB write propagates through cases_decrypted view before re-fetching
    await new Promise(r=>setTimeout(r,300));
    await updateBadges();
    await renderCases(document.getElementById('page-content'));
  }catch(err){showToast('❌ Error: '+err.message,'error');}
}
// viewCase now opens workspace
function viewCase(id) { openCaseWorkspace(id); }

// ── CASE WORKSPACE (FIR document editor) ──
// ════════════════════════════════════════════
//  CASE WORKSPACE
// ════════════════════════════════════════════
let currentCaseId = null;
let currentDocIndex = null;
const docDrafts = {}; // stores edited content per case+doc

// ── RELATED CASES LINKING ─────────────────────────────────────
async function _loadRelatedCases(c) {
  const bar = document.getElementById('related-cases-bar');
  if (!bar || !c) return;
  try {
    const allCases = await getCases();
    const cName = (c.complainant || '').toLowerCase().trim();
    const cCnic = (c.complainant_cnic || '').replace(/\D/g, '');
    const cCell = (c.complainant_cell || '').replace(/\D/g, '');
    const cSection = (c.section_of_law || '').toLowerCase().trim();
    const cStation = (c.case_station || '').toLowerCase().trim();

    // Build a relation reason for each matched case
    const related = [];
    allCases.forEach(x => {
      if (x.id === c.id) return;
      const xName = (x.complainant || '').toLowerCase().trim();
      const xCnic = (x.complainant_cnic || '').replace(/\D/g, '');
      const xCell = (x.complainant_cell || '').replace(/\D/g, '');
      const xSection = (x.section_of_law || '').toLowerCase().trim();
      const xStation = (x.case_station || '').toLowerCase().trim();

      let reason = '';
      if (cName && xName && cName === xName) reason = 'اسی مدعی';
      else if (cCnic && cCnic.length >= 10 && cCnic === xCnic) reason = 'اسی شناختی کارڈ';
      else if (cCell && cCell.length >= 10 && cCell === xCell) reason = 'اسی فون';
      else if (cSection && xSection && cSection === xSection) reason = 'اسی دفعہ';

      if (reason) related.push({ ...x, _reason: reason });
    });

    if (!related.length) {
      bar.innerHTML = '';
      return;
    }

    bar.innerHTML = `
    <div style="background:rgba(167,139,250,0.08);border-bottom:1px solid var(--border);padding:10px 16px;direction:rtl;">
      <div style="font-size:12px;font-weight:700;color:#a78bfa;margin-bottom:8px;">🔗 متعلقہ مقدمات — ${related.length}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${related.map(r => `
          <button onclick="openCaseWorkspace('${r.id}')"
            style="background:var(--bg-card);border:1px solid #a78bfa;border-radius:8px;padding:6px 12px;font-size:11px;cursor:pointer;color:var(--text-secondary);display:flex;align-items:center;gap:6px;">
            <span style="color:#a78bfa;font-weight:700;">FIR ${r.fir_number || '—'}</span>
            <span style="font-size:9px;color:var(--text-muted);">(${r._reason})</span>
            <span class="pill ${STATUS_CLASSES[r.status] || 'pill-blue'}" style="font-size:8px;">${STATUS_LABELS[r.status] || r.status || ''}</span>
          </button>`).join('')}
      </div>
    </div>`;
  } catch(_) {
    bar.innerHTML = '';
  }
}

// ── PROSECUTION-READY VALIDATOR (Traffic Light) ───────────────
// ── INTERIM 173 CrPC (auto after 10 days) ─────────────────────
function _daysSinceReg(c) {
  const d = c.fir_date || c.created_at;
  if (!d) return 0;
  const reg = new Date(d);
  if (isNaN(reg)) return 0;
  return Math.floor((Date.now() - reg.getTime()) / (1000*60*60*24));
}

function _interim173Alert(c) {
  const days = _daysSinceReg(c);
  // Only show if 10+ days passed AND case not yet completed/challaned
  const doneStatuses = ['complete','incomplete','challan512','cancel'];
  if (days < 10 || doneStatuses.includes(c.status)) return '';
  return `
  <div style="background:rgba(245,158,11,0.1);border:1px solid var(--amber);border-radius:10px;padding:12px 14px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;direction:rtl;">
    <div style="font-size:20px;">⏰</div>
    <div style="flex:1;min-width:200px;">
      <div style="font-size:13px;font-weight:700;color:var(--amber);">عبوری چالان 173 ض ف درکار</div>
      <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">اس مقدمے کو ${days} دن ہو چکے ہیں — عبوری رپورٹ تیار کریں</div>
    </div>
    <button class="btn btn-primary btn-sm" onclick='_generateInterim173(${JSON.stringify({id:c.id,fir_number:c.fir_number,section_of_law:c.section_of_law,complainant:c.complainant,fir_date:c.fir_date,case_station:c.case_station,case_district:c.case_district}).replace(/'/g,"&#39;")})'>📄 عبوری 173 تیار کریں</button>
  </div>`;
}

function _generateInterim173(c) {
  const o = currentOfficer || {};
  const days = _daysSinceReg(c);
  const today = formatDate(new Date().toISOString());
  const html = `
  <div style="font-family:'Jameel Noori Nastaleeq',serif;direction:rtl;padding:30px;line-height:2.2;font-size:15px;color:#000;">
    <div style="text-align:center;font-weight:800;font-size:18px;margin-bottom:4px;">تھانہ ${c.case_station||o.station||'_____'} ضلع ${c.case_district||o.district||'_____'}</div>
    <div style="text-align:center;font-size:16px;font-weight:700;border-bottom:2px solid #000;display:inline-block;margin:0 auto 16px;padding-bottom:2px;width:100%;">عبوری رپورٹ زیر دفعہ 173 ضابطہ فوجداری</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
      <tr><td style="border:1px solid #555;padding:6px 10px;font-weight:700;background:#f0f0f0;">مقدمہ نمبر</td><td style="border:1px solid #555;padding:6px 10px;">${c.fir_number||'—'}</td>
          <td style="border:1px solid #555;padding:6px 10px;font-weight:700;background:#f0f0f0;">دفعات</td><td style="border:1px solid #555;padding:6px 10px;">${c.section_of_law||'—'}</td></tr>
      <tr><td style="border:1px solid #555;padding:6px 10px;font-weight:700;background:#f0f0f0;">مدعی</td><td style="border:1px solid #555;padding:6px 10px;">${c.complainant||'—'}</td>
          <td style="border:1px solid #555;padding:6px 10px;font-weight:700;background:#f0f0f0;">تاریخ اندراج</td><td style="border:1px solid #555;padding:6px 10px;">${formatDate(c.fir_date)}</td></tr>
    </table>
    <div style="margin:12px 0;">
      جناب عالی،<br><br>
      گزارش ہے کہ مقدمہ ہذا کو درج ہوئے ${days} دن گزر چکے ہیں۔ تفتیش تاحال جاری ہے۔ مندرجہ ذیل وجوہات کی بنا پر چالان مکمل نہیں ہو سکا:
    </div>
    <div style="min-height:120px;border:1px solid #ccc;padding:12px;border-radius:4px;" contenteditable="true">۱۔ ...<br>۲۔ ...</div>
    <div style="margin-top:14px;">لہٰذا عبوری رپورٹ بغرض ملاحظہ پیش خدمت ہے۔ تفتیش مکمل ہونے پر حتمی چالان پیش کر دیا جائے گا۔</div>
    <div style="margin-top:40px;text-align:left;">
      <div>_______________________</div>
      <div style="font-size:13px;font-weight:700;">${o.designation||''} ${o.full_name||''}</div>
      <div style="font-size:12px;">تفتیشی افسر — تھانہ ${c.case_station||o.station||''}</div>
      <div style="font-size:12px;">تاریخ: ${today}</div>
    </div>
  </div>`;
  if (typeof dioPrint === 'function') dioPrint(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><style>@page{margin:15mm}body{margin:0}</style></head><body>${html}</body></html>`);
  showToast('📄 عبوری 173 رپورٹ تیار — پرنٹ کریں یا محفوظ کریں', 'success', 4000);
}

function _prosecutionValidator(c) {
  // Checklist of court-required items
  const checks = [
    { ok: !!c.fir_number,        label: 'FIR نمبر' },
    { ok: !!c.section_of_law,    label: 'دفعات قانون' },
    { ok: !!c.complainant,       label: 'مدعی کا نام' },
    { ok: !!(c.complainant_cnic),label: 'مدعی شناختی کارڈ' },
    { ok: !!c.fir_date,          label: 'تاریخ اندراج' },
    { ok: c.mulzman_type==='maloom' ? !!c.accused_name || true : true, label: 'ملزمان کی تفصیل' },
  ];

  const missing = checks.filter(x => !x.ok);
  const allGood = missing.length === 0;

  // Special reminder: if challan complete, remind about conviction/saza slip
  const sazaReminder = c.status === 'complete';

  return `
  <div style="background:${allGood ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'};border-bottom:1px solid var(--border);padding:10px 16px;direction:rtl;">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <div style="font-size:18px;">${allGood ? '🟢' : '🔴'}</div>
      <div style="flex:1;min-width:200px;">
        <div style="font-size:12px;font-weight:700;color:${allGood ? 'var(--green)' : 'var(--red)'};">
          ${allGood ? 'مقدمہ عدالت کے لیے تیار ہے' : `نامکمل — ${missing.length} چیزیں درکار ہیں`}
        </div>
        ${!allGood ? `<div style="font-size:11px;color:var(--text-muted);margin-top:3px;">کمی: ${missing.map(m=>m.label).join('، ')}</div>` : ''}
      </div>
      <button class="btn btn-secondary btn-sm" onclick='_suggest161Questions(${JSON.stringify({id:c.id,section_of_law:c.section_of_law}).replace(/'/g,"&#39;")})' style="flex-shrink:0;">🤖 161 سوالات</button>
    </div>
    ${sazaReminder ? `<div style="margin-top:8px;padding:7px 10px;background:rgba(245,158,11,0.12);border-radius:6px;font-size:11px;color:var(--amber);font-weight:600;">⚖️ یاد دہانی: چالان مکمل ہو چکا — سزا/رہائی کی سلپ (Conviction Slip) درج کرنا نہ بھولیں</div>` : ''}
  </div>`;
}

// ── CASE STATUS PIPELINE (visual progress) ────────────────────
function _caseStatusPipeline(c) {
  // Status pipeline removed per user request
  return '';
}
function _caseStatusPipeline_OLD(c) {
  // Police case flow stages
  const stages = [
    { key:'registered', label:'اندراج',      icon:'📝' },
    { key:'under',      label:'زیر تفتیش',    icon:'🔍' },
    { key:'challan',    label:'چالان',        icon:'📋' },
    { key:'court',      label:'عدالت',         icon:'⚖️' },
    { key:'closed',     label:'فیصلہ',         icon:'✅' },
  ];

  // Map current case status to a stage index
  let activeIdx = 0;
  const s = c.status;
  if (s === 'under') activeIdx = 1;
  else if (s === 'incomplete' || s === 'challan512') activeIdx = 2;
  else if (s === 'complete') activeIdx = 3;
  else if (s === 'cancel' || s === 'untrace') activeIdx = 4;
  else activeIdx = 0;

  return `
  <div style="background:var(--bg-secondary);border-bottom:1px solid var(--border);padding:12px 16px;">
    <div style="display:flex;align-items:center;justify-content:space-between;direction:rtl;max-width:700px;margin:0 auto;">
      ${stages.map((st,i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        const color = done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--border)';
        const txtColor = done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--text-muted)';
        return `
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;position:relative;">
          ${i < stages.length-1 ? `<div style="position:absolute;top:14px;right:-50%;width:100%;height:2px;background:${i < activeIdx ? 'var(--green)' : 'var(--border)'};z-index:0;"></div>` : ''}
          <div style="width:30px;height:30px;border-radius:50%;background:${done||active?color:'var(--bg-card)'};border:2px solid ${color};display:flex;align-items:center;justify-content:center;font-size:13px;z-index:1;position:relative;color:${done||active?'#fff':'var(--text-muted)'};">
            ${done ? '✓' : st.icon}
          </div>
          <div style="font-size:10px;font-weight:${active?'800':'600'};color:${txtColor};font-family:'Jameel Noori Nastaleeq',serif;white-space:nowrap;">${st.label}</div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

// ── SMART 161 QUESTION SUGGESTIONS (B4) ───────────────────────
const _Q161 = {
  theft:   { // چوری / 379, 380, 457
    sections: ['379','380','381','382','457','458','380'],
    title: 'چوری',
    questions: [
      'واردات کس تاریخ اور وقت پیش آئی؟',
      'چوری شدہ مال کی تفصیل اور مالیت کیا ہے؟',
      'کیا گھر/دکان کے تالے توڑے گئے یا چابی استعمال ہوئی؟',
      'واردات کے وقت آپ کہاں تھے؟',
      'کیا کسی پر شک ہے؟ اگر ہاں تو کیوں؟',
      'کیا کوئی عینی گواہ موجود ہے؟',
      'کیا CCTV کیمرہ موجود تھا؟',
      'چوری شدہ موبائل کا IMEI/نمبر کیا ہے؟',
    ],
  },
  robbery: { // ڈکیتی / 392, 394, 395, 396
    sections: ['392','393','394','395','396','397'],
    title: 'ڈکیتی / رہزنی',
    questions: [
      'ڈاکوؤں کی تعداد کتنی تھی؟',
      'کیا اسلحہ استعمال ہوا؟ کس قسم کا؟',
      'لُوٹا گیا مال/رقم کی تفصیل کیا ہے؟',
      'ملزمان کا حلیہ بیان کریں (قد، رنگ، عمر، لباس)۔',
      'کیا ملزمان کوئی سواری استعمال کر رہے تھے؟ نمبر؟',
      'واردات کہاں اور کس وقت ہوئی؟',
      'کیا کوئی زخمی ہوا؟',
      'کیا ملزمان کو دوبارہ پہچان سکتے ہیں؟',
    ],
  },
  snatching: { // چھینا / موبائل snatching
    sections: ['392','356','379'],
    title: 'موبائل/مال چھیننا',
    questions: [
      'چھینا گیا موبائل کس کمپنی کا تھا؟ IMEI نمبر؟',
      'موبائل میں کونسی سم تھی؟ نمبر؟',
      'چھیننے والے کتنے افراد تھے؟',
      'کیا موٹرسائیکل استعمال ہوئی؟ نمبر پلیٹ؟',
      'واردات کا مقام اور وقت؟',
      'ملزمان کا حلیہ کیا تھا؟',
    ],
  },
  murder:  { // قتل / 302
    sections: ['302','311','316','319','322','324'],
    title: 'قتل',
    questions: [
      'مقتول سے آپ کا کیا رشتہ ہے؟',
      'واقعہ کہاں اور کس وقت پیش آیا؟',
      'قتل کا سبب/پس منظر کیا ہے (رنجش، جائیداد، وغیرہ)؟',
      'کیا ملزم کو جانتے ہیں؟ نام اور پتہ؟',
      'قتل میں کونسا ہتھیار استعمال ہوا؟',
      'کیا کوئی عینی شاہد موجود ہے؟',
      'لاش کہاں ملی اور کس حالت میں؟',
      'کیا پہلے کوئی دھمکی دی گئی تھی؟',
    ],
  },
  hurt:    { // زخمی / 337, 334
    sections: ['337','334','336','335','333','324'],
    title: 'زخمی / مارپیٹ',
    questions: [
      'جھگڑے کی وجہ کیا تھی؟',
      'کس نے پہلے حملہ کیا؟',
      'کونسا ہتھیار/چیز استعمال ہوئی؟',
      'زخم جسم کے کس حصے پر آئے؟',
      'کیا میڈیکل کرایا گیا؟',
      'موقع پر کون کون موجود تھا؟',
    ],
  },
  fraud:   { // دھوکہ / 420, 406, 489-F
    sections: ['419','420','406','468','471','489'],
    title: 'دھوکہ / فراڈ',
    questions: [
      'دھوکہ کس طریقے سے ہوا؟',
      'کتنی رقم کا نقصان ہوا؟',
      'کیا کوئی تحریری معاہدہ/چیک موجود ہے؟',
      'ملزم سے آپ کا تعارف کیسے ہوا؟',
      'لین دین کی تاریخیں اور تفصیل؟',
      'کیا کوئی گواہ موجود ہے؟',
    ],
  },
};

function _suggest161Questions(c) {
  const sections = (c.section_of_law || '').replace(/\s/g, '');
  // Find matching crime type by section
  let matched = null;
  for (const [key, val] of Object.entries(_Q161)) {
    if (val.sections.some(s => sections.includes(s))) { matched = val; break; }
  }

  openModal('🤖 تجویز کردہ سوالات — بیان 161', `
    <div style="direction:rtl;">
      ${matched ? `
        <div style="font-size:13px;color:var(--accent);font-weight:700;margin-bottom:10px;">
          📋 ${matched.title} — متعلقہ سوالات (دفعات: ${c.section_of_law})
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${matched.questions.map((q,i)=>`
            <div style="background:var(--bg-secondary);border-radius:8px;padding:10px;font-size:13px;display:flex;gap:8px;">
              <span style="color:var(--accent);font-weight:700;flex-shrink:0;">${i+1}.</span>
              <span>${q}</span>
            </div>`).join('')}
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:10px;">یہ صرف تجاویز ہیں — تفتیش کے مطابق سوالات کریں</div>
      ` : `
        <div style="text-align:center;padding:20px;color:var(--text-muted);">
          <div style="font-size:40px;margin-bottom:10px;">🤔</div>
          <div style="font-size:13px;">اس دفعہ (${c.section_of_law||'—'}) کے لیے مخصوص سوالات دستیاب نہیں۔</div>
          <div style="font-size:11px;margin-top:8px;">عام سوالات: واقعہ کہاں ہوا؟ کب ہوا؟ کون ملوث ہے؟ گواہ کون ہیں؟</div>
        </div>
      `}
    </div>
  `, `<button class="btn btn-secondary" onclick="closeModal()">بند کریں</button>`);
}

async function openCaseWorkspace(id) {
  closeMobileSidebar();
  window._inWorkspace = true;  // Prevent background refresh from redirecting back to list
  document.body.classList.add('workspace-mode');  // Hide topbar for more space
  currentCaseId = id;
  _currentWorkspaceCaseId = id;
  currentDocIndex = null;
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = '📁 Case Workspace';
  const container = document.getElementById('page-content');
  container.innerHTML = `<div class="loading-screen"><div class="loading-spinner"></div><div class="loading-text">Opening Case Workspace...</div></div>`;
  try {
    const c = await getCase(id);
    if (!c) { 
      container.innerHTML = `<div style="padding:30px;text-align:center;direction:rtl;"><div style="font-size:40px;">⚠️</div><div style="margin-top:10px;">مقدمہ نہیں ملا</div><button class="btn btn-secondary btn-sm" style="margin-top:14px;" onclick="showPage('cases',null)">← واپس مقدمات</button></div>`;
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
      <div style="font-size:40px;">⚠️</div>
      <div style="margin-top:10px;color:var(--text-secondary);">مقدمہ کھولنے میں مسئلہ</div>
      <div style="font-size:11px;color:var(--text-muted);direction:ltr;font-family:monospace;margin-top:8px;">${(err&&err.message)||err}</div>
      <button class="btn btn-secondary btn-sm" style="margin-top:14px;" onclick="showPage('cases',null)">← واپس مقدمات</button>
    </div>`;
  }
}

// P4: Case progress tracker — FIR -> arrest -> challan -> faisla
function _renderProgressBar(c) {
  const status = c.status || 'under';
  const firDone = !!(c.fir_number);
  let arrestDone = false;
  try {
    const acc = JSON.parse(localStorage.getItem('dio_accused_'+c.id)||'[]');
    arrestDone = Array.isArray(acc) && acc.some(a => a.arrest_date);
  } catch(_) {}
  const challanDone = ['complete','incomplete','challan512'].includes(status);
  const challanActive = !challanDone && (status === 'under');
  const faislaDone = false;
  const icon = (done, active) => done ? '✅' : (active ? '⏳' : '⬜');
  const step = (label, done, active) => `
    <div style="display:flex;align-items:center;gap:4px;${active?'font-weight:800;color:var(--accent);':'color:var(--text-muted);'}">
      <span>${icon(done, active)}</span><span>${label}</span>
    </div>`;
  const arrow = '<span style="color:var(--text-faint);">&#8592;</span>';
  return `
    <div style="display:flex;flex-direction:row-reverse;align-items:center;gap:10px;padding:7px 16px;background:var(--bg-tertiary);border-bottom:1px solid var(--border);font-size:13px;direction:rtl;flex-wrap:wrap;font-family:'Jameel Noori Nastaleeq',serif;">
      ${step('FIR درج', firDone, false)} ${arrow}
      ${step('ملزم گرفتار', arrestDone, false)} ${arrow}
      ${step('چالان', challanDone, challanActive)} ${arrow}
      ${step('فیصلہ', faislaDone, false)}
    </div>`;
}

function renderWorkspace(c, docs, ev, container) {
  const statusColor = {under:'var(--accent)',complete:'var(--green)',incomplete:'var(--amber)',untrace:'var(--purple)',cancel:'var(--red)',challan512:'#f97316'}[c.status]||'var(--accent)';
  const o = currentOfficer||{};
  container.style.padding = '0';
  container.style.overflow = 'hidden';
  container.innerHTML = `
    <!-- TOP BAR: back RIGHT + case info + action buttons -->
    <div style="padding:8px 14px;background:var(--bg-secondary);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;flex-wrap:wrap;direction:rtl;">
      <!-- Case info -->
      <div style="display:flex;align-items:center;gap:8px;flex:1;flex-wrap:wrap;">
        <span style="font-size:15px;font-weight:900;color:var(--accent);font-family:var(--font-mono);">FIR ${c.fir_number||'—'}</span>
        <span class="pill ${STATUS_CLASSES[c.status]||'pill-blue'}">${STATUS_LABELS[c.status]||c.status}</span>
        <span style="font-size:11px;color:var(--text-muted);">📅 ${formatDate(c.fir_date)}</span>
        <span style="font-size:11px;color:var(--text-muted);">👤 ${c.complainant||'—'}</span>
        <span style="font-size:11px;color:var(--text-muted);">⚖️ ${(c.section_of_law||'—').slice(0,20)}</span>
      </div>
      <!-- Action buttons -->
      <div style="display:flex;gap:5px;direction:rtl;">
        <button class="btn btn-secondary btn-sm" onclick="_openDocsChecklist('${c.id}','${c.fir_number||''}')">📋</button>
        <button class="btn btn-secondary btn-sm" onclick="openEditCaseModal('${c.id}')">✏️</button>
        <button class="btn btn-secondary btn-sm" onclick="downloadCaseFile('${c.id}')">⬇️</button>
        <button class="btn btn-secondary btn-sm" onclick="openShareModal('${c.id}')" title="متن شیئر">📤</button>
        <button class="btn btn-secondary btn-sm" onclick="openCaseShareModal('${c.id}')" title="افسر کے ساتھ شیئر">🔗</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDeleteCase('${c.id}','${c.fir_number||''}')">🗑️</button>
        <button onclick="goBackToCases()" style="background:var(--accent);color:#fff;border:none;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Jameel Noori Nastaleeq',serif;">↩</button>
      </div>
    </div>

    <!-- CASE PROGRESS TRACKER (P4) -->
    ${_renderProgressBar(c)}

    <!-- MISAL DOCUMENT BAR (directly after topbar — nothing in between) -->
    ${renderMisalBar(c)}

    <!-- TAB CONTENT -->
    <div id="workspace-tab-content" style="height:calc(100vh - 220px);overflow:hidden;">
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-muted);">
        <div style="font-size:48px;margin-bottom:12px;">📂</div>
        <div style="font-size:14px;font-weight:600;margin-bottom:6px;font-family:'Jameel Noori Nastaleeq',serif;direction:rtl;">دستاویز منتخب کریں</div>
        <div style="font-size:12px;">اوپر دستاویز کے نام پر کلک کریں</div>
      </div>
    </div>`;

  // Store for tab switching
  window._workspaceCase = c;
  window._workspaceDocs = docs;
  window._workspaceEv = ev;
}

function switchWorkspaceTab(tab) {
  document.querySelectorAll('.case-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + tab)?.classList.add('active');
  const content = document.getElementById('workspace-tab-content');
  const c = window._workspaceCase;
  const ev = window._workspaceEv;
  if (tab === 'evidence') content.innerHTML = renderEvidenceTab(c, ev);
}

function renderDocsTab(c, docs) {
  return `<div class="workspace-layout" style="display:block;">
    <!-- Document Editor (full width — no side document list) -->
    <div class="workspace-main" id="workspace-editor-area" style="width:100%;">
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-muted);">
        <div style="font-size:48px;margin-bottom:12px;">📂</div>
        <div style="font-size:14px;font-weight:600;margin-bottom:6px;font-family:'Jameel Noori Nastaleeq',serif;direction:rtl;">دستاویز منتخب کریں</div>
        <div style="font-size:12px;direction:rtl;">اوپر دستاویز کے نام پر کلک کریں</div>
      </div>
    </div>
  </div>`;
}

function printAllMisalDocs() { showToast('🖨️ Print all coming soon.', 'info'); }

function filterWorkspaceDocs(q) {
  const docs = window._workspaceDocs || [];
  const list = document.getElementById('workspace-doc-list');
  if (!list) return;
  const filtered = q ? docs.filter(d => d.toLowerCase().includes(q.toLowerCase())) : docs;
  list.innerHTML = filtered.map((doc, i) => {
    const origIndex = docs.indexOf(doc);
    return `<div class="doc-card" id="doc-card-${origIndex}" onclick="openDocEditor(${origIndex})">
      <div class="doc-card-icon">📄</div>
      <div class="doc-card-name">${doc}</div>
      <div class="doc-card-status ${docDrafts[currentCaseId+'_'+origIndex]?'doc-status-draft':'doc-status-empty'}">${docDrafts[currentCaseId+'_'+origIndex]?'Draft':'Empty'}</div>
    </div>`;
  }).join('');
}

function openDocEditor(docIndex) {
  currentDocIndex = docIndex;
  const c = window._workspaceCase;
  const docs = window._workspaceDocs;
  const docName = docs[docIndex];
  const draftKey = currentCaseId + '_' + docIndex;
  const savedContent = docDrafts[draftKey] || null;

  // Update sidebar active state
  document.querySelectorAll('.doc-card').forEach(el => el.classList.remove('active'));
  const activeCard = document.getElementById('doc-card-' + docIndex);
  if (activeCard) activeCard.classList.add('active');

  const editor = document.getElementById('workspace-editor-area');
  if (!editor) return;

  // Build auto-filled template
  const template = buildDocTemplate(docName, c, savedContent);

  editor.innerHTML = `
    <!-- Toolbar -->
    <div class="template-toolbar">
      <span style="font-size:13px;font-weight:700;color:var(--accent);flex:1;">📄 ${docName}</span>
      <select id="font-family-sel" onchange="changeFont(this.value)" style="background:var(--bg-card);border:1px solid var(--border);border-radius:4px;padding:4px 8px;color:var(--text-secondary);font-size:11px;">
        <option value="jameel" selected>Jameel Noori Nastaleeq</option>
        <option value="noto">Noto Nastaliq Urdu</option>
        <option value="times">Times New Roman</option>
        <option value="arial">Arial</option>
      </select>
      <select id="font-size-sel" onchange="changeFontSize(this.value)" style="background:var(--bg-card);border:1px solid var(--border);border-radius:4px;padding:4px 8px;color:var(--text-secondary);font-size:11px;">
        <option value="12">12px</option>
        <option value="14" selected>14px</option>
        <option value="16">16px</option>
        <option value="18">18px</option>
        <option value="20">20px</option>
        <option value="22">22px</option>
      </select>
      <button class="btn btn-secondary btn-sm" onclick="toggleDirection()">⇄ LTR/RTL</button>
      <button class="btn btn-secondary btn-sm" onclick="saveDocDraft(${docIndex})">💾 Save Draft</button>
      <button class="btn btn-secondary btn-sm" onclick="printThisDoc('${docName}')">🖨️ Print</button>
      ${OFFICIAL_TEMPLATES[docName]?`<button class="btn btn-primary btn-sm" onclick="generateOfficialDoc('${docName}')" title="Download in exact government format with case data auto-filled">📥 Official .docx</button>`:''}
      <button class="btn btn-primary btn-sm" onclick="markDocDone(${docIndex})">✅ Mark Complete</button>
    </div>
    <!-- Editor -->
    <div style="padding:24px;background:var(--bg-tertiary);min-height:calc(100% - 50px);">
      <div id="doc-template-editor" class="template-editor" contenteditable="true" dir="rtl" spellcheck="false" style="font-size:14px;min-height:600px;">
        ${template}
      </div>
    </div>`;
}

function buildDocTemplate(docName, c, savedContent) {
  if (savedContent) return savedContent;

  // Auto-fill values
  const fir = c.fir_number || '____________';
  const firDate = c.fir_date || '____________';
  const occurrence = c.occurrence_date || '____________';
  const complainant = c.complainant || '____________';
  const compCnic = c.complainant_cnic || '____________';
  const compCell = c.complainant_cell || '____________';
  const compProfession = c.complainant_profession || '____________';
  const section = c.section_of_law || '____________';
  const offence = c.offence_type || '____________';
  const sho = c.sho || '____________';
  const sdpo = c.sdpo || '____________';
  const firWriter = c.fir_writer || '____________';
  const station = currentOfficer?.station || '____________';
  const district = currentOfficer?.district || '____________';
  const io = currentOfficer?.full_name || '____________';
  const year = new Date().getFullYear();

  const field = (val) => `<span class="template-field" contenteditable="true">${val}</span>`;

  // Generic template — specific templates will be added when sample files are provided
  const ts = 'border:1px solid #333;padding:6px 8px;';
  const th = 'border:1px solid #333;padding:6px 8px;background:#f0f0f0;font-weight:700;text-align:center;';
  const td = 'border:1px solid #333;padding:6px 8px;';
  const tdr = 'border:1px solid #333;padding:6px 8px;text-align:right;';
  const wrap = 'font-family:\'Jameel Noori Nastaleeq\',\'Noto Nastaliq Urdu\',serif;direction:rtl;font-size:14px;line-height:2;color:#000;';
  const etd = (v) => `<td style="${td}"><span class="template-field" contenteditable="true">${v}</span></td>`;
  const etdr = (v) => `<td style="${tdr}"><span class="template-field" contenteditable="true">${v}</span></td>`;
  const ef = (v) => `<span class="template-field" contenteditable="true">${v}</span>`;

  const templates = {

    // ══════════════════════════════════════════════
    //  1. CDR FORM
    // ══════════════════════════════════════════════
    'CDR Form': `<div style="${wrap}">
      <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
        <tr>
          <td style="${td}width:33%;font-weight:700;">تھانہ ${ef(station)}</td>
          <td style="${td}text-align:center;">ڈائری نمبر ${ef('۔۔۔۔۔۔')} مورخہ ${ef('۔۔۔۔۔۔')}</td>
          <td style="${td}width:33%;text-align:left;font-weight:700;">ضلع ${ef(district)}</td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
        <tr>
          <td style="${td}" colspan="3">مقدمہ نمبر ${ef(fir)} مورخہ ${ef(firDate)} بجرم ${ef(section)} ت پ تھانہ ${ef(station)} ${ef(district)}</td>
        </tr>
        <tr>
          <td style="${td}width:50%;">تاریخ/وقت وقوعہ: ${ef(occurrence)}</td>
          <td style="${td}">مقام وقوعہ: ${ef('۔۔۔۔۔۔۔۔۔۔۔۔')}</td>
        </tr>
        <tr>
          <td style="${td}">تفتیشی افسر: ${ef(io)}</td>
          <td style="${td}">موبائل نمبر: ${ef('۔۔۔۔۔۔۔۔۔۔۔')}</td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:13px;">
        <tr>
          <td style="${th}width:8%;">نمبرشمار</td>
          <td style="${th}width:28%;">مطلوبہ درکار CDR/IMEI</td>
          <td style="${th}width:22%;">ماڈل فون (اگر معلوم ہو)</td>
          <td style="${th}width:21%;">ڈیٹا کی ابتدائی تاریخ</td>
          <td style="${th}width:21%;">ڈیٹا کی آخری تاریخ</td>
        </tr>
        ${[1,2,3,4,5,6,7,8,9].map(n=>`<tr>
          <td style="${td}text-align:center;">${n}</td>
          <td style="${td}height:28px;"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
        </tr>`).join('')}
        <tr>
          <td style="${th}">ٹوٹل تعداد</td>
          <td style="${th}">تعداد سم نمبرز</td>
          <td style="${th}">موبائل سیٹ نمبرز</td>
          <td style="${th}">سم لوکیشن: YES</td>
          <td style="${th}">سم ملکیت: YES</td>
        </tr>
        <tr>
          <td style="${td}" colspan="3"></td>
          <td style="${td}" colspan="2" class="template-field" contenteditable="true">اس کیلئے یہی فارم علیحدہ سے بمعہ FIR لف کریں</td>
        </tr>
        <tr>
          <td style="${td}font-weight:700;" colspan="5">دستخط درخواست کنندہ/تفتیشی آفیسر معہ تاریخ: ${ef(io)}</td>
        </tr>
      </table>
      <div style="margin-top:10px;font-size:12px;line-height:2;">
        <div style="font-weight:700;">نوٹ:</div>
        <div>1۔ موبائل فون کال ڈیٹا ریکارڈ صرف FIR یا FIR سے متعلقہ ہونے کی صورت میں فراہم کیا جائے گا یا ایسی انکوائریز جنکا حکم نامہ ہائی کورٹ اور سپریم کورٹ نے دیا ہوں۔</div>
        <div>2۔ اگر CDR's/IMEI's کا اندراج FIR میں نہ ہو تو ضمنی میں اندراج کریں۔</div>
        <div>3۔ ضمنی نمبر ${ef('۔۔۔۔۔')} تاریخ ${ef('۔۔۔۔۔')} مرتبہ ${ef('۔۔۔۔۔')} (کاپی ضمنی ہمراہ بھجوائیں یا فارم ہذا کی پشت پر اقتباس ضمنی تحریر کریں)</div>
        <div>4۔ CDR کے غلط استعمال کی صورت میں ذمہ دار افسر کے خلاف سخت محکمانہ کاروائی کی جائیگی۔</div>
        <div>5۔ CDR کے ذریعے کیس ٹریس ہونے/ملزمان/اشتہاری پکڑے جانے پر/ریکوری ہونے پر IT آفس (موبائل ٹریکنگ سیل ملتان) کو بھی رپورٹ ارسال کی جائے۔</div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <tr>
          <td style="${td}width:50%;text-align:center;padding:20px 8px 8px;">
            <div>Forwarded Please</div>
            <div style="font-weight:700;">SHO تھانہ ${ef(station)}</div>
          </td>
          <td style="${td}text-align:center;padding:20px 8px 8px;">
            <div>Forwarded</div>
            <div style="font-weight:700;">سرکل DSP/SDPO ${ef(sdpo)}</div>
          </td>
        </tr>
      </table>
    </div>`,

    // ══════════════════════════════════════════════
    //  2. CRO FORM
    // ══════════════════════════════════════════════
    'CRO Form': `<div style="${wrap}">
      <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
        <tr>
          <td style="padding:4px 8px;text-align:left;font-size:12px;">طرف الف</td>
          <td style="padding:4px 8px;text-align:center;font-size:16px;font-weight:900;">سٹینڈرڈائیزڈ کریمینل انڈکس کارڈ</td>
          <td style="padding:4px 8px;font-size:12px;">CRO نمبر ${ef('۔۔۔۔۔')}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:2px 8px;text-align:center;font-size:13px;">(برائے جیل)</td>
          <td style="padding:2px 8px;font-size:12px;">فوٹو گراف تاریخ ${ef('۔۔۔۔۔')}</td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="${td}width:12%;">ساتھ مل</td>
          <td style="${td}width:15%;">ساتھ پیہ<br><small>یاں پیاں کریں</small></td>
          <td style="${td}width:18%;">ماں رشتہ پیہ<br><small>یاں پیاں کریں</small></td>
          <td style="${td}width:18%;">ماں رشتہ پیہ<br><small>یاں پیاں کریں</small></td>
          <td rowspan="2" style="${td}width:20%;text-align:center;vertical-align:middle;">
            <div style="border:1px dashed #999;height:90px;width:70px;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:11px;">تصویر</div>
          </td>
          <td rowspan="2" style="${td}width:17%;text-align:center;vertical-align:middle;">
            <div style="border:1px dashed #999;height:90px;width:70px;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:11px;">تصویر</div>
          </td>
        </tr>
        <tr>
          <td style="${td}height:50px;"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
        </tr>
      </table>
      <div style="margin:6px 0;font-size:12px;border:1px solid #333;padding:4px 8px;">متعلقہ رانی پولیس اسٹیشن ${ef(station)}</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr>
          <td style="${th}width:10%;">نام</td>
          <td style="${td}width:25%;">${ef('۔۔۔۔۔۔۔۔۔۔')}</td>
          <td style="${th}width:8%;">عرف</td>
          <td style="${td}width:20%;">${ef('۔۔۔۔۔')}</td>
          <td style="${th}width:10%;">والد/شوہر کا نام</td>
          <td style="${td}">${ef('۔۔۔۔۔۔۔۔۔۔')}</td>
        </tr>
        <tr>
          <td style="${th}">جنس</td>
          <td style="${td}">${ef('مرد / عورت')}</td>
          <td style="${th}">ذریعہ آمدن</td>
          <td style="${td}">${ef('۔۔۔۔۔')}</td>
          <td style="${th}">تعلیم</td>
          <td style="${td}">${ef('۔۔۔۔۔')}</td>
        </tr>
        <tr>
          <td style="${th}">زبان</td>
          <td style="${td}">${ef('اردو')}</td>
          <td style="${th}">ذریعہ معاش</td>
          <td style="${td}">${ef('۔۔۔۔۔')}</td>
          <td style="${th}">قومیت</td>
          <td style="${td}">${ef('پاکستانی')}</td>
        </tr>
        <tr>
          <td style="${th}">تاریخ پیدائش</td>
          <td style="${td}">${ef('۔۔۔۔۔')}</td>
          <td style="${th}">مقام پیدائش</td>
          <td style="${td}">${ef('۔۔۔۔۔')}</td>
          <td style="${th}">عمر (سال)</td>
          <td style="${td}">${ef('۔۔۔')}</td>
        </tr>
        <tr>
          <td style="${th}">مستقل پتہ</td>
          <td style="${td}" colspan="5">${ef('۔۔۔۔۔۔۔۔۔۔۔۔۔۔۔۔۔۔۔۔')}</td>
        </tr>
        <tr>
          <td style="${th}">شناختی کارڈ نمبر</td>
          <td style="${td}">${ef('۔۔۔۔۔')}</td>
          <td style="${th}">والد/شوہر کا نام عرف</td>
          <td style="${td}" colspan="3">${ef('۔۔۔۔۔۔۔۔')}</td>
        </tr>
      </table>
      <div style="font-weight:700;margin:6px 0;border-bottom:1px solid #333;padding-bottom:2px;font-size:13px;">قومیت / Nationality</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr>
          <td style="${th}">مر صورت/مقدمہ</td>
          <td style="${td}">${ef(offence||'قتل')}</td>
          <td style="${th}">تھ</td>
          <td style="${td}">${ef(station)}</td>
        </tr>
        <tr>
          <td style="${th}">FIR نمبر بذریعہ</td>
          <td style="${td}">${ef(fir)}</td>
          <td style="${th}">مورخہ</td>
          <td style="${td}">${ef(firDate)}</td>
        </tr>
        <tr>
          <td style="${th}">دفعات</td>
          <td style="${td}" colspan="3">${ef(section)}</td>
        </tr>
        <tr>
          <td style="${th}">بال (رنگ)</td>
          <td style="${td}">${ef('۔۔۔')}</td>
          <td style="${th}">بال (سائز)</td>
          <td style="${td}">${ef('۔۔۔')}</td>
        </tr>
        <tr>
          <td style="${th}">داڑھی (رنگت)</td>
          <td style="${td}">${ef('۔۔۔')}</td>
          <td style="${th}">داڑھی (سائز)</td>
          <td style="${td}">${ef('۔۔۔')}</td>
        </tr>
        <tr>
          <td style="${th}">رنگ چہرہ</td>
          <td style="${td}">${ef('گورا/سانولا/کالا')}</td>
          <td style="${th}">کان</td>
          <td style="${td}">${ef('۔۔۔')}</td>
        </tr>
        <tr>
          <td style="${th}">آ نکھیں (رنگت)</td>
          <td style="${td}">${ef('۔۔۔')}</td>
          <td style="${th}">ناک</td>
          <td style="${td}">${ef('۔۔۔')}</td>
        </tr>
      </table>
      <div style="font-weight:700;margin:8px 0 4px;font-size:13px;">نشانات انگشت جمع کرانے ہونے پر سادہ و قلع قلع:</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr>
          <td style="${th}text-align:center;">دائیں چھوٹی</td>
          <td style="${th}text-align:center;">دائیں انگوٹھی</td>
          <td style="${th}text-align:center;">دائیں درمیانی</td>
          <td style="${th}text-align:center;">دائیں شہادت</td>
          <td style="${th}text-align:center;">دائیں انگوٹھا</td>
        </tr>
        <tr>
          <td style="${td}height:70px;"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
        </tr>
        <tr>
          <td style="${th}text-align:center;">بائیں چھوٹی</td>
          <td style="${th}text-align:center;">بائیں انگوٹھی</td>
          <td style="${th}text-align:center;">بائیں درمیانی</td>
          <td style="${th}text-align:center;">بائیں شہادت</td>
          <td style="${th}text-align:center;">بائیں انگوٹھا</td>
        </tr>
        <tr>
          <td style="${td}height:70px;"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
        </tr>
        <tr>
          <td style="${th}text-align:center;" colspan="2">بائیں جاراناتیاں یک وقتی</td>
          <td style="${td}" colspan="3"></td>
        </tr>
        <tr>
          <td style="${th}text-align:center;" colspan="2">دائیں جاراناتیاں یک وقتی</td>
          <td style="${td}" colspan="3"></td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <tr>
          <td style="${td}text-align:center;padding:30px 8px 8px;">
            <div style="border-top:1px solid #333;padding-top:4px;">نام و عہدہ<br>${ef(station)}</div>
          </td>
          <td style="${td}text-align:center;padding:30px 8px 8px;">
            <div style="border-top:1px solid #333;padding-top:4px;">تفتیشی افسر ${ef(io)}</div>
          </td>
          <td style="${td}font-size:12px;">تیارکنندہ کا نام و عہدہ ${ef(io)}</td>
        </tr>
      </table>
    </div>`,

    // ══════════════════════════════════════════════
    //  3. ZIMNI ANDROONI
    // ══════════════════════════════════════════════
    'Zimni Androoni': `<div style="${wrap}">
      <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
        <tr>
          <td style="padding:2px 8px;font-size:12px;">پولیس فارم نمبر 25—54(1)</td>
          <td style="padding:2px 8px;text-align:center;font-size:16px;font-weight:900;">اندرونی ضمنی</td>
          <td style="padding:2px 8px;text-align:left;"></td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
        <tr>
          <td style="${td}width:50%;font-weight:700;font-size:15px;">رپورٹ ضمنی</td>
          <td style="${td}">ضلع ${ef(district)}</td>
          <td style="${td}">تھانہ ${ef(station)}</td>
        </tr>
        <tr>
          <td style="${td}">سال ${ef(new Date().getFullYear().toString())}</td>
          <td style="${td}">ضمنی نمبر ${ef('۔۔۔۔۔')}</td>
          <td style="${td}"></td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-top:4px;">
        <tr>
          <td style="${td}width:25%;">مقدمہ نمبر ${ef(fir)}</td>
          <td style="${td}width:25%;">مورخہ ${ef(firDate)}</td>
          <td style="${td}width:25%;">تھانہ میں پہنچنے کا وقت و تاریخ</td>
          <td style="${td}width:25%;">${ef('۔۔۔۔۔۔۔')}</td>
        </tr>
        <tr>
          <td style="${td}">تاریخ و مقام وقوعہ ${ef(occurrence)}</td>
          <td style="${td}"></td>
          <td style="${td}">تھانہ سے روانگی کا وقت و تاریخ</td>
          <td style="${td}">${ef('۔۔۔۔۔۔۔')}</td>
        </tr>
        <tr>
          <td style="${td}">بحد ${ef('۔۔۔۔۔')}</td>
          <td style="${td}">جرم ${ef(section)}</td>
          <td style="${td}" colspan="2"></td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;">
        <tr>
          <td style="${th}width:20%;text-align:center;">تاریخ و وقت کارروائی</td>
          <td style="${th}width:15%;text-align:center;">رپورٹ نمبر شمار سلسلہ وار</td>
          <td style="${th}text-align:center;">حالات تفتیش</td>
          <td style="${th}width:15%;text-align:center;">از</td>
        </tr>
        ${[1,2,3,4,5].map(n=>`<tr>
          <td style="${td}height:70px;vertical-align:top;">${ef('۔۔۔۔۔')}</td>
          <td style="${td}vertical-align:top;text-align:center;">${n}</td>
          <td style="${td}vertical-align:top;">
            <div>سرکار بذریعہ ${ef(station)} بنام ${ef(complainant)}</div>
            <div class="template-field" contenteditable="true" style="min-height:50px;display:block;"></div>
          </td>
          <td style="${td}vertical-align:top;">${ef(io)}</td>
        </tr>`).join('')}
      </table>
      <table style="width:100%;border-collapse:collapse;margin-top:20px;">
        <tr>
          <td style="${td}text-align:center;padding:40px 8px 8px;">
            <div style="border-top:1px solid #333;padding-top:4px;">SHO ${ef(sho)}<br>تھانہ ${ef(station)}</div>
          </td>
          <td style="${td}text-align:center;padding:40px 8px 8px;">
            <div style="border-top:1px solid #333;padding-top:4px;">تفتیشی افسر<br>${ef(io)}</div>
          </td>
        </tr>
      </table>
    </div>`,

    // ══════════════════════════════════════════════
    //  4. ZIMNI BEROONI
    // ══════════════════════════════════════════════
    'Zimni Berooni': `<div style="${wrap}">
      <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
        <tr>
          <td style="padding:2px 8px;font-size:12px;">پولیس فارم نمبر 25—54(1)</td>
          <td style="padding:2px 8px;text-align:center;font-size:16px;font-weight:900;">بیرونی ضمنی</td>
          <td style="padding:2px 8px;text-align:left;"></td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
        <tr>
          <td style="${td}width:50%;font-weight:700;font-size:15px;">رپورٹ ضمنی</td>
          <td style="${td}">ضلع ${ef(district)}</td>
          <td style="${td}">تھانہ ${ef(station)}</td>
        </tr>
        <tr>
          <td style="${td}">سال ${ef(new Date().getFullYear().toString())}</td>
          <td style="${td}">ضمنی نمبر ${ef('۔۔۔۔۔')}</td>
          <td style="${td}"></td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-top:4px;">
        <tr>
          <td style="${td}width:25%;">مقدمہ نمبر ${ef(fir)}</td>
          <td style="${td}width:25%;">مورخہ ${ef(firDate)}</td>
          <td style="${td}width:25%;">تھانہ میں پہنچنے کا وقت و تاریخ</td>
          <td style="${td}width:25%;">${ef('۔۔۔۔۔۔۔')}</td>
        </tr>
        <tr>
          <td style="${td}">تاریخ و مقام وقوعہ ${ef(occurrence)}</td>
          <td style="${td}"></td>
          <td style="${td}">تھانہ سے روانگی کا وقت و تاریخ</td>
          <td style="${td}">${ef('۔۔۔۔۔۔۔')}</td>
        </tr>
        <tr>
          <td style="${td}">بحد ${ef('۔۔۔۔۔')}</td>
          <td style="${td}">جرم ${ef(section)}</td>
          <td style="${td}" colspan="2"></td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;">
        <tr>
          <td style="${th}width:20%;text-align:center;">تاریخ و وقت کارروائی</td>
          <td style="${th}width:15%;text-align:center;">رپورٹ نمبر شمار سلسلہ وار</td>
          <td style="${th}text-align:center;">حالات تفتیش</td>
          <td style="${th}width:15%;text-align:center;">از</td>
        </tr>
        ${[1,2,3,4,5,6].map(n=>`<tr>
          <td style="${td}height:70px;vertical-align:top;">${ef('۔۔۔۔۔')}</td>
          <td style="${td}vertical-align:top;text-align:center;">${n}</td>
          <td style="${td}vertical-align:top;">
            <div>سرکار بذریعہ ${ef(station)} بنام ${ef(complainant)}</div>
            <div class="template-field" contenteditable="true" style="min-height:50px;display:block;"></div>
          </td>
          <td style="${td}vertical-align:top;">${ef(io)}</td>
        </tr>`).join('')}
      </table>
      <table style="width:100%;border-collapse:collapse;margin-top:20px;">
        <tr>
          <td style="${td}text-align:center;padding:40px 8px 8px;">
            <div style="border-top:1px solid #333;padding-top:4px;">SHO ${ef(sho)}<br>تھانہ ${ef(station)}</div>
          </td>
          <td style="${td}text-align:center;padding:40px 8px 8px;">
            <div style="border-top:1px solid #333;padding-top:4px;">تفتیشی افسر<br>${ef(io)}</div>
          </td>
        </tr>
      </table>
    </div>`,

    // ══════════════════════════════════════════════
    //  5. INVESTIGATION BILLS
    // ══════════════════════════════════════════════
    'Investigation Bills': `<div style="${wrap}">
      <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
        <tr>
          <td style="padding:4px 8px;font-weight:700;font-size:14px;">تھانہ ${ef(station)}</td>
          <td style="padding:4px 8px;text-align:left;font-weight:700;font-size:14px;">ضلع ${ef(district)}</td>
        </tr>
      </table>
      <div style="text-align:center;font-size:16px;font-weight:900;border-top:2px solid #333;border-bottom:2px solid #333;padding:6px 0;margin:6px 0;">
        بل بابت تفتیش مقدمات و خرچ خوراک ملزمان بند حوالات
      </div>
      <div style="text-align:center;margin-bottom:10px;font-size:14px;">
        بابت ماہ ${ef('۔۔۔۔۔۔۔۔')} سال ${ef(new Date().getFullYear().toString())} ء
      </div>
      <div style="font-weight:700;margin-bottom:6px;">جناب عالیٰ!</div>
      <div style="margin-bottom:10px;text-align:justify;line-height:2.2;">
        گذارش ہے کہ بل بابت تفتیش مقدمات و خرچ خوراک ملزمان بند حوالات جائز طور پر مرتب کیا گیا ہے۔ یہ بل نہ پہلے مرتب ہوا اور نہ ہی برآمد ہوا ہے۔ بل منظور فرماتے ہوئے برآمد کئے جانے کا حکم صادر فرمایا جائے۔
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
        <tr>
          <td style="${td}width:50%;">رپورٹ محرر: ${ef('۔۔۔۔۔۔۔۔۔۔')}</td>
          <td style="${td}">مرتب کنندہ: ${ef(io)}</td>
        </tr>
      </table>
      <div style="font-size:13px;font-weight:700;margin:8px 0 4px;">
        بل بابت تفتیش مقدمات بمعہ تفصیل خوراک ملزمان بند حوالات، پوسٹمارٹم، اسٹیشنری و دیگر اخراجات جو کہ مقدمات کے خرچہ سے متعلق ہیں
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <tr>
          <td style="${th}width:5%;">نمبرشمار</td>
          <td style="${th}width:14%;">تفصیل مقدمات</td>
          <td style="${th}width:14%;">رپٹ نمبر معہ تاریخ بندی و روانگی ملزم</td>
          <td style="${th}width:10%;">معیاد حراست ملزم</td>
          <td style="${th}width:25%;">خرچہ تفتیش و تفصیل مقدمات</td>
          <td style="${th}width:8%;">کل خرچ</td>
          <td style="${th}width:8%;">فاصلہ آمد ورفت</td>
          <td style="${th}width:10%;">نام تفتیشی افسر</td>
          <td style="${th}width:11%;">نام و پتہ حوالات ملزمان</td>
          <td style="${th}width:10%;">دستخط تفتیشی افسر</td>
        </tr>
        <tr>
          <td style="${td}text-align:center;">1</td>
          <td style="${td}"><div class="template-field" contenteditable="true">${offence||fir}</div></td>
          <td style="${td}">${ef(fir + ' ' + firDate)}</td>
          <td style="${td}height:180px;vertical-align:top;"></td>
          <td style="${td}vertical-align:top;font-size:10px;line-height:1.8;">
            1۔ بل اخراجات ٹرانسپورٹ/ڈیڈ باڈی برائے پوسٹمارٹم<br>
            2۔ بل تیاری نقشہ بذریعہ نقشہ نویس<br>
            3۔ بل سرالوجسٹ بذریعہ کیمیکل ایگزامینر بذریعہ قبضہ پولیس اشیاء<br>
            4۔ بل بلیسٹک ایکسپرٹ کی واردات میں استعمال ہونے والے اسلحہ کی ترسیل<br>
            5۔ بل ٹرانسپورٹ برائے گرفتاری ملزمان (عدم دستیابی گاڑی سرکاری)<br>
            ۶۔ بل ٹرانسپورٹ برائے جسمانی ریمانڈ (عدم دستیابی گاڑی سرکاری)<br>
            ۷۔ بل ٹرانسپورٹ برائے اسلحہ<br>
            ۸۔ بل ٹرانسپورٹ برائے برآمدگی چوری شدہ/چھینی گئی گاڑی/کیس پراپرٹی<br>
            ۹۔ بل اندھا قتل نعش کا پوسٹمارٹم/اخراجات کفن دفن<br>
            ۱۰۔ بل ٹرانسپورٹ و میڈیکل برائے زخمی<br>
            ۱1۔ بل برائے فوٹو گرافی وقوعہ ڈیڈ باڈی<br>
            ۱2۔ بل برائے ویڈیو فلم غیرقانونی اجتماعات<br>
            ۱3۔ بل ٹرانسپورٹ برائے شناخت پریڈ<br>
            ۱4۔ بل اخراجات مشتبہ افراد زیرحراست<br>
            ۱5۔ بل ٹرانسپورٹ برائے معائنہ انجن/چیسز نمبر/فورنزک سائنس لیبارٹری<br>
            ۱۶۔ بل فنگرپرنٹ/فٹ مولڈز/ہینڈ رائٹنگ<br>
            ۱۷۔ بل دیگر حادثاتی اخراجات
          </td>
          <td style="${td}vertical-align:top;"></td>
          <td style="${td}vertical-align:top;"></td>
          <td style="${td}vertical-align:top;">${ef(io)}</td>
          <td style="${td}vertical-align:top;"></td>
          <td style="${td}vertical-align:top;"></td>
        </tr>
        ${[2,3].map(n=>`<tr>
          <td style="${td}text-align:center;">${n}</td>
          <td style="${td}height:60px;"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
        </tr>`).join('')}
      </table>
      <div style="font-size:12px;margin-top:8px;border:1px solid #ccc;padding:6px 8px;">
        <span style="font-weight:700;">نوٹ:</span> بل اخراجات بمطابق شیڈول DIG ویلفئیر اینڈ فنانس پنجاب لاہور بحوالہ چٹھی نمبر 6914-19/A مورخہ 10.03.2003 مرتب کرکے ارسال کریں۔
      </div>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <tr>
          <td style="${td}text-align:center;padding:40px 8px 8px;">
            <div style="border-top:1px solid #333;padding-top:4px;">رپورٹ محرر</div>
          </td>
          <td style="${td}text-align:center;padding:40px 8px 8px;">
            <div style="border-top:1px solid #333;padding-top:4px;">مرتب کنندہ ${ef(io)}</div>
          </td>
        </tr>
      </table>
    </div>`,

  };

    // Return specific template or generic
  if (templates[docName]) return templates[docName];

  // Generic bilingual template for all other documents
  return `
    <div style="text-align:center;margin-bottom:20px;direction:rtl;">
      <div style="font-size:14px;font-weight:700;">پاکستان — پنجاب پولیس</div>
      <div style="font-size:18px;font-weight:900;margin:10px 0;border-bottom:2px solid #333;padding-bottom:8px;">${docName}</div>
      <div style="font-size:12px;color:#777;">FIR نمبر: ${fir} &nbsp;|&nbsp; تاریخ: ${firDate}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;direction:rtl;margin-bottom:16px;">
      <tr><td style="width:25%;padding:8px;border:1px solid #ccc;font-weight:600;background:#f9f9f9;">FIR نمبر</td><td style="padding:8px;border:1px solid #ccc;">${field(fir)}</td><td style="width:25%;padding:8px;border:1px solid #ccc;font-weight:600;background:#f9f9f9;">تاریخ</td><td style="padding:8px;border:1px solid #ccc;">${field(firDate)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ccc;font-weight:600;background:#f9f9f9;">پولیس اسٹیشن</td><td style="padding:8px;border:1px solid #ccc;">${field(station)}</td><td style="padding:8px;border:1px solid #ccc;font-weight:600;background:#f9f9f9;">ضلع</td><td style="padding:8px;border:1px solid #ccc;">${field(district)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ccc;font-weight:600;background:#f9f9f9;">مدعی</td><td style="padding:8px;border:1px solid #ccc;">${field(complainant)}</td><td style="padding:8px;border:1px solid #ccc;font-weight:600;background:#f9f9f9;">دفعات</td><td style="padding:8px;border:1px solid #ccc;">${field(section)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ccc;font-weight:600;background:#f9f9f9;">تفتیشی افسر</td><td style="padding:8px;border:1px solid #ccc;">${field(io)}</td><td style="padding:8px;border:1px solid #ccc;font-weight:600;background:#f9f9f9;">SHO</td><td style="padding:8px;border:1px solid #ccc;">${field(sho)}</td></tr>
    </table>
    <div style="direction:rtl;margin-bottom:12px;">
      <div style="font-weight:600;margin-bottom:6px;">تفصیلات / Details:</div>
      <div class="template-field" contenteditable="true" style="min-height:200px;display:block;width:100%;border:1px dashed #aaa;padding:10px;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Times New Roman',serif;"></div>
    </div>
    <div style="direction:rtl;margin-top:30px;display:grid;grid-template-columns:1fr 1fr;gap:20px;direction:rtl;">
      <div style="text-align:center;"><div style="border-top:1px solid #333;margin-top:40px;padding-top:4px;font-size:11px;">تفتیشی افسر / Investigation Officer</div></div>
      <div style="text-align:center;"><div style="border-top:1px solid #333;margin-top:40px;padding-top:4px;font-size:11px;">SHO / Station House Officer</div></div>
    </div>`;
}

function saveDocDraft(docIndex) {
  const editor = document.getElementById('doc-template-editor');
  if (!editor) return;
  const key = currentCaseId + '_' + docIndex;
  docDrafts[key] = editor.innerHTML;
  // Update card status
  const card = document.getElementById('doc-card-' + docIndex);
  if (card) {
    const statusEl = card.querySelector('.doc-card-status');
    if (statusEl) { statusEl.textContent = 'Draft'; statusEl.className = 'doc-card-status doc-status-draft'; }
  }
  showToast('💾 Draft saved!', 'success', 1500);
}

function markDocDone(docIndex) {
  saveDocDraft(docIndex);
  const card = document.getElementById('doc-card-' + docIndex);
  if (card) {
    const statusEl = card.querySelector('.doc-card-status');
    if (statusEl) { statusEl.textContent = 'Done'; statusEl.className = 'doc-card-status doc-status-done'; }
  }
  showToast('✅ Document marked as complete!', 'success');
}

function changeFont(fontKey) {
  const editor = document.getElementById('doc-template-editor');
  if (!editor) return;
  const fonts = {
    jameel: "'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif",
    noto: "'Noto Nastaliq Urdu', serif",
    times: "'Times New Roman', serif",
    arial: "Arial, sans-serif",
  };
  editor.style.fontFamily = fonts[fontKey] || fonts.jameel;
}

function changeFontSize(size) {
  const editor = document.getElementById('doc-template-editor');
  if (editor) editor.style.fontSize = size + 'px';
}

function toggleDirection() {
  const editor = document.getElementById('doc-template-editor');
  if (!editor) return;
  editor.dir = editor.dir === 'rtl' ? 'ltr' : 'rtl';
  editor.style.textAlign = editor.dir === 'rtl' ? 'right' : 'left';
}

function printThisDoc(docName) {
  const editor = document.getElementById('doc-template-editor');
  if (!editor) return;
  printContent(`<h2>${docName}</h2>${editor.innerHTML}`, docName + ' — Digital IO');
}

function printAllDocs() {
  const docs = window._workspaceDocs || [];
  const c = window._workspaceCase;
  let html = `<h1>FIR ${c.fir_number} — All Documents</h1>`;
  docs.forEach((doc, i) => {
    const key = currentCaseId + '_' + i;
    html += `<div style="page-break-before:always;"><h2>${doc}</h2>${docDrafts[key] || '<p>Not yet filled.</p>'}</div>`;
  });
  printContent(html, `FIR ${c.fir_number} — All Documents`);
}

function renderDetailsTab(c) {
  return `<div class="case-tab-content">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;direction:rtl;margin-bottom:16px;">
      <div class="card">
        <div class="card-title">📋 FIR Information</div>
        ${[['مقدمہ نمبر',c.fir_number],['تاریخ اندراج مقدمہ',formatDate(c.fir_date)],['تاریخ وقوعہ',formatDate(c.occurrence_date)],['Section of Law',c.section_of_law||'—'],['Offence',c.offence_type||'—'],['Status',STATUS_LABELS[c.status]||c.status],['Position',c.position==='court'?'⚖️ In Court':'⏳ Pending'],['FIR Writer',c.fir_writer||'—'],['Complaint Sender',c.complaint_sender||'—'],['SHO',c.sho||'—'],['SDPO',c.sdpo||'—']].map(([k,v])=>`<div class="detail-row"><span class="detail-key">${k}</span><span class="detail-val">${v}</span></div>`).join('')}
      </div>
      <div class="card">
        <div class="card-title">👤 Complainant Details</div>
        ${[['Complainant Name',c.complainant||'—'],['CNIC',c.complainant_cnic||'—'],['Cell No.',c.complainant_cell||'—'],['Profession',c.complainant_profession||'—']].map(([k,v])=>`<div class="detail-row"><span class="detail-key">${k}</span><span class="detail-val">${v}</span></div>`).join('')}
        ${c.notes?`<div style="margin-top:12px;padding:10px;background:var(--bg-tertiary);border-radius:8px;font-size:12px;color:var(--text-secondary);direction:auto;"><b style="color:var(--accent);">تفتیشی نوٹس:</b><br>${c.notes}</div>`:''}
      </div>
    </div>
    ${c.is_cross_version ? `
    <div class="card" style="border-color:rgba(239,68,68,0.3);background:rgba(239,68,68,0.03);margin-bottom:16px;">
      <div class="card-title" style="color:var(--red);">⚔️ Cross Version — مخالف مقدمہ</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;direction:rtl;">
        ${[
          ['Cross FIR Number', c.cross_fir_number||'—'],
          ['Cross FIR Date', formatDate(c.cross_fir_date)],
          ['Cross Complainant', c.cross_complainant||'—'],
          ['Cross CNIC', c.cross_complainant_cnic||'—'],
          ['Cross Cell', c.cross_complainant_cell||'—'],
          ['Cross Profession', c.cross_complainant_profession||'—'],
          ['Cross Section', c.cross_section_of_law||'—'],
          ['Cross Offence', c.cross_offence_type||'—'],
          ['Cross FIR Writer', c.cross_fir_writer||'—'],
        ].map(([k,v])=>`<div class="detail-row"><span class="detail-key">${k}</span><span class="detail-val">${v}</span></div>`).join('')}
      </div>
    </div>` : ''}
    <div style="text-align:right;">
      <button class="btn btn-primary" onclick="openEditCaseModal('${c.id}')">✏️ Edit Case Details</button>
    </div>
  </div>`;
}

function renderEvidenceTab(c, ev) {
  const icon = t => t==='Photo'?'📷':t==='Video'?'🎥':t==='Audio'?'🎙️':'📄';
  const cards = ev.length === 0
    ? `<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text-muted);">
        <div style="font-size:40px;margin-bottom:12px;">📋</div>
        <div style="font-weight:600;margin-bottom:4px;font-family:'Jameel Noori Nastaleeq',serif;direction:rtl;">ابھی کوئی شہادت نہیں</div>
        <div style="font-size:12px;">+ شہادت شامل کریں بٹن دبائیں</div>
       </div>`
    : ev.map(e => `
      <div class="evidence-card" id="ev-${e.id}">
        <div class="evidence-thumb" onclick="openEvidenceFile('${e.id}','${(e.file_url||'').replace(/'/g,"\\'")}','${e.name.replace(/'/g,"\\'")}','${e.type}')" style="cursor:${e.file_url?'pointer':'default'};" title="${e.file_url?'Click to open file':'No file attached'}">
          ${e.file_url && e.type==='Photo'
            ? `<img src="${e.file_url}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" alt="${e.name}" onerror="this.style.display='none';this.parentElement.querySelector('.ev-fallback').style.display='flex'"><div class="ev-fallback" style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:36px;">📷</div>`
            : `<span style="font-size:36px;">${icon(e.type)}</span>`}
          ${e.file_url ? `<div style="position:absolute;bottom:4px;right:4px;background:rgba(0,0,0,0.6);border-radius:4px;padding:2px 5px;font-size:9px;color:#fff;">Open</div>` : ''}
        </div>
        <div class="evidence-info">
          <div class="evidence-name" id="ev-name-${e.id}">${e.name}</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">${e.type} · ${e.evidence_date||formatDate(e.created_at)}</div>
          ${e.notes ? `<div style="font-size:10px;color:var(--text-faint);margin-top:3px;font-style:italic;">${e.notes}</div>` : ''}
          <div style="display:flex;gap:6px;direction:rtl;margin-top:8px;">
            ${e.file_url ? `<button class="btn btn-secondary btn-sm" onclick="openEvidenceFile('${e.id}','${(e.file_url||'').replace(/'/g,"\\'")}','${e.name.replace(/'/g,"\\'")}','${e.type}')" title="Open File">📂 Open</button>` : ''}
            <button class="btn btn-secondary btn-sm" onclick="renameEvidence('${e.id}','${e.name.replace(/'/g,"\\'")}','${c.fir_number}')" title="Rename">✏️ Rename</button>
            <button class="btn btn-danger btn-sm" onclick="deleteWorkspaceEvidence('${e.id}','${c.fir_number}')" title="Delete">🗑️</button>
          </div>
        </div>
      </div>`).join('');

  return `<div class="case-tab-content">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;direction:rtl;">
      <div>
        <div style="font-size:16px;font-weight:700;font-family:'Jameel Noori Nastaleeq',serif;direction:rtl;">📋 شہادتیں — FIR ${c.fir_number}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${ev.length} فائل منسلک</div>
      </div>
      <button class="btn btn-primary" onclick="openWorkspaceEvidenceModal('${c.id}','${c.fir_number}')">+ شہادت شامل کریں</button>
    </div>
    <div class="evidence-grid">${cards}</div>
  </div>`;
}

// ── OPEN FILE ──────────────────────────────────────────────────
function openEvidenceFile(id, url, name, type) {
  if (!url) { showToast('⚠️ No file attached to this evidence item.', 'error'); return; }
  // Open file in new tab
  window.open(url, '_blank', 'noopener');
}

// ── RENAME EVIDENCE ────────────────────────────────────────────
function renameEvidence(id, currentName, firNumber) {
  openModal('✏️ Rename Evidence',
    `<div style="margin-bottom:8px;font-size:12px;color:var(--text-muted);">Enter a new name for this evidence item.</div>
     <input class="form-input" id="ev-rename-input" value="${currentName}" style="width:100%;box-sizing:border-box;" placeholder="Evidence name">`,
    `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveEvidenceRename('${id}','${firNumber}')">✏️ Rename</button>`
  );
  setTimeout(() => { const i = document.getElementById('ev-rename-input'); if(i){i.focus();i.select();} }, 100);
}

async function saveEvidenceRename(id, firNumber) {
  const newName = document.getElementById('ev-rename-input')?.value.trim();
  if (!newName) { showToast('⚠️ Name cannot be empty.', 'error'); return; }
  try {
    await supabaseClient.from('evidence').update({ name: newName }).eq('id', id);
    closeModal();
    showToast('✅ Evidence renamed.', 'success');
    // Refresh evidence tab
    const c = await getCase(_currentWorkspaceCaseId);
    const ev = await getEvidence(firNumber);
    document.getElementById('workspace-tab-content').innerHTML = renderEvidenceTab(c, ev);
  } catch(err) { showToast('❌ ' + err.message, 'error'); }
}

// ── DELETE EVIDENCE ────────────────────────────────────────────
function deleteWorkspaceEvidence(id, firNumber) {
  openModal('🗑️ Delete Evidence',
    `<p style="color:var(--text-secondary);font-size:13px;">Are you sure you want to delete this evidence item?<br><span style="color:var(--red);font-size:11px;margin-top:8px;display:block;">⚠️ This cannot be undone.</span></p>`,
    `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-danger" onclick="closeModal();doDeleteWorkspaceEvidence('${id}','${firNumber}')">🗑️ Delete</button>`
  );
}

async function doDeleteWorkspaceEvidence(id, firNumber) {
  try {
    await deleteEvidence(id);
    showToast('🗑️ Evidence deleted.', 'info');
    const c = await getCase(_currentWorkspaceCaseId);
    const ev = await getEvidence(firNumber);
    document.getElementById('workspace-tab-content').innerHTML = renderEvidenceTab(c, ev);
  } catch(err) { showToast('❌ ' + err.message, 'error'); }
}

// ── ATTACH EVIDENCE MODAL ──────────────────────────────────────
function openWorkspaceEvidenceModal(caseId, firNumber) {
  openModal('➕ Attach Evidence',
    `<div style="margin-bottom:12px;">
       <div style="display:flex;gap:8px;direction:rtl;margin-bottom:12px;">
         <button class="btn btn-secondary btn-sm" onclick="wevOpenCamera()">📸 Camera</button>
         <button class="btn btn-secondary btn-sm" onclick="wevOpenFile()">📎 Select File</button>
       </div>
       <!-- Camera preview -->
       <div id="wev-camera" style="display:none;margin-bottom:12px;">
         <video id="wev-video" style="width:100%;border-radius:8px;max-height:200px;" autoplay playsinline></video>
         <div style="display:flex;gap:8px;direction:rtl;margin-top:8px;">
           <button class="btn btn-primary btn-sm" onclick="wevSnap()">📸 Capture</button>
           <button class="btn btn-secondary btn-sm" onclick="wevStopCamera()">✕ Stop</button>
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
       <div><label class="form-label">Type</label>
         <select class="form-input" id="wev-type">
           <option>Photo</option><option>Video</option><option>Audio</option><option>Document</option>
         </select>
       </div>
     </div>
     <div style="margin-bottom:10px;"><label class="form-label">Date of Evidence</label><input class="form-input" id="wev-date" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
     <div><label class="form-label">Notes</label><textarea class="form-input" id="wev-notes" rows="2" placeholder="Description, location found, etc."></textarea></div>`,
    `<button class="btn btn-secondary" onclick="wevStopCamera();closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="wevSave('${caseId}','${firNumber}')">💾 Attach</button>`
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
  } catch(e) { showToast('⚠️ Camera not available.', 'error'); }
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
  document.getElementById('wev-file-name').textContent = '📸 Camera capture ready';
  if (!document.getElementById('wev-name').value) document.getElementById('wev-name').value = 'Photo ' + new Date().toLocaleDateString('en-GB');
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
    document.getElementById('wev-file-name').textContent = '📎 ' + f.name + ' (' + (f.size/1024).toFixed(1) + ' KB)';
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
  const name = document.getElementById('wev-name')?.value.trim();
  if (!name) { showToast('⚠️ Evidence name is required.', 'error'); return; }
  _currentWorkspaceCaseId = caseId;

  let fileUrl = null;
  const type = document.getElementById('wev-type')?.value || 'Document';
  const date = document.getElementById('wev-date')?.value || '';
  const notes = document.getElementById('wev-notes')?.value || '';

  try {
    // Upload file to Supabase Storage if a file is attached
    if (window._wevFile || window._wevDataUrl) {
      let blob, ext;
      if (window._wevDataUrl) {
        const res = await fetch(window._wevDataUrl); blob = await res.blob(); ext = 'jpg';
      } else {
        blob = window._wevFile; ext = window._wevFile.name.split('.').pop();
      }
      const path = `${currentUser?.id||'officer'}/${firNumber}/${Date.now()}_${name.replace(/\s+/g,'_')}.${ext}`;
      const { error: upErr } = await supabaseClient.storage.from('evidence').upload(path, blob, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabaseClient.storage.from('evidence').getPublicUrl(path);
      fileUrl = urlData?.publicUrl || null;
    }

    await addEvidence({ name, fir_number: firNumber, type, evidence_date: date, notes, file_url: fileUrl });
    wevStopCamera();
    closeModal();
    showToast('✅ Evidence attached: ' + name, 'success');

    // Refresh evidence tab
    const c = await getCase(caseId);
    const ev = await getEvidence(firNumber);
    const tabContent = document.getElementById('workspace-tab-content');
    if (tabContent) tabContent.innerHTML = renderEvidenceTab(c, ev);
  } catch(err) { showToast('❌ ' + err.message, 'error'); }
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
  if (titleEl) titleEl.textContent = '📁 My Cases';
  if (container) renderCases(container);
}
function confirmDeleteCase(id,fir){openModal('🗑️ Confirm Delete',`<p style="color:var(--text-secondary);font-size:13px;">Delete case <b style="color:var(--accent);">FIR ${fir}</b>?<br><br><span style="color:var(--red);font-size:11px;">⚠️ This cannot be undone.</span></p>`,`<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-danger" onclick="closeModal();doDeleteCase('${id}')">🗑️ Delete</button>`);}
async function doDeleteCase(id){
  try {
    const c = await getCase(id);
    if (c) await softDelete('case', id, c);
    await deleteCase(id);
    showToast('🗑️ مقدمہ Recycle Bin میں','info');
    await updateBadges();
    renderCases(document.getElementById('page-content'));
  } catch(err) { showToast('❌ Error: '+err.message,'error'); }
}
